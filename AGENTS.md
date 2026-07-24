# AGENTS.md — Universal Rebalance / Codex

## 語言規則

所有面向使用者的回應（包含說明文字、初始化回報、唯讀盤點結果、PR 說明、提出的問題等）一律使用**繁體中文**，無論使用者輸入的語言為何。

例外（不受此規則限制）：

- 程式碼本身、變數名稱、函式名稱、檔案路徑
- Commit message 的技術用語（可維持英文慣例，但建議摘要句可中文）
- Log／錯誤訊息原文引用
- 既有英文專有名詞（例如 PR、Merge、Branch、Deploy、CI 等）可保留英文，不必刻意翻譯

Before doing any work, read and follow:

```text
AI_CONTEXT/000_AI_START_HERE.md
```

Then use the files under `AI_CONTEXT/` as the project governance source of truth.

Command semantics:

- `開始工作` = Review Mode. Do not edit repository code, create branches, commit, push, open PRs, or deploy.
- `開始開發` = Development Mode request. Complete the read-only Git and repository baseline first, then follow the documented branch/PR workflow.

Never merge a PR or deploy Production without explicit user authorization.
After changing any `AI_CONTEXT` file, regenerate the portable bundle with:

```text
python tools/build_ai_context_bundle.py
```
