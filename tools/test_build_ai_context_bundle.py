import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT_PATH = Path(__file__).with_name("build_ai_context_bundle.py")
SPEC = importlib.util.spec_from_file_location("build_ai_context_bundle", SCRIPT_PATH)
assert SPEC and SPEC.loader
bundle_tool = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bundle_tool)


class CanonicalLineEndingHashTests(unittest.TestCase):
    def test_lf_crlf_and_cr_share_the_same_canonical_sha256(self) -> None:
        lf = "第一行\n第二行\n"
        crlf = "第一行\r\n第二行\r\n"
        cr = "第一行\r第二行\r"

        raw_hashes = {hashlib.sha256(value.encode("utf-8")).hexdigest() for value in (lf, crlf, cr)}
        self.assertEqual(3, len(raw_hashes), "舊的直接 bytes 雜湊會因換行而不同")

        canonical_hashes = {
            bundle_tool.canonical_sha256(value)
            for value in (lf, crlf, cr)
        }
        self.assertEqual({"第一行\n第二行\n"}, {bundle_tool.canonicalize_lf(value) for value in (lf, crlf, cr)})
        self.assertEqual(1, len(canonical_hashes))

    def test_bundle_manifest_and_content_use_canonical_lf(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            source = Path(temporary_directory) / "sample.md"
            source.write_bytes(b"line one\r\nline two\rline three\n")

            bundle = bundle_tool.build_bundle("Test Bundle", [source])

        expected = bundle_tool.canonical_sha256("line one\nline two\nline three\n")
        self.assertIn(f"SHA-256 `{expected}`", bundle)
        self.assertNotIn("\r", bundle)


if __name__ == "__main__":
    unittest.main()
