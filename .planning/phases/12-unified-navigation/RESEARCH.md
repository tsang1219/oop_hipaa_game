# Phase 12: Unified Navigation - Research

**Researched:** 2026-03-27
**Domain:** Phaser 3 scene management, React routing collapse, door-to-door RPG navigation
**Confidence:** HIGH (based on direct inspection of all relevant source files + existing ARCHITECTURE.md research)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUN-01 | Game runs on single route (/) with one persistent Phaser instance | Routing collapse: App.tsx removes `/privacy`, UnifiedGamePage replaces HubWorldPage + PrivacyQuestPage; Phaser game lives in one page component |
| FOUN-02 | Unified game state hook (useGameState) tracks department completion, encounter results, act progression, compliance score | Extract from PrivacyQuestPage state; extend schema; new hook file |
| NAV-01 | Door-to-door transitions with camera fade (~300ms) | `this.cameras.main.fadeOut(300)` + `this.scene.restart(newData)` + `fadeIn(300)` — all native Phaser API already used in project |
| NAV-02 | Door visual state indicators (locked/available/completed) | Tint + tween + icon overlay on door graphics object; locked=dark tint, available=pulse glow, completed=checkmark — all existing Phaser patterns in project |
| NAV-03 | Linear department unlock (Reception → Break Room → Lab → Records → IT → ER) | Unlock order array in useGameState; ExplorationScene emits exit event with targetRoomId; React validates before loading |
| NAV-04 | Hallway connectors between departments | New room entries in roomData.json; short rooms (~20x5 tiles) with no NPCs, one door each end; named with `hallway_` prefix |
| NAV-05 | Correct spawn position after transitions | Door registry per room: `doors: [{ id, targetRoomId, spawnPoint }]` added to roomData.json; ExplorationScene init receives `spawnDoorId` |
| NAV-06 | Backtracking through completed areas | completedRooms check in useGameState: completed rooms always passable; only locked (not yet unlocked) rooms are blocked |
| NAV-07 | HallwayHub removal + responsibility transfer | Delete HallwayHub.tsx component; navigation responsibility moves to door-to-door system in ExplorationScene |
| NAV-08 | Hub world → hospital entrance transformation | HubWorldScene logic moved to a hospital entrance room data entry OR HubWorldScene kept as special intro then retired after first load; ARCHITECTURE.md recommends the room-data path |
</phase_requirements>

---

## Summary

Phase 12 converts the three-route, three-scene, two-page architecture into a single continuous hospital experience at `/`. The work is primarily additive restructuring — no game content is lost, the Phaser scene engines are preserved, and the existing EventBridge/dialogue/scoring systems are unchanged.

The highest-confidence recommendation from prior architecture research (ARCHITECTURE.md, 2026-03-26) is to extend `ExplorationScene` as the single world scene loaded with different room data rather than building N linked Phaser scenes. This matches the existing init-data pattern already in the scene. The `HubWorldScene` becomes either a room entry in `roomData.json` (simpler) or a special intro scene that hands off on first boot (preserves intro polish but adds lifecycle complexity).

The phase produces three primary deliverables: (1) `useGameState` hook consolidating all game state into one localStorage-backed structure, (2) `UnifiedGamePage` replacing HubWorldPage + PrivacyQuestPage at `/`, and (3) a door detection + transition system in ExplorationScene that emits `EXPLORATION_EXIT_ROOM` with a `targetRoomId` instead of (or in addition to) the current ESC-to-exit behavior.

**Primary recommendation:** Extend ExplorationScene with door zones using the existing proximity-check pattern from HubWorldScene. React validates unlock, then calls `this.scene.restart(newRoomData)` via the existing `REACT_LOAD_ROOM` event path. Room data gets `doors` array added. No new Phaser scenes required.

---

## Standard Stack

### Core (unchanged — project constraints)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90+ | Canvas/scene management, physics, tweens | Project constraint — all scenes already built on it |
| React 18 | 18.x | Page components, hooks, overlays | Project constraint |
| TypeScript | 5.x | Type safety across both layers | Project constraint |
| Vite 5 | 5.x | Build tool | Project constraint |
| wouter | 3.x | React routing (already used in App.tsx) | Already installed; routing collapse removes routes rather than adding them |

### Supporting (already in project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `localStorage` | Browser native | Game state persistence | useGameState reads/writes all save data |
| Phaser.Events.EventEmitter | Built-in | EventBridge singleton | All React↔Phaser communication |
| Phaser Scene Manager | Built-in | `scene.restart()`, `scene.sleep()`, `scene.wake()` | Room transitions and encounter overlay |

### No new dependencies required for Phase 12.

---

## Architecture Patterns

### Recommended Project Structure (files changed in Phase 12)

```
client/src/
├── pages/
│   ├── UnifiedGamePage.tsx       NEW: merges HubWorldPage + PrivacyQuestPage
│   ├── HubWorldPage.tsx          RETIRED: logic migrated to UnifiedGamePage
│   └── PrivacyQuestPage.tsx      RETIRED: logic migrated to UnifiedGamePage
├── hooks/
│   └── useGameState.ts           NEW: extracted + extended from PrivacyQuestPage
├── phaser/
│   └── scenes/
│       ├── ExplorationScene.ts   MODIFIED: door zones, transition handling, REACT_LOAD_ROOM listener
│       └── HubWorldScene.ts      RETIRED or kept as entrance-only intro
├── components/
│   └── HallwayHub.tsx            DELETED: replaced by door navigation
├── data/
│   └── roomData.json             MODIFIED: add doors[] to each room, add hallway rooms
└── App.tsx                       MODIFIED: single route at /
```

### Pattern 1: ExplorationScene as Data-Driven World (existing, extended)

**What:** ExplorationScene restarts with new room data when a door is triggered. All rooms including hallways and the hospital entrance are entries in roomData.json.

**When to use:** Every room transition. The scene renders whatever room it receives at init.

**How it works:**
1. Player walks to door zone in ExplorationScene
2. Scene emits `EXPLORATION_EXIT_ROOM` with `{ targetRoomId, fromDoorId }`
3. React (UnifiedGamePage) validates unlock via useGameState
4. If locked: emits locked-door feedback event back to scene (visual/audio), no transition
5. If unlocked: finds next room data, emits `REACT_LOAD_ROOM` with `{ room, spawnDoorId, completedNPCs, ... }`
6. ExplorationScene's `REACT_LOAD_ROOM` listener calls `this.scene.restart({ room, spawnDoorId, ... })`
7. Scene `init()` reads spawnDoorId, places player at matching door position

```typescript
// ExplorationScene.ts — door proximity check (new method)
private checkDoorProximity() {
  if (!this.room.doors) return;
  const px = this.player.x;
  const py = this.player.y;
  for (const door of this.room.doors) {
    const dx = Math.abs(px - door.x * TILE - TILE / 2);
    const dy = Math.abs(py - door.y * TILE - TILE / 2);
    if (dx < TILE * 1.5 && dy < TILE * 1.5) {
      this.nearDoor = door;
      return;
    }
  }
  this.nearDoor = null;
}

// ExplorationScene.ts — door transition trigger (new method)
private handleDoorInteraction(door: DoorData) {
  if (this.transitioning) return;
  this.transitioning = true;
  this.cameras.main.fadeOut(300, 0, 0, 0);
  this.time.delayedCall(300, () => {
    eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, {
      targetRoomId: door.targetRoomId,
      fromDoorId: door.id,
    });
  });
}
```

### Pattern 2: Door State Visual Rendering

**What:** Each door in a room is rendered with a visual state based on unlock data passed at init. Three states: locked (dark tint + lock icon), available (glow pulse), completed (checkmark badge).

**When to use:** At ExplorationScene `create()` when building room visuals.

```typescript
// ExplorationScene.ts — in create(), after room build
private renderDoorState(door: DoorData, state: 'locked' | 'available' | 'completed') {
  const doorX = door.x * TILE;
  const doorY = door.y * TILE;
  const doorGfx = this.add.graphics().setDepth(2);

  if (state === 'locked') {
    doorGfx.fillStyle(0x000000, 0.5);
    doorGfx.fillRect(doorX, doorY, TILE * 2, TILE * 3);
    this.add.text(doorX + TILE, doorY + TILE, '🔒', { fontSize: '16px' }).setOrigin(0.5).setDepth(3);
  } else if (state === 'available') {
    const glowCircle = this.add.circle(doorX + TILE, doorY + TILE, 18, 0x4a90e2, 0)
      .setStrokeStyle(2, 0x4a90e2, 0).setDepth(2);
    this.tweens.add({
      targets: glowCircle,
      strokeAlpha: { from: 0, to: 0.6 },
      scale: { from: 0.8, to: 1.3 },
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  } else if (state === 'completed') {
    this.add.text(doorX + TILE, doorY + TILE - 20, '\u2713', {
      fontFamily: '"Press Start 2P"', fontSize: '10px',
      color: '#44ff44', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);
  }
}
```

### Pattern 3: useGameState Hook (new)

**What:** Extracts all state from PrivacyQuestPage into a reusable hook. Adds new fields for act progression, encounter results, and the unified unlock chain.

**When to use:** Instantiated once in UnifiedGamePage. Passed to ExplorationScene via `REACT_LOAD_ROOM` event payload.

```typescript
// hooks/useGameState.ts
interface UnifiedGameState {
  // Existing (migrated from PrivacyQuestPage)
  completedRooms: string[];
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];
  collectedStories: string[];
  privacyScore: number;

  // New for Phase 12
  currentRoomId: string | null;
  currentAct: 1 | 2 | 3;
  actFlags: Record<string, boolean>;
  encounterResults: Record<string, { completed: boolean; score: number; outcome: string }>;
  unifiedScore: number;
}

// Department unlock chain — checked when player tries a door
const UNLOCK_ORDER = ['hospital_entrance', 'reception', 'break_room', 'lab', 'records_room', 'it_office', 'er'];

function isDepartmentUnlocked(roomId: string, completedRooms: string[]): boolean {
  const idx = UNLOCK_ORDER.indexOf(roomId);
  if (idx <= 0) return true; // entrance always unlocked
  const prerequisite = UNLOCK_ORDER[idx - 1];
  return completedRooms.includes(prerequisite);
}

function isDepartmentAccessible(roomId: string, completedRooms: string[]): boolean {
  // Completed rooms always accessible for backtracking
  if (completedRooms.includes(roomId)) return true;
  return isDepartmentUnlocked(roomId, completedRooms);
}
```

### Pattern 4: Room Data Door Schema (roomData.json extension)

**What:** Each room entry gains a `doors` array describing where doors are in the room, what they connect to, and the spawn point on the other side.

**When to use:** Everywhere a door visual or transition needs to reference connection data.

```json
// roomData.json — door schema added to each room
{
  "id": "reception",
  "doors": [
    {
      "id": "reception_to_entrance",
      "targetRoomId": "hospital_entrance",
      "x": 10, "y": 13,
      "side": "bottom",
      "label": "Exit"
    },
    {
      "id": "reception_to_breakroom",
      "targetRoomId": "break_room",
      "x": 18, "y": 7,
      "side": "right",
      "label": "Break Room"
    }
  ],
  "spawnPoint": {"x": 10, "y": 12}
}
```

Note: `spawnPoint` continues to serve as the default spawn when entering from the "previous" room in the linear chain. The `doors[].targetRoomId` tells ExplorationScene where each door leads; when React sends `REACT_LOAD_ROOM` it includes `spawnDoorId` so the scene knows to place the player at the matching door's position.

### Pattern 5: UnifiedGamePage Structure

**What:** New page component at `/` that replaces both HubWorldPage and PrivacyQuestPage. Owns the Phaser instance lifecycle, useGameState, and all React overlays.

**What it owns:**
- `PhaserGame` ref (Phaser instance created once, never recreated on room transition)
- `useGameState` hook
- All dialogue/modal/HUD overlays (migrated from PrivacyQuestPage)
- EventBridge listeners for `EXPLORATION_INTERACT_NPC`, `EXPLORATION_INTERACT_ZONE`, `EXPLORATION_INTERACT_ITEM`, `EXPLORATION_EXIT_ROOM`
- `REACT_LOAD_ROOM` event emitter for room transitions

**What it does NOT own:**
- Room-picker UI (gone — HallwayHub deleted)
- Routing to `/privacy` or `/breach` for normal gameplay (gone)

**Phaser game startup on UnifiedGamePage mount:**
```typescript
// UnifiedGamePage.tsx — on mount, start at hospital entrance
useEffect(() => {
  // After Phaser boots (BootScene → HubWorldScene or direct ExplorationScene),
  // emit REACT_LOAD_ROOM with hospital_entrance room data
  const onSceneReady = (sceneKey: string) => {
    if (sceneKey === 'Boot') {
      // BootScene finished — start the hospital entrance
      const entranceRoom = rooms.find(r => r.id === 'hospital_entrance');
      if (entranceRoom && gameRef.current) {
        gameRef.current.scene.start('Exploration', {
          room: entranceRoom,
          completedNPCs: Array.from(gameState.completedNPCs),
          completedZones: Array.from(gameState.completedZones),
          collectedItems: Array.from(gameState.collectedItems),
          doorStates: computeDoorStates(gameState),
        });
      }
    }
  };
  eventBridge.on(BRIDGE_EVENTS.SCENE_READY, onSceneReady);
  return () => eventBridge.off(BRIDGE_EVENTS.SCENE_READY, onSceneReady);
}, []);
```

### Pattern 6: HubWorldScene Retirement

**Recommendation: Retire HubWorldScene by converting its content to a "hospital_entrance" room in roomData.json.**

This is simpler than keeping HubWorldScene as a special intro scene because:
- ExplorationScene already renders all room types with doors, NPCs, and lighting
- The lobby floor tiles, NPC (Riley), and existing door interactions are fully expressible in room data + ExplorationScene rendering
- Eliminating HubWorldScene removes one scene from the config and one page from routing with no content loss
- The `HIPAA Training Center` title text in HubWorldScene can become a room-banner in ExplorationScene (which already renders room name banners)

The hospital_entrance room entry needs:
- Same 20x15 tile grid dimensions as HubWorldScene (matching existing lobby proportions)
- Riley NPC data entry (already exists in reception room — the hub Riley is different; needs a new NPC entry or reuse with `sceneId: 'riley_hub_intro'`)
- Two doors: `reception_entrance` (forward to Reception) and no backward door (it's the first room)
- Wide open floor with wall perimeter — matches current lobby layout

**If HubWorldScene polish is critical to preserve:** keep it as the scene that plays when BootScene finishes, then on the first SPACE interaction with Riley (or the Reception door), transition to ExplorationScene loaded with `hospital_entrance` room data. This preserves the walking-around-lobby feel but adds lifecycle complexity. Only do this if the existing hub's visual polish is deemed essential.

### Anti-Patterns to Avoid

- **React navigate() for room transitions:** Destroys the Phaser game instance. All transitions stay inside Phaser via `scene.restart()`. React routing stays at `/`.
- **Storing unlock state in ExplorationScene variables:** Scene restarts on every room transition — any private variable is lost. All game state (completedRooms, act, score) lives in useGameState (React), passed to the scene at each init.
- **Multiple Phaser scenes for different rooms:** One ExplorationScene loaded with different room data is the correct pattern. Multiple scenes would require state handoff at every boundary, which is exactly what data-driven init avoids.
- **Re-registering EventBridge listeners without cleanup:** ExplorationScene restarts frequently. Every `eventBridge.on()` in `create()` must have a matching `eventBridge.off()` in `shutdown()` with the same `this` context. Existing shutdown() already does this — new door/transition listeners must follow the same pattern.
- **Hallway rooms as full departments:** Hallways are data entries in roomData.json with the same structure as rooms, but minimal content: no NPCs, no educational items, simple floor + two door exits. They exist only for spatial continuity and pacing breaks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera fade transition | Custom black overlay tween | `this.cameras.main.fadeOut(300, 0, 0, 0)` / `fadeIn(300)` | Native Phaser API, already used in HubWorldScene (line 488) and ExplorationScene (line 1038) |
| Scene restart with data | Custom scene state serialization | `this.scene.restart({ room, spawnDoorId, ... })` | Native Phaser API; init(data) already used in ExplorationScene |
| Door proximity detection | Tile-based collision system | Distance threshold check in `update()` loop | Same pattern as HubWorldScene `checkDoorProximity()` (line 496) — copy/adapt |
| Game state persistence | Custom serialization layer | `localStorage.setItem('pq:save:v2', JSON.stringify(state))` | Existing pattern throughout PrivacyQuestPage — Phase 11 adds the versioned save schema |
| Locked door visual | Phaser tilemaps with layer properties | Graphics object tint + text overlay on door position | Existing pattern: zone glow, checkmark badge, NPC speech bubble — all in ExplorationScene |

**Key insight:** Every visual effect and state management pattern needed for Phase 12 already exists somewhere in the codebase. The work is wiring, not invention.

---

## Common Pitfalls

### Pitfall 1: Double-firing EventBridge Listeners After Scene Restart

**What goes wrong:** ExplorationScene is restarted on every room transition. If `create()` adds new listeners without `shutdown()` removing them, after 3 rooms the same handler fires 3 times per event.

**Why it happens:** Phaser calls `create()` again on restart but `shutdown()` is only called if explicitly implemented. The existing shutdown() handles `REACT_DIALOGUE_COMPLETE`, `REACT_PAUSE_EXPLORATION`, `REACT_SET_MUSIC_VOLUME`, `REACT_PLAY_SFX`, and `REACT_ANSWER_FEEDBACK`. Any new listeners added for door transitions must be added to shutdown() too.

**How to avoid:** For every `eventBridge.on(EVENT, handler, this)` added to `create()`, immediately add the matching `eventBridge.off(EVENT, handler, this)` to `shutdown()`. Use `this` as the context argument on both calls.

**Warning signs:** An action producing double sounds, double score changes, or double React state updates after a room transition.

### Pitfall 2: Player Spawning at Wrong Position After Transition

**What goes wrong:** Player always appears at `room.spawnPoint` regardless of which door they came through. Walking back from Reception to the Entrance places the player at the Reception center, not at the Reception door.

**Why it happens:** ExplorationScene's current player placement reads only `room.spawnPoint`. The `spawnDoorId` concept is new.

**How to avoid:** ExplorationScene `init()` must accept `spawnDoorId` and find the matching door in `room.doors[]` to place the player. Fall back to `room.spawnPoint` only if no spawnDoorId is passed (backwards compatibility for QA mode).

```typescript
init(data: { room: Room; spawnDoorId?: string; completedNPCs?: string[]; ... }) {
  this.room = data.room;
  // Determine spawn position
  if (data.spawnDoorId && data.room.doors) {
    const door = data.room.doors.find(d => d.id === data.spawnDoorId);
    this.spawnTileX = door ? door.x : data.room.spawnPoint.x;
    this.spawnTileY = door ? door.y : data.room.spawnPoint.y;
  } else {
    this.spawnTileX = data.room.spawnPoint.x;
    this.spawnTileY = data.room.spawnPoint.y;
  }
}
```

### Pitfall 3: Transitioning Flag Not Reset on Scene Restart

**What goes wrong:** `this.transitioning = true` is set when a door is triggered. If the scene restarts (which is the transition mechanism), the new scene starts with `transitioning` still true, freezing all movement.

**Why it happens:** `transitioning` is a class instance variable that persists through Phaser's restart if not explicitly reset in `init()`.

**How to avoid:** Reset `this.transitioning = false` in `init()`. The existing init() already resets `this.paused`, `this.movePath`, etc. — add `transitioning` to that list.

### Pitfall 4: HubWorldScene Still Running When ExplorationScene Starts

**What goes wrong:** If BootScene transitions to HubWorldScene (current behavior), and then UnifiedGamePage separately calls `scene.start('Exploration', ...)`, both scenes may be active simultaneously, rendering two overlapping canvases and receiving duplicate input events.

**Why it happens:** Phaser's `scene.start()` starts the specified scene but only stops the current scene if using `scene.switch()`. With `scene.start()`, the previous scene may stay active depending on boot configuration.

**How to avoid:** In `config.ts`, the `scene` array order determines the default boot sequence (Boot → HubWorld). After merging routes, one approach: change BootScene to not auto-start HubWorldScene; instead, BootScene emits `SCENE_READY: 'Boot'` and UnifiedGamePage starts ExplorationScene. Alternatively: UnifiedGamePage calls `game.scene.stop('HubWorld')` before `game.scene.start('Exploration', ...)`.

The cleanest solution is to remove HubWorldScene from the scene config array entirely in Phase 12 and have BootScene hand off directly to ExplorationScene.

### Pitfall 5: roomData.json Missing Door Definitions Causes Silent Failures

**What goes wrong:** ExplorationScene iterates `room.doors` (new field) but older rooms in roomData.json don't have it. The scene silently fails to render door indicators or detect door proximity.

**Why it happens:** JSON schema is not enforced at runtime — missing fields default to undefined.

**How to avoid:** In ExplorationScene, guard all door access with `if (this.room.doors && this.room.doors.length > 0)`. When updating roomData.json, update ALL rooms simultaneously — don't leave some with and some without the `doors` field.

---

## Code Examples

### Camera Fade Transition (existing pattern in HubWorldScene)

```typescript
// Source: HubWorldScene.ts line 486-491
this.transitioning = true;
this.cameras.main.flash(300, 255, 255, 255, false);
this.cameras.main.fade(400, 0, 0, 0);
this.time.delayedCall(350, () => {
  eventBridge.emit(BRIDGE_EVENTS.HUB_SELECT_GAME, this.nearDoor);
});
```

**Adapted for door-to-door in ExplorationScene:**
```typescript
private handleDoorInteraction(door: DoorData) {
  if (this.transitioning) return;
  this.transitioning = true;
  this.sound.play('sfx_interact', { volume: 0.4 });
  this.cameras.main.fadeOut(300, 0, 0, 0);
  this.time.delayedCall(300, () => {
    eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, {
      targetRoomId: door.targetRoomId,
      fromDoorId: door.id,
    });
  });
}
```

### REACT_LOAD_ROOM Listener in ExplorationScene (new)

```typescript
// ExplorationScene.ts — in create()
eventBridge.on(BRIDGE_EVENTS.REACT_LOAD_ROOM, this.onLoadRoom, this);

// In shutdown()
eventBridge.off(BRIDGE_EVENTS.REACT_LOAD_ROOM, this.onLoadRoom, this);

// Handler
private onLoadRoom = (data: {
  room: Room;
  spawnDoorId?: string;
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];
  doorStates: Record<string, 'locked' | 'available' | 'completed'>;
}) => {
  this.scene.restart(data);
};
```

### UnifiedGamePage: Handling EXPLORATION_EXIT_ROOM

```typescript
// UnifiedGamePage.tsx — in EventBridge useEffect
const onExitRoom = (data: { targetRoomId: string; fromDoorId: string }) => {
  const { targetRoomId, fromDoorId } = data;

  // Validate accessibility
  if (!gameState.isDepartmentAccessible(targetRoomId)) {
    // Emit locked-door feedback back to Phaser
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_breach_alert', volume: 0.3 });
    eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_DOOR_LOCKED, { targetRoomId });
    return;
  }

  // Update game state
  gameState.setCurrentRoomId(targetRoomId);

  // Find the room data
  const nextRoom = rooms.find(r => r.id === targetRoomId);
  if (!nextRoom) return;

  // Compute door states for the next room
  const doorStates = computeDoorStates(nextRoom, gameState);

  // Emit load event — ExplorationScene will restart
  eventBridge.emit(BRIDGE_EVENTS.REACT_LOAD_ROOM, {
    room: nextRoom,
    spawnDoorId: fromDoorId + '_reverse',  // convention: door IDs are symmetric
    completedNPCs: Array.from(gameState.completedNPCs),
    completedZones: Array.from(gameState.completedZones),
    collectedItems: Array.from(gameState.collectedItems),
    doorStates,
  });
};

eventBridge.on(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, onExitRoom);
return () => eventBridge.off(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, onExitRoom);
```

### Door State Computation (pure function)

```typescript
// hooks/useGameState.ts or lib/doorStates.ts
function computeDoorStates(
  room: RoomData,
  gameState: UnifiedGameState
): Record<string, 'locked' | 'available' | 'completed'> {
  const states: Record<string, 'locked' | 'available' | 'completed'> = {};
  for (const door of room.doors ?? []) {
    const target = door.targetRoomId;
    if (gameState.completedRooms.includes(target)) {
      states[door.id] = 'completed';
    } else if (isDepartmentAccessible(target, gameState.completedRooms)) {
      states[door.id] = 'available';
    } else {
      states[door.id] = 'locked';
    }
  }
  return states;
}
```

### roomData.json: Hallway Connector Room Entry

```json
{
  "id": "hallway_reception_to_breakroom",
  "name": "Hallway",
  "subtitle": "",
  "description": "A connecting corridor.",
  "unlockRequirement": "reception",
  "width": 20,
  "height": 5,
  "backgroundImage": "hallway_bg",
  "obstacles": [
    {"x": 0, "y": 0, "width": 20, "height": 1, "type": "wall"},
    {"x": 0, "y": 4, "width": 20, "height": 1, "type": "wall"},
    {"x": 0, "y": 0, "width": 1, "height": 5, "type": "wall"},
    {"x": 19, "y": 0, "width": 1, "height": 5, "type": "wall"}
  ],
  "npcs": [],
  "interactionZones": [],
  "educationalItems": [],
  "doors": [
    {
      "id": "hallway_rb_to_reception",
      "targetRoomId": "reception",
      "x": 1, "y": 2,
      "side": "left",
      "label": "Reception"
    },
    {
      "id": "hallway_rb_to_breakroom",
      "targetRoomId": "break_room",
      "x": 18, "y": 2,
      "side": "right",
      "label": "Break Room"
    }
  ],
  "spawnPoint": {"x": 3, "y": 2}
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Three separate routes + three Phaser scenes active per route | Single route + single ExplorationScene data-loaded | Phase 12 | Eliminates Phaser instance destruction on navigation; all game state survives route persistence |
| Room picker UI (HallwayHub) for department selection | Door-to-door walking with proximity detection | Phase 12 | Spatial continuity; hospital feels like a real place |
| `EXPLORATION_EXIT_ROOM` emits only current room ID | `EXPLORATION_EXIT_ROOM` emits `{ targetRoomId, fromDoorId }` | Phase 12 | Enables symmetric door mapping for correct spawn position on backtrack |
| PrivacyQuestPage owns all game state (~15 useState calls) | `useGameState` hook owns all game state | Phase 12 | Cleaner component, reusable hook, enables act state extension |

**Deprecated/outdated after Phase 12:**
- `HallwayHub.tsx`: Deleted. Room selection via walking, not UI buttons.
- `HubWorldPage.tsx`: Retired. Logic migrated to `UnifiedGamePage`.
- `PrivacyQuestPage.tsx`: Retired. Logic migrated to `UnifiedGamePage`.
- Route `/privacy`: Removed from App.tsx.
- `HubWorldScene` (optional): Can be retired if hospital_entrance room covers the same content.

---

## Key Design Decisions (Answered)

### Decision 1: Single ExplorationScene vs. Multiple Linked Scenes

**Answer: Single ExplorationScene, restarted with new room data.**

Evidence: ExplorationScene already uses `init(data: { room, completedNPCs, ... })` as its primary entry point. `this.scene.restart(newData)` calls `init()` with new data, rebuilds the room, and places the player — same as calling `scene.start()` but without re-running preload. All registered anims from BootScene survive. This is the minimal-change path.

Multiple scenes would require: a scene manager, state handoff objects at every boundary, consistent asset loading guarantees, and identical shutdown/cleanup in each scene. All of this complexity is unnecessary when one data-driven scene already does the job.

### Decision 2: HubWorldScene — Retire or Keep

**Answer: Retire HubWorldScene. Convert to hospital_entrance room in roomData.json.**

Evidence: The hub's visual elements (lobby floor, Riley NPC, two doors) are all expressible in ExplorationScene's rendering system. HubWorldScene's `checkDoorProximity()` and `transitioning` guard are being ported to ExplorationScene anyway. Keeping HubWorldScene adds a scene config entry and a special boot path for no functional gain.

Exception: If the "Choose your training module" title text and the hub's unique floor pattern are considered essential visual branding, preserve HubWorldScene as a one-time intro that hands off to ExplorationScene after Riley's dialogue. This adds ~30 lines of boot sequencing logic.

### Decision 3: How Does the Game Start After Route Collapse

**Answer: BootScene finishes → UnifiedGamePage receives `SCENE_READY: 'Boot'` → starts ExplorationScene with hospital_entrance room data + current save state.**

The `PhaserGame` component mounts the game. BootScene loads assets and emits `SCENE_READY: 'Boot'`. The `SCENE_READY` listener in UnifiedGamePage starts ExplorationScene with the entrance room. If the player has a saved `currentRoomId` (from a previous session), UnifiedGamePage can start at that room instead, honoring the save state.

### Decision 4: Hallway Connector Format

**Answer: Hallways are regular room entries in roomData.json with the same schema as department rooms, but minimal content (walls + floors + two doors, no NPCs).**

Naming convention: `hallway_{from}_{to}` (e.g., `hallway_reception_to_breakroom`). They appear in UNLOCK_ORDER between the departments they connect. Width: 20 tiles. Height: 4-5 tiles. No obstacles except perimeter walls.

### Decision 5: Door Zone Detection Pattern

**Answer: Extend the existing HubWorldScene `checkDoorProximity()` pattern — distance threshold check in `update()` against door positions stored in room data.**

```
Pattern: distance threshold (TILE * 1.5) in each direction from door center.
When player center within threshold: set nearDoor = door object, show prompt text.
On SPACE keydown: call handleDoorInteraction(nearDoor).
```

This is identical to how HubWorldScene detects Privacy Quest and Breach Defense doors (lines 496-526) and how ExplorationScene detects NPC proximity. No new pattern needed.

### Decision 6: What Does UnifiedGamePage Own?

**Owns (from HubWorldPage + PrivacyQuestPage merged):**
- PhaserGame ref and lifecycle
- useGameState hook instance
- All EventBridge listeners (`EXPLORATION_INTERACT_NPC`, `EXPLORATION_INTERACT_ZONE`, `EXPLORATION_INTERACT_ITEM`, `EXPLORATION_EXIT_ROOM`, `SCENE_READY`)
- All React overlay rendering (dialogue, educational items, observation gates, choice gates, patient story reveal, banner, intro modal)
- Mute toggle and MusicVolumeSlider
- Room cleared banner + story transition

**Does NOT own:**
- HallwayHub (deleted)
- HubWorldScene bootstrap sequence (merged or retired)
- Route navigation to `/privacy` or `/breach` from within normal gameplay

---

## Open Questions

1. **Door ID symmetry convention**
   - What we know: Each door in Room A has a `targetRoomId` pointing to Room B. When transitioning to Room B, ExplorationScene needs to know which door in Room B the player should appear at.
   - What's unclear: The cleanest convention. Two options: (a) mirror IDs — door `reception_to_entrance` in reception maps to door `entrance_to_reception` in entrance room; (b) each door entry explicitly names both sides.
   - Recommendation: Use mirror naming convention (a). It's deterministic without extra JSON fields. UnifiedGamePage constructs the reverse door ID as `fromDoorId.replace('_to_', '_from_')` or a symmetric swap function.

2. **HubWorldScene boot sequence timing**
   - What we know: BootScene currently auto-starts HubWorldScene. UnifiedGamePage mounts PhaserGame, then needs to intercept and start ExplorationScene instead.
   - What's unclear: Whether to modify BootScene's `create()` end sequence or handle it entirely in UnifiedGamePage by stopping HubWorldScene on SCENE_READY.
   - Recommendation: Modify BootScene to emit `SCENE_READY: 'Boot'` and NOT auto-start HubWorldScene. UnifiedGamePage starts the correct scene on that event. This makes the boot sequence driven by React, not hardcoded in Phaser.

3. **v1.0 Save Data Migration (FOUN-02 dependency)**
   - What we know: Phase 11 handles v1→v2 localStorage migration. Phase 12 assumes v2 schema is in place.
   - What's unclear: Whether Phase 12 can proceed without Phase 11's migration complete.
   - Recommendation: Phase 12 useGameState reads the v2 schema format established by Phase 11. The two phases are strictly sequential. Do not implement Phase 12 state until Phase 11's `pq:save:v2` schema is final.

---

## Sources

### Primary (HIGH confidence)

- `client/src/phaser/scenes/ExplorationScene.ts` — actual source: init data pattern, paused flag, shutdown cleanup, door/proximity patterns
- `client/src/phaser/scenes/HubWorldScene.ts` — actual source: door detection, transitioning guard, fade transition pattern
- `client/src/pages/PrivacyQuestPage.tsx` — actual source: state structure to extract into useGameState, EventBridge listeners, room loading sequence
- `client/src/pages/HubWorldPage.tsx` — actual source: minimal page to merge into UnifiedGamePage
- `client/src/phaser/EventBridge.ts` — actual source: existing event constants, extension pattern
- `client/src/App.tsx` — actual source: current routing structure to collapse
- `client/src/data/roomData.json` — actual source: room schema to extend with doors array
- `.planning/research/ARCHITECTURE.md` (2026-03-26) — HIGH confidence: architectural decisions already researched and documented with Phaser API verification
- `.planning/research/FEATURES.md` (2026-03-26) — HIGH confidence: feature priority matrix and dependency chain
- `.planning/ENHANCEMENT_BRIEF.md` sections 5 and 9 — HIGH confidence: authoritative design document for unified hospital layout and technical architecture changes

### Secondary (MEDIUM confidence)

- Phaser 3 Scene API: `scene.restart()`, `cameras.main.fadeOut/fadeIn()`, `scene.sleep()`, `scene.wake()` — verified against Phaser official docs in ARCHITECTURE.md research; patterns confirmed present in codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; patterns fully present in existing code
- Architecture: HIGH — directly verified against ExplorationScene init system and HubWorldScene door pattern
- Data schema: MEDIUM — door schema is new; naming conventions need finalization during planning
- Pitfalls: HIGH — listener leak, transitioning reset, and spawn position bugs are all directly observable from source inspection

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable tech stack, no external dependencies to go stale)
