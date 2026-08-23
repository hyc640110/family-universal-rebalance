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

test('UR-TODO-077 Round 2: the 4 summary cards (總資產/淨資產/今日損益/今日損益率) put icon+title on one header row (dashboard-summary-card-head), reusing the UR-TODO-076 Round 5 accent hues via dashboard-icon-circle-{blue,purple,green,red}, no new color values introduced', () => {
  assert.match(dashboardPage, /<article className="asset-overview-card-blue"><div className="dashboard-summary-card-head"><span className="dashboard-icon-circle dashboard-icon-circle-blue" aria-hidden="true"><Briefcase size=\{16\} \/><\/span><small>總資產<\/small><\/div><strong className="asset-overview-card-value">\{money\(data\.total\)\}<\/strong><\/article>/);
  assert.match(dashboardPage, /<article className="asset-overview-card-purple"><div className="dashboard-summary-card-head"><span className="dashboard-icon-circle dashboard-icon-circle-purple" aria-hidden="true"><LineChart size=\{16\} \/><\/span><small>淨資產<\/small><\/div><strong className="asset-overview-card-value">\{money\(data\.net\)\}<\/strong><\/article>/);
  // 今日損益/今日損益率 must keep using tone(), not the new decorative accent, on the <strong> itself
  assert.match(dashboardPage, /<strong className=\{tone\(data\.dayPnl\)\}>\{money\(data\.dayPnl, true\)\}<\/strong>/);
  assert.match(dashboardPage, /<strong className=\{tone\(data\.dayPnlRate\)\}>\{pct\(data\.dayPnlRate, true\)\}<\/strong>/);
  assert.equal([...dashboardPage.matchAll(/dashboard-summary-card-head/g)].length, 4, 'all 4 summary cards must use the shared icon+title header row wrapper');
});

test('UR-TODO-077 Round 2: dashboard-icon-circle glyphs are geometrically centered (flex/align-items/justify-content/50% radius), and the ".investment-summary-grid span{display:block}" specificity bug that collapsed the icon to the top-left corner is fixed with an explicit override', () => {
  assert.match(styles, /\.dashboard-icon-circle\{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;flex:0 0 auto\}/);
  assert.match(styles, /\.investment-summary-grid \.dashboard-icon-circle,\.investment-health-grid \.dashboard-icon-circle\{display:inline-flex/, 'without this override, the pre-existing ".investment-summary-grid span{display:block}" rule (class+element, higher specificity than .dashboard-icon-circle alone) silently wins and un-centers the icon');
});

test('UR-TODO-077 Round 2: 今日投資狀態 status icon is a circular badge (AlertCircle), consistent with the other Home page icon badges, not the earlier plain inline triangle', () => {
  assert.match(dashboardPage, /<span className=\{`dashboard-icon-circle dashboard-icon-circle-\$\{intelligence\.overallTone === 'bad' \? 'danger' : 'warning'\}`\} aria-hidden="true"><AlertCircle size=\{18\} \/><\/span>/);
});

test('UR-TODO-077 P&L tone() logic is byte-identical to before the redesign (no redefinition of positive/negative semantics)', () => {
  assert.match(dashboardPage, /const tone = \(value: number \| null \| undefined\) => \{ const amount = finite\(value\); return amount === null \|\| amount === 0 \? 'hold' : amount > 0 \? 'up' : 'down'; \};/);
});

test('UR-TODO-077 Mobile 2x2 summary grid is untouched (no new media-query override of .investment-summary-grid was added by this Sprint)', () => {
  const occurrences = [...styles.matchAll(/\.investment-summary-grid\{[^}]*grid-template-columns:/g)];
  assert.equal(occurrences.length, 1, 'only the pre-existing unconditional rule should define .investment-summary-grid base columns; the mobile 2x2 behaviour comes from the pre-existing @media(max-width:900px) override, which this Sprint must not duplicate or touch');
});

test('UR-TODO-077 Round 2: 重點標的 desktop layout puts identity (icon/name/cash) and the 目前配置/目標配置/偏離 metric columns in one horizontal row (dashboard-focused-asset-body, flex-direction:row), CTA pinned to the header row', () => {
  const focusedAssetCardSource = readFileSync(new URL('../src/components/HomeFocusedAssetCard.tsx', import.meta.url), 'utf8');
  assert.match(focusedAssetCardSource, /<div className="dashboard-focused-asset-header-row">/);
  assert.match(focusedAssetCardSource, /<div className="dashboard-focused-asset-body">/);
  assert.match(focusedAssetCardSource, /<div className="dashboard-metric-columns">\s*<div><span>目前配置<\/span><strong>\{pct\(data\.currentWeight\)\}<\/strong><\/div>\s*<div><span>目標配置<\/span><strong>\{pct\(data\.targetWeight\)\}<\/strong><\/div>\s*<div><span>偏離<\/span><strong className=\{data\.status === 'action-needed' \? 'warn' : 'good'\}>\{pct\(data\.deviation, true\)\}<\/strong><\/div>\s*<\/div>/);
  assert.match(styles, /\.dashboard-focused-asset-body\{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap\}/);
});

test('UR-TODO-077 Round 2: Mobile (<=768px) stacks the focused-asset body to a single column and the metric-columns row becomes a full-width evenly-spaced 3-column row, not one run-on line of inline text', () => {
  assert.match(styles, /@media\(max-width:768px\)\{\s*\.dashboard-focused-asset-body\{flex-direction:column;align-items:stretch\}\s*\.dashboard-metric-columns\{width:100%;justify-content:space-between;gap:10px\}/);
  assert.doesNotMatch(styles, /\.dashboard-focused-asset-metrics\{/, 'the old single-line inline-text metrics class from Round 1 must be gone, replaced by the real dashboard-metric-columns layout used on both Desktop and Mobile');
});

test('UR-TODO-077 Round 2: dip-tracking (逢低加碼自動追蹤) has its own icon+heading row and a dedicated horizontal metrics row (高點/現價/回撤[/下一級門檻]), utilizing full card width instead of one narrow sentence', () => {
  const focusedAssetCardSource = readFileSync(new URL('../src/components/HomeFocusedAssetCard.tsx', import.meta.url), 'utf8');
  assert.match(focusedAssetCardSource, /<p className="dashboard-focused-asset-ladder-heading"><LineChart size=\{15\} aria-hidden="true" className="dashboard-focused-asset-ladder-icon" \/>逢低加碼自動追蹤/);
  assert.match(focusedAssetCardSource, /<div className="dashboard-metric-columns dashboard-focused-asset-ladder-columns">/);
  assert.match(focusedAssetCardSource, /<div><span>目前高點<\/span><strong>\{price\(ladder\.highWaterMark\)\}<\/strong><\/div>/);
  assert.match(focusedAssetCardSource, /<div><span>現價<\/span><strong>\{price\(ladder\.currentPrice\)\}<\/strong><\/div>/);
  assert.match(focusedAssetCardSource, /<div><span>回撤<\/span><strong className=\{ladder\.status === 'action-needed' \? 'warn' : 'good'\}>\{pct\(ladder\.drawdownPct, true\)\}<\/strong><\/div>/);
  assert.match(focusedAssetCardSource, /\{ladder\.status === 'normal' && ladder\.nextLevelGapPct !== null && <div><span>下一級門檻<\/span><strong>\{pct\(ladder\.nextLevelGapPct\)\}<\/strong><\/div>\}/);
  // the full ladder.message sentence must still be preserved verbatim underneath — Desktop's
  // compact numeric column is additive, not a replacement that drops the funding-status nuance
  assert.match(focusedAssetCardSource, /: <p className="dashboard-support-line">\{ladder\.message\}<\/p>\}/);
});

test('UR-TODO-077 Round 2: CreditCardDueSoonCard is still rendered on Home -- the TARGET reference image not showing this section must never be read as a request to remove it', () => {
  assert.match(dashboardPage, /<CreditCardDueSoonCard reminders=\{data\.creditCardDueSoonReminders\} onAcknowledge=\{onAcknowledgeCreditCardReminder\} \/>/);
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
