import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSyncFieldFingerprints, withoutRuntimeSyncStatus, withoutSyncBaseline } from '../src/lib/syncState';

test('legacy sync baseline fingerprints remain safely sanitized on read', () => {
  assert.deepEqual(sanitizeSyncFieldFingerprints({
    holdings: 'sync-field-v2-0123456789abcdef',
    remoteMeta: 'sync-field-v2-fedcba9876543210',
    invalid: 'not-a-fingerprint'
  }), { holdings: 'sync-field-v2-0123456789abcdef' });
  assert.equal(sanitizeSyncFieldFingerprints(undefined), undefined);
});

test('legacy sync metadata keeps compatibility while runtime status and cloud baselines stay out of portable output', () => {
  const legacy = {
    dirty: true,
    source: '本機資料' as const,
    status: '舊同步訊息',
    baselineFingerprint: 'sync-v2-0123456789abcdef',
    baselineFieldFingerprints: { holdings: 'sync-field-v2-0123456789abcdef' },
    baselineCanonicalSchema: 'sync-json-v2',
    lastUploadAt: '2026-07-14T12:00:00.000Z'
  };
  assert.deepEqual(withoutRuntimeSyncStatus(withoutSyncBaseline(legacy)), {
    dirty: true,
    source: '本機資料',
    lastUploadAt: '2026-07-14T12:00:00.000Z'
  });
});
