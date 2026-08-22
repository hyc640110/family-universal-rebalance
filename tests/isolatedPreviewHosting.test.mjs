import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const workflowPath = new URL('../.github/workflows/deploy-preview-isolated.yml', import.meta.url);
const workflow = () => readFileSync(workflowPath, 'utf8');

test('isolated Preview deployment builds only the dedicated Preview site and targets only its repository', () => {
  const source = workflow();
  assert.match(source, /name: Deploy Isolated Preview/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /VITE_APP_BASE=\/family-universal-rebalance-preview\//);
  assert.match(source, /repository: hyc640110\/family-universal-rebalance-preview/);
  assert.match(source, /ISOLATED_PREVIEW_DEPLOY_TOKEN/);
  assert.match(source, /git -C preview-target push origin preview/);
  assert.doesNotMatch(source, /actions\/deploy-pages/);
  assert.doesNotMatch(source, /github-pages/);
  assert.doesNotMatch(source, /combined/);
  assert.doesNotMatch(source, /Checkout main \(Production source\)/);
  assert.doesNotMatch(source, /\/family-universal-rebalance\/preview\//);
  assert.doesNotMatch(source, /hyc640110\.github\.io\/family-universal-rebalance\//);
});

test('isolated Preview deployment fails closed for missing, main, and unresolved refs before it can publish', () => {
  const source = workflow();
  assert.match(source, /Preview ref is required/);
  assert.match(source, /Preview ref must not be main/);
  assert.match(source, /git rev-parse --verify HEAD\^\{commit\}/);
  assert.match(source, /Preview deploy credential is required/);
});

test('isolated Preview deployment rejects a resolved commit that is the current main tip', () => {
  const source = workflow();
  assert.match(source, /PREVIEW_SHA="\$\(git rev-parse --verify HEAD\^\{commit\}\)"/);
  assert.match(source, /MAIN_SHA="\$\(git ls-remote origin refs\/heads\/main \| awk '\{print \$1\}'\)"/);
  assert.match(source, /if \[ -z "\$MAIN_SHA" \]; then/);
  assert.match(source, /if \[ "\$PREVIEW_SHA" = "\$MAIN_SHA" \]; then/);
  assert.match(source, /Preview ref must not resolve to the current main commit/);
});
