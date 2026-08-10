# Universal Rebalance Product Decisions

版本：v1.1

最後更新：2026-08-11

## 0. 文件定位

本文件記錄 Universal Rebalance 的**永久產品治理決策**：產品定位、審查機制、產品原則、版本代號哲學、命名區隔規則。這些決策一經確立，除非使用者明確要求，否則不輕易更動。

本文件不是：

- `002_MASTER_ROADMAP.md` 的替代品：長期 Sprint 順序與時程仍以 Roadmap 為準
- `003_CURRENT_STATUS.md` 的替代品：正式版本與環境狀態仍以 Current Status 為準
- `008_TODO_BACKLOG.md` 的替代品：未完成事項仍以 Todo Backlog 為唯一正式來源
- `013_HOUSEHOLD_LIQUIDITY_SPEC.md` 的替代品：財務模型細節仍以 013 為唯一正式來源

依 `000_AI_START_HERE.md` 第 2 節規定，本文件屬於「每次開始工作／開始開發至少讀取」清單項目之一，與 `001_README.md`、`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md` 同等級。

---

## 1. V7 定位

- 代號：**Product Polish & Financial Intelligence**
- 一句話目標：**打造以家庭安全為核心的財務決策平台，不是功能堆疊的理財工具。**

---

## 2. 三個審查機制

新增三項審查機制，作為未來 Sprint 流程的一部分（見第 9 節固定 Sprint 流程）：

- **Product Review（產品審查）**：每個功能檢查是否符合產品定位、是否增加使用成本、是否值得做。
- **Architecture Review（架構審查）**：新功能先盤點受影響模組，一次規劃完整，避免半年後重寫。
- **UX Review（體驗審查）**：每完成一個 Sprint 檢查首頁是否越來越複雜、操作是否越來越多步驟。

---

## 3. 十大產品原則（永久規則，未來不輕易更動）

1. 家庭安全永遠大於投資報酬
2. 首頁只做今日決策
3. 每個畫面只回答一個問題
4. Less is More
5. 資訊不要重複
6. 所有 AI 建議必須可執行（例如不要建議「增加現金」，而是「停止加碼、保留 18 萬安全資金」）
7. 所有計算共用同一套 Financial Model（即 [013_HOUSEHOLD_LIQUIDITY_SPEC.md](013_HOUSEHOLD_LIQUIDITY_SPEC.md)）
8. 所有 UI 遵守 Design System（[017_Design_System.md](017_Design_System.md)）
9. Mobile First（不是桌機縮小）
10. 每天三秒內知道今天要不要操作

---

## 4. 版本代號哲學

- **V6＝Feature Expansion**（大量增加功能）
- **V7＝Product Polish**（全面提升產品品質）
- **V8（未來）＝AI Financial Assistant**（真正主動協助）

---

## 5. 版本命名區隔規則（永久規則）

**背景**：2026-07-25 唯讀核對發現，`002_MASTER_ROADMAP.md` 的文件版號恰好也走到 `v7.x`（文件本身第 N 次改版的版號），與這裡定義的「V7＝Product Polish 產品功能版本代號」是**兩套完全不同、互不相關的編號系統**，同時存在時容易混淆。

**規則**：

- 「**V7**」系列（`V7.0A`、`V7.0B`、`V7.0C`……）**專指產品功能版本代號**，對應 `003_CURRENT_STATUS.md` 記載的正式版本序列（`V6.13`、`V6.17.3A`……之後的下一個版本世代）。
- `002_MASTER_ROADMAP.md` 開頭的「`v7.4`」這類版號是**文件本身的版本號**（文件迭代次數），與產品版本代號無關，純屬巧合撞號。
- **任何文件、PR 說明、Commit message、回報內容，只要可能造成「V7」與治理文件版號混淆，一律加類別前綴**，不得單寫「V7」或「v7.x」不加前綴：
  - 產品版本一律寫成「**產品版本 V7.0A**」「**產品版本 V7.0B**」……
  - 治理文件版號一律寫成「**Roadmap 文件 v7.x**」「**013 文件 v4.0**」……
- 本規則適用於所有 `AI_CONTEXT/` 文件與未來所有 AI 平台（Claude Code、Codex、ChatGPT）的回應，不因平台而異。

---

## 6. V7 Sprint 規劃（記錄規劃意圖，實際啟動仍需使用者另行確認）

以下規劃記錄目前的產品願景與 Sprint 邊界構想，**不代表已核准啟動**；每個 Sprint 實際開始開發前，仍須使用者明確下達「開始開發」指示，並依 `000_AI_START_HERE.md` 第 4 節固定流程執行。

- **V7.0A — Foundation & Product Governance**（本次工作）：建立本文件、`017_Design_System.md`、`018_Dashboard_UX_Guideline.md`、`019_Idea_Pool.md` 骨架；同步更新 `000_AI_START_HERE.md`、`002_MASTER_ROADMAP.md`、`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`、`013_HOUSEHOLD_LIQUIDITY_SPEC.md`。
- **V7.0B — Financial Liquidity Core**：**＝ [013_HOUSEHOLD_LIQUIDITY_SPEC.md](013_HOUSEHOLD_LIQUIDITY_SPEC.md) v4.0 所定義的 Sprint 3～6／UR-TODO-008～011**，不是另一份規格或另一個獨立範疇（詳見 013 第 1.4 節對應表）。
- **V7.0C — Dashboard UX**：首頁改版為「今日行動中心」。內容規格待 `018_Dashboard_UX_Guideline.md` 補完。
- **V7.0D — AI Decision**：所有 AI 建議改用 Financial Liquidity 輸出格式（例如「可投資現金 28 萬，建議本次投入 15 萬，保留安全預備金」），對應 013 第 24 節與 UR-TODO-009。
- **V7.0E — Design Polish**：Card／Button／Icon／Color／Typography／Animation／Skeleton／Spacing 全站統一。內容規格待 `017_Design_System.md` 補完。

---

## 7. 新功能檢核表

每個新功能都必須能回答以下五個問題，答不出來就不做：

1. 解決什麼問題？
2. 每天真的會用嗎？
3. 是否增加操作複雜度？
4. 是否影響家庭安全？
5. 是否有更簡單的方法？

---

## 8. V7 期間原則

V7 期間避免同時新增大型新功能，包含：

- 新 AI 功能
- 新分析頁
- 新 CLEC 模組
- 新匯入格式

優先完成五個核心領域：**Financial Liquidity／Dashboard／Design System／AI Decision／Household**。

---

## 9. 模式切換

- **產品模式**（預設）：專注簡化既有功能。
- **創意模式**：使用者主動要求才開啟；新點子一律先進 [019_Idea_Pool.md](019_Idea_Pool.md)，不直接變成正式 Todo（不直接寫入 `008_TODO_BACKLOG.md`）。

---

## 10. 一進一出原則

新增功能前必須先問：**「有沒有一個舊功能可以整合、取代或刪除？」**

---

## 11. 品質標準

不追求功能數量，追求完成度。KPI 是：

- 首頁更簡潔
- 操作步驟更少
- 計算模型更一致
- 程式更容易維護
- 每天更願意打開使用

**不是**功能數增加。

---

## 12. 固定 Sprint 流程（V7 版本）

延續 `000_AI_START_HERE.md` 第 4 節固定開發流程，V7 期間額外納入三個審查機制（第 2 節）：

```text
Review → Architecture Review → Product Review → Development → Verification → AI Context Update → Merge
```

與既有固定流程（初始化 → 唯讀盤點 → 最新 main → 新 Branch → 實作 → TypeScript／測試／Build → Preview → Draft PR → 使用者驗收 → Ready for review → 使用者手動 Merge）並存，三項審查在「唯讀盤點」與「實作」之間、「實作」完成後分別執行，不取代既有流程步驟。

---

## 13. 與其他文件的關係

- 十大產品原則、版本代號哲學、版本命名區隔規則：本文件為正式來源，其他文件如需引用一律連結回本文件，不得重複定義。
- Financial Model 細節：`013_HOUSEHOLD_LIQUIDITY_SPEC.md`
- Design System 細節：`017_Design_System.md`（骨架，內容待補完）
- Dashboard UX 細節：`018_Dashboard_UX_Guideline.md`（骨架，內容待補完）
- 未評估的新想法：`019_Idea_Pool.md`
- Sprint 時程與長期順序：`002_MASTER_ROADMAP.md`
- 未完成事項：`008_TODO_BACKLOG.md`

---

## 14. Firebase Retirement（永久產品決策，2026-08-11）

1. 採方案 B 分階段正式退役 Firebase 跨裝置同步；Firebase 不再是一般 App runtime 的必要資料來源。
2. localStorage 是唯一 canonical runtime state；不得以 Firebase 覆寫作為一般資料來源。
3. JSON Backup 是正式人工備份、跨裝置資料搬移與災難復原方案。Production 真實資料 Export → Import → Re-export round-trip 必須在後續獨立驗收中完成。
4. Financial Event Ledger 的持久化與核心契約保留於 localStorage／JSON Backup；Firebase retirement 不得改變 schema、normalization、validation、identity、atomic group、void、linked transaction identity、attribution start date、forward-only、attribution 或 reconciliation 語意。
5. Firebase runtime retirement 與 Firebase Console retirement 必須分開 Sprint；P4 前不得對 Console 做資料、Auth、Rules、RTDB／Project 或設定的不可逆操作。

此決策是 UR-TODO-001 原始 Security Rules／Anonymous Auth 已完成歷史的後續延伸，不改寫 PR #252 與既有 Console 複驗結論。

---

## 15. 版本歷史

- v1.0（2026-07-25）：首次建立，落地 V7.0A Foundation & Product Governance；內容來源為使用者於 ChatGPT（Project Knowledge）規劃、經 Claude Code 唯讀核對後由使用者逐項拍板確認。
- v1.1（2026-08-11）：新增 Firebase Retirement 永久產品決策；原始 UR-TODO-001 Security Rules／Anonymous Auth 歷史維持不變。
