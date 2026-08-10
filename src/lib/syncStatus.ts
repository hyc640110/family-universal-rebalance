import type { LedgerMergeRejectReason } from './financialEvents';

export type RuntimeSyncStatus =
  | { kind: 'idle' }
  | { kind: 'progress'; operation: 'upload' | 'download' }
  | { kind: 'success'; message: string }
  | { kind: 'schema-version-mismatch'; observedLocalSchema: number; observedRemoteSchema: number }
  | { kind: 'unsupported-future-schema'; observedLocalSchema: number; observedRemoteSchema: number }
  | { kind: 'event-id-collision' }
  /** Remote Firebase state predates the Financial Event Ledger contract. Runtime-only fail-safe. */
  | { kind: 'missing-ledger'; operation: 'upload' | 'download' }
  | { kind: 'firebase-transport-error'; operation: 'upload' | 'download'; message: string }
  | { kind: 'stale-persisted-failure' };

export type SyncRuntimeFacts = {
  writerSchemaVersion: number;
  supportedSchemaVersions: readonly number[];
};

export function runtimeStatusForLedgerMergeRejection(reasonCode: LedgerMergeRejectReason, observedLocalSchema: number, observedRemoteSchema: number): Extract<RuntimeSyncStatus, { kind: 'schema-version-mismatch' | 'unsupported-future-schema' | 'event-id-collision' }> {
  if (reasonCode === 'event-id-collision') return { kind: 'event-id-collision' };
  return { kind: reasonCode, observedLocalSchema, observedRemoteSchema };
}

export function describeRuntimeSyncStatus(status: RuntimeSyncStatus, facts: SyncRuntimeFacts): string {
  if (status.kind === 'idle') return '';
  if (status.kind === 'progress') return status.operation === 'upload' ? '⏳ 雲端上傳中，正在寫入 Firebase...' : '⏳ 雲端下載中，正在讀取 Firebase...';
  if (status.kind === 'success') return `🎉 ${status.message}`;
  if (status.kind === 'firebase-transport-error') return `❌ ${status.operation === 'upload' ? 'Firebase 同步失敗' : '下載失敗'}：${status.message}`;
  if (status.kind === 'stale-persisted-failure') return '上一次同步嘗試結果已過期；請以目前同步操作的結果為準。';
  if (status.kind === 'missing-ledger') return '❌ 雲端為舊格式，未包含 Financial Event Ledger；為保護本機資料，本次同步已停止。';
  if (status.kind === 'event-id-collision') return '❌ 同步狀態：兩端存在相同事件 ID、但事件內容不同。為避免資料損毀，本次同步已中止。未上傳、未下載、未覆寫任何 Ledger。';

  const observed = `本機 Ledger：v${status.observedLocalSchema}\nFirebase Ledger：v${status.observedRemoteSchema}\n目前 App writer：v${facts.writerSchemaVersion}\n本 App 支援：${facts.supportedSchemaVersions.map(version => `v${version}`).join(' / ')}`;
  if (status.kind === 'unsupported-future-schema') {
    return `❌ ${observed}\n\n同步狀態：其中一端 Ledger schema 不受目前 App 支援。為避免資料損毀，本次同步已停止。未上傳、未下載、未覆寫任何 Ledger。`;
  }
  return `❌ ${observed}\n\n同步狀態：兩端 Ledger schema 不同。為避免資料損毀，本次同步已停止。未上傳、未下載、未覆寫任何 Ledger。`;
}
