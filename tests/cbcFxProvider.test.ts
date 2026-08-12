import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendCbcUsdTwdFxRate,
  fetchCbcUsdTwdFxRateHistory,
  parseCbcUsdTwdWorkerResponse,
  toCbcUsdTwdFxRateRecord,
  type CbcUsdTwdAvailableResponse
} from '../src/lib/cbcFxProvider';
import type { FxRateRecord } from '../src/lib/fxValuation';

const available: CbcUsdTwdAvailableResponse = {
  status: 'available', baseCurrency: 'USD', quoteCurrency: 'TWD', rateType: 'reference-close',
  rateDate: '2026-08-12', quotePerBase: 32.246,
  provider: 'Central Bank of the Republic of China (Taiwan) — Interbank Closing Rate',
  capturedAt: '2026-08-12T09:00:00.000Z'
};

const record = (patch: Partial<FxRateRecord> = {}): FxRateRecord => ({
  id: 'cbc-ftd-usd-twd-reference-close-2026-08-12', baseCurrency: 'USD', quoteCurrency: 'TWD', quotePerBase: 32.246,
  rateType: 'reference-close', provider: available.provider, rateDate: '2026-08-12', capturedAt: available.capturedAt, policyVersion: 'fx-a1-v1', ...patch
});

test('CBC Worker available response maps deterministically to the FX-A1 USD/TWD rate contract', () => {
  assert.deepEqual(toCbcUsdTwdFxRateRecord(available), record());
});

test('frontend rejects malformed Worker data without manufacturing a FxRateRecord', () => {
  for (const raw of [null, {}, { ...available, quotePerBase: 0 }, { ...available, rateDate: '2026/08/12' }, { ...available, capturedAt: 'not-a-time' }]) {
    assert.equal(parseCbcUsdTwdWorkerResponse(raw).status, 'unavailable');
  }
});

test('CBC append is idempotent for the same rate but preserves history on a same-day conflict', () => {
  assert.deepEqual(appendCbcUsdTwdFxRate([record()], record()), { status: 'unchanged', history: [record()] });
  assert.deepEqual(appendCbcUsdTwdFxRate([record()], record({ quotePerBase: 32.5 })), { status: 'provider-conflict', history: [record()] });
});

test('explicit refresh applies FX-A1 stale policy and leaves persisted history intact on failure', async () => {
  const stale = await fetchCbcUsdTwdFxRateHistory({
    endpoint: 'https://worker.example', history: [record({ rateDate: '2026-08-01', id: 'cbc-ftd-usd-twd-reference-close-2026-08-01' })], today: '2026-08-12',
    fetchFn: async () => new Response(JSON.stringify({ ...available, rateDate: '2026-08-01' }), { headers: { 'content-type': 'application/json' } })
  });
  assert.deepEqual(stale, { status: 'stale-latest', history: [record({ rateDate: '2026-08-01', id: 'cbc-ftd-usd-twd-reference-close-2026-08-01' })] });

  const failed = await fetchCbcUsdTwdFxRateHistory({
    endpoint: 'https://worker.example', history: [record()], today: '2026-08-12',
    fetchFn: async () => new Response('', { status: 502 })
  });
  assert.deepEqual(failed, { status: 'provider-http', history: [record()] });
});

test('explicit refresh rejects a future provider date and maps an aborted Worker request to timeout without changing history', async () => {
  const future = await fetchCbcUsdTwdFxRateHistory({
    endpoint: 'https://worker.example', history: [record()], today: '2026-08-12',
    fetchFn: async () => new Response(JSON.stringify({ ...available, rateDate: '2026-08-13' }), { headers: { 'content-type': 'application/json' } })
  });
  assert.deepEqual(future, { status: 'invalid-latest', history: [record()] });
});
