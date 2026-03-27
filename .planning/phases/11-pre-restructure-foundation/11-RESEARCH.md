# Phase 11: Pre-Restructure Foundation - Research

**Researched:** 2026-03-27
**Domain:** localStorage schema migration, EventBridge listener cleanup, known bug audit
**Confidence:** HIGH — based on direct codebase inspection of all relevant files

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUN-03 | Versioned localStorage save schema replaces 14+ fragmented keys with a single structured object and migration from v1 format | Full v1 key inventory below; v2 schema designed; migration function pattern documented |
| FOUN-04 | Bug stabilization pass on surviving systems (ExplorationScene, dialogue, EventBridge listener cleanup, scoring) before restructure work begins | All known bugs catalogued with root causes and fix strategies |

</phase_requirements>

---

## Summary

Phase 11 is a pure stabilization phase — no new features, no architecture changes. Two concrete deliverables: (1) a `migrateV1toV2()` function that consolidates 14+ fragmented localStorage keys into a single `pq:save:v2` JSON object on first boot, and (2) targeted fixes for the five specific bugs identified below. The goal is a clean, auditable baseline that Phase 12 (Unified Navigation) can build on without tripping over pre-existing instability.

The v1 save format grew organically across development: each feature added its own key with no schema version. The resulting 14+ keys include both global arrays (`completedRooms`, `completedNPCs`) and per-room keys with dynamic suffixes (`resolvedGates_reception`, `pq:room:reception:npcPulsed`). These must survive migration intact — a player who completed three rooms should see those rooms still completed after the v2 upgrade.

The known bugs fall into two categories: (a) one missing EventBridge listener cleanup that causes an anonymous handler to accumulate on scene restart, and (b) a scoring architecture issue in `GameContainer` where `privacyScore` state is initialized from the prop `initialPrivacyScore` once at component mount — if the component unmounts and remounts (e.g., entering dialogue a second time in a session), it re-initializes from the prop value passed at mount time, which may not reflect score changes made during an earlier dialogue. Both are fixable with targeted, low-risk changes.

**Primary recommendation:** Write `migrateV1toV2()` first. Run it on game boot before any state initialization reads localStorage. Then fix the five bugs in sequence. No architectural changes — this phase's value is in what it prevents, not what it adds.

---

## Standard Stack

### Core (unchanged from existing project)
| Component | Version | Purpose |
|-----------|---------|---------|
| localStorage (browser API) | Native | Save data persistence |
| Phaser.Events.EventEmitter | Phaser 3.90+ | EventBridge singleton base class |
| React useState + useEffect | React 18 | State initialization from localStorage |

No new libraries are needed for this phase. All work is in-codebase refactoring.

---

## Architecture Patterns

### v1 localStorage Key Inventory (complete)

From direct inspection of all source files:

**Global game-state keys (always present):**
| Key | Type | Source | Notes |
|-----|------|--------|-------|
| `completedRooms` | JSON string[] | PrivacyQuestPage.tsx:62 | Array of room IDs |
| `collectedStories` | JSON string[] | PrivacyQuestPage.tsx:66 | Array of room IDs |
| `completedNPCs` | JSON string[] | PrivacyQuestPage.tsx:70 | Array of NPC IDs |
| `completedZones` | JSON string[] | PrivacyQuestPage.tsx:74 | Array of zone IDs |
| `collectedEducationalItems` | JSON string[] | PrivacyQuestPage.tsx:78 | Array of item IDs |
| `current-privacy-score` | number string | PrivacyQuestPage.tsx:82 | Defaults to 100 |
| `final-privacy-score` | number string | GameContainer.tsx:69 | Written at dialogue end |
| `gameStartTime` | number string | PrivacyQuestPage.tsx:88 | Unix ms timestamp |
| `pq:onboarding:seen` | `'1'` or absent | PrivacyQuestPage.tsx:127 | Gate for intro modal |
| `sfx_muted` | `'true'` or `'false'` | Multiple files | Shared across all pages |
| `music_volume` | float string | MusicVolumeSlider.tsx:6 | 0.0–1.0 |

**Per-room keys (6 rooms × 2 = 12 keys):**
| Key Pattern | Type | Source | Notes |
|-------------|------|--------|-------|
| `resolvedGates_${roomId}` | JSON string[] | PrivacyQuestPage.tsx:107 | Per-room gate completion |
| `unlockedNpcs_${roomId}` | JSON string[] | PrivacyQuestPage.tsx:112 | Per-room NPC unlock |

**Per-room pulse keys (6 rooms × 1 = 6 keys):**
| Key Pattern | Type | Source | Notes |
|-------------|------|--------|-------|
| `pq:room:${roomId}:npcPulsed` | `'1'` or absent | ExplorationScene.ts:782 | Onboarding pulse shown |

**Total v1 keys at full game completion: 11 global + 12 per-room + 6 pulse = 29 keys**

The PITFALLS.md estimate of "14+ fragmented keys" was a conservative minimum (just the always-present keys plus a few per-room). The actual count at full completion is 29.

### v2 Schema Design

```typescript
interface SaveDataV2 {
  version: 2;
  // Progress arrays (migrated from v1)
  completedRooms: string[];
  collectedStories: string[];
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];
  // Score (migrated from v1)
  privacyScore: number;           // was 'current-privacy-score'
  finalPrivacyScore: number;      // was 'final-privacy-score'
  // Per-room maps (migrated from per-room keys)
  resolvedGates: Record<string, string[]>;  // roomId -> gateIds[]
  unlockedNpcs: Record<string, string[]>;   // roomId -> npcIds[]
  npcPulsedRooms: string[];                 // rooms where onboarding pulse was shown
  // Timing
  gameStartTime: number;
  // Onboarding
  onboardingSeen: boolean;         // was 'pq:onboarding:seen'
  // Audio (shared, migrated for completeness)
  sfxMuted: boolean;
  musicVolume: number;
}
```

**Key `pq:save:v2`** — single key for all game state.

### Migration Function Pattern

```typescript
// client/src/lib/saveData.ts  (new file)

const SAVE_KEY_V2 = 'pq:save:v2';

const defaultSave: SaveDataV2 = {
  version: 2,
  completedRooms: [],
  collectedStories: [],
  completedNPCs: [],
  completedZones: [],
  collectedItems: [],
  privacyScore: 100,
  finalPrivacyScore: 100,
  resolvedGates: {},
  unlockedNpcs: {},
  npcPulsedRooms: [],
  gameStartTime: Date.now(),
  onboardingSeen: false,
  sfxMuted: false,
  musicVolume: 0.6,
};

// Run once on game init — idempotent if v2 already exists
export function migrateV1toV2(): SaveDataV2 {
  // If v2 already exists, return it
  const existing = localStorage.getItem(SAVE_KEY_V2);
  if (existing) {
    try { return JSON.parse(existing) as SaveDataV2; }
    catch { /* corrupted v2 — fall through to migrate */ }
  }

  // Build v2 from v1 keys
  const save: SaveDataV2 = { ...defaultSave };

  try {
    const cr = localStorage.getItem('completedRooms');
    if (cr) save.completedRooms = JSON.parse(cr);
  } catch {}

  try {
    const cs = localStorage.getItem('collectedStories');
    if (cs) save.collectedStories = JSON.parse(cs);
  } catch {}

  try {
    const cn = localStorage.getItem('completedNPCs');
    if (cn) save.completedNPCs = JSON.parse(cn);
  } catch {}

  try {
    const cz = localStorage.getItem('completedZones');
    if (cz) save.completedZones = JSON.parse(cz);
  } catch {}

  try {
    const ci = localStorage.getItem('collectedEducationalItems');
    if (ci) save.collectedItems = JSON.parse(ci);
  } catch {}

  const psStr = localStorage.getItem('current-privacy-score');
  if (psStr) {
    const ps = parseInt(psStr, 10);
    if (!isNaN(ps)) save.privacyScore = ps;
  }

  const fps = localStorage.getItem('final-privacy-score');
  if (fps) {
    const n = parseInt(fps, 10);
    if (!isNaN(n)) save.finalPrivacyScore = n;
  }

  const gstStr = localStorage.getItem('gameStartTime');
  if (gstStr) {
    const gst = parseInt(gstStr, 10);
    if (!isNaN(gst)) save.gameStartTime = gst;
  }

  save.onboardingSeen = localStorage.getItem('pq:onboarding:seen') === '1';
  save.sfxMuted = localStorage.getItem('sfx_muted') === 'true';
  const mvStr = localStorage.getItem('music_volume');
  if (mvStr) {
    const mv = parseFloat(mvStr);
    if (!isNaN(mv)) save.musicVolume = mv;
  }

  // Per-room keys: scan known room IDs
  // NOTE: room IDs must be passed in from roomData.json — cannot be hard-coded here
  // The caller passes roomIds[] to this function
  // (see FOUN-03 plan detail below)

  // Write v2
  localStorage.setItem(SAVE_KEY_V2, JSON.stringify(save));

  // Remove v1 keys after successful write
  const V1_KEYS = [
    'completedRooms', 'collectedStories', 'completedNPCs', 'completedZones',
    'collectedEducationalItems', 'current-privacy-score', 'final-privacy-score',
    'gameStartTime', 'pq:onboarding:seen',
  ];
  V1_KEYS.forEach(k => localStorage.removeItem(k));
  // Per-room keys: cleared by the caller after scanning

  return save;
}

export function loadSave(): SaveDataV2 {
  const raw = localStorage.getItem(SAVE_KEY_V2);
  if (!raw) return { ...defaultSave };
  try { return JSON.parse(raw) as SaveDataV2; }
  catch { return { ...defaultSave }; }
}

export function writeSave(data: SaveDataV2): void {
  localStorage.setItem(SAVE_KEY_V2, JSON.stringify(data));
}
```

**Migration caller in PrivacyQuestPage.tsx:**

The page needs to call `migrateV1toV2(roomIds)` before any `useState` initializers read localStorage. The cleanest approach: migrate as a module-level side effect (runs before React renders), or in the `useState` initializer for the first key:

```typescript
// At top of PrivacyQuestPage, before component function:
const ROOM_IDS = (roomDataJson.rooms as any[]).map(r => r.id);
const migrated = migrateV1toV2(ROOM_IDS);  // idempotent — returns v2 save

// State initializers then read from migrated object:
const [completedRooms, setCompletedRooms] = useState<string[]>(migrated.completedRooms);
// ... etc
```

**Per-room key migration requires passing room IDs:**

The `migrateV1toV2()` function needs the list of room IDs to scan `resolvedGates_${roomId}` and `unlockedNpcs_${roomId}` keys. Pass them from the roomData:

```typescript
export function migrateV1toV2(roomIds: string[]): SaveDataV2 {
  // ... (as above, plus:)
  for (const roomId of roomIds) {
    try {
      const rg = localStorage.getItem(`resolvedGates_${roomId}`);
      if (rg) save.resolvedGates[roomId] = JSON.parse(rg);
    } catch {}
    try {
      const un = localStorage.getItem(`unlockedNpcs_${roomId}`);
      if (un) save.unlockedNpcs[roomId] = JSON.parse(un);
    } catch {}
    if (localStorage.getItem(`pq:room:${roomId}:npcPulsed`) === '1') {
      save.npcPulsedRooms.push(roomId);
    }
    // Clean up per-room v1 keys
    localStorage.removeItem(`resolvedGates_${roomId}`);
    localStorage.removeItem(`unlockedNpcs_${roomId}`);
    localStorage.removeItem(`pq:room:${roomId}:npcPulsed`);
  }
}
```

---

## Bug Inventory (FOUN-04 Scope)

Five bugs were identified by direct code inspection. All require targeted fixes only — no structural changes.

### Bug 1: Anonymous Handler for REACT_ANSWER_FEEDBACK Leaks on Scene Restart

**Location:** `ExplorationScene.ts` lines 1003–1009 and line 1220

**What goes wrong:** The `REACT_ANSWER_FEEDBACK` listener is registered with an anonymous arrow function in `create()`:

```typescript
// Line 1003 — CREATES a new anonymous function each time create() runs
eventBridge.on(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, (data: { type: string }) => {
  if (data.type === 'correct') {
    this.cameras.main.flash(200, 100, 255, 100, false);
  } else if (data.type === 'incorrect') {
    this.cameras.main.flash(200, 255, 80, 80, false);
  }
});
```

The `shutdown()` at line 1220 calls `eventBridge.off(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK)` with NO handler reference and NO context. Phaser's `EventEmitter.off()` with only the event name removes ALL listeners for that event — this works on the first shutdown but the anonymous function created in `create()` is a different closure instance on each restart.

**Actual behavior:** `off(event)` with no handler argument removes all listeners for that event from the emitter, regardless of context. This means after the first room entry and exit, the listener IS removed. But because it's an anonymous function, there is no named reference to pass to `off()` for the precise three-argument form, which is the idiomatic Phaser pattern. If any other code has registered on `REACT_ANSWER_FEEDBACK`, calling `off(event)` with no handler will silently remove those too.

**The correct fix:** Convert to a named class method so it can be properly tracked:

```typescript
// In class body:
private onAnswerFeedback = (data: { type: string }) => {
  if (data.type === 'correct') {
    this.cameras.main.flash(200, 100, 255, 100, false);
  } else if (data.type === 'incorrect') {
    this.cameras.main.flash(200, 255, 80, 80, false);
  }
};

// In create():
eventBridge.on(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, this.onAnswerFeedback, this);

// In shutdown():
eventBridge.off(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, this.onAnswerFeedback, this);
```

**Risk:** LOW — isolated change, no behavior change for correct operation.

---

### Bug 2: Dialogue Scoring Double-Fire Risk via Stale Closure in EventBridge Handler

**Location:** `PrivacyQuestPage.tsx` lines 322–398

**What goes wrong:** The EventBridge listener effect at line 322 has a dependency array of `[currentRoomId, resolvedGates, completedZones, collectedItems, isNpcGated]`. The `onInteractZone` handler directly reads `completedZones` and `resolvedGates` from the closure. When `completedZones` changes (zone marked complete), the effect re-runs: the old listeners are removed and new ones are registered.

The race condition: between the time a `EXPLORATION_INTERACT_ZONE` event fires and the time the state update settles, the handler uses the stale `completedZones` set — so `!completedZones.has(data.zoneId)` returns `true` even if the zone was just completed in the same interaction sequence. In practice this is unlikely with a single room at a time (current architecture), but the effect will fire multiple times as `completedZones` accumulates entries in fast zone interactions.

More concretely: if a player rapidly interacts with two zones in quick succession, the second interaction fires `onInteractZone` with a stale closure that still has `completedZones` from before the first zone was recorded (React state batching delays the update). The zone gets added to `completedZones` twice via two setState calls with the same base set, which React reconciles correctly — but the `setCompletedZones` call that runs for the second interaction was based on stale state.

**The safe fix:** Use the functional form of setState and a ref for the read path:

```typescript
// Replace direct completedZones.has() in handler with functional setState:
if (!completedZones.has(data.zoneId)) {
  setCompletedZones(prev => {
    if (prev.has(data.zoneId)) return prev; // already added by concurrent update
    const next = new Set(prev);
    next.add(data.zoneId);
    return next;
  });
}
```

This is a low-risk, one-line fix per interaction type. The functional setState form is idempotent for repeated calls with the same zoneId.

**Risk:** LOW — functional setState is a standard React pattern. No API changes.

---

### Bug 3: GameContainer Reinitializes privacyScore from Prop on Each Mount

**Location:** `GameContainer.tsx` line 24

**What goes wrong:**

```typescript
const [privacyScore, setPrivacyScore] = useState(initialPrivacyScore);
```

`GameContainer` is conditionally rendered in `PrivacyQuestPage` at line 644:

```typescript
{pageMode === 'dialogue' && currentSceneId && dialogueScenes.length > 0 && (
  <GameContainer ... initialPrivacyScore={privacyScore} ... />
)}
```

When `pageMode` switches to `'dialogue'`, `GameContainer` mounts fresh. `initialPrivacyScore` is passed from the page's `privacyScore` state, which IS correctly current — `handlePrivacyScoreChange` keeps the page's score updated. So the initialization is actually correct in the current architecture.

**However**, the win condition check in `PrivacyQuestPage` at line 464 reads from `localStorage.getItem('final-privacy-score')` rather than from the page's own `privacyScore` state. This `final-privacy-score` key is written by `GameContainer` at dialogue-end time (lines 69, 79, 88). There is a brief window where the key hasn't been written yet but `handleDialogueComplete` fires: if `setPageMode('win')` runs before the `localStorage.setItem` call in `GameContainer.handleNextScene`, the page reads `100` (the default) from `final-privacy-score`. In practice these happen in the same synchronous call stack, so the risk is low — but the pattern is fragile.

**The fix:** Pass the final score directly via the `onComplete` callback rather than reading from localStorage:

```typescript
// In GameContainer, modify onComplete to include score:
onComplete?.({ finalPrivacyScore: privacyScore });

// In PrivacyQuestPage handleDialogueComplete:
const handleDialogueComplete = useCallback((result?: { finalPrivacyScore: number }) => {
  if (result?.finalPrivacyScore !== undefined) {
    setFinalPrivacyScore(result.finalPrivacyScore);
  }
  // ... existing logic
}, [...]);
```

Alternatively (lower-effort fix): keep the localStorage read but also write `current-privacy-score` at dialogue end in `GameContainer` and read that instead of `final-privacy-score`. The current split (`current-privacy-score` = running score, `final-privacy-score` = end score) was designed for the old multi-screen game flow that no longer exists.

**Risk:** LOW-MEDIUM — changing the `onComplete` signature touches both files. The localStorage approach is lower risk for this stabilization phase.

---

### Bug 4: `handleExitRoom` Uses Stale `completedNPCs`/`completedZones`/`collectedItems` from Closure

**Location:** `PrivacyQuestPage.tsx` lines 411–430

**What goes wrong:**

```typescript
const handleExitRoom = useCallback(() => {
  const room = rooms.find(r => r.id === currentRoomId);
  if (room) {
    const isComplete = checkRoomCompletion(room);  // reads completedNPCs
    ...
  }
}, [currentRoomId, completedRooms, completedNPCs, completedZones, collectedItems]);
```

`handleExitRoom` is called from the `onExitRoom` EventBridge handler at line 380:

```typescript
const onExitRoom = () => { handleExitRoom(); };
eventBridge.on(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, onExitRoom);
```

The listener effect has `[currentRoomId, resolvedGates, completedZones, collectedItems, isNpcGated]` as its dependency array (line 398). `completedNPCs` is NOT in this array — it's used by `handleExitRoom` (via `checkRoomCompletion`) but not listed as a dependency of the effect that registers `onExitRoom`. This means `onExitRoom` closes over a potentially stale `handleExitRoom` reference.

In practice, `handleExitRoom` is a `useCallback` with `completedNPCs` in its own dependency array, so it will be a fresh function instance when `completedNPCs` changes. But `onExitRoom` in the effect captures the `handleExitRoom` callback reference from the PREVIOUS render — not from the render where `completedNPCs` updated.

**Consequence:** A player who completes the last NPC and immediately presses ESC to exit the room may have their room NOT marked as complete, because `checkRoomCompletion` runs against the stale `completedNPCs` set from before the last NPC was added.

**The fix:** Add `handleExitRoom` to the EventBridge effect's dependency array:

```typescript
}, [currentRoomId, resolvedGates, completedZones, collectedItems, isNpcGated, handleExitRoom]);
```

Or use the ref pattern from PITFALLS.md Pitfall 1:

```typescript
const stateRef = useRef({ completedNPCs, completedZones, collectedItems, currentRoomId });
useEffect(() => {
  stateRef.current = { completedNPCs, completedZones, collectedItems, currentRoomId };
});

const handleExitRoom = useCallback(() => {
  const { completedNPCs, completedZones, collectedItems, currentRoomId } = stateRef.current;
  // ... rest of function uses stateRef.current values
}, []); // stable reference — no re-registration needed
```

**Risk:** LOW — adding `handleExitRoom` to the dependency array is the minimal fix. The ref pattern is more robust but touches more code.

---

### Bug 5: `ExplorationScene.onDialogueComplete` Does Not Guard Against Firing When Scene Is Not Active

**Location:** `ExplorationScene.ts` — the `onDialogueComplete` private method

**What goes wrong:** When `REACT_DIALOGUE_COMPLETE` fires, `onDialogueComplete` resumes movement:

```typescript
private onDialogueComplete = () => {
  this.paused = false;
  // ... resume player movement
};
```

If the user navigates away from the exploration page (or the scene is restarted mid-dialogue via the QA auto-navigation param), the EventBridge listener may fire against a scene that is no longer active. The `this.paused` write is harmless, but resuming movement logic that touches `this.player.body` will throw a null reference if the player sprite was destroyed during shutdown.

**The fix:** Add an active-scene guard at the top of `onDialogueComplete`:

```typescript
private onDialogueComplete = () => {
  if (!this.scene.isActive()) return;
  this.paused = false;
  // ... rest
};
```

Apply the same guard to `onPauseFromModal`, `onMusicVolume`, `onPlaySfx`, and `onAnswerFeedback`.

**Risk:** LOW — one-line guard per method. Already used elsewhere in the codebase (`if (!this.bgMusic || !this.scene.isActive()) return;` at line 1023).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Safe localStorage JSON parse | Custom try/catch wrapper for every key | Standard try/catch inline (already in place); centralize in `loadSave()` function |
| Multi-step migration with partial failure recovery | Complex transactional migration | Write v2 first, then delete v1 — if write succeeds, old keys become unreachable cruft (no crash risk) |
| EventBridge listener registry | Custom `WeakMap` or `Map` tracking | The three-argument `eventBridge.off(event, handler, context)` form is the Phaser-native pattern; use it consistently |
| Schema version negotiation | Version field with upgrade path per version | Version 2 is the only version that matters now — single migration path (v1 → v2), not a chain |

---

## Common Pitfalls

### Pitfall 1: Migration Runs Twice on the Same Browser
**What goes wrong:** If `migrateV1toV2()` is called before v2 is written (e.g., before the first `localStorage.setItem`), a crash partway through leaves partial v1 keys remaining. On the next page load, the migration runs again and overwrites any v2 data that WAS written.

**How to avoid:** The check `if (existing) return JSON.parse(existing)` at the top of the function prevents double-migration. The v2 key must be written atomically — write the complete v2 object before removing v1 keys.

**Warning signs:** Score resets to 100 on the second page load even though v1 had a non-100 score.

### Pitfall 2: Per-Room Keys Missed in Migration
**What goes wrong:** The function migrates the 11 global keys but forgets to scan `resolvedGates_${roomId}`, `unlockedNpcs_${roomId}`, and `pq:room:${roomId}:npcPulsed`. These 18+ per-room keys remain as orphaned v1 data. The next time the player enters a room, the page reads from `resolvedGates_${roomId}` because PrivacyQuestPage.tsx still has the old code. The data is there, but the v2 save doesn't have it.

**How to avoid:** The migration function MUST receive the room ID list and scan per-room keys. After writing v2, remove ALL v1 keys including per-room ones.

**Warning signs:** Player's gate state resets (they have to re-answer the choice gates) even though migration ran.

### Pitfall 3: PrivacyQuestPage Still Writes v1 Keys After Migration
**What goes wrong:** Migration converts v1 → v2 on boot. But the page's `useEffect` persistence hooks still write `completedRooms`, `completedNPCs`, etc. as individual keys. After one interaction, v1 keys are back.

**How to avoid:** All persistence `useEffect` hooks in PrivacyQuestPage must be updated to call `writeSave(updatedSaveObject)` instead of writing individual keys. This is the bulk of the FOUN-03 implementation work.

**Warning signs:** After migration, inspect localStorage — v1 keys should remain absent. If they reappear after an interaction, the write path hasn't been updated.

### Pitfall 4: GameContainer's `final-privacy-score` Key Left as Orphan
**What goes wrong:** `GameContainer.tsx` writes `final-privacy-score` directly on lines 69, 79, 88. This is not part of the main PrivacyQuestPage persistence system and won't be caught by the migration's v1-key removal. If this key persists alongside v2, the win condition check at PrivacyQuestPage line 464 will read it, which is fine — but it means a stale v1 key survives.

**How to avoid:** Either update `GameContainer` to stop writing `final-privacy-score` and pass the score via `onComplete` callback, OR explicitly add `final-privacy-score` to the list of v1 keys removed during migration AND update the win condition to read from `pq:save:v2`.

**Warning signs:** After migration, localStorage contains `final-privacy-score` without any other v1 keys — it's an orphan.

---

## Code Examples

### Migration Boot Call (in PrivacyQuestPage.tsx module scope)
```typescript
// Source: Pattern derived from codebase inspection — PrivacyQuestPage.tsx lines 62–88
import { migrateV1toV2, writeSave } from '@/lib/saveData';
import roomDataJson from '@/data/roomData.json';

// Run before component function — executes during module evaluation
const ROOM_IDS = (roomDataJson.rooms as any[]).map((r: any) => r.id);
const initialSave = migrateV1toV2(ROOM_IDS);

// State initializers use migrated data:
const [completedRooms, setCompletedRooms] = useState<string[]>(initialSave.completedRooms);
const [privacyScore, setPrivacyScore] = useState<number>(initialSave.privacyScore);
// etc.
```

### Consolidated Persistence (replaces 7 individual useEffects)
```typescript
// Source: Pattern derived from codebase inspection — PrivacyQuestPage.tsx lines 138–144
// Replace the 7 individual persistence useEffects with a single one:
useEffect(() => {
  writeSave({
    version: 2,
    completedRooms,
    collectedStories,
    completedNPCs: Array.from(completedNPCs),
    completedZones: Array.from(completedZones),
    collectedItems: Array.from(collectedItems),
    privacyScore,
    finalPrivacyScore,
    resolvedGates: resolvedGatesAll,  // see below
    unlockedNpcs: unlockedNpcsAll,
    npcPulsedRooms,
    gameStartTime,
    onboardingSeen: !showIntroModal,
    sfxMuted: muted,
    musicVolume: currentMusicVolume,
  });
}, [completedRooms, collectedStories, completedNPCs, completedZones,
    collectedItems, privacyScore, finalPrivacyScore, gameStartTime,
    resolvedGatesAll, unlockedNpcsAll, npcPulsedRooms]);
```

Note: `resolvedGates` and `unlockedNpcs` currently live as per-room React state in PrivacyQuestPage. The v2 schema collapses them to a single map. The page state shape needs to change from `Set<string>` (current room only) to `Record<string, string[]>` (all rooms). This is the most significant state shape change in FOUN-03.

### REACT_ANSWER_FEEDBACK Named Method Fix
```typescript
// Source: ExplorationScene.ts lines 1003–1009 + 1220
// BEFORE (creates new anonymous function on each scene restart):
eventBridge.on(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, (data: { type: string }) => { ... });

// AFTER (named method — matches the pattern of onDialogueComplete, onPauseFromModal, etc.):
private onAnswerFeedback = (data: { type: string }) => {
  if (!this.scene.isActive()) return;
  if (data.type === 'correct') {
    this.cameras.main.flash(200, 100, 255, 100, false);
  } else if (data.type === 'incorrect') {
    this.cameras.main.flash(200, 255, 80, 80, false);
  }
};

// In create():
eventBridge.on(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, this.onAnswerFeedback, this);
// In shutdown():
eventBridge.off(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, this.onAnswerFeedback, this);
```

---

## State of the Art

| Old Pattern | New Pattern (v2) | Impact |
|-------------|-----------------|--------|
| 29 individual localStorage keys | Single `pq:save:v2` JSON key | Atomic read/write; debuggable; version-safe |
| Anonymous EventBridge handler registered in `create()` | Named class method with context | Correct cleanup on every scene restart |
| Per-room `resolvedGates` state (current room only) | Global `resolvedGates` map (all rooms) | Enables returning to previously visited rooms with state intact |
| `final-privacy-score` written by GameContainer | Score passed via callback or read from v2 save | Eliminates write-timing window at game completion |

---

## Open Questions

1. **resolvedGates/unlockedNpcs state shape change**
   - What we know: Currently `resolvedGates` is a `Set<string>` in page state for the current room only. The page reloads it from localStorage on room change (line 193–214).
   - What's unclear: Should the page hold ALL rooms' gate state in memory (as a `Record<string, string[]>`), or continue loading per-room on room change and just write to the v2 schema's nested map? Holding all rooms in state is cleaner for the v2 unified architecture but requires refactoring the `resolveGate`, `isNpcGated`, and room-change effect.
   - Recommendation: Keep the current per-room load pattern but write to `v2.resolvedGates[roomId]` and `v2.unlockedNpcs[roomId]` instead of separate keys. Migration converts old keys to the nested map format. This is the minimum-change path.

2. **`sfx_muted` and `music_volume` — shared with BreachDefensePage**
   - What we know: These keys are read by BreachDefensePage, HubWorldPage, and ExplorationScene — not just PrivacyQuestPage. Moving them into `pq:save:v2` would require those pages to read from the v2 save object.
   - What's unclear: Does Phase 11 scope include migrating audio settings into v2? These are shared settings, not game-progress data.
   - Recommendation: Keep `sfx_muted` and `music_volume` as standalone keys. Include them in the v2 schema as readable/writable fields but continue writing them as standalone keys too (for backward compat with BreachDefensePage). This is explicitly a FOUN-03 judgment call for the planner.

3. **`gameStartTime` semantics**
   - What we know: Read at PrivacyQuestPage mount to compute elapsed time. Written once at mount. Will be reset to `Date.now()` on `handlePlayAgain()` which calls `localStorage.clear()`.
   - What's unclear: Should `gameStartTime` be preserved across migration or reset? It measures when the current play session started, not when the game was first installed.
   - Recommendation: Preserve existing value during migration. If absent, default to `Date.now()`.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `client/src/pages/PrivacyQuestPage.tsx` — all 29 localStorage keys inventoried, stale closure bugs identified at lines 322–398, 411–430
- Direct codebase inspection: `client/src/phaser/scenes/ExplorationScene.ts` — anonymous handler bug at lines 1003–1009, missing named-method off at line 1220, scene-active guards needed in all private event handlers
- Direct codebase inspection: `client/src/components/GameContainer.tsx` — scoring re-init pattern at line 24, final-privacy-score timing issue at lines 69–88
- Direct codebase inspection: `client/src/phaser/EventBridge.ts` — singleton EventEmitter, no built-in duplicate-listener protection
- `.planning/research/PITFALLS.md` — Pitfall 4 (save format migration) and Pitfall 2 (EventBridge accumulation) confirmed by direct inspection
- `.planning/research/ARCHITECTURE.md` — v2 save schema design (Decision 3, lines 102–127) used as basis for FOUN-03 schema

### Secondary (MEDIUM confidence)
- `.planning/PROJECT.md` — FOUN-03/FOUN-04 requirements and v2.0 milestone context
- `.planning/ROADMAP.md` — Phase 11 success criteria

---

## Metadata

**Confidence breakdown:**
- v1 key inventory: HIGH — grep-verified across all source files
- Bug identification: HIGH — root causes traced to specific line numbers in actual code
- v2 schema design: HIGH — extends the design from ARCHITECTURE.md Decision 3
- Migration function pattern: HIGH — standard localStorage JSON pattern, no external dependencies
- Bug fix strategies: HIGH — each fix is a well-known React/Phaser pattern used elsewhere in the codebase

**Research date:** 2026-03-27
**Valid until:** This research reflects the codebase as of commit `4784215`. Valid until any of the inspected files change.
