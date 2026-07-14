import assert from 'node:assert/strict';
import test from 'node:test';
import { annualDividendTotals, dividendSources, dividendSummary, filterDividends, isValidDividendTransaction, monthlyDividendTotals, validDividends } from '../src/lib/dividends';
import type { FinancialTransaction } from '../src/lib/transactions';

const base = (id: string, patch: Partial<FinancialTransaction> = {}): FinancialTransaction => ({ id, accountId: 'cash', type: 'income', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'income-dividend', description: '', merchant: '', note: '', occurredAt: '2026-07-10T00:00:00.000Z', fingerprint: id, excluded: false, createdAt: '2026-07-10T00:00:00.000Z', updatedAt: '2026-07-10T00:00:00.000Z', ...patch });
const today = '2026-07-14';

test('only posted, included, received income-dividend transactions with valid positive finite values are counted', () => {
  const rows = [base('good'), base('income', { categoryId: 'income-other' }), base('pending', { status: 'pending' }), base('void', { status: 'void' }), base('excluded', { excluded: true }), base('future', { occurredAt: '2026-07-15T00:00:00.000Z' }), base('invalid-date', { occurredAt: 'not-a-date' }), base('zero', { amount: 0 }), base('negative', { amount: -1 }), base('nan', { amount: Number.NaN })];
  assert.deepEqual(validDividends(rows, today).map(row => row.id), ['good']);
  assert.equal(isValidDividendTransaction(base('good'), today), true);
});

test('summary and period totals use received dividends only, with recent date ordering', () => {
  const rows = [base('older', { occurredAt: '2025-12-20T00:00:00.000Z', amount: 50 }), base('this-month', { occurredAt: '2026-07-10T00:00:00.000Z', amount: 100, assetSymbol: '0050', assetName: '元大台灣50' }), base('latest', { occurredAt: '2026-07-12T00:00:00.000Z', amount: 120, assetSymbol: '00631L', assetName: '元大台灣50正2' })];
  assert.deepEqual(dividendSummary(rows, today), { yearAmount: 220, monthAmount: 220, totalAmount: 270, yearCount: 2, latest: rows[2] });
  assert.equal(filterDividends(rows, { year: 'current', today }).length, 2);
  assert.equal(filterDividends(rows, { year: 2025, today })[0].id, 'older');
  assert.deepEqual(annualDividendTotals(rows, today), [{ year: 2026, amount: 220 }, { year: 2025, amount: 50 }]);
  assert.equal(monthlyDividendTotals(rows, 2026, today)[6].amount, 220);
});

test('source distribution handles unspecified assets and keeps the historical name snapshot after holdings are gone', () => {
  const rows = [base('a', { amount: 100, assetSymbol: '0050', assetName: '歷史 ETF 名稱' }), base('b', { amount: 50, assetSymbol: '0050', assetName: '歷史 ETF 名稱' }), base('unknown', { amount: 50 })];
  assert.deepEqual(dividendSources(rows, { today }), [{ assetSymbol: '0050', assetName: '歷史 ETF 名稱', amount: 150, ratio: .75, count: 2 }, { assetSymbol: undefined, assetName: '未指定資產', amount: 50, ratio: .25, count: 1 }]);
});

test('editing and deleting the same Transaction naturally avoids duplicate records and immediately changes statistics', () => {
  const original = base('single', { amount: 100 }); const edited = { ...original, amount: 140, updatedAt: '2026-07-11T00:00:00.000Z' };
  assert.equal(dividendSummary([edited], today).totalAmount, 140);
  assert.equal(dividendSummary([], today).totalAmount, 0);
});

test('V5.5 UI keeps mobile cards and Transaction-backed wording without a separate record model', async () => {
  const { readFile } = await import('node:fs/promises'); const page = await readFile(new URL('../src/pages/DividendCenterPage.tsx', import.meta.url), 'utf8'); const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(page, /income-dividend/); assert.match(page, /onUpdate\(editing\.id/); assert.match(page, /onDelete\(row\.id/); assert.match(page, /未指定資產/);
  assert.match(css, /\.dividend-layout\{display:grid;grid-template-columns/); assert.match(css, /@media \(max-width:700px\)\{\.dividend-overview\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
