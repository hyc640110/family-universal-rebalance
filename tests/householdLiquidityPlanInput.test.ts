import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CASH_FLOW_SCHEMA_VERSION,
  migrateCashFlowProfile,
  normalizeCashFlowProfile,
  normalizeHouseholdLiquidityPlanInput,
  type CashFlowProfile
} from '../src/lib/cashFlow';
import { buildHouseholdLiquidityInput } from '../src/lib/householdLiquidityInputAdapter';
import { createSyncPayloadSnapshot } from '../src/lib/syncState';

const baseProfile = (overrides: Record<string, unknown> = {}) => ({
  monthlyIncome: null,
  fixedExpenses: [],
  variableExpenseBudget: null,
  monthlyInvestmentBudget: null,
  emergencyFundTargetMonths: 6,
  ...overrides
});

const adapterSource = (cashFlowProfile: CashFlowProfile | undefined) => ({
  accounts: [],
  legacyCash: [],
  loans: [],
  cashFlowProfile,
  configuredBudget: 1_000
});

test('1. plan input normalizer 保留 absent 與 explicit zero 的不同語意', () => {
  assert.deepEqual(normalizeHouseholdLiquidityPlanInput({}), {});
  assert.deepEqual(normalizeHouseholdLiquidityPlanInput({ externalContribution: 0, plannedWithdrawal: 0 }), {
    externalContribution: 0,
    plannedWithdrawal: 0
  });
});

test('2. plan input normalizer 僅保留正有限數值，且不修改輸入', () => {
  const raw = { externalContribution: 12_345, plannedWithdrawal: 678 };
  const snapshot = structuredClone(raw);
  assert.deepEqual(normalizeHouseholdLiquidityPlanInput(raw), raw);
  assert.deepEqual(raw, snapshot);
});

test('3. plan input normalizer 將 negative、NaN、Infinity、null、空字串與 numeric string 正規化為 absent', () => {
  for (const value of [-1, Number.NaN, Infinity, -Infinity, null, '', '123']) {
    assert.deepEqual(normalizeHouseholdLiquidityPlanInput({ externalContribution: value, plannedWithdrawal: value }), {});
  }
});

test('4. Cash Flow v3 migration 保留 plan input，並讓 legacy missing 欄位保持 absent', () => {
  assert.equal(CASH_FLOW_SCHEMA_VERSION, 3);
  const legacy = baseProfile({ schemaVersion: 1 });
  const migrated = migrateCashFlowProfile(legacy);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.externalContribution, undefined);
  assert.equal(migrated.plannedWithdrawal, undefined);

  const current = migrateCashFlowProfile(baseProfile({ schemaVersion: 3, externalContribution: 0, plannedWithdrawal: 2_500 }));
  assert.equal(current.externalContribution, 0);
  assert.equal(current.plannedWithdrawal, 2_500);
});

test('5. Cash Flow migration 為 deterministic、idempotent，且不影響 provenance 欄位', () => {
  const raw = baseProfile({
    schemaVersion: 2,
    externalContribution: Number.NaN,
    plannedWithdrawal: '200',
    fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'loan', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }]
  });
  const snapshot = structuredClone(raw);
  const once = migrateCashFlowProfile(raw);
  const twice = migrateCashFlowProfile(once);
  assert.deepEqual(once, twice);
  assert.deepEqual(raw, snapshot);
  assert.equal(once.externalContribution, undefined);
  assert.equal(once.plannedWithdrawal, undefined);
  assert.equal(once.fixedExpenses[0].liquidityRole, 'debt-payment');
  assert.equal(once.fixedExpenses[0].linkedLoanId, 'loan-1');
});

test('6. JSON persistence round-trip 保留 explicit zero 與 positive plan input，並省略 absent', () => {
  const persisted = normalizeCashFlowProfile(baseProfile({ externalContribution: 0, plannedWithdrawal: 1_234 }));
  const restored = normalizeCashFlowProfile(JSON.parse(JSON.stringify(persisted)));
  assert.deepEqual(restored, persisted);
  assert.deepEqual(JSON.parse(JSON.stringify(normalizeCashFlowProfile(baseProfile()))), {
    schemaVersion: 3,
    monthlyIncome: null,
    fixedExpenses: [],
    variableExpenseBudget: null,
    monthlyInvestmentBudget: null,
    emergencyFundTargetMonths: 6,
    notes: ''
  });
});

test('7. Adapter 僅從正式 Cash Flow plan input 映射，absent 仍為 Core unavailable', () => {
  const absent = buildHouseholdLiquidityInput(adapterSource(normalizeCashFlowProfile(baseProfile())));
  assert.ok(Number.isNaN(absent.externalContribution));
  assert.ok(Number.isNaN(absent.plannedWithdrawal));

  const configured = buildHouseholdLiquidityInput(adapterSource(normalizeCashFlowProfile(baseProfile({ externalContribution: 0, plannedWithdrawal: 1_234 }))));
  assert.equal(configured.externalContribution, 0);
  assert.equal(configured.plannedWithdrawal, 1_234);
});

test('8. Adapter 不從 monthlyInvestmentBudget 或 legacy source 欄位 fallback', () => {
  const source = {
    ...adapterSource(normalizeCashFlowProfile(baseProfile({ monthlyInvestmentBudget: 9_999 }))),
    externalContribution: 7_777,
    plannedWithdrawal: 6_666
  };
  const input = buildHouseholdLiquidityInput(source);
  assert.ok(Number.isNaN(input.externalContribution));
  assert.ok(Number.isNaN(input.plannedWithdrawal));
});

test('9. v1、v2、latest、missing 與 malformed version 都遷移至可預期的 v3 contract', () => {
  for (const schemaVersion of [1, 2, 3, undefined, null, '2', Number.NaN]) {
    const migrated = migrateCashFlowProfile(baseProfile({ schemaVersion, externalContribution: 0, plannedWithdrawal: 500 }));
    assert.equal(migrated.schemaVersion, 3);
    assert.equal(migrated.externalContribution, 0);
    assert.equal(migrated.plannedWithdrawal, 500);
  }
});

test('10. invalid persisted plan input 不會進入 JSON、Adapter 或 Core 所需的正式 runtime state', () => {
  const normalized = normalizeCashFlowProfile(baseProfile({ externalContribution: -1, plannedWithdrawal: '500' }));
  assert.equal(normalized.externalContribution, undefined);
  assert.equal(normalized.plannedWithdrawal, undefined);
  assert.doesNotMatch(JSON.stringify(normalized), /externalContribution|plannedWithdrawal|NaN|Infinity/);
  const input = buildHouseholdLiquidityInput(adapterSource(normalized));
  assert.ok(Number.isNaN(input.externalContribution));
  assert.ok(Number.isNaN(input.plannedWithdrawal));
});

test('11. localStorage state normalizer、Backup import 與 export 都經過同一個 Cash Flow normalizer', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /const cashFlowProfile = r\.cashFlowProfile === undefined \? undefined : normalizeCashFlowProfile\(r\.cashFlowProfile\)/);
  assert.ok(app.includes('...(normalized.cashFlowProfile ? { cashFlowProfile: normalized.cashFlowProfile } : {})'));
  assert.ok(app.includes('...(r.cashFlowProfile === undefined ? {} : { cashFlowProfile: r.cashFlowProfile })'));
});

test('12. Firebase canonical snapshot 區分 absent、explicit zero 與 positive plan input', () => {
  const absent = createSyncPayloadSnapshot({ cashFlowProfile: normalizeCashFlowProfile(baseProfile()) });
  const zero = createSyncPayloadSnapshot({ cashFlowProfile: normalizeCashFlowProfile(baseProfile({ externalContribution: 0, plannedWithdrawal: 0 })) });
  const positive = createSyncPayloadSnapshot({ cashFlowProfile: normalizeCashFlowProfile(baseProfile({ externalContribution: 1_000, plannedWithdrawal: 200 })) });
  assert.notEqual(absent.canonicalJson, zero.canonicalJson);
  assert.notEqual(zero.canonicalJson, positive.canonicalJson);
  assert.match(zero.canonicalJson, /"externalContribution":0/);
  assert.match(positive.canonicalJson, /"plannedWithdrawal":200/);
});

test('13. plan input round-trip 不持久化 Household Liquidity 的 runtime derived result', () => {
  const persisted = JSON.stringify(normalizeCashFlowProfile(baseProfile({ externalContribution: 0, plannedWithdrawal: 1 })));
  assert.doesNotMatch(persisted, /investableCash|executableBudget|blockingReasons|confidence|canExecuteBuy|HouseholdLiquidityResult/);
});

test('14. Adapter 對 CLEC、Simulator 與任意額外 source 欄位無 fallback', () => {
  const source = {
    ...adapterSource(normalizeCashFlowProfile(baseProfile())),
    clec: { plannedContribution: 8_000, plannedWithdrawal: 7_000 },
    simulator: { contribution: 6_000 },
    externalContribution: 5_000,
    plannedWithdrawal: 4_000
  };
  const result = buildHouseholdLiquidityInput(source);
  assert.ok(Number.isNaN(result.externalContribution));
  assert.ok(Number.isNaN(result.plannedWithdrawal));
});

test('15. Adapter 與 plan input normalizer 對同一份來源均為 deterministic 且 immutable', () => {
  const profile = normalizeCashFlowProfile(baseProfile({ externalContribution: 100, plannedWithdrawal: 20 }));
  const source = adapterSource(profile);
  const snapshot = structuredClone(source);
  assert.deepEqual(normalizeHouseholdLiquidityPlanInput(profile), normalizeHouseholdLiquidityPlanInput(profile));
  assert.deepEqual(buildHouseholdLiquidityInput(source), buildHouseholdLiquidityInput(source));
  assert.deepEqual(source, snapshot);
});

test('16. 正式 consumer、Rebalance、Execution Eligibility 與舊 order helper 都沒有接入 Adapter 或 Core', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const rebalance = readFileSync(new URL('../src/lib/rebalanceRecommendation.ts', import.meta.url), 'utf8');
  const eligibility = readFileSync(new URL('../src/lib/rebalanceExecutionEligibility.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /householdLiquidityInputAdapter|buildHouseholdLiquidityInput|deriveHouseholdLiquidity/);
  assert.doesNotMatch(rebalance, /householdLiquidityInputAdapter|deriveHouseholdLiquidity/);
  assert.doesNotMatch(eligibility, /householdLiquidityInputAdapter|deriveHouseholdLiquidity/);
});
