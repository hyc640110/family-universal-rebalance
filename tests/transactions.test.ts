import assert from 'node:assert/strict';
import test from 'node:test';
import { accountHasTransactions, createTransferTransaction, deriveTransactionAccountBalances, normalizeTransactionCategory, normalizeTransactions, transactionCashFlowSummary, transactionCategoryLabel, transactionSourceLabel, transactionStatusLabel, updateTransaction } from '../src/lib/transactions';

const accounts = [
  { id: 'a', currency: 'TWD', isActive: true },
  { id: 'b', currency: 'TWD', isActive: true },
  { id: 'usd', currency: 'USD', isActive: true },
  { id: 'inactive', currency: 'TWD', isActive: false }
];
const transfer = () => createTransferTransaction({ accountId: 'a', transferAccountId: 'b', status: 'posted', source: 'manual', amount: 50, currency: 'TWD', description: '搬錢', merchant: '', note: 'private note', occurredAt: '2026-01-01T00:00:00.000Z', excluded: false }, accounts, '2026-01-02T00:00:00.000Z');

test('normalizes transactions, keeps valid records when one record is broken, and protects account references', () => {
  const { transactions, skipped } = normalizeTransactions([
    { id: 'income', accountId: 'a', type: 'income', amount: 100, occurredAt: '2026-01-01', description: '薪資' },
    { id: 'transfer', accountId: 'a', transferAccountId: 'b', type: 'transfer', amount: 40, occurredAt: '2026-01-01' },
    { id: 'transfer', accountId: 'a', transferAccountId: 'b', type: 'transfer', amount: 20, occurredAt: '2026-01-02' },
    { accountId: 'a', transferAccountId: 'a', type: 'transfer', amount: 1 },
    { accountId: 'a', transferAccountId: 'usd', type: 'transfer', amount: 1 },
    null
  ], accounts, '2026-01-01T00:00:00.000Z');
  assert.equal(transactions.length, 3);
  assert.equal(skipped.length, 3);
  assert.notEqual(transactions[1].id, transactions[2].id, 'duplicate transaction IDs are repaired');
  assert.deepEqual(deriveTransactionAccountBalances(transactions), { a: 40, b: 60 });
  assert.deepEqual(transactionCashFlowSummary(transactions), { income: 100, expense: 0 });
  assert.equal(accountHasTransactions(transactions, 'a'), true);
  assert.equal(accountHasTransactions(transactions, 'b'), true, 'destination references also protect accounts');
});

test('transfer creation centrally rejects missing, invalid, inactive, same-account, zero, negative, and cross-currency accounts', () => {
  for (const patch of [
    { accountId: '', transferAccountId: 'b', amount: 1 }, { accountId: 'a', transferAccountId: '', amount: 1 },
    { accountId: 'a', transferAccountId: 'a', amount: 1 }, { accountId: 'a', transferAccountId: 'b', amount: 0 },
    { accountId: 'a', transferAccountId: 'b', amount: -1 }, { accountId: 'missing', transferAccountId: 'b', amount: 1 },
    { accountId: 'a', transferAccountId: 'missing', amount: 1 }, { accountId: 'a', transferAccountId: 'usd', amount: 1 },
    { accountId: 'inactive', transferAccountId: 'b', amount: 1 }
  ]) assert.throws(() => createTransferTransaction({ ...transfer(), ...patch }, accounts));
});

test('categories are stable English values, constrained by transaction type, and have Chinese presentation labels', () => {
  assert.equal(normalizeTransactionCategory('income', 'income-other'), 'income-other');
  assert.equal(normalizeTransactionCategory('income', 'expense-other'), 'income-other');
  assert.equal(normalizeTransactionCategory('expense', 'expense-other'), 'expense-other');
  assert.equal(normalizeTransactionCategory('expense', 'income-other'), 'expense-other');
  assert.equal(normalizeTransactionCategory('transfer', 'expense-other'), 'transfer-account');
  assert.equal(normalizeTransactionCategory('adjustment', 'expense-other'), 'adjustment-other');
  assert.equal(transactionCategoryLabel('expense-other'), '其他支出');
  assert.equal(transactionCategoryLabel('income-other'), '其他收入');
  assert.equal(transactionCategoryLabel('transfer-account'), '帳戶轉帳');
  assert.equal(transactionStatusLabel('posted'), '已入帳');
  assert.equal(transactionStatusLabel('pending'), '待入帳');
  assert.equal(transactionStatusLabel('void'), '已作廢');
  assert.equal(transactionSourceLabel('manual'), '手動建立');
});

test('transfer edits preserve ID, update fingerprint only for identifying fields, and clear destination on type conversions', () => {
  const base = transfer();
  const amount = updateTransaction(base, { amount: 60 }, accounts);
  assert.equal(amount.id, base.id);
  assert.notEqual(amount.fingerprint, base.fingerprint);
  assert.equal(updateTransaction(base, { accountId: 'b', transferAccountId: 'a' }, accounts).accountId, 'b');
  assert.equal(updateTransaction(base, { accountId: 'b', transferAccountId: 'a' }, accounts).transferAccountId, 'a');
  assert.equal(updateTransaction(base, { occurredAt: '2026-01-03T00:00:00.000Z' }, accounts).occurredAt.slice(0, 10), '2026-01-03');
  assert.equal(updateTransaction(amount, { note: 'only note changed' }, accounts).fingerprint, amount.fingerprint);
  assert.notEqual(updateTransaction(amount, { description: 'different description' }, accounts).fingerprint, amount.fingerprint);
  assert.equal(updateTransaction(base, { type: 'expense' }, accounts).transferAccountId, undefined);
  assert.equal(updateTransaction(base, { type: 'income' }, accounts).transferAccountId, undefined);
  assert.equal(updateTransaction(base, { type: 'expense', categoryId: 'income-other' }, accounts).categoryId, 'expense-other');
  assert.equal(updateTransaction(base, { type: 'income', categoryId: 'expense-other' }, accounts).categoryId, 'income-other');
  assert.equal(updateTransaction(base, { categoryId: 'expense-other' }, accounts).categoryId, 'transfer-account');
  assert.throws(() => updateTransaction(base, { transferAccountId: 'a' }, accounts));
  assert.throws(() => updateTransaction(base, { transferAccountId: 'usd' }, accounts));
  const income = updateTransaction(base, { type: 'income' }, accounts);
  assert.throws(() => updateTransaction(income, { type: 'transfer' }, accounts), 'income to transfer requires destination');
});

test('transfer lifecycle applies both sides together and never contributes to cash-flow statistics', () => {
  const base = transfer();
  assert.deepEqual(deriveTransactionAccountBalances([base]), { a: -50, b: 50 });
  assert.deepEqual(deriveTransactionAccountBalances([updateTransaction(base, { status: 'pending' }, accounts)]), {});
  assert.deepEqual(deriveTransactionAccountBalances([updateTransaction(base, { status: 'void' }, accounts)]), {});
  assert.deepEqual(deriveTransactionAccountBalances([updateTransaction(base, { excluded: true }, accounts)]), {});
  assert.deepEqual(deriveTransactionAccountBalances([updateTransaction(base, { status: 'void' }, accounts), updateTransaction(base, { excluded: false, status: 'posted' }, accounts)]), { a: -50, b: 50 });
  assert.deepEqual(deriveTransactionAccountBalances([]), {}, 'deleting the single transaction removes both sides together');
  assert.deepEqual(transactionCashFlowSummary([base]), { income: 0, expense: 0 });
});

test('storage, Firebase, and JSON backup normalization preserve legal transfers and reject illegal transfer edge cases', () => {
  const legal = transfer();
  for (const payload of [[legal], JSON.parse(JSON.stringify([legal])), [{ ...legal, status: 'pending', excluded: true }]]) {
    const result = normalizeTransactions(payload, accounts, '2026-01-02T00:00:00.000Z');
    assert.equal(result.transactions.length, 1);
    assert.equal(result.transactions[0].transferAccountId, 'b');
  }
  const result = normalizeTransactions([
    legal,
    { ...legal, id: 'same-fingerprint', fingerprint: legal.fingerprint },
    { ...legal, id: 'missing-destination', transferAccountId: undefined },
    { ...legal, id: 'invalid-destination', transferAccountId: 'nope' },
    { ...legal, id: 'same-account', transferAccountId: 'a' },
    { ...legal, id: 'cross-currency', transferAccountId: 'usd' }
  ], accounts, '2026-01-02T00:00:00.000Z');
  assert.equal(result.transactions.length, 2, 'fingerprints are not primary keys');
  assert.equal(result.transactions[0].type, 'transfer', 'illegal transfers are skipped, never converted');
  assert.equal(result.skipped.length, 4);
});

test('dividend metadata is optional, preserved across storage normalization, validates tax arithmetic, and does not change fingerprints by itself', () => {
  const base = normalizeTransactions([{ id: 'dividend', accountId: 'a', type: 'income', status: 'posted', amount: 90, currency: 'TWD', categoryId: 'income-dividend', occurredAt: '2026-07-01T00:00:00.000Z', assetSymbol: '0050', assetName: '元大台灣50', grossAmount: 100, withholdingTax: 10 }], accounts, '2026-07-02T00:00:00.000Z').transactions[0];
  assert.equal(base.amount, 90);
  assert.equal(base.assetSymbol, '0050');
  assert.equal(base.assetName, '元大台灣50');
  assert.equal(base.grossAmount, 100);
  assert.equal(base.withholdingTax, 10);
  assert.deepEqual(normalizeTransactions(JSON.parse(JSON.stringify([base])), accounts, '2026-07-02T00:00:00.000Z').transactions[0], base, 'localStorage, Firebase, and JSON backup all use the same normalizer');
  const renamed = updateTransaction(base, { assetName: '歷史名稱快照' }, accounts, '2026-07-03T00:00:00.000Z');
  assert.equal(renamed.fingerprint, base.fingerprint, 'metadata must not change existing duplicate identity rules');
  assert.throws(() => updateTransaction(base, { grossAmount: 10, withholdingTax: 11 }, accounts));
  const ordinaryIncome = updateTransaction(base, { categoryId: 'income-other' }, accounts);
  assert.equal(ordinaryIncome.assetSymbol, undefined, 'only income-dividend may retain dividend metadata');
});
