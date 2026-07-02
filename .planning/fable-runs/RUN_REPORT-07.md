# RUN REPORT — 07 Find → Fix → Verify Loop

**Date:** 2026-07-02 · **Branch:** `fable/fix-loop` · **Input:** RUN_REPORT-01 punch list (round-1 find phase) + Run 02's three risks · **Proof screenshots:** `screenshots/run07/` · **Verification drivers:** `tests/run07-verify-*.mjs` (run against `npm run dev` on :8080)

Every fix below has scripted behavioral proof (Playwright + qa-bridge assertions) and/or a screenshot. Nothing is "fixed" on code-reading alone.

---

## Round 1 — the four breaks-the-game items (+ load-bearing extras)

### Fixed

**F-01 · sorter soft-lock — FIXED** (`PHISorterOverlay.tsx`, commit `d33b4ce`)
Nothing ever promoted the FIRST document from `'entering'` to `'active'` (Phase 24 regression); every stamp bailed on the guard. Added an effect that activates any `'entering'` doc after its 300ms slide-in (sole path for doc 1, idempotent for the rest).
*Proof:* first stamp commits — counter reads `1 / 10 sorted` (`F01-desk-after-first-stamp.png`); full 10-doc shift reaches the debrief (`F01-sorter-debrief.png`). Driver: `run07-verify-round1.mjs` F-01a/b.

**F-02 · TD decline loop — FIXED** (`ExplorationScene.ts`, commit `99a3c64`)
`onResumeFromDecline` cleared `encounterTriggered` while the player still stood in the 1.5-tile radius → re-pop on the next frame, forever. Now a `encounterDeclined` flag suppresses the trigger until the player leaves the radius, then re-arms.
*Proof:* card stays dismissed 3.5s+ (`F02-after-decline-no-loop.png`), player can move, walking back re-triggers (`F02-retrigger-on-return.png`). Driver: F-02a/b.

**F-03 · act system never persists — FIXED (three stacked bugs, one more than run 01 found)** (commits `99a3c64` + `fc6df3a`)
1. *Save clobber:* UnifiedGamePage's persistence effect wrote a fixed 15-field shape after useGameState's merged write, wiping all 8 extended fields on every state change. Now merges over `loadSave()`.
2. *Wrong field read:* `getCurrentAct()` read `save.actProgress`, which nothing writes. Now reads `currentAct` (with `actProgress` fallback for QA-seeded saves).
3. **NEW:** `checkActAdvance` (Phase 14) was never called from anywhere — acts couldn't advance even in memory. Now invoked from the room auto-complete effect.
*Proof:* seeded Act-3 save survives 4s of persistence traffic with every extended field intact (F-03a); Priya spawns in ER with the game-written save shape and opens the triage request (`F03-priya-spawns-act3.png`, `F03-priya-triage-request.png`; Act-1 control shows her absent — F-03b/c/d); live playthrough of break_room with reception seeded flips the save to `currentAct=2, act1Complete=true` (F-03e, `run07-verify-round1b.mjs`).

**F-04 · unreachable ending — FIXED (plus a second layer run 01 couldn't see)** (commit `fc6df3a`)
- Winning an encounter now marks its host NPC complete (`ENCOUNTER_NPC_BY_ID` from roomData; victory-only) → 26/26 reachable. This also un-caps the room HUDs (F-09) for lobby/lab/ER.
- The win check counted STALE state and the CCO (no `isFinalBoss` flag → he IS one of the 26) — so even a 100% player needed to talk to the boss twice. Now counts the in-flight completion.
- EndScreen `26/27` double-count fixed.
*Proof:* seed 25 NPCs → one CCO conversation → **PRIVACY GUARDIAN win screen + trophy + "HIPAA CHAMPION!" 100% toast** (`F04-win-screen.png`). Driver: `run07-verify-round1c.mjs`.

**F-15 · records choice gate locks the other NPC forever — FIXED** (load-bearing for F-04; commit `fc6df3a`)
"Who do you assist FIRST?" now means first: completing the chosen person's scenario unlocks the other, with a "ready to talk now" notify.
*Proof:* choice → patient dialogue → attorney opens a real dialogue instead of the permanent "isn't ready to talk yet" toast (`F15-*.png`, F-15a).

**F-07 · mute encounter NPCs — FIXED, and it was worse than reported** (commit `99a3c64`)
The `alreadyDone` branch did a bare `return` after `paused = true` + dim overlay — every finished encounter NPC was a one-SPACE soft-lock, not just mute. Now unpauses, clears the dim, and shows a floating speech bubble with a per-NPC post-encounter line (new `completedText` on `encounterTrigger` in roomData; 4 lines authored — **new player-facing copy, flag for tone review**).
*Proof:* bubble on replay-talk, scene alive after (`F07-aiyana-replay-bubble.png`, F-07a).

**F-19 · dead qa-bridge state fields — FIXED** (pulled forward from round 3 because this run's own verification needed it; commit `99a3c64`)
Scene broadcast now matches the bridge contract: `playerPosition`, `roomNPCs/roomZones/roomItems` (with completed flags), `roomDoors`. Legacy fields kept.
*Proof:* every driver in this run asserts on `playerPosition`/`roomNPCs` — they work now.

**F-22 · NEW FINDING (major) · multi-scene dialogues silently truncate — FIXED** (commit `fc6df3a`)
`dialogueScenes` passed only the entry scene to GameContainer; every `nextSceneId` jump fell through to `onComplete`. The CCO's 3-scenario final exam played only scenario 1 (verified live before the fix). Full transitive chain now passed; all three boss scenarios play (see round1c iteration log).

### New findings still open after round 1

- **F-24 (new, major-ish):** `Cannot set properties of null (setting 'volume')` pageerror fired right after the live Act 1→2 advance (music crossfade path in ExplorationScene). Reproduced once; needs a stack + fix. → round 2.
- **F-23 (new, minor/UX):** the social gate (gossiping coworker) resolves on first SPACE with only a toast; a fast second press sometimes shows the toast again before the dialogue. Driver-visible; at human pace it behaved correctly in a focused probe (press 1 = toast, press 2 = dialogue). Watch, don't fix yet.
- Teleport-into-blocked-tile ejection (QA-only): `teleportTo` onto Phase-26 furniture lets physics eject the body over several frames — drivers now double-read for stability. Not player-facing.

### Round 1 punch-list status

| ID | Severity | Fun | Status |
|---|---|---|---|
| F-01 sorter soft-lock | breaks-the-game | 5 | **FIXED + verified** |
| F-02 decline loop | breaks-the-game | 5 | **FIXED + verified** |
| F-03 act persistence | breaks-the-game | 5 | **FIXED + verified** (3 stacked bugs) |
| F-04 unreachable ending | breaks-the-game | 4 | **FIXED + verified** (win screen reached) |
| F-15 choice gate lock | minor (load-bearing) | 2 | **FIXED + verified** |
| F-07 mute encounter NPCs | major (actually a soft-lock) | 3 | **FIXED + verified** |
| F-19 qa-bridge dead fields | QA infra | – | **FIXED + verified** |
| F-22 dialogue chain truncation | NEW major | 4 | **FIXED + verified** |
| F-09 HUD caps | major | 3 | Mostly fixed by F-04/F-15 counting; records room needs a re-check → round 2 |
| F-05/06/08/10 majors | major | 3–4 | → round 2 |
| F-24 volume pageerror | NEW | – | → round 2 |
| Run-02 risks (tests/save-validation/build) | – | – | → round 3 |
| F-11/12/13/14/16/17/20/21 minors | minor/cosmetic | 1–2 | → round 4 |

### Flagged for the user (decisions I did not make)

1. **New copy shipped** (needs tone sign-off): 4 post-encounter NPC lines (`completedText` in roomData.json), "\<NPC\> is ready to talk now" notify, and the F-15 behavior change itself (both records NPCs now reachable; the *choice* still gets recorded via decision flags, only the permanent lock is gone). If the mutual exclusion WAS intended, revert the F-15 hunk and the ending threshold needs a design change instead.
2. **Defeat semantics** (round 2 preview): I plan to make encounter defeat NOT registry-complete (retryable) + rename the "BREACH CONTAINED" defeat header. Both are design-adjacent; report will flag the wording.

---

*(Rounds 2+ appended below as they complete.)*
