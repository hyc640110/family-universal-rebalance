import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// UR-TODO-046 FX-F1A R12: TransactionList is defined inline inside App.tsx (not a standalone
// exported component), so this locks the opaque-placeholder JSX region as source-level regression
// guards; genuine interactive/rendered behavior is additionally confirmed via isolated Preview
// verification (see the FX-F1A Sprint report), matching this repo's existing precedent for
// asserting on App.tsx-embedded markup (see firebaseRetirementRegression.test.ts).
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

function extractOpaqueBlock(source: string): string {
  const start = source.indexOf('opaqueTransactions.length > 0 && <div className="transaction-opaque-list">');
  assert.notEqual(start, -1, 'opaque placeholder block must exist in TransactionList');
  const end = source.indexOf('</div>}', start);
  assert.notEqual(end, -1);
  return source.slice(start, end);
}

test('R12: opaque placeholder is only rendered when opaque records exist, and is visible (not hidden)', () => {
  const block = extractOpaqueBlock(app);
  assert.match(block, /opaqueTransactions\.length > 0/);
  assert.doesNotMatch(block, /display:\s*none|hidden(?!Fund)/i);
});

test('R12: opaque placeholder text never claims data loss or damage', () => {
  const block = extractOpaqueBlock(app);
  assert.match(block, /目前版本尚未支援的資料格式/);
  assert.match(block, /原始資料已安全保留/);
  assert.doesNotMatch(block, /遺失|損毀|損壞|遺漏/);
});

test('R12: opaque rows render no ordinary Edit control and no income/expense amount badge', () => {
  const block = extractOpaqueBlock(app);
  assert.doesNotMatch(block, /編輯/, '不得提供普通交易編輯器入口');
  assert.doesNotMatch(block, /money\(/, '不得把 payload 中未理解的金額顯示成已理解金額');
  assert.doesNotMatch(block, /transactionCategoryLabel|transactionStatusLabel/, '不得呈現收入／支出分類徽章');
});

test('R12: opaque rows delete through the dedicated confirmation handler, not the ordinary onDelete path', () => {
  const block = extractOpaqueBlock(app);
  assert.match(block, /onDeleteOpaque\(entry\.id\)/);
  assert.doesNotMatch(block, /\bonDelete\(/, '不得沿用普通交易的無確認刪除路徑');
});

/**
 * UR-TODO-046 FX-F2C-2: the handler now has nested `{ }` blocks (atomic-FX-delete branch vs.
 * generic F1A branch), so a naive first-`};` search truncates it — this walks brace depth from
 * the opening `=> {` to the matching close, the same technique used to correctly bound a
 * multi-branch function body regardless of how many `};`-shaped object literals it contains.
 */
function extractFunctionBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `signature not found: ${signature}`);
  const bodyStart = start + signature.length;
  let depth = 1;
  let index = bodyStart;
  while (depth > 0 && index < source.length) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;
    index += 1;
  }
  assert.equal(depth, 0, 'unbalanced braces while extracting function body');
  return source.slice(start, index);
}

test('R12: the opaque delete handler requires an explicit, irreversible-warning confirmation before mutating state (generic F1A path)', () => {
  const handler = extractFunctionBody(app, 'const deleteOpaqueTransaction = (id: string) => {');
  assert.match(handler, /window\.confirm\(/);
  assert.match(handler, /不可復原/);
  assert.match(handler, /永久移除/);
  // Every window.confirm() call in the handler must gate its own state mutation (an early return
  // on cancel), not merely be present somewhere nearby — checked for both branches (atomic FX
  // delete and the generic F1A fallback).
  const confirmMatches = [...handler.matchAll(/window\.confirm\(/g)];
  assert.equal(confirmMatches.length, 2, 'expects exactly one confirm for the FX branch and one for the generic branch');
  const firstConfirmIndex = handler.indexOf('window.confirm(');
  const firstSetStateIndex = handler.indexOf('setState(');
  assert.ok(firstConfirmIndex !== -1 && firstSetStateIndex !== -1 && firstConfirmIndex < firstSetStateIndex);
});

test('UR-TODO-046 FX-F2C-2: the opaque delete handler routes a valid FX conversion envelope to the atomic-delete confirmation text, not the generic one', () => {
  const handler = extractFunctionBody(app, 'const deleteOpaqueTransaction = (id: string) => {');
  assert.match(handler, /將一併刪除此換匯記錄及其兩筆關聯交易/);
  assert.match(handler, /buildFxConversionDeletion/);
});

test('TransactionList wires opaqueTransactions/onDeleteOpaque props from the top-level opaque state, not a derived/filtered subset', () => {
  const callSite = app.match(/<TransactionList[^>]*opaqueTransactions=\{state\.opaqueTransactions\}[^>]*onDeleteOpaque=\{deleteOpaqueTransaction\}[^>]*\/>/);
  assert.ok(callSite, 'TransactionList must receive the raw opaque collection and its dedicated delete handler');
});
