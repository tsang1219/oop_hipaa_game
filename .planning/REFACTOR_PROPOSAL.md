# Refactor Proposal — Decomposing the Four Monster Files

**Run:** Fable Run 04 (proposal half only — no code has been changed)
**Date:** 2026-07-01
**Status:** AWAITING APPROVAL — nothing moves until the user signs off
**Mode for execution run:** worktree, behavior-preserving only, verification gate after every extraction

Line numbers below reference the files as of commit `673184c` (main). All four files were
read in full; every claim below cites real symbols and line ranges.

| File | Lines | Proposed end state |
|---|---|---|
| `client/src/phaser/SpriteFactory.ts` | 4,005 | ~40-line barrel + 9 modules under `phaser/sprites/` |
| `client/src/phaser/scenes/ExplorationScene.ts` | 3,379 | ~1,300-line scene + 6 modules under `phaser/systems/exploration/` |
| `client/src/phaser/scenes/BreachDefenseScene.ts` | 2,160 | ~1,200-line scene + 3 modules under `phaser/systems/breach/` |
| `client/src/pages/UnifiedGamePage.tsx` | 1,979 | ~1,000-line page + 2 hooks + 1 component + 1 lib module |

Note: the empty directories `client/src/phaser/sprites/` and `client/src/phaser/systems/`
already exist in the repo — they are the intended landing zones.

---

## 1. SpriteFactory.ts (4,005 lines) — safest, do first

### Why it's safe
- **Public surface is tiny:** exactly 5 exports — `generateAllTextures` (line 26),
  `furnitureTextureKey` (3832), `npcTextureKey` (3941), `npcTypeFromId` (3988),
  `objectTextureKey` (3997).
- **Exactly 2 importers:** `BootScene.ts:3` (only `generateAllTextures`) and
  `ExplorationScene.ts:3` (all five).
- **Every texture block is independent and idempotent.** Each of the ~85 blocks is guarded
  by `if (!scene.textures.exists('key'))`, creates its own local `g = scene.add.graphics()`,
  calls `g.generateTexture(...)`, and destroys `g`. There is no cross-block state. Order of
  generation is irrelevant (guards make regeneration a no-op). The only shared code is the
  module-level `darken`/`lighten` helpers (lines 7–22) and `const TILE = 32` (line 3).

### Module map

New directory: `client/src/phaser/sprites/`

| New module | Owns (source lines that move) | Public interface |
|---|---|---|
| `sprites/colorUtils.ts` | `darken`, `lighten` (7–22), `TILE` const (3) | `darken(color, amt)`, `lighten(color, amt)`, `TILE` |
| `sprites/npcTextures.ts` | `NpcStyle` interface + `NPC_STYLES` (33–48), `generateNPCTextures` (49–61), `drawCharacter` (63–257), plus the id→key maps `npcTextureKey` (3941–3983) and `npcTypeFromId` (3985–3992) | `generateNPCTextures(scene)`, `npcTextureKey(id)`, `npcTypeFromId(id)` |
| `sprites/objectTextures.ts` | `generateObjectTextures` (258–451: obj_poster, obj_manual, obj_computer, obj_whiteboard) + `objectTextureKey` (3994–4005) | `generateObjectTextures(scene)`, `objectTextureKey(type)` |
| `sprites/furniture/coreFurniture.ts` | Blocks furn_desk → furn_trash (453–1202): desk, bed, cabinet, table, counter, rack, shelf, chair, plant, clock, water_cooler, filing_cabinet, exam_table, bookshelf, nurse_station, microscope, trash | `generateCoreFurniture(scene)` |
| `sprites/furniture/medicalLabFurniture.ts` | ER blocks (1203–1539: gurney, curtain_partition, iv_stand, crash_cart, vital_monitor, triage_desk, equipment) + Lab blocks (1540–2044: lab_bench, centrifuge, specimen_fridge, bio_cabinet, fume_hood, chemical_shelf, sink_station, eyewash_station, sample_rack, autoclave, results_board) | `generateMedicalLabFurniture(scene)` |
| `sprites/furniture/commonAreasFurniture.ts` | Common/tech (2045–2400: vending_machine, couch, coffee_station, server_rack, monitor_bank, workstation_cluster, whiteboard_wall) + Reception/Entrance (2401–2784: privacy_screen, notice_board, magazine_rack, water_dispenser, info_kiosk, welcome_mat, bulletin_board, flower_arrangement, hand_sanitizer, umbrella_stand) + Break Room (2785–2998: microwave, open_fridge, tv_stand, lost_and_found_box, coat_rack) | `generateCommonAreasFurniture(scene)` |
| `sprites/furniture/officeFurniture.ts` | Records (2999–3338: records_counter, clerk_desk, inbox_tray, outbox_tray, document_cart, shredder_station, scanner_station, archive_box) + IT/hallway/props (3339–3826: monitoring_desk, printer_station, cable_tray, locked_cabinet, coffee_mug, headphones, tissue_box, trash_bin, lunch_table, microscope_station, wall_sconce, bench) | `generateOfficeFurniture(scene)` |
| `sprites/furniture/index.ts` | New ~10-line `generateFurnitureTextures(scene)` that calls the four group functions, plus `furnitureTextureKey` map (3832–3934) | `generateFurnitureTextures(scene)`, `furnitureTextureKey(type)` |
| `SpriteFactory.ts` (kept) | Becomes a barrel: `generateAllTextures` (26–31, now calling the three generators) + re-exports of the four key-map functions | unchanged 5-export surface |

**Round 1 keeps `SpriteFactory.ts` as the barrel so BootScene and ExplorationScene import
lines don't change at all.** Optionally repoint the two importers and delete the barrel in a
final cleanup round — cosmetic, not required.

### Risk notes
- Risk: **near zero.** Code moves verbatim; the split respects existing block boundaries;
  guards make ordering irrelevant. The only real failure mode is a botched copy (dropped
  block, duplicated `const g`), which `tsc` + a screenshot sweep catches immediately.
- Verify: `npm run check` → `npm run build` → `node tests/loop4-capture.mjs` and compare
  all 8 room screenshots against the pre-refactor baseline (see §6 verification protocol).
  Furniture textures are deterministic pixel art — rooms must be furniture-identical.

---

## 2. ExplorationScene.ts (3,379 lines)

### Internal region map (evidence)

- **Module-level data:** `FLOOR_STYLES` + `floorStyleFor` (24–89), `MUSIC_TRACK_KEYS`
  (93–100), `isQANoEncounter` QA gate (106–120), `InteractableData` interface (122–127).
- **~40 instance fields** (137–211) — the coupling web that constrains extraction.
- `init()` (217–277) — state reset + spawn-door resolution.
- `create()` (279–1895, **~1,620 lines** — the monster inside the monster):
  - camera fade reset (280–283), `generateAllTextures` (290), `player_down` fallback texture (292–386)
  - camera/world bounds (388–400)
  - **floor rendering** (402–574): per-tile bevel/grout/specular loop + per-room patterns + hallway runner
  - wall/floor contact shadows (576–605), room ambient tints (608–623)
  - **wall + decor rendering** (625–928): baseboards, per-room wall decorations, light pools (736–754), ambient dust particles (756–797), wall brick rendering + furniture sprites + physics collision bodies (799–928)
  - **interactable spawning** (930–1240): educational items + glow auras (930–1000), hallway bulletin board (1002–1065), interaction zones + zoneGlows (1067–1106), NPCs + labels + speech bubbles + boss ring (1108–1240)
  - **per-room "life pass" ambience** (1242–1524): ER (1242–1273), Reception (1275–1302), first-NPC pulse (1304–1318), Lobby (1320–1346), Break Room (1348–1380), Records (1382–1418), Lab (1420–1449), IT Office (1451–1482), Hallways (1484–1524)
  - player spawn + camera + shadow/label (1526–1619)
  - door visuals kickoff + legacy exit glow (1621–1652)
  - input wiring (1654–1687), HUD texts (1689–1710), vignettes (1712–1744)
  - EventBridge listener registration (1746–1773), BGM start/reclaim (1775–1831)
  - entrance fade + room banner (1833–1880), `SCENE_READY` + QA listeners (1881–1887)
- `addFurnitureIdleAnimations` (1901–1977) — type-driven furniture idle anims (plant sway, screen flicker, coffee steam).
- `update()` (1979–2167) — movement, footsteps, proximity, idle-hint trigger, IT-office encounter proximity check, door proximity, throttled `EXPLORATION_STATE_UPDATE` broadcast.
- `shutdown()` (2169–2207) — 17 `eventBridge.off` calls mirroring create().
- QA command handlers (2211–2305).
- **Music system** (2307–2403): `onMusicVolume`, `activeMusicBaseVolume`, `onActAdvance`, `crossfadeToMusic`, `findPlayingTrack`, `startMusicTrack`, `onPlaySfx`.
- Fanfare handler (2407–2436), `getCurrentAct` (2440–2449).
- **Encounter lifecycle** (2451–2583): `triggerEncounter`, `onLaunchEncounter` (scene sleep/launch), `onReturnFromEncounter`, `handleWakeFromEncounter` (includes its own BGM-restore copy at 2550–2582).
- **Door system** (2585–2847): `checkDoorProximity`, `handleDoorInteraction`, `renderDoorStates` (2671–2812 — the 4-state locked/next/available/completed visuals), `onLoadRoom`, `onUpdateDoorStates`, `onDoorLocked`.
- Idle-hint sparkles: `emitIdleHint` (2621–2669).
- **Pathfinding** (2849–2901): `findPath` (BFS), `tileBlocked`.
- Path movement + proximity + interaction (2903–3160): `startPathMovement`, `checkProximity`, `triggerInteraction` (includes NPC `encounterTrigger` branch at 3057–3079).
- Answer feedback VFX (3162–3217), dialogue resume (3219–3262), NPC pulse stop (3264–3273).
- **Completion visuals** (3275–3378): `addCompletionCheck`, public `updateCompletionState` — **called from React** via `gameRef.current.scene.getScene('Exploration')` at `UnifiedGamePage.tsx:1233–1240`. This method name/location must survive (or that call site updates in the same commit).

### Module map

New directory: `client/src/phaser/systems/exploration/`. Pattern: **free functions taking
`(scene, room, ...)`** for render-only code; **one small class** for the two genuinely
stateful systems (music, doors). The scene keeps its fields and delegates.

| New module | Owns (lines that move) | Public interface | Why safe |
|---|---|---|---|
| `pathfinding.ts` | `findPath` + `tileBlocked` (2849–2901) | `findPath(room, start, goal): Position[]` | Pure functions of `room` — only `this.room` is read. Zero side effects. |
| `roomRenderer.ts` | `FLOOR_STYLES` + `floorStyleFor` (24–89), floor loop + runner (402–574), contact shadows (576–605), tints (608–623), decor + light pools + dust (625–797), walls/furniture/collision (799–928), vignettes (1712–1744), room banner (1833–1880), `player_down` fallback (292–386) | `renderRoom(scene, room): { walls: StaticGroup }` (+ `renderVignette(scene)`, `showRoomBanner(scene, room)`) | Draw-only. Writes no scene fields except returning `walls`. All objects registered on `scene.add`/`scene.physics`, so shutdown/tween cleanup is unchanged. |
| `interactableFactory.ts` | Items (930–1000), hallway board (1002–1065), zones (1067–1106), NPCs (1108–1240) | `spawnInteractables(scene, room, ctx): { interactables: InteractableData[]; zoneGlows: Map<...> }` where `ctx` = completed sets + `getCurrentAct()` + `addCompletionCheck` callback | Loops only read `room` + completion sets and push to arrays the scene stores. `InteractableData` type moves here. |
| `roomAmbience.ts` | Per-room life passes (1242–1524, minus the first-NPC pulse 1304–1318 which stays — it touches `npcPulseTween`/`npcPulseTarget` fields) + `addFurnitureIdleAnimations` (1901–1977) | `addRoomAmbience(scene, room, interactables, act)` | Reads `interactables` to find fidget targets; all timers/tweens go through `scene.time`/`scene.tweens`, so `shutdown()`'s `tweens.killAll()` still cleans up. |
| `MusicController.ts` (class) | `MUSIC_TRACK_KEYS` (93–100), BGM start/reclaim (1775–1831), `onMusicVolume` (2307–2312), `activeMusicBaseVolume` + `onActAdvance` + `crossfadeToMusic` + `findPlayingTrack` + `startMusicTrack` (2314–2391), wake-restore BGM block (2550–2582 — currently a near-duplicate of the create() block; keep both call paths, share one `startRoomMusic()` method) | `new MusicController(scene)`; `.startRoomMusic(room, act)`, `.crossfadeTo(track, baseVol?)`, `.setUserVolume(v)`, `.fadeOutForDoor()`, `.killForEncounter()`, `.release()` (shutdown) | The one genuinely stateful audio object (`bgMusic`, `activeMusicBaseVolume`). All `scene.isActive()` guards move verbatim. ExplorationScene keeps the eventBridge subscriptions and delegates. |
| `DoorSystem.ts` (class) | `checkDoorProximity` (2587–2601), `handleDoorInteraction` (2603–2619), `renderDoorStates` (2671–2812), plus the fields `doorStates`, `doorVisuals`, `nearDoor` | `.render()`, `.checkProximity(px, py)`, `.enter(door)`, `.setStates(states)`, `.nearDoor` getter | Encapsulates door state. **Caution:** `update()` (2124–2130), `checkProximity()` prompt fallback (3014–3021), and QA handlers (`onQAPressSpace` 2244–2247, `onQANavigateDoor` 2264–2305) read `nearDoor`/`transitioning` — `transitioning` STAYS on the scene (it also gates idle hints and movement); only door-local state moves. |
| `idleHints.ts` (optional, small) | Constants (17–19) + `emitIdleHint` (2621–2669) | `emitIdleHint(scene, room, interactables, completedSets, index): void` | Self-contained; reads completion sets. Low value on its own — fine to fold into `interactableFactory.ts` instead. |

**Explicitly NOT moving (ExplorationScene):**
- `update()` (1979–2167) — the frame loop touches nearly every field (movePath, paused,
  transitioning, tile tracking, footstep throttle, QA broadcast). Splitting it creates
  getter/setter churn with no clarity gain.
- **Encounter lifecycle** (2451–2583 minus the BGM sub-block) — `scene.sleep()`/`launch()`/
  `wake()` choreography plus the `paused`/`encounterTriggered`/`encounterLaunching` flag
  dance documented in Phase 16 BLOCKER 1 comments (2530–2541). This is the most
  bug-historied code in the file; it is only ~130 lines; moving it re-risks solved bugs.
- Movement/interaction core: `startPathMovement`, `checkProximity`, `triggerInteraction`
  (2903–3160) — shares `movePath`/`moveTimer`/`pendingInteraction`/`paused`/
  `lastFacingFrame` with `update()`; the NPC `encounterTrigger` branch also couples to the
  encounter lifecycle. Not worth the risk.
- QA handlers (2211–2305), answer-feedback VFX (3162–3217), dialogue resume/focus juggling
  (3219–3262), `init`/`shutdown`/listener wiring, `updateCompletionState` (public API
  React reaches into — signature and location frozen).

Estimated result: **3,379 → ~1,300 lines**, with `create()` shrinking to ~150 lines of
orchestration calls.

---

## 3. BreachDefenseScene.ts (2,160 lines)

### Internal region map (evidence)

- Types + `BreachDefenseInitData` (8–64) — `BreachDefenseInitData` is imported by both
  `ExplorationScene.ts:11` and `UnifiedGamePage.tsx:47` (type-only).
- `init()` (133–172), `getActiveWaves()` (174–176).
- Encounter result emission (179–224): `onEncounterVictory`/`onEncounterGameOver` — write
  `registry.set('encounterResult_...')` and emit `ENCOUNTER_COMPLETE`.
- `create()` (226–777, ~550 lines): grid/circuit-board drawing (226–353), path glow/edges/
  portals (355–439), header bar + labels (441–499), bottom terminal panel (501–539),
  vignette (541–558), scanline (560–575), corner brackets (577–606), hover/range indicators
  (608–616), pointer input (618–683), EventBridge listeners (685–693, 726), BGM (695–724),
  camera centering (728–747), ready/fade/startup text (749–777).
- Event handlers (781–954): tower select, start, next-wave, tutorial dismiss, prep
  countdown (850–903), restart (905–954).
- `placeTowerAt` (958–1115): ~45 lines of game logic (validation, budget, TowerData,
  `BREACH_TOWER_PLACED` emit) + **~100 lines of placement VFX** (1000–1105: particle burst,
  scale pulse, base glow, status ring, glow ring, label, tower-link lines).
- `spawnEnemy` (1119–1193): HP scaling + sprite + HP bars.
- VFX helpers (1197–1226): `spawnDeathParticles`, `playRecoilTween`.
- `getTrainingBuff` (1230–1244), onboarding highlights (1248–1285), `broadcastState`
  (1287–1300), `activateWave` (1302–1329).
- `update()` (1333–2120, ~790 lines) — 7 phases: wave spawning + **wave-complete
  celebration** (1384–1449) + **victory celebration** (1502–1573) + standalone-pause vs
  encounter-auto-advance fork (1484–1497); enemy movement + trail ghosts (1588–1660);
  breach detection + **game-over glitch text** (1662–1751); danger vignette (1753–1776);
  tower targeting/firing + beam/recoil/range-flash VFX (1778–1871); projectile movement +
  impact VFX + damage numbers (1873–1952); cleanup + death VFX + kill streak (1954–2077);
  HUD text + dynamic music volume (2079–2119).
- `shutdown()` (2128–2159).

### Module map

New directory: `client/src/phaser/systems/breach/`. Strategy: **extract the draw-only and
fire-and-forget VFX code; leave the simulation (spawning, movement, targeting, damage,
economy) intact.** The simulation is a tightly wound ECS-lite over three arrays
(`enemies`/`towers`/`projectiles`) — carving it into WaveSystem/CombatSystem classes would
be a redesign, not a refactor.

| New module | Owns (lines that move) | Public interface | Why safe |
|---|---|---|---|
| `gridRenderer.ts` | Grid + circuit traces (226–353), path glow/edges/portals (355–439), header (441–499), bottom panel (501–539), vignette (541–558), scanline (560–575), brackets (577–606), startup text (756–776) | `renderBattlefield(scene): { headerText, statusText, statusCursor, waveCounterText, scanLine }` | Draw-only; returns the 5 text/rect handles the scene stores as fields (they're mutated later by update()/handlers). Deterministic (seeded rand at 242–246 moves with it). |
| `battleVfx.ts` | Tower placement VFX (1000–1105), `spawnDeathParticles` + `playRecoilTween` (1197–1226), enemy spawn entrance tween (1144–1174), impact particles + damage numbers (1896–1932), trail ghosts (1619–1633), projectile trail (1941–1950), kill labels (1966–1993), breach border flash (1676–1687) | Free functions: `playTowerPlacementFx(scene, sprite, px, py, color, range)`, `spawnDeathParticles(scene, x, y, color)`, `playRecoilTween(scene, sprite)`, `showDamageNumber(...)`, `showKillLabel(...)`, etc. | Fire-and-forget: each creates objects, tweens them, destroys on complete. No simulation state read or written (damage numbers receive values as args). |
| `celebrationVfx.ts` | Wave-cleared celebration (1384–1449), victory celebration (1502–1573), game-over glitch sequence (1700–1740), prep countdown visuals (854–901 — the text/tween part; the `activateWave` call stays behind a callback) | `playWaveClearedFx(scene, wave, kills)`, `playVictoryFx(scene)`, `playGameOverFx(scene)`, `runPrepCountdown(scene, seconds, onDone)` | Same fire-and-forget pattern; the state transitions (`this.wave++`, stipends, `gameState = 'PAUSED'`) stay in the scene, only the spectacle moves. |

**Explicitly NOT moving (BreachDefenseScene):**
- The `update()` simulation skeleton — wave spawn scheduling (1344–1367), the
  standalone-pause vs encounter-auto-advance fork (1484–1497 — this is the Phase 19
  behavioral fork, easy to silently break), enemy waypoint movement math (1588–1618),
  breach detection + scoring (1662–1697), tower targeting/strong-weak scoring (1778–1871),
  projectile hit resolution (1873–1952), kill-streak bookkeeping (2021–2077).
- Encounter result emission (179–224) — registry writes + `ENCOUNTER_COMPLETE` payloads
  are contract with UnifiedGamePage and ExplorationScene. 45 lines, high blast radius.
- `placeTowerAt` game logic (958–999, 1106–1115), `spawnEnemy` data setup, `init`/
  `onRestart` state resets, `broadcastState`, `shutdown`.
- `BreachDefenseInitData` stays exported from this file (2 external type importers).

Estimated result: **2,160 → ~1,200 lines**; `update()` shrinks from ~790 to ~400.

---

## 4. UnifiedGamePage.tsx (1,979 lines)

### Internal region map (evidence)

- Imports + `SORTER_LOCATION_LABELS` (1–67), `RoomWithDoors` (69–95), `PageMode` +
  `TDStandaloneResult` (97–113), module-level `rooms`/`scenes`/`migrateV1toV2` (115–120).
- **Door-graph pure functions** (122–203): `DoorState` type, `deriveNextTargetRoom`,
  `findFirstHopDoorId` (BFS over room doors), `computeDoorStates`.
- Component state block (205–362): ~20 useState/useRef declarations.
- Persistence effect (371–396), score-delta effect (398–415), milestone effect (417–439),
  QA-bridge sync (441–449), gate-load effect (451–469), mute effect (471–477).
- Gate helpers `isNpcGated`/`resolveGate` (479–514), QA auto-nav (516–537).
- Boot → start Exploration effect (539–599), room-completion check + auto-complete effect
  (601–643), `handleExitRoom` (645–741 — includes the Phase 21 demo-capstone fork).
- Exploration event listeners (743–848): interact NPC/zone/item + exit-room.
- **Standalone TD block** (850–1021): `handleSelectTowerDefense`/`handleTdPlayAgain`/
  `handleTdBackToMenu` (860–878), scene-launch polling effect (887–921), wave-1 prep
  effect (923–947), result listeners (949–980), wave-pause listener (982–1001),
  Esc-to-menu (1003–1013), helper hint (1015–1021), plus state at 280–286.
- **Encounter phase machine** (288–322 state, 1023–1228 logic): `EncounterPhase` union
  (`idle | narrative-card | encounter | phi-sorter | breach-triage | debrief`),
  `narrativeCardData`/`encounterResult`/`encounterRequest` state; listeners for
  `ENCOUNTER_TRIGGERED`/`ENCOUNTER_COMPLETE`/`ENCOUNTER_REQUEST` (1024–1080); handlers
  `handleAcceptEncounterRequest` (1085–1108), `handleDeclineEncounterRequest` (1112–1115),
  `handleConfirmNarrativeCard` (1117–1128), `handleDeclineNarrativeCard` (1130–1135),
  `handleDismissDebrief` (1137–1147 — note BLOCKER 3 ordering comment), `handleSorterAbort`
  (1151–1156), `handleTriageComplete` (1160–1194), `handleSorterComplete` (1196–1228).
- Completion sync into Phaser (1230–1241 — the `getScene('Exploration') as any` reach-in).
- Dialogue/game-over/story handlers (1243–1394), demo-Esc (1396–1418).
- Render branches (1437–1606): start-menu, character-select, **tower-defense-standalone
  JSX** (1467–1550), title, demo-complete, win/gameover, story modal.
- Main game JSX (1608–1884): encounter overlay routing (1637–1731 — SorterContextCard vs
  NarrativeContextCard; TriageDebrief vs SorterDebrief vs EncounterDebrief discrimination),
  score delta, dialogue overlay, modals.
- `StandaloneTDResultOverlay` component (1887–1979).

### Module map

| New module | Owns (lines that move) | Public interface | Why safe |
|---|---|---|---|
| `client/src/lib/doorGraph.ts` | `DoorState` type, `deriveNextTargetRoom`, `findFirstHopDoorId`, `computeDoorStates` (122–203) + the `RoomWithDoors` interface (69–95) | same four names + types; takes `rooms` as a parameter (or imports the rooms constant from a tiny `lib/roomRegistry.ts` that owns lines 115–120) | Pure functions over static JSON. Only inputs: `room`, `completedRooms`, `isDemoActive()`, `isDepartmentAccessible`/`UNLOCK_ORDER` (already imported from `useGameState`). Three call sites inside this file (527, 552, 633, 728) update mechanically. |
| `client/src/components/breach-defense/StandaloneTDView.tsx` | `StandaloneTDResultOverlay` (1887–1979) + the entire `tower-defense-standalone` render branch (1467–1550) incl. its inline keyframes | `<StandaloneTDView gameRef result wavePause waveBanner helperVisible onStartNextWave onPlayAgain onBackToMenu onDismissHelper />` | Pure presentation — all state stays in (or moves with) the hook below; JSX moves verbatim. |
| `client/src/hooks/useStandaloneTD.ts` | State (280–286) + handlers/effects (860–878, 887–921, 923–947, 949–980, 982–1001, 997–1013, 1015–1021) | `useStandaloneTD(active: boolean, gameRef): { result, waveBanner, helperVisible, wavePause, handlers... }` | Every effect in this block is already self-gated by `if (pageMode !== 'tower-defense-standalone') return;` — the block is a ready-made hook. Zero gameState writes by design (TD-02/TD-03 comments), so no save-format risk. |
| `client/src/hooks/useEncounterFlow.ts` | `EncounterPhase` type + the three state slices (288–322), listeners (1023–1080), all eight handlers (1085–1228), `SORTER_LOCATION_LABELS` (62–67) | `useEncounterFlow(gameState): { encounterPhase, narrativeCardData, encounterResult, encounterRequest, handleAccept..., handleDismissDebrief, ... }` | The phase machine is a closed subsystem: its only external couplings are `gameState.addScore` / `gameState.recordEncounterResult` (passed in) and eventBridge emits. The overlay-routing JSX (1637–1731) stays in the page but reads only hook outputs. |

**Explicitly NOT moving (UnifiedGamePage):**
- `pageMode` routing + the render-branch ladder (1437–1606) — it IS the page.
- The consolidated persistence effect (371–396) — the save-format writer; guardrail #5
  says don't touch save format; leave it visibly in the page.
- Boot/scene-ready effect (539–599) and `handleExitRoom` (645–741) — they interleave
  `gameState`, demo session, door states, and Phaser scene start; the demo-capstone fork
  (686–702) is behavior-critical. High coupling, modest size.
- Exploration event listeners (743–848) — coupled to gates, toast, dialogue pageMode.
- Gate helpers + gate refs (324–333, 479–514) — candidates for a `useGates` hook someday,
  but they thread through both the NPC listener and dialogue completion; defer.
- Completion sync reach-in (1230–1241) — must stay next to `gameRef`.

Estimated result: **1,979 → ~1,000 lines.**

---

## 5. Recommended execution order

Each round = one focused extraction + full verification gate + one commit. Stop the round
if any gate fails; fix or revert before proceeding. Order goes safest → riskiest so early
rounds build the verification muscle before the stateful moves.

| Round | Extraction | Risk | Gate focus |
|---|---|---|---|
| 0 | **Baseline capture** (no code change): `npm run check`, `npm run build`, `node tests/loop4-capture.mjs` → copy `screenshots/loop4/` to `screenshots/refactor-baseline/`; also run `tests/loop4-encounters.mjs` and the `tests/progression/` suites to record the passing set | — | establishes the comparison target |
| 1 | SpriteFactory → `sprites/` (9 modules + barrel) | very low | all 8 room screenshots furniture-identical |
| 2 | UnifiedGamePage → `lib/doorGraph.ts` + `StandaloneTDView.tsx` (component move only, state still in page) | low | door states (locked X / gold next-pulse / checkmarks) in reception + hallway shots; standalone TD boot |
| 3 | ExplorationScene → `pathfinding.ts` + `roomRenderer.ts` | low | click-to-move works (progression suite); floors/walls/vignette pixel-compare |
| 4 | ExplorationScene → `interactableFactory.ts` + `roomAmbience.ts` (+ `idleHints` if kept separate) | low-med | NPC labels/bubbles/glows present; ER nurse patrol + break-room LED still animate; idle sparkle fires after 9s idle |
| 5 | BreachDefenseScene → `gridRenderer.ts` + `battleVfx.ts` + `celebrationVfx.ts` | med | standalone TD full round (place tower → wave 1 → wave-cleared banner → next wave); encounter TD via IT office |
| 6 | ExplorationScene → `MusicController.ts` + `DoorSystem.ts` | **highest** | room-to-room transitions (music crossfade, no double-track), encounter launch/return music restore, act-advance crossfade, locked-door feedback, QA `navigateToDoor` |
| 7 | UnifiedGamePage → `useEncounterFlow.ts` + `useStandaloneTD.ts` | med-high | all four encounter types end-to-end: TD (IT office), PHI sorter (Aiyana accept + decline + abort), breach triage (Priya, Act 3), debrief routing to the correct component; score contribution lands once |

**Riskiest extraction:** Round 6. The music controller carries async races that were
individually bug-fixed (mute-then-unmute first-frame leak at 1809–1827, orphan-track
reclaim at 2334–2340, shutdown-mid-crossfade guards at 2351) — every guard must move
verbatim. `DoorSystem` shares `transitioning` with movement/idle/QA code, so that flag
deliberately stays on the scene.

**Safest first move:** Round 1 (SpriteFactory). Mechanical, huge line-count win,
and it proves the screenshot-compare pipeline works before anything stateful moves.

Estimated effort: 7 rounds ≈ 2–3 working sessions for the execution run.

---

## 6. Verification protocol (every round)

1. `npm run check` — tsc must be clean (repo baseline: confirm zero errors in Round 0;
   if main has pre-existing errors, record them and require "no new errors").
2. `npm run build` — vite build must succeed.
3. `node tests/loop4-capture.mjs` (dev server on :8080) — compare against
   `screenshots/refactor-baseline/`.
   **Caveat:** rooms contain animated particles/tweens (dust motes, glow pulses, patrol
   NPCs), so byte-identical PNGs are impossible even with zero code change. Use a
   perceptual diff (e.g. `pixelmatch` with ~2–3% differing-pixel tolerance) and, more
   importantly, eyeball for STRUCTURAL change: missing furniture, wrong floor colors,
   missing door glow/labels, absent HUD. Any structural change = the round failed.
4. Rounds touching flow (2, 5, 6, 7): run the relevant `tests/progression/*.spec.ts`
   suites + `tests/loop4-encounters.mjs`.
5. One live smoke per round via `window.__QA__` (teleport, pressSpace, navigateToDoor) —
   qa-bridge talks only through EventBridge, so it doubles as a regression probe for the
   event contract.

## 7. Definition of done (for the future execution run)

- All 7 rounds committed individually on the execution branch/worktree, each with its gate
  evidence noted in the commit message.
- Line targets met (±15%): SpriteFactory barrel ≤ 60; ExplorationScene ≤ 1,400;
  BreachDefenseScene ≤ 1,300; UnifiedGamePage ≤ 1,100.
- Zero behavior deltas: baseline screenshot set structurally identical; progression +
  encounter scripts pass; save file `pq:save:v2` written by a full-game session is
  schema-identical to baseline; the 5-export SpriteFactory surface, `ENCOUNTER_*` /
  `BREACH_*` / `REACT_*` event payloads, `updateCompletionState` reach-in, and
  `registry.encounterResult_*` keys all unchanged.
- No new dependencies, no feature changes, no dialogue/content edits (HIPAA content
  untouched — this refactor never touches educational strings).
- `RUN_REPORT` for the execution run lists any deviation from this plan and why.

## 8. Open questions for the user

1. **Directory taste:** `phaser/systems/exploration/` + `phaser/systems/breach/` (proposed,
   uses the existing empty `systems/` dir) vs. co-located `scenes/exploration/` subfolders?
2. **Barrel vs. repoint:** keep `SpriteFactory.ts` as a permanent 5-export barrel (zero
   import churn) or repoint BootScene/ExplorationScene and delete it in a final round?
3. **Round 7 appetite:** the React hook extractions are the least "mechanical" moves. Happy
   to drop Round 7 from the execution run if you'd rather bank rounds 1–6 first and
   re-evaluate.
4. `handleWakeFromEncounter`'s BGM restore (2550–2582) duplicates the create() BGM block
   (1775–1831). The MusicController extraction naturally merges them into one
   `startRoomMusic()`. That is a (tiny) behavior-affecting dedup — the two copies differ
   only in fade duration (800ms vs 1800ms). Preserve both durations via a parameter, or is
   unifying to one duration acceptable? Proposal assumes **preserve both** (strict
   behavior-preservation).
