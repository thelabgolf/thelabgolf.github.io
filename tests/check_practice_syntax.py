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

# Evaluate only the data-declaration portion; DOM initialization is tested by Playwright.
# This catches accidental drill deletions, duplicate IDs and diagram/coaching gaps.
inventory_js = r"""
const fs = require('fs');
const vm = require('vm');
const script = fs.readFileSync(process.argv[1], 'utf8');
const cut = script.indexOf('const $=');
if (cut < 0) throw new Error('Practice Center initialization boundary missing');
const result = vm.runInNewContext(script.slice(0, cut) + `
JSON.stringify({
 count: drills.length, unique: new Set(drills.map(d => d.id)).size,
 metadata: metadata.length, diagrams: Object.keys(diagrams).length,
 malformedDiagrams: Object.entries(diagrams).filter(([id, svg]) =>
   !svg.startsWith('<svg') || !svg.endsWith('</svg>') ||
   !svg.includes('role="img"') || !svg.includes('aria-label="') ||
   svg.split('<text ').length !== svg.split('</text>').length
 ).map(([id]) => id),
 missing: drills.filter(d => !diagrams[d.id] || !d.steps || !d.safety).map(d => d.id),
 coaches: [...driverCoaching,...ironCoaching,...woodCoaching,...chipCoaching,...pitchCoaching,...puttCoaching,...bunkerCoaching,...strategyCoaching,...mentalCoaching,...specialtyCoaching,...coreCoaching].map(c => c.id),
 putt: puttCoaching.length,
 uniquePuttMistakes: new Set(puttCoaching.map(c => c.mistake)).size,
 uniquePuttCorrections: new Set(puttCoaching.map(c => c.correction)).size
})`);
const x = JSON.parse(result);
if (x.count !== 260 || x.unique !== 260 || x.metadata !== 260 ||
    x.diagrams !== 260 || x.missing.length || x.malformedDiagrams.length || x.coaches.length !== 260 ||
    new Set(x.coaches).size !== 260 || x.putt !== 33 ||
    x.uniquePuttMistakes !== 33 || x.uniquePuttCorrections !== 33) {
  throw new Error('Practice Center inventory regression: ' + result);
}
console.log('PASS: 260 unique drills, metadata, diagrams and unique putting coaching');
"""
with tempfile.TemporaryDirectory() as directory:
    filename = Path(directory) / "practice-inventory.js"
    filename.write_text(scripts[0], encoding="utf-8")
    subprocess.run(["node", "-e", inventory_js, str(filename)], check=True)

