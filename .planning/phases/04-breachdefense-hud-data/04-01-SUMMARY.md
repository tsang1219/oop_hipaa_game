---
phase: 04-breachdefense-hud-data
plan: 01
subsystem: breach-defense-events
tags: [phaser, events, eventbridge, breach-defense, hud, data-flow]
dependency_graph:
  requires: []
  provides: [BREACH_WAVE_START event, enhanced BREACH_WAVE_COMPLETE, per-wave kill tracking, complete tutorialContent recaps]
  affects: [client/src/pages/BreachDefensePage.tsx]
tech_stack:
  added: []
  patterns: [EventBridge singleton, Phaser delayedCall for sequencing, Set-guarded once-per-wave emission]
key_files:
  created: []
  modified:
    - client/src/phaser/EventBridge.ts
    - client/src/phaser/scenes/BreachDefenseScene.ts
    - client/src/game/breach-defense/tutorialContent.ts
decisions:
  - "BREACH_WAVE_START emits wave data (name, intro, suggestedTowers, threats) on game start and each wave transition"
  - "shownWaveStartBanners Set guards BREACH_WAVE_START so it fires exactly once per wave"
  - "BREACH_TUTORIAL_TRIGGER delayed 3500ms via Phaser delayedCall so banner shows before modal"
  - "LAYERS and PASSWORDS added to tutorialContent.recaps to cover all 10 wave concepts"
metrics:
  duration: 2 min
  completed_date: "2026-03-01"
  tasks_completed: 2
  files_modified: 3
---

# Phase 4 Plan 01: BreachDefense HUD Data Events Summary

**One-liner:** BREACH_WAVE_START event wired with full wave data, BREACH_WAVE_COMPLETE enhanced with endMessage + per-wave stats, kill tracking added, and tutorialContent gaps (LAYERS, PASSWORDS) filled so all 10 waves have matching recap entries.

## What Was Built

### Task 1: BREACH_WAVE_START event, per-wave kill tracking, enhanced wave complete

**EventBridge.ts** — Added `BREACH_WAVE_START: 'breach:wave-start'` to the Phaser -> React section of BRIDGE_EVENTS. This is the event constant Plan 02 (HUD components) will subscribe to.

**BreachDefenseScene.ts** — Five coordinated changes:

1. **New class fields:** `shownWaveStartBanners = new Set<number>()` and `waveKillCount = 0`. Both reset in `init()` and `onRestart()`.

2. **onStartGame() — wave 1 emission:** Before the tutorial trigger, emits `BREACH_WAVE_START` with `{wave: 1, name, intro, suggestedTowers, threats}` from `WAVES[0]`. Guarded by `shownWaveStartBanners`.

3. **onStartGame() — tutorial delay:** The `BREACH_TUTORIAL_TRIGGER` for wave 1 is now wrapped in `this.time.delayedCall(3500, ...)` so the wave-start banner renders first. `gameState = 'PAUSED'` remains immediate.

4. **Wave complete block — enhanced emission:** `BREACH_WAVE_COMPLETE` now includes `endMessage: currentWaveData.endMessage` and `stats: {threatsStop: this.waveKillCount, threatsTotal: this.waveState.enemiesSpawned, towersActive: this.towers.length}`. `waveKillCount` resets to 0 immediately after.

5. **Wave complete block — next wave start + tutorial delay:** After `this.wave++`, emits `BREACH_WAVE_START` for the next wave (guarded by `shownWaveStartBanners`). The odd-wave `BREACH_TUTORIAL_TRIGGER` is wrapped in `this.time.delayedCall(3500, ...)`.

6. **Kill tracking:** `this.waveKillCount += deadEnemies.length` added before the dead enemy cleanup loop in Phase 6 of `update()`.

### Task 2: LAYERS and PASSWORDS recap entries

**tutorialContent.ts** — Added two recap entries between `PHYSICAL` and `ALLDEFENSE`:

- `LAYERS`: "Defense in Depth: Key Takeaway" — covers wave 8 (concept: LAYERS)
- `PASSWORDS`: "Strong Passwords: Key Takeaway" — covers wave 9 (concept: PASSWORDS)

Previously, `TUTORIAL_CONTENT.recaps["LAYERS"]` and `TUTORIAL_CONTENT.recaps["PASSWORDS"]` were `undefined`, causing RecapModal to return null for waves 8 and 9. Now all 7 unique concepts (PHISHING, PATCHING, INSIDER, PHYSICAL, LAYERS, PASSWORDS, ALLDEFENSE) have matching recap entries.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | a356c88 | feat(04-01): add BREACH_WAVE_START event, per-wave kill tracking, enhanced wave complete |
| Task 2 | 4b6a39f | feat(04-01): add LAYERS and PASSWORDS recap entries to tutorialContent |

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **shownWaveStartBanners guards BREACH_WAVE_START** — Using a separate Set from `shownWaveSplashes` keeps the banner guard and tutorial guard independent. The banner fires once; the tutorial fires once on odd waves only.

2. **3500ms delay via Phaser delayedCall** — Phaser's `this.time.delayedCall` fires reliably even while `gameState === 'PAUSED'` (Phaser time system is not halted by game-logic guards). This was the correct approach vs. `game.pause()`.

3. **waveKillCount accumulates in Phase 6 cleanup** — Counting dead enemies at the point of removal (after damage has been applied) guarantees accurate per-wave stats regardless of multi-frame kills.

## Self-Check

- [x] EventBridge.ts contains `BREACH_WAVE_START`
- [x] BreachDefenseScene.ts emits `BREACH_WAVE_START` (2 call sites, both guarded)
- [x] BREACH_WAVE_COMPLETE includes `endMessage` and `stats`
- [x] `waveKillCount` field added, incremented on kill, reset on wave complete/init/restart
- [x] `delayedCall(3500, ...)` guards tutorial triggers on both wave 1 start and wave transitions
- [x] tutorialContent.ts has LAYERS and PASSWORDS recaps
- [x] TypeScript compiles without errors (`npx tsc --noEmit` = clean)

## Self-Check: PASSED
