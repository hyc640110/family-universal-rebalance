import assert from 'node:assert/strict';
import test from 'node:test';
import { changeTone, formatChangeMoney, formatChangePercent } from '../src/lib/changePresentation';

test('Taiwan investment change presentation uses numeric sign, not display text', () => {
  assert.equal(changeTone(73000), 'up'); assert.equal(changeTone(-73000), 'down'); assert.equal(changeTone(0), 'hold'); assert.equal(changeTone(null), 'hold');
  assert.equal(formatChangeMoney(73000), '+7.3 萬元'); assert.equal(formatChangeMoney(-73000), '-7.3 萬元'); assert.equal(formatChangeMoney(0), '0 萬元'); assert.equal(formatChangeMoney(null), '—'); assert.equal(formatChangePercent(-0.073), '-7.3%');
});
