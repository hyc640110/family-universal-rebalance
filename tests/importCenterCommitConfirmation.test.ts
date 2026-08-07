import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/components/import/ImportCenter.tsx', import.meta.url), 'utf8');

test('正式批次匯入已選列 requires a window.confirm() before onCommit is ever called', () => {
  const commitFnMatch = component.match(/const commit = \(\) => \{[\s\S]*?\n {2}\};/);
  assert.ok(commitFnMatch, 'expected to find the commit() function body');
  const body = commitFnMatch[0];
  const confirmIndex = body.indexOf('window.confirm(');
  const onCommitIndex = body.indexOf('onCommit(');
  assert.ok(confirmIndex >= 0, 'commit() must call window.confirm()');
  assert.ok(onCommitIndex > confirmIndex, 'onCommit(...) must only run after the window.confirm() gate');
});

test('the confirm dialog names the actual writable row count, the target account, and the real undo caveat (once a row is edited the whole batch can no longer be reverted)', () => {
  assert.match(
    component,
    /window\.confirm\(`即將正式匯入 \$\{imported\.length\} 筆交易至「\$\{account\.name\}」。匯入後可用「撤銷」復原，但只要其中任一筆事後被編輯過，整批就無法再撤銷。是否繼續？`\)/
  );
});

test('cancelling the confirm dialog leaves data untouched and shows the cancelled-tone feedback matching the savePreset/importBackup convention', () => {
  assert.match(
    component,
    /if \(!window\.confirm\(`即將正式匯入[\s\S]*?\{\s*setCommitFeedback\(\{ tone: 'cancelled', text: '已取消匯入，尚未寫入任何交易。' \}\);\s*return;\s*\}/
  );
});

test('zero writable rows (all unchecked or errored) is rejected before the confirm dialog, with its own error feedback, and never calls window.confirm()', () => {
  const commitFnMatch = component.match(/const commit = \(\) => \{[\s\S]*?\n {2}\};/);
  assert.ok(commitFnMatch);
  const body = commitFnMatch[0];
  const zeroGuardIndex = body.indexOf("if (!imported.length)");
  const confirmIndex = body.indexOf('window.confirm(');
  assert.ok(zeroGuardIndex >= 0, 'commit() must reject an empty imported[] before doing anything else');
  assert.ok(zeroGuardIndex < confirmIndex, 'the zero-row guard must run before window.confirm() is reached');
  assert.match(body, /if \(!imported\.length\) \{ setCommitFeedback\(\{ tone: 'error', text: '[^']*' \}\); return; \}/);
});

test('the commit button is disabled once there are zero selected, error-free preview rows, computed the same way createImportTransactions filters', () => {
  assert.match(component, /const selectedRowCount = preview\.filter\(row => row\.selected && !row\.error\)\.length;/);
  assert.match(component, /<button className="small" type="button" disabled=\{selectedRowCount === 0\} onClick=\{commit\}>正式批次匯入已選列<\/button>/);
});
