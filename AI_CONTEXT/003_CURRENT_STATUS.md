# Universal Rebalance Current Status v3.59

最後更新：2026-08-01

**UR-TODO-034 唯讀實機驗證，正式結案（2026-08-01）**：Claude Code 於 Development Mode／驗收性質下，以 00631L、00865B 兩檔標的在隔離本機 dev server（串接真實 Yahoo Finance via Cloudflare Worker，非使用者 Production 資料）測試持股更新後跨頁報價一致性（Worker／cache／state／localStorage／各頁 selector）。確認 `quotes` 為 `App.tsx` 純 React state、不寫入 `localStorage`，`defaultQuotes` 對這兩檔有寫死的內建備援價格（38.42／48.52），`mergeQuoteRefresh()` 已有防護機制避免無效或過期報價覆蓋正確值。實機測試涵蓋首次載入、編輯股數、手動刷新、完整瀏覽器重新整理（F5）、跨頁一致性（資產頁／分析頁／投資組合風險與配置中心）五個情境，皆未發現殘留舊報價，console／dev server log 全程無 error。**未修改任何 `src/`／`tests/` 程式碼**，純唯讀驗證，**UR-TODO-034 正式標記為已完成**。詳見 `008_TODO_BACKLOG.md` UR-TODO-034 條目。

**PR #214 Production 唯讀驗證＋UR-TODO-033 正式結案（2026-08-01）**：使用者手動 Merge [PR #214](https://github.com/hyc640110/family-universal-rebalance/pull/214)（`feat/ur-todo-033-holding-card-quote-layout`），merge commit `fd3ae448e9e7c5678a793f81d548fe5ed1f783c7`，`mergedAt: 2026-08-01T09:50:04Z`。以 `git fetch`／`gh run list` 確認 `origin/main` 推進、`Deploy GitHub Pages` workflow run `30694521777` success，headSha 與 merge commit 一致；`curl` 實測 Production／Preview 皆 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用。**UR-TODO-033**（持股卡片現價與今日漲跌版面完整差異）正式標記為已完成：新增 `formatCompactQuoteHeadline()`（重用既有 `formatCompactQuoteMovement()` 的 tone／有效性判斷），持股卡片「現價」格改為同列顯示「價格 元 ▲/▼ 漲跌幅%」，「今日漲跌」格只顯示金額（次列相鄰格），四者共用同一 tone class 一致著色（紅漲綠跌）；`npx tsc -b`、`test:ci` 全數通過（含更新後與新增測試）；隔離本機 dev server 實機驗證顏色與版面正確、無橫向溢出、console 無錯誤。詳見 `008_TODO_BACKLOG.md` UR-TODO-033 條目。

**PR #212 Production 唯讀驗證＋UR-TODO-032 實機驗收（2026-08-01）**：PR #212 Merge 後，以 `git fetch`／`gh run list` 確認 `origin/main` 推進至 merge commit `2abe5aca6acb34d481e738b0bc3ea16783ce9b35`，對應 `Deploy GitHub Pages` workflow run `30693109390` success、headSha 與 merge commit 一致；`curl` 實測 Production／Preview 皆 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用。隨後於 Development Mode／驗收性質下對 **UR-TODO-032**（資產頁更新股價入口與手機下拉更新盤點）以隔離本機 dev server（串接真實 Yahoo Finance via Cloudflare Worker，非使用者 Production 資料）實機驗證後**正式標記為已完成**：確認 `refreshQuotes()` → `createQuoteRefreshController` 為桌機／手機共用單一刷新入口，`latestQuoteTime`／`quoteSummaryText`／`quoteStatus` 為 `App.tsx` 頂層單一狀態、非各頁分別重算；實機以「更新股價」觸發刷新後，SPA 內部導覽切換首頁／資產頁／分析頁，確認同一時間戳記與報價數字完全一致重現，390px 無橫向溢出，console 全程無 error。**明確不包含**：手機觸控下拉手勢與明確錯誤狀態（Worker 失敗情境）本次網路正常未能重現，僅完成程式碼路徑靜態確認。**未修改任何 `src/`／`tests/` 程式碼**，為既有共用基礎設施順帶滿足。詳見 `008_TODO_BACKLOG.md` UR-TODO-032 條目。

**UR-TODO-026／027／028／032／033／034 唯讀盤點與 UR-TODO-028 實機驗收（2026-08-01）**：Claude Code 於 Review Mode 對 2026-07-23 補登建檔、此後從未被任何 PR 處理的六項舊待辦遺漏（UR-TODO-026、027、028、032、033、034）重新唯讀盤點最新 `main`（HEAD `a7cc0a4`），並於 Development Mode／驗收性質下對 **UR-TODO-028**（股息中心未指定資產編輯限制）以隔離本機 dev server（非使用者 Production 資料）實機驗證後**正式標記為已完成**——`DividendCenterPage.tsx` 對未指定資產紀錄同樣提供「編輯」入口，可於編輯表單自由補選／變更資產，經新增、編輯、重新整理持久化、390px 響應式、console 無錯誤逐項確認，**未修改任何 `src/`／`tests/` 程式碼**，為既有股息中心改版順帶滿足。UR-TODO-026（持有比率文字）發現需求前提「圓圈視覺」目前程式碼不存在，需使用者先決定需求範圍；UR-TODO-027、033、034 再次確認仍是真實缺口，狀態不變。詳見 `008_TODO_BACKLOG.md` 對應條目與最上方治理紀錄。

**治理落差補記（2026-08-01）**：本文件先前僅同步至 PR #198（2026-07-31T10:58:16Z），之後連續 7 支 PR（#199～#205）已合併卻未同步進本文件，本次一次補齊，正式基線推進至 **PR #205**。

- **PR #199**（MERGED）：merge commit `1ba8f58e5cabc8c562f3652ae62bfdb05837dd95`，`mergedAt: 2026-07-31T14:03:52Z`。純治理文件同步，將 PR #198 的實際合併結果記錄回本文件；同時記錄兩項唯讀觀察（§2 逐條清單缺 PR #195 獨立條目、`git stash list` 實際為 5 筆而非文件先前記載的 3 筆），皆未處理、僅加註待未來治理同步。
- **PR #200**（MERGED）：merge commit `8f194b02513ff251902fb8e43c1d4634d9f9a9cf`，`mergedAt: 2026-07-31T23:15:23Z`。**UR-TODO-048 子階段 C 已完成**：`AllocationSimulatorPage` 新增「套用 CLEC 442／433 權重樣板（試算）」區塊，重用既有純函式 `deriveAllocationPresetPreview`，角色資料採 component-local session-only 選擇器；`ClecStrategyCenterPage` 新增模擬器連結。隔離 Preview 環境（`workflow_dispatch`）實測套用樣板正確、不影響正式資料；`test:ci` 645/645 通過。`Deploy GitHub Pages` run `30672374531` success，headSha 與 merge commit 一致。
- **PR #201**（MERGED）：merge commit `bbf58c584ffe1148088af7874bbf6341130138a1`，`mergedAt: 2026-08-01T00:45:37Z`。純治理文件同步，記錄 PR #200 完成結果，並新增 **UR-TODO-048-D 提案**（CLEC 703／5050 純模擬模板，狀態待盤點，尚未授權開發）。`Deploy GitHub Pages` run `30676328860` success。
- **PR #202**（MERGED）：merge commit `5173e6a60efc1bfd66c7bee89dbae239a02bec77`，`mergedAt: 2026-08-01T04:18:30Z`。**UR-TODO-048 子階段 D 已完成**：局部擴充 `src/lib/allocationPresets.ts`（純資料性，經使用者對「唯讀盤點發現實際修改位置與提案不符」的追加授權）新增 `clec-703`（0/70/30）、`clec-5050`（0/50/50）兩組模擬限定樣板；`normalizeAllocationPreset`、`PRESET_WEIGHTS` 僅新增資料、既有 `clec-433`／`clec-442` 邏輯與數值未變；`ClecStrategyCenterPage` 未觸碰。`test:ci` 652/652 通過。`Deploy GitHub Pages` run `30683691820` success，headSha 與 merge commit 一致。
- **PR #203**（MERGED）：merge commit `87bf0188e644a4ce18542f7698d6f6cef4602d16`，`mergedAt: 2026-08-01T04:45:56Z`。**UR-TODO-048 子階段 E 已完成**：`clec-703`／`clec-5050` 顯示文字改為「7:3」「50:50」；`AllocationSimulatorPage` 模擬目標比例新增純模擬用「現金」項目（合成鍵 `CASH_TARGET_KEY`，component-local，不連動正式資金欄位，不進差額摘要／交易方向清單）；套用 CLEC 樣板時同步將現金目標歸零以避免超過 100%。`test:ci` 654/654 通過。`Deploy GitHub Pages` run `30684568560` success，headSha 與 merge commit 一致。
- **PR #204**（MERGED）：merge commit `1903bb9717bc02646cd280fedf6ad54c37e44bab`，`mergedAt: 2026-08-01T05:38:09Z`。純治理文件同步，記錄 `allocationRoleBySymbol` 欄位清理唯讀盤點結論：暫不清理、維持「待評估」，因該欄位雖已失去計算用途，仍是 `ClecStrategyCenterPage`「目前配置來源」卡片目前顯示中的角色標籤來源，清理需先由使用者對呈現方式做出決定。`Deploy GitHub Pages` run `30686209332` success。
- **PR #205**（MERGED）：merge commit `daef75a5c72f81a36084677bbee870c4de8fe8cd`，`mergedAt: 2026-08-01T05:45:07Z`。純治理文件同步，補齊 UR-TODO-048 子階段 D、E 的完成記錄進 `008_TODO_BACKLOG.md`（先前僅同步至子階段 C）。`Deploy GitHub Pages` run `30686430239` success，headSha 與 merge commit 一致。

**本次（treaty 補記）唯讀驗證**：Production `https://hyc640110.github.io/family-universal-rebalance/` 與 Preview `https://hyc640110.github.io/family-universal-rebalance/preview/` 本次以 `curl` 實測皆 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用。**UR-TODO-048 整體狀態：子階段 A～E 已完成**；`allocationRoleBySymbol` 欄位清理維持「待評估」；**UR-TODO-048-D 提案已完成**（實作為子階段 D／E，見上）。詳見 `008_TODO_BACKLOG.md` UR-TODO-048、UR-TODO-048-D 條目。

本次更新依據：**PR #198**（「feat: UR-TODO-048 phase B - retire CLEC 433/442 as an official allocationPreset」）已由使用者手動 Merge，merge commit `ca96b8b58b7d9cb42926ce5d6dbc6164e5050862`，此為目前 `main`／`origin/main` 正式基線。**UR-TODO-048 子階段 B 正式標記為已完成**：狀態層於 `App.tsx:375`（`normalizeState` 內）固定回傳 `'custom'`，取代原本會放行 `clec-433`／`clec-442` 的正規化邏輯，`normalizeAllocationPreset` 本身未修改，保留供子階段 C 純預覽計算重用；UI 層同一 PR 移除資產頁互動式 `AllocationPresetPanel`（CLEC 433／442 下拉選單、角色指派、套用按鈕）與其唯一寫入路徑 `applyAllocationPreset`，改為唯讀 `AllocationPresetSummary`（「目前正式配置：自訂配置」），同步修正 `allocationContext.ts`／`ClecStrategyCenterPage.tsx` 文案並清除死 CSS。隔離 Preview 環境（非真實使用者資料）以模擬 legacy 資料（`allocationPreset:'clec-433'` ＋ `targetWeight` 40／40／20）驗證遷移後 `allocationPreset` 變為 `custom`、`targetWeight` 與 `allocationRoleBySymbol` 完全不變，二次重新整理狀態穩定；`test:ci` 641/641 通過，`npx tsc -b` 與 Production／Preview build 皆成功。`CI Verification`（PR #198 內）與 Merge 後 `Deploy GitHub Pages` workflow run `30625373714`（`conclusion: success`，headSha 與 merge commit 一致）皆成功；Production／Preview 本次以 `curl` 實測皆 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用；Production 資產頁與 CLEC 策略中心畫面唯讀確認呈現正確，無殘留 CLEC 選項；**使用者已在自己的瀏覽器登入真實帳戶，確認 Production 上實際持股 `targetWeight` 未受影響**（此項超出 AI 可存取範圍的自動化驗證，由使用者本人確認）。**明確不包含**：子階段 C（CLEC 策略中心純模擬模板）尚未開始，需另行下達「開始開發」指示；`allocationRoleBySymbol` 欄位清理未評估，維持原狀。詳見 `008_TODO_BACKLOG.md` UR-TODO-048 條目。

本次更新依據：**PR #196**（「docs: add UR-TODO-047/048 governance baseline」）已由使用者事先授權、Claude Code 自行執行 `gh pr merge --admin` 完成 Merge（純治理文件同步，變更檔案僅 `AI_CONTEXT/008_TODO_BACKLOG.md`、`AI_CONTEXT/003_CURRENT_STATUS.md` 與 Full／Lite Bundle 四個檔案，符合機械式路徑檢查條件；`CI Verification` run `30622759369` 於 Merge 前已 success；因 Repository 僅一名 collaborator、無第二人可核准 PR，依 `007_GIT_WORKFLOW.md` §8.1 既有政策使用 `--admin` 繞過必要審查，已於 Merge 當下明確告知使用者），merge commit `91a2b087634b1a6cfb7f28d34508201cdf7c4c09`，`mergedAt: 2026-07-31T10:14:32Z`，此為目前 `main`／`origin/main` 正式基線。**首次正式建檔 UR-TODO-047 與 UR-TODO-048**：UR-TODO-047（負債模組與現金流固定支出清單重複計算風險盤點）狀態**已完成**，結論為無實際重複計算、風險等級「低」，`Loan.monthlyPayment` 為安全存量核心計算唯一正式來源，固定支出清單借款還款欄位在核心計算中被忽略、僅作有效性檢查；UR-TODO-048（CLEC 433／442 移轉為 CLEC 策略中心純模擬模板）狀態**規劃中**，子階段 A 唯讀盤點已完成（基準 `origin/main` HEAD `54e64fb50fd998c192a326a3604b06e6714add8a`，即 PR #195 merge commit），確認 `allocationPreset` 唯一收斂點為 `App.tsx:375`（`normalizeState` 內，經 `setState` wrapper 每次更新皆重新呼叫），資產頁 `AllocationPresetPanel` 為唯一可寫入 legacy 值的 UI 入口；子階段 B／C 尚未開始，需另行下達「開始開發」指示。此前兩個編號僅存在於 Claude Home（無 Repository 存取權）對話規劃中，Repository 內完全無記錄，PR #196 為首次正式建檔。對應 `Deploy GitHub Pages` workflow run `30622870430` success，headSha `91a2b08` 與 merge commit 一致，Production 部署已同步更新（本次未另以 `curl` 唯讀重新驗證 HTTP 狀態，因本輪內容純為 Todo 文字新增、無 UI／功能變更）。詳見 `008_TODO_BACKLOG.md` UR-TODO-047、UR-TODO-048 條目。

本次更新依據：**PR #194**（「docs: record UR-TODO-037 Phase 1 audit and default branch fix」）已由使用者手動 Merge，merge commit `67dab7552620e759d4381f22b6b44a2b3489c2f5`，`mergedAt: 2026-07-30T13:58:01Z`，此為目前 `main`／`origin/main` 正式基線。**UR-TODO-037 正式標記為已完成**：使用者確認選定「選項 2：中度保護」，`main` 已啟用 Branch Protection（`gh api repos/.../branches/main/protection` 實際查詢確認 `required_status_checks: {strict: false, checks: [{context: "verify"}]}`、`enforce_admins: false`、`required_pull_request_reviews.required_approving_review_count: 1`、`restrictions: null` 皆生效，`.protected` 回傳 `true`）；預設分支已於 PR #194 前一輪修正為 `main`（`gh api -X PATCH -f default_branch=main`）；GitHub Environments 人工核准經唯讀盤點確認唯一的 `github-pages` Environment 與實際部署流程無關（`deploy.yml` 未引用），使用者本次未要求授權修改 `deploy.yml` 使其生效，故此項**維持原狀**，不納入本次驗收範圍、不標記為已完成。因 Repository 僅一名 collaborator、無第二人可核准 PR，使用者確認「選項 A」：純治理文件同步 PR 既有自動 Merge 政策維持不變，可使用 `gh pr merge --admin` 繞過核准規則（預先授權，但每次使用須明確告知），已同步寫入 `007_GIT_WORKFLOW.md` §8.1。詳見 `008_TODO_BACKLOG.md` UR-TODO-037 條目。

本次更新依據：**PR #193**（「docs: mark UR-TODO-044 complete after PR #192, sync baseline to PR #192」）已由使用者手動 Merge，merge commit `391795963e500e3da63b1136a274198803bb81b4`，`mergedAt: 2026-07-30T13:40:07Z`。純治理文件同步，正式將 UR-TODO-044 標記為已完成（唯讀核對原「Phase 2b／2c」為單一區塊、兩項驗收條件已由 PR #192 完整達成），並將本文件正式基線推進至 PR #192；未修改 `src/`、`tests/`。

本次更新依據：**PR #192**（「feat: UR-TODO-044 Phase 2b - retire variableExpenseBudget via user-confirmed migration」）已由使用者手動 Merge，merge commit `2fc8ce1d071df5bd428d00dd72518747f7a5cf27`，`mergedAt: 2026-07-30T10:47:11Z`，此為目前 `main`／`origin/main` 正式基線。**UR-TODO-044 正式標記為已完成**（不再是「Phase 1／2a 已完成，Phase 2b／2c 待規劃」）：本次治理同步先唯讀核對原「Phase 2b／2c」文字自始為單一區塊、僅兩項驗收條件，PR #192 已完整達成兩項條件，全庫搜尋亦未發現殘留範圍，故整體標記已完成，不保留「Phase 2c」字樣。範圍：`src/lib/cashFlow.ts` 新增可選欄位 `variableExpenseBudgetMigratedAt`；新增 `src/lib/cashFlowVariableExpenseBudgetMigration.ts` 三個冪等純函式；`src/lib/householdLiquidityInputAdapter.ts` 的合成 living-expense 項目改為僅在欄位仍有待遷移正數時才注入（避免欄位清空後永久阻擋 `monthlyLivingExpenses`）；`src/pages/CashFlowPage.tsx` 移除手動輸入欄位、新增一次性使用者確認提示（方案 B）；新增 8 個測試並改寫 2 個既有測試反映新行為；`variableExpenseBudget` 型別保留為永久可為 `null` 的舊資料相容欄位。`CI Verification` run `30533633234` success，headSha 與 PR head `068deeb` 一致；`Deploy GitHub Pages` run `30536018542`（`event: push`）success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 與隔離瀏覽器實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用；隔離瀏覽器階段（Preview 與 Production，未使用使用者實際資料）分別驗證確認／忽略兩條遷移路徑正確運作、重新整理不重複跳出、390px 手機寬度無橫向溢出、console 全程無錯誤。詳見 `008_TODO_BACKLOG.md` UR-TODO-044 條目。

本次更新依據：**PR #191**（「docs: add UR-TODO-046 net worth growth attribution triage (待評估)」）已由使用者手動 Merge，merge commit `7ffcc34219d642bd1ba67ce42c61549702188b0c`，`mergedAt: 2026-07-30T09:19:28Z`。純治理文件同步，新增 **UR-TODO-046**（淨值成長來源歸因與記錄／實際落差核對）正式條目，狀態「待評估」，明確依賴 UR-TODO-043-B 定案後才排程；未修改 `src/`、`tests/`。

本次更新依據：**PR #190**（「docs: sync UR-TODO-005 completion (PR #189) into governance docs」）已由使用者手動 Merge，merge commit `6f6a0c0216a7c1a5caaaf7a22c6cc0e4eb927af1`，`mergedAt: 2026-07-29T23:47:40Z`。純治理文件同步，補齊 PR #189（UR-TODO-005 已完成）落地後本文件與 Bundle 未同步到位的落差；未修改 `src/`、`tests/`。

本次更新依據：**PR #189**（「test: 補充 sanitizeHolding 名稱解析邏輯單元測試（UR-TODO-005）」）已由使用者手動 Merge，merge commit `3b4549e2d868131a158772530aad16ee3145e415`，`mergedAt: 2026-07-29T15:39:16Z`，此為目前 `main`／`origin/main` 正式基線。**UR-TODO-005（00685L、00895 名稱持久化）正式標記為已完成**：Phase 1 唯讀盤點確認名稱解析有三層防護（既有名稱 > `SYMBOL_NAMES` 內建對照表 > 代碼本身），`pickName()` 明確跳過空字串，不會覆蓋既有名稱；更新股價、reload、localStorage、Firebase、Backup 四個持久化情境皆經同一條 `normalizeState()` → `sanitizeHolding()` → `resolveSymbolName()` 正規化路徑，封存／恢復不觸碰 `name` 欄位。PR #189 將名稱解析鏈（`TAIWAN_SYMBOL_RE`／`isTaiwanSymbol`／`sanitizeName`／`pickName`／`quoteNameFields`／`resolveSymbolName`）從 `src/App.tsx` 逐字搬移至新檔案 `src/lib/holdingNameResolution.ts`（零邏輯改動），新增 `tests/holdingNameResolution.test.ts` 12 個行為測試，以「00685L」（數字＋字母後綴）與「00895」（純數字）為主要案例。**明確不包含：`sanitizeHolding()` 本身未完整搬移或測試**——另外依賴 `DEPLOYMENT_ENVIRONMENT`／`PREVIEW_ARCHIVED_FIXTURE_SYMBOL`（`import.meta.env` 衍生）與 `REMOVED_SYMBOLS`（刻意隱晦處理的合規性封鎖清單），未經理解完整脈絡前不予搬動，保留原狀，列為未來待討論項目。`CI Verification` run `30466669879` success（headSha `9a79cc3`）；`Deploy GitHub Pages` run `30466920692` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用。詳見 `008_TODO_BACKLOG.md` UR-TODO-005 條目。

本次更新依據：**PR #187**（「fix: 統一 investmentHealth 風險提醒文案小數位數為 1 位」）已由使用者手動 Merge，merge commit `4e2975aa8686fe3ca8d0a4ba92af5a9709d1ce69`，`mergedAt: 2026-07-29T14:55:34Z`，此為目前 `main`／`origin/main` 正式基線。**UR-TODO-004（同一畫面內成長／防守資產比例小數位數不一致，原標題「桌機／手機目前偏離目標一致性」）正式標記為已完成**：Phase 1 唯讀盤點證實原「桌機／手機顯示不同數字」假設不成立——`rebalance()`（`src/App.tsx`）為唯一計算來源，透過 `useMemo` 只計算一次，`isMobile` 從未介入計算或格式化路徑；實際問題為同一畫面內五處獨立格式化函式（`pct()`／`allocationPct()`／`formatCompactHoldingWeight()`／`RebalanceRecommendationPage.tsx` 區域 `pct()`／`investmentHealth.ts` 的 `pct()`）小數位數不一致（2 位 vs 1 位）。**PR #186**（merge commit `06f7f4c28bd6ee6cef9e947f4dbf371436cba04c`，`mergedAt: 2026-07-29T14:45:26Z`）統一 `App.tsx` 的 `pct()` 為 1 位小數；**PR #187**（本次）跟進統一 `investmentHealth.ts` 的第五處 `pct()`。兩支 PR 的 `CI Verification`（PR #186 run `30462239872`、PR #187 run `30463163409`）皆成功；`Deploy GitHub Pages`（PR #186 run `30462458497`、PR #187 run `30463317966`）皆成功，headSha 與各自 merge commit 一致；Production／Preview 兩次皆以 `curl` 實測 HTTP 200，`deployment-environment` metadata 正確、資源路徑未混用。詳見 `008_TODO_BACKLOG.md` UR-TODO-004 條目。

本次更新依據：**PR #184**（「fix: UR-TODO-044 Phase 2a - 移除固定支出角色 fallback 的靜默分類分歧」）已由使用者手動 Merge，merge commit `498941ae46aeb5806904103c4513e25f87555999`，`mergedAt: 2026-07-29T13:42:57Z`，此為目前 `main`／`origin/main` 正式基線。**UR-TODO-044 Phase 1（唯讀盤點）與 Phase 2a（角色未設定 fallback 修正）均已完成**：Phase 1 由 Claude Home 於 Review Mode 發起唯讀盤點，確認 `src/lib/householdLiquidityInputAdapter.ts` 的 `cashFlowRole()` 在固定支出項目 `liquidityRole` 未設定時依分類分歧——`housing`／`loan`／`other` 三類回傳 `'ambiguous'`（正確阻擋），其餘五類（保險／水電瓦斯電信／交通／家庭支出／訂閱服務）靜默預設為 `'essential-living'`，違反 `013_HOUSEHOLD_LIQUIDITY_SPEC.md` §16.4「不得靜默猜測」；Phase 2a 修正為 8 個分類未設定角色時一律回傳 `'ambiguous'`，並同步修正 `src/lib/householdLiquidityInputDiagnostics.ts` 內一份未同步的重複邏輯（`requiresExplicitRole()`，同一組 3 類判斷的第二份拷貝，決定是否顯示「尚未指定家庭流動性用途」引導訊息），避免計算層已阻擋、診斷層仍靜默不提示的落差；`householdLiquidity.ts` 核心模型完全未修改，沿用既有通用的 `'ambiguous'` role 阻擋機制（`DEBT_PAYMENT_AMBIGUOUS`）。`CI Verification` run `30457065192` success（headSha `c39261d`）；`Deploy GitHub Pages` run `30457308734` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用；並於隔離瀏覽器階段（Preview 環境，未使用使用者實際 Production 資料）建立涵蓋全部 8 個分類、角色皆未設定的固定支出項目後，於「風險與現金安全中心」展開「待補齊的資料來源」，確認 8 個分類皆一致顯示「尚未指定家庭流動性用途」引導訊息。**Phase 2b／2c（「每月生活費預算」欄位存廢與資料遷移）明確未處理，待使用者未來另行規劃**。詳見 `008_TODO_BACKLOG.md` UR-TODO-044 條目。

本次更新依據：**PR #182**（「feat: UR-TODO-045 net worth history grid collapse」）已由使用者手動 Merge，merge commit `ee5595a3bd85291d29c3242bb7c0f1d3ba93aade`，`mergedAt: 2026-07-29T10:11:13Z`，此為目前 `main`／`origin/main` 正式基線。**UR-TODO-045（淨資產歷史頁面新增收合／分頁功能）正式標記為已完成**：`NetWorthHistoryPage.tsx` 新增純前端顯示層收合機制（`showAllHistoryGrid`，不持久化），預設顯示最新 7 筆，超過 7 筆時可展開；`src/lib/netWorthHistory.ts` 資料層完全未觸碰。`CI Verification` run `30441980987` success；`Deploy GitHub Pages` run `30442672832` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用；Production 上實測收合／展開／再收合三段行為皆符合預期。

**治理落差記錄（僅記錄，未在本次修正）**：`003`／`008`／`012` 三份文件先前僅同步至 PR #179；PR #180（治理同步）、PR #181（UR-TODO-043-C2）、PR #182（本次）皆已合併，但 #180、#181 本身尚未各自有獨立段落記錄其合併事實（與先前 PR #176／#178 出現過的「下一支 PR 才回頭記錄上一支」同類落差）。UR-TODO-043-C2 已完成（PR #181），下方 UR-TODO-043 條目內「下一候選：043-C2」的排程敘述已過期，待後續治理同步一併更新為「043-C2 已完成，下一候選為 043-C3」；本次僅記錄此落差，不在本次治理同步中修正，以維持本次範圍單純。

本次更新依據：**PR #179**（「docs: reconfirm UR-TODO-030 homepage 30-second decision center direction」）已由使用者手動 Merge，merge commit `94c3d08d1a18d4d81d41b003d1cc5f5e41231d24`，`mergedAt: 2026-07-28T18:15:50Z`，此為目前 `main`／`origin/main` 正式基線。此 PR 正式再次確認首頁「30 秒決策中心」產品方向為既有決策並完整保留：首頁未來只回答「今天是否需要做什麼」，建議保留今日是否需操作／精簡資產總覽／更新狀態三項，使用者已明確表示很少查看目前首頁大量資訊，「今日投資狀態」未來可移到分析頁或收合為一行摘要。**本 PR 未修改任何首頁 UI，未開始 UR-TODO-043-C2**，此項仍屬 Dashboard UX／UR-TODO-030 待盤點範圍。Deploy GitHub Pages run `30386642108` success，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 為 `production`。

本次更新依據：**PR #178**（「docs: sync PR #176-177 baseline into governance docs」）已由使用者手動 Merge，merge commit `4280ac44e6dd814eb0054ed1cd2012e7c8242c1e`，`mergedAt: 2026-07-28T17:59:01Z`。此 PR 正式完成 **PR #176／#177 後治理同步**：記錄 PR #176（UR-TODO-043-C1 唯讀正規化契約盤點正式記錄）與 PR #177（Cash Flow 儲存動作位置調整，與 UR-TODO-043-C2 無耦合），並重新產生 Full／Lite Bundle。Deploy GitHub Pages run `30385353684` success，headSha 與 merge commit 一致。

本次更新依據：**PR #177**（「fix: move cash flow save actions below expenses」）已由使用者手動 Merge，merge commit `c8b6c95a60a7d3c60e4eb85b7d9889427dc30d5d`，`mergedAt: 2026-07-28T17:21:20Z`。PR 內容為收支與現金流中心「儲存現金流設定」「清空設定」兩個既有動作，從固定支出清單上方移到清單下方；PR 內文明確排除 `cashFlowProfile` schema、`liquidityRole`、`linkedLoanId`、Household Liquidity 公式與 UR-TODO-043，與 UR-TODO-043-C2 無直接耦合。純 UI 位置調整，未變更任何函式邏輯或資料契約。

本次更新依據：**PR #176**（「docs: record UR-TODO-043-C1 normalization audit」）已由使用者手動 Merge，merge commit `272cd4a9ccff0c2def7bf0c73afbdbdf89363d58`，`mergedAt: 2026-07-28T16:49:20Z`。此 PR 正式記錄 **UR-TODO-043-C1 唯讀契約盤點結論**，並重新產生 Full／Lite Bundle；下方原記載「本治理同步 PR 待 Merge」的描述已過期，本次更正為已合併。

本次更新依據：**PR #175**（UR-TODO-043-A Merge 後治理同步）已由使用者手動 Merge，merge commit `738513f16c1aa9f2ac2dbcc15a944aad6cd26328`，`mergedAt: 2026-07-28T16:37:40Z`；Deploy GitHub Pages run `30379137766` 為 `success`，其 `headSha` 與 merge commit 完全一致。Production 與 Preview Pages 均 HTTP 200，HTML deployment metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。其後完成 **UR-TODO-043-C1 唯讀契約盤點**：`normalizeNetWorthHistory` 在 AppState／localStorage／Firebase 下載／JSON Backup 匯入入口以寬鬆數值轉換將缺失、不可解析與非有限欄位改為 `0`；`normalizeInvestmentPerformanceHistory` 則僅接受完整有限數字快照。由於 App 在傳給 Analytics 前已先採用寬鬆 normalizer，原始缺失語意可能已不可逆消失。C1 未修改 Production 程式、日期契約、schema、migration、UI 或測試 expectation，整體 **UR-TODO-043 維持 P2／待盤點**。

本次更新依據：**PR #174**（UR-TODO-043-A characterization tests）已由使用者手動 Merge，merge commit `9ac2cef82bad3a0a793f0db971d604c2b3e79463`，`mergedAt: 2026-07-28T16:22:11Z`；Deploy GitHub Pages run `30377915466` 為 `success`，其 `headSha` 與 merge commit 完全一致。Production 與 Preview Pages 均 HTTP 200，HTML deployment metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。PR #174 只新增 snapshot／日期／consumer 邊界的 characterization tests，未修改 `src/`、日期契約、schema、migration、UI、Dashboard、Analytics、AI Decision、Rebalance、相依套件或 `package-lock.json`，不代表現行行為是理想契約。

本次更新依據：**PR #171**（家庭流動性資料關聯與診斷子 PR 3）已由使用者手動 Merge，merge commit `778767036853bbbab0da7ba64f3df4887c6c0d70`，`mergedAt: 2026-07-28T15:18:53Z`；Deploy GitHub Pages run `30372749694` 為 `success`，其 `headSha` 與 merge commit 完全一致。Production 與 Preview Pages 均 HTTP 200，HTML deployment metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。PR #171 只新增共用家庭流動性診斷呈現層，並由 App 單次計算後傳入 Analytics、Risk Center 與 AI Decision；不修改 Household Liquidity 核心公式、blocking reason code、adapter、核心金額、Cash Flow 角色 UI、schema、Firebase 或 Backup。子 PR 1～3 的程式、測試、Preview 驗收、Merge 與部署已完成；但 Production 公開端點無法在不操作使用者本機資料下重現代表性診斷情境，三頁 Production 互動資料驗收維持**待盤點**，整體 Sprint 尚不得宣告完全結案。下方早期事件記錄僅保留歷史脈絡；正式現況以本節 1～3 與最新 Repository／GitHub workflow 為準。

2026-07-29 治理文件同步：**UR-TODO-043-A 已完成**。characterization tests 已重現時區造成日期鍵差異、同日快照依陣列最後一筆取值的排序風險，以及淨資產歷史將無效值轉為 0 而 Analytics 嚴格排除的跨頁分歧；均未修改 Production 行為，仍不得直接判定為公式 Bug。**UR-TODO-043 整體維持 P2／待盤點**。下一個候選只能先進行 **043-C Review Mode**：唯讀界定跨 consumer 的正規化與無效值語意、既有資料相容性及測試範圍；043-B 的日期產品契約決策排在其後，未經使用者明確授權不得建立 Branch、開始開發或啟動其他 Todo。

2026-07-29 C1 結論：下一個候選是 **043-C2**，僅建立不接正式 consumer 的純 `netWorthSnapshotNormalization` 契約、型別與測試，先保留明確 `0` 與 missing／invalid 的差異；不得在 C2 修改 `App.tsx`、持久化、日期或同日快照規則。**043-C3** 才能在另行授權後逐頁接線並移除重複寬鬆轉換；**043-C4** 僅在需要新增 legacy metadata、改寫既有資料或實證 round-trip 會破壞資料時才評估。現階段沒有 Production 真實資料遭錯誤顯示或財務決策被污染的證據，不升級 P1。

## 1. 最新正式版本

- 正式版本：產品版本 V7.0B Financial Liquidity Core 的 Sprint 3（UR-TODO-008）、Sprint 4（UR-TODO-009）、Sprint 5（UR-TODO-010）與 **Sprint 6（UR-TODO-011）均已完成**。
- 名稱：Cross-Module Presentation Consistency — UR-TODO-011 Sprint 6；UR-TODO-043 目前處於 P2／待盤點的 Review Mode 子階段（043-A、043-C1、**043-C2 已完成**，下一候選為 043-C3，惟下方逐條記錄尚未更新此排程變化，見上方「治理落差記錄」）；**UR-TODO-045 已完成**；**UR-TODO-044 已完成**（Phase 1／2a／2b 全數達成，不存在獨立殘留的 Phase 2c 範圍）；**UR-TODO-037 已完成**（預設分支修正、Branch Protection 選項 2 皆已落地；GitHub Environments 人工核准維持原狀，非本次驗收範圍）；**UR-TODO-004 已完成**；**UR-TODO-005 已完成**；**UR-TODO-046**（淨值成長來源歸因）Phase 1 唯讀盤點完成，狀態「待評估」，依賴 UR-TODO-043-B 定案後才排程；**UR-TODO-047 已完成**（負債模組與現金流固定支出清單重複計算風險盤點，無實際重複計算）；**UR-TODO-048**（CLEC 433／442 移轉為 CLEC 策略中心純模擬模板）**子階段 A～E 已完成**（狀態層固定回傳 `custom`＋UI 層移除 `AllocationPresetPanel`／子階段 B PR #198；模擬頁套用 442/433 樣板／子階段 C PR #200；新增 703/5050 模擬限定樣板／子階段 D PR #202；樣板改名＋模擬現金項目／子階段 E PR #203），`allocationRoleBySymbol` 欄位清理維持「待評估」；**UR-TODO-048-D 提案已完成**（即上述子階段 D／E，狀態由「待盤點」更新為「已完成」）；**UR-TODO-028 已完成**（股息中心未指定資產紀錄可安全編輯，2026-08-01 唯讀盤點＋隔離 dev server 實機驗收確認，既有功能已滿足，未新增程式碼）；**UR-TODO-032 已完成**（更新股價入口與跨頁一致性，2026-08-01 唯讀盤點＋隔離 dev server 實機驗收確認，桌機／手機共用單一刷新契約、首頁／資產頁／分析頁報價與時間戳記完全一致，既有基礎設施已滿足，未新增程式碼；手機觸控下拉手勢與錯誤狀態本次未實機重現，僅程式碼路徑確認）；**UR-TODO-033 已完成**（持股卡片現價與今日漲跌版面差異，2026-08-01 PR #214 Merge，新增 `formatCompactQuoteHeadline()`，現價同列顯示價格＋▲/▼＋漲跌幅、今日漲跌次列顯示金額，四者一致著色）；**UR-TODO-034 已完成**（2026-08-01 唯讀實機驗證，以 00631L、00865B 兩檔測試 Worker／state／localStorage／各頁 selector 跨頁一致性，未發現殘留舊報價，純唯讀驗證未修改任何程式碼）；**UR-TODO-026 已由使用者手動 Merge PR #216**（`fix/ur-todo-026-remove-holding-ratio-label`，merge commit `63feac1f0012546fadc1e341c55c047c967ada65`，只移除「持有比例」文字標籤、保留百分比數字，未新增任何圖形／圓圈視覺；本文件先前僅記錄「排入開發中」尚未同步 Merge 結果，本次一併補齊，**正式標記為已完成**）；UR-TODO-027 仍維持「待盤點」。
- PR：**#205**（MERGED，補齊 UR-TODO-048 子階段 D／E 完成記錄進 `008_TODO_BACKLOG.md`）為目前 `origin/main` 最新 Merge；**#204**（MERGED，`allocationRoleBySymbol` 欄位清理唯讀盤點記錄）、**#203**（MERGED，UR-TODO-048 子階段 E，CLEC 703/5050 改名為 7:3/50:50、模擬頁新增現金項目）、**#202**（MERGED，UR-TODO-048 子階段 D，新增 CLEC 703/5050 模擬限定樣板）、**#201**（MERGED，UR-TODO-048 子階段 C 完成記錄與 UR-TODO-048-D 提案排入 Backlog）、**#200**（MERGED，UR-TODO-048 子階段 C，模擬頁套用 CLEC 442/433 樣板）、**#199**（MERGED，PR #198 治理文件基線同步）、**#198**（MERGED，UR-TODO-048 子階段 B，狀態層＋UI 層一併移除 CLEC 433／442 正式配置選項）、**#197**（MERGED，PR #196 治理文件基線同步）、**#196**（MERGED，首次正式建檔 UR-TODO-047／048，`gh pr merge --admin`）、**#194**（MERGED，UR-TODO-037 Phase 1 唯讀盤點與預設分支修正記錄）、**#193**（MERGED，UR-TODO-044 完成記錄與基線同步）、**#192**（MERGED，UR-TODO-044 Phase 2b variableExpenseBudget 使用者確認遷移）、**#191**（MERGED，UR-TODO-046 Phase 1 唯讀盤點排入 Backlog）、**#190**（MERGED，PR #189 後治理同步）、**#189**（MERGED，UR-TODO-005 補充 `sanitizeHolding` 名稱解析邏輯單元測試）、**#188**（MERGED，UR-TODO-004 治理同步）、**#187**（MERGED，跟進統一 `investmentHealth.ts` 的 `pct()` 小數位數）、**#186**（MERGED，UR-TODO-004 主修正，`App.tsx` 的 `pct()` 統一為 1 位小數）、**#185**（MERGED，UR-TODO-044 Phase 2a 治理同步）、**#184**（MERGED，UR-TODO-044 Phase 2a 固定支出角色 fallback 修正）、**#182**（MERGED，UR-TODO-045 淨資產歷史頁面收合／分頁）、**#181**（MERGED，UR-TODO-043-C2 net worth snapshot normalization）、**#180**（MERGED，PR #178／#179 治理同步）、**#179**（MERGED，UR-TODO-030 首頁 30 秒決策中心方向再確認）、**#178**（MERGED，PR #176／#177 後治理同步）、**#177**（MERGED，Cash Flow 儲存動作位置調整）、**#176**（MERGED，UR-TODO-043-C1 治理同步）、**#175**（MERGED，UR-TODO-043-A Merge 後治理同步）為前置已合併 PR。
- 前置同系列 PR（UR-TODO-008，V7.0B Sprint 3，已完成）：**#116**（子 PR 1／5，buy-only，MERGED）、**#118**（子 PR 2／5，standard，MERGED）、**#120**（子 PR 3／5，Execution Eligibility investableCash contract，MERGED）、**#122**（子 PR 4a／5，Order Helper characterization test 安全準備，MERGED）、**#124**（子 PR 4b／5，Order Helper investableCash 串接，MERGED）、**#126**（子 PR 5a／5，Dip Alert characterization test 安全準備，MERGED）
- 狀態：**UR-TODO-010 已完成**；**UR-TODO-011 已完成**。011A 建立防守配置呈現契約，011B 完成 Analytics 單一卡片與舊提醒替換，011C 完成 Cash Flow／CLEC 名稱一致；程式、測試、Preview、Production 與治理同步均已閉環。
- 最新 merge commit（PR #205）：
  `daef75a5c72f81a36084677bbee870c4de8fe8cd`
- 最新功能性子 PR merge commit（PR #127，V7.0B 子 PR 5b／5，UR-TODO-008 系列歷史記錄）：
  `83431910a7948d32f52deb0b98715080286f3fb3`

## 2. Repository 狀態

- Repository：`hyc640110/family-universal-rebalance`
- 正式基線：`origin/main`＝`daef75a5c72f81a36084677bbee870c4de8fe8cd`（PR #205 merge commit，2026-08-01T05:45:07Z）。
- 已合併子 PR：UR-TODO-010 的 PR #150、#152、#154、#156、#157，以及 UR-TODO-011 子 PR 011A `feat/ur-todo-011a-defensive-configuration-presentation`（PR #160）、011A 治理同步（PR #161）、011B `feat/ur-todo-011b-analytics-defensive-status`（PR #162）、011B 治理同步（PR #163）、011C `feat/ur-todo-011c-cash-flow-clec-terminology`（PR #164）、011C 治理同步（PR #165）；其變更已納入正式基線。
- 原工作目錄的 `dist/` 變動與未追蹤 `.claude/` 不屬本 Sprint，未被清除、覆蓋或 stash；固定 stash 未受影響。
- PR #167：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/167)；只新增 `deriveHouseholdLiquidityInputDiagnostics` 與 provenance tests，明確區分 Cash Flow Profile 缺失、Loan 來源不可用、未連結借款與失效借款連結。
- PR #169：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/169)；Cash Flow 固定支出新增既有角色選擇與 debt-payment Loan 選擇，保留 orphan `linkedLoanId` 的可診斷狀態，離開 debt-payment 時依既有 normalizer 移除連結。未修改核心公式、blocking reason code、正式診斷 consumer、Analytics、Risk Center、AI Decision、schema、Firebase、Backup 或 Import／Export。
- PR #171：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/171)；App 單次產生並傳遞 diagnostics，Analytics 防守配置狀態、Risk Center 與 AI Decision 共用相同 mapping／清單元件，預設顯示最高優先三項並可展開完整清單。缺失 Cash Flow Profile、Loan 來源不可用、未連結借款、失效借款連結、未指定角色及未設定額外投入／計畫提領均有可讀文案與既有 Cash Flow 導航。未修改核心公式、blocking reason code、adapter、AI Decision 結論、核心金額、Cash Flow 角色 UI、Dashboard、Firebase、Backup 或 Import／Export。
- PR #174：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/174)；新增 15 個 UR-TODO-043-A characterization cases 與 1 個既有 investment performance 測試入口調整。已鎖定「不同時區產生不同日期鍵」、「同日快照依陣列最後一筆而非 timestamp 選取」及「淨資產歷史無效值轉 0、Analytics 嚴格排除」的現況；所有案例皆為 Characterization only、Do not treat as desired contract、Pending product decision。
- PR #175：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/175)；同步 PR #174 Merge 後的治理來源與 Full／Lite Bundle。C1 已確認快照正規化有兩個平行實作：`src/lib/netWorthHistory.ts` 的 `n`／`normalizeNetWorthHistory` 寬鬆轉為 0，`src/lib/investmentPerformanceHistory.ts` 的 `finite`／`normalizeInvestmentPerformanceHistory` 嚴格排除整筆。後續不得直接修改任一行為，必須先由 043-C2 建立可測的共用純契約。
- PR #176：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/176)；merge commit `272cd4a9ccff0c2def7bf0c73afbdbdf89363d58`，`mergedAt: 2026-07-28T16:49:20Z`。正式記錄 **UR-TODO-043-C1 唯讀正規化契約盤點**結論並重新產生 Full／Lite Bundle；純治理文件同步，未修改 `src/`、`tests/`、schema、migration 或 UI。此 PR 落地後，UR-TODO-008 Backlog 內原「本治理同步 PR 待 Merge」描述即已過期。
- PR #177：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/177)；merge commit `c8b6c95a60a7d3c60e4eb85b7d9889427dc30d5d`，`mergedAt: 2026-07-28T17:21:20Z`。範圍僅將收支與現金流中心「儲存現金流設定」「清空設定」兩個既有動作，從固定支出清單上方移到清單下方；PR 內文明確排除 `cashFlowProfile` schema、`liquidityRole`、`linkedLoanId`、Household Liquidity 公式、診斷、Analytics、Risk Center、AI Decision 與 UR-TODO-043，與 UR-TODO-043-C2 無直接耦合。
- PR #178：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/178)；merge commit `4280ac44e6dd814eb0054ed1cd2012e7c8242c1e`，`mergedAt: 2026-07-28T17:59:01Z`，`mergedBy: hyc640110`。純治理文件同步，正式完成 PR #176／#177 後治理同步：記錄 PR #176（UR-TODO-043-C1 唯讀正規化契約盤點正式記錄）與 PR #177（Cash Flow 儲存動作位置調整），並重新產生 Full／Lite Bundle。未修改 `src/`、`tests/`、schema、migration 或 UI。
- PR #179：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/179)；merge commit `94c3d08d1a18d4d81d41b003d1cc5f5e41231d24`，`mergedAt: 2026-07-28T18:15:50Z`，`mergedBy: hyc640110`。純治理文件同步，正式再次確認 UR-TODO-030 首頁「30 秒決策中心」產品方向為既有決策、完整保留：首頁未來只回答「今天是否需要做什麼」，建議保留今日是否需操作／精簡資產總覽／更新狀態三項，使用者已明確表示很少查看目前首頁大量資訊，「今日投資狀態」未來可移到分析頁或收合為一行摘要。**未修改任何首頁 UI，未開始 UR-TODO-043-C2**，此項仍屬 Dashboard UX／UR-TODO-030 待盤點範圍。
- PR #180：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/180)；merge commit `0e03445c4a7768b3f2da848bd508ba8e004d3b64`，`mergedAt: 2026-07-28T18:47:49Z`，`mergedBy: hyc640110`。純治理文件同步，記錄 PR #178／#179 基線並重新產生 Full／Lite Bundle。
- PR #181：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/181)；merge commit `6ea49868feb30b6a62aca1a5117df09eedf3476a`，`mergedAt: 2026-07-29T04:39:59Z`（依 `Deploy GitHub Pages` run `30422887724` headSha 對應時間）。**UR-TODO-043-C2 已完成**：新增純函式 `src/lib/netWorthSnapshotNormalization.ts`（`classifyNetWorthSnapshotFieldValue`／`classifyNetWorthSnapshotFields`），四分類 valid／missing／invalid／non-finite，字串分類規則為本次新建立的正式決策；未接任何正式 consumer，未修改 `netWorthHistory.ts`／`investmentPerformanceHistory.ts`。
- PR #182：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/182)；merge commit `ee5595a3bd85291d29c3242bb7c0f1d3ba93aade`，`mergedAt: 2026-07-29T10:11:13Z`，`mergedBy: hyc640110`。**UR-TODO-045 已完成**：`NetWorthHistoryPage.tsx` 新增純顯示層收合機制，詳見 `008_TODO_BACKLOG.md` UR-TODO-045 條目。
- PR #183：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/183)；merge commit `ba9ed80165a1c7854dbd936b682361ceb1b43af1`。純治理文件同步（UR-TODO-045 基線同步），未修改 `src/`、`tests/`，內容已完整反映於本文件先前版本。
- PR #184：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/184)；merge commit `498941ae46aeb5806904103c4513e25f87555999`，`mergedAt: 2026-07-29T13:42:57Z`，`mergedBy: hyc640110`。**UR-TODO-044 Phase 2a 已完成**：`src/lib/householdLiquidityInputAdapter.ts` 的 `cashFlowRole()` fallback 由「3 類 ambiguous、5 類靜默 essential-living」改為 8 類一律 `'ambiguous'`；一併修正 `src/lib/householdLiquidityInputDiagnostics.ts` 內未同步的重複判斷邏輯 `requiresExplicitRole()`。詳見 `008_TODO_BACKLOG.md` UR-TODO-044 條目。
- PR #185：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/185)；merge commit `a9abf4589ab65c6d1b6c4d514bf0360677814470`，`mergedAt: 2026-07-29T14:10:42Z`，`mergedBy: hyc640110`。純治理文件同步（UR-TODO-044 Phase 2a 基線同步），未修改 `src/`、`tests/`。
- PR #186：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/186)；merge commit `06f7f4c28bd6ee6cef9e947f4dbf371436cba04c`，`mergedAt: 2026-07-29T14:45:26Z`，`mergedBy: hyc640110`。**UR-TODO-004 主修正已完成**：`src/App.tsx` 的共用 `pct()` 由 2 位小數統一為 1 位，對齊既有其餘三處格式化函式；未修改任何計算邏輯。詳見 `008_TODO_BACKLOG.md` UR-TODO-004 條目。
- PR #187：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/187)；merge commit `4e2975aa8686fe3ca8d0a4ba92af5a9709d1ce69`，`mergedAt: 2026-07-29T14:55:34Z`，`mergedBy: hyc640110`。**UR-TODO-004 跟進修正已完成**：`src/lib/investmentHealth.ts` 的第五處獨立 `pct()` 同步統一為 1 位小數，用於「風險提醒」文案；未修改任何判斷邏輯。UR-TODO-004 至此全數完成。
- PR #188：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/188)；merge commit `f906e24158566a2a3a61d6506061a11ebbccf390`，`mergedAt: 2026-07-29T15:17:19Z`，`mergedBy: hyc640110`。純治理文件同步（UR-TODO-004 完成記錄），未修改 `src/`、`tests/`。
- PR #189：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/189)；merge commit `3b4549e2d868131a158772530aad16ee3145e415`，`mergedAt: 2026-07-29T15:39:16Z`，`mergedBy: hyc640110`。**UR-TODO-005 已完成**：將名稱解析鏈自 `src/App.tsx` 逐字搬移至 `src/lib/holdingNameResolution.ts`（零邏輯改動），新增 12 個行為測試涵蓋 `00685L`／`00895` 名稱解析情境；`sanitizeHolding()` 本身因牽動 `REMOVED_SYMBOLS`／環境變數耦合，未完整搬移或測試，保留原狀。詳見 `008_TODO_BACKLOG.md` UR-TODO-005 條目。
- PR #190：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/190)；merge commit `6f6a0c0216a7c1a5caaaf7a22c6cc0e4eb927af1`，`mergedAt: 2026-07-29T23:47:40Z`，`mergedBy: hyc640110`。純治理文件同步，補齊 PR #189（UR-TODO-005 已完成）落地後的治理文件與 Bundle 落差；未修改 `src/`、`tests/`。
- PR #191：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/191)；merge commit `7ffcc34219d642bd1ba67ce42c61549702188b0c`，`mergedAt: 2026-07-30T09:19:28Z`，`mergedBy: hyc640110`。純治理文件同步，新增 **UR-TODO-046**（淨值成長來源歸因與記錄／實際落差核對）正式條目，Phase 1 唯讀盤點結論詳見 `008_TODO_BACKLOG.md`；狀態「待評估」，明確依賴 UR-TODO-043-B 定案後才排程，並與 UR-TODO-023 劃清邊界；未修改 `src/`、`tests/`。
- PR #192：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/192)；merge commit `2fc8ce1d071df5bd428d00dd72518747f7a5cf27`，`mergedAt: 2026-07-30T10:47:11Z`，`mergedBy: hyc640110`。**UR-TODO-044 Phase 2b 已完成，UR-TODO-044 整體正式標記為已完成**：`src/lib/cashFlow.ts` 新增可選欄位 `variableExpenseBudgetMigratedAt`；新增 `src/lib/cashFlowVariableExpenseBudgetMigration.ts` 三個冪等純函式（方案 B，使用者確認遷移，非靜默自動遷移）；`src/lib/householdLiquidityInputAdapter.ts` 的合成 `cash-flow:variable-expense-budget` living-expense 項目改為僅在欄位仍有待遷移正數時才注入；`src/pages/CashFlowPage.tsx` 移除手動輸入欄位、新增一次性確認提示；新增 8 個測試並改寫 2 個既有測試（`tests/householdLiquidityInputAdapter.test.ts` 12b／13）反映新行為；`variableExpenseBudget` 型別保留、未從 schema 移除。詳見 `008_TODO_BACKLOG.md` UR-TODO-044 條目。
- PR #193：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/193)；merge commit `391795963e500e3da63b1136a274198803bb81b4`，`mergedAt: 2026-07-30T13:40:07Z`，`mergedBy: hyc640110`。純治理文件同步：唯讀核對 UR-TODO-044 原「Phase 2b／2c」為單一區塊、僅兩項驗收條件，PR #192 已完整達成，正式標記 UR-TODO-044 為已完成；並將本文件正式基線推進至 PR #192。未修改 `src/`、`tests/`。
- PR #194：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/194)；merge commit `67dab7552620e759d4381f22b6b44a2b3489c2f5`，`mergedAt: 2026-07-30T13:58:01Z`，`mergedBy: hyc640110`。純治理文件同步：記錄 GitHub Environments／Branch Protection／預設分支三項的 `gh api` 唯讀盤點結論，以及使用者授權後執行的預設分支修正（`gh api -X PATCH -f default_branch=main`）。Branch Protection 本身於 PR #194 Merge 後、本次治理同步 PR 之前，由使用者另行明確授權具體設定內容，以 `gh api -X PUT` 執行並雙重驗證生效；**UR-TODO-037 正式標記為已完成**，詳見 `008_TODO_BACKLOG.md` UR-TODO-037 條目與 `007_GIT_WORKFLOW.md` §8.1。
- **註：本節缺 PR #195 的獨立條目**（「Merge pull request #195」，將 UR-TODO-037 正式標記為已完成、把基線推進至 PR #194，即本次 PR #196 的分支基準）——本次唯讀比對 `git log` 與本節內容時發現此既有落差，非本次治理同步範圍造成，本次不逕行補登其完整內容，僅在此註記待未來治理同步一併處理。
- PR #196：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/196)；merge commit `91a2b087634b1a6cfb7f28d34508201cdf7c4c09`，`mergedAt: 2026-07-31T10:14:32Z`，`mergedBy: hyc640110`（`gh pr merge --admin` 執行，依 `007_GIT_WORKFLOW.md` §8.1 既有授權，已於 Merge 當下明確告知使用者）。純治理文件同步：**首次正式建檔 UR-TODO-047**（負債模組與現金流固定支出清單重複計算風險盤點，狀態已完成，無實際重複計算）**與 UR-TODO-048**（CLEC 433／442 移轉為 CLEC 策略中心純模擬模板，狀態規劃中，子階段 A 唯讀盤點已完成，子階段 B／C 待授權開發）；此前兩個編號僅存在於 Claude Home（無 Repository 存取權）對話規劃中，Repository 內完全無記錄。`CI Verification` run `30622759369` success；`Deploy GitHub Pages` run `30622870430` success，headSha 與 merge commit 一致。變更檔案僅 `AI_CONTEXT/008_TODO_BACKLOG.md`、`AI_CONTEXT/003_CURRENT_STATUS.md`、Full／Lite Bundle 四個檔案，未修改 `src/`、`tests/`、schema、migration 或 UI。詳見 `008_TODO_BACKLOG.md` UR-TODO-047、UR-TODO-048 條目。
- PR #197：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/197)；merge commit `ad1eade9ded08304ca32c2bdff500c1e4d100c01`，`mergedAt: 2026-07-31T10:20:27Z`，`mergedBy: hyc640110`（`gh pr merge --admin` 執行，依既有授權，已於 Merge 當下明確告知使用者）。純治理文件同步：將 PR #196 的實際合併結果（merge commit、`mergedAt`、`--admin` 揭露、CI／Deploy 成功佐證）記錄回 `003_CURRENT_STATUS.md` 作為新基線；一併唯讀記錄兩項觀察（§2 逐條清單缺 PR #195 獨立條目、`git stash list` 實際為 5 筆而非文件先前記載的 3 筆），皆未處理、僅加註待未來治理同步。變更檔案僅 `AI_CONTEXT/003_CURRENT_STATUS.md`、Full／Lite Bundle，未修改 `src/`、`tests/`。
- PR #198：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/198)；merge commit `ca96b8b58b7d9cb42926ce5d6dbc6164e5050862`，`mergedAt: 2026-07-31T10:58:16Z`，`mergedBy: 使用者手動 Merge`。**UR-TODO-048 子階段 B 已完成**：狀態層 `App.tsx:375` 固定回傳 `'custom'`；UI 層同一 PR 移除資產頁 `AllocationPresetPanel` 互動元件與唯一寫入路徑 `applyAllocationPreset`，改為唯讀 `AllocationPresetSummary`；同步修正 `allocationContext.ts`／`ClecStrategyCenterPage.tsx` 文案並清除死 CSS。隔離 Preview 環境驗證遷移前後 `targetWeight` 完全不變；`test:ci` 641/641 通過。Merge 後 `Deploy GitHub Pages` run `30625373714` success，headSha 與 merge commit 一致；Production／Preview `curl` 實測皆 HTTP 200，環境隔離正常；Production 資產頁與 CLEC 策略中心畫面唯讀確認正確；使用者已在自己瀏覽器登入真實帳戶確認 Production 實際持股 `targetWeight` 未受影響。子階段 C 與 `allocationRoleBySymbol` 清理均未處理。詳見 `008_TODO_BACKLOG.md` UR-TODO-048 條目。
- PR #199：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/199)；merge commit `1ba8f58e5cabc8c562f3652ae62bfdb05837dd95`，`mergedAt: 2026-07-31T14:03:52Z`（`gh pr merge --admin` 執行，依既有授權）。純治理文件同步：記錄 PR #198 實際合併結果，並唯讀補記兩項此前未記載的觀察（§2 缺 PR #195 獨立條目、`git stash list` 實際 5 筆而非文件先前記載 3 筆），皆未處理。
- PR #200：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/200)；merge commit `8f194b02513ff251902fb8e43c1d4634d9f9a9cf`，`mergedAt: 2026-07-31T23:15:23Z`，`mergedBy: 使用者手動 Merge`。**UR-TODO-048 子階段 C 已完成**：`AllocationSimulatorPage` 新增「套用 CLEC 442／433 權重樣板（試算）」區塊，重用既有純函式 `deriveAllocationPresetPreview`，角色資料採 component-local session-only 選擇器；`ClecStrategyCenterPage` 在 `clec-smart-rebalance`／`annual-ratio-reset` 兩張卡片新增模擬器連結。隔離 Preview 環境（`workflow_dispatch`）實測套用樣板正確產生目標比例、不影響正式資料；`test:ci` 645/645 通過。Merge 後 `Deploy GitHub Pages` run `30672374531` success，headSha 與 merge commit 一致；Production／Preview HTTP 200 且環境隔離正常，Production 畫面唯讀確認正確呈現。詳見 `008_TODO_BACKLOG.md` UR-TODO-048 條目。
- PR #201：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/201)；merge commit `bbf58c584ffe1148088af7874bbf6341130138a1`，`mergedAt: 2026-08-01T00:45:37Z`（`gh pr merge --admin` 執行，依既有授權）。純治理文件同步：記錄 UR-TODO-048 子階段 C 完成，並新增 **UR-TODO-048-D 提案**（CLEC 策略中心新增 703／5050 純模擬模板，狀態待盤點，由使用者參考外部創作者「阿良的正二人生」與巫品寰「正二 50/50 策略」分享後提出，尚未授權開發）。
- PR #202：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/202)；merge commit `5173e6a60efc1bfd66c7bee89dbae239a02bec77`，`mergedAt: 2026-08-01T04:18:30Z`，`mergedBy: 使用者手動 Merge`。**UR-TODO-048 子階段 D 已完成**（UR-TODO-048-D 提案落地）：局部擴充 `src/lib/allocationPresets.ts`（純資料性，經使用者對「唯讀盤點發現實際修改位置與提案原寫的 `clecStrategy.ts` 不符、且與指令原禁止修改 `normalizeAllocationPreset` 相矛盾」的追加授權後才實作）新增 `clec-703`（0/70/30）、`clec-5050`（0/50/50）兩組模擬限定樣板；`AllocationPreset` 型別、`normalizeAllocationPreset`、`PRESET_WEIGHTS`、`allocationPresetLabel` 僅新增資料，既有 `clec-433`／`clec-442` 邏輯與數值逐位元組未變；未上 `ClecStrategyCenterPage` 待核實策略清單。隔離 Preview 環境驗證 703／5050 正確產生 `0/70/30`、`0/50/50` 目標比例，不影響正式資料；`test:ci` 652/652 通過。Merge 後 `Deploy GitHub Pages` run `30683691820` success，headSha 與 merge commit 一致；Production／Preview HTTP 200 且環境隔離正常。詳見 `008_TODO_BACKLOG.md` UR-TODO-048、UR-TODO-048-D 條目。
- PR #203：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/203)；merge commit `87bf0188e644a4ce18542f7698d6f6cef4602d16`，`mergedAt: 2026-08-01T04:45:56Z`，`mergedBy: 使用者手動 Merge`。**UR-TODO-048 子階段 E 已完成**（使用者提出的兩項獨立小變更，同一 PR 處理）：`allocationPresetLabel` 將 `clec-703`／`clec-5050` 顯示文字改為「7:3」「50:50」，內部代號與 `PRESET_WEIGHTS` 數值未變；`AllocationSimulatorPage` 模擬目標比例新增純模擬用「現金」項目（合成鍵 `CASH_TARGET_KEY = '__cash__'`，component-local，比例併入既有 100% 合計檢查，依使用者決定不進「模擬差額摘要」／「模擬交易方向」清單，不連動任何 Household Liquidity 欄位）；套用 CLEC 樣板時同步將現金目標歸零（因 CLEC 樣板三角色恆加總 100%），避免合計超過 100%——此為唯讀盤點發現共存衝突後，經使用者確認的處理方向。隔離 Preview 環境完整互動驗證現金加總、CLEC 套用歸零現金、恢復正式目標比例歸零現金、Donut 圖例正確顯示；`test:ci` 654/654 通過。Merge 後 `Deploy GitHub Pages` run `30684568560` success，headSha 與 merge commit 一致；Production／Preview HTTP 200 且環境隔離正常，Production 畫面確認現金列與改名文字皆正確呈現。詳見 `008_TODO_BACKLOG.md` UR-TODO-048 條目。
- PR #204：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/204)；merge commit `1903bb9717bc02646cd280fedf6ad54c37e44bab`，`mergedAt: 2026-08-01T05:38:09Z`（`gh pr merge --admin` 執行，依既有授權）。純治理文件同步：記錄 `allocationRoleBySymbol` 欄位清理唯讀盤點結論——原用途已被子階段 C／E 的 session-only 機制取代、子階段 B 移除唯一可設定 UI，但 `ClecStrategyCenterPage`「目前配置來源」卡片仍讀取此欄位顯示角色標籤，非完全閒置；localStorage／Firebase／Backup 清理風險低，但需先由使用者對畫面呈現方式做決定。**結論：暫不清理，維持「待評估」**。
- PR #205：[MERGED](https://github.com/hyc640110/family-universal-rebalance/pull/205)；merge commit `daef75a5c72f81a36084677bbee870c4de8fe8cd`，`mergedAt: 2026-08-01T05:45:07Z`（`gh pr merge --admin` 執行，依既有授權）。純治理文件同步：補齊 UR-TODO-048 子階段 D（PR #202）、子階段 E（PR #203）的完成記錄進 `008_TODO_BACKLOG.md`（先前僅同步至子階段 C），並將 UR-TODO-048-D 條目正式標記為已完成、補上原「待確認」四項的實際採用答案。

固定 stash：

- `e141af14273b76501c1b287ea018e8728099f1e5`
- `4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`

固定 stash 以 hash 鎖定，不依可變的 stash index；不得操作、套用、清除、重建或改寫。本次盤點未操作。另有 `9e9aa0c999cf3b97d034db786e4307eaec35e6b2` 為既有其他工作階段的文件同步草稿，**不是固定 stash**，本次僅唯讀盤點、未操作。**2026-07-31 補充唯讀盤點**：`git stash list` 實際回傳 5 筆，除上述固定 stash 與 `9e9aa0c...` 草稿外，另有 2 筆此前本節未記載、屬其他工作階段 UR-TODO-046 相關暫存（`7f36486...`「disposable dist/ build output」、`77ef9ae...`「UR-TODO-046 prep」），皆非固定 stash，本次僅唯讀確認、未操作、未清除。

## 3. Production 狀態

### GitHub Pages

- 最新正式成功部署 Workflow：`30442672832`（`Deploy GitHub Pages`，success，`event: push`，headSha `ee5595a3bd85291d29c3242bb7c0f1d3ba93aade`，即 PR #182 merge commit，本次以 `gh run list` 實際查詢確認）。
- 前三筆：`30422887724`（success，headSha `6ea49868feb30b6a62aca1a5117df09eedf3476a`，即 PR #181 merge commit）、`30385353684`（success，headSha `4280ac44e6dd814eb0054ed1cd2012e7c8242c1e`，即 PR #178 merge commit）、`30382511752`（success，headSha `c8b6c95a60a7d3c60e4eb85b7d9889427dc30d5d`，即 PR #177 merge commit）。
- Production：`https://hyc640110.github.io/family-universal-rebalance/` 本次以 `curl` 實測 HTTP 200，HTML deployment metadata 為 `environment=production`；Preview：`https://hyc640110.github.io/family-universal-rebalance/preview/` 本次以 `curl` 實測 HTTP 200，metadata 為 `environment=preview`，兩者資源路徑未混用。淨資產歷史頁面收合功能已於隔離瀏覽階段實測，收合／展開／再收合三段行為正確，詳見 `008_TODO_BACKLOG.md` UR-TODO-045。
- 前一筆記錄（PR #145 Merge 後）：Workflow `30212166683`（`Deploy GitHub Pages`，success，headSha `5aa1d9e`）。Production HTTP 200，`environment=production`；首頁「今日投資狀態」中的「每日投資判斷流程」顯示唯一「今日建議結論」，資料同步提醒僅為次要資訊。分析頁不顯示完整 `todayDecision`；是否承接完整決策保留為後續產品決策。

- 最新成功部署 Workflow：`29935264176`（`Deploy GitHub Pages`，success，headSha `2510169`77fc63aca3221c0b383170a68cad89900）
- 觸發機制：`.github/workflows/deploy.yml` 設定為 `on: push: branches: [main]`，**沒有 Draft／Ready／人工核准閘門**。PR #102～#105 每次 Merge 進 `main` 都各自自動觸發一次成功部署：
  - PR #102 → run `29913500881`（success，headSha `40159b4`）
  - PR #103 → run `29922886050`（success，headSha `64407e7`）
  - PR #104 → run `29926174499`（success，headSha `8aa12c0`）
  - PR #105 → run `29935264176`（success，headSha `2510169`，**目前 Production 實際內容**）
- 現況：Production Pages 目前實際服務內容為 V6.17.3A（`2510169`），含 Household Liquidity Core／Input Adapter／Data Provenance／Plan Input UI Entry Point 全部四個 PR 的內容。
- 已知落差（本次盤點更正）：PR #102～#105 內文皆敘述「未部署 Production／未手動重跑 workflow」，此敘述僅代表「未人工手動觸發」，並未涵蓋 push-to-main 自動部署這件事。舊版本文件（v3.8 及之前）沿用此敘述，誤記 Production 仍停留在 PR #101（V6.16.1，`941daf3`）。本節已依 Workflow 實際執行紀錄更正。

### 2026-07-24 PR #107 Merge 後 Deploy 失敗記錄（重要，本節之後尚未再次全面更新基線）

- `main`／`origin/main` 之後又經 PR #106（`0d2ec05`）、PR #107（merge commit `eebee98e226501dddace68ac14505937096c6c08`）推進，但**本節以上內容尚未更新到該基線**，僅在此記錄一筆與 Production 狀態直接相關的重大事件，避免與實際部署狀態產生落差。
- PR #107 合併後觸發的 `Deploy GitHub Pages` workflow run `30096396958`（headSha `eebee98`）**失敗**：`Install dependencies`（`npm ci`）步驟顯示成功但日誌含 `npm error Exit handler never called!`；下一步 `Run CI regression test gate` 失敗，`sh: 1: tsx: not found`，exit code 127。Production build／Preview build／`gh-pages` 部署步驟因此全數未執行。
- **Production（`https://hyc640110.github.io/family-universal-rebalance/`）與 Preview（`.../preview/`）目前仍是上一個成功部署版本**（workflow run `30089243284`，headSha `0d2ec05`，即 PR #106 內容），兩者皆 HTTP 200 正常回應；PR #107 的內容（CI-01／CI-02 變更本身）**尚未實際上線**。
- 根因與 Hotfix 追蹤見 `008_TODO_BACKLOG.md` 的 `UR-TODO-038 Deploy Workflow Node Runtime / DevDependency Install Failure`。
- CI-01、CI-02 狀態：**Hotfix 已完成，待 PR Merge／Production 驗證**——修正 Commit `ed24f84ed7e0b329abce3418a8f9af6ddea0def8` 已 Push 到 Draft PR #108，對應 `CI Verification` run `30101961703`（headSha `ed24f84`）已於真實 GitHub-hosted Ubuntu runner 完整成功（`npm ci`、tsx 驗證、`test:ci` 435/435＋18/18＋52 個 PASS、TypeScript 6.0.3、Production build、Preview build 全數通過，耗時 39 秒），`deploy.yml` 未觸發、`gh-pages` 未寫入。PR #108 仍為 Draft，尚未 Merge，尚未達成本文件「完成標準」要求的 Production 唯讀驗證，**不得標記為完全已完成**。UR-TODO-037 維持部分完成，不受本次事件影響其既有驗收內容。
- **真正根因（2026-07-24 於 Hotfix Draft PR #108 上兩次 `CI Verification` 失敗後確認）**：一開始判定的 Node 20 vs devDependency `engines >=22` 落差雖真實存在，但**不是**持續失敗的主因。實際根因是 `package-lock.json` 內有 56 個條目（對應 `package.json` 原本 8 個 `"latest"` 套件的完整依賴樹）的 `resolved` 欄位指向一個僅限特定沙盒／AI 開發環境內部可連線的套件鏡像網關（`packages.applied-caas-gateway1.internal.api.openai.org`），而非公開的 `registry.npmjs.org`。`npm ci` 嚴格依 lockfile 的 `resolved` 抓取，不受 workflow 內的 registry 設定影響，因此在真正的 GitHub-hosted Ubuntu runner 上必然逾時失敗。修正方式：`package.json` 的 8 個 `"latest"` 套件固定為舊 lockfile 原本鎖定版本（不升級），`package-lock.json` 僅正規化那 56 個 `resolved` 欄位，其餘版本／integrity／依賴樹完全不變；同時明確拒絕採用「完整重新解析」會連帶把 TypeScript 帶到 7.x 主版本的做法。

### 2026-07-24 PR #108 Merge 後 Deploy 成功記錄（事件結案）

- PR #108（`hotfix/deploy-workflow-node-runtime-devdependency-install`）已由使用者手動 Merge，**merge commit `0ae17a1716b32a5cdc67227a26549bec964a307c`**，`mergedAt: 2026-07-24T14:56:47Z`。
- 對應 `Deploy GitHub Pages` workflow run **`30103172752`**（`event: push`，headBranch `main`，headSha `0ae17a1`）：**`conclusion: success`**。全部步驟通過，包含實際的 `Deploy production and Preview to gh-pages branch` 步驟（`Deploy only Preview to gh-pages branch` 因是 `workflow_dispatch` 專屬步驟，正確 skipped）。
  - `Install dependencies`（`npm ci --include=dev --no-audit --no-fund`）：成功，約 13 秒完成
  - `Verify Node/npm runtime and installed dev tooling`：成功
  - `Run CI regression test gate`（`test:ci`）：成功，435/435＋18/18 test-runner 案例，0 fail
  - `Build production Vite app`／`Build Preview Vite app`：皆成功
- **`gh-pages` 分支已更新**：SHA 由先前的 `55b9a0754252d87df6af0102038026f29b67d4ee` 更新為 **`cbc44063ee911ecc3a24401c0c834f5e8fc271f7`**，確認為全新部署。
- **Production／Preview 實測 HTTP 200**：
  - Production 根目錄、`index.html`、主要 JS／CSS assets：皆 `HTTP 200`
  - `/preview/` 根目錄：`HTTP 200`
  - 環境隔離確認正常：Production `index.html` 的 `<meta name="universal-rebalance-deployment-environment">` 為 `production`，資源路徑為 `/family-universal-rebalance/assets/...`；`/preview/` 的對應 meta 為 `preview`，資源路徑為獨立命名空間 `/family-universal-rebalance/preview/assets/...`，兩者未混用。
- **`package-lock.json` 正式基線**：`grep` 確認 main 上的 `package-lock.json` 內部 gateway URL（`applied-caas-gateway1.internal.api.openai.org`）為 **0 筆**，全部 200 筆 `resolved` 皆為 `https://registry.npmjs.org/...`，`lockfileVersion` 仍為 `3`。`package.json` 已無任何 `"latest"` 宣告，`typescript` 固定為 `6.0.3`（未被帶到 7.x）。
- **`npm ci` 可重現性**：已於本次真實 Production 部署 workflow（`30103172752`）的 `Install dependencies` 步驟直接驗證成功，非僅本機或 Draft PR 階段的推論。
- **UR-TODO-038、CI-01、CI-02 依本文件「完成標準」（程式碼完成＋自動測試通過＋Preview 驗收通過＋PR Merge＋Production 唯讀驗證通過）全數達成，正式標記為已完成**，詳見 `008_TODO_BACKLOG.md`。UR-TODO-037 維持部分完成，其延後範圍（GitHub Environment 人工核准、Branch Protection、預設分支修正）不受本次事件解決影響，仍待後續獨立 Todo／Sprint。

### 2026-07-24 PR #109 Merge 後 Deploy 成功記錄（跨 AI 交接制度與 Full／Lite Bundle 正式合併）

- **正式最新 Merge PR 改為 PR #109**（「Cross-AI Handover Governance & Lite Bundle」），已由使用者手動 Merge，**merge commit `4a95a8abe3c3b58359cb6ce5caa65cde4b14928d`**，`mergedAt: 2026-07-24T15:37:45Z`。此為目前 `main`／`origin/main`／HEAD 的正式基線，取代先前記載的 PR #108（`0ae17a1`）。
- 對應 `Deploy GitHub Pages` workflow run **`30106106352`**（`event: push`，headBranch `main`，headSha `4a95a8a`）：**`conclusion: success`**。全部步驟通過，包含實際的 `Deploy production and Preview to gh-pages branch` 步驟。
- **`gh-pages` 分支已更新**：SHA 由先前的 `cbc44063ee911ecc3a24401c0c834f5e8fc271f7` 更新為 **`4b6fecf723e825fa4c64a1af93d92f906e13dc5a`**，確認為全新部署。
- **Production／Preview 實測 HTTP 200**：Production 根目錄、`index.html`、主要 JS／CSS assets、`/preview/` 根目錄皆 `HTTP 200`；環境隔離確認正常（Production `deployment-environment` meta 為 `production`，資源路徑 `/family-universal-rebalance/assets/...`；`/preview/` 為 `preview`，資源路徑 `/family-universal-rebalance/preview/assets/...`，未混用）。
- **PR #109 內容摘要**：
  - `000_AI_START_HERE.md` 新增第三個正式口令「整理交接」，涵蓋 Review／規劃工作結束時的交接快照輸出格式。
  - `012_AI_HANDOVER.md` 新增 Claude Home／ChatGPT 規劃交接格式（§2.2），清除所有帶版本號的舊檔名引用，改用 active 名稱 `003_CURRENT_STATUS.md`／`008_TODO_BACKLOG.md`。
  - `015_CROSS_AI_COMPATIBILITY_SPEC.md` 新增 §4.1 權責區分表與 §4.2「Claude Home → Claude Code → ChatGPT」正式交接流程。
  - `tools/build_ai_context_bundle.py` 最小改動，單次執行同時產生 **Full Bundle**（17 份文件）與 **Lite Bundle**（`000_AI_START_HERE.md`、`000_AI_WORKSPACE_RULES.md`、`001_README.md`、`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`、`012_AI_HANDOVER.md` 共 6 份），皆輸出到 `AI_CONTEXT/EXPORTS/`，不手動維護第二套內容。
  - **此為 Full／Lite Bundle 首次正式合併進 main**；PR #109 Merge 前已於真實 GitHub-hosted Ubuntu runner 驗證 Full 17/17、Lite 6/6 manifest 一致。
- 未修改 `src/`、`tests/`、`package.json`、`package-lock.json`、`.github/workflows/`；固定 stash 未受影響。

### 2026-07-24 PR #110 Merge 後 Deploy 成功記錄（PR #109 Merge 後治理文件補同步）

- **正式最新 Merge PR 改為 PR #110**（「docs: sync PR #109 post-merge context」），已由使用者手動 Merge，**merge commit `081bf91267d4a28c2c118266feb62379fa01fc64`**，`mergedAt: 2026-07-24T16:38:48Z`。此為目前 `main`／`origin/main`／HEAD 的正式基線，取代先前記載的 PR #109（`4a95a8a`）。
- 對應 `Deploy GitHub Pages` workflow run **`30109888217`**（`event: push`，headBranch `main`，headSha `081bf91`）：**`conclusion: success`**。
- **`gh-pages` 分支已更新**：SHA 由先前的 `4b6fecf723e825fa4c64a1af93d92f906e13dc5a` 更新為 **`f45d85662c0c58bd26fcf1a9d3fd73b492056552`**，確認為全新部署。
- **Production／Preview 實測 HTTP 200**：Production 根目錄、`index.html`、`/preview/` 根目錄皆 `HTTP 200`；環境隔離確認正常（Production `deployment-environment` meta 為 `production`；`/preview/` 為 `preview`）。
- **PR #110 內容摘要**（依 `gh pr view 110` 唯讀確認）：純治理文件同步 PR，補齊 PR #109 Merge 後 `003_CURRENT_STATUS.md`（v3.13→v3.14）、`009_CHANGELOG.md`、`012_AI_HANDOVER.md` 與 Full／Lite Bundle 未同步到位的落差；PR 內文明確記載當時 Full manifest 17/17、Lite manifest 6/6 一致，且 `git diff --stat -- src/ tests/ package.json package-lock.json .github/` 為空。變更檔案僅：`AI_CONTEXT/003_CURRENT_STATUS.md`、`AI_CONTEXT/009_CHANGELOG.md`、`AI_CONTEXT/012_AI_HANDOVER.md`、`AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle.md`、`AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle_Lite.md`。
- 未修改 `src/`、`tests/`、`package.json`、`package-lock.json`、`.github/workflows/`；固定 stash 未受影響。
- 是否涉及既有 UR-TODO 項目：本次 Claude Code 唯讀盤點**未發現** PR #110 內容與任何現行 UR-TODO 有明確綁定關係（PR 本身是「補同步治理文件」的收尾動作，非功能開發）；若後續發現遺漏，標記為「待盤點」，不自行推測補登 Todo 狀態變更。

### Price Worker

- 名稱：`00631l-pro-price-proxy`
- Version ID：
  `4cc47c73-2730-4e4b-bbd4-f641fbbf1249`
- Health：
  `00631L-Pro-Web-App Worker v6.16.1 trusted-previous-close-preview-contract`
- 本次唯讀盤點**未重新查詢** `/health`（沿用既有已知限制，例如過去 Windows Schannel `SEC_E_NO_CREDENTIALS` 問題）；以上狀態沿用已驗證正式基線，不冒充重新驗證，狀態維持「待盤點」。

## 4. V6.16.1 完成內容（歷史，PR #101）

- 停止信任 Yahoo stale `chartPreviousClose`
- 使用 TWSE 官方 previous close
- 00631L 2026-07-21 前收為 34.34
- `previousCloseTrusted: true`
- 無可信前收時顯示未知
- Dashboard 排除不可信 daily change
- 台股上漲紅、下跌綠、平盤中性色
- 六檔正式 contract 驗證通過
- 無 NaN／Infinity

## 5. V6.17.1～V6.17.3A 完成內容（PR #102～#105）

- **PR #102 — Household Liquidity Core Model Foundation**：新增純函式核心 `deriveHouseholdLiquidity`（`src/lib/householdLiquidity.ts`）。Stock／Flow／Plan 來源分離、23 個穩定 blocking reason code、completeness／confidence、6／12 個月安全存量、`protectedSafetyCash`／`investableCash`／`executableBudget`／`externalFundingRequired`／`safetyCashShortfall` 公式。53 個核心測試。未接任何 consumer、AppState、UI、Firebase、Backup。
- **PR #103 — Household Liquidity Input Adapter Foundation**：新增純函式 `buildHouseholdLiquidityInput`（`src/lib/householdLiquidityInputAdapter.ts`）。23 個測試。仍未接任何正式 consumer。
- **PR #104 — Household Liquidity Data Provenance & Migration Foundation**：`CashFlowItem` 新增 optional `liquidityRole`、`linkedLoanId`；Cash Flow schema version → 2；擴充既有 `normalizeCashFlowProfile` 為 deterministic、idempotent migration；覆蓋 localStorage／Firebase／Backup／Import round-trip。27 個測試。
- **PR #105 — Household Liquidity Plan Input Foundation ＋ Entry Point**：Cash Flow schema version → 3；持久化 `externalContribution`／`plannedWithdrawal`（`undefined`＝absent、`0`＝明確零值）；在「收支與現金流中心」既有「家庭流動資金計畫」區塊新增可編輯 UI 輸入欄位（首次修改 `src/pages/CashFlowPage.tsx`）。23 個測試（Entry Point 7＋Foundation 16）。PR 內文附 Preview 實測記錄（390／1000／1600px、console error 0）。未接 Rebalance、Execution Eligibility、Order Helper、Action Center、Daily Workflow、AI、CLEC、Simulator。

以上四個 PR 合計新增／修改測試 106 項以上，均為各 PR 自行宣稱通過；本次唯讀盤點**未重新執行**測試套件，狀態為「依 PR 紀錄」而非本次重新驗證。

## 6. Household Liquidity 正式規格狀態

- 正式詳細架構規格：`013_Household_Liquidity_Model_Spec_v3.0.md`
- `013 v3.0` 取代 `v1.0`、`v2.0` 作為本主題的唯一詳細規格來源。
- Sprint 1（Core Model Foundation）與 Sprint 2（Data Provenance & Migration）已依規格範圍完成並合併，詳見第 5、9 節。

## 7. Sprint 1／2 啟動前的唯讀盤點（歷史，仍為現行問題分析依據）

主題：

# 生活與負債安全存量＋可投資現金跨模組整合

結論（提出當時）：

- 當時沒有單一家庭安全存量／可投資現金來源。
- `liquidCash` 同時被當作資產、防守資產、還款安全現金及可投入預算。
- Rebalance、Risk、CLEC、Simulator 與決策流程存在語意不一致。
- 第一個實作 Sprint 應先建立純函式核心模型。
- 第一階段不改 UI、不改 AppState、不改 Firebase／Backup。

以上結論已依此推動 PR #102～#105；第 8 節逐項標註目前解決狀態。

## 8. 已確認核心缺口與目前解決狀態

1. buy-only 直接使用 `min(buyOnlyBudget, liquidCash)` — **未解決**，待 Sprint 3（Rebalance & Trade Execution Integration，UR-TODO-008）
2. standard 模式未先扣除受保護安全現金 — **未解決**，待 Sprint 3／4
3. Risk 現金安全主要只計算借款月付 — **未解決**，待 Sprint 4（UR-TODO-009）
4. Cash Flow Center 的生活費／緊急預備金未接入投資決策 — **部分解決**：Core／Adapter／Provenance 已建立資料層基礎（PR #102～#105），尚未接入任何決策 consumer
5. CashFlowProfile 缺失時沒有共用的買入阻擋 gate — **部分解決**：Core 已定義完整 blocking reason 架構（如 `LIVING_EXPENSE_MISSING`），尚未接到實際決策路徑
6. derived account unavailable 可能被靜默當作 0 — **部分解決**：Core 明確以 `LIQUID_ACCOUNT_UNAVAILABLE` 阻擋、不轉為 0；實際 UI／Risk 路徑是否仍會靜默轉 0，待 Sprint 3／4 接線後才能驗證
7. CLEC 同一現金同時作為 availableCash 與 cashReserve — **部分解決**：UR-TODO-010 子 PR1（PR #150）已分別接到 `investableCash`／`protectedSafetyCash`；Simulator UI 與後續子 PR 仍待授權
8. Allocation Simulator 未區分外部資金、現有可投資現金、安全現金與提款 — **部分解決**：UR-TODO-010 子 PR2A（PR #152）已建立未接線的純 selector；Simulator 資料邊界／UI 與安全現金開關仍待後續獨立授權
9. Dip Alert 是觀察訊號，但部分 UI 容易被理解為立即買入 — **未解決**，待 Sprint 3／6
10. 防守總資產與防守型持股仍有語意混用 — **未解決**，待 Sprint 6（UR-TODO-011）

## 9. Sprint 進度與下一個建議 Sprint

- **Sprint 1（Household Liquidity Core Model Foundation）：已完成** — PR #102、#103 已合併，範圍與 `013 v3.0` 一致，對應 UR-TODO-006。
- **Sprint 2（Liquidity Data Provenance & Migration）：部分完成** — PR #104、#105 已合併 provenance／schema／migration／round-trip 與 Plan Input 持久化；尚未接入任何正式 consumer，對應 UR-TODO-007（部分完成，詳見 `008_TODO_BACKLOG.md`）。
- **下一個建議 Sprint：Sprint 3 — Rebalance & Trade Execution Integration**（對應 UR-TODO-008，`013 v3.0` 第 12～14、23、30 節），前提是先完成第 11 節「現行下一步」列出的文件同步與 P0 唯讀盤點。

## 10. 緊急外部風險

Firebase Realtime Database `my-00662-default-rtdb` 測試模式用戶端存取權限將於 **2026-07-28** 到期（UR-TODO-001，P0，狀態：**已盤點**，Rules 與到期日已於 2026-07-25 由使用者本人在 Firebase Console 查證確認；正式解法仍為**待開發**，未排入 Sprint）。

到期後預期影響：

- 雲端上傳
- 雲端下載
- Firebase 手動同步

（以上為使用者已知並接受的暫時中斷，非資料外洩事件，是 Firebase 到期後預設 deny all 的權限自然收斂）

已確認不受影響：

- GitHub Pages
- localStorage
- Price Worker
- Market Worker
- 本機分析與再平衡
- JSON Backup
- Gmail OAuth
- Allocation Simulator

不得直接延長公開規則，也不得在 App 尚未具備 Firebase Auth 前直接改成 `auth != null`——此為使用者本人已拍板之決策，非僅治理文件既有禁止事項的延續。

### 2026-07-25 Firebase Console 唯讀查證與使用者決策（UR-TODO-001 結案為「已盤點」）

使用者本人於 Firebase Console 唯讀查證（非 Repository 唯讀盤點得出），完整結論詳見 `008_TODO_BACKLOG.md` UR-TODO-001，本節摘要：

- 專案：`my-00662`，資料庫：`my-00662-default-rtdb`
- 現行規則：`".read": "now < 1785168000000"`／`".write": "now < 1785168000000"` → **到期日 2026-07-28**（查證日 2026-07-25，距今僅 3 天）
- 到期前：完全公開讀寫，無任何條件限制；到期後：Firebase 預設自動轉為全部拒絕（deny all）

**使用者決策（已拍板）：**

- 不在到期前修改 Firebase Console 規則，不手動延長現有公開規則
- 讓規則自然到期，接受屆時雲端上傳／下載／Firebase 手動同步暫時中斷
- 正式解法（App 內加入 Firebase Auth、規則改為 `auth != null`）列為**未來獨立 Development Sprint**，不在到期前這幾天內倉促進行，待使用者另行排定時程啟動

UR-TODO-001 狀態依此由「待盤點」更新為**「已盤點」**（Rules 內容與到期日已確認）；正式解法本身仍為「待開發」，不得標記為「已完成」。

### 2026-07-24 UR-TODO-001 Repository 唯讀盤點補充（歷史記錄，Firebase Console 面向已於 2026-07-25 補齊，詳見上方）

### 2026-07-24 UR-TODO-001 Repository 唯讀盤點補充（Firebase Console 仍未查詢）

本次由 Claude Code 在 Review Mode 下針對本節風險執行 Repository 唯讀盤點，範圍限於 Repository 原始碼／設定檔與公開 HTTP 探測，**未登入或存取 Firebase Console**。完整結論詳見 `008_TODO_BACKLOG.md` UR-TODO-001，本節僅摘要分界：

**已確認（來自 Repository，非 Firebase Console）：**

- App 完全未整合 Firebase Authentication（`package.json` 未安裝 `firebase` SDK；`src/` 內無 `firebase/auth`、`signInWith`、`onAuthStateChanged`、`getAuth` 等任何蹤跡；唯一登入機制是與 Firebase 無關的獨立 Gmail OAuth broker）
- Preview／Production 共用同一個 Firebase 專案／RTDB 實例，僅靠 `VITE_FIREBASE_BASE_PATH`（`family-universal-rebalance` vs `family-universal-rebalance-preview`）路徑前綴隔離，非獨立 Firebase 專案 → 規則變更會同時影響兩個環境
- Database URL、secretPath 皆為使用者於 UI 手動輸入，未寫死於程式碼或 `.env`；App 以 `fetch()` 對整節點做 PUT／GET，未使用 Firebase SDK

**仍待確認（Repository 唯讀範圍無法確認，需 Firebase Console 存取權限）：**

- 現行 Security Rules 實際 `.read`/`.write` 內容（repo 內無 `database.rules.json`／`firebase.json`／`.firebaserc`）
- 測試模式規則實際到期日期（repo 內無任何硬編到期日）

當時（2026-07-24）Repository 唯讀盤點結論已於 2026-07-25 由使用者本人以 Firebase Console 查證補齊；建議之短期／中期／架構層 Hotfix 方向仍記錄於 `008_TODO_BACKLOG.md` UR-TODO-001 供未來 Sprint 決策參考，本次到期前**不採用短期方案**，直接接受自然到期。

## 11. 現行下一步

1. UR-TODO-001（Firebase Security Rules 到期）已於 2026-07-25 由使用者本人完成 Firebase Console 查證，狀態更新為「已盤點」，使用者決策為接受 2026-07-28 自然到期、不修改規則。正式解法（Firebase Auth 整合）待使用者未來另行排定為獨立 Development Sprint，目前不在待處理 P0 唯讀盤點清單中，但仍是待開發項目。
2. UR-TODO-037 尚未完成範圍（GitHub Environment 人工核准、Branch Protection、預設分支修正）仍待另立獨立 Todo／Sprint。
3. Household Liquidity Sprint 3（Rebalance & Trade Execution Integration，UR-TODO-008）：子 PR 1／5（buy-only，PR #116）、子 PR 2／5（standard，PR #118）、子 PR 3／5（Execution Eligibility investableCash contract，PR #120）、子 PR 4a／5（Order Helper characterization test 安全準備，PR #122）、子 PR 4b／5（Order Helper investableCash 串接，PR #124）、子 PR 5a／5（Dip Alert characterization test 安全準備，PR #126）、子 PR 5b／5（investableCash 資金資格判斷串接進 Dip Alert，PR #127）**已全數完成並合併，UR-TODO-008 正式標記為已完成**。下一個建議 Sprint 為 Sprint 4（Risk & Decision Workflow Integration，UR-TODO-009）或 Sprint 5（CLEC & Simulator Funding Semantics，UR-TODO-010），待使用者明確下達「開始開發」指示後才依序評估啟動順序。
4. **UR-TODO-039**（收支與現金流中心「額外投入資金」「預計提領資金」欄位未實際寫回 `cashFlowProfile`）已於 2026-07-26 由使用者手動 Merge **PR #130** 修復並正式標記為**已完成**，詳見下方第 12.7 節與 `008_TODO_BACKLOG.md`。
5. 下一個 Sprint 若啟動，仍須遵循固定流程：從最新 main（`3f82581`）建立全新 branch → 實作 → 驗證 → Draft PR → Preview／CI Verification 驗證通過 → Ready for review → 使用者手動 Merge → Production 唯讀驗證。
6. 產品版本 V7.0B～V7.0E（Financial Liquidity Core／Dashboard UX／AI Decision／Design Polish）規劃已記錄於 `002_MASTER_ROADMAP.md` 第 5.1 節與 `016_Product_Decisions.md`；**V7.0B（Household Liquidity Sprint 3，UR-TODO-008）已全數完成**（子 PR 1～5b／5），其餘子項（Sprint 4～6，UR-TODO-009～011）與 V7.0C～V7.0E **均未核准啟動**，待使用者未來明確下達「開始開發」指示後才依序評估啟動順序。

## 12. AI 治理文件版控狀態（已更正）

- `AGENTS.md`、`CLAUDE.md`、`AI_CONTEXT/`（全部正式文件與 `EXPORTS/` 產生檔）、`tools/`（`build_ai_context_bundle.py`、`更新_AI_內容包.cmd`）**已於 PR #106（`chore/ai-context-governance-baseline`，2026-07-24 Merge）正式進版控**，現存在於 `main` 的 git 歷史中，不再是未追蹤內容。此節先前記載的「未追蹤」狀態已過期，本次更正。
- 本機絕對路徑錯誤已於 PR #106 一併修正為中性描述；敏感資訊掃描（此後歷次 Sprint／Hotfix 皆重複執行）持續確認無密鑰、Token、帳密或 Firebase URL。

## 12.1 V7.0A（Foundation & Product Governance）治理文件落地記錄（2026-07-25）

背景：使用者於 ChatGPT（Project Knowledge，無 Repository 存取權）規劃一套 V7 產品治理架構，經 Claude Code 唯讀核對 Repository 現況（發現檔名編號、版本命名、Financial Liquidity Model 範疇三項與現況有落差）後，使用者逐項拍板六項決定。本次依決定落地，僅修改 `AI_CONTEXT/` 治理文件，未修改 `src/`、`tests/`、依賴、CI workflow、`tools/`。

新增文件：

- `016_Product_Decisions.md`（v1.0）：V7 定位、三個審查機制、十大產品原則、版本代號哲學、**版本命名區隔規則**（永久規則）、V7 Sprint 規劃摘要、新功能檢核表、V7 期間原則、模式切換、一進一出原則、品質標準
- `017_Design_System.md`（v0.1，骨架）：對應產品版本 V7.0E，章節大綱已建立，內容待該版本啟動後補完
- `018_Dashboard_UX_Guideline.md`（v0.1，骨架）：對應產品版本 V7.0C，章節大綱已建立，內容待該版本啟動後補完
- `019_Idea_Pool.md`（v0.1，空白）：創意模式新想法收錄區，含收錄規則與週期檢討規則（僅適用本文件新增項目，不追溯既有 UR-TODO）

升版文件：

- `013_HOUSEHOLD_LIQUIDITY_SPEC.md`：v3.0 → **v4.0**。唯讀盤點確認 ChatGPT 提議的「V7.0B Financial Liquidity Core」與本文件既有第 30 節 Sprint 3～6／UR-TODO-008～011 範圍實質重疊，**判定為同一件事，不另立新規格文件**。v4.0 新增第 1.4 節（與產品版本 V7.0B 對應表）、第 20.4／28.5 節（與 `018`／`017` 的分工邊界說明），核心公式、契約、Sprint 邊界等既有內容未變更，Sprint 1／2 已完成範圍不受影響。

同步調整：

- `000_AI_START_HERE.md`（v2.1→v2.2）：第 2 節「每次初始化必讀」清單加入 `016_Product_Decisions.md`，與 `001`／`003`／`008` 同等級；其餘主題式彈性補充閱讀規則維持不變
- `002_MASTER_ROADMAP.md`（v7.4→v7.5）：新增第 5.1 節「產品版本 V7 規劃」，並於文件開頭加註版本命名區隔提醒
- `008_TODO_BACKLOG.md`（v1.9→v1.10）：新增「新想法先進 Idea Pool」說明，**未改動任何既有 UR-TODO 的優先級或狀態**，現行 P0～P4 五級制維持不變

明確不處理（列為未來獨立任務）：

- `tools/build_ai_context_bundle.py` 的 `LITE_FILENAMES` 本次不修改，`016_Product_Decisions.md` 暫不加入 Lite Bundle
- V7.0B～V7.0E 皆**未核准啟動**，本次僅記錄規劃意圖

## 12.2 PR #111～#118 Merge 與 Production 部署記錄（2026-07-25 本次同步）

本次唯讀盤點確認 `main`／`origin/main`／HEAD 已由本文件先前記載的 PR #110（`081bf91`）推進至 **PR #118**（`ff08e05`），中間共 8 個 PR 皆已由使用者手動 Merge，對應 `Deploy GitHub Pages` workflow 全數 `conclusion: success`（`event: push`）：

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #111 | docs: sync PR #110 post-merge context | `59da9712a5dd5e4a456bb42c2446fe0324812a29` | 2026-07-24T17:12:43Z | `30112108247` success | 純治理文件同步，補齊 PR #110 Merge 後 `003`／`009`／`012` 與 Bundle 落差 |
| #112 | docs: record UR-TODO-001 read-only findings | `72fa46cc7e24bb9cfe80df929d90dc5f5ab4898a` | 2026-07-24T17:30:56Z | `30113293420` success | UR-TODO-001 Repository 唯讀盤點結論補登，狀態維持「待盤點」 |
| #113 | docs: record UR-TODO-001 Firebase Console confirmation | `d4ca47774bcecd52e339bad101bba68da8ae5609` | 2026-07-24T17:45:36Z | `30114262579` success | 使用者本人 Firebase Console 查證結果記錄，UR-TODO-001 狀態改為「已盤點」 |
| #114 | docs: add language rule to AGENTS.md and CLAUDE.md | `10ae69207d86dc5c2e1513c969724c6f2f2b4344` | 2026-07-24T17:54:12Z | `30114823735` success | 新增繁體中文語言規則至兩份平台入口文件，不涉及 `AI_CONTEXT/` |
| #115 | docs: land V7.0A Foundation & Product Governance | `5f2d8e8c14d5fda2ed723aff228154a16b12c5ac` | 2026-07-25T04:18:14Z | `30143789714` success | 新增 `016`～`019`，`013` 升版 v4.0，`000`／`002`／`008` 同步調整 |
| #116 | V7.0B 子 PR 1/5：buy-only 改用 investableCash | `3882e713ebb03f5f4d14408a66f566c4fcf20848` | 2026-07-25T08:23:48Z | `30151027865` success | 首次將家庭流動性 investableCash 接入 Rebalance buy-only 模式預算計算 |
| #117 | docs: update UR-TODO-008 status to in-progress | `aef8b5d88aca9fcdd4bc475308e341be896e12ee` | 2026-07-25T08:56:32Z | `30151975495` success | 同步 UR-TODO-008 狀態為「開發中」，記錄子 PR 1／5 已完成 |
| #118 | V7.0B 子 PR 2/5：standard 模式改用 investableCash | `ff08e0508190201ed2a0ed7a56f381228ca5c1ea` | 2026-07-25T08:58:13Z | `30152021243` success | standard 模式現金缺口／可執行預算改用 investableCash，`investableCash === null` 阻擋條件擴大至兩種模式 |

說明：

- 本次為唯讀比對 git 歷史與各 PR 內容（`gh pr view`、`gh run list`），**未重新逐一實測每個 run 的 Production／Preview HTTP 狀態**（各 PR 內文已各自附驗證記錄），僅確認 workflow `conclusion` 皆為 `success`。
- PR #116、#118 為本階段唯二涉及 `src/`、`tests/` 的功能性 PR（對應 UR-TODO-008 子 PR 1／2），其餘 6 個皆為純 `AI_CONTEXT/` 治理文件同步，詳見 `009_CHANGELOG.md` 與各 PR 內文。
- UR-TODO-008 最新進度詳見 `008_TODO_BACKLOG.md`。

## 12.3 PR #119～#120 Merge 與 Production 部署記錄（2026-07-25 本次同步）

本次唯讀盤點確認 `main`／`origin/main`／HEAD 已由本文件先前記載的 PR #118（`ff08e05`）推進至 **PR #120**（`26b8a86`），中間共 2 個 PR 皆已由使用者手動 Merge，對應 `Deploy GitHub Pages` workflow 全數 `conclusion: success`（`event: push`）：

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #119 | docs: sync PR #111-118 baseline into governance docs | `861340f273df5fe3868be5dd8d385f4bd8f0ac58` | 2026-07-25T09:33:20Z | `30152988426` success | 純治理文件同步，補齊 PR #111～#118 基線落差（見上方第 12.2 節） |
| #120 | feat: V7.0B sub-PR 3/5 - Execution Eligibility investableCash contract | `26b8a864e51cd29e8e53405d52a15b8fdac94f8e` | 2026-07-25T10:02:20Z | `30153776664` success | 子 PR 3／5，`src/lib/rebalanceExecutionEligibility.ts` 新增 013 §12.3 三個獨立欄位（`investableCash`／`executableAmount`／`externalFundingRequired`），移除混用 CLEC `availableCash` 的死碼判斷；範圍僅限該檔案與其測試檔，未觸碰 `App.tsx`、`RebalanceRecommendationPage.tsx`、Order Helper、Dip Gate、CLEC |

說明：

- 本次為唯讀比對 git 歷史與各 PR 內容（`gh pr view`、`gh run list`），**未重新逐一實測 Production／Preview HTTP 狀態**，僅確認 workflow `conclusion` 皆為 `success`。
- PR #120 為本階段唯一涉及 `src/`、`tests/` 的功能性 PR（對應 UR-TODO-008 子 PR 3／5），PR #119 為純 `AI_CONTEXT/` 治理文件同步。
- UR-TODO-008 最新進度詳見 `008_TODO_BACKLOG.md`。

## 12.4 PR #121～#122 Merge 與 Production 部署記錄（2026-07-25 本次同步）

本次唯讀盤點確認 `main`／`origin/main`／HEAD 已由本文件先前記載的 PR #120（`26b8a86`）推進至 **PR #122**（`a06890d`），中間共 2 個 PR 皆已由使用者手動 Merge，對應 `Deploy GitHub Pages` workflow 全數 `conclusion: success`（`event: push`）：

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #121 | docs: sync PR #119-120 baseline into governance docs | `8fb33250f577b11895032fb84f5e612b676d183e` | 2026-07-25T13:12:10Z | `30159289222` success | 純治理文件同步，補齊 PR #119～#120 基線落差（第 12.3 節）；變更檔案：`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`、Full／Lite Bundle |
| #122 | V7.0B 子 PR 4a/5: Order Helper characterization test 安全準備 | `a06890da3b07d4e79b95f0c5ed65c883618480e5` | 2026-07-25T14:07:12Z | `30161023942` success | 將 `App.tsx` 內的 `getOrderSuggestions` 邏輯抽出為純函式 `src/lib/rebalanceOrderHelper.ts`，並新增 `tests/getOrderSuggestions.test.ts` characterization test 覆蓋既有行為；`package.json` 新增對應測試腳本；`App.tsx` 淨減少約 109 行（改為呼叫抽出後的純函式）；本次為**行為保留（characterization）**性質的重構，不涉及 investableCash 契約串接，故歸類為子 PR 4a／5，子 PR 4b／5（investableCash 串接）另行處理 |

說明：

- 本次為唯讀比對 git 歷史與各 PR 內容（`gh pr view`、`gh run list`），**未重新逐一實測 Production／Preview HTTP 狀態**，僅確認 workflow `conclusion` 皆為 `success`。
- PR #122 為本階段唯一涉及 `src/`、`tests/`、`package.json` 的功能性 PR（對應 UR-TODO-008 子 PR 4a／5），PR #121 為純 `AI_CONTEXT/` 治理文件同步。
- PR #122 未涉及 investableCash 契約串接，`getOrderSuggestions` 抽出後行為與抽出前保持一致（characterization test 目的），子 PR 4b／5 才會處理與 013 §12～14 investableCash 契約的實際串接。
- UR-TODO-008 最新進度詳見 `008_TODO_BACKLOG.md`。

## 12.5 PR #123～#124 Merge 與 Production 部署記錄（2026-07-25 本次同步）

本次唯讀盤點確認 `main`／`origin/main`／HEAD 已由本文件先前記載的 PR #122（`a06890d`）推進至 **PR #124**（`35859af`），中間共 2 個 PR 皆已由使用者手動 Merge，對應 `Deploy GitHub Pages` workflow 全數 `conclusion: success`（`event: push`）：

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #123 | docs: sync PR #121-122 baseline into governance docs | `51b38ded7e9b53520c339ebe5e510f5ea8ff5380` | 2026-07-25T14:18:01Z | `30161367660` success | 純治理文件同步，補齊 PR #121～#122 基線落差（第 12.4 節）；變更檔案：`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`、Full／Lite Bundle |
| #124 | V7.0B 子 PR 4b/5: 將 investableCash 串接進 Order Helper | `35859afc0e21e5f995c8303e0b4286f77c283f86` | 2026-07-25T14:37:17Z | `30161990720` success | `src/lib/rebalanceOrderHelper.ts` 的 `getOrderSuggestions` 新增第 4 個參數 `investableCash: number \| null`，`buyOnlyLimit`／`remainingBudget`／`shortage`／`cashEnough`／`cashLimited` 全部改用 investableCash 為基準（`null` 時保守視為 0，輸出欄位本身仍維持 `null`，不偽裝成 0）；`src/App.tsx` 呼叫端改傳入 `householdLiquidityForRebalance.investableCash`，`getFundingSource` 改重用 `orderHelper.cashEnough`，交易建議清單卡片新增「可投資現金」欄位；`tests/getOrderSuggestions.test.ts` 原 13 個子 PR 4a characterization test 期望值不變，新增 6 個邊界案例（19/19 通過）；`npx tsc -b`、`npm run test:ci`（466/466＋18/18＋checks 全數 PASS）、Production／Preview build 皆成功；明確不包含 `RebalanceRecommendationPage.tsx` 呈現層文案、Dip Gate、CLEC `availableCash` 語意 |

說明：

- 本次為唯讀比對 git 歷史與各 PR 內容（`gh pr view`、`gh run list`），**未重新逐一實測 Production／Preview HTTP 狀態**，僅確認 workflow `conclusion` 皆為 `success`。
- PR #124 為本階段唯一涉及 `src/`、`tests/` 的功能性 PR（對應 UR-TODO-008 子 PR 4b／5），PR #123 為純 `AI_CONTEXT/` 治理文件同步。
- PR #124 完成後，UR-TODO-008 子 PR 1～4b／5 已全數完成，僅剩子 PR 5（Dip Alert 資金資格判斷）尚未開始。
- UR-TODO-008 最新進度詳見 `008_TODO_BACKLOG.md`。

## 12.6 PR #125～#128 Merge 與 Production 部署記錄（2026-07-26 本次同步）

本次唯讀盤點確認 `main`／`origin/main`／HEAD 已由本文件先前記載的 PR #124（`35859af`）推進至 **PR #128**（`99ef6bf`），中間共 4 個 PR 皆已由使用者手動 Merge，對應 `Deploy GitHub Pages` workflow 全數 `conclusion: success`（`event: push`）：

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #125 | docs: sync PR #123-124 baseline into governance docs | `4c26d0037004fe0766e2498372de14fd479796e7` | 2026-07-25T14:58:42Z | `30162701943` success | 純治理文件同步，補齊 PR #123～#124 基線落差（第 12.5 節） |
| #126 | V7.0B 子 PR 5a/5：抽出 `dipAlertRows` 為 characterization test 安全準備 | `122c9d12129078b5e0b90896275706f04bf579d7` | 2026-07-25T15:20:54Z | `30163433903` success | 將 `App.tsx` 內逢低加碼觀察清單的純價格判斷邏輯抽出為 `src/lib/dipAlertEngine.ts` 的 `getDipAlertRows` 純函式，`DipAlertSetting`／`DipAlertRow` 型別與共用函式一併移入；新增 `tests/dipAlertRows.test.ts` 17 個 characterization test；`test:ci:unit-ts` 483/483；行為保留性質重構，不涉及 investableCash 資金資格判斷（留給子 PR 5b） |
| #127 | V7.0B 子 PR 5b/5：將 investableCash 資金資格判斷串接進 Dip Alert（013 §14.2） | `83431910a7948d32f52deb0b98715080286f3fb3` | 2026-07-25T15:50:37Z | `30164426224` success | 落實 013 §14.2 逢低加碼與機會訊號 Gate 五列狀態矩陣：新增 `DipFundingStatus`（`no-signal`／`data-insufficient`／`safety-cash-priority`／`observe-only`／`executable`）與純函式 `deriveDipFundingStatus`，`getDipAlertRows` 新增第 4 參數 `liquidity`（重用 `householdLiquidityForRebalance` 既有 `investableCash`／`dataCompleteness`／`safetyCashShortfall`，不另建計算）；`triggered`／純價格 `status` 判斷邏輯完全未變，明確與 `fundingStatus` 分離；UI 依 013 §14.3 於 `executable` 狀態顯示可投資現金／本次可執行加碼／未滿足理論需求三行金額，其餘三種狀態顯示對應限制說明；`tests/dipAlertRows.test.ts` 擴充至 24 個測試（5a 既有 17 個 `triggered`／`status` 斷言逐字未變＋新增 7 個涵蓋五列矩陣與防禦性邊界案例）；`test:ci:unit-ts` 490/490 |
| #128 | docs: add Sprint Summary format, ADR record (020), and handover Knowledge Delta | `99ef6bf7d366f5dcd3c45573bf4d5edbd3f43f41` | 2026-07-26T00:49:24Z | `30181825647` success | 純治理文件同步：`007_GIT_WORKFLOW.md` 新增 §7.4 Sprint Summary 聊天回報固定格式；`012_AI_HANDOVER.md` §2.2 新增 `ADR`／`Knowledge Delta` 兩欄位，並新增子節明確規定 `003`／`008` 等狀態性文件應於每次 sub-PR／PR Merge 後立即同步、不得延後至 Sprint 結束；新增 `020_Architecture_Decisions.md`（ADR-001：V7.0B 漸進式整合／Strangler Pattern；ADR-002：Dip Alert 訊號與資金資格明確分離）；`001_README.md` Active 文件表新增 020 一列；Full／Lite Bundle 重新產生（Full manifest 21/21，新增 020；Lite manifest 6/6 維持不變，020 未收錄進 Lite） |

說明：

- 本次為唯讀比對 git 歷史與各 PR 內容（`gh pr view`、`gh run list`），**未重新逐一實測 Production／Preview HTTP 狀態**，僅確認 workflow `conclusion` 皆為 `success`。
- PR #126、#127 為本階段涉及 `src/`、`tests/` 的功能性 PR（對應 UR-TODO-008 子 PR 5a／5b），PR #125、#128 為純 `AI_CONTEXT/` 治理文件同步。
- **子 PR 5b（PR #127）驗收時發現既有功能缺口**：使用者於「收支與現金流中心」嘗試設定「額外投入資金」「預計提領資金」以驗證 `executable`／`observe-only`／`safety-cash-priority` 三種情境時，發現這兩個欄位 UI 顯示「已設定」但實際未寫回 `cashFlowProfile`／localStorage（重新整理後消失），屬於 PR #105（V6.17.3A Plan Input Foundation）既有功能缺口，與 V7.0B 本身無關；已補登為 `UR-TODO-039`，詳見 `008_TODO_BACKLOG.md`。
- PR #127 完成後，UR-TODO-008 子 PR 1～5b／5 已全數完成；`013_HOUSEHOLD_LIQUIDITY_SPEC.md` Sprint 3（Rebalance & Trade Execution Integration）依此正式標記為已完成，Sprint 4～6（UR-TODO-009～011）尚未啟動。
- UR-TODO-008 最新進度詳見 `008_TODO_BACKLOG.md`。

## 12.7 PR #129～#130 Merge 與 Production 部署記錄（2026-07-26 本次同步）

本次唯讀盤點確認 `main`／`origin/main`／HEAD 已由本文件先前記載的 PR #128（`99ef6bf`）推進至 **PR #130**（`3f82581`），中間共 2 個 PR 皆已由使用者手動 Merge，對應 `Deploy GitHub Pages` workflow 全數 `conclusion: success`（`event: push`）：

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #129 | docs: sync PR #125-128 baseline into governance docs | `2ad28f33d23de4ec053078578eaee8c8730a078c` | 2026-07-26T01:06:15Z | `30182325511` success | 純治理文件同步，補齊 PR #125～#128 基線落差（第 12.6 節）；變更檔案：`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`、Full／Lite Bundle（Full 21/21、Lite 6/6） |
| #130 | fix: attach cash flow plan input fields to save button（UR-TODO-039） | `3f8258168ddbeb5e28ae2a5e312a26b7e055fe26` | 2026-07-26T01:43:27Z | `30183361782` success | 修復 UR-TODO-039：`src/pages/CashFlowPage.tsx` 將「家庭流動資金計畫」區塊（額外投入資金／預計提領資金）從獨立卡片移入「每月設定」卡片內、緊接在「儲存現金流設定」按鈕之前，不再是獨立卡片，並補充一句提示文字；`src/styles.css` 同步調整 `.cashflow-form` grid-column 規則與新增分隔線樣式；`tests/householdLiquidityPlanInputEntryPoint.test.ts` 新增測試 8（原始碼結構位置驗證），`test:ci:unit-ts` 491/491；純 UI／CSS 調整，未變更任何函式邏輯、資料契約或 `localStorage` schema；明確不包含 `householdLiquidityInputAdapter.ts`、`cashFlow.ts`、`householdLiquidityPlanInputUi.ts` 邏輯 |

說明：

- 本次為唯讀比對 git 歷史與各 PR 內容（`gh pr view`、`gh run list`），**未重新逐一實測 Production／Preview HTTP 狀態**，僅確認 workflow `conclusion` 皆為 `success`。
- PR #130 為本階段唯一涉及 `src/`、`tests/` 的功能性 PR（UR-TODO-039 修復），PR #129 為純 `AI_CONTEXT/` 治理文件同步。
- PR #130 內文附本機 dev server 唯讀驗收記錄（設定金額 → 儲存 → `window.location.reload()` → 確認數值未遺失，390px 無橫向溢出，console 無錯誤）。
- UR-TODO-039 依此正式標記為**已完成**，詳見 `008_TODO_BACKLOG.md`。

## 12.8 PR #150 Merge 與 Production 部署記錄（2026-07-27 本次同步）

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #150 | feat: wire CLEC funding semantics | `c6bde2df3b6b7cdda3fb069fbba522347efeb0ef` | 2026-07-27T12:40:11Z | `30266865442` success | UR-TODO-010 子 PR1：CLEC `availableCash`／`cashReserve` 分別接入 Household Liquidity 的 `investableCash`／`protectedSafetyCash`，`plannedContribution`／`plannedWithdrawal` 接入 `cashFlowProfile.externalContribution`／`plannedWithdrawal`；不修改核心規則、Simulator、schema 或同步契約 |

人工 Preview 驗收確認：在收支與現金流中心設定額外投入 `30,000` 元、預計提領 `50,000` 元後，CLEC 分別正確顯示計畫投入 `30,000` 元、計畫提領 `50,000` 元。跨模組名稱「額外投入資金／預計提領資金」與「計畫投入／計畫提領」不完全一致，列為 UR-TODO-011 後續呈現層輸入，本子 PR 不修改文案。Production／Preview HTTP 200 且環境隔離正常。

## 12.9 PR #152 Merge 與 Production 部署記錄（2026-07-27 本次同步）

| PR | 標題 | merge commit | mergedAt | Deploy run（databaseId） | 摘要 |
|---|---|---|---|---|---|
| #152 | UR-TODO-010 子 PR2A：Simulator Funding 純模型 | `a42cf5a85ab635efc38b85686acf27cd87ab9f1f` | 2026-07-27T14:13:17Z | `30274021196` success | 新增純 `deriveAllocationSimulatorFunding` selector 與專屬測試；未接 UI／AppState／持久化 |

`existingInvestableCash = max(0, totalLiquidCash - protectedSafetyCash)` 僅在兩者為已知有效數值時推導。`undefined`／`null`／`NaN`／`Infinity` 維持 unavailable，明確 `0` 保持已知；超額提領回傳 0 並附 blocking／warning；安全現金僅在明確啟用時納入，且上限為 `max(0, min(protectedSafetyCash, totalLiquidCash))`。Production Pages HTTP 200，Production Market Worker `/health` 回傳 `environment=production`。

## 13. 文件狀態

本次同步更新（2026-07-29 PR #189 基線同步，UR-TODO-005 完成記錄）：

- Current Status v3.48→**v3.49**（本文件）：基線由 PR #187（`4e2975aa`）更新為 **PR #189（`3b4549e2`）**；新增 PR #188（純治理文件同步）、PR #189（UR-TODO-005 補充單元測試）的 Merge／CI／Deploy／Production 唯讀驗證記錄。
- Todo Backlog：**UR-TODO-005 條目正式標記為已完成**——記錄 Phase 1 唯讀盤點確認的三層防護、四個持久化情境正規化路徑，以及 PR #189 新增的 12 個行為測試；明確記錄 `sanitizeHolding()` 本身因牽動 `REMOVED_SYMBOLS`／環境變數耦合未完整測試、保留原狀。
- AI Context Bundle（Full／Lite）：依上述文件變更重新產生。

本次同步更新（2026-07-29 PR #186／#187 基線同步，UR-TODO-004 完成記錄）：

- Current Status v3.47→**v3.48**（本文件）：基線由 PR #184（`498941ae`）更新為 **PR #187（`4e2975aa`）**；新增 PR #185（純治理文件同步）、PR #186（UR-TODO-004 主修正）、PR #187（UR-TODO-004 跟進修正）的 Merge／CI／Deploy／Production 唯讀驗證記錄。
- Todo Backlog：**UR-TODO-004 條目正式更正並標記為已完成**——原「桌機／手機目前偏離目標一致性」標題與假設已排除（唯讀盤點證實架構上不存在跨裝置分歧），更正為「同一畫面內成長／防守資產比例小數位數不一致」，記錄五處格式化函式與 PR #186／#187 完成內容。
- AI Context Bundle（Full／Lite）：依上述文件變更重新產生。

本次同步更新（2026-07-29 PR #184 基線同步，UR-TODO-044 Phase 2a：固定支出角色 fallback 靜默分類分歧修正）：

- Current Status v3.46→**v3.47**（本文件）：基線由 PR #182（`ee5595a3`）更新為 **PR #184（`498941ae`）**；新增 PR #183（純治理文件同步，內容已涵蓋於前一版本）、PR #184（UR-TODO-044 Phase 2a）的 Merge／Deploy／Production 唯讀驗證記錄；`Deploy GitHub Pages` workflow `30457308734` 以 `gh run list` 確認 `conclusion: success`，headSha 與 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`；另於隔離瀏覽器階段（Preview 環境）實測 8 個分類角色未設定時的引導訊息一致性。
- Todo Backlog：新增正式 **UR-TODO-044** 條目，狀態**部分完成**（Phase 1 唯讀盤點、Phase 2a 已完成；Phase 2b／2c 待規劃），記錄 PR #184 完成內容摘要。
- AI Context Bundle（Full／Lite）：依上述文件變更重新產生。

本次同步更新（2026-07-29 PR #178／#179 基線同步，Review Mode／純治理文件同步，於隔離 worktree `family-universal-rebalance-bundle-sync` 執行，未修改任何產品程式，未開始 UR-TODO-043-C2，未修改任何首頁 UI）：

- Current Status v3.44→**v3.45**（本文件）：基線由 PR #177（`c8b6c95a`）更新為 **PR #179（`94c3d08d`）**；補齊 PR #178（`4280ac44`，PR #176／#177 後治理同步）與 PR #179（`94c3d08d`，UR-TODO-030 首頁「30 秒決策中心」方向正式再確認）的 Merge／Deploy／Production 唯讀驗證記錄；Deploy GitHub Pages workflow `30385353684`（PR #178）與 `30386642108`（PR #179）皆以 `gh run list` 確認 `conclusion: success`，headSha 與各自 merge commit 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 為 `production`。
- Todo Backlog：新增 PR #178／#179 已合併記錄；UR-TODO-030 條目正式記錄「30 秒決策中心」方向為既有決策，仍為待盤點，明確與 UR-TODO-043-C2 無關；UR-TODO-043 狀態不變，維持 P2／待盤點，043-A、043-C1 已完成，043-C2 仍為下一候選、未啟動。
- AI Handover：更新最新交接快照基線為 `94c3d08d`，043-C2 精確邊界與 Claude Home／Claude Code 分工維持不變，並保留既有首頁決策提醒。
- AI Context Bundle（Full／Lite）：依上述文件變更重新產生。

本次同步更新（2026-07-29 PR #176／#177 基線同步，Review Mode／純治理文件同步，於隔離 worktree `family-universal-rebalance-bundle-sync` 執行，未修改任何產品程式，未開始 UR-TODO-043-C2）：

- Current Status v3.43→**v3.44**（本文件）：基線由 PR #175（`738513f1`）更新為 **PR #177（`c8b6c95a`）**；補齊 PR #176（`272cd4a9`，正式記錄 UR-TODO-043-C1 唯讀盤點並重新產生 Bundle）與 PR #177（`c8b6c95a`，Cash Flow 儲存動作位置調整，與 UR-TODO-043-C2 無耦合）的 Merge／Deploy／Production 唯讀驗證記錄；Deploy GitHub Pages workflow `30380046325`（PR #176）與 `30382511752`（PR #177）皆以 `gh run list` 確認 `conclusion: success`；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 為 `production`。
- Todo Backlog：更正 UR-TODO-043-C1 條目原「本治理同步 PR 待 Merge」描述為已合併（PR #176），新增 PR #177 唯讀記錄；UR-TODO-043 狀態不變，維持 P2／待盤點，043-C2 仍為下一候選、未啟動。
- AI Handover：更新最新交接快照基線為 `c8b6c95a`，明確記錄 043-C2 精確邊界與 Claude Home／Claude Code 分工。
- AI Context Bundle（Full／Lite）：依上述文件變更重新產生。

本次同步更新（2026-07-27 PR #152 基線同步）：

- Current Status v3.29→**v3.30**（本文件）：基線更新為 **PR #150（`c6bde2d`）**；新增第 12.8 節記錄 Merge、Deploy、Production／Preview 驗證與 UR-TODO-010 子 PR1 範圍
- Todo Backlog（v1.24）：UR-TODO-010 更新為**「開發中／子 PR1 已完成」**，記錄人工 Preview 驗收與 UR-TODO-011 命名一致性輸入
- AI Context Bundle（Full／Lite）：依上述文件變更重新產生
- Current Status v3.30→**v3.31**（本文件）：基線更新為 **PR #152（`a42cf5a`）**；新增第 12.9 節記錄子 PR2A、Deploy 與 Production 驗證
- Todo Backlog：UR-TODO-010 更新為**「開發中／子 PR1、子 PR2A 已完成」**；整體 Todo 未標記完成

歷史記錄：2026-07-26 PR #125～#128 基線同步（Current Status v3.22→v3.23，第 12.6 節）、2026-07-25 PR #123～#124 基線同步（Current Status v3.21→v3.22，第 12.5 節）、2026-07-25 PR #121～#122 基線同步（Current Status v3.20→v3.21，第 12.4 節）、2026-07-25 PR #119～#120 基線同步（Current Status v3.19→v3.20，第 12.3 節）、2026-07-25 PR #111～#118 基線同步（Current Status v3.18→v3.19，第 12.2 節）、2026-07-25 落地產品版本 V7.0A（Foundation & Product Governance，第 12.1 節）、2026-07-25 UR-TODO-001 Firebase Console 唯讀查證結果與使用者決策記錄（狀態更新為「已盤點」）、2026-07-24 UR-TODO-001 Repository 唯讀盤點（第一階段）、2026-07-24 PR #110 Merge 後治理狀態同步（基線改為 `081bf91`）已於前次同步完成，詳見上方各節歷史記錄段落。

歷史記錄：2026-07-24 PR #109 Merge 後治理狀態同步（基線改為 `4a95a8a`，記錄 Full／Lite Bundle 首次正式合併）已於前次同步完成；2026-07-24 PR #108 Merge 後治理文件收尾（UR-TODO-038、CI-01、CI-02 標記已完成、清除 PR #108 進行中狀態）已於更早一次同步完成，詳見上方各節歷史記錄段落。

未完成事項以 Todo Backlog 為單一正式來源；家庭流動性詳細設計以 `013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）為唯一正式來源；產品定位與治理決策以 `016_Product_Decisions.md` 為唯一正式來源。
