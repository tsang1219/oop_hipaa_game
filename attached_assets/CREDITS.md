# Asset Credits

## Audio

### Kenney — Impact Sounds (1.0)
- Author: Kenney (www.kenney.nl)
- License: CC0 1.0 (Creative Commons Zero) — https://creativecommons.org/publicdomain/zero/1.0/
- Source folder: `attached_assets/audio/kenney_impact-sounds/`
- Credit is not required under CC0; credited here per project policy.
- Wired (Run 12, 2026-08-22):
  - Footsteps by floor material — `footstep_concrete_000..004` (tile + lab floors),
    `footstep_wood_000..004` (hallway linoleum), `footstep_carpet_000..004` (carpet)
  - Wall bump — `impactSoft_medium_000..002`
  - Tower fire — `impactGeneric_light_000..002`; enemy hit — `impactPunch_medium_000..002`;
    base damage — `impactMetal_heavy_000`
  - Corkboard pin — `impactWood_light_000`; milestone bell — `impactBell_heavy_000`
  - (pre-existing) sorter stamp — `impactPlank_medium_000`

### Kenney — Interface Sounds (1.0)
- Author: Kenney (www.kenney.nl)
- License: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/
- Source folder: `attached_assets/audio/kenney_interface-sounds/`
- Wired (Run 12, 2026-08-22):
  - UI grammar — clicks `click_001..004`, hover `tick_004`, tick `tick_001`,
    confirm `confirmation_004`, back `back_001`, open `maximize_001/004`,
    close `minimize_001/004`, select `select_001..003`, error `error_005`,
    toggle `toggle_001`, score up `select_006`, score down `error_003`
  - Stingers — discovery `confirmation_002`, item-get `select_004`,
    act-change `bong_001`, secret-found `question_002`, wave clear `confirmation_003`,
    defeat `error_008`
  - World — door open `open_001..003`, door creak `open_004`, door locked `error_004`,
    examine `glass_001`, room enter `minimize_006`, tray drop `drop_001/002`,
    card flip `scroll_001`, glass `glass_002/003`, GERALD's paper-jam scratch `scratch_001`,
    threat-console switch `switch_001`
  - Tower defense — tower select `select_005`, invalid placement `error_006`,
    enemy spawn glitch `glitch_001/002`
  - Voice blips (sample mode, dev toggle) — `pluck_001/002`
  - Ambient one-shots — `tick_002`, `switch_006`, `scroll_004`, `glitch_003`,
    `click_004`, `switch_003`; fidget paper `scroll_003`, fidget mug clink (impact pack)
  - (pre-existing) sorter correct/wrong/paper — `confirmation_001`, `error_001`, `scroll_002`

### Synthesized at runtime (no files)
- Per-character dialogue voices (synth mode, default) and all room ambience beds
  (HVAC, monitor beeps, fridge hum, server fans/whine, fluorescent buzz, centrifuge,
  PA chime, cat purr) are generated with WebAudio oscillators/noise in
  `client/src/phaser/systems/exploration/audioMixer.ts` and `ambienceBeds.ts`.
  Nothing to credit; nothing to license.

### Music
- `music_hub.ogg`, `music_exploration.ogg`, `music_breach.ogg`, `music_demo_er.ogg`,
  `music_demo_records_room.ogg` — pre-existing project tracks (see earlier project history
  for provenance).
- `music_demo_break_room.ogg` was **removed 2026-08-22 (Run 12)**: it was byte-identical
  (md5 `5de47812768ef00da194e6c68f914f07`) to `music_exploration.ogg`. The break room now
  plays `music_hub` via the Run 12 seating plan in `MusicController.ts`.
- No new music was added in Run 12 (new tracks require a download the run could not
  authorise — the candidate CC0 packs are listed in `.planning/fable-runs/RUN_REPORT-12.md`).
