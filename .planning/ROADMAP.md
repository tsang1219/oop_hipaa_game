# Roadmap: PrivacyQuest + BreachDefense

## Milestones

- v1.0 **Polish** — Phases 1-5 (shipped 2026-03-01) — [archive](milestones/v1.0-ROADMAP.md)
- v1.1 **Sprite Overhaul** — Phases 6-10 (archived partial) — [archive](milestones/v1.1-ROADMAP.md)
- v2.0 **One Game** — Phases 11-15 (in progress)

## Phases

<details>
<summary>v1.0 Polish (Phases 1-5) — SHIPPED 2026-03-01</summary>

See [archive](milestones/v1.0-ROADMAP.md) for phase details.

</details>

<details>
<summary>v1.1 Sprite Overhaul (Phases 6-10) — ARCHIVED PARTIAL 2026-03-26</summary>

### Phase 6: Character Sprites
**Goal**: Player and all 8 NPCs move with AI-generated 4-direction spritesheets and proper walk cycle animations.
**Depends on**: Phase 5
**Requirements**: CHAR-01, CHAR-02, CHAR-03, CHAR-04
**Plans:** 2/2 plans complete
**Success Criteria** (what must be TRUE):
  1. Player character displays a distinct AI-generated pixel art sprite (not a colored rectangle) and animates through walk frames when moving in any direction.
  2. All 8 NPC types (Receptionist, Nurse, Doctor, IT Tech, Compliance Officer, General Staff, Patient, Visitor) display unique AI-generated sprites recognizable by their role outfit.
  3. Walk animations stop and return to idle when movement stops — no looping walk while standing still.
  4. NPCs display a subtle idle animation (breathing or blinking) when standing still.
  5. Walk animations work in both ExplorationScene and HubWorldScene without duplicate registration.

Plans:
- [x] 06-01-PLAN.md — Source 9 character spritesheets from pre-made sprite pack, select and customize for hospital roles, user approval checkpoint
- [x] 06-02-PLAN.md — Load spritesheets in BootScene, register walk + idle animations, wire ExplorationScene and HubWorldScene

### Phase 7: NPC Portraits
**Goal**: NPC dialogue screens show expressive AI-generated character portraits with multiple expression variants instead of placeholder SVG components.
**Depends on**: Phase 6
**Requirements**: PORT-01, PORT-02, PORT-03
**Success Criteria** (what must be TRUE):
  1. All 6 NPC dialogue portraits display as AI-generated 128x128 pixel art portraits in dialogue overlays.
  2. The placeholder SVG portrait components are no longer visible anywhere in the application.
  3. Each portrait switches expression during dialogue — at least one emotional variant appears at an appropriate dialogue moment.
**Plans**: Deferred to v2.1

### Phase 8: Furniture and Interactive Objects
**Goal**: Hospital rooms are furnished with AI-generated pixel art objects, and educational collectibles glow visually distinct from regular furniture.
**Depends on**: Phase 6
**Requirements**: FURN-01, FURN-02, FURN-03, ITEM-01, ITEM-02, ITEM-03
**Success Criteria** (what must be TRUE):
  1. All ~14 hospital room objects display as AI-generated sprites instead of colored rectangles.
  2. At least 3 furniture items display subtle idle animations.
  3. The 4 educational collectibles are visually distinguishable from regular furniture at a glance — they glow or sparkle.
  4. Collectibles play a pickup animation sequence when the player interacts with them.
**Plans**: Deferred to v2.1

### Phase 9: Floor Tiles
**Goal**: Hospital rooms render with AI-generated tileset floors that match each room's setting, replacing the programmatic checkerboard.
**Depends on**: Phase 8
**Requirements**: TILE-01, TILE-02, TILE-03
**Success Criteria** (what must be TRUE):
  1. All 8 floor tile variants are distinct and recognizable.
  2. The programmatic checkerboard floor is gone.
  3. Rooms use the contextually appropriate tile with visible wall/floor transitions.
**Plans**: Deferred to v2.1

### Phase 10: Final Integration and Cleanup
**Goal**: All sprites are loaded from a unified texture atlas, SpriteFactory.ts is deleted, and no programmatic fillRect textures remain anywhere.
**Depends on**: Phase 9
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. The file SpriteFactory.ts no longer exists in the codebase.
  2. ExplorationScene and HubWorldScene reference only new PNG texture keys.
  3. All PNG sprites are preloaded in BootScene and available across all scenes.
  4. Sprites are packed into a texture atlas loaded via `this.load.atlas()`.
**Plans**: Deferred to v2.1

</details>

---

### v2.0 One Game (In Progress)

**Milestone Goal:** Transform PrivacyQuest + BreachDefense from two separate games into one cohesive hospital RPG with continuous navigation, integrated tower defense encounters, and a three-act narrative arc.

---

## Phase Details

### Phase 11: Pre-Restructure Foundation
**Goal**: The codebase is stable and save-format-safe before any restructure begins — known bugs fixed, v1 save data migrated to a single versioned schema.
**Depends on**: Phase 10 (v1.1 archived state)
**Requirements**: FOUN-03, FOUN-04
**Success Criteria** (what must be TRUE):
  1. The game loads in the browser with no console errors related to EventBridge listener leaks, dialogue scoring double-fires, or ExplorationScene shutdown misses.
  2. A returning player's v1.0 localStorage data (14 fragmented keys) is automatically migrated to a single `pq:save:v2` object on first boot — their room completion and score carry over.
  3. A fresh player starts with a clean `pq:save:v2` schema with no residual v1 keys present.
  4. All known pre-restructure bugs documented in FOUN-04 scope are verified fixed before Phase 12 begins.
**Plans:** 4 plans

Plans:
- [x] 11-01-PLAN.md — Create saveData.ts: SaveDataV2 schema, migrateV1toV2, loadSave, writeSave
- [x] 11-02-PLAN.md — Wire migration into PrivacyQuestPage + BreachDefensePage + GameContainer
- [x] 11-03-PLAN.md — ExplorationScene bug fixes: named REACT_ANSWER_FEEDBACK handler + scene.isActive() guards
- [x] 11-04-PLAN.md — PrivacyQuestPage stale closure fixes: functional setState + handleExitRoom dependency

### Phase 12: Unified Navigation
**Goal**: The player walks through a continuous hospital on a single route — door-to-door transitions with visual state, linear department unlock, backtracking, and no room picker.
**Depends on**: Phase 11
**Requirements**: FOUN-01, FOUN-02, NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, NAV-08
**Success Criteria** (what must be TRUE):
  1. The game runs entirely on `/` — navigating to `/privacy` or `/breach` does not exist as a separate experience; all mode switching happens inside Phaser.
  2. Walking into a door triggers a camera fade (~300ms out, black, ~300ms in) and the player appears at the matching door on the other side — standing in the correct position relative to where they entered.
  3. Locked doors display a dark tint with a visual "locked" indicator; available doors pulse with a glow; completed departments show a checkmark badge on their door.
  4. Departments unlock in order (Reception → Break Room → Lab → Records → IT → ER) — the player cannot walk into a locked area.
  5. The player can walk back through a completed department without restriction — completed doors open freely.
  6. The HallwayHub room picker menu is gone — no floating department selection UI exists anywhere.
**Plans:** 4 plans

Plans:
- [x] 12-01-PLAN.md — useGameState hook + UNLOCK_ORDER + EventBridge door constants
- [x] 12-02-PLAN.md — roomData.json: doors[] schema + hallway rooms + hospital_entrance
- [x] 12-03-PLAN.md — ExplorationScene: door detection, visual states, fade transition, spawn position
- [x] 12-04-PLAN.md — UnifiedGamePage + route collapse + HubWorldScene retirement + HallwayHub removal

### Phase 13: Encounter Integration
**Goal**: The inbound tower defense encounter launches from an in-world narrative trigger, runs in a condensed 4-wave format, and feeds results back to the shared game state — the player never leaves the Phaser game instance.
**Depends on**: Phase 12
**Requirements**: ENC-01, ENC-02, ENC-03, ENC-04, ENC-05, ENC-06, ENC-07
**Success Criteria** (what must be TRUE):
  1. Reaching the IT Office narrative trigger launches the tower defense encounter — ExplorationScene pauses in place (player position preserved) and BreachDefense starts as an overlay.
  2. The encounter opens with a narrative context card explaining why it is happening (e.g., "Dr. Patel flagged suspicious logins...") before the first wave begins.
  3. The encounter runs 4 waves with a condensed tower set — it completes in roughly 3-5 minutes.
  4. When the encounter ends, the player is returned to the exact room position they were standing in when it triggered — ExplorationScene resumes without reloading.
  5. The compliance score HUD updates during exploration to reflect both dialogue choices and encounter performance on a single unified meter.
  6. The encounter ends with a debrief screen showing score and 1-2 HIPAA takeaways before returning to the RPG world.
**Plans:** 4 plans

Plans:
- [ ] 13-01-PLAN.md — Encounter constants (ENCOUNTER_WAVES_INBOUND, budgets, towers) + BreachDefenseScene parameterization via init(data)
- [ ] 13-02-PLAN.md — EventBridge encounter events + ExplorationScene sleep/wake lifecycle + IT Office trigger zone
- [ ] 13-03-PLAN.md — NarrativeContextCard + EncounterDebrief + EncounterHud components + PrivacyQuestPage phase state machine
- [ ] 13-04-PLAN.md — Encounter-mode terminal handlers in BreachDefenseScene + unified complianceScore + /breach route removal

### Phase 14: Three-Act Narrative Arc
**Goal**: The game has a felt narrative shape — acts advance based on completion, music shifts between acts, and NPCs acknowledge the player's earlier actions at key moments.
**Depends on**: Phase 12, Phase 13
**Requirements**: NARR-01, NARR-02, NARR-03, NARR-04, NARR-05
**Success Criteria** (what must be TRUE):
  1. The game advances from Act 1 to Act 2 to Act 3 based on department completion and encounter status — the player cannot trigger Act 3 without completing Act 2's requirements.
  2. Music shifts perceptibly between acts without a hard cut — the hub theme plays in Act 1, exploration theme in Act 2, breach theme in Act 3, and the transition crossfades smoothly.
  3. Act transitions happen through environmental cues and music only — no title card, chapter screen, or modal interrupts the player.
  4. At least 2-3 NPCs reference a specific earlier player decision when the player returns to their area — the dialogue text reflects what the player actually chose, not a generic line.
  5. Department ordering in the world matches narrative flow: Reception and Break Room are accessible in Act 1; Lab and Records gate Act 2; IT and ER are Act 3.
**Plans:** 4 plans

Plans:
- [ ] 14-01-PLAN.md — Type contracts: narrative.ts (ActState, DecisionState), ACT_ADVANCE event, Choice flagKey/flagValue schema
- [ ] 14-02-PLAN.md — React act progression: useGameState hook, checkActAdvance in handleExitRoom, decision flag capture
- [ ] 14-03-PLAN.md — Phaser music crossfade: crossfadeToMusic in ExplorationScene, ACT_ADVANCE listener lifecycle
- [ ] 14-04-PLAN.md — NPC variant dialogue: 4 new scenes in gameData.json, getSceneIdForNPC routing in PrivacyQuestPage

### Phase 15: Polish and Completion
**Goal**: Environmental storytelling, department completion fanfares, and a progress breadcrumb HUD make every accomplishment feel earned and the player's journey visible at all times.
**Depends on**: Phase 14
**Requirements**: NARR-06, NARR-07, NARR-08
**Plans:** 3 plans
**Success Criteria** (what must be TRUE):
  1. Hallway connectors between departments contain at least one ambient environmental detail (bulletin board text, prop, or NPC observation line) that changes or shifts between acts.
  2. Completing all NPCs, zones, and items in a department triggers a visible fanfare — a screen flash or sparkle effect, a chime, and a badge or checkmark that persists on the door.
  3. The HUD always shows the player's department completion status and current act — visible during exploration without interrupting play.

Plans:
- [ ] 15-01-PLAN.md — hallwayContent.ts data file (5x3 content matrix) + ExplorationScene hallway board rendering
- [ ] 15-02-PLAN.md — Fanfare sequence: sfx_fanfare audio + EventBridge event + ExplorationScene particle burst + door badge + PrivacyQuestPage in-room trigger
- [ ] 15-03-PLAN.md — DepartmentBreadcrumb React component + PrivacyQuestPage mount

---

## Progress

**Execution Order:** 11 → 12 → 13 → 14 → 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 6. Character Sprites | v1.1 | 2/2 | Complete | 2026-03-02 |
| 7. NPC Portraits | v1.1 | 0/0 | Deferred | - |
| 8. Furniture + Objects | v1.1 | 0/0 | Deferred | - |
| 9. Floor Tiles | v1.1 | 0/0 | Deferred | - |
| 10. Integration + Cleanup | v1.1 | 0/0 | Deferred | - |
| 11. Pre-Restructure Foundation | v2.0 | 4/4 | Complete | 2026-03-27 |
| 12. Unified Navigation | v2.0 | 4/4 | Complete | 2026-03-28 |
| 13. Encounter Integration | v2.0 | 0/4 | Not started | - |
| 14. Three-Act Narrative Arc | v2.0 | 0/4 | Not started | - |
| 15. Polish and Completion | v2.0 | 0/3 | Not started | - |
