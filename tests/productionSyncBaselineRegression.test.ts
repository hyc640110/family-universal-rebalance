import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('P2-A production path stays local-first and has no Firebase transport caller', () => {
  assert.match(app, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(app, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(app, /function backupPayload/);
  assert.match(app, /function stateFromBackup/);

  for (const removedName of ['uploadFirebase', 'downloadFirebase', 'syncPath', 'syncUrl', 'uploadCloud', 'downloadCloud']) {
    assert.doesNotMatch(app, new RegExp(`\\b${removedName}\\b`));
  }
});
