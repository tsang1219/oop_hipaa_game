# Enhancement Brief: Unified RPG Experience

**Status:** Draft
**Date:** 2026-03-26
**Scope:** Restructure PrivacyQuest + BreachDefense from two separate games into one cohesive RPG with integrated encounter mechanics

> **V2.0 Scope Note (2026-03-29):** V2.0 delivered Phases 11-15 (stabilization, unified navigation, inbound TD encounter integration, three-act narrative, polish). Sections 4.1 (PHI Sorting), 4.3 (Outbound TD), and 4.4 (Breach Triage) describe encounter types **deferred to V2.1+**. Section 4.2 (Inbound TD) is the only new encounter type implemented in V2.0. Implementation phases in Section 10 use the original numbering (0-7); the actual V2.0 execution used Phases 11-15 in the ROADMAP.

---

## 1. Problem Statement

The current product is two disconnected games sharing a router. A hospital lobby hub connects PrivacyQuest (privacy RPG) and BreachDefense (security tower defense) via two doors. There is no narrative thread, no mechanical connection, and no reason the two halves need each other.

Within PrivacyQuest itself, navigation is a room picker — select a department from a list, do a self-contained scenario, return to the list. There's no sense of moving through a hospital, no spatial continuity, no building toward something.

The result is functional but fragmented. It feels like two compliance modules with game skins, not a game that teaches HIPAA.

---

## 2. Vision

**One hospital RPG. One story. Multiple encounter types.**

The player is a new employee at a hospital. They walk through a continuous, connected hospital — not a menu. They meet staff, discover scenarios, make decisions. The RPG exploration IS the teaching. Periodically, situations trigger short encounter mechanics (PHI sorting, security defense, breach triage) that reinforce and test what the player is learning.

The emotional arc builds empathy for why compliance matters. The player meets patients, builds relationships with coworkers, and learns that HIPAA isn't a set of arbitrary rules — it's protection for real people. When Mrs. Chen's records are at risk, the player cares because they met Mrs. Chen.

### Design North Star

> The player should forget they're doing compliance training. They should feel like they're playing a game — and leave having genuinely learned HIPAA.

This is the Nintendo Test applied to corporate training. Every feature, interaction, and line of dialogue must pass: **would this feel at home in a polished SNES-era RPG?**

---

## 3. Player Experience

### Protagonist

- **Silent protagonist** — new hospital employee (role deliberately vague to match any audience)
- Player makes choices through dialogue selections and encounter performance
- No name, no backstory — the player projects themselves into the role

### Three-Act Structure

The game is structured as three continuous acts. Transitions are soft — the player progresses naturally as conditions are met, not through hard cuts. Acts correspond roughly to difficulty tiers and content depth.

**Act 1 — "First Day" (~15 minutes)**

The player arrives at the hospital. They're getting oriented — meeting staff, learning the layout, understanding basics. Encounters here are simple: straightforward PHI identification, easy dialogue choices. The player builds vocabulary and confidence.

- Meet key NPCs in early departments (Reception, Break Room)
- First PHI sorting encounter — someone hands you a form to redact
- Simple observation gates — spot the sign-in sheet violation
- Tone: warm, welcoming, light humor. "Here's how things work around here."
- Patient stories begin appearing — building emotional investment

**Act 2 — "Something's Wrong" (~20 minutes)**

The player starts discovering problems. Staff cutting corners. Overheard conversations. Unlocked workstations. An NPC mentions suspicious activity on the network. The situations get more ambiguous — gray areas where the right HIPAA choice isn't obvious.

- Deeper departments unlock (Lab, Medical Records, IT Office, ER)
- Harder dialogue scenarios with nuanced choices
- Outbound TD encounter — information is leaking out through human behavior, place cultural/administrative safeguards to stop it
- Observation gates become more subtle
- Tone: tension building. "Something isn't right." Staff are stressed, shortcuts are happening.
- Patient stories carry more weight — these are the people at risk

**Act 3 — "The Breach" (~10 minutes)**

Something goes wrong. The hospital is under active cyber attack. Everything the player has learned is tested under pressure. This is the climax — fast-paced, pulling from all three HIPAA domains.

- Inbound TD encounter — defend hospital systems against cyber threats
- Breach triage — is this reportable? Who do you notify? How fast?
- Final dialogue scenarios that test the hardest judgment calls
- Tone: urgent, high-stakes, then cathartic resolution
- Consequences are visible — the player sees the impact of their choices throughout the game

### Pacing Principles

- **Explore → encounter → consequences → explore.** The core loop stays tight. No encounter pulls the player out for more than 60-90 seconds.
- **Calm and tension alternate.** Breathing room between intense moments (Commandment 7). Walking through a quiet hallway after a tough scenario is not wasted time.
- **Difficulty scales through progression, not settings.** Early encounters are simple. Later ones are ambiguous. The game teaches before it tests.
- **Every room has NPC conversation.** The ratio of mechanic-based encounters to dialogue/exploration is roughly 30/70. Exploration IS the teaching. Encounters are reinforcement.

---

## 4. Encounter Mechanics

### 4.1 PHI Sorting — DEFERRED TO V2.1

**What it teaches:** Privacy Rule — identifying PHI, the 18 identifiers, minimum necessary

**Trigger:** NPC asks the player to review a document, redact information, or determine what can be shared

**Mechanic:**
- A document/form/screen appears with mixed information
- Player drags items into "PHI" vs "Not PHI" buckets, or taps to highlight PHI elements
- Keyboard support (arrow keys + confirm) alongside mouse/tap
- Timed variation for later encounters (soft timer — no hard fail, but score bonus for speed)

**Duration:** 30-60 seconds per encounter

**Difficulty scaling:**
- Act 1: Obvious items (full name, SSN vs. room temperature, hospital address)
- Act 2: Subtle items (diagnosis codes without names, IP addresses, biometric data)
- Act 3: Edge cases under pressure (de-identified data sets, limited data sets)

**Estimated occurrences:** 2-3 across the full game

### 4.2 Security Defense (Tower Defense — Inbound)

**What it teaches:** Security Rule — technical and physical safeguards, defense in depth

**Trigger:** Player discovers an active cyber threat during Act 3 exploration

**Mechanic:**
- Reuses existing BreachDefense grid engine (condensed)
- 10x6 grid, 64px cells, serpentine path
- Threats move inward toward hospital systems
- Player places technical safeguard towers to stop them

**Condensed format:**
- **4 waves** (not 10) — escalating, with a boss wave at the end
- **3 tower types available** per encounter (selected from the existing 6 based on narrative context)
- Each wave is shorter — fewer enemies, faster resolution
- Total encounter duration: 3-5 minutes

**Tower selection for integrated encounter:**
- Wave 1-2: Choose from Firewall, MFA Shield, Training Beacon (basics)
- Wave 3: Add Encryption Vault or Patch Cannon (escalation)
- Wave 4 (boss): All available — coordinated multi-vector attack

**Estimated occurrences:** 1 (Act 3 climax), possibly 1 smaller intro encounter in Act 2

### 4.3 Security Defense (Tower Defense — Outbound) — DEFERRED TO V2.1

**What it teaches:** Privacy Rule in action — preventing inappropriate disclosures through cultural and administrative safeguards

**Trigger:** Player discovers staff are being careless with patient information during Act 2 exploration

**Mechanic:**
- Same grid engine as inbound TD, but **direction is inverted**
- Information tries to leave the hospital through human channels
- Player places cultural/administrative safeguard "towers" to prevent leaks

**Outbound threat types (new):**
| Threat | Description | Teaches |
|--------|-------------|---------|
| Gossip Carrier | Staff heading to cafeteria to discuss patient | Casual disclosure |
| Unencrypted Email | Message queued to external recipient | Electronic safeguards |
| Photo Snapper | Phone with patient images heading to social media | Photography policies |
| Misdirected Fax | PHI being sent to wrong number | Verification procedures |
| Open Folder Walker | Printed records carried through public areas | Physical safeguards |
| Shoulder Surfer | Unauthorized person reading screen | Workstation security |

**Outbound tower types (new):**
| Tower | Role | Teaches |
|-------|------|---------|
| Privacy Reminder | Slows careless behavior (area effect) | Awareness training |
| Shred Station | Destroys physical documents before they exit | Proper disposal |
| Screen Filter | Blocks visual access to screens | Physical safeguards |
| Secure Channel | Redirects communication to encrypted path | Technical safeguards |
| Policy Checkpoint | Stops and challenges inappropriate disclosures | Administrative controls |

**Format:** 3-4 waves, 3 tower types available. Duration: 2-4 minutes.

**Key design point:** This encounter makes the player viscerally understand that **they and their coworkers are the vulnerability**, not just hackers. The "towers" are behaviors and policies, not software. This is one of the hardest concepts to land in traditional training.

**Estimated occurrences:** 1 (Act 2)

### 4.4 Breach Triage (TBD — Pinned for Design) — DEFERRED TO V2.1

**What it teaches:** Breach Notification Rule — identifying reportable breaches, notification timelines, chain of reporting

**Trigger:** Evidence of a breach discovered during Act 3

**Mechanic — initial concept:**
- Incidents appear rapidly (whack-a-mole pacing)
- Player must quickly classify: reportable breach or not?
- For reportable breaches: select who to notify, in what timeframe
- Timer creates urgency — mirrors real breach response pressure

**Status:** Concept only. May simplify to a timed quiz sequence rather than a full mini-game mechanic. Breach Notification is lower priority than Privacy and Security content. Design will be finalized during phase planning.

**Duration:** 30-60 seconds

**Estimated occurrences:** 1 (Act 3)

### 4.5 Existing Encounter Types (Preserved)

These encounter types already exist and work well. They remain the backbone of the RPG experience:

- **NPC Dialogue Scenes** — 4-choice HIPAA scenarios with score feedback and branching. 23 named NPCs across 6 departments. This is the primary teaching mechanism.
- **Observation Zones** — Click to spot violations (sign-in sheets, unlocked workstations, sticky-note passwords, etc.). 10+ zones across rooms. Teaches environmental awareness.
- **Educational Items** — Interactive posters, manuals, terminals. 7 items covering PHI definition, patient rights, minimum necessary, penalties, safeguards, emergency exceptions. Reference material the player discovers organically.
- **Patient Stories** — Narrative reveals when rooms complete. 6 stories showing human impact of HIPAA protections. The emotional core of the game.
- **Gate Mechanics** — Observation gates (spot violation before progressing), choice gates (pick interaction order), social gates (navigate pressure). Creates engagement structure within rooms.

---

## 5. Hospital Layout & Navigation

### Current State

- Hub World: Hospital lobby with two doors (left = PrivacyQuest, right = BreachDefense)
- PrivacyQuest: Room picker UI (HallwayHub) → select department → enter room → return to picker
- Three separate Phaser scenes, three separate React pages, three separate routes

### Target State

- **One continuous hospital** the player walks through
- Departments connected by hallways with doors
- Walk through a door → next area loads (scene transition with brief animation)
- Player can walk back to previous areas (rooms are re-enterable)
- Linear progression: areas unlock as the player advances, but completed areas remain accessible
- No world map needed — hospital is small enough to navigate by walking
- Hub lobby becomes the starting area, not a separate game

### Department Flow (Linear Progression)

```
Hospital Entrance (intro, orientation)
    ↓
Reception (Act 1 — privacy basics, first encounters)
    ↓
Break Room (Act 1 — human factors, casual violations)
    ↓
Laboratory (Act 2 — PHI deep dive, data origin)
    ↓
Medical Records (Act 2 — access rights, legal scenarios)
    → Outbound TD encounter triggered here or nearby
    ↓
IT Office (Act 2/3 — security, technical safeguards)
    → Inbound TD encounter triggered from here
    ↓
Emergency Room (Act 3 — crisis scenarios, hardest judgment calls)
    → Breach triage triggered here
    ↓
Resolution / Debrief (Act 3 — wrap-up, final score, reflection)
```

### Existing Departments (All 6 Preserved)

| Department | Current Content | Act | Role in New Structure |
|-----------|----------------|-----|----------------------|
| **Reception** | Riley, Nervous Patient, Chatty Visitor, sign-in sheet, NPP | Act 1 | Entry point. Privacy basics. First PHI sorting encounter. |
| **Break Room** | 5 NPCs, gossip, phone photos, HR director | Act 1 | Human factors. Social pressure. Sets up outbound TD themes. |
| **Laboratory** | Lab tech, researcher, courier, sample labels, results | Act 2 | PHI deep dive. The 18 identifiers. Data at its source. |
| **Medical Records** | Records clerk, patient, attorney, CCO chain, audit logs | Act 2 | Access rights, legal, minimum necessary. Heavy NPC content. |
| **IT Office** | Security analyst, vendor, workaround employee, password note | Act 2/3 | Technical safeguards. Bridges to Act 3 threat discovery. |
| **Emergency Room** | ER doctor, police officer, family member, whiteboard | Act 3 | Edge cases under pressure. Hardest scenarios. |

### Navigation Mechanics

- **Movement:** WASD/arrow keys (continuous), click-to-move with BFS pathfinding (existing)
- **Door interaction:** Walk to door, press SPACE → brief transition animation → next area loads
- **Backtracking:** Player can walk back through doors to revisit areas
- **Visual cues:** Doors glow or have indicators showing: locked (can't enter yet), available (ready to explore), completed (already cleared)
- **Hallway connectors:** Brief connecting hallway segments between departments provide pacing breaks and environmental storytelling (bulletin boards, overheard conversations, ambient details)

---

## 6. Progression & Scoring

### Unified Progression

Currently, PrivacyQuest has a privacy score and BreachDefense has a security score. These merge into a single system:

- **Compliance Knowledge Score** — running total across all encounter types and dialogue choices
- Correct dialogue choices: +3
- Partial credit: +1
- Incorrect: -1 to -3 (proportional to violation severity)
- Encounter performance: scored per mechanic (sorting accuracy, defense efficiency, triage speed)
- Score visible in HUD throughout — animates on change (existing behavior)

### Completion Tracking

- Per-department: NPCs talked to, zones spotted, items read, patient story unlocked
- Per-encounter: completed/not, score achieved
- Overall: departments completed, total score, encounters cleared
- Visual progress indicator (completion percentage or department checkmarks) visible to player

### "Passing"

- **Completion = passing.** The player finishes the game, they've completed training.
- Score reflects quality of learning but doesn't gate progression — the player always moves forward
- Wrong answers trigger educational feedback explaining the correct rule (existing behavior)
- The game teaches through failure, not punishment

### End-of-Game Report

- Summary screen showing: departments completed, encounter scores, total compliance score
- Highlight strongest and weakest HIPAA knowledge areas
- Time to complete
- **Future phase (out of scope for MVP):** Certificate generation, admin dashboard, leaderboard, analytics

---

## 7. Audio Design

### Current State

3 music tracks (hub, exploration, breach), ~8 sound effects, Kenney impact library

### Target State

Audio is critically important to the game feel. Every interaction needs audio feedback (Commandment 1).

**Music:**
- Per-area background tracks (or at minimum, per-act mood shifts)
- Tension escalation from Act 1 (warm, welcoming) → Act 2 (uneasy, building) → Act 3 (urgent, dramatic)
- Existing tracks can be reassigned: hub theme → Act 1, exploration theme → Act 2, breach theme → Act 3
- Victory/resolution music for ending

**Sound effects (expand existing library):**
- **Navigation:** Footsteps (existing), door open/close, area transition swoosh
- **Interaction:** NPC talk start, item pickup, observation zone discover
- **Encounter — PHI Sorting:** Item drag, correct bucket drop (chime), wrong bucket (thud), completion fanfare
- **Encounter — TD:** Tower place (existing), enemy death (existing), wave start (existing), wave complete, encounter victory
- **Encounter — Breach Triage:** Incident pop-up, correct classification (ding), wrong classification (buzz), timer tick
- **Feedback:** Correct answer chime (existing), wrong answer thud (existing), room complete fanfare, patient story reveal, act transition
- **Ambient:** Hospital background (soft PA announcements, distant conversation, equipment hum) — adds immersion without being intrusive

### Audio Principles

- Every player action produces a sound (Commandment 1)
- Feedback scales with moment size (Commandment 8) — button tap is subtle, room complete is a fanfare
- Silence before big reveals creates anticipation (Commandment 2)
- Encounter music is distinct from exploration music — signals "this is a different mode"

---

## 8. Content Strategy

### What We Keep

All existing content is preserved and rearranged, not rewritten:

- **23 named NPCs** with personality, dialogue, and HIPAA scenarios — these are the game's greatest asset
- **6 department room layouts** with observation zones, educational items, gate mechanics
- **47+ dialogue scenes** with 4-choice branching and score feedback
- **6 patient stories** providing emotional weight
- **7 educational items** as discoverable reference material
- **6 tower types + 8 threat types** for inbound TD (condensed usage)
- **Tutorial content and codex entries** from BreachDefense

### What We Add

- **Outbound TD content:** 5-6 new threat types, 4-5 new tower types (cultural/administrative safeguards)
- **PHI sorting encounter content:** 2-3 document sets with mixed PHI/non-PHI items, scaling difficulty
- **Breach triage encounter content:** Incident scenarios with reportable/non-reportable classification (TBD — pinned)
- **Hallway connector content:** Environmental storytelling between departments (bulletin boards, ambient details)
- **Transition dialogue:** NPC lines that bridge acts and reference player's earlier choices
- **End-of-game report content:** Summary text, knowledge area descriptions

### What We Modify

- **NPC dialogue placement** — some dialogue may shift departments to fit the three-act pacing
- **Encounter triggers** — TD launches from RPG world events, not from a separate route
- **Room ordering** — departments resequenced for narrative flow (Reception → Break Room → Lab → Records → IT → ER)
- **Hub world** — transforms from game-picker lobby into the hospital entrance/starting area

### Content Principles (Unchanged)

- Teach through situations, not text (Commandment 3)
- NPCs are people, not rule-delivery systems (Commandment 4)
- Boring is a bug (Commandment 5)
- Gray areas > obvious right/wrong — the most valuable learning happens in ambiguity
- Patient stories are the emotional core — they're why compliance matters

---

## 9. Technical Architecture Changes

### Scene Structure

**Current:** 4 independent Phaser scenes (Boot, HubWorld, Exploration, BreachDefense)

**Target:** Scene-per-area with shared systems
- `BootScene` — asset preloading (preserved)
- `HospitalScene` or area-specific scenes — continuous hospital with department transitions
- `EncounterScene` or encounter overlay — handles PHI sorting, TD (inbound + outbound), breach triage
- Alternatively: one flexible exploration scene that loads different room data (closer to current ExplorationScene architecture, but with door-to-door transitions instead of room picker)

**Decision point for phase planning:** Single scene with room-loading vs. multiple linked scenes. Current ExplorationScene already loads room data dynamically — extending this with door transitions may be simpler than multiple scenes.

### Routing

**Current:** `/` → Hub, `/privacy` → PrivacyQuest, `/breach` → BreachDefense

**Target:** Single route (`/`) for the unified game. The standalone `/breach` route may be preserved as an optional "arcade mode" — decision deferred to implementation.

### State Management

**Current:** PrivacyQuest saves to localStorage (rooms, NPCs, score). BreachDefense is session-only.

**Target:** Unified game state in localStorage:
- Act progression (which act the player is in)
- Department completion status
- Encounter results (per encounter)
- Unified compliance score
- Player position (for resume — if someone closes mid-game)
- Total play time

### EventBridge

Existing EventBridge pattern (Phaser EventEmitter singleton) is preserved. New events added for:
- Encounter triggers (RPG world → encounter launch)
- Encounter results (encounter complete → RPG world consequences)
- Act transitions
- Unified score updates

### React Overlays

React continues to own all text display, modals, HUD, and dialogue. New overlays needed for:
- PHI sorting encounter UI (drag-and-drop interface)
- Breach triage encounter UI (if built as a mini-game)
- Unified HUD (compliance score, department progress, act indicator)
- End-of-game report screen

---

## 10. Implementation Phases

These phases are designed so the game is playable after each one. No phase leaves the product in a broken state.

### Phase 0 — Stabilize (Pre-Enhancement)

**Goal:** Fix known bugs in the current game. Establish a clean baseline.

- Bug fix pass on existing PrivacyQuest and BreachDefense
- Don't fix bugs in systems being replaced (room picker, hub world doors)
- Do fix bugs in systems that survive: rendering, dialogue, encounters, state, audio
- Result: current game works correctly end-to-end

### Phase 1 — Unified Hospital Navigation

**Goal:** Replace hub + room picker with continuous hospital. Player walks between departments through doors.

- Convert hub world from game-picker lobby to hospital entrance
- Add door-to-door transitions between departments
- Implement linear unlock progression (departments available based on completion)
- Add hallway connectors between areas
- Remove room picker UI (HallwayHub)
- Preserve all existing room content, NPC interactions, observation zones
- Result: one continuous hospital the player walks through, all existing content accessible

### Phase 2 — Encounter Integration (Tower Defense)

**Goal:** Move TD from standalone game into RPG-triggered encounter.

- Create encounter trigger system (RPG event → encounter launch → return to RPG)
- Condense inbound TD: 4 waves, 3 tower types, ~3-5 minutes
- Wire encounter trigger to IT Office / Act 3 narrative moment
- Pass encounter results back to RPG world (NPC reactions, world state changes)
- Standalone `/breach` route: decide keep as arcade mode or remove
- Result: TD plays as part of the RPG story, not a separate game

### Phase 3 — New Encounter: PHI Sorting

**Goal:** Build PHI sorting mini-game and integrate into RPG.

- Design and build sorting interface (drag/tap, buckets, keyboard support)
- Create 2-3 document sets with scaling difficulty
- Wire encounter triggers to appropriate narrative moments (Act 1 Reception, Act 2 Lab/Records)
- Audio and visual feedback for correct/incorrect sorting
- Result: PHI identification is tested through gameplay, not just dialogue

### Phase 4 — New Encounter: Outbound Tower Defense

**Goal:** Build inverted TD variant with cultural/administrative safeguard towers.

- Create outbound threat types (gossip, photos, misdirected fax, etc.)
- Create outbound tower types (privacy reminders, shred stations, screen filters, etc.)
- Reuse existing TD grid engine with inverted direction
- 3-4 waves, 3 tower types, ~2-4 minutes
- Wire encounter trigger to Act 2 narrative moment
- Result: player experiences that human behavior is the primary vulnerability

### Phase 5 — Three-Act Narrative Arc

**Goal:** Shape the game's pacing, tone, and story across three acts.

- Implement act progression system (conditions that advance acts)
- Adjust music per act (warm → uneasy → urgent, using existing tracks)
- Add transition dialogue and NPC reactions that reference player's earlier choices
- Ensure department ordering supports narrative flow
- Add environmental storytelling in hallway connectors
- Polish act transitions (soft, continuous — no hard cuts)
- Result: the game has a story arc, not just a sequence of rooms

### Phase 6 — Breach Triage Encounter (If Scoped)

**Goal:** Build breach notification mini-game or timed quiz.

- Design finalized during this phase (mini-game vs. quiz sequence)
- Create incident scenarios with reportable/non-reportable classification
- Wire to Act 3 narrative moment
- Result: Breach Notification Rule has an interactive teaching moment

### Phase 7 — Audio, Polish & End-of-Game

**Goal:** Complete audio coverage, polish all interactions, build end-of-game experience.

- Expand sound effects for new encounter types
- Per-area ambient audio
- End-of-game report screen (department scores, knowledge areas, time)
- Final playtime tuning — target under 60 minutes
- Visual polish pass on all new UI (sorting interface, outbound TD, transitions)
- Full playthrough QA
- Result: complete, polished, cohesive game

---

## 11. What's NOT In Scope (Future Roadmap)

These are valuable features deferred beyond this enhancement:

- **Admin console** — dashboard for training administrators
- **Certificate generation** — completion certificates for HR/compliance
- **Analytics and reporting** — aggregate data on player performance
- **Leaderboard** — comparative scoring across players
- **Mobile optimization** — responsive layout and touch controls (basic touch works now, not optimized)
- **Additional HIPAA content** — new scenarios, new departments, expanded patient stories
- **Difficulty modes** — adjustable difficulty for different audiences
- **Multiplayer / competitive** — team-based or competitive training modes

---

## 12. Success Criteria

The enhancement is successful when:

1. **One game, not two.** A player starts and finishes one continuous experience. No game selection menu.
2. **Under 60 minutes.** A typical playthrough completes in 45-60 minutes.
3. **All existing content accessible.** No NPC, dialogue, patient story, or educational item is lost.
4. **Encounter integration works.** Inbound TD triggers from the RPG world and returns the player to exploration seamlessly. (PHI sorting and outbound TD deferred to V2.1.)
5. **The Nintendo Test.** A playtester says "that was actually fun" without being prompted. The game feels like a game, not a compliance module.
6. **HIPAA coverage maintained.** All topics rated STRONG or ADEQUATE in the Training Framework retain their rating. No coverage regression.
7. **Audio on every interaction.** No silent actions in the shipped game.

---

## 13. Open Questions

These will be resolved during phase planning:

1. **Single scene vs. multi-scene architecture** — Does the unified hospital use one Phaser scene that loads room data (extend current ExplorationScene) or multiple linked scenes with transitions?
2. **Breach triage mechanic** — Mini-game or timed quiz? How much investment is warranted for a lower-priority HIPAA topic?
3. **Standalone arcade mode** — Keep `/breach` as a separate playable mode, or fully absorb into RPG?
4. **Save/resume** — How granular should save state be? Per-department? Per-act? Mid-encounter?
5. **Outbound TD path design** — What does the grid layout look like when information flows outward? Reverse the existing serpentine, or a new layout?
6. **Act transition triggers** — What specific conditions advance from Act 1 → 2 → 3? Completion count? Score threshold? Narrative flags?
