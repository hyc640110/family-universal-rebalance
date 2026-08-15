import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { deriveInvestmentIntelligence, type InvestmentIntelligenceInput } from '../src/lib/investmentIntelligence';
import type { DashboardReminder } from '../src/lib/investmentDashboard';

/**
 * UR homepage slimdown: "投資健康度" (dashboard-health-card) is removed entirely — its content
 * (overallLabel/allocationDeviation/thresholdReached) already has full-detail entry points at
 * /tools/risk-center and /tools/portfolio-risk, so it is safe to drop from the home page with zero
 * information loss. "狀態確認" (dashboard-reminders-card) now mirrors CreditCardDueSoonCard.tsx's
 * existing "no items -> render nothing" convention instead of the old "container always renders,
 * empty-state text when clean" pattern — the whole section (last-quote-time line, reminder list,
 * and the investment-opportunities link) disappears together, not just the reminder list.
 */

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
(globalThis as unknown as { window: typeof window }).window = window;
(globalThis as unknown as { document: Document }).document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
(globalThis as unknown as { HTMLElement: typeof window.HTMLElement }).HTMLElement = window.HTMLElement;
(globalThis as unknown as { Event: typeof window.Event }).Event = window.Event;

const React = await import('react');
const { act } = React;
(globalThis as unknown as { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router-dom');
const { default: DashboardDecisionPage } = await import('../src/pages/DashboardDecisionPage');
const { createElement } = React;

const intelligenceInput: InvestmentIntelligenceInput = {
  dashboard: { dayPnl: 500, dayPnlRate: 1, quoteStatus: '報價正常', holdingsCount: 2 },
  risk: { overallLevel: 0, overallLabel: '低風險', primaryRisk: { title: '維持監測', status: '正常', reason: '核心風險在門檻內。' } },
  portfolioRisk: { quality: { items: [] }, allocation: { deviation: 1, threshold: 5, thresholdReached: false }, concentration: { largestPct: 30 }, drawdown: { canCalculate: true, maxDrawdown: -0.05 } },
  rebalance: { canRecommend: true, blockingReasons: [], thresholdReached: false, allocationDeviation: 1 },
  market: { freshness: 'today', availableCount: 3 },
  performance: { canCalculateMaxDrawdown: true, snapshotCount: 3, maxDrawdown: -0.05 },
  dividend: { yearAmount: 0, yearCount: 0 }, ai: { attention: [] }
};

const baseData = (reminders: DashboardReminder[]) => ({
  total: 1_000_000, net: 900_000, dayPnl: 5000, dayPnlRate: 0.5, lastQuoteAt: '2026-08-15T09:00:00.000Z',
  reminders,
  intelligence: deriveInvestmentIntelligence(intelligenceInput),
  opportunities: [],
  todayConclusion: '目前配置正常，不需操作。',
  creditCardDueSoonReminders: [],
  focusedAssetCard: null,
  focusedAssetLadder: null
});

async function renderDashboard(reminders: DashboardReminder[]) {
  const container = window.document.createElement('div');
  window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(MemoryRouter, {}, createElement(DashboardDecisionPage, {
      data: baseData(reminders), onAcknowledgeCreditCardReminder: () => {}
    })));
  });
  const cleanup = async () => { await act(async () => { root.unmount(); }); container.remove(); };
  return { container, cleanup };
}

test('dashboard-health-card is never rendered, regardless of reminders state', async () => {
  for (const reminders of [[], [{ key: 'quotes', title: '股價資料需要確認', detail: '部分標的非今日報價', tone: 'warn' as const }]]) {
    const { container, cleanup } = await renderDashboard(reminders);
    assert.equal(container.querySelector('.dashboard-health-card'), null);
    assert.doesNotMatch(container.innerHTML, /投資健康度/);
    await cleanup();
  }
});

test('狀態確認 renders the full section — last-quote-time line, reminder list, and opportunities link — when there is an actual reminder', async () => {
  const reminders: DashboardReminder[] = [{ key: 'rebalance', title: '配置已偏離目標', detail: '偏離已達既有再平衡門檻 5.0%。', tone: 'warn' }];
  const { container, cleanup } = await renderDashboard(reminders);
  const section = container.querySelector('.dashboard-reminders-card');
  assert.ok(section, 'dashboard-reminders-card should render when reminders is non-empty');
  assert.match(section!.innerHTML, /最後股價更新/);
  assert.match(section!.innerHTML, /配置已偏離目標/);
  assert.match(section!.innerHTML, /偏離已達既有再平衡門檻 5\.0%/);
  assert.ok(section!.querySelector('a[href*="investment-action-center"]'), 'opportunities link should be present alongside the reminder list');
  await cleanup();
});

test('狀態確認 is entirely absent from the DOM when there is nothing to confirm', async () => {
  const { container, cleanup } = await renderDashboard([]);
  assert.equal(container.querySelector('.dashboard-reminders-card'), null);
  // The whole section disappears together — not just the reminder list, so the last-quote-time
  // line and the investment-opportunities link must not survive as orphaned markup either.
  assert.doesNotMatch(container.innerHTML, /最後股價更新/);
  assert.doesNotMatch(container.innerHTML, /投資機會/);
  await cleanup();
});

test('the other existing homepage sections are unaffected: today intelligence, today summary always render; focused-asset and credit-card cards still render nothing when empty', async () => {
  const { container, cleanup } = await renderDashboard([]);
  assert.ok(container.querySelector('.investment-intelligence-card'), '今日投資狀態 card should still always render');
  assert.ok(container.querySelector('.investment-summary-card'), '今日投資摘要 card should still always render');
  assert.equal(container.querySelector('.dashboard-focused-asset-card'), null, 'focused-asset card stays render-nothing when data is null (unaffected by this change)');
  assert.equal(container.querySelector('.dashboard-credit-card-due-card'), null, 'credit-card reminder card stays render-nothing when empty (unaffected by this change)');
  await cleanup();
});

test('source no longer defines a DashboardData.riskLabel/allocationDeviation/rebalanceThreshold/thresholdReached prop (dead code removed alongside the health card)', () => {
  const page = readFileSync(new URL('../src/pages/DashboardDecisionPage.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /riskLabel/);
  assert.doesNotMatch(page, /allocationDeviation/);
  assert.doesNotMatch(page, /rebalanceThreshold/);
  assert.doesNotMatch(page, /thresholdReached/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /riskLabel: riskMetrics\.overallLabel/);
});
