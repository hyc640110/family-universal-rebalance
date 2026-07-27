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
import { deriveAllocationSimulatorFunding } from '../src/lib/allocationSimulatorFunding';
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

test('16. V7.0B sub-PR 1 (UR-TODO-008): only the App.tsx buy-only wiring consumes Adapter/Core; Execution Eligibility and rebalanceRecommendation.ts itself stay unwired', () => {
  // 2026-07-25 update: this test previously asserted App.tsx had zero references, matching Sprint 1/2's explicit
  // "no consumer yet" scope (013 §29.1). V7.0B sub-PR 1 is the deliberate, user-authorized Sprint that crosses that
  // exact boundary for App.tsx's buy-only budget only (see AI_CONTEXT/008_TODO_BACKLOG.md UR-TODO-008). The App.tsx
  // assertion below has been flipped to assert-present to track this intentionally, not silently dropped.
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const rebalance = readFileSync(new URL('../src/lib/rebalanceRecommendation.ts', import.meta.url), 'utf8');
  const eligibility = readFileSync(new URL('../src/lib/rebalanceExecutionEligibility.ts', import.meta.url), 'utf8');
  assert.match(app, /householdLiquidityInputAdapter/);
  assert.match(app, /buildHouseholdLiquidityInput/);
  assert.match(app, /deriveHouseholdLiquidity/);
  // rebalanceRecommendation.ts stays a pure function: it only receives investableCash as plain input, it never
  // imports or calls the adapter/core itself.
  assert.doesNotMatch(rebalance, /householdLiquidityInputAdapter|deriveHouseholdLiquidity/);
  // Execution Eligibility remains fully out of V7.0B sub-PR 1's scope (deferred to a later UR-TODO-008 sub-PR).
  assert.doesNotMatch(eligibility, /householdLiquidityInputAdapter|deriveHouseholdLiquidity/);
});

test('17. Simulator 將現有可投資現金、外部投入、提款與受保護安全現金分開，預設不動用安全現金', () => {
  const result = deriveAllocationSimulatorFunding({
    totalLiquidCash: 300_000,
    protectedSafetyCash: 100_000,
    externalContribution: 50_000,
    plannedWithdrawal: 20_000,
    allowSafetyCashUsage: false
  });

  assert.deepEqual(result, {
    existingInvestableCash: 200_000,
    externalContribution: 50_000,
    protectedSafetyCash: 100_000,
    plannedWithdrawal: 20_000,
    usableProtectedSafetyCash: 100_000,
    simulationAvailableFunding: 230_000,
    isUnavailable: false,
    blockingReasons: [],
    warnings: []
  });
});

test('18. Simulator 只有明確開啟安全現金假設時才加入實際可用的受保護現金', () => {
  const result = deriveAllocationSimulatorFunding({
    totalLiquidCash: 300_000,
    protectedSafetyCash: 100_000,
    externalContribution: 50_000,
    plannedWithdrawal: 20_000,
    allowSafetyCashUsage: true
  });

  assert.equal(result.simulationAvailableFunding, 330_000);
  assert.equal(result.usableProtectedSafetyCash, 100_000);
  assert.deepEqual(result.warnings, ['SAFETY_CASH_USAGE_ASSUMPTION']);
  assert.deepEqual(result.blockingReasons, []);
});

test('19. Simulator 安全現金假設永遠不超過目前實際流動現金', () => {
  const result = deriveAllocationSimulatorFunding({
    totalLiquidCash: 40_000,
    protectedSafetyCash: 100_000,
    externalContribution: 0,
    plannedWithdrawal: 0,
    allowSafetyCashUsage: true
  });

  assert.equal(result.existingInvestableCash, 0);
  assert.equal(result.usableProtectedSafetyCash, 40_000);
  assert.equal(result.simulationAvailableFunding, 40_000);
});

test('20. Simulator 保留 explicit zero 為已知金額，不將它誤判為 unavailable', () => {
  const result = deriveAllocationSimulatorFunding({
    totalLiquidCash: 100_000,
    protectedSafetyCash: 100_000,
    externalContribution: 0,
    plannedWithdrawal: 0,
    allowSafetyCashUsage: false
  });

  assert.equal(result.existingInvestableCash, 0);
  assert.equal(result.externalContribution, 0);
  assert.equal(result.plannedWithdrawal, 0);
  assert.equal(result.simulationAvailableFunding, 0);
  assert.equal(result.isUnavailable, false);
});

test('21. Simulator 對 absent、null、NaN 與 Infinity plan input 維持 unavailable，不以零取代', () => {
  for (const invalidPlan of [undefined, null, Number.NaN, Infinity]) {
    const result = deriveAllocationSimulatorFunding({
      totalLiquidCash: 100_000,
      protectedSafetyCash: 20_000,
      externalContribution: invalidPlan,
      plannedWithdrawal: 0,
      allowSafetyCashUsage: false
    });

    assert.equal(result.externalContribution, null);
    assert.equal(result.simulationAvailableFunding, null);
    assert.equal(result.isUnavailable, true);
    assert.ok(result.blockingReasons.includes('EXTERNAL_CONTRIBUTION_UNAVAILABLE'));
  }
});

test('21a. Simulator 對 unavailable 提款維持 unavailable，不以零取代', () => {
  for (const invalidPlan of [undefined, null, Number.NaN, Infinity]) {
    const result = deriveAllocationSimulatorFunding({
      totalLiquidCash: 100_000,
      protectedSafetyCash: 20_000,
      externalContribution: 0,
      plannedWithdrawal: invalidPlan,
      allowSafetyCashUsage: false
    });

    assert.equal(result.plannedWithdrawal, null);
    assert.equal(result.simulationAvailableFunding, null);
    assert.equal(result.isUnavailable, true);
    assert.ok(result.blockingReasons.includes('PLANNED_WITHDRAWAL_UNAVAILABLE'));
  }
});

test('22. Simulator 對 unavailable 現金或安全存量維持 unavailable 並回傳 blocking reason', () => {
  const result = deriveAllocationSimulatorFunding({
    totalLiquidCash: null,
    protectedSafetyCash: 20_000,
    externalContribution: 0,
    plannedWithdrawal: 0,
    allowSafetyCashUsage: false
  });

  assert.equal(result.existingInvestableCash, null);
  assert.equal(result.usableProtectedSafetyCash, null);
  assert.equal(result.simulationAvailableFunding, null);
  assert.equal(result.isUnavailable, true);
  assert.deepEqual(result.blockingReasons, ['TOTAL_LIQUID_CASH_UNAVAILABLE']);
});

test('23. Simulator 對超過所有已知來源的提款回傳零並明示 blocking 與 warning', () => {
  const result = deriveAllocationSimulatorFunding({
    totalLiquidCash: 100_000,
    protectedSafetyCash: 80_000,
    externalContribution: 20_000,
    plannedWithdrawal: 121_000,
    allowSafetyCashUsage: true
  });

  assert.equal(result.simulationAvailableFunding, 0);
  assert.equal(result.isUnavailable, false);
  assert.deepEqual(result.blockingReasons, ['PLANNED_WITHDRAWAL_EXCEEDS_ALL_KNOWN_SOURCES']);
  assert.deepEqual(result.warnings, ['SAFETY_CASH_USAGE_ASSUMPTION', 'SIMULATION_FUNDING_DEPLETED_BY_WITHDRAWAL']);
});

test('24. Simulator funding selector 為 deterministic 且不修改輸入', () => {
  const input = {
    totalLiquidCash: 300_000,
    protectedSafetyCash: 100_000,
    externalContribution: 50_000,
    plannedWithdrawal: 20_000,
    allowSafetyCashUsage: false
  } as const;
  const snapshot = structuredClone(input);

  assert.deepEqual(deriveAllocationSimulatorFunding(input), deriveAllocationSimulatorFunding(input));
  assert.deepEqual(input, snapshot);
});
