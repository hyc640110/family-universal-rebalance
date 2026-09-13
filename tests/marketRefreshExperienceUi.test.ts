import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { MARKET_REFRESH_INTERVAL_MS } from '../src/lib/marketRefreshExperience';
import { useMarketAutoRefresh } from '../src/lib/useMarketAutoRefresh';
import type { MarketSnapshot } from '../src/lib/marketData';

const dom = new JSDOM('<html><body></body></html>', { pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
const React = await import('react');
Object.assign(globalThis, { React });
const { createRoot } = await import('react-dom/client');
const { renderToStaticMarkup } = await import('react-dom/server');
const { default: MarketIntelligencePage } = await import('../src/pages/MarketIntelligencePage');

test('market checks are throttled, stop off-page/hidden, resume when visible, and clean up', async t => {
  let now = Date.parse('2026-09-13T10:00:00Z');
  let visibility = 'visible';
  let tick = () => {};
  let calls = 0;
  let cleared = 0;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'setInterval', (callback: () => void) => { tick = callback; return 1 as unknown as ReturnType<typeof setInterval>; });
  t.mock.method(globalThis, 'clearInterval', () => { cleared++; });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  function Harness({ active }: { active: boolean }) {
    const [last, setLast] = React.useState<number | null>(null);
    useMarketAutoRefresh(active, last, () => { calls++; setLast(now); });
    return null;
  }
  const root = createRoot(document.createElement('div'));
  await React.act(async () => { root.render(React.createElement(Harness, { active: true })); });
  assert.equal(calls, 1);
  await React.act(async () => { tick(); });
  assert.equal(calls, 1);
  visibility = 'hidden'; now += MARKET_REFRESH_INTERVAL_MS;
  await React.act(async () => { tick(); });
  assert.equal(calls, 1);
  visibility = 'visible';
  await React.act(async () => { document.dispatchEvent(new dom.window.Event('visibilitychange')); });
  assert.equal(calls, 2);
  await React.act(async () => { root.render(React.createElement(Harness, { active: false })); });
  assert.equal(cleared, 1);
  now += MARKET_REFRESH_INTERVAL_MS;
  await React.act(async () => { document.dispatchEvent(new dom.window.Event('visibilitychange')); });
  assert.equal(calls, 2);
  await React.act(async () => { root.render(React.createElement(Harness, { active: true })); });
  assert.equal(calls, 3);
  await React.act(async () => { root.unmount(); });
  assert.equal(cleared, 2);
});

test('page distinguishes attempted query, service confirmation and dated source data without crashing on unknown dates', () => {
  const snapshot: MarketSnapshot = { fetchedAt: '2026-09-13T10:00:00Z', status: 'recent-effective', items: [
    { id: 'taiex', group: 'taiwan', name: '台灣加權指數', value: 23000, change: 0, changePct: 0, asOf: 'broken', fetchedAt: null, source: 'TWSE', status: 'closed' },
  ] };
  const html = renderToStaticMarkup(React.createElement(MarketIntelligencePage, { snapshot, isRefreshing: true, lastAttemptAt: Date.parse('2026-09-13T10:01:00Z'), refreshMessage: '本次重新取得失敗，沿用前次資料', onRefresh: () => {} }));
  assert.match(html, /最後查詢時間/);
  assert.match(html, /最近服務確認時間/);
  assert.match(html, /資料時間待確認/);
  assert.match(html, /15 分鐘/);
  assert.match(html, /disabled/);
  const settled = renderToStaticMarkup(React.createElement(MarketIntelligencePage, { snapshot, isRefreshing: false, lastAttemptAt: null, refreshMessage: '本次重新取得失敗，沿用前次資料', onRefresh: () => {} }));
  assert.match(settled, /沿用前次資料/);
  assert.match(settled, /尚未查詢/);
});
