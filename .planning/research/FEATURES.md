# Feature Research

**Domain:** RPG with integrated mini-game encounters and three-act narrative arc (educational game)
**Researched:** 2026-03-26
**Confidence:** HIGH (patterns grounded in existing codebase + verified design references)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features players assume exist. Missing these = product feels like a prototype, not a game.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Camera fade on door transition | Every RPG since SNES uses a fade/wipe to signal area changes. Without it, a scene swap feels like a crash. | LOW | Phaser `this.cameras.main.fadeOut/fadeIn()` — native API, ~10 lines. ExplorationScene already has a `transitioning` guard pattern in HubWorldScene to copy. |
| Visual door state indicators | Players need to know "can I go in there?" before walking across the room. Locked/available/completed. | LOW | Three visual states via tint + icon overlay on door sprite. Locked = dark tint, available = glow pulse tween, completed = checkmark badge. All achievable with existing Phaser tween patterns already in project. |
| Player spawns at correct door after transition | When returning from Room B to Room A, player appears at the Room B door, not the center of Room A. | LOW | Pass `spawnDoor` ID in scene `init()` data. ExplorationScene already accepts init data. Requires door registry per room — straightforward. |
| Backtrack through completed areas | Players who miss something, or are curious, must be able to re-enter completed rooms. Locking players out of completed areas is a design crime in an educational game. | LOW | Completion flag gates progression unlock, not re-entry. Already partially modeled in HallwayHub completion state — preserve this logic. |
| Pause while encounter is active | RPG world must freeze while mini-game encounter is running. No phantom NPC interactions, no movement. | LOW | ExplorationScene already has a `paused` flag pattern. Set it true when encounter launches via EventBridge, false on return. |
| Encounter result feeds back to world state | Completing the encounter must visibly change something in the RPG world (NPC reacts, door unlocks, narrative progresses). Without this, encounters feel disconnected. | MEDIUM | EventBridge `ENCOUNTER_COMPLETE` event — React handler — Phaser `scene.resume()` with result data. Needs a defined result schema: `{ encounterId, passed, score }`. |
| Unified score HUD visible during exploration | Score must be on screen at all times, not just during encounters. Players need to feel accumulation. | LOW | HUD already exists in BreachDefensePage. Unified score HUD as a persistent React overlay — scores animate on change, already working in BreachDefense. Port pattern to unified game. |
| Hallway connectors as pacing breaks | Empty corridor between rooms provides a breath between intense scenarios. Without it, room-to-room feels like clicking through a list. | MEDIUM | Short static scene or mini hallway layout in ExplorationScene with no interactables — just ambient art and movement. Not a full room, but needs floor/walls/doors at each end. |
| Act progression that always moves forward | Player should always eventually reach Act 3. Score can be low, they can fail every encounter — but they finish training. Gating on perfect performance is an anti-pattern in compliance training. | LOW | Boolean flags: `act1Complete`, `act2Complete`. Advance when conditions met (e.g., N departments visited + encounter attempted). Saved to localStorage with existing persistence layer. |
| Encounter has clear start/end screens | Player needs to know they're entering a different mode and when they've returned. Dropping into TD mid-exploration with no intro is disorienting. | LOW | Encounter intro card (existing tutorial modal pattern) and recap (existing RecapModal pattern). Both already in BreachDefense. Reuse structure, customize content per trigger context. |
| Audio shift on act transition | Act transitions without a music change feel flat. Warm to tense to urgent. Already called out in CLAUDE.md Commandment 1. | LOW | Existing tracks: hub theme (Act 1), exploration theme (Act 2), breach theme (Act 3). Reassign, crossfade on act boundary. Phaser `this.sound.play()` with volume tween pattern already in project. |

---

### Differentiators (Competitive Advantage)

Features that make this feel like a real game, not a dressed-up compliance module. Aligned with the Nintendo Test in CLAUDE.md.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hallway NPC ambient lines on first pass | An NPC you pass in the hallway says something contextually relevant to the act. First-time-only, brief, non-blocking. Builds hospital-as-living-world feeling. | MEDIUM | Triggered on first entry to hallway connector. Single dialogue bubble over NPC head, auto-dismisses after 3s. No choice required — pure ambience. Needs hallway NPC data structure (simple: `{ id, line, actRequired }`). |
| Encounter trigger with narrative context window | Before encounter launches, a brief narrative card explains WHY the encounter is happening now ("Dr. Patel just flagged suspicious logins. You need to act fast."). Makes encounter feel earned not dropped-in. | LOW | Pre-encounter narrative card (1-2 sentences, NPC portrait). Reuses existing dialogue modal pattern. Duration ~4 seconds with manual dismiss option. |
| Encounter results change NPC dialogue | After completing the IT Office encounter, a coworker in the ER references it: "Heard you stopped those hackers." Rewards careful play and builds world continuity. | MEDIUM | Requires result flags in game state. NPCs check `gameState.encounters.inboundTD.passed` and branch dialogue accordingly. Existing NPC dialogue system already supports branching — add state-conditional variant. |
| Soft act transitions (no hard cuts) | Acts change naturally as conditions are met — no "YOU HAVE ENTERED ACT 2" title card. The player only notices in retrospect. Environmental storytelling signals the shift. | MEDIUM | Act flag set in game state. Music crossfades. New ambient dialogue unlocks in existing NPCs. No UI announcement. Most polished experience but requires careful content staging across act boundaries. |
| Per-department completion fanfare | When all NPCs + zones + items in a department are done, a brief visual flourish (room glow + chime + completion badge) rewards thorough play. Missing this = exploration feels incomplete. | LOW | Existing PrivacyQuest completion state already tracks per-room progress. Add a celebratory tween sequence when 100% triggers. Existing particle and sound patterns are in place. |
| Condensed TD encounter pacing (4 waves, 3 towers) | Full 10-wave BreachDefense inside an RPG would break pacing. Condensed format (3-5 minutes) fits the "encounter not game" model. | MEDIUM | Requires a separate encounter config (wave data, available towers) passed to BreachDefenseScene at launch. BreachDefense already reads tower/wave data from constants — add an "encounter mode" config path. Scene needs a `maxWaves` and `availableTowers` override. |
| Encounter launches as Phaser scene overlay | RPG exploration scene stays running beneath the encounter. On encounter end, exploration scene is already there — no reload, no cold start. Seamless re-entry. | MEDIUM | Use `this.scene.launch('BreachDefense', encounterConfig)` + `this.scene.pause('Exploration')`. On encounter complete, `this.scene.resume('Exploration')`. Phaser supports parallel scenes with layered rendering. Already verified: Phaser `scene.launch()` runs scenes in parallel. |
| Progress breadcrumb on HUD | Small department progress indicator (e.g., 3/6 departments, current act badge) always visible. Players should see how far they've come (Commandment 9). | LOW | React HUD component. Reads from unified game state. Animate on department complete. Minimal implementation: icon row with completion dots per department. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Room picker / department select menu | Familiar pattern from v1.0, easy to understand, feels like a "safety net" for players who get lost. | Breaks spatial continuity — the entire point of unified navigation is that the hospital is a place, not a menu. Every time a player hits a menu, they're reminded they're in training software. | Lock doors visually (dim tint + lock icon). Let players try the door and see "Not yet — finish [area] first." Spatial feedback replaces menu selection. |
| World map / minimap | RPG standard. Many players will ask for it. | Hospital is intentionally small (6 rooms + corridors). A map would reveal the entire structure upfront, removing the sense of discovery. It also requires asset work not planned for this milestone. | Room name text in corner (already exists in ExplorationScene). Hallway connector layout gives spatial cues. Defer until playtests prove players actually get lost. |
| Save-to-cloud / progress sync | Seems modern, expected for "real" products. | Requires backend, auth, and data storage — all out of scope. Adds infrastructure complexity for a desktop-only training tool. | localStorage is sufficient for desktop single-user use case. Per-act save points (not mid-encounter) keep save scope manageable. |
| Difficulty modes (easy/hard) | Seems like good accessibility design. | Compliance training has one difficulty requirement: the learner knows the material by the end. Variable difficulty risks under-teaching on easy mode. Adds content branching complexity. | Score reflects quality, not pass/fail. Wrong answers teach via educational feedback. The game self-adjusts: fail an encounter, the same material appears in dialogue later. |
| Real-time encounter score during TD | Showing live score during the encounter keeps players informed. | Adds HUD complexity to an already-complex TD scene. During a 4-wave encounter, players focus on tower placement — score display pulls attention at wrong moment. | Show score only in recap modal after encounter. Existing RecapModal pattern handles this perfectly. |
| Full branching narrative with remembered choices | Sounds like EarthBound or Undertale — choices that visibly shape the world. | Requires extensive conditional content authoring across 23 NPCs, 6 departments, 3 encounters. Quickly becomes unmaintainable. Risk of content gaps breaking narrative. | Targeted choice memory: 2-3 key decisions are remembered and referenced (IT Office encounter outcome, one Privacy choice in Records). This creates the feel of a living world with ~5% of the implementation cost of full branching. |
| Skip/fast-forward encounter option | Accessibility/frustration relief for players replaying or who find TD unengaging. | Lets players bypass the core teaching moment. The encounter is the reinforcement — skipping it is skipping the lesson. For a compliance product, this is a training gap. | Encounters are short enough (3-5 min) that skip pressure is minimal. If playtests show frustration, add a "simplified mode" that lowers threat count, not a skip. |

---

## Feature Dependencies

```
[Door Transition System]
    requires --> [Door State Indicators]
    requires --> [Player Spawn Position Data]
    requires --> [Scene Fade API] (already in Phaser, zero build cost)

[Encounter Trigger System]
    requires --> [Exploration Scene Pause Flag] (already exists — `paused` var)
    requires --> [EventBridge ENCOUNTER events] (add 2-3 new event types)
    requires --> [Encounter Result Schema]
    pattern-reuses --> [Door Transition System] (same scene-switch + fade pattern)

[Encounter Result Schema]
    requires --> [Unified Game State] (localStorage structure)
    feeds --> [NPC Dialogue Branching on Result]
    feeds --> [Act Progression Conditions]

[Act Progression System]
    requires --> [Unified Game State]
    requires --> [Department Completion Tracking] (already exists in PrivacyQuest)
    requires --> [Encounter Result Schema]
    enhances --> [Audio Act Shift] (music crossfade on act boundary)
    enhances --> [Hallway NPC Ambient Lines] (act-gated content unlocks)

[Unified Score HUD]
    requires --> [Unified Game State]
    enhances --> [Progress Breadcrumb] (same state, additional display)

[Condensed TD Encounter]
    requires --> [Encounter Trigger System]
    requires --> [BreachDefenseScene encounter-mode config] (new: maxWaves, availableTowers)
    requires --> [Encounter Result Schema]

[Per-Department Completion Fanfare]
    requires --> [Department Completion Tracking] (already exists)
    enhances --> [Progress Breadcrumb] (triggers breadcrumb update animation)
```

### Dependency Notes

- **Door Transition requires Door State Indicators:** A player trying to open a locked door with no visual feedback is a UX bug, not a missing feature. Build both together.
- **Encounter Trigger requires Exploration Scene Pause:** Without pausing, the player sprite drifts during TD and NPC interactions can fire through the overlay. The `paused` flag already exists in ExplorationScene — just wire it to the encounter event.
- **Act Progression requires Unified Game State:** Acts cannot advance without a single source of truth that persists across scene transitions. This is the one structural piece the entire milestone depends on — design this schema first in Phase 1.
- **Condensed TD requires encounter-mode config:** BreachDefenseScene currently loads all 10 waves and 6 towers from constants. An "encounter mode" flag with override config (`maxWaves: 4`, `availableTowers: ['firewall', 'mfa-shield', 'training-beacon']`) is the minimal invasive change. Do not rebuild the scene.
- **NPC Dialogue Branching on Result conflicts with Full Branching Narrative (anti-feature):** Keep result-based branching narrow (2-3 key decisions). Full branching is an anti-feature — see above.

---

## MVP Definition

This is a subsequent milestone on an existing product. "MVP" here means the minimum to validate that the unified RPG experience feels cohesive and continuous. All v1.0 content is preserved.

### Launch With (v2.0 Core)

- [ ] Door-to-door transitions with camera fade — establishes spatial continuity, eliminates room-picker UX
- [ ] Visual door state indicators (locked/available/completed) — player navigation feedback without menu
- [ ] Player spawn position at correct door — prevents disorientation on backtrack
- [ ] Unified game state in localStorage — enables everything else, design this schema first
- [ ] Encounter trigger + return system (EventBridge events + scene pause/resume) — connects RPG and TD
- [ ] Condensed TD encounter config (4 waves, 3 towers, encounter-mode flag) — makes TD feel like encounter not game
- [ ] Act progression flags (conditions checked on department completion + encounter results) — gives the game shape
- [ ] Audio act shift (reassign existing tracks per act) — zero new assets, high emotional impact
- [ ] Unified score HUD across both encounter types — player sees single running score

### Add After Validation (v2.x)

- [ ] Hallway connector scenes with ambient NPCs — add once core navigation is solid, playtests confirm pacing
- [ ] NPC dialogue branching on encounter result — add once encounter result schema is proven stable
- [ ] Per-department completion fanfare — polish pass after content integration confirmed
- [ ] Encounter narrative context window (pre-encounter card) — adds story, not structure; safe to add late
- [ ] Progress breadcrumb HUD — validate core HUD first, add breadcrumb in polish pass

### Future Consideration (v2.1+)

- [ ] PHI Sorting mini-game (new encounter type) — significant build, warrants its own milestone phase
- [ ] Outbound TD variant (inverted grid, new threats/towers) — even larger build
- [ ] Breach triage encounter — design still pinned, not ready to build
- [ ] End-of-game report screen — requires encounter results + act completion data to be mature first
- [ ] Admin console / certificate / analytics — out of scope for this project

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Camera fade + door transitions | HIGH | LOW | P1 |
| Door state indicators (locked/available/complete) | HIGH | LOW | P1 |
| Unified game state (localStorage schema) | HIGH | LOW | P1 |
| Exploration scene pause during encounter | HIGH | LOW | P1 |
| Encounter trigger/return system (EventBridge) | HIGH | MEDIUM | P1 |
| Condensed TD encounter config | HIGH | MEDIUM | P1 |
| Act progression flags | HIGH | LOW | P1 |
| Audio act shift | HIGH | LOW | P1 |
| Unified score HUD | MEDIUM | LOW | P1 |
| Player spawn at correct door | MEDIUM | LOW | P1 |
| Hallway connector scenes | MEDIUM | MEDIUM | P2 |
| Pre-encounter narrative context card | MEDIUM | LOW | P2 |
| NPC dialogue branching on encounter result | MEDIUM | MEDIUM | P2 |
| Per-department completion fanfare | MEDIUM | LOW | P2 |
| Progress breadcrumb HUD | LOW | LOW | P2 |
| Hallway ambient NPC lines | LOW | MEDIUM | P2 |
| Soft act transitions (no title card) | LOW | MEDIUM | P2 |
| World map / minimap | LOW | HIGH | P3 (anti-feature — defer) |
| Save-to-cloud | LOW | HIGH | P3 (anti-feature — out of scope) |
| Difficulty modes | LOW | MEDIUM | P3 (anti-feature — avoid) |

**Priority key:**
- P1: Must have for v2.0 launch — game is broken or confusing without it
- P2: Should have — add when core is stable, before final polish
- P3: Defer or explicitly avoid

---

## Competitor Feature Analysis

This is an internal project with no direct commercial competitors. Comparable patterns from reference games:

| Feature | Pokemon (Game Boy) | Chrono Trigger (SNES) | Our Approach |
|---------|-------------------|----------------------|--------------|
| Door/area transitions | Instant fade-to-black, respawn at entry door | Fade + brief loading message | Camera fadeOut (200ms) — scene start — camera fadeIn (200ms). Player spawns at entry door matching origin. |
| Encounter trigger | Random encounter on overworld step | On-screen enemies contact player sprite | Story flag triggers encounter intro card — scene launch as overlay — exploration scene paused beneath |
| Return from encounter | Battle ends — exactly same overworld position | Same pattern | Resume paused exploration scene — player exactly where they left off, no reload |
| Act progression | Linear gym badge — Elite Four | Three disc structure, automatic chapter transitions | Flags: N departments complete + encounter attempted — act advances, music shifts — no title card |
| Score / progress display | Pokedex completion count, badge display | HP/MP bars, level display | Running compliance score HUD (animate on change) + department dots in progress breadcrumb |
| Mini-game integration | Voltorb Flip (optional, skippable) | Boss encounters (mandatory, narrative-triggered) | Mandatory, narrative-triggered, condensed format (~4 min), pre/post narrative wrapper |

The key distinction from both references: our encounters are **mandatory and narrative-triggered**, not random or optional. The educational purpose requires the player to engage. This is closer to Chrono Trigger's boss-as-story-climax pattern than Pokemon's random encounters. The narrative wrapper (pre-encounter card + post-encounter recap) is the mechanism that makes mandatory feel natural rather than forced.

---

## Sources

- `.planning/ENHANCEMENT_BRIEF.md` — full v2.0 encounter designs, hospital layout, phase plan
- `.planning/PROJECT.md` — validated v1.0 features, tech constraints, out-of-scope items
- `client/src/phaser/scenes/ExplorationScene.ts` — existing `paused` flag, `init()` data pattern, BFS pathfinding
- `client/src/phaser/scenes/HubWorldScene.ts` — existing `transitioning` guard, door detection pattern
- Phaser 3 Scene API — `scene.launch()`, `scene.pause()`, `scene.resume()`, `cameras.main.fadeOut()`: [Phaser docs](https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Scenes.ScenePlugin-transition), [Rex Rainbow notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scenemanager/)
- Phaser 3 inter-scene data passing — `this.scene.start(key, data)` / `init(data)`: [official example](https://phaser.io/examples/v3/view/scenes/passing-data-to-a-scene)
- "Designing RPG Mini-Games (and Getting Them Right)" — Game Developer: narrative logic must be airtight, treat mini-games as real games, budget realistically — [gamedeveloper.com](https://www.gamedeveloper.com/design/designing-rpg-mini-games-and-getting-them-right-)
- Chrono Trigger encounter design analysis — [Medium: Great Game UX: Encounter Design in Chrono Trigger](https://medium.com/games-r-ux/great-game-ux-encounter-design-in-chrono-trigger-5505a5563bdd)
- Phaser parallel scenes + overlay pattern — [Phaser forum: HUD scene](https://phaser.discourse.group/t/hud-scene-multiple-scenes/6348), [Feronato article on parallel scenes](https://emanueleferonato.com/2021/02/25/understanding-phaser-capability-of-running-multiple-scenes-simoultaneously-with-a-real-world-example-continous-particle-scrolling-background-while-main-scene-restarts/)
- CLAUDE.md Nintendo Test commandments — internal design philosophy reference

---
*Feature research for: RPG unified hospital navigation + encounter integration + three-act arc*
*Researched: 2026-03-26*
