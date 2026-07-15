import assert from 'node:assert/strict';
import test from 'node:test';
import { describeMarketRuntime, quoteProvenanceText } from '../src/lib/runtimeProvenance';

test('runtime diagnostics marks a missing Market Worker as unconfigured without inventing a cache state', () => {
  const result = describeMarketRuntime('');
  assert.match(result.endpoint, /未設定/);
  assert.match(result.cache, /未發出請求/);
});

test('runtime diagnostics retains the response cache policy and per-symbol quote provenance', () => {
  assert.deepEqual(describeMarketRuntime('https://market.example', 'public, max-age=300'), { endpoint: 'https://market.example', cache: 'public, max-age=300' });
  assert.deepEqual(quoteProvenanceText([{ symbol: '00631L', source: '報價 Worker', quoteDate: '2026-07-15', quoteTime: '13:30:00', updatedAt: '2026-07-15T05:30:00.000Z' }]), ['00631L｜來源：報價 Worker｜報價日：2026-07-15｜報價時：13:30:00｜本機更新：2026-07-15T05:30:00.000Z']);
});
