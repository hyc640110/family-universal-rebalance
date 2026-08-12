# Universal Rebalance Changelog

本文件記錄已完成並通過驗收的重要變更。

格式參考 Keep a Changelog，但可依專案實際版本調整。

---

## [Unreleased]

**UR-TODO-046 FX-A3 Foreign Cash Producer / Snapshot Integration（2026-08-13，Draft PR，待 CI／Preview／使用者驗收，尚未 Merge）**：修正真實存在的 mixed-currency naked-sum Production bug——`calculateMetrics()`（`src/App.tsx`）先前把非 TWD `FinancialAccount` 的原幣 balance 直接裸加進 `cash`／`totalAssets`／`netWorth`。新增純函式 `deriveCanonicalNetWorthTotals()`（`src/lib/canonicalNetWorthTotals.ts`），完全重用 FX-A1 既有 `deriveForeignCashValuation()`／`selectUsdTwdReferenceCloseRate()`：TWD 帳戶沿用原 balance，USD 帳戶以有效匯率轉為 pinned TWD 估值，missing／stale rate、unsupported currency 或 invalid balance 一律排除原幣金額並標記相關 totals `unavailable`（使用者拍板 Canonical TWD Totals Strategy = A，不得裸加、不得靜默假裝完整）。`NetWorthSnapshot` 新增加法式 optional 欄位 `cashAvailable`／`totalAssetsAvailable`／`netWorthAvailable`，缺席即視為 legacy／available，不回填不改寫；snapshot 建立當下同步傳入 pinned `fxValuations`（FX-A1 此欄位至此才第一次被實際使用）。無 UI（使用者拍板 FX-A3 MVP UI Strategy = A）、無 schema／Backup version bump、無 migration；Household Liquidity 與 FX attribution 完全未修改。新增 16 個測試，`npx tsc -b`、`test:ci`、Production／Preview build 皆成功，隔離本機 dev server 實機驗證正確。UR-TODO-046 整體仍 OPEN。

**UR-TODO-046 FX-A2 CBC USD/TWD Provider Adapter（2026-08-13，已 Merge／Production Worker Deployed）**：PR [#318](https://github.com/hyc640110/family-universal-rebalance/pull/318) 已正常 Merge，merge commit `3341dfd81e7c1e57fe5d325e85c6303bc5d3b358`；PR CI Verification／`verify` run `31615645452` success，Merge 後 Deploy GitHub Pages `31616344290` success，head 與 merge commit 一致。Production Worker `family-universal-rebalance-market-data-production` 已於 `2026-08-12T16:17:13.176Z` 成功部署 version `7d4221c1-691f-42e4-b1ae-0a48e40603ba`；`/health` HTTP 200、`environment=production`。`/fx-rates/usd-twd?refresh=1` HTTP 200，輸出 normalized `available` USD→TWD reference-close（`rateDate=2026-08-12`、`quotePerBase=32.246`），與 CBC 官方 `FTDOpenData_Day` `NTD_USD` 一致，不回傳 raw CBC rows，採 `cache-control: no-store`。Preview Worker version `b83bc7f0-3f7d-4bb3-9093-93a0b256ba44` 維持 preview isolation；Production／Preview Pages HTTP 200、metadata 正確、assets 未混用。FX-A2 完成 CBC parser／provider adapter、Worker endpoint、callable adapter、`fxRateHistory` deterministic append、same-day conflict fail-safe 與兩環境 Worker rollout；無 schema／Backup version bump、migration 或 legacy rewrite。FX-A3 Foreign Cash Producer／Snapshot Integration 尚未開始；UR-TODO-046 整體仍 OPEN。

**UR-TODO-046 FX-A1 USD/TWD Rate Provenance & Foreign Cash Valuation Foundation（2026-08-12，已 Merge）**：PR [#316](https://github.com/hyc640110/family-universal-rebalance/pull/316) 已正常 Merge，merge commit `62a5a9a8ed269bbac9d6e9370c524356cd3fa5e0`（parents：`98cd44ed2493594b1b67dc22e93f7b55345b2090`、`0c4da369449eea1d20d70b4767bdcba1bcb23002`；`mergedAt: 2026-08-12T15:21:56Z`；`mergedBy: hyc640110`；未使用 admin override）。PR CI Verification／`verify` run `31610595323` success；Preview workflow_dispatch `31611211649` success，source 為 PR final head；Merge 後 Deploy GitHub Pages `31611895289` success，head 與 merge commit 一致。Production／Preview HTTP 200、metadata 正確、assets 隔離正常。FX-A1 將 household valuation currency 定為 TWD，完成 provider-independent USD/TWD `reference-close` rate contract、3 calendar days stale policy、foreign cash valuation foundation、pinned snapshot provenance 與 `fxRateHistory` 的 localStorage／JSON Backup 加法式 persistence；legacy snapshots 保持可讀、沒有 provenance 時不 backfill／recompute／rewrite。FX-A1 本身未新增 live provider／Central Bank API、Worker、UI、FX attribution、conversion、realized FX、foreign investment／loan、Generic Split FX consumer、AI Decision、Rebalance 或 Household Liquidity consumer；provider／Worker 由後續 FX-A2 獨立完成。UR-TODO-046 整體仍 OPEN。

**UR-TODO-001 Firebase Retirement P3-B1 Legacy Contract Adapter（2026-08-11，已 Merge）**：PR [#307](https://github.com/hyc640110/family-universal-rebalance/pull/307) 一般 Merge，merge commit `2770eb2bddf256c4956da95ad0b5ee937495ba6a`（`mergedAt: 2026-08-11T15:06:07Z`；`mergedBy: hyc640110`；未使用 admin override）。採 **Backward-readable, not backward-re-export**：舊 `firebase`、`syncSettings.firebase`、`firebaseConfigured` 可讀；initial hydration write gate 確保首載、reload、read-time normalization、mount effect 不因 legacy-only delta 自動改寫 localStorage，只有 genuine persistent mutation 或明確 Full Restore 才輸出 clean canonical localStorage；clean Backup 不再 fallback 到 `current.firebase`。無 AppState／Backup／Ledger schema bump、無 Migration A；Ledger v1／v2／v3、future opaque schema、void、Atomic Group、Split Allocation、reconciliation、attribution、Backup round-trip 保持原契約。Merge 後 Production workflow `31505208134` success，Production HTTP 200、metadata=`production`、asset=`index-BUPn4cyd.js`；Preview HTTP 200、metadata=`preview`、asset=`index-Blnxpgms.js`，assets 隔離正常。Backup Export cleanup、`syncState.ts`、`autoSync`／`autoSyncSec`、`syncMeta`、`VITE_FIREBASE_BASE_PATH`、browser auth session 與 P4 Firebase Console 尚未處理；P3-B2 未開始。

**UR-TODO-001 Firebase Retirement P3-A1（2026-08-11，已 Merge）**：P2-A 已由 PR #304 Merge（merge commit `339f8c305a419117af54f4dbd69a3b47b903a26c）；P3 Repository 唯讀盤點已完成。PR [#305](https://github.com/hyc640110/family-universal-rebalance/pull/305) 正常 Merge，merge commit `78e50c3d09f122b18d968ebcddf0bd2b52bf177f`（`mergedAt: 2026-08-11T14:20:24Z`；`mergedBy: hyc640110`；未使用 admin override）。P3-A1 移除零 production caller 的 Firebase Anonymous Auth runtime module、Firebase RTDB URL builder runtime module、直屬 tests、`VITE_FIREBASE_API_KEY`、程式端 API key 與 Auth session key constant，production Firebase Auth／RTDB runtime reference = 0。Merge 後 Production workflow `31500994060` success，Production／Preview HTTP 200、metadata 分別為 `production`／`preview`，assets 路徑隔離正常。`VITE_FIREBASE_BASE_PATH`、legacy AppState／Backup Firebase contract、`syncState.ts` 與 Financial Event Ledger（含 `mergeFinancialEventLedgers()`）刻意未處理；既有瀏覽器 Auth session 未清除。P3-B 尚未開始，必須先完成 legacy Firebase 欄位 read-time／localStorage／JSON Backup 相容策略產品決策；P4 與 Firebase Console／RTDB／Auth provider／Rules／Project 操作均未開始。

**UR-TODO-001 Firebase Retirement P0 Governance-only（2026-08-11）**：使用者拍板方案 B 分階段 retirement；治理文件定義 localStorage 為唯一 canonical runtime state、JSON Backup 為人工備份／搬移／災難復原，並鎖定 Financial Event Ledger 的 localStorage／JSON Backup persistence 與核心契約。原始 Security Rules Expiry／Anonymous Auth Phase（PR #252）歷史維持已完成、不被改寫。P1～P4 尚未開始；本次無 runtime、Firebase Console、Production 資料或部署變更。

**UR-TODO-046-L2C-P1 Forensic Conclusion／L2C-P2 Firebase Missing-Ledger Compatibility Guard（2026-08-10）**：P1 唯讀 Production raw-state evidence 確認已盤點的 local Ledger 為 schema v1、空事件陣列，Firebase UID raw state 完全沒有 Ledger 欄位，故沒有可 recovery 的 FinancialEvent event；未選 authoritative side、未做 recovery／conversion／union。PR [#300](https://github.com/hyc640110/family-universal-rebalance/pull/300) 由使用者授權正常 Merge，merge commit `9a4463b75564dfce3b73c5f57c6edb53118792af`（`mergedAt: 2026-08-10T16:40:00Z`；`mergedBy: hyc640110`）；CI Verification／`verify` run `31409415184` success，Deploy GitHub Pages run `31410135891` success，Production HTTP 200、environment=production、App root 與正式 bundle 正常。P2 在 raw remote payload 同時缺少 `financialEventSchemaVersion`／`financialEvents` 時建立 runtime-only `missing-ledger` fail-safe，在 merge、synthetic Ledger、remote normalize／apply、`flushDrafts()`、local persistence 與 PUT 前停止；不改 local Ledger、`financialEventAttributionStartDate`、sync baseline 或 remoteMeta，且 status 不進 localStorage、JSON Backup 或 Firebase。既有 v1／v2／v3、future schema、event-id collision taxonomy 不變；未新增 migration、recovery、conversion、Firebase SDK 或跨版本語意合併。

**UR-TODO-046-L2C Cross-Version Sync Recovery & Status Contract Audit／L2C-P0 Sync Status Contract Fix（2026-08-10）**：PR [#298](https://github.com/hyc640110/family-universal-rebalance/pull/298) 已由使用者授權正常 Merge，merge commit `af79903f547f498194cbe9b383a90cabdf28afdd`（`mergedAt: 2026-08-10T14:16:08Z`；`mergedBy: hyc640110`）；PR CI Verification／`verify` run `31396033551` success，Merge 後 Deploy GitHub Pages run `31397236443` success，Production HTTP 200、environment=production、App root 與正式 bundle 均正常。L2C Audit 確認 local v1／remote v2 mixed-version merge reject 是既有 fail-safe；Production 舊「目前支援 v2」為 stale persisted `syncMeta.status`，無 localStorage 或 Firebase Ledger 資料損毀證據。L2C-P0 將 sync failure 改為 runtime-only、動態 status contract：reload 不會把舊 persisted error 當 current runtime status；schema mismatch UI 依當次 local／remote schema、current writer schema 與 supported versions 重建，writer schema 與 supported versions 明確分離。merge reject 採 structured、非字串解析 taxonomy：`schema-version-mismatch`、`unsupported-future-schema`、`event-id-collision`；mixed-version 與 collision 均維持 GET → validate／merge → reject → no-PUT，download reject 在建立新 state 前停止、local Ledger unchanged，無 partial merge、downgrade 或覆寫。未新增 migration、v1→v3／v2→v3 conversion、cross-version semantic merge、authoritative-side selection、recovery workflow 或 Ledger rewrite；UR-TODO-046 整體仍未結案。

**UR-TODO-046-L2A Split Allocation Contract Audit／L2B Generic Split Allocation Foundation（2026-08-10）**：PR [#296](https://github.com/hyc640110/family-universal-rebalance/pull/296) 已由使用者 Merge，merge commit `a355a3986f45f7bd15b61bc1d3f93f06ad633a41`（`mergedAt: 2026-08-10T12:23:50Z`、`mergedBy: hyc640110`）；PR CI Verification／`verify` run `31386340292` success，Deploy GitHub Pages run `31387817114` success，Production smoke verification（HTTP 200、environment=production、App root、正式 JavaScript bundle）通過。L2A 完成 Atomic Group 與 schema boundary audit；L2B 將 FinancialEvent Ledger 升至 schema v3，generic split 以完整 economic event 的 Atomic Group 持久化，Ledger 維持唯一 persistent SSOT。只有 same domain／transactionId／account／currency／effectiveDate、component identity 唯一、完整且 amount-conserving 的 group 可以 attribution／reconciliation；partial、under-sum、over-sum、duplicate、unsupported 或 Void component 均 fail-safe 不消費。修正採 forward-only：Void old group 後 append complete replacement group；`replacementOfGroupId` 本身不會作廢舊 group，replacement 必須使用 fresh allocationGroupId 與 event ids。v2 client 對 v3 Ledger 保留 opaque payload 且不進 attribution、reconciliation 或 derived-evidence suppression；future schema 同樣 fail-safe。localStorage／JSON Backup／Firebase v3 round-trip 維持，v2/v3 mixed-version merge 與 event-id collision different payload 一律 reject、不得 PUT／downgrade／partial merge；partial Firebase union 在完整前不歸因。Loan L1 principal／interest／fee／penalty semantics 不變。未新增 UI、CSV、Import Center、Investment／FX consumer、Loan UI、AI Decision、Rebalance、Dashboard、migration 或既有資料改寫；UR-TODO-046 整體仍未完成，FX attribution 與尚未授權 consumer mapping 保留後續獨立決策。

**UR-TODO-046-L1 Loan Repayment Contract & Fail-safe Attribution Foundation（2026-08-09）**：PR [#294](https://github.com/hyc640110/family-universal-rebalance/pull/294) 已由使用者授權並以既定 admin merge 例外合併，merge commit `b88c35511be509a84ba756a9a075df6d047154ad`（parents：`1a80d08bdc5371fe3bb0a0a67ef533571db2214a`、`0f82d999b4e04d414a8e00160b1a5a7915992407`；`mergedAt: 2026-08-09T17:01:56Z`；`mergedBy: hyc640110`）；Deploy GitHub Pages run `31325341109` success，Production smoke verification（HTTP 200、environment=production、App root 與正式 JavaScript bundle）通過。本次新增明示、加法式 `FinancialTransaction.loanAttribution?` contract 與 FinancialEvent schema v2 optional `componentLink`。完整 TWD repayment 的 principal = 0，interest／fee／penalty 僅在明示 component 可證明時為一次負 contribution，loan disbursement = 0；20,000 repayment（principal 15,000＋interest 5,000）最終僅為 `-5,000`，不另產生 `external-expense -20,000`。缺 contract、component sum、identity、linkage 或 TWD 時維持 unsupported／residual，不猜測也不自動更新 Loan principal。`componentId` 在同一 loan identity domain 不得跨 payment 重複，`appendFinancialEventGroup()` 在 API 寫入邊界自行執行完整 repayment contract／transaction／cash linkage／group 驗證；沒有正式 Loan contract 的 `expense-housing`，即使有既有 linked `external-expense` Ledger event，也不得因房貸文字或泛用分類形成 contribution。完整、全部 posted 的 component group 才可確認與消費；pending／mixed／excluded／void component 令整組不生效，任一 component Void 暫停整組，僅 fresh 完整 group 可重新辨識。Ledger confirmed、runtime evidence、duplicate payment／component identity 及明示 cash movement 均有防重複；v1 Ledger 可讀、v1/v2 Firebase Ledger 不安全混合拒絕，localStorage／JSON Backup／Firebase 與 legacy normalizer 保持相容，無 migration。已驗證 788 unit／Risk 3／MJS 18、TypeScript、Production／Preview build、Full Bundle 22/22、Lite Bundle 6/6 與 `git diff --check`；最終獨立審查 PASS、Merge Blocker：無。未處理 split allocation、FX attribution、Loan UI／CSV／Import Center mapping、holding replay、realized gain/loss、Household Liquidity、CLEC、AI Decision、Rebalance 或 Dashboard。

**UR-TODO-046-I1 Investment Trade Contract & Fail-safe Reconciliation Foundation（2026-08-09）**：PR [#292](https://github.com/hyc640110/family-universal-rebalance/pull/292) 已 Merge，merge commit `b8621a0bf5e13a7666b360829e276d6d87019a44`；Deploy GitHub Pages #339（run `31299929750`）success，Production smoke verification 通過。新增向後相容 `FinancialTransaction.investmentAttribution` discriminated union，並完成 `income-other` regression、fee／tax settlement 防重複與 trade＋cash movement fail-safe 收斂。完整正式 TWD buy／sell 優先於 generic taxonomy，對應 `investment-buy`／`investment-sell`、本金 contribution = 0；一般、未附完整 trade contract 的 `income-other` 維持 `external-income`。fee／tax 僅在明確 `costId`、`settlementCostTreatment: independent`、唯一正式 trade 關聯皆成立時產生一次負 contribution；`included`／`unknown`／legacy／重複／無關聯一律不扣除。另建 cash movement 必須有 explicit `cashMovementId`、`kind: cash-movement`、方向、相同帳戶與幣別的唯一對應；Ledger confirmation／runtime derived evidence／Void 均維持防重複。dividend reinvestment 中 dividend 保留一次外部增加、buy = 0；non-TWD 維持 FX unsupported／residual，未建立 realized gain/loss contribution。採 additive fields，無 schema bump／migration；localStorage／JSON Backup／Firebase／legacy normalizer 相容。UR-TODO-046 整體仍未完成，split allocation、loan principal／interest attribution、FX attribution 未納入。

**UR-TODO-046 C3B Runtime Attribution Composition（2026-08-05）**：PR [#246](https://github.com/hyc640110/family-universal-rebalance/pull/246) 已由使用者最終授權 Merge（ChatGPT 完成架構審查與人工財務案例驗收後正式核准），merge commit `c30db10b69f7f1b3a8c88390028f4abac46246a4`。新增 `runtimeAttributionComposition.ts`：`netWorthChange = ledgerContribution + derivedContribution + unexplainedResidual`；Ledger evidence 優先於 derived evidence；只有 C1／C2 reconciliation candidate 才能產生 derived contribution，matched／duplicate／ambiguous／unsupported／invalid 一律排除；同一 transactionId 最多計算一次 derived contribution；沿用 C3A 的 `Asia/Taipei` calendar-day 日期契約；adjustment／internal-transfer 皆為零效果；非 TWD 無正式 FX conversion 時 fail-safe 排除；`reconciled` 只代表 residual 落在 tolerance 內，不代表完整歸因；derived evidence 為 runtime-only，不偽裝成 persisted event。未新增 schema、persistence、Firebase Ledger sync、migration、Ledger write-back、UI 或 AI Decision／Rebalance／Household Liquidity wiring。UR-TODO-046 整體仍為部分完成；下一候選（C3C 呈現／使用者確認、Firebase Ledger sync 等）皆屬重大事件，需另行拍板。

**UR-TODO-046 C3A Pure Runtime Derived-Evidence Adapter（2026-08-02）**：PR [#244](https://github.com/hyc640110/family-universal-rebalance/pull/244) 已 Merge，merge commit `0fd1955bfe6267e55072bf2278114f70aa11f98e`。新增純 `deriveRuntimeDerivedAttributionEvidence()`，只消費 C1／C2 的安全 `candidate`，依 `Asia/Taipei` canonical calendar-day `openingSnapshot.date < effectiveDate <= closingSnapshot.date` 產出 runtime-only `derived-transaction` evidence。external income／expense、dividend 可保留正負 contribution；internal transfer 與 adjustment 保持零效果；matched、duplicate、ambiguous、unsupported、invalid 均排除。未接線 calculator、未改 quality、未寫 Ledger、無 schema、persistence、Firebase、JSON Backup、migration、legacy rewrite、UI 或核心 consumer 變更。046-C3B（正式 calculator integration）仍屬重大產品決策，未開始。

**UR-TODO-046 C1／C2 Pure Transaction Reconciliation（2026-08-02）**：PR [#242](https://github.com/hyc640110/family-universal-rebalance/pull/242) 已 Merge，merge commit `b8b9a4d212917444e313ef22649461a843273bdb`。新增純、deterministic、唯讀的 `reconcileTransactions()`：每筆交易僅回傳 `matched`／`candidate`／`unsupported`／`ambiguous`／`duplicate`／`invalid` 之一；既有 taxonomy 能證明者才列 candidate，投資、借款、FX 與不明分類不猜測。C2 僅診斷既有 Ledger 的 linked match、duplicate 與相似 manual ambiguity；pending linked 不作 completed-period evidence，void 不消費 transaction。未修改 schema、persistence、Firebase、JSON Backup、migration、Ledger、attribution calculator、UI、AI Decision、Rebalance 或 Household Liquidity；UR-TODO-046 整體仍部分完成，046-C3 需另行盤點與授權。

**UR-TODO-046 B Pure Attribution Calculator／Quality Model（2026-08-02）**：PR [#240](https://github.com/hyc640110/family-universal-rebalance/pull/240) 已 Merge，merge commit `d61e0aa270bf006acb7000e2c1b3be0fc0f68264`。新增未接線的純 `deriveNetWorthAttribution()` calculator／quality model，品質狀態僅為 `unavailable`／`snapshot-only`／`partial`／`reconciled`；輸出 classified contribution 與 explicit unexplained residual，並明確禁止把 residual 宣稱為 market effect。未修改 schema、persistence、Firebase、migration、UI、AI Decision、Rebalance 或 Household Liquidity。UR-TODO-046 整體仍為部分完成；下一候選 046-C existing transaction reconciliation 為重大事件候選。

**UR-TODO-046 C1 Financial Event Ledger contract／persistence foundation（2026-08-02）**：PR [#238](https://github.com/hyc640110/family-universal-rebalance/pull/238) 已由使用者最終授權 Merge，merge commit `ef42c2408c989bc56c4ee1d31986161c7628ed2f`。C1 新增 forward-only Ledger contract、future-schema opaque fail-safe、現有 taxonomy 可證明的 linked transaction validation 與 transaction duplicate-consumption guard；持久化僅為 AppState、localStorage、JSON Backup／Full Restore。**不含 Firebase Ledger sync**：現有 root PUT 不具 mixed-version Ledger 安全性，需另開重大階段。未做 migration、legacy rewrite、split allocation schema、attribution calculator、事件輸入 UI 或 AI Decision／Rebalance／Household Liquidity consumer wiring；UR-TODO-046 整體仍為部分完成／後續待評估。

**UR-TODO-043 正式結案（2026-08-02）**：結案前唯讀最終盤點確認 043-A、C1、C2、C3-A、C3-B、B1、B2、B3 全數完成；Analytics 現況沒有 043 範圍內殘留程式 Bug 或需最小修正的語意缺口。現行資料模型能證明快照欄位與兩期差額，但不能證明市場漲跌、投入、提領、股息、現金或負債的個別來源貢獻；此核心資料缺口已正式由 UR-TODO-046 承接，043 不重做。UR-TODO-043 標記為已完成；B4 不需要、C4 未觸發；UR-TODO-046 維持待評估且對 043-B 的依賴已解除。390px 長文裁切維持獨立待盤點，不納入本 Todo。

**UR-TODO-043-B3 Canonical Date Contract Producer／Consumer Wiring 正式完成（2026-08-02）**：PR #235 已 Merge，merge commit `b783d2af974271bbbb2ec64149802d746c98e06b`，正式基線推進至此 SHA。Producer、History／Performance range cutoff、Calendar today/month identity 共用 `Asia/Taipei` canonical day；same-day selection 維持 deterministic last-occurrence，不引入 timestamp semantics。`test:ci` 680 項、TypeScript、Production／Preview build、CI verify `30738055541`、Pages workflow `30738107227` 均成功。未修改 schema、migration、legacy dates、NetWorthSnapshot type、C3 classification semantics 或核心財務模組。043-B（B1～B3）正式完成；B4 未觸發且不需要，UR-TODO-043 原始 Analytics 語意／來源貢獻事項仍待盤點。

**UR-TODO-043-B1/B2 Canonical Calendar Day／Deterministic Same-Day Snapshot Selection 正式完成（2026-08-02）**：PR #233 已 Merge，merge commit `0e3c80404be4eb5452835b0497f3274c8edca62c`，正式基線推進至此 SHA。新增固定 `Asia/Taipei` 的 canonical calendar-day helper，以及依輸入序列最後一筆勝出的共享同日 snapshot selector；未新增 timestamp、schema、migration 或改寫既有資料。History、Analytics、Calendar 與 C3 read-time boundary 共用選擇契約。`test:ci` 675 項、TypeScript、Production／Preview build、CI verify `30737460836`、Pages workflow `30737504196` 均成功；C4 未觸發。043-B 其餘範圍維持待盤點。

**UR-TODO-043-C3 Consumer Wiring 正式完成（2026-08-02）**：C3-A 已由 PR #229 完成，C3-B 已由 PR #231 Merge，merge commit `a755c7ed9c0c3987989c3890fdfa615ae6a7c092`，正式基線推進至此 SHA。History、Analytics、Calendar 使用共享 read-time boundary，保留 valid `0`、missing、invalid、non-finite 四分類與部分 snapshot；Dashboard 與 `aiDecision.ts` 未直接修改，因 App 已提供既有統計／AI／Risk 輸入邊界所需的完整資料。`test:ci` 659 項、TypeScript、Production／Preview build、CI verify `30736102179`、Pages workflow `30736227380` 均成功；C3 整體完成，C4 未觸發。043-B 僅列為下一候選，尚未開始或做產品決策；既存 390px 長文裁切僅列為待盤點，非本次範圍。

**UR-TODO-043-C3-A Read-time Snapshot Boundary 正式完成（2026-08-02）**：PR #229 已 Merge，merge commit `e663e5d0dcda6117e75dcd972fcef6c336e2cf97`，正式基線推進至此 SHA。建立平行 raw／classified read-time view，保留 `valid`／`missing`／`invalid`／`non-finite` 四分類與 valid `0`／missing 差異；localStorage、Firebase download、Backup import 均在 legacy normalization 前建立 view。未修改 AppState／persistence schema、不做 migration、不改寫既有 snapshot。`test:ci` 655 項、TypeScript、Production／Preview build、CI verify `30735211163`、Pages workflow `30735283065` 均成功；C4 未觸發，後續 C3-B 已由 PR #231 完成。

**UR-TODO-035 市場頁「重新取得」按鈕回歸確認正式結案（2026-08-02）**：以正式基線 `2bc1b1716c176b07bab4e11cbdc96c48ad1d52a2` 完成唯讀與隔離實機回歸，確認 click handler 實際送出 `/market-summary?refresh=1&request=<nonce>`，使用 `cache: no-store` 與 `Accept: application/json`，Loading、Success、Partial failure、Full failure 及再次重試皆符合驗收；Console 無產品 error／warn，Preview／Production Worker boundary 未混用。Treasury 上游格式不完整屬外部資料問題，不阻擋本 Todo 結案，不建立 Hotfix。此次僅同步治理文件並重新產生 Full／Lite Bundle。

**UR-TODO-011（Cross-Module Presentation Consistency）Sprint 6 正式結案**：011A／PR #160 建立純防守配置呈現契約，011B／PR #162 在 Analytics 風險頁完成單一「防守配置狀態」卡並移除重複提醒，011C／PR #164 統一 Cash Flow 與 CLEC 的「額外投入資金／預計提領資金」名稱與輔助說明。治理同步 PR #161、#163、#165 均已 Merge；完整收尾盤點確認自動測試、Production／Preview build、桌機與約 390px Preview 驗收、Production 唯讀驗證與 Bundle 治理均已閉環。未修改 Dashboard、UR-TODO-043、DipFundingSummary、財務公式或持久化契約。

**UR-TODO-011 子 PR 011C（Cash Flow／CLEC 名稱一致）已完成**：PR #164 已 Merge，CLEC 的「計畫投入／計畫提款」改為與 Cash Flow 一致的「額外投入資金／預計提領資金」，並新增簡短資金語意說明。此變更僅限呈現與測試入口；未修改 CLEC 核心策略、Cash Flow 儲存、Simulator、財務公式或持久化。Preview 桌機與約 390px 手機驗收通過；Deploy GitHub Pages run `30350731155` 成功，Production／Preview 均完成唯讀驗證。

**UR-TODO-011 子 PR 011B（Analytics 防守配置狀態卡）已完成**：PR #162 已 Merge，Analytics 風險頁改以 011A 的既有 presentation contract 顯示單一「防守配置狀態」卡片，涵蓋防守比例、安全現金、防守型持股、可投資現金、理論／安全現金缺口、可執行方式與阻擋原因；原本重複的「防守資產補足提醒」已從 Analytics 移除。未重算財務公式、未修改持久化，明確 0、unavailable 與 blocking reason 均維持既有契約。Preview 桌機與約 390px 手機驗收通過；Deploy GitHub Pages run `30347257970` 成功，Production／Preview 均完成唯讀驗證。

**UR-TODO-011 子 PR 011A（防守配置呈現契約）已完成**：PR #160 已 Merge，新增純 `deriveDefensiveConfigurationPresentation` 與專屬測試，讓後續 UI 可使用一致的防守比例、受保護安全現金、防守型持股、可投資現金、理論缺口、安全現金缺口、可執行方式與阻擋原因呈現模型；不重算財務公式、不接 UI 或持久化。`null`／無效數值維持 unavailable，明確 0 保持已知，理論缺口未有既有權威來源時不自行推算。

**UR-TODO-009（Risk & Decision Workflow Integration）全數完成**：子 PR 1～7 皆已由使用者手動 Merge 並通過 Production 驗證，詳見 `008_TODO_BACKLOG.md` UR-TODO-009 逐條記錄。

**UR-TODO-010（CLEC & Simulator Funding Semantics）Sprint 5 正式結案**：PR #150、#152、#154、#156 與 Merge 後治理同步 PR #157 均已 Merge；完整收尾盤點確認功能、測試、Preview、Production 與治理條件已閉環。

### Added
- 治理：新增 **UR-TODO-043**（P2／待盤點），追蹤 Analytics 每日資產快照休市日變動的呈現語意、比較基準與來源明細；尚未開始功能盤點或開發，不宣稱為計算 Bug，且不改變 UR-TODO-011 目前主線。
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
- UR-TODO-010 正式標記為「已完成」：PR1 完成 CLEC funding semantics；PR2A 建立純 Simulator funding selector；PR2B 完成正式資料接線與五欄呈現；PR2C 完成預設關閉的安全現金假設與高風險警示。下一候選為 UR-TODO-011，尚未授權開發。
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

- UR-TODO-011 子 PR 011A：PR #160（merge commit `47f01f81f484003fb9bfccc89de12d294071d1bb`）已 Merge；CI Verification run `30342857661` 與 Deploy GitHub Pages run `30343104980` 均成功，後者 headSha 一致。Production／Preview HTTP 200，metadata 分別為 `environment=production`／`environment=preview`，Assets 路徑隔離正常。

- UR-TODO-010 Sprint 5 結案：PR #157（merge commit `e6642326d1aaf286b1ac86796afc11495d112149`）已 Merge；Deploy GitHub Pages run `30321000360` 成功，headSha 與 merge commit 一致。Production HTTP 200、`environment=production`，正式 Assets 未混用 Preview；完整收尾盤點確認 PR #150、#152、#154、#156、#157 的程式碼、測試、Preview、Production 與治理條件全數閉環。

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
