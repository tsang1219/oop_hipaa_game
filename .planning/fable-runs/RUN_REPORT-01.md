# RUN REPORT — 01 Playtest Sweep
**Date:** 2026-07-02 · **Mode:** read-only (no game code changed) · **Screenshots:** `screenshots/run01/`

## What I did

Played the game as an impatient first-timer via Playwright + the qa-bridge against `npm run dev` (port 8080):

1. **Boot flow (A\*)** — StartMenu → FULL GAME → character select → onboarding → lobby; reload/resume path.
2. **Full traversal (B\*)** — fresh save, real full-game mode (no `qa-no-save`), every room in UNLOCK_ORDER: talked to every NPC, examined every zone, collected every item, walked every door, tested a locked door and the walk-vs-space door behavior. Alternated dialogue choices like someone button-mashing.
3. **Act-3 / Breach Triage (C\*)** — seeded saves in both shapes (`currentAct: 3` = what the game writes; `actProgress: 3` = what the scene reads) to isolate the act-gate; played the triage queue end-to-end behind an instrumentation shim.
4. **Side modes (D\*)** — standalone Tower Defense and Demo smoke tests from the StartMenu.
5. **IT-office repros (E\*/F\*)** — isolated decline-vs-accept paths for the TD encounter, including a clean accept → play → debrief → return run.
6. **ER content (G\*)** — full ER room pass (skipping Priya) since the traversal was blocked by F-02.

Driver scripts live in the session scratchpad (not committed). Console errors/warnings were captured throughout.

## Coverage

| Area | Status |
|---|---|
| StartMenu / character select / onboarding / resume | ✅ exercised |
| All 12 rooms (6 depts + lobby + 5 hallways) | ✅ every NPC/zone/item/door (IT office only after workaround; ER via seeded save because progression is blocked by F-02) |
| Locked doors, door prompts, gates (observation/choice/social) | ✅ exercised |
| BreachDefense TD encounter (IT office) | ✅ decline path, accept path, defeat, full completion, return |
| PHI Sorter (Aiyana + Marcus; Tovar request modal only) | ⚠️ **unplayable** — soft-locked (F-01); probes + abort path exercised |
| Breach Triage (Priya, Act-3 ER) | ⚠️ unreachable in production (F-03); played end-to-end only via test shim |
| Standalone TD | ✅ smoke (boot, place, wave 1, Esc) — not all 10 waves |
| Demo mode | ✅ smoke (boot, Esc back) — not the full 4-room demo path |
| Win/ending | ❌ unreachable (F-04) — verified statically + full traversal ends in nothing |
| Audio *feel* | not assessable headless — only event/log evidence |

Final traversal state: 9 rooms completed, 15 NPCs, 10 zones, 10 items, privacyScore 36, `collectedStories: []` (see F-08).

---

## Punch list

Severity: **breaks-the-game** > major > minor > cosmetic. **Fun** = hurts-the-fun 1–5 (5 = kills the session).

### PHI Sorter (all three encounters)

**F-01 · breaks-the-game · Fun 5 — The sorter desk is soft-locked from the first document; every sorter encounter is unwinnable.**
Keyboard (←/→ + Enter/Space) and mouse clicks on both stamp pads commit nothing; progress stays `0 / 10 sorted`. The player sits through the 90-second shift doing nothing, then gets "KEEP PRACTICING — 0/10 correct".
Root cause (code, for triage): `PHISorterOverlay.tsx` — `docAnimState` initializes to `'entering'` (line ~142) and the **only** `setDocAnimState('active')` is inside the post-stamp cascade (line ~377). Nothing promotes the *first* document to `'active'`, and `handleStamp` bails unless `docAnimState === 'active'` (line ~276); the StampPad buttons are also `disabled` on the same condition (while looking enabled). Regression from the Phase 24 desk-format rewrite (`06b80a8`).
Repro: talk to Aiyana in the lobby → accept → press →, Enter, click REDACT — nothing happens.
Screenshots: `B02-entrance-aiyana_intake-sorter-desk-start`, `B02-entrance-aiyana_intake-sorter-after-probes`, `B02-entrance-aiyana_intake-sorter-no-debrief` (0:03 left, still 0/10), `B02-entrance-done` (KEEP PRACTICING 0/10 debrief). Reproduced identically with Marcus (`B09-lab-marcus_lab_aide-sorter-*`).
Notes: Esc abort works and the encounter stays replayable after abort (good). Timer-expiry → debrief → return also works.

**F-14 · minor · Fun 2 — Sorter opens with "Nice. You're getting the rhythm."** before the player has stamped anything (0/10). The good-band fallback opener fires on mount; over the soft-locked desk it reads as mockery. `B02-entrance-aiyana_intake-sorter-desk-start`.

### IT Office / BreachDefense TD encounter

**F-02 · breaks-the-game · Fun 5 — "NOT RIGHT NOW" is a trap: the SECURITY ALERT re-pops instantly, forever.**
Declining the narrative card resumes the scene while the player still stands inside the 1.5-tile trigger radius; `onResumeFromDecline` (ExplorationScene.ts:3259) resets `encounterTriggered = false`, so `update()` re-triggers on the next frame. The player can never decline — the modal loops until they accept or reload. While looping, the whole room is dead (no NPCs, no zones, no door). In the full traversal this made IT office uncompletable and blocked ER unlock.
Repro: walk to the IT-office workstation cluster (tile 9,6) → click NOT RIGHT NOW → card is back.
Screenshots: `E02-narrative-card`, `E03-after-decline` (card re-shown), `B14-it-done` (room dead behind the loop).
Clean control: accept → play → debrief → return works perfectly (`F03-back-in-it-office`, `F04-vendor-after-return`, `F05-tile-after-completion` — no re-trigger after completion, door nav fine, `F06-door-after-return`).

**F-05 · major · Fun 4 — Losing the TD encounter is mislabeled and permanent.**
Defeat debrief header says **"BREACH CONTAINED"** (amber shield) — reads like a win — over `DEFENSE RATING 0/100` and `+ 0 to Compliance Score`. And because the result is registry-recorded as completed, the encounter cannot be retried in-session: you keep the 0 forever. No encouragement, no retry CTA (contrast with the sorter's "KEEP PRACTICING" tone).
Screenshot: `B16-td-debrief`.

**F-06 · major · Fun 3 — The TD encounter has no exit.**
After accepting, there is no Esc/abort/X. If the player doesn't place a tower, wave 1 never starts — the screen sits at "Pick a defense below" indefinitely. Accepting is a one-way door into a possibly-unwanted 4-wave commitment.
Screenshot: `E07-td-defeat-debrief` (actually the parked wave-1 state after 5 minutes of no input).

### Act system / Breach Triage (ER)

**F-03 · breaks-the-game · Fun 5 — The act system never persists, so Act 3 content (Priya / Breach Triage) is unreachable, act music never changes, and encounter results are lost.**
Two stacked bugs:
1. **Save clobber:** `UnifiedGamePage.tsx` consolidated-persistence effect (line ~371) calls `writeSave()` with a fixed `SaveDataV2` shape that omits every extended field (`currentAct`, `act1Complete/act2Complete`, `actFlags`, `decisions`, `encounterResults`, `unifiedScore`, `currentRoomId`). It runs on every `gameState.state` change, after `useGameState`'s own merged write — last write wins, extended fields wiped. Runtime evidence: after completing reception+break_room and later lab+records (the act-advance conditions), the save shows `currentAct=undefined, act2Complete=undefined` (traversal log "ACT CHECK" lines); after finishing the triage encounter, `save.encounterResults=undefined`.
2. **Wrong field read:** `ExplorationScene.getCurrentAct()` (line 2440) reads `save.actProgress` — a field **nothing in the codebase writes** (only occurrence is that read). Even if `currentAct` survived, the scene would still see Act 1.
Consequences observed: Priya never spawns in ER with the game-written save shape (`C01-er-currentAct3-priya-spot` — empty tile at (8,12)); spawns only with a hand-pinned `actProgress:3` (`C02-er-actProgress3`). Act music never advances (ER plays Act-1 hub music). Act-based NPC dialogue variants on the Phaser side are stuck at Act 1. Resume-room (`currentRoomId`) is also wiped, so reload always restarts at the lobby.
**With the shim, the triage encounter itself is solid:** request modal → queue → follow-ups → "QUEUE CLEARED 15/17 · 88% · +11 COMPLIANCE SCORE" → clean return (`C03-priya-request`, `C04-triage-start`, `C05-triage-mid-8`, `C06-triage-debrief`, `C07-after-triage`).

**F-07 · major · Fun 3 — Encounter NPCs go mute after their encounter completes.**
Post-triage, Priya still shows the "!" marker and the "[SPACE] Talk to Priya" prompt — pressing SPACE does nothing at all. Same code path applies to Aiyana/Marcus/Tovar after sorter completion. Screen invites an interaction, delivers silence (Commandment 1 + 4).
Screenshot: `C08-priya-replay-attempt`.

### Room completion & progression rewards

**F-08 · major · Fun 4 — Completing a room has no celebration, and the patient-story reveals are dead content.**
- `REACT_ROOM_COMPLETE_FANFARE` has a listener in ExplorationScene (fanfare + VFX, Phase 15) but **no emitter anywhere** — it never fires.
- The `GameBanner "Room Cleared!"` in UnifiedGamePage is unreachable: `setRoomClearedBanner` is only ever called with `null`.
- The "ALL CLEAR" toast in `handleExitRoom` is dead code: the auto-complete effect adds the room to `completedRooms` the instant requirements are met, so the exit-time check never passes.
- Because the banner never fires, `handleRoomClearedComplete` → `PatientStoryReveal` never runs: the `patientStory` content authored for 6 rooms is unreachable, and `collectedStories` stays `[]` (verified in the final save after a full traversal).
What the player actually gets on room completion: the HUD flips to "ROOM CLEAR!" and door badges update. Nice, but it's the smallest moment in the feedback hierarchy for the biggest unit of progress (Commandments 6/8 inverted).
Screenshots: `B05-reception-done`, `B07-break-done` (HUD flip only).

**F-04 · breaks-the-game (for completionists) · Fun 4 — The game has no reachable ending.**
Win condition requires `completedNPCs.length >= totalScenarios` (26), but the 4 encounter-trigger NPCs (Aiyana, Marcus, Dr. Tovar, Priya) can never enter `completedNPCs` — max is 22. Talking to the Chief Compliance Officer (`final_boss_1`) after clearing everything just ends the dialogue. Completing the ER (last room) also produces nothing. A player who finishes 100% of reachable content gets no win screen, no credits, no "HIPAA CHAMPION" (the 100% milestone is equally unreachable — cap is 84%).

**F-09 · major · Fun 3 — Room HUD can never fill in rooms with encounter NPCs.**
The HUD counts *all* NPCs, but encounter NPCs never complete: lobby caps at NPCs 1/2, lab 3/4, records 4/5, ER 3/4 (Act 3). Completionists will hunt for a missing NPC that cannot be checked off. (In records, it's worse — see F-15.)
Screenshot: `B02-entrance-done` (room "complete", HUD shows NPCs 1/2).

**F-15 · minor · Fun 2 — The records choice gate permanently locks the other NPC.**
"Two people need help. Who do you assist first?" — *first* implies you'll get to both, but choosing the patient leaves the attorney forever gated ("isn't ready to talk yet" toast on every attempt, in every session). Dead content + wrong promise in the copy.
Screenshot: `B11-records-choice-gate`.

### Onboarding / doors / navigation

**F-11 · minor · Fun 2 — The onboarding instructions are wrong about doors.**
Intro modal: "Walk to a door — Go to the next area". Footer: "Walk to doors to navigate". Reality: standing at a door does nothing (verified: `nearDoor` set, no transition for 2.5s); SPACE is required, which only the door prompt bar reveals. A first-timer's literal first navigation attempt fails silently.
Screenshots: `A05-intro-modal`, `B04-standing-at-door`.

**F-12 · minor · Fun 2 — Locked doors show an inviting prompt.**
A locked door ([X] icon) still shows "[SPACE] Enter Reception". Pressing it delivers a red flash + alert honk. The prompt should say it's locked and *why* ("Talk to Riley first"). Feedback on the attempt exists (flash + soft alert) — the *invitation* is the bug.
Screenshot: `B01-entrance-locked-door-attempt`.

### Audio

**F-10 · major (first impression) · Fun 3 — Cold boot starts silent: BGM is skipped with no retry.**
On the first room load of every session, `music_hub` (2.6 MB) isn't in the audio cache yet; ExplorationScene logs `music_hub not ready, skipping BGM` and never retries — the lobby stays music-less until the player changes rooms. Reproduced in every session this run (also `music_breach` in ER). The game's first 30 seconds — the ones that set the tone — are silent.

### Visual state / polish

**F-21 · minor · Fun 2 — Stale "!" markers on completed NPCs.**
After "ROOM CLEAR! NPCs 5/5" in the break room, HR Director, Friend from Another Dept, and Coworker with Phone still show "!" quest markers (sprites do fade, the markers don't). Same in reception. "!" should clear (or become a check) on completion.
Screenshots: `B07-break-done`, `B05-reception-done`.

**F-16 · minor · Fun 1 — Demo mode shows the full-game onboarding modal.**
Phase 18 decided demo skips onboarding (the start menu already framed it), but the modal appears — its `useState` initializer runs at mount, before `startDemo()` sets the demo flag at character-confirm.
Screenshot: `D05-demo-boot`.

**F-17 · minor · Fun 1 — ExplorationScene boots briefly underneath standalone TD.**
The `bootPoll` fallback in UnifiedGamePage (line ~585) calls `startExploration()` without checking `pageModeRef`, so Exploration starts and is then stopped by the TD launch effect (evidence: `music_hub` warning fires during a pure TD session). This is the same class of bug as the "audible footsteps under TD HUD" issue the pageModeRef guard was added for — the guard covers `handleSceneReady` but not the poll fallback.

**F-13 · cosmetic · Fun 1 — Zone dialogues use a generic staff portrait with a DEV warning.**
Every zone dialogue logs `[DialoguePortrait] No sprite mapping for NPC id "observation" — falling back to staff sheet` and renders a random staff portrait for what is a *thing* (sign-in sheet, shredder), not a person. Dozens of warnings per playthrough.

**F-20 · cosmetic · Fun 1 — Labels clip at the canvas edge.**
Door labels truncate ("Recepti", "Hallwa"); edge NPC nameplates clip ("Frantic Family Member", attorney's "…with Subpoena").
Screenshots: `B01-entrance-locked-door-attempt`, `C04-triage-start`, `B11-records-choice-gate`.

**F-19 · minor (QA infra, not player-facing) — qa-bridge state fields are dead.**
ExplorationScene's `EXPLORATION_STATE_UPDATE` payload (`playerTileX/playerTileY`, `interactables`, `doors`) doesn't match the shape qa-bridge consumes (`playerPosition`, `roomNPCs`, `roomZones`, `roomItems`, `roomDoors`) — those `__QA__` fields are permanently `undefined`. Any test asserting on them is asserting on nothing. Commands and `nearDoor`/`nearbyInteractable`/`currentRoomId` work.

### Things that worked well (so you don't re-test them)

- Boot flow, character select, resume (RESUME/NEW GAME) — clean, zero console errors. `A01`–`A08`.
- Dialogue engine: portraits, typewriter, TRUST bar, choices, correct/wrong feedback SFX + flash, next-scene. `B05-reception-riley-dlg0-choices0`.
- Gates: observation (lab printout → lab tech, ER whiteboard → Dr. Martinez), social (gossiping coworker), choice modal UX itself. `B09-lab-results_printout-observation-hint`, `G03-whiteboard-observation`.
- TD encounter *when accepted*: onboarding → placement → 4 waves → debrief → clean return, no re-trigger after completion. `B15-*`, `F0*`.
- Breach Triage encounter (behind the act gate): tight UI, follow-up panels, accurate HIPAA content in debriefs, clean return. `C0*`.
- Standalone TD + Demo Esc-to-menu round trips. `D0*`.
- Next-objective door gold pulse and door check badges update live. Item/zone/NPC-level feedback (toasts, chimes, checkmark pops) consistently present.
- Locked-door *attempt* feedback (red flash + soft alert) exists — it's the prompt that's wrong (F-12).

---

## Suggested fix order (by unblocked value)

1. **F-01** (one-line class of fix: promote first doc to `active` on mount/doc-change) — unlocks all 3 sorter encounters.
2. **F-02** (don't reset `encounterTriggered` until the player leaves the radius) — unblocks IT office & the natural path to ER.
3. **F-03** (persistence merge + read `currentAct`) — unlocks Act 3 / Priya / act music / result persistence.
4. **F-04/F-09** (count encounter NPCs as completable, or exclude them from totals) — makes the game finishable.
5. **F-08** (emit the fanfare + wire the banner) — restores the core reward loop and 6 rooms of authored story content.

## Open questions

1. **Post-TD-return door nav failed once** in the full traversal (stuck in it_office after debrief dismiss, `B17-hall5-DESYNC`) but the clean repro passes (`F06-door-after-return`). Likely fallout from the F-02 decline loop earlier in that scene session; worth re-checking after F-02 is fixed.
2. **Is the attorney/patient mutual exclusion intended** (permanent per save)? If yes, the gate copy and the HUD totals should reflect it.
3. **"BREACH CONTAINED" as the defeat header** — intentional euphemism? It tests as a mixed signal against 0/100 + +0.
4. Sorter shift length (90s) can expire *during* the wrong-answer feedback dwell — couldn't evaluate pacing while F-01 stands; re-playtest the desk after the fix.
5. The knocked-over chairs in reception (`B05-reception-done`, bottom center) — art intent or rotated-sprite bug? Couldn't tell from data.

## Artifacts

- Screenshots: `screenshots/run01/` (117 files, prefixed by phase A–G, referenced above by name).
- Driver scripts + raw logs: session scratchpad only (read-only run; nothing committed).
