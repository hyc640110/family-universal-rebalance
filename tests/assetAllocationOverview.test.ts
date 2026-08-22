import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocationTone,
  deriveAllocationDetailRows,
  deriveAllocationLegendItems,
  deriveSparklineChange,
  sparklinePointsFromHistory,
} from '../src/lib/assetAllocationOverview';

const colorOf = (symbol: string) => (symbol === 'CASH' ? '#78a6f7' : `#${symbol}`);

test('UR-TODO-076 allocationTone mirrors the existing generic tone() convention', () => {
  assert.equal(allocationTone(1), 'up');
  assert.equal(allocationTone(-1), 'down');
  assert.equal(allocationTone(0), 'hold');
});

test('UR-TODO-076 deriveAllocationLegendItems composes holdings + a single synthetic CASH row, sorted by percent desc', () => {
  const rows = [
    { symbol: '00631L', name: '元大台灣50正2', marketValue: 3_342_000 },
    { symbol: '0050', name: '元大台灣50', marketValue: 531_000 },
  ];
  const items = deriveAllocationLegendItems(rows, 322_000, 4_195_000, colorOf);
  assert.equal(items.length, 3);
  assert.equal(items[0].symbol, '00631L');
  assert.equal(items.at(-1)!.symbol, 'CASH');
  const cash = items.find(item => item.symbol === 'CASH');
  assert.ok(cash);
  assert.equal(cash!.name, '台幣現金');
  const percentSum = items.reduce((total, item) => total + item.percent, 0);
  assert.ok(Math.abs(percentSum - 100) < 0.01, `percent sum should be ~100, got ${percentSum}`);
});

test('UR-TODO-076 deriveAllocationLegendItems drops zero/negative-value rows and never divides by zero total', () => {
  const rows = [{ symbol: 'A', name: 'A', marketValue: 0 }];
  const items = deriveAllocationLegendItems(rows, 0, 0, colorOf);
  assert.deepEqual(items, []);
});

test('UR-TODO-076 deriveAllocationDetailRows reuses the caller-supplied effective target — cash uses cashTargetPercent, holdings use effectiveTargetOf', () => {
  const rows = [
    { symbol: '00631L', name: '元大台灣50正2', marketValue: 3_342_000 },
  ];
  const holdings = [{ symbol: '00631L', assetClass: 'growth' as const, targetWeight: 60 }];
  const legendItems = deriveAllocationLegendItems(rows, 322_000, 3_664_000, colorOf);
  const detailRows = deriveAllocationDetailRows(
    legendItems,
    holdings,
    10,
    holding => holding.targetWeight,
    assetClass => (assetClass === 'defensive' ? '防守資產' : '成長資產')
  );
  const stock = detailRows.find(row => row.symbol === '00631L')!;
  assert.equal(stock.targetPercent, 60);
  assert.equal(stock.classLabel, '成長資產');
  assert.ok(Math.abs(stock.deviationPercent - (stock.percent - 60)) < 1e-9);
  assert.equal(stock.deviationTone, allocationTone(stock.deviationPercent));
  const cash = detailRows.find(row => row.symbol === 'CASH')!;
  assert.equal(cash.targetPercent, 10);
  assert.equal(cash.classLabel, '防守');
});

test('UR-TODO-076 sparklinePointsFromHistory only extracts finite-number fields and preserves order', () => {
  const history = [
    { date: '2026-08-01', totalAssets: 100, cash: 10 },
    { date: '2026-08-02', totalAssets: Number.NaN, cash: 12 },
    { date: '2026-08-03', totalAssets: 110, cash: 11 },
  ];
  const points = sparklinePointsFromHistory(history, 'totalAssets');
  assert.deepEqual(points, [
    { date: '2026-08-01', value: 100 },
    { date: '2026-08-03', value: 110 },
  ]);
});

test('UR-TODO-076 sparklinePointsFromHistory returns an empty array for undefined/empty history (fail-closed, no fabricated points)', () => {
  assert.deepEqual(sparklinePointsFromHistory(undefined, 'totalAssets'), []);
  assert.deepEqual(sparklinePointsFromHistory([], 'totalAssets'), []);
});

test('UR-TODO-076 deriveSparklineChange returns null (not a fabricated 0) when fewer than 2 real points exist', () => {
  assert.equal(deriveSparklineChange([]), null);
  assert.equal(deriveSparklineChange([{ date: '2026-08-01', value: 100 }]), null);
});

test('UR-TODO-076 deriveSparklineChange computes first-vs-last delta and percent change', () => {
  const change = deriveSparklineChange([
    { date: '2026-08-01', value: 100 },
    { date: '2026-08-15', value: 110 },
    { date: '2026-08-23', value: 125 },
  ]);
  assert.ok(change);
  assert.equal(change!.delta, 25);
  assert.ok(Math.abs(change!.deltaPct! - 25) < 1e-9);
});

test('UR-TODO-076 deriveSparklineChange never divides by zero when the first point is 0', () => {
  const change = deriveSparklineChange([
    { date: '2026-08-01', value: 0 },
    { date: '2026-08-02', value: 10 },
  ]);
  assert.ok(change);
  assert.equal(change!.delta, 10);
  assert.equal(change!.deltaPct, null);
});
