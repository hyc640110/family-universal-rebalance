# Universal Rebalance

## 專案資訊

- Repository：<https://github.com/hyc640110/family-universal-rebalance>
- 正式版：<https://hyc640110.github.io/family-universal-rebalance/>
- 目前版本：Universal Rebalance V4.1

## 目前狀態

V3.1 Navigation Foundation、V3.2 Assets Center、V3.3 Analytics Center 與資產頁卡片資訊重排均已完成。V3.4 新增資產配置模擬器；V3.5 新增風險與現金安全中心，整合現金、借款、槓桿、集中度與既有配置偏離的唯讀分析。V3.8 在分析頁新增即時持股報酬、貢獻與集中度分析；不保存歷史快照。

模擬器不會修改正式持股、現金、借款、再平衡設定、localStorage、Firebase 或 JSON 備份。重新整理後模擬條件回到正式資料的預設值。

## 已完成

- React、Vite、TypeScript、GitHub Pages 與 PWA
- 手動 Firebase 上傳／下載與 JSON 備份／還原
- 持股、現金、借款、資產分類與報價更新
- 再平衡、交易方向、逢低提醒與分析中心
- V3.1 Navigation Foundation
- V3.2 Assets Center
- V3.3 Analytics Center
- V3.4 資產配置模擬器（唯讀情境試算）
- V3.5 風險與現金安全中心（唯讀風險分析）
- V3.6 FIRE／財富目標中心（單一目標、固定報酬率試算與手動同步相容）
- V3.7 Dashboard 2.0（首頁每日決策中心）
- V3.8 報酬分析中心（即時持股績效、資產貢獻與集中度）
- V3.9 收支與現金流中心（每月收支、支出壓力與緊急預備金）
- V4.1 Family Center（家庭成員、資產歸屬與統計範圍）

## 固定資料與同步規則

- Worker URL：`https://00631l-pro-price-proxy.hyc640110.workers.dev`
- 正式 localStorage：`family-universal-rebalance-v100-state`
- Preview localStorage：`family-universal-rebalance-preview-v100-state`
- Firebase path：`family-universal-rebalance/...`
- Firebase 僅可手動上傳／下載；不得自動同步或自動下載。

## 下一步

1. 歷史績效快照與年度報酬（需另行規劃資料保存策略）。
2. 其他工具中心項目。
