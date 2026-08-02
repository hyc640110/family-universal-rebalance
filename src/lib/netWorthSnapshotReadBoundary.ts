import {
  classifyNetWorthSnapshotFields,
  NET_WORTH_SNAPSHOT_FIELD_NAMES,
  type NetWorthSnapshotFieldClassifications
} from './netWorthSnapshotNormalization';

export type NetWorthSnapshotReadRow = {
  readonly index: number;
  readonly raw: Readonly<Record<string, unknown>>;
  readonly date: unknown;
  readonly fields: NetWorthSnapshotFieldClassifications;
  readonly status: 'complete' | 'incomplete';
};

export type NetWorthSnapshotReadTimeView = {
  readonly status: 'no-snapshot' | 'has-snapshot';
  readonly rows: readonly NetWorthSnapshotReadRow[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyValidFields(fields: NetWorthSnapshotFieldClassifications): boolean {
  return NET_WORTH_SNAPSHOT_FIELD_NAMES.every((fieldName) => fields[fieldName].status === 'valid');
}

/**
 * Creates a non-persisted classified view from raw snapshot input.
 *
 * This is intentionally parallel to the legacy `NetWorthSnapshot` shape: it does not coerce,
 * drop, sort, deduplicate, or rewrite rows. Date handling and consumer behavior remain outside
 * this C3-A boundary.
 */
export function createNetWorthSnapshotReadTimeView(rawHistory: unknown): NetWorthSnapshotReadTimeView {
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) {
    return { status: 'no-snapshot', rows: [] };
  }

  const rows = rawHistory.map((rawValue, index) => {
    const raw = isRecord(rawValue) ? { ...rawValue } : {};
    const fields = classifyNetWorthSnapshotFields(raw);
    return {
      index,
      raw,
      date: raw.date,
      fields,
      status: hasOnlyValidFields(fields) ? 'complete' : 'incomplete'
    } satisfies NetWorthSnapshotReadRow;
  });

  return { status: 'has-snapshot', rows };
}

/** Extracts the raw history field without changing the surrounding persistence payload. */
export function createNetWorthSnapshotReadTimeViewFromState(rawState: unknown): NetWorthSnapshotReadTimeView {
  return createNetWorthSnapshotReadTimeView(isRecord(rawState) ? rawState.netWorthHistory : undefined);
}
