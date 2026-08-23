import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const overviewSection = app.slice(app.indexOf('function AssetOverviewCard'), app.indexOf('function HoldingCompactCard'));

test('UR-TODO-076 the Assets-page allocation SectionCard renders AssetAllocationOverview, not the bare legacy donut', () => {
  assert.match(app, /title="資產配置" isMobile=\{isMobile\} collapsible=\{false\}[\s\S]{0,220}<AssetAllocationOverview m=\{m\} state=\{state\} netWorthHistory=\{netWorthHistory\} isMobile=\{isMobile\} \/>/);
});

test('UR-TODO-076 AllocationDonut (Analytics-page donut, out of this Sprint\'s scope) is left wired to AllocationAnalysis unchanged', () => {
  assert.match(app, /view === 'assets' \? <AllocationDonut m=\{m\} \/>/);
});

test('UR-TODO-076 Desktop/Mobile share one allocation data source: AssetAllocationOverview only reads calculateMetrics()\'s `m`, never a second totals computation', () => {
  assert.match(overviewSection, /function AssetAllocationOverview\(\{ m, state, netWorthHistory, isMobile \}/);
  assert.match(overviewSection, /deriveAllocationLegendItems\(m\.rows, m\.cash, m\.totalAssets, allocationColor\)/);
  assert.doesNotMatch(overviewSection, /const\s+totalAssets\s*=/);
});

test('UR-TODO-076 growth/defensive/cash card values are read directly from m, never recomputed', () => {
  assert.match(overviewSection, /label="總資產" value=\{money\(m\.totalAssets\)\}/);
  assert.match(overviewSection, /label="成長資產" value=\{pct\(growthWeight\)\} subValue=\{money\(m\.growth\)\}/);
  assert.match(overviewSection, /label="防守資產" value=\{pct\(m\.defensiveRatio\)\} subValue=\{money\(m\.defensive\)\}/);
  assert.match(overviewSection, /label="現金部位" value=\{pct\(m\.cashRatio\)\} subValue=\{money\(m\.cash\)\}/);
  assert.match(overviewSection, /const growthWeight = m\.totalAssets \? m\.growth \/ m\.totalAssets \* 100 : 0/);
});

test('UR-TODO-076 target allocation reuses getEffectiveTargetPercent/getCashTarget, no second target formula', () => {
  assert.match(overviewSection, /getCashTarget\(state\.holdings\)/);
  assert.match(overviewSection, /getEffectiveTargetPercent\(holding, state\.holdings\)/);
});

test('UR-TODO-076 growth/defensive summary cards and the detail table trend column fail closed (no fabricated sparkline)', () => {
  assert.match(overviewSection, /label="成長資產"[\s\S]{0,80}change=\{null\}/);
  assert.match(overviewSection, /label="防守資產"[\s\S]{0,80}change=\{null\}/);
  const detailTableSection = app.slice(app.indexOf('function AssetAllocationDetailTable'), app.indexOf('function AssetAllocationOverview'));
  assert.match(detailTableSection, /趨勢（近1個月）/);
  assert.match(detailTableSection, /className="asset-allocation-detail-trend">資料不足</);
  assert.doesNotMatch(detailTableSection, /MiniSparkline/);
});

test('UR-TODO-076 only totalAssets/cash sparklines are backed by real netWorthHistory (30d range)', () => {
  assert.match(overviewSection, /historyForRange\(netWorthHistory, '30d'\)/);
  assert.match(overviewSection, /sparklinePointsFromHistory\(recentHistory, 'totalAssets'\)/);
  assert.match(overviewSection, /sparklinePointsFromHistory\(recentHistory, 'cash'\)/);
  assert.doesNotMatch(overviewSection, /sparklinePointsFromHistory\(recentHistory, 'growth'\)/);
  assert.doesNotMatch(overviewSection, /sparklinePointsFromHistory\(recentHistory, 'defensive'\)/);
});

test('UR-TODO-076 MiniSparkline fails closed with fewer than 2 real points instead of interpolating a fake line', () => {
  const miniSparkline = app.slice(app.indexOf('function MiniSparkline'), app.indexOf('type AllocationTone ='));
  assert.match(miniSparkline, /if \(points\.length < 2\) return <p className="mini-sparkline mini-sparkline-empty">近1個月趨勢資料不足<\/p>/);
});

test('UR-TODO-076 Mobile does not render the Desktop allocation detail table (gated out of the render tree, not just CSS-hidden)', () => {
  assert.match(overviewSection, /\{!isMobile && <AssetAllocationDetailTable rows=\{detailRows\} \/>\}/);
});

test('UR-TODO-076 no Bottom Sheet / second detail page / Desktop table variant was introduced for Mobile allocation', () => {
  assert.doesNotMatch(overviewSection, /BottomSheet/);
  assert.doesNotMatch(overviewSection, /查看資產明細/);
});

test('UR-TODO-076 deviation coloring reuses the existing allocationTone/tone contract (up=red/over, down=green/under, hold=neutral)', () => {
  const detailTableSection = app.slice(app.indexOf('function AssetAllocationDetailTable'), app.indexOf('function AssetAllocationOverview'));
  assert.match(detailTableSection, /className=\{row\.deviationTone\}/);
  assert.match(styles, /\.up,\.bad\{color:var\(--market-up\)\}/);
  assert.match(styles, /\.down,\.good\{color:var\(--market-down\)\}/);
});

test('UR-TODO-076 responsive breakpoints: >=1025px two-column desktop layout, <=380px mobile card grid safety fallback', () => {
  assert.match(styles, /@media\(min-width:1025px\)\{\s*\.asset-allocation-overview\{grid-template-columns:minmax\(280px,360px\) minmax\(0,1fr\)/);
  assert.match(styles, /@media\(min-width:1025px\)[\s\S]{0,220}\.asset-overview-card-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media\(max-width:380px\)\{\s*\.asset-overview-card-grid\{grid-template-columns:1fr\}/);
});

test('UR-TODO-076 Round 2: growth/defensive fail-closed summary cards show exactly one empty-state message, not three stacked lines', () => {
  const assetOverviewCardSection = app.slice(app.indexOf('function AssetOverviewCard'), app.indexOf('/** UR-TODO-076: left-column'));
  assert.match(assetOverviewCardSection, /\{change && <span className=\{`asset-overview-card-change \$\{changeTone\}`\}>/);
  assert.doesNotMatch(assetOverviewCardSection, /近1個月資料不足/, 'the redundant per-card "近1個月資料不足" line must be removed; MiniSparkline\'s own empty state is now the single fail-closed message');
  assert.match(assetOverviewCardSection, /\{change && <span className="asset-overview-card-caption">近1個月<\/span>\}/, 'the trailing 近1個月 caption must only render alongside a real change (real sparkline), never alongside the fail-closed state');
});

test('UR-TODO-076 Round 2: legend rows are compact list rows (thin separators), not stacked mini-cards', () => {
  assert.match(styles, /\.asset-allocation-legend-item\{grid-template-columns:8px minmax\(0,1fr\) auto;min-height:auto;padding:8px 4px;background:transparent;border:0;border-radius:6px;border-bottom:1px solid var\(--border-subtle\)\}/);
});

test('UR-TODO-076 Round 2: mobile donut is scoped-shrunk to this panel only, the Analytics-page AllocationDonut mobile sizing is untouched', () => {
  assert.match(styles, /\.asset-allocation-donut-panel \.allocation-donut-wrap\{width:min\(230px,64vw\)\}/);
  assert.match(styles, /\.allocation-donut-wrap\{width:min\(275px,78vw\)\}/, 'the pre-existing general mobile donut-wrap rule (used by AllocationDonut on the Analytics page) must remain unchanged');
});

test('UR-TODO-076 mobile 2x2 card grid order is 總資產/成長資產 then 防守資產/現金部位 (matches the approved reference layout)', () => {
  const order = ['總資產', '成長資產', '防守資產', '現金部位'].map(label => overviewSection.indexOf(`label="${label}"`));
  assert.ok(order.every(index => index >= 0), 'all four card labels must exist');
  for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], `card order must be 總資產, 成長資產, 防守資產, 現金部位; got indexes ${order}`);
});

test('UR-TODO-076 legend rows show percent AND amount (not percent alone) per the approved reference layout', () => {
  const donutPanel = app.slice(app.indexOf('function AssetAllocationDonutPanel'), app.indexOf('function AssetAllocationDetailTable'));
  assert.match(donutPanel, /<strong>\{pct\(item\.percent\)\}<\/strong><small>\{money\(item\.value\)\}<\/small>/);
});

test('UR-TODO-076 detail table has no separate 目前金額 column (legend already shows amount, avoiding duplication)', () => {
  const detailTableSection = app.slice(app.indexOf('function AssetAllocationDetailTable'), app.indexOf('function AssetAllocationOverview'));
  assert.doesNotMatch(detailTableSection, /目前金額/);
});

test('UR-TODO-076 Round 4: FIXED_ALLOCATION_COLORS gives every named symbol one deterministic, further-boosted accent color (single SSOT, reused by every consumer)', () => {
  assert.match(app, /const FIXED_ALLOCATION_COLORS: Record<string, string> = \{ CASH: '#fbd06a', '00631L': '#ff707b', '0050': '#5c9eff', '00662': '#40e793', '00685L': '#ffa05c', '00865B': '#b49bfd', '00895': '#47e3f5' \};/);
  assert.doesNotMatch(app, /const FIXED_ALLOCATION_COLORS2|ASSET_ALLOCATION_COLORS\b/, 'no second, Assets-only color mapping may be introduced -- allocationColor() must remain the single SSOT for every consumer (Donut/Legend/summary cards/Analytics-page AllocationDonut alike)');
});

test('UR-TODO-076 Round 4: summary card icon backgrounds and main value text share the same further-boosted per-card accent, without touching the .up/.down/.hold P&L tone contract', () => {
  assert.match(styles, /\.asset-overview-card-blue \.asset-overview-card-icon\{background:rgba\(45,123,255,\.28\);color:#75adff\}/);
  assert.match(styles, /\.asset-overview-card-blue \.asset-overview-card-value\{color:#75adff\}/);
  assert.match(styles, /\.asset-overview-card-green \.asset-overview-card-icon\{background:rgba\(34,197,94,\.28\);color:#4ceba6\}/);
  assert.match(styles, /\.asset-overview-card-green \.asset-overview-card-value\{color:#4ceba6\}/);
  assert.match(styles, /\.asset-overview-card-red \.asset-overview-card-icon\{background:rgba\(239,68,68,\.28\);color:#ff8a7a\}/);
  assert.match(styles, /\.asset-overview-card-red \.asset-overview-card-value\{color:#ff8a7a\}/);
  assert.match(styles, /\.asset-overview-card-purple \.asset-overview-card-icon\{background:rgba\(168,110,235,\.3\);color:#c298fb\}/);
  assert.match(styles, /\.asset-overview-card-purple \.asset-overview-card-value\{color:#c298fb\}/);
  // the shared P&L tone contract (.up/.bad red, .down/.good green) must remain byte-identical
  assert.match(styles, /\.up,\.bad\{color:var\(--market-up\)\}/);
  assert.match(styles, /\.down,\.good\{color:var\(--market-down\)\}/);
});

test('UR-TODO-076 Round 4: real totalAssets/cash sparklines still color by up/down/hold tone (market colors untouched); Round 4 did not touch the neutral idle sparkline stroke', () => {
  assert.match(styles, /\.mini-sparkline\{width:100%;height:32px;color:#c3cad4\}/);
  assert.match(styles, /\.mini-sparkline\.mini-sparkline-up\{color:var\(--market-up\)\}/);
  assert.match(styles, /\.mini-sparkline\.mini-sparkline-down\{color:var\(--market-down\)\}/);
});

test('UR-TODO-076 Round 4: growth/defensive/per-holding still fail closed -- color refinement did not add a fabricated sparkline anywhere', () => {
  assert.match(overviewSection, /label="成長資產"[\s\S]{0,80}change=\{null\}/);
  assert.match(overviewSection, /label="防守資產"[\s\S]{0,80}change=\{null\}/);
  const detailTableSection = app.slice(app.indexOf('function AssetAllocationDetailTable'), app.indexOf('function AssetAllocationOverview'));
  assert.match(detailTableSection, /className="asset-allocation-detail-trend">資料不足</);
});

test('UR-TODO-076 Round 4: every named symbol color has a higher WCAG contrast ratio against --bg-surface-2 than its Round 3 predecessor (accent boost never regresses readability)', () => {
  const hexToRgb = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const relLum = (rgb) => { const srgb = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]; };
  const contrast = (a, b) => { const l1 = relLum(hexToRgb(a)) + 0.05, l2 = relLum(hexToRgb(b)) + 0.05; return l1 > l2 ? l1 / l2 : l2 / l1; };
  const bgSurface2 = '#131619';
  const round3 = { CASH: '#f5c451', '00631L': '#ff5c68', '0050': '#3d8bfd', '00662': '#2fd480', '00685L': '#ff9142', '00865B': '#a78bfa', '00895': '#2dd4e8' };
  const round4 = { CASH: '#fbd06a', '00631L': '#ff707b', '0050': '#5c9eff', '00662': '#40e793', '00685L': '#ffa05c', '00865B': '#b49bfd', '00895': '#47e3f5' };
  for (const symbol of Object.keys(round3)) {
    const before = contrast(round3[symbol], bgSurface2);
    const after = contrast(round4[symbol], bgSurface2);
    assert.ok(after > before, `${symbol}: Round 4 contrast ${after.toFixed(2)} must exceed Round 3 contrast ${before.toFixed(2)}`);
    assert.ok(after >= 4.5, `${symbol}: Round 4 contrast ${after.toFixed(2)} must still clear WCAG AA (4.5:1)`);
  }
});
