import assert from 'node:assert/strict';
import test from 'node:test';
import TrendChart, { selectTrendTickIndexes } from '../src/components/TrendChart';
import { readFileSync } from 'node:fs';

test('V6.7 keeps trend rendering presentation-only and supports flat and single-point data', () => {
  assert.ok(TrendChart);
  const source = readFileSync(new URL('../src/components/TrendChart.tsx', import.meta.url), 'utf8');
  assert.match(source, /unit/); assert.match(source, /trend-axis-label/); assert.match(source, /<title>/); assert.match(source, /Number\.isFinite/);
  assert.doesNotMatch(source, /localStorage|Firebase|price - previousClose/);
});

test('V6.7 uses the shared money trend chart for net worth and investment history', () => {
  const netWorth = readFileSync(new URL('../src/pages/NetWorthHistoryPage.tsx', import.meta.url), 'utf8');
  const analytics = readFileSync(new URL('../src/pages/PerformanceAnalyticsPage.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(netWorth, /<TrendChart title="淨資產" unit="單位：萬元"/);
  assert.match(analytics, /<TrendChart title=\{title\.replace\('趨勢',''\)\} unit="單位：萬元"/);
  assert.match(css, /\.trend-axis-label\{[^}]*font-size:12px/);
  assert.match(css, /\.trend-axis-label\{font-size:13px/);
});

test('V6.7 selects original-date ticks by density while preserving both ends', () => {
  const seven = Array.from({ length: 7 }, (_, index) => ({ date: `2026-07-${String(index + 12).padStart(2, '0')}`, value: index }));
  const thirty = Array.from({ length: 30 }, (_, index) => ({ date: `2026-07-${String(index + 1).padStart(2, '0')}`, value: index }));
  assert.equal(selectTrendTickIndexes(seven).length, 7);
  assert.equal(selectTrendTickIndexes(thirty).length, 7);
  assert.ok(selectTrendTickIndexes(thirty, true).length < selectTrendTickIndexes(thirty).length);
  assert.deepEqual(selectTrendTickIndexes(thirty).at(0), 0);
  assert.deepEqual(selectTrendTickIndexes(thirty).at(-1), 29);
});
