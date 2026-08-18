import type { TransactionType } from './transactions';

export const SAFE_IMPORT_SUGGESTION_CATEGORY_IDS = ['income-salary', 'income-interest', 'income-dividend', 'income-refund', 'expense-food', 'expense-transport', 'expense-housing', 'expense-utilities', 'expense-communication', 'expense-medical', 'expense-insurance', 'expense-tax'] as const;
export type SafeImportSuggestionCategoryId = typeof SAFE_IMPORT_SUGGESTION_CATEGORY_IDS[number];
export type ImportCategorySuggestionReasonCode = 'SOURCE_CATEGORY_MATCH' | 'MERCHANT_RULE_MATCH' | 'DESCRIPTION_RULE_MATCH' | 'HIGH_RISK_SEMANTIC' | 'UNSUPPORTED_TRANSACTION_TYPE' | 'NO_RULE_MATCH' | 'RULE_CONFLICT';
export type ImportCategorySuggestion = { kind: 'suggestion'; categoryId: SafeImportSuggestionCategoryId; confidence: 'high'; reasonCodes: ImportCategorySuggestionReasonCode[]; matchedRuleId: string } | { kind: 'none'; reasonCodes: ImportCategorySuggestionReasonCode[] };
export type ImportCategorySuggestionInput = { transactionType: TransactionType; description?: string; merchant?: string; sourceCategory?: string };
type Rule = { id: string; categoryId: SafeImportSuggestionCategoryId; transactionType: 'income' | 'expense'; terms: string[] };

const normalize = (value: unknown) => String(value ?? '').normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/g, ' ').trim();
const matches = (value: string, terms: string[]) => value && terms.some(term => value.includes(term));
const HIGH_RISK_TERMS = ['investment', 'stock', 'etf', 'fund', 'securities', 'buy', 'sell', '投資', '股票', '基金', '證券', '買入', '賣出', 'loan', '借款', '貸款', '房貸', '信貸', 'loan repayment', '還款', 'credit card payment', 'card payment', 'credit card', '信用卡', '卡費', 'transfer', '轉帳', '匯款', 'fx', 'foreign exchange', 'currency conversion', '外匯', '換匯'];
const SOURCE_CATEGORY_ALIASES: Record<string, SafeImportSuggestionCategoryId> = {
  'income-salary': 'income-salary', '薪資': 'income-salary', salary: 'income-salary', 'income-interest': 'income-interest', '利息': 'income-interest', interest: 'income-interest', 'income-dividend': 'income-dividend', '股息': 'income-dividend', dividend: 'income-dividend', 'income-refund': 'income-refund', '退款': 'income-refund', refund: 'income-refund',
  'expense-food': 'expense-food', '餐飲': 'expense-food', food: 'expense-food', 'expense-transport': 'expense-transport', '交通': 'expense-transport', transport: 'expense-transport', 'expense-housing': 'expense-housing', '居住': 'expense-housing', housing: 'expense-housing', 'expense-utilities': 'expense-utilities', '水電': 'expense-utilities', utilities: 'expense-utilities', 'expense-communication': 'expense-communication', '通訊': 'expense-communication', communication: 'expense-communication', 'expense-medical': 'expense-medical', '醫療': 'expense-medical', medical: 'expense-medical', 'expense-insurance': 'expense-insurance', '保險': 'expense-insurance', insurance: 'expense-insurance', 'expense-tax': 'expense-tax', '稅費': 'expense-tax', tax: 'expense-tax'
};
const RULES: Rule[] = [
  { id: 'income-salary-keyword', categoryId: 'income-salary', transactionType: 'income', terms: ['薪資', 'salary'] }, { id: 'income-interest-keyword', categoryId: 'income-interest', transactionType: 'income', terms: ['利息', 'interest'] }, { id: 'income-dividend-keyword', categoryId: 'income-dividend', transactionType: 'income', terms: ['股息', 'dividend'] }, { id: 'income-refund-keyword', categoryId: 'income-refund', transactionType: 'income', terms: ['退款', 'refund'] },
  { id: 'expense-food-keyword', categoryId: 'expense-food', transactionType: 'expense', terms: ['餐費', '午餐', '晚餐', '早餐', 'food'] }, { id: 'expense-transport-keyword', categoryId: 'expense-transport', transactionType: 'expense', terms: ['停車', '計程車', 'taxi'] }, { id: 'expense-housing-keyword', categoryId: 'expense-housing', transactionType: 'expense', terms: ['房租', '租金'] }, { id: 'expense-utilities-keyword', categoryId: 'expense-utilities', transactionType: 'expense', terms: ['電費', '水費', '瓦斯費', 'gas bill'] }, { id: 'expense-communication-keyword', categoryId: 'expense-communication', transactionType: 'expense', terms: ['網路', 'internet', '電話費', '手機費', '電信'] }, { id: 'expense-medical-keyword', categoryId: 'expense-medical', transactionType: 'expense', terms: ['掛號費', '醫療', 'medical'] }, { id: 'expense-insurance-keyword', categoryId: 'expense-insurance', transactionType: 'expense', terms: ['保費', 'insurance'] }, { id: 'expense-tax-keyword', categoryId: 'expense-tax', transactionType: 'expense', terms: ['所得稅', '房屋稅', '地價稅', '土地稅', '牌照稅', 'tax'] }
];
const categoryType = (categoryId: SafeImportSuggestionCategoryId) => categoryId.startsWith('income-') ? 'income' : 'expense';

export function suggestImportCategory(input: ImportCategorySuggestionInput): ImportCategorySuggestion {
  const description = normalize(input.description); const merchant = normalize(input.merchant); const sourceCategory = normalize(input.sourceCategory);
  if (matches(`${merchant} ${description} ${sourceCategory}`, HIGH_RISK_TERMS)) return { kind: 'none', reasonCodes: ['HIGH_RISK_SEMANTIC'] };
  if (input.transactionType !== 'income' && input.transactionType !== 'expense') return { kind: 'none', reasonCodes: ['UNSUPPORTED_TRANSACTION_TYPE'] };
  const sourceMatch = sourceCategory ? SOURCE_CATEGORY_ALIASES[sourceCategory] : undefined;
  if (sourceCategory && (!sourceMatch || categoryType(sourceMatch) !== input.transactionType)) return { kind: 'none', reasonCodes: ['NO_RULE_MATCH'] };
  const candidates = [
    ...(sourceMatch ? [{ categoryId: sourceMatch, reasonCode: 'SOURCE_CATEGORY_MATCH' as const, ruleId: `source-${sourceMatch}` }] : []),
    ...RULES.filter(rule => rule.transactionType === input.transactionType && matches(merchant, rule.terms)).map(rule => ({ categoryId: rule.categoryId, reasonCode: 'MERCHANT_RULE_MATCH' as const, ruleId: rule.id })),
    ...RULES.filter(rule => rule.transactionType === input.transactionType && matches(description, rule.terms)).map(rule => ({ categoryId: rule.categoryId, reasonCode: 'DESCRIPTION_RULE_MATCH' as const, ruleId: rule.id }))
  ];
  const categories = [...new Set(candidates.map(candidate => candidate.categoryId))];
  if (!categories.length) return { kind: 'none', reasonCodes: ['NO_RULE_MATCH'] };
  if (categories.length !== 1) return { kind: 'none', reasonCodes: ['RULE_CONFLICT'] };
  const selected = candidates.find(candidate => candidate.categoryId === categories[0])!;
  return { kind: 'suggestion', categoryId: selected.categoryId, confidence: 'high', reasonCodes: [selected.reasonCode], matchedRuleId: selected.ruleId };
}

export const importCategorySuggestionReasonLabel = (reasonCode: ImportCategorySuggestionReasonCode) => ({ SOURCE_CATEGORY_MATCH: '來源類別符合安全規則', MERCHANT_RULE_MATCH: '商家符合規則', DESCRIPTION_RULE_MATCH: '描述符合規則', HIGH_RISK_SEMANTIC: '高風險語意，未建議分類', UNSUPPORTED_TRANSACTION_TYPE: '非一般收入／支出，未建議分類', NO_RULE_MATCH: '沒有安全且明確的分類規則', RULE_CONFLICT: '規則結果衝突，未建議分類' })[reasonCode];
