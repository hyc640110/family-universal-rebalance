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

test('duplicate roles never produce a partial or over-100% allocation preview', () => {
  for (const role of ['prototype', 'leveraged', 'cash-like'] as const) {
    const remaining = role === 'prototype' ? ['leveraged', 'cash-like'] as const : role === 'leveraged' ? ['prototype', 'cash-like'] as const : ['prototype', 'leveraged'] as const;
    const roleBySymbol = { AAA: role, BBB: role, CCC: remaining[0], DDD: remaining[1] };
    const input = { preset: 'clec-433' as const, holdings, roleBySymbol };
    const result = deriveAllocationPresetPreview(input);
    assert.equal(result.canApply, false, `${role} duplicate must block applying`);
    assert.equal(result.targetTotal, null, `${role} duplicate must not show a total`);
    assert.equal(result.cashTargetPct, null, `${role} duplicate must not show a cash target`);
    assert.ok(result.rows.every(row => row.nextWeight === null && row.difference === null), `${role} duplicate must not allocate any row`);
    assert.ok(result.rows.filter(row => row.issue === 'duplicate-role').length === 2, `${role} duplicate rows must be explicit`);
    assert.match(result.blockingReasons.join('\n'), /僅能指定一檔持股/);
    assert.deepEqual(input, { preset: 'clec-433', holdings, roleBySymbol });
  }
});

test('correcting a duplicate mapping restores a valid 100% preview', () => {
  const invalid = deriveAllocationPresetPreview({ preset: 'clec-442', holdings, roleBySymbol: { AAA: 'prototype', BBB: 'prototype', CCC: 'cash-like' } });
  const restored = deriveAllocationPresetPreview({ preset: 'clec-442', holdings, roleBySymbol: roles });
  assert.equal(invalid.canApply, false);
  assert.equal(restored.canApply, true);
  assert.equal(restored.targetTotal, 100);
  assert.equal(restored.cashTargetPct, 0);
});

test('mapping normalization drops unknown symbols and none roles', () => {
  assert.deepEqual(normalizeAllocationRoleBySymbol({ aaa: 'prototype', ghost: 'leveraged', BBB: 'none' }, holdings), { AAA: 'prototype' });
});
