---
phase: 24-phi-sorter-format-shift
plan: 01
subsystem: ui
tags: [phaser, react, css, hipaa, sorter, animation, audio]

# Dependency graph
requires:
  - phase: 23-phi-sorter-feedback-moments
    provides: "PHISorterOverlay wired with shake/counters/score-pulse/celebrating pipeline; sorter-particle/counter-bounce/sorter-shake/sorter-score-pulse/completion-flash/completion-header-in keyframes in index.css"
  - phase: 22-phi-sorter-content-connection
    provides: "SorterDocumentSet type, 3 document sets with SorterChart/SorterHoldIt, NPC reactions, HOLD IT reveals"
provides:
  - "SORTV2-11..15 requirement definitions with full prose specs and traceability rows in REQUIREMENTS.md"
  - "sfx_sorter_stamp (impactPlank_medium_000.ogg) and sfx_sorter_paper (scroll_002.ogg) audio keys preloaded in BootScene"
  - "shiftSeconds: number field on SorterDocumentSet type with per-set values 90/75/60"
  - "6 Phase 24 CSS keyframes in index.css: doc-slide-in, doc-slide-off-left, doc-slide-off-right, ink-stamp-in, stamp-press, clock-pulse"
affects: [24-02-desk-format-components, 24-03-overlay-rewrite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "shiftSeconds data-driven countdown on SorterDocumentSet — per-set values drive the soft clock, not component constants"
    - "No new binary audio assets — vendored Kenney packs sourced by plan, keys added to BootScene following Phase 16 sfx_sorter_correct/wrong precedent"
    - "CSS keyframe names are a CONTRACT — Plan 02/03 consume these exact names via Tailwind arbitrary animate-[...] values"

key-files:
  created: []
  modified:
    - ".planning/REQUIREMENTS.md"
    - "client/src/phaser/scenes/BootScene.ts"
    - "client/src/data/sorterData.ts"
    - "client/src/index.css"

key-decisions:
  - "sfx_sorter_stamp sourced from kenney_impact-sounds/Audio/impactPlank_medium_000.ogg — wood-plank impact is the closest available stamp-thunk from vendored packs; no new binaries added"
  - "sfx_sorter_paper sourced from kenney_interface-sounds/Audio/scroll_002.ogg — soft swish designed for sliding UI matches paper-slide rustle; same pack as sfx_sorter_correct/wrong (Phase 16 precedent)"
  - "ink-stamp-in keyframe uses --ink-rot CSS variable for per-stamp angle variation — each stamp lands organically without needing JS randomization"
  - "clock-pulse keyframe handles scale only; color shift at <10s is handled by a class swap in the component — separation of animation and color concerns keeps the keyframe reusable"

patterns-established:
  - "Phase 24 CSS keyframe block appended after Phase 23 block — ordering mirrors phase history for easy grep/navigation"

requirements-completed: [SORTV2-11, SORTV2-12, SORTV2-13, SORTV2-14, SORTV2-15]

# Metrics
duration: ~9min
completed: 2026-06-10
---

# Phase 24 Plan 01: PHI Sorter Format Shift — Foundation Summary

**Phase 24 groundwork: SORTV2-11..15 defined, stamp/paper SFX preloaded from vendored Kenney packs, per-set shiftSeconds added to sorterData, and 6 desk-format CSS keyframes committed as contract surface for Plans 02 and 03**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-06-10T05:43:00Z
- **Completed:** 2026-06-10T05:52:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Defined SORTV2-11..15 in REQUIREMENTS.md with full testable prose matching the plan spec; appended 5 traceability rows and updated v2.1 total from 22 to 27
- Added `sfx_sorter_stamp` and `sfx_sorter_paper` audio preload keys to BootScene pointing to already-vendored Kenney OGG files — no new binaries in the repo
- Added `shiftSeconds: number` to `SorterDocumentSet` type with values 90/75/60 on SET_1/SET_2/SET_3; git diff shows exactly 4 lines touched (1 type + 3 values), zero category/chart/holdIt changes
- Added 6 CSS keyframes to index.css as a named contract for Plan 02 components and Plan 03 overlay: `doc-slide-in`, `doc-slide-off-left`, `doc-slide-off-right`, `ink-stamp-in` (with `--ink-rot` CSS var), `stamp-press`, `clock-pulse`

## Task Commits

1. **Task 1: REQUIREMENTS.md + BootScene SFX + sorterData shiftSeconds** — `eb49dc4` (feat)
2. **Task 2: Phase 24 CSS keyframes** — `57014a2` (feat)

## Files Created/Modified

- `.planning/REQUIREMENTS.md` — Added SORTV2-11..15 subsection + 5 traceability rows; coverage line updated to 27 total
- `client/src/phaser/scenes/BootScene.ts` — Added sfx_sorter_stamp and sfx_sorter_paper audio preloads after existing sfx_sorter_wrong line
- `client/src/data/sorterData.ts` — Added shiftSeconds to SorterDocumentSet type; SET_1=90, SET_2=75, SET_3=60
- `client/src/index.css` — Appended Phase 24 desk-format keyframe block (6 keyframes) after Phase 23 completion-header-in

## Decisions Made

- sfx_sorter_stamp = impactPlank_medium_000.ogg (kenney_impact-sounds): wood-plank impact is the closest available stamp-thunk from the vendored packs; heavy enough to feel committed (Commandment 1)
- sfx_sorter_paper = scroll_002.ogg (kenney_interface-sounds): soft swish designed for sliding UI is the closest available paper-rustle; uses same Kenney pack as Phase 16's sfx_sorter_correct/wrong
- ink-stamp-in uses `--ink-rot` CSS variable so each stamp can land at a slightly different angle without JS randomization — organic feel via data attribute
- clock-pulse keyframe handles scale only; color class is swapped in the component at <10s — keeps the keyframe reusable across any color treatment

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 4 contract artifacts are in place for Plans 02 and 03
- Plan 02 (desk-format components: DeskSurface, ShiftClock, OutgoingTray) can consume doc-slide-in/off, ink-stamp-in, stamp-press, clock-pulse keyframes and sfx_sorter_stamp/paper keys immediately
- Plan 03 (overlay rewrite: PHISorterOverlay refactor to stamp interaction) can consume shiftSeconds from sorterData and all 6 keyframes
- Build clean, typecheck clean — no blocking issues

---
*Phase: 24-phi-sorter-format-shift*
*Completed: 2026-06-10*
