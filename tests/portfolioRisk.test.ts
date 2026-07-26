import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { deriveInvestmentPerformanceQuality, deriveInvestmentPerformanceStats } from '../src/lib/investmentPerformanceHistory';
import { derivePortfolioRisk, type PortfolioRiskInput } from '../src/lib/portfolioRisk';
import { deriveRiskMetrics, type RiskLiquidityContext } from '../src/lib/riskMetrics';

// UR-TODO-009 sub-PR 3 (013 §22): deriveRiskMetrics now requires a `liquidity` context sourced from the
// Household Liquidity core model. This file tests derivePortfolioRisk's own selector behavior (concentration,
// drawdown, quote quality), not the household-liquidity-driven cash-safety formula itself (that is covered by
// the dedicated tests/riskMetrics.test.ts), so an "insufficient data" fixture is deliberate and sufficient here
// — none of the assertions below depend on a specific cashSafetyMonths/minimumCashTarget/stableCashTarget value.
const NO_LIQUIDITY_DATA: RiskLiquidityContext = { monthlyEssentialExpenses: null, minimumSafetyCash: null, stableSafetyCash: null, safetyCashShortfall: null, investableCash: null, dataCompleteness: 'insufficient', confidence: 'low', blockingReasons: [] };

const history = [{ date: '2026-07-10', totalAssets: 1000, netWorth: 900, investmentValue: 900, cash: 100, debt: 100 }, { date: '2026-07-11', totalAssets: 900, netWorth: 800, investmentValue: 800, cash: 100, debt: 100 }];
const makeInput = (): PortfolioRiskInput => {
  const risk = deriveRiskMetrics({ assets: [{ symbol: '00631L', name: '台灣正2', assetClass: 'growth', marketValue: 600 }, { symbol: '00865B', name: '公債', assetClass: 'defensive', marketValue: 200 }], loans: [{ id: 'loan', name: '貸款', principal: 100, annualRate: 1, monthlyPayment: 25 }], cash: 200, totalAssets: 1000, growthRatio: 60, defensiveRatio: 40, growthTargetPct: 60, allocationDeviation: 6, rebalanceThreshold: 5, thresholdReached: true, liquidity: NO_LIQUIDITY_DATA });
  const quality = deriveInvestmentPerformanceQuality(history);
  return { totalAssets: 1000, investmentValue: 800, growthValue: 600, defensiveValue: 200, cash: 200, growthTargetPct: 60, defensiveTargetPct: 20, cashTargetPct: 20, targetTotalPct: 80, allocationDeviation: 6, rebalanceThreshold: 5, thresholdReached: true, risk, performance: { stats: deriveInvestmentPerformanceStats(history, 'investmentValue'), canCalculateMaxDrawdown: quality.canCalculateMaxDrawdown, snapshotCount: quality.snapshotCount }, quotes: [{ symbol: '00631L', marketValue: 600, assetClass: 'growth', quote: { quoteDate: '2026-07-14', quoteTime: '13:30:00', source: 'Price Worker' } }, { symbol: '00865B', marketValue: 200, assetClass: 'defensive', quote: { quoteDate: '2026-07-10', quoteTime: '13:30:00', source: 'Price Worker' } }], rawSymbols: ['00631L', '00865B'] };
};

test('integrates existing selectors deterministically without mutating input', () => {
  const input = makeInput(); const before = JSON.stringify(input); const view = derivePortfolioRisk(input);
  assert.deepEqual(derivePortfolioRisk(input), view);
  assert.equal(JSON.stringify(input), before);
  assert.equal(view.denominatorLabel, '占總資產');
  assert.equal(view.concentration.largestPct, input.risk.largestHoldingRatio);
  assert.equal(view.current.growthPct, 60);
  assert.equal(view.current.defensivePct, 20);
  assert.equal(view.current.cashPct, 20);
  assert.equal(view.drawdown.maxDrawdown, -1 / 9);
});

test('keeps quote-date quality, fallback and duplicate-symbol conditions explicit', () => {
  const input = makeInput();
  input.quotes[0].quote = { quoteDate: undefined, source: '成交均價備援' };
  input.quotes[1].quote = { quoteDate: '2026-07-01', quoteTime: '13:30:00', source: 'Price Worker', error: 'failed' };
  input.rawSymbols.push('00631l'); input.targetTotalPct = 110;
  const items = derivePortfolioRisk(input).quality.items.join('｜');
  assert.match(items, /缺報價/); assert.match(items, /日期不明/); assert.match(items, /過期報價/);
  assert.match(items, /備援價格/); assert.match(items, /重複 symbol：00631L/); assert.match(items, /超過 100%/);
});

test('does not substitute zero for insufficient drawdown or cash safety data', () => {
  const input = makeInput();
  input.performance = { stats: deriveInvestmentPerformanceStats([], 'investmentValue'), canCalculateMaxDrawdown: false, snapshotCount: 0 };
  input.risk.cashSafetyMonths = null; input.risk.monthlyPayment = 0; input.targetTotalPct = 70;
  const view = derivePortfolioRisk(input);
  assert.equal(view.drawdown.canCalculate, false); assert.equal(view.drawdown.maxDrawdown, null);
  assert.equal(view.cashLoan.safetyMonths, null); assert.equal(view.target.status, '未分配比例由現金承擔');
  assert.ok(view.quality.items.some(item => item.includes('無法計算最大回撤')));
});

test('帶出 Risk Metrics 的家庭流動性呈現資料，不由 Portfolio Risk 重算', () => {
  const input = makeInput();
  input.risk.monthlyEssentialExpenses = 30_000;
  input.risk.safetyCashShortfall = 10_000;
  input.risk.investableCash = 0;
  input.risk.dataCompleteness = 'partial';
  input.risk.confidence = 'medium';
  input.risk.blockingReasons = [{ code: 'DUPLICATE_LIQUID_ACCOUNT_ID', message: '流動現金輸入包含重複 accountId。', sourceIds: ['cash-1'] }];

  const view = derivePortfolioRisk(input);

  assert.equal(view.cashLoan.monthlyEssentialExpenses, 30_000);
  assert.equal(view.cashLoan.safetyCashShortfall, 10_000);
  assert.equal(view.cashLoan.investableCash, 0);
  assert.equal(view.cashLoan.confidence, 'medium');
  assert.deepEqual(view.cashLoan.duplicateSourceWarnings, ['流動現金輸入包含重複 accountId。']);
});

test('route, mobile single-column CSS and page wording exclude trade instructions', () => {
  const page = readFileSync(new URL('../src/pages/PortfolioRiskPage.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(app, /\/tools\/portfolio-risk/); assert.match(page, /不提供買賣金額、股數或下單建議/);
  assert.match(css, /@media \(max-width:700px\)\{\.portfolio-risk-summary,.portfolio-risk-two-column,.portfolio-risk-grid\{grid-template-columns:1fr/);
  assert.doesNotMatch(page, /<table|買入金額|賣出金額|下單步驟/);
});

test('目前／目標配置的桌機表頭與資料列共用三欄 grid，且表頭不可逐字換行', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.portfolio-risk-rows\{--portfolio-risk-columns:minmax\(5rem,1\.15fr\) repeat\(2,minmax\(3\.25rem,\.85fr\)\)/);
  assert.match(css, /\.portfolio-risk-rows>div,\.portfolio-risk-rows \.head\{display:grid;grid-template-columns:var\(--portfolio-risk-columns\)/);
  assert.match(css, /\.portfolio-risk-rows \.head span\{[^}]*white-space:nowrap;[^}]*word-break:keep-all;[^}]*overflow-wrap:normal/);
});
