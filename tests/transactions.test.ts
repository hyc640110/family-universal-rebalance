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

test('只保留完整且明確的投資交易契約；舊類別與文字不得被升格為買賣', () => {
  const result = normalizeTransactions([
    {
      id: 'formal-buy', accountId: 'a', type: 'expense', status: 'posted', amount: 1000, currency: 'TWD', categoryId: 'expense-investment', occurredAt: '2026-08-09T00:00:00.000Z',
      investmentAttribution: { kind: 'trade', tradeId: 'broker-20260809-1', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'a' }
    },
    {
      id: 'formal-sell', accountId: 'a', type: 'income', status: 'posted', amount: 1200, currency: 'TWD', categoryId: 'income-other', occurredAt: '2026-08-09T00:00:00.000Z',
      investmentAttribution: { kind: 'trade', tradeId: 'broker-20260809-2', side: 'sell', assetSymbol: '0050', quantity: 10, settlementAmount: 1200, currency: 'TWD', cashAccountId: 'a' }
    },
    {
      id: 'formal-fee', accountId: 'a', type: 'expense', status: 'posted', amount: 20, currency: 'TWD', categoryId: 'expense-investment', occurredAt: '2026-08-09T00:00:00.000Z',
      investmentAttribution: { kind: 'cost', tradeId: 'broker-20260809-1', costId: 'fee-1', costType: 'fee', settlementCostTreatment: 'independent', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'a' }
    },
    { id: 'legacy-investment', accountId: 'a', type: 'expense', amount: 1000, categoryId: 'expense-investment', description: '買進 0050' },
    { id: 'legacy-income', accountId: 'a', type: 'income', amount: 1200, categoryId: 'income-other', description: '賣出 0050' },
    {
      id: 'incomplete-trade', accountId: 'a', type: 'expense', amount: 1000, categoryId: 'expense-investment',
      investmentAttribution: { kind: 'trade', tradeId: 'missing-quantity', side: 'buy', assetSymbol: '0050', settlementAmount: 1000, currency: 'TWD', cashAccountId: 'a' }
    }
  ], accounts, '2026-08-09T00:00:00.000Z');

  assert.deepEqual(result.transactions.map(transaction => transaction.investmentAttribution), [
    { kind: 'trade', tradeId: 'broker-20260809-1', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'a' },
    { kind: 'trade', tradeId: 'broker-20260809-2', side: 'sell', assetSymbol: '0050', quantity: 10, settlementAmount: 1200, currency: 'TWD', cashAccountId: 'a' },
    { kind: 'cost', tradeId: 'broker-20260809-1', costId: 'fee-1', costType: 'fee', settlementCostTreatment: 'independent', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'a' },
    undefined,
    undefined,
    undefined
  ]);
  const restored = normalizeTransactions(JSON.parse(JSON.stringify(result.transactions)), accounts, '2026-08-09T00:00:00.000Z');
  assert.deepEqual(restored.transactions, result.transactions, 'localStorage、Firebase 與 JSON backup 共用的 normalizer 必須完整保留正式投資交易契約');
});

test('投資成本的 settlement 語意與 cash movement linkage 可加法式 round-trip，legacy 缺欄位不會被升格', () => {
  const raw = [{
    id: 'included-tax', accountId: 'a', type: 'expense', status: 'posted', amount: 10, currency: 'TWD', categoryId: 'expense-investment', occurredAt: '2026-08-09T00:00:00.000Z',
    investmentAttribution: { kind: 'cost', tradeId: 'trade-1', costId: 'tax-1', costType: 'tax', settlementCostTreatment: 'included', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'a' }
  }, {
    id: 'cash-movement', accountId: 'a', type: 'expense', status: 'posted', amount: 1000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-09T00:00:00.000Z',
    investmentAttribution: { kind: 'cash-movement', cashMovementId: 'cash-1', direction: 'decrease', currency: 'TWD', cashAccountId: 'a' }
  }, {
    id: 'legacy-cost', accountId: 'a', type: 'expense', status: 'posted', amount: 20, currency: 'TWD', categoryId: 'expense-investment', occurredAt: '2026-08-09T00:00:00.000Z',
    investmentAttribution: { kind: 'cost', tradeId: 'trade-1', costType: 'fee', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'a' }
  }];
  const normalized = normalizeTransactions(raw, accounts, '2026-08-09T00:00:00.000Z').transactions;

  assert.deepEqual(normalizeTransactions(JSON.parse(JSON.stringify(normalized)), accounts, '2026-08-09T00:00:00.000Z').transactions, normalized, 'localStorage、Firebase 與 JSON backup 共用 normalizer，必須保留明確新欄位');
  assert.deepEqual(normalized.map(transaction => transaction.investmentAttribution), [
    { kind: 'cost', tradeId: 'trade-1', costId: 'tax-1', costType: 'tax', settlementCostTreatment: 'included', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'a' },
    { kind: 'cash-movement', cashMovementId: 'cash-1', direction: 'decrease', currency: 'TWD', cashAccountId: 'a' },
    { kind: 'cost', tradeId: 'trade-1', costType: 'fee', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'a' }
  ]);
});

test('Loan repayment contract 是加法式 round-trip；不完整或 component 合計不符資料一律不升格', () => {
  const raw = [{
    id: 'loan-payment', accountId: 'a', type: 'expense', status: 'posted', amount: 20_000, currency: 'TWD', categoryId: 'expense-housing', occurredAt: '2026-08-09T00:00:00.000Z',
    loanAttribution: {
      kind: 'repayment', paymentId: 'payment-1', loanId: 'loan-a', cashAccountId: 'a', currency: 'TWD', settlementAmount: 20_000,
      components: [{ componentId: 'principal-1', type: 'principal', amount: 15_000 }, { componentId: 'interest-1', type: 'interest', amount: 5_000 }]
    }
  }, {
    id: 'loan-invalid', accountId: 'a', type: 'expense', status: 'posted', amount: 20_000, currency: 'TWD', categoryId: 'expense-housing', occurredAt: '2026-08-09T00:00:00.000Z',
    loanAttribution: {
      kind: 'repayment', paymentId: 'payment-invalid', loanId: 'loan-a', cashAccountId: 'a', currency: 'TWD', settlementAmount: 20_000,
      components: [{ componentId: 'principal-1', type: 'principal', amount: 19_999 }]
    }
  }, {
    id: 'legacy-loan', accountId: 'a', type: 'expense', status: 'posted', amount: 20_000, currency: 'TWD', categoryId: 'expense-housing', description: '房貸', occurredAt: '2026-08-09T00:00:00.000Z'
  }];
  const normalized = normalizeTransactions(raw, accounts, '2026-08-09T00:00:00.000Z').transactions;

  assert.deepEqual(normalized[0]!.loanAttribution, raw[0]!.loanAttribution);
  assert.equal(normalized[1]!.loanAttribution, undefined);
  assert.equal(normalized[2]!.loanAttribution, undefined);
  assert.equal(updateTransaction(normalized[0]!, { note: '保留已驗證契約' }, accounts, '2026-08-10T00:00:00.000Z').loanAttribution?.paymentId, 'payment-1');
  assert.deepEqual(normalizeTransactions(JSON.parse(JSON.stringify(normalized)), accounts, '2026-08-09T00:00:00.000Z').transactions, normalized, 'localStorage、Firebase 與 JSON Backup 共用 normalizer，僅保留完整明示的 Loan contract');
});

// UR-TODO-046 FX-F2C-1: additive FX conversion leg metadata — normalization, persistence round-trip,
// account balance and cash-flow guard. No producer/opaque envelope exists yet; these fixtures are
// hand-authored to characterize the consumer-guard contract in isolation.

test('FX conversion leg metadata: valid source/destination metadata is preserved, invalid role or empty conversionId is dropped, ordinary transactions unaffected', () => {
  const raw = [
    { id: 'fx-source', accountId: 'a', type: 'expense', status: 'posted', amount: 32000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'source' } },
    { id: 'fx-destination', accountId: 'usd', type: 'income', status: 'posted', amount: 1000, currency: 'USD', categoryId: 'income-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'destination' } },
    { id: 'fx-invalid-role', accountId: 'a', type: 'expense', status: 'posted', amount: 1000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-2', role: 'both' } },
    { id: 'fx-empty-conversion-id', accountId: 'a', type: 'expense', status: 'posted', amount: 1000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: '', role: 'source' } },
    { id: 'fx-malformed-shape', accountId: 'a', type: 'expense', status: 'posted', amount: 1000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: 'not-an-object' },
    { id: 'ordinary', accountId: 'a', type: 'expense', status: 'posted', amount: 500, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z' }
  ];
  const { transactions, skipped } = normalizeTransactions(raw, accounts, '2026-08-13T00:00:00.000Z');
  assert.equal(skipped.length, 0, 'malformed fxConversionLeg must not become skipped/opaque — only the metadata itself is dropped');
  const byId = new Map(transactions.map(t => [t.id, t]));
  assert.deepEqual(byId.get('fx-source')?.fxConversionLeg, { conversionId: 'conv-1', role: 'source' });
  assert.deepEqual(byId.get('fx-destination')?.fxConversionLeg, { conversionId: 'conv-1', role: 'destination' });
  assert.equal(byId.get('fx-invalid-role')?.fxConversionLeg, undefined, 'invalid role is dropped');
  assert.equal(byId.get('fx-empty-conversion-id')?.fxConversionLeg, undefined, 'empty conversionId is dropped');
  assert.equal(byId.get('fx-malformed-shape')?.fxConversionLeg, undefined, 'non-object metadata is dropped');
  assert.equal(byId.get('fx-malformed-shape')?.amount, 1000, 'the rest of the transaction is unaffected by dropped metadata');
  assert.equal(byId.get('ordinary')?.fxConversionLeg, undefined);
  assert.equal(byId.get('ordinary')?.amount, 500, 'ordinary transactions are completely unaffected');
});

test('FX conversion leg metadata survives localStorage/JSON Backup round-trip and a second normalization pass', () => {
  const raw = [
    { id: 'fx-source', accountId: 'a', type: 'expense', status: 'posted', amount: 32000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'source' } },
    { id: 'fx-destination', accountId: 'usd', type: 'income', status: 'posted', amount: 1000, currency: 'USD', categoryId: 'income-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'destination' } }
  ];
  const first = normalizeTransactions(raw, accounts, '2026-08-13T00:00:00.000Z').transactions;
  const roundTripped = normalizeTransactions(JSON.parse(JSON.stringify(first)), accounts, '2026-08-13T00:00:00.000Z').transactions;
  assert.deepEqual(roundTripped, first, 'JSON Backup/localStorage round-trip must preserve fxConversionLeg exactly');
  const secondPass = normalizeTransactions(roundTripped, accounts, '2026-08-13T00:00:00.000Z').transactions;
  assert.deepEqual(secondPass, first, 'a second normalizeTransactions() pass (writeState() re-normalizes) must not lose the metadata');
});

test('FX conversion leg metadata does not change account balance semantics: source expense still decreases, destination income still increases', () => {
  const raw = [
    { id: 'fx-source', accountId: 'a', type: 'expense', status: 'posted', amount: 32000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'source' } },
    { id: 'fx-destination', accountId: 'usd', type: 'income', status: 'posted', amount: 1000, currency: 'USD', categoryId: 'income-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'destination' } }
  ];
  const transactions = normalizeTransactions(raw, accounts, '2026-08-13T00:00:00.000Z').transactions;
  assert.deepEqual(deriveTransactionAccountBalances(transactions), { a: -32000, usd: 1000 }, 'the consumer guard must not make FX legs skip account balance derivation');
});

test('FX conversion leg metadata excludes the principal leg from household cash-flow summary, regardless of expense/income type; ordinary transactions unaffected', () => {
  const fxSourceExpense = normalizeTransactions([{ id: 'fx-source', accountId: 'a', type: 'expense', status: 'posted', amount: 32000, currency: 'TWD', categoryId: 'expense-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'source' } }], accounts, '2026-08-13T00:00:00.000Z').transactions;
  const fxDestinationIncome = normalizeTransactions([{ id: 'fx-destination', accountId: 'usd', type: 'income', status: 'posted', amount: 1000, currency: 'USD', categoryId: 'income-other', occurredAt: '2026-08-13T00:00:00.000Z', fxConversionLeg: { conversionId: 'conv-1', role: 'destination' } }], accounts, '2026-08-13T00:00:00.000Z').transactions;
  const ordinaryExpense = normalizeTransactions([{ id: 'ordinary-expense', accountId: 'a', type: 'expense', status: 'posted', amount: 300, currency: 'TWD', categoryId: 'expense-food', occurredAt: '2026-08-13T00:00:00.000Z' }], accounts, '2026-08-13T00:00:00.000Z').transactions;
  const ordinaryIncome = normalizeTransactions([{ id: 'ordinary-income', accountId: 'a', type: 'income', status: 'posted', amount: 200, currency: 'TWD', categoryId: 'income-salary', occurredAt: '2026-08-13T00:00:00.000Z' }], accounts, '2026-08-13T00:00:00.000Z').transactions;

  assert.deepEqual(transactionCashFlowSummary(fxSourceExpense), { income: 0, expense: 0 }, 'FX source expense leg excluded');
  assert.deepEqual(transactionCashFlowSummary(fxDestinationIncome), { income: 0, expense: 0 }, 'FX destination income leg excluded');
  assert.deepEqual(transactionCashFlowSummary(ordinaryExpense), { income: 0, expense: 300 }, 'ordinary expense still counted');
  assert.deepEqual(transactionCashFlowSummary(ordinaryIncome), { income: 200, expense: 0 }, 'ordinary income still counted');
  assert.deepEqual(
    transactionCashFlowSummary([...ordinaryExpense, ...ordinaryIncome, ...fxSourceExpense, ...fxDestinationIncome]),
    { income: 200, expense: 300 },
    'mixed ordinary + FX legs: only ordinary transactions contribute'
  );
});
