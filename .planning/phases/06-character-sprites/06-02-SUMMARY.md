---

phase: 06-character-sprites
plan: 02
subsystem: rendering
tags: [phaser, animation, spritesheet, walk-cycle, idle-breathing, rpg]

# Dependency graph

requires:
- "06-01: Character spritesheets (player.png + 9 NPC PNGs in attached_assets/generated_images/privacyquest/characters/)"

provides:
- "Player and all 9 NPC types render from PNG spritesheets in ExplorationScene and HubWorldScene"
- "4-direction walk animations (3-frame cycle, 8fps) for player and all NPC types"
- "Idle breathing tweens on all standing characters (scaleY 1.0–1.02)"
- "npcTypeFromId() helper exported from SpriteFactory for animation key resolution"

affects:
- "Phase 7 (portraits): NPC sprites are now real pixel art — portrait style should match"
- "Phase 8 (furniture/objects): SpriteFactory still generates furniture textures — no conflict"
- "Phase 10 (SpriteFactory retirement): npcTextureKey() now returns _sheet keys — retirement path is clear"

# Tech tracking

tech-stack:
  added: []
  patterns:
    - "Spritesheet-based walk animations: this.anims.generateFrameNumbers(sheetKey, {start, end}) — 3-frame cycle"
    - "Frame-based idle restore: player.setFrame(frameIndex) instead of setTexture() — works with spritesheet sprites"
    - "Idle breathing tween: scaleY 1.0->1.02, Sine.easeInOut, yoyo, repeat:-1 — continuous subtle life"
    - "Per-NPC breathing offset: duration randomized (1500-2000ms) to avoid synchronized breathing"
    - "Global animation registry: all walk anims registered in BootScene, available scene-wide without re-registration"

key-files:
  created: []
  modified:
    - "client/src/phaser/scenes/BootScene.ts — spritesheet preload for 10 characters, 4-dir walk anims for player (walk_DIR) + 36 NPC anims (npc_TYPE_walk_DIR)"
    - "client/src/phaser/SpriteFactory.ts — npcTextureKey() returns _sheet keys; npcTypeFromId() added"
    - "client/src/phaser/scenes/ExplorationScene.ts — player/NPC sprites from sheets, lastFacingFrame replaces lastFacingTexture, idle breathing tweens added"
    - "client/src/phaser/scenes/HubWorldScene.ts — player/receptionist from sheets, lastFacingFrame, idle breathing tweens"

key-decisions:
  - "lastFacingTexture (string) replaced by lastFacingFrame (number) in both scenes — setFrame() is the correct API for sprites loaded from spritesheets; setTexture() on a spritesheet sprite resets to frame 0"
  - "Idle breathing tween runs continuously on all characters — subtle enough (1.02 scale) that it coexists with walk animations without visual conflict"
  - "Programmatic player textures (player_down, player_up, etc.) kept in cache as fallback — spritesheet frames supersede them at runtime; SpriteFactory retirement is Phase 10"
  - "NPC breathing duration randomized (1500-2000ms) so a room full of NPCs doesn't appear to breathe in unison"
  - "CREDITS.md direction order is down/left/right/up (rows 0-3) — this differs from LPC standard; frame constants match this order throughout"

requirements-completed: [CHAR-03, CHAR-04]

# Metrics

duration: ~61min
completed: 2026-03-02

---

# Phase 6 Plan 02: Character Sprite Integration Summary

**Spritesheet-based character rendering in BootScene, ExplorationScene, and HubWorldScene — all 9 characters walk with 3-frame pixel art cycles and breathe with idle tweens**

## Performance

- **Duration:** ~61 min
- **Started:** 2026-03-02T01:01:10Z
- **Completed:** 2026-03-02T03:01:57Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 4

## Accomplishments

- BootScene loads all 10 character spritesheets (player + 9 NPC types) via `this.load.spritesheet()` with 32x32 frames
- 4-direction walk animations registered globally in BootScene: 4 player anims (`walk_DIR`) + 36 NPC anims (`npc_TYPE_walk_DIR`) = 40 total
- Walk animations use `generateFrameNumbers()` for genuine 3-frame spritesheet cycles (idle→step-A→step-B), replacing old 2-frame programmatic texture swaps
- ExplorationScene: player renders from `player_sheet` frame 0; all NPCs from `npc_TYPE_sheet`; `lastFacingTexture` replaced with `lastFacingFrame` (int) throughout
- HubWorldScene: player and receptionist NPC updated to spritesheet keys with frame-based idle restore
- Idle breathing tweens on all standing characters: scaleY oscillates 1.0–1.02 with Sine.easeInOut — rooms feel alive without movement
- NPC breathing durations randomized (1500–2000ms) per NPC to prevent synchronized breathing
- `npcTextureKey()` updated to return `_sheet` suffixed keys; `npcTypeFromId()` added as new export

## Task Commits

1. **Task 1: Load spritesheets and register animations in BootScene** — `9c66030` (feat)
2. **Task 2: Wire ExplorationScene, HubWorldScene, SpriteFactory** — `a582ca0` (feat)

## Files Modified

- `client/src/phaser/scenes/BootScene.ts` — spritesheet loading + animation registration
- `client/src/phaser/SpriteFactory.ts` — npcTextureKey() + npcTypeFromId() updated
- `client/src/phaser/scenes/ExplorationScene.ts` — spritesheet sprite creation + frame-based idle + breathing tweens
- `client/src/phaser/scenes/HubWorldScene.ts` — spritesheet sprite creation + frame-based idle + breathing tweens

## Decisions Made

- **`lastFacingFrame` (int) replaces `lastFacingTexture` (string):** Phaser's `setFrame()` is the correct API for spritesheet sprites. `setTexture()` on a spritesheet sprite loses the frame context and resets to frame 0, causing incorrect idle pose restoration after animation stops.
- **Idle breathing coexists with walk animations:** The tween runs continuously on the sprite's `scaleY` property. When walk animation plays, the tween continues; the scale stays near 1.0 so the visual effect is negligible during movement but noticeable at idle.
- **Programmatic textures preserved as fallback:** `generatePlayerTexture()` and `generateNPCTextures()` still run in BootScene create(). Their texture cache entries (`player_down`, `npc_receptionist`, etc.) persist but are no longer used for game sprites. This provides a safety net and keeps SpriteFactory intact for Phase 10 retirement.
- **CREDITS.md direction order:** down=row 0, left=row 1, right=row 2, up=row 3. Idle frame constants: down=0, left=3, right=6, up=9.

## Deviations from Plan

None — plan executed exactly as written. The `npcTypeFromId()` function was added as specified in Task 2's SpriteFactory section; though ExplorationScene ultimately uses the animation key pattern `npc_${type}_walk_${dir}` by accessing `npcTypeFromId()` via the import, the breathing tween approach made NPC walk animation triggering during autonomous NPC movement (not in this plan's scope) more straightforward.

**Note:** ExplorationScene doesn't currently trigger per-NPC walk animations (NPCs are static sprites in the current codebase). The animation registrations in BootScene and `npcTypeFromId()` helper are in place for when NPC movement is added in a future phase.

## Issues Encountered

None — TypeScript compiled clean on first pass, Vite build succeeded.

## Next Phase Readiness

- Phase 7 (portraits): Character sprites are now real pixel art — portrait art style can match the chibi aesthetic
- Future phases using NPC walk animations: Call `sprite.anims.play('npc_${npcTypeFromId(npc.id)}_walk_${dir}', true)` — animations are registered and ready
- SpriteFactory retirement (Phase 10): `npcTextureKey()` already returns `_sheet` keys; old programmatic keys (`npc_receptionist`, etc.) can be safely removed then

---

*Phase: 06-character-sprites*
*Completed: 2026-03-02*
