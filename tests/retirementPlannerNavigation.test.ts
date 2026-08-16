import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { TOOL_DEFINITIONS } from '../src/lib/toolNavigation';

test('退休規劃在工具中心有正式路由，並由 App 掛載頁面', () => {
  const tool = TOOL_DEFINITIONS.find(item => item.id === 'retirement-planner');
  assert.deepEqual(tool && { to: tool.to, actionLabel: tool.actionLabel }, { to: '/tools/retirement-planner', actionLabel: '開始試算' });
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /RetirementPlannerPage/);
  assert.match(app, /routeLocation\.pathname === '\/tools\/retirement-planner'/);
});
