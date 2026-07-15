import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { TOOL_DEFINITIONS, TOOL_NAVIGATION_ORDER, getAvailableToolsInNavigationOrder, getToolQuickLinks } from '../src/lib/toolNavigation';

const desktopToolCenterOrder = ['etf-xray', 'investment-backtest', 'monte-carlo', 'dividend-center', 'ai-decision', 'portfolio-risk', 'rebalance-recommendation', 'clec-strategy', 'wealth-goal', 'cash-flow', 'net-worth-history', 'retirement-planner', 'allocation-simulator', 'risk-center'];
const availableToolOrder = ['dividend-center', 'ai-decision', 'portfolio-risk', 'rebalance-recommendation', 'clec-strategy', 'wealth-goal', 'cash-flow', 'net-worth-history', 'allocation-simulator', 'risk-center'];

test('the shared navigation source preserves the desktop Tool Center order', () => {
  assert.deepEqual(TOOL_NAVIGATION_ORDER, desktopToolCenterOrder);
  assert.deepEqual(TOOL_DEFINITIONS.map(tool => tool.id), desktopToolCenterOrder);
});

test('Tool Center and quick navigation render from the shared source', () => {
  const toolsPage = readFileSync(resolve('src/pages/ToolsPage.tsx'), 'utf8');
  const quickNavigation = readFileSync(resolve('src/components/ToolQuickNavigation.tsx'), 'utf8');
  assert.match(toolsPage, /TOOL_DEFINITIONS\.map/);
  assert.match(quickNavigation, /getToolQuickLinks\(current\)/);
});

test('quick links retain the available tools in desktop order and exclude the current page only', () => {
  assert.deepEqual(getAvailableToolsInNavigationOrder().map(tool => tool.id), availableToolOrder);
  for (const current of availableToolOrder) {
    const expected = availableToolOrder.filter(id => id !== current);
    assert.deepEqual(getToolQuickLinks(current).map(tool => tool.id), expected);
  }
});

test('routes, names, and planned availability remain unchanged', () => {
  const routes = Object.fromEntries(TOOL_DEFINITIONS.map(tool => [tool.id, tool.to]));
  assert.deepEqual(routes, {
    'etf-xray': undefined,
    'investment-backtest': undefined,
    'monte-carlo': undefined,
    'dividend-center': '/tools/dividend-center',
    'ai-decision': '/tools/ai-decision',
    'portfolio-risk': '/tools/portfolio-risk',
    'rebalance-recommendation': '/tools/rebalance-recommendation',
    'clec-strategy': '/tools/clec-strategy',
    'wealth-goal': '/tools/wealth-goal',
    'cash-flow': '/tools/cash-flow',
    'net-worth-history': '/tools/net-worth-history',
    'retirement-planner': undefined,
    'allocation-simulator': '/tools/allocation-simulator',
    'risk-center': '/tools/risk-center'
  });
  assert.equal(TOOL_DEFINITIONS.find(tool => tool.id === 'dividend-center')?.name, '配息中心');
  assert.equal(TOOL_DEFINITIONS.find(tool => tool.id === 'dividend-center')?.quickLabel, '股息中心');
  assert.deepEqual(TOOL_DEFINITIONS.filter(tool => !tool.to).map(tool => tool.id), ['etf-xray', 'investment-backtest', 'monte-carlo', 'retirement-planner']);
});

test('mobile quick links remain single-column, wrap long labels, and clear the fixed navigation', () => {
  const styles = readFileSync(resolve('src/styles.css'), 'utf8');
  assert.match(styles, /\.tool-quick-navigation a\{[^}]*min-width:0[^}]*overflow-wrap:anywhere/);
  assert.match(styles, /@media \(max-width: 768px\)\{[\s\S]*?\.tool-quick-navigation\{display:grid;grid-template-columns:1fr;margin-bottom:max\(14px,env\(safe-area-inset-bottom\)\)/);
  assert.ok(styles.includes('.app-content{padding:12px 10px calc(86px + env(safe-area-inset-bottom))}'));
});
