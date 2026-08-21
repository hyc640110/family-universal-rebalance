# Universal Rebalance Idea Pool

版本：v0.3

最後更新：2026-08-21

## 0. 文件定位

本文件收錄「創意模式」（見 `016_Product_Decisions.md` 第 9 節）產出的新想法，**尚未評估、不算正式 Todo**，與 `008_TODO_BACKLOG.md` 的正式 P0～P4 清單分開存在。

本文件不是：

- `008_TODO_BACKLOG.md` 的替代品：任何想法只要經評估、確認要做，必須轉為正式 `UR-TODO-XXX` 項目寫入 Todo Backlog，才算正式排入工作範圍
- Roadmap 的替代品：本文件的想法不代表已規劃時程

2026-07-25 建立時尚無任何待收錄的想法；本次 V7.0A 只是骨架與規則建立，不主動從既有討論中挖掘想法灌入本文件。2026-07-26 收錄第一筆想法（IDEA-001，見第 3 節）。

---

## 1. 收錄規則

- 新想法一律先寫入本文件，不直接寫入 `008_TODO_BACKLOG.md`
- 每個想法至少記錄：提出日期、一句話描述、提出脈絡（哪次討論、哪個模式下產生）
- 想法在本文件中的狀態只有兩種：**尚未評估**、**已評估**（評估後若確認要做，移除本條並轉為 `008_TODO_BACKLOG.md` 的正式 UR-TODO 項目，同時在本文件標註「已轉為 UR-TODO-XXX」）

---

## 2. 週期檢討規則

**連續 3 個版本沒有被排進 Roadmap 的想法，必須重新檢討：提升優先級或移除。**

- 此規則**只適用於本文件（`019_Idea_Pool.md`）新增的項目**，**不追溯套用到現行 `008_TODO_BACKLOG.md` 既有的任何 UR-TODO 項目**（現行 P0～P4 五級制與既有項目維持不變，見 `016_Product_Decisions.md` 決定 5）。
- 「版本」以 `003_CURRENT_STATUS.md` 記載的正式版本序列為準。

---

## 3. 想法清單

### IDEA-001 Household Liquidity 全面盤點（待 UR-TODO-009／010／011 全部完成後）

- 提出日期：2026-07-26
- 提出脈絡：使用者與 ChatGPT 討論記錄，關於 Household Liquidity 模型跨 Sprint 完成後的收斂盤點構想
- 狀態：**已評估（2026-08-21）**
- 已檢討次數：1（前置 Sprint 於 2026-07-27／28 全部完成後，本次為第一次正式檢討）
- 構想內容：待 **UR-TODO-009**（Risk & Decision Workflow Integration）、**UR-TODO-010**（CLEC & Simulator Funding Semantics）、**UR-TODO-011**（Cross-Module Presentation Consistency）三個 Sprint 全部完成後，進行一次 Household Liquidity 全面盤點，重點包含：
  1. Protected Safety Cash 是否完整反映必要生活費（至少六個月）與必要負債還款安全存量。
  2. Investable Cash 是否建立在扣除 Protected Safety Cash 之後。
  3. Dashboard、Home、Risk Center、Rebalance、CLEC、Investment Decision 等所有使用現金判斷的模組，是否全部使用同一套 Household Liquidity 定義，沒有各自重新計算。
- 明確標註：**本項目目前僅為產品決策與後續盤點依據，不新增 UR-TODO、不擴大目前 Sprint 範圍**，待三個 Sprint（UR-TODO-009／010／011）全部完成後，再依實際盤點結果決定是否新增 Todo 或修改規格。
- **2026-08-21 正式評估結果：`REVIEWED / DO NOT PROMOTE TO UR-TODO`。** 前置 Sprint（UR-TODO-009／010／011）皆已於 2026-07-27／28 完成。以現有 Production Repository 逐項核對本構想三個檢核點：
  1. **已滿足**——`src/lib/householdLiquidity.ts:286`：`minimumSafetyCash = safeProduct(monthlyEssentialExpenses, 6)`，完整反映六個月生活費安全存量；`protectedSafetyCash` 併入必要負債還款安全存量。
  2. **已滿足**——`src/lib/householdLiquidity.ts:329`：`investableCash` 確認建立在扣除 `protectedSafetyCash` 之後。
  3. **已滿足**——UR-TODO-007 Consumer Contract Audit（2026-08-21，Review Mode）已用 grep 逐一驗證 Rebalance（UR-TODO-008）、Risk／AI／Home Decision（UR-TODO-009）、CLEC／Simulator（UR-TODO-010）全數透過同一 `householdLiquidityForRebalance`（`deriveHouseholdLiquidity()`）衍生值讀取，`rebalanceOrderHelper.ts`／`riskMetrics.ts`／`aiDecision.ts`／`homeDecision.ts`／`clecStrategyRules.ts` 對原始欄位零直接讀取、零各自重算。
  本構想關切的收斂盤點目的已透過 UR-TODO-008／009／010／046 的自然開發過程實質達成，即使從未被當作獨立 Sprint 執行；不新增 UR-TODO，不再需要另立一次獨立的全面盤點 Sprint。

格式範例（供未來收錄想法時參考）：

```text
### IDEA-002 〈一句話描述〉

- 提出日期：YYYY-MM-DD
- 提出脈絡：〈哪次討論、創意模式下的哪個構想〉
- 狀態：尚未評估
- 已檢討次數：0（每次版本迭代未被排入 Roadmap 則 +1，累積 3 次需重新檢討）
```

---

## 4. 版本歷史

- v0.3（2026-08-21）：IDEA-001 完成正式評估，結果 `REVIEWED / DO NOT PROMOTE TO UR-TODO`（前置 UR-TODO-009／010／011 皆已完成，三項檢核點經 Repository 實證確認已滿足），已檢討次數更新為 1。
- v0.2（2026-07-26）：收錄第一筆想法 IDEA-001（Household Liquidity 全面盤點構想，待 UR-TODO-009／010／011 全部完成後執行）。
- v0.1（2026-07-25）：建立骨架與收錄／週期檢討規則，落地 V7.0A Foundation & Product Governance 的一部分；目前無任何想法收錄。
