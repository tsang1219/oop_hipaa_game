---
phase: 27-navigation-clarity
plan: 01
subsystem: ui
tags: [phaser, react, navigation, vfx, door-states, idle-hint, sparkle]

requires:
  - phase: 26-room-visual-uplevel
    provides: particle_circle texture + collectible-aura ADD blend precedent used by 'next' door aura

provides:
  - DoorState union type (locked|available|completed|next) exported from UnifiedGamePage
  - deriveNextTargetRoom() + findFirstHopDoorId() BFS helpers in UnifiedGamePage
  - computeDoorStates() now marks one door per room 'next' via UNLOCK_ORDER critical-path
  - ExplorationScene renderDoorStates() 'next' branch — breathing warm-gold aura + ring (1600ms)
  - Idle-hint sparkle system — 9s grace, 5s interval, 3-particle round-robin on un-met objectives

affects:
  - 27-02 (feedback audit) — VIS-07 baseline established; 'next' door state propagation tested
  - Any future phase touching door state or navigation logic

tech-stack:
  added: []
  patterns:
    - "BFS door-graph traversal in React for critical-path first-hop resolution"
    - "particle_circle ADD blend aura for 'next' door (same technique as Phase 26 collectible aura)"
    - "Idle-hint activity tracking via lastActivityAt reset at input/interaction/dialogue sites"

key-files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
    - client/src/pages/UnifiedGamePage.tsx
    - client/src/phaser/scenes/ExplorationScene.ts
    - client/src/phaser/EventBridge.ts

key-decisions:
  - "'next' door promoted from 'completed' shows aura only (no checkmark) — aura is the stronger signal; checkmark returns when dept fully complete and 'next' advances"
  - "DoorState union defined once in UnifiedGamePage.tsx (not EventBridge) — EventBridge JSDoc comments updated to match; avoided a new cross-file type import"
  - "BFS traversal allows 'next' to hop through accessible hallway connectors — correctly handles hospital_entrance → hallway_reception → reception chain"
  - "findFirstHopDoorId allows reaching nextTarget even if isDepartmentAccessible returns false for it — goal room is always reachable for BFS purposes"
  - "lastIdleHintAt set in emitIdleHint() regardless of whether a target was found — prevents per-frame rescan on empty lists"

patterns-established:
  - "Activity tracking: reset lastActivityAt at isMoving, movePath active, triggerInteraction, handleDoorInteraction, onDialogueComplete — covers all input channels"
  - "emitIdleHint() uses particle_circle ADD blend at depth sprite.depth+1 — consistent with Phase 26 sparkle precedent"

requirements-completed: [VIS-07]

duration: 5min
completed: 2026-06-10
---

# Phase 27 Plan 01: Navigation Clarity — 'Next' Door + Idle Hints Summary

**'next' door state end-to-end (UNLOCK_ORDER BFS → warm-gold aura 1600ms breathe) + 9s idle-hint sparkle cycling through un-met room objectives (2-3 particles, white/pale-gold, round-robin)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-10T07:39:08Z
- **Completed:** 2026-06-10T07:44:25Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- VIS-07 and VIS-08 defined in REQUIREMENTS.md under a new "Navigation Clarity + Reward Sweep (Phase 27)" subsection; traceability rows added; v2.3 coverage bumped 6 → 8
- 'next' door state: DoorState union exported; deriveNextTargetRoom + BFS findFirstHopDoorId helpers in UnifiedGamePage; computeDoorStates marks exactly one door per room 'next' when applicable (demo-safe, in-target-room-safe, locked-never); five ExplorationScene annotation sites updated; EventBridge JSDoc updated
- renderDoorStates() 'next' branch: breathing warm-gold particle_circle ADD aura (scale 5→7, alpha 0.22→0.45, 1600ms sine yoyo) + gold stroke ring (1600ms, contrasts with blue available ring at 1000ms); fallback filled-circle alpha pulse if texture absent
- Idle-hint system: IDLE_HINT_GRACE_MS=9000 / IDLE_HINT_INTERVAL_MS=5000 constants; fields lastActivityAt/lastIdleHintAt/idleHintIndex; activity reset at all input channels; emitIdleHint() builds un-met target list from completionRequirements, fires 3-particle sparkle (white/0xffe9a0, depth sprite+1) on one target per cycle; hallways and complete rooms never sparkle

## Task Commits

1. **Task 1: Define VIS-07 and VIS-08 in REQUIREMENTS.md** - `39f7dcf` (docs)
2. **Task 2: 'next' door state — derive in React + breathe gold in Phaser** - `0660cff` (feat)
3. **Task 3: Idle-hint sparkle system** - `67a0491` (feat)

## Files Created/Modified

- `.planning/REQUIREMENTS.md` — Added Phase 27 subsection with VIS-07/VIS-08 + traceability rows + coverage count
- `client/src/pages/UnifiedGamePage.tsx` — DoorState type, deriveNextTargetRoom, findFirstHopDoorId, updated computeDoorStates, added UNLOCK_ORDER to import
- `client/src/phaser/scenes/ExplorationScene.ts` — 'next' type annotation (4 sites), 'next' render branch in renderDoorStates(), idle-hint constants/fields/tracking/emitIdleHint()
- `client/src/phaser/EventBridge.ts` — Updated 2 JSDoc payload comments to include 'next' in union

## Decisions Made

- **Completed door promoted to 'next' shows aura without checkmark**: The 'next' state overrides 'completed' for a door on the critical path (e.g., a completed hallway door). The gold aura is the stronger navigational signal; the checkmark reappears once the next department is completed and 'next' moves on. This is noted in the plan and was the explicitly called-out tradeoff.

- **DoorState type defined in UnifiedGamePage.tsx**: Kept as a local export rather than in EventBridge to minimize refactor surface. EventBridge JSDoc comments updated to document the union in comments only.

- **BFS always allows traversal to the nextTarget**: `findFirstHopDoorId` lets the BFS reach the goal room even if `isDepartmentAccessible` returns false for it — the goal room is always visitable for pathfinding purposes. This correctly handles edge cases where a target isn't yet "accessible" per the unlock check but needs to be the BFS terminus.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- VIS-07 implemented and tsc + production build clean
- VIS-08 (feedback audit table) is next (27-02-PLAN.md)
- Manual spot-check deferred to user per established pattern: fresh save in hospital_entrance → door toward Reception should breathe gold; stand still 9s → Riley/sign-in sheet/poster should sparkle one at a time

---
*Phase: 27-navigation-clarity*
*Completed: 2026-06-10*

## Self-Check: PASSED

- FOUND: .planning/phases/27-navigation-clarity/27-01-SUMMARY.md
- FOUND: client/src/pages/UnifiedGamePage.tsx
- FOUND: client/src/phaser/scenes/ExplorationScene.ts
- Commits verified: 39f7dcf (Task 1), 0660cff (Task 2), 67a0491 (Task 3)
