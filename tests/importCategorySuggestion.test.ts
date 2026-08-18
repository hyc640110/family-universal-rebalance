import assert from 'node:assert/strict';
import test from 'node:test';
import { suggestImportCategory } from '../src/lib/importCategorySuggestion';

const suggested = (input: Parameters<typeof suggestImportCategory>[0], categoryId: string, reasonCode: string) => {
  const result = suggestImportCategory(input);
  assert.equal(result.kind, 'suggestion');
  if (result.kind === 'suggestion') {
    assert.equal(result.categoryId, categoryId);
    assert.equal(result.confidence, 'high');
    assert.ok(result.reasonCodes.includes(reasonCode));
    assert.ok(result.matchedRuleId);
  }
};

const none = (input: Parameters<typeof suggestImportCategory>[0], reasonCode: string) => {
  const result = suggestImportCategory(input);
  assert.equal(result.kind, 'none');
  assert.ok(result.reasonCodes.includes(reasonCode));
};

test('suggests only safe, deterministic income categories', () => {
  suggested({ transactionType: 'income', description: '薪資 入帳' }, 'income-salary', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'income', description: '帳戶 利息' }, 'income-interest', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'income', description: '股息 配發' }, 'income-dividend', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'income', description: '退款 入帳' }, 'income-refund', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'income', sourceCategory: ' income-salary ' }, 'income-salary', 'SOURCE_CATEGORY_MATCH');
});

test('suggests only safe, deterministic ordinary expense categories', () => {
  suggested({ transactionType: 'expense', description: '午餐 餐費' }, 'expense-food', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'expense', merchant: '計程車' }, 'expense-transport', 'MERCHANT_RULE_MATCH');
  suggested({ transactionType: 'expense', description: '房租' }, 'expense-housing', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'expense', description: '電費' }, 'expense-utilities', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'expense', description: '網路 月租' }, 'expense-communication', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'expense', description: '醫療 掛號費' }, 'expense-medical', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'expense', description: '保險 保費' }, 'expense-insurance', 'DESCRIPTION_RULE_MATCH');
  suggested({ transactionType: 'expense', description: '房屋稅' }, 'expense-tax', 'DESCRIPTION_RULE_MATCH');
});

test('normalizes Unicode, case, and whitespace without fuzzy matching', () => {
  suggested({ transactionType: 'income', description: '  SALARY\u3000入帳 ' }, 'income-salary', 'DESCRIPTION_RULE_MATCH');
  none({ transactionType: 'expense', description: '午' }, 'NO_RULE_MATCH');
  none({ transactionType: 'expense', description: '車加油' }, 'NO_RULE_MATCH');
});

test('high-risk semantic blocks always win over source and matching words', () => {
  none({ transactionType: 'income', description: '股票 股息 入帳', sourceCategory: 'income-dividend' }, 'HIGH_RISK_SEMANTIC');
  none({ transactionType: 'expense', description: '房貸 房租' }, 'HIGH_RISK_SEMANTIC');
  none({ transactionType: 'expense', description: '信用卡卡費 繳款' }, 'HIGH_RISK_SEMANTIC');
  none({ transactionType: 'expense', description: '信用卡付款 電費' }, 'HIGH_RISK_SEMANTIC');
  none({ transactionType: 'expense', description: '轉帳 電費' }, 'HIGH_RISK_SEMANTIC');
  none({ transactionType: 'expense', description: '外匯 換匯 稅費' }, 'HIGH_RISK_SEMANTIC');
});

test('fails closed for unsupported, forbidden, ambiguous, and conflicting candidates', () => {
  none({ transactionType: 'transfer', description: '薪資' }, 'UNSUPPORTED_TRANSACTION_TYPE');
  none({ transactionType: 'adjustment', description: '電費' }, 'UNSUPPORTED_TRANSACTION_TYPE');
  none({ transactionType: 'expense', sourceCategory: 'expense-other' }, 'NO_RULE_MATCH');
  none({ transactionType: 'expense', sourceCategory: 'expense-food', description: '電費' }, 'RULE_CONFLICT');
  none({ transactionType: 'expense', merchant: '計程車', description: '電費' }, 'RULE_CONFLICT');
  none({ transactionType: 'income', sourceCategory: 'income-salary', description: '股息' }, 'RULE_CONFLICT');
});

test('never emits fallback, investment, transfer, or adjustment categories', () => {
  for (const input of [
    { transactionType: 'income' as const, description: '未知收入' },
    { transactionType: 'expense' as const, description: '購物' },
    { transactionType: 'expense' as const, description: 'ETF buy' },
    { transactionType: 'transfer' as const, description: '帳戶轉帳' }
  ]) {
    const result = suggestImportCategory(input);
    assert.equal(result.kind, 'none');
  }
});
