import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import { deriveRuntimeDerivedAttributionEvidence } from '../src/lib/derivedAttributionEvidence';
import { reconcileTransactions } from '../src/lib/transactionReconciliation';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-02T00:00:00.000Z', updatedAt: '2026-08-02T00:00:00.000Z' };
const accounts: FinancialAccount[] = [
  { id: 'bank-a', name: 'A', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, ...audit },
  { id: 'bank-b', name: 'B', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 1, ...audit }
];

function transaction(id: string, patch: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id, accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 100,
    currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '',
    occurredAt: '2026-08-02T00:00:00.000Z', fingerprint: '', excluded: false, ...audit, ...patch
  };
}

function derive(transactions: FinancialTransaction[], opening = '2026-08-01', closing = '2026-08-05') {
  return deriveRuntimeDerivedAttributionEvidence({
    openingSnapshot: { date: opening, totalAssets: 0, netWorth: 0, investmentValue: 0, cash: 0, debt: 0 },
    closingSnapshot: { date: closing, totalAssets: 0, netWorth: 0, investmentValue: 0, cash: 0, debt: 0 },
    transactions,
    reconciliationResults: reconcileTransactions({ transactions, accounts, ledgerEvents: [] })
  });
}

test('以 opening < effectiveDate <= closing 的台北日曆日期間產生純 runtime derived evidence', () => {
  const output = derive([
    transaction('opening-day', { occurredAt: '2026-08-01T12:00:00.000Z' }),
    transaction('inside', { occurredAt: '2026-08-02T00:00:00.000Z' }),
    transaction('closing-day', { occurredAt: '2026-08-05T00:00:00.000Z', type: 'expense', categoryId: 'expense-food', amount: 35 }),
    transaction('after', { occurredAt: '2026-08-06T00:00:00.000Z' })
  ]);

  assert.deepEqual(output, [
    { transactionId: 'inside', effectiveDate: '2026-08-02', category: 'external-income', amount: 100, signedContribution: 100, provenance: 'derived-transaction', reconciliationBasis: 'safe-taxonomy-candidate' },
    { transactionId: 'closing-day', effectiveDate: '2026-08-05', category: 'external-expense', amount: 35, signedContribution: -35, provenance: 'derived-transaction', reconciliationBasis: 'safe-taxonomy-candidate' }
  ]);
});

test('保留可由既有 taxonomy 證明的股息、轉帳與 adjustment 語意，且不把零效果誤算成 market effect', () => {
  const output = derive([
    transaction('dividend', { categoryId: 'income-dividend', amount: 20 }),
    transaction('transfer', { type: 'transfer', categoryId: 'transfer-account', transferAccountId: 'bank-b', amount: 30 }),
    transaction('adjustment', { type: 'adjustment', categoryId: 'adjustment-other', amount: 40 })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.category, item.signedContribution, item.provenance]), [
    ['dividend', 'dividend', 20, 'derived-transaction'],
    ['transfer', 'internal-transfer', 0, 'derived-transaction'],
    ['adjustment', 'adjustment', 0, 'derived-transaction']
  ]);
});

test('完整 TWD 投資買賣只產生零貢獻 derived evidence，不得偽裝成外部現金流', () => {
  const output = derive([
    transaction('buy', {
      type: 'expense', categoryId: 'expense-investment', amount: 1000,
      investmentAttribution: { kind: 'trade', tradeId: 'buy-1', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('sell', {
      type: 'income', categoryId: 'income-other', amount: 1200,
      investmentAttribution: { kind: 'trade', tradeId: 'sell-1', side: 'sell', assetSymbol: '0050', quantity: 10, settlementAmount: 1200, currency: 'TWD', cashAccountId: 'bank-a' }
    })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.category, item.amount, item.signedContribution]), [
    ['buy', 'investment-buy', 1000, 0],
    ['sell', 'investment-sell', 1200, 0]
  ]);
});

test('明確投資 fee 或 tax 以獨立交易成本產生一次負貢獻，不與買賣本金混算', () => {
  const output = derive([
    transaction('buy', {
      type: 'expense', categoryId: 'expense-investment', amount: 1000,
      investmentAttribution: { kind: 'trade', tradeId: 'buy-1', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('fee', {
      type: 'expense', categoryId: 'expense-investment', amount: 20,
      investmentAttribution: { kind: 'cost', tradeId: 'buy-1', costType: 'fee', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'bank-a' }
    })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.category, item.signedContribution]), [
    ['buy', 'investment-buy', 0],
    ['fee', 'investment-fee', -20]
  ]);
});

test('只接受 reconciliation candidate，避免 matched、duplicate、ambiguous、unsupported 與 invalid 造成 double-count', () => {
  const transactions = [
    transaction('candidate'),
    transaction('matched'),
    transaction('duplicate'),
    transaction('ambiguous'),
    transaction('unsupported', { type: 'expense', categoryId: 'expense-investment' }),
    transaction('invalid', { amount: 0 })
  ];
  const output = deriveRuntimeDerivedAttributionEvidence({
    openingSnapshot: { date: '2026-08-01', totalAssets: 0, netWorth: 0, investmentValue: 0, cash: 0, debt: 0 },
    closingSnapshot: { date: '2026-08-05', totalAssets: 0, netWorth: 0, investmentValue: 0, cash: 0, debt: 0 },
    transactions,
    reconciliationResults: [
      { transactionId: 'candidate', status: 'candidate', reason: 'safe-taxonomy-candidate', eventType: 'external-income', completedPeriodEvidence: false },
      { transactionId: 'matched', status: 'matched', reason: 'linked-event', eventType: 'external-income', completedPeriodEvidence: true },
      { transactionId: 'duplicate', status: 'duplicate', reason: 'multiple-linked-events', eventType: 'external-income', completedPeriodEvidence: true },
      { transactionId: 'ambiguous', status: 'ambiguous', reason: 'manual-event-looks-similar', eventType: 'external-income', completedPeriodEvidence: false },
      { transactionId: 'unsupported', status: 'unsupported', reason: 'unsupported-taxonomy', completedPeriodEvidence: false },
      { transactionId: 'invalid', status: 'invalid', reason: 'invalid-amount', completedPeriodEvidence: false }
    ]
  });

  assert.deepEqual(output, [
    { transactionId: 'candidate', effectiveDate: '2026-08-02', category: 'external-income', amount: 100, signedContribution: 100, provenance: 'derived-transaction', reconciliationBasis: 'safe-taxonomy-candidate' }
  ]);
});

test('相同日期或無效 snapshot 日期不產生 derived evidence，並涵蓋跨月與跨年邊界', () => {
  assert.deepEqual(derive([transaction('same-day')], '2026-08-02', '2026-08-02'), []);
  assert.deepEqual(derive([transaction('cross-month', { occurredAt: '2026-09-01T00:00:00.000Z' })], '2026-08-31', '2026-09-01').map(item => item.transactionId), ['cross-month']);
  assert.deepEqual(derive([transaction('cross-year', { occurredAt: '2027-01-01T00:00:00.000Z' })], '2026-12-31', '2027-01-01').map(item => item.transactionId), ['cross-year']);
  assert.deepEqual(derive([transaction('invalid-boundary')], 'not-a-date', '2026-08-05'), []);
});

test('adapter 對不同 runtime timezone 保持 Asia/Taipei 日期結果一致', () => {
  const code = "import { deriveRuntimeDerivedAttributionEvidence } from './src/lib/derivedAttributionEvidence.ts'; console.log(JSON.stringify(deriveRuntimeDerivedAttributionEvidence({ openingSnapshot: { date: '2026-08-01', totalAssets: 0, netWorth: 0, investmentValue: 0, cash: 0, debt: 0 }, closingSnapshot: { date: '2026-08-02', totalAssets: 0, netWorth: 0, investmentValue: 0, cash: 0, debt: 0 }, transactions: [{ id: 'taipei-boundary', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '', occurredAt: '2026-08-01T16:00:00.000Z', fingerprint: '', excluded: false, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' }], reconciliationResults: [{ transactionId: 'taipei-boundary', status: 'candidate', reason: 'safe-taxonomy-candidate', eventType: 'external-income', completedPeriodEvidence: false }] })));";
  const projectRoot = fileURLToPath(new URL('..', import.meta.url));
  const outputs = ['UTC', 'Asia/Taipei', 'America/New_York'].map(timeZone => execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', code], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, TZ: timeZone }
  }).trim());

  assert.deepEqual(outputs, [
    '[{"transactionId":"taipei-boundary","effectiveDate":"2026-08-02","category":"external-income","amount":100,"signedContribution":100,"provenance":"derived-transaction","reconciliationBasis":"safe-taxonomy-candidate"}]',
    '[{"transactionId":"taipei-boundary","effectiveDate":"2026-08-02","category":"external-income","amount":100,"signedContribution":100,"provenance":"derived-transaction","reconciliationBasis":"safe-taxonomy-candidate"}]',
    '[{"transactionId":"taipei-boundary","effectiveDate":"2026-08-02","category":"external-income","amount":100,"signedContribution":100,"provenance":"derived-transaction","reconciliationBasis":"safe-taxonomy-candidate"}]'
  ]);
});
