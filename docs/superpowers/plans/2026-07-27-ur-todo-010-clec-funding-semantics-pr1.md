# UR-TODO-010 CLEC Funding Semantics PR1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 CLEC 的四個資金欄位接到既有 Household Liquidity 與 Cash Flow Profile 的正式輸出，且不改變策略規則本體。

**Architecture:** `App.tsx` 已建立唯一的 `householdLiquidityForRebalance` 輸出。CLEC adapter 新增純 `buildClecFundingSemantics` 接線函式，將該輸出與既有 `cashFlowProfile` 映射為四個 CLEC 欄位，再由既有 adapter 建立規則契約；所有 null 與 unavailable 均保留，不做 0 值補設。

**Tech Stack:** React、TypeScript、Node test runner、tsx。

## Global Constraints

- 僅處理 `availableCash`、`cashReserve`、`plannedContribution`、`plannedWithdrawal` 四個 CLEC 欄位接線。
- 不修改 `src/lib/clecStrategyRules.ts` 核心策略邏輯或 `src/lib/clecStrategy.ts` 文案。
- 不修改 Simulator、Household Liquidity 核心公式、schema、localStorage、Firebase 或 JSON Backup。
- `threshold.minCashReserve` 固定維持 `null`，不得啟用 `CASH_RESERVE_LOW`。
- `protectedSafetyCash` 不得作為可投資現金；unavailable 或 null 不得轉為 0。
- PR 必須維持 Draft；不得自行 Merge 或部署 Production。

---

### Task 1: 擴充 CLEC adapter 的資金來源契約與測試

**Files:**
- Modify: `src/lib/clecStrategyRuleAdapter.ts`
- Test: `tests/clecStrategyRules.test.ts`

**Interfaces:**
- Consumes: Household Liquidity 的 `investableCash`／`protectedSafetyCash` 與既有 `cashFlowProfile`。
- Produces: `buildClecFundingSemantics` 回傳四個 CLEC money 欄位，adapter 將它們保留傳入 `ClecRuleInput`。

- [ ] **Step 1: 寫入會失敗的 adapter 測試**

```ts
const funding = buildClecFundingSemantics({
  householdLiquidity: { investableCash: 12_000, protectedSafetyCash: 48_000 },
  cashFlowProfile: { externalContribution: 3_000, plannedWithdrawal: 1_000 }
});
assert.deepEqual(
  [funding.availableCash, funding.cashReserve, funding.plannedContribution, funding.plannedWithdrawal],
  [12_000, 48_000, 3_000, 1_000]
);
```

- [ ] **Step 2: 執行單檔測試並確認 RED**

Run: `npx tsx --test tests/clecStrategyRules.test.ts`

Expected: `buildClecFundingSemantics` 尚不存在，測試因缺少此匯出而失敗。

- [ ] **Step 3: 以最小修改擴充 adapter source 與 forwarding**

```ts
return {
  availableCash: source.householdLiquidity.investableCash,
  cashReserve: source.householdLiquidity.protectedSafetyCash,
  plannedContribution: source.cashFlowProfile?.externalContribution ?? null,
  plannedWithdrawal: source.cashFlowProfile?.plannedWithdrawal ?? null
};
```

- [ ] **Step 4: 重跑單檔測試並確認 GREEN**

Run: `npx tsx --test tests/clecStrategyRules.test.ts`

Expected: PASS；null、undefined 與非有限數值不會被轉為 0。

### Task 2: 將唯一 Household Liquidity／Cash Flow source 接到 CLEC 呼叫端

**Files:**
- Modify: `src/App.tsx`
- Test: `tests/clecStrategyRules.test.ts`

**Interfaces:**
- Consumes: `buildClecFundingSemantics`、`householdLiquidityForRebalance`、`state.cashFlowProfile`。
- Produces: CLEC adapter 接收四個已對應的值，`minCashReserve` 維持 null。

- [ ] **Step 1: 寫入來源接線 assertion**

```ts
const unavailable = buildClecFundingSemantics({
  householdLiquidity: { investableCash: null, protectedSafetyCash: null },
  cashFlowProfile: undefined
});
assert.deepEqual(unavailable, {
  availableCash: null,
  cashReserve: null,
  plannedContribution: null,
  plannedWithdrawal: null
});
```

- [ ] **Step 2: 執行單檔測試並確認 RED**

Run: `npx tsx --test tests/clecStrategyRules.test.ts`

Expected: 現行接線函式尚不存在，測試因缺少此匯出而失敗。

- [ ] **Step 3: 以最小修改替換 App 的四個 source 值**

```ts
...buildClecFundingSemantics({
  householdLiquidity: householdLiquidityForRebalance,
  cashFlowProfile: state.cashFlowProfile
}),
```

- [ ] **Step 4: 重跑單檔測試並確認 GREEN**

Run: `npx tsx --test tests/clecStrategyRules.test.ts`

Expected: PASS；`threshold.minCashReserve` 仍為 null，且沒有任何對 `clecStrategyRules.ts` 的修改。

### Task 3: 完整驗證與 Draft PR

**Files:**
- Verify: `src/App.tsx`, `src/lib/clecStrategyRuleAdapter.ts`, `tests/clecStrategyRules.test.ts`

- [ ] **Step 1: 執行 TypeScript、完整 CI、Production 與 Preview build**

```powershell
npx tsc -b
npm run test:ci
npm run build
npm run build:preview
```

- [ ] **Step 2: 執行範圍與產物檢查**

```powershell
git diff --check origin/main...HEAD
npm run check:environment-build-artifacts
git diff --name-only origin/main...HEAD
```

- [ ] **Step 3: 僅提交計畫與四欄接線的必要檔案，推送並建立 Draft PR**

```powershell
git add docs/superpowers/plans/2026-07-27-ur-todo-010-clec-funding-semantics-pr1.md src/App.tsx src/lib/clecStrategyRuleAdapter.ts tests/clecStrategyRules.test.ts
git commit -m "feat: wire CLEC funding semantics"
git push -u origin feat/ur-todo-010-clec-funding-semantics-pr1
gh pr create --draft --base main --head feat/ur-todo-010-clec-funding-semantics-pr1
```
