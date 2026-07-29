import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyNetWorthSnapshotFieldValue,
  classifyNetWorthSnapshotFields,
  NET_WORTH_SNAPSHOT_FIELD_NAMES
} from '../src/lib/netWorthSnapshotNormalization';

// UR-TODO-043-C2: this is a newly established contract for this PR only. It does not read from,
// call, or change netWorthHistory.ts's lenient Number() coercion or investmentPerformanceHistory.ts's
// strict typeof-number-only check — both remain unchanged. Do not read these assertions as a
// description of either existing file's behavior.

test('valid: explicit 0 and negative finite numbers are preserved as valid, not missing', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(0), { status: 'valid', value: 0 });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(-50), { status: 'valid', value: -50 });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(123.45), { status: 'valid', value: 123.45 });
});

test('missing: undefined and null are classified as missing, never coerced to 0', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(undefined), { status: 'missing' });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(null), { status: 'missing' });
});

test('non-finite: actual NaN/Infinity/-Infinity numbers keep the raw value and are not invalid', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(Number.NaN), { status: 'non-finite', rawValue: Number.NaN });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(Infinity), { status: 'non-finite', rawValue: Infinity });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(-Infinity), { status: 'non-finite', rawValue: -Infinity });
});

test('invalid: wrong types keep the raw value', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(true), { status: 'invalid', rawValue: true });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue({}), { status: 'invalid', rawValue: {} });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue([1, 2]), { status: 'invalid', rawValue: [1, 2] });
});

// UR-TODO-043-C2 new decision (§ string classification): empty string and whitespace-only
// strings are missing, '0' is explicit valid 0, clean digit-only numeric strings (with
// surrounding whitespace allowed) are valid, everything else that cannot be cleanly parsed is
// invalid and keeps its raw value. This is not a continuation of either existing file's rule.
test('UR-TODO-043-C2 new decision: empty and whitespace-only strings are missing, not 0', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(''), { status: 'missing' });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('   '), { status: 'missing' });
});

test('UR-TODO-043-C2 new decision: the string "0" is valid explicit 0, distinct from missing', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('0'), { status: 'valid', value: 0 });
});

test('UR-TODO-043-C2 new decision: clean numeric strings are valid, surrounding whitespace is trimmed', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('123'), { status: 'valid', value: 123 });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(' 123 '), { status: 'valid', value: 123 });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('-50'), { status: 'valid', value: -50 });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('12.5'), { status: 'valid', value: 12.5 });
});

test('UR-TODO-043-C2 new decision: unparseable strings are invalid and keep the raw value', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('not-a-number'), { status: 'invalid', rawValue: 'not-a-number' });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('12.5.3'), { status: 'invalid', rawValue: '12.5.3' });
});

// Explicitly called out by the product decision as string shapes not covered by a bespoke rule:
// under the stated rule (digits only, one optional decimal point, no embedded non-digit
// characters) these mechanically fall to 'invalid' without any extra logic, so implementation
// does not stop here — flagged in the PR write-up for review rather than treated silently.
test('UR-TODO-043-C2 new decision: "Infinity", "NaN", and scientific-notation strings are invalid, not non-finite', () => {
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('Infinity'), { status: 'invalid', rawValue: 'Infinity' });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('-Infinity'), { status: 'invalid', rawValue: '-Infinity' });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('NaN'), { status: 'invalid', rawValue: 'NaN' });
  assert.deepEqual(classifyNetWorthSnapshotFieldValue('1e10'), { status: 'invalid', rawValue: '1e10' });
});

test('edge case: a digit-only string that numerically overflows is non-finite, not invalid or valid', () => {
  const overflowingDigits = '1'.padEnd(400, '0');
  assert.equal(Number.isFinite(Number(overflowingDigits)), false);
  assert.deepEqual(classifyNetWorthSnapshotFieldValue(overflowingDigits), { status: 'non-finite', rawValue: overflowingDigits });
});

test('purity: classifying a value does not mutate it', () => {
  const rawRow = { totalAssets: 100, netWorth: 'not-a-number', investmentValue: undefined, cash: '  ', debt: Number.NaN };
  const snapshotBefore = JSON.stringify(rawRow, (_key, value) => (Number.isNaN(value) ? 'NaN' : value));
  classifyNetWorthSnapshotFields(rawRow);
  const snapshotAfter = JSON.stringify(rawRow, (_key, value) => (Number.isNaN(value) ? 'NaN' : value));
  assert.equal(snapshotAfter, snapshotBefore);
});

test('same-snapshot mixed statuses: each field is classified independently of the others', () => {
  const classifications = classifyNetWorthSnapshotFields({
    totalAssets: 500000,
    netWorth: '0',
    investmentValue: undefined,
    cash: 'not-a-number',
    debt: Number.NaN
  });
  assert.deepEqual(classifications.totalAssets, { status: 'valid', value: 500000 });
  assert.deepEqual(classifications.netWorth, { status: 'valid', value: 0 });
  assert.deepEqual(classifications.investmentValue, { status: 'missing' });
  assert.deepEqual(classifications.cash, { status: 'invalid', rawValue: 'not-a-number' });
  assert.deepEqual(classifications.debt, { status: 'non-finite', rawValue: Number.NaN });
});

test('field independence: one bad field does not affect the classification of the others', () => {
  const withOneBadField = classifyNetWorthSnapshotFields({
    totalAssets: 100,
    netWorth: 200,
    investmentValue: 150,
    cash: 50,
    debt: { unexpected: 'object' }
  });
  assert.deepEqual(withOneBadField.totalAssets, { status: 'valid', value: 100 });
  assert.deepEqual(withOneBadField.netWorth, { status: 'valid', value: 200 });
  assert.deepEqual(withOneBadField.investmentValue, { status: 'valid', value: 150 });
  assert.deepEqual(withOneBadField.cash, { status: 'valid', value: 50 });
  assert.deepEqual(withOneBadField.debt, { status: 'invalid', rawValue: { unexpected: 'object' } });
});

test('missing fields on a raw row are classified as missing, not treated as absent keys', () => {
  const classifications = classifyNetWorthSnapshotFields({ totalAssets: 100 });
  assert.deepEqual(classifications.netWorth, { status: 'missing' });
  assert.deepEqual(classifications.investmentValue, { status: 'missing' });
  assert.deepEqual(classifications.cash, { status: 'missing' });
  assert.deepEqual(classifications.debt, { status: 'missing' });
});

test('NET_WORTH_SNAPSHOT_FIELD_NAMES exposes exactly the five known money fields', () => {
  assert.deepEqual([...NET_WORTH_SNAPSHOT_FIELD_NAMES].sort(), ['cash', 'debt', 'investmentValue', 'netWorth', 'totalAssets']);
});
