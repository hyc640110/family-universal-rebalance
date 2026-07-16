import assert from 'node:assert/strict';
import test from 'node:test';
import { getToolQuickLinks, TOOL_DEFINITIONS } from '../src/lib/toolNavigation.ts';
import { readFileSync } from 'node:fs';

const expectedQuickOrder = [
  'investment-action-center', 'import-transactions', 'dividend-center', 'ai-decision', 'portfolio-risk', 'rebalance-recommendation', 'clec-strategy',
  'wealth-goal', 'cash-flow', 'net-worth-history', 'allocation-simulator', 'risk-center'
];

test('Tool Center and quick navigation share one ordered route definition', () => {
  const available = TOOL_DEFINITIONS.filter(tool => tool.to);
  assert.deepEqual(available.map(tool => tool.id), expectedQuickOrder);
  assert.equal(new Set(TOOL_DEFINITIONS.map(tool => tool.id)).size, TOOL_DEFINITIONS.length);
  assert.equal(TOOL_DEFINITIONS.find(tool => tool.id === 'import-transactions')?.to, '/assets#transactions-section');
  for (const tool of available) {
    assert.ok(tool.to!.startsWith('/tools/') || tool.to === '/assets#transactions-section');
    assert.ok(tool.name.length > 0);
    assert.ok(tool.actionLabel?.length);
    assert.ok(tool.icon);
  }
});

test('quick links preserve Tool Center order and omit only the current tool', () => {
  for (const current of expectedQuickOrder) {
    const links = getToolQuickLinks(current as typeof expectedQuickOrder[number]);
    assert.deepEqual(links.map(link => link.id), expectedQuickOrder.filter(id => id !== current));
    assert.ok(links.every(link => link.to && link.name && link.actionLabel));
  }
});

test('quick links retain the full Tool Center order when the current page is outside Tool Center', () => {
  assert.deepEqual(getToolQuickLinks().map(link => link.id), expectedQuickOrder);
});

test('the Performance analytics route uses the same quick navigation component', () => {
  const analyticsPage = readFileSync(new URL('../src/pages/AnalyticsPage.tsx', import.meta.url), 'utf8');
  assert.match(analyticsPage, /<ToolQuickNavigation \/>/);
});
