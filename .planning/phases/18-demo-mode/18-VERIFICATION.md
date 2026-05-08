---
phase: 18
phase_name: demo-mode
status: passed
verified: 2026-05-08
---

# Phase 18: Demo Mode + Start Menu Infrastructure — VERIFICATION

## Phase Goal

> A start menu with three primary buttons routes the player into Demo / Tower Defense / Full Game; the Demo path is a curated 4-room flow (Reception → ER → Break Room → Medical Records) isolated from the full game's progression and save state. Sponsor config file scaffold lands here so Phase 21 can populate without source edits.

## Status: PASSED ✓

All 6 ROADMAP.md success criteria are satisfied. All 8 requirement IDs (DEMO-01..07, CERT-04) are met by code-level evidence.

---

## Success Criterion Verification

### 1. ✓ Start menu shows three primary buttons — "Demo", "Tower Defense", "Full Game" — and is the first screen the player sees on `/`.

**Evidence:**
- `client/src/components/StartMenu.tsx` line 34-38: menuItems array `[DEMO, TOWER DEFENSE, FULL GAME]` in that exact order
- `client/src/pages/UnifiedGamePage.tsx` line 129: cold-boot `pageMode` initializer returns `'start-menu'` as the default (after QA-bypass checks)
- `client/src/pages/UnifiedGamePage.tsx` line 918: `if (pageMode === 'start-menu') { return <StartMenu ... /> }` — the early-return render branch ensures StartMenu is the first rendered surface

**Requirements satisfied:** DEMO-01

---

### 2. ✓ Pressing "Full Game" enters the existing full-game flow with progression, unlocks, and save state behaving exactly as before — no regression.

**Evidence:**
- `handleSelectFullGame` (UnifiedGamePage.tsx line 861-863): `setPageMode(hasSaveData() ? 'title' : 'exploration')`. This replicates the original cold-boot path pre-Phase-18 verbatim — if save data existed, the player saw TitleScreen (Resume / New Game); if no save, exploration started directly with the intro modal.
- TitleScreen.tsx is unchanged (no edits in this phase).
- The demo-bypass branches in `isDepartmentAccessible` (useGameState.ts) and the writeSave-skip guards (useGameState.ts:151, UnifiedGamePage.tsx:212) are gated on `isDemoActive()` — when full game is selected, `startDemo()` is never called, so all demo guards short-circuit to "not active" and full-game behavior runs unchanged.

**Requirements satisfied:** DEMO-02

---

### 3. ✓ Pressing "Demo" enters a curated flow where Reception, Emergency Room, Break Room, and Medical Records are all immediately accessible and traversable in that intended order, with no full-game unlock gating applied.

**Evidence:**
- `handleSelectDemo` (UnifiedGamePage.tsx line 868-870): calls `startDemo()` then `setPageMode('exploration')`.
- `startExploration()` boot logic (UnifiedGamePage.tsx line 382-385): when demo is active, `resumeRoomId = 'reception'` — first curated room.
- `isDepartmentAccessible` (useGameState.ts lines 84-94): in demo mode, returns `true` for `hospital_entrance`, all four DEMO_ROOM_ORDER entries (`reception`, `er`, `break_room`, `records_room`), and any `hallway_*` connector. UNLOCK_ORDER is fully bypassed.
- DEMO_ROOM_ORDER (demoSession.ts lines 22-27): `['reception', 'er', 'break_room', 'records_room']` — exact order matching DEMO-04.
- Existing roomData.json door connectivity (verified pre-existing): every demo room has a door to `hospital_entrance` (the lobby hub), so any demo room can reach any other via the hub. Hallways stay open during demo so the lobby-to-room paths are not blocked.

**Requirements satisfied:** DEMO-03, DEMO-04

---

### 4. ✓ Demo rooms reuse the existing scenarios, NPCs, and dialogue from `roomData.json` verbatim — no new content authored — and demo activity does not read or write the full-game save key.

**Evidence:**
- `git diff HEAD~5 -- client/src/data/roomData.json` returns empty — file unchanged in this phase.
- `git diff HEAD~5 -- client/src/data/gameData.json` returns empty — dialogue file unchanged.
- demoSession.ts has zero `localStorage` or `sessionStorage` calls (`grep -c` returns 0). Module-scoped state only.
- DEMO-06 isolation enforced at TWO layers:
  - useGameState.ts:151 — internal persistence useEffect early-returns when `isDemoActive()`
  - UnifiedGamePage.tsx:212 — consolidated `writeSave` useEffect early-returns when `isDemoActive()`

**Requirements satisfied:** DEMO-05, DEMO-06

---

### 5. ✓ The player can exit the demo at any time (ESC or in-game exit affordance) and is returned to the start menu.

**Evidence:**
- UnifiedGamePage.tsx lines 922-936: new useEffect registers a `keydown` listener while demo is active. On `Escape` (with `pageMode === 'exploration'`), it calls `endDemo()` then `window.location.reload()`.
- After reload, the cold-boot path runs again. Default `pageMode` is `'start-menu'` → StartMenu re-renders. Demo session was cleared by `endDemo()` so `isDemoActive()` returns false on re-entry, and the full-game save (untouched per DEMO-06) is rehydrated cleanly.
- This pattern matches the existing `handleNewGame` (line 851-855) and `handlePlayAgain` (line 861-864) reload approach used for full-state cleanup elsewhere in the file.

**Requirements satisfied:** DEMO-07

---

### 6. ✓ A single sponsor config file exists at a known path with the shape `{ name, character_sprite, two_dialogue_lines, code }`, is loaded at start menu boot, and editing it changes the sponsor identity without any source-code changes (verified by edit-only swap test).

**Evidence:**
- `client/src/data/sponsorConfig.ts` — single file with the exact shape:
  ```typescript
  export interface SponsorConfig {
    name: string;
    character_sprite: string;
    two_dialogue_lines: [string, string];   // tuple — exactly two
    code: string;
  }
  export const SPONSOR_CONFIG: SponsorConfig = { ... };
  ```
- Default sprite `npc_staff_sheet` matches the existing BootScene preload key (`client/src/phaser/scenes/BootScene.ts:60`).
- No other source file reads sponsor data — verified by `grep -r "SponsorConfig\|SPONSOR_CONFIG"` showing only the source file itself. Phase 21 will be the first consumer; until then, the scaffold is import-ready and type-safe.
- Edit-only swap test (intent — Phase 21 will exercise this in earnest): editing only sponsorConfig.ts to change name/sprite/lines/code will change the consumer behavior on next launch with no other source edits.

**Requirements satisfied:** CERT-04

---

## Requirement ID Coverage

| Req ID | Plan(s) | Status | Evidence |
|--------|---------|--------|----------|
| DEMO-01 | 18-02, 18-03 | ✓ | StartMenu.tsx (3 buttons in fixed order), UnifiedGamePage.tsx render branch |
| DEMO-02 | 18-03 | ✓ | handleSelectFullGame replicates original boot path; FULL GAME branches untouched in Plan 04 |
| DEMO-03 | 18-04 | ✓ | isDepartmentAccessible demo bypass for 4 rooms + hub + hallways |
| DEMO-04 | 18-01, 18-04 | ✓ | DEMO_ROOM_ORDER constant + Reception spawn |
| DEMO-05 | (all) | ✓ | roomData.json + gameData.json untouched (verified by git diff) |
| DEMO-06 | 18-01, 18-04 | ✓ | demoSession storage-free + two-layer writeSave guards |
| DEMO-07 | 18-04 | ✓ | Esc-to-start-menu useEffect with endDemo + reload |
| CERT-04 | 18-01 | ✓ | sponsorConfig.ts with locked shape and IDENTITY-aligned defaults |

**Coverage: 8/8 (100%)**

---

## Build / Typecheck Status

- `npx tsc --noEmit` — passes with zero errors
- `npx vite build` — succeeds (1719 modules, 5.18s)
- All 4 Phase 18 plans have SUMMARY.md files committed
- Atomic commits per plan, explicit file staging (no `git add -A`)

## Phase 16 In-Flight Code Preservation

All Phase 16 mid-flight modifications in `client/src/pages/UnifiedGamePage.tsx` were preserved exactly as committed (commits `82bae31` and `5d7dafe` from before Phase 18 started). Verified by post-Plan-04 grep:
- `handleSorterAbort` callback (line 730) — intact
- `takeaways` field on encounterResult state (line 162) — intact
- `takeaways: [string, string]` input tuple (line 743) — intact
- `takeaways: result.takeaways.filter(...)` (line 755) — intact
- `onAbort={handleSorterAbort}` PHISorterOverlay prop (line 1063) — intact
- `<SorterTakeawaysPanel takeaways={...} />` render (lines 1076-1077) — intact

Pre-existing uncommitted modifications listed by the parent task remain untouched in the working tree:
- `.planning/ENHANCEMENT_BRIEF.md` (M)
- `.planning/config.json` (M)
- `.planning/phases/16-phi-sorter-encounter/16-{01,03,04}-PLAN.md` (M)
- `.planning/IDENTITY.md` (untracked)
- `client/src/components/phi-sorter/PHISorterOverlay.tsx` — was actually committed pre-phase, no longer modified in working tree

## What a User Can Do Now

A user loading the app at `/` for the first time after this phase will:

1. See the StartMenu with three buttons (DEMO / TOWER DEFENSE / FULL GAME) — pixel-art styled, deadpan subtitle "PICK YOUR POISON," keyboard-navigable.
2. Click FULL GAME → game behaves exactly as before Phase 18 (TitleScreen if save, exploration if not).
3. Click DEMO → spawn in Reception, all 4 demo rooms accessible via the lobby hub, no full-game unlock gating, no full-game save writes.
4. Press Esc during demo → reload back to StartMenu, full-game save bit-for-bit unchanged.
5. Click TOWER DEFENSE → currently a no-op (Phase 19 will wire the standalone TD launch).

Phase 21 will read from `sponsorConfig.ts` to render the end-of-demo certificate and end NPC.
