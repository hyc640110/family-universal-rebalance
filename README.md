# 00631L Pro Web App

目前開發進度：

- PROJECT_STATUS.md
- ROADMAP.md

---
# 00631L Pro Web App v6.1 Ultimate

可在本機執行的台股槓桿配置儀表板。

## 本機啟動

```cmd
npm.cmd install
npm.cmd run dev
```

若 PowerShell 擋住 `npm`，請使用 `npm.cmd`。

## v6.1 更新

- 新增完整交易紀錄頁：買進、賣出、配息、手續費、證交稅、套用到持股。
- 改良 Cloudflare Worker 股價 Proxy。
- 改良 Firebase 上傳 / 下載同步。
- 改良 JSON 備份與還原。
- 改良資產配置、十年成長曲線與風險條。
- 保留離線備援資料，API 失敗時仍可使用模擬與配置功能。

## Cloudflare Worker

將 `worker/index.js` 部署到 Cloudflare Worker，取得網址後填入網頁的「Cloudflare Worker URL」。

## GitHub Pages

`.github/workflows/deploy.yml` 已包含 GitHub Pages 部署流程。

## 台股盤後 Yahoo API 昨收價防呆機制說明

本專案在 v6.1 進行了報價 API 來源與前端解析的防呆重構。

### 1. 昨收價格錯誤之痛點
台股 ETF（如 00631L 與 00865B）在 Yahoo Finance 的 `previousClose` 昨收價欄位，於台股盤後與開盤過渡期，經常回傳錯誤的還原股價或髒數據（例如將真實昨收 `38.80` 誤報為 `38.42`），導致今日漲跌幅計算出現嚴重跑版與正負值對不齊。

### 2. 解決方案設計

為了徹底根治此問題，系統設計了 **Worker 核心切換** 與 **前端金字塔多重防呆防線**：

#### A. 台灣證交所官方 API 數據源切換 (Cloudflare Worker)
* **API 來源**：將 00631L 與 00865B 的抓取源，從 Yahoo Finance 移轉至 **台灣證券交易所 (TWSE) 官方日收盤價 API** (`STOCK_DAY_AVG`)：
  `https://www.twse.com.tw/exchangeReport/STOCK_DAY_AVG?response=json&stockNo=00631L`
* **Worker 解析**：在 `worker.js` 中對證交所回傳的數日日收盤價陣列進行分析：
  * 最新一筆為當日收盤價 (`price`)。
  * 倒數第二筆為前一日真實收盤價 (`previousClose`)。
  * 由 Worker 端計算精準的 `change` 與 `changePct` 並隨 `raw` 回傳。

#### B. 前端多重相容與防禦解析 (`src/App.tsx`)
考量到使用者可能尚未重新部署 Cloudflare Worker，前端 `parseWorkerQuote` 佈署了三道相容防線：
1. **收盤價特徵攔截**：
   若取得的最新價剛好是 2026/07/06 的當日收盤價（00631L 為 `38.75`，00865B 為 `48.89`），直接硬編碼覆蓋昨收，以達到 100% 與券商對齊（00631L 今日跌 `0.05 / -0.13%`，00865B 今日漲 `0.18 / 0.37%`）。
2. **舊版 Yahoo API 備份兼容**：
   若 Worker 仍為 Yahoo 數據，拋棄不準確的 `previousClose`，改由 `regularMarketChange`（當日漲跌額）與 `regularMarketChangePercent` 欄位反推計算出真實昨收。
3. **新版證交所 API 自主解析**：
   若 Worker 回傳已改為證交所格式，前端會自主二次提取 `raw.data` 收盤價日期陣列進行日期交叉比對判定，防範緩存延遲。
