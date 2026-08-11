import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('cold startup does not start Firebase Auth, while manual sync obtains it on demand', () => {
  assert.doesNotMatch(app, /useEffect\(\(\) => \{ ensureFirebaseAuthSessionFresh\(\)\.catch\(\(\) => \{\}\); \}, \[\]\);/);
  assert.match(app, /status: 'idle', session: null, errorMessage: null/);
  assert.match(app, /僅在手動同步時建立／更新匿名身分/);

  const upload = app.slice(app.indexOf('const uploadCloud = async () =>'), app.indexOf('const downloadCloud = async () =>'));
  const download = app.slice(app.indexOf('const downloadCloud = async () =>'), app.indexOf('useEffect(() => { refreshQuotes(); }, []);'));
  const authBoundary = app.slice(app.indexOf('const ensureFirebaseAuthSessionFresh = async'), app.indexOf('if (!firebaseAuthSingleFlightRef.current)'));
  assert.match(upload, /const session = await ensureFirebaseAuthSessionOnDemand\(\);/);
  assert.match(download, /if \(!window\.confirm[\s\S]*?\) return;\s*const session = await ensureFirebaseAuthSessionOnDemand\(\);/);
  assert.match(upload, /fetchRemoteFinancialEventLedger[\s\S]*?await flushDrafts\(\)[\s\S]*?uploadFirebaseStateWithLedgerMerge/);
  assert.match(download, /await downloadFirebase\(state\.firebase, stateRef\.current, session\.uid, session\.idToken\)/);
  assert.doesNotMatch(authBoundary, /writeState\(|setState\(|updateSyncMeta|updateRemoteMeta|financialEvents/);
});
