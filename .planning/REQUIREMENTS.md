# Requirements: PrivacyQuest + BreachDefense

**Defined:** 2026-03-01
**Core Value:** Both games must feel like real games — not prototypes.

## v1.1 Requirements

Requirements for v1.1 Sprite Overhaul. Each maps to roadmap phases.

### Character Sprites

- [ ] **CHAR-01**: Player character has an AI-generated 4-direction spritesheet (32x32, 3 frames per direction: idle + 2 walk frames) loaded in BootScene
- [ ] **CHAR-02**: All 8 NPC types (Receptionist, Nurse, Doctor, IT Tech, Compliance Officer, General Staff, Patient, Visitor) have AI-generated 4-direction spritesheets matching the player format
- [ ] **CHAR-03**: Walk cycle animations are registered in BootScene and play during movement in ExplorationScene and HubWorldScene
- [ ] **CHAR-04**: NPCs display subtle idle breathing/blinking animation when standing still

### NPC Portraits

- [ ] **PORT-01**: 6 NPC dialogue portraits (Nurse Nina, Dr. HIPAA, Tech Tyler, Officer Knox, Receptionist Rosa, Boss Director) are AI-generated at 128x128 pixels
- [ ] **PORT-02**: Portraits replace placeholder SVG components in React dialogue overlays
- [ ] **PORT-03**: Each portrait has at least 2 expression variants (default + one emotion: happy, stern, surprised, etc.) selectable during dialogue

### Furniture & Objects

- [ ] **FURN-01**: ~14 hospital room objects (desk, hospital bed, filing cabinet, exam table, server rack, workstation, medicine cabinet, waiting chair, plant, water cooler, whiteboard, poster, computer terminal, bookshelf) are AI-generated as individual 32x32 or 32x64 PNG sprites
- [ ] **FURN-02**: Furniture sprites replace programmatic fillRect objects in ExplorationScene room layouts
- [ ] **FURN-03**: Select furniture items have subtle idle animations (blinking server rack lights, spinning ceiling fan, flickering monitor)

### Interactive Objects

- [ ] **ITEM-01**: 4 educational collectibles (Privacy Manual, Security Poster, Training Computer, Incident Report Clipboard) are AI-generated with glowing/magical aesthetic at 32x32
- [ ] **ITEM-02**: Interactive objects are visually distinct from regular furniture through glow/sparkle effects
- [ ] **ITEM-03**: Collectibles play a pickup animation sequence when the player interacts with them

### Floor Tiles

- [ ] **TILE-01**: 8 floor tile variants (hospital floor, carpet, lab floor, lobby floor, wall top, wall bottom, door, window) are AI-generated as seamless 32x32 tiles
- [ ] **TILE-02**: Floor tiles replace the programmatic checkerboard floor rendering in ExplorationScene
- [ ] **TILE-03**: Rooms use tilemap-based rendering with proper wall/floor transitions between tile types

### Integration & Cleanup

- [ ] **INTG-01**: All new PNG sprites are preloaded in BootScene (spritesheets via `this.load.spritesheet()`, single images via `this.load.image()`)
- [ ] **INTG-02**: SpriteFactory.ts programmatic textures are fully retired and the file is removed
- [ ] **INTG-03**: ExplorationScene and HubWorldScene use new sprite texture keys instead of SpriteFactory keys
- [ ] **INTG-04**: Sprites are organized in a texture atlas for efficient loading and reduced draw calls

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Visual Polish

- **VPOL-01**: Scene transition animations (camera fade, door opening) between rooms and pages
- **VPOL-02**: Player movement acceleration/deceleration curves for smoother feel
- **VPOL-03**: NPC interaction zoom-in/focus tween before dialogue opens
- **VPOL-04**: BreachDefense tower placement "pop in" scale tween

## Out of Scope

| Feature | Reason |
|---------|--------|
| BreachDefense sprite replacement | Tower/threat PNGs already exist and look good |
| Background music/ambient loops | SFX-only is sufficient for now |
| Animated tile effects (water, sparks) | Complexity beyond MVP visual upgrade |
| Procedural room generation | Rooms are hand-designed, not generated |
| Mobile touch controls | Desktop-first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CHAR-01 | Phase 6 | Pending |
| CHAR-02 | Phase 6 | Pending |
| CHAR-03 | Phase 6 | Pending |
| CHAR-04 | Phase 6 | Pending |
| PORT-01 | Phase 7 | Pending |
| PORT-02 | Phase 7 | Pending |
| PORT-03 | Phase 7 | Pending |
| FURN-01 | Phase 8 | Pending |
| FURN-02 | Phase 8 | Pending |
| FURN-03 | Phase 8 | Pending |
| ITEM-01 | Phase 8 | Pending |
| ITEM-02 | Phase 8 | Pending |
| ITEM-03 | Phase 8 | Pending |
| TILE-01 | Phase 9 | Pending |
| TILE-02 | Phase 9 | Pending |
| TILE-03 | Phase 9 | Pending |
| INTG-01 | Phase 10 | Pending |
| INTG-02 | Phase 10 | Pending |
| INTG-03 | Phase 10 | Pending |
| INTG-04 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
