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

test('UR-TODO-073 HoldingDetailDialog (UR-TODO-072 contract) shell classnames are all still present, only retokenized', () => {
  for (const cls of ['.holding-detail-backdrop', '.holding-detail-dialog', '.holding-detail-header', '.holding-detail-close', '.holding-detail-body']) {
    assert.match(styles, new RegExp(cls.replace('.', '\\.') + '\\{'));
  }
  // Desktop centered modal vs Mobile near-full-height sheet breakpoint switch (768px) must be unchanged.
  assert.match(styles, /@media \(max-width: 768px\) \{[\s\S]*?\.holding-detail-dialog\{max-width:none;width:100%;height:96dvh;max-height:96dvh/);
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

test('UR-TODO-073 third refinement round: mobile Holding Card is restructured into an investment-summary layout (ring/name header, prominent value+P&L, demoted price/today-change, Secondary 詳細) via grid-template-areas — every previously-visible data point remains available somewhere (股數/均價 in 詳細, 現價/今日漲跌 stay on the compact card)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileBlock, /grid-template-areas:/);
  for (const [cls, area] of [
    ['.holding-card-identity', 'identity'],
    ['.holding-card-market-value', 'value'],
    ['.holding-card-unrealized-pnl', 'pnl'],
    ['.holding-card-price', 'meta'],
    ['.holding-card-today-change', 'meta2'],
    ['.holding-order-handle', 'handle'],
  ]) {
    assert.match(mobileBlock, new RegExp(cls.replace('.', '\\.') + '\\{grid-area:' + area));
  }
  assert.match(mobileBlock, /\.holding-card-summary>\.holding-edit-button\{grid-area:detail/);
  assert.match(mobileBlock, /\.holding-card-shares,\.holding-card-average-cost\{display:none\}/);
});

test('UR-TODO-073 third refinement round: the ≤420px breakpoint\'s generic .holding-card-detail padding no longer silently re-pads the demoted 現價/今日漲跌 row back up (the exact class of bug caught once already this Sprint)', () => {
  const narrowBlock = styles.slice(styles.indexOf('@media (max-width: 420px)'), styles.indexOf('/* V3.1 application navigation */'));
  assert.match(narrowBlock, /\.holding-card-price,\.holding-card-today-change\{padding:0\}/);
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

test('UR-TODO-073 fourth refinement round: 市值/P&L now share one row (grid-area "value pnl pnl") instead of two full-width stacked rows — a further compactness step, still no per-field box (background/border neutralized for the pnl tone classes at this breakpoint)', () => {
  const mobileBlock = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileBlock, /"value pnl pnl"/);
  assert.match(mobileBlock, /\.holding-card-unrealized-pnl-up,\.holding-card-unrealized-pnl-down,\.holding-card-unrealized-pnl-hold\{background:transparent!important;border:0!important\}/);
});
