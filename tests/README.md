# Practice Center regression checks

The Practice Center is a static HTML page using browser localStorage under `thelab-practice-v1`. These tests are browser-side and do not require dependencies or a build system.

## Automated browser smoke test

Open `tests/practice-smoke.html` on the same origin as `practice.html` (for example via a local static server or GitHub Pages), then click **Run checks**. The runner loads Practice Center in an iframe, verifies drill inventory and filters, uses a dedicated test score, checks persistence across a reload, checks the JSON export payload shape by intercepting Blob creation, and restores the original practice history afterward.

Do not run while manually recording a practice session in another tab.

## Manual verification still required

- iPhone Safari layout at narrow widths and orientation changes.
- Keyboard focus order and accessible announcements.
- Every external video publisher URL, playback eligibility, and relevance.
- All driver diagrams and coaching cues reviewed by a qualified golf instructor.
- Real user export file download and opening in Files.
- GitHub Pages deployment status.
