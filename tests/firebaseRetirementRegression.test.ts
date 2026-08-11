import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const syncState = readFileSync(new URL('../src/lib/syncState.ts', import.meta.url), 'utf8');

test('P3-B2-A 不得保留已退役的 Firebase runtime status module 或 cloud baseline utilities', () => {
  assert.equal(existsSync(new URL('../src/lib/syncStatus.ts', import.meta.url)), false);
  for (const removedSymbol of [
    'canonicalSyncJson',
    'canonicalSyncPayload',
    'createSyncPayloadSnapshot',
    'syncPayloadFieldFingerprints',
    'syncPayloadFingerprint',
    'deriveSyncBaselineDiagnostics',
    'syncPayloadTopLevelDiff',
    'deriveSuccessfulUploadResult',
    'hasSyncableStateChanged'
  ]) assert.doesNotMatch(syncState, new RegExp(`export function ${removedSymbol}\\b`));
});

test('P3-B2-A 不得重新接回 cloud-sync UI、remote Ledger merge 或傳輸呼叫', () => {
  for (const removedName of [
    'RuntimeSyncStatus',
    'describeRuntimeSyncStatus',
    'MissingLedgerSyncError',
    'remoteFinancialEventLedgerFromRaw',
    'uploadCloud',
    'downloadCloud',
    'uploadFirebaseStateWithLedgerMerge',
    'fetchRemoteFinancialEventLedger',
    'downloadFirebase'
  ]) assert.doesNotMatch(app, new RegExp(`\\b${removedName}\\b`));

  assert.doesNotMatch(app, /雲端同步狀態|雲端同步診斷|上傳雲端|下載雲端/);
  assert.match(app, /JSON 備份可用於人工備份、跨裝置資料搬移與災難復原/);
});
