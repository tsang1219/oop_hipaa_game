# Run Report — 12: The living world (animation + sound)

**Branch:** `fable/living-world` (off `main` @ `bf41878`) · **Mode:** own branch, never touched `main`.
**Provenance:** started from the prior WIP checkpoint of this run (`worktree-agent-a5db6ba345ca32ee1` @ `0e8bf8e`,
"checkpoint before debugging") — cherry-picked minus its accidental 484-line `package-lock.json` churn, then
its three weak parts were rebuilt (blink, wander, ambience) and the rest extended. No Run 11 branch existed
(`fable/art-substrate` is not in this clone), so the BootScene sequencing conflict never arose.
**Proof environment:** everything below was proven against the running game in Google Chrome driven by
Playwright (`PW_CHANNEL=chrome`). See *Caveats* for why not the in-app browser pane.

---

## The one-paragraph version

Nobody in this game is a statue any more. Every character — NPCs, the player, the dialogue portrait — blinks
from a closed-eye copy of its **own** sheet generated at boot from its own pixels. NPCs walk short BFS
patrols inside a per-character radius, reserve tiles so they never overlap, stop the instant a dialogue
opens, and turn to look at you when you walk up. They check charts, sip coffee, scroll their phones, yawn,
shift their weight. Doors crack ajar as you approach and swing open before the fade. The audio went from
11 wired sounds to **96 keys** through a real four-bus mixer with cooldowns and round-robin on every site,
synthesized per-character voices keyed to signature colour, synthesized room beds under the music, a music
seating plan that never repeats the track you just left, and a soft physical response (3-frame hit-stop +
squash) on every SPACE. Frames, stills, an audio log and the motion numbers are in `screenshots/living-world/`.

## Status against the brief's targets

| ID | Requirement | Status | Where |
|---|---|---|---|
| ANIM-01 | Every character blinks, 3–6s randomized, per-character phase | **Done** — real closed-eye frames, 2.8–6.5s, 12% double-blinks; NPCs, player, portraits | `blinkFrames.ts`, `npcLife.ts`, `DialoguePortrait.tsx` |
| ANIM-02 | NPCs actually walk (closes SPRITE-002) | **Done** — BFS patrols, radius 1–3 per character, dwell/return-home, pause-aware | `npcLife.ts` |
| ANIM-03 | Turn to face the player within ~2 tiles, hold through conversation | **Done** (Playwright: walk left/right of Riley → `facing` flips) | `npcLife.ts` |
| ANIM-04 | Role fidgets, ≥2 per role | **Done** — 11 fidget kinds, 2–4 per sheet, per-character overrides | `npcLife.ts` |
| ANIM-05 | ≥3 independently moving things per room, ≥1 non-character | **Done** — measured 7.6–10.1 moving regions/frame (min 4–5) over 10s in 3 rooms | `screenshots/living-world/*-motion.json` |
| ANIM-06 | Player weight: accel/decel/turn frame, footsteps on contact frame | **Done** — accel ramp + pivot frame (from WIP, kept), steps now fire on walk-cycle frames 2 & 3 | `ExplorationScene.ts` |
| ANIM-07 | Doors open before transit; curtains sway; vending hums/shudders | **Done** — per-door leaf (ajar on approach, swing on entry), cloth sway, vending shudder | `DoorSystem.ts`, `roomAmbience.ts` |
| ANIM-08 | Talking animation while text types | **Done** — portrait talk-bob while typing, stops on the last glyph, and the portrait blinks | `DialoguePortrait.tsx`, `BattleEncounterScreen.tsx` |
| AUD-01 | 8–10 unique tracks + stingers; kill the duplicate | **Partial** — duplicate killed, seating plan so no content room repeats the track you just left, 7-stinger set; **no new music files** (download needs your OK — list below) | `MusicController.ts`, `CREDITS.md` |
| AUD-02 | 50+ wired SFX keys, no silent interaction | **Done** — 96 loaded keys, all played; 0 loaded-but-unused, 0 played-but-missing (`node scripts/audio-map.mjs`) | everywhere |
| AUD-03 | Footsteps by material + gait, 3+ round-robin | **Done** — 4 families (tile / lino / carpet / lab), 5 variants each, shuffled-bag so no repeat; walk vs run rate/volume | `footsteps.ts` |
| AUD-04 | Per-character voice blips keyed to signature colour | **Done** — synth (hue→pitch, saturation→waveform, lightness→length) with the sampled version behind a toggle | `audioMixer.ts`, `voicePitch.ts` |
| AUD-05 | Real mixer: buses, ducking, persisted prefs | **Done** — music/sfx/voice/ambience buses, music + bed duck under dialogue, sliders persist (localStorage) | `audioMixer.ts`, `AudioMixPanel.tsx` |
| AUD-06 | Ambient room beds under the music | **Done** — synthesized WebAudio beds for all 13 rooms through Phaser's master mute | `ambienceBeds.ts` |
| AUD-07 | Stinger set, distinct + consistent | **Done** — discovery / item-get / correct / wrong / room-clear / act-change / secret-found | `audioMixer.ts` `STINGERS` |
| FEEL-20 | Hit-stop + squash on every interaction | **Done** — real 50ms world freeze + per-target squash style (npc hop / item pop / zone jiggle / console thunk) + player lean | `feel.ts` |
| FEEL-21 | Typewriter w/ blips, punctuation pauses, second press = reveal | **Done** — 16ms/glyph base, `,`110 `.`240 `—`180; SPACE reveals the line and the label says so | `BattleEncounterScreen.tsx` |
| FEEL-22 | Camera lookahead | **N/A** — no room is larger than the 640×480 viewport, so the camera never follows; nothing to lead. Left untouched. | — |
| FEEL-23 | Input buffer + grace radius | **Done** — 120ms buffer (WIP, kept) + 160ms grace on the last in-range target | `ExplorationScene.ts` |
| FEEL-24 | Anticipation beats on big reveals | **Done** — room-clear, act-change, TD victory now share `anticipationBeat()`; the certificate already had its own 400+500ms beat | `feel.ts`, `celebrationVfx.ts` |

## Prove it

### ANIM acceptance — 10 seconds, nobody touching the controls
`PW_CHANNEL=chrome npx playwright test tests/living-world-proof.spec.ts` boots a room, parks the mouse
off-canvas, and takes 40 frames at 250ms. A pixel-diff between consecutive frames is clustered into 16px
regions; the game's own per-NPC counters are read before and after.

| Room | moving regions / frame (avg · min) | frames with motion | NPC blinks / fidgets / walks in 10s |
|---|---|---|---|
| break_room | **10.1 · 5** | 39/39 | gossiping 2/1/1 · friend 2/1/3 · tired 2/0/1 · HR 1/1/1 · selfie 2/1/2 (all five left their tile) |
| reception | **8.6 · 4** | 39/39 | Riley 3/1/— (desk-bound) · nervous patient 1/0/2 · chatty visitor 2/1/1 |
| er | **7.6 · 5** | 39/39 | Martinez 3/1/1 · officer 2/1/1 · frantic family 3/1/2 |

Artifacts: `screenshots/living-world/contact-sheet.png` (every 4th frame of all three rooms on one page),
`screenshots/living-world/break_room/frame_00..39.png` (the full committed sequence; reception/er sequences
regenerate from the spec), `*-motion.json` (per-frame cluster counts). No `.webm`: Playwright's video
recorder needs its bundled ffmpeg, which this machine doesn't have.

### Stills (`screenshots/living-world/feel/`)
- `blink-frames-magnified.png` — every sheet's open frame next to its generated closed-eye frame, all three facings. This is the ANIM-01 art, and it is the most convincing single image of the run.
- `npc-before-space.png` / `npc-squash-70ms.png` / `npc-squash-250ms.png` — Riley at rest, mid hit-stop, settling.
- `door-closed.png` / `door-ajar.png` / `door-open-140ms.png` — the reception→lobby leaf closed, cracked as you approach, swinging as you go through.

### Audio map — proven, not read
The mixer logs every play to `window.__QA__.audioLog`. The AUD test drives the game and asserts the log:
walking in reception → `sfx_step_concrete_*` with no two consecutive variants equal; SPACE on Riley →
`sfx_interact` + `sfx_stinger_discovery` + `voice:synth:…` syllables; the lobby door → `sfx_door_open_*` +
`sfx_room_enter`; the hallway → `sfx_step_wood_*` and its own bed; the break room → `sfx_step_carpet_*` and
the `fridge` layer. A sample log is written to `screenshots/living-world/audio-log-sample.json`.

### Playwright + console
All runs in headless Google Chrome via Playwright (`PW_CHANNEL=chrome npx playwright test …`), against the
dev server, 2026-08-22:

| Suite | Result |
|---|---|
| `tests/progression/*` (door unlocks, full playthrough, NPC interaction, room completion, room navigation) + `visual-qa` + `visual-hallways` + `encounter-flow-review` | **45 passed, 0 failed**, 7 skipped (the pre-existing `test.skip` BreachDefense-standalone cases), every "no console errors" assertion green |
| `tests/living-world-proof.spec.ts` — 3× ANIM 10s rooms, ANIM-02 walk, ANIM-03 face, AUD audio map, FEEL-21 typewriter, contact sheet | **all passed** (AUD re-run after fixing its own break-room walk target) |
| `tests/living-world-feel.spec.ts` — squash/door stills, blink catch, magnified blink frames | **all passed** |
| `tests/living-world-perf.spec.ts` — FEEL-27 frame timing through a full TD wave | **passed** — 1,985 rAF frames sampled from the prep countdown through wave 1 (→ wave 2, score 80, 2 towers): **p50 16.7 ms · p95 16.8 · p99 16.8 · max 16.8 · 0 frames over 33 ms** — i.e. vsync-locked 60 Hz with every new system live (`screenshots/living-world/td-frame-timing.json`) |
| `npm run check` (tsc, strict) | clean |

Boot time (Chrome, dev server): **578–772 ms** to the Exploration scene. The 40 rarer sounds load in a
second pass (`DeferredAudioScene`) that runs alongside the lobby instead of in front of it.

---

## The audio map: every interaction → the sound it plays

**Exploration (Phaser)**
| Interaction | Sound |
|---|---|
| Walk / run (keyboard) | footstep family per room, fired on walk-cycle contact frames 2 & 3: tile `sfx_step_concrete_0-4` (lobby, reception, ER), lino `sfx_step_wood_0-4` @1.18× (hallways), carpet `sfx_step_carpet_0-4` (break room, records, IT, closet), lab `sfx_step_concrete_0-4` @1.22×; running +12% rate, +30% volume |
| Click-to-move | same family, one step per tile |
| Run into a wall | `sfx_wall_bump_0-2` + 1px recoil (fresh contact only; sliding along a wall is silent) |
| Approach a door (1.5 tiles) | `sfx_door_creak`, leaf cracks ajar; walks away → leaf closes silently |
| Go through a door | `sfx_door_open_0-2` + leaf swing, then fade; new room → `sfx_room_enter` whoosh |
| Locked door | `sfx_door_locked` + red flash (was the breach-alert horn) |
| Hidden door, first time | `sfx_stinger_secret` |
| SPACE on an NPC | `sfx_interact` + hit-stop/hop; first meeting adds `sfx_stinger_discovery`; music + bed duck to 45% |
| Dialogue typing | per-character voice syllables (`voice:synth:<wave>@<Hz>`), portrait bobs + blinks |
| SPACE on a zone / hallway board | `sfx_interact` + `sfx_zone_examine` + jiggle |
| SPACE on an item | `sfx_interact` + pop; on collection `sfx_stinger_itemget` |
| Threat console | `sfx_switch` + the existing `sfx_breach_alert` + shake |
| GERALD | paper `sfx_sorter_paper` · jam `sfx_scratch` · payoff whir → `sfx_fanfare` + flash · after-lines `sfx_interact` low |
| Mr. Whiskers | `sfx_interact` @0.55 rate + squish + hearts; 10th pet `sfx_fanfare` |
| Zz Test / flavour objects / eavesdrop bubbles | `sfx_interact` variants (existing) |
| Room cleared | dim → 380ms → flash + particles + `sfx_fanfare` |
| Act change | dim → `sfx_stinger_actchange` under the music crossfade |
| Trust +/− | `sfx_score_up` / `sfx_score_down` (was interact / breach horn) · milestones `sfx_bell` |
| NPC fidgets | chart `sfx_fidget_paper` · sip `sfx_fidget_mug` · typing `sfx_ui_tick` ×2 |
| Room beds (continuous, synthesized) | lobby/reception HVAC + PA chime · ER monitor beep + HVAC · lab centrifuge + fume hood · records fluorescent buzz + HVAC · IT server fans + whine + LED ticks · break room fridge compressor · hallways HVAC · supply closet **cat purr** |
| Room one-shots (timers) | ER `sfx_ambient_er_beep` · lobby chatter `sfx_ambient_lobby_chatter` + distant door `sfx_door_open_1` · break `sfx_ambient_breakroom_hum`, microwave `sfx_interact`, vending `sfx_vending_hum` · records `sfx_ambient_records_paper` · lab bubble `sfx_interact` · IT `sfx_ambient_it_whine` |

**React UI**
| Interaction | Sound |
|---|---|
| Any button click (delegated, app-wide) | `sfx_ui_click_0-3`; hover `sfx_ui_hover` (very quiet); disabled `sfx_ui_error` |
| Overlay open / close (item modal, codex, corkboard, feedback, narrative card, debriefs, request modal, sorter context, triage debrief, tutorial) | `sfx_ui_open_0-1` / `sfx_ui_close_0-1` |
| Dialogue choice (click or 1–4) | `sfx_ui_select_0-2`; CONTINUE → click |
| Answer feedback | correct `sfx_sorter_correct` · wrong `sfx_sorter_wrong` · partial `sfx_interact` |
| Tutorial / onboarding "got it" | `sfx_ui_confirm` |
| Patient story reveal | `sfx_bell` (was a wave siren) |
| Certificate | its existing 400ms dim → 500ms silence → `sfx_fanfare` |
| Mixer sliders | `sfx_ui_toggle` / `sfx_ui_select` on release |
| PHI Sorter | paper slide, stamp, correct/wrong, shift-end fanfare (existing, now through the bus) |
| Breach Triage | card pick `sfx_card_flip`; correct/wrong/alerts/fanfare (existing) |
| Corkboard | note pull `sfx_pin`; correct/wrong; completion fanfare |
| Title / start / character select / end screen | their existing cues + the delegated click grammar |

**BreachDefense (Phaser)**
| Interaction | Sound |
|---|---|
| Select tower | `sfx_tower_select` · place `sfx_tower_place` · refused (budget/path/occupied/locked) `sfx_tower_invalid` |
| Tower fires | `sfx_tower_fire_0-2` (70ms cooldown) · projectile hit `sfx_enemy_hit_0-2` (60ms) · kill `sfx_enemy_death` |
| Enemy spawns | `sfx_glitch_0-1` |
| Prep countdown last 3s | `sfx_ui_tick` · wave start `sfx_wave_start` · wave cleared `sfx_wave_clear` |
| Breach | `sfx_breach_alert` + `sfx_base_damage` · victory dim → `sfx_fanfare` · defeat `sfx_defeat` |

**Deliberate silences** (not blanks): idle-hint sparkles, name-plate reveal, camera push-in, the room-intro
title card opening (the room-enter whoosh covers it), NPC wander steps (96 px/s strolls would be a constant
patter under the music).

The key-level table (96 keys → file → call sites) is generated by `node scripts/audio-map.mjs`; it reports
*loaded but never played: none · played but never loaded: none*.

---

### Animation inventory per NPC role

Every NPC in every room gets, automatically: a **real blink** (texture swap to a closed-eye copy of its
own sheet; 2.8–6.5s randomized, per-NPC phase offset, 12% double-blinks, keeps blinking during dialogue),
**turn-to-face** the player within 2.25 tiles (returns to facing down 1.5–3s after you leave), and the
existing breathing tween. On top of that:

| Sheet / role | Idle fidgets (≥2, round-robin, 7–14s apart) | Wander |
|---|---|---|
| receptionist (Riley ×2, Records Clerk) | type at the desk (rapid bob + 2 key ticks) · look around · check chart | **none** — desk-bound by fiction |
| nurse | check chart (clipboard floats up, reading nod, paper rustle) · shift weight · look around | radius 2, stroll |
| doctor (Dr. Martinez, researcher) | check chart · look around · tap foot | Martinez: radius 3 at 118 px/s (he's *rushed*); researcher: radius 2 |
| it_tech (lab tech, security analyst) | sip coffee (mug rises, tilts, soft clink) · stretch · type | analyst: **stationary** at the monitors; lab tech: radius 1 |
| officer | tap clipboard (chart icon) · shift weight · look around | radius 2, slow (60 px/s) |
| boss (HR director, CCO, Tovar, Priya) | nod · look around · shift weight (HR director: sip, nod, look) | HR director radius 2; **final bosses and encounter NPCs never wander** |
| staff (gossiping coworker, friend, Marcus, workaround employee, Aiyana) | stretch · look around · shift weight · check phone | radius 1–2; Marcus/Aiyana (encounter triggers) never wander |
| patient (nervous patient, patient request, tired employee) | shift weight · sigh · tap foot (tired employee: yawn with a floating "z", sigh, shift) | radius 1, slow (44–56 px/s) |
| visitor (chatty visitor, courier, vendor, selfie coworker, frantic family) | check phone (screen pulses) · look around · shift weight | courier radius 3 @ 96 px/s; frantic family 104 px/s; others radius 2 |
| lawyer (Nate) | shift weight · nod · check chart | radius 2 |

Per-character overrides (`NPC_FIDGETS` / `WANDER` in `npcLife.ts`): tired_employee yawns, selfie_coworker is
on the phone twice as often, security_analyst types, records_clerk types, frantic_family checks the phone,
hr_director sips coffee, courier is always on the move.

Wander rules that protect interaction: BFS inside the NPC's radius only; other NPCs' home tiles, item/zone/
door/spawn tiles, the player's tile and its neighbours are never targets; two NPCs never reserve the same
tile; no new step starts while a dialogue is open; SPACE on an NPC snaps it to its tile and turns it to you;
proximity accepts the NPC's home tile **or** the tile it is standing on, so the Playwright helpers that
teleport next to the authored tile still hit. Completed NPCs walk home and stay.

Non-character movers (ANIM-05): every door now has a leaf (ajar on approach, swings open on entry); curtains/
privacy screens sway; vending machines shudder with their hum; plus everything that already moved (plants,
server LEDs, monitor flicker, lab bubbles, dust motes, the ER nurse patrol, the records cart, Gerald's LED,
the coffee steam).

---

## Mixer, prefs, and the save format
- Buses: **music** (`music_volume`, unchanged key so nothing else moved), **sfx / voice / ambience**
  (`pq:audio:mix:v1`). Master mute is the existing `sfx_muted`. All in localStorage; the `pq:save:v2` save
  format is **untouched** — these are device preferences, not progress, and localStorage already survives a
  reload. (The brief allowed adding them to the save; I chose not to. Flagging it as instructed.)
- HUD: the music slider is where it was; **MIX ▸** expands SFX / VOX / AMB. `data-testid="audio-mix-panel"`.
- Ducking: music → 45% and the room bed → 45% while a dialogue / request modal / encounter card is up; restored
  on close, decline, sorter/triage return, and TD wake (the WIP left the music ducked after sorter encounters).

## Dev toggles — where the switch is
`client/src/phaser/systems/exploration/audioConfig.ts`. Flip at runtime, no rebuild:
```js
localStorage.setItem('pq:audio:dev', JSON.stringify({ voiceBlipMode: 'sample' })); location.reload();
```
| Toggle | Default | The other way |
|---|---|---|
| `voiceBlipMode` | `synth` — WebAudio note per syllable, pitch/timbre from signature colour | `sample` — Kenney `pluck_001/002` rate-shifted per colour (the WIP approach) |
| `hallwayMusic` | `inherit` — the track you were hearing keeps playing through the corridor | `act` — pre-Run-12 act default |
| `ambienceBeds` | `true` | `false` — music + one-shots only |
| `hitStop` | `true` — 50ms world freeze on SPACE | `false` — squash only |
| `materialFootsteps` | `true` | `false` — the old single `sfx_footstep` |
`window.__AUDIO_DEV__` shows the resolved values in-game.

## What I couldn't wire, and why
1. **New music (AUD-01's 8–10 tracks).** Every candidate pack is a download, and this run can't authorise
   downloads on your behalf. What's in place: the duplicate is gone, the seating plan means no content room
   repeats the room you just left, hallways inherit. When you say go, the shortlist from `ASSET_PLAN.md` §2.3
   applies unchanged: Kenney *Music Jingles* (CC0, stingers), the CC0 16-bit/SPC-style packs on itch.io and
   OpenGameArt's CC0 music tag, Eric Skiff's *Resistor Anthems* (free with credit). Each needs its licence
   line in `CREDITS.md` and a `ROOM_TRACKS` entry in `MusicController.ts` — ten minutes once the files exist.
2. **A `.webm`.** Playwright's recorder needs its bundled ffmpeg, not installed here. The frame sequence +
   contact sheet stand in.
3. **Camera lookahead (FEEL-22).** Every room fits the viewport, so `startFollow` never engages. Not a gap
   in the code — a consequence of the room sizes. Becomes real the day a room is wider than 20 tiles.
4. **Alex and Nikhil only blink facing down.** Their hand-drawn side frames have no detectable eye (no
   highlight pixel, no isolated dark blob), and the generator refuses to guess. The template-drawn cast and the
   default player blink in all three facings.
5. **Portrait blink needs the sheet crop.** Bust portraits (ART-09) don't exist yet; when they do, they'll
   need their own closed-eye variant — the crop path blinks, the bust path won't.
6. **Hover sound is app-wide and quiet (0.06).** If it reads as noise on the dense TD tower strip, drop
   `hover` from `uiSfx` — one line.

## Caveats you should know about
- **The in-app browser pane is not a valid proof surface for this game.** Its rAF runs at a crawl (a
  camera fade that takes 500ms in Chrome took over a minute there; the loading bar crept for a minute). Every
  number above comes from headless Google Chrome driven by Playwright. If you open the pane and things look
  frozen, that's the pane.
- **Playwright's own Chromium is not installed on this Mac** — the cache folder is a half-download (ABOUT +
  LICENSE only). I added `channel: process.env.PW_CHANNEL` to `playwright.config.ts` and ran everything with
  `PW_CHANNEL=chrome`. `npx playwright install` restores the default path (it's a download, so your call).
- `node_modules` was empty in this clone; `npm ci` installed the lockfile as-is (lockfile unchanged).
- `.planning/DEBUG_LOG.md` referenced by the spec doesn't exist in this clone (it's gitignored).

## Taste calls I made that you may want to move
SFX / voice / ambience buses default to 0.7 (music base stays 0.13, so effects sit a hair above the bed, not over it); typewriter 16 ms/glyph (was 7 — too fast to be a voice); blip every 2nd letter under a 58 ms ceiling; hit-stop
50 ms; fidgets 7–14 s apart; blinks 2.8–6.5 s; wander dwell 7–19 s at home, 2–6 s out; Martinez rushes at
118 px/s, the tired employee shuffles at 44; break room = `music_hub`, supply closet = silence + purr; locked
doors use an error blip instead of the breach horn; trust loss is a wince (`error_003`) instead of the siren.

## The three moments that feel best now
1. **Reception, first hello.** You come through the lobby door — it's still easing shut behind you — into
   HVAC air and a distant PA chime. Riley looks up and turns to you as you cross the last two tiles. SPACE:
   three frames of stillness, she hops, the music drops to a murmur, and her line *sings* in her coral pitch
   while her portrait blinks at you mid-sentence.
2. **The break room with your hands off the keyboard.** Five people shifting around the lunch table, the HR
   director sipping, the tired employee yawning out a little "z", the selfie coworker's phone screen pulsing,
   the fridge compressor wobbling under the music — ten separate motions in any frame you freeze.
3. **Supply Closet B.** The secret stinger, the music falls away, and the room is nothing but lamp hum and
   Mr. Whiskers purring.

## What I'd do next
- Say yes to the music download and fill `ROOM_TRACKS` — the seating plan is already waiting for 8–10 tracks.
- Give the hallway employee and ER nurse patrols (still tween-based movers from the old life pass) the real
  NPC controller so they blink and face you too.
- UI-04 motion (open/close now have sounds but still hard-cut).
- A "look at thing" vocabulary per prop (nurse faces the vitals monitor, analyst the server rack) — the
  controller already faces adjacent props; it just doesn't know what they are.
