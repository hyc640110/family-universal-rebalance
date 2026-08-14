import { resolveActiveLoanComponentGroups, type FinancialEvent, type FinancialEventReferenceContext } from './financialEvents';
import { validateLoanAttribution } from './loanAttribution';
import type { FinancialTransaction, LoanPaymentComponent } from './transactions';

/**
 * UR-TODO-054-A: pure, read-only selector that groups the flat, per-component Loan runtime
 * evidence (see loanAttribution.ts's `deriveLoanRuntimeEvidence()`, which is component-shaped)
 * into one presentation row per `paymentId` — the atomic economic unit a user actually confirms,
 * views, or voids. It performs no Ledger write and consumes only existing, unmodified contract
 * entry points (`resolveActiveLoanComponentGroups()`, `validateLoanAttribution()`).
 */

export type LoanRepaymentGroupComponentPresentation = {
  componentId: string;
  type: LoanPaymentComponent['type'];
  amount: number;
};

export type LoanRepaymentGroupStatus = 'candidate' | 'matched';

export type LoanRepaymentGroupPresentation = {
  paymentId: string;
  transactionId: string;
  loanId: string;
  effectiveDate: string;
  settlementAmount: number;
  currency: string;
  components: LoanRepaymentGroupComponentPresentation[];
  status: LoanRepaymentGroupStatus;
  /** True when this paymentId has at least one historical attribution-confirmation event on record — i.e. it was confirmed and later voided, distinct from "never confirmed". Presentation-only; never used for correctness. */
  everConfirmed: boolean;
  /**
   * Deterministic void target for a 'matched' group: the currently-active `FinancialEvent.id` for
   * this group's principal component if one exists, otherwise the first component in
   * `components` array order (== the transaction's own `loanAttribution.components` order,
   * authored once at Producer time — never React render order). Always present when
   * status === 'matched' for any group that satisfies the existing atomic-group contract;
   * absent otherwise.
   */
  voidTargetEventId?: string;
};

export type LoanRepaymentGroupPresentationInput = {
  transactions: readonly FinancialTransaction[];
  loanIds: ReadonlySet<string>;
  ledgerEvents: readonly FinancialEvent[];
  accountIds: ReadonlySet<string>;
};

function deterministicVoidTarget(
  paymentId: string,
  components: readonly LoanPaymentComponent[],
  ledgerEvents: readonly FinancialEvent[],
  validEventIds: ReadonlySet<string>
): string | undefined {
  const preferredComponent = components.find(component => component.type === 'principal') ?? components[0];
  if (!preferredComponent) return undefined;
  const match = ledgerEvents.find(event =>
    validEventIds.has(event.id)
    && event.componentLink?.paymentId === paymentId
    && event.componentLink?.componentId === preferredComponent.componentId
  );
  return match?.id;
}

/**
 * Builds one presentation row per distinct `paymentId` found across `transactions`. Only rows
 * whose underlying `loanAttribution` currently satisfies the full `validateLoanAttribution()`
 * contract are included — malformed or unsupported repayment attempts never reach this UI,
 * exactly mirroring how they never reach `derivedEvidenceItems` today.
 */
export function deriveLoanRepaymentGroupPresentations(input: LoanRepaymentGroupPresentationInput): LoanRepaymentGroupPresentation[] {
  const transactionsById = new Map(input.transactions.map(transaction => [transaction.id, transaction]));
  const context: FinancialEventReferenceContext = {
    accountIds: input.accountIds,
    loanIds: input.loanIds,
    transactionIds: new Set(input.transactions.map(transaction => transaction.id)),
    transactionsById
  };
  const groupResolution = resolveActiveLoanComponentGroups(input.ledgerEvents, context);

  const seenPaymentIds = new Set<string>();
  const results: LoanRepaymentGroupPresentation[] = [];
  for (const transaction of input.transactions) {
    const attribution = transaction.loanAttribution;
    if (!attribution || attribution.kind !== 'repayment') continue;
    if (seenPaymentIds.has(attribution.paymentId)) continue;
    seenPaymentIds.add(attribution.paymentId);

    const checked = validateLoanAttribution({ transaction, transactions: input.transactions, loanIds: input.loanIds });
    if (checked.status !== 'valid' || checked.attribution.kind !== 'repayment') continue;

    const isMatched = groupResolution.confirmedPaymentIds.has(attribution.paymentId);
    const everConfirmed = input.ledgerEvents.some(event => event.componentLink?.paymentId === attribution.paymentId && event.source === 'attribution-confirmation');
    const voidTargetEventId = isMatched
      ? deterministicVoidTarget(attribution.paymentId, attribution.components, input.ledgerEvents, groupResolution.validEventIds)
      : undefined;

    results.push({
      paymentId: attribution.paymentId,
      transactionId: transaction.id,
      loanId: attribution.loanId,
      effectiveDate: transaction.occurredAt,
      settlementAmount: attribution.settlementAmount,
      currency: attribution.currency,
      components: attribution.components.map(component => ({ componentId: component.componentId, type: component.type, amount: component.amount })),
      status: isMatched ? 'matched' : 'candidate',
      everConfirmed,
      ...(voidTargetEventId ? { voidTargetEventId } : {})
    });
  }
  return results;
}
