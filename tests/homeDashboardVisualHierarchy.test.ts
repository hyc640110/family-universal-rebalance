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

test('UR-TODO-077 Round 3: 重點標的 desktop layout gives identity (icon/name/cash) a fixed ~44% share and right-aligns the 目前配置/目標配置/偏離 metric columns (with column dividers) in the remaining space -- not a corner-pinned afterthought', () => {
  const focusedAssetCardSource = readFileSync(new URL('../src/components/HomeFocusedAssetCard.tsx', import.meta.url), 'utf8');
  assert.match(focusedAssetCardSource, /<div className="dashboard-focused-asset-header-row">/);
  assert.match(focusedAssetCardSource, /<div className="dashboard-focused-asset-body">/);
  assert.match(focusedAssetCardSource, /<div className="dashboard-metric-columns">\s*<div><span>目前配置<\/span><strong>\{pct\(data\.currentWeight\)\}<\/strong><\/div>\s*<div><span>目標配置<\/span><strong>\{pct\(data\.targetWeight\)\}<\/strong><\/div>\s*<div><span>偏離<\/span><strong className=\{data\.status === 'action-needed' \? 'warn' : 'good'\}>\{pct\(data\.deviation, true\)\}<\/strong><\/div>\s*<\/div>/);
  assert.match(styles, /\.dashboard-focused-asset-body\{display:grid;grid-template-columns:minmax\(0,1fr\) auto;align-items:center;gap:20px\}/, 'Round 5: identity claims the flexible 1fr track, metrics claim an auto (content-sized) track -- a grid track cannot be stretched into by its own content the way the old flex:1 1 auto;justify-content:space-between combo was');
  assert.match(styles, /\.dashboard-focused-asset-name-block\{min-width:0\}/);
  assert.match(styles, /\.dashboard-focused-asset-body \.dashboard-metric-columns\{gap:0;justify-self:end\}/, 'metrics group is content-sized (auto grid track) and pinned to the row end, not stretched to fill the remaining row width');
});

test('UR-TODO-077 Round 4: Desktop 重點標的 metric columns have a centered ::before divider (not a full-height border-left) using the --divider-soft token, since --border-subtle\'s .10 alpha was visually invisible against --bg-surface-2', () => {
  assert.match(styles, /\.dashboard-focused-asset-body \.dashboard-metric-columns>div\{text-align:right;position:relative\}/);
  assert.match(styles, /\.dashboard-focused-asset-body \.dashboard-metric-columns>div\+div::before\{content:'';position:absolute;left:0;top:18%;bottom:18%;width:1px;background:var\(--divider-soft\)\}/);
  assert.doesNotMatch(styles, /--divider-soft:rgba\(148,163,184,\.10\)/, 'the divider token must not reuse the too-faint --border-subtle alpha value');
});

test('UR-TODO-077 Round 5: Desktop 重點標的 metric columns are spaced by padding-left ONLY (18px, no separate flex gap on top of it) -- the earlier gap:24px (from the shared .dashboard-metric-columns base rule) stacked on top of the 20px divider gutter is what produced the reported oversized horizontal gaps between 目前配置/目標配置/偏離', () => {
  assert.match(styles, /\.dashboard-focused-asset-body \.dashboard-metric-columns>div\+div\{padding-left:18px\}/);
});

test('UR-TODO-077 Round 3: the Mobile giant-whitespace bug is fixed at its root cause (identity block flex-basis reset to auto so it sizes to real content height, not the 220px Desktop-only basis), and metrics sit directly under the identity block with only the intended flex gap', () => {
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]{0,700}\.dashboard-focused-asset-body\{display:flex;flex-direction:column;align-items:stretch;gap:14px\}\s*\.dashboard-focused-asset-name-block\{flex:0 0 auto\}/, 'Mobile must explicitly reset the identity block to flex:0 0 auto -- without this, the Desktop "flex:0 1 44%" flex-basis becomes a HEIGHT basis once flex-direction flips to column, which was exactly this round\'s reported giant Mobile whitespace bug. Round 5 also needs an explicit display:flex here since the base (non-mobile) rule became a grid.');
  assert.doesNotMatch(styles, /\.dashboard-focused-asset-metrics\{/, 'the old single-line inline-text metrics class from Round 1 must be gone, replaced by the real dashboard-metric-columns layout used on both Desktop and Mobile');
});

test('UR-TODO-077 Round 4: Mobile 重點標的 metric columns are equal thirds (flex:1 1 0) with the same centered divider reused from Desktop, restoring the visual grouping the reference image shows', () => {
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]{0,1200}\.dashboard-focused-asset-body \.dashboard-metric-columns\{width:100%;gap:0\}/);
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]{0,1300}\.dashboard-focused-asset-body \.dashboard-metric-columns>div\{min-width:0;flex:1 1 0;text-align:left\}/);
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]{0,1400}\.dashboard-focused-asset-body \.dashboard-metric-columns>div\+div\{padding-left:14px\}/, 'Mobile keeps the padding-left so the shared ::before divider (defined outside the media query, not overridden here) still renders between columns');
});

test('UR-TODO-077 Round 3: no fixed min-height/spacer exists anywhere on the focused-asset identity block or body that could reintroduce a disconnect between rendered content height and visual height', () => {
  const focusedAssetCardCss = styles.slice(styles.indexOf('.dashboard-focused-asset-card{'), styles.indexOf('.sim-chart{'));
  assert.doesNotMatch(focusedAssetCardCss, /\.dashboard-focused-asset-(body|name-block|header-row)\{[^}]*min-height:(?!0)/, 'no non-zero min-height may be set on these containers -- height must always be driven by real content');
});

test('UR-TODO-077 Round 3: Desktop dip-tracking row spans the full card width (label fixed-width, metrics column fill the remaining space via flex:1 1 auto), Mobile stacks it to a single column', () => {
  assert.match(styles, /\.dashboard-focused-asset-ladder-row\{display:flex;align-items:center;gap:24px;flex-wrap:wrap\}/);
  assert.match(styles, /\.dashboard-focused-asset-ladder-heading\{position:relative;display:flex;align-items:center;gap:6px;margin:0;flex:0 0 auto/);
  assert.match(styles, /\.dashboard-focused-asset-ladder-columns\{flex:1 1 auto;justify-content:space-between\}/);
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]*\.dashboard-focused-asset-ladder-row\{flex-direction:column;align-items:stretch;gap:10px\}/);
  const focusedAssetCardSource = readFileSync(new URL('../src/components/HomeFocusedAssetCard.tsx', import.meta.url), 'utf8');
  assert.match(focusedAssetCardSource, /<div className="dashboard-focused-asset-ladder-row">/);
});

test('UR-TODO-077 Round 5: Desktop dip-tracking has a divider between every one of its regions -- 逢低加碼自動追蹤 label vs. metrics group (anchored to the label so it draws inside the row\'s existing 24px gap, adding no extra spacing), and between each of the up-to-4 metric columns (reusing the padding-left+::before pattern)', () => {
  assert.match(styles, /\.dashboard-focused-asset-ladder-heading::after\{content:'';position:absolute;left:100%;margin-left:12px;top:18%;bottom:18%;width:1px;background:var\(--divider-soft\)\}/);
  assert.match(styles, /\.dashboard-focused-asset-ladder-columns>div\{position:relative\}/);
  assert.match(styles, /\.dashboard-focused-asset-ladder-columns>div\+div\{padding-left:20px\}/);
  assert.match(styles, /\.dashboard-focused-asset-ladder-columns>div\+div::before\{content:'';position:absolute;left:0;top:18%;bottom:18%;width:1px;background:var\(--divider-soft\)\}/);
  // Mobile: the label's right-edge divider must not float next to it once the row stacks the label
  // above the metrics -- nothing sits beside it any more once flex-direction becomes column.
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]*\.dashboard-focused-asset-ladder-heading::after\{content:none\}/);
});

test('UR-TODO-077 Round 5: Mobile dip-tracking metrics use a fixed 2-column grid (not flex-wrap) specifically so wrap points never shift with content width -- this lets :nth-child(2n) reliably mean "second column of its row" for any metric count, guaranteeing a divider never lands at the start of a wrapped row', () => {
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]*\.dashboard-focused-asset-ladder-columns\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:10px 14px;width:100%\}/);
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]*\.dashboard-focused-asset-ladder-columns>div\+div::before\{content:none\}/, 'the Desktop between-every-column divider must be explicitly cancelled on Mobile, since it would otherwise also land on the row-starting 3rd item in a 4-item grid');
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]*\.dashboard-focused-asset-ladder-columns>div:nth-child\(2n\)::before\{content:'';position:absolute;left:-7px;top:18%;bottom:18%;width:1px;background:var\(--divider-soft\)\}/);
});

test('UR-TODO-077 Round 4: Desktop typography is bumped a further step for the explicitly-requested elements (stock name, allocation/ladder metric values, 今日投資狀態 primary status word, blocking-reason text, 今日建議結論 text, summary card values) without touching the shared Assets-page asset-overview-card-value base rule', () => {
  assert.match(styles, /\.dashboard-focused-asset-name-block h2\{margin:0 0 8px;font-size:24px\}/);
  assert.match(styles, /\.dashboard-metric-columns strong\{display:block;font-size:24px/);
  assert.match(styles, /\.intelligence-heading h2\{margin:4px 0;font-size:23px\}/);
  assert.match(styles, /\.intelligence-heading p\{margin:4px 0 0;color:var\(--text-secondary\);line-height:1\.5;font-size:17px\}/);
  assert.match(styles, /\.daily-decision-conclusion h3\{margin:3px 0;color:var\(--text-primary\);font-size:18px\}/);
  assert.match(styles, /\.investment-summary-grid strong,\.investment-health-grid strong\{display:block;margin-top:6px;color:var\(--text-primary\);font-size:27px/);
  // the Assets-page shared rule (UR-TODO-076, already Production Verified) must stay untouched at 23px
  assert.match(styles, /\.asset-overview-card-value\{font-size:23px;line-height:1\.25;overflow-wrap:anywhere\}/);
  // Mobile must keep (or regain) its own smaller sizes, never silently inherit the Desktop bump
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]*\.investment-summary-grid strong,\.investment-health-grid strong\{font-size:20px\}/);
  assert.match(styles, /@media\(max-width:768px\)\{[\s\S]*\.dashboard-focused-asset-name-block h2\{font-size:22px\}/, 'the +2px Desktop stock-name bump must not silently leak onto Mobile, which had no prior override for this selector');
  assert.match(styles, /@media \(max-width:700px\)\{[\s\S]{0,400}\.intelligence-heading h2\{font-size:19px\}/);
  assert.match(styles, /@media \(max-width:700px\)\{[\s\S]{0,400}\.intelligence-heading p\{font-size:16px\}/, 'the new Desktop blocking-reason font-size must not leak onto Mobile');
  assert.match(styles, /@media \(max-width:700px\)\{[\s\S]{0,400}\.daily-decision-conclusion h3\{font-size:16px\}/, 'the new Desktop recommendation font-size must not leak onto Mobile');
});

test('UR-TODO-077 Round 4: 查看再平衡建議 CTA is a plain text link (no button/pill outline) -- reuses .dashboard-text-link color/weight only, no border/background/radius/padding box', () => {
  assert.match(styles, /\.dashboard-focused-asset-cta\{flex:0 0 auto;white-space:nowrap\}/);
  assert.doesNotMatch(styles, /\.dashboard-focused-asset-cta\{[^}]*border:/, 'the CTA must not have any border declaration left over from the earlier pill-button treatment');
});

test('UR-TODO-077 Round 4: 今日建議結論 has no full bordered rectangle -- distinguished from the card only by a subtle background shift, not an outline', () => {
  assert.match(styles, /\.daily-decision-conclusion\{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:11px;background:var\(--bg-surface\)\}/);
  assert.doesNotMatch(styles, /\.daily-decision-conclusion\{[^}]*border:1px solid/, 'no full border may remain on this block');
});

test('UR-TODO-077 Round 4: Desktop 今日投資狀態 3-region row (status | blocking-reason | recommendation) has two low-contrast gray dividers via --divider-soft, since the earlier --border-subtle divider (alpha .10) was effectively invisible against --bg-surface-2', () => {
  assert.match(styles, /@media\(min-width:1025px\)\{\.investment-intelligence-row\{grid-template-columns:1\.2fr \.9fr 1\.2fr;align-items:center;gap:20px\}\.intelligence-summary\{padding-left:16px;border-left:1px solid var\(--divider-soft\)\}\.daily-decision-conclusion\{padding-left:28px;border-left:1px solid var\(--divider-soft\)\}\}/);
});

test('UR-TODO-077 Round 4: Mobile 今日投資狀態 primary content (icon/status/blocking-reason) is left-aligned (flex-start), not centered as a stacked column group', () => {
  assert.match(styles, /@media \(max-width:700px\)\{\.investment-intelligence-card\{padding:14px\}\.intelligence-heading\{flex-direction:column;gap:7px;align-items:flex-start\}/, 'without align-items:flex-start, the column-direction flex container centers each stacked item block horizontally even though the text inside stays left-aligned, which is exactly the reported "整組置中" bug');
  assert.match(styles, /\.intelligence-status\{align-self:flex-start\}/, '高風險 badge keeps its own left-aligned placement, unaffected by the row layout change');
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
