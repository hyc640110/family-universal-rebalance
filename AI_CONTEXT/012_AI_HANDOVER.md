# Universal Rebalance AI Handover

> 文件定位：本文件是 AI 交接時使用的「工作狀態快照」。
>
> 它不是 Master Roadmap、Current Status 或 Todo Backlog 的替代品，也不是新的待辦來源。
>
> 所有未完成事項仍以 `008_TODO_BACKLOG.md` 為唯一正式來源；最新正式版本與正式環境狀態仍以 `003_CURRENT_STATUS.md` 為準。本文件也不是 `002_MASTER_ROADMAP.md` 的替代品：長期順序異動仍只記錄於 Roadmap。

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
