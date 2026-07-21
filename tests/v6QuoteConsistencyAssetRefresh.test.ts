import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { describeQuotePresentation } from '../src/lib/quotePresentation';
import { createAssetsPullToRefresh } from '../src/lib/assetsPullToRefresh';

const now = new Date('2026-07-21T06:00:00.000Z');

test('worker quote presentation separates market time from local receipt time', () => {
  const result = describeQuotePresentation({
    source: 'Yahoo Finance via Cloudflare Worker',
    quoteDate: '2026-07-21',
    quoteTime: '13:30:01',
    updatedAt: '2026-07-21T05:31:00.000Z',
  }, now);

  assert.equal(result.freshness, 'today');
  assert.equal(result.sourceKind, 'worker');
  assert.equal(result.marketTimestamp, '2026-07-21 13:30:01');
  assert.equal(result.receiptTimestamp, '2026-07-21T05:31:00.000Z');
  assert.equal(result.isFallback, false);
  assert.equal(result.isPreserved, false);
});

test('retained quote after refresh failure is not presented as live worker data', () => {
  const result = describeQuotePresentation({
    source: 'Yahoo Finance via Cloudflare Worker / 更新失敗',
    quoteDate: '2026-07-17',
    quoteTime: '13:30:00',
    updatedAt: '2026-07-17T05:30:00.000Z',
    error: 'HTTP 429',
  }, new Date('2026-07-18T06:00:00.000Z'));

  assert.equal(result.freshness, 'recent-trading-day');
  assert.equal(result.sourceKind, 'preserved');
  assert.equal(result.isFallback, true);
  assert.equal(result.isPreserved, true);
  assert.match(result.statusLabel, /已保留前次有效報價/);
});

test('average-cost fallback never claims a market timestamp or today freshness', () => {
  const result = describeQuotePresentation({
    source: '成交均價備援',
    updatedAt: '2026-07-21T05:31:00.000Z',
  }, now);

  assert.equal(result.freshness, 'unknown');
  assert.equal(result.sourceKind, 'average-cost');
  assert.equal(result.isFallback, true);
  assert.equal(result.marketTimestamp, null);
  assert.match(result.statusLabel, /成交均價備援/);
});

test('Assets refresh control delegates to the existing App quote controller without a second fetch or quote state', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const sectionStart = app.indexOf('title="持股資產管理"');
  const sectionEnd = app.indexOf('title="帳戶管理"', sectionStart);
  const section = app.slice(sectionStart, sectionEnd);

  assert.match(section, /action=\{<button[^>]+onClick=\{\(\) => \{ void refreshQuotes\(true\); \}\}/);
  assert.match(section, /disabled=\{isRefreshingQuotes\}/);
  assert.match(section, /更新股價/);
  assert.match(section, /quotePresentation/);
  assert.doesNotMatch(section, /fetch\(/);
  assert.doesNotMatch(section, /useState<Record<.*Quote/);
});

test('Assets pull-to-refresh only fires once after a top-of-page threshold release', () => {
  let refreshed = 0;
  const gesture = createAssetsPullToRefresh({ threshold: 72, onRefresh: () => { refreshed += 1; } });
  gesture.start({ pageTop: false, clientY: 10, isRefreshing: false });
  gesture.move(120);
  gesture.end(false);
  assert.equal(refreshed, 0);

  gesture.start({ pageTop: true, clientY: 10, isRefreshing: false });
  gesture.move(70);
  gesture.end(false);
  assert.equal(refreshed, 0);

  gesture.start({ pageTop: true, clientY: 10, isRefreshing: false });
  gesture.move(82);
  gesture.end(false);
  gesture.end(false);
  assert.equal(refreshed, 1);

  gesture.start({ pageTop: true, clientY: 10, isRefreshing: true });
  gesture.move(120);
  gesture.end(true);
  assert.equal(refreshed, 1);
});
