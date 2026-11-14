"""Keep one previously served signed package before replacing the live asset.

This is recovery material, not a direct rollback: the host rejects older run IDs.
The signature is preserved byte-for-byte; this script does not hold signing keys.
"""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.request import urlopen
import zipfile

TAG = "bassic-production"
CURRENT = "bassic-site.release"
PREVIOUS = "bassic-site.previous.release"
MAX_BYTES = 65 * 1024 * 1024


def identity(value):
    if type(value.get("run")) is not int or value["run"] < 1 or not re.fullmatch(r"[a-f0-9]{40}", value.get("commit", "")):
        raise ValueError("Invalid public release identity")
    return {"run": value["run"], "commit": value["commit"]}


def package_identity(path):
    if path.stat().st_size > MAX_BYTES:
        raise ValueError("Release exceeds backup size limit")
    data = path.read_bytes()
    if data[:8] != b"BASSIC01" or len(data) <= 264:
        raise ValueError("Invalid signed package")
    with zipfile.ZipFile(io.BytesIO(data[264:])) as archive:
        markers = [info for info in archive.infolist() if info.filename == "_bassic-build.json"]
        if len(markers) != 1 or markers[0].file_size > 4096:
            raise ValueError("Invalid build marker")
        return identity(json.loads(archive.read(markers[0])))


def choose_backup(live, current, previous=None):
    if current == live:
        return "replace"
    if previous == live:
        return "keep"
    raise ValueError("No package matching the served version; live asset was not changed")


def main():
    repo = os.environ["GITHUB_REPOSITORY"]
    if not re.fullmatch(r"[\w.-]+/[\w.-]+", repo):
        raise ValueError("Invalid repository")

    def gh(*args):
        return subprocess.run(["gh", *args], capture_output=True, text=True, check=True).stdout

    def live_identity():
        with urlopen("https://www.bassic.jp/_bassic-build.json", timeout=15) as response:
            return identity(json.loads(response.read(4097)))

    release = json.loads(gh("api", f"repos/{repo}/releases/tags/{TAG}"))
    names = {asset["name"] for asset in release["assets"]}
    if CURRENT not in names:
        print("First publication: no earlier signed package to retain.")
        return
    live = live_identity()
    with tempfile.TemporaryDirectory(prefix="bassic-release-backup-") as folder:
        root = Path(folder)
        gh("release", "download", TAG, "--repo", repo, "--pattern", CURRENT, "--dir", folder)
        current = package_identity(root / CURRENT)
        previous = None
        if current != live and PREVIOUS in names:
            gh("release", "download", TAG, "--repo", repo, "--pattern", PREVIOUS, "--dir", folder)
            previous = package_identity(root / PREVIOUS)
        action = choose_backup(live, current, previous)
        if live_identity() != live:
            raise ValueError("Served version changed during backup; retry after publication settles")
        if action == "keep":
            print("Previously served package is already retained; preserving it.")
            return
        shutil.copyfile(root / CURRENT, root / PREVIOUS)
        metadata = root / "bassic-site.previous.json"
        metadata.write_text(json.dumps({**live, "sha256": hashlib.sha256((root / PREVIOUS).read_bytes()).hexdigest()}), encoding="utf-8")
        gh("release", "upload", TAG, "--repo", repo, str(root / PREVIOUS), str(metadata), "--clobber")
        print(f"Retained served package (run {live['run']}); live asset unchanged by backup.")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Provider output can contain credentials or private URLs; keep it out of logs.
        raise SystemExit("Could not retain the served package. Publication stopped before replacing the live asset; inspect or retry the backup step.")
