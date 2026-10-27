#!/usr/bin/env python3
"""Run the committed Practice Center smoke page in real Chromium."""
import http.server
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
                assert app.locator("#drills article").count() == 70
                width = app.locator("body").evaluate("(e) => e.scrollWidth")
                inner = app.locator("body").evaluate("(e) => e.clientWidth")
                assert width <= inner + 2, f"Horizontal overflow: {width} > {inner}"
            finally:
                page.screenshot(path=str(ROOT / f"tests/practice-{label}.png"), full_page=True)
            page.close()
        browser.close()
    server.shutdown()
print("All desktop and mobile Chromium checks passed.")
