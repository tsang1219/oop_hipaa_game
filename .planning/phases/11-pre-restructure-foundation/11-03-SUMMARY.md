---
phase: 11-pre-restructure-foundation
plan: 03
subsystem: ExplorationScene
tags: [EventBridge, bug-fix, listener-cleanup, scene-safety]
dependency_graph:
  requires: []
  provides: [named-event-handlers, scene-active-guards]
  affects: [ExplorationScene]
tech_stack:
  added: []
  patterns: [named-method-event-handlers, scene-isActive-guard]
key_files:
  created: []
  modified:
    - client/src/phaser/scenes/ExplorationScene.ts
decisions:
  - "Arrow function class fields used for handlers (consistent with existing onDialogueComplete pattern)"
metrics:
  duration: "3m"
  completed: "2026-03-27"
---

# Phase 11 Plan 03: ExplorationScene Bug Fixes Summary

Named REACT_ANSWER_FEEDBACK handler eliminates listener accumulation; isActive() guards prevent post-shutdown crashes.

## What Was Done

### Task 1: Named handler + scene guards

**Bug 1 fix:** Converted anonymous `REACT_ANSWER_FEEDBACK` handler to named `onAnswerFeedback` class method. Registration in `create()` and deregistration in `shutdown()` both use the three-argument form `(event, handler, context)`.

**Bug 5 fix:** Added `if (!this.scene.isActive()) return;` guard to all 5 private event handlers:
- `onDialogueComplete`
- `onPauseFromModal`
- `onMusicVolume`
- `onPlaySfx`
- `onAnswerFeedback` (new)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` clean
- 0 anonymous handlers passed to `eventBridge.on()`
- 3 `onAnswerFeedback` occurrences: definition, on(), off()
- 6 `isActive()` guards (5 handlers + 1 existing bgMusic guard)

## Commit

- `51f60dd`: fix(11-03): named REACT_ANSWER_FEEDBACK handler + scene.isActive() guards
