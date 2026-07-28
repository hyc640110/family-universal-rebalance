# Universal Rebalance Changelog

本文件記錄已完成並通過驗收的重要變更。

格式參考 Keep a Changelog，但可依專案實際版本調整。

---

## [Unreleased]

**UR-TODO-009（Risk & Decision Workflow Integration）全數完成**：子 PR 1～7 皆已由使用者手動 Merge 並通過 Production 驗證，詳見 `008_TODO_BACKLOG.md` UR-TODO-009 逐條記錄。

### Added
- UR-TODO-010 子 PR2C（[PR #156](https://github.com/hyc640110/family-universal-rebalance/pull/156)，MERGED）：`AllocationSimulatorPage` 新增「假設動用安全現金」component-local checkbox，預設關閉、不持久化；只將 `allowSafetyCashUsage` 傳入既有 selector，勾選時僅使用 selector 回傳的 `usableProtectedSafetyCash`。
- 子 PR2C：勾選後顯示「此為模擬假設，不代表建議實際動用安全現金。」高風險警示（`role="alert"`、`aria-atomic="true"`）；checkbox 以可點擊 label 與 `aria-describedby` 關聯說明，非僅依賴顏色傳達風險。
- `tests/allocationSimulatorFundingIntegration.test.ts` 與 `scripts/stability-check.mjs`：新增／維護 PR2C 契約，涵蓋預設關閉、selector true／false 接線、usableProtectedSafetyCash 上限、資料不足／明確 0 disabled、超額提領 blocking、totalAssets／simulatedTotal 不重複計算，以及無 AppState／localStorage／Firebase／JSON Backup 回寫。
- UR-TODO-010 子 PR2B（[PR #154](https://github.com/hyc640110/family-universal-rebalance/pull/154)，MERGED）：Simulator 改由 App 傳入正式 `totalLiquidCash`、`protectedSafetyCash`、`externalContribution`、`plannedWithdrawal`，並使用既有 `deriveAllocationSimulatorFunding` selector，固定 `allowSafetyCashUsage: false`。
- Simulator 唯讀「模擬資金來源」五欄：現有可投資現金、額外投入資金、受保護安全現金、預計提領資金與可用模擬資金；受保護安全現金明確標示預設不納入模擬。
- `tests/allocationSimulatorFundingIntegration.test.ts`：覆蓋正式四欄接線、禁止使用 `m.cash`／`investableCash`、安全現金預設關閉、explicit zero、unavailable／超額提領 gate、無持久化與桌機／390px 版面契約。
- `deriveAllocationSimulatorFunding`：UR-TODO-010 子 PR2A（[PR #152](https://github.com/hyc640110/family-universal-rebalance/pull/152)，MERGED）新增純 Simulator funding selector，分離 existingInvestableCash、externalContribution、protectedSafetyCash 與 plannedWithdrawal；未接 UI、AppState、schema、localStorage、Firebase 或 JSON Backup。
- `tests/allocationSimulatorFunding.test.ts`：新增專屬契約測試，覆蓋現有可投資現金公式、unavailable 與 explicit zero、超額提領 blocking／warning，以及安全現金不得超過實際流動現金。
- `buildClecFundingSemantics`：UR-TODO-010 子 PR1（[PR #150](https://github.com/hyc640110/family-universal-rebalance/pull/150)，MERGED）將 CLEC `availableCash`／`cashReserve` 分別接到既有 Household Liquidity 的 `investableCash`／`protectedSafetyCash`，並將計畫投入／提款接到 `cashFlowProfile.externalContribution`／`plannedWithdrawal`；未知值維持 `null`，不轉為 0。
- `deriveHomeDecision`：新增 liquidity 三層優先閘門（資料完整性→安全存量→可投資現金），首頁「投資決策首頁」改用與 Risk Center、AI Decision、`todayDecision` 相同的閘門判斷，取代原先獨立的 6 個月門檻。
- `tests/homeDecision.test.ts`：新增，覆蓋三層 liquidity 閘門邏輯。
- `tests/investmentDashboard.test.ts`：擴充覆蓋首頁決策接線後與其餘模組結論一致的行為。
- `todayDecision`：完成固定六層優先序，保留資料不足阻擋與安全存量優先語意；每次僅產生一個投資主決策。
- AI Decision §24 契約：`cash` 決策直接使用既有 Household Liquidity 的 `dataCompleteness`、`safetyCashShortfall`、`investableCash`、`protectedSafetyCash`；資料不足與必要值為 `null` 均維持阻擋語意，不以 0 取代未知值。
- `src/lib/riskPresentation.ts`：將 `riskMetrics` 已透傳的家庭流動性資料轉為共用呈現模型，保留 nullable 金額、資料可信度與只含重複來源的警示。
- `tests/riskPresentation.test.ts`：覆蓋完整資料、資料不足與重複來源警示。

### Changed
- UR-TODO-010 維持「開發中」，更新為「子 PR1、子 PR2A、子 PR2B、子 PR2C 已完成」；下一直接起點改為完整收尾盤點，未在本次治理同步中自行標記整體 Todo 完成。
- UR-TODO-010 維持「開發中」，更新為「子 PR1、子 PR2A、子 PR2B 已完成」；整體 Todo 未標記完成。舊「模擬投入金額」本地輸入與清除按鈕已移除，避免與正式 externalContribution 重複計算；模擬後總資產只反映已知外部淨流量。
- UR-TODO-010 維持「開發中」，更新為「子 PR1、子 PR2A 已完成」；子 PR2B 僅可從唯讀範圍確認開始，安全現金 checkbox 保留給獨立子 PR2C，兩者均未授權開發。
- UR-TODO-010 狀態改為「開發中／子 PR1 已完成」；Simulator 與後續子 PR 未開始、未授權。Preview 人工驗收確認額外投入 `30,000` 元、預計提領 `50,000` 元會在 CLEC 正確顯示為計畫投入／計畫提領。跨模組名稱不一致列為 UR-TODO-011 後續呈現層輸入，本 PR 未改文案。
- Merge 結案：UR-TODO-009 子 PR7 [PR #147](https://github.com/hyc640110/family-universal-rebalance/pull/147) 已 MERGED（`226c6bee75fe4ce8db884c08e63ded1fe08bc7f7`）。PR CI run `30236461001` 與 Deploy GitHub Pages run `30241261199` 均成功（本次以 `gh run list` 實際查詢確認，`headSha` 與 merge commit 一致），Production 以 `curl` 實測 HTTP 200（`environment=production`）。未修改 Household Liquidity 核心公式、schema、Firebase、Backup 或交易功能。
- Merge 結案：UR-TODO-009 子 PR6 [PR #145](https://github.com/hyc640110/family-universal-rebalance/pull/145) 已 MERGED（`5aa1d9e3c4fc364059b4fd6ab4a4de6bc34a594e`）。安全存量不足時阻擋投資建議；`investableCash === 0` 維持保留現金語意；`protectedSafetyCash` 僅為受保護證據，不列為可投資資金。未修改 AI Decision UI／CSS、Household Liquidity 核心公式、schema、Firebase、Backup 或交易功能。
- Merge 結案：UR-TODO-009 子 PR5 [PR #143](https://github.com/hyc640110/family-universal-rebalance/pull/143) 已 MERGED（`d2c2c1ecbac59357ffc5b84dca388ded61e34e5e`）；首頁「今日投資狀態」中的「每日投資判斷流程」顯示唯一「今日建議結論」，資料同步提醒維持次要資訊。分析頁完整 `todayDecision` 不包含；未來是否承接完整決策保留為產品決策，不新增正式 UR-TODO。
- Merge 結案：UR-TODO-009 子 PR4 [PR #140](https://github.com/hyc640110/family-universal-rebalance/pull/140) 已 MERGED（`389a4f48aa441947a32cc8ea56c60a029b94855e`）；PR CI run `30206336238` 與 Deploy GitHub Pages run `30206520018` 均成功，Production HTTP 200（`environment=production`），Risk Center 與投資組合風險與配置中心通過桌機、手機人工驗收。
- UR-TODO-029 已完成並 Merge（PR #139，merge commit `05a2088`）；範圍為 Deep mode 股息收款日期圖示顏色與可讀性修正。
- UR-TODO-009 子 PR4 Preview 修正：Portfolio Risk「目前／目標配置」表頭改與資料列共用桌機三欄 grid，第一欄與數值欄設最小寬度，表頭維持橫向不逐字換行；手機既有隱藏表頭／列內標籤模式不變。
- UR-TODO-009 子 PR4（[PR #140](https://github.com/hyc640110/family-universal-rebalance/pull/140)，MERGED）：`RiskCenterPage.tsx` 與 `PortfolioRiskPage.tsx` 顯示每月必要支出、安全存量缺口、可投資現金、資料可信度與重複來源警示；資料不足不以零替代。
- `riskMetrics` 僅透傳既有 Household Liquidity `confidence`／`blockingReasons`，`portfolioRisk` 僅傳遞呈現資料；未變更公式。
- `scripts/stability-check.mjs`：同步現金安全狀態文案為「目前無必要支出壓力」。

### Verification

- PR #156：CI Verification run `30285097798` 成功；Deploy GitHub Pages run `30320047900` 成功，headSha `86602a8` 與 merge commit 一致。Production Pages HTTP 200，HTML deployment metadata 為 `environment=production`，正式 Assets 未混用 Preview。Preview 人工驗收確認 checkbox 預設關閉、勾選僅增加 usableProtectedSafetyCash、警示立即顯示、取消勾選恢復、totalAssets／simulatedTotal 不重複計算、重整／路由返回恢復關閉、unavailable／明確 0 disabled、超額提領仍遵循 selector blocking、無持久化回寫，以及桌機／約 390px 手機版正常。

- PR #154：CI Verification run `30279995115` 成功；Deploy GitHub Pages run `30281445368` 成功，headSha `e7f7209` 與 merge commit 一致。Production Pages HTTP 200，HTML deployment metadata 為 `environment=production`。Preview 人工驗收確認五欄、收支與現金流同步、安全現金不納入、舊輸入移除、explicit zero、比例調整與桌機／約 390px 手機版正常。

- PR #152：CI Verification run `30273353805` 成功；Deploy GitHub Pages run `30274021196` 成功，headSha `a42cf5a` 與 merge commit 一致。Production Pages HTTP 200，Production Market Worker `/health` 回傳 `environment=production`。
- PR #150：CI Verification run `30265997330` 成功；Deploy GitHub Pages run `30266865442` 成功，headSha `c6bde2d` 與 merge commit 一致。Production／Preview HTTP 200，meta 分別為 `production`／`preview` 且資產路徑隔離正常。

- PR #145：CI Verification run `30211956784`、Deploy GitHub Pages run `30212166683` 均成功；Production HTTP 200（`environment=production`），正式 bundle 已包含 AI Decision Household Liquidity 契約。
- PR #143：CI Verification run `30209681509`、Deploy GitHub Pages run `30210343391` 均成功；Production HTTP 200（`environment=production`）。
- `test:ci`：533 個 TypeScript、3 個 Risk Presentation、18 個 MJS 測試全數通過；TypeScript、Production／Preview build、stability 與 `git diff --check` 均通過；PR CI run `30206336238` 成功。
- Production：Deploy GitHub Pages run `30206520018` 成功，HTTP 200（`environment=production`）。
- Desktop／Mobile：Windows 11 Edge、iPhone Safari 人工驗收通過；無橫向溢出、卡片重疊或文字裁切。
- `npm audit --omit=dev --audit-level=high`：回報 3 個既有 high 相依性通報；本子 PR 未擴大相依性更新。

### Fixed

### Deprecated

### Removed

### Security

---

## [Hotfix] Deploy Workflow Node Runtime & DevDependency Install Failure - 2026-07-24

### Fixed
- `.github/workflows/deploy.yml`、新增的 `.github/workflows/ci.yml`：`actions/setup-node@v4` 的 `node-version` 由 `20` 提升為 `24`，解決 `@cloudflare/kv-asset-handler`／`miniflare`／`wrangler` 的 `EBADENGINE` 警告。
- `Install dependencies` 步驟改為明確的 `npm ci --include=dev --no-audit --no-fund`；新增安裝後的 tsx／版本診斷步驟，安裝異常時會直接讓 workflow 失敗並保留診斷資訊，而非靜默帶到後面才爆出難以診斷的錯誤。
- **真正根因修復**：`package-lock.json` 有 56 個條目的 `resolved` 欄位指向僅限特定沙盒／AI 開發環境內部可連線的套件鏡像網關（`packages.applied-caas-gateway1.internal.api.openai.org`），而非公開的 `registry.npmjs.org`，導致真實 GitHub-hosted Ubuntu runner 上 `npm ci` 逾時失敗。已逐筆以腳本驗證套件名稱／版本／integrity 一致後，僅正規化該 56 個 `resolved` 欄位為公開來源；其餘 199 個條目、`version`、`integrity`、依賴樹、`lockfileVersion`（3）完全未變。

### Changed
- `package.json` 8 個原本標為 `"latest"` 的直接依賴（`react`、`react-dom`、`@vitejs/plugin-react`、`typescript`、`vite`、`@types/node`、`@types/react`、`@types/react-dom`）改為明確固定版本，沿用舊 lockfile 原本鎖定值，未升級任何依賴（明確拒絕採用會將 TypeScript 帶到 7.x 主版本的「完整重新解析 lockfile」路徑）。
- `package.json` 新增 `engines.node: ">=22.0.0"`，明確記錄專案實際的最低 Node 版本需求。

### Added
- 新增獨立、唯讀的 `.github/workflows/ci.yml`（`on: pull_request`，`permissions: contents: read`，無任何部署或 `gh-pages` 寫入步驟），讓每個 PR 都能在真實 GitHub Ubuntu runner 上驗證 `npm ci`、tsx 可用性、`test:ci`、Production build、Preview build，不必等到 Merge 進 main 才發現環境落差（CI-01／CI-02）。

### Compatibility
- localStorage：不受影響（未修改 `src/`）
- Firebase：不受影響
- JSON Backup：不受影響
- Preview / Production：Production 已透過 Merge 後的 `Deploy GitHub Pages` workflow run `30103172752` 成功重新部署；`gh-pages` 分支更新至 `cbc44063ee911ecc3a24401c0c834f5e8fc271f7`；Production／Preview 環境隔離實測正常

### Verification
- TypeScript：通過（確認維持 `6.0.3`，未被帶到 7.x）
- Test：通過（`test:ci` 435/435＋18/18 test-runner 案例＋52 個 check PASS，0 fail；兩次 Draft PR `CI Verification`（run `30101961703`、`30102799090`）與一次正式 Production 部署 workflow（run `30103172752`）皆於真實 GitHub-hosted Ubuntu runner 驗證通過）
- Build：通過（Production／Preview build 皆成功）
- Desktop／Mobile：不適用（本次未修改任何 UI／前端功能）

### Pull Request
- PR #108（`hotfix/deploy-workflow-node-runtime-devdependency-install`），merge commit `0ae17a1716b32a5cdc67227a26549bec964a307c`

---

## [Docs] PR #109 Post-Merge Context Sync - 2026-07-24

### Changed
- `003_CURRENT_STATUS.md`（v3.13→v3.14）、`009_CHANGELOG.md`、`012_AI_HANDOVER.md`：補齊 PR #109（Cross-AI Handover Governance & Lite Bundle）Merge 後尚未同步的治理文件落差；基線改為 PR #109／merge commit `4a95a8abe3c3b58359cb6ce5caa65cde4b14928d`。
- Full／Lite Bundle：依上述文件變更重新產生。

### Compatibility
- localStorage／Firebase／JSON Backup：不受影響（未修改 `src/`）
- Preview／Production：Production 已透過 `Deploy GitHub Pages` workflow run `30106106352` 成功部署；`gh-pages` 更新至 `4b6fecf723e825fa4c64a1af93d92f906e13dc5a`；HTTP 200 與環境隔離實測正常

### Verification
- `git diff --stat -- src/ tests/ package.json package-lock.json .github/`：空
- Full manifest 17/17、Lite manifest 6/6 一致
- 敏感資訊掃描：無命中

### Pull Request
- PR #110（`chore/pr109-post-merge-context-sync`），merge commit `081bf91267d4a28c2c118266feb62379fa01fc64`

---

## [Docs] Cross-AI Handover Governance & Lite Bundle - 2026-07-24

### Added
- `000_AI_START_HERE.md`：新增第三個正式口令「整理交接」，用於 Review／規劃工作結束時整理跨 AI／跨對話可延續的交接快照；無 Repository 存取權時不得宣稱已確認 Branch、HEAD、PR、Merge、部署或 Production。
- `012_AI_HANDOVER.md`：新增 §2.2 Claude Home／ChatGPT 規劃交接格式（本次工作主題、已確認決策、Todo 變更、建議 Sprint、待盤點事項、下一位 AI 的直接起點、建議更新的 AI_CONTEXT 文件）。
- `015_CROSS_AI_COMPATIBILITY_SPEC.md`：新增 §4.1 權責區分表（Claude Home／ChatGPT 讀 Bundle、負責規劃；Claude Code／Codex 讀 Repository、負責確認與寫回）與 §4.2 正式交接流程（Claude Home → 整理交接 → Claude Code → Repository 唯讀確認 → 更新 AI_CONTEXT → 重建 Full／Lite Bundle → 使用者更新 Project Knowledge → ChatGPT → 開始工作）。
- `tools/build_ai_context_bundle.py`：單次執行同時產生 Full Bundle（沿用既有檔名，17 份文件）與新增的 Lite Bundle（`000_Universal_Rebalance_AI_Context_Bundle_Lite.md`，含 `000_AI_START_HERE.md`、`000_AI_WORKSPACE_RULES.md`、`001_README.md`、`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`、`012_AI_HANDOVER.md` 共 6 份），皆輸出到 `AI_CONTEXT/EXPORTS/`，不手動維護第二套內容。

### Changed
- `012_AI_HANDOVER.md`：全部帶版本號的舊檔名引用（如 `008_Universal_Rebalance_Todo_Backlog_v1.0.md`）改為 active 無版本號名稱（`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`）；明確聲明本文件是短期工作快照，非 Todo Backlog、Roadmap 或 Current Status 的替代品。

### Compatibility
- localStorage／Firebase／JSON Backup：不受影響（未修改 `src/`）
- Preview / Production：PR Merge 後透過 `Deploy GitHub Pages` workflow run `30106106352` 成功重新部署；`gh-pages` 分支更新至 `4b6fecf723e825fa4c64a1af93d92f906e13dc5a`；Production／Preview 環境隔離實測正常

### Verification
- Bundle：Full 17/17、Lite 6/6 manifest 皆與來源文件核對一致
- Test：`CI Verification` 於 Draft PR 上兩次（初版與 P1 文件一致性修正後）皆於真實 GitHub-hosted Ubuntu runner 成功
- `git diff --check`：0 警告
- 敏感資訊掃描：無命中
- Desktop／Mobile：不適用（本次未修改任何 UI／前端功能）

### Pull Request
- PR #109（`chore/ai-context-cross-ai-handover-governance`），merge commit `4a95a8abe3c3b58359cb6ce5caa65cde4b14928d`

---

## 建議記錄格式

```md
## [版本號] - YYYY-MM-DD

### Added
- 新增功能

### Changed
- 行為或介面調整

### Fixed
- 修正問題

### Compatibility
- localStorage：相容／需 migration
- Firebase：相容／需 migration
- JSON Backup：相容／需 migration
- Preview / Production：影響說明

### Verification
- TypeScript：通過
- Test：通過
- Build：通過
- Desktop：通過
- Mobile：通過

### Pull Request
- PR #xxx
```

---

## 既有歷程待整理

以下僅作為整理方向，應以 GitHub PR、Commit 與 Current Status 為準：

- V5 系列：Dashboard、績效、股息、AI 決策、風險、匯入中心、CLEC
- V6.8～V6.10.1：報價刷新、Market Worker、CORS、手機字體與圖表刻度
- V6.13：Typography 與 Chart 修正

不可只依記憶填寫正式 Changelog；應以 Repository 記錄驗證。
