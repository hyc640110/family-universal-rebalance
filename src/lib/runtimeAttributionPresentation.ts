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

export type RuntimeAttributionZeroContributionItem = {
  id: string;
  type: FinancialEventType;
  provenance: 'ledger' | 'derived-transaction';
  label: string;
};

export type RuntimeAttributionExcludedItem = {
  id: string;
  provenance: 'ledger' | 'derived-transaction';
  reason: string;
};

export type RuntimeAttributionPresentation = {
  period: RuntimeAttributionPeriodPresentation;
  quality: NetWorthAttributionQuality;
  reconciled: boolean;
  netWorthChange: RuntimeAttributionPresentationValue;
  ledgerContribution: RuntimeAttributionPresentationValue;
  derivedContribution: RuntimeAttributionPresentationValue;
  unexplainedResidual: RuntimeAttributionPresentationValue;
  zeroContributionItems: RuntimeAttributionZeroContributionItem[];
  fxExcludedItems: RuntimeAttributionExcludedItem[];
};

function presentNumber(value: number | null): RuntimeAttributionPresentationValue {
  return value === null || !Number.isFinite(value) ? { status: 'unavailable', value: null } : { status: 'known', value };
}

/**
 * Maps an already-composed runtime attribution result (from
 * composeRuntimeNetWorthAttribution) plus the caller's chosen opening/closing
 * snapshots into a display-only presentation. It performs no financial
 * calculation: the zero-length-period flag is a plain date comparison the
 * composition itself does not expose.
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

  const zeroContributionItems: RuntimeAttributionZeroContributionItem[] = composition.eventClassifications.flatMap(item => {
    const isAdjustment = item.disposition === 'adjustment' && item.type === 'adjustment';
    const isInternalTransfer = item.disposition === 'excluded' && item.type === 'internal-transfer';
    if (!isAdjustment && !isInternalTransfer) return [];
    return [{ id: item.id, type: item.type, provenance: item.provenance, label: ZERO_CONTRIBUTION_LABEL[item.type] ?? '0 貢獻，僅供參考' }];
  });

  const fxExcludedItems: RuntimeAttributionExcludedItem[] = composition.diagnostics.flatMap((diagnostic): RuntimeAttributionExcludedItem[] => {
    if (diagnostic.code === 'ledger-event-currency-unsupported' && diagnostic.eventId) {
      return [{ id: diagnostic.eventId, provenance: 'ledger', reason: RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON }];
    }
    if (diagnostic.code === 'derived-transaction-currency-unsupported' && diagnostic.transactionId) {
      return [{ id: diagnostic.transactionId, provenance: 'derived-transaction', reason: RUNTIME_ATTRIBUTION_FX_EXCLUDED_REASON }];
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
    zeroContributionItems,
    fxExcludedItems
  };
}

export function formatRuntimeAttributionMoney(value: RuntimeAttributionPresentationValue): string {
  if (value.status === 'unavailable' || value.value === null) return '資料不足';
  const sign = value.value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(value.value)} 元`;
}
