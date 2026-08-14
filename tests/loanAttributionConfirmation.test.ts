import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLoanPaymentConfirmationGroup, confirmLoanPaymentGroupAndAppend } from '../src/lib/loanAttributionConfirmation';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z' };
const transaction: FinancialTransaction = { id: 'payment', accountId: 'cash-a', type: 'expense', status: 'posted', source: 'manual', amount: 20_000, currency: 'TWD', categoryId: 'expense-housing', description: '', merchant: '', note: '', occurredAt: '2026-08-09T00:00:00.000Z', fingerprint: '', excluded: false, ...audit, loanAttribution: { kind: 'repayment', paymentId: 'payment-1', loanId: 'loan-a', cashAccountId: 'cash-a', currency: 'TWD', settlementAmount: 20_000, components: [{ componentId: 'principal', type: 'principal', amount: 15_000 }, { componentId: 'interest', type: 'interest', amount: 5_000 }] } };
const context = { accountIds: new Set(['cash-a']), loanIds: new Set(['loan-a']), transactionIds: new Set(['payment']), transactionsById: new Map([['payment', transaction]]) };

test('Loan confirmation 一次建立完整新 group，禁止逐 component append', () => {
  const result = buildLoanPaymentConfirmationGroup({ transaction, transactions: [transaction], loanIds: new Set(['loan-a']), now: audit.createdAt });
  assert.equal(result.rejected, false);
  if (result.rejected) return;
  assert.equal(result.events.length, 2);
  assert.equal(new Set(result.events.map(event => event.componentLink?.confirmationGroupId)).size, 1);
  const appended = confirmLoanPaymentGroupAndAppend({ transaction, transactions: [transaction], loanIds: new Set(['loan-a']), now: audit.createdAt }, [], context);
  assert.equal(appended.rejected, false);
});

test('UR-TODO-054-A caller contract: confirmLoanPaymentGroupAndAppend() 成功時 result.events 只是新建的 group（不含既有 existingEvents）— 呼叫端必須自行 append，而非用它取代整個 Ledger', () => {
  const unrelatedExistingEvent = { id: 'unrelated-event', type: 'adjustment' as const, status: 'posted' as const, source: 'manual' as const, effectiveDate: '2026-08-01', amount: 1, currency: 'TWD', accountId: 'cash-a', note: '', ...audit };
  const result = confirmLoanPaymentGroupAndAppend({ transaction, transactions: [transaction], loanIds: new Set(['loan-a']), now: audit.createdAt }, [unrelatedExistingEvent], context);
  assert.equal(result.rejected, false);
  if (result.rejected) return;
  assert.equal(result.events.length, 2, 'events must be exactly the two new component events, not existingEvents.length + 2');
  assert.ok(!result.events.some(event => event.id === 'unrelated-event'), 'the pre-existing event must not be echoed back in result.events');
});

test('UR-TODO-054-A PR #331 Preview blocker regression: buildLoanPaymentConfirmationGroup() throws (not rejects) on a malformed transaction.occurredAt — its canonicalCalendarDay() call is unguarded, so any caller MUST wrap it in try/catch or the confirm click silently produces zero visible effect', () => {
  const malformedDateTransaction: FinancialTransaction = { ...transaction, occurredAt: 'not-a-date' };
  assert.throws(
    () => buildLoanPaymentConfirmationGroup({ transaction: malformedDateTransaction, transactions: [malformedDateTransaction], loanIds: new Set(['loan-a']), now: audit.createdAt }),
    RangeError,
    'this documents the real risk App.tsx\'s confirmLoanRepaymentGroup() now guards against with try/catch — see the "確認時發生未預期的錯誤" fallback in App.tsx'
  );
  // App.tsx never calls buildLoanPaymentConfirmationGroup() directly, only confirmLoanPaymentGroupAndAppend() — same unguarded call path.
  assert.throws(() => confirmLoanPaymentGroupAndAppend({ transaction: malformedDateTransaction, transactions: [malformedDateTransaction], loanIds: new Set(['loan-a']), now: audit.createdAt }, [], { ...context, transactionsById: new Map([['payment', malformedDateTransaction]]) }), RangeError);
});

test('不完整或不合法 contract 拒絕確認，既有 Ledger 不會被局部寫入', () => {
  const invalid = { ...transaction, loanAttribution: { ...transaction.loanAttribution!, components: [{ componentId: 'principal', type: 'principal' as const, amount: 1 }] } };
  const result = confirmLoanPaymentGroupAndAppend({ transaction: invalid, transactions: [invalid], loanIds: new Set(['loan-a']) }, [], { ...context, transactionsById: new Map([['payment', invalid]]) });
  assert.equal(result.rejected, true);
});
