# Phase 2: Walk Cycle Animation - Research

**Researched:** 2026-02-28
**Domain:** Phaser 3 Animation System + Programmatic Texture Generation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Sprite approach:** Programmatic frames using the existing Graphics API (extend `generatePlayerTexture()` in BootScene) — no external spritesheet PNGs, keeps PrivacyQuest's art pipeline 100% programmatic
- **Frame count:** 2 frames per direction (left-step, right-step) — 8 walk textures total across 4 directions
- **Animation style:** Legs-only animation — upper body stays static per direction, legs alternate positions
- **Idle frame:** Static freeze on the current direction's base frame when player stops. Idle frame IS walk frame 1 (neutral standing) — the existing 4 direction textures become idle/frame-1. No breathing bob or idle animation.
- **Total textures:** 4 existing (idle/frame-1) + 4 new (frame-2) = 8 player textures
- **Animation timing:** ~150ms per frame (~6-7 fps walk cycle) — 2-frame alternation, retro pixel art pace (SNES-era feel)
- **Scope:** Walk animation applies to BOTH keyboard (WASD/arrows) movement AND click-to-move BFS pathfinding, in BOTH HubWorldScene and ExplorationScene

### Claude's Discretion

- Exact pixel positions for the "legs apart" walk frame 2
- How to structure the animation (Phaser `anims.create()` vs manual frame swap in update loop)
- Direction priority during diagonal movement (existing behavior: left/right wins)
- Animation start/stop timing details

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANIM-01 | Player character has 4-direction walk cycle animation (2-3 frames per direction) in PrivacyQuest | Phaser `anims.create()` with per-frame texture keys + programmatic frame-2 textures covers this fully. Both scenes (HubWorld + Exploration) require wiring. |
</phase_requirements>

---

## Summary

This phase adds 2-frame walk cycle animations to the PrivacyQuest player character. The work splits cleanly into two parts: (1) generate 4 new frame-2 textures in BootScene using the existing Graphics API pattern, and (2) wire up Phaser's animation system to play/stop those animations in both HubWorldScene and ExplorationScene.

Phaser 3's `anims.create()` natively supports per-frame texture key overrides via the `frames` array — each frame object accepts a `key` property pointing to any registered texture. This means a single animation definition can alternate between `player_down` (idle frame) and `player_down_walk` (step frame) without needing a spritesheet. Animations registered on `this.anims` (scene-level) are actually global — they persist across scenes and can be played on any sprite. This is ideal: register once in BootScene (or first scene to create them), play in both HubWorldScene and ExplorationScene.

The two implementation strategies (Phaser `anims.create()` vs manual frame swap in `update()`) are both viable. The Phaser animation system approach is cleaner and more idiomatic; the manual frame swap approach requires a timer variable but avoids animation system complexity. Research favors the Phaser `anims.create()` approach for the keyboard movement path, and recommends that the BFS pathfinding path (`startPathMovement`) also use `sprite.anims.play()` triggered per step, since BFS steps fire at ~120ms intervals — aligning with the 150ms frame rate target.

**Primary recommendation:** Use `scene.anims.create()` with per-frame texture keys for all 8 walk animations (4 directions × 2 frames). Play via `sprite.anims.play('walk_down', true)` on movement start; stop via `sprite.anims.stop()` + `sprite.setTexture(idleKey)` on movement stop. This approach is fully supported in Phaser 3.87+.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | ^3.90.0 (installed) | Animation system, texture management | Already in project; `anims.create()` + per-frame `key` property is the native way to animate across separate textures |

### Supporting

No new libraries needed. This phase uses only Phaser's built-in animation manager and the existing Graphics API for texture generation.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `anims.create()` with per-frame keys | Manual timer + `setTexture()` in `update()` | Manual approach requires tracking a timer variable and animation state; `anims.create()` handles timing, looping, and state automatically. Manual is acceptable fallback if animation system causes any edge cases with setTexture conflicts. |
| Separate texture per frame | Single spritesheet PNG | Spritesheet requires external asset; programmatic is the locked decision. Per-frame textures are supported natively and work identically. |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed. Changes go into existing files:

```
client/src/phaser/scenes/
├── BootScene.ts           # Add frame-2 texture generation here
├── HubWorldScene.ts       # Wire play/stop animation in update()
└── ExplorationScene.ts    # Wire play/stop in update() and startPathMovement()
```

### Pattern 1: Multi-Texture Animation via `anims.create()`

**What:** Register a looping 2-frame animation where each frame specifies its own texture key.

**When to use:** When frames live in separate textures (programmatic, not spritesheet). This is the project's pattern.

**Example:**

```typescript
// Source: https://photonstorm.github.io/phaser3-docs/Phaser.Types.Animations.html
// Each frame object's `key` property overrides the default texture for that frame.
// Register once in BootScene.create() after all textures are generated.

scene.anims.create({
  key: 'walk_down',
  frames: [
    { key: 'player_down' },       // frame 1: idle/neutral (existing texture)
    { key: 'player_down_walk' },  // frame 2: legs apart (new texture)
  ],
  frameRate: 7,    // ~143ms per frame — matches 150ms target
  repeat: -1,      // loop indefinitely while moving
});

scene.anims.create({
  key: 'walk_up',
  frames: [
    { key: 'player_up' },
    { key: 'player_up_walk' },
  ],
  frameRate: 7,
  repeat: -1,
});

scene.anims.create({
  key: 'walk_left',
  frames: [
    { key: 'player_left' },
    { key: 'player_left_walk' },
  ],
  frameRate: 7,
  repeat: -1,
});

scene.anims.create({
  key: 'walk_right',
  frames: [
    { key: 'player_right' },
    { key: 'player_right_walk' },
  ],
  frameRate: 7,
  repeat: -1,
});
```

**Note:** `scene.anims.create()` registers globally (available to all scenes). Registering in BootScene means HubWorldScene and ExplorationScene both inherit the animations automatically.

### Pattern 2: Play/Stop Animation on Keyboard Movement

**What:** Replace the existing `setTexture()` calls in `update()` with `sprite.anims.play()` calls. Stop and restore idle texture when no key is pressed.

**Example:**

```typescript
// In update() — replaces existing setTexture() calls
if (left) {
  body.setVelocityX(-MOVE_SPEED);
  if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== 'walk_left') {
    this.player.anims.play('walk_left', true); // true = ignore if already playing
  }
} else if (right) {
  body.setVelocityX(MOVE_SPEED);
  if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== 'walk_right') {
    this.player.anims.play('walk_right', true);
  }
}

if (up) {
  body.setVelocityY(-MOVE_SPEED);
  if (!left && !right) {
    this.player.anims.play('walk_up', true);
  }
} else if (down) {
  body.setVelocityY(MOVE_SPEED);
  if (!left && !right) {
    this.player.anims.play('walk_down', true);
  }
}

// When no movement — stop animation, restore idle texture
if (!left && !right && !up && !down) {
  this.player.anims.stop();
  // Restore idle = the direction's frame-1 texture (already the idle pose)
  // Preserve last-facing direction with a tracked instance variable.
  this.player.setTexture(this.lastFacingTexture); // e.g. 'player_down'
}
```

**Simpler alternative** (if animation direction tracking feels complex): Use `sprite.anims.play(key, true)` — the second argument `ignoreIfPlaying` prevents restart jitter when the same key is already playing.

### Pattern 3: BFS Pathfinding Animation (`startPathMovement`)

**What:** During BFS tile-by-tile movement, play the direction animation on each step start, stop it on arrival.

**Example:**

```typescript
// In ExplorationScene.startPathMovement() — the step() closure
const step = () => {
  if (this.movePath.length === 0) {
    // Arrived — stop walk animation
    this.player.anims.stop();
    this.player.setTexture(this.lastFacingTexture);
    // ... existing pending interaction logic
    return;
  }

  const next = this.movePath.shift()!;
  const dx = next.x - this.tileX;
  const dy = next.y - this.tileY;

  // Play directional walk animation
  if (dx < 0) {
    this.player.anims.play('walk_left', true);
    this.lastFacingTexture = 'player_left';
  } else if (dx > 0) {
    this.player.anims.play('walk_right', true);
    this.lastFacingTexture = 'player_right';
  } else if (dy < 0) {
    this.player.anims.play('walk_up', true);
    this.lastFacingTexture = 'player_up';
  } else {
    this.player.anims.play('walk_down', true);
    this.lastFacingTexture = 'player_down';
  }

  // ... existing tween to next tile
};
```

### Pattern 4: Generating Frame-2 Walk Textures

**What:** Extend `generatePlayerTexture()` in BootScene to add 4 new `_walk` variants. Frame 2 has legs apart instead of together (classic SNES-style step).

**Example for `player_down_walk`:**

```typescript
// Legs apart: left leg shifted left, right leg shifted right
// Compared to idle: pants at fillRect(10,24,5,4) and fillRect(17,24,5,4)
// Walk frame: stagger legs to create stepping motion

const gWalk = this.add.graphics();
// Body (same)
gWalk.fillStyle(0x4a90e2);
gWalk.fillRect(10, 14, 12, 10);
// Head (same)
gWalk.fillStyle(0xfdbcb4);
gWalk.fillRect(12, 6, 8, 8);
// Hair (same)
gWalk.fillStyle(0x4a90e2);
gWalk.fillRect(11, 5, 10, 3);
gWalk.fillRect(10, 6, 2, 4);
gWalk.fillRect(20, 6, 2, 4);
// Eyes (same)
gWalk.fillStyle(0x000000);
gWalk.fillRect(14, 9, 2, 2);
gWalk.fillRect(18, 9, 2, 2);
// Pants — left leg forward (up), right leg back (down)
gWalk.fillStyle(0x2c3e50);
gWalk.fillRect(10, 22, 5, 4); // left leg raised
gWalk.fillRect(17, 26, 5, 4); // right leg back
// Shoes
gWalk.fillStyle(0x8b4513);
gWalk.fillRect(10, 26, 5, 2); // left shoe raised
gWalk.fillRect(17, 30, 5, 2); // right shoe back
gWalk.generateTexture('player_down_walk', TILE_SIZE, TILE_SIZE);
gWalk.destroy();
```

**Claude's discretion note:** The exact pixel offsets for the leg positions are Claude's to determine. The key principle: one leg forward (y -= 2), one leg back (y += 2). At 32px character height, 2-4px vertical offset creates a readable step. The implementor should tune these values during execution.

### Anti-Patterns to Avoid

- **Calling `anims.create()` without checking if animation already exists:** Causes "Animation with key 'walk_down' already exists" warnings on hot reload / scene restart. Use `if (!this.anims.exists('walk_down'))` guard.
- **Using `setTexture()` while an animation is playing:** Immediately overrides the active animation frame. Always stop the animation first (`sprite.anims.stop()`) before calling `setTexture()`.
- **Registering animations in HubWorldScene or ExplorationScene `create()`:** These scenes can be started/stopped multiple times. Animations are global — registering in BootScene once is cleaner and avoids duplicate-key errors.
- **Not passing `ignoreIfPlaying = true` to `play()`:** Without this flag, `sprite.anims.play('walk_down')` restarts from frame 1 every call, causing animation jitter on continuous key-held movement.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frame timing / loop | Custom `setInterval` or `Phaser.Time.TimerEvent` for frame swaps | `anims.create()` + `sprite.anims.play()` | Phaser's animation manager handles frame timing, delta accumulation, loop logic, and frame advance automatically — no timer management needed |
| "is animation already playing this key" check | Manual boolean flag | `sprite.anims.isPlaying` + `sprite.anims.currentAnim?.key` | Phaser tracks this natively on the AnimationState |

**Key insight:** The animation system exists precisely to replace manual frame swap timers. Using it cuts the implementation to ~10 lines of `anims.create()` calls plus simple `play(key, true)` / `stop()` calls in update.

---

## Common Pitfalls

### Pitfall 1: Duplicate Animation Key on Scene Restart

**What goes wrong:** ExplorationScene can be stopped and restarted when the player navigates between rooms. If `anims.create()` is called in `ExplorationScene.create()`, it will throw "Animation with key 'walk_down' already exists" on the second room visit.

**Why it happens:** `scene.anims.create()` is global — it persists after a scene stops. Calling it again with the same key fails.

**How to avoid:** Register all walk animations once in `BootScene.create()`, after textures are generated. Add `if (!this.anims.exists('walk_down'))` guard as safety net if registering elsewhere.

**Warning signs:** Console errors on second room entry; player animation broken after scene restart.

### Pitfall 2: `setTexture()` Conflict with Active Animation

**What goes wrong:** Calling `this.player.setTexture('player_down')` while an animation is actively playing will flash the texture for one frame but the animation immediately overrides it on the next tick.

**Why it happens:** The animation manager updates the sprite's texture every frame via its internal tick. Direct `setTexture()` is overridden on the next animation frame.

**How to avoid:** Always call `sprite.anims.stop()` before calling `sprite.setTexture()`. In the idle path: `player.anims.stop(); player.setTexture(idleKey);`

**Warning signs:** Sprite flickers between frames; idle texture doesn't "stick."

### Pitfall 3: Animation Jitter on Continuous Keyboard Hold

**What goes wrong:** If `sprite.anims.play('walk_down')` is called every `update()` frame (60fps) without the `ignoreIfPlaying` flag, the animation restarts from frame 1 every 16ms — effectively freezing on frame 1.

**Why it happens:** `play()` without `ignoreIfPlaying = true` always resets the animation.

**How to avoid:** Always pass `true` as the second argument: `sprite.anims.play('walk_down', true)`. This is equivalent to checking "if not already playing this key, start it."

**Warning signs:** Walk animation appears frozen on frame 1 during continuous movement.

### Pitfall 4: `lastFacingTexture` Not Initialized

**What goes wrong:** Player is created facing down but `lastFacingTexture` is not set. When the player stops before ever moving, idle restoration uses undefined.

**Why it happens:** Class field initialized but not set at player creation time.

**How to avoid:** Initialize `private lastFacingTexture = 'player_down'` as a class field, and update it every time a directional animation starts.

### Pitfall 5: HubWorldScene Missing Animation Wire-up

**What goes wrong:** Walk animation works in ExplorationScene but not in HubWorldScene — player still glides.

**Why it happens:** HubWorldScene has its own `update()` loop with identical `setTexture()` logic that needs the same `play()`/`stop()` treatment.

**How to avoid:** The phase scope explicitly covers both scenes. Treat HubWorldScene as a parallel implementation target, not an afterthought.

---

## Code Examples

Verified patterns from official sources:

### Registering Walk Animations (BootScene.create — after texture generation)

```typescript
// Source: https://photonstorm.github.io/phaser3-docs/Phaser.Types.Animations.html
// AnimationFrame typedef confirms `key` property overrides texture per frame.

const WALK_DIRS = ['down', 'up', 'left', 'right'] as const;

for (const dir of WALK_DIRS) {
  if (!this.anims.exists(`walk_${dir}`)) {
    this.anims.create({
      key: `walk_${dir}`,
      frames: [
        { key: `player_${dir}` },        // frame 1: idle/neutral
        { key: `player_${dir}_walk` },   // frame 2: legs apart
      ],
      frameRate: 7,
      repeat: -1,
    });
  }
}
```

### Playing Walk Animation (update loop)

```typescript
// Source: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/animation/
// sprite.anims.play(key, ignoreIfPlaying) — second arg prevents restart jitter

this.player.anims.play('walk_left', true);
```

### Stopping Animation and Restoring Idle

```typescript
// Source: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/animation/
this.player.anims.stop();
this.player.setTexture(this.lastFacingTexture); // e.g. 'player_down'
```

### Checking if a Specific Animation is Already Playing

```typescript
// Avoids unnecessary play() calls (optional optimization)
const currentKey = this.player.anims.currentAnim?.key;
if (currentKey !== 'walk_down') {
  this.player.anims.play('walk_down', true);
}
```

### Guard for Duplicate Registration

```typescript
if (!this.anims.exists('walk_down')) {
  this.anims.create({ key: 'walk_down', frames: [...], frameRate: 7, repeat: -1 });
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct `setTexture()` on every update frame | `anims.create()` + `play(key, true)` / `stop()` | This phase | Removes per-frame texture logic, delegates timing to Phaser animation manager |

**Deprecated/outdated:**
- `createEmitter()` for particles (unrelated to this phase, but noted in STATE.md): Use `this.add.particles(x, y, key, config)` — not applicable here.
- `Phaser.GameObjects.Components.Animation` class name: The per-sprite animation state is accessed via `sprite.anims` which is a `Phaser.Animations.AnimationState` instance in Phaser 3.60+.

---

## Open Questions

1. **Exact pixel coordinates for frame-2 legs**
   - What we know: Current idle legs: `fillRect(10,24,5,4)` left, `fillRect(17,24,5,4)` right (pants); `fillRect(10,28,5,2)` left, `fillRect(17,28,5,2)` right (shoes)
   - What's unclear: The specific pixel offsets that create a readable "step" at 32px — this is Claude's discretion to determine during implementation
   - Recommendation: During implementation, try ±2px vertical offset for forward/back leg. Left leg forward = pants y=22, shoes y=26; right leg back = pants y=26, shoes y=30. For up/down variants, horizontal leg splay (x shift) may look more natural.

2. **Up/left/right frame-2 design**
   - What we know: The down-facing frame-2 uses vertical leg offset. For up-facing (back view), same vertical offset applies. For left/right-facing (side view), legs should splay horizontally (one leg forward, one back along the x-axis of movement).
   - What's unclear: Whether side-view legs need a different visual approach given the existing side-view sprites only show profile
   - Recommendation: For left/right facing walk frames: shift one leg forward by 2px in the direction of travel, the other back by 2px. Keep it subtle — at 32px this is very readable.

---

## Validation Architecture

> Skipped: `workflow.nyquist_validation` is not present in `.planning/config.json` (key absent = false). No test framework detected in project (no vitest.config.*, jest.config.*, pytest.ini found). Animation correctness is visual — manual verification is the appropriate gate.

**Manual verification steps for phase completion:**
1. Run `npm run dev`, navigate to `/` (HubWorldScene) — player walks with leg animation in all 4 directions, stops idle on key release
2. Navigate to `/privacy` (ExplorationScene) — same behavior confirmed
3. Click-to-move in ExplorationScene — player animates along BFS path, stops idle on arrival
4. Diagonal movement — left/right animation wins (existing behavior preserved)
5. Pause during dialogue — player stops animating (existing `paused` flag handles this)

---

## Sources

### Primary (HIGH confidence)

- [Phaser.Types.Animations — AnimationFrame typedef](https://photonstorm.github.io/phaser3-docs/Phaser.Types.Animations.html) — Confirmed `key` property per AnimationFrame; `defaultTextureKey` property on AnimationConfig; `frameRate`/`duration` fields
- [Phaser 3 Animations Concepts](https://docs.phaser.io/phaser/concepts/animations) — Global vs scene-level animation scope; `anims.create()` is globally registered; `sprite.anims.play()` API
- [Rex Notes: Animation](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/animation/) — `play(key, ignoreIfPlaying)`, `stop()`, `isPlaying` API signatures; community-verified patterns

### Secondary (MEDIUM confidence)

- [Phaser Discourse: Add Generated Textures as Animation Frames](https://phaser.discourse.group/t/add-generated-textures-as-animation-frames/616) — Confirmed pattern of `{ key: frameKey }` objects in frames array for programmatically generated textures; note on per-draw-call cost (acceptable for 2-frame animation)
- [Phaser AnimationManager API](https://docs.phaser.io/api-documentation/class/animations-animationmanager) — `create()` method returns `Animation | false`; `exists()` method for duplicate guard

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phaser 3.90 is installed; animation API confirmed via official docs
- Architecture: HIGH — Per-frame `key` property confirmed in official typedef docs; `play(key, true)` pattern confirmed in community-verified Rex notes
- Pitfalls: HIGH — Duplicate key on scene restart and `ignoreIfPlaying` flag are well-documented behaviors; `setTexture()` + active animation conflict is confirmed by official docs

**Research date:** 2026-02-28
**Valid until:** 2026-08-28 (Phaser animation API is stable; low churn risk)
