# Universal Rebalance AI Handover

> 文件定位：本文件是 AI 交接時使用的「工作狀態快照」。
>
> 它不是 Master Roadmap、Current Status 或 Todo Backlog 的替代品，也不是新的待辦來源。
>
> 所有未完成事項仍以 `008_Universal_Rebalance_Todo_Backlog_v1.0.md` 為唯一正式來源；最新正式版本與正式環境狀態仍以 `003_Universal_Rebalance_Current_Status_v3.7.md` 為準。

---

## 1. 使用時機

只有在以下情況需要更新本文件：

- ChatGPT 交接給 Claude
- Claude Home 交接給 Claude Code
- Claude／Codex 交接給 ChatGPT
- 開發工作暫停，之後由另一個 AI 接手
- 同一 Sprint 尚未完成，需要跨工具或跨對話延續

若目前沒有進行中的 Sprint、Branch 或 Draft PR，可保留本文件為「無進行中工作」。

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

---

# 目前交接快照

## 3. 基本資訊

- 最後更新時間：
- 更新者／工具：
- 交接給：
- 工作模式：
  - [ ] Review Mode
  - [ ] Planning Mode
  - [ ] Development Mode

---

## 4. 正式基線

- 正式版本：
- 正式 PR：
- merge commit：
- Production Pages workflow：
- Production Worker 版本：
- 正式基線是否已重新驗證：
  - [ ] 是
  - [ ] 否，沿用 `003_Current_Status` 已驗證結果

---

## 5. Repository 狀態

- Repository：`hyc640110/family-universal-rebalance`
- Repository Root：目前 checkout 所在的 Repository 根目錄（依實際環境而定，不固定寫死本機絕對路徑）
- 目前 Branch：
- HEAD：
- origin/main：
- main：
- `main...origin/main`：
- Working tree：
- Open／Draft PR：
- PR Head：
- Preview：
- 是否存在未提交修改：
- 是否存在未追蹤檔案：

### 固定 stash

以下固定 stash 不得操作：

- `stash@{0}`：`e141af14273b76501c1b287ea018e8728099f1e5`
- `stash@{1}`：`4a0ddb208c5821f18fbb8e1a74a903abdddb22ba`

不得 apply、pop、drop、clear、rename、recreate、overwrite。

---

## 6. 目前 Sprint

- Sprint／版本名稱：
- 對應 Todo ID：
- 目標：
- 開發範圍：
- 明確不包含：
- Branch：
- PR：
- PR 狀態：
  - [ ] 尚未建立
  - [ ] Draft
  - [ ] Ready for review
  - [ ] Merged
  - [ ] Closed

---

## 7. 已完成工作

-
-
-

---

## 8. 尚未完成工作

-
-
-

---

## 9. 已修改檔案

-
-
-

---

## 10. 驗證狀態

- [ ] 對應單元測試
- [ ] 回歸測試
- [ ] Stability
- [ ] TypeScript
- [ ] Production build
- [ ] Preview build
- [ ] Artifact isolation
- [ ] `npm audit --omit=dev --audit-level=high`
- [ ] `git diff --check`
- [ ] 桌機 1000px 驗收
- [ ] 桌機 1600px 驗收
- [ ] iPhone Safari 約 390px 驗收
- [ ] localStorage 相容性
- [ ] Firebase 相容性
- [ ] JSON Backup round-trip
- [ ] Preview／Production 隔離

### 驗證結果摘要

- 已通過：
- 尚未執行：
- 失敗項目：
- 失敗原因：

---

## 11. 已知問題與阻擋

- 阻擋事項：
- 已知風險：
- 尚未確認資訊：
- 外部服務限制：
- 是否影響 Production：
- 是否影響使用者資料：

---

## 12. 下一位 AI 的直接起點

接手後先執行：

1. 讀取：
   - `000_AI_WORKSPACE_RULES.md`
   - `003_Universal_Rebalance_Current_Status_v3.7.md`
   - `008_Universal_Rebalance_Todo_Backlog_v1.0.md`
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

-
-
-

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
- 003_Universal_Rebalance_Current_Status_v3.7.md

未完成事項請讀取：
- 008_Universal_Rebalance_Todo_Backlog_v1.0.md

下一位 AI 應先以 Review Mode 完成 Workspace 與 Repository 唯讀初始化，
不得自行開始 Coding。
```
