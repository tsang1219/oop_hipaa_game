# Phase 2: Walk Cycle Animation - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add 4-direction player walk animation in PrivacyQuest so the character animates while moving instead of gliding as a static rectangle. Player shows walk cycle when moving, idle pose when stopped. Applies to both ExplorationScene and HubWorldScene.

</domain>

<decisions>
## Implementation Decisions

### Sprite approach
- Programmatic frames using the existing Graphics API (extend `generatePlayerTexture()` in BootScene)
- No external spritesheet PNGs — keeps PrivacyQuest's art pipeline 100% programmatic
- 2 frames per direction (left-step, right-step) — 8 walk textures total across 4 directions
- Legs-only animation — upper body stays static per direction, legs alternate positions

### Idle pose
- Static freeze on the current direction's base frame when player stops moving
- Idle frame IS walk frame 1 (neutral standing) — the existing 4 direction textures become the idle/frame-1
- No breathing bob or idle animation — clean, simple, classic pixel art
- Total textures: 4 existing (idle/frame-1) + 4 new (frame-2) = 8 player textures

### Animation timing
- ~150ms per frame (~6-7 fps walk cycle)
- 2-frame alternation at this rate matches retro pixel art pace (SNES-era feel)

### Scope coverage
- Walk animation applies to BOTH keyboard (WASD/arrows) movement AND click-to-move BFS pathfinding
- Walk animation applies to BOTH HubWorldScene and ExplorationScene
- Consistent player feel regardless of input method or scene

### Claude's Discretion
- Exact pixel positions for the "legs apart" walk frame 2
- How to structure the animation (Phaser `anims.create()` vs manual frame swap in update loop)
- Direction priority during diagonal movement (existing behavior: left/right wins)
- Animation start/stop timing details

</decisions>

<specifics>
## Specific Ideas

- Classic retro walk feel — think Pokemon Red / original Zelda: simple 2-frame leg alternation
- At 32px tile size, keep the motion clear and readable — don't over-detail
- The walk should feel "alive" but not distracting from the exploration gameplay

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BootScene.generatePlayerTexture()`: Already draws 4 direction textures programmatically — extend with frame-2 variants
- `SpriteFactory.drawCharacter()`: Shared character drawing helper for NPCs — could inform player frame-2 leg positions
- Existing texture keys: `player_down`, `player_up`, `player_left`, `player_right` — add `player_down_walk`, etc.

### Established Patterns
- Programmatic texture generation: `Graphics.fillRect()` → `generateTexture(key, 32, 32)` → `destroy()`
- Idempotent texture creation: `scene.textures.exists(key)` check before generating
- Direction swapping: `this.player.setTexture('player_left')` in update loop and BFS step callback
- Player is `this.physics.add.sprite()` — supports Phaser animation system natively

### Integration Points
- `ExplorationScene.update()` lines 278-309: Keyboard movement with `setTexture()` calls — replace with animation play/stop
- `ExplorationScene.startPathMovement()` lines 396-403: BFS step direction with `setTexture()` — same replacement
- `HubWorldScene`: Has its own player movement logic — needs same animation wiring
- `BootScene.create()`: Entry point for texture generation — add frame-2 textures here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-walk-cycle-animation*
*Context gathered: 2026-02-28*
