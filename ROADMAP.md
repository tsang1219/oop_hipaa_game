# Roadmap: PrivacyQuest + BreachDefense

## Milestones

- ✅ **v1.0 Polish** - Phases 1-5 (shipped 2026-03-01)
- 🚧 **v1.1 Sprite Overhaul** - Phases 6-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Polish (Phases 1-5) - SHIPPED 2026-03-01</summary>

### Phase 1: Foundation
**Goal**: Project infrastructure and Phaser integration are in place.
**Plans**: Complete

Plans:
- [x] 01-01: Phaser scaffold + hub world scene

### Phase 2: PrivacyQuest Exploration
**Goal**: Players can walk hospital rooms, interact with NPCs, and make privacy decisions.
**Plans**: Complete

### Phase 3: BreachDefense Tower Defense
**Goal**: Players can place towers, defend against cyber threats, and complete 10 waves.
**Plans**: Complete

### Phase 4: BreachDefense Polish
**Goal**: Combat feels alive with sound, visual feedback, and HUD data surfaced.
**Plans**: Complete

### Phase 5: PrivacyQuest Onboarding
**Goal**: First-time players understand the game and know how to start.
**Plans**: Complete

Plans:
- [x] 05-01: Intro modal + NPC pulse highlight

</details>

---

### 🚧 v1.1 Sprite Overhaul (In Progress)

**Milestone Goal:** Replace all programmatic fillRect sprites with AI-generated PNG pixel art across PrivacyQuest and the Hub World — characters, portraits, furniture, interactive objects, and floor tiles.

**Note on phase structure:** Each phase (6-9) has two kinds of work: automated asset generation (a Node.js script calls Gemini's image generation API to produce PNGs) and code integration (wiring the PNGs into Phaser scenes). Phase 6 builds the generation script infrastructure; subsequent phases reuse it. The user's Gemini API key is stored in `.env` (gitignored).

---

### Phase 6: Character Sprites
**Goal**: Player and all 8 NPCs move with AI-generated 4-direction spritesheets and proper walk cycle animations.
**Depends on**: Phase 5
**Requirements**: CHAR-01, CHAR-02, CHAR-03, CHAR-04
**Success Criteria** (what must be TRUE):
  1. Player character displays a distinct AI-generated pixel art sprite (not a colored rectangle) and animates through walk frames when moving in any direction.
  2. All 8 NPC types (Receptionist, Nurse, Doctor, IT Tech, Compliance Officer, General Staff, Patient, Visitor) display unique AI-generated sprites recognizable by their role outfit.
  3. Walk animations stop and return to idle when movement stops — no looping walk while standing still.
  4. NPCs display a subtle idle animation (breathing or blinking) when standing still.
  5. Walk animations work in both ExplorationScene and HubWorldScene without duplicate registration.
**Plans**: TBD

Plans:
- [ ] 06-01: Build Gemini sprite generation script (`scripts/generate-sprites.ts`) with asset manifest, .env setup, `sharp` for post-processing; generate 9 character spritesheets (player + 8 NPCs) to `attached_assets/generated_images/privacyquest/characters/`
- [ ] 06-02: Load character spritesheets in BootScene, register walk + idle animations, wire ExplorationScene and HubWorldScene to use new sprite keys

### Phase 7: NPC Portraits
**Goal**: NPC dialogue screens show expressive AI-generated character portraits with multiple expression variants instead of placeholder SVG components.
**Depends on**: Phase 6
**Requirements**: PORT-01, PORT-02, PORT-03
**Success Criteria** (what must be TRUE):
  1. All 6 NPC dialogue portraits (Nurse Nina, Dr. HIPAA, Tech Tyler, Officer Knox, Receptionist Rosa, Boss Director) display as AI-generated 128x128 pixel art portraits in dialogue overlays.
  2. The placeholder SVG portrait components are no longer visible anywhere in the application.
  3. Each portrait switches expression during dialogue — at least one emotional variant (happy, stern, or surprised) appears at an appropriate dialogue moment.
**Plans**: TBD

Plans:
- [ ] 07-01: Run generation script for 6 NPC portraits with 2 expression variants each (12 PNGs total) to `attached_assets/generated_images/privacyquest/portraits/`
- [ ] 07-02: Load portrait images in BootScene, update React dialogue overlay components to render portrait PNGs, wire expression variant selection to dialogue state

### Phase 8: Furniture and Interactive Objects
**Goal**: Hospital rooms are furnished with AI-generated pixel art objects, and educational collectibles glow visually distinct from regular furniture.
**Depends on**: Phase 6
**Requirements**: FURN-01, FURN-02, FURN-03, ITEM-01, ITEM-02, ITEM-03
**Success Criteria** (what must be TRUE):
  1. All ~14 hospital room objects (desk, hospital bed, filing cabinet, exam table, server rack, workstation, medicine cabinet, waiting chair, plant, water cooler, whiteboard, poster, computer terminal, bookshelf) display as AI-generated sprites instead of colored rectangles.
  2. At least 3 furniture items display subtle idle animations (server rack lights blink, ceiling fan spins, monitor flickers).
  3. The 4 educational collectibles (Privacy Manual, Security Poster, Training Computer, Incident Report Clipboard) are visually distinguishable from regular furniture at a glance — they glow or sparkle.
  4. Collectibles play a pickup animation sequence when the player interacts with them.
**Plans**: TBD

Plans:
- [ ] 08-01: Run generation script for ~14 furniture PNGs and 4 educational collectible PNGs to `attached_assets/generated_images/privacyquest/furniture/` and `attached_assets/generated_images/privacyquest/objects/`
- [ ] 08-02: Load furniture and object images in BootScene, replace SpriteFactory fillRect objects in ExplorationScene room layouts, add idle animations and collectible pickup sequence

### Phase 9: Floor Tiles
**Goal**: Hospital rooms render with AI-generated tileset floors that match each room's setting, replacing the programmatic checkerboard.
**Depends on**: Phase 8
**Requirements**: TILE-01, TILE-02, TILE-03
**Success Criteria** (what must be TRUE):
  1. All 8 floor tile variants (hospital floor, carpet, lab floor, lobby floor, wall top, wall bottom, door, window) are distinct and recognizable.
  2. The programmatic checkerboard floor is gone — no more alternating colored rectangles anywhere in ExplorationScene or HubWorldScene.
  3. Rooms use the contextually appropriate tile (exam rooms get lab floor, lobby gets lobby floor, admin offices get carpet) with visible wall/floor transitions at room boundaries.
**Plans**: TBD

Plans:
- [ ] 09-01: Run generation script for 8 seamless 32x32 floor tile PNGs to `attached_assets/generated_images/privacyquest/tiles/`
- [ ] 09-02: Load tiles in BootScene, replace programmatic floor rendering in ExplorationScene with tilemap-based rendering using the new tile set

### Phase 10: Final Integration and Cleanup
**Goal**: All sprites are loaded from a unified texture atlas, SpriteFactory.ts is deleted, and no programmatic fillRect textures remain anywhere.
**Depends on**: Phase 9
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. The file `SpriteFactory.ts` no longer exists in the codebase — it has been deleted, not commented out.
  2. ExplorationScene and HubWorldScene reference only new PNG texture keys — no legacy SpriteFactory keys remain.
  3. All PNG sprites (characters, portraits, furniture, objects, tiles) are preloaded in BootScene and available across all scenes.
  4. Sprites are packed into a texture atlas and loaded via `this.load.atlas()` — the number of individual `load.image()` and `load.spritesheet()` calls is replaced by atlas loading.
**Plans**: TBD

Plans:
- [ ] 10-01: Audit all remaining SpriteFactory usage, pack sprites into a texture atlas using the project's existing toolchain, update BootScene to use atlas loading, delete SpriteFactory.ts, verify no broken texture keys

---

## Phase Details

### Phase 6: Character Sprites
**Goal**: Player and all 8 NPCs move with AI-generated 4-direction spritesheets and proper walk cycle animations.
**Depends on**: Phase 5
**Requirements**: CHAR-01, CHAR-02, CHAR-03, CHAR-04
**Success Criteria** (what must be TRUE):
  1. Player character displays a distinct AI-generated pixel art sprite (not a colored rectangle) and animates through walk frames when moving in any direction.
  2. All 8 NPC types (Receptionist, Nurse, Doctor, IT Tech, Compliance Officer, General Staff, Patient, Visitor) display unique AI-generated sprites recognizable by their role outfit.
  3. Walk animations stop and return to idle when movement stops — no looping walk while standing still.
  4. NPCs display a subtle idle animation (breathing or blinking) when standing still.
  5. Walk animations work in both ExplorationScene and HubWorldScene without duplicate registration.
**Plans**: TBD

### Phase 7: NPC Portraits
**Goal**: NPC dialogue screens show expressive AI-generated character portraits with multiple expression variants instead of placeholder SVG components.
**Depends on**: Phase 6
**Requirements**: PORT-01, PORT-02, PORT-03
**Success Criteria** (what must be TRUE):
  1. All 6 NPC dialogue portraits (Nurse Nina, Dr. HIPAA, Tech Tyler, Officer Knox, Receptionist Rosa, Boss Director) display as AI-generated 128x128 pixel art portraits in dialogue overlays.
  2. The placeholder SVG portrait components are no longer visible anywhere in the application.
  3. Each portrait switches expression during dialogue — at least one emotional variant (happy, stern, or surprised) appears at an appropriate dialogue moment.
**Plans**: TBD

### Phase 8: Furniture and Interactive Objects
**Goal**: Hospital rooms are furnished with AI-generated pixel art objects, and educational collectibles glow visually distinct from regular furniture.
**Depends on**: Phase 6
**Requirements**: FURN-01, FURN-02, FURN-03, ITEM-01, ITEM-02, ITEM-03
**Success Criteria** (what must be TRUE):
  1. All ~14 hospital room objects (desk, hospital bed, filing cabinet, exam table, server rack, workstation, medicine cabinet, waiting chair, plant, water cooler, whiteboard, poster, computer terminal, bookshelf) display as AI-generated sprites instead of colored rectangles.
  2. At least 3 furniture items display subtle idle animations (server rack lights blink, ceiling fan spins, monitor flickers).
  3. The 4 educational collectibles (Privacy Manual, Security Poster, Training Computer, Incident Report Clipboard) are visually distinguishable from regular furniture at a glance — they glow or sparkle.
  4. Collectibles play a pickup animation sequence when the player interacts with them.
**Plans**: TBD

### Phase 9: Floor Tiles
**Goal**: Hospital rooms render with AI-generated tileset floors that match each room's setting, replacing the programmatic checkerboard.
**Depends on**: Phase 8
**Requirements**: TILE-01, TILE-02, TILE-03
**Success Criteria** (what must be TRUE):
  1. All 8 floor tile variants (hospital floor, carpet, lab floor, lobby floor, wall top, wall bottom, door, window) are distinct and recognizable.
  2. The programmatic checkerboard floor is gone — no more alternating colored rectangles anywhere in ExplorationScene or HubWorldScene.
  3. Rooms use the contextually appropriate tile (exam rooms get lab floor, lobby gets lobby floor, admin offices get carpet) with visible wall/floor transitions at room boundaries.
**Plans**: TBD

### Phase 10: Final Integration and Cleanup
**Goal**: All sprites are loaded from a unified texture atlas, SpriteFactory.ts is deleted, and no programmatic fillRect textures remain anywhere.
**Depends on**: Phase 9
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. The file `SpriteFactory.ts` no longer exists in the codebase — it has been deleted, not commented out.
  2. ExplorationScene and HubWorldScene reference only new PNG texture keys — no legacy SpriteFactory keys remain.
  3. All PNG sprites (characters, portraits, furniture, objects, tiles) are preloaded in BootScene and available across all scenes.
  4. Sprites are packed into a texture atlas and loaded via `this.load.atlas()` — the number of individual `load.image()` and `load.spritesheet()` calls is replaced by atlas loading.
**Plans**: TBD

---

## Progress

**Execution Order:** 6 → 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | - | Complete | 2026-03-01 |
| 2. PrivacyQuest Exploration | v1.0 | - | Complete | 2026-03-01 |
| 3. BreachDefense Tower Defense | v1.0 | - | Complete | 2026-03-01 |
| 4. BreachDefense Polish | v1.0 | - | Complete | 2026-03-01 |
| 5. PrivacyQuest Onboarding | v1.0 | - | Complete | 2026-03-01 |
| 6. Character Sprites | v1.1 | 0/2 | Not started | - |
| 7. NPC Portraits | v1.1 | 0/2 | Not started | - |
| 8. Furniture and Interactive Objects | v1.1 | 0/2 | Not started | - |
| 9. Floor Tiles | v1.1 | 0/2 | Not started | - |
| 10. Final Integration and Cleanup | v1.1 | 0/1 | Not started | - |
