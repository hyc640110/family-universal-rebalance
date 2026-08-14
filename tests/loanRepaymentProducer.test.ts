import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLoanRepaymentCreation } from '../src/lib/loanRepaymentProducer';
import { validateLoanAttribution } from '../src/lib/loanAttribution';
import { reconcileTransactions } from '../src/lib/transactionReconciliation';
import type { AccountReference } from '../src/lib/transactions';

const accounts: AccountReference[] = [
  { id: 'cash-a', currency: 'TWD', isActive: true },
  { id: 'cash-usd', currency: 'USD', isActive: true },
  { id: 'cash-inactive', currency: 'TWD', isActive: false }
];
const loanIds = new Set(['loan-a']);
const context = { accounts, loanIds, timestamp: '2026-08-14T00:00:00.000Z' };
const baseInput = { loanId: 'loan-a', cashAccountId: 'cash-a', effectiveDate: '2026-08-14', components: {} };

// --- A. Producer pure tests ---

test('1. principal + interest', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 5000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  assert.equal(attribution?.kind, 'repayment');
  if (attribution?.kind !== 'repayment') return;
  assert.equal(attribution.components.length, 2);
  assert.equal(attribution.settlementAmount, 20000);
  assert.equal(result.transaction.amount, 20000);
});

test('2. principal only', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.deepEqual(attribution.components.map(c => c.type), ['principal']);
});

test('3. interest only', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { interest: 5000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.deepEqual(attribution.components.map(c => c.type), ['interest']);
});

test('4. principal = 0 → omitted, not { amount: 0 }', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 0, interest: 5000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.components.some(c => c.type === 'principal'), false, 'a zero-amount component must never be built');
});

test('5. interest = 0 → omitted', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 0 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.components.some(c => c.type === 'interest'), false);
});

test('6. fee = 0 → omitted', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, fee: 0 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.components.some(c => c.type === 'fee'), false);
});

test('7. penalty = 0 → omitted', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, penalty: 0 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.components.some(c => c.type === 'penalty'), false);
});

test('8. fee > 0 is kept as its own component', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, fee: 100 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.components.find(c => c.type === 'fee')?.amount, 100);
});

test('9. penalty > 0 is kept as its own component', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, penalty: 200 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.components.find(c => c.type === 'penalty')?.amount, 200);
});

test('10. all four components > 0', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 5000, fee: 100, penalty: 200 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.components.length, 4);
  assert.equal(attribution.settlementAmount, 20300);
});

test('11. all zero → reject with no-components', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 0, interest: 0, fee: 0, penalty: 0 } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'no-components');
});

test('12. empty → reject with no-components', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: {} }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'no-components');
});

test('13. negative → reject with invalid-component-amount', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: -1 } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'invalid-component-amount');
});

test('14a. NaN → reject with invalid-component-amount', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 'not-a-number' } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'invalid-component-amount');
});

test('14b. Infinity → reject with invalid-component-amount', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: Infinity } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'invalid-component-amount');
});

test('15. settlementAmount = sum of built components', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 5000, fee: 100, penalty: 200 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.settlementAmount, attribution.components.reduce((total, c) => total + c.amount, 0));
});

test('16. transaction.amount = settlementAmount', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 5000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(result.transaction.amount, attribution.settlementAmount);
});

test('17. accountId = cashAccountId', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(result.transaction.accountId, attribution.cashAccountId);
});

test('18. type = expense', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.equal(result.transaction.type, 'expense');
});

test('19. currency = TWD', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.equal(result.transaction.currency, 'TWD');
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(attribution.currency, 'TWD');
});

test('19b. USD account rejected (loanAttribution 目前只支援 TWD)', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, cashAccountId: 'cash-usd', components: { principal: 15000 } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'invalid-account');
});

test('20. paymentId generated (non-empty, distinct across calls)', () => {
  const a = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000 } }, context);
  const b = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000 } }, context);
  assert.equal(a.status, 'success'); assert.equal(b.status, 'success');
  if (a.status !== 'success' || b.status !== 'success') return;
  assert.ok(a.paymentId.length > 0);
  assert.notEqual(a.paymentId, b.paymentId, '每次呼叫必須產生獨立的 paymentId');
});

test('21. componentIds unique within one repayment', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 5000, fee: 100, penalty: 200 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const attribution = result.transaction.loanAttribution;
  if (attribution?.kind !== 'repayment') return assert.fail();
  assert.equal(new Set(attribution.components.map(c => c.componentId)).size, attribution.components.length);
});

test('invalid loan is rejected', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, loanId: 'no-such-loan', components: { principal: 1 } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'invalid-loan');
});

test('inactive account is rejected', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, cashAccountId: 'cash-inactive', components: { principal: 1 } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'invalid-account');
});

test('invalid effective date is rejected', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, effectiveDate: 'not-a-date', components: { principal: 1 } }, context);
  assert.equal(result.status, 'invalid');
  if (result.status !== 'invalid') return;
  assert.equal(result.reason, 'invalid-effective-date');
});

// --- B. Candidate lifecycle (22-23) ---

test('22. Producer output reconciles as candidate, not matched — and never calls the confirmation helper', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 5000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const checked = validateLoanAttribution({ transaction: result.transaction, transactions: [result.transaction], loanIds });
  assert.equal(checked.status, 'valid');
  const reconciled = reconcileTransactions({
    transactions: [result.transaction],
    accounts: [{ id: 'cash-a', name: 'cash-a', currency: 'TWD', isActive: true, type: 'bank', balanceMode: 'manual', manualBalance: 0, institutionName: '', note: '', sortOrder: 0, createdAt: context.timestamp, updatedAt: context.timestamp }],
    ledgerEvents: [],
    loanIds
  });
  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0]?.status, 'candidate');
});

test('23. reason = loan-payment-contract-candidate', () => {
  const result = buildLoanRepaymentCreation({ ...baseInput, components: { principal: 15000, interest: 5000 } }, context);
  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  const reconciled = reconcileTransactions({
    transactions: [result.transaction],
    accounts: [{ id: 'cash-a', name: 'cash-a', currency: 'TWD', isActive: true, type: 'bank', balanceMode: 'manual', manualBalance: 0, institutionName: '', note: '', sortOrder: 0, createdAt: context.timestamp, updatedAt: context.timestamp }],
    ledgerEvents: [],
    loanIds
  });
  assert.equal(reconciled[0]?.reason, 'loan-payment-contract-candidate');
});
