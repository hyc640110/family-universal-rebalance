# Universal Rebalance Development Guide v1.2

最後更新：2026-07-23

## 1. 固定開發流程

每個 Sprint 必須遵循：

1. 確認前一個 PR 已 Merge。
2. 確認 Production 已完成唯讀驗證。
3. fetch 最新 origin/main。
4. 切換 main。
5. 僅允許 fast-forward。
6. 確認 main／origin/main／HEAD 一致。
7. 確認 working tree 乾淨。
8. 從最新 main 建立全新 branch。
9. 一個 Sprint 一個 Draft PR。
10. 完成測試、TypeScript、build、audit、diff check。
11. 部署隔離 Preview。
12. 桌機 1000px／1600px 驗收。
13. 真實 iPhone Safari 約 390px 驗收。
14. 驗收通過後改為 Ready for review。
15. 由使用者手動 Merge。
16. Merge 後同步 main。
17. Production 唯讀驗證。
18. 更新 Current Status 與 Todo Backlog。

禁止：

- 沿用舊 branch
- 直接修改 Production Pages
- 未驗收即 Merge
- 自行 Merge
- 操作 fixed stash
- 將 Preview 設定帶入 Production
- 在未確認資料契約前修改 Firebase schema

## 2. 固定 stash

不得操作：

- `stash@{0}`：
  `e141af14273b76501c1b287ea018e8728099f1e5`
- `stash@{1}`：
  `4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`

不得：

- apply
- pop
- drop
- clear
- rename
- recreate
- overwrite

## 3. 文件治理

### 單一待辦來源

`008_Universal_Rebalance_Todo_Backlog_v1.0.md` 為所有未完成事項的正式來源。

新需求處理：

1. 先登錄 Backlog。
2. 標記提出日期、優先級、狀態與驗收條件。
3. 完成唯讀盤點。
4. 決定 Sprint。
5. 開發後更新 PR 與版本。
6. Production 驗證通過後才標記完成。

### 完成判定

不得因程式中「已有部分欄位」就宣告需求完成。

必須同時具備：

- 程式碼證據
- 自動測試
- Preview 驗收
- PR
- Merge
- Production 唯讀驗證
- Backlog 更新

部分完成必須：

- 保留原項目
- 標示「部分完成」
- 列出剩餘差異
- 不得直接關閉

### 文件分工

- Master Roadmap：長期方向、階段、依賴與版本順序
- Current Status：最新正式基線、現況與下一步
- Development Guide：固定流程、治理與安全規則
- Todo Backlog：所有未完成工作與驗收條件

文件與 Repository 衝突時：

> 以最新 main、已合併 PR、Production 驗證結果為準。

## 4. 高風險跨模組開發規則

高風險工作必須先唯讀盤點，再設計，再實作。

適用：

- 財務核心公式
- 跨模組 selector／adapter
- AppState schema
- Firebase canonical payload
- Backup migration
- 高風險重構
- 股票質押與 LTV
- 回測與歷史驗證

開發順序：

1. 唯讀依賴盤點
2. 鎖定資料契約
3. 建立純函式核心
4. 完整單元測試
5. 再逐模組接入
6. 最後處理 UI 與一致性

同一財務概念不得由各頁自行重算。

## 5. 家庭流動性模型原則

詳細架構規格：`013_Household_Liquidity_Model_Spec_v3.0.md`

凡涉及安全存量、可投資現金、Buy-only、Standard、Risk、AI Decision、CLEC、Simulator 或交易建議的工作，開始唯讀盤點與設計前必須先閱讀 `013 v3.0`。Todo Backlog 只記錄工作狀態與驗收摘要，不得取代詳細規格。

統一原則：

- 受保護安全現金不可視為可投資資金。
- 買入上限只能使用可投資現金。
- 逢低訊號不等於可立即買入。
- 安全存量不足時，補足現金優先。
- 現金轉成防守型持股不增加防守總比例。
- Risk、Rebalance、AI、CLEC、Simulator、Action Center 必須共用同一輸出。
- 理論建議與可執行建議必須分離。
- 所有可執行買入總額不得超過 `executableBudget`。
- 現金轉成防守型持股只屬於防守資產內部組成調整，不增加防守總比例。
- 資料不足時不得用 0 偽裝可計算。
- `confidence` 只代表資料／規則完整度，不代表成功機率。

## 6. Schema 與同步規則

若需新增欄位：

- 優先採加法式欄位
- 提供 schema version
- 提供 normalize
- 提供 migration
- 提供 legacy fixture
- 提供 Backup round-trip
- 提供 Firebase canonical fingerprint 測試
- 確認舊版回退是否會丟失欄位

一旦新欄位寫入 Production：

- 禁止直接回退到會丟棄未知欄位的舊 normalizer
- 必須先做相容性 Hotfix 或暫停舊版手動上傳

## 7. Preview／Production 隔離

Preview 必須具備：

- 獨立 storage key
- 獨立 Firebase root
- 獨立 Price Worker
- 獨立 Market Worker
- Preview-only fixture
- Production bundle 不含 Preview fixture marker

Production 不得在 Preview Sprint 中手動重新部署。

## 8. 測試最低要求

每個 Sprint 至少執行：

- 對應單元／回歸測試
- Stability
- TypeScript
- Production build
- Preview build
- artifact isolation
- `npm audit --omit=dev --audit-level=high`
- `git diff --check`

高風險財務模型另需：

- null／undefined
- NaN／Infinity
- 資料不足
- 邊界值
- 重複來源
- migration
- cross-module consistency
- rollback boundary

## 9. 模型使用建議

預設：

- GPT-5.6 Terra：一般 Sprint、UI、明確 Bug、文件整理

改用 GPT-5.6 Sol：

- 財務核心模型
- 跨模組高風險重構
- LTV 壓力測試
- 完整歷史回測
- 大量邊界驗證
