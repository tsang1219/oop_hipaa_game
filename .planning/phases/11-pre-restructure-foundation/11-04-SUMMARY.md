---
phase: 11-pre-restructure-foundation
plan: 04
subsystem: PrivacyQuestPage
tags: [bug-fix, stale-closure, React-hooks, EventBridge]
dependency_graph:
  requires: []
  provides: [idempotent-zone-completion, fresh-exit-handler]
  affects: [PrivacyQuestPage]
tech_stack:
  added: []
  patterns: [functional-setState, useCallback-dependency-tracking]
key_files:
  created: []
  modified:
    - client/src/pages/PrivacyQuestPage.tsx
decisions:
  - "Moved checkRoomCompletion and handleExitRoom before EventBridge effect to avoid TDZ"
  - "Added notify to handleExitRoom deps (was missing, needed for Room Complete notification)"
metrics:
  duration: "5m"
  completed: "2026-03-27"
---

# Phase 11 Plan 04: Stale Closure Fixes Summary

Functional setState for zone/item completion + handleExitRoom in EventBridge deps ensures room completion is detected on immediate exit.

## What Was Done

### Task 1: Functional setState + handleExitRoom dependency

**Bug 2 fix:** `onInteractZone` now uses `setCompletedZones(prev => ...)` functional form instead of reading `completedZones` from closure. Idempotent under rapid double-fire.

**Bug 2b (auto-fix):** Applied same functional setState pattern to `onInteractItem` / `setCollectedItems` which had identical stale-closure risk.

**Bug 4 fix:** Added `handleExitRoom` to EventBridge effect dependency array. Removed `completedZones` and `collectedItems` from deps (no longer read from closure). This ensures `onExitRoom` always uses the latest `handleExitRoom` reference which captures current `completedNPCs`.

**Structural fix:** Moved `checkRoomCompletion` and `handleExitRoom` declarations above the EventBridge effect to avoid temporal dead zone with `const`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Moved handleExitRoom before EventBridge effect**
- **Found during:** Task 1
- **Issue:** Adding `handleExitRoom` to dependency array required it to be declared before the effect (const TDZ)
- **Fix:** Relocated `checkRoomCompletion` and `handleExitRoom` above the EventBridge listeners effect
- **Files modified:** client/src/pages/PrivacyQuestPage.tsx

**2. [Rule 2 - Missing] Added notify to handleExitRoom deps**
- **Found during:** Task 1
- **Issue:** handleExitRoom calls `notify()` but it was not in the dependency array
- **Fix:** Added `notify` to useCallback deps
- **Files modified:** client/src/pages/PrivacyQuestPage.tsx

## Verification

- `npx tsc --noEmit` clean
- Functional form confirmed: `setCompletedZones(prev =>` and `setCollectedItems(prev =>`
- handleExitRoom in EventBridge effect deps confirmed
- No stale `new Set(completedZones)` or `new Set(collectedItems)` patterns remain

## Commit

- `34d8153`: fix(11-04): stale closure fixes in PrivacyQuestPage EventBridge handlers
