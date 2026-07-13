import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTransactionAmount } from '../src/lib/transactionPresentation';

test('transaction amount formatter keeps nonzero small values in yuan', () => {
  assert.equal(formatTransactionAmount(0), '0 元');
  assert.equal(formatTransactionAmount(95), '95 元');
  assert.equal(formatTransactionAmount(180), '180 元');
  assert.equal(formatTransactionAmount(9999), '9,999 元');
  assert.equal(formatTransactionAmount(10000), '1.0 萬元');
  assert.equal(formatTransactionAmount(35000), '3.5 萬元');
  assert.equal(formatTransactionAmount(-180), '180 元');
  assert.equal(formatTransactionAmount(0.5), '0.5 元');
  assert.equal(formatTransactionAmount(180).includes('0.0 萬元'), false);
});
