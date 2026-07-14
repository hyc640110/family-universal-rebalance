import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveAllocationPresetPreview, normalizeAllocationRoleBySymbol } from '../src/lib/allocationPresets';

const holdings = [
  { symbol: 'AAA', name: '原型', targetWeight: 25 },
  { symbol: 'BBB', name: '槓桿', targetWeight: 25 },
  { symbol: 'CCC', name: '類現金', targetWeight: 25 },
  { symbol: 'DDD', name: '其他', targetWeight: 25 }
];
const roles = { AAA: 'prototype' as const, BBB: 'leveraged' as const, CCC: 'cash-like' as const };

test('CLEC 442 previews the locked target weights without mutating its input', () => {
  const input = { preset: 'clec-442' as const, holdings, roleBySymbol: roles };
  const result = deriveAllocationPresetPreview(input);
  assert.equal(result.canApply, true);
  assert.equal(result.targetTotal, 100);
  assert.equal(result.cashTargetPct, 0);
  assert.deepEqual(result.rows.map(row => [row.symbol, row.nextWeight]), [['AAA', 40], ['BBB', 40], ['CCC', 20], ['DDD', 0]]);
  assert.equal(result.warnings.length, 1);
  assert.deepEqual(input, { preset: 'clec-442', holdings, roleBySymbol: roles });
});

test('CLEC 433 uses its locked weights and keeps unassigned holdings explicit', () => {
  const result = deriveAllocationPresetPreview({ preset: 'clec-433', holdings, roleBySymbol: roles });
  assert.equal(result.canApply, true);
  assert.deepEqual(result.rows.map(row => row.nextWeight), [40, 30, 30, 0]);
  assert.match(result.warnings[0], /DDD/);
});

test('missing or duplicate role assignments block applying a preset', () => {
  const missing = deriveAllocationPresetPreview({ preset: 'clec-442', holdings, roleBySymbol: { AAA: 'prototype', BBB: 'leveraged' } });
  const duplicate = deriveAllocationPresetPreview({ preset: 'clec-442', holdings, roleBySymbol: { AAA: 'prototype', BBB: 'prototype', CCC: 'cash-like' } });
  assert.equal(missing.canApply, false);
  assert.equal(duplicate.canApply, false);
  assert.ok(missing.blockingReasons.length > 0);
  assert.ok(duplicate.blockingReasons.length > 0);
});

test('mapping normalization drops unknown symbols and none roles', () => {
  assert.deepEqual(normalizeAllocationRoleBySymbol({ aaa: 'prototype', ghost: 'leveraged', BBB: 'none' }, holdings), { AAA: 'prototype' });
});
