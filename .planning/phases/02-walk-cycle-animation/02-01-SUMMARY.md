---
phase: 02-walk-cycle-animation
plan: 01
subsystem: player-animation
tags: [phaser, animation, sprites, walk-cycle, ux]
dependency_graph:
  requires: []
  provides: [walk_down, walk_up, walk_left, walk_right]
  affects: [BootScene, HubWorldScene, ExplorationScene]
tech_stack:
  added: []
  patterns: [phaser-global-anims, two-frame-walk-cycle, programmatic-textures]
key_files:
  created: []
  modified:
    - client/src/phaser/scenes/BootScene.ts
    - client/src/phaser/scenes/HubWorldScene.ts
    - client/src/phaser/scenes/ExplorationScene.ts
decisions:
  - "Legs-only animation: upper body stays static, only pants/shoes move — cleaner retro look at 32px scale"
  - "anims registered globally in BootScene so walk_down/up/left/right are available in all scenes without re-registration"
  - "ignoreIfPlaying=true on all anims.play() calls prevents animation restart jitter on held keys"
  - "lastFacingTexture field in each scene restores correct idle frame after animation stop"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-01"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 02 Plan 01: Walk Cycle Animation Summary

2-frame programmatic walk cycle for the PrivacyQuest player — idle textures become frame-1 of each directional animation, new walk-frame-2 textures alter only the legs for a retro SNES-style stepping motion at 7fps.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Generate frame-2 walk textures and register walk animations in BootScene | 47c600e | client/src/phaser/scenes/BootScene.ts |
| 2 | Wire walk animation play/stop in HubWorldScene and ExplorationScene | 1fb3856 | client/src/phaser/scenes/HubWorldScene.ts, client/src/phaser/scenes/ExplorationScene.ts |

## What Was Built

### BootScene — Walk Frame Textures + Global Animation Registry

Added 4 new walk-frame-2 textures to `generatePlayerTexture()`:
- `player_down_walk`: front view — left leg forward (shifted left/up), right leg back (shifted right/down)
- `player_up_walk`: back view — same leg stagger, no eyes visible (matches idle)
- `player_left_walk`: side view — front leg offset left toward travel direction, back leg offset right
- `player_right_walk`: side view — same but mirrored (front leg offset right, back left)

All textures use `textures.exists()` idempotency guard. Upper body pixels are copied exactly from the corresponding idle frame — only pants (0x2c3e50) and shoes (0x8b4513) positions change.

Registered 4 global Phaser animations at end of `create()` before `scene.start('HubWorld')`:
```typescript
const WALK_DIRS = ['down', 'up', 'left', 'right'] as const;
for (const dir of WALK_DIRS) {
  if (!this.anims.exists(`walk_${dir}`)) {
    this.anims.create({ key: `walk_${dir}`, frames: [{key:`player_${dir}`},{key:`player_${dir}_walk`}], frameRate: 7, repeat: -1 });
  }
}
```

Global animation registration means HubWorldScene and ExplorationScene just call `anims.play()` — no re-registration needed per scene.

### HubWorldScene — Keyboard Walk Animation

Added `private lastFacingTexture = 'player_down'` class field. Replaced all `setTexture()` movement calls with `anims.play('walk_X', true)`. Added idle stop block when no keys pressed:
```typescript
if (!left && !right && !up && !down) {
  this.player.anims.stop();
  this.player.setTexture(this.lastFacingTexture);
}
```

Diagonal priority preserved: left/right wins over up/down (existing behavior unchanged).

### ExplorationScene — Keyboard + BFS Walk Animation

Same keyboard movement changes as HubWorldScene. Additional changes:

**Pause block**: Added animation stop before early return to ensure player freezes when dialogue opens:
```typescript
if (this.paused) {
  pauseBody.setVelocity(0);
  this.player.anims.stop();
  this.player.setTexture(this.lastFacingTexture);
  return;
}
```

**BFS pathfinding**: Replaced directional `setTexture()` calls with `anims.play()` per step. Added arrival stop at path completion (before pending interaction trigger):
```typescript
this.player.anims.stop();
this.player.setTexture(this.lastFacingTexture);
```

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit` — no errors
- Build: `npm run build` — succeeds in 6.83s (chunk size warning is pre-existing, not caused by this plan)

## Self-Check: PASSED

- FOUND: client/src/phaser/scenes/BootScene.ts
- FOUND: client/src/phaser/scenes/HubWorldScene.ts
- FOUND: client/src/phaser/scenes/ExplorationScene.ts
- FOUND: .planning/phases/02-walk-cycle-animation/02-01-SUMMARY.md
- FOUND commit: 47c600e (Task 1)
- FOUND commit: 1fb3856 (Task 2)
