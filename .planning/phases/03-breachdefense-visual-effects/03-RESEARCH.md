# Phase 3: BreachDefense Visual Effects - Research

**Researched:** 2026-02-28
**Domain:** Phaser 3.90 particles, tweens, sprite tinting
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Death effect style**
- Enemy-colored particles — particles inherit the threat type's visual identity (8 distinct colors across threat types)
- Fade + shrink + particles — sprite fades to 0 alpha while scaling down slightly, particles burst outward simultaneously, ~300-400ms
- Light burst — 8-12 particles per death, short lifespan (~300ms), keeps screen readable in dense waves
- HP bar just disappears when death animation starts — no fade animation on HP bar

**Tower recoil feel**
- Noticeable kick — scale tween 1.0 → 1.15 → 0.95 → 1.0, ~200ms, visible bounce with slight overshoot
- Uniform scale — tower pulses evenly in all directions, no directional aiming
- No color change — recoil is purely a size tween, color feedback reserved for strong-match indicator
- All towers recoil — including Training Beacon (it fires projectiles too, even if support role)

**Strong-match indicator**
- Enemy highlight on hit — enemy briefly flashes the tower's signature color when hit by a strong-match shot (MFA=pink, PATCH=green, etc.)
- Layered flash — red damage flash fires first (~100ms), then tower-colored flash (~150ms), two beats of feedback
- Strong only — no visual for weak-match hits (0.5x damage), only the positive "super effective" signal

**Overall visual intensity**
- Let all effects fire — no cap on concurrent particles/effects, trust that light particle counts (8-12) keep it manageable even in wave 10
- Purely visual — no EventBridge sound hooks, Phase 1 adds SFX independently on the same game events
- Clean and readable tone — effects confirm actions without competing for attention, grid and enemy positions stay easy to read
- Simple circle particle texture — 4x4 or 6x6 pixel circle generated programmatically in BootScene

### Claude's Discretion
- Exact particle spread angle and velocity ranges
- Precise tween easing curve for recoil (Quad, Back, Elastic, etc.)
- Particle fade curve and exact lifespan tuning
- Whether to use Phaser particle emitter or manual sprite-based particles
- Depth layer for particle effects relative to existing layers

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VFX-01 | Enemies fade out with particle burst on death in BreachDefense | Phaser 3.60+ particle emitter explode mode, sprite alpha tween, `time.delayedCall` for sequencing death → destroy |
| VFX-02 | Towers show scale tween recoil when firing in BreachDefense | `tweens.add()` with array keyframes `[1, 1.15, 0.95, 1]`, `Back.easeOut`, fires at `tower.lastFired = time` line |
| VFX-03 | Towers show distinct color pulse when firing at an enemy they're strong against | Extend existing `flashUntil` + `setTint` pattern; add `strongFlashUntil` field using tower `color` hex value; `time.delayedCall` to chain after red flash |
</phase_requirements>

---

## Summary

This phase adds three targeted visual effects to BreachDefenseScene using Phaser 3.90's built-in APIs. No new libraries are required — every capability is available through Phaser's existing tween, particle, and tint systems.

The key technical constraint is the **Phaser 3.60 particle API breaking change**: `ParticleEmitterManager` and `createEmitter()` were removed. The correct pattern is `this.add.particles(x, y, texture, config)` which returns a `ParticleEmitter` directly. This project (STATE.md) already documents this pitfall. The particle texture must be pre-generated in BootScene using the established `graphics.generateTexture()` pattern.

The death effect requires careful sequencing: HP bar hides immediately, sprite tweens (fade + scale down) over ~300ms, particles burst simultaneously at death position, then `sprite.destroy()` fires after the tween completes. The strong-match layered flash extends the existing `flashUntil` time-based pattern already used for the red damage flash — no architectural changes needed, just an additional field on `EnemyData` and a second `time.delayedCall` to chain the tower-color flash after the red phase.

**Primary recommendation:** Implement all three effects directly in `BreachDefenseScene.ts` using Phaser tweens + particles + tinting — no helper classes needed. Pre-generate particle texture in `BootScene.create()`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 (installed) | Tweens, particles, sprite tinting | Already in project — no installs needed |

### Supporting

No additional libraries. All effects use Phaser built-ins:

| API | Purpose | When to Use |
|-----|---------|-------------|
| `this.tweens.add()` | Scale tween (recoil) and alpha tween (death fade) | Any time-based property animation |
| `this.add.particles(x, y, key, config)` | One-shot death particle burst | Phaser 3.60+ particle API |
| `sprite.setTint(color)` / `sprite.clearTint()` | Enemy flash effect (damage + strong-match) | Immediate per-frame color overlay |
| `this.time.delayedCall(ms, fn)` | Sequencing: chain red flash → colored flash, delay sprite.destroy() | Replacing synchronous callbacks |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Phaser particle emitter | Manual sprite-based particles (pool of `Arc` circles) | Manual approach avoids emitter API learning curve but requires hand-rolling particle lifetime, velocity, and cleanup. Emitter handles all that. Emitter wins. |
| `tweens.add()` | Manual update() interpolation for recoil | Manual approach requires per-tower state tracking. Tweens self-clean and are already used in project. Tweens win. |
| `time.delayedCall()` | Additional `flashUntil` field checked per-frame | Per-frame check is already the pattern for red flash. Adding a second `strongFlashUntil` field is the minimal extension that fits the existing architecture. |

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed. All changes are in:

```
client/src/phaser/scenes/
├── BootScene.ts           # Add particle texture generation in create()
└── BreachDefenseScene.ts  # Add all three VFX (death, recoil, strong-match)
client/src/game/breach-defense/
└── constants.ts           # Add THREAT_COLORS map (8 threat → hex color)
```

### Pattern 1: Particle Texture Pre-Generation (BootScene)

**What:** Generate a small circle texture once in `BootScene.create()` before scenes start, available globally.

**When to use:** Any time a programmatic texture is needed for particles or sprites.

```typescript
// Source: established BootScene pattern (generatePlayerTexture, generateNPCTextures)
// In BootScene.create(), before this.scene.start('HubWorld'):
private generateParticleTexture() {
  const g = this.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);          // 6x6 circle, white (tinted at emit time)
  g.generateTexture('particle_circle', 6, 6);
  g.destroy();
}
```

White base texture allows per-emitter tint to produce any color. Matches the established `generatePlayerTexture` / `generateNPCTextures` pattern exactly.

### Pattern 2: Phaser 3.60+ Particle Burst (Death Effect)

**What:** `this.add.particles(x, y, key, config)` returns a `ParticleEmitter` directly. Call `emitter.explode(count)` for one-shot burst, then destroy after lifespan.

**When to use:** Any one-shot visual burst at a world position.

```typescript
// Source: Phaser 3.60+ API — add.particles returns ParticleEmitter, not manager
// Confirmed: docs.phaser.io/phaser/concepts/gameobjects/particles

private spawnDeathParticles(x: number, y: number, color: number) {
  const emitter = this.add.particles(x, y, 'particle_circle', {
    speed: { min: 40, max: 100 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.0, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 300,
    quantity: 10,
    tint: color,
    depth: 18,        // above enemies (15) and HP bars (16-17), below projectiles (20)
    frequency: -1     // explode mode — do not auto-emit
  });
  emitter.explode(10);

  // Auto-destroy emitter after particles expire
  this.time.delayedCall(350, () => {
    if (emitter && emitter.active) emitter.destroy();
  });
}
```

### Pattern 3: Scale Tween Recoil (Tower Firing)

**What:** `tweens.add()` with array keyframes achieves multi-stop scale animation in a single call.

**When to use:** Any sprite that needs a scale bump on an event.

```typescript
// Source: rexrainbow.github.io/phaser3-rex-notes/docs/site/tween/
// Array keyframes: tween interpolates through [start, v1, v2, end] over duration

private playRecoilTween(sprite: Phaser.GameObjects.Sprite) {
  this.tweens.add({
    targets: sprite,
    scale: [1.0, 1.15, 0.95, 1.0],
    duration: 200,
    ease: 'Quad.easeOut',
    interpolation: 'linear'
  });
}
```

Note: `Back.easeOut` also works but affects the whole progression curve, not individual segments. `Quad.easeOut` with linear interpolation between keyframes gives more direct control over the 1.15→0.95→1.0 sequence. Either is acceptable (Claude's Discretion).

### Pattern 4: Layered Flash (Strong-Match Indicator)

**What:** Extend the existing per-frame `flashUntil` tint check pattern. Add a second timestamp field for the tower-colored flash phase that fires after the red phase ends.

**When to use:** Any time a second tint phase follows a first.

EnemyData interface extension:
```typescript
interface EnemyData {
  // ...existing fields...
  flashUntil: number;           // existing: red flash deadline
  strongFlashUntil: number;     // new: tower-color flash deadline
  strongFlashColor: number;     // new: tower color as 0xRRGGBB number
}
```

Update loop extension (in the existing flash block, lines 529–534):
```typescript
// Existing pattern extended for two-phase flash
if (enemy.flashUntil > time) {
  enemy.sprite.setTint(0xff0000);          // phase 1: red damage flash
} else if (enemy.strongFlashUntil > time) {
  enemy.sprite.setTint(enemy.strongFlashColor);  // phase 2: tower-color flash
} else {
  enemy.sprite.clearTint();
}
```

At hit time (in Phase 5 / Phase 6 of update(), at projectile hit):
```typescript
if (isStrong) {
  enemy.strongFlashUntil = time + 120 + 150; // starts after red phase ends
  enemy.strongFlashColor = parseInt(TOWERS[tower.type].color.replace('#', ''), 16);
}
```

### Pattern 5: Death Sequence Orchestration

**What:** Sequence HP bar hide → sprite fade + particle burst → sprite.destroy().

The existing cleanup code at lines 659–665 calls `e.sprite.destroy()` synchronously. Replace with an async sequence using tweens + delayedCall.

```typescript
// Replace dead enemy cleanup block (lines 658-665):
const deadEnemies = this.enemies.filter(e => e.hp <= 0);
for (const e of deadEnemies) {
  // Immediate cleanup
  e.hpBarBg.destroy();
  e.hpBarFill.destroy();

  // Particle burst at death position
  this.spawnDeathParticles(e.sprite.x, e.sprite.y, THREAT_COLORS[e.type]);

  // Sprite fade + shrink tween
  this.tweens.add({
    targets: e.sprite,
    alpha: 0,
    scale: 0.3,
    duration: 300,
    ease: 'Quad.easeIn',
    onComplete: () => { e.sprite.destroy(); }
  });
}
// Remove from enemies array immediately (HP <= 0)
this.enemies = this.enemies.filter(e => e.hp > 0);
```

**Gotcha:** The sprite is removed from `this.enemies` immediately (it has hp <= 0, movement/targeting won't affect it), but the sprite game object stays alive for 300ms during fade. This is safe — Phaser handles orphaned sprites until `destroy()`.

### Pattern 6: THREAT_COLORS Map

THREATS in constants.ts have no `color` field. Add a standalone export:

```typescript
// In constants.ts, after THREATS definition:
export const THREAT_COLORS: Record<string, number> = {
  PHISHING:    0xFF6B35,   // orange-red
  CREDENTIAL:  0xFF2D55,   // bright red
  RANSOMWARE:  0x8B0000,   // dark red
  INSIDER:     0xFFD700,   // gold
  ZERODAY:     0x00FFFF,   // cyan
  BRUTEFORCE:  0xFF4500,   // orange-red
  DEVICETHIEF: 0xA855F7,   // purple
  SOCIAL:      0x10B981,   // teal-green
};
```

Colors chosen for visual distinctiveness at small particle scale. Claude's Discretion applies for exact values.

### Anti-Patterns to Avoid

- **`createEmitter()` — removed in Phaser 3.60:** Never use `this.add.particles().createEmitter()`. The ParticleEmitterManager no longer exists. Use `this.add.particles(x, y, key, config)` directly.
- **Destroying a sprite mid-tween without guard:** Always use `onComplete` callback for `sprite.destroy()` after alpha tween. Do not call `destroy()` in the cleanup loop when a tween is still running.
- **Not guarding `emitter.destroy()` in delayedCall:** Check `if (emitter && emitter.active)` before destroying in the delayed callback, since the scene may have restarted.
- **Setting `strongFlashUntil` relative to current time without accounting for red phase:** The colored flash must start AFTER the red flash ends. Set `strongFlashUntil = time + flashRedDuration + flashColorDuration` (e.g. `time + 120 + 150 = time + 270`).
- **Modifying `this.enemies` array while iterating it:** The dead-enemy cleanup already uses `filter()` — safe pattern, keep it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Particle lifetime + velocity | Custom Arc pool with per-frame position updates | `this.add.particles()` + `emitter.explode()` | Emitter handles velocity, fade, scale, lifespan, and cleanup automatically |
| Multi-stop tween keyframes | Sequential chained tweens (3 `tweens.add()` calls) | Single `tweens.add()` with array keyframes | Array keyframe syntax does this in one call |
| Tween completion callback | `time.delayedCall(200, fn)` for "after recoil" | `onComplete:` in `tweens.add()` config | `onComplete` is tied to actual tween end, not an approximated delay |

**Key insight:** Phaser's tween system handles all edge cases (object destroyed mid-tween, paused scene, stopped timeline). Hand-rolled lerps in `update()` break when the game pauses.

---

## Common Pitfalls

### Pitfall 1: createEmitter() API (CRITICAL — project already documented)

**What goes wrong:** `this.add.particles(x, y, key).createEmitter(config)` throws `TypeError: ... is not a function`.
**Why it happens:** `ParticleEmitterManager` was removed in Phaser 3.60. `this.add.particles()` now returns a `ParticleEmitter` directly.
**How to avoid:** Use `this.add.particles(x, y, key, config)` — config is the fourth argument, not on a chained `.createEmitter()`.
**Warning signs:** Any tutorial or StackOverflow answer showing `.createEmitter()` is pre-3.60. Discard it.

### Pitfall 2: Particle texture not loaded before scene starts

**What goes wrong:** `'particle_circle'` texture key is unknown when BreachDefenseScene tries to emit particles — emitter falls back to missing texture.
**Why it happens:** BootScene generates the texture in `create()` before navigating to HubWorld. If the generation call is missing or after `scene.start()`, the texture may not exist when BreachDefense launches.
**How to avoid:** Add `generateParticleTexture()` call in `BootScene.create()` before `this.scene.start('HubWorld')`. Use `if (!this.textures.exists('particle_circle'))` guard (same as walk cycle textures at lines 194, 223, 249, 277 of BootScene).
**Warning signs:** Particles appear as white rectangles or missing/pink squares.

### Pitfall 3: Sprite destroyed during active tween

**What goes wrong:** Phaser throws error `Cannot set property 'alpha' of undefined` or scene becomes unresponsive.
**Why it happens:** Tween holds a reference to the sprite game object. If `destroy()` is called externally (e.g., during `onRestart()`) while the tween is still running, Phaser tries to update a destroyed object.
**How to avoid:** In `onRestart()`, cancel tweens on sprites before destroying: `this.tweens.killTweensOf(e.sprite)` before `e.sprite.destroy()`. Also add a null-check guard in `onComplete`.
**Warning signs:** Errors only appear on restart mid-death-animation, not during normal play.

### Pitfall 4: EnemyData interface not updated

**What goes wrong:** TypeScript compile error when accessing `enemy.strongFlashUntil`.
**Why it happens:** `EnemyData` interface at lines 10–22 of BreachDefenseScene.ts defines the shape; new fields must be added to both the interface AND the `spawnEnemy()` initialization.
**How to avoid:** Add `strongFlashUntil: 0` and `strongFlashColor: 0` to the enemy object literal inside `spawnEnemy()`.
**Warning signs:** `tsc` (`npm run check`) fails with "Property does not exist on type 'EnemyData'".

### Pitfall 5: Strong-match flash fires on every hit, not once

**What goes wrong:** Each projectile hit during a strong-match resets the colored flash timer, so fast-firing towers produce a continuous color glow rather than distinct pulses.
**Why it happens:** `strongFlashUntil = time + 270` is set on every hit.
**How to avoid:** This is actually acceptable behavior given the "let all effects fire" decision. The pulsing glow during sustained strong-match fire is a reasonable outcome. No special handling needed unless testing reveals it looks wrong.

### Pitfall 6: Particle tint property WebGL-only

**What goes wrong:** Particle `tint` appears white (no tint) in Canvas renderer.
**Why it happens:** Particle tinting is WebGL-only in Phaser 3 per documentation.
**How to avoid:** This project uses Phaser's default renderer which is WebGL (AUTO mode, falls back to Canvas). On modern browsers this is WebGL. Accept that Canvas fallback won't show particle colors — acceptable for an educational game on desktop.
**Warning signs:** Particles all appear white in older browsers or software rendering.

---

## Code Examples

Verified patterns from Phaser 3.90 / official sources:

### Particle Burst at Enemy Death Position

```typescript
// Source: docs.phaser.io/phaser/concepts/gameobjects/particles (Phaser 3.60+ API)
private spawnDeathParticles(x: number, y: number, color: number): void {
  const emitter = this.add.particles(x, y, 'particle_circle', {
    speed: { min: 40, max: 110 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 300,
    tint: color,
    depth: 18,
    frequency: -1
  });
  emitter.explode(10);
  this.time.delayedCall(400, () => {
    if (emitter && emitter.active) emitter.destroy();
  });
}
```

### Tower Recoil Tween

```typescript
// Source: rexrainbow.github.io/phaser3-rex-notes/docs/site/tween/
// Array keyframes interpolate through values: 1.0 → 1.15 → 0.95 → 1.0
private playRecoilTween(sprite: Phaser.GameObjects.Sprite): void {
  this.tweens.add({
    targets: sprite,
    scale: [1.0, 1.15, 0.95, 1.0],
    duration: 200,
    ease: 'Quad.easeOut',
    interpolation: 'linear'
  });
}
```

### Extended Flash Logic (Two-Phase)

```typescript
// Pattern extends existing flashUntil check (BreachDefenseScene.ts:529-534)
// EnemyData interface additions:
//   strongFlashUntil: number;
//   strongFlashColor: number;

// In update() enemy loop (replaces lines 529-534):
if (enemy.flashUntil > time) {
  enemy.sprite.setTint(0xff0000);
} else if (enemy.strongFlashUntil > time) {
  enemy.sprite.setTint(enemy.strongFlashColor);
} else {
  enemy.sprite.clearTint();
}

// At projectile hit (after line 643):
if (isStrong) {
  const RED_DURATION = 120;
  const STRONG_DURATION = 150;
  enemy.strongFlashUntil = time + RED_DURATION + STRONG_DURATION;
  enemy.strongFlashColor = parseInt(
    TOWERS[proj.towerType].color.replace('#', ''), 16
  );
}
```

**Note:** `ProjectileData` currently lacks `towerType`. Either add it as a field when creating the projectile (line 613), or move the strong-match flash to the hit-detection section where `isStrong` is already available from the tower-targeting loop.

### Particle Texture Generation (BootScene)

```typescript
// Source: established BootScene pattern (generatePlayerTexture uses same approach)
private generateParticleTexture(): void {
  if (this.textures.exists('particle_circle')) return;
  const g = this.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);   // center at (3,3), radius 3 — produces 6x6 white circle
  g.generateTexture('particle_circle', 6, 6);
  g.destroy();
}
```

### Death Sequence (Replaces Lines 659–665)

```typescript
// Source: Phaser tween onComplete + time.delayedCall patterns
const deadEnemies = this.enemies.filter(e => e.hp <= 0);
for (const e of deadEnemies) {
  // HP bar: destroy immediately
  e.hpBarBg.destroy();
  e.hpBarFill.destroy();

  // Capture sprite ref for closure
  const dyingSprite = e.sprite;

  // Particle burst at death position
  this.spawnDeathParticles(dyingSprite.x, dyingSprite.y, THREAT_COLORS[e.type]);

  // Sprite fade out tween — destroy in onComplete
  this.tweens.add({
    targets: dyingSprite,
    alpha: 0,
    scale: 0.3,
    duration: 300,
    ease: 'Quad.easeIn',
    onComplete: () => {
      if (dyingSprite.active) dyingSprite.destroy();
    }
  });
}
this.enemies = this.enemies.filter(e => e.hp > 0);
```

### Restart Cleanup (Add to onRestart())

```typescript
// Add before e.sprite.destroy() in onRestart():
this.enemies.forEach(e => {
  this.tweens.killTweensOf(e.sprite);  // cancel any active death tweens
  e.sprite.destroy();
  e.hpBarBg.destroy();
  e.hpBarFill.destroy();
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `this.add.particles(key).createEmitter(config)` | `this.add.particles(x, y, key, config)` — returns emitter directly | Phaser 3.60 | Cannot use old tutorials without adapting |
| Manual particle systems (pool of sprites) | Phaser particle emitter handles pooling internally | Pre-3.60 | Emitter is the right tool for burst effects |
| `Phaser.Math.Easing.*` function objects | String-based ease names `'Quad.easeOut'` | Phaser 3.x | Both work; string form is more readable |

**Deprecated/outdated:**
- `ParticleEmitterManager`: Removed in 3.60 — do not use.
- `createEmitter()`: Removed in 3.60 — do not use.

---

## Open Questions

1. **`isStrong` flag access in projectile hit block**
   - What we know: `isStrong` is calculated at tower-targeting time (lines 584, 600) but not stored on the `ProjectileData` interface. The projectile hit block (lines 640–644) only has access to `proj` and `target`.
   - What's unclear: The cleanest way to carry `isStrong` to the hit block — either add a field to `ProjectileData`, or move the strong-match flash to a parallel structure.
   - Recommendation: Add `isStrong: boolean` to `ProjectileData` interface and set it when creating the projectile (line 613 block). This is a 3-line change with no architectural impact.

2. **Particle `tint` vs `color` config property**
   - What we know: Phaser docs describe both `tint` (single color override) and `color` (array for gradient interpolation). The `tint` approach is simpler and correct for single-color bursts.
   - What's unclear: Whether `tint` in the config object differs from calling `emitter.setParticleTint()` post-creation.
   - Recommendation: Use `tint: colorNumber` in the config object. If it doesn't apply correctly, fall back to `emitter.setParticleTint(colorNumber)` called after creation.

3. **Tower sprite `scale` property baseline**
   - What we know: Towers are created with `setDisplaySize(56, 56)` (line 299), not `setScale()`. `displaySize` and `scale` are different properties.
   - What's unclear: Whether tweening `scale` on a sprite that uses `setDisplaySize` produces expected visual results, or whether `displayWidth`/`displayHeight` should be tweened instead.
   - Recommendation: Test the scale tween on a tower with `setDisplaySize`. Phaser applies display size via scale internally, so tweening `scale` should work correctly. If the visual size appears wrong, switch to tweening `displayWidth` and `displayHeight`.

---

## Validation Architecture

> Skipped — `workflow.nyquist_validation` not present in `.planning/config.json` (no test infrastructure in project).

---

## Sources

### Primary (HIGH confidence)
- [docs.phaser.io — Particles concept page](https://docs.phaser.io/phaser/concepts/gameobjects/particles) — Phaser 3.60+ `add.particles()` syntax, explode mode, config properties
- [docs.phaser.io — ParticleEmitter API](https://docs.phaser.io/api-documentation/class/gameobjects-particles-particleemitter) — `tint`, `COMPLETE` event, `explode()` method
- [docs.phaser.io — Tweens concept page](https://docs.phaser.io/phaser/concepts/tweens) — `tweens.add()` config properties, scale tweening
- BreachDefenseScene.ts (project source) — existing flash pattern lines 529–534, cleanup lines 659–665, targeting lines 582–625
- BootScene.ts (project source) — `generateTexture` pattern, `textures.exists()` guard pattern
- constants.ts (project source) — tower colors (TOWERS[type].color), no THREAT colors currently
- STATE.md (project) — "Phaser particle API broke in 3.60 — use `this.add.particles(x, y, key, config)` syntax, never `createEmitter()`" (confirmed)

### Secondary (MEDIUM confidence)
- [rexrainbow.github.io — Particles notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/particles/) — `explode()`, `stopAfter`, color/tint syntax
- [rexrainbow.github.io — Tween notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/tween/) — array keyframe syntax, interpolation option
- [phaser.discourse.group — Explosion effect thread](https://phaser.discourse.group/t/explosion-effect-with-particle-emitter/12584) — community patterns for one-shot burst + destroy

### Tertiary (LOW confidence)
- WebSearch aggregated results on `tweens.add` with `Back.easeOut` — confirmed available but no direct official example for array keyframes with Back ease combination

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phaser 3.90.0 installed, all APIs are Phaser built-ins, no external libraries
- Architecture patterns: HIGH — verified against project source code (exact line numbers) and official Phaser docs
- Pitfalls: HIGH — critical `createEmitter()` pitfall pre-documented in STATE.md; others verified from project structure
- Open questions: MEDIUM — implementation details that resolve with 5-minute testing, not blockers

**Research date:** 2026-02-28
**Valid until:** 2026-04-30 (Phaser 3.x APIs stable; no fast-moving ecosystem concerns)
