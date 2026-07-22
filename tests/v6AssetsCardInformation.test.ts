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
  assert.match(card, /holding-card-today-change[\s\S]*compactQuoteMovement\.text/);
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

test('V6.16 hides average cost only in the mobile summary without leaving a blank grid slot', () => {
  const mobileStyles = styles.slice(styles.indexOf('@media (max-width: 768px)'), styles.indexOf('@media (max-width: 420px)'));
  assert.match(mobileStyles, /\.holding-card-average-cost\{display:none\}/);
  assert.match(mobileStyles, /\.holding-card-shares\{grid-column:1\/-1\}/);
  assert.doesNotMatch(styles.slice(styles.indexOf('@media (min-width:901px)'), styles.indexOf('@media (max-width: 768px)')), /\.holding-card-average-cost\{display:none\}/);
});
