# POLISH SPEC — HIPAApocalypse

_The consolidated "make this feel like a real game" spec. Written 2026-08-22, verified against
working-tree code (branch `main`, uncommitted feel/portrait work in place). Supersedes the polish
sections of `POLISH_STANDARD.md` (STALE) and the FEEL/SPRITE backlog in `DEBUG_LOG.md` (half-closed)._

**Precedence:** `IDENTITY.md` (what it is) → `CLAUDE.md` Nintendo Test (the bar) → this doc (what to
build) → `ROOM_DESIGN_STANDARDS.md` + `VISUAL_INSPIRATIONS.md` (how rooms look) →
`HIPAA_TRAINING_FRAMEWORK.md` (accuracy reference, **not** a coverage checklist).

---

## 0. The bar, in one paragraph

A player who has never heard of HIPAA opens this, walks for sixty seconds, and thinks *"oh, this is
a real game."* Not "a nice training thing." The floor has texture. The walls have height. Characters
blink and shift their weight and turn to look at you. Doors open. Footsteps change on carpet. When
you press SPACE something *lands* — a sound, a squash, a beat of anticipation, then the payoff. The
writing is funny before it is educational. Nothing on screen is a beige rectangle.

The comparables are fixed: **Stardew Valley** for polish and sound design, **EarthBound** for deadpan
NPC writing and lived-in clutter, **Pokémon Gen 3** for interior legibility, **Papers Please** for
the micro-decision encounters. If a change doesn't move toward one of those four, it isn't this spec.

---

## 1. Verified current state (don't rediscover this)

Checked in code 2026-08-22. This is what's actually true today.

**Already good — protect it:**
- Movement: WASD/arrows + SHIFT run (`MOVE_SPEED = 190`, `RUN_MULT`), click-to-move via BFS
  pathfinding, run-dust particles, faster leg churn while running.
- Camera: room-enter push-in (`setZoom(1.05)` → tween), `fadeIn/fadeOut` room transitions (300–500ms),
  shake on the breach alert with an intentional replay-suppression rule.
- Feedback: floating score deltas (`UnifiedGamePage.tsx:1934`, green/red, 900ms), room fanfares,
  zone-glow kill + checkmark pop-in on completion, gold "next door" breathing pulse, idle-hint
  sparkles (9s grace / 5s interval), 26 persona-matched signature colors.
- Ambience: server-rack LED blink, monitor flicker, fluorescent flicker, lab beakers, ER urgency.
- Encounters: three distinct ones (BreachDefense TD, PHI Sorter desk, Breach Triage queue) with real
  projectiles, VFX modules (`battleVfx.ts`, `celebrationVfx.ts`), and 384 lines of NPC reaction voice.
- Whimsy: GERALD the printer (8-beat gag), Supply Closet B, Mr. Whiskers, Zz Test, `idleLines.ts`.

**Closed since `DEBUG_LOG.md` was written** — do not "fix" these: FEEL-003 (transitions exist),
FEEL-004 (score deltas exist), FEEL-008 (projectiles exist), FEEL-002 (placement tween + SFX exist).

**The actual gaps — this is the whole spec:**

| Gap | Evidence |
|---|---|
| No real tileset. Every floor, wall, and prop is drawn in code. | ~3,900 lines across `sprites/furniture/*` + `objectTextures.ts` + `compositeFurniture.ts`. Screenshots show a visible grid seam and flat beige squares. |
| No wall height. Rooms are a floor plane with props floating on it. | `roomRenderer.ts` — no wall-face rendering, no baseboard, no y-sorted occlusion. |
| No shadows. Nothing is grounded. | Zero `shadow` ellipses under characters or props. |
| Characters don't blink. | `grep -rn blink client/src` → only server-rack LEDs and a terminal cursor. Zero character blink. |
| NPCs are statues. | SPRITE-002: walk animations registered, never played. Breathing tween only. |
| No portraits. | `attached_assets/.../portraits/` contains one README and nothing else. Dialogue portraits crop walk-frames. |
| 26 NPCs share 10 sprite sheets. | `BootScene.ts:59-68`. The cast visually blends. |
| 4 unique music tracks for a 2.5–3 hour game. | 6 `music_*.ogg` files, but `music_exploration.ogg` and `music_demo_break_room.ogg` are **byte-identical** (md5 `5de4781…`). |
| 11 SFX wired out of 230 on disk. | `BootScene.ts:89-99` vs 230 Kenney `.ogg` files in `attached_assets/audio/`. `kenney_digital-audio/` is an aborted download — empty but for a `.DS_Store`. |
| Rooms are ~60% empty floor. | `screenshots/privacy-reception.png`. Violates the density rule this repo already wrote down in `VISUAL_INSPIRATIONS.md` (Chrono Trigger section). |
| Nameplates collide with props and each other. | Same screenshot: "Fro[nt] Desk Coordi[na]tor" reads through a clipboard sprite. |

---

## 2. Requirements

Each requirement is **observable**. "Done" means a human or a Playwright shot can see it. Effort is
S/M/L. Lever is how much player-perceived quality it buys per unit of effort.

### Pillar A — ART: the substrate (biggest lever in the project)

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| ART-01 | Adopt one real 32×32 top-down interior tileset as the visual substrate for all 12 rooms. | Every room renders from tileset frames; zero `fillRect` floors remain in `roomRenderer.ts`. | L | ★★★★★ |
| ART-02 | Retire procedural furniture drawing. | `sprites/furniture/*` (~3,441 lines) deleted or reduced to a thin lookup mapping prop id → atlas frame. | L | ★★★★★ |
| ART-03 | Rooms get **wall height** — a rendered back wall face with baseboard, not just a floor plane. | Standing at the top of a room, you see wall, not the void. Props against the back wall occlude correctly. | M | ★★★★★ |
| ART-04 | Every character and every free-standing prop casts a soft drop shadow. | Nothing floats. Shadow scales slightly with the run/jump state. | S | ★★★★☆ |
| ART-05 | Floor variety kills the grid seam — 3+ tile variants per floor type, scattered non-uniformly, plus 1 "wear" decal per ~40 tiles. | No visible repeating checkerboard at 1× zoom. | S | ★★★★☆ |
| ART-06 | Lighting pass: per-room ambient tint + light pools under fixtures + a soft vignette. | ER reads cold and urgent; break room reads warm; records room reads dim. Same tileset, different mood. | M | ★★★★☆ |
| ART-07 | Y-sorted depth. Player walks behind the top of a desk and in front of its bottom. | Depth is correct in all 12 rooms, verified by screenshot at three y-positions per room. | S | ★★★☆☆ |
| ART-08 | Prop density pass to the `VISUAL_INSPIRATIONS.md` standard — no empty corners, cable/pipe runs along walls, asymmetric clutter. | Each room's empty-floor fraction drops below ~35%. Walkways stay obvious (Pokémon Center rule). | M | ★★★★☆ |
| ART-09 | Real per-NPC bust portraits for the main cast (revives deferred Phase 7). | Every speaking NPC has a hand-placed portrait, not an upscaled walk frame. At least one expression variant for the main six. | M | ★★★★☆ |
| ART-10 | Sprite dedupe — main-cast NPCs get distinct sheets; background NPCs may share. | No two *named, speaking* NPCs in the same room share a sheet. | M | ★★★☆☆ |
| ART-11 | Single texture atlas; `BootScene` loads via `load.atlas`. | Load-time image requests drop to single digits. Closes the last INTG requirement from v1.1. | S | ★★☆☆☆ |

### Pillar B — ANIM: the living world ("always moving and blinking")

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| ANIM-01 | **Every character blinks.** 2-frame blink, randomized 3–6s interval, per-character phase offset. | Stand still for 10 seconds in a populated room; you can count several independent blinks. | S | ★★★★★ |
| ANIM-02 | NPCs actually walk (closes SPRITE-002). Wander or patrol within an authored zone, pause, resume. | No named NPC is stationary for more than ~20s unless the fiction requires it (receptionist behind a desk). | M | ★★★★★ |
| ANIM-03 | NPCs turn to face the player on approach (within ~2 tiles) and hold it for the conversation. | Walking a circle around an NPC makes them track you. | S | ★★★★☆ |
| ANIM-04 | Role-specific idle fidgets — nurse checks a chart, IT tech sips coffee, patient shifts in a chair, officer taps a clipboard. Minimum 2 per role. | Watching one NPC for 30s shows at least two distinct non-blink motions. | M | ★★★★☆ |
| ANIM-05 | **Motion budget:** every room has ≥3 independently moving things at all times, at least one of them non-character. | Freeze-frame any room; something is mid-animation. | S | ★★★★☆ |
| ANIM-06 | Player movement gets weight — 3-frame accel ramp, brief decel slide, turn-around frame, footstep audio synced to the contact frame, not a timer. | Tapping a direction produces a step, not a slide. Direction changes read as a turn. | M | ★★★★☆ |
| ANIM-07 | Doors animate open/close on transit; curtains and blinds sway; the vending machine hums and shudders. | The door you walk through visibly opens before the fade. | S | ★★★☆☆ |
| ANIM-08 | Talking animation — speaker's portrait/sprite bobs or mouth-flaps while text types, stops on the last glyph. | Dialogue never plays over a frozen face. | S | ★★★☆☆ |

### Pillar C — FEEL: tactility

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| FEEL-20 | Every interaction gets a **squash-and-stretch + hit-stop**: 2–4 frames of freeze on the impact frame, then release. | Pressing SPACE on an NPC, a door, and an item each produce a distinct physical-feeling response. | S | ★★★★★ |
| FEEL-21 | Typewriter dialogue with per-character voice blips, longer pauses on `,` `.` `—`, and second-press = reveal-full (never skip the line). | Text reads at a human cadence; impatient players are never punished. | M | ★★★★★ |
| FEEL-22 | Camera lookahead — the view leads the player ~24px in the direction of travel, soft-lerped. | Running toward a door shows more of what's ahead. | S | ★★★☆☆ |
| FEEL-23 | Input buffering (~120ms) on interact, and a small grace radius so SPACE near a target still hits. | Mashing SPACE while walking into an NPC never eats the input. | S | ★★★★☆ |
| FEEL-24 | Anticipation beats are enforced on all "big" reveals: dim → 300–500ms silence → payoff. | Room clear, act change, certificate, and encounter victory all share the beat. | S | ★★★★☆ |
| FEEL-25 | Failure feels funny, not punishing — a wrong answer gets a wince, a comedic sting, and a way forward. Never a dead end, never a scold. | No failure state uses red-alert framing for a *learning* mistake. Encounters stay retryable. | M | ★★★★☆ |
| FEEL-26 | Gamepad support + complete keyboard navigation of every overlay. | The game is playable start to finish on a controller. | M | ★★☆☆☆ |
| FEEL-27 | 60fps floor on a 5-year-old laptop; object pooling for particles and floating text. | Frame timing stays under 16ms through the busiest TD wave. | M | ★★★☆☆ |

### Pillar D — AUD: the audio bed

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| AUD-01 | Music library expands to **8–10 unique tracks** + 4 stingers. Kill the `music_exploration` / `music_demo_break_room` duplicate. | Each of the 6 content rooms has music that isn't shared with a room you just left. No md5 collisions in `attached_assets/audio/`. | M | ★★★★★ |
| AUD-02 | SFX coverage goes from 11 → **50+** wired keys, drawn from the 230 Kenney files already on disk. | No interaction in the game is silent. Grep for `emit(` / `on click` with no `sound.play` returns nothing meaningful. | M | ★★★★★ |
| AUD-03 | Footsteps vary by floor material (tile / carpet / lab) and by walk vs run, with 3+ round-robin variants each so it never machine-guns. | Walking reception → hallway → break room produces three audibly different step sounds. | S | ★★★★☆ |
| AUD-04 | Per-character dialogue voice blips (Animal Crossing style) — pitch and timbre keyed to the NPC's signature color/persona. | You can identify who's speaking with your eyes closed. | S | ★★★★★ |
| AUD-05 | An actual mixer: music/SFX/voice buses, music ducks under dialogue and stingers, volume prefs persist to the save. | Sliders exist, they work, and they survive a reload. | S | ★★★☆☆ |
| AUD-06 | Ambient room beds — ER monitor beeps, break room fridge hum, records room paper/HVAC, IT server whine — looping under the music at low gain. | Muting the music still leaves each room sounding like a place. | S | ★★★★☆ |
| AUD-07 | Stinger set: discovery, item-get, correct, wrong, room-clear, act-change, secret-found. Distinct, short, and reused consistently. | The player learns what each sound means without being told. | S | ★★★★☆ |

### Pillar E — CAST: characters and writing

_Carries the open items from `RELEASE_CHECKLIST.md` §2. Taste-gated — propose, don't ship silently._

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| CAST-01 | Nina proof-of-concept lands. Andrew reads `CHARACTER_NINA_DRAFT.md` and says "that's the tone" before the other 25 move. | Gate passed, explicitly. | S | ★★★★★ |
| CAST-02 | All 26 named NPCs have a non-HIPAA want, worry, or running joke, expressed in 3–4 idle lines. Extends `idleLines.ts`. | No named NPC exists solely to deliver a rule. | L | ★★★★★ |
| CAST-03 | Staff Directory screen — a cast codex showing portrait, signature color, role, and arc state, filling in as you meet people. | Meeting an NPC visibly adds them to a collection you can browse. | M | ★★★★☆ |
| CAST-04 | Completion reframe: "thanks for playing our little game" + a credits beat, not "training complete." | `CertificateOverlay.tsx` no longer uses training-completion framing. | S | ★★★★☆ |
| CAST-05 | Character-select blurbs get a stranger-safe pass (inside jokes reviewed before a sponsor reads them on screen two). | Andrew signs off on `characters.ts`. | S | ★★☆☆☆ |

### Pillar F — LOOP: the reward economy

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| LOOP-01 | Name the collectible. The player is *collecting* something legible across the whole game — the Staff Directory (people) is the recommended answer, with facts/hot-takes as the secondary set. | A player asked "what are you collecting?" has an answer. | S | ★★★★★ |
| LOOP-02 | Every collection gain is a micro-celebration: sound + a card that flies to the counter + the counter ticking. | Collecting anything, anywhere, uses the same satisfying grammar. | S | ★★★★★ |
| LOOP-03 | Session shape: a beat every 5–8 minutes (encounter, discovery, story turn, or gag payoff). No 10-minute stretch of pure walking-and-talking. | Beat map exists per act; the longest gap is under 8 minutes on a normal-pace playthrough. | M | ★★★★☆ |
| LOOP-04 | Pacing wave enforced per act: explore (calm) → encounter (build) → decision (peak) → payoff (release) → breather. | The emotional graph per act is not flat. | M | ★★★★☆ |
| LOOP-05 | ~15% of content is optional/secret — findable but skippable. Supply Closet B is the template. | At least 4 more secrets exist at that quality bar. | M | ★★★★☆ |
| LOOP-06 | The last 10 minutes escalate. Act 3 should feel different from Act 1 in tempo, music, and stakes. | An A/B screenshot of Act 1 vs Act 3 in the same room reads differently. | M | ★★★★☆ |

### Pillar G — TRIV: HIPAA facts and trivia that are actually entertaining

_The hard one. The rule: **a fact earns its place by being surprising, not by being true.** Definitions
are not content. "The Privacy Rule requires covered entities to…" is not content. Facts must land as
gossip, absurdity, or a number that makes you blink._

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| TRIV-01 | A bank of **20–30 hot takes / surprising facts** in the `IDENTITY_AUDIT.md` register. Every one carries a 45 CFR citation in a data field and a `CONTENT_MANIFEST.md` entry. | Bank exists, cited, and flagged for HIPAA sign-off. | M | ★★★★★ |
| TRIV-02 | Facts are **delivered by a character or an object with a POV**, never as a floating info panel. Homes: hallway bulletin boards (`hallwayContent.ts`, already act-aware), Gerald's misprints, break-room gossip, the sorter's chart marginalia. | Zero facts are delivered by a modal that exists only to deliver a fact. | M | ★★★★★ |
| TRIV-03 | One **optional trivia mechanic** with a real reward hook. Three candidates to prototype and choose between: (a) break-room "**HIPAA or Not?**" arcade cabinet — rapid-fire scenario calls, high-score board, unlocks cosmetics; (b) **Gerald's Fortunes** — the printer jams and spits a hot take, collectible as a set; (c) **Rumor Mill** — NPCs trade you a fact for doing a small favor, and half the rumors are wrong so you have to judge. | One is built, playtested, and either kept or cut on its own merits. | M | ★★★★☆ |
| TRIV-04 | Wrong-answer feedback everywhere explains *why*, in-voice, in one sentence — never a citation dump. | No feedback string exceeds ~2 sentences or reads like a regulation. | S | ★★★★☆ |
| TRIV-05 | Coverage is formally demoted: `HIPAA_TRAINING_FRAMEWORK.md` gets a header declaring it an accuracy reference, and `CLAUDE.md`'s HIPAA section is updated to match the pivot. | Both files updated; GAP/THIN ratings read as permission-to-skip. | S | ★★★☆☆ |

### Pillar H — UI

| ID | Requirement | Done when | Effort | Lever |
|---|---|---|---|---|
| UI-01 | Font hierarchy: Press Start 2P for headers, counters, and short labels only. A readable pixel body font for anything over ~10 words. | No paragraph is set in Press Start 2P. | S | ★★★★☆ |
| UI-02 | Nameplates never collide with props or each other — collision-aware placement with a leader line if displaced. | Reception's "Front Desk Coordinator" plate is fully legible. | S | ★★★★☆ |
| UI-03 | HUD leans diegetic — the progress panel reads as a badge/clipboard, not a debug overlay. | The HUD would survive a Steam screenshot. | M | ★★★☆☆ |
| UI-04 | Every overlay opens and closes with a 150–200ms motion, never a hard cut. | No modal pops. | S | ★★★☆☆ |
| UI-05 | Title screen and pause menu match the art bar set by ART-01..08. | The first screen a stranger sees is as polished as the game behind it. | M | ★★★★☆ |

---

## 3. Priority — where to spend first

Ranked by (player-perceived quality gained) ÷ (effort), given the verified state:

1. **ART-01/02/03/04/05 — the tileset substrate.** Nothing else on this list changes the screenshot.
   This is the difference between "someone's project" and "a game." Everything downstream (density,
   lighting, portraits) needs it in place first.
2. **ANIM-01/02/03/04/05 — the living world.** Blinking and walking NPCs are cheap and transform how
   alive a room feels. ANIM-01 alone is a few hours for a permanent upgrade.
3. **AUD-02/03/04 — sound coverage.** 230 files are already on disk, licensed CC0, unused. This is
   the highest ratio of perceived polish to work in the entire project.
4. **FEEL-20/21/23 — interaction tactility.** Hit-stop, typewriter, input buffering. Small diffs,
   felt on literally every interaction in the game.
5. **CAST-01/02 + TRIV-01/02** — the identity pivot. Highest ceiling, but taste-gated and slow. Start
   the Nina gate now so the pass can run while the art work happens.

Everything in Pillar F (LOOP) is a **design decision**, not a task. Decide LOOP-01 before building
CAST-03, because the Staff Directory is probably the answer to both.

---

## 4. The acceptance test

Not a checklist — a single sixty-second test, run by someone who has never seen the game:

> Load a fresh save. Walk through Reception into the hallway and into one more room. Talk to two
> people. Pick up one thing.

They should be able to say, unprompted: *the floor has texture · people are moving · that sound was
satisfying · that was funny · I want to see the next room.* If any of those five is missing, that's
where the next work goes.

---

## 5. Explicitly out of scope

Multiplayer · mobile/touch port · procedural content · additional encounter *types* (three is enough —
deepen them instead) · comprehensive HIPAA coverage · SCORM/LMS anything · sequels or expansions ·
replacing Phaser · a second art style.
