import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnvironmentBoundary, environmentIdentity, normalizeFirebaseBasePath } from '../src/lib/environmentBoundary';

test('Preview and Production use distinct, uid-scoped Firebase roots (UR-TODO-001)', () => {
  const production = createEnvironmentBoundary('production', 'family-universal-rebalance');
  const preview = createEnvironmentBoundary('preview', 'family-universal-rebalance-preview');
  assert.notEqual(production.firebaseBasePath, preview.firebaseBasePath);
  assert.equal(production.syncRoot('uid-abc'), 'family-universal-rebalance/users/uid-abc');
  assert.equal(preview.syncRoot('uid-abc'), 'family-universal-rebalance-preview/users/uid-abc');
  // Same uid in both environments still resolves to disjoint paths, matching the shared-RTDB-instance isolation model.
  assert.notEqual(production.syncRoot('uid-abc'), preview.syncRoot('uid-abc'));
});

test('syncRoot requires a uid and never falls back to a guessable default (UR-TODO-001)', () => {
  const production = createEnvironmentBoundary('production', 'family-universal-rebalance');
  assert.throws(() => production.syncRoot(''), /環境隔離設定無效/);
});

test('syncRoot encodes uid values that could otherwise break the path segment', () => {
  const production = createEnvironmentBoundary('production', 'family-universal-rebalance');
  assert.equal(production.syncRoot('uid/with slash'), 'family-universal-rebalance/users/uid%2Fwith%20slash');
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
