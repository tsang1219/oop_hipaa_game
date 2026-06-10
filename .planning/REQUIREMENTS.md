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

### PHI Sorter Redesign — Content + Connection (Phase 22)

- [x] **SORTV2-01**: Each PHI Sorter document set contains 10 items (up from 6/8/5), each presented as a fake patient chart with patientName plus at least one free-text chart field. HIPAA accuracy preserved — no item changes its `category` field vs the Phase 16 build; the 18 identifiers per 45 CFR §164.514(b)(2) Safe Harbor remain the source of truth.
- [x] **SORTV2-02**: ≥30% of items contain a humor beat (cat-as-emergency-contact, doctor's frustrated annotation, mundane-but-specific oddity) in a chart field that does NOT affect classification. Humor lives in admin-system absurdity, never in patient demographics. CONTENT_MANIFEST.md is updated to reflect the rewrite.
- [x] **SORTV2-03**: During sorting, the trigger NPC (Aiyana for Set 1, Marcus for Set 2, Dr. Tovar for Set 3) shows a speech bubble that updates on each item drop — at least 4 specific-item reaction lines per NPC plus 3 accuracy-band fallback lines (shaky / good / strong).
- [x] **SORTV2-04**: Exactly one item per set is flagged as a "HOLD IT" reveal. When the player correctly classifies it, the NPC reaction bubble enters a distinct visual treatment (scaled portrait, gold border flash, dedicated SFX) and shows a 1-2 sentence educational beat. Stays in flow — not a full-screen modal.
- [x] **SORTV2-05**: All Phase 16 PHI Sorter success criteria still hold: drag-and-drop + keyboard parity, audio-visual feedback per drop, debrief with takeaways, score contribution via `Math.round((correct/total) * 12)`, replayability after abort.
- [x] **SORTV2-06**: Encounter completes in 60-90 seconds (up from Phase 16's 30-60s to accommodate larger sets with NPC reaction beats). SorterDebrief surfaces the trigger NPC's name in the close-button context (e.g., "BACK TO AIYANA").

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

**Coverage:**
- v2.0 requirements: 27 total, mapped: 27, unmapped: 0
- v2.1 requirements (Phase 16 portion + Phase 22 portion): 12 total, mapped: 12, unmapped: 0
- v2.2 requirements: 18 total, mapped: 18, unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-05-08 — Phase 21 shipped: CERT-01..03 complete. Sponsor demo capstone (dim → 500ms beat → fanfare → certificate + sponsor handoff) wired in CertificateOverlay; demo-only path; sponsor swap test passes by construction (overlay reads sponsorConfig.ts directly).*
