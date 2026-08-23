# Run Report — 11: The art substrate

**Branch:** `fable/art-substrate` (off `fable/living-world` @ `fb030e2`, the branch you were on — it carries Run 12,
so the blinking/walking cast lives in the new rooms). `main` untouched.
**Mode:** own branch · **Checkpoint:** Reception was shown first (commit `96f2ecc`); you picked the two-row
wall (variant C) and approved nudging wall-flush props down a row; the other 12 rooms followed on that rule.
**Proof environment:** everything below was proven against the running game in Google Chrome driven by
Playwright (`PW_CHANNEL=chrome`), through the QA deep-links and `window.__QA__`. Nothing is claimed from code.

---

## The ninety-second version

Open `screenshots/art-substrate/grid-before-vs-after.png` — thirteen rooms, left is this morning, right is now.

Every room in PrivacyQuest renders from **LimeZu Modern Interiors** through one 661-frame atlas: floors with
six scattered tile variants and worn walkways, a two-row back wall with cap, face and baseboard, LimeZu's thin
wall tops down the sides, the tileset's own contact shadows under every wall, every obstacle as a y-sorted
atlas sprite (a few animated: server racks blink, monitors scroll, the break-room TV runs a hospital news
report, security cameras pan, coffee steams), wall-mounted dressing, and a per-room lighting layer — warm in
the break room, cold teal-and-blue in the ER, dim carpet-and-green in Records, dark raised floor and cyan
monitor glow in IT. The 4,676 lines of procedural floor/wall/furniture drawing are deleted, not commented out.
Collision, pathfinding, doors, zones, items and NPC spawns are untouched; the only geometry that moved is listed
in §6, and every NPC, zone, item and door in every room was re-checked reachable by BFS.

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
LimeZu pixels in git are the sliced atlas the game loads
(`attached_assets/generated_images/privacyquest/atlas/interiors.png` + `.json`, 661 frames, 1024×2054, 410 KB),
which is the normal "use in your project" case. The game builds and runs without the vendor folder; it is only
needed to re-slice (`node scripts/art/slice-atlas.mjs`).

## 2. Status against the targets

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| ART-01 | One real 32×32 tileset as the substrate for all 12 rooms; zero `fillRect` floors | **Done — 13 rooms** (the secret closet too). `roomRenderer.ts` has no floor/wall drawing left; a room without a catalog entry throws | `*-after.png`, `*-art-snapshot.json` (`missing: []` in every room) |
| ART-02 | Retire procedural furniture; thin lookup prop id → frame | **Done.** `sprites/furniture/*` (3,441 lines), `compositeFurniture.ts` (471), `objectTextures.ts` (210) and the legacy half of `roomRenderer.ts` are **deleted**. The lookup is `art/artCatalog.ts` | `git show --stat` of the conversion commit: −4,676 lines |
| ART-03 | Wall height: back-wall face with baseboard; props against it occlude correctly | **Done, every room** — two-row face (cap + face + baseboard); cabinets, racks, fridges, bookcases stand in front of it and rise into it | any `*-after.png` top edge |
| ART-04 | Soft drop shadows under every character and free-standing prop | **Done** — characters keep their ellipse (Run 12); LimeZu props carry their baked base shadow; the ground carries the tileset's wall-contact shadows | `*-after.png` |
| ART-05 | 3+ floor variants scattered non-uniformly + wear decals | **Done** — 6 variants per floor, 3×2 seamless pattern with 18% random swaps, per-room worn-walkway patches, dropped paper / crumpled forms | `ROOM_ART.*.floor`, `.wear` |
| ART-06 | Per-room ambient tint + light pools + vignette, toggleable | **Done** — `__QA__.commands.setLighting(false)` hides the layer; each room's edges measurably brighten | `*-lighting-on/off.png`, `*-lighting.json` |
| ART-07 | Y-sorted depth, verified at three y-positions per room | **Done** — props use `depth = 5 + bottomRow`, the rule characters already used. Per room, the player is teleported behind / beside / in front of a tall prop and its live depth compared to the prop's | `*-depth-*.png`, `*-depth.json` |
| ART-08 | Density pass — no empty corners, cable runs, asymmetric clutter, walkways obvious | **Done** — 146 → 167 solid props plus ~140 non-solid dressing pieces; cable ducts and light rails in IT and the IT hallway; every corner holds something; the two sides of every room differ | `*-after.png` |
| ART-11 | Single texture atlas via `load.atlas` | **Done for interiors** — one `load.atlas`, one image request for every floor/wall/prop in the game. Load-time image requests are 28 in total: the other 27 are the 11 character sheets + 14 tower-defense sprites + 1 lobby background, which this run was told to leave alone | `*-art-snapshot.json` (`imageRequests`) |

## 3. The pipeline (how assets land; how to add or change a room)

1. **Acquire** → `attached_assets/vendor/modern-interiors/` (git-ignored, §1). **Credit** → `attached_assets/CREDITS.md`.
2. **Pick frames by looking** → `scripts/art/sheet-inspector.mjs <sheet.png> <outDir>` renders any tileset as labeled
   2× contact sheets with absolute tile coordinates; `scripts/art/tile-zoom.mjs` zooms a rect;
   `scripts/art/atlas-contact.mjs --sheet living` renders the sliced frames by name (this is how I caught that the
   sofas I had "read" off the Living Room sheet were actually on the Basement sheet).
3. **Slice** → `scripts/art/atlas-manifest.json` lists every frame as `{sheet, t:[tx,ty,tw,th]}` (tile units; `px`
   for pixel rects — the animated objects; `split` explodes a floor block into variants).
   `node scripts/art/slice-atlas.mjs` shelf-packs them (2 px pad, 1 px extrude) into `interiors.png/.json` and
   regenerates `art/atlasFrames.generated.ts`, a string-literal union so a typo in a frame name fails `tsc`.
4. **Map** → `client/src/phaser/systems/exploration/art/artCatalog.ts`: `PROP_DEFAULTS` (type → how to draw it:
   a frame, or `parts` for a bay = bed + table + IV pole, or `fill` for benches built from 1×1 counter tiles,
   `layer: 'ground'` for mats and cable ducts, `anim` for the animated frames), `ROOM_PROP_OVERRIDES` (per room or
   per instance `"type@x,y"`), `ROOM_DECOR` (wall art, counter clutter, mats, wear — nothing with collision),
   `ROOM_INTERACTABLE_ART` (zone/item sprite + nudge), `ROOM_ART` (floor set, wall style, trim, lighting).
5. **Render** → `art/artRenderer.ts`: one RenderTexture for void/floor/face/trims/shadows/ground props/decor/wear,
   y-sorted sprites for everything else, a toggleable lighting container, `__QA__.art` snapshot. Collision comes
   from the shared `buildWallColliders` — the walkable layer never depends on art.
6. **Prove** → `node tests/art-substrate-capture.mjs after [rooms]`, `node tests/art-substrate-probe.mjs <room>`,
   `PW_CHANNEL=chrome npx playwright test tests/art-substrate-proof.spec.ts` (39 tests: atlas / depth / lighting ×13),
   `node scripts/art/grid.mjs before after`.

## 4. Room by room — what each one is made of

| Room | Floor · wall · trim | Mood (light) | Signature |
|---|---|---|---|
| Hospital Lobby | white tile · light blue w/ orange baseboard · white | bright, neutral | white reception counter with two intake staff out front, info stand, round white-framed benches, entrance mat, umbrella basket, wheelchair by the benches |
| Reception | gray-beige large tile · cream · cream | warm | wood U-counter with Riley's empty chair, stanchions, yellow/green benches, wheelchair + magazine shelf, fern, IV stand, toy chest, notice board + clock + sanitizer on the wall |
| Hallways ×5 | terrazzo · beige (1–3) / blue-gray (4–5) · cream | dim warm | fluorescent tubes on the wall, cork board, PHI-tip posters, wood benches, water cooler, drinks fridge, filing carts, a blinking server rack and cable rail in the IT hallway, exit sign + defibrillator + wheelchair before the ER |
| Break Room | parquet · pale green · cream | warm | two vending machines, open fridge, microwave on a counter, kitchenette with steaming coffee, conference-table lunch table with food, gray and orange sofas, the TV running LimeZu's hospital news report, green rug, floor lamp |
| Laboratory | white tile · blue-gray · white | cool, curious | double-sided white benches built from counter tiles with bottles/microscope on top, imaging station with a big monitor, CT-style centrifuge, glass fume hood, gray specimen fridge, glass bio cabinet, sink, eyewash, autoclave, bottle shelves, light rail on the wall |
| Medical Records | tan carpet · pale green · cream | dim, amber pools | steel drawer columns and narrow book shelves as the aisles, two bookcases to the ceiling, wooden counter with trays, clerk desk + drawers, shredder cabinet, scanner desk + fax, GERALD, archive boxes, a panning security camera |
| IT Office | dark raised-floor grid · gray · white | cold cyan | twelve blinking server racks (four 3-wide banks), an animated control-room screen wall, light rails, scrolling monitors, a blue control console as the monitoring desk, two console workstations, chalkboard "whiteboard wall", glass desk + copier (GERALD), retro terminal as the Threat Console, cable ducts on the floor, cameras |
| Emergency Room | blue tile · teal with crosses · white | cold, a red pool at the door | two patient bays (bed + side table + IV pole / monitor stand + table + pink bed) behind vertical blinds, two-PC nurse station, white-counter triage desk with a clipboard and red phone, exam-table gurneys, crash cart with ECG, equipment carts, animated patient monitors on the wall, whiteboard |
| Supply Closet B | tan · gray · cream | dim, one warm pool | bottle shelving + narrow bookcase, boxes, ladder on the wall, mop, basket, fern, trash — Mr. Whiskers' nest untouched |

## 5. What I deleted

`client/src/phaser/sprites/furniture/{index,coreFurniture,medicalLabFurniture,commonAreasFurniture,officeFurniture}.ts`
(3,441 lines), `client/src/phaser/systems/exploration/compositeFurniture.ts` (471), `client/src/phaser/sprites/objectTextures.ts`
(210), and the floor/wall/tint/decor/light-pool/furniture body of `roomRenderer.ts` (~560). What remains procedural:
the NPC fallback sheets (`npcTextures.ts`), the player fallback texture, the door frames/leaves (`DoorSystem.ts`,
Run 12's animated doors, now placed inside the two-row face for back-wall doors), and the small Run-12 ambience
overlays (LED blinks, monitor flashes, the ER "EMERGENCY" panel) which ride on top of the atlas props.

## 6. Every place gameplay geometry moved (all in `client/src/data/roomData.json`)

Rule (yours, from the checkpoint): the back wall is two rows, so props that stood on row 1 drop to row 2.
NPC spawns, zones, items, doors and spawn points are unchanged in every room; `tests/helpers/qa-helpers.ts`
constants are unchanged. Hallway PHI-tip items stay at row 1 — they hang on the wall as posters and are
interacted with from row 2, which the adjacency rule already allows. Every room was BFS-checked after the edit:
every NPC, zone, item and door still reachable from the spawn point.

| Room | Moved | Added (density pass) |
|---|---|---|
| all 13 | top `wall` obstacle 20×1 → 20×2 (10×1 → 10×2 in the closet) | — |
| hospital_entrance | big `plant` (17,1) 2×2 → (18,2) 1×1 | plant (1,2), trash_can (14,11), wheelchair (18,9), magazine_rack (1,12) |
| reception | plant (1,1)→(1,2); printer/GERALD (3,1)→(3,2) + `PRINTER_SPOTS`; cabinets (4,1)→(4,2), (14,1)→(15,2); plant (18,1)→(18,2); notice_board (1,3)→(13,1) wall | trash_can (6,3), wheelchair (1,11), toy_chest (18,13), plant (1,5), iv_stand (18,4) |
| hallway_reception_break | plant (10,1)→(10,2) | — |
| hallway_break_lab | plants (6,1)→(6,2), (13,1)→(13,2) | — |
| hallway_lab_records | plant (10,1)→(10,2) | — |
| hallway_records_it | plants (7,1)→(7,2), (12,1)→(12,2) | — |
| hallway_it_er | plant (14,1)→(14,2) | — |
| supply_closet | shelf (1,1)→(1,2); archive_box (7,1)→(7,2) | — |
| lab | — | plant (1,4), trash_can (1,13), box (18,13) |
| records_room | records_counter (8,1)→(8,2) | bookcase (1,2) 2×1, bookcase (17,2) 2×1, box (1,13), box (18,13) |
| it_office | server racks (1,1),(5,1),(12,1),(16,1) → row 2 | chair (1,8), chair (18,8), box (18,12) |
| er | — | trash_can (1,13), wheelchair (18,13), iv_stand (18,12) |
| break_room | — | plant (1,13), chair (7,8), chair (12,8), box (18,13) |

Also: the hallway bulletin board (the act-aware notice in `interactableFactory.ts`) moved from the wall centre to
cols 11–12 so it no longer sits on top of the PHI-tip poster; its anchor tile is (11,2). `PRINTER_SPOTS.reception`
(GERALD) moved with his copier. Nothing in `CONTENT_MANIFEST.md` changed — no content-bearing object moved.

## 7. Proof artifacts (`screenshots/art-substrate/`)

- `grid-before-vs-after.png` — all 13 rooms, before | after. (`grid-before-vs-after-vs-variantA.png` is the
  Reception checkpoint with the one-row alternative.)
- `<room>-before.png` (960×720, the original 1.5× display) / `<room>-after.png` (1280×960, pixel-exact 2×) for all 13
  rooms. The Records *before* shot carries the room's entry prompt (the capture script learned to click through
  it only after the before-shots were taken).
- `<room>-depth-<prop>-{behind,beside,front}.png` + `<room>-depth.json` — the player's live depth vs the prop's.
- `<room>-lighting-on.png` / `-off.png` + `<room>-lighting.json` — edge luminance with the layer on and off.
- `<room>-art-snapshot.json` — the `__QA__.art` dump: every prop's frame and depth, decor count, animated count,
  `missing: []`, image request count.
- `tests/art-substrate-proof.spec.ts` — **39/39 green** (13 rooms × atlas / depth / lighting), 3.7 min — re-run
  after the §7b changes at the 2× viewport; the lighting check now samples the floor's bottom corners
  (inside the walls), where the vignette lives, instead of the void column at the canvas edge.
- `tests/progression/*.spec.ts` — **31 passed, 0 failed, 4 skipped** (the `breach-gameplay` group is
  `test.skip` in the suite itself; unchanged), 5.3 min, run against the fully converted game and again after §7b at
  the 2× viewport — door unlocks,
  full playthrough, NPC interaction, room completion and navigation all green, zero console errors.
- `npm run check` (tsc) clean. `npm run test:data` 26/26. `npm run test:unit` shows 14 failures in
  `saveData.test.ts` that are **pre-existing** (verified identical on the base commit in a temp worktree):
  Node 26's experimental `localStorage` global shadows jsdom's, so `localStorage.clear()` throws in
  `beforeEach`. Not touched by this run; worth a one-line fix in the vitest setup later.

## 7b. Follow-up (same day): integer scaling + the brightness arc

You asked whether the rooms were dark and the floors "spotty". Measured answer: both were real, for two
different reasons, and both are fixed on the branch.

**Spotty = a 1.5× canvas.** `UnifiedGamePage.tsx` hard-coded a 960×720 box around the 640×480 game, so every
player saw pixel art upscaled 1.5× with nearest-neighbour — every other pixel row doubled, which turns the
floor's fine grain into uneven stripes (`screenshots/art-substrate/` had exactly that baked in). Now
`hooks/useIntegerZoom.ts` picks the largest **integer** zoom that fits the window (1×–3×), `PhaserGame`
auto-fits and re-fits Phaser on resize, and only when even 1× cannot fit does it fall back to a fractional
size — smoothed (`image-rendering: auto`), so it degrades to "soft", never "uneven". Probe
(`scripts/art/scale-probe.mjs`):

| window | canvas | scale | rendering |
|---|---|---|---|
| 1280×960 | 640×480 | **1.000** | pixelated |
| 1400×1100 | 1280×960 | **2.000** | pixelated |
| 2000×1500 | 1920×1440 | **3.000** | pixelated |
| 600×500 | 560×420 | 0.875 | smoothed fallback |

Trade-off to know about: a laptop window that used to get 1.5× (960×720) now gets a crisp 1× (640×480) unless
it has ~1300×1000 free for 2×. If that feels small on your machine, a "prefer 1.5× smooth" toggle is a
one-line change in the hook. `playwright.config.ts` and the capture scripts use a 1400×1100 viewport now, so
every `*-after.png`, depth and lighting shot is a pixel-exact 2× (1280×960); the `*-before.png` set is the
original 1.5× capture.

**Dark = mid-tone floors + the vignette, now graded by act.** The lighting layer itself cost 1–11 luma in the
room centre; the old floors were simply near-white. Per your call — start light, darken as the story goes —
floors and light now step down through the acts (`ROOM_ART`; `scripts/art/brightness.mjs`, mean luma of the
canvas centre, HUD excluded):

| Room (story order) | before | now | what changed |
|---|---|---|---|
| Hospital Lobby | 137 | **192** | white tile, vignette 0.18 |
| Reception | 194 | **202** | `floor.cream`, vignette 0.20 |
| Hallway 1–2 | 101 / 106 | **136 / 136** | light-gray stone, vignette 0.22–0.24 |
| Break Room | 170 | **163** | parquet kept (warm beats bright), vignette 0.22 |
| Hallway 3 | 105 | **128** | beige stone, vignette 0.28 |
| Laboratory | 198 | **185** | white tile, vignette 0.26 |
| Medical Records | 227 | **158** | carpet → beige stone, amber pools, vignette 0.30 |
| Hallway 4–5 | 100 / 105 | **117 / 116** | terrazzo, blue-gray wall, vignette 0.34–0.36 |
| IT Office | 127 | **108** | dark raised floor kept, vignette 0.40 |
| Emergency Room | 198 | **134** | blue tile kept, cold tint, red pool at the door, vignette 0.40 |
| Supply Closet B | 71 | **84** | secret stays dim |

Every floor set's own brightness is in the same script's output if you want to swap one (cream 221 …
dark grid 114).

## 8. Proud of / not proud of

**Proud of:** the IT office and the ER — they read as places at a glance, and the IT office moves (racks, screen
wall, monitors, camera) without a line of animation code in the scene. The lab benches built from counter tiles.
The fact that a room is now a data entry: the closet took twenty minutes. The atlas contact-sheet tool, which
turned "I think that's a sofa" into "that is a cabinet, here is the sofa".

**Not proud of / want your eyes on:**
- **Doors.** Still Run 12's procedural wooden frame + swinging leaf, drawn over the new thin wall tops; the back-wall
  closet door now sits inside the face. They work and animate, but they are the last brown rectangles in the game.
  LimeZu has animated doors (`3_Animated_objects/.../animated_door_*`) that would close this — a half-day.
- **The water dispensers** are LimeZu's white kiosk (`prop.machine.white`) in Reception and a stand + blender-bottle
  elsewhere. Neither is a great water cooler; the pack doesn't have one.
- **Zone and item icons** sit on counters and walls now but are still bobbing 1×1 pickups with gold rings.
- **The HUD** (banner, progress panel) covers the top 40 px of every wall and whatever is in the top-right corner.
  UI-03's problem, visible in every shot.
- **Lighting taste** is deliberately quiet. The numbers are all in `ROOM_ART`; the ER and IT office are the two
  rooms where I pushed it.
- The **hallways** are 4 floor rows now (they were 5) — fine to walk, but the wall is a third of the screen.
- The Run 12 ambience overlays (server-rack LEDs, monitor flashes, the fluorescent tube in Reception) were written
  for the old prop positions; they still draw on the new obstacle rects, so they land on the atlas racks and banks,
  but nobody has re-tuned them against the new art.

## 9. Caveats

- The dev server on :8080 during this run was another chat's process, but its cwd is this working tree, so Vite
  HMR served every edit; all captures are fresh page loads. The Playwright config reuses it.
- The in-app browser pane was not used for any proof (it throttles Phaser's rAF — see the memory note).

## 10. Next

Doors from the tileset (animated LimeZu doors, `DoorSystem.ts`), a proper water cooler (a custom 1×2 frame is
probably faster than hunting), re-tune the Run 12 ambience overlays to the new props, and then the UI runs
(UI-01..05) — the HUD is now the least finished thing on screen.
