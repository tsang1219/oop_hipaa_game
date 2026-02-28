# Pitfalls Research

**Domain:** Game polish — Phaser 3.90+ / React 18 hybrid: sound, sprites, VFX, HUD, onboarding
**Researched:** 2026-02-27
**Confidence:** HIGH (Phaser-specific pitfalls verified via official docs + community issue tracker; UX pitfalls MEDIUM via multiple credible sources)

---

## Critical Pitfalls

### Pitfall 1: Audio Preloaded in Wrong Scene or at Wrong Time

**What goes wrong:**
Sound files loaded with `this.load.audio()` outside of a scene's `preload()` method fail silently or throw "Sound not found" at play time. The Loader only auto-starts during `preload()`. Calling load methods after the scene has created will require manually calling `Loader.start()` — a step developers routinely skip. In this codebase, `BootScene.preload()` already loads all PNG sprites; audio must join that same preload block or it will not exist when `ExplorationScene` or `BreachDefenseScene` calls `this.sound.play()`.

**Why it happens:**
Developers add `this.load.audio()` to `create()` or a helper function after the fact, forgetting that the Loader auto-trigger only fires once per `preload()`.

**How to avoid:**
Add all `this.load.audio('key', ['/assets/sfx.mp3', '/assets/sfx.ogg'])` calls to `BootScene.preload()` alongside the existing sprite loads. Never load audio from `create()` without also calling `this.load.start()`. Verify by logging `this.cache.audio.exists('key')` before first play.

**Warning signs:**
- Console: `"Sound Manager: sound.play - sound key not found: [key]"` on first play
- No audio error in preload, but error fires only at runtime when sound is triggered
- Audio works in isolation but fails after scene switches

**Phase to address:** Sound phase (first polish phase) — establish the full audio manifest in `BootScene.preload()` before any scene attempts playback.

---

### Pitfall 2: Browser Autoplay Policy Blocks First Sound

**What goes wrong:**
The Web Audio API starts in a suspended state. Browsers block audio playback until a user gesture occurs on the page. Calling `this.sound.play()` before the first click/tap silently fails. Chrome logs: `"The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page."` — but code continues without throwing, so developers assume audio is working.

**Why it happens:**
The game's BootScene transitions into HubWorld automatically with no user gesture before scene ready. The first `SCENE_READY` event fires, React navigates, and the game is running before the player has ever clicked anything. Any sound triggered automatically (e.g., an intro ambient) will be muted.

**How to avoid:**
Do NOT play sounds on scene `create()` or on auto-start transitions. Trigger all first sounds on explicit player interaction (button click, first keypress, first pointer down). Phaser automatically resumes AudioContext on first user gesture — trust this mechanism. For the intro modal in PrivacyQuest, do not play a sound when the modal opens; play it when the player clicks "Continue." Optionally listen to `this.sound.on(Phaser.Sound.Events.UNLOCKED, ...)` to confirm the context is active before playing ambient sounds.

**Warning signs:**
- Audio "works on second try" but not immediately after load
- Chrome DevTools shows AudioContext in `"suspended"` state
- `this.sound.locked` is `true` when checked in `create()`

**Phase to address:** Sound phase — enforce the rule that all sounds are triggered from user interaction handlers, never from scene lifecycle methods.

---

### Pitfall 3: Particle API Breaking Change (v3.60+) — `createEmitter` Removed

**What goes wrong:**
Any tutorial, StackOverflow answer, or AI suggestion written before Phaser 3.60 will show the old pattern:
```typescript
// OLD (pre-3.60) — BROKEN in Phaser 3.90:
const particles = this.add.particles('texture');
const emitter = particles.createEmitter({ ... });
```
In Phaser 3.60+, `ParticleEmitterManager` was removed entirely. `this.add.particles()` now returns a `ParticleEmitter` directly:
```typescript
// NEW (3.60+) — correct for Phaser 3.90:
const emitter = this.add.particles(x, y, 'texture', { ... });
```
Using the old API in Phaser 3.90 throws at runtime.

**Why it happens:**
The Phaser particle API was completely redesigned in 3.60. This project uses 3.90. But nearly all third-party resources (tutorials, forum posts, AI code suggestions) still show the pre-3.60 API. It is the most commonly copied wrong pattern.

**How to avoid:**
Always use `this.add.particles(x, y, textureKey, config)` — the return value is the emitter. Verify against the current Phaser 3 docs at `docs.phaser.io`. Do not copy particle code from any source without confirming it is post-3.60 syntax.

**Warning signs:**
- Runtime error: `"this.add.particles(...).createEmitter is not a function"`
- Copy-pasted particle code from forum posts or AI completions
- Any particle code referencing `ParticleEmitterManager` class

**Phase to address:** VFX phase — check API version before writing any particle code; test emitters in isolation before integration.

---

### Pitfall 4: Walk Cycle Requires a Spritesheet Loaded in BootScene — setTexture Approach Cannot Animate

**What goes wrong:**
The current `ExplorationScene` uses `setTexture('player_down')`, `setTexture('player_left')` etc. to simulate direction-facing. This switches between 4 static textures. If a walk cycle is added using `anims.create()`, it requires a spritesheet loaded via `this.load.spritesheet()` — not individual `generateTexture()` images. Attempting to create an animation that references programmatically-generated textures (one frame each) results in an animation with one frame that does not cycle.

**Why it happens:**
`generateTexture()` in `BootScene` creates single-frame named textures. Each direction is a separate texture key. `anims.create()` needs either: (a) a spritesheet where multiple frames are packed into one image, or (b) a texture atlas. There is no way to combine the four existing programmatic textures into an animation without creating a new spritesheet.

**How to avoid:**
Choose one of two paths and commit to it:
- **Path A (PNG spritesheet):** Create a 4-direction walk cycle spritesheet PNG (e.g., 4 columns × 4 rows = 16 frames at 32×32, ~128×128 total). Load it in `BootScene.preload()` as `this.load.spritesheet('player', '/assets/player.png', { frameWidth: 32, frameHeight: 32 })`. Create animations with `this.anims.create()`. The `setTexture()` calls in `ExplorationScene` become `this.player.anims.play('walk_down')`.
- **Path B (programmatic spritesheet):** Draw all frames into a single Graphics object at runtime and call `generateTexture('player_sheet', totalWidth, frameHeight)`, then treat it as a spritesheet. More complex, harder to maintain.
Path A is strongly preferred.

**Warning signs:**
- Walk cycle animation plays but shows same static frame (1-frame animation)
- `anims.create()` with `generateFrameNumbers()` logs warnings about zero frames
- `generateTexture()` is called per-direction in BootScene (current state)

**Phase to address:** Sprite phase — decide on spritesheet vs. programmatic before writing any `anims.create()` code. This is a pre-condition for animation work.

---

### Pitfall 5: EventBridge Listeners Not Removed from Singleton Across Scene Restarts

**What goes wrong:**
`eventBridge` is a singleton (`EventBridge.getInstance()`). Listeners added with `eventBridge.on(event, handler, context)` in `ExplorationScene.create()` or `BreachDefenseScene.create()` accumulate if `shutdown()` does not remove the exact matching listener. When scenes restart (player exits room, re-enters), listeners from prior scene instances stack up. Each interaction triggers the handler multiple times. The `BreachDefenseScene.onRestart()` path is especially vulnerable — it resets game data but does not re-register listeners, while the React page's `useEffect` cleanup may remove the bridge listener at an unexpected time.

**Why it happens:**
The existing `shutdown()` in both scenes does call `eventBridge.off()` correctly for scene-side listeners. The risk comes from adding new sound/VFX listeners during the polish phase without adding matching `off()` calls in `shutdown()`.

**How to avoid:**
Every `eventBridge.on(EVENT, handler, this)` added during polish must have a matching `eventBridge.off(EVENT, handler, this)` in `shutdown()`. Use the same function reference and context — not an arrow function inline (arrow functions create new references each call, making `off()` ineffective). Test by navigating in and out of a room multiple times and confirming sounds/effects fire exactly once per event.

**Warning signs:**
- Sound effects play 2× or 3× after re-entering a room
- Particle bursts fire multiple times for one enemy death after game restart
- `eventBridge.listenerCount(eventName)` grows on each scene start

**Phase to address:** Sound phase (first use of new listeners) — establish the pattern before it can proliferate.

---

## Moderate Pitfalls

### Pitfall 6: Particle Emitter Not Stopped or Destroyed After One-Shot Effect

**What goes wrong:**
`this.add.particles(x, y, key, { quantity: 20, lifespan: 500 })` creates an emitter that runs indefinitely by default (continuous mode). An enemy death effect set up this way keeps spawning particles forever from the death position, accumulating game objects per enemy death until frame rate degrades.

**Prevention:**
Always configure burst-style one-shot effects with `{ quantity: 20, lifespan: 500, stopAfter: 20 }` or call `emitter.explode(20, x, y)`. After the emitter completes, destroy it: `emitter.on('complete', () => emitter.destroy())`. For BreachDefense enemy deaths, create the emitter, call `explode()`, then destroy in the callback. In Phaser 3.60+, `emitter.explode(count, x, y)` fires a one-shot burst and then stops automatically when quantity is exhausted — but the emitter object still exists in the display list until explicitly destroyed. Set `maxParticles` as a hard cap for any continuous emitter to prevent runaway accumulation.

**Warning signs:**
- Frame rate drops gradually during a long BreachDefense session
- Chrome DevTools shows growing number of display list objects over time
- Particles still visible at enemy spawn position long after death

**Phase to address:** VFX phase — confirm destroy-after-complete for every one-shot emitter before marking VFX tasks done.

---

### Pitfall 7: React Overlay Intercepts Phaser Canvas Clicks (or Vice Versa)

**What goes wrong:**
React HTML elements positioned over the Phaser canvas (the HUD, tower panel, modal overlays) cause pointer events to fire in both the DOM and Phaser simultaneously. Clicking a React button that visually overlaps the Phaser grid triggers tower placement in the Phaser scene. This is a documented issue — z-index alone does not prevent event propagation from React to Phaser canvas.

**Prevention:**
Apply `pointer-events: none` to the Phaser canvas container div when React modals/overlays are active. In `BreachDefensePage.tsx`, set a CSS class on the `PhaserGame` wrapper based on `pageState`:
```tsx
<div className={pageState !== 'PLAYING' ? 'pointer-events-none' : ''}>
  <PhaserGame ... />
</div>
```
Conversely, when adding hover-description behavior to the tower panel, apply `pointer-events: none` to those elements to prevent hover events from reaching the Phaser canvas below.

**Warning signs:**
- Tower placed in Phaser when clicking a React button in the HUD
- Unexpected NPC interaction triggered by clicking the PrivacyQuest dialogue modal "Continue" button
- Phaser `pointerdown` fires during tutorial modal interaction

**Phase to address:** HUD phase — test every new React HUD element for click bleed-through before considering it done.

---

### Pitfall 8: `anims.create()` Called on Every Scene Restart Creates Duplicate Animation Keys

**What goes wrong:**
Animations registered with `this.anims.create({ key: 'walk_down', ... })` are stored on the global `AnimationManager` (game-level, not scene-level). If `ExplorationScene.create()` calls `anims.create()` unconditionally, the second time the scene starts (e.g., player exits room and re-enters), Phaser logs a warning and the animation may not behave correctly.

**Prevention:**
Guard all `anims.create()` calls with:
```typescript
if (!this.anims.exists('walk_down')) {
  this.anims.create({ key: 'walk_down', ... });
}
```
Or call `anims.create()` only in `BootScene.create()` once, where it will persist for the lifetime of the game. Prefer the BootScene approach — it mirrors what the codebase already does with `generateAllTextures()`.

**Warning signs:**
- Console: `"Animation with key walk_down already exists"` warning
- Walk animation plays wrong after first scene restart
- `this.anims.exists()` is not called before `this.anims.create()`

**Phase to address:** Sprite phase — all `anims.create()` calls should live in BootScene, not ExplorationScene.

---

### Pitfall 9: Tutorial Modal Teaches Controls Before Player Knows What They Need

**What goes wrong:**
A first-visit intro modal for PrivacyQuest that lists all controls (WASD, Space, ESC, click-to-move) before the player has tried anything creates cognitive overload. Per game UX research, "no one wants to read a novel before they can move their character." Players dismiss modal content without reading it, then discover controls through failure. The existing BreachDefense modal chain (12 sequential modals) is already too heavy; replicating it in PrivacyQuest would be a regression.

**Prevention:**
Limit the intro modal to one sentence of context (what the player is doing and why) and one sentence of primary control (WASD or click to move). Surface secondary controls (Space to interact, ESC to exit room) as contextual in-world prompts the first time they are relevant — e.g., show the Space prompt only when the player first reaches proximity to an NPC, not before. This matches the PROJECT.md plan: "brief intro modal + contextual in-world hints."

**Warning signs:**
- Intro modal lists more than 3 items
- Controls are listed before the player has moved
- Modal requires more than one dismiss to clear

**Phase to address:** Onboarding phase — write modal copy at the end, after testing reveals what players actually need to know first.

---

### Pitfall 10: HUD Text Positioned Relative to World Coordinates Scrolls Off-Screen

**What goes wrong:**
Phaser text objects created with default settings (`setScrollFactor(1)`) move with the camera. For PrivacyQuest rooms larger than 640×480, the camera follows the player. HUD elements (room name, interaction prompt, wave intro text) that are created at fixed world positions but not given `setScrollFactor(0)` will not stay anchored to the viewport — they'll scroll away.

**Prevention:**
All HUD text objects must call `.setScrollFactor(0)` to pin them to the screen (as `promptText` and `roomNameText` already do in `ExplorationScene`). When adding wave intro text or tooltip elements inside `BreachDefenseScene`, apply `setScrollFactor(0)` consistently. For the React HUD overlay, this is not an issue (React elements are in the DOM, not the Phaser world), but any Phaser-rendered text feedback (e.g., floating damage numbers) must use `setScrollFactor(0)` or world-position calculations.

**Warning signs:**
- HUD elements are not visible when camera has scrolled
- Room name or prompt disappears when player walks toward the edge of a large room
- Text appears at correct position on `create()` but drifts during movement

**Phase to address:** HUD and VFX phases — check `scrollFactor` for every new Phaser text object created during polish.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip OGG fallback, ship MP3 only | Simpler audio manifest | Safari on iOS may fail; OGG saves ~20% bandwidth | Never for production; acceptable for MVP if iOS not a target |
| setTexture() for player facing instead of anims.create() | No spritesheet prep needed (current state) | Cannot add walk animation frames later without refactor | Only acceptable if walk cycle is explicitly out of scope |
| Inline arrow functions as EventBridge listeners | Concise code | `off()` cannot remove them; listeners leak on restart | Never — always use named method references |
| Create particle emitters without `stopAfter` or `maxParticles` | Simpler code | Accumulating display objects degrade frame rate | Never for repeated events (enemy death); acceptable for one-time events with explicit `destroy()` |
| Add `anims.create()` inside `ExplorationScene.create()` | Feels natural, co-located with scene | Duplicate key warning on every re-entry | Never — put animations in BootScene |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Phaser SoundManager | Play sounds on `create()` or scene init | Play first sounds only on player gesture handlers (click, keydown) |
| EventBridge singleton | Arrow functions in `.on()` calls | Named methods with `this` context; matching `.off()` in `shutdown()` |
| React overlay + Phaser canvas | Assuming z-index prevents click bleed-through | Use `pointer-events: none` on canvas wrapper when overlays are active |
| Phaser particle API (3.90) | Copying `createEmitter()` pattern from pre-3.60 docs | Use `this.add.particles(x, y, key, config)` returning emitter directly |
| Phaser anims global registry | Calling `anims.create()` in per-scene `create()` | Call `anims.create()` once in BootScene; guard with `anims.exists()` check |
| Spritesheet vs generateTexture | Using `generateTexture()` frames in `anims.create()` | `generateTexture()` produces single-frame textures; load a real spritesheet for multi-frame animations |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Continuous particle emitters on enemy death | FPS drops from 60 to 40+ after 20+ enemy deaths | Use `emitter.explode()` + destroy callback, or `stopAfter: N` | After ~10 simultaneous emitters in BreachDefense mid-game |
| Uncleaned tweens on interactable items | Tweens accumulate for each room load; memory grows | `this.tweens.killAll()` on scene shutdown is automatic; verify `killTweensOf(sprite)` is called on collected items (already done in `updateCompletionState`) | Visible after 6+ room visits |
| EventBridge listener duplication | Sounds play 2×, 4× per event; grows exponentially per scene visit | Named method references + symmetric `off()` in `shutdown()` | After 2+ room re-entries |
| Phaser Graphics object retained for floor/walls | Each `room.create()` recreates all Graphics; old ones not destroyed on scene restart | ExplorationScene destroys on `shutdown()` (scenes are fully stopped); verify no static objects persist | Non-issue with `scene.stop()` but becomes a problem if `scene.sleep()` is used instead |
| React state updates on every Phaser update() | Re-renders throttle to 200ms broadcast (already implemented in BreachDefenseScene) | Keep throttle; never remove the `lastBroadcast` guard during HUD improvements | If broadcast throttle is removed, React re-renders 60× per second |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Intro modal lists all controls before player moves | Players dismiss without reading; controls are still unknown | One sentence of context, one primary control; reveal secondary controls contextually |
| Sound plays without any indication mute is possible | Players with sensitive environments have no escape | Add mute toggle or at minimum confirm there is no ambient loop before shipping sound |
| Tower hover description appears as tooltip inside Phaser canvas | React tooltips over canvas cause pointer event bleed-through | Surface tower descriptions in the existing React tower panel below the canvas, on selection — not as a canvas overlay |
| Wave intro text shown mid-combat (wrong timing) | Player is busy placing towers; misses the text | Show wave intro text before the wave timer starts; pause game state during display (already the pattern in BreachDefenseScene via PAUSED state) |
| Walk cycle animates during click-to-move path following | Path-following uses tweens (not velocity), animation timing drifts from movement | Sync animation framerate to tile traversal speed: start walk anim on path start, stop on arrival; use `repeat: -1` with `frameRate` tuned to 120ms-per-tile traversal time |

---

## "Looks Done But Isn't" Checklist

- [ ] **Sound:** Audio key exists in cache — verify `this.cache.audio.exists('key')` logs `true` at scene create time, not just that the `load.audio()` call is present.
- [ ] **Sound:** Sound plays at least once in Chrome (autoplay context unlocked) AND on iOS Safari (stricter policy) — test with a physical gesture.
- [ ] **Walk cycle:** Animation plays correct frames for each direction — confirm by holding each direction key for 2+ seconds and watching the sprite cycle.
- [ ] **Walk cycle:** Animation stops when player stops — idle frame shown, not mid-walk pose frozen.
- [ ] **Particles:** Enemy death particle burst fires exactly once per death — confirm by letting 10 enemies die and checking no accumulating emitters remain.
- [ ] **Particles:** Frame rate stays ≥55 FPS during wave 10 of BreachDefense — profile in Chrome DevTools with particles active.
- [ ] **HUD wave text:** Wave intro text disappears after player dismissal — confirm it does not persist into gameplay.
- [ ] **HUD tower description:** Hover description does not block clicks on the tower button itself — test click registration after description appears.
- [ ] **Onboarding modal:** PrivacyQuest intro modal does not re-appear on room re-entry — only on first visit, checked against localStorage.
- [ ] **EventBridge:** Navigate into PrivacyQuest room, exit, re-enter — confirm interaction sound fires exactly once, not twice.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Audio loads in wrong scene | LOW | Move `load.audio()` to `BootScene.preload()`, re-test |
| Wrong particle API (pre-3.60 syntax) | LOW | Replace `particles.createEmitter()` with `this.add.particles(x, y, key, config)` directly |
| Duplicate animation keys | LOW | Add `if (!this.anims.exists(key))` guard or move to BootScene |
| Walk cycle cannot use generateTexture frames | MEDIUM | Must create a PNG spritesheet and update BootScene loader + ExplorationScene to use `anims.play()` instead of `setTexture()` |
| EventBridge listener leak | MEDIUM | Audit all `eventBridge.on()` calls; convert arrow functions to named methods; add matching `off()` in every `shutdown()` |
| React overlay blocks Phaser input in wrong state | LOW | Add `pointer-events-none` class to PhaserGame wrapper div based on `pageState` |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Audio loaded in wrong scene | Sound (Phase 1) | `cache.audio.exists()` check in scene create |
| Autoplay policy blocks first sound | Sound (Phase 1) | Test with fresh browser profile; check `this.sound.locked` |
| Particle API breaking change | VFX (Phase 3) | No `createEmitter` calls anywhere in codebase |
| Walk cycle needs real spritesheet | Sprite (Phase 2) | Spritesheet PNG exists in BootScene.preload() before anims.create() |
| EventBridge listener duplication | Sound (Phase 1 — first new listener) | Multi-entry test: enter room, exit, re-enter; sound fires once |
| Particle emitter not destroyed after burst | VFX (Phase 3) | Profiler shows stable object count during combat |
| React overlay click bleed-through | HUD (Phase 4) | Click each HUD element; confirm no unintended Phaser interaction |
| anims.create() duplicate keys | Sprite (Phase 2) | No console warnings on room re-entry |
| Tutorial modal overload | Onboarding (Phase 5) | Modal has ≤3 items; contextual hints appear only at relevant moment |
| HUD text not setScrollFactor(0) | HUD (Phase 4) | HUD visible after camera scrolls to room edge |

---

## Sources

- [Phaser 3 Audio Docs — official](https://docs.phaser.io/phaser/concepts/audio) — HIGH confidence, current
- [Phaser 3.60 Particle Emitter changelog — GitHub](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/ParticleEmitter.md) — HIGH confidence, authoritative
- [Repeated Pointer Events with overlapping HTML — Phaser issue #6697](https://github.com/phaserjs/phaser/issues/6697) — HIGH confidence, confirmed bug + fix
- [Mouse input goes through overlay HTML — Phaser issue #4447](https://github.com/photonstorm/phaser/issues/4447) — HIGH confidence, documented behavior
- [Event listeners causing memory leaks — html5gamedevs](https://www.html5gamedevs.com/topic/40166-event-listeners-causing-memory-leaks/) — MEDIUM confidence, community-verified
- [Sounds keep looping after changing scene — html5gamedevs](https://www.html5gamedevs.com/topic/38921-sounds-keep-looping-after-changing-scene/) — MEDIUM confidence, community-verified pattern
- [Web Audio Best Practices for Phaser 3 — Ourcade](https://blog.ourcade.co/posts/2020/phaser-3-web-audio-best-practices-games/) — MEDIUM confidence, pre-3.60 but autoplay mechanics unchanged
- [Phaser 3 Animations Docs — official](https://docs.phaser.io/phaser/concepts/animations) — HIGH confidence, current
- [Game UX: Best practices for video game onboarding 2024 — Inworld](https://inworld.ai/blog/game-ux-best-practices-for-video-game-onboarding) — MEDIUM confidence, design research
- [Tutorial UX: Indie Game Onboarding — Wayline](https://www.wayline.io/blog/tutorial-ux-indie-game-onboarding) — MEDIUM confidence, design research
- [Phaser 3 ParticleEmitter docs (current)](https://docs.phaser.io/api-documentation/class/gameobjects-particles-particleemitter) — HIGH confidence, current
- Codebase analysis: `BootScene.ts`, `ExplorationScene.ts`, `BreachDefenseScene.ts`, `EventBridge.ts`, `SpriteFactory.ts` — HIGH confidence, direct inspection

---
*Pitfalls research for: Phaser 3.90 + React 18 game polish (sound, sprites, VFX, HUD, onboarding)*
*Researched: 2026-02-27*
