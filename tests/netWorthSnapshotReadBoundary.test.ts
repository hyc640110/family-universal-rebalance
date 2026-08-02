import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { canonicalSyncPayload } from '../src/lib/syncState';
import { normalizeNetWorthHistory } from '../src/lib/netWorthHistory';
import {
  createNetWorthSnapshotReadTimeView,
  createNetWorthSnapshotReadTimeViewFromState,
  createNetWorthSnapshotConsumerRows,
  toCompleteNetWorthSnapshots
} from '../src/lib/netWorthSnapshotReadBoundary';

const completeFields = {
  totalAssets: 1000,
  netWorth: 900,
  investmentValue: 700,
  cash: 200,
  debt: 100
};

test('read-time view distinguishes no snapshot from an incomplete snapshot', () => {
  assert.deepEqual(createNetWorthSnapshotReadTimeView(undefined), {
    status: 'no-snapshot',
    rows: []
  });
  assert.equal(createNetWorthSnapshotReadTimeView([]).status, 'no-snapshot');

  const view = createNetWorthSnapshotReadTimeView([{ date: '2026-01-01', ...completeFields, cash: undefined }]);
  assert.equal(view.status, 'has-snapshot');
  assert.equal(view.rows.length, 1);
  assert.equal(view.rows[0].status, 'incomplete');
  assert.equal(view.rows[0].fields.cash.status, 'missing');
});

test('read-time view preserves a row and distinguishes valid 0 from missing', () => {
  const rawRow = { date: '2026-01-01', ...completeFields, netWorth: 0, cash: undefined };
  const view = createNetWorthSnapshotReadTimeView([rawRow]);

  assert.equal(view.rows.length, 1);
  assert.deepEqual(view.rows[0].fields.netWorth, { status: 'valid', value: 0 });
  assert.deepEqual(view.rows[0].fields.cash, { status: 'missing' });
  assert.equal(view.rows[0].raw.netWorth, 0);
  assert.equal('cash' in view.rows[0].raw, true);
  assert.equal(view.rows[0].raw.cash, undefined);
});

test('invalid and non-finite fields stay classified and are never converted to 0', () => {
  const rawRow = { date: '2026-01-01', ...completeFields, cash: 'not-a-number', debt: Number.POSITIVE_INFINITY };
  const view = createNetWorthSnapshotReadTimeView([rawRow]);

  assert.deepEqual(view.rows[0].fields.cash, { status: 'invalid', rawValue: 'not-a-number' });
  assert.deepEqual(view.rows[0].fields.debt, { status: 'non-finite', rawValue: Infinity });
  assert.notEqual(view.rows[0].fields.cash.status === 'valid' ? view.rows[0].fields.cash.value : undefined, 0);
  assert.equal(view.rows[0].raw.cash, 'not-a-number');
  assert.equal(view.rows[0].raw.debt, Infinity);
});

test('localStorage-shaped raw state is classified before legacy lenient normalization', () => {
  const rawState = JSON.parse(
    '{"netWorthHistory":[{"date":"2026-01-01","totalAssets":1000,"netWorth":"bad","investmentValue":700,"cash":null,"debt":900}]}'
  );
  const view = createNetWorthSnapshotReadTimeViewFromState(rawState);
  const legacyState = normalizeNetWorthHistory(rawState.netWorthHistory);

  assert.equal(view.rows.length, 1);
  assert.equal(view.rows[0].fields.netWorth.status, 'invalid');
  assert.equal(view.rows[0].fields.cash.status, 'missing');
  assert.equal(view.rows[0].raw.netWorth, 'bad');
  assert.equal(view.rows[0].raw.cash, null);
  assert.equal(legacyState[0].netWorth, 0);
  assert.equal(legacyState[0].cash, 0);
});

test('Firebase and Backup-shaped payloads can share the same read-time boundary without schema changes', () => {
  const rawPayload = {
    netWorthHistory: [{ date: '2026-01-01', ...completeFields, investmentValue: 'not-a-number' }]
  };
  const firebasePayload = canonicalSyncPayload(rawPayload as never);
  const firebaseView = createNetWorthSnapshotReadTimeViewFromState(firebasePayload);
  const backupView = createNetWorthSnapshotReadTimeViewFromState(JSON.parse(JSON.stringify(rawPayload)));

  assert.equal(firebaseView.rows.length, 1);
  assert.equal(firebaseView.rows[0].fields.investmentValue.status, 'invalid');
  assert.equal(backupView.rows[0].fields.investmentValue.status, 'invalid');
  assert.equal(firebaseView.rows[0].raw.investmentValue, 'not-a-number');
  assert.equal(backupView.rows[0].raw.investmentValue, 'not-a-number');
});

test('consumer projection retains partial rows while keeping independent fields available', () => {
  const view = createNetWorthSnapshotReadTimeView([
    { date: '2026-01-01', ...completeFields, netWorth: 0, cash: undefined },
    { date: '2026-01-02', ...completeFields, netWorth: 'bad', investmentValue: Number.POSITIVE_INFINITY }
  ]);
  const rows = createNetWorthSnapshotConsumerRows(view);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].netWorth, 0);
  assert.equal(rows[0].cash, null);
  assert.equal(rows[0].status, 'incomplete');
  assert.equal(rows[1].netWorth, null);
  assert.equal(rows[1].investmentValue, null);
  assert.equal(rows[1].totalAssets, completeFields.totalAssets);
  assert.equal(toCompleteNetWorthSnapshots(rows).length, 0);
});

test('consumer projection keeps final same-day occurrence without changing the raw view', () => {
  const view = createNetWorthSnapshotReadTimeView([
    { date: '2026-01-01', ...completeFields, netWorth: 100 },
    { date: '2026-01-01', ...completeFields, netWorth: 200 }
  ]);
  const rows = createNetWorthSnapshotConsumerRows(view);

  assert.equal(view.rows.length, 2);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].netWorth, 200);
});

test('App captures the localStorage raw view before legacy normalization', () => {
  const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const readBoundaryIndex = appSource.indexOf('const netWorthSnapshotReadTimeView = createNetWorthSnapshotReadTimeViewFromState(parsed);');
  const legacyNormalizationIndex = appSource.indexOf('const normalized = normalizeState(parsed);');

  assert.ok(readBoundaryIndex >= 0);
  assert.ok(legacyNormalizationIndex >= 0);
  assert.ok(readBoundaryIndex < legacyNormalizationIndex);
});
