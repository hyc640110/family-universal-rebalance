# Universal Rebalance AI Context Bundle (Lite)

此檔由 Repository 的 `AI_CONTEXT/` 自動產生，供 ChatGPT Project／Work 與 Claude Project 使用。
不得手動修改本 Bundle；請修改來源文件後重新產生。

Generated UTC: 2026-08-16T00:51:18.998299+00:00

## Manifest

- `000_AI_START_HERE.md` — SHA-256 `91ea83fdd035202ae2627841b1d304de55a50e988a56955c3969737eb6f8d947`
- `000_AI_WORKSPACE_RULES.md` — SHA-256 `d51d595b8b07f67e21cf2a9ebdeea23b6b7f5e882e33fb952c6ceae179fa2a2a`
- `001_README.md` — SHA-256 `bd1e0985e3d03817970071b5dd6ff0762331919ebd9cf8d826fcf19b835ee18b`
- `003_CURRENT_STATUS.md` — SHA-256 `f210727eeb55d18779a122fb3dcdb870788b8cc632f98452be57970ae9f782aa`
- `008_TODO_BACKLOG.md` — SHA-256 `905f8c7d25707eecc6ff2e7b5ffcf3d7415ad9ac636b3e5b6009873828722041`
- `012_AI_HANDOVER.md` — SHA-256 `372727711f35964c41aeba864ec89902709d9799657a3cb972d57bb7c9d29745`

---

<!-- BEGIN FILE: 000_AI_START_HERE.md -->

# Universal Rebalance AI Start Here

版本：v2.2

最後更新：2026-07-25

## 唯一入口

本文件是 Universal Rebalance 在所有 AI 平台上的共同入口。

使用者只需要記住三句：

```text
開始工作
```

代表進入 **Review Mode**：讀取、分析、規劃、盤點、整理 Todo 或更新文件；不得修改 Repository 程式。

```text
開始開發
```

代表申請進入 **Development Mode**：AI 必須先完成唯讀初始化與 Git 基線確認，才可修改程式；仍不得自行 Merge 或部署 Production。

```text
整理交接
```

代表結束目前這段 Review／規劃工作，將本次討論的結論整理成跨 AI／跨對話可延續的交接快照；不得修改 Repository 程式，詳見第 2.1 節與 [012_AI_HANDOVER.md](012_AI_HANDOVER.md)。

---

## 1. 先判斷目前平台能讀到什麼

### A. 有 Repository／本機工作區存取權

適用於：

- Codex App／Codex CLI／Codex IDE
- Claude Code
- 已實際掛載 Repository 的其他開發代理

規則：

1. 以 Repository root 為工作根目錄。
2. 讀取本目錄 `AI_CONTEXT/` 內的正式文件。
3. `AGENTS.md` 與 `CLAUDE.md` 只是平台入口；本文件才是共同規則來源。
4. 不得改用聊天記憶取代 Repository 內的正式文件。

### B. 只有專案檔案／知識庫，沒有 Repository 存取權

適用於：

- ChatGPT Project
- ChatGPT Work（在同一 Project 中使用）
- Claude 首頁／Claude Project

規則：

1. 讀取專案檔案中的 `000_Universal_Rebalance_AI_Context_Bundle.md`。
2. 將 Bundle 內標示的 Current Status、Todo、規格與流程視為正式依據。
3. 不得宣稱已讀取電腦本機路徑或 Repository，除非工具確實提供存取權。
4. 沒有 Repository 工具時，即使使用者說「開始開發」，也只能產出開發指令、Patch、檔案或規格，不得假稱已 Commit、Push、建立 PR 或部署。

---

## 2. 每次初始化必讀

每次「開始工作」或「開始開發」至少讀取：

1. `001_README.md`
2. `003_CURRENT_STATUS.md`
3. `008_TODO_BACKLOG.md`
4. `016_Product_Decisions.md`

由 AI 自行判斷本次工作是否需要其他文件；使用者不需要指定。

`016_Product_Decisions.md` 記錄產品定位、審查機制、產品原則、版本代號哲學等永久產品治理決策（2026-07-25 V7.0A 新增），與前三項文件同等級必讀，但不取代 002／003／008／013 各自的正式來源地位。

### 新增 Todo、規劃版本或改變優先順序

再讀：

- `002_MASTER_ROADMAP.md`
- 與需求直接相關的規格

### 修改程式或建立 Sprint

再讀：

- `004_DEVELOPMENT_GUIDE.md`
- `006_PROJECT_ARCHITECTURE.md`
- `007_GIT_WORKFLOW.md`
- `010_CODING_STANDARDS.md`
- `011_RELEASE_CHECKLIST.md`

### 涉及家庭流動性或跨模組財務語意

只要涉及下列任一主題，必讀：

- Household Liquidity／家庭流動性
- 安全存量／可投資現金
- Rebalance／Buy-only／Standard
- Risk／AI Decision
- Dashboard 財務決策
- Analytics／Trading List
- Simulator／CLEC

文件：

- `013_HOUSEHOLD_LIQUIDITY_SPEC.md`

### 接手未完成 Sprint、Branch 或 PR

再讀：

- `012_AI_HANDOVER.md`

### 追查歷史或舊待辦來源

再讀：

- `009_CHANGELOG.md`
- `014_TODO_GAP_AUDIT.md`

---

## 2.1 整理交接（Review／規劃工作結束時）

適用於 Review Mode 或 Planning 討論告一段落、需要把結論交給另一個 AI、另一個平台或另一個對話延續時（例如 Claude Home 交給 Claude Code，或 Claude／Codex 交給 ChatGPT）。

觸發後 AI 必須：

1. 停在唯讀範圍：只更新 `AI_CONTEXT` 內的治理文件（主要是 `012_AI_HANDOVER.md`，必要時同步 `008_TODO_BACKLOG.md` 的 Todo 狀態），不修改程式、不建立 Branch、不 Commit、不 Push、不建立 PR、不部署。
2. 依 `012_AI_HANDOVER.md` 規定的交接快照格式輸出：本次工作主題、已確認決策、Todo 變更、建議 Sprint、待盤點事項、下一位 AI 的直接起點、建議更新的 AI_CONTEXT 文件。
3. 明確標註：本次交接內容不是 Todo Backlog、Roadmap 或 Current Status 的替代品，未完成事項仍以既有正式文件為準。
4. 若有 Repository 存取權，可將整理結果直接寫入 `012_AI_HANDOVER.md`；若只有 Project Knowledge（無 Repository 存取權），則以聊天訊息輸出同樣格式的交接內容，交由下一位有 Repository 存取權的 AI 寫入文件。

---

## 3. Review Mode

適用於：

- 一般問答與分析
- 新增或整理 Todo
- 唯讀盤點
- 規劃 Sprint／Roadmap
- UI／Bug 分析
- 文件更新
- 產生 Codex／Claude 開發指令

限制：

- 不修改程式
- 不建立 Branch
- 不 Commit／Push
- 不建立或更新 PR
- 不部署
- 不修改正式 Firebase 或 Cloudflare Production

---

## 4. Development Mode

只有使用者明確說「開始開發」或明確要求實作時才成立。

開始修改前必須：

1. 確認工具確實可讀寫 Repository。
2. 讀完必要治理文件。
3. 確認 Repository root、目前 Branch、HEAD、working tree。
4. Fetch 並確認最新 main；不得使用破壞性 reset 隱藏問題。
5. 確認固定 stash 不受影響。
6. 確認本 Sprint 的 Todo、範圍、明確不包含與驗收條件。
7. 從最新 main 建立新 Branch；不得沿用舊 Sprint Branch。
8. 先完成唯讀盤點，再修改。

固定流程：

```text
初始化
→ 唯讀盤點
→ 最新 main
→ 新 Branch
→ 實作
→ TypeScript／測試／Build
→ Preview
→ Draft PR
→ 使用者驗收
→ Ready for review
→ 使用者手動 Merge
```

AI 不得自行 Merge，也不得未經驗收部署 Production。

---

## 5. 新需求與 Todo 自動處理

使用者提出新需求時，AI 必須自行：

1. 比對最新版 Todo Backlog。
2. 判斷是否重複、已完成、部分完成或已被較大架構吸收。
3. 必要時建立新的 `UR-TODO-XXX`。
4. 補上優先級、狀態、日期、問題、範圍、明確不包含、驗收條件、依賴與盤點要求。
5. 只有影響長期順序時才更新 Roadmap。
6. 只有改變核心契約、公式或跨模組語意時才更新架構規格。
7. 更新 AI_CONTEXT 文件後，重新產生專案知識 Bundle。

使用者不需要判斷該讀或更新哪一份文件。

---

## 6. 正式來源與版本原則

- Repository 內 `AI_CONTEXT/` 是開發代理的正式來源。
- `000_Universal_Rebalance_AI_Context_Bundle.md` 是 ChatGPT／Work／Claude Project 的可攜式快照。
- Bundle 必須由 `AI_CONTEXT/` 重新產生，不得手動維護兩套內容。
- 同一文件只保留一份 active copy；版本號寫在文件內容中。
- 舊版本移至 Archive，不得與 active copy 混放。
- 不確定狀態一律標記「待盤點」，不得自行宣稱完成。

---

## 7. 初始化回報

一般工作只需簡短回報：

```text
初始化完成。
平台模式：Repository／Project Knowledge
工作模式：Review／Development
目前基線：〈版本或狀態〉
本次相關 Todo／規格：〈項目〉
```

只有準備正式開發或使用者要求時，才輸出完整 Git／Workspace 盤點。

---

## 8. 使用者唯一需要記住的內容

```text
開始工作
```

或：

```text
開始開發
```

或：

```text
整理交接
```

其餘文件選擇、初始化與模式判斷由 AI 負責。

<!-- END FILE: 000_AI_START_HERE.md -->

---

<!-- BEGIN FILE: 000_AI_WORKSPACE_RULES.md -->

# Universal Rebalance AI Workspace Rules

版本：v4.0

最後更新：2026-07-23

## 核心規則

所有平台一律先遵循：

```text
AI_CONTEXT/000_AI_START_HERE.md
```

平台入口檔只負責導向，不得複製另一套互相矛盾的工作規則。

## Repository Source of Truth

- Repository root：目前開啟的 `family-universal-rebalance` 根目錄
- AI 正式文件：`AI_CONTEXT/`
- ChatGPT／Claude Project 匯出檔：`AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle.md`

## 權限口令

### 開始工作

允許讀取、分析、規劃、盤點、整理 Todo 與更新文件；不允許修改程式。

### 開始開發

允許在完成唯讀初始化後修改程式、建立新 Branch、Commit、Push 與建立 Draft PR；不允許自行 Merge 或部署 Production。

## 固定保護

不得：

- 直接修改 main
- 自行 Merge
- 未驗收部署 Production
- 沿用舊 Branch 開新 Sprint
- 混用 Preview／Production
- 破壞 localStorage、Firebase、JSON Backup 相容
- 未確認便宣稱完成
- 要求使用者記住應閱讀哪些文件

## 文件同步

任何 active AI_CONTEXT 文件變更後，執行：

```text
python tools/build_ai_context_bundle.py
```

或 Windows 雙擊：

```text
tools\更新_AI_內容包.cmd
```

產出的 Bundle 才可重新上傳到 ChatGPT Project／Work 或 Claude Project。

<!-- END FILE: 000_AI_WORKSPACE_RULES.md -->

---

<!-- BEGIN FILE: 001_README.md -->

# Universal Rebalance AI Context

最後更新：2026-07-25

## 使用者只需記住

```text
開始工作
```

或在確定要修改程式時：

```text
開始開發
```

## 跨平台入口

- Codex：Repository root 的 `AGENTS.md`
- Claude Code：Repository root 的 `CLAUDE.md`
- ChatGPT Project／ChatGPT Work：上傳 `000_Universal_Rebalance_AI_Context_Bundle.md`，貼入專案指令一次
- Claude 首頁／Claude Project：上傳同一份 Bundle，貼入專案指令一次

所有入口最後都導向同一套 `AI_CONTEXT/000_AI_START_HERE.md` 規則。

## 專案定位

Universal Rebalance 是 React + Vite + TypeScript 的個人與家庭財富管理平台，涵蓋持股管理、資產配置、再平衡、借款、績效、股息、JSON 備份／匯入、Gmail OAuth、AI 決策與家庭流動性。Firebase 已完成 **Archived Retirement／封存保留**：不再有產品 runtime 角色；Firebase Project 僅作為封存的歷史外部資源保留。legacy Firebase input 僅維持 backward-compatible tolerant-read／accept-and-discard，並非同步能力。

## 核心原則

- 最新 main 開新 Branch
- 每個 Sprint 一個 PR
- PR 預設 Draft
- Preview 驗收後才 Ready
- 使用者手動 Merge
- Preview／Production 隔離
- localStorage 為 canonical device persistence，JSON Backup 為人工備份／裝置搬移；Firebase 為 archived retired project，legacy Firebase input 維持受控相容
- 不新增未經允許的自動同步

## Active AI Context 文件

| 檔案 | 用途 |
|---|---|
| `000_AI_START_HERE.md` | 唯一共同入口 |
| `000_AI_WORKSPACE_RULES.md` | 權限與同步規則 |
| `001_README.md` | 專案概覽 |
| `002_MASTER_ROADMAP.md` | 長期規劃 |
| `003_CURRENT_STATUS.md` | 最新正式基線 |
| `004_DEVELOPMENT_GUIDE.md` | 開發規範 |
| `005_AI_USER_CONTEXT.md` | 使用者偏好 |
| `006_PROJECT_ARCHITECTURE.md` | 程式架構 |
| `007_GIT_WORKFLOW.md` | Git／PR 流程 |
| `008_TODO_BACKLOG.md` | 未完成事項正式來源 |
| `009_CHANGELOG.md` | 完成歷史 |
| `010_CODING_STANDARDS.md` | Coding 規範 |
| `011_RELEASE_CHECKLIST.md` | 發布檢查 |
| `012_AI_HANDOVER.md` | 進行中交接 |
| `013_HOUSEHOLD_LIQUIDITY_SPEC.md` | 家庭流動性架構（現行 v4.0） |
| `014_TODO_GAP_AUDIT.md` | 舊待辦補登紀錄 |
| `015_CROSS_AI_COMPATIBILITY_SPEC.md` | 跨平台設計與限制 |
| `016_Product_Decisions.md` | 產品定位、審查機制、產品原則、版本命名區隔規則 |
| `017_Design_System.md` | 全站 UI 元件視覺規範（骨架，內容待補完） |
| `018_Dashboard_UX_Guideline.md` | 首頁版面與互動規範（骨架，內容待補完） |
| `019_Idea_Pool.md` | 創意模式新想法收錄區（尚未評估） |
| `020_Architecture_Decisions.md` | 架構決策記錄（ADR） |

<!-- END FILE: 001_README.md -->

---

<!-- BEGIN FILE: 003_CURRENT_STATUS.md -->

# Universal Rebalance Current Status v4.17

最後更新：2026-08-15

**依 §8.2 六「治理文件最終一致性」規則追平：`origin/main` 正式基線更新為 `70db4aafcdd2a19ed67f96d2eac8791226e48c91`。** 本次治理同步一併追平自上次基線陳述（PR #355／`98c96c1`）以來被跳過的三筆 Merge：

- **PR [#356](https://github.com/hyc640110/family-universal-rebalance/pull/356)**（`docs: catch up baseline to PR #355's merge commit`），merge commit `c49594a06586889b31314d353c1a67288bb5e161`，一般 merge commit，未使用 admin override。純治理文件同步（依 §8.1 既有政策自動 Merge），追平 PR #355 自身無法宣告自己 merge commit 的結構性落差。
- **PR [#357](https://github.com/hyc640110/family-universal-rebalance/pull/357)**（`feat: FX Conversion Confirmation UI (UR-TODO-054-B)`），merge commit `fc9684ef955fca5c9d4194ea670b719e32c58727`，一般 merge commit，未使用 admin override。UR-TODO-054-B 正式完成並 Merge，詳見下方獨立條目。
- **PR [#358](https://github.com/hyc640110/family-universal-rebalance/pull/358)**（`docs: close UR-TODO-054-B and catch up baseline to PR #357`），merge commit `70db4aafcdd2a19ed67f96d2eac8791226e48c91`，一般 merge commit，未使用 admin override。純治理文件同步，與本次 PR #356 情況相同的結構性落差（治理同步 PR 無法自我宣告自己的 merge commit）。

---

**UR-TODO-054-C（Generic Split Confirmation UI）Contract Audit 結論補記，維持「待規劃」狀態。** Contract Audit（2026-08-15，Codex Desktop 執行，Review Mode 唯讀盤點；本次治理同步已重新以 Repository 實證逐項核對）確認 Generic Split 底層 contract（`appendGenericSplitAllocationGroup()`）已完整存在，但完全沒有任何 candidate producer——`App.tsx` 對 Generic Split 相關識別字零命中，`transactionReconciliation.ts` 也沒有 Generic Split 專屬 `candidate` reason（與 Loan／FX 皆已有專屬 candidate reason 不同）。**結論：阻礙是「沒有可消費的真實 candidate／producer」，不是 UI 實作細節，維持待規劃、不建議現在開發。** 純治理文件記錄補記，**未修改任何 `src/`／`tests/` 程式碼**，`origin/main` 功能基線不因此變動，詳見 `008_TODO_BACKLOG.md` UR-TODO-054-C 正式條目。

---

**UR-TODO-054-B（FX Confirmation UI）正式完成並 Merge，`origin/main` 正式基線更新為 `fc9684ef955fca5c9d4194ea670b719e32c58727`。** PR [#357](https://github.com/hyc640110/family-universal-rebalance/pull/357) 已正式 Merge（merge commit `fc9684ef955fca5c9d4194ea670b719e32c58727`，一般 merge commit，未使用 admin override），承接同日稍早的 Review Mode Contract Audit（GO 判定），架構比照已完成的 054-A（Loan Confirmation UI）成功模式：新增 `src/lib/fxConversionPresentation.ts`（`deriveFxConversionPresentations()`，依 `conversionId` 把兩腿合併為單一 presentation 項目）、`src/components/fx/FxConfirmationCard.tsx`（確認／撤銷 UI），`App.tsx` 新增 `confirmFxConversion()`／`voidFxConversion()`，重用既有、未修改的 `confirmFxConversionAndAppend()`／`voidFinancialEventAndAppend()` contract。**關鍵風險點已正確處理並有 CRITICAL regression test 明確鎖定**：`confirmFxConversionAndAppend()` 的 `result.events` 是完整合併後的 Ledger（與 Loan 方向相反，必須整份取代而非疊加），本機 Preview 已端到端實機驗證 create→confirm→void→reconfirm 全流程 `financialEvents.length` 正確為 0→1→2→3。開發過程中發現並處理另一個過時的重複 Draft PR [#333](https://github.com/hyc640110/family-universal-rebalance/pull/333)（來自無關的較早 session，基於嚴重過時的 main，若 Merge 會刪除大量已上線功能），已 Close without merge，並把其中有保留價值的內容（跨 envelope 重複認領防呆、`handleVoid` 對稱防護、測試韌性缺口）整合進 PR #357。Deploy GitHub Pages run [31895761055](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31895761055) success，headSha 與 merge commit 一致；Production 已唯讀確認 FX Producer 表單與 `FxConfirmationCard` 皆正確不顯示（Producer gate 維持 OFF，本次 Merge 未觸碰此常數）、既有功能不受影響，console 無錯誤，詳見 `008_TODO_BACKLOG.md` UR-TODO-054-B 正式條目。

---

**`007_GIT_WORKFLOW.md` §8.2 新增「六、治理文件最終一致性」規則。** 承接同日稍早的治理文件基線落差修正事件（PR #354）：使用者與 Claude Home 討論後定案，不要求每次低風險自動 Merge PR 都強制同步 `003_CURRENT_STATUS.md`，但明訂「治理文件的基線陳述句式視為單一事實來源」——任何造成 `origin/main` HEAD 變化的 Merge 若當下未同步治理文件，必須在下一次治理文件同步時一併追平期間所有累積落差（逐一列出被跳過的每個 PR，不得只更新最新一筆），並明確治理文件同步執行者的責任歸屬。純新增規則文字，未修改任何既有 §8.1／§8.2 條件或既有規則語意。**本條目本身依此新規則刻意不自我宣告基線 SHA**（此 PR 自身的 merge commit 只有 Merge 後才會產生，屬於規則允許的「暫時落後」情境，下次治理同步時會依規則追平），實際最新 `origin/main` HEAD 請以 `git log -1 origin/main` 或下一次治理同步條目為準。

---

**治理文件基線落差修正：`origin/main` 正式基線更新為 `90cf75f725d9ecb2fca63e2f081d64d49907d179`。** 唯讀確認（Review Mode）發現本文件最上方條目過去未依全文件既有慣例明確陳述新基線 SHA，導致讀者（含 ChatGPT 透過 Full／Lite Bundle）實際抓取到的是落後多個 commit 的舊值 `ed1c3e4ea3883f56df7a57f6c180f38592fc8680`（UR-TODO-063／PR #349）。本次補齊自 PR #349 之後、先前未反映在本文件的兩次 Merge，並修正措辭統一句式，避免未來再次出現同類落差：

- **PR [#351](https://github.com/hyc640110/family-universal-rebalance/pull/351)**（`test: lock loan-payment duplicate-paymentId resolver fail-safe (from PR #322)`），merge commit `151945ed098f799140492e575a237819b8b3206a`，`origin/main` 正式基線更新為 `151945ed098f799140492e575a237819b8b3206a`。承接 PR #322（Loan payment atomic contract 稽核，NO-GO development 結論）Closeout Audit 的收尾：PR #322 本身已 Close（未 Merge，其稽核結論已記錄於 `009_CHANGELOG.md`／`012_AI_HANDOVER.md`），唯一有保留價值的產出——`tests/loanComponentGroup.test.ts` 新增 1 項 regression test（鎖定 `resolveActiveLoanComponentGroups()` 的 `paymentCounts !== 1` fail-safe：兩個完整、皆 `posted`、皆未 `void`、共用同一 `paymentId` 的 confirmation group 會被正確排除、不 double-count，並正確 fallback 回單筆 C3 derived evidence）——已從最新 `origin/main` 重新搬移為獨立乾淨的新 PR。**零生產程式碼變更**，僅 `tests/loanComponentGroup.test.ts` +18 行，依 `007_GIT_WORKFLOW.md` §8.2 低風險自動 Merge 規則第 3 類（小型測試補強）自動完成，**未使用 admin override**。
- **PR [#353](https://github.com/hyc640110/family-universal-rebalance/pull/353)**（`docs: cross-reference the 3-way target-value formula duplication`），merge commit `90cf75f725d9ecb2fca63e2f081d64d49907d179`，`origin/main` 正式基線更新為 `90cf75f725d9ecb2fca63e2f081d64d49907d179`。承接先前唯讀盤點結論——「目標市值 = 總市值 × 目標權重%；差額 = 目標市值 − 目前市值」這行基礎公式在 `rebalanceRecommendation.ts`／`rebalanceStrategyComparison.ts`／`AllocationSimulatorPage.tsx` 三處被獨立實作、屬已知低風險技術債——在三處公式旁補上互相呼應的說明註解，記錄平行實作關係與刻意保持獨立的理由（模擬工具 vs 正式決策引擎，各自資料品質規則／預算限制／資金模型不同），提醒未來修改任一處公式細節時應同步檢查其他兩處。**純新增註解，零邏輯變更、零函式簽名變更**，建置後輸出 bundle hash 與變更前逐字相同，實證零執行期影響；依 §8.2 低風險自動 Merge 規則第 4 類精神（純函式／helper 小修正）自動完成，**未使用 admin override**。

---

**治理記錄落差修正：UR-TODO-041（負債資料過期警示）正式標記 CLOSED。** Review Mode Closeout Audit 發現：功能本身早於 2026-08-05 已透過 PR [#254](https://github.com/hyc640110/family-universal-rebalance/pull/254)（merge commit `e11da75a476c4d426fedefabcc629b01f305a181`）完整實作、測試並上線 Production，`origin/main` 早已包含此功能，只是 `008_TODO_BACKLOG.md` 條目狀態自 2026-07-26 建立後從未同步更新為 CLOSED。`/tools/risk-center`「借款安全分析」卡片的負債資料過期提醒＋「我已確認這筆資料仍正確」按鈕（`loanDataFreshness.ts`：30 天門檻、完全獨立於 `blockingReasons`／`dataCompleteness` 路徑，不影響任何買賣建議）已穩定運行超過一週，本次僅補齊治理文件記錄，詳見 `008_TODO_BACKLOG.md` UR-TODO-041 正式條目。**PR [#352](https://github.com/hyc640110/family-universal-rebalance/pull/352)** 已正式 Merge（merge commit `d071b3f7c74be23fc5edb209cced1cc0778ce861`，一般 merge commit，未使用 admin override），`origin/main` 當時正式基線更新為 `d071b3f7c74be23fc5edb209cced1cc0778ce861`（此值已由上方 PR #351／#353 進一步取代，僅供歷史對照）。

---

**UR-TODO-063（首頁瘦身——移除投資健康度、狀態確認改為異常才顯示）正式完成並 Merge，`origin/main` 正式基線更新為 `ed1c3e4ea3883f56df7a57f6c180f38592fc8680`。** PR [#349](https://github.com/hyc640110/family-universal-rebalance/pull/349) 已正式 Merge（merge commit `ed1c3e4ea3883f56df7a57f6c180f38592fc8680`，一般 merge commit，未使用 admin override），為使用者與 ChatGPT 討論後同日臨時發起、經 Repository 唯讀盤點確認並拍板的首頁精簡調整：移除「投資健康度」（`dashboard-health-card`）整個首頁區塊（其內容 `riskMetrics.overallLabel`／`allocationDeviation`／`thresholdReached` 已由 `/tools/risk-center`、`/tools/portfolio-risk` 提供更完整呈現，零資訊流失，兩頁面本身未修改）；「狀態確認」（`dashboard-reminders-card`）改為比照 `CreditCardDueSoonCard` 既有「無項目回傳 `null`」慣例，無異常時整個區塊（最後股價更新時間列、提醒清單、投資機會連結）完全不渲染，有異常才顯示，底層 `investmentDashboard.ts` reminders 計算邏輯未修改。唯讀盤點確認「狀態確認」原有四項檢查皆非唯一顯示入口，移除首頁呈現不影響使用者察覺異常的管道。Deploy GitHub Pages run [31884737628](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31884737628) success，headSha 與 merge commit 一致；Production 已唯讀確認首頁投資健康度已消失、狀態確認在目前資料狀態下正確完整顯示、其餘既有區塊（重點標的、今日投資狀態、今日投資摘要、信用卡繳費提醒）不受影響，console 無錯誤，詳見 `008_TODO_BACKLOG.md` UR-TODO-063 正式條目。

---

**UR-TODO-062（工具導覽「真實建議／假設模擬」分組標籤）正式完成並 Merge，`origin/main` 正式基線更新為 `b4aec0a1761817dd68fff79479cf56d9156af72b`。** PR [#347](https://github.com/hyc640110/family-universal-rebalance/pull/347) 已正式 Merge（merge commit `b4aec0a1761817dd68fff79479cf56d9156af72b`，一般 merge commit，未使用 admin override），為使用者於驗收 UR-TODO-058 過程中同日臨時發起的產品調整：`ToolDefinition`（`src/lib/toolNavigation.ts`）新增選用加法式欄位 `nature?: 'real-recommendation' | 'simulation'`，標記再平衡建議中心／CLEC 再平衡策略中心為「真實建議」、配置模擬器／三策略再平衡模擬比較為「假設模擬」，其餘既有工具維持原樣；`ToolsPage.tsx` 卡片標題旁渲染對應徽章（藍色系＝真實建議、紫色系＝假設模擬，刻意避開既有 `.good`／`.bad` 綠紅語意色，避免暗示優劣）；`AllocationSimulatorPage.tsx`／`RebalanceStrategyComparisonPage.tsx` 既有「不是投資建議」提示區塊補上導向再平衡建議中心的明確連結。未修改任何核心計算模組（`rebalanceRecommendation.ts`／`clecStrategyRules.ts`／`rebalanceStrategyComparison.ts`／`allocationSimulatorFunding.ts` 皆未觸碰）。Deploy GitHub Pages run [31883336445](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31883336445) success，headSha 與 merge commit 一致；Production 已唯讀確認 `/#/tools` 頁面 4 張工具卡片正確顯示對應徽章、其餘工具卡片不受影響、既有頁面 console 無錯誤，詳見 `008_TODO_BACKLOG.md` UR-TODO-062 正式條目（含同一輪對話中核心再平衡公式重複性唯讀盤點的附帶記錄）。

---

**UR-TODO-058（Excel 三策略再平衡模擬比較）正式完成並 Merge，`origin/main` 正式基線更新為 `234fe137c017adef3536b892ac025afe1d445890`。** PR [#345](https://github.com/hyc640110/family-universal-rebalance/pull/345) 已正式 Merge（merge commit `234fe137c017adef3536b892ac025afe1d445890`，一般 merge commit，未使用 admin override），落地獨立新頁面 `/tools/investment-backtest`（啟用既有 `toolNavigation.ts` 原本待規劃的佔位項目）：純模擬／比較工具，不接進 `clecStrategyRules.ts`／`rebalanceExecutionEligibility.ts` 等正式決策引擎，不寫入任何正式持久化資料。資料來源為使用者提供之 EP04-02-大道至簡投資法-資產配置與再平衡 Excel，經完整解析後落地三套純函式策略：聰明再平衡（依期間漲跌動態調整，Excel 作者不推薦但使用者要求保留供比對）、無腦再平衡（Excel 作者推薦，僅在 00631L／00865B 間互換）、比率再平衡（三檔全面向目標權重收斂）；另有 Beta 曝險 session-only 模擬（不重用或修改既有正式 Beta 指標）。開發後應使用者要求，假設情境輸入與結果顯示統一改為萬元（重用既有 `yuanToWan()`／`wanToYuan()` 慣例）。Deploy GitHub Pages run [31880137982](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31880137982) success，headSha 與 merge commit 一致；Production 已唯讀確認 `/#/tools/investment-backtest` 正確顯示三策略模擬比較，既有功能未受影響，console 無錯誤，詳見 `008_TODO_BACKLOG.md` UR-TODO-058 正式條目（含最初「導入 CLEC」定位與最終「純模擬比較工具」定位的範圍差異記錄）。

---

**UR-TODO-061（首頁重點標的可自訂）正式完成並 Merge，`origin/main` 正式基線更新為 `6fb75cfc6bb38b950a62d50af6851aa19f94ecf6`。** PR [#343](https://github.com/hyc640110/family-universal-rebalance/pull/343) 已正式 Merge（merge commit `6fb75cfc6bb38b950a62d50af6851aa19f94ecf6`，一般 merge commit，未使用 admin override），將首頁「重點標的」卡片（UR-TODO-059）從寫死 00631L 改為使用者可自訂：新增 additive 欄位 `AppState.focusedSymbols: string[]`（陣列型別為未來多檔顯示預留彈性，UI 邏輯仍限制最多 1 檔）；資產頁個股「詳細」展開區塊新增「設為重點標的」切換開關，選新標的自動取消舊選擇；新增純函式 `normalizeFocusedSymbols()`（`src/lib/focusedSymbols.ts`）以 `Array.isArray()` 判斷欄位是否首次存在，對既有使用者一次性遷移初始化為 `['00631L']`，之後使用者主動清空選擇則原樣尊重、不再覆蓋；與逢低加碼追蹤（UR-TODO-057）完全獨立，切換重點標的不影響任何標的已累積的 `highWaterMark`／`triggeredLevel`（已實機驗證）；取消唯一重點標的時首頁卡片完全不渲染，比照既有 `CreditCardDueSoonCard` 慣例。Deploy GitHub Pages run [31876678153](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31876678153) success，headSha 與 merge commit 一致；Production 已唯讀確認首頁正確顯示 00631L（既有使用者遷移邏輯），既有卡片未受影響，console 無錯誤，詳見 `008_TODO_BACKLOG.md` UR-TODO-061 正式條目。

---

**UR-TODO-057（00631L 自動高點追蹤＋每跌 10% 階梯式加碼提醒）正式完成並 Merge，`origin/main` 正式基線更新為 `7704cf8f0610b003414b2ea664e0b9515f947df4`。** 採 Strangler Pattern 兩階段（比照 ADR-001）：子 PR 1 [#339](https://github.com/hyc640110/family-universal-rebalance/pull/339)（merge commit `2248453da13e2cc8a0d61326ab512df98162abaf`，純函式 `dipLadderEngine.ts` 抽出階段）、子 PR 2 [#340](https://github.com/hyc640110/family-universal-rebalance/pull/340)（merge commit `7704cf8f0610b003414b2ea664e0b9515f947df4`，quote 更新橋接＋首頁「重點標的」卡片串接階段），皆一般 merge commit，**未使用 admin override**。落地自動高點追蹤（`highWaterMark`／`triggeredLevel` 為獨立新欄位，不沿用舊手動 `referencePrice`，啟用當下的第一筆合格報價為初始基準）、每跌 10% 一級的回撤階梯（防重複觸發、新高重置整週期）、報價品質過濾（stale／unknown／unavailable／備援報價一律忽略）、於既有 quote 更新共用路徑（頁面載入／手動按鈕／下拉手勢，Repository 確認無自動輪詢機制）統一橋接。Deploy GitHub Pages run [31872010383](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31872010383) success，headSha 與 merge commit 一致；Production 已唯讀確認首頁「重點標的」卡片正確顯示「逢低加碼自動追蹤」區塊，既有卡片未受影響，console 無錯誤。開發前使用者將最初「波段最高價自動更新」草案正式重新定義為完整階梯式加碼機制，範圍遠大於原始草案；開發中一則使用者回報的「封存 00631L 無反應」問題經唯讀 Debug Trace 確認與本輪新增邏輯無關（瀏覽器 `window.confirm()` 連續觸發防護機制的巧合），詳見 `008_TODO_BACKLOG.md` UR-TODO-057 正式條目。

---

**UR-TODO-059（首頁決策卡片，範圍調整為鎖定 00631L）正式完成並 Merge，`origin/main` 正式基線更新為 `f1434a5b4b69a5242ff4680f4f1de6313b15f8bd`。** PR [#337](https://github.com/hyc640110/family-universal-rebalance/pull/337) 已正式 Merge（merge commit `f1434a5b4b69a5242ff4680f4f1de6313b15f8bd`，一般 merge commit，未使用 admin override），落地首頁最上方「重點標的」卡片：固定顯示 00631L 的可投入現金、目前配置比例 vs 目標比例偏離幅度，觸發再平衡門檻時顯示來自 `rebalanceRecommendation.ts`／`getOrderSuggestions()` 的建議投入／賣出金額，未觸發門檻則顯示「目前配置正常，不需操作」。Deploy GitHub Pages run [31868249584](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31868249584) success，headSha 與 merge commit 一致；Production 已唯讀確認新卡片正常顯示於既有 4 張首頁卡片之前，既有卡片未受影響，console 無錯誤，未建立任何測試資料。開發前使用者已明確確認目前僅投入 00631L，原候選 #1「顯示最偏離的 1-2 檔資產」通用排序邏輯範圍調整為單一標的鎖定顯示，純消費既有 `investableCash`／`rebalanceRecommendation` 輸出，未新增任何演算法，`todayDecision.ts` 既有結論邏輯未變動，詳見 `008_TODO_BACKLOG.md` UR-TODO-059 正式條目。

---

**UR-TODO-060（信用卡每月繳費提醒）正式完成並 Merge，`origin/main` 正式基線更新為 `c5c15689b1cc69d1f0898de0667880e99f3faf1b`。** PR [#335](https://github.com/hyc640110/family-universal-rebalance/pull/335) 已正式 Merge（merge commit `c5c15689b1cc69d1f0898de0667880e99f3faf1b`，一般 merge commit，未使用 admin override），落地信用卡繳費日提醒（繳費日前 3 天出現、未確認持續顯示為已逾期、下期自動重置的每期獨立狀態機）與關聯帳戶方案 B（銀行／信用卡類型帳戶可選，優先於手動名稱，含已刪除帳戶防呆選單）。Deploy GitHub Pages run [31866637716](https://github.com/hyc640110/family-universal-rebalance/actions/runs/31866637716) success，headSha 與 merge commit 一致；Production 已唯讀確認「信用卡繳費提醒」區塊正常顯示，console 無錯誤，未建立任何測試資料。開發過程歷經多輪範圍調整（原始 B1 草案含金額欄位 → 應要求移除金額 → 新增完成確認機制 → 關聯帳戶從隱藏改為方案 B 主要識別 → 可選帳戶類型由僅信用卡放寬為銀行＋信用卡），最終落地範圍與最初草案不同，詳見 `008_TODO_BACKLOG.md` UR-TODO-060 正式條目。本次治理同步為**純文件變更**，零 production code、零 schema、零 persistence、零測試檔修改。

---

**UR-TODO-054-A（Loan Confirmation UI）正式完成並 Merge，`origin/main` 正式基線更新為 `c87a9e933af9cd5e7d2fa31bcb301adfa10e7944`。** PR [#331](https://github.com/hyc640110/family-universal-rebalance/pull/331) 已正式 Merge（merge commit `c87a9e933af9cd5e7d2fa31bcb301adfa10e7944`，parents `0097107e3f860009d00c4dfb8b83708ba4fef269`／`0184834b5da0b618ca44981b6e231a1b230c1791`，一般 merge commit，未使用 admin override；`mergedAt: 2026-08-14T13:24:48Z`、`mergedBy: hyc640110`），落地 Minimal Loan Repayment Producer、Loan Group Candidate Review、Confirm、Atomic Void、Reconfirm 四階段完整生命週期 UI，並修正 `RuntimeAttributionProvenanceCard` 對 Loan derived component 錯誤暴露 component-level generic confirmation 按鈕的既有 UI safety 缺口。Deploy GitHub Pages run `31804595653` success，headSha 與 merge commit 一致；Production／Preview 皆 `curl` 實測 HTTP 200，Production 唯讀確認新「登記還款」Producer UI 已存在、console 無錯誤，未於 Production 建立任何測試資料。使用者已於無痕視窗完整驗收 Preview 全流程，並由 Review Mode Debug Trace 以 `composeRuntimeNetWorthAttribution()` 真實計算結果驗證 Atomic Void／Reconfirm 底層資料層行為正確（非僅 presentation 層）。詳見 `008_TODO_BACKLOG.md` UR-TODO-054-A 正式條目。**下一候選為 UR-TODO-054-B（FX Confirmation UI）**：Review Mode Contract Audit 已完成，正式判定 **GO**——既有 FX confirm／void／reconfirm core contract 已完整、已測試，結構上比 Loan 更單純（一次確認僅 1 筆 `fx-conversion` FinancialEvent，無需獨立 confirmationGroupId），且已確認不需要修改 `RuntimeAttributionProvenanceCard`（FX 無 Loan 式 derived-evidence 洩漏路徑）。**Production FX Producer gate 維持 OFF、Preview 維持 ON，054-B 不因開發或完成而自動啟用 Production Producer**——此仍是獨立、需另行明確授權的 ADR-010／ADR-013 Controlled Rollout Policy 決策。詳見 `008_TODO_BACKLOG.md` UR-TODO-054-B 正式條目；尚未下達「開始開發」指示。

---

**UR-TODO-046 淨值成長來源歸因與記錄／實際落差核對正式結案，狀態標記為 CLOSED。** Final Audit（Review Mode，唯讀盤點）已完整比對 Repository 實證（git history／程式碼／測試／正式部署站點），確認 FinancialEvent Ledger foundation、attribution calculator、reconciliation、derived evidence、runtime composition、void／forward-only correction、duplicate prevention、persistence，以及 Investment（046-I1，PR #292）、Loan（046-L1，PR #294）、Generic Split（046-L2A/L2B，PR #296）、FX 全序列（FX-A1／FX-A2／FX-A3／F1A～F1D／F2A～F2D）皆已完成、Merge、Production 部署並實機驗證，無任何 core production blocker。**FX-F2C-3 Preview Producer Enable 已正式 Merge／Production Verified**（PR #328，merge commit `e27860db566c47a3d6c57716d79712a325ac8336`，一般 merge commit，未使用 admin override；Deploy GitHub Pages run `31760397904` success，head 與 merge commit 一致），將 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 由 `false` 翻轉為 `true`；因 `deriveFxOpaqueProducerCapability()` 的 `sourceGateEnabled && deploymentEnvironment === 'preview'` AND 邏輯本身未變，翻轉結果為 **Preview Producer capability 首次 ON、Production Producer capability 依既有 environment guard 恆為 OFF**。**FX-F2D Attribution Integration 已正式 Merge／Production Verified**（PR #329，merge commit `6ad9f5802165f0d1b78b4dd13a151584afcbf00f`，parents `e27860db566c47a3d6c57716d79712a325ac8336`／`6363b7da97f823ce3e45e087263c498ab9c0234e`，一般 merge commit，未使用 admin override；Deploy GitHub Pages run `31786367407` success，head 與 merge commit 一致），落地 `fx-conversion` FinancialEventType、`fxConversionLink`（canonical identity＝opaque envelope id）、`resolveActiveFxConversionGroups()`、candidate／matched／unsupported 三態 reconciliation、zero-effect principal contribution、duplicate confirmation fail-safe、void／reconfirm（重用既有 `buildVoidEvent()`，forward-only）、confirmed-delete guard、FX conversion principal 與 FX valuation 效果的分離（皆有測試鎖定）。**Production Producer 確認仍 OFF、Preview Producer 確認 ON**——已於正式部署站點（`https://hyc640110.github.io/family-universal-rebalance/` 與 `.../preview/`）以真實瀏覽器操作雙向驗證：Production 展開「交易基礎」後 Manual FX Producer 表單完全不出現；Preview 展開後表單完整可見。`npm run test:ci` 於 `origin/main`（`6ad9f580`）重新執行確認 **1047 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**FX conversion principal attribution 已具備正式 foundation；FX 匯率波動的 realized/unrealized gain/loss attribution 仍未建立正式 contract**，但依歷次治理紀錄，此項從未被列為 046 本身的驗收條件，已正式移出為獨立 future enhancement（見下方 follow-up Todo）。**剩餘項目（FX／Loan／Generic Split confirmation lifecycle UI、Loan／Investment 的 CSV／Import Center delivery mapping、FX Production Producer enable、FX valuation attribution、JPY/EUR 等其他貨幣對、automated pairing、進階 fee attribution）全數轉為獨立 follow-up Todo（UR-TODO-054／055／056，見 `008_TODO_BACKLOG.md`），不再留在 UR-TODO-046 底下無限延伸。** **PR #322**（Loan payment atomic contract 稽核，NO-GO development 結論）維持 Draft／OPEN，其 disposition（Close 或 Merge 為獨立測試補強）另行處理，**不阻擋** UR-TODO-046 CLOSED——其自身結論已證明既有 Loan L1 contract 已完整涵蓋 principal/interest attribution，無需新開發。本次治理同步為**純文件變更**，零 production code、零 schema、零 persistence、零測試檔修改。

---

**UR-TODO-046 FX-F2D Attribution Integration 開發完成，Draft PR 待 CI／Preview 驗收，尚未 Merge。** 前置：FX-F2C-3 Preview Producer Enable（PR #328，merge commit `e27860db566c47a3d6c57716d79712a325ac8336`）已正式 Merge／Production Verified，Preview Producer=ON、Production Producer=OFF。本 Sprint 依 F2D Repository Contract Audit 判定 **GO A — Single F2D Sprint** 落地：讓已通過 F2B resolver 的 valid FX conversion（兩腿 `FinancialTransaction`＋一個 opaque envelope）安全進入 attribution pipeline，principal contribution 恆為 0，不產生 double-count。**核心設計**：新增 `fx-conversion` 為正式 `FinancialEventType`（`financialEvents.ts`），並加入 `netWorthAttribution.ts` 既有 `ZERO_EFFECT_EVENT_TYPES`（比照 `internal-transfer`／`investment-buy`／`investment-sell`／Loan `disbursement`／`principal-payment` 既有 domain-neutral 慣例，非新機制）。新增 `FinancialEvent.fxConversionLink?: { conversionId; sourceTransactionId; destinationTransactionId }`（`fxConversionIdentity.ts`）——`conversionId` 即 F2B 拍板的 canonical identity（＝ opaque envelope id），兩個 transaction id 為 confirmation 當下的 pinned linkage evidence，非第二套 identity。**與 Loan／Generic Split 的關鍵差異**：後兩者是「一筆 transaction 拆成 N 個 component event」的 group 寫入模式（`appendFinancialEventGroup()`／`appendGenericSplitAllocationGroup()` 皆硬性要求 `transactionIds.size===1`）；FX conversion 是相反的形狀——「兩筆不同 transaction 合併成一個 economic event」，因此**只需要 1 個 FinancialEvent**，直接重用既有 `appendFinancialEvent()` 單筆寫入路徑（新增 `fxConversionAttributionConfirmation.ts`：`buildFxConversionAttributionConfirmation()`／`confirmFxConversionAndAppend()`，後者 build→append→用新增的 `resolveActiveFxConversionGroups()` 重新驗證整組 active 狀態，防止競態下產生重複 active confirmation，pattern 比照 `confirmLoanPaymentGroupAndAppend()` 的「append 後再驗證」安全網）。該事件的 `amount`／`currency`／`accountId`／`transactionId` 固定取 TWD 腿（F2B 契約保證 TWD↔USD 恰好一邊是 TWD），因此完全落在既有 `composeRuntimeNetWorthAttribution()` 的 TWD-only ledger evidence 過濾器之內，**無需修改該過濾器**。`transactionReconciliation.ts` 的 `fxConversionLeg` guard 由「恆為 `unsupported`／`fx-attribution-unsupported`」擴充為：valid envelope 且無 active confirmation → 兩腿同步 `candidate`／`fx-conversion-contract-candidate`；已有 active confirmed event → 兩腿同步 `matched`／`linked-fx-conversion`（共享同一個 event id，不產生兩筆獨立 confirmation）；malformed／未 resolve → 維持 `unsupported`／`fx-attribution-unsupported` 不變。**F2D 候選 candidate 不進入既有 `safe-taxonomy-candidate` 的 runtime derived evidence 路徑**（比照 Loan `loan-payment-contract-candidate` 的既有先例，confirmed 前後皆不經 derived path，contribution 恆為 0 或不存在，不會 double-count）。**Fee／FX valuation 明確排除於本輪**：fee 四態（`none`／`unknown`／`included`／`explicit`）維持 F2B 既有語意不變，`explicit` fee transaction 若符合既有 taxonomy 已可透過既有一般 reconciliation 路徑自然歸因，不新增 FX-specific fee event；FX 匯率波動對既有 USD 部位的估值影響（FX-A3）與「conversion 當下」的 principal contribution 完全分離，匯率變動效果繼續留在 `unexplainedResidual`，已用測試鎖定兩者不混算。**F2C-2 既有 atomic delete 新增唯一必要連帶修改**：`buildFxConversionDeletion()` 新增第三個可選參數 `financialEvents`，若該 conversionId 已有 active confirmed event 則回傳新狀態 `confirmed-delete-blocked`（App.tsx 顯示「請先撤銷正式記帳後再刪除」，不做任何刪除、不自動 void）；未確認或已撤銷的 conversion 刪除行為完全不變。**F1D gate 常數本輪未觸碰**（`FX_OPAQUE_PRODUCER_SOURCE_GATE` 仍為 `true`，Preview Producer=ON、Production Producer=OFF，與 attribution 支援完全獨立）。**Schema 維持 v3 不變**：新 type／新 link 欄位皆為 additive，已用回歸測試證明 pre-v3 client 對 `fxConversionLink` fail-safe skip（不誤判）、v2 Ledger 拒絕 v3-only 的 `fxConversionLink`（比照既有 `splitAllocationLink` 的 v3-only 慣例）、未來 unsupported schema 版本仍維持 opaque。新增 31 個測試（`tests/fxConversionAttribution.test.ts`：confirmation build／append、duplicate 防護、candidate／matched reconciliation、zero-effect contribution、derived evidence 排除、void／reconfirm、confirmed-delete guard、schema／normalization round-trip、fee／valuation 分離、完整 E2E state machine、跨 domain resolver 互不干擾），另修正 2 項因本 Sprint 授權而過時的 F2B 既有「零耦合」regression 斷言（`tests/fxConversionIdentityRegression.test.ts`：`transactionReconciliation.ts`／`financialEvents.ts` 現在明確消費 `fxConversionIdentity.ts`，但方向仍單向、無 circular dependency）。`npm run test:ci` 由 1016 增至 **1047 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**明確不包含（依 Contract Audit Closure Bias 拍板）**：Loan／Generic Split 既有 group 寫入契約修改、UI（本 Sprint 未新增任何 UI 觸發元件——`confirmFxConversionAndAppend()`／`buildLoanPaymentConfirmationGroup()` 目前皆為純函式庫層級，尚未有 App.tsx UI 觸發，F2D 延續 Loan 的既有 scope 慣例）、JPY/EUR、自動銀行匯入、自動配對、FX valuation decomposition、進階已實現匯兌損益、fee 推測、Production Producer enable、PR #322。**F2D 完成不代表 Production unlock、也不代表 UR-TODO-046 已結案**——結案需正式 Preview 環境完整驗收後另行確認。

**UR-TODO-046 FX-F2C-2 Manual FX Conversion Producer 已正式完成／Merge／Production Verified（PR #327，merge commit `b83b991e1bf79707c17ed7adc12b274b79f259b5`）；FX-F2C-3 Preview Producer Enable 開發完成，Draft PR 待正式 GitHub Pages Preview 部署與使用者驗收，尚未 Merge。** F2C-2 已上線 Production／Preview（`FX_OPAQUE_PRODUCER_SOURCE_GATE` 仍為 `false`，Producer 程式碼與 UI 已存在但雙層 gate 皆確認持續阻擋），merge parents 為 merge 前 `44fb3afb126b1d647e2b90caa2d6da6a88f9493b` 與 PR head `fd2ad473f539f9dce59953d196476a42bd498da4`，正常 merge commit、未使用 admin override；Deploy GitHub Pages run `31754065390` success，head 與 merge commit 一致。**F2C-3 是使用者明確授權的 Controlled Rollout 執行 Sprint（ADR-010／ADR-013 早已預告、保留給獨立 PR 的翻轉決策），本 Sprint 唯一 production code 改動是 `src/lib/fxOpaqueProducerGate.ts` 的 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 常數由 `false` 改為 `true`**；`deriveFxOpaqueProducerCapability(sourceGateEnabled, deploymentEnvironment)` 的 `sourceGateEnabled && deploymentEnvironment === 'preview'` AND 邏輯本身逐字未動，因為該邏輯早已將 Production 排除在外，翻轉結果為 **Preview capability 首次變為 ON，Production capability 依既有 environment guard 繼續恆為 OFF**。`buildFxConversionCreation()`／`buildFxConversionDeletion()`／`FxConversionProducerForm.tsx`／`App.tsx` 既有 producer wiring 完全未修改。測試面更新兩個因常數字面值變動而過時的既有斷言（`tests/fxOpaqueProducerGate.test.ts`「Preview 現為 OFF」→「Preview 現為 ON」、「opt-in false by default」→「gate 已明確翻轉為 true」；`tests/fxConversionIdentityRegression.test.ts` 兩個舊「gate 常數維持 false」歷史斷言，一項與既有測試重複已移除、另一項改寫為驗證 App.tsx producer wiring 呼叫點本身未被本 Sprint 觸碰），新增 3 項 F2C-3 專屬鎖定測試（Preview capability ON、Production capability 仍 OFF、AND-logic 契約本身逐字未變），`npm run test:ci` 由 1014 增至 **1016 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**本機隔離 build 驗證**（非正式 GitHub Pages 部署，以本機 HTTP server 依既有子路徑結構掛載 `dist/`／`dist-preview/`，headless Chromium 操作）：Production build 展開「交易基礎」後 Manual FX Producer 表單完全不出現；Preview build 同一操作下表單完整可見，並完成 TWD→USD／USD→TWD 雙方向真實建立（household 收支統計維持「收入 0 元｜支出 0 元」、交易列表正確顯示三列）、快速雙擊僅建立一組（double-submit guard 生效）、單獨刪除其中一腿被 `window.alert()` 正確攔截、刪除 opaque envelope 觸發正確 atomic 刪除文案並一次移除三筆記錄、reload 後記錄仍存在、JSON Backup 匯出後於**另一個獨立瀏覽器 profile**匯入還原、F2B resolver 對還原後資料仍回傳 `valid`（以 guard 仍正確攔截驗證）、390px 無水平溢出。**正式 GitHub Pages Preview 部署（`workflow_dispatch`）與該環境下的最終使用者驗收仍待 Draft PR 建立後另行執行，本機建置驗證不能取代之。** **明確不包含**：Production Producer enable、移除 `deploymentEnvironment === 'preview'` guard、`fxConversionAttribution`、`FinancialEvent` FX 接線、reconciliation `candidate`／`matched`、zero-effect attribution、grouped transaction row、新 transaction type、`transfer` 語意修改、CSV／Import Center、JPY／EUR、persistence architecture 修改、schema migration、Loan／Investment／Generic Split／Household Liquidity 公式／AI Decision／Rebalance／Firebase／Worker 修改、PR #322。**F2C-3 只是把 source gate 翻成 `true`，這是 controlled rollout 的 risk reduction 手段，不是 absolute legacy compatibility 保證（沿用 ADR-010 既有結論）；Preview 因此第一次具備真正建立 FX conversion 的 capability，但不代表 Production unlock 已授權，也不代表 F2D（`fxConversionAttribution`／`FinancialEvent` FX 接線）已開始。正式 Preview 環境驗收 PASS 是 F2D 開始前的必要 Gate。** UR-TODO-046 整體仍 OPEN。

**UR-TODO-046 FX-F2C-1 Minimal Consumer Guard 已正式完成／Merge／Production Verified（PR #326，merge commit `44fb3afb126b1d647e2b90caa2d6da6a88f9493b`）；FX-F2C-2 Manual FX Conversion Producer 開發完成，Draft PR 待架構與 Preview-enable 前審查，尚未 Merge。** F2C-1 已上線 Production／Preview（皆維持 F1D gate OFF），`FinancialTransaction.fxConversionLeg?` additive metadata、cash-flow 排除、reconciliation fail-safe、ordinary delete linkage guard 四項 consumer safety boundary 皆已生效。F2C-2 依 FX-F2C Review 的建議落地第一版 Manual FX Conversion Producer，**但不啟用正式 capability**（`FX_OPAQUE_PRODUCER_SOURCE_GATE` 仍為 `false`，未觸碰）。新增 `src/lib/fxConversionProducer.ts`：純函式 `buildFxConversionCreation()`（在記憶體中依序完成 gate check、帳戶／幣別／金額／生效日期／fee 驗證、identity 建立（`createTransactionId()` 依序產生 `sourceTransactionId`／`destinationTransactionId`／`conversionId`，皆於 submit 當下）、兩腿建構（重用既有 `updateTransaction()` 正規化管線，非另建一套）、F2B `resolveFxConversionEnvelope()` 完整驗證、跨 envelope duplicate 偵測，只有全部通過才回傳三筆記錄供 App 層執行**單一** `setState()`；任何步驟失敗回傳 typed 失敗結果，state 不變）與純函式 `buildFxConversionDeletion()`（只有 `valid`-resolved 的 envelope 才視為 active，回傳 atomic 刪除計畫）。新增 `src/components/fx/FxConversionProducerForm.tsx`：manual 表單第一版（支出帳戶／金額、存入帳戶／金額、單一 `effectiveDate`＝conversion 與兩腿共用、fee 四態選單預設 `unknown`、derived rate 唯讀顯示、`enabled` prop 作為 UI 層 gate），內建以 `useRef` 同步 guard＋microtask 延遲釋放的雙重送出防護（開發中發現：若只在 `finally` 內同步釋放 guard，因 builder／`setState` 全為同步操作，兩次快速連續點擊會在第一次呼叫完全結束、guard 已釋放後才處理第二次點擊，形同無效——已修正為延後至 microtask 邊界釋放並補上真實 DOM 雙擊回歸測試鎖定此行為）。App.tsx 新增 `createFxConversion()` handler（呼叫 builder，`gateEnabled` 由 `isFxOpaqueProducerEnabled(DEPLOYMENT_ENVIRONMENT)` 於此當下解析，成功才執行單一 `setState`）；既有 `deleteOpaqueTransaction()` 新增路由：opaque envelope 若經 `buildFxConversionDeletion()` 判定為 `valid`-resolved FX conversion，走 atomic 刪除（一次確認、一次 `setState`，同時移除 envelope 與兩腿，文案明確告知「將一併刪除此換匯記錄及其兩筆關聯交易」）；非 FX 或未能 valid-resolve 的 opaque 記錄，維持 F1A 既有 generic 刪除行為完全不變。既有 `deleteTransaction`（F2C-1 linkage guard）行為不變，被 active FX conversion 引用的交易仍不得單獨刪除。`TransactionList` 未修改，第一版換匯建立後於畫面顯示為兩筆一般交易列＋一筆 opaque placeholder 列（共三列，未做 grouped row，符合本輪明確範圍）。新增 44 個測試（`fxConversionProducer.test.ts` 30 項：builder 全驗證分支、atomic create、fee 四態、consumer regression、re-normalization／persistence／Backup round-trip；`fxConversionProducerForm.test.ts` 7 項：gate 顯示／隱藏、帳戶選單僅列 TWD／USD、fee 預設 `unknown`、derived rate 無可編輯欄位、雙擊防護含真實 DOM click 回歸；`fxConversionIdentityRegression.test.ts` ＋2；`transactionOpaquePlaceholderUi.test.ts` 原 R12 confirm 測試因新 handler 具巢狀分支，既有「首個 `};`」擷取法會截斷 handler，已修正為括號配對擷取，並拆為 2 項＋新增 1 項鎖定 atomic FX 分支文案），`npm run test:ci` 由 975 增至 **1014 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**已於隔離本機 Preview-deploy dev server 實機驗證**（未修改 gate 常數）：展開「交易基礎」區塊後，畫面僅顯示既有一般交易表單與 Import Center，**完全不出現** Manual FX Producer 表單或任何相關文字，確認 gate OFF 時 UI 層正確隱藏；Production／Preview 兩份 build bundle 因 producer 現為真正 runtime 呼叫路徑（非零 caller），**確認皆含** producer 相關程式碼（bundle size 由約 748KB 增至約 758KB，此為預期行為——gate 判斷發生在 runtime 而非 build time，Vite 無法對此 tree-shake），但 gate 常數本身於兩份 bundle 中確認仍為 `false`。**明確不包含**：F1D gate 開啟、Preview enable、Production enable、`fxConversionAttribution`、`FinancialEvent` FX 接線、reconciliation candidate/matched、zero-effect attribution、JPY/EUR 等其他貨幣對、CSV／Import Center FX 支援、grouped transaction list UI、新 transaction type、`transfer` 語意修改、schema migration、persistence architecture 修改、Investment／Loan／Generic Split 修改、AI Decision／Rebalance、Firebase／Worker、PR #322。**F2C-2 建立了完整的 Producer 程式碼與雙層 gate（UI＋write path），但 Production／Preview 目前皆仍無法真正建立 FX conversion；Preview 若要開放僅限 Preview 的 capability，仍須另一個獨立、明確授權、單獨審查的 PR 才能翻轉 source gate。** UR-TODO-046 整體仍 OPEN。

---

**UR-TODO-046 FX-F2B Pairing Identity Contract Foundation 已正式完成／Merge／Production Verified（PR #325，merge commit `18c2b47cb91d8fc1aaeddb3e682962f97d908867`）；FX-F2C Manual FX Conversion Producer Contract Review（Review Mode 唯讀盤點）已完成；FX-F2C-1 Minimal Consumer Guard 已正式完成／Merge／Production Verified（PR #326，merge commit `44fb3afb126b1d647e2b90caa2d6da6a88f9493b`，一般 merge commit，未使用 admin override；Production／Preview HTTP 200，assets 各自獨立，隔離正常）。** FX-F2C Review 逐一盤點交易建立 pipeline、帳戶餘額／收支／Household Liquidity consumer、F1A／F1D／F2B 既有模組與刪除契約，用具體程式碼路徑證實：若未來 producer 讓 FX conversion source leg 使用既有 `expense`、destination leg 使用既有 `income`（現有四個 `TransactionType` 中唯一能給出正確帳戶餘額方向的組合——`adjustment` 恆為加、無法表示扣款，`transfer` 明確拒絕跨幣別且為單一記錄模型），帳戶餘額會正確，但 `transactionCashFlowSummary()` 會把兩腿誤算成 household expense／income（未做任何幣別換算），且 TWD leg 會被 `transactionReconciliation.ts` 靜默判定成普通 `external-expense`／`external-income`，污染淨值成長歸因計算——因此 Producer **不得先裸上線**（判定 **GO C — Producer + Minimal Consumer Guard 必須同 Sprint**）。使用者已拍板：採 additive FX leg metadata、不新增第五種 transaction type、不重定義 `transfer` 語意；本 Sprint 只建立最小 consumer safety boundary，F1D gate 維持 OFF，不建立 producer、不建立 FX UI、不實作 `fxConversionAttribution`。本次 FX-F2C-1 開發依此落地：`src/lib/transactions.ts` 新增 additive 型別 `FxConversionLegAttribution`（`{ conversionId: string; role: 'source' | 'destination' }`，故意不存 amount／currency／accountId／executedRate／fee，避免形成第二套 SSOT）與 `FinancialTransaction.fxConversionLeg?`，比照既有 `investmentAttribution`／`loanAttribution` 慣例新增 pure `normalizeFxConversionLegAttribution()`（malformed metadata 整個欄位丟棄為 `undefined`，不變成 opaque、不影響交易其餘欄位正規化，經 `normalizeCandidate()` 走既有 closed-whitelist 加法式保留路徑，`TRANSACTION_SCHEMA_VERSION` 維持 `2` 不變，因為 F1A opaque compatibility contract 已足夠涵蓋此加法式欄位，實證確認不需要 bump）。`transactionCashFlowSummary()` 新增 `!t.fxConversionLeg` 排除條件——帶有效 FX leg 標記的交易不論 `type` 為 `expense` 或 `income` 皆排除於家庭收支統計之外，比照既有 `transfer` 的零效果慣例；`deriveTransactionAccountBalances()` **完全未修改**，兩腿帳戶餘額計算行為不變。`src/lib/transactionReconciliation.ts` 在每筆交易分類最前面新增 unconditional guard：只要 `transaction.fxConversionLeg` 存在即直接回傳 `status: 'unsupported', reason: 'fx-attribution-unsupported'`，不看幣別（TWD／USD 四種 source／destination 組合皆一致）、不看既有 `loanAttribution`／`investmentAttribution` 檢查，永不變成 `candidate`／`matched`／`duplicate`，永不產生 `external-income`／`external-expense`／derived evidence——本輪明確只是 fail-safe guard，非 FX reconciliation 實作。`src/lib/fxConversionIdentity.ts` 新增純函式 `findLinkedFxConversionId()`，重用既有 `resolveFxConversionEnvelope()`，只有 `valid`-resolved 的 opaque envelope 才視為「active」換匯（malformed payload、缺 linked transaction、金額／幣別 cross-validation 失敗的 envelope 皆不構成阻擋，延續 F1A Preserve≠Interpret 原則），供 `App.tsx` 既有 `deleteTransaction` handler 呼叫：交易若被 active FX conversion envelope 引用則不刪除、顯示提示「此交易屬於一筆換匯記錄，不能單獨刪除。請先處理完整換匯記錄。」，未被引用的一般交易刪除行為完全不變；`deleteOpaqueTransaction()` 本身**本輪未修改**（atomic FX delete 留給 F2C-2 Producer Sprint 與完整 FX UI 一起落地）。因為此 delete guard 是本輪唯一授權的 `App.tsx`→`fxConversionIdentity.ts` 呼叫點，F2B 既有「`App.tsx` 對此模組零 caller」的迴歸測試（`tests/fxConversionIdentityRegression.test.ts`）已同步更新為「僅允許 `findLinkedFxConversionId` 這一個呼叫點，其餘 producer／write path 符號仍必須為零」，該測試修改本身已記錄於本次治理同步。F1D gate（`FX_OPAQUE_PRODUCER_SOURCE_GATE = false`）本輪未觸碰。新增 16 個測試（`tests/transactions.test.ts` ＋4：normalization／round-trip／account balance／cash-flow exclusion；`tests/transactionReconciliation.test.ts` ＋6：TWD／USD source／destination 四組合對稱 fail-safe、never external-income/expense、ordinary transaction 不受影響；新檔 `tests/fxConversionLegDeleteGuard.test.ts` 6 項：linked source／destination 不可單獨刪除、unrelated transaction 可正常刪除、malformed payload 不誤擋、missing-linked envelope 不觸發 silent repair、invalid-resolved envelope 不視為 active），`npm run test:ci` 由 959 增至 **975 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；Production／Preview 兩份 build bundle 皆確認**不含**任何 producer 相關字串（`fxOpaqueProducerGate`／`buildFxConversionCreation`／`createFxConversion`），F1D gate 常數確認未被修改；`fxConversionLeg`／`findLinkedFxConversionId` 因已是真正 production 呼叫路徑（非零 caller），確認**有**編入兩份 bundle（預期行為，非 tree-shaking 排除對象）。**明確不包含**：`buildFxConversionCreation()`、Manual FX 表單、producer UI、opaque write path、F1D gate 開啟、atomic FX delete（`deleteOpaqueTransaction()` 一併刪兩腿）、fee UX、double-submit guard、Preview producer、`fxConversionAttribution`、`FinancialEvent` FX 接線、runtime zero-effect attribution、schema migration、persistence architecture 修改、Household Liquidity 公式修改、PR #322。**F2C-1 只是最小 consumer safety boundary，不代表 FX attribution 或 producer 已被授權；第一個 opaque FX producer（F2C-2）仍需另行明確授權與獨立 Sprint。** UR-TODO-046 整體仍 OPEN。

---

**UR-TODO-046 FX-F1A～F1D 已全數完成／Merge／Production Verified；FX-F2A（Repository Audit）與 FX-F2B（Pairing Identity Contract Review）唯讀盤點已完成；FX-F2B Pairing Identity Contract Foundation 開發完成，Draft PR 待 CI／架構審查，尚未 Merge。** FX-F2A（Review Mode）確認現有 FX Foundation（FX-A1/A2/A3）只能證明「單一外幣現金帳戶單一時點的 TWD 估值」，完全無法證明「兩筆交易共同構成一次換匯」——真正缺口是 FX conversion pairing identity，而非 attribution runtime；判定 **GO B**。FX-F2B（Review Mode）逐一比較 Investment／Loan／Generic Split／FinancialEvent 既有 identity pattern，設計 conversion identity（＝`OpaqueFinancialTransactionEnvelope.id`，不另存 `conversionId`）、leg identity（直接用 `sourceTransactionId`／`destinationTransactionId`，不建 `legId`）、executed rate（deterministic derive，不持久化，`TWD per USD` canonical unit）、fee 四態 contract（`none`／`explicit`／`included`／`unknown`，missing evidence ≠ `none`）等 contract，判定 **GO B**（identity 可定義，date／fee 部分細節待未來 Producer Sprint UI 決定）。本次 FX-F2B 開發依此結論落地為 **pure identity foundation**：新增 `src/lib/fxConversionIdentity.ts`——`isFxConversionPayloadCandidate()`／`parseFxConversionPayloadV1()`（payload shape 驗證，與 F1A envelope 驗證分層，一個 valid opaque envelope 可以有一個 invalid FX payload，F1A 仍 lossless preserve）、`deriveFxConversionExecutedRate()`（純函式，`TWD per USD`，不 import `fxValuation.ts`／`cbcFxProvider.ts`）、`resolveFxConversionFeeTreatment()`（四態，malformed `explicit` 不拖垮 principal conversion）、`resolveFxConversionEnvelope()`／`resolveFxConversions()`（單筆與跨筆 duplicate detection，只用 `sourceTransactionId`／`destinationTransactionId` 的 claim 衝突判斷 duplicate，不依日期／金額接近／memo／帳戶名稱／list adjacency）。第一版嚴格限定 TWD↔USD（兩個方向皆支援，不限單向），`accountId` 不存於 payload（從 linked transaction resolve），`sourceAmount`／`destinationAmount`／`sourceCurrency`／`destinationCurrency` 為 payload 內 pinned validation copy（與 linked transaction 交叉驗證，比照既有 Investment/Loan denormalized-copy 慣例）。**本 Sprint 沒有任何 producer、UI、`FinancialEvent` 接線或 reconciliation 修改**——`fxConversionIdentity.ts` 在 `App.tsx` 中零 caller，Production／Preview 兩份 build bundle 皆確認不含相關字串（Vite tree-shaking 排除）。開發中同時新增 F1A 既有 opaque preservation round-trip 的 FX 專屬 regression（含正確與 malformed FX payload 皆能被 F1A lossless preserve，僅 F2B resolver 對經濟語意判定 invalid/unsupported）與 reconciliation／`FinancialEvent`／F1D gate 三項「本 Sprint 未修改」的 regression test。新增 44 個測試，`npm run test:ci` 由 915 增至 **959 tests pass（0 fail）**；`npx tsc -b`、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功。**明確不包含**：第一個 opaque FX producer、FX producer UI、`fxConversionAttribution`、`FinancialEvent` 接線、reconciliation 修改、`replacementOfConversionId`（raw conversion 定義為 immutable，修正方式為刪除重建，非 forward-only replacement）、非 TWD/USD 貨幣對、CSV／Import Center FX 支援、F1D gate 開啟（Production／Preview 皆確認仍為 OFF）。**F2B 只是 identity 分類基礎，不代表已解決任何 attribution／producer 授權問題；第一個 opaque producer 仍需另行明確授權。** UR-TODO-046 整體仍 OPEN。

---

**UR-TODO-046 FX-F1A 已正式 Merge／Production Verified；FX-F1B／FX-F1C 唯讀盤點已完成；FX-F1D Controlled Producer Feature Gate Foundation 已正式 Merge／Production Verified（PR #324，merge commit `0b3522f55425034029196e4f4e0d5f45794e74bc`）。** FX-F1A（PR #323，merge commit `0c52670dbe7c5cead4e152bc99b5193a10681d66`）已上線 Production，`OpaqueFinancialTransactionEnvelope` lossless preservation capability 生效。FX-F1B（Consumer Guard Audit，Review Mode）逐一核對 account balance／cash-flow／reconciliation／runtime derived evidence／runtime attribution composition／Investment／Loan／Generic Split／Household Liquidity 等 consumer，確認全數為 **Type-level isolation**（`readonly FinancialTransaction[]` 簽章，opaque 在編譯期即無法傳入），無需任何 consumer production code 修改；結論 **NO-GO C — Producer Rollout Blocked**：真正 blocker 不在 consumer，而在 pre-F1A／stale tab client 會在 boot-time hydration write 或任何後續 `writeState()` 靜默摧毀未知的 opaque 記錄（已用 `git show` 直接比對 pre-F1A 版 `normalizeTransactions()`／`readStateWithSnapshotView()` 原始碼證實，非推測）。FX-F1C（Producer Rollout / Minimum-Reader Compatibility Contract Review，Review Mode）進一步評估 Minimum Reader Version Gate／Producer Capability Version／Build-Stale-Tab Detection 三個技術方案，逐一證實**任何 persistence-layer 的相容性設計都無法 retroactively 保護已部署、不會再更新的 client**——這是 SPA 架構性限制（保護機制＝新程式碼，舊 client＝沒有新程式碼，兩者邏輯互斥），已列為正式 architecture constraint；結論 **Option 1 — NO-GO（就 retroactive protection 而言）**，改採 **Controlled Rollout Policy**：不建立 general persistence concurrency guard，改用 narrow feature gate＋人工 rollout SOP 降低風險（risk reduction，非 absolute guarantee）。FX-F1D（本次開發）依 F1C 建議落地為 **Code Constant Narrow Gate**：新增 `src/lib/fxOpaqueProducerGate.ts`，`deriveFxOpaqueProducerCapability(sourceGateEnabled, deploymentEnvironment)` 為長期可重用的純函式 contract（`sourceGateEnabled && deploymentEnvironment === 'preview'`），`isFxOpaqueProducerEnabled()` 為目前唯一正式入口，讀取 hardcoded `FX_OPAQUE_PRODUCER_SOURCE_GATE = false`（本 Sprint 維持 `false`，未來若要開放僅限 Preview 也必須是獨立 PR 的明確 code diff）；第二層重用既有 `environmentBoundary.ts`／`environmentIdentity()`（未新增第二套環境判斷邏輯，無效環境值仍由既有機制 fail closed）。**未新增任何 Vite env**（`.env.production`／`.env.preview-deploy`／`environment-boundary-check.mjs` 均未修改——本 Sprint的 gate 完全是 source constant，不需要 build-time env 變數即可成立此 contract）。本 Sprint 唯一連帶必要修正：開發時發現 `tests/transactionOpaqueCompatibility.test.ts`／`tests/transactionOpaquePlaceholderUi.test.ts`（F1A 既有 17 個測試）自 PR #323 Merge 以來從未被 `npm run test:ci` 實際執行（僅存在於未被 `test:ci` 呼叫的獨立 `test:transactions` script），已將兩檔補入 `test:ci:unit-ts`，修正後 `npm run test:ci` 由 889 增至 915 tests pass（＋17 F1A opaque＋9 F1D gate，0 fail）。新增 9 個 F1D 測試鎖定：Production 在任何 source gate 值下永遠 OFF、Preview 需 source gate 同時為 true 才有 capability、目前 phase 下 Preview 與 Production 皆為 OFF、gate 為 deterministic pure function、gate 不重造環境判斷邏輯、gate 不讀 localStorage／AppState／query string／`import.meta.env`、gate 與既有 opaque preservation（`transactions.ts`）零耦合。`npx tsc -b`、`npm run test:ci`（915 pass／0 fail）、`npm run build`、`npm run build:preview`、`git diff --check` 皆成功；Production／Preview bundle 皆確認**不含**任何 `fxOpaqueProducerGate` 相關字串（因無任何 producer 呼叫此模組，Vite tree-shaking 天然將其排除於兩個 bundle 之外——比起「bundle 裡有但顯示已停用」更強的 Production OFF 證據）。**明確不包含**：`fxConversionAttribution`、第一個 opaque FX producer、FX producer UI、FX rate provider／valuation、Investment／Loan attribution、Generic Split、`FinancialEvent` schema、`TRANSACTION_SCHEMA_VERSION` bump、`writeState()`／`normalizeState()` persistence contract 修改、general multi-tab concurrency guard、`storage` event、BroadcastChannel、revision token、minimum-reader-version gate、pre-F1A stale client 保護（F1C 已證實架構性不可解，F1D 不重新嘗試）。**F1D 是 controlled-rollout risk reduction 工具，不代表已解決 legacy client retroactive protection 問題；第一個 opaque producer 仍需另行明確授權，不得因本 Sprint 完成自動解鎖。** UR-TODO-046 整體仍 OPEN。

---

**UR-TODO-046 FX-F1A Transaction Opaque Compatibility Foundation 開發完成，Draft PR 待 CI／Preview／使用者驗收，尚未 Merge。** 建立 `FinancialTransaction` 層的 mixed-version persistence compatibility capability——讓未來新經濟語意（含未來 FX conversion）能安全導入而不 silent drop、不 silent semantic downgrade。新增明確 discriminator `OpaqueFinancialTransactionEnvelope`（`transactionOpaqueEnvelopeVersion: 1`＋`id`＋不解讀的 `payload`）；`normalizeTransactions()` 明確三分（已知合法／明確 opaque marker 保留／格式錯誤 skipped，malformed ordinary 不得誤判成 opaque）。`AppState.opaqueTransactions` 為與既有 `transactions` 分開的加法式必要欄位，producer（帳戶餘額、收支統計、Household Liquidity、reconciliation）零 blast radius——opaque 記錄在型別層級無法被讀入計算；但 localStorage／JSON Backup 的原始 JSON 仍只有單一 `transactions` 欄位（`serializeTransactionCollection()` 於持久化邊界合併回同一陣列），不新增第二套 store 或 localStorage key。UI 提供最小 unsupported placeholder（無收入/支出徽章、無普通編輯、刪除需明確 `window.confirm()` 不可逆警告）。`TRANSACTION_SCHEMA_VERSION` 維持 `2` 不變。新增 17 個測試，`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功；隔離本機 dev server 實機驗證 placeholder 呈現、編輯/徽章隔離、刪除確認攔截後未刪除、reload 後 localStorage 正確合併回單一 `transactions` 欄位、390px 無溢出、console 無錯誤。**明確不包含**：`fxConversionAttribution`、FX identity／pairing／taxonomy、Household Liquidity／AI Decision／Rebalance／FinancialEvent Ledger／Generic Split／Investment／Loan 修改。FX-F1B 須等本 Sprint Production capability 驗證後才可開始，不與本 PR 合併同一 Sprint。UR-TODO-046 整體仍 OPEN。

**UR-TODO-046 FX-A1 USD/TWD Rate Provenance & Foreign Cash Valuation Foundation 已完成／Merge／Production Verified。** PR [#316](https://github.com/hyc640110/family-universal-rebalance/pull/316) 已正常 Merge，merge commit `62a5a9a8ed269bbac9d6e9370c524356cd3fa5e0`（parents：`98cd44ed2493594b1b67dc22e93f7b55345b2090`、`0c4da369449eea1d20d70b4767bdcba1bcb23002`；`mergedAt: 2026-08-12T15:21:56Z`；`mergedBy: hyc640110`；未使用 admin override）。PR CI Verification／`verify` run `31610595323` success；Preview workflow_dispatch run `31611211649` success，Preview source 為 PR head；Merge 後 Deploy GitHub Pages run `31611895289` success，head SHA 與 merge commit 一致。Production／Preview HTTP 200，metadata 分別為 `production`／`preview`，assets 路徑隔離正常。FX-A1 將 household valuation currency 定為 TWD，只建立 provider-independent 的 USD/TWD `reference-close` rate contract（`1 USD = quotePerBase TWD`）、最多 3 個 calendar days 的 carry-forward 與 fail-safe stale policy。`fxRateHistory` 為 AppState／localStorage／JSON Backup 的加法式 persistence；新 `NetWorthSnapshot.fxValuations?` 可保存 pinned USD foreign-cash valuation provenance，既有 snapshots 可讀但不回填、不重算、不改寫。FX-A1 本身未接 live provider／Central Bank API／Worker／UI、USD 自動 totals 或 snapshot producer；該 provider／Worker 階段已由下段 FX-A2 獨立完成。UR-TODO-046 整體仍 OPEN。

**UR-TODO-046 FX-A3 Foreign Cash Producer / Snapshot Integration 已完成／Merge／Production Verified。** PR [#320](https://github.com/hyc640110/family-universal-rebalance/pull/320) 已正常 Merge，merge commit `46d7b25a6c0f4bf56464d9aaa4a7e6aadebd5b0e`（parents：`b9abbb0ba8bc0195a94ba255a43257689c592ed7`、`57ce13a3679d5c74141f7f477b1de6eb2c6dfb91`；`mergedAt: 2026-08-13T09:42:23Z`；`mergedBy: hyc640110`；正常 merge commit，未使用 admin override）。PR CI Verification run `31623622367` success；Merge 後 Deploy GitHub Pages run `31687807762` success（`event=push`、`branch=main`、head 與 merge commit 一致）。Production HTTP 200、`environment=production`、asset `index-BQwS4psK.js`；Preview HTTP 200、`environment=preview`、asset `index-CIIiw0Ut.js`；Production／Preview isolation 已驗證正常。唯讀盤點確認並修正真實存在的 mixed-currency naked-sum Production bug：`calculateMetrics()`（`src/App.tsx`）先前把 `financialAccountLiquidTotal()`／`financialAccountNetWorthContribution()` 的原幣 balance 直接相加，非 TWD 帳戶（例如 USD）會被當成 TWD 數值裸加進 `cash`／`totalAssets`／`netWorth`。新增純函式 `deriveCanonicalNetWorthTotals()`（`src/lib/canonicalNetWorthTotals.ts`），完全重用 FX-A1 既有的 `deriveForeignCashValuation()`／`selectUsdTwdReferenceCloseRate()`，不建立第二套 FX 邏輯：TWD 帳戶沿用原 balance；USD 帳戶找到有效（未逾期 3 天）匯率後以 pinned TWD 估值計入；missing／stale rate、unsupported currency 或 invalid balance 一律排除該帳戶原幣金額（不得裸加、不得猜值），並將受影響的 `cash`／`totalAssets`／`netWorth` 標記為 `unavailable`（採使用者拍板方案 A：不得靜默排除後假裝 total 完整）。`NetWorthSnapshot` 新增加法式 optional 欄位 `cashAvailable`／`totalAssetsAvailable`／`netWorthAvailable`（`src/lib/netWorthHistory.ts`），舊 snapshot 無此欄位時視為 legacy／unknown、一律當作 available，不回填、不重算、不改寫；snapshot 建立當下同時將 producer 產出的 pinned `fxValuations` 傳入 `netWorthSnapshotFromTotals()`（先前 App.tsx 呼叫端完全未傳此參數，FX-A1 的 `fxValuations` 欄位至此才第一次被實際點亮）。無 schema version bump、無 Backup version bump、無 migration、無 historical rewrite。**明確不包含**：任何新 UI（依使用者拍板 FX-A3 MVP UI Strategy = A）、FX-A2 startup／render auto-fetch（新增 regression test 鎖定 `App.tsx` 不 import `cbcFxProvider`）、Household Liquidity（`householdLiquidityInputAdapter.ts` 完全未修改，non-TWD 帳戶維持既有 `unavailable` fail-safe 語意不變）、FX attribution（`netWorthAttribution.ts`／`runtimeAttributionComposition.ts` 完全未修改，兩者只被動讀取 `snapshot.netWorth`／`.date`）、conversion、realized FX、foreign investment／loan、Financial Event Ledger、Generic Split、AI Decision、Rebalance；Worker 本次未修改／未部署。新增 16 個測試（`tests/canonicalNetWorthTotals.test.ts`、`tests/fxA3NoAutoFetchRegression.test.ts` 新檔，`tests/fxValuationPersistence.test.ts` 擴充 2 項），`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功。**Production 實測驗證**（`https://hyc640110.github.io/family-universal-rebalance/`）與正式 Preview 環境（`https://hyc640110.github.io/family-universal-rebalance/preview/`）皆已完成：TWD 100,000＋USD 1,000＠31 正確顯示總資產 **13.1 萬元（131,000）**，不再是裸加總 **10.1 萬元（101,000）**；移除匯率後正確顯示 10 萬元（USD 帳戶被排除而非裸加或猜值，`cashAvailable=false`）；snapshot provenance（pin、rate revision 不改寫已建立 snapshot、legacy snapshot 不回填）、no startup／render auto-fetch（`fx-rates`／`cbc` 網路請求數 = 0）均已驗證；Production bundle 確認不含 PR #320 內容混入、Preview bundle 確認正確反映 PR #320 內容，assets 路徑與 hash 各自獨立。**UR-TODO-046 整體仍 OPEN，本次完成的是 FX-A3，不代表整體結案。** Remaining Boundary：FX attribution evidence／runtime integration、conversion／realized FX、foreign investment／foreign loan、Loan UI／CSV／Import Center producer mapping 均未開始。

**UR-TODO-046 FX-A2 CBC USD/TWD Provider Adapter 已完成／Merge／Production Worker Deployed／Production Verified。** PR [#318](https://github.com/hyc640110/family-universal-rebalance/pull/318) 已正常 Merge，merge commit `3341dfd81e7c1e57fe5d325e85c6303bc5d3b358`；PR CI Verification／`verify` run `31615645452` success，Merge 後 Deploy GitHub Pages run `31616344290` success，head 與 merge commit 一致。唯一 provider 為 CBC 官方 `FTDOpenData_Day`：Market Data Worker `GET /fx-rates/usd-twd` 逐列驗證 `日期`／`NTD_USD`，拒絕 malformed、same-day conflict、空資料與 provider failure，只輸出正規化 `available`／`unavailable` contract；前端可呼叫 adapter 重用 FX-A1 的 3 calendar days stale policy，將有效資料以 deterministic `cbc-ftd-usd-twd-reference-close-YYYY-MM-DD` 追加到 `fxRateHistory`，同日同值 idempotent、不同值保留既有歷史並回報 conflict。Production Worker `family-universal-rebalance-market-data-production` 已於 `2026-08-12T16:17:13.176Z` 部署 version `7d4221c1-691f-42e4-b1ae-0a48e40603ba`；`/health` 為 HTTP 200、`environment=production`，`/fx-rates/usd-twd?refresh=1` 為 HTTP 200、`status=available`、USD→TWD、`rateDate=2026-08-12`、`quotePerBase=32.246`，與 CBC 官方資料一致，回應不含 raw CBC rows 且為 `cache-control: no-store`。Preview Worker version `b83bc7f0-3f7d-4bb3-9093-93a0b256ba44` 維持 `environment=preview`；Production／Preview Pages 均 HTTP 200，環境 metadata 與 assets 隔離正常。未接 UI、startup auto-fetch、foreign-cash totals、snapshot producer、FX attribution、Financial Event／Ledger、conversion、realized FX、foreign investment／loan、AI Decision、Rebalance 或 Household Liquidity；無 schema／Backup version bump、migration 或 legacy rewrite。UR-TODO-046 整體仍 OPEN；FX-A3 尚未開始。

**UR-TODO-001 Firebase Retirement 已正式完成／CLOSED，採 Archived Retirement／封存保留。** 正式 `origin/main` 為 PR [#314](https://github.com/hyc640110/family-universal-rebalance/pull/314) merge commit `54bd6794c0ac8ec1704c979cdb7e56e81818de32`。P3-B2-A～P3-B3-C 已全數完成並 Merge；現行 App 的 Firebase Auth、RTDB GET／PUT、token refresh、upload/download UI、remote Ledger merge、Firebase SDK dependency 與 active Firebase environment naming 均為 0。canonical `AppState` 無 Firebase config；新 JSON Backup 不輸出 Firebase config；legacy Firebase input 僅 tolerant-read／accept-and-discard。localStorage 是唯一 canonical device persistence，JSON Backup 是正式人工備份／裝置搬移，Financial Event Ledger 與 `mergeFinancialEventLedgers()` 均維持 KEEP，Preview／Production isolation 不變。P4 已完成受控 archive/hash evidence、RTDB deny-all Rules 與 Anonymous Auth disabled 的封存驗證；Production 實機證實不依賴 RTDB／Anonymous Auth。Firebase Project、RTDB historical data、19 個歷史 anonymous users 與 Web App registration 均保留為 archived retired resource；不存在 REQUIRED-DELETE blocker。未來任何破壞性清理均為 optional housekeeping，須重新唯讀盤點與明確授權。

**補充澄清（2026-08-15，Claude Code Review Mode 查證）：** `mergeFinancialEventLedgers()`（`financialEvents.ts`）是 UR-TODO-046 階段預留的 union-merge 純函式能力，目前 `src/` 全域零呼叫者，未接上任何 UI 觸發路徑，非現行使用中功能。若未來要重新啟用 Firebase 傳輸層，需另立獨立 Sprint 補上 UI wiring 與觸發流程，比照 UR-TODO-054 Loan／FX confirmation UI 的既有模式處理，不可假設此函式已可用。

> 下段為 PR #304 Merge 前的 P2-A Draft 歷史快照；僅供歷史脈絡，不代表現行狀態。現行狀態以本段與 GitHub `main` 為準。

**UR-TODO-001 Firebase Retirement 採方案 B（2026-08-11）。** 此為既有 UR-TODO-001「Firebase Security Rules Expiry／Anonymous Auth」已完成歷史（PR #252）的後續 retirement phase，不覆寫該歷史結論。P0 Governance 已由 PR #302 完成；P1 On-demand Anonymous Auth 已由 PR #303 Merge，merge commit `1bbba423d3626b7a63fe48e5201c29597f682367`，一般 App startup 不再建立 Firebase Anonymous Auth。現行 P2-A Draft 開發只移除 active Firebase Auth／RTDB transport、manual sync UI、remote Ledger merge、runtime sync status／baseline／remoteMeta consumer；localStorage 維持唯一 canonical runtime state，JSON Backup 維持人工備份／搬移／災難復原，Ledger 的 localStorage／JSON Backup persistence、schema、normalization、validation、identity／collision、atomic group、void、linked transaction identity、attribution start date、forward-only、attribution／reconciliation contract 均不可變更。legacy `syncMeta`／`syncSettings.firebase` 只保留讀取與 payload 相容；不新增 metadata schema、不做 Backup migration。P3 才清理 Firebase env/config、helper、tests 與治理殘留；P4 Console retirement 需再次明確授權。P4 前禁止 Firebase Console 資料、Auth provider、Rules、RTDB／Project 或設定的任何變更，亦無 Production deploy。P2-A 尚待 CI、Preview、使用者驗收與 Merge；下一直接起點為 **P2-A Draft 驗證與 Preview 授權**，不得自行開始 P3。

**UR-TODO-046-L2C Cross-Version Sync Recovery & Status Contract Audit、L2C-P0 與 L2C-P2 已正式完成。** PR [#298](https://github.com/hyc640110/family-universal-rebalance/pull/298) 已由使用者授權正常 Merge，merge commit `af79903f547f498194cbe9b383a90cabdf28afdd`（parents：`149de0b9aa977a2c5fd1ef6d4af98c233af390a1`、`cd3bbaac9d9c0c440b9a61e5a6bc04e806850812`；`mergedAt: 2026-08-10T14:16:08Z`；`mergedBy: hyc640110`）。GitHub `main`／`origin/main` 與 merge commit 一致；PR CI Verification／`verify`（run `31396033551`）success，Merge 後 Deploy GitHub Pages run `31397236443` success，head SHA 與 merge commit 一致；Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 均可載入。L2C Audit 證實既有 Production 的「目前支援 v2」為舊 bundle 持久化的 `syncMeta.status` 文字，而非 Ledger 資料損毀；L2C-P0 改為 runtime-only、依當次事實動態建立 status，reload／Ctrl+F5 不再把歷史錯誤當 current status。schema mismatch UI 現在分別顯示 local／remote Ledger schema、current writer schema 與 supported versions（v1／v2／v3）；writer schema 與 supported versions 已分離。`schema-version-mismatch`、`unsupported-future-schema`、`event-id-collision` 為 structured、互斥的 merge reject taxonomy；v1／v2 mixed merge 持續 fail-safe reject、upload no-PUT、no downgrade，download reject 不改寫 local Ledger。L2C-P1 forensics 證實已盤點的 Production local／Firebase raw Ledger 均無 FinancialEvent event，故無需 authoritative-side selection、recovery、conversion 或 deterministic union。L2C-P2（PR [#300](https://github.com/hyc640110/family-universal-rebalance/pull/300)）已由使用者授權正常 Merge，merge commit `9a4463b75564dfce3b73c5f57c6edb53118792af`（`mergedAt: 2026-08-10T16:40:00Z`；`mergedBy: hyc640110`）；PR CI Verification／`verify` run `31409415184` success，Deploy GitHub Pages run `31410135891` success，head SHA 與 merge commit 一致。P2 將 remote 同時缺少 `financialEventSchemaVersion`／`financialEvents` 明確標為 runtime-only `missing-ledger`：在 merge、remote normalize／apply、`flushDrafts()` 與 Firebase PUT 前停止，不建立 synthetic empty Ledger、不改 local Ledger／`financialEventAttributionStartDate`／sync baseline／remoteMeta，也不持久化到 localStorage、JSON Backup 或 Firebase。未新增 migration、v1→v3／v2→v3 conversion、cross-version semantic merge、authoritative-side selection 或 Ledger rewrite。**UR-TODO-046 整體仍未結案**：FX attribution、Loan UI／CSV／Import Center 與其他 consumer mapping 仍是 Remaining Boundary；Firebase 跨裝置同步已規劃退役，後續僅可依既有 UR-TODO-001 另行唯讀決策，不得自行啟動。

**UR-TODO-046-L2A Split Allocation Contract Audit 與 UR-TODO-046-L2B Generic Split Allocation Foundation 已正式完成。** PR [#296](https://github.com/hyc640110/family-universal-rebalance/pull/296) 已由使用者 Merge，merge commit `a355a3986f45f7bd15b61bc1d3f93f06ad633a41`（parents：`2dcc66b96f51d2c580007c951e6393b1b1376b92`、`724a7b2b5cb24ecad309a7d6c4bd1d04132f7f09`；`mergedAt: 2026-08-10T12:23:50Z`；`mergedBy: hyc640110`）。GitHub `main`／`origin/main` 與 merge commit 一致；PR CI Verification／`verify`（run `31386340292`）success，Merge 後 Deploy GitHub Pages run `31387817114` success，head SHA 與 merge commit 一致；Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 均可載入。FinancialEvent schema v3 已正式進入 main：generic split 以 `allocationGroupId` 的 Atomic Group 表示完整 economic event，FinancialEvent Ledger 是唯一 persistent SSOT；只有同 domain／transactionId／account／currency／effectiveDate、一致且完整、amount-conserving 的 group 才可歸因，任一 component Void 即整組失效。修正維持 forward-only：先 Void 舊 group，再 append 使用新 group id 與新 event ids 的完整 replacement group；`replacementOfGroupId` 不會自行作廢舊 group。v2 client 讀 v3 Ledger 時保留 opaque payload、不得進 runtime attribution／reconciliation／derived suppression；future schema 同樣 fail-safe。Firebase v2/v3 mixed-version merge 與同 event id 不同內容皆 fail-safe reject，partial group union 在完整前不消費。Loan L1 principal／interest／fee／penalty 語意不變。本階段未新增 UI、CSV、Import Center、Investment、FX consumer、AI Decision、Rebalance 或 Dashboard，亦未 migration／改寫既有資料。**UR-TODO-046 整體仍未結案**：FX attribution，以及尚未授權的 Loan UI／CSV／Import Center 與其他 consumer mapping 仍是 Remaining Boundary；不得自行啟動下一子階段。

**UR-TODO-046-L1 Loan Repayment Contract & Fail-safe Attribution Foundation 已正式完成。** PR [#294](https://github.com/hyc640110/family-universal-rebalance/pull/294) 已由使用者使用既定 admin merge 例外合併，merge commit `b88c35511be509a84ba756a9a075df6d047154ad`（parents：`1a80d08bdc5371fe3bb0a0a67ef533571db2214a`、`0f82d999b4e04d414a8e00160b1a5a7915992407`；`mergedAt: 2026-08-09T17:01:56Z`；`mergedBy: hyc640110`）。`origin/main`／GitHub `main` 與 merge commit 一致；Deploy GitHub Pages run `31325341109` success，head SHA 與 merge commit 一致；Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 可載入。L1 新增 `FinancialTransaction.loanAttribution?` 的加法式明示 contract（repayment／disbursement／cash-movement），以及 FinancialEvent schema v2 的 optional `componentLink`／atomic confirmation group。完整 TWD repayment 僅以明示 component 歸因：principal = 0，interest／fee／penalty = 一次負 contribution；disbursement = 0；20,000 還款（principal 15,000、interest 5,000）最終僅有 net-worth contribution `-5,000`，不另產生 `external-expense -20,000`。`componentId` 在同一 `loanId` identity domain 內不得跨 payment 重複，且 `appendFinancialEventGroup()` 寫入邊界自行重跑完整 repayment contract／transaction／cash linkage／component group 驗證。缺 loanId、paymentId／componentId、component 合計、唯一 cash linkage、TWD 或完整 group 任一證明時，皆 fail-safe 至 unsupported／residual；沒有正式 Loan contract 的 `expense-housing` 與既有 linked `external-expense` Ledger event 均不得用 description、merchant、note、generic taxonomy、月付／利率／本金快照推測歷史還款、產生 contribution 或 fallback 成 `external-expense`。只有完整且全部 posted 的 component group 才可 Ledger-confirmed；pending／mixed／excluded／void component 均使整組不生效，任一 component Void 會停止整組 attribution，只有新的完整 group 才可重新辨識。duplicate paymentId／componentId、Ledger confirmed 與 runtime evidence、transaction／cash movement 均維持防 double-count。v1 Ledger 可讀、v1/v2 Firebase Ledger 不安全混合拒絕；localStorage／JSON Backup／Firebase 保持加法式相容，無 migration。已驗證 788 unit／Risk 3／MJS 18、TypeScript、Production／Preview build、Bundle manifest（Full 22/22、Lite 6/6）與 `git diff --check`；最終獨立 Merge 前審查 PASS、Merge Blocker：無。**UR-TODO-046 整體仍未結案**：split allocation、FX attribution，以及尚未授權的 Loan UI／CSV／Import Center consumer mapping 為 Remaining Boundary；持股 replay、realized gain/loss、Household Liquidity、CLEC、AI Decision、Rebalance 與 Dashboard 均未納入。

**UR-TODO-046-I1 Investment Trade Contract & Fail-safe Reconciliation Foundation 已正式完成。** PR [#292](https://github.com/hyc640110/family-universal-rebalance/pull/292) 已由使用者 Merge，merge commit `b8621a0bf5e13a7666b360829e276d6d87019a44`（parents：`8622ae31f06a5b2fced1b0757a563968be12a2ee`、`c2d418306bba93940a67f37178f5fda306af483f`；`mergedAt: 2026-08-09T06:54:31Z`）；`origin/main`／GitHub `main` 一致。Merge 後 Deploy GitHub Pages #339（run `31299929750`）成功，head SHA 與 merge commit 一致；Production HTTP 200、environment=production、App root 與正式 JavaScript bundle 可載入。完整正式 TWD buy／sell 優先於 generic taxonomy，對應 `investment-buy`／`investment-sell`，buy／sell 本金 contribution 固定為 0；一般、未附正式 trade contract 的 `income-other` 保留既有 `external-income`。fee／tax 只有同時具 stable `costId`、`settlementCostTreatment: independent` 與唯一正式 trade 關聯時才為一次負 contribution；`included`、`unknown`、legacy、重複或無法關聯者 fail-safe。trade 與另建 cash movement 必須以明確 `cashMovementId`／`kind: cash-movement`／方向／相同帳戶與幣別唯一連結，以防 double-count；duplicate stable trade identity、Ledger confirmation／runtime derived evidence／Void 路徑同樣維持去重。dividend reinvestment 保留 dividend 的一次外部增加，後續 buy 為 0；非 TWD 維持 FX unsupported／residual，不建立 realized gain/loss contribution。無 schema version bump、無 migration；localStorage／JSON Backup／Firebase／legacy normalization 相容。已驗證 `npx tsc -b`、`npm run test:ci`（785 unit／Risk 3／MJS 18）、Production／Preview build、Bundle validation、PR CI與Production部署。**UR-TODO-046 整體仍未結案**：split allocation、loan principal／interest attribution、FX attribution 仍為 Remaining Boundary；不得自行啟動下一子階段。

**UR-TODO-053 趨勢圖改為「相對今日淨資產」基準線填色正式完成，目前 `main`／`origin/main` 正式基線為 `8d8dddf`（[PR #290](https://github.com/hyc640110/family-universal-rebalance/pull/290) merge commit，`feat/trend-chart-baseline-relative-fill`）**。取代 UR-TODO-027 已完成的「逐段漲跌」填色邏輯（不是新增並存），新增一條固定在「今日淨資產／今日{title}」高度的水平基準線，折線高於基準線紅色、低於綠色，用以快速判斷目前是否處於相對低點。唯讀盤點確認 `monotoneSegments()`／`monotonePath` 曲線計算可完全重用，並驗證既有時間範圍篩選函式（`historyForRange()`／`filterInvestmentPerformanceRange()`）保證陣列最後一筆永遠是最新資料，基準線可安全固定為絕對值、不隨範圍切換改變。使用者決策：交叉點計算採線性插值（跨越基準線的段落用數值線性插值算出交叉點，拆成兩個三角形分別上色，交叉點附近會有一小段直線收尾，非貝茲曲線精確弧度，唯讀盤點時已揭露此近似）；基準線加淡色虛線＋「今日」文字標示；文案採「以今日{title}為基準：折線高於今日為紅色，低於今日為綠色，用以快速判斷目前是否處於相對低點。」放在圖表下方。**開發中發現一個唯讀盤點未預見的範圍問題**：`TrendChart` 為「淨資產趨勢」與「投資資產趨勢」共用元件，文案若寫死「淨資產」會對投資資產圖表文不對題；已改用元件既有 `title` prop 動態組字解決，不需新增 prop 或保留兩套邏輯。**首次 Preview 驗收發現真實 Bug 並已修正**：使用者回報 30 天視圖中明顯低於基準線的一段完全沒有綠色填色（高於基準線的紅色正常）。直接檢視渲染後 SVG DOM 確認根因（非猜測）：`up`／`down` 兩個方向的 `<linearGradient>` 誤共用同一組 `y1`／`y2` 座標範圍（`top`→`refY`），紅色區塊像素座標剛好完全落在此範圍內、綠色區塊則明顯超出，SVG 預設 `spreadMethod="pad"` 讓超出範圍的部分沿用最後一個 stop 的顏色（全透明），導致綠色填色路徑幾何正確但畫面全透明。修正：`down` 漸層改用 `height-bottom`→`refY`（與 `up` 的 `top`→`refY` 對稱）；新增迴歸測試直接斷言每個方向的漸層範圍必須完整涵蓋該方向填色路徑的座標範圍，確認此測試在修正前會重現與回報一致的失敗、修正後通過。`tests/trendChartGradientArea.test.ts` 因語意完全改變全數改寫並新增迴歸測試（7→11 個測試）。868 tests pass，`npx tsc -b`、Production／Preview build 皆成功；隔離本機 dev server 以與回報情境相同結構的資料重現問題並確認修正後兩方向填色的像素 Y 座標範圍皆完整落在各自漸層範圍內，兩種圖表（淨資產／投資資產）文案皆正確依 `title` 動態顯示，console 全程無錯誤。**未修改**`deriveTrendDomain()` Y 軸刻度邏輯、`netWorthHistory.ts` 資料層、資料點 hover／touch 互動、X 軸索引式定位邏輯。修正後使用者於 Preview 再次驗收通過並指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31247906331` success），Production／Preview `curl` 實測皆 `HTTP 200`。詳見 `008_TODO_BACKLOG.md` UR-TODO-053 條目。

**UR-TODO-046 記帳事件撤銷／作廢（Void）正式完成，目前 `main`／`origin/main` 正式基線為 `7d5ee5e`（[PR #288](https://github.com/hyc640110/family-universal-rebalance/pull/288) merge commit，`feat/ur-todo-046-financial-event-void`）**。使用者拍板作廢採「新增獨立作廢事件」而非原地修改（`FinancialEventSource` 新增 `'void'`＋新欄位 `voidedEventId`，`type` 沿用既有零貢獻的 `'adjustment'` 分類），維持 forward-only。唯讀盤點發現兩個原始拍板未提及、但正確落地必須一併修正的既有程式碼連帶缺口：`normalizeFinancialEventLedger()` 的 `consumedTransactionIds` 追蹤原本不知道外部作廢標記存在，會讓被作廢事件永久佔用 `transactionId`；`runtimeAttributionComposition.ts` 同理不知道作廢存在，交易會永遠卡在 `matched`、經濟效果永久消失於歸因計算外。使用者同意一併修正：新增共用 `collectVoidedEventIds()`，`normalizeFinancialEventLedger()` 與 `runtimeAttributionComposition.ts`（evidence 建立＋`reconcileTransactions()` 呼叫前）皆改用此函式過濾，`netWorthAttribution.ts` 核心公式與 `transactionReconciliation.ts` 皆未觸碰。UI：「本次已正式記帳」session-only 收據列新增「撤銷」按鈕，作廢後收據移除、底層交易重新出現在「衍生證據逐筆清單」；撤銷本身單向、不提供復原（使用者拍板）；範圍沿用收據清單既有 session-only 邊界，未新建頁面。**與 Firebase Ledger Sync 相容性極佳**：作廢事件對既有 `mergeFinancialEventLedgers()` 而言只是普通新事件，聯集去重機制原生正確處理，forward-only＋聯集合併結構性保證作廢標記不會「復活」，`mergeFinancialEventLedgers()` 完全未改動。新增 17 個測試（864 tests pass），`npx tsc -b`、Production／Preview build 皆成功；隔離本機 dev server 注入 fixture 實機驗證完整確認→撤銷→重新整理持久化流程正確，console 無錯誤（`window.confirm()` 因自動化工具安全攔截，測試階段暫時覆寫以驅動點擊，僅限本機測試資料）；Preview 部署後另以 `curl` 直接比對已部署 JS bundle 內容，確認新文案（含「撤銷」按鈕與更新後的確認對話框）已上線、舊的「本次不提供撤銷功能」文字已消失。依 UR-TODO-050 方案 B 流程，Claude Code 先觸發 `workflow_dispatch` 刷新 Preview，使用者驗收通過後直接指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31245365043` success），Production／Preview `curl` 實測皆 `HTTP 200`。**UR-TODO-046 仍未完全結案**：split allocation、investment buy／sell attribution、loan principal／interest attribution、FX attribution 仍待未來獨立排程與產品決策。詳見 `008_TODO_BACKLOG.md` UR-TODO-046 條目。

**UR-TODO-048 `allocationRoleBySymbol` 資料層清理正式完成，目前 `main`／`origin/main` 正式基線為 `19e60be`（[PR #286](https://github.com/hyc640110/family-universal-rebalance/pull/286) merge commit，`feat/ur-todo-048-allocation-role-by-symbol-cleanup`）**。唯讀盤點提出畫面呈現三個方案，使用者選擇方案 c：移除 `ClecStrategyCenterPage.tsx`「目前配置來源」卡片的角色標籤顯示（原型資產／槓桿資產／類現金持股／未指派），改為只顯示代號＋目標比例，卡片下方新增連到配置模擬器（`/tools/allocation-simulator`）的連結——該頁已有 phase C 完成的 session-only CLEC 角色選擇器，避免重複打造第二組角色選擇 UI。殘留資料處理採方案 A：`allocationRoleBySymbol` 從 `AppState`／`BackupPayload` 型別、`normalizeState()`、`backupPayload()`、`stateFromBackup()`、`SYNCABLE_TOP_LEVEL_FIELDS`、`removeHoldingAsset()` 全數移除，不需 migration（既有正規化路徑本來就是逐欄位重建物件，舊資料的殘留屬性自然被忽略）。`src/lib/clecStrategy.ts`／`src/lib/allocationPresets.ts` 完全未改動——Allocation Simulator 既有 session-only 角色選擇器仍依賴這些通用純函式，不在本次清理範圍；CLEC Strategy Center 呼叫端改傳固定 `roleBySymbol: {}`，行為與清理前一致。刪除 `tests/clecRoleSemanticScopeNote.test.ts`（測試對象隨功能移除）。847 tests pass（849 − 2，剛好對應刪除的測試檔案），`npx tsc -b`、Production／Preview build 皆成功；隔離本機 dev server 與 Preview 環境實機驗證卡片呈現與新連結導向皆正確，console 無錯誤。依 UR-TODO-050 方案 B 流程，Claude Code 先觸發 `workflow_dispatch` 刷新 Preview，使用者驗收通過後直接指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31235941833` success），Production／Preview `curl` 實測皆 `HTTP 200`。**UR-TODO-048 子階段 A～E、步驟一與步驟二（本次）全數完成，整體正式結案。**詳見 `008_TODO_BACKLOG.md` UR-TODO-048 條目。

**UR-TODO-046 Firebase Financial Event Ledger Sync 正式完成，目前 `main`／`origin/main` 正式基線為 `aed0d00`（[PR #284](https://github.com/hyc640110/family-universal-rebalance/pull/284) merge commit，`feat/ur-todo-046-financial-event-ledger-firebase-sync`）**。使用者拍板：觸發時機不變（仍手動「上傳雲端」／「下載雲端」，不做自動同步）；衝突處理採直接合併不覆蓋（依 `id` 去重取聯集，任一方獨有事件不消失）；任一方 Ledger schema 版本不受支援時整批 fail-safe 拒絕（不做部分合併）。開發中發現一個唯讀盤點未預見的連帶缺口——合併進來的 linked event 若指向本機交易清單中尚不存在的交易會被既有驗證捨棄，使用者拍板「偵測並警示，不阻擋」，已新增 `droppedFinancialEventCount` 於同步狀態訊息呈現。新增 25 個測試（849 tests pass），`npx tsc -b`、Production／Preview build 皆成功。**驗證限制（已於 PR 說明中揭露）**：上傳／下載按鈕完整端對端點擊流程未能在自動化 Browser pane 環境完成（上傳卡在既有、非本次修改的 `flushDrafts()` 內 `requestAnimationFrame` 於背景分頁不觸發；下載的 `window.confirm()` 被自動化工具基於安全考量攔截），改為請使用者於一般前景瀏覽器親自完成按鈕點擊驗證；下載雲端 confirm 對話框的 Ledger 合併例外文案已於 Preview dev server 實機確認逐字渲染正確。依 UR-TODO-050 方案 B 流程，Claude Code 先觸發 `workflow_dispatch` 刷新 Preview，使用者驗收通過後直接指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功（`Deploy GitHub Pages` run `31234711268` success），Production／Preview `curl` 實測皆 `HTTP 200`，`deployment-environment` metadata 分別為 `production`／`preview`。**UR-TODO-046 整體仍未完成**：撤銷／void、split allocation、investment buy／sell attribution、loan principal／interest attribution、FX attribution 仍待未來獨立排程與產品決策，不得因本次完成而自行標記整體已完成。詳見 `008_TODO_BACKLOG.md` UR-TODO-046 條目。

**UR-TODO-051（交易匯入中心「撤銷」按鈕失敗時完全靜默無回饋）正式完成，目前 `main`／`origin/main` 正式基線為 `9a2c5df`（[PR #282](https://github.com/hyc640110/family-universal-rebalance/pull/282) merge commit）**。開發前唯讀盤點確認除既有兩項限制（交易被編輯過、交易已被逐筆刪除）外無其他失敗情況；新增純函式 `evaluateRollbackImport()` 把判斷邏輯（維持原有語意不變）抽出成可測試、回傳明確結果的獨立函式，`ImportCenter.tsx` 新增 `rollbackFeedback` state 沿用既有 `Feedback` 慣例，成功與兩種失敗原因皆有明確區分訊息。新增 7 項測試，已驗證修復前失敗、修復後通過。`npx tsc -b`、`test:ci`（832 項）、Production／Preview build 皆成功。依 UR-TODO-050 方案 B 新流程，Claude Code 先觸發 `workflow_dispatch` 刷新 Preview，使用者驗收通過後直接指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署成功，Production／Preview `curl` 實測皆 `HTTP 200`。**UR-TODO-049、UR-TODO-050、UR-TODO-051 三項關聯問題至此全數結案。**詳見 `008_TODO_BACKLOG.md` UR-TODO-051 條目。

**UR-TODO-049（交易匯入中心匯入預覽勾選框點擊觸發 ErrorBoundary crash）正式完成，目前 `main`／`origin/main` 正式基線為 `685c2a6`（[PR #280](https://github.com/hyc640110/family-universal-rebalance/pull/280) merge commit）**。開發前唯讀盤點以 jsdom＋`react-dom/client` 真實重現原本的 crash（原生 `.click()`），確認成因為 `event.currentTarget` 在延遲執行的 `setPreview` updater 內已失效；修復為先同步擷取 `checked` 區域變數再於 updater 內使用。新增 `jsdom` devDependency（使用者已明確同意）與對應迴歸測試，已驗證測試在修復前失敗、修復後通過。`npx tsc -b`、`test:ci`（825 項）、Production／Preview build 皆成功，隔離本機 dev server 桌機＋390px 以真實原生點擊驗證不再崩潰。依 UR-TODO-050 方案 B 新流程，Claude Code 先觸發 `workflow_dispatch` 刷新 Preview，使用者驗收通過後直接指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。Merge 後 push 部署完整成功、正確沿用剛才 `workflow_dispatch` 的 Preview 內容，Production／Preview `curl` 實測皆 `HTTP 200`。詳見 `008_TODO_BACKLOG.md` UR-TODO-049 條目。

**UR-TODO-050（`deploy.yml` Preview 部署 race condition，方案 B）正式完成，目前 `main`／`origin/main` 正式基線為 `f489225`（[PR #278](https://github.com/hyc640110/family-universal-rebalance/pull/278) 熱修 merge commit）**。改為 `push` 到 `main` 時不重建 Preview（改沿用最近一次成功 `workflow_dispatch` run 的 Pages artifact 中的 `preview/` 資料夾），只有 `workflow_dispatch` 才重新建置 Preview；因 `actions/deploy-pages` 無 partial update、每次都完整取代整個網站，若單純跳過建置會讓 Preview 變 404，故改用 reuse 舊 artifact 的方式維持 Preview 內容不變。**[PR #277](https://github.com/hyc640110/family-universal-rebalance/pull/277) Merge 後第一次真實 push 部署實際失敗**（`gh run list` 因無法自動偵測 repo 而報錯，導致該次 push 對應的 Production 部署未更新，僅暫時停留在上一 commit，全程可正常瀏覽、無中斷），已依使用者指示主動回報並以 PR #278 熱修（加上明確 `--repo` 旗標，reuse 路徑全程 `continue-on-error` 且 fallback 改為直接檢查產物是否存在），熱修 Merge 後的 push 部署完整成功，Production／Preview 皆確認正確。**語意變化：往後驗收 PR 前需先觸發一次 `workflow_dispatch`，Preview 才會反映該 PR 內容；日常 main push 不會再覆蓋正在驗收中的 Preview。**詳見 `008_TODO_BACKLOG.md` UR-TODO-050 條目（含完整故障與熱修記錄）。

**UR-TODO-052（移除首頁頂部行銷文案區塊與收合按鈕）正式完成，目前 `main`／`origin/main` 正式基線為 `92bb4f1`（[PR #275](https://github.com/hyc640110/family-universal-rebalance/pull/275) merge commit）**。使用者提供首頁截圖指出希望移除「收合」按鈕與其下方行銷文案區塊（App 副標、說明文字、Build time），開發前唯讀盤點確認 `CollapseEyeIcon` 為全站共用元件（不觸碰其他呼叫點）、`APP_SUBTITLE` 僅此處讀取、版本號與 Build time 在側欄及設定頁「版本與除錯」區塊另有獨立顯示、不受影響。範圍限於移除 `App.tsx` 該一處呼叫點與對應的死 CSS，「更新股價／下載／上傳」三顆按鈕不變。`npx tsc -b`、`test:ci`（824 項）、Production／Preview build 皆成功。使用者於 Preview 以真實裝置（桌機＋手機）驗收通過後直接指示 Merge；因 repo 僅一名協作者、branch protection 需要審核人數，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。`Deploy GitHub Pages` run `31194237652` success，headSha 與 merge commit 一致；Production `curl` 實測 `HTTP 200`，`deployment-environment` metadata 為 `production`。詳見 `008_TODO_BACKLOG.md` UR-TODO-052 條目。

**UR-TODO-030（首頁 30 秒決策中心精簡）正式完成，目前 `main`／`origin/main` 正式基線為 `cd89ad1`（[PR #268](https://github.com/hyc640110/family-universal-rebalance/pull/268) merge commit）**。首頁依三項使用者拍板保留內容重新設計：Hero 標頭收合（App 名稱／版號等品牌文字收合在「關於」按鈕後，更新股價／下載／上傳按鈕不受影響）；「今日投資狀態」精簡為狀態徽章＋摘要句＋今日建議結論，判斷流程步驟與機會清單移到既有投資行動中心；資產總覽精簡為總資產／淨資產／今日損益／今日損益率 4 格；投資健康度改為 1 行摘要＋風險中心連結；原「重要提醒」更名「狀態確認」並合併報價／同步／再平衡提醒與投資機會指標。詳細對照決策與搬移目的地見 `008_TODO_BACKLOG.md` UR-TODO-030 條目。**Preview 驗收過程中發現並排除兩個部署層問題**：`github-pages` Environment 的 Deployment branch policy 原僅允許 `main`／`gh-pages`，`workflow_dispatch` 部署 feature branch 連續被拒絕 3 次（`build` job 皆成功，僅 `deploy` job 被 Environment 分支政策擋下），使用者於網頁新增 `feat/*`／`fix/*`／`hotfix/*`／`docs/*`／`infra/*` 五條規則後恢復正常；另發現 `deploy.yml` 對 `push main` 事件也會重建 `/preview/`（Preview 內容固定來自「觸發這次 run 的 ref」），導致其他不相干 PR merge 到 main 會覆蓋尚未驗收完成的 Preview 分支內容，已新增 **UR-TODO-050** 追蹤（暫採方案 A：不修改 workflow，驗收時效性配合，之後找獨立 Sprint 評估是否改為方案 B／C）。因 repo 僅一名協作者、branch protection 需要審核人數，使用者於 Preview 驗收確認無問題後直接指示 Merge，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。詳見 `008_TODO_BACKLOG.md` UR-TODO-030、UR-TODO-050 條目。

**交易匯入中心「正式批次匯入已選列」二次確認機制正式完成，`main`／`origin/main` 前一正式基線為 `642c1a6`（[PR #270](https://github.com/hyc640110/family-universal-rebalance/pull/270) merge commit）**。唯讀盤點發現「正式批次匯入已選列」是交易匯入中心唯一沒有二次確認的批次寫入動作，且既有「撤銷」機制有真實限制——只要匯入後任一筆交易被編輯過，`rollbackImport` 會靜默擋下整批撤銷，沒有時效限制但可被單一筆編輯永久鎖死。`commit()`（`src/components/import/ImportCenter.tsx`）新增 `window.confirm()` 二次確認（文字明確帶出實際寫入筆數、目標帳戶、撤銷限制），取消時顯示「已取消匯入，尚未寫入任何交易。」，按鈕在可寫入筆數為 0 時直接 `disabled`；新增 5 個測試，`npx tsc -b`、`test:ci`、Production／Preview build 皆成功，隔離本機 dev server 桌機＋390px 實機驗證通過。**明確不包含**：「撤銷」按鈕本身撤銷失敗時靜默無回饋的既有缺口，維持獨立「待評估」狀態。**驗收過程中意外發現一個與本次變更完全無關的既有 Bug**（唯讀確認變更前就已存在）：以真實瀏覽器點擊取消勾選匯入預覽列會觸發 `TypeError: Cannot read properties of null (reading 'checked')`，被 `ErrorBoundary` 攔截，已新增 **UR-TODO-049** 記錄，本次未修復。因 repo 僅一名協作者、branch protection 需要審核人數，使用者於 Preview 驗收確認無問題後直接指示 Merge，Claude Code 執行 `gh pr merge --admin`（已於 Merge 當下明確告知使用者）。詳見 `008_TODO_BACKLOG.md` 對應段落與 UR-TODO-049 條目。

**「隱藏金額」功能回退＋備份／匯入回饋一致性連續修正（7 支 PR，2026-08-06）正式完成，先前 `main`／`origin/main` 正式基線為 `cbe176d`（PR #266 merge commit）**。本輪起於使用者確認不需要「螢幕分享時隱藏金額」功能（PR #257），要求完整回退，過程中連帶發現並修正一系列真實回饋／版面一致性缺陷，全數皆由使用者於 Preview／Production 實機驗收後指示或授權 Merge（`gh pr merge --admin`，本 repo 單人協作、branch protection 無第二審核者，依 `007_GIT_WORKFLOW.md` §8.2 純小型 UI 修正／基礎設施修正政策執行，已於每次使用時明確揭露）：

- **PR #260**（`revert/ur-todo-hide-amounts-removal`）：完整移除 `AmountVisibilityContext`、浮動眼睛按鈕、`maskEmbeddedAmountsText()` 遮蔽邏輯，恢復 PR #257 合併前的金額顯示方式；PR #258（TargetValuePair）與 PR #259（CollapseEyeIcon）確認零程式碼耦合、完全不受影響。
- **PR #261**：修正唯讀盤點發現的真實 Bug——`exportBackup`／`importBackup`／`resetState` 的成功/失敗訊息原本寫入 `syncMeta.status`，被 `syncStatusText` 的 baseline/dirty 優先權邏輯在常見情境（本機有未同步異動、或尚未建立同步基準）下靜默覆蓋，使用者幾乎看不到任何回饋。改為獨立的 `backupFeedback` state，緊鄰按鈕顯示，`role="status"`／`role="alert"` 語意化；`exportBackup` 補上先前完全沒有的 try/catch。
- **PR #262**：統一 `匯出/匯入/重設` 按鈕視覺；比照 JSON 備份模式為 ImportCenter（交易匯入中心）新增全部 6 個動作點的成功/失敗/取消三態回饋；交易列操作按鈕改為 flex + `margin-left:auto` 靠右對齊，不受前方狀態文字長度影響。
- **PR #263**：修正真機（Mobile Safari／Chrome Android）特有的 `text-size-adjust` 自動文字縮放，`<html>` 加上 `text-size-adjust:100%` 標準重置。
- **PR #264**（基礎設施）：**GitHub Pages 的 legacy 分支建置系統於本輪連續故障**（建置連續兩次秒級失敗「Page build failed」、手動重觸發後又卡在 building 狀態逾 6 分鐘無進度，透過 `gh api repos/.../pages/builds` 確認 `gh-pages` 分支內容本身完全正確，問題出在 Pages 建置管線本身），已改用 GitHub 官方現行建議的 **Actions-based 部署**（`actions/upload-pages-artifact` + `actions/deploy-pages`），並透過 API 將 repo Pages Source 設定切換為 `build_type: workflow`。新 workflow 每次同時建置 Production（固定從 `main`）與 Preview（觸發此次 run 的實際 ref），合併成單一 artifact 部署，維持「`workflow_dispatch` 對未合併分支觸發部署絕不影響 Production」的既有安全性質。**此為未來所有部署的正式機制，若未來又出現 Production／Preview 長時間未更新的情況，應優先以 `gh api repos/.../pages` 確認 `build_type` 是否仍為 `workflow`、以及最近一次 workflow run 是否成功，而非假設是舊的 legacy 建置故障。**
- **PR #265／#266**：按鈕高度不一致問題經過三輪排查才找到真正根因——**每一輪自動化／桌機檢查都顯示三顆按鈕 `getComputedStyle()` 完全一致，但真機測試持續不一致，且「哪一顆矮」在前兩輪之間變動過（使用者事後更正：實際上從頭到尾都是「匯入 JSON 備份」，非真的輪替）**。PR #265 先排除 `height:calc(1.3em+20px)` 仍是 em 相對計算的可能性，改為固定像素值；PR #266 找到**真正根因**：「匯入 JSON 備份」原本是 `<label className="file">` 包住隱藏 `<input type="file">`，跟另外兩顆 `<button>` 元素種類本身不同（結構性差異，非 CSS 屬性可完全壓制），已改為真正的 `<button type="button">` 透過 `ref` 觸發隱藏 input，三者現在是完全相同的元素種類。**教訓記錄供未來參考**：跨元素種類（`<button>` vs `<label>`／`<input>`／其他表單控制項）視覺對齊問題，若 CSS 屬性層面反覆調整仍無法在真機收斂，應優先檢查底層 HTML 元素種類是否本身不同，而非持續在 CSS 數值上打轉——多輪自動化測試「一致」但真機「不一致」本身就是強烈訊號。
- **CI／部署過程中另發現一次性 GitHub Actions 平台容量問題**（PR #266 的 CI 連續 3 次「job was not acquired by Runner」失敗，與 Pages 建置故障為不同層面的暫時性平台問題，非本 repo 設定造成），已於使用者授權後以 `--admin` 繞過（本機已確認 `test:ci` 全數通過），後續 retry 已恢復正常。

以上全部變更皆為純呈現層／CI 基礎設施修正，**未觸碰任何資料模型、計算邏輯或持久化格式**。`npx tsc -b`、`npm run test:ci`、Production／Preview build 於每一輪皆確認通過；Production／Preview `curl` 最終確認皆 HTTP 200 且服務最新版本（CSS 資產 hash `index-CXUnBESy.css`）。

**使用者已於真機（Production）完成最終覆核並確認（2026-08-07）**：「匯入 JSON 備份」按鈕已與「匯出 JSON 備份」「重設」兩顆完全對齊，三者高度一致，PR #266 的結構性根因修正（改為真正 `<button>` 觸發隱藏 `<input>`）確認徹底解決此問題。**本輪工作（PR #260～#267）正式結案**，無殘留待辦。

**UR-TODO-046-C3C-C Financial Event Ledger 寫入／持久化（歸因確認）正式標記為已完成（2026-08-05）**：PR [#255](https://github.com/hyc640110/family-universal-rebalance/pull/255)（`feat/ur-todo-046-c3c-c-ledger-write`）已由使用者手動 Merge，merge commit **`b424eb42da80fb7d7d1e53a49eddb656cd8553aa`**（`mergedAt: 2026-08-05T13:26:13Z`），為目前 `main`／`origin/main` 正式基線。將 C3C-B 的 session-only「標示為合理」正式落地為 `FinancialEvent` 寫入路徑，與 C3C-B 既有 toggle 並存：`FinancialEventSource` 加法式擴充新增 `'attribution-confirmation'`，**刻意不 bump `FINANCIAL_EVENT_SCHEMA_VERSION`**——唯讀盤點確認若 bump，會讓所有既有使用者本機已帶 `financialEventSchemaVersion: 1` 的空 Ledger 被 `hasLocalFinancialEventLedger()` 誤判為版本不符，永久擋下 Firebase 下載；新增列舉值屬純加法式擴充、未改變物件形狀，依 `013_HOUSEHOLD_LIQUIDITY_SPEC.md` §29.2 判斷不需要版本 bump。新增 `createFinancialEventId()`（比照既有慣例）、`appendFinancialEvent()`（forward-only 寫入防呆，僅允許 append、相同 id 一律拒絕，本次不實作撤銷／void）、`src/lib/runtimeAttributionConfirmation.ts`（重用既有 `linkedTransactionReason()` taxonomy 驗證，確保轉換出的事件必能通過下一次讀取驗證，失敗會明確拒絕並附原因）。**開發中發現並修正一個必要的連帶缺口**（唯讀盤點階段未發現）：`src/lib/transactionReconciliation.ts` 的 `isEventForTransaction()` 原本寫死只認 `'linked-transaction'`，若不修正，新確認事件永遠不會被判定為 `matched`，會與同一筆交易的衍生證據雙重計算；已修正為同時接受兩種 source，範圍限定在此判斷式，未觸碰其餘 reconciliation 邏輯或核心 attribution 公式。UI 新增獨立於 C3C-B toggle 的「確認並正式記帳」按鈕（矩形、琥珀色實色，與既有藥丸形／深藍 toggle 視覺明顯區隔），沿用本專案既有 `window.confirm()` 不可逆動作確認慣例，對話框明確標示「不可逆」「不提供撤銷」；確認成功後該筆證據因重新計算自然從「衍生證據」清單移除，並新增獨立「本次已正式記帳」session-only 收據清單供畫面回饋。**按鈕與對話框文案為草案，PR 內已明確標註待審查，使用者於 Preview 驗收後直接指示 Merge**（視為已接受草案內容，本次未再另行調整文案）。新增 26 個測試（含核心連帶效果驗證：確認後交易變成 `matched`、`ledgerContribution` 與 `derivedContribution` 加總在確認前後相等），`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功；`Deploy GitHub Pages` run `31010188315` success，headSha 與 merge commit 一致；Production／Preview `curl` 皆 HTTP 200。**實機驗證**（隔離本機 dev server，虛構測試資料）：確認動作觸發 localStorage 正確寫入 `source: 'attribution-confirmation'` 事件；完整重新整理後 Ledger 貢獻持久化不變（與 C3C-B 的 session-only 行為形成對比）；確認前後四個歸因數字加總一致（實測 12,345 元由「衍生貢獻」轉為「Ledger 貢獻」，總額不變）；兩筆交易各自獨立確認、正負號正確；390px 無橫向溢出，兩顆按鈕皆 44px 觸控高度、顏色與外形明顯不同；console 全程無錯誤。**明確不包含**：撤銷／void、批次確認、Firebase Ledger sync（`financialEvents` 依 C1 既有決策仍不進 Firebase canonical payload，本次未變更此決策）、任何核心 attribution 公式變更；未影響 Household Liquidity、AI Decision、Rebalance、Dashboard（全庫搜尋確認三者皆不 import `financialEvents`）。**UR-TODO-046 整體仍未完成**：撤銷／void、Firebase Ledger sync、split allocation、investment buy／sell attribution、loan principal／interest attribution、FX attribution 仍待未來獨立排程與產品決策，皆屬重大事件，不得因本次完成而自行標記整體已完成。

**UR-TODO-001 Firebase Anonymous Authentication 正式標記為已完成（2026-08-05）**：PR [#252](https://github.com/hyc640110/family-universal-rebalance/pull/252)（`feat/ur-todo-001-firebase-anonymous-auth`）已由使用者手動 Merge，merge commit **`2a038802aac1a345f5be2a5100913142d42d23a4`**（`mergedAt: 2026-08-05T08:22:26Z`），為目前 `main`／`origin/main` 正式基線。**治理落差更正**：本文件與 `008_TODO_BACKLOG.md` 先前記錄的 Firebase 專案資訊「`my-00662`／`my-00662-default-rtdb`」為錯誤記載，正確專案為 **`l-pro-web-app`**，資料庫為 **`https://l-pro-web-app-default-rtdb.asia-southeast1.firebasedatabase.app`**；本次已一併更正下方第 10 節與 `008_TODO_BACKLOG.md` 對應內容，未變更任何實際 Firebase 設定本身（Console 端專案與資料庫本來就是 `l-pro-web-app`，僅治理文件記錄有誤）。新增純 REST（非 SDK）Firebase Anonymous Auth：App 啟動時背景自動建立或更新匿名 session（`src/lib/firebaseAnonymousAuth.ts`），所有雲端資料路徑改為以匿名登入 uid 為基礎（`{firebaseBasePath}/users/{uid}`，見 `src/lib/environmentBoundary.ts`），取代舊有以使用者手動輸入 `secretPath` 決定路徑的設計；Security Rules 已由使用者本人於 Console 套用新規則（`$envPath` 萬用字元只鎖 `auth.uid === $uid`，不區分環境字串，Preview／Production 隔離仍由既有 App 層 `firebaseBasePath` 前綴負責）。既有雲端舊資料（到期規則封鎖前的公開讀寫資料）依使用者拍板視為已遺失，不做遷移，使用者下次「上傳雲端」會直接寫入新的 uid 路徑。UI 層：「同步代號」欄位已從介面隱藏（底層 `state.firebase.secretPath` 型別與資料完全保留，未刪除、未 migration）；「上傳雲端」／「下載雲端」按鈕旁新增跨裝置同步暫停提示；新增「登入狀態」顯示列，失敗時清楚顯示錯誤訊息不靜默。**明確不包含**：Google 登入／OAuth 串接、`linkWithCredential()` 帳號升級 UI 或實際呼叫、帳號衝突合併邏輯、多裝置同時登入處理、任何 Household Liquidity 或其他核心財務公式變更。`npx tsc -b`、`npm run test:ci`（含新增 2 個測試檔、修改 3 個既有測試檔）、Production／Preview build 皆成功；`Deploy GitHub Pages` run `30988751844` success，headSha 與 merge commit 一致；Production／Preview `curl` 皆 HTTP 200。**實機以真實 Firebase 後端驗證**（使用者完成 Console 兩項設定〔啟用匿名登入、套用新 Rules〕後複驗，測試資料驗證後已清除）：全新使用者背景自動登入成功，取得真實且互異的 uid（Preview／Production 各自獨立）；以 App 實際簽發的 uid／idToken 重放與程式碼相同的 RTDB REST 呼叫，上傳／下載成功且資料一致；跨 uid 存取測試回傳 HTTP 401 Permission denied，證實 Rules 的 `auth.uid === $uid` 正確生效。**UR-TODO-001 正式結案**；下一潛在候選為 Google 登入／帳號升級（`linkWithCredential()`），屬重大產品語意事件，須另行拍板，本次未自動開始。

**UR-TODO-046-C3C-A／C3C-B 已完成（2026-08-05）**：PR [#248](https://github.com/hyc640110/family-universal-rebalance/pull/248)（`feat/ur-todo-046-c3c-a-presentation`，merge commit `28c832b1020b8bd38845776d8177fa7f2e4c7994`）與 PR [#250](https://github.com/hyc640110/family-universal-rebalance/pull/250)（`feat/ur-todo-046-c3c-b-session-confirm`，merge commit **`d7fb5b44d4641c492c8b11b7871bf2f31891431f`**，`mergedAt: 2026-08-05T02:54:55Z`）皆已由使用者手動 Merge，`d7fb5b4` 為目前 `main`／`origin/main` 正式基線。**C3C-A** 新增唯讀 `RuntimeAttributionProvenanceCard`（分析頁「風險」視角，緊接「防守配置狀態」卡片之後），純顯示層消費既有 `composeRuntimeNetWorthAttribution()` 輸出，拆解 Ledger 已確認證據／衍生證據／未解釋殘差三層 provenance；比較期間固定為「最新兩筆淨資產快照」（與 `deriveHistoryStats()` 的 `todayChange` 同一慣例）；zero-length period、adjustment／internal-transfer 0 貢獻、FX fail-safe 排除文案皆由呼叫端／presentation 層以人類可讀文字呈現，不暴露原始 diagnostics 代碼。**C3C-B** 在每筆「衍生證據」旁新增可重複切換的「標示為合理」toggle：純 component-local React state（比照 UR-TODO-045 `showAllHistoryGrid` 先例），不寫入 Ledger、schema、persistence、localStorage、Firebase、JSON Backup；toggle 互動不觸發任何重新計算；完整重新整理後所有標示清空、無「資料遺失」警告；文案避免「儲存」「送出」等持久化聯想字樣，已用測試斷言「已正式記帳」「已寫入 Ledger」等禁用語意不出現。兩者皆未觸碰 `runtimeAttributionComposition.ts`／`netWorthAttribution.ts` 核心邏輯，`npx tsc -b`、`npm run test:ci`、Production／Preview build 皆成功；`Deploy GitHub Pages` run `30970718416` success，headSha 與合併後 `main` 一致；Production／Preview `curl` 皆 HTTP 200。**UR-TODO-046 整體仍未完成**：下一潛在候選為 **046-C3C-C（Ledger 寫入／持久化）**，屬重大產品／核心財務語意事件，須另行拍板，本次未自動開始。

**UR-TODO-046 C3B Runtime Attribution Composition 已完成（2026-08-05）**：PR [#246](https://github.com/hyc640110/family-universal-rebalance/pull/246) 已由使用者最終授權 Merge（ChatGPT 完成架構審查與人工財務案例驗收後正式核准），merge commit **`c30db10b69f7f1b3a8c88390028f4abac46246a4`**（`mergedAt: 2026-08-04T16:49:54Z`），為目前 `main`／`origin/main` 正式基線。新增 `runtimeAttributionComposition.ts`：`netWorthChange = ledgerContribution + derivedContribution + unexplainedResidual`；Ledger evidence 優先於 derived evidence；只有 reconciliation candidate 能產生 derived contribution，matched／duplicate／ambiguous／unsupported／invalid 一律排除；同一 transactionId 最多計算一次 derived contribution；`Asia/Taipei` calendar-day 日期契約（`opening < effectiveDate <= closing`，同日快照為合法 zero-length period）；adjustment／internal-transfer 皆為零效果且不降低 residual；非 TWD 無正式 FX conversion 時 fail-safe 排除；`reconciled` 只代表 residual 落在 tolerance 內，不代表完整歸因；derived evidence 為 runtime-only，不偽裝成 persisted event。**未新增 schema、persistence、Firebase Ledger sync、migration、Ledger write-back、UI 或 AI Decision／Rebalance／Household Liquidity wiring**，changed files 僅 4 個（`package.json`、`netWorthAttribution.ts`、`runtimeAttributionComposition.ts`、對應測試檔）。Merge 後 Git 基線三方一致驗證（`main`／`origin/main`／`HEAD` 皆為 `c30db10`）；`Deploy GitHub Pages` run `30931019567` success；Production／Preview `curl` 皆 HTTP 200，assets 路徑各自獨立。**UR-TODO-046 整體仍未完成**；下一候選（C3C 呈現／使用者確認、Firebase Ledger sync、split allocation、投資買賣／借款本息／FX 歸因等）皆屬重大產品／核心財務語意事件，須另行拍板，本次未自動開始。

**UR-TODO-046 C3A Pure Runtime Derived-Evidence Adapter 已完成（2026-08-02）**：PR [#244](https://github.com/hyc640110/family-universal-rebalance/pull/244) 已 Merge，merge commit **`0fd1955bfe6267e55072bf2278114f70aa11f98e`**（`mergedAt: 2026-08-02T13:15:09Z`），為目前 `main`／`origin/main` 正式基線。新增純 `deriveRuntimeDerivedAttributionEvidence()`：只消費 C1／C2 的 `candidate` reconciliation result，使用 `Asia/Taipei` canonical calendar-day 契約 `openingSnapshot.date < effectiveDate <= closingSnapshot.date`，產出不持久化的 `derived-transaction` runtime evidence（transactionId、effectiveDate、category、amount、signed contribution、reconciliation basis）。可安全涵蓋 external income、external expense、dividend、internal transfer（零效果）與 adjustment（零效果）；matched／duplicate／ambiguous／unsupported／invalid 均不產生 evidence。**不呼叫或改變 046-B calculator／quality；沒有 Ledger 寫入、AppState、localStorage、Firebase、JSON Backup、schema、migration、legacy rewrite、UI 或核心 consumer wiring。**UR-TODO-046 整體仍未完成；下一候選為 **046-C3B**（正式將 Ledger 與 derived evidence 送入 calculator），屬重大產品／核心財務語意階段，必須重新審查與使用者確認。

**UR-TODO-046 C1／C2 Pure Transaction Reconciliation 已完成（2026-08-02）**：PR [#242](https://github.com/hyc640110/family-universal-rebalance/pull/242) 已 Merge，merge commit **`b8b9a4d212917444e313ef22649461a843273bdb`**（`mergedAt: 2026-08-02T12:12:48Z`），為目前 `main`／`origin/main` 正式基線。新增純、deterministic、唯讀的 transaction reconciliation：每筆既有交易只會回傳 `matched`／`candidate`／`unsupported`／`ambiguous`／`duplicate`／`invalid` 其中之一；僅把現有 taxonomy 能證明的非股息收入、股息、非投資支出、同幣別帳戶轉帳與 adjustment 作為候選／證據。C2 僅診斷既有 C1 Ledger 的 linked match、duplicate 與相似 manual ambiguity；不會寫入 Ledger、不會接入 attribution calculator 或提升 quality。pending linked event 可保留為 C1 evidence，但不是 completed-period evidence；void linked event 不消費 transaction。**UR-TODO-046 整體仍未完成**：下一候選為待盤點且須另行授權的 046-C3 reconciliation 結果消費／產品契約，未自動開始。

**UR-TODO-046 B Pure Attribution Calculator／Quality Model 已完成（2026-08-02）**：PR [#240](https://github.com/hyc640110/family-universal-rebalance/pull/240) 已 Merge，merge commit **`d61e0aa270bf006acb7000e2c1b3be0fc0f68264`**（`mergedAt: 2026-08-02T10:11:19Z`）；此為目前功能正式基線。新增純 `deriveNetWorthAttribution()` 計算器與測試，品質狀態僅為 `unavailable`／`snapshot-only`／`partial`／`reconciled`；輸出明確的 classified contribution 與 unexplained residual，**不得把 unexplained residual 宣稱為 market effect**。本階段無 schema、persistence、Firebase、migration、UI、AI Decision／Rebalance／Household Liquidity consumer wiring。**UR-TODO-046 整體尚未完成**；下一正式候選為 046-C existing transaction reconciliation，屬重大事件候選，須先完成獨立架構／產品審查。

**UR-TODO-046 C1 Financial Event Ledger contract／persistence foundation 已完成（2026-08-02）**：使用者最終授權後，PR [#238](https://github.com/hyc640110/family-universal-rebalance/pull/238) 已 Merge，merge commit **`ef42c2408c989bc56c4ee1d31986161c7628ed2f`**（`mergedAt: 2026-08-02T09:51:20Z`）。C1 為 forward-only foundation：Ledger 僅進入 AppState、localStorage 與 JSON Backup／Full Restore；**不包含 Firebase Ledger sync**（現有 root PUT 不具 mixed-version Ledger 安全性，需另立重大階段）。future schema 採 opaque fail-safe；可由既有 taxonomy 證明的 linked transaction 才可連結，同一 transactionId 不得被多個有效 linked events 重複消費；未實作 split allocation。

**UR-TODO-043 正式完成候選盤點結論（2026-08-02）**：唯讀核對確認 043-A、C1、C2、C3-A、C3-B、B1、B2、B3 均已完成，且未發現 043 範圍內殘留程式 Bug 或需要最小功能修正的 Analytics 語意缺口。現行 Analytics 對淨資產／投資資產只呈現快照值與兩期差額，已明確說明不等同純投資報酬；快照模型無法證明市場漲跌、投入、提領、股息、現金或負債對差額的來源貢獻。該來源歸因與現金流／淨值落差核對已正式歸入 UR-TODO-046，043 不重做。**UR-TODO-043 正式標記為已完成；B4 不需要、C4 未觸發。**

**UR-TODO-043 完整契約驗證摘要**：`Asia/Taipei` canonical calendar-day、deterministic same-day last-occurrence、snapshot `valid`／`missing`／`invalid`／`non-finite` read-time classification、History／Analytics／Calendar consumer wiring 均已落地；未新增 timestamp、schema、migration、legacy date rewrite 或 persistence 格式變更。UR-TODO-046 維持「待評估」，其對 043-B 的前置依賴已解除，但本次不開始 046。既存 390px 部分長文裁切仍為獨立待盤點問題，不納入 043。

Dashboard 與 `aiDecision.ts` 未直接修改，因既有 App 已將 producer 產生並經 read-time boundary 整理的 history 傳入既有統計／AI／Risk 輸入邊界；本次僅修正直接決定 snapshot date identity 的 range／calendar wiring。既存 390px 部分長文裁切問題非本次變更造成，僅記錄為待盤點，不在本次修正。B4 不需要啟動；不得混入 C4、UR-TODO-030 或其他 Todo。

**UR-TODO-043-C3-A Read-time Snapshot Boundary 正式完成（2026-08-02）**：PR #229 已 Merge，merge commit `e663e5d0dcda6117e75dcd972fcef6c336e2cf97`，正式基線推進至此 SHA。C3-A 建立平行 raw／classified read-time view，保留 `valid`／`missing`／`invalid`／`non-finite` 四分類，並維持 valid `0` 與 missing 可區分；localStorage、Firebase download、Backup import 均在 legacy normalization 前建立 read-time view。未修改 AppState／persistence schema、不做 migration、不改寫既有 snapshot。PR #229 的 `verify` CI run `30735211163`、Merge 後 `Deploy GitHub Pages` run `30735283065` 均成功；`test:ci` 655 項、TypeScript、Production／Preview build 均通過。C4 未觸發，043-B、043-C4、UR-TODO-030 均未納入；後續 C3-B 已由 PR #231 完成。

**UR-TODO-035 市場頁「重新取得」按鈕回歸確認正式結案（2026-08-02）**：以最新正式基線 `2bc1b1716c176b07bab4e11cbdc96c48ad1d52a2`（PR #227 merge commit）完成唯讀與隔離實機回歸。確認 click handler 實際觸發 `refreshMarketData(true)`，手動 request builder 發出 `/market-summary?refresh=1&request=<nonce>`，使用 `cache: no-store` 與 `Accept: application/json`；Loading、Success、Partial failure、Full failure 與再次重試均可見，Preview／Production 均可更新實際資料。Production／Preview Market Worker URL 與 live bundle environment boundary 正確，未混用；Console 無產品 error／warn。Treasury 上游格式不完整屬外部資料來源問題，不阻擋本 Todo 結案、不建立 Hotfix；若未來處理，應另立獨立 Todo。此次僅同步治理文件與重新產生 Bundle，未修改 `src/`、`tests/`、package、`.github/`、Worker 或 Production。

**UR-TODO-027 正式全數結案（2026-08-01）**：Claude Code 唯讀盤點確認最後一項「07／15 附近中間空白」為 `TrendChart.tsx` X 軸座標索引式定位的設計行為（非日曆天數換算），以 seed 跳日測試資料實機渲染驗證相鄰資料點間距在跨多天缺口與跨單日皆相同、填色區塊無跳過，證實圖表對日期缺漏無感、不會產生視覺斷裂；上游 `netWorthHistory.ts` 資料源本身為稀疏陣列，符合既有「不補日期、不插值」原則。使用者確認為設計行為、不需修正，直接結案。**UR-TODO-027 走勢方向漸層填色、Y 軸整數刻度、手機文字裁切、Y 軸位置、07／15 日期斷裂五項全數完畢，狀態由「部分完成」更新為「已完成」。** 純唯讀盤點，未修改任何程式碼。詳見 `008_TODO_BACKLOG.md` UR-TODO-027 條目。

**PR #225 Production 唯讀驗證＋UR-TODO-003／UR-TODO-048 步驟一正式結案（2026-08-01）**：使用者手動 Merge [PR #225](https://github.com/hyc640110/family-universal-rebalance/pull/225)（`fix/ur-todo-003-048-clec-role-semantic-label`），merge commit `cbe5e0537d7257e94937a766fe110a2e0fcd002f`，`mergedAt: 2026-08-01T16:53:39Z`。以 `git fetch`／`gh run list` 確認 `origin/main` 推進、`Deploy GitHub Pages` run `30709137755` success，headSha 與 merge commit 一致；`curl` 實測 Production／Preview 皆 HTTP 200，並直接比對已部署 JS bundle 內容確認含新文案 `clec-role-scope-note`，`deployment-environment` metadata 正確、資源路徑未混用。**UR-TODO-003 正式標記為已完成**：唯一剩餘技術缺口（`AssetClass` 與 CLEC `AllocationRole` 語意分歧）經使用者決定以「明確標示」而非「資料統一」解決，`ClecStrategyCenterPage.tsx`「目前配置來源」卡片新增文案標示角色分類為 CLEC 模擬專用、與資產頁正式分類無關，純文案調整，未觸碰任何分類型別或資料值。**UR-TODO-048 步驟一（明確標示）正式標記為已完成**；步驟二（`allocationRoleBySymbol` 資料層清理）仍維持「待評估」。詳見 `008_TODO_BACKLOG.md` UR-TODO-003、UR-TODO-048 條目。

**UR-TODO-027 剩餘四項中三項唯讀確認完成（2026-08-01）**：Claude Code 以隔離本機 dev server（高數值＋日期跳躍測試資料，390px）實機驗證 Y 軸整數刻度、手機文字裁切、Y 軸位置三項，皆確認符合／不需調整，正式標記為已完成；純唯讀驗證，未修改任何程式碼。**僅剩「07／15 附近中間空白」一項，待使用者以自己真實 Production 資料查看後另行處理**——測試資料驗證折線在日期跳躍時的行為符合既有「不補日期、不插值」設計，但無法代表使用者真實情境。UR-TODO-027 整體狀態維持「部分完成」。詳見 `008_TODO_BACKLOG.md` UR-TODO-027 條目。

**PR #221／#222 Production 唯讀驗證＋UR-TODO-002 正式結案（2026-08-01）**：使用者指示 Merge，Claude Code 依 `007_GIT_WORKFLOW.md` §8.1 既有政策使用 `gh pr merge --admin` 完成兩支 PR Merge（branch protection 需要審核人數，本 repo 僅一名協作者；PR #221 為純治理文件同步，PR #222 為使用者已親自到 Preview 驗收確認後直接指示 Merge，兩次使用皆已於 Merge 當下明確告知使用者）：**PR #221**（merge commit `cbd68d6c58f24f81c5cc5f6efa06a6c1b4c93a4b`，`mergedAt: 2026-08-01T16:06:16Z`）記錄 PR #220 的完成狀態；**PR #222**（merge commit `cd430dcafd3aedbb4b0c6bcdadf2b0b161239925`，`mergedAt: 2026-08-01T16:09:00Z`）為 **UR-TODO-002 正式結案**：五項原始版面差異中前四項已由 UR-TODO-033（PR #214）達成、本次未重做，僅新增第五項「未實現損益」與「今日漲跌」的視覺區隔（使用者選定方案 C，容器背景色＋左側色條強調，沿用既有紅漲綠跌色碼）。以 `git fetch`／`gh run list` 確認 `origin/main` 推進至 `cd430dc`、`Deploy GitHub Pages` run success，headSha 與 merge commit 一致；`curl` 實測 Production／Preview 皆 HTTP 200，並直接比對 gh-pages 分支實際部署的 JS bundle 內容確認同時包含 PR #220（「每月收入（元）」）與 PR #222（`holding-card-unrealized-pnl-`）的變更，`deployment-environment` metadata 正確、資源路徑未混用。詳見 `008_TODO_BACKLOG.md` UR-TODO-002 條目。

**PR #220 Production 唯讀驗證＋收支與現金流中心元單位輸入結案（2026-08-01）**：使用者手動 Merge [PR #220](https://github.com/hyc640110/family-universal-rebalance/pull/220)（`feat/cash-flow-yuan-unit-input`），merge commit `421f0566077dfbc482c9b5767802e12ae7364c91`，`mergedAt: 2026-08-01T15:30:19Z`。以 `git fetch`／`gh run list` 確認 `origin/main` 推進、`Deploy GitHub Pages` workflow run `30706058168` success，headSha 與 merge commit 一致；`curl` 實測 Production／Preview 皆 HTTP 200，並直接比對已部署 JS bundle 內容確認含「每月收入（元）」不含「每月收入（萬元）」，`deployment-environment` metadata 正確、資源路徑未混用。**收支與現金流中心「每月設定」（每月收入、每月預定投資金額、固定支出清單各項金額）金額輸入改為元單位正式標記為已完成**：新增獨立的 `parseYuanInput`／`formatYuanInput`，`wanToYuan`／`yuanToWan`（供「家庭流動資金計畫」額外投入資金／預計提領資金專用）完全未修改；底層儲存格式未變動，純顯示／輸入層調整。此為使用者於 Claude Home 唯讀盤點後直接下達的開發指令，非既有 UR-TODO 編號。詳見 `008_TODO_BACKLOG.md` 對應段落。

**PR #218 Production 唯讀驗證＋UR-TODO-027 漸層填色子需求結案（2026-08-01）**：使用者手動 Merge [PR #218](https://github.com/hyc640110/family-universal-rebalance/pull/218)（`feat/ur-todo-027-trend-chart-gradient`），merge commit `b85521aa959377089e2e8d67b3fbd01292c9bfb2`，`mergedAt: 2026-08-01T11:34:18Z`。以 `git fetch`／`gh run list` 確認 `origin/main` 推進、`Deploy GitHub Pages` workflow run `30697948596` success，headSha 與 merge commit 一致；`curl` 實測 Production／Preview 皆 HTTP 200，`deployment-environment` metadata 分別為 `production`／`preview`，資源路徑未混用。**UR-TODO-027 的「走勢方向漸層填色」子需求正式標記為已完成**：`TrendChart.tsx` 新增逐段紅漲綠跌漸層填色，每個線段依自己的終點 vs 起點各自判斷方向（驗收回饋後由「整段頭尾單一顏色」調整為逐段變色），持平不填色，僅 2 個共用 `<linearGradient>`，折線與資料點互動未變動。**UR-TODO-027 整體狀態維持「部分完成」**——07／15 日期斷裂、Y 軸整數刻度、手機文字裁切、Y 軸位置四項 2026-07-19 提出的待確認項目本次未處理。詳見 `008_TODO_BACKLOG.md` UR-TODO-027 條目。

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

**治理落差已同步修正（2026-08-02）**：本次最終盤點確認 PR #235 與 PR #236 後，UR-TODO-043 全部 A／B／C 子階段均完成，來源歸因缺口屬 UR-TODO-046，不是 043 的殘留程式缺口；043 正式結案，C4／B4 均未觸發。UR-TODO-046 維持待評估且依賴已解除；390px 裁切維持獨立待盤點。

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
- 名稱：Cross-Module Presentation Consistency — UR-TODO-011 Sprint 6；UR-TODO-043 目前已完成 C3 階段與 043-B1/B2/B3（043-A、043-C1、043-C2、C3-A、C3-B、B1、B2、B3），C4／B4 未觸發，043-B 整體完成；原始 Analytics 語意與來源貢獻事項由 046 承接；**UR-TODO-030 仍為待盤點且本次完全不處理**；**UR-TODO-045 已完成**；**UR-TODO-044 已完成**（Phase 1／2a／2b 全數達成，不存在獨立殘留的 Phase 2c 範圍）；**UR-TODO-037 已完成**（預設分支修正、Branch Protection 選項 2 皆已落地；GitHub Environments 人工核准維持原狀，非本次驗收範圍）；**UR-TODO-004 已完成**；**UR-TODO-005 已完成**；**UR-TODO-046**（淨值成長來源歸因）Phase 1、C1、046-B、046-C1／C2、046-C3A 與 046-C3B 已完成，整體狀態仍為「部分完成／後續待評估」（此行為歷史摘要，可能滯後於文件頂部逐條記錄，實際最新狀態以頂部與 `008_TODO_BACKLOG.md` 為準）；下一候選為 C3C 呈現／使用者確認或 Firebase Ledger sync 等，屬重大事件候選；**UR-TODO-047 已完成**（負債模組與現金流固定支出清單重複計算風險盤點，無實際重複計算）；**UR-TODO-048**（CLEC 433／442 移轉為 CLEC 策略中心純模擬模板）**子階段 A～E 已完成**（狀態層固定回傳 `custom`＋UI 層移除 `AllocationPresetPanel`／子階段 B PR #198；模擬頁套用 442/433 樣板／子階段 C PR #200；新增 703/5050 模擬限定樣板／子階段 D PR #202；樣板改名＋模擬現金項目／子階段 E PR #203），`allocationRoleBySymbol` 欄位清理維持「待評估」；**UR-TODO-048-D 提案已完成**（即上述子階段 D／E，狀態由「待盤點」更新為「已完成」）；**UR-TODO-028 已完成**（股息中心未指定資產紀錄可安全編輯，2026-08-01 唯讀盤點＋隔離 dev server 實機驗收確認，既有功能已滿足，未新增程式碼）；**UR-TODO-032 已完成**（更新股價入口與跨頁一致性，2026-08-01 唯讀盤點＋隔離 dev server 實機驗收確認，桌機／手機共用單一刷新契約、首頁／資產頁／分析頁報價與時間戳記完全一致，既有基礎設施已滿足，未新增程式碼；手機觸控下拉手勢與錯誤狀態本次未實機重現，僅程式碼路徑確認）；**UR-TODO-033 已完成**（持股卡片現價與今日漲跌版面差異，2026-08-01 PR #214 Merge，新增 `formatCompactQuoteHeadline()`，現價同列顯示價格＋▲/▼＋漲跌幅、今日漲跌次列顯示金額，四者一致著色）；**UR-TODO-034 已完成**（2026-08-01 唯讀實機驗證，以 00631L、00865B 兩檔測試 Worker／state／localStorage／各頁 selector 跨頁一致性，未發現殘留舊報價，純唯讀驗證未修改任何程式碼）；**UR-TODO-026 已由使用者手動 Merge PR #216**（`fix/ur-todo-026-remove-holding-ratio-label`，merge commit `63feac1f0012546fadc1e341c55c047c967ada65`，只移除「持有比例」文字標籤、保留百分比數字，未新增任何圖形／圓圈視覺；本文件先前僅記錄「排入開發中」尚未同步 Merge 結果，本次一併補齊，**正式標記為已完成**）；**UR-TODO-027 部分完成**（走勢方向漸層填色子需求已於 PR #218 完成並改為逐段變色，07／15 日期斷裂／Y 軸整數刻度／手機文字裁切／Y 軸位置四項待確認仍未處理）。
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

## 10. 緊急外部風險（已解除，僅保留歷史記錄）

**本節記錄的風險已於 2026-08-05 由 UR-TODO-001 正式解決，詳見本文件最上方 2026-08-05 記錄；以下內容保留為歷史脈絡，不代表現況。**

Firebase Realtime Database `l-pro-web-app-default-rtdb`（本節原記載專案名稱「`my-00662-default-rtdb`」為治理文件誤植，已於 2026-08-05 更正；Console 端專案本來就是 `l-pro-web-app`，從未實際使用過 `my-00662`）測試模式用戶端存取權限已於 **2026-07-28** 到期（UR-TODO-001，P0，正式解法已完成，見上方最新記錄）。

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

- 專案：`l-pro-web-app`（原記載「`my-00662`」為治理文件誤植，已於 2026-08-05 更正），資料庫：`l-pro-web-app-default-rtdb`
- 現行規則（查證當時）：`".read": "now < 1785168000000"`／`".write": "now < 1785168000000"` → **到期日 2026-07-28**（查證日 2026-07-25，距今僅 3 天）
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

<!-- END FILE: 003_CURRENT_STATUS.md -->

---

<!-- BEGIN FILE: 008_TODO_BACKLOG.md -->

# Universal Rebalance Todo Backlog v1.86

最後更新：2026-08-15

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
- 狀態：**開發中**（自 UR-TODO-046 Final Audit／Closeout，2026-08-14 拆出；2026-08-14 正式拆分為 054-A／054-B／054-C 三個子項，各自獨立唯讀盤點、產品決策與明確授權後才開始開發；**054-A、054-B 已於 2026-08-14／2026-08-15 分別正式 CLOSED；054-C（Generic Split）已於 2026-08-15 完成 Contract Audit，判定「沒有可消費的真實 candidate／producer」，維持待規劃、不建議現在開發**）
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
- 明確不包含：FX（見 054-B）、Generic Split（見 054-C）、Investment（不需要——已用 runtime 證據確認 Investment 買賣本就走既有通用 `safe-taxonomy-candidate`／`RuntimeAttributionProvenanceCard` 路徑，非本次遺漏的缺口）、CSV／Import Center（見 UR-TODO-055）、schema／persistence／attribution calculator／reconciliation 核心修改。

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
- 明確不包含：在沒有具體業務需求與對應 Producer 設計前開始開發；修改既有 attribution 核心 contract；修改 `genericSplitAllocation.ts`／`appendGenericSplitAllocationGroup()`／`resolveActiveGenericSplitAllocationGroups()` 本身。
- 依賴：UR-TODO-046（已 CLOSED，contract 基礎已具備）；054-A（已 CLOSED，group-level 卡片架構可供未來參考，但不可直接套用，因為 054-C 缺少 054-A 開發前就已具備的 Producer／candidate 前提）。
- 驗收條件（待正式排入時另訂）

### UR-TODO-055 Loan／Investment Delivery Mapping（UI／CSV／Import Center）

- 優先級：待評估
- 狀態：**待規劃**（自 UR-TODO-046 Final Audit／Closeout，2026-08-14 拆出）
- 提出日期：2026-08-14
- 背景：UR-TODO-046 歷次治理紀錄（046-I1／046-L1 完成條目、FX-A3 條目）持續將「Loan UI／CSV／Import Center producer mapping」列為 Remaining Boundary，但從未列為 046 本身的驗收條件——即 Loan／Investment 的正式 attribution contract（identity、component group、fail-safe）已完成，缺口在於「如何讓使用者透過既有 Import Center 或專屬 UI，把外部資料（銀行對帳單、券商交易紀錄等）安全映射成符合正式 contract 的 `loanAttribution`／`investmentAttribution`」，這是交付／匯入層的工作，不是 attribution 核心邏輯缺口。
- 範圍（草案，待正式盤點與拍板）：
  - Loan repayment／disbursement 的手動輸入 UI（目前僅能透過既有通用交易表單間接建立，缺乏 Loan 專屬引導）
  - CSV／Import Center 是否／如何新增 Loan／Investment 專屬欄位映射
  - 與既有 `ImportCenter.tsx`、`importCenter.ts` 既有 mapping 機制的整合方式
- 明確不包含：修改既有 attribution 核心 contract；FX（見 UR-TODO-056）
- 依賴：UR-TODO-046（已 CLOSED，Loan／Investment contract 基礎已具備）
- 驗收條件（待正式排入時另訂）

### UR-TODO-056 FX Enhancement Bundle（Valuation Attribution／其他貨幣對／自動配對／進階 Fee）

- 優先級：待評估
- 狀態：**待規劃**（自 UR-TODO-046 Final Audit／Closeout，2026-08-14 拆出；**實作時仍須拆成獨立子 Sprint，不得合併成單一大 PR**）
- 提出日期：2026-08-14
- 背景：UR-TODO-046 FX 序列（F2D）已完成 conversion principal 的 attribution foundation，並已用測試明確證明 principal contribution 與 FX 匯率波動對既有部位的估值效果（FX-A3 valuation）完全分離。以下項目從未被列為 046 的驗收條件，歷次治理紀錄一貫將其記錄為獨立、未來階段：
  1. **FX valuation attribution**：USD 部位因匯率波動產生的 realized／unrealized gain/loss，目前仍留在 `unexplainedResidual`，未有正式 attribution contract
  2. **JPY/EUR 等其他貨幣對**：F2B／F2D 皆嚴格限定 TWD↔USD
  3. **Automated FX pairing／CSV 自動配對**：目前 Manual FX Producer 為使用者手動指定兩腿，未有自動偵測配對機制
  4. **進階 fee attribution**：F2D 明確排除 rate spread 推算 fee、explicit fee 表單內建立新交易等
- 明確不包含：修改既有 conversion principal attribution（已完成，不得重新開放）；Production Producer enable（獨立 rollout 決策，見下方）
- 依賴：UR-TODO-046（已 CLOSED，F2D principal/valuation 分離基礎已具備）
- 驗收條件（待正式排入時另訂）

**附註（非新 Todo）：FX Production Producer Enable** 維持既有 ADR-010／ADR-013 Controlled Rollout Policy 框架——翻轉 `FX_OPAQUE_PRODUCER_SOURCE_GATE` 對 Production 生效前提（目前 environment guard 使其恆為 OFF）屬獨立、明確授權的 product deployment decision，非新 Todo 編號、不因 UR-TODO-046 CLOSED 或上述任一 follow-up Todo 完成而自動觸發。

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

<!-- END FILE: 008_TODO_BACKLOG.md -->

---

<!-- BEGIN FILE: 012_AI_HANDOVER.md -->

# Universal Rebalance AI Handover

> 文件定位：本文件是 AI 交接時使用的「工作狀態快照」。
>
> 它不是 Master Roadmap、Current Status 或 Todo Backlog 的替代品，也不是新的待辦來源。
>
> 所有未完成事項仍以 `008_TODO_BACKLOG.md` 為唯一正式來源；最新正式版本與正式環境狀態仍以 `003_CURRENT_STATUS.md` 為準。本文件也不是 `002_MASTER_ROADMAP.md` 的替代品：長期順序異動仍只記錄於 Roadmap。

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

<!-- END FILE: 012_AI_HANDOVER.md -->
