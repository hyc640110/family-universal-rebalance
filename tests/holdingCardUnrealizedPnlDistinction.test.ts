import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const card = app.slice(app.indexOf('function HoldingCompactCard'), app.indexOf('function AllocationPresetPanel'));

test('UR-TODO-002 item 5: 未實現損益 wrapper carries a tone-specific class distinct from 今日漲跌', () => {
  assert.match(card, /holding-card-unrealized-pnl holding-card-unrealized-pnl-\$\{tone\(row\.pnl\)\}/);
  // 今日漲跌 keeps its existing plain wrapper - only the color class stays on <strong>, no container-level tone class was added there.
  const todayChangeCell = card.slice(card.indexOf('holding-card-today-change'), card.indexOf('holding-card-market-value'));
  assert.doesNotMatch(todayChangeCell, /holding-card-today-change holding-card-today-change-/);
});

test('UR-TODO-002 item 5: base and desktop (>=901px) styles both give 未實現損益 a tinted, accent-bordered container per tone', () => {
  // UR-TODO-073: border-color is now a design token, not a literal hex — the rgba tint (unaffected
  // by the token pass) and --market-up/--market-down/--border still resolve to the same colors.
  assert.match(styles, /\.holding-card-unrealized-pnl-up\{background:rgba\(255,91,91,\.\d+\);border-color:var\(--market-up\);border-left-width:3px\}/);
  assert.match(styles, /\.holding-card-unrealized-pnl-down\{background:rgba\(67,209,122,\.\d+\);border-color:var\(--market-down\);border-left-width:3px\}/);
  assert.match(styles, /\.holding-card-unrealized-pnl-hold\{background:rgba\(159,179,200,\.\d+\);border-color:var\(--border\);border-left-width:3px\}/);
  const desktopBlock = styles.slice(styles.indexOf('@media (min-width:901px)'), styles.indexOf('@media (max-width: 768px)'));
  assert.match(desktopBlock, /\.holding-card-unrealized-pnl-up\{background:rgba\(255,91,91,\.\d+\);border-left-color:var\(--market-up\)\}/);
  assert.match(desktopBlock, /\.holding-card-unrealized-pnl-down\{background:rgba\(67,209,122,\.\d+\);border-left-color:var\(--market-down\)\}/);
  assert.match(desktopBlock, /\.holding-card-unrealized-pnl-hold\{background:rgba\(159,179,200,\.\d+\);border-left-color:var\(--border\)\}/);
});

test('UR-TODO-002 item 5: does not touch the shared red/down/hold text color rules that today-change and unrealized-pnl already share', () => {
  // UR-TODO-073: retokenized (var(--market-up)/(--market-down)/(--text-secondary)) — same colors.
  assert.match(styles, /\.holding-card-today-change>strong\.up,\.holding-card-unrealized-pnl>strong\.up\{color:var\(--market-up\)\}/);
  assert.match(styles, /\.holding-card-today-change>strong\.down,\.holding-card-unrealized-pnl>strong\.down\{color:var\(--market-down\)\}/);
  assert.match(styles, /\.holding-card-today-change>strong\.hold,\.holding-card-unrealized-pnl>strong\.hold\{color:var\(--text-secondary\)\}/);
});

test('UR-TODO-002 items 1-4 (price/percent same line, amount own line, arrow, shared tone) remain intact from UR-TODO-033 - not redone', () => {
  assert.match(card, /formatCompactQuoteHeadline\(row\.quote\.change, row\.quote\.changePct, row\.quote\.previousClose, row\.quote\.previousCloseTrusted === true\)/);
  assert.match(card, /holding-card-price[\s\S]*quoteHeadline\.arrow[\s\S]*quoteHeadline\.percentText/);
  assert.match(card, /holding-card-today-change[\s\S]*quoteHeadline\.amountText/);
});
