import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { formatWanInput, formatYuanInput, parseWanInput, parseYuanInput, wanToYuan, yuanToWan } from '../src/lib/cashFlow';

test('parseYuanInput accepts whole and sub-1000 amounts without any 萬-unit conversion', () => {
  assert.equal(parseYuanInput('600'), 600, '百元級金額（600 元）可直接精確輸入，不再受萬元換算限制');
  assert.equal(parseYuanInput('55'), 55);
  assert.equal(parseYuanInput('0'), 0);
  assert.equal(parseYuanInput('1500.4'), 1500, '四捨五入到整數元');
  assert.equal(parseYuanInput('1500.5'), 1501, '四捨五入到整數元');
  assert.equal(parseYuanInput(''), null, '空字串視為未設定');
  assert.equal(parseYuanInput('-10'), null, '負數一律拒絕');
  assert.equal(parseYuanInput('abc'), null, '非數字一律拒絕');
});

test('formatYuanInput renders the stored 元 value directly with no ÷10000 conversion', () => {
  assert.equal(formatYuanInput(600), '600');
  assert.equal(formatYuanInput(0), '0');
  assert.equal(formatYuanInput(15000), '15000', '既有以萬元輸入產生的資料（例如 1.5 萬 = 15000 元）重新載入後應完整顯示為元，不遺失精度');
  assert.equal(formatYuanInput(null), '');
  assert.equal(formatYuanInput(undefined), '');
  assert.equal(formatYuanInput(Number.NaN), '');
});

test('parseYuanInput/formatYuanInput round-trip existing 元-denominated data exactly', () => {
  for (const stored of [0, 600, 15000, 123456]) {
    assert.equal(parseYuanInput(formatYuanInput(stored)), stored);
  }
});

test('wanToYuan/yuanToWan (Household Liquidity Plan Input contract) remain untouched by the 元-unit change', () => {
  assert.equal(wanToYuan('1.5'), 15000, '萬元→元換算係數與四捨五入規則不變');
  assert.equal(yuanToWan(15000), '1.5', '元→萬元顯示換算不變');
  assert.equal(formatWanInput, yuanToWan, 'formatWanInput 仍是 yuanToWan 的別名，供 Plan Input 欄位使用');
  assert.equal(parseWanInput, wanToYuan, 'parseWanInput 仍是 wanToYuan 的別名，供 Plan Input 欄位使用');
});

test('UR: CashFlowPage renders 每月收入／每月預定投資金額／固定支出金額 in 元, while Plan Input fields stay in 萬元', () => {
  const source = readFileSync(new URL('../src/pages/CashFlowPage.tsx', import.meta.url), 'utf8');
  assert.match(source, /YuanField label="每月收入（元）"/);
  assert.match(source, /YuanField label="每月預定投資金額（元）"/);
  assert.match(source, /YuanField label="每月金額（元）"/);
  assert.doesNotMatch(source, /（萬元）"\s*value=\{draft\.monthlyIncome\}/);
  assert.doesNotMatch(source, /（萬元）"\s*value=\{draft\.monthlyInvestmentBudget\}/);
  assert.doesNotMatch(source, /（萬元）"\s*value=\{item\.amount\}/);
  // The Household Liquidity Plan Input fields (out of scope) must be untouched.
  assert.match(source, /PlanInputField label="額外投入資金（萬元）"/);
  assert.match(source, /PlanInputField label="預計提領資金（萬元）"/);
  assert.match(source, /formatWanInput\(draft\.externalContribution\)/);
  assert.match(source, /formatWanInput\(draft\.plannedWithdrawal\)/);
});
