# Cross-AI Workspace Compatibility Specification

版本：v1.1

最後更新：2026-07-24

## 1. 目標

讓 Universal Rebalance 的同一套專案規則同時適用於：

- Codex
- ChatGPT Project
- ChatGPT Work
- Claude 首頁／Claude Project
- Claude Code

使用者日常只需要「開始工作」「開始開發」「整理交接」三個口令，詳見 [000_AI_START_HERE.md](000_AI_START_HERE.md)。

## 2. 評估過的方案

### 方案 A：所有平台都讀 Windows 外部文件目錄

優點：沿用既有目錄。  
缺點：雲端 Codex、ChatGPT Project、Work 與 Claude Project通常無法直接讀取本機 `E:\` 路徑；不可作為跨平台方案。

### 方案 B：每個平台各維護一套文件

優點：平台設定直接。  
缺點：Current Status、Todo 與規格容易分叉，長期維護風險最高。

### 方案 C：Repository 單一來源＋一份 Project Bundle（採用）

- Repository 的 `AI_CONTEXT/` 是唯一 active source。
- Codex 使用 `AGENTS.md` 自動導向。
- Claude Code 使用 `CLAUDE.md` 自動導向。
- ChatGPT／Work／Claude Project 使用由同一來源自動產生的單一 Bundle。

優點：跨平台、低記憶負擔、避免多套內容手動同步。  
限制：ChatGPT／Claude Project 的知識檔不會因 Repository 改變而自動更新，因此重大文件更新後仍需重新上傳一份 Bundle；產生 Bundle 的動作交由 AI 或腳本完成。

## 3. 架構

```text
Repository root
├── AGENTS.md                    # Codex 自動入口
├── CLAUDE.md                    # Claude Code 自動入口
├── AI_CONTEXT/                  # 唯一正式 AI 文件來源
│   ├── 000_AI_START_HERE.md
│   ├── 001_README.md
│   ├── ...
│   ├── 015_CROSS_AI_COMPATIBILITY_SPEC.md
│   └── EXPORTS/
│       ├── 000_Universal_Rebalance_AI_Context_Bundle.md       # Full
│       └── 000_Universal_Rebalance_AI_Context_Bundle_Lite.md  # Lite
└── tools/
    ├── build_ai_context_bundle.py
    └── 更新_AI_內容包.cmd
```

## 4. 平台行為

### Codex

`AGENTS.md` 只包含平台入口與權限口令，詳細規則一律讀 `AI_CONTEXT/000_AI_START_HERE.md`。

### Claude Code

`CLAUDE.md` 與 Codex 採相同模式，避免兩套規則。

### ChatGPT Project／Work

在同一個 Universal Rebalance Project 中保存：

- `000_Universal_Rebalance_AI_Context_Bundle.md`
- 專案指令

Work 應從該 Project 開始，以沿用相同檔案與指令。

### Claude 首頁／Claude Project

在 Universal Rebalance Project knowledge 中保存同一份 Bundle，並設定專案指令。

## 4.1 權責區分：Home／ChatGPT vs. Code／Codex

| | Claude 首頁／Claude Project、ChatGPT Project／Work | Claude Code、Codex |
|---|---|---|
| Repository 存取權 | 無（只有 Project Knowledge） | 有 |
| 可執行動作 | 讀取 Bundle、分析、規劃、產出交接內容 | 讀取 `AI_CONTEXT/`、唯讀盤點、（Development Mode 下）修改程式、Commit、建 PR |
| 「開始工作」 | 依 Bundle 內容進行 Review／規劃 | 依 Repository 進行 Review／規劃 |
| 「開始開發」 | 只能產出開發指令／規格／Patch，不得假稱已 Commit、Push、建 PR 或部署 | 依 [000_AI_START_HERE.md](000_AI_START_HERE.md) 第 4 節固定流程實際執行 |
| 「整理交接」 | 以聊天訊息輸出 [012_AI_HANDOVER.md](012_AI_HANDOVER.md) 第 2.2 節格式，不寫入 Repository | 可直接將交接內容寫入 `012_AI_HANDOVER.md` 並視需要重新產生 Bundle |

## 4.2 正式交接流程：Claude Home → Claude Code → ChatGPT

當一段規劃討論在 Claude 首頁（或 Claude Project）完成、需要交給有 Repository 存取權的 Claude Code 落地，再回饋給 ChatGPT 端的 Project Knowledge 時，依下列固定流程：

```text
Claude Home（或 Claude Project）
→ 使用者下達「整理交接」
→ Claude Home 依 012_AI_HANDOVER.md §2.2 格式輸出交接內容（聊天訊息，因無 Repository 存取權）
→ 使用者將交接內容帶到 Claude Code
→ Claude Code
→ Repository 唯讀確認（Branch、HEAD、main／origin/main、Working tree、Draft／Open PR、固定 stash）
→ 比對交接內容與 Repository 現況是否一致；不一致先回報差異，不自行覆蓋
→ 更新 AI_CONTEXT（依交接內容更新 012_AI_HANDOVER.md，必要時同步 002／003／008／013）
→ 重新產生 Bundle（Full／Lite，見第 5 節）
→ 使用者將最新 Bundle 上傳／更新到 ChatGPT Project Knowledge
→ ChatGPT
→ 使用者下達「開始工作」，ChatGPT 以最新 Bundle 為準繼續
```

失敗處理：任一步驟發現交接內容與 Repository 或 Bundle 不一致，該步驟的 AI 必須停止並回報差異，不得自行判斷取捨（見第 6 節）。

## 5. Bundle 產生規則

- 依檔名排序合併 `AI_CONTEXT` 根目錄的 Markdown 文件。
- 不包含 EXPORTS，避免 Bundle 自我遞迴。
- 每份文件使用清楚的 BEGIN／END 標記。
- 每次產生寫入檔案清單與 SHA-256，便於確認版本。
- 同一次執行同時產生 **Full Bundle**（含 `AI_CONTEXT/` 全部正式文件，供需要完整規則細節的場合使用）與 **Lite Bundle**（只含 `000_AI_START_HERE.md`、`000_AI_WORKSPACE_RULES.md`、`001_README.md`、`003_CURRENT_STATUS.md`、`008_TODO_BACKLOG.md`、`012_AI_HANDOVER.md`，供日常「開始工作」快速對齊使用），皆輸出到 `AI_CONTEXT/EXPORTS/`，不手動維護兩套內容。
- ChatGPT／Claude Project Knowledge 預設使用 Full Bundle；若平台對單一檔案大小或知識庫檔案數量有限制，改用 Lite Bundle，並在專案指令中註明「本 Project 使用 Lite Bundle，涉及 004／006／007／010／011／013／015 等細節時提示使用者改查 Repository 或 Full Bundle」。

## 6. 失敗處理

- 平台找不到 Bundle：停止初始化，明確指出缺少檔案，不得依聊天記憶猜測正式狀態。
- Repository 工具不可用：自動降級為 Review Mode。
- Bundle 與 Repository 文件衝突：有 Repository 存取權時以 Repository 為準；只有 Project knowledge 時以最新上傳 Bundle 為準。
- 發現多份 active Current Status 或 Todo：停止自動選擇並標記文件治理問題。

## 7. 驗收條件

- Codex 開啟 Repository 後可由 `AGENTS.md` 找到共同入口。
- Claude Code 開啟 Repository 後可由 `CLAUDE.md` 找到共同入口。
- ChatGPT Project／Work 只需一份 Bundle（Full 或 Lite）與一次專案指令設定。
- Claude Project 只需同一份 Bundle（Full 或 Lite）與一次專案指令設定。
- 所有平台都正確區分「開始工作」「開始開發」「整理交接」。
- 沒有 Repository 存取權的平台不得假稱完成 Git／PR／部署動作。
- Claude Home → Claude Code → ChatGPT 的交接可依第 4.2 節流程完整走完一輪，且每一步都能唯讀比對交接內容與 Repository／Bundle 是否一致。
