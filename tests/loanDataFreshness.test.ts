import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveLoanDataFreshness, isLoanDataStale, LOAN_DATA_STALE_THRESHOLD_DAYS } from '../src/lib/loanDataFreshness';

test('LOAN_DATA_STALE_THRESHOLD_DAYS is the agreed 30-day threshold', () => {
  assert.equal(LOAN_DATA_STALE_THRESHOLD_DAYS, 30);
});

test('isLoanDataStale is false exactly at the 30-day boundary and true just past it', () => {
  assert.equal(isLoanDataStale('2026-07-06', '2026-08-05'), false); // exactly 30 days
  assert.equal(isLoanDataStale('2026-07-05', '2026-08-05'), true); // 31 days
  assert.equal(isLoanDataStale('2026-08-05', '2026-08-05'), false); // same day
  assert.equal(isLoanDataStale('2026-08-06', '2026-08-05'), false); // future asOf, not stale
});

test('isLoanDataStale never throws and treats invalid/missing dates as not stale', () => {
  assert.equal(isLoanDataStale('', '2026-08-05'), false);
  assert.equal(isLoanDataStale('not-a-date', '2026-08-05'), false);
  assert.equal(isLoanDataStale('2026-13-40', '2026-08-05'), false);
  assert.equal(isLoanDataStale('2026-07-05', ''), false);
});

test('deriveLoanDataFreshness maps each loan independently and normalizes invalid asOf to null (never stale)', () => {
  const result = deriveLoanDataFreshness([
    { id: 'loan-fresh', asOf: '2026-08-01' },
    { id: 'loan-stale', asOf: '2026-06-01' },
    { id: 'loan-missing' },
    { id: 'loan-invalid', asOf: 'garbage' }
  ], '2026-08-05');

  assert.deepEqual(result, [
    { loanId: 'loan-fresh', asOf: '2026-08-01', isStale: false },
    { loanId: 'loan-stale', asOf: '2026-06-01', isStale: true },
    { loanId: 'loan-missing', asOf: null, isStale: false },
    { loanId: 'loan-invalid', asOf: null, isStale: false }
  ]);
});

test('deriving freshness for one loan never depends on or affects any other loan in the list', () => {
  const withOneStale = deriveLoanDataFreshness([{ id: 'a', asOf: '2026-08-01' }, { id: 'b', asOf: '2026-01-01' }], '2026-08-05');
  const aAlone = deriveLoanDataFreshness([{ id: 'a', asOf: '2026-08-01' }], '2026-08-05');
  assert.deepEqual(withOneStale.find(entry => entry.loanId === 'a'), aAlone[0]);
});
