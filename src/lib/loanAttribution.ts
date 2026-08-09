import { resolveActiveLoanComponentGroups, type FinancialEvent } from './financialEvents';
import { validateLoanAttributionContract, type LoanAttributionValidation, type LoanAttributionValidationInput } from './loanAttributionContract';
import type { FinancialTransaction } from './transactions';

export type { LoanAttributionValidation } from './loanAttributionContract';

export type LoanRuntimeEvidence = {
  id: string;
  transactionId: string;
  paymentId: string;
  componentId?: string;
  type: 'loan-disbursement' | 'loan-principal-payment' | 'loan-interest-payment' | 'loan-fee' | 'loan-penalty';
  amount: number;
  contribution: number;
};

/** Backward-compatible public entry point; validation implementation is shared with the Ledger write boundary. */
export function validateLoanAttribution(input: LoanAttributionValidationInput): LoanAttributionValidation {
  return validateLoanAttributionContract(input);
}

export function deriveLoanRuntimeEvidence(input: { transactions: readonly FinancialTransaction[]; loanIds: ReadonlySet<string>; ledgerEvents: readonly FinancialEvent[] }): LoanRuntimeEvidence[] {
  const confirmed = resolveActiveLoanComponentGroups(input.ledgerEvents, {
    accountIds: new Set(input.transactions.map(transaction => transaction.accountId)),
    loanIds: input.loanIds,
    transactionIds: new Set(input.transactions.map(transaction => transaction.id)),
    transactionsById: new Map(input.transactions.map(transaction => [transaction.id, transaction]))
  }).confirmedPaymentIds;
  const paymentIds = new Map<string, number>();
  for (const transaction of input.transactions) {
    const attribution = transaction.loanAttribution;
    if (attribution && attribution.kind !== 'cash-movement') paymentIds.set(attribution.paymentId, (paymentIds.get(attribution.paymentId) || 0) + 1);
  }
  return input.transactions.flatMap<LoanRuntimeEvidence>((transaction): LoanRuntimeEvidence[] => {
    const checked = validateLoanAttribution({ transaction, transactions: input.transactions, loanIds: input.loanIds });
    if (checked.status !== 'valid' || confirmed.has(checked.attribution.paymentId) || paymentIds.get(checked.attribution.paymentId) !== 1) return [];
    if (checked.attribution.kind === 'disbursement') {
      return [{
        id: `loan-disbursement:${checked.attribution.paymentId}`,
        transactionId: transaction.id,
        paymentId: checked.attribution.paymentId,
        type: 'loan-disbursement' as const,
        amount: checked.attribution.settlementAmount,
        contribution: 0
      }];
    }
    return checked.attribution.components.map(component => ({
      id: `loan-payment:${checked.attribution.paymentId}:${component.componentId}`,
      transactionId: transaction.id,
      paymentId: checked.attribution.paymentId,
      componentId: component.componentId,
      type: component.type === 'principal' ? 'loan-principal-payment' as const : component.type === 'interest' ? 'loan-interest-payment' as const : component.type === 'fee' ? 'loan-fee' as const : 'loan-penalty' as const,
      amount: component.amount,
      contribution: component.type === 'principal' ? 0 : -component.amount
    }));
  });
}
