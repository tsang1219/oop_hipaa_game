---
phase: 12-unified-navigation
plan: 01
status: complete
completed: "2026-03-28"
duration: "~5m"
commits: ["2a20a08"]
key-files:
  created: ["client/src/hooks/useGameState.ts"]
  modified: ["client/src/phaser/EventBridge.ts"]
key-decisions:
  - "UNLOCK_ORDER as const array with hallway rooms resolved via findPrecedingDepartment"
  - "useGameState persists extended fields (currentRoomId, currentAct, actFlags) into pq:save:v2 blob"
---

# Phase 12 Plan 01: useGameState Hook + EventBridge Constants Summary

useGameState hook with UNLOCK_ORDER linear unlock chain and isDepartmentAccessible backtrack logic, plus REACT_DOOR_LOCKED event constant.

## What Was Built

- `useGameState.ts`: Unified game state hook consolidating all PrivacyQuestPage state into one hook backed by `pq:save:v2` localStorage
- Exported standalone functions: `isDepartmentAccessible`, `isDepartmentUnlocked`, `UNLOCK_ORDER`
- Hallway rooms resolved via `findPrecedingDepartment()` mapping `hallway_reception_break` to `reception`
- EventBridge extended with `REACT_DOOR_LOCKED` constant and payload JSDoc comments for `EXPLORATION_EXIT_ROOM` and `REACT_LOAD_ROOM`

## Deviations from Plan

None - plan executed exactly as written.
