---
phase: 12-unified-navigation
plan: 03
status: complete
completed: "2026-03-28"
duration: "~10m"
commits: ["2c9a79b"]
key-files:
  modified: ["client/src/phaser/scenes/ExplorationScene.ts"]
key-decisions:
  - "Door auto-triggers on proximity (no separate key press) for smooth RPG navigation feel"
  - "Spawn offset 1 tile inward from door based on side to prevent immediate re-trigger"
  - "sfx_breach_alert used for locked door feedback (no sfx_locked asset exists)"
  - "Legacy exit glow and ESC-to-exit only active when no doors[] present (backward compat)"
---

# Phase 12 Plan 03: ExplorationScene Door System Summary

Door proximity detection, three-state visual rendering, fade transition, and correct spawn positioning in ExplorationScene.

## What Was Built

- `checkDoorProximity()`: Detects when player is within 1.5 tiles of a door
- `handleDoorInteraction()`: 300ms camera fadeOut + EXPLORATION_EXIT_ROOM emit with targetRoomId/fromDoorId
- `renderDoorStates()`: Three visual states - locked (dark overlay + [X] icon), available (pulsing blue glow), completed (green checkmark)
- Door frame graphics rendered for each door (matching existing exit door frame style)
- `onLoadRoom`: Listener that calls `scene.restart()` with new room data
- `onDoorLocked`: Camera flash (red) + sfx_breach_alert feedback
- Spawn point override via `pendingSpawnTileX/Y` when `spawnDoorId` provided in init data
- All new listeners properly removed in `shutdown()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Spawn position offset**
- **Issue:** Spawning exactly at door tile would immediately re-trigger door detection
- **Fix:** Offset spawn 1 tile inward based on door.side (left door -> x+1, right -> x-1, etc.)
- **Files modified:** ExplorationScene.ts (init method)
