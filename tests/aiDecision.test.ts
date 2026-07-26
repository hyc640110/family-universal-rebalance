import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveAiDecisions, deriveMarketFreshness, type AiDecisionInput } from '../src/lib/aiDecision';
import { dividendSources, dividendSummary } from '../src/lib/dividends';
import { deriveInvestmentPerformanceQuality, deriveInvestmentPerformanceStats } from '../src/lib/investmentPerformanceHistory';
import { deriveRiskMetrics, type RiskLiquidityContext } from '../src/lib/riskMetrics';
import { quoteDateStatus } from '../src/lib/quoteMath';

// UR-TODO-009 sub-PR 3 (013 §22): deriveRiskMetrics now requires a `liquidity` context sourced from the
// Household Liquidity core model. This file tests deriveAiDecisions' own selector behavior (severity, evidence,
// text branches), not the household-liquidity-driven cash-safety formula itself (that is covered by the
// dedicated tests/riskMetrics.test.ts). An "insufficient data" fixture keeps `risk.cashSafetyMonths` null —
// the same value this fixture's `loans: []` already produced under the old cash ÷ monthlyPayment formula — so
// every existing assertion below (including the 'cash' conclusion text match) is unchanged.
const NO_LIQUIDITY_DATA: RiskLiquidityContext = { monthlyEssentialExpenses: null, minimumSafetyCash: null, stableSafetyCash: null, safetyCashShortfall: null, investableCash: null, dataCompleteness: 'insufficient' };

const today = '2026-07-14';
const COMPLETE_LIQUIDITY = {
  dataCompleteness: 'complete' as const,
  safetyCashShortfall: 0,
  investableCash: 100,
  protectedSafetyCash: 600
};
const input = (): AiDecisionInput => {
  const history = [{ date: '2026-07-12', totalAssets: 1000, netWorth: 1000, investmentValue: 1000, cash: 100, debt: 0 }, { date: '2026-07-13', totalAssets: 800, netWorth: 800, investmentValue: 800, cash: 100, debt: 0 }];
  const risk = deriveRiskMetrics({ assets: [{ symbol: '00670L', name: '正2', assetClass: 'growth', marketValue: 700 }, { symbol: '00865B', name: '公債', assetClass: 'defensive', marketValue: 200 }], loans: [], cash: 100, totalAssets: 1000, growthRatio: 70, defensiveRatio: 20, growthTargetPct: 70, allocationDeviation: 0, rebalanceThreshold: 5, thresholdReached: false, liquidity: NO_LIQUIDITY_DATA });
  const transactions: any[] = [{ id: 'd1', type: 'income', categoryId: 'income-dividend', status: 'posted', excluded: false, occurredAt: '2026-07-01T00:00:00.000Z', amount: 50, assetSymbol: '00865B', assetName: '公債' }];
  return { today, dashboard: { investmentValue: 900, dayPnl: 10, dayPnlRate: 1.1, cashRatio: 10, quoteStatus: '報價正常', holdingsCount: 2 }, risk, performance: { stats: deriveInvestmentPerformanceStats(history, 'investmentValue'), canCalculateMaxDrawdown: deriveInvestmentPerformanceQuality(history).canCalculateMaxDrawdown, snapshotCount: history.length }, dividend: { summary: dividendSummary(transactions, today), sources: dividendSources(transactions, { today }) }, market: { fetchedAt: '2026-07-14T02:00:00.000Z', status: 'closed', items: [{ id: 'taiex', name: '台股', group: 'taiwan', value: 1, change: 1, changePct: 1, asOf: '2026-07-14T00:00:00.000Z', fetchedAt: '2026-07-14T02:00:00.000Z', source: '官方', status: 'closed' }] }, quoteStatuses: ['today'], quoteErrors: 0, backupQuoteCount: 0, targetOverLimit: false, holdingMarketValue: 900, liquidity: { ...COMPLETE_LIQUIDITY }, todayConclusion: '維持持有，暫不需要操作' };
};

test('same input produces deterministic, traceable results without mutation', () => { const value = input(); const before = JSON.stringify(value); const first = deriveAiDecisions(value); assert.deepEqual(deriveAiDecisions(value), first); assert.equal(JSON.stringify(value), before); assert.equal(first.length, 9); assert.ok(first.every(item => item.id && item.evidence.length && item.evidence.every(row => row.label && row.value && row.source))); });
test('today PnL unavailable remains unavailable rather than zero', () => { const value = input(); value.dashboard.dayPnl = null; value.dashboard.dayPnlRate = null; const item = deriveAiDecisions(value).find(row => row.id === 'today')!; assert.equal(item.severity, 'unavailable'); assert.match(item.conclusion, /資料不足/); });
test('cash decision uses the existing lower-priority Today Decision conclusion only after liquidity gates pass', () => { const value = input(); const concentration = deriveAiDecisions(value).find(row => row.id === 'concentration')!; assert.equal(concentration.severity, 'warning'); const cash = deriveAiDecisions(value).find(row => row.id === 'cash')!; assert.equal(cash.conclusion, '維持持有，暫不需要操作'); assert.equal(cash.severity, 'normal'); assert.deepEqual(cash.evidence.map(row => row.source), ['HouseholdLiquidityOutput', 'HouseholdLiquidityOutput', 'HouseholdLiquidityOutput', 'HouseholdLiquidityOutput']); });
test('drawdown and dividend shortage are explicit', () => { const value = input(); value.performance.canCalculateMaxDrawdown = false; value.performance.snapshotCount = 1; value.dividend.summary = { yearAmount: 0, monthAmount: 0, totalAmount: 0, yearCount: 0, latest: null }; const rows = deriveAiDecisions(value); assert.match(rows.find(row => row.id === 'drawdown')!.conclusion, /暫無法計算/); assert.equal(rows.find(row => row.id === 'dividend')!.severity, 'unavailable'); });
test('quote date contract distinguishes today, recent, stale, unknown, error and backup', () => { assert.equal(quoteDateStatus(today, '13:30:00', new Date('2026-07-14T12:00:00+08:00')), 'today'); assert.equal(quoteDateStatus('2026-07-10', '13:30:00', new Date('2026-07-14T12:00:00+08:00')), 'stale'); const value = input(); value.quoteStatuses = ['unknown', 'recent-trading-day']; value.quoteErrors = 1; value.backupQuoteCount = 1; const quote = deriveAiDecisions(value).find(row => row.id === 'quote-freshness')!; assert.equal(quote.severity, 'critical'); assert.match(quote.conclusion, /報價錯誤/); });
test('market freshness supports today, recent-effective, stale, unavailable and invalid', () => { const snapshot = input().market; assert.equal(deriveMarketFreshness(snapshot, today), 'today'); snapshot.items[0].asOf = '2026-07-13T00:00:00.000Z'; snapshot.items[0].status = 'recent-effective'; assert.equal(deriveMarketFreshness(snapshot, today), 'recent-effective'); snapshot.items[0].status = 'delayed'; assert.equal(deriveMarketFreshness(snapshot, today), 'stale'); snapshot.status = 'unavailable'; assert.equal(deriveMarketFreshness(snapshot, today), 'unavailable'); snapshot.status = 'closed'; snapshot.items[0].asOf = 'not-a-date'; assert.equal(deriveMarketFreshness(snapshot, today), 'invalid'); });
test('data quality flags target overflow and inconsistent totals safely', () => { const value = input(); value.targetOverLimit = true; value.risk.cashRatio = 0; value.holdingMarketValue = 900; const quality = deriveAiDecisions(value).find(row => row.id === 'data-quality')!; assert.equal(quality.severity, 'critical'); assert.match(quality.reason, /目標比例合計超過 100%/); });

test('liquidity data insufficiency blocks lower-priority conclusions without a precise investment amount', () => {
  const value = input();
  value.liquidity = { ...COMPLETE_LIQUIDITY, dataCompleteness: 'insufficient', safetyCashShortfall: null, investableCash: null };
  value.todayConclusion = '已達再平衡門檻';

  const cash = deriveAiDecisions(value).find(row => row.id === 'cash')!;
  assert.equal(cash.severity, 'unavailable');
  assert.equal(cash.conclusion, '目前缺少必要生活費或負債資料，無法安全計算可投資現金。');
  assert.doesNotMatch(`${cash.conclusion} ${cash.reason} ${cash.evidence.map(row => row.value).join(' ')}`, /100 元|建議買入/);
});

test('null liquidity amounts remain unavailable rather than being treated as zero', () => {
  for (const liquidity of [
    { ...COMPLETE_LIQUIDITY, safetyCashShortfall: null },
    { ...COMPLETE_LIQUIDITY, investableCash: null },
    { ...COMPLETE_LIQUIDITY, protectedSafetyCash: null }
  ]) {
    const value = input();
    value.liquidity = liquidity;
    value.todayConclusion = '已達再平衡門檻';
    const cash = deriveAiDecisions(value).find(row => row.id === 'cash')!;
    assert.equal(cash.severity, 'unavailable');
    assert.equal(cash.conclusion, '目前缺少必要生活費或負債資料，無法安全計算可投資現金。');
  }
});

test('safety cash shortfall blocks allocation, dip, and other lower-priority conclusions', () => {
  const value = input();
  value.liquidity = { ...COMPLETE_LIQUIDITY, safetyCashShortfall: 1, investableCash: 100 };
  value.todayConclusion = '已達再平衡門檻';

  const cash = deriveAiDecisions(value).find(row => row.id === 'cash')!;
  assert.equal(cash.severity, 'critical');
  assert.equal(cash.conclusion, '現金安全存量不足，暫不產生可執行投資建議。');
  assert.doesNotMatch(cash.conclusion, /再平衡|加碼|買入/);
});

test('zero investable cash preserves cash even when a lower-priority conclusion exists', () => {
  const value = input();
  value.liquidity = { ...COMPLETE_LIQUIDITY, investableCash: 0 };
  value.todayConclusion = '建議分批加碼觀察';

  const cash = deriveAiDecisions(value).find(row => row.id === 'cash')!;
  assert.equal(cash.severity, 'info');
  assert.equal(cash.conclusion, '目前沒有可投資現金，建議先保留現金。');
  assert.doesNotMatch(cash.conclusion, /加碼|買入/);
});
