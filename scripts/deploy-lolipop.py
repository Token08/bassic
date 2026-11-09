"""Publish a verified static export into Bassic's dedicated Lolipop directory."""

import ftplib
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import ssl
import sys
from uuid import uuid4


DESTINATION = "/bassic-site-v2"
MANIFEST = "_bassic-release.json"


def load_export(root):
    if not (root / "index.html").is_file() or not (root / "_next").is_dir():
        raise ValueError("Expected a complete Next.js static export")
    files = {}
    for local in root.rglob("*"):
        if local.is_symlink():
            raise ValueError("Static exports must not contain symlinks")
        if not local.is_file():
            continue
        name = local.relative_to(root).as_posix()
        if name in {"CNAME", ".nojekyll"}:
            continue
        parts = PurePosixPath(name).parts
        if any(not re.fullmatch(r"[A-Za-z0-9_~\[-][A-Za-z0-9._~\[\]-]*", part) for part in parts):
            raise ValueError(f"Unexpected static output path: {name}")
        if local.suffix.lower() not in {
            ".html", ".txt", ".js", ".css", ".json", ".xml", ".svg", ".ico",
            ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".woff", ".woff2", ".pdf",
        }:
            raise ValueError(f"Unexpected static output type: {name}")
        files[name] = local
    return files


def ensure_directory(ftp, directory):
    try:
        ftp.cwd(directory)
    except ftplib.error_perm:
        ftp.mkd(directory)
        ftp.cwd(directory)
    if ftp.pwd() != directory:
        raise RuntimeError("FTPS directory did not match the deployment target")


def upload_verified(ftp, name, content):
    temporary = f".bassic-upload-{uuid4().hex}"
    try:
        ftp.storbinary(f"STOR {temporary}", io.BytesIO(content))
        digest = hashlib.sha256()
        ftp.retrbinary(f"RETR {temporary}", digest.update)
        if digest.digest() != hashlib.sha256(content).digest():
            raise RuntimeError(f"FTPS verification failed for {name}")
        ftp.rename(temporary, name)
    except Exception:
        try:
            ftp.delete(temporary)
        except (OSError, ftplib.Error):
            pass
        raise


def publish(ftp, files):
    ftp.cwd("/")
    ensure_directory(ftp, DESTINATION)
    previous = {}
    try:
        saved = io.BytesIO()
        ftp.retrbinary(f"RETR {MANIFEST}", saved.write)
        previous = json.loads(saved.getvalue())
    except ftplib.error_perm as error:
        if not str(error).startswith("550 "):
            raise

    # Publish assets before route payloads, then HTML and the home page last.
    def order(name):
        return (name == "index.html", name.endswith(".html"), name.endswith(".txt"), name)

    manifest = {}
    changed = 0
    directories = {DESTINATION}
    for name in sorted(files, key=order):
        local = files[name]
        content = local.read_bytes()
        checksum = hashlib.sha256(content).hexdigest()
        manifest[name] = checksum
        directory = DESTINATION
        for part in PurePosixPath(name).parts[:-1]:
            directory += "/" + part
            if directory not in directories:
                ensure_directory(ftp, directory)
                directories.add(directory)
        ftp.cwd(directory)
        if ftp.pwd() != directory:
            raise RuntimeError("FTPS directory changed unexpectedly")
        basename = PurePosixPath(name).name
        if previous.get(name) == checksum:
            ftp.voidcmd("TYPE I")
            try:
                if ftp.size(basename) == len(content):
                    continue
            except ftplib.error_perm:
                pass
        upload_verified(ftp, basename, content)
        changed += 1
    ftp.cwd(DESTINATION)
    if previous != manifest or changed:
        upload_verified(ftp, MANIFEST, json.dumps(manifest, sort_keys=True).encode())
    return changed


def main():
    files = load_export(Path(sys.argv[1]).resolve(strict=True))
    if "--check" in sys.argv[2:]:
        print(f"Validated {len(files)} files for {DESTINATION}")
        return
    config = json.loads(os.environ.get("LOLIPOP_FTPS") or "{}")
    host = config.get("host", "")
    user = config.get("user", "")
    password = config.get("password", "")
    if not re.fullmatch(r"[a-z0-9.-]+\.lolipop\.jp", host, re.IGNORECASE) or not user or not password:
        raise ValueError("Set the LOLIPOP_FTPS secret with the official FTPS host, user and password")
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=30) as ftp:
        ftp.connect(host)
        ftp.auth()
        ftp.login(user, password)
        ftp.prot_p()
        changed = publish(ftp, files)
    print(f"Verified {changed} transferred files, {len(files) - changed} unchanged, in {DESTINATION}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Provider errors can echo account identifiers. Do not print those replies.
        if isinstance(error, ftplib.Error):
            sys.exit(f"FTPS operation failed ({type(error).__name__}). Check server access and permissions.")
        sys.exit(str(error))
