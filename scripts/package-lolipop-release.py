"""Create a signed, static-only release for the Lolipop pull job."""

import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import zipfile


def main():
    root, target = map(Path, sys.argv[1:3])
    run = int(os.environ["GITHUB_RUN_NUMBER"])
    commit = os.environ["GITHUB_SHA"]
    if run < 1 or not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("Invalid release identity")
    payload = io.BytesIO()
    with zipfile.ZipFile(payload, "w", compression=zipfile.ZIP_DEFLATED) as package:
        package.writestr("_bassic-build.json", json.dumps({"run": run, "commit": commit}))
        for file in sorted(root.rglob("*")):
            if file.is_symlink():
                raise ValueError("Symlink in static release")
            if file.is_file() and file.name not in {"CNAME", ".nojekyll"}:
                package.write(file, file.relative_to(root).as_posix())
    body = payload.getvalue()
    if len(body) > 64 * 1024 * 1024:
        raise ValueError("Release exceeds download limit")
    with tempfile.TemporaryDirectory() as directory:
        key = Path(directory) / "signing.pem"
        key.write_text(os.environ["LOLIPOP_RELEASE_SIGNING_KEY"], encoding="ascii")
        key.chmod(0o600)
        signed = subprocess.run(["openssl", "dgst", "-sha256", "-sign", str(key)], input=body, capture_output=True, check=True).stdout
    if len(signed) != 256:
        raise ValueError("Expected a 2048-bit release signing key")
    target.write_bytes(b"BASSIC01" + signed + body)


if __name__ == "__main__":
    main()
