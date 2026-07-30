import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCashFlowProfile, type CashFlowProfile } from '../src/lib/cashFlow';
import { buildHouseholdLiquidityInput } from '../src/lib/householdLiquidityInputAdapter';
import {
  confirmVariableExpenseBudgetMigration,
  dismissVariableExpenseBudgetMigration,
  MIGRATED_VARIABLE_EXPENSE_BUDGET_ITEM_ID,
  shouldPromptVariableExpenseBudgetMigration
} from '../src/lib/cashFlowVariableExpenseBudgetMigration';

const profile = (overrides: Partial<CashFlowProfile> = {}): CashFlowProfile => normalizeCashFlowProfile({
  monthlyIncome: 50_000,
  fixedExpenses: [{ id: 'utilities', name: '水電', amount: 500, category: 'utilities', enabled: true, liquidityRole: 'essential-living' }],
  variableExpenseBudget: 10_000,
  monthlyInvestmentBudget: 10_000,
  emergencyFundTargetMonths: 6,
  ...overrides
});

const adapterSource = (cashFlowProfile: CashFlowProfile) => ({ accounts: [], legacyCash: [], loans: [], cashFlowProfile, configuredBudget: 1_000 });

const FIXED_TIME = '2026-07-30T00:00:00.000Z';

test('1. 只有非 null 正數且尚未標記已處理時才觸發提示', () => {
  assert.equal(shouldPromptVariableExpenseBudgetMigration(profile()), true);
  assert.equal(shouldPromptVariableExpenseBudgetMigration(profile({ variableExpenseBudget: 0 })), false, '明確 0 沒有東西可遷移，不觸發提示');
  assert.equal(shouldPromptVariableExpenseBudgetMigration(profile({ variableExpenseBudget: null })), false);
  assert.equal(shouldPromptVariableExpenseBudgetMigration(profile({ variableExpenseBudgetMigratedAt: FIXED_TIME })), false, '已標記已處理者不再提示，即使欄位仍有殘留值');
});

test('2. 確認遷移：金額原樣轉入一筆 essential-living 固定支出，清空舊欄位並寫入標記', () => {
  const migrated = confirmVariableExpenseBudgetMigration(profile(), FIXED_TIME);
  assert.equal(migrated.variableExpenseBudget, null);
  assert.equal(migrated.variableExpenseBudgetMigratedAt, FIXED_TIME);
  assert.equal(migrated.fixedExpenses.length, 2);
  const created = migrated.fixedExpenses.find(item => item.id === MIGRATED_VARIABLE_EXPENSE_BUDGET_ITEM_ID);
  assert.deepEqual(created, { id: MIGRATED_VARIABLE_EXPENSE_BUDGET_ITEM_ID, name: '既有生活費預算（遷移自舊欄位）', amount: 10_000, category: 'other', enabled: true, liquidityRole: 'essential-living' });
});

test('3. 確認遷移後，Household Liquidity 計算的 monthlyEssentialExpenses 與遷移前相同（不重複計算、不遺失金額）', () => {
  const before = profile();
  const after = confirmVariableExpenseBudgetMigration(before, FIXED_TIME);
  const loans: never[] = [];
  const before_total = deriveEssential(before, loans);
  const after_total = deriveEssential(after, loans);
  assert.equal(before_total, after_total);
  assert.equal(before_total, 10_500);
});

function deriveEssential(cashFlowProfile: CashFlowProfile, loans: never[]) {
  const input = buildHouseholdLiquidityInput(adapterSource(cashFlowProfile));
  return input.livingExpenses.filter(item => item.role === 'essential-living').reduce((total, item) => total + (item.amount ?? 0), 0);
}

test('4. 忽略遷移：清空舊欄位、寫入標記，不建立任何固定支出項目', () => {
  const dismissed = dismissVariableExpenseBudgetMigration(profile(), FIXED_TIME);
  assert.equal(dismissed.variableExpenseBudget, null);
  assert.equal(dismissed.variableExpenseBudgetMigratedAt, FIXED_TIME);
  assert.deepEqual(dismissed.fixedExpenses, profile().fixedExpenses);
});

test('5. 冪等性：對已處理過的 profile 重複呼叫確認或忽略，回傳原物件、不再變動', () => {
  const migrated = confirmVariableExpenseBudgetMigration(profile(), FIXED_TIME);
  const migratedAgain = confirmVariableExpenseBudgetMigration(migrated, '2026-08-01T00:00:00.000Z');
  assert.equal(migratedAgain, migrated, '已解決的 profile 再次呼叫 confirm 應直接回傳同一參考，不建立第二筆項目');
  assert.equal(migratedAgain.fixedExpenses.length, 2);

  const dismissed = dismissVariableExpenseBudgetMigration(profile(), FIXED_TIME);
  const dismissedAgain = dismissVariableExpenseBudgetMigration(dismissed, '2026-08-01T00:00:00.000Z');
  assert.equal(dismissedAgain, dismissed);
});

test('6. normalizeCashFlowProfile 往返（localStorage／Firebase／Backup 共用路徑）保留 variableExpenseBudgetMigratedAt，不被靜默丟棄', () => {
  const migrated = confirmVariableExpenseBudgetMigration(profile(), FIXED_TIME);
  const roundTripped = normalizeCashFlowProfile(JSON.parse(JSON.stringify(migrated)));
  assert.equal(roundTripped.variableExpenseBudgetMigratedAt, FIXED_TIME);
  assert.equal(roundTripped.variableExpenseBudget, null);
  assert.ok(roundTripped.fixedExpenses.some(item => item.id === MIGRATED_VARIABLE_EXPENSE_BUDGET_ITEM_ID));
});

test('7. 未設定 variableExpenseBudgetMigratedAt 時，正規化後的物件不會出現該欄位（維持既有 undefined-is-absence 慣例）', () => {
  assert.equal(Object.hasOwn(profile(), 'variableExpenseBudgetMigratedAt'), false);
  assert.doesNotMatch(JSON.stringify(profile()), /variableExpenseBudgetMigratedAt/);
});

test('8. 舊版 Backup／既有資料匯入：variableExpenseBudget 有值且未標記時，normalizeCashFlowProfile 正確保留該值供之後觸發遷移', () => {
  const legacyBackupRaw = { monthlyIncome: 40_000, fixedExpenses: [], variableExpenseBudget: 5_000, monthlyInvestmentBudget: null, emergencyFundTargetMonths: 6 };
  const restored = normalizeCashFlowProfile(legacyBackupRaw);
  assert.equal(restored.variableExpenseBudget, 5_000);
  assert.equal(restored.variableExpenseBudgetMigratedAt, undefined);
  assert.equal(shouldPromptVariableExpenseBudgetMigration(restored), true);
});
