import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  CASH_FLOW_SCHEMA_VERSION,
  DEFAULT_CASH_FLOW_PROFILE,
  migrateCashFlowProfile,
  normalizeCashFlowProfile,
  type CashFlowProfile
} from '../src/lib/cashFlow';
import { buildHouseholdLiquidityInput } from '../src/lib/householdLiquidityInputAdapter';
import { deriveHouseholdLiquidity } from '../src/lib/householdLiquidity';
import { createSyncPayloadSnapshot } from '../src/lib/syncState';

const profile = (overrides: Partial<CashFlowProfile> = {}): CashFlowProfile => ({
  monthlyIncome: null, fixedExpenses: [{ id: 'utilities', name: '水電', amount: 500, category: 'utilities', enabled: true }],
  variableExpenseBudget: 200, monthlyInvestmentBudget: null, emergencyFundTargetMonths: 6, externalContribution: 0, plannedWithdrawal: 0, ...overrides
});
const normalized = (value: unknown) => normalizeCashFlowProfile(value);
const source = (cashFlowProfile: CashFlowProfile, loans = [{ id: 'loan-1', monthlyPayment: 3_000 }]) => ({
  accounts: [{ id: 'cash', name: '現金', type: 'cash' as const, balanceMode: 'manual' as const, manualBalance: 100_000, currency: 'TWD', institutionName: '', note: '', isActive: true, sortOrder: 0, createdAt: '', updatedAt: '' }],
  legacyCash: [], loans, cashFlowProfile, configuredBudget: 1_000
});

test('1. legacy Cash Flow 缺少 provenance 仍可載入且不虛構 role 或 linkage', () => {
  const result = normalized({ fixedExpenses: [{ id: 'housing', name: '房貸', amount: 3_000, category: 'housing', enabled: true }] });
  assert.equal(result.schemaVersion, CASH_FLOW_SCHEMA_VERSION);
  assert.deepEqual(result.fixedExpenses[0], { id: 'housing', name: '房貸', amount: 3_000, category: 'housing', enabled: true });
});

test('2. valid explicit liquidityRole 與 linkedLoanId 可保存', () => {
  const result = normalized({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }] });
  assert.equal(result.fixedExpenses[0].liquidityRole, 'debt-payment');
  assert.equal(result.fixedExpenses[0].linkedLoanId, 'loan-1');
});

test('3. invalid liquidityRole 保守降級為未指定', () => {
  const result = normalized({ fixedExpenses: [{ id: 'bad', name: 'x', amount: 1, category: 'utilities', enabled: true, liquidityRole: 'invented' }] });
  assert.equal(result.fixedExpenses[0].liquidityRole, undefined);
});

test('4. null、空白與非字串 linkedLoanId 不被持久化', () => {
  for (const linkedLoanId of [null, '', '  ', 123]) {
    const result = normalized({ fixedExpenses: [{ id: 'debt', name: 'x', amount: 1, category: 'loan', enabled: true, liquidityRole: 'debt-payment', linkedLoanId }] });
    assert.equal(result.fixedExpenses[0].linkedLoanId, undefined);
  }
});

test('5. 非 debt-payment role 的 linkage 不一致時保守移除 linkage', () => {
  const result = normalized({ fixedExpenses: [{ id: 'living', name: 'x', amount: 1, category: 'utilities', enabled: true, liquidityRole: 'essential-living', linkedLoanId: 'loan-1' }] });
  assert.equal(result.fixedExpenses[0].liquidityRole, 'essential-living');
  assert.equal(result.fixedExpenses[0].linkedLoanId, undefined);
});

test('6. migration 為 deterministic、idempotent 且不修改輸入', () => {
  const legacy = { fixedExpenses: [{ id: 'housing', name: '房貸', amount: 3_000, category: 'housing', enabled: true }] };
  const snapshot = structuredClone(legacy);
  const once = migrateCashFlowProfile(legacy);
  const twice = migrateCashFlowProfile(once);
  assert.deepEqual(once, twice);
  assert.deepEqual(legacy, snapshot);
});

test('7. 未指定 legacy housing、loan、名稱與相同金額均不猜測 linkage', () => {
  const result = normalized({ fixedExpenses: [
    { id: 'housing', name: '房貸 loan-1', amount: 3_000, category: 'housing', enabled: true },
    { id: 'loan', name: 'loan-1', amount: 3_000, category: 'loan', enabled: true }
  ] });
  assert.ok(result.fixedExpenses.every(item => item.liquidityRole === undefined && item.linkedLoanId === undefined));
});

test('8. 只有單一 Loan 不會讓 migration 產生 linkage', () => {
  const result = normalized({ fixedExpenses: [{ id: 'loan', name: '信貸', amount: 3_000, category: 'loan', enabled: true }] });
  assert.equal(result.fixedExpenses[0].linkedLoanId, undefined);
});

test('9. future schema version 不被降版，舊版升至目前版本', () => {
  assert.equal(normalized({ schemaVersion: 1 }).schemaVersion, CASH_FLOW_SCHEMA_VERSION);
  assert.equal(normalized({ schemaVersion: CASH_FLOW_SCHEMA_VERSION + 1 }).schemaVersion, CASH_FLOW_SCHEMA_VERSION + 1);
});

test('10. JSON localStorage round-trip 保留明確 provenance 且不含 NaN', () => {
  const before = normalized({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }] });
  const restored = normalized(JSON.parse(JSON.stringify(before)));
  assert.deepEqual(restored, before);
  assert.doesNotMatch(JSON.stringify(restored), /NaN|Infinity/);
});

test('11. Firebase canonical snapshot round-trip 保留 provenance', () => {
  const cashFlowProfile = normalized({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }] });
  const snapshot = createSyncPayloadSnapshot({ cashFlowProfile });
  const restored = normalized(JSON.parse(snapshot.canonicalJson).cashFlowProfile);
  assert.deepEqual(restored, cashFlowProfile);
});

test('12. Backup／Import 共用正式 normalizer 並保留 provenance', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const input = normalized({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }] });
  assert.deepEqual(normalized(JSON.parse(JSON.stringify({ cashFlowProfile: input })).cashFlowProfile), input);
  assert.match(app, /const cashFlowProfile = r\.cashFlowProfile === undefined \? undefined : normalizeCashFlowProfile\(r\.cashFlowProfile\)/);
  assert.match(app, /cashFlowProfile: normalized\.cashFlowProfile/);
});

test('13. explicit essential-living、excluded 與 valid debt-payment 正確映射', () => {
  const input = buildHouseholdLiquidityInput(source(profile({ fixedExpenses: [
    { id: 'living', name: '水電', amount: 500, category: 'utilities', enabled: true, liquidityRole: 'essential-living' },
    { id: 'off', name: '關閉', amount: 1, category: 'utilities', enabled: true, liquidityRole: 'excluded' },
    { id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }
  ] })));
  assert.deepEqual(input.livingExpenses.slice(0, 3), [
    { sourceId: 'cash-flow:living', amount: 500, role: 'essential-living' },
    { sourceId: 'cash-flow:off', amount: 1, role: 'excluded' },
    { sourceId: 'cash-flow:debt', amount: 3_000, role: 'debt-payment', linkedLoanId: 'loan-1' }
  ]);
});

test('14. debt-payment 缺少或 orphan linkage 均保持 ambiguous', () => {
  for (const linkedLoanId of [undefined, 'missing']) {
    const input = buildHouseholdLiquidityInput(source(profile({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', ...(linkedLoanId ? { linkedLoanId } : {}) }] })));
    assert.equal(input.livingExpenses[0].role, 'ambiguous');
    assert.equal(input.livingExpenses[0].linkedLoanId, undefined);
  }
});

test('15. valid debt linkage 只用 Loan monthlyPayment，不重複加計 Cash Flow 金額', () => {
  const core = deriveHouseholdLiquidity(buildHouseholdLiquidityInput(source(profile({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }] }))));
  assert.equal(core.monthlyDebtPayments, 3_000);
  assert.equal(core.monthlyLivingExpenses, 200);
  assert.equal(core.monthlyEssentialExpenses, 3_200);
  assert.equal(core.blockingReasons.some(reason => reason.code === 'DEBT_PAYMENT_AMBIGUOUS'), false);
});

test('16. invalid provenance 經 Adapter→Core 仍會阻擋且不可執行', () => {
  const core = deriveHouseholdLiquidity(buildHouseholdLiquidityInput(source(profile({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment' }] }))));
  assert.equal(core.canExecuteBuy, false);
  assert.ok(core.blockingReasons.some(reason => reason.code === 'DEBT_PAYMENT_AMBIGUOUS'));
});

test('17. legacy ambiguous、mixed liquidity 與 missing plan 的 Core gate 保持有效', () => {
  const legacy = buildHouseholdLiquidityInput({ ...source(profile({ fixedExpenses: [{ id: 'housing', name: '房貸', amount: 3_000, category: 'housing', enabled: true }], externalContribution: undefined, plannedWithdrawal: undefined })), legacyCash: [{ id: 'legacy', amount: 1 }] });
  const codes = deriveHouseholdLiquidity(legacy).blockingReasons.map(reason => reason.code);
  assert.ok(codes.includes('DEBT_PAYMENT_AMBIGUOUS'));
  assert.ok(codes.includes('MIXED_LIQUID_ACCOUNT_SOURCES'));
  assert.ok(codes.includes('EXTERNAL_CONTRIBUTION_INVALID'));
  assert.ok(codes.includes('PLANNED_WITHDRAWAL_INVALID'));
});

test('18. 正式 consumer import graph 未接入 Adapter 或 provenance helper', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /householdLiquidityInputAdapter|buildHouseholdLiquidityInput|liquidityRole|linkedLoanId/);
});

test('19. 預設 Cash Flow profile 明確使用目前 schema version', () => {
  assert.equal(DEFAULT_CASH_FLOW_PROFILE.schemaVersion, CASH_FLOW_SCHEMA_VERSION);
});

test('20. explicit ambiguous role 保留，但不附帶不一致 linkage', () => {
  const result = normalized({ fixedExpenses: [{ id: 'ambiguous', name: '其他', amount: 1, category: 'other', enabled: true, liquidityRole: 'ambiguous', linkedLoanId: 'loan-1' }] });
  assert.equal(result.fixedExpenses[0].liquidityRole, 'ambiguous');
  assert.equal(result.fixedExpenses[0].linkedLoanId, undefined);
});

test('21. disabled item 永遠映射 excluded，即使保存了 debt provenance', () => {
  const input = buildHouseholdLiquidityInput(source(profile({ fixedExpenses: [{ id: 'off', name: '已關閉', amount: 3_000, category: 'loan', enabled: false, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }] })));
  assert.deepEqual(input.livingExpenses[0], { sourceId: 'cash-flow:off', amount: 3_000, role: 'excluded' });
});

test('22. invalid amount 不會將 NaN 或 Infinity 寫入持久化 JSON', () => {
  for (const amount of [Number.NaN, Infinity, -Infinity]) {
    const result = normalized({ fixedExpenses: [{ id: 'bad', name: 'x', amount, category: 'utilities', enabled: true }] });
    assert.equal(Number.isFinite(result.fixedExpenses[0].amount), true);
    assert.doesNotMatch(JSON.stringify(result), /NaN|Infinity/);
  }
});

test('23. linkedLoanId 會 trim，但不會由名稱或金額補造', () => {
  const explicit = normalized({ fixedExpenses: [{ id: 'debt', name: '無關名稱', amount: 1, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: ' loan-1 ' }] });
  const inferred = normalized({ fixedExpenses: [{ id: 'loan-1', name: 'loan-1', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment' }] });
  assert.equal(explicit.fixedExpenses[0].linkedLoanId, 'loan-1');
  assert.equal(inferred.fixedExpenses[0].linkedLoanId, undefined);
});

test('24. orphan debt linkage 不由 Adapter 修正為其他 Loan', () => {
  const input = buildHouseholdLiquidityInput(source(profile({ fixedExpenses: [{ id: 'debt', name: 'loan-1', amount: 3_000, category: 'loan', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'missing' }] })));
  assert.deepEqual(input.livingExpenses[0], { sourceId: 'cash-flow:debt', amount: 3_000, role: 'ambiguous' });
});

test('25. sync canonical payload 保留 optional missing 與 explicit provenance 的差異', () => {
  const missing = createSyncPayloadSnapshot({ cashFlowProfile: normalized({ fixedExpenses: [{ id: 'legacy', name: '水電', amount: 1, category: 'utilities', enabled: true }] }) });
  const explicit = createSyncPayloadSnapshot({ cashFlowProfile: normalized({ fixedExpenses: [{ id: 'living', name: '水電', amount: 1, category: 'utilities', enabled: true, liquidityRole: 'essential-living' }] }) });
  assert.notEqual(missing.canonicalJson, explicit.canonicalJson);
  assert.doesNotMatch(missing.canonicalJson, /linkedLoanId/);
});

test('26. 現行手動 Firebase 路徑未新增自動同步或網路 API', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /onValue\(|householdLiquidityInputAdapter/);
  assert.match(app, /uploadCloud\(\)|downloadCloud\(\)/);
});

test('27. duplicate linkedLoanId 交由 Core 保守阻擋，不以 Cash Flow 金額重複加計', () => {
  const input = buildHouseholdLiquidityInput(source(profile({ fixedExpenses: [
    { id: 'debt-a', name: '房貸 A', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' },
    { id: 'debt-b', name: '房貸 B', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }
  ] })));
  const core = deriveHouseholdLiquidity(input);
  assert.equal(core.monthlyDebtPayments, null);
  assert.ok(core.blockingReasons.some(reason => reason.code === 'DUPLICATE_LOAN_LINK'));
});
