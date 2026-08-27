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
2. **Pick frames from the pack's object list, not by tile** (§12) → `scripts/art/singles-index.mjs <sheet> <singlesDir>`
   locates every LimeZu single in its theme sheet and writes `scripts/art/singles/<sheet>.json` + a numbered 3×
   catalog; `scripts/art/objects.mjs <sheet> tx ty tw th` lists the separate objects in a region with exact rects
   (for sheets without singles); `scripts/art/cut-audit.mjs` proves no frame cuts an object. The older eyeballing
   tools (`sheet-inspector.mjs`, `tile-zoom.mjs`, `atlas-contact.mjs`) are still there for looking.
3. **Slice** → `scripts/art/atlas-manifest.json`: floors/walls/trims are tile rects `{sheet, t:[tx,ty,tw,th]}`
   (`split` explodes a floor block into variants); **every object is a pixel rect `px:[x,y,w,h]`** — the single's
   bbox, or the union of the singles that make one composite (runs of end/middle/end pieces are composed in the
   catalog with `parts` / `fillEnds` instead).
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
the NPC fallback sheets (`npcTextures.ts`), the player fallback texture, ~~the door frames/leaves (`DoorSystem.ts`,
Run 12's animated doors, now placed inside the two-row face for back-wall doors)~~ (tileset doors since §11), and the small Run-12 ambience
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
- **Doors.** ~~Still Run 12's procedural wooden frame + swinging leaf, drawn over the new thin wall tops; the back-wall
  closet door now sits inside the face. They work and animate, but they are the last brown rectangles in the game.
  LimeZu has animated doors (`3_Animated_objects/.../animated_door_*`) that would close this — a half-day.~~ **Done — §11.**
- ~~**The water dispensers** are LimeZu's white kiosk (`prop.machine.white`) in Reception and a stand + blender-bottle
  elsewhere. Neither is a great water cooler; the pack doesn't have one.~~ **Done — §12** (a painted cooler).
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

~~Doors from the tileset (animated LimeZu doors, `DoorSystem.ts`)~~ (done, §11), ~~a proper water cooler (a custom 1×2 frame is
probably faster than hunting)~~ (done, §12), re-tune the Run 12 ambience overlays to the new props, and then the UI runs
(UI-01..05) — the HUD is now the least finished thing on screen.

---

## 11. Follow-up (2026-08-23): doors from the tileset (§10 item 1)

**Open it:** `screenshots/art-substrate/doors-before-vs-after.png` — six door cases, left the Run 12 brown
rectangles, right LimeZu's doors; each as closed → ajar on approach → 150 ms after SPACE. Full rooms:
`grid-doors-before-vs-doors-after.png` (reception, two hallways, IT, the closet); every state in one
sheet: `doors-grid-after.png` (available / locked / completed / next / seam / found / bottom-wall).

### What is on screen now

| Door | Wall | LimeZu sheet | How it sits |
|---|---|---|---|
| 22 side-wall doors (every room ↔ hallway) | thin top-view wall line | `animated_door_vertical_right_1` (left wall) / `…_left_1` (right wall), frames 0–4 of 8 | Closed it is the door seen edge-on: an 8 px line standing in the 14 px wall line, 82 px tall (height + the bit of depth the 3/4 view shows), lintel rising over the wall above the gap. Open it has swung 90° **into the room** and shows its face — hinge on the wall, knob toward you. The 64×96 frame's bottom edge is the door tile's bottom edge; x is offset 3 px (left) / −35 px (right) so the closed line centres on the wall line. |
| the hidden closet door, once found | two-row back-wall face | `animated_door_big_1` (32×96; body 56 px at y 38..93) | Foot on the floor line, so the body fills the face under the cap and the leaf lifts toward the viewer when it opens. Behind it the renderer now paints a recess exactly the body's size (`artRenderer.ts`, after the ground pass) instead of two offset void tiles. |
| the closet's exit | bottom wall line | same big door | Standing in the gap of the bottom wall, facing the camera, y-sorted one row below the player — LimeZu has no "door seen from behind" (`museum_ticket_office_door_back` is baked into its own wall), and a door you can read beats one you can't. Same cheat Run 12 used, now with real art. |
| locked | any | big door: `animated_door_big_1_locked` (5-frame thud); side doors: a 2 px hinge shake | Dim tint + the `[X]`, **no swing** — see below. |

Not a LimeZu pixel is drawn by code any more: `buildLeaf`'s wood slab, the frame posts, header, highlight and
shadow are gone from `DoorSystem.ts`; the only Graphics left in the file are the unfound closet's seam, spill
and paw prints, which are deliberately not a door.

Colour: I sliced the taupe `_2` set first because it sat better on cream and beige. Closed, its edge-on
line all but vanished into the wall line — compare `doors-grid-after-taupe.png` with `doors-grid-after.png`,
same cases. The door is the navigation affordance; it has to read closed, from across the room, in a dark IT
office. Orange `_1` everywhere; one family for all 24 doors. (The hospital glass doors in the pack are
handsome and I looked hard at them — but a secret supply closet with a glass door is wrong, and two door
families across 24 doors would read as arbitrary.)

### Behaviour (Run 12's beats, unchanged, now frame-driven)

`openness` (1 closed → 0 open) still drives everything; `art/doorArt.ts` maps it to a frame step
(0–4), so ajar = frame 1 at 0.72, the walk-through = frames 1→4 over 230 ms before the 150 ms lead and the
fade, walk away = back to 0. The creak, the round-robin open sound, the secret stinger, the prompt text and
`nearDoor` are untouched. Two things did change:

- **A locked door no longer swings open before React says no.** `enter()` never checked the local state, so
  Run 12 opened the leaf, started the fade, and only then got `REACT_DOOR_LOCKED` and snapped back — the
  dark doorway is visible in the *before* sheet's locked rows. Now a locally-locked door rattles on SPACE
  (thud frames for the big door, a hinge shake for side doors, once per attempt), and `onDoorLocked` also
  rattles — which shuts a leaf that had opened on a stale 'available', so React stays the authority.
- **State dressing follows the door.** The blue/gold rings, the gold aura, the `[X]` and the ✓ badge centre
  on the door line (8–9 px off the tile centre for side doors) and sit just above their own door in depth,
  so the ring is no longer painted under the leaf.

Depth: side and bottom doors are y-sorted at `5 + row − 0.5` (behind you when you stand beside them, in
front of you when you walk up behind the closet's exit — which occludes your legs, correctly, since that door
is between you and the camera); the back-wall door is at 2, inside the face, behind everything on the floor.

### The bug I walked into: the closet was unreachable

With the two-row wall the hallway's top obstacle is 20×2, so the nearest a player can stand to the closet
door at (8,0) is row 2 — and `checkProximity` wanted `dy < 48 px` from the door tile's centre (64 px away).
Since the wall grew, nobody could find the closet by walking (and the hidden-door prompt never showed). Three
places assumed a one-row wall; all three now count `wall.rows`:

- `DoorSystem.checkProximity` — a back-wall door measures from the doorway's floor edge (last wall row);
- `ExplorationScene.init` — spawning from a `top` door lands on the first floor row, not inside the wall;
- `onQANavigateDoor` — same inward rule, so the QA navigator stops "forcing" the transition.

Pinned by a new proof (`hallway_break_lab → supply_closet → back`): found door at (256,64) depth 2, ajar
from row 2, frame 4 before the fade, spawn (5,6) inside the closet at its bottom door, back out to (8,2).

### Pipeline additions

- `scripts/art/atlas-manifest.json`: 4 sheets, 20 `px` frames (`door.side.r.*`, `door.side.l.*`,
  `door.face.*`, `door.face.locked.*`) → atlas now 681 frames, 1024×2154, 417 KB (+7 KB). Still one image
  request.
- `client/src/phaser/systems/exploration/art/doorArt.ts` — which door goes on which wall and the anchor
  numbers, shared by `DoorSystem` and `artRenderer` (the recess).
- Tooling, all `PW_CHANNEL=chrome`: `scripts/art/sheet-compare.mjs` (every frame of N vendor sheets side by
  side at 3× on a 32 px grid — how the door families were compared), `scripts/art/bbox.mjs` (opaque bbox per
  fixed-size frame of a sheet — how the hinge/foot numbers above were measured, not eyeballed),
  `scripts/art/frame-bbox.mjs` (same for sliced atlas frames, with row/col alpha profiles — how the wall
  line's 14 px was found), `scripts/art/png-zoom.mjs`, `scripts/art/doors-compare.mjs` (the before/after
  sheet), `tests/art-doors-capture.mjs <suffix>` (the door close-ups: closed / ajar / after SPACE for
  eight cases, with seeded progress so completed/next/locked all appear).
- `window.__QA__.doors` — every door's kind, atlas frame, anchor, depth, state and openness, live through
  the swing (published on each frame change).

### Proof

- `tests/art-substrate-proof.spec.ts` — now 53 tests: the Run 11 39 (atlas / depth / lighting × 13) plus
  **doors × 13** (every door's frame is `door.*` on the expected anchor and depth, or a seam for the
  unfound closet; with "everything before the previous department" seeded, the way back cracks ajar on
  approach and reaches frame 4 before the target room loads, the way forward stays on frame 0 and the
  room does not change) plus the closet round trip. **53/53 green**, 5.7 min, run against the final atlas at the 2× viewport.
- `tests/progression/*.spec.ts` — **31 passed, 0 failed, 4 skipped** (the `breach-gameplay` `test.skip` group, unchanged), 5.3 min — door unlocks, full playthrough, NPC interaction, room completion and navigation all green, zero console errors. `tests/living-world-feel.spec.ts` 3/3.
- `npm run check` clean. `tests/art-doors-capture.mjs` and `tests/art-substrate-capture.mjs`: console clean
  on every capture. `tests/living-world-feel.spec.ts`'s door stills (`screenshots/living-world/feel/door-*.png`)
  still shoot the reception door; nothing in it asserted on the old pixels.

### Not done / for your eyes

- The ajar pose is LimeZu's frame 1 — a bigger crack than Run 12's 28 % of a leaf. It reads as "opening for
  you"; if it is too much, the only smaller step the sheet offers is none.
- The lintel of a side door rises ~50 px over the wall line above the gap (that is how the pack draws
  them); in hallways that puts its top 18 px into the back-wall's face region at the corner. It reads as a
  door frame; it is visible in `hallway_it_er-doors-after.png`.
- The closed big door's top overlaps the cap's lower 4 px (56 px door, 64 px face, 12 px cap). The cap's dark
  bottom line and the door's outline coincide, so it does not show — but it is a 4 px cheat.
- Labels are unchanged (still `6px` text under the door; "Supply Closet B" still runs across the closet
  door's lower panel as before).
- Working-tree note: `package.json`, `server/index.ts` (a `DEV_HOST`/`dev:tailscale` change) and the
  `gameData.json` / `roomData.json` copy rewrites are **another session's uncommitted edits** that were in
  this tree — not part of this item, not touched, and to be excluded from this item's commit.

---

## 12. Follow-up (2026-08-23): the cut-off objects — every frame re-sliced from the pack's own object list

**Open it:** `screenshots/art-substrate/audit-break-room-before-vs-after.png`, `audit-er-before-vs-after.png`,
`audit-reception-before-vs-after.png`; all thirteen rooms in `grid-audit-before-vs-audit-1.png`
(`<room>-audit-before.png` / `<room>-audit-1.png` are the 2× captures behind it).

### What was wrong, and why it was everywhere

You were right about the cause. LimeZu's theme sheets are laid out for tile-map editors: every object is
cut into 32-px-wide (and often 32-px-tall) *singles* — a reception counter is four of them, the conference
table seven, a couch three, a glass cabinet an end/middle/end — and the sheets pack those singles edge to
edge, with small props sitting between tile boundaries rather than on them. The first Run 11 pass sliced by
tile coordinates read off a contact sheet, which cannot work on that layout: a tile rect either cuts the
object (the TV was 2 of its 3 columns, the patient monitors were the top row of a 2×2, the ER "bed" was
three one-tile cots stacked, the copier was the lower 1×2 of a 1×2.5, every clock/poster/sign was a 1×1
window on a 1×2 object) or drags a neighbour in (the clipboard frames carried the next object's pen, the
"gray vending machine" rect was offset a full column so half the machine drew in the wrong tile).

Measured, not eyeballed: `scripts/art/cut-audit.mjs` checks, for every sliced frame, whether the object's
opaque pixels continue past the rect's edge in the source sheet. **283 of 606 manifest frames were cut;
123 of those were on screen.** Tile rects were the wrong tool for this pack, full stop.

### What I did

1. **Indexed the pack's singles.** `Theme_Sorter_Singles_32x32/` holds one PNG per object (numbered, not
   named). `scripts/art/singles-index.mjs` locates each single inside its theme sheet by exact pixel match
   (anchored on its rarest colour) and writes `scripts/art/singles/<theme>.json` — 428/550 hospital singles
   placed in 1.6 s, plus kitchen 356, basement 185, living 87, studio 78, conference 58 — and renders a
   numbered 3× catalog of each theme (`scratchpad/audit/singles-<theme>-NN.png` during the run). The
   classroom export does not match its sheet and the generic sheet ships no singles; those use connected
   components instead (`scripts/art/objects.mjs`, `scripts/art/tighten.mjs`).
2. **Rebuilt the manifest.** Every object frame is now a *pixel* rect — the single's opaque bbox
   (`_single: "hospital#333"`), a component bbox, or, for composites, the union of the singles that make
   the whole object (`_note`). the 82 frames `frames-vs-singles.mjs` marked exact/cut took their single's rect directly; the 40
   merged cases I looked at one by one. 282 unreferenced frames dropped; the atlas went from 681 frames / 417 KB to 453 / 229 KB.
3. **Rebuilt the compositions** (`artCatalog.ts`) around whole objects: counter runs get real end pieces
   (`fillEnds` on `PropDef`, `artRenderer.ts`), glass cabinets/fume hood compose end+middle+end,
   workstations compose console ends, the nurse station is two different 2.2-wide stations, patient bays
   are side-view beds + bedside cabinet + IV pole, the crash cart is the monitor cart, the microscope
   station is LimeZu's whole 84×78 composite, the kitchenette's two counter rows butt (22-px counters).
4. **Logic pass, room by room** (all 13 checked at 2× after the fix):
   - Break room — the *phone on a chair*: the zone tile (12,7) sits above the mirrored chair (12,8); it now
     has a side table under it and the phone sits on the table. The *egg* was a bread roll placed a row too
     high (off the table, on the floor); lunch is on the table now. The gray "couch" was a 3×2 slice of an
     L-shaped sectional (it read as lockers) → a front-facing 3-seat sofa (3 singles); the orange one was
     whole all along (LimeZu's top-down couches look like that) but swapped for the matching sofa. The
     snack machine is LimeZu's standalone 2×3 machine (#117); the gray one is #105, whole, centred.
     `mug.red` was LimeZu's dish rack — the reception counter mug, the NPC "sip" fidget icon
     (`npcLife.ts`) and the "overheard conversation" zone all drew a dish rack; now a mug, a mug, a plate.
   - Reception/lobby — GERALD is a whole copier (lid + body), the filing cabinets are hospital lockers
     (the old ones were a 2×2 window on a kitchen base-cabinet run), the "water dispenser" kiosk and the
     hallway "stand + bottle" (which was a **blender with a power cord**, kitchen #183) are replaced by a
     real water cooler — item 2 done: painted in the pack's palette, `scripts/art/custom-props.mjs` →
     `attached_assets/art-src/custom_props_32x32.png`, sheet id `custom`. Waiting "chairs" are pairs of
     LimeZu's waiting-room chairs. The lobby "coffee cart" (Run 12 ambience) was a bedside cabinet with
     steam coming off it → a wood table with the espresso machine. The "patient rights poster" item drew
     a PC monitor → a chart sign.
   - Lab — `bottle.orange` was a plate of food and `papers.b`/`bottle.blue` a small glass desk (so the
     benches had glass desks and lunch on them); the bench clutter is hospital bottle groups now. The
     "microscope" decor was the 2×1 middle of the station. The bottle "hanging on the wall" at (8,1) is
     gone. Sink station = the hospital sink counter; autoclave = the hospital autoclave (#111).
   - IT — the screen wall is the top two of its three monitor rows (the cut falls in the gap between rows;
     the 4×3 doesn't fit a 2-row wall), the glass desk is its real 2-wide self with the copier beside it,
     the IT table was a 4-px sliver of a table plus a post → a wood desk, "headphones" (no such single)
     → a monitor on its stand.
   - Records — drawer columns are whole 32×110 units (one finished side each; the seam side is a drawer
     seam), corkboard moved off the wall the bookcase now covers, trays are tables with papers/binders.
   - Hallways — fluorescent tubes are the whole 96-px tube and hang near the top of the face (they sat on
     the floor line); vending is the blue drinks machine (#119).
   - Every room — clocks, posters, signs, pictures, first-aid box, light switch, dispensers, plants, IV
     poles, wheelchairs (a 2-wide object previously drawn 1 wide), exam tables, carts: whole.
   - A renderer quirk you could see in the closet and hallways: floor painted under the 14-px wall trims
     showed beyond the wall line in camera-centred rooms. Void now covers the outer strips.
5. **Proof.** `cut-audit.mjs` on the rebuilt manifest flags only seams (adjacent animation frames, run
   pieces, objects touching their neighbours in the sheet) — each checked. `tests/art-substrate-proof.spec.ts`
   **53/53 green** (5.8 min, 2× viewport; depth/lighting/door checks all on the new frames); `tests/progression` **31 passed, 0 failed, 4 skipped** (the `breach-gameplay` skips, unchanged; 5.3 min); `npm run check` clean, zero console errors
   in every capture.

### Still not right / your eyes

- `document_cart` / `filing_cart` are LimeZu bedside cabinets (no carts with wheels in the pack).
- The `centrifuge` is still a CT scanner + autoclave — lab machines, not a centrifuge.
- `coat_rack` is a floor lamp; `chairs` footprints (2×1) hold two 28-px chairs with a 3-px margin.
- Vending machines are 46×66 on 64×96 footprints, so you stop a little short of them; the lunch table is
  2.1 rows of art on a 3-row footprint (as before). Both are roomData footprints I left alone.
- The Run 12 ambience overlays (LED dots on the break-room floor, the ER "EMERGENCY" panel, the sconce glow
  that no longer lines up with the raised tube) are item 3 and untouched.
- Tooling added: `cut-audit.mjs`, `objects.mjs`, `tighten.mjs`, `singles-index.mjs`, `frames-vs-singles.mjs`,
  `custom-props.mjs`, `crop-pair.mjs`, `bbox.mjs`, `frame-bbox.mjs`, `png-zoom.mjs`, `sheet-compare.mjs`.
  The rule from here: **never slice LimeZu by tile; pick the single (or compose singles)**.

---

## 13. Follow-up (2026-08-25): the room-clean loop — every room swept by fresh eyes until zero defects

Your verdict after §12 ("still not quite there — too many sprites cut in half, too many placed weirdly...")
became a standing QA loop: one fresh-context **fixer** agent per room (captures the running game, reads
nine overlapping 3× crops, fixes, repeats until TWO consecutive fully clean sweeps), then a separate
**blind reviewer** agent (same sweep, no access to the fixer's notes, PASS/FAIL verdict), with reviewer
FAILs fixed at master level and re-verified. Protocol: `.planning/fable-runs/ROOM_CLEAN_PROTOCOL.md`.
Every round is logged in `.planning/fable-runs/room-clean-log.md`.

**Open it:** `screenshots/art-substrate/grid-audit-1-vs-clean.png` (all 13 rooms, §12 state vs final);
per-room finals are `<room_id>-clean.png`, reviewer captures `<room_id>-review.png`.

### Results by room (defects found+fixed by fixers / blind-review verdict)

- break_room 15 / PASS after 1 master fix round · reception 7 / PASS after 3 · hospital_entrance 9 /
  PASS after 6 · lab 10 / PASS after 1 · records_room (2 rounds, 529-killed fixer replaced) / **PASS
  outright** · it_office 15+3 / **PASS outright** · er 14 / FAIL→PASS (see below)
- Hallway batch (one fixer): reception_break 4, break_lab 6, lab_records 4, records_it 3, it_er 3,
  supply_closet 0. Blind reviews (two parallel reviewers, 3 rooms each): four PASS outright;
  break_lab FAIL (4 real findings) and it_er FAIL (1) → master-fixed → PASS.

### The finds worth remembering

- **Every IV pole was secretly two poles.** `prop.ivpole.a` AND `.b` each spanned two stacked drip-stand
  singles; all five ER poles + composites now use `prop.ivpole.single`. The doubles are deleted.
- **The "wheelchair" was a mop.** `prop.wheelchair.side.tan` is LimeZu's mop-and-bucket single; it stood
  in hallway_it_er as a parked wheelchair. Now `prop.wheelchair.front.tan`; the misnamed frame is deleted.
- **The nurse station's floating monitors** (er reviewer): singles #544/#545 bake their back monitor 4px
  above the counter — invisible against a wall, floating over floor on a free-standing island. Fixed by
  splitting each single into body/counter/monitor pixel rects and re-seating the monitor (dy −45/−47).
- **Painted light is a trap.** The sconce flicker halo+cone ellipses read as wall stains to both blind
  reviewers ("light can't pool on a vertical plane"); the flicker now tweens the tube sprite's own alpha
  and nothing is painted on bare wall. Same family: the act-tint "ribbon" floated with no board under it
  (deleted), window/monitor glows re-anchored onto art pixels in every room, dust motes clamped to the
  floor band and spawned under the actual sconces.
- **Icons need furniture.** Fresh eyes consistently failed any pickup/zone icon on bare floor; every one
  now sits on a desk, counter, stand, or hangs on the wall (display-stand pattern in artCatalog).
- **Blind review works.** Six of nine reviewer rounds found real defects the fixer's saturated eyes had
  passed — including the two-monitor miss after a 14-fix ER round. Two consecutive clean sweeps + a
  blind PASS is the bar that finally stuck.

### Proof

`tests/art-substrate-proof.spec.ts` 53/53 (one test updated: the reception_break depth pin follows the
logged plant move (10,2)→(9,2)); `tests/progression` 31 passed / 4 skipped; zero console errors in every
capture; `npx tsc -p .` clean. Files: artCatalog/roomAmbience/manifest churn per room-clean-log;
roomData.json obstacle-only moves (all logged); one hardcoded hallway-board y in interactableFactory.ts
(0→14, commented); atlas now 455 frames.

### Left open, deliberately

- The hidden supply-closet door seam in hallway_break_lab reads as a "stray black line" to fresh eyes —
  it is the Run 12 discoverable-door hint, kept.
- The supply closet's "Zz Test" NPC name label reads as leftover QA naming (reviewer observation) —
  NPC data was out of scope for this loop; worth a rename in gameData/roomData whenever you touch copy.
- Reviewer taste notes (poster-height variance, it_er's blank blue poster + bare east wall, records_it's
  free-standing server rack, the 1px learn-zone ring vs a softer pulse) are logged, unactioned.
