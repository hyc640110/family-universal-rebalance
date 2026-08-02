import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFinancialEventLedger } from '../src/lib/financialEvents';

const context = {
  accountIds: new Set(['bank-a', 'broker-b']),
  loanIds: new Set(['loan-a']),
  transactionIds: new Set(['tx-a'])
};

const audit = {
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z'
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
