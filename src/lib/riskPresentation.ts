import type { HouseholdLiquidityBlockingReason } from './householdLiquidity';
import type { RiskMetrics } from './riskMetrics';

type RiskPresentationInput = Pick<RiskMetrics, 'monthlyEssentialExpenses' | 'safetyCashShortfall' | 'investableCash' | 'dataCompleteness' | 'confidence' | 'blockingReasons'>;

const confidenceLabels = { high: '高', medium: '中', low: '低' } as const;
const dataStatuses = { complete: '資料完整', partial: '資料部分缺漏', insufficient: '資料不足' } as const;
const duplicateSourceCodes = new Set<HouseholdLiquidityBlockingReason['code']>([
  'DUPLICATE_LIQUID_ACCOUNT_ID',
  'DUPLICATE_LIVING_EXPENSE_SOURCE_ID',
  'DUPLICATE_LOAN_LINK'
]);

export function deriveRiskPresentation(risk: RiskPresentationInput) {
  return {
    monthlyEssentialExpenses: risk.monthlyEssentialExpenses,
    safetyCashShortfall: risk.safetyCashShortfall,
    investableCash: risk.investableCash,
    confidence: risk.confidence,
    confidenceLabel: confidenceLabels[risk.confidence],
    dataStatus: dataStatuses[risk.dataCompleteness],
    duplicateSourceWarnings: risk.blockingReasons.filter(reason => duplicateSourceCodes.has(reason.code)).map(reason => reason.message)
  };
}
