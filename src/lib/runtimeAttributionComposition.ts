import { canonicalCalendarDay, isCanonicalCalendarDay } from './calendarDay';
import { deriveRuntimeDerivedAttributionEvidence } from './derivedAttributionEvidence';
import type { FinancialAccount } from './financialAccounts';
import type { FinancialEvent } from './financialEvents';
import {
  deriveNetWorthAttributionFromEvidence,
  type NetWorthAttribution,
  type NetWorthAttributionDiagnostic,
  type NetWorthAttributionEvidence
} from './netWorthAttribution';
import type { NetWorthSnapshot } from './netWorthHistory';
import { reconcileTransactions, type TransactionReconciliationResult } from './transactionReconciliation';
import type { FinancialTransaction } from './transactions';

export type RuntimeAttributionCompositionDiagnostic = NetWorthAttributionDiagnostic | {
  code:
    | 'invalid-attribution-period'
    | 'ledger-event-outside-period-excluded'
    | 'ledger-event-currency-unsupported'
    | 'derived-transaction-currency-unsupported';
  eventId?: string;
  transactionId?: string;
};

export type RuntimeAttributionCompositionInput = {
  openingSnapshot?: NetWorthSnapshot | null;
  closingSnapshot?: NetWorthSnapshot | null;
  ledgerEvents: readonly FinancialEvent[];
  transactions: readonly FinancialTransaction[];
  accounts: readonly FinancialAccount[];
  absoluteTolerance?: number;
};

export type RuntimeAttributionComposition = Omit<NetWorthAttribution, 'diagnostics'> & {
  ledgerContribution: number | null;
  derivedContribution: number | null;
  reconciliationResults: TransactionReconciliationResult[];
  diagnostics: RuntimeAttributionCompositionDiagnostic[];
};

type Period = { openingDate: string; closingDate: string };

function periodFrom(input: RuntimeAttributionCompositionInput): Period | undefined {
  const openingDate = input.openingSnapshot?.date;
  const closingDate = input.closingSnapshot?.date;
  return isCanonicalCalendarDay(openingDate)
    && isCanonicalCalendarDay(closingDate)
    && openingDate <= closingDate
    ? { openingDate, closingDate }
    : undefined;
}

function inPeriod(date: string, period: Period): boolean {
  return isCanonicalCalendarDay(date) && date > period.openingDate && date <= period.closingDate;
}

function unavailableForInvalidPeriod(input: RuntimeAttributionCompositionInput): RuntimeAttributionComposition {
  const base = deriveNetWorthAttributionFromEvidence({
    openingSnapshot: input.openingSnapshot,
    closingSnapshot: input.closingSnapshot,
    evidence: [],
    absoluteTolerance: input.absoluteTolerance
  });
  return {
    ...base,
    netWorthChange: null,
    classifiedEventContribution: null,
    unexplainedResidual: null,
    unexplainedResidualRatio: null,
    attributionQuality: 'unavailable',
    ledgerContribution: null,
    derivedContribution: null,
    reconciliationResults: [],
    diagnostics: [...base.diagnostics, { code: 'invalid-attribution-period' }]
  };
}

/**
 * Composes C1 Ledger, C2 reconciliation, and C3A derived transaction evidence at
 * runtime only. It never writes FinancialEvent data or changes persistence.
 */
export function composeRuntimeNetWorthAttribution(input: RuntimeAttributionCompositionInput): RuntimeAttributionComposition {
  const period = periodFrom(input);
  if (!period) return unavailableForInvalidPeriod(input);

  const diagnostics: RuntimeAttributionCompositionDiagnostic[] = [];
  const ledgerEvidence: NetWorthAttributionEvidence[] = input.ledgerEvents.flatMap(event => {
    if (!inPeriod(event.effectiveDate, period)) {
      diagnostics.push({ code: 'ledger-event-outside-period-excluded', eventId: event.id });
      return [];
    }
    if (event.currency !== 'TWD') {
      diagnostics.push({ code: 'ledger-event-currency-unsupported', eventId: event.id });
      return [];
    }
    return [{ id: event.id, type: event.type, status: event.status, amount: event.amount, provenance: 'ledger' as const }];
  });

  const reconciliationResults = reconcileTransactions({
    transactions: input.transactions,
    accounts: input.accounts,
    ledgerEvents: input.ledgerEvents
  });
  const transactionById = new Map(input.transactions.map(transaction => [transaction.id, transaction]));
  for (const result of reconciliationResults) {
    const transaction = transactionById.get(result.transactionId);
    if (transaction && result.reason === 'fx-attribution-unsupported' && inPeriodFromOccurrence(transaction.occurredAt, period)) {
      diagnostics.push({ code: 'derived-transaction-currency-unsupported', transactionId: transaction.id });
    }
  }

  const seenDerivedTransactionIds = new Set<string>();
  const derivedEvidence: NetWorthAttributionEvidence[] = deriveRuntimeDerivedAttributionEvidence({
    openingSnapshot: input.openingSnapshot,
    closingSnapshot: input.closingSnapshot,
    transactions: input.transactions,
    reconciliationResults
  }).flatMap(evidence => {
    if (seenDerivedTransactionIds.has(evidence.transactionId)) return [];
    seenDerivedTransactionIds.add(evidence.transactionId);
    const transaction = transactionById.get(evidence.transactionId);
    if (!transaction || transaction.currency !== 'TWD') {
      diagnostics.push({ code: 'derived-transaction-currency-unsupported', transactionId: evidence.transactionId });
      return [];
    }
    if (!inPeriod(evidence.effectiveDate, period)) return [];
    return [{
      id: evidence.transactionId,
      type: evidence.category,
      status: 'posted' as const,
      amount: evidence.amount,
      provenance: 'derived-transaction' as const
    }];
  });

  const attribution = deriveNetWorthAttributionFromEvidence({
    openingSnapshot: input.openingSnapshot,
    closingSnapshot: input.closingSnapshot,
    evidence: [...ledgerEvidence, ...derivedEvidence],
    absoluteTolerance: input.absoluteTolerance
  });
  const ledgerContribution = attribution.classifiedEventContribution === null
    ? null
    : attribution.eventClassifications.filter(item => item.provenance === 'ledger').reduce((total, item) => total + item.contribution, 0);
  const derivedContribution = attribution.classifiedEventContribution === null
    ? null
    : attribution.eventClassifications.filter(item => item.provenance === 'derived-transaction').reduce((total, item) => total + item.contribution, 0);

  return {
    ...attribution,
    ledgerContribution,
    derivedContribution,
    reconciliationResults,
    diagnostics: [...attribution.diagnostics, ...diagnostics]
  };
}

function inPeriodFromOccurrence(occurredAt: string, period: Period): boolean {
  try {
    return inPeriod(canonicalCalendarDay(occurredAt), period);
  } catch {
    return false;
  }
}
