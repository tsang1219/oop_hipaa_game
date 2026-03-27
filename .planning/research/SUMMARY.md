# Project Research Summary

**Project:** PrivacyQuest + BreachDefense v2.0
**Domain:** Unified Phaser 3 + React educational RPG — hospital navigation, encounter integration, three-act narrative arc
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

PrivacyQuest v2.0 transforms two standalone HIPAA training games into a single continuous hospital RPG. The player walks between departments through door-to-door transitions, triggering narrative events and embedded tower defense encounters — all within one Phaser game instance on a single React route. Research confirms this is achievable without any new npm dependencies, using Phaser 3.90's built-in scene manager (`scene.launch()`, `scene.sleep()`, `scene.wake()`), camera fade API, and the Phaser Registry (DataManager) as the cross-scene state bus. The existing architecture is sound; v2.0 is additive restructuring, not a rewrite.

The recommended approach centers on three structural decisions that must be made first: (1) Collapse the three-route architecture into a single `UnifiedGamePage` at `/` with a persistent Phaser instance — React route changes are fatal to mid-game state; (2) use ExplorationScene as the single data-driven world scene, restarting with new room data on door transitions rather than managing N per-room scenes; and (3) store all cross-scene persistent state in the Phaser Registry (runtime) and a single versioned localStorage key (persistence), not fragmented across the 14+ ad-hoc keys the v1.0 codebase accumulated. These three decisions unblock everything else.

The highest risks are all implementation-level, not design-level: stale React closures corrupting room-transition state, EventBridge listener accumulation from missed `shutdown()` cleanup, save format migration breaking v1.0 player progress, and BreachDefenseScene failing to reset state between sequential encounters. All are documented with specific prevention patterns and must be addressed early — Phase 0 (save migration) and Phase 1 (navigation foundation) — before any encounter or narrative work begins.

---

## Key Findings

### Recommended Stack

No new npm packages are required. The full v2.0 feature set is achievable with the existing stack: Phaser 3.90, React 18, TypeScript 5.6, Vite 5, Tailwind 3, EventBridge (custom), and `nanoid`.

The critical additions for v2.0 are Phaser built-ins previously unused in this project: `scene.launch()` to run BreachDefense as a parallel overlay on top of a sleeping ExplorationScene; `cameras.main.fadeOut()` + `FADE_OUT_COMPLETE` for door crossfades (preferred over `scene.transition()` which requires manual alpha lerp); `this.registry` as game-wide DataManager for cross-scene state; and `registry.events.on('changedata-*')` so React can subscribe to game state without polling. The Registry is lifecycle-managed by Phaser (cleared on `game.destroy()`) and avoids the stale hot-reload state that global module singletons accumulate.

**Core technologies:**
- Phaser ScenePlugin (3.90): `scene.launch/sleep/wake` for encounter overlay pattern — keeps ExplorationScene in memory during TD encounters with no rebuild cost on return
- Phaser CameraEffects (3.90): `cameras.main.fadeOut/fadeIn` for door transitions — built-in black crossfade matching SNES aesthetic, zero boilerplate vs. `scene.transition()`
- Phaser Registry/DataManager (3.90): `this.registry.set/get/inc/merge` for unified game state — accessible in every scene, fires `changedata` events React can subscribe to directly
- EventBridge (custom): extend existing event list with 8 new encounter/act constants — preserve singleton pattern and all 26 existing events
- localStorage (browser API): single versioned key `pq:save:v2` replacing 14 fragmented keys — serialize on act transitions and room completions

**What NOT to use:**
- `scene.transition()` — requires manual alpha lerp in `onUpdate`; use camera fade instead
- `scene.start('Exploration')` from within an encounter — destroys BreachDefense AND forces Exploration `init()` + `create()`; player position lost; use `scene.stop()` + `scene.wake('Exploration')` instead
- XState / Zustand / Redux — overkill for a 3-state act machine and flat game state; Registry handles both cleanly
- Global TypeScript module singleton for game state — persists across hot-reloads, can't be cleared on game restart

Full detail: `.planning/research/STACK.md`

---

### Expected Features

The v2.0 feature set divides cleanly into P1 (game broken without), P2 (polish after core), and explicit anti-features to avoid.

**Must have (table stakes — P1):**
- Camera fade on door transitions — every RPG since SNES signals area changes this way; without it, scene swaps read as crashes
- Visual door state indicators (locked/available/completed) — three visual states via tint + icon overlay; players must know "can I go in there?" before crossing the room
- Player spawns at correct door after backtrack — pass `spawnDoor` ID in scene `init()` data
- Unified game state in localStorage (single versioned schema) — enables everything else; design this schema first, before any code
- Encounter trigger + return system (EventBridge events + scene sleep/resume) — connects RPG and TD without destroying Phaser game instance
- Condensed TD encounter config (4 waves, 3 towers, encounter-mode flag) — makes TD feel like a narrative encounter, not a separate game
- Act progression flags (conditions checked on department completion + encounter results) — gives the game a narrative shape
- Audio act shift (reassign existing 3 tracks to 3 acts via crossfade) — zero new assets, high emotional impact
- Unified score HUD visible during exploration — player must see score accumulating across both game modes
- Backtrack through completed areas — locking players out of completed rooms is a design crime in compliance training

**Should have (differentiators — P2):**
- Encounter trigger with narrative context window — brief card explaining why TD is launching now ("Dr. Patel just flagged suspicious logins")
- Per-department completion fanfare — visual flourish + chime on 100% completion
- NPC dialogue branching on encounter result — coworker references encounter outcome; builds world continuity
- Progress breadcrumb HUD — department dots + act badge always visible
- Hallway connector scenes with ambient NPCs — breathing room between departments

**Defer (v2.1+):**
- PHI Sorting mini-game — significant build, warrants its own milestone
- Outbound TD variant — new threats/towers data required, path direction decision unresolved
- End-of-game report screen — needs mature encounter result + act data first

**Explicit anti-features (do not build):**
- Room picker / department select menu — breaks spatial continuity; replace with locked doors giving in-world feedback
- World map / minimap — hospital is intentionally small (6 rooms); reveals structure before discovery
- Difficulty modes — compliance training has one difficulty: learner knows the material by end
- Full branching narrative — unmaintainable across 23 NPCs; limit to 2-3 key remembered decisions

Full detail: `.planning/research/FEATURES.md`

---

### Architecture Approach

The v2.0 architecture collapses three React routes and three separate game experiences into a single `UnifiedGamePage` at `/` with a single persistent Phaser instance. ExplorationScene is the primary always-running world scene; BreachDefenseScene launches as a parallel overlay (sleep/wake pattern) for encounters; act state lives in a React `useGameState` hook backed by localStorage and pushed to scenes at room-load time via EventBridge.

The key architectural insight: React router navigation (`navigate('/breach')`) destroys and recreates the Phaser game instance, losing all scene state. This was acceptable in v1.0 when modes were separate. For a unified RPG where encounter launch must preserve room state and player position, it is fatal. The fix is to never change routes during gameplay — all mode switching happens at the Phaser scene layer.

**Major components:**
1. `UnifiedGamePage` (React) — merges HubWorldPage + PrivacyQuestPage; owns Phaser instance lifecycle; hosts `useGameState` hook; swaps HUD mode between exploration and encounter
2. `ExplorationScene` (Phaser) — data-driven world scene; handles door detection, room transitions, encounter triggers, sleep/wake hooks; restarts with new room data on each door transition
3. `BreachDefenseScene` (Phaser) — receives encounter config via `init(data)` for condensed mode (4 waves, 3 towers) vs. full standalone at `/breach`; always stopped (not slept) on encounter exit for clean state reset
4. `useGameState` (React hook) — unified state: act, score, rooms, encounters, persistence; runs `actProgressionLogic` on state change; persists to single versioned localStorage key
5. `GameProgressionService` (TypeScript module) — pure function checking registry state for act advancement conditions; 30 lines, no FSM library
6. EventBridge (extended) — 8 new event constants for encounter lifecycle (`ENCOUNTER_TRIGGERED`, `ENCOUNTER_COMPLETE`, `REACT_LAUNCH_ENCOUNTER`, `REACT_RETURN_FROM_ENCOUNTER`) and act progression (`ACT_CHANGED`, `REACT_SET_ACT`)

**Data flow contracts (define before implementation):**
- Room transition: ExplorationScene emits `EXPLORATION_EXIT_ROOM` → React validates unlock → emits `REACT_LOAD_ROOM` → ExplorationScene restarts with new data
- Encounter launch: ExplorationScene emits `ENCOUNTER_TRIGGERED` → React shows context card → emits `REACT_LAUNCH_ENCOUNTER` → ExplorationScene sleeps itself, starts BreachDefense
- Encounter return: BreachDefenseScene writes result to registry → emits `ENCOUNTER_COMPLETE` → React updates state → emits `REACT_RETURN_FROM_ENCOUNTER` → ExplorationScene wakes

**PHI Sorting:** Build as React-only full-screen overlay. ExplorationScene sleeps. React renders the sorting UI. On complete, React emits return event, scene wakes. No Phaser scene needed — drag-and-drop document UI belongs in React, not in canvas.

Full detail: `.planning/research/ARCHITECTURE.md`

---

### Critical Pitfalls

Seven pitfalls identified from direct codebase analysis. The top five require action before any restructure begins.

1. **Stale closures in EventBridge handlers during room transitions** — React's EventBridge listeners capture stale state via closures. With continuous navigation (6-15 room entries per session vs. the previous one-at-a-time flow), stale closure hits become near-certain. Prevention: use `useRef` for all values that EventBridge handlers read, updated synchronously on every render. Establish this pattern in Phase 1 before any encounter integration — retrofitting requires auditing every handler.

2. **EventBridge listener accumulation on scene restart** — Each `scene.start()` runs `create()`, registering new listeners. Missed `shutdown()` cleanup accumulates duplicates silently. By room 4, a correct answer awards +12 instead of +3. Prevention: add a centralized `boundListeners` array to ExplorationScene and BreachDefenseScene; every new `eventBridge.on()` call uses a helper that auto-registers for cleanup. Establish in Phase 1 before adding new event types.

3. **Two game loops running simultaneously after encounter launch** — If React calls `game.scene.start('BreachDefense')` directly without stopping ExplorationScene, both update loops run: WASD moves the RPG player during TD waves. Prevention: encounter launch must be scene-initiated. ExplorationScene receives `REACT_LAUNCH_ENCOUNTER`, calls `this.scene.sleep()` on itself, then starts BreachDefense. Never launch from React directly.

4. **Save format migration breaks existing progress** — v1.0 has 14+ fragmented localStorage keys incompatible with v2.0 state requirements. Prevention: consolidate into single `pq:save:v2` key with a `migrateV1toV2()` function run on game init. This is Phase 0 work — the first code written before any restructure.

5. **BreachDefenseScene state not reset between encounters** — `scene.sleep()` preserves all state (towers, enemies, budget). Using sleep instead of stop means encounter 2 starts with encounter 1's towers. Prevention: always use `scene.stop()` for BreachDefenseScene (triggers `shutdown()` and clean `init()`). Only ExplorationScene uses `sleep()`.

Additional pitfalls: React page architecture assuming one mode per route (fix: single unified page); HallwayHub content regression when room picker is removed (fix: inventory every HallwayHub responsibility and assign each a replacement before deletion).

Full detail: `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

### Phase 0: Save Format Migration and Bug Stabilization
**Rationale:** Must come first. The v1.0 save format (14+ fragmented localStorage keys) is incompatible with v2.0 state requirements. Migrating after the restructure begins creates data corruption risk. All subsequent phases write to the consolidated format — if it doesn't exist yet, they write to a partial schema that breaks existing player sessions.
**Delivers:** Single versioned `pq:save:v2` schema; `migrateV1toV2()` function that runs once on boot and clears v1 keys; existing bugs fixed without changing APIs
**Avoids:** Save format corruption (Pitfall 4)
**Research flag:** Standard patterns — no additional research needed; execute directly

---

### Phase 1: Unified Navigation Foundation
**Rationale:** Everything downstream depends on this. Encounter integration (Phase 2), PHI Sorting (Phase 3), and act narrative (Phase 5) all require `UnifiedGamePage`, `useGameState`, the door system in ExplorationScene, and the `REACT_LOAD_ROOM` event payload. This phase establishes the contracts that all subsequent phases consume. Pitfalls 1, 2, and 5 must be addressed here — retrofitting them into Phases 2-5 is far more expensive.
**Delivers:** Single-route game at `/`; `UnifiedGamePage` replacing HubWorldPage + PrivacyQuestPage; door-to-door room transitions with camera fade (300ms); door visual state indicators (locked/available/complete); player spawn at correct door; unified game state hook; hallway connector rooms in roomData.json; HallwayHub responsibilities fully migrated and verified before deletion
**Features from FEATURES.md:** Camera fade transitions (P1), door state indicators (P1), unified game state (P1), player spawn position (P1), backtrack through completed areas (P1)
**Avoids:** Stale closure state (Pitfall 1) — establish `useRef` pattern for all handlers; EventBridge accumulation (Pitfall 2) — establish `boundListeners` cleanup pattern; React page architecture (Pitfall 5) — single page, single Phaser instance; HallwayHub regression (Pitfall 7) — responsibility inventory before deletion; particle emitter accumulation — verify `shutdown()` destroys emitters, not just tweens
**Research flag:** Standard patterns — well-documented Phaser + React patterns; no additional research needed

---

### Phase 2: Encounter Integration (Inbound TD)
**Rationale:** Requires Phase 1 complete. The door system established in Phase 1 is the model for encounter triggers. `useGameState` from Phase 1 receives encounter results. BreachDefenseScene encounter-mode config is the smallest invasive change to an otherwise stable scene. This is the highest-risk phase — define the launch/return protocol contract before any implementation.
**Delivers:** Sleep/wake encounter pattern; TD triggered from ExplorationScene narrative event; condensed 4-wave encounter config via `init(data)`; encounter result written to registry before ExplorationScene wakes; unified compliance score updated; encounter HUD mode swap in React; pre-encounter narrative context card; post-encounter debrief overlay
**Features from FEATURES.md:** Encounter trigger + return system (P1), condensed TD encounter config (P1), unified score HUD (P1), encounter narrative context window (P2)
**Avoids:** Two game loops simultaneous (Pitfall 3) — scene-initiated launch protocol, never React-initiated; BreachDefense state not reset (Pitfall 6) — always `scene.stop()` for BreachDefense, never `scene.sleep()`; unified score scale mismatch — define score conversion formula before implementing aggregation
**Research flag:** Standard patterns — Phaser sleep/wake is documented; encounter config pattern is fully specified in STACK.md with code examples

---

### Phase 3: PHI Sorting Encounter
**Rationale:** Depends on Phase 1 (encounter trigger system) and partially on Phase 2 (React knows how to switch HUD mode for encounters). Independent of BreachDefense changes — different encounter type, different implementation path. Build as React-only overlay: ExplorationScene sleeps, React renders full-screen PHI sorting UI, on complete React emits `REACT_RETURN_FROM_ENCOUNTER`, scene wakes.
**Delivers:** `PHISortingOverlay` React component; second encounter type wired into narrative
**Avoids:** Building PHI sorting in Phaser (Architecture Anti-Pattern 3) — drag-and-drop document UI belongs in React
**Research flag:** Needs planning — PHI sorting game design (sorting categories, HIPAA content, scoring formula) is not fully specified in research files. ENHANCEMENT_BRIEF.md has design intent; a dedicated content design pass is required before Phase 3 can be estimated or built.

---

### Phase 4: Outbound TD Variant
**Rationale:** Depends on Phase 2 (BreachDefenseScene encounter config pattern). Reuses the encounter config pattern from inbound TD — build the pattern once (Phase 2), extend it (Phase 4). Requires new outbound threat/tower data in constants and a path direction decision.
**Delivers:** Second TD encounter type; outbound threat/tower constants; path direction resolved
**Avoids:** Hardcoding outbound config in BreachDefenseScene — pass via init data (same pattern as inbound)
**Research flag:** Needs a planning decision — outbound path direction (reverse existing serpentine vs. new waypoint layout) is an open architecture question. Wrong choice doubles the work. Resolve this decision explicitly before Phase 4 implementation begins.

---

### Phase 5: Three-Act Narrative Arc
**Rationale:** Requires Phase 1 (room navigation) and Phase 2 (encounter results feed act conditions). Act state can be defined as a data structure in Phase 1, but the act advancement logic, music crossfades, and transition sequences require all navigation and encounter plumbing to be stable. Attempting act progression before encounters are wired creates false completion states.
**Delivers:** `GameProgressionService` (pure function, act conditions); `ACT_CHANGED` event; music crossfade on act boundary (reassign existing 3 tracks); act transition dialogue sequence; `currentAct` in unified HUD
**Features from FEATURES.md:** Act progression flags (P1), audio act shift (P1), act indicator in HUD, soft act transitions
**Avoids:** Storing act state in Phaser scene variables (Architecture Anti-Pattern 2) — act lives in `useGameState`, pushed to scenes via `REACT_LOAD_ROOM` payload; XState library overkill — 30-line pure function handles 3-state machine cleanly
**Research flag:** Standard patterns — act progression logic is fully specified in STACK.md; music crossfade pattern is documented; no additional research needed

---

### Phase 6: Polish and Completion
**Rationale:** All phases complete. No new architectural components. Additive polish pass using patterns established in prior phases.
**Delivers:** Per-department completion fanfare; NPC dialogue branching on encounter result; progress breadcrumb HUD; hallway ambient NPC lines; end-of-game report screen (if in scope)
**Features from FEATURES.md:** Per-department completion fanfare (P2), NPC dialogue branching (P2), progress breadcrumb (P2), hallway ambient NPC lines (P2)
**Research flag:** Standard patterns — all patterns established in earlier phases; polish work only

---

### Phase Ordering Rationale

- **Phase 0 before everything:** Save migration is the only work that cannot be undone — corrupt a v1 save during restructure and player progress is permanently lost. It must be isolated, shipped, and verified before any restructure begins.
- **Phase 1 before Phases 2-5:** The `UnifiedGamePage`, `useGameState`, and door system are the foundation contracts all downstream phases consume. Attempting encounter integration before stable navigation creates integration thrash and makes pitfall retrofix expensive.
- **Phase 2 before Phase 4:** Outbound TD reuses the encounter config pattern from inbound TD. Build the pattern once, extend it.
- **Phase 3 is partially independent:** PHI Sorting depends on Phase 1 trigger system and Phase 2 HUD mode switching, but not on Phase 2 BreachDefense changes. Could parallelize with Phase 4 if teams allow.
- **Phase 5 last among core features:** Act advancement conditions include encounter completion results. Attempting act progression before encounters are wired creates false completion states that must be debugged under live act logic.

---

### Research Flags

Phases needing deeper research or design sessions before implementation:
- **Phase 3 (PHI Sorting):** Encounter design — specific HIPAA content, sorting categories, scoring formula — not fully defined. Requires a content design pass before Phase 3 can be estimated.
- **Phase 4 (Outbound TD):** Path direction decision (reverse existing serpentine vs. new waypoint layout) is an open architecture question from ARCHITECTURE.md. Requires an explicit decision before implementation.

Phases with standard, well-documented patterns (no research-phase needed):
- **Phase 0:** Save migration is a well-understood data transformation
- **Phase 1:** Phaser scene restart + camera fade + EventBridge patterns fully specified in research
- **Phase 2:** Phaser sleep/wake encounter pattern fully specified in STACK.md with code examples
- **Phase 5:** Act progression logic fully specified in STACK.md; music crossfade pattern documented
- **Phase 6:** Polish work using established in-project patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All APIs verified against official Phaser 3.90 docs; no new dependencies; patterns confirmed stable since Phaser 3.17+ |
| Features | HIGH | Grounded in existing codebase + validated design references (ENHANCEMENT_BRIEF.md); anti-features explicitly reasoned with alternatives |
| Architecture | HIGH | Based on direct codebase inspection of all 4 scenes + 3 pages + EventBridge; component boundaries are concrete, not theoretical |
| Pitfalls | HIGH | Based on direct codebase analysis with specific line references; Phaser 3 scene lifecycle behavior confirmed against official docs |

**Overall confidence:** HIGH

### Gaps to Address

- **HubWorldScene retirement decision:** Should HubWorldScene become a room data entry (hospital-entrance in roomData.json) or be preserved as a special Act 1 intro sequence? This affects Phase 1 scope. Resolve during Phase 1 planning before implementation begins.
- **PHI Sorting encounter content:** Sorting categories, HIPAA topic coverage, and scoring formula are not defined in research files. Requires content design work before Phase 3 can be estimated or built.
- **Outbound TD path direction:** ARCHITECTURE.md identifies this as an open question. Resolve during Phase 4 planning — wrong choice doubles build cost.
- **Unified score formula:** Both privacy (dialogue/zone interactions) and security (TD performance) feed the unified compliance score. Scale mapping is undefined. A wrong mapping (raw BreachDefense 0-100 naively added to privacy score) creates a broken incentive structure. Define the formula in Phase 2 planning before implementing score aggregation.
- **BreachDefensePage standalone mode:** Should `/breach` always run in full 10-wave mode, or share the encounter-mode config with a `standalone: true` flag in init data? Decide during Phase 2 planning to avoid maintaining two separate page configs.

---

## Sources

### Primary (HIGH confidence)
- `client/src/phaser/scenes/ExplorationScene.ts` — shutdown() behavior, EventBridge registrations, paused flag, stale closure comment at line 395-398
- `client/src/phaser/scenes/BreachDefenseScene.ts` — entity array accumulation, shutdown() at line 1981, onRestart handler
- `client/src/phaser/EventBridge.ts` — singleton pattern, no deduplication behavior, extends Phaser.Events.EventEmitter
- `client/src/pages/PrivacyQuestPage.tsx` — 14 fragmented localStorage keys at lines 62-88, 139-144, 199-203
- `.planning/ENHANCEMENT_BRIEF.md` — encounter designs, hospital layout, act structure, phase plan
- docs.phaser.io/phaser/concepts/scenes — Scene lifecycle, launch/sleep/wake (official, current)
- docs.phaser.io/phaser/concepts/data-manager — Registry API: set/get/inc/merge/changedata (official, current)
- phaser.io/examples/v3/view/scenes/sleep-and-wake — Official Phaser sleep/wake example

### Secondary (MEDIUM confidence)
- rexrainbow.github.io/phaser3-rex-notes — SceneManager methods; isSleeping/isPaused status (community-maintained, widely used)
- blog.ourcade.co/posts/2020/phaser-3-fade-out-scene-transition — Camera fadeOut + FADE_OUT_COMPLETE pattern (2020; API verified stable in 3.90)
- gamedeveloper.com — "Designing RPG Mini-Games" — narrative logic, treat mini-games as real games, budget realistically
- Medium — "Great Game UX: Encounter Design in Chrono Trigger" — mandatory narrative-triggered encounters vs. optional/random

### Tertiary (LOW confidence)
- phaser.discourse.group — sleep/wake vs. start tradeoffs; community confirmation of behavior

---

*Research completed: 2026-03-26*
*Ready for roadmap: yes*
