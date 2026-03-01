# Phase 6: Character Sprites - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all 9 programmatic fillRect characters (1 player + 8 NPC types) with pre-made spritesheet PNGs from free sprite packs. Characters must have 4-direction walk cycles and idle animations. Both ExplorationScene and HubWorldScene must use the new sprites. SpriteFactory.ts character generation is bypassed but NOT deleted (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Sprite Source & Style
- Chibi / top-down RPG art style (Zelda / Pokemon proportions — oversized head, compact body)
- Free/open-source packs only (CC0, CC-BY, or GPL). No paid packs.
- Claude selects the best available pack(s) that provide 4-direction walk cycles for hospital characters
- Same visual style required across all characters, but mixing packs is acceptable if proportions and style match
- Preferred tile size: 32px, but flexible — 16px or 48px packs are fine if they look good at the rendered size
- Diverse cast: mix of skin tones across the 9 characters to reflect a real hospital

### Character Identity
- Player character: HIPAA trainee with visible badge/lanyard, distinct from all NPC types
- NPC differentiation: outfit-based (scrubs for nurse, lab coat for doctor, suit for boss, polo for IT tech, uniform for officer, etc.)
- One sprite per NPC type as baseline, with 2 variants for commonly-appearing types (nurse, doctor, staff)
- 6 named NPCs (Nurse Nina, Dr. HIPAA, Tech Tyler, Officer Knox, Receptionist Rosa, Boss Director) get unique sprites that differ from their generic type sprite
- Total character count: 1 player + 8 generic NPC types + 3 extra variants (nurse, doctor, staff) + 6 unique named NPCs = up to 18 spritesheets. Minimum viable: 1 player + 8 types = 9 spritesheets if variants/unique named NPCs can't be sourced for free.

### Animation Behavior
- Walk cycle: 3 frames per direction (idle + 2 walk frames) — standard RPG walk cycle
- Idle animation: Phaser tween-based breathing (scaleY oscillation 0.98–1.02, ~1.5s cycle). No extra sprite frames needed.
- Both player and NPCs get the idle breathing tween
- Walk animation framerate: Claude's discretion based on what looks best with the new sprites

### Claude's Discretion
- Exact sprite pack selection (within free/open-source constraint)
- Walk animation framerate (starting point: current 7fps, adjust as needed)
- Spritesheet grid format (adapt to whatever the pack provides)
- How to handle the npcTextureKey() mapping migration — can update in place or create a new mapping
- Whether to load as individual spritesheets or combine into an atlas (Phase 10 will do final atlas packing regardless)

</decisions>

<specifics>
## Specific Ideas

- The 6 named NPCs should be visually distinguishable from generic versions of their type — even small differences like hair color or an accessory count
- If the best pack doesn't have all 8 NPC types, color-swap clothing on a base sprite to fill gaps (the current approach, just with real art instead of rectangles)
- Idle breathing tween should be subtle enough that it's not distracting — if it looks weird with the pack's sprites, a very slight Y-position bob (1px) is an alternative

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SpriteFactory.ts`: Contains `npcTextureKey()`, `furnitureTextureKey()`, `objectTextureKey()` mapping functions. Character generation code will be bypassed, but mapping functions may be updated to point to new texture keys.
- `BootScene.ts`: Global animation registration pattern (lines 83-96) — creates `walk_down`, `walk_up`, `walk_left`, `walk_right` anims from `player_down` + `player_down_walk` frame pairs. This pattern needs to be extended for 3-frame walk cycles and per-NPC animations.
- BreachDefense PNG loading pattern in BootScene.preload() (lines 47-63) — `this.load.image('key', '/attached_assets/...')` is the established pattern for loading external PNGs.

### Established Patterns
- Texture key convention: `player_down`, `player_up`, `npc_receptionist`, `npc_doctor` — snake_case with prefix
- Walk animation key convention: `walk_down`, `walk_up`, `walk_left`, `walk_right`
- Idempotent texture generation: `if (scene.textures.exists(key)) continue;`
- Player direction tracking: `lastFacingTexture` stores current facing, used to set idle frame on stop

### Integration Points
- `ExplorationScene.ts:187` — calls `npcTextureKey(npc.id)` to get NPC texture for each room NPC
- `ExplorationScene.ts:233` — creates player with `'player_down'` texture key
- `ExplorationScene.ts:306,357,444` — sets `player.setTexture(lastFacingTexture)` on stop
- `ExplorationScene.ts:323-476` — plays `walk_*` animations during movement
- `HubWorldScene.ts:71` — creates NPC with `'npc_receptionist'` texture key
- `HubWorldScene.ts:87` — creates player with `'player_down'` texture key
- `HubWorldScene.ts:136-160` — plays `walk_*` animations, stops with `setTexture`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-character-sprites*
*Context gathered: 2026-03-01*
