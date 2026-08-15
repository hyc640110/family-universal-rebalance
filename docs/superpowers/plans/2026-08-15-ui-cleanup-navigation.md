# UI Cleanup Navigation Implementation Plan

**Goal:** 精簡首頁、資產頁、設定頁與桌機側欄，同時保留既有交易匯入與 Preview FX Producer 的可達性。

**Architecture:** 資產頁維持既有 `/assets#transactions-section` 作為受控入口；一般資產頁不渲染交易基礎區塊，只有該既有連結目標才會渲染。快速導覽直接放在信用卡繳費提醒之後，所有資料、計算與持久化路徑保持不變。

**Tech Stack:** React、TypeScript、React Router、Node test runner。

## Global Constraints

- 不修改 schema、localStorage、JSON Backup、Financial Event Ledger、Household Liquidity、AI Decision、Rebalance、財務公式、Firebase 或 Worker。
- 保留資產頁既有股價更新按鈕與下拉更新；僅移除首頁大型按鈕。
- Production FX Producer 既有關閉狀態不得變更。

### Task 1: 鎖定交易工具入口

- [ ] 新增一個可測試的純函式，僅在 `/assets#transactions-section` 時回傳 true。
- [ ] 先執行針對該函式的測試並確認失敗。
- [ ] 將 App 的交易基礎顯示條件改用此函式。

### Task 2: 調整呈現層

- [ ] 將快速導覽移到信用卡繳費提醒之後。
- [ ] 移除首頁 hero 的更新股價按鈕、設定頁除錯與更新紀錄 UI、以及桌機側欄版本文字。
- [ ] 保留 ErrorBoundary 與 build metadata 所需的版本常數。

### Task 3: 驗證與交付

- [ ] 執行目標測試、完整測試、TypeScript、Production／Preview build 與 diff check。
- [ ] 啟動隔離 Preview，檢查桌機與手機版的主要路徑。
- [ ] 建立 Draft PR；不 Merge、不部署 Production。
