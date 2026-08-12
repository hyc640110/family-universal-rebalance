import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const appInfo = readFileSync(new URL('../src/constants/appInfo.ts', import.meta.url), 'utf8');
const productionEnv = readFileSync(new URL('../.env.production', import.meta.url), 'utf8');
const previewEnv = readFileSync(new URL('../.env.preview-deploy', import.meta.url), 'utf8');

test('Firebase retirement guard blocks Auth／RTDB runtime modules and network wiring', () => {
  for (const moduleUrl of [
    new URL('../src/lib/firebaseAnonymousAuth.ts', import.meta.url),
    new URL('../src/lib/firebaseSyncUrl.ts', import.meta.url)
  ]) assert.equal(existsSync(fileURLToPath(moduleUrl)), false, `${moduleUrl.pathname} must be removed`);

  for (const activeCaller of [
    'ensureFirebaseAuthSessionOnDemand',
    'createFirebaseAnonymousSessionSingleFlight',
    'uploadCloud',
    'downloadCloud',
    'uploadFirebaseStateWithLedgerMerge',
    'fetchRemoteFinancialEventLedger',
    'downloadFirebase',
    'buildFirebaseSyncUrl',
    'buildFirebaseSyncRoot'
  ]) assert.doesNotMatch(app, new RegExp(`\\b${activeCaller}\\b`));

  assert.doesNotMatch(appInfo, /FIREBASE_API_KEY|FIREBASE_AUTH_SESSION_STORAGE_KEY/);
  assert.doesNotMatch(productionEnv, /^VITE_FIREBASE_API_KEY=/m);
  assert.doesNotMatch(previewEnv, /^VITE_FIREBASE_API_KEY=/m);
  assert.match(productionEnv, /^VITE_DEPLOYMENT_SCOPE=/m);
  assert.match(previewEnv, /^VITE_DEPLOYMENT_SCOPE=/m);
  assert.doesNotMatch(app, /Identity Toolkit|Secure Token|匿名身分|上傳雲端|下載雲端/);
  assert.match(app, /匯出 JSON 備份/);
  assert.match(app, /匯入 JSON 備份/);

  for (const retiredToken of ['identitytoolkit', 'securetoken', 'firebaseio', 'accounts:signUp', 'refreshToken', 'idToken']) {
    assert.doesNotMatch(app, new RegExp(retiredToken, 'i'));
    assert.doesNotMatch(appInfo, new RegExp(retiredToken, 'i'));
  }
});
