import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { TOOL_DEFINITIONS, TOOL_NATURE_LABELS, type ToolId, type ToolNature } from '../src/lib/toolNavigation.ts';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// UR request: distinguish "真實建議" (real recommendation) tools from "假設模擬" (simulation) tools
// in the Tool Center listing, without merging/removing pages or touching core calculation modules.
const expectedNature: Partial<Record<ToolId, ToolNature>> = {
  'rebalance-recommendation': 'real-recommendation',
  'clec-strategy': 'real-recommendation',
  'allocation-simulator': 'simulation',
  'investment-backtest': 'simulation'
};

test('the four rebalance-related tools are labelled with the correct nature, others are left unset', () => {
  for (const tool of TOOL_DEFINITIONS) {
    assert.equal(tool.nature, expectedNature[tool.id], `unexpected nature for ${tool.id}`);
  }
});

test('TOOL_NATURE_LABELS gives non-hierarchical, distinct Traditional Chinese labels', () => {
  assert.equal(TOOL_NATURE_LABELS['real-recommendation'], '真實建議');
  assert.equal(TOOL_NATURE_LABELS.simulation, '假設模擬');
});

test('ToolsPage renders a nature badge next to the tool name when nature is set', () => {
  const page = source('src/pages/ToolsPage.tsx');
  assert.match(page, /TOOL_NATURE_LABELS/);
  assert.match(page, /tool-nature-badge tool-nature-\$\{nature\}/);
});

test('styles.css defines visually distinct, non-good/bad-colored badge classes for both natures', () => {
  const css = source('src/styles.css');
  assert.match(css, /\.tool-nature-badge\{/);
  assert.match(css, /\.tool-nature-real-recommendation\{/);
  assert.match(css, /\.tool-nature-simulation\{/);
  // Guard against reusing the app's existing green/red good/bad semantic colors for this
  // non-hierarchical distinction (per explicit product instruction: not a quality ranking).
  const realBlock = css.match(/\.tool-nature-real-recommendation\{[^}]*\}/)?.[0] ?? '';
  const simBlock = css.match(/\.tool-nature-simulation\{[^}]*\}/)?.[0] ?? '';
  for (const block of [realBlock, simBlock]) {
    assert.doesNotMatch(block, /#43d17a/); // .good green
    assert.doesNotMatch(block, /#ff5b5b/); // .bad red
  }
});

test('both simulation pages point back to the real Rebalance Recommendation Center from their existing disclaimer notice', () => {
  const allocationSimulator = source('src/pages/AllocationSimulatorPage.tsx');
  const strategyComparison = source('src/pages/RebalanceStrategyComparisonPage.tsx');
  for (const page of [allocationSimulator, strategyComparison]) {
    assert.match(page, /想看真實再平衡建議，請至<Link to="\/tools\/rebalance-recommendation">再平衡建議中心<\/Link>/);
  }
});
