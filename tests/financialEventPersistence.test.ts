import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { createFinancialAccount } from '../src/lib/financialAccounts';
import { canonicalSyncPayload } from '../src/lib/syncState';

type AppPersistence = {
  normalizeState(raw: unknown): { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string; transactions: unknown[] };
  backupPayload(state: unknown, quotes: Record<string, unknown>): unknown;
  stateFromBackup(raw: unknown, current: unknown): { state: { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string; transactions: unknown[] } };
  stateFromFirebasePayload(raw: unknown, config: unknown, current: unknown): { state: { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string; transactions: unknown[] }; droppedFinancialEventCount?: number };
  uploadFirebaseStateWithLedgerMerge(config: unknown, state: unknown, uid: string, idToken: string): Promise<unknown>;
  runtimeAttributionMemoDependencies(input: { openingSnapshot: unknown; closingSnapshot: unknown; financialEventSchemaVersion: number; financialEvents: unknown; transactions: unknown; accounts: unknown; loans: unknown }): readonly unknown[];
};

async function loadAppPersistence(): Promise<AppPersistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try {
    return await server.ssrLoadModule('/src/App.tsx') as AppPersistence;
  } finally {
    await server.close();
  }
}

const event = {
  id: 'event-dividend',
  type: 'dividend',
  status: 'posted',
  source: 'linked-transaction',
  effectiveDate: '2026-08-02',
  amount: 900,
  currency: 'TWD',
  accountId: 'bank-a',
  assetSymbol: '00865B',
  transactionId: 'tx-a',
  note: '現金股利',
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z'
};

async function stateWithLedger() {
  const { normalizeState } = await loadAppPersistence();
  return normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    loans: [{ id: 'loan-a', name: '信貸', principal: 1000, annualRate: 2, monthlyPayment: 100, startDate: '2026-01-01' }],
    transactions: [{ id: 'tx-a', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 900, currency: 'TWD', categoryId: 'income-dividend', description: '股利', merchant: '', note: '', occurredAt: '2026-08-02T00:00:00.000Z', excluded: false }],
    financialEventSchemaVersion: 1,
    financialEventAttributionStartDate: '2026-08-02',
    financialEvents: [event]
  });
}

async function stateWithLoanComponentLedger() {
  const { normalizeState } = await loadAppPersistence();
  const timestamp = '2026-08-09T00:00:00.000Z';
  return normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    loans: [{ id: 'loan-a', name: '信貸', principal: 100_000, annualRate: 2, monthlyPayment: 3_000, startDate: '2026-01-01' }],
    transactions: [{
      id: 'loan-payment', accountId: 'bank-a', type: 'expense', status: 'posted', source: 'manual', amount: 20_000, currency: 'TWD', categoryId: 'expense-housing', description: '', merchant: '', note: '', occurredAt: timestamp, excluded: false,
      loanAttribution: {
        kind: 'repayment', paymentId: 'payment-1', loanId: 'loan-a', cashAccountId: 'bank-a', currency: 'TWD', settlementAmount: 20_000,
        components: [{ componentId: 'principal', type: 'principal', amount: 15_000 }, { componentId: 'interest', type: 'interest', amount: 5_000 }]
      }
    }],
    financialEventSchemaVersion: 2,
    financialEvents: [{
      id: 'loan-principal', type: 'loan-principal-payment', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-09', amount: 15_000, currency: 'TWD', accountId: 'bank-a', loanId: 'loan-a', transactionId: 'loan-payment',
      componentLink: { domain: 'loan-payment', paymentId: 'payment-1', componentId: 'principal', confirmationGroupId: 'loan-group-1' }, note: '', createdAt: timestamp, updatedAt: timestamp
    }, {
      id: 'loan-interest', type: 'loan-interest-payment', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-09', amount: 5_000, currency: 'TWD', accountId: 'bank-a', loanId: 'loan-a', transactionId: 'loan-payment',
      componentLink: { domain: 'loan-payment', paymentId: 'payment-1', componentId: 'interest', confirmationGroupId: 'loan-group-1' }, note: '', createdAt: timestamp, updatedAt: timestamp
    }]
  });
}

test('localStorage 正規化與 JSON Backup 匯出匯入保留有效 Ledger；UR-TODO-046 起 Firebase payload 含 financialEvents／schemaVersion，attributionStartDate 仍不進入（本次範圍未涵蓋）', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadAppPersistence();
  const localState = await stateWithLedger();
  const backup = backupPayload(localState, {});
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;

  for (const state of [localState, restored]) {
    assert.equal(state.financialEventSchemaVersion, 1);
    assert.equal(state.financialEventAttributionStartDate, '2026-08-02');
    assert.deepEqual(state.financialEvents, [event]);
  }
  const firebasePayload = canonicalSyncPayload(localState);
  assert.equal('financialEvents' in firebasePayload, true);
  assert.equal('financialEventSchemaVersion' in firebasePayload, true);
  assert.deepEqual(firebasePayload.financialEvents, [event]);
  assert.equal(firebasePayload.financialEventSchemaVersion, 1);
  // Scope decision (UR-TODO-046 Ledger sync): attributionStartDate was not part of the approved
  // merge scope and stays local/Backup-only, same as before this feature.
  assert.equal('financialEventAttributionStartDate' in firebasePayload, false);
});

test('v2 Loan component group 在 localStorage、JSON Backup 與 Firebase payload 中加法式保存；舊 Ledger 不需要 migration', async () => {
  const { backupPayload, normalizeState, stateFromBackup, stateFromFirebasePayload } = await loadAppPersistence();
  const localState = await stateWithLoanComponentLedger();
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backupPayload(localState, {}))), normalizeState({})).state;

  for (const state of [localState, restored]) {
    assert.equal(state.financialEventSchemaVersion, 2);
    assert.equal(state.financialEvents.length, 2);
    assert.equal((state.transactions[0] as { loanAttribution?: { paymentId?: string } }).loanAttribution?.paymentId, 'payment-1');
  }
  const firebasePayload = canonicalSyncPayload(localState);
  const firebaseState = stateFromFirebasePayload(firebasePayload, { databaseURL: 'https://example.invalid', secretPath: 'root' }, localState).state;
  assert.equal(firebaseState.financialEventSchemaVersion, 2);
  assert.equal(firebaseState.financialEvents.length, 2);
});

test('v3 generic split group 在 localStorage、JSON Backup 與 Firebase payload 中完整 round-trip', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadAppPersistence();
  const timestamp = '2026-08-10T00:00:00.000Z';
  const state = normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'split-expense', accountId: 'bank-a', type: 'expense', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'expense-food', description: '', merchant: '', note: '', occurredAt: timestamp, excluded: false }],
    financialEventSchemaVersion: 3,
    financialEvents: [{ id: 'split-a', type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-10', amount: 70, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', splitAllocationLink: { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'a' }, note: '', createdAt: timestamp, updatedAt: timestamp }, { id: 'split-b', type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-10', amount: 30, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', splitAllocationLink: { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'b' }, note: '', createdAt: timestamp, updatedAt: timestamp }]
  });
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backupPayload(state, {}))), normalizeState({})).state;
  for (const value of [state, restored]) {
    assert.equal(value.financialEventSchemaVersion, 3);
    assert.equal(value.financialEvents.length, 2);
  }
  const firebasePayload = canonicalSyncPayload(state);
  assert.equal(firebasePayload.financialEventSchemaVersion, 3);
  assert.equal((firebasePayload.financialEvents as unknown[]).length, 2);
});

test('舊 build persisted syncMeta.status 不會在 v3 runtime 或 JSON Backup 成為目前同步錯誤', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadAppPersistence();
  const stale = '❌ Firebase 同步失敗：Financial Event Ledger schema 版本不受支援（本機 v1／雲端 v2，目前支援 v2）';
  const local = normalizeState({
    financialEventSchemaVersion: 1,
    financialEvents: [],
    syncMeta: { dirty: true, source: '本機資料', status: stale, lastUploadAt: '2026-08-10T00:00:00.000Z' }
  });
  const backup = backupPayload(local, {}) as { syncMeta: Record<string, unknown> };
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;

  assert.equal('status' in local.syncMeta, false);
  assert.equal('status' in backup.syncMeta, false);
  assert.equal('status' in restored.syncMeta, false);
  assert.equal(local.financialEventSchemaVersion, 1);
  assert.deepEqual(local.financialEvents, []);
});

test('Firebase v2/v3 mixed Ledger merge fail-safe 拒絕，沒有產生 partial merge payload', async () => {
  const { stateFromFirebasePayload } = await loadAppPersistence();
  const current = await stateWithLoanComponentLedger();
  const remote = { financialEventSchemaVersion: 3, financialEvents: [] };
  assert.throws(() => stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current), /schema 版本不受支援/);
});

test('Firebase upload 在 v2/v3 mixed Ledger merge 拒絕後絕不發出 PUT，也不覆寫遠端', async () => {
  const { normalizeState, uploadFirebaseStateWithLedgerMerge } = await loadAppPersistence();
  const local = await stateWithLoanComponentLedger();
  const calls: Array<{ method?: string }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    calls.push({ method: init?.method });
    return new Response(JSON.stringify(normalizeState({ financialEventSchemaVersion: 3, financialEvents: [] })), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    await assert.rejects(
      () => uploadFirebaseStateWithLedgerMerge({ databaseURL: 'https://example.invalid', secretPath: 'root' }, local, 'user-1', 'token-1'),
      /schema 版本不受支援/
    );
    assert.deepEqual(calls, [{ method: undefined }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('App attribution memo dependencies 將 Ledger schema version 視為獨立 recomputation input', async () => {
  const { runtimeAttributionMemoDependencies } = await loadAppPersistence();
  const common = { openingSnapshot: { date: '2026-08-09' }, closingSnapshot: { date: '2026-08-10' }, financialEvents: [], transactions: [], accounts: [], loans: [] };
  const v2 = runtimeAttributionMemoDependencies({ ...common, financialEventSchemaVersion: 2 });
  const v3 = runtimeAttributionMemoDependencies({ ...common, financialEventSchemaVersion: 3 });
  assert.notDeepEqual(v2, v3);
});

test('舊資料在三條讀取路徑維持空 Ledger，不自動將歷史交易變成事件', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadAppPersistence();
  const legacy = normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'tx-a', accountId: 'bank-a', type: 'income', amount: 900, occurredAt: '2026-08-02T00:00:00.000Z' }]
  });
  const firebaseLegacy = normalizeState(canonicalSyncPayload(legacy));
  const restoredLegacy = stateFromBackup(JSON.parse(JSON.stringify(backupPayload(legacy, {}))), normalizeState({})).state;

  for (const state of [legacy, firebaseLegacy, restoredLegacy]) {
    assert.equal(state.financialEventSchemaVersion, 3);
    assert.deepEqual(state.financialEvents, []);
    assert.equal(state.financialEventAttributionStartDate, undefined);
    assert.equal(state.transactions.length, 1);
  }
});

// UR-TODO-046 Firebase Ledger Sync: download now merges (union by id) instead of the old blanket
// fail-safe reject. Both sides' unique events must survive; a shared account is needed so both
// sides' linked events pass linkedTransactionReason() validation against their own transactions.
test('Firebase download 在本機與雲端皆有支援版本 Ledger 時自動合併，雙邊各自獨有事件皆保留', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = await stateWithLedger(); // local: event-dividend, linked to tx-a
  const remoteOnlyEvent = {
    id: 'event-remote-only',
    type: 'external-income',
    status: 'posted',
    source: 'manual',
    effectiveDate: '2026-08-03',
    amount: 500,
    currency: 'TWD',
    accountId: 'bank-a',
    note: '雲端獨有事件',
    createdAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z'
  };
  const remote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'tx-a', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 900, currency: 'TWD', categoryId: 'income-dividend', description: '股利', merchant: '', note: '', occurredAt: '2026-08-02T00:00:00.000Z', excluded: false }],
    financialEventSchemaVersion: 1,
    financialEvents: [remoteOnlyEvent]
  }));

  const result = stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current);
  const ids = (result.state.financialEvents as Array<{ id: string }>).map(item => item.id).sort();
  assert.deepEqual(ids, ['event-dividend', 'event-remote-only']);
  assert.equal(result.droppedFinancialEventCount, 0);
});

test('Firebase download 合併時重複 id（雙邊皆有同一筆事件）不會重複計入', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = await stateWithLedger();
  const remote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'tx-a', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 900, currency: 'TWD', categoryId: 'income-dividend', description: '股利', merchant: '', note: '', occurredAt: '2026-08-02T00:00:00.000Z', excluded: false }],
    financialEventSchemaVersion: 1,
    financialEvents: [event] // exact same event as local
  }));

  const result = stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current);
  assert.equal(result.state.financialEvents.length, 1);
});

test('Firebase download 合併時任一邊 Ledger 為空，另一邊事件完整保留', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = await stateWithLedger(); // local: event-dividend, linked to tx-a
  // Remote must still carry tx-a (transactions is whole-overwrite, not merged) or the local event
  // would be orphaned by the download for an unrelated reason — see the dedicated orphan test below.
  const emptyRemote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'tx-a', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 900, currency: 'TWD', categoryId: 'income-dividend', description: '股利', merchant: '', note: '', occurredAt: '2026-08-02T00:00:00.000Z', excluded: false }],
    financialEventSchemaVersion: 1,
    financialEvents: []
  }));

  const result = stateFromFirebasePayload(emptyRemote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current);
  assert.deepEqual(result.state.financialEvents, [event]);
  assert.equal(result.droppedFinancialEventCount, 0);
});

// UR-TODO-046: this is the referential-integrity gap flagged during read-only triage and confirmed
// by the user's decision — detect and surface it rather than silently losing the event or blocking
// the whole sync. transactions are NOT merged (still whole-overwrite), so a remote-only linked event
// whose transactionId isn't in the post-download transactions gets dropped by normalizeState's
// existing validation, same as it always has for any invalid linked event — droppedFinancialEventCount
// must report that instead of it happening invisibly.
test('Firebase download 合併進來的 linked event 若指向本機交易清單中不存在的 transactionId，會被既有驗證捨棄，且 droppedFinancialEventCount 如實回報', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [], // local has no transactions at all
    financialEventSchemaVersion: 1,
    financialEvents: []
  });
  const remoteOrphanEvent = {
    id: 'event-orphan',
    type: 'dividend',
    status: 'posted',
    source: 'linked-transaction',
    effectiveDate: '2026-08-02',
    amount: 900,
    currency: 'TWD',
    accountId: 'bank-a',
    assetSymbol: '00865B',
    transactionId: 'tx-remote-only', // only exists in the remote payload's own (now-overwritten-away) transactions
    note: '現金股利',
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z'
  };
  const remote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'tx-remote-only', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 900, currency: 'TWD', categoryId: 'income-dividend', description: '股利', merchant: '', note: '', occurredAt: '2026-08-02T00:00:00.000Z', excluded: false }],
    financialEventSchemaVersion: 1,
    financialEvents: [remoteOrphanEvent]
  }));
  // Simulate the download replacing local transactions with a DIFFERENT set (remote's transactions
  // field itself is a separate whole-overwrite field, not under test here — build `remote` so its
  // top-level transactions differ from what actually lands after normalizeState, by re-wrapping):
  const remoteWithDivergedTransactions = { ...remote, transactions: [] };

  const result = stateFromFirebasePayload(remoteWithDivergedTransactions, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current);
  assert.deepEqual(result.state.financialEvents, []);
  assert.equal(result.droppedFinancialEventCount, 1);
});

test('Firebase download 在任一邊 Ledger schema 版本不受支援時 fail-safe 拒絕（維持既有保守方向，不嘗試合併未經驗證的資料）', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = await stateWithLedger(); // local schemaVersion: 1 (supported)
  const remote = {
    ...canonicalSyncPayload(normalizeState({
      accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
      transactions: []
    })),
    financialEventSchemaVersion: 4, // opaque/unsupported future version
    financialEvents: [{ schema: 4, opaque: 'preserve' }]
  };

  assert.throws(
    () => stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current),
    /schema 版本不受支援/
  );
});

test('legacy Backup Full Restore 明確清空目前 Ledger', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadAppPersistence();
  const current = await stateWithLedger();
  const legacyBackup = backupPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '舊備份帳戶', type: 'bank', manualBalance: 0 })],
    transactions: []
  }), {}) as Record<string, unknown>;
  delete legacyBackup.financialEventSchemaVersion;
  delete legacyBackup.financialEvents;
  delete legacyBackup.financialEventAttributionStartDate;

  const restored = stateFromBackup(legacyBackup, current).state;

  assert.equal(restored.financialEventSchemaVersion, 3);
  assert.deepEqual(restored.financialEvents, []);
  assert.equal(restored.financialEventAttributionStartDate, undefined);
});

// UR-TODO-046-C3C-C: 'attribution-confirmation' 是加法式擴充，須通過與既有 source 相同的三路 persistence 驗證。
const confirmationEvent = {
  id: 'event-confirmation',
  type: 'external-income',
  status: 'posted',
  source: 'attribution-confirmation',
  effectiveDate: '2026-08-05',
  amount: 30_000,
  currency: 'TWD',
  accountId: 'bank-a',
  transactionId: 'tx-income',
  note: 'UR-TODO-046-C3C-C：使用者於「淨值成長來源歸因」卡片按下「確認並正式記帳」（2026-08-05T12:00:00.000Z）',
  createdAt: '2026-08-05T12:00:00.000Z',
  updatedAt: '2026-08-05T12:00:00.000Z'
};

async function stateWithConfirmationLedger() {
  const { normalizeState } = await loadAppPersistence();
  return normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'tx-income', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 30_000, currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '', occurredAt: '2026-08-05T00:00:00.000Z', excluded: false }],
    financialEventSchemaVersion: 1,
    financialEvents: [confirmationEvent]
  });
}

test('attribution-confirmation 事件在 localStorage 正規化與 JSON Backup round-trip 中逐位元保留，schemaVersion 仍為 1', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadAppPersistence();
  const localState = await stateWithConfirmationLedger();
  const backup = backupPayload(localState, {});
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;

  for (const state of [localState, restored]) {
    assert.equal(state.financialEventSchemaVersion, 1);
    assert.deepEqual(state.financialEvents, [confirmationEvent]);
  }
});

test('UR-TODO-046 起 attribution-confirmation 事件也進入 Firebase canonical payload（Ledger sync 已涵蓋所有 source 類型）', async () => {
  const localState = await stateWithConfirmationLedger();
  const firebasePayload = canonicalSyncPayload(localState);
  assert.equal('financialEvents' in firebasePayload, true);
  assert.deepEqual(firebasePayload.financialEvents, [confirmationEvent]);
});

test('本機已有 attribution-confirmation 事件時，Firebase download 會與雲端合併（不再整批擋下）', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = await stateWithConfirmationLedger();
  const remote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'tx-income', accountId: 'bank-a', type: 'income', status: 'posted', source: 'manual', amount: 30_000, currency: 'TWD', categoryId: 'income-salary', description: '', merchant: '', note: '', occurredAt: '2026-08-05T00:00:00.000Z', excluded: false }],
    financialEventSchemaVersion: 1,
    financialEvents: []
  }));

  const result = stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current);
  assert.deepEqual(result.state.financialEvents, [confirmationEvent]);
});

test('future Ledger 讀取、正規化與 Backup 輸出不會降級已知 Ledger payload', async () => {
  const { backupPayload, normalizeState } = await loadAppPersistence();
  const future = {
    financialEventSchemaVersion: 4,
    financialEventAttributionStartDate: { future: true },
    financialEvents: { eventSet: [{ schema: 4, opaque: 'preserve' }] }
  };
  const normalized = normalizeState(future);
  const reloaded = normalizeState(JSON.parse(JSON.stringify(normalized)));
  const backup = backupPayload(normalized, {}) as Record<string, unknown>;

  for (const value of [normalized, reloaded, backup]) {
    assert.equal(value.financialEventSchemaVersion, 4);
    assert.deepEqual(value.financialEvents, future.financialEvents);
    assert.deepEqual(value.financialEventAttributionStartDate, future.financialEventAttributionStartDate);
  }
});

test('本機本身持有 opaque future Ledger 時，Firebase download 對支援版本的雲端資料仍 fail-safe 拒絕', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    financialEventSchemaVersion: 4,
    financialEvents: [{ schema: 4, opaque: 'preserve' }]
  });
  const remote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [],
    financialEventSchemaVersion: 1,
    financialEvents: []
  }));

  assert.throws(
    () => stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current),
    /schema 版本不受支援/
  );
});
