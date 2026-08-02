import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { createFinancialAccount } from '../src/lib/financialAccounts';
import { canonicalSyncPayload } from '../src/lib/syncState';

type AppPersistence = {
  normalizeState(raw: unknown): { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string; transactions: unknown[] };
  backupPayload(state: unknown, quotes: Record<string, unknown>): unknown;
  stateFromBackup(raw: unknown, current: unknown): { state: { [key: string]: unknown; financialEventSchemaVersion: number; financialEvents: unknown[]; financialEventAttributionStartDate?: string; transactions: unknown[] } };
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

test('localStorage 正規化、Firebase canonical payload、JSON Backup 匯出匯入均保留有效 Ledger', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadAppPersistence();
  const localState = await stateWithLedger();
  const firebaseState = normalizeState(canonicalSyncPayload(localState));
  const backup = backupPayload(localState, {});
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;

  for (const state of [localState, firebaseState, restored]) {
    assert.equal(state.financialEventSchemaVersion, 1);
    assert.equal(state.financialEventAttributionStartDate, '2026-08-02');
    assert.deepEqual(state.financialEvents, [event]);
  }
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
