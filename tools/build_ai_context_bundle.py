from pathlib import Path
import hashlib
from datetime import datetime, timezone

repo_root = Path(__file__).resolve().parents[1]
context_dir = repo_root / "AI_CONTEXT"
export_dir = context_dir / "EXPORTS"
export_dir.mkdir(parents=True, exist_ok=True)

LITE_FILENAMES = {
    "000_AI_START_HERE.md",
    "000_AI_WORKSPACE_RULES.md",
    "001_README.md",
    "003_CURRENT_STATUS.md",
    "008_TODO_BACKLOG.md",
    "012_AI_HANDOVER.md",
}

all_files = sorted(
    p for p in context_dir.glob("*.md")
    if p.is_file()
)
lite_files = [p for p in all_files if p.name in LITE_FILENAMES]

generated_at = datetime.now(timezone.utc).isoformat()


def build_bundle(title: str, files: list[Path]) -> str:
    parts = [
        f"# {title}",
        "",
        "此檔由 Repository 的 `AI_CONTEXT/` 自動產生，供 ChatGPT Project／Work 與 Claude Project 使用。",
        "不得手動修改本 Bundle；請修改來源文件後重新產生。",
        "",
        f"Generated UTC: {generated_at}",
        "",
        "## Manifest",
        "",
    ]

    for p in files:
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        parts.append(f"- `{p.name}` — SHA-256 `{digest}`")

    for p in files:
        content = p.read_text(encoding="utf-8").rstrip()
        parts.extend([
            "",
            "---",
            "",
            f"<!-- BEGIN FILE: {p.name} -->",
            "",
            content,
            "",
            f"<!-- END FILE: {p.name} -->",
        ])

    return "\n".join(parts).rstrip() + "\n"


full_out = export_dir / "000_Universal_Rebalance_AI_Context_Bundle.md"
full_out.write_text(
    build_bundle("Universal Rebalance AI Context Bundle", all_files),
    encoding="utf-8",
)
print(full_out)

lite_out = export_dir / "000_Universal_Rebalance_AI_Context_Bundle_Lite.md"
lite_out.write_text(
    build_bundle("Universal Rebalance AI Context Bundle (Lite)", lite_files),
    encoding="utf-8",
)
print(lite_out)
