import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CollapseEyeIcon from '../src/components/CollapseEyeIcon';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('CollapseEyeIcon 展開時渲染 Eye 圖示，收合時渲染 EyeOff 圖示', () => {
  const openHtml = renderToStaticMarkup(createElement(CollapseEyeIcon, { open: true }));
  const closedHtml = renderToStaticMarkup(createElement(CollapseEyeIcon, { open: false }));
  assert.notEqual(openHtml, closedHtml, 'open 與 closed 兩態必須渲染不同的圖示');
  assert.match(openHtml, /<svg/);
  assert.match(closedHtml, /<svg/);
});

test('CollapseEyeIcon 圖示為裝飾性（aria-hidden），不重複朗讀已有的文字標籤', () => {
  const html = renderToStaticMarkup(createElement(CollapseEyeIcon, { open: true }));
  assert.match(html, /aria-hidden="true"/);
});

test('CollapseEyeIcon 與 AmountVisibilityToggle 使用相同尺寸設定（size=20），維持全站圖示語言一致', () => {
  const html = renderToStaticMarkup(createElement(CollapseEyeIcon, { open: true }));
  assert.match(html, /width="20"/);
  assert.match(html, /height="20"/);
});
