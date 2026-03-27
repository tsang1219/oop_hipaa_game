# Phase 13: Encounter Integration - Research

**Researched:** 2026-03-27
**Domain:** Phaser 3 scene lifecycle (sleep/wake/launch/stop), React encounter HUD, unified compliance score, BreachDefenseScene init-data path, condensed wave design
**Confidence:** HIGH — all findings drawn from direct codebase inspection + prior ARCHITECTURE.md and STACK.md research (both HIGH confidence, 2026-03-26)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENC-01 | Encounter trigger/return system — ExplorationScene sleeps while encounter runs, wakes on completion with player position preserved | `scene.sleep()` + `scene.wake()` Phaser pattern fully documented; `this.paused` flag already used in ExplorationScene; shutdown listener cleanup pattern established in both scenes |
| ENC-02 | Condensed inbound TD — 4 waves, 3 tower types per wave tier, ~3-5 min | WAVES array has 10 entries; subset selection documented below; BreachDefenseScene hardcodes `WAVES.length` — must parameterize; WAVE_BUDGETS must also be condensed |
| ENC-03 | Encounter launches with narrative context card | React modal pattern is the right choice — consistent with all other PrivacyQuest overlays; no new Phaser scene needed |
| ENC-04 | Results feed back to unified game state | Registry pattern (`this.registry.set`) established in STACK.md; BreachDefenseScene currently emits `BREACH_VICTORY` to React — in encounter mode this should instead write to registry and wake ExplorationScene |
| ENC-05 | Inbound TD triggers from IT Office / Act 3 narrative moment | IT Office is an existing room in ExplorationScene's room data; trigger point is a zone or door interaction; ExplorationScene already has zone interaction system |
| ENC-06 | Unified compliance score aggregates dialogue + encounter, visible in HUD | privacyScore in PrivacyQuestPage (0-100); securityScore in BreachDefenseScene (0-100 but starts at 100 and decreases); formula must convert both to a common additive or weighted scale |
| ENC-07 | Clear start/end screens for encounters | Start: narrative context card (React modal, pre-wave). End: debrief screen (React modal, post-encounter) with score + HIPAA takeaways |

</phase_requirements>

---

## Summary

Phase 13 integrates the existing BreachDefenseScene as an in-world encounter launched from ExplorationScene, without React route changes and without losing player state. The architectural pattern is already fully designed in ARCHITECTURE.md and STACK.md (2026-03-26): `scene.sleep()` + `scene.launch('BreachDefense', config)`, with results written to the Phaser registry before `scene.wake('Exploration')`. The implementation gap is concrete — none of these patterns exist yet in BreachDefenseScene or ExplorationScene.

Three sub-problems require the most attention: (1) parameterizing BreachDefenseScene to accept encounter config via `init(data)` where it currently hardcodes all WAVES and WAVE_BUDGETS at construction; (2) designing the condensed 4-wave set from existing wave data; and (3) the unified score formula, where PrivacyQuest's `privacyScore` (starts 100, changes by ±1–3 per choice) and BreachDefenseScene's `securityScore` (starts 100, decreases when enemies reach the end, bottom-out triggers GAMEOVER) are semantically different — they require explicit normalization before combining into a single compliance score.

React owns all text, modals, and HUD — consistent with the project architecture. The narrative context card (ENC-03), encounter start countdown, and debrief screen (ENC-07) are React components that overlay the Phaser canvas. The HUD unified score display is a React component that reads from the Phaser registry.

**Primary recommendation:** Follow the ARCHITECTURE.md encounter launch flow exactly. The entire encounter lifecycle is Phaser-managed (sleep/wake), with React exclusively responsible for overlay UI and score display. No React route changes. No Phaser scene changes for the standalone `/breach` mode.

---

## Standard Stack

### Core (No New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser ScenePlugin | ^3.90.0 | `scene.launch()`, `scene.sleep()`, `scene.wake()`, `scene.stop()` | Native Phaser multi-scene pattern; stable since 3.17 |
| Phaser DataManager (Registry) | ^3.90.0 | `this.registry.set/get` for cross-scene encounter config + results | Already the recommended state channel from STACK.md; fires `changedata` events React can subscribe to |
| Phaser Scene Events | ^3.90.0 | `Phaser.Scenes.Events.WAKE` for ExplorationScene post-encounter hook | Fires when scene wakes from sleep; clean hook for NPC reactions |
| Phaser Camera Effects | ^3.90.0 | `cameras.main.fadeOut/fadeIn()` for encounter transition | Consistent with existing door transition pattern; zero boilerplate |
| EventBridge (existing) | custom | New constants: `ENCOUNTER_TRIGGERED`, `REACT_LAUNCH_ENCOUNTER`, `ENCOUNTER_COMPLETE`, `REACT_RETURN_FROM_ENCOUNTER` | Extend existing singleton; same `off()` discipline applies |
| React (useState/useEffect) | ^18.3.1 | Narrative context card, encounter HUD, debrief screen | React owns all text/modal UI per project architecture |

**Installation:** No new npm packages required.

---

## Architecture Patterns

### Pattern 1: Encounter Mode via BreachDefenseScene init(data)

**What:** BreachDefenseScene receives an optional `encounterConfig` in its `init(data)` hook. When present, it runs in condensed mode. When absent (standalone `/breach`), it runs full 10-wave mode. No branching in `create()` or `update()` — all configuration is resolved in `init()`.

**Current state of `init()`:** BreachDefenseScene has an `init()` method (line 119) that resets all runtime state but reads no configuration data. It hardcodes `WAVE_BUDGETS[0]` and implicitly relies on `WAVES.length === 10`.

**What changes:**

```typescript
// client/src/phaser/scenes/BreachDefenseScene.ts
interface BreachDefenseInitData {
  encounterId?: string;          // undefined = standalone mode
  waveSubset?: number[];         // e.g. [0,1,4,9] — indices into WAVES array
  availableTowerIds?: string[];  // e.g. ['MFA','FIREWALL','TRAINING']
  budgetOverride?: number[];     // per-wave budgets for condensed set
}

init(data: BreachDefenseInitData = {}) {
  this.encounterId = data.encounterId ?? null;
  this.waveSubset = data.waveSubset ?? null;       // null = all 10 waves
  this.availableTowerIds = data.availableTowerIds ? new Set(data.availableTowerIds) : null;
  this.waveBudgets = data.budgetOverride ?? [...WAVE_BUDGETS];
  // ... existing reset logic unchanged ...
}
```

**Wave resolution:** Add a getter `private getActiveWaves()` that returns `this.waveSubset?.map(i => WAVES[i]) ?? WAVES`. Use this everywhere `WAVES[this.wave - 1]` currently appears. Also update the `waveCounterText` to show `WAVE X/4` in encounter mode vs `WAVE X/10` in standalone.

**Tower filtering:** In tower selection UI and placement validation, filter the TOWERS object by `this.availableTowerIds` when set. The React HUD (BreachDefensePage or EncounterHud) also receives the available tower list in `BREACH_STATE_UPDATE` or via a separate event.

### Pattern 2: Sleep/Wake Encounter Lifecycle

**What:** ExplorationScene sleeps when encounter launches; BreachDefenseScene stops (not sleeps) when encounter ends; ExplorationScene wakes.

**Critical distinction — sleep vs. stop for BreachDefenseScene:**
- `scene.sleep('BreachDefense')` keeps all towers, enemies, projectiles, timers alive in memory — useless for a completed encounter and expensive
- `scene.stop('BreachDefense')` calls `shutdown()`, frees all resources — correct; next encounter always starts fresh from `init()`

```typescript
// ExplorationScene.ts — new methods to add

private triggerEncounter(encounterId: string, config: BreachDefenseInitData) {
  this.paused = true;
  this.registry.set('pendingEncounter', { ...config, encounterId });

  this.cameras.main.fadeOut(400, 0, 0, 0);
  this.cameras.main.once(
    Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
    () => {
      this.scene.launch('BreachDefense', config);
      this.scene.sleep();  // hide Exploration without destroying it
    }
  );
}

// Called when ExplorationScene wakes from sleep
private handleWakeFromEncounter = () => {
  const pending = this.registry.get('pendingEncounter') as { encounterId: string } | null;
  if (!pending) return;
  const result = this.registry.get(`encounterResult_${pending.encounterId}`);
  this.registry.set('pendingEncounter', null);
  this.cameras.main.fadeIn(400, 0, 0, 0);
  // Trigger NPC reaction based on result
  if (result) {
    this.triggerPostEncounterNPCLine(pending.encounterId, result.score);
  }
};

create() {
  // ... existing setup ...
  this.events.on(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
}

shutdown() {
  this.events.off(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
  // ... existing cleanup ...
}
```

**Player position:** When ExplorationScene sleeps, all its state (player `x`/`y`, `this.paused`, NPC completion sets, interactables array) survives intact in memory. No position save/restore needed — sleep is not a restart.

**What BreachDefenseScene does at encounter end:**

```typescript
// BreachDefenseScene.ts — modify onEncounterVictory (and onEncounterGameOver)

private onEncounterVictory(totalScore: number) {
  if (!this.encounterId) return;  // standalone mode: use existing BREACH_VICTORY path

  // Write result to registry before waking ExplorationScene
  this.registry.set(`encounterResult_${this.encounterId}`, {
    type: 'td-inbound',
    score: totalScore,
    completed: true,
    outcome: 'victory',
  });
  // Increment unified score
  this.registry.inc('complianceScore', this.deriveEncounterScoreContribution(totalScore));

  this.cameras.main.fadeOut(400, 0, 0, 0);
  this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    this.scene.stop();                   // full shutdown
    this.scene.wake('Exploration');      // resumes RPG at exact player position
  });
}
```

**BRIDGE_EVENTS dual-path:** BreachDefenseScene currently emits `BREACH_VICTORY` to React when it wins. In encounter mode, it should NOT emit `BREACH_VICTORY` — instead write to registry and wake Exploration. The guard is `if (this.encounterId)` — when null, fall through to the existing `BREACH_VICTORY` path for standalone mode.

### Pattern 3: React Encounter HUD Swap

**What:** The React page (currently PrivacyQuestPage, post-Phase 12 this is UnifiedGamePage) listens for `ENCOUNTER_TRIGGERED` and swaps from RPG HUD mode to encounter HUD mode. It renders `EncounterHud` (wrapping existing BreachDefense React components) while the encounter runs.

**Encounter HUD during TD encounter:** The existing `BreachDefensePage` UI — tower selection panel, wave banner, budget/score display, wave intro/end modals — must be available during in-RPG encounters. The simplest approach is a thin `EncounterHud` wrapper that conditionally renders these components when `encounterActive` is true.

**Filtering available towers in React:** When `encounterActive`, the tower panel should only show the 3 towers in `availableTowerIds`. Pass this from the encounter config or via registry.

**Narrative context card (ENC-03):** A React modal shown before the encounter starts (between `ENCOUNTER_TRIGGERED` and the actual scene launch). Flow:

```
ExplorationScene: emits ENCOUNTER_TRIGGERED { encounterId, narrativeText, config }
UnifiedGamePage: shows NarrativeContextCard modal
Player: reads card, clicks "Defend the Network"
UnifiedGamePage: emits REACT_LAUNCH_ENCOUNTER { config }
ExplorationScene: hears event → scene.sleep() + scene.launch('BreachDefense', config)
```

The narrative context card is a separate new React component — not an existing modal. It displays a brief story card ("Dr. Patel just detected suspicious logins on the patient records server. Something is attacking the network...") before transitioning to encounter mode.

**Debrief screen (ENC-07):** Shown after `ENCOUNTER_COMPLETE` event, before `REACT_RETURN_FROM_ENCOUNTER`. A React component showing encounter score, security score achieved, and 2 HIPAA takeaways drawn from the wave concepts covered.

### Pattern 4: Unified Score Formula

**Current scales:**
- `privacyScore` in PrivacyQuestPage: starts at 100, increments by +1 to +3 per correct NPC choice, decrements by -1 to -3 per wrong choice. Accumulated over 23+ NPC scenarios.
- `securityScore` in BreachDefenseScene: starts at 100, decrements by 10 per enemy reaching the end. Does not increment. Range: 100 (perfect) → 0 (GAMEOVER).

**Problem:** These are semantically different. Privacy score is additive accumulation. Security score is a health bar that measures defense quality. They cannot be simply summed.

**Recommended approach — registry-based unified compliance score:**

The registry holds `complianceScore` (integer, starting at 0, accumulating). Each scoring event adds a normalized delta:

```typescript
// Dialogue choice scores (unchanged from current logic, but also written to registry)
// Correct: +3, Partial: +1, Wrong: -1 to -3

// Encounter score contribution:
function deriveEncounterScoreContribution(securityScore: number): number {
  // securityScore 0-100 (BreachDefenseScene's final value)
  // Map to same order-of-magnitude as dialogue scores
  // A 4-wave encounter with 3 tower types ≈ 4 dialogue scenarios worth of exposure
  // Award up to +12 points (=4 × perfect-scenario equivalent)
  return Math.round((securityScore / 100) * 12);
}
```

The HUD displays `complianceScore` (cumulative integer) or a percentage of max possible. The existing `privacyScore` display (PrivacyMeter) in PrivacyQuestPage becomes the `complianceScore` display in UnifiedGamePage — same visual component, different source.

**IMPORTANT:** The encounter security score (100 = no enemies got through) must NOT replace the accumulated compliance score — it contributes a delta to it. A player who gets 80/100 on the encounter earns +9-10 points, not a score reset to 80.

### Pattern 5: Condensed 4-Wave Design

**Design goal:** 3-5 minute encounter. 4 waves, each teaching one HIPAA Security concept. Boss wave at wave 4 with multi-vector threat.

**Recommended wave subset from WAVES array** (indices 0-9 = waves 1-10):

| Encounter Wave | Source Wave | ID | Name | Concepts Covered | Why Selected |
|---|---|---|---|---|---|
| 1 | Wave 1 (idx 0) | "The Friendly Email" | PHISHING | PHISHING | Entry-level; teaches primary attack vector |
| 2 | Wave 3 (idx 2) | "Remind Me Later" | RANSOMWARE | PATCHING | Escalation; tough threat, patch concept |
| 3 | Wave 5 (idx 4) | "The Trusted Colleague" | INSIDER | ACCESS | Insider threat — distinct from external |
| 4 | Wave 8 (idx 7) | "Defense in Depth" | PHISHING+RANSOMWARE+INSIDER+CREDENTIAL | LAYERS | Multi-vector boss — reinforces all three |

**Tower availability per encounter tier:**

Following the Enhancement Brief spec (section 4.2):
- Waves 1-2 tower set: `['FIREWALL', 'MFA', 'TRAINING']` — basics matching wave 1-2 threats
- Wave 3: add `'PATCH'` or `'ACCESS'` (3 towers total; swap one from previous set) — escalation
- Wave 4 (boss): all 4 towers available — coordinated defense

**Simplest implementation:** One fixed `availableTowerIds` list for the whole encounter — `['FIREWALL', 'MFA', 'TRAINING', 'ACCESS']`. This covers all 4 wave threat types (PHISHING→TRAINING/MFA, RANSOMWARE→FIREWALL, INSIDER→ACCESS, multi-vector→all). No mid-encounter tower unlocks needed for v2.0.

**Condensed wave budgets** — encounter mode only:

```typescript
// budgetOverride for encounter (4 waves)
export const ENCOUNTER_WAVE_BUDGETS = [
  150,  // Wave 1: afford Firewall + MFA
  100,  // Wave 2: +Training beacon
  120,  // Wave 3: +Access Control
  150   // Wave 4 boss: +second placement
];
```

**Enemy counts per encounter wave** — reduce from full standalone counts by ~50%:

| Encounter Wave | Threats | Count |
|---|---|---|
| 1 | PHISHING | 2 (vs. 3 in standalone) |
| 2 | RANSOMWARE | 1 (vs. 2 in standalone) |
| 3 | INSIDER | 2 (vs. 3 in standalone) |
| 4 | PHISHING+RANSOMWARE+INSIDER+CREDENTIAL | 2/1/1/2 (vs. 3/2/2/3) |

This approach requires either: (a) a new `ENCOUNTER_WAVES` constant array with reduced counts, or (b) the `waveSubset` containing modified wave objects instead of just indices. Option (a) is cleaner — separate constant, no mutation.

### Pattern 6: IT Office Encounter Trigger Point

**Trigger location:** The IT Office room already exists in the room data. The encounter trigger should be a zone interaction (same system as existing observation zones) placed at a server/terminal object in the IT Office.

**Trigger condition:** The zone fires only if `currentAct >= 2` (or equivalent act flag) and `encounterResult_td-it-office` is not set in the registry (prevents re-triggering on revisit). On second visit, the NPC has a post-encounter reaction line instead.

**Narrative setup:** The IT Security Analyst NPC in the IT Office has existing dialogue. The encounter trigger should follow (not precede) interacting with the analyst — the NPC surfaces the threat, then walking to the server triggers the encounter zone.

### Anti-Patterns to Avoid

- **Using React navigate('/breach') for encounter launch:** Destroys Phaser game instance, loses all state. The current `/breach` route is standalone arcade mode only.
- **Emitting BREACH_VICTORY in encounter mode:** This sends results to BreachDefensePage (standalone React HUD) which is not mounted during in-RPG encounters. Guard with `if (this.encounterId === null)` before all existing React-notifying emissions.
- **Sleeping BreachDefenseScene instead of stopping it:** Keeps hundreds of enemy/tower/projectile objects in memory. Always `scene.stop()` when encounter ends.
- **Adding WAKE listener to ExplorationScene in `update()` or re-registering in every `create()`:** Causes listener accumulation across room restarts. Register once in `create()`, remove in `shutdown()` — exactly as modeled in ARCHITECTURE.md Pattern 2.
- **Storing `privacyScore` and `securityScore` as separate fields in the unified HUD:** They have different semantics. Convert both to `complianceScore` deltas when events fire, display only `complianceScore`.
- **Modifying WAVES or WAVE_BUDGETS arrays directly for encounter mode:** These constants are imported in multiple files. Use override parameters in `init(data)` instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scene lifecycle during encounter | Custom pause/hide mechanism for ExplorationScene | `scene.sleep()` + `scene.wake()` | Phaser preserves all scene state including player position; custom hide would still need state preservation logic |
| Cross-scene data passing | EventBridge events with encounter config payload | Phaser registry (`this.registry.set`) for config + results | Registry is readable by both scenes at any time without event timing issues |
| Encounter start countdown | New Phaser timer system | Existing `onStartPrepCountdown()` method in BreachDefenseScene (line 734) | Already draws countdown text, does 8-second prep with placement hints — reuse with minor config |
| Wave filtering logic | Custom wave runner | `waveSubset` index array + `getActiveWaves()` getter | Preserves all existing wave data; encounter mode is a view into the same data |
| Encounter end debrief content | New HIPAA content | Existing `WAVES[idx].endMessage` strings | Each wave already has an `endMessage` explaining the HIPAA concept; debrief can display 1-2 of these |

---

## Common Pitfalls

### Pitfall 1: Duplicate EventBridge Listeners After Wake

**What goes wrong:** ExplorationScene registers `REACT_LAUNCH_ENCOUNTER` listener in `create()`. The scene sleeps for an encounter, then wakes. The WAKE event fires `handleWakeFromEncounter`. But if `create()` is called again (e.g., if the scene was stopped and restarted for a room transition), the listener fires twice.

**Why it happens:** ExplorationScene currently restarts itself (calls `scene.start('Exploration', newData)`) for room-to-room transitions in Phase 12. A restart calls `shutdown()` + `init()` + `create()` — so listeners from the previous `create()` are removed in `shutdown()`. Sleep/wake does NOT call `shutdown()` or `create()` — the listener persists correctly.

**How to avoid:** Use `this.events.on(Phaser.Scenes.Events.WAKE, ...)` for the post-encounter hook (fires on wake, not on create). Register `REACT_LAUNCH_ENCOUNTER` listener in `create()` with matching `off()` in `shutdown()`. The WAKE listener goes on `this.events` (scene events), not on `eventBridge`, so it automatically scopes to the scene.

**Warning signs:** Post-encounter NPC reactions firing twice; encounter launching twice in a row.

### Pitfall 2: BreachDefenseScene Emitting React Events in Encounter Mode

**What goes wrong:** In encounter mode, `BreachDefensePage` is not mounted. `BreachDefenseScene` currently emits `BREACH_VICTORY`, `BREACH_GAME_OVER`, `BREACH_WAVE_START`, `BREACH_STATE_UPDATE`, `BREACH_TOWER_PLACED` to React. When launched as encounter overlay, nobody is listening for most of these — but `BREACH_VICTORY` and `BREACH_GAME_OVER` especially must NOT try to set React page state on `BreachDefensePage` (unmounted).

**Why it happens:** The scene has no way to know if it's standalone or encounter mode... unless told via `init(data)`.

**How to avoid:** Gate all React-directed events on `this.encounterId === null`:

```typescript
// Before every eventBridge.emit(BRIDGE_EVENTS.BREACH_VICTORY, ...)
if (this.encounterId === null) {
  eventBridge.emit(BRIDGE_EVENTS.BREACH_VICTORY, { ... });
} else {
  this.onEncounterVictory(this.securityScore);
}
```

The `BREACH_STATE_UPDATE`, `BREACH_WAVE_START`, `BREACH_WAVE_COMPLETE` events are still needed in encounter mode — they drive `EncounterHud` (which IS mounted during encounter). Only the terminal events (`BREACH_VICTORY`, `BREACH_GAME_OVER`) and standalone-only events need gating.

### Pitfall 3: Score Double-Counting

**What goes wrong:** `complianceScore` in the registry is incremented by BreachDefenseScene (`registry.inc('complianceScore', contribution)`) AND by the React handler for `ENCOUNTER_COMPLETE`. Result: score goes up twice.

**How to avoid:** Pick one path and commit. Recommended: BreachDefenseScene writes result to `encounterResult_${id}` in registry, then wakes ExplorationScene. ExplorationScene's WAKE handler reads the result and emits `ENCOUNTER_COMPLETE` to React with the score. React updates `complianceScore` via `registry.set`. BreachDefenseScene never directly touches `complianceScore` — it only writes its own result. This keeps score logic in one place (React/ExplorationScene boundary).

### Pitfall 4: Encounter Re-Triggering on Room Revisit

**What goes wrong:** Player completes the encounter, returns to IT Office later (backtracking), triggers the encounter zone again, re-launches BreachDefenseScene.

**How to avoid:** The encounter trigger zone in ExplorationScene must check the registry before firing:

```typescript
if (this.registry.get('encounterResult_td-it-office')) {
  // Already completed — show post-encounter NPC line instead
  return;
}
```

This requires the encounter ID to be a stable string (`'td-it-office'`), not dynamically generated. Fixed encounter IDs are correct for the one inbound TD encounter in v2.0.

### Pitfall 5: waveCounterText Shows Wrong Max

**What goes wrong:** The wave counter currently renders `WAVE ${this.wave}/${WAVES.length}` (i.e., "WAVE 1/10") even in encounter mode where max is 4.

**How to avoid:** Replace the hardcoded `WAVES.length` with `this.getActiveWaves().length` everywhere the wave count is displayed.

---

## Code Examples

### BreachDefenseScene — init() with encounter config

```typescript
// Source: direct inspection of BreachDefenseScene.ts lines 119-151
// Extend existing init() to accept encounter config

interface BreachDefenseInitData {
  encounterId?: string;
  waveSubset?: number[];          // WAVES array indices
  availableTowerIds?: string[];
  budgetOverride?: number[];
}

init(data: BreachDefenseInitData = {}) {
  // New encounter-mode fields
  this.encounterId = data.encounterId ?? null;
  this.activeWaveIndices = data.waveSubset ?? null;
  this.availableTowerFilter = data.availableTowerIds ? new Set(data.availableTowerIds) : null;
  this.waveBudgets = data.budgetOverride ? [...data.budgetOverride] : [...WAVE_BUDGETS];

  // Existing reset logic (unchanged)
  this.enemies = [];
  this.towers = [];
  this.projectiles = [];
  this.gameState = 'WAITING';
  this.securityScore = 100;
  this.budget = this.waveBudgets[0] ?? 150;
  this.wave = 1;
  // ...
}

private getActiveWaves() {
  if (!this.activeWaveIndices) return WAVES;
  return this.activeWaveIndices.map(i => WAVES[i]);
}
```

### ExplorationScene — encounter trigger and wake handler

```typescript
// Source: ARCHITECTURE.md Pattern 2 + STACK.md Pattern 3

private triggerEncounter(encounterId: string, config: BreachDefenseInitData) {
  this.paused = true;
  this.registry.set('pendingEncounter', { ...config, encounterId });
  this.cameras.main.fadeOut(400, 0, 0, 0);
  this.cameras.main.once(
    Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
    () => {
      this.scene.launch('BreachDefense', config);
      this.scene.sleep();
    }
  );
}

// Registered in create(), removed in shutdown()
private handleWakeFromEncounter = () => {
  const pending = this.registry.get('pendingEncounter') as { encounterId: string } | null;
  if (!pending) return;
  const result = this.registry.get(`encounterResult_${pending.encounterId}`);
  this.registry.set('pendingEncounter', null);
  this.paused = false;
  this.cameras.main.fadeIn(400, 0, 0, 0);
  if (result?.completed) {
    this.triggerPostEncounterNPCLine(pending.encounterId, result.score);
  }
};

create() {
  this.events.on(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
  // ... existing setup
}

shutdown() {
  this.events.off(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
  // ... existing cleanup
}
```

### New BRIDGE_EVENTS constants

```typescript
// Source: ARCHITECTURE.md "New EventBridge Event Constants"
// Add to EventBridge.ts BRIDGE_EVENTS object:

// Phaser → React (new for Phase 13)
ENCOUNTER_TRIGGERED: 'encounter:triggered',   // ExplorationScene: encounter zone hit

// React → Phaser (new for Phase 13)
REACT_LAUNCH_ENCOUNTER: 'react:launch-encounter',           // React: user accepted context card
REACT_RETURN_FROM_ENCOUNTER: 'react:return-from-encounter', // React: debrief dismissed

// Bidirectional (new for Phase 13)
ENCOUNTER_COMPLETE: 'encounter:complete',  // ExplorationScene → React on wake: result data
```

### Condensed encounter wave data

```typescript
// Source: constants.ts WAVES analysis
// New constant for encounter mode — add to constants.ts

export const ENCOUNTER_WAVES_INBOUND = [
  { ...WAVES[0], threats: [{ type: 'PHISHING', count: 2, interval: 3000 }] },     // Friendly Email (reduced)
  { ...WAVES[2], threats: [{ type: 'RANSOMWARE', count: 1, interval: 4000 }] },   // Remind Me Later (reduced)
  { ...WAVES[4], threats: [{ type: 'INSIDER', count: 2, interval: 3000 }] },      // Trusted Colleague (reduced)
  {                                                                                  // Boss: Defense in Depth
    ...WAVES[7],
    threats: [
      { type: 'PHISHING', count: 2, interval: 2500 },
      { type: 'RANSOMWARE', count: 1, interval: 4000 },
      { type: 'INSIDER', count: 1, interval: 3500 },
      { type: 'CREDENTIAL', count: 2, interval: 2000 }
    ]
  }
];

export const ENCOUNTER_WAVE_BUDGETS = [150, 100, 120, 150];
export const ENCOUNTER_AVAILABLE_TOWERS = ['FIREWALL', 'MFA', 'TRAINING', 'ACCESS'];
```

### Unified score contribution formula

```typescript
// Encounter score contribution (add to BreachDefenseScene or GameProgressionService)
// securityScore: 0-100 (BreachDefenseScene final value; 100 = perfect defense)
// Returns delta to add to registry complianceScore
function deriveEncounterScoreContribution(securityScore: number): number {
  // 4-wave encounter ≈ 4 "correct choice" equivalents at perfect play = +12 max
  // Scales proportionally: 80/100 defense → +9-10 points
  return Math.round((securityScore / 100) * 12);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React route navigate('/breach') for TD game | `scene.launch()` + `scene.sleep()` overlay | v2.0 restructure (this phase) | Player state + position survive encounter; no Phaser restart |
| Separate `securityScore` and `privacyScore` | Single `complianceScore` in registry, fed by both sources | v2.0 restructure (this phase) | Unified HUD; scores from both game modes visible together |
| BreachDefenseScene hardcoded to 10 waves | Parameterized via `init(data)` `waveSubset` | v2.0 restructure (this phase) | Same scene serves standalone and encounter modes |

**No deprecated APIs involved.** All Phaser APIs used (`scene.sleep()`, `scene.wake()`, `scene.launch()`, `this.events.on(WAKE)`, `cameras.main.fadeOut()`) have been stable since Phaser 3.17 and are confirmed in Phaser 3.90.

---

## Open Questions

1. **UnifiedGamePage dependency**
   - What we know: Phase 13 depends on Phase 12 (Unified Navigation), which creates UnifiedGamePage. The encounter HUD React components need a React host component that is mounted during encounter.
   - What's unclear: If Phase 13 is planned before Phase 12 ships, planners must account for the fact that `BreachDefensePage` is the current React host and cannot serve as the encounter host.
   - Recommendation: Phase 13 plans must note that `EncounterHud` or the encounter overlay components are integrated into `UnifiedGamePage` (Phase 12 output), not into `BreachDefensePage`. If planning phases independently, stub `UnifiedGamePage` for Phase 13 purposes.

2. **Standalone `/breach` mode tower filtering**
   - What we know: `availableTowerFilter` is null in standalone mode → all 6 towers available. This is the correct default.
   - What's unclear: Does BreachDefensePage need any changes for the filter field to be benignly ignored? Currently it shows all 6 towers unconditionally.
   - Recommendation: No change to BreachDefensePage needed. The `availableTowerFilter` only applies when `encounterId` is non-null. Add the null check before filtering.

3. **Encounter trigger Act gating**
   - What we know: The IT Office encounter should only trigger in Act 2/3. Phase 13 depends on Phase 12's navigation system, which presumably has act state.
   - What's unclear: Is `currentAct` readable from ExplorationScene's registry by Phase 13? Or is it defined in Phase 14?
   - Recommendation: Use a simpler flag for Phase 13: check `encounterResult_td-it-office` absence (has not been completed) AND a lightweight narrative flag like `itOfficeNPCInteracted: true`. This avoids depending on act state that may not exist yet.

4. **Narrative context card content**
   - What we know: Enhancement Brief section 4.2 mentions "Dr. Patel flagged suspicious logins" as example narrative.
   - What's unclear: The IT Office NPC is named "IT Security Analyst" in existing room data — is "Dr. Patel" a planned rename, or is the context card written independently of the NPC name?
   - Recommendation: Write the context card with the existing NPC name or use a generic "the security analyst" — content can be refined in Phase 14 when narrative arc is finalized.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection:
  - `client/src/phaser/scenes/BreachDefenseScene.ts` — full `init()`, `create()`, `shutdown()`, victory/gameover emission points, EventBridge listener registration
  - `client/src/phaser/scenes/ExplorationScene.ts` — `init(data)` signature, `this.paused` flag usage, `shutdown()` EventBridge cleanup
  - `client/src/phaser/EventBridge.ts` — all 26 current `BRIDGE_EVENTS` constants; no encounter events yet
  - `client/src/game/breach-defense/constants.ts` — WAVES (10 entries), TOWERS (6 types), THREATS (8 types), WAVE_BUDGETS
  - `client/src/pages/BreachDefensePage.tsx` — React EventBridge listener structure, score/state management, standalone launch pattern
  - `client/src/pages/PrivacyQuestPage.tsx` — `privacyScore` state (starts 100, ±1-3 per choice), localStorage persistence, score delta display
- `.planning/research/ARCHITECTURE.md` (2026-03-26) — encounter launch flow, sleep/wake pattern, act state design, component boundary decisions — HIGH confidence, authoritative for this project
- `.planning/research/STACK.md` (2026-03-26) — registry pattern, `FADE_OUT_COMPLETE` usage, `WAKE` event, `scene.stop()` vs `scene.sleep()` for BreachDefense — HIGH confidence
- `.planning/ENHANCEMENT_BRIEF.md` section 4.2 — inbound TD spec: 4 waves, 3 tower types per tier, 3-5 minute duration — HIGH confidence (authoritative design document)

### Secondary (MEDIUM confidence)
- `docs.phaser.io/phaser/concepts/scenes/scene-manager` — `sleep()`, `wake()`, `launch()` stable since Phaser 3.17 (verified ARCHITECTURE.md sources)
- `phaser.io/examples/v3/view/scenes/sleep-and-wake` — official sleep/wake example (HIGH confidence per ARCHITECTURE.md sourcing)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all APIs in use already in codebase
- Architecture: HIGH — ARCHITECTURE.md and STACK.md researched codebase directly on 2026-03-26; all patterns verified against actual running code
- Encounter mode parameterization: HIGH — BreachDefenseScene.ts inspected directly; `init()` structure is clear; no encounter mode exists yet (gap confirmed)
- Condensed wave design: HIGH — WAVES array inspected directly; selection rationale based on threat coverage and timing estimates
- Unified score formula: MEDIUM — scoring math is a design decision, not a technical constraint; the formula above is a reasonable starting point but exact weights may need playtesting

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable stack; Phaser APIs unchanged since 3.17)
