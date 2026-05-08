---
phase: 18-demo-mode
plan: 02
status: complete
completed: 2026-05-08
---

# Plan 18-02: StartMenu Component — SUMMARY

## What was built

`client/src/components/StartMenu.tsx` — three-button mode selector that satisfies DEMO-01.

- Three buttons in fixed order: DEMO, TOWER DEFENSE, FULL GAME
- Keyboard navigation: ArrowUp/W and ArrowDown/S move selection; Enter or Space confirms
- Mouse: click invokes the corresponding action; mouseEnter highlights the button
- Selected state shows a blinking pink `>` cursor and white text; unselected gray
- Visual style mirrors `TitleScreen.tsx`: `#1a1a2e` bg, `#16213e` menu card, `#FF6B9D` border, CRT scanline overlay, twinkling stars, pixel hospital silhouette, Press Start 2P throughout
- Subtitle "PICK YOUR POISON" — deadpan, IDENTITY-aligned (not corporate cheer)
- Staggered fade-in (logo → menu → footer) for entrance pacing

## Verification

- TypeScript strict typecheck: zero new errors
- Button order verified in source: line 34-38 menuItems array is `[DEMO, TOWER DEFENSE, FULL GAME]`
- Isolation: zero imports of `eventBridge`, `useGameState`, `saveData`, or `Phaser`. Only false-positive grep match was a comment string ("no Phaser, no eventBridge, no localStorage")
- Identity check: subtitle "PICK YOUR POISON" passes deadpan-JRPG test; corporate alternatives ("Welcome to your training") rejected

## Key decisions

- Reused TitleScreen's visual vocabulary verbatim — bg color, border, scanline pattern, cursor blink animation, footer hint format. Demo and Title screens should feel like part of the same game's menu system.
- Added `data-testid="start-menu-{label}"` attributes for future QA test hooks
- Tuple type for two_dialogue_lines in sponsorConfig (Plan 01) is independent — StartMenu does NOT consume sponsor config; that's Phase 21's job

## Files changed

- `client/src/components/StartMenu.tsx` (new, 175 lines)

## Commit

- `3d0aaeb` — feat(18-02): add StartMenu component with three-mode selector

## Self-Check

- [x] Three buttons in correct order
- [x] Keyboard nav (Arrow / W-S / Enter / Space) wired
- [x] No game-state / Phaser / storage imports
- [x] Identity-aligned styling and copy
- [x] Atomic commit with explicit file list
- [x] Phase 16 in-flight files untouched
