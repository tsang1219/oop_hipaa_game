# Stack Research

**Domain:** Phaser 3 RPG — unified hospital navigation, encounter integration, act-based narrative arc
**Researched:** 2026-03-26
**Confidence:** HIGH — all core APIs verified against official Phaser docs (docs.phaser.io) and rexrainbow reference

---

## Context: What Already Exists (Not Re-Researched)

| Component | Version | Status |
|-----------|---------|--------|
| Phaser | ^3.90.0 | Active — 4 scenes (Boot, HubWorld, Exploration, BreachDefense) |
| React | ^18.3.1 | Active — dialogue overlays, HUD, modals |
| TypeScript | ^5.6.3 | Active |
| Vite | ^5.4.21 | Active |
| Tailwind | ^3.4.17 | Active |
| EventBridge | custom | Active — Phaser EventEmitter singleton for React↔Phaser |
| nanoid | ^5.1.6 | Active — already installed |

**Zero new npm packages are required for v2.0.** All capabilities for scene transitions,
unified state, encounter integration, and act progression exist in Phaser 3.90's built-in APIs.

---

## Recommended Stack

### Core Technologies (No Changes)

| Technology | Version | New Usage for v2.0 | Why This API |
|------------|---------|-------------------|--------------|
| Phaser ScenePlugin | ^3.90.0 | `scene.launch()`, `scene.sleep()`, `scene.wake()` for encounter overlay pattern | Keeps RPG scene in memory during encounter; no rebuild cost on return |
| Phaser CameraEffects | ^3.90.0 | `cameras.main.fadeOut()` + `FADE_OUT_COMPLETE` event for door transitions | Built-in black-screen crossfade; matches SNES aesthetic; zero boilerplate vs. `scene.transition()` |
| Phaser Registry (DataManager) | ^3.90.0 | `this.registry.set/get` for unified game state across all scenes | Game-wide DataManager accessible in every scene without coupling; fires `changedata` events React can subscribe to |
| Phaser Scene Events | ^3.90.0 | `Phaser.Scenes.Events.WAKE` for encounter return detection | Fires when ExplorationScene wakes from sleep; clean hook for NPC reactions + fade-in |
| EventBridge (existing) | custom | New event constants for `ENCOUNTER_TRIGGER`, `ENCOUNTER_COMPLETE`, `ACT_TRANSITION`, `ROOM_UNLOCKED` | Existing pattern; extend event list rather than introduce a second bus |

### Supporting Libraries (Zero New Installs)

| Library | Already Present | New Role in v2.0 |
|---------|----------------|-----------------|
| `nanoid` | Yes (^5.1.6) | Key encounter session results in registry (`encounterResult_${nanoid()}`) |
| `localStorage` | Browser API | Serialize registry state on act transitions + room completions for save/resume |

---

## Pattern 1: Door-to-Door Scene Transitions

**Decision:** Camera fade + `scene.start('Exploration', data)` with `init(data)` receiving the next room ID.

**Why NOT `scene.transition()`:** The built-in `transition()` method requires an `onUpdate` callback to manually lerp a visual effect — it is a primitive, not a polished crossfade. Camera `fadeOut()` + `FADE_OUT_COMPLETE` produces the same black-screen crossfade in fewer lines and with a cleaner event model.

**Why NOT multiple ExplorationScene subclasses:** ExplorationScene already loads room data dynamically via `init(data)`. Passing a `roomId` string (looked up from registry) instead of the full `Room` object is a zero-cost extension of the existing pattern.

**Pattern:**

```typescript
// ExplorationScene — player presses SPACE at a door
private enterDoor(targetRoomId: string) {
  this.paused = true;
  this.cameras.main.fadeOut(300, 0, 0, 0);
  this.cameras.main.once(
    Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
    () => {
      // Persist current room completion to registry before destroying scene
      this.flushCompletionToRegistry();
      this.scene.start('Exploration', { roomId: targetRoomId, fromDoor: true });
    }
  );
}

// ExplorationScene.init() — receives data on restart
init(data: { roomId: string; fromDoor?: boolean }) {
  this.roomId = data.roomId;
  this.fromDoor = data.fromDoor ?? false;
  // ... existing reset logic
}

// ExplorationScene.create() — fade in on arrival
create() {
  // ... existing setup
  if (this.fromDoor) {
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
```

**Fade duration:** 300ms out, 300ms in. Adjust to 150ms if playtesting reads sluggish.

---

## Pattern 2: Unified Game State (Registry)

**Decision:** `this.registry` is the single runtime source of truth for all cross-scene state.
localStorage is the persistence layer (write on act transition + room completion, read on boot).

**Why NOT a global TypeScript module singleton:** A module-level singleton persists across hot-reloads
and can hold stale state between playthroughs. The Phaser registry is lifecycle-managed (cleared on `game.destroy()`) and accessible from every scene without an import.

**Why NOT Zustand/Redux:** React-centric state stores require Phaser scenes to poll or use EventBridge
as a bridge. The registry fires native `changedata` events that React can subscribe to directly via
`game.registry.events.on('changedata-complianceScore', handler)` — no extra library.

**Registry schema:**

```typescript
// Declare in client/src/types/GameState.ts — shared between scenes and React
interface GameRegistryState {
  // Act progression
  currentAct: 1 | 2 | 3;

  // Room navigation
  currentRoomId: string;
  unlockedRoomIds: string[];   // rooms the player may enter
  completedRoomIds: string[];  // rooms with all content done

  // Per-room completion (mirrors existing localStorage shape)
  rooms: Record<string, {
    completedNPCs: string[];
    completedZones: string[];
    collectedItems: string[];
    patientStoryUnlocked: boolean;
  }>;

  // Encounter results (keyed by encounter ID)
  encounterResults: Record<string, {
    type: 'td-inbound' | 'td-outbound' | 'phi-sorting';
    score: number;
    completed: boolean;
  }>;

  // Pending encounter (written before launch, read by encounter scene)
  pendingEncounter: {
    id: string;
    type: 'td-inbound' | 'td-outbound' | 'phi-sorting';
    waveCount?: number;
    availableTowers?: string[];
  } | null;

  // Score
  complianceScore: number;

  // Audio
  musicMuted: boolean;
  currentAct1Track: string;  // bgm key for act 1
}
```

**Registry vs. EventBridge separation:**
- Registry: persistent state (score, act, unlocks, encounter results) — readable by any scene at any time
- EventBridge: imperative signals (dialogue open/close, encounter launch, NPC reaction trigger) — fire-and-forget, one listener expected

Keep them separate. Mixing them (storing ephemeral signals in registry, or reading game state from EventBridge) creates subtle timing bugs.

**BootScene hydration:**

```typescript
// BootScene.create() — read localStorage, initialize registry defaults
const saved = JSON.parse(localStorage.getItem('privacyquest_v2') ?? 'null');
const defaults: GameRegistryState = {
  currentAct: 1,
  unlockedRoomIds: ['hospital-entrance'],
  completedRoomIds: [],
  rooms: {},
  encounterResults: {},
  pendingEncounter: null,
  complianceScore: 0,
  musicMuted: false,
};
this.registry.merge(saved ?? defaults);
```

**React subscription to registry:**

```typescript
// In PrivacyQuestPage.tsx or unified GamePage.tsx
useEffect(() => {
  const handler = (_parent: unknown, value: number) => setScore(value);
  game.registry.events.on('changedata-complianceScore', handler);
  return () => game.registry.events.off('changedata-complianceScore', handler);
}, [game]);
```

---

## Pattern 3: Encounter Trigger / Return

**Decision:** `scene.launch('BreachDefense', config)` + `scene.sleep()` to overlay the encounter on the sleeping RPG world. On encounter complete, `scene.stop('BreachDefense')` + `scene.wake('Exploration')` with results written to registry before the wake.

**Why `launch()` + `sleep()` over `scene.start()`:**
- `scene.start()` shuts down the current scene — ExplorationScene must fully rebuild on return (expensive, loses exact player position and mid-room state)
- `scene.launch()` runs BreachDefense in parallel; `scene.sleep()` hides Exploration without destroying it
- On `scene.wake()`, Exploration resumes exactly where it left off — no rebuild, no re-`init`, player stands at the same tile

**Why `scene.stop('BreachDefense')` over `scene.sleep('BreachDefense')`:**
- BreachDefense holds significant state (towers, enemies, projectiles, timers)
- Sleeping it keeps that state alive for no benefit — the next encounter starts fresh
- `stop()` gives it a full shutdown/cleanup cycle, preventing memory buildup

**Pattern:**

```typescript
// ExplorationScene — narrative event triggers TD encounter
private triggerTDEncounter(encounterId: string, config: PendingEncounter) {
  this.paused = true;
  this.registry.set('pendingEncounter', config);

  this.cameras.main.fadeOut(400, 0, 0, 0);
  this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    this.scene.launch('BreachDefense');
    this.scene.sleep();  // hide Exploration, keep it in memory
  });
}

// ExplorationScene.create() — register wake listener (fires on scene.wake())
create() {
  this.events.on(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
  // ... existing setup
}

private handleWakeFromEncounter(_sys: Phaser.Scenes.Systems, data: unknown) {
  const pending = this.registry.get('pendingEncounter') as PendingEncounter | null;
  if (!pending) return;

  const result = this.registry.get(`encounterResult_${pending.id}`);
  this.registry.set('pendingEncounter', null);

  this.cameras.main.fadeIn(400, 0, 0, 0);
  if (result?.completed) {
    this.triggerNarrativeConsequence(pending.id, result.score);
  }
}

shutdown() {
  this.events.off(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
  // ... existing cleanup
}

// BreachDefenseScene — condensed 4-wave encounter ends
private onEncounterVictory(totalScore: number) {
  const pending = this.registry.get('pendingEncounter') as PendingEncounter;

  // Write results before wake — ExplorationScene reads them in its WAKE handler
  this.registry.set(`encounterResult_${pending.id}`, {
    type: pending.type,
    score: totalScore,
    completed: true,
  });
  this.registry.inc('complianceScore', totalScore);

  this.cameras.main.fadeOut(400, 0, 0, 0);
  this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    this.scene.stop();               // full BreachDefense cleanup
    this.scene.wake('Exploration');  // resumes RPG from sleep
  });
}
```

**Critical constraint (from CLAUDE.md):** Every `events.on()` in `create()` requires a matching `events.off()` in `shutdown()`. This applies to the WAKE listener above — it is already modeled correctly in the pattern.

---

## Pattern 4: Act Progression System

**Decision:** Plain TypeScript function (`checkActProgression`) reading registry state. No FSM library.
Three acts, two transitions, simple condition checks. Acts advance when narrative conditions are met,
not on score thresholds — the player always progresses.

**Why no XState, robot, or FSM library:**
- Act progression has exactly 3 states with 2 one-way transitions
- XState adds ~50kb and an API surface with more power than this problem needs
- A 30-line TypeScript function reading from the registry handles this cleanly
- The existing codebase uses plain TypeScript state everywhere — consistent

**Act conditions (from ENHANCEMENT_BRIEF.md):**
- Act 1 → 2: Reception + Break Room completed
- Act 2 → 3: Lab + Medical Records + IT Office completed (or TD encounter triggered from IT Office)

**Pattern:**

```typescript
// client/src/game/GameProgressionService.ts — no Phaser import needed
export function checkActProgression(registry: Phaser.Data.DataManager): void {
  const act = (registry.get('currentAct') as number) ?? 1;
  if (act >= 3) return;

  const completedRooms = (registry.get('completedRoomIds') as string[]) ?? [];

  if (act === 1 && isAct1Complete(completedRooms)) {
    advanceToAct(2, registry);
  } else if (act === 2 && isAct2Complete(completedRooms, registry)) {
    advanceToAct(3, registry);
  }
}

function advanceToAct(act: 2 | 3, registry: Phaser.Data.DataManager): void {
  registry.set('currentAct', act);
  // registry 'changedata-currentAct' event fires automatically
  // ExplorationScene listens and shifts music track
  // React HUD listens and updates act indicator
}

function isAct1Complete(completedRooms: string[]): boolean {
  return completedRooms.includes('reception') && completedRooms.includes('break-room');
}

function isAct2Complete(
  completedRooms: string[],
  registry: Phaser.Data.DataManager
): boolean {
  const tdTriggered = !!(registry.get('encounterResult_td-it-office'));
  return (
    completedRooms.includes('laboratory') &&
    completedRooms.includes('medical-records') &&
    (completedRooms.includes('it-office') || tdTriggered)
  );
}
```

**Music shifting on act change:**

```typescript
// ExplorationScene — subscribe to registry act changes
create() {
  this.registry.events.on('changedata-currentAct', this.onActChanged, this);
}

private onActChanged(_parent: unknown, newAct: number) {
  const trackKey = ['', 'bgm_act1', 'bgm_act2', 'bgm_act3'][newAct];
  if (this.bgMusic) {
    this.tweens.add({
      targets: this.bgMusic,
      volume: 0,
      duration: 1500,
      onComplete: () => {
        this.bgMusic?.stop();
        this.bgMusic = this.sound.add(trackKey, { loop: true, volume: 0 });
        this.bgMusic.play();
        this.tweens.add({ targets: this.bgMusic, volume: 0.25, duration: 1500 });
      },
    });
  }
}

shutdown() {
  this.registry.events.off('changedata-currentAct', this.onActChanged, this);
}
```

Existing 3 music tracks (hub theme, exploration theme, breach theme) map directly to Acts 1, 2, 3 respectively — no new audio assets needed for act shifts.

---

## Integration Points: What Changes in Existing Files

| File | Changes for v2.0 | What Stays Unchanged |
|------|-----------------|---------------------|
| `EventBridge.ts` | Add event constants: `ENCOUNTER_TRIGGER`, `ENCOUNTER_COMPLETE`, `ACT_TRANSITION`, `ROOM_UNLOCKED`, `UNIFIED_SCORE_UPDATE` | Singleton pattern, all 26 existing events, `off()` discipline |
| `ExplorationScene.ts` | Add WAKE listener + `handleWakeFromEncounter`; add door detection zones at room edges; replace room picker data handoff with registry-based room loading; add `flushCompletionToRegistry()` before scene restart; add `checkActProgression()` call on room complete | BFS pathfinding, NPC/zone/item interaction, dialogue dim overlay, walk cycle, pause flag |
| `BreachDefenseScene.ts` | Read `pendingEncounter` from registry in `init()`; add condensed 4-wave mode branch guarded by `encounter.waveCount`; call `scene.stop()` + `scene.wake('Exploration')` on complete instead of emitting `BREACH_VICTORY` to React | Full grid/tower/enemy/projectile game loop, all HUD EventBridge events, existing wave logic |
| `config.ts` | No changes — all 4 existing scenes stay registered; no new scene classes needed | All scene registrations, physics config, scale config |
| `BootScene.ts` | Add registry hydration from localStorage in `create()` after asset loading | Asset preloading, animation registration, texture generation |
| `PrivacyQuestPage.tsx` (or new unified `GamePage.tsx`) | Subscribe to registry `changedata-complianceScore` + `changedata-currentAct`; remove HallwayHub room picker UI; add unified HUD (act indicator, department progress) | Dialogue overlay, modal components, EventBridge subscriptions for NPC/zone/item |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `scene.transition({ target, onUpdate })` | Requires manual alpha lerp in `onUpdate` callback — more code, less control; designed for custom visual effects, not simple crossfades | `cameras.main.fadeOut(300)` + `FADE_OUT_COMPLETE` event |
| `scene.start('Exploration')` from within encounter | Destroys BreachDefense AND triggers Exploration `init()` + `create()` — player position and mid-room state lost | `scene.stop()` + `scene.wake('Exploration')` after writing results to registry |
| Multiple ExplorationScene subclasses (one per room/department) | Multiplies scene registration, boot cost, and texture management with zero benefit | Single ExplorationScene with dynamic `roomId` in `init(data)` — already the existing pattern |
| XState / robot / statechart libraries | 50-100kb for a 3-state, 2-transition machine; API surface dwarfs the problem | `GameProgressionService.ts` — 30-line plain TS function reading registry state |
| Zustand / Redux / Jotai for game state | React-centric; Phaser scenes can't subscribe without polling or EventBridge; creates two sources of truth | `this.registry` — Phaser's built-in DataManager; both Phaser scenes and React can subscribe directly |
| Global TypeScript module singleton for game state | Persists across hot-reloads and between playthroughs; can't be cleared on game restart | `this.registry` — lifecycle-managed by Phaser, cleared on `game.destroy()` |
| `scene.sleep('BreachDefense')` after encounter | Keeps full encounter state alive in memory for no benefit — next encounter always starts fresh | `scene.stop('BreachDefense')` — triggers clean `shutdown()`, frees memory |
| Storing imperative signals in registry | Race conditions if two scenes read the same signal at different times | EventBridge for signals, registry for state — keep them separate |
| `createEmitter()` for particles | Removed in Phaser 3.60+ (flagged in CLAUDE.md) | `this.add.particles(x, y, key, config)` |

---

## Alternatives Considered

| Recommended | Alternative | When Alternative Would Be Better |
|-------------|-------------|----------------------------------|
| Single ExplorationScene + dynamic `roomId` | Separate scene per department (ReceptionScene, LabScene, etc.) | If departments needed vastly different physics, tile sizes, or asset sets — they don't here |
| `scene.launch()` + `scene.sleep()` for encounter overlay | React modal covering canvas during encounter | If encounter UI was entirely React-based (no Phaser canvas needed) — TD needs Phaser grid/physics |
| Plain TS `GameProgressionService` for act progression | XState hierarchical state machine | If acts had complex nested states, guard conditions, or needed visualization tooling |
| `this.registry` for game state | Custom EventEmitter-based state store | If state needed computed derivations or middleware — registry is simpler for flat key/value game state |
| Camera fade (300ms) for room transitions | Instant cut | If playtesting shows fade feels slow — drop to 150ms, don't eliminate entirely |
| Existing 3 music tracks reassigned to acts | New audio assets per act | If act tonal shift feels insufficient — defer new audio to Phase 7 (Audio Polish) per Enhancement Brief |

---

## Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| `phaser` | ^3.90.0 | All APIs used here (`registry`, `cameras.main.fadeOut()`, `scene.launch/sleep/wake`, `Phaser.Scenes.Events.WAKE`, `Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE`) have been stable since Phaser 3.17+; confirmed in 3.90 |
| `react` | ^18.3.1 | `game.registry.events.on()` subscription pattern works in React `useEffect` cleanup; no version concerns |
| `typescript` | ^5.6.3 | Type the `GameRegistryState` interface in `client/src/types/GameState.ts`; use it in both scenes and React |

---

## Installation

No new npm packages required.

```bash
# No npm installs needed.
#
# New source files to create:
#   client/src/game/GameProgressionService.ts   — act advancement logic
#   client/src/types/GameState.ts               — GameRegistryState interface
#
# Existing files to extend:
#   client/src/phaser/EventBridge.ts            — add new event constants
#   client/src/phaser/scenes/BootScene.ts       — add registry hydration
#   client/src/phaser/scenes/ExplorationScene.ts — door zones, WAKE listener, registry calls
#   client/src/phaser/scenes/BreachDefenseScene.ts — encounter mode, wake-on-complete
```

---

## Sources

- docs.phaser.io/phaser/concepts/scenes — Scene lifecycle, `start()`, `launch()`, `sleep()`, `wake()` (HIGH confidence — official, current)
- docs.phaser.io/phaser/concepts/scenes/cross-scene-communication — Registry, scene events, direct scene access (HIGH confidence — official, current)
- docs.phaser.io/phaser/concepts/data-manager — Registry API: `set`, `get`, `inc`, `merge`, `changedata` event (HIGH confidence — official, current)
- rexrainbow.github.io/phaser3-rex-notes/docs/site/scenemanager/ — `scene.transition()` parameter list; `isSleeping()`, `isPaused()` status methods (HIGH confidence — community-maintained reference, widely used)
- blog.ourcade.co/posts/2020/phaser-3-fade-out-scene-transition/ — Camera `fadeOut()` + `FADE_OUT_COMPLETE` pattern (MEDIUM confidence — 2020 article; API verified stable in Phaser 3.90)
- phaser.discourse.group/t/scenemanager-methods-start-stop-run-wake-sleep-resume — `sleep()`/`wake()` vs `start()` tradeoffs; community confirmation (MEDIUM confidence)
- phaser.io/examples/v3/view/scenes/sleep-and-wake — Official Phaser sleep/wake example (HIGH confidence)

---

*Stack research for: PrivacyQuest + BreachDefense v2.0 — unified hospital navigation, encounter integration, act progression*
*Researched: 2026-03-26*
