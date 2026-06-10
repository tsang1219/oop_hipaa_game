---
phase: 27-navigation-clarity
plan: 02
subsystem: ui
tags: [phaser, react, vfx, sfx, feedback, completion-visuals, audio-ux]

requires:
  - phase: 27-01
    provides: zoneGlows map foundation, idle-hint sparkle system, 'next' door aura — VIS-07 baseline

provides:
  - zoneGlows registry in ExplorationScene — stores each zone's glow ring+tween for live kill on completion
  - addCompletionCheck() shared helper — identical mark at render-time (pop=false) and live-time (pop=true, Back.easeOut)
  - updateCompletionState() rewritten — diffs prev sets to detect new completions, animates live zone glow fade + NPC sprite fade + checkmark pop-in
  - BattleEncounterScreen correct/incorrect SFX swapped to sfx_sorter_correct / sfx_sorter_wrong
  - Feedback audit table (Phase 27 success criterion 3)

affects:
  - Any future phase touching dialogue answer feedback SFX
  - Any future phase touching zone or NPC completion state in ExplorationScene

tech-stack:
  added: []
  patterns:
    - "Zone glow registry: render-time stores ring+tween in Map, updateCompletionState diffs prev sets and kills live"
    - "Shared completion checkmark helper: pop=false at load, pop=true on live event (Commandment 6)"
    - "Completion SFX hierarchy: zone tick (0.25) < NPC banner moment < room fanfare (0.9) — Commandment 8"

key-files:
  created: []
  modified:
    - client/src/phaser/scenes/ExplorationScene.ts
    - client/src/components/BattleEncounterScreen.tsx

key-decisions:
  - "Zone completion tick uses sfx_sorter_correct at volume 0.25/rate 1.1 — distinct from NPC banner (0.5), below room fanfare (0.9); quiet tick proportional to moment size (Commandment 8)"
  - "NPC tint stays immediate under the 400ms alpha fade — tint is subtle and correct; separate tween only on alpha"
  - "Checkmark fontSize 7px for both zones and NPCs (previously NPCs had 8px inline) — harmonized via shared helper; delta is imperceptible at this pixel size"
  - "Encounter return has no dedicated SFX by design — intentional release beat (silence after tension, Commandment 7)"

patterns-established:
  - "Live-vs-render parity: render-time uses pop=false, live completion uses pop=true on same shared helper"
  - "Set diffing pattern: updateCompletionState maintains prevCompleted* sets, diffs on each call, only animates truly new IDs"

requirements-completed: [VIS-08]

duration: 4min
completed: 2026-06-10
---

# Phase 27 Plan 02: Feedback Audit + Proportional SFX Summary

**Zone glow registry (live ring fade+checkmark pop on completion), NPC sprite fade parity, and wrong-answer SFX swap from breach-alert honk to soft sorter thud — Commandment 1 and 8 gaps closed**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-10T07:47:47Z
- **Completed:** 2026-06-10T07:51:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Zone glow registry: each incomplete zone's ring arc + tween stored in `zoneGlows` Map at render; `updateCompletionState` kills and fades the ring live when a zone is completed mid-session
- Live checkmark pop-in on both zone and NPC completion (Back.easeOut, 250ms scale 0→1) — Zelda item-get moment for learning milestones (Commandment 6)
- NPC fade parity: `updateCompletionState` now fades alpha 0.4 over 400ms (Sine.easeOut) instead of snapping; both paths (reload + live) produce identical final visual via shared `addCompletionCheck()` helper
- SFX swap: BattleEncounterScreen correct→sfx_sorter_correct 0.45, incorrect→sfx_sorter_wrong 0.35 — purpose-fit chime and soft thud replace repurposed tower_place and jarring breach-alert horn

## Task Commits

1. **Task 1: Live completion visuals — zone glow registry + checkmark pop-in + NPC fade parity** - `23abc28` (feat)
2. **Task 2: Proportional answer SFX + audit table + regression gate** - `3de52b7` (fix)

## Files Created/Modified

- `client/src/phaser/scenes/ExplorationScene.ts` — zoneGlows Map, prevCompletedNPCs/Zones, init() clear, render-loop glowTween stored, addCompletionCheck() helper, updateCompletionState() full rewrite with diff+animate
- `client/src/components/BattleEncounterScreen.tsx` — correct SFX → sfx_sorter_correct 0.45, incorrect SFX → sfx_sorter_wrong 0.35, Phase 27 VIS-08 comments

## Decisions Made

- **Zone completion tick is sfx_sorter_correct at 0.25/rate 1.1**: The sorter chime re-pitched slightly higher reads as a "ding" rather than the fuller confirmation of an NPC completion. Quiet by design — Commandment 8 proportionality: zone < NPC < room.
- **NPC tint stays immediate**: `setTint(0x888888)` fires before the alpha fade begins. The tint shift is subtle under the fade and immediately signals "interacted" state without competing with the fade animation.
- **Shared `addCompletionCheck()` helper**: Eliminates the dual inline blocks that previously had slightly different font sizes (7px zones vs 8px NPCs). Harmonized to 7px. The 1px difference was imperceptible at 32px tile scale.

## Feedback Audit

Phase 27 success criterion 3: every exploration-mode player action with its audio and visual response.

| # | Action | Audio | Visual | Status |
|---|--------|-------|--------|--------|
| 1 | Walk (keyboard) | sfx_footstep 0.25, 350ms throttle | dust puff particles | OK |
| 2 | Click-to-move step | sfx_footstep 0.25 | walk anim + dust puff | OK |
| 3 | NPC talk start | sfx_interact 0.55 | dim overlay + first-time sparkle flash | OK |
| 4 | Zone examine start | sfx_interact 0.55 | dim overlay | OK |
| 5 | Item collect | sfx_interact 0.4 (via UnifiedGamePage ~762) | gold camera flash + 8 gold particles | OK |
| 6 | Hallway board read | sfx_interact 0.55 | subtle white camera flash (150ms) | OK |
| 7 | Answer correct | sfx_sorter_correct 0.45 | green tint overlay (400ms fade) + 10 particles + zoom pulse | FIXED in 27-02 (was sfx_tower_place 0.55) |
| 8 | Answer incorrect | sfx_sorter_wrong 0.35 | red tint overlay (350ms fade) + 200ms camera shake | FIXED in 27-02 (was sfx_breach_alert 0.45 — the honk) |
| 9 | NPC completion tick | sfx_interact 0.5 + completion banner (UnifiedGamePage) | sprite alpha 0.4 fade (400ms) + green checkmark pop-in (Back.easeOut) | FIXED in 27-02 (was alpha/tint snap, no live checkmark) |
| 10 | Zone completion tick | sfx_sorter_correct 0.25/rate 1.1 | blue glow ring fades (300ms) + green checkmark pop-in | FIXED in 27-02 (was nothing until room reload) |
| 11 | Room complete | sfx_fanfare 0.9 | gold camera flash + 30-particle burst | OK |
| 12 | Door enter | sfx_footstep 0.35 rate 0.8 | 300ms camera fade out | OK |
| 13 | Locked door bump | sfx_breach_alert 0.25 | red camera flash + 200ms fadeIn | OK (Phase 20 FIX-03 already proportioned) |
| 14 | Encounter enter (TD) | sfx_breach_alert 0.35 | 300ms camera shake + narrative card | OK (Phase 20 FIX-03 vol drop) |
| 15 | Encounter return | none (by design) | 400ms fadeIn + music restore | by-design-silent (intentional release beat, Commandment 7) |
| 16 | Idle hint sparkle (27-01) | none (by design) | 3-particle shimmer on un-met objective, 9s grace, 5s interval | by-design-silent (ambient cue, not a reward event) |
| 17 | 'next' door aura (27-01) | none (by design) | breathing warm-gold ADD blend aura (scale 5→7, alpha 0.22→0.45, 1600ms) + gold stroke ring | by-design-silent (ambient wayfinding, no action to reward) |

**Summary of fixes:** Rows 7-10 had gaps. 7 and 8 (answer SFX) fixed in Task 2. 9 (NPC live completion) and 10 (zone live completion) fixed in Task 1. All 17 rows now either OK, by-design-silent, or FIXED in this plan.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `for (const id of Set)` triggered TS2802 error (downlevelIteration) — fixed with `Array.from(set)` before the for-of loop. Applies to both newZones and newNPCs iterations.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- VIS-08 implemented: feedback audit table in SUMMARY, all exploration-mode player actions have proportional dual-channel feedback
- Phase 27 criteria 3 and 4 both met (audit table + no new modals + tsc/build clean)
- Manual spot-check deferred to user: complete sign-in sheet zone in Reception → blue ring should fade, green checkmark should pop-in; answer dialogue wrong → soft thud, no horn; NPC completion → smooth fade not snap
- Phase 27 is now complete (2 plans, both summarized)

---
*Phase: 27-navigation-clarity*
*Completed: 2026-06-10*

## Self-Check: PASSED

- FOUND: .planning/phases/27-navigation-clarity/27-02-SUMMARY.md
- FOUND: client/src/phaser/scenes/ExplorationScene.ts
- FOUND: client/src/components/BattleEncounterScreen.tsx
- Commits verified: 23abc28 (Task 1), 3de52b7 (Task 2)
