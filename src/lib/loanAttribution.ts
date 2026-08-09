import { resolveActiveLoanComponentGroups, type FinancialEvent } from './financialEvents';
import type { FinancialTransaction, LoanRepaymentAttribution } from './transactions';

export type LoanAttributionValidation =
  | { status: 'not-applicable' }
  | { status: 'unsupported'; reason: string }
  | { status: 'valid'; attribution: LoanRepaymentAttribution | Extract<FinancialTransaction['loanAttribution'], { kind: 'disbursement' }> };

export type LoanRuntimeEvidence = {
  id: string;
  transactionId: string;
  paymentId: string;
  componentId?: string;
  type: 'loan-disbursement' | 'loan-principal-payment' | 'loan-interest-payment' | 'loan-fee' | 'loan-penalty';
  amount: number;
  contribution: number;
};

type ValidationInput = { transaction: FinancialTransaction; transactions: readonly FinancialTransaction[]; loanIds: ReadonlySet<string> };

function cashMovementMatches(transaction: FinancialTransaction, attribution: LoanRepaymentAttribution | Extract<FinancialTransaction['loanAttribution'], { kind: 'disbursement' }>, transactions: readonly FinancialTransaction[]): boolean {
  // A cash movement belongs to the payment only through an explicit stable id.
  // Its absence is not proof of a second, independently-created cash movement.
  if (!attribution.cashMovementId) return true;
  const matches = transactions.filter(candidate => candidate.loanAttribution?.kind === 'cash-movement' && candidate.loanAttribution.cashMovementId === attribution.cashMovementId);
  if (matches.length !== 1) return false;
  const movement = matches[0]!;
  const contract = movement.loanAttribution;
  if (contract?.kind !== 'cash-movement') return false;
  const expectedDirection = attribution.kind === 'repayment' ? 'decrease' : 'increase';
  const expectedType = expectedDirection === 'decrease' ? 'expense' : 'income';
  return contract.direction === expectedDirection && movement.type === expectedType && movement.accountId === transaction.accountId
    && movement.currency === transaction.currency && movement.amount === transaction.amount && contract.cashAccountId === attribution.cashAccountId
    && contract.currency === attribution.currency && contract.settlementAmount === attribution.settlementAmount;
}

/** Validates explicit proof only. It never derives loan facts from text, balances, or amortization settings. */
export function validateLoanAttribution(input: ValidationInput): LoanAttributionValidation {
  const attribution = input.transaction.loanAttribution;
  if (!attribution || attribution.kind === 'cash-movement') return { status: 'not-applicable' };
  if (input.transaction.excluded || input.transaction.status !== 'posted') return { status: 'unsupported', reason: 'loan transaction 必須是未排除的 posted transaction' };
  if (attribution.currency !== 'TWD' || input.transaction.currency !== 'TWD') return { status: 'unsupported', reason: 'loan attribution 目前只支援 TWD' };
  if (!input.loanIds.has(attribution.loanId)) return { status: 'unsupported', reason: 'loanId 未指向既有 Loan' };
  if (attribution.cashAccountId !== input.transaction.accountId || attribution.settlementAmount !== input.transaction.amount || attribution.currency !== input.transaction.currency) return { status: 'unsupported', reason: 'settlement 與 transaction 不一致' };
  const samePayment = input.transactions.filter(candidate => {
    const candidateAttribution = candidate.loanAttribution;
    return candidateAttribution && candidateAttribution.kind !== 'cash-movement' && candidateAttribution.paymentId === attribution.paymentId;
  });
  if (samePayment.length !== 1 || samePayment[0]?.id !== input.transaction.id) return { status: 'unsupported', reason: 'paymentId 不得對應多筆 transaction' };
  if (attribution.kind === 'repayment') {
    if (!attribution.components.length || new Set(attribution.components.map(component => component.componentId)).size !== attribution.components.length) return { status: 'unsupported', reason: 'componentId 缺失或重複' };
    if (attribution.components.some(component => !Number.isFinite(component.amount) || component.amount <= 0)) return { status: 'unsupported', reason: 'component amount 無效' };
    if (attribution.components.reduce((total, component) => total + component.amount, 0) !== attribution.settlementAmount) return { status: 'unsupported', reason: 'component sum 與 settlementAmount 不一致' };
  }
  if (!cashMovementMatches(input.transaction, attribution, input.transactions)) return { status: 'unsupported', reason: 'cash movement linkage 不完整或不唯一' };
  return { status: 'valid', attribution };
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
