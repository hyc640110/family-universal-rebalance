# Cross-AI Workspace Compatibility Specification

版本：v1.0  
最後更新：2026-07-23

## 1. 目標

讓 Universal Rebalance 的同一套專案規則同時適用於：

- Codex
- ChatGPT Project
- ChatGPT Work
- Claude 首頁／Claude Project
- Claude Code

使用者日常只需要「開始工作」與「開始開發」兩個口令。

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
│       └── 000_Universal_Rebalance_AI_Context_Bundle.md
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

## 5. Bundle 產生規則

- 依檔名排序合併 `AI_CONTEXT` 根目錄的 Markdown 文件。
- 不包含 EXPORTS，避免 Bundle 自我遞迴。
- 每份文件使用清楚的 BEGIN／END 標記。
- 每次產生寫入檔案清單與 SHA-256，便於確認版本。

## 6. 失敗處理

- 平台找不到 Bundle：停止初始化，明確指出缺少檔案，不得依聊天記憶猜測正式狀態。
- Repository 工具不可用：自動降級為 Review Mode。
- Bundle 與 Repository 文件衝突：有 Repository 存取權時以 Repository 為準；只有 Project knowledge 時以最新上傳 Bundle 為準。
- 發現多份 active Current Status 或 Todo：停止自動選擇並標記文件治理問題。

## 7. 驗收條件

- Codex 開啟 Repository 後可由 `AGENTS.md` 找到共同入口。
- Claude Code 開啟 Repository 後可由 `CLAUDE.md` 找到共同入口。
- ChatGPT Project／Work 只需一份 Bundle 與一次專案指令設定。
- Claude Project 只需同一份 Bundle 與一次專案指令設定。
- 所有平台都正確區分「開始工作」與「開始開發」。
- 沒有 Repository 存取權的平台不得假稱完成 Git／PR／部署動作。
