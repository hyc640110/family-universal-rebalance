# UR-TODO-009 子 PR4 Risk Center Presentation Layer 設計

## 目標

在不改變 Household Liquidity 核心公式與既有決策邏輯的前提下，讓兩個 Risk Center 頁面一致呈現 Risk Metrics 已採用的家庭流動性資訊。

## 範圍

- `RiskCenterPage.tsx` 與 `PortfolioRiskPage.tsx` 顯示每月必要支出、安全存量缺口、可投資現金、資料可信度與重複來源警示。
- `riskMetrics.ts` 僅透傳 UI 所需的 `confidence` 與 `blockingReasons`；不重新計算任何家庭流動性金額。
- `portfolioRisk.ts` 僅把既有 Risk Metrics 資訊帶到 Portfolio Risk 呈現模型。
- 新增純函式呈現 adapter 與單元測試，統一兩頁的資料可信度與重複來源文案。

## 資料流

`householdLiquidityForRebalance` → `riskMetrics`（唯一風險資料入口）→ `riskPresentation` → `RiskCenterPage`／`PortfolioRiskPage`。

重複來源警示只辨識 Household Liquidity 的 `DUPLICATE_LIQUID_ACCOUNT_ID`、`DUPLICATE_LIVING_EXPENSE_SOURCE_ID`、`DUPLICATE_LOAN_LINK`，並保留核心模型提供的訊息；不由頁面自行掃描或重新推導資料品質。

## 明確不包含

- UR-TODO-041 負債資料過期警示與任何 `HouseholdLoan` 核心契約變更。
- AI Decision、Dashboard、`todayDecision`、`investmentHealth`、交易建議或 Rebalance 行為。
- localStorage、Firebase、JSON Backup schema 或同步行為。
- Production 部署或 PR Merge。

## 驗收

- 完整資料時呈現金額與高可信度；資料不足時不偽裝金額為零且顯示低可信度。
- 重複來源 reason 轉為可讀警示，且不洩漏不屬於重複來源的 blocking reason。
- 兩個頁面都使用同一個呈現 adapter。
- 對應單元測試、完整 CI tests、TypeScript、Production／Preview build、Preview 390／1000／1600px 驗收通過。
