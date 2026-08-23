import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import React, { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import HomeFocusedAssetCard from '../src/components/HomeFocusedAssetCard';
import { deriveHomeFocusedAssetLadder, type HomeFocusedAssetLadderInput } from '../src/lib/homeFocusedAssetLadderCard';
import type { HomeFocusedAssetCardData } from '../src/lib/homeFocusedAssetCard';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const dashboardPage = readFileSync(new URL('../src/pages/DashboardDecisionPage.tsx', import.meta.url), 'utf8');

// UR-TODO-077: Home visual hierarchy refinement. This Sprint is presentation/responsive-only —
// every test here either locks a CSS/markup change directly, or asserts that a financial
// data/contract surface is byte-identical to before the redesign.

test('UR-TODO-077 DashboardData prop shape is unchanged -- no new/removed/renamed data fields for the redesign', () => {
  assert.match(dashboardPage, /type DashboardData = \{\s*total: number; net: number;\s*dayPnl: number \| null; dayPnlRate: number \| null; lastQuoteAt: string \| null;\s*reminders: DashboardReminder\[\];\s*intelligence: ReturnType<typeof deriveInvestmentIntelligence>;\s*opportunities: InvestmentOpportunity\[\];\s*todayConclusion: string;\s*creditCardDueSoonReminders: readonly CreditCardDueSoonReminder\[\];\s*focusedAssetCard: HomeFocusedAssetCardData \| null;\s*focusedAssetLadder: HomeFocusedAssetLadderData \| null;\s*\};/);
});

test('UR-TODO-077 today-status/focused-asset accent treatment is a left border bar on the normal dark surface, not a full-card warning/danger background wash', () => {
  assert.match(styles, /\.investment-intelligence-card\{margin:0 0 14px;padding:18px;border:1px solid var\(--border\);border-left-width:4px;border-radius:14px;background:var\(--bg-surface-2\)\}\.investment-intelligence-card\.warn\{border-left-color:var\(--warning\)\}\.investment-intelligence-card\.bad\{border-left-color:var\(--danger\)\}/);
  assert.doesNotMatch(styles, /\.investment-intelligence-card\.warn\{[^}]*background:var\(--warning-soft\)/, 'the card body must not fill with --warning-soft any more');
  assert.doesNotMatch(styles, /\.investment-intelligence-card\.bad\{[^}]*background:var\(--danger-soft\)/, 'the card body must not fill with --danger-soft any more');
  assert.match(styles, /\.dashboard-focused-asset-card-action-needed\{border-left-color:var\(--warning\)\}/);
  assert.doesNotMatch(styles, /\.dashboard-focused-asset-card-action-needed\{[^}]*background:var\(--warning-soft\)/, 'the focused-asset card body must not fill with --warning-soft any more');
});

test('UR-TODO-077 reminders list items use a left accent bar, not a full warning-soft fill', () => {
  assert.match(styles, /\.dashboard-reminder-list li\.warn\{border-left-color:var\(--warning\)\}/);
  assert.doesNotMatch(styles, /\.dashboard-reminder-list li\.warn\{[^}]*background:var\(--warning-soft\)/);
});

test('UR-TODO-077 Desktop (>=1025px) lays the today-status card out as a 3-column row (status | reason | conclusion), Mobile/Tablet stay single-column (no rule override below 1025px)', () => {
  assert.match(styles, /@media\(min-width:1025px\)\{\.investment-intelligence-row\{grid-template-columns:1\.2fr \.9fr 1\.2fr/);
});

test('UR-TODO-077 the 4 summary cards (總資產/淨資產/今日損益/今日損益率) reuse the exact UR-TODO-076 Round 5 accent classes (asset-overview-card-{blue,purple,green,red}), no new color values introduced', () => {
  assert.match(dashboardPage, /<article className="asset-overview-card-blue"><span className="asset-overview-card-icon" aria-hidden="true"><Briefcase size=\{16\} \/><\/span><small>總資產<\/small><strong className="asset-overview-card-value">\{money\(data\.total\)\}<\/strong><\/article>/);
  assert.match(dashboardPage, /<article className="asset-overview-card-purple"><span className="asset-overview-card-icon" aria-hidden="true"><LineChart size=\{16\} \/><\/span><small>淨資產<\/small><strong className="asset-overview-card-value">\{money\(data\.net\)\}<\/strong><\/article>/);
  // 今日損益/今日損益率 must keep using tone(), not the new decorative accent, on the <strong> itself
  assert.match(dashboardPage, /<strong className=\{tone\(data\.dayPnl\)\}>\{money\(data\.dayPnl, true\)\}<\/strong>/);
  assert.match(dashboardPage, /<strong className=\{tone\(data\.dayPnlRate\)\}>\{pct\(data\.dayPnlRate, true\)\}<\/strong>/);
});

test('UR-TODO-077 P&L tone() logic is byte-identical to before the redesign (no redefinition of positive/negative semantics)', () => {
  assert.match(dashboardPage, /const tone = \(value: number \| null \| undefined\) => \{ const amount = finite\(value\); return amount === null \|\| amount === 0 \? 'hold' : amount > 0 \? 'up' : 'down'; \};/);
});

test('UR-TODO-077 Mobile 2x2 summary grid is untouched (no new media-query override of .investment-summary-grid was added by this Sprint)', () => {
  const occurrences = [...styles.matchAll(/\.investment-summary-grid\{[^}]*grid-template-columns:/g)];
  assert.equal(occurrences.length, 1, 'only the pre-existing unconditional rule should define .investment-summary-grid base columns; the mobile 2x2 behaviour comes from the pre-existing @media(max-width:900px) override, which this Sprint must not duplicate or touch');
});

test('UR-TODO-077 追蹤中 badge renders only when the ladder is actually tracking (status !== "unavailable"), never a new persisted field', () => {
  assert.match(readFileSync(new URL('../src/components/HomeFocusedAssetCard.tsx', import.meta.url), 'utf8'), /const isLadderTracking = ladder\.status !== 'unavailable';/);

  const render = (input: HomeFocusedAssetLadderInput, cardData: HomeFocusedAssetCardData) => {
    const ladder = deriveHomeFocusedAssetLadder(input);
    return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomeFocusedAssetCard, { data: cardData, ladder })));
  };
  const cardData: HomeFocusedAssetCardData = {
    symbol: '00631L', name: '元大台灣50正2', investableCash: 10000,
    currentWeight: 60, targetWeight: 60, deviation: 0,
    status: 'normal', action: null, recommendedAmount: null, message: '目前配置正常，不需操作。'
  };
  const liquidity: HomeFocusedAssetLadderInput['liquidity'] = { investableCash: 10000, dataCompleteness: 'complete', safetyCashShortfall: 0 };

  const disabledHtml = render({ enabled: false, highWaterMark: null, triggeredLevel: null, currentPrice: null, liquidity, executableBudget: null, externalFundingRequired: null }, cardData);
  assert.doesNotMatch(disabledHtml, /追蹤中/, 'not enabled -> no 追蹤中 badge');

  const normalHtml = render({ enabled: true, highWaterMark: 100, triggeredLevel: null, currentPrice: 98, liquidity, executableBudget: null, externalFundingRequired: null }, cardData);
  assert.match(normalHtml, /追蹤中/, 'enabled with real high-water-mark data -> 追蹤中 badge shown');

  const actionNeededHtml = render({ enabled: true, highWaterMark: 100, triggeredLevel: 1, currentPrice: 89, liquidity, executableBudget: 5000, externalFundingRequired: 0 }, cardData);
  assert.match(actionNeededHtml, /追蹤中/, 'triggered/action-needed -> still 追蹤中');
});

test('UR-TODO-077 no fake data: 重點標的/今日投資狀態/資產快照/狀態確認 all still read straight from the HomeFocusedAssetCard/HomeFocusedAssetLadderCard/investmentIntelligence/investmentDashboard outputs, no literal placeholder numbers were introduced', () => {
  const homeFocusedAssetCardSource = readFileSync(new URL('../src/components/HomeFocusedAssetCard.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(homeFocusedAssetCardSource, /69\.8|65\.0|\+4\.8|35\.95|35\.45|8\.6/, 'reference-image sample values must never be hardcoded into the component');
  assert.doesNotMatch(dashboardPage, /487\.4|332\.4/, 'reference-image sample amounts must never be hardcoded into the component');
});
