# Phase 15: Polish and Completion - Research

**Researched:** 2026-03-27
**Domain:** Phaser 3 particle/tween VFX, React HUD design, hallway environmental storytelling, completion tracking
**Confidence:** HIGH

---

## Summary

Phase 15 is the final polish layer for v2.0. It has three distinct concerns: (1) environmental storytelling content placed in hallway connectors between departments, (2) a department completion fanfare sequence (Phaser VFX + chime + persistent badge), and (3) a persistent progress breadcrumb HUD showing department completion and current act.

The good news: almost everything needed already exists. The particle system, tween patterns, GameBanner component, NotificationToast, RoomProgressHUD, score-delta indicator, and all sound keys are built and working. The gap is wiring — creating hallway-connector data, detecting per-department completion events at the right moment, and surfacing a cross-room breadcrumb view alongside the existing per-room HUD.

The challenge is sequencing. Phase 15 depends on Phase 14 (act system) being complete, so act state will exist in game state. The breadcrumb HUD needs that act state. Environmental content needs to know which act the player is in to select the correct bulletin-board variant.

**Primary recommendation:** Build in three independent tasks — (1) hallway connector content data + rendering, (2) fanfare sequence triggered from existing completion logic, (3) breadcrumb HUD React component — each deliverable without the others being complete.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NARR-06 | Environmental storytelling in hallway connectors — bulletin boards, ambient details that shift per act | Hallway connector data structure in roomData.json; ExplorationScene renders interactionZones and educationalItems; `roomId` branching for floor/wall colors exists as precedent for per-room variation |
| NARR-07 | Per-department completion fanfare — visual flourish + chime + badge when all NPCs/zones/items completed | `checkRoomCompletion()` already exists in PrivacyQuestPage; `GameBanner` component ready; `sfx_interact`/`sfx_wave_start` available; particle emitter pattern documented below; badge can be a Phaser graphics checkmark persistent on door sprite |
| NARR-08 | Progress breadcrumb HUD showing department completion status and current act | `RoomProgressHUD` is per-room only; a new cross-room breadcrumb React component is needed; `completedRooms` state array already tracks completion; act state comes from Phase 14 save data |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90+ | Particle emitters, tweens, camera flash, graphics | Already present, all VFX in-scene |
| React 18 | 18.x | Breadcrumb HUD overlay, fanfare banner | Already present, owns all HUD/overlay |
| Tailwind 3 | 3.x | HUD styling consistent with RoomProgressHUD | Already present |
| EventBridge | singleton | Phaser-to-React fanfare trigger, act state sync | Already present, established pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Kenney Interface Sounds | CC0 OGG | `confirmation_001.ogg` for fanfare chime | Load in BootScene alongside existing SFX |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `confirmation` SFX key | Reuse `sfx_interact` at high volume | `sfx_interact` is a click sound — thin for a major completion moment. `confirmation_001.ogg` from the existing Kenney pack is a proper chime. |
| Phaser particle burst for fanfare | CSS animation on React overlay | Phaser particles stay in the game world and feel more "Nintendo". React CSS animations are faster to add but decouple from the canvas. Use Phaser. |
| New breadcrumb component | Extend `RoomProgressHUD` | `RoomProgressHUD` is scoped to the currently active room. The breadcrumb shows ALL departments — different concern, different component. |

**Installation:** No new packages needed. One new audio file copy from existing Kenney pack.

---

## Architecture Patterns

### Recommended File Structure
```
client/src/
├── components/
│   ├── DepartmentBreadcrumb.tsx    # NEW — cross-room progress HUD
│   ├── RoomProgressHUD.tsx         # EXISTING — per-room NPC/zone/item progress
│   └── GameBanner.tsx              # EXISTING — reused for fanfare banner
├── data/
│   └── hallwayContent.ts           # NEW — bulletin board text per act, per hallway segment
├── phaser/scenes/
│   └── ExplorationScene.ts         # MODIFY — render hallway props, emit fanfare event
└── pages/
    └── PrivacyQuestPage.tsx         # MODIFY — add breadcrumb, handle fanfare trigger
```

### Pattern 1: Hallway Connector Content (Environmental Storytelling)
**What:** Each hallway segment between departments has 1-2 interactive bulletin board props. Content varies by act (Act 1 = warm/orientation notices, Act 2 = stress indicators, Act 3 = incident notices). Content is static data, not triggered by player — just readable on approach.

**When to use:** NARR-06. Executed in Phase 15 after Phase 14's act system is wired.

**Implementation approach:**

Hallway connectors already exist as rooms in the continuous navigation built in Phase 12. They are thin corridors between departments. The pattern is:
1. Define `hallwayContent.ts` with a record keyed by `{ hallwayId, act }` → `{ boardText, propType }`
2. In `ExplorationScene.create()`, detect if the room is a hallway type, look up act from save state, render the correct board text as an `educationalItem`-style prop (no scoring, just readable text)
3. Use existing `objectTextureKey('poster')` for the bulletin board sprite
4. Content changes between acts silently — when the player re-enters a hallway in Act 2, the board shows different text. No announcement needed.

```typescript
// Source: project pattern from ExplorationScene.ts educationalItems section
// hallwayContent.ts structure
export const HALLWAY_CONTENT: Record<string, Record<number, HallwayBoardEntry>> = {
  'hallway_reception_breakroom': {
    1: { text: "WELCOME TO HIPAA GENERAL\nOrientation: Room 204\nBadges required after 9am", propType: 'poster' },
    2: { text: "REMINDER: Third audit this month\nAll access logs reviewed\n- Compliance Dept", propType: 'poster' },
    3: { text: "SECURITY INCIDENT IN PROGRESS\nIT Dept notified\nLock workstations NOW", propType: 'poster' },
  },
  // ... other hallway segments
};
```

### Pattern 2: Department Completion Fanfare Sequence
**What:** A 3-beat sequence triggered when all required NPCs + zones + items in a department are completed. Beat 1: Phaser camera flash + particle burst (in-scene). Beat 2: GameBanner overlay ("Reception Complete!"). Beat 3: Persistent checkmark badge appears on the door sprite.

**When to use:** NARR-07. Triggered from `handleExitRoom()` or immediately when the last requirement is met.

**Implementation approach:**

`checkRoomCompletion()` already exists in `PrivacyQuestPage.tsx` (line 401). `handleExitRoom()` already has partial completion logic (line 411-430) — it fires a `GameBanner` and plays `sfx_wave_start`. The gap is:
1. A larger Phaser particle burst (not just the ambient dust — a burst emitter at player position)
2. A chime SFX that feels celebratory (`sfx_wave_start` is currently used, but `confirmation_001.ogg` is better)
3. The badge persisting on the department door after completion

```typescript
// Source: ExplorationScene.ts particle pattern (lines 418-458)
// Fanfare burst — called via EventBridge from React after completion check
playFanfareBurst(x: number, y: number) {
  if (!this.textures.exists('particle_circle')) return;
  const emitter = this.add.particles(x, y, 'particle_circle', {
    speed: { min: 80, max: 180 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: [0xffd700, 0x44ff44, 0x4ae2ff, 0xff6b9d],
    lifespan: 800,
    quantity: 24,
    emitting: false,
  } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
  emitter.explode(24, x, y);
}
```

The camera flash pattern is already used in the score delta handler (line 154) via `REACT_PLAY_SFX`. For a room completion, also emit a camera flash via a new `REACT_ROOM_COMPLETE_FANFARE` EventBridge event so ExplorationScene can do the particle burst.

### Pattern 3: Progress Breadcrumb HUD
**What:** A compact React overlay (positioned top-left or bottom of canvas) showing all 6 departments as small tiles — completed (green check), current (pulsing), locked (dim), available (white). Also shows current act ("ACT 1", "ACT 2", "ACT 3"). Persistent during all exploration.

**When to use:** NARR-08. Shown whenever `pageMode === 'exploration'`.

**Implementation approach:**

`RoomProgressHUD` (top-right, per-room) already exists. The breadcrumb is a different component positioned top-left or bottom-center. It needs:
- `completedRooms: string[]` from PrivacyQuestPage state (already tracked)
- `currentRoomId: string | null` (already in state)
- `currentAct: 1 | 2 | 3` — from Phase 14 save state (`pq:save:v2` → `actProgress`)
- Department ordering constant (Reception → Break Room → Lab → Records → IT → ER)

```tsx
// DepartmentBreadcrumb.tsx — new component
// Positioned absolute top-left of canvas, z-index below dialogue overlays
interface DepartmentBreadcrumbProps {
  rooms: { id: string; name: string; act: number }[];
  completedRooms: string[];
  currentRoomId: string | null;
  currentAct: number;
  unlockedRooms: string[];  // from Phase 12/14 unlock progression
}
```

The breadcrumb should be compact: 6 small squares in a row (24x24px each), with "ACT X" label. Each square shows first letter of department name, colored green (complete), gold pulsing (current), grey (locked), white (available). This does not interrupt gameplay — it is always visible, non-interactive, fixed position.

### Anti-Patterns to Avoid
- **Triggering fanfare on ExplorationScene exit only:** The current `handleExitRoom()` fires the banner when exiting. For a better feel, trigger the fanfare the moment the last requirement is met in-room (while still playing), then show the banner on exit. This creates the anticipation beat (Commandment 2).
- **Making hallway content a full dialogue scene:** Bulletin boards should be a lightweight readable prop — no score, no NPC, no multi-screen dialogue. One screen of flavor text, then return to exploration.
- **Per-room breadcrumb instead of cross-game breadcrumb:** The existing `RoomProgressHUD` handles per-room. The breadcrumb is the cross-game view. Keep them separate.
- **Using `createEmitter()` for fanfare particles:** Project constraint from CLAUDE.md — always use `this.add.particles(x, y, key, config)`. Never `createEmitter()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Particle burst VFX | Custom canvas drawing or CSS animation | `this.add.particles()` with `explode()` | Phaser's particle system handles depth, pooling, and blending automatically |
| Fanfare banner overlay | New modal component | Existing `GameBanner` component | Already has enter/hold/exit phases, color variants, `onComplete` callback |
| Notification toasts | Custom toast | Existing `useNotification()` + `notify()` | Already wired, already styled, already has success/discovery types |
| Score celebration | New celebration system | Existing `notify()` call pattern | Score milestones already use this (lines 183-188 of PrivacyQuestPage) |
| Chime sound | Web Audio API synthesis | Copy `confirmation_001.ogg` from Kenney interface pack, load in BootScene | Correct licensing, consistent with existing audio approach |

**Key insight:** The entire fanfare delivery infrastructure exists. The task is to add a new EventBridge event, wire the trigger correctly, and write the particle burst method.

---

## Common Pitfalls

### Pitfall 1: Double-Firing the Fanfare
**What goes wrong:** Fanfare fires every time the player exits a completed room, not just the first time.
**Why it happens:** `completedRooms.includes(currentRoomId)` check gates the banner correctly (line 415), but a re-entry + re-exit of a completed room could trigger it again if the state check is wrong.
**How to avoid:** The existing guard `if (isComplete && !completedRooms.includes(currentRoomId!))` (line 415) is correct. The fanfare only fires when room ID is *newly added* to `completedRooms`. Preserve this guard.
**Warning signs:** Badge appears repeatedly, notification toast fires multiple times.

### Pitfall 2: Act State Not Available at Phase 15 Start
**What goes wrong:** Hallway content and breadcrumb HUD need the current act number, but act state comes from Phase 14. If Phase 14 is not complete, act will always be 1.
**Why it happens:** Phase 15 depends on Phase 14. If tested in isolation, act state won't exist.
**How to avoid:** Default to `act = 1` when act state is absent. All hallway content and breadcrumb render correctly in act 1 mode. When Phase 14 ships, the act state becomes available automatically.
**Warning signs:** Hallway boards always show Act 1 text even in Act 3.

### Pitfall 3: Breadcrumb HUD Overlapping Other Overlays
**What goes wrong:** Breadcrumb appears on top of dialogue box, educational item modal, or choice gate.
**Why it happens:** React overlay z-index stacking. The canvas-relative absolutely positioned overlays share a stacking context.
**How to avoid:** Set breadcrumb z-index below dialogue (z-10 or less) and add `pointer-events-none`. Use `pageMode !== 'dialogue'` to conditionally hide it during dialogue, or ensure its z-index is below `z-[50]` which is GameBanner's `z-[150]`.
**Warning signs:** Breadcrumb visible through dialogue box, or clicks on dialogue buttons intercepted by breadcrumb.

### Pitfall 4: Hallway Board Text Too Long
**What goes wrong:** Bulletin board text overflows the EducationalItemModal or wraps badly in a Phaser text object.
**Why it happens:** Hallway connector rooms are narrow. Board text must be concise.
**How to avoid:** Each bulletin board entry: max 3 lines, max 28 characters per line. Use the existing `EducationalItemModal` display path (which handles word wrap in React) rather than Phaser text rendering for multi-line content.
**Warning signs:** Text clipped at the edge of a Phaser text object, or modal looks cramped.

### Pitfall 5: EventBridge Listener Leak from Fanfare Handler
**What goes wrong:** `REACT_ROOM_COMPLETE_FANFARE` listener registered in ExplorationScene is never removed in `shutdown()`.
**Why it happens:** New EventBridge events added without the matching `off()` call.
**How to avoid:** Every `on()` in ExplorationScene must have a matching `off()` in `shutdown()`. Project constraint from CLAUDE.md.
**Warning signs:** Console warnings about duplicate listeners, fanfare firing in wrong scene.

---

## Code Examples

Verified patterns from the existing codebase:

### Particle Burst Emitter (Phaser 3.90+ API)
```typescript
// Source: ExplorationScene.ts lines 418-458 (ambient particle pattern)
// For fanfare, use explode() mode — one-shot burst
const emitter = this.add.particles(playerX, playerY, 'particle_circle', {
  speed: { min: 80, max: 200 },
  angle: { min: 0, max: 360 },
  scale: { start: 0.8, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: [0xffd700, 0x44ff44, 0xffffff],
  lifespan: 900,
  quantity: 30,
  emitting: false,
} as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
emitter.explode(30, playerX, playerY);
// Auto-destroy after lifespan
this.time.delayedCall(1000, () => emitter.destroy());
```

### Camera Flash (Phaser)
```typescript
// Source: ExplorationScene.ts camera zoom tween pattern (line 867)
// Camera flash for completion — brief white camera effect
this.cameras.main.flash(300, 255, 255, 255, false);
```

Note: `this.cameras.main.flash(duration, red, green, blue, force)` is the Phaser camera flash API. This is distinct from the JS camera API. Confidence: HIGH (Phaser 3 docs).

### GameBanner Usage Pattern
```typescript
// Source: PrivacyQuestPage.tsx lines 669-677
// Existing "Room Cleared!" banner — model fanfare banner on this
{roomClearedBanner && (
  <GameBanner
    text="Reception Complete!"
    subtext="Department cleared — HIPAA knowledge gained"
    color="green"
    duration={2000}
    onComplete={handleRoomClearedComplete}
  />
)}
```

### EventBridge New Event Pattern
```typescript
// Source: EventBridge.ts — add to BRIDGE_EVENTS const
REACT_ROOM_COMPLETE_FANFARE: 'react:room-complete-fanfare',
// payload: { roomId: string; playerX: number; playerY: number }

// React side — emit after confirming new completion:
eventBridge.emit(BRIDGE_EVENTS.REACT_ROOM_COMPLETE_FANFARE, {
  roomId: currentRoomId,
  playerX: lastPlayerPos.x,
  playerY: lastPlayerPos.y,
});

// ExplorationScene — listen and burst:
eventBridge.on(BRIDGE_EVENTS.REACT_ROOM_COMPLETE_FANFARE, this.handleFanfare, this);
// In shutdown():
eventBridge.off(BRIDGE_EVENTS.REACT_ROOM_COMPLETE_FANFARE, this.handleFanfare, this);
```

### Persistent Badge on Door (Phaser Graphics)
```typescript
// Source: ExplorationScene.ts completed checkmark pattern (line 709-717)
// Existing pattern for NPC completion checkmarks:
const checkmark = this.add.text(sprite.x, sprite.y - 20, '\u2713', {
  fontFamily: '"Press Start 2P"',
  fontSize: '8px',
  color: '#44ff44',
  stroke: '#000000',
  strokeThickness: 2,
}).setOrigin(0.5).setDepth(sprite.depth + 1);
// For door badge: apply the same pattern to the door sprite position
// Add a gold circle behind it for emphasis
const badge = this.add.circle(doorX, doorY - 20, 8, 0x2a7a2a, 1).setDepth(doorDepth + 1);
this.add.text(doorX, doorY - 20, '\u2713', { ... }).setDepth(doorDepth + 2);
```

### DepartmentBreadcrumb HUD (React)
```tsx
// New component — positioned absolute top-left inside canvas div
// Hides during dialogue (pageMode === 'exploration' only)
// 6 department tiles in a row, each 28x28px
// Color coding: green (done), gold+pulse (current), white (available), dim (locked)
<div
  className="absolute top-2 left-2 bg-black/70 border border-[#4ECDC4] p-2 pointer-events-none"
  style={{ fontFamily: '"Press Start 2P"', fontSize: '6px', zIndex: 10 }}
>
  <div className="text-[#ffd700] mb-1">ACT {currentAct}</div>
  <div className="flex gap-1">
    {DEPARTMENT_ORDER.map(dep => (
      <DepartmentTile key={dep.id} {...dep}
        completed={completedRooms.includes(dep.id)}
        current={dep.id === currentRoomId}
        locked={!unlockedRooms.includes(dep.id)}
      />
    ))}
  </div>
</div>
```

### Loading New SFX in BootScene
```typescript
// Source: BootScene.ts lines 82-93
// Add alongside existing SFX loads:
this.load.audio('sfx_fanfare', `${base}attached_assets/audio/sfx_fanfare.ogg`);
// sfx_fanfare.ogg = copy of kenney_interface-sounds/Audio/confirmation_001.ogg
```

---

## Hallway Environmental Content Design

This is the content design question for NARR-06. What goes on the bulletin boards?

### Per-Hallway, Per-Act Content Matrix

Departments in order: Reception → Break Room → Lab → Records → IT → ER

Hallway segments: 5 connectors (Reception↔BreakRoom, BreakRoom↔Lab, Lab↔Records, Records↔IT, IT↔ER)

| Hallway | Act 1 ("First Day") | Act 2 ("Something's Wrong") | Act 3 ("The Breach") |
|---------|-------------------|---------------------------|---------------------|
| Reception↔Break Room | "WELCOME!\nOrientation today at 2pm\nBadges required after lobby" | "REMINDER: Three audit flags this week\nMinimum Necessary applies — even here" | "LOCKDOWN PROTOCOL ACTIVE\nEscort all visitors\nNo unattended devices" |
| Break Room↔Lab | "STAFF ONLY PAST THIS POINT\nPatient info stays in patient areas\nHave a great shift!" | "OVERHEARD: Patient names in the break room\nReminder: Public hallways are public\n- Privacy Officer" | "ALL PATIENT RECORDS\nMove to secure locations NOW\n- Dr. Kim, CMO" |
| Lab↔Records | "SPECIMEN LABELS: Double-check IDs\nWrong patient = wrong treatment\nSafety first!" | "LAB RESULTS: Faxing to wrong numbers\nVerify every recipient. Every time.\n— 3rd incident this month" | "BREACH CONFIRMED\nAll outbound comms suspended\nIT investigating" |
| Records↔IT | "ELECTRONIC PHI RULES\nPasswords: Change every 90 days\nQuestions? See IT" | "SUSPICIOUS LOGINS DETECTED\nIf you see something, say something\nIT ext 4433" | "ACTIVE INCIDENT\nDisconnect from network if instructed\nIT is aware — do not call" |
| IT↔ER | "ER PROTOCOLS ON FILE\nTreatment > paperwork in emergencies\nKnow the exceptions!" | "ER WHITEBOARD: Cover when family present\nPatient dignit matters\nNew procedure posted" | "ALL HANDS: Hospital under cyber attack\nOral orders only until systems restored\n- Administration" |

### Props Beyond Bulletin Boards
Act-aware ambient details in hallways (rendered as visual-only, non-interactive):
- **Act 1:** Empty hallway, good lighting, a potted plant, clean floor
- **Act 2:** A forgotten coffee cup on a bench, a note taped to the wall, slightly dimmer corridor light (use `setAlpha(0.9)` on ceiling light graphics)
- **Act 3:** A chair pulled out to block a door, a dropped clipboard on the floor, red warning light strip along the wall

These are purely visual. They require no interaction logic — just conditional rendering based on act number.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Room picker UI for navigation | Door-to-door continuous navigation | Phase 12 (v2.0) | Hallway connectors now exist as rooms |
| Per-room completion only | Department completion + act progression | Phase 14 (v2.0) | Act state is available for breadcrumb and hallway content |
| `sfx_wave_start` for room complete | `sfx_fanfare` (confirmation chime) | Phase 15 | More celebratory feel for department fanfare |
| No cross-room progress view | DepartmentBreadcrumb HUD | Phase 15 | Player always knows where they are |

**Still current:**
- `this.add.particles(x, y, key, config)` — Phaser 3.60+ API, correct in 3.90+
- EventBridge on/off pattern — unchanged through all phases
- `GameBanner` enter/hold/exit phase system — preserved as-is

---

## Completion Tracking — How It Works Today

This is critical context for NARR-07 and NARR-08.

### Existing Per-Room Tracking (PrivacyQuestPage.tsx)

State is stored in React, persisted to localStorage:

| State | localStorage key | What it tracks |
|-------|-----------------|---------------|
| `completedRooms` | `completedRooms` | Array of room IDs fully completed |
| `completedNPCs` | `completedNPCs` | Set of NPC IDs talked to (cross-room) |
| `completedZones` | `completedZones` | Set of zone IDs spotted (cross-room) |
| `collectedItems` | `collectedEducationalItems` | Set of item IDs read (cross-room) |

`checkRoomCompletion(room)` at line 401 reads `completionRequirements` from roomData.json and checks all three sets against `requiredNpcs`, `requiredZones`, `requiredItems`.

`handleExitRoom()` at line 411 calls `checkRoomCompletion`, and if true AND not already in `completedRooms`, fires the existing room-cleared banner and SFX.

### Phase 14 Act State (Expected after Phase 14)

Act state will be in `pq:save:v2` localStorage object:
```json
{
  "actProgress": 1,  // 1, 2, or 3
  "departmentCompletion": { "reception": true, "break_room": false, ... },
  "encounterResults": { ... },
  "unifiedScore": 145,
  "playerPosition": { "roomId": "lab", "x": 5, "y": 8 }
}
```

Phase 15 should read `actProgress` from this key, with a fallback of `1` when the key is absent.

### What Phase 15 Needs to Add

1. **Fanfare event in EventBridge**: New `REACT_ROOM_COMPLETE_FANFARE` event
2. **Particle burst in ExplorationScene**: `handleFanfareEvent()` method
3. **Chime SFX**: Load `sfx_fanfare` in BootScene (copy from Kenney `confirmation_001.ogg`)
4. **Door badge**: In the unified navigation (Phase 12's HospitalScene or ExplorationScene), add visual badge to completed department doors
5. **Hallway content data**: `hallwayContent.ts` with act-aware text entries
6. **Hallway rendering**: ExplorationScene detects hallway rooms, reads current act, renders correct board
7. **DepartmentBreadcrumb**: New React component, shown during exploration alongside RoomProgressHUD

---

## Open Questions

1. **Where does the door badge live?**
   - What we know: Phase 12 builds door-to-door transitions. Doors exist in whatever scene/room that phase creates.
   - What's unclear: Whether doors are sprites in ExplorationScene or rendered in a separate HospitalScene.
   - Recommendation: Design the badge system so it can be applied to any positioned sprite or graphics object. Pass `completedRooms` into scene init data the same way `completedNPCs` is passed today.

2. **Fanfare timing — in-room vs. on-exit**
   - What we know: Current pattern fires the banner on room exit. A better feel fires it the moment the last task is done (Commandment 2: anticipation).
   - What's unclear: Does the particle burst feel out of place while still exploring the room?
   - Recommendation: Fire particle burst + chime immediately when last requirement is met. Show GameBanner on exit (after ESC/door). The two-beat version (in-room VFX → exit banner) follows Commandment 7 (pacing wave).

3. **Hallway room structure from Phase 12**
   - What we know: Phase 12 creates hallway connector rooms. Their structure isn't defined yet (Phase 12 not started).
   - What's unclear: Exact roomData schema for hallway connectors (will they have `interactionZones`? `educationalItems`?).
   - Recommendation: Design hallway content so it uses the existing `educationalItems` array in roomData.json. This gives hallway boards the same render/interaction path as educational items, zero new code.

---

## Sources

### Primary (HIGH confidence)
- `/client/src/phaser/scenes/ExplorationScene.ts` — particle emitter config, tween patterns, camera zoom, NPC checkmark pattern, ambient particles
- `/client/src/pages/PrivacyQuestPage.tsx` — completion tracking state, checkRoomCompletion(), handleExitRoom(), score delta pattern, milestone notifications
- `/client/src/components/RoomProgressHUD.tsx` — existing HUD component structure, glow animation pattern
- `/client/src/components/GameBanner.tsx` — enter/hold/exit banner system, color variants
- `/client/src/phaser/EventBridge.ts` — all event names, emitter/listener pattern
- `/client/src/phaser/scenes/BootScene.ts` — audio load pattern, SFX key names
- `/client/src/data/roomData.json` — completionRequirements structure, room schema
- `.planning/ENHANCEMENT_BRIEF.md` — sections 5, 7, 8: hallway content concept, audio targets, content strategy
- `.planning/ROADMAP.md` — Phase 15 success criteria and dependencies
- `attached_assets/audio/kenney_interface-sounds/Audio/` — available sounds: confirmation_001.ogg confirmed present

### Secondary (MEDIUM confidence)
- Phaser 3.90+ docs on `cameras.main.flash()` — verified against Phaser 3 API, consistent with project usage
- Phaser 3.90+ docs on `add.particles(x, y, key, config).explode(count, x, y)` — verified against existing usage in ExplorationScene

### Tertiary (LOW confidence)
- Hallway content text examples (Act 1/2/3 bulletin board entries) — designed from scratch based on ENHANCEMENT_BRIEF narrative arc. Subject to content review.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, no new dependencies
- Architecture: HIGH — all patterns verified from existing codebase
- Pitfalls: HIGH — all identified from reading actual code paths
- Hallway content text: LOW — creative content, needs writer/designer review

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable stack; Phaser and React versions locked)
