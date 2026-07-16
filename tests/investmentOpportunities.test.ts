import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveInvestmentOpportunities } from '../src/lib/investmentOpportunities';
import type { DailyDecisionWorkflow } from '../src/lib/dailyDecisionWorkflow';

const workflow = (statuses: DailyDecisionWorkflow['steps'][number]['status'][]): DailyDecisionWorkflow => ({
  conclusion: { status: 'review-available', title: '測試', description: '測試' }, primaryNextStep: null,
  steps: [
    { id: 'data-and-quotes', title: '資料與報價', description: '日期不明', status: statuses[0], priority: 1, route: '/assets', linkLabel: '查看資產資料', ariaLabel: '查看資產資料', isPrimaryNextStep: false },
    { id: 'risk-and-safety', title: '風險與安全', description: '風險提醒', status: statuses[1], priority: 2, route: '/tools/portfolio-risk', linkLabel: '查看投資組合風險', ariaLabel: '查看投資組合風險', isPrimaryNextStep: false },
    { id: 'rebalance', title: '再平衡', description: '已達門檻', status: statuses[2], priority: 3, route: '/tools/rebalance-recommendation', linkLabel: '查看再平衡建議', ariaLabel: '查看再平衡建議', isPrimaryNextStep: false },
    { id: 'performance', title: '績效與回撤', description: '資料不足', status: statuses[3], priority: 4, route: '/analytics', linkLabel: '查看投資績效', ariaLabel: '查看投資績效', isPrimaryNextStep: false },
    { id: 'market-and-dividend', title: '市場與股息', description: '市場較舊', status: statuses[4], priority: 5, route: '/market', linkLabel: '查看市場資料', ariaLabel: '查看市場資料', isPrimaryNextStep: false }
  ]
});

test('only transfers existing workflow steps with deterministic stable priority and no mutation', () => {
  const source = workflow(['unavailable', 'attention', 'blocked', 'attention', 'attention']); const before = JSON.stringify(source);
  const first = deriveInvestmentOpportunities(source); assert.deepEqual(deriveInvestmentOpportunities(source), first); assert.equal(JSON.stringify(source), before);
  assert.deepEqual(first.map(item => [item.id, item.priority]), [['daily-data-and-quotes', 1], ['daily-risk-and-safety', 2], ['daily-rebalance', 3]]);
  assert.ok(first.every(item => item.source === 'DailyDecisionWorkflow'));
});

test('unavailable remains explicit, routes and accessible labels transfer exactly, and normal state has no opportunity', () => {
  const rows = deriveInvestmentOpportunities(workflow(['unavailable', 'completed', 'completed', 'completed', 'completed']));
  assert.equal(rows[0].status, 'unavailable'); assert.equal(rows[0].route, '/assets'); assert.equal(rows[0].ariaLabel, rows[0].actionLabel);
  assert.deepEqual(deriveInvestmentOpportunities(workflow(['completed', 'completed', 'completed', 'completed', 'completed'])), []);
});

test('homepage uses the model, reusable card, maximum of three items, and a mobile single column', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const summary = readFileSync(new URL('../src/components/InvestmentIntelligenceSummary.tsx', import.meta.url), 'utf8');
  const list = readFileSync(new URL('../src/components/InvestmentOpportunityList.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(app, /deriveInvestmentOpportunities\(dailyDecisionWorkflow\)/); assert.match(summary, /InvestmentOpportunityList/); assert.match(list, /InvestmentOpportunityCard/);
  assert.match(readFileSync(new URL('../src/lib/investmentOpportunities.ts', import.meta.url), 'utf8'), /slice\(0, 3\)/);
  assert.match(css, /@media \(max-width:700px\).*?\.investment-opportunity-grid\{grid-template-columns:1fr/s);
});
