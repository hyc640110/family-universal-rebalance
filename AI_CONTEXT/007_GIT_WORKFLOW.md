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
8. AI 不可自行 Merge。
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
- GitHub Environment 人工核准、Branch Protection、預設分支（目前為 `gh-pages`）修正等強化措施，本次（CI-01／CI-02／UR-TODO-037 部分）**明確不處理**，需另立獨立 Todo／Sprint。

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
4. 若必須重新產生 lockfile，應先备份現有版本（含 `version`／`resolved`／`integrity`），修正後與备份逐筆比對，任何非預期的版本或 integrity 變更都必須先停止並回報，不得直接 Commit。
5. AI 或任何自動化代理在自己的執行環境中執行 `npm install`／`npm ci` 成功，**不代表**在真正的 GitHub Actions runner 或使用者本機也會成功——尤其當執行環境本身可能位於特殊網路路徑（如內部沙盒代理）之後時，必須以真實 CI（例如 `.github/workflows/ci.yml`）的結果為準。
