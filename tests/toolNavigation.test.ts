import assert from 'node:assert/strict';
import test from 'node:test';
import { getToolQuickLinks, isTransactionToolsTarget, TOOL_DEFINITIONS } from '../src/lib/toolNavigation.ts';
import { readFileSync } from 'node:fs';

// UR-TODO-058: 'investment-backtest' gained a route (activated the previously-placeholder Tool
// Center entry as the "三策略再平衡模擬比較" comparison tool), so it now joins this list — first,
// matching its position in TOOL_DEFINITIONS (etf-xray and monte-carlo still have no route).
const expectedQuickOrder = [
  'investment-backtest', 'investment-action-center', 'import-transactions', 'dividend-center', 'ai-decision', 'portfolio-risk', 'rebalance-recommendation', 'clec-strategy',
  'wealth-goal', 'cash-flow', 'net-worth-history', 'retirement-planner', 'allocation-simulator', 'risk-center'
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

test('交易匯入深連結仍是交易工具的唯一受控開啟條件', () => {
  assert.equal(isTransactionToolsTarget('/assets', '#transactions-section'), true);
  assert.equal(isTransactionToolsTarget('/assets', ''), false);
  assert.equal(isTransactionToolsTarget('/tools', '#transactions-section'), false);
});
