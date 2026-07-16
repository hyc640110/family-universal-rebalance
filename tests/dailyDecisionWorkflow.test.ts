import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveDailyDecisionWorkflow } from '../src/lib/dailyDecisionWorkflow';
import { deriveInvestmentIntelligence, type InvestmentIntelligenceInput } from '../src/lib/investmentIntelligence';

const base = (overrides: Partial<InvestmentIntelligenceInput> = {}): InvestmentIntelligenceInput => ({
  dashboard: { dayPnl: 500, dayPnlRate: 1, quoteStatus: '報價正常', holdingsCount: 2 }, sync: { dirty: false, status: '已同步' },
  risk: { overallLevel: 0, overallLabel: '低風險', primaryRisk: { title: '維持監測', status: '正常', reason: '核心風險在門檻內。' } },
  portfolioRisk: { quality: { items: [] }, allocation: { deviation: 1, threshold: 5, thresholdReached: false }, concentration: { largestPct: 30 }, drawdown: { canCalculate: true, maxDrawdown: -0.05 } },
  rebalance: { canRecommend: true, blockingReasons: [], thresholdReached: false, allocationDeviation: 1 }, market: { freshness: 'today', availableCount: 3 },
  performance: { canCalculateMaxDrawdown: true, snapshotCount: 3, maxDrawdown: -0.05 }, dividend: { yearAmount: 0, yearCount: 0 }, ai: { attention: [] }, ...overrides
});
const workflow = (overrides: Partial<InvestmentIntelligenceInput> = {}) => deriveDailyDecisionWorkflow(deriveInvestmentIntelligence(base(overrides)));

test('uses only the existing intelligence result, is deterministic, and preserves it without mutation', () => {
  const intelligence = deriveInvestmentIntelligence(base()); const before = JSON.stringify(intelligence);
  assert.deepEqual(deriveDailyDecisionWorkflow(intelligence), deriveDailyDecisionWorkflow(intelligence));
  assert.equal(JSON.stringify(intelligence), before);
  assert.equal(workflow().conclusion.status, 'no-action'); assert.equal(workflow().primaryNextStep, null);
});

test('data and quote faults outrank risks, remain unavailable, and provide only one primary next step', () => {
  const result = workflow({ portfolioRisk: { ...base().portfolioRisk, quality: { items: ['日期不明'] } }, risk: { overallLevel: 3, overallLabel: '高風險', primaryRisk: { title: '槓桿資產', status: '高風險', reason: '測試。' } } });
  assert.equal(result.conclusion.status, 'insufficient-data'); assert.equal(result.steps[0].status, 'unavailable');
  assert.equal(result.primaryNextStep?.id, 'data-and-quotes'); assert.equal(result.steps.filter(step => step.isPrimaryNextStep).length, 1);
});

test('risk and rebalance remain ahead of general market and all link metadata stays aligned', () => {
  const result = workflow({ risk: { overallLevel: 3, overallLabel: '高風險', primaryRisk: { title: '槓桿資產', status: '高風險', reason: '測試。' } }, market: { freshness: 'stale', availableCount: 1 } });
  assert.equal(result.primaryNextStep?.id, 'risk-and-safety'); assert.equal(result.steps[4].status, 'attention');
  for (const step of result.steps) { assert.ok(step.route.startsWith('/')); assert.ok(step.linkLabel.length); assert.equal(step.ariaLabel, step.linkLabel); }
});

test('existing performance fallback stays a single linked workflow step', () => {
  const result = workflow({ performance: { canCalculateMaxDrawdown: false, snapshotCount: 1, maxDrawdown: null } });
  assert.equal(result.primaryNextStep?.id, 'performance'); assert.equal(result.primaryNextStep?.route, '/analytics');
  assert.equal(result.steps.filter(step => step.isPrimaryNextStep).length, 1);
});

test('dashboard renders the pure model without hard-coded routes or transaction language', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const summary = readFileSync(new URL('../src/components/InvestmentIntelligenceSummary.tsx', import.meta.url), 'utf8');
  const model = readFileSync(new URL('../src/lib/dailyDecisionWorkflow.ts', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(app, /deriveDailyDecisionWorkflow\(investmentIntelligence\)/); assert.match(summary, /DailyDecisionWorkflow/);
  assert.match(model, /does not accept raw portfolio data/); assert.doesNotMatch(model, /localStorage|fetch\(/);
  assert.match(css, /@media \(max-width:700px\).*?\.daily-decision-steps(?:,\.investment-opportunity-grid)?\{grid-template-columns:1fr/s);
});
