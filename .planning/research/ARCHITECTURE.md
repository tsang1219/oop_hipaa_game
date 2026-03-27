# Architecture Research

**Domain:** Phaser 3 + React hybrid game — unified RPG navigation, encounter integration, narrative arc
**Researched:** 2026-03-26
**Confidence:** HIGH (based on direct codebase inspection of all four scenes + three pages + EventBridge; supplemented by Phaser 3.90 official docs patterns)

---

## Context: What This Document Covers

This document supersedes the v1.0 polish-milestone ARCHITECTURE.md. It addresses the architectural decisions required for v2.0: collapsing three separate games into one continuous hospital RPG with integrated encounters and a three-act narrative arc.

The existing architecture is sound. The v2.0 work is additive restructuring, not a rewrite.

---

## Existing Architecture (Baseline)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Layer (DOM)                             │
│  ┌────────────────┐  ┌─────────────────┐  ┌───────────────────┐    │
│  │ HubWorldPage   │  │ PrivacyQuestPage │  │ BreachDefensePage │    │
│  │ (/)            │  │ (/privacy)       │  │ (/breach)         │    │
│  └───────┬────────┘  └────────┬────────┘  └────────┬──────────┘    │
│          │  EventBridge        │ EventBridge          │ EventBridge  │
├──────────┼─────────────────────┼──────────────────────┼─────────────┤
│          │        Phaser Layer (Canvas)                │             │
│  ┌───────┴─────────────────────┴──────────────────────┴──────────┐  │
│  │  BootScene — asset preload, texture generation, anim register  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ HubWorldScene    │  │ ExplorationScene  │  │BreachDefense     │   │
│  │ (lobby, 2 doors) │  │ (room data-driven)│  │Scene (TD engine) │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Key constraint:** Phaser owns canvas, physics, game loops. React owns all text (dialogue, HUD, modals). EventBridge (singleton Phaser.EventEmitter) is the only legal communication channel between them.

**Current separation problems for v2.0:**
- Three React pages = three separate routes = hard navigation boundaries
- HubWorldScene is a menu, not a game world
- ExplorationScene loads rooms but returns to a React room-picker (HallwayHub)
- BreachDefenseScene lives on a separate page with no RPG connection

---

## Recommended v2.0 Architecture

### Decision 1: Single Continuous Phaser Scene vs. Multiple Linked Scenes

**Recommendation: Extend ExplorationScene as the single world scene. Do not create multiple linked scenes.**

Rationale:
- ExplorationScene already loads room data dynamically via `init(data: { room, completedNPCs, ... })`. This is the correct architectural pivot point.
- Phaser scene transitions (`this.scene.start('Exploration', newData)`) are fast and already work — the scene restarts with new room data, preserving all registered anims/textures from BootScene.
- The `ExplorationScene` restart approach is simpler than building a scene manager that passes player position and state between N scenes.
- The HubWorldScene and BreachDefenseScene continue to exist but are launched as overlapping scenes or replaced outright, not as navigation targets from React routing.
- Multiple linked Phaser scenes would require shared state management across scene boundaries — an unnecessary complication when one data-driven scene already does this.

**What changes:** ExplorationScene gains a door-detection system that triggers room transitions by restarting itself with new room data. HubWorldScene becomes Act 1's "hospital entrance" room (or is retired into a room data entry). BreachDefenseScene is launched as an encounter overlay (see Decision 2).

### Decision 2: Encounter Launch Pattern — Parallel Scene Overlay

**Recommendation: Launch BreachDefenseScene as a Phaser parallel scene (sleep/wake or launch alongside), not a React route change.**

Rationale:
- React route changes (`navigate('/breach')`) destroy and recreate React state and the Phaser game instance. This loses room state, player position, and act progression.
- Phaser supports running multiple scenes simultaneously via `this.scene.launch('BreachDefense', data)` and `this.scene.sleep()` / `this.scene.wake()`. The sleeping ExplorationScene preserves all its state.
- When the encounter ends, `this.scene.stop('BreachDefense')` and `this.scene.wake('Exploration')` returns the player to exactly where they left off.
- This pattern is standard for Phaser UI scenes and mini-games overlaid on a main world scene.

**Encounter launch flow:**

```
ExplorationScene: player triggers encounter event (door/NPC/zone)
    ↓ eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, { type, config })
React (UnifiedGamePage): receives event, switches HUD to encounter mode
    ↓ eventBridge.emit(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, { type, config })
ExplorationScene: listens, calls this.scene.sleep() + this.scene.launch('BreachDefense', config)
BreachDefenseScene: runs, emits BREACH_VICTORY or BREACH_GAME_OVER
    ↓ eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, { type, score, outcome })
React (UnifiedGamePage): receives result, updates unified score, switches HUD back to RPG mode
    ↓ eventBridge.emit(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER)
ExplorationScene: listens, calls this.scene.stop('BreachDefense') + this.scene.wake()
    Player is back in the world exactly where they left.
```

**Alternative considered: React route stays at `/` throughout.** The standalone `/breach` route can be preserved as an optional arcade mode accessed separately (decision deferred). All in-game TD encounters go through the scene overlay pattern.

### Decision 3: Act State Location — React-Owned, EventBridge-Synchronized

**Recommendation: Act state lives in a React custom hook (`useGameState`). Phaser scenes read act context via data passed at scene init or via EventBridge query events. React persists to localStorage.**

Rationale:
- React already owns all PrivacyQuest state (completedNPCs, completedZones, privacyScore, completedRooms). Extending this to act progression is natural.
- Phaser scenes do not need to know the current act for their own operation — the act context shapes what content is available (which rooms unlock, which encounter triggers fire), and that logic lives in React when the player navigates between rooms.
- When Phaser scenes need act-specific behavior (e.g., music track), React pushes the information at room-load time: `REACT_LOAD_ROOM` event payload includes `{ room, act, completedNPCs, ... }`.
- localStorage persistence already works in React (existing pattern). Centralizing all state there avoids synchronization bugs.

**Act state shape (extends existing localStorage keys):**

```typescript
interface UnifiedGameState {
  // Existing (preserved)
  completedRooms: string[];
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];
  collectedStories: string[];

  // New for v2.0
  currentAct: 1 | 2 | 3;
  actFlags: Record<string, boolean>;        // narrative flags: 'met_riley', 'saw_breach', etc.
  encounterResults: Record<string, {        // per encounter-id
    completed: boolean;
    score: number;
    outcome: 'victory' | 'defeat';
  }>;
  unifiedScore: number;                     // replaces separate privacyScore + securityScore
  currentRoomId: string | null;             // for resume-on-load
  playerPosition: { x: number; y: number } | null;  // for resume (optional, low priority)
  totalPlayTime: number;                    // seconds
  gameStartTime: number;
}
```

### Decision 4: Routing — Collapse to Single Route

**Recommendation: Collapse `/privacy` and `/` into a single React page. Preserve `/breach` as optional standalone arcade mode.**

Rationale:
- The unified game experience lives entirely at `/`.
- `HubWorldPage` and `PrivacyQuestPage` merge into a single `UnifiedGamePage`.
- `BreachDefensePage` stays at `/breach` for direct access but is no longer the primary path — in-game TD encounters go through the scene overlay pattern at `/`.
- This avoids destroying and recreating the Phaser game instance on navigation. The Phaser game is instantiated once on `UnifiedGamePage` mount and lives until unmount.

---

## Target Architecture (v2.0)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Layer (DOM)                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   UnifiedGamePage (/)                         │   │
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ RPG HUD             │  │ Encounter HUD                │   │   │
│  │  │ - Unified score     │  │ - TD: budget/wave/score      │   │   │
│  │  │ - Act indicator     │  │ - PHI sorting interface      │   │   │
│  │  │ - Dept progress     │  │ (swaps in when encounter     │   │   │
│  │  │ - Dialogue overlay  │  │  is active)                  │   │   │
│  │  └─────────────────────┘  └──────────────────────────────┘   │   │
│  │  useGameState hook — unified state + localStorage + act logic  │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                              │ EventBridge                            │
├──────────────────────────────┼──────────────────────────────────────┤
│                    Phaser Layer (Canvas)                              │
│  ┌───────────────────────────┴────────────────────────────────────┐ │
│  │  BootScene — unchanged: assets, textures, anims, then start    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ExplorationScene (primary — always running)                  │   │
│  │  - Loads room data from React via REACT_LOAD_ROOM             │   │
│  │  - Door detection → room transitions (scene.restart + newData)│   │
│  │  - Encounter trigger detection → emits ENCOUNTER_TRIGGERED    │   │
│  │  - Sleeps when encounter launches, wakes on return            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  BreachDefenseScene (encounter overlay — launched on demand)  │   │
│  │  - Receives encounter config (wave count, tower subset, etc.) │   │
│  │  - Condensed 4-wave format when run as encounter              │   │
│  │  - Full 10-wave format at /breach (standalone arcade mode)    │   │
│  │  - Emits ENCOUNTER_COMPLETE when done, then stops itself      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PHISortingScene (new — encounter overlay for PHI sorting)    │   │
│  │  OR: PHI sorting is a React-only overlay (no Phaser scene)    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries (New and Modified)

### New Components

| Component | Type | Responsibility | Notes |
|-----------|------|---------------|-------|
| `UnifiedGamePage` | React page | Replaces HubWorldPage + PrivacyQuestPage; owns Phaser instance lifecycle | Merge/rewrite of two existing pages |
| `useGameState` | React hook | Unified state: act, score, rooms, encounters, persistence | Extracts state from PrivacyQuestPage into a reusable hook |
| `RPGHud` | React component | Compliance score, act indicator, department progress bar | Replaces `RoomProgressHUD` |
| `EncounterHud` | React component | Swaps in when encounter is active; wraps existing BreachDefense HUD | Thin wrapper around existing HUD components |
| Door system | Phaser (ExplorationScene) | Detects player at door triggers, emits room transition or encounter events | New subsystem within existing scene |
| Hallway rooms | Room data (JSON) | Short connecting corridors between departments with bulletin boards | New entries in roomData.json |
| `actProgressionLogic` | TypeScript module | Pure function: given game state → returns current act | Called from useGameState |

### Modified Components

| Component | Change | Scope |
|-----------|--------|-------|
| `ExplorationScene.ts` | Add door detection, room-to-room transition, encounter trigger, sleep/wake hooks | Medium — additive |
| `BreachDefenseScene.ts` | Add encounter mode (condensed config via init data), emit ENCOUNTER_COMPLETE | Small — init data path added |
| `EventBridge.ts` | Add new event constants for encounter lifecycle, act transitions, unified score | Small |
| `roomData.json` | Add hallway rooms; add door connection metadata to existing rooms | Medium — data changes |
| `config.ts` | No scene list change needed; PHISortingScene added if built as Phaser scene | Small |
| `App.tsx` | Replace HubWorldPage + PrivacyQuestPage routes with UnifiedGamePage at `/` | Small |

### Unchanged Components

| Component | Why Unchanged |
|-----------|--------------|
| `BootScene.ts` | Asset loading, texture generation — no structural change needed |
| `SpriteFactory.ts` | Programmatic textures — no change |
| `EventBridge.ts` (pattern) | Singleton pattern preserved; only constants extended |
| `BreachDefensePage.tsx` | Stays as standalone arcade mode at `/breach` |
| Existing dialogue/modal components | All preserved; dialogue system is correct as-is |
| `tutorialContent.ts`, `constants.ts` | TD game data unchanged |

---

## Data Flow

### Room Transition Flow (Door-to-Door)

```
Player walks to door → ExplorationScene detects proximity
    ↓ eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, { targetRoomId })
UnifiedGamePage: receives exit event
    → checks unlock conditions (useGameState)
    → if locked: emits feedback (visual/audio), does not proceed
    → if unlocked: updates currentRoomId in state, emits REACT_LOAD_ROOM
    ↓ eventBridge.emit(BRIDGE_EVENTS.REACT_LOAD_ROOM, { room: nextRoom, act, completedNPCs, ... })
ExplorationScene: receives REACT_LOAD_ROOM
    → this.scene.restart(newRoomData)  [or this.scene.start with same key]
    → renders new room, places player at spawn point (door entrance)
```

### Encounter Launch Flow (TD)

```
ExplorationScene: player triggers encounter zone (e.g., IT Office breach alert)
    ↓ eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, { encounterId, type: 'breach-defense', config })
UnifiedGamePage: receives trigger
    → saves current room to state
    → switches HUD mode to 'encounter'
    ↓ eventBridge.emit(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, { type: 'breach-defense', config })
ExplorationScene: listens for REACT_LAUNCH_ENCOUNTER
    → this.scene.sleep()
    → this.scene.launch('BreachDefense', encounterConfig)
BreachDefenseScene: runs encounter (condensed 4-wave format)
    ↓ eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, { encounterId, score, outcome })
UnifiedGamePage: receives result
    → records encounter result in useGameState
    → updates unified compliance score
    → switches HUD mode back to 'exploration'
    ↓ eventBridge.emit(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER)
ExplorationScene: listens, this.scene.stop('BreachDefense'), this.scene.wake()
    → player resumes in-world, NPC reacts to encounter outcome
```

### Act Progression Flow

```
useGameState: monitors completedRooms, encounterResults, actFlags
    ↓ actProgressionLogic(state) → returns currentAct
    When act changes:
    ↓ eventBridge.emit(BRIDGE_EVENTS.ACT_CHANGED, { from: 1, to: 2 })
ExplorationScene: listens, shifts music track
UnifiedGamePage: renders act transition dialogue sequence
    → blocks exploration briefly (fade, transition text, NPC line)
    → resumes
```

### Unified Score Flow

```
Dialogue choice scored → PrivacyQuestPage emits score delta → useGameState.addScore(delta)
Encounter complete → ENCOUNTER_COMPLETE event → useGameState.addEncounterScore(result)
Observation zone spotted → zone event → useGameState.addScore(+points)
    All paths:
    ↓ useGameState updates unifiedScore in state + localStorage
    ↓ RPGHud re-renders with animated score change
```

---

## PHI Sorting Encounter: Scene vs. React-Only

**Recommendation: Build PHI Sorting as a React-only overlay. No new Phaser scene.**

Rationale:
- PHI sorting is a document-interaction UI (drag-and-drop buckets). This is React's domain, not Phaser's.
- Building it in React avoids needing a Phaser scene, sleep/wake lifecycle, and canvas-based drag interactions.
- ExplorationScene sleeps when the sorting overlay is active (same pattern as TD encounters, but the overlay is React rather than a Phaser scene).
- The ExplorationScene send `ENCOUNTER_TRIGGERED` → React shows the PHISortingOverlay component → on complete, React emits `REACT_RETURN_FROM_ENCOUNTER` → ExplorationScene wakes.

**What this means:** `PHISortingOverlay` is a new React component, full-screen, rendered over the Phaser canvas. It handles all interaction internally. It needs no Phaser scene partner.

---

## New EventBridge Event Constants

The following constants are added to `BRIDGE_EVENTS` in `EventBridge.ts`. Existing events are unchanged.

```typescript
// Phaser → React (new)
ENCOUNTER_TRIGGERED: 'encounter:triggered',     // ExplorationScene triggers encounter
DOOR_APPROACHED: 'exploration:door-approached', // Player near a room door (for UI hints)

// React → Phaser (new)
REACT_LAUNCH_ENCOUNTER: 'react:launch-encounter',      // React confirms, Phaser launches
REACT_RETURN_FROM_ENCOUNTER: 'react:return-from-encounter', // React tells Phaser to wake
REACT_LOAD_ROOM: 'react:load-room',                   // Already exists — payload extended with act
REACT_SET_ACT: 'react:set-act',                        // React tells scenes current act (for music)

// Bidirectional (new)
ENCOUNTER_COMPLETE: 'encounter:complete',    // BreachDefenseScene → React: result
ACT_CHANGED: 'act:changed',                 // React → Phaser: act number shifted
```

Events kept exactly as-is: all existing `EXPLORATION_*`, `BREACH_*`, `REACT_DIALOGUE_COMPLETE`, `REACT_PAUSE_EXPLORATION`, `REACT_PLAY_SFX`, `REACT_SET_MUSIC_VOLUME`.

---

## Recommended Project Structure (v2.0 Additions)

```
client/src/
├── phaser/
│   ├── EventBridge.ts            ← MODIFIED: new encounter/act event constants
│   ├── config.ts                 ← MODIFIED: no scene list change unless PHISortingScene added
│   └── scenes/
│       ├── BootScene.ts          ← UNCHANGED
│       ├── ExplorationScene.ts   ← MODIFIED (primary): door system, encounter triggers, sleep/wake
│       ├── HubWorldScene.ts      ← RETIRED or repurposed as hospital-entrance room data
│       └── BreachDefenseScene.ts ← MODIFIED: accept encounter config via init data
├── pages/
│   ├── UnifiedGamePage.tsx       ← NEW: merges HubWorldPage + PrivacyQuestPage
│   ├── HubWorldPage.tsx          ← RETIRED (logic migrated to UnifiedGamePage)
│   ├── PrivacyQuestPage.tsx      ← RETIRED (logic migrated to UnifiedGamePage)
│   └── BreachDefensePage.tsx     ← UNCHANGED (standalone arcade mode at /breach)
├── hooks/
│   └── useGameState.ts           ← NEW: unified state hook (extracted from PrivacyQuestPage)
├── game/
│   ├── actProgressionLogic.ts    ← NEW: pure function, state → currentAct
│   └── breach-defense/           ← UNCHANGED
│       ├── constants.ts
│       └── tutorialContent.ts
├── components/
│   ├── RPGHud.tsx                ← NEW: score + act + department progress
│   ├── EncounterHud.tsx          ← NEW: thin wrapper, swaps in during encounters
│   ├── PHISortingOverlay.tsx     ← NEW (Phase 3): full-screen React PHI sorting UI
│   ├── HallwayHub.tsx            ← RETIRED (replaced by door-to-door navigation)
│   ├── RoomProgressHUD.tsx       ← RETIRED (replaced by RPGHud)
│   └── breach-defense/           ← UNCHANGED
│       ├── CodexModal.tsx
│       ├── RecapModal.tsx
│       └── TutorialModal.tsx
└── data/
    ├── roomData.json             ← MODIFIED: add hallway rooms, door connection metadata
    └── gameData.json             ← UNCHANGED
```

---

## Architectural Patterns

### Pattern 1: ExplorationScene as Data-Driven World

**What:** ExplorationScene restarts with new room data rather than navigating to a new React page or Phaser scene. All rooms — including hallways — are entries in `roomData.json`. The scene renders whatever room it's given.

**When to use:** Every room transition. Identical pattern to the existing room-loading system, extended with door triggers.

**Trade-offs:** Scene restart loses in-memory state — this is intentional. Persistent state lives in React (useGameState). The scene receives it fresh at each init via `REACT_LOAD_ROOM` payload. No state leaks between rooms.

**Example:**
```typescript
// ExplorationScene.ts — door trigger handler
private handleDoorInteraction(targetRoomId: string) {
  eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, { targetRoomId });
  // React validates unlock, then emits REACT_LOAD_ROOM with new room data
  // ExplorationScene.init() receives it and restarts
}
```

### Pattern 2: Sleep/Wake for Encounter Overlay

**What:** When a TD encounter launches, ExplorationScene calls `this.scene.sleep()`. BreachDefenseScene launches as a parallel scene on top. On complete, BreachDefenseScene stops and ExplorationScene wakes. Player position and room state survive intact.

**When to use:** Any encounter type implemented as a Phaser scene (BreachDefense inbound and outbound TD).

**Trade-offs:** Requires careful event listener cleanup on sleep to avoid duplicate listeners on wake. The `shutdown` / `wake` lifecycle hooks in Phaser must be used, not just `create` / `destroy`.

```typescript
// ExplorationScene.ts
create() {
  // ... existing setup ...
  eventBridge.on(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, this.onLaunchEncounter, this);
  eventBridge.on(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER, this.onReturnFromEncounter, this);
}

private onLaunchEncounter = (data: { type: string; config: unknown }) => {
  this.scene.sleep();
  this.scene.launch('BreachDefense', data.config);
};

private onReturnFromEncounter = () => {
  this.scene.stop('BreachDefense');
  this.scene.wake();
};

shutdown() {
  eventBridge.off(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, this.onLaunchEncounter, this);
  eventBridge.off(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER, this.onReturnFromEncounter, this);
  // ... existing shutdown ...
}
```

### Pattern 3: React-Owned Act State, Phaser-Notified

**What:** Act progression logic runs entirely in React (useGameState + actProgressionLogic). When the act changes, React emits `ACT_CHANGED` to Phaser so scenes can adjust music and environment. Phaser never independently decides an act has changed.

**When to use:** Act transitions. Also applies to any other global narrative flags.

**Trade-offs:** Act state is never duplicated in Phaser scene state, eliminating sync bugs. The downside is that scenes cannot query the current act without an EventBridge round-trip — mitigated by passing act context in the `REACT_LOAD_ROOM` payload so scenes always have it at room-load time.

### Pattern 4: Encounter Config via Scene Init Data

**What:** BreachDefenseScene receives its configuration (wave count, available tower types, encounter ID) via the `init(data)` hook, not hardcoded. This allows the same scene to run in full standalone mode (10 waves, all towers) at `/breach` or condensed encounter mode (4 waves, 3 tower types) when launched from ExplorationScene.

**When to use:** Any time BreachDefenseScene is launched as an encounter.

**Example:**
```typescript
// BreachDefenseScene.ts
interface BreachDefenseInitData {
  encounterId?: string;        // undefined = standalone mode
  waveCount?: number;          // defaults to 10
  availableTowers?: string[];  // defaults to all 6
}

init(data: BreachDefenseInitData) {
  this.encounterId = data.encounterId ?? null;
  this.maxWaves = data.waveCount ?? 10;
  this.availableTowerTypes = data.availableTowers ?? Object.keys(TOWERS);
}
```

---

## Anti-Patterns

### Anti-Pattern 1: Using React Router Navigation for In-Game Transitions

**What people do:** Call `navigate('/breach')` to launch a TD encounter from within the RPG.

**Why it's wrong:** Destroys the React component tree and Phaser game instance. Loses all game state — act, score, room, NPC completion. The Phaser game is re-created from scratch. This is what the current architecture does and is the primary problem being solved.

**Do this instead:** Scene sleep/wake pattern (Pattern 2). React stays at `/`. Phaser scenes coordinate the transition.

### Anti-Pattern 2: Storing Act State in Phaser Scene Variables

**What people do:** Add `private currentAct = 1` to ExplorationScene. Increment it when conditions are met.

**Why it's wrong:** Scene restarts on room transitions — the variable resets. State cannot be persisted to localStorage from inside a Phaser scene. Act state would be lost on page refresh.

**Do this instead:** Act state lives in `useGameState` (React hook). Persist via localStorage. Phaser reads it from the `REACT_LOAD_ROOM` event payload at each room load.

### Anti-Pattern 3: Building PHI Sorting in Phaser

**What people do:** Create a `PHISortingScene` with Phaser drag-and-drop for document sorting.

**Why it's wrong:** Phaser drag-and-drop for document UI elements is significantly more complex than React's native HTML drag-and-drop or pointer events. The sorting interface is a document/form metaphor — exactly what React renders well. Building it in Phaser adds canvas-based hit testing, custom drag state, and layout constraints for no gameplay benefit.

**Do this instead:** React overlay component. ExplorationScene sleeps. React renders the sorting UI. On complete, React emits return event, scene wakes.

### Anti-Pattern 4: Merging BreachDefenseScene Into ExplorationScene

**What people do:** Move TD game logic into ExplorationScene to avoid the sleep/wake complexity.

**Why it's wrong:** BreachDefenseScene is ~700 LOC of grid, pathfinding, tower management, enemy AI, and projectile physics. ExplorationScene is ~600 LOC. Merging them creates an unmanageable 1,300+ LOC scene with two completely different game loops running in the same `update()`. Logic separation is the primary reason scenes exist.

**Do this instead:** Keep scenes separate. Use sleep/wake overlay pattern. The complexity of sleep/wake is small compared to maintaining a merged god-scene.

### Anti-Pattern 5: Re-registering EventBridge Listeners Without Cleanup

**What people do:** Add `eventBridge.on(EVENT, handler)` in ExplorationScene `create()`. Forget to add `eventBridge.off(EVENT, handler)` in `shutdown()`. Scene restarts on room transitions — every restart adds another listener.

**Why it's wrong:** After 6 room transitions, 6 listeners fire for each event. Event handlers double-fire on the second room, triple-fire on the third. This is an existing bug risk in the codebase and becomes critical with sleep/wake cycles added.

**Do this instead:** Every `eventBridge.on()` in a scene must have a matching `eventBridge.off()` in `shutdown()`. Use `this` as the context argument so Phaser can batch-remove listeners: `eventBridge.off(EVENT, handler, this)`.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Direction | Notes |
|----------|---------------|-----------|-------|
| UnifiedGamePage ↔ ExplorationScene | EventBridge (REACT_LOAD_ROOM, EXPLORATION_EXIT_ROOM) | Bidirectional | Primary room navigation channel |
| UnifiedGamePage ↔ BreachDefenseScene | EventBridge (ENCOUNTER_COMPLETE, REACT_LAUNCH_ENCOUNTER) | Bidirectional | Encounter lifecycle |
| ExplorationScene ↔ BreachDefenseScene | Phaser scene manager (sleep/launch/stop/wake) | Scene A controls Scene B | No direct data sharing; config via init data |
| useGameState ↔ localStorage | Direct read/write in React effects | Hook → storage | Existing pattern extended |
| actProgressionLogic ↔ useGameState | Pure function call | Hook calls function | No side effects; testable |
| BreachDefensePage ↔ BreachDefenseScene | Existing EventBridge pattern | Unchanged | Standalone arcade mode preserved |

### Build Order for v2.0 Phases

The following ordering reflects data dependencies between phases:

```
Phase 0 (Bug stabilization — prerequisite)
    No new architecture; fixes must not change APIs
    ↓

Phase 1 (Unified Navigation)
    Requires: UnifiedGamePage, useGameState, door system in ExplorationScene
    Produces: single-route game, room-to-room walking, hallway rooms
    ↓

Phase 2 (Encounter Integration — TD)
    Requires: Phase 1 complete (ExplorationScene door system exists as model for encounter triggers)
    Requires: New EventBridge events (ENCOUNTER_TRIGGERED, ENCOUNTER_COMPLETE, REACT_LAUNCH_ENCOUNTER)
    Requires: BreachDefenseScene init data path (encounter config)
    Produces: sleep/wake encounter pattern, TD triggered from RPG world
    ↓

Phase 3 (PHI Sorting)
    Requires: Phase 1 (encounter trigger system from ExplorationScene established)
    Requires: Phase 2 (React knows how to switch HUD mode for encounters)
    Independent of: Phase 2 BreachDefense changes (different encounter type)
    Produces: PHISortingOverlay React component
    ↓

Phase 4 (Outbound TD)
    Requires: Phase 2 (BreachDefenseScene encounter config pattern)
    Requires: New outbound threat/tower data in constants.ts
    ↓

Phase 5 (Three-Act Narrative)
    Requires: Phase 1 (room navigation), Phase 2 (encounter results)
    Requires: actProgressionLogic module, ACT_CHANGED event
    Produces: act state, music shifts, transition dialogue
    Can be partially done in Phase 1 (act data structure defined early)
    ↓

Phase 6 (Breach Triage — if scoped)
    Requires: Phase 3 pattern (React overlay encounter type)
    ↓

Phase 7 (Audio, Polish, End-of-Game)
    Requires: All phases complete
    No new architectural components; additive polish
```

**Critical path:** Phase 1 is the foundation. Phases 2, 3, 4, 5 all depend on it. Phase 1 should define and implement `useGameState`, `UnifiedGamePage`, the `REACT_LOAD_ROOM` event payload extension, and the `EXPLORATION_EXIT_ROOM` / door detection system — because everything downstream uses these contracts.

---

## Open Architecture Questions

These remain unresolved and need answers during Phase 1 planning:

1. **HubWorldScene retirement:** Should HubWorldScene be removed from the scene list (and its "hospital entrance" area become a room in roomData.json), or should it be kept as a special scene for the Act 1 intro sequence? Removing it simplifies the scene count; keeping it preserves the existing intro polish.

2. **Save/resume granularity:** The `playerPosition` field in UnifiedGameState is marked optional. Is per-door granularity (resume at the last room entered) sufficient, or does the player need to resume at their exact pixel position mid-room? Mid-room saves require the position to be written on every room exit, which is already the transition point.

3. **Outbound TD path direction:** The existing serpentine path flows inward (entrance → hospital systems). For outbound TD, do we reverse the path (hospital → exit) or define a new layout? Reversing reuses all existing path-drawing code with a direction flag; a new layout requires new waypoint data.

4. **BreachDefense standalone mode:** If `/breach` is preserved, does it share the BreachDefenseScene configuration or always run full mode? Sharing the scene with a `standalone: true` flag in init data is cleaner than maintaining two separate page configs.

---

## Sources

- Direct codebase inspection: `ExplorationScene.ts`, `BreachDefenseScene.ts`, `HubWorldScene.ts`, `EventBridge.ts`, `PrivacyQuestPage.tsx`, `BreachDefensePage.tsx`, `App.tsx`, `config.ts` — HIGH confidence (actual running code, March 2026)
- `.planning/ENHANCEMENT_BRIEF.md` — HIGH confidence (authoritative design document for this milestone)
- `.planning/PROJECT.md` — HIGH confidence (project requirements and constraints)
- [Phaser Scene Manager — sleep/wake/launch](https://docs.phaser.io/phaser/concepts/scenes/scene-manager) — HIGH confidence (official docs; sleep/wake is a documented scene lifecycle pattern)
- [Phaser Scene lifecycle hooks](https://docs.phaser.io/api-documentation/class/scene-scene) — HIGH confidence (official API)

---
*Architecture research for: Phaser 3 + React unified RPG — navigation, encounters, narrative arc*
*Researched: 2026-03-26*
