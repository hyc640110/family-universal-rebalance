# Universal Rebalance Release Checklist

## 1. 發布前

- [ ] 從最新 `main` 建立 Branch
- [ ] 工作目錄無未處理修改
- [ ] 沒有覆蓋使用者 stash
- [ ] 修改範圍與需求一致
- [ ] 未混入無關重構
- [ ] 無密鑰或敏感資訊

## 2. 程式驗證

- [ ] TypeScript 通過
- [ ] Test 通過
- [ ] Build 通過
- [ ] Console 無新的嚴重錯誤
- [ ] 主要流程可操作
- [ ] 錯誤狀態可顯示

## 3. 資料相容性

- [ ] 舊 localStorage 可讀取
- [ ] Firebase 手動上傳正常
- [ ] Firebase 手動下載正常
- [ ] JSON Backup 可匯出
- [ ] JSON Backup 可還原
- [ ] CSV / XLSX 匯入未受影響
- [ ] 必要 migration 已測試
- [ ] Migration 失敗不覆蓋原資料

## 4. UI 驗證

### 桌機

- [ ] Windows 11 Chrome / Edge
- [ ] 無版面溢出
- [ ] 圖表可讀
- [ ] Modal 與表單正常
- [ ] 導航正常

### 手機

- [ ] iPhone Safari
- [ ] 文字無裁切
- [ ] 按鈕可點
- [ ] 卡片間距合理
- [ ] 圖表日期與刻度可讀
- [ ] 無橫向捲動
- [ ] 展開區正常
- [ ] 更新股價狀態正常

## 5. 外部服務

- [ ] Quote Worker 使用正確環境
- [ ] Market Worker 使用正確環境
- [ ] Gmail OAuth callback 正確
- [ ] CORS 正常
- [ ] Preview 未指向 Production 資料
- [ ] 報價日期與來源正確

## 6. PR

- [ ] PR 為 Draft
- [ ] PR 標題清楚
- [ ] 修改摘要完整
- [ ] 修改檔案已列出
- [ ] 驗證結果已列出
- [ ] Preview 連結可開啟
- [ ] 驗收重點明確
- [ ] 相容性風險已說明
- [ ] 回復方式已說明

## 7. 驗收後

- [ ] 使用者確認通過
- [ ] PR 改為 Ready for review
- [ ] 等待使用者手動 Merge
- [ ] AI 未自行 Merge
- [ ] Changelog 已更新
- [ ] Current Status 已更新
- [ ] Todo Backlog 已移除完成項目
