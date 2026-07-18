import type { ClecReasonCode, ClecRuleOutput } from './clecStrategyRules';
import type { RecommendationAction } from './rebalanceRecommendation';

type RecommendationOutput = {
  canRecommend: boolean; mode: 'standard' | 'buy-only'; thresholdReached: boolean; liquidCash: number;
  buyTotal: number | null; cashShortfall: number | null; rows: ReadonlyArray<{
    symbol: string; name: string; action: RecommendationAction; difference: number; recommendedAmount: number | null; unresolvedAmount: number | null;
  }>;
};

export type RebalanceExecutionEligibilityStatus = 'eligible' | 'partially_eligible' | 'blocked' | 'reference_only' | 'unavailable';
export type RebalanceExecutionEligibilityReasonCode = ClecReasonCode | 'REBALANCE_DATA_BLOCKED' | 'BUY_ONLY_SELL_EXCLUDED' | 'THRESHOLD_NOT_REACHED' | 'CASH_AMOUNT_UNCONFIRMED' | 'CASH_INSUFFICIENT' | 'THEORETICAL_REFERENCE';
export type RebalanceExecutionEligibleItem = {
  symbol: string; name: string; theoreticalDirection: 'buy' | 'sell' | 'hold' | 'unavailable'; theoreticalAmount: number | null;
  eligibleDirection: 'buy' | 'sell' | 'hold' | 'unavailable'; eligibleAmount: number | null; status: 'eligible' | 'excluded' | 'reference_only' | 'blocked' | 'unavailable';
  reasonCodes: RebalanceExecutionEligibilityReasonCode[]; explanation: string;
};
export type RebalanceExecutionEligibilityOutput = {
  status: RebalanceExecutionEligibilityStatus; eligiblePlanState: 'available' | 'partial' | 'blocked' | 'reference_only' | 'unavailable';
  theoreticalPlan: Pick<RecommendationOutput, 'mode' | 'rows'>; eligibleItems: RebalanceExecutionEligibleItem[];
  reasonCodes: RebalanceExecutionEligibilityReasonCode[]; explanations: string[]; limitations: string[];
};

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const unique = <T,>(items: T[]) => [...new Set(items)];
const theoretical = (row: RecommendationOutput['rows'][number]): Pick<RebalanceExecutionEligibleItem, 'theoreticalDirection' | 'theoreticalAmount'> => {
  if (!finite(row.difference)) return { theoreticalDirection: 'unavailable', theoreticalAmount: null };
  if (row.difference > 1) return { theoreticalDirection: 'buy', theoreticalAmount: row.difference };
  if (row.difference < -1) return { theoreticalDirection: 'sell', theoreticalAmount: Math.abs(row.difference) };
  return { theoreticalDirection: 'hold', theoreticalAmount: 0 };
};

/** Pure adapter. It never recalculates allocation, drift, money amounts, or CLEC rules. */
export function deriveRebalanceExecutionEligibility(input: { clecRuleOutput: ClecRuleOutput; recommendation: RecommendationOutput }): RebalanceExecutionEligibilityOutput {
  const { clecRuleOutput: rule, recommendation } = input;
  const base = recommendation.rows.map(row => ({ symbol: row.symbol, name: row.name, ...theoretical(row), eligibleDirection: 'unavailable' as const, eligibleAmount: null, status: 'reference_only' as const, reasonCodes: [] as RebalanceExecutionEligibilityReasonCode[], explanation: '理論配置差額僅供參考，目前尚未形成可採用計畫。' }));
  const blocked = rule.decisionStatus === 'blocked' || rule.blockingIssues.length > 0 || !recommendation.canRecommend;
  const blockedReasonInput: RebalanceExecutionEligibilityReasonCode[] = [...rule.reasonCodes, ...(recommendation.canRecommend ? [] : ['REBALANCE_DATA_BLOCKED' as RebalanceExecutionEligibilityReasonCode])];
  const blockedReasons = unique(blockedReasonInput);
  if (blocked) return {
    status: 'blocked', eligiblePlanState: 'blocked', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows },
    eligibleItems: base.map(item => ({ ...item, status: 'blocked', reasonCodes: blockedReasons, explanation: '理論配置差額僅供參考，目前不可作為可採用計畫。' })),
    reasonCodes: blockedReasons, explanations: unique([...rule.blockingIssues, ...rule.dataQualityNotes, '理論配置差額僅供參考，目前不可作為可採用計畫。']),
    limitations: ['資料品質未通過時，不輸出一般可採用買入或賣出方向。']
  };
  if (!recommendation.rows.length) return {
    status: 'unavailable', eligiblePlanState: 'unavailable', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows }, eligibleItems: [],
    reasonCodes: ['THEORETICAL_REFERENCE'], explanations: ['既有再平衡輸出沒有資產項目，無法形成可採用計畫。'], limitations: ['不以空清單或 0 元表示可採用。']
  };
  const belowThreshold = !recommendation.thresholdReached || rule.decisionStatus === 'no_action' || rule.reasonCodes.includes('DRIFT_BELOW_THRESHOLD');
  if (belowThreshold) return {
    status: 'reference_only', eligiblePlanState: 'reference_only', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows },
    eligibleItems: base.map(item => ({ ...item, reasonCodes: ['THRESHOLD_NOT_REACHED', 'THEORETICAL_REFERENCE'], explanation: '目前未達再平衡門檻，保留為理論參考。' })),
    reasonCodes: ['THRESHOLD_NOT_REACHED', 'THEORETICAL_REFERENCE'], explanations: ['目前未達再平衡門檻，理論配置差額不呈現為目前可採用計畫。'], limitations: ['僅供決策輔助，不會自動交易。']
  };
  const cashPreferred = rule.recommendedAction === 'rebalance_with_cash' || rule.recommendedAction === 'buy_underweight';
  const cashConfirmed = finite(rule.financialSummary.availableCash);
  const cashInsufficient = recommendation.mode === 'standard' && finite(recommendation.cashShortfall) && recommendation.cashShortfall > 0;
  if ((cashPreferred && !cashConfirmed) || cashInsufficient) {
    const code: RebalanceExecutionEligibilityReasonCode = !cashConfirmed ? 'CASH_AMOUNT_UNCONFIRMED' : 'CASH_INSUFFICIENT';
    const copy = !cashConfirmed ? '目前規則只確認可優先使用現金，但缺少可分配金額契約。' : '既有輸出顯示現金不足，未新增分配公式。';
    return {
      status: 'reference_only', eligiblePlanState: 'reference_only', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows },
      eligibleItems: base.map(item => ({ ...item, reasonCodes: [code, 'THEORETICAL_REFERENCE'], explanation: copy })), reasonCodes: [code, 'THEORETICAL_REFERENCE'], explanations: [copy], limitations: ['後續 Scenario Sprint 才會建立投入或提款的正式資金契約。']
    };
  }
  const items: RebalanceExecutionEligibleItem[] = base.map((item, index) => {
    const row = recommendation.rows[index];
    if (recommendation.mode === 'buy-only' && item.theoreticalDirection === 'sell') return { ...item, status: 'excluded' as const, reasonCodes: ['BUY_ONLY_SELL_EXCLUDED'] as RebalanceExecutionEligibilityReasonCode[], explanation: '只買不賣模式下，理論賣出僅保留於理論配置差額。' };
    if ((row.action !== 'buy' && row.action !== 'sell') || !finite(row.recommendedAmount)) return { ...item, eligibleDirection: item.theoreticalDirection === 'hold' ? 'hold' as const : 'unavailable' as const, eligibleAmount: item.theoreticalDirection === 'hold' ? 0 : null, status: item.theoreticalDirection === 'hold' ? 'eligible' as const : 'unavailable' as const, reasonCodes: item.theoreticalDirection === 'hold' ? [] as RebalanceExecutionEligibilityReasonCode[] : ['THEORETICAL_REFERENCE'] as RebalanceExecutionEligibilityReasonCode[], explanation: item.theoreticalDirection === 'hold' ? '目前已接近目標市值。' : '既有輸出未提供可採用金額。' };
    return { ...item, eligibleDirection: row.action === 'buy' ? 'buy' : 'sell', eligibleAmount: row.recommendedAmount, status: 'eligible' as const, reasonCodes: [] as RebalanceExecutionEligibilityReasonCode[], explanation: '沿用既有規則與理論建議的方向及金額。' };
  });
  const hasExcluded = items.some(item => item.status === 'excluded' || item.status === 'unavailable');
  const allUnavailable = items.every(item => item.status === 'unavailable');
  return {
    status: allUnavailable ? 'unavailable' : hasExcluded ? 'partially_eligible' : 'eligible', eligiblePlanState: allUnavailable ? 'unavailable' : hasExcluded ? 'partial' : 'available', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows }, eligibleItems: items,
    reasonCodes: hasExcluded ? ['BUY_ONLY_SELL_EXCLUDED'] : [], explanations: [allUnavailable ? '既有輸出未提供可採用金額。' : hasExcluded ? '部分理論項目因只買不賣限制未納入可採用計畫。' : '既有規則與資料品質允許沿用理論方向及金額。'], limitations: ['僅供決策輔助，不會自動交易。']
  };
}
