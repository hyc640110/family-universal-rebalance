import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const previewUrl = 'https://family-universal-rebalance-market-data-preview.hyc640110.workers.dev';
const productionUrl = 'https://family-universal-rebalance-market-data-production.hyc640110.workers.dev';

const readTree = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? readTree(path) : [readFileSync(path, 'utf8')];
}).join('\n');

const productionBundle = readTree('dist');
const previewBundle = readTree('dist-preview');

assert.match(productionBundle, new RegExp(productionUrl.replaceAll('.', '\\.')));
assert.doesNotMatch(productionBundle, new RegExp(previewUrl.replaceAll('.', '\\.')));
assert.doesNotMatch(productionBundle, /family-universal-rebalance\/preview\//);
assert.match(previewBundle, new RegExp(previewUrl.replaceAll('.', '\\.')));
assert.doesNotMatch(previewBundle, new RegExp(productionUrl.replaceAll('.', '\\.')));
assert.match(previewBundle, /family-universal-rebalance\/preview\//);

console.log('Market Worker bundle isolation verified.');
