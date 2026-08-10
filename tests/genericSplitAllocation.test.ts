import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveActiveGenericSplitAllocationGroups } from '../src/lib/genericSplitAllocation';
import type { FinancialEvent } from '../src/lib/financialEvents';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z' };

function transaction(id = 'tx-1', amount = 100): FinancialTransaction {
  return {
    id, accountId: 'bank-a', type: 'expense', status: 'posted', source: 'manual', amount,
    currency: 'TWD', categoryId: 'expense-food', description: '', merchant: '', note: '',
    occurredAt: '2026-08-10T00:00:00.000Z', fingerprint: '', excluded: false, ...audit
  };
}

function component(id: string, componentId: string, amount: number, patch: Partial<FinancialEvent> = {}): FinancialEvent {
  return {
    id, type: 'external-expense', status: 'posted', source: 'attribution-confirmation',
    effectiveDate: '2026-08-10', amount, currency: 'TWD', accountId: 'bank-a', transactionId: 'tx-1',
    splitAllocationLink: { domain: 'test-only', allocationGroupId: 'group-1', componentId },
    note: '', ...audit, ...patch
  };
}

function resolve(events: FinancialEvent[], transactions: FinancialTransaction[] = [transaction()]) {
  return resolveActiveGenericSplitAllocationGroups(events, { transactionsById: new Map(transactions.map(item => [item.id, item])) });
}

test('完整、守恆的 generic group 才能作為一個 group-level transaction match', () => {
  const result = resolve([component('a', 'principal', 70), component('b', 'interest', 30)]);
  assert.deepEqual([...result.validEventIds].sort(), ['a', 'b']);
  assert.deepEqual([...result.matchedTransactionIds], ['tx-1']);
});

test('partial、under-sum、over-sum 與 duplicate component 都不得歸因或 consume transaction', () => {
  for (const events of [
    [component('only', 'principal', 70)],
    [component('under-a', 'principal', 50), component('under-b', 'interest', 40)],
    [component('over-a', 'principal', 80), component('over-b', 'interest', 30)],
    [component('dup-a', 'same', 50), component('dup-b', 'same', 50)]
  ]) {
    const result = resolve(events);
    assert.equal(result.validEventIds.size, 0);
    assert.equal(result.matchedTransactionIds.size, 0);
  }
});

test('同一 transaction 的多個 active groups 必須整體 fail-safe', () => {
  const result = resolve([
    component('a1', 'a1', 100, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'group-a', componentId: 'a1' } }),
    component('b1', 'b1', 100, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'group-b', componentId: 'b1' } })
  ]);
  assert.equal(result.validEventIds.size, 0);
  assert.equal(result.matchedTransactionIds.size, 0);
});

test('任一 component 被 Void 時整個 group 失效；replacement 僅在舊 group 已失效時可生效', () => {
  const oldA = component('old-a', 'a', 70, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'a' } });
  const oldB = component('old-b', 'b', 30, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'b' } });
  const marker = component('void-old-a', 'void', 1, { type: 'adjustment', source: 'void', status: 'void', voidedEventId: 'old-a', transactionId: undefined, splitAllocationLink: undefined });
  const newA = component('new-a', 'a', 70, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'new', componentId: 'a', replacementOfGroupId: 'old' } });
  const newB = component('new-b', 'b', 30, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'new', componentId: 'b', replacementOfGroupId: 'old' } });
  const result = resolve([oldA, oldB, marker, newA, newB]);
  assert.deepEqual([...result.validEventIds].sort(), ['new-a', 'new-b']);
  assert.deepEqual([...result.matchedTransactionIds], ['tx-1']);
});

test('replacement 不得在被取代 group 仍完整 active 時並存，舊 group 維持唯一有效', () => {
  const old = [
    component('old-a', 'a', 70, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'a' } }),
    component('old-b', 'b', 30, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'b' } })
  ];
  const replacement = [
    component('new-a', 'a', 70, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'new', componentId: 'a', replacementOfGroupId: 'old' } }),
    component('new-b', 'b', 30, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'new', componentId: 'b', replacementOfGroupId: 'old' } })
  ];
  const result = resolve([...old, ...replacement]);
  assert.deepEqual([...result.validEventIds].sort(), ['old-a', 'old-b']);
  assert.deepEqual([...result.matchedTransactionIds], ['tx-1']);
});

test('同一 allocationGroupId 跨 domain 或跨 transaction 時必須整體 fail-safe invalid', () => {
  const crossDomain = resolve([
    component('domain-a', 'a', 70),
    component('domain-b', 'b', 30, { splitAllocationLink: { domain: 'other-domain', allocationGroupId: 'group-1', componentId: 'b' } })
  ]);
  assert.equal(crossDomain.validEventIds.size, 0);

  const tx2 = transaction('tx-2', 30);
  const crossTransaction = resolve([
    component('tx-a', 'a', 70),
    component('tx-b', 'b', 30, { transactionId: 'tx-2' })
  ], [transaction(), tx2]);
  assert.equal(crossTransaction.validEventIds.size, 0);
});

test('replacement 不得重用舊 allocationGroupId', () => {
  const oldA = component('old-a', 'a', 70, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'a' } });
  const oldB = component('old-b', 'b', 30, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'b' } });
  const marker = component('void-old-a', 'void', 1, { type: 'adjustment', source: 'void', status: 'void', voidedEventId: 'old-a', transactionId: undefined, splitAllocationLink: undefined });
  const reusedA = component('replacement-a', 'a', 70, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'a', replacementOfGroupId: 'old' } });
  const reusedB = component('replacement-b', 'b', 30, { splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'b', replacementOfGroupId: 'old' } });
  const result = resolve([oldA, oldB, marker, reusedA, reusedB]);
  assert.equal(result.validEventIds.size, 0);
  assert.equal(result.matchedTransactionIds.size, 0);
});
