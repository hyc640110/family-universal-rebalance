import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveAllocationSimulatorFunding } from '../src/lib/allocationSimulatorFunding';

test('Simulator 將現有可投資現金、外部投入、提款與受保護安全現金分開，預設不動用安全現金', () => {
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

test('Simulator 只有明確開啟安全現金假設時才加入實際可用的受保護現金', () => {
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

test('Simulator 安全現金假設永遠不超過目前實際流動現金', () => {
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

test('Simulator 保留 explicit zero 為已知金額，不將它誤判為 unavailable', () => {
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

test('Simulator 對 absent、null、NaN 與 Infinity plan input 維持 unavailable，不以零取代', () => {
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

test('Simulator 對 unavailable 提款維持 unavailable，不以零取代', () => {
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

test('Simulator 對 unavailable 現金或安全存量維持 unavailable 並回傳 blocking reason', () => {
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

test('Simulator 對超過所有已知來源的提款回傳零並明示 blocking 與 warning', () => {
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

test('Simulator funding selector 為 deterministic 且不修改輸入', () => {
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
