#!/usr/bin/env python3
"""Produce two separately uploadable Cloudflare Pages deployment archives.
Upload public-placeholder.zip as project production FIRST. Configure Access
preview protection BEFORE uploading protected-staging.zip as preview.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
def build(folder, archive):
    base = DIST / folder
    if not base.is_dir():
        raise SystemExit(f"Missing build directory: {base}")
    files = sorted(p for p in base.rglob("*") if p.is_file())
    if not (base/"index.html").exists() or not (base/"_headers").exists():
        raise SystemExit(f"Required Pages files absent in {folder}")
    with ZipFile(DIST / archive, "w", compression=ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, p.relative_to(base).as_posix())
    print(archive, len(files), "files; index.html at ZIP root")
build("v2-public-placeholder", "leva-v2-01-public-placeholder.zip")
build("v2-staging", "leva-v2-02-protected-preview.zip")
print("CAUTION: Only upload the V2 preview archive after Cloudflare Access preview authentication is enabled.")
