import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveSharedTrendDomain, deriveTrendDomain, formatTrendAxisTick, trendChartPlotMargins } from '../src/components/TrendChart';

test('paired analytics series receive one deterministic shared integer domain and tick set', () => {
  const investment = [410, 545, 478].map(value => value * 10000), netWorth = [299, 459, 375].map(value => value * 10000);
  const shared = deriveSharedTrendDomain([investment, netWorth], 10000);
  assert.deepEqual(shared, deriveSharedTrendDomain([netWorth, investment], 10000));
  assert.ok(shared.min <= 2990000); assert.ok(shared.max >= 5450000);
  assert.ok(shared.ticks.every(value => Number.isInteger(value / 10000)));
  assert.ok(shared.ticks.length >= 4 && shared.ticks.length <= 7);
});

test('trend domains remain finite and deterministic for flat, negative, zero-crossing, partial, single, and empty inputs', () => {
  for (const values of [[100.5, 100.5], [-30.4, -10.2], [-20.5, 30.25], [Number.NaN, 15.5, Infinity], [42.2], []]) {
    const domain = deriveTrendDomain(values);
    assert.ok(Number.isFinite(domain.min)); assert.ok(Number.isFinite(domain.max));
    assert.ok(domain.max > domain.min); assert.ok(domain.ticks.every(Number.isFinite));
    assert.ok(domain.ticks.every(Number.isInteger));
    assert.ok(domain.ticks.length >= 3 && domain.ticks.length <= 7);
  }
  assert.deepEqual(deriveSharedTrendDomain([[Number.NaN], [410, 545]]), deriveTrendDomain([410, 545]));
});

test('axis labels retain only integer numeric values while current values and summaries can keep units', () => {
  assert.equal(formatTrendAxisTick(5450000, 10000), '545');
  assert.equal(formatTrendAxisTick(-100000, 10000), '-10');
  assert.equal(formatTrendAxisTick(5), '5');
});

test('mobile plot margins keep 13px y-axis labels and endpoint dates inside the SVG viewBox', () => {
  const mobile = trendChartPlotMargins(350);
  assert.equal(mobile.left, 76); assert.ok(mobile.left - 8 > 0);
  assert.ok(350 - mobile.right > mobile.left);
  assert.equal(trendChartPlotMargins(900).left, 80);
});
