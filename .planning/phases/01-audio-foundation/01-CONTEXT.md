# Phase 1: Audio Foundation - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add 6-7 sound effects across both games (PrivacyQuest + BreachDefense) and floating threat-type labels on enemy death. Covers: footstep, interact/confirm, tower placement, enemy death, breach alert, wave start, and "PHISHING blocked!" floating text. No background music, no UI sounds beyond these core actions.

</domain>

<decisions>
## Implementation Decisions

### SFX Style & Tone
- Retro chiptune aesthetic — 8-bit bleeps and bloops matching the Press Start 2P font and pixel art visual style
- Each action gets a distinct, recognizable sound — players should learn the audio language (tower place sounds different from enemy death sounds different from breach alert)
- Volume varies by importance: breach alert loud, footsteps subtle, kills/interactions medium — establishes audio hierarchy
- Source files from Kenney.nl CC0 packs (Interface Sounds, Impact Sounds, Digital Audio) — pre-curated, consistent quality, no licensing concerns

### Claude's Discretion
- Footstep trigger strategy — whether to fire per tile hop (120ms during click-to-move) or on a timer interval during WASD continuous movement
- Mute toggle placement and persistence — likely a small speaker icon somewhere in the HUD, persisted to localStorage
- Kill label visual style — font size, color, animation duration, positioning relative to the death location
- Specific Kenney pack file selection for each SFX slot — Claude picks the best match from available packs

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the retro chiptune constraint.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BootScene.preload()`: Already has a loading pipeline with progress bar — audio files load here via `this.load.audio(key, [ogg, mp3])`
- `EventBridge` + `BRIDGE_EVENTS`: All game events already flow through this — sound triggers can hook into existing events or fire directly in scene code
- `SpriteFactory.ts`: Generates programmatic textures in BootScene — same pattern for generating a small particle texture for floating text

### Established Patterns
- Scene lifecycle: `preload()` → `create()` → `update()` → `shutdown()` — audio loads in preload, plays in update/event handlers
- EventBridge listener cleanup: Named methods with symmetric `off()` in `shutdown()` — any new EventBridge listeners for audio must follow this pattern
- Phaser `this.sound.play(key)` handles browser autoplay policy automatically after first user gesture

### Integration Points
- **Enemy death**: `BreachDefenseScene.ts:659-664` — enemies filtered by `hp <= 0`, then `destroy()` called. Sound + floating text trigger here before destroy.
- **Enemy breach**: `BreachDefenseScene.ts:546-553` — securityScore decremented, enemies destroyed. Breach alert sound triggers here.
- **Tower fire**: `BreachDefenseScene.ts:598-624` — projectile created when tower targets enemy. No sound trigger needed (fire is too frequent).
- **Tower placement**: `BreachDefenseScene.ts` tower placement handler — fires when user clicks valid grid cell.
- **Wave start**: Wave spawning activation point in BreachDefenseScene — wave-start cue fires once when wave begins.
- **NPC interaction**: `ExplorationScene.ts:315-316` — `triggerInteraction()` on SPACE key. Confirm sound triggers here.
- **Player movement**: WASD continuous at 160px/sec + click-to-move BFS with 120ms tile hops. Footstep triggers differ by movement mode.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-audio-foundation*
*Context gathered: 2026-02-28*
