import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import NetWorthHistoryPage from '../src/pages/NetWorthHistoryPage';
import type { NetWorthSnapshot } from '../src/lib/netWorthHistory';
import { createNetWorthSnapshotReadTimeView } from '../src/lib/netWorthSnapshotReadBoundary';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const render = (history?: NetWorthSnapshot[]) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(NetWorthHistoryPage, { history })));

function snapshot(date: string, netWorth: number): NetWorthSnapshot {
  return { date, totalAssets: netWorth + 100, netWorth, investmentValue: netWorth, cash: 100, debt: 0 };
}

// Builds `count` consecutive daily snapshots ending today (UTC), oldest first. Anchoring to
// "today" (rather than a fixed calendar date) keeps every generated date inside the page's
// default 30-day range regardless of when this test suite runs.
function recentDaysOfHistory(count: number): NetWorthSnapshot[] {
  const rows: NetWorthSnapshot[] = [];
  const today = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(today);
    cursor.setUTCDate(cursor.getUTCDate() - offset);
    const date = cursor.toISOString().slice(0, 10);
    rows.push(snapshot(date, 1_000_000 + (count - offset)));
  }
  return rows;
}

function historyGridSection(html: string): string {
  const match = html.match(/<section class="history-grid">([\s\S]*?)<\/section>/);
  assert.ok(match, 'expected a <section class="history-grid"> to be present');
  return match![1];
}

// UR-TODO-045: session-only display collapse for the net worth history card list.
// This is purely a display-layer addition; it does not change netWorthHistory.ts,
// historyForRange, or any persisted data. Not persisted to localStorage/Firebase —
// always starts collapsed on a fresh render, matching a page reload.

test('history grid defaults to the most recent 7 entries when more than 7 exist', () => {
  const allRows = recentDaysOfHistory(10);
  const html = render(allRows);
  const gridSection = historyGridSection(html);
  const renderedDates = [...gridSection.matchAll(/<strong>(\d{4}-\d{2}-\d{2})<\/strong>/g)].map(match => match[1]);
  const expectedVisibleDates = allRows.slice(-7).map(row => row.date);

  assert.equal(renderedDates.length, 7, `expected exactly 7 dates rendered, got ${renderedDates.length}`);
  assert.deepEqual(renderedDates, expectedVisibleDates.slice().reverse(), 'grid should show the 7 most recent dates, newest first');
});

test('a "顯示更多" toggle appears when there are more than 7 entries, defaulting to collapsed', () => {
  const html = render(recentDaysOfHistory(8));
  assert.match(html, /history-grid-toggle-row/);
  assert.match(html, />顯示更多</);
  assert.doesNotMatch(html, />收合</);
  const toggleMatch = html.match(/<button type="button" class="small history-grid-toggle" aria-expanded="(true|false)"/);
  assert.ok(toggleMatch, 'expected the history grid toggle button to be present');
  assert.equal(toggleMatch?.[1], 'false');
});

test('no toggle is rendered when there are 7 or fewer entries', () => {
  const exactlySeven = render(recentDaysOfHistory(7));
  assert.doesNotMatch(exactlySeven, /history-grid-toggle-row/);
  const gridSection = historyGridSection(exactlySeven);
  const renderedDates = [...gridSection.matchAll(/<strong>(\d{4}-\d{2}-\d{2})<\/strong>/g)];
  assert.equal(renderedDates.length, 7);

  const fewerThanSeven = render(recentDaysOfHistory(3));
  assert.doesNotMatch(fewerThanSeven, /history-grid-toggle-row/);
});

test('collapse is a pure display concern: underlying history data and stats are unaffected', () => {
  const html = render(recentDaysOfHistory(10));
  // The trend chart and stats section use the full range-filtered history, not the
  // collapsed grid subset — these unrelated sections must still render normally.
  assert.match(html, /淨資產趨勢/);
  assert.match(html, /今日增加/);
});

test('empty history keeps its existing empty-state message, unaffected by the collapse feature', () => {
  const html = render([]);
  assert.match(html, /尚無淨資產歷史資料/);
  assert.doesNotMatch(html, /history-grid-toggle-row/);
});

test('renders without a history prop at all (optional prop contract preserved)', () => {
  const html = render(undefined);
  assert.match(html, /尚無淨資產歷史資料/);
});

test('read-time consumer presentation distinguishes no snapshot, data insufficient, and valid zero', () => {
  const empty = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(NetWorthHistoryPage, {
    snapshotView: createNetWorthSnapshotReadTimeView(undefined)
  })));
  const partial = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(NetWorthHistoryPage, {
    snapshotView: createNetWorthSnapshotReadTimeView([{ date: '2026-01-01', totalAssets: 0, netWorth: 0, investmentValue: 0, cash: undefined, debt: 0 }])
  })));

  assert.match(empty, /尚無資料/);
  assert.match(partial, /資料不足/);
  assert.match(partial, /0 萬元/);
  assert.doesNotMatch(partial, /NaN|Infinity/);
});
