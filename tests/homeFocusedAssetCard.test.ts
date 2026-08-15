import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveHomeFocusedAssetCard, HOME_FOCUSED_ASSET_SYMBOL, type HomeFocusedAssetCardInput } from '../src/lib/homeFocusedAssetCard';
import type { RebalanceRecommendationRow } from '../src/lib/rebalanceRecommendation';

const baseRow = (overrides: Partial<RebalanceRecommendationRow> = {}): RebalanceRecommendationRow => ({
  symbol: HOME_FOCUSED_ASSET_SYMBOL, name: '元大台灣50正2', assetClass: 'growth',
  currentValue: 100_000, currentWeight: 5, targetWeight: 10,
  targetValue: 200_000, difference: 100_000,
  action: 'buy', recommendedAmount: 50_000, unresolvedAmount: 0, reason: '依低配缺口由大到小分配可投入預算。', priority: 1,
  ...overrides,
});

const baseInput = (overrides: Partial<HomeFocusedAssetCardInput> = {}): HomeFocusedAssetCardInput => ({
  investableCash: 50_000, canRecommend: true, thresholdReached: true, row: baseRow(),
  ...overrides,
});

test('threshold reached and canRecommend: surfaces the recommended buy amount from the matching row', () => {
  const result = deriveHomeFocusedAssetCard(baseInput());
  assert.equal(result.status, 'action-needed');
  assert.equal(result.action, 'buy');
  assert.equal(result.recommendedAmount, 50_000);
  assert.equal(result.deviation, -5);
  assert.equal(result.symbol, HOME_FOCUSED_ASSET_SYMBOL);
});

test('threshold reached with a sell row: surfaces the recommended sell amount', () => {
  const result = deriveHomeFocusedAssetCard(baseInput({ row: baseRow({ action: 'sell', currentWeight: 15, targetWeight: 10, recommendedAmount: 30_000, reason: '目前市值高於目標市值。' }) }));
  assert.equal(result.status, 'action-needed');
  assert.equal(result.action, 'sell');
  assert.equal(result.recommendedAmount, 30_000);
  assert.equal(result.deviation, 5);
});

test('threshold not reached: shows the normal/no-action message and no amount, even though the row itself would buy', () => {
  const result = deriveHomeFocusedAssetCard(baseInput({ thresholdReached: false }));
  assert.equal(result.status, 'normal');
  assert.equal(result.action, null);
  assert.equal(result.recommendedAmount, null);
  assert.equal(result.message, '目前配置正常，不需操作。');
  // current/target/deviation numbers stay visible even when not showing an amount
  assert.equal(result.currentWeight, 5);
  assert.equal(result.targetWeight, 10);
});

test('data quality gate not passed (canRecommend=false): never shows a broken/blocked amount', () => {
  const result = deriveHomeFocusedAssetCard(baseInput({ canRecommend: false, row: baseRow({ action: 'blocked', recommendedAmount: null, reason: '資料品質 gate 尚未通過，停止所有具體金額建議。' }) }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.action, null);
  assert.equal(result.recommendedAmount, null);
});

test('investableCash boundary: 0 is displayed as a real zero, not confused with null/missing', () => {
  const result = deriveHomeFocusedAssetCard(baseInput({ investableCash: 0 }));
  assert.equal(result.investableCash, 0);
});

test('investableCash null (household liquidity data incomplete) passes through unchanged', () => {
  const result = deriveHomeFocusedAssetCard(baseInput({ investableCash: null }));
  assert.equal(result.investableCash, null);
});

test('00631L removed from the user\'s holdings/target allocation (no matching row): safe fallback, no undefined leaks', () => {
  const result = deriveHomeFocusedAssetCard(baseInput({ row: undefined }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.name, null);
  assert.equal(result.currentWeight, null);
  assert.equal(result.targetWeight, null);
  assert.equal(result.deviation, null);
  assert.equal(result.action, null);
  assert.equal(result.recommendedAmount, null);
  assert.match(result.message, new RegExp(HOME_FOCUSED_ASSET_SYMBOL));
  assert.equal(result.symbol, HOME_FOCUSED_ASSET_SYMBOL);
});

test('hold row at threshold-reached (deviation within amount floor): no amount shown, reason passed through', () => {
  const result = deriveHomeFocusedAssetCard(baseInput({ row: baseRow({ action: 'hold', currentWeight: 10, targetWeight: 10, recommendedAmount: 0, reason: '目前市值已接近目標市值。' }) }));
  assert.equal(result.status, 'action-needed');
  assert.equal(result.action, null);
  assert.equal(result.recommendedAmount, null);
  assert.equal(result.message, '目前市值已接近目標市值。');
});
