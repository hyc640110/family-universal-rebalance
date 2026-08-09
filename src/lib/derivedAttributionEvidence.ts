import { canonicalCalendarDay, isCanonicalCalendarDay } from './calendarDay';
import type { NetWorthSnapshot } from './netWorthHistory';
import type { TransactionReconciliationEventType, TransactionReconciliationResult } from './transactionReconciliation';
import type { FinancialTransaction } from './transactions';

export type DerivedAttributionEvidence = {
  transactionId: string;
  effectiveDate: string;
  category: TransactionReconciliationEventType;
  amount: number;
  signedContribution: number;
  /** Runtime-only provenance. This is not a persisted FinancialEvent source. */
  provenance: 'derived-transaction';
  reconciliationBasis: 'safe-taxonomy-candidate';
};

export type RuntimeDerivedAttributionEvidenceInput = {
  openingSnapshot?: Pick<NetWorthSnapshot, 'date'> | null;
  closingSnapshot?: Pick<NetWorthSnapshot, 'date'> | null;
  transactions: readonly FinancialTransaction[];
  reconciliationResults: readonly TransactionReconciliationResult[];
};

const CONTRIBUTION_BY_CATEGORY: Record<TransactionReconciliationEventType, (amount: number) => number> = {
  'external-income': amount => amount,
  'external-expense': amount => -amount,
  dividend: amount => amount,
  'internal-transfer': () => 0,
  'investment-buy': () => 0,
  'investment-sell': () => 0,
  'investment-fee': amount => -amount,
  adjustment: () => 0
};
const CURRENCY_CODE = /^[A-Z]{3}$/;

function snapshotsDefinePeriod(input: RuntimeDerivedAttributionEvidenceInput): input is RuntimeDerivedAttributionEvidenceInput & {
  openingSnapshot: Pick<NetWorthSnapshot, 'date'>;
  closingSnapshot: Pick<NetWorthSnapshot, 'date'>;
} {
  return isCanonicalCalendarDay(input.openingSnapshot?.date)
    && isCanonicalCalendarDay(input.closingSnapshot?.date)
    && input.openingSnapshot.date < input.closingSnapshot.date;
}

function transactionDay(transaction: FinancialTransaction): string | undefined {
  try {
    return canonicalCalendarDay(transaction.occurredAt);
  } catch {
    return undefined;
  }
}

function isRuntimeSafeCandidate(transaction: FinancialTransaction, result: TransactionReconciliationResult): result is TransactionReconciliationResult & {
  status: 'candidate';
  reason: 'safe-taxonomy-candidate';
  eventType: TransactionReconciliationEventType;
} {
  return result.status === 'candidate'
    && result.reason === 'safe-taxonomy-candidate'
    && result.eventType !== undefined
    && transaction.status === 'posted'
    && transaction.excluded !== true
    && Number.isFinite(transaction.amount)
    && transaction.amount > 0
    && CURRENCY_CODE.test(transaction.currency);
}

/**
 * Builds transient transaction evidence for a calendar-day snapshot interval.
 * It consumes C1/C2 candidate diagnostics only and deliberately does not invoke,
 * modify, or persist the C1 Ledger or the 046-B attribution calculator.
 */
export function deriveRuntimeDerivedAttributionEvidence(input: RuntimeDerivedAttributionEvidenceInput): DerivedAttributionEvidence[] {
  if (!snapshotsDefinePeriod(input)) return [];

  const candidateByTransactionId = new Map(
    input.reconciliationResults
      .filter((result): result is TransactionReconciliationResult & { status: 'candidate'; reason: 'safe-taxonomy-candidate'; eventType: TransactionReconciliationEventType } => result.status === 'candidate' && result.reason === 'safe-taxonomy-candidate' && result.eventType !== undefined)
      .map(result => [result.transactionId, result])
  );
  const seenTransactionIds = new Set<string>();

  return input.transactions.flatMap(transaction => {
    if (seenTransactionIds.has(transaction.id)) return [];
    seenTransactionIds.add(transaction.id);
    const result = candidateByTransactionId.get(transaction.id);
    if (!result || !isRuntimeSafeCandidate(transaction, result)) return [];

    const effectiveDate = transactionDay(transaction);
    if (!effectiveDate || effectiveDate <= input.openingSnapshot.date || effectiveDate > input.closingSnapshot.date) return [];

    return [{
      transactionId: transaction.id,
      effectiveDate,
      category: result.eventType,
      amount: transaction.amount,
      signedContribution: CONTRIBUTION_BY_CATEGORY[result.eventType](transaction.amount),
      provenance: 'derived-transaction' as const,
      reconciliationBasis: 'safe-taxonomy-candidate' as const
    }];
  });
}
