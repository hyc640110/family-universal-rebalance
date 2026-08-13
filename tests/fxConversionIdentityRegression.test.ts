import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalizeTransactions, serializeTransactionCollection, type AccountReference } from '../src/lib/transactions';
import { resolveFxConversions, FX_CONVERSION_PAYLOAD_KIND, FX_CONVERSION_PAYLOAD_VERSION } from '../src/lib/fxConversionIdentity';

const accounts: AccountReference[] = [
  { id: 'acc-twd', currency: 'TWD', isActive: true },
  { id: 'acc-usd', currency: 'USD', isActive: true }
];

const validFxRaw = {
  id: 'conv-1', transactionOpaqueEnvelopeVersion: 1,
  payload: {
    kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION,
    sourceTransactionId: 'src-1', destinationTransactionId: 'dst-1',
    sourceCurrency: 'TWD', destinationCurrency: 'USD', sourceAmount: 32000, destinationAmount: 1000,
    effectiveDate: '2026-01-01', feeTreatment: { type: 'none' }
  }
};

const knownTx = (id: string, overrides: Record<string, unknown> = {}) => ({
  id, accountId: 'acc-twd', type: 'expense', status: 'posted', source: 'manual', amount: 1000,
  currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-01-01', description: '', merchant: '', note: '', excluded: false,
  ...overrides
});

// --- F1A opaque preservation regression ---

test('UR-TODO-046 FX-F2B: a valid FX conversion opaque payload survives F1A normalizeTransactions/serializeTransactionCollection round-trip untouched', () => {
  const raw = [knownTx('src-1', { amount: 32000 }), knownTx('dst-1', { accountId: 'acc-usd', type: 'income', currency: 'USD', amount: 1000 }), validFxRaw];
  const { transactions, opaqueTransactions, skipped } = normalizeTransactions(raw, accounts);
  assert.equal(transactions.length, 2);
  assert.equal(opaqueTransactions.length, 1);
  assert.equal(skipped.length, 0);
  assert.deepEqual(opaqueTransactions[0].payload, validFxRaw.payload);
  const serialized = serializeTransactionCollection(transactions, opaqueTransactions);
  assert.equal(serialized.length, 3);
  const reNormalized = normalizeTransactions(serialized, accounts);
  assert.equal(reNormalized.opaqueTransactions.length, 1, 're-normalization must not lose the FX opaque payload');
  assert.deepEqual(reNormalized.opaqueTransactions[0].payload, validFxRaw.payload);
});

test('UR-TODO-046 FX-F2B: a malformed FX payload is still F1A-preserved (lossless), while the F2B resolver rejects its economic semantics', () => {
  const malformed = { id: 'conv-bad', transactionOpaqueEnvelopeVersion: 1, payload: { kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION } };
  const { opaqueTransactions, skipped } = normalizeTransactions([malformed], accounts);
  assert.equal(opaqueTransactions.length, 1, 'F1A must preserve it regardless of FX payload validity');
  assert.equal(skipped.length, 0);
  const [resolution] = resolveFxConversions(opaqueTransactions, []);
  assert.ok(resolution.status === 'invalid' || resolution.status === 'unsupported', 'F2B must reject it economically, but F1A must not drop it');
});

test('UR-TODO-046 FX-F2B: ordinary known transactions are completely unaffected by the presence of an FX conversion opaque record', () => {
  const raw = [knownTx('ordinary-1', { amount: 500 }), validFxRaw];
  const { transactions } = normalizeTransactions(raw, accounts);
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].amount, 500);
});

// --- Reconciliation must remain unchanged ---

test('UR-TODO-046 FX-F2B: transactionReconciliation.ts is not imported by, and does not import, the FX conversion identity module', () => {
  const reconciliation = readFileSync(new URL('../src/lib/transactionReconciliation.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(reconciliation, /fxConversionIdentity/, 'F2B foundation existing must not make reconciliation start consuming FX conversions yet');
  const identity = readFileSync(new URL('../src/lib/fxConversionIdentity.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(identity, /from ['"]\.\/transactionReconciliation['"]/);
});

test('UR-TODO-046 FX-F2B: non-TWD transactions still resolve to fx-attribution-unsupported in reconciliation, unchanged by this Sprint', () => {
  const reconciliation = readFileSync(new URL('../src/lib/transactionReconciliation.ts', import.meta.url), 'utf8');
  assert.match(reconciliation, /fx-attribution-unsupported/);
});

// --- FinancialEvent must remain unchanged ---

test('UR-TODO-046 FX-F2B: financialEvents.ts is not imported by, and does not import, the FX conversion identity module', () => {
  const events = readFileSync(new URL('../src/lib/financialEvents.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(events, /fxConversionIdentity/);
  const identity = readFileSync(new URL('../src/lib/fxConversionIdentity.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(identity, /from ['"]\.\/financialEvents['"]/);
});

// --- F1D gate remains OFF ---

test('UR-TODO-046 FX-F2B: this Sprint does not touch the F1D source gate constant', () => {
  const gate = readFileSync(new URL('../src/lib/fxOpaqueProducerGate.ts', import.meta.url), 'utf8');
  assert.match(gate, /FX_OPAQUE_PRODUCER_SOURCE_GATE\s*=\s*false/);
});

test('UR-TODO-046 FX-F2B: the identity foundation module has no write path — it never imports the F1D gate and never writes to localStorage/AppState', () => {
  const identity = readFileSync(new URL('../src/lib/fxConversionIdentity.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(identity, /fxOpaqueProducerGate/);
  assert.doesNotMatch(identity, /localStorage\s*\./);
  assert.doesNotMatch(identity, /setState/);
});

test('UR-TODO-046 FX-F2B: no producer UI or write path exists anywhere in App.tsx for FX conversions', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /fxConversionIdentity|FxConversionOpaquePayload|createFxConversion|createFxTransaction/);
});
