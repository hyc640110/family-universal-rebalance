import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  deriveAssetClassHistorySeries,
  deriveHoldingHistorySeries,
  deriveHoldingHistoryTrendIndex,
  deriveSparklineChange,
} from '../src/lib/assetAllocationOverview';
import type { HoldingHistorySnapshot } from '../src/lib/holdingHistory';

const snapshot = (date: string, holdings: HoldingHistorySnapshot['holdings']): HoldingHistorySnapshot => ({ date, holdings });
const entry = (symbol: string, marketValue: number, assetClass: 'growth' | 'defensive', quoteAvailable = true, shares = 1) => ({ symbol, shares, price: marketValue || 1, marketValue, assetClass, quoteAvailable });
const now = new Date('2026-08-30T04:00:00.000Z'); // Asia/Taipei 2026-08-30

test('UR-TODO-078-B per-holding series fail-closes at zero or one valid observation', () => {
  assert.deepEqual(deriveHoldingHistorySeries([], 'AAA', '30d', now), []);
  assert.deepEqual(deriveHoldingHistorySeries([snapshot('2026-08-29', [entry('AAA', 100, 'growth')])], 'AAA', '30d', now), [{ date: '2026-08-29', value: 100 }]);
  assert.equal(deriveSparklineChange(deriveHoldingHistorySeries([], 'AAA', '30d', now)), null);
  assert.equal(deriveSparklineChange(deriveHoldingHistorySeries([snapshot('2026-08-29', [entry('AAA', 100, 'growth')])], 'AAA', '30d', now)), null);
});

test('UR-TODO-078-B per-holding uses only valid same-symbol snapshot marketValue, preserves zero, and orders irregular dates', () => {
  const history = [
    snapshot('2026-07-31', [entry('AAA', 9999, 'growth')]),
    snapshot('2026-08-28', [entry('AAA', 999, 'growth', false), entry('BBB', 700, 'defensive')]),
    snapshot('2026-08-24', [entry('AAA', 120, 'growth', true, 12)]),
    snapshot('2026-08-30', [entry('AAA', 0, 'growth', true, 0)]),
  ];
  const points = deriveHoldingHistorySeries(history, 'AAA', '30d', now);
  assert.deepEqual(points, [
    { date: '2026-08-24', value: 120 },
    { date: '2026-08-30', value: 0 },
  ]);
  assert.deepEqual(deriveSparklineChange(points), { delta: -120, deltaPct: -100 });
});

test('UR-TODO-078-B per-holding never backfills missing dates or reads another symbol', () => {
  const history = [
    snapshot('2026-08-24', [entry('AAA', 100, 'growth'), entry('BBB', 500, 'defensive')]),
    snapshot('2026-08-28', [entry('AAA', 125, 'growth')]),
  ];
  assert.deepEqual(deriveHoldingHistorySeries(history, 'AAA', '30d', now), [
    { date: '2026-08-24', value: 100 },
    { date: '2026-08-28', value: 125 },
  ]);
  assert.deepEqual(deriveHoldingHistorySeries(history, 'BBB', '30d', now), [{ date: '2026-08-24', value: 500 }]);
});

test('UR-TODO-078-B asset-class aggregation uses each snapshot class and invalidates only the affected class day', () => {
  const history = [
    snapshot('2026-08-24', [entry('AAA', 100, 'growth'), entry('BBB', 40, 'growth'), entry('CCC', 50, 'defensive')]),
    snapshot('2026-08-25', [entry('AAA', 105, 'growth'), entry('BBB', 45, 'growth', false), entry('CCC', 55, 'defensive')]),
    snapshot('2026-08-26', [entry('AAA', 110, 'defensive'), entry('CCC', 60, 'defensive')]),
  ];
  assert.deepEqual(deriveAssetClassHistorySeries(history, 'growth', '30d', now), [
    { date: '2026-08-24', value: 140 },
    { date: '2026-08-26', value: 0 },
  ]);
  assert.deepEqual(deriveAssetClassHistorySeries(history, 'defensive', '30d', now), [
    { date: '2026-08-24', value: 50 },
    { date: '2026-08-25', value: 55 },
    { date: '2026-08-26', value: 170 },
  ]);
});

test('UR-TODO-078-B one trend index supplies symbol and class series without mutating archived history', () => {
  const history = [
    snapshot('2026-08-24', [entry('ARCHIVED', 80, 'growth')]),
    snapshot('2026-08-25', [entry('ARCHIVED', 0, 'growth', true, 0)]),
  ];
  const before = structuredClone(history);
  const index = deriveHoldingHistoryTrendIndex(history, '30d', now);
  assert.deepEqual(index.pointsBySymbol.get('ARCHIVED'), [{ date: '2026-08-24', value: 80 }, { date: '2026-08-25', value: 0 }]);
  assert.deepEqual(index.pointsByAssetClass.growth, [{ date: '2026-08-24', value: 80 }, { date: '2026-08-25', value: 0 }]);
  assert.deepEqual(history, before);
});

test('UR-TODO-078-B UI consumes holdingHistory for growth/defensive and Desktop holding trends while preserving mobile table gate and total/cash SSOT', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const overview = app.slice(app.indexOf('function AssetAllocationOverview'), app.indexOf('function HoldingCompactCard'));
  const table = app.slice(app.indexOf('function AssetAllocationDetailTable'), app.indexOf('function AssetAllocationOverview'));
  assert.match(overview, /deriveHoldingHistoryTrendIndex\(state\.holdingHistory/);
  assert.match(overview, /label="成長資產"[\s\S]{0,180}change=\{growthChange\}/);
  assert.match(overview, /label="防守資產"[\s\S]{0,180}change=\{defensiveChange\}/);
  assert.match(table, /<MiniSparkline points=\{trendPoints/);
  assert.match(overview, /historyForRange\(netWorthHistory, '30d'\)/);
  assert.match(overview, /sparklinePointsFromHistory\(recentHistory, 'totalAssets'\)/);
  assert.match(overview, /sparklinePointsFromHistory\(recentHistory, 'cash'\)/);
  assert.match(overview, /\{!isMobile && <AssetAllocationDetailTable/);
});
