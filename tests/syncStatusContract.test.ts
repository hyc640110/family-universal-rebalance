import assert from 'node:assert/strict';
import test from 'node:test';
import { describeRuntimeSyncStatus, runtimeStatusForLedgerMergeRejection, type RuntimeSyncStatus } from '../src/lib/syncStatus';

const runtimeFacts = {
  writerSchemaVersion: 3,
  supportedSchemaVersions: [1, 2, 3]
};

test('schema mismatch 以當前 runtime writer 與 supported schema set 動態呈現', () => {
  const text = describeRuntimeSyncStatus({
    kind: 'schema-version-mismatch',
    observedLocalSchema: 1,
    observedRemoteSchema: 2
  }, runtimeFacts);

  assert.match(text, /本機 Ledger：v1/);
  assert.match(text, /Firebase Ledger：v2/);
  assert.match(text, /目前 App writer：v3/);
  assert.match(text, /本 App 支援：v1 \/ v2 \/ v3/);
  assert.match(text, /未上傳、未下載、未覆寫任何 Ledger/);
  assert.doesNotMatch(text, /目前支援 v3|唯一支援/);
});

test('runtime status 區分 progress、transport error 與 stale persisted failure', () => {
  const cases: Array<[RuntimeSyncStatus, RegExp]> = [
    [{ kind: 'progress', operation: 'upload' }, /雲端上傳中/],
    [{ kind: 'firebase-transport-error', operation: 'download', message: 'Firebase 503' }, /Firebase 503/],
    [{ kind: 'stale-persisted-failure' }, /上一次同步嘗試結果已過期/]
  ];

  for (const [status, expected] of cases) {
    assert.match(describeRuntimeSyncStatus(status, runtimeFacts), expected);
  }
});

test('Ledger reject reason 映射為實際 runtime status，而非以 error 文字推斷', () => {
  const schemaMismatch = runtimeStatusForLedgerMergeRejection('schema-version-mismatch', 1, 2);
  assert.equal(schemaMismatch.kind, 'schema-version-mismatch');
  assert.match(describeRuntimeSyncStatus(schemaMismatch, runtimeFacts), /本機 Ledger：v1/);

  const unsupported = runtimeStatusForLedgerMergeRejection('unsupported-future-schema', 3, 4);
  assert.equal(unsupported.kind, 'unsupported-future-schema');

  const collision = runtimeStatusForLedgerMergeRejection('event-id-collision', 3, 3);
  assert.equal(collision.kind, 'event-id-collision');
  const text = describeRuntimeSyncStatus(collision, runtimeFacts);
  assert.match(text, /相同事件 ID.*事件內容不同/);
  assert.match(text, /未上傳、未下載、未覆寫任何 Ledger/);
  assert.doesNotMatch(text, /兩端 Ledger schema 不同|本機 Ledger：v3/);
});
