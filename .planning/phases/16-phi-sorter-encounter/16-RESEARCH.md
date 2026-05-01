# Phase 16: PHI Sorter Encounter — Research

**Researched:** 2026-05-01
**Domain:** React drag-and-drop mini-game, Phaser encounter lifecycle integration, HIPAA 18-identifier content
**Confidence:** HIGH — all findings from direct codebase inspection of live shipped files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Trigger model:** Re-use existing trigger pattern from Phase 13 — tile zone in room → proximity check → ENCOUNTER_TRIGGERED event → React opens overlay → ExplorationScene sleeps. No modifications to the pattern itself.
- **Trigger locations:** Act 1 = Reception (Riley hands player intake forms). Act 2 = Lab OR Medical Records (planner picks; Lab recommended for sample-label narrative fit). Act 3 edge-case set is optional/stretch.
- **Input modes:** Both drag-and-drop AND keyboard (↑↓ cycle items, ←→ choose bucket, Enter/Space commit) are required with no fallback gaps. Keyboard-only completion fully supported.
- **Scoring:** Per item: correct = +1, incorrect = -1 (or 0; planner picks to match `addScore` convention). Encounter contribution to unified score: accuracy %-based, comparable magnitude to TD encounter (+0 to +12).
- **Audio/visual feedback:** correct drop = green flash + chime; incorrect = red shake + thud; completion = sfx_fanfare + flourish. No silent interactions.
- **Document sets:** At least 3 sets. Set 1 (Act 1, obvious), Set 2 (Act 2, subtle), Set 3 (Act 3/stretch, edge cases). Items live in a TypeScript constants file.
- **Architecture:** Phaser owns nothing of the sorting UI. React owns the entire sorter overlay. EventBridge discriminates encounter types with a type field or separate event (planner picks).
- **Save data:** Encounter completion + accuracy stored in `pq:save:v2` schema via extension to `encounterResults` in `useGameState`. No mid-encounter save.

### Claude's Discretion
- Specific tile coordinates for trigger zones
- Exact React component file structure (prefer split if >300 LOC)
- Item rendering approach (CSS/Tailwind preferred)
- Exact scoring formula coefficients
- Whether Act 2 second trigger ships in this phase or defers
- Whether input-mode toggle is implicit or explicit (strongly prefer implicit: both always live)
- Test coverage approach (Playwright E2E preferred)

### Deferred Ideas (OUT OF SCOPE)
- Controller/gamepad support
- Timed mode / speed scoring bonus
- Animated item entry (elaborate animations)
- Outbound Tower Defense
- Act 3 edge-case set as a separate trigger (may collapse into Act 2 stretch)
- Multi-language support
- Per-item difficulty grading
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SORT-01 | Designated narrative trigger (Reception Act 1 + Lab/Records Act 2) launches PHI Sorter encounter — ExplorationScene pauses and sorting overlay opens via existing encounter lifecycle | Proximity check pattern in ExplorationScene update loop at lines 1495-1504 is the exact model. Tile coords for Reception and Lab trigger zones are determined in the plan. |
| SORT-02 | Encounter opens with NarrativeContextCard explaining why the sort is happening before first item appears | NarrativeContextCard.tsx exists at `client/src/components/breach-defense/NarrativeContextCard.tsx` — render it with PHI-sorter-specific text. UnifiedGamePage encounterPhase state machine routes to it at `encounterPhase === 'narrative-card'`. |
| SORT-03 | Items sortable via drag-and-drop OR keyboard (↑↓ cycle, ←→ bucket, Enter/Space commit) — both end-to-end, no fallback gaps | No existing DnD library in package.json. HTML5 native DnD (draggable attribute + onDragStart/onDrop) is sufficient for the bucket UI. Keyboard: window.addEventListener('keydown') pattern used in ObservationHint.tsx, ChoicePrompt.tsx — same approach applies here. |
| SORT-04 | Each drop produces audio + visual feedback: correct = green flash + chime, incorrect = red shake + thud, completion = fanfare | sfx_fanfare and sfx_interact already loaded. New SFX for chime/thud must be added from Kenney library (confirmation_001.ogg for chime, error_001.ogg for thud). BootScene must preload them. React drives feedback via CSS animation classes + EventBridge REACT_PLAY_SFX. |
| SORT-05 | At least 3 document sets with scaling difficulty: Act 1 obvious, Act 2 subtle, Act 3 edge cases | HIPAA 18 identifiers per 45 CFR §164.514(b)(2) are the source of truth. Sets must live in `client/src/data/sorterData.ts`. Content outlined in research. |
| SORT-06 | Encounter completes in 30-60 seconds; EncounterDebrief shows accuracy + 1-2 HIPAA takeaways; unified compliance score updates proportionally | EncounterDebrief.tsx reused with sorter-specific props. ENCOUNTER_COMPLETE event with sorter discriminator feeds score into gameState.addScore(). encounterResults in useGameState already tracks per-encounter results. |

</phase_requirements>

---

## Summary

Phase 16 builds a new React-owned mini-game overlay that slots into the Phase 13 encounter lifecycle without modifying any Phase 13 infrastructure. The engineering scope is modest: add a proximity trigger in ExplorationScene (5 lines following the exact IT Office pattern), extend the ENCOUNTER_TRIGGERED / ENCOUNTER_COMPLETE event contracts with a `type` discriminator field, add a new `encounterPhase` branch in UnifiedGamePage that renders the PHI Sorter overlay instead of BreachDefense, and build the sorter UI as a standalone React component tree.

The sorter UI itself is all React/Tailwind — drag-and-drop using HTML5 native events (no new library required), keyboard using the same `window.addEventListener('keydown')` pattern used throughout the existing overlay components. Both modes are implicitly always active; no UI toggle needed.

The highest-risk areas are (1) keyboard event collisions with Phaser's input system during encounters — this is already solved in Phase 13: `this.paused = true` stops ExplorationScene from processing WASD/arrow keys during encounters, so React keyboard handlers won't conflict; (2) EventBridge listener leaks — every component that adds listeners in `useEffect` must return a cleanup function; the Phase 13 encounter listener block in UnifiedGamePage is the exact model to follow.

**Primary recommendation:** Implement the sorter overlay as a new `PHISorterOverlay` component family (SorterCard + BucketZone subcomponents). Extend the `encounterPhase` state machine in UnifiedGamePage with a `'phi-sorter'` branch. Add a `type: 'td' | 'phi-sorter'` discriminator to ENCOUNTER_TRIGGERED payload and route accordingly. Total new files: 3-4. Total modified files: 4.

---

## Standard Stack

### Core (No New Packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | ^18.3.1 | Sorter overlay UI, state, keyboard handler | Project convention — React owns all overlay UI |
| Tailwind 3 | ^3.4.17 | Styling, animations (animate-pulse, CSS keyframes for shake/flash) | Existing overlay aesthetic uses Tailwind exclusively |
| HTML5 DnD API | browser-native | Drag-and-drop items to buckets | No library needed for a two-bucket UI; `draggable`, `onDragStart`, `onDragOver`, `onDrop` — built-in |
| Phaser EventEmitter | ^3.90.0 | EventBridge singleton (no change) | Existing singleton; add no new emitter instances |
| TypeScript | ^5.6.3 | `sorterData.ts` constants, type-safe item/set types | CLAUDE.md mandates TS constants files for game data |

**No new npm packages required.** HTML5 native DnD is sufficient for the drag-to-bucket mechanic. A DnD library (dnd-kit, react-dnd) would add 30-50KB bundle and accessibility complexity that is not justified for a two-bucket sort UI.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 native DnD | @dnd-kit/core | dnd-kit provides better touch support and animation hooks, but mobile is out of scope for V2.1. Native DnD is zero-dependency and sufficient. |
| HTML5 native DnD | react-dnd | react-dnd requires a context provider wrapping the app; overkill for a two-bucket UI. |
| CSS class animations | Framer Motion | Framer Motion is not in the project stack and would be a new dependency. Tailwind + CSS keyframes match existing overlay animation style. |

---

## Architecture Patterns

### Recommended Component File Structure

```
client/src/components/phi-sorter/
├── PHISorterOverlay.tsx      # Top-level encounter overlay (state machine, keyboard, score)
├── SorterItem.tsx            # Draggable item card
├── BucketZone.tsx            # Drop target (PHI / Not PHI)
└── SorterDebrief.tsx         # Post-encounter accuracy screen (OR reuse EncounterDebrief.tsx with new props)

client/src/data/
└── sorterData.ts             # SorterDocumentSet[] constants — all 3 document sets
```

Split justification: PHISorterOverlay will be >300 LOC (state machine + keyboard + drag logic + render). Subcomponents keep it readable and independently testable.

### Pattern 1: ENCOUNTER_TRIGGERED discriminator

**What:** The existing `ENCOUNTER_TRIGGERED` event currently carries `{ encounterId, narrativeText, config: BreachDefenseInitData }`. Extend with a `type` field. The planner may also choose a new event name; either is valid — the discriminator approach requires fewer changes.

**Extend EventBridge.ts** — add one constant:
```typescript
// No file changes needed to BRIDGE_EVENTS if we reuse ENCOUNTER_TRIGGERED
// Just add 'type' to the payload shape and document it.
// Alternatively, add:
ENCOUNTER_TRIGGERED_SORTER: 'encounter:triggered:sorter',
```

**Recommended: add `type` to ENCOUNTER_TRIGGERED payload** (smaller diff, no new routing logic needed in UnifiedGamePage's existing ENCOUNTER_TRIGGERED handler). The handler already sets `narrativeCardData` regardless of type; only the `encounterPhase` branch after narrative card confirmation differs.

**ENCOUNTER_TRIGGERED payload (extended):**
```typescript
{
  encounterId: string;            // e.g. 'phi-sort-reception-act1'
  narrativeText: string;          // Riley's handoff text
  type: 'td' | 'phi-sorter';     // discriminator — NEW FIELD
  config?: BreachDefenseInitData; // only present when type === 'td'
  sorterConfig?: {                // only present when type === 'phi-sorter'
    documentSetId: string;        // key into sorterData.ts
  };
}
```

**ENCOUNTER_COMPLETE payload remains unchanged** — `encounterId`, `outcome`, `securityScore` (rename to `rawScore` or use `sortingAccuracy`), `scoreContribution`. The planner may add a `type` field here too for symmetry but UnifiedGamePage already handles score contribution the same way regardless.

### Pattern 2: ExplorationScene trigger zone (copy of IT Office pattern)

**The exact pattern to copy** is at `ExplorationScene.ts` lines 1495-1504:

```typescript
// IT Office encounter zone check (Phase 13) — the model
if (this.room.id === 'it_office' && !this.encounterTriggered && !this.paused) {
  const alreadyDone = this.registry.get('encounterResult_td-it-office');
  if (!alreadyDone) {
    const dx = Math.abs(this.player.x - (9 * TILE + TILE / 2));
    const dy = Math.abs(this.player.y - (6 * TILE + TILE / 2));
    if (dx < TILE * 1.5 && dy < TILE * 1.5) {
      this.triggerEncounter('td-it-office');
    }
  }
}
```

**For PHI Sorter** (add after the IT Office block):
```typescript
// PHI Sorter trigger — Reception Act 1
if (this.room.id === 'reception' && !this.encounterTriggered && !this.paused) {
  const alreadyDone = this.registry.get('encounterResult_phi-sort-reception');
  if (!alreadyDone) {
    const dx = Math.abs(this.player.x - (TRIGGER_X * TILE + TILE / 2));
    const dy = Math.abs(this.player.y - (TRIGGER_Y * TILE + TILE / 2));
    if (dx < TILE * 1.5 && dy < TILE * 1.5) {
      this.triggerPHISorterEncounter('phi-sort-reception', 'phi-sorter-set-1');
    }
  }
}
```

**TRIGGER_X / TRIGGER_Y:** Planner picks tile coordinates in Reception that are (a) reachable, (b) near Riley's desk area but not on a wall, (c) not overlapping existing interactable zones. Riley is at tile (10, 3). The sign-in sheet is at (8, 4), privacy_notice at (12, 4). A reasonable trigger: tile (10, 6) — the open floor in front of Riley's desk. The proximity radius (1.5 tiles) means the player activates it as they walk past.

**For Lab Act 2:**
```typescript
if (this.room.id === 'lab' && !this.encounterTriggered && !this.paused) {
  const alreadyDone = this.registry.get('encounterResult_phi-sort-lab');
  if (!alreadyDone) {
    const dx = Math.abs(this.player.x - (TRIGGER_X * TILE + TILE / 2));
    const dy = Math.abs(this.player.y - (TRIGGER_Y * TILE + TILE / 2));
    if (dx < TILE * 1.5 && dy < TILE * 1.5) {
      this.triggerPHISorterEncounter('phi-sort-lab', 'phi-sorter-set-2');
    }
  }
}
```

Lab dimensions: 20×15. Lab tech is at (10, 7), results_printout zone at (13, 7). A trigger near the sample area: tile (7, 7) (near the lab counter, distinct from existing interactables).

### Pattern 3: triggerPHISorterEncounter method

Add a new private method in ExplorationScene alongside `triggerEncounter()`:

```typescript
private triggerPHISorterEncounter(encounterId: string, documentSetId: string): void {
  if (this.encounterTriggered) return;
  const alreadyDone = this.registry.get(`encounterResult_${encounterId}`);
  if (alreadyDone) return;

  this.encounterTriggered = true;
  this.paused = true;

  // Anticipation beat (Commandment 2) — subtle screen flash, not breach alert
  this.cameras.main.flash(200, 255, 255, 150, true);
  try { this.sound.play('sfx_interact', { volume: 0.5 }); } catch (_) {}

  const NARRATIVE: Record<string, string> = {
    'phi-sort-reception': "Riley slides a stack of intake forms across the desk. " +
      "'Before these go to the auditor, we need to redact anything that could identify patients. " +
      "Can you sort out what counts as PHI?'",
    'phi-sort-lab': "The lab tech looks up from the centrifuge. " +
      "'I need a second pair of eyes. Some of these sample labels — I'm not sure which details " +
      "we're allowed to include on the external manifest. PHI or not PHI?'",
  };

  this.time.delayedCall(250, () => {
    eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, {
      encounterId,
      narrativeText: NARRATIVE[encounterId] ?? 'Time to sort some records.',
      type: 'phi-sorter',
      sorterConfig: { documentSetId },
    });
  });
}
```

### Pattern 4: UnifiedGamePage encounter phase routing

**Current encounterPhase type:** `'idle' | 'narrative-card' | 'encounter' | 'debrief'`

**Extended type:**
```typescript
type EncounterPhase = 'idle' | 'narrative-card' | 'encounter' | 'phi-sorter' | 'debrief';
```

**narrativeCardData** needs a type field for the confirmation handler to route correctly:
```typescript
const [narrativeCardData, setNarrativeCardData] = useState<{
  narrativeText: string;
  config: BreachDefenseInitData;
  encounterId: string;
  type: 'td' | 'phi-sorter';       // NEW
  sorterConfig?: { documentSetId: string }; // NEW
} | null>(null);
```

**ENCOUNTER_TRIGGERED handler** (existing block, lines 632-639 in UnifiedGamePage.tsx):
```typescript
const onEncounterTriggered = (data: { ... type: 'td' | 'phi-sorter'; sorterConfig?: {...} }) => {
  setNarrativeCardData(data);
  setEncounterPhase('narrative-card');  // unchanged — narrative card always shows first
};
```

**handleConfirmNarrativeCard** (existing, lines 670-674):
```typescript
const handleConfirmNarrativeCard = useCallback(() => {
  if (!narrativeCardData) return;
  if (narrativeCardData.type === 'phi-sorter') {
    setEncounterPhase('phi-sorter');
    // No REACT_LAUNCH_ENCOUNTER needed — PHI sorter is pure React, no Phaser scene
  } else {
    setEncounterPhase('encounter');
    eventBridge.emit(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, { config: narrativeCardData.config });
  }
}, [narrativeCardData]);
```

**Render section** (add after the `encounterPhase === 'encounter'` block):
```typescript
{encounterPhase === 'phi-sorter' && narrativeCardData?.sorterConfig && (
  <PHISorterOverlay
    documentSetId={narrativeCardData.sorterConfig.documentSetId}
    encounterId={narrativeCardData.encounterId}
    onComplete={handleSorterComplete}
  />
)}
```

**handleSorterComplete:**
```typescript
const handleSorterComplete = useCallback((result: {
  encounterId: string;
  correctCount: number;
  totalCount: number;
  scoreContribution: number;
}) => {
  setEncounterResult({
    encounterId: result.encounterId,
    outcome: result.correctCount >= result.totalCount * 0.7 ? 'victory' : 'defeat',
    securityScore: Math.round((result.correctCount / result.totalCount) * 100),
    scoreContribution: result.scoreContribution,
  });
  setEncounterPhase('debrief');
  if (result.scoreContribution > 0) {
    gameState.addScore(result.scoreContribution);
  }
  gameState.recordEncounterResult(result.encounterId, {
    completed: true,
    score: result.correctCount,
    outcome: result.correctCount >= result.totalCount * 0.7 ? 'victory' : 'defeat',
  });
  // Register in Phaser registry so proximity check suppresses re-trigger
  eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.7 });
}, [gameState]);
```

**ExplorationScene registry write on sorter complete** — the registry guard `this.registry.get('encounterResult_phi-sort-reception')` will not be populated unless we write to it after completion. Add to `ENCOUNTER_COMPLETE` handling or add a new `REACT_MARK_ENCOUNTER_DONE` event. Simplest: emit `REACT_RETURN_FROM_ENCOUNTER` with the encounterId and have ExplorationScene write to registry in `onReturnFromEncounter`. Or pass the encounterId in a new event. The planner should pick the cleanest approach — writing to registry from ExplorationScene's existing onReturnFromEncounter with the encounterId payload is recommended.

### Pattern 5: PHISorterOverlay keyboard + DnD

**Keyboard state machine** (all in `PHISorterOverlay.tsx`):
```typescript
const [selectedItemIdx, setSelectedItemIdx] = useState(0);
const [hoveredBucket, setHoveredBucket] = useState<'phi' | 'not_phi' | null>(null);

useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedItemIdx(idx => {
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        return (idx + delta + remainingItems.length) % remainingItems.length;
      });
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setHoveredBucket('not_phi'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setHoveredBucket('phi'); }
    if ((e.key === 'Enter' || e.key === ' ') && hoveredBucket) {
      e.preventDefault();
      handleDrop(remainingItems[selectedItemIdx], hoveredBucket);
    }
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [remainingItems, selectedItemIdx, hoveredBucket]);
```

**Drag state** — use React state not the DnD API drag event object (which cannot be stored in state):
```typescript
const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
```

On `SorterItem`:
```jsx
<div
  draggable
  onDragStart={() => setDraggingItemId(item.id)}
  onDragEnd={() => setDraggingItemId(null)}
  className={`cursor-grab active:cursor-grabbing ...`}
>
```

On `BucketZone`:
```jsx
<div
  onDragOver={e => e.preventDefault()}
  onDrop={() => draggingItemId && handleDrop(draggingItemId, bucketType)}
  className={`... ${isDragTarget ? 'ring-2 ring-white' : ''}`}
>
```

### Anti-Patterns to Avoid

- **Storing drag event object in state:** `e.dataTransfer` is not serializable. Store only the item ID.
- **Global key handlers without cleanup:** Every `window.addEventListener` in a `useEffect` must have a cleanup return that calls `window.removeEventListener`. See ObservationHint.tsx for the correct pattern.
- **Re-triggering encounters:** The `this.encounterTriggered` flag is reset on scene `init()`, meaning it resets on room transition. The Phaser registry guard (`this.registry.get('encounterResult_...')`) is the persistent lock — it must be written after completion. If it's not written, the encounter fires again on re-entry.
- **Modifying Phase 13 shared infrastructure:** `triggerEncounter()`, `onLaunchEncounter()`, `onReturnFromEncounter()`, `handleWakeFromEncounter()` in ExplorationScene must NOT be modified. Add new `triggerPHISorterEncounter()` alongside them.
- **PHI Sorter launching a Phaser scene:** The sorter is pure React. `REACT_LAUNCH_ENCOUNTER` is for BreachDefense only. Do not emit it for the sorter.
- **Sleeping ExplorationScene for the sorter:** The sorter does not need `scene.sleep()` because no Phaser scene is launched in its place. ExplorationScene stays paused (`this.paused = true`) and visible but hidden behind the React overlay (z-index). On sorter complete, `eventBridge.emit(REACT_RETURN_FROM_ENCOUNTER)` wakes it as normal.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom pointer event tracker | HTML5 `draggable` API | Browser handles drag ghost, drop target highlighting, cross-element drop; ~10 lines vs 100+ |
| Keyboard focus trap | Custom tab interception | `window.addEventListener('keydown')` pattern | The game has no traditional tab focus; global key handler on mount/unmount is the established project pattern. No library needed. |
| Encounter score persistence | New localStorage key | `gameState.recordEncounterResult()` + Phaser registry | Both mechanisms already exist and are the canonical pattern. Double-write would cause drift. |
| Animation | CSS-in-JS library | Tailwind animate classes + CSS keyframes in index.css | `animate-bounce`, `animate-pulse`, custom `@keyframes shake` — sufficient for flash/shake effects without a new dependency. |
| NarrativeContextCard | New intro component | Reuse existing `NarrativeContextCard` | Already wired into the encounter phase state machine. Pass sorter-specific text. |
| EncounterDebrief | New results screen | Reuse existing `EncounterDebrief` | Props align: `securityScore` maps to sorting accuracy %, `scoreContribution` maps to score delta. Only HIPAA takeaways text differs. |

---

## Common Pitfalls

### Pitfall 1: Stale Closure on `remainingItems` in Keyboard Handler

**What goes wrong:** The keyboard handler is registered in a `useEffect` with a dependency on `remainingItems`. If the dependency array is wrong, `remainingItems` inside the handler references a stale snapshot, causing wrong item selection after drops.

**Why it happens:** React closures capture the value at registration time.

**How to avoid:** Include `remainingItems`, `selectedItemIdx`, and `hoveredBucket` in the `useEffect` dependency array. The handler is re-registered on every item drop — this is expected and cheap for a list of 6-8 items.

**Warning signs:** Keyboard cycling skips items or selects out-of-bounds indices; `ArrowDown` on the last item wraps to index 2 instead of index 0.

### Pitfall 2: EventBridge Listener Leak

**What goes wrong:** `eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, handler)` registered in `useEffect` without a matching `eventBridge.off()` in the cleanup. On React strict mode double-mount, two handlers fire for every event.

**Why it happens:** Phaser EventEmitter does not deduplicate listeners by reference.

**How to avoid:** Every `eventBridge.on()` must have a paired `eventBridge.off()` in the cleanup function. The existing Phase 13 encounter listener block at UnifiedGamePage lines 631-668 is the correct model.

**Warning signs:** Score updates doubling; narrative card appearing twice; console warnings about multiple handlers.

### Pitfall 3: encounterTriggered Not Suppressing Re-Trigger on Re-Entry

**What goes wrong:** Player leaves Reception, completes it, backtracks, and the PHI Sorter fires again because `this.encounterTriggered` was reset by `init()` (line 117 in ExplorationScene).

**Why it happens:** `this.encounterTriggered = false` is in `init()` which runs on every scene start/room load. The per-room `this.encounterTriggered` flag is session-only. The Phaser registry persists across room transitions within the same session.

**How to avoid:** The `alreadyDone = this.registry.get('encounterResult_phi-sort-reception')` guard handles this. But the registry key must be written on encounter completion. In Phase 13, `BreachDefenseScene` writes to registry directly. For the PHI Sorter (pure React), the registry write must happen via a new event or by the `REACT_RETURN_FROM_ENCOUNTER` handler in ExplorationScene that reads the encounterId from the payload.

**Warning signs:** PHI Sorter fires on every re-entry to Reception even after completion.

### Pitfall 4: ExplorationScene Keyboard Collision with Sorter

**What goes wrong:** Arrow keys pressed during the PHI Sorter are processed by ExplorationScene's `cursors`/`wasd` handlers, moving the hidden player sprite under the overlay.

**Why it happens:** ExplorationScene's `update()` reads `cursors.left.isDown` regardless of overlay state.

**How to avoid:** This is already handled. `this.paused = true` is set in `triggerPHISorterEncounter()` before the event fires. The `update()` method checks `if (this.paused) { setVelocity(0); return; }` (lines 1384-1386 in ExplorationScene). As long as `paused` is set before the overlay renders, there is no conflict.

**Warning signs:** Player moves during sorter interaction; position drifts when Escape is pressed.

### Pitfall 5: NarrativeContextCard Hardcoded "SECURITY ALERT" Header

**What goes wrong:** `NarrativeContextCard` has a hardcoded "SECURITY ALERT" header and red styling. This is jarring for the PHI Sorter, which has a calm "Riley needs help with forms" tone.

**Why it happens:** The component was built specifically for the TD encounter.

**How to avoid:** Either (a) extend `NarrativeContextCard` props with optional `title` and `headerVariant: 'security' | 'info'` fields (small change, keeps it reusable), or (b) create a separate `SorterContextCard` that matches the PHI-sorter narrative tone (blue/teal palette instead of red). Option (b) is safer — it avoids touching Phase 13 infrastructure. Recommended.

### Pitfall 6: HIPAA Content Accuracy — PHI Requires Health Connection

**What goes wrong:** Labeling "hospital street address" as "Not PHI" — correct — but labeling "patient name" without health context as "PHI" — incorrect, because name alone without health information is not PHI under Safe Harbor.

**Why it happens:** Common misconception. HIPAA PHI = identifier PLUS association with health/payment information.

**How to avoid:** Every sorter item must include `explanation` text that mentions the two-part PHI definition: identifier + health connection. In a hospital intake context, health connection is implied for all patient-specific data. Items that are NOT PHI must make clear why (e.g., "hospital address is an organizational detail, not patient health information"). See §4.1 of ENHANCEMENT_BRIEF and HIPAA_TRAINING_FRAMEWORK 1.1 for grounding.

---

## Code Examples

### SorterItem type (from CONTEXT.md, verified against project conventions)

```typescript
// client/src/data/sorterData.ts
// Source: CONTEXT.md §Specific Ideas + 45 CFR §164.514(b)(2)

export type SorterItem = {
  id: string;
  label: string;             // Displayed on the card, e.g. "SSN: 123-45-6789"
  category: 'phi' | 'not_phi';
  identifierType?: string;   // For PHI: one of the 18 (ssn, name, dob, ...)
  explanation: string;       // Shown on incorrect drop (explains the rule)
};

export type SorterDocumentSet = {
  id: string;
  act: 1 | 2 | 3;
  triggerLocation: 'reception' | 'lab' | 'medical_records';
  npcId: string;
  contextCard: { title: string; body: string };
  items: SorterItem[];
  passingAccuracy: number;   // 0.0–1.0, default 0.7
};
```

### The 18 HIPAA Safe Harbor Identifiers (45 CFR §164.514(b)(2))

The 18 identifiers that must be removed for data to be considered de-identified:

1. Names
2. Geographic data smaller than state (street address, city, county, zip, lat/long)
3. All elements of dates (except year) for individuals — DOB, admission/discharge, death dates, ages 90+
4. Phone numbers
5. Fax numbers
6. Email addresses
7. Social Security Numbers
8. Medical record numbers
9. Health plan beneficiary numbers
10. Account numbers
11. Certificate/license numbers
12. Vehicle identifiers and serial numbers (including license plates)
13. Device identifiers and serial numbers
14. Web URLs
15. IP addresses
16. Biometric identifiers (fingerprints, voice prints)
17. Full-face photographs and comparable images
18. Any other unique identifying number, characteristic, or code

**Critical nuance for item content:** ZIP code — first 3 digits are acceptable under Safe Harbor if the geographic unit contains >20,000 people. A 5-digit specific ZIP is an identifier; a 3-digit ZIP prefix may not be. This is a legitimate Act 3 edge case item.

**Not on the list (common test items):** hospital name/address (organizational, not patient identifier), room temperature, procedure codes without patient connection, aggregate statistics.

### Document Sets outline

**Set 1 — Act 1, Reception ("obvious"):** 6 items
```
PHI items:
- "Patient Name: Maria Gonzalez"           (identifier: name)
- "SSN: 447-23-0891"                       (identifier: ssn)
- "Date of Birth: 03/14/1968"              (identifier: dob)
- "Home Address: 147 Birchwood Dr"         (identifier: street_address)

Not PHI items:
- "Hospital Address: 800 Valley Blvd"      (organizational address, not patient)
- "Room temperature: 68°F"                 (environmental, no health/identity link)
```

**Set 2 — Act 2, Lab ("subtle"):** 8 items — the less-obvious identifiers
```
PHI items:
- "Device serial: MRI-3847-2291"           (identifier: device_serial)
- "IP Address: 192.168.4.107"             (identifier: ip_address — patient portal session)
- "Biometric: Left index fingerprint scan" (identifier: biometric)
- "ICD-10: F33.1 (Major Depressive Disorder) — patient #4821" (diagnosis with record number)
- "License plate: 7TBZ-483 (vehicle used in transport)"  (identifier: vehicle)

Not PHI items:
- "ICD-10 code: F33.1"                    (diagnosis code alone, no patient link = NOT PHI)
- "Lab test type: complete blood count"   (procedure category, no patient connection)
- "Sample volume: 5mL"                    (measurement, no identifier)
```

**Set 3 — Act 3 / stretch ("edge cases"):** 5 items — Safe Harbor nuance
```
PHI items:
- "ZIP code: 90210"                        (5-digit ZIP = identifier)
- "Admission month + year: March 2024"     (full date element — month+year together = identifier)
- "Age: 91 years"                          (ages 90+ are identifiers per §164.514(b)(2))

Not PHI items:
- "ZIP prefix: 902"                        (3-digit ZIP with >20K population = acceptable)
- "Year only: 2024"                        (year without other date elements = NOT identifier)
```

### EventBridge extension (minimal)

```typescript
// client/src/phaser/EventBridge.ts — add nothing new if using type field
// OR add one constant for clarity:
ENCOUNTER_TRIGGERED_SORTER: 'encounter:triggered:sorter',  // alternative approach
```

Recommended: keep `ENCOUNTER_TRIGGERED` and add `type` to payload. This minimizes changes to the existing handler in UnifiedGamePage.

### CSS animations for feedback (add to index.css or tailwind config)

```css
/* Correct drop: green flash */
@keyframes flash-green {
  0%, 100% { background-color: transparent; }
  25% { background-color: rgba(34, 197, 94, 0.4); }
  50% { background-color: rgba(34, 197, 94, 0.6); }
  75% { background-color: rgba(34, 197, 94, 0.3); }
}

/* Incorrect drop: red shake */
@keyframes shake-red {
  0%, 100% { transform: translateX(0); background-color: rgba(239, 68, 68, 0.3); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
```

Apply via `className={`${isFlashing ? 'animate-[flash-green_0.4s_ease-out]' : ''}`}` using Tailwind's arbitrary animation syntax.

---

## Existing Files: What Changes, What Stays, What's New

### Files to CREATE

| File | Purpose | Notes |
|------|---------|-------|
| `client/src/data/sorterData.ts` | All 3 document sets (SorterDocumentSet[] constants) | TS not JSON — CLAUDE.md mandates TS for game data constants |
| `client/src/components/phi-sorter/PHISorterOverlay.tsx` | Top-level encounter component — state machine, keyboard, drag orchestration | Split from subcomponents if >300 LOC |
| `client/src/components/phi-sorter/SorterItem.tsx` | Draggable item card | `draggable` HTML attr, onDragStart handler |
| `client/src/components/phi-sorter/BucketZone.tsx` | PHI / Not PHI drop target | onDragOver + onDrop, keyboard highlight state |

Optional: `SorterContextCard.tsx` if the planner opts for a new card instead of extending NarrativeContextCard.

### Files to MODIFY

| File | Change | Why |
|------|--------|-----|
| `client/src/phaser/scenes/ExplorationScene.ts` | Add `triggerPHISorterEncounter()` method + proximity check block for reception + lab rooms | Add new trigger; copy IT Office pattern exactly |
| `client/src/phaser/EventBridge.ts` | Add `type` field documentation to ENCOUNTER_TRIGGERED comment (or add new event constant) | Contract extension |
| `client/src/pages/UnifiedGamePage.tsx` | Extend `EncounterPhase` type, `narrativeCardData` type, `handleConfirmNarrativeCard`, add `PHISorterOverlay` render branch, add `handleSorterComplete` | Route PHI Sorter encounters through the overlay |
| `client/src/lib/saveData.ts` | No structural change needed — `encounterResults` in the extended save (written by `useGameState`) already handles this | VERIFY: `encounterResults` is written by `useGameState` into the save blob at line 151 |
| `client/src/phaser/scenes/BootScene.ts` | Preload 2 new SFX: `sfx_sorter_correct` and `sfx_sorter_wrong` (from Kenney `confirmation_001.ogg` and `error_001.ogg`) | New audio assets need preloading |

Optional: `client/src/data/roomData.json` — if the planner adds a new NPC `riley_sorter_trigger` or zone to reception/lab to provide a visible floor indicator for the trigger zone. This is optional polish; the proximity check works without a visual marker.

### Files to NOT TOUCH (Phase 13 Infrastructure)

| File | Reason |
|------|--------|
| `client/src/components/breach-defense/NarrativeContextCard.tsx` | Do not modify — create `SorterContextCard.tsx` instead if needed |
| `client/src/components/breach-defense/EncounterDebrief.tsx` | Can reuse as-is; its props map cleanly to sorter results |
| `client/src/components/breach-defense/EncounterGameUI.tsx` | TD-specific HUD; not used by sorter |
| `ExplorationScene.ts::triggerEncounter()` | Do not modify — add `triggerPHISorterEncounter()` alongside |
| `ExplorationScene.ts::onLaunchEncounter()` | Do not modify — sorter does not call `scene.sleep()` |
| `ExplorationScene.ts::onReturnFromEncounter()` | Can reuse as-is; `REACT_RETURN_FROM_ENCOUNTER` still wakes the scene |
| `useGameState.ts` | No changes needed; `addScore()` and `recordEncounterResult()` already exist with the right signatures |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate React routes per game mode | Single `/` route, encounter lifecycle via scene sleep/wake | Phase 12-13 (v2.0) | PHI Sorter must use the encounter lifecycle, not a new route |
| BreachDefense as standalone Phaser scene | BreachDefense as encounter, ExplorationScene sleeps | Phase 13 | PHI Sorter is the first encounter that is PURELY React (no Phaser scene launched) — slight architecture variation from TD |
| Per-game fragmented save state | Unified `pq:save:v2` schema with `encounterResults` | Phase 11 | PHI Sorter results go into `encounterResults[encounterId]` — no schema changes needed |

---

## Open Questions

1. **Registry write on sorter completion**
   - What we know: The IT Office TD encounter writes to `this.registry` inside BreachDefenseScene on GAMEOVER/VICTORY events. The PHI Sorter has no Phaser scene — the registry write must happen from React side.
   - What's unclear: The cleanest path — emit a new `REACT_MARK_ENCOUNTER_DONE` event that ExplorationScene listens to? Or pass encounterId in `REACT_RETURN_FROM_ENCOUNTER` payload (currently it carries no payload)?
   - Recommendation: Extend `REACT_RETURN_FROM_ENCOUNTER` with an optional `encounterId` payload. ExplorationScene's `onReturnFromEncounter` already runs on dismissal — add `if (data?.encounterId) this.registry.set('encounterResult_' + data.encounterId, true)` there.

2. **NarrativeContextCard: extend or replace?**
   - What we know: Current card has hardcoded "SECURITY ALERT" header and red styling — wrong tone for Riley's friendly form-hand-off.
   - What's unclear: Whether to add optional props to NarrativeContextCard (touching Phase 13 code) or build SorterContextCard separately.
   - Recommendation: Build `SorterContextCard.tsx` (new file, ~60 LOC). Avoids touching Phase 13 infrastructure. Uses teal/blue palette to distinguish encounter type visually.

3. **Act guard on trigger zones**
   - What we know: Phase 14 act state is in `useGameState.state.currentAct`. ExplorationScene doesn't currently read act state for trigger decisions.
   - What's unclear: Should the Lab trigger only fire in Act 2? Reception only in Act 1? Or can any trigger fire at any act?
   - Recommendation: Reception trigger fires when `encounterResult_phi-sort-reception` is not set (same as IT Office pattern — no act gating). Players who reach Reception are in Act 1 by definition (linear unlock chain). Lab trigger similarly needs no explicit act gate. The progression system handles ordering implicitly.

---

## Wave Design / Encounter Pacing

Unlike the TD encounter, there are no waves. The sorter is a single continuous encounter with all items presented up front. Pacing notes:

- Present all 6-8 items simultaneously in a scrollable or grid list (not one-by-one). Players should be able to see the full set before sorting.
- Items disappear from the pile as they are sorted.
- "Completion anticipation beat" (Commandment 2): When the last item is dropped, add a 600ms pause before showing the debrief. Use `setTimeout(() => onComplete(...), 600)`. This mirrors the Zelda chest beat.
- No timer. Encounter self-completes when all items are sorted.

---

## Sources

### Primary (HIGH confidence)
- Direct read of `client/src/phaser/EventBridge.ts` — BRIDGE_EVENTS constants and exact payload shapes
- Direct read of `client/src/pages/UnifiedGamePage.tsx` — encounterPhase state machine, ENCOUNTER_TRIGGERED/COMPLETE handlers, narrativeCardData shape
- Direct read of `client/src/phaser/scenes/ExplorationScene.ts` — IT Office encounter trigger pattern at lines 1495-1504, triggerEncounter() method lines 1836-1869, sleep/wake lifecycle
- Direct read of `client/src/hooks/useGameState.ts` — addScore(), recordEncounterResult(), encounterResults shape
- Direct read of `client/src/lib/saveData.ts` — SaveDataV2 interface, confirming encounterResults not in SaveDataV2 (it's in the extended fields written by useGameState at line 151)
- Direct read of `client/src/components/breach-defense/NarrativeContextCard.tsx` and `EncounterDebrief.tsx` — exact prop interfaces
- Direct read of `package.json` — confirmed no DnD library present
- Direct read of `attached_assets/audio/kenney_interface-sounds/Audio/` — confirmed `confirmation_001.ogg` and `error_001.ogg` available for new SFX
- Direct read of `client/src/data/roomData.json` — reception NPC/zone/item positions, lab positions
- 45 CFR §164.514(b)(2) — Safe Harbor de-identification standard (18 identifiers)

### Secondary (MEDIUM confidence)
- `.planning/phases/13-encounter-integration/13-RESEARCH.md` — confirmed encounter lifecycle architecture decisions
- `.planning/STATE.md` — confirmed Phase 13 decisions: `Math.round((securityScore / 100) * 12)` formula, IT Office tile (9,6), registry pattern
- `.planning/HIPAA_TRAINING_FRAMEWORK.md` — confirmed PHI definition coverage (STRONG), 18 identifiers coverage (ADEQUATE), sorter addresses both

### Tertiary (LOW confidence — needs verification at plan time)
- Tile coordinates for PHI Sorter trigger zones (reception (10,6) and lab (7,7)) are planner-discretion estimates based on NPC/zone positions in roomData.json. The planner should verify no obstacle conflicts before hardcoding.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed no new packages needed; HTML5 DnD sufficient
- Architecture (encounter lifecycle reuse): HIGH — directly inspected all integration points
- Architecture (discriminator approach): HIGH — minimal change to UnifiedGamePage
- HIPAA content: HIGH — 18 identifiers from primary CFR source; document sets reviewed against framework
- Pitfalls: HIGH — stale closure and listener leak are known React patterns; encounter re-trigger is confirmed by code inspection
- Tile coordinates: LOW — estimates only; planner must verify against obstacle grid

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (stable stack; no fast-moving dependencies)
