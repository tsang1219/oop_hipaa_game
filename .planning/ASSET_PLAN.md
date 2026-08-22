# ASSET PLAN — what we need, where to get it, how it lands

_Companion to `POLISH_SPEC.md`. Written 2026-08-22 against a verified inventory._

**Licensing rule for this project:** every asset that ships must be either **CC0** or a
**commercial-use-permitted paid pack with credit**. No CC-BY-SA and no GPL art — share-alike is viral
and this game may end up sponsor-attached. Every acquisition writes a line to
`attached_assets/CREDITS.md` at download time, not later. If a license can't be established in 60
seconds, don't take the asset.

---

## 1. What we have (verified on disk)

| Category | Have | Reality |
|---|---|---|
| Audio SFX | 230 Kenney `.ogg` (impact 130, interface 100) | **11 wired.** 219 sitting unused. |
| Music | 6 files / **4 unique** | `music_exploration.ogg` ≡ `music_demo_break_room.ogg` (identical md5). ~3 hours of game on 4 loops. |
| Character sheets | 11 × 96×128 (3 frames × 4 dirs, 32px) | Procedurally drawn by `generate_sprites.py` (PIL). Serviceable chibi; no blink, no fidget, no sit frames. |
| Portraits | **0** | Directory holds a README and nothing else. |
| TD sprites | 6 towers, 8 threats | Fine. Leave alone. |
| Tiles / furniture | **0 image assets** | ~3,900 lines of code draw every floor, wall, desk, and chair as rectangles. |
| Kenney digital-audio | empty | Aborted download — `.DS_Store` only. |

---

## 2. The shopping list

### 2.1 The one that matters — interior tileset

**[LimeZu — Modern Interiors (RPG Tileset)](https://limezu.itch.io/moderninteriors)** — *the_ pick.*

- 16×16 / **32×32** / 48×48 variants (32 matches our tile size exactly)
- 30+ interior themes **including hospitals, offices, classrooms, libraries, gyms, break/kitchen,
  bathrooms** — this is almost literally our room list
- Character generator: 100+ outfits, 200 hairstyles, 80 accessories, 9 skin tones, with idle / run /
  reading / lifting / throwing animations
- License (verified 2026-08-22 on the itch page): edit and use in **any commercial or non-commercial
  project**; may not resell or redistribute the asset; **credit required** (link to LimeZu's itch page)
- Free version is basic; the full tileset is **pay-what-you-want from $1.50**

Buy the full version. It is the single highest-leverage dollar in this project — it closes ART-01
through ART-05 and ART-10 and hands us a character pipeline for the whole cast.

**Fallbacks / supplements** (check license per asset at download):
- [itch.io — hospital tilesets](https://itch.io/game-assets/tag-hospital/tag-tileset), e.g.
  [Pixel Hospital Tileset 32×32](https://jackburton84.itch.io/pixel-hospital-tileset-modern-medical-pixel-art-32x32) for medical-specific props (curtained beds, exam tables, monitors)
- [itch.io — free tilesets](https://itch.io/game-assets/free/tag-tileset)
- **Not** LPC / Liberated Pixel Cup — CC-BY-SA + GPL, share-alike, rejected by the licensing rule above.

### 2.2 Kenney — UI, particles, audio (all CC0, all free)

Already the audio backbone; extend it.

| Pack | Use | Requirement |
|---|---|---|
| [UI Pack](https://kenney.nl/assets/ui-pack) (430 assets) + [UI Pack RPG Expansion](https://kenney.nl/assets/ui-pack-rpg-expansion) | Panels, frames, sliders, cursors for the HUD/directory/menus | UI-03, UI-05 |
| [RPG Audio](https://kenney.nl/assets/rpg-audio) (50 assets) | Footsteps by material, doors, item-get, cloth, handling | AUD-02, AUD-03 |
| [Music Jingles](https://kenney.nl/assets/music-jingles) (85 assets) | The full stinger set — discovery, item-get, room-clear, act-change, secret | AUD-07 |
| [UI Audio](https://kenney.nl/assets/ui-audio) | Menu/overlay motion sounds | UI-04 |
| Particle Pack (80+ sprites) | Sparkles, dust, impact puffs, celebration confetti | FEEL-20, LOOP-02 |
| Impact + Interface sounds | **Already downloaded.** Mine the 219 unused files first. | AUD-02 |

Also: re-download **Digital Audio** (the existing folder is empty) for the IT Office / TD layer.

### 2.3 Music — need 4–6 more unique tracks + stingers

Target 8–10 unique loops so no two adjacent rooms share a track (AUD-01).

- CC0 SNES/16-bit RPG music packs on itch — e.g. the CC0 SPC700-style collections under
  [itch.io CC0 music](https://itch.io/game-assets/assets-cc0/tag-music) and
  [free 16-bit music](https://itch.io/game-assets/free/tag-16-bit/tag-music). Prefer packs that ship
  **loop points / seamless loops**.
- [OpenGameArt CC0 music](https://opengameart.org/content/cc0-music-0)
- [Eric Skiff — Resistor Anthems](http://ericskiff.com/music/) — free with credit
  ("Music: Eric Skiff — <Song> — Resistor Anthems"). More NES-flavored than SNES; good for the
  TD/arcade layer, less good for the warm exploration bed.

**Track allocation (8 minimum):** hospital entrance/reception · hallways (quieter variant of the
exploration theme) · break room (warm) · ER (tense) · records room (dim, slow) · lab (curious) ·
IT office / TD (driving) · act-3 escalation · plus title and credits.

### 2.4 Portraits — the pipeline, not a pack

No pack will match our cast. Per `PORTRAIT_GENERATION.md` / `PORTRAIT_PASTE_SHEET.md`, the generator
route already exists. What's needed (ART-09):
- One locked `STYLE_ANCHOR` so all portraits read as one hand
- ~10 main-cast portraits × 2 expressions, plus neutral busts for the rest
- 128×128, palette-limited, consistent lighting direction and shoulder crop

LimeZu's character generator can produce matching full-body sprites for the same cast, which keeps
portrait and overworld sprite in the same visual family — that consistency is most of what "polished"
means here.

---

## 3. The pipeline (how assets actually land)

1. **Acquire** → `attached_assets/vendor/<pack-name>/` (raw, untouched, with its own LICENSE file).
2. **Credit** → append to `attached_assets/CREDITS.md` immediately: pack, author, URL, license, date.
3. **Slice** → a build-time script emits a single atlas + JSON to
   `attached_assets/generated_images/privacyquest/atlas/`. Nothing hand-cropped into the repo.
4. **Map** → prop id → atlas frame in one data file. The `sprites/furniture/*` modules shrink to this
   lookup; the drawing code is deleted, not commented out (ART-02).
5. **Load** → `BootScene` uses `load.atlas` (ART-11), not 30 `load.image` calls.
6. **Prove** → a screenshot of every one of the 12 rooms, before and after, committed to
   `screenshots/art-substrate/`. No proof, not done.

**Symlink caution:** all assets resolve through the `client/public/attached_assets` symlink. A new
top-level folder under `attached_assets/` is fine; anything outside it will 404 in production.
Verify on the deployed GitHub Pages URL, not just locally.

---

## 4. Budget

| Item | Cost |
|---|---|
| LimeZu Modern Interiors (full) | **$1.50+** (pay what you want; pay more, it's worth it) |
| Kenney packs (UI, RPG Audio, Music Jingles, UI Audio, Particles, Digital Audio) | $0 (CC0) |
| CC0 music packs | $0 |
| Medical-specific supplementary tileset | $0–$10 |
| **Total** | **under $15** |

The art problem in this project is not a money problem. It's a *decide-and-integrate* problem.
