---
phase: 22-phi-sorter-content-connection
plan: "04"
subsystem: ui
tags: [react, phaser, phi-sorter, npc-reactions, hold-it, sfx, hipaa]

# Dependency graph
requires:
  - phase: 22-phi-sorter-content-connection
    provides: "22-01 sorterData.ts chart+holdIt types; 22-02 sorterReactions.ts NPC banks; 22-03 NPCReactionBubble component"
provides:
  - "PHISorterOverlay wired with NPCReactionBubble + reaction-bank lookups + HOLD IT reveal"
  - "SORTER_LOCATION_LABELS updated from room names to NPC names (SORTV2-06)"
affects: [23-phi-sorter-feedback, 24-phi-sorter-format]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Specific-item-first then accuracy-band fallback for NPC reaction lookup"
    - "HOLD IT reveal: sfx_fanfare at 0.4 vol + holdItReveal state prop drives NPCReactionBubble gold treatment"
    - "Opener seeded on mount via useEffect keyed to docSet.id"
    - "SORTER_LOCATION_LABELS data-only swap in UnifiedGamePage.tsx — no routing/state-machine changes"

key-files:
  created: []
  modified:
    - client/src/components/phi-sorter/PHISorterOverlay.tsx
    - client/src/pages/UnifiedGamePage.tsx

key-decisions:
  - "HOLD IT SFX reuses sfx_fanfare at 0.4 volume per CONTEXT.md — no new asset needed"
  - "Screen pulse deferred to Phase 23 per CONTEXT.md scope boundary"
  - "SORTER_LOCATION_LABELS in UnifiedGamePage.tsx is a data-only 3-line change — no routing or state-machine code touched; consistent with CONTEXT.md 'no routing changes' spirit"
  - "holdItReveal dwells 3.5s then clears — bubble returns to accuracy-band fallback after reveal"
  - "Opener line seeded via getNPCFallbackReaction(npcId, 'good') on mount so NPC is present from frame 1"
  - "Reaction branch: holdIt items use npcLine directly; standard items do specific-item lookup then accuracy-band fallback"

patterns-established:
  - "NPC_DISPLAY_BY_SET: documentSetId → {id, name, role} inline map; defensive FALLBACK_NPC_DISPLAY for unknown sets"
  - "handleDrop dependency array includes correctCount + totalDropsSoFar for stale-closure safety on band calc"

requirements-completed: [SORTV2-03, SORTV2-04, SORTV2-05, SORTV2-06]

# Metrics
duration: 15min
completed: 2026-06-09
---

# Phase 22 Plan 04: Wire PHISorterOverlay Summary

**PHISorterOverlay now mounts NPCReactionBubble with per-drop specific-item + accuracy-band reactions, a Phoenix-Wright HOLD IT reveal (sfx_fanfare at 0.4 vol + gold border + scale) on each set's tricky item, NPC name in the progress header, and SORTER_LOCATION_LABELS updated so the SorterDebrief close button reads "BACK TO AIYANA / MARCUS / DR. TOVAR"**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-09T00:00:00Z
- **Completed:** 2026-06-09T00:15:00Z
- **Tasks:** 1 of 2 (Task 2 is human-verify checkpoint — deferred to user, see below)
- **Files modified:** 2

## Accomplishments

- PHISorterOverlay imports `NPCReactionBubble`, `getNPCReactionForItem`, `getNPCFallbackReaction`, `accuracyToBand` from Wave 1+2 work
- NPC bubble seeded on mount with opening 'good'-band line; updates after every drop (specific-item first, accuracy-band fallback)
- HOLD IT reveal: correct classification of a `holdIt` item fires `sfx_fanfare` at 0.4 volume, sets `holdItReveal` state which drives NPCReactionBubble's gold-border + scale treatment, dwells 3.5s then clears
- Progress header now reads "HELPING AIYANA · X/10 sorted · Y correct" (SORTV2-06)
- `SORTER_LOCATION_LABELS` in UnifiedGamePage.tsx updated from room names to NPC display names — close button now reads "BACK TO AIYANA" / "BACK TO MARCUS" / "BACK TO DR. TOVAR" (SORTV2-06)
- All Phase 16 behaviors preserved: wrong-toast ≥3s, close button, keyboard nav (↑↓←→/Enter/Space/Esc), 600ms anticipation beat, score formula `Math.round((correctCount/totalCount) * 12)`
- `npm run build` passes; `tsc --noEmit` clean; 5 REACT_PLAY_SFX emissions confirmed (correct, wrong, HOLD IT 0.4, completion fanfare 0.7, one extra in the completing step)

## Task Commits

1. **Task 1: Wire PHISorterOverlay — chart items + NPC bubble + HOLD IT reveal + debrief NPC name** — `91f76c8` (feat)
2. **Task 2: Human verification checkpoint** — DEFERRED (see note below)

## Human Verification Checkpoint — DEFERRED TO USER

Task 2 is a `checkpoint:human-verify` gate covering:
- HIPAA tone calibration (deadpan humor lands, not sterile)
- NPC voice differentiation (Aiyana vs Marcus vs Dr. Tovar sound different)
- HOLD IT moments feel dramatic in-flow
- Debrief close button reads "BACK TO AIYANA" / "BACK TO MARCUS" / "BACK TO DR. TOVAR"
- Encounter duration 60-90s at normal reading pace per set

This checkpoint requires a live playthrough by the user. Automated tests confirmed structural correctness (bubble renders, SFX fires, HOLD IT branch triggers, NPC name in header, SORTER_LOCATION_LABELS updated). Creative direction verification — whether Marcus actually sounds like Marcus — requires a human eye.

**User verification script:** See the 22-check script in `22-04-PLAN.md` Task 2 `<verify>` block. Covers 3 playthroughs (Set 1 Aiyana / Set 2 Marcus / Set 3 Dr. Tovar) + HIPAA accuracy gate + tone gate.

**Issue routing if problems found:** See `22-04-PLAN.md` Task 2 `<action>` block — tone → sorterData.ts copy, voice → sorterReactions.ts copy, HIPAA → sorterData.ts + framework check, visual → NPCReactionBubble.tsx (NOT screen pulse, that's Phase 23), debrief button → re-check SORTER_LOCATION_LABELS.

## Reaction Resolution Logic

```
handleDrop(itemId, bucket):
  1. isCorrect = item.category === bucket
  2. If isCorrect AND item.holdIt:
       → sfx_fanfare at 0.4 vol
       → setHoldItReveal({ educationalBeat })
       → setCurrentReactionText(item.holdIt.npcLine)
       → setCurrentReactionVariant('enthusiastic')
       → setTimeout 3500ms → setHoldItReveal(null)
  3. Else:
       → specificReaction = getNPCReactionForItem(npcId, itemId, isCorrect)
       → reaction = specificReaction ?? getNPCFallbackReaction(npcId, accuracyToBand(newCorrect, newTotal))
       → setCurrentReactionText(reaction.text)
       → setCurrentReactionVariant(reaction.variant)
```

## HOLD IT SFX Choice

Reuses `sfx_fanfare` at 0.4 volume — no new audio asset needed per CONTEXT.md decision. Rationale: at 0.4 vol the same fanfare reads as "emphasizing something important" rather than "you finished everything" (which fires at 0.7 vol at completion). The volume differential creates a legible signal difference without requiring a new asset or new BootScene preload entry.

## Screen Pulse Deferral Note

Phase 22 ships: scale animation (scale-125 → scale-110) + gold border flash + sfx_fanfare at 0.4 vol for HOLD IT reveals. Screen pulse / camera shake is intentionally NOT present — deferred to Phase 23 per CONTEXT.md's "deferred" section (camera-shake-class screen-level effects). Reviewers should NOT flag its absence as a regression.

## SORTER_LOCATION_LABELS — Data-Only Nature

The change in `client/src/pages/UnifiedGamePage.tsx` is exactly 3 string values inside a `Record<string, string>` constant. No routing logic, no state-machine code, no encounter-flow control was modified. The existing `locationLabel` prop pipeline in `SorterDebrief` already consumes these values — no component changes needed. The CONTEXT.md "Files NOT to be touched" boundary for this file exists to prevent routing/encounter-flow churn; a label-data update is consistent with that spirit.

## Phase 23 Hooks

No Phase 23 hooks pre-laid. PHISorterOverlay.tsx stays restrained — no particles, no camera shake, no animated score counters, no screen pulse. Phase 22 scope boundary respected.

## Files Created/Modified

- `/client/src/components/phi-sorter/PHISorterOverlay.tsx` — Added NPCReactionBubble mount, reaction state hooks, HOLD IT branch in handleDrop, opener useEffect, NPC name in progress header; 351 → 395 lines
- `/client/src/pages/UnifiedGamePage.tsx` — SORTER_LOCATION_LABELS values updated from room names to NPC names (3 strings changed, comment added); no other changes

## Deviations from Plan

None — plan executed exactly as specified. All Steps A–I from Task 1 implemented. The `mt-20` top-margin on the progress header (not specified in plan) was added to prevent the NPCReactionBubble from overlapping the header text — minor layout adjustment, not a behavioral deviation.

## Issues Encountered

None. TypeScript was clean on the first pass. The reaction-bank function signatures matched the interfaces spec'd in the plan exactly.

## Next Phase Readiness

Phase 22 implementation complete (pending user's live verification checkpoint). Phase 23 (feedback polish) can begin — it owns: screen pulse on HOLD IT, particle effects, animated score counters, and any other visual escalation deferred from Phase 22.

---
*Phase: 22-phi-sorter-content-connection*
*Completed: 2026-06-09*
