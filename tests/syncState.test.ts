import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSyncFieldFingerprints, withoutRetiredCloudSyncMetadata, withoutRuntimeSyncStatus, withoutSyncBaseline } from '../src/lib/syncState';

test('legacy sync baseline fingerprints remain safely sanitized on read', () => {
  assert.deepEqual(sanitizeSyncFieldFingerprints({
    holdings: 'sync-field-v2-0123456789abcdef',
    remoteMeta: 'sync-field-v2-fedcba9876543210',
    invalid: 'not-a-fingerprint'
  }), { holdings: 'sync-field-v2-0123456789abcdef' });
  assert.equal(sanitizeSyncFieldFingerprints(undefined), undefined);
});

test('legacy sync metadata keeps only approved local metadata in canonical output', () => {
  const legacy = {
    dirty: true,
    source: '本機資料' as const,
    status: '舊同步訊息',
    baselineFingerprint: 'sync-v2-0123456789abcdef',
    baselineFieldFingerprints: { holdings: 'sync-field-v2-0123456789abcdef' },
    baselineCanonicalSchema: 'sync-json-v2',
    lastUploadAt: '2026-07-14T12:00:00.000Z',
    lastDownloadAt: '2026-07-14T13:00:00.000Z',
    lastLocalSaveAt: '2026-07-14T14:00:00.000Z',
    lastBackupExportAt: '2026-07-14T15:00:00.000Z',
    lastBackupImportAt: '2026-07-14T16:00:00.000Z'
  };
  assert.deepEqual(withoutRetiredCloudSyncMetadata(withoutRuntimeSyncStatus(withoutSyncBaseline(legacy))), {
    dirty: true,
    source: '本機資料',
    lastLocalSaveAt: '2026-07-14T14:00:00.000Z',
    lastBackupExportAt: '2026-07-14T15:00:00.000Z',
    lastBackupImportAt: '2026-07-14T16:00:00.000Z'
  });
});
