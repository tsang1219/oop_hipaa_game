---
phase: 22-phi-sorter-content-connection
plan: "03"
subsystem: ui
tags: [react, typescript, phi-sorter, components, tailwind]

# Dependency graph
requires:
  - phase: 22-phi-sorter-content-connection
    plan: "01"
    provides: SorterChart + SorterHoldIt types on SorterItem data shape
  - phase: 22-phi-sorter-content-connection
    plan: "02"
    provides: NPCReaction + ReactionVariant types from sorterReactions.ts
provides:
  - SorterItem.tsx upgraded to render multi-line patient chart card
  - NPCReactionBubble.tsx new speech-bubble overlay with HOLD IT variant
affects: [22-04-phi-sorter-content-connection, phi-sorter integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ChartLine sub-component pattern for labeled field rows (teal label, white value)
    - Opacity-based cross-fade via useState/useEffect for text changes without CSS animation library
    - HOLD IT variant as prop-driven scale + border-color swap (no sub-component split)

key-files:
  created:
    - client/src/components/phi-sorter/NPCReactionBubble.tsx
  modified:
    - client/src/components/phi-sorter/SorterItem.tsx

key-decisions:
  - "HOLD IT implemented inline (not as a sub-component) — the variant is a prop-driven class/style swap on the same bubble element; separating it would add indirection with no benefit at this size"
  - "ChartLine extracted as a private function component inside SorterItem.tsx — keeps the render tree readable without creating a separate file for a single-use element"
  - "Cross-fade uses 80ms opacity dip (setOpacity(0) → setTimeout → swap text → setOpacity(1)) rather than CSS transition on key change — avoids React re-mount flicker and keeps timing predictable"
  - "Screen pulse deferred to Phase 23 per CONTEXT.md — NPCReactionBubble ships scale + gold border only; no screen-level effect hooks added"
  - "No SFX in NPCReactionBubble — PHISorterOverlay (Plan 04) emits audio when setting the holdIt prop, keeping the bubble a pure render component"
  - "No NPC portrait sprite — Phase 24 owns that; Phase 22 uses name + role text only"

patterns-established:
  - "ChartLine pattern: <span class=teal>Label:</span> <span class=white>value</span> at 8px Press Start 2P"
  - "Bubble positioning: absolute top-4 left-1/2 -translate-x-1/2 — parent sets relative container"
  - "data-testid hooks on every meaningful DOM node (header, text, holdIt beat) for Plan 04 checkpoint selectors"

requirements-completed: [SORTV2-03, SORTV2-04]

# Metrics
duration: 8min
completed: 2026-06-10
---

# Phase 22 Plan 03: PHI Sorter UI Components Summary

**SorterItem upgraded to multi-line patient chart cards; NPCReactionBubble created with gold-border HOLD IT scale variant and per-variant teal/green/purple border tints**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-10T03:42:00Z
- **Completed:** 2026-06-10T03:50:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Rewrote SorterItem from a bare `item.label` span into a chart card: gold patientName+age header, then conditional ChartLine rows for role / reason / emergencyContact / doctorNote / miscField at 8px Press Start 2P teal-label + white-value format
- Created NPCReactionBubble from scratch: persistent speech-bubble at top-center, 80ms cross-fade on text change, three variant border tints (teal/green/purple), speech-bubble CSS tail
- HOLD IT variant: prop-driven border-[#FFD93D] swap + ring glow + scale-125→scale-110 animation + gold educationalBeat second line separated by a thin gold divider
- All drag handlers, isSelected gold ring, isDragging opacity-50, and data-testid attributes preserved on SorterItem
- Full tsc --noEmit clean (zero errors)

## Task Commits

1. **Task 1: Rewrite SorterItem to render patient chart** - `38235e9` (feat)
2. **Task 2: Create NPCReactionBubble speech-bubble overlay** - `c3ac20f` (feat)

## SorterItem Chart-Row Render Order

Fields render top-to-bottom in this order (undefined fields are skipped entirely):
1. `patientName` (+ `, age` inline if present) — gold header at 10px
2. `role` — ChartLine
3. `reasonForVisit` — ChartLine
4. `emergencyContact` — ChartLine
5. `doctorNote` — ChartLine
6. `miscField` — ChartLine (uses `miscField.label` as the label)

## NPCReactionBubble Visual States

| State | Border | Scale | Extra |
|---|---|---|---|
| Default (neutral) | teal `#4FB3D9` | 100% | — |
| Enthusiastic | soft green `#7FE3A8` | 100% | — |
| Thoughtful | soft purple `#9B8CE0` | 100% | — |
| HOLD IT | gold `#FFD93D` + ring glow | 125% → 110% (400ms settle) | educationalBeat second line, gold divider, tail color swaps to gold |
| Empty text (no holdIt) | — | — | renders null (hidden entirely) |

## Files Created/Modified

- `client/src/components/phi-sorter/SorterItem.tsx` — Rewritten from 42 lines to 85 lines; chart card with ChartLine helper
- `client/src/components/phi-sorter/NPCReactionBubble.tsx` — Created at 137 lines; speech bubble + HOLD IT variant

## Decisions Made

- HOLD IT implemented inline (not as a sub-component) — the variant is a prop-driven class/style swap; no separate file needed
- ChartLine as a private function within SorterItem.tsx — single-use, no benefit to a separate file
- 80ms opacity cross-fade (not CSS transition on key change) — avoids React re-mount flicker
- Screen pulse, SFX, and NPC portrait all intentionally deferred per plan spec (Phase 23/24)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Plan 04 (PHISorterOverlay wiring) can now import both components directly
- `NPCReactionBubble` accepts `npcName`, `npcRole`, `text`, `variant`, `holdIt` props — Plan 04 drives all of these from its state machine
- `SorterItem` accepts the same props as before; Plan 04's drop/drag logic is unchanged
- `data-testid` hooks in place for Plan 04's live-verify checkpoint

---
*Phase: 22-phi-sorter-content-connection*
*Completed: 2026-06-10*
