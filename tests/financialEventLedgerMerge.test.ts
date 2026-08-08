import assert from 'node:assert/strict';
import test from 'node:test';
import { FINANCIAL_EVENT_SCHEMA_VERSION, mergeFinancialEventLedgers } from '../src/lib/financialEvents';
import type { FinancialEvent } from '../src/lib/financialEvents';

const event = (overrides: Partial<FinancialEvent> = {}): FinancialEvent => ({
  id: 'event-1', type: 'external-income', status: 'posted', source: 'manual',
  effectiveDate: '2026-08-01', amount: 1000, currency: 'TWD', accountId: 'acc-1',
  note: '', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides
});

test('merges two disjoint Ledgers into their union', () => {
  const local = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [event({ id: 'local-1' })] };
  const remote = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [event({ id: 'remote-1' })] };
  const outcome = mergeFinancialEventLedgers(local, remote);
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.events.map(item => item.id).sort(), ['local-1', 'remote-1']);
});

test('a shared id (forward-only contract: should always be byte-identical) collapses to one entry, not two', () => {
  const shared = event({ id: 'shared-1' });
  const local = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [shared] };
  const remote = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [shared] };
  const outcome = mergeFinancialEventLedgers(local, remote);
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.equal(outcome.events.length, 1);
  assert.equal(outcome.events[0].id, 'shared-1');
});

test('local-only side empty: remote events all survive untouched', () => {
  const local = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [] };
  const remote = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [event({ id: 'remote-1' }), event({ id: 'remote-2' })] };
  const outcome = mergeFinancialEventLedgers(local, remote);
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.events.map(item => item.id).sort(), ['remote-1', 'remote-2']);
});

test('both sides empty: merge stays empty, not an error', () => {
  const outcome = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [] },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [] }
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.events, []);
});

test('either side on an unsupported schema version refuses to merge, naming both versions in the reason', () => {
  const local = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [event()] };
  const remoteOpaque = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION + 1, events: [{ opaque: true } as unknown as FinancialEvent] };
  const outcome = mergeFinancialEventLedgers(local, remoteOpaque);
  assert.equal(outcome.ok, false);
  if (outcome.ok) return;
  assert.match(outcome.reason, new RegExp(`v${FINANCIAL_EVENT_SCHEMA_VERSION}`));
  assert.match(outcome.reason, new RegExp(`v${FINANCIAL_EVENT_SCHEMA_VERSION + 1}`));
});

test('local side on an unsupported schema version also refuses (not just the remote side)', () => {
  const localOpaque = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION + 1, events: [{ opaque: true } as unknown as FinancialEvent] };
  const remote = { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [event()] };
  const outcome = mergeFinancialEventLedgers(localOpaque, remote);
  assert.equal(outcome.ok, false);
});

test('output order is deterministic regardless of which side supplied which events', () => {
  const a = event({ id: 'aaa', createdAt: '2026-08-01T00:00:00.000Z' });
  const b = event({ id: 'bbb', createdAt: '2026-08-02T00:00:00.000Z' });
  const c = event({ id: 'ccc', createdAt: '2026-08-03T00:00:00.000Z' });

  const forward = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [a] },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [b, c] }
  );
  const swapped = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [c, b] },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [a] }
  );
  assert.equal(forward.ok, true);
  assert.equal(swapped.ok, true);
  if (!forward.ok || !swapped.ok) return;
  assert.deepEqual(forward.events.map(item => item.id), ['aaa', 'bbb', 'ccc']);
  assert.deepEqual(forward.events.map(item => item.id), swapped.events.map(item => item.id));
});

test('output is sorted by createdAt, not by insertion order, so the sync fingerprint never flips between identical merges', () => {
  const later = event({ id: 'later', createdAt: '2026-08-05T00:00:00.000Z' });
  const earlier = event({ id: 'earlier', createdAt: '2026-08-01T00:00:00.000Z' });
  const outcome = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [later] },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [earlier] }
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.events.map(item => item.id), ['earlier', 'later']);
});

// UR-TODO-046 void: a void marker is structurally just another FinancialEvent, so the existing
// union-by-id merge needs no changes to handle it correctly.
test('一裝置作廢的事件標記，與另一裝置獨有的原始事件合併後兩者皆保留', () => {
  const original = event({ id: 'original-1' });
  const voidMarker = event({ id: 'void-1', type: 'adjustment', source: 'void', voidedEventId: 'original-1', createdAt: '2026-08-02T00:00:00.000Z' });
  const outcome = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [original, voidMarker] },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [] }
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.events.map(item => item.id).sort(), ['original-1', 'void-1']);
});

test('雙邊各自新增同一筆事件的作廢標記（相同 id，理論上應逐位元組相同）時合併不重複計入', () => {
  const original = event({ id: 'original-1' });
  const voidMarker = event({ id: 'void-1', type: 'adjustment', source: 'void', voidedEventId: 'original-1' });
  const outcome = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [original, voidMarker] },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [original, voidMarker] }
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.events.map(item => item.id).sort(), ['original-1', 'void-1']);
});

test('作廢標記一旦存在於任一裝置，聯集合併保證它永遠不會在後續合併中消失（結構上不可能「復活」）', () => {
  const original = event({ id: 'original-1' });
  const voidMarker = event({ id: 'void-1', type: 'adjustment', source: 'void', voidedEventId: 'original-1' });
  // Round 1: device A (which has the void marker) merges with device B (which doesn't yet).
  const roundOne = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [original, voidMarker] },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [original] }
  );
  assert.equal(roundOne.ok, true);
  if (!roundOne.ok) return;
  // Round 2: a hypothetical third device that still only has the original, pre-void state, merges in.
  const roundTwo = mergeFinancialEventLedgers(
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: roundOne.events },
    { schemaVersion: FINANCIAL_EVENT_SCHEMA_VERSION, events: [original] }
  );
  assert.equal(roundTwo.ok, true);
  if (!roundTwo.ok) return;
  assert.deepEqual(roundTwo.events.map(item => item.id).sort(), ['original-1', 'void-1'], '聯集合併從不移除元素，作廢標記不可能被「合併掉」');
});
