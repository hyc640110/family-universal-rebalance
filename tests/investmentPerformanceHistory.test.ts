import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveInvestmentPerformanceQuality, deriveInvestmentPerformanceStats, filterInvestmentPerformanceRange, normalizeInvestmentPerformanceHistory } from '../src/lib/investmentPerformanceHistory';

const row = (date: string, investmentValue: number, netWorth = investmentValue) => ({ date, totalAssets: netWorth + 100, netWorth, investmentValue, cash: 100, debt: 0 });

test('normalizes valid snapshots, excludes invalid data, sorts dates, and overwrites a day with its latest value', () => {
  const rows = normalizeInvestmentPerformanceHistory([row('2026-02-02', 200), row('2026-02-01', 100), row('2026-02-02', 220), row('2026-02-30', 999), { ...row('2026-02-03', 300), cash: Infinity }]);
  assert.deepEqual(rows.map(item => [item.date, item.investmentValue]), [['2026-02-01', 100], ['2026-02-02', 220]]);
});

test('derives highs, distance, ordered drawdown, and current month/year changes', () => {
  const rows = [row('2025-12-31', 100), row('2026-01-02', 140), row('2026-01-20', 110), row('2026-02-02', 160), row('2026-02-03', 120)];
  const stats = deriveInvestmentPerformanceStats(rows, 'investmentValue');
  assert.equal(stats.highest, 160);
  assert.equal(stats.distanceFromHigh, -40);
  assert.equal(stats.distanceFromHighRate, -0.25);
  assert.equal(stats.maxDrawdown, -0.25);
  assert.equal(stats.monthChange, -40);
  assert.equal(stats.yearChange, -20);
  assert.equal(stats.monthlyChanges[0].key, '2026-02');
});

test('does not invent changes for empty or single histories, reports zero drawdown while rising, and guards non-positive highs', () => {
  const empty = deriveInvestmentPerformanceStats([], 'netWorth');
  assert.equal(empty.highest, null);
  assert.equal(empty.maxDrawdown, null);
  const single = deriveInvestmentPerformanceStats([row('2026-01-01', 100)], 'investmentValue');
  assert.equal(single.highest, 100);
  assert.equal(single.monthChange, null);
  assert.equal(single.maxDrawdown, null);
  const rising = deriveInvestmentPerformanceStats([row('2026-01-01', 100), row('2026-01-02', 140)], 'investmentValue');
  assert.equal(rising.maxDrawdown, 0);
  const nonPositive = deriveInvestmentPerformanceStats([row('2026-01-01', 0), row('2026-01-02', -5)], 'investmentValue');
  assert.equal(nonPositive.distanceFromHighRate, null);
});

test('filters ranges and reports transparent quality limitations', () => {
  const rows = [row('2025-01-01', 100), row('2026-07-01', 120)];
  assert.equal(filterInvestmentPerformanceRange(rows, '30d', new Date('2026-07-13')).length, 1);
  const quality = deriveInvestmentPerformanceQuality(rows);
  assert.equal(quality.snapshotCount, 2);
  assert.equal(quality.canCalculateMaxDrawdown, true);
  assert.equal(quality.canCalculateCagr, false);
  assert.match(quality.cagrReason, /現金流/);
});
