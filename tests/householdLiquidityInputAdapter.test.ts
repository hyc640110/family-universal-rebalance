import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createFinancialAccount, type FinancialAccount } from '../src/lib/financialAccounts';
import { deriveHouseholdLiquidity } from '../src/lib/householdLiquidity';
import type { CashFlowProfile } from '../src/lib/cashFlow';
import {
  buildHouseholdLiquidityInput,
  type HouseholdLiquidityAdapterSources
} from '../src/lib/householdLiquidityInputAdapter';

const account = (input: Partial<FinancialAccount> = {}) => createFinancialAccount({ id: 'cash-1', type: 'cash', manualBalance: 1_000, ...input }, '2026-07-22T00:00:00.000Z');
const profile = (overrides: Partial<CashFlowProfile> = {}): CashFlowProfile => ({
  monthlyIncome: null, fixedExpenses: [{ id: 'utilities-1', name: '水電', amount: 500, category: 'utilities', enabled: true }],
  variableExpenseBudget: 200, monthlyInvestmentBudget: null, emergencyFundTargetMonths: 6, ...overrides
});
const sources = (overrides: Partial<HouseholdLiquidityAdapterSources> = {}): HouseholdLiquidityAdapterSources => ({
  accounts: [account()], legacyCash: [], loans: [], cashFlowProfile: profile(), configuredBudget: 1_000,
  externalContribution: 0, plannedWithdrawal: 0, ...overrides
});
const accountById = (input: ReturnType<typeof buildHouseholdLiquidityInput>, accountId: string) =>
  input.liquidAccounts.find(item => item.accountId === accountId);

test('1. active manual cash、bank、eWallet 均保留穩定 accountId 並映射', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [account({ id: 'cash', type: 'cash' }), account({ id: 'bank', type: 'bank' }), account({ id: 'wallet', type: 'eWallet' })] }));
  assert.deepEqual(input.liquidAccounts.map(item => item.accountId), ['cash', 'bank', 'wallet']);
  assert.deepEqual(input.liquidAccounts.map(item => item.balance), [1_000, 1_000, 1_000]);
  assert.ok(input.liquidAccounts.every(item => item.source === 'financial-account'));
});

test('2. inactive 與非流動 FinancialAccount 排除', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [account({ id: 'inactive', isActive: false }), account({ id: 'stock', type: 'securities' }), account({ id: 'card', type: 'creditCard' }), account({ id: 'other', type: 'other' })] }));
  assert.deepEqual(input.liquidAccounts, []);
});

test('3. derived balance 只使用明確 derivedAccountBalances', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [account({ id: 'derived', balanceMode: 'derived', manualBalance: 999 })], derivedAccountBalances: { derived: 321 } }));
  assert.deepEqual(accountById(input, 'derived'), { accountId: 'derived', balance: 321, status: 'available', source: 'financial-account' });
});

test('4. derived balance 缺失或無效映射為 unavailable，不轉 0', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [account({ id: 'missing', balanceMode: 'derived' }), account({ id: 'bad', balanceMode: 'derived' })], derivedAccountBalances: { bad: Number.NaN } }));
  assert.deepEqual(input.liquidAccounts.map(item => [item.accountId, item.balance, item.status]), [['missing', null, 'unavailable'], ['bad', null, 'unavailable']]);
});

test('5. non-TWD account 映射為 unavailable，不自行換匯', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [account({ id: 'usd', currency: 'USD', manualBalance: 99 })] }));
  assert.deepEqual(accountById(input, 'usd'), { accountId: 'usd', balance: null, status: 'unavailable', source: 'financial-account' });
});

test('6. manual 0 是明確值，負數、NaN、Infinity 不轉 0', () => {
  const invalid = [
    { ...account({ id: 'negative' }), manualBalance: -1 },
    { ...account({ id: 'nan' }), manualBalance: Number.NaN },
    { ...account({ id: 'infinity' }), manualBalance: Infinity }
  ] as FinancialAccount[];
  const input = buildHouseholdLiquidityInput(sources({ accounts: [account({ id: 'zero', manualBalance: 0 }), ...invalid] }));
  assert.deepEqual(accountById(input, 'zero'), { accountId: 'zero', balance: 0, status: 'available', source: 'financial-account' });
  assert.ok(['negative', 'nan', 'infinity'].every(id => accountById(input, id)?.status === 'unavailable' && accountById(input, id)?.balance === null));
});

test('7. legacy-only 使用穩定 legacy-cash sourceId', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [], legacyCash: [{ id: 'wallet', amount: 900 }] }));
  assert.deepEqual(input.liquidAccounts, [{ accountId: 'legacy-cash:wallet', balance: 900, status: 'available', source: 'legacy-cash' }]);
});

test('8. legacy 與 FinancialAccount 混用保留兩種來源供 Core 阻擋', () => {
  const input = buildHouseholdLiquidityInput(sources({ legacyCash: [{ id: 'wallet', amount: 900 }] }));
  assert.deepEqual(deriveHouseholdLiquidity(input).blockingReasons.map(reason => reason.code), ['MIXED_LIQUID_ACCOUNT_SOURCES']);
});

test('9. duplicate FinancialAccount 與 legacy source ID 不自行去重', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [account({ id: 'same' }), account({ id: 'same' })], legacyCash: [{ id: 'same', amount: 2 }] }));
  const codes = deriveHouseholdLiquidity(input).blockingReasons.map(reason => reason.code);
  assert.ok(codes.includes('DUPLICATE_LIQUID_ACCOUNT_ID'));
});

test('10. Loan 僅映射 id 與 monthlyPayment，無效值不轉 0', () => {
  const input = buildHouseholdLiquidityInput(sources({ loans: [{ id: 'loan-1', monthlyPayment: 3_000 }, { id: 'loan-bad', monthlyPayment: Number.POSITIVE_INFINITY }] }));
  assert.deepEqual(input.loans[0], { loanId: 'loan-1', monthlyPayment: 3_000 });
  assert.ok(Number.isNaN(input.loans[1].monthlyPayment));
});

test('11. housing、loan、other Cash Flow 都是 ambiguous，不依名稱或金額建立 linkage', () => {
  const input = buildHouseholdLiquidityInput(sources({
    loans: [{ id: 'loan-1', monthlyPayment: 3_000 }],
    cashFlowProfile: profile({ fixedExpenses: [
      { id: 'housing', name: '房貸 loan-1', amount: 3_000, category: 'housing', enabled: true },
      { id: 'loan-flow', name: '信貸', amount: 3_000, category: 'loan', enabled: true },
      { id: 'other', name: 'loan-1', amount: 3_000, category: 'other', enabled: true }
    ] })
  }));
  assert.ok(input.livingExpenses.slice(0, 3).every(item => item.role === 'ambiguous' && item.linkedLoanId === undefined));
  assert.deepEqual(input.loans, [{ loanId: 'loan-1', monthlyPayment: 3_000 }]);
  const core = deriveHouseholdLiquidity(input);
  assert.equal(core.monthlyDebtPayments, null);
  assert.equal(core.canExecuteBuy, false);
  assert.ok(core.blockingReasons.some(reason => reason.code === 'DEBT_PAYMENT_AMBIGUOUS'));
});

test('12. disabled Cash Flow excluded，其他一般固定支出 essential-living', () => {
  const input = buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ fixedExpenses: [
    { id: 'off', name: '關閉', amount: 999, category: 'utilities', enabled: false },
    { id: 'utilities', name: '水電', amount: 500, category: 'utilities', enabled: true }
  ] }) }));
  assert.deepEqual(input.livingExpenses.slice(0, 2), [
    { sourceId: 'cash-flow:off', amount: 999, role: 'excluded' },
    { sourceId: 'cash-flow:utilities', amount: 500, role: 'essential-living' }
  ]);
});

test('13. variable expense 使用固定 synthetic sourceId，缺失不轉 0', () => {
  const complete = buildHouseholdLiquidityInput(sources());
  assert.deepEqual(complete.livingExpenses.at(-1), { sourceId: 'cash-flow:variable-expense-budget', amount: 200, role: 'essential-living' });
  const missing = buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ variableExpenseBudget: null }) }));
  assert.equal(missing.livingExpenses.at(-1)?.amount, null);
});

test('14. configuredBudget 缺失、無效與 0 的語意不同', () => {
  assert.equal(buildHouseholdLiquidityInput(sources({ configuredBudget: undefined })).configuredBudget, null);
  assert.ok(Number.isNaN(buildHouseholdLiquidityInput(sources({ configuredBudget: Number.NaN })).configuredBudget));
  assert.equal(buildHouseholdLiquidityInput(sources({ configuredBudget: 0 })).configuredBudget, 0);
});

test('15. profile 缺失或 safety months 無效不預設為 6', () => {
  assert.ok(Number.isNaN(buildHouseholdLiquidityInput(sources({ cashFlowProfile: undefined })).protectedSafetyMonths));
  assert.ok(Number.isNaN(buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ emergencyFundTargetMonths: Infinity }) })).protectedSafetyMonths));
});

test('16. externalContribution 與 plannedWithdrawal 缺失保留 unavailable boundary', () => {
  const input = buildHouseholdLiquidityInput(sources({ externalContribution: undefined, plannedWithdrawal: null }));
  assert.ok(Number.isNaN(input.externalContribution));
  assert.ok(Number.isNaN(input.plannedWithdrawal));
});

test('17. allowSafetyCashUsage 永遠為 false 且不修改輸入', () => {
  const source = sources({ accounts: [account({ id: 'frozen' })], legacyCash: [{ id: 'legacy', amount: 1 }] });
  const snapshot = structuredClone(source);
  const first = buildHouseholdLiquidityInput(source);
  const second = buildHouseholdLiquidityInput(source);
  assert.equal(first.allowSafetyCashUsage, false);
  assert.deepEqual(first, second);
  assert.deepEqual(source, snapshot);
});

test('18. adapter output 可直接交給 Core，缺失計畫與歧義會阻擋而非假裝可執行', () => {
  const input = buildHouseholdLiquidityInput(sources({
    cashFlowProfile: profile({ fixedExpenses: [{ id: 'housing', name: '住房', amount: 8_000, category: 'housing', enabled: true }] }),
    externalContribution: undefined, plannedWithdrawal: undefined
  }));
  const result = deriveHouseholdLiquidity(input);
  assert.equal(result.canExecuteBuy, false);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'DEBT_PAYMENT_AMBIGUOUS'));
  assert.ok(result.blockingReasons.some(reason => reason.code === 'EXTERNAL_CONTRIBUTION_INVALID'));
  assert.ok(result.blockingReasons.some(reason => reason.code === 'PLANNED_WITHDRAWAL_INVALID'));
});

test('19. 缺少 accounts source 保持 unavailable，讓 Core 揭露缺失', () => {
  const result = deriveHouseholdLiquidity(buildHouseholdLiquidityInput(sources({ accounts: undefined })));
  assert.equal(result.totalLiquidCash, null);
  assert.ok(result.blockingReasons.some(reason => reason.code === 'LIQUID_ACCOUNT_UNAVAILABLE'));
});

test('20. legacy Cash 的 null、負數、NaN、Infinity 不轉 0', () => {
  const input = buildHouseholdLiquidityInput(sources({ accounts: [], legacyCash: [
    { id: 'null', amount: null }, { id: 'negative', amount: -1 }, { id: 'nan', amount: Number.NaN }, { id: 'infinity', amount: Infinity }
  ] }));
  assert.ok(input.liquidAccounts.every(item => item.status === 'unavailable' && item.balance === null));
});

test('21. 一般 Cash Flow 金額無效不轉 0，交由 Core 標記 invalid', () => {
  const input = buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ fixedExpenses: [
    { id: 'utilities', name: '水電', amount: Number.NaN, category: 'utilities', enabled: true }
  ] }) }));
  assert.equal(input.livingExpenses[0].amount, null);
  assert.ok(deriveHouseholdLiquidity(input).blockingReasons.some(reason => reason.code === 'LIVING_EXPENSE_INVALID'));
});

test('22. externalContribution 與 plannedWithdrawal 的 NaN、Infinity 不轉 0', () => {
  const input = buildHouseholdLiquidityInput(sources({ externalContribution: Number.NaN, plannedWithdrawal: Infinity }));
  assert.ok(Number.isNaN(input.externalContribution));
  assert.ok(Number.isNaN(input.plannedWithdrawal));
});

test('23. 正式 consumer import graph 尚未接入 Adapter', () => {
  const walk = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]
  );
  const consumers = walk('src').filter(file => /\.(ts|tsx)$/.test(file) && !file.endsWith('householdLiquidityInputAdapter.ts'));
  assert.ok(consumers.every(file => !readFileSync(file, 'utf8').includes('householdLiquidityInputAdapter')));
});
