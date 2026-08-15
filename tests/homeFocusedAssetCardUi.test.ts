import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HomeFocusedAssetCard from '../src/components/HomeFocusedAssetCard';
import type { HomeFocusedAssetCardData } from '../src/lib/homeFocusedAssetCard';
import type { HomeFocusedAssetLadderData } from '../src/lib/homeFocusedAssetLadderCard';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const baseData: HomeFocusedAssetCardData = {
  symbol: '00631L', name: '元大台灣50正2', investableCash: 55_000,
  currentWeight: 5, targetWeight: 10, deviation: -5,
  status: 'action-needed', action: 'buy', recommendedAmount: 55_000, message: '依低配缺口由大到小分配可投入預算。',
};

// UR-TODO-057 sub-PR 2: HomeFocusedAssetCard now also renders the ladder block, so every
// renderCard() call needs a `ladder` prop — this baseline is deliberately "normal/not-triggered"
// so the pre-existing (UR-TODO-059) tests above stay focused on the rebalance block only.
const baseLadder: HomeFocusedAssetLadderData = {
  highWaterMark: 300, currentPrice: 285, drawdownPct: -5, triggeredLevel: null, nextLevelGapPct: 5,
  status: 'normal', fundingStatus: null, investableCash: 55_000, executableBudget: null, externalFundingRequired: null,
  message: '距下一級門檻還差 5.0%。',
};

function renderCard(data: HomeFocusedAssetCardData | null, ladder: HomeFocusedAssetLadderData | null = baseLadder) {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomeFocusedAssetCard, { data, ladder })));
}

// UR-TODO-061: no focused symbol selected (AppState.focusedSymbols is empty) — mirrors
// CreditCardDueSoonCard's "no items → render nothing" convention, no empty-state shell.
test('no data (nothing focused): renders nothing at all', () => {
  const html = renderCard(null, null);
  assert.equal(html, '', 'must not render any placeholder/empty-state chrome');
});

test('data present but ladder null (should not happen in practice, but defensive): still renders nothing', () => {
  const html = renderCard(baseData, null);
  assert.equal(html, '');
});

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

// --- ladder block (UR-TODO-057 sub-PR 2) ---

test('ladder not triggered: shows high/price/drawdown and the gap-to-next-level message, no amount', () => {
  const html = renderCard(baseData, baseLadder);
  assert.match(html, /300\.00 元/);
  assert.match(html, /285\.00 元/);
  assert.match(html, /距下一級門檻還差 5\.0%/);
  assert.doesNotMatch(html, /已觸發第/);
});

test('ladder triggered with executable funding: shows the level number and the executable budget amount, not the funding-limitation message', () => {
  const triggered: HomeFocusedAssetLadderData = {
    highWaterMark: 300, currentPrice: 239, drawdownPct: -20.33, triggeredLevel: 2, nextLevelGapPct: null,
    status: 'action-needed', fundingStatus: 'executable', investableCash: 80_000, executableBudget: 60_000, externalFundingRequired: 0,
    message: '已觸發第 2 級。',
  };
  const html = renderCard(baseData, triggered);
  assert.match(html, /已觸發第 2 級/);
  assert.match(html, /6 萬元/);
  assert.doesNotMatch(html, /安全存量不足|可投資現金為 0|家庭流動性資料不足/);
});

test('ladder triggered but safety-cash-priority: shows the level and the funding-limitation message, no amount', () => {
  const triggered: HomeFocusedAssetLadderData = {
    highWaterMark: 300, currentPrice: 239, drawdownPct: -20.33, triggeredLevel: 2, nextLevelGapPct: null,
    status: 'action-needed', fundingStatus: 'safety-cash-priority', investableCash: 0, executableBudget: null, externalFundingRequired: null,
    message: '安全存量不足，建議優先補足安全現金，暫不產生買入建議。',
  };
  const html = renderCard(baseData, triggered);
  assert.match(html, /已觸發第 2 級/);
  assert.match(html, /安全存量不足，建議優先補足安全現金，暫不產生買入建議。/);
});

test('ladder unavailable (no high-water mark yet): shows the waiting-for-quote message, no undefined/broken output', () => {
  const notTracking: HomeFocusedAssetLadderData = {
    highWaterMark: null, currentPrice: null, drawdownPct: null, triggeredLevel: null, nextLevelGapPct: null,
    status: 'unavailable', fundingStatus: null, investableCash: 55_000, executableBudget: null, externalFundingRequired: null,
    message: '尚無報價資料，等待下一次有效報價後開始追蹤高點。',
  };
  const html = renderCard(baseData, notTracking);
  assert.match(html, /尚無報價資料，等待下一次有效報價後開始追蹤高點。/);
  assert.doesNotMatch(html, /undefined/);
  assert.doesNotMatch(html, /NaN/);
});
