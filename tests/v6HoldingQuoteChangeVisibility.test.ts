import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { formatCompactQuoteMovement } from '../src/lib/compactAssetCard';

test('V6.6 presents existing recent-trading-day quote changes with stable Taiwan-market signs and tones', () => {
  assert.deepEqual(formatCompactQuoteMovement(0.25, 0.78, 32), { text: '+0.25（+0.78%）', tone: 'up', ariaLabel: '最近交易日上漲 0.25 元，漲幅 0.78%' });
  assert.deepEqual(formatCompactQuoteMovement(-0.15, -0.3, 49.4), { text: '-0.15（-0.30%）', tone: 'down', ariaLabel: '最近交易日下跌 0.15 元，跌幅 0.30%' });
  assert.deepEqual(formatCompactQuoteMovement(0, 0, 100.15), { text: '0.00（0.00%）', tone: 'hold', ariaLabel: '最近交易日平盤' });
});

test('V6.6 reports unavailable data rather than inventing a flat change', () => {
  for (const value of [undefined, Number.NaN, Infinity, -Infinity]) assert.deepEqual(formatCompactQuoteMovement(value, 0.78, 32), { text: '—', tone: 'hold', ariaLabel: '最近交易日漲跌資料不足' });
  for (const value of [undefined, Number.NaN, Infinity, -Infinity]) assert.deepEqual(formatCompactQuoteMovement(0.25, value, 32), { text: '—', tone: 'hold', ariaLabel: '最近交易日漲跌資料不足' });
  assert.deepEqual(formatCompactQuoteMovement(0.25, 0.78, 0), { text: '—', tone: 'hold', ariaLabel: '最近交易日漲跌資料不足' });
});

test('V6.6 compact list consumes trusted Quote fields without calculating from average cost or clearing closed-market data', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const helper = readFileSync(new URL('../src/lib/compactAssetCard.ts', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const card = app.slice(app.indexOf('function HoldingCompactCard'), app.indexOf('function AllocationPresetPanel'));
  const summary = card.slice(card.indexOf('const compactQuoteMovement'), card.indexOf('{isEditing &&'));
  const todayChange = summary.slice(summary.indexOf('holding-card-today-change'), summary.indexOf('holding-card-market-value'));
  assert.match(summary, /formatCompactQuoteMovement\(row\.quote\.change, row\.quote\.changePct, row\.quote\.previousClose, row\.quote\.previousCloseTrusted === true\)/);
  assert.match(summary, /aria-label=\{compactQuoteMovement\.ariaLabel\}/);
  assert.match(summary, /holding-card-price[\s\S]*holding-quote-change \$\{compactQuoteMovement\.tone\}/);
  assert.doesNotMatch(todayChange, /avgCost|row\.pnl|quoteDateStatus|isTodayQuote/);
  assert.doesNotMatch(helper, /price\s*-/);
  assert.match(styles, /holding-quote-change/);
  assert.match(styles, /holding-card-price>strong\.up\{color:#ff5b5b\}/);
  assert.match(styles, /holding-card-price>strong\.down\{color:#43d17a\}/);
  assert.match(styles, /holding-card-price>strong\.hold\{color:#9fb3c8\}/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\)/);
});
