# UR-TODO-009 Risk Center Presentation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在兩個 Risk Center 頁面呈現 Household Liquidity 已提供的安全現金、可投資現金與資料品質資訊。

**Architecture:** `riskMetrics` 維持唯一的風險資料入口，只額外透傳核心模型既有的可信度與 blocking reasons。新增純 `riskPresentation` adapter 將 Risk Metrics 轉成 UI 可直接使用的資料品質與重複來源訊息，兩頁共用，避免頁面重算或複製判斷。

**Tech Stack:** React 19、TypeScript、Vite、Node `tsx --test`。

## Global Constraints

- 基線固定為 `origin/main` `05a2088`；只在 `feat/ur-todo-009-risk-center-presentation` worktree 修改。
- 不改核心公式、資料 schema、同步、AI Decision、Dashboard、todayDecision 或 investmentHealth。
- 明確排除 UR-TODO-041 負債資料過期警示與 Production 部署／Merge。
- Preview 與 Production 必須維持隔離；不操作固定 stash。

---

### Task 1: 建立可測試的 Risk 呈現 adapter

**Files:**
- Create: `src/lib/riskPresentation.ts`
- Test: `tests/riskPresentation.test.ts`
- Modify: `src/lib/riskMetrics.ts`

**Interfaces:**
- Consumes: `RiskMetrics` 中 `monthlyEssentialExpenses`、`safetyCashShortfall`、`investableCash`、`dataCompleteness`、`confidence`、`blockingReasons`。
- Produces: `deriveRiskPresentation(risk)`，回傳 nullable 金額、可信度標籤與只含重複來源的警示訊息。

- [x] **Step 1: 寫入失敗測試**

```ts
test('完整資料保留可投資現金並標示高可信度', () => {
  const view = deriveRiskPresentation(completeRisk);
  assert.equal(view.investableCash, 80_000);
  assert.equal(view.confidenceLabel, '高');
});
```

- [x] **Step 2: 執行測試並確認因模組不存在而失敗**

Run: `npx tsx --test tests/riskPresentation.test.ts`

- [x] **Step 3: 實作最小 adapter 與 Risk Metrics 透傳欄位**

```ts
export function deriveRiskPresentation(risk: RiskPresentationInput) {
  return { investableCash: risk.investableCash, confidenceLabel: confidenceLabels[risk.confidence] };
}
```

- [x] **Step 4: 執行 adapter 與 Risk Metrics 測試並確認通過**

Run: `npx tsx --test tests/riskPresentation.test.ts tests/riskMetrics.test.ts`

### Task 2: 將 adapter 接至兩個 Risk 頁面

**Files:**
- Modify: `src/pages/RiskCenterPage.tsx`
- Modify: `src/lib/portfolioRisk.ts`
- Modify: `src/pages/PortfolioRiskPage.tsx`
- Test: `tests/portfolioRisk.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `deriveRiskPresentation` 與 `riskMetrics` 透傳欄位。
- Produces: Risk Center 現金安全卡與 Portfolio Risk 現金／借款卡均顯示相同風險呈現資料。

- [x] **Step 1: 寫入失敗的 Portfolio Risk 傳遞測試**

```ts
assert.equal(view.cashLoan.investableCash, 80_000);
assert.deepEqual(view.cashLoan.duplicateSourceWarnings, ['流動現金輸入包含重複 accountId。']);
```

- [x] **Step 2: 執行測試並確認缺少欄位而失敗**

Run: `npx tsx --test tests/portfolioRisk.test.ts`

- [x] **Step 3: 最小化接線與 UI 呈現**

```tsx
<p><span>可投資現金</span><b>{money(presentation.investableCash)}</b></p>
```

- [x] **Step 4: 執行相關測試並確認通過**

Run: `npx tsx --test tests/riskPresentation.test.ts tests/riskMetrics.test.ts tests/portfolioRisk.test.ts`

### Task 3: 完成回歸、文件與 Preview 驗證

**Files:**
- Modify: `AI_CONTEXT/003_CURRENT_STATUS.md`
- Modify: `AI_CONTEXT/008_TODO_BACKLOG.md`
- Modify: `AI_CONTEXT/009_CHANGELOG.md`
- Modify: `AI_CONTEXT/012_AI_HANDOVER.md`
- Modify: `AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle.md`
- Modify: `AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle_Lite.md`

- [x] **Step 1: 執行完整自動驗證**

Run: `npm run test:ci; npx tsc -b; npm run build; npm run build:preview; npm run test:stability; git diff --check`

- [x] **Step 2: 執行 Preview 視覺驗收**

Run: `npm run build:preview` 後，以 Preview 專用頁面檢查 390px、1000px、1600px；確認無 Console error、無橫向溢出且 Production URL 未被操作。

- [x] **Step 3: 更新治理文件與重新產生 Bundle**

Run: `python tools/build_ai_context_bundle.py`

- [x] **Step 4: Commit、push 並建立 Draft PR**

Run: `git add <changed-files>; git commit -m "feat: present household liquidity in risk centers"; git push -u origin feat/ur-todo-009-risk-center-presentation; gh pr create --draft ...`

## 自我檢查

- 範圍覆蓋：Task 1 處理資料可信度與重複來源、Task 2 處理兩頁呈現、Task 3 處理驗證與 required AI_CONTEXT／Bundle 同步。
- 無 placeholder：所有任務均具體列出檔案、介面、命令與可觀察結果。
- 型別一致：兩頁只消費 `deriveRiskPresentation` 與 `PortfolioRiskView.cashLoan` 既有的風險資料流。
