# Architecture Research

**Domain:** Phaser 3 + React hybrid game — polish systems integration (sound, sprites, VFX, onboarding)
**Researched:** 2026-02-27
**Confidence:** HIGH (verified against Phaser official docs + direct codebase inspection)

## Existing Architecture Summary

The project already has a settled, working architecture. This document is additive — it describes how the four new systems (sound, sprite/animation, particles, onboarding) slot into the existing structure without redesigning it.

Existing pillars:

- **BootScene** (`client/src/phaser/scenes/BootScene.ts`) — preloads PNG assets, generates programmatic textures via `SpriteFactory`, then starts HubWorld
- **SpriteFactory** (`client/src/phaser/SpriteFactory.ts`) — pure function `generateAllTextures(scene)` called once from BootScene; creates all NPC/furniture/object textures programmatically via `Graphics.generateTexture()`
- **EventBridge** (`client/src/phaser/EventBridge.ts`) — singleton `Phaser.Events.EventEmitter`; the only legal channel between Phaser scenes and React pages
- **Scenes** — `HubWorldScene`, `ExplorationScene`, `BreachDefenseScene` each own their game loop, input, and Phaser game objects
- **React pages** — `PrivacyQuestPage`, `BreachDefensePage` own HUD, modal overlays, and dialogue; mounted as DOM over the Phaser canvas

## Standard Architecture (Polish Systems)

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         React Layer (DOM)                                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ PrivacyQuestPage│  │ BreachDefensePage │  │  Onboarding Modals   │   │
│  │ (dialogue/HUD)  │  │ (HUD/wave HUD)   │  │  (intro + hints)     │   │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬───────────┘   │
│           │ EventBridge        │ EventBridge             │ EventBridge   │
├───────────┼────────────────────┼─────────────────────────┼──────────────┤
│           │         Phaser Layer (Canvas)                 │              │
│  ┌────────┴────────────────────┴──────────────────────────┴──────────┐  │
│  │                         BootScene                                  │  │
│  │  preload: PNG sprites, audio files (MP3/OGG)                      │  │
│  │  create:  SpriteFactory.generateAllTextures()                     │  │
│  │           AnimationFactory.registerAllAnims()   ← NEW             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────┐  ┌────────────────────────────────────────┐   │
│  │   ExplorationScene   │  │         BreachDefenseScene             │   │
│  │  - player walk anim  │  │  - tower fire tweens + flash tint      │   │
│  │  - footstep SFX      │  │  - enemy death particle burst          │   │
│  │  - interact SFX      │  │  - projectile SFX                      │   │
│  │  - proximity hint    │  │  - breach SFX                          │   │
│  └──────────────────────┘  └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Where it lives |
|-----------|---------------|----------------|
| BootScene | Preload ALL assets (PNG, audio); register ALL animations globally | `scenes/BootScene.ts` |
| SpriteFactory | Generate programmatic NPC/furniture textures via Graphics | `phaser/SpriteFactory.ts` |
| AnimationFactory (new) | Register walk-cycle anims for player directions using existing programmatic frames | `phaser/AnimationFactory.ts` |
| ExplorationScene | Play animations on player sprite; trigger SFX via `this.sound`; emit hint events | `scenes/ExplorationScene.ts` |
| BreachDefenseScene | Trigger tower-fire tweens, enemy-death particles, SFX via `this.sound` | `scenes/BreachDefenseScene.ts` |
| EventBridge | Carry onboarding triggers from Phaser scenes to React; carry dismiss signals back | `phaser/EventBridge.ts` |
| PrivacyQuestPage | Render intro modal; render contextual hint banners driven by EventBridge events | `pages/PrivacyQuestPage.tsx` |
| BreachDefensePage | Surface wave intro text, suggestedTowers hints, tower hover desc, endMessage from constants | `pages/BreachDefensePage.tsx` |

## Sound System Integration

### How it plugs in

Sound belongs entirely inside Phaser. React never touches `this.sound` directly.

**Loading (BootScene.preload):**

```typescript
// BootScene.ts — preload()
this.load.audio('sfx_interact',  ['/audio/interact.mp3', '/audio/interact.ogg']);
this.load.audio('sfx_footstep',  ['/audio/footstep.mp3', '/audio/footstep.ogg']);
this.load.audio('sfx_tower_fire', ['/audio/tower_fire.mp3', '/audio/tower_fire.ogg']);
this.load.audio('sfx_enemy_die',  ['/audio/enemy_die.mp3', '/audio/enemy_die.ogg']);
this.load.audio('sfx_breach',     ['/audio/breach.mp3', '/audio/breach.ogg']);
this.load.audio('sfx_wave_start', ['/audio/wave_start.mp3', '/audio/wave_start.ogg']);
this.load.audio('sfx_place_tower',['/audio/place_tower.mp3', '/audio/place_tower.ogg']);
this.load.audio('sfx_dialogue',   ['/audio/dialogue.mp3', '/audio/dialogue.ogg']);
```

Both MP3 and OGG are provided per key so Phaser picks the format the browser supports. Always list MP3 first (widest support).

**Playing (in scenes):**

```typescript
// One-shot SFX — simplest pattern, auto-destroys after play
this.sound.play('sfx_interact', { volume: 0.6 });

// Throttled SFX (footsteps) — only fire every N ms
private lastFootstep = 0;
// inside update():
if (isMoving && time - this.lastFootstep > 250) {
  this.sound.play('sfx_footstep', { volume: 0.3 });
  this.lastFootstep = time;
}
```

**Autoplay policy:** Phaser's WebAudioSoundManager handles browser unlock automatically after the first user gesture. The `sound.locked` property is true until unlock happens. No manual React workaround is needed — all sound is triggered in response to player input (clicks, key presses) which already satisfies the browser gesture requirement.

**React does NOT call play:** Sound is never triggered from React page code. React emits EventBridge events → Phaser scenes react → scenes call `this.sound.play()`. This maintains the clean separation: Phaser owns the audio context.

### Data flow: Sound

```
Player clicks NPC
    ↓ (ExplorationScene detects proximity + SPACE key)
this.sound.play('sfx_interact')   ← stays in Phaser, no EventBridge needed
    ↓ (also emits EXPLORATION_INTERACT_NPC)
EventBridge → React opens dialogue overlay
```

Sound SFX do not need to travel through EventBridge — they fire directly in the scene that detects the triggering event.

## Sprite and Animation System Integration

### Current state

The codebase uses directional static textures (`player_down`, `player_left`, `player_right`, `player_up`) generated by `BootScene.generatePlayerTexture()`. The player sprite switches texture on direction change — no animation frames exist yet. `this.anims.create()` is never called anywhere.

### Walk cycle approach: multi-frame programmatic spritesheets

For pixel art walk cycles without external PNG assets, the pattern is:

1. Draw each animation frame as a separate `Graphics` object
2. Call `generateTexture(key, w, h)` per frame (identical to current approach)
3. Create a texture atlas manually by registering frames into the texture manager
4. Call `this.anims.create()` referencing those frame keys

However, a simpler approach that fits the existing codebase better: generate one texture per animation frame with a naming convention (`player_walk_down_0`, `player_walk_down_1`, etc.), then use `anims.create` with `frames` as an array of `{ key, frame: 0 }` objects pointing to single-frame textures.

```typescript
// AnimationFactory.ts — registerAllAnims(scene)
export function registerAllAnims(scene: Phaser.Scene) {
  // Each direction needs 2-3 frames already generated in BootScene
  // Frame naming: player_walk_down_0, player_walk_down_1, player_walk_down_2

  const dirs = ['down', 'up', 'left', 'right'] as const;
  const frameCount = 3;

  for (const dir of dirs) {
    scene.anims.create({
      key: `player_walk_${dir}`,
      frames: Array.from({ length: frameCount }, (_, i) => ({
        key: `player_walk_${dir}_${i}`,
        frame: 0,
      })),
      frameRate: 8,
      repeat: -1,
    });

    // Idle = single frame (existing static texture)
    scene.anims.create({
      key: `player_idle_${dir}`,
      frames: [{ key: `player_${dir}`, frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
  }
}
```

**Usage in ExplorationScene:**

```typescript
// In update() — replace setTexture() calls with anims.play()
if (left) {
  body.setVelocityX(-MOVE_SPEED);
  this.player.play('player_walk_left', true);  // true = ignore if already playing
} else if (right) {
  body.setVelocityX(MOVE_SPEED);
  this.player.play('player_walk_right', true);
}
// When stopped:
if (!left && !right && !up && !down) {
  const dir = this.lastDir; // track last direction
  this.player.play(`player_idle_${dir}`, true);
}
```

**Build order dependency:** AnimationFactory must be called in `BootScene.create()` after `generateAllTextures()` and after all walk-frame textures are generated. Animations registered in BootScene are available globally to all subsequent scenes.

### NPC idle animation (optional, low effort)

NPCs can use the existing single-frame static textures with a simple tween bobbing effect (already used for educational items). Full NPC walk cycles are out of scope for this milestone.

## Particle Effects Integration

### Phaser 3.60+ API (current in project: 3.90)

`ParticleEmitterManager` was removed in 3.60. `this.add.particles()` now returns a `ParticleEmitter` directly. The project is on 3.90, so this is the only API to use.

```typescript
// Enemy death burst — in BreachDefenseScene
private killEnemy(enemy: EnemyData) {
  // One-shot burst at enemy position
  const emitter = this.add.particles(enemy.sprite.x, enemy.sprite.y, 'particle_dot', {
    speed: { min: 40, max: 120 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 500,
    quantity: 8,
    emitting: false,  // don't auto-start
  });
  emitter.explode(8);  // fire once, then let it clean up

  // Clean up after lifespan
  this.time.delayedCall(600, () => emitter.destroy());

  enemy.sprite.destroy();
  enemy.hpBarBg.destroy();
  enemy.hpBarFill.destroy();
  this.enemies = this.enemies.filter(e => e.id !== enemy.id);
}
```

**Particle texture requirement:** Particles need a texture. Use a tiny programmatic circle texture generated in BootScene/SpriteFactory:

```typescript
// In SpriteFactory or BootScene.create()
const g = scene.add.graphics();
g.fillStyle(0xffffff, 1);
g.fillCircle(4, 4, 4);
g.generateTexture('particle_dot', 8, 8);
g.destroy();
```

This avoids any new PNG asset requirement. Tint the emitter at creation time to match the threat type color.

### Tower fire visual feedback — tweens, not particles

For tower firing, tweens are cheaper and sufficient:

```typescript
// In BreachDefenseScene — when a tower fires
private towerFire(tower: TowerData, target: EnemyData) {
  // Scale pulse on tower sprite
  this.tweens.add({
    targets: tower.sprite,
    scaleX: 1.15,
    scaleY: 1.15,
    duration: 80,
    yoyo: true,
    ease: 'Quad.easeOut',
  });

  // Flash tint on tower briefly
  tower.sprite.setTint(0xffffff);
  this.time.delayedCall(80, () => tower.sprite.clearTint());
}
```

Enemy hit flash already exists (`enemy.flashUntil` pattern). Keep it.

## Onboarding Integration

### PrivacyQuest: intro modal + contextual hints

Onboarding for PrivacyQuest is React-side (modals, hint banners) triggered by EventBridge events emitted from ExplorationScene.

**New EventBridge events to add:**

```typescript
// EventBridge.ts — add to BRIDGE_EVENTS
EXPLORATION_FIRST_ENTER: 'exploration:first-enter',   // Phaser → React: trigger intro modal
EXPLORATION_NEAR_FIRST_NPC: 'exploration:near-first-npc', // Phaser → React: show hint
EXPLORATION_CONTROLS_HINT: 'exploration:controls-hint',   // Phaser → React: show controls hint
```

**Phaser side (ExplorationScene):** Emit `EXPLORATION_FIRST_ENTER` once in `create()` if the room is a first visit (checked against `completedNPCs.size === 0` or a passed flag). Emit `EXPLORATION_NEAR_FIRST_NPC` in `checkProximity()` the first time the player gets within range of any NPC.

**React side (PrivacyQuestPage):** Listen for these events, show a lightweight modal or banner. The existing `useToast` hook could handle ephemeral hints without needing a new component.

```typescript
// PrivacyQuestPage.tsx — add to event listeners in useEffect
const onFirstEnter = () => setShowIntroModal(true);
const onControlsHint = () => toast({ title: 'Use WASD or arrow keys to move. SPACE to interact.' });
eventBridge.on(BRIDGE_EVENTS.EXPLORATION_FIRST_ENTER, onFirstEnter);
eventBridge.on(BRIDGE_EVENTS.EXPLORATION_CONTROLS_HINT, onControlsHint);
```

### BreachDefense: HUD data surfacing

The missing HUD data (wave intro, suggestedTowers, tower hover desc, endMessage) is already in `constants.ts`. No new events or architecture needed — it is purely a React render change in `BreachDefensePage.tsx`.

**Wave intro text:** The existing `BREACH_TUTORIAL_TRIGGER` event already fires with `tutorialKey`. The `WAVES[wave-1].introText` field (if it exists in constants) can be displayed in a timed banner on `BREACH_STATE_UPDATE` when `wave` changes.

**Tower hover description:** React already has `selectedTower` state and `TOWERS[type].desc`. A tooltip or panel below the tower list requires no new events.

**endMessage:** Displayed in the existing `GAMEOVER` / `VICTORY` page state; pull `WAVES[wave-1].endMessage` from the final wave's data.

**Build order:** BreachDefense HUD improvements are pure React changes — no Phaser coordination needed. They can be done independently of sound/animation work.

## Data Flow (All Four Systems)

### Sound flow

```
User input (key/click)
    ↓ Phaser scene detects in update() or input handler
this.sound.play('sfx_key')         ← stays in Phaser, never crosses EventBridge
```

### Animation flow

```
BootScene.create()
    ↓ calls AnimationFactory.registerAllAnims(this)
All anims registered globally in Phaser.Animations.AnimationManager
    ↓
ExplorationScene.update()
    player.play('player_walk_down', true)   ← direct sprite API
```

### Particle flow

```
BreachDefenseScene.update() → killEnemy()
    ↓ this.add.particles(...).explode(8)
    ↓ this.time.delayedCall(600, () => emitter.destroy())
All within Phaser, never crosses EventBridge
```

### Onboarding flow

```
ExplorationScene.create()
    ↓ eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_FIRST_ENTER)
PrivacyQuestPage (useEffect listener)
    ↓ setShowIntroModal(true)
React renders intro modal over Phaser canvas
    ↓ user dismisses (clicks button)
eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE)
ExplorationScene resumes (already handles this event)
```

## Recommended Project Structure (Additions Only)

```
client/src/
├── phaser/
│   ├── AnimationFactory.ts        ← NEW: registerAllAnims(scene), called from BootScene
│   ├── SpriteFactory.ts           ← MODIFIED: add particle_dot texture generation
│   ├── EventBridge.ts             ← MODIFIED: 3 new event constants for onboarding
│   └── scenes/
│       ├── BootScene.ts           ← MODIFIED: load audio files, call AnimationFactory
│       ├── ExplorationScene.ts    ← MODIFIED: play anims, play SFX, emit onboarding events
│       └── BreachDefenseScene.ts  ← MODIFIED: tower tweens, enemy death particles, SFX
├── pages/
│   ├── PrivacyQuestPage.tsx       ← MODIFIED: intro modal, hint banners
│   └── BreachDefensePage.tsx      ← MODIFIED: wave intro HUD, tower hover desc, endMessage
└── (no new audio components — SFX files live in public/audio/)

public/
└── audio/                         ← NEW directory
    ├── interact.mp3
    ├── interact.ogg
    ├── footstep.mp3
    ├── footstep.ogg
    ├── tower_fire.mp3
    ├── tower_fire.ogg
    ├── enemy_die.mp3
    ├── enemy_die.ogg
    ├── breach.mp3
    ├── breach.ogg
    ├── wave_start.mp3
    ├── wave_start.ogg
    ├── place_tower.mp3
    ├── place_tower.ogg
    ├── dialogue.mp3
    └── dialogue.ogg
```

## Architectural Patterns

### Pattern 1: All assets loaded in BootScene, used everywhere

**What:** BootScene is the single asset loading point. All PNG sprites, audio keys, and programmatic textures are created there. Subsequent scenes call `this.sound.play(key)` and `this.add.sprite(x, y, key)` assuming the asset exists.

**When to use:** Always — this is the established pattern in the codebase.

**Trade-offs:** If a scene needs an asset not loaded in Boot, it fails silently (Phaser logs warnings). Centralizing in Boot makes this impossible to miss.

**Example:**

```typescript
// BootScene.preload() — audio files added alongside existing image preloads
this.load.audio('sfx_interact', ['/audio/interact.mp3', '/audio/interact.ogg']);

// ExplorationScene.create() or update() — assumes key exists
this.sound.play('sfx_interact', { volume: 0.6 });
```

### Pattern 2: EventBridge for cross-boundary communication only

**What:** EventBridge events are used only when data must cross the React/Phaser boundary. Sound, particles, and animation stay entirely inside Phaser. Only onboarding triggers (and existing interaction events) cross the bridge.

**When to use:** Always ask "does this data need to reach React?" If no, handle it directly in the scene.

**Trade-offs:** Reduces event bus complexity. The bus stays small enough to audit the full event list in one file.

### Pattern 3: SFX triggered at source, not relayed

**What:** The scene that detects the game event plays the SFX directly. It does not emit an EventBridge event for "play sound X" and have another component respond.

**Why:** Eliminates latency and avoids creating a sound-management coupling layer that doesn't exist in the codebase.

**Example:**

```typescript
// In BreachDefenseScene — tower fires
private towerShoot(tower: TowerData, target: EnemyData) {
  this.sound.play('sfx_tower_fire', { volume: 0.5 });  // immediate, same frame
  this.createProjectile(tower, target);
}
```

### Pattern 4: AnimationFactory parallel to SpriteFactory

**What:** New `AnimationFactory.ts` mirrors the existing `SpriteFactory.ts` pattern — a pure exported function `registerAllAnims(scene)` called once from BootScene.

**When to use:** When adding any new global animation.

**Trade-offs:** Keeps BootScene thin; animation registration logic is colocated and testable.

## Anti-Patterns

### Anti-Pattern 1: Playing sound from React

**What people do:** Call `gameRef.current.sound.play(...)` from a React event handler or useEffect.

**Why it's wrong:** Breaks the React/Phaser boundary contract. Requires exposing Phaser internals through a ref. Creates timing issues (game may not be ready). Phaser's scene sound manager is scene-scoped; `game.sound` may not have the right context.

**Do this instead:** Emit an EventBridge event from React → have the Phaser scene listen and play the sound.

### Anti-Pattern 2: Using ParticleEmitterManager (pre-3.60 API)

**What people do:** `this.add.particles(texture).createEmitter({...})` — the old two-step pattern.

**Why it's wrong:** `ParticleEmitterManager` was removed in Phaser 3.60. This project is on 3.90. The old pattern will throw.

**Do this instead:** `this.add.particles(x, y, 'texture_key', config)` returns a `ParticleEmitter` directly.

### Anti-Pattern 3: Loading audio in non-Boot scenes

**What people do:** Call `this.load.audio(...)` in ExplorationScene.preload() or BreachDefenseScene.preload().

**Why it's wrong:** Audio files are then loaded per scene transition, not once. Scene restarts re-trigger the load. Breaks if the scene is started without going through Boot.

**Do this instead:** All audio in BootScene.preload(). Scenes only call `this.sound.play()`.

### Anti-Pattern 4: Registering animations per-scene

**What people do:** Call `this.anims.create(...)` inside ExplorationScene.create().

**Why it's wrong:** Each scene has its own AnimationManager instance. Animations registered in ExplorationScene are not available if the scene restarts with a different creation order. BootScene animations are globally registered.

**Actually:** Phaser's animation manager *is* global (on the game, not the scene). But calling `this.anims.create` in BootScene is still the correct pattern for clarity and to ensure it runs exactly once.

**Do this instead:** `AnimationFactory.registerAllAnims(scene)` called in `BootScene.create()`, where `scene` is the BootScene instance.

### Anti-Pattern 5: One React modal per onboarding hint

**What people do:** Create a full modal component for every contextual hint ("controls hint," "first NPC hint," etc.).

**Why it's wrong:** Each modal adds state, animation, dismissal logic. Three hints = three modals = three sets of state.

**Do this instead:** Use the existing `useToast` hook for ephemeral in-game hints (auto-dismiss, non-blocking). Reserve modal components for the intro sequence that needs active player acknowledgment.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Direction | Notes |
|----------|---------------|-----------|-------|
| BootScene → ExplorationScene | Shared texture/anim registry (global) | Boot sets up, Exploration reads | Textures and anims available globally after Boot completes |
| BootScene → BreachDefenseScene | Shared texture/anim registry + audio keys | Boot sets up, Breach reads | Same pattern |
| ExplorationScene → PrivacyQuestPage | EventBridge events | Phaser → React | Existing pattern; new onboarding events added here |
| PrivacyQuestPage → ExplorationScene | EventBridge events (REACT_DIALOGUE_COMPLETE) | React → Phaser | Existing; reused for intro modal dismissal |
| BreachDefenseScene → BreachDefensePage | EventBridge BREACH_STATE_UPDATE | Phaser → React | Existing; wave number already in state |
| SpriteFactory → scenes | Direct function call, returns textures via registry | Factory writes, scenes read | No change to boundary |
| AnimationFactory → scenes | Direct function call, registers anims globally | Factory writes, scenes read | Mirrors SpriteFactory pattern |

### Build Order Implications

The following sequencing is required — each step depends on the previous:

```
1. SFX assets acquired (Kenney.nl / freesound.org)
        ↓ (no code dependency, but blocks all sound work)
2. BootScene: load.audio() calls added
        ↓ (audio keys must exist before any scene calls sound.play)
3. ExplorationScene / BreachDefenseScene: sound.play() calls added
        ↓ (can be done independently per scene)

4. Walk-frame textures generated in BootScene (player_walk_down_0..2, etc.)
        ↓ (AnimationFactory depends on these textures existing)
5. AnimationFactory.registerAllAnims() added to BootScene.create()
        ↓ (animation keys must be registered before scenes use them)
6. ExplorationScene: replace setTexture() with play() calls
        ↓

7. particle_dot texture generated in SpriteFactory (trivial)
        ↓ (particle emitters depend on this texture key)
8. BreachDefenseScene: enemy death particle bursts + tower fire tweens
        ↓

9. EventBridge: new onboarding event constants added
        ↓ (scenes and pages must agree on event names)
10. ExplorationScene: emit EXPLORATION_FIRST_ENTER, NEAR_FIRST_NPC
        ↓
11. PrivacyQuestPage: listen for events, show intro modal + hints

12. BreachDefensePage: wave intro HUD, tower hover desc, endMessage
        (independent of all above — pure React, no new events needed)
```

Steps 4–6 (animation), 1–3 (sound), 7–8 (particles), and 12 (BreachDefense HUD) can proceed in parallel once BootScene modifications begin. Steps 9–11 (PrivacyQuest onboarding) depend only on EventBridge constants being finalized.

## Sources

- [Phaser Audio Concepts](https://docs.phaser.io/phaser/concepts/audio) — HIGH confidence (official docs)
- [Phaser Animation Concepts](https://docs.phaser.io/phaser/concepts/animations) — HIGH confidence (official docs)
- [Phaser ParticleEmitter API (3.80+)](https://newdocs.phaser.io/docs/3.80.0/Phaser.GameObjects.Particles.ParticleEmitter) — HIGH confidence (official API docs)
- [Phaser 3.60 ParticleEmitter Changelog](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/ParticleEmitter.md) — HIGH confidence (official changelog confirming ParticleEmitterManager removal)
- [WebAudioSoundManager API](https://docs.phaser.io/api-documentation/class/sound-webaudiosoundmanager) — HIGH confidence (official docs)
- Direct codebase inspection: `BootScene.ts`, `ExplorationScene.ts`, `BreachDefenseScene.ts`, `SpriteFactory.ts`, `EventBridge.ts` — HIGH confidence (actual running code)

---
*Architecture research for: Phaser 3 + React hybrid polish systems*
*Researched: 2026-02-27*
