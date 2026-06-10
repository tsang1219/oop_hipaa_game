---
phase: 17-breach-triage-encounter
plan: 03
subsystem: ui
tags: [react, typescript, phaser, hipaa, breach-notification, triage, game-loop, encounter-wiring]

# Dependency graph
requires:
  - phase: 17-breach-triage-encounter
    provides: "triageData.ts (Plan 01) + BreachTriageOverlay/TriageDebrief (Plan 02)"
  - phase: 16-phi-sorter-encounter
    provides: "encounter lifecycle pattern: schema encounterTrigger, ExplorationScene spawn loop, ENCOUNTER_REQUEST flow, EncounterRequestModal, debrief discriminator, registry guard, abort path"
provides:
  - "End-to-end Breach Triage encounter: Act 3 ER Priya NPC → EncounterRequestModal → BreachTriageOverlay → handleTriageComplete → TriageDebrief → registry guard"
  - "shared/schema.ts: encounterType + minAct optional fields on encounterTrigger (backward-compatible)"
  - "roomData.json: priya_privacy_officer NPC in er room, act-gated (minAct:3), demo-excluded, optional (not in completionRequirements)"
  - "ExplorationScene.ts: minAct spawn gate + demo exclusion for any NPC with encounterTrigger.minAct; ENCOUNTER_REQUEST payload includes encounterType"
  - "UnifiedGamePage.tsx: 'breach-triage' EncounterPhase + handleTriageComplete + TriageDebrief discrimination + SORTER_LOCATION_LABELS['breach-triage-er']"
  - "HIPAA_TRAINING_FRAMEWORK.md: §3.1 + §3.3 upgraded to STRONG; 500+ threshold gap closed; 18 STRONG / 12 ADEQUATE"
affects:
  - "Any future phase adding act-gated NPCs (can reuse minAct pattern)"
  - "Phase 23/24 PHI Sorter polish (UnifiedGamePage encounter phase machine extended)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "minAct NPC spawn gate: ExplorationScene NPC loop reads encounterTrigger.minAct via type assertion, continues (skips) when act < minAct or isDemoActive()"
    - "encounterType discriminator: extends ENCOUNTER_REQUEST payload and handleAcceptEncounterRequest branch — absent = phi-sorter (backward compat)"
    - "kind:'triage' debrief discriminator: encounterResult.kind checked first in debrief render; sorter takeaways check second; TD fallback last"

key-files:
  created:
    - .planning/phases/17-breach-triage-encounter/17-03-SUMMARY.md
  modified:
    - shared/schema.ts
    - client/src/data/roomData.json
    - client/src/phaser/scenes/ExplorationScene.ts
    - client/src/phaser/SpriteFactory.ts
    - client/src/phaser/EventBridge.ts
    - client/src/pages/UnifiedGamePage.tsx
    - .planning/HIPAA_TRAINING_FRAMEWORK.md

key-decisions:
  - "minAct gate implemented at NPC spawn time (not at interaction time) — Priya simply does not exist in the room before Act 3, so there is no 'this NPC is locked' confusion"
  - "handleSorterAbort reused as onAbort for BreachTriageOverlay — it is encounter-agnostic (emits aborted:true, no registry write), no changes needed"
  - "kind:'triage' checked first in debrief discrimination (before takeaways check) — prevents future sorter encounters from accidentally matching if they also have takeaways"
  - "§3.1 and §3.3 both ADEQUATE→STRONG: the 9 triage incidents cover the exact gaps that kept Breach Notification from STRONG — the 500+ threshold, safe harbor, and presumption rule were all absent before"

patterns-established:
  - "Act-gated NPC: set encounterTrigger.minAct in roomData.json; ExplorationScene spawn loop skips automatically — zero Phaser scene code changes needed for future act-gated NPCs"
  - "New encounter type wiring: (1) schema.ts optional field, (2) roomData NPC + encounterType, (3) SpriteFactory texture map, (4) ExplorationScene passthrough in ENCOUNTER_REQUEST emit, (5) UnifiedGamePage: state types + accept branch + completion handler + render branch + debrief discrimination"

requirements-completed: [TRIA-01, TRIA-06]

# Metrics
duration: 6min
completed: 2026-06-10
---

# Phase 17 Plan 03: Encounter Wiring Summary

**End-to-end Breach Triage encounter wired through the existing encounter lifecycle: Priya NPC in Act 3 ER with minAct gate + demo exclusion, ENCOUNTER_REQUEST encounterType passthrough, UnifiedGamePage breach-triage phase branch + handleTriageComplete + TriageDebrief discrimination, HIPAA framework §3.1+§3.3 upgraded to STRONG**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-10T04:51:19Z
- **Completed:** 2026-06-10T04:57:42Z
- **Tasks:** 3
- **Files modified:** 7 (schema.ts, roomData.json, ExplorationScene.ts, SpriteFactory.ts, EventBridge.ts, UnifiedGamePage.tsx, HIPAA_TRAINING_FRAMEWORK.md)

## Accomplishments

- Priya the Privacy Officer spawns in the ER at tile (8,12) only in Act 3 full-game (minAct:3, demo-excluded), with request text in her exhausted voice — encounter is optional (not in completionRequirements)
- Full encounter lifecycle: accept → BreachTriageOverlay (`breach-triage-set-1`) → handleTriageComplete → TriageDebrief via `kind:'triage'` discriminator → handleDismissDebrief writes registry guard via REACT_RETURN_FROM_ENCOUNTER; decline/abort replayable
- PHI Sorter (Aiyana, Marcus, Dr. Tovar) and TD (IT Office) encounter flows byte-identical in behavior — all changes are additive
- HIPAA Training Framework Part 3: §3.1 ADEQUATE→STRONG (encryption safe harbor, good-faith exception, 50-year rule, ransomware presumption scenario-tested); §3.3 ADEQUATE→STRONG (500+ threshold gap closed, BA→CE clock, GDPR 72-hour trap documented); coverage now 18 STRONG / 12 ADEQUATE

## Task Commits

1. **Task 1: Schema + roomData NPC + Phaser-side gating and passthrough** - `b1d296e` (feat)
2. **Task 2: UnifiedGamePage wiring — phase branch, completion handler, debrief discrimination** - `56443a8` (feat)
3. **Task 3: HIPAA framework rating update + full build verification** - `724e9b5` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `shared/schema.ts` — encounterTrigger extended: `encounterType: z.enum(['phi-sorter','breach-triage']).optional()` + `minAct: z.number().optional()` with backward-compat comment
- `client/src/data/roomData.json` — priya_privacy_officer NPC added to er.npcs (x:8, y:12, encounterType:'breach-triage', minAct:3); NOT in er.completionRequirements
- `client/src/phaser/scenes/ExplorationScene.ts` — NPC spawn loop: minAct gate + isDemoActive() check at top of loop body; ENCOUNTER_REQUEST emit: + encounterType field
- `client/src/phaser/SpriteFactory.ts` — `priya_privacy_officer: 'npc_officer'` added to npcTextureKey map
- `client/src/phaser/EventBridge.ts` — ENCOUNTER_REQUEST JSDoc updated: + `encounterType?: 'phi-sorter' | 'breach-triage'`
- `client/src/pages/UnifiedGamePage.tsx` — Imports: BreachTriageOverlay, TriageDebrief, getTriageIncidentSet; EncounterPhase union + narrativeCardData type + encounterRequest type + encounterResult type extended; handleAcceptEncounterRequest branched; handleTriageComplete added; breach-triage render branch added; debrief discrimination updated (kind:'triage' first); SORTER_LOCATION_LABELS + 'breach-triage-er'
- `.planning/HIPAA_TRAINING_FRAMEWORK.md` — §3.1 STRONG + 6 incident bullets; §3.2 triage bullet; §3.3 STRONG + 4 notification rule bullets + GDPR trap note + state-AG scope note; Coverage Summary 18 STRONG/12 ADEQUATE; Revision History Phase 17 row

## Decisions Made

- **minAct gate at spawn time, not interaction time:** Priya simply doesn't exist in the room before Act 3. No "locked NPC" UX needed — the encounter space is empty until the player reaches Act 3.
- **handleSorterAbort reused as onAbort:** The abort handler is already encounter-agnostic (emits REACT_RETURN_FROM_ENCOUNTER with aborted:true, skips registry write). No changes needed.
- **kind:'triage' checked first in debrief discrimination:** Prevents future sorter encounters from matching incorrectly if they happen to have takeaways. The discriminator hierarchy is: kind → takeaways → TD fallback.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 17 is complete: triageData.ts (Plan 01) + BreachTriageOverlay/TriageDebrief (Plan 02) + end-to-end wiring (Plan 03) all shipped
- Manual playthrough deferred to user (per established Phase 16/21/22 pattern): Act 3 full game → ER → SPACE on Priya → accept → keyboard-only run → debrief → walk immediately after dismiss → no re-fire on return; demo mode ER should show no Priya
- TRIA-01 and TRIA-06 requirements completed; TRIA-06 "THIN→ADEQUATE" target exceeded (§3.1+§3.3 both at STRONG)

## Self-Check

- `shared/schema.ts` modified: confirmed present in git diff
- `client/src/data/roomData.json` priya_privacy_officer: confirmed via node validation script (encounterType:'breach-triage', minAct:3, NOT in completionRequirements)
- `client/src/pages/UnifiedGamePage.tsx` wiring chain: breach-triage phase branch (1), kind='triage' discriminator (1), breach-triage-er label (1), handleTriageComplete (2), BreachTriageOverlay (2), TriageDebrief (4) — all confirmed
- `npm run check`: clean (0 TypeScript errors)
- `npm run build`: clean (1733 modules, 4.01s)
- Commits: b1d296e, 56443a8, 724e9b5 — all in git log

## Self-Check: PASSED

---
*Phase: 17-breach-triage-encounter*
*Completed: 2026-06-10*
