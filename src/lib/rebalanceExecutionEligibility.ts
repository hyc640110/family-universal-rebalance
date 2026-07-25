import type { ClecReasonCode, ClecRuleOutput } from './clecStrategyRules';
import type { RecommendationAction } from './rebalanceRecommendation';

type RecommendationOutput = {
  canRecommend: boolean; mode: 'standard' | 'buy-only'; thresholdReached: boolean; liquidCash: number;
  buyTotal: number | null; cashShortfall: number | null;
  // V7.0B sub-PR 3 (013 §12.3): these three are read as-is from deriveRebalanceRecommendation's real output — no
  // new math happens in rebalanceRecommendation.ts, this file only surfaces them under the eligibility contract.
  availableBuyBudget: number | null; remainingBudget: number | null; unresolvedGap: number | null;
  rows: ReadonlyArray<{
    symbol: string; name: string; action: RecommendationAction; difference: number; recommendedAmount: number | null; unresolvedAmount: number | null;
  }>;
};

export type RebalanceExecutionEligibilityStatus = 'eligible' | 'partially_eligible' | 'blocked' | 'reference_only' | 'unavailable';
export type RebalanceExecutionEligibilityReasonCode = ClecReasonCode | 'REBALANCE_DATA_BLOCKED' | 'BUY_ONLY_SELL_EXCLUDED' | 'THRESHOLD_NOT_REACHED' | 'CASH_INSUFFICIENT' | 'THEORETICAL_REFERENCE';
export type RebalanceExecutionEligibleItem = {
  symbol: string; name: string; theoreticalDirection: 'buy' | 'sell' | 'hold' | 'unavailable'; theoreticalAmount: number | null;
  eligibleDirection: 'buy' | 'sell' | 'hold' | 'unavailable'; eligibleAmount: number | null; status: 'eligible' | 'excluded' | 'reference_only' | 'blocked' | 'unavailable';
  reasonCodes: RebalanceExecutionEligibilityReasonCode[]; explanation: string;
};
export type RebalanceExecutionEligibilityOutput = {
  status: RebalanceExecutionEligibilityStatus; eligiblePlanState: 'available' | 'partial' | 'blocked' | 'reference_only' | 'unavailable';
  theoreticalPlan: Pick<RecommendationOutput, 'mode' | 'rows'>; eligibleItems: RebalanceExecutionEligibleItem[];
  /** 013 §12.3 三個獨立數字：可投資現金（investable cash 基礎）／實際可執行（受現金基礎限制後的理論買入總額）／外部資金需求（理論買入超出現金基礎的缺口）。三者皆直接沿用 deriveRebalanceRecommendation 既有欄位，未新增計算公式；資料不足或未達執行判斷的分支一律為 null，不以 0 偽裝。 */
  investableCash: number | null; executableAmount: number | null; externalFundingRequired: number | null;
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
  // 013 §12.3 contract fields. Read verbatim from deriveRebalanceRecommendation's own output — this file adds no
  // new calculation, it only relabels existing fields under the eligibility vocabulary (investable cash basis /
  // executable portion of the theoretical buy total / theoretical shortfall against that basis).
  const investableCash = finite(recommendation.availableBuyBudget) ? recommendation.availableBuyBudget : null;
  const executableAmount = finite(recommendation.buyTotal) && finite(recommendation.availableBuyBudget) ? Math.min(recommendation.buyTotal, recommendation.availableBuyBudget) : null;
  const externalFundingRequired = recommendation.mode === 'standard'
    ? (finite(recommendation.cashShortfall) ? recommendation.cashShortfall : null)
    : (finite(recommendation.unresolvedGap) ? recommendation.unresolvedGap : null);
  const moneyContract = { investableCash, executableAmount, externalFundingRequired };
  const base = recommendation.rows.map(row => ({ symbol: row.symbol, name: row.name, ...theoretical(row), eligibleDirection: 'unavailable' as const, eligibleAmount: null, status: 'reference_only' as const, reasonCodes: [] as RebalanceExecutionEligibilityReasonCode[], explanation: '理論配置差額僅供參考，目前尚未形成可採用計畫。' }));
  const blocked = rule.decisionStatus === 'blocked' || rule.blockingIssues.length > 0 || !recommendation.canRecommend;
  const blockedReasonInput: RebalanceExecutionEligibilityReasonCode[] = [...rule.reasonCodes, ...(recommendation.canRecommend ? [] : ['REBALANCE_DATA_BLOCKED' as RebalanceExecutionEligibilityReasonCode])];
  const blockedReasons = unique(blockedReasonInput);
  if (blocked) return {
    status: 'blocked', eligiblePlanState: 'blocked', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows },
    eligibleItems: base.map(item => ({ ...item, status: 'blocked', reasonCodes: blockedReasons, explanation: '理論配置差額僅供參考，目前不可作為可採用計畫。' })),
    ...moneyContract,
    reasonCodes: blockedReasons, explanations: unique([...rule.blockingIssues, ...rule.dataQualityNotes, '理論配置差額僅供參考，目前不可作為可採用計畫。']),
    limitations: ['資料品質未通過時，不輸出一般可採用買入或賣出方向。']
  };
  if (!recommendation.rows.length) return {
    status: 'unavailable', eligiblePlanState: 'unavailable', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows }, eligibleItems: [],
    ...moneyContract,
    reasonCodes: ['THEORETICAL_REFERENCE'], explanations: ['既有再平衡輸出沒有資產項目，無法形成可採用計畫。'], limitations: ['不以空清單或 0 元表示可採用。']
  };
  const belowThreshold = !recommendation.thresholdReached || rule.decisionStatus === 'no_action' || rule.reasonCodes.includes('DRIFT_BELOW_THRESHOLD');
  if (belowThreshold) return {
    status: 'reference_only', eligiblePlanState: 'reference_only', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows },
    eligibleItems: base.map(item => ({ ...item, reasonCodes: ['THRESHOLD_NOT_REACHED', 'THEORETICAL_REFERENCE'], explanation: '目前未達再平衡門檻，保留為理論參考。' })),
    ...moneyContract,
    reasonCodes: ['THRESHOLD_NOT_REACHED', 'THEORETICAL_REFERENCE'], explanations: ['目前未達再平衡門檻，理論配置差額不呈現為目前可採用計畫。'], limitations: ['僅供決策輔助，不會自動交易。']
  };
  // V7.0B sub-PR 1/2 already gate recommendation.canRecommend = false (and therefore this function's own `blocked`
  // branch above) whenever household-liquidity investableCash itself is null — see rebalanceRecommendation.ts's
  // own blockingReasons. By the time execution reaches this point, availableBuyBudget is always a confirmed number
  // for both modes, so a separate "cash amount unconfirmed" check here would never fire; it was dead weight left
  // over from before investableCash existed (it used to read the CLEC-level, pre-Household-Liquidity
  // `rule.financialSummary.availableCash`, a different and now-redundant cash figure). Removed rather than
  // rewired — the only remaining money-insufficiency case this file needs to gate is standard mode's shortfall.
  const cashInsufficient = recommendation.mode === 'standard' && finite(recommendation.cashShortfall) && recommendation.cashShortfall > 0;
  if (cashInsufficient) {
    const copy = '既有輸出顯示現金不足，可投資現金、實際可執行金額與外部資金需求另以獨立欄位提供，不拆分個別標的金額。';
    return {
      status: 'reference_only', eligiblePlanState: 'reference_only', theoreticalPlan: { mode: recommendation.mode, rows: recommendation.rows },
      eligibleItems: base.map(item => ({ ...item, reasonCodes: ['CASH_INSUFFICIENT', 'THEORETICAL_REFERENCE'], explanation: copy })),
      ...moneyContract,
      reasonCodes: ['CASH_INSUFFICIENT', 'THEORETICAL_REFERENCE'], explanations: [copy], limitations: ['僅呈現整體可投資現金與外部資金需求，不拆分個別標的的可執行金額。']
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
    ...moneyContract,
    reasonCodes: hasExcluded ? ['BUY_ONLY_SELL_EXCLUDED'] : [], explanations: [allUnavailable ? '既有輸出未提供可採用金額。' : hasExcluded ? '部分理論項目因只買不賣限制未納入可採用計畫。' : '既有規則與資料品質允許沿用理論方向及金額。'], limitations: ['僅供決策輔助，不會自動交易。']
  };
}
