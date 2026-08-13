import assert from 'node:assert/strict';
import test from 'node:test';
import { appendFinancialEventGroup, FINANCIAL_EVENT_SCHEMA_VERSION, mergeFinancialEventLedgers, normalizeFinancialEventLedger, resolveActiveLoanComponentGroups, type FinancialEvent } from '../src/lib/financialEvents';
import type { FinancialTransaction } from '../src/lib/transactions';
import { composeRuntimeNetWorthAttribution } from '../src/lib/runtimeAttributionComposition';
import { createFinancialAccount } from '../src/lib/financialAccounts';

const audit = { createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z' };
const transaction: FinancialTransaction = {
  id: 'repayment-1', accountId: 'cash-a', type: 'expense', status: 'posted', source: 'manual', amount: 20_000, currency: 'TWD', categoryId: 'expense-housing', description: '', merchant: '', note: '', occurredAt: '2026-08-09T00:00:00.000Z', fingerprint: '', excluded: false, ...audit,
  loanAttribution: { kind: 'repayment', paymentId: 'payment-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 20_000, components: [{ componentId: 'principal', type: 'principal', amount: 15_000 }, { componentId: 'interest', type: 'interest', amount: 5_000 }] }
};
const context = { accountIds: new Set(['cash-a']), loanIds: new Set(['loan-a']), transactionIds: new Set(['repayment-1']), transactionsById: new Map([['repayment-1', transaction]]) };
function event(id: string, componentId: 'principal' | 'interest', confirmationGroupId = 'group-1'): FinancialEvent {
  return {
    id, type: componentId === 'principal' ? 'loan-principal-payment' : 'loan-interest-payment', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-09', amount: componentId === 'principal' ? 15_000 : 5_000, currency: 'TWD', accountId: 'cash-a', loanId: 'loan-a', transactionId: 'repayment-1', componentLink: { domain: 'loan-payment', paymentId: 'payment-1', componentId, confirmationGroupId }, note: '', ...audit
  };
}

test('v2 完整 component group 才能被確認：本金 0、利息負貢獻的 Ledger 來源完整保留', () => {
  const events = [event('principal', 'principal'), event('interest', 'interest')];
  const normalized = normalizeFinancialEventLedger({ financialEventSchemaVersion: 2, financialEvents: events }, context);
  const resolution = resolveActiveLoanComponentGroups(normalized.events, context);
  assert.equal(FINANCIAL_EVENT_SCHEMA_VERSION, 3);
  assert.equal(normalized.schemaVersion, 2);
  assert.deepEqual([...resolution.validEventIds].sort(), ['interest', 'principal']);
  assert.deepEqual([...resolution.confirmedPaymentIds], ['payment-1']);
});

test('partial confirmation 不能消費 payment；append group 只允許原子完整寫入', () => {
  const partial = [event('principal', 'principal')];
  assert.equal(resolveActiveLoanComponentGroups(partial, context).validEventIds.size, 0);
  const rejected = appendFinancialEventGroup([], partial, context);
  assert.equal(rejected.rejected, true);
  const accepted = appendFinancialEventGroup([], [event('principal', 'principal'), event('interest', 'interest')], context);
  assert.equal(accepted.rejected, false);
  if (!accepted.rejected) assert.equal(accepted.events.length, 2);
});

test('resolver 對 raw component group 也只接受全部 posted：pending、mixed 與 void 一律不確認、不消費 runtime evidence', () => {
  const pending = [
    { ...event('pending-principal', 'principal'), status: 'pending' as const },
    { ...event('pending-interest', 'interest'), status: 'pending' as const }
  ];
  const mixed = [
    event('mixed-principal', 'principal'),
    { ...event('mixed-interest', 'interest'), status: 'pending' as const }
  ];
  assert.equal(resolveActiveLoanComponentGroups(pending, context).validEventIds.size, 0);
  assert.equal(resolveActiveLoanComponentGroups(mixed, context).validEventIds.size, 0);

  const base = {
    openingSnapshot: { date: '2026-08-08', netWorth: 100_000, totalAssets: 100_000, investmentValue: 0, cash: 100_000, debt: 0 },
    closingSnapshot: { date: '2026-08-09', netWorth: 95_000, totalAssets: 95_000, investmentValue: 0, cash: 95_000, debt: 0 },
    transactions: [transaction], accounts: [createFinancialAccount({ id: 'cash-a', name: '現金', type: 'bank', manualBalance: 0 })], loans: [{ id: 'loan-a' }]
  };
  const result = composeRuntimeNetWorthAttribution({ ...base, ledgerEvents: pending });
  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.derivedContribution, -5_000, '無效 component group 不得壓制合法 runtime evidence');
  assert.deepEqual(result.reconciliationResults.map(item => [item.status, item.reason]), [['candidate', 'loan-payment-contract-candidate']]);
});

test('appendFinancialEventGroup 在 API 邊界拒絕不完整、非 confirmation source 與 excluded transaction 的直接寫入', () => {
  const incomplete = appendFinancialEventGroup([], [event('principal', 'principal')], context);
  assert.equal(incomplete.rejected, true);

  const mixedSource = appendFinancialEventGroup([], [
    event('principal', 'principal'),
    { ...event('interest', 'interest'), source: 'linked-transaction' }
  ], context);
  assert.equal(mixedSource.rejected, true);

  const excludedTransaction = { ...transaction, excluded: true };
  const excludedContext = {
    ...context,
    transactionsById: new Map([['repayment-1', excludedTransaction]])
  };
  const excluded = appendFinancialEventGroup([], [event('principal', 'principal'), event('interest', 'interest')], excludedContext);
  assert.equal(excluded.rejected, true);
});

test('appendFinancialEventGroup 在 API 邊界拒絕 status mismatch、component sum 不符與跨 payment component identity 重複', () => {
  const pendingTransaction = { ...transaction, status: 'pending' as const };
  const pendingContext = { ...context, transactionsById: new Map([['repayment-1', pendingTransaction]]) };
  const pendingGroup = [
    { ...event('principal', 'principal'), status: 'pending' as const },
    { ...event('interest', 'interest'), status: 'pending' as const }
  ];
  assert.equal(appendFinancialEventGroup([], pendingGroup, pendingContext).rejected, true);

  const invalidSumTransaction: FinancialTransaction = {
    ...transaction,
    loanAttribution: {
      ...transaction.loanAttribution!,
      components: [
        { componentId: 'principal', type: 'principal', amount: 15_000 },
        { componentId: 'interest', type: 'interest', amount: 4_000 }
      ]
    }
  };
  const invalidSumContext = { ...context, transactionsById: new Map([['repayment-1', invalidSumTransaction]]) };
  assert.equal(appendFinancialEventGroup([], [event('principal', 'principal'), event('interest', 'interest')], invalidSumContext).rejected, true);

  const secondPayment: FinancialTransaction = {
    ...transaction,
    id: 'repayment-2',
    loanAttribution: {
      ...transaction.loanAttribution!,
      paymentId: 'payment-2',
      components: [
        { componentId: 'principal', type: 'principal', amount: 15_000 },
        { componentId: 'interest-2', type: 'interest', amount: 5_000 }
      ]
    }
  };
  const duplicateIdentityContext = {
    ...context,
    transactionIds: new Set(['repayment-1', 'repayment-2']),
    transactionsById: new Map([['repayment-1', transaction], ['repayment-2', secondPayment]])
  };
  assert.equal(appendFinancialEventGroup([], [event('principal', 'principal'), event('interest', 'interest')], duplicateIdentityContext).rejected, true);
});

test('任一 component Void 時整組停止；重新確認只能使用新的完整 confirmation group，不能混接舊 component', () => {
  const oldPrincipal = event('old-principal', 'principal', 'group-old');
  const oldInterest = event('old-interest', 'interest', 'group-old');
  const voidMarker: FinancialEvent = { id: 'void-old-interest', type: 'adjustment', status: 'posted', source: 'void', effectiveDate: '2026-08-09', amount: 1, currency: 'TWD', accountId: 'cash-a', voidedEventId: 'old-interest', note: '', ...audit };
  assert.equal(resolveActiveLoanComponentGroups([oldPrincipal, oldInterest, voidMarker], context).validEventIds.size, 0);
  const fresh = [event('new-principal', 'principal', 'group-new'), event('new-interest', 'interest', 'group-new')];
  const resolution = resolveActiveLoanComponentGroups([oldPrincipal, oldInterest, voidMarker, ...fresh], context);
  assert.deepEqual([...resolution.validEventIds].sort(), ['new-interest', 'new-principal']);
});

test('兩個完整、皆 posted、皆未 void 的 confirmation group 共用同一 paymentId 時，雙方一律 fail-safe 排除，不得各自被確認一次', () => {
  const groupA = [event('a-principal', 'principal', 'group-a'), event('a-interest', 'interest', 'group-a')];
  const groupB = [event('b-principal', 'principal', 'group-b'), event('b-interest', 'interest', 'group-b')];
  const resolution = resolveActiveLoanComponentGroups([...groupA, ...groupB], context);
  assert.equal(resolution.validEventIds.size, 0, '不得任一 group 被單獨採用，也不得兩個 group 都被採用造成 double count');
  assert.equal(resolution.confirmedPaymentIds.size, 0);

  const base = {
    openingSnapshot: { date: '2026-08-08', netWorth: 100_000, totalAssets: 100_000, investmentValue: 0, cash: 100_000, debt: 0 },
    closingSnapshot: { date: '2026-08-09', netWorth: 95_000, totalAssets: 95_000, investmentValue: 0, cash: 95_000, debt: 0 },
    transactions: [transaction], accounts: [createFinancialAccount({ id: 'cash-a', name: '現金', type: 'bank', manualBalance: 0 })], loans: [{ id: 'loan-a' }]
  };
  const result = composeRuntimeNetWorthAttribution({ ...base, ledgerEvents: [...groupA, ...groupB] });
  assert.equal(result.ledgerContribution, 0, '兩組皆未被確認，不得產生 -5,000 或 -10,000 這類 double-count 的 Ledger 貢獻');
  assert.equal(result.derivedContribution, -5_000, '整組失效後仍應 fallback 到單一 C3 derived evidence，不得漏記');
  assert.deepEqual(result.reconciliationResults.map(item => [item.status, item.reason]), [['candidate', 'loan-payment-contract-candidate']]);
});

test('v1 保持可讀，v1/v2 Firebase Ledger 不安全混合一律拒絕', () => {
  const legacy = normalizeFinancialEventLedger({ financialEventSchemaVersion: 1, financialEvents: [] }, context);
  assert.equal(legacy.supported, true);
  assert.equal(legacy.schemaVersion, 1);
  const outcome = mergeFinancialEventLedgers({ schemaVersion: 1, events: [] }, { schemaVersion: 2, events: [] });
  assert.equal(outcome.ok, false);
});

test('完整 confirmed group 壓制 runtime evidence；Void 任一 component 後只會重新辨識完整 contract 一次', () => {
  const group = [event('principal', 'principal'), event('interest', 'interest')];
  const base = {
    openingSnapshot: { date: '2026-08-08', netWorth: 100_000, totalAssets: 100_000, investmentValue: 0, cash: 100_000, debt: 0 },
    closingSnapshot: { date: '2026-08-09', netWorth: 95_000, totalAssets: 95_000, investmentValue: 0, cash: 95_000, debt: 0 },
    transactions: [transaction], accounts: [createFinancialAccount({ id: 'cash-a', name: '現金', type: 'bank', manualBalance: 0 })], loans: [{ id: 'loan-a' }]
  };
  const confirmed = composeRuntimeNetWorthAttribution({ ...base, ledgerEvents: group });
  assert.equal(confirmed.ledgerContribution, -5_000);
  assert.equal(confirmed.derivedContribution, 0);
  assert.deepEqual(confirmed.reconciliationResults.map(item => [item.status, item.reason]), [['matched', 'linked-loan-payment-group']]);
  const voided: FinancialEvent = { id: 'void-interest', type: 'adjustment', status: 'posted', source: 'void', effectiveDate: '2026-08-09', amount: 1, currency: 'TWD', accountId: 'cash-a', voidedEventId: 'interest', note: '', ...audit };
  const rerecognized = composeRuntimeNetWorthAttribution({ ...base, ledgerEvents: [...group, voided] });
  assert.equal(rerecognized.ledgerContribution, 0);
  assert.equal(rerecognized.derivedContribution, -5_000);
  assert.deepEqual(rerecognized.reconciliationResults.map(item => [item.status, item.reason]), [['candidate', 'loan-payment-contract-candidate']]);
});

test('Loan disbursement 可由完整正式 contract 記為零貢獻，但不使用 repayment component group', () => {
  const draw: FinancialTransaction = {
    ...transaction, id: 'draw-1', type: 'income', amount: 200_000, categoryId: 'income-other',
    loanAttribution: { kind: 'disbursement', paymentId: 'draw-payment-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 200_000 }
  };
  const drawContext = { ...context, transactionIds: new Set(['draw-1']), transactionsById: new Map([['draw-1', draw]]) };
  const ledger = normalizeFinancialEventLedger({ financialEventSchemaVersion: 2, financialEvents: [{
    id: 'draw-event', type: 'loan-disbursement', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-09', amount: 200_000, currency: 'TWD', accountId: 'cash-a', loanId: 'loan-a', transactionId: 'draw-1', note: '', ...audit
  }] }, drawContext);
  assert.equal(ledger.events.length, 1);
  assert.equal(ledger.events[0]!.type, 'loan-disbursement');
});
