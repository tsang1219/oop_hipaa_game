---
phase: 26-room-visual-uplevel
plan: 02
subsystem: ui
tags: [phaser, pixel-art, sprite-factory, furniture, collectibles, idle-animation, visual-polish]

# Dependency graph
requires:
  - phase: 26-room-visual-uplevel
    plan: 01
    provides: FLOOR_STYLES extraction, per-room floor distinctness — ExplorationScene.ts base for this pass
  - phase: 25-dialogue-portraits
    provides: particle_circle texture in BootScene, same ExplorationScene.ts structure
provides:
  - Detail pass on 8 most-seen furniture textures — 1px silhouette outline + boosted contrast + character details each
  - furn_wall_sconce generator: bracket, trapezoid shade, dual alpha glow blobs
  - furn_bench generator: 26px seat, 3 slat lines, backrest bar — SNES wood palette
  - furnitureTextureKey map extended: wall_sconce, bench, emergency_light, biohazard_sign, glove_dispenser, filing_cart, defibrillator_mount, wheelchair — 16 fallback-desks eliminated
  - Collectible glow up-level: additive gold aura (particle_circle, ADD blend) + periodic sparkle emitter
  - addFurnitureIdleAnimations(room) method: plant sway (all 14 instances), screen flicker + LED blink (server_rack/monitor_bank/vital_monitor), coffee steam puffs (coffee_station)
affects: [27-room-visual-uplevel, visual-qa, playthrough-review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Silhouette outline technique: draw dark outline rect 1px larger before body fills — leaves a 1px dark rim without extra pass"
    - "Type-driven idle animations: iterate room.obstacles by type in a private method, compute px positions from tile coords, attach tweens/timers — scene shutdown cleans them automatically"
    - "Collectible glow: particle_circle scaled to 7 with ADD blendMode at 0.18 alpha; fallback to filled circle if texture missing — never stroke-only"
    - "Phase-jitter pattern: duration/delay + Math.random()*N offsets prevent animations syncing across instances of the same type"

key-files:
  created: []
  modified:
    - client/src/phaser/SpriteFactory.ts
    - client/src/phaser/scenes/ExplorationScene.ts

key-decisions:
  - "Outline approach: draw the silhouette 1px larger in 0x1a1a1a before the existing body fills — minimal code change, reliable 1px rim at 32px"
  - "addFurnitureIdleAnimations() is a plain private method (not a Phaser lifecycle hook) called once at the end of create() — simplest integration, same lifecycle guarantees as inline tweens"
  - "IT Office already had server_rack LED and monitor_bank flicker via room-specific block (DESIGN-007); generic pass also covers these types but the existing IT block stays because it has a more elaborate effect — no double-animation conflict since both target the same positions at similar depths"
  - "Entrance coffee-cart steam kept in the hospital_entrance block (decorative sprite, not a roomData obstacle) — addFurnitureIdleAnimations only reaches roomData obstacles; steam stays for the cart prop"
  - "BlendMode.ADD on the collectible aura: makes it look luminous against any floor without needing per-floor color tuning — matches Zelda-item-glow intent (Commandment 9)"

patterns-established:
  - "Type-driven idle animation pattern: addFurnitureIdleAnimations iterates room.obstacles once; future types can be added by inserting another if-block — no room-specific branching required"
  - "Furniture detail pass pattern: outline → body (existing fills unchanged) → character details — preserves color identity and silhouette; only adds pop"

requirements-completed: [VIS-05, VIS-06]

# Metrics
duration: 7min
completed: 2026-06-10
---

# Phase 26 Plan 02: Furniture Detail Pass + Collectible Glow + Idle Animations Summary

**8 furniture textures gain 1px silhouette outlines and character details; furn_wall_sconce and furn_bench generators eliminate 16 hallway fallback-desks; uncollected educational items pulse with additive gold aura + sparkles; plants sway, screens flicker, and coffee steams in every room via type-driven addFurnitureIdleAnimations().**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-10T07:11:13Z
- **Completed:** 2026-06-10T07:18:34Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Detail pass on 8 highest-frequency furniture generators (desk, table, chair, plant, filing_cabinet, cable_tray, server_rack, vending_machine): each gets a 1px dark silhouette outline, boosted highlights/shadows (+10), and one or two characterful details (desk: paper+pen, table: grain streaks+corner wear, chair: seat stitch line, plant: second leaf cluster+pot rim shine, filing_cabinet: white label slots+ajar drawer shadow, cable_tray: muted colored runs, server_rack: vent slat lines+2px LED dots, vending_machine: product silhouette rows+coin slot)
- Two new generators — furn_wall_sconce (metal bracket, warm trapezoid shade, 0.5/0.25 alpha glow blobs) and furn_bench (horizontal wooden seat, 3 slats, backrest bar, two legs) — plus 8 furnitureTextureKey map entries; 16 hallway wooden-desk fallbacks eliminated
- Educational collectible glow up-leveled: replaced stroke-ring + alpha shimmer with additive gold aura (particle_circle scale 7, tint 0xffd700, ADD blend, alpha 0.18→0.38 yoyo) + sparkle emitter (frequency 1400ms, quantity 2, white+warm-gold tint) — Zelda "this thing matters" twinkle per Commandment 9
- addFurnitureIdleAnimations(room) private method added — plant sway covers all 14 instances across 9 rooms; server_rack/monitor_bank/vital_monitor get CRT screen flicker + LED toggle; coffee_station puffs steam; entrance-only plant sway block removed (dedupe)

## Task Commits

Each task was committed atomically:

1. **Task 1: SpriteFactory detail pass + furn_wall_sconce + furn_bench + map fixes** - `b44c420` (feat)
2. **Task 2: Educational collectible glow + sparkle up-level** - `6b8c31b` (feat)
3. **Task 3: Type-driven furniture idle animations + dedupe + regression gate** - `c73069a` (feat)

## Files Created/Modified

- `client/src/phaser/SpriteFactory.ts` — 8 generator detail passes; furn_wall_sconce + furn_bench new generators; furnitureTextureKey map extended with 8 new entries
- `client/src/phaser/scenes/ExplorationScene.ts` — Educational items block: aura + sparkle replacing stroke-ring; addFurnitureIdleAnimations() private method; create() call site; entrance plant-sway deduped

## Decisions Made

- Silhouette outline drawn as a single filled rect 1px larger than the sprite body before the existing fills — zero line/stroke API calls, consistent result at 32px, no fragile per-edge math
- `addFurnitureIdleAnimations()` is called at the very end of `create()` (after all room-specific blocks) — ensures interactables and obstacles are all placed before animations attach; mirrors the entrance plant-sway precedent
- The existing DESIGN-007 IT Office block (server_rack LEDs + monitor flicker) stays and runs alongside the generic pass — both add visual effects at slightly different depths (DESIGN-007 puts elaborate LED rects at depth 20, generic pass adds a smaller screen glow and single LED dot at depth 20 too); both are additive and don't conflict
- Collectible fallback path is a `filled` circle (never stroke-only) — stroke-only glow at 32px scale is invisible against many floor colors; filled gold circle at 0.12 alpha reads clearly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The one non-obvious detail: the plan says `setBlendMode(Phaser.BlendModes.ADD)` on the aura image — this works correctly in Phaser 3 via `setBlendMode()` directly on the image object. TypeScript accepted it without any type cast needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

VIS-05 and VIS-06 fully implemented. ExplorationScene.ts and SpriteFactory.ts compile clean; production build passes.
Phase 26 Plan 03 (if it exists) or Phase 26 completion can proceed immediately. Live look-check deferred to user per Phase 23-25 precedent — visual changes require browser testing to evaluate.

---
*Phase: 26-room-visual-uplevel*
*Completed: 2026-06-10*
