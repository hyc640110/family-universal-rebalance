import assert from 'node:assert/strict';
import test from 'node:test';
import { AMOUNT_MASK_CHAR, displayAmount, displayEmbeddedAmounts, maskAmountText, maskEmbeddedAmountsText } from '../src/lib/amountVisibility';

test('maskAmountText 用固定字元取代每個數字，保留其餘字元與長度', () => {
  assert.equal(maskAmountText('12.3 萬元'), '●●.● 萬元');
  assert.equal(maskAmountText('+1,234 元'), '+●,●●● 元');
  assert.equal(maskAmountText('NT$300,000'), 'NT$●●●,●●●');
  assert.equal(maskAmountText('資料不足'), '資料不足');
});

test('maskAmountText 不使用模糊化，遮蔽前後字串長度相同', () => {
  const raw = '12.3 萬元';
  const masked = maskAmountText(raw);
  assert.equal(masked.length, raw.length);
  assert.notEqual(masked, raw);
});

test('displayAmount 依 hidden 旗標決定是否遮蔽', () => {
  assert.equal(displayAmount('12.3 萬元', false), '12.3 萬元');
  assert.equal(displayAmount('12.3 萬元', true), `${AMOUNT_MASK_CHAR}${AMOUNT_MASK_CHAR}.${AMOUNT_MASK_CHAR} 萬元`);
});

test('maskEmbeddedAmountsText 只遮蔽帶「元」／「萬元」單位的數字，不影響百分比、月份數或筆數', () => {
  const text = '目前現金可支應 6.5 個月必要支出（生活費＋借款還款）。安全存量仍有缺口 50,000 元。';
  const masked = maskEmbeddedAmountsText(text);
  assert.match(masked, /6\.5 個月/, '月份數不得被遮蔽');
  assert.doesNotMatch(masked, /50,000 元/, '金額必須被遮蔽');
  assert.match(masked, /[●]+,[●]+ 元/);
});

test('maskEmbeddedAmountsText 不影響百分比與資產筆數', () => {
  const text = '成長資產目前 79.0%，目標 79.0%，偏離 -79.0%；辨識到 3 項槓桿資產，占總資產 12.5%。';
  assert.equal(maskEmbeddedAmountsText(text), text, '不含「元」單位時應原樣保留');
});

test('maskEmbeddedAmountsText 正確處理正負號與萬元／元兩種單位混合的句子', () => {
  const text = '建議增加成長資產約 12.3 萬元；今日損益 +1,234 元，距目標仍差 -500 元。';
  const masked = maskEmbeddedAmountsText(text);
  assert.doesNotMatch(masked, /12\.3 萬元/);
  assert.doesNotMatch(masked, /\+1,234 元/);
  assert.doesNotMatch(masked, /-500 元/);
  assert.match(masked, /建議增加成長資產約/);
  assert.match(masked, /；今日損益/);
});

test('displayEmbeddedAmounts 依 hidden 旗標決定是否遮蔽，且不影響原字串長度', () => {
  const text = '目前現金可支應 6.5 個月必要支出。安全存量仍有缺口 50,000 元。';
  assert.equal(displayEmbeddedAmounts(text, false), text);
  const masked = displayEmbeddedAmounts(text, true);
  assert.notEqual(masked, text);
  assert.equal(masked.length, text.length);
});

test('maskAmountText 與 maskEmbeddedAmountsText 皆為純函式，不影響原字串（字串本身不可變，僅驗證回傳新值）', () => {
  const raw = '12.3 萬元';
  maskAmountText(raw);
  maskEmbeddedAmountsText(raw);
  assert.equal(raw, '12.3 萬元');
});
