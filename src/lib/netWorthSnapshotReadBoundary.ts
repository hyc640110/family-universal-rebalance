import {
  classifyNetWorthSnapshotFields,
  NET_WORTH_SNAPSHOT_FIELD_NAMES,
  type NetWorthSnapshotFieldName,
  type NetWorthSnapshotFieldClassifications
} from './netWorthSnapshotNormalization';
import type { NetWorthSnapshot } from './netWorthHistory';
import { selectLastOccurrenceByDate } from './calendarDay';

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

export type NetWorthSnapshotConsumerRow = {
  readonly index: number;
  readonly date: string;
  readonly raw: Readonly<Record<string, unknown>>;
  readonly fields: NetWorthSnapshotFieldClassifications;
  readonly status: 'complete' | 'incomplete';
  readonly totalAssets: number | null;
  readonly netWorth: number | null;
  readonly investmentValue: number | null;
  readonly cash: number | null;
  readonly debt: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyValidFields(fields: NetWorthSnapshotFieldClassifications): boolean {
  return NET_WORTH_SNAPSHOT_FIELD_NAMES.every((fieldName) => fields[fieldName].status === 'valid');
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function availableValue(fields: NetWorthSnapshotFieldClassifications, fieldName: NetWorthSnapshotFieldName): number | null {
  const field = fields[fieldName];
  return field.status === 'valid' ? field.value : null;
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

/**
 * Projects the classified boundary into a presentation/calculation view.
 * Classification is not repeated here: unavailable values become null, never zero.
 * Invalid dates remain available in the raw boundary but are excluded from date-keyed
 * consumers so the existing calendar-date contract is unchanged.
 */
export function createNetWorthSnapshotConsumerRows(view: NetWorthSnapshotReadTimeView): NetWorthSnapshotConsumerRow[] {
  const rows: NetWorthSnapshotConsumerRow[] = [];
  for (const row of view.rows) {
    if (!validDate(row.date)) continue;
    rows.push({
      index: row.index,
      date: row.date,
      raw: row.raw,
      fields: row.fields,
      status: row.status,
      totalAssets: availableValue(row.fields, 'totalAssets'),
      netWorth: availableValue(row.fields, 'netWorth'),
      investmentValue: availableValue(row.fields, 'investmentValue'),
      cash: availableValue(row.fields, 'cash'),
      debt: availableValue(row.fields, 'debt')
    });
  }
  return selectLastOccurrenceByDate(rows);
}

/** Returns only rows where all persisted money fields are usable for legacy number-only calculations. */
export function toCompleteNetWorthSnapshots(rows: readonly NetWorthSnapshotConsumerRow[]): NetWorthSnapshot[] {
  return rows.flatMap(row => row.status === 'complete' ? [{
    date: row.date,
    totalAssets: row.totalAssets!,
    netWorth: row.netWorth!,
    investmentValue: row.investmentValue!,
    cash: row.cash!,
    debt: row.debt!
  }] : []);
}

/** Replaces one locally refreshed date in the non-persisted view while retaining other raw rows. */
export function upsertNetWorthSnapshotReadTimeView(view: NetWorthSnapshotReadTimeView, snapshot: NetWorthSnapshot): NetWorthSnapshotReadTimeView {
  const rawRows = view.rows.map(row => row.raw).filter(raw => raw.date !== snapshot.date);
  return createNetWorthSnapshotReadTimeView([...rawRows, snapshot]);
}
