# Phase 1: Audio Foundation - Research

**Researched:** 2026-02-28
**Domain:** Phaser 3 Sound Manager, Kenney CC0 audio assets, floating text tweens
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Retro chiptune aesthetic — 8-bit bleeps and bloops matching the Press Start 2P font and pixel art visual style
- Each action gets a distinct, recognizable sound — players learn the audio language
- Volume hierarchy: breach alert loud, footsteps subtle, kills/interactions medium
- Source files from Kenney.nl CC0 packs (Interface Sounds, Impact Sounds, Digital Audio) — pre-curated, consistent quality, no licensing concerns

### Claude's Discretion
- Footstep trigger strategy — whether to fire per tile hop (120ms during click-to-move) or on a timer interval during WASD continuous movement
- Mute toggle placement and persistence — likely a small speaker icon somewhere in the HUD, persisted to localStorage
- Kill label visual style — font size, color, animation duration, positioning relative to the death location
- Specific Kenney pack file selection for each SFX slot — Claude picks the best match from available packs

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SFX-01 | Player hears footstep sound when moving in PrivacyQuest | Phaser SoundManager, WASD/BFS movement hooks in ExplorationScene |
| SFX-02 | Player hears confirm/interact sound when talking to NPCs or collecting items | `triggerInteraction()` at line 315 in ExplorationScene — direct `this.sound.play()` call |
| SFX-03 | Player hears placement sound when placing a tower in BreachDefense | `placeTowerAt()` at line 281 in BreachDefenseScene — direct `this.sound.play()` call |
| SFX-04 | Player hears death sound when an enemy is destroyed in BreachDefense | Dead enemy loop at lines 659-664 in BreachDefenseScene — play sound before `destroy()` |
| SFX-05 | Player hears breach alert when an enemy reaches the end | Breach detection at lines 546-553 in BreachDefenseScene — throttle to once per breach event |
| SFX-06 | Player hears wave start cue when a new wave begins | `onDismissTutorial()` and wave auto-start branch at lines 241-247, 466-468 |
| SFX-07 | Floating threat type label appears on enemy death ("PHISHING blocked!") | Phaser `this.add.text()` + `this.tweens.add()` pattern, fire alongside death sound |
</phase_requirements>

---

## Summary

This phase adds 6-7 SFX to two Phaser scenes plus floating kill text for enemy deaths in BreachDefense. All sound work happens inside Phaser scenes — no React components need changing. Audio files are loaded once in `BootScene.preload()` alongside the existing image pipeline, and played with `this.sound.play(key, config)` at specific integration points that are already identified in the codebase.

The critical constraint is browser autoplay policy: Phaser 3 handles this automatically by queuing play calls that arrive before the first user gesture. The lock clears on the first pointer or keyboard event — both games already receive these during normal play, so no special unlock logic is needed. The mute toggle is the only new React surface: a small button that calls `this.sound.setMute(true/false)` on the game instance and persists state to `localStorage`.

Floating kill text (SFX-07 is misnamed in REQUIREMENTS.md as a sound requirement — it's actually a visual label) uses `this.add.text()` + a `tweens.add()` that animates `y` upward and `alpha` to 0, with `onComplete` destroying the text object. No plugin needed.

**Primary recommendation:** Load all audio in `BootScene.preload()`, play via `this.sound.play(key, { volume })` at the identified integration points in each scene, use a `lastFootstepTime` timestamp to throttle WASD footsteps, and fire footsteps per tile hop during click-to-move.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 Sound Manager | 3.90.0 (already installed) | Load, play, mute, volume control | Built into Phaser — no additional install |
| Kenney Interface Sounds | CC0 (download) | Confirm, interact, placement, toggle sounds | 106 OGG files with labeled names (confirmation_001.ogg, drop_001.ogg, select_001.ogg) |
| Kenney Impact Sounds | CC0 (download) | Footsteps (20 variants), enemy death impacts | carpet/concrete/wood footstep variants; impactGeneric files for death |
| Kenney Digital Audio | CC0 (download) | Wave start cue, breach alert | powerUp1-12.ogg (wave start), phaserDown/error tones (breach alert) |
| Kenney Retro Sounds 2 | CC0 (download) | Supplemental retro chiptune hits | hit1-5.ogg for death; error1-5.ogg for breach; pickup1-5.ogg via Retro Sounds 1 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Phaser Tweens | (built-in 3.90) | Floating text animation (SFX-07) | Kill label y+alpha tween onComplete destroy |
| localStorage | browser API | Mute state persistence | Read on React HUD mount, write on toggle |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kenney packs | OpenGameArt, freesound.org | Inconsistent quality, mixed licenses, no curated retro pack |
| Kenney OGG | Web Audio API custom synthesis | Significant complexity, no visual studio needed, but 10x more code |
| `this.sound.play()` per event | HTML5 Audio element | Loses Phaser's autoplay unlock handling and mute integration |

**Installation:**
```bash
# No npm install needed — Phaser 3.90 is already in package.json.
# Audio files: manual download from kenney.nl or gamesounds.xyz, place in /attached_assets/audio/
```

---

## Architecture Patterns

### Recommended Project Structure
```
attached_assets/
└── audio/
    ├── sfx_footstep.ogg         # Impact Sounds: footstep_carpet_000.ogg (subtle)
    ├── sfx_interact.ogg          # Interface Sounds: confirmation_001.ogg (medium)
    ├── sfx_tower_place.ogg       # Interface Sounds: drop_001.ogg (medium)
    ├── sfx_enemy_death.ogg       # Retro Sounds 2: hit1.ogg (medium)
    ├── sfx_breach_alert.ogg      # Retro Sounds 2: error1.ogg OR Digital Audio: phaserDown1.ogg (loud)
    └── sfx_wave_start.ogg        # Digital Audio: powerUp1.ogg (medium-loud)

client/src/phaser/scenes/
├── BootScene.ts                  # Add this.load.audio() calls in preload()
├── ExplorationScene.ts           # Add footstep + interact sound triggers
└── BreachDefenseScene.ts         # Add placement, death, breach, wave-start triggers
```

### Pattern 1: Loading Audio in BootScene

**What:** Register audio files alongside existing image loads in `preload()`.
**When to use:** All game audio — loaded once, available across all scenes.

```typescript
// BootScene.ts preload() — add after existing image loads
// Source: https://docs.phaser.io/phaser/concepts/audio
this.load.audio('sfx_footstep',    '/attached_assets/audio/sfx_footstep.ogg');
this.load.audio('sfx_interact',    '/attached_assets/audio/sfx_interact.ogg');
this.load.audio('sfx_tower_place', '/attached_assets/audio/sfx_tower_place.ogg');
this.load.audio('sfx_enemy_death', '/attached_assets/audio/sfx_enemy_death.ogg');
this.load.audio('sfx_breach_alert','/attached_assets/audio/sfx_breach_alert.ogg');
this.load.audio('sfx_wave_start',  '/attached_assets/audio/sfx_wave_start.ogg');
```

### Pattern 2: Playing SFX at Events (One-Shot)

**What:** `this.sound.play(key, config)` auto-destroys after playback. Use for all SFX.
**When to use:** Any fire-and-forget sound effect.

```typescript
// Source: https://docs.phaser.io/phaser/concepts/audio
// Footstep (subtle)
this.sound.play('sfx_footstep', { volume: 0.25 });

// Interact/confirm (medium)
this.sound.play('sfx_interact', { volume: 0.55 });

// Tower placement (medium)
this.sound.play('sfx_tower_place', { volume: 0.5 });

// Enemy death (medium)
this.sound.play('sfx_enemy_death', { volume: 0.6 });

// Breach alert (loud)
this.sound.play('sfx_breach_alert', { volume: 0.85 });

// Wave start (medium-loud)
this.sound.play('sfx_wave_start', { volume: 0.7 });
```

### Pattern 3: Footstep Throttle Strategy

**What:** Two movement modes require different footstep strategies:
- **WASD continuous** (160px/sec): Use timestamp throttle in `update()` — fire every ~350ms while any direction key is held.
- **Click-to-move BFS** (120ms hops): Fire exactly once per `step()` call in `startPathMovement()`.

**When to use:** Prevents sound spam while keeping footstep rhythm natural.

```typescript
// ExplorationScene — class field
private lastFootstepTime = 0;

// In update(), WASD branch:
const isMoving = left || right || up || down;
if (isMoving && this.time.now - this.lastFootstepTime > 350) {
  this.sound.play('sfx_footstep', { volume: 0.25 });
  this.lastFootstepTime = this.time.now;
}

// In startPathMovement() step() callback — add one line:
this.sound.play('sfx_footstep', { volume: 0.25 });
// (fires once per tile hop, 120ms intervals — natural rhythm)
```

### Pattern 4: Floating Kill Label (SFX-07)

**What:** Create a text object at the enemy's death position, tween it upward while fading out, destroy on complete.
**When to use:** For each dead enemy in the `deadEnemies` loop before `destroy()`.

```typescript
// Source: https://docs.phaser.io/phaser/concepts/tweens
// In BreachDefenseScene, inside the "Remove dead enemies" loop:
for (const e of deadEnemies) {
  // Play death sound
  this.sound.play('sfx_enemy_death', { volume: 0.6 });

  // Floating label
  const label = this.add.text(e.sprite.x, e.sprite.y - 20, `${e.type} blocked!`, {
    fontFamily: '"Press Start 2P"',
    fontSize: '7px',
    color: '#ff4444',
    stroke: '#000000',
    strokeThickness: 2,
  }).setDepth(30).setOrigin(0.5);

  this.tweens.add({
    targets: label,
    y: label.y - 40,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.easeOut',
    onComplete: () => { label.destroy(); }
  });

  e.sprite.destroy();
  e.hpBarBg.destroy();
  e.hpBarFill.destroy();
}
```

### Pattern 5: Mute Toggle (React HUD + localStorage)

**What:** Speaker icon button in the HUD calls `game.sound.setMute()` and writes to localStorage.
**When to use:** Placed in `BreachDefensePage.tsx` HUD div and `PrivacyQuestPage.tsx` overlay area.

```typescript
// React component — read on mount
const [muted, setMuted] = useState(() => {
  return localStorage.getItem('sfx_muted') === 'true';
});

// Apply on mount and on change
useEffect(() => {
  const game = phaserGameRef.current; // get Phaser.Game instance
  if (game?.sound) {
    game.sound.setMute(muted);
  }
  localStorage.setItem('sfx_muted', String(muted));
}, [muted]);

// Button
<button onClick={() => setMuted(m => !m)}>
  {muted ? '🔇' : '🔊'}
</button>
```

**Note:** The `PhaserGame.tsx` component already manages the Phaser.Game instance — confirm it exposes a ref that React HUD components can access, or add a EventBridge-based mute event.

### Pattern 6: Breach Alert Throttle

**What:** Multiple enemies can breach in the same frame. Fire the alert sound only once per breach event, not once per breaching enemy.

```typescript
// In BreachDefenseScene, the breach detection block (lines 546-553):
if (breaching.length > 0) {
  this.securityScore = Math.max(0, this.securityScore - breaching.length * 20);
  this.sound.play('sfx_breach_alert', { volume: 0.85 }); // ONE call for the batch
  for (const enemy of breaching) {
    enemy.sprite.destroy();
    enemy.hpBarBg.destroy();
    enemy.hpBarFill.destroy();
  }
  // ...
}
```

### Pattern 7: Wave Start Sound

**What:** Fire the wave start cue at the exact moment the first enemy begins spawning — when `waveState.active` transitions to `true`.

Two locations where waves activate:
1. `onDismissTutorial()` — sets `waveState.active = true`
2. Auto-start branch in update() `else` clause at line 467 — sets `waveState.active = true`

```typescript
// Helper method to call at both activation points:
private activateWave() {
  this.waveState.active = true;
  this.sound.play('sfx_wave_start', { volume: 0.7 });
}
```

### Anti-Patterns to Avoid

- **Playing sounds in `update()` without throttling:** Audio is called every frame (60fps). Even a guarded `if (condition) this.sound.play()` must be throttled with a timestamp or a one-shot flag.
- **Using `this.sound.add(key)` for SFX:** `add()` creates persistent sound objects. For fire-and-forget SFX, `this.sound.play(key, config)` is correct — it self-destructs on completion.
- **EventBridge for in-scene sounds:** SFX triggered by events that already live in the scene (enemy death, tower placement) should call `this.sound.play()` directly. EventBridge is only needed when React needs to trigger a sound in a Phaser scene (e.g., mute toggle).
- **Loading audio in ExplorationScene or BreachDefenseScene preload():** Causes redundant loads on scene restart. Load once in BootScene.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio format compatibility | OGG→MP3 converter, custom loader | `this.load.audio(key, ['file.ogg'])` | Phaser handles format detection; OGG works in Chrome/FF; Safari needs MP3 fallback if targeting Safari |
| Autoplay unlock screen | Custom "click to start" overlay | Phaser's built-in lock/unlock | Phaser queues play calls and fires them after first user gesture automatically |
| Sound pooling | Object pool for SFX instances | `this.sound.play()` (auto-pool) | Phaser Sound Manager pools sounds internally for `play()` calls |
| Floating text animation | Custom timer + position updates | `this.tweens.add()` with y + alpha | Tweens handle easing, cleanup, and onComplete callbacks |

**Key insight:** Phaser's Sound Manager is a complete audio engine. The entire phase requires zero npm installs and zero custom audio infrastructure.

---

## Common Pitfalls

### Pitfall 1: OGG-Only Files, Safari Broken
**What goes wrong:** Audio files load in Chrome/Firefox but are silent in Safari. Safari does not support OGG.
**Why it happens:** Kenney packs ship OGG only. Safari requires MP3 or AAC.
**How to avoid:** Either (a) convert OGG to MP3 using ffmpeg and provide both: `this.load.audio(key, ['file.ogg', 'file.mp3'])`, or (b) accept Safari breakage since the target is desktop Chrome/FF for an educational game.
**Warning signs:** Silent audio on macOS Safari or iOS.

Kenney's knowledge base confirms OGG→MP3 conversion: https://kenney.nl/knowledge-base/general/convert-ogg-files-to-other-audio-formats

### Pitfall 2: Footstep Sound Spam
**What goes wrong:** WASD movement fires 60 `sound.play()` calls per second, creating a buzzing, clicking noise instead of rhythm.
**Why it happens:** `update()` runs every frame; no throttle guard on sound calls.
**How to avoid:** Use `lastFootstepTime` timestamp: only fire if `this.time.now - this.lastFootstepTime > 350`.
**Warning signs:** Continuous audio smear instead of distinct steps.

### Pitfall 3: Breach Alert Firing Once Per Enemy Per Frame
**What goes wrong:** 5 enemies breach simultaneously → 5 `sfx_breach_alert` plays → ear-splitting stack of sounds.
**Why it happens:** `breaching.length` loop fires multiple times before the throttle check.
**How to avoid:** Play breach alert ONCE outside the enemy loop: `if (breaching.length > 0) { this.sound.play(...); for (const e of breaching) { ... } }`.
**Warning signs:** Distorted audio burst on mass breach events.

### Pitfall 4: Kill Label Memory Leak
**What goes wrong:** Hundreds of enemies die over a session → `this.add.text()` objects accumulate and are never destroyed → performance degrades.
**Why it happens:** Forgetting to call `label.destroy()` in the tween's `onComplete`.
**How to avoid:** Always pass `onComplete: () => { label.destroy(); }` in the tween config.
**Warning signs:** FPS drops in later waves; memory usage growing in devtools.

### Pitfall 5: Audio Loaded in Wrong Scene
**What goes wrong:** Audio loaded in ExplorationScene's `preload()` throws "file not found" or "texture already loaded" errors when the scene restarts (e.g., entering a room, leaving, entering again).
**Why it happens:** Scene restarts call `preload()` again, trying to re-load already-cached keys.
**How to avoid:** Load all audio in `BootScene.preload()` which runs exactly once. Audio loaded in Boot persists in the global cache.
**Warning signs:** Console errors `[Loader] Audio key already exists in cache`.

### Pitfall 6: Mute Toggle Only Applies to One Scene
**What goes wrong:** Mute button in BreachDefensePage HUD doesn't affect ExplorationScene sounds.
**Why it happens:** `this.sound` is a scene-level accessor, but `this.sound.setMute()` sets the global Sound Manager — this is actually fine. Problem occurs if different pages create separate Phaser.Game instances.
**How to avoid:** Confirm there is only ONE Phaser.Game instance (there is — see `PhaserGame.tsx`). Access the game's sound manager via `game.sound.setMute()`.
**Warning signs:** Mute toggle only silences current scene.

### Pitfall 7: Wave Start Sound Fires Twice
**What goes wrong:** `sfx_wave_start` plays twice because `onDismissTutorial()` AND the auto-start branch both set `waveState.active = true`.
**Why it happens:** Two independent code paths activate waves.
**How to avoid:** Extract an `activateWave()` helper that sets the flag AND plays the sound — both paths call this one method.
**Warning signs:** Double wave-start sound on non-tutorial waves.

---

## Code Examples

### Loading Audio in BootScene
```typescript
// Source: https://docs.phaser.io/phaser/concepts/audio
// Add to preload() in BootScene.ts, after existing this.load.image() calls
this.load.audio('sfx_footstep',     '/attached_assets/audio/sfx_footstep.ogg');
this.load.audio('sfx_interact',     '/attached_assets/audio/sfx_interact.ogg');
this.load.audio('sfx_tower_place',  '/attached_assets/audio/sfx_tower_place.ogg');
this.load.audio('sfx_enemy_death',  '/attached_assets/audio/sfx_enemy_death.ogg');
this.load.audio('sfx_breach_alert', '/attached_assets/audio/sfx_breach_alert.ogg');
this.load.audio('sfx_wave_start',   '/attached_assets/audio/sfx_wave_start.ogg');
```

### ExplorationScene: Footstep (WASD + Click-to-Move)
```typescript
// Source: ExplorationScene.ts update() and startPathMovement()

// Add to class fields:
private lastFootstepTime = 0;

// In update(), after computing left/right/up/down booleans:
const isMoving = left || right || up || down;
if (isMoving && !this.paused && this.time.now - this.lastFootstepTime > 350) {
  this.sound.play('sfx_footstep', { volume: 0.25 });
  this.lastFootstepTime = this.time.now;
}

// In startPathMovement() step() function, at the start:
this.sound.play('sfx_footstep', { volume: 0.25 });
this.lastFootstepTime = this.time.now;
```

### ExplorationScene: Interact/Confirm
```typescript
// Source: ExplorationScene.ts triggerInteraction() at line ~453
// Add as first line in triggerInteraction():
this.sound.play('sfx_interact', { volume: 0.55 });
```

### BreachDefenseScene: Tower Placement
```typescript
// Source: BreachDefenseScene.ts placeTowerAt() at line ~311, after this.towers.push(tower):
this.sound.play('sfx_tower_place', { volume: 0.5 });
```

### BreachDefenseScene: Enemy Death + Floating Label
```typescript
// Source: BreachDefenseScene.ts lines 658-665, replace the deadEnemies loop:
const deadEnemies = this.enemies.filter(e => e.hp <= 0);
for (const e of deadEnemies) {
  this.sound.play('sfx_enemy_death', { volume: 0.6 });

  const label = this.add.text(e.sprite.x, e.sprite.y - 20, `${e.type} blocked!`, {
    fontFamily: '"Press Start 2P"',
    fontSize: '7px',
    color: '#ffff44',
    stroke: '#000000',
    strokeThickness: 2,
  }).setDepth(30).setOrigin(0.5);

  this.tweens.add({
    targets: label,
    y: label.y - 44,
    alpha: 0,
    duration: 900,
    ease: 'Cubic.easeOut',
    onComplete: () => { label.destroy(); }
  });

  e.sprite.destroy();
  e.hpBarBg.destroy();
  e.hpBarFill.destroy();
}
this.enemies = this.enemies.filter(e => e.hp > 0);
```

### BreachDefenseScene: Breach Alert
```typescript
// Source: BreachDefenseScene.ts lines 546-563, add sound call:
if (breaching.length > 0) {
  this.securityScore = Math.max(0, this.securityScore - breaching.length * 20);
  this.sound.play('sfx_breach_alert', { volume: 0.85 }); // throttled by game logic
  for (const enemy of breaching) {
    enemy.sprite.destroy();
    enemy.hpBarBg.destroy();
    enemy.hpBarFill.destroy();
  }
  // ...
}
```

### BreachDefenseScene: Wave Start (Unified Activation)
```typescript
// New private method to replace both waveState.active = true sites:
private activateWave() {
  this.waveState.active = true;
  this.sound.play('sfx_wave_start', { volume: 0.7 });
}

// In onDismissTutorial() replace:
//   this.waveState.active = true;
// with:
//   this.activateWave();

// In update() wave complete auto-start branch replace:
//   this.waveState.active = true;
// with:
//   this.activateWave();
```

---

## Specific Kenney File Recommendations

Based on the directory listings from gamesounds.xyz, here are the recommended source files for each SFX slot:

| SFX Slot | Recommended File | Pack | Rationale |
|----------|-----------------|------|-----------|
| sfx_footstep | `footstep_carpet_000.ogg` | Impact Sounds | Carpet = soft, subtle — hospital floor feeling. 4 variants available if randomization wanted later. |
| sfx_interact | `confirmation_001.ogg` | Interface Sounds | Named exactly right. Confirmation tone matches "I talked to NPC" semantics. |
| sfx_tower_place | `drop_001.ogg` | Interface Sounds | "Drop" = placing an object. Short, satisfying click. |
| sfx_enemy_death | `hit1.ogg` | Retro Sounds 2 | Chiptune hit — distinct from other SFX, medium energy. |
| sfx_breach_alert | `error1.ogg` | Retro Sounds 2 | Retro error tone = alarm feeling. Alternatively `phaserDown1.ogg` from Digital Audio for a sweeping down-pitch effect. |
| sfx_wave_start | `powerUp1.ogg` | Digital Audio | Ascending power-up tone = "wave incoming" energy. |

---

## Static Asset Delivery

Audio files follow the same delivery pattern as existing PNG sprites. The project uses a Replit-style static file server where `attached_assets/` is served at `/attached_assets/` URL path. The existing BootScene preload confirms this pattern works with:
```
this.load.image('hospital_bg', '/attached_assets/generated_images/Hospital_corridor_pixel_background.png');
```

Audio files should be placed in a new subdirectory:
```
/attached_assets/audio/sfx_footstep.ogg
/attached_assets/audio/sfx_interact.ogg
... etc
```

And loaded with the matching URL path:
```typescript
this.load.audio('sfx_footstep', '/attached_assets/audio/sfx_footstep.ogg');
```

**Vite note:** The vite config has `root: client/` and no `publicDir` override, meaning the default public dir is `client/public/`. That directory does not exist yet. Using `/attached_assets/` (which is served by the platform-level static middleware) is the established pattern and is correct for this project.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `createEmitter()` for Phaser particles | `this.add.particles(x, y, key, config)` | Phaser 3.60 | STATE.md already flags this — not relevant to audio but documents the version break pattern |
| HTML5 Audio for web games | Web Audio API via Phaser SoundManager | ~2020 | Phaser auto-selects Web Audio when available; no developer action required |
| Manual autoplay unlock overlays | Phaser `sound.locked` + auto-unlock on first gesture | Phaser 3.x | Phaser handles this internally — no overlay needed |

---

## Open Questions

1. **Safari OGG support**
   - What we know: Safari does not support OGG natively; Phaser loads zero bytes silently when format not supported.
   - What's unclear: Whether the target audience uses Safari. If this is Replit-hosted desktop Chrome/Firefox, it's irrelevant.
   - Recommendation: Ship OGG-only for now. Add MP3 fallback only if Safari support is required later. The `this.load.audio(key, ['file.ogg', 'file.mp3'])` pattern makes this a one-line change per file.

2. **Mute toggle access to Phaser.Game instance from React HUD**
   - What we know: `PhaserGame.tsx` creates the Phaser.Game instance. React HUD pages (BreachDefensePage, PrivacyQuestPage) render the game canvas inside a component.
   - What's unclear: Whether `PhaserGame.tsx` exposes the game instance via ref or context — needs a quick read of that file.
   - Recommendation: If no ref exists, add a `REACT_TOGGLE_MUTE` EventBridge event that BootScene (which persists across all scenes) listens to and calls `this.sound.setMute()`.

3. **Footstep sound variant randomization**
   - What we know: Impact Sounds has 5 carpet variants (footstep_carpet_000 through 004). Kenney Retro Sounds 1 has jump/pickup sounds too.
   - What's unclear: Whether single-file footsteps sound repetitive in practice.
   - Recommendation: Start with one file. If repetitive after testing, load all 5 variants and randomly select: `this.sound.play('sfx_footstep_' + Phaser.Math.Between(0, 4), ...)`.

---

## Sources

### Primary (HIGH confidence)
- [https://docs.phaser.io/phaser/concepts/audio](https://docs.phaser.io/phaser/concepts/audio) — Phaser 3 audio loading, playing, mute API, autoplay policy handling
- [https://docs.phaser.io/phaser/concepts/tweens](https://docs.phaser.io/phaser/concepts/tweens) — Tween API: y+alpha simultaneous, onComplete callback, destroy pattern
- BootScene.ts (local) — confirmed audio load pattern from existing image preload pipeline
- BreachDefenseScene.ts (local) — confirmed exact line numbers for death (659), breach (546), placement (281)
- ExplorationScene.ts (local) — confirmed triggerInteraction (line 315), WASD movement (lines 280-308), step() callback (lines 380-421)
- EventBridge.ts (local) — confirmed existing event names and extension pattern

### Secondary (MEDIUM confidence)
- [https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Interface+Sounds](https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Interface+Sounds) — confirmed file listing: confirmation_001.ogg, drop_001.ogg, select_001.ogg
- [https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Impact+Sounds](https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Impact+Sounds) — confirmed footstep variants: footstep_carpet_000 through footstep_carpet_004
- [https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Digital+Audio](https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Digital+Audio) — confirmed powerUp1-12.ogg, phaserDown1-3.ogg
- [https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Retro+Sounds+2](https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack/Retro+Sounds+2) — confirmed hit1-5.ogg, error1-5.ogg

### Tertiary (LOW confidence)
- WebSearch on footstep throttle patterns — training data only; implementation above derived from established game dev practice
- Kenney file selection aesthetic fit — curated based on file names and pack descriptions, not personal listening (per STATE.md: "SFX file selection within Kenney packs requires listening — ~30 min curation before BootScene implementation")

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phaser 3.90 is installed, all APIs verified against official docs
- Architecture: HIGH — integration points verified directly in source files with exact line numbers
- Kenney file selection: MEDIUM — files confirmed to exist via directory listing, aesthetic fit is LOW until curated by ear
- Pitfalls: HIGH — derived from source code analysis and Phaser documentation

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (Phaser 3.90 stable; Kenney pack contents stable)
