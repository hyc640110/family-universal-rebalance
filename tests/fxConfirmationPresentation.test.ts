import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveFxConfirmationGroupPresentations } from '../src/lib/fxConfirmationPresentation';
import { confirmFxConversionAndAppend } from '../src/lib/fxConversionAttributionConfirmation';
import { buildVoidEvent } from '../src/lib/financialEventVoid';
import { buildFxConversionCreation, type FxConversionCreationContext, type FxConversionCreationInput } from '../src/lib/fxConversionProducer';
import type { FinancialEvent } from '../src/lib/financialEvents';
import type { AccountReference, OpaqueFinancialTransactionEnvelope } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-14T00:00:00.000Z', updatedAt: '2026-08-14T00:00:00.000Z' };
const producerAccounts: AccountReference[] = [
  { id: 'acc-twd', currency: 'TWD', isActive: true },
  { id: 'acc-usd', currency: 'USD', isActive: true }
];

function baseInput(overrides: Partial<FxConversionCreationInput> = {}): FxConversionCreationInput {
  return { sourceAccountId: 'acc-twd', sourceAmount: 32000, destinationAccountId: 'acc-usd', destinationAmount: 1000, effectiveDate: '2026-08-14', feeTreatment: { type: 'unknown' }, ...overrides };
}
function baseContext(overrides: Partial<FxConversionCreationContext> = {}): FxConversionCreationContext {
  return { accounts: producerAccounts, transactions: [], opaqueTransactions: [], gateEnabled: true, timestamp: '2026-08-14T00:00:00.000Z', ...overrides };
}
function buildValidConversion(overrides: Partial<FxConversionCreationInput> = {}) {
  const result = buildFxConversionCreation(baseInput(overrides), baseContext());
  assert.equal(result.status, 'success');
  if (result.status !== 'success') throw new Error('fixture build failed');
  return result;
}

// --- 1-3: complete pair, group-by-conversionId, source/destination data ---

test('1-3. a valid pair produces exactly one row with correct source/destination/rate', () => {
  const { sourceLeg, destinationLeg, envelope, conversionId } = buildValidConversion();
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg], opaqueTransactions: [envelope], ledgerEvents: [] });
  assert.equal(rows.length, 1);
  const row = rows[0]!;
  assert.equal(row.conversionId, conversionId);
  assert.equal(row.sourceAccountId, 'acc-twd');
  assert.equal(row.sourceAmount, 32000);
  assert.equal(row.sourceCurrency, 'TWD');
  assert.equal(row.destinationAccountId, 'acc-usd');
  assert.equal(row.destinationAmount, 1000);
  assert.equal(row.destinationCurrency, 'USD');
  assert.equal(row.executedRate, 32);
});

// --- 4-7: fee four states ---

test('4. fee none', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion({ feeTreatment: { type: 'none' } });
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg], opaqueTransactions: [envelope], ledgerEvents: [] });
  assert.equal(rows[0]?.feeResolution.status, 'none');
});

test('5. fee explicit resolves the linked transaction amount', () => {
  const feeTransaction = { id: 'fee-txn', accountId: 'acc-twd', type: 'expense' as const, status: 'posted' as const, source: 'manual' as const, amount: 30, currency: 'TWD', categoryId: 'expense-other', description: '', merchant: '', note: '', occurredAt: '2026-08-14T00:00:00.000Z', fingerprint: '', excluded: false, ...audit };
  const result = buildFxConversionCreation(
    baseInput({ feeTreatment: { type: 'explicit', feeTransactionId: 'fee-txn' } }),
    baseContext({ transactions: [feeTransaction] })
  );
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const { sourceLeg, destinationLeg, envelope } = result;
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg, feeTransaction], opaqueTransactions: [envelope], ledgerEvents: [] });
  assert.equal(rows[0]?.feeResolution.status, 'explicit-resolved');
  assert.equal(rows[0]?.feeTransactionAmount, 30);
  assert.equal(rows[0]?.feeTransactionCurrency, 'TWD');
});

test('6. fee included', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion({ feeTreatment: { type: 'included' } });
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg], opaqueTransactions: [envelope], ledgerEvents: [] });
  assert.equal(rows[0]?.feeResolution.status, 'included');
});

test('7. fee unknown — never coerced to none/0', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion({ feeTreatment: { type: 'unknown' } });
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg], opaqueTransactions: [envelope], ledgerEvents: [] });
  assert.equal(rows[0]?.feeResolution.status, 'unknown');
});

// --- 8-9: candidate / matched ---

test('8. unconfirmed pair is status=candidate, everConfirmed=false, no voidTargetEventId', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg], opaqueTransactions: [envelope], ledgerEvents: [] });
  assert.equal(rows[0]?.status, 'candidate');
  assert.equal(rows[0]?.everConfirmed, false);
  assert.equal(rows[0]?.voidTargetEventId, undefined);
});

test('9. confirmed pair is status=matched with voidTargetEventId pointing at the active event', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg], opaqueTransactions: [envelope], ledgerEvents: confirmed.events });
  assert.equal(rows[0]?.status, 'matched');
  assert.equal(rows[0]?.voidTargetEventId, confirmed.event.id);
});

// --- 10: voided -> 待重新確認 (everConfirmed=true, status back to candidate) ---

test('10. voided pair reverts to status=candidate with everConfirmed=true (distinguishable from never-confirmed)', () => {
  const { sourceLeg, destinationLeg, envelope } = buildValidConversion();
  const confirmed = confirmFxConversionAndAppend({ envelope, transactions: [sourceLeg, destinationLeg] }, [], new Map([[envelope.id, envelope]]));
  assert.equal(confirmed.rejected, false);
  if (confirmed.rejected) return;
  const voided = buildVoidEvent(confirmed.events, { eventId: confirmed.event.id, now: '2026-08-16T00:00:00.000Z' });
  assert.equal(voided.rejected, false);
  if (voided.rejected) return;
  const events: FinancialEvent[] = [...confirmed.events, voided.event];
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [sourceLeg, destinationLeg], opaqueTransactions: [envelope], ledgerEvents: events });
  assert.equal(rows[0]?.status, 'candidate');
  assert.equal(rows[0]?.everConfirmed, true);
  assert.equal(rows[0]?.voidTargetEventId, undefined);
});

// --- 11: invalid/unsupported pair excluded ---

test('11. an envelope with a missing linked transaction never produces a presentation row', () => {
  const { destinationLeg, envelope } = buildValidConversion();
  // sourceLeg intentionally omitted -> unsupported (missing-source-transaction)
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [destinationLeg], opaqueTransactions: [envelope], ledgerEvents: [] });
  assert.equal(rows.length, 0);
});

test('11b. a malformed opaque payload never produces a presentation row', () => {
  const malformed: OpaqueFinancialTransactionEnvelope = { transactionOpaqueEnvelopeVersion: 1, id: 'not-fx', payload: { kind: 'something-else' } };
  const rows = deriveFxConfirmationGroupPresentations({ transactions: [], opaqueTransactions: [malformed], ledgerEvents: [] });
  assert.equal(rows.length, 0);
});

// --- 12: duplicate conversion presentation does not duplicate ---

test('12. two envelopes claiming the same leg transaction are both excluded (duplicate), never shown twice or at all', () => {
  const first = buildValidConversion();
  // Second envelope claims the same sourceTransactionId as `first` -- a duplicate claim.
  const secondInput = baseInput({ sourceAccountId: 'acc-twd', destinationAccountId: 'acc-usd' });
  const second = buildFxConversionCreation(secondInput, baseContext({ transactions: [first.sourceLeg, first.destinationLeg] }));
  assert.equal(second.status, 'success');
  if (second.status !== 'success') return;
  // Force a duplicate claim by re-pointing the second envelope's payload at the first conversion's source leg.
  const duplicateEnvelope: OpaqueFinancialTransactionEnvelope = {
    ...second.envelope,
    payload: { ...(second.envelope.payload as Record<string, unknown>), sourceTransactionId: first.sourceLeg.id }
  };
  const rows = deriveFxConfirmationGroupPresentations({
    transactions: [first.sourceLeg, first.destinationLeg, second.sourceLeg, second.destinationLeg],
    opaqueTransactions: [first.envelope, duplicateEnvelope],
    ledgerEvents: []
  });
  assert.equal(rows.length, 0, 'both envelopes claim first.sourceLeg.id, so both must resolve duplicate and neither renders');
});
