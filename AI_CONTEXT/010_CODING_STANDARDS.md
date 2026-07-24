# Universal Rebalance Coding Standards

## 1. 核心原則

- 優先正確性與資料相容性
- 避免不必要重構
- 保持 TypeScript 嚴格型別
- 業務邏輯與 UI 分離
- 手機版與桌機版同等重要
- 外部資料必須驗證與正規化
- 任何資料格式變更都要考慮 migration

---

## 2. TypeScript

- 禁止無理由使用 `any`
- 優先使用 `unknown` 搭配 type guard
- 共用資料型別放在 `types/`
- API 回傳建立明確 interface
- Nullable 狀態要清楚表示
- 函式回傳型別應可推斷或明確標註
- 對外 service 函式建議明確標註回傳型別

範例：

```ts
interface Quote {
  symbol: string;
  price: number;
  quoteDate: string;
  source: string;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 3. React

- 元件保持單一責任
- 大型元件拆成 Feature Section
- 不在 render 中執行重型計算
- 複雜計算使用純函式或 memo
- 非同步請求需處理 loading、error、empty
- Effect 需有清楚依賴
- 避免不必要的全域 Context
- 表單輸入需有驗證

---

## 4. Hooks

- Hook 名稱以 `use` 開頭
- Hook 不應隱藏高風險副作用
- 任何會寫入 Firebase 或 localStorage 的 Hook，要在名稱或文件中清楚說明
- 非同步 Hook 回傳：
  - data
  - loading
  - error
  - refresh / retry
  - lastUpdated（適用時）

---

## 5. Services

- Service 不依賴 React
- 外部 API 回傳先正規化
- 不直接把第三方格式傳給 UI
- 保留來源、時間與錯誤資訊
- 不吞掉例外
- 錯誤訊息需可供 UI 判斷

---

## 6. 資料與金額

- 金額計算避免浮點誤差
- 比例與百分比需統一四捨五入規則
- 今日損益：
  - 紅色 = 獲利
  - 綠色 = 虧損
- 正數顯示 `+`
- 負數顯示 `−`
- 大額金額優先顯示萬元
- 股價資料必須包含報價日期
- 非當日報價需明確標示

---

## 7. localStorage / Firebase / JSON

- 不任意更改既有 key
- 不直接刪除舊欄位
- Schema 變更要有版本
- 匯入資料先驗證
- Migration 失敗時不得覆蓋原資料
- Firebase 維持手動上傳與下載
- 不新增背景自動同步

---

## 8. CSS 與響應式

- 先檢查 iPhone 寬度
- 避免固定寬度造成溢出
- 文字需允許合理換行
- 圖表需處理小螢幕刻度
- 按鈕觸控區需足夠
- 刪除等高風險按鈕需避免誤觸
- 深色模式需檢查對比度
- 不以桌機正常作為完成依據

---

## 9. 測試

至少涵蓋：

- 再平衡計算
- 只買不賣
- 資產分類
- 比例與偏離
- 借款試算
- 匯入匯出
- localStorage migration
- Firebase 資料驗證
- 報價日期
- 錯誤與空資料狀態

---

## 10. 完成前檢查

- [ ] TypeScript 通過
- [ ] Test 通過
- [ ] Build 通過
- [ ] 桌機版檢查
- [ ] iPhone / 手機版檢查
- [ ] 無文字裁切
- [ ] 無橫向溢出
- [ ] localStorage 相容
- [ ] Firebase 相容
- [ ] JSON Backup 相容
- [ ] Preview 與 Production 隔離
- [ ] 報價日期正確
- [ ] 文件已更新
