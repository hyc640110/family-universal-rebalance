import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const page = readFileSync(new URL('../src/pages/MarketIntelligencePage.tsx', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../src/components/layout/navItems.ts', import.meta.url), 'utf8');
test('market page exposes all source-first sections and unavailable states', () => { for (const text of ['台股主要指標', '全球主要指數', '美國公債殖利率', '重要經濟事件', '資料時間', '來源']) assert.match(page, new RegExp(text)); });
test('390px foundation uses bounded six-item navigation and two-column-to-mobile market cards', () => { assert.match(nav, /to: '\/market'/); assert.match(css, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/); assert.match(css, /@media \(max-width:700px\).*?\.market-summary-grid,.market-card-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s); assert.match(css, /overflow:hidden;text-overflow:ellipsis;max-width:100%/); });
