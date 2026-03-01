# Phase 5: PrivacyQuest Onboarding - Research

**Researched:** 2026-03-01
**Domain:** Phaser 3 tweens, React modal composition, localStorage persistence, EventBridge communication
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Intro Modal Content & Style**
- Reuse the existing BreachDefense `TutorialModal` component (pink header, black borders, green CTA, retro pixel-art frame)
- Medium-length text: controls (WASD to move, Space to interact, ESC to exit) plus one sentence of context ("You're a new employee at HIPAA General...")
- Text-only control descriptions — no styled keyboard key icons
- CTA button text: "Start exploring →" (instead of BreachDefense's "Got it! Let's go →")

**NPC Highlight Effect**
- Scale pulse tween: NPC gently oscillates 1.0 → 1.15 → 1.0 on a loop (Phaser tween, yoyo + repeat -1)
- Visual pulse only — no floating text or arrow indicator
- Targets the first NPC in the room's data array (roomData.json NPC order determines priority)
- Dismisses when the player interacts with that NPC (presses Space), not on proximity or first movement

**First-Visit Scope**
- Intro modal shows once ever, on the very first PrivacyQuest room entry — single localStorage flag
- NPC pulse triggers per-room: first entry to each room pulses the first NPC until interacted with
- "Play Again" (localStorage.clear()) resets both modal flag and per-room pulse flags naturally
- Add a small "?" help icon in the PrivacyQuest HUD that re-shows the controls modal on demand

### Claude's Discretion
- Exact modal title text
- Help icon placement and styling within existing HUD layout
- localStorage key naming for onboarding flags
- Scale pulse speed/easing curve
- Whether to pause the Phaser scene behind the intro modal (likely yes, matching BreachDefense pattern)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBD-01 | First-visit intro modal explains controls (WASD/Space/ESC) in PrivacyQuest | TutorialModal reuse pattern; localStorage flag; scene pause via `this.paused` flag; EventBridge signal to dismiss |
| ONBD-02 | Pulsing indicator highlights first available NPC on room entry | Phaser tween `yoyo: true, repeat: -1` on NPC sprite scale; interactables array index 0 for first NPC; tween kill on interaction |
</phase_requirements>

## Summary

Phase 5 is a low-complexity, high-polish phase that adds two first-time player onboarding mechanisms to PrivacyQuest. The core technical work involves: (1) a one-time React modal using the existing `TutorialModal` component, gated by a localStorage flag, and (2) a per-room Phaser scale-pulse tween on the first NPC sprite, stopped when that NPC is interacted with.

All the building blocks are already in place. The `TutorialModal` component is import-ready and already handles the visual style (pink header, black border, green CTA). The `ExplorationScene` already tracks all interactables in a typed array (`this.interactables: InteractableData[]`), already has a `this.paused` flag for pausing gameplay behind modals, and already cleans up tweens correctly. The `PrivacyQuestPage` already manages multiple modal states with `&&` conditional rendering and uses EventBridge to coordinate with the Phaser scene. LocalStorage key naming follows a consistent `camelCase` pattern across ~10 existing keys.

The main design care areas are: (a) the modal must pause the Phaser scene so the player does not walk during reading, (b) the pulse tween reference must be stored to kill it cleanly on interaction, and (c) the EventBridge listener for NPC pulse dismissal needs a matching `off()` in `shutdown()` to prevent leaks.

**Primary recommendation:** Implement in two tasks — Task 1: intro modal + help icon in React; Task 2: NPC pulse tween in ExplorationScene.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.87+ | Scale tween on NPC sprite (`this.tweens.add`) | Already the game engine; owns all canvas animation |
| React 18 | 18.x | Intro modal state, localStorage reads, help icon | Already owns all HUD/overlay UI |
| TutorialModal | (internal) | Modal shell (pink header, retro frame, green CTA) | Already exists at `client/src/components/breach-defense/TutorialModal.tsx`, reuse avoids visual drift |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| EventBridge | (internal) | Signal scene to pause/resume when modal shows/closes | Already the established React↔Phaser channel; used for every existing overlay interaction |
| localStorage (browser API) | native | Persist `pq:onboarding:seen` and `pq:room:{roomId}:npcPulsed` flags | Matches existing PrivacyQuest persistence pattern; reset for free on `localStorage.clear()` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TutorialModal reuse | New modal component | No benefit — TutorialModal already has the correct style; a new component would introduce visual inconsistency |
| localStorage flag | React state only | State resets on reload; localStorage is required for "shows once ever" behavior |
| Scale tween on sprite | Outline glow / color tint | Scale pulse is simpler (one tween property), avoids shader/graphics object complexity; matches boss text pulse already in scene |

**Installation:**
```bash
# No new packages required — all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure

No new files required. All changes touch existing files:

```
client/src/
├── pages/
│   └── PrivacyQuestPage.tsx       # Add: intro modal state, localStorage flag, help icon, EventBridge onboarding events
├── phaser/scenes/
│   └── ExplorationScene.ts        # Add: npcPulseTween field, startNpcPulse(), stopNpcPulse(), EventBridge listener
└── phaser/
    └── EventBridge.ts             # Add: EXPLORATION_NPC_INTERACTED_FIRST (Phaser→React signal to dismiss pulse)
```

Note: `TutorialModal` is imported from `client/src/components/breach-defense/TutorialModal.tsx` as-is.

### Pattern 1: TutorialModal Reuse with Custom CTA Text

**What:** Import the existing TutorialModal into PrivacyQuestPage and supply a custom `onAcknowledge` that sets local state + emits the EventBridge resume signal.

**When to use:** Any time a full-screen text modal is needed in PrivacyQuest that matches the BreachDefense visual style.

**Example:**
```typescript
// In PrivacyQuestPage.tsx
import { TutorialModal } from '../components/breach-defense/TutorialModal';

const [showIntroModal, setShowIntroModal] = useState(() => {
  return !localStorage.getItem('pq:onboarding:seen');
});

const handleIntroModalDismiss = useCallback(() => {
  localStorage.setItem('pq:onboarding:seen', '1');
  setShowIntroModal(false);
  eventBridge.emit(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE);
}, []);

// In JSX (inside the exploration render block):
{showIntroModal && (
  <TutorialModal
    title="Welcome to HIPAA General"
    description={`You're a new employee at HIPAA General Hospital.\n\nWASD or Arrow Keys — Move\nSPACE — Talk / Interact\nESC — Exit room`}
    onAcknowledge={handleIntroModalDismiss}
    type="info"
  />
)}
```

**Note on CTA button text:** `TutorialModal` hardcodes "Got it! Let's go →". The user decision requires "Start exploring →". This requires a one-line edit to `TutorialModal.tsx` to either accept a `ctaText` prop (preferred, keeps the component flexible) or change the hardcoded text directly.

### Pattern 2: Scene Pause Behind Intro Modal

**What:** Set `this.paused = true` in `ExplorationScene` when the modal appears, then resume on `REACT_DIALOGUE_COMPLETE`.

**When to use:** Any time a React full-screen modal should freeze Phaser gameplay (player cannot move while reading).

**Implementation:** The intro modal must trigger scene pause immediately on room entry, before the player can move. The cleanest approach: emit a new `REACT_ONBOARDING_MODAL_SHOW` event from ExplorationScene's `create()` to React, which then sets `showIntroModal = true` and emits back `REACT_PAUSE_EXPLORATION` → scene sets `this.paused = true`.

**Simpler alternative (verified against existing code):** Check the localStorage flag *inside the page* before the scene starts. If the flag is absent, set `showIntroModal = true` immediately in React state — the modal renders over the canvas before the scene's first frame is meaningful. The scene's existing `paused` flag is already guarded in `update()`: setting `this.paused = true` from a new EventBridge listener is the proven pattern (identical to how dialogue pauses the scene).

```typescript
// ExplorationScene.create() — add after existing EventBridge listener registration:
eventBridge.on(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);

private onPauseFromModal = () => { this.paused = true; };

// shutdown() — add matching off():
eventBridge.off(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);
```

**Alternative (discovered from existing pattern):** Because `REACT_DIALOGUE_COMPLETE` already resumes the scene (`this.paused = false`), the intro modal can reuse this same event for dismissal, avoiding a new event constant. The pause-on-show can be issued via a new `REACT_PAUSE_EXPLORATION` event, or the page can pass `paused: true` as part of the scene start data if the modal flag is active.

### Pattern 3: NPC Scale Pulse Tween (Phaser)

**What:** After NPCs are created in `ExplorationScene.create()`, find the first NPC interactable and add a scale tween on its sprite.

**When to use:** Per-room, on first entry. Dismissed on first interaction with that NPC.

**Example:**
```typescript
// In ExplorationScene — new field:
private npcPulseTween: Phaser.Tweens.Tween | null = null;
private npcPulseTarget: InteractableData | null = null;

// After the NPC creation loop in create():
const firstNpc = this.interactables.find(ia => ia.type === 'npc');
const roomPulseKey = `pq:room:${this.room.id}:npcPulsed`;
if (firstNpc && !localStorage.getItem(roomPulseKey)) {
  this.npcPulseTarget = firstNpc;
  this.npcPulseTween = this.tweens.add({
    targets: firstNpc.sprite,
    scaleX: 1.15,
    scaleY: 1.15,
    duration: 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

// In triggerInteraction(), before emitting to React:
private stopNpcPulse(ia: InteractableData) {
  if (this.npcPulseTarget === ia && this.npcPulseTween) {
    this.npcPulseTween.stop();
    this.npcPulseTween = null;
    ia.sprite.setScale(1); // reset to neutral
    localStorage.setItem(`pq:room:${this.room.id}:npcPulsed`, '1');
    this.npcPulseTarget = null;
  }
}
```

### Pattern 4: Help Icon in PrivacyQuest HUD

**What:** A small "?" button below the Phaser canvas that re-opens the controls modal on demand.

**When to use:** Always visible during exploration mode (not in hub or dialogue).

**Example (inside the exploration render block, near existing HUD):**
```tsx
// In PrivacyQuestPage.tsx — add a re-show handler:
const handleShowHelpModal = useCallback(() => {
  setShowIntroModal(true);
  eventBridge.emit(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION);
}, []);

// In JSX — alongside KnowledgeTracker / ChecklistUI:
<button
  onClick={handleShowHelpModal}
  className="text-[8px] text-gray-400 hover:text-white border border-gray-600 px-2 py-1 transition-colors"
  style={{ fontFamily: '"Press Start 2P"' }}
  title="Show controls"
>
  ?
</button>
```

### Anti-Patterns to Avoid

- **Tween leak on scene restart:** Always store the tween reference and call `tween.stop()` before the tween target sprite is destroyed. ExplorationScene already does `this.tweens.killTweensOf(ia.sprite)` for items — same pattern applies to the NPC pulse.
- **EventBridge listener leak:** Every `eventBridge.on(...)` added in `create()` must have a matching `eventBridge.off(...)` in `shutdown()`. The existing codebase consistently does this (confirmed in ExplorationScene and BreachDefenseScene `shutdown()` methods).
- **Modal without scene pause:** Opening a full-screen React modal without pausing the Phaser scene lets the player move while reading. BreachDefense uses `this.gameState = 'PAUSED'` pattern; ExplorationScene uses `this.paused = true`. Both must be set before the modal renders.
- **Intro modal on every room entry:** The localStorage flag must be checked at page-level state initialization (the `useState(() => ...)` lazy initializer pattern already used for all 10 existing flags in PrivacyQuestPage.tsx), not inside the per-room setup effect.
- **Scale tween without reset:** Stopping a tween leaves the sprite at its last interpolated scale. Always call `sprite.setScale(1)` after `tween.stop()` to return to neutral.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal UI shell | Custom modal component for PrivacyQuest | `TutorialModal` (already exists) | Same visual design, one source of truth, no drift |
| Persistent flag storage | Custom IndexedDB or cookie logic | `localStorage.getItem/setItem` | Already the project-wide pattern; reset path (clear) is already wired |
| Pulse animation | Canvas draw loop / manual `setInterval` scale update | `this.tweens.add({ yoyo: true, repeat: -1 })` | Phaser tween system handles frame-rate-independent interpolation, pause/resume, cleanup |
| Tween easing | Custom cubic bezier calculation | `ease: 'Sine.easeInOut'` | Built into Phaser; matches existing item bob tweens in scene |

**Key insight:** Every primitive needed for this phase already exists in the codebase. The work is wiring them together in the right order, not building new capabilities.

## Common Pitfalls

### Pitfall 1: Intro Modal Renders But Scene Isn't Paused Yet

**What goes wrong:** The modal appears, but the player can still move (arrow keys work) because `this.paused` is only set after a round-trip through EventBridge.

**Why it happens:** React renders synchronously, but the EventBridge emit → Phaser handler is asynchronous across the game loop. If the scene starts and the player presses a key before the pause signal arrives, movement occurs.

**How to avoid:** Emit the pause signal immediately when the scene's `create()` finishes (or pass `initiallyPaused: true` in the scene start data). The simplest approach: the intro modal state is derived from localStorage before the scene starts — so React can emit `REACT_PAUSE_EXPLORATION` in the same `useEffect` that starts the scene, guaranteeing the pause arrives before the first `update()` frame the player could interact with.

**Warning signs:** Player character moves during the intro modal.

### Pitfall 2: NPC Pulse Tween Not Cleaned Up On Room Exit

**What goes wrong:** Player exits the room while the pulse tween is running. On next room entry, the old tween reference is stale (the sprite it targeted is destroyed), causing a `TypeError` or ghost tween.

**Why it happens:** `ExplorationScene.init()` resets most state but doesn't explicitly kill tweens — Phaser's `this.tweens` are bound to the scene and are cleaned up when the scene restarts, but the private reference `this.npcPulseTween` still points to the old (now invalid) tween object.

**How to avoid:** In `init()`, add:
```typescript
if (this.npcPulseTween) {
  this.npcPulseTween.stop();
  this.npcPulseTween = null;
}
this.npcPulseTarget = null;
```

**Warning signs:** Console error about destroyed game objects during tween update.

### Pitfall 3: CTA Button Text Is Hardcoded in TutorialModal

**What goes wrong:** `TutorialModal` renders "Got it! Let's go →" instead of "Start exploring →".

**Why it happens:** The component has a hardcoded string for the button (confirmed by reading `TutorialModal.tsx` line 33: `Got it! Let's go →`).

**How to avoid:** Add a `ctaText?: string` prop with a default of `"Got it! Let's go →"` to maintain backward compatibility with BreachDefense usage, then pass `ctaText="Start exploring →"` from PrivacyQuestPage.

**Warning signs:** Wrong button text visible in the intro modal.

### Pitfall 4: Per-Room Pulse Flag Uses Wrong Key Format

**What goes wrong:** Pulse reappears on every room visit, or never dismisses in subsequent rooms.

**Why it happens:** Using a static key (`pq:npcPulsed`) instead of a room-scoped key means all rooms share one flag. The room ID must be included in the key.

**How to avoid:** Key format: `pq:room:${room.id}:npcPulsed`. This matches the existing pattern of room-scoped keys already in PrivacyQuestPage (`resolvedGates_${currentRoomId}`, `unlockedNpcs_${currentRoomId}`).

**Warning signs:** Pulse either never reappears in new rooms (static key, set by first room) or always reappears (wrong flag being checked).

### Pitfall 5: Help Icon Triggers Intro Modal But Doesn't Pause Scene

**What goes wrong:** Player clicks "?" during exploration, modal appears, player can still move.

**Why it happens:** The help icon handler sets `showIntroModal = true` but forgets to emit the pause signal.

**How to avoid:** The help icon click handler must always emit `REACT_PAUSE_EXPLORATION` alongside setting state. The dismiss handler (shared with first-time show) must always emit `REACT_DIALOGUE_COMPLETE`.

## Code Examples

Verified patterns from existing codebase:

### localStorage Flag — Lazy useState Initializer (PrivacyQuestPage.tsx pattern)
```typescript
// Source: existing PrivacyQuestPage.tsx lines 56-84 (confirmed by reading file)
const [showIntroModal, setShowIntroModal] = useState(() => {
  return !localStorage.getItem('pq:onboarding:seen');
});
```

### Existing NPC Loop in ExplorationScene (where pulse code goes)
```typescript
// Source: ExplorationScene.ts lines 173-197 (confirmed by reading file)
for (const npc of room.npcs) {
  const texKey = npcTextureKey(npc.id);
  const sprite = this.add.sprite(npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2, texKey);
  sprite.setDepth(25);
  // ... completed/boss logic ...
  this.interactables.push({ type: 'npc', id: npc.id, data: npc, sprite });
}
// ADD AFTER LOOP: find first NPC, start pulse if flag absent
```

### Tween with yoyo + repeat (confirmed pattern from ExplorationScene items, boss text)
```typescript
// Source: ExplorationScene.ts lines 144-153 (item bob tween)
this.tweens.add({
  targets: sprite,
  y: sprite.y - 4,
  duration: 600,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.easeInOut',
});
// Boss text uses: alpha tween with yoyo + repeat -1 (lines 192-193)
// Scale tween follows same pattern with scaleX/scaleY properties
```

### EventBridge On/Off Pattern (ExplorationScene.ts lines 267-269, 344-346)
```typescript
// Source: ExplorationScene.ts — confirmed on/off pair in create() / shutdown()
// create():
eventBridge.on(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
// shutdown():
eventBridge.off(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
```

### Existing TutorialModal Props Interface (TutorialModal.tsx lines 6-10)
```typescript
// Source: client/src/components/breach-defense/TutorialModal.tsx (confirmed by reading)
interface TutorialModalProps {
  title: string;
  description: string;
  onAcknowledge: () => void;
  type?: 'info' | 'threat' | 'tower';
  // ctaText?: string  <-- NEEDS TO BE ADDED for "Start exploring →"
}
```

### Existing EventBridge Pause via `this.paused` (ExplorationScene.ts lines 272-279)
```typescript
// Source: ExplorationScene.ts update() — confirmed reading file
update() {
  if (this.paused) {
    const pauseBody = this.player.body as Phaser.Physics.Arcade.Body;
    pauseBody.setVelocity(0);
    this.player.anims.stop();
    this.player.setTexture(this.lastFacingTexture);
    return;
  }
  // ... rest of update
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Phaser `createEmitter()` | `this.add.particles(x, y, key, config)` | Already known from Phase 3 — not relevant here (no particles in this phase) |
| Separate tween target x/y | `scaleX` and `scaleY` properties | Both work in Phaser 3.87; using both ensures uniform scale pulse |

**Deprecated/outdated:**
- None relevant to this phase. Tweens, localStorage, and EventBridge patterns are stable.

## Open Questions

1. **New BRIDGE_EVENTS constants needed**
   - What we know: Need at minimum a `REACT_PAUSE_EXPLORATION` event to pause the scene behind the intro modal. `REACT_DIALOGUE_COMPLETE` could be reused for dismissal (it already sets `this.paused = false`).
   - What's unclear: Whether to add a dedicated `REACT_PAUSE_EXPLORATION` constant or reuse an existing one.
   - Recommendation: Add `REACT_PAUSE_EXPLORATION` to `BRIDGE_EVENTS` for clarity (consistent naming, avoids semantic confusion of "dialogue complete" when no dialogue occurred). Reuse `REACT_DIALOGUE_COMPLETE` for the dismissal signal since it already does exactly the right thing (`this.paused = false`).

2. **Help icon placement**
   - What we know: HUD below the canvas currently has `KnowledgeTracker`, `ChecklistUI`, `RoomProgressHUD`, and a control hint paragraph (`WASD or Arrow Keys to move • SPACE to interact • ESC to exit room`).
   - What's unclear: Whether to place the "?" next to the existing control hint (since they're related) or in the `flex items-center gap-6` row with the trackers.
   - Recommendation: Place the "?" button inline with the existing control hint paragraph at the bottom of the exploration view — clicking "?" is an alternative to reading the text, so co-location makes sense. Style as a small bordered button in the same `"Press Start 2P"` font.

3. **Modal timing relative to scene start**
   - What we know: Scene start is deferred 100ms via `setTimeout` in the `useEffect` (PrivacyQuestPage.tsx line 175). The intro modal state is initialized from localStorage before that timer fires.
   - What's unclear: Does the 100ms delay mean the modal visually appears before any Phaser frame renders, avoiding the "player moves before pause" pitfall?
   - Recommendation: Yes — React renders the modal on the same synchronous render pass as the state initialization. The scene pause emit should still be sent for correctness (defense in depth), but the timing gap is not a real risk given the 100ms scene start delay.

## Sources

### Primary (HIGH confidence)
- `client/src/phaser/scenes/ExplorationScene.ts` — Confirmed: `interactables` array structure, NPC creation loop location, `this.paused` flag pattern, tween patterns (item bob, boss text alpha), `shutdown()` off pattern, `init()` reset location
- `client/src/pages/PrivacyQuestPage.tsx` — Confirmed: all localStorage keys (~10 existing), lazy `useState` initializer pattern, `&&` conditional modal rendering, EventBridge listener registration/cleanup pattern, HUD structure
- `client/src/phaser/EventBridge.ts` — Confirmed: all existing `BRIDGE_EVENTS` constants, what events exist and what would need to be added
- `client/src/components/breach-defense/TutorialModal.tsx` — Confirmed: props interface, hardcoded CTA text, visual style (pink header, green CTA, black borders)
- `client/src/data/roomData.json` — Confirmed: NPC array structure (`npcs[0]` is always the first NPC; "riley" is first in reception room), `room.id` field available for localStorage key scoping
- `.planning/config.json` — Confirmed: `nyquist_validation` not present (key is `workflow.verifier`), so Validation Architecture section is omitted

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Confirmed: `this.paused = true/false` is the established ExplorationScene pause pattern; EventBridge listener leak is a documented concern requiring matching `off()` calls

### Tertiary (LOW confidence)
- None — all findings verified directly from codebase files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present, no new dependencies
- Architecture: HIGH — patterns confirmed by reading actual source files; implementation locations are exact
- Pitfalls: HIGH — identified from reading the specific code paths (tween cleanup in `init()`, hardcoded CTA text, localStorage key scoping)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain — no fast-moving dependencies)
