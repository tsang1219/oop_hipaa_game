# Run 12 — The living world (animation + sound)
**Mode:** own branch (`fable/living-world`) · **My checkpoint:** LIGHT — this is craft, not taste
**Read first:** `.planning/POLISH_SPEC.md` (Pillars B, C, D), `CLAUDE.md` commandments

## The wish

Two things, and they're the same thing: **the world should never be still, and it should never be
silent.**

**Still.** Nobody blinks in this game — I checked, the only blinking thing in the codebase is a
server rack LED. NPCs have walk animations registered that have never once played; they're statues
with a breathing tween. Nobody turns to look at you when you walk up. I want the Stardew thing: you
stand in a room doing nothing and there are half a dozen small motions happening, all slightly out of
phase, and none of them demand your attention. Blinks at randomized intervals. A nurse checking a
chart. Someone shifting their weight. A patient fidgeting in a waiting-room chair. NPCs actually
walking a small patrol and stopping to look at things. Doors that open before you go through them.

**Silent.** There are 230 Kenney sound files sitting in `attached_assets/audio/` and exactly **11**
are wired up. There are four unique music tracks for a three-hour game — and two of the six files on
disk are byte-identical duplicates (`music_exploration.ogg` ≡ `music_demo_break_room.ogg`). I want
footsteps that change on carpet versus tile versus lab floor, with enough round-robin variants that
they never machine-gun. I want per-character dialogue voice blips, keyed to each NPC's signature
colour, so I can tell who's talking with my eyes shut. I want room ambience beds — ER monitors,
break-room fridge hum, the server whine in IT — under the music. And a real mixer that ducks music
under dialogue and remembers my volume.

And while you're in there, the tactility pass: a couple of frames of hit-stop and a squash on every
interaction, typewriter dialogue with punctuation pauses where a second press reveals the full line
instead of skipping it, and input buffering so mashing SPACE while walking never eats the press.

Targets: **ANIM-01..08, AUD-01..07, FEEL-20..24.** If you only get one pillar done, make it ANIM.

## Protect

- **Sounds must not become noise.** Every new SFX gets a cooldown and a round-robin. If a player can
  make a sound machine-gun by mashing, it's a bug. Mix everything under the music, not over it.
- Don't regress what's already good: run dust, room-enter push-in, fade transitions, score deltas,
  zone-glow kill, the gold next-door pulse, idle sparkles. Read them before you touch them.
- NPC wandering must never break interaction: an NPC mid-conversation stops moving, an NPC required
  for progression never wanders out of reach, and pathfinding/collision stay authoritative.
- Don't touch dialogue *content*, HIPAA facts, or the save format. Volume prefs may be added to the
  save — flag it if you do.
- New music must be CC0 or commercial-use-with-credit. Credit it in `attached_assets/CREDITS.md`
  as you take it. Kill the duplicate track.

## Prove it

- A **10-second video or frame sequence** of one populated room with nobody touching the controls,
  showing independent motion. That's the ANIM acceptance test.
- An audio map: every interaction in the game → the sound it plays. Anything with a blank is a bug.
- Playwright suite green, zero console errors, frame timing under 16ms through a full TD wave.

## Hand back

- A branch I can play with headphones on.
- `RUN_REPORT-12.md`: the audio map, the animation inventory per NPC role, what you couldn't wire and
  why, and the three moments you think feel best now.
- If a sound choice could go two ways, wire both behind a dev toggle and tell me where the switch is.

## Sequencing note
This run and Run 11 both edit `BootScene.ts` (11 touches image loads, 12 touches audio loads). That's
a trivial conflict but a real one — run 11 first, or accept a five-minute merge. Everything else in
the two runs is disjoint.
