import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveInvestmentIntelligence, type InvestmentIntelligenceInput } from '../src/lib/investmentIntelligence';

const base = (overrides: Partial<InvestmentIntelligenceInput> = {}): InvestmentIntelligenceInput => ({
  dashboard: { dayPnl: 500, dayPnlRate: 1, quoteStatus: '報價正常', holdingsCount: 2 },
  sync: { dirty: false, status: '已同步' },
  risk: { overallLevel: 0, overallLabel: '低風險', primaryRisk: { title: '維持監測', status: '正常', reason: '核心風險在門檻內。' } },
  portfolioRisk: { quality: { items: [] }, allocation: { deviation: 1, threshold: 5, thresholdReached: false }, concentration: { largestPct: 30 }, drawdown: { canCalculate: true, maxDrawdown: -0.05 } },
  rebalance: { canRecommend: true, blockingReasons: [], thresholdReached: false, allocationDeviation: 1 },
  market: { freshness: 'today', availableCount: 3 },
  performance: { canCalculateMaxDrawdown: true, snapshotCount: 3, maxDrawdown: -0.05 },
  dividend: { yearAmount: 100, yearCount: 1 }, ai: { attention: [] },
  ...overrides
});

test('is deterministic, traceable, and never mutates its derived input', () => {
  const input = base(); const before = JSON.stringify(input); const result = deriveInvestmentIntelligence(input);
  assert.deepEqual(deriveInvestmentIntelligence(input), result); assert.equal(JSON.stringify(input), before);
  assert.equal(result.nextAction.route, '/tools/dividend-center'); assert.equal(result.supportingItems.length, 8);
});

test('data-quality faults outrank every other status and keep unavailable values explicit', () => {
  const result = deriveInvestmentIntelligence(base({ dashboard: { dayPnl: null, dayPnlRate: null, quoteStatus: '部分標的報價日期不明', holdingsCount: 1 }, portfolioRisk: { ...base().portfolioRisk, quality: { items: ['日期不明', '備援價格（估值可用，報價品質不足）'] } }, risk: { overallLevel: 3, overallLabel: '高風險', primaryRisk: { title: '槓桿資產', status: '高風險', reason: '測試。' } } }));
  assert.equal(result.overallStatus, '資料不足'); assert.equal(result.nextAction.route, '/assets');
  assert.match(result.todayPerformance.value, /資料不足/); assert.doesNotMatch(result.todayPerformance.detail, /0 元/);
});

test('sync, high-risk, blocked and usable rebalance follow the required single-action priority', () => {
  assert.equal(deriveInvestmentIntelligence(base({ sync: { dirty: true, status: '本機資料尚未同步' }, risk: { overallLevel: 3, overallLabel: '高風險', primaryRisk: { title: '集中度', status: '高風險', reason: '測試。' } } })).nextAction.route, '/settings');
  assert.equal(deriveInvestmentIntelligence(base({ risk: { overallLevel: 3, overallLabel: '高風險', primaryRisk: { title: '集中度', status: '高風險', reason: '測試。' } } })).nextAction.route, '/tools/portfolio-risk');
  const blocked = deriveInvestmentIntelligence(base({ portfolioRisk: { ...base().portfolioRisk, allocation: { deviation: 8, threshold: 5, thresholdReached: true } }, rebalance: { canRecommend: false, blockingReasons: ['報價過期'], thresholdReached: true, allocationDeviation: 8 } }));
  assert.equal(blocked.nextAction.route, '/tools/rebalance-recommendation'); assert.equal(blocked.rebalanceStatus.blocked, true);
  const usable = deriveInvestmentIntelligence(base({ portfolioRisk: { ...base().portfolioRisk, allocation: { deviation: 8, threshold: 5, thresholdReached: true } }, rebalance: { canRecommend: true, blockingReasons: [], thresholdReached: true, allocationDeviation: 8 } }));
  assert.equal(usable.nextAction.priority, 5); assert.equal(usable.nextAction.route, '/tools/rebalance-recommendation');
});

test('market, performance, and normal fallbacks use existing routes without a second CTA', () => {
  assert.equal(deriveInvestmentIntelligence(base({ dividend: { yearAmount: 0, yearCount: 0 }, market: { freshness: 'stale', availableCount: 1 } })).nextAction.route, '/market');
  assert.equal(deriveInvestmentIntelligence(base({ dividend: { yearAmount: 0, yearCount: 0 }, market: { freshness: 'unavailable', availableCount: 0 } })).nextAction.route, '/market');
  assert.equal(deriveInvestmentIntelligence(base({ dividend: { yearAmount: 0, yearCount: 0 }, performance: { canCalculateMaxDrawdown: false, snapshotCount: 1, maxDrawdown: null } })).nextAction.route, '/analytics');
  const result = deriveInvestmentIntelligence(base({ dividend: { yearAmount: 0, yearCount: 0 } }));
  assert.equal(result.nextAction.route, '/tools/ai-decision'); assert.equal(result.limitations.length, 2);
});

test('Dashboard integration keeps one primary CTA, existing routes, mobile single-column CSS, and safe wording', () => {
  const page = readFileSync(new URL('../src/pages/DashboardDecisionPage.tsx', import.meta.url), 'utf8');
  const summary = readFileSync(new URL('../src/components/InvestmentIntelligenceSummary.tsx', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../src/components/DailyDecisionWorkflow.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(app, /adaptInvestmentIntelligenceInput/); assert.match(page, /InvestmentIntelligenceSummary/);
  assert.match(summary, /DailyDecisionWorkflow/); assert.equal((workflow.match(/daily-decision-primary-link/g) || []).length, 1);
  assert.match(css, /@media \(max-width:700px\)\{\.investment-intelligence-card.*?\.intelligence-grid\{grid-template-columns:1fr/s);
  assert.doesNotMatch(page, /買入金額|賣出金額|股數|張數|零股|下單|最佳進場|報酬保證|預測/);
  assert.doesNotMatch(app, /InvestmentIntelligencePage|\/tools\/investment-intelligence/);
});
