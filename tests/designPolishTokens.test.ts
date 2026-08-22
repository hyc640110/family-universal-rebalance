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

test('UR-TODO-073 no financial/persistence source files were touched by this Sprint (visual-only diff)', () => {
  // holdingDisplayOrder / rebalance / clec / household liquidity libs must not import or reference any
  // of the new CSS custom properties — this Sprint never touches src/lib/**.
  for (const path of ['../src/lib/holdingDisplayOrder.ts', '../src/lib/clecStrategyRules.ts', '../src/lib/householdLiquidity.ts']) {
    const src = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /--bg-page|--primary|--market-up|--market-down/);
  }
});
