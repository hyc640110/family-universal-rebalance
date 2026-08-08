import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TrendChart from '../src/components/TrendChart';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const render = (data: { date: string; value: number }[], title = '淨資產') =>
  renderToStaticMarkup(createElement(TrendChart, { title, unit: '單位：萬元', data, formatValue: (value: number) => `${value} 元` }));

const countOccurrences = (html: string, needle: string) => html.split(needle).length - 1;

function extractGradientRanges(html: string): Record<'up' | 'down', { y1: number; y2: number } | undefined> {
  const ranges: Record<'up' | 'down', { y1: number; y2: number } | undefined> = { up: undefined, down: undefined };
  for (const match of html.matchAll(/<linearGradient id="[^"]*-(up|down)"[^>]*y1="(-?\d+\.?\d*)"[^>]*y2="(-?\d+\.?\d*)"/g)) {
    ranges[match[1] as 'up' | 'down'] = { y1: Number(match[2]), y2: Number(match[3]) };
  }
  return ranges;
}

function areaPathYValues(html: string, direction: 'up' | 'down'): number[] {
  const values: number[] = [];
  for (const match of html.matchAll(new RegExp(`<path d="([^"]+)" class="trend-area trend-area-${direction}"`, 'g'))) {
    const numbers = match[1].match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    for (let i = 1; i < numbers.length; i += 2) values.push(numbers[i]);
  }
  return values;
}

// UR-TODO-trend-baseline-fill: fill color is now relative to a fixed "today" baseline
// (the last point's value) rather than each segment's own rise/fall — this fully replaces
// the UR-TODO-027 per-segment logic, not an addition to it.

test('一路上漲的序列：今天（最後一筆）恰好是全期間最高點，所有段落都在基準之下，全綠不再是紅', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 150 }]);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-down"'), 2, '兩段都在今日（150）之下，應為綠色，不是舊邏輯的「上漲＝紅」');
  assert.doesNotMatch(html, /trend-area-up/);
});

test('一路下跌的序列：今天（最後一筆）恰好是全期間最低點，所有段落都在基準之上，全紅不再是綠', () => {
  const html = render([{ date: '2026-07-30', value: 150 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 100 }]);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-up"'), 2, '兩段都在今日（100）之上，應為紅色，不是舊邏輯的「下跌＝綠」');
  assert.doesNotMatch(html, /trend-area-down/);
});

test('折線中途跨越基準線時，該段落被交叉點拆成紅／綠兩塊，而不是整段單一顏色', () => {
  // today = 130 (last point). 80->150 crosses upward through 130; 150->90 crosses downward through 130.
  const html = render([
    { date: '2026-07-29', value: 80 },
    { date: '2026-07-30', value: 150 },
    { date: '2026-07-31', value: 90 },
    { date: '2026-08-01', value: 130 }
  ]);
  // seg0 (80->150) and seg1 (150->90) each straddle -> 1 up + 1 down piece each; seg2 (90->130) is entirely below -> 1 down.
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-up"'), 2, '兩個跨越基準的段落各自貢獻一塊紅色');
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-down"'), 3, '兩個跨越基準的段落各自貢獻一塊綠色，加上完全在基準之下的第三段');
});

test('今天剛好是資料範圍內的最高點時，畫面幾乎全綠但不會壞掉或報錯', () => {
  const html = render([{ date: '2026-07-29', value: 50 }, { date: '2026-07-30', value: 80 }, { date: '2026-07-31', value: 60 }, { date: '2026-08-01', value: 100 }]);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-down"'), 3);
  assert.doesNotMatch(html, /trend-area-up/);
  assert.match(html, /class="trend-baseline-line"/, '極端情況下基準線仍應可見，提供定位參考');
});

test('今天剛好是資料範圍內的最低點時，畫面幾乎全紅但不會壞掉或報錯', () => {
  const html = render([{ date: '2026-07-29', value: 100 }, { date: '2026-07-30', value: 80 }, { date: '2026-07-31', value: 60 }, { date: '2026-08-01', value: 50 }]);
  assert.equal(countOccurrences(html, 'class="trend-area trend-area-up"'), 3);
  assert.doesNotMatch(html, /trend-area-down/);
  assert.match(html, /class="trend-baseline-line"/);
});

test('完全持平的序列或單一資料點：不渲染任何漸層或填色區域，但基準線仍會渲染', () => {
  const flat = render([{ date: '2026-07-30', value: 100 }, { date: '2026-08-01', value: 100 }]);
  assert.doesNotMatch(flat, /<linearGradient/);
  assert.doesNotMatch(flat, /trend-area/);
  assert.match(flat, /class="trend-baseline-line"/);
  const single = render([{ date: '2026-08-01', value: 100 }]);
  assert.doesNotMatch(single, /<linearGradient/);
  assert.doesNotMatch(single, /trend-area/);
  assert.match(single, /class="trend-baseline-line"/);
});

test('每張圖最多共用一個紅色漸層與一個綠色漸層，不會每個填色區域各自建立一個', () => {
  const html = render([
    { date: '2026-07-29', value: 80 },
    { date: '2026-07-30', value: 150 },
    { date: '2026-07-31', value: 90 },
    { date: '2026-08-01', value: 130 }
  ]);
  assert.equal(countOccurrences(html, '<linearGradient'), 2, '一個紅色＋一個綠色漸層定義，供所有對應方向的填色區域共用');
});

test('基準線本身固定畫在今天（最後一筆）的高度，並附上「今日」文字標示', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 150 }]);
  assert.match(html, /class="trend-baseline-line"/);
  assert.match(html, /class="trend-baseline-label"[^>]*>今日</);
});

test('圖表下方新增基準說明文字，使用傳入的 title 動態組字，避免對非淨資產圖表誤植「淨資產」字樣', () => {
  const netWorthHtml = render([{ date: '2026-07-30', value: 100 }, { date: '2026-08-01', value: 120 }], '淨資產');
  assert.match(netWorthHtml, /以今日淨資產為基準：折線高於今日為紅色，低於今日為綠色，用以快速判斷目前是否處於相對低點。/);

  const investmentHtml = render([{ date: '2026-07-30', value: 100 }, { date: '2026-08-01', value: 120 }], '投資資產');
  assert.match(investmentHtml, /以今日投資資產為基準/);
  assert.doesNotMatch(investmentHtml, /以今日淨資產為基準/);
});

test('迴歸測試：紅／綠漸層座標範圍必須完整涵蓋該方向所有填色區域實際用到的 Y 座標，否則 SVG 預設 pad 規則會把範圍外的填色畫成透明——即使填色路徑本身幾何完全正確，畫面仍會呈現空白（此為實測 Preview 回饋發現的真實 Bug：綠色區域在明顯低於基準線時完全不顯示，紅色區域正常）', () => {
  const html = render([
    { date: '2026-07-11', value: 100 },
    { date: '2026-07-12', value: 130 },
    { date: '2026-07-13', value: 90 },
    { date: '2026-07-14', value: 60 },
    { date: '2026-07-15', value: 100 }
  ]);
  const gradients = extractGradientRanges(html);
  for (const direction of ['up', 'down'] as const) {
    const values = areaPathYValues(html, direction);
    assert.ok(values.length > 0, `本測試資料應同時產生 ${direction} 方向的填色區域`);
    const gradient = gradients[direction];
    assert.ok(gradient, `${direction} 方向有填色區域卻沒有對應的漸層定義`);
    const gradMin = Math.min(gradient.y1, gradient.y2), gradMax = Math.max(gradient.y1, gradient.y2);
    const shapeMin = Math.min(...values), shapeMax = Math.max(...values);
    assert.ok(shapeMin >= gradMin - 0.01, `${direction} 漸層下界 ${gradMin} 必須涵蓋填色區域最小 Y 座標 ${shapeMin}`);
    assert.ok(shapeMax <= gradMax + 0.01, `${direction} 漸層上界 ${gradMax} 必須涵蓋填色區域最大 Y 座標 ${shapeMax}（原始 Bug：down 方向漸層誤用了 up 方向的範圍，導致明顯低於基準線的區域落在漸層範圍外變成透明）`);
  }
});

test('保留既有單一連續折線 stroke 與資料點互動標記，本次改動不影響折線繪製方式本身', () => {
  const html = render([{ date: '2026-07-30', value: 100 }, { date: '2026-07-31', value: 120 }, { date: '2026-08-01', value: 150 }]);
  assert.equal(countOccurrences(html, 'stroke="currentColor"'), 1, '折線仍是單一連續 stroke，不因填色改動而被拆段繪製');
  assert.match(html, /class="trend-point"/);
  assert.equal(countOccurrences(html, '<circle'), 3);
});
