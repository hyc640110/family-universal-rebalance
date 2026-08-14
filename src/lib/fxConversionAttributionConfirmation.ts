import { appendFinancialEvent, createFinancialEventId, type FinancialEvent } from './financialEvents';
import { resolveActiveFxConversionGroups, resolveFxConversionEnvelope, type FinancialEventFxConversionLink } from './fxConversionIdentity';
import type { FinancialTransaction, OpaqueFinancialTransactionEnvelope } from './transactions';

/**
 * UR-TODO-046 FX-F2D: converts one `valid`-resolved FX conversion into the single `fx-conversion`
 * FinancialEvent the user has explicitly confirmed. Unlike Loan's `buildLoanPaymentConfirmationGroup()`
 * (one transaction split into N component events), this always builds exactly one event for the
 * whole two-leg conversion — see fxConversionIdentity.ts's `FinancialEventFxConversionLink` doc
 * comment for why. `amount`/`currency`/`accountId`/`transactionId` are always the TWD leg's, so
 * this event is genuinely TWD-denominated and needs no exemption from any existing TWD-only or
 * amount/currency cross-check.
 */
export type FxConversionAttributionConfirmationInput = {
  envelope: OpaqueFinancialTransactionEnvelope;
  transactions: readonly FinancialTransaction[];
  /** Caller-supplied ISO UTC timestamp so this stays a pure, testable function. */
  now?: string;
};

export type FxConversionAttributionConfirmationResult =
  | { rejected: true; reason: string }
  | { rejected: false; event: FinancialEvent };

const FX_CONVERSION_CONFIRMATION_NOTE_PREFIX = 'UR-TODO-046 FX-F2D：使用者確認一次完整換匯記錄';

export function buildFxConversionAttributionConfirmation(input: FxConversionAttributionConfirmationInput): FxConversionAttributionConfirmationResult {
  const transactionsById = new Map(input.transactions.map(transaction => [transaction.id, transaction]));
  const resolution = resolveFxConversionEnvelope(input.envelope, transactionsById);
  if (!resolution || resolution.status !== 'valid') return { rejected: true, reason: '此換匯記錄尚未通過完整驗證，無法確認。' };

  const twdTransactionId = resolution.sourceCurrency === 'TWD' ? resolution.sourceTransactionId : resolution.destinationTransactionId;
  const twdTransaction = transactionsById.get(twdTransactionId);
  if (!twdTransaction) return { rejected: true, reason: '找不到新台幣腿交易，無法確認。' };

  const now = input.now || new Date().toISOString();
  const fxConversionLink: FinancialEventFxConversionLink = {
    conversionId: resolution.conversionId,
    sourceTransactionId: resolution.sourceTransactionId,
    destinationTransactionId: resolution.destinationTransactionId
  };
  const event: FinancialEvent = {
    id: createFinancialEventId(),
    type: 'fx-conversion',
    status: 'posted',
    source: 'attribution-confirmation',
    effectiveDate: resolution.effectiveDate,
    amount: twdTransaction.amount,
    currency: twdTransaction.currency.toUpperCase(),
    accountId: twdTransaction.accountId,
    transactionId: twdTransactionId,
    fxConversionLink,
    note: `${FX_CONVERSION_CONFIRMATION_NOTE_PREFIX}（${resolution.conversionId}，${now}）`,
    createdAt: now,
    updatedAt: now
  };
  return { rejected: false, event };
}

export type ConfirmFxConversionResult =
  | { rejected: true; reason: string }
  | { rejected: false; events: FinancialEvent[]; event: FinancialEvent };

/**
 * Validates again at append time (build → append → re-resolve the whole active set) so a race or
 * stale UI state can never persist two active confirmations for the same `conversionId` — mirrors
 * `confirmLoanPaymentGroupAndAppend()`'s same-shaped safety net, but reuses the plain, single-event
 * `appendFinancialEvent()` write path since an FX conversion is exactly one event, never a group.
 */
export function confirmFxConversionAndAppend(
  input: FxConversionAttributionConfirmationInput,
  existingEvents: readonly FinancialEvent[],
  opaqueTransactionsById: ReadonlyMap<string, OpaqueFinancialTransactionEnvelope>
): ConfirmFxConversionResult {
  const built = buildFxConversionAttributionConfirmation(input);
  if (built.rejected) return built;
  const appended = appendFinancialEvent(existingEvents, built.event);
  if (appended.rejected) return appended;
  const transactionsById = new Map(input.transactions.map(transaction => [transaction.id, transaction]));
  const resolution = resolveActiveFxConversionGroups(appended.events, transactionsById, opaqueTransactionsById);
  if (!resolution.validEventIds.has(built.event.id)) {
    return { rejected: true, reason: '這筆換匯記錄已有其他有效確認紀錄，無法重複確認。' };
  }
  return { rejected: false, events: appended.events, event: built.event };
}
