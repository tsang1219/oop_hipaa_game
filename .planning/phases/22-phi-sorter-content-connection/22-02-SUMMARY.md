---
phase: 22-phi-sorter-content-connection
plan: 02
subsystem: ui
tags: [phaser, react, hipaa, phi-sorter, npc, data]

# Dependency graph
requires:
  - phase: 22-phi-sorter-content-connection/22-01
    provides: sorterData.ts with Set 3 item IDs (s3-*) that reaction banks reference
provides:
  - Dr. Tovar NPC in records_room with encounterTrigger for phi-sorter-set-3
  - sorterReactions.ts NPC reaction bank for Aiyana, Marcus, and Dr. Tovar
  - getNPCReactionForItem and getNPCFallbackReaction lookup functions
affects:
  - 22-phi-sorter-content-connection/22-03 (NPCReactionBubble.tsx will import from sorterReactions.ts)
  - 22-phi-sorter-content-connection/22-04 (PHISorterOverlay will call getNPCReactionForItem/getNPCFallbackReaction)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NPC reaction banks keyed by npcId — voice differentiation lives in copy, not structure"
    - "accuracyBand fallback pattern: 3 tiers (shaky/good/strong) per bank, always returns a reaction"
    - "Encounter NPC sceneId sentinel _encounter_phi_sort_* triggers encounterTrigger payload without scene-side code changes"

key-files:
  created:
    - client/src/data/sorterReactions.ts
  modified:
    - client/src/data/roomData.json

key-decisions:
  - "Dr. Tovar placed at (14, 10) in records_room — east side, diagonal from records_clerk at (10, 10)"
  - "Dr. Tovar NOT added to requiredNpcs — encounter is optional, room completion unaffected"
  - "Aiyana bank keyed as 'aiyana' (not 'receptionist_riley') — Plan 04 maps trigger NPC via switch"
  - "All three banks use 6/6/5 specific-item reactions respectively — all exceed the ≥4 minimum"
  - "Voice differentiation enforced in copy: Tovar uses 'Safe Harbor' + identifier number refs; Marcus uses tonal nicknames ('the spooky one', 'the network one'); Aiyana references the auditor"

patterns-established:
  - "NPC reaction lookup: try getNPCReactionForItem first, fall back to getNPCFallbackReaction"
  - "accuracyToBand utility: ratio < 0.5 → shaky, < 0.8 → good, ≥ 0.8 → strong"

requirements-completed: [SORTV2-03]

# Metrics
duration: 12min
completed: 2026-06-10
---

# Phase 22 Plan 02: Dr. Tovar NPC + NPC Reaction Banks Summary

**Set 3 made reachable via Dr. Tovar NPC in Medical Records, backed by a 270-line reaction bank with voice-differentiated copy for Aiyana, Marcus, and Tovar**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-10T03:29:00Z
- **Completed:** 2026-06-10T03:41:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Dr. Tovar (Compliance Lead) added to records_room at position (14, 10) with encounterTrigger pointing to phi-sorter-set-3 — the Safe Harbor edge cases set that was data-complete but trigger-less since Phase 16
- sorterReactions.ts created with three NPC banks (Aiyana, Marcus, Dr. Tovar), each with ≥4 specific-item reactions and exactly 3 accuracy-band fallbacks
- All item IDs in reaction banks verified against sorterData.ts — no phantom references
- Voice differentiation gate passed: Tovar uses "Safe Harbor" twice and cites "geographic identifier #2"; Marcus uses tonal nicknames ("the network one", "the spooky one"); Aiyana references the auditor and uses full natural sentences

## Task Commits

1. **Task 1: Add Dr. Tovar NPC to records_room** - `4fcc3a9` (feat)
2. **Task 2: Create sorterReactions.ts** - `c6c0052` (feat)

## Files Created/Modified
- `client/src/data/roomData.json` - Dr. Tovar NPC appended to records_room.npcs array (last element, after compliance_officer)
- `client/src/data/sorterReactions.ts` - New file; NPCReaction type, NPCReactionBank type, NPC_REACTION_BANKS map, getNPCReactionForItem, getNPCFallbackReaction, accuracyToBand exports

## Dr. Tovar Placement Details
- **Position:** (x: 14, y: 10) — east side of room, diagonal from records_clerk at (10, 10)
- **Sprite:** "officer" (same as Aiyana — professional pose suits a compliance lead)
- **sceneId:** `_encounter_phi_sort_records` — ExplorationScene's existing `_encounter_phi_sort_*` prefix interception handles this without scene-side code changes
- **requiredNpcs unchanged:** remains `["records_clerk"]` — Dr. Tovar is optional for room completion

## Per-NPC Reaction Counts

| NPC | Specific-Item Reactions | Accuracy-Band Fallbacks |
|-----|------------------------|------------------------|
| Aiyana | 6 (s1-patient-name, s1-ssn, s1-room-temp, s1-hospital-address, s1-home-address, s1-dob) | 3 (shaky/good/strong) |
| Marcus | 6 (s2-device-serial, s2-ip-address, s2-diagnosis-with-mrn, s2-diagnosis-only, s2-lab-test-type, s2-biometric) | 3 (shaky/good/strong) |
| Dr. Tovar | 5 (s3-zip5, s3-zip3, s3-year-only, s3-age-90-plus, s3-admission-month-year) | 3 (shaky/good/strong) |

## Voice Differentiation Examples

- **Aiyana (warm/professional):** "Good. The social security one's always PHI — never need it on anything that leaves the desk." *(references context, full sentence, implies stakes)*
- **Marcus (laid-back/casual):** "Oh yeah — the spooky one. Fingerprint in a health record is always PHI, no debate." *(tonal nickname, short punchy close)*
- **Dr. Tovar (authoritative/compliance-lead):** "Correct. Full ZIP is geographic identifier #2 — Safe Harbor won't accept it." *(cites identifier number, names Safe Harbor explicitly)*

## Item ID Substitutions
None required. All itemId values in the reaction bank used Phase-16-preserved IDs from sorterData.ts (`s1-*`, `s2-*`, `s3-*`) which match exactly.

## Decisions Made
- Dr. Tovar NOT added to requiredNpcs — encounter is deliberate opt-in, not a gate on room completion
- Aiyana bank keyed as `'aiyana'` (not `'receptionist_riley'`) — consistent with trigger NPC id in roomData.json; Plan 04 will handle the npcId→bankId mapping
- Aiyana received 6 item reactions (plan minimum was 4) to cover all 6 Set 1 items for richer feedback

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- Plan 03 (NPCReactionBubble.tsx) can import `NPCReaction`, `NPCReactionBank`, `NPC_REACTION_BANKS` directly from `sorterReactions.ts`
- Plan 04 (PHISorterOverlay wiring) can call `getNPCReactionForItem` and `getNPCFallbackReaction` with the exported utility signatures
- Dr. Tovar is live in roomData.json — walking up to him in Medical Records will fire the phi-sort-records encounterTrigger once Plan 04 wires the overlay launch

---
*Phase: 22-phi-sorter-content-connection*
*Completed: 2026-06-10*
