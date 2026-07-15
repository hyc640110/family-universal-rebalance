import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  deriveTransactionAccountBalances,
  normalizeTransactions,
  type FinancialTransaction
} from '../src/lib/transactions';
import { deriveTransactionSyncDiagnostics } from '../src/lib/transactionSyncDiagnostics';
import {
  createSyncPayloadSnapshot,
  deriveSuccessfulUploadResult,
  deriveSyncBaselineDiagnostics,
  syncPayloadTopLevelDiff
} from '../src/lib/syncState';

const accounts = [
  { id: 'account-a', currency: 'TWD', isActive: true },
  { id: 'account-b', currency: 'TWD', isActive: true }
];

const transaction = (overrides: Partial<FinancialTransaction> = {}): FinancialTransaction => ({
  id: 'transaction-anonymous',
  accountId: 'account-a',
  type: 'expense',
  status: 'posted',
  source: 'manual',
  amount: 10,
  currency: 'TWD',
  categoryId: 'expense-other',
  description: '',
  merchant: '',
  note: '',
  occurredAt: '2026-01-01T00:00:00.000Z',
  fingerprint: 'legacy-fingerprint',
  excluded: false,
  createdAt: '2026-01-01T01:00:00.000Z',
  updatedAt: '2026-01-01T02:00:00.000Z',
  ...overrides
});

const state = (transactions: unknown[], overrides: Record<string, unknown> = {}) => ({
  accounts,
  transactions,
  transactionSchemaVersion: 2,
  holdings: [],
  cash: [],
  loans: [],
  importSessions: [],
  importPresets: [],
  gmailOAuth: { status: 'disconnected', grantedScopes: [] },
  netWorthHistory: [],
  syncMeta: { dirty: false, source: '本機資料', status: '已同步' },
  ...overrides
});

const normalize = (transactions: unknown[], fallback: string) => normalizeTransactions(transactions, accounts, fallback).transactions;

test('normalizeTransactions is idempotent and never advances timestamps during normalization', () => {
  const original = [transaction()];
  const once = normalize(original, '2026-02-01T00:00:00.000Z');
  const twice = normalize(once, '2026-03-01T00:00:00.000Z');
  assert.deepEqual(twice, once);
  assert.equal(once[0].createdAt, original[0].createdAt);
  assert.equal(once[0].updatedAt, original[0].updatedAt);
});

test('legacy missing timestamps and optional fields normalize deterministically across reloads', () => {
  const legacy = [{ id: 'legacy', accountId: 'account-a', type: 'expense', amount: 1, occurredAt: 'invalid' }];
  const first = normalizeTransactions(legacy, accounts).transactions;
  const repeated = normalizeTransactions(legacy, accounts).transactions;
  const reloaded = normalizeTransactions(JSON.parse(JSON.stringify(first)), accounts).transactions;
  assert.deepEqual(repeated, first);
  assert.deepEqual(reloaded, first);
  assert.equal(first[0].createdAt, '1970-01-01T00:00:00.000Z');
  assert.equal(first[0].updatedAt, '1970-01-01T00:00:00.000Z');
});

test('income, expense, adjustment, import, excluded, posted, and pending records remain stable', () => {
  const variants = [
    transaction({ id: 'income', type: 'income', categoryId: 'income-other' }),
    transaction({ id: 'expense' }),
    transaction({ id: 'adjustment', type: 'adjustment', categoryId: 'adjustment-other' }),
    transaction({ id: 'import', source: 'import', note: '[import:anonymous]' }),
    transaction({ id: 'excluded', excluded: true }),
    transaction({ id: 'pending', status: 'pending' })
  ];
  const once = normalize(variants, '2026-02-01T00:00:00.000Z');
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(once)), '2026-03-01T00:00:00.000Z'), once);
});

test('transfer round-trip is stable and derived balances never mutate transactions', () => {
  const source = [transaction({ id: 'transfer', type: 'transfer', categoryId: 'transfer-account', transferAccountId: 'account-b' })];
  const normalized = normalize(source, '2026-02-01T00:00:00.000Z');
  const before = JSON.stringify(normalized);
  assert.deepEqual(deriveTransactionAccountBalances(normalized), { 'account-a': -10, 'account-b': 10 });
  assert.equal(JSON.stringify(normalized), before);
  assert.deepEqual(normalize(JSON.parse(before), '2026-03-01T00:00:00.000Z'), normalized);
});

test('normalization and presentation sorting preserve persistent transaction order', () => {
  const source = [
    transaction({ id: 'older', occurredAt: '2026-01-01T00:00:00.000Z' }),
    transaction({ id: 'newer', occurredAt: '2026-02-01T00:00:00.000Z' })
  ];
  const normalized = normalize(source, '2026-03-01T00:00:00.000Z');
  const displayed = normalized.slice().sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  assert.deepEqual(normalized.map(item => item.id), ['older', 'newer']);
  assert.deepEqual(displayed.map(item => item.id), ['newer', 'older']);
});

test('snapshot, request JSON, reload normalization, and localStorage round-trip share one transaction fingerprint', () => {
  const normalized = normalize([transaction()], '2026-02-01T00:00:00.000Z');
  const request = createSyncPayloadSnapshot(state(normalized));
  const parsed = JSON.parse(request.canonicalJson) as Record<string, unknown>;
  const reloadedTransactions = normalizeTransactions(parsed.transactions, accounts).transactions;
  const reloaded = state(reloadedTransactions);
  assert.equal(createSyncPayloadSnapshot(reloaded).fieldFingerprints.transactions, request.fieldFingerprints.transactions);
  assert.equal(createSyncPayloadSnapshot(JSON.parse(JSON.stringify(reloaded))).fieldFingerprints.transactions, request.fieldFingerprints.transactions);
  assert.equal(deriveSyncBaselineDiagnostics(reloaded, request.fingerprint, request.fieldFingerprints).dirty, false);
});

test('successful upload remains clean while genuine transaction edits, additions, and removals remain dirty', () => {
  const normalized = normalize([transaction()], '2026-02-01T00:00:00.000Z');
  const current = state(normalized);
  const uploaded = createSyncPayloadSnapshot(current);
  assert.equal(deriveSuccessfulUploadResult(current, uploaded).dirty, false);

  const edited = state([{ ...normalized[0], note: 'anonymous edit' }]);
  const added = state([...normalized, transaction({ id: 'added' })]);
  const removed = state([]);
  for (const changed of [edited, added, removed]) {
    const diagnostics = deriveSuccessfulUploadResult(changed, uploaded);
    assert.equal(diagnostics.dirty, true);
    assert.deepEqual(diagnostics.changedFields, ['transactions']);
    assert.deepEqual(syncPayloadTopLevelDiff(current, changed), ['transactions']);
  }
});

test('A to B upload race reports transactions without corrupting the immutable request baseline', () => {
  const requestState = state(normalize([transaction()], '2026-02-01T00:00:00.000Z'));
  const request = createSyncPayloadSnapshot(requestState);
  const current = state([{ ...(requestState.transactions as FinancialTransaction[])[0], status: 'pending' }]);
  const result = deriveSuccessfulUploadResult(current, request);
  assert.equal(result.dirty, true);
  assert.deepEqual(result.changedFields, ['transactions']);
  assert.equal(createSyncPayloadSnapshot(requestState).canonicalJson, request.canonicalJson);
});

test('transaction diagnostics expose only private hashes, indexes, field names, and aggregate counts', async () => {
  const baseline = [transaction({ id: 'first', note: 'private baseline' }), transaction({ id: 'second' })];
  const current = [transaction({ id: 'second' }), transaction({ id: 'first', note: 'private changed' }), transaction({ id: 'added' })];
  const diagnostics = await deriveTransactionSyncDiagnostics(baseline, current, current);
  assert.equal(diagnostics.transactionCount, 3);
  assert.equal(diagnostics.normalizedTransactionCount, 3);
  assert.match(diagnostics.orderFingerprint, /^[0-9a-f]{12}$/);
  diagnostics.identityHashes.forEach(value => assert.match(value, /^[0-9a-f]{12}$/));
  diagnostics.structuralFingerprints.forEach(value => assert.match(value, /^[0-9a-f]{12}$/));
  assert.deepEqual(diagnostics.changedIndexes, [1]);
  assert.deepEqual(diagnostics.changedFieldNames, ['note']);
  assert.equal(diagnostics.addedCount, 1);
  assert.equal(diagnostics.removedCount, 0);
  assert.equal(diagnostics.reorderedCount, 2);
  const safe = JSON.stringify(diagnostics);
  assert.doesNotMatch(safe, /private baseline|private changed|first|second|account-a|2026-01-01/);
});

test('transaction diagnostics cannot enter Firebase payload or Backup serializer', async () => {
  const diagnostics = await deriveTransactionSyncDiagnostics([], [transaction()], [transaction()]);
  const snapshot = createSyncPayloadSnapshot(state([transaction()], { transactionSyncDiagnostics: diagnostics }));
  assert.equal('transactionSyncDiagnostics' in snapshot.payload, false);
  assert.doesNotMatch(snapshot.canonicalJson, /identityHashes|structuralFingerprints|changedFieldNames/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const serializer = app.slice(app.indexOf('function serializeBackup'), app.indexOf('function parseBackup'));
  assert.doesNotMatch(serializer, /transactionSyncDiagnostics/);
});

test('UI uses cloned sorting and diagnostics remain local-only without production logging', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /transactions\.filter[\s\S]*\.slice\(\)\.sort/);
  assert.match(app, /transactionBaselineRef = useRef/);
  assert.doesNotMatch(app, /console\.(?:log|info|debug)\([^\n]*transactionSyncDiagnostics/);
});
