---
phase: 24-phi-sorter-format-shift
plan: 02
subsystem: phi-sorter
tags: [components, presentational, desk-format, papers-please, ui]
dependency_graph:
  requires:
    - client/src/data/sorterData.ts (SorterItem/SorterChart types)
    - client/src/index.css (doc-slide-in/off, ink-stamp-in, clock-pulse keyframes — Plan 24-01)
  provides:
    - client/src/components/phi-sorter/DeskSurface.tsx
    - client/src/components/phi-sorter/ShiftClock.tsx
    - client/src/components/phi-sorter/OutgoingTray.tsx
    - client/src/components/phi-sorter/StampPad.tsx
    - client/src/components/phi-sorter/DeskDocument.tsx
    - client/src/components/phi-sorter/NPCReactionBubble.tsx (extended)
  affects:
    - Plan 24-03 (PHISorterOverlay rewrite composes all five new components)
tech_stack:
  added: []
  patterns:
    - prevCountRef + setBouncing (from BucketZone) for counter bounce — consistent animation pattern
    - prevAnimStateRef transition detection (from BucketZone) for ink-splatter burst
    - Phase 21 CertificateOverlay CSS spritesheet-crop pattern for 64px pixelated portrait
    - PARTICLE_ANGLES/PARTICLE_RADII from BucketZone, radius shrunk from 44/60 to 30/42 for desk scale
key_files:
  created:
    - client/src/components/phi-sorter/DeskSurface.tsx
    - client/src/components/phi-sorter/ShiftClock.tsx
    - client/src/components/phi-sorter/OutgoingTray.tsx
    - client/src/components/phi-sorter/StampPad.tsx
    - client/src/components/phi-sorter/DeskDocument.tsx
  modified:
    - client/src/components/phi-sorter/NPCReactionBubble.tsx
decisions:
  - "DeskDocument ink-splatter particles positioned at 65%/35% (center-right of paper) to match ink mark position"
  - "StampPad uses tabIndex=-1 on buttons — parent window keydown handler owns keyboard; prevents double-commit via native button Enter focus"
  - "NPCReactionBubble speech tail switches from down-pointing to left-pointing when portrait is present (speech originates beside portrait)"
  - "sorterData.ts shiftSeconds type errors are pre-existing from Plan 24-01 parallel execution — not caused by this plan"
metrics:
  duration: "~6 min"
  completed_date: "2026-06-10"
  tasks_completed: 3
  files_created: 5
  files_modified: 1
---

# Phase 24 Plan 02: Desk-Format Component Suite Summary

**One-liner:** Five presentational desk-format components + NPCReactionBubble portrait extension — typed building blocks for Plan 03's PHISorterOverlay rewrite.

## What Was Built

### Task 1: DeskSurface + ShiftClock + OutgoingTray
Three simple presentational components forming the desk chrome.

**DeskSurface** (`data-testid="sorter-desk-surface"`) — CSS wood-grain container using three layered linear-gradients over `#6B4A2F` base. No image assets. Inner box-shadow gives depth. Relative-positioned so children compose inside.

**ShiftClock** (`data-testid="sorter-shift-clock"`) — mm:ss countdown card. Low-time window (1-10s): text/border go pink (`#FF6B9D`), time element gets `animate-[clock-pulse_0.6s_ease-in-out_infinite]`. At 0: static `0:00`, no pulse. `data-low` attribute for test hooks. Parent owns the interval.

**OutgoingTray** (`data-testid="sorter-tray-{kind}"`) — stacked-paper tray with up to 5 visible cream paper rectangles above the labeled base. Counter bounces on increment via `prevCountRef` + `setBouncing` pattern ported verbatim from BucketZone. KEEP=green, REDACT=pink. Empty count dimmed.

### Task 2: StampPad + DeskDocument
The interaction surfaces.

**StampPad** — KEEP (left) and REDACT (right) rubber stamp buttons mirroring the retired bucket layout for muscle memory continuity. Click-commit only — zero drag handlers. `tabIndex={-1}` prevents double-commit via native button Enter focus. Wood handle bar over ink base block. `focusedStamp` drives `ring-4 ring-white/70 scale-105`; `pressedStamp` drives `animate-[stamp-press_0.15s_ease-out]`; `disabled` greys via opacity-50.

**DeskDocument** — Cream paper chart (`#F5EFD9` bg, cream border, chunky shadow). Inverted from dark SorterItem card — physically a document on a desk. All Phase 22 chart fields rendered via restyled `ChartLine` (warm label `#8a6d3b`, dark navy value `#2a2a3e`). Four-state animation contract: `entering` → doc-slide-in, `active` → idle, `stamped` → flash-green/shake-red/none, `exiting` → doc-slide-off-left/right with `forwards`. Ink mark: deterministic rotation `((id.length * 7) % 13) - 6°`, rendered when `stampedKind` is non-null, `animate-[ink-stamp-in_0.15s_ease-out_forwards]`. Ink-splatter: 8 DOM particles fire on entering `stamped` state (transition detection via `prevAnimStateRef`), ink-colored (stamp identity, not correctness), cleared after 600ms.

### Task 3: NPCReactionBubble Portrait Extension
Extended (not rewritten) for SORTV2-15.

**New `spriteUrl?: string` prop** — when provided, restructures layout into portrait-left / bubble-right row. Portrait: 64px div using Phase 21 CertificateOverlay pattern (`backgroundSize: '192px 256px'`, `backgroundPosition: '0 0'`, `imageRendering: 'pixelated'`). Name plate beneath portrait. Portrait border goes gold during HOLD IT. Speech bubble tail switches from down-pointing to left-pointing (speech originates beside portrait). Portrait + name plate persist even when `visibleText` is empty — only the bubble half hides.

**Backward compatible**: without `spriteUrl`, behavior is byte-for-byte equivalent to Phase 22/23. Early return preserved. All existing HOLD IT scale/gold-flash/educationalBeat logic untouched.

## Deviations from Plan

None — plan executed exactly as written.

The `shiftSeconds` TypeScript errors in sorterData.ts were pre-existing from Plan 24-01's parallel execution (per the parallel-execution note in the plan instructions). All five new components compile clean; errors are exclusively from sorterData.ts which this plan explicitly does not modify.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1: DeskSurface + ShiftClock + OutgoingTray | 6f9932e | DeskSurface.tsx, ShiftClock.tsx, OutgoingTray.tsx |
| 2: StampPad + DeskDocument | 67abe52 | StampPad.tsx, DeskDocument.tsx |
| 3: NPCReactionBubble portrait extension | a9005b0 | NPCReactionBubble.tsx |

## Self-Check

**Files exist:**
- client/src/components/phi-sorter/DeskSurface.tsx ✓
- client/src/components/phi-sorter/ShiftClock.tsx ✓
- client/src/components/phi-sorter/OutgoingTray.tsx ✓
- client/src/components/phi-sorter/StampPad.tsx ✓
- client/src/components/phi-sorter/DeskDocument.tsx ✓
- client/src/components/phi-sorter/NPCReactionBubble.tsx (extended) ✓

**Build:** `npm run build` passes (3.57s, no errors)
**Typecheck:** `npx tsc --noEmit` passes (no errors outside pre-existing sorterData.ts)
**Presentational purity:** grep confirmed no EventBridge/sorterReactions/useGameState imports in any of the 5 new components (comment hits only)
**PHISorterOverlay.tsx untouched:** confirmed via git diff

## Self-Check: PASSED
