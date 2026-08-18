import { deriveAllocationPresetPreview, type AllocationRole, type AllocationPreset } from './allocationPresets';
import { deriveClecStrategyRule, type ClecRuleOutput } from './clecStrategyRules';

/** Historical returns are percentage points: 10 means +10%, and -8 means -8%. */
export type ClecHistoricalReturnByRole = Record<ClecHistoricalRole, number>;
export type ClecHistoricalRole = Exclude<AllocationRole, 'none'>;
export type ClecHistoricalPreset = Exclude<AllocationPreset, 'custom'>;
export type ClecHistoricalBacktestInput = {
  preset: ClecHistoricalPreset;
  initialCapital: number;
  periods: Array<{
    /** Existing project canonical local calendar day: YYYY-MM-DD in Asia/Taipei. */
    date: string;
    returnPctByRole: ClecHistoricalReturnByRole;
  }>;
  threshold: {
    drift: number;
    significantMultiplier?: number;
  };
};

export type ClecHistoricalValues = Record<ClecHistoricalRole, number>;
export type ClecHistoricalBacktestPeriod = {
  date: string;
  openingValues: ClecHistoricalValues;
  closingValuesBeforeRebalance: ClecHistoricalValues;
  weightsBeforeRebalance: ClecHistoricalValues;
  rule: ClecRuleOutput;
  rebalanced: boolean;
  endingValues: ClecHistoricalValues;
  endingPortfolioValue: number;
};
export type ClecHistoricalBacktestSuccess = {
  status: 'ok';
  /** This Foundation assumes frictionless rebalance: no fee, tax, slippage, lot size, or settlement delay. */
  executionAssumption: 'frictionless';
  preset: ClecHistoricalPreset;
  targetWeights: ClecHistoricalValues;
  initialCapital: number;
  finalValue: number;
  totalReturnPct: number;
  /** Positive loss magnitude, calculated from the running period-ending peak. */
  maxDrawdownPct: number;
  rebalanceCount: number;
  periods: ClecHistoricalBacktestPeriod[];
};
export type ClecHistoricalBacktestInvalidInput = {
  status: 'invalid_input';
  issues: string[];
};
export type ClecHistoricalBacktestResult = ClecHistoricalBacktestSuccess | ClecHistoricalBacktestInvalidInput;

const ROLES = ['prototype', 'leveraged', 'cash-like'] as const satisfies readonly ClecHistoricalRole[];
const ROLE_SYMBOLS: Record<ClecHistoricalRole, string> = {
  prototype: '__CLEC_HISTORICAL_PROTOTYPE__',
  leveraged: '__CLEC_HISTORICAL_LEVERAGED__',
  'cash-like': '__CLEC_HISTORICAL_CASH_LIKE__'
};

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const emptyValues = (): ClecHistoricalValues => ({ prototype: 0, leveraged: 0, 'cash-like': 0 });
const sumValues = (values: ClecHistoricalValues) => ROLES.reduce((sum, role) => sum + values[role], 0);
const valuesAtWeights = (portfolioValue: number, weights: ClecHistoricalValues): ClecHistoricalValues => ({
  prototype: portfolioValue * weights.prototype / 100,
  leveraged: portfolioValue * weights.leveraged / 100,
  'cash-like': portfolioValue * weights['cash-like'] / 100
});

const isTaipeiCalendarDay = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

function deriveTargetWeights(preset: ClecHistoricalPreset): ClecHistoricalValues | null {
  const preview = deriveAllocationPresetPreview({
    preset,
    holdings: ROLES.map(role => ({ symbol: ROLE_SYMBOLS[role], name: role, targetWeight: 0 })),
    roleBySymbol: Object.fromEntries(ROLES.map(role => [ROLE_SYMBOLS[role], role])) as Record<string, ClecHistoricalRole>
  });
  if (!preview.canApply) return null;
  const bySymbol = new Map(preview.rows.map(row => [row.symbol, row.nextWeight]));
  const weights = emptyValues();
  for (const role of ROLES) {
    const targetWeight = bySymbol.get(ROLE_SYMBOLS[role]);
    if (!finite(targetWeight) || targetWeight < 0) return null;
    weights[role] = targetWeight;
  }
  return Math.abs(sumValues(weights) - 100) <= 0.01 ? weights : null;
}

function validate(input: ClecHistoricalBacktestInput): string[] {
  const issues: string[] = [];
  if (!['clec-442', 'clec-433', 'clec-703', 'clec-5050'].includes(input.preset)) issues.push('preset 必須是 CLEC 442／433／703／5050 之一。');
  if (!finite(input.initialCapital) || input.initialCapital <= 0) issues.push('initialCapital 必須是大於 0 的有限數值。');
  if (!finite(input.threshold?.drift) || input.threshold.drift < 0) issues.push('threshold.drift 必須是大於或等於 0 的有限數值。');
  if (input.threshold?.significantMultiplier !== undefined && (!finite(input.threshold.significantMultiplier) || input.threshold.significantMultiplier <= 0)) issues.push('threshold.significantMultiplier 若提供，必須是大於 0 的有限數值。');
  if (!Array.isArray(input.periods)) {
    issues.push('periods 必須是陣列。');
    return issues;
  }
  let previousDate: string | null = null;
  input.periods.forEach((period, index) => {
    if (!isTaipeiCalendarDay(period?.date)) issues.push(`periods[${index}].date 必須是有效的 Asia/Taipei YYYY-MM-DD 日期。`);
    if (previousDate !== null && typeof period?.date === 'string' && period.date <= previousDate) issues.push('periods 必須依日期嚴格遞增，不得重複或逆序。');
    if (isTaipeiCalendarDay(period?.date)) previousDate = period.date;
    for (const role of ROLES) {
      const returnPct = period?.returnPctByRole?.[role];
      if (!finite(returnPct) || returnPct < -100) issues.push(`periods[${index}].returnPctByRole.${role} 必須是大於或等於 -100 的有限百分點數值。`);
    }
  });
  return Array.from(new Set(issues));
}

/**
 * Evaluates caller-supplied historical period returns against the current CLEC rule contract.
 * This is pure and read-only: it has no market-data, AppState, persistence, transaction, or UI side effect.
 */
export function runClecHistoricalBacktest(input: ClecHistoricalBacktestInput): ClecHistoricalBacktestResult {
  const issues = validate(input);
  if (issues.length) return { status: 'invalid_input', issues };

  const targetWeights = deriveTargetWeights(input.preset);
  if (!targetWeights) return { status: 'invalid_input', issues: ['無法從既有 allocation preset contract 取得有效 CLEC target weights。'] };

  let values = valuesAtWeights(input.initialCapital, targetWeights);
  let peak = input.initialCapital;
  let maxDrawdownPct = 0;
  let rebalanceCount = 0;
  const periods: ClecHistoricalBacktestPeriod[] = [];

  for (const period of input.periods) {
    const openingValues = { ...values };
    const closingValuesBeforeRebalance = emptyValues();
    for (const role of ROLES) closingValuesBeforeRebalance[role] = openingValues[role] * (1 + period.returnPctByRole[role] / 100);
    const closingPortfolioValue = sumValues(closingValuesBeforeRebalance);
    if (!finite(closingPortfolioValue) || closingPortfolioValue <= 0) {
      return { status: 'invalid_input', issues: [`${period.date} 套用報酬後投資組合價值無法用於計算期末權重。`] };
    }
    const weightsBeforeRebalance = emptyValues();
    for (const role of ROLES) weightsBeforeRebalance[role] = closingValuesBeforeRebalance[role] / closingPortfolioValue * 100;

    const rule = deriveClecStrategyRule({
      strategyId: 'clec-historical-backtest-foundation',
      allocationPresetId: input.preset,
      rebalanceMode: 'standard',
      asOfDate: period.date,
      portfolioValue: closingPortfolioValue,
      investableAssets: ROLES.map(role => ({ symbol: ROLE_SYMBOLS[role], currentWeight: weightsBeforeRebalance[role], targetWeight: targetWeights[role], quoteFreshness: 'fresh' as const })),
      availableCash: null,
      plannedContribution: null,
      plannedWithdrawal: null,
      debtBalance: null,
      cashReserve: null,
      leverageExposure: null,
      threshold: { drift: input.threshold.drift, significantMultiplier: input.threshold.significantMultiplier },
      dataQualityFlags: []
    });
    const rebalanced = rule.recommendedAction === 'full_rebalance';
    values = rebalanced ? valuesAtWeights(closingPortfolioValue, targetWeights) : closingValuesBeforeRebalance;
    if (rebalanced) rebalanceCount += 1;
    const endingPortfolioValue = sumValues(values);
    peak = Math.max(peak, endingPortfolioValue);
    maxDrawdownPct = Math.max(maxDrawdownPct, (1 - endingPortfolioValue / peak) * 100);
    periods.push({ date: period.date, openingValues, closingValuesBeforeRebalance, weightsBeforeRebalance, rule, rebalanced, endingValues: { ...values }, endingPortfolioValue });
  }

  const finalValue = sumValues(values);
  return {
    status: 'ok',
    executionAssumption: 'frictionless',
    preset: input.preset,
    targetWeights,
    initialCapital: input.initialCapital,
    finalValue,
    totalReturnPct: (finalValue / input.initialCapital - 1) * 100,
    maxDrawdownPct,
    rebalanceCount,
    periods
  };
}
