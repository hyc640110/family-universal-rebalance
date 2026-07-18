import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveSharedTrendDomain, deriveTrendDomain, formatTrendAxisTick, trendChartPlotMargins } from '../src/components/TrendChart';

test('paired analytics series receive one deterministic shared domain and tick set', () => {
  const investment = [410, 545, 478], netWorth = [299, 459, 375];
  const shared = deriveSharedTrendDomain([investment, netWorth]);
  assert.deepEqual(shared, deriveSharedTrendDomain([netWorth, investment]));
  assert.ok(shared.min < 299); assert.ok(shared.max > 545);
  assert.deepEqual(shared.ticks, [shared.max, (shared.min + shared.max) / 2, shared.min]);
});

test('trend domains remain finite and deterministic for flat, negative, zero-crossing, partial, single, and empty inputs', () => {
  for (const values of [[100, 100], [-30, -10], [-20, 30], [Number.NaN, 15, Infinity], [42], []]) {
    const domain = deriveTrendDomain(values);
    assert.ok(Number.isFinite(domain.min)); assert.ok(Number.isFinite(domain.max));
    assert.ok(domain.max > domain.min); assert.ok(domain.ticks.every(Number.isFinite));
  }
  assert.deepEqual(deriveSharedTrendDomain([[Number.NaN], [410, 545]]), deriveTrendDomain([410, 545]));
});

test('axis labels retain only their numeric value while current values and summaries can keep units', () => {
  const money = (value: number) => `${value.toFixed(2)} 萬元`;
  assert.equal(formatTrendAxisTick(545.51, money), '545.51');
  assert.equal(formatTrendAxisTick(-10.25, money), '-10.25');
  assert.equal(formatTrendAxisTick(5, value => `${value} 萬`), '5');
});

test('mobile plot margins keep 13px y-axis labels and endpoint dates inside the SVG viewBox', () => {
  const mobile = trendChartPlotMargins(350);
  assert.equal(mobile.left, 76); assert.ok(mobile.left - 8 > 0);
  assert.ok(350 - mobile.right > mobile.left);
  assert.equal(trendChartPlotMargins(900).left, 80);
});
