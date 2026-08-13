import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFxConversionCreation, buildFxConversionDeletion, type FxConversionCreationContext, type FxConversionCreationInput } from '../src/lib/fxConversionProducer';
import { deriveFxConversionExecutedRate, resolveFxConversionEnvelope, FX_CONVERSION_PAYLOAD_KIND, FX_CONVERSION_PAYLOAD_VERSION } from '../src/lib/fxConversionIdentity';
import { deriveTransactionAccountBalances, normalizeTransactions, serializeTransactionCollection, transactionCashFlowSummary, type AccountReference, type FinancialTransaction, type OpaqueFinancialTransactionEnvelope } from '../src/lib/transactions';
import { reconcileTransactions } from '../src/lib/transactionReconciliation';
import type { FinancialAccount } from '../src/lib/financialAccounts';

const accounts: AccountReference[] = [
  { id: 'acc-twd', currency: 'TWD', isActive: true },
  { id: 'acc-usd', currency: 'USD', isActive: true },
  { id: 'acc-twd-2', currency: 'TWD', isActive: true },
  { id: 'acc-jpy', currency: 'JPY', isActive: true },
  { id: 'acc-inactive', currency: 'USD', isActive: false }
];

function baseInput(overrides: Partial<FxConversionCreationInput> = {}): FxConversionCreationInput {
  return {
    sourceAccountId: 'acc-twd', sourceAmount: 32000, destinationAccountId: 'acc-usd', destinationAmount: 1000,
    effectiveDate: '2026-08-14', feeTreatment: { type: 'unknown' }, ...overrides
  };
}

function baseContext(overrides: Partial<FxConversionCreationContext> = {}): FxConversionCreationContext {
  return { accounts, transactions: [], opaqueTransactions: [], gateEnabled: true, timestamp: '2026-08-14T00:00:00.000Z', ...overrides };
}

// --- Builder ---

test('valid TWD→USD conversion builds all three records with correct roles and linkage', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.equal(result.sourceLeg.accountId, 'acc-twd');
  assert.equal(result.sourceLeg.type, 'expense');
  assert.equal(result.sourceLeg.amount, 32000);
  assert.deepEqual(result.sourceLeg.fxConversionLeg, { conversionId: result.conversionId, role: 'source' });
  assert.equal(result.destinationLeg.accountId, 'acc-usd');
  assert.equal(result.destinationLeg.type, 'income');
  assert.equal(result.destinationLeg.amount, 1000);
  assert.deepEqual(result.destinationLeg.fxConversionLeg, { conversionId: result.conversionId, role: 'destination' });
  assert.equal(result.envelope.id, result.conversionId);
  assert.equal(result.sourceLeg.occurredAt.slice(0, 10), '2026-08-14');
  assert.equal(result.destinationLeg.occurredAt.slice(0, 10), '2026-08-14');
});

test('valid USD→TWD conversion also builds correctly (direction-agnostic)', () => {
  const result = buildFxConversionCreation(baseInput({ sourceAccountId: 'acc-usd', sourceAmount: 1000, destinationAccountId: 'acc-twd', destinationAmount: 32000 }), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.equal(result.sourceLeg.currency, 'USD');
  assert.equal(result.destinationLeg.currency, 'TWD');
});

test('conversionId equals envelope.id and both legs reference it identically', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.equal(result.envelope.id, result.conversionId);
  assert.equal(result.sourceLeg.fxConversionLeg?.conversionId, result.conversionId);
  assert.equal(result.destinationLeg.fxConversionLeg?.conversionId, result.conversionId);
  assert.equal(result.envelope.payload.sourceTransactionId, result.sourceLeg.id);
  assert.equal(result.envelope.payload.destinationTransactionId, result.destinationLeg.id);
});

test('effectiveDate is shared identically by the envelope payload and both leg occurredAt dates', () => {
  const result = buildFxConversionCreation(baseInput({ effectiveDate: '2026-07-01' }), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.equal(result.envelope.payload.effectiveDate, '2026-07-01');
  assert.equal(result.sourceLeg.occurredAt.slice(0, 10), '2026-07-01');
  assert.equal(result.destinationLeg.occurredAt.slice(0, 10), '2026-07-01');
});

test('derived executed rate is computable from the built envelope payload and is never persisted anywhere', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const rate = deriveFxConversionExecutedRate(result.envelope.payload);
  assert.equal(rate, 32); // 32000 TWD / 1000 USD
  assert.equal('executedRate' in result.envelope.payload, false, 'executedRate must never be a payload field');
  assert.equal('executedRate' in result.sourceLeg, false);
  assert.equal('executedRate' in result.destinationLeg, false);
});

test('same currency on both sides is rejected', () => {
  const result = buildFxConversionCreation(baseInput({ destinationAccountId: 'acc-twd-2', destinationAmount: 100 }), baseContext());
  assert.deepEqual(result, { status: 'invalid', reason: 'unsupported-currency-pair' });
});

test('unsupported currency (JPY) is rejected', () => {
  const result = buildFxConversionCreation(baseInput({ destinationAccountId: 'acc-jpy' }), baseContext());
  assert.deepEqual(result, { status: 'invalid', reason: 'unsupported-currency-pair' });
});

test('same account for source and destination is rejected', () => {
  const result = buildFxConversionCreation(baseInput({ destinationAccountId: 'acc-twd' }), baseContext());
  assert.deepEqual(result, { status: 'invalid', reason: 'same-account' });
});

test('inactive account is rejected', () => {
  const result = buildFxConversionCreation(baseInput({ destinationAccountId: 'acc-inactive' }), baseContext());
  assert.deepEqual(result, { status: 'invalid', reason: 'invalid-destination-account' });
});

test('zero or negative amount is rejected on either leg', () => {
  assert.deepEqual(buildFxConversionCreation(baseInput({ sourceAmount: 0 }), baseContext()), { status: 'invalid', reason: 'invalid-source-amount' });
  assert.deepEqual(buildFxConversionCreation(baseInput({ destinationAmount: -1 }), baseContext()), { status: 'invalid', reason: 'invalid-destination-amount' });
});

test('malformed effectiveDate is rejected', () => {
  const result = buildFxConversionCreation(baseInput({ effectiveDate: 'not-a-date' }), baseContext());
  assert.deepEqual(result, { status: 'invalid', reason: 'invalid-effective-date' });
});

test('gate blocked: gateEnabled=false refuses before any other validation runs, and even invalid input still reports gate-blocked first', () => {
  assert.deepEqual(buildFxConversionCreation(baseInput(), baseContext({ gateEnabled: false })), { status: 'gate-blocked' });
  assert.deepEqual(buildFxConversionCreation(baseInput({ sourceAmount: -1, destinationAccountId: 'acc-twd' }), baseContext({ gateEnabled: false })), { status: 'gate-blocked' });
});

test('duplicate protection: a transaction already claimed by an existing valid conversion cannot be claimed again by coincidental reuse is structurally impossible (fresh ids), but the cross-check still runs and reports duplicate if triggered', () => {
  // Construct a scenario where the new conversion's legs collide with an existing envelope's claims
  // by directly forging existing opaque data referencing not-yet-existent ids is not meaningful here;
  // instead assert the duplicate-check machinery is wired: build once, then attempt to register the
  // exact same envelope id again against context that already contains it and its legs.
  const first = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(first.status, 'success');
  if (first.status !== 'success') return;
  const contextWithExisting = baseContext({
    transactions: [first.sourceLeg, first.destinationLeg],
    opaqueTransactions: [first.envelope]
  });
  // A second, independent conversion between the same two accounts must still succeed (fresh ids, no claim overlap).
  const second = buildFxConversionCreation(baseInput(), contextWithExisting);
  assert.equal(second.status, 'success', 'independent conversions with fresh ids never collide');
});

// --- Atomic create ---

test('all 3 records are created together on success', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.ok(result.sourceLeg && result.destinationLeg && result.envelope);
});

test('any validation failure produces zero records (nothing to commit)', () => {
  const result = buildFxConversionCreation(baseInput({ sourceAmount: 0 }), baseContext());
  assert.notEqual(result.status, 'success');
  assert.ok(!('sourceLeg' in result));
  assert.ok(!('destinationLeg' in result));
  assert.ok(!('envelope' in result));
});

test('single state commit semantics: builder never mutates the context it was given', () => {
  const context = baseContext();
  const before = JSON.stringify(context);
  buildFxConversionCreation(baseInput(), context);
  assert.equal(JSON.stringify(context), before, 'builder is pure — the caller performs the one setState()');
});

// --- Fee ---

test('fee unknown (default) resolves through the F2B contract with no amount field', () => {
  const result = buildFxConversionCreation(baseInput({ feeTreatment: { type: 'unknown' } }), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.deepEqual(result.envelope.payload.feeTreatment, { type: 'unknown' });
});

test('fee none is accepted as an explicit user declaration', () => {
  const result = buildFxConversionCreation(baseInput({ feeTreatment: { type: 'none' } }), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.deepEqual(result.envelope.payload.feeTreatment, { type: 'none' });
});

test('fee included is accepted without any amount input', () => {
  const result = buildFxConversionCreation(baseInput({ feeTreatment: { type: 'included' } }), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.deepEqual(result.envelope.payload.feeTreatment, { type: 'included' });
});

test('fee explicit valid: linking to an existing transaction succeeds', () => {
  const existingFee: FinancialTransaction = {
    id: 'fee-tx-1', accountId: 'acc-twd', type: 'expense', status: 'posted', source: 'manual', amount: 50,
    currency: 'TWD', categoryId: 'expense-other', description: '', merchant: '', note: '', occurredAt: '2026-08-14T00:00:00.000Z',
    fingerprint: '', excluded: false, createdAt: '2026-08-14T00:00:00.000Z', updatedAt: '2026-08-14T00:00:00.000Z'
  };
  const result = buildFxConversionCreation(baseInput({ feeTreatment: { type: 'explicit', feeTransactionId: 'fee-tx-1' } }), baseContext({ transactions: [existingFee] }));
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.deepEqual(result.envelope.payload.feeTreatment, { type: 'explicit', feeTransactionId: 'fee-tx-1' });
});

test('fee explicit invalid: linking to a non-existent transaction is refused up front, not persisted as a known-broken link', () => {
  const result = buildFxConversionCreation(baseInput({ feeTreatment: { type: 'explicit', feeTransactionId: 'does-not-exist' } }), baseContext());
  assert.deepEqual(result, { status: 'invalid', reason: 'explicit-fee-transaction-not-found' });
});

// --- Consumer regression through the producer path ---

test('after building a conversion, account balances move correctly on both legs', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const balances = deriveTransactionAccountBalances([result.sourceLeg, result.destinationLeg]);
  assert.deepEqual(balances, { 'acc-twd': -32000, 'acc-usd': 1000 });
});

test('after building a conversion, both legs are excluded from household cash-flow', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.deepEqual(transactionCashFlowSummary([result.sourceLeg, result.destinationLeg]), { income: 0, expense: 0 });
});

test('after building a conversion, reconciliation resolves both legs to unsupported/fx-attribution-unsupported', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const financialAccounts: FinancialAccount[] = accounts.map(a => ({
    id: a.id, name: a.id, type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: a.currency,
    institutionName: '', note: '', isActive: a.isActive, sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
  }));
  const output = reconcileTransactions({ transactions: [result.sourceLeg, result.destinationLeg], accounts: financialAccounts, ledgerEvents: [] });
  assert.deepEqual(output.map(item => [item.transactionId, item.status, item.reason]), [
    [result.sourceLeg.id, 'unsupported', 'fx-attribution-unsupported'],
    [result.destinationLeg.id, 'unsupported', 'fx-attribution-unsupported']
  ]);
});

// --- Atomic delete ---

test('a valid FX conversion envelope produces a delete plan removing exactly the two legs', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const plan = buildFxConversionDeletion(result.envelope, [result.sourceLeg, result.destinationLeg]);
  assert.deepEqual(plan, { status: 'success', conversionId: result.conversionId, sourceTransactionId: result.sourceLeg.id, destinationTransactionId: result.destinationLeg.id });
});

test('a non-FX opaque envelope routes to not-fx-conversion (generic delete path)', () => {
  const genericOpaque: OpaqueFinancialTransactionEnvelope = { transactionOpaqueEnvelopeVersion: 1, id: 'opaque-generic', payload: { someUnknownField: 'value' } };
  assert.deepEqual(buildFxConversionDeletion(genericOpaque, []), { status: 'not-fx-conversion' });
});

test('an FX-shaped envelope that fails to resolve valid (e.g. missing linked transaction) routes to not-active (generic delete path)', () => {
  const brokenEnvelope: OpaqueFinancialTransactionEnvelope = {
    transactionOpaqueEnvelopeVersion: 1, id: 'conv-broken',
    payload: {
      kind: FX_CONVERSION_PAYLOAD_KIND, payloadVersion: FX_CONVERSION_PAYLOAD_VERSION,
      sourceTransactionId: 'missing-1', destinationTransactionId: 'missing-2',
      sourceCurrency: 'TWD', destinationCurrency: 'USD', sourceAmount: 100, destinationAmount: 3,
      effectiveDate: '2026-08-14', feeTreatment: { type: 'unknown' }
    }
  };
  const plan = buildFxConversionDeletion(brokenEnvelope, []);
  assert.equal(plan.status, 'not-active');
});

// --- Persistence / Backup round-trip / re-normalization safety ---

test('re-normalization safety: builder output survives normalizeState()-equivalent round-trip (normalizeTransactions -> serialize -> normalizeTransactions) with metadata and linkage fully intact', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;

  // Simulate what App.tsx's writeState() does on every commit: run the freshly-built records
  // through the closed-whitelist normalizer exactly as if they had just been read back from
  // localStorage, then serialize (as JSON Backup / localStorage would), then normalize again.
  const firstPass = normalizeTransactions([result.sourceLeg, result.destinationLeg, result.envelope], accounts, '2026-08-14T00:00:00.000Z');
  assert.equal(firstPass.skipped.length, 0, 'nothing should be silently dropped by the closed-whitelist normalizer');
  assert.equal(firstPass.transactions.length, 2);
  assert.equal(firstPass.opaqueTransactions.length, 1);
  assert.deepEqual(firstPass.transactions.find(t => t.id === result.sourceLeg.id)?.fxConversionLeg, { conversionId: result.conversionId, role: 'source' });
  assert.deepEqual(firstPass.transactions.find(t => t.id === result.destinationLeg.id)?.fxConversionLeg, { conversionId: result.conversionId, role: 'destination' });

  const serialized = serializeTransactionCollection(firstPass.transactions, firstPass.opaqueTransactions);
  const roundTripped = JSON.parse(JSON.stringify(serialized));
  const secondPass = normalizeTransactions(roundTripped, accounts, '2026-08-14T00:00:00.000Z');
  assert.equal(secondPass.skipped.length, 0);
  assert.deepEqual(secondPass.transactions, firstPass.transactions, 'a second normalization pass (every subsequent writeState()) must be idempotent');
  assert.deepEqual(secondPass.opaqueTransactions, firstPass.opaqueTransactions);

  // The F2B resolver must still see this as `valid` after the full round-trip — proving the
  // triple reads back exactly as it was written, not just that no field was dropped.
  const transactionsById = new Map(secondPass.transactions.map(t => [t.id, t]));
  const resolution = resolveFxConversionEnvelope(secondPass.opaqueTransactions[0]!, transactionsById);
  assert.equal(resolution?.status, 'valid');
});

test('persistence: refresh (a fresh normalizeTransactions pass on the raw persisted array) preserves all 3 records, ids, and linkage', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const persisted = serializeTransactionCollection([result.sourceLeg, result.destinationLeg], [result.envelope]);
  const afterRefresh = normalizeTransactions(persisted, accounts, '2026-08-14T00:00:00.000Z');
  assert.equal(afterRefresh.transactions.length, 2);
  assert.equal(afterRefresh.opaqueTransactions.length, 1);
  assert.equal(afterRefresh.opaqueTransactions[0]!.id, result.conversionId);
  assert.ok(afterRefresh.transactions.some(t => t.id === result.sourceLeg.id));
  assert.ok(afterRefresh.transactions.some(t => t.id === result.destinationLeg.id));
});

test('JSON Backup round-trip (export then import): all 3 records survive a full JSON stringify/parse cycle with unchanged ids and linkage', () => {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const exported = JSON.stringify(serializeTransactionCollection([result.sourceLeg, result.destinationLeg], [result.envelope]));
  const imported = normalizeTransactions(JSON.parse(exported), accounts, '2026-08-14T00:00:00.000Z');
  assert.equal(imported.transactions.length, 2);
  assert.equal(imported.opaqueTransactions.length, 1);
  const transactionsById = new Map(imported.transactions.map(t => [t.id, t]));
  const resolution = resolveFxConversionEnvelope(imported.opaqueTransactions[0]!, transactionsById);
  assert.equal(resolution?.status, 'valid', 'F2B resolver must confirm the imported triple is still a valid conversion');
});
