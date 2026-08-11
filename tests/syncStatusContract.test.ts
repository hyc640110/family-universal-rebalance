import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('P2-A removes Firebase runtime status, remote comparison, and sync UI from App', () => {
  for (const removedName of [
    'RuntimeSyncStatus',
    'describeRuntimeSyncStatus',
    'MissingLedgerSyncError',
    'remoteFinancialEventLedgerFromRaw',
    'remoteMeta',
    'syncDiagnostics'
  ]) assert.doesNotMatch(app, new RegExp(`\\b${removedName}\\b`));

  assert.doesNotMatch(app, /雲端同步狀態|雲端同步診斷|本機有新資料，請按「上傳雲端」/);
  assert.match(app, /JSON 備份可用於人工備份、跨裝置資料搬移與災難復原/);
});
