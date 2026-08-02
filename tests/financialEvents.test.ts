import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFinancialEventLedger } from '../src/lib/financialEvents';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = {
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z'
};

const context = {
  accountIds: new Set(['bank-a', 'broker-b']),
  loanIds: new Set(['loan-a']),
  transactionIds: new Set(['tx-a']),
  transactionsById: new Map<string, FinancialTransaction>([[
    'tx-a',
    {
      id: 'tx-a', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 900, currency: 'TWD', categoryId: 'income-dividend', description: '股利', merchant: '', note: '', occurredAt: '2026-08-02T09:00:00.000Z', fingerprint: '', excluded: false, ...audit
    }
  ]])
};

test('保留有證據連結且可作為 forward-only 起點的已入帳股息事件', () => {
  const raw = {
    financialEventSchemaVersion: 1,
    financialEventAttributionStartDate: '2026-08-02',
    financialEvents: [{
      id: 'event-dividend', type: 'dividend', status: 'posted', source: 'linked-transaction',
      effectiveDate: '2026-08-02', occurredAt: '2026-08-02T09:00:00.000Z', amount: 900, currency: 'TWD',
      accountId: 'bank-a', assetSymbol: '00865B', transactionId: 'tx-a', note: '', ...audit, futureEvidence: 'preserved'
    }]
  };

  const result = normalizeFinancialEventLedger(raw, context);

  assert.equal(result.schemaVersion, 1);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0]?.type, 'dividend');
  assert.equal(result.events[0]?.futureEvidence, 'preserved');
  assert.equal(result.attributionStartDate, '2026-08-02');
  assert.deepEqual(result.skipped, []);
  assert.equal(raw.financialEvents[0]?.amount, 900);
});

test('拒絕非正數金額與缺少必要連結，且不將它們補成零或猜測關聯', () => {
  const result = normalizeFinancialEventLedger({
    financialEventSchemaVersion: 1,
    financialEvents: [
      { id: 'zero', type: 'external-income', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 0, currency: 'TWD', accountId: 'bank-a', note: '', ...audit },
      { id: 'loan-without-loan', type: 'loan-principal-payment', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 100, currency: 'TWD', accountId: 'bank-a', note: '', ...audit }
    ]
  }, context);

  assert.deepEqual(result.events, []);
  assert.equal(result.skipped.length, 2);
});

test('驗證每一類事件的特定關聯並拒絕重複 ID、無效日期與同帳戶轉帳', () => {
  const result = normalizeFinancialEventLedger({
    financialEventSchemaVersion: 1,
    financialEvents: [
      { id: 'income', type: 'external-income', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', note: '', ...audit },
      { id: 'expense', type: 'external-expense', status: 'pending', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', note: '', ...audit },
      { id: 'transfer', type: 'internal-transfer', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', counterpartyAccountId: 'broker-b', note: '', ...audit },
      { id: 'buy', type: 'investment-buy', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'broker-b', assetSymbol: '0050', note: '', ...audit },
      { id: 'sell', type: 'investment-sell', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'broker-b', assetSymbol: '0050', note: '', ...audit },
      { id: 'fee', type: 'investment-fee', status: 'void', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'broker-b', note: '', ...audit },
      { id: 'disbursement', type: 'loan-disbursement', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', loanId: 'loan-a', note: '', ...audit },
      { id: 'principal', type: 'loan-principal-payment', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', loanId: 'loan-a', note: '', ...audit },
      { id: 'interest', type: 'loan-interest-payment', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', loanId: 'loan-a', note: '', ...audit },
      { id: 'adjustment', type: 'adjustment', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', note: '', ...audit },
      { id: 'income', type: 'external-income', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', note: '', ...audit },
      { id: 'bad-date', type: 'external-income', status: 'posted', source: 'manual', effectiveDate: '2026-02-30', amount: 1, currency: 'TWD', accountId: 'bank-a', note: '', ...audit },
      { id: 'same-account-transfer', type: 'internal-transfer', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 1, currency: 'TWD', accountId: 'bank-a', counterpartyAccountId: 'bank-a', note: '', ...audit }
    ]
  }, context);

  assert.equal(result.events.length, 10);
  assert.equal(result.skipped.length, 3);
});

test('保留完全缺少 Ledger 的舊資料為空，不回填或轉換任何歷史事件', () => {
  const legacy = { transactions: [{ id: 'historic-transaction', amount: 999 }] };
  const result = normalizeFinancialEventLedger(legacy, context);

  assert.equal(result.schemaVersion, 1);
  assert.deepEqual(result.events, []);
  assert.equal(result.attributionStartDate, undefined);
  assert.deepEqual(result.skipped, []);
  assert.deepEqual(legacy, { transactions: [{ id: 'historic-transaction', amount: 999 }] });
});

test('未知 future schema 保持 opaque，絕不被降級成 v1', () => {
  const future = {
    financialEventSchemaVersion: 2,
    financialEventAttributionStartDate: { future: 'opaque-date-contract' },
    financialEvents: { eventSet: [{ unsupported: 'must-survive' }] }
  };

  const result = normalizeFinancialEventLedger(future, context);

  assert.equal(result.schemaVersion, 2);
  assert.deepEqual(result.events, future.financialEvents);
  assert.deepEqual(result.attributionStartDate, future.financialEventAttributionStartDate);
  assert.equal(result.supported, false);
});

test('linked transaction 僅接受現有 taxonomy 可證實的語意與完整帳戶金額狀態對應', () => {
  const transactions = new Map<string, FinancialTransaction>([
    ['income', { ...context.transactionsById.get('tx-a')!, id: 'income', categoryId: 'income-salary', amount: 100 }],
    ['investment-expense', { ...context.transactionsById.get('tx-a')!, id: 'investment-expense', type: 'expense', categoryId: 'expense-investment', amount: 100 }],
    ['transfer', { ...context.transactionsById.get('tx-a')!, id: 'transfer', type: 'transfer', categoryId: 'transfer-account', transferAccountId: 'broker-b', amount: 100 }],
    ['adjustment', { ...context.transactionsById.get('tx-a')!, id: 'adjustment', type: 'adjustment', categoryId: 'adjustment-other', amount: 100 }]
  ]);
  const linked = (id: string, type: string, overrides: Record<string, unknown> = {}) => ({
    id, type, status: 'posted', source: 'linked-transaction', effectiveDate: '2026-08-02', amount: 100, currency: 'TWD', accountId: 'bank-a', transactionId: id, note: '', ...audit, ...overrides
  });
  const result = normalizeFinancialEventLedger({ financialEventSchemaVersion: 1, financialEvents: [
    linked('income', 'external-income'),
    linked('investment-expense', 'external-expense'),
    linked('transfer', 'internal-transfer', { counterpartyAccountId: 'broker-b' }),
    linked('adjustment', 'adjustment'),
    linked('unsupported-buy', 'investment-buy', { assetSymbol: '0050', transactionId: 'income' })
  ] }, { ...context, transactionIds: new Set(transactions.keys()), transactionsById: transactions });

  assert.deepEqual(result.events.map(event => event.id), ['income', 'transfer', 'adjustment']);
  assert.equal(result.skipped.length, 2);
});

test('同一 transaction 只能被一個非 void linked event 消費，pending 保留而 void 不消費', () => {
  const transaction = { ...context.transactionsById.get('tx-a')!, id: 'income', categoryId: 'income-salary', amount: 100 };
  const linked = (id: string, status: 'posted' | 'pending' | 'void') => ({
    id, type: 'external-income', status, source: 'linked-transaction', effectiveDate: '2026-08-02', amount: 100, currency: 'TWD', accountId: 'bank-a', transactionId: 'income', note: '', ...audit
  });
  const posted = normalizeFinancialEventLedger({ financialEventSchemaVersion: 1, financialEvents: [linked('posted-a', 'posted'), linked('posted-b', 'posted')] }, {
    ...context,
    transactionIds: new Set(['income']),
    transactionsById: new Map([['income', transaction]])
  });
  const pendingTransaction = { ...transaction, id: 'pending', status: 'pending' as const };
  const pending = normalizeFinancialEventLedger({ financialEventSchemaVersion: 1, financialEvents: [
    { ...linked('pending-a', 'pending'), transactionId: 'pending' },
    { ...linked('pending-b', 'pending'), transactionId: 'pending' }
  ] }, { ...context, transactionIds: new Set(['pending']), transactionsById: new Map([['pending', pendingTransaction]]) });
  const voidTransaction = { ...transaction, id: 'void', status: 'void' as const };
  const voided = normalizeFinancialEventLedger({ financialEventSchemaVersion: 1, financialEvents: [
    { ...linked('void-a', 'void'), transactionId: 'void' }
  ] }, { ...context, transactionIds: new Set(['void']), transactionsById: new Map([['void', voidTransaction]]) });

  assert.deepEqual(posted.events.map(event => event.id), ['posted-a']);
  assert.equal(posted.skipped.length, 1);
  assert.deepEqual(pending.events.map(event => event.id), ['pending-a']);
  assert.equal(pending.skipped.length, 1);
  assert.deepEqual(voided.events.map(event => event.id), ['void-a']);
});

test('manual event 不得以 transactionId 假裝已完成 reconciliation', () => {
  const result = normalizeFinancialEventLedger({ financialEventSchemaVersion: 1, financialEvents: [{
    id: 'manual-with-transaction', type: 'external-income', status: 'posted', source: 'manual', effectiveDate: '2026-08-02', amount: 100, currency: 'TWD', accountId: 'bank-a', transactionId: 'tx-a', note: '', ...audit
  }] }, context);

  assert.deepEqual(result.events, []);
  assert.equal(result.skipped.length, 1);
});
