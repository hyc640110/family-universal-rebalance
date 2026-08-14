import assert from 'node:assert/strict';
import test from 'node:test';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import {
  appendFinancialEvent, normalizeFinancialEventLedger, type FinancialEvent, type FinancialEventReferenceContext
} from '../src/lib/financialEvents';
import { buildFxConversionAttributionConfirmation, confirmFxConversionAndAppend } from '../src/lib/fxConversionAttributionConfirmation';
import { resolveActiveFxConversionGroups } from '../src/lib/fxConversionIdentity';
import { buildFxConversionCreation, buildFxConversionDeletion, type FxConversionCreationContext, type FxConversionCreationInput } from '../src/lib/fxConversionProducer';
import { buildVoidEvent } from '../src/lib/financialEventVoid';
import { deriveNetWorthAttributionFromEvidence } from '../src/lib/netWorthAttribution';
import { composeRuntimeNetWorthAttribution } from '../src/lib/runtimeAttributionComposition';
import { reconcileTransactions } from '../src/lib/transactionReconciliation';
import type { AccountReference, FinancialTransaction, OpaqueFinancialTransactionEnvelope } from '../src/lib/transactions';

// --- Fixtures ---

const audit = { createdAt: '2026-08-14T00:00:00.000Z', updatedAt: '2026-08-14T00:00:00.000Z' };

const producerAccounts: AccountReference[] = [
  { id: 'acc-twd', currency: 'TWD', isActive: true },
  { id: 'acc-usd', currency: 'USD', isActive: true }
];

const financialAccounts: FinancialAccount[] = [
  { id: 'acc-twd', name: 'TWD', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, ...audit },
  { id: 'acc-usd', name: 'USD', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'USD', institutionName: '', note: '', isActive: true, sortOrder: 1, ...audit }
];

function baseInput(overrides: Partial<FxConversionCreationInput> = {}): FxConversionCreationInput {
  return {
    sourceAccountId: 'acc-twd', sourceAmount: 32000, destinationAccountId: 'acc-usd', destinationAmount: 1000,
    effectiveDate: '2026-08-14', feeTreatment: { type: 'unknown' }, ...overrides
  };
}

function baseContext(overrides: Partial<FxConversionCreationContext> = {}): FxConversionCreationContext {
  return { accounts: producerAccounts, transactions: [], opaqueTransactions: [], gateEnabled: true, timestamp: '2026-08-14T00:00:00.000Z', ...overrides };
}

/** Builds a single valid TWD->USD conversion (source leg, destination leg, envelope) via the already-tested F2C-2 producer. */
function buildValidConversion() {
  const result = buildFxConversionCreation(baseInput(), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') throw new Error('fixture build failed');
  return result;
}

function referenceContext(transactions: readonly FinancialTransaction[], events: readonly FinancialEvent[] = []): FinancialEventReferenceContext {
  return {
    accountIds: new Set(financialAccounts.map(account => account.id)),
    loanIds: new Set(),
    transactionIds: new Set(transactions.map(transaction => transaction.id)),
    transactionsById: new Map(transactions.map(transaction => [transaction.id, transaction]))
  };
}

function snapshot(date: string, netWorth: number) {
  return { date, netWorth, totalAssets: netWorth, investmentValue: 0, cash: netWorth, debt: 0 };
}

// --- Confirmation build ---

test('a valid TWD->USD conversion builds exactly one fx-conversion event, TWD-denominated, using the TWD leg', () => {
  const { sourceLeg, destinationLeg, envelope, conversionId } = buildValidConversion();
  const built = buildFxConversionAttributionConfirmation({ envelope, transactions: [sourceLeg, destinationLeg] });
  assert.equal(built.rejected, false);
  if (built.rejected) return;
  assert.equal(built.event.type, 'fx-conversion');
  assert.equal(built.event.source, 'attribution-confirmation');
  assert.equal(built.event.status, 'posted');
  assert.equal(built.event.currency, 'TWD');
  assert.equal(built.event.amount, 32000);
  assert.equal(built.event.accountId, 'acc-twd');
  assert.equal(built.event.transactionId, sourceLeg.id);
  assert.deepEqual(built.event.fxConversionLink, { conversionId, sourceTransactionId: sourceLeg.id, destinationTransactionId: destinationLeg.id });
});

test('a valid USD->TWD conversion also builds a TWD-denominated event using whichever leg is TWD', () => {
  const result = buildFxConversionCreation(baseInput({ sourceAccountId: 'acc-usd', sourceAmount: 1000, destinationAccountId: 'acc-twd', destinationAmount: 32000 }), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const built = buildFxConversionAttributionConfirmation({ envelope: result.envelope, transactions: [result.sourceLeg, result.destinationLeg] });
  assert.equal(built.rejected, false);
  if (built.rejected) return;
  assert.equal(built.event.currency, 'TWD');
  assert.equal(built.event.amount, 32000);
  assert.equal(built.event.transactionId, result.destinationLeg.id);
});

test('confirmation is refused when the envelope does not resolve valid (missing leg)', () => {
  const { sourceLeg, envelope } = buildValidConversion();
  const built = buildFxConversionAttributionConfirmation({ envelope, transactions: [sourceLeg] });
  assert.equal(built.rejected, true);
});

// --- Append / duplicate prevention ---

test('confirmFxConversionAndAppend succeeds once and the event becomes the sole active claim for the conversionId', () => {
  const { sourceLeg, destinationLeg, envelope, conversionId } = buildValidConversion();
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);
  const result = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], opaqueTransactionsById);
  assert.equal(result.rejected, false);
  if (result.rejected) return;
  const resolution = resolveActiveFxConversionGroups(result.events, new Map([[sourceLeg.id, sourceLeg], [destinationLeg.id, destinationLeg]]), opaqueTransactionsById);
  assert.ok(resolution.confirmedConversionIds.has(conversionId));
  assert.ok(resolution.validEventIds.has(result.event.id));
});

test('a second confirmation for the same conversionId is rejected (duplicate active confirmation)', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);
  const first = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], opaqueTransactionsById);
  assert.equal(first.rejected, false);
  if (first.rejected) return;
  const second = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg], now: '2026-08-15T00:00:00.000Z' }, first.events, opaqueTransactionsById);
  assert.equal(second.rejected, true);
  const transactionsById = new Map([[sourceLeg.id, sourceLeg], [destinationLeg.id, destinationLeg]]);
  // Neither event ends up valid once two active confirmations claim the same conversionId — fail-safe both-invalid, not "first wins".
  const resolution = resolveActiveFxConversionGroups(first.events, transactionsById, opaqueTransactionsById);
  assert.equal(resolution.validEventIds.size, 1, 'confirmFxConversionAndAppend must reject the second write, leaving only the first persisted');
});

test('UR-TODO-054-B caller contract: confirmFxConversionAndAppend() success returns the COMPLETE merged Ledger (existingEvents + new event) — the opposite of Loan\'s confirmLoanPaymentGroupAndAppend(), which returns only the new group. App.tsx callers must replace state.financialEvents with result.events, never append it again.', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const unrelatedExistingEvent: FinancialEvent = { id: 'unrelated-event', type: 'adjustment', status: 'posted', source: 'manual', effectiveDate: '2026-08-01', amount: 1, currency: 'TWD', accountId: 'acc-twd', note: '', ...audit };
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);
  const result = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [unrelatedExistingEvent], opaqueTransactionsById);
  assert.equal(result.rejected, false);
  if (result.rejected) return;
  assert.equal(result.events.length, 2, 'events must be existingEvents + the one new fx-conversion event, not just the new event');
  assert.ok(result.events.some(event => event.id === 'unrelated-event'), 'the pre-existing event must be echoed back — this is the complete merged Ledger, not a delta');
  assert.ok(result.events.some(event => event.id === result.event.id));
  // Simulating the correct App.tsx caller behavior: a single setState replace, never [...current.financialEvents, ...result.events].
  const nextFinancialEvents = result.events;
  assert.equal(nextFinancialEvents.filter(event => event.id === 'unrelated-event').length, 1, 'replace semantics must never duplicate a pre-existing Ledger event');
});

// --- Reconciliation: candidate / matched ---

test('reconcileTransactions: valid unconfirmed conversion legs are candidate, sharing the conversionId reason', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const results = reconcileTransactions({
    transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: [], opaqueTransactions: [envelope]
  });
  const source = results.find(r => r.transactionId === sourceLeg.id);
  const destination = results.find(r => r.transactionId === destinationLeg.id);
  assert.equal(source?.status, 'candidate');
  assert.equal(source?.reason, 'fx-conversion-contract-candidate');
  assert.equal(destination?.status, 'candidate');
  assert.equal(destination?.reason, 'fx-conversion-contract-candidate');
});

test('reconcileTransactions: after confirmation, both legs become matched via linked-fx-conversion', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const results = reconcileTransactions({
    transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: confirmed.events, opaqueTransactions: [envelope]
  });
  const source = results.find(r => r.transactionId === sourceLeg.id);
  const destination = results.find(r => r.transactionId === destinationLeg.id);
  assert.equal(source?.status, 'matched');
  assert.equal(source?.reason, 'linked-fx-conversion');
  assert.equal(destination?.status, 'matched');
  assert.equal(destination?.reason, 'linked-fx-conversion');
});

test('reconcileTransactions: malformed/unresolved conversion stays unsupported even though fx-conversion capability now exists', () => {
  const { sourceLeg, envelope } = buildValidConversion();
  const results = reconcileTransactions({
    transactions: [sourceLeg], accounts: financialAccounts, ledgerEvents: [], opaqueTransactions: [envelope]
  });
  const source = results.find(r => r.transactionId === sourceLeg.id);
  assert.equal(source?.status, 'unsupported');
  assert.equal(source?.reason, 'fx-attribution-unsupported');
});

test('reconcileTransactions: no active envelope (opaqueTransactions omitted) fails closed to unsupported, never candidate', () => {
  const { sourceLeg, destinationLeg } = buildValidConversion();
  const results = reconcileTransactions({ transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: [] });
  assert.equal(results.find(r => r.transactionId === sourceLeg.id)?.status, 'unsupported');
});

// --- Contribution / composition ---

test('composeRuntimeNetWorthAttribution: a confirmed fx-conversion event contributes exactly 0 and is excluded', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const composition = composeRuntimeNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 1_000_000),
    closingSnapshot: snapshot('2026-08-20', 1_000_000),
    ledgerEvents: confirmed.events,
    transactions: [sourceLeg, destinationLeg],
    accounts: financialAccounts,
    opaqueTransactions: [envelope]
  });
  const classification = composition.eventClassifications.find(item => item.id === confirmed.event.id);
  assert.equal(classification?.disposition, 'excluded');
  assert.equal(classification?.contribution, 0);
  assert.equal(composition.ledgerContribution, 0);
  assert.equal(composition.unexplainedResidual, 0);
});

test('deriveNetWorthAttributionFromEvidence: fx-conversion is classified zero-effect regardless of face amount', () => {
  const result = deriveNetWorthAttributionFromEvidence({
    openingSnapshot: snapshot('2026-08-01', 500_000),
    closingSnapshot: snapshot('2026-08-02', 500_000),
    evidence: [{ id: 'e1', type: 'fx-conversion', status: 'posted', amount: 999_999, provenance: 'ledger' }]
  });
  assert.equal(result.eventClassifications[0]?.disposition, 'excluded');
  assert.equal(result.eventClassifications[0]?.contribution, 0);
});

test('unconfirmed FX candidate produces no runtime derived evidence contribution (unlike safe-taxonomy-candidate types)', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const composition = composeRuntimeNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 1_000_000),
    closingSnapshot: snapshot('2026-08-20', 968_000),
    ledgerEvents: [],
    transactions: [sourceLeg, destinationLeg],
    accounts: financialAccounts,
    opaqueTransactions: [envelope]
  });
  assert.equal(composition.derivedContribution, 0);
  assert.ok(!composition.eventClassifications.some(item => item.provenance === 'derived-transaction' && (item.id === sourceLeg.id || item.id === destinationLeg.id)));
});

// --- Void / reconfirmation ---

test('void: a confirmed fx-conversion event, once voided, releases the conversion back to candidate', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const voided = buildVoidEvent(confirmed.events, { eventId: confirmed.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const events = [...confirmed.events, voided.event];
  const results = reconcileTransactions({ transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: events, opaqueTransactions: [envelope] });
  assert.equal(results.find(r => r.transactionId === sourceLeg.id)?.status, 'candidate');
  assert.equal(results.find(r => r.transactionId === sourceLeg.id)?.reason, 'fx-conversion-contract-candidate');
});

test('void: the voided event no longer contributes to composeRuntimeNetWorthAttribution', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const voided = buildVoidEvent(confirmed.events, { eventId: confirmed.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const events = [...confirmed.events, voided.event];
  const composition = composeRuntimeNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 1_000_000), closingSnapshot: snapshot('2026-08-20', 1_000_000),
    ledgerEvents: events, transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, opaqueTransactions: [envelope]
  });
  assert.ok(!composition.eventClassifications.some(item => item.id === confirmed.event.id));
});

test('reconfirmation after void creates a new event id, never resurrecting the old one', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const first = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(first.rejected, false);
  if (first.rejected) return;
  const voided = buildVoidEvent(first.events, { eventId: first.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const afterVoid = [...first.events, voided.event];
  const second = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg], now: '2026-08-17T00:00:00.000Z' }, afterVoid, new Map([[envelope.id, envelope]]));
  assert.equal(second.rejected, false);
  if (second.rejected) return;
  assert.notEqual(second.event.id, first.event.id);
  const resolution = resolveActiveFxConversionGroups(second.events, new Map([[sourceLeg.id, sourceLeg], [destinationLeg.id, destinationLeg]]), new Map([[envelope.id, envelope]]));
  assert.ok(resolution.validEventIds.has(second.event.id));
  assert.ok(!resolution.validEventIds.has(first.event.id));
});

// --- Confirmed delete guard ---

test('buildFxConversionDeletion: unconfirmed conversion is still deletable (unchanged F2C-2 behavior)', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const plan = buildFxConversionDeletion(envelope, [sourceLeg, destinationLeg], []);
  assert.equal(plan.status, 'success');
});

test('buildFxConversionDeletion: confirmed conversion is blocked from hard delete', () => {
  const { sourceLeg, destinationLeg, envelope, conversionId } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const plan = buildFxConversionDeletion(envelope, [sourceLeg, destinationLeg], confirmed.events);
  assert.equal(plan.status, 'confirmed-delete-blocked');
  if (plan.status === 'confirmed-delete-blocked') assert.equal(plan.conversionId, conversionId);
});

test('buildFxConversionDeletion: after voiding the confirmation, the conversion becomes deletable again', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const voided = buildVoidEvent(confirmed.events, { eventId: confirmed.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const plan = buildFxConversionDeletion(envelope, [sourceLeg, destinationLeg], [...confirmed.events, voided.event]);
  assert.equal(plan.status, 'success');
});

test('buildFxConversionDeletion: omitting financialEvents (legacy call signature) defaults to unconfirmed/deletable behavior', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const plan = buildFxConversionDeletion(envelope, [sourceLeg, destinationLeg]);
  assert.equal(plan.status, 'success');
});

// --- Schema / normalization / Backup round-trip ---

test('normalizeFinancialEventLedger: a valid fx-conversion event round-trips with its fxConversionLink intact', () => {
  const { sourceLeg, destinationLeg, envelope, conversionId } = buildValidConversion();
  const built = buildFxConversionAttributionConfirmation({ envelope, transactions: [sourceLeg, destinationLeg] });
  assert.equal(built.rejected, false);
  if (built.rejected) return;
  const context = referenceContext([sourceLeg, destinationLeg]);
  const ledger = normalizeFinancialEventLedger({ financialEventSchemaVersion: 3, financialEvents: [built.event] }, context);
  assert.equal(ledger.supported, true);
  assert.equal(ledger.skipped.length, 0);
  assert.equal(ledger.events.length, 1);
  assert.deepEqual(ledger.events[0]?.fxConversionLink, { conversionId, sourceTransactionId: sourceLeg.id, destinationTransactionId: destinationLeg.id });
});

test('normalizeFinancialEventLedger: malformed fxConversionLink (missing field) is skipped, not silently coerced', () => {
  const { sourceLeg, destinationLeg } = buildValidConversion();
  const context = referenceContext([sourceLeg, destinationLeg]);
  const malformed = {
    id: 'evt-1', type: 'fx-conversion', status: 'posted', source: 'attribution-confirmation',
    effectiveDate: '2026-08-14', amount: 32000, currency: 'TWD', accountId: 'acc-twd', transactionId: sourceLeg.id,
    fxConversionLink: { conversionId: 'c1' }, // missing sourceTransactionId/destinationTransactionId
    note: '', ...audit
  };
  const ledger = normalizeFinancialEventLedger({ financialEventSchemaVersion: 3, financialEvents: [malformed] }, context);
  assert.equal(ledger.events.length, 0);
  assert.equal(ledger.skipped.length, 1);
});

test('normalizeFinancialEventLedger: fx-conversion event without fxConversionLink is skipped', () => {
  const { sourceLeg, destinationLeg } = buildValidConversion();
  const context = referenceContext([sourceLeg, destinationLeg]);
  const malformed = {
    id: 'evt-1', type: 'fx-conversion', status: 'posted', source: 'attribution-confirmation',
    effectiveDate: '2026-08-14', amount: 32000, currency: 'TWD', accountId: 'acc-twd', transactionId: sourceLeg.id,
    note: '', ...audit
  };
  const ledger = normalizeFinancialEventLedger({ financialEventSchemaVersion: 3, financialEvents: [malformed] }, context);
  assert.equal(ledger.events.length, 0);
});

test('normalizeFinancialEventLedger: fxConversionLink is rejected on a v2 (pre-v3) Ledger — old-version compatibility fail-safe', () => {
  const { sourceLeg, destinationLeg } = buildValidConversion();
  const context = referenceContext([sourceLeg, destinationLeg]);
  const event = {
    id: 'evt-1', type: 'fx-conversion', status: 'posted', source: 'attribution-confirmation',
    effectiveDate: '2026-08-14', amount: 32000, currency: 'TWD', accountId: 'acc-twd', transactionId: sourceLeg.id,
    fxConversionLink: { conversionId: 'c1', sourceTransactionId: sourceLeg.id, destinationTransactionId: destinationLeg.id },
    note: '', ...audit
  };
  const ledger = normalizeFinancialEventLedger({ financialEventSchemaVersion: 2, financialEvents: [event] }, context, { supportedSchemaVersions: [1, 2, 3] });
  assert.equal(ledger.events.length, 0, 'a v2 Ledger must not accept a v3-only fxConversionLink');
});

test('normalizeFinancialEventLedger: an unrecognized fx-conversion type from a future/unsupported schema fails safe (opaque, not misclassified)', () => {
  const ledger = normalizeFinancialEventLedger({ financialEventSchemaVersion: 4, financialEvents: [{ type: 'fx-conversion' }] }, referenceContext([]), { supportedSchemaVersions: [1, 2, 3] });
  assert.equal(ledger.supported, false, 'a schema version this build does not support must stay opaque, never interpreted');
});

test('fxConversionLink and componentLink/splitAllocationLink are mutually exclusive', () => {
  const { sourceLeg, destinationLeg } = buildValidConversion();
  const context = referenceContext([sourceLeg, destinationLeg]);
  const event = {
    id: 'evt-1', type: 'fx-conversion', status: 'posted', source: 'attribution-confirmation',
    effectiveDate: '2026-08-14', amount: 32000, currency: 'TWD', accountId: 'acc-twd', transactionId: sourceLeg.id,
    fxConversionLink: { conversionId: 'c1', sourceTransactionId: sourceLeg.id, destinationTransactionId: destinationLeg.id },
    splitAllocationLink: { domain: 'other', allocationGroupId: 'g1', componentId: 'c1' },
    note: '', ...audit
  };
  const ledger = normalizeFinancialEventLedger({ financialEventSchemaVersion: 3, financialEvents: [event] }, context);
  assert.equal(ledger.events.length, 0);
});

test('appendFinancialEvent: a plain fx-conversion event is accepted through the single-event write path (no group primitive needed)', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const built = buildFxConversionAttributionConfirmation({ envelope, transactions: [sourceLeg, destinationLeg] });
  assert.equal(built.rejected, false);
  if (built.rejected) return;
  const appended = appendFinancialEvent([], built.event);
  assert.equal(appended.rejected, false);
});

// --- Fee / valuation non-scope (documents the explicit F2D boundary) ---

test('fee treatment is untouched by F2D: an explicit-fee-linked ordinary transaction is unaffected by the fx-conversion event', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const feeTransaction: FinancialTransaction = {
    id: 'fee-1', accountId: 'acc-twd', type: 'expense', status: 'posted', source: 'manual', amount: 100,
    currency: 'TWD', categoryId: 'expense-other', description: '', merchant: '', note: '',
    occurredAt: '2026-08-14T00:00:00.000Z', fingerprint: '', excluded: false, ...audit
  };
  const results = reconcileTransactions({
    transactions: [sourceLeg, destinationLeg, feeTransaction], accounts: financialAccounts, ledgerEvents: [], opaqueTransactions: [envelope]
  });
  const fee = results.find(r => r.transactionId === feeTransaction.id);
  assert.equal(fee?.status, 'candidate');
  assert.equal(fee?.reason, 'safe-taxonomy-candidate');
  assert.equal(fee?.eventType, 'external-expense');
});

test('valuation separation: closing-rate changes are not attributed to the fx-conversion event — contribution stays 0 regardless of net-worth movement', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  // Simulate a rate move: closing net worth is 33,000 higher than opening (e.g. USD 1,000 leg revalued at 33 instead of 32).
  const composition = composeRuntimeNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 1_000_000),
    closingSnapshot: snapshot('2026-08-20', 1_001_000),
    ledgerEvents: confirmed.events, transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, opaqueTransactions: [envelope]
  });
  const classification = composition.eventClassifications.find(item => item.id === confirmed.event.id);
  assert.equal(classification?.contribution, 0, 'the conversion event itself must never absorb a valuation-driven residual');
  assert.equal(composition.unexplainedResidual, 1000, 'the rate-change effect must remain in unexplainedResidual, not be misattributed to the conversion');
});

// --- Full end-to-end state machine ---

test('E2E: candidate -> confirm -> matched -> contribution 0 -> void -> candidate -> reconfirm -> matched', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);

  let events: FinancialEvent[] = [];
  let reconciliation = reconcileTransactions({ transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: events, opaqueTransactions: [envelope] });
  assert.equal(reconciliation.find(r => r.transactionId === sourceLeg.id)?.status, 'candidate');

  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, events, opaqueTransactionsById);
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  events = confirmed.events;

  reconciliation = reconcileTransactions({ transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: events, opaqueTransactions: [envelope] });
  assert.equal(reconciliation.find(r => r.transactionId === sourceLeg.id)?.status, 'matched');

  const composition = composeRuntimeNetWorthAttribution({
    openingSnapshot: snapshot('2026-08-01', 1_000_000), closingSnapshot: snapshot('2026-08-20', 1_000_000),
    ledgerEvents: events, transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, opaqueTransactions: [envelope]
  });
  assert.equal(composition.ledgerContribution, 0);

  const voided = buildVoidEvent(events, { eventId: confirmed.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  events = [...events, voided.event];

  reconciliation = reconcileTransactions({ transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: events, opaqueTransactions: [envelope] });
  assert.equal(reconciliation.find(r => r.transactionId === sourceLeg.id)?.status, 'candidate');

  const reconfirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg], now: '2026-08-17T00:00:00.000Z' }, events, opaqueTransactionsById);
  assert.equal(reconfirmed.rejected, false);
  if (reconfirmed.rejected) return;
  events = reconfirmed.events;

  reconciliation = reconcileTransactions({ transactions: [sourceLeg, destinationLeg], accounts: financialAccounts, ledgerEvents: events, opaqueTransactions: [envelope] });
  assert.equal(reconciliation.find(r => r.transactionId === sourceLeg.id)?.status, 'matched');
});

test('E2E: attempting raw delete on a confirmed conversion is blocked throughout the confirmed window', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const plan = buildFxConversionDeletion(envelope, [sourceLeg, destinationLeg], confirmed.events);
  assert.equal(plan.status, 'confirmed-delete-blocked');
});

// --- Cross-domain resolver isolation ---

test('resolveActiveFxConversionGroups only recognizes fx-conversion/attribution-confirmation events, ignoring Loan/Generic Split shaped events entirely', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const loanShapedEvent: FinancialEvent = {
    id: 'loan-evt', type: 'loan-principal-payment', status: 'posted', source: 'attribution-confirmation',
    effectiveDate: '2026-08-14', amount: 1000, currency: 'TWD', accountId: 'acc-twd', loanId: 'loan-1',
    transactionId: sourceLeg.id,
    componentLink: { domain: 'loan-payment', paymentId: 'p1', componentId: 'c1', confirmationGroupId: 'g1' },
    note: '', ...audit
  };
  const resolution = resolveActiveFxConversionGroups([loanShapedEvent], new Map([[sourceLeg.id, sourceLeg], [destinationLeg.id, destinationLeg]]), new Map([[envelope.id, envelope]]));
  assert.equal(resolution.validEventIds.size, 0);
  assert.equal(resolution.confirmedConversionIds.size, 0);
});
