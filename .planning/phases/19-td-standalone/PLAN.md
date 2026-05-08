# Phase 19 — Tower Defense Standalone Launch

**Milestone:** v2.2 Sponsor Demo
**Status:** Complete
**Started:** 2026-05-08
**Completed:** 2026-05-08
**Owner:** worktree-agent-acd2f1567acdff340

## Goal

Wire the "Tower Defense" start-menu button (Phase 18 placeholder no-op) so it launches `BreachDefenseScene` directly as a self-contained mini-game — no narrative wrapper, no IT Office trigger, no encounter context, no save mutation. Win/loss returns to the start menu.

## Requirements

- **TD-01**: "Tower Defense" start menu button launches BreachDefenseScene directly without narrative wrapper or encounter trigger context
- **TD-02**: Standalone TD returns to the start menu on win or lose with no encounter result feedback or score persistence
- **TD-03**: Standalone TD does not modify full-game or demo save state

## Approach

The existing `BreachDefenseScene` already branches on `encounterId` — when undefined, it runs in "standalone arcade" mode using full `WAVES` + `WAVE_BUDGETS` + all `TOWERS`, and emits `BREACH_VICTORY` / `BREACH_GAME_OVER` (instead of `ENCOUNTER_COMPLETE`). This phase therefore avoids modifying the scene at all — the wiring lives in `UnifiedGamePage.tsx`.

**Wiring shape:**
1. Add `'tower-defense-standalone'` to the `PageMode` union.
2. `handleSelectTowerDefense` switches to that mode and starts the BreachDefense scene directly.
3. A standalone-mode-only effect listens for `BREACH_VICTORY` / `BREACH_GAME_OVER` and surfaces a minimal win/lose overlay (NOT `EncounterDebrief` — that has score wiring + "Return to Hospital" semantics that we explicitly want to avoid).
4. Win/lose overlay buttons:
   - **PLAY AGAIN** → emit `REACT_RESTART_BREACH` + `REACT_START_BREACH` to restart the scene in place.
   - **BACK TO MENU** → reload the page (matches the existing demo-Esc pattern; guarantees a clean Phaser teardown and returns the player to the StartMenu, which is the new cold-boot screen).
5. Reuse `EncounterGameUI` (which already supports an empty/default `availableTowerIds` list) for the in-game tower panel + HUD — it's already a React overlay component that reads BreachDefenseScene state via EventBridge.

**Save isolation strategy (TD-03):** The scene's `WAVE_BUDGETS`/`WAVES`/`TOWERS` standalone path never calls `gameState.addScore`, `gameState.recordEncounterResult`, or any localStorage write. The existing `useGameState` persistence effect already runs unconditionally — but in standalone TD mode we avoid mutating game state at all (no `gameState.*` mutator is called from this code path). Demo-session state stays untouched because `startDemo()` is not called. The only localStorage touch the scene makes itself is `sfx_muted` (read-only check) which is pre-existing behavior of every scene.

## Plans

This phase is a single atomic plan because the changes are tightly coupled (PageMode + handler + listener + overlay must land together to be testable).

- [x] **19-01-PLAN.md** — Wire standalone TD launch path in UnifiedGamePage: add page mode, scene-launch handler, BREACH_VICTORY/GAME_OVER listener, win/lose overlay with Play Again + Back to Menu.

## Success Criteria (verbatim from ROADMAP.md)

1. Pressing "Tower Defense" on the start menu launches BreachDefenseScene directly with no NarrativeContextCard, no IT Office trigger, and no surrounding ExplorationScene — first frame after press is the tower defense grid.
2. Winning or losing the standalone TD round returns the player to the start menu with no encounter result feedback, no debrief modal, and no compliance score updates persisted.
3. Playing standalone Tower Defense does not modify the full-game save key, the demo session state, or any localStorage value that affects either the Demo or Full Game flows on subsequent launches.

## Out of Scope

- Modifying `BreachDefenseScene.ts` itself (its `encounterId === null` standalone branch is already correct).
- Modifying `EncounterGameUI` (it works in both modes).
- New TD-specific assets, sounds, or content.
- Changing the encounter-mode IT Office TD launch path — full-game encounter behavior must remain bit-for-bit identical.

## Verification

- Press "Tower Defense" on cold boot → see TD grid immediately, no narrative card.
- Lose intentionally → win/lose overlay appears, shows score-free "BACK TO MENU" + "PLAY AGAIN" buttons.
- Click BACK TO MENU → reload returns to StartMenu (same as cold boot).
- Compare `localStorage` snapshot before & after a full TD round (start → loss → return) → no `pq:save:v2` mutation related to score/completion/encounter.
- Press "Full Game" / "Demo" after a TD round → existing flows behave unchanged.
- Trigger encounter-mode TD via IT Office (full game) → still launches via NarrativeContextCard, still scores, still returns to ExplorationScene (unchanged).
