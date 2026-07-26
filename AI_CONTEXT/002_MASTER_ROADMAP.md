# Universal Rebalance Master Roadmap v7.5

最後更新：2026-07-25

> **命名提醒**：本文件標題的「v7.5」是**文件本身的版本號**（文件迭代次數），與第 5.1 節「產品版本 V7.0A／V7.0B……」的產品功能版本代號是兩套不同的編號系統，僅為巧合撞號，兩者無關。完整區隔規則見 [016_Product_Decisions.md](016_Product_Decisions.md) 第 5 節。

## 1. 專案定位

Universal Rebalance 是以 React、Vite、TypeScript 建立的個人／家庭財富管理平台，涵蓋：

- 持股與資產管理
- 現金、帳戶、借款與交易
- 資產配置與再平衡
- 投資風險與決策
- 股息與績效分析
- Firebase 手動同步
- CSV／Excel／Backup 匯入匯出
- CLEC 策略中心
- 後續家庭流動性、銀行通知與長期財富規劃

## 2. 最新正式基線

- 正式版本：V6.17.3A
- PR：#105（MERGED），前置同系列 PR：#102、#103、#104（皆 MERGED）
- main／origin/main／本機 main／HEAD：
  `251016977fc63aca3221c0b383170a68cad89900`
- Production Pages workflow：
  `29935264176`（success）——`deploy.yml` 於 push to main 時自動觸發，PR #102～#105 合併時皆各自自動部署一次，詳見 `003_CURRENT_STATUS.md` 第 3 節
- Production Price Worker：
  `00631l-pro-price-proxy`
- Worker version ID：
  `4cc47c73-2730-4e4b-bbd4-f641fbbf1249`
- Worker health：
  `00631L-Pro-Web-App Worker v6.16.1 trusted-previous-close-preview-contract`

固定 stash 不得操作：

- `stash@{0}`：`e141af14273b76501c1b287ea018e8728099f1e5`
- `stash@{1}`：`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`

## 3. 已完成主線

### V6.9～V6.16.1

- 股價 freshness 與刷新一致性
- Market 重新取得與 CORS Hotfix
- 股息歷史資產參照
- 手機日期輸入穩定
- 全站 Typography 與圖表可讀性
- Assets quote consistency 與 Pull-to-Refresh
- 手機固定簡潔模式
- 持股卡片現價／今日漲跌資訊
- TWSE 官方可信前收
- 台股紅漲綠跌與未知狀態

## 4. 最高優先高風險主題

# 家庭流動性、安全存量與可投資現金跨模組整合

詳細架構規格：`013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）

本 Roadmap 僅保存階段、依賴與順序；公式、資料契約、模組整合、測試矩陣與驗收規則以 `013` 現行版本為準。

目前系統沒有單一家庭流動性來源。`liquidCash` 同時被當成：

- 資產
- 防守資產
- 借款還款安全現金
- 可投入預算

這造成 Rebalance、Risk、CLEC、Simulator 與決策流程語意不一致。

### 核心原則

1. 受保護安全現金不可視為可投資資金。
2. 買入上限只能使用可投資現金。
3. 逢低訊號不等於可立即買入。
4. 安全存量不足時，補足現金優先於加碼或再平衡買入。
5. 現金轉成防守型持股，不等於提高防守資產總比例。
6. 所有模組共用同一家庭流動性模型，不得各自重算。
7. 純市值、損益、歷史績效、報價與理論配置偏離公式原則上維持。

## 5. 建議 Sprint 路線

### Sprint 1：Household Liquidity Core Model Foundation — 已完成（PR #102、#103）

範圍：

- `deriveHouseholdLiquidity`
- `buildHouseholdLiquidityInput`
- stock／flow／plan 來源分類
- nullable 金額
- data completeness
- 防重複檢測
- 6／12 個月安全存量
- protectedSafetyCash
- investableCash
- executableBudget
- externalFundingRequired
- 完整單元測試

不包含（Sprint 1 範圍內確認未做，留待後續 Sprint）：

- App.tsx 接線
- UI
- AppState
- Firebase／Backup
- Rebalance／Risk／AI 行為修改

### Sprint 2：Liquidity Data Provenance & Migration — 部分完成（PR #104、#105）

- CashFlow debt linkage — 已完成
- `linkedLoanId` — 已完成
- `liquidityRole` — 已完成
- Cash Flow schema version（→ 3） — 已完成
- normalize／migration — 已完成
- Firebase canonical — 已完成
- Backup round-trip — 已完成
- Plan input（`externalContribution`／`plannedWithdrawal`）持久化與 UI Entry Point — PR #105 已完成，超出 Sprint 2 原始範圍
- 尚未完成：接入任何正式 consumer（Rebalance／Risk／AI／CLEC／Simulator），詳見 `008_TODO_BACKLOG.md` UR-TODO-007

### Sprint 3：Rebalance & Trade Execution Integration

- buy-only／standard executable budget
- Order Helper
- Execution Eligibility
- Dip signal gate
- 理論建議與可執行建議分離

### Sprint 4：Risk & Decision Workflow Integration

狀態（2026-07-27）：UR-TODO-009 子 PR1／2（PR #134）、子 PR3（PR #137）、子 PR4 Risk Center Presentation Layer（PR #140）、子 PR5 Today Decision 六層優先序（PR #143）與子 PR6 AI Decision §24 契約（PR #145）均已完成並通過 Production 驗證。下一個未完成項目為子 PR7；目前沒有已授權的下一主線。分析頁是否承接完整 `todayDecision` 為後續產品決策，不新增正式 UR-TODO。

- Portfolio Risk
- Dashboard
- AI Decision
- Investment Intelligence
- Daily Decision Workflow
- Opportunities
- Investment Action Center

### Sprint 5：CLEC & Simulator Funding Semantics

- CLEC availableCash／cashReserve 分離
- external contribution
- existing investable cash
- planned withdrawal
- protected cash 預設不可用

### Sprint 6：Cross-Module Presentation Consistency

- 防守配置狀態
- 安全現金
- 可投資現金
- 理論缺口
- 可執行金額
- 阻擋原因
- 手機與桌機一致性

## 5.1 產品版本 V7（Product Polish & Financial Intelligence）規劃

2026-07-25 新增。以下為**產品功能版本代號**（見上方命名提醒），記錄規劃意圖，**不代表已核准啟動**；每個 Sprint 實際開始開發前仍須使用者明確下達「開始開發」指示。完整產品定位、審查機制、產品原則見 [016_Product_Decisions.md](016_Product_Decisions.md)。

- **產品版本 V7.0A — Foundation & Product Governance**：建立 `016_Product_Decisions.md`、`017_Design_System.md`、`018_Dashboard_UX_Guideline.md`、`019_Idea_Pool.md`，同步更新治理文件（本次工作）。
- **產品版本 V7.0B — Financial Liquidity Core**：**＝上方 Sprint 3～6**（`013_HOUSEHOLD_LIQUIDITY_SPEC.md` v4.0 所定義），非另一份規格或另一個獨立範疇，詳見 013 第 1.4 節對應表。
- **產品版本 V7.0C — Dashboard UX**：首頁改版為「今日行動中心」，規格待 `018_Dashboard_UX_Guideline.md` 補完。
- **產品版本 V7.0D — AI Decision**：所有 AI 建議改用 Financial Liquidity 輸出格式，對應 013 第 24 節與 Sprint 4／UR-TODO-009。
- **產品版本 V7.0E — Design Polish**：全站 UI 統一，規格待 `017_Design_System.md` 補完。

版本代號哲學：V6＝Feature Expansion、V7＝Product Polish、V8（未來）＝AI Financial Assistant，詳見 `016_Product_Decisions.md` 第 4 節。

## 6. P0 唯讀盤點待辦

完成高風險主題前，仍需逐項驗證：

1. 持股資產管理卡片 2.0 完整差異
2. 每檔成長／防守分類持久化與跨模組 SSOT
3. 桌機／手機目前偏離目標一致性
4. 00685L、00895 名稱持久化
5. 正式報價來源、時間與 freshness 一致性
6. Firebase Realtime Database Security Rules 到期風險

## 7. 後續新功能

高風險流動性主題完成後，再依序進行：

1. Rebalance Scenario Simulator
2. Investment Decision Workflow Integration
3. CLEC 歷史驗證與回測
4. 股票質押與 LTV 壓力測試
5. 再平衡歷史與決策紀錄
6. 股息預估模型
7. 全球主要指數正式資料來源
8. 重要經濟事件正式資料來源
9. Gmail／銀行通知解析
10. 銀行 CSV／Excel／電子帳單整合
11. 自動分類與重複交易偵測
12. 月底自動對帳
13. 多帳戶與家庭成員
14. 保險、退休與家庭淨資產規劃

## 8. 文件治理

- `008_TODO_BACKLOG.md` 是未完成事項的單一正式來源（現行版本以文件內容為準，不在此處寫死版號避免過期）。
- Roadmap 只保存階段、依賴與長期順序。
- Current Status 保存最新正式基線與下一步。
- Development Guide 保存固定流程與治理規則。
- `013_HOUSEHOLD_LIQUIDITY_SPEC.md` 保存家庭流動性主題的唯一詳細架構規格。
- `016_Product_Decisions.md` 保存產品定位、審查機制、產品原則、版本代號哲學與版本命名區隔規則等永久產品治理決策。
- `019_Idea_Pool.md` 保存創意模式產出、尚未評估的新想法。
