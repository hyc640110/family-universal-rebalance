import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dividendAssetReferenceOptions } from '../src/lib/dividendAssetReferences';
import { DividendAssetReferenceSelect } from '../src/pages/DividendCenterPage';

const transaction = (assetSymbol: string, assetName?: string, patch: Record<string, unknown> = {}) => ({
  id: `transaction-${assetSymbol}-${assetName || 'none'}`,
  accountId: 'account', type: 'income', status: 'posted', source: 'manual', amount: 1, currency: 'TWD', categoryId: 'income-dividend', description: '', merchant: '', note: '', occurredAt: '2026-01-01T00:00:00.000Z', fingerprint: '', excluded: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', assetSymbol, ...(assetName ? { assetName } : {}), ...patch
}) as any;

test('builds active, archived, and transaction-only references with normalized stable ordering', () => {
  const holdings = [{ symbol: ' BBB ', name: 'Beta' }, { symbol: 'AAA', name: 'Archived Alpha', isArchived: true }, { symbol: 'DUP', name: 'Active duplicate' }, { symbol: 'dup', name: 'Archived duplicate', isArchived: true }, { symbol: '   ', name: 'ignored' }];
  const transactions = [transaction(' history ', 'Historical name'), transaction('DIVIDEND', 'Dividend-only'), transaction('dup', 'Must not replace holding'), transaction('UNKNOWN-X')];
  const before = JSON.stringify({ holdings, transactions });
  const options = dividendAssetReferenceOptions(holdings, transactions);
  assert.deepEqual(options.map(option => [option.symbol, option.status, option.name, option.label]), [
    ['BBB', 'active', 'Beta', 'BBB Beta'],
    ['DUP', 'active', 'Active duplicate', 'DUP Active duplicate'],
    ['AAA', 'archived', 'Archived Alpha', 'AAA Archived Alpha（已清倉）'],
    ['DIVIDEND', 'historical', 'Dividend-only', 'DIVIDEND Dividend-only（歷史紀錄）'],
    ['HISTORY', 'historical', 'Historical name', 'HISTORY Historical name（歷史紀錄）'],
    ['UNKNOWN-X', 'historical', undefined, 'UNKNOWN-X（歷史紀錄）']
  ]);
  assert.equal(JSON.stringify({ holdings, transactions }), before);
  assert.equal(options.some(option => option.symbol === ''), false, '未指定資產 must stay outside the adapter');
});

test('uses holding names first and selects historical names by updatedAt, occurredAt, and stable tie breakers', () => {
  const holdings = [{ symbol: 'HOLDING', name: '正式名稱' }, { symbol: 'ARCHIVE', isArchived: true }];
  const transactions = [
    transaction('HOLDING', '不可覆蓋'),
    transaction('ARCHIVE', '封存名稱'),
    transaction('HISTORY', '舊名稱', { id: 'z', updatedAt: '2025-01-01T00:00:00.000Z' }),
    transaction('HISTORY', '新名稱', { id: 'b', updatedAt: '2026-01-01T00:00:00.000Z' }),
    transaction('TIE', 'Beta', { id: 'b', updatedAt: '2026-01-01T00:00:00.000Z' }),
    transaction('TIE', 'Alpha', { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }),
    transaction('INVALID-DATE', '有效名稱', { id: 'valid', updatedAt: '2026-01-01T00:00:00.000Z' }),
    transaction('INVALID-DATE', '無效日期名稱', { id: 'invalid', updatedAt: 'not-a-date' })
  ];
  const bySymbol = Object.fromEntries(dividendAssetReferenceOptions(holdings, transactions).map(option => [option.symbol, option]));
  assert.equal(bySymbol.HOLDING.name, '正式名稱');
  assert.equal(bySymbol.ARCHIVE.name, '封存名稱');
  assert.equal(bySymbol.HISTORY.name, '新名稱');
  assert.equal(bySymbol.TIE.name, 'Alpha');
  assert.equal(bySymbol['INVALID-DATE'].name, '有效名稱');
});

test('is deterministic across input order and preserves unknown symbols without metadata inference', () => {
  const holdings = [{ symbol: 'B', name: 'B' }, { symbol: 'A', name: 'A', isArchived: true }];
  const transactions = [transaction(' 0050 '), transaction('X-UNKNOWN', '外部快照'), transaction('OLD', '舊名', { updatedAt: '2024-01-01T00:00:00.000Z' }), transaction('OLD', '新名', { updatedAt: '2025-01-01T00:00:00.000Z' })];
  const first = dividendAssetReferenceOptions(holdings, transactions);
  const second = dividendAssetReferenceOptions([...holdings].reverse(), [...transactions].reverse());
  assert.deepEqual(second, first);
  assert.deepEqual(first.map(option => option.symbol), ['B', 'A', '0050', 'OLD', 'X-UNKNOWN']);
  assert.equal(first.find(option => option.symbol === '0050')?.name, undefined, 'adapter must not consult SYMBOL_NAMES');
  assert.equal(first.find(option => option.symbol === 'X-UNKNOWN')?.name, '外部快照');
});

test('Dividend Center renders exact active, archived, historical, and unspecified option labels from fixture inputs', () => {
  const holdings = [{ symbol: '00631L', name: '元大台灣50正2' }, { symbol: 'TEST-ARCHIVED', name: '封存測試資產', isArchived: true }];
  const transactions = [transaction('00895', '富邦未來車', { id: 'preview-historical-dividend-00895' })];
  const before = JSON.stringify({ holdings, transactions });
  const options = dividendAssetReferenceOptions(holdings, transactions);
  const markup = renderToStaticMarkup(createElement(DividendAssetReferenceSelect, { value: '', options, onChange: () => undefined }));
  assert.match(markup, /<option value=""(?: selected="")?>未指定資產<\/option>/);
  assert.match(markup, /<option value="00631L">00631L 元大台灣50正2<\/option>/);
  assert.doesNotMatch(markup, /00631L 元大台灣50正2（歷史紀錄）/);
  assert.match(markup, /<option value="TEST-ARCHIVED">TEST-ARCHIVED 封存測試資產（已清倉）<\/option>/);
  assert.match(markup, /<option value="00895">00895 富邦未來車（歷史紀錄）<\/option>/);
  assert.equal(holdings.some(holding => holding.symbol === '00895'), false);
  assert.equal(holdings.length, 2);
  assert.equal(JSON.stringify({ holdings, transactions }), before);
});

test('Dividend Center consumes the adapter and Preview injects the historical fixture into transactions only', () => {
  const page = readFileSync(new URL('../src/pages/DividendCenterPage.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(page, /dividendAssetReferenceOptions\(holdings, transactions\)/);
  assert.match(page, /assetOptions\.find\(item => item\.symbol === symbol\)/);
  assert.match(page, /<DividendAssetReferenceSelect value=\{assetSymbol\} options=\{assetOptions\} onChange=\{selectAsset\} \/>/);
  assert.match(app, /PREVIEW_HISTORICAL_DIVIDEND_FIXTURE/);
  assert.match(app, /previewFixtureMode !== 'historical-dividend'/);
  assert.match(app, /transactions: \[\.\.\.current\.transactions, fixture\]/);
  assert.doesNotMatch(app.match(/PREVIEW_HISTORICAL_DIVIDEND_FIXTURE[\s\S]{0,900}/)?.[0] || '', /holdings:/);
  assert.match(app, /isArchived: true, targetWeight: 0/);
  assert.match(app, /return \{ \.\.\.s, holdings: safeHoldings\(s\.holdings\)\.map/);
});
