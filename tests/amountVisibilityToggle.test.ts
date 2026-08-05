import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AmountVisibilityToggle from '../src/components/layout/AmountVisibilityToggle';
import { AmountVisibilityContext, useAmountsHidden } from '../src/components/layout/AmountVisibilityContext';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test('AmountVisibilityToggle 顯示狀態圖示、aria-pressed 與可切換的 active class', () => {
  const visible = renderToStaticMarkup(createElement(AmountVisibilityToggle, { hidden: false, onToggle: () => {} }));
  assert.match(visible, /aria-pressed="false"/);
  assert.match(visible, /aria-label="隱藏金額"/);
  assert.doesNotMatch(visible, /class="amount-visibility-toggle active"/);

  const hidden = renderToStaticMarkup(createElement(AmountVisibilityToggle, { hidden: true, onToggle: () => {} }));
  assert.match(hidden, /aria-pressed="true"/);
  assert.match(hidden, /aria-label="顯示金額"/);
  assert.match(hidden, /class="amount-visibility-toggle active"/);
});

function Probe() {
  const hidden = useAmountsHidden();
  return createElement('span', null, hidden ? 'HIDDEN' : 'VISIBLE');
}

test('useAmountsHidden 預設為 false（未包在 Provider 內時，例如單元測試環境）', () => {
  const html = renderToStaticMarkup(createElement(Probe));
  assert.match(html, /VISIBLE/);
});

test('useAmountsHidden 讀取 AmountVisibilityContext.Provider 提供的值', () => {
  const hiddenHtml = renderToStaticMarkup(
    createElement(AmountVisibilityContext.Provider, { value: true }, createElement(Probe))
  );
  assert.match(hiddenHtml, /HIDDEN/);

  const visibleHtml = renderToStaticMarkup(
    createElement(AmountVisibilityContext.Provider, { value: false }, createElement(Probe))
  );
  assert.match(visibleHtml, /VISIBLE/);
});
