# Universal Rebalance Todo Backlog v2.3

最後更新：2026-08-23

### UR-TODO-076 資產配置區塊 Desktop/Mobile 重新設計

- 優先級：P3（使用者主動提出，Assets 頁「資產配置」區塊 Presentation／Responsive UX Redesign）
- 狀態：**CLOSED／Production Verified（PR #421）**
- 提出／開發日期：2026-08-23
- 問題：既有「資產配置」區塊在 Desktop／Mobile 皆為單一堆疊 `AllocationDonut`，資訊密度與視覺層級與使用者提供的核准參考稿（Desktop 兩欄／Mobile 單欄＋2×2 摘要卡）有明顯落差；且無任何「近1個月趨勢」呈現。
- 目標：Desktop（`≥1025px`）改為左右兩欄——左側 Donut＋Legend，右側四張 Summary Cards（總資產／成長資產／防守資產／現金部位）＋「資產明細（目前 vs 目標）」表格；Mobile（`≤768px`）改為單欄——Donut＋Legend，接著 2×2 摘要卡，**不 render** Desktop 明細表；Tablet（`769–1024px`）維持單欄流式排版但保留明細表。Desktop／Mobile 必須共用同一份資產資料、比例計算、成長／防守分類、目標配置、顏色 mapping 與趨勢資料來源，僅 presentation 依 breakpoint 不同。
- 明確不包含：Rebalance 核心算法、Household Liquidity 公式、AI Decision、CLEC、Simulator、Financial Event Ledger、attribution、transaction semantics、holdings 財務資料結構、Firebase archived-retirement contract、新增自動交易／市場預測、新建第二套資產 classification、為 sparkline 製造假歷史資料、Bottom Sheet／Mobile Desktop table、Production deployment 之外的任何自行 Merge。
- Contract Audit（開發前唯讀盤點，確認正式）：
  - 總資產 SSOT：`calculateMetrics()`（`src/App.tsx`），無第二套 totalAssets 計算。
  - 成長／防守分類 SSOT：`normalizeAssetClass()`；現金恆定計入防守，非 `Holding`。「00631L 67.4%＝成長 67.4%」為使用者實際持股組合巧合（該使用者成長分類下唯一有股數的標的），非分類 bug，未修正分類邏輯。
  - 目標配置／偏離 SSOT：`getEffectiveTargetPercent()`／`getCashTarget()`／既有 `tone()` 偏離色彩 contract（`up`＝紅／超配，`down`＝綠／低配，`hold`＝中性），沿用不新建公式。
  - 趨勢資料 SSOT：`state.netWorthHistory`。僅 `totalAssets`／`cash` 有逐日真實歷史，可重用既有 `historyForRange()`；「成長資產」「防守資產」與 Desktop 個股趨勢欄**無任何逐日持久化資料**，經使用者明確拍板（AskUserQuestion 確認）採 **fail-closed**（顯示「近1個月趨勢資料不足」／「資料不足」），不新增 persistent history infrastructure，不偽造 sparkline。
  - Symbol color mapping SSOT：`allocationColor()`／`FIXED_ALLOCATION_COLORS`／`ALLOCATION_COLORS`（`src/App.tsx`），為全站唯一色彩來源，Donut／Legend／Desktop 明細表 dot／既有 Analytics 頁 `AllocationDonut` 皆共用同一組色值，確保「同一資產必須使用完全一致的 accent color」。
- 新增元件：`AssetAllocationOverview`／`AssetAllocationDonutPanel`／`AssetOverviewCard`／`AssetAllocationDetailTable`／`MiniSparkline`（`src/App.tsx`）；純資料轉換 helper `src/lib/assetAllocationOverview.ts`（`deriveAllocationLegendItems`／`deriveAllocationDetailRows`／`sparklinePointsFromHistory`／`deriveSparklineChange`／`allocationTone`）。既有 `AllocationDonut`（Analytics／Rebalance 頁）改為呼叫共用的 `deriveAllocationLegendItems()`，行為完全不變，未修改其 JSX 或版面。
- 色彩迭代（Round 1～5，皆為同一 PR 內的 UI Refinement，非新 Sprint）：
  1. Round 1：建立 deterministic color mapping（`FIXED_ALLOCATION_COLORS`／`ALLOCATION_COLORS`），確保未來新增合法持股仍可取得穩定顏色。
  2. Round 2：Desktop／Mobile 視覺密度精修（Legend 由大型 card 改為 compact row、Summary Card 加寬、明細表 padding 調整、Mobile Donut 縮小、fail-closed 訊息去重）。
  3. Round 3：首次提高飽和度／對比（HSL 模型）。
  4. Round 4：延續 HSL 加亮策略，結果在 OKLCH 模型下量測**每個命名 symbol 的 Chroma 反而低於 Round 3**（Lightness 過高導致偏白），使用者驗收後判定方向錯誤。
  5. Round 5（最終定案）：改以 OKLCH 模型修正——同色相下降低 Lightness、提高 Chroma（拉向 sRGB gamut 邊界並回退約 8% 避免 clipping），程式化驗證 7 個命名 symbol 之 Chroma 全數高於 Round 4、Lightness 全數低於 Round 4、hue 偏移皆在 ±8° 內、對 `--bg-surface-2` WCAG 對比全數 ≥4.5:1。最終 palette：`00631L`＝`#ff4d5f`、`0050`＝`#3388ff`、`00662`＝`#37df88`、`00685L`＝`#ff812b`、`00865B`＝`#9a6cf5`、台幣現金＝`#f8bd32`、`00895`＝`#3adff3`；Summary Card 主數值 accent：總資產`#3686f6`、成長資產`#37de99`、防守資產`#f84436`、現金部位`#aa65f7`（icon 背景 alpha `.25`）。`.up`／`.down`／`.hold` P&L 語意色 contract 全程未變。
- 驗收與正式結案：使用者已完成 Desktop 與 iPhone Safari Preview 人工驗收，結論 **PASS**，並明確授權 Merge。`npm run test:ur-todo-076` 38/38 pass（含 OKLCH chroma/lightness/hue/WCAG 程式化驗證，非僅比對 hex 字串）；`test:ur-todo-070／071／072／073／075` regression 25／41／19／36／9 全數 pass；TypeScript／Production build／Preview build／`git diff --check` 均通過。本機 Windows `npm run test:ci` 因既有 `clecTwReferenceHistoricalValidation.test.ts` CRLF/LF 環境差異（與本 Sprint 0 diff）致 `&&` chain 提前中止，已改採逐一獨立執行受影響腳本驗證，並以 GitHub Actions `CI Verification`（Linux／LF checkout，本次多次 head 皆 success）作為完整 chain 之權威依據。PR [#421](https://github.com/hyc640110/family-universal-rebalance/pull/421) final head `1a9f3ecf6b30a27633e310be4b74cba70626cfb3` 已由 `hyc640110` 於 `2026-08-23T02:31:04Z` 合併為一般 2-parent merge commit `afa4ce631c48e4eca152d961144fab8b81e9a990`（parents `10c1014be558ad446095971be295d90e6d6af399`／`1a9f3ecf6b30a27633e310be4b74cba70626cfb3`；未使用 admin override）。main push Deploy GitHub Pages run [32613055998](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32613055998) success。Production HTTP 200／deployment `environment=github-pages`／`state=success`（sha 與 merge commit 一致）；Desktop 1280px 與 Mobile 390px 唯讀驗證 PASS（詳見 `003_CURRENT_STATUS.md` 對應條目），Summary Card computed color 實測確認為 Round 5 最終 palette，console 無新增錯誤。
- 正式邊界：`src/lib/**`（既有部分）、schema、persistence、`holdingDisplayOrder`、Rebalance、AI Decision、CLEC、Household Liquidity、Financial Event Ledger、attribution 均 0 semantic diff；Analytics／Rebalance 頁既有 `AllocationDonut`／`AllocationAnalysis` 版面與互動完全未修改（僅共用色彩 SSOT 一併套用新 palette）。

### UR-TODO-075 Holding Detail Information Architecture & Visual Refinement

- 優先級：P3（使用者於 Production 實際使用後提出的新持股詳細頁 UX／資訊層級需求）
- 狀態：**CLOSED／Production Verified（PR #412）**
- 提出／開發日期：2026-08-22
- 問題：UR-TODO-072 的 Detail Dialog 已解決 inline 展開造成的頁面過長，但詳細頁第一屏仍以大量輸入欄位為主，難以快速查看持股狀態、損益與配置。
- 目標：以既有 Production 詳細頁全部功能為基準，改為「摘要卡（Allocation Ring、名稱、symbol、市值、未實現損益）→ 基本資訊 → 損益資訊 → 配置資訊 → 預設收合投資設定 → 獨立資產管理危險操作區」。資產占比只保留一個 denominator；以既有目前比例與目標比例即時計算配置偏離，不新增持久化欄位。
- 已確認互動：方案 B——`<details>` 的「投資設定」預設收合；展開後保留總股數、成交均價、目標比例、資產分類、波段最高價、逢低提醒與首頁重點標的全部既有 handler。封存已清倉維持最底部獨立區塊及原確認流程。
- 明確不包含：Holding schema／AppState、財務公式、報價或 P&L 語意、Rebalance／AI Decision／CLEC／Household Liquidity、Financial Event Ledger／attribution、holdingDisplayOrder、localStorage／JSON Backup、Firebase／sync；台股上漲紅／下跌綠市場色彩契約不得反轉。
- Contract Audit：`HoldingDetailContent` 由 `m.rows` 每次 render 取最新 row，沿用 `updateHolding`、`updateDipAlert`、`toggleFocusedSymbol`、`confirmRemoveHoldingAsset`；不得建立第二套資料更新或 editable snapshot。當總資產無法推導目前比例時，Ring 顯示 `—`、配置偏離顯示 `—`，不得把未知值轉為 0。
- 驗收與正式結案：使用者本機 Preview 人工驗收 PASS；`test:ur-todo-073` 34/34、`test:ur-todo-075` 9/9、TypeScript、Production／Preview build 與 `git diff --check` 均通過。Windows 本機 `test:ci` 的唯一 CRLF/LF 失敗為既有 `clecTwReferenceHistoricalValidation.test.ts:186` 環境差異，該 test 與對應 source 相對 `origin/main` 均為 0 diff，非本 Sprint regression；相同 final head 的 GitHub required `verify` 為 success。PR [#412](https://github.com/hyc640110/family-universal-rebalance/pull/412) final head `202f96572d50e1c612854fa89c9ed6adda9b64de` 已由 `hyc640110` 於 `2026-08-22T11:48:49Z` 合併為一般 2-parent merge commit `696ea2f4d1d9b5ae8fafcc192046a00a2301cb37`（parents `7e479636f7245b1cd0d8102db5a8b95f5822016d`／`202f96572d50e1c612854fa89c9ed6adda9b64de`；未使用 admin override）。main push Deploy GitHub Pages run [32571291838](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32571291838) success。Production HTTP 200／`environment=production`／base `/family-universal-rebalance/`、JS `index-CABEEP71.js`、CSS `index-BdoQJe4A.css` 均驗證正常；新版 Holding Detail、持股列表 elevated gray surface 與 390×844 無 horizontal overflow 的 smoke check PASS。
- 正式邊界：PR #412 未包含 PR #413、isolated Preview infrastructure、Production Deployment Policy Hardening、`environmentBoundary`、schema、persistence、Financial Event Ledger、attribution、Rebalance 或 AI Decision。PR #413 已於後續獨立 Infrastructure Governance Closeout 完成（MERGED／Infrastructure Installed／Isolated Remote Preview Verified），非 UR-TODO-075 blocking item，且本項不另建立新的 UR-TODO。

2026-08-21 **UR-TODO-072（Holding Card Detail Modal/Sheet）正式 CLOSED／Production Verified。** PR [#406](https://github.com/hyc640110/family-universal-rebalance/pull/406) final head `a25f39359b2b1a7219eccfa13fe78102e1798a1f` 已由 `hyc640110` 於 `2026-08-21T15:16:18Z` 以一般 2-parent merge commit `5e939433c272d87f2a794554f9ec1373a50d4bf3` 合併（parents `614771ffd8013ad7eb8b238fa3cec439c338f54c`／`a25f39359b2b1a7219eccfa13fe78102e1798a1f`；**未使用 admin override**）；`origin/main` 正式基線更新為 `5e939433c272d87f2a794554f9ec1373a50d4bf3`。PR required CI Verification run [32495590307](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32495590307) success，同 head Preview workflow_dispatch run [32495783281](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32495783281) success，使用者已完成 **iPhone Safari 真機人工驗收，結論 PASS**；merge 後 main Deploy GitHub Pages run [32496693557](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32496693557) success，head 與 merge commit 一致，Production 已唯讀確認 HTTP 200、`environment=github-pages`、deployment sha 一致、持股卡片維持 compact、「詳細」入口正確開啟對應 Dialog，console 無錯誤，未寫入任何 Production 使用者資料。持股卡片「詳細」由 inline 展開改為獨立 `HoldingDetailDialog`（Desktop 置中 modal／Mobile 近全高 bottom sheet），完全重用既有 `updateHolding`／`updateDipAlert`／`toggleFocusedSymbol`／`confirmRemoveHoldingAsset`；`Holding` schema／`AppState`／localStorage／JSON Backup／`holdingDisplayOrder` persistence／Rebalance／AI Decision／CLEC／Household Liquidity／Financial Event Ledger／attribution 均未變更。Preview 階段發現並修正一項真實 UX 缺陷：關閉 Dialog 還原焦點時純 `.focus()` 會把觸發按鈕捲入可視範圍造成頁面跳動，已改用 `.focus({ preventScroll: true })`。新增 19 tests（`test:ur-todo-072`）已納入 `test:ci`；`test:ur-todo-070`（25 tests）／`test:ur-todo-071`（41 tests）重新執行確認無回歸。詳見下方 **UR-TODO-072** 正式條目。

2026-08-21（歷史記錄，已由上方 CLOSED／Production Verified 條目取代）**新增 UR-TODO-072（Holding Card Detail Modal/Sheet），狀態：開發完成／PR Draft 待驗收。** Maintenance / Real-Use-Case Driven Mode 生效後第一個由真實 iPhone Production 使用 UX friction 觸發的 Sprint（見同日稍早條目）：持股卡片「詳細」按鈕原地 inline 展開大量編輯欄位、推長頁面、增加捲動負擔，改為獨立 `HoldingDetailDialog`（Desktop 置中 modal／Mobile 近全高 bottom sheet，同一元件純 CSS 切換）。完全重用既有 `updateHolding`／`updateDipAlert`／`toggleFocusedSymbol`／`confirmRemoveHoldingAsset`，未建立第二套資料更新邏輯；`Holding` schema／`AppState`／localStorage／JSON Backup／`holdingDisplayOrder` persistence／Rebalance／AI Decision／CLEC／Household Liquidity／Financial Event Ledger／attribution 均未變更。Preview 手動測試發現並修正一項真實 UX 缺陷：關閉 Dialog 還原焦點時若用純 `.focus()` 會把觸發按鈕捲入可視範圍、造成頁面跳動，已改用 `.focus({ preventScroll: true })` 修正。新增 19 tests（`test:ur-todo-072`）已納入 `test:ci`；`npx tsc -b`／`npm run build`／`git diff --check` 全數通過；`test:ur-todo-070`（25 tests）／`test:ur-todo-071`（41 tests）重新執行確認無回歸。詳見下方 **UR-TODO-072** 正式條目。**PR 尚為 Draft，未經使用者 iPhone Safari 真機驗收與明確授權，不得 Merge。**

2026-08-21 **Remaining Backlog Governance Closeout — Maintenance / Real-Use-Case Driven Mode 生效。** Review Mode 完整掃描最新版剩餘所有非 CLOSED Backlog（`docs/maintenance-mode-backlog-closeout` branch），確認 **ACTIVE = 0**——沒有任何項目同時具備真實產品問題、明確 consumer、尚未被吸收、ROI 足以支持近期開發四項條件。逐項校正措辭為明確現況分類（不再使用模糊的「待開發」）：**UR-TODO-012**（Rebalance Scenario Simulator）DEFERRED／LOW PRIORITY；**UR-TODO-015**（股票質押／LTV）OPEN／DEFERRED／NEEDS REAL USE CASE；**UR-TODO-017**（股息預估模型）OPEN／DEFERRED／CURRENT PRODUCT NON-GOAL（與 `DividendCenterPage` 既有明文聲明「不提供未來收益預估」一致）；**UR-TODO-018／019**（全球指數／經濟事件資料來源）OPEN／NEEDS CONTRACT AUDIT／DATA SOURCE DECISION／NOT ACTIVE（架構已完整設計並對齊，純缺一個資料來源授權決策，無任何頁面因此降級）；**UR-TODO-020**（Gmail 通知解析）OPEN／DEFERRED／NEEDS REAL USE CASE（OAuth broker foundation 存在但已主動下架，不採 sunk-cost reasoning）；**UR-TODO-024**（多家庭成員）OPEN／DEFERRED／NEEDS REAL USE CASE；**UR-TODO-025**（保險保單追蹤）OPEN／DEFERRED／DEPENDS ON REAL HOUSEHOLD USE CASE；**UR-TODO-054（父項）**CLOSED AS UMBRELLA／FOLLOW-UPS RESOLVED（明確澄清不代表 054-C 已完成，054-C 本身維持 DEFERRED／NO-GO／NEEDS REAL CONSUMER）；**UR-TODO-055／056** 措辭強化為 DEFERRED／NO-GO／NON-PRIORITY。每項均附正式 REOPEN TRIGGER。同時完成 `019_Idea_Pool.md` IDEA-001 正式評估（見該文件），`002_MASTER_ROADMAP.md` 確認無誤導性內容、本次未修改。**Universal Rebalance 正式進入 Maintenance / Real-Use-Case Driven Mode**：新 Development Sprint 須由 Production bug／correctness regression、真實使用 UX friction、財務安全／風險控制缺口、既有資料或流程無法完成真實工作、使用者明確新需求、或 Deferred Todo 的 REOPEN TRIGGER 真正成立六者之一觸發；Deferred／NEEDS CONTRACT AUDIT 項目不得再被 AI 自動推薦為下一 Sprint，除非其 REOPEN TRIGGER 成立。本次僅修改 `AI_CONTEXT/**` 治理文件，**未修改任何 `src/**`／`tests/**`／`scripts/**`／`package*.json`／`.github/**`／`workers/**`／schema／persistence／Household Liquidity／Rebalance／Risk／AI／CLEC／Simulator 契約**。

2026-08-21 **UR-TODO-007 Final Closeout Governance Sync——正式 CLOSED，不宣稱 Production Verified。** Review Mode Consumer Contract Audit（`docs/ur-todo-007-final-closeout` branch）確認 UR-TODO-007 舊狀態「部分完成」與「尚未接入任何正式 consumer」文字已過期：`liquidityRole`／`linkedLoanId` 早已透過 `src/lib/householdLiquidityInputAdapter.ts` 進入 Household Liquidity SSOT，Rebalance（UR-TODO-008）、Risk／AI／Home Decision（UR-TODO-009）、CLEC／Simulator（UR-TODO-010）均已透過 SSOT 衍生值正確接線，且經 grep 驗證下游模組對 raw provenance 欄位零直接讀取；2026-07-28 mini-sprint（PR #167／#169／#171）補齊 diagnostics／producer UI；Plan Input UI Entry Point 殘餘已由 UR-TODO-036 解決。**UR-TODO-007 正式 CLOSED，remaining correctness gap = NONE。** 新增正式 architecture boundary：未來不得為了「補完 UR-TODO-007」讓任何 downstream module 直接讀取 raw `liquidityRole`／`linkedLoanId`，新的 provenance 使用情境須另立獨立 Contract Audit。2026-07-28 diagnostics Production 互動驗收的歷史「待盤點」紀錄予以保留、不重新開啟本 Todo，因缺正式後續驗收證據，本次**不宣稱 Production Verified**。本次僅修改 `AI_CONTEXT/**` 治理文件，**未修改任何 `src/**`／`tests/**`／schema／persistence／Household Liquidity／Rebalance／Risk／AI／CLEC／Simulator 契約**。

2026-08-21 **Backlog Consistency & Closeout Audit——UR-TODO-031／054／069 純治理修正。** Review Mode 唯讀稽核（`docs/ur-todo-031-054-069-governance-sync` branch）確認三項狀態欄位漂移，逐項校正：(1) **UR-TODO-069** 自身章節狀態欄位先前仍寫「開發中／Draft PR 待驗收」，與頁首 2026-08-17 CLOSED／Production Verified 條目（PR #373）不一致，已校正為一致的 CLOSED／Production Verified；(2) **UR-TODO-031**（投資健康度安全存量命名與說明）正式 Closeout：原始目標 consumer 首頁「投資健康度」（`dashboard-health-card`）已由 UR-TODO-063（2026-08-15）移除，「安全存量」語意已在 `householdLiquidity.ts`／`aiDecision.ts`／`homeDecision.ts`／`riskMetrics.ts` 等 production modules 落地，closure reason 為 absorbed by subsequent Production capabilities／original consumer removed（歷史文件無法完整還原原始逐條驗收紀錄，不宣稱逐條完成）；(3) **UR-TODO-054** 父項狀態欄位由「開發中」校正為「子項已全數決議／目前無 active 開發（Deferred／Non-Priority）」，反映 054-A／054-B 已 CLOSED、054-C 維持待規劃／NO-GO 的實際治理終局狀態，**未重新開啟 054-C、未變更 055／056、未變更任何 attribution contract**。本次僅修改 `AI_CONTEXT/**` 治理文件，**未修改任何 `src/**`／`tests/**`／schema／persistence／Ledger／attribution 程式碼**。

2026-08-19 **UR-TODO-071（Holding Card Drag Reorder），狀態：CLOSED／Production Verified。** PR [#397](https://github.com/hyc640110/family-universal-rebalance/pull/397) final head `78f44f5b0a55e50ff4c9d9fb845831dde3940649` 已由 `hyc640110` 於 2026-08-19T14:27:33Z 以一般 2-parent merge commit `e39f8489e95bc90cf37e46e060f8250ef04d0573` 合併（parents：`5d45ccd55a1bd3ef357edefe5d7369f0f29a4e0b`／`78f44f5b0a55e50ff4c9d9fb845831dde3940649`；未使用 admin override）。PR required CI `32262092171` success，相同 head Preview workflow_dispatch `32262111201` success，使用者完成 iPhone Safari Round 2 人工驗收 PASS；merge 後 main Deploy GitHub Pages `32264138787` success，head 與 merge commit 一致。Production 已唯讀確認 HTTP 200、bundle 更新為本次 build 產物（`index-DTD1MPZn.css`／`index-YNeFg2N5.js`）、單一 ☰ handle 已上線、`.holding-order-button` 舊按鈕數為 0、無 console 錯誤。開發期間經歷 Round 1（FAIL：downward 長距離拖曳失敗＋icon 不符核准）→ Round 2（root cause：element-level `setPointerCapture` 在 handle 被 React 重新定位時遭 Safari 釋放，改用 document-level pointer listener 修正；icon 改為 `Menu` ☰）兩輪 iPhone Safari Preview 修正，詳見下方獨立條目。

2026-08-19 **UR-TODO-070（持股資產卡片 Mobile Compact + Manual Ordering），狀態：CLOSED／Production Verified。** PR [#395](https://github.com/hyc640110/family-universal-rebalance/pull/395) final head `9110d78967ab14fa9c3357ad3f33729f4b391c0e` 已由 `hyc640110` 於 2026-08-19T12:30:04Z 以一般 2-parent merge commit `ddb019bb1ef9999d9b2a230e0d8dfed9d941fabd` 合併（parents：`e66d909696635d28534d3665fc49b3108e2bc6df`／`9110d78967ab14fa9c3357ad3f33729f4b391c0e`；未使用 admin override）。PR required CI `32163151324` success，相同 head Preview workflow_dispatch `32163158998` success，使用者完成 iPhone Preview 人工驗收 PASS；merge 後 main Deploy GitHub Pages `32252977963` success，head 與 merge commit 一致。Production 已唯讀確認 HTTP 200、bundle 更新為本次 build 產物、mobile compact CSS 與 ↑/↓ 排序按鈕已上線、無 console 錯誤。先前未正式登錄於本檔案，本次治理同步一併補登為正式條目，詳見下方獨立條目。

2026-08-19（歷史記錄，已由本文件最上方 UR-TODO-071 CLOSED／Production Verified 條目取代）**新增 UR-TODO-071（Holding Card Drag Reorder），狀態：OPEN／PLANNED，尚未開始開發。** 延續 UR-TODO-070 的 Contract Audit（Review Mode，2026-08-19）結論，使用者已核准將現行 ↑/↓ 按鈕改為單一 drag handle 的方向；本次治理同步僅建立正式 Backlog 條目，**未建立任何功能 branch，未修改 `src/**`／`tests/**`**，詳見下方獨立條目。

2026-08-17 **UR-TODO-021 Electronic Statement Import Foundation，狀態：CLOSED／Production Verified。** PR [#377](https://github.com/hyc640110/family-universal-rebalance/pull/377) 已由使用者授權以一般 merge commit `f0b57c038c0a19c86deeee7a0a73872ac94231e2` 合併；PR verify `32036912584` 與 main Deploy GitHub Pages `32037454446` 均 success。使用者已完成本機隔離 Preview 的桌機／390px 人工驗收：正常文字型 PDF、多頁解析、收入／支出方向、bare-positive fail-closed 與 unknown-structure fail-closed 均通過。Production HTTP 200／`environment=production`，公開 bundle 已確認 `.csv,.xlsx,.pdf` picker contract 與文字型 PDF 支援；未建立測試交易。Contract Audit GO-B 結論維持：CSV／XLSX、mapping、preview、duplicate detection、user confirmation 與 transaction creation 下游契約沿用既有 Import Center；PDF 僅新增 lazy-loaded text extraction／pure adapter，明確方向的金額才接受，掃描／圖片型、無文字、裸正數、不完整或不明結構一律 fail closed。未加入 OCR、銀行專屬猜測、AI 自動分類、Loan／Investment／FX attribution、Ledger／Backup schema 或其他財務核心變更。

2026-08-16 **舊 Backlog Closeout Audit（UR-TODO-012～025）唯讀盤點完成，經使用者逐項拍板後更新對應正式條目。** Review Mode 唯讀盤點確認 UR-TODO-012／013 自建立以來僅有標題／優先級／依賴，從未記錄過逐項驗收條件（已核對 `AI_CONTEXT/` 全部歷史版本與 git log，確認無獨立規格文件）；依使用者指示**不逕行標記完成**，改為記錄與 UR-TODO-048／058 的功能面比對結論，並將殘留範圍縮小、明文記錄。UR-TODO-014 範圍縮小為「CLEC 442／433／703／5050 規則本身」之歷史回測，與 UR-TODO-058（特定 3 資產、Excel 來源固定策略比較，非 CLEC 規則觸發邏輯）明確劃清界線。UR-TODO-021 依 Import Center 現況（`ImportCenter.tsx` 已支援 CSV／XLSX 解析、欄位對應、重複判定）上修狀態。UR-TODO-022 維持部分完成，範圍註明縮小為尚缺「全自動分類（無需人工欄位對應）」。UR-TODO-024 拆分：多帳戶部分（`financialAccounts.ts` 既有 8 種帳戶類型）標記完成，範圍縮小為「多家庭成員」。UR-TODO-025 不關閉，範圍縮小聚焦「保險保單追蹤與保障缺口分析」（原退休子範圍已由 UR-TODO-066 CLOSED 吸收），並與縮小後的 UR-TODO-024（多家庭成員）建立依賴關係。UR-TODO-015／016／017／018／019／020／023 維持現狀不變。純治理文件更新，未修改任何程式碼。詳見下方各自正式條目。

2026-08-17 **UR-TODO-069（退休規劃固定支出卡片手機版 follow-up），狀態：CLOSED／Production Verified。** PR [#373](https://github.com/hyc640110/family-universal-rebalance/pull/373) 已以一般 2-parent merge commit `23416db7e575cbbac38abb67f3b72d94d9d28d74` 合併（parents：`87777766f9e2c37bcae0bad35194cc20444ab67a`／`56b3f551bccb22407cdbda4005246cf68f3c9abb`，`mergedAt: 2026-08-16T13:17:12Z`，`mergedBy: hyc640110`）；PR verify [31948775856](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31948775856) success，merge 後 main Deploy GitHub Pages [31949386977](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31949386977) completed/success，head 與 merge commit 一致。Production HTTP 200／`environment=production`，公開 CSS bundle 已確認在 `max-width:768px` 以 `.retirement-expense-enabled{flex-direction:row;white-space:nowrap}` 保持「計入支出」勾選框與文字同列；390px 與 Desktop 本機 Preview 驗收均正常，Desktop 不受該 mobile override 影響。匯入與自訂項目共用同一段 `draft.fixedExpenses.map(...)` JSX 與 class，對應 regression test 已存在並通過。未變更 JSX、刪除確認、`removeItem()`、Cash Flow、`retirementPlan`、schema、persistence、JSON Backup、Ledger、attribution、Household Liquidity 或 Rebalance；本 Todo 無剩餘項目。

2026-08-16 **UR-TODO-068（退休規劃頁面「匯入項目」新增刪除功能）正式標記 CLOSED。** PR [#370](https://github.com/hyc640110/family-universal-rebalance/pull/370) 已正式 Merge（merge commit `c7aba5f91bbd024eafdc88bdd9fbf18128dada26`，一般 merge commit，未使用 admin override，使用者於 Preview 驗收通過後親自執行 Merge），`origin/main` 正式基線更新為 `c7aba5f91bbd024eafdc88bdd9fbf18128dada26`。使用者回報 `/tools/retirement-planner` 固定支出清單中，從「收支與現金流」匯入的項目只有勾選框、沒有刪除按鈕，只有「新增自訂項目」加入的項目才能整筆刪除；唯讀盤點確認此為 UR-TODO-066 建立當下即存在的既有行為（非回歸），且沒有任何文件記載為刻意設計，經使用者拍板後移除刪除按鈕的 `customFixedExpenseIds` 條件限制，改為所有項目皆可刪除，行為與既有自訂項目刪除完全一致（只影響本頁草稿，不回寫 `cashFlowProfile`）；「從現金流匯入」確認對話框文字同步更新為明確點名「先前刪除的項目可能會重新出現」。Deploy GitHub Pages run [31939740957](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31939740957) success；Production 已唯讀確認 HTTP 200、重新本機建置後與正式部署的 JS bundle 逐位元組比對完全一致、既有功能與 console 皆正常，未在正式站台輸入資料污染真實帳目。使用者已完成跨頁面桌機與 390px 手機 Preview 驗收。詳見下方 **UR-TODO-068** 正式條目。

2026-08-16 **新增並正式標記 CLOSED：UR-TODO-067（DraftInput 共用元件——顯示 0 時輸入被附加而非取代）。** 使用者於驗收 UR-TODO-066（退休提領規劃）過程中發現金額輸入框「顯示 0 時輸入被附加而非取代」問題，排查確認退休頁面本身已於 PR #366 修正，但全站共用元件 `DraftInput`（`src/App.tsx`）存在同類、範圍更廣的既有缺陷（影響帳戶餘額 8 種類型、持股欄位、逢低提醒設定、加碼預算、股價更新秒數），先前未正式登錄過編號。PR [#368](https://github.com/hyc640110/family-universal-rebalance/pull/368) 已正式 Merge（merge commit `b4d13eb1466d1ec2dee99b140f2a2fc083a96e33`，一般 merge commit，未使用 admin override，使用者親自執行 `gh pr merge --merge`），`origin/main` 正式基線更新為 `b4d13eb1466d1ec2dee99b140f2a2fc083a96e33`。修正為單一加法式變更：`DraftInput` 的 `onFocus` 新增「顯示字面 `0` 時清空 draft」判斷，讓下一個按鍵直接取代而非附加；不影響任何底層資料結構或計算邏輯。Deploy GitHub Pages run [31933735266](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31933735266) success；Production 已唯讀確認 HTTP 200、重新本機建置後與正式部署的 JS bundle 逐位元組比對完全一致（證實修正已上線）、既有功能與 console 皆正常，未在正式站台輸入資料污染真實帳目。使用者已完成跨頁面 Preview 驗收（資產頁帳戶管理、持股資產頁、逢低提醒設定、加碼預算、設定頁）。詳見下方 **UR-TODO-067** 正式條目。

2026-08-16 **UR-TODO-066（退休提領規劃／retirement-planner）正式標記 CLOSED。** PR [#366](https://github.com/hyc640110/family-universal-rebalance/pull/366) 已 Merge（一般 merge commit `83223498afb196179f24f66c7f3009644e006765`，未使用 admin override）；CI Verification `31931191149` 與 main Deploy GitHub Pages `31931698419` success，Production 已唯讀確認退休頁與工具導覽正確載入、HTTP 200／`environment=production`。

2026-08-16 **新增並正式標記 CLOSED：UR-TODO-065（現金流工具頁「新增項目」按鈕移位＋收合開關）。** PR [#364](https://github.com/hyc640110/family-universal-rebalance/pull/364) 已正式 Merge（merge commit `5cc0fe5`，一般 merge commit，未使用 admin override），為目前 `main`／`origin/main` 正式基線。`/tools/cash-flow`「固定支出清單」的「新增項目」按鈕從標題列移至清單最下方，與「儲存現金流設定」「清空設定」並排；標題列新增收合／展開開關，沿用全站既有 `SectionCard` 收合慣例（`collapsible-card`／`CollapseEyeIcon`），未發明新機制。純 UI 調整，不涉及計算邏輯或資料結構變更。Deploy GitHub Pages run [31923694128](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31923694128) success；Production 已唯讀確認按鈕新位置與收合開關正確運作、既有功能不受影響，console 無錯誤。詳見下方 **UR-TODO-065** 正式條目。

2026-08-16 **新增並正式標記 CLOSED：UR-TODO-064（首頁 supportingItems 清理＋標題文案微調）。** PR [#363](https://github.com/hyc640110/family-universal-rebalance/pull/363) 已正式 Merge（merge commit `93d5911`，一般 merge commit，未使用 admin override）。延續 UR-TODO-063 首頁瘦身方向，經 Repository 唯讀 Daily Decision UX Audit 發現兩處低風險小缺陷後修正：移除 `deriveInvestmentIntelligence()` 內完全未被消費的 `todayPerformance`／`attentionItems` 兩項計算欄位；「今日投資摘要」（`investment-summary-card`）eyebrow 由「今日投資摘要」改為「資產快照」，降低與「今日投資狀態」（`investment-intelligence-card`）標題混淆。**內容本身無重複，僅命名容易混淆，此為文案層級調整，非邏輯或資料流變更。** Deploy GitHub Pages run [31922805564](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31922805564) success；Production 已唯讀確認「資產快照」標題正確顯示、既有功能不受影響，console 無錯誤。詳見下方 **UR-TODO-064** 正式條目。

2026-08-15 **UR-TODO-056（FX Enhancement Bundle）Contract Audit 結論補記，維持「待規劃」狀態，判定四個子項皆不建議現在開發。** Contract Audit（Review Mode 唯讀盤點）逐項確認四個子項現況：(1) **FX valuation attribution**——`unexplainedResidual = netWorthChange - classifiedEventContribution`，USD 部位匯率波動效果留在此殘差是「沒有分類事件」的數學必然結果，非刻意規則；`fxValuation.ts` 目前只有單一時間點的估值（`ForeignCashValuation`），沒有跨快照拆解匯率波動貢獻的邏輯；四項中**唯一已有直接可重用基礎建設**（rate history、valuation function），相對複雜度較低。(2) **JPY/EUR 等其他貨幣對**——確認嚴格限定 TWD↔USD，`SUPPORTED_FX_CONVERSION_CURRENCIES`（`fxConversionIdentity.ts`）、`FxRateRecord.baseCurrency` 型別字面值（`fxValuation.ts`）、`cbcFxProvider.ts` 三處皆寫死為 `'USD'`；非 runtime 開關，橫跨型別系統／Worker 資料來源／UI 表單四層，擴充範圍大。(3) **Automated FX pairing**——全庫搜尋確認零雛形，唯一相關命中是既有程式碼註解「never auto-repaired, never silently guessed at」（刻意拒絕自動猜測的既有設計原則，非尚未實作的既定方向）；且「automated」具體場景（CSV 自動偵測配對？表單自動預填？）治理文件與程式碼皆未定義，**開發前需先做需求釐清，才能進行 Contract Audit**。(4) **進階 fee attribution**——現有 `none`／`explicit`／`included`／`unknown` 四態穩定運作；「進階」明確指向兩項已被 F2D 排除的能力：從匯率價差反推 fee（需先定義「市場匯率」基準，屬產品定義問題非技術缺口）、fee 表單內直接建立新交易（單純 UI 便利性改善，複雜度較低）。**四個子項架構上完全獨立、無強制依賴順序**（automated pairing 不需要先有 valuation attribution，JPY/EUR 擴充不影響其他三項）。治理文件內**未記載任何一項的具體業務情境**（無使用者提出的日圓部位、fee 計算不準、批次換匯等具體需求），比照 UR-TODO-054-C／055 判定邏輯，**四項皆判定為未經需求驗證的技術性擴充清單，不建議現在開發**。若未來啟動，建議：先確認具體業務情境、各自獨立走 Contract Audit（不得合併成單一 PR，本次確認四者架構上也確實彼此獨立）、automated pairing 需先定義場景才能稽核。詳見下方更新後的 **UR-TODO-056** 正式條目。

2026-08-15 **UR-TODO-055（Loan／Investment Delivery Mapping）Contract Audit 結論補記，維持「待規劃」狀態；同時修正 UR-TODO-054-A 條目對 Investment 的既有錯誤記錄。** UR-TODO-055 盤點過程中發現 UR-TODO-054-A 條目原記載「Investment 不需要處理——已用 runtime 證據確認 Investment 買賣本就走既有通用 `safe-taxonomy-candidate`／`RuntimeAttributionProvenanceCard` 路徑」，經以實際程式碼逐項核對後**證實此說法不準確，已正式修正**：全庫搜尋確認 `investmentAttribution` 欄位在 `src/App.tsx`／`src/components/`／`src/pages/` 零命中，Investment 買賣目前完全沒有任何 Producer；`transactionReconciliation.ts` 的 `candidateFor()` 必須此欄位已存在才會判定 `investment-buy`／`investment-sell`，未設定時「投資」類別交易會因 `SAFE_EXPENSE_CATEGORIES` 不含 `expense-investment` 而直接判定 `unsupported-taxonomy`，連進入 `safe-taxonomy-candidate` 可確認清單的資格都沒有。**UR-TODO-055 Contract Audit 本身結論**：底層 attribution contract 已完整存在不需修改，缺口在交付層；Loan 側已有 Producer，缺口是 CSV 批次匯入＋金額拆分 UI（需新 UI 互動設計，因原始資料通常不含拆分後數字）；Investment 側連基礎 Producer 都不存在，範圍更接近獨立的「Investment Producer」子項；治理文件內未記載任何具體業務情境，比照 UR-TODO-054-C 判定邏輯，**判定為錦上添花性質，暫不建議開發**，若未來啟動建議拆成 Investment Producer／Loan CSV 拆分 UI／Import Center schema 擴充三個獨立子項。詳見下方更新後的 **UR-TODO-054-A／UR-TODO-055** 正式條目。

2026-08-15 **UR-TODO-054-C（Generic Split Confirmation UI）Contract Audit 結論補記，維持「待規劃」狀態，判定不建議現在開發。** Contract Audit（Codex Desktop 執行，Review Mode 唯讀盤點；本次治理同步已重新以 Repository 實證逐項核對）確認：Generic Split 底層 contract（`appendGenericSplitAllocationGroup()`、`genericSplitAllocation.ts` identity）已完整存在，但**完全沒有任何 candidate producer**——全庫搜尋確認 `src/App.tsx` 對 Generic Split 相關識別字（`appendGenericSplitAllocationGroup`／`splitAllocationLink`／`allocationGroupId`）零命中，`appendGenericSplitAllocationGroup()` 唯一呼叫者是測試本身；`transactionReconciliation.ts` 對 Generic Split 只有 `matched` 狀態的 `linked-generic-split-group` reason，**沒有專屬 `candidate` reason**（與 Loan／FX 皆已有專屬 candidate reason 的現況不同）；`RuntimeAttributionProvenanceCard` 確認不適用，但性質與 Loan／FX 不同——不是「需要排除」而是「目前根本沒有資料會出現」。與 054-A（Loan，已 CLOSED）的關鍵差異：054-A 開始開發前已有 Producer 與 candidate 存在，054-C 目前連 production domain、candidate producer、使用者輸入來源都不存在，範圍大於單純 Confirmation UI 開發。**結論：阻礙是「沒有可消費的真實 candidate／producer」，不是 UI 實作細節；維持待規劃狀態，若未來要啟動需先有具體業務需求才能定義 Producer，不建議現在開發。** 詳見下方更新後的 **UR-TODO-054／054-C** 正式條目。

2026-08-15 **UR-TODO-054-B（FX Confirmation UI）正式標記 CLOSED。** PR [#357](https://github.com/hyc640110/family-universal-rebalance/pull/357) 已正式 Merge（merge commit `fc9684ef955fca5c9d4194ea670b719e32c58727`，一般 merge commit，未使用 admin override），為目前 `main`／`origin/main` 正式基線。承接同日稍早的 Review Mode Contract Audit（GO 判定），架構比照已完成的 054-A（Loan Confirmation UI）成功模式：新增 `fxConversionPresentation.ts`（依 `conversionId` 把兩腿合併為單一 presentation 項目）、`FxConfirmationCard.tsx`，`App.tsx` 新增 `confirmFxConversion()`／`voidFxConversion()`，正確重用既有 `confirmFxConversionAndAppend()`／`voidFinancialEventAndAppend()` contract。**關鍵風險點**：`confirmFxConversionAndAppend()` 的 `result.events` 是完整合併 Ledger（與 Loan 方向相反），已有 CRITICAL regression test 明確鎖定，並經本機 Preview 端到端實機驗證 create→confirm→void→reconfirm 全流程 `financialEvents.length` 正確為 0→1→2→3。開發過程中發現並處理另一個過時的重複 Draft PR [#333](https://github.com/hyc640110/family-universal-rebalance/pull/333)（來自無關的較早 session，基於嚴重過時的 main，若 Merge 會刪除大量已上線功能），Closeout Audit 確認其與 PR #357 獨立收斂到相同核心架構判斷後，已 Close without merge，並將其中有保留價值的內容（跨 envelope 重複認領防呆、`handleVoid` 對稱防護、測試韌性缺口）整合進 PR #357。Deploy GitHub Pages run [31895761055](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31895761055) success，headSha 與 merge commit 一致；Production 已唯讀確認 FX Producer 表單與 `FxConfirmationCard` 皆正確不顯示（Producer gate 維持 OFF）、既有功能不受影響，console 無錯誤。詳見下方更新後的 **UR-TODO-054／054-B** 正式條目。

2026-08-15 **治理記錄落差修正：UR-TODO-041（負債資料過期警示）正式標記 CLOSED。** Review Mode Closeout Audit 發現此條目自 2026-07-26 建立後從未更新（狀態長期停留「待盤點」），但功能實際已於 2026-08-05 透過 PR [#254](https://github.com/hyc640110/family-universal-rebalance/pull/254)（merge commit `e11da75a476c4d426fedefabcc629b01f305a181`，一般使用者手動 Merge，未使用 admin override）完整實作、測試並上線 Production，只是治理文件從未同步。開發前唯讀盤點發現原始「驗收條件」預期路徑（擴充 `HouseholdLoan` 核心契約＋新增 blocking reason code）會連帶觸發 `dipAlertEngine.ts`／`aiDecision.ts` 既有保守化機制，使用者於開發當下重新拍板改採完全獨立、不進 `blockingReasons`／`dataCompleteness` 路徑的過期指標（`loanDataFreshness.ts`：`LOAN_DATA_STALE_THRESHOLD_DAYS = 30`、`isLoanDataStale()`、`deriveLoanDataFreshness()`；`LoanItem` 新增 `asOf` 欄位，金額欄位編輯自動同步；UI 於 `/tools/risk-center`「借款安全分析」卡片顯示過期提醒與「我已確認這筆資料仍正確」按鈕）。11 項相關測試（含 `householdLiquidityInputAdapter.test.ts` 第 24 項明文鎖定「軟警告不影響任何下游輸出」）已於原始 PR 建立，本次治理稽核重新執行 10 項確認 **10/10 pass**。詳見下方更新後的 **UR-TODO-041** 正式條目。

2026-08-15 **新增並正式標記 CLOSED：UR-TODO-063（首頁瘦身——移除投資健康度、狀態確認改為異常才顯示）。** 使用者與 ChatGPT 討論後認為首頁「投資健康度」「狀態確認」與其他頁面資訊重疊過高，違反「30 秒決策中心」產品原則，同日臨時發起、經 Repository 唯讀盤點確認並拍板執行。PR [#349](https://github.com/hyc640110/family-universal-rebalance/pull/349) 已正式 Merge（merge commit `ed1c3e4ea3883f56df7a57f6c180f38592fc8680`，一般 merge commit，未使用 admin override），為目前 `main`／`origin/main` 正式基線。移除「投資健康度」（`dashboard-health-card`）整個首頁區塊——其內容（`riskMetrics.overallLabel`／`allocationDeviation`／`thresholdReached`）已由 `/tools/risk-center`、`/tools/portfolio-risk` 提供更完整呈現，零資訊流失，兩個頁面本身未修改；「狀態確認」（`dashboard-reminders-card`）改為比照 `CreditCardDueSoonCard`（UR-TODO-060）既有「無項目回傳 `null`」慣例，無異常時整個區塊（時間列＋提醒清單＋投資機會連結）完全不渲染，有異常才顯示，`investmentDashboard.ts` 底層 reminders 計算邏輯未修改。唯讀盤點附帶確認：「狀態確認」原有四項檢查皆非唯一顯示入口，Repository 其他頁面皆有對應或更完整顯示，移除首頁呈現不影響使用者察覺能力；使用者原本擔心的「借款資料過期」「reconciliation 異常」經查證從未在首頁「狀態確認」出現過，與本次調整無關。Deploy GitHub Pages run [31884737628](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31884737628) success，headSha 與 merge commit 一致；Production 已唯讀確認首頁投資健康度已消失、狀態確認正確運作、其餘既有區塊不受影響，console 無錯誤。詳見下方 **UR-TODO-063** 正式條目。

2026-08-15 **新增並正式標記 CLOSED：UR-TODO-062（工具導覽「真實建議／假設模擬」分組標籤）。** 使用者於驗收 UR-TODO-058（三策略再平衡模擬比較）過程中，發現 4 個再平衡相關工具頁面（再平衡建議中心、CLEC 策略中心、配置模擬器、三策略模擬比較）混在同一工具導覽層級、未區分「真實建議」與「假設模擬」性質，同日臨時發起、盤點並完成開發。PR [#347](https://github.com/hyc640110/family-universal-rebalance/pull/347) 已正式 Merge（merge commit `b4aec0a1761817dd68fff79479cf56d9156af72b`，一般 merge commit，未使用 admin override），為目前 `main`／`origin/main` 正式基線。`ToolDefinition`（`toolNavigation.ts`）新增選用加法式欄位 `nature?: 'real-recommendation' | 'simulation'`，`ToolsPage.tsx` 卡片標題旁渲染對應徽章（藍色系＝真實建議、紫色系＝假設模擬，刻意避開既有 `.good`／`.bad` 綠紅語意色，不暗示優劣），兩個模擬類頁面既有「不是投資建議」提示區塊補上導向再平衡建議中心的明確連結。Deploy GitHub Pages run [31883336445](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31883336445) success，headSha 與 merge commit 一致；Production 已唯讀確認 `/#/tools` 頁面 4 張卡片正確顯示徽章、其餘工具不受影響，console 無錯誤。**同一輪對話中另以 Review Mode 唯讀盤點確認**：「權重差額 × 總市值」基礎公式（`target=total×weight%; diff=target−current`）目前於 Repository 內共被獨立實作 3 次（`rebalanceRecommendation.ts`／`rebalanceStrategyComparison.ts`／`AllocationSimulatorPage.tsx`），評估為低風險、已知技術債，暫不整合，此結論已記錄於 UR-TODO-062 正式條目附帶記錄段落，非獨立待辦。詳見下方 **UR-TODO-062** 正式條目。

2026-08-14 **治理同步：UR-TODO-054-A（Loan Confirmation UI）正式標記 CLOSED，UR-TODO-054 正式拆分為 054-A／054-B／054-C 三個子項，054-B（FX Confirmation UI）Contract Audit 判定 GO、狀態更新為「待開發」。** 054-A 已於 PR [#331](https://github.com/hyc640110/family-universal-rebalance/pull/331) 正式 Merge（merge commit `c87a9e933af9cd5e7d2fa31bcb301adfa10e7944`，parents `0097107e3f860009d00c4dfb8b83708ba4fef269`／`0184834b5da0b618ca44981b6e231a1b230c1791`，一般 merge commit，未使用 admin override；`mergedAt: 2026-08-14T13:24:48Z`、`mergedBy: hyc640110`），落地 Minimal Loan Repayment Producer、Loan Group Candidate Review、Confirm、Atomic Void、Reconfirm，並修正 `RuntimeAttributionProvenanceCard` 對 Loan derived component 錯誤暴露 component-level generic confirmation 按鈕的既有 UI safety 缺口；Deploy GitHub Pages run `31804595653` success，Production／Preview HTTP 200，`origin/main` 現為 `c87a9e933af9cd5e7d2fa31bcb301adfa10e7944`。開發過程中發現並修正兩項真實 Preview 阻斷 bug（confirm helper 回傳語意誤用、`canonicalCalendarDay()` 未保護呼叫的靜默失敗風險），詳見下方 UR-TODO-054-A 正式條目。**UR-TODO-054-B（FX Confirmation UI）Review Mode Contract Audit 已完成，正式判定 GO**：既有 FX confirm／void／reconfirm core contract（`confirmFxConversionAndAppend()`、`resolveActiveFxConversionGroups()`）已完整、已測試（130 個相關測試現況 0 fail），結構上比 Loan 更單純（一次確認只產生 1 筆 `fx-conversion` FinancialEvent，非多筆 component group，無需獨立 confirmationGroupId），且已確認**不需要**修改 `RuntimeAttributionProvenanceCard`（FX 沒有 Loan 式的 derived-evidence 洩漏路徑）；唯一需要開發階段特別注意的方向性差異是 `confirmFxConversionAndAppend()` 成功時 `result.events` 為**完整合併 Ledger**（與 Loan 相反，caller 須 replace 不得 append）。**Production FX Producer 維持 OFF、Preview 維持 ON，054-B 不修改 feature gate、不啟用 Production Producer**，FX Production Producer Enable 仍是獨立、需另行明確授權的 Controlled Rollout Policy 決策，不因 054-B 開發或完成而自動觸發。UR-TODO-054-C（Generic Split Confirmation UI）狀態維持「待規劃」，尚未進行 Contract Audit。詳見下方更新後的 **UR-TODO-054／054-A／054-B／054-C** 正式條目。

2026-08-14 **UR-TODO-046（淨值成長來源歸因與記錄／實際落差核對）正式結案，標記為 CLOSED。** Final Audit（Review Mode，唯讀盤點）確認核心 attribution／FinancialEvent／reconciliation／persistence／safety contract 全數完成（Ledger foundation、Investment 046-I1、Loan 046-L1、Generic Split 046-L2A/L2B、FX 全序列 A1-A3／F1A-F1D／F2A-F2D），FX-F2C-3（PR #328，merge commit `e27860db566c47a3d6c57716d79712a325ac8336`）與 FX-F2D（PR #329，merge commit `6ad9f5802165f0d1b78b4dd13a151584afcbf00f`）皆已正式 Merge／Production Verified，`origin/main` 現為 `6ad9f5802165f0d1b78b4dd13a151584afcbf00f`；`npm run test:ci` 重新確認 1047 tests pass（0 fail）。Production Producer 確認仍 OFF、Preview Producer 確認 ON（已於正式部署站點以真實瀏覽器操作雙向驗證）。剩餘項目（confirmation lifecycle UI、Loan／Investment delivery mapping、FX valuation attribution 等 future enhancement）已全數轉為獨立 Todo：**UR-TODO-054**（Attribution Confirmation Lifecycle UI）、**UR-TODO-055**（Loan／Investment Delivery Mapping）、**UR-TODO-056**（FX Enhancement Bundle），不再留在本 Todo 底下。PR #322 維持 Draft／OPEN，不阻擋本次結案。詳見下方更新後的 **UR-TODO-046** 正式條目與新增的 **UR-TODO-054／055／056**。

2026-08-14 **UR-TODO-046 FX-F2D Attribution Integration 開發完成，Draft PR 待 CI／Preview 驗收，尚未 Merge。** 前置：FX-F2C-3（PR #328，merge commit `e27860db566c47a3d6c57716d79712a325ac8336`）已正式 Merge／Production Verified，Preview Producer=ON、Production Producer=OFF。依 Repository Contract Audit（Review Mode）判定 **GO A — Single F2D Sprint**，讓已通過 F2B resolver 的 valid FX conversion 安全進入 attribution pipeline，principal contribution 恆為 0。核心設計：新增 `fx-conversion` FinancialEventType＋`ZERO_EFFECT_EVENT_TYPES` 收錄；新增 `FinancialEvent.fxConversionLink?`（`conversionId`＋兩腿 transactionId，`fxConversionIdentity.ts`）；**與 Loan／Generic Split 不同，FX 是「兩筆 transaction 合併成一個 event」而非「一筆拆成 N 個」，故只需 1 個 FinancialEvent**，重用既有 `appendFinancialEvent()` 單筆寫入路徑（新增 `fxConversionAttributionConfirmation.ts`）；`amount`/`currency`/`accountId`/`transactionId` 固定取 TWD 腿，天然落在既有 TWD-only ledger filter 內，無需修改該過濾器。`transactionReconciliation.ts` 的 `fxConversionLeg` guard 擴充為 valid+無 active confirmation→`candidate`（`fx-conversion-contract-candidate`）、已 confirmed→`matched`（`linked-fx-conversion`，兩腿共享同一 event，不產生兩筆獨立確認）、malformed 維持 `unsupported`。不進入既有 derived evidence 路徑（比照 Loan 先例）。Fee／FX valuation 明確排除本輪，已用測試鎖定兩者不與 conversion contribution 混算。F2C-2 `buildFxConversionDeletion()` 新增唯一必要連帶修改：confirmed conversion 阻擋 hard delete（新狀態 `confirmed-delete-blocked`），unconfirmed／voided 不變。F1D gate 未觸碰（仍 `true`）。Schema 維持 v3，新增回歸測試證明舊版 client fail-safe skip、v2 拒絕 v3-only 欄位。新增 31 個測試（`tests/fxConversionAttribution.test.ts`），並修正 2 項因本 Sprint 授權而過時的 F2B「零耦合」regression 斷言。`npm run test:ci` 由 1016 增至 **1047 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**明確不包含**：UI 觸發元件（延續 Loan 既有 scope，僅函式庫層級）、JPY/EUR、自動銀行匯入、自動配對、FX valuation decomposition、進階已實現匯兌損益、fee 推測、Production Producer enable、PR #322。UR-TODO-046 整體仍 OPEN，F2D 完成不代表已結案，需正式 Preview 環境驗收後另行確認。

2026-08-14 **UR-TODO-046 FX-F2C-3 Preview Producer Enable 開發完成，Draft PR 待正式 GitHub Pages Preview 部署與使用者驗收，尚未 Merge。** 前置：FX-F2C-2（PR #327，merge commit `b83b991e1bf79707c17ed7adc12b274b79f259b5`）已正式 Merge／Production Verified，Production／Preview Producer capability 皆確認為 OFF。本 Sprint 是使用者明確授權的 Controlled Rollout 執行動作，唯一 production code 改動為 `src/lib/fxOpaqueProducerGate.ts` 的 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 常數由 `false` 改為 `true`；`deriveFxOpaqueProducerCapability()` 的 `sourceGateEnabled && deploymentEnvironment === 'preview'` AND 邏輯逐字未動——因為該邏輯早已將 Production 排除在外，翻轉結果是 **Preview capability 首次變為 ON，Production capability 依既有 environment guard 繼續恆為 OFF**。`buildFxConversionCreation()`／`buildFxConversionDeletion()`／`FxConversionProducerForm.tsx`／`App.tsx` 既有 producer wiring 完全未修改。測試面更新 2 個因常數字面值變動而過時的既有斷言，新增 3 項 F2C-3 專屬鎖定測試（Preview ON、Production 仍 OFF、AND-logic 契約逐字未變），`npm run test:ci` 由 1014 增至 **1016 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。本機隔離 build 驗證（依既有 GitHub Pages 子路徑結構本機掛載 `dist/`／`dist-preview/`，headless Chromium 操作，非正式部署）：Production 表單完全不出現；Preview 表單完整可見並完成 TWD→USD／USD→TWD 雙方向真實建立（cash-flow 排除、double-submit guard、ordinary delete guard、atomic delete、reload persistence、JSON Backup 匯出／於獨立 profile 匯入還原後 F2B resolver 仍 valid、390px 無水平溢出）皆已驗證通過。**明確不包含**：Production Producer enable、移除 `deploymentEnvironment === 'preview'` guard、`fxConversionAttribution`、`FinancialEvent` FX 接線、reconciliation `candidate`／`matched`、zero-effect attribution、grouped transaction row、新 transaction type、`transfer` 語意修改、CSV／Import Center、JPY／EUR、persistence architecture 修改、schema migration、Loan／Investment／Generic Split／Household Liquidity／AI Decision／Rebalance／Firebase／Worker 修改、PR #322。正式 GitHub Pages Preview 部署與使用者驗收仍待 Draft PR 建立後另行執行；正式 Preview 驗收 PASS 是 F2D（`fxConversionAttribution`／`FinancialEvent` FX 接線）開始前的必要 Gate，本 Sprint 不代表 Production unlock 已授權、也不代表 F2D 已開始。UR-TODO-046 整體仍 OPEN。

2026-08-14 **UR-TODO-046 FX-F2C-2 Manual FX Conversion Producer 已正式完成／Merge／Production Verified。** PR [#327](https://github.com/hyc640110/family-universal-rebalance/pull/327) 正常 Merge，merge commit `b83b991e1bf79707c17ed7adc12b274b79f259b5`（parents：`44fb3afb126b1d647e2b90caa2d6da6a88f9493b`、`fd2ad473f539f9dce59953d196476a42bd498da4`；未使用 admin override）；PR CI Verification `31721452155` success；Merge 後 Deploy GitHub Pages run `31754065390` success，head 與 merge commit 一致。Producer 程式碼與 UI（`buildFxConversionCreation()`／`buildFxConversionDeletion()`／`FxConversionProducerForm.tsx`）已正式存在於 `main`，但 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 仍為 `false`，Production／Preview 雙層 gate（UI＋write path）確認持續阻擋，尚未建立任何一筆真正的 FX conversion。詳細設計見下方 F2C-2 開發完成當時的條目。UR-TODO-046 整體仍 OPEN；FX-F2C-3（Preview Producer Enable）已接續完成（見上）。

2026-08-13 **UR-TODO-046 FX-F1A Transaction Opaque Compatibility Foundation 開發完成，Draft PR 待 CI／Preview／使用者驗收，尚未 Merge。** 依 ChatGPT 架構審查後拍板的 FX-F1 / FX-F1A 系列規劃（Repository contract audit → identity foundation design → pre-implementation gate audit，皆為 Review Mode，未寫入本文件因無程式異動）之後，本輪正式建立 Transaction 層的 mixed-version persistence compatibility capability——不是 FX 功能本身，是讓未來任何 `FinancialTransaction` 新經濟語意（含未來的 FX conversion）都能安全導入的地基。新增明確 discriminator `OpaqueFinancialTransactionEnvelope`（`transactionOpaqueEnvelopeVersion: 1`＋`id`＋不解讀的 `payload`），`normalizeTransactions()` 明確三分：已知合法交易照舊行為、明確 opaque marker 的記錄原樣保留、格式錯誤（含 marker 本身格式錯誤）一律 skipped 而非誤判成 opaque。`AppState` 新增加法式必要欄位 `opaqueTransactions`（與既有 `transactions` 分開，consumer 端零 blast radius——`deriveTransactionAccountBalances`／`transactionCashFlowSummary`／Household Liquidity／Reconciliation 等現有函式簽名與行為完全不變，opaque 記錄在型別層級就無法被這些函式讀到），但在 localStorage／JSON Backup 的**原始 JSON 上仍只有單一 `transactions` 欄位**（`serializeTransactionCollection()` 在持久化邊界把兩者合併回同一個陣列，`normalizeState()` 重新正規化時同時讀取 `r.transactions` 與 `r.opaqueTransactions` 兩種來源以避免二次正規化遺失資料）——不新增第二套 store、不另開 localStorage key。UI 新增最小 unsupported placeholder（無收入/支出徽章、無普通 Edit、僅提供需明確 `window.confirm()` 不可逆警告的刪除）。`TRANSACTION_SCHEMA_VERSION` 維持 `2` 不變（未做無 runtime 效果的假 bump）。新增 17 個測試（`tests/transactionOpaqueCompatibility.test.ts` 11 項涵蓋 known/opaque/malformed 三分、duplicate id、idempotency、producer isolation、localStorage／Backup round-trip、unrelated edit/create 隔離；`tests/transactionOpaquePlaceholderUi.test.ts` 6 項鎖定 UI 文案與行為邊界），`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功。隔離本機 dev server 實機驗證：opaque 交易正確顯示 placeholder、無普通編輯/徽章、刪除經 `window.confirm()` 攔截後正確保持未刪除、reload 後 localStorage 原始 JSON 確認僅有單一 `transactions` 欄位且已知與 opaque 記錄正確合併、390px 無水平溢出、console 全程無錯誤。**明確不包含**：`fxConversionAttribution`、第一筆 FX transaction、FX identity／pairing、FX taxonomy、Household Liquidity／AI Decision／Rebalance／FinancialEvent Ledger／Generic Split／Investment／Loan 修改。依規劃，FX-F1B（taxonomy／consumer guard 設計）須等本 Sprint 完成 Preview 驗收、Merge、Production 部署、Production capability 驗證後才可開始，不得與本 PR 合併同一個 Sprint。UR-TODO-046 整體仍 OPEN。

2026-08-13 **UR-TODO-046 FX-A2 CBC USD/TWD Provider Adapter 已完成／Merge／Production Worker Deployed／Production Verified。** PR [#318](https://github.com/hyc640110/family-universal-rebalance/pull/318) 正常 Merge，merge commit `3341dfd81e7c1e57fe5d325e85c6303bc5d3b358`；PR CI Verification `31615645452` success，Merge 後 Deploy GitHub Pages `31616344290` success，head 與 merge commit 一致。Production Worker `family-universal-rebalance-market-data-production` 已於 `2026-08-12T16:17:13.176Z` 部署 version `7d4221c1-691f-42e4-b1ae-0a48e40603ba`；Production `/health` HTTP 200、`environment=production`。`/fx-rates/usd-twd?refresh=1` HTTP 200，normalized `status=available`、USD→TWD、`rateDate=2026-08-12`、`quotePerBase=32.246`，與 CBC 官方 `FTDOpenData_Day` 的 `NTD_USD` 一致；不回傳 raw CBC rows 且為 `cache-control: no-store`。Preview Worker `b83bc7f0-3f7d-4bb3-9093-93a0b256ba44` 維持 preview isolation，Production／Preview Pages 均 HTTP 200、metadata 正確、assets 隔離正常。FX-A2 完成 CBC parser／provider adapter、Worker endpoint、前端 callable adapter、`fxRateHistory` deterministic append、same-day conflict fail-safe 與 Preview／Production Worker isolation；無 schema／Backup version bump、migration 或 legacy rewrite。**仍不包含** foreign-cash totals 或 snapshot producer、valuation UI、FX attribution、realized FX、conversion、foreign investment／loan、FinancialEvent／Ledger／Generic Split FX consumer、Household Liquidity、AI Decision 或 Rebalance。UR-TODO-046 整體仍為部分完成／OPEN；FX-A3 尚未開始。

2026-08-12 **UR-TODO-046 FX-A1 USD/TWD Rate Provenance & Foreign Cash Valuation Foundation 已完成／Merge／Production Verified。** PR [#316](https://github.com/hyc640110/family-universal-rebalance/pull/316) 正常 Merge，merge commit `62a5a9a8ed269bbac9d6e9370c524356cd3fa5e0`（parents：`98cd44ed2493594b1b67dc22e93f7b55345b2090`、`0c4da369449eea1d20d70b4767bdcba1bcb23002`；`mergedAt: 2026-08-12T15:21:56Z`；`mergedBy: hyc640110`；未使用 admin override）。PR CI Verification `31610595323` success；Preview workflow_dispatch `31611211649` success，head 為 `0c4da369449eea1d20d70b4767bdcba1bcb23002`；Merge 後 Deploy GitHub Pages `31611895289` success，head 與 merge commit 一致，Production／Preview HTTP 200、metadata 正確、assets 隔離正常。本 Sprint 完成 USD→TWD foreign cash valuation 的 provider-independent foundation：canonical `quotePerBase` direction（1 USD = N TWD）、`reference-close`、最多 3 日 carry-forward、missing／stale／unsupported fail-safe、`fxRateHistory` 加法式持久化與新 snapshot optional pinned `fxValuations` provenance。localStorage／JSON Backup round-trip、legacy snapshot 可讀與 pinned result 不受後續 rate revision 影響皆已驗證。FX-A1 本身不包含 live provider／Central Bank API integration、Worker、UI、foreign cash valuation producer/source integration、USD 自動計入既有 account／net-worth totals、FX attribution evidence、conversion／execution rate／fee／spread、realized FX、foreign investment、foreign loan、FinancialEvent／Ledger／Generic Split FX consumer、Household Liquidity、AI Decision、Rebalance、migration 或歷史 snapshot rewrite；provider／Worker 已由後續 FX-A2 獨立完成。非 TWD Ledger／derived evidence 的既有 fail-safe 排除不變；UR-TODO-046 整體仍為部分完成／OPEN。

2026-08-10 **UR-TODO-046-L2A Split Allocation Contract Audit 與 UR-TODO-046-L2B Generic Split Allocation Foundation 正式標記為已完成**。PR [#296](https://github.com/hyc640110/family-universal-rebalance/pull/296) 已由使用者 Merge，merge commit `a355a3986f45f7bd15b61bc1d3f93f06ad633a41`（`mergedAt: 2026-08-10T12:23:50Z`、`mergedBy: hyc640110`）；PR CI Verification／`verify` run `31386340292` success，Merge 後 Deploy GitHub Pages run `31387817114` success，Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 均可載入。L2A 完成 schema boundary 與 Atomic Group contract 的唯讀實證；L2B 將 FinancialEvent schema 升至 v3，generic split 以 Atomic Group 持久化於 FinancialEvent Ledger（唯一 persistent SSOT），僅完整、有效、amount-conserving group 可參與 attribution／group-to-transaction reconciliation。任一 component Void 令 whole group invalid；correction 只允許 forward-only 的 Void old group → complete replacement group，replacement 必須使用新的 allocationGroupId 與 event ids。v2 runtime 對 v3 Ledger 維持 opaque preservation／no-runtime-consumption；v2/v3 Firebase mixed-version merge、event-id collision different payload 均 fail-safe reject；partial Firebase union 在完整前不得 attribution。Loan L1 principal／interest／fee／penalty semantics 未改變。本次不含 UI、CSV、Import Center、Investment／FX consumer、Loan UI wiring、AI Decision、Rebalance、Dashboard、historical migration 或 existing FinancialEvent 自動轉換。**UR-TODO-046 整體仍為部分完成**；後續只保留 FX attribution、Loan UI／CSV／Import Center 與其他尚未授權 consumer mapping，均須另行唯讀盤點、產品決策與授權，不得自動開始。

2026-08-08 **UR-TODO-053（趨勢圖改為「相對今日淨資產」基準線填色）正式標記為已完成**。已由使用者手動指示 Merge [PR #290](https://github.com/hyc640110/family-universal-rebalance/pull/290)（`feat/trend-chart-baseline-relative-fill`），merge commit `8d8dddf`，為目前 `main`／`origin/main` 正式基線。取代 UR-TODO-027 已完成的「逐段漲跌」填色邏輯（不是新增並存），改為新增一條固定在「今日淨資產／今日{title}」高度的水平基準線，折線高於基準線紅色、低於綠色。唯讀盤點確認 `monotoneSegments()`／`monotonePath` 曲線計算可完全重用，並驗證既有時間範圍篩選函式保證陣列最後一筆永遠是最新資料，基準線可安全固定為絕對值不隨範圍切換改變。使用者決策：交叉點計算採線性插值、基準線加淡色虛線＋「今日」文字標示、文案採「以今日{title}為基準：...」放在圖表下方。開發中發現 `TrendChart` 為淨資產／投資資產共用元件，已改用 `title` prop 動態組字避免文案誤植。**首次 Preview 驗收發現真實 Bug 並已修正**：30 天視圖中明顯低於基準線的一段完全沒有綠色填色（高於基準線的紅色正常）。直接檢視渲染後 SVG DOM 確認根因（非猜測）：`up`／`down` 兩個方向的 `<linearGradient>` 誤共用同一組 `y1`／`y2` 座標範圍（`top`→`refY`），紅色區塊的像素座標剛好完全落在此範圍內、綠色區塊則明顯超出，SVG 預設 `spreadMethod="pad"` 讓超出範圍的部分沿用最後一個 stop 的顏色（全透明），導致綠色填色路徑幾何正確但畫面全透明。修正：`down` 漸層改用 `height-bottom`→`refY`（與 `up` 的 `top`→`refY` 對稱），新增迴歸測試直接斷言每個方向的漸層範圍必須完整涵蓋該方向填色路徑的座標範圍。`tests/trendChartGradientArea.test.ts` 因語意完全改變全數改寫並新增迴歸測試（7→11 個測試）。868 tests pass，`npx tsc -b`、Production／Preview build 皆成功；隔離本機 dev server 實機驗證兩種圖表文案、紅綠填色（含明顯低於基準線的低谷）皆正確渲染。詳見下方 **UR-TODO-053** 正式條目。

2026-08-08 **UR-TODO-051（交易匯入中心「撤銷」按鈕失敗時完全靜默無回饋）正式標記為已完成**。已由使用者手動 Merge [PR #282](https://github.com/hyc640110/family-universal-rebalance/pull/282)（`fix/ur-todo-051-import-rollback-feedback`），merge commit `9a2c5df68ecd6f462a5f4311ac89f1dec822f058`，為目前 `main`／`origin/main` 正式基線。開發前唯讀盤點確認：`rollbackImport` 除既有兩項限制（交易被編輯過、交易已被逐筆刪除）外無其他失敗情況；「回傳值被吞掉」的說法不準確，架構上 `rollbackImport` 與呼叫端 `onRollback` prop 原本就是 `void`，從未存在可回傳的結果。修復：新增純函式 `evaluateRollbackImport()` 把判斷邏輯（維持原有語意不變）抽出成可測試、回傳明確結果的獨立函式；`rollbackImport` 改為先同步取得結果（`stateRef.current` 由自訂 `setState` wrapper 同步維護，無 UR-TODO-049 那類時序風險），只有成功才實際搬移資料；`ImportCenter.tsx` 新增 `rollbackFeedback` state，沿用既有 `Feedback`／`FeedbackLine` 慣例，成功與兩種失敗原因（已編輯／已被逐筆刪除）皆有明確區分的訊息。新增 7 項測試（純函式 4 項＋jsdom 真實渲染點擊驗證畫面文字 3 項），已驗證在修復前的程式碼上會失敗、修復後通過。`npx tsc -b`、`npm run test:ci`（832 項全數通過）、Production／Preview build 皆成功；依 UR-TODO-050 方案 B 新流程，Claude Code 先觸發 `workflow_dispatch` 刷新 Preview，使用者於 Preview 以真實裝置（桌機＋手機）驗收通過後直接指示 Merge。因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後觸發的 push 部署（run `31202822196`）成功；Production／Preview `curl` 實測皆 `HTTP 200`。**UR-TODO-049、UR-TODO-050、UR-TODO-051 三項（同一次「正式批次匯入已選列」二次確認機制唯讀盤點所發現的關聯問題）至此全數結案。** 詳見下方更新後的 **UR-TODO-051** 正式條目。

2026-08-08 **UR-TODO-049（交易匯入中心匯入預覽勾選框點擊觸發 ErrorBoundary crash）正式標記為已完成**。已由使用者手動 Merge [PR #280](https://github.com/hyc640110/family-universal-rebalance/pull/280)（`fix/ur-todo-049-import-checkbox-stale-event`），merge commit `685c2a6ccc89902bd65f9d618533c1899d760496`，為目前 `main`／`origin/main` 正式基線。開發前唯讀盤點以 jsdom＋`react-dom/client` 真實重現原本的 crash（原生 `.click()`，非程式化 `dispatchEvent`），確認使用者提出的成因假設（`event.currentTarget` 在延遲執行的 `setPreview` updater 內已失效）為真正根因；全庫搜尋確認 `src/` 內僅此一處有相同風險模式，無需回報其他檔案。修復：`onChange` handler 改為先同步擷取 `checked` 區域變數，再於 updater 內使用，不再於 updater 內存取 `event`。新增 `jsdom` devDependency（專案先前完全無 DOM 測試基礎設施，經評估認定唯有真實 DOM 才能誠實驗證此類時序缺陷，使用者已明確同意此範圍擴充）與 `tests/importCenterCheckboxRealClick.test.ts`，已驗證此測試在修復前的程式碼上確實失敗（拋出與 Production 完全相同的錯誤）、修復後通過。`npx tsc -b`、`npm run test:ci`（825 項全數通過）、Production／Preview build 皆成功；隔離本機 dev server 桌機 1280px＋手機 390px 以真實原生 `.click()` 連續切換多列勾選框驗證不再崩潰、狀態正確、無橫向溢出。依 UR-TODO-050 方案 B 新流程，Claude Code 先觸發一次 `workflow_dispatch` 刷新 Preview，使用者於 Preview 以真實裝置驗收通過後直接指示 Merge。因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後觸發的 push 部署完整成功，正確沿用剛才那次 `workflow_dispatch` 的 Preview 內容（UR-TODO-050 reuse 邏輯的第三次連續成功驗證）；Production／Preview `curl` 實測皆 `HTTP 200`。詳見下方更新後的 **UR-TODO-049** 正式條目。

2026-08-07 **UR-TODO-050（`deploy.yml` Preview 部署 race condition）方案 B 正式標記為已完成，含一次真實部署失敗與熱修的完整記錄**。已由使用者手動 Merge [PR #277](https://github.com/hyc640110/family-universal-rebalance/pull/277)（`infra/ur-todo-050-preview-race-condition-fix`，merge commit `702c0a1daa1faaf0f36f0a968aa75d5bc1a529d7`）。**核心設計**：`actions/deploy-pages` 每次都會完整取代整個網站（無 partial update），所以「push 到 main 不重建 Preview」不能只是跳過建置步驟（否則下次 push 部署的 artifact 會完全不含 `/preview/`，變 404 而非「維持原樣」）；改為 `push` 事件不重建 Preview，改下載最近一次成功 `workflow_dispatch` run 的 Pages artifact、取出 `preview/` 資料夾原封不動沿用，完全找不到先前 dispatch 記錄時才 fallback 鏡射 main。**PR #277 Merge 後第一次真實 push 部署（run `31196093740`）實際失敗**：`gh run list` 因無法自動偵測 repo（該步驟 cwd 是從未 checkout 過的 workspace 根目錄）而報錯，導致整個 build job 失敗、Production 該次未更新（僅暫時停留在上一 commit，全程可正常瀏覽、無使用者可見中斷）。依使用者「下一次 main push 主動回報」的指示立即回報並修正：[PR #278](https://github.com/hyc640110/family-universal-rebalance/pull/278) 熱修加上明確 `--repo` 旗標，並讓 reuse 路徑全程 `continue-on-error`、fallback 判斷改為直接檢查 `combined/preview/index.html` 是否存在，確保 reuse 輔助路徑永遠不可能再拖垮 Production 部署。PR #278 Merge 後的 push 部署（run `31196710309`）完整成功，Production／Preview 皆確認正確更新／維持不變。**語意變化**：往後驗收 PR 前都需要先手動（或請 Claude Code）觸發一次 `workflow_dispatch`，Preview 才會反映該 PR 內容；日常 main push 不會再意外覆蓋正在驗收中的 Preview。因 repo 僅一名協作者、branch protection 需要審核人數，兩支 PR 皆由 Claude Code 執行 `gh pr merge --admin`（已於每次使用時明確告知使用者）。詳見下方更新後的 **UR-TODO-050** 正式條目。

2026-08-07 **UR-TODO-052（移除首頁頂部行銷文案區塊與收合按鈕）正式標記為已完成**。已由使用者手動 Merge [PR #275](https://github.com/hyc640110/family-universal-rebalance/pull/275)（`feat/ur-todo-052-remove-hero-marketing-block`），merge commit `92bb4f17b6b579b5023c72833aec77ff5d30bc5a`，為目前 `main`／`origin/main` 正式基線。使用者提供首頁截圖，紅框標示希望移除「收合」按鈕（帶眼睛圖示）與其下方行銷文案區塊（「家庭多資產配置管理」／「即時股價｜動態再平衡｜Firebase 雲端同步」／「Build time: unavailable」）。開發前唯讀盤點確認：`CollapseEyeIcon` 為全站共用元件（19＋3 個其他呼叫點），本次僅移除 `App.tsx` 這一個呼叫點，元件本體不觸碰；`APP_SUBTITLE` 全庫僅此處讀取，`APP_VERSION`／`APP_NAME`／`APP_BUILD_TIME`／`APP_GIT_COMMIT` 皆在側欄與「版本與除錯」設定區塊獨立顯示、不受影響；`showHeroInfo` state 僅此處使用。範圍：`src/App.tsx` 移除 hero 標頭「關於／收合」切換按鈕與 `.hero-info` 行銷文案區塊；`src/styles.css` 清理對應死 CSS（`.hero-info-toggle`、`.hero-info`、`.build-info`）；「更新股價／下載／上傳」三顆按鈕與其容器完全不變。`npx tsc -b`、`npm run test:ci`（824 項全數通過）、Production／Preview build 皆成功；Preview 部署後使用者以真實裝置（桌機＋手機）驗收通過，直接指示 Merge。因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。`Deploy GitHub Pages` run `31194237652` success，headSha 與 merge commit 一致；Production `curl` 實測 `HTTP 200`，`deployment-environment` metadata 為 `production`。詳見下方更新後的 **UR-TODO-052** 正式條目。

2026-08-07 **UR-TODO-030（首頁 30 秒決策中心精簡）正式標記為已完成，並新增 UR-TODO-050（`deploy.yml` Preview 部署會被非相關 main push 覆蓋，race condition）**。已由使用者手動 Merge [PR #268](https://github.com/hyc640110/family-universal-rebalance/pull/268)（`feat/ur-todo-030-homepage-simplification`），merge commit `cd89ad1c4ee17d23597f3a00e63c2acb1262cfb9`，為目前 `main`／`origin/main` 正式基線。**範圍**：依既有唯讀盤點與使用者逐項拍板的決策實作——Hero 標頭收合（App 名稱／版號／副標／Build time 收合在「關於」按鈕後，更新股價／下載／上傳三顆按鈕不受影響）；「今日投資狀態」採方案 B，首頁只保留整體狀態徽章＋摘要句＋今日建議結論標題，「每日判斷流程步驟」與「值得查看的機會」移到既有投資行動中心（`/tools/investment-action-center`，本來就是同一組 `dailyDecisionWorkflow`／`investmentOpportunities` 資料的另一種呈現，非新開發），4 格統計中「今日投資狀態」（與資產總覽今日損益重複）直接移除，「資料品質」拆解為投資組合風險與配置中心（品質問題部分，本來就已顯示）＋首頁狀態確認區塊（報價狀態部分），「市場資料」彙總句直接移除、市場頁維持現狀，「股息摘要」直接移除、股息中心本來就有完整對應內容；「資產與今日表現」精簡為總資產／淨資產／今日損益／今日損益率 4 格，本月／年度資產變動移除、改以淨資產歷史頁（read-time boundary 版本）為權威來源；「投資健康度」改為 1 行摘要＋「查看風險中心」連結（風險中心已完整涵蓋原 8 格內容，與分析頁防守配置狀態卡片欄位不同，不重複）；原「重要提醒」更名為「狀態確認」，合併 quotes／sync／rebalance 三類提醒（不再過濾）、最後股價更新、資料同步提醒文字、投資機會數量＋連結（輕量指標而非重複顯示完整卡片）。附帶移除 4 個因本次重構變成孤兒的呈現層元件（`InvestmentIntelligenceSummary.tsx`、`DailyDecisionWorkflow.tsx` 元件、`InvestmentOpportunityList.tsx`、`InvestmentOpportunityCard.tsx`，皆非 `src/lib/dailyDecisionWorkflow.ts` 資料層），同步更新 6 個相關特徵測試檔與 `scripts/stability-check.mjs` 內對「重要提醒」文案的過時斷言。`npx tsc -b`、`npm run test:ci` 全數通過，Production／Preview `vite build` 皆成功。**Preview 驗收過程中發現並排除一次部署層級的干擾**：`workflow_dispatch` 首次因 `github-pages` Environment 的 Deployment branch policy 只允許 `main`／`gh-pages` 兩個分支，被擋下 3 次（皆為 `build` job 成功、`deploy` job 因 Environment 分支政策被拒絕，非程式碼問題），使用者於 GitHub 網頁新增 `feat/*`／`fix/*`／`hotfix/*`／`docs/*`／`infra/*` 五條規則（對齊 `007_GIT_WORKFLOW.md` §4 既有 Branch 命名慣例）後即成功部署；成功部署後又被兩支不相干 PR（#270、#271）merge 到 main 觸發的 push 部署覆蓋 `/preview/`（詳見下方 **UR-TODO-050**），重新以 `workflow_dispatch` 部署後使用者於 Preview 實機驗收通過（桌機＋390px）。因 repo 僅一名協作者、branch protection 需要審核人數，使用者於 Preview 驗收確認無問題後直接指示 Merge，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。詳見下方更新後的 **UR-TODO-030**、新增的 **UR-TODO-050** 正式條目。

2026-08-07 **治理落差補記：新增 UR-TODO-051（匯入「撤銷」按鈕撤銷失敗時靜默無回饋）**。此為 PR #270 開發前唯讀盤點時就已發現、使用者當下明確指示「另開 Todo 之後處理」的項目，先前僅記錄於 `003_CURRENT_STATUS.md`／`008_TODO_BACKLOG.md` 的完成摘要文字中（「明確不包含」段落），未正式建立獨立 UR-TODO 條目，本次於使用者要求盤點目前待辦事項時發現此落差並補齊。**原暫定編號 UR-TODO-050 與並行進行的另一份治理同步（PR #268／#272，`deploy.yml` Preview 部署 race condition）撞號，已改用下一個可用編號 UR-TODO-051，避免覆蓋既有 UR-TODO-050 條目。** 狀態「待評估」，與 UR-TODO-049（同一次盤點發現的另一個獨立問題——匯入預覽勾選框 crash）互不相關，不應合併處理。未修改 `src/`、`tests/`。

2026-08-07 **交易匯入中心「正式批次匯入已選列」二次確認機制正式標記為已完成，並新增 UR-TODO-049（匯入預覽勾選框 crash）**。已由使用者手動 Merge [PR #270](https://github.com/hyc640110/family-universal-rebalance/pull/270)（`fix/import-center-commit-confirm`），merge commit `642c1a60ec3a7e203878440ebe24a5ad7104bb29`，為目前 `main`／`origin/main` 正式基線。**背景**：唯讀盤點確認「正式批次匯入已選列」是交易匯入中心唯一沒有二次確認的批次寫入動作，點下去立刻寫入 `state.transactions`，且既有「撤銷」機制有真實限制——只要匯入後任一筆交易被編輯過，`rollbackImport` 會靜默擋下整批撤銷，沒有時效限制但可被單一筆編輯永久鎖死。**範圍**：`commit()`（`src/components/import/ImportCenter.tsx`）新增 `window.confirm()` 二次確認，文字明確帶出實際會寫入的筆數（以 `createImportTransactions(...).length` 而非 `preview.length` 計算，避免與未勾選／錯誤列混計）、目標帳戶名稱、以及撤銷的真實限制；取消時顯示「已取消匯入，尚未寫入任何交易。」（沿用既有 `savePreset`／`importBackup` 的 cancelled-tone feedback 慣例）；按鈕在可寫入列數為 0 時（全部取消勾選或皆為錯誤／重複列）直接 `disabled`，避免產生一筆 `importedRows: 0` 的空匯入紀錄。新增 5 個測試（`tests/importCenterCommitConfirmation.test.ts`），`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功；隔離本機 dev server 實機驗證（桌機 1280px＋手機 390px）：確認視窗文字精確符合預期、取消與接受兩條路徑皆正確（取消不寫入、接受後正確寫入且可撤銷）、0 筆時按鈕確認 `disabled: true`、390px 無橫向溢出、console 全程無新增錯誤。**明確不包含**：「撤銷」按鈕本身在撤銷失敗時完全靜默無回饋的既有缺口（獨立問題，維持「待評估」，未來另行處理）。**驗收過程中意外發現一個與本次變更完全無關的既有 Bug**（唯讀確認 `main` 分支在本次變更前就已存在、本次全程未觸碰）：以真實瀏覽器點擊（非程式化事件）取消勾選匯入預覽列會觸發 `TypeError: Cannot read properties of null (reading 'checked')`，被 `ErrorBoundary` 攔截導致畫面整個被錯誤畫面取代，已新增 **UR-TODO-049** 記錄重現步驟與初步懷疑方向，供之後排入；本次未修復、未觸碰任何相關程式碼。因 repo 僅一名協作者、branch protection 需要審核人數，使用者於 Preview 驗收確認無問題後直接指示 Merge，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。

2026-08-07 **「隱藏金額」功能回退＋操作回饋一致性連續修正（非既有 UR-TODO 編號，由使用者直接下達指令）正式標記為已完成，使用者已於真機完成最終覆核並確認**。PR #260～#267 已由使用者手動指示／授權 Merge，`main`／`origin/main` 正式基線推進至 `9dd703f`。完整內容詳見 `003_CURRENT_STATUS.md` 最上方條目。摘要：
- 回退 PR #257「隱藏金額」功能（使用者確認不需要）。
- 修正 `exportBackup`／`importBackup`／`resetState` 回饋訊息被 `syncStatusText` 優先權邏輯靜默覆蓋的真實 Bug。
- 統一按鈕視覺、ImportCenter 六個動作點新增成功/失敗/取消回饋、交易列按鈕靠右對齊。
- 按鈕高度不一致問題三輪排查，最終根因為「匯入 JSON 備份」原本是 `<label>` 包 `<input>`，與另兩顆 `<button>` 元素種類不同（非 CSS 屬性問題），已改為真正 `<button>` 觸發隱藏 input。**使用者已於真機（Production）確認三顆按鈕高度完全一致，問題徹底解決。**
- **基礎設施變更**：GitHub Pages 部署機制已從 legacy 分支建置改為 Actions-based（`actions/deploy-pages`），因 legacy 系統於本輪連續故障（建置失敗、卡死不動）。**未來若 Production／Preview 長時間未反映最新部署，應先查 `gh api repos/hyc640110/family-universal-rebalance/pages` 的 `build_type` 是否仍為 `workflow`、以及最近一次 `Deploy GitHub Pages` run 是否成功，不應假設是舊有 legacy 建置故障重演。**
- **本輪工作正式結案，無殘留待辦。**

**方法論教訓（供未來類似「自動化測試一致、真機不一致」情境參考）**：連續多輪 CSS 屬性層面修正（font-size、appearance、em 相對 height）在桌機與所有自動化檢查中皆顯示 `getComputedStyle()` 完全一致，但真機持續出現差異，且「哪個元素有問題」在使用者早期回報中一度被誤認為輪替（後經使用者更正，實際上從未輪替）。真正根因是被比較的元素底層 HTML 種類本身不同（`<button>` vs `<label>` 包 `<input>`）。**教訓：跨元素種類的視覺對齊問題，若 CSS 數值調整無法在真機收斂，應優先檢查 DOM 元素種類是否本身不同，而非持續在屬性數值上打轉。**

2026-08-05 **UR-TODO-046-C3C-C（Financial Event Ledger 寫入／持久化，歸因確認）正式標記為已完成**。PR [#255](https://github.com/hyc640110/family-universal-rebalance/pull/255)（`feat/ur-todo-046-c3c-c-ledger-write`）已由使用者手動 Merge，merge commit `b424eb42da80fb7d7d1e53a49eddb656cd8553aa`，`mergedAt: 2026-08-05T13:26:13Z`，為目前 `main`／`origin/main` 正式基線。將 C3C-B 的 session-only「標示為合理」正式落地為 `FinancialEvent`：`FinancialEventSource` 加法式擴充新增 `'attribution-confirmation'`（刻意不 bump schema version，理由詳見下方 UR-TODO-046 條目與程式碼註解——bump 會讓所有既有使用者的空 Ledger 被誤判版本不符、永久擋下 Firebase 下載）；新增 `createFinancialEventId()`、`appendFinancialEvent()` forward-only 寫入防呆、`runtimeAttributionConfirmation.ts` 轉換函式（重用既有 taxonomy 驗證）。**開發中發現並修正一個必要連帶缺口**：`transactionReconciliation.ts` 的 `isEventForTransaction()` 原本只認 `'linked-transaction'`，已修正為同時接受 `'attribution-confirmation'`，避免新確認事件與衍生證據對同一筆交易雙重計算。UI 新增獨立於 C3C-B toggle 的「確認並正式記帳」按鈕（視覺明顯區隔），沿用既有 `window.confirm()` 不可逆動作慣例。新增 26 個測試，`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功；`Deploy GitHub Pages` run `31010188315` success，headSha 與 merge commit 一致；Production／Preview `curl` 皆 HTTP 200。**明確不包含**：撤銷／void、批次確認、Firebase Ledger sync、任何核心 attribution 公式變更；三者皆維持既有已知缺口，非新發現。**UR-TODO-046 整體仍未完成**：撤銷／void、Firebase Ledger sync、split allocation、investment buy／sell attribution、loan principal／interest attribution、FX attribution 仍待未來獨立排程與產品決策，皆屬重大事件，不得自動開始。詳見下方更新後的 **UR-TODO-046** 正式條目。

2026-08-12 **UR-TODO-001 Firebase Retirement 正式完成／CLOSED**。P3-B2-A～P3-B3-C 已全數 Merge，PR [#314](https://github.com/hyc640110/family-universal-rebalance/pull/314) merge commit 為 `54bd6794c0ac8ec1704c979cdb7e56e81818de32`。現行 Firebase Auth、RTDB GET／PUT、token refresh、upload/download UI、remote Ledger merge、Firebase SDK dependency 與 active Firebase environment naming 均為 0；localStorage 是 canonical device persistence，JSON Backup 是人工備份／裝置搬移，Financial Event Ledger 與 `mergeFinancialEventLedgers()` 保持 KEEP。P4 採 Archived Retirement：RTDB Rules deny-all、Anonymous Auth disabled，受控 archive/hash evidence 已驗證；Firebase Project、RTDB historical data、19 個歷史 anonymous users、Web App registration 均保留。未來破壞性清理僅為 optional housekeeping，須另行授權，非 UR-TODO-001 blocker。

2026-08-05 **UR-TODO-001（Firebase Realtime Database Security Rules Expiry）正式標記為已完成**。PR [#252](https://github.com/hyc640110/family-universal-rebalance/pull/252)（`feat/ur-todo-001-firebase-anonymous-auth`）已由使用者手動 Merge，merge commit `2a038802aac1a345f5be2a5100913142d42d23a4`，`mergedAt: 2026-08-05T08:22:26Z`。**治理落差更正**：本文件先前記錄的 Firebase 專案資訊「`my-00662`／`my-00662-default-rtdb`」為錯誤記載，正確專案為 **`l-pro-web-app`**（`databaseURL: https://l-pro-web-app-default-rtdb.asia-southeast1.firebasedatabase.app`），已於本次一併更正下方 UR-TODO-001 正式條目內容；Console 端專案本來就是 `l-pro-web-app`，僅治理文件記錄有誤，未變更任何實際 Firebase 設定。**正式解法**：新增純 REST（非 `firebase` SDK）Firebase Anonymous Authentication，維持既有 raw `fetch()` 架構不變——`src/lib/firebaseAnonymousAuth.ts` 直接呼叫 Identity Toolkit／Secure Token API，App 啟動時背景自動建立或更新匿名 session（可注入依賴的純函式，含 session 新鮮度判斷、reuse／refresh／fallback-signup 分支）；`src/lib/environmentBoundary.ts` 的 `syncRoot()` 由 `secretPath` 改為 `uid`，路徑格式由 `{basePath}/{secretPath}` 改為 `{basePath}/users/{uid}`，滿足「路徑必須以匿名登入 uid 為基礎，未來 `linkWithCredential()` 升級 uid 不變、不需 migration」的產品要求；`src/lib/firebaseSyncUrl.ts` 組出帶 `?auth=<idToken>` 的 RTDB REST URL。Security Rules 已由使用者本人於 Firebase Console 套用（`$envPath` 萬用字元只鎖 `auth.uid === $uid`，不區分環境字串；Preview／Production 隔離仍由既有 App 層 `firebaseBasePath` 前綴機制負責，與 Rules 無關）。既有雲端舊資料（到期規則封鎖前的公開讀寫資料）依使用者拍板**視為已遺失，不做遷移**（過期 Rules 對所有人皆拒絕讀取，遷移在技術上須先由使用者自行於 Console 暫時重開舊路徑，非本次程式碼範圍）；使用者下次「上傳雲端」會直接把本機 localStorage 資料寫入新的 uid 路徑。UI 層：「同步代號」輸入欄位與兩處「目前同步代號」顯示已從介面隱藏（底層 `state.firebase.secretPath` 型別與資料完全保留，未刪除、未 migration，因為 uid 路徑生效後這個欄位已不影響資料實際存放位置，繼續顯示會誤導使用者）；「上傳雲端」／「下載雲端」按鈕旁新增跨裝置同步暫停提示（「跨裝置同步暫時關閉：本次僅支援單一裝置的雲端備份。如需在不同裝置間搬移資料，請改用「匯出 JSON 備份」／「匯入 JSON 備份」；未來帳號升級功能上線後，將恢復跨裝置同步。」）；新增「登入狀態」顯示列取代原「目前同步代號」位置，登入失敗時清楚顯示錯誤訊息（例如 `❌ 匿名登入失敗：...`），不靜默。**明確不包含**：Google 登入／OAuth 串接、`linkWithCredential()` 帳號升級 UI 或實際呼叫邏輯、帳號衝突合併邏輯、多裝置同時登入處理、任何 Household Liquidity 或其他核心財務公式變更。新增 `tests/firebaseAnonymousAuth.test.ts`（10 個測試）、`tests/firebaseSyncUrl.test.ts`（4 個測試），並更新 `tests/environmentBoundary.test.ts`、`tests/syncBaseline.test.ts`、`tests/productionSyncBaselineRegression.test.ts` 三個原本鎖定舊 `syncPath`／`uploadFirebase` 簽名的原始碼文字斷言；`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功；`Deploy GitHub Pages` run `30988751844` success，headSha 與 merge commit 一致；Production／Preview `curl` 皆 HTTP 200。**使用者完成 Firebase Console 兩項設定（啟用「匿名」登入方式、套用新 Security Rules）後，已以真實 Firebase 後端複驗**（測試資料驗證後已清除）：全新使用者背景自動登入成功，Preview／Production 各自取得真實且互異的 uid；以 App 實際簽發的 uid／idToken 重放與程式碼相同的 RTDB REST 呼叫，上傳／下載成功且資料一致；用 Production 的 idToken 讀取 Preview 的 uid 路徑回傳 HTTP 401 Permission denied，證實 Rules 的 `auth.uid === $uid` 正確生效，跨使用者無法互相讀到對方資料。**UR-TODO-001 正式結案**；**下一潛在候選為 Google 登入／帳號升級（`linkWithCredential()`），屬重大產品語意事件，須另行拍板，本次未自動開始，未經授權不得開始。**詳見下方更新後的 **UR-TODO-001** 正式條目。

2026-08-05 **UR-TODO-046-C3C-A（Runtime Attribution Provenance Card）與 UR-TODO-046-C3C-B（Session-only Mark-as-Reasonable Toggle）正式標記為已完成**。**C3C-A**：PR [#248](https://github.com/hyc640110/family-universal-rebalance/pull/248)（`feat/ur-todo-046-c3c-a-presentation`）已由使用者手動 Merge，merge commit `28c832b1020b8bd38845776d8177fa7f2e4c7994`。新增純顯示層 `src/lib/runtimeAttributionPresentation.ts`（`deriveRuntimeAttributionPresentation()`）與唯讀元件 `src/components/RuntimeAttributionProvenanceCard.tsx`，於分析頁「風險」視角、緊接「防守配置狀態」卡片之後呈現 `composeRuntimeNetWorthAttribution()` 的既有輸出，拆解 Ledger 已確認證據／衍生證據／未解釋殘差三層 provenance；`reconciled` 直接讀 `attributionQuality === 'reconciled'`；zero-length period（`openingSnapshot.date === closingSnapshot.date`）由呼叫端比較日期後標示「當日無比較區間」，非依賴計算函式回傳值；adjustment／internal-transfer 的 0 貢獻與 FX fail-safe 排除項目皆有人類可讀文字（不直接顯示 diagnostics 原始代碼）。比較期間固定採「最新兩筆淨資產快照」，與既有 `deriveHistoryStats()` 的 `todayChange` 同一慣例，未發明新快照挑選規則。**C3C-B**：PR [#250](https://github.com/hyc640110/family-universal-rebalance/pull/250)（`feat/ur-todo-046-c3c-b-session-confirm`）已由使用者手動 Merge，merge commit `d7fb5b44d4641c492c8b11b7871bf2f31891431f`，`mergedAt: 2026-08-05T02:54:55Z`。在 C3C-A 卡片新增「衍生證據逐筆清單」，每筆 derived evidence（`provenance==='derived-transaction' && disposition==='contributing'`）旁掛一個可重複切換的「標示為合理」toggle，純 component-local `useState`（比照 UR-TODO-045 `showAllHistoryGrid` 先例），toggle 邏輯抽成純函式 `src/lib/runtimeAttributionSessionMarks.ts`；Ledger evidence／zero-contribution／FX-excluded 三種既有清單不掛此互動。實機驗證：多筆 toggle 各自獨立切換、全程零 localStorage 寫入與零新增 network request、切換前後四個歸因數字完全不變（互動不觸發任何重新計算）、完整重新整理後所有標示清空且無「資料遺失」警告、390px 觸控目標達 44px。文案採「標示為合理」／「已標示｜我目前認為合理」，測試已斷言「已正式記帳」「已寫入 Ledger」「已永久確認」「已改變歷史資料」「已改變 attribution」「儲存」「送出」等禁用語意不出現。**兩者皆未新增 schema、persistence、localStorage、Firebase、JSON Backup 改動，未觸碰 `runtimeAttributionComposition.ts`／`netWorthAttribution.ts` 核心邏輯。UR-TODO-046 整體仍未完成**：下一潛在候選為 **046-C3C-C（Ledger 寫入／持久化）**，屬重大產品／核心財務語意事件，須另行拍板，本次未自動開始。詳見下方更新後的 **UR-TODO-046** 正式條目。

2026-08-05 **UR-TODO-046-C3B（Runtime Attribution Composition）正式標記為已完成**。已由使用者最終授權 Merge [PR #246](https://github.com/hyc640110/family-universal-rebalance/pull/246)（`feat/ur-todo-046-c3b-attribution-composition`，ChatGPT 完成架構審查與人工財務案例驗收後正式核准，Claude Code 依既有政策執行 `gh pr merge --admin`），merge commit `c30db10b69f7f1b3a8c88390028f4abac46246a4`，`mergedAt: 2026-08-04T16:49:54Z`。新增 `src/lib/runtimeAttributionComposition.ts` runtime attribution composition layer：`netWorthChange = ledgerContribution + derivedContribution + unexplainedResidual`，Ledger evidence 優先、只有 reconciliation candidate 能產生 derived contribution、同一 transactionId 最多計算一次、`Asia/Taipei` calendar-day 日期契約、adjustment／internal-transfer 皆為零效果、非 TWD 無 FX 時 fail-safe 排除、reconciled 不代表完整歸因。**未新增 schema、persistence、Firebase Ledger sync、migration、Ledger write-back、UI 或 AI Decision／Rebalance／Household Liquidity wiring**，changed files 僅 `package.json`、`src/lib/netWorthAttribution.ts`、`src/lib/runtimeAttributionComposition.ts`、`tests/runtimeAttributionComposition.test.ts`。Merge 後 Git 基線驗證確認 `main`／`origin/main`／`HEAD` 三者一致（`c30db10`）；`Deploy GitHub Pages` run `30931019567` success，headSha 一致；Production／Preview `curl` 實測皆 HTTP 200，`deployment-environment` metadata 正確，assets 路徑各自獨立。**UR-TODO-046 整體仍未完成**，下一正式候選（C3C 呈現／使用者確認、Firebase Ledger sync 等）皆屬重大產品／核心財務語意事件，須另行拍板，本次未自動開始。詳見下方更新後的 **UR-TODO-046** 正式條目。

2026-08-02 **UR-TODO-043-B1/B2 Canonical Calendar Day／Deterministic Same-Day Snapshot Selection 正式完成**。PR #233 已 Merge，merge commit `0e3c80404be4eb5452835b0497f3274c8edca62c`，正式基線推進至此 SHA；B1 固定 `Asia/Taipei` 輸出 canonical `YYYY-MM-DD`，B2 同日多筆 snapshot 依輸入序列最後一筆勝出，不新增 timestamp、schema 或 migration。C3 read-time boundary、History、Analytics、Calendar 共用同一選擇契約。`test:ci` 675 項、TypeScript、Production／Preview build、CI verify `30737460836`、Pages workflow `30737504196` 均成功；C4 未觸發。**043-B 其餘範圍維持待盤點。**

2026-08-02 **UR-TODO-043-C3-A Read-time Snapshot Boundary 正式完成**。PR #229 已 Merge，merge commit `e663e5d0dcda6117e75dcd972fcef6c336e2cf97`，正式基線推進至此 SHA。已建立平行 raw／classified read-time view，保留 `valid`／`missing`／`invalid`／`non-finite` 四分類、valid `0` 與 missing 的差異；localStorage、Firebase download、Backup import 均在 legacy normalization 前建立 view。未修改 AppState／persistence schema、不做 migration、不改寫既有 snapshot。`test:ci` 655 項、TypeScript、Production／Preview build、CI verify `30735211163` 與 Pages workflow `30735283065` 均成功。**C4 未觸發；後續 C3-B 已由 PR #231 完成。**

2026-08-01 **UR-TODO-027（趨勢圖剩餘視覺與刻度問題）四項待確認事項全數處理完畢，正式標記為已完成**（Claude Code，Review Mode，唯讀盤點，未修改任何程式碼）。最後一項「07／15 附近中間空白」唯讀盤點結論：確認為 `TrendChart.tsx:76` X 軸座標定位邏輯的設計行為（`x(index)` 純以資料陣列索引決定水平位置，不依實際日曆天數換算），非缺陷。以 seed 測試資料（刻意跳過 07/13～07/19）實機渲染驗證：相鄰資料點的 x 座標間距在跨 8 天缺口與跨 1 天皆完全相同，填色區塊數量與相鄰點對數一致、無跳過，證實圖表對日期缺漏完全無感、不會產生視覺斷裂；上游 `netWorthHistory.ts` 資料源本身即為稀疏陣列，缺快照日期在陣列中完全不存在，與既有「不補日期、不插值」原則一致。使用者確認此為設計行為、不需修正，直接結案。**至此 UR-TODO-027 走勢方向漸層填色、Y 軸整數刻度、手機文字裁切、Y 軸位置、07／15 日期斷裂五項全數確認完畢，整體狀態由「部分完成」更新為「已完成」。** 詳見下方更新後的 **UR-TODO-027** 正式條目。

2026-08-01 **UR-TODO-003／UR-TODO-048 合併規劃：CLEC 分類語意標示正式標記為已完成**。已由使用者手動 Merge [PR #225](https://github.com/hyc640110/family-universal-rebalance/pull/225)（`fix/ur-todo-003-048-clec-role-semantic-label`），merge commit `cbe5e0537d7257e94937a766fe110a2e0fcd002f`，`mergedAt: 2026-08-01T16:53:39Z`。UR-TODO-003 唯一剩餘技術缺口（`AssetClass` 與 CLEC `AllocationRole` 語意分歧）與 UR-TODO-048 的 `allocationRoleBySymbol` 清理議題（步驟一）合併解決：使用者決定不做資料統一，於 `ClecStrategyCenterPage.tsx`「目前配置來源」卡片新增文案明確標示角色分類為 CLEC 模擬專用、與資產頁正式分類無關；純文案調整，未觸碰任何分類型別、資料值或核心計算邏輯。`Deploy GitHub Pages` run `30709137755` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 皆 HTTP 200，並直接比對已部署 JS bundle 內容確認含新文案，`deployment-environment` metadata 正確、資源路徑未混用。**UR-TODO-003 正式標記為已完成；UR-TODO-048 步驟一（明確標示）正式標記為已完成，步驟二（`allocationRoleBySymbol` 資料層清理）仍維持「待評估」，非本次範圍。** 詳見下方更新後的 **UR-TODO-003**、**UR-TODO-048** 正式條目。

2026-08-01 **UR-TODO-003／UR-TODO-048 合併規劃：CLEC 分類語意標示，Draft PR 已開啟、待驗收**（Claude Code，Development Mode，`fix/ur-todo-003-048-clec-role-semantic-label` 分支，基準 `origin/main` HEAD `1b96e03`）。使用者對 UR-TODO-003 唯一剩餘技術缺口（`AssetClass` 與 CLEC `AllocationRole` 兩套平行分類系統語意可能混淆）與 UR-TODO-048 的 `allocationRoleBySymbol` 清理議題合併決策：**不做資料統一，保留兩套獨立系統，改以文案明確標示**「目前配置來源」卡片顯示的角色分類為 CLEC 模擬專用、與資產頁正式分類無關。範圍：`src/pages/ClecStrategyCenterPage.tsx` 於既有說明文字下方新增一行 `<p className="note clec-role-scope-note">`，純文案調整；**未修改** `AssetClass`／`AllocationRole` 型別定義、既有分類邏輯、任何持股分類資料值，未新增分類轉換或自動推斷機制，未觸碰 CLEC 核心策略計算或 Household Liquidity 核心公式。開發前重新唯讀盤點確認 `allocationRoleBySymbol` 全庫僅 `App.tsx`（8 處）與 `syncState.ts`（1 處）引用，`ClecStrategyCenterPage.tsx` 為唯一顯示角色標籤的畫面，與既有治理紀錄一致，未發現本次盤點未涵蓋的讀寫位置。新增 `tests/clecRoleSemanticScopeNote.test.ts` 2 個測試；`npx tsc -b`、`test:ci` 全數通過（既有 3 個相關測試檔零修改直接通過）；Production／Preview build 皆成功。**待 Merge 與 Preview 實機驗證。** 詳見下方更新後的 **UR-TODO-003**、**UR-TODO-048** 正式條目。

2026-08-01 **UR-TODO-027 剩餘四項待確認中的三項（Y 軸整數刻度、手機文字裁切、Y 軸位置）正式標記為已完成**（Claude Code，Review Mode，唯讀盤點＋隔離本機 dev server 實機驗證，未修改任何程式碼）。以高數值（8.5～9.5 百萬）＋日期跳躍資料 seed 測試，於 390px 實機確認：Y 軸刻度皆為整數且經萬元換算避免多位數雜訊；SVG viewBox 與容器寬度動態對應，無橫向溢出、console 無錯誤；Y 軸位置（固定左側緊貼繪圖區邊界）經使用者確認不需調整、維持現況即為驗收通過。**僅剩「07／15 附近中間空白」一項待使用者以自己真實 Production 資料查看確認後另行處理**——本次以測試資料驗證折線在日期跳躍時的行為符合既有「不補日期、不插值」設計、未觀察到異常，但無法用測試資料代表使用者真實情境。UR-TODO-027 整體狀態維持「部分完成」，僅剩此一項。詳見下方更新後的 **UR-TODO-027** 正式條目。

2026-08-01 **UR-TODO-002（持股資產管理卡片 2.0 差異盤點）正式標記為已完成**。使用者於前一輪盤點選擇「方向 2：依原始版面需求重新設計」並下達開發指令；開發前重新唯讀盤點時發現原始盤點基準 `d49e98b` 早於 UR-TODO-033（PR #214，`fd3ae44`）合併，五項差異中前四項（現價與漲跌幅同列、漲跌金額獨立次列、▲／▼ 箭頭、三者同色）其實已由 UR-TODO-033 完成，本次**未重做**這四項，僅實作唯一仍為缺口的第五項（與未實現損益清楚區隔）。已由使用者手動 Merge [PR #222](https://github.com/hyc640110/family-universal-rebalance/pull/222)（`feat/ur-todo-002-holding-card-pnl-distinction`），merge commit `cd430dcafd3aedbb4b0c6bcdadf2b0b161239925`，`mergedAt: 2026-08-01T16:09:00Z`（因 branch protection 需要審核人數、僅一名協作者，經使用者確認 Preview 驗收後由使用者直接指示、Claude Code 執行 `gh pr merge --admin`，已於 Merge 當下明確告知使用者）。第五項採使用者選定的方案 C（容器樣式區隔）：「未實現損益」格新增淡色背景＋左側色條強調（沿用既有紅漲綠跌色碼），「今日漲跌」格完全未變動；新增 4 個測試明確斷言 UR-TODO-033 成果未被重做。`Deploy GitHub Pages` 對應 run success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 皆 HTTP 200，並直接比對 gh-pages 分支實際部署內容確認新 class 已生效，`deployment-environment` metadata 正確、資源路徑未混用。詳見下方更新後的 **UR-TODO-002** 正式條目。

2026-08-01 **收支與現金流中心「每月設定」金額輸入改為元單位，正式標記為已完成**（非既有 UR-TODO 編號，由使用者於 Claude Home 唯讀盤點後直接下達開發指令，經 Claude Code 執行）。已由使用者手動 Merge [PR #220](https://github.com/hyc640110/family-universal-rebalance/pull/220)（`feat/cash-flow-yuan-unit-input`），merge commit `421f0566077dfbc482c9b5767802e12ae7364c91`，`mergedAt: 2026-08-01T15:30:19Z`。**背景**：使用者反映固定支出清單以「萬元」輸入無法精確填入百元級金額（例如 600 元只能輸成 0.06 萬）；唯讀盤點確認固定支出清單、每月收入、每月預定投資金額三欄位共用 `WanField` 元件與 `wanToYuan`／`yuanToWan` 換算函式，底層儲存（`CashFlowItem.amount`、`state.cashFlowProfile`）本來就是「元」，萬元僅為顯示層換算。**開發過程中觸發一次停止條件並經使用者確認後才繼續**：重新核對呼叫鏈時發現 `formatWanInput` 也被用於「額外投入資金／預計提領資金」欄位的初始顯示字串（`CashFlowPage.tsx:21`），若直接修改共用函式會波及這兩個不在範圍內的欄位；使用者確認採用「方案 1」——新建獨立的元單位格式化函式，不觸碰共用函式本身。範圍：`src/lib/cashFlow.ts` 新增 `parseYuanInput`／`formatYuanInput`（不做 ×10000／÷10000 換算，只做整數四捨五入），`wanToYuan`／`yuanToWan`／`formatWanInput`／`parseWanInput` 完全未修改，繼續唯一供「家庭流動資金計畫」（額外投入資金／預計提領資金）使用；`src/pages/CashFlowPage.tsx` 的 `WanField` 重新命名為 `YuanField`，只給「每月收入」「每月預定投資金額」「固定支出清單各項金額」三處使用，欄位標籤由「（萬元）」改為「（元）」，`input` 屬性由 `inputMode="decimal" step="0.1"` 改為 `inputMode="numeric" step="1"`。新增 `tests/cashFlowYuanUnitInput.test.ts` 5 個測試，涵蓋 600 元精確輸入、既有萬元資料 round-trip 顯示正確、`wanToYuan`／`yuanToWan` 契約未變動、頁面原始碼結構確認三欄位為元單位而 Plan Input 兩欄位仍為萬元；`npx tsc -b`、`test:ci`、Production build、Preview build 全數成功。實作於全新獨立 worktree（`E:/2026_CodeX/worktrees/family-universal-rebalance-cashflow-yuan-input`）進行，未操作既有固定 worktree／stash；建置過程中順帶產生的 `dist/`、`package-lock.json` 漂移（`"latest"` 版本被 `npm install` 正規化為實際解析版本）已確認為建置產物、非本次範圍，予以還原未提交。隔離 Preview 環境（`workflow_dispatch` 部署）實機驗證：既有 60000 元資料重新載入正確顯示為 `60000`；新增 600 元測試項目儲存後 `localStorage` 確認 `amount: 600`，完整重新整理後仍精確顯示 `600`，無精度遺失；「額外投入資金（萬元）」「預計提領資金（萬元）」標籤與初始顯示完全未受影響；390px 無橫向溢出，console 全程無 error；驗證後已刪除測試資料還原 Preview 環境。`Deploy GitHub Pages` run `30706058168` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 皆 HTTP 200，並直接比對已部署 JS bundle 內容確認含「每月收入（元）」不含「每月收入（萬元）」，`deployment-environment` metadata 正確、資源路徑未混用。**明確不包含**：資產頁 `DraftInput`、Household Liquidity 核心公式、資金基數計算邏輯、全站其餘萬元輸入欄位皆未觸碰。

2026-08-01 **UR-TODO-027（趨勢圖剩餘視覺與刻度問題）的「走勢方向漸層填色」子需求正式標記為已完成**，已由使用者手動 Merge [PR #218](https://github.com/hyc640110/family-universal-rebalance/pull/218)（`feat/ur-todo-027-trend-chart-gradient`），merge commit `b85521aa959377089e2e8d67b3fbd01292c9bfb2`，`mergedAt: 2026-08-01T11:34:18Z`。**本項條目下仍有其他 2026-07-19 提出、本次未處理的待確認項目（07／15 附近日期斷裂、Y 軸整數刻度、手機左側文字裁切、Y 軸位置），故 UR-TODO-027 整體狀態維持「部分完成」，僅漸層填色子需求正式結案，不整體標記為已完成。** 範圍：`src/components/TrendChart.tsx` 新增紅漲綠跌漸層填色，**依驗收回饋由「整段頭尾單一顏色」調整為「逐段各自變色」**——每個相鄰資料點間的線段依「該段自己的終點 vs 起點」各自決定紅（`#ff5b5b`）／綠（`#43d17a`），中間震盪（先漲後跌再漲）會逐段各自呈現正確方向，而非只看整段頭尾；持平線段維持不填色。`monotonePath`（可見折線）改為從新的 `monotoneSegments()` 衍生，確保折線與逐段填色使用完全相同的曲線片段。視覺風格為「逐段漸層淡出」（使用者於實作前以 `AskUserQuestion` 二選一確認，選定漸層淡出而非逐段實色填色），每張圖表僅渲染 2 個共用 `<linearGradient>`（紅、綠各一，`gradientUnits="userSpaceOnUse"` 確保全圖統一絕對淡出速率），由所有同方向線段共用，不是逐段各自一個漸層。折線本身仍是單一連續 `<path>`（`stroke="currentColor"`），資料點與 hover／touch 互動完全未變動。`tests/trendChartGradientArea.test.ts` 全面改寫為 7 個測試，涵蓋逐段變色關鍵案例（含「整體區間上漲但中段下跌」）、持平線段不填色、共用漸層數量、折線與互動標記不變；`npx tsc -b`、`test:ci` 全數通過。隔離本機 dev server 實機驗證：seed 一組震盪走勢確認 6 個線段各自正確變色、僅 2 個共用漸層、`getComputedStyle` 確認顏色與淡出透明度正確、390px 無橫向溢出、hover/touch 互動正常、console 全程無 error；`Deploy GitHub Pages` run `30697948596` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測皆 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用。詳見下方更新後的 **UR-TODO-027** 正式條目。

2026-08-01 **治理落差補記：UR-TODO-026 正式標記為已完成**。已由使用者手動 Merge [PR #216](https://github.com/hyc640110/family-universal-rebalance/pull/216)（`fix/ur-todo-026-remove-holding-ratio-label`），merge commit `63feac1f0012546fadc1e341c55c047c967ada65`，`mergedAt: 2026-08-01T10:02:00Z`；本文件先前僅記錄「使用者拍板需求範圍」，PR #216 Merge 結果未同步進本文件，本次一併補齊。範圍：`src/App.tsx` 移除持股卡片圓形徽章內的「持有比例」文字標籤，只保留百分比數字，未新增任何圖形／圓圈視覺（既有 `.holding-mobile-weight` CSS 圓形徽章維持不變），改用 `aria-label` 保留無障礙語意；`src/styles.css` 同步清理已死的相關 CSS 規則。`Deploy GitHub Pages` run `30694911418`（headSha `63feac1`，PR #216 為觸發此次部署的最後一次 push，PR #215 對應的 run `30694886154` 因 `concurrency: cancel-in-progress` 被此次部署自動取消，屬正常行為，非錯誤）success；Production／Preview 本次以 `curl` 實測皆 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用。詳見下方更新後的 **UR-TODO-026** 正式條目。

2026-08-01 **UR-TODO-034（持股更新後仍顯示舊報價的殘留案例盤點）唯讀實機驗證完成，正式標記為已完成**（Claude Code，Development Mode／驗收性質，基準 `origin/main` HEAD `63feac1`，**未修改任何 `src/`、`tests/` 程式碼**，純唯讀驗證）。先確認架構：`quotes` 為 `App.tsx` 的純 React state（`useState(defaultQuotes)`），**不寫入 `localStorage`**，每次完整重新整理都會回到 `defaultQuotes` 起始值後由 `refreshQuotes()` 重新向 Worker 抓取；其中 00631L／00865B 在 `defaultQuotes` 有寫死的「內建備援」價格（38.42／48.52，明顯不同於實際市價），研判為過去這兩檔曾出現殘留問題後刻意加上的保底值；`mergeQuoteRefresh()`（`src/lib/dataRefresh.ts`）合併邏輯已有防護：新報價無效或時間戳記早於前次時保留前次有效報價並標記「更新失敗」，不會讓錯誤覆蓋正確值。隨後於隔離本機 dev server（`npm run dev -- --mode preview-deploy`，串接真實 Yahoo Finance via Cloudflare Worker，未使用使用者 Production 資料）實機測試：(1) 首次載入 00631L／00865B 立即顯示真實市價（33.70／49.59），未殘留內建備援值；(2) 分別編輯兩檔持股股數（00631L→10 股、00865B→25 股）並確認寫入 `localStorage`，價格不受影響；(3) 手動點擊「更新股價」重新整理，價格與時間戳記正確更新，股數不受影響；(4) 完整瀏覽器重新整理（F5）：股數持久化正確，報價快速重新抓取為正確市價，未見殘留舊值；(5) 跨頁一致性：資產頁、分析頁、投資組合風險與配置中心皆呈現一致數字（風險頁正確算出「最大單一資產為 00865B，占總資產 78.6%」，與資產頁市值換算完全吻合）；(6) 全程 console／dev server log 皆無 error。**結論：Worker → state → localStorage（僅持股本身，非報價）→ 各頁 selector 這條資料流對 00631L、00865B 兩檔測試皆一致、無殘留舊報價現象，未發現真實問題。** 詳見下方更新後的 **UR-TODO-034** 正式條目。

2026-08-01 **UR-TODO-033（持股卡片現價與今日漲跌版面完整差異）正式標記為已完成**，已由使用者手動 Merge [PR #214](https://github.com/hyc640110/family-universal-rebalance/pull/214)（`feat/ur-todo-033-holding-card-quote-layout`），merge commit `fd3ae448e9e7c5678a793f81d548fe5ed1f783c7`，`mergedAt: 2026-08-01T09:50:04Z`。範圍：`src/lib/compactAssetCard.ts` 新增 `formatCompactQuoteHeadline()`，內部重用既有 `formatCompactQuoteMovement()` 的 tone／有效性／aria-label 作為單一事實來源，只新增箭頭與拆分後的百分比／金額格式化；`App.tsx` 的 `HoldingCompactCard`「現價」格改為同列顯示「價格 元 ▲/▼ 漲跌幅%」，「今日漲跌」格只顯示漲跌金額（次列，與現價同一格線列相鄰，維持既有 6 格 grid 不變）；`styles.css` 新增 `.holding-quote-percent`，顏色沿用既有 `.holding-card-price>strong.{up,down,hold}`／`.holding-card-today-change>strong.{up,down,hold}` 規則，現價、▲/▼、漲跌幅、漲跌金額四者共用同一 tone class。三個既有 characterization 測試檔同步更新結構性斷言，並新增 `formatCompactQuoteHeadline` 專屬測試涵蓋上漲／下跌／平盤／資料不足／比較基準未驗證五種情境；`npx tsc -b`、`test:ci` 全數通過。`Deploy GitHub Pages` run `30694521777` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測皆 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用。隔離本機 dev server（真實 Yahoo Finance via Cloudflare Worker）實機驗證已於 PR 內完成：`getComputedStyle` 確認現價、箭頭、漲跌幅、漲跌金額顏色一致（`rgb(255, 91, 91)` 紅漲），390px／1280px 皆無橫向溢出，console 無 error。**明確不包含**：「非今日報價清楚標示」既有機制（`quoteSummaryText` 頂層提示、`row.quote.error` 時「現價」標示為「參考價」）本次未變動；未修改任何持股計算邏輯、`Quote` 型別或資料契約。詳見下方更新後的 **UR-TODO-033** 正式條目。

2026-08-01 **UR-TODO-032（資產頁更新股價入口與手機下拉更新盤點）唯讀盤點與隔離 Preview 環境實機驗收完成，正式標記為已完成**（Claude Code，Development Mode／驗收性質，基準 `origin/main` HEAD `2abe5ac`（PR #212 merge commit），**未修改任何 `src/`、`tests/` 程式碼**——本項為既有基礎設施已滿足驗收條件，非新增開發，僅治理文件同步）。唯讀盤點先確認架構：`refreshQuotes()` → `createQuoteRefreshController`（`src/lib/quoteRefreshController.ts`）為桌機／手機共用的單一刷新入口；`isRefreshingQuotes`、`hasUpdatedQuotes`、`latestQuoteTime`、`quoteSummaryText`、`quoteStatus` 皆為 `App.tsx` 頂層單一狀態／`useMemo`，逐一以 props 傳入首頁、資產頁、分析頁，非各頁分別重算；手機下拉更新另有獨立模組 `src/lib/assetsPullToRefresh.ts`（`createAssetsPullToRefresh`）綁定觸控事件，呼叫同一個 `refreshQuotes(true)`。隨後於隔離本機 dev server（`npm run dev -- --mode preview-deploy`，串接真實 Yahoo Finance via Cloudflare Worker，未使用使用者 Production 資料）實機驗收：於資產頁點擊「更新股價」→ 確認「持股報價來源與新鮮度」區塊顯示「股價更新成功（4/4）：時間戳記」，四檔標的（00631L、00662、00670L、00865B）逐一列出市場時間／來源／系統取得時間 → 以 SPA 內部導覽（非瀏覽器重新整理）切換至分析頁，確認同一時間戳記、同一組報價與今日漲跌數字完全一致重現（非重新抓取）→ 切回首頁，確認「最後股價更新」短格式時間與前述時間戳記一致 → 於首頁點擊「更新股價」再次觸發刷新，確認新時間戳記（17:15:33）立即同步反映於資產頁、分析頁、首頁三處，全程無需個別重新整理 → 縮放至 390px 確認資產頁 `scrollWidth === clientWidth`（無橫向溢出）→ 全程 `read_console_messages` 與 dev server log 皆無 error。驗收條件「桌機與手機使用同一刷新契約」「更新後各頁報價一致」達成；`npx tsc -b` 建置成功。手機下拉觸發（`assetsPullToRefresh` 觸控事件）與明確的錯誤狀態（Worker 失敗情境）因本次環境網路正常、未能重現失敗案例，故錯誤狀態呈現（`quotePresentation.ts` 的 `isPreserved`／`hasFailure` 分支）本次僅完成程式碼靜態確認，未實機重現，但程式碼路徑明確、與正常路徑共用同一組件與狀態，風險判斷為低。本項自 2026-07-19 提出、2026-07-23 補登建檔以來從未被任何專屬 PR 處理，本次確認為其他 Sprint（V7.0B、UR-TODO-009 等）陸續建成的共用基礎設施順帶滿足，並非本次新增程式邏輯。詳見下方更新後的 **UR-TODO-032** 正式條目。

2026-08-01 **UR-TODO-028（股息中心未指定資產編輯限制）唯讀盤點與隔離 Preview 環境實機驗收完成，正式標記為已完成**（Claude Code，Development Mode／驗收性質，基準 `origin/main` HEAD `a7cc0a4`，**未修改任何 `src/`、`tests/` 程式碼**——本項為既有功能已滿足驗收條件，非新增開發，僅治理文件同步）。唯讀盤點先確認 `src/pages/DividendCenterPage.tsx` 對所有股息紀錄（含 `assetSymbol` 為空的「未指定資產」紀錄）皆同時提供「編輯」「刪除」兩個動作，「編輯」會載入同一份含 `DividendAssetReferenceSelect`（含「未指定資產」選項）的完整表單。隨後於隔離本機 dev server（`npm run dev -- --mode preview-deploy`，未使用使用者 Production 資料）實機驗收：新增一筆帳戶「現金」、資產「未指定資產」、實收股息 1,234 元的紀錄 → 點擊「編輯」→ 確認表單正確載入既有資料（含「編輯股息紀錄」標題與「儲存股息紀錄」「取消編輯」按鈕）→ 於資產代號欄位選擇「00631L 元大台灣50正2」→ 點擊「儲存股息紀錄」→ 確認「資產股息排行」「股息組成」「股息來源分布」三處摘要卡片同步由「未指定資產」改為「00631L」→ `F5` 重新整理後確認變更已持久化（localStorage）不遺失 → 縮放至 390px 寬度確認 `document.documentElement.scrollWidth === clientWidth`（無橫向溢出）→ 全程 `read_console_messages` 僅出現 Vite HMR／React DevTools 提示，無 error。同時一併確認同一筆紀錄可再次點擊「編輯」將資產切回「未指定資產」（下拉選單保留該選項），雙向切換皆正常。驗收條件「未指定資產紀錄可安全編輯」達成；`npx tsc -b` 建置成功。本項自 2026-07-19 提出、2026-07-23 補登建檔以來從未被任何專屬 PR 處理，本次確認為既有股息中心改版（新增／編輯／刪除共用同一表單元件）順帶滿足，並非本次新增程式邏輯。詳見下方更新後的 **UR-TODO-028** 正式條目。

2026-08-01 **UR-TODO-026、027、028、032、033、034 唯讀盤點完成**（Claude Code，Review Mode，基準 `origin/main` HEAD `a7cc0a4`，未修改任何檔案；本次為 2026-07-23 補登建檔後首次唯讀重新核對最新 main）。逐項結論：**UR-TODO-028** 經程式碼比對後判定極可能已被股息中心改版順帶解決（見上方單獨完成記錄，本次已進一步實機驗收確認並正式結案）。**UR-TODO-032** 確認基礎設施已大致完備：桌機／手機共用同一份 `refreshQuotes()` → `createQuoteRefreshController`；手機另有獨立模組 `src/lib/assetsPullToRefresh.ts`（`createAssetsPullToRefresh`）綁定觸控下拉事件；首頁固定有「更新股價」按鈕並含 `isRefreshingQuotes` loading 狀態；`quotePresentation.ts` 的 `describeQuotePresentation` 統一報價呈現邏輯——研判多為其他 Sprint（V7.0B、UR-TODO-009 等）順帶建成的共用基礎設施，並非針對本項開的 PR，但「loading／error／lastUpdated／quote date 跨頁一致」仍未經本次實機互動驗證，狀態維持「部分完成／待盤點」，僅補充上述程式碼證據，待下次排入驗收即可能直接結案。**UR-TODO-026** 現況與原始描述有出入：文字已從「持有比率」變成「持有比例」（`src/App.tsx` 第 710 行，可能為其他 PR 順帶改字，非本項處理），且程式碼中找不到任何圓圈／SVG 圖形，只有純文字＋數字並列；原始需求前提「保留圓圈」目前不成立，需先由使用者確認需求是否仍要新增圓圈視覺或僅移除文字標籤，狀態維持「待盤點」。**UR-TODO-027** 再次確認 `src/components/TrendChart.tsx` 仍只有 `<path>` 折線與 `<circle>` 資料點，無任何漸層實作，與 2026-07-26 盤點結論一致，仍是真實缺口，狀態維持「待盤點」。**UR-TODO-033** 確認 `App.tsx` 第 715～716 行「現價」與「今日漲跌」仍是兩個獨立列（非同列），`compactAssetCard.ts` 的 `formatCompactQuoteMovement()` 只用 `+`／`-` 文字符號、沒有 ▲／▼ 符號，與原始待確認項目有明確落差，仍是真實缺口，狀態維持「部分完成／待盤點」。**UR-TODO-034** 無法僅由程式碼靜態判斷是否已解決，需要以 00631L、00865B 等真實標的在瀏覽器實機比對 Worker／cache／state／localStorage／各頁 selector 是否一致，狀態維持「部分完成／待盤點」。全庫搜尋 `AI_CONTEXT/` 確認除本次與 2026-07-26（UR-TODO-027 需求明確化）外，這六項自 2026-07-23 補登建檔後未曾被任何其他 PR 觸碰。

2026-08-01 **UR-TODO-036（Household Liquidity Plan Input UI Entry Point）唯讀盤點完成，正式標記為已完成**（Claude Code，Review Mode，基準 `origin/main` HEAD `6380c4f`，未修改任何程式碼）。逐項核對原三項「待確認」：與 UR-TODO-011「防守配置狀態」呈現規劃的邊界已由 011C（PR #164）命名統一直接解決，且 011A 核心程式碼確認無資料重疊；與 Dashboard、Rebalance、Simulator 既有欄位比對後確認不需整合去重（Dashboard 無欄位、Simulator 舊重複輸入已於 UR-TODO-010 移除、Rebalance 的 `buyOnlyBudget` 為語意不同的互補參數）；手機／桌機一致性與萬元輸入驗證確認已有專屬響應式 CSS 與涵蓋主要邊界類別的自動化測試。三項待確認事項皆已找到具體程式碼證據回答，未發現需要修改程式碼的實質缺陷。詳見下方更新後的 **UR-TODO-036** 正式條目。

2026-08-01 **UR-TODO-042（PortfolioRiskPage「槓桿暴露」卡片 React 重複 key console error）正式標記為已完成**。已由使用者手動 Merge [PR #209](https://github.com/hyc640110/family-universal-rebalance/pull/209)（`fix/ur-todo-042-portfolio-risk-key-collision`），merge commit `e81259a3c180aa557aa21b4b1663975aeb85b488`，`mergedAt: 2026-08-01T06:54:11Z`。範圍僅 `src/pages/PortfolioRiskPage.tsx` 的 `Rows` 元件 1 行變更：儲存格 `key` 由依賴文字內容的 `key={item}` 改為依賴欄位索引的 `key={index}`，未觸碰 `src/lib/portfolioRisk.ts`、Household Liquidity 核心公式或任何其他頁面。`npx tsc -b`、`test:ci`（0 fail）、Production build 皆成功；隔離 Preview 環境瀏覽器實測確認「槓桿暴露」卡片「占總資產／0.0%／占總資產」列內容不變、console 不再出現重複 key 警告。`Deploy GitHub Pages` workflow run `30688639249` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測皆 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用。此為 UR-TODO-041／UR-TODO-042 唯讀盤點（2026-07-26 提出、2026-08-01 重新確認缺陷未變）後首個進入開發並完成的項目。詳見下方更新後的 **UR-TODO-042** 正式條目。

2026-08-01 **治理落差補記：UR-TODO-048 子階段 D、子階段 E 正式標記為已完成**。本文件先前僅記錄至子階段 C（PR #200），子階段 D（[PR #202](https://github.com/hyc640110/family-universal-rebalance/pull/202)，`feat/ur-todo-048-phased-clec-703-5050-templates`，merge commit `5173e6a60efc1bfd66c7bee89dbae239a02bec77`，`mergedAt: 2026-08-01T04:18:30Z`）與子階段 E（[PR #203](https://github.com/hyc640110/family-universal-rebalance/pull/203)，`feat/ur-todo-048-phasee-relabel-and-cash-target`，merge commit `87bf0188e644a4ce18542f7698d6f6cef4602d16`，`mergedAt: 2026-08-01T04:45:56Z`）已合併卻未同步進本文件，本次補齊。子階段 D 新增 `clec-703`（0/70/30）、`clec-5050`（0/50/50）兩組模擬限定樣板，經唯讀盤點發現實際修改位置為 `src/lib/allocationPresets.ts`（非提案原寫的 `clecStrategy.ts`），指令原禁止修改 `normalizeAllocationPreset` 與呼叫規格互相矛盾，已停止回報並經使用者明確追加授權「純資料性局部擴充」後才實作；未上 CLEC 策略中心清單。子階段 E 為使用者另外提出的兩項小變更：樣板顯示文字改為「7:3」「50:50」，以及模擬目標比例新增純模擬用現金項目（session-only，不連動正式資金欄位，不進差額摘要／交易方向清單；套用 CLEC 樣板時同步歸零現金以避免超過 100%）。兩者 Production 唯讀驗證與 `test:ci` 皆已通過。詳見下方更新後的 **UR-TODO-048**、**UR-TODO-048-D** 正式條目。

2026-08-01 **`allocationRoleBySymbol` 欄位清理唯讀盤點完成**（Claude Code，Review Mode，基準 `origin/main` HEAD `87bf0188e644a4ce18542f7698d6f6cef4602d16`，未修改任何檔案）。應使用者要求評估此欄位是否可清理，結論：全 Repository 僅 `App.tsx`（8 處）與 `syncState.ts`（1 處）引用，原本供 CLEC 433／442 套用權重的用途已被子階段 C／E 的 session-only 機制完全取代、子階段 B 移除 `AllocationPresetPanel` 後已無 UI 可再設定；但**非完全閒置**——`ClecStrategyCenterPage.tsx`「目前配置來源」卡片逐檔角色標籤目前仍讀取此欄位並顯示於 Production 畫面（僅不再影響任何計算）。清理本身在 localStorage／Firebase／Backup 三邊風險皆低，但需先由使用者決定 `ClecStrategyCenterPage` 角色欄位呈現方式（產品呈現決定），非本次盤點範圍能單方面判斷。**結論：暫不清理，維持「待評估」**，建議未來拆成「畫面決定」與「資料清理」兩個原子步驟處理。詳見下方更新後的 **UR-TODO-048** 正式條目。

2026-08-01 **UR-TODO-048 子階段 C 正式標記為已完成**，已由使用者手動 Merge [PR #200](https://github.com/hyc640110/family-universal-rebalance/pull/200)（`feat/ur-todo-048-phasec-clec-simulation-template`），merge commit `8f194b02513ff251902fb8e43c1d4634d9f9a9cf`。`AllocationSimulatorPage` 新增「套用 CLEC 442／433 權重樣板（試算）」區塊，重用既有純函式 `deriveAllocationPresetPreview`，角色資料採 component-local session-only 選擇器（不觸碰 `state.allocationRoleBySymbol`）；`ClecStrategyCenterPage` 在 `clec-smart-rebalance`／`annual-ratio-reset` 兩張卡片新增模擬器連結。隔離 Preview 環境（`workflow_dispatch` 部署）實測套用樣板正確產生目標比例、不影響 `state.holdings[].targetWeight` 與 `allocationPreset`；`test:ci` 645/645 通過；`Deploy GitHub Pages` workflow run `30672374531` success，headSha 與 merge commit 一致，Production／Preview HTTP 200 且環境隔離正常，Production 畫面唯讀確認正確呈現。**UR-TODO-048 狀態由「子階段 B 已完成，子階段 C 待開發」更新為「子階段 A～C 已完成」**。同時**新增 UR-TODO-048-D 提案**（CLEC 策略中心新增 703／5050 純模擬模板，狀態「待盤點」，由使用者於 2026-08-01 參考外部創作者「阿良的正二人生」與巫品寰「正二 50/50 策略」分享後提出，尚未授權開發）。詳見下方更新後的 **UR-TODO-048**、新增的 **UR-TODO-048-D** 正式條目。

2026-07-31 **UR-TODO-048 子階段 B 正式標記為已完成**，已由使用者手動 Merge [PR #198](https://github.com/hyc640110/family-universal-rebalance/pull/198)（`feat/ur-todo-048-phaseb-allocation-preset-custom-only`），merge commit `ca96b8b58b7d9cb42926ce5d6dbc6164e5050862`。狀態層於 `App.tsx:375` 單一收斂點固定回傳 `'custom'`；UI 層同一 PR 移除資產頁 `AllocationPresetPanel` 互動元件與其唯一寫入路徑，改為唯讀 `AllocationPresetSummary`。隔離 Preview 環境以模擬 legacy 資料驗證遷移前後 `targetWeight` 完全不變；`test:ci` 641/641 通過；`Deploy GitHub Pages` workflow run `30625373714` success，headSha 與 merge commit 一致，Production／Preview HTTP 200 且環境隔離正常；使用者已在自己的瀏覽器登入真實帳戶確認 Production 上實際持股 `targetWeight` 未受影響。**UR-TODO-048 狀態由「規劃中」更新為「子階段 B 已完成，子階段 C 待開發」**，子階段 C（CLEC 策略中心純模擬模板）尚未開始，需另行下達「開始開發」指示；`allocationRoleBySymbol` 欄位清理仍未評估。詳見下方更新後的 **UR-TODO-048** 正式條目。

2026-07-31 首次正式建檔 **UR-TODO-047**（負債模組與現金流固定支出清單重複計算風險盤點，狀態**已完成**，結論：無實際重複計算，風險等級「低」）與 **UR-TODO-048**（CLEC 433／442 移轉為 CLEC 策略中心純模擬模板，優先級待評估，狀態**規劃中**，子階段 A 唯讀盤點已完成）。此前兩個編號僅存在於 Claude Home（無 Repository 存取權）對話規劃中，Repository 內完全無記錄；本次為純治理文件同步，首次由具 Repository 存取權的 AI（Claude Code，Review Mode／唯讀盤點延伸）正式建檔，未修改任何 `src/`、`tests/`、schema、migration 或 UI 程式碼。UR-TODO-047 已完成、不需後續開發；UR-TODO-048 子階段 B／C 尚未開始，未經使用者明確下達「開始開發」不得建立功能 Branch 或實作。詳見下方新增的 **UR-TODO-047**、**UR-TODO-048** 正式條目。

2026-07-30 **UR-TODO-037 正式標記為已完成**。使用者確認選定「選項 2：中度保護」，`main` 已啟用 Branch Protection：`gh api repos/hyc640110/family-universal-rebalance/branches/main/protection` 實際查詢確認 `required_status_checks: {strict: false, checks: [{context: "verify"}]}`、`enforce_admins: false`、`required_pull_request_reviews.required_approving_review_count: 1`、`restrictions: null` 皆已生效，`gh api .../branches/main --jq '.protected'` 回傳 `true`。`verify` 為 `.github/workflows/ci.yml` 內唯一在 `pull_request` 事件觸發、可作為合併前必要檢查的 check name（以 `gh api .../check-runs` 實際查詢確認，非憑印象填寫；`deploy.yml` 的 `deploy` check 只在 push 後觸發，不適合作為合併前必要檢查，故排除）。GitHub Environments 人工核准**維持原狀，本次未處理**：確認 Repository 唯一的 `github-pages` Environment 是因啟用 legacy 分支部署模式而由 GitHub 自動建立，`deploy.yml` 未引用此 Environment，設定 reviewers 不會有實際效果，若要真正生效需另外授權修改 `deploy.yml`，使用者本次未要求執行，故此項不得標記為已完成，僅預設分支修正與 Branch Protection 兩項視為 UR-TODO-037 本次範圍內的完成項目。由於 Repository 僅有一名 collaborator、無第二人可核准 PR，`enforce_admins: false` 保留管理員繞過閥；使用者已確認「選項 A」：純治理文件同步 PR 的既有自動 Merge 政策維持不變，執行時可使用 `gh pr merge --admin` 繞過核准規則，但每次使用皆須在回報中明確告知，不得靜默執行，此規則已同步寫入 `007_GIT_WORKFLOW.md` §8.1。詳見下方更新後的 **UR-TODO-037** 正式條目。

2026-07-30 **UR-TODO-037 完成第 3 項（GitHub 預設分支修正）**。使用者於 Review Mode 發起「UR-TODO-037 Phase 1（唯讀盤點）」指令後，以 `gh api repos/hyc640110/family-universal-rebalance/environments`、`gh api .../branches/main/protection`、`gh api .../{owner}/{repo} --jq '.default_branch'` 等指令實際查詢確認：(1) GitHub Environments 僅有一個自動建立的 `github-pages` Environment，只有 `branch_policy` 類型規則、無 `required_reviewers`，且 `deploy.yml` 未宣告 `environment:` 欄位，即使設定 reviewers 也不會實際生效；(2) `main` 分支確認為 `Branch not protected`（404）；(3) 預設分支確認仍為 `gh-pages`。三項判定皆不需要超出目前 Repo Admin 的權限（Repository 為個人帳號、非 Organization，`gh auth status` 確認 token 已具 `repo` 完整 scope），故未觸發升級條件。使用者隨後明確授權修正第 3 項，已以 `gh api repos/hyc640110/family-universal-rebalance -X PATCH -f default_branch=main` 執行並驗證生效（`gh api`／`gh repo view` 皆回傳 `main`），GitHub Pages 部署來源（`source.branch: gh-pages`）為獨立設定不受影響，Production 網站實測 HTTP 200 未受影響。**Branch Protection、Environment 人工核准兩項仍待使用者決定政策內容後另行處理**，UR-TODO-037 狀態維持「部分完成」。詳見下方更新後的 **UR-TODO-037** 正式條目。

2026-07-30 **UR-TODO-044 正式標記為已完成**。已由使用者手動 Merge [PR #192](https://github.com/hyc640110/family-universal-rebalance/pull/192)（`feat/ur-todo-044-phase2b-variable-expense-migration`），merge commit `2fc8ce1d071df5bd428d00dd72518747f7a5cf27`，`mergedAt: 2026-07-30T10:47:11Z`。本次治理同步先唯讀核對：原「Phase 2b／2c」文字從未拆成兩個獨立子範圍，只有單一區塊「明確未處理，待使用者未來另行規劃」，其下僅列兩項驗收條件——(1) 決定「每月生活費預算」欄位存廢與整合方式、(2) 若涉及遷移需提出遷移方式／向後相容方案／回復方案／驗證方法；PR #192 兩項皆已完整達成，全庫搜尋亦確認無其他遺留的「生活費預算」相關程式碼未處理，故不保留「Phase 2c 待規劃」字樣，直接整體標記為已完成。範圍：`src/lib/cashFlow.ts` 新增可選欄位 `variableExpenseBudgetMigratedAt`；新增 `src/lib/cashFlowVariableExpenseBudgetMigration.ts` 三個純函式（確認遷移／忽略／觸發判斷，皆冪等）；`src/lib/householdLiquidityInputAdapter.ts` 的合成 living-expense 項目改為僅在欄位仍有待遷移正數時才注入，避免欄位清空後永久阻擋 `monthlyLivingExpenses`；`src/pages/CashFlowPage.tsx` 移除手動輸入欄位、新增一次性使用者確認提示（方案 B，非靜默自動遷移）；新增 8 個測試（`tests/cashFlowVariableExpenseBudgetMigration.test.ts`）並改寫 `tests/householdLiquidityInputAdapter.test.ts` 兩個既有測試反映新行為；`variableExpenseBudget` 欄位本身保留於 schema（永久可為 `null`），未從型別移除，localStorage／Firebase／JSON Backup 既有資料無需特殊相容分支。`CI Verification` run `30533633234` success，headSha 與 PR head 一致；`Deploy GitHub Pages` run `30536018542`（push 事件）success，headSha 與 merge commit `2fc8ce1` 一致；Production／Preview 本次以 `curl` 與隔離瀏覽器實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用；隔離瀏覽器階段（Preview 與 Production，未使用使用者實際資料）分別驗證確認／忽略兩條遷移路徑正確運作、重新整理不重複跳出、390px 手機寬度無橫向溢出、console 全程無錯誤。詳見下方更新後的 **UR-TODO-044** 正式條目。

2026-07-30 新增 **UR-TODO-046**（淨值成長來源歸因與記錄／實際落差核對），Phase 1 唯讀盤點已完成（Claude Code，Review Mode，基準 `origin/main` HEAD `a649cf361f65724eb35b2db63a8477a4189b2574`／PR #190，未修改任何檔案）。結論：`NetWorthSnapshot` 只有總額欄位、無成因拆解；`CashFlowProfile` 不歷史化、無時間戳，與有時間戳的 `FinancialTransaction` 屬兩套互不相通的資料模型；`householdLiquidity.ts` 的 `dataCompleteness` 為單一時間點輸入品質分類，不能直接沿用於跨時間落差比對；既有 `deriveInvestmentPerformanceQuality` 已明確寫死 `canCalculateCagr: false`／`canCalculateXirr: false`，缺口與本功能同源。已觸發停止與升級條件（需核心資料結構層級變更），成本評估為**大**。狀態訂為**待評估**，明確依賴 **UR-TODO-043-B**（日期／時區契約）定案後才排程，並與 **UR-TODO-023**（月底自動對帳，比對對象不同）劃清邊界。詳見下方新增的 **UR-TODO-046** 正式條目。

2026-07-29 **UR-TODO-005（00685L、00895 名稱持久化）已完成**。Phase 1 唯讀盤點確認名稱解析有三層防護（既有名稱 > `SYMBOL_NAMES` 內建對照表 > 代碼本身），空字串不會覆蓋既有名稱，更新股價／reload／Firebase／Backup 四個持久化情境皆經同一正規化路徑，封存／恢復不觸碰名稱欄位。已由使用者手動 Merge [PR #189](https://github.com/hyc640110/family-universal-rebalance/pull/189)，merge commit `3b4549e2d868131a158772530aad16ee3145e415`，新增 12 個行為測試涵蓋此邏輯（`src/lib/holdingNameResolution.ts`，自 `App.tsx` 逐字搬移，零邏輯改動）。`sanitizeHolding()` 本身因牽動 `REMOVED_SYMBOLS`／環境變數耦合，未完整測試，保留原狀，列為未來待討論項目。詳見下方更新後的 **UR-TODO-005** 正式條目。

2026-07-29 **UR-TODO-004（同一畫面內成長／防守資產比例小數位數不一致，原標題「桌機／手機目前偏離目標一致性」）已完成**。Phase 1 唯讀盤點證實原「桌機／手機顯示不同數字」假設不成立（唯一計算來源 `rebalance()` 只計算一次，`isMobile` 不介入計算），實際問題為同畫面內五處獨立格式化函式小數位數不一致，已由使用者手動 Merge [PR #186](https://github.com/hyc640110/family-universal-rebalance/pull/186)（`src/App.tsx` 的 `pct()` 統一為 1 位）與 [PR #187](https://github.com/hyc640110/family-universal-rebalance/pull/187)（跟進 `investmentHealth.ts` 第五處）修正，merge commit 分別為 `06f7f4c28bd6ee6cef9e947f4dbf371436cba04c`、`4e2975aa8686fe3ca8d0a4ba92af5a9709d1ce69`。兩支 PR 的 `Deploy GitHub Pages` workflow 皆成功，Production／Preview HTTP 200 且環境隔離正常。詳見下方更新後的 **UR-TODO-004** 正式條目。

2026-07-29 **UR-TODO-044 Phase 2a（角色未設定 fallback 修正）已完成**。已由使用者手動 Merge，[PR #184](https://github.com/hyc640110/family-universal-rebalance/pull/184)（`feat/ur-todo-044-phase2a-role-fallback-consistency`）為 **MERGED**，merge commit `498941ae46aeb5806904103c4513e25f87555999`，`mergedAt: 2026-07-29T13:42:57Z`。範圍：`src/lib/householdLiquidityInputAdapter.ts` 的 `cashFlowRole()` fallback 由「3 類 ambiguous、5 類靜默 essential-living」改為 8 類一律 `'ambiguous'`；同步修正 `src/lib/householdLiquidityInputDiagnostics.ts` 內未同步的重複判斷邏輯 `requiresExplicitRole()`，避免診斷引導訊息與計算層行為不一致。`CI Verification` run `30457065192` success；`Deploy GitHub Pages` run `30457308734` success，headSha 與 merge commit 一致；Production／Preview HTTP 200 且環境隔離正常；隔離瀏覽器階段實測 8 個分類角色未設定時皆一致顯示「尚未指定家庭流動性用途」引導訊息。詳見下方新增的 **UR-TODO-044** 正式條目，含 Phase 1（唯讀盤點）結論與 Phase 2b／2c（生活費預算欄位存廢與資料遷移）範圍界定。

2026-07-29 治理文件同步（UR-TODO-045 基線同步，Review Mode／純治理文件同步，於隔離 worktree `family-universal-rebalance-ur-todo-045-governance` 執行，未修改任何 `src/`／`tests/` 程式碼）：新增 **UR-TODO-045**（淨資產歷史頁面新增收合／分頁功能）正式條目，狀態**已完成**，完成 PR [#182](https://github.com/hyc640110/family-universal-rebalance/pull/182)（merge commit `ee5595a3bd85291d29c3242bb7c0f1d3ba93aade`）。詳見下方 UR-TODO-045 條目。

2026-07-29 治理文件同步（PR #178／#179 基線同步，Review Mode／純治理文件同步，於隔離 worktree `family-universal-rebalance-bundle-sync` 執行，未修改任何產品程式，未開始 UR-TODO-043-C2，未修改任何首頁 UI）：**PR #178**（「docs: sync PR #176-177 baseline into governance docs」）已由使用者手動 Merge，merge commit `4280ac44e6dd814eb0054ed1cd2012e7c8242c1e`，`mergedAt: 2026-07-28T17:59:01Z`，正式完成 PR #176／#177 後治理同步（記錄 UR-TODO-043-C1 正式記錄與 Cash Flow 儲存動作位置調整），純治理文件同步，未改動任何現行 UR-TODO 狀態。**PR #179**（「docs: reconfirm UR-TODO-030 homepage 30-second decision center direction」）已由使用者手動 Merge，merge commit `94c3d08d1a18d4d81d41b003d1cc5f5e41231d24`，`mergedAt: 2026-07-28T18:15:50Z`，正式再次確認下方 UR-TODO-030 條目的「30 秒決策中心」方向為既有產品決策，完整保留；**未修改首頁 UI，未開始 UR-TODO-043-C2**。**最新正式 `origin/main` 為 `94c3d08d1a18d4d81d41b003d1cc5f5e41231d24`。UR-TODO-043 整體維持 P2／待盤點，043-A、043-C1 已完成，043-C2 仍為下一直接起點**；首頁簡化仍屬 UR-TODO-030／Dashboard UX 待盤點範圍，不得混入 043-C2，未經使用者明確下達「開始開發」不得建立功能 Branch 或開始實作。

2026-07-29 補充確認：**UR-TODO-030 首頁「30 秒決策中心」改版方向為既有產品決策，本次唯讀再次確認仍完整保留**（詳見下方 UR-TODO-030 條目 2026-07-29 補充段落）——首頁未來應只回答「今天是否需要做什麼」，建議保留今日是否需操作／精簡資產總覽／更新狀態三項，使用者已明確表示很少查看目前首頁大量資訊，「今日投資狀態」未來可移到分析頁或收合為一行摘要。本次**未修改任何首頁 UI**，此項仍屬 Dashboard UX／UR-TODO-030 待盤點範圍，**與 UR-TODO-043-C2 無關**，不得因 043-C2 而順便處理。

2026-07-29 治理文件同步（PR #176／#177 基線同步，Review Mode／純治理文件同步，於隔離 worktree `family-universal-rebalance-bundle-sync` 執行）：**PR #176**（「docs: record UR-TODO-043-C1 normalization audit」）已由使用者手動 Merge，merge commit `272cd4a9ccff0c2def7bf0c73afbdbdf89363d58`，`mergedAt: 2026-07-28T16:49:20Z`，正式記錄下方 UR-TODO-043-C1 條目的唯讀盤點結論並重新產生 Bundle；下方原文「本治理同步 PR 待 Merge」已過期，更正為已合併，**UR-TODO-043-C1 結論內容本身不變**。**PR #177**（「fix: move cash flow save actions below expenses」）已由使用者手動 Merge，merge commit `c8b6c95a60a7d3c60e4eb85b7d9889427dc30d5d`，`mergedAt: 2026-07-28T17:21:20Z`，僅將收支與現金流中心「儲存現金流設定」「清空設定」移到固定支出清單下方，未修改 `cashFlowProfile` schema、`liquidityRole`、`linkedLoanId`、Household Liquidity 公式，與 UR-TODO-043 無耦合，唯讀盤點確認未改動任何現行 UR-TODO 狀態。**UR-TODO-043 整體維持 P2／待盤點，043-A、043-C1 已完成，下一候選仍為 043-C2**，未經使用者明確下達「開始開發」不得建立功能 Branch 或開始實作。

2026-07-29 **UR-TODO-043-C1 快照無效值與跨 consumer 正規化契約唯讀盤點**已完成（已於 PR #176 正式記錄，見上方最新段落）。已確認 `src/lib/netWorthHistory.ts` 的 `normalizeNetWorthHistory` 對 `totalAssets`、`netWorth`、`investmentValue`、`cash`、`debt` 使用寬鬆 `Number(...)` 轉換並將 undefined、null、空白、不可解析、NaN、Infinity、-Infinity 轉為 `0`；負數與明確 `0` 保留。`src/lib/investmentPerformanceHistory.ts` 的 `normalizeInvestmentPerformanceHistory` 只接受正確曆日格式與五個完整有限 number 欄位，否則排除整筆。AppState 在 localStorage 讀取／寫入、Firebase 下載、JSON Backup 匯入及 state 更新均先走前者，因此原始 missing／invalid 可在 consumer 前永久失去語意。C1 僅盤點與執行既有 15/15 characterization tests，未修改 Production 程式、日期、schema、migration、UI 或 expectation。**UR-TODO-043 整體維持 P2／待盤點，C1 不代表 Todo 完成。**

2026-07-29 **UR-TODO-043-A Characterization Tests** 已由使用者手動 Merge，[PR #174](https://github.com/hyc640110/family-universal-rebalance/pull/174) 為 **MERGED**（merge commit `9ac2cef82bad3a0a793f0db971d604c2b3e79463`，`mergedAt: 2026-07-28T16:22:11Z`）；Deploy GitHub Pages workflow run `30377915466` 成功，headSha 一致。範圍只新增 characterization tests，未修改 Production 程式、日期契約、schema、migration、UI、Dashboard、Analytics、AI Decision、Rebalance、相依套件或 `package-lock.json`。測試鎖定三項現況風險：日期鍵受執行時區影響、同日快照依陣列最後一筆而非 timestamp 選取、淨資產歷史將無效值轉 0 而 Analytics 嚴格排除。**這些結果不代表理想契約，也不構成公式錯誤的結論。UR-TODO-043 整體維持 P2／待盤點。**建議下一步為 043-C Review Mode 的跨 consumer 正規化與相容性盤點，043-B 日期產品契約決策排在其後。

本文件是 Universal Rebalance 所有未完成事項的單一正式來源。

**新想法請先進 `019_Idea_Pool.md`，經評估後才轉為正式 UR-TODO 項目**（2026-07-25 V7.0A 新增規則，見 `016_Product_Decisions.md` 第 9 節「模式切換」）。本次新增規則不改動既有任何 UR-TODO 的優先級或狀態，現行 P0～P4 五級制維持不變。

家庭流動性、安全存量與可投資現金主題的詳細架構規格，以 `013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）為唯一正式來源；本文件只保存 Todo 狀態、Sprint 邊界與驗收摘要。

2026-07-28 家庭流動性資料關聯與診斷子 PR 1 已由使用者手動 Merge，[PR #167](https://github.com/hyc640110/family-universal-rebalance/pull/167) 為 **MERGED**（merge commit `9d6f5a0da53d213661796968622e7fc5ef7ebf50`）；其範圍只新增 `deriveHouseholdLiquidityInputDiagnostics` 與 provenance characterization tests，明確區分 Cash Flow Profile 缺失、Loan 來源不可用、未連結借款與有效 Loan 陣列下的失效連結。

2026-07-28 家庭流動性資料關聯與診斷子 PR 2 已由使用者手動 Merge，[PR #169](https://github.com/hyc640110/family-universal-rebalance/pull/169) 為 **MERGED**（merge commit `fc1ca090661148ed057420fd9ad2386d9eec03fc`，`mergedAt: 2026-07-28T14:18:03Z`）；Deploy GitHub Pages workflow run `30367680077` 成功，headSha 一致。Production／Preview HTTP 200，metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。範圍只提供 Cash Flow 固定支出的既有 `liquidityRole` 與 debt-payment `linkedLoanId` 操作介面、必要 Loan 資料傳入與呈現測試；不自動推測角色或 Loan，保留 orphan link，離開 debt-payment 時依既有 normalizer 移除連結。未修改 Household Liquidity 核心公式、blocking reason code、正式 consumer、schema、Firebase、Backup 或 Import／Export。

2026-07-28 家庭流動性資料關聯與診斷子 PR 3 已由使用者手動 Merge，[PR #171](https://github.com/hyc640110/family-universal-rebalance/pull/171) 為 **MERGED**（merge commit `778767036853bbbab0da7ba64f3df4887c6c0d70`，`mergedAt: 2026-07-28T15:18:53Z`）；Deploy GitHub Pages workflow run `30372749694` 成功，headSha 一致。Production／Preview HTTP 200，metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。範圍只新增共用 diagnostics presentation helper 與清單元件；App 只計算一次 diagnostics，傳入 Analytics、Risk Center 與 AI Decision，三頁的診斷文字與排序一致，預設顯示最高優先三項並可展開完整清單。未修改 Household Liquidity 核心公式、blocking reason code、adapter、AI Decision 結論、核心金額、Cash Flow 角色 UI、schema、Firebase、Backup 或 Import／Export。

**家庭流動性資料關聯與診斷修正：子 PR 1、子 PR 2、子 PR 3 均已完成並合併。**程式、測試、隔離 Preview 驗收、Merge 與部署已完成；但 Production 公開端點無法在不操作使用者本機資料下重現代表性診斷情境，三頁 Production 互動資料驗收仍為**待盤點**，故整體 Sprint 暫不標記為正式結案。Remaining Boundary 僅為此唯讀 Production 資料驗收，不得藉此擴大至 UR-TODO-043、首頁縮減、資產頁股價更新明細收合或淨資產歷史收合。

2026-07-27 **UR-TODO-009 子 PR6 — AI Decision §24 契約** 已由使用者手動 Merge，[PR #145](https://github.com/hyc640110/family-universal-rebalance/pull/145) 為 **MERGED**（merge commit `5aa1d9e3c4fc364059b4fd6ab4a4de6bc34a594e`）；PR CI run `30211956784` 與 Deploy GitHub Pages workflow run `30212166683` 皆成功。Production HTTP 200、`environment=production`；AI Decision 正式 bundle 已接入 Household Liquidity 契約，資料不足與安全存量不足均阻擋投資建議，`investableCash === 0` 維持保留現金語意。UR-TODO-009 整體狀態維持**開發中**，下一個未完成項目為子 PR7，目前沒有已授權的下一主線。分析頁完整 `todayDecision` 是否承接仍為產品決策，不新增正式 UR-TODO。

2026-07-23 已完成舊對話待辦遺漏比對，補登 UR-TODO-026～035。以上項目仍須以最新 main 唯讀盤點後確認實際狀態。

2026-07-24 依「最新基線與 AI 治理文件唯讀差異盤點」（PR #102～#105 唯讀實證）更新 UR-TODO-006、UR-TODO-007 狀態，並補登 UR-TODO-036、UR-TODO-037。

2026-07-24 Sprint「Deployment CI Reproducibility & Test Gate」（CI-01／CI-02／UR-TODO-037 部分範圍）將 UR-TODO-037 更新為部分完成，並記載尚未完成的 GitHub Environment 人工核准、Branch Protection、預設分支修正等延後範圍。

2026-07-24 PR #107（merge commit `eebee98e226501dddace68ac14505937096c6c08`）合併後，對應 Deploy GitHub Pages workflow run `30096396958` 實測失敗（`npm ci` 後 `tsx: not found`，exit code 127）。測試閘門正確中止部署，Production／Preview 仍停留在上一個成功部署版本（`0d2ec05`）未受影響。補登 UR-TODO-038 追蹤此 Hotfix；CI-01、CI-02 狀態改為「開發中／待真實 CI 驗證」，不得標記已完成。

2026-07-24 UR-TODO-038 根因確認為 `package-lock.json` 有 56 個條目的 `resolved` 指向內部沙盒網關 `applied-caas-gateway1.internal.api.openai.org`，而非公開 `registry.npmjs.org`；`package.json` 8 個 `"latest"` 套件已改為固定版本（沿用舊 lockfile 鎖定值），`package-lock.json` 僅正規化上述 56 個 `resolved` 欄位，version／integrity／依賴樹／`lockfileVersion` 完全不變。同時記錄並拒絕採用「完整重新解析 lockfile」路徑產生的 223 條目、TypeScript 7 版本樹（本專案禁止非必要依賴升級）。

2026-07-24 修正 Commit `ed24f84ed7e0b329abce3418a8f9af6ddea0def8` 已 Push 到 Draft PR #108，對應 `CI Verification` run `30101961703` 已於真實 GitHub-hosted Ubuntu runner 完整成功。UR-TODO-038、CI-01、CI-02 狀態更新為「Hotfix 已完成，待 PR Merge／Production 驗證」，尚未 Merge，不得標記為完全已完成。

2026-07-24 PR #108 已由使用者手動 Merge（merge commit `0ae17a1716b32a5cdc67227a26549bec964a307c`），對應 Production `Deploy GitHub Pages` workflow run `30103172752` 成功，`gh-pages` 已更新，Production／Preview HTTP 200 且環境隔離正常，`package-lock.json` 正式基線已無內部 gateway URL。依完成標準（程式碼完成＋自動測試通過＋Preview 驗收通過＋PR Merge＋Production 唯讀驗證通過），UR-TODO-038、CI-01、CI-02 正式標記為**已完成**。其餘 Todo 狀態不受本次更新影響。

2026-07-24 PR #109（跨 AI 交接制度＋Full／Lite Bundle，merge commit `4a95a8abe3c3b58359cb6ce5caa65cde4b14928d`）與 PR #110（PR #109 Merge 後治理文件補同步，merge commit `081bf91267d4a28c2c118266feb62379fa01fc64`）皆為治理文件／交接制度變更，唯讀盤點確認兩者內容均未涉及任何現行 UR-TODO 項目，本文件狀態不變動。

2026-07-24 針對 UR-TODO-001 執行 Repository 唯讀盤點（未存取 Firebase Console），確認 App 未整合 Firebase Auth、Preview／Production 共用同一 Firebase 專案／RTDB 實例（僅靠路徑前綴隔離）、Database URL 與 secretPath 皆為使用者手動輸入；現行 Security Rules 內容與到期日期仍無法從 Repository 確認，需 Firebase Console 存取權限。狀態維持「待盤點」，詳見下方 UR-TODO-001 項目。

2026-07-25 使用者本人於 Firebase Console 唯讀查證 UR-TODO-001：專案 `l-pro-web-app`（原記載「`my-00662`」為治理文件誤植，已於 2026-08-05 更正）、資料庫 `l-pro-web-app-default-rtdb`，現行規則為 `now < 1785168000000`（到期日 2026-07-28）、到期前完全公開讀寫、到期後 Firebase 預設轉為全部拒絕（權限自然收斂，非資料外洩）。使用者拍板決策：不在到期前修改規則、接受自然到期、正式 Firebase Auth 方案列為未來獨立 Sprint。UR-TODO-001 狀態由「待盤點」更新為**「已盤點」**，正式解法仍為「待開發」，不得標記為「已完成」。

2026-07-25 落地 V7.0A（Foundation & Product Governance）：新增 `016_Product_Decisions.md`（永久產品治理決策）、`017_Design_System.md`、`018_Dashboard_UX_Guideline.md`（骨架，內容待補完）、`019_Idea_Pool.md`（空白，含收錄規則）；`013_HOUSEHOLD_LIQUIDITY_SPEC.md` 升版為 v4.0（新增與產品版本 V7.0B 的對應說明，核心內容未變）。本文件新增「新想法先進 Idea Pool」規則，未改動任何既有 UR-TODO 的優先級或狀態，不新增任何 UR-TODO 項目。

2026-07-25 產品版本 V7.0B（Financial Liquidity Core）子 PR 1／5（buy-only 模式改用 investableCash）已由使用者手動 Merge，PR #116，merge commit `3882e713ebb03f5f4d14408a66f566c4fcf20848`，對應 Production `Deploy GitHub Pages` workflow run `30151027865` 成功，`gh-pages` 已更新，Production／Preview HTTP 200。UR-TODO-008 狀態由「待開發」更新為**「開發中」**，詳細規格參照同步更正為 `013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0，取代過期的 `013_Household_Liquidity_Model_Spec_v3.0.md` 檔名參照）。子 PR 2～5 尚未開始，其餘 Todo 狀態不受本次更新影響。

2026-07-25 PR #117（`docs: update UR-TODO-008 status to in-progress`，merge commit `aef8b5d88aca9fcdd4bc475308e341be896e12ee`）同步 UR-TODO-008 狀態為「開發中」並記錄子 PR 1／5 已完成，純文件變更，唯讀盤點確認未改動其餘 Todo 狀態。

2026-07-25 產品版本 V7.0B（Financial Liquidity Core）子 PR 2／5（standard 模式改用 investableCash）已由使用者手動 Merge，PR #118，merge commit `ff08e0508190201ed2a0ed7a56f381228ca5c1ea`，對應 Production `Deploy GitHub Pages` workflow run `30152021243` 成功。standard 模式的 `availableBuyBudget`／`cashShortfall`／`remainingBudget` 改用 `investableCash`，`investableCash === null` 阻擋條件由僅限 buy-only 擴大為兩種模式皆適用。UR-TODO-008 狀態維持「開發中」，本次更新描述文字反映子 PR 2／5 已完成、子 PR 3～5（Order Helper／Dip Alert、Execution Eligibility 呈現層）尚未開始，其餘 Todo 狀態不受本次更新影響。

2026-07-25 PR #119（`docs: sync PR #111-118 baseline into governance docs`，merge commit `861340f273df5fe3868be5dd8d385f4bd8f0ac58`）為純治理文件同步，唯讀盤點確認未改動任何現行 UR-TODO 狀態。

2026-07-25 產品版本 V7.0B（Financial Liquidity Core）子 PR 3／5（Execution Eligibility investableCash contract）已由使用者手動 Merge，PR #120，merge commit `26b8a864e51cd29e8e53405d52a15b8fdac94f8e`，對應 Production `Deploy GitHub Pages` workflow run `30153776664` 成功。範圍僅限 `src/lib/rebalanceExecutionEligibility.ts` 與其測試檔：新增 013 §12.3 三個獨立欄位（`investableCash`／`executableAmount`／`externalFundingRequired`），移除舊版混用 CLEC `availableCash` 語意的死碼判斷；未觸碰 `App.tsx`、`RebalanceRecommendationPage.tsx`、Order Helper、Dip Gate、CLEC。UR-TODO-008 狀態維持「開發中」，描述文字更新為子 PR 3／5 已完成，子 PR 4～5（Order Helper／Dip Alert）尚未開始，其餘 Todo 狀態不受本次更新影響。

2026-07-25 PR #121（`docs: sync PR #119-120 baseline into governance docs`，merge commit `8fb33250f577b11895032fb84f5e612b676d183e`）為純治理文件同步，唯讀盤點確認未改動任何現行 UR-TODO 狀態。

2026-07-25 產品版本 V7.0B（Financial Liquidity Core）子 PR 4a／5（Order Helper characterization test 安全準備）已由使用者手動 Merge，PR #122，merge commit `a06890da3b07d4e79b95f0c5ed65c883618480e5`，對應 Production `Deploy GitHub Pages` workflow run `30161023942` 成功。範圍：將 `App.tsx` 內的 `getOrderSuggestions` 邏輯抽出為純函式 `src/lib/rebalanceOrderHelper.ts`，新增 `tests/getOrderSuggestions.test.ts` characterization test 覆蓋既有行為，`package.json` 新增對應測試腳本；本次為行為保留（characterization）性質的重構，**不涉及 investableCash 契約串接**，屬於子 PR 4a／5，子 PR 4b／5（investableCash 串接）另行處理。UR-TODO-008 狀態維持「開發中」，描述文字更新為子 PR 4a／5 已完成，子 PR 4b／5（Order Helper investableCash 串接）待啟動，子 PR 5（Dip Alert）尚未開始，其餘 Todo 狀態不受本次更新影響。

2026-07-25 PR #123（`docs: sync PR #121-122 baseline into governance docs`，merge commit `51b38ded7e9b53520c339ebe5e510f5ea8ff5380`）為純治理文件同步，唯讀盤點確認未改動任何現行 UR-TODO 狀態。

2026-07-25 產品版本 V7.0B（Financial Liquidity Core）子 PR 4b／5（Order Helper investableCash 串接）已由使用者手動 Merge，PR #124，merge commit `35859afc0e21e5f995c8303e0b4286f77c283f86`，對應 Production `Deploy GitHub Pages` workflow run `30161990720` 成功。範圍：`src/lib/rebalanceOrderHelper.ts` 的 `getOrderSuggestions` 新增第 4 個參數 `investableCash: number | null`，`buyOnlyLimit`／`remainingBudget`／`shortage`／`cashEnough`／`cashLimited` 全部改用 investableCash 為基準（`null` 時保守視為 0，輸出欄位本身仍維持 `null`，不偽裝成 0）；`App.tsx` 呼叫端改傳入 `householdLiquidityForRebalance.investableCash`，`getFundingSource` 改重用 `orderHelper.cashEnough`，交易建議清單卡片新增「可投資現金」欄位；`tests/getOrderSuggestions.test.ts` 原 13 個子 PR 4a characterization test 期望值不變，新增 6 個邊界案例（19/19 通過）。UR-TODO-008 狀態由「開發中」更新為**「子 PR 1～4b／5 已完成，子 PR 5（Dip Alert 資金資格判斷）待啟動」**，其餘 Todo 狀態不受本次更新影響。

2026-07-25 PR #125（`docs: sync PR #123-124 baseline into governance docs`，merge commit `4c26d0037004fe0766e2498372de14fd479796e7`）為純治理文件同步，唯讀盤點確認未改動任何現行 UR-TODO 狀態。

2026-07-25 產品版本 V7.0B（Financial Liquidity Core）子 PR 5a／5（Dip Alert characterization test 安全準備）已由使用者手動 Merge，PR #126（`feat/v7-0b-dipalert-characterization`）MERGED，merge commit `122c9d12129078b5e0b90896275706f04bf579d7`，對應 Production `Deploy GitHub Pages` workflow run `30163433903` 成功。範圍：將 `App.tsx` 內逢低加碼觀察清單的純價格判斷邏輯抽出為 `src/lib/dipAlertEngine.ts` 的 `getDipAlertRows` 純函式，`DipAlertSetting`／`DipAlertRow` 型別與共用函式一併移入；新增 `tests/dipAlertRows.test.ts` 17 個 characterization test；行為保留性質重構，**不涉及 investableCash 資金資格判斷**，屬子 PR 5a／5，子 PR 5b／5（investableCash 串接）另行處理。UR-TODO-008 狀態維持「開發中」，描述文字更新為子 PR 5a／5 已完成，子 PR 5b／5（investableCash 資金資格判斷串接進 Dip Alert）待啟動，其餘 Todo 狀態不受本次更新影響。

2026-07-25 產品版本 V7.0B（Financial Liquidity Core）子 PR 5b／5（investableCash 資金資格判斷串接進 Dip Alert，013 §14.2）已由使用者手動 Merge，PR #127（`feat/v7-0b-dipalert-investablecash`）MERGED，merge commit `83431910a7948d32f52deb0b98715080286f3fb3`，對應 Production `Deploy GitHub Pages` workflow run `30164426224` 成功。範圍：新增 `DipFundingStatus`（`no-signal`／`data-insufficient`／`safety-cash-priority`／`observe-only`／`executable`）與純函式 `deriveDipFundingStatus`，落實 013 §14.2 五列狀態矩陣；`getDipAlertRows` 新增第 4 參數 `liquidity`，重用 `householdLiquidityForRebalance` 既有 `investableCash`／`dataCompleteness`／`safetyCashShortfall`，不另建計算；`triggered`／純價格 `status` 判斷邏輯完全未變，與 `fundingStatus` 明確分離；UI 依 013 §14.3 於 `executable` 狀態顯示可投資現金／本次可執行加碼／未滿足理論需求三行金額，其餘三種狀態顯示對應限制說明；`tests/dipAlertRows.test.ts` 擴充至 24 個測試（5a 既有 17 個 `triggered`／`status` 斷言逐字未變＋新增 7 個涵蓋五列矩陣與防禦性邊界案例）。驗收時發現使用者於「收支與現金流中心」設定「額外投入資金」「預計提領資金」以驗證三種資金情境時，這兩個欄位 UI 顯示「已設定」但實際未寫回 `cashFlowProfile`／localStorage（重新整理後消失），屬 PR #105（V6.17.3A Plan Input Foundation）既有功能缺口，與本次子 PR 5b 無關，已補登為 UR-TODO-039（狀態「待盤點」）。**UR-TODO-008 狀態由「開發中」更新為「已完成」**，子 PR 1～5b／5 全數完成，其餘 Todo 狀態不受本次更新影響。

2026-07-26 PR #128（`docs: add Sprint Summary format, ADR record (020), and handover Knowledge Delta`，merge commit `99ef6bf7d366f5dcd3c45573bf4d5edbd3f43f41`）為純治理文件同步，新增 `007_GIT_WORKFLOW.md` §7.4 Sprint Summary 回報格式、`012_AI_HANDOVER.md` Knowledge Delta／ADR 欄位與治理文件同步時機規則、`020_Architecture_Decisions.md` ADR 記錄檔（ADR-001、ADR-002），唯讀盤點確認未改動任何現行 UR-TODO 狀態。

2026-07-26 PR #129（`docs: sync PR #125-128 baseline into governance docs`，merge commit `2ad28f33d23de4ec053078578eaee8c8730a078c`）為純治理文件同步，唯讀盤點確認未改動任何現行 UR-TODO 狀態。

2026-07-26 **UR-TODO-039**（收支與現金流中心「額外投入資金」「預計提領資金」欄位未實際寫回 `cashFlowProfile`）已由使用者手動 Merge，PR #130（`fix/v7-cashflow-plan-input-save-attach`）MERGED，merge commit `3f8258168ddbeb5e28ae2a5e312a26b7e055fe26`，對應 Production `Deploy GitHub Pages` workflow run `30183361782` 成功。修復方向：`src/pages/CashFlowPage.tsx` 將「家庭流動資金計畫」區塊（額外投入資金／預計提領資金）從獨立於「每月設定」卡片之外的另一張卡片，移入「每月設定」卡片內、緊接在唯一的持久化出口「儲存現金流設定」按鈕之前，不再是獨立卡片，並補充一句提示文字；`src/styles.css` 同步調整 `.cashflow-form` grid-column 規則與新增分隔線樣式；`tests/householdLiquidityPlanInputEntryPoint.test.ts` 新增測試 8（以原始碼結構位置驗證欄位已移入卡片內、按鈕之前），`test:ci:unit-ts` 491/491；純 UI／CSS 調整，未變更任何函式邏輯、資料契約或 `localStorage` schema；明確不包含 `householdLiquidityInputAdapter.ts`、`cashFlow.ts`、`householdLiquidityPlanInputUi.ts` 邏輯。PR 內文附本機 dev server 唯讀驗收記錄：設定金額 → 點擊儲存 → `localStorage` 確認已寫入 → `window.location.reload()` → 確認數值未遺失，390px 無橫向溢出，console 無錯誤。**UR-TODO-039 狀態由「待盤點」更新為「已完成」**，其餘 Todo 狀態不受本次更新影響。

2026-07-26 修正 `src/pages/ToolsPage.tsx` 過時文案（頁面說明「進階投資工具將在後續版本逐步提供」與底部提示「這些入口目前不會產生模擬結果；完整功能將於後續版本提供」，與現況不符——`TOOL_DEFINITIONS` 16 個工具已有 12 個為完整可用功能），改為明確區分「已上線」與「規劃中」兩類工具的文案，不涉及任何 Todo 狀態變更。同時新增 **UR-TODO-040**（工具分頁扁平版面與重複導覽路徑，狀態「待盤點」，僅記錄發現，作為 UR-TODO-011 的前置輸入，不在本次處理）。

2026-07-26 於 **UR-TODO-030**（首頁「重要提醒」重複性盤點）補充使用者與 ChatGPT 討論記錄（2026-07-26）：首頁改版方向建議重新定位為「30 秒決策中心」，只回答「今天需不需要做什麼」，並列出建議保留的三項內容（今日是否需操作、資產總覽、更新狀態）與「今日投資狀態」處理方向的兩個未拍板選項。**不新增獨立 Todo 條目**，僅補充於既有 UR-TODO-030 內，避免與該條目本身要解決的「重複」問題自相矛盾；明確標註此為 Sprint 6／UR-TODO-011 階段的呈現層輸入，非本次或 UR-TODO-009 範圍。UR-TODO-030 狀態維持「待盤點」，其餘 Todo 狀態不受本次更新影響。

2026-07-26 於 **UR-TODO-027**（趨勢圖剩餘視覺與刻度問題）補充使用者提供的明確需求，取代原本模糊的「綠色漸層需求是否仍保留」：趨勢圖線下方應依走勢方向顯示漸層填色（區間內上漲＝紅色漸層、下跌＝綠色漸層，符合台股紅漲綠跌慣例，參考樣式為 Google 財經個股走勢圖）。本次已唯讀確認 `src/components/TrendChart.tsx`：目前僅繪製 `<path>` 折線（`stroke="currentColor"`）與資料點 `<circle>`，**完全沒有任何 `<linearGradient>`／填色區域**，`src/styles.css` 的 `.trend-chart` 相關規則也未定義漸層；因此本項為**新增需求，非既有功能的行為調整**。本次僅補充需求文字，**不進行程式開發**，UR-TODO-027 狀態維持「待盤點」，其餘 Todo 狀態不受本次更新影響。

2026-07-26 **UR-TODO-009**（Risk & Decision Workflow Integration，Sprint 4）子 PR 1／2（安全準備 characterization test）已由使用者手動 Merge，PR #134 MERGED，`todayDecision`／`investmentHealth` 純搬移至 `src/lib/`，新增 25 個 characterization test，無邏輯變更。使用者本人針對唯讀盤點報告提出的兩項架構決策正式拍板：**決策一**，`riskMetrics.ts` 改為讀取 `householdLiquidityForRebalance` 輸出（維持單一事實來源、下游只讀不重算原則），作為子 PR 3 正式範圍依據；**決策二**，「負債資料過期警示」延後處理、不納入本次 Sprint 4 子 PR 4 範圍（需擴充 013 §6 核心輸入契約，牽動核心模型，不符合一次只做一件事原則），改列為新增的 **UR-TODO-041**（狀態「待盤點」）。UR-TODO-009 狀態由「待開發」更新為**「開發中」**，子 PR 3、4 範圍說明已依兩項決策更新，子 PR 3 以後仍待使用者明確下達「開始開發」指示後才會啟動。

2026-07-26 **UR-TODO-009** 子 PR 3／N（riskMetrics.ts 改讀 Household Liquidity 輸出，013 §22）已由使用者手動 Merge，PR #137 MERGED，`cashSafetyMonths`／`minimumCashTarget`／`stableCashTarget` 改為讀取 `householdLiquidityForRebalance` 輸出，取代舊版 cash÷monthlyPayment 公式；新增 `tests/riskMetrics.test.ts` 14 個測試；`RiskCenterPage.tsx`／`PortfolioRiskPage.tsx`／`AiDecisionCenterPage.tsx`／`DashboardDecisionPage.tsx` 皆未修改。同時調整 **UR-TODO-041** 優先級由 P1 改為**「待評估」**（優先級待正式盤點完成後再評定，避免提前膨脹），狀態維持「待盤點」；新增 **UR-TODO-042**（`PortfolioRiskPage.tsx`「槓桿暴露」卡片 React 重複 key console error，子 PR 3 驗收時發現的既有缺陷，與本次 riskMetrics 改動無關，狀態「待盤點」）。UR-TODO-009 其餘子 PR 狀態不受本次更新影響。

2026-07-27 **UR-TODO-009**（Risk & Decision Workflow Integration，Sprint 4）子 PR 4～7 已陸續由使用者手動 Merge：子 PR 4（PR #140，merge commit `389a4f48aa441947a32cc8ea56c60a029b94855e`，Risk Center／Portfolio Risk 呈現層補齊安全存量缺口／可投資現金／資料可信度／重複來源警示）、子 PR 5（PR #143，merge commit `d2c2c1ecbac59357ffc5b84dca388ded61e34e5e`，`todayDecision` 六層優先序改寫，接回首頁「今日決策」）、子 PR 6（PR #145，merge commit `5aa1d9e3c4fc364059b4fd6ab4a4de6bc34a594e`，AI Decision §24 契約，`cash` 決策項改引用 Household Liquidity）、子 PR 7（PR #147，merge commit `226c6bee75fe4ce8db884c08e63ded1fe08bc7f7`，`homeDecision` 改用相同三層 liquidity 閘門，達成 §20.3 跨模組一致性）。PR #147 對應 `Deploy GitHub Pages` workflow run `30241261199`（本次以 `gh run list` 實際查詢確認 `conclusion: success`，`headSha` 與 merge commit 一致），Production 以 `curl` 實測 HTTP 200。**UR-TODO-009 狀態由「開發中」正式更新為「已完成」**，子 PR 1～7 全數完成，逐條記錄見上方 UR-TODO-009 條目。其餘 Todo 狀態不受本次更新影響。

2026-07-27 UR-TODO-010 唯讀盤點過程中發現 UR-TODO-010、UR-TODO-011 的「詳細規格」欄位仍引用已不存在於 Repository 的舊檔名 `013_Household_Liquidity_Model_Spec_v3.0.md`，正確應為現行 `013_HOUSEHOLD_LIQUIDITY_SPEC.md`（v4.0），章節編號不變。本次修正這兩筆條目的檔名引用，純文件變更，**不改動任何優先級、狀態或需求內容**。UR-TODO-006（`013_Household_Liquidity_Model_Spec_v3.0.md` 為完成當下版本的歷史記錄）與 UR-TODO-031（`013_Household_Liquidity_Model_Spec_v3.0.md` 為既有規格參照）不在本次修正範圍，維持原文。

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
- 狀態：**已完成**（2026-08-05，PR #252；正式解法〔Firebase Anonymous Auth 整合〕已完成並經使用者於 Console 套用 Rules 後實機複驗成功，詳見下方 2026-08-05 段落）
- 提出日期：2026-07-22
- 問題：`l-pro-web-app-default-rtdb`（原記載「`my-00662-default-rtdb`」為治理文件誤植，已於 2026-08-05 更正）測試模式用戶端存取權限已到期。
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

**2026-08-05 正式解法已完成，UR-TODO-001 正式結案：**

PR [#252](https://github.com/hyc640110/family-universal-rebalance/pull/252) 已由使用者手動 Merge，merge commit `2a038802aac1a345f5be2a5100913142d42d23a4`，`mergedAt: 2026-08-05T08:22:26Z`。新增純 REST（非 `firebase` SDK）Firebase Anonymous Authentication，維持既有 raw `fetch()` 架構：`src/lib/firebaseAnonymousAuth.ts` 直接呼叫 Identity Toolkit／Secure Token API 建立與更新匿名 session；`src/lib/environmentBoundary.ts` 的 `syncRoot()` 由 `secretPath` 改為 `uid`，路徑格式改為 `{basePath}/users/{uid}`，滿足「路徑以 uid 為基礎、未來 `linkWithCredential()` 升級不需 migration」的產品要求；`src/lib/firebaseSyncUrl.ts` 組出帶 `?auth=<idToken>` 的 RTDB REST URL。使用者已於 Firebase Console 套用新 Security Rules（`$envPath` 萬用字元只鎖 `auth.uid === $uid`）並啟用「匿名」登入方式；既有雲端舊資料依使用者拍板視為已遺失、不做遷移。**實機以真實 Firebase 後端複驗**：全新使用者背景自動登入成功並取得真實 uid；以實際簽發的 uid／idToken 重放 RTDB REST 呼叫，上傳／下載成功且資料一致；跨 uid 存取回傳 HTTP 401 Permission denied，證實 Rules 正確生效。詳細變更範圍、測試清單與明確排除項目見 `003_CURRENT_STATUS.md` 最上方 2026-08-05 記錄。**下一潛在候選為 Google 登入／帳號升級（`linkWithCredential()`），屬重大產品語意事件，須另行拍板，未經授權不得開始。**

#### 後續延伸：Firebase Retirement Phase（方案 B；已完成／CLOSED）

- P2-A 已由 PR #304 Merge，merge commit `339f8c305a419117af54f4dbd69a3b47b903a26c`；P3 Repository 唯讀盤點已完成。
- P3-A1 已由 PR #305 正常 Merge，merge commit `78e50c3d09f122b18d968ebcddf0bd2b52bf177f`（`mergedAt: 2026-08-11T14:20:24Z`；`mergedBy: hyc640110`；未使用 admin override）。移除 Firebase Anonymous Auth runtime module、Firebase RTDB URL builder runtime module、直屬 tests、`VITE_FIREBASE_API_KEY` 與程式端 dead constants；production Firebase Auth／RTDB runtime reference = 0。Production workflow `31500994060` success，Production／Preview HTTP 200 且 metadata 分別為 `production`／`preview`、assets 路徑隔離正常。
- 明確保留：`VITE_DEPLOYMENT_SCOPE`、`syncMeta.dirty`／`source`／local-Backup timestamps 與 Financial Event Ledger（含 `mergeFinancialEventLedgers()`）。`VITE_DEPLOYMENT_SCOPE` 是 environment safety boundary，不是 Firebase root；`mergeFinancialEventLedgers()` 是 Firebase 以外仍有效的通用 Ledger contract，保持 KEEP。P3-B3-A 已退休新的 canonical output：`autoSync`、`autoSyncSec`、persisted `workerUrl`、Firebase baseline metadata、`lastUploadAt`、`lastDownloadAt`；P3-B3-B 已退休 canonical `AppState.firebase`／`FirebaseConfig`，legacy Firebase input 持續 accept-and-discard；P3-B3-C 已完成 boundary 的中性命名 cleanup。P4 已完成 Archived Retirement：RTDB Rules deny-all、Anonymous Auth disabled、受控 archive/hash evidence 已驗證，Firebase Project／RTDB historical data／users／Web App registration 均保留。

本段是 UR-TODO-001 的**後續延伸**，不取代、不改寫上方原始「Security Rules Expiry／Anonymous Auth」已完成歷史與 PR #252／Firebase Console 複驗結論。

- 現行狀態：P0 Governance-only、P1、P2-A、P3 Repository 唯讀盤點、P3-A1、P3-B1、P3-B2-A、P3-B2-B、P3-B2-C、P3-B3-A、P3-B3-B、P3-B3-C 與 P4 均已完成；**UR-TODO-001 Firebase Retirement 已 CLOSED。**
- localStorage：唯一 canonical runtime state；Firebase 不再是一般 App runtime 的必要資料來源。
- JSON Backup：正式人工備份、跨裝置資料搬移與災難復原機制。後續必須以真實 Production 資料完成 Export → Import → Re-export round-trip 驗收；可接受 `exportedAt` 與裝置診斷資料差異，但持股、帳戶／現金、交易、借款、Cash Flow、淨資產歷史及 Ledger contract 必須保留。
- Financial Event Ledger：必須保留 localStorage persistence、JSON Backup serialization、schema、normalization、validation、event identity／collision validation、atomic group、void、linked transaction identity、`financialEventAttributionStartDate` 與既有 forward-only 契約；不得因 retirement 誤刪或改變 attribution／reconciliation 公式。
- P1：已完成。移除一般 App startup 的背景 Firebase Anonymous Auth；當時保留手動同步，Auth 僅在使用者手動觸發時按需取得。
- P2-A：移除 active Firebase Anonymous Auth／RTDB transport caller、手動 upload/download、首頁／手機／Settings 同步 UI、sync status／baseline／remoteMeta runtime consumer 與 Firebase-only remote Ledger merge orchestration；legacy `syncMeta`／`syncSettings.firebase` 仍相容讀取，JSON Backup payload migration 不變。不得刪除共用 Ledger 契約，亦不得修改 JSON Backup payload migration。
- P2-B：僅在後續明確需要時處理 local／Backup runtime feedback 的進一步解耦；不得自行新增 persistence schema。
- P3：P3-A1 已清理 Firebase Auth／RTDB runtime references；P3-B2-A 已清理 dead runtime；P3-B2-B 已退休新 JSON Backup 的 `syncSettings.firebase`／`firebaseConfigured` output；P3-B2-C 已校正治理文件與 Bundle；P3-B3-A 退休已證實無 production consumer 的 legacy cloud-sync canonical output，並保護 legacy-only hydration 不自動改寫；P3-B3-B 退休 canonical `AppState.firebase`／`FirebaseConfig`，legacy Firebase input 僅 accept-and-discard；P3-B3-C 已將 active deployment safety boundary 更名為中性 scope。P3 已完成；不處理 Gmail OAuth、Quote／Market／其他非 Firebase Workers。
- P4：已依明確授權完成 Archived Retirement／封存保留。RTDB Rules 為 deny-all，Anonymous Auth disabled；RTDB historical data、19 個歷史 anonymous users、Web App registration 與 Firebase Project 均保留。受控離線 RTDB archive 已完成 JSON parse 驗證，SHA-256 evidence 為 `E22FD669E3787F28B5174CE5C748A9317EE2EE935E48EDF996A07B8D741E4150`；archive 本體不進 Repository、Bundle 或公開資源。Production 實機驗證已證實 Ctrl+F5、資產資料與 localStorage persistence 均不依賴 RTDB／Anonymous Auth。
- Optional future housekeeping：若使用者未來要清除 anonymous users、RTDB data／instance、Web App registration、API key、Firebase Project 或 browser storage，均須重新唯讀盤點與明確 destructive authorization；這些項目不是 UR-TODO-001 blocker。`mergeFinancialEventLedgers()` 已確認為通用 Ledger contract，不是 Firebase-only cleanup 對象。

**2026-07-25 Firebase Console 唯讀查證結論（使用者本人於 Firebase Console 查證，非 Repository 唯讀盤點得出，歷史記錄）：**

- 專案：`l-pro-web-app`（原記載「`my-00662`」為治理文件誤植，已於 2026-08-05 更正），資料庫：`l-pro-web-app-default-rtdb`
- 現行規則（確認日 2026-07-25，查證當時內容）：
  ```
  ".read": "now < 1785168000000"
  ".write": "now < 1785168000000"
  ```
- **到期日：2026-07-28**（確認日 2026-07-25 起僅剩 3 天）
- 到期前：完全公開讀寫，無任何條件限制
- 到期後：Firebase 預設行為自動轉為全部拒絕（deny all）——這是**權限自然收斂**，不是資料外洩事件

**使用者決策（已拍板，非 AI 建議代為決定）：**

- **不在到期前修改 Firebase Console 規則**，不手動延長現有公開規則，維持本 Todo「禁止」項目既有規定
- 讓規則自然到期，接受屆時雲端上傳／下載／Firebase 手動同步暫時中斷
- 已確認不受影響的功能：localStorage 持久化、JSON Backup 匯出／匯入、Price Worker／Market Worker 報價、GitHub Pages、Gmail OAuth、Allocation Simulator
- 正式解法（於 App 內加入 Firebase Auth、規則改為 `auth != null`）列為**未來獨立 Development Sprint**，不在到期前這幾天內倉促進行，待使用者另行排定時程啟動

**2026-07-24 Repository 唯讀盤點結論（Claude Code Review Mode，僅限 Repository 內容與公開 HTTP 探測，未存取 Firebase Console）：**

已確認（來自程式碼與設定檔，非 Firebase Console）：

- **App 完全未整合 Firebase Authentication**：`package.json` 未安裝 `firebase` npm 套件；`src/` 全目錄搜尋 `firebase/auth`、`signInWith`、`onAuthStateChanged`、`getAuth`、`initializeApp` 皆為零命中。App 唯一的登入機制是 Gmail OAuth（`src/components/GmailOAuthSettings.tsx`），走獨立的 Cloudflare Worker broker，與 Firebase 無關（程式內註解明確寫「Token 不保存於 Firebase」）。**因此目前沒有任何使用者可以透過 Firebase Auth 登入**，這是「不得在 App 無 Firebase Auth 時直接改為 `auth != null`」這條禁令的具體原因：若規則直接改為 `auth != null`，會在 App 完全沒有登入流程的情況下，把現有的手動雲端上傳／下載功能徹底鎖死。
- **Preview／Production 共用同一個 Firebase 專案／RTDB 實例，不是獨立專案**：`.env.production` 的 `VITE_FIREBASE_BASE_PATH=family-universal-rebalance`、`.env.preview-deploy` 的 `VITE_FIREBASE_BASE_PATH=family-universal-rebalance-preview`，兩者僅靠頂層路徑前綴區隔；兩個 `.env` 檔皆未各自定義 `VITE_FIREBASE_DATABASE_URL`，Database URL 是使用者於 UI 手動輸入、Preview／Production 共用同一個值。`src/lib/environmentBoundary.ts` 有程式碼層防呆，強制 `preview` 環境的 base path 必須以 `-preview` 結尾、`production` 則不得有此後綴，但這只是應用層的路徑隔離，不是 Firebase 專案層級的隔離。**代表任何規則變更會同時影響 Preview 與 Production，兩者不是各自獨立的風險**。
- **Database URL 與 secretPath 皆為使用者手動輸入，非寫死在程式碼或 `.env`**：`state.firebase.databaseURL`、`state.firebase.secretPath` 均為 UI 可編輯欄位（見 `src/App.tsx`），App 透過原生 `fetch()` 對 `<databaseURL>/<環境 base path>/<secretPath>.json` 做整節點 PUT／GET，未使用 Firebase SDK 的 `ref`／`push`／`set`／`get`／`onValue`／`child` 等 API，也沒有子節點層級的讀寫。

仍待確認（**無法從 Repository 唯讀確認，需要 Firebase Console 存取權限**）：

- 現行 Security Rules 的實際 `.read`/`.write` 內容（repo 內無 `database.rules.json`／`firebase.json`／`.firebaserc`）
- 測試模式規則的實際到期日期（repo 內無任何硬編到期日，僅有本 Todo 的提出日期 2026-07-22，不等於到期日）

建議的安全 Hotfix 方向（**僅供決策參考，尚未實作，未變更任何 Firebase Console 設定**）：

1. **短期（不改變信任模型）**：先於 Firebase Console 唯讀確認實際到期日與現行規則；若快到期，可考慮改為限時規則並針對已知 secretPath 前綴 pattern 做白名單限制，取代完全公開的 `.read`/`.write`，但仍不涉及 Auth，屬過渡性做法。
2. **中期（正式方案）**：App 目前完全無 Firebase Auth，若要以 `auth != null` 收斂權限，須先在 App 內新增登入機制（可能沿用現有 Gmail／Google OAuth 身份，或另外導入 Firebase Anonymous／Email Auth），並在規則改動前後分別驗證 Preview／Production 的上傳／下載仍可運作，屬有實質開發工作量的 Sprint，非單純 Console 設定。
3. **架構層考量**：因 Database URL 與 secretPath 皆為使用者輸入、且 Preview／Production 共用同一實例，任何規則收斂都須同時涵蓋兩個環境的路徑前綴（`family-universal-rebalance` 與 `family-universal-rebalance-preview`），並重新驗證 `environmentBoundary.ts` 的隔離防呆邏輯在新規則下仍然有效。

三個方向的優先順序、時程與是否走 Console-only Hotfix 或正式 Sprint，於 2026-07-25 由使用者查閱 Firebase Console 後決定：**不在到期前修改規則，接受 2026-07-28 自然到期**，正式解法（Firebase Auth 整合）列為未來獨立 Sprint。**此段為歷史記錄：正式解法已於 2026-08-05 由 UR-TODO-001／PR #252 完成，詳見上方 2026-08-05 段落，狀態現為「已完成」。**

### UR-TODO-002 持股資產管理卡片 2.0 差異盤點

- 優先級：P0
- 狀態：**已完成**
- 完成日期：2026-08-01
- 歷史脈絡（唯讀盤點曾一度過期，特此記錄避免未來誤判）：本條目 2026-08-01 首次唯讀盤點時基準為 `origin/main` HEAD `d49e98b`，結論是「現價與漲跌幅不同列、無箭頭、金額百分比合併、與未實現損益同色僅靠標籤區隔」，並列出五項差異請使用者決策。使用者選擇「方向 2：依原始版面需求重新設計」並下達開發指令。**開發前重新唯讀盤點時發現 `d49e98b` 早於 UR-TODO-033（[PR #214](https://github.com/hyc640110/family-universal-rebalance/pull/214)，merge commit `fd3ae44`）合併**，五項差異中的前四項（現價與漲跌幅同列、漲跌金額獨立次列、▲／▼ 箭頭、三者同色）其實已經在 UR-TODO-033 完成，**本次開發未重做這四項**，只實作了唯一仍為缺口的第五項。
- 五項最終狀態：
  1. 現價與漲跌幅同列 —— ✅ 已由 UR-TODO-033（PR #214）達成。
  2. 漲跌金額獨立次列 —— ✅ 已由 UR-TODO-033（PR #214）達成。
  3. ▲／▼ 箭頭 —— ✅ 已由 UR-TODO-033（PR #214）達成。
  4. 現價／漲跌金額／箭頭三者完全同色 —— ✅ 已由 UR-TODO-033（PR #214）達成。
  5. 與未實現損益清楚區隔 —— ✅ 本次（[PR #222](https://github.com/hyc640110/family-universal-rebalance/pull/222)，merge commit `cd430dcafd3aedbb4b0c6bcdadf2b0b161239925`，`mergedAt: 2026-08-01T16:09:00Z`）完成。
- 第 5 項完成依據：原始需求未定義「清楚區隔」的具體做法，唯讀盤點後提出三個視覺方案（圖示區隔／字重字級區隔／容器樣式區隔）供使用者選擇，使用者選定**方案 C（容器樣式區隔）**。範圍：`src/App.tsx` 的「未實現損益」`<p>` 容器新增 `holding-card-unrealized-pnl-${tone(row.pnl)}` class（`<strong>` 內既有文字色 class 不變）；`src/styles.css` 新增淡色背景＋左側 3px 色條強調（沿用既有紅漲綠跌／灰 hold 色碼，未新增新色系），base 樣式與 `@media (min-width:901px)` 桌機覆寫各一組（桌機版原本會把卡片邊框／背景整個清空為扁平表格列樣式，需另外覆寫才能讓區隔在桌機生效）；「今日漲跌」格完全未變動。新增 `tests/holdingCardUnrealizedPnlDistinction.test.ts` 4 個測試，明確斷言 UR-TODO-033 四項成果未被重做；`npx tsc -b`、`test:ci` 全數通過（既有 `v6AssetsCardInformation.test.ts` 零修改直接通過）。隔離 Preview 環境（`workflow_dispatch` 部署）實機驗證：seed 正／負報酬持股，確認正報酬格顯示紅色淡底＋紅色左邊框、負報酬格顯示綠色淡底＋綠色左邊框，「今日漲跌」格背景維持透明不受影響；390px 與桌機皆正確、無橫向溢出，console 無 error；驗證後已清除測試資料還原 Preview 環境。`Deploy GitHub Pages` run 對應 headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 皆 HTTP 200，並直接比對 gh-pages 分支實際部署的 JS bundle 內容確認含 `holding-card-unrealized-pnl-`，`deployment-environment` metadata 正確、資源路徑未混用。
- 已完成（現有實作核對後維持有效，非本次改動）：
  - 現價
  - 今日漲跌金額
  - 今日漲跌幅
  - 台股紅漲綠跌
  - TWSE 可信前收
  - 手機主卡移除均價
- 桌機／手機一致：已符合，`isMobile`／`uiState.displayMode` 皆不影響持股卡片版面結構，僅有 `HoldingCompactCard` 一份 JSX。
- 明確不包含：未修改 `formatCompactQuoteMovement()`／`formatCompactQuoteHeadline()`（UR-TODO-033 核心函式）、台股紅漲綠跌配色邏輯本身、TWSE 可信前收機制、任何持股資料計算邏輯。
- 完成 PR：#100、#101（部分，前期基礎）、#214（UR-TODO-033，項目 1～4）、#222（本次，項目 5）

### UR-TODO-003 每檔成長／防守分類完整性

- 優先級：P0
- 狀態：**已完成**（資料持久化與下游 SSOT 一致性子項已妥善處理；CLEC／`cash-like`／`defensive` 語意分歧一項使用者已明確決定**不做資料統一，改以文案明確標示**解決，已由使用者手動 Merge，見下方「語意混淆解法」）
- 唯讀盤點日期：2026-08-01（Claude Code，Review Mode，基準 `origin/main` HEAD `d49e98b`，未修改任何程式碼）
- 已有：
  - `assetClass`
  - 持股編輯 UI
  - `allocationRoleBySymbol`
- 唯讀盤點結論（原「待盤點」清單逐項核對，`AssetClass` 為 `'growth' | 'defensive'`，定義於 `App.tsx:83`）：
  - **localStorage／Firebase／Backup**：皆確認一致。三者共用同一個 `normalizeState()` 正規化管線（`App.tsx:377` `normalizedCore`），App 唯一的 `setState` wrapper 每次更新皆重新呼叫，`backupPayload()`（`App.tsx:419`）直接使用同一份已正規化的 `normalized.holdings`，與 UR-TODO-005 確認過的名稱解析管線同源。
  - **封存／恢復**：已確認不會遺失。`removeHoldingAsset()`／`restoreHoldingAsset()`（`App.tsx:1708-1719`）只改寫 `isArchived`／`targetWeight`／`dipAlerts`／`allocationRoleBySymbol`，未觸碰 `assetClass`，封存與恢復皆完整保留分類。
  - **Dashboard**：已確認符合單一計算來源、下游只讀原則。`investmentDashboard.ts`／`DashboardDecisionPage.tsx` 只消費彙總後的 `growthRatio`／`defensiveRatio`（已由上游依 `assetClass` 算好），未重新判斷分類。
  - **Risk／Rebalance**：已接線。`riskMetrics.ts`、`portfolioRisk.ts`、`rebalanceRecommendation.ts`、`rebalanceOrderHelper.ts`、`RebalanceRecommendationPage.tsx` 皆引用 `assetClass`。
  - **SSOT**：已確認符合。持股層級 `assetClass` 單一正規化來源為 `normalizeState()`／`sanitizeHolding()`，下游 Risk／Rebalance／Dashboard 皆只讀不重算。
  - **CLEC／`cash-like`／`defensive` 的語意 —— 唯一剩餘技術缺口**：全庫比對確認 `clecStrategy.ts`／`clecStrategyRules.ts`／`ClecStrategyCenterPage.tsx`／`ClecRuleSummaryCard.tsx` 完全零命中 `assetClass`／`AssetClass`。CLEC 模組使用的是完全獨立的 `AllocationRole`（`'prototype' | 'leveraged' | 'cash-like' | 'none'`，定義於 `src/lib/allocationPresets.ts:2`），與持股正式分類 `AssetClass`（`growth`／`defensive`）是**兩套互不相通、無轉換邏輯的平行分類系統**。同一檔標的可能在 `AssetClass` 中被標為「防守資產」，又同時在 CLEC 模擬頁面被標為「類現金持股」（`AllocationRole`），語意上仍可能造成混淆，尚未解決。
- **與 UR-TODO-048 的關聯**：本項唯一剩餘缺口與 UR-TODO-048 條目內「`allocationRoleBySymbol` 欄位清理」待評估議題**直接相關聯**——`allocationRoleBySymbol` 正是承載 `AllocationRole`（含 `cash-like`）語意的 AppState 欄位，UR-TODO-048 子階段 B 完成後已確認此欄位僅剩 `ClecStrategyCenterPage.tsx`「目前配置來源」卡片的裝飾性顯示用途。
- **語意混淆解法（2026-08-01，使用者拍板）**：使用者明確決定**不做 `AssetClass` 與 `AllocationRole` 資料統一**，保留兩套獨立系統；改為在 `ClecStrategyCenterPage.tsx`「目前配置來源」卡片新增明確的文案標示，說明該卡片顯示的角色分類（原型資產／槓桿資產／類現金持股）是 CLEC 模擬專用分類，與資產頁「成長／防守」正式配置分類無關。完成依據：[PR #225](https://github.com/hyc640110/family-universal-rebalance/pull/225)（`fix/ur-todo-003-048-clec-role-semantic-label`），merge commit `cbe5e0537d7257e94937a766fe110a2e0fcd002f`，`mergedAt: 2026-08-01T16:53:39Z`。範圍：`src/pages/ClecStrategyCenterPage.tsx` 於既有說明文字下方新增一行 `<p className="note clec-role-scope-note">`，純文案調整，**未修改** `AssetClass`／`AllocationRole` 型別定義或既有分類邏輯、未修改任何持股 `assetClass`／`allocationRoleBySymbol` 資料值、未新增任何分類轉換或自動推斷機制、未觸碰 CLEC 核心策略計算或 Household Liquidity 核心公式。開發前重新唯讀盤點確認 `allocationRoleBySymbol` 全庫僅 `App.tsx`（8 處）與 `syncState.ts`（1 處）引用，`ClecStrategyCenterPage.tsx` 確認為唯一顯示角色標籤（源自 `state.allocationRoleBySymbol`）的畫面，與既有治理紀錄一致，未發現本次盤點未涵蓋的讀寫位置。新增 `tests/clecRoleSemanticScopeNote.test.ts` 2 個測試；`npx tsc -b`、`test:ci` 全數通過（既有 3 個相關測試檔零修改直接通過）。隔離 Preview 環境（`workflow_dispatch` 部署）實機驗證：進入 CLEC 再平衡策略中心，「目前配置來源」卡片正確顯示新說明文字，位置正確、既有角色標籤與目標比例總和計算不受影響，390px 無橫向溢出，console 無 error。`Deploy GitHub Pages` run `30709137755` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 皆 HTTP 200，並直接比對已部署 JS bundle 內容確認含 `clec-role-scope-note`，`deployment-environment` metadata 正確、資源路徑未混用。
- 若未來啟動 `allocationRoleBySymbol` 資料層清理（非本次範圍），應一併評估是否統一或明確區隔 `AssetClass` 與 `AllocationRole` 兩套分類語意；兩個 Todo 的後續開發規劃應合併考慮，避免分開處理造成語意設計反覆。

### UR-TODO-004 同一畫面內成長／防守資產比例小數位數不一致（原標題：桌機／手機目前偏離目標一致性）

- 優先級：P0
- 狀態：**已完成**
- 完成日期：2026-07-29
- 完成 PR：[#186](https://github.com/hyc640110/family-universal-rebalance/pull/186)（主修正，`src/App.tsx` 的 `pct()` 統一為 1 位小數）、[#187](https://github.com/hyc640110/family-universal-rebalance/pull/187)（跟進修正 `src/lib/investmentHealth.ts` 第五處風險提醒文案 `pct()`）
- 完成依據：兩支 PR 的 `CI Verification` 皆成功（PR #186 run `30462239872`、PR #187 run `30463163409`，`conclusion: success`）；Merge 後 `Deploy GitHub Pages` run `30462458497`（PR #186）、`30463317966`（PR #187）皆成功，headSha 與各自 merge commit 一致；Production／Preview 兩次皆以 `curl` 實測 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用；並以 Node 直接驗證同一輸入值（`34.567`）在修正前後的實際輸出字串，確認「資產配置」卡片標頭摘要與內部甜甜圈圖摘要統一後產生完全相同字串。
- 盤點結論：原「桌機／手機顯示不同數字」假設**未成立**——唯一計算來源為 `rebalance()`（`src/App.tsx`），透過 `useMemo` 只計算一次，`isMobile`（`App.tsx` 依 `window.innerWidth <= 768` 判定）僅控制卡片收合等版面行為，從未介入 `currentWeight`／`targetWeight`／`deviation` 的計算或格式化路徑，架構上不存在跨裝置一致性風險，不觸發升級條件。實際問題為**同一畫面內**、與裝置無關的格式化不一致：`pct()`（`App.tsx:126`）、`allocationPct()`（`AllocationDonut` 元件內）、`formatCompactHoldingWeight()`（`src/lib/compactAssetCard.ts`）、`RebalanceRecommendationPage.tsx` 區域 `pct()`、`investmentHealth.ts` 的 `pct()` 共五處獨立格式化函式，小數位數不一致（2 位 vs 1 位），最明顯處是「資產配置」卡片標頭摘要與內部甜甜圈圖摘要同時可見卻不同位數；PR #186 統一 `App.tsx` 的 `pct()` 為 1 位（對齊既有其餘三處），PR #187 跟進統一 `investmentHealth.ts` 的 `pct()`。
- 明確不包含：未修改任何計算邏輯（`rebalance()`、`deriveRebalanceRecommendation()`、`calculateMetrics` 等完全未觸碰）；「再平衡建議中心」個股層級用詞（目前比例／目標比例，與資產類別權重為不同粒度概念）是否需要正名，本次列為獨立觀察、未處理，未來若要處理需另立 Todo。

### UR-TODO-005 00685L、00895 名稱持久化

- 優先級：P0
- 狀態：**已完成**
- 完成日期：2026-07-29
- 完成 PR：[#189](https://github.com/hyc640110/family-universal-rebalance/pull/189)（`test/ur-todo-005-holding-name-resolution-coverage`），merge commit `3b4549e2d868131a158772530aad16ee3145e415`，`mergedAt: 2026-07-29T15:39:16Z`
- 完成依據：Phase 1 唯讀盤點確認名稱解析有三層防護（既有名稱 > `SYMBOL_NAMES` 內建對照表 > 代碼本身），`pickName()` 明確跳過空字串，不會讓空值覆蓋既有名稱；更新股價、reload、localStorage、Firebase、Backup 四個持久化情境皆經同一條 `normalizeState()` → `sanitizeHolding()` → `resolveSymbolName()` 正規化路徑；封存／恢復（`removeHoldingAsset`／`restoreHoldingAsset`）未觸碰 `name` 欄位。PR #189 新增 `tests/holdingNameResolution.test.ts` 12 個行為測試，涵蓋此邏輯與這兩檔標的的格式（數字＋字母後綴、純數字）；CI（`CI Verification` run `30466669879`，`conclusion: success`）與 `Deploy GitHub Pages`（run `30466920692`，`conclusion: success`，headSha 與 merge commit 一致）皆成功，Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用。
- 明確不包含：`sanitizeHolding()` 本身未完整搬移或測試——它另外依賴 `DEPLOYMENT_ENVIRONMENT`／`PREVIEW_ARCHIVED_FIXTURE_SYMBOL`（皆為 `import.meta.env` 衍生）與 `REMOVED_SYMBOLS`（看似刻意隱晦處理的合規性封鎖清單，與 `REMOVED_RECORD_KEY` 同一機制），未經理解其完整脈絡前不予搬動或曝光於測試中，保留原狀，由既有的字串比對式 characterization guard（`scripts/stability-check.mjs`）繼續守護。若未來要完整測試 `sanitizeHolding` 本身，列為未來待討論的獨立項目。

### UR-TODO-037 Deployment Workflow Approval & Status Accuracy

- 優先級：P0
- 狀態：**已完成**（Sprint「Deployment CI Reproducibility & Test Gate」，2026-07-24 完成部署狀態敘述修正；2026-07-30 完成預設分支修正與 Branch Protection；GitHub Environment 人工核准維持原狀，未強制要求為驗收範圍，詳見下方判定）
- 提出日期：2026-07-24
- 完成日期：2026-07-30
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
- 尚未完成範圍（2026-07-24 提出當時，明確延後）：
  - GitHub Environments 人工核准（required reviewers）—— **2026-07-30 判定維持原狀，不納入本次 UR-TODO-037 驗收範圍，理由見下方 Phase 3**
  - Branch Protection Rule（`main` 目前仍是 `Branch not protected`）—— **2026-07-30 已完成，見下方 Phase 3**

**Phase 1（唯讀盤點，2026-07-30，已完成）**：
- 使用者於 Review Mode 發起「UR-TODO-037 Phase 1（唯讀盤點）」指令，以 `gh api` 實際查詢（非憑印象判斷）三項殘留範圍現況：
  1. **GitHub Environments 人工核准**：`gh api repos/hyc640110/family-universal-rebalance/environments` 確認僅有一個自動建立的 `github-pages` Environment，`protection_rules` 只有 `type: "branch_policy"`（限制部署分支為 `gh-pages`），**沒有 `required_reviewers` 規則**。進一步確認 `.github/workflows/deploy.yml` 的 `deploy` job **未宣告 `environment:` 欄位**，代表這個 Environment 與實際部署流程無關——即使現在設定 reviewers 也不會擋住任何一次部署，必須同時修改 `deploy.yml` 加上 `environment:` 欄位才會生效，而這已落在本項「不得未經使用者授權直接修改 `deploy.yml`」的禁止範圍內。
  2. **Branch Protection**：`gh api repos/.../branches/main/protection` 回傳 `404 Branch not protected`，與既有記錄一致，無變化。
  3. **預設分支**：`gh api repos/.../{owner}/{repo} --jq '.default_branch'` 與 `gh repo view` 確認當時仍為 `gh-pages`。
- 額外確認三項修正皆**不需要超出目前 Repo Admin 的權限**：`gh api repos/.../{owner}/{repo} --jq '.permissions'` 回傳 `admin: true`，`.owner.type` 為 `User`（個人帳號、非 Organization），`gh auth status` 確認 token 已具完整 `repo` scope；`gh api repos/.../collaborators` 確認僅使用者本人一名 collaborator。故未觸發「需要會員資格層級權限」或「發現更嚴重安全缺口」兩項升級條件。

**Phase 2（預設分支修正，2026-07-30，已完成）**：
- 使用者於 Phase 1 唯讀盤點結論後，明確授權修正預設分支。已執行 `gh api repos/hyc640110/family-universal-rebalance -X PATCH -f default_branch=main`，並以 `gh api .../{owner}/{repo} --jq '.default_branch'` 與 `gh repo view --json defaultBranchRef` 雙重確認回傳 `main`。
- 確認未受影響：GitHub Pages 部署來源（`gh api repos/.../pages` 回傳 `source.branch: "gh-pages"`）為獨立設定，與 Repository 預設分支無關；`curl` 實測 Production（`https://hyc640110.github.io/family-universal-rebalance/`）HTTP 200，未受此設定變更影響。
- **Branch Protection、GitHub Environments 人工核准兩項本次未處理**，待使用者決定政策內容（例如 required PR review 人數、是否要修改 `deploy.yml` 新增人工核准關卡）後另行授權處理；此為單一維護者 Repository（僅一名 collaborator），若貿然開啟「要求 PR review」而未同時設定 bypass／allow list，可能鎖死使用者自己的既有 Merge 流程，需先由使用者決定政策再排入開發。

**Phase 3（Branch Protection，2026-07-30，已完成）**：
- 使用者選定「選項 2：中度保護」，明確授權具體設定內容後執行 `gh api repos/hyc640110/family-universal-rebalance/branches/main/protection -X PUT` 並以完整 JSON payload 送出：`required_status_checks: {strict: false, checks: [{context: "verify"}]}`、`enforce_admins: false`、`required_pull_request_reviews.required_approving_review_count: 1`、`restrictions: null`。
- `verify` check name 以 `gh api repos/.../commits/{sha}/check-runs` 實際查詢確認，為 `.github/workflows/ci.yml`（`on: pull_request`）內唯一 job 的顯示名稱；`deploy.yml` 的 `deploy` check 只在 push 到 `main` 後才觸發，邏輯上不可能作為「合併前必須通過」的必要檢查（會導致 PR 永遠無法合併），已排除，未發現其他候選，不存在需要使用者裁決的歧義。
- 執行後以 `gh api .../branches/main/protection` 與 `gh api .../branches/main --jq '.protected'`（回傳 `true`）雙重驗證確認四項設定與送出內容完全一致。
- **治理規則同步更新（2026-07-30）**：由於本 Repository 僅有一名 collaborator，`required_approving_review_count: 1` 無法被第二人滿足；使用者確認採用「選項 A」——純治理文件同步 PR 的既有自動 Merge 政策維持不變，執行時若需要繞過核准規則，可使用 `gh pr merge --admin`，此為預先授權、不需每次重新請示，**但每次實際使用 `--admin` 都必須在回報中明確告知使用者，不得靜默執行**。此規則已同步寫入 `007_GIT_WORKFLOW.md` §8.1，供未來所有治理同步指令沿用；一般功能／程式碼 PR 不適用此安排，仍須使用者本人驗收後決定是否 Merge。
- **GitHub Environments 人工核准判定為維持原狀**：唯一的 `github-pages` Environment 與實際部署流程無關（見 Phase 1 唯讀盤點結論），使用者本次未要求授權修改 `deploy.yml` 使其生效，故不納入本次驗收範圍，也不得標記為已完成或已處理。

- 禁止：
  - 不得未經使用者授權直接修改 `deploy.yml` 或其他 CI／CD 設定。
- 驗收條件：
  - Production 部署觸發方式與治理文件描述一致，不再有「PR 稱未部署但實際已部署」的落差 —— **已透過 `007_GIT_WORKFLOW.md` 更新達成**。
  - 預設分支修正為 `main` —— **已完成（2026-07-30）**。
  - Branch Protection 政策內容確定並落地 —— **已完成（2026-07-30，選項 2：中度保護）**。
  - 若新增人工核准閘門，Preview／Production 部署行為需重新驗證 —— **明確不納入本次範圍**：使用者未要求開啟 Environment 人工核准，此驗收條件本身不適用，非「未完成」。

### UR-TODO-038 Deploy Workflow Node Runtime / DevDependency Install Failure

- 優先級：P0
- 狀態：**已完成**（完成日期：2026-07-24；完成依據：PR #108 MERGED＋Production workflow 成功＋真實 Ubuntu runner CI 成功＋Production 驗證成功，四項皆達成，詳見下方「已確認驗證結果」）
- 提出日期：2026-07-24
- 提出依據：PR #107（merge commit `eebee98e226501dddace68ac14505937096c6c08`）合併後的 Merge 後唯讀驗證，以及後續兩次 Draft PR #108 上 `CI Verification` workflow 的實測

**問題時間線：**

1. `Deploy GitHub Pages` workflow run `30096396958`（headSha `eebee98`）**失敗**：`Install dependencies` 顯示成功（✓）但日誌含 `npm error Exit handler never called!`；下一步 `Run CI regression test gate` 失敗 `sh: 1: tsx: not found`，exit code 127。
2. 第一版 Hotfix（`node-version: 20→24`、`npm ci --include=dev`、新增 tsx 驗證步驟、新增 `.github/workflows/ci.yml` 於 Ubuntu runner 做非部署驗證）在 Draft PR #108 上觸發 `CI Verification` run `30097774853`，**再次於 `Install dependencies` 失敗**，這次是明確的 `npm error code ETIMEDOUT`，連線目標為 `https://packages.applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public/vite/-/vite-8.1.1.tgz`（IP `10.192.71.42:443`），耗時約 13 分 34～35 秒。以 `gh run rerun --failed` 重跑同一 run 一次，**結果完全相同**（同 hostname、同 IP、幾乎同耗時）。
3. **真正根因確認**：`package-lock.json`（lockfileVersion 3，200 個套件條目）中，**56 個**條目的 `resolved` 欄位指向 `packages.applied-caas-gateway1.internal.api.openai.org`（一個僅限特定沙盒／AI 開發環境內部可連線的 Artifactory 風格套件鏡像網關），而非公開的 `registry.npmjs.org`。這 56 個條目精準對應 `package.json` 中原本標為 `"latest"` 的 8 個套件（`react`、`react-dom`、`typescript`、`vite`、`@vitejs/plugin-react`、`@types/node`、`@types/react`、`@types/react-dom`）及其完整遞移依賴樹。`npm ci` 依規範嚴格依照 lockfile 記錄的 `resolved` URL 抓取套件，完全不受 workflow 內 `npm config set registry https://registry.npmjs.org/` 影響，因此在任何無法連線該內部網關的環境（包含真正的 GitHub-hosted Ubuntu runner）執行 `npm ci` 必然逾時失敗。Node 版本（20 vs ≥22 的 `EBADENGINE` 警告）是真實存在但**次要**的問題，不是這次持續失敗的主因。

**已確認影響：**
- 兩次失敗（PR #107 merge 後的 `30096396958`，以及 PR #108 上的 `30097774853` 首跑＋重跑）皆在 `Install dependencies`／`test:ci` 階段被攔下，Build production／Preview／`gh-pages` 部署步驟全數**未執行**，未以壞狀態覆蓋正式站。
- Production（`https://hyc640110.github.io/family-universal-rebalance/`）與 Preview（`.../preview/`）皆仍是 PR #107 之前最後一次成功部署版本（workflow run `30089243284`，headSha `0d2ec05`），HTTP 200 正常回應，未受影響。

**本次 Hotfix 已完成（本機驗證通過，Commit `ed24f84ed7e0b329abce3418a8f9af6ddea0def8` 已 Push 到 PR #108）：**
- `actions/setup-node@v4`（`deploy.yml`、`ci.yml`）Node 版本 20→24；`package.json` 新增 `engines.node: ">=22.0.0"`；`Install dependencies` 明確使用 `npm ci --include=dev --no-audit --no-fund`；新增安裝後的 tsx／版本診斷步驟；新增獨立、唯讀（`permissions: contents: read`，無部署步驟）的 `.github/workflows/ci.yml`，於每個 PR 在真實 Ubuntu runner 上驗證 `npm ci`／tsx／`test:ci`／Production build／Preview build，且保證不寫入 `gh-pages`。
- **`package.json` 的 8 個 `"latest"` 套件全部改為明確固定版本**（沿用舊 lockfile 原本鎖定值：`react`＝`19.2.7`、`react-dom`＝`19.2.7`、`@vitejs/plugin-react`＝`6.0.3`、`typescript`＝`6.0.3`、`vite`＝`8.1.1`、`@types/node`＝`26.0.1`、`@types/react`＝`19.2.17`、`@types/react-dom`＝`19.2.3`），不再使用 `latest`，避免日後重新解析時因無版號護欄而意外拉入主版本升級（曾實測：改用公開 registry 完整重新解析後 `typescript` 會從 6.0.3 跳到 7.0.2，已明確拒絕採用該結果）。
- `package-lock.json` 僅正規化 56 個條目的 `resolved` 欄位（`applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public/<path>` → `registry.npmjs.org/<path>`，逐筆以腳本驗證 package 名稱／版本／integrity 與原始 lockfile 完全一致才寫入），其餘 199 個條目、`version`、`integrity`、依賴樹、`lockfileVersion`（仍為 3）**完全未變**。

**已確認驗證結果：**
- Draft PR #108 上 `CI Verification` 於真實 GitHub-hosted Ubuntu runner **兩次完整成功**：run `30101961703`（headSha `ed24f84`，39 秒）與 run `30102799090`（headSha `f78e643`，文件用語修正後再驗證一次，38 秒），`npm ci --include=dev`、tsx 驗證（`node v24.18.0`、`npm 11.16.0`、`tsx v4.23.0`）、`test:ci`（435/435＋18/18＋52 PASS，0 fail）、TypeScript `6.0.3`、Production build、Preview build 皆通過。
- **PR #108 已由使用者手動 Merge**，merge commit `0ae17a1716b32a5cdc67227a26549bec964a307c`，`mergedAt: 2026-07-24T14:56:47Z`。
- **Production Deploy GitHub Pages workflow run `30103172752`（headSha `0ae17a1`，`event: push`）成功**：`npm ci`、tsx 驗證、`test:ci`（435/435＋18/18）、Production build、Preview build、`Deploy production and Preview to gh-pages branch` 全數通過。
- **Production 唯讀驗證通過**：`gh-pages` 分支已更新（`55b9a075...` → `cbc44063ee911ecc3a24401c0c834f5e8fc271f7`）；Production 根目錄／`index.html`／主要 JS／CSS assets／`/preview/` 皆 `HTTP 200`；環境隔離確認正常（Production `index.html` 的 `deployment-environment` meta 為 `production`，資源路徑與 `/preview/` 完全分離、未混用）。
- 正式 main 上的 `package-lock.json` 已確認：內部 gateway URL 0 筆、全部 200 筆 `resolved` 為 `registry.npmjs.org`、`lockfileVersion` 仍為 3；`npm ci` 已於本次真實 Production workflow 直接驗證可重現。

**禁止（歷史記錄，事件已解決，供未來參考）：**
- 不得以重跑既有失敗 run（re-run）當作修復（已驗證過此路徑無效）。
- 不得接受 TypeScript 7 或任何非必要的依賴版本升級；不得使用曾產生的 223 條目新 lockfile。

**驗收條件（全數達成）：**
- `CI Verification`（`ci.yml`）在 Hotfix PR 的 Ubuntu runner 上，`npm ci`、tsx 驗證、`test:ci`、Production build、Preview build 全數通過 —— ✅ 已達成。
- PR #108 MERGED —— ✅ 已達成。
- Production `Deploy GitHub Pages` workflow 成功，`gh-pages` 更新，Production／Preview HTTP 200 且環境隔離正常 —— ✅ 已達成。
- 依本文件「完成標準」（程式碼完成＋自動測試通過＋Preview 驗收通過＋PR Merge＋Production 唯讀驗證通過），**UR-TODO-038、CI-01、CI-02 正式標記為已完成**。

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
- 狀態：**CLOSED（2026-08-21，Consumer Contract Audit 後正式結案；不宣稱 Production Verified）**
- 完成日期：2026-07-22（PR #104、#105，Foundation／Provenance／Migration）；結案日期：2026-08-21
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
- Closeout 說明（2026-08-21，Review Mode Consumer Contract Audit，未修改任何 production code）：
  1. Foundation／provenance semantics 已完成（上方「已完成」清單，PR #104／#105）。
  2. `liquidityRole`／`linkedLoanId` 已透過 `src/lib/householdLiquidityInputAdapter.ts` 的 `cashFlowRole()` 進入 Household Liquidity SSOT（`deriveHouseholdLiquidity()`），為該 SSOT 唯一合法輸入通道，非閒置 metadata。
  3. **Rebalance consumer 已由 UR-TODO-008 完成**（PR #116/#118/#120/#122/#124）：buy-only／standard budget、Order Helper、Execution Eligibility 均改讀 `householdLiquidityForRebalance` 衍生值（`investableCash` 等）；`rebalanceOrderHelper.ts`／`rebalanceRecommendation.ts` 對 `liquidityRole`／`linkedLoanId` 零直接讀取。
  4. **Risk、AI／Home Decision consumers 已由 UR-TODO-009 完成**（子 PR3／PR #137，子 PR5-6／PR #143、#145）：`riskMetrics.ts`、`aiDecision.ts`、`homeDecision.ts` 均只讀 SSOT 衍生值，零直接讀 provenance。
  5. **CLEC／Simulator consumer 已由 UR-TODO-010 完成**（PR #150/#152/#154/#156/#157）：funding semantics、`plannedContribution`／`plannedWithdrawal` 均改讀 SSOT 衍生值，零直接讀 provenance。
  6. **2026-07-28 mini-sprint（家庭流動性資料關聯與診斷，PR #167／#169／#171）補齊 diagnostics／producer UI／provenance visibility**：PR #167 新增 `deriveHouseholdLiquidityInputDiagnostics`（區分 Cash Flow Profile 缺失、Loan 來源不可用、未連結借款、失效連結）；PR #169 於 `CashFlowPage.tsx` 提供 `liquidityRole` 選擇與 debt-payment `linkedLoanId`／Loan 選擇的正式 Producer UI；PR #171 新增共用 diagnostics 呈現層，由 App 單次計算後傳入 Analytics、Risk Center、AI Decision 三頁一致顯示。`ORPHAN_LOAN_LINK`／`DUPLICATE_LOAN_LINK`／`DEBT_PAYMENT_AMBIGUOUS` 三個 fail-closed blocking reason 已存在於 `householdLiquidity.ts`。
  7. **Plan Input UI Entry Point 殘餘已由 UR-TODO-036 解決**（2026-08-01 已完成）：與 UR-TODO-011（防守配置狀態）邊界、與 Dashboard／Rebalance／Simulator 欄位整合去重、手機／桌機一致性與萬元輸入驗證邊界，三項原「待確認」皆已找到具體程式碼證據回答。
  8. **Remaining correctness gap = NONE。**
  - **正式 architecture boundary（新規則）**：未來不得為了「補完 UR-TODO-007」讓 Rebalance／Risk／AI／CLEC／Simulator 直接讀取 raw `liquidityRole`／`linkedLoanId`；直接讀取會建立與 adapter 平行、可能互相矛盾的第二套分類路徑，構成架構倒退。任何新的 provenance 使用情境（例如需要以 loan ID 查詢金額的新 consumer）必須另立獨立 Contract Audit，不得沿用本次結案自動授權。
  - **歷史 walkthrough 記錄（不重開本 Todo）**：2026-07-28 mini-sprint 收尾時記載「三頁代表性 diagnostics 資料的 Production 互動驗收」為**待盤點**（見 `012_AI_HANDOVER.md` 對應歷史快照），此後未見正式後續驗收證據追記。此缺口屬 UX／可觀測性完整性事項，不構成 SSOT 或 correctness 缺口（deploy pipeline、HTTP 200、regression test 均已通過，且後續三週內 Household Liquidity 衍生值已被數十個其他 PR 持續依賴、無回歸回報）。因此本次**只標 CLOSED，不宣稱 Production Verified**；此歷史 observation 不重新開啟 UR-TODO-007 correctness scope，若未來需要補驗，應另立獨立 Review／Contract Audit，不得因此讓任何 downstream module 直接讀取 raw provenance。
- 測試：PR #104 27/27、PR #105（Entry Point 7/7＋Foundation 16/16）；下游接線測試分別記錄於 UR-TODO-008／009／010 各自條目；`tests/cashFlowLiquidityProvenance.test.ts`／`householdLiquidity.test.ts`／`householdLiquidityInputAdapter.test.ts`／`householdLiquidityDiagnosticPresentation.test.ts`／`householdLiquidityPlanInput*.test.ts` 均已納入 `test:ci:unit-ts`

### UR-TODO-008 Rebalance & Trade Execution Integration

- 詳細規格：`013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）第 12～14、23、30 節

- 優先級：P1
- 狀態：**已完成**（子 PR 1～5b／5 全數完成，2026-07-25）
  - 子 PR 1／5（buy-only 模式改用 investableCash）已完成，PR #116（`feat/v7-0b-buyonly-investable-cash`）MERGED，merge commit `3882e713ebb03f5f4d14408a66f566c4fcf20848`，2026-07-25
  - 子 PR 2／5（standard 模式改用 investableCash）已完成，PR #118（`feat/v7-0b-standard-investable-cash`）MERGED，merge commit `ff08e0508190201ed2a0ed7a56f381228ca5c1ea`，2026-07-25。standard 模式的 `availableBuyBudget`／`cashShortfall`／`remainingBudget` 改用 investableCash；`investableCash === null` 阻擋條件由僅限 buy-only 擴大為兩種模式皆適用
  - 子 PR 3／5（Execution Eligibility investableCash contract）已完成，PR #120（`feat/v7-0b-execution-eligibility-contract`）MERGED，merge commit `26b8a864e51cd29e8e53405d52a15b8fdac94f8e`，2026-07-25。範圍僅限 `src/lib/rebalanceExecutionEligibility.ts` 與其測試檔：新增 013 §12.3 三個獨立欄位（`investableCash`／`executableAmount`／`externalFundingRequired`），移除舊版混用 CLEC `availableCash` 語意的死碼判斷；未觸碰 `App.tsx`、`RebalanceRecommendationPage.tsx`
  - 子 PR 4a／5（Order Helper characterization test 安全準備）已完成，PR #122（`feat/v7-0b-orderhelper-characterization`）MERGED，merge commit `a06890da3b07d4e79b95f0c5ed65c883618480e5`，2026-07-25。將 `App.tsx` 內的 `getOrderSuggestions` 邏輯抽出為純函式 `src/lib/rebalanceOrderHelper.ts`，新增 characterization test（`tests/getOrderSuggestions.test.ts`）覆蓋既有行為，**不涉及 investableCash 契約串接**，屬行為保留性質重構
  - 子 PR 4b／5（Order Helper investableCash 串接）已完成，PR #124（`feat/v7-0b-orderhelper-investablecash`）MERGED，merge commit `35859afc0e21e5f995c8303e0b4286f77c283f86`，2026-07-25。`getOrderSuggestions` 新增第 4 個參數 `investableCash: number | null`，`buyOnlyLimit`／`remainingBudget`／`shortage`／`cashEnough`／`cashLimited` 全部改用 investableCash 為基準（`null` 時保守視為 0，輸出欄位本身仍維持 `null`）；`App.tsx` 呼叫端改傳入 `householdLiquidityForRebalance.investableCash`，`getFundingSource` 改重用 `orderHelper.cashEnough`，交易建議清單卡片新增「可投資現金」欄位；新增 6 個邊界案例測試（19/19 通過）
  - 子 PR 5a／5（Dip Alert characterization test 安全準備）已完成，PR #126（`feat/v7-0b-dipalert-characterization`）MERGED，merge commit `122c9d12129078b5e0b90896275706f04bf579d7`，2026-07-25。將 `App.tsx` 內逢低加碼觀察清單的純價格判斷邏輯抽出為 `src/lib/dipAlertEngine.ts` 的 `getDipAlertRows` 純函式，新增 `tests/dipAlertRows.test.ts` 17 個 characterization test，**不涉及 investableCash 資金資格判斷**，屬行為保留性質重構
  - 子 PR 5b／5（investableCash 資金資格判斷串接進 Dip Alert，013 §14.2）已完成，PR #127（`feat/v7-0b-dipalert-investablecash`）MERGED，merge commit `83431910a7948d32f52deb0b98715080286f3fb3`，2026-07-25。新增 `DipFundingStatus`（`no-signal`／`data-insufficient`／`safety-cash-priority`／`observe-only`／`executable`）與純函式 `deriveDipFundingStatus`，落實 013 §14.2 五列狀態矩陣；`triggered`／純價格 `status` 判斷邏輯完全未變，與 `fundingStatus` 明確分離；UI 依 013 §14.3 更新文案；`tests/dipAlertRows.test.ts` 擴充至 24 個測試。驗收時發現「額外投入資金」「預計提領資金」欄位未實際寫回 `cashFlowProfile` 的既有缺口，已補登為 UR-TODO-039（與本 Todo 無關，PR #105 遺留問題）
- 涉及：
  - 再平衡與加碼建議
  - 交易建議清單
  - Order Helper（子 PR 4a／4b 已完成純函式抽出、characterization test 保護與 investableCash 契約串接；`src/lib/rebalanceOrderHelper.ts`，抽出前為 `App.tsx` 的 `getOrderSuggestions`）
  - Execution Eligibility（子 PR 2 已新增整合測試驗證 standard 現金不足判斷，子 PR 3 已補齊 013 §12.3 三個獨立欄位契約；`App.tsx`、`RebalanceRecommendationPage.tsx` 呈現層整合為已知限制，留待未來獨立項目）
  - standard（子 PR 2 已完成）
  - buy-only（子 PR 1 已完成）
  - Dip signal gate（子 PR 5a／5b 已完成，`src/lib/dipAlertEngine.ts` 的 `getDipAlertRows`／`deriveDipFundingStatus`，`triggered` 與 `fundingStatus` 明確分離）
  - CLEC `availableCash` 語意（子 PR 3 明確排除，留給 UR-TODO-010／Sprint 5，本次不拍板兩者關係）
- 原則：
  - 理論缺口與可執行金額分離
  - 買入總額不得超過 executableBudget
  - 安全現金不足不得產生可執行買單
- 已知限制（未修改，留待未來獨立項目）：
  - `RebalanceRecommendationPage.tsx` 「設定預算」與「現金缺口」欄位的靜態說明文字（「已取預算與流動現金較小值」「以現有流動現金計算」）語意已略為過時，實際基準已改為 investableCash，但屬 UI 文案變更，PR #116、#118 皆刻意排除在範圍外
  - `DipAlertCard` 目前程式碼庫內仍未被任何地方實際渲染呼叫（dead code，子 PR 5a／5b 皆維持此狀況），本次不處理是否應正式接上畫面
- 完成標準對照：程式碼完成（子 PR 1～5b／5 皆已合併）、自動測試通過（各子 PR 內文皆記錄通過）、Preview 驗收通過（各子 PR 內文附本機 dev server 唯讀驗收記錄）、PR Merge（#116／#118／#120／#122／#124／#126／#127 皆已由使用者手動 Merge）、Production 唯讀驗證通過（對應 Deploy GitHub Pages workflow 皆 `conclusion: success`，詳見 `003_CURRENT_STATUS.md` 第 12.2～12.6 節）——**五項完成標準全數達成，正式標記為已完成**

### UR-TODO-009 Risk & Decision Workflow Integration

- 詳細規格：`013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）§11、§19～25、§30（Sprint 4）

- 優先級：P1
- 狀態：**已完成**（子 PR 1～7 全數完成，2026-07-27）
  - 子 PR 1／2（安全準備：`todayDecision`／`investmentHealth` characterization test）已完成，PR #134（`feat/ur-todo-009-decision-characterization-prep`）MERGED，merge commit `5ad515ee95260cb52eb058484eaa281c634359b1`，2026-07-26。純搬移至 `src/lib/todayDecision.ts`／`src/lib/investmentHealth.ts`，新增 25 個 characterization test，無邏輯或輸出變更。
  - 子 PR 3（Risk Center §22 契約：`riskMetrics.ts` 改讀 Household Liquidity 輸出）已完成，PR #137（`feat/ur-todo-009-riskmetrics-household-liquidity`）MERGED，merge commit `490f88b6e087ae312f6debbe0e8b82a6c63821ff`，2026-07-26。`cashSafetyMonths`／`minimumCashTarget`／`stableCashTarget` 改讀 `householdLiquidityForRebalance` 輸出，取代自行重算的舊公式；集中度、槓桿、資產回撤、報價品質等既有獨立計算維持不變。
  - 子 PR 4（Risk Center／Portfolio Risk 呈現層）已完成，PR #140（`feat: Risk Center Household Liquidity presentation`）MERGED，merge commit `389a4f48aa441947a32cc8ea56c60a029b94855e`，2026-07-26。`RiskCenterPage.tsx`／`PortfolioRiskPage.tsx` 補齊每月必要支出、安全存量缺口、可投資現金、資料可信度與重複來源警示顯示；資料不足維持「資料不足」語意，不以 0 補值；明確不包含負債資料過期警示（UR-TODO-041）。
  - 子 PR 5（`todayDecision` 六層優先序改寫）已完成，PR #143（`feat: UR-TODO-009 Today Decision 六層優先序`）MERGED，merge commit `d2c2c1ecbac59357ffc5b84dca388ded61e34e5e`，2026-07-26。以固定六層順序（資料完整性→安全存量→可投資現金→配置偏離→逢低訊號→其他機會）產生 Today Decision，接回首頁「今日投資狀態」的「每日投資判斷流程」作為唯一「今日建議結論」；分析頁完整 `todayDecision` UI 不包含。
  - 子 PR 6（AI Decision §24 契約）已完成，PR #145（`feat: align AI Decision with liquidity contract`）MERGED，merge commit `5aa1d9e3c4fc364059b4fd6ab4a4de6bc34a594e`，2026-07-26。`aiDecision.ts` 的 `cash` 決策項改直接引用既有 Household Liquidity 的 `dataCompleteness`／`safetyCashShortfall`／`investableCash`／`protectedSafetyCash`；資料不足或必要值為 `null` 時不顯示精確投資金額，安全存量不足優先阻擋投資建議。
  - 子 PR 7（`homeDecision` 一致性收斂）已完成，PR #147（`feat: align home decision liquidity priority`）MERGED，merge commit `226c6bee75fe4ce8db884c08e63ded1fe08bc7f7`，2026-07-27。`deriveHomeDecision`（首頁「投資決策首頁」）改用與 Risk Center、AI Decision、`todayDecision` 相同的三層 liquidity 閘門（資料完整性→安全存量→可投資現金），消除先前首頁（6 個月門檻）與 Analytics（3 個月門檻）兩套矛盾門檻，達成 §20.3「結論必須一致」要求。
- 涉及：
  - Portfolio Risk
  - Dashboard
  - AI Decision
  - Investment Intelligence
  - Daily Decision Workflow
  - Investment Opportunities
  - Investment Action Center
- 優先順序（§11.2／§24.2 六層優先序）：
  1. 資料完整性
  2. 安全存量
  3. 可投資現金
  4. 配置偏離
  5. 逢低訊號
  6. 其他機會

**2026-07-26 唯讀盤點結論摘要**（完整報告見對話記錄，本節僅記錄正式狀態）：

- 確認 `m.repaymentSafetyMonths`／`m.monthlyPayment`（`calculateMetrics`）與 `riskMetrics.ts` 的 `cashSafetyMonths`／`minimumCashTarget`／`stableCashTarget` 為**兩套互相獨立、皆未讀取生活費的舊現金安全公式**，同時被 `investmentHealth`（Analytics 風險提醒）、`todayDecision`（首頁今日決策）、`RiskCenterPage`／`PortfolioRiskPage`、`aiDecisionItems`、`homeDecision`／首頁「投資決策首頁」的 `cashSafety`／`cashStatus` 共用，完全獨立於 `householdLiquidityForRebalance`（Sprint 1～3 已完成的核心模型）之外。
- Risk Center 現況對照 §22 八項要求：每月必要支出、安全存量缺口、可投資現金、資料可信度、重複來源警示、負債資料過期警示六項**缺失**；六／十二個月安全存量**公式不符**（只算月付，不含生活費）。
- AI Decision 現況對照 §24：`cash` 決策項引用來源正確標註但引用**錯誤的核心**（`deriveRiskMetrics` 而非 Household Liquidity 輸出）；無六層優先序覆蓋邏輯；資料不足文案與 §24.3 規定文字不符。
- 首頁 `homeDecision`（6 個月門檻）與 Analytics `todayDecision`（3 個月門檻）目前用兩套不同門檻判斷現金安全，結論可能互相矛盾，違反 §20.3「結論必須一致」。
- 子 PR 1／2（安全準備 characterization test）已依授權完成，**PR #134 MERGED**：`todayDecision`／`investmentHealth` 純搬移至 `src/lib/todayDecision.ts`／`src/lib/investmentHealth.ts`，新增 25 個 characterization test（`test:ci:unit-ts` 491→516/516），無任何邏輯或輸出變更。

**2026-07-26 架構決策拍板記錄（使用者本人拍板，非 AI 建議代為決定）：**

- **決策一（riskMetrics.ts 定位）**：確定為「`riskMetrics.ts` 改為讀取 `householdLiquidityForRebalance` 輸出」，而非讓 `RiskCenterPage`／`PortfolioRiskPage` 繞過 `riskMetrics.ts` 直接改接 household liquidity。理由：維持 V7.0B 全程採用的「單一事實來源、下游只讀不重算」原則；`riskMetrics.ts` 是 `RiskCenterPage`、`PortfolioRiskPage`、AI Decision、`homeDecision` 共用的中樞，修正它本身即可讓下游自動一併修正；`riskMetrics.ts` 保留集中度、槓桿、資產回撤、報價品質等非現金指標的既有獨立計算，僅現金安全相關欄位（`cashSafetyMonths`／`minimumCashTarget`／`stableCashTarget`）改吃 household liquidity 輸出（`monthlyEssentialExpenses`／`minimumSafetyCash`／`stableSafetyCash`／`safetyCashShortfall`／`investableCash`／`dataCompleteness`）。此決策作為**子 PR 3 的正式範圍依據**。
- **決策二（負債資料過期警示）**：確定延後處理，**不納入本次 Sprint 4 子 PR 4 範圍**，改列為獨立項目 **UR-TODO-041**（狀態「待盤點」，見下方條目）。理由：這是 §22 八項要求中唯一需要擴充 `013` §6 核心輸入契約（`HouseholdLoan` 新增 `asOf` 欄位＋新 blocking reason code）的項目，牽動核心模型，不符合「一次只做一件事、避免核心契約隨手擴充」原則。

**子 PR 拆分計畫（依上述兩項決策更新範圍說明）：**

1. 子 PR 1／2（安全準備）：**已完成**，PR #134 MERGED。
2. 子 PR 3（Risk Center §22 契約，依**決策一**）：**已完成**，PR #137 MERGED；`riskMetrics.ts` 已改讀 `householdLiquidityForRebalance` 輸出的現金安全相關欄位，取代自行重算的 `cashSafetyMonths`／`minimumCashTarget`／`stableCashTarget` 舊公式；集中度、槓桿、資產回撤、報價品質等既有獨立計算維持不變。
3. 子 PR 4（Risk Center 呈現，依**決策二**）：**已完成**，PR #140 MERGED 並通過 Production 驗證；`RiskCenterPage.tsx`／`PortfolioRiskPage.tsx` 已使用子 PR 3 新契約，顯示每月必要支出、安全存量缺口、可投資現金、資料可信度與重複來源警示；資料不足維持「資料不足」語意。**明確不包含負債資料過期警示**（UR-TODO-041）、Household Liquidity 核心公式、schema／localStorage／Firebase／JSON Backup、Dashboard、Today Decision、AI Decision 與交易功能。
4. 子 PR 5（`todayDecision` 六層改寫）：**已完成**，[PR #143](https://github.com/hyc640110/family-universal-rebalance/pull/143) MERGED 並通過 Production 驗證。六層固定優先序讀取 `dataCompleteness`／`safetyCashShortfall`／`investableCash`，每次只產生一個主決策；首頁唯一主結論為「今日建議結論」，資料同步提醒不覆蓋投資主決策。分析頁完整 `todayDecision` 不包含。
5. 子 PR 6（AI Decision §24 契約）：**已完成**，[PR #145](https://github.com/hyc640110/family-universal-rebalance/pull/145) MERGED 並通過 Production 驗證。`aiDecision.ts` 的 `cash` 決策項直接使用既有 Household Liquidity 的 `dataCompleteness`、`safetyCashShortfall`、`investableCash`、`protectedSafetyCash`；資料不足或必要值為 `null` 時不顯示精確投資金額或明確買入建議，安全存量不足優先阻擋投資建議，`investableCash === 0` 維持保留現金語意，`protectedSafetyCash` 僅作受保護證據、不列為可投資資金。PR CI `30211956784` 與 Deploy GitHub Pages `30212166683` 均成功，Production bundle 已驗證。
6. 子 PR 7（一致性收斂）：**已完成**，[PR #147](https://github.com/hyc640110/family-universal-rebalance/pull/147) MERGED 並通過 Production 驗證。`deriveHomeDecision`（首頁「投資決策首頁」）改用與 Risk Center、AI Decision、`todayDecision` 相同的三層 liquidity 閘門，消除先前首頁與 Analytics 兩套矛盾門檻，達成 §20.3「結論必須一致」。PR CI `30236461001` 與 Deploy GitHub Pages `30241261199` 均成功（本次以 `gh run list` 實際查詢確認），Production HTTP 200。

完成標準對照：程式碼完成（子 PR 1～7 皆已合併）、自動測試通過（各子 PR 內文皆記錄 `test:ci` 通過）、Preview／Production 驗證通過（各子 PR 皆有本機或 Production 唯讀驗證記錄）、PR Merge（#134／#137／#140／#143／#145／#147 皆已由使用者手動 Merge）、Production 唯讀驗證通過（PR #147 對應 Deploy GitHub Pages workflow `30241261199` `conclusion: success`，Production HTTP 200）——**五項完成標準全數達成，UR-TODO-009 正式標記為已完成**。下一主線（UR-TODO-010、UR-TODO-011）待評估，目前沒有已授權的下一主線；分析頁是否承接完整決策保留為產品決策，不新增正式 UR-TODO。

### UR-TODO-010 CLEC & Simulator Funding Semantics

- 詳細規格：`013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）第 15、26、27、30 節

- 優先級：P1
- 狀態：**已完成**（完成日期：2026-07-28）。PR #150（CLEC Funding Semantics）、PR #152（Simulator Funding 純模型）、PR #154（Simulator Funding 正式接線與呈現）、PR #156（假設動用安全現金開關與高風險警示）及 PR #157（PR #156 Merge 後治理同步）均已由使用者手動 Merge；完整收尾盤點確認範圍已閉環。
- CLEC：
  - **子 PR1 已完成**：`availableCash` → `householdLiquidityForRebalance.investableCash`；`cashReserve` → `householdLiquidityForRebalance.protectedSafetyCash`
  - **子 PR1 已完成**：`plannedContribution` → `state.cashFlowProfile.externalContribution`；`plannedWithdrawal` → `state.cashFlowProfile.plannedWithdrawal`
  - Preview 人工驗收：收支與現金流中心設定額外投入 `30,000` 元、預計提領 `50,000` 元後，CLEC 正確顯示計畫投入 `30,000` 元、計畫提領 `50,000` 元
  - 明確不包含：`clecStrategyRules.ts` 核心策略邏輯、`clecStrategy.ts` 文案、Simulator、Household Liquidity 核心公式、schema／localStorage／Firebase／JSON Backup
- Simulator：
  - **子 PR2A 已完成**：純 `deriveAllocationSimulatorFunding` selector 與 `tests/allocationSimulatorFunding.test.ts`。
  - `existingInvestableCash = max(0, totalLiquidCash - protectedSafetyCash)`，僅在兩者皆為已知有效數值時推導；不得把已含 externalContribution／plannedWithdrawal 效果的 `investableCash` 當作 existingInvestableCash。
  - `externalContribution`／`plannedWithdrawal` 的 absent、`null`、`NaN`、`Infinity` 維持 unavailable，不以 0 替代；明確數值 `0` 保持已知。
  - 預設不納入受保護安全現金；僅明確啟用時才使用 `max(0, min(protectedSafetyCash, totalLiquidCash))`，不得使用安全現金目標或高於實際流動現金的數值。
  - plannedWithdrawal 超過所有已知來源時，simulationAvailableFunding 回傳 0 並附 blocking／warning；不得無提示截斷。
  - **子 PR2B 已完成**：`App.tsx` 將 `totalLiquidCash`、`protectedSafetyCash`、`externalContribution`、`plannedWithdrawal` 四項正式來源傳入 Simulator；`AllocationSimulatorPage` 固定以 `allowSafetyCashUsage = false` 呼叫 selector，並唯讀顯示現有可投資現金、額外投入資金、受保護安全現金、預計提領資金、可用模擬資金五欄。受保護安全現金明確標示「預設不納入模擬」。
  - **子 PR2B 已完成**：舊「模擬投入金額」與清除按鈕已移除；existingInvestableCash 不重複加進 totalAssets。明確 `0` 保持已知；unavailable 時保留比例編輯與比例視覺比較但隱藏具體 funding／交易金額；超額提領時 funding 為 0 並顯示 blocking／warning、阻擋交易呈現。
  - Preview 人工驗收：五欄 funding breakdown、收支與現金流中心的投入／提領同步、安全現金不納入、舊輸入移除、比例調整、explicit zero、桌機與約 390px 手機版均通過。
  - **子 PR2C 已完成**：新增「假設動用安全現金」checkbox，預設關閉且僅為 `AllocationSimulatorPage` component-local session state；重整頁面或離開路由再返回後恢復關閉，不寫回 AppState、localStorage、Firebase 或 JSON Backup。
  - **子 PR2C 已完成**：checkbox 只把 `allowSafetyCashUsage` 傳入既有 selector；勾選時只納入 selector 回傳的 `usableProtectedSafetyCash`，不可使用安全現金目標或高於實際流動現金的數值。未勾選時受保護安全現金絕不納入可用模擬資金。
  - **子 PR2C 已完成**：勾選後立即顯示高風險警示「此為模擬假設，不代表建議實際動用安全現金。」（`role="alert"`、`aria-atomic="true"`）。安全現金原本已存在於 totalAssets；勾選只改變 simulationAvailableFunding 與資金上限，不重複增加 totalAssets／simulatedTotal。
  - **子 PR2C 已完成**：funding unavailable、`usableProtectedSafetyCash === null` 或明確已知 `0` 時 checkbox disabled；明確 `0` 顯示為 0、不誤判資料不足；超額提領仍完全遵循 selector blocking，不由 UI 解除。Preview 人工驗收確認上述行為、無持久化回寫，以及桌機與約 390px 手機版正常。
  - 完成標準對照：程式碼完成（PR #150、#152、#154、#156）、自動測試通過（各子 PR CI Verification 成功）、Preview 驗收通過（CLEC、Simulator funding breakdown 與安全現金假設均完成桌機／約 390px 驗收）、PR Merge（#150、#152、#154、#156、#157 均已由使用者手動 Merge）、Production 唯讀驗證通過（PR #157 對應 Deploy GitHub Pages workflow `30321000360` `conclusion: success`，Production HTTP 200、`environment=production`、正式 Assets 未混用 Preview）——**五項完成標準全數達成，UR-TODO-010 正式標記為已完成**。

### UR-TODO-011 Cross-Module Presentation Consistency

- 詳細規格：`013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）第 19、28、30～32 節

- 優先級：P1
- 狀態：已完成
- 完成日期：2026-07-28
- 完成子 PR：
  - **011A／PR #160**（MERGED，merge commit `47f01f81f484003fb9bfccc89de12d294071d1bb`）：新增純 `deriveDefensiveConfigurationPresentation` presentation contract 與專屬測試，明確呈現防守總比例、受保護安全現金、防守型持股比例、可投資現金、理論缺口、安全現金缺口、可執行方式與阻擋原因。此層只映射既有上游值，不重算財務公式、不將 `null`／`NaN`／`Infinity` 轉為 0；明確數值 0 維持已知。防守配置理論缺口缺少既有權威來源時維持 unavailable，不自行推算。
  - **011B／PR #162**（MERGED，merge commit `f41592d9bf1139488af5c4fb3597d9283f5bd929`）：Analytics 風險頁新增單一唯讀「防守配置狀態」卡片，使用 011A 的既有 presentation contract 呈現防守總比例、受保護安全現金、防守型持股比例、可投資現金、理論缺口、安全現金缺口、可執行方式與阻擋原因；Analytics 內重複的「防守資產補足提醒」已移除。明確 0、資料不足與 blocking reason 均維持可讀呈現；理論缺口仍維持 unavailable，不自行推算。Preview 桌機與約 390px 手機驗收通過。
  - **011C／PR #164**（MERGED，merge commit `bbc60fe2889c98d7883763d5dae057b257975321`）：Cash Flow 與 CLEC 的主要名稱統一為「額外投入資金／預計提領資金」。CLEC 只修改呈現文字，並說明「額外投入資金為本次計畫增加的資金；預計提領資金會先從可用資金扣除。」；未修改 CLEC 核心策略、Cash Flow 儲存流程、Simulator、財務公式或任何持久化契約。Preview 桌機與約 390px 手機驗收通過。
- 完整收尾：011A、011B、011C 與治理同步 PR #161、#163、#165 均已 Merge；CI、Production build、Preview build、桌機與約 390px Preview 驗收、Production 唯讀驗證及治理文件同步均已完成。Dashboard、UR-TODO-043、DipFundingSummary 與財務核心均未納入本 Sprint，**UR-TODO-011 正式標記為已完成**。
- 已完成呈現輸入：UR-TODO-010 子 PR1 Preview 驗收發現的 Cash Flow「額外投入資金／預計提領資金」與 CLEC「計畫投入／計畫提領」名稱差異，已於 011C 解決，不回溯修改 PR #150。
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
- 狀態：**已完成**
- 提出日期：2026-07-24
- 完成日期：2026-08-01
- 提出依據：PR #105（V6.17.3A.1 Entry Point，merge `2510169`）
- 背景：
  - PR #105 在「收支與現金流中心」（`CashFlowPage.tsx`）新增「家庭流動資金計畫」UI 區塊，可編輯 `externalContribution`（額外投入資金）與 `plannedWithdrawal`（預計提領資金），這是家庭流動性主題第一次修改正式 UI 頁面。
  - 此範圍未被 UR-TODO-006、UR-TODO-007 原始描述涵蓋，也未被 UR-TODO-011（Cross-Module Presentation Consistency）明確涵蓋。
- 2026-08-01 唯讀盤點結論（Claude Code，Review Mode，基準 `origin/main` HEAD `6380c4f`，未修改任何程式碼），逐項核對原「待確認」清單：
  - **與 UR-TODO-011「防守配置狀態」呈現規劃之間的關係與邊界 —— 已解決**：`defensiveConfigurationPresentation.ts`（011A 核心）全文搜尋 `externalContribution`／`plannedWithdrawal`／`cashFlowProfile` 零命中，確認與此 UI 區塊是完全獨立的資料領域，無功能重疊。**011C（PR #164）已直接處理過本項所擔心的命名邊界問題**：Cash Flow 的「額外投入資金／預計提領資金」與 CLEC 原本不同的「計畫投入／計畫提領」用詞已於 011C 統一為同一組正式名稱。
  - **是否需要與 Dashboard、Rebalance、Simulator 既有欄位整合或去重 —— 已釐清為不需要**：全庫比對 `externalContribution`／`plannedWithdrawal` 讀寫點確認 Dashboard（`investmentDashboard.ts`／`DashboardDecisionPage.tsx`）完全無金額輸入欄位；Simulator（`AllocationSimulatorPage.tsx`）與 CLEC（`ClecStrategyCenterPage.tsx`）皆已是唯讀顯示，舊版 Simulator「模擬投入金額」重複輸入欄位已於 UR-TODO-010 子 PR2B 移除。Rebalance「再平衡建議中心」`.rebalance-settings` 區塊（`App.tsx:1935`）雖另有「只買不賣可用加碼預算（萬）」（`buyOnlyBudget`）獨立輸入欄位，但比對 `householdLiquidity.ts` 核心公式（`executableBudget = min(configuredBudget, investableCash)`）確認 `configuredBudget` 與 `externalContribution`／`plannedWithdrawal` 是語意不同、互補而非衝突的兩個參數（前者為使用者手動設定的加碼支出上限，後者為家庭實際資金流入流出計畫），非同一欄位重複設計。
  - **手機／桌機一致性、萬元輸入驗證邊界案例 —— 已有紮實測試與專屬 CSS，涵蓋主要邊界類別**：`parseHouseholdLiquidityPlanWan()`（`householdLiquidityPlanInputUi.ts`）現有測試涵蓋空字串／零值／小數／負數／非數字／`Infinity` 關鍵字／科學記號／逼近安全整數邊界的大數；響應式 CSS 確認有專屬規則（`.household-liquidity-plan-row` 桌機雙欄、`styles.css:558` 手機斷點改單欄並將 input／button 最小觸控高度設為 44px），非僅沿用預設樣式；測試 8（`householdLiquidityPlanInputEntryPoint.test.ts`）以原始碼結構位置驗證欄位已正確依附「每月設定」卡片儲存按鈕（UR-TODO-039 修復成果）。少數次要輸入格式（前導零、正號前綴、多個小數點、千分位逗號）雖無逐一明確測試，但正規表示式預設安全拒絕，不構成阻擋性缺口。
- 結論：三項原始「待確認」事項皆已找到具體程式碼證據回答，**未發現任何需要修改程式碼的實質缺陷**；UR-TODO-011（尤其 011C 的命名統一）已直接解決本 Todo 最核心的疑慮。剩餘可補強之處（少數輸入格式測試覆蓋、跨頁資金輸入介面的說明文案清晰度）屬低優先級、非阻擋性的可選強化，不構成「待開發」的必要條件。
- 依賴（提出當時，現已釐清）：
  - UR-TODO-007（部分完成，尚未接 consumer——不影響本項結論，Plan Input 資料層本身持久化與正規化已完整，接 consumer 屬於 UR-TODO-007 自身範圍）
  - UR-TODO-011（已完成，見上方結論）
- 完成標準對照：本項為唯讀盤點性質的 Todo（「明確記錄此 UI Entry Point 與家庭流動性主題其餘 Sprint 的整合關係」），驗收條件為釐清邊界關係而非程式碼交付；本次盤點已明確記錄此 UI 區塊與 Rebalance、Risk、CLEC、Simulator、Cross-Module Presentation（UR-TODO-011）的完整整合關係，並確認未重複設計相同的資金輸入欄位，**驗收條件達成，正式標記為已完成**。

### UR-TODO-039 收支與現金流中心「額外投入資金」「預計提領資金」欄位未實際寫回

- 優先級：P1
- 狀態：**已完成**
- 完成日期：2026-07-26（PR #130，本次唯讀盤點確認）
- 完成 PR：#130 `fix: attach cash flow plan input fields to save button (UR-TODO-039)`（merge commit `3f8258168ddbeb5e28ae2a5e312a26b7e055fe26`）
- 提出日期：2026-07-25
- 提出依據：PR #127（V7.0B 子 PR 5b／5，Dip Alert investableCash 資金資格判斷串接）驗收時發現，PR 內文「Preview」段落「已知限制」明確記錄
- 問題（修復前）：
  - 使用者於「收支與現金流中心」（`CashFlowPage.tsx`）「家庭流動資金計畫」區塊（PR #105 新增，見 UR-TODO-036）設定「額外投入資金」（`externalContribution`）與「預計提領資金」（`plannedWithdrawal`）後，UI 顯示為「已設定」，但重新整理頁面後數值消失，實際未寫回 `cashFlowProfile`／localStorage。
  - 根因確認為**方向 B 問題**（非持久化層／schema 問題）：該區塊先前是獨立於「每月設定」卡片之外的另一張卡片，只依附各自欄位的「清除」按鈕，未連到頁面唯一的持久化出口（「儲存現金流設定」按鈕，其 `onClick` 才會呼叫 `onSave` 把 draft 寫回 `state.cashFlowProfile`）；`householdLiquidityInputAdapter.ts`、`cashFlow.ts`、`householdLiquidityPlanInputUi.ts` 三個檔案的底層邏輯本身無誤。
  - 此為 PR #105（V6.17.3A Plan Input Foundation）既有功能缺口，與 V7.0B（UR-TODO-008）或子 PR 5b 本身無關。
- 修復內容（PR #130，方向 B：維持單一 Save 按鈕模式）：
  - `src/pages/CashFlowPage.tsx`：將「家庭流動資金計畫」區塊（`<h2>` + 說明文字 + 兩個 `PlanInputField`）從獨立的 `<section className="card household-liquidity-plan-input">` 移入「每月設定」卡片（`<section className="card cashflow-form">`）內、`<div className="actions">`（儲存／清空按鈕）之前，改用不帶 `card` class 的 `<div className="household-liquidity-plan-input">` 包裹；既有說明文字逐字保留，新增一句「填寫後請於下方按下『儲存現金流設定』按鈕，此頁僅有這一個儲存動作。」
  - `src/styles.css`：`.cashflow-form` grid-column 規則新增 `.household-liquidity-plan-input` 選擇器維持全寬版面；新增 `padding-top`／`border-top` 作為卡片內分隔線（取代原本的獨立卡片邊框）。
  - `tests/householdLiquidityPlanInputEntryPoint.test.ts`：新增測試 8，以原始碼結構位置驗證欄位已位於「每月設定」卡片內、儲存按鈕之前，且不再擁有獨立 `card` class；`test:ci:unit-ts` 491/491（含新增測試）。
  - 明確不包含：`householdLiquidityInputAdapter.ts`、`cashFlow.ts`、`householdLiquidityPlanInputUi.ts` 邏輯（唯讀盤點已確認正確）；`localStorage` schema／`state.cashFlowProfile` 結構未變更。
- Preview 驗收（PR #130 內文記錄）：本機 dev server 設定「額外投入資金」5 萬、「預計提領資金」3 萬 → 點擊「儲存現金流設定」→ `localStorage` 確認已寫入 `externalContribution: 50000`／`plannedWithdrawal: 30000` → `window.location.reload()` → 兩欄位仍顯示「已設定」，確認修復前會遺失、修復後不會遺失；390px 版面無橫向溢出；console 無錯誤。
- 依賴：
  - UR-TODO-036（Household Liquidity Plan Input UI Entry Point，同一 UI 區塊，狀態「待盤點」，本次修復未變更其待確認事項）
  - UR-TODO-007（部分完成，本缺口屬於其「Plan Input 持久化」範疇的既有功能落差，本次已修復其中的 UI 依附問題）
- 完成標準對照：程式碼完成（PR #130 已合併）、自動測試通過（`test:ci:unit-ts` 491/491）、Preview 驗收通過（本機 dev server 設定→儲存→reload 驗證記錄）、PR Merge（#130 已由使用者手動 Merge）、Production 唯讀驗證通過（`Deploy GitHub Pages` workflow run `30183361782` `conclusion: success`）——**五項完成標準全數達成，正式標記為已完成**。

### UR-TODO-040 工具分頁扁平版面與重複導覽路徑

- 優先級：P1
- 狀態：**CLOSED／Production Verified**
- 提出日期：2026-07-26
- 完成日期：2026-08-18
- 完成 PR／Merge：PR [#380](https://github.com/hyc640110/family-universal-rebalance/pull/380)，head `df9f03e987596c61a0a5ea164eb9af0883ad517f`，由使用者以一般 2-parent merge commit `84b6859cd486fd4b8deccd87cca99df38cd28692` 合併（parents：`43fcca43782e103aad5b6dd362eb631c483d79eb`／`df9f03e987596c61a0a5ea164eb9af0883ad517f`）；未使用 admin override。現行 `origin/main` 已確認為相同 SHA。
- 最終產品契約：
  - **Tool Center 是完整工具目錄**；首頁以四區 IA 呈現：**今日決策／管理與追蹤／規劃與模擬／規劃中**。
  - `ToolQuickNavigation` 的責任是「返回工具中心」加上最多 **3** 個 contextual related tools；不再重複完整 14～15 個工具目錄。
  - `ToolNature` 只描述真實建議／假設模擬的產品性質，**不再兼任 IA 分組**。
  - planned／non-routed tools 不進入 Quick Navigation；`current` 未定義或找不到目前工具時一律 fail closed，不猜測或回退為完整目錄。
- Merge 前與 Preview 證據：CI Verification [run 32040880998](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32040880998) success；Production build、Preview build success；Preview deployment [run 32041251407](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32041251407) success。使用者已完成相同 PR head 的 Desktop 與 390 × 844 Preview 人工驗收。
- Production Closeout：Deploy GitHub Pages [run 32041768489](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32041768489) 最終 success，regression gate、Production build 與 Pages deploy 均 success，Production source SHA=`84b6859cd486fd4b8deccd87cca99df38cd28692`。Production root HTTP 200；實際 bundle `index-DFldBSkN.js` 與本次 Production build 一致，部署前 `index-DIAMR26i.js` 已不再載入。
- Production automated smoke／contract evidence：四個 Tool Center 分區存在；ETF X-Ray 與蒙地卡羅模擬為 non-routed planned tools；Quick Navigation 為最多 3 個 related links 且 undefined current fail closed；`/assets#transactions-section` App 內 React Router + hash navigation regression contract PASS。GitHub Pages 對直接 server-side HTTP 請求 `/assets` 的既有 SPA deep-link 404 不屬本 Todo regression。
- 驗收界線：Production 本次**未重新做人工瀏覽器視覺驗收**；UI 人工證據只沿用完全相同 PR head 的 Preview Desktop／390 × 844 驗收。Production Verified 的依據是上述 Production workflow、source／bundle、HTTP 與 automated smoke evidence，不得誤寫為 Production 人工驗收。

### UR-TODO-041 負債資料過期警示

- 優先級：待評估（2026-07-26 由 P1 調整）
- 狀態：**CLOSED（2026-08-05）／已完成**——**治理記錄落差修正**：功能已於 2026-08-05 完整實作、測試、Merge 並上線 Production，僅本條目狀態長期未同步更新，2026-08-15 唯讀盤點（Review Mode Closeout Audit）發現此落差後補正
- 完成日期：2026-08-05
- Merge 資訊：**PR [#254](https://github.com/hyc640110/family-universal-rebalance/pull/254)**（`feat: UR-TODO-041 loan data staleness warning (Plan A, standalone indicator)`），merge commit `e11da75a476c4d426fedefabcc629b01f305a181`，`mergedAt: 2026-08-05T12:29:58Z`。因涉及 schema 新增（`LoanItem` 新欄位）與 Risk Center 呈現邏輯變更，依 `007_GIT_WORKFLOW.md` §8.2 明文列為「不得自行 Merge 的重大事件」，由使用者於 Preview 驗證後親自手動 Merge，**未使用 admin override**。
- 提出日期：2026-07-26
- 提出依據：UR-TODO-009（Risk & Decision Workflow Integration，Sprint 4）唯讀盤點過程中發現，對照 `013_HOUSEHOLD_LIQUIDITY_SPEC.md`（v4.0）§22 Risk Center 規格要求時比對出的缺口項目——當時 §22 明列 Risk Center 必須新增或統一的八項目中包含「負債資料過期警示」，目前完全缺失，且底層核心模型本身也未定義這個概念（`HouseholdLoan` 型別只有 `{ loanId, monthlyPayment }`，無任何 `asOf`／更新時間欄位；現行 23 個 blocking reason code 中沒有「過期」相關 code）。2026-07-26 已由使用者拍板延後（決策二：一次只做一件事、避免核心契約隨手擴充，牽動核心模型的變更需獨立評估），不納入 UR-TODO-009 子 PR 4（Risk Center 呈現）範圍，正式排入時再獨立評估。
- **實際落地範圍**：開發前唯讀盤點發現原始「驗收條件」文字假設的路徑（擴充 `HouseholdLoan` 核心契約＋新增 blocking reason code）會產生非預期連帶效果——`householdLiquidity.ts` 的 `canExecuteBuy` 由 `blockingReasons.length === 0` 直接控制，`dipAlertEngine.ts`／`aiDecision.ts` 皆以 `dataCompleteness !== 'complete'` 觸發既有保守化行為（後者直接替換整張 AI Decision 現金卡片文案），任何新增到 `blockingReasons` 的 code 都會連帶觸發這些既有保守化機制，與「不得阻擋或保守化任何買賣建議、AI Decision 輸出」的設計原則直接衝突。**使用者於開發當下重新拍板，改採完全獨立、不進 `blockingReasons`／`dataCompleteness` 路徑的過期指標（Plan A）**：
  1. 新增 `src/lib/loanDataFreshness.ts`：`LOAN_DATA_STALE_THRESHOLD_DAYS = 30`（固定 30 天門檻）；`isLoanDataStale(asOf, today)` 沿用既有 UR-TODO-043-B 確立的 Asia/Taipei canonical calendar-day 契約；`deriveLoanDataFreshness(loans, today)` 純函式，逐筆獨立回傳 `{ loanId, asOf, isStale }`。
  2. `LoanItem`（`src/App.tsx`，實際持久化型別）新增 `asOf?: string`（可選，向下相容）；`RiskLoan`（`src/lib/riskMetrics.ts`）新增 `asOf?: string`（純 passthrough，`deriveRiskMetrics()` 計算邏輯完全未讀取）。**明確未改動** `HouseholdLoan`（`householdLiquidity.ts`）、`HouseholdLiquidityLoanSource`、23 個既有 `HouseholdLiquidityReasonCode`——**未新增任何 blocking reason code**，與原始「驗收條件」文字的預期路徑不同，是開發當下重新拍板的更安全方案。
  3. Migration：`sanitizeLoanItem()`（`normalizeState()` 既有單一正規化入口，涵蓋 localStorage／Firebase／JSON Backup 三路）新增邏輯——`asOf` 若已是有效 canonical calendar-day 則原樣保留、缺失或無效才一次性預設為今天；編輯 `principal`／`annualRate`／`monthlyPayment`／`startDate`／`totalMonths` 任一金額相關欄位會自動同步更新 `asOf`（僅編輯 `name` 不會）。
  4. UI：`/tools/risk-center`（`RiskCenterPage.tsx`）既有「借款安全分析」卡片逐筆借款區塊，過期時顯示「負債資料過期提醒：上次確認於 {asOf}，已超過 30 天。這不會影響任何買賣建議或安全存量計算，僅提醒您確認資料是否仍正確。」＋「我已確認這筆資料仍正確」按鈕（只更新該筆 `asOf` 為今天，不觸碰其他欄位），樣式 `.risk-loan-stale-warning`（琥珀色警示，與同頁「資料可信度」指標視覺區隔）。
- 技術落地：新增 `tests/loanDataFreshness.test.ts`（5 項）、`tests/loanDataStalenessMigration.test.ts`（5 項，Vite SSR 載入 `normalizeState`／`stateFromBackup`／`stateFromFirebasePayload` 驗證三路 persistence）；`tests/householdLiquidityInputAdapter.test.ts` 新增第 24 項（明文標題「a stray `asOf` on a loan source (Plan A staleness data) never reaches HouseholdLoan or changes deriveHouseholdLiquidity output」，直接證明過期指標不影響 `dataCompleteness`／`canExecuteBuy`／可投資現金／AI Decision 現金卡片文案等任何下游輸出，鎖定「軟警告」設計保證）。2026-08-15 治理稽核重新執行前 10 項（`loanDataFreshness.test.ts`＋`loanDataStalenessMigration.test.ts`）確認 **10/10 pass**；`npx tsc -b`、`npm run test:ci`、`npm run build`、`npm run build:preview` 於原始 PR #254 皆已成功。隔離本機 dev server 實機驗證（原始 PR）：migration 後既有負債不顯示過期警示；手動將 `asOf` 設為 40 天前並重新整理，警示正確出現；點擊「我已確認」後 `asOf` 立即更新、警示立即消失；Plan A 零連帶效果逐項比對（過期前後其餘資料完全相同：資料可信度、可投資現金、安全存量缺口、AI Decision 現金卡片文案皆不變）；390px 無橫向溢出。
- 明確不包含：`dataCompleteness` 降級為 `insufficient`；新增任何 blocking reason code、修改 23 個既有 code 清單；阻擋或保守化任何買賣建議、AI Decision、Rebalance 輸出；`monthlyPayment` 之外任何欄位語意修改；負債資料其他缺口（新增負債類型、利率等）。
- 依賴：UR-TODO-009（子 PR 4 明確排除本項目，共用同一組 Risk Center UI）；UR-TODO-006（本項目原評估需擴充其核心輸出契約，實際落地已確認不需要）。
- 驗收條件對照原始文字的差異：原條目要求「`HouseholdLoan` 輸入契約新增 `asOf`、新增對應 blocking reason code」，實際落地**未採用**此路徑（理由見上方「實際落地範圍」），改以完全獨立指標達成同等使用者可見效果（過期提醒＋確認按鈕），且風險更低——**此差異已於本次治理補記中明確記錄，非驗收條件未達成**。

### UR-TODO-042 PortfolioRiskPage「槓桿暴露」卡片 React 重複 key console error

- 優先級：**待評估**
- 狀態：**已完成**
- 提出日期：2026-07-26
- 完成日期：2026-08-01
- 完成 PR：[#209](https://github.com/hyc640110/family-universal-rebalance/pull/209)（`fix/ur-todo-042-portfolio-risk-key-collision`），merge commit `e81259a3c180aa557aa21b4b1663975aeb85b488`，`mergedAt: 2026-08-01T06:54:11Z`，`mergedBy: hyc640110`
- 提出依據：UR-TODO-009 子 PR 3（PR #137，riskMetrics.ts 改讀 Household Liquidity 輸出）Preview 驗收時發現，與本次 riskMetrics 改動無關，唯讀盤點確認 `src/pages/PortfolioRiskPage.tsx`／`src/lib/portfolioRisk.ts` 在該次 PR 分支中零異動，純屬既有缺陷
- 問題（修復前）：`PortfolioRiskPage.tsx` 的「槓桿暴露」卡片（`Rows` 元件）第二列 `["占總資產", pct(view.leverage.totalPct), view.denominatorLabel]` 中，第一格固定文字「占總資產」與第三格 `view.denominatorLabel`（其值同樣為「占總資產」）相同，`Rows` 元件以 `key={item}` 作為同一列內每個儲存格的 React key，導致同一列兩個儲存格 key 重複，瀏覽器 console 出現「Encountered two children with the same key」錯誤。
- 2026-08-01 唯讀盤點重新確認：本次啟動開發前重新以 `origin/main` HEAD `1c03fbe` 核對，缺陷與 2026-07-26 記錄完全一致、未被任何後續 PR 意外修正，`denominatorLabel` 仍固定為字面常數 `'占總資產'`（`src/lib/portfolioRisk.ts:36`）。
- 修復內容（PR #209）：`src/pages/PortfolioRiskPage.tsx` 的 `Rows` 元件，儲存格 key 由 `key={item}`（依賴儲存格文字內容）改為 `key={index}`（依賴欄位索引，同一 `row.map()` 呼叫內天然唯一）；僅 1 行變更，未觸碰 `src/lib/portfolioRisk.ts`、Household Liquidity 核心公式、schema 或任何其他頁面。
- 驗證：`npx tsc -b` 通過；`test:ci` 全數通過（exit code 0，0 fail）；Production build 成功；本機以 `--mode preview-deploy` 啟動隔離 Preview 環境（未使用使用者實際 Production 資料），瀏覽器導覽至 `/tools/portfolio-risk`，確認「槓桿暴露」卡片「占總資產／0.0%／占總資產」列（原重複 key 觸發列）內容不變、`read_console_messages` 確認無任何「Encountered two children with the same key」警告。Merge 後 `Deploy GitHub Pages` workflow run `30688639249`（`conclusion: success`，headSha `e81259a` 與 merge commit 一致）；Production／Preview 本次以 `curl` 實測皆 `HTTP 200`，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑（`/assets/...` vs `/preview/assets/...`）未混用。
- 依賴：無（獨立於 UR-TODO-009／013 家庭流動性系列）
- 完成標準對照：程式碼完成（PR #209 已合併）、自動測試通過（`test:ci` 0 fail）、Preview 驗收通過（隔離瀏覽器實測 console 無警告、畫面內容不變）、PR Merge（#209 已由使用者手動 Merge）、Production 唯讀驗證通過（`Deploy GitHub Pages` workflow 成功、headSha 一致、HTTP 200、環境隔離正常）——**五項完成標準全數達成，正式標記為已完成**。

### UR-TODO-049 交易匯入中心匯入預覽勾選框點擊會觸發 ErrorBoundary crash

- 優先級：**待評估**
- 狀態：**已完成**（2026-08-08，[PR #280](https://github.com/hyc640110/family-universal-rebalance/pull/280)）
- 提出日期：2026-08-07
- 完成日期：2026-08-08
- 提出依據：交易匯入中心「正式批次匯入已選列」二次確認機制開發（非既有 UR-TODO 編號，由使用者直接下達指令，[PR #270](https://github.com/hyc640110/family-universal-rebalance/pull/270)）驗收過程中，以真實瀏覽器點擊（非程式化事件）測試取消勾選匯入預覽列時意外觸發，與 PR #270 的實際變更範圍（`commit()` 內的 `window.confirm()` 與按鈕 `disabled` 邏輯）完全無關；唯讀比對確認 `main` 分支在 PR #270 之前就已存在此段程式碼、PR #270 全程未觸碰。
- 問題：`src/components/import/ImportCenter.tsx` 匯入預覽列表的勾選框：

  ```tsx
  <input type="checkbox" checked={row.selected} disabled={Boolean(row.error)}
    onChange={event => setPreview(current => current.map(item =>
      item.rowNumber === row.rowNumber ? { ...item, selected: event.currentTarget.checked } : item))} />
  ```

  傳給 `setPreview` 的 state updater function 在其函式本體內讀取 `event.currentTarget.checked`；以真實瀏覽器點擊觸發（而非測試用的程式化 `dispatchEvent`）時會拋出 `TypeError: Cannot read properties of null (reading 'checked')`，被 `<ImportCenter>` 的父層 `ErrorBoundary` 攔截，畫面整個被錯誤畫面取代（「系統發生錯誤」），使用者必須「重新整理頁面」才能恢復，當下輸入的匯入設定（帳戶、檔案、mapping）全部遺失。
- 重現步驟：交易匯入中心 → 選擇帳戶 → 上傳有效 CSV → 產生匯入預覽 → 以滑鼠實際點擊任一列的勾選框（取消或重新勾選皆會觸發）。
- 影響範圍：僅限「產生匯入預覽」後、勾選框互動這一個路徑；不影響「正式批次匯入已選列」本身的確認流程（PR #270 新增的 `window.confirm()` 與 disable 邏輯皆在此 crash 之後才會執行到，兩者互不相關）；不影響已寫入的交易資料或既有匯入紀錄。
- 懷疑成因（未深入除錯，待正式排入時確認）：`event.currentTarget` 是否會在 `setPreview` 的 updater function 實際執行時（可能被 React 排程延後至下一個 microtask／render 之後）已被瀏覽器或 React 事件系統清空為 `null`；需要確認是否為 React SyntheticEvent 生命週期問題，或其他成因。
- 明確不包含（唯讀盤點階段）：本次盤點未修改任何程式碼、未嘗試修復，僅記錄重現步驟與初步懷疑方向。
- 建議修正方向（未拍板，待排入時決策）：在 `onChange` handler 內、`setPreview` 呼叫之前，先把 `event.currentTarget.checked` 讀進一個區域變數，再於 updater function 中使用該變數，避免在延遲執行的 updater 內存取可能已失效的 event 物件。
- 依賴：無，與 UR-TODO-046、UR-TODO-001 等系列無關，可獨立排程。
- **開發前唯讀盤點確認成因與影響範圍（2026-08-08）**：
  1. 以隔離本機 dev server 對現有（修復前）程式碼實際重現：以 jsdom + `react-dom/client` 渲染真實元件並呼叫原生 `HTMLInputElement.click()`（而非程式化 `dispatchEvent(new Event('change'))`），確認會拋出與 Production 完全相同的 `TypeError: Cannot read properties of null (reading 'checked')`，堆疊指向 `ImportCenter.tsx:168`——**懷疑成因確認為真正根因**：`event.currentTarget` 在傳給 `setPreview` 的 functional updater 內被讀取時已經是 `null`，因為 React 只在同步 dispatch 完成後才會清空 SyntheticEvent 的 `currentTarget`（這個行為在 React 17 移除 event pooling 後仍然存在，是刻意模擬原生 DOM `currentTarget` 只在 dispatch 階段有效的語意），而 updater 本身有可能在此之後才被 React 實際呼叫。
  2. 全庫搜尋確認 `src/` 內僅此一處有「把 `event` 直接傳入延遲執行的 `setX(current => ...)` functional updater、於 updater 內部才讀取 `event.currentTarget`」這個模式；未發現其他檔案有同類風險，故本次修復範圍維持僅限本檔案，未發現需要另行回報的同類問題。
- **修復（2026-08-08，[PR #280](https://github.com/hyc640110/family-universal-rebalance/pull/280)）**：`onChange` handler 改為先同步讀出 `const checked = event.currentTarget.checked`，再於 `setPreview` 的 updater 內使用這個已擷取的區域變數，不再於 updater 內存取 `event`。範圍僅 1 個 `onChange` handler，未觸碰其餘勾選框邏輯、「正式批次匯入已選列」的 `window.confirm()`（PR #270 範圍）或「撤銷」按鈕（UR-TODO-051 範圍）。
- **新增測試（`tests/importCenterCheckboxRealClick.test.ts`）**：新增 `jsdom` 為 devDependency（專案先前完全沒有 DOM 測試基礎設施，僅靠 `react-dom/server` 的 `renderToStaticMarkup` 做靜態渲染斷言，無法重現此類「延遲執行 callback 內存取失效 event」的時序缺陷，經評估後認定唯有真實 DOM 環境才能誠實驗證此修復，故新增此依賴，範圍僅限這一個測試檔）；測試以 `react-dom/client` 掛載真實 `ImportCenter` 元件（含 `MemoryRouter`，因元件內部使用 `react-router-dom` 的 `Link`），完整走過選帳戶／上傳 CSV／產生預覽／原生 `.click()` 勾選框的真實互動路徑；**已驗證此測試在修復前的程式碼上會失敗**（拋出與 Production 完全相同的錯誤訊息與堆疊位置），**修復後通過**，證實為有效的迴歸測試而非空殼斷言。
- 驗證：`npx tsc -b`、`npm run test:ci`（825 項全數通過，含新增迴歸測試）、Production／Preview `vite build` 皆成功；隔離本機 dev server 桌機 1280px＋手機 390px 皆以真實原生 `.click()`（透過 `element.click()` DOM API，非程式化 `dispatchEvent`）連續點擊多列勾選框（取消、重新勾選、連續切換），確認皆不再觸發 `ErrorBoundary`、`selected` 狀態正確反映每次切換、390px 無橫向溢出（`scrollWidth === clientWidth`）；以全新瀏覽器分頁排除瀏覽器 console 歷史訊息殘留疑慮後確認 console 全程無新增錯誤。
- **正式結案（2026-08-08）**：依 UR-TODO-050 方案 B 新流程，Claude Code 先執行 `workflow_dispatch` 刷新 Preview（run `31199468039`，success），使用者於 Preview 以真實裝置（桌機＋手機）依驗收步驟逐項確認通過後直接指示 Merge。因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後觸發的 push 部署（run `31200283374`）完整成功，`Find last successful workflow_dispatch run`／`Download`／`Extract` 三步驟正確沿用剛才那次 `workflow_dispatch` 的 Preview 內容；Production／Preview `curl` 實測皆 `HTTP 200`。**UR-TODO-049 正式標記為已完成。**

### UR-TODO-050 `deploy.yml` Preview 部署會被非相關 main push 覆蓋（race condition）

- 優先級：待評估
- 狀態：**已完成**（方案 B，2026-08-07，[PR #277](https://github.com/hyc640110/family-universal-rebalance/pull/277) ＋熱修 [PR #278](https://github.com/hyc640110/family-universal-rebalance/pull/278)）
- 提出日期：2026-08-07
- 完成日期：2026-08-07
- 提出依據：UR-TODO-030（首頁 30 秒決策中心精簡，PR #268）Preview 驗收過程中意外發現，與 UR-TODO-030 本身變更範圍無關；唯讀比對確認此為 `deploy.yml` 自 [PR #264](https://github.com/hyc640110/family-universal-rebalance/pull/264)（Actions-based Pages 部署遷移）就存在的既有設計，本次僅是第一次因驗收過程恰好遇上而被發現。
- 問題：`deploy.yml` 對 `push: branches: [main]` 與 `workflow_dispatch` 兩種觸發方式都會重新建置並部署整個 combined Pages artifact（Production ＋ Preview）；其中 Preview 的來源固定是「觸發這次 run 的 ref」——對 `push` 事件而言該 ref 就是 `main` 本身。因此只要在某個 Draft PR 以 `workflow_dispatch` 手動部署 Preview 完成、尚未 Merge 期間，若有任何其他 PR 這時 merge 到 main（觸發 push 事件），該次 push 觸發的部署會把 `/preview/` 整個重新蓋成 main 目前內容，導致原本要驗收的 Preview 分支內容消失，使用者會看到「舊版」畫面，且找不到明顯原因（部署本身皆回報成功，不是失敗）。
- 重現步驟（2026-08-07 UR-TODO-030 驗收過程實際發生）：`workflow_dispatch` 部署 `feat/ur-todo-030-homepage-simplification` 分支 Preview 於 `11:23 UTC` 成功 → 兩支不相干 PR（#270、#271）分別於 `12:52`、`12:57 UTC` merge 到 main，各自觸發一次 push 部署，皆把 `/preview/` 覆蓋回 main 內容 → 使用者於 `13:xx UTC` 驗收時發現畫面是舊版 → 排查過程排除瀏覽器快取、Service Worker（`public/sw.js` 本身為 cache-disabled 的純轉發實作，非成因）、CDN 快取（`index.html` 引用的 `<script>` hash 直接證實是 main 的 build 產物，非快取殘留）→ 重新以 `workflow_dispatch` 部署後才恢復正確。
- 影響範圍：僅影響「Draft PR 使用 Preview 驗收」這個流程環節；不影響 Production（Production 一律固定從 `main` build，內容本來就正確，未曾出現本問題）；不影響已 Merge 的 PR 或任何持久化資料。
- 明確不包含：本次未修改 `deploy.yml` 或任何 workflow 設定，僅記錄問題重現步驟與可能方向，未拍板任何修正方案。
- 建議修正方向（未拍板，待排入時決策）：
  1. **方案 A（暫定採用，目前不需修改 workflow）**：Preview 驗收時效性配合——驗收前留意近期是否有其他 PR 即將 merge，驗收完成後盡快決定 Merge 或至少完成記錄；若驗收途中被覆蓋，重新以 `workflow_dispatch` 觸發即可恢復。
  2. 方案 B：`push` 到 `main` 時只重建／部署 Production，`/preview/` 只在 `workflow_dispatch` 觸發時更新；代表「Preview」語意由「與 Production 同步」改為「上次手動驗收的某個分支」，需要先想清楚這個語意轉變是否可接受。
  3. 方案 C：每個 Draft PR 使用獨立路徑（例如 `/preview/pr-<number>/`），互不覆蓋；改動範圍較大，需另外規劃 URL 規則與 PR 關閉後的清理機制。
- 依賴：無，與 UR-TODO-037（Branch Protection／GitHub Environment）系列相關但可獨立排程，不互相阻擋。
- **2026-08-07 使用者拍板採方案 B，開發中**（`infra/ur-todo-050-preview-race-condition-fix` 分支，基準 `origin/main` HEAD `ffd73cf`）。開發前唯讀盤點確認：
  1. Production／Preview 共用同一個 `build` job，最後由單一 `actions/deploy-pages@v4` 部署成一個會**完整取代整個網站**的合併 artifact（no partial/incremental update，`deploy.yml` 原本註解已明講）——因此「push 到 main 時不重建 Preview」不能只是加一個 `if:` 條件跳過建置，否則下一次 push 部署的 artifact 會完全不含 `/preview/`，讓 Preview 變成 404，而不是「維持原樣」，違反驗收條件「既有 Preview 內容不受影響、不被覆蓋」。
  2. Preview 目前只由 `workflow_dispatch` 觸發更新（實務上是 Claude Code 依使用者指示執行 `gh workflow run deploy.yml --ref <branch>`），`push` 事件則是任何 PR Merge 到 main 時自動觸發，兩者共用同一支 workflow、同一組觸發條件。
  3. `ci.yml`（Branch Protection 要求的 `verify` check）是完全獨立的 workflow 檔案，只在 `pull_request` 事件觸發，與 `deploy.yml` 毫無關聯，本次變更不影響。
- **實作方案（方案 B 的正確版本）**：Production 每次 `push`／`workflow_dispatch` 都照舊從 `main` 重新建置。Preview 只在 `workflow_dispatch` 才重新建置／測試；`push` 事件改為用 `gh run list --workflow=deploy.yml --event=workflow_dispatch --status=success` 找出最近一次成功的 `workflow_dispatch` run，透過 `actions/download-artifact@v4`（指定 `run-id`）下載該次的 `github-pages` Pages artifact（`.tar` 格式，需自行 `tar -xf` 還原），取出其中的 `preview/` 資料夾原封不動放進本次合併 artifact，而不是重新建置。若完全找不到任何先前成功的 `workflow_dispatch` run（例如本次修改剛上線的第一次 push），才 fallback 為把 `main` 的 build 產物暫時鏡射進 `/preview/`，確保不會出現完全空白的 404。新增 `permissions.actions: read` 供讀取／下載其他 run 的 artifact。
- **語意變化（給未來所有驗收流程參考）**：Preview 不再是「與 main 保持同步、只是偶爾手動刷新」，而是「永遠等於上一次明確 `workflow_dispatch` 部署的內容，直到下一次明確 dispatch 為止」——**往後每次要驗收某個 PR，都需要先請 Claude Code（或自行）執行一次 `workflow_dispatch` 才能確保 Preview 反映該 PR 的最新內容；反之，日常的 main push（例如其他 PR 合併、純文件同步）不會再意外刷新或蓋掉正在驗收中的 Preview。**
- 驗證：`.github/workflows/deploy.yml` 以 `npx js-yaml` 確認語法合法；`workflow_dispatch` 路徑（Preview 正常重建）已於 Draft PR 對應分支手動觸發驗證。
- **正式結案（2026-08-07）**：使用者驗收通過並指示 Merge，[PR #277](https://github.com/hyc640110/family-universal-rebalance/pull/277)（merge commit `702c0a1daa1faaf0f36f0a968aa75d5bc1a529d7`）Merge 後觸發的第一次真實 `push` 部署（run `31196093740`）**實際失敗**：`gh run list` 因無法自動偵測 repo（該步驟 cwd 為 workspace 根目錄，本 workflow 所有 checkout 皆用 `path:` 指向子目錄，根目錄本身從未是 git repo）而報錯，導致整個 `build` job 失敗、`deploy` 未執行——**該次 push 對應的 Production 部署未更新**（非中斷／無法存取，只是暫時停留在上一個 commit，唯讀確認 Production 全程仍可正常瀏覽，無使用者可見影響）。已依使用者指示「下一次 main push 主動回報」立即回報並修正：[PR #278](https://github.com/hyc640110/family-universal-rebalance/pull/278) 熱修——`gh run list` 加上明確 `--repo "$GITHUB_REPOSITORY"`，並讓查詢／下載／解壓三步驟皆加上 `continue-on-error: true`，最後 fallback 判斷條件從「有沒有查到先前的 run」改為「`combined/preview/index.html` 是否真的存在」，確保無論是查詢失敗、下載失敗、artifact 過期或任何其他原因，只要最終沒有成功 reuse 到內容就一律 fallback 鏡射 main，讓 reuse 這條輔助路徑永遠不可能再拖垮 Production 部署本身。PR #278 Merge（merge commit `f489225496a87821d6553be1a05d44e6633774c4`）後觸發的 push 部署（run `31196710309`）**完整成功**：`Find last successful workflow_dispatch run`／`Download`／`Extract` 三步驟皆正確執行並成功找到並沿用先前 `workflow_dispatch` run（`31196383363`）的 Preview 內容，`Fallback` 步驟正確判斷 `combined/preview/index.html` 已存在而跳過鏡射；Production `curl` 實測更新為最新 commit（JS bundle hash 由 `index-DGdplYu1.js` 變為 `index-W9D4G3XS.js`），Preview `curl` 實測維持 HTTP 200 且未被覆蓋。**push-only reuse 邏輯至此完整驗證通過（含一次真實失敗與熱修的完整記錄）。UR-TODO-050 正式標記為已完成。**

### UR-TODO-051 交易匯入中心「撤銷」按鈕撤銷失敗時完全靜默無回饋

- 優先級：**待評估**
- 狀態：**已完成**（2026-08-08，[PR #282](https://github.com/hyc640110/family-universal-rebalance/pull/282)）
- 提出日期：2026-08-07
- 完成日期：2026-08-08
- 提出依據：交易匯入中心「正式批次匯入已選列」二次確認機制唯讀盤點（[PR #270](https://github.com/hyc640110/family-universal-rebalance/pull/270) 開發前）發現，使用者已明確指示「另開 Todo 之後處理，這次不動」；本條目為補記先前遺漏未正式建檔的部分。**原暫定編號 UR-TODO-050 與並行進行的另一份治理同步（PR #268／#272，`deploy.yml` Preview 部署 race condition）撞號，已改用下一個可用編號 UR-TODO-051。**
- 問題：`rollbackImport`（`src/App.tsx`）在下列情況會直接 `return current`（state 完全不變、靜默失敗），但呼叫端 `ImportCenter.tsx` 的「撤銷」按鈕（`onClick={() => onRollback(session.id)}`）**沒有接任何回傳值、沒有任何 feedback UI**——使用者點了「撤銷」，畫面上什麼都不會發生，也不會被告知失敗原因：
  1. 該次匯入 session 底下已無任何交易可撤銷（`imported.length === 0`，例如全數已被個別刪除）。
  2. **更常見**：只要匯入後有任何一筆交易事後被編輯過（`transaction.updatedAt !== transaction.createdAt`），`rollbackImport` 會擋下**整批** session 的撤銷，不是只擋被編輯的那一筆。
- 對比：本專案其他寫入動作（`exportBackup`／`importBackup`／`resetState`／本次「正式批次匯入已選列」）皆有 `role="status"`／`role="alert"` 的成功／失敗／取消三態回饋；「撤銷」是目前已知唯一完全沒有任何回饋的寫入類按鈕。
- 明確不包含：本次（[PR #270](https://github.com/hyc640110/family-universal-rebalance/pull/270)）刻意不處理此問題，避免與二次確認機制的變更範圍混在一起；本條目純記錄，未修改任何程式碼。
- 建議修正方向（未拍板，待排入時決策）：
  - `rollbackImport` 回傳明確結果（例如 `boolean` 或 `{ok: boolean, reason?: string}`），取代目前的靜默 `return current`。
  - `ImportCenter.tsx` 比照既有 `commitFeedback` 等 `Feedback` state 慣例，新增獨立的 rollback feedback 顯示區塊；失敗時明確告知原因（例如「此批交易已有部分被編輯，無法撤銷」），而非讓使用者以為點擊沒有反應。
- 依賴：無，可獨立排程；與 UR-TODO-049（匯入預覽勾選框 crash）為同一次盤點發現的兩個獨立問題，互不相關，不應合併處理。
- **開發前唯讀盤點確認（2026-08-08）**：
  1. `rollbackImport`（`src/App.tsx`）除既有兩項限制外，未發現其他會導致撤銷失敗的情況；帳戶被刪除不影響交易本身是否可撤銷（撤銷只操作 `transactions`／`importSessions`，不查驗 `accountId` 是否仍存在有效帳戶）。
  2. 「撤銷」按鈕點擊路徑確認：`onRollback` prop 型別原為 `(sessionId: string) => void`，`rollbackImport` 本身也是 `void`（`setState(updater)` 的回傳值本來就是 `undefined`）——不是「回傳值被吞掉」，而是架構上從未存在任何可回傳的結果，呼叫端 `onClick={() => onRollback(session.id)}` 完全沒有東西可接。
  3. 比照 PR #261／#262 既有 `Feedback`／`FeedbackLine` 慣例，沿用同一套 `{tone, text}` 狀態與 `role="status"`／`role="alert"` 語意化呈現，未另創新的呈現方式。
- **修復（[PR #282](https://github.com/hyc640110/family-universal-rebalance/pull/282)）**：
  - `src/lib/importCenter.ts` 新增純函式 `evaluateRollbackImport(transactions, sessionId): RollbackOutcome`，把「能不能撤銷」的判斷邏輯（維持原有語意，未變更行為本身）從 `setState` updater 內抽出成獨立、可單元測試的純函式，回傳 `{ok:true, count}` 或 `{ok:false, reason:'no-transactions'}` 或 `{ok:false, reason:'edited', editedCount, totalCount}`。
  - `rollbackImport`（`App.tsx`）改為先呼叫 `evaluateRollbackImport(stateRef.current.transactions, sessionId)` 同步取得結果，只有 `ok:true` 才呼叫 `setState` 實際搬移資料，函式本身回傳 `RollbackOutcome` 給呼叫端。（`stateRef.current` 由本檔案自訂的 `setState` wrapper 同步維護，不是 React 原生 `useState` 的非同步 updater，讀取上沒有 UR-TODO-049 那類時序風險。）
  - `ImportCenter.tsx` 新增 `rollbackFeedback` state（沿用既有 `Feedback`／`FeedbackLine` 型別與元件），`onClick` 改呼叫本地 `rollback(sessionId)`：成功顯示「已撤銷 N 筆交易。」，因交易被編輯失敗顯示「無法撤銷：本次匯入的交易中有 N 筆已被編輯過，請改為手動刪除。」，因交易已被逐筆刪除失敗顯示「無法撤銷：此批交易已不存在（可能已被逐筆刪除），沒有可撤銷的項目。」——兩種失敗原因文字明確區分，皆非籠統的「撤銷失敗」。
  - **未變更**：`rollbackImport` 判斷邏輯本身（被編輯就整批擋下撤銷）維持原樣；未實作部分撤銷；未觸碰 UR-TODO-049 剛修復的勾選框邏輯；未觸碰「正式批次匯入已選列」的 `window.confirm()`。
- **新增測試**：`tests/importCenterRollbackFeedback.test.ts`（4 項，純函式 `evaluateRollbackImport` 的成功／已編輯／已被逐筆刪除／不屬於此 session 四種情境）與 `tests/importCenterRollbackFeedbackDisplay.test.ts`（3 項，以 jsdom＋`react-dom/client` 渲染真實元件、點擊「撤銷」，確認畫面實際顯示的文字與 `role` 屬性正確，並斷言失敗訊息不是籠統的「撤銷失敗」）；皆已驗證在修復前的程式碼上會失敗（`onRollback` 舊型別為 `void`、`ImportCenter.tsx` 完全沒有 `rollbackFeedback`），修復後通過。
- 驗證：`npx tsc -b`、`npm run test:ci`（832 項全數通過，含新增 7 項測試）、Production／Preview `vite build` 皆成功；隔離本機 dev server 桌機 1280px＋手機 390px 皆以真實互動驗證：(1) 正常撤銷（未編輯過任何交易）→ 確認顯示「已撤銷 N 筆交易。」（`role="status"`）；(2) 先編輯其中一筆交易的金額，再嘗試撤銷同批 → 確認顯示「無法撤銷：本次匯入的交易中有 1 筆已被編輯過，請改為手動刪除。」（`role="alert"`），且交易資料與 session 狀態皆維持不變（未被靜默改動）；以全新瀏覽器分頁排除 console 歷史殘留疑慮後確認皆無新增錯誤，390px 無橫向溢出。
- **正式結案（2026-08-08）**：依 UR-TODO-050 方案 B 流程，Claude Code 先執行 `workflow_dispatch` 刷新 Preview，使用者於 Preview 以真實裝置（桌機＋手機）依驗收步驟逐項確認通過後直接指示 Merge。因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者），merge commit `9a2c5df68ecd6f462a5f4311ac89f1dec822f058`。Merge 後觸發的 push 部署（run `31202822196`）成功；Production／Preview `curl` 實測皆 `HTTP 200`。**UR-TODO-049、UR-TODO-050、UR-TODO-051 三項（同一次「正式批次匯入已選列」二次確認機制唯讀盤點所發現的關聯問題）至此全數結案。**

### UR-TODO-052 移除首頁頂部行銷文案區塊與收合按鈕

- 優先級：P2
- 狀態：**已完成**（2026-08-07，[PR #275](https://github.com/hyc640110/family-universal-rebalance/pull/275)，merge commit `92bb4f17b6b579b5023c72833aec77ff5d30bc5a`）
- 提出日期：2026-08-07
- 完成日期：2026-08-07
- 提出依據：使用者提供首頁截圖，紅框標示希望移除「收合」按鈕（帶眼睛圖示）與其下方的行銷文案區塊（「家庭多資產配置管理」標題＋「即時股價｜動態再平衡｜Firebase 雲端同步」說明文字＋「Build time: unavailable」），使用者直接下達開發指令。
- 開發前唯讀盤點結論：
  1. **`CollapseEyeIcon` 為全站共用元件**（`src/components/CollapseEyeIcon.tsx`），除本次要移除的 hero-info 切換按鈕外，還被 `App.tsx`（`SectionCard` 共用元件，19 個呼叫點）與 `RiskCenterPage.tsx`／`InvestmentActionCenterPage.tsx`／`HouseholdLiquidityDiagnosticList.tsx` 三處獨立 toggle 使用；**本次僅移除 `App.tsx:1976` 這一個呼叫點（連同其外層按鈕），元件本體與其他呼叫點完全不觸碰**。
  2. `APP_SUBTITLE`（`家庭多資產配置管理`，`src/constants/appInfo.ts`）在移除前唯讀比對確認全庫僅 `App.tsx` 的 hero-info 區塊這一處讀取，移除後已同步從 import 清單移除；`APP_VERSION`／`APP_NAME`／`APP_BUILD_TIME`／`APP_GIT_COMMIT` 皆為純環境變數／字面常數，非持久化資料，且分別在 `DesktopSidebar.tsx`（側欄名稱／版號）、`ErrorBoundary.tsx`（錯誤畫面）、`App.tsx`「版本與除錯」設定區塊（`APP_VERSION`／`APP_BUILD_TIME`／`APP_GIT_COMMIT`）獨立讀取顯示，本次移除首頁行銷區塊完全不影響這些既有顯示位置。
  3. `showHeroInfo` state（`useState(false)`）唯讀比對確認全庫僅用於這顆已移除的切換按鈕與其對應的顯示區塊，無其他讀取者，已一併移除。
- 範圍：`src/App.tsx` 移除 hero 標頭內的「關於／收合」切換按鈕與其對應的 `.hero-info` 行銷文案區塊（含 `APP_VERSION`／`APP_NAME`／`APP_SUBTITLE`／`APP_BUILD_TIME` 四個唯讀顯示欄位、`showHeroInfo` state）；`src/styles.css` 同步清理僅供此區塊使用的死 CSS（`.hero-info-toggle`、`.hero-info`、`.build-info`）。`.hero-actions`／`.hero-compact`（首頁「更新股價／下載／上傳」三顆按鈕所在容器）維持不變。
- 明確不包含：不觸碰資產頁、分析頁或其他頁面；不修改任何資料模型、持久化或 App 版本號顯示邏輯（版本號在側欄與「版本與除錯」設定區塊維持原狀）；不影響已結案的 UR-TODO-030。
- 驗證：`npx tsc -b`、`npm run test:ci`（824 項全數通過，無測試檔涉及此區塊、無需修改既有測試）、Production／Preview `vite build` 皆成功；隔離本機 dev server 實機驗證（桌機 1280px＋手機 390px）：確認首頁不再出現「家庭多資產配置管理」「即時股價｜動態再平衡｜Firebase 雲端同步」「Build time」文字，也無「關於」／「收合」按鈕；`.hero.hero-compact` 標頭只剩「更新股價／下載／上傳」三顆按鈕這一個子元素，無殘留空白容器；390px 無橫向溢出（`scrollWidth === clientWidth`）；console 全程無新增錯誤；側欄與設定頁「版本與除錯」區塊的版本號／Build time 顯示不受影響（唯讀確認 `Universal Rebalance V5.10.1` 仍正確顯示於側欄）。
- 依賴：無，獨立於其他 UR-TODO 系列。
- **正式結案（2026-08-07）**：使用者已於 Preview（`https://hyc640110.github.io/family-universal-rebalance/preview/`）以真實裝置驗收通過（桌機＋手機），直接指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。`Deploy GitHub Pages` workflow run `31194237652`（`event: push`）成功，headSha 與 merge commit 一致；Production `curl` 實測 `HTTP 200`，`deployment-environment` metadata 為 `production`。**UR-TODO-052 正式標記為已完成。**

### UR-TODO-044 固定支出角色 fallback 靜默分類分歧與生活費重複計算風險

- 優先級：P1
- 狀態：**已完成**（Phase 1 唯讀盤點、Phase 2a 角色 fallback 修正、Phase 2b 使用者確認遷移皆已完成；原「Phase 2b／2c」為單一區塊，兩項驗收條件已全數達成，不存在獨立殘留的 Phase 2c 範圍，詳見下方判定依據）
- 提出日期：2026-07-29
- 完成日期：2026-07-30
- 提出依據：Claude Home 於 Review Mode 發起「UR-TODO-044 Phase 1（唯讀盤點）」指令，針對「每月生活費預算」手動欄位與固定支出清單「生活必要支出」角色是否重複計入 `monthlyLivingExpenses` 進行唯讀程式碼追蹤

**Phase 1（唯讀盤點，已完成）**：
- 確認 `src/lib/householdLiquidityInputAdapter.ts` 的 `cashFlowRole()` 在固定支出項目 `liquidityRole` 未設定時依分類分歧：`housing`／`loan`／`other` 三類回傳 `'ambiguous'`（正確阻擋，不計入），其餘五類（保險／水電瓦斯電信／交通／家庭支出／訂閱服務）**靜默預設為 `'essential-living'`**，未經使用者確認即計入 `monthlyLivingExpenses`，違反 `013_HOUSEHOLD_LIQUIDITY_SPEC.md` §16.4「不得靜默猜測」。
- 確認「每月生活費預算」（`variableExpenseBudget`）與固定支出清單中角色為「生活必要支出」的項目（含上述靜默分類）為兩個獨立 `sourceId`，會被直接加總；`householdLiquidity.ts` 僅以 `sourceId` 字面值防止重複，無語意層級防重複機制。
- 未發現「已在 Production 實際重複計算」的具體資料證據（僅為邏輯路徑層級的確定性風險，需使用者實際資料才能判斷是否已觸發），故未依停止條件升級為緊急事件；依此規劃 Phase 2a／2b／2c 分階段處理。

**Phase 2a（角色未設定 fallback 修正，已完成）**：
- 完成日期：2026-07-29
- 完成 PR：[PR #184](https://github.com/hyc640110/family-universal-rebalance/pull/184)（`feat/ur-todo-044-phase2a-role-fallback-consistency`），merge commit `498941ae46aeb5806904103c4513e25f87555999`，`mergedAt: 2026-07-29T13:42:57Z`
- 完成依據：`CI Verification` run `30457065192`（`conclusion: success`，headSha `c39261d`，含 `npx tsc -b` 0 error、`npm run test:ci` 597/597＋3/3＋18/18＋checks 全數 PASS＋3/3、Production／Preview build 皆成功）；Merge 後 `Deploy GitHub Pages` run `30457308734` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用；於隔離瀏覽器階段（Preview 環境，未使用使用者實際 Production 資料）建立涵蓋 8 個分類、角色皆未設定的固定支出項目，於「風險與現金安全中心」展開「待補齊的資料來源」確認全部一致顯示「固定支出『XXX』尚未指定家庭流動性用途。」引導訊息。
- 範圍：`src/lib/householdLiquidityInputAdapter.ts` 的 `cashFlowRole()` fallback 改為 8 個分類未設定角色時一律回傳 `'ambiguous'`，不再依分類分歧；`householdLiquidity.ts` 核心模型完全未修改，沿用既有通用的 `'ambiguous'` role 阻擋機制（`DEBT_PAYMENT_AMBIGUOUS`，已有 `housing`／`other` 分類 fallback 先例證明可通用套用，不構成新阻擋機制）。實作過程中額外發現並一併修正 `src/lib/householdLiquidityInputDiagnostics.ts` 內未同步的重複邏輯 `requiresExplicitRole()`（同一組 3 類判斷的第二份拷貝，決定「尚未指定家庭流動性用途」診斷是否顯示）；不修正會使計算層已阻擋、但診斷引導層仍對 5 個新分類保持靜默，故一併納入本次 PR。
- 明確不包含：`CashFlowPage.tsx` 下拉選單結構、`householdLiquidity.ts` 核心模型、debt-payment／`linkedLoanId` 既有邏輯、localStorage／Firebase／JSON Backup schema、`App.tsx` 資料入口均未修改。
- 補充：使用者已於本次 Phase 2a 執行前主動清空「固定支出清單」既有項目並確認畫面為空，故本次未額外處理既有資料遷移或一次性通知機制（原本因既有測試證據顯示大量既有情境依賴舊行為而規劃停止，已因資料清空由使用者明確授權解除、繼續執行）。

**Phase 2b（使用者確認遷移，已完成）**：
- 完成日期：2026-07-30
- 完成 PR：[PR #192](https://github.com/hyc640110/family-universal-rebalance/pull/192)（`feat/ur-todo-044-phase2b-variable-expense-migration`），merge commit `2fc8ce1d071df5bd428d00dd72518747f7a5cf27`，`mergedAt: 2026-07-30T10:47:11Z`
- 完成依據：Phase 1 唯讀盤點（UR-TODO-046-2b 指令）確認 `variableExpenseBudget` 完整呼叫鏈與重複計算根因後，使用者明確選定**方案 B（使用者確認遷移，非靜默自動遷移）**；`CI Verification` run `30533633234`（`conclusion: success`，headSha 與 PR head `068deeb` 一致，含 `npx tsc -b` 0 error、`npm run test:ci` 全數 PASS）；Merge 後 `Deploy GitHub Pages` run `30536018542`（`event: push`）success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用；隔離瀏覽器階段（Preview 與 Production，未使用使用者實際資料，以 localStorage 手動注入模擬舊值）分別完整驗證「確認」（正確新增 `essential-living`／`category: other` 固定支出項目、金額原樣轉入、清空舊欄位、寫入 `variableExpenseBudgetMigratedAt` 標記）與「忽略」（`window.confirm` 二次確認、清空舊欄位、寫入標記、不建立項目）兩條路徑，重新整理後皆不再重複跳出提示；遷移前後 `每月基本支出`／`monthlyLivingExpenses` 金額一致（不重複計算、不遺失金額）；390px 手機寬度無橫向溢出；全程 console 無錯誤。
- 範圍：`src/lib/cashFlow.ts` 新增可選欄位 `variableExpenseBudgetMigratedAt?: string`（`normalizeCashFlowProfile` 同步保留，比照既有 `externalContribution`／`plannedWithdrawal` 的 undefined-is-absence 慣例）；新增 `src/lib/cashFlowVariableExpenseBudgetMigration.ts`（`shouldPromptVariableExpenseBudgetMigration`／`confirmVariableExpenseBudgetMigration`／`dismissVariableExpenseBudgetMigration` 三個純函式，皆冪等，deterministic id `migrated-variable-expense-budget`）；`src/lib/householdLiquidityInputAdapter.ts` 的合成 `cash-flow:variable-expense-budget` living-expense 項目改為只在欄位仍有待遷移正數時才注入——這是必要修正，若不改，欄位清空為 `null` 後會永遠注入 `amount: null`，導致所有 profile（含全新使用者）被 `LIVING_EXPENSE_INVALID` 永久阻擋；`src/pages/CashFlowPage.tsx` 移除「每月設定」卡片內的手動輸入框與「現金流總覽」對應摘要，新增一次性提示卡片，並調整「支出結構」長條圖移除合成 variable 分類項；新增 8 個測試（`tests/cashFlowVariableExpenseBudgetMigration.test.ts`）並改寫 `tests/householdLiquidityInputAdapter.test.ts` 兩個既有測試（12b／13）反映合成項目改為條件注入的新行為。
- 明確不包含：未修改 `App.tsx` 的 `normalizeState` 資料入口結構；未修改 `householdLiquidity.ts` 核心模型公式或 `HouseholdLiquidityInput`／`HouseholdLiquidityOutput` 契約；`variableExpenseBudget` 欄位本身未從型別移除，永久保留為可為 `null` 的舊資料相容欄位，localStorage／Firebase／JSON Backup 既有資料無需特殊相容分支即可正確觸發或略過遷移。
- 觸發條件判斷（實作範圍內的判斷，非規格明確要求）：一次性提示只在 `variableExpenseBudget` 為**正數**時觸發，明確 `0` 沒有金額可遷移不觸發，避免無意義的干擾。

**Phase 2b／2c 範圍判定（2026-07-30 治理同步唯讀核對）**：
- 原「Phase 2b／2c」文字自始為單一區塊「明確未處理，待使用者未來另行規劃」，並非拆成兩個各自獨立的子範圍；其下僅列兩項驗收條件：(1) 明確決定「每月生活費預算」欄位是否保留、以何種方式與固定支出清單整合；(2) 若涉及既有資料遷移，需提出遷移方式、向後相容方案、回復方案與驗證方法。
- 兩項驗收條件皆已由上述 Phase 2b（PR #192）完整達成；全庫搜尋 `生活費預算` 字樣確認僅剩遷移提示文案與遷移後項目名稱本身（皆為刻意保留、非遺漏），未發現任何未處理的殘留程式碼或 UI 路徑。
- 依此判定：**不存在需要獨立標記為「Phase 2c」的殘留範圍**，UR-TODO-044 整體標記為已完成。

- 依賴：
  - UR-TODO-006（Household Liquidity Core Model Foundation，本項目沿用其核心模型與 `'ambiguous'` role 契約）

## P1－舊待辦遺漏補登

> 本區為舊對話需求與現行 Backlog 的遺漏比對結果。只補登尚未確認完成、且未被其他 Todo 完整吸收的項目。開發前仍須先唯讀盤點最新 main。

### UR-TODO-026 持股卡片移除「持有比率」文字
- 優先級：P1
- 狀態：**已完成**
- 完成日期：2026-08-01
- 完成依據：[PR #216](https://github.com/hyc640110/family-universal-rebalance/pull/216)（`fix/ur-todo-026-remove-holding-ratio-label`），merge commit `63feac1f0012546fadc1e341c55c047c967ada65`。使用者於 2026-08-01 明確拍板需求範圍：只移除「持有比例」文字標籤、保留百分比數字，不新增任何圖形／圓圈視覺（既有的 `.holding-mobile-weight` CSS 圓形徽章即符合原始需求所指的「圓圈」，本次維持不變）。`src/App.tsx` 移除 `<span>持有比例</span>`，只保留 `<strong>{compactWeight}</strong>`，改用 `aria-label="持有比例 {數值}"` 保留無障礙語意；`src/styles.css` 同步移除已死的 `.holding-mobile-weight span` 規則（含 390px／桌機兩處中斷點）。`npx tsc -b`、`test:ci` 全數通過；隔離本機 dev server 實機驗證圓圈徽章保留（`border-radius: 50%`）、不再顯示文字標籤、只顯示百分比數字，390px 與桌機寬度皆無橫向溢出，console 無 error。**本文件先前僅記錄「使用者拍板需求範圍」，PR #216 Merge 結果未同步進本文件，本次一併補齊。**
- 修改方向：
  - 移除「持有比率」四個字。
  - 保留圓圈與圓圈內比例數字。
  - 桌機與手機一致。
- 驗收條件（已達成）：
  - 不再顯示「持有比率」文字。
  - 圓圈與比例數字正常。
  - 不改變比例計算。

### UR-TODO-027 趨勢圖剩餘視覺與刻度問題
- 優先級：P1
- 狀態：**已完成**（走勢方向漸層填色、Y 軸整數刻度、手機文字裁切、Y 軸位置、07／15 日期斷裂五項全數確認完畢）
- 提出日期：2026-07-19
- 2026-08-01 完成依據（漸層填色子需求）：[PR #218](https://github.com/hyc640110/family-universal-rebalance/pull/218)（`feat/ur-todo-027-trend-chart-gradient`），merge commit `b85521aa959377089e2e8d67b3fbd01292c9bfb2`。`src/components/TrendChart.tsx` 新增紅漲綠跌漸層填色，**依驗收回饋由「整段頭尾單一顏色」調整為「逐段各自變色」**：每個相鄰資料點間的線段依「該段自己的終點 vs 起點」各自決定紅（`#ff5b5b`）／綠（`#43d17a`），中間震盪會逐段各自呈現正確方向；持平線段不填色。`monotonePath`（折線）改為從新的 `monotoneSegments()` 衍生，確保折線與填色使用相同曲線片段。視覺風格為「逐段漸層淡出」（實作前以 `AskUserQuestion` 確認選定），每張圖表僅 2 個共用 `<linearGradient>`（`gradientUnits="userSpaceOnUse"`），不是逐段各自一個。折線與資料點 hover／touch 互動完全未變動。`tests/trendChartGradientArea.test.ts` 新增 7 個測試；`npx tsc -b`、`test:ci` 全數通過；隔離本機 dev server 實機驗證通過；`Deploy GitHub Pages` run `30697948596` success；Production／Preview `curl` 實測皆 HTTP 200。
- **2026-08-08 更新：本項「逐段漲跌填色」邏輯已由 UR-TODO-053 取代**（不是新增並存，是整段替換），改為「相對今日淨資產基準線」填色邏輯。`monotoneSegments()`／`monotonePath` 曲線計算本身不受影響、繼續沿用。詳見下方 **UR-TODO-053** 正式條目。
- 2026-08-01 唯讀盤點＋隔離本機 dev server 實機驗證，Y 軸整數刻度／手機文字裁切／Y 軸位置三項正式標記為已完成：以高數值（8.5～9.5 百萬）＋日期跳躍（07/12 直接跳至 07/20）資料 seed 測試，於 390px 實測。**Y 軸整數刻度**：`deriveTrendDomain()` 的 `niceIntegerStep()` 保證刻度永遠是 1／2／5／10 倍數整數，大數值先經 `axisScale`（萬元）換算再顯示（例如 850 萬顯示為刻度「-500、0、500、1000、1500」），實測確認皆為整數、無小數點雜訊。**手機文字裁切**：SVG `viewBox` 與容器實測寬度 1:1 對應（`ResizeObserver` 動態量測），Y 軸標籤固定 `x=6`；實測 `document.documentElement.scrollWidth === clientWidth`（390＝390），無橫向溢出，console 無錯誤。**Y 軸位置**：使用者確認現況（固定左側 `x=6`，緊貼繪圖區左邊界）不需調整，維持現況即為驗收通過，原始需求未提供更具體標準。
- **07／15 附近中間空白 —— 最終唯讀盤點結論（2026-08-01，Claude Code，Review Mode，未修改任何程式碼）：確認為 X 軸座標定位邏輯的設計行為，非缺陷，使用者確認不需修正、直接結案。** 判斷依據：
  1. `TrendChart.tsx:76` 的 `x(index) = left + index/(valid.length-1) * (width-left-right)` 純粹以資料點在陣列中的**索引**決定水平位置，完全不依實際日曆天數換算——以 seed 測試資料（07/10、07/11、07/12、跳過 07/13～07/19、07/20、07/21）實機渲染驗證，`circle` 的 `cx` 座標間距在跨 8 天缺口與跨 1 天皆完全相同（59.5px），證實圖表對「缺幾天」完全無感。
  2. 同一組測試資料的填色區塊（`trend-area`）數量與相鄰資料點對數一致（4 段對應 5 點 4 對），未跳過任何一段，證實只要兩個資料點存在，中間必定連續填滿，不會留白。
  3. 上游資料來源（`src/lib/netWorthHistory.ts` 的 `upsertNetWorthSnapshot()`／`historyForRange()`）本身即為稀疏陣列，缺快照的日期在陣列中完全不存在（不是存在但值為空），與既有「不補日期、不插值」原則一致。
  4. 綜合結論：圖表不會出現「有些日期完全沒有填色的視覺斷裂」，也沒有「所有日期都有填色只是標籤沒顯示」這個概念——因為圖表根本不知道有缺漏的日期，會直接把有資料的兩點以與其他任何相鄰兩點相同的寬度連接，缺口在畫面上完全消失、不可辨識。這是與「07/15 空白」字面描述不同、但實務上更值得留意的行為：使用者無法從圖表判斷資料是否連續完整。
- 明確需求（2026-07-26 使用者提供，參考樣式為 Google 財經個股走勢圖；2026-08-01 驗收後調整為逐段變色，見上方完成依據）：
  - 趨勢圖線下方應依走勢方向顯示漸層填色，由線條顏色向下漸淡至透明：
    - 區間內上漲（終點高於起點）：紅色漸層（符合台股慣例，紅漲）。
    - 區間內下跌（終點低於起點）：綠色漸層（符合台股慣例，綠跌）。
- 驗收條件（**全數已達成**）：
  - 真實資料無日期斷裂。（**已達成**，確認為索引式定位設計行為，不會產生視覺斷裂，使用者確認不需修正）
  - 手機 Safari 約 390px 無裁切。（**已達成**，2026-08-01 實機驗證）
  - 桌機 1000px／1600px 正常。（漸層填色本身已於桌機驗證正常）
  - 走勢圖依區間漲跌動態顯示紅／綠漸層填色，且與現有「紅漲綠跌」台股顏色慣例一致，不與既有 `currentColor` 折線顏色邏輯衝突。（**已達成**，改為逐段判斷）

### UR-TODO-053 趨勢圖改為「相對今日淨資產」基準線填色

- 優先級：P2
- 狀態：**已完成**（PR [#290](https://github.com/hyc640110/family-universal-rebalance/pull/290) 已 Merge，merge commit `8d8dddf`）
- 提出日期：2026-08-08
- 背景：取代 UR-TODO-027 已完成的「逐段漲跌」填色邏輯（每段依自己終點 vs 起點各自決定紅／綠），改為「基準線」邏輯：新增一條固定在「今天淨資產（目前時間範圍資料陣列最後一筆）」高度的水平參考線，折線高於基準線為紅色、低於為綠色，用以快速判斷目前是否處於相對低點。
- 唯讀盤點結論（2026-08-08，Claude Code，Review Mode，基準 `origin/main` HEAD `424b187`，未修改任何檔案）：確認 `monotoneSegments()`／`monotonePath` 曲線計算可完全重用，折線繪製方式不受影響；確認 `historyForRange()`／`filterInvestmentPerformanceRange()` 兩個既有時間範圍篩選函式皆為「從某個過去日期開始往後保留」，陣列最後一筆永遠是最新資料，技術上驗證基準線可以固定為絕對值、不隨範圍切換改變。交叉點計算提出兩個方案（線性插值 vs SVG clip-path 精確裁切），因後者的自我相交路徑填色行為需要實機驗證才能確認、有不確定性，建議採用前者（線性插值）作為可預測、無不確定性的做法。基準線可見線條、圖表旁文案兩項明確不自行拍板，列出選項供使用者決策。
- 使用者決策：(1) 交叉點計算採線性插值（唯讀盤點建議方案）；(2) 基準線加淡色虛線＋「今日」文字標示；(3) 文案採「以今日{title}為基準：折線高於今日為紅色，低於今日為綠色，用以快速判斷目前是否處於相對低點。」，放在圖表下方 `trend-chart-summary` 附近。
- 實作：`src/components/TrendChart.tsx` 新增 `todayValue`（`valid.at(-1)!.value`）與 `refY`（`y(todayValue)`）；每段依 `fromValue`／`toValue` 相對 `todayValue` 的位置（`above`／`below`／`on`）分類——同側或一端剛好等於今日值的段落維持原本「曲線＋直線收邊」單一多邊形寫法（僅把邊界從畫布底部 `baselineY` 換成 `refY`）；跨越基準線的段落，用數值線性插值算出交叉點像素 X（`t = (todayValue - fromValue) / (toValue - fromValue)`，套用到該段像素 X 範圍），拆成兩個獨立三角形分別上色，交叉點附近的填色邊界會有一小段直線收尾（非貝茲曲線精確弧度），屬於採用線性插值方案的既知、可接受的近似，唯讀盤點時已向使用者揭露。**開發中發現一個唯讀盤點未預見的範圍問題**：`TrendChart` 是共用元件，同時用於「淨資產趨勢」與「投資資產趨勢」兩種圖表；若文案寫死「淨資產」字樣，套用到投資資產圖表會文不對題。已改用元件既有的 `title` prop 動態組字解決（淨資產圖表顯示「以今日淨資產為基準」、投資資產圖表顯示「以今日投資資產為基準」），不需要新增 prop 或保留兩套邏輯分支，維持「取代不是新增」的原則。新增基準線 `<line>`（淡色虛線）與「今日」`<text>` 標籤，圖表下方新增 `trend-chart-baseline-note` 說明文字段落。`tests/trendChartGradientArea.test.ts` 原 7 個測試因語意完全改變（逐段漲跌 → 相對基準線）全數改寫，新增至 10 個測試，涵蓋：單調上漲/下跌但今日恰為極值時全綠/全紅（不再是舊邏輯的全紅/全綠）、段落跨越基準線正確拆成紅綠兩塊、今日為歷史最高/最低的極端情況畫面仍正確渲染不出錯、持平/單一資料點不填色但基準線仍渲染、漸層數量維持 2 個共用（不隨段落數增加）、基準線與「今日」標籤渲染、文案依 `title` 動態組字且不會對非淨資產圖表誤植「淨資產」字樣、折線 stroke 與資料點互動標記不受影響。867 tests pass（864 + 3 淨增），`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功。**實機驗證**（隔離本機 dev server，注入含漲跌震盪的淨資產歷史 fixture，今日淨資產落在歷史區間中段）：「淨資產歷史中心」頁面確認文案「以今日淨資產為基準：...」與「今日」基準線標籤正確渲染；SVG 內容確認同時存在紅（11 段）與綠（7 段）填色、恰好 2 個共用 `<linearGradient>`；分析頁「投資資產趨勢」圖表確認文案正確顯示「以今日投資資產為基準」（非「淨資產」），驗證 `title` 動態組字在兩種圖表下皆正確；console 全程無錯誤。**未修改**：`deriveTrendDomain()` Y 軸刻度邏輯、`netWorthHistory.ts` 資料層、資料點 hover／touch 互動、X 軸索引式定位邏輯——四項唯讀盤點時已確認不受影響，實作與驗證階段皆未觸碰。
- **Preview 驗收發現真實 Bug 並已修正（2026-08-08）**：使用者於 Preview 驗收「淨資產歷史頁面」30 天視圖時回報，07/26～08/02 附近明顯低於基準線的一段折線完全沒有綠色填色（同張圖左側高於基準線的紅色區塊正常）。**排查（非猜測，直接檢視實際渲染的 SVG DOM 確認根因）**：在隔離本機 dev server 注入與回報情境相同結構的資料（一段明顯高於基準線的山丘＋一段明顯低於基準線的低谷）重現問題，直接讀取渲染後 `<linearGradient>` 的 `y1`／`y2` 屬性與填色 `<path>` 的 `d` 屬性座標，發現：`up`／`down` 兩個方向的漸層被寫成共用同一組座標（`y1={top}`／`y2={refY}`），紅色區塊的像素 Y 座標範圍（16～96）剛好完全落在這個範圍內，但綠色區塊的像素 Y 座標範圍延伸到 124（明顯超出 96）。SVG `linearGradient` 預設 `spreadMethod="pad"`，超出漸層向量範圍的部分會直接沿用最後一個 `<stop>` 的顏色——而該 stop（`offset="100%"`）的 `stop-opacity` 是 0（全透明），因此低谷區塊的填色路徑幾何完全正確，但整片被畫成透明，變成使用者看到的「空白背景」。根本原因是把 `up` 方向的漸層座標範圍（`top`→`refY`）誤用在 `down` 方向上，`down` 方向理應是 `height-bottom`→`refY`（在基準線下方最遠處不透明、往基準線方向淡出，與 `up` 方向對稱）。**修正**：`down` 漸層改用 `y1={height-bottom}`；`up` 漸層維持不變。新增迴歸測試，直接斷言每個方向的漸層座標範圍必須完整涵蓋該方向所有填色路徑實際用到的 Y 座標——修正前執行此測試會重現與回報一致的失敗訊息，修正後通過，確認測試能真正抓住此類問題再合入。868 tests pass，`npx tsc -b`、Production／Preview build 皆成功；隔離本機 dev server 以相同重現資料直接檢視 SVG DOM 確認修正後兩方向填色的像素 Y 座標範圍皆完整落在各自漸層範圍內（`up`：68～96 落在 16～96；`down`：96～124 落在 96～176）。修正後重新觸發 `workflow_dispatch` 更新 Preview，使用者第二次驗收通過並指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31247906331` success），Production／Preview `curl` 實測皆 `HTTP 200`。

### UR-TODO-054 Attribution Confirmation Lifecycle UI（FX／Loan／Generic Split）

- 優先級：待評估
- 狀態：**CLOSED AS UMBRELLA / FOLLOW-UPS RESOLVED（2026-08-21，Remaining Backlog Governance Closeout）**（自 UR-TODO-046 Final Audit／Closeout，2026-08-14 拆出；2026-08-14 正式拆分為 054-A／054-B／054-C 三個子項，各自獨立唯讀盤點、產品決策與明確授權後才開始開發：
  - 054-A：**CLOSED**（2026-08-14）
  - 054-B：**CLOSED**（2026-08-15）
  - 054-C：**DEFERRED／NO-GO／NEEDS REAL CONSUMER**——2026-08-15 Contract Audit 結論「沒有可消費的真實 candidate／producer」，需真實 producer／candidate／業務情境出現後才重新稽核，不建議現在開發
  三個子項均已達本階段治理終局狀態，父項 umbrella 治理程序本身已完成（三個子項各自都已有明確、終局的獨立決策），故父項標記為 CLOSED AS UMBRELLA。**明確澄清：父項 CLOSED 僅代表「umbrella governance 已完成」，不代表 UR-TODO-054-C 已實作或完成——054-C 本身維持 DEFERRED／NO-GO 狀態，見下方獨立條目。不重新開啟 054-C、不變更 055／056 狀態、不變更任何 attribution contract。**）
- 提出日期：2026-08-14
- 背景：UR-TODO-046 已完成 FX（F2D）、Loan（046-L1）、Generic Split（046-L2A/L2B）三個 domain 的正式 attribution contract（identity、reconciliation candidate/matched、zero-effect 或明示 contribution、duplicate prevention、void/forward-only correction），但三者的正式確認（confirm）動作原本**皆只存在於函式庫層級**：`confirmFxConversionAndAppend()`（`fxConversionAttributionConfirmation.ts`）、`confirmLoanPaymentGroupAndAppend()`（Loan）等在 `App.tsx` 零呼叫，一般使用者無法透過畫面實際確認、撤銷（void）或重新確認（reconfirm）任何一筆這三個 domain 的正式記帳事件。既有唯一有 UI 入口的確認流程是 `RuntimeAttributionProvenanceCard` 的「確認並正式記帳」按鈕，但其 `confirmAttributionEvidence` handler 硬編碼只處理 `derivedEvidenceItems`（`safe-taxonomy-candidate` 專用），FX／Loan／Generic Split 的 candidate reason（`fx-conversion-contract-candidate`／`loan-payment-contract-candidate` 等）結構上不會進入此卡片。**Loan（054-A）已於 2026-08-14 正式完成並 Merge，FX（054-B）已於 2026-08-15 正式完成並 Merge，詳見下方 054-A／054-B 條目；兩者獨立驗證「各 domain 各自獨立 UI 元件、不共用 confirmation framework」為可行且已驗證的實作模式。**
- 三個 domain 各自獨立唯讀盤點、產品決策與明確授權後才開始開發，不因其中一項完成而自動解鎖其餘子項；子項清單與現況見下方 054-A／054-B／054-C。
- 明確不包含：修改任何既有 attribution／reconciliation／FinancialEvent 核心邏輯（UR-TODO-046 已完成部分不得重新開放討論）；新增 domain；修改 schema／persistence
- 依賴：UR-TODO-046（已 CLOSED，contract 基礎已具備）

#### UR-TODO-054-A Loan Confirmation UI

- 狀態：**CLOSED（2026-08-14）／已完成**
- 完成內容：Minimal Loan Repayment Producer（`loanRepaymentProducer.ts`／`LoanRepaymentProducerForm.tsx`，只建立 `loan-payment-contract-candidate`，不自動確認）、Candidate Review（`loanConfirmationPresentation.ts`，group-by-`paymentId`，把 flat per-component runtime evidence 摺疊成單一還款單位）、Confirm（重用既有 `confirmLoanPaymentGroupAndAppend()`）、Atomic Void（重用既有 `voidFinancialEventAndAppend()`，對整組任一 active component event 呼叫一次即可使 `resolveActiveLoanComponentGroups()` 判定整組失效，已用真實 runtime 資料——非僅 presentation——驗證整組 `ledgerContribution` 歸零、`derivedContribution` 重新出現）、Reconfirm（重新呼叫既有 confirm helper，helper 自動建立全新 `confirmationGroupId`，新舊 component 不混接，已用真實 runtime 資料驗證兩個 confirmationGroupId 各自獨立、無交叉污染）、**修正 `RuntimeAttributionProvenanceCard` 既有 UI safety 缺口**——原本會把 Loan 的 interest／fee／penalty derived component 誤判為一般 `derivedEvidenceItems`、暴露一個結構上必然失敗的 component-level「確認並正式記帳」按鈕（`item.id` 是 `loan-payment:<paymentId>:<componentId>` 合成字串而非 transactionId），現已於 `runtimeAttributionPresentation.ts` 用穩定的 domain signal（五個 `loan-*` `FinancialEventType` 字面值 exact match）排除，Loan Group Confirmation Card 成為 Loan 確認的唯一入口。
- Preview 驗收：**PASS**（使用者於無痕視窗完整驗證 candidate→confirm→matched→撤銷整組→待重新確認全流程，視覺與底層資料一致）。
- Atomic Void Runtime 驗證：**PASS**（Review Mode Debug Trace 直接以 `composeRuntimeNetWorthAttribution()` 真實計算結果證明 void 後整組 `Ledger 貢獻` 歸零、`衍生貢獻` 正確恢復，reconfirm 後新舊 confirmationGroupId 互不干擾、無雙重計算）。
- 開發過程中發現並修正一個真實 Preview 阻斷 bug：`confirmLoanPaymentGroupAndAppend()` 成功時 `result.events` 只回傳新建的那組事件、不是完整合併後的 Ledger（與 FX 對應 helper 的語意不同），App.tsx caller 原先誤用「取代」語意，已修正為「附加」；另修正 `buildLoanPaymentConfirmationGroup()` 對 `transaction.occurredAt` 的未保護 `canonicalCalendarDay()` 呼叫可能造成的靜默失敗風險（於 App.tsx caller 與 UI 元件兩層皆補上 try/catch 防禦）。
- Merge 資訊：**PR [#331](https://github.com/hyc640110/family-universal-rebalance/pull/331)**，merge commit `c87a9e933af9cd5e7d2fa31bcb301adfa10e7944`，parents `0097107e3f860009d00c4dfb8b83708ba4fef269`（merge 前 main）／`0184834b5da0b618ca44981b6e231a1b230c1791`（PR head），**一般 merge commit，未使用 admin override**；`mergedAt: 2026-08-14T13:24:48Z`、`mergedBy: hyc640110`。Deploy GitHub Pages run [31804595653](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31804595653) success，headSha 與 merge commit 一致；Production／Preview 皆 `curl` 實測 HTTP 200，Production 唯讀確認新「登記還款」Producer UI 已存在、console 無錯誤，未在 Production 建立任何測試資料。
- 明確不包含：FX（見 054-B）、Generic Split（見 054-C）、Investment（見下方**治理記錄修正**）、CSV／Import Center（見 UR-TODO-055）、schema／persistence／attribution calculator／reconciliation 核心修改。
- **治理記錄修正（2026-08-15，UR-TODO-055 唯讀盤點時發現並修正）**：本條目原本記載「Investment 不需要處理——已用 runtime 證據確認 Investment 買賣本就走既有通用 `safe-taxonomy-candidate`／`RuntimeAttributionProvenanceCard` 路徑，非本次遺漏的缺口」，**此說法經 UR-TODO-055 盤點以實際程式碼逐項核對後證實不準確，正式修正如下**：Investment 買賣目前**完全沒有任何 Producer**（手動或匯入皆無）——全庫搜尋確認 `investmentAttribution` 欄位在 `src/App.tsx`／`src/components/`／`src/pages/` 零命中，沒有任何 UI 或匯入路徑會設定這個欄位。`transactionReconciliation.ts` 的 `candidateFor()` 必須 `transaction.investmentAttribution` 已存在才會判定 `investment-buy`／`investment-sell`；若未設定，分類為「投資」（`expense-investment`）類別的交易會落入 `SAFE_EXPENSE_CATEGORIES` 判斷，而該清單**不含** `expense-investment`，最終結果是 `status: 'unsupported', reason: 'unsupported-taxonomy'`——**連進入 `safe-taxonomy-candidate`（`RuntimeAttributionProvenanceCard` 可確認清單）的資格都沒有**，並非原記錄所述「本就走既有通用路徑」。此修正避免未來依舊記錄的錯誤前提誤判 UR-TODO-055 或其他 Investment 相關工作的範圍；後續評估詳見 UR-TODO-055 正式條目。

#### UR-TODO-054-B FX Confirmation UI

- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成內容：新增 `src/lib/fxConversionPresentation.ts`（`deriveFxConversionPresentations()` 純函式選擇器，依 `conversionId` 把兩筆各自獨立 reconcile 的 leg 交易合併為單一 presentation 項目，架構比照 054-A `loanConfirmationPresentation.ts` 的成功模式，但依 FX「2 交易→1 event」的資料結構簡化——不需要 Loan 式「決定性選出哪個 component」的 void 目標邏輯）、`src/components/fx/FxConfirmationCard.tsx`（確認／撤銷 UI，沿用 `LoanConfirmationCard.tsx` 已驗證過的防呆對話框與錯誤處理慣例，`handleConfirm`／`handleVoid` 皆有 try/catch defense-in-depth）；`App.tsx` 新增 `confirmFxConversion()`／`voidFxConversion()` handler，分別重用既有、未修改的 `confirmFxConversionAndAppend()`／`voidFinancialEventAndAppend()` contract。
- **關鍵風險點（Contract Audit 第 8 點已預先標註，開發時正確處理並有測試明確鎖定）**：`confirmFxConversionAndAppend()` 成功時 `result.events` 是**完整合併後的 Ledger**，與 Loan 的 `confirmLoanPaymentGroupAndAppend()`（只回傳新建的那組事件）方向相反；`confirmFxConversion()` handler 正確使用 `financialEvents: result.events`（整份取代），而非 Loan 慣用的疊加寫法。`tests/fxConversionPresentation.test.ts` 有一項明確標記 CRITICAL 的 regression test：帶入含既有無關事件的 `existingEvents`，斷言正確取代不會複製既有事件，並同時模擬「錯誤疊加寫法」證明兩者在此處數量不可能相同。本機 Preview 亦已完整端到端實機驗證 create→confirm→void→reconfirm 全流程，`financialEvents.length` 依序為 0→1→2→3（若誤用疊加寫法會變成 5），與單元測試結論一致。
- **與 PR #333（Close without merge）的關係**：開發 PR #357 過程中發現 Repository 上已存在另一個更早的 Draft PR #333（`feat: FX Group Confirmation Lifecycle UI`，2026-08-14 建立，來自與本次無關的較早 session），其分支落後 `origin/main` 54 個 commit，若直接 Merge 會刪除大量已上線功能（信用卡繳費提醒卡片、重點標的卡片、逢低加碼引擎、三策略再平衡模擬比較頁面等）。Closeout Audit（Review Mode，唯讀盤點）確認：**兩個完全獨立、互不知情的實作各自收斂到相同的核心架構判斷**（純函式選擇器＋專屬 Card 元件、`events` 疊加方向的正確處理完全一致）——這是對 PR #357 核心設計正確性的交叉驗證訊號。PR #333 內確實含有 PR #357 當時缺少、具備真實防呆價值的內容，已於同一 PR #357 分支上補齊：(1) 跨 envelope 重複認領防呆——`deriveFxConversionPresentations()` 改用既有 `resolveFxConversions()`（有跨 envelope 重複認領偵測）取代單一 envelope 的 `resolveFxConversionEnvelope()`，新增對應測試；(2) `handleVoid` 補上 try/catch defense-in-depth，與 `handleConfirm` 對稱；(3) 測試韌性缺口補齊——`runtimeAttributionPresentation.test.ts` 新增直接驗證 `fx-conversion` 型別事件永遠不會出現在 `derivedEvidenceItems`／`zeroContributionItems` 的測試（補強 Contract Audit 第 7 點「不需要修改 `RuntimeAttributionProvenanceCard`」結論的下游證據）、`fxConfirmationCard.test.ts` 新增取消對話框（confirm／void 各一項）、double-submit 點擊語意、Card 本身不依賴 Producer gate 的獨立性驗證（測試總數由 7 → 12）。**PR #333 本身已於同日（2026-08-15）正式 Close（未 Merge）**，其完整 diff 與描述保留於已關閉 PR 記錄中，不會遺失；未採用的部分：PR #333 額外提供的帳戶名稱／匯率／費用顯示欄位，屬於產品層級錦上添花，本次刻意不採用，非遺漏。
- Merge 資訊：**PR [#357](https://github.com/hyc640110/family-universal-rebalance/pull/357)**，merge commit `fc9684ef955fca5c9d4194ea670b719e32c58727`，parents `c49594a06586889b31314d353c1a67288bb5e161`（merge 前 main）／`d48e862ae6499e601e49881819225db04a2a7997`（PR head），**一般 merge commit，未使用 admin override**。Deploy GitHub Pages run [31895761055](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31895761055) success，headSha 與 merge commit 一致；Production 已唯讀確認 FX Producer 表單與 `FxConfirmationCard` 皆正確不顯示（Production Producer gate 維持 OFF，本次 Merge 未觸碰此常數）、既有交易／匯入功能不受影響，console 無錯誤。使用者已於 Preview 環境完整驗收：候選正確合併為 1 項、confirm／void／reconfirm 完整循環正常、取消對話框防護生效、既有功能不受影響、手機版排版正常。
- 明確不包含：帳戶名稱／匯率／費用顯示（PR #333 額外提供但本次刻意不採用的錦上添花欄位，若未來需要可另立獨立 Todo）；Production FX Producer 啟用（`FX_OPAQUE_PRODUCER_SOURCE_GATE` 維持 OFF，仍是獨立、需另行明確授權的 Controlled Rollout Policy 決策，不因 054-B 完成而自動觸發）；FX gain/loss attribution、其他貨幣對（JPY/EUR）擴充、自動 FX pairing、進階 fee attribution（以上見 UR-TODO-056）；Generic Split（見 054-C）；`confirmFxConversionAndAppend()`／`buildFxConversionAttributionConfirmation()` 核心 contract 本身；schema／persistence／attribution calculator／reconciliation 核心修改；UR-TODO-054-C。
- 原始 Contract Audit 結論（唯讀盤點，2026-08-14，已驗證與實際落地一致）：
  1. FX Confirmation 既有 core contract 已完整：candidate（`fx-conversion-contract-candidate`）／confirm（`confirmFxConversionAndAppend()`）／matched（`linked-fx-conversion`）／void（既有通用 `voidFinancialEventAndAppend()`）／reconfirm，四個生命週期階段皆已用測試鎖定（`tests/fxConversionAttribution.test.ts` 等，本輪重新執行相關 130 個測試 0 fail）。
  2. 一次 FX confirmation 只產生 **1 筆** `fx-conversion` `FinancialEvent`（不是 Loan 式的多筆 component group）。
  3. `conversionId`（＝ opaque envelope id）＝經濟身分，永久不變；`FinancialEvent.id`＝確認嘗試身分，每次 confirm／reconfirm 皆全新。
  4. **無 Loan 式 `confirmationGroupId`**——因只有 1 筆事件，不需要第二層 group identity。
  5. Void 只需對唯一那筆 confirmation event 呼叫一次既有 void primitive，結構上不存在「部分 void、sibling 孤兒殘留」的問題（因為根本沒有 sibling）。
  6. Reconfirm 產生新的 `FinancialEvent.id`，`conversionId` 不變，新舊事件不混接（已用測試鎖定）。
  7. **不需要修改 `RuntimeAttributionProvenanceCard` 的 FX 排除**——與 Loan 不同，FX 沒有獨立的 derived-evidence 產生路徑（沒有 `deriveLoanRuntimeEvidence()` 的 FX 對應物），結構上 FX candidate 不可能出現在 `derivedEvidenceItems` 中，Loan 054-A 遇到的 UI safety 缺口在 FX 不存在。
  8. **關鍵、與 Loan 相反的差異，開發時必須注意**：`confirmFxConversionAndAppend()` 成功時 `result.events` ＝**完整合併後的 Ledger**（`appendFinancialEvent()` 回傳 `[...existingEvents, newEvent]`），caller **必須直接 replace** `state.financialEvents`，**不得**像 Loan 那樣再做一次 `[...current.financialEvents, ...result.events]` 附加（會造成整個既有 Ledger 重複疊加一次）。
  9. Preview Producer＝ON、Production Producer＝OFF（維持既有 F2C-3 狀態，本輪未變動、054-B 開發也不應變動）。
  10. 054-B 不修改 feature gate、不啟用 Production Producer——Confirmation UI 只消費既有 candidate，與 Producer gate 完全獨立；Production 因目前無既有 FX candidate 資料，UI 上線後自然不顯示任何項目，Preview 已具備完整 candidate 建立能力可完整驗收。
  11. FX Production Producer Enable 維持既有 ADR-010／ADR-013 **Controlled Rollout Policy** 框架，是獨立、需另行明確授權的 product deployment decision，**不因 054-B 開發或完成而自動觸發**。
- 依賴：UR-TODO-046（已 CLOSED，F2D principal attribution 基礎已具備）；054-A（已 CLOSED，證明「各 domain 獨立 UI 元件」模式可行，054-B 沿用同一實作模式，未抽出共用 framework）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（候選正確合併為 1 項、confirm／void／reconfirm 完整循環正常、取消對話框防護生效、既有功能不受影響、手機版排版正常），Production 唯讀確認功能與既有頁面皆正常，Producer gate 維持 OFF。

#### UR-TODO-054-C Generic Split Confirmation UI

- 狀態：**待規劃（Contract Audit 已完成，判定 NO-GO development——非「不可行」，而是「目前沒有可消費的真實 candidate／producer」，阻礙不在 UI 實作細節）**
- Contract Audit 完成日期：2026-08-15（Codex Desktop 執行，Review Mode 唯讀盤點；本次治理同步已重新以 Repository 實證逐項核對下方結論，非直接照抄外部來源文字）
- Contract Audit 核心結論：
  1. Generic Split 底層 contract（`appendGenericSplitAllocationGroup()`、`genericSplitAllocation.ts` 的 `domain`／`allocationGroupId`／`componentId` identity）已存在且完整，符合 ADR-003。
  2. **關鍵缺口**：目前完全沒有任何 candidate producer——`appendGenericSplitAllocationGroup()` 唯一呼叫者是測試本身（`src/lib/financialEvents.ts` 內定義，全庫搜尋確認 `src/App.tsx` 對 `appendGenericSplitAllocationGroup`／`genericSplitAllocation`／`splitAllocationLink`／`allocationGroupId` 任一字串**零命中**），沒有任何頁面、表單、CSV／Import Center 路徑會建立 `splitAllocationLink` 或 `allocationGroupId`。既有整合測試（`tests/genericSplitAllocation.test.ts`）僅使用 `domain: 'test-only'` fixture。
  3. `transactionReconciliation.ts` 對 Generic Split 只定義了 `matched` 狀態的 `linked-generic-split-group` reason（第 13、266 行），**沒有 Generic Split 專屬的 `candidate` reason**——這與 Loan（`loan-payment-contract-candidate`）、FX（`fx-conversion-contract-candidate`）皆已有專屬 candidate reason 的現況不同。未匹配的交易只會落入一般 `safe-taxonomy-candidate`，不含 allocation 資訊，無法作為 Generic Split Confirmation UI 的可確認 payload。
  4. `RuntimeAttributionProvenanceCard` 確認不適用，但與 Loan／FX 的「已確認不適用」性質不同：Loan／FX 是「有 derived evidence 路徑、需要明確排除邏輯避免誤判」；Generic Split 是**連 derived evidence 或 candidate 都不存在**，全庫搜尋 `derivedAttributionEvidence.ts`／`runtimeAttributionPresentation.ts` 對 Generic Split 相關字串同樣零命中——不是「需要排除」，是「目前根本沒有資料會出現」。
  5. **與 054-A（Loan，已 CLOSED）的關鍵差異**：底層 atomic contract 概念可部分重用（group-level 卡片、`voidFinancialEventAndAppend()`、confirm／void／reconfirm 互動流程），但 054-A 開始開發前已有 Loan Producer 與 `paymentId` candidate 存在；054-C 目前連 production domain、candidate producer、使用者輸入來源都不存在，範圍明顯大於單純的 Confirmation UI 開發（等同於要先做一個全新的 Producer，才有東西可以「確認」）。
- **結論：目前沒有實際使用場景需要這個 UI；阻礙是「沒有可消費的真實 candidate／producer」，不是 UI 實作細節。維持待規劃狀態，不建議現在開發。** 若未來要啟動，需要先有具體業務需求（使用者實際會拆分什麼類型的交易，例如一筆帳單同時含多個分類）才能定義 Producer 與 component mapping，不建議在沒有真實需求前先做 UI。
- **REOPEN TRIGGER**（2026-08-21）：出現真實 Generic Split candidate／producer。
- 明確不包含：在沒有具體業務需求與對應 Producer 設計前開始開發；修改既有 attribution 核心 contract；修改 `genericSplitAllocation.ts`／`appendGenericSplitAllocationGroup()`／`resolveActiveGenericSplitAllocationGroups()` 本身。
- 依賴：UR-TODO-046（已 CLOSED，contract 基礎已具備）；054-A（已 CLOSED，group-level 卡片架構可供未來參考，但不可直接套用，因為 054-C 缺少 054-A 開發前就已具備的 Producer／candidate 前提）。
- 驗收條件（待正式排入時另訂）

### UR-TODO-055 Loan／Investment Delivery Mapping（UI／CSV／Import Center）

- 優先級：待評估
- 狀態：**DEFERRED／NO-GO／NON-PRIORITY（2026-08-21 治理措辭強化；Contract Audit 已完成，2026-08-15，判定暫不建議開發——非「不可行」，而是「目前無記錄在案的急迫使用需求，且範圍比原始描述更大更複雜」，比照 054-C 的判定邏輯）**
- 提出日期：2026-08-14
- Contract Audit 完成日期：2026-08-15（Review Mode 唯讀盤點）
- 背景：UR-TODO-046 歷次治理紀錄（046-I1／046-L1 完成條目、FX-A3 條目）持續將「Loan UI／CSV／Import Center producer mapping」列為 Remaining Boundary，但從未列為 046 本身的驗收條件——即 Loan／Investment 的正式 attribution contract（identity、component group、fail-safe）已完成，缺口在於「如何讓使用者透過既有 Import Center 或專屬 UI，把外部資料（銀行對帳單、券商交易紀錄等）安全映射成符合正式 contract 的 `loanAttribution`／`investmentAttribution`」，這是交付／匯入層的工作，不是 attribution 核心邏輯缺口。
- Contract Audit 核心結論：
  1. 底層 attribution contract（`loanAttribution`／`investmentAttribution` 型別定義、`normalizeLoanAttribution()`／`normalizeInvestmentAttribution()`、reconciliation 判斷邏輯）**已完整存在，不需修改**；缺口純粹在「誰來產生（producer／匯入）這些欄位」的交付層，與原始背景描述的定位一致。
  2. **Loan 側**：已有 Producer（UR-TODO-054-A），缺口是「CSV 批次匯入＋金額拆分 UI」——且**需要新的 UI 互動設計，非單純欄位對應**：銀行對帳單通常只有一欄「貸款扣款金額」（例如 28,700），不會有現成的「本金 23,500／利息 5,200」拆分欄位，Import Center 既有的「系統猜測欄位對應＋使用者確認」慣例無法直接套用在「金額拆分」這件事上，需要另外設計互動流程（例如使用者在匯入預覽階段逐筆手動輸入拆分金額）。
  3. **Investment 側：範圍比原始背景描述假設的更大**——連基礎 Producer 都不存在（詳見上方 UR-TODO-054-A 條目的治理記錄修正），實際上更接近一個獨立的「Investment Producer」子項（性質類似 UR-TODO-054 系列的第四個子項：先要有手動單筆輸入的 Producer 與 Confirmation UI，CSV／Import Center 對應才有意義討論），而非單純的 CSV 欄位對應工作。
  4. **治理文件內未記載任何具體業務情境**（例如哪個銀行／券商的 CSV 格式、目前手動輸入的實際痛點頻率）——`008_TODO_BACKLOG.md`、`012_AI_HANDOVER.md`、`009_CHANGELOG.md` 逐一查證確認皆只有「銀行對帳單、券商交易紀錄等」這類泛用範例，非使用者實際提出的具體需求。比照 UR-TODO-054-C 的判定邏輯，**判定為錦上添花性質，暫不建議在沒有具體業務情境前開發**。
- 若未來要啟動，建議拆成至少三個獨立子項分開稽核與開發，不建議合併成單一 PR：
  1. Investment Producer（獨立 Contract Audit＋開發，性質類似 054 系列子項）
  2. Loan CSV 批次匯入＋金額拆分 UI
  3. Import Center `ImportMapping` schema 擴充（若 1、2 皆需要，可能有共用的型別調整）
- 明確不包含：修改既有 attribution 核心 contract；FX（見 UR-TODO-056）；在沒有具體業務需求前開始開發。
- 依賴：UR-TODO-046（已 CLOSED，Loan／Investment contract 基礎已具備）；UR-TODO-054-A（已 CLOSED，Loan Producer 已存在，Investment 對應的 Producer 不存在，是本次盤點的關鍵發現）。
- 驗收條件（待正式排入時另訂，且需先有具體業務情境）
- **REOPEN TRIGGER**（2026-08-21）：Investment 側出現真實 producer／workflow blocker，或使用者明確要求 delivery mapping。

### UR-TODO-056 FX Enhancement Bundle（Valuation Attribution／其他貨幣對／自動配對／進階 Fee）

- 優先級：待評估
- 狀態：**DEFERRED／NO-GO／NON-PRIORITY（2026-08-21 治理措辭強化；Contract Audit 已於 2026-08-15 完成，四項皆判定不建議現在開發；實作時仍須拆成獨立子 Sprint，不得合併成單一大 PR）**
- 提出日期：2026-08-14
- 背景：UR-TODO-046 FX 序列（F2D）已完成 conversion principal 的 attribution foundation，並已用測試明確證明 principal contribution 與 FX 匯率波動對既有部位的估值效果（FX-A3 valuation）完全分離。以下項目從未被列為 046 的驗收條件，歷次治理紀錄一貫將其記錄為獨立、未來階段：
  1. **FX valuation attribution**：USD 部位因匯率波動產生的 realized／unrealized gain/loss，目前仍留在 `unexplainedResidual`，未有正式 attribution contract
  2. **JPY/EUR 等其他貨幣對**：F2B／F2D 皆嚴格限定 TWD↔USD
  3. **Automated FX pairing／CSV 自動配對**：目前 Manual FX Producer 為使用者手動指定兩腿，未有自動偵測配對機制
  4. **進階 fee attribution**：F2D 明確排除 rate spread 推算 fee、explicit fee 表單內建立新交易等
- **Contract Audit 結論（2026-08-15，Review Mode 唯讀盤點）：**
  1. **FX valuation attribution**：`unexplainedResidual = netWorthChange - classifiedEventContribution`（`netWorthAttribution.ts`），匯率波動效果落在此殘差是「沒有分類事件」的數學必然結果，非刻意規則。`fxValuation.ts` 只有 FX-A1 單一時間點估值（`ForeignCashValuation`），沒有跨快照拆解「匯率波動貢獻 vs 部位增減貢獻」的邏輯。**四項中唯一已有直接可重用基礎建設**（rate history、valuation function），相對複雜度最低，但非開發優先理由。
  2. **JPY/EUR 等其他貨幣對**：確認嚴格限定 TWD↔USD，寫死於 `fxConversionIdentity.ts`（`SUPPORTED_FX_CONVERSION_CURRENCIES = new Set(['TWD', 'USD'])`）、`fxValuation.ts`（`FxRateRecord.baseCurrency` 型別即為 `'USD'` 字面值，非 `string`）、`cbcFxProvider.ts`（`CBC_USD_TWD_PROVIDER` 專為 NTD/USD 收盤匯率設計）三處。**非 runtime 開關，橫跨型別系統、Worker 資料來源、UI 表單四層**，擴充範圍大。
  3. **Automated FX pairing**：全庫搜尋 `fxConversionIdentity.ts`／`fxConversionProducer.ts`／`src/components/fx/*.tsx` 對 auto／automat／autoDetect 等字樣，唯一命中是既有程式碼註解「never auto-repaired, never silently guessed at」——**刻意拒絕自動猜測是既有設計原則，非尚未實作的既定方向**。完全沒有雛形，且「automated」具體場景（CSV 匯入自動偵測配對？表單自動預填？）治理文件與程式碼皆未定義，**需先做需求釐清才能進行 Contract Audit**。
  4. **進階 fee attribution**：現有 `none`／`explicit`／`included`／`unknown` 四態穩定運作（`explicit` 要求 fee 交易已存在，僅能透過連結既有交易下拉選單連結）。「進階」明確指向兩項已被 F2D 排除的能力：(a) 從匯率價差反推 fee——需先定義「市場匯率」基準，屬產品定義問題非技術缺口；(b) fee 表單內直接建立新交易——單純 UI 便利性改善，複雜度較低。
  - **依賴關係**：四個子項**架構上完全獨立，無強制依賴順序**——valuation attribution 不需要其他三項；JPY/EUR 擴充不影響其他三項；automated pairing 在 TWD/USD 單一貨幣對下即有獨立價值，不需要先有多貨幣對或 valuation attribution；advanced fee 可疊加在任何貨幣對／配對方式之上。
  - **是否有真實使用需求**：治理文件內**未記載任何一項的具體業務情境**（無使用者提出的日圓部位、fee 計算不準、批次換匯等具體需求）。比照 UR-TODO-054-C／UR-TODO-055 判定邏輯，**四項皆判定為未經需求驗證的技術性擴充清單，不建議現在開發任何一項**。
  - **若未來啟動的建議**：先確認具體業務情境；各自獨立走 Contract Audit（不得合併成單一 PR，本次盤點確認四者架構上也確實彼此獨立，適合分開稽核）；automated pairing 需先定義具體場景才能稽核，優先順序低於其餘三項。
- 明確不包含：修改既有 conversion principal attribution（已完成，不得重新開放）；Production Producer enable（獨立 rollout 決策，見下方）
- 依賴：UR-TODO-046（已 CLOSED，F2D principal/valuation 分離基礎已具備）
- **REOPEN TRIGGER**（2026-08-21）：出現真實 JPY／EUR 或其他 FX 使用情境，或現行 TWD／USD 流程出現實際 attribution 缺口。不得因技術完整性主動重新開發 FX valuation／automated pairing／advanced fee attribution。
- 驗收條件（待正式排入時另訂）

**附註（非新 Todo）：FX Production Producer Enable** 維持既有 ADR-010／ADR-013 Controlled Rollout Policy 框架——翻轉 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 對 Production 生效前提（目前 environment guard 使其恆為 OFF）屬獨立、明確授權的 product deployment decision，非新 Todo 編號、不因 UR-TODO-046 CLOSED 或上述任一 follow-up Todo 完成而自動觸發。

### UR-TODO-073 Design Polish — Dark Surface / Typography / Visual Hierarchy

- 優先級：P3（Maintenance / Real-Use-Case Driven Mode 下由真實使用 UX friction 觸發，使用者明確授權開發）
- 狀態：**CLOSED／Production Verified（2026-08-22）。**
- 提出日期：2026-08-21
- 背景／觸發依據：使用者於實際使用 Production 後，明確提出四項視覺體感問題：(1) 底色仍可更接近黑色、降低夜間刺眼感；(2) 藍色元素過多，主要／次要操作層級不夠明顯；(3) 主要資訊字體希望再大一些；(4) 卡片、按鈕、Modal／Sheet 希望更一致、更成熟。同時提供已確認的「深色模式・字體放大版」視覺參考圖，並明確選定此方向。同時符合 `003_CURRENT_STATUS.md` Maintenance Mode 既有 Sprint 觸發條件第 **2 項（真實使用 UX friction）**與第 **5 項（使用者明確提出新的產品需求）**。已 grep 全文 `008_TODO_BACKLOG.md`（含 Deferred 清單 012／015／017／018／019／020／024／025／054-C／055／056）確認無現有 Todo 涵蓋此範圍，非重複建檔；現有最大正式編號為 UR-TODO-072（CLOSED／Production Verified），073 為下一個合理編號。
- 產品目標：改善 Universal Rebalance 實際使用時的視覺舒適度、Mobile 可讀性與全站視覺層級；維持固定深色介面、成熟金融 App 風格，明確不做 Gaming／Cyberpunk 視覺方向。
- **Phase 1 正式範圍**：
  1. Global Design Tokens（Color／Typography／Spacing／Radius／Surface／Border／Shadow）
  2. Global base typography
  3. 共用視覺樣式：Card／Button／Input
  4. Mobile Bottom Navigation 視覺 polish（不改 Navigation IA）
  5. Assets Page
  6. Holding Compact Card
  7. Holding Detail Modal／Sheet（僅視覺 presentation，見下方 UR-TODO-072 interaction contract 保留條款）
  8. `AI_CONTEXT/017_Design_System.md`：待 Phase 1 實際落地後，依「最後實際落地的 implementation」正式補強；本次治理建檔僅記錄 intended contract，不得把尚未實作的具體 CSS 值宣稱為既成事實
- **Typography 方向（Phase 1 intended design range，非已落地 CSS 事實，供開發驗證目標）**：Page title 22–24px；Section heading 18–20px；Holding name 18–20px；Major amount 18–20px；P/L percentage 17–18px；Body 15–16px；Secondary 13–14px；Caption 12–13px；Button 15–16px。Mobile 優先，不得為 Desktop 資訊密度犧牲 Mobile 可讀性。
- **Visual Hierarchy（intended contract）**：Holding Card 資訊優先序為「股票名稱 > 主要金額／損益 > 配置比例 > 操作控制」；「詳細」須降為 Secondary Action，不得繼續使用與真正 Primary CTA 相同的大面積亮藍 filled style；Allocation ring 保留但降低視覺權重；Card 層級應主要依 surface contrast／spacing／subtle border 建立，而非大量高對比藍框。需建立至少 Primary／Secondary／Danger／Ghost 四種按鈕視覺層級。
- **台股金融色彩契約（不可違反）**：市場漲跌語意維持「上漲＝紅、下跌＝綠」，不得因一般西方 Design System「green=positive／red=negative」慣例而反轉。須明確區分 (A) Market semantic color（market-up／market-down）與 (B) UI semantic color（success／danger／warning／info）兩個獨立軸線——例如「刪除／封存」可用 danger red、「操作成功」可用 success green，但不得影響市場價格紅漲綠跌契約。
- **明確不包含（Non-goals）**：Navigation IA 重構、新增 Desktop sidebar、Dashboard 資訊架構重做、Light Mode、Theme toggle、任何新功能、`Holding` schema 修改、`AppState` financial semantics 修改、localStorage contract 修改、JSON Backup contract 修改、Financial Event Ledger 修改、attribution 修改、Household Liquidity 修改、Rebalance 修改、CLEC 修改、AI Decision 修改、market-data provider 修改、quote calculation 修改、`holdingDisplayOrder` 修改、逢低加碼演算法修改、`focusedSymbols` semantics 修改、transaction formulas 修改、portfolio calculation 修改。核心契約：**financial semantic diff = 0，persistence semantic diff = 0**。
- **UR-TODO-072 Interaction Contract 保留（不得回歸）**：Holding Detail Sheet／Modal 的 Mobile near-full-height Sheet／Desktop centered Modal、scroll position preservation、`focus({ preventScroll: true })`、`role="dialog"`／`aria-modal="true"`、focus behavior、safe-area handling、background scroll lock、bottom navigation 不遮擋、最後一項可完整捲動、正確 holding context、archive 後正確關閉——本 Todo 僅允許改變其視覺 presentation，不得變動上述 interaction contract 任一項。
- 依賴：UR-TODO-070／071／072（皆已 CLOSED／Production Verified，現行 `HoldingCompactCard`／`holdingDisplayOrder`／`HoldingOrderHandle`／`HoldingDetailDialog` 渲染與互動路徑為本次視覺 polish 的既有基礎，不得變動其資料與互動語意）。
- **Phase 1 Acceptance Criteria**：
  1. 深色背景比目前更接近黑色，但 Card／Input／Modal 仍可清楚分層。
  2. Mobile 主要資訊字體明顯提升可讀性。
  3. 「詳細」降為 Secondary Action，不再與 Primary CTA 搶視覺焦點。
  4. Card 減少框中框與不必要高對比藍色 border。
  5. Holding Detail Sheet／Modal 視覺層級改善，但 UR-TODO-072 interaction contract 零回歸。
  6. Mobile Bottom Navigation：active 狀態清楚、inactive muted、active blue 不過度刺眼，且不改 Navigation IA。
  7. 台股上漲紅／下跌綠不得反轉。
  8. Responsive 無 horizontal overflow：320×700、390×844、430px width、1000×800、1280×800、1600px width。
  9. 字體放大後：長股票名稱不破版、長金額不重疊、Card grid 不破壞、Bottom Navigation 不遮內容、Sheet 最底部仍可操作。
  10. Regression：UR-TODO-070／071／072 既有 contract 持續通過（既有測試全數 pass，無回歸）。
  11. **iPhone Safari Preview 真機人工驗收為 Merge 前必要條件**。
  12. **Production 不得在人工驗收前部署**。
  13. `test:ci`／`npx tsc -b`／`npm run build`／`git diff --check` 全數通過。
- **Development Workflow 預先契約**：正式進入「開始開發」時才允許從當時最新 `origin/main` 建立／重建 feature branch；先做 CSS／UI Contract Audit，再建立 design tokens，再進行 Phase 1 implementation。不得假設治理建檔當下既有的本機空 branch 到開發當天仍是最新基線；若開發前 `origin/main` 已前進，必須重新同步最新基線後再開始。
- **已知 pre-existing 未授權草稿（本次治理建檔一併記錄，供下一位 AI／開發者知悉）**：本機曾發現 `feat/ur-todo-073-dark-design-polish` branch 的 working tree 上有一份**未經本輪 Review Mode 授權**的 `src/styles.css` 草稿修改（design tokens／typography／button hierarchy 相關），為避免與本輪純治理範圍混淆，已以 `git stash` 保留（未 commit、未丟棄），訊息前綴 `UR-TODO-073 prep:`。**該草稿不代表本 Todo 已開始開發或已通過任何 Contract Audit**，未來若要繼續，必須先依上方 Development Workflow 契約重新從最新 `origin/main` 開始，並自行判斷該草稿內容是否仍適用，不得直接沿用未經 Audit 的既有 diff。

**Phase 1 Closeout（2026-08-22，PR [#408](https://github.com/hyc640110/family-universal-rebalance/pull/408)，final head `1a8c4f7941b23ccab0754385ae69798fa8c6108f`）**：Branch `feat/ur-todo-073-dark-design-polish` 自 `origin/main` `ef65d42` 開出，經四輪迭代開發並各自完成 CI PASS＋Preview 部署＋iPhone Safari 真機驗收：

1. **第一輪**：建立完整 design token 系統（`--bg-page`／`--bg-surface`／`--bg-surface-2`／`--text-primary`／`--text-secondary`／`--text-muted`／`--primary`／`--primary-hover`／`--market-up`／`--market-down`／`--warning`／`--danger`／`--radius-*`／`--space-*`／`--shadow-*`），套用於全站共用 Card／Button／Input／Section Toggle／Holding Card／Holding Detail Dialog／Mobile Bottom Nav／Desktop Sidebar；`.holding-name`／`.holding-symbol` 主次視覺對調；修正 `.ai-decision-*` 先前引用但從未定義的 `--muted`／`--card`／`--line`／`--accent` custom properties。
2. **第二輪**（追蹤第一輪 iPhone 驗收 FAIL 後的 root cause）：發現並修正 `≤768px` mobile media query 對 `.holding-mobile-weight`／`.holding-editor-summary` 殘留 pre-token hardcoded hex 的 cascade 回歸；移除 Holding Card 逐欄框中框樣式；擴大 token 覆蓋至 Home／Analysis／Market／Tools／Settings／Portfolio-Risk 等全站主要頁面（約 850 處 hardcoded hex 收斂為 token）；修正 Desktop Sidebar active 狀態誤用 `--text-primary` 而非 primary accent 的問題，使其與 Mobile Bottom Nav 一致。
3. **第三輪**（追蹤 iPhone 回報「allocation ring 未顯示」）：唯讀 root cause 稽核確認並非 cache 問題，而是 (a) Preview 隔離 localStorage 於全新 session 預設 0 股，導致 ring 比例為 0；(b) ring 軌道色 `--bg-surface-2` 與挖空色 `--bg-surface` 對比度過低、任何比例下皆近乎不可辨識——已改用 `--border` 作為軌道色，並放大 ring 尺寸，使其在任何比例下皆清楚可見；同時將 Holding Card mobile 版面透過 `grid-template-areas` 重構為更精簡的摘要卡型式。
4. **第四輪**：依使用者提供的目標排版參考圖，把「市值」label／金額改為同排（inline，非上下堆疊，本輪 hard acceptance criterion）；未實現損益改為百分比為主要視覺、label 為次要視覺（column-reverse）；市值與未實現損益合併為同一列，390px 卡片高度由 Sprint 前約 306px 降至 219px。

**使用者於 2026-08-22 完成第四輪 Preview iPhone Safari 真機驗收後正式決定**：UR-TODO-073 Phase 1 的 dark surface hierarchy、typography 放大、visual hierarchy、共用 Card／Button／Input／Modal polish、全站 dark token 覆蓋、Mobile Bottom Navigation／Desktop Sidebar 視覺 polish、台股紅漲綠跌語意，已足以結束本 Todo 範圍；但 Holding Card 的 compact 資訊排版（市值／未實現損益／現價／今日漲跌的實際 grid 配置與卡片高度）**仍有精修空間，使用者明確 defer 至獨立的 UR-TODO-074，不再視為本 Todo 的收尾阻擋項**。本次結論**不宣稱**「Holding Card layout 已完成最終設計」——該項目正式移交 UR-TODO-074 持續精修。

`financial semantic diff = 0`、`persistence semantic diff = 0` 全程維持：`src/lib/**`、schema、`AppState` financial semantics、localStorage／JSON Backup contract、Financial Event Ledger、`holdingDisplayOrder`、Rebalance、CLEC、Household Liquidity、AI Decision、Navigation IA、UR-TODO-070／071／072 interaction contract 均為 0 diff（各輪皆有對應 regression test 鎖定並持續 pass）。

**Production Merge／Deploy／Verification Closeout（2026-08-22）**：使用者明確授權後，PR #408（final head `1a8c4f7941b23ccab0754385ae69798fa8c6108f`）由 `hyc640110` 於 `2026-08-22T04:22:58Z` 以一般 2-parent merge commit `d348372599c4bdcfba8d5b4d5fb21722366bc33e`（parents `ef65d42c7a121a2bfd06b4fae48aee39ce2d7a44`／`1a8c4f7941b23ccab0754385ae69798fa8c6108f`）合併，**未使用 admin override，非 squash／非 rebase**。合併後由 push-to-main 觸發的正式 Deploy GitHub Pages run [32551553647](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32551553647)（`event=push`，`headSha` 與 merge commit 一致）成功完成，`build`／`deploy` 兩個 job 皆 success。Production 唯讀驗證（不涉任何資料寫入）全數 PASS：HTTP 200、GitHub Pages deployment `sha`／`environment=github-pages`／`state=success` 一致、實際 asset hash（`index-CsKMDuqO.css`／`index-tBOP6UcQ.js`）確認為本次新 build、dark surface／typography／Mobile Bottom Nav／Desktop Sidebar active-inactive／Holding Card 名稱-symbol 階層／市值同排／Secondary「詳細」按鈕／drag handle／Holding Detail Dialog 開關（`role="dialog"`／`aria-modal="true"`，Escape 關閉）／台股上漲紅下跌綠語意，於 320／390／430／1000／1280／1600 六組寬度下皆確認無 horizontal overflow、console 無錯誤。Production 上該帳號 4 檔既有真實持股（00662／00670L／00865B／00631L）ring 顯示 0% 為使用者帳戶既有真實 0 股狀態（非本次 Sprint 缺陷），已透過確認即時報價正常載入排除 API rate-limiting 可能性。**UR-TODO-073 正式 CLOSED／Production Verified。**

### UR-TODO-074 Holding Card Compact Information Layout Refinement

- 優先級：P3（UR-TODO-073 Phase 1 的直接 follow-up，由使用者 iPhone Safari 真機驗收後明確提出）
- 狀態：**CLOSED／Production Verified（2026-08-22）。**
- 提出日期：2026-08-22
- 背景／觸發依據：使用者於 UR-TODO-073 Phase 1 第四輪 Preview 真機驗收後確認整體 dark design language（背景層次、字體、共用元件、Navigation、全站色彩一致性）已可接受並結束 073 範圍，但認為 Holding Card 的資訊編排（市值／未實現損益／現價／今日漲跌的實際排列方式與卡片高度）仍有精修空間，明確要求另開小型 Sprint 處理，避免持續擴大 PR #408 範圍。
- 產品目標：在不改變任何既有資料欄位、財務語意與互動契約的前提下，以使用者提供的參考圖為 visual direction，進一步精修 Holding Card 的 compact information layout，讓 iPhone 單一 viewport 可看到更多持股，同時維持字體清晰可讀。
- **Phase 1（本 Todo）建議範圍**：
  1. Allocation Ring 保留且維持清楚可見（沿用 UR-TODO-073 已修正的 track/hole 對比與 conic-gradient 機制）
  2. 股票名稱維持主要資訊，symbol 維持次要資訊（沿用 UR-TODO-073 已建立的視覺主次）
  3. 「市值」label 與 NT$ 金額同排（沿用 UR-TODO-073 第四輪已建立的 inline 慣例，本 Todo 精修其與其他欄位的整體排列）
  4. 未實現損益的位置與視覺層級重新精修
  5. 「詳細」維持 Secondary Action
  6. 現價／今日漲跌採 compact secondary 呈現方式重新評估
  7. 減少不必要垂直空間，目標是同一 iPhone viewport 顯示更多持股
  8. 長股票名稱不得破版
- **明確不包含（Non-goals）**：financial semantics、quote calculation、market value calculation、unrealized P/L calculation、schema、persistence、`holdingDisplayOrder`、drag reorder semantics、Holding Detail Sheet／Modal interaction semantics（UR-TODO-072 contract）、Navigation IA、`src/lib/**` 任何修改。
- 依賴：UR-TODO-073 Phase 1（design tokens／dark surface／typography 基礎）、UR-TODO-070（`holdingDisplayOrder`）、UR-TODO-071（drag handle／Desktop 9-column row contract）、UR-TODO-072（Detail Sheet/Modal interaction contract）——本 Todo 僅在其既有基礎上做視覺排版精修，不得變動上述任一契約。
- **驗收條件（至少）**：
  1. Responsive 無 horizontal overflow：320×700、390×844、430px width、1000×800、1280×800、1600px width。
  2. 長股票名稱、長金額不破版、不重疊。
  3. UR-TODO-070／071／072 既有 contract 持續通過（既有測試全數 pass，無回歸）。
  4. 台股上漲紅／下跌綠不得反轉。
  5. `test:ci`／`npx tsc -b`／`npm run build`／`git diff --check` 全數通過。
  6. **iPhone Safari Preview 真機人工驗收為 Merge 前必要條件**。
  7. **Production 不得在人工驗收前部署**。

**實作與驗收記錄（2026-08-22，PR [#410](https://github.com/hyc640110/family-universal-rebalance/pull/410)，final head `eeb2178f0682b687b51a1387e0587bd3d78ba371`，Branch `feat/ur-todo-074-holding-card-compact-layout` 自 `origin/main` `9c979acfc2ae070be49152b57932b1b2d176129f` 開出）**：經四輪迭代開發與 Preview iPhone Safari 真機驗收：

1. **第一輪**：Mobile Holding Card 由 UR-TODO-073 收尾時的 4 列版面（identity／value+pnl／meta+meta2／detail）收斂為 3 列（identity+handle／value+pnl／detail+pnl），現價／今日漲跌自摘要卡隱藏並改於 HoldingDetailContent 新增顯示（與股數／均價相同模式，未刪除任何資料），純 CSS grid-template-areas 重排，App.tsx 僅新增一段 HoldingDetailContent 顯示欄位，`HoldingCompactCard` JSX 零變動。Allocation Ring 因巢狀於 `.holding-card-identity` 內，改以 `position:absolute` 達成視覺跨列效果，避免變動 `.holding-card-summary` 直接子元素數量（UR-TODO-071 桌面 9-column row 依賴穩定子元素順序）。
2. **第二輪**（iPhone 驗收回報 Ring 過小）：Ring 外徑由 52px 放大為 320px:64px／390px:70px／430px:76px，並以圓弧弦寬（chord-width，非僅外接矩形寬度）幾何驗證確認各長度百分比字串（67.4%／10.7%／48.8%）完整落於圓形挖空區內。
3. **第三輪**（iPhone 驗收回報環厚過粗、詳細按鈕過窄、P&L 間距過遠、全站深色底色偏藍灰）：Ring punch-hole inset 縮小（環變細，外徑不變）；「詳細」按鈕加寬至 min-width 88px／高度 37px；未實現損益百分比與 label 間距由 `justify-content:space-between`（推至整個 pnl 區域頂/底端）改為 `justify-content:center;gap:3px`（緊密成組）；`--bg-page`／`--bg-surface`／`--bg-surface-2` 深色 token 加深並降低藍色 hue 偏移。
4. **第四輪**（iPhone 驗收回報 Ring 與右側內容間距過近、股票名稱可再放大、深色底色仍只在 Holding Card 區域明顯生效）：Ring 與內容間距由 8px 加大為 14–16px；股票名稱於 Mobile 範圍化放大為 20px（透過 `.holding-card-identity .holding-name` 選擇器，不動全域 `--font-name` token，桌面／Detail Sheet header 不受影響）；root-cause 稽核找出全站仍有 4 處 UR-TODO-073 之前遺留、未 token 化的硬編碼藍灰色結構性 surface（`.order-section.order-muted`、`.rebalance-group .group-main`、`.runtime-attribution-derived-evidence-item`、`.household-liquidity-diagnostics-toggle`）並改為既有 token；`--bg-page`／`--bg-surface`／`--bg-surface-2`／`--border` 進一步加深並將藍色 hue bias 由約 10–15 降至 3 以內，同時維持 page→surface→surface-2 三層可辨識層次。

**使用者於 2026-08-22 完成第四輪 Preview iPhone Safari 真機驗收，結論正式為 PASS（USER ACCEPTED），並明確授權 Merge。** `financial semantic diff = 0`、`persistence semantic diff = 0`：`src/lib/**`、schema、persistence、`holdingDisplayOrder`、drag reorder semantics、Holding Detail Sheet/Modal interaction contract（UR-TODO-072）、Navigation IA 全程 0 diff（UR-TODO-070／071／072／073 既有 regression test 全數持續 pass，並新增本 Todo 專屬 regression test 鎖定 ring 尺寸/inset/gap、詳細按鈕寬度、P&L 間距、dark token 層次與硬編碼洩漏修正）。台股「上漲＝紅、下跌＝綠」市場色彩契約全程未反轉。PR CI Verification run [32561604196](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32561604196) success。

**Production Merge／Deploy／Verification Closeout（2026-08-22）**：PR #410（final head `5f6a3a316e431945c424301d57bea8dc99c407c5`）由 `hyc640110` 於 `2026-08-22T08:16:44Z` 以一般 2-parent merge commit `0d1cdacad30df11fa8a8074333a70ff8d877ee87`（parents `9c979acfc2ae070be49152b57932b1b2d176129f`／`5f6a3a316e431945c424301d57bea8dc99c407c5`）合併，**未使用 admin override，非 squash／非 rebase**。merge 後 push-to-main 觸發之 Deploy GitHub Pages run [32561862114](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32561862114)（`event=push`，headSha 與 merge commit 一致）成功完成，`build`／`deploy` 兩個 job 皆 success。Production 唯讀驗證（不涉任何資料寫入）全數 PASS：HTTP 200、GitHub Pages deployment `sha`／`environment=github-pages`／`state=success` 一致、實際 asset hash（`index-DraZnquv.css`／`index-C3FwlKw8.js`）確認為本次新 build、Holding Card Ring 尺寸/環厚/間距、「詳細」按鈕（88×37px）、drag handle、Holding Detail Dialog 開關（含新增之現價／今日漲跌欄位）、dark surface 深色 token（body `rgb(7,8,10)`／card `rgb(12,15,17)`）、台股上漲紅／下跌綠語意，於 320／390／430／1000／1280／1600 六組寬度（Assets／Home／Analysis／Market／Tools／Settings 頁）皆確認無 horizontal overflow，console 除既有外部報價 API 429（與本 Sprint UI 變更無關）外無新增錯誤。Production 上該帳號 4 檔既有真實持股（00662／00670L／00865B／00631L）ring 顯示 0% 為使用者帳戶既有真實 0 股狀態（與 UR-TODO-073 Production 驗證時相同，非本次 Sprint 缺陷）。**UR-TODO-074 正式 CLOSED／Production Verified。**

### UR-TODO-072 Holding Card Detail Modal/Sheet

- 優先級：P3（Maintenance / Real-Use-Case Driven Mode 下由真實 iPhone Production 使用 UX friction 觸發，使用者明確授權開發）
- 狀態：**CLOSED（2026-08-21）／已完成、已 Merge、Production Verified**
- 完成日期：2026-08-21
- Merge 資訊：**PR [#406](https://github.com/hyc640110/family-universal-rebalance/pull/406)**，final head `a25f39359b2b1a7219eccfa13fe78102e1798a1f`，一般 2-parent merge commit `5e939433c272d87f2a794554f9ec1373a50d4bf3`（parents `614771ffd8013ad7eb8b238fa3cec439c338f54c`／`a25f39359b2b1a7219eccfa13fe78102e1798a1f`），`mergedAt: 2026-08-21T15:16:18Z`，`mergedBy: hyc640110`，**未使用 admin override**。PR required CI Verification run [32495590307](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32495590307) success；同 head 之 Preview workflow_dispatch run [32495783281](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32495783281) success，使用者已完成該 head 的 **iPhone Safari 真機人工驗收，結論 PASS**。merge 後 main push 觸發之 Deploy GitHub Pages run [32496693557](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32496693557) success，head 與 merge commit 一致，regression gate、Production build、Pages deploy 均 success。
- **Production 唯讀驗證**：HTTP 200；deployment API 確認 sha=`5e939433c272d87f2a794554f9ec1373a50d4bf3`、`environment=github-pages`、`state=success`；console 無錯誤；`#/assets` 頁面 4 張 holding cards 皆維持 compact 版面、`.holding-editor` inline 展開區塊零殘留、「詳細」按鈕存在（4 個）；唯讀點擊其中一顆確認 Dialog 正確開啟（`role="dialog"`／`aria-modal="true"`，標題正確對應該持股）、`body` scroll lock 生效，隨即關閉、未輸入或修改任何欄位。驗證全程僅用唯讀 DOM 查詢與一次不涉及資料變更的開關互動，未寫入 Production 使用者資料、未修改 holding／focused symbol／dip alert／archive 狀態或 localStorage。
- 提出日期：2026-08-21
- 背景：使用者於 iPhone Production 實際使用時發現，點擊持股卡片「詳細」後會在卡片下方 inline 展開大量編輯欄位（總股數、成交均價、目標比例、資產分類、波段最高價、逢低提醒、重點標的、封存已清倉），造成卡片高度大幅增加、頁面被推長，查看下一檔持股需大量捲動。此為 Maintenance Mode 下明確的真實使用 UX friction（見 016 Product_Decisions 觸發條件第 2 項），非技術完整性驅動。
- 完成內容：
  1. 新增 `src/components/HoldingDetailDialog.tsx`——通用、無 holding-specific 資料耦合的 accessible dialog/sheet shell（`role="dialog"`／`aria-modal="true"`／`aria-labelledby`），同一 DOM 結構純以 CSS media query 在 Desktop 呈現置中 modal、Mobile（≤768px）呈現近全高（96dvh）bottom sheet。Backdrop 點擊（僅限點擊 backdrop 本身，不含冒泡）、Escape 鍵、明確 Close 按鈕三種方式關閉；掛載時 body scroll lock（`document.body.style.overflow='hidden'`）、卸載時還原；掛載時 focus 進入 Close 按鈕。
  2. `HoldingCompactCard` 移除 `isEditing && <div className="holding-editor">...}` inline 展開區塊與相關 `dipSetting`／`isFocused`／`onUpdate`／`onUpdateDipAlert`／`onToggleFocused`／`onRemove` props（不再需要，因為這些只被舊 inline editor 使用）；「詳細」按鈕改為 `onOpenDetail`，恆顯示「詳細」文字（不再有「收合」狀態），`aria-expanded`／`aria-haspopup="dialog"` 反映對應 dialog 是否開啟。
  3. 新增 `HoldingDetailContent`（App.tsx 內，因需要 `DraftInput`／`parsePositive`／`clampTarget`／`assetClassLabel`／`normalizeAssetClass` 等現有 App.tsx-local 純函式，抽出獨立檔案需額外 export 多個內部工具，判斷不值得為此增加風險——詳見下方架構決策）——承載原 inline editor 100% 相同的欄位與語意，**完全重用既有** `updateHolding`／`updateDipAlert`／`toggleFocusedSymbol`／`confirmRemoveHoldingAsset`，不建立第二套資料更新邏輯。
  4. State：`editingHoldingSymbol` 改名為 `selectedHoldingDetailSymbol: SymbolCode | null`；新增 `holdingDetailTriggerRef` 記錄開啟時的觸發按鈕，關閉時以 `.focus({ preventScroll: true })` 還原焦點（`preventScroll` 是必要修正——純 `.focus()` 預設會把觸發按鈕捲入可視範圍，導致 Assets 頁面跳動，違反下方驗收條件 6，已由 Preview 手動測試發現並修正）。Dialog 內容 `selectedHoldingDetailRow` 每次 render 皆從 `m.rows.find(...)` 重新取得（`m` 為既有 `calculateMetrics()` memo 結果），從未複製成獨立 editable state，故不可能顯示 stale 資料；持股在 Dialog 內被封存後，`m.rows` 自然不再含該 symbol（既有 `derivedHoldings()`／`uniqueSymbols()` 已排除 `isArchived`），Dialog 自動消失。
  5. `confirmRemoveHoldingAsset` 回傳型別改為 `boolean`（是否實際封存成功），Dialog 內封存呼叫改為 `symbol => { if (confirmRemoveHoldingAsset(symbol)) closeHoldingDetail(); }`——只有成功才關閉 Dialog，股數未歸零或使用者取消 `window.confirm` 時維持開啟並顯示既有錯誤訊息。既有 Analytics 列表「封存」按鈕（非本次範圍）呼叫方式不變，忽略新的回傳值。
  6. CSS：新增 `.holding-detail-backdrop`／`.holding-detail-dialog`／`.holding-detail-header`／`.holding-detail-close`／`.holding-detail-body`（`z-index:200`，高於既有 desktop-sidebar 70 與 mobile-page-nav 80，確保 Dialog 不被 Bottom Navigation 遮擋），`@media (max-width:768px)` 內覆寫為 bottom sheet 樣式並處理 `env(safe-area-inset-top/bottom)`。`.holding-editor`／`.holding-editor-summary`／`.holding-editor-grid` 等既有欄位樣式完全重用、未修改語意，只調整外層 margin/padding（不再需要卡片內分隔線，改由 Dialog header 承擔視覺分隔）。移除死碼 `.holding-compact.is-editing{grid-column:1/-1}`（inline 展開機制已不存在）。
- **架構決策：`HoldingDetailContent` 保留在 App.tsx 而非抽成獨立元件檔**——雖然 Dialog shell 本身（`HoldingDetailDialog.tsx`）已抽出至 `src/components/`（比照既有 `HoldingOrderHandle.tsx` 先例），但欄位內容需要的 `DraftInput`／`parsePositive`／`clampTarget`／`assetClassLabel`／`normalizeAssetClass` 等約 8 個純函式目前皆為 App.tsx module-scope 私有（無 `export`），且被 App.tsx 內其他多處元件（`FinancialAccountList`／`LoanList` 等）共用；為單一新元件檔新增這麼多 export 會擴大不必要的 diff／風險面。`HoldingCompactCard` 本身也一直是 App.tsx-local 元件（非抽出至 `components/`），故此決策與既有架構慣例一致。
- Scroll 行為驗證（Preview，桌機 1280×800／1000×800 與 iPhone 尺寸 320/390/430×viewport 皆測試）：開啟前設定 `scrollY=400` → 開啟 Dialog（`position:fixed` overlay，不佔用文件流，頁面高度不變）→ 關閉 Dialog（`preventScroll:true` 焦點還原）→ 確認 `scrollY` 精確回到 400，無跳動。
- Accessibility 驗證：`role="dialog"`／`aria-modal="true"`／`aria-labelledby` 正確指向持股名稱＋symbol 標題；Close 按鈕於掛載時取得 focus；Escape 鍵關閉（Desktop／Mobile 皆測試）；backdrop 點擊關閉，但點擊 Dialog body 內容不會誤觸關閉；`body` scroll lock 於掛載/卸載正確加上/移除。
- Responsive 驗證（Preview 唯讀 DOM／computed style 查驗，非 iPhone 真機）：Mobile 320px／390px 皆無 horizontal overflow，Sheet 高度 96dvh，`z-index:200` 高於 `.mobile-page-nav`（80），最後一項「封存已清倉」按鈕可捲動至完整可視／可操作；Desktop 1000px 置中 modal（左右留白對稱、`max-width:680px`）、背景 9-column card grid（UR-TODO-071 契約）未變。
- 新增測試：`tests/holdingDetailDialog.test.ts`（8 tests，`HoldingDetailDialog` shell 真實 jsdom + react-dom render——dialog 語意、close button、Escape、backdrop 點擊 vs 內容點擊、body scroll lock、focus）、`tests/holdingDetailDialogStructure.test.ts`（11 tests，App.tsx 原始碼結構檢驗，比照既有 `holdingCardDragReorderStructure.test.ts` 慣例——因 App.tsx 因 `import.meta.env` 無法被 test import）。既有 `tests/v6MobileSimplifiedExperience.test.ts` 一處斷言（原檢查 `editingHoldingSymbol === row.symbol` 字面字串）同步更新為 `selectedHoldingDetailSymbol === row.symbol`，語意不變、僅追隨改名。共新增 19 tests＋更新 1 個既有斷言，已納入 `npm run test:ci`（新增 `npm run test:ur-todo-072`）。
- 明確不包含：`Holding` schema／`AppState` 財務語意／localStorage schema／JSON Backup contract／`holdingDisplayOrder` persistence／Rebalance／AI Decision／CLEC／Household Liquidity／Financial Event Ledger／attribution／quote provider／市值／損益／成本公式／資產分類語意／逢低加碼演算法——原本資料與計算結果完全一致，純 presentation／interaction restructuring。未修改 `tests/holdingCardDragReorder*.test.ts`／`tests/holdingOrderHandle.test.ts`（UR-TODO-071 拖曳排序契約），已重新執行確認 25＋41 tests 全數通過、無回歸。
- 依賴：UR-TODO-070／UR-TODO-071（皆已 CLOSED，`HoldingCompactCard`／`holdingDisplayOrder`／`HoldingOrderHandle` 現行渲染與拖曳排序路徑已具備，本次未變動）。
- 驗收條件（**已達成**，Preview 唯讀驗證＋使用者 iPhone Safari 真機人工驗收 PASS）：
  1. 持股卡片維持 compact，點擊「詳細」後改為獨立 Sheet／Modal，不再於原卡片下方展開。
  2. Sheet／Modal 內容涵蓋原 inline editor 全部欄位，功能語意 100% 不變。
  3. Mobile 近全高 Sheet、Desktop 置中 Modal，皆無 horizontal overflow，Bottom Navigation 不遮擋內容。
  4. 關閉後畫面維持原 scroll position，不跳動、不回頁首。
  5. 切換不同持股的「詳細」，Dialog 內容正確對應該持股，無 stale 資料。
  6. Dialog 內封存已清倉成功後自動關閉，不留下 orphan modal。
  7. `test:ur-todo-070`／`test:ur-todo-071`／`test:ur-todo-072`／`test:ci`／`npx tsc -b`／`npm run build`／`git diff --check` 全數通過。

### UR-TODO-071 Holding Card Drag Reorder

- 優先級：P3（延續 UR-TODO-070，使用者明確核准開發）
- 狀態：**CLOSED（2026-08-19）／已完成、已 Merge、Production Verified**
- 完成日期：2026-08-19
- Merge 資訊：**PR [#397](https://github.com/hyc640110/family-universal-rebalance/pull/397)**，final head `78f44f5b0a55e50ff4c9d9fb845831dde3940649`，一般 2-parent merge commit `e39f8489e95bc90cf37e46e060f8250ef04d0573`（parents `5d45ccd55a1bd3ef357edefe5d7369f0f29a4e0b`／`78f44f5b0a55e50ff4c9d9fb845831dde3940649`），`mergedAt: 2026-08-19T14:27:33Z`，`mergedBy: hyc640110`，**未使用 admin override**。PR required CI Verification run [32262092171](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32262092171) success；相同 head 的 Preview workflow_dispatch run [32262111201](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32262111201) success，使用者已完成該 head 的 iPhone Safari Round 2 人工驗收，結論 PASS。merge 後 main push 觸發之 Deploy GitHub Pages run [32264138787](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32264138787) success，head 與 merge commit 一致，regression gate、Production build、Pages deploy 均 success。
- **iPhone Safari 人工驗收證據（Round 2，通過項目）**：first→last 長距離拖曳 PASS；last→first 長距離拖曳 PASS；正常卡片區上下 scrolling 不會誤排序；refresh 後 `holdingDisplayOrder` 正確保留；財務資料拖曳前後無異常；☰ 三橫線 drag handle 正確；handle 操作正常；Safari 無異常文字選取／長按選單；directional drag bug 已確認真機修復。
- **Production 唯讀驗證**：HTTP 200；bundle 更新為 `index-DTD1MPZn.css`／`index-YNeFg2N5.js`（與本次 build 產物一致）；console 無錯誤；`#/assets` 頁面 4 張 holding cards 皆為單一 ☰ handle（原生 `<button>`，`role` 為 `null`，非 menu/menuitem 語意）；`.holding-order-button` 舊控制項數量為 0；Desktop 1280px 實測 ☰ 位於整列最右側、詳細按鈕在其左側；1024px 維持 UR-TODO-070 既有、非本次引入的既存 overflow（未惡化）；390px 無 horizontal overflow。驗證全程僅用唯讀 DOM 查詢，未拖曳／未用 keyboard 排序 Production 使用者實際持股、未寫入 Production localStorage。
- **開發歷程：Round 1 → Round 2 iPhone Safari 修正**：
  - **Round 1**：初版實作（element-level `setPointerCapture`＋`GripVertical` 六點 icon）於 iPhone Safari Preview 人工驗收發現 2 項 blocking issue：(1) holding 由上往下長距離拖曳失敗（由下往上可正常）；(2) drag handle 圖示為六點 grip，不符合使用者核准的 ☰ 三橫線視覺要求。判定 Preview Manual QA = FAIL／Refinement Required。
  - **Root cause 定位**：原設計使用 element-level `setPointerCapture`。被 capture 的 button 在每一次 live-reorder 都會被 React 重新定位到新的 array index（DOM 位置實際改變，非移除重建）。Pointer Events spec 對「capture 元素被搬移（非移除）時是否保留 capture」屬 implementation-defined，Safari 相較 Chromium 更容易在元素重新定位時自動釋放 capture；一旦 capture 遺失，後續 `pointermove` 只能靠正常 hit-testing 路由——只有指標仍實際位於 handle「新」位置正上方才會觸發。短距離／相鄰交換較容易「運氣好」躲過此問題，但需要多次重新定位的長距離拖曳（如 first→last）幾乎必然中途失效，與回報的方向性不對稱現象完全吻合。已用真實 React + jsdom harness（fine-grained／batched／large-jump 三種指標移動模式）驗證純函式層（`moveHoldingDisplayOrderToIndex`／`resolveDragTargetIndex`）本身邏輯完全正確，排除 index-space 計算錯誤的可能性，確認問題出在瀏覽器 pointer capture 與 DOM repositioning 的交互。
  - **Round 2 修正**：`HoldingOrderHandle.tsx` 改用 `document` 層級的 `pointermove`／`pointerup`／`pointercancel` listener（`pointerdown` 時掛上、drag 結束／取消時卸除，並於元件 unmount 時保底清除），完全移除 `setPointerCapture`／`hasPointerCapture`／`releasePointerCapture`／`onLostPointerCapture` 的依賴；`document` 本身不會被搬移或移除，因此完全免疫於整類「被拖曳元素重新定位導致 capture 遺失」問題。Icon 由 `GripVertical`（六點）改為 `lucide-react` 既有已安裝的 `Menu`（3 條水平線，精確符合 ☰ 核准視覺）。
  - **Round 2 後驗證**：`npm run test:ur-todo-071`（41 tests）／既有 `npm run test:ur-todo-070`（25 tests）／完整 `test:ci`／`npx tsc -b`／`npm run build` 皆 pass；iPhone Safari 真機重新驗收 PASS（見上方 Round 2 通過項目）。
- **最終產品 Contract**：單一 ☰ drag handle 取代原 ↑/↓；Mobile／Desktop 共用同一套 interaction model（Desktop handle 為整列最右側獨立操作區，詳細按鈕在其左側；Mobile 與 identity 共用 header 第一列，不要求與 Desktop 相同視覺座標）；Native Pointer Events；Immediate Drag（無 long-press threshold）；第一版不做 auto-scroll；未新增 drag-and-drop dependency；Keyboard focus handle 後 ArrowUp／ArrowDown 沿用既有單步 `moveHoldingDisplayOrder()`；新增 `aria-live="polite"` 排序結果播報；`holdingDisplayOrder` 為唯一 ordering persistence，不重排 `AppState.holdings`、不 mutate `m.rows`、不改 Financial Event Ledger／attribution／Rebalance／AI Decision／Firebase／財務公式。
- **已知低風險 follow-up observation**：Final Review 發現 `HoldingOrderHandle` 的 `handlePointerDown` 未防護「同一 handle 在前一次 drag 尚未 end/cancel 前又收到第二次 pointerdown」的情境（例如同一 handle 上的多點觸控或極快速連續按下）；理論上可能造成該次 document listener 未被移除。實際影響評估為記憶體洩漏而非資料錯亂（洩漏的 listener 只會回應其已失效的舊 `pointerId`，不會影響排序正確性）。**目前無 Production／iPhone 實際失敗證據**，Round 2 真機驗收與 Production 唯讀驗證皆未觸發此情境；**目前無需另立新的 UR-TODO 編號**，後續若出現可重現問題再另行盤點。
- 新增測試：`tests/holdingCardDragReorder.test.ts`（純函式）、`tests/holdingOrderHandle.test.ts`（元件，含 document-level listener robustness 關鍵測試）、`tests/holdingCardDragReorderStructure.test.ts`（結構性回歸）、`tests/holdingCardDragReorderPersistence.test.ts`（persistence isolation），共 41 tests，已納入 `npm run test:ci`。
- 明確不包含：新增任何 drag-and-drop dependency；auto-scroll（第一版）；修改 `AppState.holdings`／Rebalance／AI Decision／Financial Event Ledger／attribution／成本／市值／損益／holding identity／Firebase／schema version。
- 依賴：UR-TODO-070（已 CLOSED，`holdingDisplayOrder` 基礎契約與 `HoldingCompactCard` 現行渲染路徑已具備）。
- 驗收條件（已達成）：使用者已完成兩輪 iPhone Safari Preview 人工驗收（Round 1 FAIL → Round 2 PASS），Draft → Ready → Merge 依既有治理流程逐步完成，Production 唯讀驗證通過。

---

**以下為 Contract Audit 階段歷史記錄（已由上方 CLOSED 條目取代，保留供追溯）**：

- 提出日期：2026-08-19
- Contract Audit 完成日期：2026-08-19（Review Mode 唯讀盤點）
- 背景：UR-TODO-070 完成並 Production Verified 後，使用者希望評估將現行兩顆 ↑/↓ 按鈕改為單一拖曳把手（drag handle），iPhone 長按／按住把手後可將整張持股卡向上或向下拖曳，放開後新順序寫入既有 `holdingDisplayOrder`。
- Contract Audit 核心結論（GO-with-conditions）：
  1. **資料契約層面風險極低**：現有 `normalizeHoldingDisplayOrder()`／`orderHoldingRows()` 可完全沿用不改動；`moveHoldingDisplayOrder()` 即使 UI 暫時不再呼叫也不需刪除（獨立純函式，仍可作為 keyboard reorder 的實作基礎）；persistence／localStorage／JSON Backup schema 完全不需要變更。只需新增一個純函式 `moveHoldingDisplayOrderToIndex(order, symbol, targetIndex)`（將 symbol 移動到任意 index、clamp 邊界、no-op 規則與現有兩個 helper 一致），即可承接 drag 的「移到任意位置」語意，且可完全獨立於 DOM/pointer 事件被單元測試。
  2. **技術方案**：推薦 **Native Pointer Events**（`pointerdown`/`pointermove`/`pointerup` + `setPointerCapture`），**不**使用 HTML5 Drag and Drop API（iOS Safari 觸控支援不可靠，行動端不可用）；**不**引入專用 sortable/drag library（repository 目前未安裝任何此類套件，新增 dependency 需另行授權，非本次範圍）。
  3. **iPhone Safari 風險點**：需 `touch-action: none` 僅套用在 handle（非整張卡片），避免拖曳與頁面滾動衝突；`setPointerCapture`／`releasePointerCapture` 確保手勢穩定；`user-select: none`／`-webkit-touch-callout: none` 抑制文字選取與 context menu；「頁面滾動是否確實不受影響」需真機驗證，無法只憑程式碼判斷。
  4. **Accessibility 明確要求**：若移除 ↑/↓，純 drag UI 對 keyboard／screen reader 使用者是明確的可用性倒退，**必須**保留等價的鍵盤可操作路徑（例如 handle focus 後方向鍵移動，或視覺隱藏但 accessible 的 fallback 控制），不得為了 UI 簡潔而犧牲 accessibility；此為 GO 的必要前提條件，非可選項。
  5. **Scope 判斷**：因涉及全新的 pointer 事件狀態機、accessibility 補救方案與 iOS Safari 真機驗證，風險與測試量明顯大於單純 CSS refinement，判定**不應**疊加進已收斂的 PR，另立獨立 Sprint／PR 較符合既有「每個 Sprint 一個獨立 PR」慣例與 reviewability。
- 已核准方向（供未來開發依循）：
  1. 取代視覺上的 ↑/↓ 為單一 drag handle（icon 可用既有已安裝的 `lucide-react` `GripVertical`／`GripHorizontal`，不需新增 dependency）。
  2. Native Pointer Events；只有 drag handle 本身可啟動 reorder，不得讓整張 `HoldingCompactCard` 都能觸發拖曳。
  3. `holdingDisplayOrder` 繼續作為唯一 display-order persistence；不重排 `AppState.holdings`；不改 `m.rows` 核心語意；不改任何財務計算。
  4. mobile + desktop 優先共用同一套 interaction model，但以安全與可用性為準，允許依實測結果調整。
  5. Accessibility 必須保留 keyboard／screen-reader reorder 能力（具體實作方式待下一輪開發前拍板）。
  6. iPhone Safari `touch-action`／pointer capture 須經真機 Preview 驗證，不得只憑桌面模擬器判斷完成。
  7. 第一版不做 auto-scroll（除非實測持股清單長度確實超出可視範圍）。
  8. persistence／Backup schema 不變；不新增 drag-and-drop dependency，除非未來另行明確核准。
- 待正式排入開發前需先拍板（不得由 AI 自行決定）：long-press threshold 數值（或確認 immediate drag 可接受）；desktop 是否與 mobile 共用同一 handle；keyboard reorder 的具體 UI 呈現方式（可見 fallback 按鈕／`sr-only` 隱藏控制／ARIA drag pattern 三擇一或其他）。
- 明確不包含：新增任何 drag-and-drop dependency（除非另行核准）；auto-scroll（第一版）；修改 `AppState.holdings`／Rebalance／AI Decision／Financial Event Ledger／attribution／成本／市值／損益／holding identity／Firebase／schema version。
- 依賴：UR-TODO-070（已 CLOSED，`holdingDisplayOrder` 基礎契約與 `HoldingCompactCard` 現行渲染路徑已具備）。
- 驗收條件（待正式排入時另訂，需先完成上述待拍板事項）

### UR-TODO-057 00631L 自動高點追蹤＋每跌 10% 階梯式加碼提醒

- 優先級：P2／待評估 → 開發時提升為使用者明確排入
- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成日期：2026-08-15
- Merge 資訊：採 Strangler Pattern 兩階段（比照 ADR-001）：
  - **子 PR 1（抽出階段）**：PR [#339](https://github.com/hyc640110/family-universal-rebalance/pull/339)，merge commit `2248453da13e2cc8a0d61326ab512df98162abaf`，一般 merge commit，**未使用 admin override**。新增完全獨立的純函式 `src/lib/dipLadderEngine.ts`（`deriveDipLadderUpdate()`），本階段不含任何 `AppState`／UI／quote 接線。
  - **子 PR 2（串接階段）**：PR [#340](https://github.com/hyc640110/family-universal-rebalance/pull/340)，merge commit `7704cf8f0610b003414b2ea664e0b9515f947df4`，一般 merge commit，**未使用 admin override**（此 PR 原疊在子 PR 1 分支上，子 PR 1 Merge 後因分支未刪除、GitHub 未自動轉換 base，已手動將 base 改回 `main` 後再 Merge）。
  - Deploy GitHub Pages run [31872010383](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31872010383) success，headSha 與最終 merge commit 一致；Production 已唯讀確認首頁「重點標的」卡片正確顯示 00631L 的「逢低加碼自動追蹤」區塊（高點／現價／回撤／觸發級別），既有卡片未受影響，console 無錯誤。
- 提出日期：使用者原始提出時間不明，2026-08-15 由 Claude Home Review 後正式登錄，同日重新定義範圍、唯讀盤點、定案開發並完成。
- **與最初草案的差異（明確記錄）**：最初草案僅為「波段最高價手動欄位改為市場創新高時自動更新」的單純欄位自動化構想。開發前使用者將需求正式重新定義為**完整的階梯式加碼機制**：不只是高點自動追蹤，還包含依回撤深度分級（每跌 10% 一級）、防重複觸發、新高重置整個週期、首頁呈現建議加碼金額（受資金資格限制）——範圍遠大於原始草案，因此沿用同一編號但整份規格重新定義，非草案的直接實作。
- **最終落地範圍**：
  1. **自動高點追蹤**：不沿用既有手動輸入的 `referencePrice` 欄位，改為獨立新欄位 `highWaterMark`（`number | null`）。啟用當下的第一筆合格報價即為初始高點基準（並非啟用當下就讀取任何舊資料），之後每筆合格報價 `price > 已記錄高點` 才更新，`price ≤ 已記錄高點` 高點維持不變。
  2. **回撤階梯**：跌幅門檻固定寫死每 10% 一級（不提供使用者自訂步階大小），新增獨立欄位 `triggeredLevel`（`number | null`）記錄這一輪高點週期已觸發到第幾級，只有級別前進才算新觸發，同級反覆震盪或局部反彈（未創新高）都不會重複觸發或倒退。
  3. **新高重置**：一旦（合格報價）創新高，`highWaterMark` 更新為新值，`triggeredLevel` 一併歸零，舊回撤週期正式結束。
  4. **報價品質過濾**：只接受 `quoteStatus` 為 `today` 或 `recent-trading-day`、非備援來源（`成交均價`／`備援`／`離線`字樣）、且為有限正數的報價才參與比對；不合格報價一律忽略、完全不更新任何狀態，比照既有 `rebalanceRecommendation.ts` 的保守處理慣例。
  5. **quote 更新橋接**：唯讀盤點確認 Repository 內**不存在自動輪詢機制**（無 `setInterval`），股價只在「頁面載入一次」與「使用者主動觸發（按鈕／下拉手勢）」時更新，三者共用同一套 `quoteRefreshController.ts` 寫入路徑；階梯比對掛在這個共用寫入路徑上（`App.tsx` 新增 `useEffect` 監聽 `quotes` 變化），涵蓋全部三個觸發時機，不特別排除任何一個。
  6. **首頁呈現**：合併進既有 UR-TODO-059「重點標的」卡片（`HomeFocusedAssetCard.tsx`）新增第二區塊，而非另開新卡片；顯示目前高點、現價、即時回撤；觸發時顯示第幾級與建議加碼金額（比照既有 013 §14.3 訊號與資金資格分開顯示原則，直接重用既有 `deriveDipFundingStatus()`／`householdLiquidityForRebalance.executableBudget`，未新增任何新金額公式）；未觸發時顯示距下一級門檻的百分比距離；`highWaterMark` 為 `null`（尚無合格報價）時顯示明確等待文案，不出現壞掉的畫面。
  7. **持久化 additive 相容性**：`DipAlertSetting` 新增 `highWaterMark`／`triggeredLevel` 兩個必要欄位（值可為 `null`），`normalizeDipAlertSetting()` 白名單同步擴充；既有 localStorage／JSON Backup 資料缺這兩個欄位時正規化為 `null`（視為「尚未啟用追蹤」，絕不會復活舊的手動 `referencePrice` 當作高點）。
- **技術落地**：新增 `src/lib/dipLadderEngine.ts`（純函式核心，19 個 characterization test，含開發中主動發現並修正的浮點數邊界 bug——剛好整數門檻的跌幅計算會因 JS 浮點誤差少算一級，已修正為四捨五入到小數點後 6 位再計算）；`src/lib/dipAlertEngine.ts` 新增橋接函式 `deriveDipAlertsAfterQuoteUpdate()`（9 個測試）；新增 `src/lib/homeFocusedAssetLadderCard.ts`（呈現邏輯純函式，11 個測試）；`HomeFocusedAssetCard.tsx`／`DashboardDecisionPage.tsx`／`App.tsx` 接線；既有 `tests/dipAlertRows.test.ts`／`tests/homeFocusedAssetCardUi.test.ts` 因型別 additive 擴充同步更新斷言（無行為變更）。
- **邊界情況實測驗證**：於 Preview 環境直接操作 localStorage 驗證——啟用追蹤＋報價更新正確初始化並持久化高點；00631L 從 `holdings` 陣列完全移除後 reload，既有 `normalizeDipAlerts()` 的 holdings-存在性過濾機制正確清空整筆 `dipAlerts` 記錄（含新欄位），首頁正確顯示防呆文案，無 undefined 或壞掉畫面。另有一則使用者回報「封存 00631L 無反應」的問題，經 Debug Trace（唯讀，未修改任何程式碼）逐層確認 execution path 完全正常、無例外、UI 正確更新，判定與本輪新增邏輯無關，為瀏覽器 `window.confirm()` 連續觸發防護機制的巧合（使用者重新整理後單獨測試 00631L 確認恢復正常，已排除）。
- 明確不包含：使用者可自訂步階大小；修復既有 `DipAlertCard`／`thresholdPct` 手動編輯入口缺口（已確認本次不需要）；任何自動下單或自動調整持股邏輯；Firebase（已退役，無需考慮）。
- 依賴：UR-TODO-059（已 CLOSED，首頁「重點標的」卡片結構基礎已具備）；既有 `dipAlertEngine.ts`／`householdLiquidity.ts`（`deriveDipFundingStatus()`／`executableBudget` 皆直接重用，未修改）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（自動追蹤、階梯觸發、新高重置、首頁呈現、封存流程無關聯問題排除），Production 唯讀確認功能與既有首頁區塊皆正常。

### UR-TODO-058 Excel 三策略再平衡模擬比較

- 優先級：P1／待評估（使用者要求拉高優先） → 開發時正式排入
- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成日期：2026-08-15
- Merge 資訊：**PR [#345](https://github.com/hyc640110/family-universal-rebalance/pull/345)**，merge commit `234fe137c017adef3536b892ac025afe1d445890`，一般 merge commit，**未使用 admin override**。Deploy GitHub Pages run [31880137982](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31880137982) success，headSha 與 merge commit 一致；Production 已唯讀確認 `/#/tools/investment-backtest` 正確顯示三策略模擬比較（萬元單位），既有功能未受影響，console 無錯誤。
- 提出日期：使用者原始提出時間不明，2026-08-15 由 Claude Home Review 後正式登錄，同日補件、唯讀盤點、範圍修正並完成開發。
- **資料來源**：使用者提供之 EP04-02-大道至簡投資法-資產配置與再平衡-G1_2_5_865B_再修改.xlsx，經 Claude Home 完整解析核心邏輯後，由使用者確認轉換為正式規格。
- **與最初條目的範圍差異（明確記錄，避免未來誤讀）**：最初登錄時標題為「導入 CLEC」，隱含要把 Excel 演算法接進正式 CLEC 策略引擎（`clecStrategyRules.ts`）的假設。開發前使用者明確修正定位：**這是純粹的模擬／比較工具，不寫入或影響使用者實際的資產配置、目標權重，也不接進任何會影響「是否可執行」判斷的正式 CLEC 引擎（`clecStrategyRules.ts`／`rebalanceExecutionEligibility.ts`）**，性質上更接近既有 `AllocationSimulatorPage.tsx`（假設情境模擬器），而非正式決策引擎的延伸。條目標題與範圍已依此修正版定位重新定案。
- **最終落地範圍**：
  1. **獨立新頁面**：`/tools/investment-backtest`，啟用既有 `toolNavigation.ts` 內原本待規劃的 `investment-backtest` 佔位項目（補上路由與正式描述文字），未另立新 tool id。
  2. **三套純函式**（`src/lib/rebalanceStrategyComparison.ts`）：
     - **聰明再平衡**：依「期間漲跌 = 目前市值(00631L) − 期初市值 − 期間買進金額」動態決定調整金額，賺錢時賣出 00631L（期間漲跌 × 上漲平衡%，預設 30%）轉入 00865B，賠錢或持平時用固定下跌平衡金從 00865B 轉入 00631L，0050 不受影響。**Excel 作者本人不推薦此策略，但使用者明確要求三套都要並列顯示（含此策略），供自行比對，不做任何排序或推薦標示。**
     - **無腦再平衡**（Excel 作者推薦）：只在 00631L／00865B 之間，依兩者目標權重「彼此之間」的比例（renormalized）互換，0050 不受影響。
     - **比率再平衡**：三檔資產全部依目標權重（× 總市值 − 目前市值）收斂。
  3. **Beta 曝險**：session-only 狀態，使用者為每檔資產輸入槓桿倍數假設值（例如 0050→1、00631L→2、00865B→0），純顯示「目前 Beta vs 目標 Beta」，**不重用或修改 `App.tsx` 既有寫死的正式 `m.beta` 指標**（`calculateMetrics()` 內單獨判斷 00631L 的既有硬編碼公式，本次完全未觸碰）。
  4. **金額單位**：假設情境輸入欄位與結果顯示統一為萬元，重用既有 `src/lib/cashFlow.ts` 的 `yuanToWan()`（顯示）／比照 `wanToYuan()` 的 ×10000 換算慣例（輸入，但刻意保留負數不被吃成 `null`，確保驗證訊息仍能觸發），不另外發明新的單位轉換邏輯。
  5. **純模擬工具治理**：所有時間序列輸入（期初市值、期間開始／結束日期、期間買進金額）一律為使用者手動輸入的假設值，不從 `netWorthHistory`／交易紀錄自動帶出（唯讀盤點階段已確認技術上也有資料缺口——不存在單一 symbol 的逐日市值歷史）。
  6. **UI 明確標示模擬性質**：三策略並列呈現時不用顏色標示「最佳」、不排序成第一名／第二名；不出現 `ClecRuleSummaryCard`／`rebalance-eligibility` 那類正式決策用語與徽章樣式；每張策略卡片皆有「比較用，非系統推薦」字樣。
  7. **輸入防呆**：市值／期初市值／期間買進金額／下跌平衡金為負、上漲平衡% 超出 0～100、日期區間顛倒皆會阻擋結果顯示並提示具體錯誤訊息。
- **技術落地**：新增 `src/lib/rebalanceStrategyComparison.ts`（三套公式＋Beta 計算＋驗證函式，18 個 characterization test）、`src/pages/RebalanceStrategyComparisonPage.tsx`（獨立頁面，完全不讀取 `AppState`／`Holding`／quotes）；既有 `tests/toolNavigation.test.ts`／`tests/toolNavigationConsistency.test.ts` 因 `investment-backtest` 從佔位項目轉為正式路由，同步更新硬編碼順序清單與一致性檢查涵蓋範圍。
- 明確不包含：模式 4、5（新資金分配邏輯）；`clecStrategyRules.ts`／`rebalanceExecutionEligibility.ts`／`rebalanceRecommendation.ts` 任何修改；`App.tsx` 既有正式 Beta 指標修改；從 `netWorthHistory`／交易紀錄自動帶出真實歷史資料；`AllocationSimulatorPage.tsx` 本身邏輯修改（僅重用其 CSS／視覺慣例，未修改該檔案）。
- 依賴：無（純模擬工具，與既有 CLEC／Household Liquidity／正式持股體系完全獨立）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收，含萬元單位調整後的重新驗收——確認三套策略在有偏離的假設情境下正確顯示不同買賣建議（無腦再平衡僅動 00631L／00865B、比率再平衡三檔皆動、聰明再平衡依期間漲跌動態計算），Production 唯讀確認功能與既有頁面皆正常。

### UR-TODO-059 首頁 30 秒決策中心接上真實金額（鎖定 00631L）

- 優先級：P0
- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成日期：2026-08-15
- Merge 資訊：**PR [#337](https://github.com/hyc640110/family-universal-rebalance/pull/337)**，merge commit `f1434a5b4b69a5242ff4680f4f1de6313b15f8bd`，一般 merge commit，**未使用 admin override**。Deploy GitHub Pages run [31868249584](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31868249584) success，headSha 與 merge commit 一致；Production 已唯讀確認首頁最上方「重點標的」卡片正常顯示、既有 4 張既有首頁卡片未受影響，console 無錯誤，未在 Production 建立任何測試資料。
- 提出日期：2026-08-15（Repository Explore 唯讀盤點確認缺口日）
- 背景：既有唯讀盤點（Repository Explore，2026-08-15）已確認 `investableCash`（`src/lib/householdLiquidity.ts`）、逐檔 `recommendedAmount`（`src/lib/rebalanceRecommendation.ts`）等運算能力已存在且已測試，僅未接上首頁 `DashboardDecisionPage.tsx` 呈現層。
- 與 UR-TODO-030 的關係：UR-TODO-030（首頁「重要提醒」重複性盤點，含 2026-07-26／2026-07-29 首頁改版方向討論記錄）已於 2026-08-07 正式 CLOSED（PR #268），處理的是首頁區塊搬移與版面精簡；本項是在 030 已完成的「30 秒決策中心」結構基礎上，新增「把既有已測試運算結果接上金額呈現」這個結構未涵蓋的新缺口，範圍不同，**不合併入已結案的 030，另立新編號**。
- **最終落地範圍（與原始候選 #1 草案的差異，明確記錄）**：開發前使用者明確確認目前僅投入 00631L（不會買其他股票），原候選 #1「顯示最偏離的 1-2 檔資產」的通用排序邏輯不適用於此情境，**範圍正式調整為單一標的鎖定顯示**——首頁最上方新增「重點標的」區塊，固定顯示 00631L 的：可投入現金（`householdLiquidity.ts`）、目前配置比例 vs 目標比例（偏離幅度）、觸發再平衡門檻時來自 `rebalanceRecommendation.ts`／`getOrderSuggestions()` 的建議投入／賣出金額；未觸發門檻則顯示「目前配置正常，不需操作」，不顯示金額。點擊可導向 `/tools/rebalance-recommendation`。若使用者未來將 00631L 從目標配置中移除，有明確防呆訊息，不出現壞掉的 UI 或 undefined。
- 技術落地：新增 `src/lib/homeFocusedAssetCard.ts`（純函式 `deriveHomeFocusedAssetCard()`，只選取／格式化既有 `rebalanceRecommendation.ts`／`householdLiquidity.ts` 輸出，**未新增任何再平衡演算法**）與 `src/components/HomeFocusedAssetCard.tsx`；`DashboardDecisionPage.tsx` 的 `DashboardData` 型別新增 `focusedAssetCard` 欄位（僅新增，未修改既有欄位語意）；`todayDecision.ts` 既有單一結論字串邏輯完全未觸碰。新增 13 個測試（`tests/homeFocusedAssetCard.test.ts` 8 項純函式 characterization：偏離有建議金額、未達門檻正常文字、`investableCash` 為 0／`null` 邊界、00631L 從配置移除的防呆；`tests/homeFocusedAssetCardUi.test.ts` 5 項元件渲染驗證）。
- 明確不包含：多檔排序／「最偏離的 1-2 檔資產」通用邏輯（範圍已鎖定 00631L）；任何新演算法；schema／persistence／Financial Event Ledger／attribution／Firebase 修改；`todayDecision.ts` 既有結論邏輯修改。
- 依賴：UR-TODO-030（已 CLOSED，首頁「30 秒決策中心」結構基礎已具備）；既有已測試 calculator `householdLiquidity.ts`／`rebalanceRecommendation.ts`（無需修改，僅消費既有輸出）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（00631L 卡片位置、數字正確性、連結導向、既有 4 張卡片未受影響、手機版排版正常），Production 唯讀確認功能與既有首頁區塊皆正常。

### UR-TODO-060 信用卡每月繳費提醒

- 優先級：P3／待評估
- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成日期：2026-08-15
- Merge 資訊：**PR [#335](https://github.com/hyc640110/family-universal-rebalance/pull/335)**，merge commit `c5c15689b1cc69d1f0898de0667880e99f3faf1b`，一般 merge commit，**未使用 admin override**。Deploy GitHub Pages run [31866637716](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31866637716) success，headSha 與 merge commit 一致；Production 已唯讀確認「信用卡繳費提醒」區塊正常顯示（`0 張信用卡｜0 筆即將到期`），未在 Production 建立任何測試資料，console 無錯誤。
- 提出日期：使用者原始提出時間不明，2026-08-15 由 Claude Home Review 後正式登錄，同日唯讀盤點（範圍評估）、定案開發、多輪範圍調整並完成。
- **最終落地範圍**：
  1. **B1 提醒機制**：`CreditCardItem` 主檔 CRUD（比照既有 `LoanItem` 模式），欄位為 `id`／`name`／`paymentDueDay`／`linkedAccountId?`／`note?`／`acknowledgedCycleDueDate?`／`asOf?`。純函式 `deriveCreditCardDueSoonReminders()`（`src/lib/creditCardReminders.ts`）計算「繳費日前 3 天」的到期提醒，正確處理短月夾註（29/30/31 日）與跨年月邊界。
  2. **每期完成／未確認狀態機**：每個繳費週期以該週期夾緊後的到期日字串為識別碼（比照 Loan `confirmationGroupId` 概念，但完全獨立於 FinancialEvent／Ledger，純提醒顯示狀態）。繳費日前 3 天出現提醒；使用者按「完成」後該週期立即消失；未按「完成」則持續顯示為「已逾期」，不會自動消失；下個月週期進入自己的 3 天視窗後自動重新出現，不受上次是否按過「完成」影響。**設計決策**：若連續多期未確認，一律只顯示「相對今天最近一次相關的週期」，不會累積成多筆逾期清單（因無金額，無「積欠幾期」概念）——已與使用者確認此設計符合預期。
  3. **關聯帳戶（方案 B）**：「關聯帳戶」為表單第一欄位，選擇帳戶後「名稱」欄位隱藏、直接以帳戶名稱作為顯示名稱；未選擇時使用手動輸入名稱，兩者皆空時顯示「未命名信用卡提醒」防呆文字。可選帳戶類型為**銀行＋信用卡**兩種（`src/lib/creditCardReminders.ts` 的 `deriveCreditCardAccountOptions()`），因應「多張實體卡合併由銀行帳戶扣款」的實際使用情境。若 `linkedAccountId` 指向的帳戶已被刪除，選單會動態插入「已刪除的帳戶（原連結）」防呆選項（如實反映底層資料，避免瀏覽器原生 `<select>` 因值不匹配而誤顯示「不指定」造成資料誤解讀或誤清除），使用者需主動選擇「不指定」才會真正清空連結。
- **與最初 B1 草案的差異（明確記錄，避免未來誤讀為與草案規格一致）**：
  1. 草案原包含「本期應繳金額」欄位（手動輸入），**開發中途應使用者要求整個移除**，最終版本純粹是日期提醒，不含任何金額欄位或金額顯示。
  2. 草案原始行為為「單次提醒、無確認機制」，**開發完成後應使用者要求新增「完成」確認機制與每期獨立狀態追蹤**（上述第 2 點），為草案沒有的全新設計。
  3. 「關聯帳戶」欄位原本是草案唯讀盤點階段就存在的選配欄位，但一度因「目前用不到」被隱藏 UI；後續應使用者要求重新提升為主要識別方式（方案 B）並放寬可選帳戶類型（原僅信用卡 → 銀行＋信用卡），為多輪迭代後的最終定案，與最初草案的欄位定位不同。
- 明確不包含：從交易記錄自動偵測／加總信用卡消費金額（B2，未實作）；信用卡專屬交易 taxonomy 或歸因型別；使用者可自訂提醒天數（固定 3 天）；FinancialEvent／Ledger／attribution 任何修改。
- 驗收條件（已達成）：Preview 與 Production 皆已驗收，涵蓋基本提醒流程、完成按鈕、逾期顯示、關聯帳戶銀行／信用卡篩選、已刪除帳戶防呆、手機版排版。

### UR-TODO-069 退休規劃固定支出卡片精簡＋刪除圖示防誤觸

- 優先級：P3（退休規劃頁面既有卡片在手機滑動距離過長，使用者拍板精簡布局）
- 狀態：**CLOSED／Production Verified（2026-08-17，治理同步修正——本段落狀態欄位先前未隨頁首 2026-08-17 CLOSED 條目同步更新，已於本輪 Backlog Consistency Closeout 校正）**。PR [#373](https://github.com/hyc640110/family-universal-rebalance/pull/373) 手機版 follow-up 已以一般 2-parent merge commit `23416db7e575cbbac38abb67f3b72d94d9d28d74` 合併（mergedAt `2026-08-16T13:17:12Z`，mergedBy `hyc640110`）；PR verify [31948775856](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31948775856) success，merge 後 main Deploy GitHub Pages [31949386977](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31949386977) completed/success，head 與 merge commit 一致；後續 PR #379 已完成本項 closeout governance sync。詳見頁首 2026-08-17 條目，本 Todo 無剩餘項目。
- 提出日期：2026-08-16
- 範圍：
  1. 固定支出卡片統一改為單欄：頂端工具列左側為「計入支出」勾選框，右側為既有 `lucide-react` `Trash2` 圖示按鈕；項目名稱與每月金額各自維持全寬獨立列，不以桌機／手機斷點分流。
  2. 圖示按鈕有中文 `aria-label`／提示文字，桌機與手機皆為至少 44×44px；以工具列 `justify-content: space-between` 與 16px gap 保持與勾選框分離，降低誤觸。
  3. `removeItem()` 的草稿資料過濾邏輯不變，不回寫 `cashFlowProfile`；依驗收條件在按鈕 handler 補上刪除確認，取消不修改草稿、確認才呼叫既有 handler。
  4. 更新 `retirementPlannerPage.test.ts`：鎖定圖示按鈕可存取名稱、頂端工具列結構、確認後刪除與取消保留行為。
  5. 手機版 follow-up 僅在 `max-width:768px` 將共用勾選 label 明確設為 `flex-direction:row; white-space:nowrap`，使完整「計入支出」與勾選框同列；桌機布局與文字均維持原樣。
- 明確不包含：退休試算公式、`retirementPlan` schema／localStorage／JSON Backup、Cash Flow 匯入／覆蓋邏輯、任何核心財務資料、其他頁面或圖示庫依賴。
- 驗收條件：桌機與 390px 手機皆顯示同列勾選框／刪除圖示，名稱與金額各自全寬、無水平溢出；圖示按鈕保持 44px 觸控區、確認對話框出現、取消不刪除且確認後正確刪除；TypeScript、完整 CI、Production／Preview build 與 Preview 人工驗收均通過。

### UR-TODO-070 持股資產卡片 Mobile Compact + Manual Ordering

- 優先級：P3（使用者提出，持股資產卡片手機版資訊密度與可讀性優化）
- 狀態：**CLOSED（2026-08-19）／已完成、已 Merge、Production Verified**
- 完成日期：2026-08-19
- 提出日期：2026-08-19（先前未正式登錄於本檔案，本次治理同步一併補登為正式條目）
- Merge 資訊：**PR [#395](https://github.com/hyc640110/family-universal-rebalance/pull/395)**，final head `9110d78967ab14fa9c3357ad3f33729f4b391c0e`，一般 2-parent merge commit `ddb019bb1ef9999d9b2a230e0d8dfed9d941fabd`（parents `e66d909696635d28534d3665fc49b3108e2bc6df`／`9110d78967ab14fa9c3357ad3f33729f4b391c0e`），`mergedAt: 2026-08-19T12:30:04Z`，`mergedBy: hyc640110`，**未使用 admin override**。PR required CI Verification run [32163151324](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32163151324) success；相同 head 的 Preview workflow_dispatch run [32163158998](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32163158998) success，使用者已完成該 head 的 iPhone Preview 人工驗收（320／390／430px、Desktop），結論 PASS。merge 後 main push 觸發之 Deploy GitHub Pages run [32252977963](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32252977963) success，head 與 merge commit 一致，regression gate、Production build、Pages deploy 均 success。
- 契約範圍：
  1. 新增 root-level `holdingDisplayOrder: SymbolCode[]`，**僅**控制資產頁 active holding cards 的顯示順序；純函式 `normalizeHoldingDisplayOrder()`／`moveHoldingDisplayOrder()`／`orderHoldingRows()`（`src/lib/holdingDisplayOrder.ts`）：active only、排除 archived、排除無效／重複 symbol、缺少的現行持股按 `holdings` 原順序 append、deterministic、不 mutate 輸入。
  2. 每張持股卡片新增 ↑/↓ 手動排序按鈕；首筆 ↑ disabled、末筆 ↓ disabled、單一持股時兩者皆 disabled。第一輪 iPhone Preview 人工驗收後，依使用者回饋將按鈕由垂直堆疊調整為水平排列（34×34px，`margin-left:auto` 固定於卡片標題列右側），維持合理 touch target。
  3. Persistence 全面 additive 接入：`AppState`、`defaultState`、`normalizeState()`、localStorage、`backupPayload()`、`stateFromBackup()`；舊 JSON Backup 缺少此欄位時 fallback 為 imported holdings 原始順序，**不**沿用匯入前本機偏好（`stateFromBackup()` 明確 `holdingDisplayOrder: r.holdingDisplayOrder`，不 `?? current.holdingDisplayOrder`）。
  4. Mobile（≤768px）compact 卡片版面改為「標題+↑/↓ ／ 股數|詳細 ／ 現價|今日漲跌 ／ 市值|未實現損益」，透過 CSS `order` 屬性重排既有 DOM 元素順序（`.holding-card-shares{order:1}` 等），不改動 JSX 順序、不影響 desktop 既有 8 欄 grid 佈局。
- 明確不包含：重排 `AppState.holdings` 本身；`Holding` 型別新增 `sortOrder`；改動 `m.rows` 核心順序、Rebalance、AI Decision、成本／市值／損益計算、Financial Event Ledger、attribution、Firebase；drag-and-drop 或任何自動排序；schema version 變更。
- 技術落地：新增 `tests/holdingDisplayOrder.test.ts`（17 個純函式測試，涵蓋 normalize 的 undefined／空陣列／重複／無效／archived／缺漏補齊／有效偏好／deterministic，move 的 up／down／首末筆 no-op／單一持股 no-op，orderHoldingRows 的重排／補齊／isolation）、`tests/holdingDisplayOrderPersistence.test.ts`（4 個 persistence round-trip 測試，含舊 Backup fallback 與 archived 排除），並更新 `tests/v6AssetsCardInformation.test.ts` 反映 mobile layout 由 `grid-column:1/-1` 改為 `order:1` 的既有測試斷言。新增 `npm run test:ur-todo-070`（25 tests）並接入 `test:ci`。`npx tsc -b`、`npm run build`、完整 `test:ci` 均成功。
- Production 唯讀驗證：HTTP 200；bundle 更新為 `index-CbtuJHeC.css`／`index-SJ4eVLkB.js`（與本次 build 產物一致）；CSS 內容確認含 `.holding-order-button`／`.holding-order-controls{flex-direction:row...}`／`.holding-card-shares{order:1}`；`#/assets` 頁面 4 張 holding cards、8 顆排序按鈕正確渲染；390px 實測 identity 單列顯示、無 horizontal overflow；console 無錯誤。驗證全程僅用唯讀 DOM 查詢（`querySelector`／`getBoundingClientRect`），未點擊任何 ↑/↓ 或詳細按鈕，未寫入 Production 使用者實際資料。
- 驗收條件（已達成）：使用者已完成 Preview 環境 iPhone 人工驗收（320／390／430px、Desktop）並回報 PASS，Draft → Ready → Merge 依既有治理流程逐步完成，Production 唯讀驗證通過。

### UR-TODO-068 退休規劃頁面「匯入項目」新增刪除功能

- 優先級：P3（使用者驗收退休頁面時發現既有限制，同日盤點、拍板並完成開發）
- 狀態：**CLOSED（2026-08-16）／已完成、已 Merge、Production Verified**
- 完成日期：2026-08-16
- Merge 資訊：**PR [#370](https://github.com/hyc640110/family-universal-rebalance/pull/370)**，一般 merge commit `c7aba5f91bbd024eafdc88bdd9fbf18128dada26`（parents `b8626d9fac5e991b272b2a2394ab34a462ea0317`／`04c099290941e70e01937b8d4efb9341c828ab63`），**未使用 admin override**（`mergeStateStatus` 為 `CLEAN`，使用者親自於 Preview 驗收通過後執行 Merge）。main push 觸發之 Deploy GitHub Pages [run 31939740957](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31939740957) success。Production 已唯讀確認：HTTP 200；重新以合併後 commit 本機建置，`dist/assets/index-CeGxvZna.js` 與正式部署站台下載的 bundle **逐位元組（byte-for-byte）比對完全一致**；首頁 console 無錯誤，既有功能正常載入，未於正式站台輸入任何測試資料。
- 提出日期：2026-08-16
- 背景：使用者回報 `/tools/retirement-planner` 固定支出清單中，透過「從現金流匯入」複製進來的項目（例如中嘉寬頻+TV、遠傳、機車保養）只有「計入支出」勾選框，沒有刪除按鈕，無法整筆從清單移除；只有透過「新增自訂項目」加入的項目才有刪除按鈕。Repository 唯讀盤點確認此為 UR-TODO-066 建立當下即存在的既有行為（`draft.customFixedExpenseIds.includes(item.id)` 條件式渲染，只有自訂項目 id 落在此陣列內才顯示刪除按鈕），非後續 commit 造成的回歸；PR #366 說明、`008_TODO_BACKLOG.md` UR-TODO-066 正式條目與既有測試皆未記載此為刻意設計，判定為未妥善考慮匯入項目管理情境的既有缺口，經使用者拍板後補上功能。
- 最終落地範圍：
  1. 移除刪除按鈕的 `customFixedExpenseIds` 條件式渲染，改為每筆項目（不分匯入或自訂來源）皆顯示「刪除」按鈕，視覺樣式與位置與既有自訂項目刪除按鈕完全一致（同一個 `danger small` class、同一個位置）。
  2. `removeCustomItem` handler 更名為通用的 `removeItem`，邏輯不變（同時從 `fixedExpenses` 與 `customFixedExpenseIds` 移除該 id；對匯入項目而言後者本來就不含該 id，過濾為 no-op，安全通用）。刪除行為與既有自訂項目刪除完全一致：只影響 `draft.fixedExpenses`（本頁草稿本身），不回寫 `cashFlowProfile`，Cash Flow 頁面固定支出清單完全不受影響，維持既有「調整只會儲存於本退休規劃，不會回寫現金流設定」原則不變。
  3. 「從現金流匯入」確認對話框文字更新為明確點名可能重新出現：「此動作將覆蓋目前已輸入的項目並重新載入現金流全部固定支出，先前在此清單中刪除的項目可能會重新出現，是否繼續？」（使用者於開發前盤點階段拍板選擇的完整版文案）。
- 開發前唯讀盤點確認的既有行為（供未來參考）：
  1. **匯入邏輯本來就是整份覆蓋**（`fixedExpenses: importedPlan.fixedExpenses` 直接取代整個陣列，`customFixedExpenseIds` 同時重設為 `[]`），不會記得先前刪除過哪些匯入項目——確認刪除某匯入項目後若再次按「從現金流匯入」，該項目會重新出現。此為既有行為，非本次新增刪除功能才產生的新問題，已透過上述對話框文案更新明確提醒使用者。
  2. `calculateRetirementPlan()` 的 `monthlyFixedExpenses` 每次直接對當下 `draft.fixedExpenses` 陣列 `reduce()`，刪除項目不會有殘留資料或計算落後風險，已於本機 Preview 實機驗證刪除後金額正確重新計算。
- 技術落地：更新 `tests/retirementPlannerPage.test.ts`，新增 3 項測試（匯入項目顯示刪除按鈕且刪除後清單與每月小計正確重新計算、自訂與匯入項目刪除按鈕 class 與行為完全一致、刪除匯入項目後再次匯入會重新出現且對話框文字正確），並更新既有 2 項測試對新確認對話框文字的斷言。`npx tsc -b`、`npm run test:ci`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。本機 dev server 桌機與 390px 手機皆已實機驗證：匯入項目與自訂項目刪除按鈕視覺一致（`danger small`）、點擊後正確移除且無殘留、390px 無水平溢出、Cash Flow 頁面固定支出清單（localStorage `cashFlowProfile.fixedExpenses`）完全不受影響、console 無錯誤。
- 明確不包含：`cashFlowProfile.fixedExpenses`／`CashFlowPage.tsx` 的既有邏輯；`AppState.retirementPlan` 資料結構本身（僅移除陣列元素，未新增欄位）；匯入邏輯改為合併式（保留使用者刪除紀錄）——維持既有整份覆蓋設計，僅補強提醒文案。
- 驗收條件（已達成）：使用者已於 Preview 環境完整驗收（匯入項目與自訂項目刪除按鈕視覺一致、點擊後正確移除、Cash Flow 頁面不受影響、桌機與手機版皆正常），驗收通過後由使用者親自執行 Merge，Production 唯讀確認功能與既有頁面皆正常。

### UR-TODO-067 DraftInput 共用元件——顯示 0 時輸入被附加而非取代

- 優先級：P3（使用者於驗收 UR-TODO-066 過程中發現既有缺陷，同日盤點、定案並完成開發）
- 狀態：**CLOSED（2026-08-16）／已完成、已 Merge、Production Verified**
- 完成日期：2026-08-16
- Merge 資訊：**PR [#368](https://github.com/hyc640110/family-universal-rebalance/pull/368)**，一般 merge commit `b4d13eb1466d1ec2dee99b140f2a2fc083a96e33`（parents `c4c35962a5b9cf33fa9201c6925d978077af3df8`／`34268d1a4c9afa1e7d4e3545f156f283c9b591a3`），**未使用 admin override**（`mergeStateStatus` 為 `CLEAN`，使用者親自執行 `gh pr merge 368 --merge`）。PR CI Verification `31933131406` success；main push 觸發之 Deploy GitHub Pages `31933735266` success。Production 已唯讀確認：HTTP 200；重新以相同 commit 本機建置後與正式部署的 `assets/index-BDKSxSb6.js` 逐位元組（byte-for-byte）比對完全一致，證實修正已包含於正式站台；既有頁面（首頁）console 無錯誤、既有功能正常載入。
- 提出日期：2026-08-16
- 背景：UR-TODO-066（退休提領規劃）驗收過程中，使用者發現金額輸入框「顯示 0 時輸入新數字會附加而非取代」的問題（例如輸入 `2` 變成 `02`，再輸入 `2` 變成 `022`，失焦後被解析成 `22`）。Repository 唯讀盤點確認退休頁面本身的輸入元件已在 PR #366 修正，但全站共用元件 `DraftInput`（`src/App.tsx`）存在同類、範圍更廣的既有缺陷，且完全沒有對應防呆——`onFocus` 只設定 editing 狀態，未清空顯示的字面 `"0"`。
- 最終落地範圍：
  1. `DraftInput`（`App.tsx:991-1004` 一帶）`onFocus` 新增判斷：目前顯示值字面等於 `'0'` 時清空 draft，讓使用者接下來輸入的數字直接取代，而非附加在 `0` 後面。手法比照先前 PR #366 修正 `CashFlowPage`／`RetirementPlannerPage` `YuanField` 的既有做法。
  2. 非零值取得焦點不受影響（既有「選取全部後重新輸入」等編輯行為維持不變）；清空後失焦的既有回退行為（回到 `0`）也不受影響。
  3. 新增 `tests/draftInputZeroValueFocus.test.ts`（已納入 `test:ci`）：直接針對 `DraftInput` 函式本體做 source-level characterization test（`readFileSync`＋regex，比照 `v6DataRefreshMobileFormStability.test.ts` 等既有對 `App.tsx` 內部元件的測試慣例——`App.tsx` 及其依賴鏈讀取 `import.meta.env.*`，只有透過 Vite 才會被注入，全專案沒有任何測試檔案直接 `import` `App.tsx`），確認：(a) `onFocus` 內含清空字面 `'0'` 的判斷式；(b) 判斷式只針對字面 `'0'`，不會誤清空其他非零值；(c) 目前至少 9 個既有呼叫點皆共用同一個 `DraftInput`，證明修正不需要、也不應該逐一在呼叫端補丁。
- 影響範圍（唯讀盤點確認並逐項於本機 Preview 瀏覽器實測）：
  - 帳戶餘額（8 種帳戶類型：現金／銀行／證券／信用卡／貸款／房貸／電子錢包／其他）：8 項全數實測修正生效
  - 持股「總股數」「成交均價」：實測修正生效；「波段最高價」確認因 `value={... || ''}` 恆不顯示字面 `0`，本來就不受影響
  - 逢低提醒卡片「參考價」「跌幅門檻」（`DipAlertCard`）：**無法在瀏覽器實測**——全庫搜尋確認此元件目前沒有任何 JSX 呼叫點，屬既有未串接的 dead code，UI 無法到達；程式碼層級的修正仍涵蓋（同一個 `DraftInput`），若未來接上此卡片會自動繼承修正
  - 「只買不賣可用加碼預算」：實測修正生效
  - 「股價更新間隔秒數」：因欄位有 `min=60` fallback、實務上不會顯示字面 `0`，仍驗證一般編輯（選取＋輸入）不受影響
- 明確記錄：此為單一共用元件的加法式修正（僅新增 `onFocus` 防呆邏輯），不影響任何底層資料結構、Financial Event Ledger、attribution、persistence schema 或計算邏輯；過程中未發現「0 接字」以外的其他既有輸入異常。
- 明確不包含：`DipAlertCard` 串接為可達 UI（獨立未評估項目）；任何個別欄位層級的補丁（改為修正共用元件本身）；PR #366（已獨立 CLOSED）範圍。
- 驗收條件（已達成）：使用者已完成跨頁面 Preview 驗收（資產頁帳戶管理多種帳戶類型、持股資產頁、逢低提醒設定、加碼預算、設定頁），確認修正生效且既有正常編輯行為不受影響；TypeScript、完整 `test:ci`、Production／Preview build、`git diff --check` 皆成功；Production 唯讀驗證（HTTP 200、bundle 內容比對、console 無錯誤）。

### UR-TODO-066 退休提領規劃（retirement-planner）

- 優先級：P2（使用者確認需求與資料契約後正式開發）
- 狀態：**CLOSED（2026-08-16）／已完成、已 Merge、Production Verified**
- 完成日期：2026-08-16
- Merge 資訊：**PR [#366](https://github.com/hyc640110/family-universal-rebalance/pull/366)**，一般 merge commit `83223498afb196179f24f66c7f3009644e006765`，未使用 admin override；PR CI Verification `31931191149` success，main Deploy GitHub Pages `31931698419` success，head SHA 與 merge commit 一致。Production HTTP 200／`environment=production`；退休頁、工具導覽與既有功能 smoke check 均正常，console 無產品 error。
- 提出日期：2026-08-16
- 背景：使用者提供具體參考設計截圖（4% 法則 FIRE 計算器）；Repository 唯讀盤點確認 `wealthGoal.ts` 已有可重用的月複利年金反推公式 `calculateRequiredMonthlyContribution()`，現金流固定支出清單也已有「props 正式資料 → 本地 draft → 不自動寫回」慣例可沿用。
- 最終落地範圍：
  1. 新增 `/tools/retirement-planner` 頁面：每月經常性開銷、年度大額開銷、年提領率滑桿（1%～20%，預設 4%）、目標退休金（FIRE）、目前達成率、退休年限與預期年化報酬滑桿，以及反推每年／每月需投入與免責文字。
  2. 自訂每月支出上限為 10；現金流固定支出以「從現金流匯入」主動按鈕複製至退休草稿，已有草稿項目時先確認覆蓋，來源無資料時明確提示，不回寫 `cashFlowProfile`。
  3. 新增加法式 `AppState.retirementPlan` 持久化（fixed expenses draft、旅遊／保險年度大額支出、提領率、退休年限、預期年化報酬），並保持 localStorage／JSON Backup 相容。
  4. Tool Center 的 `retirement-planner` 條目補上路由，從「規劃中」灰卡啟用為可點擊卡片。
- 計算契約：FIRE 目標＝年總開銷 ÷ 提領率；目前達成率使用即時計算的 `totalAssets - debt`；缺口投入直接重用 `calculateRequiredMonthlyContribution()` 的月複利年金反推，月回傳值為平均每月負擔、乘以 12 為每年需投入。
- 開發過程修正：
  1. 三個滑桿原在 React state updater 內延遲讀取 `event.currentTarget`，React 清空後為 `null` 而造成整頁崩潰；修正為 handler 當下先讀取 primitive value。
  2. 本頁 DraftInput 金額欄位在顯示 `0` 時會附加新輸入（例如 `1` 變 `11`）；修正為 focus 時正確取代零值。此為本頁輸入方式的獨立缺陷。
  3. 現金流匯入由首次開啟自動詢問改為主動按鈕，避免來源無資料時產生多餘詢問；加入覆蓋前二次確認與無資料提示。
- 附帶記錄（不屬本 Todo 範圍）：全站共用 `DraftInput`（不同於本頁輸入元件）另有同類「顯示 0 時輸入被附加」缺陷，影響帳戶餘額（8 種帳戶類型）、持股欄位、逢低提醒設定、加碼預算與股價更新秒數；已判定為獨立範圍，另開 PR 處理。
- 明確不包含：修改 `cashFlow.ts`／`wealthGoal.ts` 的既有公式或函式簽名；CLEC、再平衡、AI Decision、正式投資建議；netWorthHistory、Financial Event Ledger、attribution、Firebase 或任何自動同步。
- 驗收條件（已達成）：4% FIRE、達成率、零報酬與零退休年限邊界、現金流 draft 隔離、localStorage／JSON Backup round-trip、自訂項目上限、工具路由、TypeScript、完整 CI、Production／Preview build、Preview 桌機與手機驗收、Production 唯讀驗證。

### UR-TODO-065 現金流工具頁「新增項目」按鈕移位＋收合開關

- 優先級：P3（使用者於首頁 Daily Decision UX Audit 之後臨時發起，同日盤點、定案並完成開發）
- 狀態：**CLOSED（2026-08-16）／已完成**
- 完成日期：2026-08-16
- Merge 資訊：**PR [#364](https://github.com/hyc640110/family-universal-rebalance/pull/364)**，merge commit `5cc0fe5`，一般 merge commit，**未使用 admin override**（`mergeStateStatus` 為 `CLEAN`，required check 通過後直接合併）。Deploy GitHub Pages run [31923694128](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31923694128) success，headSha 與 merge commit 一致；Production 已唯讀確認 `/#/tools/cash-flow` 頁面按鈕新位置與收合開關正確運作、其餘既有功能不受影響，console 無錯誤。
- 提出日期：2026-08-16（使用者直接提出，同日盤點與開發）
- 背景：`/tools/cash-flow`「固定支出清單」原本「新增項目」按鈕位於清單標題列，與「儲存現金流設定」按鈕分離；清單本身無收合機制，使用者希望調整按鈕位置並可收合清單。
- **最終落地範圍**：
  1. **按鈕移位**：「新增項目」從標題列移至清單最下方既有 `.actions` 列內，與「儲存現金流設定」「清空設定」並排（新增項目在左、儲存現金流設定居中、清空設定在右）。
  2. **收合／展開開關**：標題列新增收合開關，沿用全站既有 `SectionCard` 的 `collapsible-card`／`section-toggle-row`／`section-toggle` CSS class 與共用 `CollapseEyeIcon`（Eye／EyeOff）元件視覺樣式，未發明新機制。因 `SectionCard` 本身定義於 `App.tsx` 內未匯出，`CashFlowPage.tsx` 以相同 class 結構手動複製一份等價 markup。收合時清單內所有項目（名稱／分類／金額／家庭流動性角色欄位，含空清單時的提示文字）完全隱藏，只留標題列；預設維持展開，不持久化。查證確認全庫僅此一套「眼睛圖示」慣例，本身即為收合／展開專用，不存在與「隱藏數字」功能混淆的風險。
  3. **新增項目與收合狀態解耦**：按鈕移出標題列後不再受收合狀態影響，收合時點擊仍可正常新增項目（新項目暫時不可見，展開後可見）。
- 技術落地：新增 `tests/cashFlowFixedExpensesCollapse.test.ts`（6 項，`jsdom`＋`react-dom/client` 真實渲染）：涵蓋預設展開、收合後所有欄位隱藏且只留標題列、再次展開恢復、空清單收合情境、按鈕位置與順序（原始碼比對）、收合狀態下新增項目仍可運作。`npx tsc -b`、`npm run test:ci`（1268 tests pass）、`node scripts/stability-check.mjs`、`npm run build`、`npm run build:preview` 皆成功；本機 dev server 375px 手機版與 Production 皆已實機驗證（見上方 Merge 資訊）。
- 明確不包含：計算邏輯、資料結構、驗證規則修改；「支出結構」右側卡片或其他頁面；收合狀態持久化。
- 依賴：無（獨立 UI 調整）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（按鈕位置正確、收合／展開開關正常運作、收合狀態下新增項目仍可運作、既有功能未受影響、手機版排版正常），Production 唯讀確認功能與既有頁面皆正常。

### UR-TODO-064 首頁 supportingItems 清理＋標題文案微調

- 優先級：P3（使用者於首頁 Daily Decision UX Audit 後直接拍板，同日盤點、定案並完成開發）
- 狀態：**CLOSED（2026-08-16）／已完成**
- 完成日期：2026-08-16
- Merge 資訊：**PR [#363](https://github.com/hyc640110/family-universal-rebalance/pull/363)**，merge commit `93d5911`，一般 merge commit，**未使用 admin override**（`mergeStateStatus` 為 `CLEAN`，required check 通過後直接合併）。Deploy GitHub Pages run [31922805564](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31922805564) success，headSha 與 merge commit 一致；Production 已唯讀確認首頁「資產快照」標題正確顯示、其餘既有區塊不受影響，console 無錯誤。
- 提出日期：2026-08-16（延續 UR-TODO-063 首頁瘦身方向，經 Repository 唯讀「首頁 Daily Decision UX Audit」發現後直接拍板）
- 背景：首頁 Daily Decision UX Audit（Review Mode 唯讀盤點）逐一比對首頁所有區塊內容，確認「今日投資狀態」與「今日投資摘要」兩者實際渲染內容互不重疊，但標題文字（eyebrow）一字之差容易混淆；另確認 `deriveInvestmentIntelligence()` 輸出的 `todayPerformance`（`supportingItems[1]`）與 `attentionItems` 兩個欄位全庫零消費者，屬死程式碼路徑。
- **最終落地範圍**：
  1. **移除未使用計算欄位**：`deriveInvestmentIntelligence()`（`src/lib/investmentIntelligence.ts`）輸出物件移除 `todayPerformance`／`attentionItems` 兩個欄位；`supportingItems` 陣列本身（含其索引 `[1]`／`[7]` 的元素）與其餘 6 項（`[0]`、`[2]`–`[6]`，皆有下游消費者 `dailyDecisionWorkflow.ts` → `investmentOpportunities`／`investmentActionCenter`）維持不動。
  2. **標題文案微調**：`investment-summary-card`（`DashboardDecisionPage.tsx`）的 eyebrow 由「今日投資摘要」改為「資產快照」；`<h2>`（「資產與今日表現」）未變；「今日投資狀態」（`investment-intelligence-card`）維持不變。確認新文案不與其他既有頁面標題衝突（`/assets` 頁「資產總覽」SectionCard 為不同文字）。
- **明確記錄**：內容本身無重複，僅命名容易混淆，此為文案層級調整，非邏輯或資料流變更。
- 技術落地：更新 `tests/investmentIntelligence.test.ts`（改用 `supportingItems[1]` 取代已移除的 `todayPerformance`，新增兩項欄位不存在的鎖定斷言）；同步更新 `scripts/stability-check.mjs` 對應文字比對。`npx tsc -b`、`npm run test:ci`（1262 tests pass）、`node scripts/stability-check.mjs`、`npm run build`、`npm run build:preview` 皆成功；Preview 與 Production 皆已實機驗證（見上方 Merge 資訊）。
- 明確不包含：`dailyDecisionWorkflow.ts` 及其消費 `supportingItems[0]`／`[2]`–`[6]` 的既有邏輯；任何區塊渲染順序／渲染條件；`todayDecision.ts` 與 `/assets` 頁「今日決策」SectionCard；schema／persistence／Ledger／attribution 核心邏輯。
- 依賴：UR-TODO-063（已 CLOSED，首頁瘦身方向的既有先例，本次為其後續小型清理）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（「資產快照」標題正確顯示、4 個數字內容不變、其他首頁區塊未受影響、手機版排版正常），Production 唯讀確認功能與既有頁面皆正常。

### UR-TODO-063 首頁瘦身——移除投資健康度、狀態確認改為異常才顯示

- 優先級：P2（使用者於驗收過程中直接發起，同日盤點、定案並完成開發）
- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成日期：2026-08-15
- Merge 資訊：**PR [#349](https://github.com/hyc640110/family-universal-rebalance/pull/349)**，merge commit `ed1c3e4ea3883f56df7a57f6c180f38592fc8680`，一般 merge commit，**未使用 admin override**（`mergeStateStatus` 為 `CLEAN`，required check 通過後直接合併，未觸發任何 branch protection 阻擋）。Deploy GitHub Pages run [31884737628](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31884737628) success，headSha 與 merge commit 一致；Production 已唯讀確認 `/#/home` 首頁「投資健康度」區塊完全消失、「狀態確認」區塊於目前資料狀態下（含尚無持股／股價需確認／配置已偏離目標三項提醒）正確完整顯示，其餘既有區塊（重點標的、今日投資狀態、今日投資摘要、信用卡繳費提醒）不受影響，console 無錯誤。
- 提出日期：2026-08-15（使用者與 ChatGPT 討論後，同日於對話中提出首頁精簡構想並直接排入盤點與開發）
- 背景：使用者與 ChatGPT 討論後，認為首頁「投資健康度」與 `/tools/risk-center`、`/tools/portfolio-risk` 內容高度重複，「狀態確認」的四項檢查也都在其他頁面有對應顯示入口，違反既有「30 秒決策中心」只回答「今天要不要做事」的產品原則。經 Repository 唯讀盤點確認以下事實後，使用者拍板執行首頁瘦身：(1) 「投資健康度」顯示的 `riskMetrics.overallLabel`／`allocationDeviation`／`thresholdReached` 在 `/tools/risk-center`、`/tools/portfolio-risk` 皆有幾乎逐字重複、且更完整的呈現；(2) 「狀態確認」原有四項檢查（尚無持股資料、股價資料需確認、目標比例需調整、配置已偏離目標）**皆非唯一顯示入口**，Repository 內其他頁面（尤其 `/tools/portfolio-risk` 的「資料品質」清單）都有對應或更細緻的顯示，移除首頁呈現不會造成使用者失去察覺異常的管道；(3) 使用者原本擔心「狀態確認」可能承載「借款資料過期」「reconciliation 異常」等唯一入口的警示，經查證證實這兩項從未出現在首頁「狀態確認」，分別只存在於 `/tools/risk-center`（借款資料過期）與資產頁交易基礎區塊（reconciliation，與首頁無關），與本次調整無關聯。
- **最終落地範圍**：
  1. **移除「投資健康度」（`dashboard-health-card`）整個首頁區塊**：`src/pages/DashboardDecisionPage.tsx` 移除該 section；`DashboardData` 型別同步移除不再使用的 `riskLabel`／`allocationDeviation`／`rebalanceThreshold`／`thresholdReached` 欄位；`src/App.tsx` 同步移除傳入的對應死 prop；`src/styles.css` 的 `.dashboard-health-card` 已確認只有這一個檔案引用、未被其他頁面重用，隨區塊一起從共用選擇器中移除。底層計算邏輯（`riskMetrics.ts`／`portfolioRisk.ts` 等）與 `/tools/risk-center`、`/tools/portfolio-risk` 兩個頁面本身皆**未修改**。
  2. **「狀態確認」（`dashboard-reminders-card`）改為條件渲染**：比照 `CreditCardDueSoonCard.tsx`（UR-TODO-060）既有「無項目回傳 `null`」慣例，取代原本「container 恆常顯示＋空狀態文字」的舊慣例。`reminders` 陣列為空時，整個區塊（最後股價更新時間列、提醒清單、投資機會連結三者一起）完全不渲染；有任何一項異常時才整個顯示。`investmentDashboard.ts` 的 `deriveInvestmentDashboard()`／`reminders` 計算邏輯本身**未修改**，純粹是消費端的渲染條件調整。
- 技術落地：新增 `tests/dashboardHealthReminderConditional.test.ts`（5 項，採真實 `jsdom`＋`react-dom/client` 渲染，非僅原始碼字串比對，比照 `tests/importCenterCheckboxRealClick.test.ts` 既有 `MemoryRouter` 渲染慣例）：涵蓋「health card 在任何 reminders 狀態下皆不渲染」「狀態確認有異常時完整顯示（時間列＋清單＋投資機會連結）」「狀態確認無異常時整個區塊完全不在 DOM 中（非僅清單消失）」「首頁其他既有區塊（今日投資狀態、今日投資摘要、重點標的、信用卡提醒）不受影響」「原始碼確認死 prop 已移除」。`scripts/stability-check.mjs` 既有斷言同步更新（移除已不存在的 `投資健康度`／`tools/risk-center` 文字比對），新增一項明確鎖定「health card 完全移除＋reminders 條件渲染語法存在」的斷言。`npx tsc -b`、`npm run test:ci`、`node scripts/stability-check.mjs`、`npm run build`、`npm run build:preview` 皆成功；本機 Preview 與 Production 皆已實機驗證（見上方 Merge 資訊）。
- 明確不包含：`riskMetrics`／`allocationDeviation`／`thresholdReached` 等底層計算邏輯修改；`/tools/risk-center`、`/tools/portfolio-risk` 頁面修改；「今日投資狀態」（`investment-intelligence-card`）、「今日投資摘要」（`investment-summary-card`）、「重點標的」（`HomeFocusedAssetCard`）、信用卡繳費提醒卡片修改；任何新資料流或計算函式；schema／persistence／Ledger／attribution／Firebase。
- 依賴：UR-TODO-060（已 CLOSED，`CreditCardDueSoonCard` 的「無項目回傳 `null`」慣例，本次「狀態確認」條件渲染直接沿用的既有 pattern）；UR-TODO-030（已 CLOSED，首頁精簡的既有先例，本次調整性質與範圍與其相近）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（投資健康度完全消失、狀態確認在有異常與無異常兩種情境下皆正確運作、其他首頁區塊不受影響、手機版排版正常），Production 唯讀確認功能與既有頁面皆正常。

### UR-TODO-062 工具導覽「真實建議／假設模擬」分組標籤

- 優先級：P2（使用者於驗收過程中直接發起，同日盤點、定案並完成開發）
- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成日期：2026-08-15
- Merge 資訊：**PR [#347](https://github.com/hyc640110/family-universal-rebalance/pull/347)**，merge commit `b4aec0a1761817dd68fff79479cf56d9156af72b`，一般 merge commit，**未使用 admin override**（`mergeStateStatus` 為 `CLEAN`，required check 通過後直接合併，未觸發任何 branch protection 阻擋）。Deploy GitHub Pages run [31883336445](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31883336445) success，headSha 與 merge commit 一致；Production 已唯讀確認 `/#/tools` 頁面 4 張工具卡片正確顯示對應徽章、其餘工具卡片不受影響、首頁等既有頁面正常載入，console 無錯誤。
- 提出日期：2026-08-15（使用者於驗收 UR-TODO-058〔三策略再平衡模擬比較〕過程中，順道發現既有工具導覽的分組缺口並當場提出）
- 背景：Repository 內有 4 個與再平衡相關的工具頁面——再平衡建議中心（`/tools/rebalance-recommendation`）、CLEC 再平衡策略中心（`/tools/clec-strategy`）、配置模擬器（`/tools/allocation-simulator`）、三策略再平衡模擬比較（`/tools/investment-backtest`）——混在同一個工具導覽選單層級，未區分「會影響實際操作判斷的真實建議」與「純假設情境模擬工具」，使用者需要點進去才能分辨性質，且各工具算出的金額可能不同，容易造成混淆。
- **最終落地範圍**：
  1. **資料結構（最小改動）**：`ToolDefinition`（`src/lib/toolNavigation.ts`）新增選用、加法式欄位 `nature?: 'real-recommendation' | 'simulation'`，不影響既有欄位、不需重構既有工具導覽資料結構或渲染邏輯；新增 `TOOL_NATURE_LABELS` 中文標籤對照表。
  2. **標記範圍**：`rebalance-recommendation`／`clec-strategy` → `real-recommendation`（真實建議）；`allocation-simulator`／`investment-backtest` → `simulation`（假設模擬）。其餘既有工具維持原樣、不強制分組。
  3. **視覺呈現**：`ToolsPage.tsx`（工具中心主要選單清單）在卡片標題旁渲染小徽章。真實建議＝藍色系（`#132c4d` 底／`#7dd3fc` 字）；假設模擬＝紫色系（`#291f45` 底／`#d8b4fe` 字）。**刻意避開既有 `.good`／`.bad` 綠紅語意色**，避免暗示「真實建議優於假設模擬」的優劣關係——兩組只是性質不同。
  4. **導引連結**：`AllocationSimulatorPage.tsx`／`RebalanceStrategyComparisonPage.tsx` 既有的「不是投資建議」提示區塊，各補上一句「想看真實再平衡建議，請至再平衡建議中心」並附可點擊連結導向 `/tools/rebalance-recommendation`。
- 技術落地：`tests/toolNatureGrouping.test.ts` 新增 5 項 characterization test（分組標籤正確對應、標籤文字非優劣配色、兩模擬頁面連結存在）；既有 `tests/toolNavigation.test.ts`／`tests/toolNavigationConsistency.test.ts` 因新欄位為選用加法式欄位，未修改、直接通過。`npx tsc -b`、`npm run test:ci`、`npm run build`、`npm run build:preview` 皆成功；本機 Preview 與 Production 皆已實機驗證（見上方 Merge 資訊）。
- 明確不包含：合併或刪除任何現有頁面；修改任何核心計算模組（`rebalanceRecommendation.ts`／`clecStrategyRules.ts`／`rebalanceStrategyComparison.ts`／`allocationSimulatorFunding.ts` 皆未觸碰）；新增或移除任何 `CLEC_STRATEGIES` 策略項目；schema／persistence／Ledger／attribution／Firebase 修改。
- 依賴：UR-TODO-058（已 CLOSED，落地 `/tools/investment-backtest`，本次分組標籤的兩個「假設模擬」工具之一）。
- **附帶記錄（同一輪對話盤點結論，非本項開發範圍）**：驗收 UR-TODO-058 過程中，同步以 Review Mode 唯讀盤點確認「權重差額 × 總市值」（`target = total×weight%; diff = target−current`）這行基礎公式，目前 Repository 內共被**獨立實作 3 次**——`rebalanceRecommendation.ts`（正式決策引擎，含完整資料品質 gate／預算 clamp／賣出上限）、`rebalanceStrategyComparison.ts`（UR-TODO-058 比率再平衡，刻意省略上述限制，且有註解明文對齊 `amountFloor` 慣例）、`AllocationSimulatorPage.tsx`（配置模擬器，公式直接寫在頁面元件內、有自己獨立的資金語意層，**未留下**與另外兩處對齊的註解）。三者評估為**低風險、已知（其中兩處已記錄）技術債**，核心一行公式雖有重複但周邊業務規則差異夠大，不建議貿然整合成同一函式；`clecStrategyRules.ts` 為完全不同的百分比偏離分類規則，與此議題無關。**本次不處理整合**，留待未來任一處核心公式細節（例如捨入方式）真的需要變更時，再一併評估是否值得抽出共用微型函式、或至少補上對齊註解。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（4 張卡片徽章正確、藍紫配色無優劣暗示、模擬頁面導向再平衡建議中心的連結正確、其他工具卡片不受影響、手機版排版正常），Production 唯讀確認功能與既有頁面皆正常。

### UR-TODO-061 首頁重點標的可自訂

- 優先級：P2（使用者提出後直接排入開發）
- 狀態：**CLOSED（2026-08-15）／已完成**
- 完成日期：2026-08-15
- Merge 資訊：**PR [#343](https://github.com/hyc640110/family-universal-rebalance/pull/343)**，merge commit `6fb75cfc6bb38b950a62d50af6851aa19f94ecf6`，一般 merge commit，**未使用 admin override**。Deploy GitHub Pages run [31876678153](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31876678153) success，headSha 與 merge commit 一致；Production 已唯讀確認首頁「重點標的」卡片正確顯示 00631L（既有使用者一次性遷移初始化），既有卡片未受影響，console 無錯誤。
- 提出日期：2026-08-15（使用者於 UR-TODO-057／059 完成後直接提出，同日盤點、定案並完成開發）
- 背景：首頁「重點標的」卡片（UR-TODO-059）原寫死顯示 00631L，使用者希望能自行選擇要顯示哪一檔（例如未來想從 00631L 換成 00685L）。
- **最終落地範圍**：
  1. **資料結構**：`AppState` 新增 additive 欄位 `focusedSymbols: string[]`。**設計原則：即使目前 UI 邏輯限制最多只能有 1 檔，資料結構仍採陣列型別**，為未來可能的多檔同時顯示需求預留彈性，避免日後若要支援多檔時需要重新做一次型別遷移。
  2. **一次性遷移**：新增純函式 `normalizeFocusedSymbols()`（`src/lib/focusedSymbols.ts`）以 `Array.isArray(raw)` 判斷該欄位「這次持久化資料裡是否真的存在過」——非陣列（欄位不存在／首次升級）一次性預設為 `['00631L']`，符合所有使用者（不論新舊）升級前一直看到的寫死行為；已是陣列（即使是空陣列）則原樣尊重使用者的選擇，不再被覆蓋，避免使用者主動清空選擇後被靜默復原。
  3. **選擇介面**：資產頁個股「詳細」展開區塊內新增「設為重點標的」切換開關（比照既有「逢低提醒」開關的位置與操作方式）。UI 邏輯限制一次最多 1 檔：選擇新標的會自動取消舊選擇（不需先手動取消），再次點選目前唯一的重點標的則清空選擇。
  4. **與逢低加碼追蹤（UR-TODO-057）完全獨立**：`highWaterMark`／`triggeredLevel` 邏輯完全不與 `focusedSymbols` 綁定——切換重點標的不會搬動、清空或觸碰任何標的已累積的追蹤資料；新標的若之前未啟用逢低追蹤，需使用者自行到該標的另外啟用。已於本機 dev server 實機驗證：啟用 00631L 逢低追蹤並取得 `highWaterMark` → 切換重點標的到 00685L → `dipAlerts['00631L']` 完全未變 → 切回 00631L → 首頁正確顯示原本累積的 `highWaterMark`。
  5. **邊界防呆**：重點標的指向的 symbol 若已被使用者從 `holdings` 移除，重用既有 `dipAlerts` 的 holdings-存在性過濾機制（同一套機制，無需獨立實作），該次 normalize 時自動清空；封存持股（`isArchived: true`，`holdings` 陣列中仍保留）額外於 `removeHoldingAsset()` 主動清空 `focusedSymbols`，讓封存動作立即反映在首頁，不等到下次移除才生效。
  6. **取消唯一重點標的**：`focusedSymbols` 變空陣列時，首頁「重點標的」卡片（`HomeFocusedAssetCard.tsx`）完全不渲染，比照既有 `CreditCardDueSoonCard`「無項目則不渲染」慣例，不顯示空狀態外殼。
  7. `normalizeState()`／`backupPayload()`／`stateFromBackup()` 皆已同步接線，additive 相容，不破壞既有 localStorage／JSON Backup。
- 技術落地：新增 `src/lib/focusedSymbols.ts`（`normalizeFocusedSymbols()`／`toggleFocusedSymbol()`，15 項 characterization test，含明確鎖定「切換重點標的絕不觸碰逢低追蹤資料」的獨立測試）；`homeFocusedAssetCard.ts`／`HomeFocusedAssetCard.tsx`／`DashboardDecisionPage.tsx` 改為接受動態 `symbol` 與可為 `null` 的資料（無重點標的時不渲染）；既有 `tests/homeFocusedAssetCard.test.ts`／`tests/homeFocusedAssetCardUi.test.ts` 因型別擴充同步更新，並新增 symbol-agnostic／render-nothing 測試。
- 明確不包含：同時顯示多檔重點標的的 UI（資料結構預留彈性，UI 邏輯仍限制最多 1 檔）；`dipLadderEngine.ts` 核心邏輯修改；`todayDecision.ts` 既有單一結論字串邏輯修改。
- 依賴：UR-TODO-059（已 CLOSED，首頁「重點標的」卡片結構基礎）；UR-TODO-057（已 CLOSED，逢低加碼追蹤機制，本次確認完全獨立、未修改）。
- 驗收條件（已達成）：使用者於 Preview 環境完整驗收（既有使用者遷移、手動切換重點標的、舊標的逢低追蹤資料不受影響、單一標的限制、取消後卡片完全消失、持久化保留、手機版排版正常），Production 唯讀確認功能與既有首頁區塊皆正常。

### UR-TODO-028 股息中心未指定資產編輯限制
- 優先級：P1
- 狀態：**已完成**
- 完成日期：2026-08-01
- 完成依據：唯讀盤點＋隔離本機 dev server 實機驗收（Claude Code，Development Mode／驗收性質，基準 `origin/main` HEAD `a7cc0a4`）。`src/pages/DividendCenterPage.tsx` 對所有股息紀錄（含未指定資產）皆提供「編輯」按鈕，編輯表單含 `DividendAssetReferenceSelect`（含「未指定資產」選項），可自由補選或變更資產。實機驗收：建立未指定資產股息紀錄 → 編輯補選資產「00631L」→ 儲存 → 三處摘要卡片同步更新 → 重新整理後持久化不遺失 → 390px 無橫向溢出 → console 無 error → 再次編輯切回「未指定資產」亦正常。**本項未新增或修改任何 `src/`／`tests/` 程式碼**，為既有股息中心改版（新增／編輯／刪除共用同一表單元件）順帶滿足驗收條件，非本次新增邏輯。
- 提出日期：2026-07-19
- 問題（原始，已解決）：
  - 未指定資產的股息紀錄可能只能刪除、無法編輯。
- 已確認：
  - 可自由補選或修改資產（含改回未指定資產）。
  - 已清倉／封存資產不影響此編輯路徑，`DividendAssetReferenceSelect` 選項來源為 `dividendAssetReferenceOptions(holdings, transactions)`，與封存狀態無關。
  - 本次僅驗證 localStorage 持久化；Firebase／Backup 路徑本次未逐一實測，因未變更任何資料寫入邏輯，風險判斷為低。
- 驗收條件（已達成）：
  - 未指定資產紀錄可安全編輯，或有明確限制說明。

### UR-TODO-029 股息收款日期圖示顏色
- 優先級：P2
- 狀態：**已完成**
- 完成日期：2026-07-26
- 完成依據：PR #139 已 Merge（merge commit `05a2088`）；本項僅修正 Deep mode 股息收款日期圖示顏色與可讀性，未擴大為其他畫面或功能調整。
- 提出日期：2026-07-19
- 修改方向：
  - 日期圖示改為白色或符合深色模式對比的顏色。
- 驗收條件：
  - 深色與淺色模式都清楚。
  - 手機 Safari 與 Windows Chrome／Edge 正常。

### UR-TODO-030 首頁「重要提醒」重複性盤點
- 優先級：P2
- 狀態：**已完成**（2026-08-07，PR #268，merge commit `cd89ad1c4ee17d23597f3a00e63c2acb1262cfb9`）
- 提出日期：2026-07-19
- 問題：
  - 可能與「今日投資狀態」或其他決策卡片重複。
- 依賴：
  - UR-TODO-009
  - UR-TODO-011
- 驗收條件：
  - 首頁不重複顯示相同提醒。
  - 必要風險仍保留。

**2026-07-26 補充（首頁改版方向討論記錄，僅記錄輸入，不在本次處理，狀態維持「待盤點」）：**

- 補充來源：使用者與 ChatGPT 討論記錄（2026-07-26）。
- 診斷：首頁目前較像資訊展示頁，而非使用者實際進入點（使用者主要使用「資產」「分析」頁）；**使用者已明確表示很少查看目前首頁的大量資訊**。
- 建議方向：首頁重新定位為「**30 秒決策中心**」，只回答「今天是否需要做什麼」，若無事則只顯示單一狀態列（例如「今天無需任何操作」）。
- 建議保留內容：
  1. 今日是否需操作（單一卡片，僅顯示需要處理的事項）
  2. 精簡資產總覽（總資產／今日增減／總報酬率，不含細節）
  3. 更新狀態（最後更新時間、是否今日報價，佔用空間需精簡）
- 「今日投資狀態」處理方向（兩個選項，尚未拍板）：
  - 方案 A（建議）：移到「分析」頁，首頁僅留一行摘要並可點擊查看。
  - 方案 B：預設收合，感興趣再展開。
- 此為 Sprint 6／UR-TODO-011（Cross-Module Presentation Consistency）階段的呈現層輸入，**非本次或 UR-TODO-009 範圍**，UR-TODO-009 開發時不得因此擴大或美化「今日投資狀態」現有版面。

**2026-07-29 再次確認（PR #176／#177 治理同步之後的既有產品決策保留確認，本次不修改首頁 UI）：** 上述「30 秒決策中心」方向、只回答「今天是否需要做什麼」、三項建議保留內容、使用者很少查看目前首頁大量資訊、以及「今日投資狀態」兩個未拍板處理選項，**均為既有結論，本次唯讀確認仍完整有效、原文未被覆蓋或稀釋**。此項仍屬 Dashboard UX／UR-TODO-030 待盤點範圍，狀態維持「待盤點」；**與同時期進行的 UR-TODO-043-C2（純 `netWorthSnapshotNormalization` 契約）完全無關，不得因 043-C2 開發而順便處理首頁簡化，也不得反過來因首頁簡化規劃而擴大 043-C2 範圍。**

**2026-08-07 正式完成（PR #268，merge commit `cd89ad1c4ee17d23597f3a00e63c2acb1262cfb9`）：** Claude Code 於 Review Mode 先完成唯讀盤點，逐一列出首頁全部區塊、對照三項建議保留內容給出移動／保留／收合建議，經使用者多輪追問補充（區塊 4／6 完整建議、「今日投資狀態」內部子區塊除方案 B 外的完整方案清單）後，使用者下達「開始開發」並逐項拍板 6 大決策；開發前依指示先完成全部搬移目的地頁面（投資行動中心、風險中心、市場頁、股息中心、投資組合風險與配置中心、淨資產歷史頁）唯讀盤點，發現 5 項不確定對應關係（今日投資狀態格重複、資料品質格無單一目的地、市場資料格目的地無彙總呈現、本月／年度資產變動兩處計算路徑不同、區塊 5 目的地選擇）逐項回報使用者確認後才動手，避免自行假設造成資料重複或遺漏。實作範圍與驗證內容見上方 2026-08-07 治理同步條目；驗收過程中額外排除的部署層問題（Environment 分支政策擋下 Preview 部署、Preview 被不相干 main push 覆蓋）已另立 **UR-TODO-050** 追蹤，不影響本項本身的完成判定。三項建議保留內容（今日是否需操作／精簡資產總覽／更新狀態）與「今日投資狀態」兩個未拍板選項皆已在本次開發中做出明確決策並實作，**UR-TODO-030 正式結案**。

### UR-TODO-031 投資健康度安全存量命名與說明
- 優先級：P1
- 狀態：**CLOSED／Absorbed by subsequent Production capabilities（2026-08-21，Backlog Consistency Closeout）**
- 提出日期：2026-07-19
- 正式規格：
  - `013_Household_Liquidity_Model_Spec_v3.0.md`
- 關聯 Todo：
  - UR-TODO-006～011
- 驗收條件（原始）：
  - 不再使用易誤解的「現金安全」舊語意。
  - 顯示生活費＋負債還款的安全存量來源。
- Closeout 說明（2026-08-21，Review Mode 唯讀稽核後結案，未修改任何 production code）：
  - 原始意圖：不再使用易誤解的「現金安全」舊語意，改以「生活費＋負債還款」的安全存量來源呈現。
  - 原始 UI consumer：提出當時（2026-07-19）目標 consumer 為首頁「投資健康度」相關呈現（`dashboard-health-card`）；該區塊已由 **UR-TODO-063**（2026-08-15，PR #349）整塊自首頁移除，內容改由 `/tools/risk-center`、`/tools/portfolio-risk` 提供更完整呈現。
  - 現行 Production 語意：「安全存量」用語已在現行 production modules 廣泛落地，取代舊「現金安全」語意，包括 `src/lib/householdLiquidity.ts`、`src/lib/aiDecision.ts`、`src/lib/homeDecision.ts`、`src/lib/riskMetrics.ts` 及既有風險／決策相關 UI。
  - Closure reason：原 consumer（`dashboard-health-card`）已不存在；原產品語意已被後續 Household Liquidity／Risk／Decision capabilities 吸收；沒有可驗證的剩餘 acceptance criteria；不再保留「待 UI 接線」作為未完成工作。**歷史文件無法完整還原原始逐條驗收紀錄，故不宣稱原始所有 acceptance criteria 均逐條完成，closure reason 為 absorbed by subsequent Production capabilities / original consumer removed。**
  - Known low-priority observation：`src/styles.css` 仍殘留 `.dashboard-health-card` dead CSS selector，無 runtime 影響，未建立獨立 Todo。

### UR-TODO-032 資產頁更新股價入口與手機下拉更新盤點
- 優先級：P1
- 狀態：**已完成**
- 完成日期：2026-08-01
- 完成依據：唯讀盤點＋隔離本機 dev server 實機驗收（Claude Code，Development Mode／驗收性質，基準 `origin/main` HEAD `2abe5ac`）。架構確認 `refreshQuotes()` → `createQuoteRefreshController` 為桌機／手機共用的單一刷新入口，`isRefreshingQuotes`／`hasUpdatedQuotes`／`latestQuoteTime`／`quoteSummaryText`／`quoteStatus` 皆為 `App.tsx` 頂層單一狀態，以 props 傳入首頁、資產頁、分析頁，非各頁分別重算；手機下拉更新（`src/lib/assetsPullToRefresh.ts`）呼叫同一個 `refreshQuotes(true)`。實機驗收：資產頁點擊「更新股價」（串接真實 Yahoo Finance via Cloudflare Worker）→ 確認四檔標的市場時間／來源／系統取得時間正確顯示 → SPA 內部導覽切換至分析頁，確認同一時間戳記、同一組報價與今日漲跌數字完全一致重現（非重新抓取）→ 首頁「最後股價更新」短格式時間與前述一致 → 再次於首頁觸發更新，確認新時間戳記立即同步反映於三處頁面 → 390px 無橫向溢出 → console／dev server log 全程無 error。**明確不包含**：手機觸控下拉的實際手勢觸發與明確錯誤狀態（Worker 失敗情境）因本次網路正常未能重現，僅完成程式碼路徑靜態確認（`quotePresentation.ts` 的 `isPreserved`／`hasFailure` 分支與正常路徑共用同一元件，風險判斷為低）。**本項未新增或修改任何 `src/`／`tests/` 程式碼**，為其他 Sprint 陸續建成的共用基礎設施順帶滿足。
- 提出日期：2026-07-19
- 已確認：
  - 首頁與資產頁皆有明確「更新股價」按鈕。
  - 手機下拉更新有專屬綁定模組，呼叫路徑與按鈕相同；實際觸控手勢本次未實機重現。
  - lastUpdated、quote date 跨頁一致（同一份狀態，非各頁分別計算）；error 呈現路徑經程式碼確認但本次未實機重現失敗情境。
- 驗收條件（已達成）：
  - 桌機與手機使用同一刷新契約。
  - 更新後各頁報價一致。

### UR-TODO-033 持股卡片現價與今日漲跌版面完整差異
- 優先級：P1
- 狀態：**已完成**
- 完成日期：2026-08-01
- 完成依據：[PR #214](https://github.com/hyc640110/family-universal-rebalance/pull/214)（`feat/ur-todo-033-holding-card-quote-layout`），merge commit `fd3ae448e9e7c5678a793f81d548fe5ed1f783c7`。`src/lib/compactAssetCard.ts` 新增 `formatCompactQuoteHeadline()`（內部重用既有 `formatCompactQuoteMovement()` 的 tone／有效性／aria-label，不重複驗證邏輯）；`App.tsx` 的 `HoldingCompactCard`「現價」格改為同列顯示「價格 元 ▲/▼ 漲跌幅%」，「今日漲跌」格只顯示金額（次列，與現價同一格線列相鄰）；`styles.css` 新增 `.holding-quote-percent`，顏色沿用既有 `up/down/hold` class 規則，四者（現價、箭頭、漲跌幅、漲跌金額）共用同一 tone。實機驗證（隔離本機 dev server，真實 Yahoo Finance via Cloudflare Worker）：`getComputedStyle` 確認顏色一致（`rgb(255, 91, 91)` 紅漲），390px／1280px 皆無橫向溢出，console 無 error；`npx tsc -b`、`test:ci` 全數通過。`Deploy GitHub Pages` run `30694521777` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測皆 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用。
- 與既有 Todo 關係：
  - 補充 UR-TODO-002，不取代它。
- 已確認：
  - 現價與漲跌幅同列（同一格內）。
  - 漲跌金額次列（相鄰格）。
  - 顯示 ▲／▼。
  - 三者依台股紅漲綠跌一致著色（同一 tone class）。
  - 與未實現損益仍為獨立格線，維持既有區隔。
- 明確不包含：
  - 「非今日報價清楚標示」既有機制（`quoteSummaryText` 頂層提示、`row.quote.error` 時「現價」標示為「參考價」）本次未變動，維持原狀，非本次新增。
- 驗收條件（已達成）：
  - 桌機與手機一致。
  - 非今日報價清楚標示（沿用既有機制）。

### UR-TODO-034 持股更新後仍顯示舊報價的殘留案例盤點
- 優先級：P1
- 狀態：**已完成**
- 完成日期：2026-08-01
- 完成依據：唯讀實機驗證（Claude Code，Development Mode／驗收性質，基準 `origin/main` HEAD `63feac1`，**未修改任何 `src/`、`tests/` 程式碼**）。架構確認 `quotes` 為 `App.tsx` 純 React state、不寫入 `localStorage`，每次完整重新整理皆重新向 Worker 抓取；`defaultQuotes` 對 00631L／00865B 有寫死的內建備援價格（38.42／48.52），`mergeQuoteRefresh()`（`src/lib/dataRefresh.ts`）已有防護，新報價無效或時間戳記較舊時保留前次有效報價、不覆蓋正確值。隔離本機 dev server（真實 Yahoo Finance via Cloudflare Worker）實機測試：首次載入即顯示真實市價、編輯股數後價格不受影響且正確持久化、手動刷新與完整瀏覽器重新整理（F5）後皆重新取得正確市價、未殘留內建備援值；資產頁／分析頁／投資組合風險與配置中心三頁數字一致（風險頁正確算出「最大單一資產為 00865B，占總資產 78.6%」，與資產頁市值換算吻合）；全程 console／dev server log 無 error。
- 已知相關完成：
  - Quote refresh consistency
  - TWSE 可信前收
  - Market refresh／CORS
- 已確認：
  - 00631L、00865B 本次實機測試未發現殘留舊值。
  - Worker、state、localStorage（僅持股本身，非報價）與各頁 selector 資料流一致。
- 驗收條件（已達成）：
  - 所有頁面使用同一份最新可信報價。
  - 無可信報價時顯示 unknown／非今日資料。

### UR-TODO-035 市場頁「重新取得」按鈕回歸確認
- 優先級：P2
- 狀態：已完成
- 提出日期：2026-07-16
- 完成日期：2026-08-02
- 已知相關完成：
  - Market 重新取得
  - Market CORS Hotfix
- 正式結案唯讀驗證（基線：`2bc1b1716c176b07bab4e11cbdc96c48ad1d52a2`，PR #227 merge commit）：
  - `MarketIntelligencePage` 的 click handler 實際觸發 `refreshMarketData(true)`，不是只有 UI state 變化。
  - 手動 request builder 實際發出 `/market-summary?refresh=1&request=<nonce>`，並使用 `cache: no-store` 與 `Accept: application/json`。
  - Loading 狀態顯示「更新中…」且按鈕 disabled；Success 狀態於 Preview／Production 均可重新取得實際資料並更新 UI。
  - Partial failure 時保留前次資料並顯示失敗區塊；Full failure 時正確顯示錯誤，重新取得按鈕仍可再次使用。
  - Console 無產品 error／warn；Preview／Production Market Worker URL 與 live bundle environment boundary 正確，未發現混用。
- 結案邊界：Treasury 上游格式不完整屬外部資料來源問題，不阻擋本 Todo 結案、不建立 Hotfix、不修改程式；若未來處理，應另立獨立 Todo。
- 驗收條件：
  - 按鈕實際發出請求。
  - loading、成功、失敗狀態可見。
  - Preview／Production Worker 不混用。

## P2－新功能

### UR-TODO-043 Analytics 每日資產快照休市日變動語意與來源明細

2026-08-02 **UR-TODO-043 結案前最終盤點完成，正式標記為已完成**：唯讀核對確認 A／B／C 所有技術契約均已完成，Analytics 現況沒有 043 範圍內殘留 Bug 或必須修正的語意不一致。現行頁面呈現快照值與兩期差額，並明確說明每日快照變動可能包含入金、提領、現金或負債變化、不等同純投資損益；`NetWorthSnapshot` 沒有事件來源欄位，因此無法由目前資料模型證明市場漲跌、投入本金、提領、股息、現金或負債各自的貢獻。這項來源歸因與淨值成長落差核對已由 **UR-TODO-046** 承接，043 不重做。**UR-TODO-043 正式結案；B4 不需要、C4 未觸發。**

2026-08-02 **UR-TODO-043-B3 Canonical Date Contract Producer／Consumer Wiring 正式完成**。PR #235 已 Merge，merge commit `b783d2af974271bbbb2ec64149802d746c98e06b`，正式基線推進至此 SHA；Producer、History／Performance range cutoff、Calendar today/month identity 均接入共享 `Asia/Taipei` canonical calendar-day contract，same-day selection 維持共享 deterministic last-occurrence。`test:ci` 680 項、TypeScript、Production／Preview build、CI verify `30738055541`、Pages workflow `30738107227` 均成功。未新增 timestamp、schema、migration 或 legacy date rewrite。**043-B（B1～B3）正式完成，B4 未觸發且不需要；043 結案前剩餘來源歸因問題已確認由 UR-TODO-046 承接。**

- 優先級：P2
- 狀態：**已完成**
- 提出日期：2026-07-28

- 問題：
  分析頁「每日資產變動日曆」在台股休市日仍可能顯示正負變動。該數字為相鄰有效快照的總資產或投資資產變動，可能包含入金、提領、現金、負債、資料同步或快照建立造成的差異，不等同純市場損益。

  現行畫面雖提示「不等同純投資損益」，並可查看前一筆快照日期，但日曆格狀摘要仍可能被誤認為當日市場漲跌；目前也缺乏比較基準與來源貢獻的清楚拆解。

- 已知現況：
  - 日曆以相鄰有效快照比較，不補日期、不插值。
  - 同日多筆快照目前取最後一筆。
  - UI 可切換「淨資產變動」與「投資資產變動」。
  - 尚未證實為計算 Bug。
  - 尚未完成 UTC／台灣日期邊界、快照建立時機與來源貢獻的完整盤點。

- 043-A 已完成（characterization only，PR #174）：
  - 15 個測試鎖定目前時區日期鍵、月／年底邊界、同日陣列最後一筆、local／Firebase／Backup 順序、相鄰有效快照、週末／休市日、無效值正規化、外部資金可辨識性及 AI 回撤／Rebalance 邊界。
  - 已重現：相同 timestamp 在不同執行時區可能產生不同日期鍵；同日快照結果跟隨陣列順序；淨資產歷史可能將無效值轉為 0，Analytics 則嚴格排除，形成跨頁分歧。
  - 未修改任何 Production 行為；所有測試均標記為 Characterization only、Do not treat as desired contract、Pending product decision。

- 043-C1 已完成（Review Mode，治理同步已於 PR #176 Merge，merge commit `272cd4a9ccff0c2def7bf0c73afbdbdf89363d58`）：
  - 寬鬆入口：`normalizeState` 在 AppState 初始載入、`setState`、localStorage 回寫、Firebase download 與 JSON Backup import 呼叫 `normalizeNetWorthHistory`；Firebase canonical payload 本身只做 JSON canonicalization，未保存原始無效值語意。
  - consumer：淨資產歷史與 Dashboard `deriveHistoryStats` 使用寬鬆歷史；Analytics 日曆、趨勢與月／年統計、AI 最大回撤使用 `normalizeInvestmentPerformanceHistory`，但接收的 App history 已先被寬鬆 normalizer 改寫；Rebalance 不接收 `netWorthHistory`。
  - C2 已完成（PR #181）：新增純 `src/lib/netWorthSnapshotNormalization.ts`、型別與契約測試；未接正式 consumer，未改日期及同日規則。
  - C3-A 已完成（PR #229）：建立不改 AppState／persistence schema 的 raw／classified read-time boundary；localStorage、Firebase、Backup ingress 均先建立 view，再進入既有 legacy normalization。未接正式 consumer UI。
  - C3-B 已完成（PR #231）：History、Analytics、Calendar 使用共享 read-time boundary；App 將完整 snapshot／結果傳入既有統計、AI 與 Risk 輸入邊界。Dashboard 與 `aiDecision.ts` 原始模組未直接修改，避免重複接線與產品行為擴張。
  - C4 候選：只在需新增 legacy metadata、改寫歷史資料，或 read-time normalization 無法維持 localStorage／Firebase／Backup 相容時才評估。C3-A／C3-B 均未觸發上述條件，C4 維持未啟動。

- 043-B1／B2 已完成（PR #233）：
  - B1 建立共享 `canonicalCalendarDay`，固定以 `Asia/Taipei` 輸出 `YYYY-MM-DD`，不受 runtime timezone 影響；既有 snapshot producer compatibility entry 改由此 helper 提供日期。
  - B2 建立共享 `selectLastOccurrenceByDate`，同日多筆 snapshot 依輸入序列最後一筆勝出；此為 occurrence order 契約，不是 timestamp-latest，未新增 timestamp 欄位。
  - `netWorthHistory.ts`、`investmentPerformanceHistory.ts`、`netWorthSnapshotReadBoundary.ts` 已移除重複同日選擇接線，改用共享 selector；localStorage、Firebase、JSON Backup、Import／Export、NetWorthSnapshot type、schema 與 migration 均未修改。
  - 已補強 UTC／Asia-Taipei／America-New_York runtime、Taipei 15:59／16:00 邊界、同日三筆與反轉順序、既有 characterization 及 CI harness 測試。`test:ci` 675 項、TypeScript、Production／Preview build、CI verify `30737460836`、Pages workflow `30737504196` 均成功；C4 未觸發。

- 043-B3 已完成（PR #235）：
  - Producer 維持 `netWorthSnapshotFromTotals()` → `localSnapshotDate()` → canonical `Asia/Taipei` helper；未新增第二日期 helper，既有 `YYYY-MM-DD` snapshot date 不重寫。
  - `historyForRange()`、`filterInvestmentPerformanceRange()`、Calendar 的 `currentMonthKey()`／`localCalendarDateKey()` 改由 canonical day 與 canonical day shift 計算，UTC 15:59／16:00 不再受 runtime timezone 影響。
  - Dashboard-derived stats 與 AI Decision performance-derived stats 維持既有 App history input boundary；未為形式接線而修改不直接決定 snapshot date identity 的原始模組。
  - localStorage、Firebase、JSON Backup、Import／Export、NetWorthSnapshot type、schema、migration、timestamp 與 C3 四分類契約均未改變；Household Liquidity、Rebalance、Treasury、Worker、UR-TODO-030 與 390px clipping 均未納入。

- 結案前最終盤點結論：
  - A／B／C 已全部完成：characterization、read-time snapshot classification、consumer wiring、canonical `Asia/Taipei` calendar day、deterministic same-day selection 均已有正式實作與測試保護。
  - Analytics 的淨資產變化、投資資產變化、現金與負債影響目前是 snapshot 欄位或兩期差額；投入、提領、股息、市場漲跌與資產配置變化的個別來源無法由現有 snapshot／transaction 關聯直接證明。
  - 上述來源歸因與現金流／淨值落差核對已正式屬 UR-TODO-046；043 不新增功能、不重做 046。046 維持「待評估」，其對 043-B 的依賴已解除。
  - 未發現需要 043 範圍內小型修正的 Analytics 文案、shared helper 接線或資料不足呈現缺口；未建立功能修正 PR。

- 待盤點：
  1. 當日快照與前一日、前一交易日或前一筆有效快照的精確比較規則。
  2. 休市日快照的建立時機與觸發來源。
  3. 投資資產、現金、負債、入金、提領及同步事件對快照差異的貢獻。
  4. 同日多筆快照的覆蓋順序與資料完整性。
  5. UTC、瀏覽器本機時區與台灣日期是否可能偏移。
  6. 月度、年度彙總是否使用相同正規化與比較算法。
  7. 是否存在重複計算，或僅為呈現語意造成誤解。
  8. 「淨資產變動／投資資產變動」切換是否足以避免誤解。

- 驗收方向：
  1. 明確標示為「總資產快照變動」或等效的非市場損益名稱。
  2. 使用者可辨識比較基準日期及比較方式。
  3. 可查看投資、現金、負債及外部資金等來源摘要；資料不足時須明確標示。
  4. 明確區分數值 0、無快照、休市日、未來日期與資料不足。
  5. 桌機及約 390px 手機版均可閱讀，不得只靠顏色傳達。
  6. 未經唯讀盤點證實公式錯誤，不修改 Net Worth、Performance 或財務公式。

- 明確不包含：
  - 本次不修改日曆 UI。
  - 不修改 Net Worth／Performance 計算。
  - 不修改 Firebase、schema、localStorage、JSON Backup 或同步契約。
  - 不修改 UR-TODO-011 的範圍。
  - 不建立功能 Branch。
  - 不將此問題提前宣稱為計算 Bug。

- 排程：
  - **UR-TODO-043-C3、043-B1、043-B2、043-B3 已完成；043-B 整體正式完成；UR-TODO-043 正式結案。B4 不需要啟動，因本次未出現需要 timestamp、schema、migration、legacy metadata、既有資料改寫或 round-trip 破壞語意的實證。**
  - **043-C4** 目前未觸發，維持未啟動。
  - 既存 390px 部分長文裁切問題非 C3-B 造成，僅列為待盤點，不在本 Todo 內順便修正。
  - 若證實日期偏移、同日覆蓋錯誤、重複計算、外部資金誤列為投資績效，或錯誤資料傳入 Dashboard／AI Decision／Rebalance，則升級為 P1 並插隊。

### UR-TODO-045 淨資產歷史頁面新增收合／分頁功能

- 優先級：P2
- 狀態：**已完成**
- 提出日期：2026-07-29
- 完成日期：2026-07-29
- 完成 PR：[PR #182](https://github.com/hyc640110/family-universal-rebalance/pull/182)（`feat/ur-todo-045-net-worth-history-collapse`），merge commit `ee5595a3bd85291d29c3242bb7c0f1d3ba93aade`，`mergedAt: 2026-07-29T10:11:13Z`
- 完成依據：PR #182 CI 成功（`CI Verification` run ID `30441980987`，`conclusion: success`）；Merge 後 `Deploy GitHub Pages` run `30442672832` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用；Production 上以隔離瀏覽階段實測收合／展開／再收合三段行為皆符合預期（預設顯示最新 7 筆、超過 7 筆時顯示「顯示更多」並可展開為全部、再次點擊可收回）。
- 範圍：`src/pages/NetWorthHistoryPage.tsx` 新增純前端顯示層收合機制（`showAllHistoryGrid`，component-local state，不持久化，重新整理頁面即回到收合狀態），預設顯示最新 7 筆，超過 7 筆時顯示「顯示更多」／「收合」切換按鈕；沿用既有 `PerformanceAnalyticsPage.tsx`（`showAllContributions`）與 `HouseholdLiquidityDiagnosticList.tsx`（`expanded`）的收合慣例；`src/styles.css` 新增一行 `.history-grid-toggle-row` 樣式，重用既有 `.small` 按鈕樣式；`tests/netWorthHistoryPageCollapse.test.ts` 新增 6 個測試。
- 明確不包含：未修改 `src/lib/netWorthHistory.ts` 資料層（`historyForRange`／`normalizeNetWorthHistory`／`deriveHistoryStats` 完全未觸碰）；未處理資產頁股價更新明細收合、UR-TODO-030（首頁縮減）、UR-TODO-043 系列（missing／0 語意問題），三者各自獨立、互不耦合。

### UR-TODO-046 淨值成長來源歸因與記錄／實際落差核對

2026-08-14 更新：**UR-TODO-046 正式結案，狀態標記為 CLOSED。** Final Audit（Review Mode，唯讀盤點）逐一比對 Repository 實證（git history、程式碼、測試、正式部署站點），確認核心 attribution／FinancialEvent／reconciliation／persistence／safety contract 已全數完成：FinancialEvent Ledger foundation、attribution calculator、reconciliation、derived evidence、runtime composition、void／forward-only correction、duplicate prevention、persistence（C1／046-B／046-C1-C3C 系列）；Investment attribution（046-I1，PR #292）；Loan attribution（046-L1，PR #294）；Generic Split foundation（046-L2A/L2B，PR #296）；FX 全序列 FX-A1（PR #316）／FX-A2（PR #318）／FX-A3（PR #320）／F1A（PR #323）／F1D（PR #324）／F2B（PR #325）／F2C-1（PR #326）／F2C-2（PR #327）／**F2C-3 Preview Producer Enable（PR #328，merge commit `e27860db566c47a3d6c57716d79712a325ac8336`，一般 merge commit，未使用 admin override；Deploy GitHub Pages run `31760397904` success）**／**F2D Attribution Integration（PR #329，merge commit `6ad9f5802165f0d1b78b4dd13a151584afcbf00f`，parents `e27860db566c47a3d6c57716d79712a325ac8336`／`6363b7da97f823ce3e45e087263c498ab9c0234e`，一般 merge commit，未使用 admin override；Deploy GitHub Pages run `31786367407` success）**。F2C-3 將 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 翻轉為 `true`，因既有 `deploymentEnvironment === 'preview'` AND 邏輯未變，結果為 **Preview Producer capability ON、Production Producer capability 恆為 OFF**（已於正式部署站點以真實瀏覽器操作雙向確認：Production 展開「交易基礎」後 Producer 表單不出現，Preview 展開後表單完整可見）。F2D 落地 `fx-conversion` FinancialEventType、`fxConversionLink`（canonical identity＝opaque envelope id）、`resolveActiveFxConversionGroups()`、candidate／matched／unsupported 三態 reconciliation、zero-effect principal contribution、duplicate confirmation fail-safe、void／reconfirm（重用既有 `buildVoidEvent()`）、confirmed-delete guard、FX conversion principal 與 FX valuation 效果分離（皆有測試鎖定），schema 維持 v3 不變。`npm run test:ci` 於 `origin/main`（`6ad9f580`）重新執行確認 **1047 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**確認無任何 core production blocker**：Stop Condition 8 項（核心公式修改、schema v4 bump、F2B identity 破壞、Production gate 修改、無法單一 event 表示兩腿、conversion／valuation 無法分離、Loan/Generic Split 需重構、persistence round-trip 失敗）於前一輪 Merge Gate 審查逐項確認皆為 NO。**剩餘項目全數轉為獨立 follow-up Todo，不再留在本 Todo 底下**：FX／Loan／Generic Split confirmation lifecycle UI（見 UR-TODO-054）、Loan／Investment 的 CSV／Import Center delivery mapping（見 UR-TODO-055）、FX valuation attribution／JPY-EUR／automated pairing／進階 fee attribution（見 UR-TODO-056）、FX Production Producer enable（維持既有 Controlled Rollout 決策框架，屬獨立 product deployment decision，非新 Todo，不因 046 結案而自動觸發）。**PR #322**（Loan payment atomic contract 稽核，NO-GO development 結論）維持 Draft／OPEN，不阻擋本次 CLOSED——其自身結論已證明既有 L1 contract 已完整涵蓋 principal/interest attribution，其 disposition（Close 或作為獨立測試補強 Merge）另行處理。

2026-08-14 更新：**UR-TODO-046 FX-F2C-1 Minimal Consumer Guard 已正式完成／Merge／Production Verified（PR #326，merge commit `44fb3afb126b1d647e2b90caa2d6da6a88f9493b`）；FX-F2C-2 Manual FX Conversion Producer 開發完成，Draft PR 待架構與 Preview-enable 前審查，尚未 Merge。** F2C-2 依 FX-F2C Review 建議落地第一版 Manual FX Conversion Producer，**但不啟用正式 capability**（`FX_OPAQUE_PRODUCER_SOURCE_GATE` 仍為 `false`）。新增 `src/lib/fxConversionProducer.ts` 純函式 `buildFxConversionCreation()`（記憶體中完成 gate check、帳戶／幣別／金額／日期／fee 驗證、identity 建立、兩腿建構（重用既有 `updateTransaction()` 正規化管線）、F2B resolver 完整驗證、duplicate 偵測，全部通過才回傳三筆記錄供 App 層單一 `setState()`）與 `buildFxConversionDeletion()`（只有 `valid`-resolved envelope 才視為 active，回傳 atomic 刪除計畫）。新增 `src/components/fx/FxConversionProducerForm.tsx`（支出／存入帳戶＋金額、單一 `effectiveDate`、fee 四態預設 `unknown`、derived rate 唯讀顯示、`enabled` prop 為 UI 層 gate、`useRef`＋microtask 雙重送出防護——開發中發現同步 builder 若在 `finally` 內同步釋放 guard 會讓真實雙擊防護失效，已修正並補上真實 DOM 雙擊回歸測試）。App.tsx 新增 `createFxConversion()` handler（`gateEnabled` 由 `isFxOpaqueProducerEnabled(DEPLOYMENT_ENVIRONMENT)` 當下解析）；`deleteOpaqueTransaction()` 新增路由，`valid`-resolved FX conversion 走 atomic 刪除（一次確認、一次 `setState`，同時移除 envelope 與兩腿），非 FX 或未能 valid-resolve 的 opaque 記錄維持 F1A 既有 generic 刪除行為。`TransactionList` 未修改，第一版顯示為 2 筆一般交易列＋1 筆 opaque placeholder 列（未做 grouped row）。新增 44 個測試，`npm run test:ci` 由 975 增至 **1014 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；已於隔離本機 Preview-deploy dev server 實機驗證（未改 gate 常數）：展開「交易基礎」後畫面僅有既有一般交易表單與 Import Center，Manual FX Producer 表單完全不出現，確認 gate OFF 時 UI 正確隱藏；Production／Preview bundle 因 producer 已是真正 runtime 呼叫路徑，確認皆含 producer 程式碼（非零 caller，bundle size 由約 748KB 增至約 758KB，屬預期行為），但 gate 常數本身確認仍為 `false`。**明確不包含**：F1D gate 開啟、Preview enable、Production enable、`fxConversionAttribution`、`FinancialEvent` FX 接線、reconciliation candidate/matched、zero-effect attribution、其他貨幣對、CSV／Import Center FX 支援、grouped transaction list UI、新 transaction type、`transfer` 語意修改、schema migration、persistence architecture 修改、Investment／Loan／Generic Split 修改、AI Decision／Rebalance、Firebase／Worker、PR #322。**F2C-2 建立完整 Producer 程式碼與雙層 gate，但 Production／Preview 目前皆仍無法真正建立 FX conversion；Preview enable 仍須另一個獨立、明確授權、單獨審查的 PR。UR-TODO-046 整體仍 OPEN。**

2026-08-13 更新：**UR-TODO-046 FX-F2C Manual FX Conversion Producer Contract Review 已完成（Review Mode 唯讀盤點）；FX-F2C-1 Minimal Consumer Guard 開發完成，Draft PR 待架構審查。** FX-F2C Review 完整盤點交易建立 pipeline（現有 `createTransaction` 只建構單筆、`normalizeCandidate()` 為 closed-whitelist 純函式、`setState()`→`writeState()` 天然支援單一原子提交多筆記錄）、帳戶餘額／收支／Household Liquidity consumer、F1A／F1D／F2B 既有模組與交易刪除契約，用具體程式碼路徑證實：現有四個 `TransactionType`（`income`／`expense`／`transfer`／`adjustment`）沒有一個能乾淨承載 FX conversion 兩腿語意——`adjustment` 恆為加無法表示扣款，`transfer` 明確拒絕跨幣別（`validateTransferAccounts()`）且為單一記錄模型；若暫用 `expense`（source）／`income`（destination），帳戶餘額方向正確，但 `transactionCashFlowSummary()` 會把兩腿誤算成 household expense／income（無幣別換算），TWD leg 還會被 `transactionReconciliation.ts` 靜默判定成普通 `external-expense`，污染淨值成長歸因。判定 **GO C — Producer 不得先裸上線，須與 Minimal Consumer Guard 同 Sprint**。使用者拍板：additive FX leg metadata，不新增第五種 type、不重定義 `transfer`。FX-F2C-1 依此落地：`FinancialTransaction.fxConversionLeg?`（`{ conversionId, role: 'source' | 'destination' }`，比照 `investmentAttribution`／`loanAttribution` 慣例加法式保留，malformed 整個丟棄不變 opaque，`TRANSACTION_SCHEMA_VERSION` 維持 `2`）；`transactionCashFlowSummary()` 排除帶有效 FX leg 標記的交易（比照 `transfer` 零效果慣例，`deriveTransactionAccountBalances()` 完全未修改）；`transactionReconciliation.ts` 新增 unconditional guard，FX leg 一律 `unsupported`／`fx-attribution-unsupported`，TWD／USD source／destination 四組合對稱，永不變 candidate／matched、永不產生 external-income/expense；`fxConversionIdentity.ts` 新增純函式 `findLinkedFxConversionId()`（只認 `valid`-resolved envelope 為 active），供既有 `deleteTransaction` handler 阻擋單獨刪除被 active FX conversion 引用的交易並提示改用完整換匯記錄流程；`deleteOpaqueTransaction()` 本身未修改（atomic FX delete 留給 F2C-2）。F1D gate（`FX_OPAQUE_PRODUCER_SOURCE_GATE = false`）未觸碰。新增 16 個測試，`npm run test:ci` 由 959 增至 **975 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；Production／Preview bundle 皆確認不含任何 producer 相關字串。**明確不包含**：producer builder、Manual FX 表單、producer UI、opaque write path、F1D gate 開啟、atomic FX delete、fee UX、double-submit guard、`fxConversionAttribution`、`FinancialEvent` FX 接線、schema migration、Household Liquidity 公式修改、PR #322。**F2C-1 只是最小 consumer safety boundary，不代表 producer 已被授權；F2C-2 Producer Sprint 仍需另行明確授權。** UR-TODO-046 整體仍 OPEN。

2026-08-10 更新：**UR-TODO-046-L2C Cross-Version Sync Recovery & Status Contract Audit 與 L2C-P0 Sync Status Contract Fix 已正式完成。** PR [#298](https://github.com/hyc640110/family-universal-rebalance/pull/298) 已由使用者授權正常 Merge，merge commit `af79903f547f498194cbe9b383a90cabdf28afdd`（`mergedAt: 2026-08-10T14:16:08Z`；`mergedBy: hyc640110`）；PR CI Verification／`verify` run `31396033551` success，Deploy GitHub Pages run `31397236443` success，Production HTTP 200。L2C Audit 確認 local Ledger v1／remote Firebase Ledger v2 的 mixed-version reject 是既有 fail-safe contract，且先前「目前支援 v2」是舊 v2 bundle 持久化 `syncMeta.status` 的 stale text，無 localStorage／Firebase 資料損毀證據。L2C-P0 將 runtime failure 改為不持久化、依目前 runtime facts 重建；schema mismatch UI 明確區分 local／remote schema、writer schema v3、supported versions v1／v2／v3。`schema-version-mismatch`、`unsupported-future-schema`、`event-id-collision` 形成 structured reject taxonomy；mixed merge 維持 reject／no-PUT／no downgrade，download reject 維持 local unchanged。**明確未開始** migration、v1→v3／v2→v3 conversion、cross-version semantic merge、authoritative-side selection、recovery workflow 或 Ledger rewrite。UR-TODO-046 整體維持「部分完成／後續待評估」；上述 recovery 仍需使用者另行產品決策與明確授權，FX attribution、Loan UI／CSV／Import Center 與其他 consumer mapping 亦仍為 Remaining Boundary。

2026-08-10 更新：**UR-TODO-046-L2C-P1 forensic conclusion 與 L2C-P2 Firebase Missing-Ledger Compatibility Guard 已正式完成。** P1 的唯讀 Production raw-state evidence 證實已盤點的 local Ledger 為 schema v1、`financialEvents: []`，Firebase UID raw state 亦完全沒有 Ledger 欄位，兩端沒有任何可 recovery 的 FinancialEvent event；因此不需 authoritative-side selection、recovery、schema conversion 或 deterministic union。P2 PR [#300](https://github.com/hyc640110/family-universal-rebalance/pull/300) 已由使用者授權正常 Merge，merge commit `9a4463b75564dfce3b73c5f57c6edb53118792af`（`mergedAt: 2026-08-10T16:40:00Z`；`mergedBy: hyc640110`）；CI Verification／`verify` run `31409415184` success，Deploy GitHub Pages run `31410135891` success，Production HTTP 200。P2 僅新增 runtime-only `missing-ledger` fail-safe：remote 同時缺少 `financialEventSchemaVersion` 與 `financialEvents` 時，在 merge、synthetic Ledger、remote normalize／apply、`flushDrafts()`、local persistence 與 Firebase PUT 前停止；不得改 local `financialEvents`、schemaVersion、`financialEventAttributionStartDate`、sync baseline 或 remoteMeta，也不得持久化 status。v1／v2／v3、future schema 與 event-id collision taxonomy 不變。**明確不包含** migration、recovery、conversion、cross-version semantic merge、authoritative-side selection 或 Firebase 新功能。Firebase 跨裝置同步已規劃退役；若需後續處理，只能掛入既有 UR-TODO-001 的唯讀 retirement decision，不新增重複 Todo。

2026-08-13 更新：**UR-TODO-046 FX-A3 Foreign Cash Producer / Snapshot Integration 已完成／Merge／Production Verified。** PR [#320](https://github.com/hyc640110/family-universal-rebalance/pull/320) 已正常 Merge，merge commit `46d7b25a6c0f4bf56464d9aaa4a7e6aadebd5b0e`（parents：`b9abbb0ba8bc0195a94ba255a43257689c592ed7`、`57ce13a3679d5c74141f7f477b1de6eb2c6dfb91`；`mergedAt: 2026-08-13T09:42:23Z`；`mergedBy: hyc640110`；正常 merge commit，未使用 admin override）。PR CI Verification run `31623622367` success；Merge 後 Deploy GitHub Pages run `31687807762` success（`event=push`、head 與 merge commit 一致）；Production HTTP 200／`environment=production`／asset `index-BQwS4psK.js`，Preview HTTP 200／`environment=preview`／asset `index-CIIiw0Ut.js`，isolation 正常。 Repository 唯讀盤點先確認並修正真實存在的 mixed-currency naked-sum Production bug（`financialAccountLiquidTotal()`／`financialAccountNetWorthContribution()` 先前把非 TWD 帳戶原幣 balance 直接裸加進 `cash`／`totalAssets`／`netWorth`）。使用者拍板兩項產品決策：(1) Canonical TWD Totals Strategy = A——無法安全轉換為 TWD 的外幣帳戶必須讓相關完整 totals 標記 unavailable，不得裸加、不得靜默排除後假裝完整、不得猜 stale/missing rate；(2) FX-A3 MVP UI Strategy = A——不新增任何 UI。新增純函式 `deriveCanonicalNetWorthTotals()`（`src/lib/canonicalNetWorthTotals.ts`），完全重用 FX-A1 既有 `deriveForeignCashValuation()`／`selectUsdTwdReferenceCloseRate()`；`App.tsx` 的 `calculateMetrics()` 改為呼叫此函式取得 canonical totals，並在 snapshot 建立當下（`calculateMetrics()` 之後、`netWorthSnapshotFromTotals()` 之前）把 producer 產出的 pinned `fxValuations` 與新 availability 欄位一併傳入——先前 `App.tsx` 呼叫 `netWorthSnapshotFromTotals()` 從未傳入第三參數，FX-A1 的 `fxValuations` 欄位至此才第一次被實際點亮。`NetWorthSnapshot` 新增加法式 optional 欄位 `cashAvailable`／`totalAssetsAvailable`／`netWorthAvailable`（`src/lib/netWorthHistory.ts`），欄位缺席一律視為 legacy／unknown／available，不回填、不重算、不改寫既有 snapshot；provider revision／rate refresh 不改寫已 pinned 的歷史 snapshot（沿用 FX-A1 既有 fail-safe，已有測試鎖定）。無 schema version bump、無 Backup version bump、無 migration、無 historical rewrite。**明確不包含**：任何新 UI、FX-A2 startup／render auto-fetch（新增 regression test 鎖定 `App.tsx` 不 import `cbcFxProvider`）、Household Liquidity（`householdLiquidityInputAdapter.ts` 完全未修改）、FX attribution（`netWorthAttribution.ts`／`runtimeAttributionComposition.ts` 完全未修改，唯讀盤點已確認兩者只被動讀取 `snapshot.netWorth`／`.date`，不需因 canonical totals 計算方式改變而調整）。新增 16 個測試（`tests/canonicalNetWorthTotals.test.ts`、`tests/fxA3NoAutoFetchRegression.test.ts` 新檔，`tests/fxValuationPersistence.test.ts` 擴充 2 項），涵蓋 TWD-only regression、mixed-currency 非裸加防呆、missing/stale rate、unsupported currency、invalid balance、帳戶刪除無 orphan valuation、availability cascade（cash unavailable → totalAssets／netWorth unavailable）、localStorage／JSON Backup round-trip、legacy snapshot unchanged、no auto-fetch regression。`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功。**已於正式 Production 與 Preview 環境（`https://hyc640110.github.io/family-universal-rebalance/`／`.../preview/`）實測驗證**：TWD 100,000＋USD 1,000（匯率 31）正確顯示總資產 **13.1 萬元（131,000）**，不再是裸加的 **10.1 萬元（101,000）**；移除匯率後正確顯示 10 萬元（USD 帳戶被排除而非裸加或猜值，`cashAvailable=false`）；snapshot pin、rate revision 不改寫已建立 snapshot、legacy snapshot 不回填、no startup／render auto-fetch（`fx-rates`／`cbc` 網路請求數 = 0）均已驗證；Production bundle 確認不含 PR #320 內容混入、Preview bundle 確認正確反映 PR #320 內容。**UR-TODO-046 整體仍 OPEN，本次完成的是 FX-A3，不代表整體結案。**

2026-08-13 更新：**UR-TODO-046 FX-F1A 已完成／Merge／Production Verified；FX-F1B Consumer Guard Audit 與 FX-F1C Producer Rollout Contract Review（皆 Review Mode 唯讀盤點）已完成；FX-F1D Controlled Producer Feature Gate Foundation 開發完成，Draft PR 待架構審查。** FX-F1A（PR #323，merge commit `0c52670`）建立 `OpaqueFinancialTransactionEnvelope` domain-neutral discriminator，讓 `FinancialTransaction` 層未來能安全導入目前 client 無法理解的新經濟語意（不限 FX）而不 silent drop；`normalizeTransactions()` 三分（known／explicit opaque／malformed），`AppState.opaqueTransactions` 與 `transactions` 分開的加法式必要欄位，`serializeTransactionCollection()` 於持久化邊界合併回單一 `transactions` 欄位。FX-F1B 逐一核對 account balance、cash-flow、reconciliation、runtime derived evidence、runtime attribution composition、Investment、Loan、Generic Split、Household Liquidity 等既有 consumer，確認全數以 `readonly FinancialTransaction[]` 型別簽章隔離，opaque 在編譯期即無法傳入計算，**不需要任何 consumer production code 修改**；判定 **NO-GO C — Producer Rollout Blocked**：真正 blocker 是 pre-F1A／stale tab client 會在 boot-time hydration write 或任何 `writeState()` 靜默摧毀未知的 opaque 記錄（已用 `git show` 直接比對 pre-F1A 版原始碼證實此路徑，非推測）。FX-F1C 進一步評估 Minimum Reader Version Gate、Producer Capability Version、Build/Stale-Tab Detection 三案，逐一證實**任何 persistence-layer 相容性設計都無法 retroactively 保護已部署、不會再更新的 client**（SPA 架構性限制：保護機制＝新程式碼，舊 client＝沒有新程式碼，兩者邏輯互斥），列為正式 architecture constraint；就 retroactive protection 而言判定 NO-GO，改採 Controlled Rollout Policy（narrow feature gate＋人工 rollout SOP 降低風險，非 absolute guarantee），明確不建立 general persistence concurrency guard。FX-F1D 依 F1C 建議落地為 **Code Constant Narrow Gate**：新增 `src/lib/fxOpaqueProducerGate.ts`，`deriveFxOpaqueProducerCapability(sourceGateEnabled, deploymentEnvironment)` 為長期 contract（`sourceGateEnabled && deploymentEnvironment === 'preview'`），`isFxOpaqueProducerEnabled()` 為唯一正式入口，讀取 hardcoded `FX_OPAQUE_PRODUCER_SOURCE_GATE = false`（本 Sprint 維持 `false`，未來要開放僅限 Preview 亦須獨立 PR）；第二層重用既有 `environmentBoundary.ts`／`environmentIdentity()`，未新增第二套環境判斷邏輯。**未新增任何 Vite env**（`.env.production`／`.env.preview-deploy`／`environment-boundary-check.mjs` 皆未修改——本次 gate 純粹是 source constant，不需要 build-time env 變數）。開發中發現一個與 F1D 本身無關但必須一併修正的既有缺口：`tests/transactionOpaqueCompatibility.test.ts`／`tests/transactionOpaquePlaceholderUi.test.ts`（F1A 既有 17 個測試）自 PR #323 Merge 以來從未被 `npm run test:ci` 實際執行（僅存在於未被 `test:ci` 呼叫的獨立 `test:transactions` script），已補入 `test:ci:unit-ts`。新增 9 個 F1D 測試，`npm run test:ci` 由 889 增至 915 tests pass（0 fail）；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；Production／Preview bundle 皆確認不含任何 `fxOpaqueProducerGate` 相關字串（無 producer 呼叫此模組，Vite tree-shaking 天然排除，比「bundle 內含但顯示停用」更強的 Production OFF 證據）。**明確不包含**：`fxConversionAttribution`、第一個 opaque FX producer、FX producer UI、FX rate provider／valuation、Investment／Loan attribution、Generic Split、`FinancialEvent` schema、`TRANSACTION_SCHEMA_VERSION` bump、persistence contract 修改、general concurrency guard、`storage` event、BroadcastChannel、revision token、minimum-reader-version gate、pre-F1A stale client 保護（F1C 已證實架構性不可解）。**F1D 是 controlled-rollout risk reduction 工具，不代表已解決 legacy client retroactive protection 問題；第一個 opaque producer 仍需另行明確授權，不得因本 Sprint 完成自動解鎖。UR-TODO-046 整體仍 OPEN。**（F1D 已於後續 PR #324 正式 Merge／Production Verified，merge commit `0b3522f55425034029196e4f4e0d5f45794e74bc`。）

2026-08-13 更新：**UR-TODO-046 FX-F2A FX Conversion Attribution / First Producer Contract Audit 與 FX-F2B Pairing Identity Contract Review（皆 Review Mode 唯讀盤點）已完成；FX-F2B Pairing Identity Contract Foundation 開發完成，Draft PR 待架構審查。** FX-F2A 逐一盤點現有 FX Foundation（FX-A1/A2/A3），確認其只能證明「單一外幣現金帳戶單一時點的 TWD 估值」，完全無法證明「兩筆交易共同構成一次換匯」；判定 **GO B — Attribution Runtime Ready, Producer Identity Missing**：既有 `internal-transfer` zero-effect 契約、`transactionReconciliation.ts` 既有 `fx-attribution-unsupported` fail-safe、Investment/Loan 的 denormalized-copy-with-cross-validation 模式已足夠作為未來 attribution 語意的模板，真正缺口是 pairing identity（現有 Repository 完全沒有任何機制可以 stable、deterministic 地證明兩筆交易屬於同一次換匯）。FX-F2B 依此逐一比較 Investment／Loan／Generic Split／`FinancialEvent` 既有 identity pattern，設計並落地 pairing identity contract：**conversion identity ＝ `OpaqueFinancialTransactionEnvelope.id`**（payload 內不另存 `conversionId`，避免重複 identity）；leg identity 直接使用既有 `FinancialTransaction.id`（`sourceTransactionId`／`destinationTransactionId`，不新增 `legId`）；第一版嚴格限定 **TWD↔USD**（雙方向皆支援，不限單向，不泛化到其他貨幣對或 foreign↔foreign）；`sourceCurrency`／`destinationCurrency`／`sourceAmount`／`destinationAmount` 為 payload 內 pinned validation copy（比照既有 Investment/Loan `settlementAmount !== transaction.amount → undefined` 的交叉驗證慣例，即使 linked transaction 未來消失，payload 仍保有完整歷史事實）；`accountId` 不存於 payload，一律從 linked transaction resolve（帳戶固定單一 currency，不需要重複保存）；**executed rate 為 deterministic derived 值，永不持久化**，canonical unit 固定 `TWD per USD`，CBC reference-close rate 明確不得作為 executed rate 的 SSOT；**fee 採四態 contract**（`none`／`explicit`／`included`／`unknown`），missing fee evidence 明確 ≠ `none`，malformed `explicit` fee link 不拖垮 principal conversion（principal 與 fee evidence validity 分開判定）；raw conversion 為 immutable，修正模式為刪除重建，不建立 `replacementOfConversionId`；linked transaction 缺失時 opaque 仍 preserve、runtime 回 unsupported，不自動修復、不自動刪除。新增 `src/lib/fxConversionIdentity.ts`：`parseFxConversionPayloadV1()`（payload shape 驗證，與 F1A envelope 驗證分層——一個 valid opaque envelope 可以搭配一個 invalid FX payload，F1A 仍 lossless preserve）、`deriveFxConversionExecutedRate()`、`resolveFxConversionFeeTreatment()`、`resolveFxConversionEnvelope()`／`resolveFxConversions()`（單筆與跨筆 duplicate detection，只用 transactionId claim 衝突判斷 duplicate，不依日期／金額接近／memo／帳戶名稱／list adjacency）。**本 Sprint 完全沒有 producer、UI、`FinancialEvent` 接線或 reconciliation 修改**——`fxConversionIdentity.ts` 在 `App.tsx` 零 caller，Production／Preview build bundle 皆確認不含相關字串。新增 44 個測試（`tests/fxConversionIdentity.test.ts`、`tests/fxConversionIdentityRegression.test.ts`），`npm run test:ci` 由 915 增至 **959 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**明確不包含**：第一個 opaque FX producer、FX producer UI、`fxConversionAttribution`、`FinancialEvent` 接線、reconciliation 修改、非 TWD/USD 貨幣對、CSV／Import Center FX 支援、F1D gate 開啟（Production／Preview 皆確認仍為 OFF）。**F2B 只是 identity 分類基礎，不代表已解決任何 attribution 或 producer 授權問題；effectiveDate 精確公式與 fee `none`／`included` 的 UI 證明機制仍待未來 Producer Sprint 產品決策。UR-TODO-046 整體仍 OPEN。**

2026-08-12 更新：**UR-TODO-046 的 Generic Split Allocation Foundation、Investment buy／sell attribution core、Loan principal／interest attribution 與 FX-A1 provenance foundation 均已完成；現行 contract 足夠，沒有證據需要 Generic Split consumer。UR-TODO-046 整體仍 OPEN。** 後續僅保留 provider/source integration、foreign-cash valuation producer、FX attribution evidence/integration、conversion／realized FX 等獨立階段，以及 Loan UI／CSV／Import Center producer mapping delivery boundary；詳見下方「Remaining Boundaries」。

2026-08-09 更新：**UR-TODO-046-I1 Investment Trade Contract & Fail-safe Reconciliation Foundation 已正式完成。** PR [#292](https://github.com/hyc640110/family-universal-rebalance/pull/292) 已 Merge，merge commit `b8621a0bf5e13a7666b360829e276d6d87019a44`，`mergedAt: 2026-08-09T06:54:31Z`；Deploy GitHub Pages #339（run `31299929750`）success，head SHA 一致，Production HTTP 200。完整正式 TWD buy／sell 對應 `investment-buy`／`investment-sell` 且本金 contribution = 0；一般 `income-other` 保留 `external-income`。fee／tax 僅在 stable `costId`、`settlementCostTreatment: independent` 與唯一 trade 關聯皆可證明時才扣除一次；included／unknown／legacy／duplicate／unlinked 一律不扣除。trade 與 cash movement 只接受 explicit linkage，duplicate stable identity、Ledger confirmation／runtime derived evidence／Void 維持防重複；dividend reinvestment 中 dividend 僅計一次、buy = 0；non-TWD 維持 FX unsupported／residual，不建立 realized gain/loss contribution。無 schema bump、無 migration，localStorage／JSON Backup／Firebase／legacy normalizer 相容；已驗證 TypeScript、`test:ci`（785 unit／Risk 3／MJS 18）、Production／Preview build 與 Bundle。**UR-TODO-046 整體仍未完成**；split allocation、loan principal／interest attribution、FX attribution 保留為 Remaining Boundary，不自動啟動。

2026-08-09 更新：**UR-TODO-046-L1 Loan Repayment Contract & Fail-safe Attribution Foundation 已正式完成。** PR [#294](https://github.com/hyc640110/family-universal-rebalance/pull/294) 已 Merge，merge commit `b88c35511be509a84ba756a9a075df6d047154ad`（`mergedAt: 2026-08-09T17:01:56Z`、`mergedBy: hyc640110`、使用既定 admin merge 例外）；Deploy GitHub Pages run `31325341109` success，head SHA 與 merge commit 一致，Production HTTP 200。範圍：加法式 `FinancialTransaction.loanAttribution?`（`repayment`／`disbursement`／`cash-movement`），以及 FinancialEvent schema v2 的 optional `componentLink`、完整 group 驗證、atomic group confirmation、component Void／fresh group re-recognition。完整 TWD repayment 的 principal contribution = 0；interest／fee／penalty 只有完整明示 component 才各扣一次；disbursement = 0；20,000 repayment（principal 15,000＋interest 5,000）只產生 `-5,000`，不會另有 `external-expense -20,000`。`componentId` 在同一 loan identity domain 跨 payment 不得重複；任何正式 group 寫入必須由 `appendFinancialEventGroup()` 自行重跑完整 contract 與 linkage 驗證；只有完整、全部 posted 的 group 可 confirmed，pending／mixed／excluded／void component 令整組失效。缺 loanId、paymentId、componentId、component 合計、唯一 cash movement linkage、TWD、完整 group 或 stable identity，一律 unsupported／residual；沒有正式 Loan contract 的 `expense-housing`，即使有既有 linked `external-expense` Ledger event，亦不得因文字或 generic taxonomy 產生 contribution。v1 Ledger 維持可讀；v1/v2 Firebase Ledger 混合拒絕；localStorage／JSON Backup／Firebase／legacy transaction normalizer 加法式相容，無 migration；不自動更新 Loan principal。已驗證 788 unit／Risk 3／MJS 18、TypeScript、Production／Preview build、Full Bundle 22/22、Lite Bundle 6/6 與 `git diff --check`；最終獨立審查 PASS、Merge Blocker：無。**不包含** Loan UI、CSV／Import Center mapping、split allocation、FX attribution、Investment I1 重構、holding replay、realized gain/loss、Household Liquidity、CLEC、AI Decision、Rebalance、Dashboard 或 Production 既有資料。UR-TODO-046 整體仍為部分完成；split allocation、FX attribution，以及尚未授權的 Loan UI／CSV／Import Center consumer mapping 保留 Remaining Boundary。

- 優先級：（已結案）
- 狀態：**CLOSED（2026-08-14）**——核心 attribution／FinancialEvent／reconciliation／persistence／safety contract 全數完成：Ledger foundation（C1／046-B／046-C1-C3C）、Investment（046-I1，PR #292）、Loan（046-L1，PR #294）、Generic Split foundation（046-L2A/L2B，PR #296）、FX 全序列 FX-A1/A2/A3、F1A/F1D、F2A-F2D（PR #316/#318/#320/#323/#324/#325/#326/#327/#328/#329，最終 `origin/main` = `6ad9f5802165f0d1b78b4dd13a151584afcbf00f`）。FX Production Producer 依既有 ADR-010／ADR-013 Controlled Rollout 政策維持 OFF、Preview 維持 ON，此為獨立 rollout 決策而非 046 驗收條件。UR-TODO-043-B 依賴已解除。**剩餘 delivery／future enhancement 項目已全數移出，轉為獨立 Todo**：confirmation lifecycle UI 見 **UR-TODO-054**；Loan／Investment CSV／Import Center delivery mapping 見 **UR-TODO-055**；FX valuation attribution／JPY-EUR／automated pairing／進階 fee attribution 見 **UR-TODO-056**。PR #322（Loan NO-GO development 稽核）維持 Draft／OPEN，不阻擋本次結案，disposition 另行處理。
- 提出日期：2026-07-30
- 結案日期：2026-08-14
- Phase 1 唯讀盤點日期：2026-07-30（Claude Code，Review Mode，未修改任何檔案，基準 `origin/main` HEAD `a649cf361f65724eb35b2db63a8477a4189b2574`／PR #190）

- **C1 已完成（2026-08-02）**：PR [#238](https://github.com/hyc640110/family-universal-rebalance/pull/238)（`feat/ur-todo-046-financial-event-ledger-c1`）已由使用者最終授權 Merge，merge commit `ef42c2408c989bc56c4ee1d31986161c7628ed2f`，`mergedAt: 2026-08-02T09:51:20Z`。建立 forward-only Financial Event Ledger contract／normalization 與 persistence foundation，範圍嚴格限於 AppState、localStorage、JSON Backup／Full Restore。future schema payload 採 opaque fail-safe，不降級、不 migration、不改寫；linked transaction 僅接受現有 taxonomy 可安全證明的語意，manual event 不得帶 `transactionId`，同一 transactionId 不得被多個有效 linked events 重複消費。未新增 split allocation schema。
- **C1 明確不包含**：Firebase Financial Event Ledger synchronization（現有 Firebase root PUT 不具 mixed-version Ledger 安全性，須另開重大階段）、migration、legacy transaction／snapshot rewrite、attribution calculator、事件輸入 UI、AI Decision／Rebalance／Household Liquidity consumer wiring 或 Production 部署。
- **046-B 已完成（2026-08-02）**：PR [#240](https://github.com/hyc640110/family-universal-rebalance/pull/240)（`feat/ur-todo-046-b-attribution-calculator`）已 Merge，merge commit `d61e0aa270bf006acb7000e2c1b3be0fc0f68264`，`mergedAt: 2026-08-02T10:11:19Z`。新增純 `deriveNetWorthAttribution()` calculator／quality model，品質狀態為 `unavailable`、`snapshot-only`、`partial`、`reconciled`；輸出 classified contribution 與 explicit unexplained residual，後者不得宣稱為 market effect。無 schema、persistence、Firebase、migration、UI、AI Decision／Rebalance／Household Liquidity consumer wiring。
- **046-C1／C2 已完成（2026-08-02）**：PR [#242](https://github.com/hyc640110/family-universal-rebalance/pull/242)（`feat/ur-todo-046-c-transaction-reconciliation`）已 Merge，merge commit `b8b9a4d212917444e313ef22649461a843273bdb`，`mergedAt: 2026-08-02T12:12:48Z`。新增純、deterministic、唯讀 classifier／diagnostic；每筆 `FinancialTransaction` 唯一回傳 `matched`、`candidate`、`unsupported`、`ambiguous`、`duplicate`、`invalid` 之一。安全候選限於既有 taxonomy 可證明的非股息收入、股息、非投資支出、同幣別帳戶轉帳與 adjustment；investment／loan／FX／不明分類不猜測，維持 unsupported。有效 linked event 為 matched、void 不消費、兩個以上有效 linked event 為 duplicate、相似 manual event 為 ambiguous；pending linked 不是 completed-period evidence。**未改 schema、persistence、Firebase、JSON Backup、migration、Ledger 寫入、calculator input／quality、UI、AI Decision、Rebalance 或 Household Liquidity。**
- **046-C3A 已完成（2026-08-02）**：PR [#244](https://github.com/hyc640110/family-universal-rebalance/pull/244)（`feat/ur-todo-046-c3a-derived-evidence`）已 Merge，merge commit `0fd1955bfe6267e55072bf2278114f70aa11f98e`，`mergedAt: 2026-08-02T13:15:09Z`。新增純 runtime `deriveRuntimeDerivedAttributionEvidence()`；只把 C1／C2 `candidate` 依 `Asia/Taipei` canonical calendar-day `openingSnapshot.date < effectiveDate <= closingSnapshot.date` 轉為帶 `derived-transaction` provenance 的 derived evidence。可納入 external income、external expense、dividend、internal transfer（零效果）、adjustment（零效果）；matched／duplicate／ambiguous／unsupported／invalid 一律排除。**未將 derived evidence 送入 `deriveNetWorthAttribution()`，未改 calculator output／quality，無 Ledger write、schema、persistence、Firebase、JSON Backup、migration、legacy rewrite、UI 或 AI Decision／Rebalance／Household Liquidity wiring。**
- **046-C3B 已完成（2026-08-05）**：PR [#246](https://github.com/hyc640110/family-universal-rebalance/pull/246)（`feat/ur-todo-046-c3b-attribution-composition`）已由使用者最終授權 Merge（ChatGPT 完成架構審查、人工財務案例驗收後正式核准，Claude Code 執行 `gh pr merge --admin` 因 branch protection 審核人數限制），merge commit `c30db10b69f7f1b3a8c88390028f4abac46246a4`，`mergedAt: 2026-08-04T16:49:54Z`。新增 `src/lib/runtimeAttributionComposition.ts`，實作 runtime attribution composition layer，正式契約：
  1. `netWorthChange = ledgerContribution + derivedContribution + unexplainedResidual`。
  2. Ledger evidence 優先於 derived evidence。
  3. 只有 C1／C2 `reconciliation candidate` 才能產生 derived contribution；`matched`／`duplicate`／`ambiguous`／`unsupported`／`invalid` 一律不產生。
  4. 同一 `transactionId` 最多計算一次 derived contribution。
  5. 正式日期契約沿用 C3A：`openingSnapshot.date < effectiveDate <= closingSnapshot.date`，固定 `Asia/Taipei` calendar-day；`openingDate == closingDate` 為合法 zero-length attribution period；`openingDate > closingDate` 為 invalid／unavailable。
  6. `adjustment`：contribution 為 0、僅供診斷，不降低 residual、不提升 quality。
  7. `internal-transfer`：contribution 為 0。
  8. 非 TWD 且無正式 FX conversion：fail-safe 排除、不納入 contribution，保留 diagnostic。
  9. `reconciled` 只代表 `unexplainedResidual` 落在 tolerance 內，不代表完整歸因、不代表使用者已確認所有來源。
  10. derived evidence 為 runtime-only，不得偽裝成 persisted `FinancialEvent`。
  **明確不包含**：schema、persistence、Firebase、migration、Backup schema change、Ledger write-back、AppState persistence change、AI Decision／Rebalance／Household Liquidity wiring、UI。Changed files 僅 `package.json`、`src/lib/netWorthAttribution.ts`、`src/lib/runtimeAttributionComposition.ts`、`tests/runtimeAttributionComposition.test.ts`，未超出範圍。Merge 前已完成安全檢查（head SHA `98f2271d8ebfbbfc7c478cad6df74461088ce6c8` 與 CI run `30928298413`（`conclusion: success`）headSha 一致、changed files 未增加）；Merge 後 `git fetch` 確認 `origin/main` 已包含本次 Merge，local `main` 以正常 fast-forward 同步，`main`／`origin/main`／`HEAD` 三者一致（`c30db10`），無 open PR、working tree 乾淨、既有固定 stash（6 筆）與 `.claude/` 皆未受影響；`Deploy GitHub Pages` run `30931019567` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 皆 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，並以 `gh-pages` 分支內容直接核對兩者 assets 路徑各自獨立（`/family-universal-rebalance/assets/`／`/family-universal-rebalance/preview/assets/`，JS hash 不同）。
- **046-C3C-A 已完成（2026-08-05）**：PR [#248](https://github.com/hyc640110/family-universal-rebalance/pull/248)（`feat/ur-todo-046-c3c-a-presentation`）已由使用者手動 Merge，merge commit `28c832b1020b8bd38845776d8177fa7f2e4c7994`。新增純顯示層 `src/lib/runtimeAttributionPresentation.ts`（`deriveRuntimeAttributionPresentation()`、`formatRuntimeAttributionMoney()`）與唯讀元件 `src/components/RuntimeAttributionProvenanceCard.tsx`，只讀取既有 `composeRuntimeNetWorthAttribution()` 輸出，不呼叫、不修改 `runtimeAttributionComposition.ts`／`netWorthAttribution.ts` 任何邏輯。於分析頁「風險」視角新增卡片，緊接 011B「防守配置狀態」卡片之後；串接既有 `state.financialEvents`／`state.transactions`／`state.accounts`（AppState 既有欄位，未新增）與既有 `netWorthHistory`（App.tsx 既有變數，經 043-C3A read-time boundary 建立）。比較期間固定為「最新兩筆淨資產快照」（`netWorthHistory.at(-2)`／`.at(-1)`），與 `deriveHistoryStats()` 的 `todayChange` 同一慣例，未發明新快照挑選規則、不與 UR-TODO-043 已定案的同日快照取值規則衝突。`reconciled` 直接讀 `attributionQuality === 'reconciled'`；zero-length period 由元件呼叫端比較 `openingSnapshot.date`／`closingSnapshot.date` 後標示「當日無比較區間」，不依賴 `composeRuntimeNetWorthAttribution()` 回傳值（該函式本身不暴露此語意）；adjustment／internal-transfer 的 0 貢獻從 `eventClassifications[].disposition`＋`type` 判讀；FX fail-safe 排除文案由 UI 自組人類可讀文字，不直接顯示 `diagnostics` 原始代碼。**未新增任何 persisted state，未觸碰 schema／persistence／localStorage／Firebase／Backup。**`npx tsc -b`、`npm run test:ci`（含新增 7 個測試）、Production／Preview build 皆成功；隔離本機 dev server 以 `localStorage` 注入測試資料實機驗證比較區間、三層 provenance、adjustment 0 貢獻標示、FX 排除文案（人類可讀）皆正確；390px 無橫向溢出；console 全程無錯誤。`Deploy GitHub Pages` run `30967726483` success，headSha 與 merge commit 一致；Production／Preview `curl` 皆 HTTP 200。
- **046-C3C-B 已完成（2026-08-05）**：PR [#250](https://github.com/hyc640110/family-universal-rebalance/pull/250)（`feat/ur-todo-046-c3c-b-session-confirm`）已由使用者手動 Merge，merge commit `d7fb5b44d4641c492c8b11b7871bf2f31891431f`，`mergedAt: 2026-08-05T02:54:55Z`。使用者已正式拍板「使用者確認」採低風險方案：只作為畫面／session 內暫時確認狀態，不寫入 Financial Event Ledger、不改 schema／persistence、不寫 localStorage／Firebase／JSON Backup、不影響下一次重新整理後的 reconciliation／attribution 計算，重新整理後狀態必須消失且不得跳出「資料遺失」警告。唯讀盤點先發現落差並停止：C3C-A 原本沒有逐筆 derived evidence 清單（`derivedContribution` 只是加總後單一數字），經使用者確認後才新增統一型別 `RuntimeAttributionEvidenceItem`（`id`、`type?`、`provenance`、`contribution: number | null`、`note`），套用到新增的 `derivedEvidenceItems`（從 `composition.eventClassifications` 篩選 `provenance==='derived-transaction' && disposition==='contributing'`）以及既有 `zeroContributionItems`／`fxExcludedItems`，三者統一資料結構。新增純函式 `src/lib/runtimeAttributionSessionMarks.ts`（`toggleRuntimeAttributionMark()`）負責 toggle 開關邏輯；`RuntimeAttributionProvenanceCard.tsx` 在每筆 derived evidence 旁新增可重複切換的「標示為合理」toggle，component-local `useState<ReadonlySet<string>>`（比照 UR-TODO-045 `showAllHistoryGrid` 先例，不提升到 `App.tsx` 頂層 state）；Ledger evidence、zero-contribution、FX-excluded 三種清單不掛此互動。文案：未標示「標示為合理」，已標示「已標示｜我目前認為合理」，區塊說明「以下為系統依現有交易記錄推測的衍生貢獻，尚未經正式記帳確認。標示僅供您本次瀏覽時參考，重新整理頁面後會清除，不會寫入任何記帳紀錄，也不會影響下一次計算。」測試已自動斷言「已正式記帳」「已寫入 Ledger」「已永久確認」「已改變歷史資料」「已改變 attribution」「儲存」「送出」等禁用語意不出現在卡片渲染輸出中。實機驗證（隔離本機 dev server，`Storage.prototype.setItem` 監測與 `read_network_requests` 檢查）：三次連續 toggle 點擊（標示第一筆→標示第二筆→取消第一筆）彼此完全獨立、全程零 localStorage 寫入、零新增 network request；點擊前後「淨值變動／Ledger 貢獻／衍生貢獻／未解釋殘差」四個數字逐字相同，證實互動不觸發任何重新計算；完整 `window.location.reload()` 後兩顆 toggle 皆回到未標示初始狀態、畫面無任何警告文字；390px 無橫向溢出，toggle 高度 44px 達觸控目標門檻。`npx tsc -b`、`npm run test:ci`（含新增 3 個測試檔）、Production／Preview build 皆成功。**未新增任何 persisted state，未觸碰 schema／persistence／localStorage／Firebase／Backup／`runtimeAttributionComposition.ts`／`netWorthAttribution.ts` 核心邏輯。**依 `007_GIT_WORKFLOW.md` §8.2，本 PR 因新增「使用者確認」全新產品語意與互動模式，不適用自動 Merge，已由使用者親自於 Preview 驗收後手動 Merge。`Deploy GitHub Pages` run `30970718416` success，headSha 與 merge commit 一致；Production／Preview `curl` 皆 HTTP 200。
- **046-C3C-C 已完成（2026-08-05）**：PR [#255](https://github.com/hyc640110/family-universal-rebalance/pull/255)（`feat/ur-todo-046-c3c-c-ledger-write`）已由使用者手動 Merge，merge commit `b424eb42da80fb7d7d1e53a49eddb656cd8553aa`，`mergedAt: 2026-08-05T13:26:13Z`。將 C3C-B 的 session-only「標示為合理」正式落地為 `FinancialEvent` 寫入路徑，與 C3C-B 既有 toggle 並存、互不取代：`FinancialEventSource` 加法式擴充新增 `'attribution-confirmation'`（**刻意不 bump `FINANCIAL_EVENT_SCHEMA_VERSION`**——唯讀盤點確認 `App.tsx` 的 `hasLocalFinancialEventLedger()` 會比對 schemaVersion 是否相符以決定是否擋下 Firebase 下載，所有既有使用者本機資料皆已帶 `financialEventSchemaVersion: 1`，若 bump 版本會讓每一位既有使用者的空 Ledger 被誤判為版本不符、永久擋下 Firebase 下載；新增列舉值屬純加法式擴充、未改變 `FinancialEvent` 物件形狀，依 013 §29.2 判斷不需要版本 bump，僅結構性變更才需要）；新增 `createFinancialEventId()`（比照既有 `createTransactionId()`／`createFinancialAccountId()` 慣例）與 `appendFinancialEvent()`（forward-only 寫入防呆，僅允許 append、偵測相同 id 一律拒絕，本次不實作撤銷／void）；新增 `src/lib/runtimeAttributionConfirmation.ts` 的 `buildAttributionConfirmationEvent()`／`confirmAttributionEvidenceAndAppend()`，重用既有 `linkedTransactionReason()` taxonomy 驗證（新匯出），確保轉換出的事件一定能通過下一次讀取驗證，驗證失敗會明確拒絕並附原因、不靜默略過。**開發中發現並修正一個必要的連帶缺口**（唯讀盤點階段未發現）：`src/lib/transactionReconciliation.ts` 的 `isEventForTransaction()` 原本寫死只認 `source === 'linked-transaction'`，若不修正，新確認出的 `attribution-confirmation` 事件永遠不會被判定為 `matched`，會與衍生證據雙重計算同一筆交易；已修正為同時接受兩種 source，範圍限定在此判斷式，未觸碰 `reconcileTransactions()` 其餘邏輯或核心 attribution 公式。UI 新增獨立於 C3C-B toggle 的「確認並正式記帳」按鈕（矩形、琥珀色實色，與既有藥丸形／深藍 toggle 視覺明顯區隔），點擊沿用本專案既有的 `window.confirm()` 不可逆動作確認慣例，對話框明確標示「不可逆」「不提供撤銷」；確認成功後該筆證據自然從「衍生證據」清單移除（因重新計算後已變成 `matched`），並新增獨立「本次已正式記帳」session-only 收據清單供畫面回饋。**按鈕與對話框文案為草案，PR 內已明確標註待審查**，使用者已於 Preview 驗收後直接指示 Merge（本次未再另行變更文案，視為使用者已接受草案內容）。新增 26 個測試（`tests/runtimeAttributionConfirmation.test.ts` 新檔 7 項，含核心連帶效果驗證——確認後交易變成 `matched`、`ledgerContribution` 與 `derivedContribution` 加總在確認前後相等；其餘測試分散於 `financialEvents.test.ts`／`financialEventPersistence.test.ts`／`runtimeAttributionProvenanceCard.test.ts`），`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功。實機驗證（隔離本機 dev server，虛構測試資料）：確認動作觸發 localStorage 正確寫入 `source: 'attribution-confirmation'` 事件；完整重新整理後 Ledger 貢獻持久化不變（與 C3C-B 的 session-only 行為形成對比，「本次已正式記帳」畫面提示區塊則正確清空）；確認前後四個歸因數字加總一致（實測 12,345 元由「衍生貢獻」轉為「Ledger 貢獻」，總額不變）；兩筆交易各自獨立確認、金額正負號正確；390px 無橫向溢出，兩顆按鈕皆 44px 觸控高度、`getComputedStyle` 確認顏色與外形明顯不同；console 全程無 error。`Deploy GitHub Pages` run `31010188315` success，headSha 與 merge commit 一致；Production／Preview `curl` 皆 HTTP 200。**未修改 `runtimeAttributionComposition.ts`／`netWorthAttribution.ts` 核心計算公式本身**（只新增資料來源），**未影響 Household Liquidity、AI Decision、Rebalance、Dashboard**（全庫搜尋確認三者皆不 import `financialEvents`）；`financialEvents` 依 C1 既有決策仍不進 Firebase canonical payload（`SYNCABLE_TOP_LEVEL_FIELDS` 白名單未變更），本次未改變此決策。
- **Firebase Ledger Sync 已完成（2026-08-08）**：PR [#284](https://github.com/hyc640110/family-universal-rebalance/pull/284)（`feat/ur-todo-046-financial-event-ledger-firebase-sync`）已由使用者驗收後指示 Merge，merge commit `aed0d00`。唯讀盤點後使用者拍板三項產品方向：(1) 觸發時機不變——不做自動同步，`financialEvents`／`financialEventSchemaVersion` 併入既有「上傳雲端」／「下載雲端」手動按鈕，不製造特例；(2) 衝突處理採直接合併、不覆蓋——上傳／下載時取本機與雲端 Ledger 事件聯集（依 `id` 去重，輸出依 `createdAt` 再 `id` 決定性排序，避免同步指紋因插入順序不同而永遠 dirty）；(3) 本次排入開發。新增 `mergeFinancialEventLedgers()`（`src/lib/financialEvents.ts`）：雙方 schemaVersion 皆須等於目前支援版本才合併，任一方為 opaque／未來版本時整批 fail-safe 拒絕（不做部分合併），維持既有保守防呆方向，不新增 downgrade 邏輯。`SYNCABLE_TOP_LEVEL_FIELDS` 新增 `financialEvents`／`financialEventSchemaVersion`（`financialEventAttributionStartDate` 仍明確排除，本次範圍未涵蓋）。**開發中發現一個唯讀盤點階段未預見的連帶缺口**：`normalizeFinancialEventLedger()` 對每筆 linked event 的 `transactionId` 驗證，是對照同一次讀取的 `transactions` 陣列；但 `transactions` 同步仍是整份覆蓋、不參與合併，因此合併進來的事件若指向本機交易清單中尚不存在的交易，會被既有驗證靜默捨棄。使用者拍板處理方式為「偵測並警示，不阻擋」：新增 `droppedFinancialEventCount`（`stateFromFirebasePayload()` 回傳、`uploadCloud()` 內重新計算），下載／上傳成功訊息在數量 >0 時附加警示文字，說明常見原因並建議先確認雙裝置交易資料已同步一致；不擴大合併範圍到 `transactions`（明確超出本次範圍）。「下載雲端」confirm 對話框文案已調整，明確排除 Ledger 的合併例外說明（"...但不會自動合併（財務記帳事件 Ledger 除外：這一項會自動與雲端既有紀錄合併，雙邊各自獨有的事件都會保留，不會互相覆蓋）..."）；文案為草案，待使用者 Preview 驗收。新增 25 個測試（新檔 `tests/financialEventLedgerMerge.test.ts` 8 項純函式測試；`tests/financialEventPersistence.test.ts`／`tests/syncBaseline.test.ts`／`tests/syncState.test.ts` 更新既有測試以反映新的合併語意）。`npx tsc -b`、`npm run test:ci`（849 tests pass）、Production／Preview build 皆成功。**驗證限制（已於 PR 說明中揭露）**：以隔離 Preview Firebase path 用真實 idToken 手動 `fetch()` 往返（GET／PUT）確認底層機制與新欄位正確；下載雲端 confirm 對話框文案已在 Preview dev server 實機確認逐字渲染正確。但「上傳雲端」／「下載雲端」按鈕完整端對端點擊流程，**未能**在本次自動化 Browser pane 環境完成：上傳流程卡在既有（非本次修改）`flushDrafts()` 內以 `requestAnimationFrame` 實作的 `waitForDraftCommit()`，該 API 在分頁未實際顯示／合成（backgrounded）時不會觸發回呼，與本次功能程式碼本身無關；下載流程的 `window.confirm()` 對話框則被自動化工具基於安全考量刻意攔截並回傳 `false`，屬工具本身的保護機制，不代表功能有缺陷。已請使用者於一般前景瀏覽器親自完成此按鈕點擊驗證，做為 Preview 驗收的一部分（**使用者已完成驗收並指示 Merge**）。**未修改**觸發時機（仍維持手動按鈕）、`financialEventAttributionStartDate`（仍不進 Firebase）、`transactions` 同步語意（仍整份覆蓋）、`appendFinancialEvent()`（forward-only 單筆寫入，未重用於合併邏輯，合併改用獨立純函式）。因 repo 僅一名協作者、branch protection 需要審核人數，使用者於 Preview 驗收確認無問題後直接指示 Merge，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31234711268` success），Production／Preview `curl` 實測皆 `HTTP 200`，`deployment-environment` metadata 分別為 `production`／`preview`。
- **撤銷／void 唯讀盤點（2026-08-08，Claude Code，Review Mode，基準 `origin/main` HEAD `5697578`，未修改任何檔案）**：使用者已拍板「作廢標記」而非刪除，且必須與 Firebase Ledger Sync 的 `mergeFinancialEventLedgers()` 相容。比較「原事件加 `voided: boolean` 欄位」（違反 forward-only 原地修改）與「新增獨立作廢事件」（`FinancialEventSource` 新增 `'void'`＋`voidedEventId` 欄位，用新增取代修改）兩案，建議後者。盤點發現兩個原始拍板未提及、但正確落地必須一併處理的既有程式碼連帶缺口：(1) `normalizeFinancialEventLedger()` 的 `consumedTransactionIds` 追蹤只看事件自己的 `status`，不知道外部作廢標記的存在，會讓被作廢事件永久佔用 `transactionId`，導致同一交易未來若重新連結會被靜默捨棄；(2) `transactionReconciliation.ts` 的 `isEventForTransaction()` 同理不知道作廢的存在，交易會永遠卡在 `matched`、其經濟效果永久從歸因計算消失。確認 Firebase 合併相容性極佳：作廢事件對 `mergeFinancialEventLedgers()` 而言只是普通的新事件，聯集去重機制天然正確處理，forward-only＋聯集合併結構性保證作廢標記一旦存在於任一裝置就不會「復活」或被合併掉。UI 呈現、撤銷本身是否可逆、時間範圍限制三項明確不自行拍板，列出考量供使用者決策。
- **撤銷／void 已完成（2026-08-08）**：使用者四項決策全數同意——(1) 接受連同修正上述兩個連帶缺口一併開發；(2) 作廢事件設計採 `source: 'void'`＋`voidedEventId` 欄位，`type` 沿用既有 `'adjustment'`（零貢獻分類，標記本身不需要新的計算層特例），`accountId`／`amount`／`currency` 沿用原事件供稽核追蹤，`effectiveDate` 為作廢當下日期；(3) 撤銷本身維持單向、不提供復原（不做「撤銷的撤銷」）；(4) 範圍限制沿用「本次已正式記帳」session-only 收據清單這個既有 UI 天然邊界，不另建新頁面，不需要額外的時間範圍檢查邏輯。PR [#288](https://github.com/hyc640110/family-universal-rebalance/pull/288)（`feat/ur-todo-046-financial-event-void`）已由使用者驗收後指示 Merge，merge commit `7d5ee5e`。新增 `src/lib/financialEventVoid.ts`（`buildVoidEvent()`／`voidFinancialEventAndAppend()`，比照 `runtimeAttributionConfirmation.ts` 先例，組合既有 `appendFinancialEvent()`）：找不到目標事件、目標已被作廢過皆明確拒絕並附原因。`financialEvents.ts` 新增 `EVENT_SOURCES` 的 `'void'` 值與 `voidedEventId` 欄位（皆為加法式擴充，不 bump schema version），並新增共用純函式 `collectVoidedEventIds()` 修正上述缺口 (1)：`normalizeFinancialEventLedger()` 現在會先掃描一次原始資料收集作廢 id 集合，被作廢的事件不再佔用 `consumedTransactionIds`。`runtimeAttributionComposition.ts` 在 evidence 建立與 `reconcileTransactions()` 呼叫前，用同一個 `collectVoidedEventIds()` 過濾掉作廢標記本身與被作廢的原事件，一次解決缺口 (2)：不需要碰 `netWorthAttribution.ts` 核心公式，也不需要碰 `transactionReconciliation.ts`（過濾已在呼叫端完成）。UI：`RuntimeAttributionProvenanceCard.tsx` 的「本次已正式記帳」收據列新增「撤銷」按鈕（矩形深紅色，與既有琥珀色「確認並正式記帳」按鈕視覺區隔），沿用 `window.confirm()` 慣例，作廢後收據從清單移除、底層交易於下次重新計算自然變回 `candidate` 並重新出現在「衍生證據逐筆清單」；「確認並正式記帳」對話框文案同步更新（移除已失真的「本次不提供撤銷功能」）。新增 17 個測試（新檔 `tests/financialEventVoid.test.ts` 5 項；`tests/financialEvents.test.ts`／`tests/runtimeAttributionComposition.test.ts`／`tests/financialEventLedgerMerge.test.ts`／`tests/runtimeAttributionProvenanceCard.test.ts` 擴充），`npx tsc -b`、`npm run test:ci`（864 tests pass）、Production／Preview build 皆成功。**實機驗證**（隔離本機 dev server，注入測試帳戶／交易／淨資產快照 fixture）：確認「確認並正式記帳」→ Ledger 貢獻 +5,000／衍生貢獻 0 → 點擊「撤銷」→ Ledger 貢獻歸零／衍生貢獻恢復 +5,000、交易重新出現在衍生證據清單 → 重新整理頁面後兩筆事件（`attribution-confirmation` 與 `void`）皆正確持久化、`voidedEventId` 正確指向原事件，console 全程無錯誤；`window.confirm()` 因自動化工具基於安全考量攔截原生對話框，於本機測試階段暫時覆寫 `window.confirm` 以驅動點擊流程（僅限本機測試資料，非真實使用者資料），對話框文案本身已先行獨立確認逐字渲染正確；Preview 部署後另以 `curl` 直接比對已部署 JS bundle 內容，確認新文案已上線、舊文字已消失。**未修改**`src/lib/clecStrategy.ts`／`src/lib/allocationPresets.ts`（不相關）、`mergeFinancialEventLedgers()`（作廢事件結構上就是普通事件，聯集合併機制原生正確處理，不需改動）。因 repo 僅一名協作者、branch protection 需要審核人數，使用者於 Preview 驗收確認無問題後直接指示 Merge，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31245365043` success），Production／Preview `curl` 實測皆 `HTTP 200`。
- **Remaining Boundaries（FX-A1 Merge 後更新）**：
  - **撤銷／void／取消確認功能**：已完成，見上方「撤銷／void 已完成」項目。單向、不提供復原；技術上未來若要支援「復原撤銷」，可用相同機制（再新增一筆指向作廢標記的新事件）擴充，非本次範圍。
  - **跨裝置衝突處理／Firebase Ledger sync**：已完成，見上方「Firebase Ledger Sync 已完成」項目。合併語意僅涵蓋 `financialEvents`／`financialEventSchemaVersion`；其餘欄位（含 `transactions`）仍為整份覆蓋，未在本次擴大範圍。
  - **批次確認／批次撤銷**：本次維持逐筆，未實作批次。
  - **Generic Split Allocation Foundation**：已完成；現行 contract 已足夠，沒有證據需要 Generic Split consumer，不再列為 active residual。
  - **Investment buy／sell attribution core、Loan principal／interest attribution**：已完成；不擴大為 foreign investment／loan、realized FX 或其他 consumer。
  - **FX-A1 provenance foundation**：已完成／Merge／Production Verified；只涵蓋 USD/TWD `reference-close` rate domain、3 日 stale policy、foreign cash valuation foundation、pinned snapshot provenance、`fxRateHistory` persistence、localStorage／JSON Backup round-trip 與 legacy snapshot compatibility／no backfill。
  - **FX-A2 CBC USD/TWD Provider Adapter**：已完成／Merge／Production Worker Deployed／Production Verified。CBC 官方 `FTDOpenData_Day` parser、`GET /fx-rates/usd-twd` normalized endpoint、callable adapter 與 `fxRateHistory` deterministic append 已進正式 main；Production Worker version `7d4221c1-691f-42e4-b1ae-0a48e40603ba` 與 Preview Worker version `b83bc7f0-3f7d-4bb3-9093-93a0b256ba44` 維持環境隔離。仍不產生 foreign-cash totals、snapshot、UI 或 attribution consumer。
  - **FX-A3 Foreign Cash Producer／Snapshot Integration**：已完成／Merge／Production Verified（PR #320，merge commit `46d7b25a6c0f4bf56464d9aaa4a7e6aadebd5b0e`）。已修正 mixed-currency naked-sum bug、canonical TWD totals fail-safe（unavailable propagation）、pinned `fxValuations` 實際點亮，並於正式 Production／Preview 環境完成實測驗證；未接入 attribution、conversion、realized FX、foreign investment／loan 或其他 consumer，未新增 UI，未修改 Household Liquidity，Worker 未修改／未部署。
  - **FX 後續獨立階段**：FX attribution evidence/runtime integration、conversion／execution、realized FX、foreign investment 與 foreign loan 均未開始，須分別唯讀盤點、產品決策與授權。
  - **FX-F1A Transaction Opaque Compatibility Foundation**：已完成／Merge／Production Verified（PR #323，merge commit `0c52670`）。建立 domain-neutral `OpaqueFinancialTransactionEnvelope`，consumer 零 blast radius。
  - **FX-F1B Consumer Guard Audit**：已完成（Review Mode）。確認既有 consumer 皆為 `readonly FinancialTransaction[]` 型別隔離，無需 production code 修改；判定 NO-GO C（真正 blocker 是 pre-F1A／stale tab client 會靜默摧毀 opaque，非 consumer 安全性）。
  - **FX-F1C Producer Rollout / Minimum-Reader Compatibility Contract Review**：已完成（Review Mode）。逐一評估三個技術方案後證實 pre-F1A／stale client 無法被未來程式碼 retroactively 保護，列為正式 architecture constraint；就 retroactive protection 而言判定 NO-GO，改建議 Controlled Rollout Policy。
  - **FX-F1D Controlled Producer Feature Gate Foundation**：已完成／Merge／Production Verified（PR #324，merge commit `0b3522f55425034029196e4f4e0d5f45794e74bc`）。落地 Code Constant Narrow Gate（`src/lib/fxOpaqueProducerGate.ts`），Production 恆為 OFF，Preview 目前亦為 OFF（source gate 未解鎖）；風險降低工具，非 absolute compatibility guarantee，未解決 F1C 已確認的 legacy-client 限制。
  - **FX-F2A FX Conversion Attribution / First Producer Contract Audit**：已完成（Review Mode）。確認現有 FX Foundation 只證明外幣現金估值，不證明換匯配對；判定 GO B，真正缺口是 pairing identity。
  - **FX-F2B Pairing Identity Contract Foundation**：開發完成，Draft PR 待架構審查（尚未 Merge）。落地 `src/lib/fxConversionIdentity.ts`（conversion identity＝envelope id、leg identity 直接用 transaction id、TWD↔USD 雙方向、executed rate deterministic derive 不持久化、fee 四態 contract）；純 identity foundation，零 producer／UI／`FinancialEvent`／reconciliation 修改。effectiveDate 精確公式與 fee UI 證明機制仍待 Producer Sprint 決定。
  - **跨版本 Ledger recovery**：L2C-P1 已以 Production raw-state evidence 確認本次兩端均沒有可 recovery 的 event，無需 recovery、authoritative-side selection、conversion 或 union；L2C-P2 已對 remote missing-ledger 加上 runtime-only protective reject。mixed-version semantic merge、v1→v3／v2→v3 conversion、migration 與 recovery workflow 仍未開始，也不得由本 Todo 自行啟動。
  - **Loan UI／CSV／Import Center producer mapping**：屬 delivery boundary，不是核心 attribution consumer gap；L1 已完成 contract／reconciliation foundation，但尚未建立任何 UI 或 import mapping，須另行授權，不新增 Todo 編號。
- **下一正式候選（待盤點，未開始）**：FX-A3 已完成；FX-F1A～F1D 已全數完成／Merge；FX-F2A／FX-F2B 唯讀盤點已完成；FX-F2B Draft PR 待架構審查與 Merge。FX-F2B Merge 後，下一候選為 Producer Sprint（manual FX 表單、two-leg creation、opaque write path、Preview-only gate enable）或 Attribution Sprint（`FinancialEvent` 接線、reconciliation 修改、runtime composition、zero-effect contribution 落地），兩者不得合併為同一 Sprint，且皆須先由使用者針對「第一個 opaque FX producer」明確授權（含 adoption window、manual upgrade SOP、Backup 前置要求，見 FX-F1D／FX-F2A／FX-F2B 各架構審查報告），不得因 gate 或 identity contract 存在而自動視為已解鎖；`effectiveDate` 精確公式與 fee `none`／`included` 的 UI 證明機制亦待產品決策。其餘候選（FX valuation attribution、foreign investment／loan，或 Loan UI／CSV／Import Center producer mapping）仍待獨立評估。**若下一候選涉及 Ledger 寫入語意、schema／persistence 結構性變更、核心 attribution 結果或 AI Decision／Rebalance／Household Liquidity 接線，屬重大產品／核心財務語意事件，須另行拍板，不得自動開始。** UR-TODO-046 整體維持「部分完成／OPEN」，不得因 FX-A1、FX-A2、FX-A3 或 F1A～F2B 完成自行標記整體完成。

- 問題：使用者希望能核對「收支與現金流中心記錄的淨儲蓄」與「淨資產歷史實際變動」之間的落差，並將淨值成長拆解為外部投入、投資報酬、負債變化等來源，而非只看總額差分。

- Phase 1 唯讀盤點結論：
  1. `NetWorthSnapshot`（`src/lib/netWorthHistory.ts`）只有 `totalAssets／netWorth／investmentValue／cash／debt` 五個總額欄位，完全沒有成因拆解；`deriveHistoryStats`／`deriveInvestmentPerformanceStats` 的 `todayChange`／`monthChange` 等統計都是總額差分，無法分辨差異來自市場漲跌或現金存入。既有 `deriveInvestmentPerformanceQuality`（`src/lib/investmentPerformanceHistory.ts`）已明確寫死 `canCalculateCagr: false`／`canCalculateXirr: false`，理由是「缺少可辨識的投資投入、提領與出售現金流」——本功能要解決的資料缺口與 CAGR／XIRR 現有缺口同源，非新問題。
  2. 「收支與現金流中心」的 `CashFlowProfile`（`src/lib/cashFlow.ts`）是單一目前生效的月度計畫，沒有歷史序列、沒有逐筆時間戳記；App 內唯一具備 `occurredAt` 時間戳的是另一套獨立的 `FinancialTransaction`（`src/lib/financialAccounts.ts`），兩套資料模型目前互不相通。即使改用 `FinancialTransaction`，仍需在 UR-TODO-046 另行設計其 UTC ISO 時間戳與 `NetWorthSnapshot` canonical 日曆日的比對契約；043-B 已完成，本 Todo 不得自行假設產品層級來源規則。
  3. `householdLiquidity.ts` 的 `dataCompleteness`（`complete／partial／insufficient`）是單一時間點輸入品質分類，語意與「跨時間比對落差」完全不同，不能直接沿用，需要全新的比對邏輯與資料來源。
  4. 全庫搜尋確認沒有既有「淨值歸因」或「記帳對帳」實作或測試；語意相近但範疇不同的既有項目為 **UR-TODO-023（月底自動對帳）**（P4，待開發，比對對象是匯入銀行交易 vs App 記帳，而非現金流計畫 vs 淨值歷史），排程時須明確與其劃清邊界，避免混淆或誤判為重複。

- 停止與升級條件判定：**已觸發**。若要落實本功能，至少需要下列其中一項屬於核心資料結構層級的變更，不能只靠新增呈現層或計算函式完成：
  - 讓 `CashFlowProfile` 歷史化（保留每期生效值），或
  - 讓淨值快照改為串接 `FinancialTransaction` 逐筆現金流，取代目前的「總額覆寫」模式。
  這兩者皆牽動 `013_HOUSEHOLD_LIQUIDITY_SPEC.md` 第 5／6／7／29 節（金額來源分類、核心輸入契約、Schema／Migration 規則），須先有獨立唯讀盤點與 Schema 影響評估，不得在同一 Sprint 內直接實作。

- 成本評估：**大（Large）**。需先解決「有無可歸因、帶時間戳的投資現金流資料」這個地基問題，而此問題目前連既有 CAGR／XIRR 功能都尚未解決；043-B 已完成，但仍不能替代 046 所需的產品與資料模型決策。

- 明確依賴：
  - **UR-TODO-043-B**（日期／時區契約）已完成，前置依賴已解除；本 Todo 仍需另行產品與資料模型決策。
  - 需先由使用者決定「記帳資料以 CashFlowProfile 月度計畫為準，還是以 FinancialTransaction 逐筆交易為準」這個產品層級問題。

- 明確不包含（本次 Phase 1）：
  - 未修改 `netWorthHistory.ts`、`cashFlow.ts`、`householdLiquidity.ts`、`financialAccounts.ts` 或任何 Production 程式碼。
  - 未建立功能 Branch、未實作任何計算邏輯或 UI。
  - 未與 UR-TODO-023、UR-TODO-043 系列產生耦合修改。

- 排程：由使用者另行決定是否／何時排入正式規格設計與 Sprint；未經針對 UR-TODO-046 的明確授權，不得建立功能 Branch 或實作。

### UR-TODO-047 負債模組與現金流固定支出清單重複計算風險盤點

- 優先級：P2
- 狀態：**已完成**（唯讀盤點，無需開發）
- 完成日期：2026-07-31
- 結論：**無實際重複計算，風險等級「低」**。`Loan.monthlyPayment` 是安全存量相關核心計算的唯一正式來源；Household Liquidity、Risk Center、Portfolio Risk、Investment Health 皆從同一原始 `loans` 陣列引用，彼此不會互相重複。固定支出清單「借款還款」項目的手動金額欄位，在 Household Liquidity 核心計算中完全被忽略、不參與任何加總，其唯一作用是有效性檢查（`linkedLoanId` 是否對應存在的借款）。既有測試（`householdLiquidity.test.ts` 測試 27）直接證明此行為。
- 衍生但未建立的低優先級候選：Cash Flow 頁面自身顯示的「每月基本支出」「建議預備金目標」等參考數字，若使用者在固定支出清單填的金額與負債模組實際 `monthlyPayment` 不同步，可能與 Risk Center 顯示的安全存量數字不一致——僅影響 Cash Flow 頁面自身呈現的參考數字，不影響驅動買賣建議與安全存量阻擋的核心欄位（`investableCash`／`safetyCashShortfall`）。日後視情況可另立獨立 Todo，本次不建立、不得與 UR-TODO-048 混淆。
- 明確不包含：未修改任何 Production 程式碼、Schema 或測試；未變更任何優先級或其他 Todo 狀態。

### UR-TODO-048 CLEC 433／442 移轉為 CLEC 策略中心純模擬模板

- 優先級：待評估
- 狀態：**全數已完成**（子階段 A～E、步驟一「明確標示」、步驟二「`allocationRoleBySymbol` 資料層清理」皆已 Merge，UR-TODO-048 正式結案，見下方唯讀盤點與開發記錄）
- 提出日期：2026-07-31（子階段 A 唯讀盤點完成日）
- 子階段 B 完成日期：2026-07-31
- 子階段 B 完成 PR：[#198](https://github.com/hyc640110/family-universal-rebalance/pull/198)（`feat/ur-todo-048-phaseb-allocation-preset-custom-only`），merge commit `ca96b8b58b7d9cb42926ce5d6dbc6164e5050862`
- 子階段 C 完成日期：2026-07-31
- 子階段 C 完成 PR：[#200](https://github.com/hyc640110/family-universal-rebalance/pull/200)（`feat/ur-todo-048-phasec-clec-simulation-template`），merge commit `8f194b02513ff251902fb8e43c1d4634d9f9a9cf`
- 子階段 D 完成日期：2026-08-01（正式條目詳見下方 **UR-TODO-048-D**）
- 子階段 D 完成 PR：[#202](https://github.com/hyc640110/family-universal-rebalance/pull/202)（`feat/ur-todo-048-phased-clec-703-5050-templates`），merge commit `5173e6a60efc1bfd66c7bee89dbae239a02bec77`
- 子階段 E 完成日期：2026-08-01
- 子階段 E 完成 PR：[#203](https://github.com/hyc640110/family-universal-rebalance/pull/203)（`feat/ur-todo-048-phasee-relabel-and-cash-target`），merge commit `87bf0188e644a4ce18542f7698d6f6cef4602d16`

- 背景：CLEC 433／442 目前作為資產頁正式配置選項，導致正式配置、策略模板與再平衡語意混在一起。已確認產品方向：資產頁未來只保留「自訂正式配置」；CLEC 433／442 移至 CLEC 策略中心，作為純模擬模板。

- 第一版明確範圍（使用者已確認）：
  - 模擬可顯示目前配置 vs 模擬目標、理論調整、可執行限制與阻擋原因。
  - 模擬為暫存／session-only，不得改寫正式 `targetWeight`、不得產生交易、不得另存為正式配置。
  - 不做固定比例策略現金、動態現金、再平衡執行紀錄或基準重設。
  - 模擬只能消費既有 Household Liquidity 正式輸出，不得自行重新計算每月基本支出、安全存量、可投資現金或借款月付金。

- 子階段 A（唯讀盤點，Claude Code，Review Mode，基準 `origin/main` HEAD `54e64fb50fd998c192a326a3604b06e6714add8a`，未修改任何檔案）已完成結論：
  - `allocationPreset` 唯一收斂點為 `App.tsx:375`（`normalizeState` 內），所有寫入路徑（localStorage、Firebase download、JSON Backup、資產頁 UI）最終皆經此正規化；App 唯一的 `setState` wrapper（`App.tsx:1070`）對每次更新都重新呼叫 `normalizeState()`，是真正的單一收斂點。
  - 資產頁 `AllocationPresetPanel`（`App.tsx:738-774`，渲染於 `App.tsx:1917`）的「確認套用」按鈕（`applyAllocationPreset`，`App.tsx:1715-1721`）是目前**唯一**可寫入 `clec-433`／`clec-442` 到 `state.allocationPreset` 的入口；`ClecStrategyCenterPage.tsx` 全篇唯讀，無寫入路徑；`clecStrategyRules.ts` 的 `allocationPresetId` 未被規則引擎實際用於決策邏輯，僅為裝飾性帶入。
  - **重要修正已納入**：子階段 B 若只遷移欄位、不同步移除資產頁 `AllocationPresetPanel` 寫入路徑，使用者仍可透過 UI 重新寫入 legacy 值，遷移不會生效。
  - 子階段 B 建議原子範圍：狀態層（`App.tsx:375` 固定回傳 `'custom'`，保留 `normalizeAllocationPreset` 本身不動，供子階段 C 的純預覽計算重用）＋ UI 層（同一 PR 移除 `AllocationPresetPanel` 互動元件，改為唯讀單行文字，並同步更新 `allocationContext.ts:23`／`ClecStrategyCenterPage.tsx:16` 文案、清除 `styles.css` 死 CSS）。不觸碰 `holdings[].targetWeight`、金額、帳戶、歷史、Backup、Household Liquidity 核心公式。
  - 子階段 C 建議最小範圍：重用既有 `AllocationSimulatorPage`（`src/pages/AllocationSimulatorPage.tsx`，已符合 session-only／不持久化邊界）、`deriveAllocationPresetPreview`（`src/lib/allocationPresets.ts`，純函式，可安全以 `'clec-433'`／`'clec-442'` 為暫時計算參數）、`deriveAllocationSimulatorFunding`（`src/lib/allocationSimulatorFunding.ts`，已預設排除受保護安全現金），僅在 CLEC 策略中心新增連結入口與選擇性的樣板套用按鈕，不新建路由或頁面元件。
  - 待盤點事項：`allocationRoleBySymbol` 欄位在 B 完成後失去實際計算用途（僅剩裝飾性顯示），是否清理未評估；`AllocationPreset` 型別將長期保留 `clec-433`／`clec-442` 合法值供 C 階段重用，此為刻意設計，非疏漏。

- 子階段 B（PR #198）已完成結論：
  - **狀態層**：`App.tsx:375`（`normalizeState` 內）改為固定回傳 `'custom'`（新增 `coerceAllocationPresetToCustom()`），取代原本會放行 `clec-433`／`clec-442` 的 `normalizeAllocationPreset(s.allocationPreset)`；`normalizeAllocationPreset` 本身未修改，保留供子階段 C 純預覽計算重用。App 唯一的 `setState` wrapper 每次更新皆重新呼叫 `normalizeState()`，此單一收斂點同時涵蓋 localStorage、Firebase download、JSON Backup 與原本的 UI 套用路徑。
  - **UI 層**（同一 PR 一併完成，落實子階段 A 點名的「重要修正」）：移除整個互動式 `AllocationPresetPanel`（CLEC 433／442 下拉選單、角色指派、套用預覽與按鈕）與其唯一寫入路徑 `applyAllocationPreset`；`keepCustomAllocation` 因失去唯一呼叫端一併移除；改為唯讀 `AllocationPresetSummary` 單行文字「目前正式配置：自訂配置」。同步修正 `allocationContext.ts` 的 `official-target` 說明文字與 `ClecStrategyCenterPage.tsx` 文案／CTA 連結，不再宣稱 CLEC 433／442 為正式配置選項；清除 `styles.css` 內對應的死 CSS。
  - **驗證**：隔離 Preview 環境（非真實使用者資料，`--mode preview-deploy` 手動啟動）以模擬 legacy 資料（`allocationPreset:'clec-433'` ＋ 3 檔持股 `targetWeight` 40／40／20）驗證遷移後 `allocationPreset` 變為 `'custom'`、`targetWeight` 與 `allocationRoleBySymbol` 完全不變，二次重新整理狀態穩定（冪等）；`test:ci` 641/641 全數通過；`npx tsc -b` 與 Production／Preview build 皆成功。Merge 後 Production 唯讀驗證：`Deploy GitHub Pages` workflow run `30625373714`（`conclusion: success`，headSha 與 merge commit 一致）；Production／Preview 以 `curl` 實測皆 HTTP 200，環境隔離與資源路徑正常；Production 資產頁與 CLEC 策略中心畫面確認唯讀文字與更新文案皆正確呈現，無殘留 CLEC 選項。**使用者已在自己的瀏覽器登入真實帳戶，確認 Production 上實際持股 `targetWeight` 未受影響**（此項超出 AI 可存取範圍的自動化驗證，由使用者本人確認）。
  - **明確不包含**：子階段 C（CLEC 策略中心純模擬模板）尚未開始，需另行下達「開始開發」指示；`allocationRoleBySymbol` 欄位清理未評估，維持原狀，保留原有型別與資料，僅失去實際計算用途（子階段 A 已列為待盤點）。

- 子階段 C（PR #200）已完成結論：
  - **AllocationSimulatorPage**：新增「套用 CLEC 442／433 權重樣板（試算）」區塊——樣板選擇器＋每檔持股角色選擇器（原型／槓桿／類現金）＋即時預覽，皆為元件內 `useState`（`templatePreset`／`templateRoles`），全程 session-only，從未讀寫 `AppState.allocationPreset`／`allocationRoleBySymbol`。預覽計算直接呼叫既有純函式 `deriveAllocationPresetPreview({preset, holdings, roleBySymbol})`（未修改）；「套用至下方模擬目標比例」按鈕只呼叫 `setTargets` 合併 `nextWeight` 進本頁既有 `targets` state，未呼叫 `onApply`／`applyAllocationPreset`、未呼叫 `setState`、未寫 localStorage／Firebase、未產生交易。
  - **角色資料來源**：因指令未指定角色資料來源、且明確禁止觸碰 `state.allocationRoleBySymbol`，經使用者確認後採用「模擬頁新增暫存角色選擇器」方案（component-local，非 AppState）。
  - **ClecStrategyCenterPage**：在 `clec-smart-rebalance`／`annual-ratio-reset` 兩張待核實策略卡片新增「前往配置模擬器試算相關權重樣板」連結，`clec-dynamic-contribution`／`one-time-target-reset` 不受影響；無新路由或新頁面元件。
  - **CSS**：恢復（非新建）子階段 B 移除的 `.allocation-preset-controls/-roles/-preview`，供本次模擬頁重用。
  - **驗證**：`workflow_dispatch` 觸發 Preview-only 部署後於隔離瀏覽器實測——套用 CLEC 442（00662 原型／00670L 槓桿／00865B 類現金）正確產生 `40/40/20/0`，套用後「比例驗證」變為「合計正好 100%」；套用前後直接讀取 `localStorage` 確認 `allocationPreset` 仍為 `custom`、`holdings[].targetWeight` 完全不變（40/38/20/1）；CLEC 策略中心兩張目標卡片正確顯示新連結。`test:ci` 645/645 全數通過；`npx tsc -b`、Production／Preview build 皆成功。Merge 後 Production 唯讀驗證：`Deploy GitHub Pages` workflow run `30672374531`（`conclusion: success`，headSha 與 merge commit 一致）；Production／Preview `curl` 實測皆 HTTP 200，環境隔離正常；Production 畫面確認模擬頁樣板區塊與策略中心連結（恰好 2 處）皆正確呈現，console 無錯誤。
  - **明確不包含**：`allocationRoleBySymbol`（AppState 正式欄位）清理仍未評估，本次未觸碰。

- **`allocationRoleBySymbol` 欄位清理唯讀盤點（2026-08-01，Claude Code，Review Mode，基準 `origin/main` HEAD `87bf0188e644a4ce18542f7698d6f6cef4602d16`，未修改任何檔案，本次僅為評估結論，未授權任何修改）**：
  - **讀寫位置**：全 Repository 僅 `src/App.tsx`（8 處）與 `src/lib/syncState.ts`（1 處，`SYNCABLE_TOP_LEVEL_FIELDS`）引用。`normalizeState()`（`App.tsx:377`）為唯一正規化路徑，涵蓋 localStorage／Firebase／Backup 全部入口；`removeHoldingAsset()`（`App.tsx:1710`）在使用者「封存已清倉」時仍主動 `delete` 該持股的角色資料，是目前唯一仍在執行的寫入路徑（非「設定」，僅清理）。`AllocationSimulatorPage.tsx`（子階段 C／E）完全不讀寫此欄位，全程使用獨立的 component-local `templateRoles`。
  - **是否已被取代**：原本用途（供 CLEC 433／442 套用時決定權重）已 100% 被子階段 C／E 的 session-only 機制取代，且子階段 B 移除 `AllocationPresetPanel` 後已無任何 UI 可再設定此欄位。**但非完全閒置**：`ClecStrategyCenterPage.tsx`「目前配置來源」卡片逐檔顯示的角色文字（`ClecStrategyCenterPage.tsx:16`，經 `deriveClecStrategyCenter()` 讀取 `state.allocationRoleBySymbol`）目前仍是 Production 上使用者看得到的真實內容，只是因 `state.allocationPreset` 恆為 `custom` 而不再影響任何計算（`rolesValid`／`blockingReasons`／`canApply` 皆與角色資料脫鉤）。
  - **清理影響**：localStorage／Firebase／Backup 三邊清理風險皆低（可安全捨棄，無相容性風險，`readState()` 既有機制可平順覆蓋舊值，Backup 匯入舊檔會靜默忽略此欄位不報錯）。**唯一有實際影響的是畫面層**：`ClecStrategyCenterPage` 的角色標籤欄需要重新設計（整欄移除或改寫死值），屬產品呈現決定，非本次盤點範圍能單方面判斷；`removeHoldingAsset()` 的清理程式碼若欄位移除需一併刪除。
  - **結論：暫不清理，維持「待評估」**。建議未來若要清理，拆成兩個原子步驟：步驟一先由使用者決定 `ClecStrategyCenterPage` 角色欄位的呈現方式並明確授權；步驟二才移除資料層（型別、`normalizeState`、`backupPayload`、`stateFromBackup`、`SYNCABLE_TOP_LEVEL_FIELDS`、`removeHoldingAsset` 對應程式碼），比照子階段 B／C 的「狀態層＋UI 層同一 PR」先例。

- **步驟一已完成（2026-08-01）：使用者決定「明確標示」而非「移除／統一」**。與 UR-TODO-003 合併規劃（詳見該條目「語意混淆解法」段落），`ClecStrategyCenterPage.tsx`「目前配置來源」卡片新增文案標示角色分類為 CLEC 模擬專用、與資產頁正式分類無關；資料層（`allocationRoleBySymbol` 型別與讀寫程式碼）**維持不動、未進入步驟二清理**。完成依據：[PR #225](https://github.com/hyc640110/family-universal-rebalance/pull/225)，merge commit `cbe5e0537d7257e94937a766fe110a2e0fcd002f`；Production 唯讀驗證通過（`curl` HTTP 200、已部署 JS bundle 內容確認含新文案）。**步驟二（資料層清理）已進入開發，見下方 2026-08-08 條目。**

- **步驟二唯讀盤點（2026-08-08，Claude Code，Review Mode，基準 `origin/main` HEAD `8269d4b`，未修改任何檔案）**：重新確認全庫讀寫位置——`syncState.ts` 仍 1 處；`App.tsx` 逐行計數為 9 處（先前記錄「8 處」），經 `git diff` 對照 2026-08-01 基準確認差異只是把 `clecStrategyCenterView` 的 `useMemo` 計算式與其依賴陣列算成同一站點或分開計算，功能性讀寫位置（型別 ×2、`defaultState`、`normalizeState`、`backupPayload`、`stateFromBackup`、`clecStrategyCenterView`、`removeHoldingAsset` 清理）共 7 個邏輯站點，自 2026-08-01 以來無變化。針對「目前配置來源」卡片呈現方式提出三個方案（a 直接移除、b 改為卡片內 session-only 選擇器、c 移除並連結至既有配置模擬器）供使用者決策；殘留資料處理三處（localStorage／Firebase／Backup）風險評估皆為低，建議直接從白名單移除、不需 migration。
- **步驟二已完成（2026-08-08）**：使用者選擇方案 c＋殘留資料方案 A。PR [#286](https://github.com/hyc640110/family-universal-rebalance/pull/286)（`feat/ur-todo-048-allocation-role-by-symbol-cleanup`）已由使用者驗收後指示 Merge，merge commit `19e60be`。`ClecStrategyCenterPage.tsx`「目前配置來源」卡片移除角色標籤顯示與說明段落，改為只顯示代號＋目標比例，卡片下方新增連到 `/tools/allocation-simulator` 的連結（重用 phase C 已完成的 session-only 角色選擇器，避免重複打造第二組角色選擇 UI）。`allocationRoleBySymbol` 從 `AppState`／`BackupPayload` 型別、`normalizeState()`、`backupPayload()`、`stateFromBackup()`、`SYNCABLE_TOP_LEVEL_FIELDS`、`removeHoldingAsset()` 全數移除，無 migration（既有正規化路徑逐欄位重建物件，舊資料殘留屬性自然被忽略）。**實作範圍比唯讀盤點估計更小**：`src/lib/clecStrategy.ts`／`src/lib/allocationPresets.ts` 完全未改動——這兩個檔案是 Allocation Simulator 既有 session-only 角色選擇器仍在使用的通用純函式，非本次清理對象；CLEC Strategy Center 呼叫端改傳固定 `roleBySymbol: {}`，因為 `state.allocationPreset` 恆為 `'custom'`，`rolesValid`／`blockingReasons` 本來就與角色資料脫鉤，行為與清理前完全一致，不需要重新設計 `deriveClecStrategyCenter()` 的通用（非 custom preset）角色驗證分支。刪除 `tests/clecRoleSemanticScopeNote.test.ts`（整份測試專門驗證即將移除的內容）。847 tests pass（849 − 2），`npx tsc -b`、Production／Preview build 皆成功；隔離本機 dev server 實機驗證卡片呈現與新連結導向皆正確（含一次瀏覽器分頁殘留舊模組狀態造成的假錯誤，以全新分頁重新驗證排除）。因 repo 僅一名協作者、branch protection 需要審核人數，使用者於 Preview 驗收確認無問題後直接指示 Merge，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31235941833` success），Production／Preview `curl` 實測皆 `HTTP 200`。

- 子階段 E（PR #203）已完成結論（使用者提出的兩項獨立小變更，合併同一 PR 處理）：
  - **樣板改名**：`allocationPresetLabel`（`src/lib/allocationPresets.ts`）唯一修改位置，`clec-703` 顯示文字由「CLEC 703」改為「7:3」、`clec-5050` 由「CLEC 5050」改為「50:50」；內部代號與 `PRESET_WEIGHTS` 數值完全未動，`clec-433`／`clec-442` 顯示文字不受影響。
  - **模擬目標比例新增現金項目**：`AllocationSimulatorPage.tsx` 以合成鍵 `CASH_TARGET_KEY = '__cash__'` 存入既有 component-local `targets` record（不需改型別、不新增 AppState 欄位），比例併入既有 100% 合計檢查，於「資產目標比例調整」編輯區與兩張既有 Donut 圖顯示；依使用者明確決定，**不**出現在「模擬差額摘要」／「模擬交易方向」清單，也不連動任何 Household Liquidity 欄位。
  - **與 CLEC 樣板套用共存（唯讀盤點觸發使用者決策）**：因 CLEC 樣板套用時三角色恆加總 100%（`cashTargetPct` 恆為 0），若不處理會讓「持股 100%＋既有現金輸入」合計超過 100%；依使用者確認的方向，套用樣板時同步將現金目標重設為 `templatePreview.cashTargetPct ?? 0`；「恢復正式目標比例」按鈕同步重設現金為 0。
  - **驗證**：`workflow_dispatch` Preview-only 部署後於隔離瀏覽器實測——樣板下拉選單顯示「7:3」「50:50」；現金欄位輸入 15%（持股合計 99%）正確顯示合計 114.00%／超出 14 個百分點；套用 CLEC 442 後現金自動歸零、合計變回 100.00%；點擊「恢復正式目標比例」現金重設為 0；補滿現金 1% 後兩張 Donut 圖正確顯示「現金（模擬）1.00%」圖例。全程直接讀取 `localStorage` 確認 `allocationPreset` 仍為 `custom`、`holdings[].targetWeight` 完全不變。`test:ci` 654/654 全數通過；`npx tsc -b`、Production／Preview build 皆成功。Merge 後 Production 唯讀驗證：`Deploy GitHub Pages` workflow run `30684568560`（`conclusion: success`，headSha 與 merge commit 一致）；Production／Preview HTTP 200 且環境隔離正常；Production 畫面確認現金列與改名文字皆正確呈現，無殘留舊文字，console 無錯誤。
  - **明確不包含**：`clec-433`／`clec-442`／`clec-703`／`clec-5050` 的權重數值與角色判斷邏輯未變；`state.allocationPreset`／`allocationRoleBySymbol`／Household Liquidity 核心公式／資金基數計算邏輯未觸碰。

- 明確不包含：子階段 A～E 與 `allocationRoleBySymbol` 欄位清理（步驟一、步驟二）已全數完成並 Merge，**UR-TODO-048 正式結案**；`AllocationRole` 型別、`roleLabel()`、`normalizeAllocationRoleBySymbol()`、`deriveAllocationPresetPreview()`（`allocationPresets.ts`）與 `deriveClecStrategyCenter()`（`clecStrategy.ts`）本身完全未變動，Allocation Simulator 既有 session-only 角色選擇器不受影響。

### UR-TODO-048-D CLEC 策略中心新增 703／5050 純模擬模板

- 優先級：待評估
- 狀態：**已完成**
- 提出日期：2026-08-01
- 完成日期：2026-08-01
- 完成 PR：[#202](https://github.com/hyc640110/family-universal-rebalance/pull/202)（`feat/ur-todo-048-phased-clec-703-5050-templates`），merge commit `5173e6a60efc1bfd66c7bee89dbae239a02bec77`
- 提出依據：使用者參考外部創作者「阿良的正二人生」與「淺談保險觀念」（作者巫品寰）兩篇公開分享的資產配置框架後提出

- 背景：

  **來源一：阿良「投資人生三部曲」**
  依「金融資產 ÷ 年生活費」倍數分三階段：
  - 累積期（未達 20 倍）：閒錢 70% 投入槓桿型 ETF（如台股正二）／30% 現金作緊急預備金與加碼金，槓桿可開到最高
  - 配置期（20～50 倍）：433 配置（40% 原型 ETF／30% 槓桿／30% 現金）
  - 自在期（超過 50 倍）：維持 433，現金部位約等於 15 年生活費緩衝

  **來源二：巫品寰「正二 50/50 策略」深度分析**
  50% 槓桿型 ETF＋50% 現金，經數據回測（夏普值、索提諾值、歷史區間報酬）論證此配置在明確趨勢（連漲或連跌）中，經年度再平衡後績效優於歐印大盤；缺點為盤整期波動耗損約為歐印大盤兩倍、費用率較高、再平衡頻率本身有爭議（作者傾向年度再平衡，理由是股市趨勢有延續性，避免比例式再平衡在股災中過早耗盡現金彈藥）。

  既有 CLEC 442／433 樣板對應「配置期」的兩種比例；本項目擬新增兩個對應「累積期」與「兩者之間」的樣板：
  - **原型 0%／槓桿 70%／類現金 30%**（暫定代號 `clec-703`）
  - **原型 0%／槓桿 50%／類現金 50%**（暫定代號 `clec-5050`）

- 範圍（沿用子階段 C 已驗證的模擬機制）：
  - 在 `clecStrategy.ts`／`clecStrategyRules.ts` 新增 703、5050 兩組策略定義（核心邏輯變更，需獨立唯讀盤點）
  - 在 AllocationSimulatorPage 的「套用 CLEC 權重樣板」區塊新增對應選項，沿用子階段 C 已建立的 session-only 套用機制
  - 是否同步在 ClecStrategyCenterPage 新增對應待核實策略卡片，待評估

- 已完成結論（PR #202）：
  - **`src/lib/allocationPresets.ts` 局部擴充**（純資料性，經使用者明確追加授權）：`AllocationPreset` 型別新增 `'clec-703'`／`'clec-5050'`；`normalizeAllocationPreset` 新增這兩個字面值辨識；`PRESET_WEIGHTS` 新增 `clec-703: {原型0/槓桿70/類現金30}`、`clec-5050: {原型0/槓桿50/類現金50}`；`allocationPresetLabel` 新增對應顯示文字。`deriveAllocationPresetPreview` 函式本體、角色分配／缺角色阻擋／重複角色判斷邏輯，以及既有 `clec-433`／`clec-442` 的數值與行為逐位元組未變。
  - **AllocationSimulatorPage**：既有下拉選單新增兩個 `<option>`，沿用子階段 C 全部既有機制（同一 `deriveAllocationPresetPreview` 呼叫、同一 session-only `templatePreset`／`templateRoles`、同一 `setTargets` 覆寫路徑），無其他改動。
  - **驗證**：`workflow_dispatch` Preview-only 部署後於隔離瀏覽器實測——指派角色後 CLEC 703／5050 預覽正確顯示 `0.00%／70.00%／30.00%`、`0.00%／50.00%／50.00%`，套用後「比例驗證」變為「合計正好 100%」；套用前後直接讀取 `localStorage` 確認 `allocationPreset` 仍為 `custom`、`holdings[].targetWeight` 完全不變（40/38/20/1）；CLEC 策略中心頁面全文確認無 `703`／`5050` 字樣。`test:ci` 652/652 全數通過；`npx tsc -b`、Production／Preview build 皆成功。Merge 後 Production 唯讀驗證：`Deploy GitHub Pages` workflow run `30683691820`（`conclusion: success`，headSha 與 merge commit 一致）；Production／Preview `curl` 實測皆 HTTP 200，環境隔離正常，console 無錯誤。
  - **明確不包含**：`allocationRoleBySymbol`（AppState 正式欄位）清理仍未評估，本次未觸碰。

- 明確不包含：
  - 不改變既有 442／433 邏輯與呈現
  - 不產生交易、不寫入 `state.allocationPreset`、不影響 `allocationRoleBySymbol`
  - 不修改 Household Liquidity 核心公式、資金基數計算邏輯
  - 不實作「再平衡頻率」相關的新機制（年度／季度／比例觸發等）——這屬於更大範圍的 CLEC 再平衡執行邏輯，非本次模擬樣板範圍

- 依賴：UR-TODO-048 子階段 A～C（已完成，提供既有模擬機制可重用）

- 開發前唯讀盤點結論與後續決定：
  1. 命名：代號 `clec-703`／`clec-5050` 維持不變；顯示文字於子階段 D 上線時暫為「CLEC 703」「CLEC 5050」，其後依使用者要求於**子階段 E**（見上方 UR-TODO-048 條目）改為「7:3」「50:50」。
  2. **唯讀盤點發現實際修改位置與提案範圍不符，經使用者明確追加授權後才開發**：CLEC 433／442 的權重定義（`AllocationPreset` 型別、`normalizeAllocationPreset`、`PRESET_WEIGHTS`）實際位於 `src/lib/allocationPresets.ts`，而非提案原寫的 `clecStrategy.ts`／`clecStrategyRules.ts`（該兩檔的 `CLEC_STRATEGIES` 是完全不同概念的手動維護陣列，與 `AllocationPreset` 型別結構上無關聯）。指令原本明確禁止修改 `normalizeAllocationPreset`，但呼叫 `deriveAllocationPresetPreview({preset:'clec-703'|'clec-5050',...})` 必然需要擴充該函式辨識新字面值，構成指令內部矛盾，已停止並回報，使用者授權「方案 1：局部擴充 `allocationPresets.ts`，僅新增資料、不變更 442/433 既有邏輯與數值」後才實作。
  3. 是否上 CLEC 策略中心「待核實策略清單」：使用者明確決定**不上**，`ClecStrategyCenterPage.tsx` 全程未觸碰，測試新增防護性斷言確認無殘留文字。
  4. 兩組樣板於模擬頁**同時並列**（同一下拉選單四個選項：442／433／703／5050），未分批處理。

### UR-TODO-012 Rebalance Scenario Simulator

- 優先級：P2
- 狀態：**部分完成／範圍縮小**（2026-08-16 Review Mode 唯讀盤點，經使用者拍板不逕行標記完成）
- 前置依賴：UR-TODO-006～011
- 2026-08-16 唯讀盤點結論：本項自建立以來僅有標題／優先級／依賴，從未記錄過逐項驗收條件（已核對 `AI_CONTEXT/` 全部歷史版本與 git log，確認無獨立規格文件可供逐項核對）。改以功能面比對現有實作：
  1. UR-TODO-048（Allocation Simulator，`/tools/allocation-simulator`）已提供 CLEC 442／433／703／5050 樣板的**靜態配置權重**情境預覽（`deriveAllocationPresetPreview()`），屬單一時間點的假設配置模擬，session-only、不產生交易。
  2. UR-TODO-058（`/tools/investment-backtest`）已提供針對**特定三資產（0050／00631L／00865B）**、三套 Excel 來源固定策略（聰明再平衡／無腦再平衡／比率再平衡）的歷史回測比較，屬時間序列模擬，但資產組合與策略邏輯皆為寫死，非通用參數化。
  3. 兩者合計已滿足「再平衡情境模擬」標題下的**部分**產品期待（特定資產組合的假設配置與歷史回測），但**未涵蓋**任意資產組合、可調整再平衡頻率／閾值參數的通用情境模擬——這是原標題可能暗示、但從未有正式驗收條件明文要求的開放範圍，因無法逐項核對，故不逕行標記完成。
- 明確不包含（縮小後）：任意資產組合、可調整再平衡頻率／閾值的通用參數化模擬（已被 048／058 覆蓋的固定樣板／固定策略範圍不重複開發）。
- **現況分類（2026-08-21，Remaining Backlog Governance Closeout）：DEFERRED / LOW PRIORITY**。Repository 無任何真實使用需求證據支持通用參數化模擬，不主動排入近期 Sprint。
- **REOPEN TRIGGER**：出現具體真實使用情境，需要超出現有 UR-TODO-048／058 能力的任意資產組合、可調頻率或可調閾值 Scenario Simulator。
- 建議：不關閉，範圍縮小為「通用參數化再平衡情境模擬」；目前無記錄在案的急迫使用需求，維持 P2 但不主動排程，待具體業務情境出現後另行 Contract Audit。

### UR-TODO-013 Investment Decision Workflow Integration

- 優先級：P2
- 狀態：**CLOSED**（2026-08-18；absorbed by subsequent Production capabilities）
- 前置依賴：UR-TODO-009
- 原始可驗證歷史：僅有標題、P2、依賴 `UR-TODO-009` 與「部分完成」；未找到獨立 specification、逐項 acceptance criteria，亦無法由現有證據完整還原最初建立日期。
- 2026-08-18 Review Mode Closeout Audit 結論：本項並非因「所有原始驗收條件均已完成」而關閉，因為原始 acceptance criteria 並不存在。後續更具體、已實作、已測試並已進入 Production 的 capabilities，已實質吸收其可合理推定的產品意圖：在 Household Liquidity 與資料品質安全邊界下，整合投資狀態、再平衡建議、CLEC 規則、執行資格、每日決策、行動導引、可解釋性與使用者決策紀錄，形成 advisory-only workflow。
- 已吸收能力：Rebalance Recommendation、Rebalance Execution Eligibility、Investment Intelligence、Daily Decision Workflow、Investment Action Center、Investment Action Explainability、CLEC Strategy Rules、Household Liquidity integration、Investment Opportunities／Dip safety boundary，以及 Rebalance Decision Journal。
- 現行產品邊界：advisory-only；data／liquidity fail closed；recommendation 與 execution eligibility 分離；不自動下單、不自動修改 holdings；Decision Journal 只記錄使用者決策意向，不代表成交。Closeout Audit 未發現屬於 UR-TODO-013 本身的 workflow dead-end。
- Future enhancement candidates（非本 Todo 未完成範圍，未自動建立新 Todo）：首頁 Investment Intelligence 主卡固定下一步 CTA；Dip 提示獨立納入 Investment Action Center 排序模型。若未來需要，須另立新 Todo。

## P3－中長期投資功能

### UR-TODO-014 CLEC 規則本身之歷史回測
- 狀態：**CLOSED／Production Verified**（2026-08-20）。組成如下：
  1. **Foundation**：completed／Production Verified（2026-08-18）
  2. **014-A（CLEC Taiwan Reference Historical Validation）**：completed／MERGED／Production Verified（2026-08-20）
  3. **014-A2（Extended Real-History Trigger Validation）**：**completed／MERGED／Production Verified**（2026-08-20，PR [#401](https://github.com/hyc640110/family-universal-rebalance/pull/401)，final head `d49bb441e1592136a25b92adcc16c3380ac2c2ea`，merge commit `3311973cbffe4910bbcc18870c3f9e41c15e4159`，見下方獨立條目）
  4. **Overall closeout**：**已完成**——014-A2 已 Merge 並經 Production 唯讀驗證（Deploy GitHub Pages run [32383019454](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32383019454) success），原本因「real-history window 內四組 preset 皆未觸發 full_rebalance」而保留的唯一缺口已補齊
- **Closure reason**：Foundation、014-A（正式 TWSE 官方歷史資料來源與驗證）、014-A2（延伸真實歷史 full_rebalance 觸發時機驗證）三項組成均已完成並 Production Verified。UI 與 transaction-cost model 依 2026-08-20 Review Mode Contract Audit 的 CONDITIONAL 決策，經本次正式 Closeout Audit 確認**不屬於** UR-TODO-014 closure requirement。**Remaining closure requirement = NONE。** 未來若需要 UI、transaction-cost model、slippage、next-day execution model，必須另立新的獨立 UR-TODO 並重新 Contract Audit，不得重新解釋為 UR-TODO-014 遺留缺口。
- 2026-08-20 **UR-TODO-014-A2 正式 MERGED／Production Verified。** PR #401 final head `d49bb441e1592136a25b92adcc16c3380ac2c2ea` 已由 `hyc640110` 於 `2026-08-20T14:55:07Z` 以一般 2-parent merge commit `3311973cbffe4910bbcc18870c3f9e41c15e4159` 合併（parents：`2e1399ffaa6b4c41564e5a0ac46dc49a289358c7`／`d49bb441e1592136a25b92adcc16c3380ac2c2ea`；未使用 admin override）；`origin/main` 正式基線更新為 `3311973cbffe4910bbcc18870c3f9e41c15e4159`。Merge 後 main push 觸發之 Deploy GitHub Pages run [32383019454](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32383019454) success（`build` job 內 `npm run test:ci` regression gate 全鏈通過、`npm run build` 成功，headSha 與 merge commit 一致；`deploy` job success），Production 唯讀確認 HTTP 200、`environment=production`、bundle 為 `index-BZLdP2-T.js`／`index-DTD1MPZn.css`（與本次 build 產物一致）。開發階段（PR Draft） Branch `feat/ur-todo-014-a2-real-history-trigger` 自 `origin/main` `2e1399ffaa6b4c41564e5a0ac46dc49a289358c7` 開出，同步至 final head `7abb630346b1ab11866aeab88f5d73ae6e1d5976`（本次治理同步 commit 之前的 final head；本次治理同步 commit 自身造成的新 final head 落差留待下一次治理同步追平）。延伸既有 Reference Validation Portfolio（prototype=0050、leveraged=00631L、cash-like=00865B，仍為 validation-only，邊界與 014-A 完全相同）的真實歷史 window 從 `2025-06-02～2025-08-29` 延伸至 `2025-06-02～2026-04-30`，沿用同一 TWSE 官方 `STOCK_DAY_AVG`／`ETF 分配收益` 唯讀 pipeline（未新增資料來源）。`scripts/clecTwReferenceDataset.ts` 的 `deriveClecTwReferencePeriods()` 由「僅處理 0050 分割停市」泛化為「處理任一參考標的的分割停市」，讓 00631L 22:1 分割（原僅 standalone evidence）正式納入主 backtest window（split-adjusted，split 當日 leveraged period return 為 -4.38pp，非未正規化的 ~-95.65% 假崩盤）。共同有效交易日由 60 增至 214、period 由 59 增至 213，fixture `datasetVersion` 由 1.0.0 升為 2.0.0，SHA-256 由 `d9c049f2f5b4045244bfa0842eea41e878839d1dfad0a116f20bd0202f36f338` 更新為 `5c143ec124492934e6e1dcb115b68b5d71414691e252d9440601164ce2221c8c`。0050 新增第二筆 in-window 除息（2026-01-22，每受益權 1.0 元，distribution-inclusive），00631L／00865B 全歷史配息仍為 0 筆，無需重查。**AC1（真實 trigger）已滿足**：`clec-5050`（target leveraged=50，threshold drift=5×significantMultiplier=2=10pp）於 `2025-09-12` 產生真實 `recommendedAction === 'full_rebalance'`（drift 10.354pp），前一有效觀測日 `2025-09-11` drift 9.818pp 仍為 `rebalance_consider`（未觸發，AC2 boundary 已鎖定並有 regression test）；四組 preset 於延伸 window 內 rebalanceCount 皆 ≥1（442／433 各 1 次於 2026-01-05；703 與 5050 各 2 次），較 014-A 的全 0 結果明確補上 real-history trigger timing 缺口。`rebalance_consider` 全程未被計為 rebalance（AC3，已測試）。`src/lib/clecHistoricalBacktest.ts`／`clecStrategyRules.ts`／`allocationPresets.ts` 三個 CLEC 核心檔案完全未修改。**開發中發現並經使用者明確授權修正 `src/lib/taiwanTradingCalendar.ts`**：延伸資料時發現 `2025-09-29`／`2025-10-24` 三檔參考標的同時無官方收盤資料，AI 依既有 fail-closed 政策先停止並回報 blocker；使用者確認並提供正式依據——`2025-09-29` 為孔子誕辰紀念日／教師節（2025-09-28 適逢週日）之補假，`2025-10-24` 為臺灣光復節（2025-10-25 適逢週六）之補假——並明確授權僅新增這兩個日期至 `CLOSED_DATES_BY_YEAR[2025]`，禁止任何「多檔同時缺資料即視為休市」的泛化推論機制、禁止新增颱風假推論、不得更動其他年份或既有判定語意；已補上 regression test（`tests/v6QuoteRefreshFreshnessConsistency.test.ts`）確認兩日為 `closed` 且相鄰交易日不受影響。此為本 Sprint 額外必要的既有 2025 年曆完整性修正，不視為擴張 CLEC contract。驗證結果：final head 的 CI Verification run [32379932816](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32379932816) success——`npm run test:ur-todo-014`（CI 11/11 pass，Foundation 未改動）、`npm run test:ur-todo-014-a`（**CI 18/18 pass**，含新增 `H2`／`I2`／`M` 三項 AC 測試）、`test:ci` 全鏈（CI 全數 pass，log 零筆 `##[error]`）、`npm run build`（含 `tsc -b`，CI production／preview 皆 build 成功）皆為 CI Linux／LF canonical checkout 實測結果。本機 Windows `core.autocrlf=true` checkout 曾因 CRLF 差異一度顯示 test C（fixture hash）與 test K（regex 比對）共 2 項假性失敗（16/18），已用 `git show HEAD:` 驗證 git 儲存內容（LF）與 CI 一致，純屬本機環境差異、非程式邏輯問題。`git diff --check` 本機獨立重跑亦 pass（CI workflow 本身未將此列為獨立 step）。Fixture canonical SHA-256（以 git 實際儲存內容計算）：`5c143ec124492934e6e1dcb115b68b5d71414691e252d9440601164ce2221c8c`。**明確不包含**：UI、route、Production code、CLEC engine、runtime historical provider、Worker API、transaction cost、slippage、next-day execution model、UR-TODO-058 整合。**PR #401 已由使用者完成 Preview／驗收並明確授權，由使用者本人執行一般 2-parent merge（未使用 admin override），詳見上方 Merge／Production facts。**
- 2026-08-20 **UR-TODO-014-A 正式 MERGED／Production Verified。** PR [#399](https://github.com/hyc640110/family-universal-rebalance/pull/399) final head `f916bacc47dd3ff3865dbbf2da0d3dc65088d21d` 已由 `hyc640110` 於 2026-08-20T13:08:10Z 以一般 2-parent merge commit `0341933a852076b5896d90f44fe351284954f942` 合併（parents：`35bb19a758f886ae2de57fc55a1bc860c65c5798`／`f916bacc47dd3ff3865dbbf2da0d3dc65088d21d`；未使用 admin override）；`origin/main` 正式基線更新為 `0341933a852076b5896d90f44fe351284954f942`。PR required CI Verification run `32364260897` success；merge 後 main Deploy GitHub Pages run [32372567517](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32372567517) success（`build` job 內含 `npm run test:ci` regression gate 通過，headSha 與 merge commit 一致），Production 已唯讀確認可正常載入。於獨立 Sprint branch `feat/ur-todo-014-a-reference-historical-validation`（自 `origin/main` `35bb19a758f886ae2de57fc55a1bc860c65c5798` 開出）新增 `scripts/clecTwReferenceDataset.ts`（純資料準備 pipeline，非 runtime provider；不在 `src/lib` 是因為它使用 `node:crypto`，`tsc -b` 的 `src` build 只允許瀏覽器安全程式碼）＋ versioned offline fixture `tests/fixtures/clecTwReferenceV1.json`（`datasetId: clec-tw-reference-v1`）＋ `tests/clecTwReferenceHistoricalValidation.test.ts`（15 tests，`npm run test:ur-todo-014-a`，已納入 `test:ci`）。**Reference Validation Portfolio v1（validation-only，非 CLEC canonical mapping、非 Production 預設組合、非 AppState role mapping、非使用者目前持股 mapping、非 UR-TODO-058 契約）**：prototype=0050、leveraged=00631L、cash-like=00865B。歷史股價唯一來源為 TWSE 官方 `STOCK_DAY_AVG`（與既有 Production 00631L／00865B 昨收價驗證機制同一官方來源）；配息資料唯一來源為 TWSE 官方 `ETF 分配收益`（`rwd/zh/ETF/etfDiv`）；皆以唯讀瀏覽器逐字擷取原始 JSON，非 AI 摘要、非第三方 adjusted close。Validation window：2025-06-02～2025-08-29（daily，Asia/Taipei，60 個共同有效交易日、59 個 period），完整涵蓋並正規化 0050 官方 4:1 股票分割（2025-06-10 最後交易日收盤 188.65、2025-06-11～06-17 停止交易、2025-06-18 回復交易 47.57，split-adjust 後單日報酬僅 +0.86%，非人工製造的 ~-75% 假跌幅）與 0050 官方除息（2025-07-21 除息，每受益權單位 0.36 元，distribution-inclusive return 採 `(P_t+D_t)/P_previous-1`）；00631L 官方 22:1 股票分割（2026-03-24 收盤 443.15、22:1 換算官方參考價 20.14，2026-03-31 回復交易；因發生於本 dataset window 之外，以獨立官方數值對做 split-normalization regression evidence，未納入主要 backtest period）。00631L／00865B 全歷史（2010-01-01～2026-08-20 查詢範圍）官方配息紀錄皆為 0 筆，00865B 並與其「本基金收益不分配」正式基金契約條款交叉核對一致，無衝突。重用既有 Production-verified Foundation `runClecHistoricalBacktest()`（未修改該檔案、未建立第二套 442／433／703／5050 規則表）跑出四組 preset 的實際歷史驗證結果（initialCapital=1,000,000、threshold={drift:5, significantMultiplier:2}）：442 totalReturnPct=25.13%／maxDrawdownPct=3.84%／rebalanceCount=0；433 totalReturnPct=21.30%／maxDrawdownPct=3.19%／rebalanceCount=0；703 totalReturnPct=29.68%／maxDrawdownPct=4.57%／rebalanceCount=0；5050 totalReturnPct=22.01%／maxDrawdownPct=3.32%／rebalanceCount=0（此 3 個月 window 內四組 preset 皆未達 full_rebalance 門檻，為真實計算結果，非人為挑選）。`npm run test:ur-todo-014`（既有 11/11，未改動）、`npm run test:ur-todo-014-a`（新增 15/15）、`npm run test:ci`、`npm run build` 全數通過。Fixture SHA-256：`d9c049f2f5b4045244bfa0842eea41e878839d1dfad0a116f20bd0202f36f338`。無 UI、無 route、無 AppState、無 persistence、無 localStorage、無 JSON Backup schema、無 Financial Event Ledger、無 attribution、無 Production CLEC symbol mapping、無 Production Rebalance、無 Household Liquidity、無 historical Worker endpoint、無 runtime historical provider、與 UR-TODO-058 無耦合、無 transaction-cost／slippage／next-day execution model 變更。
- 2026-08-20 **Closeout Audit 結論：EXTEND VALIDATION WINDOW。** Review Mode 逐項稽核確認 014-A 工程結果全數 PASS（Reference Portfolio validation-only、未污染 CLEC canonical／Production mapping、確實重用 `runClecHistoricalBacktest()`、無第二套規則表、provenance 完整、dataset SHA-256 可獨立重現、split／distribution normalization 正確、missing／NaN fail closed、npm scripts 僅新增必要項目、Production `src` 零改動）。核心缺口：2026-08-16 範圍描述明文「驗證規則本身的歷史績效**與觸發時機**」，但現有 real-history window 內四組 preset 的 `rebalanceCount` 皆為 0，只驗證了 no-trigger（hold）路徑，未驗證 full_rebalance 觸發時機在真實資料下的行為；synthetic fixture（既有 Foundation 測試）已證明觸發機制本身正確，但不能替代真實資料驗證。判定不建議直接 Closeout，也不判定為需使用者釐清（repository 內有明文可查證的產品意圖依據，非純主觀分歧），改為 **UR-TODO-014-A2（Extended Real-History Trigger Validation）**：延伸現有固定 Reference Validation Portfolio（prototype=0050、leveraged=00631L、cash-like=00865B，仍為 validation-only，非 CLEC canonical mapping／Production 預設／AppState role mapping／使用者持股 mapping／UR-TODO-058 契約）的真實歷史 window，最小建議延伸至涵蓋 2026-03 00631L 22:1 分割在內的連續區間（例如延伸到 2026-04-30 附近），讓該分割正式進入主 validation window（目前僅 standalone evidence），並重跑 442／433／703／5050，觀察是否出現真實 full_rebalance、若有則鎖定真實 rebalance timestamp 作為 regression。**A2 尚未開始開發，狀態為 PLANNED／NOT STARTED**，明確不包含：UI、route、Production code、CLEC engine 修改、runtime historical provider、Worker API、transaction cost、slippage、next-day execution model、UR-TODO-058 整合。
- 2026-08-18 Foundation 完成：PR [#382](https://github.com/hyc640110/family-universal-rebalance/pull/382) final head `b0d37c3244eabf08bcb5ff60dae2dd0145033271` 已以一般 2-parent merge commit `4205e37b1583472e681dbb35d5db4ee8e580eb20` 合併（parents：`ec49099215847eb7242b3727ecb63f4ce423a717`／`b0d37c3244eabf08bcb5ff60dae2dd0145033271`；未使用 admin override）。PR CI Verification run `32090616289`、Preview workflow_dispatch run `32090745657`、merge 後 main Deploy GitHub Pages run `32091693042` 均 success；Production source 為該 merge commit，Production HTTP 200／metadata=`production`／asset namespace 正確。Foundation 新增純 `clecHistoricalBacktest` library：caller-supplied historical returns 採百分點、period 嚴格日期順序 propagation、frictionless、max drawdown 回傳正值跌幅、invalid input fail closed。Target weights 唯一來自 `deriveAllocationPresetPreview()`；full rebalance 唯一由 `deriveClecStrategyRule()` 且 `recommendedAction === 'full_rebalance'` 觸發；`rebalance_consider` 不交易。`test:ur-todo-014` 11/11 pass 並納入 `test:ci`。無 UI、App／route／AppState、localStorage、JSON Backup、schema、Financial Event Ledger、attribution、production rebalance engine、market provider 或 Worker coupling。
- **（歷史記錄，CONDITIONAL 決策已於 2026-08-20 正式 Closeout Audit 確認生效，見上方最新條目）** UI、transaction-cost model 已於 2026-08-20 Review Mode Contract Audit 拍板為可移出 UR-TODO-014 closure requirement；正式 historical data source 已於 014-A 完成並 Merge；剩餘範圍 UR-TODO-014-A2 已完成並 Merge，UR-TODO-014 整體已 CLOSED。
- 2026-08-16 範圍縮小重新描述（原名「CLEC 歷史驗證與回測」）：聚焦**CLEC 442／433／703／5050 規則本身**的歷史回測驗證，即假設歷史期間依 CLEC 規則實際觸發邏輯進行再平衡，驗證規則本身的歷史績效與觸發時機。
- 明確不包含：與 UR-TODO-058（`/tools/investment-backtest`，特定 3 資產 0050／00631L／00865B、Excel 來源固定策略比較，非 CLEC 規則觸發邏輯）明確劃清界線，避免混淆或重複開發。

### UR-TODO-015 股票質押與 LTV 壓力測試
- 狀態：**OPEN / DEFERRED / NEEDS REAL USE CASE**（2026-08-21，Contract Audit 後正式措辭校正）
- Contract Audit 核心結論（2026-08-21，Review Mode 唯讀盤點）：
  1. 股票質押借款的 collateral／LTV（借款金額對抵押持股市值的比率，隨股價波動、觸及維持率會被追繳／斷頭）是現有 `LoanItem`／`RiskLoan`／`HouseholdLoan` 與 Risk Center `isLeveragedAsset()`（僅偵測產品內建槓桿，如 00631L）皆未吸收的獨立金融概念——全庫搜尋確認無任何欄位將 Loan 連結至特定持股、無 pledge ratio、無維持率門檻、無斷頭門檻。
  2. `git log --all` 對「質押」／「pledge」／「LTV」／「margin call」等關鍵字搜尋 **NONE FOUND**——無任何真實使用需求證據。
  3. 不因 placeholder 存在就主動新增 schema／persistence／UI；技術上 GO WITH CONDITIONS，但產品面因無真實情境暫緩。
- **REOPEN TRIGGER**：使用者實際開始使用股票質押／以持股為擔保的借款，需要追蹤 LTV／維持率／價格衝擊風險。

### UR-TODO-016 再平衡歷史與決策紀錄
- 狀態：**CLOSED**（2026-08-17）
- 完成證據：PR [#375](https://github.com/hyc640110/family-universal-rebalance/pull/375) 已 Merge；final head `2a391adde9fb8d10ac6209d2686796d470c2943d`，一般 2-parent merge commit `f7bc4a336e92b43facc58f83a2cdbad400846e00`，`mergedAt: 2026-08-17T11:42:40Z`，`mergedBy: hyc640110`。PR required CI Verification run `32025916546` success；main Deploy GitHub Pages run `32026237097` success，head 與 merge commit 一致。
- 完成範圍：再平衡建議中心提供「目前建議／決策紀錄」工作流；可保存「依建議處理／延後／不採用」決策、備註與 immutable Recommendation Snapshot，並納入 localStorage 與 JSON Backup 的 additive persistence。`test:ci` 已正式納入 `test:ur-todo-016`。
- 產品邊界：Decision Journal **僅表示使用者決策意向，不代表已下單或成交**；不建立 Transaction、不建立 Financial Event、不修改 holdings，不變更 Household Liquidity 或 recommendation algorithm，首頁不新增 Decision Journal／History Card。
- 驗收：使用者已完成 Preview／本機 Desktop 與 390 × 844 手機人工驗收；tabs、決策表單、三種選項、備註 textarea、提交／取消、Recommendation Snapshot、決策紀錄卡與 mobile bottom navigation 均正常，無明顯 horizontal overflow。已實測 `canRecommend=true` 建立決策、Ctrl+R 持久化、JSON Backup Export → Import round-trip；確認沒有 Transaction／Financial Event／holdings side effect。

### UR-TODO-017 股息預估模型
- 狀態：**OPEN / DEFERRED / CURRENT PRODUCT NON-GOAL**（2026-08-21，Contract Audit 後正式措辭校正）
- Contract Audit 核心結論（2026-08-21，Review Mode 唯讀盤點）：
  1. `DividendCenterPage.tsx` 現行產品聲明（逐字）：「只整理已實際收到的股息紀錄；不提供外部配息資料或未來收益預估。」——這不是遺留的未完成缺口，而是產品已經做出的明確設計決定；「今年預估股息」卡片固定顯示 `'—'` 與此聲明完全一致。
  2. Household Liquidity 邊界（`013_HOUSEHOLD_LIQUIDITY_SPEC.md` line 1149）：「預期股息不得在入帳前加入可投資現金。」
  3. 現有股息資料無官方來源（純使用者手動輸入）、無 per-share 金額、無配息頻率、無 split 感知，資料品質不支持真正的預估模型，只支持最簡單的 trailing-sum。
  4. `git log` 無任何嘗試實作預估功能的紀錄，無使用者需求證據。
- **明確不得**：把 UR-TODO-014-A／A2 的 CLEC validation fixture（TWSE 官方 ETF 分配收益資料）偷偷升格成 Production dividend provider——兩者是完全不相關、零程式耦合的獨立子系統。
- **REOPEN TRIGGER**：使用者明確要求重新引入前瞻股息估算，並重新完成資料來源、估算方法與資訊性呈現的 Contract Audit。

### UR-TODO-018 全球主要指數正式資料來源
- 狀態：**OPEN / NEEDS CONTRACT AUDIT / DATA SOURCE DECISION / NOT ACTIVE**（2026-08-21，Contract Audit 後正式措辭校正）
- Repository 現況（2026-08-21 盤點）：UI consumer（`MarketIntelligencePage.tsx`）、`src/lib/marketSections.ts` registry、`workers/market-data/src/index.js` 的 `globalItems()` stub 三端已完整設計並互相對齊，`GLOBAL_PLACEHOLDERS`（`src/lib/marketData.ts`）明文聲明「本版不使用授權或時間語意未確認的指數資料」——這是刻意的 Foundation 階段停止點，非未完成疏漏。`enabled: false` 使該區塊完全不對使用者顯示，無任何頁面因此降級或損壞。
- 真正缺口：一個經授權驗證、時間語意清楚、可信賴的正式全球指數資料來源決策，不是架構設計工作。
- 不構成近期 Development Sprint：目前沒有任何使用流程因缺少此資料而被阻塞。
- **REOPEN TRIGGER**：出現明確產品需求，且找到符合授權、freshness、時間語意與可靠性要求的正式全球指數資料來源。

### UR-TODO-019 重要經濟事件正式資料來源
- 狀態：**OPEN / NEEDS CONTRACT AUDIT / DATA SOURCE DECISION / NOT ACTIVE**（2026-08-21，Contract Audit 後正式措辭校正）
- Repository 現況：與 UR-TODO-018 共用同一 registry 與 Worker 檔案架構——`marketSections.ts` 的 `event` 區塊 `enabled: false`，`workers/market-data/src/index.js` 的 `eventItems()` 明文聲明「官方事件資料 adapter 尚未設定；不以硬編碼數值替代」，同樣是刻意的 Foundation 階段停止點。無任何頁面消費此資料，無降級或損壞。
- 真正缺口：官方或可正式驗證、授權清楚的經濟事件資料來源決策。**不得把「資料會更完整」當成 ACTIVE 理由。**
- **REOPEN TRIGGER**：出現明確產品需求，且找到官方或可正式驗證、授權清楚的經濟事件資料來源。

## P4－家庭財富管理長期項目

### UR-TODO-020 Gmail 銀行／信用卡通知解析
- 狀態：**OPEN / DEFERRED / NEEDS REAL USE CASE**（2026-08-21，Contract Audit 後正式措辭校正）
- Contract Audit 核心結論（2026-08-21，Review Mode 唯讀盤點）：
  1. `workers/gmail-oauth/` 已存在完整 OAuth 連線基礎設施（PKCE、CSRF、Durable Object session、AES-GCM token 加密），僅 Preview 啟用，`GmailOAuthSettings.tsx` 已於 2026-08-15（commit `3cbf6b4`）自 `App.tsx` 移除掛載，標記為「未完成」而主動下架。
  2. 真正產生價值的一半——讀取／解析 Gmail 訊息、Gmail→`ImportRecord[]` adapter——從未開始建置。
  3. Google sensitive scope（`gmail.readonly`）verification 尚未完成；pending→posted（授權通知 vs 正式入帳通知）reconciliation 路徑尚未解決；銀行專屬通知範本解析無現有先例（不像 CSV／PDF 是使用者可控格式）。
  4. 無使用者需求證據。**不使用 sunk-cost reasoning（「OAuth 已經做了一半」）推薦繼續開發。**
- 若重啟，架構上可比照既有 PDF adapter（UR-TODO-021）模式，接入不變的 `buildImportPreview()`／`createImportTransactions()` pipeline，不需建立第二套 ingestion 架構。
- **REOPEN TRIGGER**：使用者明確需要 Gmail 自動匯入，並接受 OAuth sensitive scope 驗證、銀行專屬 parser 與 transaction lifecycle（pending→posted）的開發成本。

### UR-TODO-021 銀行 CSV／Excel／電子帳單整合
- 狀態：**已完成／Production Verified**（2026-08-17 Electronic Statement Import Foundation，PR #377 merge commit `f0b57c038c0a19c86deeee7a0a73872ac94231e2`）
- 2026-08-16 唯讀盤點結論：`src/components/import/ImportCenter.tsx` 已支援 CSV／XLSX 檔案解析（`csvParse()`／`readXlsxFile()`）、欄位對應（交易日期／單一金額／收入／支出／描述／商家對象／類別／外部 ID）、逐筆重複判定（`duplicate: 'certain'`）與匯入預覽，銀行 CSV／Excel 對帳單匯入已具備完整可用路徑。
- 2026-08-17 完成範圍：新增 generic text-PDF foundation（PDF text extraction → pure statement adapter → 現有 canonical import records），既有 mapping／validation／duplicate detection／preview／user confirmation／transaction creation 完全沿用；`pdfjs-dist` 以 lazy-load 與 worker chunk 載入。Preview 列直接顯示既有 `row.type` 的「收入／支出」方向，金額仍維持正數資料模型。
- 明確不包含：OCR、圖片／掃描型 PDF、銀行專屬 parser、無明確方向的金額猜測、AI 自動分類、Loan／Investment／FX attribution、Financial Event Ledger、Transaction／Backup schema、Firebase、Worker。Production 已由 PR merge 的既有 main workflow 部署並完成唯讀驗證。

### UR-TODO-022 自動分類與重複交易偵測
- 狀態：**CLOSED／Production Verified**（2026-08-18 Final Governance Closeout）
- 最終產品決策：UR-TODO-022 的原始目的為「自動分類與重複交易偵測」。022-A／B／C 已在 Production Verified：Rule-Assisted Category Suggestion Foundation、Safe Column Auto-Mapping Hardening、Batch-Aware Duplicate Reconciliation。現行 Import Center 已形成完整安全工作流：file parsing → safe deterministic column auto-mapping → deterministic high-confidence category suggestion → explicit user confirmation → existing＋same-batch duplicate protection → preview → explicit import。Human-in-the-loop 類別確認是刻意保留的安全邊界，不是未完成缺陷；ambiguous／low-confidence semantic 維持 fail closed，且無 automatic transaction commit。
- 2026-08-18 **UR-TODO-022-A Rule-Assisted Category Suggestion Foundation 已完成／Production Verified**：PR [#385](https://github.com/hyc640110/family-universal-rebalance/pull/385) final head `492b85e99fa72df5389c8a6fe36c37e1990fa18d` 已以一般 2-parent merge commit `9628d8aed9a5875047eb86cdd98b28b7f580849b` 合併（parents：`aba0a9283035ba1e6fd3c55d01a24490aa62943f`／`492b85e99fa72df5389c8a6fe36c37e1990fa18d`；未使用 admin override）。verify `32096747958`、Preview workflow_dispatch `32096761194` 與 push/main Deploy GitHub Pages `32097751304` 均 success；後者 regression gate、Production build、Pages deploy success，Production source 為 merge commit，root HTTP 200／`environment=production`，bundle `index-UfIXOsXo.js` 已更新且未混用 Preview asset。相同 PR head 的 Desktop 與 390 × 844 Preview 人工驗收均通過；Production 證據僅為唯讀 deployment verification，未建立測試交易。
- 022-A 契約：僅以 deterministic、high-confidence safe-whitelist 規則產生建議；high-risk semantic 一律 fail closed、conflict=`none`。suggestion metadata 僅存在 Import Preview/session，使用者必須明確按「套用建議」才改變 Preview category；無自動 transaction commit。既有 duplicate detection contract 未變，且不屬本次 remaining scope。
- 2026-08-18 **UR-TODO-022-B Safe Column Auto-Mapping Hardening 已完成／Production Verified**：PR [#387](https://github.com/hyc640110/family-universal-rebalance/pull/387) final head `c9f89aed3232075899799f19fb75889c30828cdc` 已於 2026-08-18T05:52:54Z 由 `hyc640110` 以一般 2-parent merge commit `b81342dac07ace36d965495a74a2a0a628776ff9` 合併（parents：`fd9dafe6044915ac2762ed83979589417a9d7033`／`c9f89aed3232075899799f19fb75889c30828cdc`；未使用 admin override）。CI `32103283273`、Preview workflow_dispatch `32103449472`、push/main Deploy GitHub Pages `32104607740` 均 success；後者 head 與 merge commit 一致，regression gate、Production build、Pages deploy success。Preview 人工驗收 PASS：不手動調整 Column Mapping 即得到有效 7／錯誤 0，收入／支出與 022-A suggestion 正常。Production 人工唯讀驗收 PASS：`/assets#transactions-section` 的交易基礎、Import Center、檔案選擇、Column Mapping、Preset／匯入紀錄正常；未建立交易、未寫入 Production localStorage。Production／Preview HTTP 200、environment metadata 與 asset isolation 正確，Production bundle 包含 safe-whitelist aliases。
- 022-B 契約：既有 `guessImportMapping` 採 deterministic exact → strong alias；同 target 多候選或 source conflict 一律 fail closed。credit＋debit 優先於 amount；交易日期不以 posting／posted／入帳日期替代；externalId 僅接受嚴格 alias、裸 `id` 一律不 mapping。`buildImportPreview` duplicate formula、`transactionFingerprint`、`updateImportPreviewRowCategory`、`createImportTransactions` 與 UR-TODO-022-A preview-only category suggestion 均未變。`test:ci` 1,063 pass、TypeScript、Production／Preview build、`git diff --check` pass；npm audit 的 4 個 high vulnerabilities 為既有相依問題，非本 Sprint 引入。無 schema、persistence、localStorage、JSON Backup、Financial Event Ledger 變更。
- 2026-08-18 **UR-TODO-022-C Batch-Aware Duplicate Reconciliation 已完成／Production Verified**：PR [#389](https://github.com/hyc640110/family-universal-rebalance/pull/389) final head `9b2f94b42951aa99665e3e7f90c82d071de16c08` 已於 2026-08-18T13:09:39Z 由 `hyc640110` 以一般 2-parent merge commit `dc6b5aca77c6ad60bb3be243e56091348be0f1ce` 合併（parents：`b720aa3ff15ec367778156528734ef9eca54fadd`／`9b2f94b42951aa99665e3e7f90c82d071de16c08`；未使用 admin override）。CI `32139612582`、Preview workflow_dispatch `32139755897`、push/main Deploy GitHub Pages `32140771082` 均 success；最後者為 push/main、head 與 merge commit 一致，regression gate、Production build、Pages deploy success。Preview 人工驗收 PASS：exact 同批重複保留最早有效列、後續列 certain／selected=false；同日同額同描述但 fingerprint 不同者為 possible、保持可選並顯示「同批次可能重複，請確認是否仍匯入」；同一非空 externalId 為 certain，category 變更可按既有 batch 規則 downgrade／upgrade，未 commit 資料。Production 人工唯讀驗收 PASS：`/assets#transactions-section` 的交易基礎、Import Center、檔案選擇與 Column Mapping／Preview 控制項正常，console 無新增 error，未建立或匯入測試交易、未寫入 Production localStorage。Production／Preview root 皆 HTTP 200；workflow 來源與不同 asset（Production `index-FKnb2K2Y.js`、Preview `index-CDobTh5S.js`）確認環境／asset isolation，兩 bundle 均含 warning 與 external-ID 重複偵測字串。
- 022-C 契約：既有 Import Preview 管線以 deterministic、canonical row order 做 batch reconciliation，輸出 `none`／`possible`／`certain`；possible 不阻止勾選、直接 render 既有 `row.warning`，certain 維持 selected=false。未改 checkbox 行為、duplicate calculation、`buildImportPreview` duplicate formula、category suggestion、`transactionFingerprint`、transaction creation 或 UR-TODO-022-A preview-only suggestion contract。`test:ci` 1,097 pass（Import Center 36/36）、TypeScript、Production／Preview build、`git diff --check` pass；npm audit 的 4 個 high vulnerabilities 為既有相依問題，非本 Sprint 引入。無 schema、persistence、localStorage、JSON Backup、Financial Event Ledger、attribution、Household Liquidity 公式或 Rebalance／AI Decision coupling 變更。
- **UR-TODO-022-A／B／C 與 UR-TODO-022 全部為 CLOSED／Production Verified。** Historical mapping reuse、historical learning、fully automatic classification、AI／LLM classification 統一為 **Deferred／Future Enhancement**，不再是本 Todo 的未完成項目或 closure blocker。若未來產品確定需要其中任一能力，必須另立新的獨立 UR-TODO，重新進行 Contract Audit、風險邊界與 acceptance criteria；不得直接重新打開 UR-TODO-022，亦不得在本次自行建立新 Todo 編號。

### UR-TODO-023 月底自動對帳
- 狀態：**CLOSED／Production Verified**（2026-08-18 Final Governance Closeout）
- 2026-08-18 **UR-TODO-023-A Monthly Transaction Reconciliation Preview 已完成／Production Verified**：PR [#392](https://github.com/hyc640110/family-universal-rebalance/pull/392) final head `b41e0e5c5bf3b3fffaf5732a96e728d55e4c0cb2` 已於 2026-08-18T14:41:46Z 由 `hyc640110` 以一般 2-parent merge commit `a31ad5f9511d33f7b9226138fbb9c241b7636674` 合併（parents：`c10b26d9219cda6d50e799f08c7e47e15dd188be`／`b41e0e5c5bf3b3fffaf5732a96e728d55e4c0cb2`；未使用 admin override）。CI `32148181979`、相同 final head 的 Preview workflow_dispatch `32148383148` 與 push/main Deploy GitHub Pages `32149911373` 均 completed/success；最後者 head 與 merge commit 一致，regression/test gate、Production build、Pages deploy success。Preview 人工驗收 PASS：已匹配 3、可能相符 2、僅 Statement 1、僅 App 1、無效列 1，未建立 Production 資料。Production 人工唯讀驗證 PASS：Production／Preview root HTTP 200、environment metadata 分別為 production／preview、asset isolation 正確；Production bundle 已含對帳 UI 字串，`/assets#transactions-section` 的交易基礎、Import Center、Column Mapping 正常，console 無新增 error，未建立或匯入 Production 測試交易、未修改 Production localStorage。
- 023-A 契約：只提供唯讀 reconciliation preview，不寫入交易。statement 有效列推導 minDate／maxDate 建議期間，使用者明確確認才產生結果；取消不產生 result。matching priority、one-to-one algorithm、externalId identity、fingerprint algorithm、possible identity、`posted && !excluded` filter、schema、persistence、AppState、JSON Backup、ImportSession、duplicate formula、UR-TODO-022-A／B／C 與 transaction write path 均未變。`test:ci` 1,407 pass、TypeScript、Production／Preview build、`git diff --check` pass；npm audit 的 4 個 high vulnerabilities 為既有相依問題，非本 Sprint 引入。
- 2026-08-18 Closeout Scope Review 正式結論：**A. Direct Closeout**。023-A 已完整滿足本 Todo 的 transaction-level 核心目的，故 UR-TODO-023 整體 CLOSED／Production Verified；**不建立 UR-TODO-023-B／023-C**。已完成能力為：Statement 有效列日期範圍推導、使用者明確確認 reconciliation period、同帳戶 posted／non-excluded／period-scoped App transaction reconciliation、external ID 優先／fingerprint 次要、唯一高信心 matched、ambiguity unresolved／possible、Statement-only／App-only／invalid、one-to-one consumption、fail closed，以及 period boundary 與 transaction exclusion regression coverage。結果僅存在 Import Center ephemeral local React state，不寫入 Financial Event Ledger，也不建立 persistent reconciliation state。
- **Not required for UR-TODO-023 closeout**：balance reconciliation UI／flow、reconciliation history persistence、schema version bump、persistence migration、JSON Backup reconciliation history extension、Financial Event Ledger wiring、reconciliation debug／observability UI、UR-TODO-023-B、UR-TODO-023-C。balance reconciliation 未建立，因 Statement import contract 沒有 authoritative opening／closing／running balance，App account balance 可能為 manual 或 transaction-derived，Financial Event Ledger reconciliation 語意不同，net-worth snapshot 不能替代 account-specific Statement balance；未來若需 balance certification，應另立新產品需求與資料契約。history persistence 未建立，因現有 comparison 為 ephemeral／local／read-only；若未來需要可重現且長期稽核，必須先另定 Statement source／hash、mapping、account、period、transaction identity／snapshot strategy、algorithm version、invalidation semantics、retention policy。此前持久化 summary 會造成 duplicated state、stale state、migration burden、localStorage／JSON Backup complexity 與 ambiguous SSOT。未來若出現真實需求，必須另立新的獨立 TODO／Sprint 並重新 scope review，不得重新解釋為 023 的未完成範圍。

### UR-TODO-024 多家庭成員
- 狀態：**OPEN / DEFERRED / NEEDS REAL USE CASE**（2026-08-21，Contract Audit 後正式措辭校正）
- 2026-08-16 範圍縮小重新描述（原名「多帳戶與多家庭成員」）：多帳戶部分已由 `src/lib/financialAccounts.ts` 既有 8 種帳戶類型的多帳戶架構滿足，**正式標記完成**，自本次更新起自本條目移出；本條目聚焦剩餘缺口「多家庭成員」（成員歸屬、各自報表／彙總），全庫搜尋確認目前無任何成員歸屬欄位或資料結構。
- 已完成（移出範圍）：多帳戶——`FinancialAccountType` 涵蓋 8 種帳戶類型，UR-TODO-066 完成筆記已提及此既有能力。
- 2026-08-21 Contract Audit 確認：`grep -rniE "ownerId|memberId|familyMember|household.*member"` 全 `src/` 零命中；完整支援需要 member 實體、per-account／per-holding／per-loan ownership 欄位、既有資料 migration、Backup schema version bump，以及重新推導 Dashboard／Risk／Rebalance／CLEC 等所有現行視「家庭」為單一整體的下游聚合——這是基礎 schema 變更，非 UI 功能。無真實多人使用需求證據。**不現在建立 member ownership schema。**
- **REOPEN TRIGGER**：實際出現第二位家庭成員，需要獨立的 account／holding／loan ownership、分析或報表。

### UR-TODO-025 保險保單追蹤與保障缺口分析
- 狀態：**OPEN / DEFERRED / DEPENDS ON REAL HOUSEHOLD USE CASE**（2026-08-21，Contract Audit 後正式措辭校正）
- 2026-08-16 範圍縮小重新描述（原名「保險、退休與家庭淨資產規劃」）：退休子範圍已由 **UR-TODO-066（CLOSED，退休提領規劃）**完整吸收（FIRE 目標、提領率、達成率、缺口投入反推），家庭淨資產趨勢已由既有 `netWorthHistory`／`WealthGoalPage.tsx`（財富目標）覆蓋單一使用者視角；本條目聚焦剩餘缺口：
  1. **保險保單追蹤**：目前保險僅為 `retirementPlanner.ts` 內單一欄位 `insuranceFee`（年度大額支出金額），完全沒有保單類型、保額、受益人、繳費期別、續保提醒等追蹤能力。
  2. **保障缺口分析**：目前無任何機制比對既有保障與家庭財務缺口。
- 依賴：UR-TODO-024（多家庭成員）——若「家庭」淨資產與保障規劃需涵蓋多成員各自資料，需待 024 完成多家庭成員資料結構後才能延伸；本條目與 024 共用同一「家庭成員」資料缺口，不得各自獨立重複定義成員資料結構。
- 明確不包含：退休提領規劃（見 UR-TODO-066，已 CLOSED，不重新開放討論）；單一使用者視角的淨資產歷史／財富目標既有功能修改。
- **REOPEN TRIGGER**：UR-TODO-024 的多人／ownership 需求成立，且使用者明確需要保單追蹤與保障缺口分析。

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
