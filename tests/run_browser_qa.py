#!/usr/bin/env python3
"""Run the committed Practice Center smoke page in real Chromium."""
import http.server
import json
import pathlib
import socketserver
import threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *args):
        pass

with socketserver.TCPServer(("127.0.0.1", 0), Handler) as server:
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        for label, viewport in [
            ("desktop", {"width": 1365, "height": 900}),
            ("mobile", {"width": 390, "height": 844}),
            ("small-mobile", {"width": 320, "height": 640}),
        ]:
            page = browser.new_page(viewport=viewport, reduced_motion="reduce")
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{port}/tests/practice-smoke.html", wait_until="load")
            try:
                page.locator("#run").click()
                page.wait_for_function(
                    "() => document.querySelector('#results').textContent.includes('Original local data restored.')",
                    timeout=30000
                )
                result = page.locator("#results").inner_text()
                print(f"--- {label} ---\\n{result}")
                assert "ALL BROWSER CHECKS PASSED" in result and "FAIL " not in result, result
                assert not errors, errors
                app = page.frame_locator("#app")
                assert app.locator("#drills article").count() == 260
                inventory = app.locator("body").evaluate("""() => {
                    const coaches = [...driverCoaching,...ironCoaching,...woodCoaching,...chipCoaching,...pitchCoaching,...puttCoaching,...bunkerCoaching,...strategyCoaching,...mentalCoaching,...specialtyCoaching];
                    return {count:drills.length,unique:new Set(drills.map(d=>d.id)).size,
                        metadata:metadata.length,missing:drills.filter(d=>!diagrams[d.id]||!coaches.some(x=>x.id===d.id)||!d.safety||!Array.isArray(d.steps)||d.steps.length<3||!Number.isInteger(d.attempts)||d.attempts<1).map(d=>d.id)};
                }""")
                assert inventory["count"] == 260 and inventory["unique"] == 260, inventory
                assert inventory["metadata"] == 260 and not inventory["missing"], inventory
                coaching = app.locator("body").evaluate("""() => [
                    ['mental', mentalCoaching, 20],
                    ['specialty', specialtyCoaching, 20],
                    ['bunker', bunkerCoaching, 20],
                    ['putt', puttCoaching, 33]
                ].map(([prefix, items, expected]) => {
                    const subset = drills.filter(d => d.id.startsWith(prefix + '-expanded-'));
                    return {prefix, expected, count:subset.length,
                        uniqueGoals:new Set(subset.map(d => d.goal)).size,
                        uniqueTips:new Set(items.map(c => c.tip)).size,
                        uniqueMistakes:new Set(items.map(c => c.mistake)).size,
                        uniqueCorrections:new Set(items.map(c => c.correction)).size};
                })""")
                for group in coaching:
                    assert group["count"] == group["expected"], group
                    assert group["uniqueGoals"] == group["expected"], group
                    assert group["uniqueTips"] == group["expected"], group
                    if group["prefix"] != "putt":
                        assert group["uniqueMistakes"] == group["expected"], group
                        assert group["uniqueCorrections"] == group["expected"], group
                diagrams_audit = app.locator("body").evaluate("""() => {
                    const ids = [
                        'specialty-expanded-3', 'specialty-expanded-4',
                        'specialty-expanded-14', 'bunker-expanded-20',
                        'putt-expanded-19', 'putt-expanded-25'
                    ];
                    return ids.map(id => ({
                        id,
                        label: diagrams[id]?.match(/aria-label="([^"]+)"/)?.[1] || '',
                        textCount: (diagrams[id] || '').split('<text ').length - 1
                    }));
                }""")
                assert len(diagrams_audit) == 6
                for diagram in diagrams_audit:
                    assert len(diagram["label"]) >= 50, diagram
                    assert diagram["textCount"] >= 3, diagram
                accessibility = app.locator("body").evaluate("""() => ({
                    lang: document.documentElement.lang,
                    unlabeledButtons: [...document.querySelectorAll('button')].filter(
                        b => !((b.innerText || '').trim() || b.getAttribute('aria-label'))
                    ).length,
                    brokenLabels: [...document.querySelectorAll('label[for]')].filter(
                        label => !document.getElementById(label.htmlFor)
                    ).map(label => label.htmlFor),
                    diagramLabels: [...document.querySelectorAll('#diagram svg[role="img"]')].filter(
                        svg => !svg.getAttribute('aria-label')
                    ).length
                })""")
                assert accessibility["lang"] == "en", accessibility
                assert not accessibility["unlabeledButtons"], accessibility
                assert not accessibility["brokenLabels"], accessibility
                assert not accessibility["diagramLabels"], accessibility
                # Confirm the original practice-history storage key remains unchanged.
                storage_key = app.locator("body").evaluate("() => key")
                assert storage_key == "thelab-practice-v1", storage_key
                # Test an actual browser download, not just the smoke test's Blob interception.
                with page.expect_download() as download_info:
                    app.locator("#export").click()
                download = download_info.value
                assert download.suggested_filename == "the-lab-practice-results.json"
                with open(download.path(), encoding="utf-8") as exported_file:
                    exported = json.load(exported_file)
                assert exported["app"] == "The Lab" and exported["type"] == "practice-results"
                assert isinstance(exported["history"], list), exported
                width = app.locator("body").evaluate("(e) => e.scrollWidth")
                inner = app.locator("body").evaluate("(e) => e.clientWidth")
                assert width <= inner + 2, f"Horizontal overflow: {width} > {inner}"
            finally:
                page.screenshot(path=str(ROOT / f"tests/practice-{label}.png"), full_page=True)
                try:
                    page.frame_locator("#app").locator("body").screenshot(
                        path=str(ROOT / f"tests/practice-app-{label}.png"))
                except Exception as capture_error:
                    print(f"Unable to capture app screenshot ({label}): {capture_error}")
            page.close()
        browser.close()
    server.shutdown()
print("All desktop and mobile Chromium checks passed.")
