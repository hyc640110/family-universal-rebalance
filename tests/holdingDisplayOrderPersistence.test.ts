import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

type Holding = { symbol: string; name?: string; shares: number; avgCost: number; targetWeight?: number; assetClass: 'growth' | 'defensive'; isArchived?: boolean };
type Persistence = {
  normalizeState(raw: unknown): Record<string, unknown> & { holdings: Holding[]; holdingDisplayOrder: string[] };
  backupPayload(state: unknown, quotes: Record<string, unknown>): Record<string, unknown> & { holdingDisplayOrder: string[] };
  stateFromBackup(raw: unknown, current: unknown): { state: Record<string, unknown> & { holdingDisplayOrder: string[] } };
};

async function loadPersistence(): Promise<Persistence> {
  const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
  try { return await server.ssrLoadModule('/src/App.tsx') as Persistence; } finally { await server.close(); }
}

const holding = (symbol: string): Holding => ({ symbol, name: symbol, shares: 0, avgCost: 0, targetWeight: 10, assetClass: 'growth' });

test('UR-TODO-070 holdingDisplayOrder round-trips through localStorage-shaped state', async () => {
  const { normalizeState } = await loadPersistence();
  const holdings = [holding('00662'), holding('00670L'), holding('00631L')];
  const state = normalizeState({ holdings, holdingDisplayOrder: ['00631L', '00662', '00670L'] });
  assert.deepEqual(state.holdingDisplayOrder, ['00631L', '00662', '00670L']);
  // isolation: normalizing never reorders AppState.holdings itself.
  assert.deepEqual(state.holdings.map(h => h.symbol), ['00662', '00670L', '00631L']);
});

test('UR-TODO-070 holdingDisplayOrder round-trips through JSON Backup export/import', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const holdings = [holding('00662'), holding('00670L'), holding('00631L')];
  const state = normalizeState({ holdings, holdingDisplayOrder: ['00631L', '00670L', '00662'] });
  const backup = backupPayload(state, {});
  assert.deepEqual(backup.holdingDisplayOrder, ['00631L', '00670L', '00662']);
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.deepEqual(restored.holdingDisplayOrder, ['00631L', '00670L', '00662']);
  assert.deepEqual(restored.holdings.map(h => h.symbol), ['00662', '00670L', '00631L']);
});

test('UR-TODO-070 舊 Backup 缺少 holdingDisplayOrder 時 fallback 為 imported holdings 原始順序，不沿用匯入前本機偏好', async () => {
  const { normalizeState, stateFromBackup } = await loadPersistence();
  // Local device has a custom preference before the import happens.
  const current = normalizeState({ holdings: [holding('00662'), holding('00670L')], holdingDisplayOrder: ['00670L', '00662'] });
  // Legacy backup (pre-070) has no holdingDisplayOrder field at all, and its own holdings order differs.
  const legacyBackup = { holdings: [holding('00631L'), holding('00865B')], cashAccounts: [], accounts: [], transactions: [], loans: [], creditCards: [] };
  const restored = stateFromBackup(legacyBackup, current).state;
  assert.deepEqual(restored.holdingDisplayOrder, ['00631L', '00865B']);
});

test('UR-TODO-070 normalizeState 的 holdingDisplayOrder 排除已封存持股並補上遺漏的現行持股', async () => {
  const { normalizeState } = await loadPersistence();
  const holdings = [holding('00662'), { ...holding('00670L'), isArchived: true }, holding('00631L'), holding('00865B')];
  const state = normalizeState({ holdings, holdingDisplayOrder: ['00670L', '00631L'] });
  assert.deepEqual(state.holdingDisplayOrder, ['00631L', '00662', '00865B']);
});
