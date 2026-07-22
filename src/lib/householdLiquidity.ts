export type HouseholdLiquidityAccount = {
  accountId: string;
  balance: number | null;
  status: 'available' | 'unavailable';
  source?: 'financial-account' | 'legacy-cash';
};

export type HouseholdLivingExpense = {
  sourceId: string;
  amount: number | null;
  role: 'essential-living' | 'debt-payment' | 'excluded' | 'ambiguous';
  linkedLoanId?: string;
};

export type HouseholdLoan = {
  loanId: string;
  monthlyPayment: number | null;
};

export type HouseholdLiquidityInput = {
  liquidAccounts: ReadonlyArray<HouseholdLiquidityAccount>;
  livingExpenses: ReadonlyArray<HouseholdLivingExpense>;
  loans: ReadonlyArray<HouseholdLoan>;
  configuredBudget: number | null;
  protectedSafetyMonths: number;
  externalContribution: number;
  plannedWithdrawal: number;
  allowSafetyCashUsage: false;
};

export type HouseholdLiquidityReasonCode =
  | 'LIQUID_ACCOUNT_UNAVAILABLE'
  | 'LIQUID_ACCOUNT_BALANCE_INVALID'
  | 'DUPLICATE_LIQUID_ACCOUNT_ID'
  | 'MIXED_LIQUID_ACCOUNT_SOURCES'
  | 'LIVING_EXPENSE_MISSING'
  | 'LIVING_EXPENSE_INVALID'
  | 'DUPLICATE_LIVING_EXPENSE_SOURCE_ID'
  | 'DEBT_PAYMENT_MISSING'
  | 'DEBT_PAYMENT_AMBIGUOUS'
  | 'DUPLICATE_LOAN_LINK'
  | 'ORPHAN_LOAN_LINK'
  | 'LOAN_MONTHLY_PAYMENT_INVALID'
  | 'CONFIGURED_BUDGET_MISSING'
  | 'CONFIGURED_BUDGET_INVALID'
  | 'SAFETY_MONTHS_INVALID'
  | 'EXTERNAL_CONTRIBUTION_INVALID'
  | 'PLANNED_WITHDRAWAL_INVALID'
  | 'WITHDRAWAL_EXCEEDS_AVAILABLE_CASH'
  | 'SAFETY_CASH_INSUFFICIENT'
  | 'CONFIGURED_BUDGET_ZERO'
  | 'NO_INVESTABLE_CASH'
  | 'SAFETY_CASH_USAGE_NOT_ALLOWED'
  | 'CALCULATION_OVERFLOW';

export type HouseholdLiquidityBlockingReason = {
  code: HouseholdLiquidityReasonCode;
  message: string;
  sourceIds: string[];
};

export type HouseholdLiquidityOutput = {
  totalLiquidCash: number | null;
  monthlyLivingExpenses: number | null;
  monthlyDebtPayments: number | null;
  monthlyEssentialExpenses: number | null;
  minimumSafetyCash: number | null;
  stableSafetyCash: number | null;
  effectiveProtectedMonths: number | null;
  protectedSafetyCash: number | null;
  safetyCashShortfall: number | null;
  adjustedLiquidCash: number | null;
  investableCash: number | null;
  configuredBudget: number | null;
  executableBudget: number | null;
  externalFundingRequired: number | null;
  dataCompleteness: 'complete' | 'partial' | 'insufficient';
  confidence: 'high' | 'medium' | 'low';
  canExecuteBuy: boolean;
  blockingReasons: HouseholdLiquidityBlockingReason[];
};

const reasonMessages: Record<HouseholdLiquidityReasonCode, string> = {
  LIQUID_ACCOUNT_UNAVAILABLE: '缺少可用的流動現金帳戶，或帳戶狀態不可用。',
  LIQUID_ACCOUNT_BALANCE_INVALID: '流動現金帳戶餘額必須是大於或等於零的有限數值。',
  DUPLICATE_LIQUID_ACCOUNT_ID: '流動現金輸入包含重複 accountId。',
  MIXED_LIQUID_ACCOUNT_SOURCES: 'Legacy CashItem 與 FinancialAccount 不得同時納入流動現金。',
  LIVING_EXPENSE_MISSING: '缺少生活費來源，無法確認每月必要生活費。',
  LIVING_EXPENSE_INVALID: '生活費金額或來源識別無效。',
  DUPLICATE_LIVING_EXPENSE_SOURCE_ID: '生活費輸入包含重複 sourceId。',
  DEBT_PAYMENT_MISSING: '缺少借款清單，不能假設家庭沒有每月借款還款。',
  DEBT_PAYMENT_AMBIGUOUS: '借款還款來源存在歧義，必須明確連結 Loan。',
  DUPLICATE_LOAN_LINK: '同一 Loan 被多個 Cash Flow debt item 連結。',
  ORPHAN_LOAN_LINK: 'Cash Flow debt item 連結到不存在的 Loan。',
  LOAN_MONTHLY_PAYMENT_INVALID: 'Loan monthlyPayment 必須是大於或等於零的有限數值。',
  CONFIGURED_BUDGET_MISSING: '缺少使用者設定的買入預算。',
  CONFIGURED_BUDGET_INVALID: '買入預算必須是大於或等於零的有限數值。',
  SAFETY_MONTHS_INVALID: '安全存量月數必須是大於或等於一的有限數值。',
  EXTERNAL_CONTRIBUTION_INVALID: '外部新增資金必須是大於或等於零的有限數值。',
  PLANNED_WITHDRAWAL_INVALID: '計畫提款必須是大於或等於零的有限數值。',
  WITHDRAWAL_EXCEEDS_AVAILABLE_CASH: '計畫提款超過流動現金與外部新增資金合計。',
  SAFETY_CASH_INSUFFICIENT: '調整後流動現金低於受保護安全存量。',
  CONFIGURED_BUDGET_ZERO: '買入預算明確設定為零，本次沒有可執行買入金額。',
  NO_INVESTABLE_CASH: '扣除受保護安全存量後沒有可投資現金。',
  SAFETY_CASH_USAGE_NOT_ALLOWED: '受保護安全現金不可被設定為可投資資金。',
  CALCULATION_OVERFLOW: '輸入雖為有限數值，但計算結果超出可表示範圍。'
};

const reasonOrder = Object.keys(reasonMessages) as HouseholdLiquidityReasonCode[];
const finiteNonnegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const stableIds = (ids: Iterable<string>) => [...new Set(ids)].filter(Boolean).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

type ReasonCollector = {
  add: (code: HouseholdLiquidityReasonCode, sourceIds?: string[]) => void;
  has: (code: HouseholdLiquidityReasonCode) => boolean;
  values: () => HouseholdLiquidityBlockingReason[];
};

const createReasonCollector = (): ReasonCollector => {
  const sources = new Map<HouseholdLiquidityReasonCode, Set<string>>();
  return {
    add(code, sourceIds = []) {
      const current = sources.get(code) ?? new Set<string>();
      sourceIds.filter(Boolean).forEach(sourceId => current.add(sourceId));
      sources.set(code, current);
    },
    has: code => sources.has(code),
    values: () => reasonOrder
      .filter(code => sources.has(code))
      .map(code => ({ code, message: reasonMessages[code], sourceIds: stableIds(sources.get(code) ?? []) }))
  };
};

const safeSum = (values: number[]): number | null => {
  const sum = values.reduce((total, value) => total + value, 0);
  return Number.isFinite(sum) ? sum : null;
};

const safeProduct = (left: number, right: number): number | null => {
  const product = left * right;
  return Number.isFinite(product) ? product : null;
};

/**
 * Pure household liquidity rule foundation.
 * Stock (account balances), Flow (living/debt expenses), and Plan
 * (budget/contribution/withdrawal) remain separate until the documented formulas combine them.
 */
export function deriveHouseholdLiquidity(input: HouseholdLiquidityInput): HouseholdLiquidityOutput {
  const reasons = createReasonCollector();

  const accounts = Array.isArray(input.liquidAccounts) ? input.liquidAccounts : [];
  let accountsValid = accounts.length > 0;
  if (!accountsValid) reasons.add('LIQUID_ACCOUNT_UNAVAILABLE');
  const accountBalances: number[] = [];
  const accountIds = new Set<string>();
  const accountSources = new Set<NonNullable<HouseholdLiquidityAccount['source']>>();
  for (const account of accounts) {
    const sourceId = typeof account?.accountId === 'string' ? account.accountId : '';
    if (!sourceId || accountIds.has(sourceId)) {
      accountsValid = false;
      reasons.add('DUPLICATE_LIQUID_ACCOUNT_ID', [sourceId]);
    } else {
      accountIds.add(sourceId);
    }
    if (account?.source === 'financial-account' || account?.source === 'legacy-cash') {
      accountSources.add(account.source);
    }
    if (account?.status !== 'available') {
      accountsValid = false;
      reasons.add('LIQUID_ACCOUNT_UNAVAILABLE', [sourceId]);
    }
    if (!finiteNonnegative(account?.balance)) {
      accountsValid = false;
      reasons.add('LIQUID_ACCOUNT_BALANCE_INVALID', [sourceId]);
    } else {
      accountBalances.push(account.balance);
    }
  }
  if (accountSources.size > 1) {
    accountsValid = false;
    reasons.add('MIXED_LIQUID_ACCOUNT_SOURCES', accounts.map(account => account.accountId));
  }
  let totalLiquidCash = accountsValid ? safeSum(accountBalances) : null;
  if (accountsValid && totalLiquidCash === null) reasons.add('CALCULATION_OVERFLOW', accounts.map(account => account.accountId));

  const loansValue: unknown = input.loans;
  const loans = Array.isArray(loansValue) ? loansValue : [];
  let debtValid = Array.isArray(loansValue);
  if (!debtValid) reasons.add('DEBT_PAYMENT_MISSING');
  const loanIds = new Set<string>();
  const loanPayments: number[] = [];
  for (const loan of loans) {
    const loanId = typeof loan?.loanId === 'string' ? loan.loanId : '';
    if (!loanId || loanIds.has(loanId)) {
      debtValid = false;
      reasons.add('LOAN_MONTHLY_PAYMENT_INVALID', [loanId]);
    } else {
      loanIds.add(loanId);
    }
    if (!finiteNonnegative(loan?.monthlyPayment)) {
      debtValid = false;
      reasons.add('LOAN_MONTHLY_PAYMENT_INVALID', [loanId]);
    } else {
      loanPayments.push(loan.monthlyPayment);
    }
  }

  const expensesValue: unknown = input.livingExpenses;
  const expenses = Array.isArray(expensesValue) ? expensesValue : [];
  let livingValid = expenses.length > 0;
  if (!livingValid) reasons.add('LIVING_EXPENSE_MISSING');
  const livingAmounts: number[] = [];
  const loanLinkSources = new Map<string, string[]>();
  const expenseSourceIds = new Set<string>();
  for (const expense of expenses) {
    const sourceId = typeof expense?.sourceId === 'string' ? expense.sourceId : '';
    if (!sourceId || expenseSourceIds.has(sourceId)) {
      livingValid = false;
      reasons.add(sourceId ? 'DUPLICATE_LIVING_EXPENSE_SOURCE_ID' : 'LIVING_EXPENSE_INVALID', [sourceId]);
    } else {
      expenseSourceIds.add(sourceId);
    }
    if (expense?.role === 'excluded') continue;
    if (!finiteNonnegative(expense?.amount)) {
      livingValid = false;
      if (expense?.role === 'debt-payment') debtValid = false;
      reasons.add('LIVING_EXPENSE_INVALID', [sourceId]);
      continue;
    }
    if (expense.role === 'essential-living') {
      livingAmounts.push(expense.amount);
      continue;
    }
    if (expense.role === 'ambiguous') {
      livingValid = false;
      debtValid = false;
      reasons.add('DEBT_PAYMENT_AMBIGUOUS', [sourceId]);
      continue;
    }
    if (expense.role !== 'debt-payment') {
      livingValid = false;
      debtValid = false;
      reasons.add('LIVING_EXPENSE_INVALID', [sourceId]);
      continue;
    }
    const linkedLoanId = typeof expense.linkedLoanId === 'string' ? expense.linkedLoanId : '';
    if (!linkedLoanId) {
      debtValid = false;
      reasons.add('DEBT_PAYMENT_AMBIGUOUS', [sourceId]);
      continue;
    }
    if (!loanIds.has(linkedLoanId)) {
      debtValid = false;
      reasons.add('ORPHAN_LOAN_LINK', [sourceId, linkedLoanId]);
      continue;
    }
    const linkedSources = loanLinkSources.get(linkedLoanId) ?? [];
    linkedSources.push(sourceId);
    loanLinkSources.set(linkedLoanId, linkedSources);
  }
  for (const [loanId, sourceIds] of loanLinkSources) {
    if (sourceIds.length > 1) {
      debtValid = false;
      reasons.add('DUPLICATE_LOAN_LINK', [loanId, ...sourceIds]);
    }
  }

  let monthlyLivingExpenses = livingValid ? safeSum(livingAmounts) : null;
  if (livingValid && monthlyLivingExpenses === null) reasons.add('CALCULATION_OVERFLOW', expenses.map(expense => expense.sourceId));
  let monthlyDebtPayments = debtValid ? safeSum(loanPayments) : null;
  if (debtValid && monthlyDebtPayments === null) reasons.add('CALCULATION_OVERFLOW', loans.map(loan => loan.loanId));
  let monthlyEssentialExpenses = monthlyLivingExpenses !== null && monthlyDebtPayments !== null
    ? safeSum([monthlyLivingExpenses, monthlyDebtPayments])
    : null;
  if (monthlyLivingExpenses !== null && monthlyDebtPayments !== null && monthlyEssentialExpenses === null) {
    reasons.add('CALCULATION_OVERFLOW');
  }

  const safetyMonthsValid = typeof input.protectedSafetyMonths === 'number'
    && Number.isFinite(input.protectedSafetyMonths)
    && input.protectedSafetyMonths >= 1;
  if (!safetyMonthsValid) reasons.add('SAFETY_MONTHS_INVALID');
  const effectiveProtectedMonths = safetyMonthsValid ? Math.max(6, input.protectedSafetyMonths) : null;
  let minimumSafetyCash = monthlyEssentialExpenses === null ? null : safeProduct(monthlyEssentialExpenses, 6);
  let stableSafetyCash = monthlyEssentialExpenses === null ? null : safeProduct(monthlyEssentialExpenses, 12);
  let protectedSafetyCash = monthlyEssentialExpenses !== null && effectiveProtectedMonths !== null
    ? safeProduct(monthlyEssentialExpenses, effectiveProtectedMonths)
    : null;
  if (monthlyEssentialExpenses !== null && (minimumSafetyCash === null || stableSafetyCash === null
    || (effectiveProtectedMonths !== null && protectedSafetyCash === null))) {
    reasons.add('CALCULATION_OVERFLOW');
    minimumSafetyCash = null;
    stableSafetyCash = null;
    protectedSafetyCash = null;
  }

  let configuredBudget: number | null = null;
  if (input.configuredBudget === null || input.configuredBudget === undefined) {
    reasons.add('CONFIGURED_BUDGET_MISSING');
  } else if (!finiteNonnegative(input.configuredBudget)) {
    reasons.add('CONFIGURED_BUDGET_INVALID');
  } else {
    configuredBudget = input.configuredBudget;
  }

  const contributionValid = finiteNonnegative(input.externalContribution);
  if (!contributionValid) reasons.add('EXTERNAL_CONTRIBUTION_INVALID');
  const withdrawalValid = finiteNonnegative(input.plannedWithdrawal);
  if (!withdrawalValid) reasons.add('PLANNED_WITHDRAWAL_INVALID');
  if (input.allowSafetyCashUsage !== false) reasons.add('SAFETY_CASH_USAGE_NOT_ALLOWED');

  let adjustedLiquidCash: number | null = null;
  if (totalLiquidCash !== null && contributionValid && withdrawalValid) {
    const availableBeforeWithdrawal = safeSum([totalLiquidCash, input.externalContribution]);
    if (availableBeforeWithdrawal === null) {
      reasons.add('CALCULATION_OVERFLOW');
    } else if (input.plannedWithdrawal > availableBeforeWithdrawal) {
      reasons.add('WITHDRAWAL_EXCEEDS_AVAILABLE_CASH');
    } else {
      adjustedLiquidCash = availableBeforeWithdrawal - input.plannedWithdrawal;
    }
  }

  const safetyCashShortfall = adjustedLiquidCash !== null && protectedSafetyCash !== null
    ? Math.max(0, protectedSafetyCash - adjustedLiquidCash)
    : null;
  const investableCash = adjustedLiquidCash !== null && protectedSafetyCash !== null
    ? Math.max(0, adjustedLiquidCash - protectedSafetyCash)
    : null;
  const executableBudget = configuredBudget !== null && investableCash !== null
    ? Math.min(configuredBudget, investableCash)
    : null;
  const externalFundingRequired = configuredBudget !== null && investableCash !== null
    ? Math.max(0, configuredBudget - investableCash)
    : null;

  if (safetyCashShortfall !== null && safetyCashShortfall > 0) reasons.add('SAFETY_CASH_INSUFFICIENT');
  if (configuredBudget === 0) reasons.add('CONFIGURED_BUDGET_ZERO');
  if (configuredBudget !== null && configuredBudget > 0 && investableCash === 0) reasons.add('NO_INVESTABLE_CASH');

  const dataIssueCodes = new Set<HouseholdLiquidityReasonCode>([
    'LIQUID_ACCOUNT_UNAVAILABLE', 'LIQUID_ACCOUNT_BALANCE_INVALID', 'DUPLICATE_LIQUID_ACCOUNT_ID',
    'MIXED_LIQUID_ACCOUNT_SOURCES', 'LIVING_EXPENSE_MISSING', 'LIVING_EXPENSE_INVALID',
    'DUPLICATE_LIVING_EXPENSE_SOURCE_ID', 'DEBT_PAYMENT_MISSING', 'DEBT_PAYMENT_AMBIGUOUS',
    'DUPLICATE_LOAN_LINK', 'ORPHAN_LOAN_LINK', 'LOAN_MONTHLY_PAYMENT_INVALID',
    'CONFIGURED_BUDGET_MISSING', 'CONFIGURED_BUDGET_INVALID', 'SAFETY_MONTHS_INVALID',
    'EXTERNAL_CONTRIBUTION_INVALID', 'PLANNED_WITHDRAWAL_INVALID',
    'WITHDRAWAL_EXCEEDS_AVAILABLE_CASH', 'SAFETY_CASH_USAGE_NOT_ALLOWED', 'CALCULATION_OVERFLOW'
  ]);
  const foundationalMissing = reasons.has('LIQUID_ACCOUNT_UNAVAILABLE')
    || reasons.has('LIVING_EXPENSE_MISSING')
    || reasons.has('DEBT_PAYMENT_MISSING');
  const hasDataIssue = [...dataIssueCodes].some(code => reasons.has(code));
  const dataCompleteness: HouseholdLiquidityOutput['dataCompleteness'] = foundationalMissing
    ? 'insufficient'
    : hasDataIssue ? 'partial' : 'complete';
  const confidence: HouseholdLiquidityOutput['confidence'] = dataCompleteness === 'complete'
    ? 'high'
    : dataCompleteness === 'partial' ? 'medium' : 'low';
  const blockingReasons = reasons.values();

  return {
    totalLiquidCash,
    monthlyLivingExpenses,
    monthlyDebtPayments,
    monthlyEssentialExpenses,
    minimumSafetyCash,
    stableSafetyCash,
    effectiveProtectedMonths,
    protectedSafetyCash,
    safetyCashShortfall,
    adjustedLiquidCash,
    investableCash,
    configuredBudget,
    executableBudget,
    externalFundingRequired,
    dataCompleteness,
    confidence,
    canExecuteBuy: blockingReasons.length === 0 && executableBudget !== null && executableBudget > 0,
    blockingReasons
  };
}
