---
phase: 24-phi-sorter-format-shift
plan: 03
subsystem: phi-sorter
tags: [papers-please, desk-format, react, hipaa, sorter, animation, audio, keyboard]

# Dependency graph
requires:
  - phase: 24-phi-sorter-format-shift plan 01
    provides: "sfx_sorter_stamp/paper preloaded, shiftSeconds on SorterDocumentSet, 6 CSS keyframes (doc-slide-in/off, ink-stamp-in, stamp-press, clock-pulse)"
  - phase: 24-phi-sorter-format-shift plan 02
    provides: "DeskSurface, ShiftClock, OutgoingTray, StampPad, DeskDocument, NPCReactionBubble with spriteUrl portrait extension"
  - phase: 23-phi-sorter-feedback-moments
    provides: "Three-effect completion pipeline, shake surface, score pulse, SorterCompletionOverlay"
  - phase: 22-phi-sorter-content-connection
    provides: "NPC reaction banks, HOLD IT items, sorterData document sets, NPCReactionBubble"
provides:
  - "PHISorterOverlay rewritten to Papers Please desk format — one doc at a time, stamp commits, outgoing trays, shift clock, persistent NPC portrait"
  - "BucketZone.tsx and SorterItem.tsx deleted — no orphaned imports"
  - "All SORTV2-11..15 structurally satisfied in code"
affects: [UnifiedGamePage encounters, SorterDebrief, REQUIREMENTS.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "handleStamp() cascades into document lifecycle chain: stamped (350ms ink dwell) → exiting (300ms slide) → entering next doc (300ms slide-in) — all via ref-tracked setTimeout array cleared on unmount"
    - "Shift-over trigger split across two effects: setInterval decrements secondsLeft, narrow [secondsLeft] effect fires shiftOver=true and NPC line at 0; Completion Effect 1 condition ORs currentDocIndex>=totalCount with shiftOver+active/entering guard"
    - "trayCounts replaces bucketCounts — same {phi,not_phi} shape, phi→REDACT tray, not_phi→KEEP tray; rename enforces desk semantics without changing logic"
    - "focusedStamp stays sticky between documents (Papers Please rhythm: → Enter Enter Enter rapid-stamps without re-focusing)"
    - "getSponsorSpritePath resolves spriteKey per NPC_DISPLAY_BY_SET to spriteUrl passed into NPCReactionBubble — portrait+name always visible, bubble hides when empty text"

key-files:
  created: []
  modified:
    - "client/src/components/phi-sorter/PHISorterOverlay.tsx"
  deleted:
    - "client/src/components/phi-sorter/BucketZone.tsx"
    - "client/src/components/phi-sorter/SorterItem.tsx"

key-decisions:
  - "Timer-expiry scoring: unstamped items score 0 but totalCount = docSet.items.length (FULL set) — scoreContribution = Math.round((correctCount/totalCount)*12) unchanged; SorterDebrief shows 'n/10 correct' accurately. Sub-60% shows KEEP PRACTICING (teal, not red — encouraging per Commandment 5)"
  - "focusedStamp intentionally NOT cleared between documents — Papers Please rapid-keyboard rhythm (→ Enter Enter Enter) requires sticky stamp focus so players don't need to re-select on every doc"
  - "cascadeTimersRef tracks all document lifecycle setTimeout IDs and clears them on unmount — abort mid-animation leaks nothing (rule covers: pressTimer, t1 stamp-to-exit, t2 exit-to-enter, t3 enter-to-active)"
  - "Completion Effect 1 condition uses docAnimState guard on shiftOver branch: only fires when 'active' or 'entering' — lets a doc already in 'stamped'/'exiting' at 0:00 complete its exit and count toward score"
  - "HOLD IT SFX (sfx_fanfare at 0.4) and wrong-answer 3.5s toast both remain in handleStamp (not handleDrop) — same timing contracts, new verb"

patterns-established:
  - "Two-effect shift-clock pattern: setInterval effect keyed [phase] for decrement; separate narrow [secondsLeft] effect for side effects at 0 — prevents stale closure hazards"
  - "Dead component deletion protocol: grep -rn for all import patterns across client/src + tests, then git rm only if zero hits"

requirements-completed: [SORTV2-11, SORTV2-12, SORTV2-13, SORTV2-14, SORTV2-15]

# Metrics
duration: ~7min
completed: 2026-06-10
---

# Phase 24 Plan 03: PHI Sorter Overlay Rewrite + Dead Code Cleanup Summary

**PHISorterOverlay rewritten to Papers Please desk format — one-doc state machine with stamp commits, shift clock, outgoing trays, persistent NPC portrait — while preserving all Phase 22/23 feedback invariants verbatim; BucketZone and SorterItem deleted with zero dangling imports**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-10T05:57:13Z
- **Completed:** 2026-06-10T06:03:42Z
- **Tasks:** 2
- **Files modified:** 1 rewritten, 2 deleted

## Accomplishments

- Rewrote PHISorterOverlay from 559 lines (bucket/drag/pile) to 391 lines (desk format): one-doc-at-a-time state machine, handleStamp() with cascade lifecycle chain, shift clock engine split across two effects, NPC portrait wired via getSponsorSpritePath, trayCounts replaces bucketCounts
- All Phase 22/23 invariants preserved verbatim: HOLD IT SFX at 0.4, completion fanfare at 0.7, correct/wrong SFX, 3.5s wrong-answer toast, holdIt drives NPCReactionBubble, camera shake, score pulse re-key, SorterCompletionOverlay, three-effect separation discipline (DO NOT merge ×3)
- BucketZone.tsx and SorterItem.tsx deleted — grep confirmed zero dangling imports in client/src or tests; HIPAA content type SorterItem in sorterData.ts is unaffected
- All 16 regression gate rows pass; build and typecheck clean; contract files (UnifiedGamePage, SorterDebrief, SorterContextCard) unchanged

## Task Commits

1. **Task 1: Rewrite PHISorterOverlay to desk format** — `06b80a8` (feat)
2. **Task 2: Delete dead components + regression gate** — `7597e7c` (feat)

## Files Created/Modified

- `client/src/components/phi-sorter/PHISorterOverlay.tsx` — Complete rewrite: one-doc desk format with stamp state machine, shift clock, outgoing trays, persistent NPC portrait, all Phase 22/23 logic preserved
- `client/src/components/phi-sorter/BucketZone.tsx` — DELETED (no remaining consumers)
- `client/src/components/phi-sorter/SorterItem.tsx` — DELETED (no remaining consumers; SorterItem type in sorterData.ts unaffected)

## Regression Gate Results

All 16 rows recorded passing:

| Check | Result |
|---|---|
| Sacred score formula (`Math.round((correctCount / totalCount) * 12)`) | 1 code occurrence + 1 doc comment = PASS |
| HOLD IT SFX (`sfx_fanfare', volume: 0.4`) | PASS |
| Completion fanfare (`sfx_fanfare', volume: 0.7`) | PASS |
| Correct SFX (`sfx_sorter_correct`) | PASS |
| Wrong SFX (`sfx_sorter_wrong`) | PASS |
| New stamp SFX (`sfx_sorter_stamp`) | PASS |
| New paper SFX (`sfx_sorter_paper`) | PASS |
| Wrong-answer toast 3.5s (`setWrongFeedback(null), 3500`) | PASS |
| HOLD IT drives bubble (`holdIt={holdItReveal`) | PASS |
| Esc abort (`e.key === 'Escape' && onAbort`) | PASS |
| Takeaways pass-through (`takeaways: docSet.takeaways`) | PASS |
| Camera shake (`sorter-shake` class) | PASS |
| Score pulse re-key (`key={scorePulseNonce}`) | PASS |
| Celebration overlay (`SorterCompletionOverlay` in render) | PASS |
| Three effects intact (`DO NOT merge` count = 3) | PASS (≥2) |
| No drag remnants (`draggable|onDragStart|onDrop|dataTransfer`) | PASS (zero hits) |
| Contract untouched (UnifiedGamePage, SorterDebrief, SorterContextCard) | PASS (git diff empty) |
| Build (`npm run build`) | PASS |
| Typecheck (`npx tsc --noEmit`) | PASS |

## Decisions Made

- **Timer-expiry scoring:** Unstamped items score 0 but totalCount = docSet.items.length (FULL set). scoreContribution formula `Math.round((correctCount/totalCount)*12)` unchanged. SorterDebrief shows accurate "n/10 correct" — honest and proportional. Sub-60% → KEEP PRACTICING (teal, not red — Commandment 5).
- **focusedStamp stays sticky between documents:** Papers Please rhythm requires → Enter Enter Enter to rapid-stamp without re-focusing. NOT clearing focusedStamp between docs is intentional.
- **cascadeTimersRef tracks all lifecycle timeouts:** pressTimer + t1 (stamp→exit) + t2 (exit→enter) + t3 (enter→active) all pushed into the ref array and cleared on unmount — abort mid-animation leaks nothing.
- **Completion Effect 1 docAnimState guard on shiftOver branch:** Fires only when 'active' or 'entering', not 'stamped'/'exiting'. A doc being stamped when the clock hits 0:00 gets to finish its exit and score — it was committed in time.

## Deviations from Plan

None — plan executed exactly as written.

The regression gate noted that `grep -c "Math.round..."` returned 2 instead of the expected 1 — the second hit is the comment `"scoreContribution formula Math.round((correctCount / totalCount) * 12) is sacred"` inside Effect 3's JSDoc. One code occurrence, one comment — both correct.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Live Playthrough Script (Deferred to User)

Per the Phase 16/17/22/23 pattern, live feel calibration is deferred to user playthrough:

1. **Set 1 / Aiyana** — Confirm: one-doc slides in with paper SFX; stamp click plays thunk + ink mark + ink-splatter + doc slides off into tray; tray count bounces; clock at 1:30; Aiyana's portrait + name persistent above desk from frame one; HOLD IT on `s1-dob` fires from portrait location (gold border flash, educationalBeat line, SFX)
2. **Set 2 / Marcus** — Keyboard-only full run (← → Enter only, never click); confirm rapid → Enter Enter Enter stamps quickly without needing to re-press →; confirm GOOD or PERFECT band at end
3. **Set 3 / Dr. Tovar** — Idle until 0:00; confirm "Time. Whatever's left goes to the auditor's queue — that's what it's there for." NPC line; completion overlay → debrief showing n/10, no fail screen; then abort/re-enter to confirm trays reset to ×0, clock resets to 1:00, score resets to 0

## Next Phase Readiness

- Phase 24 is structurally complete: all 5 SORTV2-11..15 requirements satisfied in code, build clean, typecheck clean
- Live feel calibration deferred to user playthrough (above script)
- BucketZone/SorterItem safely deleted — no cleanup debt
- UnifiedGamePage and SorterDebrief contracts unchanged — no downstream integration work needed

---
*Phase: 24-phi-sorter-format-shift*
*Completed: 2026-06-10*
