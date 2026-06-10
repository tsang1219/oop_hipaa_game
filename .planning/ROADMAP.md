# Roadmap: PrivacyQuest + BreachDefense

## Milestones

- v1.0 **Polish** — Phases 1-5 (shipped 2026-03-01) — [archive](milestones/v1.0-ROADMAP.md)
- v1.1 **Sprite Overhaul** — Phases 6-10 (archived partial) — [archive](milestones/v1.1-ROADMAP.md)
- v2.0 **One Game** — Phases 11-15 (shipped 2026-03-28)
- v2.1 **Full Vision** — Phases 16, 17, 22-24 (SHIPPED 2026-06-10)
- v2.2 **Sponsor Demo** — Phases 18-21 (shipped 2026-05-08)
- v2.3 **Nintendo Polish** — Phases 25-27 (active — graphics/navigation/reward up-level toward the Nintendo Test)

## Phases

<details>
<summary>v1.0 Polish (Phases 1-5) — SHIPPED 2026-03-01</summary>

See [archive](milestones/v1.0-ROADMAP.md) for phase details.

</details>

<details>
<summary>v1.1 Sprite Overhaul (Phases 6-10) — ARCHIVED PARTIAL 2026-03-26</summary>

### Phase 6: Character Sprites
**Goal**: Player and all 8 NPCs move with AI-generated 4-direction spritesheets and proper walk cycle animations.
**Depends on**: Phase 5
**Requirements**: CHAR-01, CHAR-02, CHAR-03, CHAR-04
**Plans:** 2/2 plans complete
**Success Criteria** (what must be TRUE):
  1. Player character displays a distinct AI-generated pixel art sprite (not a colored rectangle) and animates through walk frames when moving in any direction.
  2. All 8 NPC types (Receptionist, Nurse, Doctor, IT Tech, Compliance Officer, General Staff, Patient, Visitor) display unique AI-generated sprites recognizable by their role outfit.
  3. Walk animations stop and return to idle when movement stops — no looping walk while standing still.
  4. NPCs display a subtle idle animation (breathing or blinking) when standing still.
  5. Walk animations work in both ExplorationScene and HubWorldScene without duplicate registration.

Plans:
- [x] 06-01-PLAN.md — Source 9 character spritesheets from pre-made sprite pack, select and customize for hospital roles, user approval checkpoint
- [x] 06-02-PLAN.md — Load spritesheets in BootScene, register walk + idle animations, wire ExplorationScene and HubWorldScene

### Phase 7: NPC Portraits
**Goal**: NPC dialogue screens show expressive AI-generated character portraits with multiple expression variants instead of placeholder SVG components.
**Depends on**: Phase 6
**Requirements**: PORT-01, PORT-02, PORT-03
**Success Criteria** (what must be TRUE):
  1. All 6 NPC dialogue portraits display as AI-generated 128x128 pixel art portraits in dialogue overlays.
  2. The placeholder SVG portrait components are no longer visible anywhere in the application.
  3. Each portrait switches expression during dialogue — at least one emotional variant appears at an appropriate dialogue moment.
**Plans**: Deferred to v2.1

### Phase 8: Furniture and Interactive Objects
**Goal**: Hospital rooms are furnished with AI-generated pixel art objects, and educational collectibles glow visually distinct from regular furniture.
**Depends on**: Phase 6
**Requirements**: FURN-01, FURN-02, FURN-03, ITEM-01, ITEM-02, ITEM-03
**Success Criteria** (what must be TRUE):
  1. All ~14 hospital room objects display as AI-generated sprites instead of colored rectangles.
  2. At least 3 furniture items display subtle idle animations.
  3. The 4 educational collectibles are visually distinguishable from regular furniture at a glance — they glow or sparkle.
  4. Collectibles play a pickup animation sequence when the player interacts with them.
**Plans**: Deferred to v2.1

### Phase 9: Floor Tiles
**Goal**: Hospital rooms render with AI-generated tileset floors that match each room's setting, replacing the programmatic checkerboard.
**Depends on**: Phase 8
**Requirements**: TILE-01, TILE-02, TILE-03
**Success Criteria** (what must be TRUE):
  1. All 8 floor tile variants are distinct and recognizable.
  2. The programmatic checkerboard floor is gone.
  3. Rooms use the contextually appropriate tile with visible wall/floor transitions.
**Plans**: Deferred to v2.1

### Phase 10: Final Integration and Cleanup
**Goal**: All sprites are loaded from a unified texture atlas, SpriteFactory.ts is deleted, and no programmatic fillRect textures remain anywhere.
**Depends on**: Phase 9
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. The file SpriteFactory.ts no longer exists in the codebase.
  2. ExplorationScene and HubWorldScene reference only new PNG texture keys.
  3. All PNG sprites are preloaded in BootScene and available across all scenes.
  4. Sprites are packed into a texture atlas loaded via `this.load.atlas()`.
**Plans**: Deferred to v2.1

</details>

---

### v2.0 One Game (Shipped 2026-03-28)

**Milestone Goal:** Transform PrivacyQuest + BreachDefense from two separate games into one cohesive hospital RPG with continuous navigation, integrated tower defense encounters, and a three-act narrative arc.

---

## Phase Details

### Phase 11: Pre-Restructure Foundation
**Goal**: The codebase is stable and save-format-safe before any restructure begins — known bugs fixed, v1 save data migrated to a single versioned schema.
**Depends on**: Phase 10 (v1.1 archived state)
**Requirements**: FOUN-03, FOUN-04
**Success Criteria** (what must be TRUE):
  1. The game loads in the browser with no console errors related to EventBridge listener leaks, dialogue scoring double-fires, or ExplorationScene shutdown misses.
  2. A returning player's v1.0 localStorage data (14 fragmented keys) is automatically migrated to a single `pq:save:v2` object on first boot — their room completion and score carry over.
  3. A fresh player starts with a clean `pq:save:v2` schema with no residual v1 keys present.
  4. All known pre-restructure bugs documented in FOUN-04 scope are verified fixed before Phase 12 begins.
**Plans:** 4 plans

Plans:
- [x] 11-01-PLAN.md — Create saveData.ts: SaveDataV2 schema, migrateV1toV2, loadSave, writeSave
- [x] 11-02-PLAN.md — Wire migration into PrivacyQuestPage + BreachDefensePage + GameContainer
- [x] 11-03-PLAN.md — ExplorationScene bug fixes: named REACT_ANSWER_FEEDBACK handler + scene.isActive() guards
- [x] 11-04-PLAN.md — PrivacyQuestPage stale closure fixes: functional setState + handleExitRoom dependency

### Phase 12: Unified Navigation
**Goal**: The player walks through a continuous hospital on a single route — door-to-door transitions with visual state, linear department unlock, backtracking, and no room picker.
**Depends on**: Phase 11
**Requirements**: FOUN-01, FOUN-02, NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, NAV-08
**Success Criteria** (what must be TRUE):
  1. The game runs entirely on `/` — navigating to `/privacy` or `/breach` does not exist as a separate experience; all mode switching happens inside Phaser.
  2. Walking into a door triggers a camera fade (~300ms out, black, ~300ms in) and the player appears at the matching door on the other side — standing in the correct position relative to where they entered.
  3. Locked doors display a dark tint with a visual "locked" indicator; available doors pulse with a glow; completed departments show a checkmark badge on their door.
  4. Departments unlock in order (Reception → Break Room → Lab → Records → IT → ER) — the player cannot walk into a locked area.
  5. The player can walk back through a completed department without restriction — completed doors open freely.
  6. The HallwayHub room picker menu is gone — no floating department selection UI exists anywhere.
**Plans:** 4 plans

Plans:
- [x] 12-01-PLAN.md — useGameState hook + UNLOCK_ORDER + EventBridge door constants
- [x] 12-02-PLAN.md — roomData.json: doors[] schema + hallway rooms + hospital_entrance
- [x] 12-03-PLAN.md — ExplorationScene: door detection, visual states, fade transition, spawn position
- [x] 12-04-PLAN.md — UnifiedGamePage + route collapse + HubWorldScene retirement + HallwayHub removal

### Phase 13: Encounter Integration
**Goal**: The inbound tower defense encounter launches from an in-world narrative trigger, runs in a condensed 4-wave format, and feeds results back to the shared game state — the player never leaves the Phaser game instance.
**Depends on**: Phase 12
**Requirements**: ENC-01, ENC-02, ENC-03, ENC-04, ENC-05, ENC-06, ENC-07
**Success Criteria** (what must be TRUE):
  1. Reaching the IT Office narrative trigger launches the tower defense encounter — ExplorationScene pauses in place (player position preserved) and BreachDefense starts as an overlay.
  2. The encounter opens with a narrative context card explaining why it is happening (e.g., "Dr. Patel flagged suspicious logins...") before the first wave begins.
  3. The encounter runs 4 waves with a condensed tower set — it completes in roughly 3-5 minutes.
  4. When the encounter ends, the player is returned to the exact room position they were standing in when it triggered — ExplorationScene resumes without reloading.
  5. The compliance score HUD updates during exploration to reflect both dialogue choices and encounter performance on a single unified meter.
  6. The encounter ends with a debrief screen showing score and 1-2 HIPAA takeaways before returning to the RPG world.
**Plans:** 4 plans

Plans:
- [x] 13-01-PLAN.md — Encounter constants (ENCOUNTER_WAVES_INBOUND, budgets, towers) + BreachDefenseScene parameterization via init(data)
- [x] 13-02-PLAN.md — EventBridge encounter events + ExplorationScene sleep/wake lifecycle + IT Office trigger zone
- [x] 13-03-PLAN.md — NarrativeContextCard + EncounterDebrief + EncounterHud components + UnifiedGamePage phase state machine
- [x] 13-04-PLAN.md — Encounter-mode terminal handlers in BreachDefenseScene + unified complianceScore + /breach route removal

### Phase 14: Three-Act Narrative Arc
**Goal**: The game has a felt narrative shape — acts advance based on completion, music shifts between acts, and NPCs acknowledge the player's earlier actions at key moments.
**Depends on**: Phase 12, Phase 13
**Requirements**: NARR-01, NARR-02, NARR-03, NARR-04, NARR-05
**Success Criteria** (what must be TRUE):
  1. The game advances from Act 1 to Act 2 to Act 3 based on department completion and encounter status — the player cannot trigger Act 3 without completing Act 2's requirements.
  2. Music shifts perceptibly between acts without a hard cut — the hub theme plays in Act 1, exploration theme in Act 2, breach theme in Act 3, and the transition crossfades smoothly.
  3. Act transitions happen through environmental cues and music only — no title card, chapter screen, or modal interrupts the player.
  4. At least 2-3 NPCs reference a specific earlier player decision when the player returns to their area — the dialogue text reflects what the player actually chose, not a generic line.
  5. Department ordering in the world matches narrative flow: Reception and Break Room are accessible in Act 1; Lab and Records gate Act 2; IT and ER are Act 3.
**Plans:** 4 plans

Plans:
- [x] 14-01-PLAN.md — Type contracts: narrative.ts (ActState, DecisionState), ACT_ADVANCE event, Choice flagKey/flagValue schema
- [x] 14-02-PLAN.md — React act progression: useGameState hook, checkActAdvance in handleExitRoom, decision flag capture
- [x] 14-03-PLAN.md — Phaser music crossfade: crossfadeToMusic in ExplorationScene, ACT_ADVANCE listener lifecycle
- [x] 14-04-PLAN.md — NPC variant dialogue: 4 new scenes in gameData.json, getSceneIdForNPC routing in PrivacyQuestPage

### Phase 15: Polish and Completion
**Goal**: Environmental storytelling, department completion fanfares, and a progress breadcrumb HUD make every accomplishment feel earned and the player's journey visible at all times.
**Depends on**: Phase 14
**Requirements**: NARR-06, NARR-07, NARR-08
**Plans:** 3 plans
**Success Criteria** (what must be TRUE):
  1. Hallway connectors between departments contain at least one ambient environmental detail (bulletin board text, prop, or NPC observation line) that changes or shifts between acts.
  2. Completing all NPCs, zones, and items in a department triggers a visible fanfare — a screen flash or sparkle effect, a chime, and a badge or checkmark that persists on the door.
  3. The HUD always shows the player's department completion status and current act — visible during exploration without interrupting play.

Plans:
- [x] 15-01-PLAN.md — hallwayContent.ts data file (5x3 content matrix) + ExplorationScene hallway board rendering
- [x] 15-02-PLAN.md — Fanfare sequence: sfx_fanfare audio + EventBridge event + ExplorationScene particle burst + door badge + PrivacyQuestPage in-room trigger
- [x] 15-03-PLAN.md — DepartmentBreadcrumb React component + PrivacyQuestPage mount

---

### v2.1 Full Vision (Paused — Resume After v2.2 Sponsor Outreach)

**Milestone Goal:** Round out the encounter library with the two highest-value mini-games deferred from v2.0 — a PHI Sorter that teaches "Is this PHI?" through play, and a whack-a-mole Breach Triage that drills the Breach Notification Rule under time pressure. Both reuse the Phase 13 encounter trigger infrastructure (sleep/wake, NarrativeContextCard, EncounterDebrief, unified compliance score).

**Pause status (2026-05-07):** Phase 16 at 98% (Plans 01-03 complete, Plan 04 deferred). Phase 17 not started. Resume after v2.2 sponsor pitch lands.

---

### Phase 16: PHI Sorter Encounter
**Goal**: A new "Is this PHI?" sorting encounter triggers from in-world narrative moments, runs as a 30-60 second drag-or-keyboard mini-game with scaling difficulty, and feeds results into the unified compliance score.
**Depends on**: Phase 13 (encounter trigger infrastructure), Phase 14 (act state)
**Requirements**: SORT-01, SORT-02, SORT-03, SORT-04, SORT-05, SORT-06
**Plans:** 4/4 plans complete
**Success Criteria** (what must be TRUE):
  1. Reaching a designated narrative trigger (Reception NPC handoff in Act 1, plus Lab/Records triggers in Act 2) launches the PHI Sorter encounter — ExplorationScene pauses in place and the sorting overlay opens via the existing encounter lifecycle.
  2. The encounter opens with a NarrativeContextCard explaining why this sort is happening (e.g., "Riley needs help redacting these intake forms before they go to the auditor") before the first item appears.
  3. Players can sort items into "PHI" / "Not PHI" buckets using either drag-and-drop OR keyboard (arrow keys to select, Enter/Space to commit) — both input modes work end-to-end with no fallback gaps.
  4. Each item produces audio + visual feedback on bucket drop: correct = green flash + chime, incorrect = red shake + thud, completion = fanfare (Commandments 1, 8).
  5. At least 3 document sets exist with scaling difficulty: Act 1 obvious (full name, SSN vs. room temperature), Act 2 subtle (diagnosis codes without names, IP addresses, biometric data), Act 3 edge cases (de-identified vs. limited data sets).
  6. Encounter completes in 30-60 seconds with an EncounterDebrief showing sorting accuracy + 1-2 HIPAA takeaways. The unified compliance score updates proportionally to accuracy on encounter completion.

Plans:
- [x] 16-01-PLAN.md — Foundation: SORT-01..06 in REQUIREMENTS.md, sorterData.ts (3 document sets, types, getSorterDocumentSet), CONTENT_MANIFEST.md indexing
- [x] 16-02-PLAN.md — Contracts + audio: ENCOUNTER_TRIGGERED + REACT_RETURN_FROM_ENCOUNTER payload JSDoc extensions, BootScene SFX preload (sfx_sorter_correct, sfx_sorter_wrong)
- [ ] 16-03-PLAN.md — UI overlay: SorterContextCard + PHISorterOverlay + SorterItem + BucketZone components, flash-green/shake-red CSS keyframes, drag-and-drop + keyboard state machine
- [ ] 16-04-PLAN.md — Integration: ExplorationScene Reception+Lab proximity triggers, UnifiedGamePage encounterPhase 'phi-sorter' branch + handleSorterComplete + registry-write round trip; live verification checkpoint

### Phase 17: Breach Triage Encounter (Whack-a-Mole)
**Goal**: A timed Breach Notification Rule encounter uses whack-a-mole pacing — incidents pop up, the player classifies reportable vs not and selects notification timeline — driven primarily by keyboard, triggered from the Act 3 ER narrative arc.
**Depends on**: Phase 13 (encounter trigger infrastructure), Phase 14 (Act 3 state), Phase 16 (encounter UI patterns established)
**Requirements**: TRIA-01, TRIA-02, TRIA-03, TRIA-04, TRIA-05, TRIA-06
**Plans:** 3/3 plans complete
**Success Criteria** (what must be TRUE):
  1. Reaching the Act 3 ER narrative trigger launches the Breach Triage encounter — ExplorationScene pauses in place and the triage overlay opens via the existing encounter lifecycle.
  2. Incidents pop up at whack-a-mole pacing (multiple visible at once, time-pressured) and the player classifies each as reportable / not-reportable using number keys or hotkeys — keyboard-only completion is fully supported with no required mouse input.
  3. For incidents classified reportable, a follow-up prompt asks who to notify (patient / OCR / media) and within what timeframe ("without unreasonable delay" up to 60 days, immediate media notice for >500 records, annual log for <500) — wrong answers explain the rule per 45 CFR §164.404-410.
  4. Each interaction produces audio + visual feedback (Commandments 1, 8): correct = ding + green pulse, miss/wrong = buzz + red flash, time-up = urgency cue. Tension escalates as incidents accumulate.
  5. At least 6 incident scenarios exist covering reportable vs non-reportable edge cases (lost laptop encrypted vs unencrypted, fax to wrong number, HR snooping, vendor breach, deceased patient records, internal misuse) with mixed difficulty.
  6. Encounter completes in 60-120 seconds with an EncounterDebrief showing classification accuracy, average response time, and 1-2 Breach Notification takeaways. The unified compliance score updates proportionally; this encounter raises Breach Notification coverage in the HIPAA Training Framework from THIN to ADEQUATE.

Plans:
- [ ] 17-01-PLAN.md — Foundation: TRIA-01..06 in REQUIREMENTS.md, triageData.ts (9 HIPAA-accurate incidents + notify/timeline follow-ups per §164.404-410), CONTENT_MANIFEST.md indexing
- [ ] 17-02-PLAN.md — Overlay UI: BreachTriageOverlay (3-slot whack-a-mole board, spawn engine, hotkeys, escalating tension) + TriageIncidentCard + TriageFollowUpPanel + TriageDebrief
- [ ] 17-03-PLAN.md — Integration: Priya NPC in ER (act-gated encounterTrigger), schema encounterType/minAct, UnifiedGamePage breach-triage phase + handleTriageComplete + debrief discriminator, HIPAA framework rating update

---

### Phase 22: PHI Sorter Redesign — Content + Connection
**Goal**: The PHI Sorter encounter feels like a job at a hospital instead of a quiz: items are fake patient charts (Two Point Hospital tone) with names, occupations, and free-form notes that are almost-real funny; each set has 8-12 items (up from 6); Aiyana / Marcus stay present during the sort with a speech bubble that reacts to specific items; one Phoenix Wright "HOLD IT!" reveal beat per encounter on the trickiest call.
**Depends on**: Phase 16 (encounter routing + sorter overlay shipped 2026-05-07/08)
**Requirements**: SORTV2-01, SORTV2-02, SORTV2-03, SORTV2-04, SORTV2-05, SORTV2-06
**Branch**: `gsd/phase-22-phi-sorter-content` (cut off main; do not block v2.2 sponsor demo)
**Success Criteria** (what must be TRUE):
  1. Each document set has 8-12 items presented as fake patient charts with name, role/occupation, and at least one free-form note field. The 18-identifier HIPAA accuracy per 45 CFR §164.514(b)(2) is preserved across the rewrite — no item changes its `category` field.
  2. At least 30% of items contain a humor beat in the chart that does not affect HIPAA classification (cat as emergency contact, doctor's frustrated annotation, patient quirks). Humor lives in admin-system absurdity, not patient demographics. CONTENT_MANIFEST.md is updated to reflect the rewrite.
  3. During the sort, the trigger NPC (Aiyana / Marcus) shows a speech bubble that updates based on the most recent drop — at least 4 distinct reaction lines per NPC, plus 1 generic line per accuracy band (perfect / good / shaky).
  4. Exactly one item per set is flagged as a "HOLD IT" reveal — when the player nails it correctly, the NPC delivers a dramatic 1-2 sentence beat explaining *why* it was tricky (e.g., partial date, ZIP3 vs ZIP5, diagnosis without name). The reveal is visually distinct from regular reactions (border flash, scaled text, dedicated SFX).
  5. All existing Phase 16 success criteria still hold (drag-drop + keyboard parity, audio-visual feedback per drop, debrief, score contribution, replayability).
  6. Encounter completes in 60-90 seconds (up from 30-60 to accommodate larger sets); SorterDebrief surfaces NPC name in the "BACK TO X" button or context.
**Plans:** 4/4 plans complete

Plans:
- [ ] 22-01-PLAN.md — Data foundation: add SORTV2-01..06 to REQUIREMENTS.md, rewrite 30 sorterData items as patient charts with deadpan humor (HIPAA-preserved), update CONTENT_MANIFEST.md
- [ ] 22-02-PLAN.md — Dr. Tovar NPC in roomData.json (records_room encounter trigger) + sorterReactions.ts NPC reaction banks (Aiyana / Marcus / Tovar)
- [ ] 22-03-PLAN.md — UI components: SorterItem renders chart fields; new NPCReactionBubble with HOLD IT scaled gold-flash variant
- [ ] 22-04-PLAN.md — Integration: PHISorterOverlay wires reactions + HOLD IT reveal + sfx_fanfare@0.4 + NPC name in progress header; live human-verify checkpoint (tone / voice / HIPAA / 60-90s)

### Phase 23: PHI Sorter Redesign — Feedback Moments
**Goal**: Every interaction in the sorter produces visible/audible/character response (Commandment 1) at proportional weight (Commandment 8): per-drop particle bursts + camera shake, animated bucket counters, completion overlay before debrief, score animations on each correct, NPC reaction enthusiasm scales with accuracy.
**Depends on**: Phase 22 (humor + NPC speech bubble framework already in place)
**Requirements**: SORTV2-07, SORTV2-08, SORTV2-09, SORTV2-10
**Branch**: none — commit to main per branching_strategy (Phases 16-22 precedent)
**Success Criteria** (what must be TRUE):
  1. Each correct drop fires a particle burst on the destination bucket (≥6 particles, color-matched green for correct / red for wrong) plus a brief camera shake (~80ms, 2-3px amplitude). Wrong drops also flash + shake (no positive particles). Both are independent of the existing border flash.
  2. Both buckets render visible running counters that animate with a small bounce on each increment ("PHI: 3 redacted" / "Not PHI: 2 kept"). Counters reset when the encounter restarts.
  3. After the final item drops, a completion overlay appears for ~1.2s before the SorterDebrief opens — header text scales from 0 to full size and reads "PERFECT 10/10" / "GOOD" / "KEEP PRACTICING" based on accuracy band, with a screen-wide flash matching the band color.
  4. The score counter (compliance score in the HUD if visible, or a local sorter score) pulses each time it increments. Increment magnitude is proportional to whether the call was a "HOLD IT" tricky one (+2) or a regular item (+1).
  5. NPC speech bubble reaction lines escalate in enthusiasm as accuracy climbs above 80%, deflate slightly below 50%. Tone change is felt without text reading like a scoreboard.
  6. All Phase 22 success criteria still hold.
**Plans:** 2/2 plans complete

Plans:
- [x] 23-01-PLAN.md — Foundation: SORTV2-07..10 in REQUIREMENTS.md, Phase 23 CSS keyframes, BucketZone counters + particle bursts, SorterCompletionOverlay component, enthusiasm-scaled reaction-bank band variants (completed 2026-06-10)
- [ ] 23-02-PLAN.md — Integration: PHISorterOverlay wiring (camera shake, bucket counts, +2/+1 score pulse, 'celebrating' completion phase, band-transition reactions) + Phase 22/16 regression verification

### Phase 24: PHI Sorter Redesign — Format Shift (Papers Please)
**Goal**: The sorter shifts from a multi-card pile to a one-document-at-a-time desk surface: KEEP / REDACT stamps replace bucket drops; documents slide in and stamp marks persist; soft visible clock adds urgency without hard-fail; NPC portrait stays present above the desk through the whole encounter. The redesign reuses Phase 22 content and Phase 23 feedback layer wholesale.
**Depends on**: Phase 22 (content), Phase 23 (feedback hooks the format will fire)
**Requirements**: SORTV2-11, SORTV2-12, SORTV2-13, SORTV2-14, SORTV2-15
**Branch**: `gsd/phase-24-phi-sorter-format`
**Success Criteria** (what must be TRUE):
  1. Documents are presented one at a time on a wood-desk surface; the previously-active multi-card pile is gone. Document slides in from off-screen on appearance with a paper-rustle SFX.
  2. KEEP and REDACT stamps replace the PHI / NOT PHI buckets — clicking the stamp commits the call (no drag required). Each stamp produces an iconic stamp-thunk SFX, an ink mark that persists on the document for 250-400ms, and an ink-splatter particle burst.
  3. Stamped documents slide off the desk into one of two visible outgoing trays (KEEP / REDACT) which fill visibly as the shift progresses. End-of-shift, tray counts are visible.
  4. A wall clock or wristwatch is visible in a corner counting down per-set. At 0:00 the encounter wraps with whatever's been stamped — unstamped items don't count toward score, no fail screen ("shift's over, leave the rest for the auditor"). Per-set durations: Set 1 = 90s, Set 2 = 75s, Set 3 = 60s.
  5. The trigger NPC (Aiyana / Marcus) portrait + name stays visible above the desk during the whole encounter. Speech bubble reactions from Phase 22-23 fire from the persistent portrait location.
  6. Keyboard parity preserved: keyboard-only completion is fully supported (key to focus stamp, Enter to commit, arrow to switch stamps). All existing Phase 22 + Phase 23 success criteria still hold.
**Plans:** 3/3 plans complete

Plans:
- [ ] 24-01-PLAN.md — Foundation: SORTV2-11..15 in REQUIREMENTS.md, BootScene SFX keys (stamp-thunk + paper-rustle from vendored Kenney packs), shiftSeconds in sorterData, 6 desk-format CSS keyframes
- [ ] 24-02-PLAN.md — Desk components: DeskSurface, ShiftClock, OutgoingTray, StampPad, DeskDocument + NPCReactionBubble persistent-portrait extension
- [ ] 24-03-PLAN.md — Integration: PHISorterOverlay desk-format rewrite (one-doc state machine, stamp commits, soft clock, keyboard parity) + BucketZone/SorterItem deletion + regression gate

---

### v2.2 Sponsor Demo (Active — 1-2 Day Build)

**Milestone Goal:** Ship a curated 4-room sponsor-pitch demo of PrivacyQuest in 1-2 days. Out-of-Pocket (Nikhil) outreach next week at ~$10K target. Pure curation/polish — reuses existing rooms, NPCs, dialogue. No new mechanics, no new content authored. Pluggable sponsor config (`{ name, character_sprite, two_dialogue_lines, code }`) so future sponsors swap in via single file edit.

**Sequencing rationale:**
- Phase 18 first — start menu + demo-mode infrastructure + sponsor config scaffold. Demo path must exist before completion sequence has anywhere to fire from. Sponsor config shape is set up here so Phase 21 can populate it without source-code churn.
- Phase 19 — Tower Defense standalone launch. Independent of demo path; small refactor of BreachDefenseScene's encounter-mode entry point so it runs without narrative wrapper.
- Phase 20 — First-impression polish (FIX-01/02/03/04). Best applied AFTER the 4-room demo path is wired so we know exactly which rooms are in scope and can scope fixes precisely.
- Phase 21 — Completion sequence + sponsor hook. Depends on Phase 18 (demo flow exists) and reads the Phase 18 sponsor config file.

---

### Phase 18: Demo Mode + Start Menu Infrastructure
**Goal**: A start menu with three primary buttons routes the player into Demo / Tower Defense / Full Game; the Demo path is a curated 4-room flow (Reception → ER → Break Room → Medical Records) isolated from the full game's progression and save state. Sponsor config file scaffold lands here so Phase 21 can populate without source edits.
**Depends on**: Phase 15 (existing UnifiedGamePage + useGameState; door state visuals reused)
**Requirements**: DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05, DEMO-06, DEMO-07, CERT-04
**Success Criteria** (what must be TRUE):
  1. The start menu shows three primary buttons — "Demo", "Tower Defense", "Full Game" — and is the first screen the player sees on `/`.
  2. Pressing "Full Game" enters the existing full-game flow with progression, unlocks, and save state behaving exactly as before — no regression.
  3. Pressing "Demo" enters a curated flow where Reception, Emergency Room, Break Room, and Medical Records are all immediately accessible and traversable in that intended order, with no full-game unlock gating applied.
  4. Demo rooms reuse the existing scenarios, NPCs, and dialogue from `roomData.json` verbatim — no new content authored — and demo activity does not read or write the full-game save key.
  5. The player can exit the demo at any time (ESC or in-game exit affordance) and is returned to the start menu.
  6. A single sponsor config file exists at a known path with the shape `{ name, character_sprite, two_dialogue_lines, code }`, is loaded at start menu boot, and editing it changes the sponsor identity without any source-code changes (verified by edit-only swap test).
**Plans**: TBD (kicked off by `/gsd:plan-phase 18`)

### Phase 19: Tower Defense Standalone Launch
**Goal**: The "Tower Defense" start-menu button launches BreachDefenseScene as a self-contained mini-game with no narrative wrapper, no encounter context, and no save-state side effects — returning the player to the start menu on win or loss.
**Depends on**: Phase 18 (start menu exists with TD button wired)
**Requirements**: TD-01, TD-02, TD-03
**Success Criteria** (what must be TRUE):
  1. Pressing "Tower Defense" on the start menu launches BreachDefenseScene directly with no NarrativeContextCard, no IT Office trigger, and no surrounding ExplorationScene — first frame after press is the tower defense grid.
  2. Winning or losing the standalone TD round returns the player to the start menu with no encounter result feedback, no debrief modal, and no compliance score updates persisted.
  3. Playing standalone Tower Defense does not modify the full-game save key, the demo session state, or any localStorage value that affects either the Demo or Full Game flows on subsequent launches.
**Plans**: TBD (kicked off by `/gsd:plan-phase 19`)

### Phase 20: First-Impression Polish
**Goal**: The three known visual/audio bugs that hurt the first-impression demo run (V1 flat sprite, V4 HUD overlay on entry, V7 loud honk near NPCs) are fixed in the 4 demo rooms without regressing the full-game flow.
**Depends on**: Phase 18 (demo path defines which 4 rooms are in scope)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04
**Success Criteria** (what must be TRUE):
  1. On initial load of any demo room (and the full-game first room), the player sprite renders correctly textured and animated before any movement input — no flat colored rectangle visible at any point.
  2. On entry to any demo room, the HUD/progress bar does not overlay or block the player's view of the room — the player can see and interact with NPCs and zones immediately on entry.
  3. The loud honk audio cue near NPCs in the demo path is removed or replaced with an appropriate, proportional cue (Commandment 8) — no jarring honk plays during a demo room playthrough.
  4. All three fixes are verified in Reception, Emergency Room, Break Room, and Medical Records, and a regression pass on the full-game flow shows no new bugs introduced in non-demo rooms.
**Plans**: TBD (kicked off by `/gsd:plan-phase 20`)

### Phase 21: Completion Sequence + Sponsor Hook
**Goal**: Exiting Medical Records as the final demo room triggers a deliberate dim → beat → fanfare → certificate reveal sequence with copy-to-clipboard sponsor code, and an end NPC hands the prize using the sponsor sprite + dialogue lines from the Phase 18 config file.
**Depends on**: Phase 18 (demo flow + sponsor config scaffold), Phase 20 (demo rooms polished)
**Requirements**: CERT-01, CERT-02, CERT-03
**Plans:** 1/1 plans complete
**Success Criteria** (what must be TRUE):
  1. Exiting Medical Records as the fourth and final demo room triggers a deliberate sequence in this exact order: screen dim, brief anticipatory beat (~500ms silence), fanfare (audio + VFX), certificate animation in, then sponsor code reveal — pacing follows Commandment 2 (anticipation before reward).
  2. The completion certificate displays the configured sponsor's name and shows the sponsor code in monospace font with a clearly labeled copy-to-clipboard button that gives audio + visual confirmation when pressed (Commandment 1).
  3. An end NPC in the Medical Records closer renders using the sponsor's `character_sprite` and speaks the two configured `two_dialogue_lines` from the sponsor config — handing the prize feels like an in-world Zelda item-get moment (Commandment 6).
  4. Editing only the sponsor config file (no source-code changes) changes the certificate name, code, end-NPC sprite, and end-NPC dialogue lines on the next launch — verified by a swap test with a second sponsor config.

Plans:
- [x] 21-01-PLAN.md — Capstone wiring: CertificateOverlay (sequence machine + NPC handoff + cert card + copy button) + spriteAssetPaths.ts (9-key NPC path map) + UnifiedGamePage trigger in handleExitRoom records_room exit branch


### v2.3 Nintendo Polish (Active)

**Milestone Goal:** Close the visual and feel gap between "functional RPG" and "polished SNES-era RPG." Dialogue shows real character portraits instead of placeholder SVGs, rooms read as richer spaces, and the player always knows where to go next without being told. Reuses on-disk spritesheets and procedural pixel art — no new binary assets required.

### Phase 25: Dialogue Portraits + NPC Visual Identity
**Goal**: Every dialogue overlay shows the speaking NPC as a large pixelated portrait cropped from their actual in-world spritesheet — the 32px placeholder SVG is gone, every named NPC in roomData.json maps to the correct sheet, and the portrait has presence (frame, name plate, subtle life animation).
**Depends on**: Phase 21 (spriteAssetPaths CSS-crop pattern), Phase 24 (NPCReactionBubble portrait precedent)
**Requirements**: VIS-01, VIS-02, VIS-03 (defined in REQUIREMENTS.md by plan 25-01)
**Success Criteria** (what must be TRUE):
  1. The dialogue overlay (BattleEncounterScreen) renders the speaking NPC as a >=96px pixelated portrait cropped from the same spritesheet BootScene preloads — the NPCSprite SVG placeholder no longer appears anywhere in dialogue.
  2. Every named NPC in roomData.json resolves to the correct spritesheet via a data-driven mapping (no hardcoded component map; named characters never fall back to a generic sheet silently — fallback logs a dev warning).
  3. The portrait sits in a framed plate with the NPC's name, and shows a subtle idle animation (breathing bob or periodic blink) while dialogue is on screen — NPCs feel like people, not icons (Commandment 4).
  4. Dialogue flow, choices, feedback, and scoring behave exactly as before — zero regression to GameContainer logic; tsc and production build clean.
**Plans**: 2 plans

Plans:
- [ ] 25-01-PLAN.md — Define VIS-01..03 + sprite field on all 26 roomData NPCs + getNPCPortraitPath resolver in spriteAssetPaths.ts
- [ ] 25-02-PLAN.md — DialoguePortrait component (96px crop, framed plate, breathing bob) + BattleEncounterScreen swap + NPCSprite.tsx deletion

### Phase 26: Room Visual Up-Level (Furniture + Floors)
**Goal**: The six departments and hallways read as distinct, furnished spaces: room-specific floor treatments, an upgraded furniture detail pass on the most-seen objects, visible glow/sparkle on educational collectibles, and idle motion on at least three furniture types.
**Depends on**: Phase 25
**Requirements**: VIS-04, VIS-05, VIS-06 (TBD during /gsd:plan-phase)
**Success Criteria** (what must be TRUE):
  1. Each department has a visually distinct floor treatment (palette + pattern variation per room type) with visible wall/floor transition — rooms no longer look like recolors of the same grid.
  2. The 8 most-frequently-seen furniture textures get a detail pass (shading, highlights, readable silhouettes at 32px) and educational collectibles glow or sparkle so they are distinguishable at a glance (Commandment 9).
  3. At least 3 furniture types display a subtle idle animation (monitor flicker, coffee steam, plant sway) — rooms feel alive.
  4. No gameplay or collision changes; tsc and production build clean.
**Plans**: TBD (kicked off by `/gsd:plan-phase 26`)

### Phase 27: Navigation Clarity + Reward Sweep
**Goal**: The player always knows where to go next without being told twice: the next-objective door breathes with a soft glow, in-room remaining objectives are discoverable at a glance, and the moment-to-moment reward layer (score blips, completion ticks, discovery chimes) is audited against Commandments 1 and 8 with gaps filled.
**Depends on**: Phase 26
**Requirements**: VIS-07, VIS-08 (TBD during /gsd:plan-phase)
**Success Criteria** (what must be TRUE):
  1. The door leading to the next incomplete department has a distinct soft pulse/glow that completed and locked doors do not have — a playtester can answer "where do I go next?" by looking, not by reading.
  2. In-room, un-met completion requirements are discoverable without a modal: subtle sparkle on untalked NPCs / unspotted zones after a idle grace period, never nagging, never obnoxious.
  3. A feedback audit table of every player action in exploration mode (move, interact, collect, complete, door, encounter enter/exit) shows audio + visual response for each, with previously-silent interactions fixed (Commandment 1).
  4. No new modals; everything ambient. tsc and production build clean.
**Plans**: TBD (kicked off by `/gsd:plan-phase 27`)

---

## Progress

**Execution Order:** 11 → 12 → 13 → 14 → 15 → 16 (paused) → 18 → 19 → 20 → 21 → (resume 16 → 17)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 6. Character Sprites | v1.1 | 2/2 | Complete | 2026-03-02 |
| 7. NPC Portraits | v1.1 | 0/0 | Deferred | - |
| 8. Furniture + Objects | v1.1 | 0/0 | Deferred | - |
| 9. Floor Tiles | v1.1 | 0/0 | Deferred | - |
| 10. Integration + Cleanup | v1.1 | 0/0 | Deferred | - |
| 11. Pre-Restructure Foundation | v2.0 | 4/4 | Complete | 2026-03-27 |
| 12. Unified Navigation | v2.0 | 4/4 | Complete | 2026-03-28 |
| 13. Encounter Integration | v2.0 | 4/4 | Complete | 2026-03-28 |
| 14. Three-Act Narrative Arc | v2.0 | 4/4 | Complete | 2026-03-28 |
| 15. Polish and Completion | v2.0 | 3/3 | Complete | 2026-03-28 |
| 16. PHI Sorter Encounter | 4/4 | Complete    | 2026-06-10 | - |
| 17. Breach Triage Encounter | 3/3 | Complete    | 2026-06-10 | - |
| 18. Demo Mode + Start Menu | v2.2 | Complete    | 2026-05-08 | - |
| 19. Tower Defense Standalone | v2.2 | 1/1 | Complete | 2026-05-08 |
| 20. First-Impression Polish | v2.2 | 1/1 | Complete | 2026-05-08 |
| 21. Completion + Sponsor Hook | v2.2 | 1/1 | Complete | 2026-05-08 |
| 22. PHI Sorter Redesign — Content + Connection | v2.1 | 4/4 | Complete | 2026-06-10 |
| 23. PHI Sorter Redesign — Feedback Moments | v2.1 | 2/2 | Complete | 2026-06-10 |
| 24. PHI Sorter Redesign — Format Shift | v2.1 | 3/3 | Complete | 2026-06-10 |
| 25. Dialogue Portraits + NPC Visual Identity | 1/2 | In Progress|  | - |
| 26. Room Visual Up-Level | v2.3 | 0/0 | Pending | - |
| 27. Navigation Clarity + Reward Sweep | v2.3 | 0/0 | Pending | - |
