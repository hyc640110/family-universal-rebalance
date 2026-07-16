import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveInvestmentActionExplanations } from '../src/lib/investmentActionExplainability';
import type { InvestmentActionCenterModel } from '../src/lib/investmentActionCenter';

const model = (): InvestmentActionCenterModel => ({ summary: { status: 'review-available', title: '既有結論', description: '既有摘要', completedStepCount: 3, normalCategories: [] }, primaryAction: null, actions: [{ id: 'daily-data-and-quotes', category: 'data-update', priority: 1, status: 'unavailable', title: '資料與報價', description: '資料不足', reason: '資料不足', source: 'InvestmentOpportunity', route: '/assets', actionType: 'review-data', actionLabel: '查看資產資料', ariaLabel: '查看資產資料', titleAttribute: '查看資產資料', isPrimary: true }] });

test('only transfers deterministic Action Center output with bounded evidence', () => {
  const input = model(), before = JSON.stringify(input); const first = deriveInvestmentActionExplanations(input);
  assert.deepEqual(deriveInvestmentActionExplanations(input), first); assert.equal(JSON.stringify(input), before);
  assert.equal(first[0].actionId, input.actions[0].id); assert.equal(first[0].priority, 1); assert.equal(first[0].status, 'unavailable'); assert.equal(first[0].isPrimary, true); assert.equal(first[0].evidenceItems.length, 3);
  assert.equal(first[0].route, input.actions[0].route); assert.equal(first[0].actionLabel, first[0].ariaLabel); assert.equal(first[0].ariaLabel, first[0].titleAttribute);
});

test('UI uses a local disclosure control and homepage keeps full evidence out', () => {
  const page = readFileSync(new URL('../src/pages/InvestmentActionCenterPage.tsx', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../src/components/InvestmentOpportunityList.tsx', import.meta.url), 'utf8');
  assert.match(page, /aria-expanded=\{expanded\}/); assert.match(page, /aria-controls=\{controlsId\}/); assert.match(page, /為什麼出現？/); assert.match(page, /useState/);
  assert.doesNotMatch(home, /evidenceItems|InvestmentActionExplanation/);
});
