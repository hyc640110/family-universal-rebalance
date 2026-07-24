from pathlib import Path
import hashlib
from datetime import datetime, timezone

repo_root = Path(__file__).resolve().parents[1]
context_dir = repo_root / "AI_CONTEXT"
export_dir = context_dir / "EXPORTS"
export_dir.mkdir(parents=True, exist_ok=True)
out = export_dir / "000_Universal_Rebalance_AI_Context_Bundle.md"

files = sorted(
    p for p in context_dir.glob("*.md")
    if p.is_file()
)

parts = [
    "# Universal Rebalance AI Context Bundle",
    "",
    "此檔由 Repository 的 `AI_CONTEXT/` 自動產生，供 ChatGPT Project／Work 與 Claude Project 使用。",
    "不得手動修改本 Bundle；請修改來源文件後重新產生。",
    "",
    f"Generated UTC: {datetime.now(timezone.utc).isoformat()}",
    "",
    "## Manifest",
    "",
]

for p in files:
    data = p.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
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

out.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")
print(out)
