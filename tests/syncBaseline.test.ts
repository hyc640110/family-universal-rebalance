import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('P2-A leaves legacy sync metadata readable without using a Firebase baseline at runtime', () => {
  assert.match(app, /syncMeta: sanitizeSyncMeta\(s\.syncMeta, normalizedCore\)/);
  assert.match(app, /syncMeta: withoutRuntimeSyncStatus\(withoutSyncBaseline\(normalized\.syncMeta\)\)/);
  assert.doesNotMatch(app, /deriveSyncBaselineDiagnostics|hasSyncableStateChanged|baselineFingerprint: uploadedSnapshot/);
});

test('P3-B1 keeps JSON Backup legacy read compatibility without falling back to current Firebase config', () => {
  assert.match(app, /syncSettings: \{ refreshSec: normalized\.refreshSec, autoSync: normalized\.autoSync, autoSyncSec: normalized\.autoSyncSec, workerUrl: DEFAULT_WORKER_URL, firebase: normalized\.firebase/);
  assert.match(app, /const firebase = syncSettings\.firebase \|\| r\.firebase/);
  assert.doesNotMatch(app, /const firebase = syncSettings\.firebase \|\| r\.firebase \|\| current\.firebase/);
  assert.doesNotMatch(app, /fetchRemoteFinancialEventLedger|uploadFirebaseStateWithLedgerMerge|stateFromFirebasePayload/);
});
