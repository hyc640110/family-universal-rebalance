import assert from 'node:assert/strict';
import test from 'node:test';
import { describeRuntimeSyncStatus, type RuntimeSyncStatus } from '../src/lib/syncStatus';

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
