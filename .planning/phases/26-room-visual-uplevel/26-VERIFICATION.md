---
phase: 26-room-visual-uplevel
verified: 2026-06-10T00:00:00Z
status: human_needed
score: 7/7 must-haves verified
human_verification:
  - test: "Walk each of the 6 departments + entrance + reception + a hallway; confirm floors read as visually distinct from one another (palette AND pattern, not just color)"
    expected: "Each room has a unique floor identity: ER pale clinical tiles, Lab green grid, IT dark raised panels, Break Room wood planks, Records carpet, Entrance marble, Reception 64px porcelain slabs with navy accent diamonds, hallways teal runner strip"
    why_human: "Floor rendering is canvas-drawn via Phaser Graphics — cannot be verified without running the game in a browser"
  - test: "Walk a hallway; confirm the teal runner strip is visible down the middle row and walls visibly sit on the floor (contact shadow gradient)"
    expected: "Corridor runner visible, walls do not appear to float on the grid"
    why_human: "Visual rendering check"
  - test: "Visit a hallway room and confirm the wall_sconce and bench obstacles render as sconces/benches, not wooden desks"
    expected: "16 fallback-desk instances replaced: wall mount bracket + warm shade for sconces, wooden seat + slats for benches"
    why_human: "Canvas texture output — requires browser"
  - test: "Walk into any room with a plant (entrance, reception, IT office, all 5 hallways); confirm leaves sway independently at slightly different speeds"
    expected: "Green ellipse leaf overlay animates angle -6 to +6 with random phase per plant"
    why_human: "Tween animation — requires running game"
  - test: "Visit IT office; confirm server_rack and monitor_bank show subtle CRT screen flicker + LED blink"
    expected: "Screen glow rect at depth 20 occasionally dims then restores; 2x2 LED dot toggles between bright/dim green every ~900ms"
    why_human: "Timer-driven animation — requires running game"
  - test: "Visit break room; confirm coffee_station puffs steam"
    expected: "White ellipse puffs rise and fade every ~2.6s from coffee station obstacle"
    why_human: "Timer-driven animation — requires running game"
  - test: "Walk into any room with an uncollected educational item; confirm gold pulsing aura + periodic sparkle twinkle"
    expected: "particle_circle image at scale 6-8 with ADD blend mode, tinted gold, pulsing alpha 0.18-0.38; plus sparkle emitter firing 2 particles every 1400ms"
    why_human: "Additive blend mode and particle emitter — requires browser canvas rendering"
  - test: "Confirm the 8 furniture textures pop at 32px — desk, table, chair, plant, filing_cabinet, cable_tray, server_rack, vending_machine all have a readable 1px dark outline"
    expected: "Each sprite has a 1px dark rim (0x1a1a1a) at its silhouette edges, boosted highlight/shadow, and 1-2 character details (e.g., paper+pen on desk, colored cable runs in tray)"
    why_human: "Pixel-art rendering at 32px — requires browser at 1:1 scale or zoomed"
---

# Phase 26: Room Visual Up-Level Verification Report

**Phase Goal:** The six departments and hallways read as distinct, furnished spaces: room-specific floor treatments, an upgraded furniture detail pass on the most-seen objects, visible glow/sparkle on educational collectibles, and idle motion on at least three furniture types.
**Verified:** 2026-06-10
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Reception renders a distinct floor treatment (not shared with hallway default) | VERIFIED | `FLOOR_STYLES` has dedicated `reception` key; `floorStyleFor()` returns `'reception'` for reception id; warm cream porcelain palette 0xe2d8c4 range, 2x2 slab grout, navy diamond at intersections |
| 2 | Hallways render a corridor runner strip — 'hallway_X' resolves to hallway style not a department | VERIFIED | `floorStyleFor()` checks `includes('hallway')` FIRST at line 76 before any department check; runner strip drawn post-loop at `runnerRowY = 3` with teal base 0x3e6b6b @0.55 + dark borders + stitch ticks |
| 3 | Wall/floor contact shadow gradient exists and skips doors/obstacles | VERIFIED | Lines 550-579: 3-step gradient (0.18/0.10/0.05 alpha) in the same `floor` Graphics; excludes door-adjacent columns, obstacle-occupied tiles, and out-of-bounds rows |
| 4 | Floor rendering is a once-per-room-load Graphics pass (no per-frame) | VERIFIED | `const floor = this.add.graphics()` at line 377 inside `create()`. All `floor.*` draw calls appear between lines 377-579. No `floor` reference in `update()` (line 1955+) |
| 5 | VIS-04..06 defined in REQUIREMENTS.md with traceability rows; v2.3 count = 6 | VERIFIED | grep count = 6 (3 definition lines + 3 traceability rows); traceability shows `Phase 26 | Complete` for all three; v2.3 coverage line reads "6 total, mapped: 6, unmapped: 0" |
| 6 | Hallway benches and wall sconces no longer fall back to furn_desk | VERIFIED | `furn_wall_sconce` generator at line 3745, `furn_bench` generator at line 3785; map entries `wall_sconce: 'furn_wall_sconce'` (line 3923) and `bench: 'furn_bench'` (line 3924) exist; 6 one-off type remaps also added (lines 3927-3931) |
| 7 | addFurnitureIdleAnimations() covers plant/server_rack/monitor_bank/vital_monitor/coffee_station; called from create(); entrance plant-sway deduped | VERIFIED | Private method at line 1877, called at line 1870 (end of create()). plant sway block lines 1883-1895, screen flicker + LED block lines 1898-1931, coffee steam block lines 1933-1951. Entrance-only plant sway replaced by comment at line 1317 |

**Score:** 7/7 truths verified (automated checks)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `client/src/phaser/scenes/ExplorationScene.ts` | FLOOR_STYLES, floorStyleFor(), reception/hallway treatments, contact shadow, collectible glow, addFurnitureIdleAnimations | VERIFIED | All components confirmed at lines 20-70 (FLOOR_STYLES), 75-88 (floorStyleFor), 422-548 (room patterns + runner), 550-579 (contact shadow), 925-969 (collectible aura + sparkle), 1877-1953 (idle animations) |
| `client/src/phaser/SpriteFactory.ts` | furn_wall_sconce + furn_bench generators, 8 detail-passed generators, extended furnitureTextureKey | VERIFIED | All 8 `if (!scene.textures.exists('furn_X'))` guards confirmed; 0x1a1a1a silhouette outline comments in desk (458), table (620), chair (794), plant (850); wall_sconce at 3745, bench at 3785; map entries at 3921-3931 |
| `.planning/REQUIREMENTS.md` | VIS-04..06 definitions + traceability rows, v2.3 coverage = 6 | VERIFIED | grep count = 6, coverage line "6 total, mapped: 6, unmapped: 0" confirmed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| FLOOR_STYLES | roomId branch selection | `floorStyleFor()` with `hallway` checked before department names | VERIFIED | `floorStyleFor()` line 75: `hallway` at line 76 is first check — prevents `hallway_reception_break` matching `reception` |
| Floor render loop | room.obstacles wall entries | Contact shadow pass iterates `obs.type === 'wall'`, computes `rowY = obs.y + obs.height` | VERIFIED | Lines 554-579 confirmed |
| SpriteFactory furnitureTextureKey | roomData.json wall_sconce/bench obstacle types | Map entries `wall_sconce: 'furn_wall_sconce'`, `bench: 'furn_bench'` | VERIFIED | Lines 3923-3924 confirmed |
| ExplorationScene idle animation pass | room.obstacles by type | `addFurnitureIdleAnimations(room)` iterates obstacles, branches on `obsType` | VERIFIED | monitor_bank (line 1899), vital_monitor (line 1899), coffee_station (line 1934) all handled |
| ExplorationScene educational item render | particle_circle texture | Guarded `this.textures.exists('particle_circle')` before aura + sparkle emitter | VERIFIED | Lines 927, 958 both guard with exists() check; fallback filled circle at line 945 for missing texture |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VIS-04 | 26-01 | Per-room distinct floor treatment + contact shadow, render-only | SATISFIED | FLOOR_STYLES with 9 distinct entries, contact shadow pass, zero collision diff |
| VIS-05 | 26-02 | 8 furniture detail pass, furn_wall_sconce/bench, collectible glow | SATISFIED | 8 generators with outline code, 2 new generators, aura+sparkle on uncollected items |
| VIS-06 | 26-02 | 3+ furniture types with type-driven idle animation in all rooms | SATISFIED | addFurnitureIdleAnimations covers plant (9 rooms), server_rack/monitor_bank/vital_monitor, coffee_station |

No orphaned requirements found — all three VIS-04..06 were claimed by plans 26-01 and 26-02.

---

### Anti-Patterns Found

None detected. Checked ExplorationScene.ts and SpriteFactory.ts for: TODO/FIXME/PLACEHOLDER comments, `return null`/empty returns in idle animation blocks, console.log-only implementations. The entrance plant-sway deduplication used a comment (`// Plant leaf-sway is now handled generically`) rather than leaving dead code — correct pattern.

---

### Collision / Gameplay Regression Check

`git diff 9a08ee1~1..HEAD -- client/src/phaser/scenes/ExplorationScene.ts` shows **zero added lines** containing `physics.add.staticGroup`, `physics.add.collider`, `this.walls.add`, or `physics.add.sprite`. `roomData.json` diff = 0 lines. Collision-body block still at lines 774/893/900/1584; line numbers shifted up by additions but structure unchanged.

---

### Build Gate

- `npm run check` (tsc): PASS — exits with no output (clean)
- `npm run build` (Vite + esbuild): PASS — 1737 modules transformed, built in 3.60s, only a chunk-size warning (pre-existing)

---

### Human Verification Required

The following require browser playthrough. All automated checks pass; these are live look-check items per Phase 23-25 precedent.

#### 1. Floor distinctness — all rooms

**Test:** Walk each of the 6 departments + entrance + reception + one hallway in sequence.
**Expected:** Every room reads as a visually distinct space without furniture: ER = pale clinical tiles with faint red accents near doors, Lab = green clean-room grid dots, IT = dark raised-panel vents, Break Room = wood plank parquet, Records = carpet dot weave with pile lines, Entrance = marble veining, Reception = 64px cream porcelain slabs with tiny navy accent diamonds, Hallways = muted beige with teal corridor runner strip down center row.
**Why human:** Phaser Graphics canvas output — not readable without rendering.

#### 2. Wall/floor contact shadow

**Test:** Walk up to any wall and look at the floor tiles directly below it.
**Expected:** A subtle 3-step darkening gradient at the top of each floor tile beneath a wall — walls appear grounded, not floating.
**Why human:** Visual subtlety — requires rendered output.

#### 3. Hallway sconces and benches

**Test:** Walk any hallway (e.g., hallway_reception_break).
**Expected:** Wall-mounted sconces (warm shade + glow blob) and wooden corridor benches visible as distinct furniture, not repeated wooden desks.
**Why human:** Canvas texture rendering at 32px.

#### 4. Plant sway in multiple rooms

**Test:** Walk entrance (plants near doors), reception (plant near desk), a hallway with plants, and IT office.
**Expected:** Green leaf ellipse swaying on each plant, each at a slightly different pace due to random jitter.
**Why human:** Tween animation — requires running game.

#### 5. IT office / ER screen flicker + LED blink

**Test:** Enter IT office; observe server_rack and monitor_bank. Enter ER; observe vital_monitor.
**Expected:** Subtle CRT flicker (brief dim every 2-4s), 2x2 LED dot toggling between bright and dim green.
**Why human:** Timer-driven animation.

#### 6. Break room coffee steam

**Test:** Enter break room; observe coffee_station obstacle.
**Expected:** Occasional white puff rising and fading from the station every ~2.6s.
**Why human:** Timer-driven animation.

#### 7. Educational collectible glow + sparkle

**Test:** Enter any room with an uncollected educational item.
**Expected:** Gold pulsing aura (grows and shrinks, additive blend — appears luminous), plus periodic 2-particle sparkle twinkle. Item sprite stays at full alpha (not faded). Collected items show grey tint with no glow.
**Why human:** Additive blend mode and particle system require browser canvas.

#### 8. Furniture detail pass readability at 32px

**Test:** Walk a furnished room and look at desk, filing cabinet, vending machine, server rack.
**Expected:** Each has a 1px dark silhouette outline visible even against lighter floors; identifiable character details (e.g., paper on desk, colored cables in cable tray, product rows in vending machine window).
**Why human:** Pixel-art legibility at 32px — subjective and resolution-dependent.

---

## Gaps Summary

None. All automated must-haves pass. The outstanding items are visual quality checks that require browser rendering per the Phase 23-25 established pattern — they are deferred to the user as human_needed, not gaps.

---

_Verified: 2026-06-10_
_Verifier: Claude (gsd-verifier)_
