# Requirements: PrivacyQuest v2.0 — One Game

**Defined:** 2026-03-26
**Core Value:** The player should forget they're doing compliance training. One continuous game that feels like a polished SNES-era RPG.

## v2.0 Requirements

### Foundation

- [ ] **FOUN-01**: Game runs on a single route (/) with one persistent Phaser instance — no route-switching between game modes
- [ ] **FOUN-02**: Unified game state hook (useGameState) tracks department completion, encounter results, act progression, and compliance score in one structure
- [x] **FOUN-03**: Versioned localStorage save schema replaces 14+ fragmented keys with a single structured object and migration from v1 format
- [x] **FOUN-04**: Bug stabilization pass on surviving systems (ExplorationScene, dialogue, EventBridge listener cleanup, scoring) before restructure work begins

### Navigation

- [ ] **NAV-01**: Player walks between departments through doors with camera fade transitions (~300ms out/in)
- [ ] **NAV-02**: Doors display visual state indicators — locked (dark tint), available (glow pulse), completed (checkmark badge)
- [ ] **NAV-03**: Departments unlock linearly based on completion (Reception → Break Room → Lab → Records → IT → ER)
- [ ] **NAV-04**: Hallway connectors between departments provide pacing breaks with floor/walls/doors (no interactables)
- [ ] **NAV-05**: Player spawns at the correct door after transitions (entering Room B from Room A → player appears at Room A's door in Room B)
- [ ] **NAV-06**: Player can backtrack through completed areas by walking back through doors
- [ ] **NAV-07**: HallwayHub room picker is removed — all 5 responsibilities (unlock gating, room entry, tutorial trigger, completion display, room metadata) are transferred to in-world systems
- [ ] **NAV-08**: Hub world transforms from game-picker lobby into hospital entrance area (first room the player enters)

### Encounter Integration

- [x] **ENC-01**: Encounter trigger/return system — ExplorationScene sleeps while encounter runs, wakes on completion with player position preserved
- [x] **ENC-02**: Condensed inbound TD encounter — 4 waves, 3 tower types per wave tier, ~3-5 minute duration, using existing BreachDefenseScene with encounter-mode config
- [x] **ENC-03**: Encounter launches with narrative context card explaining why it's happening ("Dr. Patel flagged suspicious logins...")
- [x] **ENC-04**: Encounter results feed back to unified game state (score, pass/fail, completion flag)
- [x] **ENC-05**: Inbound TD encounter triggers from IT Office / Act 3 narrative moment
- [x] **ENC-06**: Unified compliance score aggregates across dialogue choices and encounter performance, visible in HUD during exploration
- [x] **ENC-07**: Encounter has clear start screen (narrative card) and end screen (recap with HIPAA takeaways)

### Narrative Arc

- [ ] **NARR-01**: Act progression system with conditions that advance Act 1 → 2 → 3 (based on department completion + encounter status)
- [ ] **NARR-02**: Per-act music shifts using existing tracks — hub theme (Act 1 warm), exploration theme (Act 2 uneasy), breach theme (Act 3 urgent)
- [ ] **NARR-03**: Soft act transitions with no hard title cards — music crossfades and environmental cues signal the shift
- [ ] **NARR-04**: Transition dialogue — NPCs reference player's earlier actions and bridge between acts (targeted: 2-3 key decisions remembered, reflected in 3-5 NPC lines)
- [ ] **NARR-05**: Department ordering supports narrative flow (Reception/Break Room = Act 1, Lab/Records = Act 2, IT/ER = Act 3)
- [x] **NARR-06**: Environmental storytelling in hallway connectors (bulletin boards, ambient details that shift per act)
- [x] **NARR-07**: Per-department completion fanfare (visual flourish + chime + badge) when all NPCs/zones/items in a department are completed
- [x] **NARR-08**: Progress breadcrumb on HUD showing department completion status and current act

## v2.1 Requirements (Deferred)

### New Encounter Types

- [x] **SORT-01**: PHI Sorter encounter triggers from in-world narrative moments — Reception (Act 1) plus Lab/Records (Act 2). ExplorationScene pauses in place via existing encounter lifecycle.
- [x] **SORT-02**: NarrativeContextCard (or sorter-specific SorterContextCard) opens before the first item appears, explaining why this sort is happening.
- [x] **SORT-03**: Items sortable via drag-and-drop OR keyboard (↑↓ cycle items, ←→ choose bucket, Enter/Space commit). Both modes work end-to-end with no fallback gaps.
- [x] **SORT-04**: Each drop produces audio + visual feedback (correct = green flash + chime, incorrect = red shake + thud, completion = fanfare). No silent interactions (Commandment 1).
- [x] **SORT-05**: At least 3 document sets with scaling difficulty: Act 1 obvious, Act 2 subtle, Act 3 edge cases.
- [x] **SORT-06**: Encounter completes in 30-60 seconds with EncounterDebrief showing accuracy + 1-2 HIPAA takeaways. Unified compliance score updates proportionally to accuracy.

> **Note:** PHI-01 (original placeholder) is superseded by SORT-01..SORT-06 above — these six IDs reflect the full crystallized spec for the PHI Sorter encounter (Phase 16).

- **PHI-02**: Outbound TD encounter — inverted direction, cultural/administrative safeguard towers
- **BREACH-01**: Breach triage encounter — classify incidents as reportable or not, notification timelines

> **Note:** BREACH-01 (original placeholder) is superseded by TRIA-01..TRIA-06 below — these six IDs reflect the full crystallized spec for the Breach Triage encounter (Phase 17).

### Breach Triage Encounter (Phase 17)

- [x] **TRIA-01**: Breach Triage encounter triggers from an Act 3 ER NPC via the `encounterTrigger` pattern (Aiyana/Marcus/Dr. Tovar precedent). The NPC only spawns in the full game at Act 3 (hidden in demo mode and earlier acts). ExplorationScene pauses in place; the triage overlay opens via the existing pure-React encounter lifecycle (ENCOUNTER_REQUEST → EncounterRequestModal accept → overlay; registry guard `encounterResult_breach-triage-er` written on debrief dismiss; abort/decline keeps it replayable).
- [x] **TRIA-02**: Incidents pop up at whack-a-mole pacing — up to 3 visible simultaneously, each with its own countdown timer, spawn cadence escalating over the run. Player classifies each as REPORTABLE / NOT REPORTABLE via keyboard (1/2/3 to focus a slot, R/N to classify, number keys in follow-ups, Esc to abort). Keyboard-only completion fully supported; mouse is optional, never required.
- [x] **TRIA-03**: Correctly flagging a reportable incident opens a two-step follow-up: (a) who must be notified (patient / patient+OCR / patient+OCR+media), (b) within what timeframe. Content is accurate per 45 CFR §164.404 (individuals: without unreasonable delay, ≤60 days), §164.406 (media: breaches affecting >500 residents of a state/jurisdiction), §164.408 (OCR: concurrent for 500+, annual log within 60 days of year-end for <500), §164.410 (business associate → covered entity ≤60 days), §164.402 (breach definition, encryption safe harbor, ransomware presumption). Wrong answers display an explanation teaching the rule.
- [x] **TRIA-04**: Every interaction produces audio + visual feedback (Commandments 1, 8): correct = ding + green pulse; wrong = buzz + red flash + explanation; time-up = urgency cue + miss; tension escalates as incidents accumulate (vignette pulse at 2+ on board, alert sting at full board). No silent interactions.
- [x] **TRIA-05**: At least 6 incident scenarios cover the required edge cases — encrypted lost laptop (NOT reportable, safe harbor), unencrypted lost laptop (reportable, >500), misdirected fax, HR snooping, vendor/BA breach, deceased patient records (50-year rule), internal misuse — with mixed difficulty (per-incident difficulty tier drives timer length).
- [x] **TRIA-06**: Encounter completes in 60-120 seconds. TriageDebrief shows classification accuracy, average response time, and 2 Breach Notification takeaways. Unified compliance score updates proportionally (`Math.round(accuracy * 12)`, consistent with Phases 13/16). HIPAA_TRAINING_FRAMEWORK.md Part 3 Breach Notification coverage is upgraded to scenario-tested (§3.3 → STRONG, closing the noted 500+ threshold gap).

### PHI Sorter Redesign — Content + Connection (Phase 22)

- [x] **SORTV2-01**: Each PHI Sorter document set contains 10 items (up from 6/8/5), each presented as a fake patient chart with patientName plus at least one free-text chart field. HIPAA accuracy preserved — no item changes its `category` field vs the Phase 16 build; the 18 identifiers per 45 CFR §164.514(b)(2) Safe Harbor remain the source of truth.
- [x] **SORTV2-02**: ≥30% of items contain a humor beat (cat-as-emergency-contact, doctor's frustrated annotation, mundane-but-specific oddity) in a chart field that does NOT affect classification. Humor lives in admin-system absurdity, never in patient demographics. CONTENT_MANIFEST.md is updated to reflect the rewrite.
- [x] **SORTV2-03**: During sorting, the trigger NPC (Aiyana for Set 1, Marcus for Set 2, Dr. Tovar for Set 3) shows a speech bubble that updates on each item drop — at least 4 specific-item reaction lines per NPC plus 3 accuracy-band fallback lines (shaky / good / strong).
- [x] **SORTV2-04**: Exactly one item per set is flagged as a "HOLD IT" reveal. When the player correctly classifies it, the NPC reaction bubble enters a distinct visual treatment (scaled portrait, gold border flash, dedicated SFX) and shows a 1-2 sentence educational beat. Stays in flow — not a full-screen modal.
- [x] **SORTV2-05**: All Phase 16 PHI Sorter success criteria still hold: drag-and-drop + keyboard parity, audio-visual feedback per drop, debrief with takeaways, score contribution via `Math.round((correct/total) * 12)`, replayability after abort.
- [x] **SORTV2-06**: Encounter completes in 60-90 seconds (up from Phase 16's 30-60s to accommodate larger sets with NPC reaction beats). SorterDebrief surfaces the trigger NPC's name in the close-button context (e.g., "BACK TO AIYANA").

### PHI Sorter Redesign — Feedback Moments (Phase 23)

- [x] **SORTV2-07**: Every bucket drop fires a particle burst on the destination bucket (≥6 DOM/CSS particles, green #2ECC71 on correct, red #EF4444 on wrong) plus a brief camera shake of the sorter surface (~80ms, 2-3px amplitude, CSS animation on the overlay content wrapper). Wrong drops never receive the green celebratory treatment. Both effects are additive to — and independent of — the existing flash-green/shake-red bucket border feedback.
- [x] **SORTV2-08**: Both buckets render visible running counters ("N redacted" under PHI, "N kept" under NOT PHI) that animate with a small bounce on each increment. Counters count items dropped into that bucket and reset to 0 when the encounter restarts (replay after abort).
- [x] **SORTV2-09**: After the final item drops, a completion overlay appears for ~1.2s before the SorterDebrief opens — header text scales from 0 to full size and reads "PERFECT n/n" (100% accuracy, gold), "GOOD" (≥60%, green), or "KEEP PRACTICING" (<60%, teal — encouraging, never red), with a screen-wide flash matching the band color. The existing 600ms anticipation beat (Commandment 2) precedes the celebration.
- [x] **SORTV2-10**: A visible local sorter score pulses on each increment: +2 for a correct "HOLD IT" tricky item, +1 for a correct regular item (display-only — the compliance contribution formula Math.round((correct/total) × 12) is unchanged). NPC speech-bubble reaction lines escalate in enthusiasm above 80% running accuracy and deflate below 50%, via 3 band-variant lines per band per NPC — tone is felt without text reading like a scoreboard.

### PHI Sorter Redesign — Format Shift (Phase 24)

- [x] **SORTV2-11**: The sorter presents exactly one document at a time on a wood-desk surface — the multi-card scrollable pile is gone. Each document slides in from off-screen right (~300ms, slight settle wobble) accompanied by a paper-rustle SFX (`sfx_sorter_paper`, sourced from the already-vendored kenney_interface-sounds scroll_002.ogg — no new binary assets). Chart content rendering (patientName/role/reasonForVisit/emergencyContact/doctorNote/miscField from Phase 22) is preserved on a paper-styled document.
- [x] **SORTV2-12**: KEEP and REDACT stamp buttons replace the PHI / NOT PHI buckets — clicking a stamp commits the call with no drag interaction anywhere in the encounter. Semantic mapping preserves HIPAA correctness: REDACT commits `category === 'phi'` (it IS PHI, must be redacted), KEEP commits `category === 'not_phi'` (safe to keep); item `category` fields in sorterData.ts are unchanged. Each stamp fires a stamp-thunk SFX (`sfx_sorter_stamp`, kenney impactPlank_medium_000.ogg), an ink mark (green KEEP / red REDACT, slight rotation) that persists on the document 250-400ms before it slides off, and an 8-particle ink-splatter burst in the stamp's ink color (reuses the Phase 23 `sorter-particle` keyframe). Correct/wrong distinction stays carried by the Phase 16/23 channels: green flash vs red shake on the document, sfx_sorter_correct/wrong, camera shake, and the educational toast.
- [x] **SORTV2-13**: Stamped documents slide off the desk into one of two visible outgoing trays (KEEP left, REDACT right) rendered as stacked-paper visuals that fill as the shift progresses. Each tray shows a running count that bounces on increment (reuses Phase 23 `counter-bounce`); counts remain visible through end-of-shift and reset to 0 on encounter restart.
- [x] **SORTV2-14**: A visible shift clock counts down per set — Set 1 = 90s, Set 2 = 75s, Set 3 = 60s (data-driven via `shiftSeconds` on SorterDocumentSet). Under 10s remaining the clock pulses for urgency. At 0:00 the encounter wraps softly with whatever has been stamped: unstamped items do not count toward score, no fail screen appears — the NPC delivers a "shift's over, leave the rest for the auditor" line and the normal completing → celebrating → debrief pipeline runs. scoreContribution remains `Math.round((correctCount / totalCount) * 12)` where totalCount is the FULL set size (unstamped items score as not-correct); SorterDebrief is unchanged.
- [x] **SORTV2-15**: The trigger NPC's portrait (CSS-cropped spritesheet frame, Phase 21 CertificateOverlay pattern) + name stays persistently visible above the desk for the whole encounter; Phase 22-23 speech-bubble reactions (specific-item, band-fallback, band-transition, HOLD IT reveal) fire from the persistent portrait location. Keyboard parity holds: ←/→ focus the KEEP/REDACT stamp, Enter/Space commits the focused stamp, Esc aborts — keyboard-only completion fully supported. All Phase 22 (SORTV2-01..06) and Phase 23 (SORTV2-07..10) success criteria still hold under the new format.

### Polish & Completion

- **POLISH-01**: End-of-game report screen (department scores, knowledge areas, time)
- **POLISH-02**: Remaining sprite overhaul (portraits, furniture, tiles, SpriteFactory retirement)
- **POLISH-03**: Expanded sound effects for new encounter types
- **POLISH-04**: Per-area ambient audio

## v2.2 Requirements (Active — Sponsor Demo)

Curation + polish milestone for sponsor pitch. Reuses all existing room data, NPCs, dialogue. No new content authored.

### Demo Mode

- [ ] **DEMO-01**: Start menu shows three primary buttons: "Demo", "Tower Defense", "Full Game"
- [ ] **DEMO-02**: "Full Game" button enters the existing full game flow with current progression behavior unchanged
- [ ] **DEMO-03**: "Demo" button enters a curated 4-room demo flow with all 4 rooms accessible from start, gated off from the full game's unlock-progression system
- [ ] **DEMO-04**: Demo flow rooms appear in this order: Reception → Emergency Room → Break Room → Medical Records
- [ ] **DEMO-05**: Demo rooms reuse existing scenarios, NPCs, dialogue from `roomData.json` with no new content authored
- [ ] **DEMO-06**: Demo progress is isolated from full game save data — playing the demo does not modify or read full-game localStorage state
- [ ] **DEMO-07**: Player can exit the demo at any time and return to the start menu

### Tower Defense Standalone

- [x] **TD-01**: "Tower Defense" start menu button launches BreachDefenseScene directly without narrative wrapper or encounter trigger context
- [x] **TD-02**: Standalone TD returns to the start menu on win or lose with no encounter result feedback or score persistence
- [x] **TD-03**: Standalone TD does not modify full-game or demo save state

### First-Impression Polish

- [ ] **FIX-01**: Player sprite renders correctly (animated/textured) on initial load before any player movement (V1 fix)
- [ ] **FIX-02**: HUD/progress bar does not overlay or block view on room entry in the demo path (V4 fix)
- [ ] **FIX-03**: Loud honk sound near NPCs is removed or replaced with an appropriate cue in the demo path (V7 fix)
- [ ] **FIX-04**: All three fixes apply in the 4 demo rooms without regressing full-game behavior

### Completion + Sponsor Hook

- [x] **CERT-01**: After exiting Medical Records as the final demo room, a completion sequence plays in this order: dim → beat → fanfare → certificate animation → sponsor code reveal
- [x] **CERT-02**: Completion certificate displays the configured sponsor name and a code block in monospace font with a copy-to-clipboard button
- [x] **CERT-03**: An end NPC in the Medical Records closer uses the configured sponsor's character sprite and two configured dialogue lines to hand the prize
- [ ] **CERT-04**: Sponsor data is read from a single config file with shape `{ name, character_sprite, two_dialogue_lines, code }` — swapping sponsors requires only a config file edit, no source-code changes

## v2.3 Requirements (Active — Nintendo Polish)

NPC portrait system for dialogue overlay and navigation clarity systems (Phase 27).

### Dialogue Portraits (Phase 25)

- [x] **VIS-01**: The dialogue overlay (BattleEncounterScreen) renders the speaking NPC as a >=96px pixelated portrait CSS-cropped from frame 0 (idle-down) of the same `npc_<type>_sheet` PNG BootScene preloads (Phase 21 CertificateOverlay / Phase 24 NPCReactionBubble crop pattern). The NPCSprite SVG placeholder no longer appears anywhere in dialogue, and NPCSprite.tsx is deleted once it has zero consumers.
- [x] **VIS-02**: Every named NPC in roomData.json carries a `sprite` type field (one of the 9 BootScene sheet types), and dialogue portrait resolution is data-driven via a `getNPCPortraitPath(npcId)` resolver in spriteAssetPaths.ts built from that data — no hardcoded component-level npcId map. Unknown/unmapped npcIds fall back to the staff sheet AND emit a `console.warn` in dev mode — named characters never silently render generic.
- [x] **VIS-03**: The portrait sits in a framed plate with the NPC's name and shows a subtle idle animation (breathing bob, ~2.4s loop, 2-3px amplitude) while dialogue is on screen (Commandment 4 — NPCs are people, not icons). Dialogue flow, choices, feedback, and scoring behave exactly as before — zero regression to GameContainer logic; `npm run check` and `npm run build` clean.

### Room Visual Up-Level (Phase 26)

- [x] **VIS-04**: Each department and connector renders a visually distinct floor treatment — distinct palette + pattern per room type (ER pale clinical tile with safety accents, Lab green clean-room grid, IT dark raised panels, Break Room wood planks, Records carpet, Entrance marble, Reception its own warm porcelain treatment with large-format tile illusion and navy accent diamonds, hallways a corridor runner strip down the walkway row). Floor tiles adjacent to wall bottoms render a contact-shadow gradient so walls visibly meet floors rather than appearing to float on the grid. Floor rendering stays a once-per-room-load Graphics pass (no per-frame draw); zero collision changes.
- [x] **VIS-05**: The 8 most-frequently-rendered furniture textures (furn_plant, furn_chair, furn_filing_cabinet, furn_cable_tray, furn_server_rack, furn_desk, furn_table, furn_vending_machine — derived from roomData.json obstacle frequency counts) get a detail pass: 1px dark silhouette outline, boosted highlight/shadow contrast, 1-2 characterful details each, readable at 32px. The 16 hallway `wall_sconce` (9) and `bench` (7) obstacles stop falling back to the desk texture via two new generators (furn_wall_sconce, furn_bench) plus map entries; remaining unmapped one-off types get nearest-credible remaps. Uncollected educational collectibles display an at-a-glance glow: soft pulsing filled aura behind the item plus periodic sparkle particles, additive to the existing bob (Commandment 9).
- [x] **VIS-06**: At least 3 furniture types display a subtle, type-driven idle animation in every room where they appear (not just one hardcoded room): plant leaf-sway (all 14 plants), screen flicker + LED blink on server_rack / monitor_bank / vital_monitor, coffee steam on coffee_station. Animations are created once per room load via tweens/timers; no gameplay or collision changes.

### Navigation Clarity + Reward Sweep (Phase 27)

- [x] **VIS-07**: The door leading toward the next incomplete department on the critical path renders a distinct breathing warm-gold glow that locked, completed, and merely-available doors do not have. "Next" is derived in React (UnifiedGamePage) from UNLOCK_ORDER + completedRooms, with first-hop resolution through hallway connectors via BFS over the roomData door graph; the door state union gains a 'next' value carried through REACT_LOAD_ROOM / REACT_UPDATE_DOOR_STATES. When the player is inside the next incomplete department itself, no door is marked next. Demo mode is unaffected. In-room, after an idle grace period (~9s without movement/click/interaction), un-met completion requirements (untalked required NPCs, unexamined required zones, uncollected required items) receive an occasional single sparkle (2-3 particles, one target every ~5s, round-robin) that stops immediately on any player input — environmental shimmer, never a quest marker: no arrows, no labels, no modals (Commandments 3, 9).
- [ ] **VIS-08**: A feedback audit table covering every player action in exploration mode (walk/footsteps, click-to-move, NPC talk start, zone examine, item collect, hallway board read, dialogue answer correct/incorrect, NPC completion tick, zone completion tick, room-complete fanfare, door enter, locked-door bump, encounter enter/return) documents the audio + visual response for each channel, recorded in the executing plan's SUMMARY. Previously-silent or disproportionate interactions are fixed using already-preloaded SFX keys and existing VFX patterns (Commandments 1, 8): zone and NPC completion update in-world immediately (glow stops, checkmark pops in) without a room reload, and wrong-answer audio is proportional (no breach-alert honk for a dialogue miss). No new modals anywhere; `npm run check` and `npm run build` clean.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin console / certificate generation | Requires backend — future roadmap |
| Analytics and reporting | Requires backend — future roadmap |
| Mobile/responsive layout | Desktop-first for compliance training context |
| Multiplayer / leaderboards | Requires backend, not relevant to individual training |
| World map / minimap | Hospital is 6 rooms — spatial cues and room names suffice |
| Difficulty modes | Compliance training has one target: learner knows the material |
| Skip/fast-forward encounter | Bypasses the teaching moment — encounters are short enough (3-5 min) |
| Full branching narrative | 23 NPCs x full branching = unmaintainable; targeted choice memory (2-3 decisions) achieves the feel at 5% cost |
| Save-to-cloud / progress sync | localStorage sufficient for desktop single-user |
| Hallway redesign / overworld map (v2.2) | Pinned 2026-05-06 — not the lever for the sponsor demo |
| Character select + image-to-8bit pipeline (v2.2) | Pinned 2026-05-06 — defer to v2.3 if sponsor bites |
| Breach decision scenario (v2.2) | Not built; out of demo scope |
| Internal escalation / "levels per room" (v2.2) | Rejected — use existing scenarios as-is |
| New scenarios, new NPCs, new dialogue (v2.2) | Pure curation milestone |
| V2/V3/V5/V6 visual bugs (v2.2) | Out of 1-2 day budget — chat icon, NPC positioning, hallway centering, notice boards |
| Easter eggs / Out-of-Pocket cameo NPC (v2.2) | Defer to v2.3 if sponsor bites |
| Room-7 navigation bug (v2.2) | Out of demo path; deprioritized |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-03 | Phase 11 | Complete |
| FOUN-04 | Phase 11 | Complete |
| FOUN-01 | Phase 12 | Pending |
| FOUN-02 | Phase 12 | Pending |
| NAV-01 | Phase 12 | Pending |
| NAV-02 | Phase 12 | Pending |
| NAV-03 | Phase 12 | Pending |
| NAV-04 | Phase 12 | Pending |
| NAV-05 | Phase 12 | Pending |
| NAV-06 | Phase 12 | Pending |
| NAV-07 | Phase 12 | Pending |
| NAV-08 | Phase 12 | Pending |
| ENC-01 | Phase 13 | Complete |
| ENC-02 | Phase 13 | Complete |
| ENC-03 | Phase 13 | Complete |
| ENC-04 | Phase 13 | Complete |
| ENC-05 | Phase 13 | Complete |
| ENC-06 | Phase 13 | Complete |
| ENC-07 | Phase 13 | Complete |
| NARR-01 | Phase 14 | Pending |
| NARR-02 | Phase 14 | Pending |
| NARR-03 | Phase 14 | Pending |
| NARR-04 | Phase 14 | Pending |
| NARR-05 | Phase 14 | Pending |
| NARR-06 | Phase 15 | Complete |
| NARR-07 | Phase 15 | Complete |
| NARR-08 | Phase 15 | Complete |
| SORT-01 | Phase 16 | Complete |
| SORT-02 | Phase 16 | Complete |
| SORT-03 | Phase 16 | Complete |
| SORT-04 | Phase 16 | Complete |
| SORT-05 | Phase 16 | Complete |
| SORT-06 | Phase 16 | Complete |
| DEMO-01 | Phase 18 | Pending |
| DEMO-02 | Phase 18 | Pending |
| DEMO-03 | Phase 18 | Pending |
| DEMO-04 | Phase 18 | Pending |
| DEMO-05 | Phase 18 | Pending |
| DEMO-06 | Phase 18 | Pending |
| DEMO-07 | Phase 18 | Pending |
| TD-01 | Phase 19 | Complete |
| TD-02 | Phase 19 | Complete |
| TD-03 | Phase 19 | Complete |
| FIX-01 | Phase 20 | Pending |
| FIX-02 | Phase 20 | Pending |
| FIX-03 | Phase 20 | Pending |
| FIX-04 | Phase 20 | Pending |
| CERT-01 | Phase 21 | Complete |
| CERT-02 | Phase 21 | Complete |
| CERT-03 | Phase 21 | Complete |
| CERT-04 | Phase 18 | Complete |
| SORTV2-01 | Phase 22 | Complete |
| SORTV2-02 | Phase 22 | Complete |
| SORTV2-03 | Phase 22 | Complete |
| SORTV2-04 | Phase 22 | Complete |
| SORTV2-05 | Phase 22 | Complete |
| SORTV2-06 | Phase 22 | Complete |
| TRIA-01 | Phase 17 | Complete |
| TRIA-02 | Phase 17 | Complete |
| TRIA-03 | Phase 17 | Complete |
| TRIA-04 | Phase 17 | Complete |
| TRIA-05 | Phase 17 | Complete |
| TRIA-06 | Phase 17 | Complete |
| SORTV2-07 | Phase 23 | Complete |
| SORTV2-08 | Phase 23 | Complete |
| SORTV2-09 | Phase 23 | Complete |
| SORTV2-10 | Phase 23 | Complete |
| SORTV2-11 | Phase 24 | Complete |
| SORTV2-12 | Phase 24 | Complete |
| SORTV2-13 | Phase 24 | Complete |
| SORTV2-14 | Phase 24 | Complete |
| SORTV2-15 | Phase 24 | Complete |

| VIS-01 | Phase 25 | Complete |
| VIS-02 | Phase 25 | Complete |
| VIS-03 | Phase 25 | Complete |
| VIS-04 | Phase 26 | Complete |
| VIS-05 | Phase 26 | Complete |
| VIS-06 | Phase 26 | Complete |
| VIS-07 | Phase 27 | Complete |
| VIS-08 | Phase 27 | Pending |

**Coverage:**
- v2.0 requirements: 27 total, mapped: 27, unmapped: 0
- v2.1 requirements (Phase 16 portion + Phase 22 portion + Phase 17 portion + Phase 23 portion + Phase 24 portion): 27 total (SORT-01..06, SORTV2-01..15, TRIA-01..06), mapped: 27, unmapped: 0
- v2.2 requirements: 18 total, mapped: 18, unmapped: 0
- v2.3 requirements: 8 total, mapped: 8, unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-05-08 — Phase 21 shipped: CERT-01..03 complete. Sponsor demo capstone (dim → 500ms beat → fanfare → certificate + sponsor handoff) wired in CertificateOverlay; demo-only path; sponsor swap test passes by construction (overlay reads sponsorConfig.ts directly).*
