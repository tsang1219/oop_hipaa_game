# Phase 16: PHI Sorter Encounter — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning
**Source:** Inferred from ENHANCEMENT_BRIEF.md §4.1 + ROADMAP.md Phase 16 success criteria + 2026-05-01 user direction (V2.1 milestone scope)

<domain>
## Phase Boundary

This phase delivers ONE new encounter type: a PHI Sorter mini-game. The encounter:
- Triggers from in-world narrative moments (NPC hands the player a document/form/screen to sort)
- Runs as a 30-60 second mini-game with drag-and-drop OR keyboard input
- Asks the player to sort mixed items into "PHI" vs "Not PHI" buckets
- Scales in difficulty by act (Act 1 obvious → Act 2 subtle → Act 3 edge cases)
- Returns the player to the RPG world with an EncounterDebrief and a unified compliance score update

This phase reuses Phase 13 encounter infrastructure verbatim — the encounter lifecycle (ExplorationScene sleep/wake, NarrativeContextCard, EncounterDebrief, EventBridge events, unified compliance score). It does NOT modify that infrastructure.

This phase does NOT include:
- Outbound Tower Defense encounter (deprioritized per V2.1 sequencing decision)
- Breach Triage encounter (Phase 17, ships next)
- Any new Phase 13 encounter scaffolding (sleep/wake, debrief, etc. — already shipped)
- New narrative-arc gating logic (Phase 14 act state is consumed as-is)

</domain>

<decisions>
## Implementation Decisions

### Encounter trigger model — LOCKED (from Phase 13 pattern)
- Re-use the existing trigger pattern proven in Phase 13: a tile zone in a room → proximity check → emit ENCOUNTER_TRIGGER event → React opens the encounter overlay → ExplorationScene sleeps in place (player position preserved).
- Phase 13 reference: IT Office encounter zone at tile (9,6) auto-triggers on proximity. The PHI Sorter follows the same pattern but in different rooms.

### Trigger locations — LOCKED
- **Act 1: Reception** — primary first encounter, narrative framing "Riley needs help redacting intake forms before they go to the auditor"
- **Act 2: Lab** OR **Medical Records** — at least one Act 2 trigger; the planner can pick whichever fits the existing room scripting better (likely Lab — sample labels naturally surface PHI vs non-PHI). The other Act 2 location is optional polish.
- **Act 3: optional/stretch** — edge-case encounter (de-identified vs limited data sets) is desirable but the planner may defer to a follow-up phase if scope balloons.

### Input modes — LOCKED (BOTH required, no fallback gaps)
- **Drag-and-drop:** mouse picks up an item, drops into PHI / Not PHI bucket
- **Keyboard:** arrow keys (↑↓ to cycle items, ←→ to choose bucket), Enter or Space to commit
- Keyboard-only completion must be fully supported — no required mouse input. This was an explicit user ask.
- No controller support required for V2.1 (deferred).

### Scoring — LOCKED (proportional to accuracy)
- Per item: correct = +1, incorrect = -1 (or 0; planner picks whichever matches existing dialogue scoring conventions in `useGameState.ts` / `addScore`)
- Encounter contribution to unified compliance score: derived from accuracy %, scaled similarly to Phase 13's encounter-score formula (`Math.round((securityScore / 100) * 12)` was the inbound-TD pattern). Planner should match magnitude — encounter contribution should be comparable to inbound TD, not dwarf or be dwarfed by it.
- Wrong answers must trigger educational feedback explaining the correct rule (per CLAUDE.md HIPAA Content Review). Wrong-answer text is short, in-character, not a lecture.

### Audio/visual feedback — LOCKED (Commandments 1, 8)
- **Correct drop:** green flash on bucket + chime sound (reuse existing dialogue correct-answer chime if it fits, else add new)
- **Incorrect drop:** red shake on bucket + thud sound (reuse existing wrong-answer thud or new)
- **Encounter completion:** fanfare (reuse Phase 15 sfx_fanfare) + visual flourish on debrief
- Every item drop produces audio + visual feedback. No silent interactions.
- Anticipation beat before reveal (Commandment 2): brief pause before the debrief score appears.

### Document sets — LOCKED (at least 3)
- **Set 1 (Act 1, Reception, "obvious"):** full name, SSN, DOB vs. room temperature, hospital street address, weather. ~6-8 items.
- **Set 2 (Act 2, Lab/Records, "subtle"):** diagnosis codes without names, IP addresses, biometric data, account numbers, device identifiers, vehicle identifiers. The 18 HIPAA identifiers are the source of truth — surface the less-obvious ones here. ~6-8 items.
- **Set 3 (Act 3 OR Act 2 stretch, "edge cases"):** de-identified data sets, limited data sets, partial dates (year-only OK, full date NOT), zip3 vs zip5. Edge cases that test understanding of the Safe Harbor rule. ~4-6 items.
- Items live in a TypeScript constants file (per CLAUDE.md: "All game data lives in TypeScript constants files — not hardcoded in scenes").

### Architecture — LOCKED (split per project convention)
- **Phaser owns:** none of the sorting UI itself. Phaser pauses the scene during the encounter (existing pattern).
- **React owns:** the entire sorter overlay (drag-drop, keyboard input, item rendering, bucket targets, debrief screen). Per CLAUDE.md: "React owns: menus, HUD overlays, dialogue/text display, modals, educational content panels."
- **EventBridge:** new events for encounter start/complete (or reuse the existing ENCOUNTER_TRIGGER / ENCOUNTER_COMPLETE event names from Phase 13 with a discriminator field — planner picks).

### Save data — LOCKED
- Encounter completion + accuracy stored in `pq:save:v2` schema alongside dialogue completion. Planner extends SaveDataV2 with a sorter-results field.
- No mid-encounter save needed — encounter is short (30-60s), restart on resume is acceptable.

### Claude's Discretion
- Specific tile coordinates for trigger zones in each room
- Exact React component file structure (single component vs split — prefer split if >300 LOC)
- Whether item rendering uses sprites, CSS, or a hybrid (Tailwind preferred per stack)
- Exact scoring formula coefficients
- Whether Act 2 second trigger ships in this phase or defers
- Whether the input-mode toggle is implicit (mouse OR keyboard works, both always live) or explicit (UI button) — strongly prefer implicit
- Test coverage approach (Playwright E2E vs unit tests for sort logic — both fine, Playwright preferred for the integration story)

</decisions>

<specifics>
## Specific Ideas

### Item shape (suggested, planner can refine)
```ts
type SorterItem = {
  id: string;
  label: string;             // "Patient SSN: 123-45-6789"
  category: "phi" | "not_phi";
  identifierType?: string;   // For PHI: "ssn", "name", "dob", ... (one of the 18)
  explanation: string;       // Shown on incorrect drop: why it IS or IS NOT PHI
};

type SorterDocumentSet = {
  id: string;
  act: 1 | 2 | 3;
  triggerLocation: string;   // "reception", "lab", "medical_records"
  npcId: string;             // Whose request triggers this
  contextCard: { title: string; body: string };
  items: SorterItem[];
  passingAccuracy: number;   // % needed for "passing" — defaults to 70?
};
```

### Reuse map
- **Phase 13 patterns to copy:**
  - `EventBridge` ENCOUNTER_TRIGGER / ENCOUNTER_COMPLETE event flow
  - `ExplorationScene` sleep/wake lifecycle on encounter
  - `NarrativeContextCard` React component (open with `{ title, body }`)
  - `EncounterDebrief` React component (open with `{ score, takeaways[] }`)
  - `UnifiedGamePage` phase state machine for overlay routing
- **Phase 15 patterns to copy:**
  - `sfx_fanfare` for completion
  - Particle burst pattern from completion fanfare
- **Existing constants pattern:**
  - `client/src/data/roomData.json` for trigger zone definitions
  - `client/src/data/gameData.json` for dialogue — sorter items follow similar conventions
  - Suggest new file: `client/src/data/sorterData.ts` (TS not JSON because items have functions/conditional logic potential)

### HIPAA accuracy notes
- The 18 HIPAA identifiers per 45 CFR §164.514(b)(2) — Safe Harbor list. Items must reflect this list accurately.
- "PHI" requires both (a) one of the 18 identifiers AND (b) connection to past/present/future health condition or payment. Pure demographics (name + address) are NOT PHI without a health context — but in a hospital intake form, the context IS implied. The sorter should make this distinction in at least one Act 2/3 item.
- Reference: `.planning/HIPAA_TRAINING_FRAMEWORK.md` for content accuracy requirements
- Reference: `.planning/CONTENT_MANIFEST.md` — sorter items must be added to the manifest

</specifics>

<deferred>
## Deferred Ideas

- **Controller / gamepad support** — keyboard + mouse only for V2.1
- **Timed mode / score bonus for speed** — soft timer mentioned in brief §4.1 is deferred; encounter has a soft duration target (30-60s) but no scoring bonus for speed
- **Animated item entry** — items can fade/slide in but elaborate animations are stretch
- **Outbound Tower Defense** — V2.1 deprioritized
- **Act 3 edge-case set as a separate trigger** — may collapse into Act 2 stretch if the player journey doesn't have a natural Act 3 sorter beat (the brief says ER is the Act 3 anchor, dominated by Triage Phase 17)
- **Multi-language support** — out of scope
- **Per-item difficulty grading** — items just live in their set's act tier; no per-item difficulty score

</deferred>

---

*Phase: 16-phi-sorter-encounter*
*Context gathered: 2026-05-01 from ENHANCEMENT_BRIEF + ROADMAP success criteria + V2.1 milestone direction*
