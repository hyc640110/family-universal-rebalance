import { canonicalCalendarDay } from './calendarDay';
import type { FinancialAccount } from './financialAccounts';
import type { FinancialEvent, FinancialEventType } from './financialEvents';
import type { FinancialTransaction } from './transactions';

export type TransactionReconciliationStatus = 'matched' | 'candidate' | 'unsupported' | 'ambiguous' | 'duplicate' | 'invalid';
export type TransactionReconciliationEventType = Extract<FinancialEventType, 'external-income' | 'external-expense' | 'internal-transfer' | 'dividend' | 'investment-buy' | 'investment-sell' | 'investment-fee' | 'adjustment'>;
export type TransactionReconciliationReason =
  | 'linked-event'
  | 'manual-event-looks-similar'
  | 'multiple-linked-events'
  | 'duplicate-trade-identity'
  | 'safe-taxonomy-candidate'
  | 'not-posted'
  | 'excluded'
  | 'unsupported-taxonomy'
  | 'fx-attribution-unsupported'
  | 'invalid-account'
  | 'invalid-amount'
  | 'invalid-currency'
  | 'invalid-date'
  | 'invalid-transfer';

export type TransactionReconciliationResult = {
  transactionId: string;
  status: TransactionReconciliationStatus;
  reason: TransactionReconciliationReason;
  /** Present only where current FinancialTransaction taxonomy proves an event type. */
  eventType?: TransactionReconciliationEventType;
  /** Pending matched events remain C1 evidence, but this helper never sends them to the calculator. */
  completedPeriodEvidence: boolean;
};

export type TransactionReconciliationInput = {
  transactions: readonly FinancialTransaction[];
  accounts: readonly FinancialAccount[];
  /** A supported C1 Ledger view. This helper diagnoses it and never normalizes or mutates it. */
  ledgerEvents: readonly FinancialEvent[];
};

type Candidate = { eventType: TransactionReconciliationEventType } | { reason: TransactionReconciliationReason };

const SAFE_INCOME_CATEGORIES = new Set(['income-salary', 'income-interest', 'income-refund']);
const SAFE_EXPENSE_CATEGORIES = new Set(['expense-food', 'expense-transport', 'expense-shopping', 'expense-housing', 'expense-utilities', 'expense-communication', 'expense-medical', 'expense-insurance', 'expense-tax', 'expense-other']);
const CURRENCY_CODE = /^[A-Z]{3}$/;
/**
 * UR-TODO-046-C3C-C: both sources represent a real link to one transactionId
 * (see financialEvents.ts's identically-named set). Without this, a
 * newly-confirmed 'attribution-confirmation' event would never satisfy
 * isEventForTransaction() below, so its transaction would stay a 'candidate'
 * forever — producing derived evidence for the same transaction the Ledger
 * event already covers, double-counting it across ledgerContribution and
 * derivedContribution.
 */
const TRANSACTION_LINKED_SOURCES = new Set<FinancialEvent['source']>(['linked-transaction', 'attribution-confirmation']);

function calendarDay(value: string): string | undefined {
  try {
    return canonicalCalendarDay(value);
  } catch {
    return undefined;
  }
}

function isValidCurrency(value: string): boolean {
  return CURRENCY_CODE.test(value);
}

function candidateFor(transaction: FinancialTransaction, accountById: ReadonlyMap<string, FinancialAccount>): Candidate {
  const account = accountById.get(transaction.accountId);
  if (!account) return { reason: 'invalid-account' };
  if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) return { reason: 'invalid-amount' };
  if (!isValidCurrency(transaction.currency)) return { reason: 'invalid-currency' };
  if (!calendarDay(transaction.occurredAt)) return { reason: 'invalid-date' };
  const trade = transaction.investmentAttribution;
  if (trade) {
    if (transaction.currency !== account.currency || trade.currency !== transaction.currency) return { reason: 'fx-attribution-unsupported' };
    if (transaction.currency !== 'TWD') return { reason: 'fx-attribution-unsupported' };
    if (trade.cashAccountId !== transaction.accountId) return { reason: 'unsupported-taxonomy' };
    if (trade.kind === 'cost') return transaction.type === 'expense' ? { eventType: 'investment-fee' } : { reason: 'unsupported-taxonomy' };
    if (trade.settlementAmount !== transaction.amount) return { reason: 'unsupported-taxonomy' };
    if (trade.side === 'buy' && transaction.type === 'expense') return { eventType: 'investment-buy' };
    if (trade.side === 'sell' && transaction.type === 'income') return { eventType: 'investment-sell' };
    return { reason: 'unsupported-taxonomy' };
  }
  if (transaction.type === 'transfer') {
    const destination = transaction.transferAccountId ? accountById.get(transaction.transferAccountId) : undefined;
    if (!destination || !transaction.transferAccountId || transaction.transferAccountId === transaction.accountId) return { reason: 'invalid-transfer' };
    if (transaction.categoryId !== 'transfer-account') return { reason: 'unsupported-taxonomy' };
    if (account.currency !== destination.currency || transaction.currency !== account.currency) return { reason: 'fx-attribution-unsupported' };
    return { eventType: 'internal-transfer' };
  }

  if (transaction.currency !== account.currency) return { reason: 'fx-attribution-unsupported' };
  if (transaction.currency !== 'TWD') return { reason: 'fx-attribution-unsupported' };
  if (transaction.type === 'income') {
    if (transaction.categoryId === 'income-dividend') return { eventType: 'dividend' };
    return SAFE_INCOME_CATEGORIES.has(transaction.categoryId) ? { eventType: 'external-income' } : { reason: 'unsupported-taxonomy' };
  }
  if (transaction.type === 'expense') {
    return SAFE_EXPENSE_CATEGORIES.has(transaction.categoryId) ? { eventType: 'external-expense' } : { reason: 'unsupported-taxonomy' };
  }
  if (transaction.type === 'adjustment') {
    return transaction.categoryId === 'adjustment-other' ? { eventType: 'adjustment' } : { reason: 'unsupported-taxonomy' };
  }
  return { reason: 'unsupported-taxonomy' };
}

function isEventForTransaction(event: FinancialEvent, transaction: FinancialTransaction, eventType: TransactionReconciliationEventType): boolean {
  const date = calendarDay(transaction.occurredAt);
  if (!date || transaction.excluded || !TRANSACTION_LINKED_SOURCES.has(event.source) || event.status !== transaction.status || event.status === 'void') return false;
  if (event.transactionId !== transaction.id || event.type !== eventType || event.accountId !== transaction.accountId) return false;
  if (event.amount !== transaction.amount || event.currency !== transaction.currency || event.effectiveDate !== date) return false;
  return eventType !== 'internal-transfer' || event.counterpartyAccountId === transaction.transferAccountId;
}

function isSimilarManualEvent(event: FinancialEvent, transaction: FinancialTransaction, eventType: TransactionReconciliationEventType): boolean {
  const date = calendarDay(transaction.occurredAt);
  if (!date || event.source !== 'manual' || event.status !== 'posted') return false;
  if (event.type !== eventType || event.effectiveDate !== date || event.amount !== transaction.amount || event.currency !== transaction.currency || event.accountId !== transaction.accountId) return false;
  return eventType !== 'internal-transfer' || event.counterpartyAccountId === transaction.transferAccountId;
}

/**
 * Read-only, deterministic evidence classification for existing transactions.
 * It intentionally returns diagnostics only: no Ledger writes and no calculator wiring occur here.
 */
export function reconcileTransactions(input: TransactionReconciliationInput): TransactionReconciliationResult[] {
  const accountById = new Map(input.accounts.map(account => [account.id, account]));
  const tradeIdentityCounts = new Map<string, number>();
  for (const transaction of input.transactions) {
    const tradeId = transaction.investmentAttribution?.kind === 'trade' ? transaction.investmentAttribution.tradeId : undefined;
    if (tradeId) tradeIdentityCounts.set(tradeId, (tradeIdentityCounts.get(tradeId) || 0) + 1);
  }
  return input.transactions.map(transaction => {
    const tradeId = transaction.investmentAttribution?.kind === 'trade' ? transaction.investmentAttribution.tradeId : undefined;
    if (tradeId && (tradeIdentityCounts.get(tradeId) || 0) > 1) {
      return { transactionId: transaction.id, status: 'duplicate', reason: 'duplicate-trade-identity', completedPeriodEvidence: false };
    }
    const candidate = candidateFor(transaction, accountById);
    if (!('eventType' in candidate)) {
      return { transactionId: transaction.id, status: candidate.reason === 'invalid-account' || candidate.reason === 'invalid-amount' || candidate.reason === 'invalid-currency' || candidate.reason === 'invalid-date' || candidate.reason === 'invalid-transfer' ? 'invalid' : 'unsupported', reason: candidate.reason, completedPeriodEvidence: false };
    }

    const linked = input.ledgerEvents.filter(event => isEventForTransaction(event, transaction, candidate.eventType));
    if (linked.length >= 2) return { transactionId: transaction.id, status: 'duplicate', reason: 'multiple-linked-events', eventType: candidate.eventType, completedPeriodEvidence: transaction.status === 'posted' };
    if (linked.length === 1) return { transactionId: transaction.id, status: 'matched', reason: 'linked-event', eventType: candidate.eventType, completedPeriodEvidence: transaction.status === 'posted' };
    if (transaction.status !== 'posted') return { transactionId: transaction.id, status: 'unsupported', reason: 'not-posted', eventType: candidate.eventType, completedPeriodEvidence: false };
    if (transaction.excluded) return { transactionId: transaction.id, status: 'unsupported', reason: 'excluded', eventType: candidate.eventType, completedPeriodEvidence: false };
    if (input.ledgerEvents.some(event => isSimilarManualEvent(event, transaction, candidate.eventType))) {
      return { transactionId: transaction.id, status: 'ambiguous', reason: 'manual-event-looks-similar', eventType: candidate.eventType, completedPeriodEvidence: false };
    }
    return { transactionId: transaction.id, status: 'candidate', reason: 'safe-taxonomy-candidate', eventType: candidate.eventType, completedPeriodEvidence: false };
  });
}
