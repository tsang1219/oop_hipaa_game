---
phase: 06-character-sprites
verified: 2026-03-02T04:00:00Z
status: gaps_found
score: 8/10 must-haves verified
gaps:
  - truth: "Walk animations play with 3 frames per direction when any character moves"
    status: partial
    reason: "NPC walk animations are registered in BootScene but are never triggered — NPCs are static sprites in ExplorationScene with no movement code that calls anims.play on NPC sprites. Only player walk animations are exercised at runtime. SUMMARY explicitly disclosed this but the plan truth said 'any character,' which includes NPCs."
    artifacts:
      - path: "client/src/phaser/scenes/ExplorationScene.ts"
        issue: "npcTypeFromId() is imported but never called. No NPC sprite receives anims.play() calls. NPCs are created as static sprites with idle breathing tweens only."
    missing:
      - "NPC walk animation playback when NPCs move (or explicit downgrade of this truth to 'player walk only' in this phase — NPC movement is a future-phase concern)"
  - truth: "No animation registration happens in ExplorationScene or HubWorldScene — all registered in BootScene"
    status: partial
    reason: "Verified true for walk animations. However, ExplorationScene calls generateAllTextures(this) in create() which internally calls generateNPCTextures() — this generates programmatic NPC texture keys (not animation registration per se, but texture generation that duplicates BootScene's similar call). Not a blocking issue but worth flagging."
    artifacts:
      - path: "client/src/phaser/scenes/ExplorationScene.ts"
        issue: "Line 97: generateAllTextures(this) called redundantly (BootScene already calls it). The NPC textures it generates (npc_receptionist, npc_nurse, etc.) are the old programmatic ones no longer used for game sprites. Creates cache entries but doesn't conflict with spritesheets."
    missing:
      - "Consider removing or gating the generateAllTextures(this) call in ExplorationScene since BootScene already runs it — the idempotency guard (textures.exists check) prevents actual duplication but the call is unnecessary"
human_verification:
  - test: "Open /privacy in browser, enter a room, walk in all 4 directions"
    expected: "Player sprite shows chibi pixel art (not a colored rectangle), walk animation cycles through 3 frames per direction, stops and shows idle frame when movement stops, breathing tween visible when standing"
    why_human: "Cannot run Phaser canvas rendering in CLI — visual verification required"
  - test: "Navigate to / (hub world) and move player"
    expected: "Player shows pixel art sprite, walk animations play, receptionist NPC shows pixel art with breathing tween"
    why_human: "Cannot run Phaser canvas rendering in CLI"
  - test: "Inspect the character sprites visually in a PNG viewer"
    expected: "Each character is visually distinct by outfit (scrubs vs lab coat vs suit vs hospital gown), chibi proportions, diverse skin tones across the 9 characters"
    why_human: "Visual art quality assessment cannot be automated"
---

# Phase 6: Character Sprites Verification Report

**Phase Goal:** Player and all 8 NPCs move with AI-generated 4-direction spritesheets and proper walk cycle animations.
**Verified:** 2026-03-02T04:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

The ROADMAP provides 5 explicit success criteria. The PLAN frontmatter provides additional truths from both plans. Verification covers all.

**From ROADMAP Success Criteria:**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Player displays distinct pixel art sprite and animates through walk frames in any direction | VERIFIED | `player_sheet` loaded in BootScene line 50; walk_down/up/left/right anims registered in BootScene lines 110-123; `anims.play('walk_left', true)` in ExplorationScene line 350 and HubWorldScene line 161 |
| SC-2 | All 8 NPC types display unique AI-generated sprites recognizable by role outfit | VERIFIED | 10 PNG files confirmed at 96x128 RGBA, 3 cols x 4 rows; each with distinct outfit colors (green scrubs=receptionist, blue scrubs=nurse, white coat=doctor, etc.); CREDITS.md documents all |
| SC-3 | Walk animations stop and return to idle when movement stops — no looping walk while standing | VERIFIED | `anims.stop()` + `setFrame(lastFacingFrame)` in ExplorationScene lines 383-384, 473-474; HubWorldScene lines 184-185; path movement arrival also calls stop+setFrame (ExplorationScene line 473-474) |
| SC-4 | NPCs display subtle idle animation when standing still | VERIFIED | Breathing tween (scaleY 1.0-1.02, Sine.easeInOut, yoyo, repeat:-1) applied to every NPC sprite in ExplorationScene NPC creation loop (lines 195-202); player also gets breathing tween (lines 252-259); HubWorldScene applies to both player and receptionist |
| SC-5 | Walk animations work in both ExplorationScene and HubWorldScene without duplicate registration | PARTIAL | Walk animation registration is exclusively in BootScene — confirmed no anims.create() in ExplorationScene or HubWorldScene. Walk anims play correctly for player in both scenes. NPC walk anims are registered (36 total) but no NPC movement code fires them — NPCs are static in current codebase. |

**From Plan 01 must_haves (CHAR-01, CHAR-02):**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| P01-1 | 9 character spritesheet PNGs exist (1 player + 8 NPC types) | VERIFIED | 10 PNG files exist (9 NPCs + player); note ROADMAP says "8 NPCs" but there are 9 NPC types including visitor; both REQUIREMENTS.md and PLAN list 9 NPC sheets. ROADMAP goal says "8 NPCs" but success criterion 2 lists all 8 distinct types (Visitor is the 8th — visitor count is correct as 8 role types, the 9th PNG is the player) |
| P01-2 | Each spritesheet has 4-direction walk cycle frames (3 frames per direction) | VERIFIED | PIL verification confirms all PNGs are 96x128px = 3 cols x 4 rows x 32x32 frames = 12 frames total; CREDITS.md documents format |
| P01-3 | Characters are visually distinct by outfit | HUMAN NEEDED | Files confirmed at correct size/format; visual distinction requires human inspection |
| P01-4 | Art style is consistent across all 9 sheets | HUMAN NEEDED | Same format across all confirmed; visual consistency requires human review |
| P01-5 | Skin tones are diverse | HUMAN NEEDED | CREDITS.md documents 5 distinct tones; visual verification needed |

**From Plan 02 must_haves (CHAR-03, CHAR-04):**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| P02-1 | Player displays new spritesheet PNG instead of colored rectangles | VERIFIED | ExplorationScene line 246: `'player_sheet', 0`; HubWorldScene line 98: `'player_sheet', 0` |
| P02-2 | All 8 NPC types display their new spritesheet PNG instead of colored rectangles | VERIFIED | `npcTextureKey()` returns `_sheet` keys; ExplorationScene line 189: `this.add.sprite(..., texKey, 0)` with frame 0; all 9 NPC types mapped in SpriteFactory |
| P02-3 | Walk animations play with 3 frames per direction when any character moves | PARTIAL (PLAYER OK, NPC NOT TRIGGERED) | Player walk verified. NPC walk anims registered in BootScene but NPCs are static sprites — `anims.play()` is never called on any NPC sprite. `npcTypeFromId` imported but never invoked in ExplorationScene. SUMMARY disclosed this limitation. |
| P02-4 | Walk animations stop and idle frame displays when movement stops | VERIFIED | `anims.stop()` + `setFrame(lastFacingFrame)` confirmed at all movement-stop points |
| P02-5 | NPCs display subtle idle breathing tween | VERIFIED | Breathing tweens applied to every NPC sprite and player in both scenes |
| P02-6 | Player displays idle breathing tween | VERIFIED | ExplorationScene lines 252-259; HubWorldScene lines 104-111 |
| P02-7 | Walk and idle work in both ExplorationScene and HubWorldScene | VERIFIED (player) | Walk/idle pattern complete for player in both scenes; NPC only in HubWorldScene (receptionist static, breathing tween) |
| P02-8 | No animation registration outside BootScene | VERIFIED | Zero `anims.create()` calls in ExplorationScene or HubWorldScene confirmed |

**Score:** 8/10 truths fully verified (2 partial — NPC walk playback and redundant generateAllTextures call)

### Required Artifacts

**Plan 01 artifacts:**

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `attached_assets/generated_images/privacyquest/characters/player.png` | Player character spritesheet | VERIFIED | 96x128 RGBA PNG, 3x4 grid, 32x32 frames |
| `attached_assets/generated_images/privacyquest/characters/npc_nurse.png` | Nurse NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_doctor.png` | Doctor NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_receptionist.png` | Receptionist NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_it_tech.png` | IT Tech NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_officer.png` | Compliance Officer NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_boss.png` | Boss/Director NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_staff.png` | General Staff NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_patient.png` | Patient NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/npc_visitor.png` | Visitor NPC spritesheet | VERIFIED | 96x128 RGBA PNG |
| `attached_assets/generated_images/privacyquest/characters/CREDITS.md` | License and attribution | VERIFIED | Documents CC0 license, 32x32 frame size, 3-col x 4-row layout, direction order (down/left/right/up), Phaser load config snippet |

**Plan 02 artifacts:**

| Artifact | Expected | Contains Check | Status | Details |
|----------|----------|----------------|--------|---------|
| `client/src/phaser/scenes/BootScene.ts` | Spritesheet loading + animation registration | `this.load.spritesheet` | VERIFIED | 10 `load.spritesheet()` calls (lines 50-59); 4 player walk anims + 36 NPC walk anims registered; all in BootScene |
| `client/src/phaser/scenes/ExplorationScene.ts` | Per-NPC walk animation playback, idle breathing | `anims.play` | PARTIAL | `anims.play('walk_DIR', true)` present for player; NPC sprites created with `_sheet` keys and breathing tweens; `anims.play` for NPCs absent — NPCs are static |
| `client/src/phaser/scenes/HubWorldScene.ts` | Walk animation playback, idle breathing | `anims.play` | VERIFIED | Player uses `anims.play('walk_DIR', true)` and `setFrame(lastFacingFrame)`; receptionist uses `npc_receptionist_sheet` with breathing tween |
| `client/src/phaser/SpriteFactory.ts` | Updated npcTextureKey() + npcTypeFromId() | - | VERIFIED | `npcTextureKey()` returns `_sheet` suffixed keys for all 13 NPC IDs; `npcTypeFromId()` exported with all mappings |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| BootScene.ts | `attached_assets/.../characters/*.png` | `this.load.spritesheet()` in preload() | VERIFIED | 10 `load.spritesheet()` calls with pattern `privacyquest/characters` confirmed at lines 50-59 |
| BootScene.ts | Phaser.Animations.AnimationManager | `this.anims.create()` with `walk_` keys | VERIFIED | `anims.create({ key: 'walk_down' ... })` loop at lines 110-123; NPC anim loop at lines 126-147 |
| ExplorationScene.ts | SpriteFactory.ts | `npcTextureKey()` returns spritesheet key | VERIFIED | Line 3: imports `npcTypeFromId` and `npcTextureKey`; line 188 calls `npcTextureKey(npc.id)` |
| ExplorationScene.ts | Phaser global anims | `anims.play('npc_TYPE_walk_DIR')` | NOT WIRED | Pattern `anims.play.*walk_` for NPCs not found — NPCs are static, no movement code present; only player walk anims triggered |
| HubWorldScene.ts | Phaser global anims | `anims.play('walk_DIR')` for player | VERIFIED | Lines 161-180 confirm all 4 walk directions called via `this.player.anims.play('walk_left', true)` etc. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CHAR-01 | 06-01 | Player character has AI-generated 4-direction spritesheet (32x32, 3 frames/direction) loaded in BootScene | SATISFIED | `player.png` confirmed 96x128 (= 3x32 x 4x32); `player_sheet` loaded at BootScene line 50 with `frameWidth: 32, frameHeight: 32` |
| CHAR-02 | 06-01 | All 8 NPC types have AI-generated 4-direction spritesheets matching player format | SATISFIED | All 10 NPC PNGs confirmed at 96x128 RGBA; all loaded in BootScene lines 51-59 |
| CHAR-03 | 06-02 | Walk cycle animations registered in BootScene and play during movement in ExplorationScene and HubWorldScene | PARTIALLY SATISFIED | Animations registered in BootScene. Player walk anims play in both scenes. NPC walk anims registered but never played — NPCs do not move in current ExplorationScene implementation. REQUIREMENTS.md marks this COMPLETE; code tells a different story for NPCs. |
| CHAR-04 | 06-02 | NPCs display subtle idle breathing/blinking animation when standing still | SATISFIED | Breathing tween (scaleY 1.0-1.02, 1500-2000ms randomized, Sine.easeInOut, yoyo, repeat:-1) applied to every NPC in ExplorationScene NPC loop and to receptionist in HubWorldScene |

**Note on orphaned requirements:** No requirements mapped to Phase 6 in REQUIREMENTS.md exist outside the 4 listed above. No orphaned requirements detected.

**Note on CHAR-03 marking:** REQUIREMENTS.md shows CHAR-03 as `[x] Complete` and STATUS `Complete`. The code satisfies the player portion but NPC walk animation playback during movement is not implemented (NPCs don't move). Whether this is acceptable depends on whether the phase goal ("all 8 NPCs move with...") requires NPC autonomous movement or only that NPCs have their animations ready. The current implementation only does the latter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `client/src/phaser/scenes/ExplorationScene.ts` | 3 | `npcTypeFromId` imported but never called | Warning | Dead import — TypeScript does not error (no `noUnusedLocals` configured). Signals NPC walk animation playback is not wired. |
| `client/src/phaser/scenes/ExplorationScene.ts` | 97 | `generateAllTextures(this)` called again in ExplorationScene.create() | Info | BootScene already calls this. The idempotency guards (textures.exists checks) prevent actual duplication. Harmless but wasteful. |
| `.planning/ROADMAP.md` | Phase 6 plans section | `[ ] 06-02-PLAN.md` checkbox unchecked despite plan being complete | Info | Documentation sync issue — ROADMAP plan-level checkbox was not updated to `[x]` after 06-02 completed. Phase-level header correctly says "2/2 plans complete". |

No blocker anti-patterns found. No TODO/FIXME/placeholder comments in modified files. Build is clean (TypeScript compiles with zero errors, Vite build succeeds in 5.44s).

### Human Verification Required

**1. Player sprite visual quality**

**Test:** Open `/privacy` in browser, enter any room, walk in all 4 directions.
**Expected:** Player sprite shows chibi pixel art character (not a colored rectangle), walk animation cycles through 3 frames per direction (idle pose → foot forward → opposite foot forward), animation stops on the correct idle pose when movement stops, breathing tween visible as subtle vertical scale oscillation.
**Why human:** Phaser canvas rendering cannot be verified in CLI.

**2. NPC sprite visual distinction**

**Test:** In any room with NPCs, observe NPC sprites. Then compare nurse vs doctor vs receptionist sprites side by side.
**Expected:** Each NPC type is immediately recognizable by outfit — blue scrubs for nurse, white coat over teal scrubs for doctor, green scrubs for receptionist, dark navy for officer, hospital gown for patient, yellow-gold casual for visitor.
**Why human:** Visual art quality and role legibility requires human assessment. PIL confirms correct file dimensions but cannot assess visual clarity or outfit readability at runtime scale.

**3. NPC breathing tween feel**

**Test:** Enter any room with multiple NPCs, wait 10 seconds while standing still and watching NPCs.
**Expected:** Each NPC has a subtle vertical scale oscillation (not distracting, not synchronized between NPCs — each breathes at slightly different rate).
**Why human:** Tween feel (subtle vs. distracting, synchronized vs. offset) requires visual assessment.

**4. Hub world sprites**

**Test:** Navigate to `/` (hub world) and observe player and receptionist NPC.
**Expected:** Both show pixel art sprites (not colored rectangles), player walks with animation, receptionist has breathing tween.
**Why human:** Phaser canvas rendering, visual confirmation required.

### Gaps Summary

**Gap 1 (Partial — NPC walk animation playback):** The phase goal states "all 8 NPCs move with... walk cycle animations." The plan truth explicitly requires walk animations play "when any character moves." In the current codebase, NPCs do not move — they are static sprites with idle breathing tweens only. Walk animations for all 9 NPC types are correctly registered in BootScene (36 animations), and `npcTypeFromId()` is exported from SpriteFactory for future use. The SUMMARY for 06-02 proactively disclosed this: "ExplorationScene doesn't currently trigger per-NPC walk animations (NPCs are static sprites in the current codebase). The animation registrations in BootScene and `npcTypeFromId()` helper are in place for when NPC movement is added in a future phase."

This is a scope interpretation issue: the phase set up the infrastructure for NPC walk animations but did not implement NPC autonomous movement. Whether the phase goal is "achieved" depends on whether "NPCs move" means the sprites have walk animations ready, or that NPCs actually patrol/move. Given that the ROADMAP success criteria (#2) focuses on NPCs displaying unique sprites (satisfied) rather than autonomous movement, and NPC movement is not called out in the success criteria, this gap is arguably acceptable as a future-phase concern.

**Gap 2 (Minor — ROADMAP checkbox inconsistency):** The ROADMAP plan checklist shows `[ ] 06-02-PLAN.md` unchecked despite 06-02 being complete. The phase-level metadata correctly says "2/2 plans complete." This is a documentation sync issue that should be corrected.

---

*Verified: 2026-03-02T04:00:00Z*
*Verifier: Claude (gsd-verifier)*
