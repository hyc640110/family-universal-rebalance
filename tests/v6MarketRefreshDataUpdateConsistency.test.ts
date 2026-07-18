import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { marketContentSignature, marketRefreshMessage, marketRefreshOutcome } from '../src/lib/dataRefresh';
import { mergeMarketSnapshot, type MarketSnapshot } from '../src/lib/marketData';
import { MARKET_SECTION_REGISTRY, visibleMarketSnapshot } from '../src/lib/marketSections';

const point = (id: string, group: 'taiwan' | 'global' | 'treasury' | 'event', value: number | null, status = 'recent-effective') => ({ id, group, name: id, value, change: value === null ? null : 1, changePct: value === null ? null : .01, asOf: '2026-07-18T08:00:00+08:00', fetchedAt: '2026-07-18T01:00:00.000Z', source: 'test', status }) as const;
const snapshot = (patch: Partial<MarketSnapshot> = {}): MarketSnapshot => ({ fetchedAt: '2026-07-18T01:00:00.000Z', status: 'recent-effective', items: [point('taiex', 'taiwan', 23000), point('ust-10y', 'treasury', 4.5)], ...patch });

test('updated and unchanged refresh acknowledgement separates market content from service confirmation time', () => {
  const previous = snapshot(); const sameContent = snapshot({ fetchedAt: '2026-07-18T01:05:00.000Z' });
  assert.equal(marketRefreshOutcome(marketContentSignature(previous), sameContent), 'unchanged');
  assert.match(marketRefreshMessage('unchanged', sameContent.fetchedAt, value => value), /已重新取得市場資料；目前市場內容沒有變化。/);
  assert.match(marketRefreshMessage('unchanged', sameContent.fetchedAt, value => value), /本次服務確認時間：/);
  const changed = snapshot({ items: [point('taiex', 'taiwan', 23001), point('ust-10y', 'treasury', 4.5)] });
  assert.equal(marketRefreshOutcome(marketContentSignature(previous), changed), 'updated');
  assert.match(marketRefreshMessage('updated', changed.fetchedAt, value => value), /資料內容已更新/);
});

test('partial and failed refresh preserve previous usable data without fabricating zero', () => {
  const previous = snapshot(); const incoming = snapshot({ fetchedAt: '2026-07-18T01:05:00.000Z', items: [point('taiex', 'taiwan', null, 'unavailable'), point('ust-10y', 'treasury', null, 'failed')] });
  const merged = mergeMarketSnapshot(previous, incoming);
  assert.equal(merged.incomplete, true); assert.equal(merged.snapshot.items[0]?.value, 23000); assert.equal(merged.snapshot.items[1]?.value, 4.5);
  assert.match(marketRefreshMessage('partial', merged.snapshot.fetchedAt, value => value, '沿用前次：taiwan、treasury'), /部分市場資料更新失敗，已保留先前可用資料/);
  assert.match(marketRefreshMessage('failed', null, value => value), /已保留目前可用資料/);
});

test('market refresh UI keeps asOf and fetchedAt semantics distinct and remains guarded against overlap', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/pages/MarketIntelligencePage.tsx', import.meta.url), 'utf8');
  assert.match(app, /marketRefreshInFlightRef\.current/);
  assert.match(app, /fetchMarketSnapshot\(marketWorkerUrl, \{ manual \}\)/);
  assert.match(page, /市場資料時間/); assert.match(page, /本次服務確認時間/); assert.match(page, /並非市場成交時間/);
});

test('hidden global and event sections remain absent without mutating input snapshots', () => {
  const input = snapshot({ items: [...snapshot().items, point('sp500', 'global', 6000), point('event', 'event', 1)] });
  const visible = visibleMarketSnapshot(input);
  assert.deepEqual(visible.items.map(item => item.id), ['taiex', 'ust-10y']);
  assert.equal(input.items.length, 4); assert.equal(MARKET_SECTION_REGISTRY.global.enabled, false); assert.equal(MARKET_SECTION_REGISTRY.event.enabled, false);
});
