import assert from 'node:assert/strict';
import test from 'node:test';
import { getDipAlertRows, normalizeDipAlertSetting, type DipAlertSetting } from '../src/lib/dipAlertEngine';
import type { OrderHelperRow, SymbolCode } from '../src/lib/rebalanceOrderHelper';

// V7.0B sub-PR 5a (UR-TODO-008) establishes these as characterization tests for getDipAlertRows BEFORE any
// investableCash / funding-eligibility wiring (013 §14.2), locking in the existing price-only dip signal behavior
// (013 §14.1: "Dip Signal 是市場或價格條件訊號，不是資金資格") so sub-PR 5b's diff would be limited to intentional,
// reviewable changes instead of silent regressions. This mirrors the sub-PR 4a approach for getOrderSuggestions:
// dipAlertRows was moved out of src/App.tsx into src/lib/dipAlertEngine.ts as a pure relocation (no logic change)
// specifically so this file can import and exercise the real production function — App.tsx cannot be imported by
// tests/*.test.ts at all, since it (and its ./constants/appInfo import) reference import.meta.env at module scope,
// a Vite-only global that throws under the plain Node ESM runtime tsx --test uses.

const NOW = '2026-07-25T00:00:00.000Z';

const stock = (symbol: string, price: number, quoteName = symbol): OrderHelperRow => ({
  symbol, shares: 1, avgCost: price, assetClass: 'growth', targetWeight: 0,
  quote: { symbol, name: quoteName, price, previousClose: null, previousCloseTrusted: false, change: null, changePct: null, volume: 0, source: '測試報價', updatedAt: NOW },
  marketValue: price
});

const setting = (overrides: Partial<DipAlertSetting> = {}): DipAlertSetting => ({ enabled: false, referencePrice: 0, thresholdPct: -10, ...overrides });

test('is deterministic and does not mutate rows, quotes or dipAlerts', () => {
  const rows = [stock('AAA', 90)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts: Record<SymbolCode, DipAlertSetting> = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -5 }) };
  const before = structuredClone({ rows, quotes, dipAlerts });
  const first = getDipAlertRows(rows, quotes, dipAlerts);
  const second = getDipAlertRows(rows, quotes, dipAlerts);
  assert.deepEqual(first, second);
  assert.deepEqual({ rows, quotes, dipAlerts }, before);
});

test('disabled setting: status is 未啟用 and triggered is false regardless of drawdown', () => {
  const rows = [stock('AAA', 50)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: false, referencePrice: 100, thresholdPct: -5 }) };
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  // 50 vs 100 reference is a -50% drawdown, well past the -5% threshold, but enabled=false must still win.
  assert.equal(row.status, '未啟用');
  assert.equal(row.triggered, false);
  assert.equal(row.drawdownPct, -50);
});

test('enabled but no reference price set: drawdownPct is null and status is 尚未設定有效波段最高價', () => {
  const rows = [stock('AAA', 90)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 0, thresholdPct: -5 }) };
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, null);
  assert.equal(row.status, '尚未設定有效波段最高價');
  assert.equal(row.triggered, false);
});

test('enabled with reference price but non-positive current price: drawdownPct is null (price <= 0 short-circuits)', () => {
  const rows = [stock('AAA', 0)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -5 }) };
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.price, 0);
  assert.equal(row.drawdownPct, null);
  assert.equal(row.status, '尚未設定有效波段最高價');
  assert.equal(row.triggered, false);
});

test('drawdown beyond threshold: triggered true, status 已達逢低加碼觀察條件，可列入加碼觀察', () => {
  const rows = [stock('AAA', 89)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  // (89 - 100) / 100 * 100 = -11%, past the -10% threshold.
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -11);
  assert.equal(row.triggered, true);
  assert.equal(row.status, '已達逢低加碼觀察條件，可列入加碼觀察');
});

test('drawdown exactly at threshold: triggered true (comparison is inclusive, <=)', () => {
  const rows = [stock('AAA', 90)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  // (90 - 100) / 100 * 100 = -10%, equal to the threshold.
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -10);
  assert.equal(row.triggered, true);
});

test('drawdown short of threshold: triggered false, status 尚未觸發', () => {
  const rows = [stock('AAA', 95)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  // (95 - 100) / 100 * 100 = -5%, not past the -10% threshold.
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -5);
  assert.equal(row.triggered, false);
  assert.equal(row.status, '尚未觸發');
});

test('price above reference (no drawdown): triggered false, status 尚未觸發', () => {
  const rows = [stock('AAA', 110)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, 10);
  assert.equal(row.triggered, false);
  assert.equal(row.status, '尚未觸發');
});

test('missing setting for a symbol falls back to defaultDipAlertSetting (disabled, -10% threshold)', () => {
  const rows = [stock('AAA', 50)];
  const quotes = { AAA: rows[0].quote };
  const [row] = getDipAlertRows(rows, quotes, {});
  assert.deepEqual(row.setting, { enabled: false, referencePrice: 0, thresholdPct: -10 });
  assert.equal(row.status, '未啟用');
  assert.equal(row.triggered, false);
});

test('undefined dipAlerts map falls back to defaultDipAlertSetting for every row', () => {
  const rows = [stock('AAA', 50), stock('BBB', 200)];
  const quotes = { AAA: rows[0].quote, BBB: rows[1].quote };
  const result = getDipAlertRows(rows, quotes, undefined);
  assert.equal(result.length, 2);
  for (const row of result) {
    assert.equal(row.setting.enabled, false);
    assert.equal(row.status, '未啟用');
  }
});

test('symbol is normalized (lowercase / whitespace) both for lookup and the returned row', () => {
  const rows = [stock(' aaa ', 89)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.symbol, 'AAA');
  assert.equal(row.triggered, true);
});

test('price prefers the quotes map over row.quote when both are present', () => {
  const rows = [stock('AAA', 100)];
  const quotes = { AAA: { ...rows[0].quote, price: 80 } };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.price, 80);
  assert.equal(row.drawdownPct, -20);
});

test('price falls back to row.quote when the symbol is absent from the quotes map', () => {
  const rows = [stock('AAA', 90)];
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = getDipAlertRows(rows, {}, dipAlerts);
  assert.equal(row.price, 90);
  assert.equal(row.drawdownPct, -10);
});

test('name prefers quote.name, then SYMBOL_NAMES, then falls back to the symbol itself', () => {
  const namedRows = [stock('AAA', 50, '自訂名稱')];
  const [namedRow] = getDipAlertRows(namedRows, { AAA: namedRows[0].quote }, {});
  assert.equal(namedRow.name, '自訂名稱');

  const knownSymbolRows = [stock('00662', 50, '')];
  const [knownSymbolRow] = getDipAlertRows(knownSymbolRows, { '00662': knownSymbolRows[0].quote }, {});
  assert.equal(knownSymbolRow.name, '富邦NASDAQ');

  const unknownSymbolRows = [stock('ZZZZ', 50, '')];
  const [unknownSymbolRow] = getDipAlertRows(unknownSymbolRows, { ZZZZ: unknownSymbolRows[0].quote }, {});
  assert.equal(unknownSymbolRow.name, 'ZZZZ');
});

test('multiple rows are computed independently and preserve input order', () => {
  const rows = [stock('AAA', 89), stock('BBB', 95), stock('CCC', 50)];
  const quotes = { AAA: rows[0].quote, BBB: rows[1].quote, CCC: rows[2].quote };
  const dipAlerts = {
    AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }),
    BBB: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }),
    CCC: setting({ enabled: false, referencePrice: 100, thresholdPct: -10 })
  };
  const result = getDipAlertRows(rows, quotes, dipAlerts);
  assert.deepEqual(result.map(row => row.symbol), ['AAA', 'BBB', 'CCC']);
  assert.deepEqual(result.map(row => row.triggered), [true, false, false]);
  assert.deepEqual(result.map(row => row.status), ['已達逢低加碼觀察條件，可列入加碼觀察', '尚未觸發', '未啟用']);
});

test('custom threshold is respected instead of the -10% default', () => {
  const rows = [stock('AAA', 97)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -2 }) };
  // -3% drawdown, past a custom -2% threshold even though it would not trip the -10% default.
  const [row] = getDipAlertRows(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -3);
  assert.equal(row.triggered, true);
});

test('normalizeDipAlertSetting clamps a negative referencePrice to 0, producing a null drawdown', () => {
  const normalized = normalizeDipAlertSetting({ enabled: true, referencePrice: -50, thresholdPct: -10 });
  assert.equal(normalized.referencePrice, 0);
  const rows = [stock('AAA', 90)];
  const [row] = getDipAlertRows(rows, { AAA: rows[0].quote }, { AAA: normalized });
  assert.equal(row.drawdownPct, null);
  assert.equal(row.status, '尚未設定有效波段最高價');
});
