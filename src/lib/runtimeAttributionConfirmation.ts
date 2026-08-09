import { appendFinancialEvent, createFinancialEventId, linkedTransactionReason, type FinancialEvent, type FinancialEventType } from './financialEvents';
import type { FinancialTransaction } from './transactions';

/**
 * Deliberately typed against the broad FinancialEventType (not
 * DerivedAttributionEvidence['category'], which is narrower) so callers that
 * only have a presentation-layer RuntimeAttributionEvidenceItem.type (itself
 * FinancialEventType | undefined) don't need an unsafe cast. Any type outside
 * the taxonomy linkedTransactionReason() recognizes is rejected at runtime
 * with an explicit reason — this type is not the enforcement boundary.
 */
export type AttributionConfirmationEvidenceInput = {
  transactionId: string;
  effectiveDate: string;
  category: FinancialEventType;
  amount: number;
};

export type AttributionConfirmationInput = {
  evidence: AttributionConfirmationEvidenceInput;
  transaction: FinancialTransaction;
  /** Caller-supplied ISO UTC timestamp so this stays a pure, testable function. */
  now: string;
};

export type AttributionConfirmationResult =
  | { rejected: false; event: FinancialEvent }
  | { rejected: true; reason: string };

const ATTRIBUTION_CONFIRMATION_NOTE_PREFIX = 'UR-TODO-046-C3C-C：使用者於「淨值成長來源歸因」卡片按下「確認並正式記帳」';

/**
 * Converts one C3B/C3C-A derived-transaction attribution evidence row
 * (runtime-only, see derivedAttributionEvidence.ts) into a FinancialEvent the
 * user has explicitly confirmed. Re-runs the identical linkedTransactionReason()
 * taxonomy check the Ledger normalizer applies on every read, so a
 * confirmation can never produce an event that would later fail validation —
 * if the underlying transaction no longer satisfies the taxonomy (e.g. it was
 * edited or excluded between render and click), this rejects with an
 * explicit reason instead of silently building an event that would be
 * dropped on the next reload.
 */
export function buildAttributionConfirmationEvent(input: AttributionConfirmationInput): AttributionConfirmationResult {
  const { evidence, transaction, now } = input;
  if (evidence.transactionId !== transaction.id) {
    return { rejected: true, reason: '衍生證據與交易資料不一致（transactionId 不符），請重新整理後再試一次。' };
  }

  const type = evidence.category;
  const status = 'posted' as const;
  const amount = evidence.amount;
  const currency = transaction.currency.toUpperCase();
  const accountId = transaction.accountId;
  const counterpartyAccountId = type === 'internal-transfer' ? transaction.transferAccountId : undefined;
  const effectiveDate = evidence.effectiveDate;

  const reason = linkedTransactionReason(type, status, amount, currency, accountId, counterpartyAccountId, effectiveDate, transaction);
  if (reason) return { rejected: true, reason: `無法確認此筆證據：${reason}` };

  const event: FinancialEvent = {
    id: createFinancialEventId(),
    type,
    status,
    source: 'attribution-confirmation',
    effectiveDate,
    amount,
    currency,
    accountId,
    ...(transaction.investmentAttribution?.kind === 'trade'
      ? { assetSymbol: transaction.investmentAttribution.assetSymbol }
      : {}),
    ...(counterpartyAccountId ? { counterpartyAccountId } : {}),
    transactionId: transaction.id,
    note: `${ATTRIBUTION_CONFIRMATION_NOTE_PREFIX}（${now}）`,
    createdAt: now,
    updatedAt: now
  };

  return { rejected: false, event };
}

export type ConfirmAndAppendResult =
  | { rejected: false; events: FinancialEvent[]; event: FinancialEvent }
  | { rejected: true; reason: string };

/**
 * Convenience wrapper composing buildAttributionConfirmationEvent() with the
 * forward-only appendFinancialEvent() write guard, so callers (App.tsx) have
 * one entry point that either yields the next state.financialEvents array or
 * a single explicit rejection reason.
 */
export function confirmAttributionEvidenceAndAppend(input: AttributionConfirmationInput, existingEvents: readonly FinancialEvent[]): ConfirmAndAppendResult {
  const built = buildAttributionConfirmationEvent(input);
  if (built.rejected) return built;
  const appended = appendFinancialEvent(existingEvents, built.event);
  if (appended.rejected) return appended;
  return { rejected: false, events: appended.events, event: built.event };
}
