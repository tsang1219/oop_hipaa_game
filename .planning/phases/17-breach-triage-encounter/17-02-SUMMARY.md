---
phase: 17-breach-triage-encounter
plan: 02
subsystem: ui
tags: [react, typescript, hipaa, breach-notification, triage, game-loop, keyboard, sfx, animation]

# Dependency graph
requires:
  - phase: 17-breach-triage-encounter
    provides: "triageData.ts — TriageIncident/TriageIncidentSet/TriageOption/TriageFollowUp types, 9 incidents, getTriageIncidentSet()"
  - phase: 16-phi-sorter-encounter
    provides: "PHISorterOverlay.tsx pattern — phase state machine, REACT_PLAY_SFX, 600ms beat, Esc abort, error fallback; SorterDebrief.tsx — accuracy bar, band colors, entrance animation visual language"
provides:
  - "client/src/components/breach-triage/TriageIncidentCard.tsx — incident ticket card with slot badge, alarm-amber headline, timer bar, focus ring, R/N buttons, correct/wrong/expired feedback overlays"
  - "client/src/components/breach-triage/TriageFollowUpPanel.tsx — 2-step notify/timeline follow-up modal with number-key affordances, wrong-pick strike-through + amber teaching box"
  - "client/src/components/breach-triage/TriageDebrief.tsx — completion screen with accuracy bar, AVG RESPONSE stat, QUEUE CLEARED/SHIFT SURVIVED/OCR IS CALLING band headers, KEY LEARNINGS"
  - "client/src/components/breach-triage/BreachTriageOverlay.tsx — full game loop: single-interval tick engine, spawn cadence, frozen gating, keyboard hotkeys, SFX at all 5 feedback points, completion with 600ms beat"
  - "tests/breachTriageOverlay.test.mts — TDD behavioral spec tests (26 passing)"
affects:
  - 17-03 (encounter wiring — imports BreachTriageOverlay + BreachTriageOverlayProps, TriageDebrief)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-interval tick engine with ref-based frozen gating — interval registered once on mount (empty deps), all mutable values (queue, slots, tallies, nextSpawnMs) read/written through refs; functional setState for React reconciler; avoids stale-closure risk flagged in Phase 22 SUMMARY"
    - "TDD with node --experimental-strip-types: 26 behavioral spec tests covering scoring formulas, spawn timing, and onComplete contract shape — type-import RED→GREEN verifiable via tsc"
    - "TriageDebrief NOT imported by BreachTriageOverlay — UnifiedGamePage owns debrief render (BLOCKER-2 precedent from Phase 16)"
    - "frozenRef pattern: frozen boolean written to ref on every state change; interval reads ref instead of closure to gate ticks without re-registering"

key-files:
  created:
    - client/src/components/breach-triage/TriageIncidentCard.tsx
    - client/src/components/breach-triage/TriageFollowUpPanel.tsx
    - client/src/components/breach-triage/TriageDebrief.tsx
    - client/src/components/breach-triage/BreachTriageOverlay.tsx
    - tests/breachTriageOverlay.test.mts
  modified: []

key-decisions:
  - "Single-interval tick engine (empty deps) using refs for all mutable values — avoids the stale-closure tally risk noted in Phase 22 SUMMARY; frozenRef updated on every followUpState/explanationToast/phase change"
  - "Spawn queue lives in queueRef (not React state) — prevents the nested-setState anti-pattern from needing a pendingSpawnRef workaround; setSlots reads queueRef.current directly in the interval"
  - "totalCount initializes to 9 and is incremented (+2) in totalCountRef when a reportable incident opens follow-up — avoids the need to count follow-ups opened separately at completion time"
  - "TriageDebrief is standalone (not inside BreachTriageOverlay) — consistent with PHISorterOverlay/SorterDebrief separation; Plan 03 mounts it via UnifiedGamePage after onComplete fires"
  - "Expired slots dwell 1000ms for 'TOO SLOW' stamp then free; expiry counts as a classification miss in totalCount but response time is NOT recorded (time-up is a pacing failure, not a knowledge decision)"

patterns-established:
  - "TDD RED: type-import contract check fails at tsc before implementation exists; math/formula tests pass independently"
  - "Frozen gating: all timer mutations behind frozenRef.current guard — player is never punished for reading a lesson (spec: 'never punish reading')"
  - "Auto-focus: focusedSlot recalculates to first active slot whenever current focused slot resolves — fast players never need digit keys"

requirements-completed: [TRIA-02, TRIA-03, TRIA-04, TRIA-06]

# Metrics
duration: 9min
completed: 2026-06-10
---

# Phase 17 Plan 02: Breach Triage UI Summary

**3-slot whack-a-mole incident board with single-interval tick engine, frozen-gated timers, full keyboard control (1/2/3 focus, R/N classify, 1/2/3 follow-up), 5-point SFX coverage, escalating vignette, and TriageDebrief matching the sorter family visual language**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-10T04:39:45Z
- **Completed:** 2026-06-10T04:48:04Z
- **Tasks:** 2 (Task 1: 3 presentational components; Task 2: BreachTriageOverlay + TDD)
- **Files modified:** 5 created (4 components + 1 test file)

## Accomplishments

- Four components in `client/src/components/breach-triage/` compile clean with exact prop contracts per plan
- BreachTriageOverlay: spawn cadence `max(2000, 3500-i*200)ms`, per-difficulty timers (14s/12s/10s), board-frozen during follow-ups and explanation toasts, 5 SFX emission points (11 total calls)
- TDD behavioral spec: 26 tests, RED commit before implementation (type-import fails at tsc), GREEN after implementation
- TriageDebrief adds the triage-unique "AVG RESPONSE: X.Xs" stat row, QUEUE CLEARED/SHIFT SURVIVED/OCR IS CALLING header bands (vs sorter's DOCUMENTS SORTED/NICE WORK/KEEP PRACTICING)
- Keyboard-only path end-to-end: 1/2/3 focus → R/N classify → 1/2/3 follow-up options → 600ms beat → fanfare → onComplete

## Task Commits

1. **Task 1: Presentational components — TriageIncidentCard, TriageFollowUpPanel, TriageDebrief** — `7c7611a` (feat)
2. **TDD RED: add failing test for BreachTriageOverlay behavioral spec** — `1713cad` (test)
3. **Task 2: BreachTriageOverlay — spawn engine, hotkeys, feedback, completion** — `ebd806b` (feat)

## Files Created/Modified

- `client/src/components/breach-triage/TriageIncidentCard.tsx` — Incident ticket card: slot badge, alarm-amber headline, timer bar (green/yellow/red+pulse at thresholds), gold focus ring, R/N buttons, correct/wrong/expired feedback overlays
- `client/src/components/breach-triage/TriageFollowUpPanel.tsx` — 2-step notify/timeline modal: [1][2][3] number-key affordances, wrong-pick strike-through in red + amber teaching box (§164.404-410 lesson moment)
- `client/src/components/breach-triage/TriageDebrief.tsx` — Completion screen: accuracy bar, AVG RESPONSE stat row (triage-specific), band headers, KEY LEARNINGS, entrance animation matching SorterDebrief
- `client/src/components/breach-triage/BreachTriageOverlay.tsx` — Full game loop: 635 lines, single-interval tick engine (100ms), ref-based frozen gating, spawn cadence, expiry handling, keyboard hotkeys, follow-up orchestration, escalating vignette, 600ms completion beat
- `tests/breachTriageOverlay.test.mts` — TDD behavioral spec: 26 tests covering scoreContribution formula, totalCount formula, avgResponseMs, spawnDelay, difficultyToMs, and BreachTriageOverlayProps contract shape

## Decisions Made

- **Single-interval empty deps:** Registered once on mount; all mutable values accessed via refs (queueRef, frozenRef, slotsRef, etc.) to prevent stale closures. Avoids re-registering interval on every state change.
- **frozenRef pattern:** `frozenRef.current` is updated in a dedicated `useEffect` that runs on `followUpState`, `explanationToast`, and `phase` changes. The interval reads `frozenRef.current` directly — no closure capture needed.
- **queueRef instead of queue state for interval reads:** Eliminates nested-setState anti-pattern (setting queue inside setSlots inside the interval). Queue mutations go through `queueRef.current = ...` directly; `setQueue` is not needed.
- **TriageDebrief not imported:** Consistent with PHISorterOverlay/SorterDebrief separation (BLOCKER-2 fix precedent). Plan 03 mounts TriageDebrief in UnifiedGamePage after receiving onComplete.
- **Expired slots: no response time recorded:** Timer expiry is a pacing failure, not a knowledge decision — the spec explicitly says expiries count as wrong but are not included in avgResponseMs.

## Deviations from Plan

None — plan executed exactly as written. The initial BreachTriageOverlay draft had two duplicate interval effects (structural bug during drafting) which was caught before committing and fixed in the final single-interval rewrite. No deviation rules triggered.

## Issues Encountered

- Spawn formula test assertion `spawn 7 → 2000ms` was incorrect (3500 - 7×200 = 2100, not 2000 — floor hits at index 7.5). Fixed in the TDD RED file before committing. No implementation impact.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 03 (encounter wiring) can import `BreachTriageOverlay` + `BreachTriageOverlayProps` from `breach-triage/BreachTriageOverlay.tsx`
- Plan 03 can import `TriageDebrief` + `TriageDebriefProps` from `breach-triage/TriageDebrief.tsx`
- `onComplete` payload shape is stable: `{ encounterId, correctCount, totalCount, scoreContribution, avgResponseMs, takeaways }`
- `onAbort` prop is optional — Plan 03 can wire it to REACT_RETURN_FROM_ENCOUNTER with `{ aborted: true }` (same pattern as PHISorterOverlay)
- `npm run check` is clean — no type debt introduced

---
*Phase: 17-breach-triage-encounter*
*Completed: 2026-06-10*
