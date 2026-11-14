import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location("backup", Path(__file__).with_name("backup-public-release.py"))
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupTests(unittest.TestCase):
    def test_preserves_only_served_package(self):
        live = {"run": 10, "commit": "a" * 40}
        newer = {"run": 11, "commit": "b" * 40}
        self.assertEqual(backup.choose_backup(live, live), "replace")
        self.assertEqual(backup.choose_backup(live, newer, live), "keep")
        with self.assertRaises(ValueError):
            backup.choose_backup(live, newer)

    def test_signed_marker_validation_without_extracting_files(self):
        marker = {"run": 10, "commit": "a" * 40}
        for bad in [False, True]:
            with tempfile.TemporaryDirectory() as folder:
                data = io.BytesIO()
                with zipfile.ZipFile(data, "w") as archive:
                    archive.writestr("_bassic-build.json", json.dumps({**marker, "commit": "invalid"} if bad else marker))
                path = Path(folder) / "fixture.release"
                path.write_bytes(b"BASSIC01" + b"s" * 256 + data.getvalue())
                if bad:
                    with self.assertRaises(ValueError):
                        backup.package_identity(path)
                else:
                    self.assertEqual(backup.package_identity(path), marker)
                path.write_bytes(b"corrupt")
                with self.assertRaises(ValueError):
                    backup.package_identity(path)


if __name__ == "__main__":
    unittest.main()
