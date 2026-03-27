# Pitfalls Research

**Domain:** Unified RPG restructure — merging two Phaser 3 game modes, door-to-door navigation, encounter integration, narrative arc
**Researched:** 2026-03-26
**Confidence:** HIGH — based on direct codebase analysis of existing ExplorationScene, BreachDefenseScene, EventBridge, React page architecture, and localStorage save format; confirmed against known Phaser 3 scene lifecycle behavior

---

## Critical Pitfalls

### Pitfall 1: Stale Closures in EventBridge Handlers During Room Transitions

**What goes wrong:**

React's EventBridge listeners registered in `useEffect` capture stale state via closures. When the player walks from room A to room B (the new continuous navigation), the React page still has handlers that reference room A's `currentRoomId`, `resolvedGates`, and `completedNPCs`. Any EventBridge event fired during the transition (e.g. `EXPLORATION_EXIT_ROOM`) is caught by the stale closure. The existing page already documents this risk: `// Note: handleExitRoom is defined below but only called at runtime (not during effect setup), so the closure is safe`. With continuous navigation, the player enters rooms 6-15 times per session, making stale closure hits far more likely.

The effect dependency list on the EventBridge handler registration already has this fragility: `[currentRoomId, resolvedGates, completedZones, collectedItems, isNpcGated]` — but `handleExitRoom` (a `useCallback`) captures `completedNPCs`, `completedZones`, and `completedRooms`. Any omission means the handler runs with last room's values.

**Why it happens:**

Rooms were previously selected from a menu (one room at a time, with a return to hub between each). There was no rapid succession of room entries to surface the stale state timing issue. Continuous walking means rooms transition within 1-2 seconds of each other, and React state updates settle slower than Phaser scene transitions.

**How to avoid:**

Use a `useRef` for values that EventBridge handlers need to read, updated synchronously on every render:

```typescript
const stateRef = useRef({ currentRoomId, completedNPCs, resolvedGates });
useEffect(() => { stateRef.current = { currentRoomId, completedNPCs, resolvedGates }; });

const onExitRoom = useCallback(() => {
  const { currentRoomId } = stateRef.current; // always current
}, []); // stable ref — no stale dependency
```

This pattern is especially critical for the encounter return path: when BreachDefense completes and control returns to the RPG world, the RPG state must be current, not frozen from when the encounter was launched.

**Warning signs:**

- Room completion fires for the wrong room after navigating between departments
- NPC completion state appears to reset when returning from an encounter
- Score change fires for a previously completed NPC (double award)

**Phase to address:** Phase 1 (navigation foundation) — establish the ref pattern for all EventBridge handlers before any encounter integration. Retrofitting this later requires auditing every handler.

---

### Pitfall 2: EventBridge Listener Accumulation on Scene Restart

**What goes wrong:**

The EventBridge singleton persists for the lifetime of the Phaser game instance. Each call to `game.scene.start('Exploration', data)` runs `create()`, which registers new EventBridge listeners. If `shutdown()` misses any listener, duplicates accumulate. With 6 departments entered across a session, `REACT_DIALOGUE_COMPLETE` fires 6 callbacks instead of 1 — causing double-completion of NPCs, double-score awards, and phantom state updates. By the fourth room, a correct answer awards +18 score instead of +3.

The current `shutdown()` in ExplorationScene correctly calls `eventBridge.off()` for its 5 existing listeners. The v2.0 restructure will add new event types: encounter triggers, act progression events, door unlock signals, narrative beat callbacks. Each new event type is a new leak risk.

**Why it happens:**

New events added during the restructure will be registered in `create()` but omitted from `shutdown()` under time pressure. The EventBridge provides no warning when a listener is added a second time — the second `eventBridge.on(event, handler)` call adds another subscriber silently.

**How to avoid:**

Add a centralized cleanup registration pattern to ExplorationScene and BreachDefenseScene:

```typescript
private boundListeners: Array<{ event: string; handler: Function }> = [];

private onBridge(event: string, handler: Function) {
  eventBridge.on(event, handler, this);
  this.boundListeners.push({ event, handler });
}

shutdown() {
  this.boundListeners.forEach(({ event, handler }) =>
    eventBridge.off(event, handler, this)
  );
  this.boundListeners = [];
  // ...rest of cleanup
}
```

Every new `eventBridge.on()` call must use `this.onBridge()`. The shutdown is then self-maintaining.

**Warning signs:**

- Score changes by double the expected amount on second room entry
- Audio plays twice on a single interaction (two listeners firing)
- React state updates fire in pairs visible in React DevTools
- NPC marked complete twice in the same session

**Phase to address:** Phase 1 (navigation) — add the centralized listener pattern to ExplorationScene before adding new event types. Audit BreachDefenseScene's shutdown() completeness at the same time.

---

### Pitfall 3: Two Game Loops Running Simultaneously After Encounter Launch

**What goes wrong:**

When BreachDefenseScene launches as an encounter from within the RPG world, ExplorationScene must be fully stopped or sleeping. If React calls `game.scene.start('BreachDefense')` directly without stopping ExplorationScene, both scenes remain active. Phaser allows multiple active scenes. ExplorationScene's `update()` loop continues, consuming CPU and — critically — still processing keyboard input. WASD keys move the RPG player while tower defense waves are running.

The current BreachDefensePage manually calls `game.scene.stop('HubWorld')` before starting BreachDefense. But when encounter launch comes from within ExplorationScene (the v2.0 design), the calling code must explicitly stop or sleep Exploration first.

**Why it happens:**

Phaser's `scene.start(key)` stops only the scene that invokes it via the scene manager. If the trigger comes from React via EventBridge, no Phaser scene is "calling" — React calls `game.scene.start('BreachDefense')`, which adds BreachDefense but does not stop Exploration.

**How to avoid:**

The encounter launch sequence must be scene-initiated, not React-initiated:

1. Player triggers encounter narrative moment in ExplorationScene
2. ExplorationScene emits `ENCOUNTER_TRIGGER` to React with encounter config
3. React confirms (shows brief encounter intro UI)
4. React emits `REACT_LAUNCH_ENCOUNTER` back to Phaser
5. ExplorationScene receives it, calls `this.scene.sleep()` on itself, then `this.scene.start('BreachDefense', { encounterConfig })`

Use `scene.sleep()` (not `scene.stop()`) for ExplorationScene so the player's room position, nearby interactable state, and ambient particles are preserved for the return. Use `scene.stop()` for BreachDefenseScene on encounter exit so it initializes cleanly next time.

**Warning signs:**

- Player character moves during BreachDefense waves
- Footstep sounds play during tower defense
- Frame rate drops during encounter (two full update loops competing)
- ExplorationScene background music continues playing under BreachDefense music

**Phase to address:** Phase 2 (encounter integration) — this is the highest-risk moment of the entire restructure. Define the launch/return protocol contract before any implementation.

---

### Pitfall 4: Save Format Migration Breaks Existing Progress

**What goes wrong:**

The v1.0 save format is fragmented across 14+ localStorage keys:
`completedRooms`, `collectedStories`, `completedNPCs`, `completedZones`, `collectedEducationalItems`, `current-privacy-score`, `resolvedGates_${roomId}` (6 keys), `unlockedNpcs_${roomId}` (6 keys), `pq:onboarding:seen`, `pq:room:${roomId}:npcPulsed` (6 keys), `sfx_muted`, `music_volume`, `gameStartTime`, `final-privacy-score`.

The v2.0 unified game needs additional state: act progression, encounter completion records, department unlock state, breach defense session scores feeding into the unified compliance score. Adding new keys to this already-fragmented format creates: (1) v1 saves missing required v2 keys crash or silently return wrong defaults on read, and (2) the key proliferation becomes undebuggable.

**Why it happens:**

The existing format grew organically — each feature added its own key. There was no schema. Migration was never planned because the game had no version boundary. The v2.0 restructure IS that version boundary, and ignoring it means running two incompatible data models simultaneously.

**How to avoid:**

Before adding any new state, consolidate the save format into a single versioned key:

```typescript
interface SaveDataV2 {
  version: 2;
  privacyScore: number;
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];
  completedRooms: string[];
  collectedStories: string[];
  actProgress: 1 | 2 | 3;
  encountersCompleted: string[];
  breachScores: Record<string, number>;
  resolvedGates: Record<string, string[]>;
  unlockedNpcs: Record<string, string[]>;
  flags: Record<string, boolean>;
  gameStartTime: number;
}
```

Write a `migrateV1toV2()` function that reads all v1 keys, assembles the v2 object, writes `pq:save:v2`, and clears old keys. Run once on game init. New code reads/writes only `pq:save:v2`.

**Warning signs:**

- `JSON.parse` errors in the console on game load
- Act progression resets to Act 1 on page refresh
- Encounter results don't persist between sessions
- Players report "I completed everything but the game forgot"

**Phase to address:** Phase 0 (bug stabilization before restructure) — the migration must be the first code written, before any restructure work begins. If v1 keys exist, migrate; if neither exists, start fresh.

---

### Pitfall 5: React Page Architecture Assumes One Mode Per Route

**What goes wrong:**

The v1.0 architecture has three React pages, each owning its Phaser game instance. If the restructure keeps separate routes for separate modes (navigating from `/privacy` to `/breach` when an encounter triggers), the Phaser game instance is destroyed and recreated on every page navigation via React router. This means:

1. All Phaser scene state (player position, ambient particles, tweens) is destroyed
2. BootScene must re-run, causing a loading flash visible to the player
3. Any state passed via EventBridge at the moment of route change is lost
4. The new page has no Phaser content until BootScene completes (~400ms)

**Why it happens:**

Routing frameworks (Wouter in this project) destroy and mount components on route change. `PhaserGame`'s `useEffect` cleanup calls `gameRef.current.destroy(true)`. This is correct cleanup for route-level navigation but catastrophic for mid-game scene switching. The current architecture works because HubWorld, PrivacyQuest, and BreachDefense were separate modes at separate routes — the game instance was always fresh. Continuous play eliminates that safety.

**How to avoid:**

The unified game must live on a single route with a single Phaser game instance. React page mode (`'exploration' | 'encounter' | 'dialogue' | 'transition'`) is managed by React state, not by routes. The Phaser canvas never unmounts. React HUD components swap based on mode.

This means BreachDefensePage's tower selection panel, wave banner, and codex modal must become an `EncounterHUD` component rendered conditionally by the unified page. No new routes are needed.

**Warning signs:**

- `navigate('/breach')` or `navigate('/privacy')` called during encounter trigger
- PhaserGame component appears more than once in the React component tree
- BootScene loading bar visible during mid-game encounter launch
- Player position resets to default spawn on encounter return

**Phase to address:** Phase 1 (navigation foundation) — the single-page, single-instance architecture must be established first. All subsequent work (encounters, acts, narrative) depends on this foundation.

---

### Pitfall 6: BreachDefense Game State Not Reset Between Encounters

**What goes wrong:**

BreachDefenseScene accumulates state across a session: `enemies[]`, `towers[]`, `projectiles[]`, `waveState`, `securityScore`, `budget`, `grantedStipends`. The `onRestart` handler clears these, but it was designed for single-session restart within one BreachDefense sitting — not for "sleep scene, wake for second encounter later." If BreachDefenseScene is incorrectly slept instead of stopped, all state persists across encounters: towers from encounter 1 are present at encounter 2's start, security score carries over, enemies from wave 4 are still in the array when wave 1 attempts to spawn.

**Why it happens:**

`scene.sleep()` freezes the scene with all state intact — correct for ExplorationScene (player position preserved), but wrong for BreachDefenseScene (needs clean slate per encounter). The distinction is easy to miss: both `sleep()` and `stop()` pause execution, but only `stop()` calls `shutdown()` and clears the display list.

**How to avoid:**

For BreachDefenseScene: always use `scene.stop()` to end encounters. On encounter launch, call `scene.start('BreachDefense', { encounterConfig })` — this runs `shutdown()` + `init()` + `create()` cleanly. Pass encounter config as init data: which 3 towers are available, how many waves, narrative context string for the post-encounter debrief.

For ExplorationScene: use `scene.sleep()` to preserve room state (player position, completed NPC markers, ambient effects). Wake with `scene.wake('Exploration')` on encounter return.

**Warning signs:**

- Towers from a previous encounter appear at the start of a new encounter
- Security score starts at non-100 value on second encounter
- Budget shows a value carried over from a prior encounter
- Enemies from a previous wave are present when wave 1 spawning starts

**Phase to address:** Phase 2 (encounter integration) — define the sleep/stop contract for each scene type before implementation.

---

### Pitfall 7: Content Regression When Removing HallwayHub Room Picker

**What goes wrong:**

The `HallwayHub` component currently controls which rooms are unlocked, shows unlock requirements, tracks completion state visually, and provides the entry point for the intro tutorial modal. Removing it in favor of in-world door navigation means all of this logic needs to move somewhere else. The risk is that unlock logic is dropped ("we'll add it back later"), completion indicators are lost, or the intro tutorial no longer fires because the HallwayHub was the trigger.

The HallwayHub also houses the first display of each room's name, subtitle, and unlock requirement description. This information needs to appear somewhere in the door-to-door world — it cannot silently disappear.

**Why it happens:**

During a large restructure, the "delete the old thing" step happens before "add the equivalent new thing" is complete. The HallwayHub is visually removed (because it's replaced by walking), but its behavioral responsibilities (unlock gating, room entry point, first-time intro) are left as TODO items that ship incomplete.

**How to avoid:**

Before removing HallwayHub, write a complete inventory of every behavioral responsibility it holds:
- Unlock condition evaluation (depends on `completedRooms` count)
- Room entry initiation (`game.scene.start('Exploration', data)`)
- Intro tutorial trigger (first visit only)
- Visual completion state (checkmarks, room status)
- Room name/subtitle display

Each responsibility needs a new home in the door-to-door world before HallwayHub is removed. The door object in ExplorationScene takes over entry initiation. Door visual state (locked/available/complete) takes over completion display. The intro tutorial fires on first door interaction instead.

**Warning signs:**

- Rooms can be entered in any order regardless of unlock requirements
- Completed rooms show no visual distinction from incomplete ones when walking past doors
- The intro tutorial never fires in the new architecture
- No in-world indication of a room's name or status when approaching a door

**Phase to address:** Phase 1 (navigation foundation) — HallwayHub responsibility transfer must be fully mapped and implemented before HallwayHub is removed from the codebase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Duplicate BreachDefensePage JSX into unified page | Ship encounter overlay fast | Two copies of 400+ lines of HUD code diverge silently | Never — extract as component from the start |
| Add new localStorage keys without migration | Each feature ships independently | v2 state reads may return `null` for missing keys, defaulting incorrectly | Never after v2 launch — always schema-version the save |
| Use `scene.stop()` on ExplorationScene during encounter | Simple, well-tested | Player respawns at room door on encounter return instead of same position | Acceptable for MVP if return-to-position is v2.1 — but document the decision |
| Pass act progression as URL query params | Avoids page architecture refactor | Back navigation on browser breaks game state; acts can only progress forward | Never |
| Directly checking `game.scene.getScene('Exploration').isActive()` from React | Quick scene status check | Bypasses EventBridge contract; couples React tightly to Phaser internals | Dev/debug code only, never in production paths |
| Skip `shutdown()` updates when adding new events "just for now" | Faster iteration | Silent listener leak that manifests only after multiple room entries | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Encounter launch | React calls `game.scene.start('BreachDefense')` directly | ExplorationScene receives `REACT_LAUNCH_ENCOUNTER`, sleeps itself, then starts BreachDefense with encounter config |
| Encounter result return | React navigates back to `/privacy` route | BreachDefenseScene emits `ENCOUNTER_COMPLETE` with score; ExplorationScene wakes; no route change |
| Act progression trigger | React checks completion state on every render | ExplorationScene emits `ACT_PROGRESS` when narrative milestone hit; React listens once |
| Door transition animation | React controls the fade overlay | Phaser owns the camera fade (`this.cameras.main.fadeOut/fadeIn`); React shows minimal door-open UI only |
| Unified score write | Both Exploration and BreachDefense write to `current-privacy-score` directly | One canonical `ScoreManager` module read/written by both scenes, preventing concurrent writes |
| Background music between acts | `this.sound.stopAll()` then play new track | Fade out current track over 800ms, then fade in new — `stopAll()` creates a jarring cut |
| Return-to-room player spawn | Player spawns at room's default `spawnPoint` | Spawn at door that was used to exit to encounter — requires tracking which door triggered the encounter |
| Condensed encounter config | Reuse full 10-wave WAVES constant | Pass encounter-specific wave config (4 waves, 3 tower types) as init data — do not hardcode in BreachDefenseScene |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Ambient particle emitters not destroyed on room exit | Frame rate drops after visiting 3+ rooms | Verify `shutdown()` calls `this.tweens.killAll()` AND explicitly destroys particle emitters — `killAll()` only stops tween targets, not emitters themselves | After ~4 room entries (3 emitters × 4 rooms = 12 active emitters) |
| Physics static groups from wall obstacles accumulate | Physics collision detection slows | `scene.start()` calls `shutdown()` which Phaser uses to clear physics world; verify `walls` group is not held in an external reference that prevents GC | Noticeable at 6+ rooms in session |
| React state update cascade on encounter return | UI freezes 200-400ms on encounter exit | Batch encounter results into single setState call; use `useReducer` for related state | Any encounter with 5+ state fields updating simultaneously |
| `generateAllTextures()` called on every scene start | ~40ms delay per room entry | Already idempotent but still iterates all texture keys on each call; acceptable for 6 rooms, monitor if hallway scenes added | After 10+ room entries |
| BFS pathfinding in large rooms | Click-to-move has perceptible delay >100ms | BFS is O(w×h); fine for current 6×6 to 12×10 rooms; keep hallway connector scenes narrow | Only if open-area hallways added (keep them narrow corridors) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual transition between room and encounter | Jarring cut; player loses spatial context | Camera fade-out from room (400ms), brief black frame with narrative text, then BreachDefense fade-in |
| Encounter launches with no narrative setup | Player doesn't know why tower defense started | ExplorationScene shows NPC dialogue or environment event before encounter trigger; the "why" must land before the mechanic starts |
| Returning from encounter with no acknowledgment | Player is back in room with no feedback on encounter result | On wake, ExplorationScene shows brief overlay: "Defense complete — compliance score: +12" before resuming |
| Act transitions happen invisibly | Player doesn't notice they've entered Act 2/3 | Acts need a cinematic moment: music crossfade, brief title card, NPC transition dialogue |
| Locked department door gives no context | Players hit a locked door with only a small lock icon — confusing | On approach, locked door shows brief text explaining unlock condition + audio denial cue |
| Condensed encounter feels truncated | Players who know full BreachDefense feel cheated | Frame via dialogue ("we only have a few minutes!") — the 4-wave format is narratively justified, not a cut |
| Player can't tell current act | No sense of narrative progress | Persistent HUD indicator with current act and department name |

---

## "Looks Done But Isn't" Checklist

- [ ] **Door transition:** Animation plays — verify ExplorationScene's `shutdown()` fires before new scene's `create()`, or phantom tweens from room A execute during room B load
- [ ] **Encounter launch:** BreachDefense shows and plays — verify ExplorationScene is actually sleeping (not still in update loop) by confirming keyboard input is disabled during encounter
- [ ] **Encounter return:** Player is back in room — verify encounter score was written to unified save BEFORE ExplorationScene woke, not after (race condition window)
- [ ] **Department unlock:** Door shows as available — verify unlock condition reads from v2 save format, not a v1 key that no longer exists
- [ ] **Unified score:** HUD shows combined value — verify BreachDefense session score is merged using the same scale as privacy score, not raw security score 0-100 naively added
- [ ] **EventBridge cleanup on encounter exit:** Verify BreachDefense `shutdown()` fires correctly when `scene.stop()` is called from ExplorationScene's wake handler — not only when the React page unmounts
- [ ] **NPC completion persists across act boundary:** Complete NPCs in Reception (Act 1); walk to Act 2 departments; return to Reception; confirm NPCs still show as completed
- [ ] **Background music crossfade:** Act transition plays new track — verify old track's Phaser sound object is properly stopped and reference cleared before new track is added, or memory leaks a sound instance per transition

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale closure state corruption | MEDIUM | Add `stateRef` pattern to all EventBridge handlers in unified page; approximately 8-12 handler functions need updating |
| EventBridge listener accumulation | LOW | Add centralized `boundListeners` array to both scenes; run multi-room session test to verify each event fires exactly once per interaction |
| Two game loops simultaneous | HIGH | Audit all encounter launch paths; add `if (!this.scene.isActive()) return;` guard at top of ExplorationScene `update()` to detect misconfiguration |
| Save format corruption | MEDIUM | Write recovery function: read whatever v1 keys exist, assemble best-effort v2 save, prompt player to confirm before resetting partial data |
| Single-page refactor incomplete | HIGH | Complete unified page architecture before any encounter integration — encounter launch requires stable canvas; cannot patch halfway through |
| BreachDefense state not reset | LOW | Add `resetGameState()` method called at top of `init()` that explicitly zeroes all arrays and resets all primitive state to starting values |
| HallwayHub removal incomplete | MEDIUM | Keep HallwayHub in codebase behind a feature flag until each responsibility has a verified replacement in the door-to-door world |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Stale closure state | Phase 1 — Navigation Foundation | Walk room A → room B; complete NPC in B; verify room A NPCs still marked complete in save |
| EventBridge listener accumulation | Phase 1 — Navigation Foundation | Enter 6 rooms in sequence; correct answer gives exactly +3, not a multiple |
| Two game loops simultaneous | Phase 2 — Encounter Integration | During BreachDefense wave, press WASD; RPG player must not move |
| Save format migration | Phase 0 — Bug Stabilization | Load page with v1 save data; verify v2 format written; clear v1 keys; reload; state preserved |
| React page architecture | Phase 1 — Navigation Foundation | No route changes during any in-game transition; confirm with browser network tab |
| BreachDefense state reset | Phase 2 — Encounter Integration | Complete encounter 1; trigger encounter 2; wave 1 must start with full budget and clean enemy array |
| Particle emitter accumulation | Phase 1 — Navigation Foundation | Enter 5 rooms; confirm frame rate stays above 55fps via Phaser debug overlay |
| Act transition UX | Phase 3 — Narrative Arc | Act 1→2 transition plays music shift + title card; acts cannot be skipped |
| Unified score scale mismatch | Phase 2 — Encounter Integration | Complete BreachDefense at 80% efficiency; verify score contribution matches documented formula |
| HallwayHub content regression | Phase 1 — Navigation Foundation | Every HallwayHub responsibility in a checklist verified in door-to-door world before HallwayHub is deleted |

---

## Sources

- Direct codebase analysis: `client/src/phaser/scenes/ExplorationScene.ts` — shutdown() at line 1208, stale closure comment at line 395-398, EventBridge registrations in create()
- Direct codebase analysis: `client/src/phaser/scenes/BreachDefenseScene.ts` — shutdown() at line 1981, all entity arrays accumulating during update()
- Direct codebase analysis: `client/src/phaser/EventBridge.ts` — singleton pattern, no reset mechanism, extends Phaser.Events.EventEmitter which silently allows duplicate listeners
- Direct codebase analysis: `client/src/pages/PrivacyQuestPage.tsx` — 14 fragmented localStorage keys at lines 62-88, 139-144, 199-203
- Direct codebase analysis: `client/src/pages/BreachDefensePage.tsx` — scene start pattern with manual stop at lines 129-130
- Direct codebase analysis: `client/src/phaser/config.ts` — all 4 scenes registered in single Phaser instance
- Direct codebase analysis: `client/src/phaser/PhaserGame.tsx` — `gameRef.current.destroy(true)` in useEffect cleanup
- `.planning/ENHANCEMENT_BRIEF.md` — encounter design (section 4.2), navigation mechanics (section 5), act structure (section 3)
- `.planning/PROJECT.md` — v2.0 scope, existing constraints, key decisions log
- Phaser 3 scene lifecycle (HIGH confidence): `scene.start()` calls `shutdown()` then `init()` then `create()`; `scene.sleep()` pauses update without clearing state or calling shutdown; `scene.stop()` calls `shutdown()` and removes from display list
- Phaser 3 EventEmitter behavior (HIGH confidence): `on()` adds a new subscriber on every call regardless of existing registrations; no deduplication; no warning on duplicate

---
*Pitfalls research for: Unified RPG restructure (PrivacyQuest + BreachDefense v2.0)*
*Researched: 2026-03-26*
