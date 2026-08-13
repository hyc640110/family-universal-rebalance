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

test('R12: the opaque delete handler requires an explicit, irreversible-warning confirmation before mutating state', () => {
  const handlerStart = app.indexOf('const deleteOpaqueTransaction = (id: string) => {');
  assert.notEqual(handlerStart, -1);
  const handlerEnd = app.indexOf('};', handlerStart);
  const handler = app.slice(handlerStart, handlerEnd);
  assert.match(handler, /window\.confirm\(/);
  assert.match(handler, /不可復原/);
  assert.match(handler, /永久移除/);
  // The confirm() call must gate the state mutation (an early return on cancel), not merely be
  // present somewhere nearby.
  const confirmIndex = handler.indexOf('window.confirm(');
  const setStateIndex = handler.indexOf('setState(');
  assert.ok(confirmIndex !== -1 && setStateIndex !== -1 && confirmIndex < setStateIndex);
});

test('TransactionList wires opaqueTransactions/onDeleteOpaque props from the top-level opaque state, not a derived/filtered subset', () => {
  const callSite = app.match(/<TransactionList[^>]*opaqueTransactions=\{state\.opaqueTransactions\}[^>]*onDeleteOpaque=\{deleteOpaqueTransaction\}[^>]*\/>/);
  assert.ok(callSite, 'TransactionList must receive the raw opaque collection and its dedicated delete handler');
});
