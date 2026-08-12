type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : undefined;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = asRecord(value);
  if (!record) return JSON.stringify(null);
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

/**
 * Identifies an otherwise-identical persisted document that only still carries
 * retired cloud-sync compatibility fields. This is intentionally structural,
 * not tied to React render timing.
 */
export function isLegacyFirebaseOnlyPersistenceDelta(rawJson: string, nextJson: string): boolean {
  try {
    const raw = asRecord(JSON.parse(rawJson));
    const next = asRecord(JSON.parse(nextJson));
    if (!raw || !next) return false;
    const { firebase: _legacyFirebase, autoSync: _autoSync, autoSyncSec: _autoSyncSec, workerUrl: _workerUrl, ...withoutLegacyCloudSync } = raw;
    const legacySyncMeta = asRecord(withoutLegacyCloudSync.syncMeta);
    if (legacySyncMeta) {
      const {
        baselineFingerprint: _baselineFingerprint,
        baselineFieldFingerprints: _baselineFieldFingerprints,
        baselineCanonicalSchema: _baselineCanonicalSchema,
        lastUploadAt: _lastUploadAt,
        lastDownloadAt: _lastDownloadAt,
        ...withoutLegacySyncMeta
      } = legacySyncMeta;
      withoutLegacyCloudSync.syncMeta = withoutLegacySyncMeta;
    }
    return canonicalJson(withoutLegacyCloudSync) === canonicalJson(next);
  } catch {
    return false;
  }
}

export function shouldWriteInitialHydration(rawJson: string, nextJson: string): boolean {
  return rawJson === nextJson || !isLegacyFirebaseOnlyPersistenceDelta(rawJson, nextJson);
}
