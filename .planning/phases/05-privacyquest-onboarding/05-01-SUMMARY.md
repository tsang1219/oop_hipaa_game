---
phase: 05-privacyquest-onboarding
plan: 01
subsystem: ui
tags: [phaser, react, eventbridge, localstorage, tween, onboarding]

# Dependency graph
requires:
  - phase: 02-walk-cycle-animation
    provides: ExplorationScene Phaser scaffold with player movement and interactables
  - phase: 03-breachdefense-visual-effects
    provides: TutorialModal component used for BreachDefense onboarding modals
provides:
  - First-play intro modal (WASD/Space/ESC controls) with localStorage persistence
  - Help "?" button in HUD to re-open controls modal on demand
  - REACT_PAUSE_EXPLORATION EventBridge event for modal-driven scene pause
  - Per-room NPC scale pulse tween (onboarding hint) dismissed on first interaction
affects: [05-privacyquest-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy useState initializer pattern for localStorage reads (matches existing codebase pattern)"
    - "Phaser tween for scale oscillation as ambient onboarding hint"
    - "EventBridge REACT_PAUSE_EXPLORATION / REACT_DIALOGUE_COMPLETE pair for modal-driven scene pause/resume"
    - "Per-room localStorage keys (pq:room:{roomId}:npcPulsed) for persistent dismissal state"

key-files:
  created: []
  modified:
    - client/src/components/breach-defense/TutorialModal.tsx
    - client/src/phaser/EventBridge.ts
    - client/src/pages/PrivacyQuestPage.tsx
    - client/src/phaser/scenes/ExplorationScene.ts

key-decisions:
  - "ctaText prop added to TutorialModal as optional with same default — zero breakage to BreachDefense usages"
  - "showIntroModal added to scene start useEffect dependency array — ensures pause emits when page first loads into exploration"
  - "stopNpcPulse called at start of triggerInteraction (before paused=true) so scale resets before dialogue overlay appears"
  - "npcPulseTween cleanup in both init() and shutdown() — guards against tween leak on room switch or scene restart"

patterns-established:
  - "EventBridge on/off symmetry: every on() in create() has matching off() in shutdown()"
  - "Modal-driven scene pause: React emits REACT_PAUSE_EXPLORATION, scene sets paused=true; React emits REACT_DIALOGUE_COMPLETE to resume"
  - "localStorage keys namespaced as pq:{subsystem}:{id}:{flag} for PrivacyQuest persistent state"

requirements-completed: [ONBD-01, ONBD-02]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 05 Plan 01: PrivacyQuest Onboarding Summary

**One-time WASD/Space/ESC intro modal with localStorage persistence, help button, and per-room NPC scale pulse tween dismissed on first interaction**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T17:30:43Z
- **Completed:** 2026-03-01T17:33:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- TutorialModal extended with optional `ctaText` prop — backward compatible with all BreachDefense usages
- EventBridge gains `REACT_PAUSE_EXPLORATION` constant enabling React to pause Phaser scene on demand
- PrivacyQuestPage: intro modal shown on first visit (gated by `pq:onboarding:seen` localStorage flag), "?" help button in HUD re-opens modal, scene pauses behind modal and resumes on dismiss
- ExplorationScene: first NPC per room pulses (scale 1.0→1.15 yoyo infinite) until player interacts; pulse stops and `pq:room:{id}:npcPulsed` flag set permanently; tween cleaned up in both init() and shutdown()

## Task Commits

Each task was committed atomically:

1. **Task 1: Intro modal with help icon and scene pause wiring** - `5097b27` (feat)
2. **Task 2: NPC pulse tween and scene pause listener in ExplorationScene** - `d09e7ba` (feat)

## Files Created/Modified

- `client/src/components/breach-defense/TutorialModal.tsx` - Added optional `ctaText` prop (default: "Got it! Let's go →") for customizable CTA button text
- `client/src/phaser/EventBridge.ts` - Added `REACT_PAUSE_EXPLORATION: 'react:pause-exploration'` constant under React->Phaser block
- `client/src/pages/PrivacyQuestPage.tsx` - Intro modal state (lazy localStorage init), dismiss/help handlers, "?" button in HUD, TutorialModal render, scene start pause emit
- `client/src/phaser/scenes/ExplorationScene.ts` - npcPulseTween/npcPulseTarget fields, init cleanup, post-NPC-loop pulse start, REACT_PAUSE_EXPLORATION listener, onPauseFromModal handler, stopNpcPulse method, shutdown cleanup

## Decisions Made

- `ctaText` prop added to TutorialModal as optional with same default — zero breakage to BreachDefense usages
- `showIntroModal` added to scene start useEffect dependency array — ensures pause emits correctly on first exploration load
- `stopNpcPulse` called at the start of `triggerInteraction` before `this.paused = true` — scale resets before dialogue overlay appears, avoiding visible scale artifact
- Tween cleanup in both `init()` and `shutdown()` guards against leaks on room switch or scene restart

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ONBD-01 (intro modal) and ONBD-02 (NPC pulse) complete
- PrivacyQuest onboarding phase 05 ready for any additional plans
- `localStorage.clear()` in handlePlayAgain resets both `pq:onboarding:seen` and all `pq:room:*:npcPulsed` flags automatically

## Self-Check: PASSED

- FOUND: client/src/components/breach-defense/TutorialModal.tsx (ctaText prop)
- FOUND: client/src/phaser/EventBridge.ts (REACT_PAUSE_EXPLORATION)
- FOUND: client/src/pages/PrivacyQuestPage.tsx (pq:onboarding:seen)
- FOUND: client/src/phaser/scenes/ExplorationScene.ts (npcPulseTween)
- FOUND: .planning/phases/05-privacyquest-onboarding/05-01-SUMMARY.md
- FOUND: commit 5097b27 (Task 1)
- FOUND: commit d09e7ba (Task 2)
- TypeScript: clean (0 errors)
- Vite build: success

---
*Phase: 05-privacyquest-onboarding*
*Completed: 2026-03-01*
