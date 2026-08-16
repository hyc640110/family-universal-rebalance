# UR-TODO-069 手機版固定支出工具列設計

## 目標

在 390px 手機寬度下，讓每張退休規劃固定支出卡片的勾選框、完整「計入支出」文字與垃圾桶刪除圖示維持同一列；桌機版維持 PR #372 的既有版面與行為。

## 已驗證現況

- 正式基線：`87777766f9e2c37bcae0bad35194cc20444ab67a`（PR #372）。
- `RetirementPlannerPage.tsx` 已將三個控制項置於 `.retirement-expense-toolbar`，並以原生 `<label>` 提供「計入支出」的可存取名稱。
- `.retirement-expense-delete` 已為 44×44px。
- 實機 390px 量測：工具列為 `flex-direction: row` 且沒有水平溢出，但 `.retirement-expense-enabled` 被壓縮至約 66px、高約 81px，因此完整文字換行。

## 設計決策

- 僅於 `@media (max-width: 768px)` 對 `.retirement-expense-enabled` 加入 `white-space: nowrap`。
- 保留完整視覺文案「計入支出」；不新增 ARIA 屬性，因為既有 `<label>` 已提供正確且完整的 checkbox 名稱。
- 不改 JSX、`confirmRemoveItem()`、`removeItem()`、卡片欄位、桌機 CSS、資料結構或計算邏輯。

## 驗收與測試

- 390px：工具列為同一橫列、無水平溢出、垃圾桶仍至少 44×44px、名稱與金額欄位維持整行。
- 桌機：維持既有完整「計入支出」與工具列橫向版面。
- `tests/retirementPlannerPage.test.ts` 增加結構／完整文案的 regression assertion。
- 執行 `npx tsc -b`、`npm run test:ci`、`npm run build`、`npm run build:preview`。
- 更新本 Todo 的治理記錄並以產生器重建 Full／Lite Bundle。
