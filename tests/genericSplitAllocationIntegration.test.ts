import assert from 'node:assert/strict';
import test from 'node:test';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import { appendGenericSplitAllocationGroup, FINANCIAL_EVENT_SCHEMA_VERSION, mergeFinancialEventLedgers, normalizeFinancialEventLedger, serializeFinancialEventLedgerEvents, type FinancialEvent } from '../src/lib/financialEvents';
import { resolveActiveGenericSplitAllocationGroups } from '../src/lib/genericSplitAllocation';
import { composeRuntimeNetWorthAttribution } from '../src/lib/runtimeAttributionComposition';
import { reconcileTransactions } from '../src/lib/transactionReconciliation';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-10T00:00:00.000Z', updatedAt: '2026-08-10T00:00:00.000Z' };
const accounts: FinancialAccount[] = [{ id: 'bank-a', name: 'A', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, ...audit }];
const tx: FinancialTransaction = { id: 'tx-1', accountId: 'bank-a', type: 'expense', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'expense-food', description: '', merchant: '', note: '', occurredAt: '2026-08-10T00:00:00.000Z', fingerprint: '', excluded: false, ...audit };
const context = { accountIds: new Set(['bank-a']), loanIds: new Set<string>(), transactionIds: new Set(['tx-1']), transactionsById: new Map([['tx-1', tx]]) };

function event(id: string, componentId: string, amount: number): FinancialEvent {
  return { id, type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-10', amount, currency: 'TWD', accountId: 'bank-a', transactionId: 'tx-1', splitAllocationLink: { domain: 'test-only', allocationGroupId: 'group-1', componentId }, note: '', ...audit };
}

function compose(events: readonly FinancialEvent[] | unknown, schemaVersion = FINANCIAL_EVENT_SCHEMA_VERSION) {
  return composeRuntimeNetWorthAttribution({
    openingSnapshot: { date: '2026-08-09', netWorth: 1_000, totalAssets: 1_000, investmentValue: 0, cash: 1_000, debt: 0 },
    closingSnapshot: { date: '2026-08-10', netWorth: 900, totalAssets: 900, investmentValue: 0, cash: 900, debt: 0 },
    financialEventSchemaVersion: schemaVersion, ledgerEvents: events, transactions: [tx], accounts
  });
}

test('v3 normalizer 與 atomic append 僅接受完整 generic group，v1/v2 不會將 v3 link 當成可讀事件', () => {
  const group = [event('a', 'a', 70), event('b', 'b', 30)];
  const normalized = normalizeFinancialEventLedger({ financialEventSchemaVersion: 3, financialEvents: group }, context);
  assert.equal(FINANCIAL_EVENT_SCHEMA_VERSION, 3);
  assert.deepEqual(normalized.events.map(item => item.id), ['a', 'b']);
  const appended = appendGenericSplitAllocationGroup([], group, context);
  assert.equal(appended.rejected, false);
  const v2 = normalizeFinancialEventLedger({ financialEventSchemaVersion: 2, financialEvents: group }, context);
  assert.equal(v2.events.length, 0);
});

test('v2 runtime 讀取 v3 Ledger envelope 時保留 opaque payload，且只產生 derived evidence', () => {
  const group = [event('legacy-a', 'a', 70), event('legacy-b', 'b', 30)];
  const persistedEvents = serializeFinancialEventLedgerEvents(3, group);
  const legacyLedger = normalizeFinancialEventLedger(
    { financialEventSchemaVersion: 3, financialEvents: persistedEvents },
    context,
    { supportedSchemaVersions: [1, 2] }
  );

  assert.equal(legacyLedger.supported, false);
  assert.deepEqual(legacyLedger.events, persistedEvents);
  const composition = composeRuntimeNetWorthAttribution({
    openingSnapshot: { date: '2026-08-09', netWorth: 1_000, totalAssets: 1_000, investmentValue: 0, cash: 1_000, debt: 0 },
    closingSnapshot: { date: '2026-08-10', netWorth: 900, totalAssets: 900, investmentValue: 0, cash: 900, debt: 0 },
    financialEventSchemaVersion: 3,
    supportedSchemaVersions: [1, 2],
    ledgerEvents: legacyLedger.events,
    transactions: [tx],
    accounts
  });

  assert.equal(composition.ledgerContribution, null);
  assert.equal(composition.reconciliationResults[0]?.status, 'candidate');
  assert.equal(composition.eventClassifications.some(item => item.provenance === 'ledger'), false);
  assert.equal(composition.eventClassifications.some(item => item.provenance === 'derived-transaction'), true);
});

test('完整 group 只 group-level reconciliation matched 一次並抑制同交易 derived evidence', () => {
  const group = [event('a', 'a', 70), event('b', 'b', 30)];
  const reconciliation = reconcileTransactions({ transactions: [tx], accounts, ledgerEvents: group });
  assert.deepEqual(reconciliation.map(item => [item.status, item.reason]), [['matched', 'linked-generic-split-group']]);
  const result = compose(group);
  assert.equal(result.ledgerContribution, -100);
  assert.equal(result.derivedContribution, 0);
  assert.equal(result.reconciliationResults[0]?.reason, 'linked-generic-split-group');
});

test('partial group 不產生 Ledger attribution 或 transaction consumption，仍走既有 derived 安全路徑', () => {
  const result = compose([event('partial', 'a', 70)]);
  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.reconciliationResults[0]?.status, 'candidate');
  assert.equal(result.derivedContribution, -100);
});

test('replacement component 重用既有 event id 時 append 必須拒絕，不能覆寫舊 group', () => {
  const old = [
    { ...event('old-a', 'a', 70), splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'a' } },
    { ...event('old-b', 'b', 30), splitAllocationLink: { domain: 'test-only', allocationGroupId: 'old', componentId: 'b' } }
  ];
  const voidMarker: FinancialEvent = { id: 'void-old-a', type: 'adjustment', status: 'void', source: 'void', effectiveDate: '2026-08-10', amount: 0, currency: 'TWD', accountId: 'bank-a', voidedEventId: 'old-a', note: '', ...audit };
  const replacement = [
    { ...event('old-a', 'a', 70), splitAllocationLink: { domain: 'test-only', allocationGroupId: 'new', componentId: 'a', replacementOfGroupId: 'old' } },
    { ...event('new-b', 'b', 30), splitAllocationLink: { domain: 'test-only', allocationGroupId: 'new', componentId: 'b', replacementOfGroupId: 'old' } }
  ];
  const appended = appendGenericSplitAllocationGroup([...old, voidMarker], replacement, context);
  assert.equal(appended.rejected, true);
});

test('partial group 遇到既有 unsupported transaction 時不猜測 remainder，完整差額保留 residual', () => {
  const unsupportedTransaction = { ...tx, id: 'housing', categoryId: 'expense-housing', description: '不可自動解讀的支出' };
  const partial = { ...event('housing-partial', 'a', 70), transactionId: 'housing' };
  const result = composeRuntimeNetWorthAttribution({
    openingSnapshot: { date: '2026-08-09', netWorth: 1_000, totalAssets: 1_000, investmentValue: 0, cash: 1_000, debt: 0 },
    closingSnapshot: { date: '2026-08-10', netWorth: 900, totalAssets: 900, investmentValue: 0, cash: 900, debt: 0 },
    financialEventSchemaVersion: 3, ledgerEvents: [partial], transactions: [unsupportedTransaction], accounts
  });
  assert.equal(result.ledgerContribution, 0);
  assert.equal(result.derivedContribution, 0);
  assert.equal(result.unexplainedResidual, -100);
});

test('Firebase union 的 partial group 可決定性收斂但不歸因；完整 union 才在兩個方向一致有效', () => {
  const a = event('a', 'a', 70);
  const b = event('b', 'b', 30);
  const partial = mergeFinancialEventLedgers({ schemaVersion: 3, events: [a] }, { schemaVersion: 3, events: [] });
  assert.equal(partial.ok, true);
  if (!partial.ok) return;
  assert.equal(resolveActiveGenericSplitAllocationGroups(partial.events, { transactionsById: new Map([['tx-1', tx]]) }).validEventIds.size, 0);
  const forward = mergeFinancialEventLedgers({ schemaVersion: 3, events: [a] }, { schemaVersion: 3, events: [b] });
  const reverse = mergeFinancialEventLedgers({ schemaVersion: 3, events: [b] }, { schemaVersion: 3, events: [a] });
  assert.equal(forward.ok, true);
  assert.equal(reverse.ok, true);
  if (!forward.ok || !reverse.ok) return;
  assert.deepEqual(forward.events.map(item => item.id), reverse.events.map(item => item.id));
  assert.deepEqual([...resolveActiveGenericSplitAllocationGroups(forward.events, { transactionsById: new Map([['tx-1', tx]]) }).validEventIds].sort(), ['a', 'b']);
});

test('future opaque schema 不消費 raw Ledger，但既有 derived evidence 不被 suppression', () => {
  const result = compose({ opaque: 'must-not-be-read' }, 4);
  assert.equal(result.ledgerContribution, null);
  assert.equal(result.derivedContribution, -100);
  assert.equal(result.reconciliationResults[0]?.status, 'candidate');
  assert.equal(result.diagnostics.some(item => item.code === 'financial-event-ledger-schema-unsupported'), true);
});
