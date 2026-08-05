# Universal Rebalance Git Workflow

## 1. 目的

本文件定義 Universal Rebalance 的固定 Git、Branch、Pull Request、Preview、驗收與 Merge 流程。

---

## 2. 核心原則

1. 永遠從最新 `main` 建立新 Branch。
2. 不沿用舊 Branch。
3. 每個 Sprint 使用一個獨立 PR。
4. PR 初始狀態為 Draft。
5. 必須提供 Preview。
6. 使用者驗收後才改為 Ready for review。
7. 由使用者自行 Merge。
8. AI 不可自行 Merge。**例外：符合 §8.2「低風險 PR 自動 Merge 規則」四類範圍且滿足全部必要條件者，AI 可自行完成 Merge，不需逐次請示；其餘一律適用本條原則。**
9. 不直接修改正式 GitHub Pages。
10. Preview 與 Production 必須隔離。
11. 不任意變更既有資料格式。
12. 不破壞 localStorage、Firebase、JSON Backup 相容性。

---

## 3. 開始工作前

```bash
git status
git branch --show-current
git fetch origin
git checkout main
git pull --ff-only origin main
```

必須確認：

- 目前是否在正確 Repository
- 工作目錄是否乾淨
- 是否存在未提交修改
- 是否存在未處理 stash
- `main` 是否為最新
- 是否有尚未 Merge 的相關 PR
- 本次修改是否會影響正式資料

若工作目錄不乾淨，不可直接覆蓋或刪除使用者修改。

---

## 4. Branch 命名

建議格式：

```text
feat/vX.Y-short-description
fix/vX.Y-short-description
hotfix/vX.Y-short-description
docs/short-description
refactor/short-description
```

範例：

```text
feat/v6.14-mobile-asset-refresh
fix/v6.13-chart-date-overflow
docs/project-architecture
```

---

## 5. Commit 原則

建議使用：

```text
feat: 新增功能
fix: 修正錯誤
docs: 文件更新
refactor: 重構但不改功能
test: 測試
chore: 工具或設定
```

範例：

```bash
git add .
git commit -m "fix: correct mobile chart date overflow"
```

要求：

- 每個 Commit 聚焦單一目的
- 不混入無關格式化
- 不提交密鑰
- 不提交大型暫存檔
- 不提交未驗證的產物

---

## 6. 驗證流程

開 PR 前至少執行：

```bash
npm ci
npx tsc -b
npm run test:ci
npm run build
npm run build:preview
```

若專案實際 script 名稱不同，應依 `package.json` 為準。`npm run test:ci` 是 2026-07-24 CI-01 Sprint 建立的完整回歸測試聚合腳本，涵蓋當時既有全部 `test:*` 腳本引用的檔案；新增測試時，若該測試檔未被任何既有 `test:*` 腳本或 `test:ci:unit-ts`／`test:ci:unit-mjs`／`test:ci:checks` 引用，必須一併加入，否則不會被部署前的 CI 測試閘門涵蓋。

2026-07-24 Hotfix「Deploy Workflow Node Runtime / DevDependency Install Failure」（UR-TODO-038）起，`.github/workflows/ci.yml`（`on: pull_request`，唯讀權限，無任何部署或 `gh-pages` 寫入步驟）會在每個 PR 於真實 GitHub Ubuntu runner 上自動執行 `npm ci`、tsx 可用性驗證、`npm run test:ci`、Production build、Preview build。開 PR 前的本機驗證仍應照上方指令執行，但 Draft PR 建立後應等待 `CI Verification` workflow 的實際結果，不得只憑本機通過就假設 GitHub Actions runner 環境也會成功——PR #107 合併後即發生本機通過但 CI runner 兩度失敗的案例，真正根因並非 Node 版本，而是 `package-lock.json` 內含指向內部沙盒網關的 `resolved` URL，見第 11 節。

還需檢查：

- 桌機版
- 手機版
- 主要資料流程
- localStorage 舊資料
- Firebase 手動同步
- JSON Backup
- 報價日期
- Preview / Production 隔離

---

## 7. Pull Request 流程

### 7.1 建立 Draft PR

PR 應包含：

- PR 標題
- 修改摘要
- 修改檔案
- 測試結果
- Preview 連結
- 驗收重點
- 相容性說明
- 已知限制
- 回復方式

### 7.2 PR 範本

```md
## 修改摘要

## 修改檔案

## 驗證結果

- [ ] TypeScript
- [ ] Test
- [ ] Build
- [ ] Desktop
- [ ] Mobile
- [ ] localStorage
- [ ] Firebase
- [ ] JSON Backup

## Preview

## 驗收重點

## 相容性與風險

## 回復方式
```

### 7.3 驗收後

只有使用者確認通過後，才能：

- 將 Draft 改為 Ready for review
- 等待使用者手動 Merge

AI 不可自行 Merge。

### 7.4 Sprint Summary 固定回報格式

每次子 PR／PR（Development Mode 下的一個工作單位）完成、Draft PR 開好之後，AI 在聊天訊息中回報時一律使用以下固定格式，不需使用者每次重新指定；欄位順序與名稱固定，缺項時明確寫「無」，不得省略欄位本身：

```text
Sprint：（對應的產品版本／Sprint 名稱，例如「V7.0B 子 PR 5b／5」）
子 PR：（本次 PR 編號與標題，例如「PR #127：將 investableCash 資金資格判斷串接進 Dip Alert」）
完成：（本次實際完成的範圍，一句話摘要）
修改檔案：（實際變更的檔案清單，含新增／修改／刪除）
新增：（新增的型別、函式、測試、文件等，僅列出對後續 Sprint 有意義的項目）
發現：（過程中發現但不在本次範圍內處理的問題，例如既存缺口、資料落差）
決策：（本次做出但未寫進 commit message 的重要判斷與理由，例如「評估後決定不修改 X，因為……」）
下一步：（緊接在本次之後、已知的下一個子 PR 或動作；若無明確下一步，寫「待使用者指示」）
風險待確認：（尚未驗證、需要使用者或下一位 AI 特別留意的事項；若無，寫「無」）
```

此格式與 §7.1／§7.2 的 PR 本文範本並存，不互相取代：PR 本文範本是寫進 GitHub PR description 的內容，本節格式是每次回報給使用者的聊天訊息摘要，兩者服務不同讀者（PR 本文給未來查閱 PR 記錄的人，Sprint Summary 給當下驗收的使用者與下一位接手的 AI）。「發現」「決策」欄位是本節新增的重點，用來捕捉 PR 本文未必會寫、但下一位 AI 或使用者需要知道的過程資訊（例如唯讀盤點中發現的既存缺口、範圍邊界的判斷理由），避免這些資訊只存在對話紀錄中、下一次交接時遺失。

---

## 8. Preview 與 Production

### Preview

- 僅供驗收
- 使用 Preview Worker
- 使用 Preview OAuth callback
- 不覆蓋正式 Firebase
- 不覆蓋正式 GitHub Pages

### Production

- 只在使用者確認後發布
- 使用 Production Worker
- 使用正式 OAuth callback
- **`main` 的 push（含 PR Merge）會由 `.github/workflows/deploy.yml` 自動觸發 Production 部署，沒有獨立、額外的人工部署核准步驟。因此「使用者手動 Merge」本身就是目前實際的 Production 發布決策點，不是「先 Merge、之後再另外決定要不要部署」。**
- 2026-07-24 CI-01／CI-02 Sprint 起，`deploy.yml` 會先執行 `npm ci` 與 `npm run test:ci`，任一失敗會中止該次 workflow、不會產出部署；但這是「部署當下」的自動把關，不是「Merge 前」的人工核准，Merge 之前仍不得描述 Production 已部署或已發布。
- PR 說明在使用者手動 Merge 完成前，一律不得寫「Production 已部署」；只能敘述本機／Preview 驗證結果。
- Merge 完成後，AI 或負責回報的人必須實際查詢該次 push 觸發的 `Deploy GitHub Pages` workflow run（run id、headSha、`status`、`conclusion`），並如實記錄為「成功」「失敗」或「待確認」，不得只憑「PR 已 Merge」就假設 Production 已成功更新。
- GitHub Environment 人工核准、Branch Protection、預設分支（目前為 `gh-pages`）修正等強化措施，本次（CI-01／CI-02／UR-TODO-037 部分）**明確不處理**，需另立獨立 Todo／Sprint。2026-07-30 更新：預設分支已修正為 `main`、`main` 已啟用 Branch Protection（詳見下方 8.1 與 `008_TODO_BACKLOG.md` UR-TODO-037 條目）；GitHub Environment 人工核准仍維持原狀未處理。

### 8.1 Branch Protection 生效後的純治理文件同步 Merge 規則（2026-07-30 起）

- `main` 已啟用 Branch Protection：`required_status_checks`（`strict: false`，必要檢查 `verify`）、`enforce_admins: false`、`required_pull_request_reviews.required_approving_review_count: 1`、`restrictions: null`。
- 本 Repository 僅有一名 collaborator（Repository 擁有者本人），沒有第二人可提供必要的 PR 核准。`enforce_admins: false` 是刻意保留的繞過閥。
- **純治理文件同步 PR**（變更範圍僅限 `AI_CONTEXT/**/*.md` 與 `AI_CONTEXT/EXPORTS/` Bundle）維持既有自動 Merge 政策：CI Verification 的 `verify` 檢查通過、機械式路徑檢查確認範圍相符後，AI 可自行將 PR 轉為 Ready for review 並完成 Merge，不需要等候使用者。
- 由於必要核准無法被第二人滿足，實際執行 Merge 時可能需要使用 `gh pr merge <PR> --merge --admin` 以管理員權限繞過保護規則。**這已經過使用者明確授權（2026-07-30 確認「選項 A」），不需要每次重新請示**，但每一次實際使用 `--admin` 繞過保護規則，都必須在回報內容中明確告知使用者，不得靜默執行。
- 一般功能／程式碼 PR **不適用**此自動 Merge 與 `--admin` 繞過安排，仍須依既有規則由使用者驗收後親自決定是否 Merge。**2026-08-05 更新：此條「一般功能／程式碼 PR 一律人工手動 Merge」的舊政策，已由下方 §8.2 取代（放寬為四類低風險範圍可自動 Merge）；本節（8.1）純治理文件同步的既有自動 Merge 安排維持不變、不受影響，8.2 是額外新增的範圍，不是修改本節內容。**

### 8.2 低風險 PR 自動 Merge 規則（2026-08-05 起）

**背景**：8.1 原本只允許「純治理文件同步 PR」自動 Merge，其餘一律要求使用者手動驗收與 Merge。使用者於 2026-08-05 正式拍板放寬此範圍，新增三類低風險程式碼 PR 也可由 AI 自行完成 Draft → CI/Tests → Ready for review → 最後機械式安全檢查 → Merge 整段流程，不需要每次逐一請示；但核心財務公式、schema／persistence、Ledger、Firebase／sync、AI Decision／Rebalance 核心接線等重大事件範圍完全不受影響，仍必須停止並取得使用者授權。

**一、可自行 Merge 的低風險變更**

若 PR 完成後同時符合以下任一類，屬於本節適用範圍：

1. 純治理文件更新（`AI_CONTEXT/**/*.md`、Full／Lite Bundle、Changelog、Current Status、Todo Backlog、Handover）——與 8.1 範圍相同。
2. 小型 UI 修正（純文字／標籤／排版／收合展開，不影響資料模型、計算結果或持久化）。
3. 小型測試補強（characterization／regression tests，不改正式產品行為）。
4. 純函式／helper 小修正（不改 schema／persistence／核心財務公式／跨模組產品契約）。

**二、自動 Merge 前必要條件（須全部成立，缺一即不得自動 Merge）**

- Base 為最新 `main`。
- PR head SHA 未意外改變。
- CI／required checks 全部成功。
- TypeScript 通過。
- 必要測試全部通過（含新增測試已掛進 `test:ci`，見 §6）。
- Production／Preview build 通過（若適用）。
- `git diff --check` 通過。
- Changed files 完全在預期範圍內，無非預期檔案。
- 無 secret／credential 混入。
- 無非預期的 schema／persistence／migration／deployment 變更。
- 無新的重大風險或尚未拍板的產品決策。

若 Branch Protection 只因需要 approval 而阻擋，且本 PR 已確認屬本節低風險自動 Merge 範圍，可沿用 8.1 既有的 `gh pr merge --admin` 流程；每次實際使用都必須在回報中明確告知，不得靜默執行。

**三、不得自行 Merge 的重大事件**

遇到以下任一情況，必須停止並取得使用者明確授權，不適用本節：

核心財務公式變更、attribution／reconciliation／rebalance 結果改變、schema 新增或修改、persistence 變更、migration、legacy rewrite、Ledger 寫入／永久採納、Firebase／sync protocol 變更、Backup／Import／Export 契約變更、AI Decision／Rebalance 核心接線、權限／安全／OAuth／憑證相關、Production 部署策略變更、大型跨模組重構、可能造成資料遺失或不可逆影響、使用者尚未拍板的產品語意。

遇到重大事件時，AI 必須輸出「【需要使用者最終 Merge 決策】」並停止，不得自行 Merge。

**四、執行方式**

低風險 PR 不需要因為每一個小步驟（開分支、寫程式、跑測試、開 PR、轉 Ready、Merge、Merge 後驗證）而分別停下來詢問使用者；應完成整個開發、驗證、Ready、Merge、Merge 後驗證及必要治理同步後，再一次回報。只有發現重大事件（見上方三）、非預期 changed files、CI／Tests 無法解決、基線不一致，或產品契約不明確時，才中途停止並詢問使用者。

**五、透明度要求**

無論是否使用 `--admin` 繞過 Branch Protection，每次依本節自動 Merge 完成後的回報都必須明確列出：

- 變更摘要（changed files、變更內容）。
- 判定為低風險的具體依據：符合上方「一、可自行 Merge 的低風險變更」四類中的哪一類、如何逐項確認符合「二、自動 Merge 前必要條件」。

不得靜默執行、不得省略此段說明。

---

## 9. Hotfix 流程

Hotfix 仍需：

1. 從最新 `main` 建立新 Branch
2. 確認問題可重現
3. 做最小修改
4. 執行 TypeScript、Test、Build
5. 建立 Draft PR
6. 提供 Preview 或明確驗證證據
7. 使用者手動 Merge

不可因為是 Hotfix 就直接修改正式站。

---

## 10. 禁止事項

- 不直接推送到 `main`
- 不自行 Merge
- 不刪除使用者 stash
- 不強制 reset 使用者工作目錄
- 不混入無關重構
- 不改動正式環境密鑰
- 不把 Preview 指向 Production 資料
- 不在測試未通過時宣稱完成
- 不改變資料格式卻沒有 migration

---

## 11. 依賴與 Lockfile 來源規則

2026-07-24 UR-TODO-038 事件確認：`package.json` 使用 `"latest"` 作為版號、以及 `package-lock.json` 內含指向非公開來源的 `resolved` URL，會導致真正的 GitHub-hosted Ubuntu runner 上的 `npm ci` 逾時失敗，即使本機（可能位於能連線該來源的沙盒／開發環境）執行完全正常。為避免重演，訂立以下規則：

1. `package.json` 的 `dependencies`／`devDependencies` **不得使用 `"latest"`**。所有直接依賴必須是明確版號或標準 semver range（`^`／`~`），確保任何時間、任何環境重新解析都得到可預期、可重現的結果。
2. `package-lock.json` 的每一筆 `resolved` 欄位**必須**是公開可存取的來源（例如 `https://registry.npmjs.org/...`），**不得**包含任何內部、私有或僅限特定沙盒環境可連線的網關／代理網址（例如過去出現過的 `packages.applied-caas-gateway1.internal.api.openai.org`）。
3. 修改 `package.json` 或 `package-lock.json` 前後，應以 `grep -c "resolved" package-lock.json` 與 `grep -i "internal\|gateway\|proxy"`（或等效方式）快速確認沒有內部網址混入；若懷疑 lockfile 已受污染，應先以逐筆比對 `version`／`integrity` 的方式驗證修正，不得直接刪除 lockfile 重新解析並無條件接受結果（重新解析可能因無版號護欄的套件而意外拉入非預期的主版本升級）。
4. 若必須重新產生 lockfile，應先備份現有版本（含 `version`／`resolved`／`integrity`），修正後與備份逐筆比對，任何非預期的版本或 integrity 變更都必須先停止並回報，不得直接 Commit。
5. AI 或任何自動化代理在自己的執行環境中執行 `npm install`／`npm ci` 成功，**不代表**在真正的 GitHub Actions runner 或使用者本機也會成功——尤其當執行環境本身可能位於特殊網路路徑（如內部沙盒代理）之後時，必須以真實 CI（例如 `.github/workflows/ci.yml`）的結果為準。
