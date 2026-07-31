import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ALLOCATION_CONTEXTS, getAllocationContext } from '../src/lib/allocationContext';
import { TOOL_DEFINITIONS } from '../src/lib/toolNavigation';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('three allocation contexts are centrally defined and deterministic', () => {
  assert.deepEqual(Object.keys(ALLOCATION_CONTEXTS), ['official-target', 'simulation', 'analysis']);
  assert.equal(getAllocationContext('official-target'), ALLOCATION_CONTEXTS['official-target']);
  assert.equal(getAllocationContext('simulation'), ALLOCATION_CONTEXTS.simulation);
  assert.equal(getAllocationContext('analysis'), ALLOCATION_CONTEXTS.analysis);
  assert.equal(ALLOCATION_CONTEXTS['official-target'].modifiesOfficialTarget, true);
  assert.equal(ALLOCATION_CONTEXTS.analysis.isReadOnly, true);
  assert.equal(ALLOCATION_CONTEXTS.simulation.modifiesOfficialTarget, false);
});

test('official-target is a read-only custom-only summary; simulation and analysis keep the shared context notice', () => {
  const app = source('src/App.tsx');
  const simulator = source('src/pages/AllocationSimulatorPage.tsx');
  // UR-TODO-048 phase B: official-target no longer renders AllocationContextNotice or an
  // interactive preset panel — allocationPreset is state-only 'custom', so this surface is
  // now a plain read-only summary line instead.
  assert.match(app, /function AllocationPresetSummary\(\{ preset \}: \{ preset: AllocationPreset \}\) \{/);
  assert.match(app, /目前正式配置：<strong>\{allocationPresetLabel\(preset\)\}<\/strong>/);
  assert.doesNotMatch(app, /<AllocationContextNotice context="official-target"/);
  assert.match(app, /<AllocationContextNotice context="analysis" showCta \/>/);
  assert.match(simulator, /<AllocationContextNotice context="simulation" showCta \/>/);
});

test('simulator tool metadata stays aligned with the central simulation context and route', () => {
  const simulator = TOOL_DEFINITIONS.find(tool => tool.id === 'allocation-simulator');
  assert.deepEqual(simulator && {
    name: simulator.name,
    description: simulator.description,
    to: simulator.to,
    actionLabel: simulator.actionLabel
  }, {
    name: ALLOCATION_CONTEXTS.simulation.name,
    description: ALLOCATION_CONTEXTS.simulation.description,
    to: '/tools/allocation-simulator',
    actionLabel: '開始模擬'
  });
  assert.equal(ALLOCATION_CONTEXTS.simulation.route, '/assets');
  assert.equal(ALLOCATION_CONTEXTS.analysis.route, '/assets');
});

test('allocation context copy keeps official targets, simulations, and analysis distinct', () => {
  assert.match(ALLOCATION_CONTEXTS['official-target'].description, /再平衡建議與相關決策皆使用/);
  assert.match(ALLOCATION_CONTEXTS.simulation.description, /不會自動取代正式目標配置/);
  assert.match(ALLOCATION_CONTEXTS.simulation.description, /不提供套用正式配置/);
  assert.match(ALLOCATION_CONTEXTS.analysis.description, /不會建立或修改配置方案/);
});

test('context notice remains mobile-safe and does not introduce persistence or route changes', () => {
  const css = source('src/styles.css');
  const app = source('src/App.tsx');
  assert.match(css, /\.allocation-context-notice\{display:grid;grid-template-columns:auto minmax\(0,1fr\) auto/);
  assert.match(css, /@media\(max-width:700px\)\{\.allocation-context-notice\{grid-template-columns:1fr/);
  assert.doesNotMatch(source('src/lib/allocationContext.ts'), /from ['"].*(syncState|allocationPresets)|setState\(/);
  assert.match(app, /isAllocationSimulator && <AllocationSimulatorPage/);
});
