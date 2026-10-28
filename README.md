# The Lab

**Understand the Game. Master Your Game.**

Golf education and personalized training web app in active development.

## Current repository

- `index.html`: public landing-page prototype.
- `academy.html`: Academy lesson prototype.
- `practice.html`: Practice Center with 260 drills and local practice history.
- `programs.html`: My Programs prototype, supporting multiple locally saved training programs.
- `tests/check_practice_syntax.py`: Node-based JavaScript syntax and content-inventory checks.
- `tests/run_browser_qa.py`: Playwright Chromium desktop and mobile QA (requires execution and review of results).
- `ROADMAP.md`: phased development plan and feature dependencies.
- `supabase/migrations/`: proposed PostgreSQL schema and server-enforced row-level-security policies.
- `docs/member-auth-foundation.md`: authentication deployment and verification checklist.

**Important:** Real member sign-in, cloud program saving and OPERATION REBUILD owner-only access are **not live**. Database policies are committed but must be deployed and tested before use. The existing programs prototype saves only in the current browser.

## Project boundaries

Members can build and save multiple programs from standard Academy lessons and Practice Center drills. A separate user-authored lesson creator is not planned. OPERATION REBUILD is a private owner-only program, never a standard member feature.

## Privacy and repository safety

This repository is public. Do not commit secrets, production credentials, personal account data, or the private OPERATION REBUILD curriculum. Never use client-side visibility checks as a substitute for server-side authorization. Do not modify existing 260 drill IDs or `thelab-practice-v1` history storage without a reviewed migration.

No public production deployment is confirmed.
