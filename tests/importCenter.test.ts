import assert from 'node:assert/strict';
import test from 'node:test';
import { buildImportPreview, createImportTransactions, csvParse, parseImportDate, parseMoney, rowsToRecords } from '../src/lib/importCenter';

const account = { id: 'bank', currency: 'TWD', isActive: true, type: 'bank' };
test('CSV parser supports BOM, quotes, commas, blank rows, and platform newlines', () => {
  const rows = csvParse('\uFEFFdate,description,amount\r\n2026/07/13,"coffee, shop",-1,234\n\n');
  assert.equal(rows.length, 2); assert.equal(rows[1][1], 'coffee, shop');
  assert.throws(() => rowsToRecords([['date', 'date'], ['a', 'b']]));
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
