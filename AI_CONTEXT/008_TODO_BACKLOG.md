# Universal Rebalance Todo Backlog v1.4

最後更新：2026-07-24

本文件是 Universal Rebalance 所有未完成事項的單一正式來源。

家庭流動性、安全存量與可投資現金主題的詳細架構規格，以 `013_Household_Liquidity_Model_Spec_v3.0.md` 為唯一正式來源；本文件只保存 Todo 狀態、Sprint 邊界與驗收摘要。

2026-07-23 已完成舊對話待辦遺漏比對，補登 UR-TODO-026～035。以上項目仍須以最新 main 唯讀盤點後確認實際狀態。

2026-07-24 依「最新基線與 AI 治理文件唯讀差異盤點」（PR #102～#105 唯讀實證）更新 UR-TODO-006、UR-TODO-007 狀態，並補登 UR-TODO-036、UR-TODO-037。

2026-07-24 Sprint「Deployment CI Reproducibility & Test Gate」（CI-01／CI-02／UR-TODO-037 部分範圍）將 UR-TODO-037 更新為部分完成，並記載尚未完成的 GitHub Environment 人工核准、Branch Protection、預設分支修正等延後範圍。

狀態：

- 未盤點
- 已盤點
- 待設計
- 待開發
- 開發中
- 待驗收
- 部分完成
- 已完成
- 阻擋

完成標準：

- 程式碼完成
- 自動測試通過
- Preview 驗收通過
- PR Merge
- Production 唯讀驗證通過

## P0－緊急與唯讀盤點

### UR-TODO-001 Firebase Realtime Database Security Rules Expiry

- 優先級：P0
- 狀態：待盤點
- 提出日期：2026-07-22
- 問題：`my-00662-default-rtdb` 測試模式用戶端存取權限即將到期。
- 可能影響：
  - 雲端上傳
  - 雲端下載
  - Firebase 手動同步
- 必須確認：
  - 現行 Rules
  - Firebase Authentication 使用情況
  - 正式 App 的讀寫節點
  - Preview／Production Firebase 隔離
  - 到期日期
  - 安全 Hotfix 方案
- 禁止：
  - 直接延長公開 `.read/.write`
  - 在 App 無 Firebase Auth 時直接改為 `auth != null`
- 完成條件：
  - 正式安全規則
  - Preview 驗證
  - Production 手動同步驗證
  - 不公開資料
  - 無資料遺失

### UR-TODO-002 持股資產管理卡片 2.0 差異盤點

- 優先級：P0
- 狀態：部分完成
- 已完成：
  - 現價
  - 今日漲跌金額
  - 今日漲跌幅
  - 台股紅漲綠跌
  - TWSE 可信前收
  - 手機主卡移除均價
- 待確認：
  - 現價與漲跌幅同列
  - 漲跌金額次列
  - `▲／▼`
  - 三者完全同色
  - 與未實現損益清楚區隔
  - 桌機／手機一致
- 完成 PR：#100、#101（部分）

### UR-TODO-003 每檔成長／防守分類完整性

- 優先級：P0
- 狀態：部分完成
- 已有：
  - `assetClass`
  - 持股編輯 UI
  - `allocationRoleBySymbol`
- 待盤點：
  - localStorage
  - Firebase
  - Backup
  - 封存／恢復
  - Dashboard
  - Risk
  - Rebalance
  - CLEC
  - SSOT
  - `cash-like` 與 `defensive` 的語意

### UR-TODO-004 桌機／手機目前偏離目標一致性

- 優先級：P0
- 狀態：待盤點
- 驗證：
  - currentWeight
  - targetWeight
  - deviation
  - rounding
  - compact／desktop selector

### UR-TODO-005 00685L、00895 名稱持久化

- 優先級：P0
- 狀態：待盤點
- 驗證：
  - 更新股價
  - reload
  - Firebase
  - Backup
  - 封存／恢復
  - 自訂名稱優先權

### UR-TODO-037 Deployment Workflow Approval & Status Accuracy

- 優先級：P0
- 狀態：**部分完成**（Sprint「Deployment CI Reproducibility & Test Gate」，2026-07-24）
- 提出日期：2026-07-24
- 提出依據：2026-07-24「最新基線與 AI 治理文件唯讀差異盤點」
- 問題：
  - `.github/workflows/deploy.yml` 觸發條件為 `on: push: branches: [main]`，沒有 Draft／Ready／人工核准閘門。
  - 任何 PR 一旦 Merge 進 `main`，即會自動部署到 Production GitHub Pages，與治理文件（`000_AI_START_HERE.md`、`001_README.md`）描述的「PR 預設 Draft、Preview 驗收後才 Ready、使用者手動 Merge」流程之間，實際上沒有對應的「使用者手動決定是否部署 Production」步驟。
  - PR #102～#105 內文均敘述「Production 未部署」，但實際上四次 Merge 皆各自觸發成功的 Production 部署（見 `003_CURRENT_STATUS.md` 第 3 節），代表既有 PR 撰寫慣例未正確區分「未手動觸發部署」與「未部署」。
- 本次已完成：
  - `007_GIT_WORKFLOW.md` §8 已明確記載：「使用者手動 Merge」是目前實際的 Production 發布決策點，push-to-main 會自動觸發部署，不存在額外的人工部署核准步驟。
  - 明確規定 PR 說明在使用者手動 Merge 完成前，一律不得寫「Production 已部署」。
  - 明確規定 Merge 完成後，必須依實際 `Deploy GitHub Pages` workflow run 結果（run id、headSha、status、conclusion）記錄成功、失敗或待確認，不得只憑「已 Merge」推定成功。
  - 部署 pipeline 本身新增測試與依賴可重現性把關（見 CI-01、CI-02），降低「品質不佳但仍自動上線」的風險，但這屬於部署當下的自動檢查，不是 Merge 前的人工核准。
- 尚未完成範圍（明確延後，需另立 Todo／Sprint）：
  - GitHub Environments 人工核准（required reviewers）
  - Branch Protection Rule（`main` 目前仍是 `Branch not protected`）
  - GitHub 預設分支修正（目前仍是 `gh-pages`，非 `main`，會影響 `gh pr create` 等工具的預設行為）
- 禁止：
  - 不得未經使用者授權直接修改 `deploy.yml` 或其他 CI／CD 設定。
- 驗收條件：
  - Production 部署觸發方式與治理文件描述一致，不再有「PR 稱未部署但實際已部署」的落差 —— **已透過 `007_GIT_WORKFLOW.md` 更新達成**。
  - 若新增人工核准閘門，Preview／Production 部署行為需重新驗證 —— **未完成，留待後續 Sprint**。

## P1－家庭流動性高風險主題

### UR-TODO-006 Household Liquidity Core Model Foundation

- 優先級：P1
- 狀態：**已完成**
- 完成日期：2026-07-22（PR #102、#103，2026-07-24 唯讀盤點確認）
- 完成 PR：#102 `feat: Household Liquidity Core Model Foundation`（merge `40159b4`）、#103 `V6.17.1 Household Liquidity Input Adapter Foundation`（merge `64407e7`）
- 詳細規格：`013_Household_Liquidity_Model_Spec_v3.0.md`
- 實作時不得以舊版 `013 v1.0`、`v2.0` 或聊天摘要取代 v3.0
- 核心（已實作，`src/lib/householdLiquidity.ts`、`src/lib/householdLiquidityInputAdapter.ts`）：
  - `deriveHouseholdLiquidity`
  - `buildHouseholdLiquidityInput`
  - stock／flow／plan 分類
  - nullable money
  - dataCompleteness
  - confidence
  - blockingReasons（23 個 code）
  - 6／12 個月安全存量
  - protectedSafetyCash
  - investableCash
  - executableBudget
  - externalFundingRequired
- 測試：Core 53/53、Adapter 23/23，PR 內文宣稱通過；本次盤點未重新執行測試套件
- 不包含（按原始範圍，本 Todo 完成不代表以下已完成，需由後續 Sprint／Todo 處理）：
  - UI
  - AppState
  - Firebase
  - Backup
  - 現有 consumer 接線

### UR-TODO-007 Liquidity Data Provenance & Migration

- 詳細規格：`013_Household_Liquidity_Model_Spec_v3.0.md` 第 16、29、30 節

- 優先級：P1
- 狀態：**部分完成**
- 完成日期：2026-07-22（PR #104、#105，2026-07-24 唯讀盤點確認）
- 完成 PR：#104 `V6.17.2 Household Liquidity Data Provenance & Migration Foundation`（merge `8aa12c0`）、#105 `V6.17.3A Household Liquidity Plan Input Foundation`（merge `2510169`）
- 已完成：
  - CashFlowItem `liquidityRole`
  - `linkedLoanId`
  - Cash Flow schema version（PR #104 → 2，PR #105 → 3）
  - normalize（`normalizeCashFlowProfile` 擴充為 deterministic／idempotent migration）
  - migration（localStorage／Firebase／Backup／Import round-trip 覆蓋，共 27 個測試）
  - ambiguous debt gate（沿用 Core 既有 blocking reason，未新增額外 gate）
  - Firebase canonical
  - Backup round-trip
  - `externalContribution`／`plannedWithdrawal` 持久化契約（PR #105，`undefined`＝absent、`0`＝明確零值）
- 尚未完成範圍：
  - 未接入任何正式 consumer（Rebalance、Risk、AI、CLEC、Simulator 均未讀取本模型輸出）
  - Plan Input 目前只有一個獨立 UI Entry Point（見新增 Todo：Household Liquidity Plan Input UI Entry Point），尚未與其他頁面（Dashboard、Risk、Rebalance）的現金／預算欄位整合或去重
  - 尚未定義「正式 consumer 接線後」的驗收條件與回歸測試矩陣
- 測試：PR #104 27/27、PR #105（Entry Point 7/7＋Foundation 16/16），皆為 PR 內文宣稱通過；本次盤點未重新執行測試套件

### UR-TODO-008 Rebalance & Trade Execution Integration

- 詳細規格：`013_Household_Liquidity_Model_Spec_v3.0.md` 第 12～14、23、30 節

- 優先級：P1
- 狀態：待開發
- 涉及：
  - 再平衡與加碼建議
  - 交易建議清單
  - Order Helper
  - Execution Eligibility
  - standard
  - buy-only
  - Dip signal gate
- 原則：
  - 理論缺口與可執行金額分離
  - 買入總額不得超過 executableBudget
  - 安全現金不足不得產生可執行買單

### UR-TODO-009 Risk & Decision Workflow Integration

- 詳細規格：`013_Household_Liquidity_Model_Spec_v3.0.md` 第 11、19～25、30 節

- 優先級：P1
- 狀態：待開發
- 涉及：
  - Portfolio Risk
  - Dashboard
  - AI Decision
  - Investment Intelligence
  - Daily Decision Workflow
  - Investment Opportunities
  - Investment Action Center
- 優先順序：
  1. 資料完整性
  2. 安全存量
  3. 可投資現金
  4. 配置偏離
  5. 逢低訊號
  6. 其他機會

### UR-TODO-010 CLEC & Simulator Funding Semantics

- 詳細規格：`013_Household_Liquidity_Model_Spec_v3.0.md` 第 15、26、27、30 節

- 優先級：P1
- 狀態：待開發
- CLEC：
  - availableCash 與 cashReserve 分離
- Simulator：
  - externalContribution
  - existingInvestableCash
  - protectedSafetyCash
  - plannedWithdrawal
  - `allowSafetyCashUsage = false`

### UR-TODO-011 Cross-Module Presentation Consistency

- 詳細規格：`013_Household_Liquidity_Model_Spec_v3.0.md` 第 19、28、30～32 節

- 優先級：P1
- 狀態：待開發
- 將「防守資產補足提醒」改為「防守配置狀態」
- 顯示：
  - 防守總比例
  - 安全現金
  - 防守型持股
  - 可投資現金
  - 理論缺口
  - 可執行方式
  - 阻擋原因

### UR-TODO-036 Household Liquidity Plan Input UI Entry Point

- 優先級：P1
- 狀態：待盤點
- 提出日期：2026-07-24
- 提出依據：PR #105（V6.17.3A.1 Entry Point，merge `2510169`）
- 背景：
  - PR #105 在「收支與現金流中心」（`CashFlowPage.tsx`）新增「家庭流動資金計畫」UI 區塊，可編輯 `externalContribution`（額外投入資金）與 `plannedWithdrawal`（預計提領資金），這是家庭流動性主題第一次修改正式 UI 頁面。
  - 此範圍未被 UR-TODO-006、UR-TODO-007 原始描述涵蓋，也未被 UR-TODO-011（Cross-Module Presentation Consistency）明確涵蓋。
- 待確認：
  - 此 UI 區塊與 UR-TODO-011「防守配置狀態」呈現規劃之間的關係與邊界。
  - 是否需要與 Dashboard、Rebalance、Simulator 既有的預算／資金輸入欄位整合或去重。
  - 手機／桌機一致性、萬元輸入元儲存的 validation 是否已涵蓋所有邊界案例（見 PR #105 測試：Entry Point 7/7、Foundation 16/16）。
- 依賴：
  - UR-TODO-007（部分完成，尚未接 consumer）
  - UR-TODO-011（待開發）
- 驗收條件：
  - 明確記錄此 UI Entry Point 與家庭流動性主題其餘 Sprint（Rebalance、Risk、CLEC、Simulator、Cross-Module Presentation）的整合關係，不得重複設計相同的資金輸入欄位。

## P1－舊待辦遺漏補登

> 本區為舊對話需求與現行 Backlog 的遺漏比對結果。只補登尚未確認完成、且未被其他 Todo 完整吸收的項目。開發前仍須先唯讀盤點最新 main。

### UR-TODO-026 持股卡片移除「持有比率」文字
- 優先級：P1
- 狀態：待盤點
- 提出日期：2026-07-22
- 修改方向：
  - 移除「持有比率」四個字。
  - 保留圓圈與圓圈內比例數字。
  - 桌機與手機一致。
- 驗收條件：
  - 不再顯示「持有比率」文字。
  - 圓圈與比例數字正常。
  - 不改變比例計算。

### UR-TODO-027 趨勢圖剩餘視覺與刻度問題
- 優先級：P1
- 狀態：待盤點
- 提出日期：2026-07-19
- 待確認：
  - 07／15 附近是否仍有中間空白。
  - Y 軸是否使用易讀整數刻度。
  - 手機左側文字是否裁切。
  - Y 軸位置是否需調整。
  - 綠色漸層需求是否仍保留。
- 驗收條件：
  - 真實資料無日期斷裂。
  - 手機 Safari 約 390px 無裁切。
  - 桌機 1000px／1600px 正常。

### UR-TODO-028 股息中心未指定資產編輯限制
- 優先級：P1
- 狀態：待盤點
- 提出日期：2026-07-19
- 問題：
  - 未指定資產的股息紀錄可能只能刪除、無法編輯。
- 待確認：
  - 是否可補選或修改資產。
  - 已清倉／封存資產參照完成後是否仍有問題。
  - 編輯後 localStorage、Firebase、Backup 是否一致。
- 驗收條件：
  - 未指定資產紀錄可安全編輯，或有明確限制說明。

### UR-TODO-029 股息收款日期圖示顏色
- 優先級：P2
- 狀態：待盤點
- 提出日期：2026-07-19
- 修改方向：
  - 日期圖示改為白色或符合深色模式對比的顏色。
- 驗收條件：
  - 深色與淺色模式都清楚。
  - 手機 Safari 與 Windows Chrome／Edge 正常。

### UR-TODO-030 首頁「重要提醒」重複性盤點
- 優先級：P2
- 狀態：待盤點
- 提出日期：2026-07-19
- 問題：
  - 可能與「今日投資狀態」或其他決策卡片重複。
- 依賴：
  - UR-TODO-009
  - UR-TODO-011
- 驗收條件：
  - 首頁不重複顯示相同提醒。
  - 必要風險仍保留。

### UR-TODO-031 投資健康度安全存量命名與說明
- 優先級：P1
- 狀態：已被架構吸收／待 UI 接線
- 提出日期：2026-07-19
- 正式規格：
  - `013_Household_Liquidity_Model_Spec_v3.0.md`
- 關聯 Todo：
  - UR-TODO-006～011
- 驗收條件：
  - 不再使用易誤解的「現金安全」舊語意。
  - 顯示生活費＋負債還款的安全存量來源。

### UR-TODO-032 資產頁更新股價入口與手機下拉更新盤點
- 優先級：P1
- 狀態：部分完成／待盤點
- 提出日期：2026-07-19
- 待確認：
  - 是否有明確更新股價按鈕。
  - 手機頂端下拉是否可靠觸發。
  - loading、error、lastUpdated、quote date 是否一致。
- 驗收條件：
  - 桌機與手機使用同一刷新契約。
  - 更新後各頁報價一致。

### UR-TODO-033 持股卡片現價與今日漲跌版面完整差異
- 優先級：P1
- 狀態：部分完成／待盤點
- 提出日期：2026-07-19
- 與既有 Todo 關係：
  - 補充 UR-TODO-002，不取代它。
- 待確認：
  - 現價與漲跌幅是否同列。
  - 漲跌金額是否次列。
  - 是否顯示 ▲／▼。
  - 三者是否依台股紅漲綠跌一致著色。
  - 是否與未實現損益清楚區隔。
- 驗收條件：
  - 桌機與手機一致。
  - 非今日報價清楚標示。

### UR-TODO-034 持股更新後仍顯示舊報價的殘留案例盤點
- 優先級：P1
- 狀態：部分完成／待盤點
- 提出日期：2026-07-16
- 已知相關完成：
  - Quote refresh consistency
  - TWSE 可信前收
  - Market refresh／CORS
- 待確認：
  - 00631L、00865B 等是否仍有殘留舊值。
  - Worker、cache、state、localStorage 與 selector 是否一致。
- 驗收條件：
  - 所有頁面使用同一份最新可信報價。
  - 無可信報價時顯示 unknown／非今日資料。

### UR-TODO-035 市場頁「重新取得」按鈕回歸確認
- 優先級：P2
- 狀態：已完成候選／待回歸確認
- 提出日期：2026-07-16
- 已知相關完成：
  - Market 重新取得
  - Market CORS Hotfix
- 驗收條件：
  - 按鈕實際發出請求。
  - loading、成功、失敗狀態可見。
  - Preview／Production Worker 不混用。

## P2－新功能

### UR-TODO-012 Rebalance Scenario Simulator

- 優先級：P2
- 狀態：待開發
- 前置依賴：UR-TODO-006～011

### UR-TODO-013 Investment Decision Workflow Integration

- 優先級：P2
- 狀態：部分完成
- 前置依賴：UR-TODO-009

## P3－中長期投資功能

### UR-TODO-014 CLEC 歷史驗證與回測
- 狀態：待開發

### UR-TODO-015 股票質押與 LTV 壓力測試
- 狀態：待開發

### UR-TODO-016 再平衡歷史與決策紀錄
- 狀態：待開發

### UR-TODO-017 股息預估模型
- 狀態：待開發

### UR-TODO-018 全球主要指數正式資料來源
- 狀態：待開發

### UR-TODO-019 重要經濟事件正式資料來源
- 狀態：待開發

## P4－家庭財富管理長期項目

### UR-TODO-020 Gmail 銀行／信用卡通知解析
- 狀態：待開發

### UR-TODO-021 銀行 CSV／Excel／電子帳單整合
- 狀態：部分完成

### UR-TODO-022 自動分類與重複交易偵測
- 狀態：部分完成

### UR-TODO-023 月底自動對帳
- 狀態：待開發

### UR-TODO-024 多帳戶與多家庭成員
- 狀態：待開發

### UR-TODO-025 保險、退休與家庭淨資產規劃
- 狀態：待開發

## 已完成並關閉

- V6.13 Typography
- 手機日期欄位溢出
- 股息歷史／已清倉資產參照
- Market 重新取得
- Market CORS Hotfix
- 手機固定簡潔模式
- 只買不賣預算預設 10 萬
- Quote refresh consistency
- TWSE 官方可信前收
- 台股紅漲綠跌
