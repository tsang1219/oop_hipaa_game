---
phase: 23-phi-sorter-feedback-moments
plan: 01
subsystem: ui
tags: [react, css, animation, phi-sorter, hipaa, feedback, particles]

# Dependency graph
requires:
  - phase: 22-phi-sorter-content-connection
    provides: BucketZone, sorterReactions, NPC reaction banks (Phase 22 voices), PHISorterOverlay contract
provides:
  - SORTV2-07..10 requirement definitions in REQUIREMENTS.md with traceability
  - Six Phase 23 CSS keyframes (sorter-particle, sorter-shake, counter-bounce, sorter-score-pulse, completion-flash, completion-header-in)
  - BucketZone with animated bucket counters (bounce-on-increment) + 8-particle DOM burst on feedbackState transition
  - SorterCompletionOverlay: three-band celebration (PERFECT gold / GOOD green / KEEP PRACTICING teal), scale-in header, screen-wide flash
  - NPC reaction banks expanded to 3 lines per band per NPC (27 total); getNPCFallbackReaction nonce-aware
affects:
  - 23-02 (Plan 02 — wires all components into PHISorterOverlay)
  - PHISorterOverlay.tsx (unchanged here; Plan 02 adds count prop, shake trigger, completion overlay mount)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DOM particle burst via absolutely-positioned spans + CSS custom properties (--dx, --dy) + keyframe animation"
    - "Bounce-on-increment via useEffect + prevRef comparison + setTimeout state toggle"
    - "Nonce-based deterministic fallback cycling (lines[nonce % lines.length])"
    - "Presentational overlay pattern: parent owns timing + SFX, component renders one frame of celebration"

key-files:
  created:
    - client/src/components/phi-sorter/SorterCompletionOverlay.tsx
  modified:
    - .planning/REQUIREMENTS.md
    - client/src/index.css
    - client/src/components/phi-sorter/BucketZone.tsx
    - client/src/data/sorterReactions.ts

key-decisions:
  - "SorterCompletionOverlay is purely presentational — no timers, no state; parent owns ~1.2s timing and fanfare SFX. Keeps components composable and testable."
  - "Particle burst driven by feedbackState prop transition (idle→correct/incorrect) — no new prop wiring needed until Plan 02. PHISorterOverlay compiles unchanged."
  - "count prop on BucketZone is optional (default 0) — backward compatible until Plan 02 wires bucket counts."
  - "getNPCFallbackReaction nonce param defaults to 0 — fully backward compatible; two-arg call sites in PHISorterOverlay compile unchanged."
  - "KEEP PRACTICING uses teal (#4FB3D9) not red — encourages without punishing (Commandment 5: learning shouldn't feel like failing)."
  - "8 particles at 45° intervals with alternating 44px/60px radii for pixel-art starburst feel (no border-radius — square spans)."

patterns-established:
  - "Phase 23 CSS block: always appended below Phase 16 sorter block with comment header — keep grep-able by phase number"
  - "Band text lines NEVER mention percent/accuracy/score/streak — tone is felt, not stated"
  - "Particle burst cleanup: removeAfter 600ms via timeout + state filter (no stale closure risk)"

requirements-completed: [SORTV2-07, SORTV2-08, SORTV2-09, SORTV2-10]

# Metrics
duration: 5min
completed: 2026-06-10
---

# Phase 23 Plan 01: PHI Sorter Feedback Foundation Summary

**Six Phase 23 CSS keyframes, upgraded BucketZone with animated counters + particle bursts, new SorterCompletionOverlay celebration component, and 3-line-per-band NPC reaction banks with nonce-cycling — all wired additive to Phase 22, PHISorterOverlay untouched**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-10T05:14:50Z
- **Completed:** 2026-06-10T05:19:51Z
- **Tasks:** 3
- **Files modified:** 5 (1 created)

## Accomplishments

- Defined SORTV2-07..10 in REQUIREMENTS.md with full specs and traceability rows; bumped v2.1 coverage count from 18 to 22
- Added 6 Phase 23 CSS keyframes to index.css below the Phase 16 sorter block; Phase 16 flash-green/shake-red unchanged
- BucketZone: optional `count` prop with bounce-on-increment counter (REDACTED/KEPT label) + 8-particle DOM burst on feedbackState transition — both additive, no existing logic touched
- SorterCompletionOverlay: new 101-line presentational component with three accuracy bands, scale-in header, screen-wide flash
- NPC reaction banks expanded from 1 to 3 lines per band per NPC (27 total); `getNPCFallbackReaction` gains nonce param for non-repeating fallbacks; zero scoreboard vocabulary in any text field

## Task Commits

Each task was committed atomically:

1. **Task 1: Define SORTV2-07..10 + Phase 23 CSS keyframes** - `be2bcee` (feat)
2. **Task 2: BucketZone counters + particle bursts; SorterCompletionOverlay** - `e2fb0bd` (feat)
3. **Task 3: Expand NPC reaction banks, nonce-aware fallback** - `e584dda` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `.planning/REQUIREMENTS.md` — SORTV2-07..10 definitions + traceability rows, coverage count updated to 22
- `client/src/index.css` — 6 Phase 23 keyframes appended after Phase 16 sorter block
- `client/src/components/phi-sorter/BucketZone.tsx` — animated counter + particle burst, optional count prop
- `client/src/components/phi-sorter/SorterCompletionOverlay.tsx` — NEW: three-band completion celebration
- `client/src/data/sorterReactions.ts` — 18 new band lines (3 per band × 3 NPCs), nonce-aware fallback

## Decisions Made

- SorterCompletionOverlay is purely presentational (no timers, no state) — parent owns timing (~1.2s) and fanfare SFX; keeps the component composable and testable in isolation
- Particle burst driven by existing `feedbackState` prop transition — no new prop needed until Plan 02 wires it; PHISorterOverlay compiles unchanged with zero modifications
- `count` prop on BucketZone is optional (default 0) for the same backward-compatibility reason
- `getNPCFallbackReaction` nonce param defaults to 0 — two-arg call sites in PHISorterOverlay compile unchanged
- KEEP PRACTICING band uses teal (#4FB3D9) not red — Commandment 5: learning moments shouldn't feel like punishment
- 8 square (no border-radius) particles at 45° intervals with alternating 44px/60px radii — pixel-art starburst aesthetic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 23 Plan 01 artifacts built and type-safe; build passes
- Plan 02 can import SorterCompletionOverlay and add `count` prop wiring + `sorter-shake` trigger to PHISorterOverlay without file conflicts (no overlap in files modified here)
- PHISorterOverlay.tsx remains clean for Plan 02's single-file pass
- Particle burst, counter bounce, completion overlay, and nonce cycling all individually verifiable

---
*Phase: 23-phi-sorter-feedback-moments*
*Completed: 2026-06-10*
