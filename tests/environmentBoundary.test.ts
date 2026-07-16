import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnvironmentBoundary, environmentIdentity, normalizeFirebaseBasePath } from '../src/lib/environmentBoundary';

test('Preview and Production use distinct, stable Firebase roots while retaining the secretPath format', () => {
  const production = createEnvironmentBoundary('production', 'family-universal-rebalance');
  const preview = createEnvironmentBoundary('preview', 'family-universal-rebalance-preview');
  assert.notEqual(production.firebaseBasePath, preview.firebaseBasePath);
  assert.equal(production.syncRoot('device/a'), 'family-universal-rebalance/device%2Fa');
  assert.equal(preview.syncRoot('device/a'), 'family-universal-rebalance-preview/device%2Fa');
  assert.equal(preview.syncRoot(''), 'family-universal-rebalance-preview/family-universal-rebalance-preview');
});

test('Firebase root normalization removes only edge separators and rejects blank or unstable roots', () => {
  assert.equal(normalizeFirebaseBasePath(' /family-universal-rebalance-preview/ '), 'family-universal-rebalance-preview');
  for (const invalid of ['', '   ', '/', '///', '.', 'family-universal-rebalance-preview//', 'nested/root']) assert.throws(() => normalizeFirebaseBasePath(invalid), /環境隔離設定無效/);
});

test('Preview cannot use the Production root and Production cannot use the Preview root', () => {
  assert.throws(() => createEnvironmentBoundary('preview', 'family-universal-rebalance'), /環境隔離設定無效/);
  assert.throws(() => createEnvironmentBoundary('production', 'family-universal-rebalance-preview'), /環境隔離設定無效/);
  assert.throws(() => environmentIdentity('staging'), /環境隔離設定無效/);
});
