import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const toolPages = [
  'src/pages/InvestmentActionCenterPage.tsx',
  'src/pages/DividendCenterPage.tsx',
  'src/pages/AiDecisionCenterPage.tsx',
  'src/pages/PortfolioRiskPage.tsx',
  'src/pages/RebalanceRecommendationPage.tsx',
  'src/pages/ClecStrategyCenterPage.tsx',
  'src/pages/WealthGoalPage.tsx',
  'src/pages/CashFlowPage.tsx',
  'src/pages/NetWorthHistoryPage.tsx',
  'src/pages/AllocationSimulatorPage.tsx',
  'src/pages/RiskCenterPage.tsx',
  'src/pages/AnalyticsPage.tsx',
  'src/components/import/ImportCenter.tsx'
];

test('all existing tool surfaces use the shared navigation component', () => {
  for (const path of toolPages) assert.match(source(path), /<ToolQuickNavigation(?: current="[^"]+")?(?: showAssetsReturn)? \/>/, path);
});

test('shared navigation owns consistent return labels, icons, and quick-link button metadata', () => {
  const navigation = source('src/components/ToolQuickNavigation.tsx');
  assert.match(navigation, /aria-label="工具快速導覽"/);
  assert.match(navigation, /<ArrowLeft size=\{16\} aria-hidden="true" \/><span>返回工具中心<\/span>/);
  assert.match(navigation, /showAssetsReturn && <Link to="\/assets" aria-label="返回資產"/);
  assert.match(navigation, /<Icon size=\{16\} aria-hidden="true" \/><span>\{name\}<\/span>/);
});
