# Project Research Summary

**Project:** PrivacyQuest + BreachDefense — Game Polish Milestone
**Domain:** Phaser 3 + React 18 hybrid educational game polish (sound, sprites, VFX, HUD, onboarding)
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

Both games (PrivacyQuest RPG exploration and BreachDefense tower defense) are functionally complete with a well-established Phaser 3 + React 18 hybrid architecture. The gap between "working prototype" and "feels like a real game" is five specific systems: sound effects, walk cycle animation, visual death feedback, HUD data surfacing, and first-play onboarding. All five are achievable using existing stack capabilities — no new npm packages, no framework changes, no architectural redesign required. The stack is already at its correct final form (Phaser 3.90 + React 18 + EventBridge), and all research confirms the built-in Phaser APIs (WebAudioSoundManager, AnimationManager, TweenManager, ParticleEmitter) are sufficient.

The recommended approach is to execute in small, targeted phases that respect the established architectural boundary: Phaser scenes own game state, audio, particles, and animation; React owns HUD text, modals, and overlays; EventBridge is the sole communication channel between them. The four parallel research streams converge on a consistent implementation strategy with clear build-order dependencies: audio assets must be preloaded in BootScene before any scene plays sound, walk frame textures must exist before AnimationFactory can register animations, and the particle texture key must exist before VFX can fire. BreachDefense HUD improvements are pure React and have no dependencies on any Phaser work, making them an independent parallel track.

The key risks are all API-level gotchas rather than architectural unknowns: Phaser's particle API broke in 3.60 (the old `createEmitter` pattern throws in 3.90), walk cycle animation requires a real spritesheet (not the existing `generateTexture` single-frame approach), EventBridge listeners leak if not cleaned up in `shutdown()`, and browser autoplay policy silently mutes any sound triggered before the first user gesture. All five risks have clear, documented mitigations. With these mitigations addressed, the polish milestone is low-risk.

## Key Findings

### Recommended Stack

The stack requires zero new dependencies. All required APIs — audio (`this.sound.play()`), particles (`this.add.particles()`), tweens (`this.tweens.add()`), and animation (`this.anims.create()`) — are Phaser 3.90 built-ins. Sound assets (8-12 SFX files) will be sourced from Kenney.nl CC0 packs (interface-sounds, digital-audio, impact-sounds) and placed in `client/public/audio/`. Sprite walk frames are the only external asset decision point: use a CC0 PNG spritesheet from OpenGameArt or Kenney RPG pack, or generate programmatic frames in SpriteFactory (slower, lower quality ceiling, but preserves visual style consistency).

**Core technologies:**
- **Phaser 3.90:** All game-side work (sound, particles, tweens, animation) — built-in APIs cover every requirement, no plugins needed
- **React 18:** All HUD overlays, intro modals, wave intro banners, tower hover descriptions — already owns this boundary, extend via state + EventBridge listeners
- **EventBridge (existing singleton):** Cross-boundary communication for onboarding triggers — use only when data must cross the Phaser/React divide; SFX and particles stay inside Phaser entirely

**Critical version constraint:** Phaser is at 3.90 and should stay there. Phaser 4 is RC4 as of May 2025 — not stable, would require significant API migration. Do not upgrade.

### Expected Features

**Must have (table stakes) — prototype-to-game gap:**
- Core SFX bundle (footstep, interact, tower-place, enemy-death, breach-alert, wave-start) — silent movement and silent tower placement feel broken to any player of these genres
- Walk cycle animation (PrivacyQuest) — a static character gliding across the floor is the single most visually jarring gap; all top-down RPGs since the SNES era animate the player
- Enemy death visual feedback (BreachDefense) — without a death effect, enemies teleport out of existence; kills must feel confirmed and satisfying
- BreachDefense HUD data surfacing (wave intro text, suggestedTowers hint, tower hover description, endMessage) — all data already exists in `constants.ts` and never reaches the player; this is display work only
- PrivacyQuest intro modal + first NPC highlight — without controls context, new players get stuck and abandon on first room entry

**Should have (differentiators and quality-of-life):**
- Tower firing recoil tween — adds combat feedback; lower priority than death feedback since projectiles already travel visually
- Item pickup feedback (PrivacyQuest) — items already bob and fade; a collect burst is incremental polish
- NPC role visual distinctiveness — doctors vs. patients currently look identical at a glance
- Dialogue choice sound feedback — ascending/descending tones for correct/incorrect HIPAA answers reinforce the educational mission
- Interaction range indicator — reduces friction when players miss the approach prompt

**Defer (v2+):**
- Background music — licensing risk, loop complexity, audio mixing; SFX-only delivers 80% of game feel at 10% the cost
- Wave threat preview panel — good educational feature but adds BreachDefense UI complexity
- HIPAA-contextualized kill text — nice narrative touch, low priority
- Tower sell/upgrade, game speed control, mobile touch, persistent save state — out of scope per PROJECT.md

### Architecture Approach

The architecture is additive — all four new systems slot into the existing structure without redesign. BootScene is the single asset loading point (audio joins existing PNG preloads there). A new `AnimationFactory.ts` mirrors `SpriteFactory.ts` exactly — pure `registerAllAnims(scene)` function called once from `BootScene.create()`. All SFX fire directly in the scene that detects the triggering event (no EventBridge relay for sound). Onboarding events are the only new EventBridge traffic: 3 new constants (`EXPLORATION_FIRST_ENTER`, `EXPLORATION_NEAR_FIRST_NPC`, `EXPLORATION_CONTROLS_HINT`).

**Major components and what changes:**
1. **BootScene** — add `load.audio()` calls + call `AnimationFactory.registerAllAnims(this)` after textures
2. **SpriteFactory** — add `particle_dot` programmatic texture (8x8 white circle, ~5 lines)
3. **AnimationFactory (new)** — `registerAllAnims(scene)`: 4 directions × 3 frames walk + 4 idle anims
4. **ExplorationScene** — replace `setTexture()` with `anims.play()`; add `this.sound.play()` calls; emit 3 new onboarding events; add `off()` calls to `shutdown()`
5. **BreachDefenseScene** — add enemy-death particle burst + `emitter.destroy()` callback; add tower-fire scale tween; add `this.sound.play()` at event trigger points
6. **PrivacyQuestPage** — add intro modal with localStorage gate; listen for onboarding EventBridge events; render first-NPC hint
7. **BreachDefensePage** — surface wave intro text, suggestedTowers, tower hover description, endMessage from existing constants (pure React, no Phaser coordination)

### Critical Pitfalls

1. **Particle API breaking change** — `this.add.particles(key).createEmitter()` was removed in Phaser 3.60 and throws in 3.90. Always use `this.add.particles(x, y, key, config)` returning the emitter directly. Most tutorials and AI suggestions show the old broken pattern — verify against current Phaser docs before writing any particle code.

2. **Walk cycle requires a real spritesheet** — `generateTexture()` creates single-frame textures; `anims.create()` referencing them produces a 1-frame animation that does not cycle. The current `setTexture()` approach cannot be extended to walk animation without a spritesheet. Commit to a spritesheet PNG loaded via `this.load.spritesheet()` in BootScene, or commit to programmatic multi-frame generation — do not try to bridge the two approaches.

3. **EventBridge listener leak on scene restart** — the singleton EventBridge accumulates listeners if `shutdown()` does not call `off()` with the exact same function reference and context. Arrow function listeners cannot be removed. All new `eventBridge.on(EVENT, handler, this)` calls added during polish must have matching `eventBridge.off(EVENT, handler, this)` in `shutdown()`. Test by entering and exiting a room 3 times; sounds should fire exactly once per event.

4. **Audio loaded outside BootScene.preload()** — the Loader auto-trigger only fires during `preload()`. `load.audio()` calls in `create()` or helper functions fail silently at play time. Add all audio to `BootScene.preload()` alongside existing image loads; verify with `this.cache.audio.exists('key')` before first play.

5. **Browser autoplay policy silently mutes first sound** — `this.sound.play()` called from scene `create()` or any auto-transition (before user gesture) will silently fail. Phaser auto-resumes the AudioContext on first user gesture — trust this and ensure the first sound call happens in a player input handler (click, keypress), not in lifecycle methods. `this.sound.locked` will be `true` until unlocked.

## Implications for Roadmap

Based on combined research, the build order has clear hard dependencies. Assets before code (audio files must exist to load). BootScene first (loads everything else). Parallel tracks after BootScene is modified (animation, particles, and BreachDefense HUD are independent). Onboarding last (depends on EventBridge constants finalized by other phases).

### Phase 1: Audio Foundation

**Rationale:** Sound is the single highest-impact change per unit of effort. All downstream sound features share one prerequisite: audio files preloaded in BootScene. Establishing the full audio manifest and playback pattern first prevents the most common pitfall (audio loaded in wrong place) from infecting every subsequent phase. All 6 table-stakes SFX are addressable in one BootScene modification pass.

**Delivers:** Footstep SFX, NPC interaction SFX, tower placement SFX, enemy death SFX, breach alert SFX, wave start SFX. Players will immediately feel the game is alive.

**Addresses:** Core SFX bundle (P1 table stakes from FEATURES.md)

**Avoids:** Audio preloaded in wrong scene (Pitfall 1), autoplay policy block (Pitfall 2), EventBridge listener leak pattern (establish named-method-reference pattern here for all subsequent phases)

**Asset pre-work:** Download Kenney Interface Sounds + Digital Audio + Impact Sounds packs; select 6-8 OGG files; convert to MP3 for Safari fallback; place in `client/public/audio/`

### Phase 2: Walk Cycle Animation (PrivacyQuest)

**Rationale:** Walk animation is the most visually jarring gap. It is architecturally isolated (BootScene texture generation + ExplorationScene playback) and has the most important pre-condition decision: PNG spritesheet vs. programmatic frames. Resolving this decision and completing it in one phase prevents partial states where animation is registered but the texture source is wrong.

**Delivers:** 4-directional walk animation playing while the player moves, idle pose when stopped. Eliminates the gliding-rectangle visual.

**Addresses:** Walk cycle animation (P1 table stakes from FEATURES.md)

**Avoids:** Walk cycle using generateTexture frames in anims.create() (Pitfall 4), duplicate animation keys on scene restart (Pitfall 8 from PITFALLS.md)

**Decision required:** Commit to spritesheet PNG (load via BootScene, better quality) or programmatic 3-frame generation (no external asset, consistent style) before writing any `anims.create()` code.

### Phase 3: Visual Effects — Enemy Death and Tower Feedback (BreachDefense)

**Rationale:** Enemy death visual is the other P1 table-stakes gap. Groups naturally with tower fire tween because both fire inside BreachDefenseScene and both require the particle_dot texture added to SpriteFactory. Doing both in the same pass avoids touching the scene twice.

**Delivers:** Enemy death particle burst (fade + explode at kill position), tower firing recoil tween (scale pulse on fire event). Kills feel confirmed; towers feel active.

**Addresses:** Enemy death visual (P1), tower firing visual (P2) from FEATURES.md

**Avoids:** Old particle API (Pitfall 3 — verify `this.add.particles(x, y, key, config)` syntax), emitter not destroyed after one-shot (Pitfall 6), performance from accumulating emitters (performance trap in PITFALLS.md)

**Technical gate:** `particle_dot` texture key must be added to SpriteFactory before any emitter can reference it.

### Phase 4: BreachDefense HUD Data Surfacing

**Rationale:** All required data is already in `constants.ts`. This phase is pure React work in `BreachDefensePage.tsx` with no Phaser coordination — it can run in parallel with Phases 2-3 if resources allow, or immediately after Phase 1. It surfaces educational content that currently never reaches the player: wave intro text, suggestedTowers hints, tower hover description, and endMessage.

**Delivers:** Wave intro banner on wave start (timed auto-dismiss), suggested tower hint in HUD panel during prep, tower description on hover/selection, wave endMessage on wave complete. Closes the gap between the rich data in constants.ts and what players actually see.

**Addresses:** Wave intro text, suggestedTowers, tower hover description, endMessage (all P1 from FEATURES.md)

**Avoids:** React overlay intercepts Phaser clicks (Pitfall 7 — apply pointer-events handling), HUD text not using setScrollFactor(0) if any Phaser text is added (Pitfall 10)

### Phase 5: PrivacyQuest Onboarding

**Rationale:** Onboarding depends on EventBridge event constants being finalized, making it a natural final phase. The intro modal and first-NPC highlight address first-room abandonment risk. This phase is last because it needs the EventBridge additions from all prior phases to be stable before adding 3 more constants.

**Delivers:** First-visit intro modal (localStorage-gated, controls context in 2 sentences max), first-NPC pulsing highlight (auto-dismisses on movement), contextual SPACE prompt when player first reaches NPC proximity.

**Addresses:** PrivacyQuest intro modal + first NPC highlight (P1 from FEATURES.md)

**Avoids:** Tutorial modal listing all controls at once (Pitfall 9 — max 3 items, one primary control), EventBridge listener leak (add off() for all 3 new event listeners in ExplorationScene shutdown)

### Phase Ordering Rationale

- Phase 1 is mandatory first because all sound work requires audio files in BootScene; establishing the preload pattern before writing playback code prevents the most common pitfall
- Phase 2 (animation) and Phase 3 (VFX) can run in parallel after Phase 1 since they touch different systems (ExplorationScene vs. BreachDefenseScene) and different asset concerns (spritesheet vs. particle texture)
- Phase 4 (HUD) has zero dependencies on Phases 2 or 3 and can begin in parallel with Phase 1 — it is pure React
- Phase 5 (onboarding) is last by convention: EventBridge constants should be stable, and writing modal copy after testing reveals what players actually need to know first produces better UX

### Research Flags

Phases with well-documented patterns (standard research-phase skip):
- **Phase 1 (Audio):** Phaser audio API is thoroughly documented; all patterns are verified; Kenney assets are known-CC0
- **Phase 3 (VFX):** Particle and tween APIs are fully documented; code examples in ARCHITECTURE.md are verified against current docs
- **Phase 4 (HUD):** Pure React display work; pattern already exists in BreachDefensePage; no new APIs

Phases that need validation during implementation:
- **Phase 2 (Walk Cycle):** The spritesheet-vs-programmatic decision needs a judgment call with the specific asset in hand. If using OpenGameArt sprites, verify directional frame coverage before committing to the PNG path — research noted some chars have incomplete directional coverage. If programmatic, 60-90 min of SpriteFactory work to get foot positions right.
- **Phase 5 (Onboarding):** Modal copy should be tested with a fresh-eyes user before finalizing. Research confirmed the pattern is correct; the content quality requires iteration.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Phaser 3.90 APIs verified against official docs; all required capabilities confirmed as built-ins; no new dependencies needed |
| Features | HIGH | Genre conventions are well-established; all P1 features verified against existing codebase constants; feature dependencies mapped |
| Architecture | HIGH | Verified against live codebase inspection; build-order dependencies explicit; patterns confirmed via official Phaser + React docs |
| Pitfalls | HIGH (Phaser), MEDIUM (UX) | All Phaser pitfalls verified via official changelogs and issue tracker; UX pitfalls from multiple credible industry sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Spritesheet format compatibility:** If using an external PNG spritesheet for the player walk cycle, the frame layout (row-per-direction, pixels per frame) must be verified on download. Some OpenGameArt assets have incomplete directional coverage or non-standard frame counts. Fallback: generate programmatic 3-frame walk cycle in SpriteFactory to preserve visual style consistency.

- **SFX selection within Kenney packs:** Research confirmed CC0 status and pack contents at a category level. Specific file selection (which footstep variant, which impact sound) requires downloading and listening to the packs. Budget 30 minutes for audio curation before BootScene implementation begins.

- **iOS Safari autoplay behavior:** Research confirms Phaser handles AudioContext unlock on first user gesture, but this was not tested on an iOS physical device. The mitigation (never play sound from lifecycle methods, always from input handlers) is correct regardless. Flag for device testing during Phase 1 verification.

- **React state update throttling during HUD improvements (Phase 4):** BreachDefenseScene already broadcasts state at 200ms throttle to prevent 60 re-renders/second. Any new HUD data (wave intro, endMessage) should piggyback on the existing broadcast or use its own EventBridge emit — do not remove the throttle guard.

## Sources

### Primary (HIGH confidence)

- Phaser 3 Audio Docs — https://docs.phaser.io/phaser/concepts/audio — WebAudioSoundManager, autoplay, format arrays
- Phaser 3 Animation Docs — https://docs.phaser.io/phaser/concepts/animations — anims.create(), sprite.play()
- Phaser ParticleEmitter API (3.80+) — https://newdocs.phaser.io/docs/3.80.0/Phaser.GameObjects.Particles.ParticleEmitter — explode(), destroy()
- Phaser 3.60 ParticleEmitter Changelog — https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/ParticleEmitter.md — ParticleEmitterManager removal confirmed
- Phaser v3.90 release announcement — https://phaser.io/news/2025/05/phaser-v390-released — current stable v3 confirmed
- Phaser 4 RC4 announcement — https://phaser.io/news/2025/05/phaser-v4-release-candidate-4 — v4 not stable, confirms staying on 3.90
- Phaser 3 + React official template — https://phaser.io/news/2024/02/official-phaser-3-and-react-template — validates EventBridge/overlay pattern
- WebAudioSoundManager API — https://docs.phaser.io/api-documentation/class/sound-webaudiosoundmanager
- Phaser pointer event bleed-through — GitHub issue #6697 + #4447 — confirmed behavior + pointer-events:none fix
- Codebase direct inspection: BootScene.ts, ExplorationScene.ts, BreachDefenseScene.ts, SpriteFactory.ts, EventBridge.ts, constants.ts — live codebase

### Secondary (MEDIUM confidence)

- Kenney Interface Sounds — https://kenney.nl/assets/interface-sounds — CC0 confirmed, specific file list requires download
- Kenney Digital Audio — https://kenney.nl/assets/digital-audio — CC0 confirmed, 60 files
- Kenney Impact Sounds — https://kenney.nl/assets/impact-sounds — CC0 confirmed, 130 files
- OpenGameArt 32x32 RPG characters — https://opengameart.org/content/32x32-rpg-character-sprites — CC0, directional coverage incomplete for some chars
- Game Developer: Game Juice design principles — industry design articles, multiple sources agree on SFX priority
- Inworld AI / Wayline: Game UX onboarding best practices — modal copy guidelines, controls-first vs. contextual reveal

---
*Research completed: 2026-02-27*
*Ready for roadmap: yes*
