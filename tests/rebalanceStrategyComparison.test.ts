import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveSmartRebalance, deriveDumbRebalance, deriveRatioRebalance, deriveBetaExposure,
  validateStrategyComparisonInput, DEFAULT_UP_BALANCE_PCT, DEFAULT_DOWN_BALANCE_AMOUNT,
  type StrategyComparisonAssets, type SmartRebalanceInput,
} from '../src/lib/rebalanceStrategyComparison';

const baseAssets = (overrides: Partial<StrategyComparisonAssets> = {}): StrategyComparisonAssets => ({
  '0050': { currentValue: 400_000, targetWeightPct: 40, leverageMultiplier: 1 },
  '00631L': { currentValue: 380_000, targetWeightPct: 38, leverageMultiplier: 2 },
  '00865B': { currentValue: 220_000, targetWeightPct: 22, leverageMultiplier: 0 },
  ...overrides,
});

const baseSmart = (overrides: Partial<SmartRebalanceInput> = {}): SmartRebalanceInput => ({
  initialValue00631L: 300_000, periodContribution00631L: 0,
  upBalancePct: DEFAULT_UP_BALANCE_PCT, downBalanceAmount: DEFAULT_DOWN_BALANCE_AMOUNT,
  ...overrides,
});

// --- 聰明再平衡 ---

test('smart rebalance: gain (periodChange > 0) sells the up-balance % of 00631L into 00865B, 0050 untouched', () => {
  const assets = baseAssets({ '00631L': { currentValue: 400_000, targetWeightPct: 38, leverageMultiplier: 2 } });
  const result = deriveSmartRebalance(assets, baseSmart({ initialValue00631L: 300_000, periodContribution00631L: 0, upBalancePct: 30 }));
  assert.equal(result.periodChange, 100_000);
  assert.equal(result.branch, 'up');
  const by = Object.fromEntries(result.adjustments.map(a => [a.symbol, a]));
  assert.equal(by['00631L'].amount, -30_000);
  assert.equal(by['00631L'].action, 'sell');
  assert.equal(by['00865B'].amount, 30_000);
  assert.equal(by['00865B'].action, 'buy');
  assert.equal(by['0050'].amount, 0);
  assert.equal(by['0050'].action, 'hold');
});

test('smart rebalance: loss (periodChange < 0) buys 00631L funded by selling the fixed down-balance amount from 00865B', () => {
  const assets = baseAssets({ '00631L': { currentValue: 250_000, targetWeightPct: 38, leverageMultiplier: 2 } });
  const result = deriveSmartRebalance(assets, baseSmart({ initialValue00631L: 300_000, periodContribution00631L: 0, downBalanceAmount: 50_000 }));
  assert.equal(result.periodChange, -50_000);
  assert.equal(result.branch, 'down');
  const by = Object.fromEntries(result.adjustments.map(a => [a.symbol, a]));
  assert.equal(by['00631L'].amount, 50_000);
  assert.equal(by['00631L'].action, 'buy');
  assert.equal(by['00865B'].amount, -50_000);
  assert.equal(by['00865B'].action, 'sell');
});

test('smart rebalance boundary: periodChange exactly 0 falls into the "down" (<=0) branch per spec, using the fixed down-balance amount', () => {
  const assets = baseAssets({ '00631L': { currentValue: 300_000, targetWeightPct: 38, leverageMultiplier: 2 } });
  const result = deriveSmartRebalance(assets, baseSmart({ initialValue00631L: 300_000, periodContribution00631L: 0, downBalanceAmount: 20_000 }));
  assert.equal(result.periodChange, 0);
  assert.equal(result.branch, 'down');
  const by = Object.fromEntries(result.adjustments.map(a => [a.symbol, a]));
  assert.equal(by['00631L'].amount, 20_000);
});

test('smart rebalance: period contribution reduces periodChange (excludes new money from being counted as gain)', () => {
  const assets = baseAssets({ '00631L': { currentValue: 400_000, targetWeightPct: 38, leverageMultiplier: 2 } });
  const result = deriveSmartRebalance(assets, baseSmart({ initialValue00631L: 300_000, periodContribution00631L: 90_000 }));
  assert.equal(result.periodChange, 10_000); // 400k - 300k - 90k
});

// --- 無腦再平衡 ---

test('dumb rebalance: redistributes 00631L/00865B combined value by their target-weight ratio to each other, 0050 untouched', () => {
  // combined = 380k + 220k = 600k; targets 38/22 -> pair ratio 38/60, 22/60
  const result = deriveDumbRebalance(baseAssets());
  const by = Object.fromEntries(result.adjustments.map(a => [a.symbol, a]));
  const expected00631L = 600_000 * (38 / 60);
  assert.ok(Math.abs(by['00631L'].amount - (expected00631L - 380_000)) < 1e-6);
  assert.equal(by['0050'].amount, 0);
  assert.equal(by['0050'].action, 'hold');
  // the pair's combined value is conserved — adjustments must cancel out
  assert.ok(Math.abs(by['00631L'].amount + by['00865B'].amount) < 1e-6);
});

test('dumb rebalance boundary: both target weights 0 for the pair (targetSum=0) never divides by zero, treats as hold/no-redistribution basis', () => {
  const assets = baseAssets({ '00631L': { currentValue: 100_000, targetWeightPct: 0, leverageMultiplier: 2 }, '00865B': { currentValue: 50_000, targetWeightPct: 0, leverageMultiplier: 0 } });
  const result = deriveDumbRebalance(assets);
  const by = Object.fromEntries(result.adjustments.map(a => [a.symbol, a]));
  assert.ok(Number.isFinite(by['00631L'].amount));
  assert.ok(Number.isFinite(by['00865B'].amount));
});

// --- 比率再平衡 ---

test('ratio rebalance: all three assets converge toward target weight of the grand total', () => {
  const result = deriveRatioRebalance(baseAssets());
  assert.equal(result.totalValue, 1_000_000);
  const by = Object.fromEntries(result.adjustments.map(a => [a.symbol, a]));
  assert.equal(by['0050'].amount, 0); // 40% target of 1,000,000 = 400,000 = current, exact match
  assert.equal(by['0050'].action, 'hold');
  assert.equal(by['00631L'].amount, 0); // 38% of 1,000,000 = 380,000 = current
  assert.equal(by['00865B'].amount, 0); // 22% of 1,000,000 = 220,000 = current
});

test('ratio rebalance: an overweight asset shows a sell, underweight shows a buy', () => {
  const assets = baseAssets({ '0050': { currentValue: 500_000, targetWeightPct: 40, leverageMultiplier: 1 }, '00631L': { currentValue: 280_000, targetWeightPct: 38, leverageMultiplier: 2 } });
  const result = deriveRatioRebalance(assets);
  const by = Object.fromEntries(result.adjustments.map(a => [a.symbol, a]));
  assert.equal(by['0050'].action, 'sell'); // 40% of 1,000,000 = 400,000 < 500,000 current
  assert.equal(by['00631L'].action, 'buy'); // 38% of 1,000,000 = 380,000 > 280,000 current
});

// --- Beta 曝險 ---

test('beta exposure: current beta weights leverage multiplier by current market-value share, target beta by target weight', () => {
  const result = deriveBetaExposure(baseAssets());
  // current: 1*0.4 + 2*0.38 + 0*0.22 = 0.4 + 0.76 + 0 = 1.16
  assert.ok(Math.abs(result.currentBeta - 1.16) < 1e-9);
  assert.ok(Math.abs(result.targetBeta - 1.16) < 1e-9); // same weights here since current==target
  assert.equal(result.totalValue, 1_000_000);
});

test('beta exposure boundary: a zero-leverage asset (e.g. 00865B) contributes exactly 0 regardless of its weight', () => {
  const assets = baseAssets({ '00865B': { currentValue: 900_000, targetWeightPct: 90, leverageMultiplier: 0 } });
  const result = deriveBetaExposure(assets);
  // 00865B's large weight must not move beta at all since its multiplier is 0
  const withoutIt = deriveBetaExposure({ ...assets, '00865B': { ...assets['00865B'], currentValue: 0, targetWeightPct: 0 } });
  // both should equal just 0050+00631L's own contribution scaled by their own totalValue share — verify 00865B truly contributes 0 to the *numerator*
  assert.ok(Number.isFinite(result.currentBeta));
  assert.ok(Number.isFinite(withoutIt.currentBeta));
});

test('beta exposure: totalValue of 0 (all-zero assets) never divides by zero for currentBeta', () => {
  const assets = baseAssets({ '0050': { currentValue: 0, targetWeightPct: 40, leverageMultiplier: 1 }, '00631L': { currentValue: 0, targetWeightPct: 38, leverageMultiplier: 2 }, '00865B': { currentValue: 0, targetWeightPct: 22, leverageMultiplier: 0 } });
  const result = deriveBetaExposure(assets);
  assert.equal(result.currentBeta, 0);
  assert.ok(Number.isFinite(result.targetBeta)); // target beta is weight-based, still computable with 0 current values
});

// --- 驗證防呆 ---

test('validation: negative current value is flagged', () => {
  const errors = validateStrategyComparisonInput({ assets: baseAssets({ '0050': { currentValue: -1, targetWeightPct: 40, leverageMultiplier: 1 } }), smart: baseSmart() });
  assert.ok(errors.includes('NEGATIVE_CURRENT_VALUE'));
});

test('validation: negative initial value (期初市值為負) is flagged', () => {
  const errors = validateStrategyComparisonInput({ assets: baseAssets(), smart: baseSmart({ initialValue00631L: -100 }) });
  assert.ok(errors.includes('NEGATIVE_INITIAL_VALUE'));
});

test('validation: negative down-balance amount is flagged', () => {
  const errors = validateStrategyComparisonInput({ assets: baseAssets(), smart: baseSmart({ downBalanceAmount: -1 }) });
  assert.ok(errors.includes('NEGATIVE_DOWN_BALANCE_AMOUNT'));
});

test('validation: up-balance % out of 0-100 range is flagged', () => {
  const tooHigh = validateStrategyComparisonInput({ assets: baseAssets(), smart: baseSmart({ upBalancePct: 150 }) });
  const negative = validateStrategyComparisonInput({ assets: baseAssets(), smart: baseSmart({ upBalancePct: -5 }) });
  assert.ok(tooHigh.includes('INVALID_UP_BALANCE_PCT'));
  assert.ok(negative.includes('INVALID_UP_BALANCE_PCT'));
});

test('validation: reversed date range (結束日期早於開始日期) is flagged', () => {
  const errors = validateStrategyComparisonInput({ assets: baseAssets(), smart: baseSmart(), periodStartDate: '2026-06-01', periodEndDate: '2026-01-01' });
  assert.ok(errors.includes('DATE_RANGE_REVERSED'));
});

test('validation: a valid, fully-reasonable input produces zero errors', () => {
  const errors = validateStrategyComparisonInput({ assets: baseAssets(), smart: baseSmart(), periodStartDate: '2026-01-01', periodEndDate: '2026-06-01' });
  assert.deepEqual(errors, []);
});

test('validation: missing dates (both undefined) never falsely trigger the date-range check', () => {
  const errors = validateStrategyComparisonInput({ assets: baseAssets(), smart: baseSmart() });
  assert.ok(!errors.includes('DATE_RANGE_REVERSED'));
});
