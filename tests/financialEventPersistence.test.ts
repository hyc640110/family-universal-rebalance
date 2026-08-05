import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { createFinancialAccount } from '../src/lib/financialAccounts';
import { canonicalSyncPayload } from '../src/lib/syncState';

type AppPersistence = {
  normalizeState(raw: unknown): { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string; transactions: unknown[] };
  backupPayload(state: unknown, quotes: Record<string, unknown>): unknown;
  stateFromBackup(raw: unknown, current: unknown): { state: { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string; transactions: unknown[] } };
  stateFromFirebasePayload(raw: unknown, config: unknown, current: unknown): { state: { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string } };
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

test('localStorage 正規化與 JSON Backup 匯出匯入保留有效 Ledger，Firebase payload 不含它', async () => {
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
  assert.equal('financialEvents' in firebasePayload, false);
  assert.equal('financialEventSchemaVersion' in firebasePayload, false);
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
    assert.equal(state.financialEventSchemaVersion, 1);
    assert.deepEqual(state.financialEvents, []);
    assert.equal(state.financialEventAttributionStartDate, undefined);
    assert.equal(state.transactions.length, 1);
  }
});

test('Firebase download 在本機已有 Ledger 時 fail-safe 拒絕，避免替換 linked evidence', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = await stateWithLedger();
  const remote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '遠端銀行', type: 'bank', manualBalance: 0 })],
    transactions: []
  }));

  assert.throws(
    () => stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current),
    /Financial Event Ledger/
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

  assert.equal(restored.financialEventSchemaVersion, 1);
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

test('attribution-confirmation 事件仍不進入 Firebase canonical payload（延續 C1 決策：Ledger 尚未接 Firebase sync）', async () => {
  const localState = await stateWithConfirmationLedger();
  const firebasePayload = canonicalSyncPayload(localState);
  assert.equal('financialEvents' in firebasePayload, false);
  assert.equal('financialEventSchemaVersion' in firebasePayload, false);
});

test('本機已有 attribution-confirmation 事件時，Firebase download 仍 fail-safe 拒絕（沿用既有 hasLocalFinancialEventLedger 防護）', async () => {
  const { stateFromFirebasePayload, normalizeState } = await loadAppPersistence();
  const current = await stateWithConfirmationLedger();
  const remote = canonicalSyncPayload(normalizeState({
    accounts: [createFinancialAccount({ id: 'bank-a', name: '遠端銀行', type: 'bank', manualBalance: 0 })],
    transactions: []
  }));

  assert.throws(
    () => stateFromFirebasePayload(remote, { databaseURL: 'https://example.invalid', secretPath: 'root' }, current),
    /Financial Event Ledger/
  );
});

test('future Ledger 讀取、正規化與 Backup 輸出不會降級已知 Ledger payload', async () => {
  const { backupPayload, normalizeState } = await loadAppPersistence();
  const future = {
    financialEventSchemaVersion: 2,
    financialEventAttributionStartDate: { future: true },
    financialEvents: { eventSet: [{ schema: 2, opaque: 'preserve' }] }
  };
  const normalized = normalizeState(future);
  const reloaded = normalizeState(JSON.parse(JSON.stringify(normalized)));
  const backup = backupPayload(normalized, {}) as Record<string, unknown>;

  for (const value of [normalized, reloaded, backup]) {
    assert.equal(value.financialEventSchemaVersion, 2);
    assert.deepEqual(value.financialEvents, future.financialEvents);
    assert.deepEqual(value.financialEventAttributionStartDate, future.financialEventAttributionStartDate);
  }
});
