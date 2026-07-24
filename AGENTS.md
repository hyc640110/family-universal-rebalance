# AGENTS.md — Universal Rebalance / Codex

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
