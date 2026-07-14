import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveRebalanceRecommendation, type RebalanceRecommendationInput } from '../src/lib/rebalanceRecommendation';

const baseInput = (overrides: Partial<RebalanceRecommendationInput> = {}): RebalanceRecommendationInput => ({
  totalAssets: 1_000,
  liquidCash: 200,
  buyOnlyBudget: 150,
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
  const input = baseInput();
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
  assert.deepEqual(input, baseInput());
});

test('standard mode shows a cash shortfall without treating theoretical sales as immediately available', () => {
  const result = deriveRebalanceRecommendation(baseInput({ liquidCash: 50 }));
  assert.equal(result.buyTotal, 200);
  assert.equal(result.sellTotal, 200);
  assert.equal(result.cashShortfall, 150);
});

test('buy-only mode allocates finite budget to largest deficits first and never recommends a sale', () => {
  const result = deriveRebalanceRecommendation(baseInput({
    rebalanceMode: 'buy-only', liquidCash: 100, buyOnlyBudget: 100,
    holdings: [
      { symbol: 'LOW', name: '小缺口', marketValue: 550, currentWeight: 55, targetWeight: 60, assetClass: 'growth', price: 55, quoteStatus: 'today', quoteSource: 'Price Worker' },
      { symbol: 'HIGH', name: '大缺口', marketValue: 200, currentWeight: 20, targetWeight: 40, assetClass: 'growth', price: 20, quoteStatus: 'today', quoteSource: 'Price Worker' },
    ],
    targetTotal: 100,
  }));
  const low = result.rows.find(row => row.symbol === 'LOW')!;
  const high = result.rows.find(row => row.symbol === 'HIGH')!;
  assert.equal(high.recommendedAmount, 100);
  assert.equal(low.recommendedAmount, 0);
  assert.equal(result.usedBuyBudget, 100);
  assert.ok(result.rows.every(row => row.action !== 'sell'));
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
