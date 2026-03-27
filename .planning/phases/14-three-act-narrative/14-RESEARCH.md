# Phase 14: Three-Act Narrative Arc - Research

**Researched:** 2026-03-27
**Domain:** Game narrative state management, Phaser music crossfade, NPC contextual dialogue
**Confidence:** HIGH (all findings grounded in direct codebase inspection + verified Phaser 3.90 API)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NARR-01 | Act progression system with conditions (Act 1→2→3 based on department completion + encounter status) | Unified game state schema (localStorage), department completion already tracked in `completedRooms[]`, act flags are simple boolean additions |
| NARR-02 | Per-act music shifts using existing tracks (hub=Act1, exploration=Act2, breach=Act3) | All 3 tracks already loaded in BootScene (`music_hub`, `music_exploration`, `music_breach`); tween volume crossfade pattern already working in all 3 scenes |
| NARR-03 | Soft act transitions — no title cards, music crossfades + environmental cues | No new system needed; act check runs after department completion; EventBridge `ACT_ADVANCE` event triggers crossfade in scene |
| NARR-04 | Transition dialogue — 2-3 key decisions remembered, reflected in 3-5 NPC lines | Decision flags stored alongside act state in `pq:save:v2`; NPC scene lookup by ID already exists; variant scenes added to `gameData.json` |
| NARR-05 | Department ordering matches narrative flow (Reception/Break Room=Act1, Lab/Records=Act2, IT/ER=Act3) | Phase 12 door unlock system drives this; narrative act grouping is a labeling + content concern, not a new mechanical system |

</phase_requirements>

---

## Summary

Phase 14 adds narrative shape to the game without adding new mechanical systems. Every building block already exists: three music tracks loaded in BootScene, the tween-based volume crossfade pattern is live in all three Phaser scenes, department completion is already tracked in React state and persisted to localStorage, and the NPC dialogue system already supports looking up scenes by ID. The work is: (1) designing the act conditions schema, (2) adding 2-3 decision flag captures to existing dialogue handlers, (3) writing 3-5 new NPC variant scenes, (4) wiring a crossfade on act advance, and (5) verifying NARR-05 department ordering aligns with Phase 12 door unlock sequence.

The biggest open question is how Phase 14 relates to Phase 12's door unlock system. Phase 12 establishes the linear unlock sequence. Phase 14 layers act labels and music changes on top of that sequence. These are not competing systems — act advancement is checked after department completion events that Phase 12 already generates. Phase 14 reads from Phase 12's output (completion events), it does not replace it.

**Primary recommendation:** Implement act state as three boolean flags in `pq:save:v2`, advance acts by checking completion counts on existing `ROOM_COMPLETE` events from Phase 12, and crossfade music via a new `ACT_ADVANCE` EventBridge event that ExplorationScene handles with a tween. Decision memory requires only 2-3 flags and 3-5 new scene entries in `gameData.json`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | ^3.90.0 | Scene music control, tween crossfade, EventBridge emission | Already in project; `WebAudioSound.volume` is the tween target; pattern proven in all three existing scenes |
| React 18 | ^18 | Act state in unified game state hook, NPC variant lookup | Already owns game state; `PrivacyQuestPage` already manages `completedRooms`, score, NPC completion |
| localStorage | browser | Persist act flags, decision flags across sessions | Already used for all other game state; migration path exists (Phase 11 schema) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| EventBridge (Phaser EventEmitter) | project singleton | React → Phaser `ACT_ADVANCE` signal to trigger crossfade | Any time a React-side act advance needs to cause a Phaser-side audio change |

---

## Existing Infrastructure (Critical Findings)

### What Already Exists — Don't Rebuild

**Music tracks (all loaded in BootScene):**
- `music_hub` — warm/welcoming lobby feel → assign to Act 1
- `music_exploration` — exploration ambience → assign to Act 2
- `music_breach` — urgent/tense → assign to Act 3
- All loaded at line 91-93 of `BootScene.ts` via `this.load.audio()`, available globally to all scenes

**Music fade-in pattern (identical in all three scenes):**
```typescript
// Source: ExplorationScene.ts line 1016-1035, pattern identical in HubWorldScene.ts and BreachDefenseScene.ts
const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
const targetVol = this.musicBaseVolume * userVol;
this.bgMusic = this.sound.add('music_exploration', { loop: true, volume: 0 });
const playMusic = () => {
  if (!this.bgMusic || !this.scene.isActive()) return;
  this.bgMusic.play();
  this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 1500, ease: 'Sine.easeIn' });
};
```
This tween pattern (`targets: this.bgMusic, volume: targetVol`) is the crossfade mechanism. To crossfade: tween outgoing track to volume 0, then start and tween incoming track to targetVol.

**Volume control via EventBridge:**
```typescript
// Source: ExplorationScene.ts line 1232-1236
private onMusicVolume = (vol: number) => {
  if (this.bgMusic) {
    (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.musicBaseVolume * vol;
  }
};
```
This confirms `WebAudioSound.volume` is a writable property that Phaser tweens can target directly.

**Department completion state (PrivacyQuestPage.tsx):**
- `completedRooms: string[]` — persisted to `localStorage.setItem('completedRooms', ...)` (line 139)
- `completedNPCs: Set<string>` — persisted (line 141)
- `completedZones: Set<string>` — persisted (line 142)
- `collectedItems: Set<string>` — persisted (line 143)
- Room completion check at `checkRoomCompletion()` (line 401-409)
- Exit room handler at `handleExitRoom()` (line 411-430)

**Room order (current `roomData.json` unlock chain):**
```
reception       → alwaysUnlocked: true (no unlockRequirement)
break_room      → alwaysUnlocked: true (no unlockRequirement)
er              → unlockRequirement: "reception"
lab             → unlockRequirement: "er"
records_room    → unlockRequirement: "lab"
it_office       → unlockRequirement: "records_room"
```

CRITICAL NOTE: The current unlock chain does NOT match the narrative act grouping. Phase 12 will establish the new linear chain. Phase 14 depends on Phase 12 having ordered the chain as:
- Act 1: reception, break_room
- Act 2: lab, records_room
- Act 3: it_office, er (+ encounter from Phase 13)

The planner must confirm Phase 12 delivers this ordering before Phase 14 tasks write act conditions against department IDs.

**NPC scene lookup (PrivacyQuestPage.tsx line 322-398):**
```typescript
const onInteractNPC = (data: { npcId: string; npcName: string; sceneId: string }) => {
  // sceneId drives which gameData.json scene loads
  setCurrentSceneId(data.sceneId);
  setPageMode('dialogue');
};
```
NPC scene IDs come from `roomData.json` NPC entries. To add variant dialogue: add new scene entries to `gameData.json` and conditionally pass alternate `sceneId` when a decision flag is set.

**Existing EventBridge events (EventBridge.ts):**
```typescript
// Phaser -> React (existing):
EXPLORATION_EXIT_ROOM, EXPLORATION_INTERACT_NPC, EXPLORATION_INTERACT_ZONE
// React -> Phaser (existing):
REACT_DIALOGUE_COMPLETE, REACT_PAUSE_EXPLORATION, REACT_SET_MUSIC_VOLUME
```
New events needed for Phase 14:
- `ACT_ADVANCE` — React → Phaser (carry `{ newAct: 1 | 2 | 3, track: string }`)
- `ENCOUNTER_COMPLETE` — already planned in Phase 13 for act 2→3 trigger

---

## Architecture Patterns

### Act State Schema (in unified `pq:save:v2`)

Phase 11 will migrate to a unified schema. Phase 14 adds these fields:

```typescript
// Source: design from ENHANCEMENT_BRIEF.md section 9 + current state analysis
interface UnifiedGameState {
  // ... Phase 11 fields (rooms, score, NPCs, etc.)
  act: {
    current: 1 | 2 | 3;
    act1Complete: boolean;   // Reception + Break Room both completed
    act2Complete: boolean;   // Lab + Records both completed + encounter attempted
  };
  decisions: {
    // The 3 most impactful decision flags (see NARR-04 section)
    faxIncidentHandled: 'reported' | 'delayed' | 'ignored' | null;
    vendorAccessGranted: boolean | null;
    breachEncounterPassed: boolean | null;  // from Phase 13
  };
}
```

### Act Transition Conditions (NARR-01)

Based on codebase analysis + ENHANCEMENT_BRIEF section 3:

**Act 1 → Act 2 trigger:**
- `completedRooms` includes both `'reception'` AND `'break_room'`
- Check runs inside `handleExitRoom()` after `completedRooms` updates
- No score threshold — completion is the gate (ENHANCEMENT_BRIEF: "Completion = passing")

**Act 2 → Act 3 trigger:**
- `completedRooms` includes both `'lab'` AND `'records_room'`
- PLUS: encounter from Phase 13 has been attempted (check `gameState.decisions.breachEncounterPassed !== null`)
- Alternatively (if Phase 13 not yet complete): `completedRooms` includes `'it_office'`
- Decision: use department completion as primary gate, encounter as secondary enrichment not hard gate

**Why not score-based gating?** ENHANCEMENT_BRIEF.md explicitly states score reflects quality but does not gate progression (section 6: "Completion = passing"). Score-gated acts would stall players who make wrong choices — anti-pattern for compliance training.

### Music Crossfade Pattern (NARR-02 + NARR-03)

```typescript
// Source: adapted from ExplorationScene.ts music handling + Phaser 3.90 tween API
// Called in ExplorationScene when ACT_ADVANCE event received

private crossfadeToMusic(newTrackKey: string): void {
  const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
  const targetVol = this.musicBaseVolume * userVol;

  // Fade out current track
  if (this.bgMusic && (this.bgMusic as Phaser.Sound.WebAudioSound).isPlaying) {
    this.tweens.add({
      targets: this.bgMusic,
      volume: 0,
      duration: 2000,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.bgMusic?.stop();
        this.bgMusic?.destroy();
        this.bgMusic = undefined;
        this.startMusic(newTrackKey, targetVol);
      }
    });
  } else {
    this.startMusic(newTrackKey, targetVol);
  }
}

private startMusic(key: string, targetVol: number): void {
  if (!this.scene.isActive()) return;
  this.bgMusic = this.sound.add(key, { loop: true, volume: 0 });
  this.bgMusic.play();
  this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 2000, ease: 'Sine.easeIn' });
}
```

This is the crossfade pattern. Total transition time: ~4 seconds (2s fade out + 2s fade in overlapping). For a soft transition, these can run simultaneously (start new track at volume 0 before old finishes fading) to create a true crossfade.

### NPC Variant Dialogue (NARR-04)

The pattern for decision-aware NPC dialogue:

```typescript
// Source: adapted from PrivacyQuestPage.tsx onInteractNPC handler
// In React, when an NPC is interacted with:

const getSceneIdForNPC = (npcId: string, baseSceneId: string): string => {
  const decisions = gameState.decisions;

  // Check if this NPC has act-aware variants
  if (npcId === 'security_analyst' && decisions.faxIncidentHandled) {
    // Security analyst in IT office references how fax incident was handled
    return decisions.faxIncidentHandled === 'reported'
      ? 'security_analyst_scene_variant_reported'
      : 'security_analyst_scene_variant_default';
  }
  return baseSceneId;
};
```

Add variant scene entries to `gameData.json`:
```json
{
  "id": "security_analyst_scene_variant_reported",
  "character": "Security Analyst Sam",
  "dialogue": "I heard you handled that fax incident by the book — reported it right away. That's exactly what we need. Those response instincts matter when the real threats hit.",
  "choices": [/* same teaching choices as base scene */]
}
```

### Department Ordering vs. Phase 12 Dependency (NARR-05)

NARR-05 says department ordering matches narrative flow. This is a Phase 12 deliverable (door unlock chain). Phase 14's role is to:
1. Assert the ordering matches (verify Phase 12 output)
2. Label departments by act in constants/configuration for music and dialogue checks
3. Add environmental cues that reinforce act identity (hallway text changes, NPC ambient lines)

Phase 14 does NOT implement the ordering itself — that belongs to Phase 12.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Music crossfade | Custom WebAudio fade system | `this.tweens.add({ targets: bgMusic, volume: 0 })` | Phaser tween system already targets `WebAudioSound.volume` — proven in all 3 existing scenes |
| Act persistence | Custom state serializer | Add fields to `pq:save:v2` (Phase 11 schema) | Unified save schema is Phase 11's output — don't create a parallel save system |
| NPC variant routing | Complex branching dialogue engine | Add variant scene IDs to `gameData.json`, conditional `sceneId` selection in `onInteractNPC` | Existing scene lookup by ID handles the rest |
| "Chapter X" title cards | Full-screen transition overlays | Music crossfade + ambient NPC line change | NARR-03 explicitly forbids hard cuts; soft transitions cost less and feel better |
| Act progress display | New HUD component | Add act badge to Phase 15's progress HUD (NARR-08) | Phase 15 owns the HUD — Phase 14 provides the data, not the display |

**Key insight:** The entire three-act system is a state layer on top of existing systems, not a parallel system. Acts are labels on top of completion tracking that already works.

---

## Common Pitfalls

### Pitfall 1: Crossfade During Scene Shutdown
**What goes wrong:** Scene shuts down (player exits room, transitions) while crossfade tween is mid-flight → `this.bgMusic` destroyed by shutdown before tween `onComplete` fires → null reference error.
**Why it happens:** Phaser tweens run on the scene's tween manager; if scene shuts down, tweens stop but `onComplete` may still fire on the next tick.
**How to avoid:** In `shutdown()`, call `this.tweens.killAll()` before stopping music. Check `this.scene.isActive()` in the `onComplete` callback before starting new track.
**Warning signs:** Console errors like `Cannot read property 'play' of undefined` during room exit.

### Pitfall 2: Stale Closure in EventBridge Decision Flag Capture
**What goes wrong:** `onInteractNPC` handler captures `decisions` state at mount time, never sees updated values → decision flags never change.
**Why it happens:** `useCallback` in React with incomplete dependency arrays is the classic source. The existing code already has this acknowledged (line 395-398 comment in PrivacyQuestPage.tsx: "Note: toast/notify are stable hook refs...").
**How to avoid:** Use a `useRef` for decision state that is read at call time (not closed over), or include `decisions` in the `useCallback` deps array.
**Warning signs:** NPC dialogue always shows default variant even after decisions were made.

### Pitfall 3: Act Transition Fires Multiple Times
**What goes wrong:** `handleExitRoom` is called, act advances from 1→2, then called again for a different room → act 2→3 fires prematurely.
**Why it happens:** Act check inside `handleExitRoom` runs every time without checking if transition already fired.
**How to avoid:** Guard with `if (act.current === 1 && !act.act1Complete && conditions_met) { advance }`. The `act1Complete` flag prevents re-fire.
**Warning signs:** Music jumps to breach theme before IT Office is reached.

### Pitfall 4: roomData.json Ordering Mismatch with NARR-05
**What goes wrong:** Current `roomData.json` unlock chain (reception → er → lab → records → it_office, break_room always unlocked) does NOT match the narrative arc grouping.
**Why it happens:** This is the pre-Phase 12 ordering. Phase 12 will fix it.
**How to avoid:** Phase 14 tasks must declare a hard dependency on Phase 12's door unlock system being in place. Act condition checks use room IDs that Phase 12 establishes in the new chain.
**Warning signs:** Act 2 triggers after reception + er instead of reception + break_room.

### Pitfall 5: `music_breach` Playing During RPG Exploration in Act 3
**What goes wrong:** Act 3 triggers breach theme, but player is still doing RPG exploration (talking to ER NPCs), not playing tower defense. Breach music in a non-combat context feels jarring.
**Why it happens:** The brief assigned breach=Act3 assumes the entire Act 3 experience is combat-paced. But Act 3 includes ER exploration dialogue, which is tense but not a firefight.
**How to avoid:** Consider a tempo modifier or separate "Act 3 exploration" track. Short term: use breach music but reduce `musicBaseVolume` to 0.15 for Act 3 exploration (quieter urgency). Long term: add a fourth track. For v2.0, quieter breach music is acceptable — flag as polish debt.
**Warning signs:** Playtest feedback that Act 3 feels exhausting even during dialogue.

---

## Code Examples

### Act State Shape
```typescript
// Recommended shape for pq:save:v2 act section
// Integrates with Phase 11 unified schema
interface ActState {
  current: 1 | 2 | 3;
  act1Complete: boolean;
  act2Complete: boolean;
  musicTrack: 'music_hub' | 'music_exploration' | 'music_breach';
}

const ACT_MUSIC_MAP: Record<number, string> = {
  1: 'music_hub',
  2: 'music_exploration',
  3: 'music_breach',
} as const;
```

### Act Advance Check (React side)
```typescript
// Called inside handleExitRoom() after completedRooms updates
// Source: PrivacyQuestPage.tsx pattern + ENHANCEMENT_BRIEF act conditions

const checkActAdvance = useCallback((updatedCompletedRooms: string[]) => {
  const act = gameState.act;

  if (act.current === 1 && !act.act1Complete) {
    const act1Done = updatedCompletedRooms.includes('reception') &&
                     updatedCompletedRooms.includes('break_room');
    if (act1Done) {
      setGameState(prev => ({
        ...prev,
        act: { ...prev.act, current: 2, act1Complete: true, musicTrack: 'music_exploration' }
      }));
      eventBridge.emit(BRIDGE_EVENTS.ACT_ADVANCE, { newAct: 2, track: 'music_exploration' });
    }
  }

  if (act.current === 2 && !act.act2Complete) {
    const act2Done = updatedCompletedRooms.includes('lab') &&
                     updatedCompletedRooms.includes('records_room');
    if (act2Done) {
      setGameState(prev => ({
        ...prev,
        act: { ...prev.act, current: 3, act2Complete: true, musicTrack: 'music_breach' }
      }));
      eventBridge.emit(BRIDGE_EVENTS.ACT_ADVANCE, { newAct: 3, track: 'music_breach' });
    }
  }
}, [gameState.act]);
```

### EventBridge Act Advance Listener (ExplorationScene side)
```typescript
// Source: pattern from ExplorationScene.ts REACT_SET_MUSIC_VOLUME handler

// In create():
eventBridge.on(BRIDGE_EVENTS.ACT_ADVANCE, this.onActAdvance, this);

// In shutdown():
eventBridge.off(BRIDGE_EVENTS.ACT_ADVANCE, this.onActAdvance, this);

private onActAdvance = (data: { newAct: number; track: string }) => {
  this.crossfadeToMusic(data.track);
};
```

### Capturing Key Decision Flags

**Decision 1: Fax incident (`fax_machine_freddy` scene)**
```typescript
// In handleDialogueComplete(), check which choice was made in fax_machine_freddy scene
// gameData.json choice scoring: reported=+20, delayed=-15, ignored=-20
// Need to store which answer was chosen — currently only score is stored, not choice ID
// Solution: gameData.json choices need an optional `flagKey` + `flagValue` property

// New gameData.json shape for flagged choices:
{
  "text": "Document the incident and notify your Privacy Officer immediately.",
  "score": 20,
  "flagKey": "faxIncidentHandled",
  "flagValue": "reported",
  "feedback": "..."
}
```

**Decision 2: Vendor access (`vendor_access` scene)**
```typescript
// vendor_access: granting vendor your credentials = -15, proper IT request = +15
{
  "text": "Sure, just this once. You're a legitimate vendor.",
  "score": -15,
  "flagKey": "vendorAccessGranted",
  "flagValue": true
}
```

**Decision 3: Encounter result (Phase 13)**
```typescript
// Set by Phase 13's ENCOUNTER_COMPLETE event:
// eventBridge.on(BRIDGE_EVENTS.ENCOUNTER_COMPLETE, ({ passed }) => {
//   setGameState(prev => ({ ...prev, decisions: { ...prev.decisions, breachEncounterPassed: passed }}))
// })
```

### NPC Variant Scene Lines (Ready to Author)

**Security Analyst Sam in IT Office — references fax decision:**
- If `faxIncidentHandled === 'reported'`: "Word travels fast in compliance. I heard about the fax incident — you reported it right away. That instinct to notify? That's exactly what we need more of."
- If `faxIncidentHandled === 'ignored'` or `'delayed'`: "I'm going to level with you. We had a fax incident recently and it wasn't handled by the book. If something like that happens again, you come find me. Same day."
- Default (no flag): [existing scene]

**Records Clerk in Act 3 — references overall journey:**
- "You've been all over this hospital today. I've heard about you from Riley, from the lab folks... You're paying attention to the right things."

**HR Director in Break Room — referenced from Act 2 onwards:**
- "You know what the biggest privacy risk in any hospital is? Not the hackers. It's us. The tired staff, the good intentions, the shortcuts. That's what you've been learning about."

---

## Decision Flag Selection Rationale (NARR-04)

Research identified the highest-impact dialogue choices by absolute score change. The three decisions best suited for persistent callbacks:

| Decision | Scene | Why Memorable | Callback NPCs |
|----------|-------|---------------|---------------|
| Fax incident response | `fax_machine_freddy` | ±20 score — highest stakes; clear right/wrong with real-world consequence | Security Analyst Sam (IT Office); Records Clerk (Records Room) |
| Vendor credential sharing | `vendor_access` | ±15 score; IT-domain choice naturally referenced by IT NPCs | Security Analyst Sam (IT Office) |
| Breach encounter outcome | Phase 13 encounter | Binary pass/fail; clear consequence; Act 3 NPCs naturally react to "the incident" | ER Doctor (ER); any Act 3 NPC |

The `fax_machine_freddy` scene is in Break Room (Act 1). The `vendor_access` scene is in IT Office (Act 2/3 boundary). Both decisions are made before the NPCs who reference them are encountered — the callback feels earned because the player remembers making the choice.

**Why not more than 3?** FEATURES.md explicitly notes that full branching narrative is an anti-feature: "requires extensive conditional content authoring... risk of content gaps breaking narrative." 2-3 flags with 3-5 NPC variants is the sweet spot for feeling like a living world at 5% of the cost of full branching.

---

## What NARR-05 Actually Requires

NARR-05 states "department ordering matches narrative flow." This has two parts:

**Part A (Phase 12's job):** The door unlock chain enforces Reception → Break Room → Lab → Records → IT → ER order. Phase 14 depends on this being complete.

**Part B (Phase 14's job):** The act labels and music changes reinforce the narrative meaning of that ordering:
- Act 1 departments (Reception, Break Room): warm hub music, introductory NPCs, first encounters
- Act 2 departments (Lab, Records): exploration music, deeper content, tension building
- Act 3 departments (IT Office, ER): breach music, climax scenarios, hardest judgment calls

Phase 14 also adds environmental differentiation between acts: hallway cues that change between act 1 and act 3 pass-throughs. These are ambient — a bulletin board message, a small NPC line — not a new room.

---

## Open Questions

1. **Phase 12 completion dependency**
   - What we know: Current `roomData.json` unlock chain does not match narrative act grouping (ER unlocks after Reception, not after Act 2 as NARR-05 requires)
   - What's unclear: Phase 12 is "not started" — Phase 14 cannot proceed until Phase 12 delivers the correct ordering
   - Recommendation: Phase 14 planning must treat Phase 12 door unlock output as a hard dependency. Phase 14 Wave 0 tasks should verify the ordering before writing act conditions.

2. **`fax_machine_freddy` decision capture**
   - What we know: `gameData.json` scene choices only store `score` and `feedback` — no `flagKey`/`flagValue`
   - What's unclear: Does Phase 13's encounter result schema also need to be settled before Phase 14 writes the encounter-based act 2→3 condition?
   - Recommendation: Add `flagKey` and `flagValue` optional fields to the `gameData.json` choice schema (TypeScript interface + JSON data). `GameContainer` emits a new `BRIDGE_EVENTS.CHOICE_FLAG_SET` event when a flagged choice is made. This is a small schema extension, not a new system.

3. **`music_breach` in non-combat Act 3 exploration**
   - What we know: Breach music is designed for fast-paced TD gameplay, not RPG NPC dialogue
   - What's unclear: Will it feel appropriate during ER dialogue scenes?
   - Recommendation: Accept for v2.0 with reduced volume (0.15 vs. 0.25 musicBaseVolume). Note as polish debt for Phase 15 to revisit.

4. **Act advance timing relative to Phase 13 encounter**
   - What we know: Act 2→3 ideally triggers after both Lab+Records completion AND encounter attempted
   - What's unclear: If encounter is not yet complete (Phase 13 not done) when Phase 14 ships, what's the fallback trigger?
   - Recommendation: Make encounter a soft condition — act advances on department completion alone if `breachEncounterPassed` is null. When Phase 13 ships, encounter result enriches but doesn't block the transition.

---

## Sources

### Primary (HIGH confidence)
- `client/src/phaser/scenes/BootScene.ts` — confirmed track names: `music_hub`, `music_exploration`, `music_breach` (lines 91-93)
- `client/src/phaser/scenes/ExplorationScene.ts` — confirmed tween crossfade pattern (lines 1016-1035), `bgMusic` as `WebAudioSound` with tweakable `.volume` (line 1234), `paused` flag, EventBridge listener lifecycle
- `client/src/phaser/scenes/HubWorldScene.ts` — confirmed `music_hub` fade-in (lines 323-336), identical tween pattern
- `client/src/pages/PrivacyQuestPage.tsx` — confirmed state shape: `completedRooms`, `completedNPCs`, `completedZones`, `collectedItems`, localStorage keys, `handleExitRoom` callback structure
- `client/src/phaser/EventBridge.ts` — full BRIDGE_EVENTS catalog; confirmed events needed vs. events missing
- `client/src/data/roomData.json` — confirmed all 6 room IDs, NPC IDs, zone IDs, current unlock chain
- `client/src/data/gameData.json` — confirmed 45 scenes, choice score values, identified 3 highest-impact decision scenes for NARR-04
- `.planning/ENHANCEMENT_BRIEF.md` — three-act design (section 3), audio design (section 7), state management target (section 9)
- `.planning/research/FEATURES.md` — act progression flags pattern, audio act shift approach, anti-feature: full branching narrative
- `.planning/ROADMAP.md` — Phase 14 success criteria (lines 132-138), dependencies on Phase 12 and 13
- `.planning/config.json` — `workflow.nyquist_validation` absent (no Validation Architecture section needed)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in codebase; no new libraries needed
- Architecture: HIGH — all patterns derived from existing, working code
- Music crossfade: HIGH — tween target verified as `WebAudioSound.volume`, pattern exists in 3 scenes
- Decision flag system: MEDIUM — schema extension to `gameData.json` is new work, pattern is sound but needs careful implementation to avoid stale closures
- Department ordering / Phase 12 dependency: MEDIUM — current `roomData.json` confirms the mismatch; confident the fix lives in Phase 12 but Phase 14 cannot be fully verified until Phase 12 is done

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable stack; only invalidated if Phase 12 or 13 make architectural changes)
