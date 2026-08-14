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

// --- F1D gate: F2B/F2C-1/F2C-2 left it OFF; F2C-3 is the authorized Sprint that flips it
// (see tests/fxOpaqueProducerGate.test.ts for the current-phase value assertions) ---

test('UR-TODO-046 FX-F2B: the identity foundation module has no write path — it never imports the F1D gate and never writes to localStorage/AppState', () => {
  const identity = readFileSync(new URL('../src/lib/fxConversionIdentity.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(identity, /fxOpaqueProducerGate/);
  assert.doesNotMatch(identity, /localStorage\s*\./);
  assert.doesNotMatch(identity, /setState/);
});

test('UR-TODO-046 FX-F2C-2: App.tsx wires the ordinary-delete linkage guard and the Manual FX Conversion Producer, but never constructs a raw FX payload literal itself', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  // F2C-2 authorizes the producer to exist and be wired in — it must reuse the pure builder/
  // deletion-plan functions (fxConversionProducer.ts), never hand-construct a payload with
  // `kind: 'fx-conversion'` or call the F2B resolver/parser functions directly.
  assert.doesNotMatch(app, /FxConversionOpaquePayload|resolveFxConversionEnvelope|resolveFxConversions\(|parseFxConversionPayloadV1|deriveFxConversionExecutedRate|isFxConversionPayloadCandidate|FX_CONVERSION_PAYLOAD_KIND/);
  assert.match(app, /findLinkedFxConversionId/, 'F2C-1 ordinary-delete linkage guard must remain wired');
  assert.match(app, /buildFxConversionCreation/, 'F2C-2 producer must go through the pure builder, not construct records inline');
  assert.match(app, /buildFxConversionDeletion/, 'F2C-2 atomic delete must go through the pure deletion-plan builder');
  assert.match(app, /isFxOpaqueProducerEnabled/, 'the write path must resolve the F1D gate itself, not only hide the UI');
});

test('UR-TODO-046 FX-F2C-3: App.tsx\'s producer wiring is unchanged by the gate-enable Sprint — only the source gate constant moved, not the write-path call sites', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /buildFxConversionCreation/, 'F2C-3 must not touch the F2C-2 producer wiring, only the gate constant');
  assert.match(app, /buildFxConversionDeletion/, 'F2C-3 must not touch the F2C-2 atomic delete wiring, only the gate constant');
  assert.match(app, /isFxOpaqueProducerEnabled\(DEPLOYMENT_ENVIRONMENT\)/, 'F2C-3 must not change how the write path resolves the gate');
});
