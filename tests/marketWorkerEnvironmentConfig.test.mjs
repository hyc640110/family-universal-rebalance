import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const envValue = (contents, name) => new RegExp(`^${name}=(.+)$`, 'm').exec(contents)?.[1]?.trim() ?? '';
const previewConfig = JSON.parse(read('../workers/market-data/wrangler.jsonc'));
const productionConfig = JSON.parse(read('../workers/market-data/wrangler.production.jsonc'));
const previewUrl = envValue(read('../.env.preview-deploy'), 'VITE_MARKET_DATA_WORKER_URL');
const productionUrl = envValue(read('../.env.production'), 'VITE_MARKET_DATA_WORKER_URL');
const previewEnvironment = envValue(read('../.env.preview-deploy'), 'VITE_DEPLOYMENT_ENVIRONMENT');
const productionEnvironment = envValue(read('../.env.production'), 'VITE_DEPLOYMENT_ENVIRONMENT');
const workerSource = read('../workers/market-data/src/index.js');
const appSource = read('../src/App.tsx');
const indexHtml = read('../index.html');
const autoSync = read('../public/auto-sync.js');

test('Preview and Production Market Workers have separate names and explicit environments', () => {
  assert.equal(previewConfig.name, 'family-universal-rebalance-market-data-preview');
  assert.equal(previewConfig.vars.ENVIRONMENT, 'preview');
  assert.equal(productionConfig.name, 'family-universal-rebalance-market-data-production');
  assert.equal(productionConfig.vars.ENVIRONMENT, 'production');
  assert.notEqual(previewConfig.name, productionConfig.name);
  assert.equal(previewConfig.main, productionConfig.main);
  assert.match(workerSource, /market-data-worker-v6\.0\.5-refresh/);
  assert.match(workerSource, /refresh \? 'no-store' : 'public, max-age=300, s-maxage=900'/);
});

test('Production and Preview builds inject distinct Market Worker URLs', () => {
  assert.equal(previewUrl, 'https://family-universal-rebalance-market-data-preview.hyc640110.workers.dev');
  assert.equal(productionUrl, 'https://family-universal-rebalance-market-data-production.hyc640110.workers.dev');
  assert.notEqual(previewUrl, productionUrl);
  assert.doesNotMatch(productionUrl, /preview/);
  assert.match(previewUrl, /preview/);
  assert.equal(previewEnvironment, 'preview');
  assert.equal(productionEnvironment, 'production');
  assert.match(indexHtml, /universal-rebalance-deployment-environment/);
  assert.match(autoSync, /universal-rebalance-deployment-environment/);
  assert.doesNotMatch(autoSync, /family-universal-rebalance\/preview/);
});

test('a missing Market Worker URL remains unavailable instead of falling back across environments', () => {
  assert.match(appSource, /const marketWorkerUrl = import\.meta\.env\.VITE_MARKET_DATA_WORKER_URL \|\| '';/);
  assert.doesNotMatch(appSource, /market-data-worker\.hyc640110\.workers\.dev|market-data-preview/);
});
