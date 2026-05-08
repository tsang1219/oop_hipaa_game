---
phase: 18-demo-mode
plan: 03
status: complete
completed: 2026-05-08
---

# Plan 18-03: Wire StartMenu into UnifiedGamePage — SUMMARY

## What was built

Edited `client/src/pages/UnifiedGamePage.tsx` to make `<StartMenu>` the new first screen the player sees on `/`:

- Imports added: `StartMenu` component (Plan 02) + `startDemo` from `@/lib/demoSession` (Plan 01)
- `PageMode` union extended: `'start-menu' | 'title' | 'exploration' | 'dialogue' | 'gameover' | 'win'`
- `pageMode` initializer default changed from `'title'` to `'start-menu'` — QA bypass paths (`qa-room`, `qa-skip-onboarding`, `qa-no-save`) and the `pq:skip-title` sessionStorage flag still skip directly to `'exploration'`, preserving existing test workflows
- Three new callbacks:
  - `handleSelectFullGame` → `setPageMode(hasSaveData() ? 'title' : 'exploration')` — replicates the original cold-boot path bit-for-bit (DEMO-02)
  - `handleSelectDemo` → calls `startDemo()` from demoSession + `setPageMode('exploration')` — Plan 04 wires the runtime gating that uses `isDemoActive()` to bypass UNLOCK_ORDER and skip writeSave
  - `handleSelectTowerDefense` → intentional no-op placeholder (Phase 19 will replace)
- Render branch added BEFORE the existing `'title'` branch — when `pageMode === 'start-menu'`, render `<StartMenu>` and return early. Phaser is NOT mounted in this mode.

## Verification

- TypeScript strict typecheck: zero new errors (`npx tsc --noEmit` clean)
- All plan must-haves satisfied:
  - `'start-menu'` appears as a PageMode value, the default initial mode, and a render branch (lines 72, 129, 918)
  - StartMenu imported and mounted with `onDemo`, `onTowerDefense`, `onFullGame` props (lines 33, 920-923)
- Phase 16 in-flight preservation (lines verified):
  - `handleSorterAbort` callback at line 717 — intact
  - takeaways field on encounterResult (line 162), input tuple (line 730), filter (line 742), SorterTakeawaysPanel render (lines 1039-1040) — all intact
  - `onAbort={handleSorterAbort}` PHISorterOverlay prop (line 1026) — intact

## Key decisions

- **TD button is a no-op stub** — the parent task explicitly notes Phase 19 owns the standalone TD launch. Plan 03 surfaces the button (DEMO-01 needs three visible primary buttons) without launching anything yet. Phase 19 only needs to swap the handler body.
- **DEMO calls `startDemo()` here, not in Plan 04** — the demoSession singleton must be active before the exploration boot effect runs, so doing it in the click handler (which sets pageMode → re-renders → boot effect runs with isDemoActive() = true) is the correct ordering.
- **Did NOT modify TitleScreen.tsx** — FULL GAME path still flows through it. Resume / New Game prompt still appears for returning players exactly as before.
- **bootPoll race**: The ExplorationScene boot useEffect (lines ~362-411) registers a SCENE_READY listener AND a 50ms interval polling for `gameRef.current`. While in start-menu mode, the canvas div doesn't render → `gameRef.current` stays null → `startExploration()` early-returns harmlessly. No gating needed.

## Files changed

- `client/src/pages/UnifiedGamePage.tsx` (+46 / -2 lines)

## Commit

- `8f1475a` — feat(18-03): wire StartMenu as first screen, preserve full-game path

## Self-Check

- [x] StartMenu renders as first screen (cold boot)
- [x] FULL GAME button path bit-for-bit unchanged
- [x] DEMO calls startDemo() and routes to exploration
- [x] TD button stub left for Phase 19
- [x] QA query params still bypass start menu
- [x] Phase 16 in-flight code preserved (handleSorterAbort, takeaways, onAbort all intact)
- [x] TypeScript clean
- [x] Atomic commit, single file, no stray staging
