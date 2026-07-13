import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveInvestmentDashboard, type InvestmentDashboardInput } from '../src/lib/investmentDashboard';

const base = (): InvestmentDashboardInput => ({ totalAssets: 1_000_000, investmentValue: 800_000, dayPnl: 8_000, todayPnlAvailable: true, monthChange: 20_000, yearChange: 60_000, growthRatio: 70, defensiveRatio: 30, cashRatio: 15, allocationDeviation: 6, rebalanceThreshold: 5, thresholdReached: true, decision: { title: '建議再平衡', reason: '目前配置已超過既有再平衡門檻。', to: '/analytics' }, quoteStatus: '報價正常', lastQuoteAt: '2026-07-13T01:00:00.000Z', hasUpdatedQuotes: true, syncDirty: false, syncStatus: '', targetInvalid: false, holdingsCount: 2 });

test('derives daily gain, reliable daily rate, allocation ratios and rebalancing reminder', () => {
  const dashboard = deriveInvestmentDashboard(base());
  assert.equal(dashboard.dayPnl, 8_000);
  assert.equal(Number(dashboard.dayPnlRate?.toFixed(2)), 1.01);
  assert.equal(dashboard.growthRatio, 70);
  assert.equal(dashboard.defensiveRatio, 30);
  assert.equal(dashboard.cashRatio, 15);
  assert.equal(dashboard.allocationDeviation, 6);
  assert.equal(dashboard.reminders.some(item => item.key === 'rebalance'), true);
});

test('does not invent daily or historical performance when data is unavailable', () => {
  const input = base(); input.todayPnlAvailable = false; input.monthChange = null; input.yearChange = null; input.hasUpdatedQuotes = false;
  const dashboard = deriveInvestmentDashboard(input);
  assert.equal(dashboard.dayPnl, null);
  assert.equal(dashboard.dayPnlRate, null);
  assert.equal(dashboard.monthChange, null);
  assert.equal(dashboard.yearChange, null);
  assert.equal(dashboard.lastQuoteAt, null);
});

test('surfaces only genuine data reminders for empty holdings, stale quotes, invalid targets and unsynced data', () => {
  const input = base(); input.holdingsCount = 0; input.quoteStatus = '部分股價資料缺失'; input.targetInvalid = true; input.syncDirty = true; input.syncStatus = '本機資料已變更';
  const keys = deriveInvestmentDashboard(input).reminders.map(item => item.key);
  assert.deepEqual(keys, ['holdings', 'quotes', 'targets', 'rebalance', 'sync']);
});
