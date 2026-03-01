# Phase 3: BreachDefense Visual Effects - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Three targeted visual effects for BreachDefense combat: enemy death particle burst, tower firing recoil tween, and strong-match color pulse. These make kills feel confirmed, towers feel active, and counter-relationships visible to the player. No new game mechanics, no sound (Phase 1), no HUD changes (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Death effect style
- Enemy-colored particles — particles inherit the threat type's visual identity (8 distinct colors across threat types)
- Fade + shrink + particles — sprite fades to 0 alpha while scaling down slightly, particles burst outward simultaneously, ~300-400ms
- Light burst — 8-12 particles per death, short lifespan (~300ms), keeps screen readable in dense waves
- HP bar just disappears when death animation starts — no fade animation on HP bar

### Tower recoil feel
- Noticeable kick — scale tween 1.0 → 1.15 → 0.95 → 1.0, ~200ms, visible bounce with slight overshoot
- Uniform scale — tower pulses evenly in all directions, no directional aiming
- No color change — recoil is purely a size tween, color feedback reserved for strong-match indicator
- All towers recoil — including Training Beacon (it fires projectiles too, even if support role)

### Strong-match indicator
- Enemy highlight on hit — enemy briefly flashes the tower's signature color when hit by a strong-match shot (MFA=pink, PATCH=green, etc.)
- Layered flash — red damage flash fires first (~100ms), then tower-colored flash (~150ms), two beats of feedback
- Strong only — no visual for weak-match hits (0.5x damage), only the positive "super effective" signal

### Overall visual intensity
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

</decisions>

<specifics>
## Specific Ideas

- Death visual should reinforce threat identity — "that PHISHING was stopped" readable from particle color alone
- Strong-match flash teaches player which tower-enemy matchups are effective through visual feedback at point of impact
- Think Bloons TD 6 on low settings for visual density reference — not Vampire Survivors
- Requirements doc explicitly says "targeted effects only" and "over-particled games read as noisy"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tower colors already defined in `constants.ts` TOWERS object (e.g., MFA: '#FF6B9D', PATCH: '#2ECC71') — use for strong-match flash
- `isStrong` boolean already calculated at targeting time (BreachDefenseScene.ts:584,600) — just needs visual output
- Existing red damage flash pattern (BreachDefenseScene.ts:530-534): `setTint(0xff0000)` for 120ms via `flashUntil` — extend this pattern for strong-match colored flash

### Established Patterns
- Programmatic texture generation in BootScene (generatePlayerTexture, generateNPCTextures) — same pattern for particle texture
- HP bar uses fill + background rectangles positioned relative to sprite — HP bar cleanup on death is straightforward
- Projectiles created as `this.add.circle()` at depth 20 — particle effects should sit at similar or lower depth

### Integration Points
- Enemy death cleanup at BreachDefenseScene.ts:659-665 — currently `sprite.destroy()`, replace with death animation sequence
- Tower firing at BreachDefenseScene.ts:598-625 — add recoil tween after `tower.lastFired = time`
- Strong-match hit detection at BreachDefenseScene.ts:640-644 — projectile hit section, add colored flash when isStrong
- BootScene.ts:66-76 `create()` method — add particle texture generation before scene start
- Depth system: grid < arrows(1) < hover(5) < towers(10) < enemies(15) < HP bars(16-17) < projectiles(20)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-breachdefense-visual-effects*
*Context gathered: 2026-02-28*
