# Run Report — 11: The art substrate — **Reception checkpoint**

**Branch:** `fable/art-substrate` (off `fable/living-world` @ `fb030e2`, the branch you were on — it carries Run 12,
so this is playable with the blinking/walking cast). `main` untouched.
**Mode:** own branch · **Stopped at your MEDIUM checkpoint:** Reception is finished; the other 11 rooms are NOT
touched. This report is the hand-back for that stop.
**Proof environment:** everything below was proven against the running game in Google Chrome driven by
Playwright (`PW_CHANNEL=chrome`), through the QA deep-links and `window.__QA__`. Nothing is claimed from code.

---

## The 90-second version

Open `screenshots/art-substrate/grid-before-vs-after-vs-variantA.png`. Left is the room you had this morning;
middle is Reception rendered from **LimeZu Modern Interiors**; right is the same room with the alternative
wall style (the one style fork I hit — see below). Then open `reception-after.png` at full size.

What's there now: a floor with six scattered tile variants and worn walkways instead of a checkerboard, a real
two-row back wall (cap, face, baseboard) with LimeZu's thin wall tops running down the sides and along the
bottom, the tileset's own floor-contact shadows under every wall, the U-shaped reception counter with Riley's
empty chair in the well and clutter on the back counter, waiting benches, a stanchion pair, a wheelchair
parked by the magazine shelf, a fern, an IV stand, a toy chest in the kids' corner, GERALD as an actual copier,
a notice board and clock and sanitizer on the wall, doormats inside both doors, and a warm lighting layer
(ambient tint + ceiling pools + vignette) that you can switch off to see what it does. Every prop y-sorts with
the characters — walk up behind the trash can and your legs disappear behind it.

**My recommendation on the fork: ship the two-row wall (variant C, what is on the branch).** Details in §4.

---

## 1. What I bought and under what license

| Pack | Author | License (verified on the pack's `LICENSE.txt`, 2026-08-22) | Credit |
|---|---|---|---|
| **Modern Interiors (RPG tileset), full version**, 32×32 | LimeZu — https://limezu.itch.io/moderninteriors | Edit + use in any commercial or non-commercial project; **no reselling or redistributing** the asset, edited or not; **credit required** | `attached_assets/CREDITS.md` (written at acquire time, first commit of the branch) |

Nothing else was taken. No CC-BY-SA, no GPL art.

**Where it lives and why it is git-ignored.** The raw pack is at `attached_assets/vendor/modern-interiors/`
exactly as ASSET_PLAN §3 asks — but only `LICENSE.txt` and a restore `README.md` are tracked. The pack's
license forbids redistribution, this repo is **public**, and `deploy.yml` publishes `attached_assets/` to
GitHub Pages; committing the 320 MB pack would have put the whole paid tileset on a public URL. The only
LimeZu pixels in git are the sliced atlas the game actually loads
(`attached_assets/generated_images/privacyquest/atlas/interiors.png` + `.json`, 417 frames, 236 KB), which is
the normal "use in your project" case. The game builds and runs without the vendor folder; it is only needed
to re-slice (`node scripts/art/slice-atlas.mjs`). The vendor README explains how to restore it on a fresh clone.

## 2. Status against the targets (Reception scope)

| ID | Requirement | Reception | Evidence |
|---|---|---|---|
| ART-01 | One real 32×32 tileset as the substrate; zero `fillRect` floors | **Done for Reception.** Floor, wall face, wall tops, shadows all from atlas frames drawn into one RenderTexture; the legacy `fillRect` path still runs for the 11 unconverted rooms | `reception-after.png`, `reception-art-snapshot.json` (`floorSet: floor.reception`, `missing: []`) |
| ART-02 | Retire procedural furniture; thin lookup prop id → frame | **Done for Reception** (`art/artCatalog.ts` is the lookup). `objectTextures.ts` deleted. `sprites/furniture/*` + `compositeFurniture.ts` (3,912 lines) are **still present** because the other 11 rooms render through them — they go when the last room converts | `git show --stat` of the substrate commit |
| ART-03 | Wall height: back wall face with baseboard, props against it occlude correctly | **Done** — 2-row face (cap + face + baseboard); cabinets/plants/copier stand in front of it; the counter's back rises into it | `reception-after.png` top edge; `reception-variantA.png` for the 1-row alternative |
| ART-04 | Soft drop shadows under every character and free-standing prop | **Done** — characters keep their ellipse (Run 12); LimeZu props carry their baked soft base shadow; the ground carries the tileset's wall-contact shadows | `reception-after.png` |
| ART-05 | 3+ floor variants scattered non-uniformly + wear decals | **Done** — 6 variants, 3×2 seamless pattern with 18% random swaps, 9 worn-walkway patches along door→counter→door and spawn→counter, dropped paper + a crumpled form | `art/artCatalog.ts` `ROOM_ART.reception.floor/wear` |
| ART-06 | Per-room ambient tint + light pools + soft vignette, toggleable | **Done** — warm `0xffe4c2` MULTIPLY ambient, four ADD light pools, radial vignette; `__QA__.commands.setLighting(false)` hides the layer; corners measure 127 → 161 luma with it off | `reception-lighting-on.png` / `-off.png`, `reception-lighting.json` |
| ART-07 | Y-sorted depth, verified at three y-positions | **Done** — props use `depth = 5 + bottomRow`, the same rule characters already used. Six shots (behind / beside / in front of the water machine and the trash can) with the player's depth read from the live scene: 16 < 17 < 18 and 7 < 8 < 9 | `reception-depth-*.png`, `reception-depth.json` |
| ART-08 | Density pass — no empty corners, asymmetric clutter, walkways obvious | **Done** — 24 props + 14 decor pieces vs 22 props before; every corner has something (plants, wheelchair + shelf, water machine + toy chest); the two waiting wings differ (yellow vs green benches, side table + magazine shelf left, IV stand right); the centre aisle and the counter approach stay open | `reception-after.png` |
| ART-11 | Single texture atlas via `load.atlas` | **Done for interiors** — one `load.atlas` call, 1 image request for every floor/wall/prop. Total load-time image requests are 28: that remaining count is the 11 character sheets + 14 tower-defense sprites + 1 lobby background, which this run was told to leave alone | `reception-art-snapshot.json` (`imageRequests: 28`) |

## 3. The pipeline (how the assets land, and how to do the next room)

1. **Acquire** → `attached_assets/vendor/modern-interiors/` (git-ignored, §1).
2. **Credit** → `attached_assets/CREDITS.md`.
3. **Pick frames** → `node scripts/art/sheet-inspector.mjs <sheet.png> <outDir>` renders any tileset as labeled
   2× contact sheets with absolute tile coordinates; `scripts/art/tile-zoom.mjs` zooms a rect. This is how every
   frame below was chosen (by looking, not by guessing from file names).
4. **Slice** → `scripts/art/atlas-manifest.json` lists every frame as `{sheet, t:[tx,ty,tw,th]}` (tile units;
   `split` explodes a floor block into variants). `node scripts/art/slice-atlas.mjs` shelf-packs them (2 px pad,
   1 px extrude — no bleeding under the room-entry zoom) into `interiors.png/.json` and regenerates
   `art/atlasFrames.generated.ts`, a string-literal union so a typo in a frame name fails `tsc`.
5. **Map** → `client/src/phaser/systems/exploration/art/artCatalog.ts`: `PROP_DEFAULTS` (type → frame),
   `ROOM_PROP_OVERRIDES` (per room or per instance `"type@x,y"`), `ROOM_DECOR` (wall art, counter clutter, mats,
   wear — nothing with collision), `ROOM_INTERACTABLE_ART` (zone/item sprite + nudge), `ROOM_ART` (floor set,
   wall style/height, trim, lighting).
6. **Render** → `art/artRenderer.ts`. `roomRenderer.renderRoom` dispatches here when `ROOM_ART[room.id]`
   exists; collision is built by the shared `buildWallColliders`, so the walkable layer is identical on both paths.
7. **Prove** → `PW_CHANNEL=chrome node tests/art-substrate-capture.mjs after <room>`,
   `node tests/art-substrate-probe.mjs <room>` (dumps `__QA__.art`),
   `PW_CHANNEL=chrome npx playwright test tests/art-substrate-proof.spec.ts` (atlas / depth / lighting),
   `node scripts/art/grid.mjs before after`.

Converting a room is: add a `ROOM_ART` entry, map its obstacle types (most are already in `PROP_DEFAULTS`),
dress it in `ROOM_DECOR`, move wall-flush props down a row if it takes the 2-row wall, capture, look, adjust.

## 4. The style fork — wall height (needs your call before the other 11)

The room is exactly one screen (20×15 tiles = 640×480) and every room's top wall is a single data row. LimeZu's
wall face is two tiles tall (cap + face + baseboard). Two plausible looks:

| | **C — two-row wall** (on the branch, `reception-after.png`) | **A — one-row wall** (`reception-variantA.png`) |
|---|---|---|
| What you see | A real wall: cap, face, baseboard; furniture stands in front of it | 32 px of wall face cut off by the screen edge; furniture at row 1 rises into it, jammed against the HUD |
| Gameplay geometry | Row 1 becomes wall. Wall-flush props drop one row (and GERALD's spot with them). The "corridor behind the reception desk" along row 1 is gone — which is the Pokémon-Center counter rule anyway | Untouched |
| Cost for the other 11 rooms | Hallways keep their PHI-tip **items** at row 1 → those 5 items move to row 2 (`roomData.json` + `tests/helpers/qa-helpers.ts` constants); IT's four server racks, records' counter, the lobby's board/plant shift a row; `hallway_break_lab` gets a real front-facing door frame for its top door at (8,0). No NPC, zone, door or spawn is at row 1 anywhere | None |

`node scripts/art/reception-variant.mjs A|C` flips Reception between them; the branch is on C.
**I recommend C** — it is the thing you asked for ("the top of a room is a wall and not the void") and the
geometry cost is a handful of one-row nudges, all of which I can list and test.

Other calls I made alone (say the word and I'll swap any of them — all are one-line catalog edits):
- **Floor:** LimeZu's light gray-beige large-format tile (`floor.reception`). Alternates already in the atlas:
  `floor.cream` (warmer, with bracket motifs), `floor.lightgray` (cooler, cleaner).
- **Wall:** cream (`wall.cream`). Also sliced: beige, pale green, blue-gray, hospital light-blue with an orange
  baseboard, teal-with-crosses.
- **Counter:** the wood/orange U-counter (`prop.counter.reception.wood`); beige and white versions are sliced.
- **Waiting seats:** 2×1 padded benches (no overhang into the door path) rather than the 1×2 armchairs, which
  would have hidden anyone walking in from the lobby door behind their backs.
- **Privacy screens → queue stanchions.** The two 1×1 `privacy_screen` tiles flank the counter approach; a
  post reads as "wait behind the line" and suits the sign-in-sheet scenario. The ER's curtains are a different type.

## 5. What I deleted, what I didn't

- **Deleted:** `client/src/phaser/sprites/objectTextures.ts` (210 lines — the four hand-drawn obj_* sprites).
  Zones, items, the hallway board anchor, the threat-console/whimsy anchors and the NPC "reads a chart" fidget
  all use atlas frames now, game-wide.
- **Not yet deleted, on purpose:** `sprites/furniture/*` (3,441 lines) and `compositeFurniture.ts` (471) and the
  legacy floor/wall code in `roomRenderer.ts`. The 11 unconverted rooms still render through them. They are
  deleted — not commented out — in the commit that converts the last room. Converting all rooms before this
  checkpoint would have meant doing eleven rooms' worth of frame-picking before you had seen one.

## 6. Every place gameplay geometry moved (all in `client/src/data/roomData.json`, Reception only)

| What | From | To | Why |
|---|---|---|---|
| top `wall` obstacle | `(0,0) 20×1` | `(0,0) 20×2` | wall height (variant C) |
| `plant` | (1,1) | (1,2) | stands in front of the wall, not inside it |
| `printer_station` (GERALD) | (3,1) | (3,2) — and `PRINTER_SPOTS.reception` in `whimsyData.ts` | same; his tape + LED now ride the copier's upper half |
| `filing_cabinet` | (4,1) | (4,2) | same |
| `filing_cabinet` | (14,1) | (15,2) | same, plus one tile right so the notice board has free floor under it |
| `plant` | (18,1) | (18,2) | same |
| `notice_board` | (1,3) floor-standing | (13,1) wall-mounted (inside the wall rows, no walkability change) | a board belongs on a wall; frees the item's corner |
| **added** `trash_can` (6,3), `wheelchair` (1,11), `toy_chest` (18,13), `plant` (1,5), `iv_stand` (18,4) | — | — | density pass; none sits on a walkway or between a door and an interactable |

Unchanged: all three NPC spawns, both zones, the item, both doors, the spawn point, `qa-helpers.ts`.
Net walkable-tile change: −18 (row 1) −5 (new props) + 2 (the old notice board's tiles) = −21 of 234.

## 7. Proof artifacts (`screenshots/art-substrate/`)

- `grid-before-vs-after-vs-variantA.png` — the judge-it-in-ninety-seconds image.
- `<room>-before.png` for all 13 rooms (captured before any code changed; the other 12 await their `-after`).
- `reception-after.png`, `reception-variantA.png`.
- `reception-depth-{water_dispenser,trash_can}-{behind,beside,front}.png` + `reception-depth.json` — the
  player's live depth vs the prop's at each position.
- `reception-lighting-on.png` / `-off.png` + `reception-lighting.json` — corner luma 126.9 → 160.9.
- `reception-art-snapshot.json` — the full `__QA__.art` dump: 24 props with frames and depths, 14 decor
  pieces, `missing: []`, image request list.
- `tests/art-substrate-proof.spec.ts` — **3/3 green** (atlas + no missing frames + one atlas request + zero
  console errors; depth ordering; lighting toggle brightens the edges).
- `tests/progression/*.spec.ts` — **31 passed, 0 failed, 4 skipped** (the `breach-gameplay` group is skipped by
  the suite itself; unchanged), 6.1 min, run against this branch with Reception on the atlas path — door
  unlocks, full playthrough, NPC interaction, room completion and navigation all green, no console errors.
- `npm run check` (tsc) clean. `npm run test:data` 26/26. `npm run test:unit` shows 14 failures in
  `saveData.test.ts` that are **pre-existing** (verified identical on the base commit in a temp worktree):
  Node 26's experimental `localStorage` global shadows jsdom's, so `localStorage.clear()` throws in
  `beforeEach`. Not touched by this run; worth a one-line fix in the vitest setup later.

## 8. Proud of / not proud of

**Proud of:** the wall — cap, face, baseboard, thin side tops, the tileset's own AO under them; it finally
reads as a place. The counter with the empty chair in the well. The floor: you have to look for the repeat. The
depth rule being one line shared with characters. The pipeline: the next room is data, not drawing code.

**Not proud of, or still want your eyes on:**
- The **water dispenser** is LimeZu's white kiosk with a blue panel (`prop.machine.white`) — it reads a bit like
  an ATM. The pack has no proper water cooler in the sheets I mined; the Grocery/Basement sheets might.
- The **doors** are still Run 12's procedural wooden frame + swinging leaf, drawn over the new thin wall tops.
  They work and animate, but they are the last brown rectangles in the room. Restyling them from the tileset's
  door frames is a half-day I didn't spend before the checkpoint.
- The **HUD** (room banner, progress panel) covers the top 40 px of wall and the top-right plant. That is
  UI-03's problem, not this run's, but it is visible in every shot.
- The two **zone icons** (sign-in clipboard, privacy notice) sit on the counter's front ledge now, but they are
  still bobbing 1×1 icons with gold rings — they look like pickups, not like a clipboard on a counter.
- **Lighting taste:** I backed the vignette off from 0.42 to 0.34 after the first render; it is deliberately
  quiet. If you want the "cold ER / warm break room" contrast to be obvious, the numbers are in `ROOM_ART`.

## 9. Caveats

- The dev server on :8080 during this run was another chat's process, but its cwd is this working tree, so
  Vite HMR served every edit; all captures are fresh page loads. The Playwright config reuses it.
- The in-app browser pane was not used for any proof (it throttles Phaser's rAF — see the memory note).
- Only Reception has a `ROOM_ART` entry. Walking through the right door into `hallway_reception_break` drops
  you back into the old procedural look — expected at this checkpoint, jarring to play.

## 10. Next (once you say go on the fork)

Per room: ~1–2 hours of frame picking + dressing + capture. Sheets to mine that I have not yet sliced:
**Kitchen** (break room: fridge, microwave, coffee, tables, mugs — partly sliced), **Basement / control room**
(IT: server racks, monitor banks, cable trays; the `3_Animated_objects` server and screens are animated
spritesheets worth using), **Classroom & Library** (records: shelving, archive boxes, whiteboards),
**Hospital** (ER: beds, gurneys, curtains, IV poles, crash carts, vitals — already sliced; lab: counters,
microscope, fridges, lockers — already sliced). Then: delete `sprites/furniture/*`, `compositeFurniture.ts`
and the legacy half of `roomRenderer.ts`; restyle the door frames; run the 12-room grid and the full
progression suite; update `CONTENT_MANIFEST.md` only if a content-bearing prop moves (none did here).
