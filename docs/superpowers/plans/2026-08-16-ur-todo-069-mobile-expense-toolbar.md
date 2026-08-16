# UR-TODO-069 手機版固定支出工具列 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 390px 手機版的固定支出勾選框、完整「計入支出」文字與刪除圖示維持同一列，且不改變桌機版或資料行為。

**Architecture:** 僅在既有的 `@media(max-width:768px)` 內對 `.retirement-expense-enabled` 加入不換行規則。React 元件、刪除確認、持久化與計算均不變；測試鎖住完整可存取文字與工具列結構，治理文件記錄此 PR #372 後的手機修正。

**Tech Stack:** React、TypeScript、CSS、Vitest、Vite、AI_CONTEXT Bundle generator。

## Global Constraints

- 僅手機斷點 `max-width:768px` 可變更此工具列的版面。
- 視覺與可存取文案均保留「計入支出」。
- 垃圾桶按鈕維持至少 44×44px。
- 不修改 JSX、刪除確認、資料結構、計算邏輯或桌機 CSS。
- 僅在完成驗證後建立 Draft PR；不得自行 Merge。

---

### Task 1: 鎖住手機工具列的完整文案與結構

**Files:**
- Modify: `tests/retirementPlannerPage.test.ts`

**Interfaces:**
- Consumes: 每筆支出卡片的 `.retirement-expense-toolbar`、`.retirement-expense-enabled` 與 `.retirement-expense-delete`。
- Produces: regression test，要求原生 label 保留「計入支出」文字且工具列同時包含 checkbox 與垃圾桶按鈕。

- [x] **Step 1: 新增失敗測試**

在既有刪除按鈕測試旁新增 assertion：

```ts
expect(toolbar.textContent).toContain('計入支出');
expect(toolbar.querySelector('input[type="checkbox"]')).not.toBeNull();
expect(toolbar.querySelector('.retirement-expense-delete')).not.toBeNull();
```

- [x] **Step 2: 執行退休規劃頁測試，確認新 assertion 在既有結構上通過**

Run: `npx tsx --test tests/retirementPlannerPage.test.ts`

Expected: 新增的手機 CSS assertion 在尚未加入規則時 FAIL；既有 JSX contract 則維持原樣。

- [ ] **Step 3: Commit**

```bash
git add tests/retirementPlannerPage.test.ts
git commit -m "test: cover retirement expense toolbar semantics"
```

### Task 2: 僅在手機斷點防止完整文字換行

**Files:**
- Modify: `src/styles.css: @media(max-width:768px)`

**Interfaces:**
- Consumes: `.retirement-expense-enabled` flex label 與既有 44px `.retirement-expense-delete`。
- Produces: 手機版 label 的單行顯示；桌機規則不變。

- [x] **Step 1: 寫入最小 CSS**

在既有手機 media query 加入：

```css
.retirement-expense-enabled{white-space:nowrap}
```

- [ ] **Step 2: 驗證型別、測試與雙環境建置**

Run: `npx tsc -b && npm run test:ci && npm run build && npm run build:preview`

Expected: 全部 exit 0；既有非阻斷 warning 只記錄、不修正。

- [ ] **Step 3: 以瀏覽器量測 390px 與桌機**

390px 要求 label 高度不超過 44px、工具列單列、文件無水平溢出、刪除按鈕至少 44×44px；桌機保留完整文案與既有橫列工具列。

- [ ] **Step 4: Commit**

```bash
git add src/styles.css tests/retirementPlannerPage.test.ts
git commit -m "fix: keep retirement expense controls inline on mobile"
```

### Task 3: 同步治理文件、Bundle、Preview 與 Draft PR

**Files:**
- Modify: `AI_CONTEXT/003_CURRENT_STATUS.md`
- Modify: `AI_CONTEXT/008_TODO_BACKLOG.md`
- Modify: `AI_CONTEXT/012_AI_HANDOVER.md`
- Modify: `AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle.md`
- Modify: `AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle_Lite.md`

**Interfaces:**
- Consumes: UR-TODO-069 的 PR #372 merge 事實與本次手機斷點修正範圍。
- Produces: 最新 in-progress governance snapshot 與由官方 generator 生成的 Full／Lite Bundle。

- [ ] **Step 1: 更新治理來源文件**

記錄本次是 PR #372 後的同一 Todo 手機版 follow-up：完整「計入支出」保留、只修正 390px 的文字換行、桌機與刪除資料行為不變、等待 Preview 驗收與使用者 Merge 指示。

- [ ] **Step 2: 產生並驗證 Bundle**

Run: `python tools/build_ai_context_bundle.py && python tools/test_build_ai_context_bundle.py && git diff --check`

Expected: bundle tests 2 passed，diff check pass。

- [ ] **Step 3: Commit、Push、Draft PR**

```bash
git add AI_CONTEXT docs/superpowers
git commit -m "docs: track UR-TODO-069 mobile toolbar follow-up"
git push -u origin codex/ur-todo-069-mobile-expense-toolbar
gh pr create --draft --base main --head codex/ur-todo-069-mobile-expense-toolbar --title "fix: keep retirement expense controls inline on mobile"
```

- [ ] **Step 4: 觸發並驗證既有 Preview deployment**

Run: `gh workflow run deploy.yml --ref codex/ur-todo-069-mobile-expense-toolbar`

Expected: workflow_dispatch 成功；Production 建置自最新 main、Preview 建置自本 branch；兩者 HTTP 200 與 environment metadata 正確並具 assets 隔離證據。
