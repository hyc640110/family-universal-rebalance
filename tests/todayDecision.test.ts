import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveTodayDecision, type TodayDecisionInput } from '../src/lib/todayDecision';

// UR-TODO-009 sub-PR 1 (Sprint 4 safety prep): characterization tests locking in the existing "今日決策"
// two-layer conclusion logic (data-availability check, then a flat priority chain led by lowCashSafety) BEFORE
// any rewrite into the 013 §11.2/§24.2 six-layer priority order, mirroring the V7.0B sub-PR 4a/5a approach for
// getOrderSuggestions/getDipAlertRows. deriveTodayDecision was moved out of src/App.tsx as a pure relocation
// (no logic change) specifically so this file can import and exercise the real production function —
// App.tsx cannot be imported by tests/*.test.ts at all, since it references import.meta.env at module scope,
// a Vite-only global that throws under the plain Node ESM runtime tsx --test uses.

const BASE: TodayDecisionInput = {
  totalAssets: 1_000_000,
  monthlyPayment: 0,
  repaymentSafetyMonths: Infinity,
  thresholdReached: false,
  triggeredDipAlertCount: 0,
  defensiveReminderStatus: 'ok',
  totalBuyAmount: 0
};

const run = (overrides: Partial<TodayDecisionInput> = {}) => deriveTodayDecision({ ...BASE, ...overrides });

test('is deterministic and does not mutate its input', () => {
  const input: TodayDecisionInput = { ...BASE, monthlyPayment: 10000, repaymentSafetyMonths: 2 };
  const before = structuredClone(input);
  const first = deriveTodayDecision(input);
  const second = deriveTodayDecision(input);
  assert.deepEqual(first, second);
  assert.deepEqual(input, before);
});

test('totalAssets 為 0 時，不論其他條件如何皆回傳「資料不足」，且不視為 dipTriggered 或 lowCashSafety 的例外', () => {
  const result = run({
    totalAssets: 0, monthlyPayment: 10000, repaymentSafetyMonths: 1,
    thresholdReached: true, triggeredDipAlertCount: 2, defensiveReminderStatus: 'under', totalBuyAmount: 50000
  });
  assert.equal(result.conclusion, '資料不足，暫時無法產生建議');
  // dipTriggered/lowCashSafety 仍依各自條件獨立計算，不因資料不足而被覆蓋為 false
  assert.equal(result.dipTriggered, true);
  assert.equal(result.lowCashSafety, true);
});

test('monthlyPayment > 0 且 repaymentSafetyMonths < 3 時，lowCashSafety 為現金不足並蓋過再平衡門檻、逢低訊號、防守提醒與可執行買單', () => {
  const result = run({
    monthlyPayment: 10000, repaymentSafetyMonths: 2.9,
    thresholdReached: true, triggeredDipAlertCount: 3, defensiveReminderStatus: 'under', totalBuyAmount: 100000
  });
  assert.equal(result.conclusion, '現金安全存量不足');
  assert.equal(result.lowCashSafety, true);
  assert.equal(result.dipTriggered, true);
});

test('repaymentSafetyMonths 剛好等於 3 個月時不觸發 lowCashSafety（邊界為嚴格小於）', () => {
  const result = run({ monthlyPayment: 10000, repaymentSafetyMonths: 3, thresholdReached: true });
  assert.equal(result.lowCashSafety, false);
  assert.equal(result.conclusion, '已達再平衡門檻');
});

test('monthlyPayment 為 0 時，即使 repaymentSafetyMonths 極小也不觸發 lowCashSafety', () => {
  const result = run({ monthlyPayment: 0, repaymentSafetyMonths: 0.1, thresholdReached: true });
  assert.equal(result.lowCashSafety, false);
  assert.equal(result.conclusion, '已達再平衡門檻');
});

test('thresholdReached 為 true 且 lowCashSafety 為 false 時回傳「已達再平衡門檻」，蓋過逢低訊號、防守提醒與可執行買單', () => {
  const result = run({ thresholdReached: true, triggeredDipAlertCount: 1, defensiveReminderStatus: 'under', totalBuyAmount: 100000 });
  assert.equal(result.conclusion, '已達再平衡門檻');
});

test('triggeredDipAlertCount > 0 時 dipTriggered 為 true 且回傳「建議分批加碼觀察」，蓋過防守提醒與可執行買單', () => {
  const result = run({ triggeredDipAlertCount: 1, defensiveReminderStatus: 'under', totalBuyAmount: 100000 });
  assert.equal(result.dipTriggered, true);
  assert.equal(result.conclusion, '建議分批加碼觀察');
});

test('triggeredDipAlertCount 為 0 時 dipTriggered 為 false', () => {
  const result = run({ triggeredDipAlertCount: 0 });
  assert.equal(result.dipTriggered, false);
});

test('defensiveReminderStatus 為 under 時回傳「防守資產不足」，蓋過可執行買單', () => {
  const result = run({ defensiveReminderStatus: 'under', totalBuyAmount: 100000 });
  assert.equal(result.conclusion, '防守資產不足');
});

test('defensiveReminderStatus 為 missing／over／ok 時不觸發防守資產不足分支', () => {
  for (const status of ['missing', 'over', 'ok'] as const) {
    const result = run({ defensiveReminderStatus: status, totalBuyAmount: 100000 });
    assert.equal(result.conclusion, '建議分批加碼');
  }
});

test('totalBuyAmount > 0 時（無更高優先分支成立）回傳「建議分批加碼」', () => {
  const result = run({ totalBuyAmount: 1 });
  assert.equal(result.conclusion, '建議分批加碼');
});

test('所有條件皆不成立時回傳「維持持有，暫不需要操作」', () => {
  const result = run();
  assert.equal(result.conclusion, '維持持有，暫不需要操作');
  assert.equal(result.dipTriggered, false);
  assert.equal(result.lowCashSafety, false);
});
