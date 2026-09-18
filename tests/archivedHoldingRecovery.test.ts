import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('新增已封存代號會恢復既有持股，而非回報一般重複', () => {
  const addHoldingAsset = app.slice(app.indexOf('const addHoldingAsset ='), app.indexOf('const removeHoldingAsset ='));

  assert.match(addHoldingAsset, /const archivedHolding = safeHoldings\(state\.holdings\)\.find\(h => normalizeSymbol\(h\.symbol\) === symbol && h\.isArchived\)/);
  assert.match(addHoldingAsset, /restoreHoldingAsset\(symbol\)/);
  assert.match(addHoldingAsset, /已恢復為目前持股/);
});

test('資產頁提供已清倉資產清單與恢復持股操作', () => {
  const assetsPage = app.slice(app.indexOf('title="持股資產管理"'), app.indexOf('id="accounts-section"'));

  assert.match(assetsPage, /已清倉資產/);
  assert.match(assetsPage, /filter\(item => item\.isArchived\)/);
  assert.match(assetsPage, /onClick=\{\(\) => restoreHoldingAsset\(item\.symbol\)\}/);
  assert.match(assetsPage, />恢復持股<\/button>/);
});
