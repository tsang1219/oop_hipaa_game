# Run Report — 14: UI polish

**Branch:** `fable/ui-polish` (off `fable/art-substrate` @ `b7818fd` — the last *committed* art-substrate
state; the doors/§12-reslice follow-ups were still uncommitted in the other session's tree when this run
started, so they are not underneath me — see Caveats). `main` untouched.
**Mode:** own branch · **Checkpoints:** UI-02/03/04 built (LIGHT); UI-01 font and UI-05 title are
**taste-gated and provisional** — candidates are on the boards below, defaults are one line to flip.
**Proof environment:** everything proven against the running game (Chrome via Playwright,
`PW_CHANNEL=chrome`), on this branch's own dev server (`PORT=8090`; `PW_PORT` added to
`playwright.config.ts` so two checkouts can run side by side). Nothing is claimed from code.

---

## The ninety-second version

Open, in order:
- `screenshots/ui-polish/board-fonts.png` — the same live dialogue line in five body-font candidates (UI-01).
- `screenshots/ui-polish/nameplates-reception-naive.png` vs `nameplates-reception.png` — the
  "Front Desk Coordinator" plate, before/after, same build (UI-02).
- `screenshots/ui-polish/board-hud.png` — debug box → rounds clipboard (+ the ID-badge alternative) (UI-03).
- `screenshots/ui-polish/motion-feedback-open.png` / `-close.png` — 60fps film strips of a modal
  easing in and out instead of popping (UI-04).
- `screenshots/ui-polish/board-titles.png` — three tileset-derived title directions + the old starfield (UI-05).
- `screenshots/ui-polish/pause-menu.png` — the pause screen that didn't exist before this run (UI-05).

## Status against the targets

| ID | Requirement | Status |
|---|---|---|
| UI-01 | Press Start 2P only for headers/counters/short labels; readable pixel body font for prose | **Built, choice provisional.** `--font-body` = Pixel Operator (CC0, self-hosted); every >10-word block found in the sweep moved onto it. PS2P body prose remaining: none found (checked by grep + eyeball of every converted surface). |
| UI-02 | Nameplates never collide with props or each other; leader line when displaced | **Done.** Solver + per-frame separation; stress test: 7 rooms × 6 samples while NPCs wander — small-prop overlap 0, plate-vs-plate 0, transients 0. Reception's Coordinator plate fully legible. |
| UI-03 | HUD reads diegetic, survives a Steam screenshot | **Built (clipboard), alternative shown.** Rounds clipboard with inked checkboxes + CLEARED stamp. ID-badge direction mocked on the board if preferred. |
| UI-04 | Every overlay opens/closes with 150–200ms motion | **Done.** ~20 overlays through one primitive (`useOverlayMotion`): 180ms in / 150ms out. No modal pops. Input never gated (see below). |
| UI-05 | Title + pause match the art bar | **Built, direction provisional.** 3 title candidates from the real tileset render behind `?title=`; pause menu (net-new) shipped in the paper style. |

## UI-01 — the font

**What changed under the hood.** A previous run had already declared `--font-body: 'Pixelify Sans'`
and pointed the battle dialogue at it; this run (a) re-opened the *choice* with a proper comparison,
(b) swept everything else. The five candidates on `board-fonts.png` are rendered on the same live
Riley dialogue in Reception:

- **Pixel Operator (provisional default)** — CC0, self-hosted (`attached_assets/fonts/`, license
  file shipped, credited in CREDITS.md). Crispest at speech size, most words per line, reads like a
  classic bitmap UI face. My recommendation.
- **DotGothic16** (runner-up) — real JRPG-localization flavor, slightly busier, Google-hosted.
- **Pixelify Sans** (incumbent) — friendly and readable but rounder/more contemporary than SNES.
- **VT323** — DOS terminal, wrong era feel for dialogue.
- Press Start 2P body text is on the board as the "before" reference.

**To flip the choice:** one line in `client/src/index.css` (`--font-body`). Sizes were chosen for
Pixel Operator but DotGothic16/Pixelify render fine at the same sizes (both were checked at 19px on
the dialogue box).

**The sweep** (all >10-word prose out of 6–9px PS2P, onto `var(--font-body)` at 12–17px):
feedback modal helper + failure copy + textarea, TD onboarding steps, triage rule strip + ticker +
incident headlines + fact chips + follow-up prompts/options, TD result prose + tower descriptions,
certificate sponsor dialogue, codex slot names (6px → 12px), wave intro, choice-gate options.
Headers, buttons, counters, and the TRUST meter stay PS2P. One trap found: Pixel Operator's
slashed zero reads as an "8" below ~13px — so **counters stay Press Start 2P** (that's the
hierarchy anyway).

## UI-02 — nameplates

New system: `client/src/phaser/systems/exploration/nameplateLayout.ts` owns every plate.

- **Obstacles**: the art substrate's prop sprites (now tracked in `ArtHandle.colliders` — one
  array push in `artRenderer`, survives any future re-slice since rects come from live
  `getBounds()`), zone/item pickups (inflated for their bob), speech bubbles, boss tags, other
  plates, other NPC sprites.
- **Small vs large**: props under ~1.8 tiles² (stanchion, clipboard, IV pole, papers) are hard
  avoids — text over them garbles. Large flat faces (bench/counter/rack) are a soft last resort:
  a plate lying on one reads as a desk name tag, and in dense rooms (lab aisles, ER) that beats
  exiling the plate. The stress test gates on small-prop overlap and plate-clash only; residual
  large-face contact is reported (worst: lab, deliberately).
- **Walkers** (Run 12): plates follow sprites rigidly; the solve re-runs while moving (60ms
  throttle) with a continuity bias so targets stay near the current offset — short glides, no
  cross-room swings. A per-frame separation pass makes plate-on-plate impossible even mid-glide.
- **Leader line**: displacement ≥24px draws a 1px line from plate edge to the NPC's feet
  (depth 94, alpha-slaved to the proximity fade). Visible in `nameplates-it_office.png`
  ("Employee Needs Workaround", placed above-head over the racks).
- **Proof**: `tests/ui-nameplate-stress.mjs` — 7 NPC rooms × 6 samples (1.4s apart, NPCs
  wandering), readings must persist ≥120ms to count. Final run: **every room passes with
  small-overlap 0 / plate-clash 0 / transients 0**. The naive baseline (same build,
  `?qa-nameplates=naive`) measures the old placement: riley 190px² through the stanchion,
  ER frantic-family 2,547px², dr_martinez 3,426px² — the before/after pairs ship as
  `nameplates-{reception,er,break_room}-naive.png` vs `nameplates-<room>.png`.
- Also fixed on the way: live NPC completion now dims the plate (parity with reload), and the
  proximity reveal measures the walker's live tile, not its spawn tile.

## UI-03 — the HUD

`RoomProgressHUD` is now a **rounds clipboard**: board + metal clip + paper sheet, rows with pixel
checkboxes that ink green as you finish Staff / Look into / Study, counts in PS2P, and a crooked
green **CLEARED** stamp when the room completes. Same testids and data contract; the
hooks-after-early-return violation in the old component is fixed; lucide's smooth vector icons are
gone from the game screen. The pause menu and title variant C speak the same stationery language.

If you'd rather have the **ID badge on a lanyard** (mocked on `board-hud.png`), the component is
isolated — swapping the skin doesn't touch the data flow. My case for the clipboard: the HUD's
content *is* a checklist; the badge is identity, not progress.

## UI-04 — overlay motion

One primitive: `useOverlayMotion` (`client/src/hooks/useOverlayMotion.ts`) + six keyframes in
`index.css`. 180ms enter (scale+fade `pop`, slide `rise` for bottom sheets, `fade` for full-screen
surfaces), 150ms exit through `motion.close(cb)`.

Adopted by: educational item modal, codex, corkboard, feedback, patient story (backdrop finally
fades too), tutorial/help, choice gate, observation hint, request modal, sorter context card
(had *no* animation at all), narrative card, all three debriefs (their `duration-400` classes were
dead Tailwind — emitted nothing — now `duration-300`), follow-up panel (enter-only; parent owns its
unmount), wave banner (exit folded into its auto-dismiss), identifier banner (self-fade at end of
ttl), PHI sorter + breach triage full surfaces (fade in/out), pause menu. GameBanner,
NotificationToast and RoomIntroOverlay already animated both ways and were left alone.

**Input safety (the FEEL-23 constraint):**
- Enter animations are cosmetic — every component attaches its key handlers on mount, exactly as
  before; nothing waits for the animation.
- `motion.close()` is idempotent — mashing SPACE during the 150ms exit can't double-fire a close
  callback (this also fixed a real pre-existing hazard: ChoicePrompt could fire `onChoice` twice).
- ChoicePrompt's selection keys now arm only when its options are *visible* (250ms) — before this
  run a SPACE still buffered from dialogue could confirm an option the player never saw, at 50ms
  into an invisible card. Arrows work immediately; the gate is on commitment, not navigation.
- Exit delays are ≤150ms and only on paths that close an overlay the game was already paused
  behind.

**Proof**: `tests/ui-motion-capture.mjs` records CDP screencast (~60fps) and lays out labeled
frames: `motion-feedback-open.png`, `motion-feedback-close.png`, `motion-codex-open.png`,
`motion-codex-close.png` — the card is visibly mid-scale/mid-fade across multiple frames in every
strip; no hard cut.

## UI-05 — title + pause

**Title.** Three directions, all real tileset art, sharing the same menu skeleton/testids, behind
`?title=` (`board-titles.png`):
- **A — Night shift** *(provisional default)*: the actual hospital-lobby render (captured clean
  from the running game at 1×, `attached_assets/generated_images/privacyquest/title/`), graded to
  night, slow 26s pan, the two intake staff still at the desk. The game's first screen is now the
  game.
- **B — Cast lineup**: dark stage, stars, and the real character spritesheets idling in a row on a
  strip of the lobby floor. Most "Nintendo box art" of the three.
- **C — Corkboard**: the menu as pinned hospital paperwork — pushpins, taped title sheet. Matches
  the clipboard HUD + pause note stationery.
- `?title=classic` keeps the old starfield for comparison.

**Pause menu** (net-new — ESC previously did nothing in the full game): a taped paper "shift
break" note over the dimmed room. RESUME / HOW TO PLAY (reuses the help modal, stays frozen
across the hand-off) / QUIT TO MENU (reload → the save-aware start menu; full-game saves are
continuous so nothing is lost). Same pause/resume bridge contract as the codex. Demo ESC
(exit-demo, DEMO-07) and TD ESC are untouched. Keyboard: ↑↓/W-S, Enter/Space, ESC or click-out
resumes. `pause-menu.png` + verified live: scene `paused` true while open, false after.

## Proof suite

- `tests/progression/*.spec.ts` — **31 passed, 0 failed, 4 skipped** (5.3 min; the 4 are the
  pre-existing `breach-gameplay` `test.skip` group) — identical to the Run 11 baseline. One real
  bug was caught and fixed on the way: the first full run failed 7 tests on the
  zero-console-errors gate because the new clipboard HUD mixed `textDecoration` shorthand with
  `textDecorationColor` (React warns on every completing row). Longhand-only now; commit
  `b9e8dab`.
- `tests/art-substrate-proof.spec.ts` — **39/39** and `tests/living-world-feel.spec.ts` — **3/3**
  on this branch (3.9 min together): the nameplate/HUD work did not disturb the art substrate or
  the living-world checks.
- `tests/ui-nameplate-stress.mjs` — **7/7 rooms pass**: small-prop overlap 0, plate-vs-plate 0,
  transients 0, across 6 samples per room while NPCs wander (`nameplates-stress.json`).
- `npm run check` (tsc) clean. `npm run test:data` 26/26. `npm run test:unit` — the same 14
  pre-existing `saveData.test.ts` failures as the baseline (Node 26 `localStorage` vs jsdom;
  RUN_REPORT-11 §7), untouched.
- Every capture script reports `console clean` (page errors + console.error filtered the same
  way the art run did).
- Pause menu verified live: `__QA_SCENE__.paused` true while open, false after ESC; QUIT lands
  on the start menu in a real (non-QA-param) session.

## Files

New: `client/src/hooks/useOverlayMotion.ts`, `client/src/phaser/systems/exploration/nameplateLayout.ts`,
`client/src/components/PauseMenu.tsx`, `attached_assets/fonts/*` (CC0 + license),
`attached_assets/generated_images/privacyquest/title/*` (clean 1× plates),
`tests/ui-font-candidates.mjs`, `tests/ui-motion-capture.mjs`, `tests/ui-nameplate-stress.mjs`,
`tests/ui-options-board.mjs`.
Deleted: nothing (TitleScreen.tsx is dead code — zero imports — left in place to keep this run's
diff presentation-only; flag it for a cleanup run).

## Not done / for your eyes

- **UI-01 choice** — Pixel Operator is provisional; the board has all five candidates. Flip =
  one line in `index.css`.
- **UI-05 choice** — Night shift is the provisional default; B and C are live behind `?title=`.
  Once you pick, I (or the next run) delete the losers' code paths.
- **UI-03** — clipboard built; badge mocked. Say the word if you want the badge instead.
- Exit animations cover every player-triggered close path. A few parent-forced unmounts (e.g. an
  encounter surface swapped out by phase change on completion) still cut — masked in practice by
  the next surface's enter animation.
- The Run 12 room-name banner and door labels in the Phaser layer kept their existing type — they
  are short labels (PS2P is correct there per the hierarchy), but nobody has re-judged their sizes
  against the new art. Cheap follow-up.
- `AudioMixPanel` (footer, below the game box) untouched — it's outside the game frame.

## 2026-08-26 — the merge (everything-but-main, at your instruction)

The art session's finished-but-uncommitted follow-ups (RUN_REPORT-11 §11 doors, §12 re-slice,
§13 room-clean loop) and the humor session's dialogue/idle/whimsy rewrites were committed on
`fable/art-substrate` (`a88f0df` art, `a3658c7` content — messages carry the attribution and the
partition; only `package.json`/`server/index.ts` tailscale infra and `.planning/hermes|nightly-runs`
scratch remain uncommitted in the main tree). `fable/ui-polish` was then **rebased on top** — one
linear stack, `main` untouched.

The rebase auto-merged every shared file; the one real casualty was semantic, and the stress suite
caught it: §12 rebuilds desks/workstations from many individually-small sprites, so the solver's
per-sprite small/large call misread whole desks as garble hazards (it_office regressed to a 485px²
resting overlap). Fix: `placeProp` stamps each part with its obstacle footprint
(`npFootprintTiles`); parts of ≥2-tile obstacles are large flat surfaces. Stress suite **7/7 rooms
clean on the merged art**; tsc clean. Full-battery results on the combined branch (one run, 11.0 min): **87 passed / 0 failed /
4 skipped** — art-substrate-proof 53/53, living-world-feel 3/3, progression 31 + the 4
pre-existing `breach-gameplay` skips.
Key screenshots re-captured on the clean rooms (the earlier `nameplates-*` shots show pre-§12
furniture; the re-captures replace them).

## Caveats

- **Base**: this branch forked from `b7818fd`. The art session's tileset doors + object re-slice
  (§11/§12 of RUN_REPORT-11) were uncommitted in its tree at fork time, so my room screenshots
  show the pre-door art. Merge risk when it lands: my Phaser touch-points are small and mostly
  additive (`artRenderer` collider array, factory greedy-pass deletion, one `npcLife` line,
  scene wiring); `nameplateLayout` reads prop rects at runtime, so re-sliced art changes nothing
  for it. The one real overlap is `interactableFactory.ts` if the other session touched the same
  regions.
- The nameplate stress gate counts a reading only if it persists ≥120ms (two samples); sub-120ms
  brushes while a walker drags its plate are below perception and reported separately (final run:
  zero anyway).
- `npm run test:unit` has 14 pre-existing failures in `saveData.test.ts` (Node 26's experimental
  `localStorage` shadows jsdom's) — documented as pre-existing in RUN_REPORT-11 §7, untouched here.
