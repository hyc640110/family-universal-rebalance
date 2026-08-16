import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * DraftInput (src/App.tsx) is a shared, uncontrolled-while-editing numeric/text input reused
 * across the app: account balances (all 8 account types), holding shares/avgCost/dip-alert
 * reference price and threshold, the buy-only budget, the quote refresh interval, and the
 * rebalance threshold. Importing App.tsx directly is not viable under this repo's node/tsx test
 * runner (it and its dependency chain read `import.meta.env.*`, which only exists under Vite -
 * every other App.tsx-level characterization test in this suite, e.g.
 * v6DataRefreshMobileFormStability.test.ts, follows the same readFileSync+regex approach for the
 * same reason). This test anchors to the DraftInput function body itself, not any individual call
 * site, so every field that reuses the shared component - present or future - is covered by a
 * single assertion instead of needing its own dedicated test.
 */

const app = () => readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

function draftInputSource(): string {
  const source = app();
  const start = source.indexOf('function DraftInput(');
  assert.notEqual(start, -1, 'DraftInput function not found in App.tsx');
  const end = source.indexOf('\nfunction ', start + 1);
  assert.notEqual(end, -1, 'could not locate the end of the DraftInput function body');
  return source.slice(start, end);
}

test('DraftInput clears a literal displayed "0" on focus so the next digit replaces it instead of appending', () => {
  const fn = draftInputSource();
  assert.match(fn, /onFocus\s*=\s*\(\)\s*=>\s*\{[^}]*if\s*\(\s*draftRef\.current\s*===\s*'0'\s*\)\s*updateDraft\(''\)/,
    '取得焦點時，顯示字面 "0" 必須清空目前 draft，否則下一個按鍵會附加在 "0" 後面（例如變成 02、022）');
  assert.match(fn, /onFocus=\{onFocus\}/, 'input 必須實際掛上修正後的 onFocus handler，而非只是定義了未使用的函式');
});

test('DraftInput does not clear a non-zero value on focus, preserving normal edit behavior', () => {
  const fn = draftInputSource();
  // The guard must be specific to the literal string '0' - it must not clear on every focus,
  // which would break selecting/retyping an existing non-zero value.
  assert.doesNotMatch(fn, /onFocus\s*=\s*\(\)\s*=>\s*\{\s*editingRef\.current\s*=\s*true;\s*setEditing\(true\);\s*\}/,
    'onFocus 不應退回成永遠不清空的舊版本（沒有 0 判斷式）');
  assert.doesNotMatch(fn, /if\s*\(\s*draftRef\.current\s*\)\s*updateDraft\(''\)/,
    'onFocus 不應清空任何非空值，只能清空字面 "0"');
});

test('every existing DraftInput call site (account balance, holdings, buy-only budget, quote refresh interval, rebalance threshold) shares the same component, so the fix applies to all of them at once', () => {
  const source = app();
  const callSites = source.match(/<DraftInput\b/g) ?? [];
  // 帳戶餘額、總股數、成交均價、波段最高價（持股層級）、逢低提醒參考價／門檻、再平衡提醒門檻、
  // 只買不賣可用加碼預算、股價更新間隔秒數、起始日期欄位 —— 至少 9 個既有呼叫點，全部共用同一個
  // DraftInput，證明本次修正不需要、也不應該逐一在呼叫端補丁。
  assert.ok(callSites.length >= 9, `預期至少 9 個 DraftInput 呼叫點以證明是廣泛共用元件，實際找到 ${callSites.length} 個`);
  assert.match(source, /manualBalance: parsePositive\(value\) \* 10000/, '帳戶餘額欄位仍透過 DraftInput 的 onCommit 寫回');
  assert.match(source, /buyOnlyBudget: budgetFromWan\(value\)/, '只買不賣可用加碼預算欄位仍透過 DraftInput 的 onCommit 寫回');
});
