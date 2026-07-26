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


def canonicalize_lf(text: str) -> str:
    """Match Git's canonical text content before hashing or embedding it."""
    return text.replace("\r\n", "\n").replace("\r", "\n")


def canonical_sha256(text: str) -> str:
    return hashlib.sha256(canonicalize_lf(text).encode("utf-8")).hexdigest()


def read_canonical_text(path: Path) -> str:
    return canonicalize_lf(path.read_bytes().decode("utf-8"))


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
        digest = canonical_sha256(read_canonical_text(p))
        parts.append(f"- `{p.name}` — SHA-256 `{digest}`")

    for p in files:
        content = read_canonical_text(p).rstrip()
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


def write_bundle(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as output:
        output.write(content)


def main() -> None:
    full_out = export_dir / "000_Universal_Rebalance_AI_Context_Bundle.md"
    write_bundle(full_out, build_bundle("Universal Rebalance AI Context Bundle", all_files))
    print(full_out)

    lite_out = export_dir / "000_Universal_Rebalance_AI_Context_Bundle_Lite.md"
    write_bundle(lite_out, build_bundle("Universal Rebalance AI Context Bundle (Lite)", lite_files))
    print(lite_out)


if __name__ == "__main__":
    main()
