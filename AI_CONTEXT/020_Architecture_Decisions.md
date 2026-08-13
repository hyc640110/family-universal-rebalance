# Universal Rebalance Architecture Decisions

版本：v1.9

最後更新：2026-08-13

## 0. 文件定位

本文件是 Universal Rebalance 的 **Architecture Decision Record（ADR）** 記錄檔，收錄跨模組、跨 Sprint 仍持續適用的架構決策——「為什麼這樣做」，而不是「做了什麼」。

本文件不是：

- `009_CHANGELOG.md` 的替代品：完成歷史、PR 清單仍以 Changelog 為準，本文件只記錄決策本身，不記錄每次 PR 的變更細節。
- `013_HOUSEHOLD_LIQUIDITY_SPEC.md` 的替代品：家庭流動性模型的公式、契約、Blocking Reason 等實作細節仍以 013 為唯一正式來源；本文件只收錄「為什麼採用這個模型邊界」層級的決策。
- `016_Product_Decisions.md` 的替代品：產品定位、審查機制、產品原則屬於產品治理決策，記錄於 016；本文件只收錄技術架構層級的決策。

新增或修改 ADR 的時機，依 `012_AI_HANDOVER.md` §2「狀態性文件同步時機」的判斷原則，屬於「需要跨多個 PR 綜合判斷才能寫出的內容」，可留待 Sprint 結束或明確的階段性收尾點才整理，不需要每個 sub-PR 都更新。

## 1. 條目格式

每筆 ADR 依業界慣例包含四個欄位：

- **標題**：一句話描述決策本身。
- **狀態**：`已採用`／`已取代`／`草案`。已取代的 ADR 需標註取代它的新條目編號，不得直接刪除舊條目（保留決策演變歷史）。
- **背景**：促成這個決策的問題、限制或觀察，需可追溯到具體的 PR、Sprint 或唯讀盤點報告。
- **決策**：實際採用的做法，需明確到「未來的 PR 應該怎麼做」的程度，不是空泛原則。
- **後果**：採用這個決策後，帶來哪些好處、哪些取捨、哪些未來工作需要延續遵守這個決策。

## 2. 條目索引

| 編號 | 標題 | 狀態 |
|---|---|---|
| ADR-001 | V7.0B 採漸進式整合（Strangler Pattern），逐步將 `App.tsx` 內的舊邏輯抽出為純函式並接上 Household Liquidity | 已採用 |
| ADR-002 | Dip Alert 明確分離「訊號」與「資金資格」語意 | 已採用 |
| ADR-003 | Generic Split Allocation 採 Atomic Group、FinancialEvent Ledger SSOT 與 schema v3 opaque boundary | 已採用 |
| ADR-004 | Firebase 跨裝置同步採 P1～P4 漸進式 retirement，localStorage／JSON Backup／Ledger 保持獨立 | 已採用 |
| ADR-005 | Firebase Retirement 採 Archived Retirement，以 runtime removal、access freeze 與 verified archive 取代強制 destructive deletion | 已採用 |
| ADR-006 | FX-A1 採 pinned USD/TWD foreign-cash valuation provenance，與 conversion、Ledger 及 attribution 分離 | 已採用 |
| ADR-007 | FX-A2 採 CBC FTDOpenData_Day JSON 經 Market Data Worker 的 fail-safe provider boundary | 已採用 |
| ADR-008 | FX-A3 canonical TWD totals 採 unavailable propagation，禁止 mixed-currency naked sum 或靜默排除 | 已採用 |
| ADR-009 | Transaction 層 mixed-version compatibility 採 domain-neutral 的 per-transaction opaque envelope，與 `FinancialEvent` 的 opaque 機制分開設計但同源精神 | 已採用 |
| ADR-010 | FX opaque producer 上線採 Controlled Rollout Policy：pre-F1A／stale client 無法被 retroactively 保護（正式 architecture constraint），改用 narrow code-constant feature gate 做 risk reduction，非 absolute guarantee | 已採用 |
| ADR-011 | FX conversion pairing identity 採 envelope-id-as-identity、pinned-leg-amounts、derived-not-persisted executed rate 與 fee 四態 contract；Foundation／Producer／Attribution 三層明確分離 | 已採用 |
| ADR-012 | FX conversion principal legs 沿用既有 `expense`／`income` type，搭配 additive `fxConversionLeg` metadata 作為最小 consumer safety boundary；Producer 不得先於 Consumer Guard 上線 | 已採用 |

---

## ADR-012：FX conversion principal legs 沿用既有 `expense`／`income` type，搭配 additive `fxConversionLeg` metadata 作為最小 consumer safety boundary；Producer 不得先於 Consumer Guard 上線

**狀態**：已採用

**背景**：ADR-011（FX-F2B）建立 pairing identity 後，UR-TODO-046 FX-F2C（Manual FX Conversion Producer Contract Review，Review Mode）盤點既有 `TransactionType`（`income`／`expense`／`transfer`／`adjustment`）與交易建立 pipeline，證實沒有一個既有 type 能乾淨承載 FX conversion 兩腿語意：`deriveTransactionAccountBalances()` 對 `adjustment` 恆為加（無法表示扣款），`transfer` 是單一記錄模型且 `validateTransferAccounts()` 明確拒絕跨幣別（`'目前尚未支援跨幣別轉帳'`）。若暫用 `expense`（source）／`income`（destination）——現有唯一能給出正確帳戶餘額方向的組合——`deriveTransactionAccountBalances()` 確實正確，但 `transactionCashFlowSummary()` 會把兩腿 `t.amount` 原始加總、不做任何幣別換算，誤算成 household expense／income；`transactionReconciliation.ts` 的 `fx-attribution-unsupported` fail-safe 只依 `transaction.currency !== 'TWD'` 判斷，TWD leg（`currency === 'TWD'`）會**通過**此檢查、被靜默分類為普通 `external-expense`，進而可能被消費進 Financial Event Ledger／淨值成長歸因計算——這是會產生真實錯誤數字的邏輯缺陷，不是「尚未支援」的中性狀態。F2C 判定 **GO C：Producer 不得先裸上線，須與 Minimal Consumer Guard 同一 Sprint 具備**。

**決策**：

1. **不新增第五種 `TransactionType`，不重新定義 `transfer` 語意**——FX conversion principal legs 繼續使用既有 `expense`（source）／`income`（destination），保留 `deriveTransactionAccountBalances()` 既有正確行為，避免大範圍修改帳戶餘額計算與既有 `transfer` 資料的既有假設。
2. **新增 additive `FinancialTransaction.fxConversionLeg?: { conversionId: string; role: 'source' | 'destination' }`**，比照既有 `investmentAttribution`／`loanAttribution` 的 additive discriminated union 慣例。刻意不保存 `amount`／`currency`／`accountId`／`executedRate`／`fee`——這些事實已存在於交易本身或（未來）opaque envelope payload，重複保存會製造第二套互相競爭的 authoritative facts，違反 ADR-011 已建立的單一事實來源原則。`conversionId` 預期未來等於 `OpaqueFinancialTransactionEnvelope.id`（ADR-011 既有 conversion identity），但本決策不建立、不要求任何 producer 或 envelope 的存在。
3. **Consumer guard 範圍嚴格限定三處**：`transactionCashFlowSummary()` 排除帶有效 `fxConversionLeg` 標記的交易（不論 `type`），比照既有 `transfer` 零效果慣例；`transactionReconciliation.ts` 新增 unconditional guard，帶 `fxConversionLeg` 一律 `unsupported`／`fx-attribution-unsupported`，判斷純以 metadata 是否存在為準（不依 `currency === 'TWD'` 等間接條件），確保 TWD／USD、source／destination 四種組合對稱、一致；一般交易刪除路徑（`deleteTransaction`）新增 linkage guard，重用 ADR-011 既有 `resolveFxConversionEnvelope()`，只有 `valid`-resolved 的 envelope 才視為「active」、才阻擋刪除，malformed／missing-linked-transaction 的 envelope 不構成阻擋（延續 F1A Preserve≠Interpret 原則）。**不修改** `deriveTransactionAccountBalances()`、`deleteOpaqueTransaction()`、`FinancialEvent`、runtime attribution composition、Household Liquidity 公式。
4. **Foundation／Producer／Attribution 三層分離（ADR-011 §9）進一步細分**：Consumer Guard（本 ADR，UR-TODO-046 FX-F2C-1）必須先於或同 Sprint 於 Producer（UR-TODO-046 FX-F2C-2：manual FX 表單、opaque write path、Preview-only gate enable）完成，Producer 不得單獨先上線（即使只 Preview）——因為污染本質是邏輯錯誤而非環境未就緒，Preview-only 無法單獨解決此缺口。

**後果**：`fxConversionIdentity.ts` 首次被 `App.tsx` 呼叫（`findLinkedFxConversionId()`，僅限刪除防護這一個唯讀用途），F2B 原本「零 caller」的 regression test 已同步更新為「僅此一個授權呼叫點，其餘 producer／write path 符號仍必須為零」。本決策**不建立**任何 producer、UI、opaque write path、`fxConversionAttribution`，也**不代表** F1D gate（ADR-010）可以被翻轉——`FX_OPAQUE_PRODUCER_SOURCE_GATE` 仍為 `false`。未來 F2C-2 Producer Sprint 建立 opaque envelope 後，仍須另行明確授權，不因本 ADR 已建立 consumer guard 而自動解鎖；atomic FX delete（`deleteOpaqueTransaction()` 一併刪除兩腿）亦留給 F2C-2 與完整 FX UI 一起落地，本 ADR 只確保「腿不會被單獨刪除留下孤兒」，尚未提供「一次刪除整筆換匯」的能力。

---

## ADR-009：Transaction 層 mixed-version compatibility 採 domain-neutral 的 per-transaction opaque envelope，與 `FinancialEvent` 的 opaque 機制分開設計但同源精神

**狀態**：已採用

**背景**：FX-F1 Pre-Implementation Gate Audit（UR-TODO-046）證實 `FinancialTransaction` 的 `normalizeCandidate()` 是封閉欄位白名單重建（`{ id, accountId, ...(named fields only) }`，不做 `...record` spread），任何未來新增的、目前 client 不認識的欄位會被靜默丟棄——不同於 `FinancialEvent` 已有的三層 opaque 機制（已知事件的 spread 保留、v3 envelope 搭便車既有 `void` 排除語意、whole-Ledger unsupported-version 原樣保留）。`FinancialEvent` 的機制無法整套照搬：`FinancialTransaction` 是可編輯／可硬刪除的 producer（帳戶餘額、收支統計、Household Liquidity 的直接輸入），consumer 數量遠多於唯讀的 `FinancialEvent` attribution evidence，且沒有像 `void` 這種「已被舊 runtime 天然排除、且無使用者可互動 UI」的既有安全值可以借用。

**決策**：新增 domain-neutral 的 `OpaqueFinancialTransactionEnvelope`（`transactionOpaqueEnvelopeVersion` 明確 discriminator＋`id`＋不解讀的 `payload`），作為與 `FinancialTransaction` 分開、但在同一個 `AppState`／同一個持久化文件內共存的型別。`AppState` 以兩個獨立欄位（`transactions: FinancialTransaction[]`、`opaqueTransactions: OpaqueFinancialTransactionEnvelope[]`）取代把 `FinancialTransaction` 直接改成 union 的做法，讓既有 consumer 的型別簽章與行為完全不變（opaque 記錄在型別層級就不可能被誤讀進財務計算）；但在 localStorage／JSON Backup 的原始 JSON 上，兩者於持久化邊界（`serializeTransactionCollection()`）合併回單一 `transactions` 欄位，維持與任何其他版本 client 讀寫同一個欄位名稱的相容性，不新增第二套 store 或 localStorage key。`normalizeTransactions()` 明確三分：已知合法交易（沿用既有驗證邏輯）、明確帶 opaque marker 的記錄（原樣保留 `payload`，不解讀）、格式錯誤（含 marker 本身格式錯誤）一律 skipped——validation-failure 絕不能被誤判為 opaque。opaque 記錄不可編輯，只能在明確不可逆確認後刪除。

**後果**：任何未來需要在 `FinancialTransaction` 引入目前 client 無法安全理解的新經濟語意（不限於 FX——investment／loan 未來的擴充亦可比照），都可以先讓舊版 client 安全地「不理解但不丟失、不誤算」，而不必每次都設計一套特製的相容機制。此決策不授權任何具體的新 transaction 經濟語意（`fxConversionAttribution` 等）、不追溯保護既有 `investmentAttribution`／`loanAttribution` 的 mixed-version 弱點（兩者維持現狀，若未來要補強須另行唯讀盤點與授權）、不修改 `FinancialEvent` Ledger 或其 opaque 機制本身。`TRANSACTION_SCHEMA_VERSION` 常數的角色維持不變（僅記錄用途，不參與 runtime 判斷）；此 opaque envelope 是「structural shape detection」而非「version number gate」，這與 `FinancialEvent` 的 `isV3OpaqueFinancialEventEnvelope()` 判斷方式一致。

---

## ADR-010：FX opaque producer 上線採 Controlled Rollout Policy：pre-F1A／stale client 無法被 retroactively 保護（正式 architecture constraint），改用 narrow code-constant feature gate 做 risk reduction，非 absolute guarantee

**狀態**：已採用

**背景**：ADR-009（FX-F1A）建立 opaque envelope 後，UR-TODO-046 FX-F1B（Consumer Guard Audit，Review Mode）逐一核對 account balance、cash-flow、reconciliation、runtime derived evidence、runtime attribution composition、Investment、Loan、Generic Split、Household Liquidity 等既有 consumer，確認全數以 `readonly FinancialTransaction[]` 型別簽章隔離，opaque 在編譯期即無法傳入計算——**consumer 本身不是問題**。真正的 blocker 是：pre-F1A（或任何尚未載入 F1A 程式碼的 stale tab）client 的 `normalizeTransactions()` 完全不認識 opaque marker，會把它誤判為格式錯誤而 skip；且該 client 的 `readStateWithSnapshotView()`／`writeState()` 是 root-overwrite（全量覆蓋 `localStorage`），只要該 client 執行任何一次持久化寫入（包含完全不需使用者操作的 boot-time hydration write），就會把該筆 opaque 記錄從 localStorage 永久抹除——此結論已直接以 `git show` 讀取 pre-F1A 版本的 `src/lib/transactions.ts`／`src/App.tsx` 原始碼證實，非推測。UR-TODO-046 FX-F1C（Producer Rollout / Minimum-Reader Compatibility Contract Review，Review Mode）進一步評估三個技術方案（Minimum Reader Version Gate、Producer Capability Version、Build/Stale-Tab Detection），逐一證實它們的共同弱點完全相同：**保護機制的本質是「新程式碼」，而「舊 client」的定義就是「沒有新程式碼」**——這是 SPA 架構下無法用資料格式設計解開的邏輯迴圈，因為任何 persistence-layer 的判斷邏輯都必須先被下載、解析、執行才能生效，pre-F1A client 的 JS bundle 裡完全不存在會讀取這些新欄位或做這些新判斷的程式碼。

**決策**：
1. **明確列為正式 architecture constraint**：任何 persistence-layer（資料格式層）的相容性設計，只能保護「執行該設計程式碼的 client」，無法對「該程式碼發布前就已載入記憶體、且此後不再重新載入該程式碼」的 client 產生任何保護效果。這不是 F1A／F1B／F1C／F1D 特定設計的缺陷，未來任何新增的 opaque capability（不限於 FX）都適用此限制，不得重新開放討論「是否真的無法保護舊 client」。
2. **Preserve ≠ Interpret 邊界維持不變**：opaque 記錄可以被保存（persist）、顯示 placeholder、刪除；但不能被計算（account balance、cash-flow）、reconciliation、attribution、rebalance、liquidity 或任何形式的 AI 解讀。任何違反此邊界的 consumer 都是缺口，需獨立唯讀盤點與修正，不屬於本 ADR 授權範圍。
3. **不建立 general persistence concurrency guard**（revision token、`storage` event、BroadcastChannel、lock、multi-tab last-write-wins 保護）。stale-tab overwrite 與一般 multi-tab last-write-wins 是同一個既有根本問題，但 opaque rollout 真正需要的是「時序保證」（所有 client 已升級）而非「並發保護」，兩者投資效益不對等，此類 general guard 留給未來獨立評估，不與 FX producer rollout 綁定。
4. **改採 Controlled Rollout Policy**：以 **narrow、code-constant（source constant）的 feature gate** 取代任何依賴 persistence 欄位的 retroactive 方案，搭配既有 Preview／Production environment boundary（`environmentBoundary.ts`／`environmentIdentity()`）作為第二層防護——gate 的作用是**防止 Production 意外過早啟用第一個 opaque producer**，不是保護 legacy client。UR-TODO-046 FX-F1D 落地此決策：新增 `src/lib/fxOpaqueProducerGate.ts`，`deriveFxOpaqueProducerCapability(sourceGateEnabled, deploymentEnvironment)` 為長期可重用的純函式 contract（`sourceGateEnabled && deploymentEnvironment === 'preview'`），`isFxOpaqueProducerEnabled()` 讀取 hardcoded `FX_OPAQUE_PRODUCER_SOURCE_GATE = false`；Production 在任何 source gate 值下永遠不滿足此 contract。gate 本身不需要、也未新增任何 Vite env 或 schema／persistence 變更。
5. **第一個 opaque FX producer 需要獨立明確授權**：即使 source gate 未來被翻成 `true`（僅限 Preview），仍不等於「已解決 legacy client 風險」，只代表「已排除 Production 意外過早啟用」這一項風險。正式解鎖前至少應包含：adoption window（依實際裝置／分頁使用節奏判斷，不得假設每日使用）、manual upgrade confirmation SOP、JSON Backup 前置、Preview producer 驗收通過、rollback policy（flag OFF＋redeploy，不刪除已存在的 opaque 記錄）。

**後果**：本決策明確禁止任何未來 PR 把「已建立 feature gate」包裝成「已解決相容性問題」的宣稱——**risk reduction ≠ absolute compatibility guarantee**，這句話本身必須在未來任何相關 PR 說明、governance 文件或使用者溝通中保留，不得被簡化或省略。第一個 opaque FX producer（以及未來任何其他 domain 的 opaque producer）上線前，必須先確認 gate 為 Production OFF、Preview 依當時授權狀態，且使用者已理解「此為風險降低機制，非保證」後才可繼續。`fxConversionAttribution` 本身、FX rate provider／valuation、Investment／Loan attribution、Generic Split、`FinancialEvent` schema 均不受本決策影響，亦不因本決策自動被授權開始。

---

## ADR-011：FX conversion pairing identity 採 envelope-id-as-identity、pinned-leg-amounts、derived-not-persisted executed rate 與 fee 四態 contract；Foundation／Producer／Attribution 三層明確分離

**狀態**：已採用

**背景**：ADR-010（FX-F1D）落地 controlled rollout gate 後，UR-TODO-046 FX-F2A（Repository Audit，Review Mode）逐一盤點現有 FX Foundation（FX-A1/A2/A3），證實其只能證明「單一外幣現金帳戶單一時點的 TWD 估值」，完全無法證明「兩筆 `FinancialTransaction` 共同構成一次換匯」——現有 Repository 對此**沒有任何 pairing identity 機制**，且既有唯一的兩腿關聯型別（`transfer` type）在 `validateTransferAccounts()` 明確拒絕跨幣別（`'目前尚未支援跨幣別轉帳'`），結構上不可重用。FX-F2B（Pairing Identity Contract Review，Review Mode）進一步逐一比較 Investment（`tradeId`）、Loan（`paymentId`／`componentId`／`confirmationGroupId`）、Generic Split（`allocationGroupId`／`componentId`／`replacementOfGroupId`）、`FinancialEvent`（`voidedEventId`）四種既有 identity pattern，並修正 F2A 兩項候選 contract 的潛在缺陷：(1) `executedRate` 不得與兩腿金額同時形成三個互相競爭的 authoritative facts，應為 deterministic derived 值；(2) missing fee evidence 不得解讀為 `fee=0`，必須能區分「明確無 fee」「有 explicit fee」「fee 狀態未知」。

**決策**：
1. **Conversion identity ＝ `OpaqueFinancialTransactionEnvelope.id`**（UR-TODO-046 FX-F1A 既有型別），payload 內不另存 `conversionId`，避免同一件事有兩個 identity。
2. **Leg identity直接使用既有 `FinancialTransaction.id`**（`sourceTransactionId`／`destinationTransactionId`），不新增獨立的 `legId`。
3. **第一版嚴格限定 TWD↔USD**（雙方向皆支援，不限單一方向），不泛化到其他貨幣對或 foreign↔foreign——現有 rate provenance foundation（FX-A1/A2）僅涵蓋此貨幣對，擴大範圍等同從零開始建立新 foundation，非本次範圍。
4. **`sourceCurrency`／`destinationCurrency`／`sourceAmount`／`destinationAmount` 為 payload 內 pinned validation copy**，比照既有 Investment（`InvestmentTradeAttribution`）／Loan（`LoanRepaymentAttribution`）的 denormalized-copy-with-cross-validation 慣例（與 linked transaction 對應欄位不一致即整筆 invalid，不得猜測修復）；`accountId` 不存於 payload，一律從 linked transaction resolve（`FinancialAccount.currency` 為單一固定值，兩腿天然不可能共用同一帳戶，重複保存無新增驗證力）。
5. **`executedRate` 永不持久化**，只作為 runtime 驗證通過後的衍生結果欄位；canonical quote convention 固定 `TWD per USD`，不論換匯方向為何皆是同一單位；CBC reference-close rate（`fxValuation.ts`／`cbcFxProvider.ts`）與 executed rate 是完全獨立的兩個事實，前者永遠不得作為後者的 SSOT 或替代品。
6. **Fee 採四態 contract**：`none`（明確宣告無 fee）、`explicit`（指向另一筆獨立 `FinancialTransaction`）、`included`（明確宣告已內含於某腿金額，不拆分）、`unknown`（未宣告，fail-safe）。缺失 `feeTreatment` 欄位視為 payload 格式錯誤（`malformed-payload`），不得預設為 `none`。`explicit` 型別若對應的 `feeTransactionId` 找不到，只讓 fee 本身的 resolution 退化為 unresolved，principal conversion（兩腿本身）不受影響，仍可為 `valid`——principal 與 fee evidence 的 validity 是分開判定的兩件事。`unknown`／`included` 的 resolution 結果不得包含任何金額欄位，防止下游誤讀出一個推算出來的 fee 金額。
7. **Raw conversion 為 immutable**，未建立 `replacementOfGroupId` 同類的 forward-only replacement 機制；修正模式為刪除舊 envelope、建立帶新 id 的新 envelope（比照既有 F1A opaque「不可編輯，只能刪除」契約），attribution 層（未來 `FinancialEvent`）的 void／replacement 是完全獨立的機制，留給未來 Attribution Sprint。
8. **Missing linked transaction 時**：opaque envelope 仍 preserve（不因引用消失而被連帶刪除），resolver 回 `unsupported`，不 throw、不自動修復、不自動刪除——延續 ADR-009 的 Preserve≠Interpret 原則。
9. **Foundation／Producer／Attribution 三層明確分離**，不得合併為單一 Sprint：Foundation（type、pure parser／validator／resolver，UR-TODO-046 FX-F2B 本次範圍）→ Producer（manual FX 表單、two-leg creation、opaque write path、Preview-only gate enable，需 ADR-010 授權）→ Attribution（`FinancialEvent` 接線、reconciliation 修改、runtime composition、zero-effect contribution，需另行拍板）。任何單一 PR 若跨越這三層邊界，屬重大產品／核心財務語意事件，須另行拍板，不得自動開始。

**後果**：`src/lib/fxConversionIdentity.ts` 建立後，未來 Producer Sprint 只需重用既有 `parseFxConversionPayloadV1()`／`resolveFxConversions()` 等 pure 函式，不需要重新設計 identity 邏輯；未來 Attribution Sprint 的 `FinancialEvent` 只需連結 `envelope.id`（＝conversion identity）這一個 canonical linkage，不需要疊加第二層 identity。`effectiveDate` 的精確來源公式（是否需要使用者在表單額外輸入，或由兩腿 `occurredAt` 規則決定）與 fee `none`／`included` 兩態在 UI 上如何「明確宣告」而非「預設留空」，仍未拍板，留給 Producer Sprint 依產品需求決定，**不得假設兩者已有預設答案**。本決策不授權任何具體的 producer 開發、`fxConversionAttribution` 或 `FinancialEvent` 修改；ADR-010 的 Controlled Rollout Policy（Production 恆為 OFF、風險降低非絕對保證）完全不受本決策影響，第一個 opaque FX producer 仍需獨立明確授權。

---

## ADR-008：FX-A3 canonical TWD totals 採 unavailable propagation，禁止 mixed-currency naked sum 或靜默排除

**狀態**：已採用

**背景**：唯讀盤點證實既有 `calculateMetrics()`（`src/App.tsx`）的 `financialAccountLiquidTotal()`／`financialAccountNetWorthContribution()` 完全不讀取 `FinancialAccount.currency`，把非 TWD 帳戶（例如 USD）原幣 balance 直接裸加進 `cash`／`totalAssets`／`netWorth`（TWD 100,000 + USD 1,000 會變成錯誤的 101,000）。FX-A1（ADR-006）已建立 pinned USD/TWD valuation 能力，但依其決策範圍刻意未接既有 totals；此缺口需要一個明確的 canonical totals 契約，而非各 consumer 各自猜測。

**決策**：canonical TWD totals（`cash`／`totalAssets`／`netWorth`）只使用 TWD-valued amount：TWD 帳戶直接採用 balance；非 TWD 帳戶只有在 FX-A1 valuation 回傳 `status: 'available'` 時才計入其 TWD 估值。任何帳戶的 valuation 為 `missing-rate`／`stale-rate`／`unsupported-currency`／`balance-unavailable` 時，該帳戶原幣金額一律排除（貢獻 0，不得裸加、不得用 stale／missing rate 猜值），並將受影響的 total 標記為 `unavailable`（`NetWorthSnapshot` 新增加法式 optional 欄位 `cashAvailable`／`totalAssetsAvailable`／`netWorthAvailable`）——不得靜默排除後讓 total 看起來完整。availability 依帳戶類型 cascade：liquid-type（cash/bank/eWallet）帳戶不可估值時 `cashAvailable=false`；任一帳戶（含非 liquid type）不可估值時驅動 `totalAssets`／`netWorth` 的 `accountNetWorth` unavailable。舊有（legacy）snapshot 缺少這三個欄位時一律視為 available，不回填、不重算、不改寫。snapshot 建立當下同步 pin FX-A1 的 `fxValuations`，provider revision／rate refresh 不得改寫已 pinned 的歷史 snapshot。

**後果**：Dashboard／Assets／Analytics／Net Worth History 等既有 consumer 透過共用 `calculateMetrics()` SSOT 自動獲得正確數字，無需逐頁修改。新 availability 欄位為 additive optional，無 schema／Backup version bump、無 migration。此決策不授權 FX attribution、conversion、realized FX、foreign investment／loan、Financial Event／Ledger、Generic Split、AI Decision、Rebalance 或 Household Liquidity（`householdLiquidityInputAdapter.ts` 維持既有非 TWD 帳戶 `unavailable` fail-safe，不因 Net Worth 已可 TWD valuation 而自動放寬）；亦不新增任何 UI 或 FX-A2 startup／render auto-fetch。未來若要把已估值的外幣現金接回 Household Liquidity 可投資現金池，須另行唯讀盤點與產品決策。

---

## ADR-007：FX-A2 採 CBC FTDOpenData_Day JSON 經 Market Data Worker 的 fail-safe provider boundary

**狀態**：已採用

**背景**：FX-A1 已定義 USD/TWD `reference-close`、`1 USD = quotePerBase TWD`、3 calendar days stale policy 與 immutable-style history，但刻意未指定 live source。CBC 現行官方 `FTDOpenData_Day` JSON 提供日期與 `NTD_USD`；其跨來源 CORS 不可作為 Pages 前端可靠契約，且 provider raw data 不應流入 App persistence boundary。

**決策**：FX-A2 唯一採用 CBC `https://cpx.cbc.gov.tw/api/OpenData/FTDOpenData_Day`，由既有 Market Data Worker 的新增 `GET /fx-rates/usd-twd` route 取得。Worker 必須驗證 raw array 的每一列都有合法 `日期` 與正數 `NTD_USD`，對 duplicate date 的不同值 fail-safe，並只回傳 normalized `available`／`unavailable` contract；不得使用 BP01D01en、HTML scrape、Yahoo／臺灣銀行 fallback、硬編碼或猜測。前端 adapter 只在 `available` 時追加 deterministic CBC record，重用 FX-A1 stale policy；同日同值 idempotent、不同值不得覆寫。Worker 不自行宣告 stale 的最終 truth，App domain 維持 FX-A1 policy 的最終判定者。

**後果**：Provider endpoint 與 raw-shape 變化被隔離在 Worker；失敗永遠不會製造 rate 或改寫既有歷史。此決策不授權 UI、auto-fetch、totals、snapshot producer、FX attribution、conversion、realized FX、foreign investment／loan、Financial Event／Ledger、AI Decision、Rebalance 或 Household Liquidity consumer。Preview Worker 可作為驗收環境；Production deploy 仍須經獨立授權與 PR Merge。

---

## ADR-006：FX-A1 採 pinned USD/TWD foreign-cash valuation provenance，與 conversion、Ledger 及 attribution 分離

**狀態**：已採用

**背景**：UR-TODO-046 FX audit 證實既有非 TWD evidence 必須 fail-safe 排除；裸 Net Worth snapshots 沒有原幣部位、匯率、來源或時間，不能把 residual 改稱 FX。帳戶雖可保存 `currency`，但既有 totals 是裸數字相加，直接接入 USD 會擴大 Dashboard、Household Liquidity 與決策 consumer 的風險。

**決策**：FX-A1 將 household valuation currency 定為 TWD，第一版只定義 USD/TWD `reference-close` rate，固定方向 `1 USD = quotePerBase TWD`。rate history 為加法式且 immutable-style；每日 foreign-cash valuation 最多可使用 3 calendar days 的 previous rate carry-forward，並保存 rate id、pinned rate value、rate date、staleness、原幣金額與 TWD result 於新 snapshot optional provenance。TWD 帳戶不建立假 TWD/TWD rate；無 rate、stale、unsupported 或 legacy snapshot 一律不產生可用 FX valuation。FX valuation rate 不得承載 conversion execution rate、spread、fee 或成本基礎。

**後果**：新快照可重現已保存的 valuation，不依賴 provider 後續 revision；舊快照保持 legacy／residual。FX-A1 不接 provider、Worker、UI、既有 totals、FinancialEvent、Ledger 或 attribution calculator。未來 FX attribution 必須另定 signed evidence taxonomy；conversion、realized FX、foreign investment 與 foreign loan 均為獨立 domain contract。

---

## ADR-001：V7.0B 採漸進式整合（Strangler Pattern），逐步將 App.tsx 內的舊邏輯抽出為 src/lib/ 純函式並接上 Household Liquidity investableCash，而非一次性重構 App.tsx

**狀態**：已採用

**背景**：

`013_HOUSEHOLD_LIQUIDITY_SPEC.md`（現行版本 v4.0）第 12～14 節定義了 Rebalance、Order Helper、Dip Alert 等模組都必須改用 `investableCash`（家庭流動性核心模型輸出）作為現金基準，取代原本各自直接讀取 `m.cash`（原始帳戶現金總額）的做法。這是一次跨越 `App.tsx` 內多個獨立計算函式（`getOrderSuggestions`、`dipAlertRows` 等）與多個 UI 呈現元件（`DipOpportunityAnalysis`、`DipAlertCard`、Order Helper 卡片等）的變更，且 `App.tsx` 本身是一個超過兩千行、混合狀態管理、業務邏輯與 UI 呈現的單一檔案，直接對它做大規模一次性重構風險高（`004_DEVELOPMENT_GUIDE.md` §4「高風險跨模組開發規則」明確要求高風險重構須先唯讀盤點、鎖定資料契約、建立純函式核心、完整單元測試，才逐模組接入）。

實際執行中（UR-TODO-008，PR #116～#127），每個涉及 `investableCash` 串接的模組都採用相同的兩階段模式：先做「安全準備」（characterization test，把邏輯原封不動抽出為 `src/lib/` 下的純函式，鎖住既有行為，例如子 PR 4a 抽出 `getOrderSuggestions` 到 `rebalanceOrderHelper.ts`、子 PR 5a 抽出 `dipAlertRows` 到 `dipAlertEngine.ts`），再做「行為串接」（真正接上 `investableCash`，例如子 PR 4b、子 PR 5b）。每個階段各自成一個獨立、可獨立 Review、可獨立 Merge 的 Draft PR。

**決策**：

V7.0B（Financial Liquidity Core，對應 013 §12～14 與 UR-TODO-008～011）採用 **Strangler Pattern（絞殺者模式）**：`App.tsx` 內每個需要接上 `investableCash` 的既有邏輯區塊，依「抽出（characterization）→ 串接（behavior change）」兩階段，逐一移到 `src/lib/` 下的獨立純函式模組，`App.tsx` 保留為呼叫端（import 純函式並傳入資料），不對 `App.tsx` 做一次性整體重構。

具體規則（供未來子 PR 依循）：

1. 每次只處理一個邏輯區塊（例如一個計算函式或一組緊密相關的計算），不得在同一個 PR 內同時處理多個不相關區塊。
2. 「抽出」階段必須是純粹的行為保留（no logic, formula, or output change），並補齊 characterization test 鎖定既有行為，才能進入「串接」階段；兩階段各自是獨立 PR，不得合併成一個 PR 一次做完（例外：若邏輯區塊極簡單、抽出後行為改變範圍可在同一個 PR 內完整驗證，可由使用者明確指示合併處理）。
3. 抽出後的純函式與其型別放在 `src/lib/` 下，`App.tsx` 內對應的舊本地宣告（type、function、const）一律移除、改以 `import` 取得，不得保留重複定義造成兩份程式碼漂移。
4. 共用的基礎工具函式（例如 `normalizeSymbol`、`safeNumber`、`SYMBOL_NAMES`）若已存在於某個 `src/lib/` 模組，新的抽出模組應直接 `import` 重用，不得複製一份，維持單一事實來源。
5. 每個純函式模組須有對應的 `tests/*.test.ts`，因為 `App.tsx` 本身因 `import.meta.env` 在模組頂層的使用，無法被 `tests/*.test.ts`（`tsx --test` 執行環境）直接 import，這是本模式能夠成立的技術前提。

**後果**：

- 好處：每個子 PR 範圍小、可獨立 Review、可獨立回退；`App.tsx` 的行數隨每個子 PR 逐步下降（例如子 PR 4a 使 `App.tsx` 淨減少約 109 行）；純函式模組天生可測試，不受 `import.meta.env` 限制。
- 取捨：同一個邏輯區塊會產生兩個 PR（抽出＋串接）而非一個，總 PR 數量增加，短期內對「一次看懂完整變更」不友善，需要靠 `009_CHANGELOG.md` 與 `003_CURRENT_STATUS.md` 的逐次記錄補足脈絡。
- 延續要求：V7.0B 尚未處理的區塊（例如 CLEC `availableCash` 語意，UR-TODO-010／Sprint 5；`RebalanceRecommendationPage.tsx` 呈現層文案）未來啟動時，應延續本 ADR 的兩階段模式，不得因為「反正已經做過幾次」就跳過 characterization 階段。
- 何時可視為此模式的目標達成：當 `App.tsx` 內不再有需要接上 `investableCash` 但尚未抽出的計算邏輯（即 013 §12～14 涵蓋範圍全部完成純函式化）時，本 ADR 可標記為「已完成其歷史階段性任務」，但不代表 Strangler Pattern 本身失效——未來其他需要跨模組重構的高風險工作仍應優先考慮同一模式，是否沿用由當時的 Architecture Review 判斷。

---

## ADR-002：Dip Alert 明確分離「訊號」與「資金資格」語意，triggered 欄位永遠只反映純價格判斷，資金資格另立 fundingStatus 欄位，不得因安全存量或可投資現金不足而回頭改變 triggered 值

**狀態**：已採用

**背景**：

`013_HOUSEHOLD_LIQUIDITY_SPEC.md` §14.1 明確規定「Dip Signal 是市場或價格條件訊號，不是資金資格」，§14.2 進一步定義五列狀態矩陣，要求同一個跌幅訊號在不同的資料完整度／安全存量／可投資現金組合下，應該呈現不同的資金資格結果（僅顯示資料不足／補現金優先／僅觀察不產生買單／可形成受預算限制的買入建議），但矩陣的第一欄「跌幅訊號」本身只有「有」或「無」兩種值，不隨資金狀態變化。

V7.0B 子 PR 5a（PR #126）先將 `dipAlertRows` 的純價格判斷邏輯（`triggered`、`status`、`drawdownPct`）抽出為 `getDipAlertRows`（依循 ADR-001 的兩階段模式），子 PR 5b（PR #127）在不改變這段既有邏輯的前提下，新增 `fundingStatus` 欄位落實 013 §14.2 矩陣。實作過程中曾評估是否讓「安全存量不足」或「可投資現金為 0」直接讓 `triggered` 一併回頭變成 `false`（讓使用者看起來像「沒有訊號」），但這會讓 `triggered` 這個欄位失去單一、穩定的語意——同一筆跌幅、同一組門檻設定，只因為家庭當下現金狀態不同，訊號本身時而存在時而消失，破壞「訊號」作為客觀市場觀察結果的定位，也會讓依賴 `triggered` 的既有呼叫端（`getDecisionSummary`、`DipOpportunityAnalysis`）的既有行為與 characterization test 全部失效。

**決策**：

Dip Alert（以及未來任何「訊號＋資金資格」性質的功能）必須將兩者拆成兩個獨立欄位：

1. `triggered`（訊號）：只由價格輸入（目前價格、波段最高價、跌幅門檻、是否啟用）決定，任何家庭流動性／資金狀態的變化都不得回頭修改這個欄位的值。
2. `fundingStatus`（資金資格）：獨立的分類欄位（Dip Alert 目前為 `'no-signal' | 'data-insufficient' | 'safety-cash-priority' | 'observe-only' | 'executable'`），由 `triggered` 與家庭流動性欄位（`investableCash`／`dataCompleteness`／`safetyCashShortfall`）共同決定，`triggered === false` 時一律回傳 `'no-signal'`，不再往下判斷資金狀態。

UI 呈現層依循 013 §14.3：訊號區塊（跌幅、門檻等純價格資訊）與資金資格區塊（可投資現金／本次可執行加碼／未滿足理論需求，或對應的限制說明文字）必須分開顯示，不得合併成單一句子（例如不得只顯示「建議加碼 50,000 元」），避免使用者把「訊號已觸發」誤解為「已經可以下單」。

**後果**：

- 好處：`triggered`／`status` 的既有 characterization test（子 PR 5a 建立的 17 個測試）在子 PR 5b 加入資金資格判斷後**逐字未變**，證明了語意分離確實達成；`fundingStatus` 可獨立測試（013 §14.2 矩陣的 5 列 + 邊界案例），不需要重新驗證價格判斷邏輯。
- 取捨：`DipAlertRow` 型別多一個欄位，下游消費者（`getDecisionSummary`）若要呈現「資金感知」的摘要文字，需要額外讀取 `fundingStatus`（子 PR 5b 已示範：`dipStatus` 新增資金狀態感知後綴，但 `triggeredDipAlerts` 的計數邏輯本身不受影響）。
- 延續要求：未來任何「訊號類」功能（例如再平衡門檻觸發、其他機會訊號）若同時涉及資金資格判斷，應比照本 ADR 的欄位拆分方式，不得將訊號判斷與資金判斷寫在同一個布林值或同一個計算路徑內。
- 與 ADR-001 的關係：本 ADR 是 ADR-001 兩階段模式（抽出→串接）在 Dip Alert 這個具體模組上的直接產物——「抽出」階段鎖住訊號行為，「串接」階段才新增資金資格欄位，兩者能夠乾淨分離正是因為採用了漸進式整合而非一次性重構。

---

## ADR-003：Generic Split Allocation 採 Atomic Group、FinancialEvent Ledger SSOT 與 schema v3 opaque boundary

**狀態**：已採用

**背景**：

UR-TODO-046-L2A 的 Repository audit 確認，跨 domain 的 split allocation 若讓不同 component 各自被視為獨立 financial event，會產生 partial-valid、amount 不守恆、重複 transaction consumption 與 derived-evidence 錯誤壓制風險。audit 同時確認既有 v2 client 無法安全理解 generic split 的新經濟語意；僅以加法式 record shape 延伸會使舊 runtime 有將未知 payload 當成正常 FinancialEvent 消費的風險。PR #296（UR-TODO-046-L2B）將此 contract 與 compatibility boundary 正式實作並合併至 main。

**決策**：

1. 同一 `allocationGroupId` 的 components 是一個不可拆分的完整 economic event。只有 same domain、transactionId、account、currency、effectiveDate、group-local componentId uniqueness、completeness 與 amount conservation 全部成立的 group，才可進入 Ledger attribution、group-to-transaction reconciliation 與 derived-evidence suppression。
2. FinancialEvent Ledger 是 generic split 的唯一 persistent SSOT；runtime derived evidence 不得偽裝為 persisted FinancialEvent，也不得另建第二套 persistent split store。
3. 任一 component Void 令 whole group invalid。修正僅採 forward-only：append Void old group 後，另 append 使用 fresh allocationGroupId 與 fresh event ids 的 complete replacement group；`replacementOfGroupId` 本身不得隱式作廢或取代舊 group。
4. FinancialEvent schema v3 是 generic split 的 opaque compatibility boundary。v3 client 正常 normalize 合法 v3 group；v2 client 與任何 future unsupported client 必須保留 opaque payload，但不得進 runtime attribution、reconciliation、transaction consumption 或 derived-evidence suppression，亦不得 downgrade 或自動 migration。
5. Firebase 合併只接受可安全合併的同版本 Ledger；v2/v3 mixed-version、future unsupported schema 或同 event id 但不同 payload 一律 fail-safe reject，拒絕後 upload path 不得 PUT。partial group 的 Firebase union 可保留，但完整前不得被消費。

**後果**：

- 好處：economic completeness、amount conservation、void 與 replacement 都在同一 group contract 下驗證，避免部分 component 造成 double-count 或無聲遺漏；舊 client 面對新 schema 時寧可不歸因也不錯誤解讀。
- 取捨：generic split 寫入端必須一次提供完整 group，不能做 confirmed component-level correction；舊版 client 讀取 v3 Ledger 期間不會產生 Ledger attribution，需由支援 v3 的 client 消費。
- 延續要求：任何新 consumer（例如 Loan UI／CSV／Import Center、Investment、FX）都必須先在獨立 Sprint 定義其 domain contract 與 generic group mapping，不得將 domain-specific 商業規則滲入 generic foundation；不得因本 ADR 自動啟動後續 consumer 或 historical migration。

---

## ADR-004：Firebase 跨裝置同步採 P1～P4 漸進式 retirement，localStorage／JSON Backup／Ledger 保持獨立

**狀態**：已採用

**背景**：UR-TODO-001 的原始 Security Rules Expiry／Anonymous Auth Phase 已由 PR #252 完成；後續 L2C audit 證實 Firebase transport、startup Anonymous Auth、sync UI 與 remote Ledger merge 耦合。一次完整移除會同時擴大 regression surface、使 Ledger remote merge 清理難以獨立驗證，並提高 rollback 難度。

**決策**：

1. localStorage 是唯一 canonical runtime state；JSON Backup 是人工備份、跨裝置搬移與災難復原。
2. Financial Event Ledger 的 localStorage／JSON Backup serialization、schema、normalization、validation、event identity／collision、atomic group、void、linked transaction identity、attribution start date 與 forward-only 契約維持獨立，不得隨 Firebase code 一併刪除。
3. P1 移除 startup 背景 Auth；P2 移除手動 transport、UI、sync metadata 與 Firebase-only remote merge；P3 清理無使用點設定、runtime references、tests 與文件；P4 的 Console retirement 另行授權。
4. P4 前禁止 Firebase Console 變更。JSON Backup payload 若需變更，必須另行證明必要性並取得授權。

**後果**：

- 好處：每個階段都能對 localStorage、JSON Backup 與 Ledger regression 獨立驗證，且可在早期階段回退。
- 取捨：退役期間會短暫保留過渡程式與文件；P1 或 P2 均不構成完整 retirement 結論。
- 延續要求：P1～P3 必須以最小單一 Sprint／Draft PR 執行；不得處理 Gmail OAuth、非 Firebase Workers、核心財務公式或未授權的 Backup migration。

---

## ADR-005：Firebase Retirement 採 Archived Retirement，以 runtime removal、access freeze 與 verified archive 取代強制 destructive deletion

**狀態**：已採用

**背景**：UR-TODO-001 已完成 P1～P3 的 repository runtime removal 與 P4 Console 授權作業。Firebase 已不再有 Auth、RTDB transport、SDK dependency、active environment naming 或 canonical persistence role；Production 實機亦已驗證不依賴 RTDB／Anonymous Auth。另一方面，Firebase Project、RTDB historical data、歷史 anonymous users 與 Web App registration 仍可能有稽核、回溯或使用者保留價值；強制刪除會降低 auditability 與 rollback 選項，且屬獨立破壞性風險。

**決策**：

1. Firebase retirement 的完成條件為 runtime removal、network path removal、access freeze、受控 archive 驗證與 Production independence proof；不以物理刪除 Firebase Project／RTDB／users 作為必要條件。
2. Firebase Project 維持 archived retired project；RTDB Rules 維持 deny-all，Anonymous Auth 維持 disabled。RTDB historical data、歷史 users 與 Web App registration 可保留，archive 本體不得進 Repository 或公開 Bundle。
3. localStorage 與 JSON Backup 是現行 persistence architecture；Financial Event Ledger 與 `mergeFinancialEventLedgers()` 保持獨立，不因 Firebase retirement 而改動。
4. 未來任何 users、RTDB、Web App registration、API key、Project 或 browser storage 的刪除，均須重新唯讀盤點並取得明確 destructive authorization。

**後果**：

- 好處：產品可在安全凍結與驗證 archive 下正式結案，同時保留可稽核性與 rollback／歷史查核選項。
- 取捨：封存資源仍需在未來決定其保留期限；這是治理／housekeeping 決策，不恢復任何產品 runtime 路徑。
- 延續要求：不得將 optional destructive housekeeping 重新列為 UR-TODO-001 blocker；任何新 Firebase 整合都必須是新的、獨立且明確授權的產品決策。
