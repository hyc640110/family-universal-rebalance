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
import { deriveHouseholdLiquidityInputDiagnostics } from '../src/lib/householdLiquidityInputDiagnostics';
import { deriveHouseholdLiquidity } from '../src/lib/householdLiquidity';

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

test('11. portable JSON payload round-trip 保留 provenance', () => {
  const cashFlowProfile = normalized({ fixedExpenses: [{ id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }] });
  const restored = normalized(JSON.parse(JSON.stringify({ cashFlowProfile })).cashFlowProfile);
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

test('18. V7.0B sub-PR 1 (UR-TODO-008): App.tsx now wires the Adapter for buy-only budget only, and still never touches provenance-level liquidityRole/linkedLoanId directly', () => {
  // 2026-07-25 update: previously asserted zero Adapter references, matching Sprint 1/2's "no consumer yet" scope
  // (013 §29.1). V7.0B sub-PR 1 (see AI_CONTEXT/008_TODO_BACKLOG.md UR-TODO-008) deliberately wires App.tsx's
  // buy-only budget to buildHouseholdLiquidityInput/deriveHouseholdLiquidity; this only reads the Adapter's
  // aggregate output (investableCash), it never reads or writes the provenance fields (liquidityRole/linkedLoanId)
  // themselves, so those two identifiers must still never appear in App.tsx.
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /householdLiquidityInputAdapter/);
  assert.match(app, /buildHouseholdLiquidityInput/);
  assert.doesNotMatch(app, /liquidityRole|linkedLoanId/);
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

test('25. portable JSON payload 保留 optional missing 與 explicit provenance 的差異', () => {
  const missing = JSON.stringify({ cashFlowProfile: normalized({ fixedExpenses: [{ id: 'legacy', name: '水電', amount: 1, category: 'utilities', enabled: true }] }) });
  const explicit = JSON.stringify({ cashFlowProfile: normalized({ fixedExpenses: [{ id: 'living', name: '水電', amount: 1, category: 'utilities', enabled: true, liquidityRole: 'essential-living' }] }) });
  assert.notEqual(missing, explicit);
  assert.doesNotMatch(missing, /linkedLoanId/);
});

test('26. P2-A App 已移除主動 Firebase runtime，未新增自動同步或網路 API', () => {
  // 2026-07-25: the householdLiquidityInputAdapter clause was dropped from this assertion — that guard belongs to,
  // and is now covered by, test 18 above (V7.0B sub-PR 1 intentionally wires the Adapter for buy-only budget).
  // This test's own concern (no Firebase realtime auto-sync) is unrelated and unaffected.
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /onValue\(/);
  assert.doesNotMatch(app, /uploadCloud\(|downloadCloud\(/);
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

test('28. legacy 未宣告 role、explicit ambiguous 與未設定 plan 會回報可行動診斷，但不修改資料', () => {
  const cashFlowProfile = normalized({ fixedExpenses: [
    { id: 'housing', name: '房貸', amount: 3_000, category: 'housing', enabled: true },
    { id: 'ambiguous', name: '其他', amount: 1_000, category: 'other', enabled: true, liquidityRole: 'ambiguous' },
    { id: 'utility', name: '水電', amount: 500, category: 'utilities', enabled: true }
  ] });
  const snapshot = structuredClone(cashFlowProfile);

  // UR-TODO-044 Phase 2a: CASH_FLOW_ROLE_UNASSIGNED no longer depends on category (housing/loan/other vs the
  // other five) — an unset liquidityRole always surfaces this diagnostic, so 'utility' (category: 'utilities')
  // now reports it too. deriveHouseholdLiquidityInputDiagnostics itself does not sort by priority (that only
  // happens in presentHouseholdLiquidityDiagnostics), so diagnostics appear in fixedExpenses source order.
  assert.deepEqual(deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile, loans: [{ id: 'loan-1' }] }), [
    { code: 'CASH_FLOW_ROLE_UNASSIGNED', sourceId: 'cash-flow:housing' },
    { code: 'CASH_FLOW_ROLE_AMBIGUOUS', sourceId: 'cash-flow:ambiguous' },
    { code: 'CASH_FLOW_ROLE_UNASSIGNED', sourceId: 'cash-flow:utility' },
    { code: 'EXTERNAL_CONTRIBUTION_UNSET' },
    { code: 'PLANNED_WITHDRAWAL_UNSET' }
  ]);
  assert.deepEqual(cashFlowProfile, snapshot);
});

test('29. missing、orphan 與 valid debt linkage 可被區分，explicit zero 不會誤判為未設定', () => {
  const cashFlowProfile = normalized({ fixedExpenses: [
    { id: 'missing', name: '未連結', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment' },
    { id: 'orphan', name: '失效連結', amount: 2_000, category: 'loan', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'missing-loan' },
    { id: 'valid', name: '合法連結', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }
  ], externalContribution: 0, plannedWithdrawal: 0 });

  assert.deepEqual(deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile, loans: [{ id: 'loan-1' }] }), [
    { code: 'DEBT_PAYMENT_LINK_REQUIRED', sourceId: 'cash-flow:missing' },
    { code: 'DEBT_PAYMENT_LINK_ORPHANED', sourceId: 'cash-flow:orphan', loanId: 'missing-loan' }
  ]);
});

test('30. migration 與 portable JSON round-trip 不改變診斷，且診斷不會被持久化', () => {
  const original = normalized({ fixedExpenses: [{ id: 'legacy', name: '房貸', amount: 3_000, category: 'housing', enabled: true }] });
  const expected = deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile: original, loans: [{ id: 'loan-1' }] });
  const jsonRestored = normalized(JSON.parse(JSON.stringify(original)));
  const portableRestored = normalized(JSON.parse(JSON.stringify({ cashFlowProfile: original })).cashFlowProfile);

  assert.deepEqual(deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile: jsonRestored, loans: [{ id: 'loan-1' }] }), expected);
  assert.deepEqual(deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile: portableRestored, loans: [{ id: 'loan-1' }] }), expected);
  assert.doesNotMatch(JSON.stringify(original), /CASH_FLOW_ROLE_UNASSIGNED|DEBT_PAYMENT_LINK_REQUIRED|DIAGNOSTIC/);
});

test('31. null 或 undefined Cash Flow Profile 會回報來源缺失，且不誤當作空白設定', () => {
  for (const cashFlowProfile of [null, undefined]) {
    assert.deepEqual(deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile, loans: [] }), [
      { code: 'CASH_FLOW_PROFILE_MISSING' }
    ]);
  }
});

test('32. unavailable Loan source 與空 Loan 陣列的 orphan linkage 必須區分', () => {
  const cashFlowProfile = normalized({ fixedExpenses: [
    { id: 'debt', name: '房貸', amount: 3_000, category: 'housing', enabled: true, liquidityRole: 'debt-payment', linkedLoanId: 'loan-1' }
  ], externalContribution: 0, plannedWithdrawal: 0 });

  for (const loans of [null, undefined]) {
    assert.deepEqual(deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile, loans }), [
      { code: 'LOAN_SOURCE_UNAVAILABLE', sourceId: 'cash-flow:debt', loanId: 'loan-1' }
    ]);
  }
  assert.deepEqual(deriveHouseholdLiquidityInputDiagnostics({ cashFlowProfile, loans: [] }), [
    { code: 'DEBT_PAYMENT_LINK_ORPHANED', sourceId: 'cash-flow:debt', loanId: 'loan-1' }
  ]);
});
