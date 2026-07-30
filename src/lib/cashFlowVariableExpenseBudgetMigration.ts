import type { CashFlowItem, CashFlowProfile } from './cashFlow';

/** Deterministic id so repeated confirmations never create a duplicate item. */
export const MIGRATED_VARIABLE_EXPENSE_BUDGET_ITEM_ID = 'migrated-variable-expense-budget';

const finitePositive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * True only for a legacy `variableExpenseBudget` amount (UR-TODO-044 Phase 2b) the user has not
 * yet resolved through the one-time migration prompt. An explicit `0` has nothing to migrate, so
 * it does not trigger the prompt; only a positive amount does.
 */
export function shouldPromptVariableExpenseBudgetMigration(profile: CashFlowProfile): boolean {
  return finitePositive(profile.variableExpenseBudget) && !profile.variableExpenseBudgetMigratedAt;
}

/**
 * Moves the legacy amount into a new essential-living fixed expense item and retires the field.
 * Idempotent: once resolved, `shouldPromptVariableExpenseBudgetMigration` is false and this
 * returns the profile unchanged, so calling it again (or normalizing repeatedly) never creates a
 * duplicate item or re-clears an already-null field.
 */
export function confirmVariableExpenseBudgetMigration(profile: CashFlowProfile, migratedAt = new Date().toISOString()): CashFlowProfile {
  if (!shouldPromptVariableExpenseBudgetMigration(profile)) return profile;
  const amount = profile.variableExpenseBudget as number;
  const alreadyPresent = profile.fixedExpenses.some(item => item.id === MIGRATED_VARIABLE_EXPENSE_BUDGET_ITEM_ID);
  const migratedItem: CashFlowItem = { id: MIGRATED_VARIABLE_EXPENSE_BUDGET_ITEM_ID, name: '既有生活費預算（遷移自舊欄位）', amount, category: 'other', enabled: true, liquidityRole: 'essential-living' };
  return { ...profile, fixedExpenses: alreadyPresent ? profile.fixedExpenses : [...profile.fixedExpenses, migratedItem], variableExpenseBudget: null, variableExpenseBudgetMigratedAt: migratedAt };
}

/**
 * Discards the legacy amount without creating a fixed expense item; it stops counting toward
 * essential living expenses going forward. Idempotent in the same way as the confirm path.
 */
export function dismissVariableExpenseBudgetMigration(profile: CashFlowProfile, migratedAt = new Date().toISOString()): CashFlowProfile {
  if (!shouldPromptVariableExpenseBudgetMigration(profile)) return profile;
  return { ...profile, variableExpenseBudget: null, variableExpenseBudgetMigratedAt: migratedAt };
}
