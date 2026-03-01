---
phase: 03-breachdefense-visual-effects
plan: 01
subsystem: BreachDefense
tags: [vfx, particles, tweens, phaser, typescript]
dependency_graph:
  requires: []
  provides: [death-particles, tower-recoil, strong-match-flash]
  affects: [BreachDefenseScene, BootScene, constants]
tech_stack:
  added: []
  patterns:
    - "Phaser 3.60+ particle emitter: this.add.particles(x, y, key, config) + emitter.explode(n)"
    - "emitter.setDepth() for particle layer ordering (depth not in ParticleEmitterConfig)"
    - "tweens.killTweensOf(sprite) before sprite.destroy() on restart to prevent mid-animation errors"
    - "Guard dyingSprite.active before destroy in tween onComplete callback"
key_files:
  created: []
  modified:
    - client/src/phaser/scenes/BootScene.ts
    - client/src/game/breach-defense/constants.ts
    - client/src/phaser/scenes/BreachDefenseScene.ts
decisions:
  - "depth property not in ParticleEmitterConfig — set via emitter.setDepth() after construction"
  - "White particle texture tinted at emit time allows single texture for all 8 threat colors"
metrics:
  duration: "2 min"
  completed: "2026-03-01"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 3 Plan 01: BreachDefense Visual Effects Summary

**One-liner:** Phaser 3.60+ particle burst + scale-bounce tween + two-phase color flash added to BreachDefense combat for death confirmation, active tower feedback, and visible counter-relationship teaching.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add particle texture and threat color map | 282b8ab | BootScene.generateParticleTexture(), constants.THREAT_COLORS (8 types), BreachDefenseScene import |
| 2 | Death particles, tower recoil, strong-match flash | 4b04ff8 | spawnDeathParticles(), playRecoilTween(), two-phase flash logic, fade tween cleanup, onRestart tween kill |

## What Was Built

**Death Particle Burst:** When an enemy's HP reaches 0, the HP bars are destroyed immediately, then `spawnDeathParticles()` fires a `this.add.particles()` emitter with 10 particles in the threat's signature color (from `THREAT_COLORS`). The emitter uses `frequency: -1` (manual mode) + `explode(10)`. The sprite simultaneously fades + shrinks via a 300ms tween (`alpha: 0, scale: 0.3`), destroyed safely in `onComplete` with an `active` guard. The emitter self-destructs via `time.delayedCall(400ms)` with an `active` guard.

**Tower Recoil Tween:** Every time a tower fires (after `tower.lastFired = time`), `playRecoilTween(tower.sprite)` runs a 200ms scale tween: `[1.0, 1.15, 0.95, 1.0]` with `Quad.easeOut`. This gives a visible kick-and-settle effect on every shot.

**Strong-Match Color Flash:** When a projectile hits its target (`dist < CELL_SIZE * 0.2`), the existing red flash (`flashUntil = time + 120`) fires for all hits. If `proj.isStrong` is true, a second flash (`strongFlashUntil = time + 120 + 150`) sets the tower's hex color. The update loop checks both fields: red takes priority while active, then tower color, then clear.

**Restart Cleanup:** `onRestart()` now calls `this.tweens.killTweensOf(e.sprite)` before `e.sprite.destroy()` for all enemies, preventing "Cannot set property of destroyed object" errors when restart happens during a death animation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `depth` not valid in ParticleEmitterConfig**
- **Found during:** Task 2 — TypeScript compile error TS2353
- **Issue:** Plan specified `depth: 18` inside the particle config object, but Phaser 3's `ParticleEmitterConfig` type does not include a `depth` property
- **Fix:** Removed `depth` from config, added `emitter.setDepth(18)` call on the returned emitter object immediately after construction
- **Files modified:** client/src/phaser/scenes/BreachDefenseScene.ts
- **Commit:** 4b04ff8

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `emitter.setDepth(18)` not `depth` in config | TypeScript type enforcement; Phaser 3.60 ParticleEmitterConfig does not expose depth — must use the game object method |
| Single white `particle_circle` texture tinted per emitter | One asset reused for all 8 threat death colors via `tint:` config; avoids 8 separate textures |

## Self-Check: PASSED

- FOUND: client/src/phaser/scenes/BootScene.ts
- FOUND: client/src/game/breach-defense/constants.ts
- FOUND: client/src/phaser/scenes/BreachDefenseScene.ts
- FOUND: .planning/phases/03-breachdefense-visual-effects/03-01-SUMMARY.md
- FOUND commit: 282b8ab (feat(03-01): add particle texture and threat color map)
- FOUND commit: 4b04ff8 (feat(03-01): add death particles, tower recoil, and strong-match flash)
