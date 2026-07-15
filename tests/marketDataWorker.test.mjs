import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { healthEnvironment, parseTreasuryLatest, parseTwseIndex, parseTwseSignedChange } from '../workers/market-data/src/index.js';

const fetchedAt = '2026-07-14T01:00:00.000Z';
const taiex = (overrides = {}) => ({ 日期: '1150713', 指數: '發行量加權股價指數', 收盤指數: '45,380.52', 漲跌: '+', 漲跌點數: '25.91', 漲跌百分比: '0.06%', ...overrides });

test('/health reports only configured preview or production environments', async () => {
  assert.equal(healthEnvironment({ ENVIRONMENT: 'preview' }), 'preview');
  assert.equal(healthEnvironment({ ENVIRONMENT: 'production' }), 'production');
  assert.equal(healthEnvironment({}), 'unconfigured');
  assert.equal(healthEnvironment({ ENVIRONMENT: 'staging' }), 'unconfigured');

  const health = async env => (await worker.fetch(new Request('https://example.test/health'), env)).json();
  assert.equal((await health({ ENVIRONMENT: 'preview' })).environment, 'preview');
  assert.equal((await health({ ENVIRONMENT: 'production' })).environment, 'production');
  assert.equal((await health({})).environment, 'unconfigured');
  assert.equal((await health({ ENVIRONMENT: 'staging' })).environment, 'unconfigured');
});

test('TWSE adapter returns a closed TAIEX value and ROC date in Taipei time', () => {
  const point = parseTwseIndex([taiex()], fetchedAt);
  assert.equal(point.status, 'closed');
  assert.equal(point.value, 45380.52);
  assert.deepEqual({ change: point.change, changePct: point.changePct }, { change: 25.91, changePct: 0.06 });
  assert.match(point.asOf, /^2026-07-13/);
});

test('TWSE signed-change parser keeps rising, falling, and flat changes internally consistent', () => {
  assert.deepEqual(parseTwseSignedChange('+', ' 1,234.50 ', '+2.50%'), { change: 1234.5, changePct: 2.5 });
  assert.deepEqual(parseTwseSignedChange('-', '642.57', '-1.42%'), { change: -642.57, changePct: -1.42 });
  assert.deepEqual(parseTwseSignedChange('平盤', '0', '0.00%'), { change: 0, changePct: 0 });
});

test('TWSE direction is applied once even when raw numeric values already include a sign', () => {
  assert.deepEqual(parseTwseSignedChange('-', '-642.57', '-1.42%'), { change: -642.57, changePct: -1.42 });
  assert.deepEqual(parseTwseSignedChange('+', '+642.57', '+1.42%'), { change: 642.57, changePct: 1.42 });
});

test('TWSE regression fixture uses the official direction field instead of treating a magnitude as positive', () => {
  const point = parseTwseIndex([taiex({ 日期: '1150714', 收盤指數: '44737.95', 漲跌: '-', 漲跌點數: '642.57', 漲跌百分比: '-1.42' })], fetchedAt);
  assert.deepEqual({ change: point.change, changePct: point.changePct }, { change: -642.57, changePct: -1.42 });
  assert.equal(Math.sign(point.change), Math.sign(point.changePct));
});

test('TWSE parser refuses missing, illegal, incomplete, and contradictory direction contracts', () => {
  for (const input of [
    ['', '0', '0'],
    ['?', '10', '0.1'],
    ['-', '', '-0.1'],
    ['-', '10', ''],
    ['平盤', '1', '0'],
    ['-', '10', '0'],
  ]) assert.equal(parseTwseSignedChange(...input), null);
  const missingDirection = parseTwseIndex([taiex({ 漲跌: '', 漲跌點數: '0', 漲跌百分比: '0' })], fetchedAt);
  assert.equal(missingDirection.change, null);
  assert.equal(missingDirection.changePct, null);
  assert.match(missingDirection.detail, /無法驗證/);
});

test('TWSE parser accepts validated encoded or tagged direction symbols without using presentation color', () => {
  assert.deepEqual(parseTwseSignedChange('&nbsp;<b>－</b>', '10', '0.1'), { change: -10, changePct: -0.1 });
});

test('Treasury adapter returns 2Y, 10Y, 30Y and calculated spread with a recent-effective status', () => { const xml = '<entry><d:NEW_DATE>2026-07-13T00:00:00</d:NEW_DATE><d:BC_2YEAR>4.10</d:BC_2YEAR><d:BC_10YEAR>4.50</d:BC_10YEAR><d:BC_30YEAR>5.00</d:BC_30YEAR></entry>'; const points = parseTreasuryLatest(xml, fetchedAt); assert.equal(points.length, 4); assert.equal(points[3].value, 0.4); assert.equal(points[0].asOf, '2026-07-13T00:00:00-04:00'); assert.equal(points[0].status, 'recent-effective'); });
