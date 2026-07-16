import assert from 'node:assert/strict';
import test from 'node:test';
import { createAiRecommendationModels, createRecommendationModels } from '../src/lib/recommendations';

const rebalance = {
  canRecommend: true, mode: 'standard' as const, liquidCash: 200, availableBuyBudget: 200, cashShortfall: 0,
  rows: [{ symbol: 'AAA', name: '成長甲', assetClass: 'growth' as const, currentValue: 400, currentWeight: 40, targetWeight: 60, targetValue: 600, difference: 200, action: 'buy' as const, recommendedAmount: 200, unresolvedAmount: 0, reason: '目前市值低於目標市值。', priority: 1 }]
};
const portfolioRisk = {
  risk: { overallLabel: '偏高風險', primaryRisk: { title: '持股集中度', status: '需要留意', reason: '既有風險原因。' }, largestHoldingRatio: 55 },
  concentration: { largestPct: 55, topTwoPct: 70, topThreePct: 80 }, leverage: { totalPct: 20, symbols: ['00631L'] }
} as unknown as Parameters<typeof createRecommendationModels>[0]['portfolioRisk'];

test('shared recommendation models adapt existing results without recalculating recommendation amounts', () => {
  const before = structuredClone(rebalance);
  const models = createRecommendationModels({ rebalance, portfolioRisk });
  assert.deepEqual(rebalance, before);
  assert.deepEqual(models.map(item => item.category), ['rebalance', 'cash', 'concentration', 'leverage', 'risk']);
  assert.equal(models[0].summary, '建議金額 0.0 萬元');
  assert.equal(models[0].status, '理論增加');
  assert.ok(models.every(item => item.id && item.title && item.summary && item.detail));
});

test('AI Decision items map to the shared categories without changing their conclusion', () => {
  const models = createAiRecommendationModels([{ id: 'cash', category: 'cash', severity: 'warning', title: '現金與流動性', conclusion: '需要留意。', reason: '既有原因。', evidence: [{ label: '現金', value: '100 元', source: 'deriveRiskMetrics' }] }]);
  assert.deepEqual(models[0], { id: 'ai-cash', category: 'cash', tone: 'warn', title: '現金與流動性', status: '需要留意。', summary: '既有原因。', detail: '現金：100 元', source: 'ai-decision' });
});
