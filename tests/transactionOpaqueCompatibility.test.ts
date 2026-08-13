import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import {
  TRANSACTION_OPAQUE_ENVELOPE_VERSION,
  deriveTransactionAccountBalances,
  normalizeTransactions,
  serializeTransactionCollection,
  transactionCashFlowSummary
} from '../src/lib/transactions';

const accounts = [
  { id: 'a', currency: 'TWD', isActive: true },
  { id: 'b', currency: 'TWD', isActive: true }
];

const knownTx = (id: string, overrides: Record<string, unknown> = {}) => ({
  id, accountId: 'a', type: 'income', status: 'posted', source: 'manual', amount: 1000,
  currency: 'TWD', categoryId: 'income-other', occurredAt: '2026-01-01', description: '', merchant: '', note: '', excluded: false,
  ...overrides
});

const opaqueTx = (id: string, payload: Record<string, unknown> = { future: 'fx-conversion-leg', amount: 999 }) => ({
  transactionOpaqueEnvelopeVersion: TRANSACTION_OPAQUE_ENVELOPE_VERSION, id, payload
});

// R1
test('R1 ordinary malformed transaction is skipped, never opaque-preserved', () => {
  const { transactions, opaqueTransactions, skipped } = normalizeTransactions([
    { accountId: 'a', type: 'income', amount: -5, occurredAt: '2026-01-01' } // amount <= 0 fails known validation
  ], accounts);
  assert.equal(transactions.length, 0);
  assert.equal(opaqueTransactions.length, 0, '不得被誤判成 opaque，必須真正丟棄');
  assert.equal(skipped.length, 1);
});

// R2
test('R2 explicit opaque transaction is preserved and excluded from financial calculation', () => {
  const { transactions, opaqueTransactions, skipped } = normalizeTransactions([opaqueTx('fx-1')], accounts);
  assert.equal(transactions.length, 0);
  assert.equal(opaqueTransactions.length, 1);
  assert.equal(skipped.length, 0);
  assert.deepEqual(opaqueTransactions[0], { transactionOpaqueEnvelopeVersion: 1, id: 'fx-1', payload: { future: 'fx-conversion-leg', amount: 999 } });
});

// R3
test('R3 malformed opaque envelopes are rejected with diagnostics, not preserved', () => {
  const cases: Array<[string, unknown]> = [
    ['invalid version', { transactionOpaqueEnvelopeVersion: 2, id: 'x', payload: {} }],
    ['missing id', { transactionOpaqueEnvelopeVersion: 1, payload: {} }],
    ['empty id', { transactionOpaqueEnvelopeVersion: 1, id: '   ', payload: {} }],
    ['missing payload', { transactionOpaqueEnvelopeVersion: 1, id: 'x' }],
    ['payload not an object', { transactionOpaqueEnvelopeVersion: 1, id: 'x', payload: 'oops' }],
    ['payload is an array', { transactionOpaqueEnvelopeVersion: 1, id: 'x', payload: [] }]
  ];
  for (const [label, raw] of cases) {
    const { transactions, opaqueTransactions, skipped } = normalizeTransactions([raw], accounts);
    assert.equal(transactions.length, 0, label);
    assert.equal(opaqueTransactions.length, 0, label);
    assert.equal(skipped.length, 1, label);
  }
});

// R4
test('R4 mixed known/opaque/known collection: known transactions calculate correctly, opaque fully excluded', () => {
  const { transactions, opaqueTransactions } = normalizeTransactions([
    knownTx('k1', { amount: 500 }),
    opaqueTx('fx-1', { amount: 999999 }),
    knownTx('k2', { type: 'expense', amount: 200 })
  ], accounts);
  assert.equal(transactions.length, 2);
  assert.equal(opaqueTransactions.length, 1);
  assert.deepEqual(deriveTransactionAccountBalances(transactions), { a: 300 });
  assert.deepEqual(transactionCashFlowSummary(transactions), { income: 500, expense: 200 });
});

// R9
test('R9 a known and an opaque record sharing the same raw id never both become active under that id', () => {
  const { transactions, opaqueTransactions, skipped } = normalizeTransactions([
    knownTx('dup'),
    opaqueTx('dup')
  ], accounts);
  assert.equal(transactions.length, 1);
  assert.equal(opaqueTransactions.length, 1);
  assert.equal(skipped.length, 0, '不遺失資料，用 deterministic 改名而非丟棄');
  assert.notEqual(transactions[0].id, opaqueTransactions[0].id, '兩筆不得共用同一個 id');
});

// R10
test('R10 normalization is idempotent for opaque records (semantic-equivalent, not necessarily byte-identical id)', () => {
  const first = normalizeTransactions([opaqueTx('fx-1', { a: 1, b: { c: 2 } })], accounts);
  const second = normalizeTransactions(first.opaqueTransactions, accounts);
  assert.deepEqual(second.opaqueTransactions[0]?.payload, first.opaqueTransactions[0]?.payload);
  assert.equal(second.opaqueTransactions.length, 1);
  assert.equal(second.transactions.length, 0);
  assert.equal(second.skipped.length, 0);
});

// R11
test('R11 producer isolation: deriveTransactionAccountBalances/transactionCashFlowSummary never see opaque records because they are a structurally separate array', () => {
  const { transactions, opaqueTransactions } = normalizeTransactions([
    knownTx('k1', { amount: 100 }),
    opaqueTx('fx-1', { amount: 5_000_000 })
  ], accounts);
  assert.equal(opaqueTransactions.length, 1);
  // Only `transactions` (known-only) is a valid argument type for these producers — this is
  // enforced by TypeScript at compile time (OpaqueFinancialTransactionEnvelope is not assignable
  // to FinancialTransaction), not just by this runtime assertion.
  assert.deepEqual(deriveTransactionAccountBalances(transactions), { a: 100 });
  assert.deepEqual(transactionCashFlowSummary(transactions), { income: 100, expense: 0 });
});

test('serializeTransactionCollection merges known + opaque back into a single raw array for the wire', () => {
  const { transactions, opaqueTransactions } = normalizeTransactions([knownTx('k1'), opaqueTx('fx-1')], accounts);
  const merged = serializeTransactionCollection(transactions, opaqueTransactions);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged, [...transactions, ...opaqueTransactions]);
});

// ---- App-level persistence round-trip (R5/R6/R7/R8), mirroring fxValuationPersistence.test.ts's pattern ----

type Persistence = {
  normalizeState(raw: unknown): Record<string, unknown>;
  backupPayload(state: unknown, quotes: Record<string, unknown>): Record<string, unknown>;
  stateFromBackup(raw: unknown, current: unknown): { state: Record<string, unknown> };
};

async function loadPersistence(): Promise<Persistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try {
    return await server.ssrLoadModule('/src/App.tsx') as Persistence;
  } finally {
    await server.close();
  }
}

test('R5/R6 opaque transaction survives localStorage-shaped and JSON Backup round-trips, merged back into a single `transactions` field', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const rawTransactionsField = [
    { id: 'k1', accountId: 'a', type: 'income', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'income-other', occurredAt: '2026-01-01T00:00:00.000Z', description: '', merchant: '', note: '', excluded: false },
    { transactionOpaqueEnvelopeVersion: 1, id: 'fx-1', payload: { future: 'fx-conversion-leg', amount: 999 } }
  ];
  const state = normalizeState({ accounts: [{ id: 'a', name: '現金', type: 'bank', currency: 'TWD', isActive: true, balanceMode: 'manual', manualBalance: 0 }], transactions: rawTransactionsField });
  assert.equal((state.transactions as unknown[]).length, 1);
  assert.equal((state.opaqueTransactions as unknown[]).length, 1);

  const backup = backupPayload(state, {});
  // On the wire, both known and opaque records live in the single `transactions` field.
  assert.equal((backup.transactions as unknown[]).length, 2);
  assert.ok((backup.transactions as Array<Record<string, unknown>>).some(entry => entry.transactionOpaqueEnvelopeVersion === 1 && entry.id === 'fx-1'));

  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.equal((restored.transactions as unknown[]).length, 1);
  const restoredOpaque = restored.opaqueTransactions as Array<Record<string, unknown>>;
  assert.equal(restoredOpaque.length, 1);
  assert.deepEqual(restoredOpaque[0]?.payload, { future: 'fx-conversion-leg', amount: 999 });
});

test('R7 editing an unrelated known transaction never changes an opaque transaction\'s payload', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({
    accounts: [{ id: 'a', name: '現金', type: 'bank', currency: 'TWD', isActive: true, balanceMode: 'manual', manualBalance: 0 }],
    transactions: [
      { id: 'k1', accountId: 'a', type: 'income', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'income-other', occurredAt: '2026-01-01T00:00:00.000Z', description: 'original', merchant: '', note: '', excluded: false },
      { transactionOpaqueEnvelopeVersion: 1, id: 'fx-1', payload: { amount: 999 } }
    ]
  }) as { transactions: Array<Record<string, unknown>>; opaqueTransactions: Array<Record<string, unknown>> };
  const editedKnown = state.transactions.map(t => t.id === 'k1' ? { ...t, description: 'edited' } : t);
  // normalizeState() merges r.transactions and r.opaqueTransactions itself (see App.tsx fix), so
  // `state.opaqueTransactions` only needs to ride along via the `...state` spread, not be re-added.
  const reNormalized = normalizeState({ ...state, transactions: editedKnown }) as { opaqueTransactions: Array<Record<string, unknown>> };
  assert.deepEqual(reNormalized.opaqueTransactions, state.opaqueTransactions);
});

test('R8 creating an unrelated new known transaction never changes an existing opaque transaction', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({
    accounts: [{ id: 'a', name: '現金', type: 'bank', currency: 'TWD', isActive: true, balanceMode: 'manual', manualBalance: 0 }],
    transactions: [{ transactionOpaqueEnvelopeVersion: 1, id: 'fx-1', payload: { amount: 999 } }]
  }) as { transactions: Array<Record<string, unknown>>; opaqueTransactions: Array<Record<string, unknown>> };
  const withNewKnown = [
    ...state.transactions,
    { id: 'k2', accountId: 'a', type: 'expense', status: 'posted', source: 'manual', amount: 50, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-01-02T00:00:00.000Z', description: '', merchant: '', note: '', excluded: false },
    ...state.opaqueTransactions
  ];
  const reNormalized = normalizeState({ accounts: [{ id: 'a', name: '現金', type: 'bank', currency: 'TWD', isActive: true, balanceMode: 'manual', manualBalance: 0 }], transactions: withNewKnown }) as { transactions: Array<Record<string, unknown>>; opaqueTransactions: Array<Record<string, unknown>> };
  assert.equal(reNormalized.transactions.length, 1);
  assert.deepEqual(reNormalized.opaqueTransactions, state.opaqueTransactions);
});
