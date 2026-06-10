---
phase: 25-dialogue-portraits
plan: 01
subsystem: ui
tags: [phaser, react, sprites, portraits, npc, hipaa, roomdata]

# Dependency graph
requires:
  - phase: 21-sponsor-demo-capstone
    provides: SPONSOR_SPRITE_PATHS and CSS-crop portrait pattern that getNPCPortraitPath builds on
  - phase: 24-phi-sorter-format-shift
    provides: NPCReactionBubble CSS-crop pattern (Phase 21 companion) that VIS-01 references
provides:
  - VIS-01..03 requirements defined in REQUIREMENTS.md (v2.3 section)
  - sprite field on all 26 named NPCs in roomData.json
  - getNPCPortraitPath(npcId) resolver in spriteAssetPaths.ts — data-driven, dev-warn fallback
affects:
  - Phase 25 Plan 02 (BattleEncounterScreen portrait integration — consumes getNPCPortraitPath)
  - Any future phase adding new named NPCs (must add sprite field to roomData.json)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data-driven NPC portrait resolution: roomData.json sprite fields -> module-level index -> getNPCPortraitPath -> SPONSOR_SPRITE_PATHS lookup"
    - "Dev-mode fallback warning pattern: console.warn inside import.meta.env.DEV guard, staff sheet fallback"

key-files:
  created: []
  modified:
    - .planning/REQUIREMENTS.md
    - client/src/data/roomData.json
    - client/src/data/spriteAssetPaths.ts

key-decisions:
  - "getNPCPortraitPath built from roomData.json sprite fields at module load (IIFE index) — no hardcoded npcId map, single source of truth"
  - "Fallback is npc_staff_sheet with loud console.warn in DEV — named characters never silently render generic"
  - "SPONSOR_SPRITE_PATHS and getSponsorSpritePath left untouched — CertificateOverlay dependency preserved"
  - "Sheet geometry documented in file header (96x128, 3x4, frame 0 = idle-down) for Plan 02 CSS crop consumers"

patterns-established:
  - "roomData.json sprite field: one of 9 BootScene sheet types (receptionist/nurse/doctor/it_tech/officer/boss/staff/patient/visitor)"
  - "spriteAssetPaths.ts dual purpose: Phase 21 sponsor capstone + Phase 25 dialogue portraits"

requirements-completed: [VIS-02]

# Metrics
duration: 3min
completed: 2026-06-10
---

# Phase 25 Plan 01: NPC Portrait Data Foundation Summary

**Data-driven npcId-to-spritesheet resolver via roomData.json sprite fields — all 26 named NPCs mapped, getNPCPortraitPath exported with dev-mode staff-sheet fallback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-10T06:35:31Z
- **Completed:** 2026-06-10T06:38:59Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Defined VIS-01..03 requirements in REQUIREMENTS.md v2.3 section (SORTV2/TRIA precedent format), with traceability rows
- Added `sprite` type field to all 26 named NPCs in roomData.json (22 new, 4 pre-existing left intact)
- Extended spriteAssetPaths.ts with `getNPCPortraitPath(npcId)`: module-level IIFE index built from roomData, dev-mode console.warn fallback, sheet geometry doc comment

## Task Commits

Each task was committed atomically:

1. **Task 1: Define VIS-01..03 in REQUIREMENTS.md** - `f7cfc73` (feat)
2. **Task 2: Add sprite field to all 26 named NPCs** - `09470ba` (feat)
3. **Task 3: Add getNPCPortraitPath resolver** - `bc3f430` (feat)

**Plan metadata:** (docs commit, created below)

## Files Created/Modified
- `.planning/REQUIREMENTS.md` — Added v2.3 section (VIS-01..03 specs + note on VIS-04..08), 3 traceability rows, coverage count updated
- `client/src/data/roomData.json` — 22 sprite fields added across 7 rooms; 4 pre-existing sprite fields untouched
- `client/src/data/spriteAssetPaths.ts` — Added roomData import, NPC_SPRITE_TYPE_BY_ID IIFE index, getNPCPortraitPath() export; SPONSOR_SPRITE_PATHS and getSponsorSpritePath untouched

## Decisions Made
- getNPCPortraitPath resolves via module-level IIFE index (not lazy lookup) — cheap, deterministic, no async
- Fallback to npc_staff_sheet with console.warn(DEV) rather than throwing — dialogue remains functional if a new NPC is added without a sprite field before Plan 02 ships
- SPONSOR_SPRITE_PATHS key naming (`npc_${type}_sheet`) reused as-is for the new resolver — no new key format introduced

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript check clean on first attempt. Python assertion passed on first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 can consume `getNPCPortraitPath` without touching data files. The resolver is exported, the roomData sprite fields are complete, and the sheet geometry is documented for CSS crop consumers. `npm run check` passes.

## Self-Check: PASSED

All key files confirmed on disk. All task commits confirmed in git log.

---
*Phase: 25-dialogue-portraits*
*Completed: 2026-06-10*
