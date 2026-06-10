---
phase: 22-phi-sorter-content-connection
verified: 2026-06-09T00:00:00Z
status: human_needed
score: 6/7 must-haves verified (1 deferred to human)
human_verification:
  - test: "Live playthrough of all three sets (Set 1 Aiyana / Set 2 Marcus / Set 3 Dr. Tovar)"
    expected: "22 checks per 22-04-PLAN.md Task 2 verify block: deadpan humor lands, NPC voices are distinct, HOLD IT moments feel dramatic in-flow, BACK TO AIYANA/MARCUS/DR. TOVAR on debrief, each set completes in 60-90s"
    why_human: "Tone calibration, voice differentiation, and in-flow feel are creative-direction judgments. Automated checks confirm the bubble renders and SFX fires but cannot confirm Marcus sounds like Marcus or the humor is deadpan rather than sterile."
---

# Phase 22: PHI Sorter Content + Connection Verification Report

**Phase Goal:** PHI Sorter Redesign — Content + Connection. Items become fake patient charts with humor (HIPAA-accurate per 18 Safe Harbor identifiers), NPC reaction bubbles connect the sorter to the requesting NPC (Aiyana/Marcus/Dr. Tovar), HOLD IT reveal moments on tricky items, NPC name in progress header and debrief.
**Verified:** 2026-06-09
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Each of the 3 document sets has exactly 10 SorterItem entries (30 total) | VERIFIED | `node -e` count: phi-sorter-set-1: 10, phi-sorter-set-2: 10, phi-sorter-set-3: 10 |
| 2 | Every item has a populated `chart` object with patientName; HIPAA classifications preserved | VERIFIED | `grep -c "patientName:"` = 31 (includes type definition + 30 items); all 19 Phase-16 item IDs present with original `category` |
| 3 | Exactly one HOLD IT item per set (3 total) | VERIFIED | `grep -c "holdIt:"` = 3; s1-dob, s2-diagnosis-with-mrn, s3-zip3 |
| 4 | NPC reaction banks exist with ≥4 specific-item reactions + 3 band fallbacks per NPC | VERIFIED | sorterReactions.ts 270 lines; Aiyana=6, Marcus=6, Tovar=5 specific reactions each; 9 accuracyBand entries total (3 per NPC); all itemIds verified against sorterData.ts |
| 5 | Dr. Tovar accessible in records_room with encounterTrigger for phi-sorter-set-3 | VERIFIED | roomData.json: dr_tovar at (14,10), sceneId=`_encounter_phi_sort_records`, documentSetId=`phi-sorter-set-3`; NOT in requiredNpcs |
| 6 | PHISorterOverlay wired: NPCReactionBubble mounted, HOLD IT branch fires sfx_fanfare@0.4 + gold treatment, SORTER_LOCATION_LABELS updated, NPC name in progress header | VERIFIED | PHISorterOverlay.tsx 443 lines; `<NPCReactionBubble>` mounted; `item.holdIt` branch fires; `sfx_fanfare volume: 0.4`; SORTER_LOCATION_LABELS maps to AIYANA/MARCUS/DR. TOVAR; "HELPING {npcDisplay.name.toUpperCase()}" in progress header |
| 7 | Deadpan humor lands, NPC voices are distinct, HOLD IT moments dramatic in-flow (tone gate) | HUMAN NEEDED | Cannot verify tone calibration, voice differentiation, or in-flow feel programmatically — requires live playthrough per 22-04-PLAN.md Task 2 verify script |

**Score:** 6/7 truths verified (1 deferred to human)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `client/src/data/sorterData.ts` | Extended SorterItem schema + 30 chart items + getSorterDocumentSet | VERIFIED | 652 lines; SorterChart + SorterHoldIt types exported; 30 items (10/10/10); 45 humor-bearing fields; getSorterDocumentSet + SORTER_DOCUMENT_SETS preserved |
| `.planning/REQUIREMENTS.md` | SORTV2-01..06 definitions + traceability table rows | VERIFIED | All 6 IDs appear both as `- [x] **SORTV2-0N**:` definitions and in traceability table as "Complete" |
| `.planning/CONTENT_MANIFEST.md` | Updated PHI Sorter table (10/10/10 counts), humor note, HOLD IT note, revision row | VERIFIED | Lines 288/296/298/309: "10 / 10 / 10", "Humor coverage (Phase 22)", "HOLD IT reveals (Phase 22)", revision history row present |
| `client/src/data/sorterReactions.ts` | NPCReaction + NPCReactionBank + NPC_REACTION_BANKS + getNPCReactionForItem + getNPCFallbackReaction | VERIFIED | 270 lines; all exports present; 3 NPC banks; voice differentiation confirmed (Tovar says "Safe Harbor" twice, cites "geographic identifier #2"; Marcus uses tonal nicknames; Aiyana references the auditor) |
| `client/src/data/roomData.json` | dr_tovar NPC in records_room with encounterTrigger | VERIFIED | dr_tovar confirmed at (14,10), documentSetId=phi-sorter-set-3, NOT in requiredNpcs |
| `client/src/components/phi-sorter/NPCReactionBubble.tsx` | Speech bubble overlay with HOLD IT variant | VERIFIED | 137 lines; gold border, scale-125→scale-110, ring glow, educationalBeat second line, data-testid hooks |
| `client/src/components/phi-sorter/SorterItem.tsx` | Patient chart card (replaces bare label string) | VERIFIED | 86 lines; renders chart.patientName, role, reasonForVisit, emergencyContact, doctorNote, miscField; bare `item.label` NOT rendered in JSX; drag handlers and data-testid preserved |
| `client/src/components/phi-sorter/PHISorterOverlay.tsx` | Wired sorter overlay with NPC bubble + HOLD IT + SFX | VERIFIED | 443 lines; imports NPCReactionBubble + reaction-bank functions; 5 REACT_PLAY_SFX emissions; wrong-toast ≥3s; keyboard nav (ArrowUp/Down/Escape) preserved; 600ms anticipation beat preserved; score formula `Math.round((correctCount/totalCount) * 12)` confirmed |
| `client/src/pages/UnifiedGamePage.tsx` | SORTER_LOCATION_LABELS updated to NPC names | VERIFIED | Lines 59-63: 'phi-sort-reception':'AIYANA', 'phi-sort-lab':'MARCUS', 'phi-sort-records':'DR. TOVAR'; comment documents data-only nature of change |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| sorterData.ts | 45 CFR §164.514(b)(2) | identifierType field values preserved per item | VERIFIED | All 19 Phase-16 item IDs present with original category; no category field changed |
| sorterData.ts | SorterHoldIt | holdIt field on exactly one item per set | VERIFIED | 3 holdIt occurrences; s1-dob, s2-diagnosis-with-mrn, s3-zip3 |
| sorterReactions.ts | sorterData.ts | itemId values match actual item.id values | VERIFIED | 17 itemIds in reaction banks; node verification: PASS, zero phantom IDs |
| roomData.json | sorterData.ts | Dr. Tovar encounterTrigger.documentSetId === 'phi-sorter-set-3' | VERIFIED | Confirmed via node JSON parse check |
| SorterItem.tsx | sorterData.ts | Imports SorterItem type; renders item.chart | VERIFIED | `item.chart.patientName` + all chart fields rendered; `item.label` not rendered in JSX |
| NPCReactionBubble.tsx | sorterReactions.ts | Consumes NPCReaction shape (text + variant + holdIt.educationalBeat) | VERIFIED | Type-aligned; tsc --noEmit passes (exit 0) |
| PHISorterOverlay.tsx | sorterReactions.ts | getNPCReactionForItem + getNPCFallbackReaction + accuracyToBand in handleDrop | VERIFIED | Lines 7-9 imports; lines 204-207 specific-item-first then fallback; line 151 opener on mount |
| PHISorterOverlay.tsx | NPCReactionBubble.tsx | JSX mount `<NPCReactionBubble>` in sorting phase | VERIFIED | Lines 344-349 |
| PHISorterOverlay.handleDrop | sfx_fanfare at 0.4 vol | REACT_PLAY_SFX emission on correct holdIt item | VERIFIED | Line 189: `{ key: 'sfx_fanfare', volume: 0.4 }` |
| UnifiedGamePage.tsx SORTER_LOCATION_LABELS | SorterDebrief locationLabel prop | NPC display names flow to 'BACK TO {name}' button | VERIFIED | locationLabel={SORTER_LOCATION_LABELS[encounterResult.encounterId]} at line 1572 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SORTV2-01 | 22-01 | 10 items per set as patient charts; HIPAA accuracy preserved | SATISFIED | 10/10/10 item counts confirmed; 19 Phase-16 IDs preserved with original category |
| SORTV2-02 | 22-01 | ≥30% of items have humor beat in non-classifying chart field; CONTENT_MANIFEST.md updated | SATISFIED | 45 humor-bearing field occurrences across 30 items (150% coverage); manifest updated |
| SORTV2-03 | 22-02, 22-03, 22-04 | Trigger NPC shows speech bubble with ≥4 specific-item reactions + 3 band fallbacks; updates per drop | SATISFIED | sorterReactions.ts banks verified; PHISorterOverlay wired with specific-item-first then fallback logic; opener seeded on mount |
| SORTV2-04 | 22-01, 22-03, 22-04 | One HOLD IT item per set; distinct visual treatment; educational beat; stays in-flow | SATISFIED | 3 holdIt entries in sorterData; NPCReactionBubble has gold border + scale + educationalBeat; sfx_fanfare@0.4 fires; 3.5s dwell then clears |
| SORTV2-05 | 22-04 | Phase 16 behaviors preserved: drag/keyboard, audio-visual feedback per drop, debrief, score formula, replayability | SATISFIED | Keyboard nav (ArrowUp/Down/Escape), wrong-toast (3500ms), 600ms anticipation beat, score formula, close button all confirmed present |
| SORTV2-06 | 22-04 | 60-90s duration; NPC name in progress header and debrief close button | SATISFIED (automated) / HUMAN NEEDED (duration) | SORTER_LOCATION_LABELS maps to NPC names; "HELPING {NPC}" in header confirmed; actual 60-90s duration requires live timing |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| NPCReactionBubble.tsx line 66 | `return null` when text empty and no holdIt | INFO | Intentional — correct behavior, bubble hides when nothing to say |

No TODO/FIXME/PLACEHOLDER comments found in any Phase 22 files. No empty implementations. No corporate-tone violations detected in the code structure.

---

### Human Verification Required

#### 1. Full 22-Check Live Playthrough (per 22-04-PLAN.md Task 2)

**Test:** Run `npm run dev`, open Full Game mode, navigate to Reception (Set 1), Lab (Set 2), and Medical Records (Set 3). For each set, run through all 10 items.

**Expected:**
- Pass 1 (Aiyana, Set 1): Chart cards feel like real intake forms with deadpan-quirky detail. Aiyana's specific-item reactions fire on at least 4-5 items. The s1-dob HOLD IT: bubble scales to ~1.2x, gold border, educationalBeat second line, subtle fanfare SFX. Progress header: "HELPING AIYANA · 10/10 sorted · X correct". Debrief close button: "BACK TO AIYANA".
- Pass 2 (Marcus, Set 2): Marcus voice is distinct from Aiyana — shorter sentences, casual interjections, at least one tonal nickname for an item. s2-diagnosis-with-mrn HOLD IT fires correctly. Debrief: "BACK TO MARCUS".
- Pass 3 (Dr. Tovar, Set 3): Dr. Tovar is visible in Medical Records room (east side, diagonal from Records Clerk). Talk triggers encounter. Tovar uses "Safe Harbor" at least once and references identifier-by-number. s3-zip3 HOLD IT fires (a not_phi item as HOLD IT — tests correct reasoning). Debrief: "BACK TO DR. TOVAR".
- Tone gate: Humor reads as deadpan admin-system absurdity, not punching down at patient demographics. 3 driest cards (room temp, hospital address, etc.) feel deliberate-and-restrained, not forgotten.
- HIPAA accuracy gate: 3 wrong-bucket drops produce correct rule-citation feedback.
- Duration gate: Set 2 (Lab) completes in 60-90s at normal reading pace.

**Why human:** Tone calibration, voice differentiation (does Marcus actually sound like Marcus vs. a slightly different Aiyana?), dramatic impact of HOLD IT moments, and overall "feels in-flow not modal-heavy" are creative-direction judgments that grep cannot make. Screen pulse is intentionally absent (deferred to Phase 23 per CONTEXT.md) — do NOT flag its absence.

**Issue routing if problems found:**
- Tone problem (humor punches down) → fix chart field copy in `client/src/data/sorterData.ts`
- Voice problem (Tovar/Marcus sound alike) → fix specific lines in `client/src/data/sorterReactions.ts`
- HIPAA accuracy error → fix sorterData.ts, cross-check HIPAA_TRAINING_FRAMEWORK.md
- Visual problem (HOLD IT not visually distinct) → fix NPCReactionBubble.tsx (NOT screen pulse — Phase 23)
- Wrong debrief button text → re-check SORTER_LOCATION_LABELS in UnifiedGamePage.tsx
- Duration problem → tune NPC bubble dwell timers and/or trim chart fields

---

### Gaps Summary

No structural gaps found. All 6 requirement IDs (SORTV2-01 through SORTV2-06) are fully implemented in code. The one outstanding item is the creative-direction live-playthrough verification (22-04 Plan Task 2 checkpoint) which was explicitly designed as a human gate — not a regression or gap.

Automated checks confirm:
- TypeScript compiles clean (`tsc --noEmit` exit 0)
- 30 items (10/10/10) with correct types and HIPAA-preserved classifications
- 3 HOLD IT items (one per set) with npcLine + educationalBeat
- Dr. Tovar wired in roomData.json; not in requiredNpcs
- All reaction bank itemIds resolve against sorterData.ts
- NPCReactionBubble gold border + scale-125 + educationalBeat present
- PHISorterOverlay mounts bubble, fires HOLD IT branch, sfx_fanfare@0.4, preserves all Phase 16 behaviors
- SORTER_LOCATION_LABELS updated to NPC names end-to-end through locationLabel prop to SorterDebrief

---

_Verified: 2026-06-09_
_Verifier: Claude (gsd-verifier)_
