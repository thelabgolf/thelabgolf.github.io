# The Lab — Development Roadmap

Status: **Approved for planning only. Not implemented.**  
Repository: `Bidova/The-lab` · target branch: `main`

## Non-negotiable safeguards

- Preserve exactly **260 existing Practice Center drills** and every existing drill ID.
- Preserve the `thelab-practice-v1` localStorage key, schema, and existing saved history. Any future migration must be additive, reversible, and tested against real legacy samples.
- **OPERATION REBUILD is the owner's private 21-week training program**, not a feature or curriculum for ordinary members. Enforce owner-only access on the server, not merely by hiding UI. Do not commit private program content to this public repository.
- Public visitors may browse feature descriptions and previews; opening protected interactive features should prompt authentication. Signed-in regular members receive standard features, not owner-only material.
- No feature in this document is considered shipped solely because it appears in the roadmap.

## Phase 0 — Finish and validate existing foundation (prerequisite)

- [ ] Verify Practice Center GitHub Actions browser QA, job logs, screenshots, and actual Chromium results at 1365px, 390px and 320px.
- [ ] Finish coaching/scoring/illustration and accessibility review for Mental Game, Specialty Shots, Bunker Play, and Putting.
- [ ] Regression-test search, filters, saved history, JSON export, and legacy drill IDs.
- [ ] Establish secure sign-in, member identity, account authorization, backups, and a tested data migration plan before any cloud personalization.

## Phase 1 — Practice accessibility and portability

### Simulator & Winter Practice Mode
- [ ] Add context filters for Toptracer, simulator, indoor mat, foam balls, and outdoor range.
- [ ] Map **existing** drills to supported practice environments; do not duplicate or renumber drills.
- [ ] Provide equipment and safety constraints, including foam-ball limitations and whether ball-flight feedback is available.
- **Depends on:** stable drill metadata and filters (Phase 0).

### Printable Practice Cards
- [ ] Create low-ink, accessible printable layouts for existing drills, lesson summaries, and weekly plans.
- [ ] Include clear setup, attempts, success criterion, safety guidance, and meaningful diagram where available.
- [ ] Ensure browser print/PDF output fits US Letter without clipping.
- **Depends on:** reviewed drill text/diagrams (Phase 0); program plans for the weekly-plan variant.

## Phase 2 — Member profile and connected experience

### Golf Bag & Club Locker
- [ ] Store clubs, lofts, measured carry distances, typical shot shape, and equipment-change history per member.
- [ ] Distinguish measured carry from estimated carry and total distance; support unknown values.
- [ ] Provide a reusable club selector to future training and strategy features.
- **Depends on:** secure member accounts, account-scoped storage and backups (Phase 0).

### Personal Golf Dashboard
- [ ] Show today's planned training, current selected program, recent scores, skill trends, and next recommended lesson.
- [ ] Handle missing data gracefully; do not invent improvement trends.
- [ ] Keep multiple member-created programs distinct; owner-only OPERATION REBUILD is never visible to regular members.
- **Depends on:** secure member data, My Programs, Practice Center results, and later Round Tracker integrations.

## Phase 3 — Skill intelligence

### Practice Challenges & Skill Benchmarks
- [ ] Define repeatable, accuracy-focused tests for putting, wedges, contact, and direction.
- [ ] Track personal bests with fixed attempts, targets, scoring rules, conditions, and dates.
- [ ] Reuse existing drills where appropriate; no new drill IDs as part of this roadmap.
- **Depends on:** stable scoring, history, and per-member storage.

### Shot Troubleshooter
- [ ] Let members select a symptom (slice, topped iron, fat contact, thin chip, poor lag putting).
- [ ] Explain possible—not certain—causes and link to reviewed Academy lessons and existing drills.
- [ ] Avoid claiming a diagnosis from self-reported symptoms alone.
- **Depends on:** reviewed Academy material and stable drill IDs.

### Practice Prescription
- [ ] After a round or session, suggest exactly **three existing drills** tied to the member's weakest supported skills.
- [ ] Explain each recommendation and use a transparent, deterministic baseline before considering AI personalization.
- [ ] Support sparse data, user preferences, and practice environment; never manufacture weak spots.
- **Depends on:** Practice Challenges, Practice Center history, skill taxonomy, Round Tracker data where available, and environment filters.

## Phase 4 — On-course decisions

### Course Strategy Planner
- [ ] Plan conservative targets, preferred clubs, hazards/danger zones, and post-round notes.
- [ ] Use personal carry distances and confidence ranges; allow manual plans when no club data exists.
- [ ] Connect plans to Round Tracker results without asserting precise hazard distances unless sourced.
- **Depends on:** Golf Bag & Club Locker, Round Tracker, member storage; verified course data if map-based functionality is added.

## Delivery gates for every future implementation

1. Document acceptance criteria and accessibility expectations.
2. Implement on the authorized branch without changing the protected drill IDs or legacy storage schema.
3. Test desktop/mobile, keyboard navigation, data persistence, and export where applicable.
4. Confirm owner-only content is inaccessible to regular users through server-side authorization.
5. Commit and report exact tested passes, known failures, and unverified items.

## Priority order

**First:** complete existing QA and account/data foundation.  
**Then:** winter filters and print cards, Club Locker and dashboard.  
**Next:** benchmarks, troubleshooting, and prescriptions.  
**Last:** connected course strategy planning.

This document records scope and dependencies only. No new feature implementation is authorized by this roadmap update.
