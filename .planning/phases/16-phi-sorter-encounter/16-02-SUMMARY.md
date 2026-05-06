---
phase: 16-phi-sorter-encounter
plan: "02"
subsystem: ui
tags: [phaser, react, eventbridge, audio, sfx, hipaa]

# Dependency graph
requires:
  - phase: 16-phi-sorter-encounter
    provides: "Plan 01 locked sorterData constants — document set IDs referenced in payload contract"
provides:
  - "EventBridge ENCOUNTER_TRIGGERED payload contract with type discriminator (td|phi-sorter) and sorterConfig"
  - "EventBridge REACT_RETURN_FROM_ENCOUNTER payload contract with optional encounterId for registry-write delegation"
  - "BootScene preloads sfx_sorter_correct (confirmation_001.ogg) and sfx_sorter_wrong (error_001.ogg)"
affects: [16-03, 16-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Discriminator-on-payload: extend existing BRIDGE_EVENTS payload with optional `type` field instead of adding new constants (smaller diff, Phase 13 backward compat)"
    - "Registry-write delegation: pure-React encounters pass encounterId back via REACT_RETURN_FROM_ENCOUNTER so ExplorationScene writes the proximity guard"

key-files:
  created: []
  modified:
    - client/src/phaser/EventBridge.ts
    - client/src/phaser/scenes/BootScene.ts

key-decisions:
  - "Discriminator approach locked: extend ENCOUNTER_TRIGGERED payload with optional type field — no new BRIDGE_EVENTS constants (smaller diff, matches Phase 13 payload-extension precedent)"
  - "Registry write strategy locked: extend REACT_RETURN_FROM_ENCOUNTER with optional encounterId so ExplorationScene's onReturnFromEncounter can write registry guard for pure-React encounters"
  - "SFX sourced from Kenney interface-sounds library (confirmation_001.ogg = chime, error_001.ogg = soft thud) — proportional to single-item drop per Commandment 8"

patterns-established:
  - "Payload extension pattern: optional discriminator fields on existing events, defaulting for backward compat"
  - "JSDoc contract documentation: payload shapes documented in EventBridge.ts as single-block comments on the constant"

requirements-completed: [SORT-04]

# Metrics
duration: 8min
completed: 2026-05-01
---

# Phase 16 Plan 02: Contract Lock + SFX Preload Summary

**EventBridge payload contracts locked (discriminator + registry-write delegation) and two Kenney SFX keys preloaded in BootScene for PHI Sorter encounter**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-01T00:00:00Z
- **Completed:** 2026-05-01T00:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Locked the discriminator approach: `ENCOUNTER_TRIGGERED` payload extended with optional `type?: 'td' | 'phi-sorter'` and `sorterConfig?: { documentSetId: string }` — no new event constants, backward compat preserved
- Locked the registry-write strategy: `REACT_RETURN_FROM_ENCOUNTER` payload extended with optional `encounterId?: string` so ExplorationScene can write the proximity re-trigger guard on behalf of pure-React encounters
- Preloaded `sfx_sorter_correct` (Kenney `confirmation_001.ogg`) and `sfx_sorter_wrong` (Kenney `error_001.ogg`) in BootScene, satisfying Commandment 1 (every action has a response) for Plan 03

## Task Commits

Each task was committed atomically:

1. **Task 1: Document ENCOUNTER_TRIGGERED + REACT_RETURN_FROM_ENCOUNTER payload contracts** - `510e86c` (docs)
2. **Task 2: Add sfx_sorter_correct and sfx_sorter_wrong preloads to BootScene** - `0f8bdf9` (feat)

## Files Created/Modified

- `client/src/phaser/EventBridge.ts` - Added JSDoc payload contracts for ENCOUNTER_TRIGGERED and REACT_RETURN_FROM_ENCOUNTER
- `client/src/phaser/scenes/BootScene.ts` - Added two new `this.load.audio()` calls for sorter SFX keys

## Decisions Made

**1. Discriminator approach: payload extension, not new constants**
- Research recommended extending existing `ENCOUNTER_TRIGGERED` with an optional `type` field rather than creating a new event constant (`SORTER_TRIGGERED`)
- Rationale: smaller diff, matches Phase 13's precedent of extending payloads, no downstream listener registration changes needed

**2. Registry write strategy: encounterId delegation via REACT_RETURN_FROM_ENCOUNTER**
- The PHI Sorter is pure React (no Phaser scene) so it cannot call `this.registry.set(...)` directly
- Solution: pass `encounterId` back in the return event; ExplorationScene's existing `onReturnFromEncounter` handler writes the guard
- This is documented in JSDoc so Plan 04 knows exactly what to implement in ExplorationScene

**3. SFX file selection**
- `confirmation_001.ogg` = clean affirmative chime — matches green-flash correct-answer aesthetic
- `error_001.ogg` = soft thud — matches red-shake without being harsh
- Per Commandment 8: feedback is proportional to moment size — a single card drop is small, not a klaxon

## Exact Payload Contracts (for Plans 03 and 04)

**ENCOUNTER_TRIGGERED payload:**
```typescript
{
  encounterId: string;          // 'td-it-office' | 'phi-sort-reception' | 'phi-sort-lab' | 'phi-sort-records'
  narrativeText: string;        // Body text for NarrativeContextCard / SorterContextCard
  type?: 'td' | 'phi-sorter';   // Discriminator — defaults to 'td' for legacy/backward-compat (Phase 13)
  config?: BreachDefenseInitData;            // Present when type === 'td' (Phase 13)
  sorterConfig?: { documentSetId: string };  // Present when type === 'phi-sorter' (Phase 16)
}
```

**REACT_RETURN_FROM_ENCOUNTER payload:**
```typescript
{ encounterId?: string } | undefined
// When encounterId present: ExplorationScene writes this.registry.set('encounterResult_' + encounterId, true)
// undefined: legacy TD encounters — no change to Phase 13 flow
```

**SFX keys for Plan 03 REACT_PLAY_SFX emits:**
- Correct sort: `sfx_sorter_correct`
- Wrong sort: `sfx_sorter_wrong`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 (overlay UI) can import SFX key names from this summary and use `REACT_PLAY_SFX` with `sfx_sorter_correct` / `sfx_sorter_wrong`
- Plan 04 (Phaser triggers + UnifiedGamePage routing) can read `data.type === 'phi-sorter'` from `ENCOUNTER_TRIGGERED` and implement registry-write via `data?.encounterId` in `onReturnFromEncounter`
- Both plans unblocked to proceed independently (Plans 03 and 04 have no ordering dependency on each other)
- No blockers.

---
*Phase: 16-phi-sorter-encounter*
*Completed: 2026-05-01*
