import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { applyMappingPreset, type ImportPreset } from '../src/lib/importCenter';

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

test('a saved preset restores a changed mapping without reading a cleared event currentTarget', () => {
  const preset: ImportPreset = { id: 'test', name: 'TestPreset', mapping: { occurredAt: 'date', amount: 'amount', description: 'description' }, dateFormat: 'ymd', createdAt: 'x', updatedAt: 'x', schemaVersion: 1 };
  const changedMapping = { ...preset.mapping, occurredAt: undefined };
  assert.equal(changedMapping.occurredAt, undefined);
  assert.doesNotThrow(() => {
    const applied = applyMappingPreset(preset, ['date', 'amount', 'description']);
    assert.equal(applied.error, '');
    assert.deepEqual(applied.mapping, preset.mapping);
  });
  assert.match(component, /const value = event\.currentTarget\.value; setMapping\(current => \(\{ \.\.\.current, \[key\]: value \|\| undefined \}\)\)/);
  assert.doesNotMatch(component, /setMapping\(current => \(\{ \.\.\.current, \[key\]: event\.currentTarget\.value/);
});
