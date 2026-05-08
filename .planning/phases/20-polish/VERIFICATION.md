# Phase 20 — First-Impression Polish — Verification

**Status:** SHIPPED
**Branch:** worktree-agent-a36ddbb8fbf6d3493
**Demo path verified:** Reception → Emergency Room → Break Room → Medical Records

## Requirements coverage

### FIX-01 — Player sprite renders idle frame on initial mount [DONE]
- **Root cause:** `physics.add.sprite('player_sheet', 0)` with a fresh spritesheet
  occasionally renders the raw atlas (all 12 frames at once) until the first
  `anims.play()` fires. The constructor frame argument alone wasn't enough to
  lock in the visible frame.
- **Fix:** Explicit `this.player.setFrame(0)` immediately after sprite creation
  in both ExplorationScene and HubWorldScene, plus syncing `lastFacingFrame`.
- **Files:** `client/src/phaser/scenes/ExplorationScene.ts`,
  `client/src/phaser/scenes/HubWorldScene.ts`.
- **Commit:** 5089fcd

### FIX-02 — HUD does not block room view on entry [DONE]
- **Root cause:** DepartmentBreadcrumb appeared instantly at full opacity on
  every room change, competing with RoomIntroOverlay during the first beat.
  RoomProgressHUD's existing fade was too subtle.
- **Fix:** DepartmentBreadcrumb now fades + slides in 900ms after each room
  change. RoomProgressHUD gains a 20px slide-from-right transform paired with
  its existing fade.
- **Files:** `client/src/components/DepartmentBreadcrumb.tsx`,
  `client/src/components/RoomProgressHUD.tsx`.
- **Commit:** c2047a1

### FIX-03 — Loud honk SFX on proximity dropped to proportional levels [DONE]
- **Root cause:** Three proximity-triggered audio cues were over-volumed:
  IT Office encounter `sfx_breach_alert` at 0.6, locked-door rejection
  `sfx_breach_alert` at 0.4, PHI Sorter trigger `sfx_interact` at 0.5. The
  Reception sorter trigger sits adjacent to NPCs, so a 0.5-volume cue read
  as a "honk near NPCs".
- **Fix:** Reduced to 0.35, 0.25, and 0.3 respectively. Visual feedback
  (camera shake / red flash / white flash) carries the moment; SFX is now a
  soft accent.
- **Files:** `client/src/phaser/scenes/ExplorationScene.ts`.
- **Commit:** c08b024

### FIX-04 — No regression in non-demo rooms [DONE]
- All four FIX changes apply universally (not gated by `isDemoActive()`).
  The volume reductions are still audible in full-game play (Lab, IT Office,
  hallways) — they're just no longer jarring.
- The IT Office encounter remains fully functional; only the alert volume
  was lowered. Locked-door feedback still plays the breach alert at 0.25
  with the red flash, preserving the rejection cue.
- The HUD fade-in adds polish to all rooms, not just demo rooms.
- The player sprite frame fix runs in every scene mount.

## Build / typecheck
- `npm run build` — succeeds
- `npm run check` (tsc) — clean

## Commits (in order)
1. `0801e96` — docs(20-polish): create phase plan
2. `5089fcd` — fix(20-01): FIX-01 player sprite renders idle frame on initial scene mount
3. `c2047a1` — fix(20-02): FIX-02 HUD eases in on room entry instead of blocking the view
4. `c08b024` — fix(20-03): FIX-03 lower proximity SFX volumes near NPCs and zones

## Files changed
- `client/src/components/DepartmentBreadcrumb.tsx`
- `client/src/components/RoomProgressHUD.tsx`
- `client/src/phaser/scenes/ExplorationScene.ts`
- `client/src/phaser/scenes/HubWorldScene.ts`
- `.planning/phases/20-polish/PLAN.md` (new)
- `.planning/phases/20-polish/VERIFICATION.md` (new)
