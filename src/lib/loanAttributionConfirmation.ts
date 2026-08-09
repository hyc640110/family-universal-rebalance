import { appendFinancialEventGroup, createFinancialEventId, type FinancialEvent, type FinancialEventReferenceContext } from './financialEvents';
import { validateLoanAttribution } from './loanAttribution';
import type { FinancialTransaction } from './transactions';
import { canonicalCalendarDay } from './calendarDay';

export type LoanPaymentConfirmationInput = {
  transaction: FinancialTransaction;
  transactions: readonly FinancialTransaction[];
  loanIds: ReadonlySet<string>;
  now?: string;
};

export type LoanPaymentConfirmationResult =
  | { rejected: true; reason: string }
  | { rejected: false; confirmationGroupId: string; events: FinancialEvent[] };

export function buildLoanPaymentConfirmationGroup(input: LoanPaymentConfirmationInput): LoanPaymentConfirmationResult {
  const checked = validateLoanAttribution(input);
  if (checked.status !== 'valid' || checked.attribution.kind !== 'repayment') return { rejected: true, reason: checked.status === 'unsupported' ? checked.reason : 'transaction 並非完整 Loan repayment contract' };
  const now = input.now || new Date().toISOString();
  const confirmationGroupId = createFinancialEventId();
  const effectiveDate = canonicalCalendarDay(input.transaction.occurredAt);
  const events: FinancialEvent[] = checked.attribution.components.map(component => ({
    id: createFinancialEventId(),
    type: component.type === 'principal' ? 'loan-principal-payment' : component.type === 'interest' ? 'loan-interest-payment' : component.type === 'fee' ? 'loan-fee' : 'loan-penalty',
    status: input.transaction.status,
    source: 'attribution-confirmation',
    effectiveDate,
    occurredAt: input.transaction.occurredAt,
    amount: component.amount,
    currency: input.transaction.currency,
    accountId: input.transaction.accountId,
    loanId: checked.attribution.loanId,
    transactionId: input.transaction.id,
    componentLink: {
      domain: 'loan-payment', paymentId: checked.attribution.paymentId, componentId: component.componentId, confirmationGroupId,
      ...(checked.attribution.cashMovementId ? { cashMovementId: checked.attribution.cashMovementId } : {})
    },
    note: `UR-TODO-046-L1：使用者確認完整 Loan payment component group（${checked.attribution.paymentId}）`,
    createdAt: now,
    updatedAt: now
  }));
  return { rejected: false, confirmationGroupId, events };
}

/** Validates again at append time so a partial group cannot be persisted by a race or stale UI state. */
export function confirmLoanPaymentGroupAndAppend(input: LoanPaymentConfirmationInput, existingEvents: readonly FinancialEvent[], context: FinancialEventReferenceContext): LoanPaymentConfirmationResult {
  const built = buildLoanPaymentConfirmationGroup(input);
  if (built.rejected) return built;
  const appended = appendFinancialEventGroup(existingEvents, built.events, context);
  return appended.rejected ? appended : built;
}
