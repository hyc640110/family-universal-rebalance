import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveHouseholdLiquidity,
  type HouseholdLiquidityInput,
  type HouseholdLiquidityReasonCode
} from '../src/lib/householdLiquidity';

const base = (overrides: Partial<HouseholdLiquidityInput> = {}): HouseholdLiquidityInput => ({
  liquidAccounts: [{ accountId: 'cash-1', balance: 100_000, status: 'available' }],
  livingExpenses: [{ sourceId: 'living-1', amount: 5_000, role: 'essential-living' }],
  loans: [],
  configuredBudget: 10_000,
  protectedSafetyMonths: 6,
  externalContribution: 0,
  plannedWithdrawal: 0,
  allowSafetyCashUsage: false,
  ...overrides
});

const codes = (input: HouseholdLiquidityInput) =>
  deriveHouseholdLiquidity(input).blockingReasons.map(reason => reason.code);

const hasCode = (input: HouseholdLiquidityInput, code: HouseholdLiquidityReasonCode) =>
  assert.ok(codes(input).includes(code), `expected ${code}`);

test('1. 有生活費、無借款時分開計算 flow', () => {
  const result = deriveHouseholdLiquidity(base());
  assert.equal(result.monthlyLivingExpenses, 5_000);
  assert.equal(result.monthlyDebtPayments, 0);
  assert.equal(result.monthlyEssentialExpenses, 5_000);
});

test('2. 有借款、無其他生活費時以 Loan monthlyPayment 為正式來源', () => {
  const result = deriveHouseholdLiquidity(base({
    livingExpenses: [{ sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' }],
    loans: [{ loanId: 'loan-1', monthlyPayment: 3_000 }]
  }));
  assert.equal(result.monthlyLivingExpenses, 0);
  assert.equal(result.monthlyDebtPayments, 3_000);
  assert.equal(result.monthlyEssentialExpenses, 3_000);
});

test('3. 有生活費與借款時正確相加', () => {
  const result = deriveHouseholdLiquidity(base({
    livingExpenses: [
      { sourceId: 'living-1', amount: 5_000, role: 'essential-living' },
      { sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' }
    ],
    loans: [{ loanId: 'loan-1', monthlyPayment: 3_000 }]
  }));
  assert.equal(result.monthlyEssentialExpenses, 8_000);
});

test('4. 最低安全存量固定為六個月', () => {
  const result = deriveHouseholdLiquidity(base());
  assert.equal(result.minimumSafetyCash, 30_000);
  assert.equal(result.effectiveProtectedMonths, 6);
  assert.equal(result.protectedSafetyCash, 30_000);
});

test('5. 穩定安全存量與十二個月保護值正確', () => {
  const result = deriveHouseholdLiquidity(base({ protectedSafetyMonths: 12 }));
  assert.equal(result.stableSafetyCash, 60_000);
  assert.equal(result.effectiveProtectedMonths, 12);
  assert.equal(result.protectedSafetyCash, 60_000);
});

test('6. configuredBudget 小於 investableCash 時全額可執行', () => {
  const result = deriveHouseholdLiquidity(base({ configuredBudget: 10_000 }));
  assert.equal(result.investableCash, 70_000);
  assert.equal(result.executableBudget, 10_000);
  assert.equal(result.externalFundingRequired, 0);
});

test('7. configuredBudget 大於 investableCash 時只使用可投資現金', () => {
  const result = deriveHouseholdLiquidity(base({ configuredBudget: 90_000 }));
  assert.equal(result.executableBudget, 70_000);
  assert.equal(result.externalFundingRequired, 20_000);
  assert.equal(result.canExecuteBuy, true);
});

test('8. 現金低於安全存量時產生缺口', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [{ accountId: 'cash-1', balance: 20_000, status: 'available' }] }));
  assert.equal(result.safetyCashShortfall, 10_000);
  assert.equal(result.investableCash, 0);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'SAFETY_CASH_INSUFFICIENT'));
});

test('9. 現金等於安全存量時無缺口但沒有可投資現金', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [{ accountId: 'cash-1', balance: 30_000, status: 'available' }] }));
  assert.equal(result.safetyCashShortfall, 0);
  assert.equal(result.investableCash, 0);
  assert.equal(result.canExecuteBuy, false);
});

test('10. 現金高於安全存量時差額才是 investableCash', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [{ accountId: 'cash-1', balance: 40_000, status: 'available' }] }));
  assert.equal(result.investableCash, 10_000);
});

test('11. 外部投入先補安全缺口再形成可投資現金', () => {
  const result = deriveHouseholdLiquidity(base({
    liquidAccounts: [{ accountId: 'cash-1', balance: 25_000, status: 'available' }],
    externalContribution: 10_000
  }));
  assert.equal(result.adjustedLiquidCash, 35_000);
  assert.equal(result.safetyCashShortfall, 0);
  assert.equal(result.investableCash, 5_000);
});

test('12. 計畫提款可使 investableCash 降為零', () => {
  const result = deriveHouseholdLiquidity(base({
    liquidAccounts: [{ accountId: 'cash-1', balance: 40_000, status: 'available' }],
    plannedWithdrawal: 10_000
  }));
  assert.equal(result.adjustedLiquidCash, 30_000);
  assert.equal(result.investableCash, 0);
});

test('13. 多個現金帳戶以 stock 餘額正確合計', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [
    { accountId: 'cash-1', balance: 60_000, status: 'available' },
    { accountId: 'cash-2', balance: 40_000, status: 'available' }
  ] }));
  assert.equal(result.totalLiquidCash, 100_000);
});

test('14. excluded expense 不納入任何必要支出', () => {
  const result = deriveHouseholdLiquidity(base({ livingExpenses: [
    { sourceId: 'living-1', amount: 5_000, role: 'essential-living' },
    { sourceId: 'optional-1', amount: 99_000, role: 'excluded' }
  ] }));
  assert.equal(result.monthlyLivingExpenses, 5_000);
  assert.equal(result.monthlyEssentialExpenses, 5_000);
});

test('15. linked Loan 正確去重且不把 Cash Flow 金額再加一次', () => {
  const result = deriveHouseholdLiquidity(base({
    livingExpenses: [
      { sourceId: 'living-1', amount: 5_000, role: 'essential-living' },
      { sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' }
    ],
    loans: [{ loanId: 'loan-1', monthlyPayment: 3_000 }]
  }));
  assert.equal(result.monthlyDebtPayments, 3_000);
  assert.equal(result.monthlyEssentialExpenses, 8_000);
});

test('16. 無現金帳戶不得以零表示成功', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [] }));
  assert.equal(result.totalLiquidCash, null);
  assert.equal(result.investableCash, null);
  assert.equal(result.dataCompleteness, 'insufficient');
  hasCode(base({ liquidAccounts: [] }), 'LIQUID_ACCOUNT_UNAVAILABLE');
});

test('17. account status unavailable 會阻擋計算', () => {
  const input = base({ liquidAccounts: [{ accountId: 'cash-1', balance: 100_000, status: 'unavailable' }] });
  const result = deriveHouseholdLiquidity(input);
  assert.equal(result.totalLiquidCash, null);
  hasCode(input, 'LIQUID_ACCOUNT_UNAVAILABLE');
});

test('18. balance null 保持未知而不是轉成零', () => {
  const input = base({ liquidAccounts: [{ accountId: 'cash-1', balance: null, status: 'available' }] });
  assert.equal(deriveHouseholdLiquidity(input).totalLiquidCash, null);
  hasCode(input, 'LIQUID_ACCOUNT_BALANCE_INVALID');
});

test('19. 生活費完全缺失會阻擋必要支出計算', () => {
  const input = base({ livingExpenses: [] });
  const result = deriveHouseholdLiquidity(input);
  assert.equal(result.monthlyLivingExpenses, null);
  assert.equal(result.protectedSafetyCash, null);
  hasCode(input, 'LIVING_EXPENSE_MISSING');
});

test('20. configuredBudget null 不得自動視為零', () => {
  const input = base({ configuredBudget: null });
  const result = deriveHouseholdLiquidity(input);
  assert.equal(result.configuredBudget, null);
  assert.equal(result.executableBudget, null);
  assert.equal(result.canExecuteBuy, false);
  hasCode(input, 'CONFIGURED_BUDGET_MISSING');
});

test('21. Loan monthlyPayment null 保持未知', () => {
  const input = base({
    livingExpenses: [{ sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' }],
    loans: [{ loanId: 'loan-1', monthlyPayment: null }]
  });
  assert.equal(deriveHouseholdLiquidity(input).monthlyDebtPayments, null);
  hasCode(input, 'LOAN_MONTHLY_PAYMENT_INVALID');
});

test('22. 全部必要輸入不足時所有金額不以零代替', () => {
  const input = {
    liquidAccounts: [], livingExpenses: [], configuredBudget: null,
    protectedSafetyMonths: Number.NaN, externalContribution: Number.NaN,
    plannedWithdrawal: Number.NaN, allowSafetyCashUsage: false
  } as unknown as HouseholdLiquidityInput;
  const result = deriveHouseholdLiquidity(input);
  for (const value of [result.totalLiquidCash, result.monthlyLivingExpenses, result.monthlyDebtPayments,
    result.monthlyEssentialExpenses, result.protectedSafetyCash, result.adjustedLiquidCash,
    result.investableCash, result.executableBudget]) assert.equal(value, null);
  assert.equal(result.dataCompleteness, 'insufficient');
  assert.equal(result.confidence, 'low');
});

test('23. 未連結 debt-payment 一律視為歧義', () => {
  const input = base({ livingExpenses: [{ sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment' }] });
  assert.equal(deriveHouseholdLiquidity(input).monthlyEssentialExpenses, null);
  hasCode(input, 'DEBT_PAYMENT_AMBIGUOUS');
});

test('24. housing 等來源標成 ambiguous 時不得猜測', () => {
  const input = base({ livingExpenses: [{ sourceId: 'housing-1', amount: 20_000, role: 'ambiguous' }] });
  assert.equal(deriveHouseholdLiquidity(input).monthlyLivingExpenses, null);
  hasCode(input, 'DEBT_PAYMENT_AMBIGUOUS');
});

test('25. 同一 Loan 多重連結會阻擋', () => {
  const input = base({
    livingExpenses: [
      { sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' },
      { sourceId: 'loan-flow-2', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' }
    ],
    loans: [{ loanId: 'loan-1', monthlyPayment: 3_000 }]
  });
  hasCode(input, 'DUPLICATE_LOAN_LINK');
  assert.equal(deriveHouseholdLiquidity(input).monthlyDebtPayments, null);
});

test('26. linkedLoanId 不存在會阻擋', () => {
  const input = base({ livingExpenses: [{ sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment', linkedLoanId: 'missing-loan' }] });
  hasCode(input, 'ORPHAN_LOAN_LINK');
});

test('27. Cash Flow debt 與 Loan 相同金額仍只計 Loan 一次', () => {
  const result = deriveHouseholdLiquidity(base({
    livingExpenses: [{ sourceId: 'loan-flow-1', amount: 4_321, role: 'debt-payment', linkedLoanId: 'loan-1' }],
    loans: [{ loanId: 'loan-1', monthlyPayment: 4_321 }]
  }));
  assert.equal(result.monthlyDebtPayments, 4_321);
  assert.equal(result.monthlyEssentialExpenses, 4_321);
});

test('28. 不依名稱或相同金額自動去重必要支出', () => {
  const result = deriveHouseholdLiquidity(base({ livingExpenses: [
    { sourceId: 'same-name-a', amount: 2_000, role: 'essential-living' },
    { sourceId: 'same-name-b', amount: 2_000, role: 'essential-living' }
  ] }));
  assert.equal(result.monthlyLivingExpenses, 4_000);
});

test('29. NaN 不得被吞成零', () => {
  const input = base({ livingExpenses: [{ sourceId: 'living-1', amount: Number.NaN, role: 'essential-living' }] });
  assert.equal(deriveHouseholdLiquidity(input).monthlyLivingExpenses, null);
  hasCode(input, 'LIVING_EXPENSE_INVALID');
});

test('30. Infinity 不得被吞成零', () => {
  const input = base({ configuredBudget: Number.POSITIVE_INFINITY });
  assert.equal(deriveHouseholdLiquidity(input).configuredBudget, null);
  hasCode(input, 'CONFIGURED_BUDGET_INVALID');
});

test('31. -Infinity 不得被吞成零', () => {
  const input = base({ externalContribution: Number.NEGATIVE_INFINITY });
  assert.equal(deriveHouseholdLiquidity(input).adjustedLiquidCash, null);
  hasCode(input, 'EXTERNAL_CONTRIBUTION_INVALID');
});

test('32. 負生活費無效', () => {
  const input = base({ livingExpenses: [{ sourceId: 'living-1', amount: -1, role: 'essential-living' }] });
  hasCode(input, 'LIVING_EXPENSE_INVALID');
});

test('33. 負 monthlyPayment 無效', () => {
  const input = base({
    livingExpenses: [{ sourceId: 'loan-flow-1', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' }],
    loans: [{ loanId: 'loan-1', monthlyPayment: -1 }]
  });
  hasCode(input, 'LOAN_MONTHLY_PAYMENT_INVALID');
});

test('34. 負 configuredBudget 無效', () => {
  const input = base({ configuredBudget: -1 });
  hasCode(input, 'CONFIGURED_BUDGET_INVALID');
  assert.equal(deriveHouseholdLiquidity(input).executableBudget, null);
});

test('35. 負 externalContribution 無效', () => {
  const input = base({ externalContribution: -1 });
  hasCode(input, 'EXTERNAL_CONTRIBUTION_INVALID');
});

test('36. 負 plannedWithdrawal 無效', () => {
  const input = base({ plannedWithdrawal: -1 });
  hasCode(input, 'PLANNED_WITHDRAWAL_INVALID');
});

test('37. protectedSafetyMonths 小於一或非有限值皆無效', () => {
  hasCode(base({ protectedSafetyMonths: 0 }), 'SAFETY_MONTHS_INVALID');
  hasCode(base({ protectedSafetyMonths: Number.NaN }), 'SAFETY_MONTHS_INVALID');
});

test('38. 小數與極大但有限金額保持精度且不被截斷', () => {
  const decimal = deriveHouseholdLiquidity(base({
    liquidAccounts: [{ accountId: 'cash-1', balance: 10_000.75, status: 'available' }],
    livingExpenses: [{ sourceId: 'living-1', amount: 100.25, role: 'essential-living' }],
    configuredBudget: 1_000.5
  }));
  assert.equal(decimal.protectedSafetyCash, 601.5);
  assert.equal(decimal.executableBudget, 1_000.5);
  const large = deriveHouseholdLiquidity(base({
    liquidAccounts: [{ accountId: 'cash-1', balance: 1e100, status: 'available' }],
    livingExpenses: [{ sourceId: 'living-1', amount: 1e90, role: 'essential-living' }],
    configuredBudget: 1e80
  }));
  assert.equal(large.canExecuteBuy, true);
});

test('39. 核心函式不 mutate input', () => {
  const input = base({ liquidAccounts: [
    { accountId: 'b', balance: 40_000, status: 'available' },
    { accountId: 'a', balance: 60_000, status: 'available' }
  ] });
  const before = structuredClone(input);
  deriveHouseholdLiquidity(input);
  assert.deepEqual(input, before);
});

test('40. 相同輸入產生 deterministic output', () => {
  const input = base();
  assert.deepEqual(deriveHouseholdLiquidity(input), deriveHouseholdLiquidity(input));
});

test('41. safetyCashShortfall 大於零時不可執行買入', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [{ accountId: 'cash-1', balance: 29_999, status: 'available' }] }));
  assert.equal(result.safetyCashShortfall, 1);
  assert.equal(result.canExecuteBuy, false);
});

test('42. investableCash 為零時不可執行買入', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [{ accountId: 'cash-1', balance: 30_000, status: 'available' }] }));
  assert.equal(result.investableCash, 0);
  assert.equal(result.canExecuteBuy, false);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'NO_INVESTABLE_CASH'));
});

test('43. executableBudget 大於零且無阻擋原因時可以買入', () => {
  const result = deriveHouseholdLiquidity(base());
  assert.equal(result.executableBudget, 10_000);
  assert.deepEqual(result.blockingReasons, []);
  assert.equal(result.canExecuteBuy, true);
});

test('44. configuredBudget 為零是明確計畫而非缺失，但不可執行', () => {
  const result = deriveHouseholdLiquidity(base({ configuredBudget: 0 }));
  assert.equal(result.configuredBudget, 0);
  assert.equal(result.executableBudget, 0);
  assert.equal(result.canExecuteBuy, false);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'CONFIGURED_BUDGET_ZERO'));
  assert.ok(!result.blockingReasons.some(reason => reason.code === 'CONFIGURED_BUDGET_MISSING'));
});

test('45. allowSafetyCashUsage 不得繞過受保護現金', () => {
  const input = { ...base(), allowSafetyCashUsage: true } as unknown as HouseholdLiquidityInput;
  const result = deriveHouseholdLiquidity(input);
  assert.equal(result.canExecuteBuy, false);
  assert.equal(result.investableCash, 70_000);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'SAFETY_CASH_USAGE_NOT_ALLOWED'));
});

test('46. 提款超過現金加外部投入時阻擋且不輸出負 adjusted cash', () => {
  const input = base({
    liquidAccounts: [{ accountId: 'cash-1', balance: 20_000, status: 'available' }],
    externalContribution: 5_000,
    plannedWithdrawal: 25_001
  });
  const result = deriveHouseholdLiquidity(input);
  assert.equal(result.adjustedLiquidCash, null);
  assert.equal(result.investableCash, null);
  hasCode(input, 'WITHDRAWAL_EXCEEDS_AVAILABLE_CASH');
});

test('47. 負現金餘額定義為無效 stock', () => {
  const input = base({ liquidAccounts: [{ accountId: 'cash-1', balance: -1, status: 'available' }] });
  assert.equal(deriveHouseholdLiquidity(input).totalLiquidCash, null);
  hasCode(input, 'LIQUID_ACCOUNT_BALANCE_INVALID');
});

test('48. loans 欄位缺失時不得假設沒有借款', () => {
  const input = { ...base() } as unknown as Record<string, unknown>;
  delete input.loans;
  const result = deriveHouseholdLiquidity(input as unknown as HouseholdLiquidityInput);
  assert.equal(result.monthlyDebtPayments, null);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'DEBT_PAYMENT_MISSING'));
});

test('49. 一到六個月設定皆以六個月為有效保護下限', () => {
  const result = deriveHouseholdLiquidity(base({ protectedSafetyMonths: 1 }));
  assert.equal(result.effectiveProtectedMonths, 6);
  assert.equal(result.protectedSafetyCash, 30_000);
});

test('50. 有限輸入造成算術溢位時明確阻擋', () => {
  const input = base({
    liquidAccounts: [{ accountId: 'cash-1', balance: 1e308, status: 'available' }],
    livingExpenses: [{ sourceId: 'living-1', amount: 1e308, role: 'essential-living' }],
    configuredBudget: 1
  });
  const result = deriveHouseholdLiquidity(input);
  assert.equal(result.protectedSafetyCash, null);
  assert.equal(result.canExecuteBuy, false);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'CALCULATION_OVERFLOW'));
});

test('51. Legacy CashItem 與 FinancialAccount 不得同時納入流動現金', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [
    { accountId: 'financial-1', balance: 60_000, status: 'available', source: 'financial-account' },
    { accountId: 'legacy-1', balance: 40_000, status: 'available', source: 'legacy-cash' }
  ] }));
  assert.equal(result.totalLiquidCash, null);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'MIXED_LIQUID_ACCOUNT_SOURCES'));
});

test('52. 重複 accountId 不得被重複加總', () => {
  const result = deriveHouseholdLiquidity(base({ liquidAccounts: [
    { accountId: 'cash-1', balance: 60_000, status: 'available' },
    { accountId: 'cash-1', balance: 40_000, status: 'available' }
  ] }));
  assert.equal(result.totalLiquidCash, null);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'DUPLICATE_LIQUID_ACCOUNT_ID'));
});

test('53. 重複生活費 sourceId 不得被重複加總', () => {
  const result = deriveHouseholdLiquidity(base({ livingExpenses: [
    { sourceId: 'living-1', amount: 2_000, role: 'essential-living' },
    { sourceId: 'living-1', amount: 3_000, role: 'essential-living' }
  ] }));
  assert.equal(result.monthlyLivingExpenses, null);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'DUPLICATE_LIVING_EXPENSE_SOURCE_ID'));
});
