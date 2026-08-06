import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TargetValuePair from '../src/components/TargetValuePair';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('TargetValuePair 預設標籤為「目前」／「目標」，並排渲染兩個值', () => {
  const html = renderToStaticMarkup(createElement(TargetValuePair, { currentValue: '6.4%', targetValue: '50.0%' }));
  assert.match(html, /<small>目前<\/small><strong[^>]*>6\.4%<\/strong>/);
  assert.match(html, /<small>目標<\/small><strong>50\.0%<\/strong>/);
  assert.match(html, /class="target-value-pair-arrow"/);
});

test('TargetValuePair 可自訂 currentLabel／targetLabel，保留呼叫端原本文案', () => {
  const html = renderToStaticMarkup(createElement(TargetValuePair, {
    currentLabel: '目前淨資產',
    currentValue: '350.0 萬元',
    targetLabel: '目標資產',
    targetValue: '1,000.0 萬元'
  }));
  assert.match(html, /<small>目前淨資產<\/small><strong[^>]*>350\.0 萬元<\/strong>/);
  assert.match(html, /<small>目標資產<\/small><strong>1,000\.0 萬元<\/strong>/);
});

test('TargetValuePair 是純呈現元件：傳入已遮蔽字串時逐字輸出，不自行格式化或重新遮蔽', () => {
  const html = renderToStaticMarkup(createElement(TargetValuePair, { currentValue: '●●.● 萬元', targetValue: '●●●.● 萬元' }));
  assert.match(html, /●●\.● 萬元/);
  assert.match(html, /●●●\.● 萬元/);
});

test('TargetValuePair 可選的 currentTone class 只套用在目前值，不影響目標值', () => {
  const html = renderToStaticMarkup(createElement(TargetValuePair, { currentValue: '-43.6%', targetValue: '0.0%', currentTone: 'bad' }));
  assert.match(html, /<strong class="bad">-43\.6%<\/strong>/);
  assert.doesNotMatch(html, /<strong class="bad">0\.0%<\/strong>/);
});
