import type { AllocationPreset } from './allocationPresets';

/** All weights in this module are percentage points on the 0–100 scale. */
export const CLEC_RULE_WEIGHT_UNIT = 'percent_0_to_100' as const;
export const CLEC_RULE_DEFAULTS = {
  targetWeightTolerance: 0.01,
  significantDriftMultiplier: 2,
  maxLeverageExposure: 1.5
} as const;

export type ClecQuoteFreshness = 'fresh' | 'stale' | 'missing';
export type ClecRuleAsset = {
  symbol: string;
  currentWeight: number | null;
  targetWeight: number | null;
  /** Optional caller-provided diagnostics. The rule layer verifies rather than trusts them. */
  absoluteDrift?: number | null;
  relativeDrift?: number | null;
  quoteFreshness: ClecQuoteFreshness;
  leverage?: boolean;
};
export type ClecRuleThresholds = {
  drift: number | null;
  significantMultiplier?: number | null;
  minCashReserve?: number | null;
  maxDebt?: number | null;
  maxLeverageExposure?: number | null;
};
export type ClecRuleInput = {
  strategyId: string;
  allocationPresetId: AllocationPreset;
  rebalanceMode: 'standard' | 'buy-only';
  /** Existing project canonical local date: YYYY-MM-DD in Asia/Taipei. */
  asOfDate: string;
  portfolioValue: number | null;
  investableAssets: ClecRuleAsset[];
  availableCash: number | null;
  plannedContribution: number | null;
  plannedWithdrawal: number | null;
  debtBalance: number | null;
  cashReserve: number | null;
  leverageExposure: number | null;
  threshold: ClecRuleThresholds;
  dataQualityFlags: string[];
};
export type ClecReasonCode = 'DATA_MISSING' | 'TARGET_WEIGHT_INVALID' | 'DRIFT_BELOW_THRESHOLD' | 'DRIFT_ABOVE_THRESHOLD' | 'CASH_AVAILABLE' | 'CONTRIBUTION_AVAILABLE' | 'WITHDRAWAL_REQUIRED' | 'LEVERAGE_ELEVATED' | 'CASH_RESERVE_LOW' | 'DEBT_PRESSURE' | 'QUOTE_STALE';
export type ClecRuleOutput = {
  decisionStatus: 'no_action' | 'monitor' | 'rebalance_consider' | 'rebalance_required' | 'blocked';
  recommendedAction: 'hold' | 'contribute' | 'buy_underweight' | 'sell_overweight' | 'rebalance_with_cash' | 'full_rebalance' | 'resolve_data_issue';
  severity: 'info' | 'warning' | 'high';
  /** Rule/data completeness only; this is not a forecast or statistical probability. */
  confidence: 'low' | 'medium' | 'high';
  confidenceBasis: 'data_and_rule_completeness';
  reasonCodes: ClecReasonCode[];
  summary: string;
  explanationItems: Array<{ code: ClecReasonCode; title: string; detail: string; severity: 'info' | 'warning' | 'high'; assets: string[] }>;
  affectedAssets: string[];
  blockingIssues: string[];
  warnings: string[];
  dataQualityNotes: string[];
  calculatedAt: string;
};

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const positive = (value: number | null | undefined) => finite(value) && value > 0;
const taipeiDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const labels: Record<ClecReasonCode, string> = {
  DATA_MISSING: '資料不足', TARGET_WEIGHT_INVALID: '目標比例無效', DRIFT_BELOW_THRESHOLD: '偏離未達門檻', DRIFT_ABOVE_THRESHOLD: '偏離達門檻',
  CASH_AVAILABLE: '可用現金', CONTRIBUTION_AVAILABLE: '新增投入', WITHDRAWAL_REQUIRED: '計畫提款', LEVERAGE_ELEVATED: '槓桿曝險偏高',
  CASH_RESERVE_LOW: '現金儲備偏低', DEBT_PRESSURE: '負債壓力', QUOTE_STALE: '報價非最新'
};
const stableSymbols = (symbols: string[]) => [...new Set(symbols.filter(Boolean))].sort((a, b) => a.localeCompare(b));

/**
 * Rule precedence: validate date/data/target first (blocked); then classify drift;
 * withdrawal takes precedence over contribution/cash; buy-only never emits sell/full;
 * leverage, reserve, debt and stale-quote signals add warnings without replacing the action.
 */
export function deriveClecStrategyRule(input: ClecRuleInput): ClecRuleOutput {
  const reasons: ClecReasonCode[] = [];
  const explanations: ClecRuleOutput['explanationItems'] = [];
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const add = (code: ClecReasonCode, detail: string, severity: 'info' | 'warning' | 'high', assets: string[] = []) => {
    if (!reasons.includes(code)) reasons.push(code);
    explanations.push({ code, title: labels[code], detail, severity, assets: stableSymbols(assets) });
  };
  const block = (code: ClecReasonCode, detail: string, assets: string[] = []) => {
    blockingIssues.push(detail); add(code, detail, 'high', assets);
  };

  if (!taipeiDatePattern.test(input.asOfDate)) block('DATA_MISSING', 'asOfDate 必須使用既有 Asia/Taipei 的 YYYY-MM-DD 日期格式。');
  if (!finite(input.portfolioValue) || input.portfolioValue < 0) block('DATA_MISSING', '投資組合價值缺失或無效。');
  if (!input.investableAssets.length) block('DATA_MISSING', '缺少可投資資產。');
  input.dataQualityFlags.filter(Boolean).forEach(flag => block('DATA_MISSING', flag));
  const invalidAssets = input.investableAssets.filter(asset => !asset.symbol || !finite(asset.currentWeight) || !finite(asset.targetWeight) || asset.currentWeight < 0 || asset.targetWeight < 0 || asset.quoteFreshness === 'missing');
  if (invalidAssets.length) block('DATA_MISSING', '部分資產缺少有效比例或報價。', invalidAssets.map(asset => asset.symbol));
  const targetTotal = input.investableAssets.reduce((sum, asset) => sum + (finite(asset.targetWeight) ? asset.targetWeight : 0), 0);
  if (!finite(targetTotal) || Math.abs(targetTotal - 100) > CLEC_RULE_DEFAULTS.targetWeightTolerance) block('TARGET_WEIGHT_INVALID', `目標比例總和為 ${targetTotal.toFixed(2)}%，必須為 100%。`);
  if (!finite(input.threshold.drift) || input.threshold.drift < 0) block('DATA_MISSING', '再平衡漂移門檻缺失或無效。');

  if (blockingIssues.length) return {
    decisionStatus: 'blocked', recommendedAction: 'resolve_data_issue', severity: 'high', confidence: 'low', confidenceBasis: 'data_and_rule_completeness',
    reasonCodes: reasons, summary: '資料品質未通過，停止策略判定。', explanationItems: explanations, affectedAssets: [], blockingIssues,
    warnings, dataQualityNotes: [...blockingIssues], calculatedAt: input.asOfDate
  };

  const assets = input.investableAssets.map(asset => {
    const drift = asset.currentWeight! - asset.targetWeight!;
    const absoluteDrift = Math.abs(drift);
    const expectedRelative = asset.targetWeight! === 0 ? null : drift / asset.targetWeight!;
    return { ...asset, reportedAbsoluteDrift: asset.absoluteDrift, reportedRelativeDrift: asset.relativeDrift, drift, absoluteDrift, expectedRelative };
  });
  const staleAssets = assets.filter(asset => asset.quoteFreshness === 'stale').map(asset => asset.symbol);
  if (staleAssets.length) { warnings.push('部分報價非最新，結果僅供監測。'); add('QUOTE_STALE', '部分報價非最新，請先確認資料時效。', 'warning', staleAssets); }
  const inconsistentDrift = assets.filter(asset => (finite(asset.reportedAbsoluteDrift) && Math.abs(asset.reportedAbsoluteDrift - asset.absoluteDrift) > CLEC_RULE_DEFAULTS.targetWeightTolerance) || (finite(asset.reportedRelativeDrift) && asset.expectedRelative !== null && Math.abs(asset.reportedRelativeDrift - asset.expectedRelative) > 0.0001));
  if (inconsistentDrift.length) {
    return deriveClecStrategyRule({ ...input, dataQualityFlags: [...input.dataQualityFlags, '呼叫端提供的漂移與 currentWeight／targetWeight 不一致。'] });
  }
  const threshold = input.threshold.drift!;
  const multiplier = positive(input.threshold.significantMultiplier) ? input.threshold.significantMultiplier! : CLEC_RULE_DEFAULTS.significantDriftMultiplier;
  const under = assets.filter(asset => asset.drift < 0).sort((a, b) => a.drift - b.drift || a.symbol.localeCompare(b.symbol));
  const over = assets.filter(asset => asset.drift > 0).sort((a, b) => b.drift - a.drift || a.symbol.localeCompare(b.symbol));
  const maxDrift = Math.max(...assets.map(asset => asset.absoluteDrift));
  let decisionStatus: ClecRuleOutput['decisionStatus'] = maxDrift < threshold ? 'no_action' : maxDrift >= threshold * multiplier ? 'rebalance_required' : 'rebalance_consider';
  let recommendedAction: ClecRuleOutput['recommendedAction'] = decisionStatus === 'no_action' ? 'hold' : decisionStatus === 'rebalance_required' && input.rebalanceMode === 'standard' ? 'full_rebalance' : 'hold';
  add(decisionStatus === 'no_action' ? 'DRIFT_BELOW_THRESHOLD' : 'DRIFT_ABOVE_THRESHOLD', `最大偏離 ${maxDrift.toFixed(2)}%，門檻 ${threshold.toFixed(2)}%。`, decisionStatus === 'rebalance_required' ? 'high' : 'info', [under[0]?.symbol || '', over[0]?.symbol || '']);

  if (positive(input.plannedWithdrawal)) {
    add('WITHDRAWAL_REQUIRED', '計畫提款優先於新增投入與可用現金的配置。', 'warning', over.map(asset => asset.symbol));
    if (input.rebalanceMode === 'standard' && over.length) recommendedAction = 'sell_overweight';
    else recommendedAction = 'hold';
  } else if (positive(input.plannedContribution) || positive(input.availableCash)) {
    const sourceCode = positive(input.plannedContribution) ? 'CONTRIBUTION_AVAILABLE' : 'CASH_AVAILABLE';
    add(sourceCode, positive(input.plannedContribution) ? '新增投入會優先補足低配資產。' : '可用現金可優先補足低配資產。', 'info', under.map(asset => asset.symbol));
    recommendedAction = under.length ? (input.rebalanceMode === 'buy-only' ? 'buy_underweight' : 'rebalance_with_cash') : 'contribute';
  }
  if (input.rebalanceMode === 'buy-only' && (recommendedAction === 'sell_overweight' || recommendedAction === 'full_rebalance')) recommendedAction = 'hold';

  const maxLeverage = finite(input.threshold.maxLeverageExposure) ? input.threshold.maxLeverageExposure : CLEC_RULE_DEFAULTS.maxLeverageExposure;
  if (finite(input.leverageExposure) && input.leverageExposure > maxLeverage) { warnings.push('槓桿曝險高於安全門檻。'); add('LEVERAGE_ELEVATED', '槓桿風險僅提高提醒，不會自動產生賣出動作。', 'warning'); }
  if (finite(input.cashReserve) && finite(input.threshold.minCashReserve) && input.cashReserve < input.threshold.minCashReserve) { warnings.push('現金儲備低於設定門檻。'); add('CASH_RESERVE_LOW', '現金儲備偏低，請保留資金彈性。', 'warning'); }
  if (finite(input.debtBalance) && finite(input.threshold.maxDebt) && input.debtBalance > input.threshold.maxDebt) { warnings.push('負債高於設定門檻。'); add('DEBT_PRESSURE', '負債壓力偏高，請將還款能力納入決策。', 'warning'); }

  const affectedAssets = stableSymbols([...under, ...over].sort((a, b) => b.absoluteDrift - a.absoluteDrift || a.symbol.localeCompare(b.symbol)).map(asset => asset.symbol));
  return {
    decisionStatus, recommendedAction, severity: decisionStatus === 'rebalance_required' ? 'high' : warnings.length ? 'warning' : 'info',
    confidence: staleAssets.length ? 'medium' : 'high', confidenceBasis: 'data_and_rule_completeness', reasonCodes: reasons,
    summary: decisionStatus === 'no_action' ? '目前偏離未達門檻，維持監測。' : '策略規則結果僅供決策輔助，非自動交易，亦不代表市場預測。',
    explanationItems: explanations, affectedAssets, blockingIssues, warnings, dataQualityNotes: staleAssets.length ? ['部分報價非最新。'] : [], calculatedAt: input.asOfDate
  };
}
