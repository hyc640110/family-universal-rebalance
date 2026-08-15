import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HomeFocusedAssetCard from '../src/components/HomeFocusedAssetCard';
import type { HomeFocusedAssetCardData } from '../src/lib/homeFocusedAssetCard';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const baseData: HomeFocusedAssetCardData = {
  symbol: '00631L', name: '元大台灣50正2', investableCash: 55_000,
  currentWeight: 5, targetWeight: 10, deviation: -5,
  status: 'action-needed', action: 'buy', recommendedAmount: 55_000, message: '依低配缺口由大到小分配可投入預算。',
};

function renderCard(data: HomeFocusedAssetCardData) {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomeFocusedAssetCard, { data })));
}

test('action-needed with a buy recommendation: shows the recommended amount, not the generic message', () => {
  const html = renderCard(baseData);
  assert.match(html, /元大台灣50正2/);
  assert.match(html, /00631L/);
  assert.match(html, /建議投入/);
  assert.match(html, /5\.5 萬元/);
  assert.doesNotMatch(html, /目前配置正常/);
});

test('normal status (threshold not reached): shows the no-action text and no amount', () => {
  const html = renderCard({ ...baseData, status: 'normal', action: null, recommendedAmount: null, message: '目前配置正常，不需操作。' });
  assert.match(html, /目前配置正常，不需操作。/);
  assert.doesNotMatch(html, /建議投入/);
  assert.doesNotMatch(html, /建議賣出/);
});

test('investableCash of 0 renders as an explicit zero amount, not a dash', () => {
  const html = renderCard({ ...baseData, investableCash: 0 });
  assert.match(html, /可投入現金<\/span> <b>0 元<\/b>/);
});

test('unavailable status when 00631L is missing from the configuration: no weight/deviation line, fallback message shown', () => {
  const html = renderCard({
    symbol: '00631L', name: null, investableCash: 50_000,
    currentWeight: null, targetWeight: null, deviation: null,
    status: 'unavailable', action: null, recommendedAmount: null,
    message: '00631L 目前不在配置中，請先於資產配置頁面設定目標比例。',
  });
  assert.match(html, /00631L 目前不在配置中/);
  assert.doesNotMatch(html, /目前配置 /);
});

test('links to the rebalance recommendation tool route', () => {
  const html = renderCard(baseData);
  assert.match(html, /href="\/tools\/rebalance-recommendation"/);
});
