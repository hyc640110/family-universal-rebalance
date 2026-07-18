import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

const fontSizesFor = (selector: string) => [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .filter(([, selectors]) => selectors.split(',').map(item => item.trim()).includes(selector))
  .map(([, , declarations]) => declarations.match(/font-size:([^;}]+)/)?.[1]?.trim())
  .filter((size): size is string => Boolean(size));
const finalFontSizeFor = (selector: string) => fontSizesFor(selector).at(-1);

test('V6.13 keeps the mobile bottom navigation at a single readable final size', () => {
  assert.deepEqual(fontSizesFor('.mobile-page-nav a'), ['12px']);
  assert.match(css, /\.mobile-page-nav a\{[^}]*min-height:50px[^}]*font-size:12px[^}]*line-height:1\.2/);
});

test('V6.13 keeps mobile calendar dates and primary values readable without changing its seven-column model', () => {
  assert.deepEqual(fontSizesFor('.daily-calendar-day strong'), ['13px', '12px']);
  assert.deepEqual(fontSizesFor('.daily-calendar-date'), ['12px', '12px']);
  assert.match(css, /daily-calendar-day\.today \.daily-calendar-date::after\{[^}]*font-size:11px/);
  assert.match(css, /\.daily-calendar-day\{min-height:64px;padding:6px 4px;gap:3px;border-radius:7px\}/);
  assert.match(css, /\.daily-calendar-day strong\{width:100%;font-size:12px;line-height:1\.2;text-align:center\}/);
  assert.match(css, /daily-calendar-weekdays[^}]*grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
});

test('V6.13 scopes semantic form and helper typography without widening global selectors', () => {
  assert.match(css, /--font-form-label:14px/);
  assert.match(css, /\.financial-account-fields label,\.loan-list \.list-row label,\.cashflow-form label,\.cashflow-expense-list label\{font-size:var\(--font-form-label\);line-height:1\.45\}/);
  assert.match(css, /\.financial-account-card footer small,\.account-derived-note,\.import-preview label\{font-size:var\(--font-helper\);line-height:1\.45\}/);
  assert.doesNotMatch(css, /(?:^|[}])\s*label\s*\{[^}]*font-size:14px/);
  assert.doesNotMatch(css, /(?:^|[}])\s*(?:small|span)\s*\{[^}]*font-size/);
});

test('V6.13 preserves mobile input, dividend, and chart readability contracts', () => {
  assert.match(css, /input, select, textarea \{ font-size: 16px !important; \}/);
  assert.match(css, /\.dividend-fields label\{font-size:14px;font-weight:600;line-height:1\.45\}/);
  assert.deepEqual(fontSizesFor('.trend-axis-label'), ['12px', '13px']);
  assert.equal(finalFontSizeFor('.market-data-card dt'), '11px');
});

test('V6.13 applies final scoped 13px rules to audited desktop allocation and section labels', () => {
  assert.equal(finalFontSizeFor('.allocation-preset-roles small'), '13px');
  assert.match(css, /\.allocation-preset-roles small\{color:#b6c7da;font-size:13px;line-height:1\.4;overflow-wrap:anywhere\}/);
  assert.match(css, /\.allocation-preset-roles span\{min-width:0\}/);
  assert.equal(finalFontSizeFor('.performance-heading .eyebrow'), '13px');
  assert.equal(finalFontSizeFor('.market-hero .eyebrow'), '13px');
  assert.equal(finalFontSizeFor('.market-section header .eyebrow'), '13px');
  assert.equal(finalFontSizeFor('.history-hero .eyebrow'), '13px');
  assert.match(css, /\.performance-heading \.eyebrow,\.market-hero \.eyebrow,\.market-section header \.eyebrow,\.history-hero \.eyebrow\{font-size:13px;font-weight:700;line-height:1\.4\}/);
});

test('V6.13 replaces the two audited inline typography declarations with semantic classes', () => {
  assert.match(app, /className="small typography-copy-action"/);
  assert.match(app, /className="note loan-interest-note"/);
  assert.doesNotMatch(app, /fontSize: '12px'/);
});
