# Universal Rebalance AI Handover

## 最新交接快照：UR-TODO-023 Final Governance Closeout（CLOSED／Production Verified，2026-08-18）

- 正式決策：使用者已完成 Closeout Scope Review 並採納 **A. Direct Closeout**。UR-TODO-023-A 已完整滿足 UR-TODO-023 的 transaction-level 核心目的，故 **UR-TODO-023 = CLOSED／Production Verified**；不得建立或暗示待建 UR-TODO-023-B／023-C。023-A 的 Production 證據維持：PR [#392](https://github.com/hyc640110/family-universal-rebalance/pull/392) final head `b41e0e5c5bf3b3fffaf5732a96e728d55e4c0cb2`、一般 2-parent merge `a31ad5f9511d33f7b9226138fbb9c241b7636674`（未使用 admin override）、CI `32148181979`、Preview `32148383148`、push/main Production `32149911373` 均 success，Preview 人工驗收與 Production 唯讀驗證均 PASS。
- 已完成能力與邊界：Statement 有效列推導日期範圍，使用者明確確認 period 後才比較同帳戶 posted／non-excluded／period-scoped App 交易；external ID 優先、fingerprint 次之，唯一高信心才 matched，ambiguity 保持 unresolved／possible，並呈現 Statement-only／App-only／invalid、one-to-one consumption 與 fail-closed。結果僅是 Import Center ephemeral local React state；不寫入 Financial Event Ledger、不建立 persistent reconciliation state、不改 transaction write path。period boundary／transaction exclusion regression coverage 已存在，`test:ci` 1,114 pass、TypeScript、Production／Preview build、`git diff --check` pass。
- balance reconciliation 決策：本 Todo 不建立 balance reconciliation UI／flow。Statement import 沒有 authoritative opening／closing／running balance；App account balance 可能是 manual 或 transaction-derived，不能當銀行 Statement 的權威餘額；Financial Event Ledger reconciliation 語意不同，net-worth snapshot 不能替代 account-specific Statement balance。若未來需要 balance certification，屬新的產品需求與資料契約，不是 023 correctness 修補。
- reconciliation history persistence 決策：本 Todo 不建立 persistent history。現有比較是 ephemeral／local／read-only；若未來需要可重現、長期稽核，必須先定義 Statement source／hash、mapping、account、period、transaction identity／snapshot strategy、algorithm version、invalidation semantics 與 retention policy。在契約不存在時持久化 summary 會造成 duplicated／stale state、migration burden、localStorage／JSON Backup complexity 與 ambiguous SSOT。
- Not required for 023 closeout：balance reconciliation UI／flow、reconciliation history persistence、schema version bump、persistence migration、JSON Backup extension、Financial Event Ledger wiring、reconciliation debug／observability UI、UR-TODO-023-B、UR-TODO-023-C。未來若有真實需求，必須另立獨立 TODO／Sprint 重新 scope review，不得重新解釋為 023 未完成範圍。
- Stash identity：永久識別僅使用 object SHA `e141af14273b76501c1b287ea018e8728099f1e5` 與 `4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`；本輪未操作 stash，index 僅是可變暫時位置。

## 最新交接快照：UR-TODO-023-A Monthly Transaction Reconciliation Preview（CLOSED／Production Verified，2026-08-18）

- 正式決策：UR-TODO-023-A 已 CLOSED／Production Verified；UR-TODO-023 整體仍為 **PARTIAL／OPEN**。PR [#392](https://github.com/hyc640110/family-universal-rebalance/pull/392) final head `b41e0e5c5bf3b3fffaf5732a96e728d55e4c0cb2` 已由 `hyc640110` 於 2026-08-18T14:41:46Z 以一般 2-parent merge commit `a31ad5f9511d33f7b9226138fbb9c241b7636674` 合併（parents：`c10b26d9219cda6d50e799f08c7e47e15dd188be`、`b41e0e5c5bf3b3fffaf5732a96e728d55e4c0cb2`；未使用 admin override）。CI `32148181979`、Preview workflow_dispatch `32148383148`、push/main Deploy GitHub Pages `32149911373` 均 completed/success；Production workflow 的 head 與 merge commit 相符，regression/test gate、Production build、Pages deploy success。
- 已完成契約：statement 有效列推導 minDate／maxDate 的建議對帳期間，使用者按「產生對帳預覽」後明確確認才產生 reconciliation result；取消維持無結果。結果保持既有 matching priority、one-to-one、externalId identity、fingerprint 與 possible identity；僅 Statement／僅 App／可能相符／無效列文案清楚無方向歧義。Preview 人工驗收 PASS（已匹配 3、可能相符 2、僅 Statement 1、僅 App 1、無效列 1）；未建立 Production 資料。
- 部署與唯讀驗證：Production／Preview root 均 HTTP 200，environment metadata 分別為 production／preview、asset isolation 正確；Production bundle 含本 Sprint safe UI 字串。Production `/assets#transactions-section` 已實際載入交易基礎、Import Center、檔案選擇與 Column Mapping；因未上傳資料，條件式對帳按鈕未在 live DOM 出現，但公開 Production bundle 已確認包含對帳 UI 字串。console 無新增 error，未建立或匯入 Production 測試交易，未修改 Production localStorage。
- 邊界：不改 matching priority、one-to-one algorithm、externalId identity、fingerprint、possible identity、`posted && !excluded` filter、schema、persistence、AppState、JSON Backup、ImportSession、duplicate formula、UR-TODO-022-A／B／C 或 transaction write path。`test:ci` 1,114 pass，TypeScript、Production／Preview build、`git diff --check` pass；npm audit 的 4 個 high vulnerabilities 為既有相依問題，未由本 Sprint 引入。
- Stash identity：永久識別僅使用 object SHA `e141af14273b76501c1b287ea018e8728099f1e5` 與 `4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`；本輪未操作 stash。唯讀盤點時其暫時位置為 `stash@{5}`／`stash@{6}`，index 可因後續新增 stash 而移動，不得作為永久 identity。
- 下一位 AI：只能先進行 **UR-TODO-023 Closeout Scope Review（Review Mode）**。balance reconciliation 與 reconciliation history persistence 仍未決，未經新的產品決策不得自動建立 UR-TODO-023-B／023-C、不得新增持久化或交易寫入。

## 最新交接快照：UR-TODO-022 Final Governance Closeout（CLOSED／Production Verified，2026-08-18）

- 正式決策：使用者完成 UR-TODO-022 Closeout Scope Review，正式決定 **UR-TODO-022 = CLOSED／Production Verified**。原始產品目的「自動分類與重複交易偵測」已由 022-A Rule-Assisted Category Suggestion Foundation、022-B Safe Column Auto-Mapping Hardening、022-C Batch-Aware Duplicate Reconciliation 完成並各自完成 Production Verified；本次為純治理結案，基線為 PR [#390](https://github.com/hyc640110/family-universal-rebalance/pull/390) merge commit `2467ed7c19350134f105c8aa6e531ad7ced9cde3`。
- 最終工作流與安全邊界：Import Center 維持 file parsing → safe deterministic column auto-mapping → deterministic high-confidence category suggestion → explicit user confirmation → existing＋same-batch duplicate protection → preview → explicit import。Human-in-the-loop 類別確認是刻意保留的安全邊界，不是未完成缺陷；ambiguous／low-confidence semantic 維持 fail closed，並維持 deterministic、high-confidence、preview-first、explicit user confirmation、no automatic transaction commit。
- Deferred／Future Enhancement：Historical mapping reuse、historical learning、fully automatic classification、AI／LLM classification 不再是 UR-TODO-022 closure requirement 或 blocker。未來若產品確定需要，必須另立新的獨立 UR-TODO，重新做 Contract Audit、風險邊界與 acceptance criteria；不得直接重新開啟 UR-TODO-022，且本次未自行建立新 Todo 編號。
- 邊界：本次未變更 `src/**`、`tests/**`、package、`.github/**`、schema、persistence、localStorage、JSON Backup、Financial Event Ledger、attribution、Household Liquidity、Rebalance、AI Decision、Import Center、duplicate formula、`transactionFingerprint`、category suggestion 或 column mapping。固定 stash 只以 object SHA 識別，未操作任何 stash。

## 最新交接快照：UR-TODO-022-C Batch-Aware Duplicate Reconciliation（CLOSED／Production Verified，2026-08-18）

- 正式基線：PR [#389](https://github.com/hyc640110/family-universal-rebalance/pull/389) final head `9b2f94b42951aa99665e3e7f90c82d071de16c08` 已由 `hyc640110` 於 2026-08-18T13:09:39Z 以一般 2-parent merge commit `dc6b5aca77c6ad60bb3be243e56091348be0f1ce` 合併（parents：`b720aa3ff15ec367778156528734ef9eca54fadd`、`9b2f94b42951aa99665e3e7f90c82d071de16c08`；未使用 admin override）；現行 `origin/main` 為該 merge commit。CI `32139612582`、相同 head 的 Preview workflow_dispatch `32139755897`、push/main Deploy GitHub Pages `32140771082` 均 success，最後者 regression gate、Production build、Pages deploy success 且 head 相符。
- 已完成契約：既有 Import Preview 管線以 deterministic canonical row order 做 batch reconciliation，輸出 `none`／`possible`／`certain`。同批 exact duplicate 保留最早有效列、後續列 certain／selected=false；同日同額同描述但 fingerprint 不同者維持 possible、可選，並直接呈現既有 `row.warning`「同批次可能重複，請確認是否仍匯入」；同一非空 externalId 為 certain；category 更新可依既有 batch 規則 downgrade／upgrade。Preview 人工驗收 PASS，且未 commit 測試資料。Production 人工唯讀驗收 PASS：`/assets#transactions-section`、交易基礎、Import Center、檔案選擇與 Column Mapping／Preview 控制項正常，console 無新增 error，未建立／匯入 Production 測試交易，未修改 Production localStorage。
- 部署與隔離：Production／Preview root 均 HTTP 200。Production workflow 明確為 main，Preview 為相同 feature head；Production asset `index-FKnb2K2Y.js` 與 Preview asset `index-CDobTh5S.js` 不同且均含 warning／external-ID 重複偵測字串，確認 asset isolation 與本 Sprint bundle 已部署。`test:ci` 1,097 pass（Import Center 36/36）、TypeScript、Production／Preview build、`git diff --check` pass。
- 邊界：未改 checkbox 行為、duplicate calculation、`buildImportPreview` duplicate formula、`transactionFingerprint`、category suggestion、transaction creation 或 UR-TODO-022-A preview-only suggestion contract；無 schema、persistence、JSON Backup、Ledger、Household Liquidity、Rebalance、AI Decision、Firebase 或 Worker 變更。`npm audit --omit=dev --audit-level=high` 的 4 個 high vulnerabilities 是既有相依問題，未由本 Sprint 引入且不在本範圍處理。
- Stash identity：永久識別使用 object SHA `e141af14273b76501c1b287ea018e8728099f1e5` 與 `4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`；本輪未操作兩者。其 index 可隨後續 stash 新增而移動，僅屬暫時位置，不得以 `stash@{0}`／`stash@{1}` 當永久 identity。
- 下一位 AI（歷史快照）：此為 Closeout Scope Review 前的交接狀態；已由本文件最上方 Final Governance Closeout 取代。Historical mapping reuse、historical learning、fully automatic classification、AI／LLM classification 均為 Deferred／Future Enhancement，不再阻擋 UR-TODO-022 結案。

## 最新交接快照：UR-TODO-022-B Safe Column Auto-Mapping Hardening（CLOSED／Production Verified，2026-08-18）

- 正式基線：PR [#387](https://github.com/hyc640110/family-universal-rebalance/pull/387) final head `c9f89aed3232075899799f19fb75889c30828cdc` 已由 `hyc640110` 於 2026-08-18T05:52:54Z 以一般 2-parent merge commit `b81342dac07ace36d965495a74a2a0a628776ff9` 合併（parents：`fd9dafe6044915ac2762ed83979589417a9d7033`、`c9f89aed3232075899799f19fb75889c30828cdc`；未使用 admin override）；現行 `origin/main` 為該 merge commit。CI `32103283273`、相同 head 的 Preview workflow_dispatch `32103449472`、push/main Deploy GitHub Pages `32104607740` 均 success，最後者 regression gate、Production build、Pages deploy success 且 head 相符。
- 已完成契約：`guessImportMapping` 僅採 deterministic exact → strong alias；歧義或 source conflict 一律 fail closed。credit＋debit 優先 amount；交易日期不從 posting／posted／入帳日期推測；externalId 僅接受嚴格 alias、裸 `id` 拒絕。Preview 人工驗收 PASS（不手動調整 mapping 即有效 7／錯誤 0，收入／支出及 022-A category suggestion 正常）；Production 人工唯讀驗收 PASS（交易基礎、Import Center、檔案選擇、Column Mapping、Preset／匯入紀錄正常），未建立／匯入 Production 測試交易，未修改 Production localStorage。Production／Preview HTTP 200、environment metadata 與 assets 隔離正確，Production bundle 已含本 Sprint aliases；`test:ci` 1,063 pass、TypeScript、Production／Preview build、`git diff --check` pass。
- 邊界：duplicate detection formula、`transactionFingerprint`、preview category action、transaction creation 與 UR-TODO-022-A preview-only suggestion 均未變；無 schema、persistence、JSON Backup、Ledger、Household Liquidity、Rebalance、AI Decision、Firebase 或 Worker 變更。`npm audit --omit=dev --audit-level=high` 的 4 個 high vulnerabilities 是既有相依問題，未由本 Sprint 引入且不在本範圍處理。
- Stash identity：永久識別使用 object SHA `e141af14273b76501c1b287ea018e8728099f1e5` 與 `4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`；本輪未操作兩者。其目前索引可隨後續 stash 新增而移動（本次唯讀盤點為 `stash@{5}`／`stash@{6}`），不得再把 `stash@{0}`／`stash@{1}` 當永久 identity。
- 下一位 AI（歷史快照）：此為 022-B 結案當時的交接狀態；已由最上方 Final Governance Closeout 取代。Deferred 項目不再阻擋 UR-TODO-022 結案。

## 最新交接快照：UR-TODO-022-A Rule-Assisted Category Suggestion Foundation（已完成／Production Verified，2026-08-18）

- 正式基線：PR [#385](https://github.com/hyc640110/family-universal-rebalance/pull/385) 已由使用者授權以一般 2-parent merge commit `9628d8aed9a5875047eb86cdd98b28b7f580849b` 合併（final head `492b85e99fa72df5389c8a6fe36c37e1990fa18d`；parents：`aba0a9283035ba1e6fd3c55d01a24490aa62943f`、`492b85e99fa72df5389c8a6fe36c37e1990fa18d`；`mergedAt: 2026-08-18T04:03:57Z`；`mergedBy: hyc640110`；未使用 admin override）。verify `32096747958`、相同 head 的 Preview workflow_dispatch `32096761194` 與 push/main Deploy GitHub Pages `32097751304` 均 success；後者 regression gate、Production build、Pages deploy success，head 與 merge commit 相符。Production HTTP 200／metadata=`production`，bundle `index-UfIXOsXo.js`，未混用 Preview asset；未建立任何 Production 測試交易。
- 已完成契約：Import Preview 的類別 suggestion 為 deterministic、high-confidence only、safe whitelist only；high-risk semantic 一律 fail closed、conflict=`none`。suggestion metadata 只在 Preview/session 存在；使用者須明確套用，無自動交易建立／commit。Desktop 與 390 × 844 Preview 人工驗收均已通過；Production 沿用該相同 PR head 的人工 UX 證據，僅完成唯讀 deployment verification，未假稱重新人工驗收。
- 邊界：未加入 AI／LLM、historical learning、schema／persistence／JSON Backup、Financial Event Ledger、attribution、Household Liquidity 公式或 Rebalance／AI Decision coupling；duplicate detection contract 未變。
- 下一位 AI（歷史快照）：此為 022-A 結案當時的交接狀態；已由最上方 Final Governance Closeout 取代。fully automatic classification 等 Deferred／Future Enhancement 未實作，但不是 UR-TODO-022 closure blocker；未來需另立新 Todo 並重新取得產品決策與授權。

## 最新交接快照：UR-TODO-013 Investment Decision Workflow Integration（CLOSED，2026-08-18）

- 正式結案：UR-TODO-013 已 CLOSED，closure reason = **absorbed by subsequent Production capabilities**。原始可驗證治理記錄僅有標題、P2、`UR-TODO-009` dependency 與「部分完成」；未找到獨立 specification 或逐項 acceptance criteria，最初建立日期亦無法完整還原。因此不得記為「所有原始驗收條件均已完成」。
- Closeout Audit 結論：後續更具體、已實作、已測試並進入 Production 的 Rebalance Recommendation、Rebalance Execution Eligibility、Investment Intelligence、Daily Decision Workflow、Investment Action Center、Investment Action Explainability、CLEC Strategy Rules、Household Liquidity integration、Investment Opportunities／Dip safety boundary 與 Rebalance Decision Journal，已實質吸收本 Todo 可合理推定的投資決策工作流意圖。
- 現行邊界：workflow 為 advisory-only，data／liquidity fail closed；recommendation 與 execution eligibility 分離；不自動下單、不自動修改 holdings；Decision Journal 只記錄使用者決策意向，不代表成交。Closeout Audit 未發現 UR-TODO-013 本身的 workflow dead-end。
- 下一位 AI：UR-TODO-013 不再是 active、blocker 或 next Sprint candidate。首頁 Investment Intelligence 主卡固定下一步 CTA、Dip 提示獨立納入 Investment Action Center 排序模型只保留為 future enhancement candidates；不得回填為本 Todo 未完成範圍，也不得自動建立新 Todo 或開始 Sprint。

## 最新交接快照：UR-TODO-014 CLEC Historical Backtest Foundation（已完成／Production Verified，2026-08-18）

- 正式基線：PR [#382](https://github.com/hyc640110/family-universal-rebalance/pull/382) 已由使用者授權正常 Merge，merge commit `4205e37b1583472e681dbb35d5db4ee8e580eb20`（parents：`ec49099215847eb7242b3727ecb63f4ce423a717`、`b0d37c3244eabf08bcb5ff60dae2dd0145033271`；final head：`b0d37c3244eabf08bcb5ff60dae2dd0145033271`；`mergedAt: 2026-08-18T02:24:01Z`；`mergedBy: hyc640110`；未使用 admin override）。`origin/main` 為該 merge commit。CI Verification `32090616289`、Preview workflow_dispatch `32090745657`、main Deploy GitHub Pages `32091693042` 都成功；最後一個 workflow 是 push/main、head 與 merge commit 相符，Production HTTP 200／metadata=`production`。
- 已完成範圍：`src/lib/clecHistoricalBacktest.ts` 為純、caller-supplied historical-return Foundation；百分點報酬、嚴格 period chronology、frictionless、正值 max drawdown、fail-closed validation。target weights 必須由 `deriveAllocationPresetPreview()` 取得，不維護第二套 442／433／703／5050 table；交易決策只委派予 `deriveClecStrategyRule()`，且只有 `recommendedAction === 'full_rebalance'` 才重配，`rebalance_consider` 不交易。`test:ur-todo-014` 11/11 pass 並納入 `test:ci`。
- 明確不包含：無 App／route／UI／AppState consumer、無 localStorage／JSON Backup／schema／Financial Event Ledger／attribution、無 production Rebalance engine、market provider 或 Worker wiring；Production 不建立測試資料。本 Sprint 無 UI，未宣稱人工 UI 驗收。
- 正確狀態與下一位 AI 邊界：**UR-TODO-014 是「Foundation completed／Production Verified」，整體仍 OPEN，絕不可標記 CLOSED。** 後續若要開始，必須先由使用者分別決定與授權正式 historical data source、真實歷史資料對 442／433／703／5050 的驗證、UI、或 transaction-cost model；不得把這些不同範圍自動合併為下一 Sprint。

## 最新交接快照：UR-TODO-040 Tool Center IA 與 contextual navigation（CLOSED／Production Verified，2026-08-18）

- 正式結案：PR [#380](https://github.com/hyc640110/family-universal-rebalance/pull/380) 已由使用者以一般 2-parent merge commit `84b6859cd486fd4b8deccd87cca99df38cd28692` 合併（head `df9f03e987596c61a0a5ea164eb9af0883ad517f`；parents：`43fcca43782e103aad5b6dd362eb631c483d79eb`／`df9f03e987596c61a0a5ea164eb9af0883ad517f`；`mergedAt: 2026-08-17T15:15:39Z`；未使用 admin override）。本次 fetch 後 `origin/main` 為相同 SHA。
- 驗證：CI Verification [32040880998](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32040880998)、Preview deployment [32041251407](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32041251407)、merge 後 Deploy GitHub Pages [32041768489](https://github.com/hyc640110/family-universal-rebalance/actions/runs/32041768489) 均 success；後者 regression gate、Production build、Pages deploy success，Production source SHA 與 merge commit 一致。Production HTTP 200，實際 bundle 為 `index-DFldBSkN.js`，舊 `index-DIAMR26i.js` 已不再載入，且 bundle 與本次 Production build 一致。
- 已完成契約：Tool Center 是完整工具目錄，分為「今日決策／管理與追蹤／規劃與模擬／規劃中」四區；`ToolQuickNavigation` 只提供返回工具中心與最多 3 個 contextual related tools，`ToolNature` 不再承擔 IA 分組；planned／non-routed tools 不進 Quick Navigation，undefined current fail closed。ETF X-Ray／蒙地卡羅維持規劃中；`/assets#transactions-section` App 內 React Router + hash navigation regression contract PASS。
- 證據界線：同一 PR head 的 Desktop 與 390 × 844 **Preview 人工驗收已 PASS**。Production 本次只完成 workflow、source／bundle、HTTP 與 automated smoke／contract verification，**沒有重新人工瀏覽器視覺驗收**。直接 server-side 請求 `/assets` 的既有 SPA deep-link 404 不屬 UR-TODO-040 regression。
- 下一位 AI：UR-TODO-040 不再是 blocker、下一 Sprint 或未完成事項。不得因本 Closeout 自動開始任何產品 Sprint；下一步一律等待使用者明確授權。

## UR-TODO-021 Closeout（2026-08-17）

- PR #377 已由使用者授權以一般 merge commit `f0b57c038c0a19c86deeee7a0a73872ac94231e2` 合併（parents：`4645541dca26bb26fb805d7d820006bb94e2303f`／`9851a5ed295cb44ffc5066be9dd15d516c7e0f14`）；`origin/main` 同為此 SHA。
- PR verify `32036912584` success；main Deploy GitHub Pages `32037454446` success。Production HTTP 200、metadata `environment=production`，公開 bundle 含 `.csv,.xlsx,.pdf` picker contract 與文字型 PDF 支援；未輸入或建立任何測試交易。
- 使用者已於本機隔離 Preview 完成正常／多頁文字型 PDF、方向顯示、bare-positive／unknown-structure fail-closed、390px 驗收。PDF contract 是 explicit direction → `type` + positive `amount`；Preview 直接用 `row.type` 顯示「收入／支出」，不由金額重新推導。
- 未包含 OCR、銀行專屬 parser、金額方向猜測、AI 自動分類、schema／persistence／Ledger／Backup、Loan／Investment／FX attribution、Firebase 或 Worker 變更。UR-TODO-021 已 CLOSED。

> 文件定位：本文件是 AI 交接時使用的「工作狀態快照」。
>
> 它不是 Master Roadmap、Current Status 或 Todo Backlog 的替代品，也不是新的待辦來源。
>
> 所有未完成事項仍以 `008_TODO_BACKLOG.md` 為唯一正式來源；最新正式版本與正式環境狀態仍以 `003_CURRENT_STATUS.md` 為準。本文件也不是 `002_MASTER_ROADMAP.md` 的替代品：長期順序異動仍只記錄於 Roadmap。

---

## 最新交接快照：UR-TODO-016 再平衡歷史與決策紀錄（CLOSED，2026-08-17）

- 正式結案：PR [#375](https://github.com/hyc640110/family-universal-rebalance/pull/375) 已由使用者 Merge；final head `2a391adde9fb8d10ac6209d2686796d470c2943d`，一般 2-parent merge commit／最新 `origin/main` `f7bc4a336e92b43facc58f83a2cdbad400846e00`，`mergedAt: 2026-08-17T11:42:40Z`，`mergedBy: hyc640110`。PR CI `32025916546` 與 main Deploy GitHub Pages `32026237097` 均 success，後者 head 與 merge commit 一致。
- 已完成行為：再平衡建議中心可保存「依建議處理／延後／不採用」、備註與 immutable Recommendation Snapshot；資料在 Ctrl+R 後仍存在，並已通過 JSON Backup Export → Import round-trip。`test:ci` 已正式執行 `test:ur-todo-016`。
- 安全邊界：Decision Journal 只記錄使用者決策意向，不代表已下單或成交；不建立 Transaction、不建立 Financial Event、不修改 holdings，未修改 Household Liquidity、Recommendation algorithm 或首頁。
- 人工驗收：Desktop 與 390 × 844 手機均 PASS；「目前建議／決策紀錄」tabs、展開、Recommendation Snapshot、三個決策選項、textarea、提交／取消、決策紀錄卡與 mobile bottom navigation 正常，無明顯 horizontal overflow。
- 下一位 AI：UR-TODO-016 不再是 active 開發項。不得因本功能完成而自動開啟新的產品 Sprint；UR-TODO-054 維持 Deferred／Non-Priority，除非使用者另行指定。

---

## 最新交接快照：UR-TODO-069 手機版固定支出工具列 follow-up（CLOSED／Production Verified，2026-08-17）

- 正式結案：PR [#373](https://github.com/hyc640110/family-universal-rebalance/pull/373) 已以一般 2-parent merge commit `23416db7e575cbbac38abb67f3b72d94d9d28d74` 合併（parents：`87777766f9e2c37bcae0bad35194cc20444ab67a`／`56b3f551bccb22407cdbda4005246cf68f3c9abb`，`mergedAt: 2026-08-16T13:17:12Z`，`mergedBy: hyc640110`）；目前 `origin/main` 為 `1b47a5d44cc20abd13c1b70d486a4fed17313ca3`。
- 驗證：PR verify [31948775856](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31948775856) success；merge 後 main Deploy GitHub Pages [31949386977](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31949386977) completed/success，head 與 merge commit 一致。Production HTTP 200／`environment=production`，公開 CSS bundle 含 `@media(max-width:768px){.retirement-expense-enabled{flex-direction:row;white-space:nowrap}}`；390px 與 Desktop 本機 Preview 已重新確認，Desktop 不套用 mobile override。
- 完成行為與邊界：匯入與自訂項目同由 `draft.fixedExpenses.map(...)` JSX 與 `.retirement-expense-enabled` class 處理；全域 `label{flex-direction:column}` 的局部覆寫已使「計入支出」同列且不換行。`removeItem()`、`window.confirm()`、`retirementPlan`、Cash Flow、退休計算、schema、persistence、JSON Backup、Ledger、attribution、Household Liquidity 與 Rebalance 均未變；對應 regression test 已存在並持續通過。
- 下一位 AI：UR-TODO-069 已無未完成項目。不得因本 Closeout 自動開始 UR-TODO-040 或其他產品 Sprint；一律等待使用者下一步明確指示。

---

## 前一交接快照：UR-TODO-066 退休提領規劃（CLOSED，2026-08-16）

- 正式結案：PR [#366](https://github.com/hyc640110/family-universal-rebalance/pull/366) 已一般 Merge，merge commit／最新 `origin/main` `83223498afb196179f24f66c7f3009644e006765`；CI `31931191149`、main Deploy `31931698419` success，Production HTTP 200／`environment=production`，未使用 admin override。
- 已完成 contract：FIRE 目標＝年總開銷 ÷ 年提領率；目前達成率使用即時計算 `totalAssets - debt`；所需投入直接重用 `calculateRequiredMonthlyContribution(currentNetWorth, WealthGoalSettings, retirementYears * 12)`，月回傳值為平均每月負擔、乘 12 為每年需投入。退休年限為 0 時不偽造精確投入金額。
- persistence：加法式 `retirementPlan` 已納入 App state／localStorage／JSON Backup；固定支出改為以主動「從現金流匯入」按鈕複製，之後完全獨立且不回寫 Cash Flow，不寫入 snapshot、Ledger、attribution 或同步服務。
- UI：`/tools/retirement-planner` 與 Tool Center 卡片已啟用；固定支出自訂上限 10，提供旅遊／保險年度支出、1%～20%提領率、退休年限與預期年化報酬滑桿、FIRE／達成率／投入金額與免責文字。Preview 完整驗收、Production 唯讀 smoke check 均已完成。
- 已修正三項 Preview 問題：滑桿 event 延遲讀取造成崩潰、零值金額輸入附加、以及首次自動詢問匯入造成空資料時體驗不佳（改成含確認與空資料提示的主動按鈕）。全站共用 `DraftInput` 的同類零值輸入缺陷已判定為獨立後續 PR，不屬 UR-TODO-066。

---

## 最新交接快照：UR-TODO-054-A Closed／UR-TODO-054-B Audit GO（2026-08-14）

- 任務背景：UR-TODO-046 Final Audit／Closeout（見下方歷史交接快照）拆出 UR-TODO-054（Attribution Confirmation Lifecycle UI），本輪正式完成第一個子項 054-A（Loan Confirmation UI）的開發／Preview 驗收／Merge，並完成第二個子項 054-B（FX Confirmation UI）的 Review Mode Contract Audit。
- **UR-TODO-054-A（Loan Confirmation UI）狀態：CLOSED（已完成）**。PR [#331](https://github.com/hyc640110/family-universal-rebalance/pull/331) 已正式 Merge，merge commit `c87a9e933af9cd5e7d2fa31bcb301adfa10e7944`，parents `0097107e3f860009d00c4dfb8b83708ba4fef269`（merge 前 main）／`0184834b5da0b618ca44981b6e231a1b230c1791`（PR head），一般 merge commit，未使用 admin override；`mergedAt: 2026-08-14T13:24:48Z`、`mergedBy: hyc640110`。落地 Minimal Loan Repayment Producer、Loan Group Candidate Review、Confirm、Atomic Void、Reconfirm，並修正 `RuntimeAttributionProvenanceCard` 對 Loan derived component 錯誤暴露 component-level generic confirmation 按鈕的既有 UI safety 缺口。Deploy GitHub Pages run `31804595653` success，headSha 與 merge commit 一致；Production／Preview 皆 HTTP 200，Production 唯讀確認新 UI 已存在、console 無錯誤。使用者已於無痕視窗完整驗收 Preview 全流程，Atomic Void／Reconfirm 底層資料層行為已用 `composeRuntimeNetWorthAttribution()` 真實計算結果驗證（非僅 presentation 層）。開發過程中發現並修正兩項真實 Preview 阻斷 bug：(1) `confirmLoanPaymentGroupAndAppend()` 成功時 `result.events` 只回傳新建的那組事件、不是完整合併 Ledger，App.tsx caller 原先誤用「取代」語意，已修正為「附加」；(2) `buildLoanPaymentConfirmationGroup()` 對 `transaction.occurredAt` 的未保護 `canonicalCalendarDay()` 呼叫具有靜默失敗風險，已於 App.tsx caller 與 UI 元件兩層補上 try/catch 防禦。詳見 `008_TODO_BACKLOG.md` UR-TODO-054-A 正式條目。
- **UR-TODO-054-B（FX Confirmation UI）Review Mode Contract Audit 已完成，正式判定 GO**，尚未下達「開始開發」。既有 FX confirm／void／reconfirm core contract（`confirmFxConversionAndAppend()`、`resolveActiveFxConversionGroups()`）已完整、已測試（本輪重新執行相關 130 個測試 0 fail）；結構上比 Loan 更單純（一次確認僅 1 筆 `fx-conversion` FinancialEvent，無需獨立 confirmationGroupId，void 不存在「部分 void 留下孤兒 sibling」問題）；已確認**不需要**修改 `RuntimeAttributionProvenanceCard`（FX 沒有 Loan 式的 derived-evidence 洩漏路徑）。**開發時務必注意與 Loan 相反的方向性差異**：`confirmFxConversionAndAppend()` 成功時 `result.events` 是**完整合併 Ledger**，App.tsx caller 必須直接 replace `state.financialEvents`，不得像 Loan 一樣再 append 一次（會造成整個 Ledger 重複疊加）。**Production FX Producer gate 維持 OFF、Preview 維持 ON，054-B 不修改 feature gate、不啟用 Production Producer**——FX Production Producer Enable 仍是獨立、需另行明確授權的 ADR-010／ADR-013 Controlled Rollout Policy 決策，不因 054-B 開發或完成而自動觸發。詳見 `008_TODO_BACKLOG.md` UR-TODO-054-B 正式條目。
- **UR-TODO-054-C（Generic Split Confirmation UI）狀態：待規劃**，尚未進行 Contract Audit，本輪未評估。
- 下一位 AI 的直接起點：**開始開發 UR-TODO-054-B 前，先依最新 `origin/main` 完成 Development 初始化**（`git fetch --prune origin`、重新確認 head SHA、working tree、stash／untracked baseline，不得沿用本文件或聊天記錄中的舊 SHA）；054-B 的 Contract Audit 結論已記錄於 `008_TODO_BACKLOG.md`，可直接作為開發起點依據，但仍須依標準流程完成唯讀初始化與最新 main 基線確認後才能建立新 Branch 開始開發。UR-TODO-054-C（Generic Split）尚未進行 Contract Audit，若要接續開發需先另行唯讀盤點。PR #322（Loan payment atomic contract 稽核，NO-GO development 結論）仍為獨立 Draft／OPEN，本輪未處理，不影響上述任何項目。本輪為**純治理文件同步**（`AI_CONTEXT/**/*.md`、`AI_CONTEXT/EXPORTS/*`），零 production code、零 schema、零 persistence、零測試檔修改，PR 仍待使用者驗收與 Merge 決策，AI 未自行 Merge。

---

## 歷史交接快照：UR-TODO-046 Final Audit / Closeout（正式 CLOSED，2026-08-14）

- 任務背景：UR-TODO-046（淨值成長來源歸因與記錄／實際落差核對）自 2026-07-30 提出以來，歷經 Ledger foundation、Investment（046-I1）、Loan（046-L1）、Generic Split（046-L2A/L2B）、FX 全序列（FX-A1/A2/A3、F1A-F1D、F2A-F2D）逐階段開發。本輪為 Review Mode Final Audit，逐一比對 Repository 實證（git history、程式碼、測試、正式部署站點，非採信聊天記錄或任何文件描述），確認核心 attribution／FinancialEvent／reconciliation／persistence／safety contract 已全數完成，**正式判定 CLOSE B（production code 已完成，僅需一次治理文件同步）**，本輪即為該同步動作。
- **最新 `origin/main`＝`6ad9f5802165f0d1b78b4dd13a151584afcbf00f`**（PR #329 merge commit，重新 `git fetch --prune origin` 確認）。
- **PR #329（FX-F2D Attribution Integration）已正式 Merge／Production Verified**：merge commit `6ad9f5802165f0d1b78b4dd13a151584afcbf00f`，parents `e27860db566c47a3d6c57716d79712a325ac8336`（merge 前 main）／`6363b7da97f823ce3e45e087263c498ab9c0234e`（PR head），一般 merge commit，未使用 admin override；`mergedAt: 2026-08-14T09:01:47Z`、`mergedBy: hyc640110`。Deploy GitHub Pages run `31786367407` success，head 與 merge commit 一致。落地 `fx-conversion` FinancialEventType、`fxConversionLink`（canonical identity＝opaque envelope id）、`resolveActiveFxConversionGroups()`、candidate／matched／unsupported 三態 reconciliation、zero-effect principal contribution、duplicate confirmation fail-safe、void／reconfirm（重用既有 `buildVoidEvent()`，forward-only）、confirmed-delete guard、FX conversion principal 與 FX valuation 效果分離（皆有測試鎖定），schema 維持 v3 不變。
- **PR #328（FX-F2C-3 Preview Producer Enable）已正式 Merge／Production Verified**：merge commit `e27860db566c47a3d6c57716d79712a325ac8336`，一般 merge commit，未使用 admin override；Deploy GitHub Pages run `31760397904` success。將 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 由 `false` 翻轉為 `true`，`deriveFxOpaqueProducerCapability()` 的 `sourceGateEnabled && deploymentEnvironment === 'preview'` AND 邏輯本身未變。
- **Production Producer 確認仍 OFF、Preview Producer 確認 ON**：已於正式部署站點（`https://hyc640110.github.io/family-universal-rebalance/`／`.../preview/`，HTTP 200）以真實瀏覽器操作雙向驗證——Production 展開「交易基礎」後 Manual FX Producer 表單完全不出現；Preview 展開後表單完整可見。
- **1047 tests baseline**：`npm run test:ci` 於 `origin/main`（`6ad9f580`）重新執行確認 **1047 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功（前一輪 Merge Gate 審查已完成，本輪未重新執行 production code 驗證，僅治理文件同步）。
- **Stop Condition 8 項已於前一輪 Merge Gate 審查逐項確認皆為 NO**：核心 net-worth formula 未修改、FinancialEvent schema 未 bump v4（維持 v3）、F2B identity 未破壞（`conversionId` 仍＝envelope.id）、Production Producer gate 未被本 Sprint 序列意外開放（僅 F2C-3 依明確授權翻轉 source gate，Production 仍受 environment guard 保護）、FX 兩腿成功以單一 FinancialEvent 表示、conversion／valuation 已用測試證明分離、Loan／Generic Split 零改動、persistence round-trip（含 `fxConversionLink`）已測試證明正確。
- **PR #322**（`test: confirm loan-payment atomic contract covers principal/interest attribution (NO-GO development)`）**仍為 Draft／OPEN，本輪未處理，不阻擋 UR-TODO-046 CLOSED**。其自身結論已是 NO-GO development（既有 Loan 046-L1 contract 已完整涵蓋 principal/interest attribution，僅新增 1 項 regression test 補強，非新開發缺口）；disposition（Close 或作為獨立低風險測試補強 Merge）留待使用者另行決定，不影響本次結案判定。
- **Follow-up Todos**（已正式建檔於 `008_TODO_BACKLOG.md`，取用 Repository 目前最大編號 `UR-TODO-053` 之後的下一批可用編號，非隨意假設）：
  - **UR-TODO-054** Attribution Confirmation Lifecycle UI（FX／Loan／Generic Split）——三個 domain 的正式 confirm/void/reconfirm primitive 目前皆只存在於函式庫層級，`App.tsx` 零呼叫，一般使用者無法透過畫面操作。
  - **UR-TODO-055** Loan／Investment Delivery Mapping（UI／CSV／Import Center）。
  - **UR-TODO-056** FX Enhancement Bundle（FX valuation attribution、JPY/EUR、automated pairing、進階 fee attribution）——**實作時務必拆成獨立子 Sprint，不得合併成單一大 PR**。
  - FX Production Producer Enable **不是**新 Todo，維持既有 ADR-010／ADR-013 Controlled Rollout Policy 框架，屬獨立、明確授權的 product deployment decision。
- 下一直接起點：**下一個開發主線不得再從 UR-TODO-046 底下繼續追加 scope**——UR-TODO-046 已正式 CLOSED，任何 FX／Loan／Investment／Generic Split 的後續工作應從上述獨立 Todo（UR-TODO-054／055／056）或另行新建的 Todo 出發，各自需要獨立唯讀盤點、產品決策與明確授權才可開始開發，不因 046 已完成而自動解鎖。本輪為**純治理文件同步**（`AI_CONTEXT/**/*.md`、`AI_CONTEXT/EXPORTS/*`），零 production code、零 schema、零 persistence、零測試檔修改，PR 仍待使用者驗收與 Merge 決策，**AI 未自行 Merge**。

---

## 歷史交接快照：UR-TODO-046 FX-F2D Attribution Integration（開發完成／Draft PR 待 CI／Preview 驗收，2026-08-14）

- 任務背景：FX-F2C-3（PR #328，merge commit `e27860db566c47a3d6c57716d79712a325ac8336`）已正式 Merge／Production Verified，Preview Producer capability 已為 ON、Production Producer capability 依既有 `deploymentEnvironment === 'preview'` guard 仍恆為 OFF。ChatGPT 先前主導一輪 Review-Mode-only「Repository Contract Audit」，正式判定 **GO A — Single F2D Sprint**：FX conversion 的 attribution 接線可在單一 Sprint 內完成，不需拆分為 F2D-1／F2D-2。本 Sprint 依審計結論與使用者的 27 節開發規格，實作 FX conversion 進入 attribution／reconciliation／`FinancialEvent` pipeline 的完整路徑，全程 zero-effect principal contribution、無 double-counting、Production Producer 保持 OFF。
- 核心設計：新增 `fx-conversion` 一種新的 `FinancialEventType`（`financialEvents.ts`），以**單一** `FinancialEvent` 代表一組換匯的兩筆 leg transaction（不同於 Loan／Generic Split 的「一筆交易→N 個 event」group 模式，因為 FX 是「兩筆交易→一個 event」，形狀不同，故未重用既有 group-write primitive，而是重用單純的 `appendFinancialEvent()`）。新增 `fxConversionLink: { conversionId, sourceTransactionId, destinationTransactionId }` 欄位，`event.transactionId` 固定指向 TWD 腿（因 F2B 契約保證 TWD↔USD 必有一腿為 TWD，既有 `TRANSACTION_LINKED_SOURCES` 驗證管線因此完全不需修改）。新增 `resolveActiveFxConversionGroups()`（`fxConversionIdentity.ts`）鏡射 Loan／Generic Split 既有 resolver 的邏輯骨架，但移除其「`transactionIds.size === 1`」限制，改為驗證 envelope 仍 `valid` 且 event 內 pinned 的 `sourceTransactionId`／`destinationTransactionId` 與 envelope 當下 resolve 結果一致。新增 `fxConversionAttribution.ts`（鏡射 `loanAttributionConfirmation.ts` 模式，但只產生一個 event、不產生 group）。`netWorthAttribution.ts` 的 `ZERO_EFFECT_EVENT_TYPES` 新增 `'fx-conversion'`，確保換匯本身對淨值歸因永遠貢獻 0（貨幣轉換不創造/消滅淨值）。`transactionReconciliation.ts`／`runtimeAttributionComposition.ts` 接線 `resolveActiveFxConversionGroups()`，新增 `'fx-conversion-contract-candidate'`／`'linked-fx-conversion'` 兩個 reconciliation reason，使換匯的兩腿在未確認前呈現為 `candidate`、確認後呈現為 `matched`。`fxConversionProducer.ts` 的 `buildFxConversionDeletion()` 新增第三參數 `financialEvents`，已正式確認（`confirmed`）的換匯若被直接刪除會被攔截（新增 `confirmed-delete-blocked` 狀態），`App.tsx` 對應新增 `window.alert()` 攔截提示；使用者需先撤銷（void）正式記帳才能刪除原始交易。
- 驗證：新增 `tests/fxConversionAttribution.test.ts`（31 項測試，涵蓋 confirm 建立／append、重複確認防止、reconciliation candidate／matched、zero-effect contribution、無 derived evidence、void／重新確認、confirmed-delete 攔截、schema v2 拒絕 `fxConversionLink`／未知 schema 版本維持 opaque 的 round-trip、完整 E2E 狀態機、跨 domain resolver 隔離性）；同步修正 `tests/fxConversionIdentityRegression.test.ts` 中 2 項因 F2D 本身即為授權接線而過時的「零耦合」舊斷言，改為驗證新的單向耦合（本模組消費 `fxConversionIdentity.ts`，但反向不成立、無循環依賴）。`npm run test:ci` 由 1016 增至 **1047 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；`git status --porcelain` 確認改動範圍恰為 8 個既有檔案修改＋2 個新檔案（含測試），無非預期副作用。
- 明確不包含：`FX_OPAQUE_PRODUCER_SOURCE_GATE`（F1D gate）本身未修改、Production Producer 依既有 environment guard 仍恆為 OFF、核心 net-worth 公式（`deriveNetWorthAttributionFromEvidence()`）未修改、schema 未 bump 至 v4、fee／valuation 呈現邏輯不在本輪範圍、grouped transaction row UI／新頁面未新增（沿用既有 Producer 表單與交易列表元件）、PR #322（Loan audit）未處理、未拆分為 F2D-1／F2D-2（審計 GO A 判定成立，實作過程未發現需要拆分的可重現架構 blocker）。
- 下一直接起點：已於後續 PR #329 正式 Merge／Production Verified（merge commit `6ad9f5802165f0d1b78b4dd13a151584afcbf00f`，parents `e27860db566c47a3d6c57716d79712a325ac8336`／`6363b7da97f823ce3e45e087263c498ab9c0234e`，一般 merge commit，未使用 admin override；Deploy GitHub Pages run `31786367407` success）。UR-TODO-046 Final Audit 已接續完成並正式判定 CLOSED（詳見上方最新交接快照）。

---

## 歷史交接快照：UR-TODO-046 FX-F2C-3 Preview Producer Enable（已完成／Merge／Production Verified，2026-08-14）

- 任務背景：FX-F2C-2（PR #327，merge commit `b83b991e1bf79707c17ed7adc12b274b79f259b5`）已正式 Merge／Production Verified；Production／Preview Producer capability 皆確認為 OFF（`FX_OPAQUE_PRODUCER_SOURCE_GATE = false`）。本 Sprint 是 ADR-010／ADR-013 既有設計中明確保留、需另行明確授權的「翻轉 source gate」決策，使用者已明確授權：本 Sprint **唯一** production code 改動是把 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 從 `false` 改為 `true`，`deriveFxOpaqueProducerCapability(sourceGateEnabled, deploymentEnvironment)` 的 AND 邏輯本身**逐字未動**——因為該邏輯早已把 Production 排除在外（`&& deploymentEnvironment === 'preview'`），此次翻轉的結果是 Preview capability 變為 ON、Production capability 依既有 contract 繼續恆為 OFF，不需要修改任何判斷式。
- 核心設計：僅修改 `src/lib/fxOpaqueProducerGate.ts` 一行常數與相鄰註解；未觸碰 `deriveFxOpaqueProducerCapability()`、`isFxOpaqueProducerEnabled()` 函式本體，未觸碰 `buildFxConversionCreation()`／`buildFxConversionDeletion()`／`FxConversionProducerForm.tsx`／`App.tsx` 的既有 producer wiring（三者皆以既有呼叫方式原樣保留，僅因常數值改變而在 runtime 呈現不同 capability 結果）。測試面更新既有兩個因常數字面值變動而過時的斷言（`tests/fxOpaqueProducerGate.test.ts` 舊「Preview 現為 OFF」與「opt-in false by default」兩項改為對應「Preview 現為 ON」與「gate 已明確翻轉為 true」；`tests/fxConversionIdentityRegression.test.ts` 舊兩項「gate 常數維持 false」歷史斷言，一項因與既有測試重複而移除、另一項改寫為驗證 App.tsx 既有 producer wiring 呼叫點本身未被本 Sprint 觸碰），並新增 3 項 F2C-3 專屬鎖定測試（Preview capability ON、Production capability 仍 OFF、AND-logic 契約本身逐字未變）。淨新增測試數：+2（975→1014→**1016**，扣除 1 項移除的重複測試）。
- 本地建置層級 runtime 驗證（隔離環境，非 GitHub Pages）：以 `npm run build`（Production）與 `npm run build:preview`（Preview）分別產出 `dist/`／`dist-preview/`，用本機 HTTP server 依既有 GitHub Pages 子路徑結構（`/family-universal-rebalance/`、`/family-universal-rebalance/preview/`）掛載後，以 headless Chromium 實際操作：Production 展開「交易基礎」區塊後 Manual FX Producer 表單**完全不出現**（`支出帳戶`／`存入帳戶` 等欄位文字皆不存在於頁面）；Preview 同一操作下表單**完整可見且可操作**。在本機 Preview build 上完整走過 TWD→USD 與 USD→TWD 雙方向建立（新增一個 USD 帳戶後）：建立成功、household 收支統計顯示仍為「收入 0 元｜支出 0 元」（cash-flow 排除確認生效）、交易列表正確顯示三列（來源腿、目的腿、opaque envelope placeholder）；快速連續點擊「建立換匯記錄」兩次僅建立一組換匯（double-submit guard 生效）；嘗試單獨刪除其中一腿被 `window.alert()` 正確攔截（文案「此交易屬於一筆換匯記錄，不能單獨刪除。請先處理完整換匯記錄。」）；刪除 opaque envelope 觸發正確的 atomic 刪除確認文案並一次移除全部三筆記錄；reload 頁面後記錄仍存在（localStorage persistence）；匯出 JSON Backup 後於**另一個獨立瀏覽器 profile**（模擬另一裝置）匯入，還原後三筆記錄與 `fxConversionLeg` linkage 完整、F2B resolver 對還原後資料仍回傳 `valid`（以 ordinary-delete guard 仍正確攔截作為驗證）；390px viewport 下 Producer 表單完整顯示、`document.documentElement.scrollWidth === clientWidth`（無水平溢出）。**此為本機隔離 build 驗證，非正式 GitHub Pages Preview 部署**——正式 `workflow_dispatch` Preview 部署與該環境下的最終使用者驗收仍待 Draft PR 建立後另行執行。
- 明確不包含：Production Producer enable、移除 `deploymentEnvironment === 'preview'` guard、`fxConversionAttribution`、`FinancialEvent` FX 接線、reconciliation `candidate`／`matched`、zero-effect attribution、grouped transaction row、新 transaction type、`transfer` 語意修改、CSV／Import Center、JPY／EUR、persistence architecture 修改、schema migration、Loan／Investment／Generic Split／Household Liquidity 公式／AI Decision／Rebalance／Firebase／Worker 修改、PR #322。
- 下一直接起點：**已於後續 PR #328 正式 Merge／Production Verified**（merge commit `e27860db566c47a3d6c57716d79712a325ac8336`）。FX-F2D Attribution Integration（`fxConversionAttribution`／`FinancialEvent` FX 接線）已接續完成（詳見上方最新交接快照）。UR-TODO-046 整體仍 OPEN；PR #322（Loan audit）為獨立 Draft／OPEN，仍未處理。

---

## 歷史交接快照：UR-TODO-046 FX-F2C-2 Manual FX Conversion Producer（已完成／Merge／Production Verified，2026-08-14）

- 任務背景：FX-F2C-1（PR #326，merge commit `44fb3afb126b1d647e2b90caa2d6da6a88f9493b`）已 Merge／Production Verified，Production／Preview 皆確認 gate OFF。本 Sprint 建立第一版 Manual FX Conversion Producer 程式碼，但**不啟用正式 capability**——`FX_OPAQUE_PRODUCER_SOURCE_GATE` 全程維持 `false`，未觸碰。
- 核心設計：新增 `src/lib/fxConversionProducer.ts` 兩個純函式。`buildFxConversionCreation(input, context)`：依序執行 gate check（`context.gateEnabled` 由呼叫端解析，模組本身不 import gate）→ 帳戶驗證（存在、啟用、不相同）→ 幣別驗證（恰好一個 TWD＋一個 USD）→ 金額驗證（皆需 > 0）→ `effectiveDate` 驗證（`isCanonicalCalendarDay()`）→ fee 驗證（`explicit` 型別若 `feeTransactionId` 找不到既有交易，直接拒絕整筆建立，不持久化「已知壞掉的 fee link」）→ identity 建立（`createTransactionId()` 依序產生 `sourceTransactionId`／`destinationTransactionId`／`conversionId`，皆在 submit 當下、非 draft 開啟時，驗證失敗或取消不留下任何 state）→ 兩腿建構（重用既有 `updateTransaction()`／`normalizeCandidate()` 正規化管線，與 App.tsx 既有 `createTransaction` handler 相同模式，確保與 `normalizeState()` round-trip 天然一致）→ F2B `resolveFxConversionEnvelope()` 對完整三件組再次驗證（belt-and-suspenders）→ 跨 envelope duplicate 偵測（`resolveFxConversions()`）。全部通過才回傳 `{ status: 'success', sourceLeg, destinationLeg, envelope, conversionId }`，任何一步失敗回傳對應 `invalid`／`unsupported`／`duplicate`／`gate-blocked` 結果，**不呼叫 `setState`、不寫 localStorage、不操作 DOM、不 fetch、不讀 CBC reference rate**。`buildFxConversionDeletion(envelope, transactions)`：只有 `resolveFxConversionEnvelope()` 回傳 `valid` 的 envelope 才視為「active」換匯（與 F2C-1 `findLinkedFxConversionId()` 用同一定義），回傳 atomic 刪除計畫（`sourceTransactionId`／`destinationTransactionId`／`conversionId`）；非 FX payload 或無法 valid-resolve 一律回傳「非 active」，交由既有 generic opaque delete 處理。
- 新增 `src/components/fx/FxConversionProducerForm.tsx`：第一版表單欄位為支出帳戶／金額、存入帳戶／金額（帳戶選擇即決定幣別，無獨立 currency selector，選單只列出啟用的 TWD／USD 帳戶）、單一 `effectiveDate`（同時作為 conversion payload 與兩腿 `occurredAt`，本輪未處理跨日兩腿）、fee 四態選單（`unknown` 為預設值，`explicit` 僅能連結既有交易、不可在此表單同時建立新 fee transaction）、`note`（沿用既有慣例）、derived rate 唯讀顯示（`deriveFxConversionExecutedRate()`，不可編輯、不持久化、不使用 CBC reference-close 代替）。`enabled` prop 是雙層 gate中的 UI 層——`false` 時整個元件回傳 `null`，完全不渲染任何 DOM。
- **開發中發現並修正一個真實 bug（雙重送出防護）**：一開始用 `useRef` 在 `submit()` 的 `try/finally` 內同步設置與釋放 guard，測試發現這**完全無法防止真實雙擊**——因為 `onSubmit`／`setState` 全為同步操作，`submit()` 整個函式（含 `finally` 釋放）在第一次點擊事件處理完畢時就已經跑完，等第二次點擊事件被瀏覽器處理時，guard 早已被釋放。已修正為 guard 的釋放延後到 `queueMicrotask()`：同一輪同步事件（例如兩次緊接的 `dispatchEvent('click')`）內，microtask 尚未執行，guard 仍鎖住，第二次點擊被正確擋下；跨兩個獨立的使用者互動（中間有 microtask queue 清空的機會，例如兩個分開的 `await act()` 區塊）guard 會正確釋放，允許使用者送出下一筆全新的換匯記錄。新增真實 jsdom DOM click 回歸測試鎖定修正前失敗、修正後通過。
- App.tsx 新增 `createFxConversion(input)` handler：讀取 `stateRef.current`，呼叫 `buildFxConversionCreation()`，`gateEnabled` 傳入 `isFxOpaqueProducerEnabled(DEPLOYMENT_ENVIRONMENT)` 的當下解析結果（`DEPLOYMENT_ENVIRONMENT` 為既有 `constants/appInfo.ts` 已解析常數，App.tsx 先前已 import，本輪未新增判斷邏輯），成功時執行**單一** `setState()` 同時 append 兩腿與 envelope；失敗時直接回傳結果、不變更任何 state。既有 `deleteOpaqueTransaction()` 新增路由邏輯：先呼叫 `buildFxConversionDeletion()`，若 `status: 'success'`（active FX conversion）則走新的 atomic 分支——單一 `window.confirm()`（文案：「將一併刪除此換匯記錄及其兩筆關聯交易，無法復原，除非另有備份。」）通過後，**單一** `setState()` 同時移除 envelope 與兩腿；否則（非 FX payload、或無法 valid-resolve）**完全維持 F1A 既有 generic opaque delete 行為不變**（同一顆確認訊息、同一段程式碼路徑）。既有 `deleteTransaction`（F2C-1 linkage guard）完全未修改，被 active FX conversion 引用的交易仍不可單獨刪除，Producer 上線後仍以同一 `findLinkedFxConversionId()` 定義為準。
- `TransactionList` 本身**未修改**——第一版換匯建立成功後會如實顯示為 2 筆一般交易列（來源支出、目的存入）＋1 筆既有 opaque placeholder 列（共 3 列，未做 grouped row，符合本輪明確範圍；opaque placeholder 未被隱藏，兩腿也未被隱藏，未違反 F1A 既有 contract）。
- **開發中的必要連帶修改**：(1) F2C-1 既有「`App.tsx` 對 `fxConversionIdentity.ts` 僅允許 `findLinkedFxConversionId` 一個呼叫點」的 regression test 已更新為「允許 `buildFxConversionCreation`／`buildFxConversionDeletion`／`isFxOpaqueProducerEnabled` 存在，但仍不得直接建構 raw FX payload 字面量或直接呼叫 F2B 底層 parser/resolver」，反映 F2C-2 明確授權 producer 存在的事實；(2) F1A 既有 R12 opaque delete confirm 測試原本用「找第一個 `};`」的方式擷取 `deleteOpaqueTransaction` handler 原始碼做斷言，因新 handler 內含巢狀 `if` 區塊、提前出現非函式結尾的 `};`（一個物件字面量），會把 handler 截斷到只剩前幾行，讀不到後面的 `window.confirm()` 與 `不可復原`／`永久移除` 文案，已修正為括號配對（brace-depth）擷取法，並拆分為「既有 generic 分支仍需 confirm」與「新 atomic FX 分支使用正確文案」兩項獨立斷言。
- 驗證：新增 44 個測試——`tests/fxConversionProducer.test.ts` 30 項（builder 全部驗證分支：valid TWD→USD／USD→TWD、conversionId／`effectiveDate` 一致性、derived rate 正確且不持久化、same-currency／unsupported-currency／same-account／inactive-account／zero-amount／malformed-date／gate-blocked／duplicate 全部拒絕情境；atomic create 三件組同時建立、失敗零殘留、builder 不 mutate context；fee 四態含 explicit 有效／無效；consumer regression：account balance／cash-flow／reconciliation 三項透過 producer 產出的真實記錄驗證；atomic delete plan 三種情境；re-normalization safety／refresh／JSON Backup round-trip 三項，皆確認 F2B resolver 對 round-trip 後資料仍回傳 `valid`）；`tests/fxConversionProducerForm.test.ts` 7 項（gate OFF 完全不渲染／gate ON 正常渲染、帳戶選單僅列啟用 TWD／USD 帳戶且無獨立 currency selector、fee 預設 `unknown`、derived rate 無任何可編輯欄位、真實 DOM 雙擊防護＋成功後 guard 正確釋放兩項）；`tests/fxConversionIdentityRegression.test.ts` ＋2；`tests/transactionOpaquePlaceholderUi.test.ts` R12 confirm 測試修正＋拆分（原 1 項→2 項＋新增 1 項）。`npm run test:ci` 由 975 增至 **1014 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。
- **已於隔離本機 Preview-deploy dev server 實機驗證**（`npm run dev --mode preview-deploy`，未修改任何 gate 常數）：展開首頁「交易基礎」collapsible 區塊後，畫面僅顯示既有一般交易表單與 Import Center，`document.querySelector('.fx-conversion-producer-form')` 為 `null`、頁面文字不含「建立換匯記錄」，確認 gate OFF 時 Manual FX Producer 表單於真實 runtime 完全不出現（非僅單元測試層級的驗證）。Production／Preview 兩份 build bundle 因 producer 現為真正 runtime 呼叫路徑（`isFxOpaqueProducerEnabled()` 判斷發生在 runtime，非 Vite 可 tree-shake 的 build-time 常數），**確認皆含** `fxConversionLeg`／`buildFxConversionCreation`／「建立換匯記錄」等相關字串／程式碼（bundle size 由約 748KB 增至約 758KB，與零 caller 時代的 F1D／F2B 不同，此為預期行為，非缺陷）；但 gate 常數本身於 `fxOpaqueProducerGate.ts` 原始碼與兩份 bundle 中確認仍為 `false`。
- 明確不包含：F1D gate 開啟、Preview enable、Production enable、`fxConversionAttribution`、`FinancialEvent` FX 接線、reconciliation `candidate`／`matched`、zero-effect attribution、JPY/EUR 等其他貨幣對、CSV／Import Center FX 支援、grouped transaction list UI、新 transaction type、`transfer` 語意修改、schema migration、persistence architecture 修改、Investment／Loan／Generic Split 修改、AI Decision／Rebalance、Firebase／Worker、PR #322。
- 下一直接起點：**已於後續 PR #327 正式 Merge／Production Verified**（merge commit `b83b991e1bf79707c17ed7adc12b274b79f259b5`，正常 merge commit，未使用 admin override；Deploy GitHub Pages run `31754065390` success，head 與 merge commit 一致）；FX-F2C-3（Preview Producer Enable，翻轉 source gate）已接續完成（詳見上方最新交接快照）。UR-TODO-046 整體仍 OPEN；PR #322（Loan audit）為獨立 Draft／OPEN，仍未處理。

---

## 歷史交接快照：UR-TODO-046 FX-F2C-1 Minimal Consumer Guard（已完成／Merge／Production Verified，2026-08-13）

- 任務背景：FX-F2B（PR #325，merge commit `18c2b47cb91d8fc1aaeddb3e682962f97d908867`）已 Merge／Production Verified。FX-F2C（Manual FX Conversion Producer Contract Review，Review Mode）完整盤點交易建立 pipeline、帳戶餘額／收支／Household Liquidity consumer、F1A／F1D／F2B 既有模組與刪除契約，用具體程式碼路徑證實：現有 `TransactionType`（`income`／`expense`／`transfer`／`adjustment`）沒有一個能乾淨承載 FX conversion 兩腿語意——`adjustment` 恆為加無法表示扣款，`transfer` 明確拒絕跨幣別（`validateTransferAccounts()`）且為單一記錄模型；若暫用 `expense`（source）／`income`（destination），`deriveTransactionAccountBalances()` 給出正確帳戶餘額方向，但 `transactionCashFlowSummary()` 會把兩腿原始金額誤算成 household expense／income（無幣別換算），且 `transactionReconciliation.ts` 的 `fx-attribution-unsupported` fail-safe 只依 `currency !== 'TWD'` 判斷，TWD leg 會**通過**此檢查、被靜默分類為普通 `external-expense`，污染淨值成長歸因計算。判定 **GO C — Producer 不得先裸上線，須與 Minimal Consumer Guard 同 Sprint**。使用者拍板：additive FX leg metadata，不新增第五種 type、不重定義 `transfer`；本 Sprint（FX-F2C-1）只建立最小 consumer safety boundary。
- 核心設計：`src/lib/transactions.ts` 新增 additive 型別 `FxConversionLegAttribution`（`{ conversionId: string; role: 'source' | 'destination' }`，刻意不存 `amount`／`currency`／`accountId`／`executedRate`／`fee`，避免形成第二套 SSOT）與 `FinancialTransaction.fxConversionLeg?`，比照既有 `investmentAttribution`／`loanAttribution` 慣例新增 pure `normalizeFxConversionLegAttribution()`（malformed metadata 整個欄位丟棄為 `undefined`，不變成 opaque、不影響交易其餘欄位正規化），經 `normalizeCandidate()` 走既有 closed-whitelist 加法式保留路徑；`TRANSACTION_SCHEMA_VERSION` 維持 `2` 不變——實證確認 F1A opaque compatibility contract 已足夠涵蓋此加法式欄位，不需要 bump。`transactionCashFlowSummary()` 新增 `!t.fxConversionLeg` 排除條件（比照既有 `transfer` 零效果慣例，不論 `type` 為 `expense` 或 `income` 皆排除）；`deriveTransactionAccountBalances()` **完全未修改**。`transactionReconciliation.ts` 在每筆交易分類最前面新增 unconditional guard：只要 `transaction.fxConversionLeg` 存在即直接回傳 `unsupported`／`fx-attribution-unsupported`，判斷純以 metadata 是否存在為準（不依 `currency === 'TWD'` 等間接條件），TWD／USD source／destination 四組合對稱一致，永不變 `candidate`／`matched`／`duplicate`，永不產生 `external-income`／`external-expense`／derived evidence。`src/lib/fxConversionIdentity.ts` 新增純函式 `findLinkedFxConversionId()`，重用既有 `resolveFxConversionEnvelope()`，只有 `valid`-resolved 的 opaque envelope 才視為「active」換匯（malformed payload、缺 linked transaction、金額／幣別 cross-validation 失敗的 envelope 皆不構成阻擋，延續 F1A Preserve≠Interpret 原則），供 `App.tsx` 既有 `deleteTransaction` handler 呼叫：交易若被 active FX conversion envelope 引用則不刪除、`window.alert()` 提示「此交易屬於一筆換匯記錄，不能單獨刪除。請先處理完整換匯記錄。」，未被引用的一般交易刪除行為完全不變。
- **開發中的一項必要連帶修改**：因為此 delete guard 是本輪唯一授權的 `App.tsx`→`fxConversionIdentity.ts` 呼叫點，F2B 既有「`App.tsx` 對此模組零 caller」的 regression test（`tests/fxConversionIdentityRegression.test.ts` 原本斷言 `doesNotMatch(app, /fxConversionIdentity|.../)`）已同步更新為「僅允許 `findLinkedFxConversionId` 這一個呼叫點，其餘 producer／write path 符號（`FxConversionOpaquePayload`／`createFxConversion`／`resolveFxConversionEnvelope`／`resolveFxConversions(`／`parseFxConversionPayloadV1`／`deriveFxConversionExecutedRate`／`isFxConversionPayloadCandidate`）仍必須為零」。這是本輪對既有 F2B 測試的唯一修改，理由是 F2C-1 明確授權這一個特定、唯讀的 consumer guard 呼叫點，不影響「無 producer／write path」的核心不變量。
- `deleteOpaqueTransaction()` 本身**本輪未修改**——atomic FX delete（一次刪除 opaque envelope＋兩腿）留給 F2C-2 Producer Sprint 與完整 FX UI 一起落地，本輪只確保「腿不會被單獨刪掉留下孤兒」。F1D gate（`FX_OPAQUE_PRODUCER_SOURCE_GATE = false`）本輪完全未觸碰。
- 驗證：新增 16 個測試——`tests/transactions.test.ts` ＋4（normalization 保留有效 metadata／丟棄 malformed／round-trip／second-pass normalization 保留；account balance regression；cash-flow exclusion 四情境）；`tests/transactionReconciliation.test.ts` ＋6（TWD／USD source／destination 四組合對稱 fail-safe、never external-income/expense 即使有 matching ledger event、ordinary transaction 不受影響）；新檔 `tests/fxConversionLegDeleteGuard.test.ts` 6 項（linked source／destination 不可單獨刪除、unrelated transaction 可正常刪除、malformed payload 不誤擋、missing-linked envelope 不觸發 silent repair、invalid-resolved envelope 不視為 active）。`npm run test:ci` 由 959 增至 **975 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；Production／Preview 兩份 build bundle 皆確認**不含**任何 producer 相關字串（`fxOpaqueProducerGate`／`buildFxConversionCreation`／`createFxConversion`），F1D gate 常數確認未被修改；`fxConversionLeg`／`findLinkedFxConversionId` 因已是真正 production 呼叫路徑（非零 caller），確認**有**編入兩份 bundle（預期行為）。
- 明確不包含：`buildFxConversionCreation()`、Manual FX 表單、producer UI、opaque write path、F1D gate 開啟、atomic FX delete（`deleteOpaqueTransaction()` 一併刪兩腿）、fee UX、double-submit guard、Preview producer、`fxConversionAttribution`、`FinancialEvent` FX 接線、runtime zero-effect attribution、schema migration、persistence architecture 修改、Household Liquidity 公式修改、AI Decision／Rebalance、Firebase／Worker。
- 下一直接起點：**F2C-1 只是最小 consumer safety boundary，不代表 FX attribution 或 producer 已被授權**。已於後續 PR #326 正式 Merge／Production Verified（merge commit `44fb3afb126b1d647e2b90caa2d6da6a88f9493b`，正常 merge commit，未使用 admin override；Deploy GitHub Pages run `31718745963` success；Production／Preview HTTP 200，assets 各自獨立）；FX-F2C-2（Manual FX Conversion Producer）已接續完成（詳見上方最新交接快照）。UR-TODO-046 整體仍 OPEN；PR #322（Loan audit）為獨立 Draft／OPEN，仍未處理。

---

## 歷史交接快照：UR-TODO-046 FX-F2B Pairing Identity Contract Foundation（開發完成／Draft PR 待架構審查，2026-08-13）

- 任務背景：FX-F1D（PR #324，merge commit `0b3522f`）已 Merge／Production Verified，Production／Preview gate 皆確認 OFF。FX-F2A（Repository Audit，Review Mode）逐一盤點現有 FX Foundation（FX-A1/A2/A3），確認其只能證明「單一外幣現金帳戶單一時點的 TWD 估值」，完全無法證明「兩筆交易共同構成一次換匯」；判定 **GO B — Attribution Runtime Ready, Producer Identity Missing**（既有 `internal-transfer` zero-effect 契約、`transactionReconciliation.ts` 既有 `fx-attribution-unsupported` fail-safe、Investment/Loan 的 denormalized-copy-with-cross-validation 模式已足夠作為未來 attribution 語意模板，真正缺口是 pairing identity）。FX-F2B（Review Mode）進一步逐一比較 Investment（`tradeId`）、Loan（`paymentId`／`componentId`／`confirmationGroupId`）、Generic Split（`allocationGroupId`／`componentId`／`replacementOfGroupId`）、`FinancialEvent`（`voidedEventId`）四種既有 identity pattern，設計並拍板一組完整 pairing identity contract，本輪 FX-F2B 依此落地。
- 核心設計：新增 `src/lib/fxConversionIdentity.ts`。**Conversion identity ＝ `OpaqueFinancialTransactionEnvelope.id`**（payload 內不另存 `conversionId`，避免重複 identity，`isFxConversionPayloadCandidate()` 判斷 payload 是否宣稱是 FX conversion，`parseFxConversionPayloadV1()` 驗證 payload shape，兩者與 F1A envelope 驗證明確分層——一個 valid opaque envelope 可以搭配一個 invalid FX payload，F1A 仍 lossless preserve，F2B resolver 只是對經濟語意判定 `invalid`／`unsupported`）。**Leg identity 直接使用既有 `FinancialTransaction.id`**（`sourceTransactionId`／`destinationTransactionId`，未新增 `legId`）。第一版嚴格限定 **TWD↔USD**（`deriveFxConversionExecutedRate()` 支援雙方向，未泛化到其他貨幣對或 foreign↔foreign，未讀取 `fxValuation.ts`／`cbcFxProvider.ts`，未 fetch）。`sourceCurrency`／`destinationCurrency`／`sourceAmount`／`destinationAmount` 為 payload 內 pinned validation copy（比照既有 Investment/Loan `settlementAmount !== transaction.amount → undefined` 的交叉驗證慣例）；`accountId` 不存於 payload，一律從 linked transaction resolve。**Executed rate 為 deterministic derived 值，`resolveFxConversionEnvelope()` 內每次即時計算，從未寫入任何持久化結構**，canonical unit 固定 `TWD per USD`（`twdAmount / usdAmount`，不論方向），CBC reference-close rate 完全獨立、不作為 executed rate SSOT。**Fee 採四態 contract**（`resolveFxConversionFeeTreatment()` 回傳 `none`／`included`／`unknown`／`explicit-resolved`／`explicit-unresolved` 五種狀態，對應四種宣告加一種解析結果），missing fee evidence（`feeTreatment` 欄位格式錯誤）在 parse 階段即被拒絕為 `malformed-payload`，永不預設為 `none`；`explicit` 型別的 `feeTransactionId` 找不到對應交易時，只讓 fee 本身的 resolution 退化為 `explicit-unresolved`，**principal conversion 仍可為 `valid`**（`resolveFxConversionEnvelope()` 明確不因 fee 解析失敗而讓整筆換匯失效）。`resolveFxConversionEnvelope()`（單筆）／`resolveFxConversions()`（跨筆，含 duplicate detection——只用 `sourceTransactionId`／`destinationTransactionId` 的 claim 衝突判斷 `duplicate`，不依日期／金額接近／memo／帳戶名稱／機構／list adjacency）完成整條 identity→currency→amount→fee→executed rate 的驗證管線。Raw conversion 定義為 immutable，未建立 `replacementOfConversionId`（修正模式留給未來 delete+recreate，非本輪範圍）；linked transaction 缺失時 resolver 回 `unsupported`，不 throw、不自動修復、不自動刪除 opaque envelope。
- **開發中依 Review 結論精確落地兩項關鍵修正**：(1) `executedRate` 完全不出現在任何持久化 payload 型別或欄位中，只作為 `resolveFxConversionEnvelope()` 回傳的 runtime resolution 結果欄位（`FxConversionResolution.status==='valid'` 才有 `executedRate`），避免與兩腿金額形成三個互相競爭的 authoritative facts；(2) fee 四態明確區分「使用者主動宣告無 fee」（`none`）與「未宣告」（`unknown`），`unknown`／`included` 的 resolution 物件皆不含任何金額欄位（測試已斷言 `!('feeAmount' in result)`），確保 missing fee evidence 永不被下游誤讀為 `fee=0`。
- 驗證：新增 44 個測試（`tests/fxConversionIdentity.test.ts` 34 項＋`tests/fxConversionIdentityRegression.test.ts` 10 項），涵蓋 valid TWD→USD／USD→TWD、identity duplicate（同一 transaction 被兩個 conversion claim、同一 pair 不同 envelope id）、same-source-destination、missing linked transaction、currency mismatch／same-currency／unsupported currency（JPY）、amount mismatch／zero／negative、fee 四態全覆蓋（含 malformed explicit fee 不拖垮 principal、unknown／included 永不推導金額）、reference rate 從未被用作 executed rate（regression 鎖定不 import `fxValuation.ts`／`cbcFxProvider.ts`）、F1A opaque preservation round-trip（含 valid 與 malformed FX payload 皆被 F1A lossless preserve）、reconciliation／`FinancialEvent`／F1D gate 三項本 Sprint 未修改的 regression（`grep` 鎖定 `transactionReconciliation.ts`／`financialEvents.ts`／`fxOpaqueProducerGate.ts` 皆不 import `fxConversionIdentity`，`App.tsx` 不含任何 FX conversion producer 相關字串）。`npx tsc -b`、`npm run test:ci`（915→**959 tests pass／0 fail**）、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；Production／Preview bundle 皆確認**不含**任何 `fxConversionIdentity`／`FxConversionOpaquePayload`／`fx-conversion` 相關字串（`fxConversionIdentity.ts` 在 `App.tsx` 零 caller，Vite tree-shaking 天然排除於兩個 bundle 之外）。**未新增**：`tests/transactionOpaqueCompatibility.test.ts`／`tests/transactionOpaquePlaceholderUi.test.ts` 之外的 wiring 修正（該項已於 F1D Sprint 完成，本輪未重複處理）。
- 明確不包含：第一個 opaque FX producer、FX producer UI、manual FX 表單、`fxConversionAttribution`、`FinancialEvent` 接線（type／linkage／void／replacement 皆未實作）、reconciliation 修改（`transactionReconciliation.ts` 完全未觸碰，非 TWD 仍一律 `fx-attribution-unsupported`）、runtime attribution composition 修改、Generic Split／Investment／Loan／Household Liquidity／AI Decision／Rebalance 修改、schema／persistence 修改（`TRANSACTION_SCHEMA_VERSION` 未 bump，`writeState()`／`normalizeState()` 未觸碰）、非 TWD/USD 貨幣對、CSV／Import Center FX 支援、F1D gate 開啟（`FX_OPAQUE_PRODUCER_SOURCE_GATE` 仍為 `false`，本輪未觸碰該檔案）。
- 下一直接起點：**F2B 只是 identity 分類基礎，不代表已解決任何 attribution 或 producer 授權問題**。`effectiveDate` 的精確來源公式與 fee `none`／`included` 兩態在 UI 上如何「明確宣告」，仍待未來 Producer Sprint 產品決策。依 FX-F2A／FX-F2B 建議，下一步應嚴格區分為獨立的 **Foundation**（本輪已完成）／**Producer**／**Attribution** 三個 Sprint，不得合併。已於後續 PR #325 正式 Merge／Production Verified（merge commit `18c2b47cb91d8fc1aaeddb3e682962f97d908867`，正常 merge commit，未使用 admin override）；FX-F2C（Manual FX Conversion Producer Contract Review）與 FX-F2C-1（Minimal Consumer Guard）已接續完成（詳見上方最新交接快照）。UR-TODO-046 整體仍 OPEN；PR #322（Loan audit）為獨立 Draft／OPEN，仍未處理。

---

## 歷史交接快照：UR-TODO-046 FX-F1D Controlled Producer Feature Gate Foundation（已完成／Merge／Production Verified，2026-08-13）

- 任務背景：FX-F1A（PR #323，merge commit `0c52670`）已 Merge／Production Verified；FX-F1B Consumer Guard Audit（Review Mode）逐一核對 account balance、cash-flow、reconciliation、runtime derived evidence、runtime attribution composition、Investment、Loan、Generic Split、Household Liquidity 等 consumer，確認全數以 `readonly FinancialTransaction[]` 型別簽章隔離，opaque 在編譯期即無法傳入；判定 **NO-GO C — Producer Rollout Blocked**：真正 blocker 不是 consumer，而是 pre-F1A／stale tab client 會在 boot-time hydration write 或任何後續 `writeState()` 靜默摧毀未知的 opaque 記錄（已用 `git show` 直接比對 pre-F1A 版 `normalizeTransactions()`／`readStateWithSnapshotView()` 原始碼證實此路徑，非推測）。FX-F1C（Review Mode）進一步逐一評估 Minimum Reader Version Gate、Producer Capability Version、Build/Stale-Tab Detection 三案，證實**任何 persistence-layer 相容性設計都無法 retroactively 保護已部署、不會再更新的 client**（SPA 架構性限制：保護機制＝新程式碼，舊 client＝沒有新程式碼，兩者邏輯互斥），列為正式 architecture constraint；就 retroactive protection 而言判定 NO-GO，改建議 Controlled Rollout Policy（narrow feature gate＋人工 rollout SOP 降低風險，非 absolute guarantee），明確建議不建立 general persistence concurrency guard。本輪 FX-F1D 依此建議落地為 gate 骨架本身。
- 核心設計：新增 `src/lib/fxOpaqueProducerGate.ts`。`deriveFxOpaqueProducerCapability(sourceGateEnabled, deploymentEnvironment)` 為長期可重用的純函式 contract（`sourceGateEnabled && deploymentEnvironment === 'preview'`），設計為未來解鎖時**不需要刪除或重寫**，只需調整呼叫端傳入的值。`isFxOpaqueProducerEnabled()` 為目前唯一正式入口，讀取 hardcoded `FX_OPAQUE_PRODUCER_SOURCE_GATE = false`（本 Sprint 維持 `false`；未來若要開放，即使僅限 Preview，也必須是獨立 PR 的明確 code diff，不得從 env／localStorage／AppState 推導）。第二層重用既有 `environmentBoundary.ts`／`environmentIdentity()`，未新增第二套環境判斷邏輯；無效環境值仍由既有機制 fail closed（App 無法啟動）。**未新增任何 Vite env**（`.env.production`／`.env.preview-deploy`／`scripts/environment-boundary-check.mjs` 皆未修改——本次 gate 完全是 source constant，不需要 build-time env 變數即可成立 Production／Preview 兩層 contract）。目前**沒有任何 production 呼叫端**使用此 gate（本 Sprint 明確不建立 FX producer、不實作 `fxConversionAttribution`），Vite tree-shaking 因此天然把整個模組排除於 Production／Preview 兩個 bundle 之外——已用 `grep` 逐一核對兩份部署產物皆不含 `fxOpaqueProducerGate` 相關字串，這是比「bundle 內含但顯示已停用」更強的 Production OFF 證據。
- **開發中發現並修正一個與 F1D 本身無關、但必須一併處理的既有缺口**：`tests/transactionOpaqueCompatibility.test.ts`／`tests/transactionOpaquePlaceholderUi.test.ts`（FX-F1A 既有 17 個測試）自 PR #323 Merge 以來從未被 `npm run test:ci` 實際執行——這兩個檔案只存在於 `test:transactions` 這個獨立 npm script（不在 `test:ci` 呼叫鏈內），`test:ci:unit-ts` 從未列出這兩個檔名。已將兩檔補入 `test:ci:unit-ts`；修正前 `npm run test:ci` 為 889 tests pass，修正＋新增 F1D 測試後為 **915 tests pass（0 fail）**。
- 驗證：新增 9 個測試（`tests/fxOpaqueProducerGate.test.ts`）鎖定：Production 在任何 source gate 值下永遠 OFF（含 exhaustive 測試）、Preview 需 source gate 同時為 true 才有 capability、目前 phase 下 Preview 與 Production 皆為 OFF、gate 為 deterministic pure function、gate 不重造環境判斷邏輯（靜態檢查原始碼不含自製環境字串比對）、gate 不讀 localStorage／`window.location`／`import.meta.env`／AppState、gate 與既有 opaque preservation（`transactions.ts`）零耦合（靜態檢查不 import `transactions.ts`、不呼叫 `normalizeTransactions()`／`serializeTransactionCollection()`）、producer capability 預設為 opt-in（`false`）非 opt-out。`npx tsc -b`、`npm run test:ci`（915 pass／0 fail）、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。
- UI／Consumer 零變更：本 Sprint 未修改任何 UI、未修改任何既有 consumer（account balance／cash-flow／reconciliation／runtime derived evidence／Loan／Investment／Generic Split／FinancialEvent），F1B 已確認的隔離行為不受影響；F1A 既有 opaque preservation（三分法、`serializeTransactionCollection()`、boot-time re-normalization、JSON Backup round-trip、placeholder UI）完全未觸碰，僅重新確認既有 17 個測試（現已正確納入 CI）持續通過。
- 明確不包含：`fxConversionAttribution`、第一個 opaque FX producer、FX producer UI、FX rate provider／valuation、Investment／Loan attribution 修改、Generic Split 修改、`FinancialEvent` schema 修改、`TRANSACTION_SCHEMA_VERSION` bump、`writeState()`／`normalizeState()` persistence contract 修改、general multi-tab concurrency guard、`storage` event、BroadcastChannel、revision token、minimum-reader-version gate、pre-F1A stale client 保護（F1C 已證實架構性不可解，F1D 不重新嘗試解決）。
- 已於後續 PR #324 正式 Merge／Production Verified（merge commit `0b3522f55425034029196e4f4e0d5f45794e74bc`，正常 merge commit，未使用 admin override）；**F1D 是 controlled-rollout risk reduction 工具，不代表已解決 legacy client retroactive protection 問題；第一個 opaque producer 仍需另行明確授權（含 adoption window、manual upgrade SOP、Backup 前置要求），不得因本 Sprint 完成或 source gate 未來被翻成 `true` 而自動視為已解鎖**。UR-TODO-046 整體仍 OPEN；下一步為 FX-F2A／FX-F2B（詳見上方最新交接快照）；PR #322（Loan audit）為獨立 Draft／OPEN，仍未處理。

---

## 歷史交接快照：UR-TODO-046 FX-F1A Transaction Opaque Compatibility Foundation（開發完成／Draft PR 待驗收，2026-08-13）

- 任務背景：先前三輪 Review Mode（FX Attribution Contract Audit → FX-F1 Transaction FX Identity Foundation Contract Design → FX-F1A Pre-Implementation Gate Audit）確認 FX attribution 現階段 NO-GO B（evidence／identity 契約不足），FX-F1（新增 `fxConversionAttribution`）本身又存在兩個 pre-implementation blocker：(1) mixed-version persistence——舊 client 的 `normalizeCandidate()` 是封閉欄位白名單重建，會靜默丟棄未知欄位；(2) income/expense taxonomy consumer blast radius——即使欄位存活，Household Liquidity／收支統計等既有 consumer 也會誤把 FX legs 當一般收支計算。本輪只處理 Gate A（persistence），建立 domain-neutral 的 opaque compatibility capability，**不產生任何 FX transaction，不實作 `fxConversionAttribution`**。
- 核心設計：`OpaqueFinancialTransactionEnvelope`（`src/lib/transactions.ts`）為明確 discriminator（`transactionOpaqueEnvelopeVersion: 1`＋`id`＋不解讀的 `payload`），與既有 `FinancialTransaction` 分開（非把 `FinancialTransaction` 改成 union）。`normalizeTransactions()` 明確三分：known valid（沿用既有行為）、explicit opaque valid（原樣保留，marker/id/payload 格式錯誤一律 skipped，不得被誤判成 opaque）、malformed（skipped）。id 的重複防線（`resolveUniqueTransactionId()`）在 known／opaque 之間共用同一個 `used` id 空間，防止兩者共用同一 id 同時 active。
- Persistence boundary：`AppState.opaqueTransactions` 是與既有 `transactions: FinancialTransaction[]` **分開的加法式必要欄位**（型別不變，既有 consumer 零 blast radius——`deriveTransactionAccountBalances`／`transactionCashFlowSummary`／Household Liquidity／reconciliation 等函式簽名完全不變，opaque 記錄在 TypeScript 型別層級就不可能被這些函式讀到）；但 localStorage／JSON Backup 的**原始 JSON 上仍只有單一 `transactions` 欄位**——`serializeTransactionCollection()`（於 `stateWithPersistedFinancialEventLedger()`／`backupPayload()`）在持久化邊界把 `transactions`＋`opaqueTransactions` 合併回同一陣列。**開發中發現並修正一個唯讀盤點階段未預見的連帶缺口**：`normalizeState()` 若只讀 `r.transactions` 而不讀 `r.opaqueTransactions`，對已經正規化過一次的 `AppState` 再次呼叫 `normalizeState()`（`writeState()`／`backupPayload()` 皆會這樣做）會讓 opaque 記錄消失——已修正為同時合併兩個可能的 raw 來源再重新正規化，避免二次正規化遺失資料。
- UI：`TransactionList`（`src/App.tsx`）新增 opaque placeholder 區塊，文案明確告知「原始資料已安全保留，但未納入財務計算」，無收入/支出徽章、無普通編輯按鈕；刪除走獨立的 `deleteOpaqueTransaction()` handler，`window.confirm()` 明確告知不可復原後才執行，比照既有危險操作慣例（帳戶刪除等）。
- 驗證：新增 17 個測試（`tests/transactionOpaqueCompatibility.test.ts` 11 項、`tests/transactionOpaquePlaceholderUi.test.ts` 6 項），`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功。**已於隔離本機 dev server 實機驗證**：opaque 交易正確顯示 placeholder（無編輯/徽章）、點擊刪除經 `window.confirm()` 攔截後正確保持未刪除（未點確認前不執行）、reload 後 localStorage 原始 JSON 確認僅有單一 `transactions` 欄位且已知與 opaque 記錄正確合併回同一陣列、已知交易的收支統計與帳戶餘額未被 opaque 記錄的（刻意誇大的）金額污染、390px 無水平溢出、console 全程無錯誤。
- 明確不包含：`fxConversionAttribution`、第一筆 FX transaction、FX identity／pairing、FX taxonomy、Household Liquidity／AI Decision／Rebalance／`FinancialEvent` Ledger／Generic Split／Investment／Loan 修改；`TRANSACTION_SCHEMA_VERSION` 未 bump（維持 `2`，因為改動本身無 runtime 版本判斷邏輯依賴它）。
- 下一直接起點：Draft PR 待使用者 Preview 驗收與明確 Merge 指示。**FX-F1B（taxonomy／consumer guard 設計）必須等本 Sprint 完成 Preview 驗收、Merge、Production 部署、Production capability 驗證後才可開始，不得與本 PR 合併同一個 Sprint。** UR-TODO-046 整體仍 OPEN；**不得自行 Merge、Ready for review 或部署 Production。**

---

## 最新交接快照：UR-TODO-046 FX-A3 Foreign Cash Producer / Snapshot Integration（已完成／Merge／Production Verified，2026-08-13）

- 正式基線：PR [#320](https://github.com/hyc640110/family-universal-rebalance/pull/320) 已正常 Merge，merge commit `46d7b25a6c0f4bf56464d9aaa4a7e6aadebd5b0e`（parents：`b9abbb0ba8bc0195a94ba255a43257689c592ed7`、`57ce13a3679d5c74141f7f477b1de6eb2c6dfb91`；`mergedAt: 2026-08-13T09:42:23Z`；`mergedBy: hyc640110`；正常 merge commit，未使用 admin override）。PR CI Verification run `31623622367` success；Merge 後 Deploy GitHub Pages run `31687807762` success（`event=push`、`branch=main`、head 與 merge commit 一致）。Production HTTP 200、`environment=production`、asset `index-BQwS4psK.js`；Preview HTTP 200、`environment=preview`、asset `index-CIIiw0Ut.js`；Production／Preview isolation 已驗證正常，assets 路徑各自獨立。
- 使用者拍板：Canonical TWD Totals Strategy = A（無法安全轉換為 TWD 的外幣帳戶必須讓相關完整 totals 標記 unavailable，不得裸加、不得靜默排除後假裝完整、不得用 stale/missing rate 猜值）；FX-A3 MVP UI Strategy = A（不新增任何 UI）。
- 根因與修正：唯讀盤點確認並修正真實 Production bug——`src/App.tsx` 的 `calculateMetrics()` 先前呼叫 `financialAccountLiquidTotal()`／`financialAccountNetWorthContribution()` 時完全不讀取 `FinancialAccount.currency`，非 TWD 帳戶（如 USD）原幣 balance 會被直接裸加進 `cash`／`totalAssets`／`netWorth`（TWD 100,000 + USD 1,000 會變成 101,000）。新增純函式 `deriveCanonicalNetWorthTotals()`（`src/lib/canonicalNetWorthTotals.ts`），完全重用 FX-A1 既有 `deriveForeignCashValuation()`／`selectUsdTwdReferenceCloseRate()`，未建立第二套 FX 邏輯。
- Unavailable propagation：`NetWorthSnapshot` 新增加法式 optional 欄位 `cashAvailable`／`totalAssetsAvailable`／`netWorthAvailable`（`src/lib/netWorthHistory.ts`）。欄位缺席（既有 legacy snapshot）一律視為 available，不回填、不重算、不改寫。liquid-type（cash/bank/eWallet）外幣帳戶無法安全估值時 `cashAvailable=false`；任一帳戶（含非 liquid type）無法估值時 `accountNetWorth`（驅動 `totalAssets`／`netWorth`）unavailable。
- Snapshot pinning：`App.tsx` 於 snapshot 建立收斂點（`calculateMetrics()` 之後、`netWorthSnapshotFromTotals()` 之前）把 producer 的 pinned `fxValuations` 與三個 availability 欄位傳入——先前呼叫端從未傳入 `fxValuations` 參數，FX-A1 該欄位至此才第一次被實際點亮。Pin 時點固定在 snapshot 建立當下；沿用 FX-A1 既有 fail-safe，rate revision／provider revision 不改寫已 pinned 的歷史 snapshot。
- 明確不包含：任何新 UI；FX-A2 startup／render auto-fetch（新增 `tests/fxA3NoAutoFetchRegression.test.ts` 鎖定 `App.tsx` 不 import `cbcFxProvider`）；Household Liquidity（`householdLiquidityInputAdapter.ts` 完全未修改，non-TWD 帳戶維持既有 `unavailable` fail-safe）；FX attribution（`netWorthAttribution.ts`／`runtimeAttributionComposition.ts` 完全未修改——唯讀盤點確認兩者只被動讀取 `snapshot.netWorth`／`.date`，canonical totals 計算方式改變對其型別與邏輯皆無影響）；conversion、realized FX、foreign investment／loan、Financial Event Ledger、Generic Split、AI Decision、Rebalance；schema version bump、Backup version bump、migration、historical rewrite 均未發生；Worker 本次未修改／未部署。
- 驗證：新增 16 個測試（`tests/canonicalNetWorthTotals.test.ts`、`tests/fxA3NoAutoFetchRegression.test.ts` 新檔，`tests/fxValuationPersistence.test.ts` 擴充 2 項）；`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功。**已於正式 Production 與 Preview 環境實測驗證**：mixed-currency（TWD 100,000＋USD 1,000＠31 → 正確 **13.1 萬元／131,000**，非裸加 **10.1 萬元／101,000**）與 missing-rate（正確排除 USD、顯示 10 萬元，`cashAvailable=false`，非裸加或猜值）兩種情境；snapshot pin、rate revision 不改寫已建立 snapshot、legacy snapshot 不回填、no startup／render auto-fetch（`fx-rates`／`cbc` 網路請求數 = 0）均已驗證；Production bundle 硬證據確認不含 PR #320 標記字串混入、Preview bundle 確認正確含有，console 全程無錯誤。
- 下一直接起點：**UR-TODO-046 整體仍 OPEN**；下一個獨立階段（FX attribution evidence/runtime integration、conversion／realized FX、foreign investment／loan、Loan UI／CSV／Import Center producer mapping 等）均未開始，須另行唯讀盤點與產品決策，**不得自行啟動**。

---

## 最新交接快照：UR-TODO-046 FX-A2 CBC USD/TWD Provider Adapter（已完成／Merge／Production Worker Deployed，2026-08-13）

- 正式基線：PR [#318](https://github.com/hyc640110/family-universal-rebalance/pull/318) 已正常 Merge，`origin/main` 為 `3341dfd81e7c1e57fe5d325e85c6303bc5d3b358`。PR CI Verification／`verify` run `31615645452` success；Merge 後 Deploy GitHub Pages run `31616344290` success，head 與 merge commit 一致。UR-TODO-046 整體仍 **OPEN**；FX-A3 尚未開始。
- 決策與來源：唯一 current source 是 CBC 官方 `https://cpx.cbc.gov.tw/api/OpenData/FTDOpenData_Day`；資料列必須同時含 `日期`（`YYYYMMDD`）與 `NTD_USD` 正數字串，語意固定為 `1 USD = quotePerBase TWD`。禁止 BP01D01en、HTML scraping、Yahoo／臺灣銀行 fallback、硬編碼 rate 或猜測。
- Worker boundary：只新增 Market Data Worker `GET /fx-rates/usd-twd`；先逐列驗證完整 raw array，再輸出 `available`／`unavailable` 的 normalized JSON，絕不回傳 CBC raw rows。duplicate same-date same-value 可接受，不同值為 `provider-conflict`；空、schema change、invalid、HTTP／timeout 均 fail-safe。Production Worker `family-universal-rebalance-market-data-production` 已於 `2026-08-12T16:17:13.176Z` 成功部署 version `7d4221c1-691f-42e4-b1ae-0a48e40603ba`，`/health` HTTP 200、`environment=production`；`/fx-rates/usd-twd?refresh=1` HTTP 200、`status=available`、`rateDate=2026-08-12`、`quotePerBase=32.246`，與 CBC `NTD_USD` 一致、無 raw rows、`cache-control: no-store`。Preview Worker 為 `family-universal-rebalance-market-data-preview` version `b83bc7f0-3f7d-4bb3-9093-93a0b256ba44`，HTTP 200、`environment=preview`；兩個 Worker 環境隔離正常。
- App boundary：`cbcFxProvider.ts` 是可呼叫 service，無 startup／render auto-fetch、無 UI。只有 `available` 才形成 deterministic `cbc-ftd-usd-twd-reference-close-YYYY-MM-DD` record；同 ID 同值 idempotent，不同值不覆寫既有歷史。staleness 僅重用 FX-A1 的 3 calendar days policy；localStorage／JSON Backup 維持加法式 round-trip，pinned snapshots 不改。
- 未包含：FX attribution、snapshot producer、totals、currency conversion、realized FX、foreign investment／loan、Generic Split FX consumer、Financial Event／Ledger、AI Decision、Rebalance 與 Household Liquidity。後續只可依 PR CI、Preview 驗收與使用者明確 Merge 指示前進。

---

## 最新交接快照：UR-TODO-046 FX-A1 USD/TWD Rate Provenance & Foreign Cash Valuation Foundation（已完成／Merge／Production Verified，2026-08-12）

- 正式基線：PR [#316](https://github.com/hyc640110/family-universal-rebalance/pull/316) 已正常 Merge；`origin/main`／merge commit 為 `62a5a9a8ed269bbac9d6e9370c524356cd3fa5e0`（parents：`98cd44ed2493594b1b67dc22e93f7b55345b2090`、`0c4da369449eea1d20d70b4767bdcba1bcb23002`；`mergedAt: 2026-08-12T15:21:56Z`；`mergedBy: hyc640110`；未使用 admin override）。PR CI Verification `31610595323`、Preview workflow_dispatch `31611211649` 與 Merge 後 Deploy GitHub Pages `31611895289` 均 success；Production／Preview HTTP 200、environment metadata 正確、assets 隔離正常。
- 已完成 contract：TWD 為 household valuation currency；唯一 MVP pair 為 USD/TWD，`quotePerBase` 表示 `1 USD = N TWD`，rate type 固定 `reference-close`。rate history 僅保存有效、正規化、deterministic dedupe 的 records；valuation 最多 carry-forward 3 個 calendar days，超限、missing、unsupported 或無可用 balance 一律 fail-safe。
- persistence／歷史：`AppState.fxRateHistory` 與 JSON Backup 加法式 round-trip；新 `NetWorthSnapshot.fxValuations?` 保存 account id、原幣金額、pinned rate id/value/date、stale 資訊與結果。舊 snapshots 可讀但無 provenance，不回填、不重算、不改寫；後續 rate revision 不得改變已 pinned snapshot。
- 已完成／不再列為 active residual：Generic Split Allocation Foundation、Investment buy／sell attribution core、Loan principal／interest attribution 與 FX-A1 provenance foundation。現行 Generic Split contract 已足夠，沒有證據需要 Generic Split consumer。
- Remaining Boundary：UR-TODO-046 **仍 OPEN**。FX-A3 Foreign Cash Producer／Snapshot Integration 尚未開始；FX attribution evidence/runtime integration、conversion、realized FX、foreign investment／loan 均為後續獨立階段。Loan UI／CSV／Import Center producer mapping 是 delivery boundary，不是核心 attribution consumer gap。任何下一階段都必須先唯讀盤點與取得明確授權。
- 明確不包含：FX-A2 未接 foreign-cash totals、snapshot producer、valuation UI、FX attribution、Financial Event、Ledger、Generic Split、`netWorthAttribution.ts`、runtime attribution、Investment、Loan、Household Liquidity、AI Decision 或 Rebalance；不得因 Production Worker rollout 自行擴大範圍。

---

## 最新交接快照：UR-TODO-001 Firebase Retirement 正式完成（Archived Retirement，2026-08-12）

- 正式基線：PR [#314](https://github.com/hyc640110/family-universal-rebalance/pull/314) 已 Merge，`origin/main`／merge commit `54bd6794c0ac8ec1704c979cdb7e56e81818de32`。P3-B2-A～P3-B3-C 全數完成；Firebase Auth／RTDB transport／Firebase SDK dependency／active Firebase environment naming／canonical Firebase config 均為 0。localStorage 是 canonical device persistence，JSON Backup 是人工備份／裝置搬移，legacy Firebase input 僅 tolerant-read／accept-and-discard；Financial Event Ledger 與 `mergeFinancialEventLedgers()` KEEP，Preview／Production isolation 不變。
- P4 Archived Retirement：Firebase Project `l-pro-web-app`、RTDB historical data、19 個歷史 anonymous users 與 Web App registration 均保留；RTDB Rules 為 deny-all，Anonymous Auth disabled。受控離線 RTDB archive 已完成 JSON parse 驗證，SHA-256 evidence 為 `E22FD669E3787F28B5174CE5C748A9317EE2EE935E48EDF996A07B8D741E4150`；archive 本體不進 Repository、Bundle 或公開資源。Production InPrivate／Ctrl+F5 實機驗證證實不依賴 RTDB／Anonymous Auth，localStorage 設定可保留。
- 結案：**UR-TODO-001 已 CLOSED，無 REQUIRED-DELETE blocker。** 下一位 AI 不得再啟動 Firebase retirement；若使用者未來要求刪除 users、RTDB、Web App registration、API key、Project 或 browser storage，均為 optional destructive housekeeping，必須重新唯讀盤點並取得明確授權。

---

## 歷史交接快照：UR-TODO-001 Firebase Retirement P3-B3-C Environment Naming Cleanup（完成候選，2026-08-12）

- 正式基線：PR [#313](https://github.com/hyc640110/family-universal-rebalance/pull/313) 已一般 Merge，`origin/main`／merge commit `aee3e5cfa590ec2d650fc06f7222d81ce309c687`（`mergedAt: 2026-08-12T11:33:18Z`；`mergedBy: hyc640110`；未使用 admin override）。P3-B3-B 移除 canonical `AppState.firebase`／`FirebaseConfig`；legacy top-level localStorage、top-level Backup、nested `syncSettings.firebase` 均 accept-and-discard，不進入 canonical state 或後續 output。Production workflow `31592370757` success；Production／Preview HTTP 200，metadata 分別為 `production`／`preview`，assets 隔離正常。
- 完成候選：branch `codex/ur-todo-001-firebase-retirement-p3b3c-environment-naming-cleanup` 從最新 `origin/main` 建立。P3-B3-C 只將 active environment safety boundary 從 `VITE_FIREBASE_BASE_PATH`／`FIREBASE_BASE_PATH` 更名為 `VITE_DEPLOYMENT_SCOPE`／`DEPLOYMENT_SCOPE`；scope value、Production／Preview isolation、storage key、Worker URL 與 app base 均不變。
- Hydration／資料安全：raw legacy localStorage 與 canonical state 若僅差退休 metadata（含 top-level `firebase`）時不得首載自動寫回；真實 mutation 與 Full Restore 維持既有 canonical write semantic。無 schema bump、Backup version bump、migration 或歷史 localStorage 主動 rewrite。Financial Event Ledger schema、merge、void、Atomic Group、split、loan 與 attribution 均未修改；`mergeFinancialEventLedgers()` **KEEP**。
- 明確保留：`syncMeta.dirty`／`source`／`lastLocalSaveAt`／`lastBackupExportAt`／`lastBackupImportAt`、runtime Worker URLs 與 `public/auto-sync.js` 均未處理。下一步是 P3-B3-C Draft PR 的 Preview 驗收與使用者 Merge 決策；不得自行 Merge，亦不得開始 P4 Firebase Console；**UR-TODO-001 仍 OPEN，repository 端剩餘工作僅 P4。**

---

## 歷史交接快照：UR-TODO-001 Firebase Retirement P3-B1 Legacy Contract Adapter（已 Merge，2026-08-11）

- 正式基線與完成狀態：PR [#307](https://github.com/hyc640110/family-universal-rebalance/pull/307) 已一般 Merge；merge commit `2770eb2bddf256c4956da95ad0b5ee937495ba6a`（`mergedAt: 2026-08-11T15:06:07Z`；`mergedBy: hyc640110`；未使用 admin override）。Production workflow `31505208134` success；Production HTTP 200、metadata=`production`；Preview HTTP 200、metadata=`preview`，assets 路徑隔離正常。
- 已拍板 contract：**Backward-readable, not backward-re-export**。舊 top-level `firebase`、`syncSettings.firebase`、`firebaseConfigured` 均可讀入，沒有 Firebase functional runtime／canonical 意義；首載、reload、read-time normalization、legacy-only delta、mount effect 與背景 migration 均不得自行清除或寫入。P3-B1 不清理 Backup export 內的 `syncSettings.firebase`／`firebaseConfigured`，該 output retirement 後由 P3-B2-B 完成。

---

## 歷史交接快照：UR-TODO-001 Firebase Retirement P3-A1（已 Merge，2026-08-11）

- 正式基線：P2-A 已由 PR #304 Merge；P3 Repository 唯讀盤點與 P3-A1 已由 PR [#305](https://github.com/hyc640110/family-universal-rebalance/pull/305) 正常 Merge。`origin/main` 為 `78e50c3d09f122b18d968ebcddf0bd2b52bf177f`（parents：`339f8c305a419117af54f4dbd69a3b47b903a26c`、`40101739a1429aac5bd6ecf0a13d910ac397a5b6`；`mergedAt: 2026-08-11T14:20:24Z`；`mergedBy: hyc640110`；未使用 admin override）。Merge 後 Production Pages workflow `31500994060` success；Production HTTP 200、metadata=`production`、asset=`index-D4cszGRQ.js`；Preview HTTP 200、metadata=`preview`、asset=`index-DCUgxpdq.js`，assets 路徑隔離正常。
- P3-A1：已移除零 production caller 的 Firebase Anonymous Auth runtime module、Firebase RTDB URL builder runtime module、對應 tests、`VITE_FIREBASE_API_KEY` 與程式端 dead constants；production Firebase Auth／RTDB runtime reference = 0，regression guard 改為驗證模組與 API key config 不得重現。
- 明確保留：`VITE_FIREBASE_BASE_PATH`、environment boundary、legacy `state.firebase`／`syncSettings.firebase`／`syncMeta`、localStorage／JSON Backup、`syncState.ts`、Financial Event Ledger（含 `mergeFinancialEventLedgers()`）。未清除 stale browser Firebase auth session，未觸碰 Firebase Console、RTDB、Auth provider、Rules 或 Project。
- 下一直接起點：P3-B 尚未開始，必須先完成 legacy Firebase 欄位的 read-time／localStorage／JSON Backup 相容策略產品決策；不得自行開始實作。P4 必須再次明確授權。

---

## 歷史交接快照：UR-TODO-001 Firebase Retirement P2-A Active Firebase Runtime Retirement（Draft，2026-08-11）

- 基線與範圍：以 `origin/main` `1bbba423d3626b7a63fe48e5201c29597f682367` 為基線、branch `codex/ur-todo-001-firebase-retirement-p2a`；P1 已由 PR #303 Merge。P2-A 只移除 active Firebase Auth／RTDB transport caller、手動同步 UI、remote Ledger merge／apply、runtime sync metadata consumer，保留 Firebase helper/env/legacy payload cleanup 給 P3。
- 歷史保留：UR-TODO-001 原始 Security Rules Expiry／Anonymous Auth Phase（PR #252）維持已完成歷史；Firebase Retirement 是後續延伸，不得倒寫成原始需求。
- 已確認決策：方案 B 分階段退役；localStorage 為唯一 canonical runtime state；JSON Backup 是人工備份、跨裝置搬移與災難復原；Ledger 的 localStorage／JSON Backup serialization 與 schema、normalization、validation、identity／collision、atomic group、void、linked transaction identity、attribution start date、forward-only contract 均不可碰觸。
- P1～P4：P1 已完成：移除 startup 背景 Auth、當時保留 manual transport。P2-A Draft 已移除 active transport／同步 UI／remote merge，legacy `syncMeta`／`syncSettings.firebase` 仍相容讀取、未改 JSON Backup migration；P2-B 只在明確需要時處理 local／Backup feedback。P3 清理殘留 Firebase 設定、helper、tests 與文件；P4 僅在另行授權下處理 Firebase Console。
- Console 禁令：P4 前不得刪資料、停用 Anonymous Auth、修改／刪除 Rules、刪 RTDB／Project、改 Console 設定或部署 Production。
- 待盤點：Console Rules／provider／retention、active devices、Production JSON Backup Export → Import → Re-export 實機驗收環境、`syncSettings.firebase`／`syncMeta` P3 cleanup 策略、外部 env／Secrets 文件依賴及 Firebase-only Ledger union helper 的無 caller 證明。
- 下一直接起點：完成 P2-A CI、精準 P2 Preview branch rule、Preview／隔離資料 round-trip 與使用者驗收；不得自行 Ready、Merge、開始 P3 或操作 Firebase Console。

---

## 最新交接快照：UR-TODO-046-L2C-P1 Forensic Conclusion／L2C-P2 Firebase Missing-Ledger Compatibility Guard（已完成，2026-08-10）

- 基線與狀態：PR [#300](https://github.com/hyc640110/family-universal-rebalance/pull/300) 已由使用者授權正常 Merge，merge commit `9a4463b75564dfce3b73c5f57c6edb53118792af`（`mergedAt: 2026-08-10T16:40:00Z`；`mergedBy: hyc640110`）；PR CI Verification／`verify` run `31409415184` success，Deploy GitHub Pages run `31410135891` success，head SHA 一致；Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 正常。
- P1 forensic conclusion：Production raw-state evidence 顯示 selected local state 的 Ledger 為 schema v1、空事件陣列，Firebase UID raw state 沒有 `financialEventSchemaVersion`、`financialEvents` 或 attribution start 欄位；沒有可 recovery 的 FinancialEvent event。因此不需 authoritative-side selection、recovery、schema conversion 或 deterministic union，也不得補造 event。
- P2 runtime contract：remote 同時缺少 schemaVersion 與 events 時為 `missing-ledger`，僅顯示 runtime-only「雲端為舊格式，未包含 Financial Event Ledger；為保護本機資料，本次同步已停止。」。upload 在 GET preflight 後、`flushDrafts()` 前停止，PUT=0；download 在 merge、normalize、remote apply 前停止。不得改 local `financialEvents`、schemaVersion、`financialEventAttributionStartDate`、sync baseline、remoteMeta 或 persisted syncMeta，status 不寫 localStorage、JSON Backup 或 Firebase。
- 不包含／下一直接起點：無 migration、v1→v3／v2→v3 conversion、semantic merge、recovery、Firebase SDK、authoritative-side selection 或 Firebase 寫入。Firebase 跨裝置同步走 retirement 方向；如需後續，只能先在既有 UR-TODO-001 進行唯讀 retirement decision，或另依 UR-TODO-046 Remaining Boundary（split allocation、FX attribution、Loan UI／CSV／Import Center mapping）取得使用者明確授權，**不得自行開始任何 Sprint**。

- 基線與狀態：PR [#298](https://github.com/hyc640110/family-universal-rebalance/pull/298) 已由使用者授權正常 Merge，merge commit `af79903f547f498194cbe9b383a90cabdf28afdd`（parents：`149de0b9aa977a2c5fd1ef6d4af98c233af390a1`、`cd3bbaac9d9c0c440b9a61e5a6bc04e806850812`；`mergedAt: 2026-08-10T14:16:08Z`；`mergedBy: hyc640110`）。PR CI Verification／`verify` run `31396033551` success，Deploy GitHub Pages run `31397236443` success；Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 正常。
- Root cause／資料安全：L2C Audit 證實使用者看到的「本機 v1／雲端 v2，目前支援 v2」是舊 v2 bundle 把 free-text `syncMeta.status` 持久化後，在 v3 runtime 被誤當 current status；local v1／remote v2 mixed-version merge reject 本身是既有 fail-safe 行為。沒有 localStorage 或 Firebase Ledger 資料損毀證據，且本次沒有讀寫 Production Firebase 或執行 migration。
- 已完成 status contract：runtime failure 不進 localStorage canonical state、JSON Backup authoritative current state 或 Firebase canonical payload；reload／Ctrl+F5 會移除 stale status，下一次手動同步才依當次 runtime facts 建立 current status。schema mismatch UI 必須同時顯示 local schema、remote schema、writer schema 與 supported versions；writer schema v3 不等同 supported set v1／v2／v3。
- merge reject／同步安全：`LedgerMergeRejectReason` 為 structured taxonomy，且不解析 error message：`schema-version-mismatch` 僅表示兩端 schema 不同、`unsupported-future-schema` 表示至少一端不在 supported set、`event-id-collision` 表示相同 event id 但內容不同。所有 reject 維持 GET → validate／merge → reject → no-PUT；download 在建立新 state 前停止，local Ledger unchanged；無 partial merge、downgrade、migration 或 Ledger rewrite。
- Remaining Boundary／下一位 AI 起點：L2C-P0 只修 status contract，**未開始** authoritative-side selection、v1→v3／v2→v3 conversion、cross-version semantic merge 或 recovery workflow。任何正式 recovery 必須先進入 Review Mode，驗證並備份雙端 Ledger、檢查 event-id collision、void／component-group integrity 與 deterministic ordering，再由使用者選定 authoritative strategy；不得自動開始。UR-TODO-046 整體仍未完成，FX attribution、Loan UI／CSV／Import Center 與其他 consumer mapping 仍獨立保留。

---

## 最新交接快照：UR-TODO-046-L2A Split Allocation Contract Audit／L2B Generic Split Allocation Foundation（已完成，2026-08-10）

- 基線與狀態：PR [#296](https://github.com/hyc640110/family-universal-rebalance/pull/296) 已由使用者 Merge，merge commit `a355a3986f45f7bd15b61bc1d3f93f06ad633a41`（parents：`2dcc66b96f51d2c580007c951e6393b1b1376b92`、`724a7b2b5cb24ecad309a7d6c4bd1d04132f7f09`；`mergedAt: 2026-08-10T12:23:50Z`；`mergedBy: hyc640110`）。GitHub `main`／`origin/main`／merge commit 一致；PR CI Verification／`verify` run `31386340292` success，Deploy GitHub Pages run `31387817114` success。Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 可載入。
- 已完成的 generic contract：FinancialEvent schema v3 是 generic split 的 compatibility boundary；FinancialEvent Ledger 是唯一 persistent SSOT。合法 group 必須具有 stable allocationGroupId、同 domain／transactionId／account／currency／effectiveDate、group-local unique componentId、完整 components 與 amount conservation。只要 partial／under-sum／over-sum／duplicate／unsupported 或任一 component Void，即 whole group invalid，不可留下部分 component 有效的狀態，也不得進 attribution、transaction consumption、reconciliation matched 或 derived-evidence suppression。
- Void／replacement：修正一律 forward-only：先 append Void old group，再 append complete replacement group。replacementOfGroupId 僅為連結，不會自動 Void 舊 group；replacement 必須用 fresh allocationGroupId 與 fresh event ids，舊 group 未 Void 時 replacement 不得生效。
- 相容性／同步：v1／v2 Ledger 維持可讀；v2 client 遇 v3 Ledger 保留 opaque payload 且 no runtime consumption，不能 downgrade、migration 或把 raw records 當正常 FinancialEvent 消費；future schema 同樣 fail-safe。localStorage、JSON Backup、Firebase v3 round-trip 已有 characterization coverage；Firebase partial union deterministic 且未完整前不歸因；v2/v3 mixed-version merge 及同 event id 不同內容一律 reject，upload path 不得 PUT。Loan L1 principal／interest／fee／penalty semantics 維持不變。
- 明確不包含／下一位 AI 起點：L2B 不含 UI、CSV、Import Center、Investment buy/sell consumer、FX conversion、Loan UI wiring、AI Decision、Rebalance、Dashboard、historical migration 或 existing FinancialEvents 自動轉換。UR-TODO-046 整體仍未完成；Remaining Boundary 僅為 FX attribution 與尚未授權的 Loan UI／CSV／Import Center／其他 consumer mapping。下一位 AI 必須先在 Review Mode 以最新 `origin/main` 唯讀盤點，另行取得產品決策與授權後才可啟動任何子階段。

---

## 最新交接快照：UR-TODO-046-L1 Loan Repayment Contract & Fail-safe Attribution Foundation（已完成，2026-08-09）

- 基線與狀態：PR [#294](https://github.com/hyc640110/family-universal-rebalance/pull/294) 已由使用者授權並以既定 admin merge 例外合併，merge commit `b88c35511be509a84ba756a9a075df6d047154ad`（parents：`1a80d08bdc5371fe3bb0a0a67ef533571db2214a`、`0f82d999b4e04d414a8e00160b1a5a7915992407`；`mergedAt: 2026-08-09T17:01:56Z`；`mergedBy: hyc640110`）。GitHub `main`／`origin/main`／merge commit 一致；Deploy GitHub Pages run `31325341109` success，Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 可載入。L1 程式、CI、Merge 與 Production 部署均已完成；不得自行啟動後續階段。
- 合約與財務語意：`FinancialTransaction.loanAttribution?` 為 additive discriminated union：`repayment` 需 `paymentId`、`loanId`、`cashAccountId`、`currency`、`settlementAmount` 與總額完全一致、stable `componentId` 的 components；`disbursement` 與 `cash-movement` 僅接受顯式 stable linkage。正式完整 TWD repayment：principal = 0；interest／fee／penalty 各僅一次負 contribution；disbursement = 0。不得從 description、merchant、note、generic taxonomy、金額、monthlyPayment、期數、利率或 Loan principal 快照推導歷史本息，也不得自動修改 Loan principal。
- Ledger／防重複：FinancialEvent schema v2 新增 optional `componentLink`（`paymentId`、`componentId`、fresh `confirmationGroupId`、可選 `cashMovementId`）。`componentId` 在同一 loan identity domain 不得跨 payment 重複，且 `appendFinancialEventGroup()` 本身強制完整 contract／transaction／cash linkage／group 驗證，不能由 caller 繞過。只有完整、唯一的 `attribution-confirmation` group 才被消費；partial／duplicate／cash link 不完整／non-TWD／legacy 一律 residual。任一 component Void 會使原 group 原子失效；只能以新的完整 group 重新辨識，不能拼接舊 component。完整 confirmed group 壓制 runtime evidence；void 後合法 transaction 最多重新辨識一次。沒有正式 Loan contract 的 `expense-housing` 不可 fallback 為 `external-expense`。v1 仍可讀；v1/v2 Firebase Ledger 混合 fail-safe 拒絕，無 migration。
- 相容性／驗證：localStorage、JSON Backup、Firebase 與 legacy transaction normalizer 均以 additive contract 保留相容。已驗證 `npx tsc -b`、`npm run test:ci`（788 unit／Risk 3／MJS 18、0 fail）、Production／Preview build、Full Bundle 22/22、Lite Bundle 6/6 與 `git diff --check`；最終獨立 Merge 前審查 PASS、Merge Blocker：無。
- 明確不包含／下一位 AI 起點：L1 不含 Loan UI、CSV／Import Center mapping、split allocation、FX attribution、Investment I1 重構、holding replay、realized gain/loss、Household Liquidity、CLEC、AI Decision、Rebalance、Dashboard 或 Production 既有資料。UR-TODO-046 整體仍未完成；Remaining Boundary 為 split allocation、FX attribution，以及尚未授權的 Loan UI／CSV／Import Center consumer mapping。下一位 AI 必須先以 Review Mode 依最新 `origin/main` 唯讀盤點，未經使用者另行授權不得建立後續子階段。

---

## 最新交接快照：UR-TODO-046-I1 Investment Trade Contract & Fail-safe Reconciliation Foundation（已完成，2026-08-09）

- Git 基線：PR [#292](https://github.com/hyc640110/family-universal-rebalance/pull/292) 已由使用者 Merge，merge commit `b8621a0bf5e13a7666b360829e276d6d87019a44`（parents：`8622ae31f06a5b2fced1b0757a563968be12a2ee`、`c2d418306bba93940a67f37178f5fda306af483f`；`mergedAt: 2026-08-09T06:54:31Z`）；`origin/main`／GitHub `main` 一致。Deploy GitHub Pages #339（run `31299929750`）success，Production smoke verification 已通過。I1 的原 branch 已合併，下一位 AI 不得沿用它建立新工作。
- 已完成範圍：新增 `FinancialTransaction.investmentAttribution` 加法式 discriminated union。完整正式 TWD buy／sell 優先於 generic taxonomy，僅產生 zero contribution。一般、沒有正式 trade contract 的 `income-other` 維持既有 `external-income`；不得從 `expense-investment`／`income-other`、description、merchant、note、amount sign 或 legacy 交易猜測投資買賣。成本另需 stable `costId`、`settlementCostTreatment: independent` 與唯一 trade 關聯才會產生一次負 contribution。
- Reconciliation／Ledger：`included`／`unknown`／legacy／重複／無關聯 fee／tax 一律不扣除。另建 cash movement 必須使用 explicit `cashMovementId`、`kind: cash-movement`、正確方向、相同帳戶與幣別的唯一關聯；未連結、重複或方向錯誤一律不歸因，Ledger confirmation 無法繞過此防護。既有 Ledger > derived precedence、transaction consumption guard 與 void 後重新辨識保留。非 TWD、缺欄位、重複 trade identity、realized gain/loss、FX fail-safe 至 unsupported／residual。
- 相容性與驗證：採 additive fields，未 bump transaction／Ledger schema、未做 migration 或 legacy 回填；現有 localStorage、Firebase、JSON Backup 共用 transaction normalizer，正式契約與 legacy round-trip 均有測試。已實際執行 `npm run test:ci`（785 unit／Risk 3／MJS 18）、`npx tsc -b`、`npm run build`、`npm run build:preview`、Bundle validation；PR CI及Merge後main CI／部署均成功。
- 明確不包含／下一位 AI 起點：UR-TODO-046 整體仍未完成。split allocation、loan principal／interest attribution、FX attribution 為 Remaining Boundary；不新增 UI、CSV／Import Center mapping、交易自動建立、holding replay、成本基礎或 realized gain/loss。手動／legacy fee 或 cash movement 若欠缺 explicit contract 仍保留 unsupported／residual。下一子階段需使用者另行授權，不得自行建立、Ready、Merge 或部署。

---

## 最新交接快照：UR-TODO-046 C3B Runtime Attribution Composition 已完成（2026-08-05）

- 正式基線：PR [#246](https://github.com/hyc640110/family-universal-rebalance/pull/246) 已由使用者最終授權 Merge（ChatGPT 完成架構審查與人工財務案例驗收後正式核准，Claude Code 依既有政策執行 `gh pr merge --admin`）；`main`、`origin/main`、`HEAD` 為 **`c30db10b69f7f1b3a8c88390028f4abac46246a4`**（`mergedAt: 2026-08-04T16:49:54Z`）。
- C3B 已完成：新增 `runtimeAttributionComposition.ts` runtime attribution composition layer。正式契約：`netWorthChange = ledgerContribution + derivedContribution + unexplainedResidual`；Ledger evidence 優先於 derived evidence；只有 C1／C2 reconciliation candidate 能產生 derived contribution；同一 transactionId 最多計算一次 derived contribution；沿用 C3A 的 `Asia/Taipei` calendar-day 日期契約（`opening < effectiveDate <= closing`，同日快照為合法 zero-length period，`opening > closing` 為 invalid／unavailable）。
- adjustment 為 0、僅供診斷、不降低 residual、不提升 quality；internal-transfer 為 0；非 TWD 且無正式 FX conversion 時 fail-safe 排除、保留 diagnostic；`reconciled` 只代表 residual 落在 tolerance 內，不代表完整歸因、不代表使用者已確認所有來源；derived evidence 為 runtime-only，不得偽裝成 persisted `FinancialEvent`。
- matched／duplicate／ambiguous／unsupported／invalid 一律不產生 derived contribution，延續 C3A 邊界，避免與 C1 Ledger double-count。**明確不包含**：schema、persistence、Firebase Ledger sync、migration、Backup schema change、Ledger write-back、AppState persistence change、AI Decision／Rebalance／Household Liquidity wiring、UI。Changed files 僅 `package.json`、`src/lib/netWorthAttribution.ts`、`src/lib/runtimeAttributionComposition.ts`、`tests/runtimeAttributionComposition.test.ts`。
- Merge 前安全檢查：head SHA `98f2271d8ebfbbfc7c478cad6df74461088ce6c8` 與 CI run `30928298413`（`conclusion: success`）headSha 一致、changed files 未增加超範圍內容。Merge 後 Git 基線驗證：`git fetch` 確認 `origin/main` 已含本次 Merge，local `main` 正常 fast-forward 同步，`main`／`origin/main`／`HEAD` 三者一致；無 open PR、working tree 乾淨、既有固定 stash（6 筆）與 `.claude/` 皆未受影響。
- `Deploy GitHub Pages` run `30931019567` success，headSha 與 merge commit 一致；Production／Preview `curl` 實測皆 HTTP 200，`deployment-environment` metadata 正確，以 `gh-pages` 分支內容核對 assets 路徑各自獨立（不同 JS hash）。
- **UR-TODO-046 整體仍未完成；下一候選待唯讀判斷**：C3C presentation／使用者確認、Firebase Financial Event Ledger sync、split allocation、投資買賣／借款本息／FX 歸因等，或其他最新治理文件已定義項目。**若下一候選涉及 UI 財務呈現、Ledger 寫入、schema／persistence 變更、核心 attribution 結果改變、AI Decision／Rebalance 接線或啟用 Firebase Ledger sync，屬重大產品／核心財務語意事件，須另行拍板，不得自動開始。**

---

## 歷史交接快照：UR-TODO-046 C3A Pure Runtime Derived-Evidence Adapter 已完成（2026-08-02）

- 正式基線：PR [#244](https://github.com/hyc640110/family-universal-rebalance/pull/244) 已 Merge；merge commit **`0fd1955bfe6267e55072bf2278114f70aa11f98e`**（`mergedAt: 2026-08-02T13:15:09Z`）。
- C3A 已完成：新增純 `deriveRuntimeDerivedAttributionEvidence()`。它只消費 C1／C2 `candidate` reconciliation result，以 `Asia/Taipei` canonical calendar-day `openingSnapshot.date < effectiveDate <= closingSnapshot.date` 產出 runtime-only `DerivedAttributionEvidence`。
- provenance 明確為 `derived-transaction`，不等同 Ledger-confirmed／user-confirmed event；保留 transactionId、effectiveDate、category、amount、signed contribution 與 `safe-taxonomy-candidate` basis。external income／expense、dividend 分別維持正負經濟符號；internal transfer、adjustment 均為零效果，不能被稱為 market effect。
- matched／duplicate／ambiguous／unsupported／invalid 不會產生 derived evidence，避免與 C1 Ledger double-count。C3A 沒有呼叫或改變 `deriveNetWorthAttribution()`、quality、UI、Ledger、AppState、localStorage、Firebase、JSON Backup、schema、migration、legacy rewrite、AI Decision、Rebalance 或 Household Liquidity。
- PR #244 CI Verification（head `1490e56264c4222d69a953d39ee24aebb1fcfb58`）成功；Merge 後 Pages workflow／Production 與 Preview 狀態已由 C3B 快照確認正常。

---

## 歷史交接快照：UR-TODO-046 C1／C2 Pure Transaction Reconciliation 已完成（2026-08-02）

- 正式基線：PR [#242](https://github.com/hyc640110/family-universal-rebalance/pull/242) 已 Merge；`main`、`origin/main` 為 **`b8b9a4d212917444e313ef22649461a843273bdb`**（`mergedAt: 2026-08-02T12:12:48Z`）。
- 已完成 046-C1／C2：新增純、deterministic、唯讀 `reconcileTransactions()`，每筆既有交易唯一輸出 `matched`／`candidate`／`unsupported`／`ambiguous`／`duplicate`／`invalid`。安全候選僅限既有 taxonomy 可證明的非股息收入、股息、非投資支出、同幣別轉帳及 adjustment；投資、借款、FX 與不明分類不得猜測。
- C2 僅診斷既有 C1 Ledger：有效 linked event 為 matched，void 不消費，兩個以上有效 linked event 為 duplicate，相似 manual event 為 ambiguous；pending linked 可保留為 C1 evidence，但 `completedPeriodEvidence` 為 false。沒有任何 Ledger 寫入、自動連結、去重或 calculator wiring。
- 明確不包含：schema、persistence、Firebase、JSON Backup、migration、legacy rewrite、split allocation、attribution calculator input／quality、UI、AI Decision／Rebalance／Household Liquidity consumer wiring。
- **UR-TODO-046 整體仍未完成**。下一正式候選為待盤點的 046-C3 reconciliation 結果消費／產品契約；若要接入 calculator、quality 或正式 external flow／internal transfer 分類，即屬重大事件候選，須另行產品決策與授權，**不得自動開始**。
- PR #242 CI Verification（head `5aedf0e2322b6adb1ab5f2d0e077eb66b0f78e44`）成功；Merge 後 Deploy GitHub Pages run `30747353452` 成功，head 與 merge commit 一致；Production／Preview HTTP 200、環境 metadata 與 assets path 隔離。

---

## 歷史交接快照：UR-TODO-046 B 已完成（2026-08-02）

- 正式基線：PR [#240](https://github.com/hyc640110/family-universal-rebalance/pull/240) 已 Merge；`main`、`origin/main`、`HEAD` 為 **`d61e0aa270bf006acb7000e2c1b3be0fc0f68264`**（`mergedAt: 2026-08-02T10:11:19Z`）。
- 已完成的是 046-B **Pure Attribution Calculator／Quality Model**：新增純 `deriveNetWorthAttribution()`，品質狀態為 `unavailable`／`snapshot-only`／`partial`／`reconciled`；輸出 classified contribution 與 explicit unexplained residual，後者**不等同 market effect**。
- 明確不包含：schema、persistence、Firebase、migration、legacy rewrite、UI、AI Decision／Rebalance／Household Liquidity consumer wiring。046-B 沒有改寫既有資料，也沒有啟動 attribution 結果的產品消費端。
- **UR-TODO-046 整體仍未完成**。下一正式候選是 046-C existing transaction reconciliation，涉及 transaction reconciliation、external flow／internal transfer 與事件分類產品契約，屬重大事件候選；Firebase Ledger sync、split allocation、loan principal／interest／dividend attribution 規則仍各自待評估，不得自行開始。
- PR #240 CI Verification（head `6ba782e42cff1ea32b5e0c5a55156e6a7c58467f`）成功；Merge 後 Deploy GitHub Pages run `30743250912` 成功，head 與 merge commit 一致；Production／Preview HTTP 200 且 assets path 隔離。

---

## 歷史交接快照：UR-TODO-046 C1 已完成（2026-08-02）

- 正式基線：PR [#238](https://github.com/hyc640110/family-universal-rebalance/pull/238) 已 Merge；`main`、`origin/main`、`HEAD` 為 **`ef42c2408c989bc56c4ee1d31986161c7628ed2f`**（`mergedAt: 2026-08-02T09:51:20Z`）。
- 已完成的僅是 UR-TODO-046 **C1 Financial Event Ledger contract／persistence foundation**，不是 UR-TODO-046 整體結案。Ledger 為 forward-only，僅保存於 AppState、localStorage、JSON Backup／Full Restore。
- C1 採 future-schema opaque fail-safe；linked transaction 只接受既有 taxonomy 可安全證明的語意；manual event 不得帶 `transactionId`；同一 transactionId 的有效 linked events 不得重複消費。未新增 split allocation schema。
- **Firebase Ledger sync 未實作**：現有 Firebase root PUT 沒有 mixed-version Ledger 安全性，故 C1 刻意不把 Ledger 放入 canonical payload；後續若要進行必須另開重大階段審查。
- 此快照當時未做 migration、legacy transaction／snapshot rewrite、attribution calculator、事件輸入 UI，亦未接入 AI Decision、Rebalance 或 Household Liquidity；其後的 046-B 已由 PR #240 完成，最新狀態以本文件上方交接快照與 `008_TODO_BACKLOG.md` 為準。
- PR #238 CI Verification（head `e6a2273a3a820a17f0858b33099bd29b6dd60f43`）成功；合併前本機 `npm run test:ci` 為 694/694 通過，並已確認 TypeScript、Production／Preview build、`git diff --check`。

---

## 最新交接快照：UR-TODO-043 正式結案（2026-08-02）

- 正式基線：`main`、`origin/main`、`HEAD` 已由治理 PR #236 推進至 **`844d4fe9756f1ef8fe3b5ddf1f9c8be867928516`**。
- UR-TODO-043 已正式結案：A／B／C 全部完成，包含 C3-A／C3-B、B1／B2／B3；PR #235 完成功能契約，PR #236 完成結案治理同步。
- C3-A／C3-B 與 B1～B3 共用 read-time／same-day／calendar-day boundary；未修改 AppState、localStorage／Firebase／JSON Backup schema、Import／Export、migration、legacy date、timestamp 或既有 snapshot。Dashboard／`aiDecision.ts` 維持既有 App history input boundary；Household Liquidity、Rebalance、Treasury、Worker 均未修改。
- Analytics 目前呈現快照值與兩期差額，並明確說明不等同純投資損益；現有 `NetWorthSnapshot`／`FinancialTransaction` 模型無法直接證明市場、投入、提領、股息、現金或負債的個別來源貢獻。該來源歸因與淨值落差核對正式由 UR-TODO-046 承接；046 維持待評估，對 043-B 的依賴已解除，本次不開始 046。
- `test:ci` 680 項、TypeScript、Production／Preview build、`git diff --check`、CI verify `30738388551`、Pages workflow `30738434065` 均成功。**UR-TODO-043 正式完成；B4 不需要、C4 未觸發。**
- 既存 390px 部分長文裁切問題非本次變更造成，仍為獨立待盤點事項；不得在 043 結案中順便修正。
- 固定 stash `e141af14273b76501c1b287ea018e8728099f1e5`、`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba` 未操作。

---

## 歷史交接快照：UR-TODO-035 正式結案（2026-08-02）

- 正式基線：`main`、`origin/main`、`HEAD` 均為 **`2bc1b1716c176b07bab4e11cbdc96c48ad1d52a2`**（PR #227 merge commit）；本次僅同步治理文件與 Bundle，未修改程式、建立 Branch、Commit、Push、PR 或部署。
- UR-TODO-035 已正式標記為 **已完成**：市場頁「重新取得」click handler 實際觸發 refresh，request builder 發出 `/market-summary?refresh=1&request=<nonce>`，使用 `cache: no-store` 與 `Accept: application/json`；Loading、Success、Partial failure、Full failure 與再次重試均已唯讀／隔離實機確認。
- Preview／Production Market Worker URL 與 live bundle environment boundary 正確，未發現混用；Console 無產品 error／warn。Treasury 上游格式不完整屬外部資料來源問題，不阻擋本 Todo 結案、不建立 Hotfix；若未來處理，應另立獨立 Todo。
- 固定 stash `e141af14273b76501c1b287ea018e8728099f1e5`、`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba` 未操作。當時下一直接起點為 UR-TODO-043；後續已完成 043-C2、043-C3-A 與 043-C3-B，現行下一候選為 043-B。

---

## 最新交接快照：PR #178／#179 治理同步（下一直接起點仍為 043-C2）

- 正式基線：`origin/main`＝**`94c3d08d1a18d4d81d41b003d1cc5f5e41231d24`**（PR #179 merge commit，`mergedAt: 2026-07-28T18:15:50Z`，`mergedBy: hyc640110`）。Deploy GitHub Pages run `30386642108` success，headSha 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 為 `production`。
- **PR #178**（MERGED，merge commit `4280ac44e6dd814eb0054ed1cd2012e7c8242c1e`，`mergedAt: 2026-07-28T17:59:01Z`）：正式完成 PR #176／#177 後治理同步；純治理文件同步。
- **PR #179**（MERGED，merge commit `94c3d08d1a18d4d81d41b003d1cc5f5e41231d24`，`mergedAt: 2026-07-28T18:15:50Z`）：正式再次確認 UR-TODO-030 首頁「30 秒決策中心」產品方向為既有決策，完整保留；**未修改任何首頁 UI，未開始 UR-TODO-043-C2**；純治理文件同步。
- UR-TODO-043 狀態：整體仍為 **P2／待盤點**。**043-A 已完成**（PR #174）；**043-C1 已完成**（PR #175 唯讀盤點內容，PR #176 正式記錄）。**下一直接起點仍為 043-C2**，未被本次治理同步變更。
- **043-C2 精確邊界（與前一版快照完全一致，未變更）**：
  - 只建立純 `netWorthSnapshotNormalization` helper（`src/lib/netWorthSnapshotNormalization.ts`）、對應型別，以及單元／契約測試。
  - 合法明確 `0` 必須保留為 `0`；missing／invalid／non-finite 不得靜默轉成 `0`，須明確分類（valid／missing／invalid／non-finite）。
  - **不接**任何正式 consumer（`App.tsx`、Analytics、淨資產歷史、Dashboard、AI Decision 一律不變動）。
  - **不改**任何持久化路徑（localStorage、Firebase、JSON Backup、Import／Export）。
  - **不改**日期／時區契約，不改同日快照排序規則。
  - **不做** migration；043-C4 才在證實需要時評估。
  - 043-C3（正式 consumer 接線）、043-C4（migration／legacy）、043-B（日期／時區產品契約）均排在 043-C2 之後，**不得一次做完 C2～C4**，不得預先把 043-B 視為已拍板。
- 目前沒有 Production 真實資料被錯誤顯示或財務決策被污染的證據；不得因本次治理同步升級為 P1，也不得重做 043-A 或 043-C1。
- **既有產品決策再次確認（與 043-C2 無關，本次未修改任何首頁 UI）**：使用者已明確要求未來縮減首頁資訊，首頁應重新定位為「**30 秒決策中心**」，只回答「今天是否需要做什麼」；建議保留今日是否需操作、精簡資產總覽、更新狀態三項；使用者已明確表示很少查看目前首頁大量資訊；「今日投資狀態」未來可評估移到分析頁或首頁僅留一行摘要＋查看入口。完整內容見 `008_TODO_BACKLOG.md` UR-TODO-030。此項**仍屬 Dashboard UX／UR-TODO-030 待盤點範圍**，**不得因 043-C2 開發而順便處理，也不得反過來擴大 043-C2 範圍**。
- **Claude Home（無 Repository 存取權）角色**：讀取最新版 `000_Universal_Rebalance_AI_Context_Bundle_Lite.md`；先做規劃與範圍審查；再產生交給 Claude Code 的具體執行指令；**不得宣稱自己已操作 Repository、已建立 Branch、已 Commit 或已 Merge**。
- **Claude Code（有 Repository 存取權）角色**：先唯讀確認最新 Git 基線（`origin/main`、固定 stash、Open PR）；只依 Claude Home 核准的範圍執行 043-C2；**不得自行擴大到 043-C3、043-C4 或 043-B**，不得自行 Merge 或部署 Production。
- 固定保護：不得操作固定 stash `e141af14273b76501c1b287ea018e8728099f1e5`、`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`；額外非固定 stash `9e9aa0c999cf3b97d034db786e4307eaec35e6b2`（其他工作階段草稿）僅可唯讀盤點，不得操作。原分支 `docs/ur-todo-010-011-spec-filename-fix` 所在的舊 dirty worktree（含未提交的 `CLAUDE.md`、Lite Bundle 差異與未追蹤 `Lite-1.md`）**完全保留、不得修改、刪除、reset、checkout、clean、stash、commit 或搬移**；本次治理同步全程於獨立隔離 worktree `family-universal-rebalance-bundle-sync` 進行，未帶入任何殘留修改。
- 下一位 Claude／AI 的直接起點：先唯讀確認上述正式基線、working tree、Open PR 與固定 stash；待使用者明確說「開始開發」後，只建立 **043-C2** branch，先寫純契約測試再建立 helper。

---

## 最新交接快照：PR #176／#177 治理同步（下一直接起點 043-C2）

- 正式基線：`origin/main`＝**`c8b6c95a60a7d3c60e4eb85b7d9889427dc30d5d`**（PR #177 merge commit，`mergedAt: 2026-07-28T17:21:20Z`）。Deploy GitHub Pages run `30382511752` success，headSha 一致；Production／Preview 本次以 `curl` 實測 HTTP 200，`deployment-environment` metadata 為 `production`。
- **PR #176**（MERGED，merge commit `272cd4a9ccff0c2def7bf0c73afbdbdf89363d58`，`mergedAt: 2026-07-28T16:49:20Z`）：正式記錄 UR-TODO-043-C1 唯讀正規化契約盤點結論、重新產生 Bundle；純治理文件同步。
- **PR #177**（MERGED，merge commit `c8b6c95a60a7d3c60e4eb85b7d9889427dc30d5d`，`mergedAt: 2026-07-28T17:21:20Z`）：僅將收支與現金流中心「儲存現金流設定」「清空設定」從固定支出清單上方移到下方；未修改 `cashFlowProfile` schema、`liquidityRole`、`linkedLoanId`、Household Liquidity 公式；與 **UR-TODO-043-C2 無直接耦合**。
- UR-TODO-043 狀態：整體仍為 **P2／待盤點**。**043-A 已完成**（PR #174，characterization only）；**043-C1 已完成**（PR #175 唯讀盤點內容，PR #176 正式記錄）。**下一直接起點為 043-C2**。
- **043-C2 精確邊界**：
  - 只建立純 `netWorthSnapshotNormalization` helper（`src/lib/netWorthSnapshotNormalization.ts`）、對應型別，以及單元／契約測試。
  - 合法明確 `0` 必須保留為 `0`；missing／invalid／non-finite 不得靜默轉成 `0`，須明確分類（valid／missing／invalid／non-finite）。
  - **不接**任何正式 consumer（`App.tsx`、Analytics、淨資產歷史、Dashboard、AI Decision 一律不變動）。
  - **不改**任何持久化路徑（localStorage、Firebase、JSON Backup、Import／Export）。
  - **不改**日期／時區契約，不改同日快照排序規則。
  - **不做** migration；043-C4 才在證實需要時評估。
  - 043-C3（正式 consumer 接線）、043-C4（migration／legacy）、043-B（日期／時區產品契約）均排在 043-C2 之後，**不得一次做完 C2～C4**，不得預先把 043-B 視為已拍板。
- 目前沒有 Production 真實資料被錯誤顯示或財務決策被污染的證據；不得因本次治理同步升級為 P1，也不得重做 043-A 或 043-C1。
- **Claude Home（無 Repository 存取權）角色**：讀取最新版 `000_Universal_Rebalance_AI_Context_Bundle_Lite.md`；先做規劃與範圍審查（例如確認 043-C2 邊界是否清楚、是否有遺漏的驗收條件）；再產生交給 Claude Code 的具體執行指令；**不得宣稱自己已操作 Repository、已建立 Branch、已 Commit 或已 Merge**。
- **Claude Code（有 Repository 存取權）角色**：先唯讀確認最新 Git 基線（`origin/main`、固定 stash、Open PR）；只依 Claude Home 核准的範圍執行 043-C2；**不得自行擴大到 043-C3、043-C4 或 043-B**，不得自行 Merge 或部署 Production。
- 固定保護：不得操作固定 stash `e141af14273b76501c1b287ea018e8728099f1e5`、`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`；額外非固定 stash `9e9aa0c999cf3b97d034db786e4307eaec35e6b2`（其他工作階段草稿）僅可唯讀盤點，不得操作。原分支 `docs/ur-todo-010-011-spec-filename-fix` 所在的舊 dirty worktree（含未提交的 `CLAUDE.md`、Lite Bundle 差異與未追蹤 `Lite-1.md`）**完全保留、不得修改、刪除、reset、checkout、clean、stash、commit 或搬移**；本次治理同步全程於獨立隔離 worktree `family-universal-rebalance-bundle-sync` 進行，未帶入任何殘留修改。
- 下一位 Claude／AI 的直接起點：先唯讀確認上述正式基線、working tree、Open PR 與固定 stash；待使用者明確說「開始開發」後，只建立 **043-C2** branch，先寫純契約測試再建立 helper。
- **既有產品決策保留提醒（與 043-C2 無關，本次未修改）**：使用者已明確要求未來縮減首頁資訊，首頁應重新定位為「**30 秒決策中心**」，只回答「今天是否需要做什麼」；建議保留今日是否需操作、精簡資產總覽、更新狀態三項；使用者已明確表示很少查看目前首頁大量資訊；「今日投資狀態」未來可評估移到分析頁或首頁僅留一行摘要＋查看入口。完整內容見 `008_TODO_BACKLOG.md` UR-TODO-030。此項**仍屬 Dashboard UX／UR-TODO-030 待盤點範圍**，本次治理同步未修改任何首頁 UI，**不得因 043-C2 開發而順便處理，也不得反過來擴大 043-C2 範圍**。Claude Home 規劃時應知悉此既有決策方向，但不得未經使用者明確「開始開發」授權就自行啟動。

---

## 最新交接快照：UR-TODO-043-C1 唯讀契約盤點

- 正式基線：[PR #175](https://github.com/hyc640110/family-universal-rebalance/pull/175) **MERGED**，merge commit `738513f16c1aa9f2ac2dbcc15a944aad6cd26328`，`mergedAt: 2026-07-28T16:37:40Z`；`origin/main` 同 SHA。Deploy GitHub Pages run `30379137766` 為 `completed/success`，headSha 一致；Production／Preview 均 HTTP 200，metadata 分別為 `production`／`preview`，Assets 路徑未混用。
- 043-A 結論：PR #174 已鎖定時區日期鍵差異、同日快照依陣列最後一筆取值、以及寬鬆轉 0 與嚴格排除的分歧；它是 characterization only，不得重做或視為理想契約。
- C1 已確認的正規化路徑：`src/lib/netWorthHistory.ts` 的 `n`、`netWorthSnapshotFromTotals`、`normalizeNetWorthHistory` 將五個金額欄位的 missing／invalid／non-finite 轉成 0；`src/lib/investmentPerformanceHistory.ts` 的 `validDate`、`finite`、`normalizeInvestmentPerformanceHistory` 只接受完整有限 number 快照。`src/App.tsx` 的 `normalizeState`、`readState`／`writeState`、`stateFromBackup`、`downloadFirebase`、`flushDrafts` 皆先採用前者；`src/lib/syncState.ts` 的 `canonicalSyncPayload` 只 canonicalize JSON，不能保留已被 normalizer 抹除的 missing 語意。
- Consumer 邊界：`NetWorthHistoryPage` 與 App `deriveHistoryStats`／Dashboard 月年摘要使用寬鬆歷史；`PerformanceAnalyticsPage`、`DailyAssetChangeCalendar`、`deriveInvestmentPerformanceStats`／`deriveInvestmentPerformanceQuality` 與 AI 最大回撤使用嚴格 helper，但一般 App 資料在到達它們前已先寬鬆正規化。Rebalance Recommendation／Execution Eligibility 不接受 `netWorthHistory`；現階段沒有歷史快照直接改變 Rebalance 的證據。
- 欄位契約：date 僅能是 `YYYY-MM-DD`，寬鬆路徑未驗證實際曆日、嚴格路徑會驗證；`totalAssets`、`netWorth`、`investmentValue`、`cash`、`debt` 的有限 number（含明確 0、負數）目前皆被保留。undefined、null、空字串／空白、非數字字串、NaN、Infinity、-Infinity 在寬鬆路徑皆成 0，在嚴格路徑皆使整筆排除；數字字串只在寬鬆路徑被轉數字。
- 建議 SSOT：043-C2 新增無 App／storage 依賴的純 `src/lib/netWorthSnapshotNormalization.ts`，明確回傳 valid、missing、invalid、non-finite 的欄位／整筆分類；不得在 C2 接正式 consumer 或更動既有 helper。C3 才由單一契約接入 AppState、Analytics、淨資產歷史、Dashboard、AI，保留明確 0 並杜絕缺失靜默成 0。
- Migration：**目前不需要 C4 migration 的證據**。先採 read-time normalization；既有已存的 0 無法安全回推為 missing，不得批次改寫。只有需要新增 legacy metadata、read-time 不能保護 localStorage／Firebase／Backup round-trip，或實證持久化會繼續不可逆改寫時，才另行設計 C4。
- C2 精確範圍：純 helper、型別、unit／contract tests；候選檔案僅 `src/lib/netWorthSnapshotNormalization.ts`、其專屬測試，必要時只調整 type export。明確不包含 `App.tsx`、現有 normalizer 接線、localStorage、Firebase、Backup、Import／Export、日期／時區、同日排序、schema、migration、UI、Dashboard、Rebalance 與 AI 結論。
- 後續測試矩陣：明確 0 保留；missing 不變 0；非有限值不進財務摘要；Analytics／History／Dashboard／AI 跨頁一致；localStorage、Firebase canonical、JSON Backup round-trip；舊資料缺欄位；同日／時區行為不改；Rebalance 不受無關歷史影響；missing 與 0 的契約與跨頁回歸。
- P1 升級條件：Production 真實資料把無效值顯示為 0、同一快照在 Dashboard／Analytics／History 顯示不一致、無效快照污染 AI 回撤或財務決策、Firebase／Backup round-trip 將 missing 永久改寫為 0。C1 目前只有程式與 characterization 證據，沒有 Production 真實資料證據，維持 P2／待盤點。
- 固定保護：不得操作 `e141af14273b76501c1b287ea018e8728099f1e5`、`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`。原工作目錄與既有 worktree 有既存 dirty／prunable 狀態，均不得 reset、clean、stash、覆蓋或納入後續 PR。
- 下一位 Claude／AI 的直接起點：先唯讀確認上述正式基線、working tree、Open PR 與固定 stash；待使用者明確說「開始開發」後，只建立 **043-C2** branch，先寫純契約測試再建立 helper。不得一次開始 C2～C4、不得重做 043-A、不得開始 043-B、不得自行 Merge 或部署 Production。C1 不是 Production 修正，也不代表 UR-TODO-043 已完成。

---

## 最新交接快照：UR-TODO-043-A Merge 後

- 正式基線：[PR #174](https://github.com/hyc640110/family-universal-rebalance/pull/174) **MERGED**，merge commit `9ac2cef82bad3a0a793f0db971d604c2b3e79463`，`mergedAt: 2026-07-28T16:22:11Z`；`origin/main` 同 SHA。Deploy GitHub Pages run `30377915466` 為 `completed/success`，headSha 一致；Production／Preview 均 HTTP 200，metadata 分別為 `production`／`preview`，Assets 路徑未混用。
- 已完成範圍：UR-TODO-043-A 只新增 characterization tests，鎖定時區日期鍵差異、同日快照依陣列最後一筆取值、以及淨資產歷史無效值轉 0 與 Analytics 嚴格排除的跨頁分歧。這些測試是現況記錄，不是理想產品契約，也未修改 Production 行為。
- 狀態：UR-TODO-043 整體仍為 **P2／待盤點**；尚未證實日期或財務公式 Bug，不得把 043-A 視為 Todo 結案。
- 下一直接起點：待使用者授權後，先以 **043-C Review Mode** 唯讀盤點跨 consumer 正規化、無效值語意、既有 localStorage／Firebase／JSON Backup 資料相容性與必要測試邊界。完成該盤點前不得實作；**043-B 日期／時區產品契約決策排在其後**，不得預設 Asia/Taipei 已是正式契約。
- Remaining Boundaries：尚未處理來源貢獻拆解、跨 consumer 正規化修正、日期契約決策、schema／migration 或 UI 文案；UR-TODO-043、首頁縮減、資產頁股價更新明細收合與淨資產歷史收合均不得誤標完成。

---

## 1. 使用時機

只有在以下情況需要更新本文件：

- ChatGPT 交接給 Claude
- Claude Home 交接給 Claude Code
- Claude／Codex 交接給 ChatGPT
- 開發工作暫停，之後由另一個 AI 接手
- 同一 Sprint 尚未完成，需要跨工具或跨對話延續

若目前沒有進行中的 Sprint、Branch 或 Draft PR，可保留本文件為「無進行中工作」。

本文件同時涵蓋兩種交接內容：

- **開發交接快照**（第 3～14 節）：有 Repository 存取權、涉及 Branch／PR／程式修改時使用。
- **Claude Home／ChatGPT 規劃交接**（第 2.2 節）：只在 Review Mode／規劃討論中使用「整理交接」口令時使用，不涉及 Branch 或程式。

---

## 2.1 與其他文件的關係

- 本文件是「工作狀態快照」，記錄目前這一段交接需要的短期資訊。
- 不是 `008_TODO_BACKLOG.md` 的替代品：所有未完成事項一律以 Todo Backlog 為唯一正式來源。
- 不是 `002_MASTER_ROADMAP.md` 的替代品：長期優先順序與版本規劃一律以 Roadmap 為準。
- 不是 `003_CURRENT_STATUS.md` 的替代品：正式版本與正式環境狀態一律以 Current Status 為準。
- 本文件只做「指向＋短期快照」，不得複製上述文件的完整內容；下一位 AI 仍須自行讀取正式文件確認細節。

---

## 2.2 Claude Home／ChatGPT 規劃交接格式

適用於 [000_AI_START_HERE.md](000_AI_START_HERE.md) 第 2.1 節「整理交接」口令觸發時，且本次只是 Review／規劃討論（沒有 Branch、沒有程式修改）。

輸出格式：

```text
### 本次工作主題


### 已確認決策


### Todo 變更
（是否已同步寫入 008_TODO_BACKLOG.md；若尚未寫入，列出待補項目）

### 建議 Sprint
（若討論結論指向未來某個 Sprint，列出候選與優先級；不代表已核准開始開發）

### 待盤點事項
（下一位 AI 需要另外唯讀確認、本次未確認的項目）

### 下一位 AI 的直接起點
（下一位 AI 應先讀哪些文件、先做哪些唯讀確認，才能接續本次結論）

### 建議更新的 AI_CONTEXT 文件
（本次結論預期會影響哪些正式文件，例如 002／003／008／013，由下一位有 Repository 存取權的 AI 實際執行更新）

### ADR
（本次 Sprint 是否有新增或修改的架構決策；若有，列出對應 `020_Architecture_Decisions.md` 的條目編號〔例如 ADR-003〕與一句話標題；若本次結論指向未來需要新增 ADR 但尚未正式寫入，標記「待補（建議編號 ADR-00X）」；若完全沒有架構決策層級的討論，寫「無」）

### Knowledge Delta
（只記錄「相較上一版交接快照，真正新增」的重要知識或決策，不重複程式細節、不重複已經寫進 002／003／008／013／016／020 等正式文件的內容；目的是讓下一位 AI 一眼看出「這次跟上次比，多知道了什麼」，而不是重新讀一遍完整 Sprint 過程；若本次沒有相較上次的新增知識，寫「無，沿用上一版快照」）

### Remaining Boundaries
（條列目前尚未接上核心模型、或本 Sprint 尚未覆蓋的路徑或模組——例如某個頁面／函式仍讀取舊公式或平行計算、某個下游消費者尚未串接已完成的核心輸出——讓下一位 AI 不需重新唯讀盤點就能一眼看出目前的邊界在哪裡；每項建議附一句話說明「為什麼還沒接」與「預計由哪個未來子 PR／Sprint 處理」；若本次 Sprint 已完整收斂、沒有已知邊界，寫「無」）
```

只有 Project Knowledge、沒有 Repository 存取權時，以聊天訊息輸出以上格式；有 Repository 存取權時，可直接寫入本節下方或第 3～14 節對應欄位。

---

## 2. 更新原則

更新時只記錄目前交接所需的短期資訊，不複製整份 Roadmap、Current Status 或 Todo Backlog。

必須遵守：

1. 以 Repository、已合併 PR 與 Production 驗證結果為準。
2. 不把推測寫成已確認事實。
3. 不在本文件保存密鑰、Token、Client Secret、帳號密碼或其他敏感資訊。
4. 不將本文件當成新的 Todo SSOT。
5. 交接完成或 Sprint Merge 後，應清除過期的工作中內容，重新建立最新快照。
6. 若文件與 Repository 衝突，先停止修改並提出差異。

### 狀態性文件同步時機（2026-07-25 新增）

`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md` 等記錄「目前正式基線與狀態」的文件，**應於每一個 sub-PR／PR Merge 後立即以獨立的小型純文件 PR 同步**，不得累積到整個 Sprint（多個 sub-PR）結束後才一次批次處理。理由：

- 狀態性文件的正確性取決於「與最新 main 的落差是否夠小」；延後同步的落差期越長，越容易被下一個平行工作的 AI 或使用者依據過期基線做出錯誤判斷。
- 每次同步的內容單純（記錄 PR 編號、merge commit、Deploy 結果），成本低，適合高頻率小批次處理，不需要等待「全局視角」才能下筆。

相對地，以下內容**允許留到 Sprint 結束（或明確的階段性收尾點）才一次整理**，不需要每個 sub-PR 都更新：

- Knowledge Delta（第 2.2 節）：需要綜合整個 Sprint 的多個 sub-PR 才能判斷「這次真正新增了什麼知識」，逐次 sub-PR 寫容易變成瑣碎程式細節的重複記錄，失去「Delta」的意義。
- ADR（`020_Architecture_Decisions.md`）撰寫或修改：架構決策需要看到多個 sub-PR 的實際做法後才能沉澱出穩定的決策敘述與後果評估，過早寫入容易在 Sprint 中途被推翻、造成 ADR 頻繁改版。

判斷原則：**「單純記錄已發生的事實」立即同步；「需要跨多個 PR 綜合判斷才能寫出的內容」留到收尾**。

---

# 目前交接快照

> **2026-07-28 最新正式基線：`origin/main`＝PR #172 merge commit `c5c57d69ecd572b9a8568a9962a17d2695daffcf`；Deploy GitHub Pages run `30374115851` 成功，headSha 一致。Production／Preview HTTP 200，HTML deployment metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。UR-TODO-010、UR-TODO-011 均已完成；家庭流動性資料關聯與診斷子 PR 1（#167）、子 PR 2（#169）與子 PR 3（#171）均已完成，三個正式 consumer 已接線。整體修正的唯一 Remaining Boundary 是 Production 代表性 diagnostics 資料互動驗收，狀態為待盤點；下方早期子 PR 快照僅為歷史交接脈絡，不得作為現況依據。**

## 家庭流動性資料關聯與診斷子 PR 1 合併快照

- PR／基線：[PR #167](https://github.com/hyc640110/family-universal-rebalance/pull/167) **MERGED**，merge commit `9d6f5a0da53d213661796968622e7fc5ef7ebf50`，`mergedAt: 2026-07-28T12:53:21Z`；CI Verification run `30360615589` 與 Deploy GitHub Pages run `30360943936` 均成功，後者 headSha 一致。Production／Preview HTTP 200，metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。
- 已完成範圍：新增純 `deriveHouseholdLiquidityInputDiagnostics`，以不修改來源資料的方式回報 Cash Flow Profile 缺失、未宣告／ambiguous 的 Cash Flow role、未連結借款、Loan 來源不可用、有效 Loan 陣列下的失效連結，以及未設定的額外投入資金／預計提領資金。explicit `0` 維持已設定；`null`／`undefined` 不會被視為空白設定或 0。migration、normalizer、JSON 與 Firebase canonical round-trip 維持既有契約。
- Remaining Boundaries：本 PR **未接正式 consumer**，未修改 Household Liquidity 核心公式、adapter 正式輸出、UI、schema、localStorage、Firebase、JSON Backup 或 Import／Export；不得由診斷層自行修正或補造來源資料。
- 下一直接起點：子 PR 2 已完成；後續子 PR 3 只能先做 **Review Mode 唯讀範圍確認**，盤點 diagnostics 可接的正式 consumer、Analytics、Risk Center、AI Decision 各頁既有資料來源與 unavailable 呈現邊界；不得自行開始接線、建立功能分支或改 UI。此記錄不改變 UR-TODO-043 維持 P2／待盤點及其既有優先序。
- ADR：無。
- Knowledge Delta：資料缺失、明確 0 與確定失效連結現在可由獨立純診斷契約區分；consumer 尚未存在，不能宣稱使用者介面已改善。

## 家庭流動性資料關聯與診斷子 PR 2 合併快照

- PR／基線：[PR #169](https://github.com/hyc640110/family-universal-rebalance/pull/169) **MERGED**，merge commit `fc1ca090661148ed057420fd9ad2386d9eec03fc`，`mergedAt: 2026-07-28T14:18:03Z`；Deploy GitHub Pages run `30367680077` 成功，headSha 一致。Production／Preview HTTP 200，metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑未混用。
- 已完成範圍：Cash Flow 固定支出可明確選擇既有 `liquidityRole`；選擇 debt-payment 時可選擇目前存在且有效 ID 的 Loan。缺少角色不會自動推測，缺少 Loan 會維持待確認；orphan `linkedLoanId` 保留並顯示待重新選擇，離開 debt-payment 時依既有 normalizer 移除連結。資料在既有 localStorage、Firebase canonical、JSON Backup／Import 的 normalizer 與 round-trip 契約中維持相容。
- Remaining Boundaries：本 PR 未把 diagnostics 接到 Analytics、Risk Center 或 AI Decision，也未修改 Household Liquidity 核心公式、blocking reason code、adapter 正式輸出、schema、Firebase、Backup 或 Import／Export。這些跨模組診斷呈現是 **子 PR 3** 範圍，尚未開始。
- 下一直接起點：子 PR 3 必須先在 Review Mode 唯讀追蹤 `deriveHouseholdLiquidityInputDiagnostics` 與三個正式 consumer 的資料來源、缺失語意、顯示位置、測試邊界與不應重算的界線；不得自行開始開發。
- ADR：無。
- Knowledge Delta：使用者現在可以在 Cash Flow 修正 role、Loan 未連結與 orphan link 等輸入問題；診斷本身仍尚未接到跨模組使用者介面。

## UR-TODO-011 子 PR 011A 合併快照

- PR／基線：[PR #160](https://github.com/hyc640110/family-universal-rebalance/pull/160) **MERGED**，merge commit `47f01f81f484003fb9bfccc89de12d294071d1bb`，`mergedAt: 2026-07-28T08:36:58Z`；CI Verification run `30342857661` 與 Deploy GitHub Pages run `30343104980` 均成功，後者 headSha 一致。
- 已完成範圍：新增純 `deriveDefensiveConfigurationPresentation`，只映射既有上游的防守總比例、受保護安全現金、防守型持股比例、可投資現金、理論缺口、安全現金缺口、可執行方式與阻擋原因。明確 0 維持已知；`null`／`NaN`／`Infinity` 維持 unavailable；不重算或放寬財務／執行資格。
- Remaining Boundaries：防守配置理論缺口目前沒有既有權威來源時必須維持 unavailable，不得在 011B UI 或其他消費端自行推算。011B 已承接 Analytics UI，但未改 Household Liquidity／Rebalance 公式、持久化、Firebase 或 Backup。
- ADR：無。
- Knowledge Delta：UR-TODO-011 已由「待開發」轉為「開發中／子 PR 011A 已完成」，並建立可保留 unavailable／explicit zero 與理論／執行分層的純呈現契約。

## UR-TODO-011 子 PR 011B 合併快照

- PR／基線：[PR #162](https://github.com/hyc640110/family-universal-rebalance/pull/162) **MERGED**，merge commit `f41592d9bf1139488af5c4fb3597d9283f5bd929`，`mergedAt: 2026-07-28T09:35:49Z`；CI Verification run `30346082086` 與 Deploy GitHub Pages run `30347257970` 均成功，後者 headSha 一致。
- 已完成範圍：Analytics 風險頁新增單一唯讀「防守配置狀態」卡片，直接消費 011A 的 `deriveDefensiveConfigurationPresentation` 結果。卡片保留明確 0、資料不足、理論缺口 unavailable 與文字化 blocking reason；Analytics 中重複的「防守資產補足提醒」已移除。桌機與約 390px Preview 驗收通過，無水平溢出或文字截斷。
- Remaining Boundaries：011C 已承接 Cash Flow／CLEC 的「額外投入資金／預計提領資金」名稱一致。剩餘工作僅為治理同步後的 UR-TODO-011 完整收尾盤點；不得擴大至 Dashboard、UR-TODO-043、DipFundingSummary、財務公式或任何持久化契約。
- ADR：無。
- Knowledge Delta：UR-TODO-011 已由「011A 純呈現契約完成」推進為「011A、011B 已完成；Analytics 使用單一防守配置狀態呈現」。

## UR-TODO-011 子 PR 011C 合併快照

- PR／基線：[PR #164](https://github.com/hyc640110/family-universal-rebalance/pull/164) **MERGED**，merge commit `bbc60fe2889c98d7883763d5dae057b257975321`，`mergedAt: 2026-07-28T10:25:58Z`；CI Verification run `30349140005` 與 Deploy GitHub Pages run `30350731155` 均成功，後者 headSha 一致。
- 已完成範圍：CLEC 將既有「計畫投入／計畫提款」統一為 Cash Flow 的正式名稱「額外投入資金／預計提領資金」，並呈現「額外投入資金為本次計畫增加的資金；預計提領資金會先從可用資金扣除。」。Preview 桌機與約 390px 手機驗收通過，沒有名稱重複、水平溢出或文字截斷。
- Remaining Boundaries：不修改 CLEC 核心策略、Cash Flow 儲存流程、Simulator、Dashboard、UR-TODO-043、DipFundingSummary、財務公式、schema、Firebase、Backup 或 migration。下一直接起點為本治理 PR Merge 後的 **UR-TODO-011 完整收尾盤點**；不得自行開始其他 Todo。
- ADR：無。
- Knowledge Delta：UR-TODO-011 已由「011A、011B 完成」推進為「011A、011B、011C 全部完成，待正式收尾」。

## UR-TODO-011 Sprint 6 正式結案快照

- 正式結案：011A／PR #160（純防守配置呈現契約）、011B／PR #162（Analytics 防守配置狀態卡）、011C／PR #164（Cash Flow／CLEC 名稱一致）及治理同步 PR #161、#163、#165 均已由使用者手動 Merge。
- 完成標準：CI、Production build、Preview build、桌機與約 390px Preview 驗收、Production／Preview HTTP 200、environment 與資產隔離、Bundle 驗證與治理同步均已閉環；沒有未完成或越界範圍。
- Remaining Boundaries：**UR-TODO-011 範圍內無未完成邊界**。Dashboard、UR-TODO-043、DipFundingSummary、Household Liquidity／財務核心、schema、Firebase、Backup 與 migration 均未納入本 Sprint。
- 下一位 AI 的直接起點：UR-TODO-043 維持 **P2／待盤點**；若要處理，先以 Review Mode 進行唯讀盤點。未經使用者明確說「開始開發」，不得建立 Branch、開始實作或啟動任何下一個 Todo。
- ADR：無。
- Knowledge Delta：UR-TODO-011 已由「011A、011B、011C 全部完成，待正式收尾」轉為「完整正式結案」。

## UR-TODO-043 建立快照

- 狀態：**P2／待盤點**；已建立「Analytics 每日資產快照休市日變動語意與來源明細」正式 Todo，尚未開始唯讀功能盤點或任何開發。
- 已知邊界：日曆目前依相鄰有效快照比較、同日取最後一筆，並已有非純投資損益提示；尚未證實計算 Bug。後續只可先盤點比較規則、快照建立時機、來源貢獻、同日覆蓋與 UTC／台灣日期邊界。
- 排程：UR-TODO-011 維持目前主線；建議待其完整結案後再處理 UR-TODO-043。除非證實日期偏移、同日覆蓋錯誤、重複計算、外部資金誤列為投資績效，或錯誤資料傳入 Dashboard／AI Decision／Rebalance，否則維持 P2，不插隊。
- 明確不包含：不在本治理 PR 修改日曆 UI、Net Worth／Performance 計算、Firebase、schema、localStorage、JSON Backup 或同步契約。

## UR-TODO-010 Sprint 5 子 PR1 合併快照

- PR／基線：[PR #150](https://github.com/hyc640110/family-universal-rebalance/pull/150) **MERGED**，merge commit `c6bde2df3b6b7cdda3fb069fbba522347efeb0ef`，`mergedAt: 2026-07-27T12:40:11Z`；CI Verification run `30265997330` 與 Deploy GitHub Pages run `30266865442` 均成功，後者 `headSha` 與 merge commit 一致。
- 已完成範圍：CLEC `availableCash`／`cashReserve` 分別接到 Household Liquidity 的 `investableCash`／`protectedSafetyCash`；`plannedContribution`／`plannedWithdrawal` 分別接到 `cashFlowProfile.externalContribution`／`plannedWithdrawal`。資料缺失維持 `null`，不轉 0；`threshold.minCashReserve` 維持 `null`，未啟用 `CASH_RESERVE_LOW`。
- Preview 人工驗收：收支與現金流中心設定額外投入 `30,000` 元、預計提領 `50,000` 元後，CLEC 正確顯示計畫投入 `30,000` 元、計畫提領 `50,000` 元。
- Remaining Boundaries：UR-TODO-010 仍為開發中。Simulator 的 `externalContribution`／`existingInvestableCash`／`protectedSafetyCash`／`plannedWithdrawal` 與 `allowSafetyCashUsage = false` 尚未開始；不得因本次合併自行啟動子 PR2。名稱「額外投入資金／預計提領資金」與「計畫投入／計畫提領」不一致，列為 UR-TODO-011 獨立呈現層輸入。
- 明確不包含：`clecStrategyRules.ts` 核心策略、`clecStrategy.ts` 文案、Simulator、Household Liquidity 核心公式、schema／localStorage／Firebase／JSON Backup。

## UR-TODO-010 Sprint 5 子 PR2A 合併快照

- PR／基線：[PR #152](https://github.com/hyc640110/family-universal-rebalance/pull/152) **MERGED**，merge commit `a42cf5a85ab635efc38b85686acf27cd87ab9f1f`，`mergedAt: 2026-07-27T14:13:17Z`；CI Verification run `30273353805` 與 Deploy GitHub Pages run `30274021196` 均成功，後者 `headSha` 與 merge commit 一致。Production Pages HTTP 200，Production Market Worker `/health` 回傳 `environment=production`。
- 已完成範圍：新增未接線的純 `deriveAllocationSimulatorFunding` selector 與專屬測試。`existingInvestableCash = max(0, totalLiquidCash - protectedSafetyCash)` 僅在兩者已知有效時推導；externalContribution／plannedWithdrawal unavailable 不轉 0，明確 0 保持已知；超額提領回傳 0 並附 blocking／warning；受保護安全現金僅在明確啟用時納入且上限為實際流動現金。
- 明確不包含：Simulator UI、`App.tsx` 接線、checkbox、AppState、schema、localStorage、Firebase、JSON Backup、CLEC 與 Household Liquidity 核心公式。
- 下一直接起點：**子 PR2B 唯讀範圍確認**，必須從最新 `origin/main` 重新確認 Simulator 資料來源與接線邊界；不得自行開始開發或建立分支。**安全現金 checkbox 明確保留給獨立子 PR2C**，PR2B／PR2C 均未授權。

## UR-TODO-010 Sprint 5 子 PR2B 合併快照

- PR／基線：[PR #154](https://github.com/hyc640110/family-universal-rebalance/pull/154) **MERGED**，merge commit `e7f72090401442bc1341bf414e552072f23934ae`，`mergedAt: 2026-07-27T15:44:39Z`；CI Verification run `30279995115` 與 Deploy GitHub Pages run `30281445368` 均成功，後者 `headSha` 與 merge commit 一致。Production Pages HTTP 200，HTML deployment metadata 為 `environment=production`。
- 已完成範圍：App 將正式 `totalLiquidCash`、`protectedSafetyCash`、`externalContribution`、`plannedWithdrawal` 傳入 Simulator。Page 使用既有 selector 並固定 `allowSafetyCashUsage = false`；五欄 funding breakdown 唯讀呈現，受保護安全現金不納入預設模擬資金。
- 呈現與 gate：移除舊「模擬投入金額」本地輸入與清除按鈕；existingInvestableCash 不重複加入 totalAssets。explicit zero 保持已知；unavailable 或超額提領時仍可編輯比例與比較比例視覺，但隱藏具體 funding／交易金額並顯示 blocking／warning。
- Preview 人工驗收：五欄、收支與現金流中心投入／提領同步、安全現金不納入、舊輸入移除、比例調整、explicit zero、桌機與約 390px 手機版皆通過。
- 下一直接起點：**子 PR2C 唯讀範圍確認**。checkbox 僅能是 session-only、預設關閉、使用 selector 的 `usableProtectedSafetyCash` 並顯示高風險警示；不得改變 Household Liquidity、CLEC、交易建議或持久化資料。**不得自行授權或開始 PR2C 開發。**

## UR-TODO-010 Sprint 5 子 PR2C 合併快照

- PR／基線：[PR #156](https://github.com/hyc640110/family-universal-rebalance/pull/156) **MERGED**，merge commit `86602a8b3f810b1bfa9bc4a6eef92b3d3e24ac3e`，`mergedAt: 2026-07-28T01:22:09Z`；CI Verification run `30285097798` 與 Deploy GitHub Pages run `30320047900` 均成功，後者 `headSha` 與 merge commit 一致。Production Pages HTTP 200，HTML deployment metadata 為 `environment=production`，正式 Assets 未混用 Preview。
- 已完成範圍：`AllocationSimulatorPage` 新增「假設動用安全現金」component-local session checkbox，預設 `false`；只把 state 傳入既有 selector。勾選時僅納入 selector 已計算的 `usableProtectedSafetyCash`，不使用安全目標，也不高於實際流動現金。
- 呈現與安全邊界：勾選立即顯示「此為模擬假設，不代表建議實際動用安全現金。」高風險警示（`role="alert"`、`aria-atomic="true"`）；未勾選時安全現金不納入 simulationAvailableFunding。安全現金本已存在 totalAssets，故勾選不增加 totalAssets 或 simulatedTotal。資料 unavailable、usableProtectedSafetyCash 為 `null` 或明確已知 `0` 時 checkbox disabled；超額提領仍完全遵循 selector blocking。
- Preview 人工驗收：預設關閉、勾選／取消恢復、usableProtectedSafetyCash 上限、警示、unavailable／明確 0／超額提領 gate、重整或路由返回恢復關閉、無 AppState／localStorage／Firebase／JSON Backup 回寫，以及桌機／約 390px 手機版均通過。
- 狀態：**UR-TODO-010 子 PR1、子 PR2A、子 PR2B、子 PR2C 均已完成，但整體 UR-TODO-010 仍為開發中。**
- 下一直接起點：**UR-TODO-010 完整收尾盤點**。先唯讀確認剩餘範圍、完整驗收標準與治理文件一致性；未經使用者明確判定，不得自行宣告整體 Todo 已完成、建立後續功能分支或啟動新 Sprint。

## UR-TODO-010 Sprint 5 正式結案快照

- 正式結案：PR #150（CLEC Funding Semantics）、PR #152（Simulator Funding 純模型）、PR #154（Simulator Funding 正式接線與呈現）、PR #156（假設動用安全現金開關與高風險警示）與 PR #157（PR #156 Merge 後治理同步）均已由使用者手動 Merge。
- 基線與驗證：PR #157 merge commit `e6642326d1aaf286b1ac86796afc11495d112149`，`mergedAt: 2026-07-28T01:41:42Z`；Deploy GitHub Pages run `30321000360` success，headSha 一致。Production HTTP 200、`environment=production`，正式 Assets 未混用 Preview。
- 完成標準：程式碼、各子 PR 自動測試、Preview 人工驗收、PR Merge、Production 唯讀驗證與治理文件同步均已閉環；**UR-TODO-010 正式標記為已完成。**
- Remaining Boundaries：UR-TODO-010 範圍內無未完成邊界。收支與現金流中心的「額外投入資金／預計提領資金」與 CLEC 的「計畫投入／計畫提領」名稱差異，屬 UR-TODO-011 的呈現一致性輸入，不回溯擴大本 Todo。
- 下一位 AI 的直接起點：先針對 **UR-TODO-011** 以 Review Mode 進行唯讀盤點；未經使用者明確說「開始開發」，不得建立 Branch 或開始實作。
- ADR：無。
- Knowledge Delta：UR-TODO-010 已由「四個子 PR 完成但待收尾」轉為「完整正式結案」。

## UR-TODO-009 Sprint 收尾快照

- PR／基線：[PR #147](https://github.com/hyc640110/family-universal-rebalance/pull/147) **MERGED**，merge commit `226c6bee75fe4ce8db884c08e63ded1fe08bc7f7`；PR CI run `30236461001`、Deploy GitHub Pages run `30241261199` 均成功（`event: push`、`headBranch: main`、`headSha` 與 merge commit 一致），Production 以 `curl` 實測 HTTP 200（`environment=production`）。
- 已完成範圍：**UR-TODO-009（Risk & Decision Workflow Integration）子 PR 1～7 全數完成**。子 PR7 將 `deriveHomeDecision`（首頁「投資決策首頁」）改用與 Risk Center、AI Decision、`todayDecision` 相同的三層 liquidity 閘門（資料完整性→安全存量→可投資現金），消除先前首頁（6 個月門檻）與 Analytics（3 個月門檻）兩套矛盾門檻，達成 §20.3「結論必須一致」。逐條子 PR 記錄見 `008_TODO_BACKLOG.md` UR-TODO-009。
- 明確不包含：Household Liquidity 核心公式、schema／localStorage／Firebase／JSON Backup、交易功能、分析頁完整 `todayDecision` UI（是否承接完整決策留待產品決策，不新增正式 UR-TODO）。
- Remaining Boundaries：**UR-TODO-009 全數完成；下一主線待評估（UR-TODO-010／UR-TODO-011），目前無已授權主線。** 分析頁完整 `todayDecision` UI 是否承接留待產品決策；UR-TODO-041（負債資料過期警示）、UR-TODO-042（`PortfolioRiskPage.tsx` React 重複 key 既有缺陷）皆維持「待盤點」／「待評估」，不在 UR-TODO-009 範圍內。
- 固定 stash：`e141af1`、`4a0ddb2` 未操作；原工作目錄 `dist/`／`.claude/` 未碰觸。
- 下一主線／下一位 AI 的直接起點：**UR-TODO-009 已全數完成，目前沒有已授權的下一主線**（UR-TODO-010、UR-TODO-011 皆待使用者評估後才授權）。下一次明確授權前，先以最新 `origin/main` 唯讀確認工作目錄與固定 stash；不得自行建立 Sprint、Merge 或部署 Production。

## 3. 基本資訊

- 最後更新時間：2026-07-27
- 更新者／工具：Claude Code（UR-TODO-009 全數完成後治理狀態同步，本次為純文件 Review／Documentation Update，未建立新 Sprint）
- 交接給：（尚未指定，供下一位 AI／工作階段使用）
- 工作模式：
  - [x] Review Mode
  - [ ] Planning Mode
  - [ ] Development Mode

---

## 4. 正式基線

- 正式版本：UR-TODO-010 Sprint 5 子 PR2A — Simulator Funding 純模型與 characterization tests
- 正式 PR：#152（MERGED）
- merge commit：`a42cf5a85ab635efc38b85686acf27cd87ab9f1f`
- Production Pages workflow：`30274021196`（success，本次以 `gh run list --workflow="Deploy GitHub Pages"` 實際查詢確認，`headSha` 與上述 merge commit 一致）
- Production Worker 版本：`market-data-worker-v6.0.5-refresh`；本次 `/health` 實測 `environment=production`
- 正式基線是否已重新驗證：
  - [x] 是（本次以 `gh run list`／`curl` 實際查詢 PR #152 對應 Deploy workflow、Production Pages HTTP 與 Production Worker environment，詳見 `003_CURRENT_STATUS.md` §3）
  - [ ] 否，沿用 `003_Current_Status` 已驗證結果

---

## 5. Repository 狀態

- Repository：`hyc640110/family-universal-rebalance`
- Repository Root：目前 checkout 所在的 Repository 根目錄（依實際環境而定，不固定寫死本機絕對路徑）
- 目前 Branch：`main`
- HEAD：`c6bde2df3b6b7cdda3fb069fbba522347efeb0ef`
- origin/main：同上
- main：同上
- `main...origin/main`：`0 / 0`
- Working tree：本次同步文件所用 branch 乾淨；原工作目錄既有的 `dist/` 差異與未追蹤 `.claude/` 不屬本次同步範圍，未清除、覆蓋或 stash
- Open／Draft PR：無（`gh pr list --state open` 於本次同步前確認為空）
- PR Head：不適用（無進行中 PR）
- Preview：不適用
- 是否存在未提交修改：否（本次治理文件同步尚未 Commit／Push，待使用者確認）
- 是否存在未追蹤檔案：`.claude/`（既有狀態，與本次同步無關）

### 固定 stash

以下固定 stash 以 hash 鎖定（不依可變的 stash index），不得操作：

- `e141af14273b76501c1b287ea018e8728099f1e5`
- `4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`

不得 apply、pop、drop、clear、rename、recreate、overwrite。`9e9aa0c999cf3b97d034db786e4307eaec35e6b2` 是既有其他工作階段的文件同步草稿，**不是固定 stash**；僅可唯讀盤點，未經使用者指示不得操作。

---

## 6. 目前 Sprint

**目前沒有進行中的產品開發 Branch 或 Draft PR。** 家庭流動性資料關聯與診斷修正的子 PR 1（#167）、子 PR 2（#169）與子 PR 3（#171）均已合併；PR #171 merge commit 為 `778767036853bbbab0da7ba64f3df4887c6c0d70`，Deploy GitHub Pages run `30372749694` 為 success。整體 Sprint 的唯一 Remaining Boundary 是：在不修改使用者 Production 本機資料的前提下，仍未能以代表性 diagnostics 資料完成三個正式頁面的 Production 互動驗收，狀態為**待盤點**。不得因此自行啟動其他 Todo。

- Sprint：家庭流動性資料關聯與診斷修正（子 PR 1～3）
- 子 PR 1：#167（診斷契約與 characterization tests，已完成）
- 子 PR 2：#169（Cash Flow `liquidityRole`／`linkedLoanId` UI 與持久化，已完成）
- 子 PR 3：#171（Analytics／Risk Center／AI Decision diagnostics consumer 呈現，已完成）
- 正式基線：`778767036853bbbab0da7ba64f3df4887c6c0d70`
- 不得誤標完成：UR-TODO-043、首頁縮減、資產頁股價更新明細收合、淨資產歷史收合皆不屬本 Sprint，仍未完成。

---

## 7. 已完成工作

- PR #134：UR-TODO-009 子 PR 1／2，`todayDecision`／`investmentHealth` 安全準備（純搬移＋25 個 characterization test），MERGED。
- PR #137：UR-TODO-009 子 PR 3，`riskMetrics.ts` 改讀 Household Liquidity 輸出（013 §22），MERGED。
- PR #140：UR-TODO-009 子 PR 4，Risk Center／Portfolio Risk 呈現層補齊安全存量缺口／可投資現金／資料可信度／重複來源警示，MERGED，Production 驗證通過。
- PR #143：UR-TODO-009 子 PR 5，`todayDecision` 六層優先序改寫並接回首頁「今日決策」，MERGED，Production 驗證通過。
- PR #145：UR-TODO-009 子 PR 6，AI Decision §24 契約、`cash` 決策項改引用 Household Liquidity，MERGED，Production 驗證通過。
- PR #147：UR-TODO-009 子 PR 7，`deriveHomeDecision` 改用相同三層 liquidity 閘門，達成 §20.3 跨模組一致性，MERGED，Production 驗證通過（本次同步以 `gh run list`／`curl` 實際查詢確認）。
- PR #150：UR-TODO-010 子 PR1，CLEC 四個 funding fields 接到 Household Liquidity／Cash Flow Profile，MERGED，Production 驗證通過。
- PR #152：UR-TODO-010 子 PR2A，新增純 `deriveAllocationSimulatorFunding` selector 與專屬測試，MERGED，Production 驗證通過；未接 UI、AppState 或持久化。
- **UR-TODO-009（Risk & Decision Workflow Integration）依此正式標記為已完成**，詳見 `008_TODO_BACKLOG.md`。

歷史記錄（2026-07-24 及以前，僅供脈絡參考，詳見 `009_CHANGELOG.md`）：PR #108（Deploy Workflow Node Runtime／DevDependency Install Failure 修復）、PR #109（跨 AI 交接制度＋Full／Lite Bundle）、PR #110（PR #109 Merge 後治理文件補同步）。

---

## 8. 尚未完成工作

- 家庭流動性資料關聯與診斷修正：唯一 Remaining Boundary 為 Production 代表性 diagnostics 資料的唯讀互動驗收，狀態待盤點；不得把此驗收缺口改寫為核心公式、adapter 或 UI 擴充工作。
- 下一個建議 Todo：UR-TODO-043，僅可先進行 Review Mode 的快照資料流唯讀盤點。未經使用者明確指示，不得建立 Branch 或開始開發。

---

## 9. 已修改檔案

- PR #150 已修改 `src/App.tsx`、`src/lib/clecStrategyRuleAdapter.ts`、`tests/clecStrategyRules.test.ts`；PR #152 已修改 `src/lib/allocationSimulatorFunding.ts`、`tests/allocationSimulatorFunding.test.ts` 與 `package.json` 的 CI 測試入口。本次治理同步只修改 AI_CONTEXT 來源文件與重新產生的 Bundle。

---

## 10. 驗證狀態

- [x] 對應單元測試（`test:ci` 435/435＋18/18＋52 PASS，0 fail）
- [x] 回歸測試（同上）
- [ ] Stability（`test:stability` 未於本次 Hotfix 單獨重跑，涵蓋於 `test:ci:checks`）
- [x] TypeScript（確認 `6.0.3`）
- [x] Production build
- [x] Preview build
- [x] Artifact isolation
- [x] `npm audit --omit=dev --audit-level=high`（0 vulnerabilities）
- [x] `git diff --check`
- [ ] 桌機 1000px 驗收（不適用，本次未修改 UI）
- [ ] 桌機 1600px 驗收（不適用）
- [ ] iPhone Safari 約 390px 驗收（不適用）
- [x] localStorage 相容性（未修改 `src/`，不受影響）
- [x] Firebase 相容性（未修改，不受影響）
- [x] JSON Backup round-trip（未修改，不受影響）
- [x] Preview／Production 隔離（實測確認正常，見 `003_CURRENT_STATUS.md`）

### 驗證結果摘要

- 已通過：npm ci、tsx 驗證、test:ci、TypeScript、Production／Preview build、npm audit、git diff --check、Preview／Production 隔離實測、真實 Ubuntu runner CI（Draft PR 兩次＋正式 Production 部署一次）
- 尚未執行：桌機／手機 UI 驗收（不適用，本次無 UI 變更）
- 失敗項目：無
- 失敗原因：不適用

---

## 11. 已知問題與阻擋

- 阻擋事項：無
- 已知風險：main 的 GitHub 預設分支目前仍是 `gh-pages`（非 `main`），會影響 `gh pr create` 等工具的預設行為（UR-TODO-037 延後範圍）；`main` 無 Branch Protection、無 GitHub Environment 人工核准（同上）
- 尚未確認資訊：Firebase Realtime Database Security Rules 到期日期與影響範圍（UR-TODO-001，P0，仍待盤點）
- 外部服務限制：Price Worker `/health` 本次未重新查詢
- 是否影響 Production：否，Production 已驗證正常
- 是否影響使用者資料：否

---

## 12. 下一位 AI 的直接起點

接手後先執行：

1. 讀取：
   - `000_AI_WORKSPACE_RULES.md`
   - `003_CURRENT_STATUS.md`
   - `008_TODO_BACKLOG.md`
   - 本文件
2. 唯讀確認 Repository：
   - Branch
   - HEAD
   - main／origin/main
   - Working tree
   - Draft／Open PR
3. 比較本文件與 Repository 是否一致。
4. 若一致，再依下方「下一步」繼續。
5. 若不一致，不得自行修正或覆蓋，先回報差異。

### 下一步

- 無強制下一步。先完成家庭流動性資料關聯與診斷修正的 Production 代表性 diagnostics 資料唯讀驗收；其後建議候選為 UR-TODO-043 的 Review Mode 快照資料流盤點。UR-TODO-043、首頁縮減與兩個收合 UI 均不得自行開始。
- 一律先以 Review Mode 完成唯讀初始化，待使用者明確指示後才進入 Development Mode，不得自行選擇並開始下一個 Sprint。

---

## 13. 禁止事項

下一位 AI 未完成初始化前，不得：

- 修改程式
- 建立新 Branch
- Commit
- Push
- Merge PR
- 部署 Production
- 操作固定 stash
- 更新 Firebase schema
- 覆蓋 localStorage／Firebase／JSON Backup 既有資料
- 將 Preview 指向 Production
- 宣稱未驗證的工作已完成

---

## 14. 交接完成條件

交接完成前，下一位 AI 必須回報：

### Workspace

- 目前正式版本
- 目前 Sprint
- Todo 摘要
- 文件是否完整

### Repository

- Branch
- HEAD
- main／origin/main
- Working tree
- PR 狀態
- 固定 stash 是否保持不變

### Assessment

- 是否可繼續工作：YES／NO
- 若 NO，列出阻擋原因

---

## 15. 無進行中工作時的標準內容

若目前沒有未完成 Sprint，可將本文件更新為：

```text
目前無進行中的 Branch、Draft PR 或未完成開發工作。

最新正式狀態請讀取：
- 003_CURRENT_STATUS.md

未完成事項請讀取：
- 008_TODO_BACKLOG.md

下一位 AI 應先以 Review Mode 完成 Workspace 與 Repository 唯讀初始化，
不得自行開始 Coding。
```
