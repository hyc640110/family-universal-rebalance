import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { MARKET_REFRESH_INTERVAL_MS, shouldRefreshMarket, marketDateAge, safeMarketTime } from '../src/lib/marketRefreshExperience';
import { marketRefreshOutcome } from '../src/lib/dataRefresh';

test('a service timestamp with no usable data is not reported as updated', () => {
  const empty = { fetchedAt: '2026-09-13T15:00:00Z', status: 'recent-effective', items: [] };
  assert.equal(marketRefreshOutcome(null, empty), 'failed');
  assert.equal(marketRefreshOutcome(null, { ...empty, items: [{ id: 'taiex', value: null, change: null, changePct: null, asOf: null, status: 'unavailable' }] }), 'failed');
});

test('automatic refresh is due initially and after 15 minutes, not on rapid navigation', () => {
  const now = Date.parse('2026-09-13T15:00:00Z');
  assert.equal(shouldRefreshMarket(null, now), true);
  assert.equal(shouldRefreshMarket(now, now), false);
  assert.equal(shouldRefreshMarket(now - MARKET_REFRESH_INTERVAL_MS + 1, now), false);
  assert.equal(shouldRefreshMarket(now - MARKET_REFRESH_INTERVAL_MS, now), true);
  assert.equal(shouldRefreshMarket(now + 1, now), true);
});

test('source age uses calendar dates, not query time, and does not call a weekend close expired', () => {
  const sunday = Date.parse('2026-09-13T15:00:00Z');
  assert.deepEqual(marketDateAge('2026-09-11T08:00:00+08:00', sunday), { text: '資料日期距今 2 天', attention: false });
  assert.equal(marketDateAge('2026-09-13T00:00:00+08:00', sunday).text, '今日資料');
  assert.equal(marketDateAge('2026-09-05T08:00:00+08:00', sunday).attention, true);
  for (const date of [null, '', 'broken', '2026-09-15T00:00:00Z']) {
    assert.deepEqual(marketDateAge(date, sunday), { text: '資料時間待確認', attention: true });
  }
  assert.equal(safeMarketTime('broken'), '—');
  assert.equal(safeMarketTime(null), '—');
});

test('App wires market-only automatic checks and displays feedback for automatic failures too', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /useMarketAutoRefresh\(currentPage === 'market', marketLastAttemptAt/);
  assert.match(app, /lastAttemptAt=\{marketLastAttemptAt\}/);
  assert.doesNotMatch(app, /if \(manual\) setMarketRefreshStatus/);
});
