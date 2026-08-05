import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createFinancialAccount, type FinancialAccount } from '../src/lib/financialAccounts';
import { deriveHouseholdLiquidity } from '../src/lib/householdLiquidity';
import type { CashFlowCategory, CashFlowProfile } from '../src/lib/cashFlow';
import {
  buildHouseholdLiquidityInput,
  type HouseholdLiquidityAdapterSources
} from '../src/lib/householdLiquidityInputAdapter';

const account = (input: Partial<FinancialAccount> = {}) => createFinancialAccount({ id: 'cash-1', type: 'cash', manualBalance: 1_000, ...input }, '2026-07-22T00:00:00.000Z');
const profile = (overrides: Partial<CashFlowProfile> = {}): CashFlowProfile => ({
  monthlyIncome: null, fixedExpenses: [{ id: 'utilities-1', name: '水電', amount: 500, category: 'utilities', enabled: true }],
  variableExpenseBudget: 200, monthlyInvestmentBudget: null, emergencyFundTargetMonths: 6, externalContribution: 0, plannedWithdrawal: 0, ...overrides
});
const sources = (overrides: Partial<HouseholdLiquidityAdapterSources> = {}): HouseholdLiquidityAdapterSources => ({
  accounts: [account()], legacyCash: [], loans: [], cashFlowProfile: profile(), configuredBudget: 1_000,
  ...overrides
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
  // UR-TODO-044 Phase 2a: the default profile()'s 'utilities-1' fixed expense has no liquidityRole set, so it is
  // now also 'ambiguous' (previously silently 'essential-living'), adding DEBT_PAYMENT_AMBIGUOUS alongside the
  // MIXED_LIQUID_ACCOUNT_SOURCES this test targets.
  assert.deepEqual(deriveHouseholdLiquidity(input).blockingReasons.map(reason => reason.code), ['MIXED_LIQUID_ACCOUNT_SOURCES', 'DEBT_PAYMENT_AMBIGUOUS']);
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

test('11. UR-TODO-044 Phase 2a：8 個分類未設定角色一律 ambiguous，不再依分類分歧，不依名稱或金額建立 linkage', () => {
  const allCategories: CashFlowCategory[] = ['housing', 'loan', 'insurance', 'utilities', 'transportation', 'family', 'subscription', 'other'];
  const input = buildHouseholdLiquidityInput(sources({
    loans: [{ id: 'loan-1', monthlyPayment: 3_000 }],
    cashFlowProfile: profile({ fixedExpenses: allCategories.map((category, index) => ({ id: `item-${index}`, name: `loan-1 ${category}`, amount: 3_000, category, enabled: true })) })
  }));
  assert.equal(input.livingExpenses.length, allCategories.length + 1);
  assert.ok(input.livingExpenses.slice(0, allCategories.length).every(item => item.role === 'ambiguous' && item.linkedLoanId === undefined));
  assert.deepEqual(input.loans, [{ loanId: 'loan-1', monthlyPayment: 3_000 }]);
  const core = deriveHouseholdLiquidity(input);
  assert.equal(core.monthlyLivingExpenses, null);
  assert.equal(core.monthlyDebtPayments, null);
  assert.equal(core.canExecuteBuy, false);
  assert.equal(core.dataCompleteness, 'partial');
  assert.equal(core.confidence, 'medium');
  assert.ok(core.blockingReasons.some(reason => reason.code === 'DEBT_PAYMENT_AMBIGUOUS'));
});

test('12. disabled Cash Flow 永遠 excluded；enabled 但未設定角色，不分類別一律 ambiguous（非 essential-living）；已明確設定 essential-living 者行為不變（回歸）', () => {
  const input = buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ fixedExpenses: [
    { id: 'off', name: '關閉', amount: 999, category: 'utilities', enabled: false },
    { id: 'utilities', name: '水電', amount: 500, category: 'utilities', enabled: true },
    { id: 'explicit-living', name: '保險', amount: 300, category: 'insurance', enabled: true, liquidityRole: 'essential-living' }
  ] }) }));
  assert.deepEqual(input.livingExpenses.slice(0, 3), [
    { sourceId: 'cash-flow:off', amount: 999, role: 'excluded' },
    { sourceId: 'cash-flow:utilities', amount: 500, role: 'ambiguous' },
    { sourceId: 'cash-flow:explicit-living', amount: 300, role: 'essential-living' }
  ]);
});

test('12b. UR-TODO-044 Phase 2b：variableExpenseBudget 仍有未遷移的舊值時，合成 essential-living 項目照舊注入', () => {
  const input = buildHouseholdLiquidityInput(sources());
  const variableEntry = input.livingExpenses.at(-1);
  assert.equal(variableEntry?.sourceId, 'cash-flow:variable-expense-budget');
  assert.equal(variableEntry?.role, 'essential-living');
  assert.equal(variableEntry?.amount, 200);
});

test('13. variableExpenseBudget 為 null（已遷移或本就未使用此欄位）時，完全省略合成項目，不再注入 amount: null', () => {
  const complete = buildHouseholdLiquidityInput(sources());
  assert.deepEqual(complete.livingExpenses.at(-1), { sourceId: 'cash-flow:variable-expense-budget', amount: 200, role: 'essential-living' });
  const migrated = buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ variableExpenseBudget: null }) }));
  assert.equal(migrated.livingExpenses.some(item => item.sourceId === 'cash-flow:variable-expense-budget'), false, 'UR-TODO-044 Phase 2b 前，null 會注入 amount: null 並永久阻擋計算；Phase 2b 後應直接省略此來源');
  assert.deepEqual(migrated.livingExpenses, [{ sourceId: 'cash-flow:utilities-1', amount: 500, role: 'ambiguous' }]);
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
  const input = buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ externalContribution: undefined, plannedWithdrawal: undefined }) }));
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
    cashFlowProfile: profile({ fixedExpenses: [{ id: 'housing', name: '住房', amount: 8_000, category: 'housing', enabled: true }], externalContribution: undefined, plannedWithdrawal: undefined })
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
  const input = buildHouseholdLiquidityInput(sources({ cashFlowProfile: profile({ externalContribution: Number.NaN, plannedWithdrawal: Infinity }) }));
  assert.ok(Number.isNaN(input.externalContribution));
  assert.ok(Number.isNaN(input.plannedWithdrawal));
});

test('23. V7.0B sub-PR 1 (UR-TODO-008): only App.tsx (buy-only budget wiring) consumes the Adapter; every other file in src/ stays unwired', () => {
  // 2026-07-25 update: this test previously asserted zero consumers anywhere in src/, matching Sprint 1/2's
  // explicit "no consumer yet" scope (013 §29.1). V7.0B sub-PR 1 is the user-authorized Sprint that deliberately
  // wires App.tsx's buy-only budget to the adapter (see AI_CONTEXT/008_TODO_BACKLOG.md UR-TODO-008); App.tsx is
  // now an intentional, explicit exception, everything else must remain unwired.
  const walk = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]
  );
  const wiredException = join('src', 'App.tsx');
  const consumers = walk('src').filter(file => /\.(ts|tsx)$/.test(file) && !file.endsWith('householdLiquidityInputAdapter.ts') && file !== wiredException);
  assert.ok(consumers.every(file => !readFileSync(file, 'utf8').includes('householdLiquidityInputAdapter')));
  assert.ok(readFileSync(wiredException, 'utf8').includes('householdLiquidityInputAdapter'));
});

test('24. UR-TODO-041: a stray `asOf` on a loan source (Plan A staleness data) never reaches HouseholdLoan or changes deriveHouseholdLiquidity output', () => {
  const loan = { id: 'loan-1', monthlyPayment: 5_000 };
  const staleLoanSource = { ...loan, asOf: '2020-01-01' } as typeof loan; // simulates App.tsx passing the full LoanItem through
  const withoutAsOf = buildHouseholdLiquidityInput(sources({ loans: [loan] }));
  const withAsOf = buildHouseholdLiquidityInput(sources({ loans: [staleLoanSource] }));
  assert.deepEqual(withAsOf.loans, withoutAsOf.loans);
  assert.deepEqual(Object.keys(withAsOf.loans[0]).sort(), ['loanId', 'monthlyPayment']);
  assert.deepEqual(deriveHouseholdLiquidity(withAsOf), deriveHouseholdLiquidity(withoutAsOf));
});
