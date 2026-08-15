// UR-TODO-058: pure calculation core for the "三策略模擬比較" (three-rebalance-strategy
// comparison) tool. This is a standalone what-if simulator, not a decision engine — every input
// here is a user-typed hypothetical value (starting market value, period contribution, target
// weight, leverage multiplier assumption). It never reads AppState/Holding/quotes, never writes
// anywhere, and is completely independent of clecStrategyRules.ts / rebalanceExecutionEligibility.ts
// / rebalanceRecommendation.ts / the existing hardcoded portfolio Beta at App.tsx's calculateMetrics().
//
// Fixed to exactly the three assets the source Excel (EP04-02-大道至簡投資法-資產配置與再平衡)
// models — 0050 / 00631L / 00865B — because all three strategies are defined in terms of these
// specific symbols (聰明再平衡／無腦再平衡 only ever move money between 00631L and 00865B by name;
// 比率再平衡 collapses to a generic N-asset formula but there is no requirement to generalize it
// beyond what the source material covers).

export type StrategyAssetSymbol = '0050' | '00631L' | '00865B';

export const STRATEGY_ASSET_SYMBOLS: readonly StrategyAssetSymbol[] = ['0050', '00631L', '00865B'];

export type StrategyComparisonAssetInput = {
  /** 目前市值（假設值，非讀取正式持股）。 */
  currentValue: number;
  /** 目標權重，單位：百分比（0～100）。 */
  targetWeightPct: number;
  /** Beta 曝險用槓桿倍數假設值（例如 0050→1、00631L→2、00865B→0）。 */
  leverageMultiplier: number;
};

export type StrategyComparisonAssets = Record<StrategyAssetSymbol, StrategyComparisonAssetInput>;

export type SmartRebalanceInput = {
  /** 00631L 期初市值（假設值）。 */
  initialValue00631L: number;
  /** 00631L 期間買進金額（假設值）。 */
  periodContribution00631L: number;
  /** 上漲平衡%，單位：百分比（0～100），預設 30。 */
  upBalancePct: number;
  /** 下跌平衡金（使用者輸入的固定金額）。 */
  downBalanceAmount: number;
};

export const DEFAULT_UP_BALANCE_PCT = 30;
/** 示意值，對照原始 Excel 範例；使用者可自行調整，非正式建議金額。 */
export const DEFAULT_DOWN_BALANCE_AMOUNT = 600_000;

export type StrategyAction = 'buy' | 'sell' | 'hold';
export type StrategyAdjustment = { symbol: StrategyAssetSymbol; amount: number; action: StrategyAction };

// Mirrors rebalanceRecommendation.ts's own amountFloor=1 convention: a difference under this
// magnitude reads as "hold" rather than a spurious sub-dollar buy/sell.
//
// Repository-wide note (read-only audit, 2026-08-15): deriveRatioRebalance() below is the second
// of three independent implementations of "target value = total value × target weight%; diff =
// target − current" — the others are rebalanceRecommendation.ts's deriveRebalanceRecommendation()
// (the real decision engine, with data quality gates and budget clamping this simulator
// deliberately omits) and AllocationSimulatorPage.tsx's inline calculation (a third simulator with
// its own separate funding model). Kept independent on purpose: this is a pure what-if comparison
// tool that must not inherit the decision engine's blocking/budget rules. If this file's formula
// details change (rounding, floor value, etc.), check whether the other two need the same update.
const AMOUNT_FLOOR = 1;
const actionFor = (adjustment: number): StrategyAction => Math.abs(adjustment) < AMOUNT_FLOOR ? 'hold' : adjustment > 0 ? 'buy' : 'sell';

const totalValueOf = (assets: StrategyComparisonAssets) =>
  STRATEGY_ASSET_SYMBOLS.reduce((sum, symbol) => sum + assets[symbol].currentValue, 0);

export type SmartRebalanceResult = {
  /** 期間漲跌 = 目前市值(00631L) − 期初市值 − 期間買進金額。 */
  periodChange: number;
  /** 分支依「期間漲跌 > 0」判斷；剛好等於 0 落在 'down' 分支（比照使用者規格：≤ 0 都算賠錢）。 */
  branch: 'up' | 'down';
  adjustments: StrategyAdjustment[];
};

/** 聰明再平衡：僅 00631L／00865B 受影響，0050 恆為 hold。 */
export function deriveSmartRebalance(assets: StrategyComparisonAssets, input: SmartRebalanceInput): SmartRebalanceResult {
  const periodChange = assets['00631L'].currentValue - input.initialValue00631L - input.periodContribution00631L;
  const branch: 'up' | 'down' = periodChange > 0 ? 'up' : 'down';
  const moveAmount = branch === 'up'
    ? periodChange * (Math.max(0, input.upBalancePct) / 100)
    : Math.max(0, input.downBalanceAmount);
  // 'up': sell moveAmount worth of 00631L into 00865B. 'down': buy moveAmount worth of 00631L
  // funded by selling 00865B.
  const adjustment00631L = branch === 'up' ? -moveAmount : moveAmount;
  const adjustment00865B = -adjustment00631L;
  return {
    periodChange,
    branch,
    adjustments: [
      { symbol: '0050', amount: 0, action: 'hold' },
      { symbol: '00631L', amount: adjustment00631L, action: actionFor(adjustment00631L) },
      { symbol: '00865B', amount: adjustment00865B, action: actionFor(adjustment00865B) }
    ]
  };
}

export type DumbRebalanceResult = { adjustments: StrategyAdjustment[] };

/**
 * 無腦再平衡：只在 00631L／00865B 之間，依兩者目標權重「彼此之間」的比例互換（renormalized
 * within the pair — not each symbol's raw share of the full 3-asset 100%，否則量綱對不上：市值
 * 乘上「佔全部資產的目標權重」不會等於這兩檔重新分配後各自該有的市值）。0050 恆為 hold。
 */
export function deriveDumbRebalance(assets: StrategyComparisonAssets): DumbRebalanceResult {
  const value00631L = assets['00631L'].currentValue;
  const value00865B = assets['00865B'].currentValue;
  const combinedValue = value00631L + value00865B;
  const pairTargetTotal = assets['00631L'].targetWeightPct + assets['00865B'].targetWeightPct;
  const ratio00631L = pairTargetTotal > 0 ? assets['00631L'].targetWeightPct / pairTargetTotal : 0;
  const target00631LValue = combinedValue * ratio00631L;
  const target00865BValue = combinedValue - target00631LValue;
  const adjustment00631L = target00631LValue - value00631L;
  const adjustment00865B = target00865BValue - value00865B;
  return {
    adjustments: [
      { symbol: '0050', amount: 0, action: 'hold' },
      { symbol: '00631L', amount: adjustment00631L, action: actionFor(adjustment00631L) },
      { symbol: '00865B', amount: adjustment00865B, action: actionFor(adjustment00865B) }
    ]
  };
}

export type RatioRebalanceResult = { adjustments: StrategyAdjustment[]; totalValue: number };

/** 比率再平衡：三檔全部依（目標權重 × 總市值 − 目前市值）收斂，正值＝理論買進、負值＝理論賣出。 */
export function deriveRatioRebalance(assets: StrategyComparisonAssets): RatioRebalanceResult {
  const totalValue = totalValueOf(assets);
  // See the repository-wide duplication note above AMOUNT_FLOOR — this is the 2nd of 3 parallel
  // target-value/difference implementations; check rebalanceRecommendation.ts and
  // AllocationSimulatorPage.tsx before changing this formula's details.
  const adjustments = STRATEGY_ASSET_SYMBOLS.map(symbol => {
    const targetValue = totalValue * assets[symbol].targetWeightPct / 100;
    const amount = targetValue - assets[symbol].currentValue;
    return { symbol, amount, action: actionFor(amount) };
  });
  return { adjustments, totalValue };
}

export type BetaExposureResult = {
  /** 依目前市值加權的 Beta。 */
  currentBeta: number;
  /** 依目標權重加權的 Beta。 */
  targetBeta: number;
  totalValue: number;
};

/** Beta 曝險：純顯示用途，槓桿倍數為使用者輸入的假設值，不重用或修改 App.tsx 既有的正式 m.beta。 */
export function deriveBetaExposure(assets: StrategyComparisonAssets): BetaExposureResult {
  const totalValue = totalValueOf(assets);
  const currentBeta = totalValue > 0
    ? STRATEGY_ASSET_SYMBOLS.reduce((sum, symbol) => sum + assets[symbol].leverageMultiplier * (assets[symbol].currentValue / totalValue), 0)
    : 0;
  const targetBeta = STRATEGY_ASSET_SYMBOLS.reduce((sum, symbol) => sum + assets[symbol].leverageMultiplier * (assets[symbol].targetWeightPct / 100), 0);
  return { currentBeta, targetBeta, totalValue };
}

export type StrategyComparisonValidationError =
  | 'NEGATIVE_CURRENT_VALUE'
  | 'NEGATIVE_TARGET_WEIGHT'
  | 'NEGATIVE_INITIAL_VALUE'
  | 'NEGATIVE_PERIOD_CONTRIBUTION'
  | 'NEGATIVE_DOWN_BALANCE_AMOUNT'
  | 'INVALID_UP_BALANCE_PCT'
  | 'DATE_RANGE_REVERSED';

export const VALIDATION_ERROR_MESSAGES: Record<StrategyComparisonValidationError, string> = {
  NEGATIVE_CURRENT_VALUE: '目前市值不可為負數。',
  NEGATIVE_TARGET_WEIGHT: '目標權重不可為負數。',
  NEGATIVE_INITIAL_VALUE: '期初市值不可為負數。',
  NEGATIVE_PERIOD_CONTRIBUTION: '期間買進金額不可為負數。',
  NEGATIVE_DOWN_BALANCE_AMOUNT: '下跌平衡金不可為負數。',
  INVALID_UP_BALANCE_PCT: '上漲平衡% 需介於 0～100 之間。',
  DATE_RANGE_REVERSED: '期間結束日期不可早於期間開始日期。'
};

export type StrategyComparisonValidationInput = {
  assets: StrategyComparisonAssets;
  smart: SmartRebalanceInput;
  periodStartDate?: string;
  periodEndDate?: string;
};

/** 純驗證函式：所有輸入皆為使用者假設值，這裡只檢查數值本身是否合理，不讀取任何正式資料。 */
export function validateStrategyComparisonInput(input: StrategyComparisonValidationInput): StrategyComparisonValidationError[] {
  const errors: StrategyComparisonValidationError[] = [];
  if (STRATEGY_ASSET_SYMBOLS.some(symbol => !Number.isFinite(input.assets[symbol].currentValue) || input.assets[symbol].currentValue < 0)) {
    errors.push('NEGATIVE_CURRENT_VALUE');
  }
  if (STRATEGY_ASSET_SYMBOLS.some(symbol => !Number.isFinite(input.assets[symbol].targetWeightPct) || input.assets[symbol].targetWeightPct < 0)) {
    errors.push('NEGATIVE_TARGET_WEIGHT');
  }
  if (!Number.isFinite(input.smart.initialValue00631L) || input.smart.initialValue00631L < 0) errors.push('NEGATIVE_INITIAL_VALUE');
  if (!Number.isFinite(input.smart.periodContribution00631L) || input.smart.periodContribution00631L < 0) errors.push('NEGATIVE_PERIOD_CONTRIBUTION');
  if (!Number.isFinite(input.smart.downBalanceAmount) || input.smart.downBalanceAmount < 0) errors.push('NEGATIVE_DOWN_BALANCE_AMOUNT');
  if (!Number.isFinite(input.smart.upBalancePct) || input.smart.upBalancePct < 0 || input.smart.upBalancePct > 100) errors.push('INVALID_UP_BALANCE_PCT');
  if (input.periodStartDate && input.periodEndDate && input.periodEndDate < input.periodStartDate) errors.push('DATE_RANGE_REVERSED');
  return errors;
}
