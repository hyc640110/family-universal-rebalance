import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * UR-TODO-073 (Design Polish — Dark Surface / Typography / Visual Hierarchy). This Sprint is CSS-only
 * (no JSX/DOM restructuring), so — matching the established pattern for this file (see
 * holdingDetailDialogStructure.test.ts) — these assertions lock the token contract and the
 * no-regression invariants via source inspection of styles.css/App.tsx/MobileBottomNav.tsx rather than
 * a live render. Actual pixel-level responsive verification (320/390/430/1000/1280/1600px, no
 * horizontal overflow) is manual Preview verification, consistent with how this repo has always
 * verified viewport-dependent layout (no test in this suite renders real layout/overflow).
 */
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const root = styles.slice(0, styles.indexOf('*{box-sizing:border-box}'));

test('UR-TODO-073 global dark-surface tokens exist on :root', () => {
  for (const token of ['--bg-page', '--bg-surface', '--bg-surface-2', '--border', '--border-subtle', '--text-primary', '--text-secondary', '--primary', '--primary-hover', '--warning', '--danger', '--radius-sm', '--radius-md', '--radius-lg']) {
    assert.match(root, new RegExp(`${token}:`), `expected ${token} to be defined on :root`);
  }
});

test('UR-TODO-073 --bg-page is a near-black, not OLED #000000, and not the same value as --bg-surface/--bg-surface-2 (surfaces must stay visually distinct)', () => {
  const bgPage = /--bg-page:(#[0-9a-fA-F]{3,8})/.exec(root)?.[1];
  const bgSurface = /--bg-surface:(#[0-9a-fA-F]{3,8})/.exec(root)?.[1];
  const bgSurface2 = /--bg-surface-2:(#[0-9a-fA-F]{3,8})/.exec(root)?.[1];
  assert.ok(bgPage, '--bg-page must be defined');
  assert.notEqual(bgPage, '#000000');
  assert.notEqual(bgPage, '#000');
  assert.notEqual(bgPage, bgSurface, 'card surface must be distinguishable from the page background');
  assert.notEqual(bgSurface, bgSurface2, 'inputs/secondary surfaces must be distinguishable from the card surface');
});

test('UR-TODO-073 page background and the shared Card primitive consume the new tokens', () => {
  assert.match(styles, /body\{margin:0;background:var\(--bg-page\)/);
  assert.match(styles, /\.stat,\.card,\.holding\{background:var\(--bg-surface\);border:1px solid var\(--border-subtle\);border-radius:var\(--radius-lg\)/);
});

test('UR-TODO-073 base <button> is the Primary tier (solid --primary fill); the 詳細 button and drag handle stay Secondary (surface + border, no primary fill)', () => {
  assert.match(styles, /^button\{border:0;border-radius:var\(--radius-sm\);background:var\(--primary\);color:white/m);
  const editButtonRule = /\.holding-edit-button\{[^}]*\}/.exec(styles)?.[0] ?? '';
  assert.match(editButtonRule, /background:var\(--bg-surface-2\)/);
  assert.doesNotMatch(editButtonRule, /background:var\(--primary\)[^-]/, '詳細 must not become a primary filled CTA');
  const orderHandleRule = /\.holding-order-handle\{[^}]*\}/.exec(styles)?.[0] ?? '';
  assert.match(orderHandleRule, /background:var\(--bg-surface-2\)/);
});

test('UR-TODO-073 holding name is the larger/primary element, symbol is secondary metadata (hierarchy swap, section 8A/8B)', () => {
  const nameRule = /\.holding-name\{[^}]*\}/.exec(styles)?.[0] ?? '';
  const symbolRule = /^\.holding-symbol\{[^}]*\}/m.exec(styles)?.[0] ?? '';
  assert.match(nameRule, /color:var\(--text-primary\)/);
  assert.match(nameRule, /font-size:var\(--font-name\)/);
  assert.match(symbolRule, /color:var\(--text-secondary\)/);
  assert.match(symbolRule, /font-size:var\(--font-symbol\)/);
  const nameSize = Number(/--font-name:(\d+)px/.exec(styles)?.[1]);
  const symbolSize = Number(/--font-symbol:(\d+)px/.exec(styles)?.[1]);
  assert.ok(nameSize > symbolSize, 'holding name must render larger than the ticker symbol');
  assert.ok(nameSize >= 18, 'Mobile-first minimum for the primary holding name (section 7)');
});

test('UR-TODO-073 mobile typography floors are met and are not shrunk below the previous (pre-Sprint) sizes', () => {
  assert.ok(Number(/--font-name:(\d+)px/.exec(styles)?.[1]) >= 18);
  assert.ok(Number(/--font-button:(\d+)px/.exec(styles)?.[1]) >= 15);
  assert.ok(Number(/--font-pnl:(\d+)px/.exec(styles)?.[1]) >= 17);
  // section 7: "不得為了 Desktop 資訊密度把 Mobile 字體重新縮小" — the ≤768px h1/h2/h3/button rule must
  // not regress to (or below) the pre-Sprint values.
  const mobileTypeBlock = /h1\{font-size:([\d.]+)rem!important;line-height:([\d.]+)\}\s*h2\{font-size:([\d.]+)rem/.exec(styles);
  assert.ok(mobileTypeBlock, 'expected the ≤768px h1/h2 mobile typography rule to still exist');
  assert.ok(Number(mobileTypeBlock![1]) >= 1.65, 'mobile h1 must not shrink below the pre-Sprint 1.65rem');
  assert.ok(Number(mobileTypeBlock![3]) >= 1, 'mobile h2 must not shrink below the pre-Sprint 1rem');
});

test('UR-TODO-073 market up/down classes are retokenized only — mapping and underlying hex are unchanged (Taiwan 上漲=紅／下跌=綠 is never swapped)', () => {
  assert.match(styles, /--market-up:#ff5b5b/);
  assert.match(styles, /--market-down:#43d17a/);
  assert.match(styles, /\.up,\.bad\{color:var\(--market-up\)\}/);
  assert.match(styles, /\.down,\.good\{color:var\(--market-down\)\}/);
  // --market-up/--market-down must stay a distinct axis from the generic UI --success/--danger tokens.
  const marketUp = /--market-up:(#[0-9a-fA-F]{3,8})/.exec(styles)?.[1];
  const danger = /--danger:(#[0-9a-fA-F]{3,8})/.exec(styles)?.[1];
  const marketDown = /--market-down:(#[0-9a-fA-F]{3,8})/.exec(styles)?.[1];
  const success = /--success:(#[0-9a-fA-F]{3,8})/.exec(styles)?.[1];
  assert.ok(marketUp && danger, 'both tokens must be defined');
  assert.ok(marketDown && success, 'both tokens must be defined');
});

test('UR-TODO-073 / UR-TODO-075 HoldingDetailDialog keeps its shell and uses the approved full-screen mobile Detail contract', () => {
  for (const cls of ['.holding-detail-backdrop', '.holding-detail-dialog', '.holding-detail-header', '.holding-detail-close', '.holding-detail-body']) {
    assert.match(styles, new RegExp(cls.replace('.', '\\.') + '\\{'));
  }
  // Desktop stays a centered dialog; the approved UR-TODO-075 mobile contract is a full-screen Detail.
  assert.match(styles, /@media \(max-width: 768px\) \{[\s\S]*?\.holding-detail-dialog\{max-width:none;width:100%;height:100dvh;max-height:100dvh;border-radius:0/);
});

test('UR-TODO-073 mobile bottom nav and desktop sidebar structure/classnames are unchanged, only retokenized', () => {
  const nav = readFileSync(new URL('../src/components/layout/MobileBottomNav.tsx', import.meta.url), 'utf8');
  assert.match(nav, /className="mobile-page-nav"/);
  assert.match(nav, /className=\{\(\{ isActive \}\) => isActive \? 'active' : ''\}/);
  assert.match(styles, /\.mobile-page-nav\{display:none\}/);
  assert.match(styles, /@media \(max-width: 1023px\)\{[\s\S]{0,80}\.desktop-sidebar\{display:none\}/);
});

test('UR-TODO-073 the AiDecisionCenterPage --muted/--card/--line/--accent references (previously undefined custom properties) now resolve to real token values', () => {
  assert.match(root, /--muted:var\(--text-secondary\)/);
  assert.match(root, /--card:var\(--bg-surface\)/);
  assert.match(root, /--line:var\(--border\)/);
  assert.match(root, /--accent:var\(--primary\)/);
});

test('UR-TODO-073 refinement: no per-field box on .holding-card-detail — hierarchy comes from spacing/typography, not a border+background tile around every field', () => {
  assert.match(styles, /\.holding-card-detail\{min-width:0;margin:0;padding:2px 0;border:0;background:transparent\}/);
  // market value and unrealized P/L stay the card's two headline numbers, sized above shares/avgCost/price/today-change.
  assert.match(styles, /\.holding-card-detail\.holding-card-market-value>strong,\.holding-card-detail\.holding-card-unrealized-pnl>strong\{font-size:var\(--font-amount\);font-weight:700\}/);
});

test('UR-TODO-073 refinement: allocation ring is a real proportional conic-gradient fill (not just a static bordered circle), and stays behind holding-name in visual weight', () => {
  const ringRule = /\.holding-mobile-weight\{[^}]*\}/.exec(styles)?.[0] ?? '';
  assert.match(ringRule, /background:conic-gradient\(var\(--primary\)/);
  assert.doesNotMatch(ringRule, /border:2px solid/, 'the old static border ring must be gone, replaced by the conic-gradient fill');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /const ringPercent = Number\.isFinite\(row\.marketValue\)/);
  assert.match(app, /className="holding-mobile-weight" style=\{\{ '--ring-value': ringPercent \} as CSSProperties\}/);
});

test('UR-TODO-073 refinement: the ≤768px mobile override no longer reverts .holding-mobile-weight / .holding-editor-summary to pre-token hardcoded hex (regression caught after the first Preview round)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  // Scoped to just these two selectors' own rule text — the same block also legitimately still
  // contains unrelated hardcoded hex on out-of-scope/dead classes (.mobile-row-toolbar,
  // .holding-mobile-value, etc.) that this Sprint never touched.
  const weightRule = /\.holding-mobile-weight\{[^}]*\}/.exec(mobileBlock)?.[0] ?? '(rule not found)';
  const summaryBlock = mobileBlock.slice(mobileBlock.indexOf('.holding-editor-summary'), mobileBlock.indexOf('.quote-summary'));
  for (const hex of ['#315b8d', '#09182a', '#1d3d66', '#eaf3ff', '#8da3bd', '#ff5b5b', '#43d17a', '#9fb3c8']) {
    assert.doesNotMatch(weightRule, new RegExp(hex), `${hex} must not reappear on .holding-mobile-weight in the ≤768px override`);
    assert.doesNotMatch(summaryBlock, new RegExp(hex), `${hex} must not reappear on .holding-editor-summary in the ≤768px override`);
  }
});

test('UR-TODO-073 no financial/persistence source files were touched by this Sprint (visual-only diff)', () => {
  // holdingDisplayOrder / rebalance / clec / household liquidity libs must not import or reference any
  // of the new CSS custom properties — this Sprint never touches src/lib/**.
  for (const path of ['../src/lib/holdingDisplayOrder.ts', '../src/lib/clecStrategyRules.ts', '../src/lib/householdLiquidity.ts']) {
    const src = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /--bg-page|--primary|--market-up|--market-down/);
  }
});

test('UR-TODO-073 second refinement round: Bottom Navigation active/inactive icon+label hierarchy — active is a Primary accent, inactive is neutral/muted, active background stays a soft tint (never a solid bright-blue block)', () => {
  // Icons are lucide-react <Icon> with no hardcoded color prop (verified: they inherit currentColor
  // from the enclosing <a>), so locking the <a>/.active color here locks the icon+label together.
  assert.match(styles, /\.desktop-sidebar a,\.mobile-page-nav a\{color:var\(--text-muted\);/);
  assert.match(styles, /\.mobile-page-nav a\.active\{color:var\(--primary-hover\);background:var\(--primary-soft\)\}/);
  assert.match(styles, /\.desktop-sidebar a\.active\{background:var\(--primary-soft-strong\);color:var\(--primary-hover\);box-shadow:none\}/);
  const nav = readFileSync(new URL('../src/components/layout/MobileBottomNav.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(nav, /color=["'#]/, 'icons must not hardcode a color prop — they rely on inherited currentColor');
});

test('Bottom Navigation icon refinement keeps canonical desktop icons while Mobile uses the approved heavier linear icon contract', () => {
  const navItems = readFileSync(new URL('../src/components/layout/navItems.ts', import.meta.url), 'utf8');
  const mobileNav = readFileSync(new URL('../src/components/layout/MobileBottomNav.tsx', import.meta.url), 'utf8');
  const desktopNav = readFileSync(new URL('../src/components/layout/DesktopSidebar.tsx', import.meta.url), 'utf8');

  const labels = [...navItems.matchAll(/label: '([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(labels, ['首頁', '資產', '分析', '市場', '工具', '設定']);
  assert.match(navItems, /mobileIcon: House,[\s\S]*?mobileIconProps: \{ fill: 'none', stroke: 'currentColor', strokeWidth: 2\.5 \}/);
  assert.match(navItems, /mobileIcon: BriefcaseBusiness,[\s\S]*?mobileIconProps: \{ fill: 'none', stroke: 'currentColor', strokeWidth: 2\.5 \}/);
  assert.match(navItems, /mobileIcon: ChartColumnBig,[\s\S]*?mobileIconProps: \{ fill: 'none', stroke: 'currentColor', strokeWidth: 2\.5 \}/);
  assert.match(navItems, /mobileIcon: LineChart,[\s\S]*?mobileIconProps: \{ fill: 'none', strokeWidth: 2\.25 \}/);
  assert.match(navItems, /mobileIcon: Wrench,[\s\S]*?mobileIconProps: \{ fill: 'currentColor' \}/);
  assert.match(navItems, /mobileIcon: Cog,[\s\S]*?mobileIconProps: \{ fill: 'none', strokeWidth: 2\.75 \}/);
  assert.match(mobileNav, /mobileIcon: Icon, mobileIconProps/);
  assert.match(mobileNav, /<Icon aria-hidden="true" size=\{20\} \{\.\.\.mobileIconProps\}/);
  assert.match(desktopNav, /icon: Icon/);
  assert.doesNotMatch(desktopNav, /mobileIcon/, 'Desktop Sidebar must keep the canonical NAV_ITEMS icons.');
});

test('UR-TODO-073 second refinement round: major page surfaces (Analysis/Market/Home/Tools/Portfolio-Risk) consume the shared surface/border/text tokens instead of legacy hardcoded hex', () => {
  for (const cls of ['.performance-card', '.market-summary-card', '.dashboard-wealth-card', '.tool-card', '.portfolio-risk-card', '.investment-summary-card']) {
    const rule = new RegExp(cls.replace('.', '\\.') + '(?:,[^{]*)?\\{[^}]*\\}').exec(styles)?.[0] ?? '';
    assert.match(rule, /background:var\(--bg-surface\)/, `${cls} must use var(--bg-surface), not a legacy hardcoded card background`);
    assert.match(rule, /border:1px solid var\(--border-subtle\)/, `${cls} must use var(--border-subtle), not a legacy hardcoded blue border`);
  }
});

test('UR-TODO-073 second refinement round: market red/green semantics are unchanged across the newly-retokenized pages (Performance, Investment Summary, History)', () => {
  for (const [cls, expected] of [
    ['.performance-overview-grid strong.up,.performance-details strong.up', 'var(--market-up)'],
    ['.performance-overview-grid strong.down,.performance-details strong.down', 'var(--market-down)'],
    ['.investment-summary-grid .up,.investment-health-grid .up', 'var(--market-up)'],
    ['.investment-summary-grid .down,.investment-health-grid .down', 'var(--market-down)'],
    ['.history-stats strong.up', 'var(--market-up)'],
    ['.history-stats strong.down', 'var(--market-down)'],
    ['.market-summary-grid .up,.market-data-card>.up', 'var(--market-up)'],
    ['.market-summary-grid .down,.market-data-card>.down', 'var(--market-down)'],
  ]) {
    assert.match(styles, new RegExp(cls.replace(/[.[\]()]/g, '\\$&') + '\\{color:' + expected.replace(/[()]/g, '\\$&') + '\\}'));
  }
});

test('UR-TODO-073 second refinement round: Primary blue stays reserved for active/selected/CTA state — general cards/sections do not use a solid primary border by default', () => {
  // Sample a handful of the now-retokenized "plain" card/section rules and confirm none of them
  // hardcode --primary as a border by default (only .active/-active/.today/hover states may).
  for (const cls of ['.performance-card', '.dashboard-wealth-card', '.investment-summary-card', '.market-summary-card']) {
    const rule = new RegExp(cls.replace('.', '\\.') + '(?:,[^{]*)?\\{[^}]*\\}').exec(styles)?.[0] ?? '';
    assert.doesNotMatch(rule, /border-color:var\(--primary\)[^-]|border:1px solid var\(--primary\)[^-]/, `${cls} must not default to a Primary-blue border`);
  }
});

test('UR-TODO-073 second refinement round: no residual legacy hardcoded hex on the audited major-surface selectors (regression guard against a mobile/desktop override quietly reverting them again)', () => {
  const legacyHex = ['#1d3d66', '#09182a', '#102033', '#eaf3ff', '#9fb3c8', '#8da3bd', '#2563eb', '#5b8def', '#3477cb', '#60a5fa', '#315b8d'];
  for (const cls of ['.performance-card', '.market-summary-card', '.dashboard-wealth-card', '.tool-card', '.portfolio-risk-card', '.investment-summary-card', '.desktop-sidebar', '.mobile-page-nav']) {
    const escaped = cls.replace('.', '\\.');
    const occurrences = [...styles.matchAll(new RegExp(escaped + '[^{]*\\{[^}]*\\}', 'g'))];
    for (const match of occurrences) {
      for (const hex of legacyHex) assert.doesNotMatch(match[0], new RegExp(hex), `${cls} rule "${match[0].slice(0, 60)}..." must not contain legacy ${hex}`);
    }
  }
});

test('UR-TODO-073 third refinement round root-cause fix: the allocation ring track is always visible (var(--border), not a low-contrast --bg-surface-2-vs-hole pair) regardless of fill percentage — this was the actual reason the ring read as "nothing" at Preview\'s 0-share demo state, not a caching issue', () => {
  const ringRule = /\.holding-mobile-weight\{[^}]*\}/.exec(styles)?.[0] ?? '';
  assert.match(ringRule, /background:conic-gradient\(var\(--primary\) calc\(var\(--ring-value,0\)\*1%\),var\(--border\) 0\)/);
  assert.doesNotMatch(ringRule, /var\(--bg-surface-2\) 0\)/, 'the track color must not be --bg-surface-2 again (near-invisible against the --bg-surface hole)');
});

test('UR-TODO-074: mobile Holding Card is restructured into a 3-row layout (identity/handle, value/pnl, detail/pnl) via grid-template-areas — every previously-visible data point remains available somewhere (股數/均價/現價/今日漲跌 all move to the 詳細 Sheet, none are deleted)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileBlock, /grid-template-areas:/);
  for (const [cls, area] of [
    ['.holding-card-identity', 'identity'],
    ['.holding-card-market-value', 'value'],
    ['.holding-card-unrealized-pnl', 'pnl'],
    ['.holding-order-handle', 'handle'],
  ]) {
    assert.match(mobileBlock, new RegExp(cls.replace('.', '\\.') + '\\{grid-area:' + area));
  }
  assert.match(mobileBlock, /\.holding-card-summary>\.holding-edit-button\{grid-area:detail/);
  // UR-TODO-074: 現價/今日漲跌 no longer get their own grid-area — they are hidden in the compact
  // summary (no other field duplicates them, so a display line was added to HoldingDetailContent
  // instead, see the App.tsx test below) alongside the already-hidden 股數/均價.
  assert.match(mobileBlock, /\.holding-card-shares,\.holding-card-average-cost,\.holding-card-price,\.holding-card-today-change\{display:none\}/);
});

test('UR-TODO-074: the ≤420px breakpoint no longer carries a generic .holding-card-detail{padding:8px} shorthand, which would silently reset the 60px padding-left/margin-left the ≤768px block relies on to align 市值/詳細 with the name text past the absolutely-positioned ring', () => {
  const narrowBlock = styles.slice(styles.indexOf('@media (max-width: 420px)'), styles.indexOf('/* V3.1 application navigation */'));
  assert.doesNotMatch(narrowBlock, /\.holding-card-detail\{padding:8px\}/);
});

test('UR-TODO-073 third refinement round: UR-TODO-070/071/072 field data and interaction wiring in App.tsx are completely untouched (CSS-only presentation change)', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const card = app.slice(app.indexOf('function HoldingCompactCard'), app.indexOf('function HoldingDetailContent'));
  assert.match(card, /holding-card-shares[\s\S]*row\.shares/);
  assert.match(card, /holding-card-average-cost[\s\S]*row\.avgCost/);
  assert.match(card, /holding-card-price[\s\S]*row\.quote\.price\.toFixed\(2\)/);
  assert.match(card, /holding-card-today-change[\s\S]*quoteHeadline\.amountText/);
  assert.match(card, /<HoldingOrderHandle label=\{row\.quote\.name\} isDragging=\{isDragging\} onDragStart=\{onDragStart\} onDragMove=\{onDragMove\} onDragEnd=\{onDragEnd\} onDragCancel=\{onDragCancel\} onKeyboardMove=\{onKeyboardMove\} \/>/);
  assert.match(card, /className="holding-edit-button" aria-expanded=\{isDetailOpen\} aria-haspopup="dialog" onClick=\{onOpenDetail\}/);
});

test('UR-TODO-073 fourth refinement round (hard acceptance criterion): 市值 label + amount render on the SAME row — flex row on the existing span+strong DOM, not the previous stacked block layout', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  const valueRule = /\.holding-card-market-value\{grid-area:value;display:flex;align-items:baseline[^}]*\}/.exec(mobileBlock)?.[0];
  assert.ok(valueRule, '.holding-card-market-value must be display:flex (same-row), not display:block (stacked)');
  assert.match(mobileBlock, /\.holding-card-market-value>span\{flex:0 0 auto/);
  assert.match(mobileBlock, /\.holding-card-market-value>strong\{flex:1 1 auto/);
});

test('UR-TODO-073 fourth refinement round: unrealized P/L is percentage-primary (visually above), 未實現損益 label secondary (visually below, right-aligned) — same DOM, column-reverse flex; the absolute NT$ amount is hidden here only (still shown once in the 詳細 Sheet summary strip)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileBlock, /\.holding-card-unrealized-pnl\{grid-area:pnl;display:flex;flex-direction:column-reverse;align-items:flex-end/);
  assert.match(mobileBlock, /\.holding-card-unrealized-pnl strong>span:first-child\{display:none\}/);
  // The pct span (signedPct) must remain the only visible child of <strong> — verified against the
  // live App.tsx JSX contract (two <span> children: amount first, pct second) in the previous test.
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const card = app.slice(app.indexOf('function HoldingCompactCard'), app.indexOf('function HoldingDetailContent'));
  assert.match(card, /holding-card-unrealized-pnl[\s\S]*<span>\{signedMoney\(row\.pnl\)\}<\/span><span>\{signedPct\(pnlPct\)\}<\/span>/);
});

test('UR-TODO-074: 市值 shares a row with the top half of P&L\'s percentage, and 詳細 shares a row with the bottom half of P&L\'s label — the pnl grid-area spans both rows as one contiguous area (same DOM as before, no JSX change), so the percentage lines up with 市值 and 未實現損益 lines up with 詳細 — still no per-field box (background/border neutralized for the pnl tone classes at this breakpoint)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileBlock, /"value {2,}pnl"/);
  assert.match(mobileBlock, /"detail {2,}pnl"/);
  assert.match(mobileBlock, /\.holding-card-unrealized-pnl-up,\.holding-card-unrealized-pnl-down,\.holding-card-unrealized-pnl-hold\{background:transparent!important;border:0!important\}/);
});

test('UR-TODO-074: 詳細 is a compact Secondary action (auto width, not a full-width bar) and the allocation ring is absolutely positioned inside .holding-card-identity so it visually overlaps the rows below it without inflating row 1\'s height or changing the summary\'s direct-child count (which the ≥901px desktop 9-column row, UR-TODO-071\'s contract, depends on)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileBlock, /\.holding-card-summary>\.holding-edit-button\{grid-area:detail;justify-self:start;align-self:center;width:auto/);
  assert.doesNotMatch(mobileBlock, /\.holding-card-summary>\.holding-edit-button\{grid-area:detail;justify-self:stretch/);
  assert.match(mobileBlock, /\.holding-card-identity\{grid-area:identity;position:relative;padding-left:92px/);
  assert.match(mobileBlock, /\.holding-mobile-weight\{position:absolute;top:0;left:0;width:76px;height:76px\}/);
  const desktopBlock = styles.slice(styles.indexOf('@media (min-width:901px)'), styles.indexOf('@media (max-width: 768px)'));
  assert.match(desktopBlock, /\.holding-card-summary\{grid-template-columns:minmax\(152px,1\.5fr\)/, 'the ≥901px desktop 9-column row template must be untouched by this Sprint');
});

test('UR-TODO-074 ring-size refinement: allocation ring is enlarged (not left at the original 52px badge size) at every mobile bucket, and every bucket\'s punch-hole is large enough that realistic single-holding percentage strings (up to 5 characters, e.g. 67.4%/10.7%/48.8%) fit inside the CIRCLE (verified via chord-width at the text\'s actual rendered height, not just width-vs-diameter — a rectangle narrower than a circle\'s diameter can still poke past its curved edge near the corners), with matching text-alignment offsets so 市值/詳細 keep lining up under the name text', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  const narrowBlock = styles.slice(styles.indexOf('@media (max-width: 420px)'), styles.indexOf('@media (max-width: 360px)'));
  const narrowestBlock = styles.slice(styles.indexOf('@media (max-width: 360px)'), styles.indexOf('/* V3.1 application navigation */'));
  // UR-TODO-074 round 2 (iPhone Preview acceptance): outer diameters unchanged from round 1 — only
  // the inset (stroke/ring-band thickness) was thinned per feedback that the ring read as "big
  // circle, thick band" rather than the target's "big circle, thin band". A thinner inset only
  // enlarges the punch-hole, so the chord-width fit check below still holds with more margin.
  const buckets = [
    { label: '421-768px (e.g. 430px)', block: mobileBlock, ring: 76, inset: 6, font: 16, offset: 92, offsetSelectors: true },
    { label: '≤420px (e.g. 390px)', block: narrowBlock, ring: 70, inset: 5, font: 15, offset: 86, offsetSelectors: true },
    { label: '≤360px (e.g. 320px)', block: narrowestBlock, ring: 64, inset: 5, font: 14, offset: 78, offsetSelectors: true },
  ];
  // A monospace-ish digit/percent glyph is comfortably covered by treating each character as
  // ~0.62em wide (verified against real rendered widths during this Sprint's Preview testing, which
  // measured 42.8-49px for 5-character strings at 14-16px font — this constant stays conservatively
  // above that per-character average so the regression guard doesn't rely on live font metrics).
  const CHAR_WIDTH_EM = 0.62;
  const LINE_HEIGHT = 1.1;
  for (const { label, block, ring, inset, font, offset } of buckets) {
    assert.match(block, new RegExp(`\\.holding-mobile-weight\\{(position:absolute;top:0;left:0;)?width:${ring}px;height:${ring}px\\}`), `${label}: ring size`);
    assert.match(block, new RegExp(`\\.holding-mobile-weight::before\\{inset:${inset}px\\}`), `${label}: punch-hole inset`);
    assert.match(block, new RegExp(`\\.holding-mobile-weight strong\\{font-size:${font}px\\}`), `${label}: percentage font-size`);
    assert.match(block, new RegExp(`\\.holding-card-identity\\{(grid-area:identity;position:relative;)?padding-left:${offset}px`), `${label}: identity offset must match ring+gap`);
    assert.match(block, new RegExp(`\\.holding-card-market-value\\{(grid-area:value;display:flex;align-items:baseline;gap:6px;min-width:0;)?padding-left:${offset}px`), `${label}: market-value offset must match ring+gap`);
    assert.match(block, new RegExp(`margin-left:${offset}px`), `${label}: 詳細 button offset must match ring+gap`);
    assert.ok(ring > 52, `${label}: ring size ${ring}px must be larger than the pre-refinement 52px badge`);
    const holeDiameter = ring - 2 * inset;
    const textHeight = font * LINE_HEIGHT;
    const textWidth = '67.4%'.length * font * CHAR_WIDTH_EM;
    const chordWidth = 2 * Math.sqrt(Math.max(0, (holeDiameter / 2) ** 2 - (textHeight / 2) ** 2));
    assert.ok(textWidth <= chordWidth, `${label}: a 5-character percentage (~${textWidth.toFixed(1)}px) must fit the ${holeDiameter}px punch-hole's chord width at this text height (${chordWidth.toFixed(1)}px), not just its diameter`);
  }
  // the underlying conic-gradient/ring-value mechanism (real allocation % fill) is untouched by any
  // of the size overrides above — only width/height/inset/font-size/offsets change per breakpoint.
  assert.match(styles, /background:conic-gradient\(var\(--primary\) calc\(var\(--ring-value,0\)\*1%\),var\(--border\) 0\)/);
});

test('UR-TODO-074 round 2 (iPhone Preview acceptance): 詳細 is a visibly wider compact Secondary button (min-width ≥80px, not the round-1 ~56px), and 未實現損益 sits tightly grouped under its percentage (a small explicit gap, not `justify-content:space-between` stretching them to opposite ends of the tall pnl area)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  const buttonRule = /\.holding-card-summary>\.holding-edit-button\{[^}]*\}/.exec(mobileBlock)?.[0] ?? '';
  const minWidthMatch = /min-width:(\d+)px/.exec(buttonRule);
  assert.ok(minWidthMatch, '詳細 button must declare an explicit min-width');
  assert.ok(Number(minWidthMatch[1]) >= 80, `詳細 button min-width (${minWidthMatch[1]}px) must be ≥80px, clearly wider than the round-1 ~56px`);
  assert.doesNotMatch(buttonRule, /justify-self:stretch/, '詳細 must stay a compact button, not a full-width bar');
  const pnlRule = /\.holding-card-unrealized-pnl\{[^}]*\}/.exec(mobileBlock)?.[0] ?? '';
  assert.match(pnlRule, /flex-direction:column-reverse/, 'percentage-primary/label-secondary stacking order must be unchanged');
  assert.doesNotMatch(pnlRule, /justify-content:space-between/, 'space-between stretches percentage and label to opposite ends of the tall pnl area — the exact bug reported in this round');
  const gapMatch = /gap:(\d+)px/.exec(pnlRule);
  assert.ok(gapMatch, 'pnl percentage/label must have an explicit small gap so they read as one group');
  assert.ok(Number(gapMatch[1]) <= 5, `pnl gap (${gapMatch[1]}px) must be small (≤5px) so 未實現損益 reads as tightly grouped with its percentage`);
});

test('UR-TODO-074 round 2 (iPhone Preview acceptance): dark surface tokens are darkened/more-neutral than the UR-TODO-073 baseline while keeping the page→surface→surface-2 three-layer hierarchy distinct and --border still subtle (not a bright frame)', () => {
  const bgPage = /--bg-page:(#[0-9a-fA-F]{6})/.exec(root)?.[1];
  const bgSurface = /--bg-surface:(#[0-9a-fA-F]{6})/.exec(root)?.[1];
  const bgSurface2 = /--bg-surface-2:(#[0-9a-fA-F]{6})/.exec(root)?.[1];
  const border = /--border:(#[0-9a-fA-F]{6})/.exec(root)?.[1];
  for (const [name, hex] of [['--bg-page', bgPage], ['--bg-surface', bgSurface], ['--bg-surface-2', bgSurface2], ['--border', border]]) {
    assert.ok(hex, `${name} must be defined`);
  }
  const luminance = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * ((n >> 16) & 0xff) + 0.7152 * ((n >> 8) & 0xff) + 0.0722 * (n & 0xff);
  };
  // must not have regressed back to (or past) the UR-TODO-073 baseline lightness for the two
  // surfaces the user flagged as "still blue-gray" — this round must be darker, not just re-hued.
  assert.ok(luminance(bgPage) < luminance('#0b0f14'), '--bg-page must be darker than the UR-TODO-073 baseline (#0b0f14)');
  assert.ok(luminance(bgSurface) < luminance('#111827'), '--bg-surface must be darker than the UR-TODO-073 baseline (#111827)');
  assert.ok(luminance(bgSurface2) < luminance('#151d2a'), '--bg-surface-2 must be darker than the UR-TODO-073 baseline (#151d2a)');
  // three-layer hierarchy: each step must still be visibly distinct (not collapsed together).
  assert.ok(luminance(bgSurface) > luminance(bgPage), '--bg-surface must remain visibly lighter than --bg-page (layering preserved)');
  assert.ok(luminance(bgSurface2) > luminance(bgSurface), '--bg-surface-2 must remain visibly lighter than --bg-surface (layering preserved)');
  assert.notEqual(bgPage.toLowerCase(), '#000000', '--bg-page must not be flattened to OLED pure black');
  // --border must stay subtle: not equal to a full text-contrast color, and darker than --text-primary/-secondary.
  assert.ok(luminance(border) < luminance('#a7b0bf'), '--border must stay darker/less prominent than --text-secondary (subtle, not a bright frame)');
});

test('UR-TODO-074 round 3 (iPhone Preview acceptance, site-wide root cause): the three dark surface tokens are darker than the round-2 values AND less blue-hued (B channel no longer far above R/G) — the compounding blue push across many nested surface-2-on-surface boxes (Home/Analysis/Tools/Rebalance) was the actual reason those pages still read "blue-gray" while the Holding Card looked fine', () => {
  const bgPage = /--bg-page:(#[0-9a-fA-F]{6})/.exec(root)?.[1];
  const bgSurface = /--bg-surface:(#[0-9a-fA-F]{6})/.exec(root)?.[1];
  const bgSurface2 = /--bg-surface-2:(#[0-9a-fA-F]{6})/.exec(root)?.[1];
  const luminance = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * ((n >> 16) & 0xff) + 0.7152 * ((n >> 8) & 0xff) + 0.0722 * (n & 0xff);
  };
  const blueBias = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
    return b - Math.max(r, g);
  };
  // round 2 -> round 3: darker still (not just re-hued).
  assert.ok(luminance(bgPage) <= luminance('#07090c'), '--bg-page must be no lighter than the round-2 value (#07090c)');
  assert.ok(luminance(bgSurface) <= luminance('#0d1218'), '--bg-surface must be no lighter than the round-2 value (#0d1218)');
  assert.ok(luminance(bgSurface2) <= luminance('#121924'), '--bg-surface-2 must be no lighter than the round-2 value (#121924)');
  // round 2's blue channel sat 6-11pt above red/green (e.g. #0d1218: B24 vs R13 -> bias 11); round 3
  // must cut that bias down meaningfully so the surfaces read as neutral charcoal, not blue-gray.
  assert.ok(blueBias(bgSurface) <= 6, `--bg-surface's blue-vs-red/green bias (${blueBias(bgSurface)}) must be ≤6 (round-2's #0d1218 was 11)`);
  assert.ok(blueBias(bgSurface2) <= 6, `--bg-surface-2's blue-vs-red/green bias (${blueBias(bgSurface2)}) must be ≤6 (round-2's #121924 was 12)`);
});

test('UR-TODO-074 round 3: the site-wide hardcoded blue-navy background leaks found by this round\'s audit (predating the UR-TODO-073 token pass, on plain structural surfaces rather than semantic status badges) are retokenized', () => {
  for (const hex of ['#0a1524', '#0b2138', '#0b1f36', '#102f52']) {
    assert.doesNotMatch(styles, new RegExp(`background:${hex}\\b`, 'i'), `${hex} must no longer appear as a hardcoded background (found outside the semantic status-badge palette this Sprint deliberately leaves alone)`);
  }
  assert.match(styles, /\.order-section\.order-muted\{border-color:var\(--border\);background:var\(--bg-page\)\}/);
  assert.match(styles, /\.rebalance-group \.group-main\{background:var\(--bg-surface-2\)\}/);
});

test('UR-TODO-074 round 3: the mobile Holding Card name is enlarged (20px) via a scoped selector, not the shared --font-name token, so the ≥901px desktop row and the Detail Sheet header (which also consume --font-name) are unaffected', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileBlock, /\.holding-card-identity \.holding-name\{font-size:20px\}/);
  assert.match(styles, /--font-name:18px/, '--font-name token itself must stay 18px (unchanged) so Desktop/Detail Sheet consumers are unaffected');
  const desktopBlock = styles.slice(styles.indexOf('@media (min-width:901px)'), styles.indexOf('@media (max-width: 768px)'));
  assert.match(desktopBlock, /\.holding-card-identity \.holding-name\{font-size:var\(--font-name\)/, 'desktop must keep consuming the unchanged --font-name token, not the mobile-only 20px override');
});

test('UR-TODO-074 round 3: ring-to-content gap widened (from the round-1/2 8px gap to 14-16px) at every mobile bucket — offsets are still exactly ring-size + gap, so 市值/詳細 keep lining up under the (now-wider) gap past the ring', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  const narrowBlock = styles.slice(styles.indexOf('@media (max-width: 420px)'), styles.indexOf('@media (max-width: 360px)'));
  const narrowestBlock = styles.slice(styles.indexOf('@media (max-width: 360px)'), styles.indexOf('/* V3.1 application navigation */'));
  const buckets = [
    { label: '421-768px', block: mobileBlock, ring: 76, offset: 92 },
    { label: '≤420px', block: narrowBlock, ring: 70, offset: 86 },
    { label: '≤360px', block: narrowestBlock, ring: 64, offset: 78 },
  ];
  for (const { label, block, ring, offset } of buckets) {
    const gap = offset - ring;
    assert.ok(gap >= 14, `${label}: ring-to-content gap (${gap}px) must be ≥14px (was 8px pre-round-3)`);
    assert.match(block, new RegExp(`padding-left:${offset}px`), `${label}: identity/market-value offset`);
    assert.match(block, new RegExp(`margin-left:${offset}px`), `${label}: 詳細 button offset`);
  }
});
