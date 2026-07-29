/**
 * UR-TODO-043-C2: a pure, unwired classification contract for net worth snapshot money fields.
 *
 * This module does not read from, call, or change `netWorthHistory.ts` (lenient `Number()`
 * coercion) or `investmentPerformanceHistory.ts` (strict typeof-number-only). Both existing
 * files and their behavior remain unchanged; this is a new, independent contract used only by
 * its own tests until a separately authorized 043-C3 wires it into any consumer.
 */

export type NetWorthSnapshotFieldName = 'totalAssets' | 'netWorth' | 'investmentValue' | 'cash' | 'debt';

export const NET_WORTH_SNAPSHOT_FIELD_NAMES: readonly NetWorthSnapshotFieldName[] = [
  'totalAssets',
  'netWorth',
  'investmentValue',
  'cash',
  'debt'
];

export type NetWorthSnapshotFieldClassification =
  | { readonly status: 'valid'; readonly value: number }
  | { readonly status: 'missing' }
  | { readonly status: 'invalid'; readonly rawValue: unknown }
  | { readonly status: 'non-finite'; readonly rawValue: unknown };

export type NetWorthSnapshotFieldClassifications = Readonly<Record<NetWorthSnapshotFieldName, NetWorthSnapshotFieldClassification>>;

// A string is only "valid" here if, after trimming surrounding whitespace, it is entirely an
// optional '-' followed by digits and an optional single '.' decimal part. This deliberately
// rejects '+' prefixes, scientific notation ('1e10'), 'Infinity', 'NaN', hex, and multiple
// decimal points — those fall through to 'invalid' below, not treated as a special case.
const CLEAN_DECIMAL_STRING = /^-?\d+(\.\d+)?$/;

/**
 * Classifies a single raw field value into exactly one of four buckets:
 * - 'valid': a finite number, including explicit 0 and negatives.
 * - 'missing': undefined, null, an empty string, or a whitespace-only string. Never conflated
 *   with an explicit 0.
 * - 'invalid': wrong type, or a string that cannot be parsed as a clean finite number
 *   (e.g. 'not-a-number', '12.5.3', 'Infinity', 'NaN', scientific notation). The original raw
 *   value is preserved, not discarded.
 * - 'non-finite': an actual NaN/Infinity/-Infinity number, or a numeric string whose value
 *   overflows to a non-finite number. The original raw value is preserved.
 *
 * Pure function: does not mutate `rawValue` and has no side effects.
 */
export function classifyNetWorthSnapshotFieldValue(rawValue: unknown): NetWorthSnapshotFieldClassification {
  if (rawValue === undefined || rawValue === null) return { status: 'missing' };

  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? { status: 'valid', value: rawValue } : { status: 'non-finite', rawValue };
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (trimmed === '') return { status: 'missing' };
    if (!CLEAN_DECIMAL_STRING.test(trimmed)) return { status: 'invalid', rawValue };
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? { status: 'valid', value: parsed } : { status: 'non-finite', rawValue };
  }

  return { status: 'invalid', rawValue };
}

/**
 * Classifies the five known net worth snapshot money fields of a raw row independently of one
 * another. One field's classification never influences another field's classification.
 *
 * Pure function: does not mutate `rawRow` and has no side effects.
 */
export function classifyNetWorthSnapshotFields(
  rawRow: Partial<Record<NetWorthSnapshotFieldName, unknown>>
): NetWorthSnapshotFieldClassifications {
  const classifications = {} as Record<NetWorthSnapshotFieldName, NetWorthSnapshotFieldClassification>;
  for (const fieldName of NET_WORTH_SNAPSHOT_FIELD_NAMES) {
    classifications[fieldName] = classifyNetWorthSnapshotFieldValue(rawRow[fieldName]);
  }
  return classifications;
}
