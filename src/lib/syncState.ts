export type SyncSource = '本機資料' | '已從雲端下載' | '已從備份匯入';

export const SYNCABLE_TOP_LEVEL_FIELDS = [
  'holdings',
  'cash',
  'accounts',
  'accountSchemaVersion',
  'cashAccountMigrationVersion',
  'transactions',
  'transactionSchemaVersion',
  'financialEventSchemaVersion',
  'financialEvents',
  'importSessions',
  'importPresets',
  'importSchemaVersion',
  'gmailOAuth',
  'loans',
  'refreshSec',
  'autoSync',
  'autoSyncSec',
  'allocationPreset',
  'rebalanceMode',
  'rebalanceThreshold',
  'buyOnlyBudget',
  'dipAlerts',
  'wealthGoal',
  'cashFlowProfile',
  'netWorthHistory'
] as const;

export type SyncFieldFingerprints = Record<string, string>;

export function sanitizeSyncFieldFingerprints(raw: unknown): SyncFieldFingerprints | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const source = raw as Record<string, unknown>;
  const allowed = new Set<string>(SYNCABLE_TOP_LEVEL_FIELDS);
  const entries = Object.keys(source)
    .filter(key => allowed.has(key) && typeof source[key] === 'string' && /^sync-field-v\d+-[0-9a-f]{16}$/.test(source[key] as string))
    .sort()
    .map(key => [key, source[key] as string]);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export type SyncMeta = {
  dirty: boolean;
  source: SyncSource;
  baselineFingerprint?: string;
  baselineFieldFingerprints?: SyncFieldFingerprints;
  baselineCanonicalSchema?: string;
  lastLocalSaveAt?: string;
  lastUploadAt?: string;
  lastDownloadAt?: string;
  lastBackupExportAt?: string;
  lastBackupImportAt?: string;
  /** Runtime-only UI status. It must not be serialized into localStorage, Backup, or Firebase. */
  status?: string;
};

export function withoutSyncBaseline(meta: SyncMeta): SyncMeta {
  const {
    baselineFingerprint: _baselineFingerprint,
    baselineFieldFingerprints: _baselineFieldFingerprints,
    baselineCanonicalSchema: _baselineCanonicalSchema,
    ...portableMeta
  } = meta;
  return portableMeta;
}

/** Removes deprecated runtime-only status text from portable state. */
export function withoutRuntimeSyncStatus(meta: SyncMeta): SyncMeta {
  const { status: _status, ...portableMeta } = meta;
  return portableMeta;
}
