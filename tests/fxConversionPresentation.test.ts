import assert from 'node:assert/strict';
import test from 'node:test';
import type { FinancialEvent } from '../src/lib/financialEvents';
import { confirmFxConversionAndAppend } from '../src/lib/fxConversionAttributionConfirmation';
import { buildFxConversionCreation, type FxConversionCreationContext, type FxConversionCreationInput } from '../src/lib/fxConversionProducer';
import { buildVoidEvent } from '../src/lib/financialEventVoid';
import { deriveFxConversionPresentations } from '../src/lib/fxConversionPresentation';
import type { AccountReference, OpaqueFinancialTransactionEnvelope } from '../src/lib/transactions';

// UR-TODO-054-B: characterization tests for the FX Confirmation UI's presentation selector, and a
// dedicated regression lock for the App.tsx write-path direction risk called out in the dev
// instructions (confirmFxConversionAndAppend's `events` is the FULL merged Ledger, unlike Loan's
// confirmLoanPaymentGroupAndAppend which returns only the newly-built group).

const audit = { createdAt: '2026-08-15T00:00:00.000Z', updatedAt: '2026-08-15T00:00:00.000Z' };

const producerAccounts: AccountReference[] = [
  { id: 'acc-twd', currency: 'TWD', isActive: true },
  { id: 'acc-usd', currency: 'USD', isActive: true }
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

// --- 兩腿正確合併顯示為 1 項 ---

test('two independently-reconciled legs collapse into exactly one presentation row, with both currencies/amounts', () => {
  const { sourceLeg, destinationLeg, envelope, conversionId } = buildValidConversion();
  const rows = deriveFxConversionPresentations({
    opaqueTransactions: [envelope], transactions: [sourceLeg, destinationLeg], ledgerEvents: []
  });
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.conversionId, conversionId);
  assert.equal(row.sourceTransactionId, sourceLeg.id);
  assert.equal(row.destinationTransactionId, destinationLeg.id);
  assert.equal(row.sourceCurrency, 'TWD');
  assert.equal(row.destinationCurrency, 'USD');
  assert.equal(row.sourceAmount, 32000);
  assert.equal(row.destinationAmount, 1000);
  assert.equal(row.status, 'candidate');
  assert.equal(row.everConfirmed, false);
  assert.equal(row.voidTargetEventId, undefined);
});

test('multiple distinct conversions each produce their own single row, never cross-merged', () => {
  const first = buildValidConversion();
  const second = buildFxConversionCreation(baseInput({ sourceAmount: 64000, destinationAmount: 2000 }), baseContext({ transactions: [first.sourceLeg, first.destinationLeg], opaqueTransactions: [first.envelope] }));
  assert.equal(second.status, 'success');
  if (second.status !== 'success') return;
  const rows = deriveFxConversionPresentations({
    opaqueTransactions: [first.envelope, second.envelope],
    transactions: [first.sourceLeg, first.destinationLeg, second.sourceLeg, second.destinationLeg],
    ledgerEvents: []
  });
  assert.equal(rows.length, 2);
  assert.deepEqual(new Set(rows.map(row => row.conversionId)), new Set([first.conversionId, second.conversionId]));
});

// --- confirm 成功後正確更新（含關鍵的 events 疊加方向）---

test('confirm updates the presentation row from candidate to matched with a voidTargetEventId', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], opaqueTransactionsById);
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const rows = deriveFxConversionPresentations({
    opaqueTransactions: [envelope], transactions: [sourceLeg, destinationLeg], ledgerEvents: confirmed.events
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.status, 'matched');
  assert.equal(rows[0]!.everConfirmed, true);
  assert.equal(rows[0]!.voidTargetEventId, confirmed.event.id);
});

test('CRITICAL: confirmFxConversionAndAppend returns the FULL merged Ledger, not a delta to append — appending it onto the existing array (the Loan pattern) would silently duplicate every prior event', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const priorEvent: FinancialEvent = { id: 'prior-unrelated-event', type: 'adjustment', status: 'posted', source: 'manual', effectiveDate: '2026-08-10', amount: 500, currency: 'TWD', accountId: 'acc-twd', note: '與本次換匯無關的既有事件', ...audit };
  const existingEvents = [priorEvent];
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);
  const result = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, existingEvents, opaqueTransactionsById);
  assert.equal(result.rejected, false);
  if (result.rejected) return;

  // result.events IS the correct new state.financialEvents value — it already contains the prior
  // event plus exactly the one new fx-conversion event. This is what App.tsx's
  // confirmFxConversion() handler must assign directly (financialEvents: result.events).
  assert.equal(result.events.length, existingEvents.length + 1);
  assert.equal(result.events.filter(event => event.id === priorEvent.id).length, 1, 'the prior event must appear exactly once in the correct (replace) result');
  assert.ok(result.events.some(event => event.id === result.event.id), 'the new fx-conversion event must be present in result.events');

  // Simulating the WRONG (Loan-style append) pattern the dev instructions explicitly warn against:
  // [...current.financialEvents, ...result.events]. This is the exact bug that must never ship.
  const wronglyAppended = [...existingEvents, ...result.events];
  assert.equal(wronglyAppended.length, existingEvents.length + result.events.length);
  assert.equal(wronglyAppended.filter(event => event.id === priorEvent.id).length, 2, 'the WRONG append pattern duplicates the prior event — proof the two write strategies are NOT interchangeable for FX');
  assert.notEqual(wronglyAppended.length, result.events.length, 'replace and append must diverge in length here, unlike a scenario where they would coincidentally match');
});

// --- void 後兩腿一併回到 candidate ---

test('void reverts the presentation row from matched back to candidate, and both legs reconcile as candidate again', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], opaqueTransactionsById);
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;

  const voided = buildVoidEvent(confirmed.events, { eventId: confirmed.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const eventsAfterVoid = [...confirmed.events, voided.event];

  const rows = deriveFxConversionPresentations({ opaqueTransactions: [envelope], transactions: [sourceLeg, destinationLeg], ledgerEvents: eventsAfterVoid });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.status, 'candidate');
  assert.equal(rows[0]!.everConfirmed, true, 'everConfirmed stays true after a void — distinct from never having been confirmed');
  assert.equal(rows[0]!.voidTargetEventId, undefined, 'a candidate row must never carry a stale void target');
});

// --- reconfirm 產生新 event id 且正確更新整組 ---

test('reconfirming after a void produces a fresh event id and the presentation row points at the new one', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const opaqueTransactionsById = new Map([[envelope.id, envelope]]);
  const first = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], opaqueTransactionsById);
  assert.equal(first.rejected, false);
  if (first.rejected) return;
  const voided = buildVoidEvent(first.events, { eventId: first.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const afterVoid = [...first.events, voided.event];

  const second = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg], now: '2026-08-17T00:00:00.000Z' }, afterVoid, opaqueTransactionsById);
  assert.equal(second.rejected, false);
  if (second.rejected) return;
  assert.notEqual(second.event.id, first.event.id, 'reconfirmation must never resurrect the old event id');

  const rows = deriveFxConversionPresentations({ opaqueTransactions: [envelope], transactions: [sourceLeg, destinationLeg], ledgerEvents: second.events });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.status, 'matched');
  assert.equal(rows[0]!.voidTargetEventId, second.event.id, 'the void target must point at the fresh event, never the voided old one');
});

// --- 只有一腿有效資料時的防呆顯示 ---

test('a conversion whose destination leg transaction is missing is skipped entirely, never shown as a partial/broken row', () => {
  const { sourceLeg, envelope } = buildValidConversion();
  const rows = deriveFxConversionPresentations({
    opaqueTransactions: [envelope], transactions: [sourceLeg] /* destinationLeg omitted */, ledgerEvents: []
  });
  assert.equal(rows.length, 0);
});

test('a conversion with a mismatched leg amount (payload no longer matches the linked transaction) is skipped, not shown with stale data', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const tamperedDestinationLeg = { ...destinationLeg, amount: destinationLeg.amount + 1 };
  const rows = deriveFxConversionPresentations({
    opaqueTransactions: [envelope], transactions: [sourceLeg, tamperedDestinationLeg], ledgerEvents: []
  });
  assert.equal(rows.length, 0);
});

test('an envelope whose payload is not an FX conversion at all is silently ignored (F1A opaque preservation stays lossless elsewhere; this selector just never surfaces it)', () => {
  const notFxEnvelope: OpaqueFinancialTransactionEnvelope = { transactionOpaqueEnvelopeVersion: 1, id: 'unrelated-envelope', payload: { kind: 'something-else' } };
  const rows = deriveFxConversionPresentations({ opaqueTransactions: [notFxEnvelope], transactions: [], ledgerEvents: [] });
  assert.equal(rows.length, 0);
});

// UR-TODO-054-B, carried forward from the closed PR #333 Closeout Audit: this selector uses
// resolveFxConversions() (cross-envelope duplicate-claim detection), not the single-envelope
// resolveFxConversionEnvelope() — otherwise two envelopes claiming the same leg transaction would
// each independently resolve 'valid' and both render as separately-confirmable candidates for the
// same underlying transactions.
test('two envelopes claiming the same leg transaction are both excluded (duplicate), never shown twice or at all', () => {
  const first = buildValidConversion();
  const second = buildFxConversionCreation(baseInput(), baseContext({ transactions: [first.sourceLeg, first.destinationLeg] }));
  assert.equal(second.status, 'success');
  if (second.status !== 'success') return;
  // Force a duplicate claim by re-pointing the second envelope's payload at the first conversion's source leg.
  const duplicateEnvelope: OpaqueFinancialTransactionEnvelope = {
    ...second.envelope,
    payload: { ...(second.envelope.payload as Record<string, unknown>), sourceTransactionId: first.sourceLeg.id }
  };
  const rows = deriveFxConversionPresentations({
    transactions: [first.sourceLeg, first.destinationLeg, second.sourceLeg, second.destinationLeg],
    opaqueTransactions: [first.envelope, duplicateEnvelope],
    ledgerEvents: []
  });
  assert.equal(rows.length, 0, 'both envelopes claim first.sourceLeg.id, so both must resolve duplicate and neither renders');
});
