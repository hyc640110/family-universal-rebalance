import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveInvestmentActionCenter } from '../src/lib/investmentActionCenter';
import { deriveInvestmentOpportunities } from '../src/lib/investmentOpportunities';
import type { DailyDecisionWorkflow } from '../src/lib/dailyDecisionWorkflow';

const workflow = (statuses: DailyDecisionWorkflow['steps'][number]['status'][], conclusion: DailyDecisionWorkflow['conclusion']): DailyDecisionWorkflow => {
  const steps: DailyDecisionWorkflow['steps'] = [
    { id: 'data-and-quotes', title: '資料與報價', description: '資料不足', status: statuses[0], priority: 1, route: '/assets', linkLabel: '查看資產資料', ariaLabel: '查看資產資料', isPrimaryNextStep: false },
    { id: 'risk-and-safety', title: '風險與安全', description: '槓桿提醒', status: statuses[1], priority: 2, route: '/tools/portfolio-risk', linkLabel: '查看投資組合風險', ariaLabel: '查看投資組合風險', isPrimaryNextStep: true },
    { id: 'rebalance', title: '再平衡', description: '偏離達門檻', status: statuses[2], priority: 3, route: '/tools/rebalance-recommendation', linkLabel: '查看再平衡建議', ariaLabel: '查看再平衡建議', isPrimaryNextStep: false },
    { id: 'performance', title: '績效與回撤', description: '回撤資料不足', status: statuses[3], priority: 4, route: '/analytics', linkLabel: '查看投資績效', ariaLabel: '查看投資績效', isPrimaryNextStep: false },
    { id: 'market-and-dividend', title: '市場與股息', description: '市場正常', status: statuses[4], priority: 5, route: '/market', linkLabel: '查看市場資料', ariaLabel: '查看市場資料', isPrimaryNextStep: false }
  ];
  const primaryNextStep = steps.find(step => step.isPrimaryNextStep) ?? null;
  return { conclusion, steps, primaryNextStep };
};

test('only transfers existing workflow and opportunity output with a stable full priority order', () => {
  const source = workflow(['unavailable', 'attention', 'blocked', 'attention', 'completed'], { status: 'action-required', title: '今日有項目需要查看', description: '既有原因' });
  const opportunities = deriveInvestmentOpportunities(source); const before = JSON.stringify(source);
  const first = deriveInvestmentActionCenter(source, opportunities); const second = deriveInvestmentActionCenter(source, opportunities);
  assert.deepEqual(second, first); assert.equal(JSON.stringify(source), before);
  assert.deepEqual(first.actions.map(action => [action.id, action.priority]), [['daily-data-and-quotes', 1], ['daily-risk-and-safety', 2], ['daily-rebalance', 3], ['daily-performance', 4]]);
  assert.deepEqual(first.actions.slice(0, 3).map(action => action.id), opportunities.map(opportunity => opportunity.id));
  assert.equal(first.actions[3].source, 'DailyDecisionWorkflow');
});

test('keeps unavailable explicit, completed items out, and exactly one existing primary action', () => {
  const source = workflow(['completed', 'attention', 'completed', 'completed', 'completed'], { status: 'review-available', title: '今日有項目需要查看', description: '既有原因' });
  const model = deriveInvestmentActionCenter(source, deriveInvestmentOpportunities(source));
  assert.deepEqual(model.actions.map(action => action.id), ['daily-risk-and-safety']);
  assert.equal(model.primaryAction?.id, 'daily-risk-and-safety'); assert.equal(model.actions.filter(action => action.isPrimary).length, 1);
  assert.equal(model.actions[0].route, '/tools/portfolio-risk'); assert.equal(model.actions[0].actionLabel, model.actions[0].ariaLabel); assert.equal(model.actions[0].ariaLabel, model.actions[0].titleAttribute);
  const unavailable = workflow(['unavailable', 'completed', 'completed', 'completed', 'completed'], { status: 'insufficient-data', title: '資料不足，暫時不能形成判斷', description: '既有原因' });
  assert.equal(deriveInvestmentActionCenter(unavailable, deriveInvestmentOpportunities(unavailable)).actions[0].status, 'unavailable');
});

test('normal workflow stays empty and homepage plus action center share the centralized action route', () => {
  const normal = workflow(['completed', 'completed', 'completed', 'completed', 'completed'], { status: 'no-action', title: '今日無需進行投資操作', description: '既有原因' });
  const model = deriveInvestmentActionCenter(normal, deriveInvestmentOpportunities(normal));
  assert.deepEqual(model.actions, []); assert.equal(model.primaryAction, null); assert.equal(model.summary.title, '今日無需進行投資操作');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const homepage = readFileSync(new URL('../src/components/InvestmentOpportunityList.tsx', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/pages/InvestmentActionCenterPage.tsx', import.meta.url), 'utf8');
  const modelSource = readFileSync(new URL('../src/lib/investmentActionCenter.ts', import.meta.url), 'utf8');
  assert.match(app, /deriveInvestmentActionCenter\(dailyDecisionWorkflow, investmentOpportunities\)/); assert.match(homepage, /INVESTMENT_DECISION_ROUTES\.investmentActionCenter/);
  assert.match(page, /ToolQuickNavigation current="investment-action-center"/); assert.match(modelSource, /does not calculate/); assert.doesNotMatch(modelSource, /localStorage|fetch\(/);
});
