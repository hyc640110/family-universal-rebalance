import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const component = readFileSync(new URL('../src/components/import/ImportCenter.tsx', import.meta.url), 'utf8');

test('App uses one extracted Import Center and no longer keeps either legacy inline implementation', () => {
  assert.match(app, /import ImportCenter from '\.\/components\/import\/ImportCenter';/);
  assert.match(app, /<ImportCenter accounts=\{state\.accounts\}/);
  assert.doesNotMatch(app, /function ImportCenter\(/);
  assert.doesNotMatch(app, /ImportCenterV2/);
  assert.doesNotMatch(app, /readXlsxFile|readSheet/);
});

test('the extracted UI delegates import behavior to the existing import model and keeps the route composition in App', () => {
  for (const helper of ['applyMappingPreset', 'buildImportPreview', 'createImportSessionId', 'createImportTransactions', 'csvParse', 'rowsToRecords']) assert.match(component, new RegExp(`\\b${helper}\\b`));
  assert.match(component, /accept="\.csv,\.xlsx"/);
  assert.match(component, /onCommit\(/);
  assert.match(component, /onRollback\(/);
  assert.match(component, /onPresets\(/);
  assert.match(app, /id="transactions-section"/);
});
