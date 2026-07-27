import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveHomeDecision, type HomeDecisionInput } from '../src/lib/homeDecision';

const BASE = {
  riskLevel: 0,
  rebalance: false,
  dip: false,
  wealthBehind: false,
  quotesMissing: false,
  targetInvalid: false,
  dataCompleteness: 'complete',
  safetyCashShortfall: 0,
  investableCash: 100
};

const run = (overrides: Record<string, unknown> = {}) => deriveHomeDecision({ ...BASE, ...overrides } as HomeDecisionInput);

test('資料不足時只回傳資料不足主決策，不讓後順位投資機會覆蓋', () => {
  const result = run({ dataCompleteness: 'insufficient', safetyCashShortfall: null, investableCash: null, rebalance: true, dip: true });

  assert.deepEqual(result.items, [result.primary]);
  assert.equal(result.primary.title, '資料不足');
  assert.equal(result.primary.reason, '目前缺少必要生活費或負債資料，無法安全計算可投資現金。');
  assert.doesNotMatch(result.primary.reason, /再平衡|加碼|\d+[,.]?\d* 元/);
});

test('必要流動性值為 null 時維持資料不足，不以 0 取代 unknown', () => {
  for (const overrides of [
    { safetyCashShortfall: null },
    { investableCash: null }
  ]) {
    const result = run({ ...overrides, rebalance: true, dip: true });
    assert.equal(result.primary.title, '資料不足');
    assert.deepEqual(result.items, [result.primary]);
  }
});

test('安全存量不足時只回傳阻擋投資的主決策', () => {
  const result = run({ safetyCashShortfall: 1, investableCash: 100, rebalance: true, dip: true, wealthBehind: true });

  assert.deepEqual(result.items, [result.primary]);
  assert.equal(result.primary.title, '現金安全存量不足');
  assert.equal(result.primary.reason, '現金安全存量不足，暫不產生可執行投資建議。');
  assert.doesNotMatch(`${result.primary.title} ${result.primary.reason}`, /再平衡|加碼/);
});

test('無可投資現金時只回傳保留現金主決策', () => {
  const result = run({ investableCash: 0, rebalance: true, dip: true });

  assert.deepEqual(result.items, [result.primary]);
  assert.equal(result.primary.title, '保留現金');
  assert.equal(result.primary.reason, '目前沒有可投資現金，建議先保留現金。');
  assert.doesNotMatch(`${result.primary.title} ${result.primary.reason}`, /再平衡|加碼/);
});

test('可投資現金存在時，配置偏離優先於逢低訊號', () => {
  const result = run({ investableCash: 1, rebalance: true, dip: true });

  assert.equal(result.primary.title, '建議再平衡');
});

test('只有前順位皆不成立時，才進入既有機會或維持持有', () => {
  assert.equal(run({ dip: true }).primary.title, '建議加碼');
  assert.equal(run().primary.title, '不需操作');
});

test('App 直接將既有 Household Liquidity 輸出傳給首頁決策', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

  assert.match(app, /dataCompleteness: householdLiquidityForRebalance\.dataCompleteness/);
  assert.match(app, /safetyCashShortfall: householdLiquidityForRebalance\.safetyCashShortfall/);
  assert.match(app, /investableCash: householdLiquidityForRebalance\.investableCash/);
  assert.doesNotMatch(app, /cashUnsafe:riskMetrics\.cashSafetyMonths/);
});
