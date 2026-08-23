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

// --- UR-TODO-076 Round 5 color-science helpers (sRGB <-> OKLCH, WCAG contrast) -----------------
// Round 4's mistake was measuring "vividness" only in HSL, where raising both S and L together
// can (and did) LOSE perceptual chroma once L climbs toward white. OKLCH's L/C separate lightness
// from actual perceptual saturation, so it is the only model that can catch a "brighter but more
// washed-out" regression like Round 4's. These are the same formulas used to design the Round 5
// palette (see the Round 5 comment above ALLOCATION_COLORS in App.tsx).
function hexToRgb(hex) { const n = parseInt(hex.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function rgbToOklch([r, g, b]) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(a * a + b2 * b2);
  let H = Math.atan2(b2, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}
function relLum([r, g, b]) { const srgb = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]; }
function contrast(a, b) { const l1 = relLum(hexToRgb(a)) + 0.05, l2 = relLum(hexToRgb(b)) + 0.05; return l1 > l2 ? l1 / l2 : l2 / l1; }
const BG_SURFACE_2 = '#131619';
const ROUND3_NAMED = { CASH: '#f5c451', '00631L': '#ff5c68', '0050': '#3d8bfd', '00662': '#2fd480', '00685L': '#ff9142', '00865B': '#a78bfa', '00895': '#2dd4e8' };
const ROUND4_NAMED = { CASH: '#fbd06a', '00631L': '#ff707b', '0050': '#5c9eff', '00662': '#40e793', '00685L': '#ffa05c', '00865B': '#b49bfd', '00895': '#47e3f5' };
const ROUND5_NAMED = { CASH: '#f8bd32', '00631L': '#ff4d5f', '0050': '#3388ff', '00662': '#37df88', '00685L': '#ff812b', '00865B': '#9a6cf5', '00895': '#3adff3' };

test('UR-TODO-076 Round 5: FIXED_ALLOCATION_COLORS gives every named symbol one deterministic, re-saturated accent color (single SSOT, reused by every consumer)', () => {
  assert.match(app, /const FIXED_ALLOCATION_COLORS: Record<string, string> = \{ CASH: '#f8bd32', '00631L': '#ff4d5f', '0050': '#3388ff', '00662': '#37df88', '00685L': '#ff812b', '00865B': '#9a6cf5', '00895': '#3adff3' \};/);
  assert.doesNotMatch(app, /const FIXED_ALLOCATION_COLORS2|ASSET_ALLOCATION_COLORS\b/, 'no second, Assets-only color mapping may be introduced -- allocationColor() must remain the single SSOT for every consumer (Donut/Legend/summary cards/Analytics-page AllocationDonut alike)');
});

test('UR-TODO-076 Round 5: every named symbol has HIGHER OKLCH chroma than Round 4 (the actual "more vivid" lever HSL S could not express once L was already near white)', () => {
  for (const symbol of Object.keys(ROUND4_NAMED)) {
    const before = rgbToOklch(hexToRgb(ROUND4_NAMED[symbol]));
    const after = rgbToOklch(hexToRgb(ROUND5_NAMED[symbol]));
    assert.ok(after.C > before.C, `${symbol}: Round 5 OKLCH chroma ${after.C.toFixed(3)} must exceed Round 4's ${before.C.toFixed(3)}`);
  }
});

test('UR-TODO-076 Round 5: OKLCH lightness is not universally higher than Round 4 -- Round 4\'s mistake (chasing brightness) is not repeated; every named symbol\'s lightness in fact went down', () => {
  const deltas = Object.keys(ROUND4_NAMED).map((symbol) => rgbToOklch(hexToRgb(ROUND5_NAMED[symbol])).L - rgbToOklch(hexToRgb(ROUND4_NAMED[symbol])).L);
  assert.ok(!deltas.every((d) => d > 0), 'lightness must not be universally higher than Round 4 across every named symbol');
  assert.ok(deltas.every((d) => d < 0), 'every named symbol\'s Round 5 lightness is strictly lower than its Round 4 value');
});

test('UR-TODO-076 Round 5: hue is preserved within a small tolerance vs the original Round 3 identity color for every named symbol (color & contrast refinement, not a re-branding)', () => {
  const HUE_TOLERANCE_DEG = 8;
  for (const symbol of Object.keys(ROUND3_NAMED)) {
    const original = rgbToOklch(hexToRgb(ROUND3_NAMED[symbol])).H;
    const refined = rgbToOklch(hexToRgb(ROUND5_NAMED[symbol])).H;
    const delta = Math.min(Math.abs(refined - original), 360 - Math.abs(refined - original));
    assert.ok(delta <= HUE_TOLERANCE_DEG, `${symbol}: hue drifted ${delta.toFixed(1)}° from its Round 3 identity color (limit ${HUE_TOLERANCE_DEG}°)`);
  }
});

test('UR-TODO-076 Round 5: every named symbol still clears WCAG AA (4.5:1) against --bg-surface-2 -- saturation gain never sacrifices readability', () => {
  for (const symbol of Object.keys(ROUND5_NAMED)) {
    const ratio = contrast(ROUND5_NAMED[symbol], BG_SURFACE_2);
    assert.ok(ratio >= 4.5, `${symbol}: Round 5 contrast ${ratio.toFixed(2)} must clear WCAG AA (4.5:1)`);
  }
});

test('UR-TODO-076 Round 5: Donut segment, Legend dot, and Desktop detail-table dot all resolve the same symbol to the same color, because all three are built from one deriveAllocationLegendItems() call using allocationColor()', () => {
  assert.match(overviewSection, /const items = useMemo\(\(\) => deriveAllocationLegendItems\(m\.rows, m\.cash, m\.totalAssets, allocationColor\), \[m\.rows, m\.cash, m\.totalAssets\]\);/);
  const donutPanel = app.slice(app.indexOf('function AssetAllocationDonutPanel'), app.indexOf('function AssetAllocationDetailTable'));
  assert.match(donutPanel, /stroke=\{segment\.color\}/, 'Donut segment must read .color from the shared legend item, not a second color lookup');
  assert.match(donutPanel, /style=\{\{ backgroundColor: item\.color \}\}/, 'Legend dot must read .color from the same shared legend item');
  const detailTableSection = app.slice(app.indexOf('function AssetAllocationDetailTable'), app.indexOf('function AssetAllocationOverview'));
  assert.match(detailTableSection, /style=\{\{ backgroundColor: row\.color \}\}/, 'Detail-table dot must read .color from an AllocationDetailRow, which is derived from the same legend items');
});

test('UR-TODO-076 Round 5: Desktop and Mobile share one palette -- no viewport-scoped color override exists anywhere in styles.css for the allocation section', () => {
  assert.doesNotMatch(styles, /@media[^{]*\{[^}]*\.asset-(overview-card|allocation-legend-item|allocation-detail-symbol)[^}]*color:/s, 'no media-query-scoped color override may exist for card/legend/detail-dot colors -- Desktop and Mobile must render the exact same allocationColor() output');
});

test('UR-TODO-076 Round 5: summary card icon backgrounds and main value text share the same re-saturated per-card accent, without touching the .up/.down/.hold P&L tone contract', () => {
  assert.match(styles, /\.asset-overview-card-blue \.asset-overview-card-icon\{background:rgba\(45,123,255,\.25\);color:#3686f6\}/);
  assert.match(styles, /\.asset-overview-card-blue \.asset-overview-card-value\{color:#3686f6\}/);
  assert.match(styles, /\.asset-overview-card-green \.asset-overview-card-icon\{background:rgba\(34,197,94,\.25\);color:#37de99\}/);
  assert.match(styles, /\.asset-overview-card-green \.asset-overview-card-value\{color:#37de99\}/);
  assert.match(styles, /\.asset-overview-card-red \.asset-overview-card-icon\{background:rgba\(239,68,68,\.25\);color:#f84436\}/);
  assert.match(styles, /\.asset-overview-card-red \.asset-overview-card-value\{color:#f84436\}/);
  assert.match(styles, /\.asset-overview-card-purple \.asset-overview-card-icon\{background:rgba\(168,110,235,\.25\);color:#aa65f7\}/);
  assert.match(styles, /\.asset-overview-card-purple \.asset-overview-card-value\{color:#aa65f7\}/);
  // the shared P&L tone contract (.up/.bad red, .down/.good green) must remain byte-identical
  assert.match(styles, /\.up,\.bad\{color:var\(--market-up\)\}/);
  assert.match(styles, /\.down,\.good\{color:var\(--market-down\)\}/);
});

test('UR-TODO-076 Round 5: card accent OKLCH chroma increased and lightness decreased vs Round 4, for all four cards', () => {
  const round4Cards = { blue: '#75adff', green: '#4ceba6', red: '#ff8a7a', purple: '#c298fb' };
  const round5Cards = { blue: '#3686f6', green: '#37de99', red: '#f84436', purple: '#aa65f7' };
  for (const key of Object.keys(round4Cards)) {
    const before = rgbToOklch(hexToRgb(round4Cards[key]));
    const after = rgbToOklch(hexToRgb(round5Cards[key]));
    assert.ok(after.C > before.C, `${key} card: chroma must increase (${before.C.toFixed(3)} -> ${after.C.toFixed(3)})`);
    assert.ok(after.L < before.L, `${key} card: lightness must decrease (${before.L.toFixed(3)} -> ${after.L.toFixed(3)})`);
    assert.ok(contrast(round5Cards[key], BG_SURFACE_2) >= 4.5, `${key} card: contrast must still clear WCAG AA`);
  }
});

test('UR-TODO-076 Round 5: real totalAssets/cash sparklines still color by up/down/hold tone (market colors untouched); Round 5 did not touch the neutral idle sparkline stroke, no line thickness/scale/data change', () => {
  assert.match(styles, /\.mini-sparkline\{width:100%;height:32px;color:#c3cad4\}/);
  assert.match(styles, /\.mini-sparkline\.mini-sparkline-up\{color:var\(--market-up\)\}/);
  assert.match(styles, /\.mini-sparkline\.mini-sparkline-down\{color:var\(--market-down\)\}/);
  const miniSparkline = app.slice(app.indexOf('function MiniSparkline'), app.indexOf('type AllocationTone ='));
  assert.match(miniSparkline, /strokeWidth="2"/, 'sparkline stroke width must remain unchanged this round');
});

test('UR-TODO-076 Round 5: growth/defensive/per-holding still fail closed -- color refinement did not add a fabricated sparkline anywhere', () => {
  assert.match(overviewSection, /label="成長資產"[\s\S]{0,80}change=\{null\}/);
  assert.match(overviewSection, /label="防守資產"[\s\S]{0,80}change=\{null\}/);
  const detailTableSection = app.slice(app.indexOf('function AssetAllocationDetailTable'), app.indexOf('function AssetAllocationOverview'));
  assert.match(detailTableSection, /className="asset-allocation-detail-trend">資料不足</);
});
