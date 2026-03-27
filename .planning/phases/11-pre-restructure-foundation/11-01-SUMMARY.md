---
phase: 11-pre-restructure-foundation
plan: 01
subsystem: save-data
tags: [localStorage, migration, schema, TDD]
dependency_graph:
  requires: []
  provides: [SaveDataV2, migrateV1toV2, loadSave, writeSave]
  affects: [PrivacyQuestPage, BreachDefensePage, GameContainer]
tech_stack:
  added: [vitest, jsdom]
  patterns: [versioned-save-schema, write-before-delete-migration, TDD]
key_files:
  created:
    - client/src/lib/saveData.ts
    - client/src/lib/saveData.test.ts
    - vitest.config.ts
  modified: []
decisions:
  - "gameStartTime defaults to Date.now() on fresh migration (not preserved from v1 if absent)"
  - "sfx_muted and music_volume included as v1 keys to delete during migration"
metrics:
  duration: "8m"
  completed: "2026-03-27"
---

# Phase 11 Plan 01: saveData.ts Summary

SaveDataV2 schema with idempotent v1-to-v2 migration using write-before-delete for crash safety, plus vitest infrastructure.

## What Was Done

### Task 1: TDD — saveData.ts with schema, migration, and helpers

**RED:** Created 9 failing tests covering all migration paths: empty state, v1 key ingestion, idempotency, corrupted v2 fallthrough, loadSave/writeSave round-trip, per-room key migration, and sfxMuted/musicVolume mapping.

**GREEN:** Implemented `client/src/lib/saveData.ts` with:
- `SaveDataV2` interface (14 fields including sfxMuted, musicVolume)
- `SAVE_KEY_V2 = 'pq:save:v2'`
- `defaultSave` constant
- `migrateV1toV2(roomIds)` — reads 29 v1 keys, writes single v2 object, deletes v1 keys
- `loadSave()` — returns parsed v2 or defaultSave
- `writeSave(data)` — atomic JSON replacement

Also installed vitest + jsdom and created vitest.config.ts for the test infrastructure.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All 9 TDD tests pass
- `npx tsc --noEmit` clean
- All 6 exports verified: SaveDataV2, SAVE_KEY_V2, defaultSave, migrateV1toV2, loadSave, writeSave

## Commit

- `49ea806`: feat(11-01): create saveData.ts with v2 schema, migration, and TDD tests
