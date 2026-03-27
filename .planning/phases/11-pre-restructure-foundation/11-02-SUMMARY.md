---
phase: 11-pre-restructure-foundation
plan: 02
subsystem: save-data-wiring
tags: [migration, persistence, React, state-management]
dependency_graph:
  requires: [11-01]
  provides: [v2-save-active, consolidated-persistence]
  affects: [PrivacyQuestPage, BreachDefensePage, GameContainer]
tech_stack:
  added: []
  patterns: [module-level-side-effect, consolidated-writeSave, callback-score-passing]
key_files:
  created: []
  modified:
    - client/src/pages/PrivacyQuestPage.tsx
    - client/src/components/GameContainer.tsx
    - client/src/pages/BreachDefensePage.tsx
decisions:
  - "Module-level migrateV1toV2() call runs before React render for earliest possible migration"
  - "resolvedGatesAll/unlockedNpcsAll stored as refs to accumulate cross-room state for v2 persistence"
  - "music_volume still read from localStorage in writeSave because MusicVolumeSlider manages it independently"
  - "sfx_muted standalone key still written on toggle for ExplorationScene backward compat"
  - "GameContainer passes finalPrivacyScore via onComplete callback instead of writing orphan key"
metrics:
  duration: "15m"
  completed: "2026-03-27"
---

# Phase 11 Plan 02: Wire Migration Summary

All three pages now read/write exclusively through pq:save:v2, with module-level migration on boot.

## What Was Done

### Task 1: PrivacyQuestPage — migration boot + consolidated persistence

- Added module-level `migrateV1toV2(ROOM_IDS)` call before component function
- Replaced all 6 localStorage useState initializers with `initialSave.*` reads
- Replaced 7 individual persistence useEffects with single `writeSave()` call
- Added `resolvedGatesAll`, `unlockedNpcsAll`, `npcPulsedRooms` refs for cross-room state
- Updated gate loading on room change to read from v2 refs instead of localStorage per-room keys
- Updated `resolveGate` to write to v2 refs instead of localStorage per-room keys
- Win condition now reads `privacyScore` state instead of orphan `final-privacy-score` key
- `handleDismissIntroModal` no longer writes `pq:onboarding:seen` directly

### Task 2: GameContainer + BreachDefensePage

- GameContainer `onComplete` signature changed to `(result: { finalPrivacyScore: number }) => void`
- All 3 `localStorage.setItem('final-privacy-score', ...)` calls replaced with callback
- BreachDefensePage reads sfxMuted from `loadSave()` on mount
- Mute toggle writes both standalone `sfx_muted` key and v2 save

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` clean across all 3 modified files
- Only remaining localStorage reads in PrivacyQuestPage: `music_volume` (MusicVolumeSlider compat)
- Only remaining localStorage writes: `sfx_muted` mirror (ExplorationScene compat)
- `final-privacy-score` completely removed from GameContainer

## Commit

- `98f871d`: feat(11-02): wire v2 save migration into all pages
