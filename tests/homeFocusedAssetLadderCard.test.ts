import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveHomeFocusedAssetLadder, type HomeFocusedAssetLadderInput } from '../src/lib/homeFocusedAssetLadderCard';
import type { DipAlertLiquidityContext } from '../src/lib/dipAlertEngine';

const HAPPY_LIQUIDITY: DipAlertLiquidityContext = { investableCash: 80_000, dataCompleteness: 'complete', safetyCashShortfall: 0 };

const baseInput = (overrides: Partial<HomeFocusedAssetLadderInput> = {}): HomeFocusedAssetLadderInput => ({
  enabled: true, highWaterMark: 300, triggeredLevel: null, currentPrice: 285,
  liquidity: HAPPY_LIQUIDITY, executableBudget: 60_000, externalFundingRequired: 0,
  ...overrides,
});

test('disabled: unavailable status with an explanatory message, no numbers computed', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ enabled: false }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.drawdownPct, null);
  assert.equal(result.triggeredLevel, null);
  assert.equal(result.message, '尚未啟用逢低加碼自動追蹤。');
});

test('highWaterMark null (never tracked yet): unavailable with a waiting-for-quote message', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ highWaterMark: null }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.drawdownPct, null);
  assert.equal(result.message, '尚無報價資料，等待下一次有效報價後開始追蹤高點。');
});

test('currentPrice null (no live quote right now) but a high-water mark exists and no level triggered yet: unavailable', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ currentPrice: null, triggeredLevel: null }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.drawdownPct, null);
  assert.equal(result.highWaterMark, 300);
});

test('currentPrice null but a level was already triggered this cycle: stays action-needed (the triggered memory is not lost just because the live price is momentarily unknown)', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ currentPrice: null, triggeredLevel: 2 }));
  assert.equal(result.status, 'action-needed');
  assert.equal(result.triggeredLevel, 2);
  assert.equal(result.drawdownPct, null);
});

test('not triggered: computes live drawdown and the gap to the first level, no funding classification', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ highWaterMark: 300, currentPrice: 285, triggeredLevel: null }));
  assert.equal(result.status, 'normal');
  assert.equal(result.drawdownPct, -5);
  assert.equal(result.nextLevelGapPct, 5);
  assert.equal(result.fundingStatus, null);
  assert.equal(result.message, '距下一級門檻還差 5.0%。');
});

test('not triggered, price above the recorded high (in-flight before the bridge catches up): gap is the full 10%, never negative', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ highWaterMark: 300, currentPrice: 310, triggeredLevel: null }));
  assert.equal(result.nextLevelGapPct, 10);
});

test('triggered + executable funding: shows the level and full funding numbers, message names the level', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ highWaterMark: 300, currentPrice: 239, triggeredLevel: 2, liquidity: HAPPY_LIQUIDITY, executableBudget: 60_000, externalFundingRequired: 0 }));
  assert.equal(result.status, 'action-needed');
  assert.equal(result.triggeredLevel, 2);
  assert.equal(result.fundingStatus, 'executable');
  assert.equal(result.executableBudget, 60_000);
  assert.equal(result.nextLevelGapPct, null, 'no gap is shown once triggered');
  assert.equal(result.message, '已觸發第 2 級。');
});

test('triggered + data-insufficient liquidity: fundingStatus reflects it, message is the funding-limitation text', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({
    triggeredLevel: 1,
    liquidity: { investableCash: null, dataCompleteness: 'insufficient', safetyCashShortfall: null },
    executableBudget: null, externalFundingRequired: null,
  }));
  assert.equal(result.fundingStatus, 'data-insufficient');
  assert.equal(result.message, '家庭流動性資料不足，僅顯示逢低訊號，暫不產生買入建議。');
});

test('triggered + safety-cash-priority: message matches the existing dip-alert funding text verbatim', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({
    triggeredLevel: 1,
    liquidity: { investableCash: 0, dataCompleteness: 'complete', safetyCashShortfall: 12_000 },
    executableBudget: null, externalFundingRequired: null,
  }));
  assert.equal(result.fundingStatus, 'safety-cash-priority');
  assert.equal(result.message, '安全存量不足，建議優先補足安全現金，暫不產生買入建議。');
});

test('triggered + observe-only (zero investable cash, safety cash fine): message matches verbatim', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({
    triggeredLevel: 1,
    liquidity: { investableCash: 0, dataCompleteness: 'complete', safetyCashShortfall: 0 },
    executableBudget: null, externalFundingRequired: null,
  }));
  assert.equal(result.fundingStatus, 'observe-only');
  assert.equal(result.message, '可投資現金為 0，僅列入觀察，不產生買單。');
});

test('drawdownPct rounding matches dipLadderEngine.ts boundary handling (no floating-point drift at a round number)', () => {
  const result = deriveHomeFocusedAssetLadder(baseInput({ highWaterMark: 100, currentPrice: 90, triggeredLevel: null }));
  assert.equal(result.drawdownPct, -10);
});
