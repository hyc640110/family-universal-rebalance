import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TrendChart from '../src/components/TrendChart';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const render = (data: { date: string; value: number }[]) =>
  renderToStaticMarkup(createElement(TrendChart, { title: '投資資產', unit: '單位：萬元', data, formatValue: (value: number) => `${value} 元` }));

const countOccurrences = (html: string, needle: string) => html.split(needle).length - 1;

test('UR-TODO-027 colors each segment by its own end-vs-start value, not the whole range', () => {
  // Overall range rises (100 -> 130), but the middle leg (150 -> 90) falls on its own.
  const html = render([
    { date: '2026-07-29', value: 100 },
    { date: '2026-07-30', value: 150 },
    { date: '2026-07-31', value: 90 },
    { date: '2026-08-01', value: 130 },
  ]);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-up"'), 2, 'first (100->150) and last (90->130) segments rise');
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-down"'), 1, 'middle (150->90) segment falls on its own even though the whole range rises');
});

test('UR-TODO-027 renders a red area on every segment of a monotonically rising series', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 150 }]);
  assert.match(html, /<linearGradient/);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-up"'), 2);
  assert.doesNotMatch(html, /trend-area-down/);
});

test('UR-TODO-027 renders a green area on every segment of a monotonically falling series', () => {
  const html = render([{ date: '2026-07-30', value: 150 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 100 }]);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-down"'), 2);
  assert.doesNotMatch(html, /trend-area-up/);
});

test('UR-TODO-027 leaves a flat segment unfilled while its neighbors keep their own color', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 100 }, { date: '2026-08-01', value: 150 }]);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-up"'), 1, 'only the second (100->150) segment is filled');
  assert.doesNotMatch(html, /trend-area-down/);
});

test('UR-TODO-027 renders no gradient or area for a fully flat range or a single point', () => {
  const flat = render([{ date: '2026-07-30', value: 100 }, { date: '2026-08-01', value: 100 }]);
  assert.doesNotMatch(flat, /<linearGradient/);
  assert.doesNotMatch(flat, /trend-area/);
  const single = render([{ date: '2026-08-01', value: 100 }]);
  assert.doesNotMatch(single, /<linearGradient/);
  assert.doesNotMatch(single, /trend-area/);
});

test('UR-TODO-027 reuses exactly one shared up gradient and one shared down gradient per chart, not one per segment', () => {
  const html = render([
    { date: '2026-07-29', value: 100 },
    { date: '2026-07-30', value: 150 },
    { date: '2026-07-31', value: 90 },
    { date: '2026-08-01', value: 130 },
  ]);
  assert.equal(countOccurrences(html, '<linearGradient'), 2, 'one up + one down gradient definition, shared by all matching segments');
});

test('UR-TODO-027 keeps the existing single continuous line stroke and point interaction markup unchanged', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 150 }]);
  assert.equal(countOccurrences(html, 'stroke="currentColor"'), 1, 'the visible line remains one single continuous stroke, not split per segment');
  assert.match(html, /class="trend-point"/);
  assert.equal(countOccurrences(html, '<circle'), 3);
});
