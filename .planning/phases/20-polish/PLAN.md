# Phase 20 — First-Impression Polish

**Milestone:** v2.2 Sponsor Demo
**Goal:** Fix three known visual/audio bugs that hurt the sponsor demo's first impression.
**Requirements:** FIX-01, FIX-02, FIX-03, FIX-04
**Demo path:** Reception → Emergency Room → Break Room → Medical Records

---

## Plan 20-01: V1 — Player sprite flat on load

**Root cause:** When ExplorationScene creates the player physics sprite via `physics.add.sprite('player_sheet', 0)`, Phaser sometimes does not render the spritesheet frame correctly until `setFrame()` is invoked or an animation plays. The sprite appears as the raw atlas image (showing all 12 frames mashed together) until the first movement key triggers `anims.play()`.

**Fix:**
1. After creating the player sprite, explicitly call `this.player.setFrame(0)` to lock in the idle-down frame.
2. Initialize `this.lastFacingFrame = 0` (already correct) and ensure the breathing tween starts AFTER the frame is set.
3. Same fix applied to HubWorldScene if it has the same pattern.

**Files:**
- `client/src/phaser/scenes/ExplorationScene.ts` (player creation block, ~line 1054)
- `client/src/phaser/scenes/HubWorldScene.ts` (if applicable)

**Verification:** Reception, ER, Break Room, Records — player sprite renders as proper character on initial mount, no flat/garbled atlas frame.

---

## Plan 20-02: V4 — HUD overlay blocks room view on entry

**Root cause:** RoomProgressHUD already has a 1200ms fade-in delay, but DepartmentBreadcrumb (bottom-center) appears immediately at full opacity on every room entry. Combined with the RoomIntroOverlay letterbox bars, the HUD elements visually crowd the screen during the first beat. The breadcrumb especially competes with the intro card.

**Fix:**
1. Add fade-in to DepartmentBreadcrumb so it eases in (~800ms) on room change rather than appearing instantly.
2. Increase RoomProgressHUD slide-in animation: start translated off-screen-right, slide into place as it fades.

**Files:**
- `client/src/components/DepartmentBreadcrumb.tsx`
- `client/src/components/RoomProgressHUD.tsx`

**Verification:** Reception, ER, Break Room, Records — on room entry, the HUD does not block the room view; it eases in gracefully. RoomIntroOverlay can be read clearly without HUD competition.

---

## Plan 20-03: V7 — Loud honk SFX on NPC/zone proximity

**Root cause:** `sfx_breach_alert.ogg` is a loud alarm sound used in two proximity-triggered places that hit during exploration:
1. IT Office encounter zone (volume 0.6) — fires when walking near workstation cluster.
2. Locked door bump (volume 0.4) — fires when walking into a locked door.
Plus `sfx_interact` plays at volume 0.5 when stepping on the Reception/Lab PHI sorter trigger zones — proportional but slightly hot.

The IT Office isn't on the demo path, but the Reception sorter trigger IS — and it plays a loud 0.5-vol cue when the player walks toward the nurse/receptionist NPCs (the trigger is at tile 10,6). The "honk near NPCs" matches the reception PHI sorter trigger sound.

**Fix:**
1. Lower IT Office breach-alert volume from 0.6 → 0.35 (proportional to other alerts).
2. Lower locked-door breach-alert volume from 0.4 → 0.25.
3. Lower PHI Sorter trigger interact SFX from 0.5 → 0.3 (proportional — it's a soft entry cue, not a celebration).

**Files:**
- `client/src/phaser/scenes/ExplorationScene.ts` (3 sound.play call sites)

**Verification:** Walking near NPCs in Reception/ER/Break Room/Records does not produce a jarring loud honk. Audio cues are proportional to the moment (Commandment 8).

---

## Plan 20-04: Verification

**Manual playthrough check:**
- [ ] FIX-01: Player sprite renders correctly on initial load in Reception, ER, Break Room, Records.
- [ ] FIX-02: HUD does not block room view on entry — eases in across all 4 demo rooms.
- [ ] FIX-03: No jarring honk near NPCs in any of the 4 demo rooms.
- [ ] FIX-04: Full-game rooms (Lab, IT Office, hallways) still work — no regressions.

**Build check:** `npm run build` succeeds.
