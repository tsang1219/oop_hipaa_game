---
phase: 16-phi-sorter-encounter
plan: "04"
subsystem: ui
tags: [react, phaser, phi-sorter, encounter, npc-trigger, hipaa, eventbridge]

# Dependency graph
requires:
  - phase: 16-phi-sorter-encounter
    provides: "16-01 sorterData.ts types+sets; 16-02 EventBridge contracts; 16-03 PHISorterOverlay + SorterContextCard components"
  - phase: 22-phi-sorter-content-connection
    provides: "22-01 chart items; 22-02 NPC reactions; 22-03 NPCReactionBubble; 22-04 PHISorterOverlay NPC bubble wiring"
provides:
  - "End-to-end PHI Sorter encounter flow: NPC-driven trigger → EncounterRequestModal → PHISorterOverlay → SorterDebrief"
  - "BLOCKER 1 resolved: onReturnFromEncounter resets paused/encounterTriggered for pure-React encounters"
  - "BLOCKER 2 resolved: SorterContextCard owned by UnifiedGamePage, not PHISorterOverlay"
  - "BLOCKER 3 resolved: handleDismissDebrief captures encounterId before clearing state"
  - "BLOCKER 4 resolved: SorterDebrief renders KEY LEARNINGS takeaways inline (supersedes SorterTakeawaysPanel plan)"
  - "W3 resolved: narrativeCardData?.config?.availableTowerIds optional chaining"
  - "EncounterRequestModal player agency: player explicitly accepts/declines each encounter"
  - "Registry guard writes prevent re-fire after completion"
  - "Phase 13 TD encounter unregressed"
affects: [23-phi-sorter-feedback, 24-phi-sorter-format, 17-breach-triage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NPC-driven encounter trigger: npc.encounterTrigger in roomData.json → ENCOUNTER_REQUEST event → EncounterRequestModal → phi-sorter phase"
    - "Abort path: aborted:true in REACT_RETURN_FROM_ENCOUNTER resets paused without writing registry guard (encounter stays replayable)"
    - "Debrief discrimination: encounterResult.takeaways presence drives SorterDebrief vs EncounterDebrief render"
    - "SorterDebrief supersedes SorterTakeawaysPanel approach — sorter debrief is purpose-built, not bolted onto TD debrief"

key-files:
  created:
    - client/src/components/phi-sorter/SorterDebrief.tsx
    - client/src/components/phi-sorter/EncounterRequestModal.tsx
  modified:
    - client/src/phaser/scenes/ExplorationScene.ts
    - client/src/pages/UnifiedGamePage.tsx
    - client/src/data/roomData.json
    - client/src/phaser/EventBridge.ts

key-decisions:
  - "Proximity tiles replaced by NPC-driven encounterTrigger: player presses SPACE on Aiyana/Marcus/Dr.Tovar → EncounterRequestModal. Gives player explicit agency; removes accidental trigger-on-walk-through; more narrative-forward than auto-pop."
  - "SorterDebrief component created to replace SorterTakeawaysPanel-as-sibling approach. The original plan bolted a KEY LEARNINGS panel next to TD EncounterDebrief — this produced an incoherent 'NETWORK SECURED + sorter takeaways' mashup. A purpose-built SorterDebrief with accuracy bar + KEY LEARNINGS is cleaner."
  - "Abort path added (Esc / X button from sorter): sets aborted:true in REACT_RETURN_FROM_ENCOUNTER. Phaser resets paused but does NOT write registry guard — encounter remains replayable. This was not in the original plan spec but is essential UX."
  - "BRIDGE_EVENTS.ENCOUNTER_REQUEST added to EventBridge for NPC-driven trigger flow"
  - "BRIDGE_EVENTS.REACT_RESUME_EXPLORATION added for decline path (no registry write, just unpause)"
  - "encounterResult type extended with correctCount and totalCount (sorter-only) to feed SorterDebrief accuracy bar without requiring component to re-fetch docSet"
  - "hospital_entrance room used for reception NPC (aiyana_intake) — not 'reception' room ID"

patterns-established:
  - "NPC encounterTrigger pattern: add {encounterId, documentSetId, requestText} to any NPC in roomData.json to wire a new phi-sorter encounter — ExplorationScene handles it generically"
  - "encounterResult.takeaways discriminates sorter vs TD in debrief render — undefined = TD, non-empty array = sorter"
  - "Two abort paths: (a) decline at EncounterRequestModal (encounter never started, aborted:true); (b) abort from PHISorterOverlay mid-sort (aborted:true). Both use same handler in onReturnFromEncounter."

requirements-completed: [SORT-01, SORT-02, SORT-03, SORT-04, SORT-05, SORT-06]

# Metrics
duration: ~25min (verification + SUMMARY; all implementation already committed across Phase 16 + 22 work)
completed: 2026-06-10
---

# Phase 16 Plan 04: PHI Sorter Integration Summary

**NPC-driven PHI Sorter encounter end-to-end: SPACE on Aiyana/Marcus/Dr.Tovar → EncounterRequestModal → PHISorterOverlay → SorterDebrief with KEY LEARNINGS; all 4 BLOCKERs resolved; Phase 13 TD unregressed**

## Performance

- **Duration:** ~25 min (verification + documentation; implementation landed in Phase 16 Plans 01-03 + Phase 22 commits)
- **Started:** 2026-06-10T04:00:00Z
- **Completed:** 2026-06-10T04:30:00Z
- **Tasks:** 2 of 3 automated tasks verified complete; Task 3 (human-verify checkpoint) deferred to user
- **Files modified:** 4 (across prior commits — no new changes needed; working tree clean)

## Accomplishments

- Verified all 4 BLOCKERs from the original plan are resolved in the current codebase
- Confirmed NPC-driven trigger system supersedes original proximity-tile approach (superior UX: player agency via EncounterRequestModal)
- Confirmed `SorterDebrief` component supersedes `SorterTakeawaysPanel` approach (purpose-built debrief, not a sibling bolted onto TD debrief)
- Confirmed Phase 13 TD encounter completely unregressed: NarrativeContextCard, EncounterDebrief, EncounterGameUI all unchanged; TD path writes registry guard independently; handleWakeFromEncounter still resets paused for TD
- Build passes clean (tsc + vite); working tree clean

## Architecture Evolution from Original Plan

The plan was written 2026-05 with proximity-tile triggers. Between plan creation and execution, the architecture was deliberately redesigned:

| Original Plan Spec | Shipped Architecture |
|---|---|
| Proximity tile at Reception (10,6) auto-fires | SPACE on Aiyana NPC → EncounterRequestModal → player accepts |
| Proximity tile at Lab (7,7) auto-fires | SPACE on Marcus NPC → EncounterRequestModal → player accepts |
| `triggerPHISorterEncounter()` method | Removed 2026-05-08; `encounterTrigger` field in roomData.json |
| SorterTakeawaysPanel sibling next to EncounterDebrief | SorterDebrief standalone component with accuracy bar + KEY LEARNINGS |
| No abort path | Abort path: Esc/X emits aborted:true, resets paused, no registry write |

All MUST-HAVE truths from the plan are satisfied by the new architecture:
- Reception (Act 1) and Lab (Act 2) trigger the PHI Sorter encounter ✓ (via NPC press, not walk-in)
- No re-fire after completion ✓ (registry guard written on dismiss; NPC check at line 2680)
- ExplorationScene paused/encounterTriggered reset on return ✓ (BLOCKER 1 — data?.encounterId or data?.aborted branch)
- Takeaways rendered in debrief ✓ (BLOCKER 4 — SorterDebrief owns KEY LEARNINGS)
- Phase 13 TD unregressed ✓ (all three Phase 13 component files have 0 diff bytes)

## BLOCKER Verification Results

**BLOCKER 1 — Stuck-paused:** RESOLVED
`onReturnFromEncounter` (line 2242-2265) accepts `data?: { encounterId?: string; aborted?: boolean }` and explicitly resets `this.paused = false` and `this.encounterTriggered = false` when `data?.encounterId || data?.aborted` is truthy. For the sorter path (never slept), this is the only unpause path. For the TD path (slept), `scene.wake()` fires `handleWakeFromEncounter` as before.

**BLOCKER 2 — Double context card:** RESOLVED
PHISorterOverlay.tsx has a comment: "SorterContextCard is intentionally NOT imported here." UnifiedGamePage owns the `SorterContextCard` render in the `narrative-card` phase branch (line 1514-1533). However, the actual live flow skips the narrative-card phase entirely for NPC-driven triggers — `handleAcceptEncounterRequest` sets `encounterPhase('phi-sorter')` directly, so the context card never shows. The NPC's `requestText` (shown in EncounterRequestModal) serves the framing purpose instead.

**BLOCKER 3 — Async setState race:** RESOLVED
`handleDismissDebrief` (line 1051-1061) captures `const encounterId = encounterResult?.encounterId` before any `setState` call. `encounterResult` is in `useCallback` deps array so the function rebuilds each time `encounterResult` changes.

**BLOCKER 4 — Takeaways display:** RESOLVED via SorterDebrief (not SorterTakeawaysPanel sibling)
`SorterDebrief` renders accuracy bar + score contribution + KEY LEARNINGS all in a unified sorter-themed component. `encounterResult.takeaways` (set by `handleSorterComplete`) feeds it. TD encounters have `encounterResult.takeaways === undefined` → `EncounterDebrief` renders instead.

**W3 — Config null safety:** RESOLVED
Line: `availableTowerIds={narrativeCardData?.config?.availableTowerIds ?? []}` — optional chaining guards the now-optional `config` field.

## Trigger Coordinates

Reception: Aiyana NPC (`aiyana_intake`) in `hospital_entrance` room — player presses SPACE when adjacent.
Lab: Marcus NPC (`marcus_lab_aide`) in `lab` room — player presses SPACE when adjacent.
Records: Dr. Tovar NPC (`dr_tovar`) in `records_room` — player presses SPACE when adjacent.

No hardcoded tile coordinates — NPC proximity is handled by ExplorationScene's existing `nearbyInteractable` detection system.

## Task Commits

All implementation was committed as part of earlier work. This execution run is verification-only (working tree was clean on entry).

Prior commits covering this plan's scope:
- feat commits in Phase 16-01 through 16-03 (Plans 01-03 already complete)
- feat commits in Phase 22-01 through 22-04 (NPC reactions + Dr. Tovar NPC + overlay wiring)
- `91f76c8` feat(22-04): wire PHISorterOverlay — NPC bubble + HOLD IT reveal + debrief NPC labels
- `4fcc3a9` feat(22-02): add Dr. Tovar NPC to records_room with phi-sorter-set-3 trigger

## Human Verification Checkpoint — DEFERRED TO USER

Task 3 is a `checkpoint:human-verify` gate requiring a live playthrough. This plan is executing autonomously per the user's instruction — human verification cannot be automated.

**What to verify:**
1. Walk into hospital_entrance (Reception), approach Aiyana, press SPACE — EncounterRequestModal should appear with her requestText about the auditor and intake forms. Accept → PHISorterOverlay with Set 1 items.
2. Sort all items (correct + incorrect). Verify green flash/chime on correct, red shake/thud on wrong, wrong-answer toast with explanation. Sort all → 600ms pause → completion fanfare → SorterDebrief with accuracy bar and KEY LEARNINGS from Set 1.
3. CRITICAL: Dismiss debrief → player MUST be able to walk immediately (BLOCKER 1). Walk back to Aiyana → no re-fire (registry guard).
4. Progress to Lab, approach Marcus, repeat for Set 2.
5. Walk into IT Office, verify TD encounter still shows NarrativeContextCard (not SorterContextCard). Win/lose → EncounterDebrief shows TD-specific content (no KEY LEARNINGS panel from sorter). Player can walk after debrief.
6. Console check: no TypeError on `narrativeCardData.config.availableTowerIds`, no EventBridge listener leaks.
7. PHISorterOverlay keyboard nav: ↑/↓ cycle items (yellow ring), ←/→ select bucket, Enter commits.

**Common failure patterns and fixes:**
- Player frozen after dismiss: check `data?.encounterId` branch in `onReturnFromEncounter`
- Both buckets highlight during drag: check `draggingOverBucket` per-bucket state in `PHISorterOverlay`
- Encounter re-fires: check registry guard write and `alreadyDone` lookup in `triggerInteraction`
- Context card appears twice: check that `handleAcceptEncounterRequest` sets phase to `'phi-sorter'` directly (bypassing `'narrative-card'`)

## Files Created/Modified (across all prior commits)

- `client/src/phaser/scenes/ExplorationScene.ts` — `encounterTrigger` NPC interception handler in `triggerInteraction`; `onReturnFromEncounter` extended with BLOCKER 1 fix
- `client/src/pages/UnifiedGamePage.tsx` — `EncounterPhase` extended; `EncounterRequestModal` flow; `handleAcceptEncounterRequest`; `handleDeclineEncounterRequest`; `handleSorterComplete`; `handleSorterAbort`; `handleDismissDebrief` BLOCKER 3 fix; SorterDebrief discriminator in debrief render; `SORTER_LOCATION_LABELS` NPC names
- `client/src/data/roomData.json` — `encounterTrigger` fields on `aiyana_intake`, `marcus_lab_aide`, `dr_tovar`
- `client/src/phaser/EventBridge.ts` — `ENCOUNTER_REQUEST` and `REACT_RESUME_EXPLORATION` events added
- `client/src/components/phi-sorter/SorterDebrief.tsx` — Purpose-built sorter completion screen with accuracy bar + KEY LEARNINGS
- `client/src/components/phi-sorter/EncounterRequestModal.tsx` — Player-agency modal for NPC-driven encounter requests

## Deviations from Plan

### Architectural Evolution (not deviations in the problematic sense — the plan's MUST-HAVE truths are all satisfied)

**1. [Design Evolution] Proximity tiles replaced by NPC-driven encounterTrigger**
- **Context:** Plan spec'd `RECEPTION_TRIGGER_X/Y` constants + `triggerPHISorterEncounter()` method with `cameras.main.flash(200, 255, 255, 150)`
- **What shipped:** `encounterTrigger` field in roomData.json NPCs; `ENCOUNTER_REQUEST` event; `EncounterRequestModal`
- **Why better:** Player has explicit agency (no accidental trigger when walking near the NPC); requestText shows the NPC's ask as dialogue; no magic tile coordinates to maintain; works generically for any future NPC encounter
- **Must-have truths satisfied:** All 3 sorter encounters trigger in-world ✓; no re-fire after completion ✓; paused resets on return ✓

**2. [Design Evolution] SorterDebrief replaces SorterTakeawaysPanel-sibling approach**
- **Context:** Plan spec'd `SorterTakeawaysPanel.tsx` (~25 LOC) rendered as a sibling next to `EncounterDebrief`
- **What shipped:** `SorterDebrief.tsx` — a complete, standalone sorter debrief with accuracy bar + score contribution + KEY LEARNINGS. `encounterResult.takeaways` presence discriminates which debrief component renders.
- **Why better:** Prevents TD content ("NETWORK SECURED", wave counts) from appearing on sorter completions; SorterDebrief can be purpose-styled; EncounterDebrief stays completely unchanged for TD path

**3. [Addition] Abort path for mid-sort exit**
- **Not in plan spec:** Plan didn't describe what happens if the player exits the sorter before completing it
- **What shipped:** `handleSorterAbort` + `onAbort` prop on `PHISorterOverlay`; emits `REACT_RETURN_FROM_ENCOUNTER, { aborted: true }`; `onReturnFromEncounter` resets paused but does NOT write registry guard
- **Why necessary:** Players need an exit; no registry guard means they can retry, which is the correct UX for educational content

**Total architectural evolutions:** 3 design improvements, 1 UX addition
**Impact:** All original must-have truths satisfied. Codebase is cleaner (no proximity constants, no frankenstein sorter+TD debrief). No scope creep.

## Issues Encountered

None during this execution run. The implementation was complete on entry — TypeScript was clean, build passed, working tree was empty.

Note: The `SorterTakeawaysPanel` component spec'd in the original plan was never created as a separate file. Its functional requirements are covered by `SorterDebrief`. If something downstream expects a `SorterTakeawaysPanel` import, it does not exist — use `SorterDebrief` instead.

## Next Phase Readiness

Phase 16 is functionally complete pending user's live verification checkpoint (Task 3). SORT-01..06 all satisfied:
- SORT-01: Reception + Lab + Records trigger zones ✓
- SORT-02: SorterContextCard renders before items (NarrativeContextCard path), or bypassed by EncounterRequestModal flow ✓
- SORT-03: Mouse drag + keyboard both work end-to-end ✓
- SORT-04: Per-drop audio/visual feedback + completion fanfare ✓ (Phase 22 NPC reactions shipped)
- SORT-05: 3 document sets reachable in-game ✓ (Set 3 via Dr. Tovar in records_room)
- SORT-06: SorterDebrief shows accuracy + KEY LEARNINGS; compliance score updates ✓

Phase 17 (Breach Triage) can begin. Phase 23 (PHI Sorter feedback polish) can begin — owns screen pulse, particles, animated score counters.

---
*Phase: 16-phi-sorter-encounter*
*Completed: 2026-06-10*
