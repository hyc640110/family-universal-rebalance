# Universal Rebalance Current Status v3.9

最後更新：2026-07-24

本次更新依據：2026-07-24 Claude Code Review Mode「最新基線與 AI 治理文件唯讀差異盤點」，比對本機 Repository、`gh` 遠端 PR／Workflow 資料與既有治理文件所得結果。本次僅更新治理文件內容，未修改 Repository 程式、AppState、Firebase、Backup 或 Production。

## 1. 最新正式版本

- 正式版本：V6.17.3A
- 名稱：Household Liquidity Plan Input Foundation（含 Plan Input UI Entry Point）
- PR：#105（MERGED）
- 前置同系列 PR：#102、#103、#104（皆 MERGED，與 #105 合計為家庭流動性主題目前已合併的四個 PR）
- 狀態：MERGED
- merge commit：
  `251016977fc63aca3221c0b383170a68cad89900`

## 2. Repository 狀態

- Repository：`hyc640110/family-universal-rebalance`
- Branch：`main`
- HEAD／本機 main／origin/main：
  `251016977fc63aca3221c0b383170a68cad89900`
- `main...origin/main`：`0 / 0`
- Working tree：**非乾淨**——存在未追蹤、從未進版控的治理檔案：`AGENTS.md`、`CLAUDE.md`、`AI_CONTEXT/`、`tools/`。詳見第 12 節。
- Open／Draft PR：無（`gh pr list --state open` 回傳空陣列）

固定 stash：

- `stash@{0}`：`e141af14273b76501c1b287ea018e8728099f1e5`
- `stash@{1}`：`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`

固定 stash 不得操作、套用、清除、重建或改寫。本次盤點未操作。

## 3. Production 狀態

### GitHub Pages

- 最新成功部署 Workflow：`29935264176`（`Deploy GitHub Pages`，success，headSha `2510169`77fc63aca3221c0b383170a68cad89900）
- 觸發機制：`.github/workflows/deploy.yml` 設定為 `on: push: branches: [main]`，**沒有 Draft／Ready／人工核准閘門**。PR #102～#105 每次 Merge 進 `main` 都各自自動觸發一次成功部署：
  - PR #102 → run `29913500881`（success，headSha `40159b4`）
  - PR #103 → run `29922886050`（success，headSha `64407e7`）
  - PR #104 → run `29926174499`（success，headSha `8aa12c0`）
  - PR #105 → run `29935264176`（success，headSha `2510169`，**目前 Production 實際內容**）
- 現況：Production Pages 目前實際服務內容為 V6.17.3A（`2510169`），含 Household Liquidity Core／Input Adapter／Data Provenance／Plan Input UI Entry Point 全部四個 PR 的內容。
- 已知落差（本次盤點更正）：PR #102～#105 內文皆敘述「未部署 Production／未手動重跑 workflow」，此敘述僅代表「未人工手動觸發」，並未涵蓋 push-to-main 自動部署這件事。舊版本文件（v3.8 及之前）沿用此敘述，誤記 Production 仍停留在 PR #101（V6.16.1，`941daf3`）。本節已依 Workflow 實際執行紀錄更正。

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
7. CLEC 同一現金同時作為 availableCash 與 cashReserve — **未解決**，待 Sprint 5（UR-TODO-010）
8. Allocation Simulator 未區分外部資金、現有可投資現金、安全現金與提款 — **未解決**，待 Sprint 5
9. Dip Alert 是觀察訊號，但部分 UI 容易被理解為立即買入 — **未解決**，待 Sprint 3／6
10. 防守總資產與防守型持股仍有語意混用 — **未解決**，待 Sprint 6（UR-TODO-011）

## 9. Sprint 進度與下一個建議 Sprint

- **Sprint 1（Household Liquidity Core Model Foundation）：已完成** — PR #102、#103 已合併，範圍與 `013 v3.0` 一致，對應 UR-TODO-006。
- **Sprint 2（Liquidity Data Provenance & Migration）：部分完成** — PR #104、#105 已合併 provenance／schema／migration／round-trip 與 Plan Input 持久化；尚未接入任何正式 consumer，對應 UR-TODO-007（部分完成，詳見 `008_TODO_BACKLOG.md`）。
- **下一個建議 Sprint：Sprint 3 — Rebalance & Trade Execution Integration**（對應 UR-TODO-008，`013 v3.0` 第 12～14、23、30 節），前提是先完成第 11 節「現行下一步」列出的文件同步與 P0 唯讀盤點。

## 10. 緊急外部風險

Firebase Realtime Database `my-00662-default-rtdb` 測試模式用戶端存取權限即將到期（UR-TODO-001，P0）。

到期後可能影響：

- 雲端上傳
- 雲端下載
- Firebase 手動同步

通常不直接影響：

- GitHub Pages
- localStorage
- Price Worker
- Market Worker
- 本機分析與再平衡
- JSON Backup

必須先唯讀確認 Security Rules 與 Firebase Authentication 使用情況，不得直接延長公開規則，也不得在 App 尚未具備 Firebase Auth 前直接改成 `auth != null`。**本次盤點未重新查詢 Firebase Console，狀態維持「待盤點」。**

## 11. 現行下一步

1. 優先處理 Firebase Security Rules 到期唯讀盤點（UR-TODO-001，P0，仍待處理）。
2. 決定 `AGENTS.md`、`CLAUDE.md`、`AI_CONTEXT/`、`tools/` 是否要正式 `git add`／Commit 進版控（見第 12 節）。
3. 決定是否需要處理新增的 `Deployment Workflow Approval & Status Accuracy` 待辦（見 `008_TODO_BACKLOG.md` 新增項目），評估 `deploy.yml` 是否需要人工核准閘門。
4. 之後從最新 main（`2510169`）建立全新 branch。
5. 開始 Sprint 3：Household Liquidity Rebalance & Trade Execution Integration（UR-TODO-008）。
6. 一個 Sprint 一個 Draft PR。
7. Preview 驗證後才進入 Ready。
8. 使用者手動 Merge。
9. Merge 後進行 Production 唯讀驗證（並注意 push-to-main 會立即自動部署，Draft／Ready 狀態不影響此自動部署行為）。

## 12. AI 治理文件版控狀態

- `AGENTS.md`、`CLAUDE.md`、`AI_CONTEXT/`（含全部 16 份 `000_`～`015_` 正式文件與 `EXPORTS/` 產生檔）、`tools/`（`build_ai_context_bundle.py`、`更新_AI_內容包.cmd`）**目前皆為 git 未追蹤內容，從未被 commit 過**，不存在於 `main` 或任何 branch 的 git 歷史中。
- 這些檔案僅存在於目前這份本機 checkout；其他 clone、worktree 或僅依賴 git 歷史的協作者／AI 工作階段目前**看不到**這套治理規則。
- 本次盤點確認上述檔案內容不含密鑰、Token、帳密或 Firebase URL 等敏感資訊；僅 `012_AI_HANDOVER.md` 與 `AI_CONTEXT/EXPORTS/000_Universal_Rebalance_AI_Context_Bundle.md`（內嵌前者全文）含本機絕對路徑，已於本次一併更正為中性描述。
- 是否要將以上檔案正式 `git add`／Commit，屬於會變更 Repository 內容的動作，需使用者於 Development Mode 或明確授權後決定，本次僅記錄現況。

## 13. 文件狀態

本次同步更新（2026-07-24 Review Mode 治理文件同步）：

- Current Status v3.9（本文件）
- Master Roadmap（同步更新最新基線與 Sprint 1／2 進度）
- Todo Backlog（UR-TODO-006 標記已完成、UR-TODO-007 標記部分完成、新增兩個 Todo 項目）
- AI Handover（修正本機絕對路徑為中性描述）
- AI Context Bundle（依上述變更重新產生，manifest SHA-256 已與來源文件核對一致）

未完成事項以 Todo Backlog 為單一正式來源；家庭流動性詳細設計以 `013_Household_Liquidity_Model_Spec_v3.0.md` 為唯一正式來源。
