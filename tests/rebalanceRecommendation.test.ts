import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveRebalanceRecommendation, type RebalanceRecommendationInput } from '../src/lib/rebalanceRecommendation';

const baseInput = (overrides: Partial<RebalanceRecommendationInput> = {}): RebalanceRecommendationInput => ({
  totalAssets: 1_000,
  liquidCash: 200,
  buyOnlyBudget: 150,
  investableCash: 200,
  rebalanceMode: 'standard',
  rebalanceThreshold: 5,
  allocationDeviation: 8,
  targetTotal: 80,
  cashTargetPct: 20,
  duplicateSymbols: [],
  otherAssetValue: 0,
  allocation: {
    growth: { currentValue: 500, targetWeight: 60 },
    defensive: { currentValue: 300, targetWeight: 20 },
    cash: { currentValue: 200 },
  },
  holdings: [
    { symbol: 'AAA', name: '成長甲', marketValue: 400, currentWeight: 40, targetWeight: 60, assetClass: 'growth', price: 40, quoteStatus: 'today', quoteSource: 'Price Worker' },
    { symbol: 'BBB', name: '防守乙', marketValue: 400, currentWeight: 40, targetWeight: 20, assetClass: 'defensive', price: 40, quoteStatus: 'today', quoteSource: 'Price Worker' },
  ],
  ...overrides,
});

test('standard mode uses total assets for each holding target and keeps sale within current value', () => {
  // V7.0B sub-PR 2: standard mode's cashShortfall now reads investableCash, not liquidCash; investableCash is
  // explicitly set to match the prior liquidCash-based expectation so this test's assertions stay unchanged.
  const input = baseInput({ investableCash: 200 });
  const result = deriveRebalanceRecommendation(input);
  const buy = result.rows.find(row => row.symbol === 'AAA')!;
  const sell = result.rows.find(row => row.symbol === 'BBB')!;
  assert.equal(result.canRecommend, true);
  assert.equal(buy.targetValue, 600);
  assert.equal(buy.recommendedAmount, 200);
  assert.equal(sell.targetValue, 200);
  assert.equal(sell.recommendedAmount, 200);
  assert.ok((sell.recommendedAmount ?? Infinity) <= sell.currentValue);
  assert.equal(result.cashShortfall, 0);
  assert.equal(result.netCashImpact, 0);
  assert.deepEqual(input, baseInput({ investableCash: 200 }));
});

test('standard mode shows a cash shortfall without treating theoretical sales as immediately available (V7.0B: shortfall basis is investableCash, not liquidCash)', () => {
  // liquidCash is intentionally left high to prove standard mode's cashShortfall no longer reads it; only
  // investableCash (50) drives the shortfall now, matching the same numeric outcome the old liquidCash-based test had.
  const result = deriveRebalanceRecommendation(baseInput({ liquidCash: 5_000, investableCash: 50 }));
  assert.equal(result.buyTotal, 200);
  assert.equal(result.sellTotal, 200);
  assert.equal(result.availableBuyBudget, 50);
  assert.equal(result.cashShortfall, 150);
  assert.equal(result.remainingBudget, 0);
});

const buyOnlyDeficitHoldings = [
  { symbol: 'LOW', name: '小缺口', marketValue: 550, currentWeight: 55, targetWeight: 60, assetClass: 'growth' as const, price: 55, quoteStatus: 'today' as const, quoteSource: 'Price Worker' },
  { symbol: 'HIGH', name: '大缺口', marketValue: 200, currentWeight: 20, targetWeight: 40, assetClass: 'growth' as const, price: 20, quoteStatus: 'today' as const, quoteSource: 'Price Worker' },
];

test('buy-only mode allocates finite budget to largest deficits first and never recommends a sale (V7.0B: budget is investableCash, not liquidCash)', () => {
  const result = deriveRebalanceRecommendation(baseInput({
    // liquidCash is intentionally left far above the budget/investableCash to prove buy-only no longer reads it.
    rebalanceMode: 'buy-only', liquidCash: 5_000, buyOnlyBudget: 100, investableCash: 100,
    holdings: buyOnlyDeficitHoldings,
    targetTotal: 100,
  }));
  const low = result.rows.find(row => row.symbol === 'LOW')!;
  const high = result.rows.find(row => row.symbol === 'HIGH')!;
  assert.equal(high.recommendedAmount, 100);
  assert.equal(low.recommendedAmount, 0);
  assert.equal(result.usedBuyBudget, 100);
  assert.equal(result.availableBuyBudget, 100);
  assert.ok(result.rows.every(row => row.action !== 'sell'));
});

test('V7.0B: buy-only mode with investableCash of 0 produces no executable buy orders and states the household-liquidity reason', () => {
  const result = deriveRebalanceRecommendation(baseInput({
    rebalanceMode: 'buy-only', liquidCash: 5_000, buyOnlyBudget: 100, investableCash: 0,
    holdings: buyOnlyDeficitHoldings,
    targetTotal: 100,
  }));
  assert.equal(result.canRecommend, true);
  assert.equal(result.availableBuyBudget, 0);
  assert.equal(result.usedBuyBudget, 0);
  const high = result.rows.find(row => row.symbol === 'HIGH')!;
  assert.equal(high.recommendedAmount, 0);
  assert.equal(high.reason, '扣除受保護安全存量後沒有可投資現金。');
  assert.ok(result.rows.every(row => row.action !== 'sell'));
});

test('V7.0B: buy-only mode with investableCash below the requested budget clamps the executable amount to investableCash', () => {
  const result = deriveRebalanceRecommendation(baseInput({
    rebalanceMode: 'buy-only', liquidCash: 5_000, buyOnlyBudget: 100, investableCash: 60,
    holdings: buyOnlyDeficitHoldings,
    targetTotal: 100,
  }));
  assert.equal(result.availableBuyBudget, 60);
  assert.equal(result.usedBuyBudget, 60);
  const high = result.rows.find(row => row.symbol === 'HIGH')!;
  const low = result.rows.find(row => row.symbol === 'LOW')!;
  assert.equal(high.recommendedAmount, 60);
  assert.equal(low.recommendedAmount, 0);
  assert.ok(result.usedBuyBudget <= 60);
});

test('V7.0B: buy-only mode blocks all concrete amounts (instead of substituting 0) when investableCash itself is missing', () => {
  const result = deriveRebalanceRecommendation(baseInput({
    rebalanceMode: 'buy-only', investableCash: null,
    holdings: buyOnlyDeficitHoldings,
    targetTotal: 100,
  }));
  assert.equal(result.canRecommend, false);
  assert.ok(result.blockingReasons.some(reason => reason.includes('家庭流動性資料不足')));
  assert.ok(result.rows.every(row => row.recommendedAmount === null && row.unresolvedAmount === null));
  assert.equal(result.availableBuyBudget, null);
});

test('V7.0B sub-PR 2: standard mode with investableCash of 0 leaves nothing fundable (100% cash shortfall, 0 remaining budget)', () => {
  const result = deriveRebalanceRecommendation(baseInput({ rebalanceMode: 'standard', liquidCash: 5_000, investableCash: 0 }));
  assert.equal(result.canRecommend, true);
  assert.equal(result.availableBuyBudget, 0);
  assert.equal(result.buyTotal, 200);
  assert.equal(result.cashShortfall, 200);
  assert.equal(result.remainingBudget, 0);
});

test('V7.0B sub-PR 2: standard mode with investableCash sufficient to cover the full theoretical buy shows zero shortfall', () => {
  const result = deriveRebalanceRecommendation(baseInput({ rebalanceMode: 'standard', liquidCash: 0, investableCash: 500 }));
  assert.equal(result.availableBuyBudget, 500);
  assert.equal(result.buyTotal, 200);
  assert.equal(result.cashShortfall, 0);
  assert.equal(result.remainingBudget, 300);
});

test('V7.0B sub-PR 2: standard mode blocks all concrete amounts (instead of substituting 0) when investableCash itself is missing', () => {
  const result = deriveRebalanceRecommendation(baseInput({ rebalanceMode: 'standard', investableCash: null }));
  assert.equal(result.canRecommend, false);
  assert.ok(result.blockingReasons.some(reason => reason.includes('家庭流動性資料不足')));
  assert.ok(result.rows.every(row => row.recommendedAmount === null && row.unresolvedAmount === null));
  assert.equal(result.availableBuyBudget, null);
  assert.equal(result.cashShortfall, null);
});

test('data quality gates block all concrete amounts instead of substituting zero', () => {
  for (const overrides of [
    { totalAssets: 0 },
    { targetTotal: 101 },
    { duplicateSymbols: ['AAA'] },
    { holdings: [{ ...baseInput().holdings[0], quoteStatus: 'unknown' as const }] },
    { holdings: [{ ...baseInput().holdings[0], quoteStatus: 'stale' as const }] },
    { holdings: [{ ...baseInput().holdings[0], quoteSource: '成交均價備援' }] },
    { holdings: [{ ...baseInput().holdings[0], price: 0 }] },
  ]) {
    const result = deriveRebalanceRecommendation(baseInput(overrides));
    assert.equal(result.canRecommend, false);
    assert.ok(result.blockingReasons.length > 0);
    assert.ok(result.rows.every(row => row.recommendedAmount === null && row.unresolvedAmount === null));
  }
});

test('threshold is status only: below threshold preserves theoretical differences', () => {
  const result = deriveRebalanceRecommendation(baseInput({ allocationDeviation: 2 }));
  assert.equal(result.thresholdReached, false);
  assert.equal(result.rows.find(row => row.symbol === 'AAA')!.difference, 200);
  assert.equal(result.rows.find(row => row.symbol === 'AAA')!.recommendedAmount, 200);
});
