import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assertEnvironmentBoundary, parseEnv } from './environment-boundary-check.mjs';

const read = path => readFileSync(path, 'utf8');
const scripts = directory => readdirSync(join(directory, 'assets')).filter(file => file.endsWith('.js')).map(file => read(join(directory, 'assets', file))).join('\n');
const inspect = (mode, directory, envFile, oppositeRoot) => {
  assert.ok(existsSync(join(directory, 'index.html')), `${mode} build is missing`);
  const env = parseEnv(read(envFile));
  assertEnvironmentBoundary(mode, env);
  const bundle = scripts(directory);
  for (const key of ['VITE_FIREBASE_BASE_PATH', 'VITE_STORAGE_KEY', 'VITE_WORKER_URL', 'VITE_MARKET_DATA_WORKER_URL']) {
    assert.ok(bundle.includes(env[key]), `${mode} runtime bundle is missing ${key}`);
  }
  assert.doesNotMatch(bundle, new RegExp(`['\"]${oppositeRoot}['\"]`), `${mode} runtime bundle contains the opposite Firebase root`);
};

inspect('production', 'dist', '.env.production', 'family-universal-rebalance-preview');
inspect('preview', 'dist-preview', '.env.preview-deploy', 'family-universal-rebalance');
assert.doesNotMatch(scripts('dist'), /preview-historical-dividend-hist01|HIST01|歷史測試資產/, 'production bundle contains Preview historical fixture data');
assert.match(scripts('dist-preview'), /preview-historical-dividend-hist01/, 'preview bundle is missing the historical fixture marker');
process.stdout.write('Production and Preview build artifacts contain only their usable environment roots.\n');
