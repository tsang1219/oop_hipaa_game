# Phase 22: PHI Sorter Redesign — Content + Connection — Context

**Gathered:** 2026-05-10
**Status:** Ready for planning (3 creative questions pending for user — see §6, non-blocking)
**Source:** Inferred from PHI_SORTER_REDESIGN_BRIEF.md + ROADMAP Phase 22 success criteria + user direction (game inspirations Phoenix Wright + WarioWare + Two Point Hospital, 2026-05-08)

<domain>
## Phase Boundary

This phase rewrites the PHI Sorter encounter's **content layer** to feel funny, characterful, and connected to the world — without touching the underlying UI mechanic (bucket sort) or the encounter routing (NPC trigger → request modal → sorter → debrief).

Three product moves:

1. **Items become fake patient charts.** Today an item is a label string like "Patient SSN: 123-45-6789." After Phase 22, each item is a small chart with name, age, role/occupation, emergency contact, reason-for-visit, optional doctor's notes — Two Point Hospital tone where humor lives in admin-system absurdity, not patient demographics. The chart's PHI/Not-PHI classification is unchanged (same `category` field), but the *experience* of reading it is rewarding.

2. **NPC stays present during the sort.** Aiyana (Reception) and Marcus (Lab) currently introduce the encounter then disappear behind the overlay. Phase 22 adds a persistent NPC speech bubble that reacts to specific items as the player drops them. They become co-workers, not gatekeepers.

3. **One Phoenix Wright "HOLD IT!" reveal per encounter.** Each set has one designated tricky item (the edge case — partial date, ZIP3 vs ZIP5, diagnosis-without-name). When the player nails it correctly, the NPC delivers a dramatic 1-2 sentence beat with distinct visual treatment (portrait scale, gold flash, dedicated SFX). Turns the correct answer from "+1 score" into "I get it now."

**Does NOT include:**
- UI mechanic changes — bucket sort stays; the format shift to stamps is Phase 24
- New feedback polish (particles, camera shake, completion overlay) — that's Phase 23
- Time pressure / visible clock — Phase 24
- New encounter trigger NPCs or routing — Phase 16 ships those
- Schema changes beyond extending SorterItem with chart-field data
- Phase 13 encounter infrastructure
- Any modifications to NarrativeContextCard, EncounterDebrief, BreachDefense

</domain>

<decisions>
## Implementation Decisions

### Items per set — LOCKED at 10
The brief says 8-12; the ROADMAP success criterion says 8-12. Locking 10 as the canonical count — round number, fits Set 1 difficulty curve (6 obvious + 3 medium + 1 HOLD IT edge), preserves 60-90s encounter duration target.

### HIPAA accuracy gate — LOCKED (non-negotiable)
- The 18 identifiers per **45 CFR §164.514(b)(2) Safe Harbor** are the source of truth for `category`
- No item changes its category during rewrite. Cat-as-emergency-contact = still NOT PHI; doctor's frustrated annotation = still relevant to the underlying classification logic
- If a humor beat would require fudging the rule, the rule wins — find a different joke
- CONTENT_MANIFEST.md must be updated when content lands (mandate from CLAUDE.md HIPAA Content Review)
- Reference: `.planning/HIPAA_TRAINING_FRAMEWORK.md` coverage targets — Phase 16 raised PHI identification from THIN to ADEQUATE; Phase 22 must not regress this

### Item schema — LOCKED (additive)
Existing `SorterItem` shape (id, label, category, identifierType?, explanation) is extended, not replaced:

```ts
type SorterItem = {
  id: string;
  category: 'phi' | 'not_phi';
  identifierType?: string;        // existing — one of the 18
  explanation: string;             // existing — shown on wrong drop

  // Phase 22 additions:
  chart: SorterChart;              // the full chart fields, rendered in card UI
  holdIt?: SorterHoldIt;            // present on the one designated edge case per set
};

type SorterChart = {
  patientName: string;             // "Henderson, Margaret" — TPH-tone
  age?: number;
  role?: string;                    // patient's occupation/role — humor surface
  emergencyContact?: string;        // optional — humor surface (Mr. Whiskers, cat)
  reasonForVisit?: string;          // optional — humor surface
  doctorNote?: string;              // optional — admin pain (annotations, complaints)
  miscField?: { label: string; value: string };  // catch-all for absurdity
};

type SorterHoldIt = {
  npcLine: string;                  // "HOLD IT! You spotted that — partial dates count..."
  educationalBeat: string;          // 1-2 sentence rule explanation
};
```

The existing `label` field stays for backward compat / search but the UI reads from `chart` going forward.

### NPC reaction architecture — LOCKED
- Each trigger NPC (Aiyana, Marcus) gets a **reaction bank** in a new file (`client/src/data/sorterReactions.ts` or extend `sorterData.ts`)
- 5-7 specific-item reactions per NPC (keyed by item id)
- 3 accuracy-band fallback lines per NPC (shaky <50%, good 50-79%, strong 80%+)
- Reactions fire in the existing PHISorterOverlay after each drop — needs new prop `onItemDrop` → emits item ID + correctness
- Speech bubble component is new (`NPCReactionBubble.tsx`) — overlays the sort UI at top, fades in/out per reaction
- No NPC portrait sprite yet — that's Phase 24. Phase 22 uses the NPC name + role label like the EncounterRequestModal already does

### HOLD IT reveal — LOCKED
- One per set (3 total across the 3 doc sets)
- Triggered when player correctly classifies the designated tricky item
- Visual treatment: NPC reaction bubble scales up briefly (transform: scale(1.2)), gold border flash, screen pulse — NOT a full-screen modal. Stay in flow.
- SFX: reuse `sfx_sorter_correct` pitch-shifted up, OR reuse `sfx_fanfare` at 0.4 volume. Phase 22 picks; if neither lands, Phase 23 adds a dedicated SFX.
- The educational beat text is short — 1-2 sentences max. Player reads it in 3-4 seconds.

### Patient archetype reuse — LOCKED
- 30 items across 3 sets = 30 distinct patients. No repeats unless intentional callback (e.g., Mrs. Henderson appears in both Reception and Records sets — same patient, different stage)
- Names should avoid real-person collisions (no "Tom Hanks", no real celebrities). Pull from generic-but-varied surname pools
- Demographic mix: vary age, role, presenting concern — not all elderly, not all benign visits

### Encounter duration — UPDATED (60-90s, up from 30-60s)
- 10 items per set with NPC reaction beats = ~6-9s per item average
- Phase 22 SC explicitly allows 60-90s; Phase 16 SC said 30-60s — Phase 22 supersedes for sorter encounters
- Still well under the 3-5 min TD encounter benchmark

### Files to be created (Phase 22)
- `client/src/data/sorterReactions.ts` — NPC reaction bank
- `client/src/components/phi-sorter/NPCReactionBubble.tsx` — speech bubble overlay
- `client/src/components/phi-sorter/HoldItReveal.tsx` — dramatic reveal component (or inline in NPCReactionBubble — planner picks)

### Files to be modified (Phase 22)
- `client/src/data/sorterData.ts` — items expanded with chart + holdIt fields; 6 → 10 per set
- `client/src/components/phi-sorter/PHISorterOverlay.tsx` — render chart fields instead of bare label; mount NPCReactionBubble; emit item-drop events; mount HoldItReveal on tricky-item correct
- `client/src/components/phi-sorter/SorterItem.tsx` — render chart instead of label string
- `.planning/CONTENT_MANIFEST.md` — index new chart content with HIPAA topic tags

### Files NOT to be touched
- ExplorationScene.ts (no trigger changes)
- EventBridge.ts (no new events needed — reactions are React-side)
- UnifiedGamePage.tsx (no routing changes)
- EncounterRequestModal, SorterDebrief, SorterContextCard (Phase 22 is in-encounter only)
- NarrativeContextCard.tsx, EncounterDebrief.tsx (Phase 13 — untouched)

### Claude's discretion
- Specific patient names / occupations / chart wording (creative work, will draft in Phase 22 execution)
- Exact reaction line copy for Aiyana / Marcus (drafts then iterate)
- Visual styling of NPCReactionBubble (match SorterContextCard palette — blue/teal)
- Animation timings for HOLD IT reveal (within "stay in flow" constraint)
- Whether HoldItReveal is its own component or inline in NPCReactionBubble
- Test approach (Playwright vs unit tests for the reaction bank)

</decisions>

<specifics>
## Specific Ideas to Carry Forward

### Two Point Hospital tone calibration
The brief calls out absurd-but-grounded. Calibration examples for Phase 22 content authoring:

✓ **YES — absurd-but-grounded admin chaos:**
- Emergency contact: "Mr. Whiskers (cat) — no phone, lives in same house"
- Doctor's note: "Patient brought their own thermometer 'for accuracy comparison'"
- Reason for visit: "Says her son keeps forwarding her chain emails about her hip"
- Role: "Retired postal inspector"
- Insurance field: "Medicare + supplemental that her son set up without permission, allegedly"

✗ **NO — surreal / cartoony / punching down:**
- "Mrs. Henderson has Lite-Brite Disease" (too surreal — TPH does this; we don't)
- "Patient is a literal dog" (breaks the grounding)
- "92-year-old male with weak grip strength" (punching down — no age/condition mockery)
- "Mrs. Smith complains too much" (judgmental, not absurd)

### Phoenix Wright reveal — example
**Set 1 tricky item:** A patient chart that lists "Patient ID: P-2847-X | Visit date: 03/14/2024"
- Drop in PHI bucket → correct
- HOLD IT! reveal: NPC bubble pops with "HOLD IT! That visit date is the giveaway. A standalone date *with* a patient ID is PHI even though the date alone wouldn't be — Safe Harbor requires both to be stripped together."
- Educational beat: 1 sentence, plain language, no statute citation in the line itself

### NPC voice differentiation
- **Aiyana** (Intake Volunteer, Reception): Warm, professional, mildly anxious about the auditor. Uses full sentences. Says things like "Yeah, the cat doesn't count — that's just contact info, not health info." Calls items by what they are ("the social security one," "the date").
- **Marcus** (Lab Aide, Lab): Laid-back, college-aged, slightly punny. Shorter sentences. Says things like "Yep, that's a name + diagnosis, kill it." Calls items by tone ("the spooky one," "the sketchy one"). Slightly less formal — but never unprofessional.

### Reaction-bank shape sketch
```ts
type NPCReaction = {
  itemId?: string;              // present = specific-item reaction
  accuracyBand?: 'shaky' | 'good' | 'strong';  // present = fallback band line
  text: string;
  variant?: 'neutral' | 'enthusiastic' | 'thoughtful';
};

type NPCReactionBank = {
  npcId: 'aiyana' | 'marcus' | 'records';
  reactions: NPCReaction[];
};
```

</specifics>

<deferred>
## Deferred to Phase 23 or Later

- Particle bursts + camera shake on drop — **Phase 23**
- Animated bucket counters — **Phase 23**
- Completion overlay before debrief — **Phase 23**
- Score increment animations — **Phase 23**
- One-document-at-a-time desk format — **Phase 24**
- Stamps replacing buckets — **Phase 24**
- Visible countdown clock — **Phase 24**
- Persistent NPC portrait sprite above desk — **Phase 24**
- Set 3 (Records) trigger NPC — currently sorter-set-3 has no trigger NPC, only set-1 (Aiyana) and set-2 (Marcus); deferred unless creative question Q3 (below) decides otherwise

</deferred>

---

## 6. Creative Questions for User (Non-Blocking)

The brief and roadmap cover the load-bearing decisions. These three are genuinely creative-direction calls where my taste vs yours might diverge — answer whenever you have bandwidth, not before plan-phase 22 needs to run.

### Q1 — Tone calibration: cartoonish or deadpan?
The Two Point Hospital reference spans two tonal flavors:

- **(A) TPH cartoonish:** absurd surface details ("Mrs. Henderson's emergency contact is her cat *who has filed claims*"), low-key magical realism
- **(B) Daria / Veep deadpan:** absurd but believable, dry humor in straightforward language ("Emergency contact: Mr. Whiskers (cat) — no phone")

My instinct: **B** — deadpan ports better to a compliance-training context and stays accurate. Locking B unless you say otherwise.

### Q2 — Patient name pool: safe-generic or memorable?
Two options:

- **(A) Safe-generic:** procedurally varied names (Henderson, Patel, Nguyen, Okonkwo, Rivera). No cultural specifics. Zero collision risk with real people.
- **(B) Memorable:** named patients with light backstories. They become recurring characters across sets — "Mrs. Henderson" appears in Reception (intake) AND Records (medical history release form). Creates a feeling of one hospital, real people.

My instinct: **B with safety pass** — recurring named patients (Mrs. Henderson, Mr. Okonkwo, Dr. Patel as a treating doctor) are how Animal Crossing / Stardew Valley make worlds feel inhabited. Names get a quick check against a real-person collision list. Pulling toward B.

### Q3 — Set 3 (Records, edge cases): currently has no trigger NPC. Add one?
Current state: Set 1 → Aiyana, Set 2 → Marcus, Set 3 → no trigger NPC (data exists but unreachable in-game). Two paths:

- **(A) Leave Set 3 trigger-less** — content rewrite still happens, but only Sets 1+2 are playable. Records NPC arrives in a future phase if ever.
- **(B) Add Records Clerk Joanna as the Set 3 trigger NPC** — she already exists in roomData (`records` room, `records_clerk` ID). Repurpose her, or add a sister NPC like the Aiyana/Marcus pattern.

My instinct: **B with a new NPC** — add "Dr. Tovar, Compliance Lead" as the Set 3 trigger. Joanna keeps her existing dialogue. The edge-case set (ZIP3, partial dates, age 90+) is the *most* HIPAA-rich content; not exposing it would be a loss. Cost: one more NPC entry in roomData, one more EncounterRequestModal text.

---

*Phase: 22-phi-sorter-content-connection*
*Context gathered: 2026-05-10 — decisions made by Claude per "drive decisions" feedback memory; user can override any locked decision or pick differently on Q1-Q3 above*
