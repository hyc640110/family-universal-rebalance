import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createServer } from 'vite';
import { createFinancialAccount } from '../src/lib/financialAccounts';
import { isLegacyOnlyPersistenceDelta, shouldWriteInitialHydration } from '../src/lib/legacyFirebasePersistence';

type Persistence = {
  normalizeState(raw: unknown): Record<string, unknown>;
  stateFromBackup(raw: unknown, current: unknown): { state: Record<string, unknown> };
  backupPayload(state: unknown, quotes: Record<string, unknown>): unknown;
  stateWithPersistedFinancialEventLedger(state: unknown): Record<string, unknown>;
};

async function loadPersistence(): Promise<Persistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try {
    return await server.ssrLoadModule('/src/App.tsx') as Persistence;
  } finally {
    await server.close();
  }
}

test('P3-B1: legacy-only Firebase localStorage delta 不得取得 initial hydration write 資格', () => {
  const raw = JSON.stringify({ holdings: [], firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' } });
  const clean = JSON.stringify({ holdings: [] });
  assert.equal(isLegacyOnlyPersistenceDelta(raw, clean), true);
});

test('P3-B1: 真實持久化 mutation 不得被 legacy write gate 阻擋', () => {
  const raw = JSON.stringify({ holdings: [], firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' } });
  const changed = JSON.stringify({ holdings: [{ symbol: '00662' }] });
  assert.equal(isLegacyOnlyPersistenceDelta(raw, changed), false);
});

test('P3-B3-A: 僅含已退休 cloud-sync metadata 的 legacy localStorage delta 不得在 hydration 寫回', () => {
  const raw = JSON.stringify({
    holdings: [],
    firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' },
    autoSync: true,
    autoSyncSec: 30,
    workerUrl: 'https://legacy-worker.example.invalid',
    syncMeta: {
      dirty: true,
      source: '本機資料',
      lastLocalSaveAt: '2026-08-12T00:00:00.000Z',
      lastBackupExportAt: '2026-08-12T00:00:00.000Z',
      lastBackupImportAt: '2026-08-12T00:00:00.000Z',
      baselineFingerprint: 'sync-v2-0123456789abcdef',
      baselineFieldFingerprints: { holdings: 'sync-field-v2-0123456789abcdef' },
      baselineCanonicalSchema: 'sync-json-v2',
      lastUploadAt: '2026-08-12T00:00:00.000Z',
      lastDownloadAt: '2026-08-12T00:00:00.000Z'
    }
  });
  const canonical = JSON.stringify({
    holdings: [],
    syncMeta: {
      dirty: true,
      source: '本機資料',
      lastLocalSaveAt: '2026-08-12T00:00:00.000Z',
      lastBackupExportAt: '2026-08-12T00:00:00.000Z',
      lastBackupImportAt: '2026-08-12T00:00:00.000Z'
    }
  });
  assert.equal(isLegacyOnlyPersistenceDelta(raw, canonical), true);
  assert.equal(shouldWriteInitialHydration(raw, canonical), false);
});

test('P3-B3-A: legacy-only fixture 在 genuine mutation 後必須取得 clean canonical write 資格', () => {
  const raw = JSON.stringify({ holdings: [], autoSync: true, autoSyncSec: 30, workerUrl: 'https://legacy-worker.example.invalid' });
  const changed = JSON.stringify({ holdings: [{ symbol: '00662' }] });
  assert.equal(isLegacyOnlyPersistenceDelta(raw, changed), false);
});

test('P3-B1: canonical localStorage writer 在 genuine mutation 時不再輸出 Firebase legacy config', async () => {
  const { normalizeState, stateWithPersistedFinancialEventLedger } = await loadPersistence();
  const legacy = normalizeState({ firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' }, holdings: [] });
  const changed = normalizeState({ ...legacy, holdings: [{ symbol: '00662', shares: 1, avgCost: 1, assetClass: 'growth' }] });
  assert.equal('firebase' in stateWithPersistedFinancialEventLedger(changed), false);
});

test('P3-B3-B: canonical AppState 接受後丟棄 legacy Firebase config', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({
    firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' },
    holdings: [{ symbol: '00662', shares: 2, avgCost: 10, assetClass: 'growth' }]
  });
  assert.equal('firebase' in state, false);
  assert.deepEqual((state.holdings as Array<{ symbol: string }>).map(({ symbol }) => symbol), ['00662']);
});

test('P3-B1: 實際 App hydration 與 mount persistence 均使用明確 legacy write gate', () => {
  const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(source, /const initialPersistenceWriteAllowed = shouldWriteInitialHydration\(raw, json\)/);
  assert.match(source, /!didMount\.current && !initialPersistenceWriteAllowedRef\.current/);
});

test('P3-B1: clean Backup 不得 fallback 到 current Firebase config', async () => {
  const { normalizeState, stateFromBackup, stateWithPersistedFinancialEventLedger } = await loadPersistence();
  const current = normalizeState({ firebase: { databaseURL: 'https://current.example.invalid', secretPath: 'current' } });
  const restored = stateFromBackup({ holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], financialEventSchemaVersion: 3, financialEvents: [] }, current).state;
  assert.equal('firebase' in restored, false);
  assert.equal('firebase' in stateWithPersistedFinancialEventLedger(restored), false, 'Full Restore 的後續 canonical localStorage 輸出不得重建 legacy config');
});

test('P3-B3-B: old top-level Firebase Backup 可讀取但會在 canonical state discard', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const current = normalizeState({});
  const restored = stateFromBackup({ holdings: [{ symbol: '00662', shares: 2, avgCost: 10, assetClass: 'growth' }], cashAccounts: [], accounts: [], transactions: [], loans: [], financialEventSchemaVersion: 3, financialEvents: [], firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' } }, current).state;
  assert.equal('firebase' in restored, false);
  assert.deepEqual((restored.holdings as Array<{ symbol: string }>).map(({ symbol }) => symbol), ['00662']);
});

test('P3-B3-B: old nested syncSettings.firebase Backup 可讀取但會在 canonical state discard', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const firebase = { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' };
  const restored = stateFromBackup({
    holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], financialEventSchemaVersion: 3, financialEvents: [],
    syncSettings: { refreshSec: 60, autoSync: false, autoSyncSec: 60, firebase, firebaseConfigured: true }
  }, normalizeState({})).state;
  assert.equal('firebase' in restored, false);
});

test('P3-B3-B: nested 與 top-level legacy Firebase Backup 同時存在時可安全 import 並 discard', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const restored = stateFromBackup({
    holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], financialEventSchemaVersion: 3, financialEvents: [],
    firebase: { databaseURL: 'https://top-level.example.invalid', secretPath: 'top-level' },
    syncSettings: { refreshSec: 60, autoSync: false, autoSyncSec: 60, firebase: { databaseURL: 'https://nested.example.invalid', secretPath: 'nested' }, firebaseConfigured: true }
  }, normalizeState({})).state;
  assert.equal('firebase' in restored, false);
});

test('P3-B2-B: new Backup 不得輸出 retired Firebase config metadata', async () => {
  const { backupPayload, normalizeState } = await loadPersistence();
  const backup = backupPayload(normalizeState({ firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' } }), {}) as { syncSettings: Record<string, unknown> };
  assert.equal('firebase' in backup.syncSettings, false);
  assert.equal('firebaseConfigured' in backup.syncSettings, false);
  assert.deepEqual(Object.keys(backup.syncSettings).sort(), ['refreshSec']);
  assert.equal(backup.syncSettings.refreshSec, 60);
  assert.equal('autoSync' in backup.syncSettings, false);
  assert.equal('autoSyncSec' in backup.syncSettings, false);
  assert.equal('workerUrl' in backup.syncSettings, false);
});

test('P3-B2-B: legacy Backup import 後的新 export 保留 semantic，但不重建 retired Firebase metadata', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadPersistence();
  const timestamp = '2026-08-12T00:00:00.000Z';
  const legacy = {
    holdings: [{ symbol: '00662', name: 'Legacy ETF', shares: 2, avgCost: 10, assetClass: 'growth' }],
    cashAccounts: [{ id: 'cash-1', name: '現金', amount: 100, note: '' }],
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 100 })],
    transactions: [{ id: 'tx-1', accountId: 'bank-a', type: 'expense', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'expense-food', description: '', merchant: '', note: '', occurredAt: timestamp, excluded: false }],
    loans: [{ id: 'loan-1', name: '貸款', principal: 1000, annualRate: 1, monthlyPayment: 100, startDate: '2026-01-01' }],
    financialEventSchemaVersion: 3,
    financialEvents: [{ id: 'event-1', type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-12', amount: 100, currency: 'TWD', accountId: 'bank-a', transactionId: 'tx-1', note: '', createdAt: timestamp, updatedAt: timestamp }],
    cashFlowProfile: { schemaVersion: 3, monthlyIncome: 1000, fixedExpenses: [], variableExpenseBudget: null, monthlyInvestmentBudget: null, emergencyFundTargetMonths: 6, notes: '' },
    syncSettings: { refreshSec: 75, autoSync: true, autoSyncSec: 30, workerUrl: 'https://legacy-worker.example.invalid', firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' }, firebaseConfigured: true }
  };
  const restored = stateFromBackup(legacy, normalizeState({})).state;
  const backup = backupPayload(restored, {}) as { holdings: Array<{ symbol: string }>; transactions: Array<{ id: string }>; loans: Array<{ id: string }>; financialEventSchemaVersion: number; cashFlowProfile?: unknown; syncSettings: Record<string, unknown> };
  const reimported = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.equal('firebase' in restored, false);
  assert.deepEqual(backup.holdings.map(({ symbol }) => symbol), ['00662']);
  assert.deepEqual(backup.transactions.map(({ id }) => id), ['tx-1']);
  assert.deepEqual(backup.loans.map(({ id }) => id), ['loan-1']);
  assert.equal(reimported.financialEventSchemaVersion, 3);
  assert.deepEqual((reimported.financialEvents as Array<{ id: string }>).map(({ id }) => id), ['event-1']);
  assert.deepEqual(backup.cashFlowProfile, { schemaVersion: 3, monthlyIncome: 1000, fixedExpenses: [], variableExpenseBudget: null, monthlyInvestmentBudget: null, emergencyFundTargetMonths: 6, notes: '' });
  assert.deepEqual(Object.keys(backup.syncSettings).sort(), ['refreshSec']);
  assert.equal(backup.syncSettings.refreshSec, 75);
  assert.equal('autoSync' in backup.syncSettings, false);
  assert.equal('autoSyncSec' in backup.syncSettings, false);
  assert.equal('workerUrl' in backup.syncSettings, false);
});

test('P3-B3-A: canonical localStorage 與 Backup 僅退休指定 cloud-sync output，保留 syncMeta KEEP 欄位', async () => {
  const { backupPayload, normalizeState, stateWithPersistedFinancialEventLedger } = await loadPersistence();
  const legacy = normalizeState({
    autoSync: true,
    autoSyncSec: 30,
    workerUrl: 'https://legacy-worker.example.invalid',
    syncMeta: {
      dirty: true,
      source: '本機資料',
      lastLocalSaveAt: '2026-08-12T00:00:00.000Z',
      lastBackupExportAt: '2026-08-12T00:00:00.000Z',
      lastBackupImportAt: '2026-08-12T00:00:00.000Z',
      baselineFingerprint: 'sync-v2-0123456789abcdef',
      baselineFieldFingerprints: { holdings: 'sync-field-v2-0123456789abcdef' },
      baselineCanonicalSchema: 'sync-json-v2',
      lastUploadAt: '2026-08-12T00:00:00.000Z',
      lastDownloadAt: '2026-08-12T00:00:00.000Z'
    }
  });
  const persisted = stateWithPersistedFinancialEventLedger(legacy);
  const backup = backupPayload(legacy, {}) as { syncMeta: Record<string, unknown>; syncSettings: Record<string, unknown> };

  for (const output of [persisted, backup.syncSettings]) {
    assert.equal('autoSync' in output, false);
    assert.equal('autoSyncSec' in output, false);
    assert.equal('workerUrl' in output, false);
  }
  for (const output of [persisted.syncMeta as Record<string, unknown>, backup.syncMeta]) {
    for (const field of ['baselineFingerprint', 'baselineFieldFingerprints', 'baselineCanonicalSchema', 'lastUploadAt', 'lastDownloadAt']) {
      assert.equal(field in output, false, field);
    }
    assert.equal(output.dirty, true);
    assert.equal(output.source, '本機資料');
    assert.equal(output.lastLocalSaveAt, '2026-08-12T00:00:00.000Z');
    assert.equal(output.lastBackupExportAt, '2026-08-12T00:00:00.000Z');
    assert.equal(output.lastBackupImportAt, '2026-08-12T00:00:00.000Z');
  }
});

test('P3-B1: v3 split atomic group 與 void marker 在 legacy Firebase 輸入下仍完整 round-trip', async () => {
  const { backupPayload, normalizeState, stateFromBackup } = await loadPersistence();
  const timestamp = '2026-08-11T00:00:00.000Z';
  const state = normalizeState({
    firebase: { databaseURL: 'https://legacy.example.invalid', secretPath: 'legacy' },
    accounts: [createFinancialAccount({ id: 'bank-a', name: '銀行', type: 'bank', manualBalance: 0 })],
    transactions: [{ id: 'split-expense', accountId: 'bank-a', type: 'expense', status: 'posted', source: 'manual', amount: 100, currency: 'TWD', categoryId: 'expense-food', description: '', merchant: '', note: '', occurredAt: timestamp, excluded: false }],
    financialEventSchemaVersion: 3,
    financialEvents: [
      { id: 'split-a', type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-11', amount: 70, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', splitAllocationLink: { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'a' }, note: '', createdAt: timestamp, updatedAt: timestamp },
      { id: 'split-b', type: 'external-expense', status: 'posted', source: 'attribution-confirmation', effectiveDate: '2026-08-11', amount: 30, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', splitAllocationLink: { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'b' }, note: '', createdAt: timestamp, updatedAt: timestamp },
      { id: 'void-a', type: 'adjustment', status: 'posted', source: 'void', effectiveDate: '2026-08-11', amount: 70, currency: 'TWD', accountId: 'bank-a', transactionId: 'split-expense', voidedEventId: 'split-a', note: '', createdAt: timestamp, updatedAt: timestamp }
    ]
  });
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backupPayload(state, {}))), normalizeState({})).state;
  assert.equal('firebase' in state, false);
  assert.equal(restored.financialEventSchemaVersion, 3);
  assert.deepEqual((restored.financialEvents as Array<{ id: string }>).map(({ id }) => id), ['split-a', 'split-b', 'void-a']);
  assert.equal((restored.financialEvents as Array<{ voidedEventId?: string }>)[2]?.voidedEventId, 'split-a');
  assert.deepEqual((restored.financialEvents as Array<{ splitAllocationLink?: unknown }>)[0]?.splitAllocationLink, { domain: 'test-only', allocationGroupId: 'split-group', componentId: 'a' });
});
