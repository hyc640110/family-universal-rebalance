import assert from 'node:assert/strict';
import test from 'node:test';
import { getToolQuickLinks, isTransactionToolsTarget, TOOL_DEFINITIONS } from '../src/lib/toolNavigation.ts';
import { readFileSync } from 'node:fs';

const expectedRoutedTools = [
  'investment-backtest', 'investment-action-center', 'import-transactions', 'dividend-center', 'ai-decision', 'portfolio-risk', 'rebalance-recommendation', 'clec-strategy',
  'wealth-goal', 'cash-flow', 'net-worth-history', 'retirement-planner', 'allocation-simulator', 'risk-center'
] as const;

const expectedGroups = {
  'today-decision': [
    'investment-action-center', 'ai-decision', 'risk-center', 'rebalance-recommendation'
  ],
  'management-tracking': [
    'portfolio-risk', 'dividend-center', 'cash-flow', 'net-worth-history', 'import-transactions'
  ],
  'planning-simulation': [
    'clec-strategy', 'wealth-goal', 'retirement-planner', 'allocation-simulator', 'investment-backtest'
  ],
  planned: ['etf-xray', 'monte-carlo']
} as const;

const expectedRelated = {
  'investment-action-center': ['ai-decision', 'risk-center', 'rebalance-recommendation'],
  'ai-decision': ['investment-action-center', 'portfolio-risk', 'rebalance-recommendation'],
  'risk-center': ['cash-flow', 'portfolio-risk', 'investment-action-center'],
  'rebalance-recommendation': ['investment-action-center', 'portfolio-risk', 'clec-strategy'],
  'portfolio-risk': ['risk-center', 'rebalance-recommendation', 'allocation-simulator'],
  'dividend-center': ['cash-flow', 'net-worth-history', 'wealth-goal'],
  'cash-flow': ['risk-center', 'wealth-goal', 'retirement-planner'],
  'net-worth-history': ['wealth-goal', 'cash-flow', 'portfolio-risk'],
  'import-transactions': ['investment-action-center', 'portfolio-risk', 'dividend-center'],
  'clec-strategy': ['rebalance-recommendation', 'investment-backtest', 'allocation-simulator'],
  'wealth-goal': ['retirement-planner', 'cash-flow', 'net-worth-history'],
  'retirement-planner': ['wealth-goal', 'cash-flow', 'allocation-simulator'],
  'allocation-simulator': ['portfolio-risk', 'clec-strategy', 'investment-backtest'],
  'investment-backtest': ['allocation-simulator', 'clec-strategy', 'rebalance-recommendation']
} as const;

test('Tool Center keeps one canonical definition for all 16 tools and preserves routed destinations', () => {
  const available = TOOL_DEFINITIONS.filter(tool => tool.to);
  assert.deepEqual(available.map(tool => tool.id), expectedRoutedTools);
  assert.equal(TOOL_DEFINITIONS.length, 16);
  assert.equal(new Set(TOOL_DEFINITIONS.map(tool => tool.id)).size, TOOL_DEFINITIONS.length);
  assert.equal(TOOL_DEFINITIONS.find(tool => tool.id === 'import-transactions')?.to, '/assets#transactions-section');

  for (const tool of available) {
    assert.ok(tool.to!.startsWith('/tools/') || tool.to === '/assets#transactions-section');
    assert.ok(tool.name.length > 0);
    assert.ok(tool.actionLabel?.length);
    assert.ok(tool.icon);
  }
});

test('all 16 tools belong to exactly one approved IA group with deterministic priority order', () => {
  const grouped = new Map<string, string[]>();
  for (const tool of TOOL_DEFINITIONS) {
    assert.ok(tool.group, `${tool.id} must define group`);
    assert.equal(typeof tool.priority, 'number', `${tool.id} must define priority`);
    const tools = grouped.get(tool.group) ?? [];
    tools.push(tool.id);
    grouped.set(tool.group, tools);
  }

  assert.deepEqual([...grouped.keys()], Object.keys(expectedGroups));
  for (const [group, expectedIds] of Object.entries(expectedGroups)) {
    const ids = TOOL_DEFINITIONS
      .filter(tool => tool.group === group)
      .sort((a, b) => a.priority - b.priority)
      .map(tool => tool.id);
    assert.deepEqual(ids, expectedIds);
  }
});

test('quick links use the approved contextual mapping and never exceed three related tools', () => {
  for (const [current, expectedIds] of Object.entries(expectedRelated)) {
    const links = getToolQuickLinks(current as keyof typeof expectedRelated);
    assert.deepEqual(links.map(link => link.id), expectedIds);
    assert.ok(links.length <= 3);
    assert.ok(links.every(link => link.to && link.name && link.actionLabel));
    assert.ok(links.every(link => link.id !== current));
  }
});

test('quick links fail closed when no current tool is supplied', () => {
  assert.deepEqual(getToolQuickLinks().map(link => link.id), []);
});

test('planned tools remain non-routed and never appear in contextual quick links', () => {
  const planned = TOOL_DEFINITIONS.filter(tool => tool.group === 'planned');
  assert.deepEqual(planned.map(tool => tool.id), expectedGroups.planned);
  assert.ok(planned.every(tool => !tool.to));

  const quickLinkIds = new Set(Object.keys(expectedRelated).flatMap(current => getToolQuickLinks(current as keyof typeof expectedRelated).map(link => link.id)));
  for (const tool of planned) assert.equal(quickLinkIds.has(tool.id), false);
});

test('ToolsPage renders Tool Center by IA sections instead of one flat directory', () => {
  const toolsPage = readFileSync(new URL('../src/pages/ToolsPage.tsx', import.meta.url), 'utf8');
  assert.match(toolsPage, /TOOL_GROUP_ORDER/);
  assert.match(toolsPage, /TOOL_GROUP_LABELS/);
  assert.match(toolsPage, /tool\.group === group/);
  assert.match(toolsPage, /a\.priority - b\.priority/);
  assert.doesNotMatch(toolsPage, /<section className="tool-grid">\{TOOL_DEFINITIONS\.map/);
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
