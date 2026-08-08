import assert from 'node:assert/strict';
import test from 'node:test';
import type { FinancialEvent } from '../src/lib/financialEvents';
import { buildVoidEvent, voidFinancialEventAndAppend } from '../src/lib/financialEventVoid';

const audit = { createdAt: '2026-08-08T00:00:00.000Z', updatedAt: '2026-08-08T00:00:00.000Z' };
const now = '2026-08-08T12:00:00.000Z';

function event(overrides: Partial<FinancialEvent> = {}): FinancialEvent {
  return {
    id: 'event-1', type: 'external-income', status: 'posted', source: 'attribution-confirmation',
    effectiveDate: '2026-08-05', amount: 30_000, currency: 'TWD', accountId: 'bank-a',
    transactionId: 'income-1', note: '', ...audit, ...overrides
  };
}

test('buildVoidEvent 依既有事件產生合法 posted／void／adjustment 標記事件', () => {
  const target = event();
  const result = buildVoidEvent([target], { eventId: 'event-1', now });

  assert.equal(result.rejected, false);
  if (!result.rejected) {
    assert.equal(result.event.type, 'adjustment', '標記事件應沿用既有零貢獻分類，本身不需要新的計算層特例');
    assert.equal(result.event.status, 'posted');
    assert.equal(result.event.source, 'void');
    assert.equal(result.event.voidedEventId, 'event-1');
    assert.equal(result.event.accountId, target.accountId, '沿用原事件帳戶供稽核追蹤');
    assert.equal(result.event.amount, target.amount);
    assert.equal(result.event.currency, target.currency);
    assert.equal(result.event.effectiveDate, '2026-08-08', '作廢事件的 effectiveDate 是作廢當下，不是原事件日期');
    assert.notEqual(result.event.id, target.id, '必須是全新 id，不得複用原事件 id');
  }
});

test('作廢不存在的事件 id 時明確拒絕，不靜默略過', () => {
  const result = buildVoidEvent([event()], { eventId: 'does-not-exist', now });
  assert.equal(result.rejected, true);
  if (result.rejected) assert.match(result.reason, /找不到/);
});

test('重複作廢已經作廢過的事件時明確拒絕', () => {
  const target = event();
  const voidMarker = event({ id: 'void-1', type: 'adjustment', source: 'void', voidedEventId: 'event-1' });
  const result = buildVoidEvent([target, voidMarker], { eventId: 'event-1', now });
  assert.equal(result.rejected, true);
  if (result.rejected) assert.match(result.reason, /已經撤銷過/);
});

test('voidFinancialEventAndAppend 成功時回傳 append 後的事件陣列與新建立的標記事件', () => {
  const target = event();
  const result = voidFinancialEventAndAppend([target], { eventId: 'event-1', now });
  assert.equal(result.rejected, false);
  if (!result.rejected) {
    assert.equal(result.events.length, 2);
    assert.deepEqual(result.events[0], target, '原事件本身完全不受影響（forward-only：從不修改既有事件）');
    assert.equal(result.events[1]?.source, 'void');
    assert.equal(result.event.source, 'void');
    assert.equal(result.event.voidedEventId, 'event-1');
  }
});

test('voidFinancialEventAndAppend 拒絕時不回傳 events 或 event', () => {
  const result = voidFinancialEventAndAppend([event()], { eventId: 'does-not-exist', now });
  assert.equal(result.rejected, true);
  if (result.rejected) {
    assert.equal('events' in result, false);
    assert.equal('event' in result, false);
  }
});
