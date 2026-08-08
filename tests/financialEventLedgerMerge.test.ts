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
