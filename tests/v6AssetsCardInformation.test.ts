import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { formatCompactQuoteMovement } from '../src/lib/compactAssetCard';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const card = app.slice(app.indexOf('function HoldingCompactCard'), app.indexOf('function AllocationPresetPanel'));

test('V6.16 keeps today movement presentation on existing Quote fields with Taiwan-market tones', () => {
  assert.deepEqual(formatCompactQuoteMovement(1.23, 3.52, 35), { text: '+1.23（+3.52%）', tone: 'up', ariaLabel: '最近交易日上漲 1.23 元，漲幅 3.52%' });
  assert.deepEqual(formatCompactQuoteMovement(-1.23, -3.52, 35), { text: '-1.23（-3.52%）', tone: 'down', ariaLabel: '最近交易日下跌 1.23 元，跌幅 3.52%' });
  assert.deepEqual(formatCompactQuoteMovement(undefined, 3.52, 35), { text: '—', tone: 'hold', ariaLabel: '最近交易日漲跌資料不足' });
});

test('V6.16 compact card keeps average cost in details while mobile presents only essential holding facts', () => {
  assert.match(card, /holding-card-identity/);
  assert.match(card, /holding-card-shares[\s\S]*row\.shares/);
  assert.match(card, /holding-card-average-cost[\s\S]*row\.avgCost/);
  assert.match(card, /holding-card-price[\s\S]*row\.quote\.price\.toFixed\(2\)/);
  assert.match(card, /holding-card-today-change[\s\S]*quoteHeadline\.amountText/);
  assert.match(card, /holding-card-market-value[\s\S]*money\(row\.marketValue\)/);
  assert.match(card, /holding-card-unrealized-pnl[\s\S]*signedMoney\(row\.pnl\)[\s\S]*signedPct\(pnlPct\)/);
  assert.match(card, /holding-edit-button/);
  assert.match(card, /holding-editor-grid[\s\S]*成交均價[\s\S]*row\.avgCost/);
});

test('V6.16 scopes mobile PnL wrapping and retains desktop card layout', () => {
  assert.match(styles, /\.holding-card-unrealized-pnl[^}]*min-width:0/);
  assert.match(styles, /\.holding-card-unrealized-pnl strong[^}]*overflow-wrap:anywhere/);
  assert.match(styles, /@media \(min-width:901px\)[\s\S]*\.holding-card-summary/);
  assert.match(styles, /@media \(max-width: 768px\)[\s\S]*\.holding-card-summary/);
});

test('V6.16 hides average cost, shares, price and today-change (all remain visible via 詳細/HoldingDetailContent) in the mobile summary without leaving a blank grid slot', () => {
  const mobileStyles = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  // UR-TODO-074: 現價/今日漲跌 join 股數/均價 as hidden-in-summary fields — none have their own
  // display surface anywhere else except HoldingDetailContent (see App.tsx), which now shows all four.
  assert.match(mobileStyles, /\.holding-card-shares,\.holding-card-average-cost,\.holding-card-price,\.holding-card-today-change\{display:none\}/);
  // UR-TODO-073 round 3 / UR-TODO-074: mobile summary reflow uses named grid-template-areas
  // (identity/value/pnl/detail/handle) instead of `order`-based reflow — hidden elements simply have
  // no area assigned, so there is no blank slot by construction (no `order` rules needed here).
  // UR-TODO-074 collapses the previous 4-row layout (identity / value+pnl / meta+meta2 / detail) into
  // 3 rows by dropping the meta/meta2 (現價/今日漲跌) row entirely and letting pnl span both remaining
  // content rows (value, detail) as one contiguous area.
  assert.match(mobileStyles, /grid-template-areas:\s*\n\s*"identity handle"\s*\n\s*"value {2,}pnl"\s*\n\s*"detail {2,}pnl"/);
  assert.doesNotMatch(styles.slice(styles.indexOf('@media (min-width:901px)'), styles.indexOf('@media (max-width: 768px)')), /\.holding-card-average-cost\{display:none\}/);
});
