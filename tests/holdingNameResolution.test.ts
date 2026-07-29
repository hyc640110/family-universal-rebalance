import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { SYMBOL_NAMES } from '../src/lib/rebalanceOrderHelper';
import {
  TAIWAN_SYMBOL_RE,
  isTaiwanSymbol,
  pickName,
  quoteNameFields,
  resolveSymbolName,
  sanitizeName
} from '../src/lib/holdingNameResolution';

// UR-TODO-005 Phase 1 read-only investigation flagged '00685L' (leveraged ETF, digit+letter suffix)
// and '00895' (plain digit ETF) as the two symbols this project wants name-persistence confidence
// for. sanitizeHolding() itself stays in App.tsx (see holdingNameResolution.ts's own file comment
// for why), so these tests exercise the exact pure name-resolution chain it calls into, with those
// two symbols as first-class cases rather than incidental sample data.

test('TAIWAN_SYMBOL_RE／isTaiwanSymbol 接受 00685L（數字＋字母後綴）與 00895（純數字）', () => {
  assert.equal(TAIWAN_SYMBOL_RE.test('00685L'), true);
  assert.equal(TAIWAN_SYMBOL_RE.test('00895'), true);
  assert.equal(isTaiwanSymbol('00685l'), true); // normalizeSymbol upper-cases before testing
  assert.equal(isTaiwanSymbol(' 00895 '), true); // normalizeSymbol trims whitespace
});

test('TAIWAN_SYMBOL_RE 拒絕過長字母後綴、缺少數字或空白等無效格式', () => {
  for (const invalid of ['ABCDE', '', '   ', '685L', '00685LLLL', '00895.US']) {
    assert.equal(isTaiwanSymbol(invalid), false, `expected ${JSON.stringify(invalid)} to be invalid`);
  }
  assert.equal(isTaiwanSymbol('00895.TW'), true);
  assert.equal(isTaiwanSymbol('00685L.TWO'), true);
});

test('sanitizeName 去除前後空白，null／undefined／非字串一律視為空字串', () => {
  assert.equal(sanitizeName('  富邦未來車  '), '富邦未來車');
  assert.equal(sanitizeName(null), '');
  assert.equal(sanitizeName(undefined), '');
  assert.equal(sanitizeName(123), '123');
  assert.equal(sanitizeName('   '), '');
});

test('pickName 回傳第一個非空字串，跳過空白／null／undefined，不修改輸入', () => {
  assert.equal(pickName('', '  ', null, undefined, '群益臺灣加權正2', '富邦未來車'), '群益臺灣加權正2');
  assert.equal(pickName(undefined, null, ''), '');
  assert.equal(pickName('第一筆'), '第一筆');
});

test('quoteNameFields 從常見報價回應欄位（含巢狀 raw.chart.result[0].meta）取出候選名稱', () => {
  const flatShape = { shortName: '群益臺灣加權正2' };
  assert.ok(quoteNameFields(flatShape).includes('群益臺灣加權正2'));

  const nestedMetaShape = { raw: { chart: { result: [{ meta: { longName: '富邦未來車' } }] } } };
  assert.ok(quoteNameFields(nestedMetaShape).includes('富邦未來車'));

  assert.deepEqual(quoteNameFields(null).filter(Boolean), []);
  assert.deepEqual(quoteNameFields(undefined).filter(Boolean), []);
  assert.deepEqual(quoteNameFields('not-an-object').filter(Boolean), []);
});

test('resolveSymbolName：00685L／00895 在完全沒有其他來源時，回傳內建 SYMBOL_NAMES 的正確中文名稱', () => {
  assert.equal(resolveSymbolName('00685L'), SYMBOL_NAMES['00685L']);
  assert.equal(resolveSymbolName('00685L'), '群益臺灣加權正2');
  assert.equal(resolveSymbolName('00895'), SYMBOL_NAMES['00895']);
  assert.equal(resolveSymbolName('00895'), '富邦未來車');
});

test('resolveSymbolName：既有持久化名稱（第一個非空來源）優先於 SYMBOL_NAMES，不會被覆蓋', () => {
  assert.equal(resolveSymbolName('00685L', '使用者自訂名稱'), '使用者自訂名稱');
  assert.equal(resolveSymbolName('00895', '使用者自訂名稱'), '使用者自訂名稱');
});

test('resolveSymbolName：空字串或 undefined 來源會被跳過，不會把名稱洗成空字串，仍落回 SYMBOL_NAMES', () => {
  assert.equal(resolveSymbolName('00685L', ''), '群益臺灣加權正2');
  assert.equal(resolveSymbolName('00685L', undefined), '群益臺灣加權正2');
  assert.equal(resolveSymbolName('00895', '   '), '富邦未來車');
  assert.equal(resolveSymbolName('00895', undefined, null), '富邦未來車');
});

test('resolveSymbolName：報價來源（第一個候選）比既有持久化名稱優先，模擬 Worker 更新股價流程', () => {
  // 呼叫慣例為 resolveSymbolName(symbol, liveQuoteName, persistedName, ...)：報價名稱在前。
  assert.equal(resolveSymbolName('00685L', 'Worker 回傳的最新名稱', '舊的持久化名稱'), 'Worker 回傳的最新名稱');
  // 但若報價名稱為空（Worker 失敗或欄位缺失），改採持久化名稱，而非落到 SYMBOL_NAMES 或代碼。
  assert.equal(resolveSymbolName('00685L', '', '舊的持久化名稱'), '舊的持久化名稱');
});

test('resolveSymbolName：未知代號（不在 SYMBOL_NAMES）且無其他來源時，回傳代號本身，不回傳空字串', () => {
  assert.equal(resolveSymbolName('09999Z'), '09999Z');
  assert.equal(resolveSymbolName('09999Z', ''), '09999Z');
});

test('resolveSymbolName 為 deterministic 且不 mutate 輸入', () => {
  const sources = ['', undefined, '  '];
  const snapshot = JSON.stringify(sources);
  const first = resolveSymbolName('00895', ...sources);
  const second = resolveSymbolName('00895', ...sources);
  assert.equal(first, second);
  assert.equal(JSON.stringify(sources), snapshot);
});

test('App.tsx 已改為從 holdingNameResolution 匯入，未重複定義同一份邏輯（characterization guard）', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /from '\.\/lib\/holdingNameResolution'/);
  assert.doesNotMatch(app, /const TAIWAN_SYMBOL_RE = /);
  assert.doesNotMatch(app, /const pickName = /);
  assert.doesNotMatch(app, /const sanitizeName = /);
  assert.doesNotMatch(app, /const quoteNameFields = /);
  assert.doesNotMatch(app, /const resolveSymbolName = /);
});
