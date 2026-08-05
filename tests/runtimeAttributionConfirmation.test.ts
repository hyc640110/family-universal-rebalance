import assert from 'node:assert/strict';
import test from 'node:test';
import type { FinancialAccount } from '../src/lib/financialAccounts';
import { appendFinancialEvent, type FinancialEvent } from '../src/lib/financialEvents';
import { buildAttributionConfirmationEvent, confirmAttributionEvidenceAndAppend } from '../src/lib/runtimeAttributionConfirmation';
import { composeRuntimeNetWorthAttribution } from '../src/lib/runtimeAttributionComposition';
import { reconcileTransactions } from '../src/lib/transactionReconciliation';
import type { FinancialTransaction } from '../src/lib/transactions';

const audit = { createdAt: '2026-08-05T00:00:00.000Z', updatedAt: '2026-08-05T00:00:00.000Z' };
const now = '2026-08-05T12:00:00.000Z';

const accounts: FinancialAccount[] = [
  { id: 'bank-a', name: 'A', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, ...audit },
  { id: 'bank-b', name: 'B', type: 'bank', balanceMode: 'manual', manualBalance: 0, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 1, ...audit }
];

function transaction(id: string, patch: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id, accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 30_000,
    currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '',
    occurredAt: '2026-08-03T00:00:00.000Z', fingerprint: '', excluded: false, ...audit, ...patch
  };
}

function snapshot(date: string, netWorth: number) {
  return { date, netWorth, totalAssets: netWorth, investmentValue: 0, cash: netWorth, debt: 0 };
}

test('buildAttributionConfirmationEvent 依 transaction 產生合法 posted／attribution-confirmation 事件', () => {
  const txn = transaction('income-1');
  const result = buildAttributionConfirmationEvent({
    evidence: { transactionId: 'income-1', effectiveDate: '2026-08-03', category: 'external-income', amount: 30_000 },
    transaction: txn,
    now
  });

  assert.equal(result.rejected, false);
  if (!result.rejected) {
    assert.equal(result.event.type, 'external-income');
    assert.equal(result.event.status, 'posted');
    assert.equal(result.event.source, 'attribution-confirmation');
    assert.equal(result.event.transactionId, 'income-1');
    assert.equal(result.event.accountId, 'bank-a');
    assert.equal(result.event.currency, 'TWD');
    assert.equal(result.event.amount, 30_000);
    assert.equal(result.event.effectiveDate, '2026-08-03');
    assert.equal(result.event.createdAt, now);
    assert.equal(result.event.updatedAt, now);
    assert.ok(result.event.id.length > 0);
    assert.ok(result.event.note.includes(now));
  }
});

test('internal-transfer 從 transaction.transferAccountId 帶出 counterpartyAccountId', () => {
  const txn = transaction('transfer-1', { type: 'transfer', categoryId: 'transfer-account', transferAccountId: 'bank-b' });
  const result = buildAttributionConfirmationEvent({
    evidence: { transactionId: 'transfer-1', effectiveDate: '2026-08-03', category: 'internal-transfer', amount: 30_000 },
    transaction: txn,
    now
  });
  assert.equal(result.rejected, false);
  if (!result.rejected) assert.equal(result.event.counterpartyAccountId, 'bank-b');
});

test('taxonomy 不符時明確拒絕並附帶原因，不靜默略過驗證', () => {
  const dividendTransaction = transaction('income-2', { categoryId: 'income-dividend' });
  const result = buildAttributionConfirmationEvent({
    evidence: { transactionId: 'income-2', effectiveDate: '2026-08-03', category: 'external-income', amount: 30_000 },
    transaction: dividendTransaction,
    now
  });
  assert.equal(result.rejected, true);
  if (result.rejected) assert.match(result.reason, /external-income 只可連結非股息/);
});

test('evidence.transactionId 與傳入 transaction 不一致時拒絕，不猜測比對', () => {
  const result = buildAttributionConfirmationEvent({
    evidence: { transactionId: 'someone-else', effectiveDate: '2026-08-03', category: 'external-income', amount: 30_000 },
    transaction: transaction('income-3'),
    now
  });
  assert.equal(result.rejected, true);
  if (result.rejected) assert.match(result.reason, /transactionId 不符/);
});

test('confirmAttributionEvidenceAndAppend：成功時回傳 append 後的陣列，拒絕時不回傳 events', () => {
  const txn = transaction('income-4');
  const ok = confirmAttributionEvidenceAndAppend({
    evidence: { transactionId: 'income-4', effectiveDate: '2026-08-03', category: 'external-income', amount: 30_000 },
    transaction: txn,
    now
  }, []);
  assert.equal(ok.rejected, false);
  if (!ok.rejected) {
    assert.equal(ok.events.length, 1);
    assert.equal(ok.events[0]?.transactionId, 'income-4');
  }

  const dividendTransaction = transaction('income-5', { categoryId: 'income-dividend' });
  const rejected = confirmAttributionEvidenceAndAppend({
    evidence: { transactionId: 'income-5', effectiveDate: '2026-08-03', category: 'external-income', amount: 30_000 },
    transaction: dividendTransaction,
    now
  }, []);
  assert.equal(rejected.rejected, true);
});

test('appendFinancialEvent 的 forward-only 防呆會擋下 confirmAttributionEvidenceAndAppend 對既有 id 的重複寫入', () => {
  const txn = transaction('income-6');
  const built = buildAttributionConfirmationEvent({
    evidence: { transactionId: 'income-6', effectiveDate: '2026-08-03', category: 'external-income', amount: 30_000 },
    transaction: txn,
    now
  });
  assert.equal(built.rejected, false);
  if (built.rejected) return;

  const collision = appendFinancialEvent([built.event], built.event);
  assert.equal(collision.rejected, true);
  if (collision.rejected) assert.match(collision.reason, /forward-only|不允許覆寫/);
});

// UR-TODO-046-C3C-C 連帶效果驗證：確認後該交易應被 isEventForTransaction() 判定為 matched，
// derivedContribution 不再包含它，改由 ledgerContribution 貢獻；四個數字加總前後一致。
test('確認並寫入後：交易變成 matched、不再產生 derived evidence，且四個歸因數字加總前後一致', () => {
  const txn = transaction('income-7', { amount: 30_000, occurredAt: '2026-08-03T00:00:00.000Z' });
  const opening = snapshot('2026-08-01', 5_000_000);
  const closing = snapshot('2026-08-05', 5_030_000);

  const before = composeRuntimeNetWorthAttribution({
    openingSnapshot: opening, closingSnapshot: closing, ledgerEvents: [], transactions: [txn], accounts
  });
  assert.equal(before.ledgerContribution, 0);
  assert.equal(before.derivedContribution, 30_000);
  const beforeReconciliation = reconcileTransactions({ transactions: [txn], accounts, ledgerEvents: [] });
  assert.equal(beforeReconciliation[0]?.status, 'candidate');

  const confirmation = confirmAttributionEvidenceAndAppend({
    evidence: { transactionId: 'income-7', effectiveDate: '2026-08-03', category: 'external-income', amount: 30_000 },
    transaction: txn,
    now
  }, []);
  assert.equal(confirmation.rejected, false);
  if (confirmation.rejected) return;
  const financialEvents: FinancialEvent[] = confirmation.events;

  const afterReconciliation = reconcileTransactions({ transactions: [txn], accounts, ledgerEvents: financialEvents });
  assert.equal(afterReconciliation[0]?.status, 'matched', 'attribution-confirmation 事件必須被 isEventForTransaction() 判定為 matched，而非停留在 candidate');

  const after = composeRuntimeNetWorthAttribution({
    openingSnapshot: opening, closingSnapshot: closing, ledgerEvents: financialEvents, transactions: [txn], accounts
  });
  assert.equal(after.ledgerContribution, 30_000, '貢獻應改由 Ledger 承接');
  assert.equal(after.derivedContribution, 0, '同一筆交易不得再重複產生 derived evidence（否則會雙重計算）');
  assert.equal(
    (before.ledgerContribution ?? 0) + (before.derivedContribution ?? 0),
    (after.ledgerContribution ?? 0) + (after.derivedContribution ?? 0),
    '確認動作只是換了個分類來源，不應改變這筆交易對總貢獻的加總金額'
  );
  assert.equal(after.netWorthChange, before.netWorthChange);
  assert.equal(after.unexplainedResidual, before.unexplainedResidual);
  assert.equal(after.netWorthChange, (after.ledgerContribution ?? 0) + (after.derivedContribution ?? 0) + (after.unexplainedResidual ?? 0));
});
