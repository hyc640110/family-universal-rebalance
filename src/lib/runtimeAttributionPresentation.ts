import type { FinancialEventType } from './financialEvents';
import type { NetWorthAttributionQuality } from './netWorthAttribution';
import type { NetWorthSnapshot } from './netWorthHistory';
import type { RuntimeAttributionComposition } from './runtimeAttributionComposition';

/** Fixed disclosure text: reconciled means the residual is within tolerance, not that every source is confirmed. */
export const RUNTIME_ATTRIBUTION_RECONCILED_DISCLAIMER =
  '殘值在容許誤差內，不代表完整歸因，也不代表您已確認所有來源';

export const RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON = '因缺少正式匯率，此項目未納入計算';

const ZERO_CONTRIBUTION_LABEL: Partial<Record<FinancialEventType, string>> = {
  adjustment: '調整（0 貢獻，僅供參考）',
  'internal-transfer': '帳戶間轉帳（0 貢獻，僅供參考）'
};

const FINANCIAL_EVENT_TYPE_LABEL: Partial<Record<FinancialEventType, string>> = {
  'external-income': '外部收入',
  'external-expense': '外部支出',
  dividend: '股息',
  'investment-fee': '投資手續費'
};

function financialEventTypeLabel(type: FinancialEventType): string {
  return FINANCIAL_EVENT_TYPE_LABEL[type] ?? type;
}

/**
 * UR-TODO-054-A: Loan's `deriveLoanRuntimeEvidence()` (loanAttribution.ts) feeds
 * `provenance: 'derived-transaction'` rows into the same `eventClassifications` array as the
 * generic `safe-taxonomy-candidate` path — the only thing that structurally distinguishes a Loan
 * row is its `type` being one of these five values, which no other derived-evidence source ever
 * emits (deriveRuntimeDerivedAttributionEvidence() only emits TransactionReconciliationEventType,
 * whose Extract<> deliberately excludes every loan-* FinancialEventType). This is the stable
 * domain signal used below to exclude Loan rows from the generic card: Loan is an atomic
 * component-group economic unit (see loanAttributionContract.ts), and this card's `item.id`
 * being a bare transactionId (not a paymentId/componentId pair) makes it structurally unable to
 * represent or safely confirm a Loan group — see LoanConfirmationCard.tsx for the dedicated,
 * group-aware replacement UI. Matching on these exact type literals (not a string prefix) keeps
 * this filter correct even if a future FinancialEventType happens to start with "loan".
 */
const LOAN_DERIVED_EVENT_TYPES = new Set<FinancialEventType>([
  'loan-disbursement',
  'loan-principal-payment',
  'loan-interest-payment',
  'loan-fee',
  'loan-penalty'
]);

export type RuntimeAttributionPresentationValue = {
  status: 'known' | 'unavailable';
  value: number | null;
};

export type RuntimeAttributionPeriodPresentation = {
  openingDate: string | null;
  closingDate: string | null;
  /** True when opening and closing snapshot dates are the same calendar day. */
  isZeroLengthPeriod: boolean;
  /** True only when both dates are known and distinct, i.e. a real comparison interval exists. */
  hasComparablePeriod: boolean;
};

/**
 * Shared shape for every itemized provenance row on the card (derived
 * evidence, zero-contribution items, FX-excluded items). `contribution` is
 * `null` when the amount was never computed (e.g. FX-excluded), never
 * coerced to 0 — it is only `0` when the underlying classification is a
 * genuine zero-effect disposition (adjustment / internal-transfer).
 */
export type RuntimeAttributionEvidenceItem = {
  id: string;
  /** Undefined for rows sourced from diagnostics only (e.g. FX-excluded), which carry no event type. */
  type?: FinancialEventType;
  provenance: 'ledger' | 'derived-transaction';
  contribution: number | null;
  note: string;
};

export type RuntimeAttributionPresentation = {
  period: RuntimeAttributionPeriodPresentation;
  quality: NetWorthAttributionQuality;
  reconciled: boolean;
  netWorthChange: RuntimeAttributionPresentationValue;
  ledgerContribution: RuntimeAttributionPresentationValue;
  derivedContribution: RuntimeAttributionPresentationValue;
  unexplainedResidual: RuntimeAttributionPresentationValue;
  /** Individual contributing derived-transaction evidence rows — the only rows eligible for a C3C-B "mark as reasonable" toggle. */
  derivedEvidenceItems: RuntimeAttributionEvidenceItem[];
  zeroContributionItems: RuntimeAttributionEvidenceItem[];
  fxExcludedItems: RuntimeAttributionEvidenceItem[];
};

function presentNumber(value: number | null): RuntimeAttributionPresentationValue {
  return value === null || !Number.isFinite(value) ? { status: 'unavailable', value: null } : { status: 'known', value };
}

/**
 * Maps an already-composed runtime attribution result (from
 * composeRuntimeNetWorthAttribution) plus the caller's chosen opening/closing
 * snapshots into a display-only presentation. It performs no financial
 * calculation: the zero-length-period flag is a plain date comparison the
 * composition itself does not expose, and every itemized row below is a
 * direct read of composition.eventClassifications / composition.diagnostics.
 */
export function deriveRuntimeAttributionPresentation(input: {
  composition: RuntimeAttributionComposition;
  openingSnapshot: NetWorthSnapshot | null;
  closingSnapshot: NetWorthSnapshot | null;
}): RuntimeAttributionPresentation {
  const { composition, openingSnapshot, closingSnapshot } = input;
  const openingDate = openingSnapshot?.date ?? null;
  const closingDate = closingSnapshot?.date ?? null;
  const isZeroLengthPeriod = openingDate !== null && closingDate !== null && openingDate === closingDate;
  const hasComparablePeriod = openingDate !== null && closingDate !== null && openingDate !== closingDate;

  const derivedEvidenceItems: RuntimeAttributionEvidenceItem[] = composition.eventClassifications.flatMap(item => {
    if (item.provenance !== 'derived-transaction' || item.disposition !== 'contributing') return [];
    if (LOAN_DERIVED_EVENT_TYPES.has(item.type)) return [];
    return [{ id: item.id, type: item.type, provenance: item.provenance, contribution: item.contribution, note: financialEventTypeLabel(item.type) }];
  });

  const zeroContributionItems: RuntimeAttributionEvidenceItem[] = composition.eventClassifications.flatMap(item => {
    const isAdjustment = item.disposition === 'adjustment' && item.type === 'adjustment';
    const isInternalTransfer = item.disposition === 'excluded' && item.type === 'internal-transfer';
    if (!isAdjustment && !isInternalTransfer) return [];
    return [{ id: item.id, type: item.type, provenance: item.provenance, contribution: 0, note: ZERO_CONTRIBUTION_LABEL[item.type] ?? '0 貢獻，僅供參考' }];
  });

  const fxExcludedItems: RuntimeAttributionEvidenceItem[] = composition.diagnostics.flatMap((diagnostic): RuntimeAttributionEvidenceItem[] => {
    if (diagnostic.code === 'ledger-event-currency-unsupported' && diagnostic.eventId) {
      return [{ id: diagnostic.eventId, provenance: 'ledger', contribution: null, note: RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON }];
    }
    if (diagnostic.code === 'derived-transaction-currency-unsupported' && diagnostic.transactionId) {
      return [{ id: diagnostic.transactionId, provenance: 'derived-transaction', contribution: null, note: RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON }];
    }
    return [];
  });

  return {
    period: { openingDate, closingDate, isZeroLengthPeriod, hasComparablePeriod },
    quality: composition.attributionQuality,
    reconciled: composition.attributionQuality === 'reconciled',
    netWorthChange: presentNumber(composition.netWorthChange),
    ledgerContribution: presentNumber(composition.ledgerContribution),
    derivedContribution: presentNumber(composition.derivedContribution),
    unexplainedResidual: presentNumber(composition.unexplainedResidual),
    derivedEvidenceItems,
    zeroContributionItems,
    fxExcludedItems
  };
}

export function formatRuntimeAttributionMoney(value: RuntimeAttributionPresentationValue): string {
  if (value.status === 'unavailable' || value.value === null) return '資料不足';
  const sign = value.value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(value.value)} 元`;
}

/** Formats an itemized row's contribution; `null` (never computed) reads as insufficient data, distinct from a genuine 0. */
export function formatRuntimeAttributionItemContribution(item: RuntimeAttributionEvidenceItem): string {
  return formatRuntimeAttributionMoney(item.contribution === null ? { status: 'unavailable', value: null } : { status: 'known', value: item.contribution });
}
