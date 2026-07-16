import assert from 'node:assert/strict';
import test from 'node:test';
import { NAV_ITEMS } from '../src/components/layout/navItems.ts';

test('product shell has one ordered primary navigation registry', () => {
  assert.deepEqual(NAV_ITEMS.map(item => item.to), ['/home', '/assets', '/analytics', '/market', '/tools', '/settings']);
  assert.equal(new Set(NAV_ITEMS.map(item => item.to)).size, NAV_ITEMS.length);
  assert.ok(NAV_ITEMS.every(item => item.label && item.icon));
});

test('asset secondary navigation has distinct destinations', () => {
  const assets = NAV_ITEMS.find(item => item.to === '/assets');
  assert.ok(assets?.subItems);
  assert.deepEqual(assets.subItems?.map(item => item.label), ['持股資產', '資產配置', '淨資產歷史']);
  assert.equal(new Set(assets.subItems?.map(item => item.to)).size, assets.subItems?.length);
});
