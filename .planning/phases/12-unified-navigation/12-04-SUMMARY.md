---
phase: 12-unified-navigation
plan: 04
status: complete
completed: "2026-03-28"
duration: "~15m"
commits: ["9d13684"]
key-files:
  created: ["client/src/pages/UnifiedGamePage.tsx"]
  modified: ["client/src/App.tsx", "client/src/phaser/config.ts", "client/src/phaser/scenes/BootScene.ts", "client/src/phaser/scenes/HubWorldScene.ts", "client/src/pages/PrivacyQuestPage.tsx"]
  deleted: ["client/src/components/HallwayHub.tsx"]
key-decisions:
  - "BootScene no longer starts HubWorld — just emits SCENE_READY for React to handle"
  - "UnifiedGamePage handles both legacy string payloads and new door-nav object payloads from EXPLORATION_EXIT_ROOM"
  - "Room completion checked on door exit (not on ESC) to support continuous navigation flow"
  - "computeDoorStates uses latest completedRooms including freshly completed current room"
  - "HubWorldScene.ts kept for historical reference with @deprecated tag, not deleted"
  - "PrivacyQuestPage.tsx kept but unrouted — HallwayHub import removed to fix TS errors"
---

# Phase 12 Plan 04: UnifiedGamePage + Route Collapse Summary

Single game page at /, removed all secondary routes, retired HubWorldScene, deleted HallwayHub.

## What Was Built

- `UnifiedGamePage.tsx`: Merges HubWorldPage + PrivacyQuestPage into single React page
  - Uses `useGameState()` hook for all state management
  - `computeDoorStates()` calculates locked/available/completed per door
  - `handleExitRoom()` validates door access via `isDepartmentAccessible`, emits REACT_LOAD_ROOM or REACT_DOOR_LOCKED
  - All dialogue/modal/scoring overlays migrated from PrivacyQuestPage
  - Boot handler starts ExplorationScene with hospital_entrance (or resume room from save)
- `App.tsx`: Single route `/` -> UnifiedGamePage (removed /privacy, /breach)
- `config.ts`: Scene list [BootScene, ExplorationScene, BreachDefenseScene] (removed HubWorldScene)
- `BootScene.ts`: No longer starts HubWorld; emits SCENE_READY for React
- `HubWorldScene.ts`: Marked @deprecated, not registered
- `HallwayHub.tsx`: Deleted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PrivacyQuestPage HallwayHub import**
- **Issue:** Deleting HallwayHub.tsx caused TS error in PrivacyQuestPage (still compiled by tsc even though unrouted)
- **Fix:** Commented out HallwayHub import, replaced JSX usage with placeholder text
- **Files modified:** PrivacyQuestPage.tsx
