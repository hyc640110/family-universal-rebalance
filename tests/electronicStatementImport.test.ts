import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTextPdfStatement } from '../src/lib/electronicStatementImport';
import { buildImportPreview } from '../src/lib/importCenter';

test('文字型 PDF 的多頁明確正負號交易會轉為既有 Import Center records', () => {
  const result = parseTextPdfStatement([
    { pageNumber: 1, lines: ['銀行電子帳單', '2026/08/01 薪資入帳 +TWD 52,000', '2026/08/02 超商消費 (1,234)', '第 1 頁'] },
    { pageNumber: 2, lines: ['2026/08/03', '跨行文字交易', '- 99.50', 'Page 2 of 2'] }
  ]);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.deepEqual(result.headers, ['交易日期', '單一金額', '描述']);
  assert.deepEqual(result.mapping, { occurredAt: '交易日期', amount: '單一金額', description: '描述' });
  assert.deepEqual(result.records.map(record => record.raw), [
    { 交易日期: '2026/08/01', 單一金額: '+TWD52,000', 描述: '薪資入帳' },
    { 交易日期: '2026/08/02', 單一金額: '(1,234)', 描述: '超商消費' },
    { 交易日期: '2026/08/03', 單一金額: '-99.50', 描述: '跨行文字交易' }
  ]);
  const preview = buildImportPreview(result.records, result.mapping, { id: 'bank', currency: 'TWD', isActive: true, type: 'bank' }, []);
  assert.deepEqual(preview.map(row => [row.type, row.amount, row.error]), [['income', 52000, undefined], ['expense', 1234, undefined], ['expense', 99.5, undefined]]);
});

test('空白、掃描型或沒有文字交易列的 PDF 一律 fail closed', () => {
  for (const pages of [[], [{ pageNumber: 1, lines: [] }], [{ pageNumber: 1, lines: ['掃描影像，沒有可用文字'] }]]) {
    const result = parseTextPdfStatement(pages);
    assert.equal(result.status, 'unsupported');
  }
});

test('裸正數、無效日期、無效金額或缺少描述時不產生部分匯入資料', () => {
  for (const line of ['2026/08/01 便利商店 1,234', '2026/13/01 便利商店 -1,234', '2026/08/01 便利商店 -bad', '2026/08/01 -1,234']) {
    const result = parseTextPdfStatement([{ pageNumber: 1, lines: [line] }]);
    assert.equal(result.status, 'unsupported');
  }
});
