import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TrendChart from '../src/components/TrendChart';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const render = (data: { date: string; value: number }[]) =>
  renderToStaticMarkup(createElement(TrendChart, { title: '投資資產', unit: '單位：萬元', data, formatValue: (value: number) => `${value} 元` }));

test('UR-TODO-027 renders a red gradient fill when the range rises from start to end', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 150 }]);
  assert.match(html, /<linearGradient/);
  assert.match(html, /trend-area-up/);
  assert.doesNotMatch(html, /trend-area-down/);
});

test('UR-TODO-027 renders a green gradient fill when the range falls from start to end', () => {
  const html = render([{ date: '2026-07-30', value: 150 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 100 }]);
  assert.match(html, /<linearGradient/);
  assert.match(html, /trend-area-down/);
  assert.doesNotMatch(html, /trend-area-up/);
});

test('UR-TODO-027 renders no gradient area when the range is flat or has fewer than two points', () => {
  const flat = render([{ date: '2026-07-30', value: 100 }, { date: '2026-08-01', value: 100 }]);
  assert.doesNotMatch(flat, /<linearGradient/);
  assert.doesNotMatch(flat, /trend-area/);
  const single = render([{ date: '2026-08-01', value: 100 }]);
  assert.doesNotMatch(single, /<linearGradient/);
  assert.doesNotMatch(single, /trend-area/);
});

test('UR-TODO-027 keeps the existing line stroke and point interaction markup unchanged', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 150 }]);
  assert.match(html, /stroke="currentColor"/);
  assert.match(html, /class="trend-point"/);
  assert.match(html, /<circle/);
});
