import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { IMPORT_FILE_ACCEPT, applyMappingPreset, buildImportPreview, createImportTransactions, csvParse, decodeXlsxRows, detectImportFileType, guessImportMapping, normalizeMappingPresets, parseImportDate, parseMoney, reconcileImportPreviewDuplicates, rowsToRecords, updateImportPreviewRowCategory, validateMappingPreset } from '../src/lib/importCenter';
import { reconcileMonthlyTransactions } from '../src/lib/monthlyTransactionReconciliation';
import type { FinancialTransaction } from '../src/lib/transactions';

const account = { id: 'bank', currency: 'TWD', isActive: true, type: 'bank' };
const importCenterComponent = readFileSync(new URL('../src/components/import/ImportCenter.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
test('file-picker contract and parser gate allow CSV, XLSX, and PDF only', () => {
  assert.equal(IMPORT_FILE_ACCEPT, '.csv,.xlsx,.pdf');
  assert.equal(detectImportFileType('fixture.CSV'), 'csv');
  assert.equal(detectImportFileType('fixture.XLSX'), 'xlsx');
  assert.equal(detectImportFileType('fixture.PDF'), 'pdf');
  assert.equal(detectImportFileType('fixture.xls'), undefined);
  assert.equal(detectImportFileType('fixture.txt'), undefined);
  assert.equal(detectImportFileType('fixture.pdf.exe'), undefined);
});
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
test('auto mapping uses an explicit transaction-date alias and never substitutes posting date', () => {
  assert.equal(guessImportMapping(['入帳日期', '交易日期', '金額']).occurredAt, '交易日期');
  assert.equal(guessImportMapping(['posting date', 'amount']).occurredAt, undefined);
  assert.equal(guessImportMapping(['交易日期', '交易日', 'amount']).occurredAt, undefined, 'equivalent date candidates fail closed');
});
test('auto mapping accepts the reviewed consumer-date aliases but still excludes posting dates', () => {
  assert.equal(guessImportMapping(['消費日期', 'amount']).occurredAt, '消費日期');
  assert.equal(guessImportMapping(['消費日', 'amount']).occurredAt, '消費日');
  assert.equal(guessImportMapping(['posting date', 'posted date', '入帳日期', 'amount']).occurredAt, undefined);
});
test('auto mapping prevents amount, credit, and debit collisions and prefers a complete credit/debit pair', () => {
  assert.deepEqual(guessImportMapping(['交易日期', '收入', '支出', '單一金額']), { occurredAt: '交易日期', credit: '收入', debit: '支出', amount: undefined, description: undefined, merchant: undefined, categoryId: undefined, externalId: undefined, note: undefined });
  assert.deepEqual(guessImportMapping(['交易日期', '單一金額']), { occurredAt: '交易日期', amount: '單一金額', credit: undefined, debit: undefined, description: undefined, merchant: undefined, categoryId: undefined, externalId: undefined, note: undefined });
  assert.equal(guessImportMapping(['交易日期', '收入/支出金額']).amount, undefined, 'a direction-ambiguous amount header is not guessed');
});
test('auto mapping accepts the reviewed credit and debit aliases without inferring an amount column', () => {
  for (const header of ['存入', '入帳金額', '貸方', 'deposit']) assert.equal(guessImportMapping(['交易日期', header]).credit, header);
  for (const header of ['提出', '扣款金額', '借方', 'withdrawal']) assert.equal(guessImportMapping(['交易日期', header]).debit, header);
  assert.equal(guessImportMapping(['交易日期', '存入', '扣款金額']).amount, undefined);
});
test('auto mapping recognizes only explicit description, merchant, and category aliases', () => {
  assert.deepEqual(guessImportMapping(['transaction date', 'amount', 'memo', 'payee', 'category']), { occurredAt: 'transaction date', amount: 'amount', credit: undefined, debit: undefined, description: 'memo', merchant: 'payee', categoryId: 'category', externalId: undefined, note: undefined });
  assert.equal(guessImportMapping(['transaction date', 'amount', 'name']).description, undefined);
  assert.equal(guessImportMapping(['transaction date', 'amount', 'name']).merchant, undefined);
});
test('auto mapping accepts the reviewed merchant aliases', () => {
  for (const header of ['特店', '店家', '交易對象']) assert.equal(guessImportMapping(['交易日期', '金額', header]).merchant, header);
});
test('auto mapping requires an explicit external identifier alias and rejects a bare id', () => {
  assert.equal(guessImportMapping(['交易日期', '金額', '交易編號']).externalId, '交易編號');
  assert.equal(guessImportMapping(['交易日期', '金額', 'external id']).externalId, 'external id');
  assert.equal(guessImportMapping(['交易日期', '金額', 'id']).externalId, undefined);
});
test('auto mapping accepts the reviewed external identifier aliases and still rejects bare id', () => {
  for (const header of ['交易序號', '流水號', 'transaction no']) assert.equal(guessImportMapping(['交易日期', '金額', header]).externalId, header);
  assert.equal(guessImportMapping(['交易日期', '金額', 'id']).externalId, undefined);
});
test('auto mapping is deterministic and fails closed for a shared source or equivalent target candidates', () => {
  const headers = ['交易日期', '單一金額', '金額', '描述', 'description'];
  assert.deepEqual(guessImportMapping(headers), guessImportMapping([...headers].reverse()));
  assert.equal(guessImportMapping(headers).amount, undefined);
  assert.equal(guessImportMapping(headers).description, undefined);
  assert.deepEqual(guessImportMapping(['交易日期', '交易說明']), { occurredAt: '交易日期', amount: undefined, credit: undefined, debit: undefined, description: '交易說明', merchant: undefined, categoryId: undefined, externalId: undefined, note: undefined }, 'one source column is assigned to only its explicit semantic target');
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
test('category suggestion stays preview-only until the user applies it', () => {
  const [row] = buildImportPreview(rowsToRecords([['date', 'amount', 'description'], ['2026-08-18', '-120', '電費']]), { occurredAt: 'date', amount: 'amount', description: 'description' }, account, []);
  assert.equal(row.categoryId, 'expense-other', 'existing fallback remains unchanged before acceptance');
  assert.equal(row.categorySuggestion?.kind, 'suggestion');
  assert.equal(row.categorySuggestion?.kind === 'suggestion' && row.categorySuggestion.categoryId, 'expense-utilities');
  const accepted = updateImportPreviewRowCategory(row, 'expense-utilities', account, []);
  assert.equal(accepted.categoryId, 'expense-utilities');
  assert.notEqual(accepted.fingerprint, row.fingerprint, 'accepted category gets its own existing fingerprint calculation');
});
test('accepted preview category reuses exact duplicate detection without changing its formula', () => {
  const records = rowsToRecords([['date', 'amount', 'description'], ['2026-08-18', '-120', '電費']]);
  const [original] = buildImportPreview(records, { occurredAt: 'date', amount: 'amount', description: 'description' }, account, []);
  const accepted = updateImportPreviewRowCategory(original, 'expense-utilities', account, []);
  const existing = createImportTransactions([accepted], account, 'duplicate-category')[0];
  const [again] = buildImportPreview(records, { occurredAt: 'date', amount: 'amount', description: 'description' }, account, [existing]);
  const acceptedAgain = updateImportPreviewRowCategory(again, 'expense-utilities', account, [existing]);
  assert.equal(again.categoryId, 'expense-other', 'an unaccepted suggestion never changes the existing fallback category');
  assert.equal(again.duplicate, 'possible', 'existing possible-duplicate behavior is preserved until a suggestion is accepted');
  assert.equal(acceptedAgain.duplicate, 'certain');
  assert.equal(acceptedAgain.selected, false);
});
test('suggestion action has a responsive structure that stacks without changing its apply contract', () => {
  assert.match(importCenterComponent, /className="import-preview-suggestion"/);
  assert.match(importCenterComponent, /className="import-preview-suggestion-copy"/);
  assert.match(importCenterComponent, /className="import-preview-category"/);
  assert.match(styles, /\.import-preview-suggestion\{flex-direction:column;align-items:flex-start\}/);
  assert.match(styles, /\.import-preview-category select\{min-width:0;max-width:100%\}/);
});

const batchMapping = { occurredAt: 'date', amount: 'amount', description: 'description', merchant: 'merchant', categoryId: 'category', externalId: 'externalId' };
const batchPreview = (rows: Array<Array<string>>, existing = []) => buildImportPreview(rowsToRecords([['date', 'amount', 'description', 'merchant', 'category', 'externalId'], ...rows]), batchMapping, account, existing);

test('batch reconciliation keeps the earliest exact row and marks the later row as certain and skipped', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]);
  assert.deepEqual(preview.map(row => [row.duplicate, row.selected]), [['none', true], ['certain', false]]);
});

test('batch reconciliation marks every later exact row as certain deterministically', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]);
  assert.deepEqual(preview.map(row => row.duplicate), ['none', 'certain', 'certain']);
});

test('batch canonical selection is determined by rowNumber even when reconciliation input order changes', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]);
  const reconciled = reconcileImportPreviewDuplicates([...preview].reverse(), account, []);
  assert.equal(reconciled.find(row => row.rowNumber === preview[0].rowNumber)?.duplicate, 'none');
  assert.equal(reconciled.find(row => row.rowNumber === preview[1].rowNumber)?.duplicate, 'certain');
});

test('a repeated nonempty external ID is a certain batch duplicate even when other values differ', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', 'bank-1'], ['2026-08-19', '-999', 'other', '', 'expense-shopping', 'bank-1']]);
  assert.deepEqual(preview.map(row => [row.duplicate, row.selected]), [['none', true], ['certain', false]]);
});

test('same date amount and identity with different fingerprints is a possible batch duplicate', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-shopping', '']]);
  assert.equal(preview[0].fingerprint === preview[1].fingerprint, false);
  assert.equal(preview[1].duplicate, 'possible');
  assert.equal(preview[1].selected, true);
  assert.match(preview[1].warning ?? '', /同批次可能重複/);
});

test('batch reconciliation does not infer duplicates when amounts, dates, or identities differ', () => {
  const amount = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-121', 'coffee', '', 'expense-food', '']]);
  const date = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-19', '-120', 'coffee', '', 'expense-food', '']]);
  const identity = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'tea', '', 'expense-shopping', '']]);
  assert.equal(amount[1].duplicate, 'none'); assert.equal(date[1].duplicate, 'none'); assert.equal(identity[1].duplicate, 'none');
});

test('invalid rows never become batch canonical sources', () => {
  const preview = batchPreview([['invalid-date', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]);
  assert.ok(preview[0].error);
  assert.equal(preview[1].duplicate, 'none');
});

test('existing certain duplicates remain certain when the row also has a batch duplicate', () => {
  const initial = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]);
  const existing = createImportTransactions(initial, account, 'existing-certain');
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', '']], existing);
  assert.deepEqual(preview.map(row => [row.duplicate, row.selected]), [['certain', false], ['certain', false]]);
});

test('a batch certain duplicate upgrades an existing possible duplicate', () => {
  const existing = createImportTransactions(batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]), account, 'existing-possible');
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-shopping', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-shopping', '']], existing);
  assert.equal(preview[0].duplicate, 'possible');
  assert.equal(preview[1].duplicate, 'certain');
  assert.equal(preview[1].selected, false);
});

test('existing none plus a batch possible duplicate remains possible', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-shopping', '']]);
  assert.deepEqual(preview.map(row => row.duplicate), ['none', 'possible']);
});

test('category changes re-reconcile the whole batch and can upgrade possible to certain', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-shopping', '']]);
  const changed = preview.map(row => row.rowNumber === preview[1].rowNumber ? updateImportPreviewRowCategory(row, 'expense-food', account, []) : row);
  const reconciled = reconcileImportPreviewDuplicates(changed, account, []);
  assert.equal(preview[1].duplicate, 'possible');
  assert.equal(reconciled[1].duplicate, 'certain');
  assert.equal(reconciled[1].selected, false);
});

test('category changes re-reconcile the whole batch without auto-reselecting a downgraded certain row', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]);
  const changed = preview.map(row => row.rowNumber === preview[1].rowNumber ? updateImportPreviewRowCategory(row, 'expense-shopping', account, []) : row);
  const reconciled = reconcileImportPreviewDuplicates(changed, account, []);
  assert.equal(reconciled[1].duplicate, 'possible');
  assert.equal(reconciled[1].selected, false);
});

test('applying a 022-A suggestion re-reconciles the whole batch', () => {
  const preview = batchPreview([['2026-08-18', '-120', '電費', '', 'expense-other', ''], ['2026-08-18', '-120', '電費', '', 'expense-utilities', '']]);
  const changed = preview.map(row => row.rowNumber === preview[0].rowNumber ? updateImportPreviewRowCategory(row, 'expense-utilities', account, []) : row);
  const reconciled = reconcileImportPreviewDuplicates(changed, account, []);
  assert.equal(reconciled[1].duplicate, 'certain');
  assert.equal(reconciled[1].selected, false);
});

test('reconciliation preserves a manual selection when its non-certain severity is unchanged', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-shopping', '']]);
  const manuallySkipped = preview.map((row, index) => index === 1 ? { ...row, selected: false } : row);
  const reconciled = reconcileImportPreviewDuplicates(manuallySkipped, account, []);
  assert.equal(reconciled[1].duplicate, 'possible');
  assert.equal(reconciled[1].selected, false);
});

test('import sessions count batch certain rows through the existing preview duplicateRows expression', () => {
  const preview = batchPreview([['2026-08-18', '-120', 'coffee', '', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', '', 'expense-food', '']]);
  assert.equal(preview.filter(row => row.duplicate === 'certain').length, 1);
  assert.match(importCenterComponent, /duplicateRows: preview\.filter\(row => row\.duplicate === 'certain'\)\.length/);
});

test('category controls reconcile whole preview batches rather than only the edited row', () => {
  assert.match(importCenterComponent, /reconcileImportPreviewDuplicates\(current\.map\(/);
});

test('preview renders an existing possible-duplicate warning without replacing invalid-row errors', () => {
  assert.match(importCenterComponent, /\{!row\.error && row\.warning && <span className="import-preview-warning">\{row\.warning\}<\/span>\}/);
});

const reconciliationPreview = (rows: Array<Array<string>>) => buildImportPreview(rowsToRecords([['date', 'amount', 'description', 'category', 'externalId'], ...rows]), { occurredAt: 'date', amount: 'amount', description: 'description', categoryId: 'category', externalId: 'externalId' }, account, []);
const reconciliationTransaction = (id: string, patch: Partial<FinancialTransaction> = {}): FinancialTransaction => ({ id, accountId: 'bank', type: 'expense', status: 'posted', source: 'manual', amount: 120, currency: 'TWD', categoryId: 'expense-food', description: 'coffee', merchant: '', note: '', occurredAt: '2026-08-18T00:00:00.000Z', fingerprint: '', excluded: false, createdAt: '2026-08-18T00:00:00.000Z', updatedAt: '2026-08-18T00:00:00.000Z', ...patch });

test('monthly reconciliation converts a unique externalId or fingerprint identity into one-to-one matched rows', () => {
  const external = reconciliationPreview([['2026-08-18', '-120', 'coffee', 'expense-food', 'stmt-1']]);
  const externalTransaction = reconciliationTransaction('external', { source: 'import', note: '[external:stmt-1]' });
  const fingerprint = reconciliationPreview([['2026-08-19', '-80', 'tea', 'expense-food', '']]);
  const fingerprintTransaction = reconciliationTransaction('fingerprint', { amount: 80, description: 'tea', occurredAt: '2026-08-19T00:00:00.000Z', fingerprint: fingerprint[0].fingerprint! });
  const result = reconcileMonthlyTransactions([...external, ...fingerprint], [externalTransaction, fingerprintTransaction], 'bank');
  assert.deepEqual(result.rows.map(row => row.status), ['matched', 'matched']);
  assert.equal(result.summary.matched, 2);
  assert.equal(result.appOnly.length, 0);
});

test('monthly reconciliation fails closed for high-confidence ambiguity and only consumes one App transaction once', () => {
  const duplicateStatements = reconciliationPreview([['2026-08-18', '-120', 'coffee', 'expense-food', ''], ['2026-08-18', '-120', 'coffee', 'expense-food', '']]);
  const single = reconciliationTransaction('single', { fingerprint: duplicateStatements[0].fingerprint! });
  const duplicatedApp = [single, { ...single, id: 'same-fingerprint' }];
  const result = reconcileMonthlyTransactions(duplicateStatements, [single], 'bank');
  assert.deepEqual(result.rows.map(row => row.status), ['matched', 'possible']);
  assert.equal(result.appOnly.length, 0, 'a possible relation is not also presented as app-only');
  const ambiguous = reconcileMonthlyTransactions(duplicateStatements.slice(0, 1), duplicatedApp, 'bank');
  assert.equal(ambiguous.rows[0].status, 'possible');
  assert.equal(ambiguous.appOnly.length, 0);
});

test('monthly reconciliation keeps multiple possible candidates unresolved and matches separate exact pairs one-to-one', () => {
  const possibleRows = reconciliationPreview([['2026-08-18', '-120', 'coffee', 'expense-shopping', '']]);
  const possibleResult = reconcileMonthlyTransactions(possibleRows, [
    reconciliationTransaction('possible-a'),
    reconciliationTransaction('possible-b', { categoryId: 'expense-transport' })
  ], 'bank');
  assert.equal(possibleResult.rows[0].status, 'possible');
  assert.deepEqual(possibleResult.rows[0].candidateTransactionIds, ['possible-a', 'possible-b']);
  assert.equal(possibleResult.appOnly.length, 0);

  const exactRows = reconciliationPreview([
    ['2026-08-18', '-120', 'coffee', 'expense-food', ''],
    ['2026-08-19', '-80', 'tea', 'expense-food', '']
  ]);
  const exactResult = reconcileMonthlyTransactions(exactRows, [
    reconciliationTransaction('coffee', { fingerprint: exactRows[0].fingerprint! }),
    reconciliationTransaction('tea', { amount: 80, description: 'tea', occurredAt: '2026-08-19T00:00:00.000Z', fingerprint: exactRows[1].fingerprint! })
  ], 'bank');
  assert.deepEqual(exactResult.rows.map(row => [row.status, row.matchedTransactionId]), [['matched', 'coffee'], ['matched', 'tea']]);
});

test('monthly reconciliation keeps possible, statement-only, invalid, and app-only semantics distinct', () => {
  const rows = reconciliationPreview([['2026-08-18', '-120', 'coffee', 'expense-shopping', ''], ['2026-08-20', '-55', 'new', 'expense-food', ''], ['invalid', '-1', 'bad', 'expense-food', '']]);
  const possible = reconciliationTransaction('possible');
  const appOnly = reconciliationTransaction('app-only', { amount: 88, description: 'app only', occurredAt: '2026-08-19T00:00:00.000Z' });
  const result = reconcileMonthlyTransactions(rows, [possible, appOnly], 'bank');
  assert.deepEqual(result.rows.map(row => row.status), ['possible', 'statement-only', 'invalid']);
  assert.deepEqual(result.appOnly.map(transaction => transaction.id), ['app-only']);
  assert.deepEqual(result.summary, { matched: 0, possible: 1, statementOnly: 1, appOnly: 1, invalid: 1 });
});

test('monthly reconciliation derives the actual statement range and excludes other-account, void, excluded, pending, and out-of-range App rows', () => {
  const rows = reconciliationPreview([['2026-07-31', '-10', 'one', 'expense-food', ''], ['2026-08-02', '-20', 'two', 'expense-food', '']]);
  const result = reconcileMonthlyTransactions(rows, [
    reconciliationTransaction('other-account', { accountId: 'other', amount: 10, description: 'one', occurredAt: '2026-07-31T00:00:00.000Z' }),
    reconciliationTransaction('void', { status: 'void', amount: 10, description: 'one', occurredAt: '2026-07-31T00:00:00.000Z' }),
    reconciliationTransaction('excluded', { excluded: true, amount: 10, description: 'one', occurredAt: '2026-07-31T00:00:00.000Z' }),
    reconciliationTransaction('pending', { status: 'pending', amount: 10, description: 'one', occurredAt: '2026-07-31T00:00:00.000Z' }),
    reconciliationTransaction('outside', { amount: 30, description: 'outside', occurredAt: '2026-08-03T00:00:00.000Z' })
  ], 'bank');
  assert.deepEqual(result.period, { minDate: '2026-07-31', maxDate: '2026-08-02' });
  assert.equal(result.appOnly.length, 0);
  assert.equal(result.summary.statementOnly, 2);
});

test('monthly reconciliation fails closed with no valid Statement rows', () => {
  const rows = reconciliationPreview([['invalid', '-10', 'bad', 'expense-food', '']]);
  assert.throws(() => reconcileMonthlyTransactions(rows, [reconciliationTransaction('app')], 'bank'), /有效 Statement/);
});

test('Import Center keeps monthly reconciliation session-only, read-only, and shows all five summary states', () => {
  assert.match(importCenterComponent, /reconcileMonthlyTransactions\(preview, transactions, account\.id\)/);
  assert.match(importCenterComponent, /產生對帳預覽/);
  assert.match(importCenterComponent, /對帳期間/);
  assert.match(importCenterComponent, /已匹配/);
  assert.match(importCenterComponent, /可能相符/);
  assert.match(importCenterComponent, /Statement 未找到/);
  assert.match(importCenterComponent, /App 未找到/);
  assert.match(importCenterComponent, /無效列/);
  assert.match(importCenterComponent, /const updateCategory = \(categoryId: string\) => \{ setReconciliation\(null\);/);
  assert.doesNotMatch(importCenterComponent, /reconciliationSessions|monthlyReconciliationHistory|matchedTransactionIds/);
  assert.match(styles, /\.import-reconciliation-preview\{min-width:0;overflow-wrap:anywhere\}/);
});
