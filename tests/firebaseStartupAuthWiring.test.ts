import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('P2-A removes every App caller that could start Firebase Auth or RTDB transport', () => {
  for (const activeCaller of [
    'ensureFirebaseAuthSessionOnDemand',
    'createFirebaseAnonymousSessionSingleFlight',
    'uploadCloud',
    'downloadCloud',
    'uploadFirebaseStateWithLedgerMerge',
    'fetchRemoteFinancialEventLedger',
    'downloadFirebase',
    'buildFirebaseSyncUrl'
  ]) assert.doesNotMatch(app, new RegExp(`\\b${activeCaller}\\b`));

  assert.doesNotMatch(app, /Identity Toolkit|Secure Token|匿名身分|上傳雲端|下載雲端/);
  assert.match(app, /匯出 JSON 備份/);
  assert.match(app, /匯入 JSON 備份/);
});
