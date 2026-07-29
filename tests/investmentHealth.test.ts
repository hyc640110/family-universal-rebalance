import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveInvestmentHealth, type InvestmentHealthInput } from '../src/lib/investmentHealth';

// UR-TODO-009 sub-PR 2 (Sprint 4 safety prep): characterization tests locking in the existing Analytics
// "風險提醒" (investmentHealth) logic — the threshold-driven status/tone/reason/suggestion chain, plus the
// liquidity-risk override block (monthlyPayment > 0 && repaymentSafetyMonths < 3) — BEFORE that override is
// replaced with a Household Liquidity safetyCashShortfall check. Mirrors tests/todayDecision.test.ts
// (sub-PR 1) and the V7.0B sub-PR 4a/5a characterization approach. deriveInvestmentHealth was moved out of
// src/App.tsx as a pure relocation (no logic change) specifically so this file can import and exercise the
// real production function — App.tsx cannot be imported by tests/*.test.ts at all, since it references
// import.meta.env at module scope, a Vite-only global that throws under the plain Node ESM runtime tsx --test
// uses.

const BASE: InvestmentHealthInput = {
  totalAssets: 1_000_000,
  growthTargetPct: 60,
  growth: 600_000,
  cash: 400_000,
  monthlyPayment: 0,
  repaymentSafetyMonths: Infinity,
  deviation: 0,
  defensiveTarget: 400_000,
  defensiveCurrent: 400_000,
  thresholdReached: false,
  threshold: 5,
  mode: 'standard'
};

const run = (overrides: Partial<InvestmentHealthInput> = {}) => deriveInvestmentHealth({ ...BASE, ...overrides });

test('is deterministic and does not mutate its input', () => {
  const input: InvestmentHealthInput = { ...BASE, thresholdReached: true, deviation: 12 };
  const before = structuredClone(input);
  const first = deriveInvestmentHealth(input);
  const second = deriveInvestmentHealth(input);
  assert.deepEqual(first, second);
  assert.deepEqual(input, before);
});

test('thresholdReached 為 false 時回傳「正常」，維持目前配置', () => {
  const result = run({ thresholdReached: false, deviation: 20 });
  assert.deepEqual(result, { status: '正常', tone: 'good', reason: '目前配置尚未達再平衡門檻。', suggestion: '維持目前配置。' });
});

test('deviation >= 10 時回傳「槓桿風險提高」（bad）', () => {
  const result = run({ thresholdReached: true, deviation: 10 });
  assert.equal(result.status, '槓桿風險提高');
  assert.equal(result.tone, 'bad');
  assert.equal(result.reason, '成長資產高於目標 10.0%，已超過 10%。');
});

test('absDeviation >= 10 且 deviation 為負（低於目標）時回傳「偏離過大」，文案使用「低於」', () => {
  const result = run({ thresholdReached: true, deviation: -12 });
  assert.equal(result.status, '偏離過大');
  assert.equal(result.tone, 'bad');
  assert.equal(result.reason, '成長資產低於目標 12.0%，偏離幅度已達 10%。');
  assert.equal(result.suggestion, '依目前再平衡模式分批補足成長資產。');
});

test('deviation >= 10 分支優先於 absDeviation >= 10 分支：正偏離只要達 10% 一律落入「槓桿風險提高」', () => {
  // 既有分支順序使 absDeviation >= 10 分支內的 overTarget（「高於」文案）在任何輸入下都無法被觸發，
  // 因為能進入該分支代表 deviation < 10 且 |deviation| >= 10，即 deviation 必為 <= -10（underTarget 恆真）。
  const result = run({ thresholdReached: true, deviation: 15 });
  assert.equal(result.status, '槓桿風險提高');
});

test('stockDiff > 0 且現金不足以補足目標差額時回傳「現金不足」（warn）', () => {
  // growthTargetPct 60% * totalAssets 1,000,000 = 600,000 目標；growth 400,000 → stockDiff = 200,000
  // deviation 設為未達 10% 門檻但仍達 thresholdReached，cash 小於 stockDiff
  const result = run({ thresholdReached: true, deviation: -6, growth: 400_000, growthTargetPct: 60, totalAssets: 1_000_000, cash: 100_000 });
  assert.equal(result.status, '現金不足');
  assert.equal(result.tone, 'warn');
  assert.equal(result.reason, '成長資產低於目標 6.0%，可用現金不足以補足目標差額。');
  assert.equal(result.suggestion, '先累積現金，再分批買入成長資產。');
});

test('overTarget 且防守缺口 > 0 時回傳「注意」，buy-only 模式建議暫停加碼', () => {
  const result = run({ thresholdReached: true, deviation: 6, defensiveTarget: 500_000, defensiveCurrent: 300_000, mode: 'buy-only' });
  assert.equal(result.status, '注意');
  assert.equal(result.tone, 'warn');
  assert.equal(result.suggestion, '暫停加碼成長資產，優先累積現金或防守標的。');
});

test('overTarget 且防守缺口 > 0 時，standard 模式建議可依標準再平衡增加現金或防守標的', () => {
  const result = run({ thresholdReached: true, deviation: 6, defensiveTarget: 500_000, defensiveCurrent: 300_000, mode: 'standard' });
  assert.equal(result.suggestion, '可依標準再平衡增加現金或防守標的。');
});

test('其餘情況（underTarget 或防守缺口為 0）落入預設「注意」分支，建議依目前模式分批補足成長資產', () => {
  const result = run({ thresholdReached: true, deviation: -6, growth: 900_000, totalAssets: 1_000_000, cash: 1_000_000, defensiveTarget: 100_000, defensiveCurrent: 100_000 });
  assert.equal(result.status, '注意');
  assert.equal(result.tone, 'warn');
  assert.equal(result.suggestion, '可依目前再平衡模式分批補足成長資產。');
});

test('monthlyPayment > 0 且 repaymentSafetyMonths < 3 時，流動性風險覆蓋非 bad 的既有結果為「現金不足」', () => {
  const result = run({ thresholdReached: false, monthlyPayment: 10000, repaymentSafetyMonths: 2 });
  assert.equal(result.status, '現金不足');
  assert.equal(result.tone, 'warn');
  assert.equal(result.reason, '目前防守現金僅夠支應未來 2.0 個月的信貸還款，還款準備金偏低，請注意流動性風險。');
  assert.equal(result.suggestion, '暫停任何投資性加碼，優先累積防守現金準備金。');
});

test('流動性風險覆蓋不會蓋過既有的 bad 等級結果（例如槓桿風險提高）', () => {
  const result = run({ thresholdReached: true, deviation: 15, monthlyPayment: 10000, repaymentSafetyMonths: 1 });
  assert.equal(result.status, '槓桿風險提高');
  assert.equal(result.tone, 'bad');
});

test('repaymentSafetyMonths 剛好等於 3 個月時不觸發流動性風險覆蓋（邊界為嚴格小於）', () => {
  const result = run({ thresholdReached: false, monthlyPayment: 10000, repaymentSafetyMonths: 3 });
  assert.equal(result.status, '正常');
  assert.equal(result.tone, 'good');
});

test('monthlyPayment 為 0 時，即使 repaymentSafetyMonths 極小也不觸發流動性風險覆蓋', () => {
  const result = run({ thresholdReached: false, monthlyPayment: 0, repaymentSafetyMonths: 0.1 });
  assert.equal(result.status, '正常');
  assert.equal(result.tone, 'good');
});
