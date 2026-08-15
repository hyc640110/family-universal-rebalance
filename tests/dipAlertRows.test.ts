import assert from 'node:assert/strict';
import test from 'node:test';
import { getDipAlertRows, normalizeDipAlertSetting, type DipAlertLiquidityContext, type DipAlertSetting } from '../src/lib/dipAlertEngine';
import type { OrderHelperRow, SymbolCode } from '../src/lib/rebalanceOrderHelper';

// V7.0B sub-PR 5a (UR-TODO-008) established these as characterization tests for getDipAlertRows BEFORE any
// investableCash / funding-eligibility wiring (013 §14.2), locking in the existing price-only dip signal behavior
// (013 §14.1: "Dip Signal 是市場或價格條件訊號，不是資金資格") so sub-PR 5b's diff would be limited to intentional,
// reviewable changes instead of silent regressions. This mirrors the sub-PR 4a approach for getOrderSuggestions:
// dipAlertRows was moved out of src/App.tsx into src/lib/dipAlertEngine.ts as a pure relocation (no logic change)
// specifically so this file can import and exercise the real production function — App.tsx cannot be imported by
// tests/*.test.ts at all, since it (and its ./constants/appInfo import) reference import.meta.env at module scope,
// a Vite-only global that throws under the plain Node ESM runtime tsx --test uses.
//
// V7.0B sub-PR 5b (013 §14.2 狀態矩陣): getDipAlertRows now takes a 4th `liquidity: DipAlertLiquidityContext`
// parameter and derives a second, independent field `fundingStatus` from it. `run()` below defaults liquidity to a
// "happy path" (dataCompleteness: 'complete', safetyCashShortfall: 0, investableCash: a large positive number) so
// all 17 pre-existing sub-PR 5a tests below keep every original `triggered`/`status`/`drawdownPct` assertion
// byte-identical — none of them are a "deliberate behavior change"; they are only extended with a new, additive
// `fundingStatus` assertion (`'executable'` when triggered under the happy-path default, `'no-signal'` when not
// triggered — both are the natural, uneventful extension of the existing price-only outcome, not a change to it).
// This is itself the proof that sub-PR 5b honors the hard rule: a safety-cash shortfall or a zero investableCash
// must change `fundingStatus` only, never `triggered`. The "013 §14.2 status matrix" describe block further down is
// what actually proves the five-row matrix: each case deliberately varies dataCompleteness / safetyCashShortfall /
// investableCash away from the happy-path default and asserts `fundingStatus` tracks the matrix while `triggered`
// stays governed purely by price.

const NOW = '2026-07-25T00:00:00.000Z';

const stock = (symbol: string, price: number, quoteName = symbol): OrderHelperRow => ({
  symbol, shares: 1, avgCost: price, assetClass: 'growth', targetWeight: 0,
  quote: { symbol, name: quoteName, price, previousClose: null, previousCloseTrusted: false, change: null, changePct: null, volume: 0, source: '測試報價', updatedAt: NOW },
  marketValue: price
});

const setting = (overrides: Partial<DipAlertSetting> = {}): DipAlertSetting => ({ enabled: false, referencePrice: 0, thresholdPct: -10, highWaterMark: null, triggeredLevel: null, ...overrides });

const HAPPY_PATH_LIQUIDITY: DipAlertLiquidityContext = { investableCash: 1_000_000, dataCompleteness: 'complete', safetyCashShortfall: 0 };

function run(rows: OrderHelperRow[], quotes: Record<SymbolCode, ReturnType<typeof stock>['quote']>, dipAlerts: Record<SymbolCode, DipAlertSetting> | undefined, liquidityOverrides: Partial<DipAlertLiquidityContext> = {}) {
  return getDipAlertRows(rows, quotes, dipAlerts, { ...HAPPY_PATH_LIQUIDITY, ...liquidityOverrides });
}

test('is deterministic and does not mutate rows, quotes, dipAlerts or liquidity', () => {
  const rows = [stock('AAA', 90)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts: Record<SymbolCode, DipAlertSetting> = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -5 }) };
  const liquidity: DipAlertLiquidityContext = { ...HAPPY_PATH_LIQUIDITY };
  const before = structuredClone({ rows, quotes, dipAlerts, liquidity });
  const first = getDipAlertRows(rows, quotes, dipAlerts, liquidity);
  const second = getDipAlertRows(rows, quotes, dipAlerts, liquidity);
  assert.deepEqual(first, second);
  assert.deepEqual({ rows, quotes, dipAlerts, liquidity }, before);
});

test('disabled setting: status is 未啟用, triggered is false regardless of drawdown, fundingStatus is no-signal', () => {
  const rows = [stock('AAA', 50)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: false, referencePrice: 100, thresholdPct: -5 }) };
  const [row] = run(rows, quotes, dipAlerts);
  // 50 vs 100 reference is a -50% drawdown, well past the -5% threshold, but enabled=false must still win.
  assert.equal(row.status, '未啟用');
  assert.equal(row.triggered, false);
  assert.equal(row.drawdownPct, -50);
  assert.equal(row.fundingStatus, 'no-signal');
});

test('enabled but no reference price set: drawdownPct is null, status 尚未設定有效波段最高價, fundingStatus no-signal', () => {
  const rows = [stock('AAA', 90)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 0, thresholdPct: -5 }) };
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, null);
  assert.equal(row.status, '尚未設定有效波段最高價');
  assert.equal(row.triggered, false);
  assert.equal(row.fundingStatus, 'no-signal');
});

test('enabled with reference price but non-positive current price: drawdownPct is null (price <= 0 short-circuits), fundingStatus no-signal', () => {
  const rows = [stock('AAA', 0)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -5 }) };
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.price, 0);
  assert.equal(row.drawdownPct, null);
  assert.equal(row.status, '尚未設定有效波段最高價');
  assert.equal(row.triggered, false);
  assert.equal(row.fundingStatus, 'no-signal');
});

test('drawdown beyond threshold: triggered true, status 已達逢低加碼觀察條件，可列入加碼觀察, fundingStatus executable under happy-path liquidity', () => {
  const rows = [stock('AAA', 89)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  // (89 - 100) / 100 * 100 = -11%, past the -10% threshold.
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -11);
  assert.equal(row.triggered, true);
  assert.equal(row.status, '已達逢低加碼觀察條件，可列入加碼觀察');
  assert.equal(row.fundingStatus, 'executable');
});

test('drawdown exactly at threshold: triggered true (comparison is inclusive, <=), fundingStatus executable', () => {
  const rows = [stock('AAA', 90)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  // (90 - 100) / 100 * 100 = -10%, equal to the threshold.
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -10);
  assert.equal(row.triggered, true);
  assert.equal(row.fundingStatus, 'executable');
});

test('drawdown short of threshold: triggered false, status 尚未觸發, fundingStatus no-signal', () => {
  const rows = [stock('AAA', 95)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  // (95 - 100) / 100 * 100 = -5%, not past the -10% threshold.
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -5);
  assert.equal(row.triggered, false);
  assert.equal(row.status, '尚未觸發');
  assert.equal(row.fundingStatus, 'no-signal');
});

test('price above reference (no drawdown): triggered false, status 尚未觸發, fundingStatus no-signal', () => {
  const rows = [stock('AAA', 110)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, 10);
  assert.equal(row.triggered, false);
  assert.equal(row.status, '尚未觸發');
  assert.equal(row.fundingStatus, 'no-signal');
});

test('missing setting for a symbol falls back to defaultDipAlertSetting (disabled, -10% threshold), fundingStatus no-signal', () => {
  const rows = [stock('AAA', 50)];
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, {});
  // UR-TODO-057 sub-PR 2: defaultDipAlertSetting() additively grew two fields (highWaterMark/
  // triggeredLevel); this assertion is updated to match, not a behavior change to enabled/
  // referencePrice/thresholdPct themselves (still asserted identical below in the same test).
  assert.deepEqual(row.setting, { enabled: false, referencePrice: 0, thresholdPct: -10, highWaterMark: null, triggeredLevel: null });
  assert.equal(row.status, '未啟用');
  assert.equal(row.triggered, false);
  assert.equal(row.fundingStatus, 'no-signal');
});

test('undefined dipAlerts map falls back to defaultDipAlertSetting for every row, fundingStatus no-signal', () => {
  const rows = [stock('AAA', 50), stock('BBB', 200)];
  const quotes = { AAA: rows[0].quote, BBB: rows[1].quote };
  const result = run(rows, quotes, undefined);
  assert.equal(result.length, 2);
  for (const row of result) {
    assert.equal(row.setting.enabled, false);
    assert.equal(row.status, '未啟用');
    assert.equal(row.fundingStatus, 'no-signal');
  }
});

test('symbol is normalized (lowercase / whitespace) both for lookup and the returned row', () => {
  const rows = [stock(' aaa ', 89)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.symbol, 'AAA');
  assert.equal(row.triggered, true);
  assert.equal(row.fundingStatus, 'executable');
});

test('price prefers the quotes map over row.quote when both are present', () => {
  const rows = [stock('AAA', 100)];
  const quotes = { AAA: { ...rows[0].quote, price: 80 } };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.price, 80);
  assert.equal(row.drawdownPct, -20);
  assert.equal(row.fundingStatus, 'executable');
});

test('price falls back to row.quote when the symbol is absent from the quotes map', () => {
  const rows = [stock('AAA', 90)];
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };
  const [row] = run(rows, {}, dipAlerts);
  assert.equal(row.price, 90);
  assert.equal(row.drawdownPct, -10);
  assert.equal(row.fundingStatus, 'executable');
});

test('name prefers quote.name, then SYMBOL_NAMES, then falls back to the symbol itself', () => {
  const namedRows = [stock('AAA', 50, '自訂名稱')];
  const [namedRow] = run(namedRows, { AAA: namedRows[0].quote }, {});
  assert.equal(namedRow.name, '自訂名稱');

  const knownSymbolRows = [stock('00662', 50, '')];
  const [knownSymbolRow] = run(knownSymbolRows, { '00662': knownSymbolRows[0].quote }, {});
  assert.equal(knownSymbolRow.name, '富邦NASDAQ');

  const unknownSymbolRows = [stock('ZZZZ', 50, '')];
  const [unknownSymbolRow] = run(unknownSymbolRows, { ZZZZ: unknownSymbolRows[0].quote }, {});
  assert.equal(unknownSymbolRow.name, 'ZZZZ');
});

test('multiple rows are computed independently and preserve input order; triggered rows share one fundingStatus', () => {
  const rows = [stock('AAA', 89), stock('BBB', 95), stock('CCC', 50)];
  const quotes = { AAA: rows[0].quote, BBB: rows[1].quote, CCC: rows[2].quote };
  const dipAlerts = {
    AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }),
    BBB: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }),
    CCC: setting({ enabled: false, referencePrice: 100, thresholdPct: -10 })
  };
  const result = run(rows, quotes, dipAlerts);
  assert.deepEqual(result.map(row => row.symbol), ['AAA', 'BBB', 'CCC']);
  assert.deepEqual(result.map(row => row.triggered), [true, false, false]);
  assert.deepEqual(result.map(row => row.status), ['已達逢低加碼觀察條件，可列入加碼觀察', '尚未觸發', '未啟用']);
  assert.deepEqual(result.map(row => row.fundingStatus), ['executable', 'no-signal', 'no-signal']);
});

test('custom threshold is respected instead of the -10% default', () => {
  const rows = [stock('AAA', 97)];
  const quotes = { AAA: rows[0].quote };
  const dipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -2 }) };
  // -3% drawdown, past a custom -2% threshold even though it would not trip the -10% default.
  const [row] = run(rows, quotes, dipAlerts);
  assert.equal(row.drawdownPct, -3);
  assert.equal(row.triggered, true);
  assert.equal(row.fundingStatus, 'executable');
});

test('normalizeDipAlertSetting clamps a negative referencePrice to 0, producing a null drawdown', () => {
  const normalized = normalizeDipAlertSetting({ enabled: true, referencePrice: -50, thresholdPct: -10 });
  assert.equal(normalized.referencePrice, 0);
  const rows = [stock('AAA', 90)];
  const [row] = run(rows, { AAA: rows[0].quote }, { AAA: normalized });
  assert.equal(row.drawdownPct, null);
  assert.equal(row.status, '尚未設定有效波段最高價');
  assert.equal(row.fundingStatus, 'no-signal');
});

// V7.0B sub-PR 5b: 013 §14.2 五列狀態矩陣。每個案例都用一顆會觸發的跌幅訊號（-11%，thresholdPct -10%）搭配
// 不同的 liquidity context，只驗證 fundingStatus 隨矩陣變化，`triggered`／`status`（純價格訊號）在全部五列
// 保持完全相同 —— 這是本次子 PR 5b 最重要的紀律：訊號與資金資格必須分離。
const triggeringRow = () => stock('AAA', 89);
const triggeringDipAlerts = { AAA: setting({ enabled: true, referencePrice: 100, thresholdPct: -10 }) };

test('013 §14.2 matrix row 1: no signal — fundingStatus is no-signal regardless of liquidity (even when liquidity itself is bad)', () => {
  const rows = [stock('AAA', 95)]; // -5% drawdown, does not trip the -10% threshold — no signal.
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, triggeringDipAlerts, { dataCompleteness: 'insufficient', investableCash: 0, safetyCashShortfall: 50000 });
  assert.equal(row.triggered, false);
  assert.equal(row.status, '尚未觸發');
  assert.equal(row.fundingStatus, 'no-signal');
});

test('013 §14.2 matrix row 2: signal + data incomplete (dataCompleteness partial) — fundingStatus data-insufficient, triggered/status unaffected', () => {
  const rows = [triggeringRow()];
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, triggeringDipAlerts, { dataCompleteness: 'partial', investableCash: null, safetyCashShortfall: null });
  assert.equal(row.triggered, true);
  assert.equal(row.status, '已達逢低加碼觀察條件，可列入加碼觀察');
  assert.equal(row.fundingStatus, 'data-insufficient');
});

test('013 §14.2 matrix row 2: signal + data insufficient (dataCompleteness insufficient) — fundingStatus data-insufficient', () => {
  const rows = [triggeringRow()];
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, triggeringDipAlerts, { dataCompleteness: 'insufficient', investableCash: null, safetyCashShortfall: null });
  assert.equal(row.triggered, true);
  assert.equal(row.fundingStatus, 'data-insufficient');
});

test('013 §14.2 matrix row 2 (defensive edge case): dataCompleteness claims complete but investableCash/safetyCashShortfall are still null — treated as data-insufficient, never coerced to 0', () => {
  const rows = [triggeringRow()];
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, triggeringDipAlerts, { dataCompleteness: 'complete', investableCash: null, safetyCashShortfall: null });
  assert.equal(row.triggered, true);
  assert.equal(row.fundingStatus, 'data-insufficient');
});

test('013 §14.2 matrix row 3: signal + data complete + safety cash insufficient + investableCash 0 — fundingStatus safety-cash-priority', () => {
  const rows = [triggeringRow()];
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, triggeringDipAlerts, { dataCompleteness: 'complete', investableCash: 0, safetyCashShortfall: 12000 });
  assert.equal(row.triggered, true);
  assert.equal(row.status, '已達逢低加碼觀察條件，可列入加碼觀察');
  assert.equal(row.fundingStatus, 'safety-cash-priority');
});

test('013 §14.2 matrix row 4: signal + data complete + safety cash sufficient + investableCash 0 — fundingStatus observe-only', () => {
  const rows = [triggeringRow()];
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, triggeringDipAlerts, { dataCompleteness: 'complete', investableCash: 0, safetyCashShortfall: 0 });
  assert.equal(row.triggered, true);
  assert.equal(row.status, '已達逢低加碼觀察條件，可列入加碼觀察');
  assert.equal(row.fundingStatus, 'observe-only');
});

test('013 §14.2 matrix row 5: signal + data complete + safety cash sufficient + investableCash available — fundingStatus executable', () => {
  const rows = [triggeringRow()];
  const quotes = { AAA: rows[0].quote };
  const [row] = run(rows, quotes, triggeringDipAlerts, { dataCompleteness: 'complete', investableCash: 30000, safetyCashShortfall: 0 });
  assert.equal(row.triggered, true);
  assert.equal(row.status, '已達逢低加碼觀察條件，可列入加碼觀察');
  assert.equal(row.fundingStatus, 'executable');
});
