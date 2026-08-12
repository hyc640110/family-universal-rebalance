import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnvironmentBoundary, environmentIdentity, normalizeDeploymentScope } from '../src/lib/environmentBoundary';

test('Preview and Production retain distinct deployment scopes (UR-TODO-001)', () => {
  const production = createEnvironmentBoundary('production', 'family-universal-rebalance');
  const preview = createEnvironmentBoundary('preview', 'family-universal-rebalance-preview');
  assert.notEqual(production.deploymentScope, preview.deploymentScope);
});

test('Deployment scope normalization removes only edge separators and rejects blank or unstable scopes', () => {
  assert.equal(normalizeDeploymentScope(' /family-universal-rebalance-preview/ '), 'family-universal-rebalance-preview');
  for (const invalid of ['', '   ', '/', '///', '.', 'family-universal-rebalance-preview//', 'nested/root']) assert.throws(() => normalizeDeploymentScope(invalid), /環境隔離設定無效/);
});

test('Preview cannot use the Production scope and Production cannot use the Preview scope', () => {
  assert.throws(() => createEnvironmentBoundary('preview', 'family-universal-rebalance'), /環境隔離設定無效/);
  assert.throws(() => createEnvironmentBoundary('production', 'family-universal-rebalance-preview'), /環境隔離設定無效/);
  assert.throws(() => environmentIdentity('staging'), /環境隔離設定無效/);
});
