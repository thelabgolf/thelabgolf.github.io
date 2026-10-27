#!/usr/bin/env python3
"""Fail CI before browser startup when inline Practice Center JavaScript is invalid."""
from pathlib import Path
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
page = (root / "practice.html").read_text(encoding="utf-8")
scripts = re.findall(r"<script(?:\s[^>]*)?>([\s\S]*?)</script>", page)
if not scripts:
    raise SystemExit("FAIL: no inline Practice Center JavaScript found")
with tempfile.TemporaryDirectory() as directory:
    for number, script in enumerate(scripts, 1):
        filename = Path(directory) / f"practice-inline-{number}.js"
        filename.write_text(script, encoding="utf-8")
        subprocess.run(["node", "--check", str(filename)], check=True)
        print(f"PASS: inline script {number} parses")
if "]const " in page:
    raise SystemExit("FAIL: missing semicolon between coaching arrays")
print("PASS: no known coaching array boundary regression")
