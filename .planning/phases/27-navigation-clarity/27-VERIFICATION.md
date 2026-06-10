---
phase: 27-navigation-clarity
verified: 2026-06-10T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Fresh save in hospital_entrance — does the door toward Reception breathe with warm-gold aura while the other doors pulse blue or show nothing?"
    expected: "Exactly one door glows gold (breathing, 1600ms sine) — all others show available-blue ring or locked-red overlay. No gold on any other door."
    why_human: "renderDoorStates branching is correct in code, but the actual first-hop BFS result and visual contrast can only be confirmed by looking at the canvas."
  - test: "Enter Reception (first incomplete department) — does any door breathe gold?"
    expected: "No door shows the gold 'next' aura while the player is standing inside the next-objective room itself."
    why_human: "The guard (room.id === nextTarget) is present in code, but confirming no gold renders requires a live look."
  - test: "Stand still for 9+ seconds in Reception with un-met requirements (Riley, sign-in sheet, safety poster) — do faint sparkles appear?"
    expected: "A soft 3-particle white/pale-gold shimmer appears on one un-met objective every ~5s, cycling round-robin. No text, no arrows. Moving immediately stops sparkles."
    why_human: "Idle timer fires in update() — can only confirm visual appearance, timing feel, and input-cancellation by playing."
  - test: "Answer a dialogue question incorrectly — does audio feel proportional?"
    expected: "A soft thud (sfx_sorter_wrong at 0.35) plays, not the breach-alert horn. Red overlay + shake carry the rejection weight."
    why_human: "SFX key is verified correct in code; perceived proportionality is a subjective audio experience."
  - test: "Complete a zone (e.g., sign-in sheet in Reception) without leaving the room — does the glow ring disappear and a checkmark pop in?"
    expected: "The blue pulsing ring fades out (300ms), a green checkmark scales in with Back.easeOut bounce (250ms), a quiet tick plays. No room reload needed."
    why_human: "Animation timing, visual clarity of the pop, and the absence of jarring snaps require a live test."
  - test: "Complete an NPC dialogue scenario mid-session — does the sprite fade smoothly and show a checkmark?"
    expected: "Sprite fades to alpha 0.4 over 400ms (Sine.easeOut) with immediate grey tint, checkmark pops in with the same scale animation as zone completion. No snap."
    why_human: "The fade vs snap quality difference is a visual feel check."
---

# Phase 27: Navigation Clarity Verification Report

**Phase Goal:** The player always knows where to go next without being told twice: the next-objective door breathes with a soft glow, in-room remaining objectives are discoverable at a glance, and the moment-to-moment reward layer is audited against Commandments 1 and 8 with gaps filled.
**Verified:** 2026-06-10
**Status:** human_needed — automated checks fully pass; 6 live-look items deferred to user per established pattern
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Next-objective door breathes with warm-gold glow; locked/completed/available unchanged | VERIFIED | `renderDoorStates()` has 'next' branch at line ~2719 with particle_circle ADD blend aura (scale 5→7, alpha 0.22→0.45, 1600ms sine yoyo) + gold stroke ring (1600ms); distinct from blue available ring (1000ms). `doorVisuals.push` guards cleanup. |
| 2 | When player is inside the next-objective room, no door is marked 'next' | VERIFIED | `computeDoorStates` line 195: `if (room.id === nextTarget) return states;` — early return skips the BFS first-hop assignment entirely. |
| 3 | After ~9s idle in a room, un-met required objectives receive an occasional 3-particle sparkle cycling round-robin; stops on any input | VERIFIED | `IDLE_HINT_GRACE_MS=9000`, `IDLE_HINT_INTERVAL_MS=5000` at module top. `emitIdleHint()` at line ~2625 builds un-met target list from `completionRequirements`, fires 3-particle `particle_circle` explode on round-robin target. `lastActivityAt` reset at: `isMoving`, `movePath.length > 0`, `triggerInteraction`, `handleDoorInteraction`, `onDialogueComplete` — all input channels covered. |
| 4 | Demo mode door states are unchanged; 'next' derivation skipped for demo sessions | VERIFIED | `computeDoorStates` line 190: `if (isDemoActive()) return states;` — early return before `deriveNextTargetRoom()` is called. |
| 5 | Feedback audit table exists in 27-02-SUMMARY.md; all 17 exploration actions documented with audio + visual; wrong-answer honk replaced; live zone/NPC completion visuals implemented | VERIFIED | `27-02-SUMMARY.md` contains `## Feedback Audit` (confirmed present, 2 occurrences of heading). 17-row table covers all specified actions. `sfx_sorter_correct` at 0.45 and `sfx_sorter_wrong` at 0.35 confirmed in `BattleEncounterScreen.tsx` lines 74–78; `sfx_breach_alert` not present in that file. Zone glow registry + `addCompletionCheck()` helper + `updateCompletionState()` set-diffing rewrite all confirmed in `ExplorationScene.ts`. |

**Score: 5/5 truths verified**

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `.planning/REQUIREMENTS.md` | VIS-07 + VIS-08 definitions + traceability rows | VERIFIED | `grep -c "VIS-07\|VIS-08"` returns ≥4 matches. Both definitions present with full testable criteria. Traceability rows show `Complete` (updated from `Pending` post-execution). |
| `client/src/pages/UnifiedGamePage.tsx` | `DoorState` export, `deriveNextTargetRoom`, `findFirstHopDoorId`, updated `computeDoorStates` | VERIFIED | All four symbols confirmed at lines 123–199. `isDemoActive()` guard and `room.id === nextTarget` guard both present. 4 call sites for `computeDoorStates` all receive `DoorState`-typed result. |
| `client/src/phaser/scenes/ExplorationScene.ts` | 'next' render branch, idle-hint system, `zoneGlows` registry, `addCompletionCheck()`, `updateCompletionState()` rewrite | VERIFIED | All symbols confirmed: `idleHint`, `emitIdleHint`, `lastActivityAt`, `IDLE_HINT_GRACE_MS`, `zoneGlows`, `addCompletionCheck`, `updateCompletionState`, `prevCompletedNPCs`, `prevCompletedZones`. `doorStates` field and `init()` param union updated to include `'next'`. |
| `client/src/components/BattleEncounterScreen.tsx` | `sfx_sorter_correct` / `sfx_sorter_wrong` SFX swap | VERIFIED | Lines 74–78: correct → `sfx_sorter_correct` vol 0.45; incorrect → `sfx_sorter_wrong` vol 0.35. `sfx_breach_alert` is absent from file (no output on grep). Phase 27 VIS-08 comments present. |
| `.planning/phases/27-navigation-clarity/27-02-SUMMARY.md` | Feedback Audit table (Phase 27 success criterion 3) | VERIFIED | `## Feedback Audit` heading present (2 occurrences: frontmatter provides + body heading). 17-row table with Action / Audio / Visual / Status columns. All 4 fixed rows (7-10) marked `FIXED in 27-02`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `UnifiedGamePage.tsx computeDoorStates` | `ExplorationScene.ts renderDoorStates 'next' branch` | `REACT_LOAD_ROOM / REACT_UPDATE_DOOR_STATES` doorStates payload carrying `'next'` | WIRED | `EventBridge.ts` JSDoc for both events updated at lines 57, 61 to include `'next'` in union. ExplorationScene `onLoadRoom` and `onUpdateDoorStates` both typed as `Record<string, 'locked' | 'available' | 'completed' | 'next'>`. 4 call sites in UnifiedGamePage pass `computeDoorStates` result. |
| `this.room.completionRequirements` | `emitIdleHint()` target list | `requiredNpcs/requiredZones/requiredItems` filtered against `completedNPCs/completedZones/collectedItems` | WIRED | `emitIdleHint()` reads `this.room.completionRequirements` via optional chaining, builds un-met list by checking against the three Set fields. Guard: hallways without `completionRequirements` return early. |
| `UnifiedGamePage useEffect (~line 1167)` | `ExplorationScene.updateCompletionState` | `completedNPCs/completedZones/collectedItems` sync on gameState change | WIRED | `updateCompletionState` confirmed wired (verified in previous phases; Phase 27 only rewrote its body — the call site was not modified). `zoneGlows` map populated at zone render loop (~line 1079), consumed by `updateCompletionState` diff logic. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| VIS-07 | 27-01-PLAN.md | Next-objective door breathing gold pulse + idle-hint sparkle system | SATISFIED | `deriveNextTargetRoom` + BFS `findFirstHopDoorId` in UnifiedGamePage; `'next'` branch in `renderDoorStates`; idle-hint system with 9s grace + 5s interval. |
| VIS-08 | 27-02-PLAN.md | Feedback audit table + proportional interaction responses | SATISFIED | Audit table in 27-02-SUMMARY.md; `sfx_sorter_correct/wrong` in BattleEncounterScreen; `zoneGlows` + `addCompletionCheck` + `updateCompletionState` rewrite in ExplorationScene. |

No orphaned requirements — both IDs from plan frontmatter map to this phase and are accounted for.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

Scanned modified files for TODO/FIXME/placeholder, empty returns, and console-only handlers. None found in Phase 27 additions. The one `console.warn` in `emitIdleHint` is absent — implementation silently skips on missing texture as designed.

---

### Preserved Behaviors (Regression Check)

| Behavior | Expected | Status |
|----------|----------|--------|
| Locked-door bump SFX | `sfx_breach_alert` at `volume: 0.25` | VERIFIED — line 2842: `this.sound.play('sfx_breach_alert', { volume: 0.25 })` with Phase 20 FIX-03 comment intact |
| Phase 12 door interaction logic | `handleDoorInteraction` unchanged | VERIFIED — plan explicitly stated "Do NOT change `handleDoorInteraction`"; only `renderDoorStates` received the new branch |
| Demo mode door states | No 'next' in demo | VERIFIED — `isDemoActive()` early return at line 190 before any BFS |
| `useGameState.ts` | Zero modifications | VERIFIED — `git diff` against Phase 27 window returns 0 lines for this file |
| Build cleanliness | `npm run check` and `npm run build` both exit 0 | VERIFIED — tsc exits clean; build produces output with no errors (chunk size warning is pre-existing, not a failure) |

---

### Human Verification Required

The following 6 items are live-look checks per the established project pattern. Automated checks for all of them pass. They are deferred to user review, not treated as gaps.

#### 1. Next-door gold aura visual contrast

**Test:** Load a fresh save in hospital_entrance, walk around without completing anything.
**Expected:** Exactly one door (toward Reception) shows a breathing warm-gold aura. All other doors show the blue available pulse ring or red locked overlay — none with gold.
**Why human:** renderDoorStates branching verified in code; actual BFS first-hop resolution and the visual contrast between gold and blue at 16-bit pixel scale requires a live canvas look.

#### 2. In-room no-next guard

**Test:** Enter Reception (the next incomplete department).
**Expected:** No door in Reception shows a gold aura. Objectives are in-room — the visual hint system should be silent on doors.
**Why human:** The `room.id === nextTarget` code guard is correct; confirming the absence of gold rendering requires a live check.

#### 3. Idle-hint sparkle feel

**Test:** Stand still for 10+ seconds in Reception (Riley, sign-in sheet, safety poster all un-met). Then move.
**Expected:** One un-met objective receives a soft 2-3 particle white/gold shimmer every ~5s, cycling targets. Moving immediately and completely stops further sparkles.
**Why human:** Timer-driven particle effect — confirmed correct in code; the Zelda-environmental-shimmer feel (not quest-marker nagging) is a judgment call.

#### 4. Wrong-answer audio proportionality

**Test:** Start a dialogue, select a wrong answer.
**Expected:** A soft thud plays (not the breach-alert horn). The red overlay + shake remain the primary rejection signal; audio is an accent, not a jolt.
**Why human:** The SFX key swap is verified in code. Perceived proportionality is an audio experience check.

#### 5. Live zone completion visual

**Test:** In Reception, interact with the sign-in sheet zone and complete it without leaving the room.
**Expected:** The blue pulsing ring fades out (~300ms), a green checkmark pops in with a slight bounce (~250ms), a quiet tick sound plays. No room reload occurs.
**Why human:** Animation timing and visual quality of the pop-in vs snap-in difference requires a live look.

#### 6. Live NPC completion visual

**Test:** Complete Riley's dialogue scenario (all questions answered).
**Expected:** Riley's sprite fades to grey over ~400ms (not an instant color change), a checkmark pops in at the same scale-bounce as zone completion.
**Why human:** The fade-vs-snap quality difference is a visual feel check.

---

### Summary

Phase 27 goal is fully achieved at the code level. All five observable truths verify against the actual codebase:

- The 'next' door state flows end-to-end: `deriveNextTargetRoom` + BFS `findFirstHopDoorId` in React → `DoorState` union in payload → `renderDoorStates 'next'` branch in Phaser with particle_circle ADD blend aura (1600ms breathing, warm gold, scale 5→7, alpha 0.22→0.45) + gold stroke ring.
- Demo mode and the in-target-room condition are both guarded before 'next' can be assigned.
- The idle-hint sparkle system is wired at all input channels with correct constants (9s grace, 5s interval, 3 particles, round-robin).
- The wrong-answer honk is gone from BattleEncounterScreen — replaced with purpose-fit sorter SFX at proportional volume.
- Live zone/NPC completion visuals are implemented via the `zoneGlows` registry, `addCompletionCheck()` helper, and the set-diffing `updateCompletionState()` rewrite.
- The feedback audit table covers all 17 exploration-mode actions with audio + visual channels documented.
- `tsc` and `npm run build` both clean. `useGameState.ts` untouched. No new modals. Locked-door bump SFX preserved at `sfx_breach_alert` vol 0.25.

Six live-look items are deferred to the user — these are all visual/audio quality judgments that automated grep cannot substitute for. They follow the established pattern for this project and do not represent gaps.

---

_Verified: 2026-06-10_
_Verifier: Claude (gsd-verifier)_
