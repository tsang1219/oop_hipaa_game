# Run Report — 04 Refactor Proposal (proposal half only)

**Branch:** `fable/refactor-proposal` · **Mode:** read-only for game code · **Date:** 2026-07-01/02

## What I did

- Read all four monster files end-to-end and mapped their internal regions with line
  numbers: `SpriteFactory.ts` (4,005), `ExplorationScene.ts` (3,379),
  `BreachDefenseScene.ts` (2,160), `UnifiedGamePage.tsx` (1,979).
- Traced the dependency edges that constrain the split: importers of each file, every
  EventBridge event each side listens to/emits (`EventBridge.ts` read in full), the Phaser
  registry keys (`encounterResult_*`), the scene sleep/wake choreography, and React's two
  reach-ins to Phaser (`getScene('Exploration').updateCompletionState` at
  `UnifiedGamePage.tsx:1233`, and `gameRef.current.scene.start(...)`).
- Wrote `.planning/REFACTOR_PROPOSAL.md`: full before/after module map (16 new modules),
  exact source line ranges per move, public interfaces, per-module risk notes, an
  "explicitly NOT moving" section for each file, a 7-round execution order with
  verification gates (tsc + build + `tests/loop4-capture.mjs` screenshot compare +
  progression suites), and a definition of done.
- **Changed zero lines of game code.** The only files written are the proposal and this
  report.

## Key discoveries about coupling

1. **SpriteFactory is a free win.** 5 exports, 2 importers (BootScene, ExplorationScene),
   and every one of ~85 texture blocks is independently guarded by
   `textures.exists(...)` with its own local Graphics object. It splits along existing
   block boundaries with essentially zero risk. The empty `phaser/sprites/` and
   `phaser/systems/` directories already exist as landing zones.
2. **ExplorationScene's weight is in `create()`** (lines 279–1895, ~1,620 lines), and most
   of that is *stateless rendering + ambience* off room data — extractable as free
   functions. The genuinely entangled parts (update loop, encounter sleep/wake lifecycle,
   movement/interaction core with its `paused`/`movePath`/`transitioning` flag web) are
   comparatively small and are flagged as not-to-move.
3. **The music system is the riskiest move.** It carries individually bug-fixed async
   guards (first-frame mute leak, orphan-track reclaim across scene restarts,
   shutdown-mid-crossfade) and exists in two near-duplicate copies (create() BGM at
   1775–1831 vs wake-restore at 2550–2582, differing only in fade duration 1800ms vs
   800ms). Flagged as Round 6 with an open question about whether to preserve both
   durations (proposal says yes).
4. **`transitioning` cannot move into a DoorSystem** — it also gates idle hints, QA
   navigation, and the locked-door recovery path. The proposal keeps it on the scene and
   moves only door-local state (`doorStates`, `doorVisuals`, `nearDoor`).
5. **BreachDefenseScene should NOT get a WaveSystem/CombatSystem split.** The simulation is
   an ECS-lite over three shared arrays; carving it up is a redesign. ~60% of the scene's
   bulk is fire-and-forget VFX and static grid drawing — extracting only those shrinks it
   from 2,160 to ~1,200 with low risk, and preserves the delicate standalone-pause vs
   encounter-auto-advance fork (lines 1484–1497) untouched.
6. **UnifiedGamePage contains two ready-made hooks.** Every standalone-TD effect is already
   self-gated on `pageMode !== 'tower-defense-standalone'`, and the encounter phase machine
   (idle → narrative-card → encounter/phi-sorter/breach-triage → debrief) only touches the
   outside world through `gameState.addScore`/`recordEncounterResult` and eventBridge. The
   door-graph functions (`computeDoorStates`, BFS `findFirstHopDoorId`) are pure and can
   move to `lib/` immediately.
7. **Screenshot verification needs tolerance.** Rooms have animated particles/patrol NPCs,
   so byte-identical PNGs are impossible even with no code change; the proposal specifies a
   perceptual diff (~2–3% pixel tolerance) plus structural eyeballing, with a Round-0
   baseline capture before anything moves.

## Open questions for you (mirrored in the proposal §8)

1. Directory layout: `phaser/systems/exploration|breach/` (uses the existing empty dirs) vs
   `scenes/exploration/` co-location?
2. Keep `SpriteFactory.ts` as a permanent thin barrel, or repoint the 2 importers and
   delete it at the end?
3. Keep or drop Round 7 (the React hook extractions — least mechanical, most state-timing
   risk)? Rounds 1–6 stand alone.
4. Music dedup: preserve both fade durations (strict behavior-preservation, proposal
   default) or unify?

## What I'd do next

On your approval: spin the execution run in a worktree, Round 0 baseline first, then
Rounds 1–7 in order, one commit + gate per round, per the protocol in
`.planning/REFACTOR_PROPOSAL.md` §5–6.
