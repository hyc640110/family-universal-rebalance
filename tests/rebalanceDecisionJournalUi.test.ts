import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import RebalanceRecommendationPage from '../src/pages/RebalanceRecommendationPage';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const view = {
  canRecommend: true, blockingReasons: [], mode: 'buy-only' as const, totalAssets: 100, liquidCash: 10, cashTargetPct: 10, cashTargetValue: 10, targetTotal: 90,
  thresholdReached: true, allocationDeviation: 5, thresholdGap: 0, allocation: { growth: { currentValue: 70, targetWeight: 70 }, defensive: { currentValue: 20, targetWeight: 20 }, cash: { currentValue: 10 } },
  rows: [], buyTotal: 0, sellTotal: 0, netCashImpact: 0, availableBuyBudget: 0, usedBuyBudget: 0, remainingBudget: 0, unresolvedGap: 0, cashShortfall: 0, notices: [], limitations: [],
};
const rule = { decisionStatus: 'no_action', recommendedAction: 'hold', severity: 'info', confidence: 'high', confidenceBasis: 'data_and_rule_completeness', reasonCodes: [], summary: '目前無需動作。', explanationItems: [], affectedAssets: [], blockingIssues: [], warnings: [], dataQualityNotes: [], financialSummary: { availableCash: 0, plannedContribution: null, plannedWithdrawal: null, debtBalance: null, cashReserve: null, leverageExposure: null }, calculatedAt: '2026-08-16' } as never;
const eligibility = { status: 'reference_only', explanations: ['僅供參考'], eligibleItems: [] } as never;
const render = (canRecommend = true) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RebalanceRecommendationPage, { view: { ...view, canRecommend }, recommendations: [], rule, eligibility, journal: [], onRecordDecision: () => {} })));

test('可產生建議時顯示紀錄決策入口與非成交提示', () => {
  const html = render();
  assert.match(html, /紀錄我的決策/);
  assert.match(html, /只代表您的決策意向，不代表已下單或成交/);
  assert.match(html, /目前建議/);
  assert.match(html, /決策紀錄/);
});

test('資料品質未通過時不顯示紀錄決策入口', () => {
  assert.doesNotMatch(render(false), /紀錄我的決策/);
});

test('提交決策只呼叫一次 journal callback，並帶出使用者選擇與備註', async () => {
  const browser = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  (globalThis as unknown as { window: typeof browser.window }).window = browser.window;
  (globalThis as unknown as { document: Document }).document = browser.window.document;
  Object.defineProperty(globalThis, 'navigator', { value: browser.window.navigator, configurable: true });
  (globalThis as unknown as { HTMLElement: typeof browser.window.HTMLElement }).HTMLElement = browser.window.HTMLElement;
  (globalThis as unknown as { Event: typeof browser.window.Event }).Event = browser.window.Event;
  (globalThis as unknown as { MouseEvent: typeof browser.window.MouseEvent }).MouseEvent = browser.window.MouseEvent;
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = await import('react-dom/client');
  const { act } = React;
  const captured: Array<{ decision: string; note: string }> = [];
  const container = browser.window.document.createElement('div');
  browser.window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(MemoryRouter, null, createElement(RebalanceRecommendationPage, { view, recommendations: [], rule, eligibility, journal: [], onRecordDecision: (decision, note) => captured.push({ decision, note }) }))); });
  const button = (label: string) => [...container.querySelectorAll('button')].find(item => item.textContent === label) as HTMLButtonElement;
  await act(async () => { button('紀錄我的決策').click(); });
  assert.match(container.textContent || '', /提交當下保存的唯讀 Recommendation Snapshot 摘要/);
  const reject = container.querySelector('input[value="reject"]') as HTMLInputElement;
  await act(async () => { reject.click(); });
  const note = container.querySelector('textarea') as HTMLTextAreaElement;
  Object.getOwnPropertyDescriptor(browser.window.HTMLTextAreaElement.prototype, 'value')!.set!.call(note, '等待下次檢視');
  await act(async () => { note.dispatchEvent(new browser.window.Event('input', { bubbles: true })); note.dispatchEvent(new browser.window.Event('change', { bubbles: true })); });
  await act(async () => { button('提交決策紀錄').click(); });
  assert.deepEqual(captured, [{ decision: 'reject', note: '等待下次檢視' }]);
  assert.equal(container.querySelector('textarea'), null, '提交後表單會關閉，避免重複提交');
  await act(async () => { root.unmount(); });
  container.remove();
});
