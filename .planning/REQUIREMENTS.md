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

- [ ] **ENC-01**: Encounter trigger/return system — ExplorationScene sleeps while encounter runs, wakes on completion with player position preserved
- [ ] **ENC-02**: Condensed inbound TD encounter — 4 waves, 3 tower types per wave tier, ~3-5 minute duration, using existing BreachDefenseScene with encounter-mode config
- [ ] **ENC-03**: Encounter launches with narrative context card explaining why it's happening ("Dr. Patel flagged suspicious logins...")
- [ ] **ENC-04**: Encounter results feed back to unified game state (score, pass/fail, completion flag)
- [ ] **ENC-05**: Inbound TD encounter triggers from IT Office / Act 3 narrative moment
- [ ] **ENC-06**: Unified compliance score aggregates across dialogue choices and encounter performance, visible in HUD during exploration
- [ ] **ENC-07**: Encounter has clear start screen (narrative card) and end screen (recap with HIPAA takeaways)

### Narrative Arc

- [ ] **NARR-01**: Act progression system with conditions that advance Act 1 → 2 → 3 (based on department completion + encounter status)
- [ ] **NARR-02**: Per-act music shifts using existing tracks — hub theme (Act 1 warm), exploration theme (Act 2 uneasy), breach theme (Act 3 urgent)
- [ ] **NARR-03**: Soft act transitions with no hard title cards — music crossfades and environmental cues signal the shift
- [ ] **NARR-04**: Transition dialogue — NPCs reference player's earlier actions and bridge between acts (targeted: 2-3 key decisions remembered, reflected in 3-5 NPC lines)
- [ ] **NARR-05**: Department ordering supports narrative flow (Reception/Break Room = Act 1, Lab/Records = Act 2, IT/ER = Act 3)
- [ ] **NARR-06**: Environmental storytelling in hallway connectors (bulletin boards, ambient details that shift per act)
- [ ] **NARR-07**: Per-department completion fanfare (visual flourish + chime + badge) when all NPCs/zones/items in a department are completed
- [ ] **NARR-08**: Progress breadcrumb on HUD showing department completion status and current act

## v2.1 Requirements (Deferred)

### New Encounter Types

- **PHI-01**: PHI sorting encounter — drag/tap interface, PHI vs Not-PHI buckets, 2-3 document sets
- **PHI-02**: Outbound TD encounter — inverted direction, cultural/administrative safeguard towers
- **BREACH-01**: Breach triage encounter — classify incidents as reportable or not, notification timelines

### Polish & Completion

- **POLISH-01**: End-of-game report screen (department scores, knowledge areas, time)
- **POLISH-02**: Remaining sprite overhaul (portraits, furniture, tiles, SpriteFactory retirement)
- **POLISH-03**: Expanded sound effects for new encounter types
- **POLISH-04**: Per-area ambient audio

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
| ENC-01 | Phase 13 | Pending |
| ENC-02 | Phase 13 | Pending |
| ENC-03 | Phase 13 | Pending |
| ENC-04 | Phase 13 | Pending |
| ENC-05 | Phase 13 | Pending |
| ENC-06 | Phase 13 | Pending |
| ENC-07 | Phase 13 | Pending |
| NARR-01 | Phase 14 | Pending |
| NARR-02 | Phase 14 | Pending |
| NARR-03 | Phase 14 | Pending |
| NARR-04 | Phase 14 | Pending |
| NARR-05 | Phase 14 | Pending |
| NARR-06 | Phase 15 | Pending |
| NARR-07 | Phase 15 | Pending |
| NARR-08 | Phase 15 | Pending |

**Coverage:**
- v2.0 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-27 — FOUN-03, FOUN-04 complete (Phase 11)*
