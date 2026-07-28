# Universal Rebalance Todo Backlog v1.24

最後更新：2026-07-27

本文件是 Universal Rebalance 所有未完成事項的單一正式來源。

**新想法請先進 `019_Idea_Pool.md`，經評估後才轉為正式 UR-TODO 項目**（2026-07-25 V7.0A 新增規則，見 `016_Product_Decisions.md` 第 9 節「模式切換」）。本次新增規則不改動既有任何 UR-TODO 的優先級或狀態，現行 P0～P4 五級制維持不變。

家庭流動性、安全存量與可投資現金主題的詳細架構規格，以 `013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）為唯一正式來源；本文件只保存 Todo 狀態、Sprint 邊界與驗收摘要。

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

2026-07-25 使用者本人於 Firebase Console 唯讀查證 UR-TODO-001：專案 `my-00662`、資料庫 `my-00662-default-rtdb`，現行規則為 `now < 1785168000000`（到期日 2026-07-28）、到期前完全公開讀寫、到期後 Firebase 預設轉為全部拒絕（權限自然收斂，非資料外洩）。使用者拍板決策：不在到期前修改規則、接受自然到期、正式 Firebase Auth 方案列為未來獨立 Sprint。UR-TODO-001 狀態由「待盤點」更新為**「已盤點」**，正式解法仍為「待開發」，不得標記為「已完成」。

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
- 狀態：**已盤點**（Rules 內容與到期日已由使用者本人於 Firebase Console 查證確認；正式解法〔Firebase Auth 整合〕仍為**待開發**，尚未排入 Sprint，不得標記為「已完成」）
- 提出日期：2026-07-22
- 問題：`my-00662-default-rtdb` 測試模式用戶端存取權限即將到期。
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

**2026-07-25 Firebase Console 唯讀查證結論（使用者本人於 Firebase Console 查證，非 Repository 唯讀盤點得出）：**

- 專案：`my-00662`，資料庫：`my-00662-default-rtdb`
- 現行規則（確認日 2026-07-25）：
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

三個方向的優先順序、時程與是否走 Console-only Hotfix 或正式 Sprint，於 2026-07-25 由使用者查閱 Firebase Console 後決定：**不在到期前修改規則，接受 2026-07-28 自然到期**，正式解法（Firebase Auth 整合）列為未來獨立 Sprint。狀態依此更新為「已盤點」，詳見上方 2026-07-25 段落；正式解法本身仍為「待開發」。

### UR-TODO-002 持股資產管理卡片 2.0 差異盤點

- 優先級：P0
- 狀態：部分完成
- 已完成：
  - 現價
  - 今日漲跌金額
  - 今日漲跌幅
  - 台股紅漲綠跌
  - TWSE 可信前收
  - 手機主卡移除均價
- 待確認：
  - 現價與漲跌幅同列
  - 漲跌金額次列
  - `▲／▼`
  - 三者完全同色
  - 與未實現損益清楚區隔
  - 桌機／手機一致
- 完成 PR：#100、#101（部分）

### UR-TODO-003 每檔成長／防守分類完整性

- 優先級：P0
- 狀態：部分完成
- 已有：
  - `assetClass`
  - 持股編輯 UI
  - `allocationRoleBySymbol`
- 待盤點：
  - localStorage
  - Firebase
  - Backup
  - 封存／恢復
  - Dashboard
  - Risk
  - Rebalance
  - CLEC
  - SSOT
  - `cash-like` 與 `defensive` 的語意

### UR-TODO-004 桌機／手機目前偏離目標一致性

- 優先級：P0
- 狀態：待盤點
- 驗證：
  - currentWeight
  - targetWeight
  - deviation
  - rounding
  - compact／desktop selector

### UR-TODO-005 00685L、00895 名稱持久化

- 優先級：P0
- 狀態：待盤點
- 驗證：
  - 更新股價
  - reload
  - Firebase
  - Backup
  - 封存／恢復
  - 自訂名稱優先權

### UR-TODO-037 Deployment Workflow Approval & Status Accuracy

- 優先級：P0
- 狀態：**部分完成**（Sprint「Deployment CI Reproducibility & Test Gate」，2026-07-24）
- 提出日期：2026-07-24
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
- 尚未完成範圍（明確延後，需另立 Todo／Sprint）：
  - GitHub Environments 人工核准（required reviewers）
  - Branch Protection Rule（`main` 目前仍是 `Branch not protected`）
  - GitHub 預設分支修正（目前仍是 `gh-pages`，非 `main`，會影響 `gh pr create` 等工具的預設行為）
- 禁止：
  - 不得未經使用者授權直接修改 `deploy.yml` 或其他 CI／CD 設定。
- 驗收條件：
  - Production 部署觸發方式與治理文件描述一致，不再有「PR 稱未部署但實際已部署」的落差 —— **已透過 `007_GIT_WORKFLOW.md` 更新達成**。
  - 若新增人工核准閘門，Preview／Production 部署行為需重新驗證 —— **未完成，留待後續 Sprint**。

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
- 狀態：**部分完成**
- 完成日期：2026-07-22（PR #104、#105，2026-07-24 唯讀盤點確認）
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
- 尚未完成範圍：
  - 未接入任何正式 consumer（Rebalance、Risk、AI、CLEC、Simulator 均未讀取本模型輸出）
  - Plan Input 目前只有一個獨立 UI Entry Point（見新增 Todo：Household Liquidity Plan Input UI Entry Point），尚未與其他頁面（Dashboard、Risk、Rebalance）的現金／預算欄位整合或去重
  - 尚未定義「正式 consumer 接線後」的驗收條件與回歸測試矩陣
- 測試：PR #104 27/27、PR #105（Entry Point 7/7＋Foundation 16/16），皆為 PR 內文宣稱通過；本次盤點未重新執行測試套件

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
- 狀態：待盤點
- 提出日期：2026-07-24
- 提出依據：PR #105（V6.17.3A.1 Entry Point，merge `2510169`）
- 背景：
  - PR #105 在「收支與現金流中心」（`CashFlowPage.tsx`）新增「家庭流動資金計畫」UI 區塊，可編輯 `externalContribution`（額外投入資金）與 `plannedWithdrawal`（預計提領資金），這是家庭流動性主題第一次修改正式 UI 頁面。
  - 此範圍未被 UR-TODO-006、UR-TODO-007 原始描述涵蓋，也未被 UR-TODO-011（Cross-Module Presentation Consistency）明確涵蓋。
- 待確認：
  - 此 UI 區塊與 UR-TODO-011「防守配置狀態」呈現規劃之間的關係與邊界。
  - 是否需要與 Dashboard、Rebalance、Simulator 既有的預算／資金輸入欄位整合或去重。
  - 手機／桌機一致性、萬元輸入元儲存的 validation 是否已涵蓋所有邊界案例（見 PR #105 測試：Entry Point 7/7、Foundation 16/16）。
- 依賴：
  - UR-TODO-007（部分完成，尚未接 consumer）
  - UR-TODO-011（待開發）
- 驗收條件：
  - 明確記錄此 UI Entry Point 與家庭流動性主題其餘 Sprint（Rebalance、Risk、CLEC、Simulator、Cross-Module Presentation）的整合關係，不得重複設計相同的資金輸入欄位。

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
- 狀態：**待盤點**（僅記錄發現，不在本次處理，待 Sprint 6 正式排入時處理）
- 提出日期：2026-07-26
- 提出依據：本次修正 `src/pages/ToolsPage.tsx` 過時文案時，唯讀盤點 `TOOL_DEFINITIONS`（`src/lib/toolNavigation.ts`）與 `ToolsPage.tsx`／各工具子頁面版面時發現，順帶記錄，非本次處理範圍
- 問題：
  - 「工具」分頁（`ToolsPage.tsx`）以扁平方式收納全部 16 個工具卡片，未分區、未分優先序；其中包含再平衡建議中心、風險與現金安全中心、AI 決策中心等核心決策功能，與 ETF X-Ray、投資回測、蒙地卡羅模擬、退休試算等規劃中／較次要項目並列同一格狀清單，可能造成核心功能在版面上被低估、不容易與規劃中項目區分優先序。
  - 每個工具子頁面內的 `ToolQuickNavigation`（页面內快速導覽元件）與「工具」首頁的卡片列表存在重複的導覽路徑——使用者在子頁面與工具首頁都能看到近似的其他工具入口清單，尚未確認兩者是否有明確的分工或是否應合併／去重。
- 明確不處理（本次僅記錄）：
  - 不調整 `ToolsPage.tsx` 版面分區、排序或分類。
  - 不調整 `ToolQuickNavigation` 元件邏輯或任何子頁面導覽。
  - 本次僅修正 `ToolsPage.tsx` 的「已上線」／「規劃中」文案誤導問題（見上方變更記錄），不涉及本項目範圍。
- 依賴：
  - **UR-TODO-011**（Cross-Module Presentation Consistency，Sprint 6，狀態「待開發」）：本項目為其前置輸入，實際版面調整應併入該 Sprint 一併規劃，不另立獨立 Sprint。
- 驗收條件（待 Sprint 6 正式排入時另訂）：
  - 「工具」分頁能清楚區分已上線核心功能與規劃中項目的視覺優先序。
  - 子頁面 `ToolQuickNavigation` 與工具首頁卡片列表的導覽路徑分工明確，不重複造成使用者困惑。

### UR-TODO-041 負債資料過期警示

- 優先級：**待評估**（2026-07-26 由 P1 調整；優先級待正式盤點完成後再評定，避免提前膨脹）
- 狀態：**待盤點**
- 提出日期：2026-07-26
- 提出依據：UR-TODO-009（Risk & Decision Workflow Integration，Sprint 4）唯讀盤點過程中發現，對照 `013_HOUSEHOLD_LIQUIDITY_SPEC.md`（v4.0）§22 Risk Center 規格要求時比對出的缺口項目
- 需求：§22 明列 Risk Center 必須新增或統一的八項目中包含「負債資料過期警示」，目前完全缺失，且**底層核心模型本身也未定義**這個概念——`HouseholdLoan` 型別（`src/lib/householdLiquidity.ts`）只有 `{ loanId, monthlyPayment }`，無任何 `asOf`／更新時間欄位；現行 23 個 blocking reason code（`HouseholdLiquidityReasonCode`）中沒有「過期」相關 code。
- 明確標註：本項目**需擴充 013 §6 核心輸入契約**（`HouseholdLoan` 新增 `asOf` 欄位＋新增對應 blocking reason code），非單純消費端接線可解決；**本次 Sprint 4（UR-TODO-009）不處理**，已由使用者於 2026-07-26 拍板延後（決策二，理由：一次只做一件事、避免核心契約隨手擴充，牽動核心模型的變更需獨立評估），不納入 UR-TODO-009 子 PR 4（Risk Center 呈現）範圍。
- 依賴：
  - UR-TODO-009（Risk & Decision Workflow Integration，子 PR 4 明確排除本項目，兩者共用同一組 Risk Center UI，未來若啟動需確認與子 PR 4 呈現層的整合順序）
  - UR-TODO-006（Household Liquidity Core Model Foundation，本項目需擴充其核心輸出契約）
- 驗收條件（待正式排入時另訂）：
  - `HouseholdLoan` 輸入契約新增 `asOf`（或等義欄位）並完成 migration／向下相容評估。
  - 新增對應 blocking reason code，並更新 23 個既有 code 清單與 `013` §9 完整性／信賴度規則。
  - Risk Center（`RiskCenterPage.tsx`／`PortfolioRiskPage.tsx`）依新契約顯示負債資料過期警示。

### UR-TODO-042 PortfolioRiskPage「槓桿暴露」卡片 React 重複 key console error

- 優先級：**待評估**
- 狀態：**待盤點**
- 提出日期：2026-07-26
- 提出依據：UR-TODO-009 子 PR 3（PR #137，riskMetrics.ts 改讀 Household Liquidity 輸出）Preview 驗收時發現，與本次 riskMetrics 改動無關，唯讀盤點確認 `src/pages/PortfolioRiskPage.tsx`／`src/lib/portfolioRisk.ts` 在該次 PR 分支中零異動，純屬既有缺陷
- 問題：`PortfolioRiskPage.tsx` 的「槓桿暴露」卡片（`Rows` 元件）第二列 `["占總資產", pct(view.leverage.totalPct), view.denominatorLabel]` 中，第一格固定文字「占總資產」與第三格 `view.denominatorLabel`（其值同樣為「占總資產」）相同，`Rows` 元件以 `key={item}` 作為同一列內每個儲存格的 React key，導致同一列兩個儲存格 key 重複，瀏覽器 console 出現「Encountered two children with the same key」錯誤。
- 已確認：僅為 React key 警告，未觀察到實際資料錯誤、遺漏或畫面跑版；瀏覽器實測「/tools/portfolio-risk」頁面於全新分頁首次載入即可重現。
- 依賴：無（獨立於 UR-TODO-009／013 家庭流動性系列）
- 驗收條件（待正式排入時另訂）：
  - `Rows` 元件或呼叫端改用不依賴儲存格文字內容的唯一 key（例如改用欄位索引或固定的欄位識別字串）。
  - console 不再出現此重複 key 警告，畫面呈現內容不變。

## P1－舊待辦遺漏補登

> 本區為舊對話需求與現行 Backlog 的遺漏比對結果。只補登尚未確認完成、且未被其他 Todo 完整吸收的項目。開發前仍須先唯讀盤點最新 main。

### UR-TODO-026 持股卡片移除「持有比率」文字
- 優先級：P1
- 狀態：待盤點
- 提出日期：2026-07-22
- 修改方向：
  - 移除「持有比率」四個字。
  - 保留圓圈與圓圈內比例數字。
  - 桌機與手機一致。
- 驗收條件：
  - 不再顯示「持有比率」文字。
  - 圓圈與比例數字正常。
  - 不改變比例計算。

### UR-TODO-027 趨勢圖剩餘視覺與刻度問題
- 優先級：P1
- 狀態：待盤點
- 提出日期：2026-07-19
- 待確認：
  - 07／15 附近是否仍有中間空白。
  - Y 軸是否使用易讀整數刻度。
  - 手機左側文字是否裁切。
  - Y 軸位置是否需調整。
  - 走勢方向漸層填色需求（2026-07-26 補充明確規格，取代原本模糊的「綠色漸層需求是否仍保留」，見下方）。
- 明確需求（2026-07-26 使用者提供，參考樣式為 Google 財經個股走勢圖）：
  - 趨勢圖線下方應依走勢方向顯示漸層填色，由線條顏色向下漸淡至透明：
    - 區間內上漲（終點高於起點）：紅色漸層（符合台股慣例，紅漲）。
    - 區間內下跌（終點低於起點）：綠色漸層（符合台股慣例，綠跌）。
  - 2026-07-26 唯讀確認：`src/components/TrendChart.tsx` 目前只繪製 `<path>` 折線與資料點 `<circle>`，未使用任何 `<linearGradient>`／填色區域；`src/styles.css` 的 `.trend-chart` 相關規則亦未定義漸層。**目前完全沒有既有的固定單色漸層**，本項為**新增需求，不是既有功能的方向切換調整**。
  - 若未來開發時發現螢幕上仍殘留其他既有漸層樣式（例如非 TrendChart 本身、由其他共用元件或 CSS 疊加造成），需另行唯讀盤點確認來源，不得假設本項已涵蓋該情況。
- 驗收條件：
  - 真實資料無日期斷裂。
  - 手機 Safari 約 390px 無裁切。
  - 桌機 1000px／1600px 正常。
  - 走勢圖依區間漲跌動態顯示紅／綠漸層填色，且與現有「紅漲綠跌」台股顏色慣例一致，不與既有 `currentColor` 折線顏色邏輯衝突。

### UR-TODO-028 股息中心未指定資產編輯限制
- 優先級：P1
- 狀態：待盤點
- 提出日期：2026-07-19
- 問題：
  - 未指定資產的股息紀錄可能只能刪除、無法編輯。
- 待確認：
  - 是否可補選或修改資產。
  - 已清倉／封存資產參照完成後是否仍有問題。
  - 編輯後 localStorage、Firebase、Backup 是否一致。
- 驗收條件：
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
- 狀態：待盤點
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
- 診斷：首頁目前較像資訊展示頁，而非使用者實際進入點（使用者主要使用「資產」「分析」頁）。
- 建議方向：首頁重新定位為「30 秒決策中心」，只回答「今天需不需要做什麼」，若無事則只顯示單一狀態列（例如「今天無需任何操作」）。
- 建議保留內容：
  1. 今日是否需操作（單一卡片，僅顯示需要處理的事項）
  2. 資產總覽（總資產／今日增減／總報酬率，不含細節）
  3. 更新狀態（最後更新時間、是否今日報價，佔用空間需精簡）
- 「今日投資狀態」處理方向（兩個選項，尚未拍板）：
  - 方案 A（建議）：移到「分析」頁，首頁僅留一行摘要並可點擊查看。
  - 方案 B：預設收合，感興趣再展開。
- 此為 Sprint 6／UR-TODO-011（Cross-Module Presentation Consistency）階段的呈現層輸入，**非本次或 UR-TODO-009 範圍**，UR-TODO-009 開發時不得因此擴大或美化「今日投資狀態」現有版面。

### UR-TODO-031 投資健康度安全存量命名與說明
- 優先級：P1
- 狀態：已被架構吸收／待 UI 接線
- 提出日期：2026-07-19
- 正式規格：
  - `013_Household_Liquidity_Model_Spec_v3.0.md`
- 關聯 Todo：
  - UR-TODO-006～011
- 驗收條件：
  - 不再使用易誤解的「現金安全」舊語意。
  - 顯示生活費＋負債還款的安全存量來源。

### UR-TODO-032 資產頁更新股價入口與手機下拉更新盤點
- 優先級：P1
- 狀態：部分完成／待盤點
- 提出日期：2026-07-19
- 待確認：
  - 是否有明確更新股價按鈕。
  - 手機頂端下拉是否可靠觸發。
  - loading、error、lastUpdated、quote date 是否一致。
- 驗收條件：
  - 桌機與手機使用同一刷新契約。
  - 更新後各頁報價一致。

### UR-TODO-033 持股卡片現價與今日漲跌版面完整差異
- 優先級：P1
- 狀態：部分完成／待盤點
- 提出日期：2026-07-19
- 與既有 Todo 關係：
  - 補充 UR-TODO-002，不取代它。
- 待確認：
  - 現價與漲跌幅是否同列。
  - 漲跌金額是否次列。
  - 是否顯示 ▲／▼。
  - 三者是否依台股紅漲綠跌一致著色。
  - 是否與未實現損益清楚區隔。
- 驗收條件：
  - 桌機與手機一致。
  - 非今日報價清楚標示。

### UR-TODO-034 持股更新後仍顯示舊報價的殘留案例盤點
- 優先級：P1
- 狀態：部分完成／待盤點
- 提出日期：2026-07-16
- 已知相關完成：
  - Quote refresh consistency
  - TWSE 可信前收
  - Market refresh／CORS
- 待確認：
  - 00631L、00865B 等是否仍有殘留舊值。
  - Worker、cache、state、localStorage 與 selector 是否一致。
- 驗收條件：
  - 所有頁面使用同一份最新可信報價。
  - 無可信報價時顯示 unknown／非今日資料。

### UR-TODO-035 市場頁「重新取得」按鈕回歸確認
- 優先級：P2
- 狀態：已完成候選／待回歸確認
- 提出日期：2026-07-16
- 已知相關完成：
  - Market 重新取得
  - Market CORS Hotfix
- 驗收條件：
  - 按鈕實際發出請求。
  - loading、成功、失敗狀態可見。
  - Preview／Production Worker 不混用。

## P2－新功能

### UR-TODO-043 Analytics 每日資產快照休市日變動語意與來源明細

- 優先級：P2
- 狀態：待盤點
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
  - 建議 UR-TODO-011 完整結案後再處理。
  - 若證實日期偏移、同日覆蓋錯誤、重複計算、外部資金誤列為投資績效，或錯誤資料傳入 Dashboard／AI Decision／Rebalance，則升級為 P1 並插隊。

### UR-TODO-012 Rebalance Scenario Simulator

- 優先級：P2
- 狀態：待開發
- 前置依賴：UR-TODO-006～011

### UR-TODO-013 Investment Decision Workflow Integration

- 優先級：P2
- 狀態：部分完成
- 前置依賴：UR-TODO-009

## P3－中長期投資功能

### UR-TODO-014 CLEC 歷史驗證與回測
- 狀態：待開發

### UR-TODO-015 股票質押與 LTV 壓力測試
- 狀態：待開發

### UR-TODO-016 再平衡歷史與決策紀錄
- 狀態：待開發

### UR-TODO-017 股息預估模型
- 狀態：待開發

### UR-TODO-018 全球主要指數正式資料來源
- 狀態：待開發

### UR-TODO-019 重要經濟事件正式資料來源
- 狀態：待開發

## P4－家庭財富管理長期項目

### UR-TODO-020 Gmail 銀行／信用卡通知解析
- 狀態：待開發

### UR-TODO-021 銀行 CSV／Excel／電子帳單整合
- 狀態：部分完成

### UR-TODO-022 自動分類與重複交易偵測
- 狀態：部分完成

### UR-TODO-023 月底自動對帳
- 狀態：待開發

### UR-TODO-024 多帳戶與多家庭成員
- 狀態：待開發

### UR-TODO-025 保險、退休與家庭淨資產規劃
- 狀態：待開發

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
