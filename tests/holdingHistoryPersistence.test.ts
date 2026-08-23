import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

type HoldingHistoryEntry = { symbol: string; shares: number; price: number; marketValue: number; assetClass: 'growth' | 'defensive'; quoteAvailable: boolean };
type HoldingHistorySnapshot = { date: string; holdings: HoldingHistoryEntry[] };
type Persistence = {
  normalizeState(raw: unknown): Record<string, unknown> & { holdingHistory?: HoldingHistorySnapshot[] };
  backupPayload(state: unknown, quotes: Record<string, unknown>): Record<string, unknown> & { holdingHistory?: HoldingHistorySnapshot[] };
  stateFromBackup(raw: unknown, current: unknown): { state: Record<string, unknown> & { holdingHistory?: HoldingHistorySnapshot[] } };
};

async function loadPersistence(): Promise<Persistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try { return await server.ssrLoadModule('/src/App.tsx') as Persistence; } finally { await server.close(); }
}

const snapshot = (date: string): HoldingHistorySnapshot => ({
  date,
  holdings: [{ symbol: '00662', shares: 1000, price: 30, marketValue: 30000, assetClass: 'growth', quoteAvailable: true }]
});

test('UR-TODO-078 holdingHistory round-trips through localStorage-shaped state via normalizeState()', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({ holdingHistory: [snapshot('2026-08-23')] });
  assert.deepEqual(state.holdingHistory, [snapshot('2026-08-23')]);
});

test('UR-TODO-078 legacy state missing holdingHistory normalizes to undefined, not an error, not fake data', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({});
  assert.equal(state.holdingHistory, undefined);
});

test('UR-TODO-078 malformed holdingHistory in raw state fails closed per entry, not by throwing', async () => {
  const { normalizeState } = await loadPersistence();
  const state = normalizeState({ holdingHistory: [{ date: '2026-08-23', holdings: [{ symbol: '00662', shares: 'bad', price: 30, marketValue: 30000, assetClass: 'growth', quoteAvailable: true }] }] });
  assert.deepEqual(state.holdingHistory, [{ date: '2026-08-23', holdings: [] }]);
});

test('UR-TODO-078 holdingHistory round-trips through JSON Backup export/import', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const state = normalizeState({ holdingHistory: [snapshot('2026-08-22'), snapshot('2026-08-23')] });
  const backup = backupPayload(state, {});
  assert.deepEqual(backup.holdingHistory, [snapshot('2026-08-22'), snapshot('2026-08-23')]);
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.deepEqual(restored.holdingHistory, [snapshot('2026-08-22'), snapshot('2026-08-23')]);
});

test('UR-TODO-078 舊 JSON Backup 缺少 holdingHistory 時沿用匯入前本機既有值（比照 netWorthHistory 既有慣例，不因匯入舊格式而清空本機已累積歷史）', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const current = normalizeState({ holdingHistory: [snapshot('2026-08-20')] });
  const legacyBackup = { holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], creditCards: [] };
  const restored = stateFromBackup(legacyBackup, current).state;
  assert.deepEqual(restored.holdingHistory, [snapshot('2026-08-20')]);
});

test('UR-TODO-078 舊 JSON Backup 缺少 holdingHistory 且本機也無既有值時，維持 undefined（正規化後等同 []），不產生 migration fake data', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  const current = normalizeState({});
  const legacyBackup = { holdings: [], cashAccounts: [], accounts: [], transactions: [], loans: [], creditCards: [] };
  const restored = stateFromBackup(legacyBackup, current).state;
  assert.equal(restored.holdingHistory, undefined);
});

test('UR-TODO-078 Export → Import → Re-export round-trip is stable', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const state = normalizeState({ holdingHistory: [snapshot('2026-08-23')] });
  const firstExport = backupPayload(state, {});
  const imported = stateFromBackup(JSON.parse(JSON.stringify(firstExport)), normalizeState({})).state;
  const secondExport = backupPayload(imported, {});
  assert.deepEqual(secondExport.holdingHistory, firstExport.holdingHistory);
});

test('UR-TODO-078 backupPayload omits holdingHistory entirely when the state has none (matches netWorthHistory convention)', async () => {
  const { normalizeState, backupPayload } = await loadPersistence();
  const state = normalizeState({});
  const backup = backupPayload(state, {});
  assert.equal('holdingHistory' in backup, false);
});
