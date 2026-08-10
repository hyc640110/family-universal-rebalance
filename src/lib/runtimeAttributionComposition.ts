import { canonicalCalendarDay, isCanonicalCalendarDay } from './calendarDay';
import { deriveRuntimeDerivedAttributionEvidence } from './derivedAttributionEvidence';
import type { FinancialAccount } from './financialAccounts';
import { collectVoidedEventIds, isFinancialEventLedgerSchemaSupported, linkedTransactionReason, resolveActiveLoanComponentGroups, type FinancialEvent } from './financialEvents';
import { resolveActiveGenericSplitAllocationGroups } from './genericSplitAllocation';
import { deriveLoanRuntimeEvidence } from './loanAttribution';
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
    | 'derived-transaction-currency-unsupported'
    | 'financial-event-ledger-schema-unsupported';
  eventId?: string;
  transactionId?: string;
};

export type RuntimeAttributionCompositionInput = {
  openingSnapshot?: NetWorthSnapshot | null;
  closingSnapshot?: NetWorthSnapshot | null;
  ledgerEvents: readonly FinancialEvent[] | unknown;
  /** AppState supplies this so a future opaque Ledger can never enter runtime interpretation. */
  financialEventSchemaVersion?: number;
  /** Testable support boundary for legacy clients; production defaults to this build's supported schemas. */
  supportedSchemaVersions?: readonly number[];
  transactions: readonly FinancialTransaction[];
  accounts: readonly FinancialAccount[];
  /** Optional keeps non-Loan consumers and legacy call sites backward-compatible. Absence is fail-safe for Loan attribution. */
  loans?: readonly { id: string }[];
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

function isRuntimeFinancialEvent(value: unknown): value is FinancialEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string'
    && typeof record.source === 'string'
    && typeof record.type === 'string'
    && typeof record.status === 'string'
    && typeof record.effectiveDate === 'string'
    && typeof record.amount === 'number'
    && typeof record.currency === 'string';
}

/**
 * Composes C1 Ledger, C2 reconciliation, and C3A derived transaction evidence at
 * runtime only. It never writes FinancialEvent data or changes persistence.
 */
export function composeRuntimeNetWorthAttribution(input: RuntimeAttributionCompositionInput): RuntimeAttributionComposition {
  const period = periodFrom(input);
  if (!period) return unavailableForInvalidPeriod(input);
  const schemaSupported = input.financialEventSchemaVersion === undefined
    || isFinancialEventLedgerSchemaSupported(input.financialEventSchemaVersion, input.supportedSchemaVersions);
  // Unsupported schemas are intentionally treated as no Ledger evidence, not as an empty Ledger:
  // raw opaque records cannot consume transactions or suppress derived evidence.
  const ledgerEvents = schemaSupported && Array.isArray(input.ledgerEvents)
    ? input.ledgerEvents.filter(isRuntimeFinancialEvent)
    : [];

  // UR-TODO-046 void: a voided event is never mutated (forward-only) — a 'void' marker just
  // references it by id. Filtering both the markers themselves and their targets out here, before
  // evidence-building and reconciliation, means neither this function's own evidence pipeline nor
  // netWorthAttribution.ts's core formula needs to know "voided" exists, and the voided event's
  // transaction is freed back to 'candidate' so its economic effect can still surface via the
  // derived-evidence fallback path instead of silently disappearing.
  const voidedEventIds = collectVoidedEventIds(ledgerEvents);
  const transactionById = new Map(input.transactions.map(transaction => [transaction.id, transaction]));
  const effectiveLedgerEvents = ledgerEvents.filter(event => event.source !== 'void' && !voidedEventIds.has(event.id));
  // Runtime may receive persisted Ledger records before a storage normalizer has run. Reapply the
  // canonical linked-transaction boundary here so an invalid historical link cannot consume a
  // transaction or become Ledger contribution merely by bypassing normalization.
  const sanctionedLedgerEvents = effectiveLedgerEvents.filter(event => {
    if (event.source !== 'linked-transaction' && event.source !== 'attribution-confirmation') return true;
    const transaction = event.transactionId ? transactionById.get(event.transactionId) : undefined;
    return !!transaction && !linkedTransactionReason(
      event.type,
      event.status,
      event.amount,
      event.currency,
      event.accountId || '',
      event.counterpartyAccountId,
      event.effectiveDate,
      transaction,
      event.componentLink,
      event.loanId,
      event.splitAllocationLink
    );
  });
  const loanGroupResolution = resolveActiveLoanComponentGroups(sanctionedLedgerEvents, {
    accountIds: new Set(input.accounts.map(account => account.id)),
    loanIds: new Set((input.loans || []).map(loan => loan.id)),
    transactionIds: new Set(input.transactions.map(transaction => transaction.id)),
    transactionsById: new Map(input.transactions.map(transaction => [transaction.id, transaction]))
  });
  const genericSplitResolution = resolveActiveGenericSplitAllocationGroups(sanctionedLedgerEvents, {
    transactionsById: transactionById
  });

  const diagnostics: RuntimeAttributionCompositionDiagnostic[] = [];
  const ledgerEvidence: NetWorthAttributionEvidence[] = sanctionedLedgerEvents.flatMap(event => {
    if (event.componentLink && !loanGroupResolution.validEventIds.has(event.id)) return [];
    if (event.splitAllocationLink && !genericSplitResolution.validEventIds.has(event.id)) return [];
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

  const rawReconciliationResults = reconcileTransactions({
    transactions: input.transactions,
    accounts: input.accounts,
    ledgerEvents: sanctionedLedgerEvents,
    loanIds: new Set((input.loans || []).map(loan => loan.id))
  });
  const reconciliationResults = rawReconciliationResults.map(result => {
    const transaction = transactionById.get(result.transactionId);
    const paymentId = transaction?.loanAttribution && transaction.loanAttribution.kind === 'repayment'
      ? transaction.loanAttribution.paymentId
      : undefined;
    return paymentId && loanGroupResolution.confirmedPaymentIds.has(paymentId)
      ? { ...result, status: 'matched' as const, reason: 'linked-loan-payment-group' as const, completedPeriodEvidence: transaction?.status === 'posted' }
      : result;
  });
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
  const loanDerivedEvidence: NetWorthAttributionEvidence[] = deriveLoanRuntimeEvidence({
    transactions: input.transactions,
    loanIds: new Set((input.loans || []).map(loan => loan.id)),
    ledgerEvents: sanctionedLedgerEvents
  }).flatMap(evidence => inPeriodFromOccurrence(transactionById.get(evidence.transactionId)?.occurredAt || '', period)
    ? [{ id: evidence.id, type: evidence.type, status: 'posted' as const, amount: evidence.amount, provenance: 'derived-transaction' as const }]
    : []);

  const attribution = deriveNetWorthAttributionFromEvidence({
    openingSnapshot: input.openingSnapshot,
    closingSnapshot: input.closingSnapshot,
    evidence: [...ledgerEvidence, ...derivedEvidence, ...loanDerivedEvidence],
    absoluteTolerance: input.absoluteTolerance
  });
  const ledgerContribution = attribution.classifiedEventContribution === null
    ? null
    : attribution.eventClassifications.filter(item => item.provenance === 'ledger').reduce((total, item) => total + item.contribution, 0);
  const derivedContribution = attribution.classifiedEventContribution === null
    ? null
    : attribution.eventClassifications.filter(item => item.provenance === 'derived-transaction').reduce((total, item) => total + item.contribution, 0);

  if (!schemaSupported) {
    return {
      ...attribution,
      classifiedEventContribution: null,
      unexplainedResidual: null,
      unexplainedResidualRatio: null,
      attributionQuality: 'unavailable',
      ledgerContribution: null,
      derivedContribution,
      reconciliationResults,
      diagnostics: [...attribution.diagnostics, ...diagnostics, { code: 'financial-event-ledger-schema-unsupported' }]
    };
  }

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
