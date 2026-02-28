# Stack Research

**Domain:** Phaser 3 + React educational game polish (sound, sprites, VFX, HUD, onboarding)
**Researched:** 2026-02-27
**Confidence:** HIGH for Phaser built-in APIs; MEDIUM for asset sources; HIGH for architecture patterns

---

## Context: What Already Exists

The stack is fixed — no new frameworks. Research focuses on the *right way to use existing tools* and *what external assets/techniques to add*.

| Already in place | Version | Notes |
|-----------------|---------|-------|
| Phaser | ^3.90.0 | Current and final v3 release (v4 RC4 in May 2025, not yet stable) |
| React | ^18.3.1 | Handles all UI overlays — dialogue, HUD, modals |
| TypeScript | 5.6.3 | Strict mode |
| Vite | ^5.4.20 | Asset serving from `client/public/` or `attached_assets/` |
| EventBridge | custom | Phaser.EventEmitter singleton for React↔Phaser communication |

---

## Recommended Stack

### Core Technologies (No Changes — Already Installed)

| Technology | Version | Purpose | Why Confirmed |
|------------|---------|---------|---------------|
| Phaser | ^3.90.0 | Sound, particles, tweens, animation | All required APIs are built-in — no plugin needed |
| React | ^18.3.1 | HUD overlays, intro modals, contextual hints | Already owns all React UI; extend in BreachDefensePage.tsx / PrivacyQuestPage.tsx |
| EventBridge | existing | React↔Phaser signal bus | Pattern validated; use for wave text, hover tooltips, hint triggers |

**No new npm packages are required for sound, particles, tweens, or animation.** Everything is in Phaser 3.90's built-in API.

---

### Supporting Libraries (Zero New Dependencies)

#### Sound — Phaser Built-in WebAudioSoundManager

**Confidence: HIGH** — Verified against official Phaser docs (docs.phaser.io/phaser/concepts/audio)

Phaser's `WebAudioSoundManager` is the default and correct choice for this project:

- Load: `this.load.audio('key', ['/sfx/sound.ogg', '/sfx/sound.mp3'])` — provide both formats for cross-browser safety
- Play (fire-and-forget): `this.sound.play('key')` — auto-manages instance lifecycle
- Play (persistent): `const sfx = this.sound.add('key'); sfx.play()` — reuse for frequent sounds
- Browser autoplay: Phaser automatically handles the AudioContext unlock on first user gesture. No manual workaround needed for Web Audio in 2025.
- Looping sounds survive scene changes — explicitly `sfx.stop()` on scene shutdown for any loop
- Load format array: Phaser selects the best-supported format automatically; OGG preferred by Firefox, MP3 preferred by Chrome/Safari

**What NOT to do:** Do not use the `audio: { disableWebAudio: true }` config option — HTML5 Audio fallback is slower and less capable for rapid SFX.

#### Particles — Phaser Built-in ParticleEmitter (v3.60+ API)

**Confidence: HIGH** — Verified against official docs and Phaser 3.80+ API docs

The particle API was redesigned in v3.60. Since this project uses 3.90, use the modern API only:

```typescript
// Burst effect at position (enemy death, tower fire flash)
const emitter = this.add.particles(x, y, 'textureKey', {
  speed: { min: 50, max: 150 },
  scale: { start: 0.5, end: 0 },
  lifespan: 400,
  quantity: 8,
  alpha: { start: 1, end: 0 },
});
emitter.explode(8, x, y); // single burst, then stop
```

```typescript
// Auto-cleanup: destroy emitter after particles die
this.time.delayedCall(600, () => emitter.destroy());
```

**What NOT to do:** Do not use `this.add.particles(key).createEmitter()` — the `ParticleEmitterManager` was removed in v3.60. That pattern is dead.

**Texture for particles:** Use a white circle generated programmatically in BootScene (1 `graphics.generateTexture` call) rather than a PNG. Tint at runtime for color variation.

#### Tweens — Phaser Built-in TweenManager

**Confidence: HIGH** — Verified against official docs (docs.phaser.io/phaser/concepts/tweens)

Use `this.tweens.add()` for:
- Tower firing flash: `{ targets: sprite, alpha: 0.3, yoyo: true, duration: 80 }`
- Projectile movement: tween `x/y` to target position
- Enemy hit flash: tween `tint` or `alpha` with yoyo

All tweens are destroyed automatically when the scene restarts. No cleanup needed for one-shot effects.

#### Animations (Walk Cycles) — Phaser Built-in AnimationManager

**Confidence: HIGH** — Verified against official docs (docs.phaser.io/phaser/concepts/animations)

Phaser's `this.anims.create()` is the correct and only approach. Animations registered with the global Animation Manager are available to all sprites in all scenes. Register once in `BootScene.create()`.

```typescript
// In BootScene.create(), after loading the spritesheet:
this.anims.create({
  key: 'player_walk_down',
  frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 2 }),
  frameRate: 8,
  repeat: -1
});

// In ExplorationScene, play on movement:
this.player.play('player_walk_down', true); // true = ignore if already playing
this.player.stop(); // when idle — shows last frame
```

**Spritesheet format:** Standard row-per-direction layout. For a 32px tile grid with 3 frames per direction (down, left, right, up), the sheet is `96x128` pixels. Phaser's `generateFrameNumbers` uses zero-indexed flat frame numbers across rows.

**What NOT to do:** Do not generate individual static textures per direction (current approach for NPCs is fine since they don't animate). For the player, migrate from 4 static textures (`player_down`, `player_left`, etc.) to a single spritesheet loaded once.

---

### Asset Sources

#### Sound Effects

| Source | URL | License | Content | Best For |
|--------|-----|---------|---------|----------|
| Kenney Interface Sounds | kenney.nl/assets/interface-sounds | CC0 | 100 OGG files — button clicks, snaps, confirms | UI SFX: modal open, choice select |
| Kenney UI Audio | kenney.nl/assets/ui-audio | CC0 | 50 SFX — switches, clicks, generic UI | Supplemental UI |
| Kenney Digital Audio | kenney.nl/assets/digital-audio | CC0 | 60 files, laser/space theme | Projectile fire, tower activation |
| Kenney Impact Sounds | kenney.nl/assets/impact-sounds | CC0 | 130 impact/foley sounds | Enemy hit, tower damage |
| OpenGameArt RPG sounds | opengameart.org/content/50-rpg-sound-effects | CC0 | 50 RPG SFX | Footsteps, NPC interaction, pick-up |

**Confidence: MEDIUM** — CC0 status confirmed from Kenney.nl page fetches. Specific file lists require downloading the packs, but Kenney's packs are consistently well-organized OGG files.

**Format guidance:** Load both OGG and MP3 per sound key. OGG is the primary (smaller, better quality); MP3 is the fallback for Safari. Kenney packs ship as OGG — convert the 8-12 needed SFX to MP3 using any free tool (e.g., ffmpeg, online converter).

**Target SFX list (8-12 files):**
- `sfx_footstep` — player walk (PrivacyQuest)
- `sfx_interact` — NPC/object interaction trigger
- `sfx_dialogue_advance` — dialogue text advance / typewriter complete
- `sfx_choice_select` — player makes a dialogue choice
- `sfx_tower_place` — tower placed on grid (BreachDefense)
- `sfx_tower_fire` — generic projectile fire (BreachDefense)
- `sfx_enemy_hit` — enemy takes damage
- `sfx_enemy_death` — enemy eliminated
- `sfx_wave_start` — wave begins
- `sfx_budget_award` — budget/stipend granted
- `sfx_ui_open` — modal opens (intro, recap, codex)
- `sfx_error` — invalid placement

#### Sprites — Player Walk Cycle

**Confidence: MEDIUM** — Sources confirmed CC0; specific frame layouts need verification on download.

**Recommended approach: use existing sources, not custom art.**

Option A (fastest — Kenney's 1-Bit Pack or RPG Pack):
- Source: kenney.nl/assets/1-bit-pack or kenney.nl/assets/rpg-urban-pack
- Pixel art style, CC0, multiple character types already sized for tiling

Option B (OpenGameArt 32x32 RPG characters):
- Source: opengameart.org/content/32x32-rpg-character-sprites
- 20 characters, CC0, 32x32 format, walk animations; note: directional coverage is incomplete for some characters — verify before committing
- Alternatively: opengameart.org/content/4-frame-walk-cycles — 4-frame walk, consistent with 8fps animation

Option C (keep programmatic, add animation frames):
- Generate 3 frames per direction (idle, step-left, step-right) via `graphics.generateTexture` in BootScene
- Lay them into a 96x128 canvas using `this.textures.addCanvas()` then `addSpriteSheet()`
- Pro: no external assets, no license management
- Con: 60-90 min dev time to get foot positions right; art quality ceiling is low

**Recommendation:** Use OpenGameArt 32x32 RPG characters or Kenney sprites if the style matches (pixel art, top-down). If character aesthetics don't match the existing NPCs (which are programmatic blue/green rectangles), Option C (programmatic frames) preserves visual consistency and is lower risk for an MVP.

---

### HUD and Onboarding — React, No New Libraries

**Confidence: HIGH** — Pattern is already working in this codebase. The HUD React components already exist; extend them.

#### HUD improvements (BreachDefensePage.tsx)

All data needed for wave intro text, suggestedTowers hints, tower hover descriptions, and endMessage already lives in `client/src/game/breach-defense/constants.ts`. Wire it to React state via EventBridge:

```typescript
// In BreachDefenseScene: emit on wave start
eventBridge.emit(BRIDGE_EVENTS.WAVE_STARTED, {
  wave: this.wave,
  introText: WAVES[this.wave - 1].intro,
  suggestedTowers: WAVES[this.wave - 1].suggestedTowers,
  endMessage: WAVES[this.wave - 1].endMessage,
});

// In BreachDefensePage.tsx: listen and display for 3-4s, then fade
```

Tower hover tooltip: React `onMouseEnter` on the tower selection panel buttons — no Phaser involvement needed.

#### Onboarding (PrivacyQuestPage.tsx)

Use localStorage to gate first-visit modal and contextual hints. Pattern already used in the codebase for progress persistence:

```typescript
const hasSeenIntro = localStorage.getItem('pq_intro_seen');
if (!hasSeenIntro) {
  setShowIntroModal(true);
  localStorage.setItem('pq_intro_seen', 'true');
}
```

For in-world hints (first NPC highlight, interaction prompt), emit from ExplorationScene via EventBridge and display as absolutely-positioned React overlays above the canvas.

**What NOT to use for onboarding:**
- Phaser text objects for tutorial copy — scaling, wrapping, and font rendering are inferior to React/HTML
- A separate Phaser "tutorial scene" — overkill; React overlay is simpler and already the pattern
- A third-party onboarding library (Shepherd.js, Intro.js) — wrong context (they target DOM elements, not canvas)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Audio | Phaser WebAudioSoundManager | Howler.js | Already have Phaser's audio; adding Howler is redundant dependency |
| Particles | Phaser `this.add.particles` | CSS animations / React | Particles need to be on the Phaser canvas layer, not DOM; React can't target canvas positions |
| Walk animation | Phaser `anims.create()` + spritesheet | CSS sprites in React | Player is a Phaser game object; must be animated in Phaser |
| HUD tooltips | React `onMouseEnter` + state | Phaser plugin (netgfx/Phaser-tooltip) | Tower panel is already React; pure React hover is simpler |
| Onboarding | React modal + localStorage | Shepherd.js, Intro.js | DOM-targeting tour libraries can't highlight canvas content; modal is sufficient |
| SFX source | Kenney.nl packs | Commissioned audio | CC0 packs are sufficient for educational MVP; pro audio not justified |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `this.add.particles(key).createEmitter()` | Removed in Phaser v3.60; throws runtime error | `this.add.particles(x, y, key, config)` — modern API |
| `ParticleEmitterManager` | Also removed in v3.60 | Direct `ParticleEmitter` from `this.add.particles()` |
| `audio: { disableWebAudio: true }` | Degrades to HTML5 Audio; slower, less capable for rapid SFX | Default WebAudio (already the default) |
| Howler.js | Redundant with Phaser's built-in; adds bundle weight | `this.sound.play()` / `this.sound.add()` |
| Phaser 4 for this milestone | RC4 as of May 2025, not stable; would require significant migration from v3 API | Phaser 3.90.0 (current, stable, final v3) |
| Background music this milestone | Looping, scene transitions, licensing complexity — out of scope per PROJECT.md | Defer to post-MVP |
| TexturePacker / external atlas tools | Unnecessary for small sprite count; generates files to manage | Programmatic textures (existing pattern) or direct PNG load |
| Separate "tutorial scene" in Phaser | Overkill; requires scene lifecycle management | React modal overlay gated by localStorage |

---

## Stack Patterns by Variant

**For sounds that play frequently (tower fire, footstep):**
- Use `this.sound.add('key')` and cache the reference — avoids creating/destroying instances per call
- Set `volume: 0.4` and `rate: 1` at creation time; call `.play()` only

**For one-shot sounds (enemy death, wave start):**
- Use `this.sound.play('key', { volume: 0.6 })` — simpler, Phaser handles cleanup

**For particle bursts (enemy death, tower hit):**
- Create emitter with `explode()` method — emits all particles once, emitter becomes inactive
- `this.time.delayedCall(500, () => emitter.destroy())` after burst to free memory

**For walk animation with existing programmatic textures:**
- If keeping programmatic player sprites: add a 2-frame leg-bob as an additional `anims.create()` using the existing `player_down` etc. textures — quick win without spritesheet
- If using external spritesheet: load in `BootScene.preload()`, register animations in `BootScene.create()`, update `ExplorationScene` to use `this.player.play()` instead of `this.player.setTexture()`

**For HUD updates from Phaser:**
- Always emit via EventBridge (existing singleton pattern) — never directly import React state setters into Phaser scenes

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| phaser@^3.90.0 | React 18, Vite 5 | No known conflicts. Phaser is a vanilla JS/TS library. |
| phaser@^3.90.0 | TypeScript 5.6 | Phaser 3.90 ships its own `@types`; no `@types/phaser` needed |
| Phaser particles v3.60+ API | phaser@^3.90.0 | Modern `this.add.particles(x, y, key, config)` API confirmed for 3.60+ |
| Audio array format | All browsers 2025 | `this.load.audio('key', ['file.ogg', 'file.mp3'])` — Chrome/Firefox/Safari confirmed |

---

## Installation

No new npm packages required. All APIs are Phaser built-ins.

```bash
# No new npm installs needed.
# Download free SFX packs from:
#   kenney.nl/assets/interface-sounds  (100 OGG, CC0)
#   kenney.nl/assets/digital-audio     (60 OGG, CC0)
#   kenney.nl/assets/impact-sounds     (130 OGG, CC0)
#
# Place in: client/public/sfx/
#
# Download sprite sheet (if using external art):
#   opengameart.org/content/32x32-rpg-character-sprites  (CC0)
# Place in: client/public/sprites/
#
# Convert needed OGG files to MP3 (for Safari fallback):
# ffmpeg -i input.ogg output.mp3
```

---

## Sources

- Official Phaser 3 Audio docs — https://docs.phaser.io/phaser/concepts/audio — HIGH confidence
- Official Phaser 3 Animation docs — https://docs.phaser.io/phaser/concepts/animations — HIGH confidence
- Phaser 3 ParticleEmitter API — https://docs.phaser.io/api-documentation/class/gameobjects-particles-particleemitter — HIGH confidence
- Phaser v3.90 release announcement — https://phaser.io/news/2025/05/phaser-v390-released — HIGH confidence (v3.90 final v3, v4 RC4 in May 2025)
- Phaser 4 RC4 announcement — https://phaser.io/news/2025/05/phaser-v4-release-candidate-4 — HIGH confidence (confirms v4 not stable)
- Kenney Interface Sounds — https://kenney.nl/assets/interface-sounds — MEDIUM confidence (CC0 confirmed, contents require download)
- Kenney Digital Audio — https://kenney.nl/assets/digital-audio — MEDIUM confidence (CC0 confirmed, 60 files)
- Kenney Impact Sounds — https://kenney.nl/assets/impact-sounds — MEDIUM confidence (CC0 confirmed, 130 files)
- OpenGameArt 32x32 RPG characters — https://opengameart.org/content/32x32-rpg-character-sprites — MEDIUM confidence (CC0 confirmed, directional coverage incomplete for some chars)
- Phaser audio format discussion — https://phaser.discourse.group/t/is-it-required-to-have-both-mp3-ogg-for-all-audio-in-a-phaser-3-web-game/13133 — MEDIUM confidence (community-verified practice)
- Phaser 3 + React official template — https://phaser.io/news/2024/02/official-phaser-3-and-react-template — HIGH confidence (validates EventBridge/overlay pattern)

---

*Stack research for: PrivacyQuest + BreachDefense game polish milestone*
*Researched: 2026-02-27*
