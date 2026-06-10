---
phase: 25-dialogue-portraits
plan: 02
subsystem: ui
tags: [react, sprites, portraits, npc, dialogue, animation, css-crop]

# Dependency graph
requires:
  - phase: 25-dialogue-portraits
    plan: 01
    provides: getNPCPortraitPath resolver + all 26 NPC sprite fields in roomData.json
  - phase: 24-phi-sorter-format-shift
    provides: NPCReactionBubble CSS-crop pattern (64px precedent scaled to 96px here)

provides:
  - DialoguePortrait.tsx — framed 96px pixelated CSS-crop portrait with name plate and breathing-bob
  - BattleEncounterScreen uses real NPC spritesheet in dialogue header (NPCSprite SVG gone)
  - VIS-01 (no SVG placeholder anywhere), VIS-03 (breathing-bob animation)

affects:
  - Any future phase adding new NPCs to dialogue (portrait works automatically via getNPCPortraitPath)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS background-image crop at 3x scale (288x384 backgroundSize, 96x96 visible) for dialogue portraits"
    - "Portrait breathing-bob via @keyframes on crop layer only — frame stays rock-still"
    - "Inline <style> keyframe injection pattern (same as BattleEncounterScreen feedback-flash)"

key-files:
  created:
    - client/src/components/DialoguePortrait.tsx
  modified:
    - client/src/components/BattleEncounterScreen.tsx
    - client/src/phaser/SpriteFactory.ts
  deleted:
    - client/src/components/NPCSprite.tsx

key-decisions:
  - "96px crop at 3x scale: backgroundSize 288x384, backgroundPosition 0 0 — matches sheet geometry from Plan 01 header doc"
  - "breathing-bob on crop layer only (2px, 2.4s) — frame and name plate stay rock-still so bob reads as breath, not jitter"
  - "Name plate inside the portrait frame (not external span) — removed standalone npcName span from BattleEncounterScreen, no double-render"
  - "items-start on header flex (was items-center) — portrait is ~108px tall; TRUST meter stays top-aligned"
  - "flex-1 spacer div kept empty for layout continuity — TRUST meter positions correctly at far right"

requirements-completed: [VIS-01, VIS-03]

# Metrics
duration: 3min
completed: 2026-06-10
---

# Phase 25 Plan 02: DialoguePortrait Integration Summary

**96px breathing pixelated NPC portrait in dialogue overlay — NPCSprite SVG placeholder fully deleted, BattleEncounterScreen wired to real spritesheet crops via DialoguePortrait**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-10T06:41:52Z
- **Completed:** 2026-06-10T06:44:18Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 1 deleted, 1 updated)

## Accomplishments

- Created `DialoguePortrait.tsx`: framed 96px CSS-crop portrait (3x scale), name plate inside frame, `portrait-breathe` 2.4s keyframe on crop layer only, `data-testid="npc-battle-sprite"` preserved
- Swapped `NPCSprite` out of `BattleEncounterScreen.tsx`: import replaced, header block replaced with `<DialoguePortrait npcId npcName />`, standalone name span removed (name lives inside portrait plate), header flex changed to `items-start`
- Deleted `client/src/components/NPCSprite.tsx` via `git rm` — zero consumers confirmed before deletion
- Updated `SpriteFactory.ts` line-32 comment to reference the Phase 25 deletion (comment-only change)
- `npm run check` and `npm run build` both clean; GameContainer / UnifiedGamePage / ExplorationScene have zero diff

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DialoguePortrait component** - `40ecbd9` (feat)
2. **Task 2: Swap portrait into BattleEncounterScreen** - `ea3c678` (feat)
3. **Task 3: Delete NPCSprite.tsx + final regression sweep** - `3fe2dfb` (chore)

**Plan metadata:** (docs commit created below)

## Files Created/Modified/Deleted

- `client/src/components/DialoguePortrait.tsx` — New; 72 lines; framed portrait plate with 96px crop, name plate, breathing animation
- `client/src/components/BattleEncounterScreen.tsx` — Import swapped (NPCSprite→DialoguePortrait); header block condensed (-17 lines); all other JSX/handlers/testids unchanged
- `client/src/phaser/SpriteFactory.ts` — Comment update only (line 32); no code change
- `client/src/components/NPCSprite.tsx` — Deleted (436 lines removed)

## Decisions Made

- 96px at 3x scale: `backgroundSize: '288px 384px'` — matches the sheet geometry documented in Plan 01 `spriteAssetPaths.ts` header
- Breathing bob on crop layer only (not the outer frame) — frame and name plate stay rock-still; animation reads as idle breath, not jitter (Commandment 7: pacing is a wave)
- Name moved from external `<span>{npcName}</span>` into the portrait plate — single source, no duplication; Press Start 2P 7px gold, `wordBreak: break-word` for long titles
- `items-start` on header flex: portrait height is ~108px; `items-center` would have floated the TRUST meter awkwardly; top-aligned reads correctly for both portrait and meter

## Deviations from Plan

None — plan executed exactly as written.

## User Setup Required

None.

## Live Playthrough Script (from Task 3)

To verify the portrait in actual dialogue (30 seconds):

1. `npm run dev` → open `http://localhost:5173`
2. Start Full Game → walk to Reception
3. Approach Riley (receptionist) → trigger dialogue
4. Confirm: 96px breathing receptionist portrait with "Riley" name plate in the dialogue header; SVG circle icon gone
5. Navigate to ER (or another room) → talk to a nurse/doctor NPC
6. Confirm: different sheet resolves correctly (nurse/doctor portrait, correct name plate)
7. Check browser console: no `[DialoguePortrait] No sprite mapping` warnings for named NPCs

## Self-Check: PASSED

- `client/src/components/DialoguePortrait.tsx` — exists on disk (72 lines, created by Task 1)
- `client/src/components/NPCSprite.tsx` — deleted (confirmed via git rm in Task 3)
- `client/src/components/BattleEncounterScreen.tsx` — modified (DialoguePortrait import + render confirmed)
- Commits `40ecbd9`, `ea3c678`, `3fe2dfb` — all confirmed in git log

---
*Phase: 25-dialogue-portraits*
*Completed: 2026-06-10*
