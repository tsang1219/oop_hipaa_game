---
phase: 18-demo-mode
plan: 04
status: complete
completed: 2026-05-08
---

# Plan 18-04: Demo Runtime — SUMMARY

## What was built

Two files modified to wire the demo-mode runtime: when `isDemoActive()` is true, the curated 4-room flow is fully accessible, full-game save is untouched, and Esc returns to start menu.

**`client/src/hooks/useGameState.ts`** (DEMO-03, DEMO-06)
- Imported `isDemoActive`, `DEMO_ROOM_ORDER` from `@/lib/demoSession`
- `isDepartmentAccessible()`: in demo mode, returns `true` for `hospital_entrance`, the four DEMO_ROOM_ORDER entries (`reception`, `er`, `break_room`, `records_room`), and any `hallway_*` connector. Anything else stays locked. Full-game branch (else clause) untouched.
- Persistence useEffect: early-returns when `isDemoActive()` — useGameState's writeSave loop never fires during demo play.

**`client/src/pages/UnifiedGamePage.tsx`** (DEMO-04, DEMO-06, DEMO-07)
- Imported `endDemo`, `isDemoActive` (alongside the `startDemo` already added in Plan 03)
- Consolidated persistence useEffect: skipped when demo is active — `pq:save:v2` is never written during demo
- `showIntroModal` initializer: returns `false` when demo is active — no full-game onboarding overlay during a demo session
- `startExploration()` boot logic: when demo is active, resumeRoomId is forced to `'reception'` (DEMO-04 — first curated demo room), regardless of any persisted `currentRoomId`
- New Esc-to-start-menu useEffect: while demo is active and `pageMode === 'exploration'`, pressing Escape calls `endDemo()` then `window.location.reload()`. Reload restores cold-boot defaults and the new default cold-boot screen is the StartMenu, so the player lands back there with their full-game save bit-for-bit unchanged.

## Verification

- TypeScript strict typecheck: zero new errors
- `client/src/data/roomData.json` untouched (DEMO-05 — verified `git diff` shows empty)
- All Plan 18-04 must-have truths satisfied:
  - Demo bypass active in `isDepartmentAccessible` (line 86 in useGameState.ts)
  - DEMO-06 isolation at TWO layers: useGameState writeSave loop guard (line 151) + UnifiedGamePage consolidated persistence guard (line 212)
  - Reception spawn in demo (line 382-383 of UnifiedGamePage.tsx)
  - Esc handler wired (line 925) calls endDemo() + reload
- Phase 16 in-flight code preserved: handleSorterAbort (line 730), takeaways (162, 743, 755, 1076-1077), onAbort prop (1063) — all intact

## Key decisions

- **Two-layer DEMO-06 guard**: both useGameState's internal persistence effect AND UnifiedGamePage's consolidated writeSave effect skip on `isDemoActive()`. Either alone would leak partial save state; both together guarantee `pq:save:v2` is not written.
- **Hallway accessibility**: demo mode allows ALL `hallway_*` rooms unconditionally. Without this, the player could be physically stuck unable to traverse from Reception → ER (the connecting hallways would be locked). Hallways have no scenarios per Phase 12's design — no NPCs, no zones, no items beyond the act-aware bulletin boards. Allowing them does not violate DEMO-05 (no new content authored).
- **Page reload on Esc** (vs soft-reset): the existing `handleNewGame` and `handlePlayAgain` callbacks already use `window.location.reload()` for the same cleanup reason (full reset of in-memory game state, Phaser scene, encounter overlays). Reusing this pattern is simpler than adding a new `gameState.resetToSave()` and matches existing project conventions.
- **Reception → ER routing**: roomData.json shows that `reception` connects to `hospital_entrance` (the lobby hub) and other rooms also connect via the hub. Demo bypass on hospital_entrance + hallways means the player can freely traverse between any two demo rooms without hitting a locked door. Hub-and-spoke routing reuses existing room data verbatim (DEMO-05).
- **No demoSession.markRoomComplete() wiring in Plan 04**: the API exists in Plan 01 for future use (Phase 21 may want to know what % of demo rooms the player completed), but Plan 04 doesn't need it yet. The full-game `gameState.completeRoom()` still updates `gameState.state.completedRooms` in memory during demo (used for in-room door visuals like green checkmarks); since writeSave is skipped, those completions never leak to localStorage. Page reload on Esc clears the in-memory state cleanly.

## Files changed

- `client/src/hooks/useGameState.ts` (+18 / -1 lines)
- `client/src/pages/UnifiedGamePage.tsx` (+39 / -2 lines)

## Commit

- `e337655` — feat(18-04): demo runtime — bypass unlocks, isolate save, Esc to menu

## Self-Check

- [x] Demo rooms accessible without UNLOCK_ORDER gating
- [x] Demo spawns at Reception
- [x] Demo skips full-game intro modal
- [x] DEMO-06 isolation at two layers (useGameState + UnifiedGamePage)
- [x] Esc-to-start-menu wired with endDemo() + reload
- [x] roomData.json untouched (DEMO-05)
- [x] Phase 16 in-flight code preserved
- [x] TypeScript clean
- [x] FULL GAME flow remains unchanged (no changes to non-demo branches)
- [x] Atomic commit with explicit file list
