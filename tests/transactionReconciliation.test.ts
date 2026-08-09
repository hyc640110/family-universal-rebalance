import assert from 'node:assert/strict';
import test from 'node:test';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import type { FinancialEvent } from '../src/lib/financialEvents';
import { deriveNetWorthAttribution } from '../src/lib/netWorthAttribution';
import { reconcileTransactions } from '../src/lib/transactionReconciliation';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = {
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z'
};

const accounts: FinancialAccount[] = [
  { id: 'bank-a', name: 'A', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, ...audit },
  { id: 'bank-b', name: 'B', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 1, ...audit },
  { id: 'usd-a', name: 'USD', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'USD', institutionName: '', note: '', isActive: true, sortOrder: 2, ...audit }
];

function transaction(id: string, patch: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id, accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 100,
    currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '',
    occurredAt: '2026-08-02T00:00:00.000Z', fingerprint: '', excluded: false, ...audit, ...patch
  };
}

function event(id: string, patch: Partial<FinancialEvent> = {}): FinancialEvent {
  return {
    id, type: 'external-income', status: 'posted', source: 'linked-transaction',
    effectiveDate: '2026-08-02', amount: 100, currency: 'TWD', accountId: 'bank-a',
    transactionId: 'matched', note: '', ...audit, ...patch
  };
}

function results(transactions: FinancialTransaction[], ledgerEvents: FinancialEvent[] = []) {
  return reconcileTransactions({ transactions, accounts, ledgerEvents });
}

test('將現有 taxonomy 已可證明的 posted 交易分類為候選或 adjustment evidence', () => {
  const output = results([
    transaction('salary'),
    transaction('dividend', { categoryId: 'income-dividend' }),
    transaction('expense', { type: 'expense', categoryId: 'expense-food' }),
    transaction('transfer', { type: 'transfer', categoryId: 'transfer-account', transferAccountId: 'bank-b' }),
    transaction('adjustment', { type: 'adjustment', categoryId: 'adjustment-other' })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status, item.eventType]), [
    ['salary', 'candidate', 'external-income'],
    ['dividend', 'candidate', 'dividend'],
    ['expense', 'candidate', 'external-expense'],
    ['transfer', 'candidate', 'internal-transfer'],
    ['adjustment', 'candidate', 'adjustment']
  ]);
});

test('拒絕投資、未入帳、作廢、排除與不明 taxonomy，不猜測歸因', () => {
  const output = results([
    transaction('investment-expense', { type: 'expense', categoryId: 'expense-investment' }),
    transaction('pending', { status: 'pending' }),
    transaction('void', { status: 'void' }),
    transaction('excluded', { excluded: true }),
    transaction('unknown-category', { categoryId: 'income-loan-principal-payment' }),
    transaction('usd-income', { accountId: 'usd-a', currency: 'USD' })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status]), [
    ['investment-expense', 'unsupported'],
    ['pending', 'unsupported'],
    ['void', 'unsupported'],
    ['excluded', 'unsupported'],
    ['unknown-category', 'unsupported'],
    ['usd-income', 'unsupported']
  ]);
});

test('只有完整 TWD 投資契約可產生買賣候選；重複 trade identity 均 fail-safe', () => {
  const output = results([
    transaction('buy', {
      type: 'expense', categoryId: 'expense-investment', amount: 1000,
      investmentAttribution: { kind: 'trade', tradeId: 'trade-buy-1', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('sell', {
      type: 'income', categoryId: 'income-other', amount: 1200,
      investmentAttribution: { kind: 'trade', tradeId: 'trade-sell-1', side: 'sell', assetSymbol: '0050', quantity: 10, settlementAmount: 1200, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('fee', {
      type: 'expense', categoryId: 'expense-investment', amount: 20,
      investmentAttribution: { kind: 'cost', tradeId: 'trade-buy-1', costId: 'fee-1', costType: 'fee', settlementCostTreatment: 'independent', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('ordinary-income-other', { categoryId: 'income-other', description: '賣出 0050' }),
    transaction('duplicate-a', {
      type: 'expense', categoryId: 'expense-investment', amount: 500,
      investmentAttribution: { kind: 'trade', tradeId: 'duplicated-trade', side: 'buy', assetSymbol: '0050', quantity: 5, settlementAmount: 500, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('duplicate-b', {
      type: 'expense', categoryId: 'expense-investment', amount: 500,
      investmentAttribution: { kind: 'trade', tradeId: 'duplicated-trade', side: 'buy', assetSymbol: '0050', quantity: 5, settlementAmount: 500, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('usd-trade', {
      accountId: 'usd-a', type: 'expense', categoryId: 'expense-investment', amount: 100, currency: 'USD',
      investmentAttribution: { kind: 'trade', tradeId: 'usd-trade', side: 'buy', assetSymbol: 'VOO', quantity: 1, settlementAmount: 100, currency: 'USD', cashAccountId: 'usd-a' }
    })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status, item.eventType, item.reason]), [
    ['buy', 'candidate', 'investment-buy', 'safe-taxonomy-candidate'],
    ['sell', 'candidate', 'investment-sell', 'safe-taxonomy-candidate'],
    ['fee', 'candidate', 'investment-fee', 'safe-taxonomy-candidate'],
    ['ordinary-income-other', 'candidate', 'external-income', 'safe-taxonomy-candidate'],
    ['duplicate-a', 'duplicate', undefined, 'duplicate-trade-identity'],
    ['duplicate-b', 'duplicate', undefined, 'duplicate-trade-identity'],
    ['usd-trade', 'unsupported', undefined, 'fx-attribution-unsupported']
  ]);
});

test('一般 income-other 維持 external-income，只有完整 sell contract 才覆寫為零貢獻投資賣出', () => {
  const output = results([
    transaction('ordinary-income-other', { categoryId: 'income-other', description: '二手物出售' }),
    transaction('formal-sell', {
      type: 'income', categoryId: 'income-other', amount: 1200,
      investmentAttribution: { kind: 'trade', tradeId: 'sell-1', side: 'sell', assetSymbol: '0050', quantity: 10, settlementAmount: 1200, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('legacy-income-other', { categoryId: 'income-other', description: '賣出 0050' })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status, item.eventType]), [
    ['ordinary-income-other', 'candidate', 'external-income'],
    ['formal-sell', 'candidate', 'investment-sell'],
    ['legacy-income-other', 'candidate', 'external-income']
  ]);
});

test('只有明確 independent 且有唯一 stable costId 的 fee 或 tax 才能成為 investment-fee', () => {
  const output = results([
    transaction('buy', {
      type: 'expense', categoryId: 'expense-investment', amount: 1000,
      investmentAttribution: { kind: 'trade', tradeId: 'buy-1', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('independent-fee', {
      type: 'expense', categoryId: 'expense-investment', amount: 20,
      investmentAttribution: { kind: 'cost', tradeId: 'buy-1', costId: 'fee-1', costType: 'fee', settlementCostTreatment: 'independent', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('included-tax', {
      type: 'expense', categoryId: 'expense-investment', amount: 10,
      investmentAttribution: { kind: 'cost', tradeId: 'buy-1', costId: 'tax-1', costType: 'tax', settlementCostTreatment: 'included', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('unknown-fee', {
      type: 'expense', categoryId: 'expense-investment', amount: 5,
      investmentAttribution: { kind: 'cost', tradeId: 'buy-1', costId: 'fee-unknown', costType: 'fee', settlementCostTreatment: 'unknown', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('duplicate-fee-a', {
      type: 'expense', categoryId: 'expense-investment', amount: 20,
      investmentAttribution: { kind: 'cost', tradeId: 'buy-1', costId: 'fee-duplicate', costType: 'fee', settlementCostTreatment: 'independent', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('duplicate-fee-b', {
      type: 'expense', categoryId: 'expense-investment', amount: 20,
      investmentAttribution: { kind: 'cost', tradeId: 'buy-1', costId: 'fee-duplicate', costType: 'fee', settlementCostTreatment: 'independent', assetSymbol: '0050', currency: 'TWD', cashAccountId: 'bank-a' } as any
    })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status, item.eventType, item.reason]), [
    ['buy', 'candidate', 'investment-buy', 'safe-taxonomy-candidate'],
    ['independent-fee', 'candidate', 'investment-fee', 'safe-taxonomy-candidate'],
    ['included-tax', 'unsupported', undefined, 'cost-not-separately-proven'],
    ['unknown-fee', 'unsupported', undefined, 'cost-not-separately-proven'],
    ['duplicate-fee-a', 'duplicate', undefined, 'duplicate-cost-identity'],
    ['duplicate-fee-b', 'duplicate', undefined, 'duplicate-cost-identity']
  ]);
});

test('顯式 cashMovementId 才能抑制配對現金交易，缺配對或方向不符一律 fail-safe', () => {
  const output = results([
    transaction('buy', {
      type: 'expense', categoryId: 'expense-investment', amount: 1000,
      investmentAttribution: { kind: 'trade', tradeId: 'buy-cash-1', cashMovementId: 'cash-1', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('cash-decrease', {
      type: 'expense', categoryId: 'expense-other', amount: 1000,
      investmentAttribution: { kind: 'cash-movement', cashMovementId: 'cash-1', direction: 'decrease', currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('unlinked-cash-increase', {
      type: 'income', categoryId: 'income-other', amount: 1200,
      investmentAttribution: { kind: 'cash-movement', cashMovementId: 'cash-unlinked', direction: 'increase', currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('sell-with-missing-cash-link', {
      type: 'income', categoryId: 'income-other', amount: 1200,
      investmentAttribution: { kind: 'trade', tradeId: 'sell-cash-1', cashMovementId: 'cash-missing', side: 'sell', assetSymbol: '0050', quantity: 10, settlementAmount: 1200, currency: 'TWD', cashAccountId: 'bank-a' } as any
    })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status, item.eventType, item.reason]), [
    ['buy', 'candidate', 'investment-buy', 'safe-taxonomy-candidate'],
    ['cash-decrease', 'unsupported', undefined, 'linked-investment-cash-movement'],
    ['unlinked-cash-increase', 'unsupported', undefined, 'unlinked-investment-cash-movement'],
    ['sell-with-missing-cash-link', 'unsupported', undefined, 'cash-movement-link-unresolved']
  ]);
});

test('manual 與 imported 重複 trade，以及方向不符的 cash movement，均不得形成 derived candidate', () => {
  const output = results([
    transaction('manual-buy', {
      source: 'manual', type: 'expense', categoryId: 'expense-investment', amount: 1000,
      investmentAttribution: { kind: 'trade', tradeId: 'same-trade', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('imported-buy', {
      source: 'import', type: 'expense', categoryId: 'expense-investment', amount: 1000,
      investmentAttribution: { kind: 'trade', tradeId: 'same-trade', side: 'buy', assetSymbol: '0050', quantity: 10, settlementAmount: 1000, currency: 'TWD', cashAccountId: 'bank-a' }
    }),
    transaction('sell', {
      type: 'income', categoryId: 'income-other', amount: 1200,
      investmentAttribution: { kind: 'trade', tradeId: 'sell-direction', cashMovementId: 'cash-direction', side: 'sell', assetSymbol: '0050', quantity: 10, settlementAmount: 1200, currency: 'TWD', cashAccountId: 'bank-a' } as any
    }),
    transaction('wrong-direction-cash', {
      type: 'expense', categoryId: 'expense-other', amount: 1200,
      investmentAttribution: { kind: 'cash-movement', cashMovementId: 'cash-direction', direction: 'decrease', currency: 'TWD', cashAccountId: 'bank-a' } as any
    })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status, item.reason]), [
    ['manual-buy', 'duplicate', 'duplicate-trade-identity'],
    ['imported-buy', 'duplicate', 'duplicate-trade-identity'],
    ['sell', 'unsupported', 'cash-movement-link-unresolved'],
    ['wrong-direction-cash', 'unsupported', 'unlinked-investment-cash-movement']
  ]);
});

test('將同帳戶轉帳、跨幣別轉帳及不合法 account、amount、date 明確標示為不能使用', () => {
  const output = results([
    transaction('same-account', { type: 'transfer', categoryId: 'transfer-account', transferAccountId: 'bank-a' }),
    transaction('cross-currency', { type: 'transfer', categoryId: 'transfer-account', transferAccountId: 'usd-a' }),
    transaction('missing-account', { accountId: 'missing' }),
    transaction('zero-amount', { amount: 0 }),
    transaction('bad-date', { occurredAt: 'not-a-date' })
  ]);

  assert.deepEqual(output.map(item => [item.transactionId, item.status]), [
    ['same-account', 'invalid'],
    ['cross-currency', 'unsupported'],
    ['missing-account', 'invalid'],
    ['zero-amount', 'invalid'],
    ['bad-date', 'invalid']
  ]);
});

test('C2 僅診斷既有 Ledger 的 matched、void、duplicate 與 manual ambiguity，絕不寫回 Ledger', () => {
  const transactions = [
    transaction('matched'),
    transaction('pending-linked', { status: 'pending' }),
    transaction('void-linked', { status: 'void' }),
    transaction('duplicate'),
    transaction('manual-ambiguous'),
    transaction('dividend-manual', { categoryId: 'income-dividend' })
  ];
  const ledgerEvents = [
    event('linked', { transactionId: 'matched' }),
    event('pending', { status: 'pending', transactionId: 'pending-linked' }),
    event('void', { status: 'void', transactionId: 'void-linked' }),
    event('duplicate-a', { transactionId: 'duplicate' }),
    event('duplicate-b', { transactionId: 'duplicate' }),
    event('manual-income', { id: 'manual-income', source: 'manual', transactionId: undefined, effectiveDate: '2026-08-02' }),
    event('manual-dividend', { id: 'manual-dividend', type: 'dividend', source: 'manual', transactionId: undefined, effectiveDate: '2026-08-02' })
  ];
  const before = JSON.stringify(ledgerEvents);
  const output = results(transactions, ledgerEvents);

  assert.deepEqual(output.map(item => [item.transactionId, item.status]), [
    ['matched', 'matched'],
    ['pending-linked', 'matched'],
    ['void-linked', 'unsupported'],
    ['duplicate', 'duplicate'],
    ['manual-ambiguous', 'ambiguous'],
    ['dividend-manual', 'ambiguous']
  ]);
  assert.equal(output.find(item => item.transactionId === 'pending-linked')?.completedPeriodEvidence, false);
  assert.equal(JSON.stringify(ledgerEvents), before);
});

test('reconciliation 結果不會進入既有 attribution calculator 或提升 quality', () => {
  const openingSnapshot = { date: '2026-08-01', netWorth: 100, totalAssets: 100, investmentValue: 0, cash: 100, debt: 0 };
  const closingSnapshot = { date: '2026-08-02', netWorth: 120, totalAssets: 120, investmentValue: 0, cash: 120, debt: 0 };
  const calculatorInput = { openingSnapshot, closingSnapshot, events: [] as FinancialEvent[] };
  const before = deriveNetWorthAttribution(calculatorInput);

  const output = results([transaction('salary')]);
  const after = deriveNetWorthAttribution(calculatorInput);

  assert.equal(output[0]?.status, 'candidate');
  assert.deepEqual(after, before);
  assert.equal(after.attributionQuality, 'snapshot-only');
});
