import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMappingPreset, buildImportPreview, createImportTransactions, csvParse, decodeXlsxRows, guessImportMapping, normalizeMappingPresets, parseImportDate, parseMoney, rowsToRecords, validateMappingPreset } from '../src/lib/importCenter';

const account = { id: 'bank', currency: 'TWD', isActive: true, type: 'bank' };
test('CSV parser supports BOM, quotes, commas, blank rows, and platform newlines', () => {
  const rows = csvParse('\uFEFFdate,description,amount\r\n2026/07/13,"coffee, shop",-1,234\n\n');
  assert.equal(rows.length, 2); assert.equal(rows[1][1], 'coffee, shop');
  assert.throws(() => rowsToRecords([['date', 'date'], ['a', 'b']]));
});
test('numeric HTML entity XLSX headers decode before auto mapping and match CSV mappings', () => {
  const headers = ['交易日期', '單一金額', '描述', '商家/對象', '類別', '外部ID'];
  const encodedXlsxRows = [
    ['&#20132;&#26131;&#26085;&#26399;', '&#21934;&#19968;&#37329;&#38989;', '&#25551;&#36848;', '&#21830;&#23478;/&#23565;&#35937;', '&#39006;&#21029;', '&#22806;&#37096;ID'],
    ['2026-07-01', 35000, '&#34218;&#36039;&#20837;&#24115;', '&#28204;&#35430;&#20844;&#21496;', '&#34218;&#36039;', 'T001']
  ];
  const decodedXlsxRows = decodeXlsxRows(encodedXlsxRows);
  const xlsxHeaders = Object.keys(rowsToRecords(decodedXlsxRows)[0].raw);
  const csvHeaders = Object.keys(rowsToRecords([headers, ['2026-07-01', '35000', '薪資入帳', '測試公司', '薪資', 'T001']])[0].raw);
  assert.deepEqual(xlsxHeaders, headers);
  assert.equal(xlsxHeaders.some(header => header.includes('&#')), false);
  assert.deepEqual(guessImportMapping(xlsxHeaders), guessImportMapping(csvHeaders));
  assert.deepEqual(guessImportMapping(xlsxHeaders), { occurredAt: '交易日期', amount: '單一金額', description: '描述', merchant: '商家/對象', categoryId: '類別', externalId: '外部ID', credit: undefined, debit: undefined, note: undefined });
});
test('money and dates normalize safely', () => {
  assert.equal(parseMoney('NT$1,234.56'), 1234.56); assert.equal(parseMoney('(1,234)'), -1234); assert.equal(parseMoney('0'), undefined); assert.equal(parseMoney('bad'), undefined);
  assert.equal(parseImportDate('20260713')?.slice(0, 10), '2026-07-13'); assert.equal(parseImportDate('115/07/13')?.slice(0, 10), '2026-07-13'); assert.equal(parseImportDate('13/07/2026'), undefined);
});
test('preview isolates invalid rows and defaults certain duplicates to skipped', () => {
  const records = rowsToRecords([['date', 'amount', 'description', 'id'], ['2026-07-13', '1,234', 'salary', 'x'], ['bad', '0', 'bad', 'y']]);
  const preview = buildImportPreview(records, { occurredAt: 'date', amount: 'amount', description: 'description', externalId: 'id' }, account, []);
  assert.equal(preview[0].type, 'income'); assert.equal(preview[0].amount, 1234); assert.equal(preview[1].selected, false); assert.ok(preview[1].error);
  const transaction = createImportTransactions([preview[0]], account, 'import-one')[0];
  const duplicate = buildImportPreview(records.slice(0, 1), { occurredAt: 'date', amount: 'amount', description: 'description', externalId: 'id' }, account, [transaction])[0];
  assert.equal(duplicate.duplicate, 'certain'); assert.equal(duplicate.selected, false);
});
test('worksheet changes require compatible mappings and do not reuse missing columns', () => {
  const preset = { id: 'p', name: 'bank', mapping: { occurredAt: 'date', amount: 'amount', debit: 'debit' }, dateFormat: 'ymd' as const, createdAt: 'x', updatedAt: 'x', schemaVersion: 1 };
  assert.equal(validateMappingPreset(preset, ['date', 'amount', 'debit', 'extra']).valid, true);
  assert.equal(applyMappingPreset(preset, ['date', 'value']).error.includes('amount'), true);
  assert.equal(rowsToRecords([['date', 'amount'], ['2026-01-01', '1']]).length, 1);
  assert.equal(rowsToRecords([['date', 'amount']]).length, 0, 'header-only worksheet is empty');
});
test('preset normalization removes damaged and duplicate metadata without raw worksheet data', () => {
  const values = normalizeMappingPresets([{ id: 'p', name: 'one', mapping: { occurredAt: 'date', amount: 'amount' }, dateFormat: 'ymd', createdAt: 'x', updatedAt: 'x' }, { id: 'p', name: 'duplicate', mapping: {} }, { id: '', name: 'broken' }]);
  assert.equal(values.length, 1); assert.equal(values[0].mapping.amount, 'amount'); assert.equal('rows' in values[0], false); assert.equal('file' in values[0], false);
});
