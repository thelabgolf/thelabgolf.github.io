# The Lab 3.0 — DRVN-inspired feature integration audit
Branch: lab-3-major-feature-integration
Status: IN PROGRESS — not approved for production promotion.

## Single owner per feature
1. Home: read-only aggregate dashboard; no separate practice or round writes.
2. Train: Academy lessons and Practice Center drill execution; Swing Lab is a specialist training tool.
3. Programs: program creation, scheduling, active plan, and completion ownership.
4. Progress: practice trends, round results, training history; Round Tracker owns round entry.
5. More: account, Club Locker, Course Strategy, settings and secondary tools.

## Twelve release checks
- [ ] One header and one five-button mobile dock on every page, including refresh and back navigation.
- [ ] Transparent logo asset and consistent header dimensions verified at 320/375/390/430px.
- [ ] Train gives direct access to Academy (20 lessons), Practice (262 drills), and Swing Lab.
- [ ] Programs uses a single persisted program source and preserves existing plans.
- [ ] Weekday schedule comes from real assigned sessions; never infer a workout from the next incomplete session.
- [ ] Completion writes once and is reflected in Programs, Home and Progress.
- [ ] Practice attempts and success rates agree across Practice and Progress.
- [ ] Round Tracker results appear in Progress and Home, with consistent 9/18-hole semantics.
- [ ] Club Locker distances feed Course Strategy without overwriting approach preference.
- [ ] Course Strategy uses verified tee/par/yardage, retains saved 18-hole plans.
- [ ] Authentication and cloud saves persist across refresh and device, with honest offline messaging.
- [ ] Video playback, lesson links, mobile overflow, accessibility and missing assets pass manual testing.

## Confirmed code findings and changes in this branch
- Home previously showed the next incomplete workout under a date selector even though it was not scheduled for that day. Label corrected to Training Schedule / Next Incomplete Session, and explicit limitation added.
- Local program fallback could select an archived plan; corrected to skip archived plans.
- Local completion detection previously read only `done`; now also reads `completed`.
- Swing Lab and Round Tracker were classified under More in shared navigation; corrected to Train and Progress respectively.
- Existing Practice and Programs HTML still contain legacy navigation and mixed localStorage/Supabase references; data authority needs deeper verification.
- No database migrations, destructive storage changes, or production promotion in this branch.

## Release gate
Run build and automated route checks; inspect mobile screenshots and real signed-in user flows; test save/refresh and cross-device persistence; only then stage production and promote. Do not claim READY means visual or functional QA passed.
