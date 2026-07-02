# Run Report — 04 Refactor EXECUTION (rounds 0–6 + final cleanup)

**Branch:** `fable/refactor-exec` · **Base:** main after the Run-07 fix merge · **Date:** 2026-07-02
**Spec:** `.planning/REFACTOR_PROPOSAL.md` (Run 04, proposal half)

## User decisions applied (from the §8 open questions)

1. **Directory layout:** proposal default — `phaser/sprites/`, `phaser/systems/exploration/`, `phaser/systems/breach/`, `lib/doorGraph.ts`.
2. **SpriteFactory barrel:** deleted in a final cleanup round; `generateAllTextures` lives in `sprites/index.ts`, all importers repointed to concrete modules.
3. **Round 7 (React hook extractions):** DROPPED — banked rounds 1–6; re-evaluate later if UnifiedGamePage still feels heavy.
4. **Music dedup:** the create()/wake BGM near-duplicates merged into one `MusicController.startRoomMusic(room, act, fadeMs)` — create passes 1800ms, wake passes 800ms, both preserved. The wake path *gained* the create() path's defensive guards (reclaim/orphan-cleanup/locked) — strictly safer superset.

## Prerequisite: twin fix-loop resolution (on main before this run)

The proposal predated the Run-07 twin sessions. Before refactoring, `fable/fix-loop`
was picked as the winner (broader unique coverage, 31/31 green), the twin's two unique
fixes were ported onto it (R7-05 celebration deferral verbatim cherry-pick; R7-06
`isFinalBoss` flag with the win math adapted to fix-loop's stale-state-safe check),
verified (tsc/build/26 unit/31 progression/win-driver PASS), and merged to main.
`fable/fix-loop-work` is superseded — do not merge it.

## Rounds (one commit each, full gate per round)

| Round | Commit | Extraction | Gate result |
|---|---|---|---|
| 0 | 048134f | Baseline: 9 loop4 shots → `screenshots/refactor-baseline/` | tsc/build clean |
| — | e53a67f | `tests/refactor-compare.mjs` — dep-free perceptual diff (Playwright canvas, 3% tol; measured noise floor ≤0.5%) | — |
| 1 | 36bb5a9 | SpriteFactory → 9 modules under `sprites/` | 81 texture guards parity-checked identical; 9/9 shots ≤0.18% |
| 2 | f79b0d6 | UnifiedGamePage → `lib/doorGraph.ts` + `StandaloneTDView.tsx` | 31/31 progression; TD boot smoke; 9/9 shots |
| 3 | b6617de | ExplorationScene → `pathfinding.ts` + `roomRenderer.ts` (792 ln) | 31/31; 9/9 shots ≤0.24% |
| 4 | fa40221 | ExplorationScene → `interactableFactory.ts` + `roomAmbience.ts` + `idleHints.ts` | 31/31; encounters script; normalized-diff parity check |
| 5 | 8528f82 | BreachDefenseScene → `gridRenderer.ts` + `battleVfx.ts` + `celebrationVfx.ts` | 31/31; live TD smoke (2 towers, 2 waves, 0 pageerrors) |
| 6 | 3d1e8d1 | ExplorationScene → `MusicController.ts` + `DoorSystem.ts` | 31/31; music/door smoke incl. F-24 duplicate-crossfade probe, locked-door recovery, encounter kill/restore |
| final | c5413cf | Barrel deleted, importers repointed | tsc/build; 9/9 shots ≤0.25% |

Final regression at tip: unit+data 26/26, progression 31 passed / 4 skipped.

## Line counts (before → after)

| File | Proposal baseline | Pre-round (post fix-merge) | After | Proposal target |
|---|---|---|---|---|
| SpriteFactory.ts | 4,005 | 4,005 | **deleted** (9 modules, 4,046 ln total) | ≤60 barrel |
| ExplorationScene.ts | 3,379 | 3,574 | **1,731** | ≤1,400 ±15% |
| BreachDefenseScene.ts | 2,160 | 2,174 | **1,323** | ≤1,300 ±15% ✓ |
| UnifiedGamePage.tsx | 1,979 | 2,149 | **1,875** | ≤1,100 (Round-7 target) |

## Deviations from the proposal

- **ExplorationScene 1,731 vs ≤1,610 (target+15%):** the fix merge added ~195 lines the
  proposal didn't count, and its not-to-move list (encounter lifecycle, movement core,
  update()) was honored. Adjusted for drift, the extraction volume matches the plan.
- **UnifiedGamePage 1,875:** Round 7 dropped by user decision — `useEncounterFlow` /
  `useStandaloneTD` hooks not extracted. The ≤1,100 target belongs to that round.
- Round 4: first-NPC pulse now runs after `spawnInteractables` (was interleaved
  mid-life-pass); verified unobservable (per-room-exclusive life passes, disjoint tween props).
- Round 5: `renderBattlefield` returns `pathSet` in addition to the 5 predicted handles;
  takes `(scene, wave, totalWaves)`. Startup text renders earlier within create() —
  depth-explicit, only same-depth peer keeps relative order.
- Round 6: `transitioning` and `lastActivityAt` became public scene fields (DoorSystem
  reads/writes via scene ref) — visibility-only change.
- Comparator uses a canvas pixel count instead of pixelmatch (no new dependencies rule).

## Invariants verified

- 5-export SpriteFactory surface preserved through Round 1 (barrel), then importers
  repointed and barrel deleted in the final round with all gates green.
- `updateCompletionState` reach-in, `ENCOUNTER_*`/`BREACH_*`/`REACT_*` payloads,
  `registry.encounterResult_*` keys, `BreachDefenseInitData` export location: unchanged.
- No new npm dependencies; no educational strings touched; save format untouched.
