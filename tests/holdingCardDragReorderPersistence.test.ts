import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';
import { moveHoldingDisplayOrderToIndex } from '../src/lib/holdingDisplayOrder';

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

const holding = (symbol: string): Holding => ({ symbol, name: symbol, shares: 100, avgCost: 20, targetWeight: 25, assetClass: 'growth' });

test('UR-TODO-071 drag-produced index-to-index order round-trips through normalizeState without touching AppState.holdings', async () => {
  const { normalizeState } = await loadPersistence();
  const holdings = [holding('00662'), holding('00670L'), holding('00631L'), holding('00865B')];
  const frozenHoldings = JSON.parse(JSON.stringify(holdings));
  const baseline = normalizeState({ holdings, holdingDisplayOrder: ['00662', '00670L', '00631L', '00865B'] });

  // Simulate what a drag drop produces: an arbitrary index-to-index move (not just adjacent swap).
  const dragOrder = moveHoldingDisplayOrderToIndex(baseline.holdingDisplayOrder, '00662', 3);
  assert.deepEqual(dragOrder, ['00670L', '00631L', '00865B', '00662']);

  const afterDrag = normalizeState({ holdings, holdingDisplayOrder: dragOrder });
  assert.deepEqual(afterDrag.holdingDisplayOrder, dragOrder);
  // Isolation: holdings array itself — symbol/shares/avgCost/targetWeight/assetClass order and
  // values — is completely untouched by the drag-produced order, exactly as the input holdings.
  assert.deepEqual(afterDrag.holdings.map(h => h.symbol), ['00662', '00670L', '00631L', '00865B']);
  assert.deepEqual(holdings, frozenHoldings);
});

test('UR-TODO-071 drag-produced order survives JSON Backup export/import round-trip', async () => {
  const { normalizeState, backupPayload, stateFromBackup } = await loadPersistence();
  const holdings = [holding('00662'), holding('00670L'), holding('00631L')];
  const state = normalizeState({ holdings, holdingDisplayOrder: ['00631L', '00662', '00670L'] });
  const backup = backupPayload(state, {});
  assert.deepEqual(backup.holdingDisplayOrder, ['00631L', '00662', '00670L']);
  const restored = stateFromBackup(JSON.parse(JSON.stringify(backup)), normalizeState({})).state;
  assert.deepEqual(restored.holdingDisplayOrder, ['00631L', '00662', '00670L']);
  assert.deepEqual(restored.holdings.map(h => h.symbol), ['00662', '00670L', '00631L']);
});

test('UR-TODO-071 archived holdings stay excluded from a drag-produced order after normalization', async () => {
  const { normalizeState } = await loadPersistence();
  const holdings = [holding('00662'), { ...holding('00670L'), isArchived: true }, holding('00631L')];
  const dragOrder = moveHoldingDisplayOrderToIndex(['00662', '00631L'], '00631L', 0);
  const state = normalizeState({ holdings, holdingDisplayOrder: [...dragOrder, '00670L'] });
  assert.deepEqual(state.holdingDisplayOrder, ['00631L', '00662']);
});
