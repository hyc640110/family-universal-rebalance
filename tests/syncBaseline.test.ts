import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('P3-B3-A keeps legacy sync metadata readable while canonical output omits retired cloud fields', () => {
  assert.match(app, /syncMeta: sanitizeSyncMeta\(s\.syncMeta, normalizedCore\)/);
  assert.match(app, /syncMeta: withoutRetiredCloudSyncMetadata\(withoutRuntimeSyncStatus\(withoutSyncBaseline\(normalized\.syncMeta\)\)\)/);
  assert.doesNotMatch(app, /deriveSyncBaselineDiagnostics|hasSyncableStateChanged|baselineFingerprint: uploadedSnapshot/);
});

test('P3-B3-A keeps JSON Backup legacy read compatibility without re-exporting cloud-sync metadata', () => {
  assert.match(app, /syncSettings: \{ refreshSec: normalized\.refreshSec \}/);
  assert.doesNotMatch(app, /syncSettings: \{[^}]*firebase:/);
  assert.doesNotMatch(app, /syncSettings: \{[^}]*autoSync:/);
  assert.doesNotMatch(app, /syncSettings: \{[^}]*workerUrl:/);
  assert.match(app, /const firebase = syncSettings\.firebase \|\| r\.firebase/);
  assert.doesNotMatch(app, /const firebase = syncSettings\.firebase \|\| r\.firebase \|\| current\.firebase/);
  assert.doesNotMatch(app, /fetchRemoteFinancialEventLedger|uploadFirebaseStateWithLedgerMerge|stateFromFirebasePayload/);
});
