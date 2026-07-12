# Universal Rebalance Roadmap

## 已完成

- [x] V3.1 Navigation Foundation：首頁、資產、分析、工具與設定導覽。
- [x] V3.2 Assets Center：持股、現金、借款與資產配置管理。
- [x] V3.3 Analytics Center：再平衡、逢低提醒、交易建議與分析摘要。
- [x] 資產頁 UI 優化：持股卡片資訊重排與區塊順序調整。
- [x] V3.4 資產配置模擬器：唯讀目標比例與投入／抽回情境試算。

## V3.4 範圍說明

資產配置模擬器會讀取目前正式持股、現金與最新報價，計算模擬後配置、差額與交易方向。它只存在於目前 React session；不寫入 localStorage、Firebase、JSON 備份或正式資產資料，也不提供一鍵套用。

## 後續優先項目

1. 風險與現金安全中心：整合槓桿、還款安全月數與現金水位。
2. FIRE／財富目標：以資產、投入與目標期限提供基礎情境試算。
3. 工具中心擴充：歷史報酬分析、ETF X-Ray、配息中心與退休試算。

## 維持原則

- 手機優先（390px），並支援桌機。
- Firebase 維持手動上傳／下載，不得自動同步。
- Preview 與正式版使用不同 Vite base 與 localStorage key。
- 每個 PR 僅完成一項主要功能，從最新 `main` 建立，且不得自動 Merge。
