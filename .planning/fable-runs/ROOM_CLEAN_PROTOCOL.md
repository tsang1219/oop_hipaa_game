# Room-clean protocol (Run 11, art substrate — visual QA loop)

You are cleaning ONE room of PrivacyQuest until every object in it is **whole, correctly placed, and
recognizable**. Two prior passes fixed the systematic slicing bugs; what remains is what only eyes catch:
sprites still cut off or overlapping, composites with visible seams or missing ends, objects that read as
the wrong thing, wall items at the wrong height, art that doesn't match its footprint. Work only from
screenshots of the running game. Do not trust the code, the catalog names, or any prior report — including
this file's authors. If a frame claims to be a mug, render it and look.

The bar is CLAUDE.md's Nintendo test: would this room pass in a polished SNES-era RPG? "It works" is not
done. A room is done when a full zoom sweep finds **zero** defects, twice in a row.

## Environment

- Dev server must already be on `http://localhost:8080` (Vite HMR serves your edits; code/catalog changes
  hot-reload, atlas PNG changes need a page reload, which every capture does anyway). Check with
  `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/`. If it is down, start it yourself with
  Bash `run_in_background`: `NODE_ENV=development npx tsx server/index.ts` and re-check.
- Playwright uses Google Chrome: always `PW_CHANNEL=chrome`. Screenshots come out at 2× (1280×960 canvas
  in a 1400×1100 viewport). The in-app browser pane is NOT usable for proof (throttled rAF).
- `npx tsc -p .` must stay clean; every capture script prints console errors — they must stay clean too.
- Another chat sometimes edits this working tree. Never touch `package.json`, `server/index.ts`,
  `client/src/data/gameData.json`, or anything outside the files listed below.

## The art pipeline (what you may edit)

1. `scripts/art/atlas-manifest.json` — every atlas frame. Floors/walls/trims are tile rects (`t`), **every
   object is a pixel rect** (`px: [x,y,w,h]` on its source sheet). `_single: "hospital#333"` records which
   LimeZu single it is. After ANY manifest change: `node scripts/art/slice-atlas.mjs` (rebuilds the atlas +
   the `AtlasFrame` TS union; a dropped/renamed frame fails `tsc`, which is how you find stale references).
2. `client/src/phaser/systems/exploration/art/artCatalog.ts` — the ONE data file mapping rooms to frames:
   - `PROP_DEFAULTS`: obstacle `type` → PropDef. `ROOM_PROP_OVERRIDES[room]["type@x,y"]` overrides per
     instance.
   - PropDef: `{ frame }` draws one sprite bottom-CENTER-anchored on the footprint's bottom edge, y-sorted
     (`depth = 5 + bottomRow`). `anchor: 'wall'` hangs it on the back-wall face (depth 2, top-anchored at
     `oy*32 + dy`). `layer: 'ground'` bakes it into the floor. `parts: [{frame, dx, dy?...}]` composes
     several sprites, each **bottom-LEFT** anchored at `(ox*32 + dx, footprintBottom + dy)`. `fill` +
     `fillEnds` tile a counter run per footprint tile (ends first/last per row). `flipX`, `alpha`,
     `depthRow` as needed.
   - `ROOM_DECOR[room]`: non-solid dressing. `layer:'wall'` top-left anchored at `(tx*32+dx, ty*32+dy)`;
     `layer:'floor'` baked into the ground; `layer:'prop'` bottom-center anchored at
     `(tx*32 + cols*16 + dx, (ty+1)*32 + dy)`, depth `5 + (depthRow ?? ty) + 0.5`.
   - `ROOM_INTERACTABLE_ART[room]`: the zone/item pickup sprites (they bob with a gold ring), `dx/dy`
     nudges.
3. `client/src/data/roomData.json` — ONLY prop obstacle rects (position/size) may move, and only when the
   art genuinely needs it (the user approved nudging props). NPC, zone (`interactionZones`), item
   (`educationalItems`), door, spawn positions are untouchable. If you move an obstacle, note it in your
   report and keep every NPC/zone/item/door reachable (walkable path — check the capture).
4. `client/src/phaser/systems/exploration/roomAmbience.ts` — Run 12 per-room overlays (server-rack LED
   blinks, monitor flashes, the Reception fluorescent tube, the ER "EMERGENCY" panel, sconce glows, the
   lobby coffee-cart steam, drifting carts). These were tuned to the OLD procedural props: if an overlay
   floats over nothing, blinks on bare floor, or is misaligned with today's art, re-anchor it to the
   current prop's pixels or delete it. This is in scope — stray LED dots on the floor are exactly the kind
   of "placed weirdly" the user sees.
5. `scripts/art/custom-props.mjs` — paints the few objects LimeZu lacks (currently the water cooler) into
   `attached_assets/art-src/custom_props_32x32.png` (sheet id `custom`). Extend it only when the pack truly
   has nothing (sample palette colours from neighbouring LimeZu objects; run it, then re-slice).
   Do NOT edit: `artRenderer.ts` / `DoorSystem.ts` / `doorArt.ts` (doors are done and proven) unless a
   defect is impossible to fix in data — then explain why in your report.

## Iron rules for choosing art

- **Never slice a LimeZu sheet by tile coordinates.** The sheets pack 32-px "singles" edge to edge, off the
  tile grid. Every object rect must be a single's pixel bbox or a deliberate union of singles.
- **The singles index is the source of truth**: `scripts/art/singles/<theme>.json` (hospital, kitchen,
  basement, living, tvstudio, conference) maps LimeZu's one-object-per-file singles to exact
  `bbox: [x,y,w,h]` rects on each theme sheet. Regenerate browsable, numbered catalogs any time with
  `PW_CHANNEL=chrome node scripts/art/singles-index.mjs <sheetId> "<singlesDir>" --scale 3 --page 352`
  (pages land in the path it prints). Singles dirs live under
  `attached_assets/vendor/modern-interiors/1_Interiors/32x32/Theme_Sorter_Singles_32x32/`.
- **Look before you use.** Render any frame you intend to place:
  `PW_CHANNEL=chrome node scripts/art/atlas-contact.mjs --prefix prop.foo --out /tmp/f.png` then Read it.
  Known traps already caught: "mug.red" was a dish rack, "watercooler.top" a blender, "bottle.orange" a
  plate of food, "papers.b" a glass desk. Assume more exist.
- **Composites**: multi-tile LimeZu furniture is end/middle/end singles. Compose with `parts` (align them
  so seams are invisible — same y, touching x) or `fillEnds` runs. Mind perspective consistency: don't mix
  top-down and front-facing furniture of the same kind in one room.
- `scripts/art/objects.mjs <sheetId> <tx> <ty> <tw> <th> --scale 3` lists every separate object in a sheet
  region with exact rects + a labeled zoom — use it for sheets without singles (generic, classroom).
- `PW_CHANNEL=chrome node scripts/art/cut-audit.mjs` proves no manifest frame cuts an object (flags that
  are only touching neighbours/animation strips are fine). Run it after manifest edits.

## The loop (repeat until clean)

1. **Capture**: `PW_CHANNEL=chrome node tests/art-substrate-capture.mjs clean<N> <room_id>` →
   `screenshots/art-substrate/<room_id>-clean<N>.png` (2×, console errors printed — must be none).
2. **Sweep**: `PW_CHANNEL=chrome node scripts/art/room-sweep.mjs screenshots/art-substrate/<room_id>-clean<N>.png <outDir>`
   → nine overlapping 3× crops covering the whole canvas. **Read every crop.** Then zoom any suspicious
   cluster tighter with `scripts/art/png-zoom.mjs <png> <x> <y> <w> <h> <scale> <out.png>` (coords are
   pixels of the 2× screenshot; world px = screenshot/2; tile = world/32).
3. **List defects** before fixing anything. For each: location (tile), what's wrong, root cause
   (frame rect? composition? placement dy? wrong object? overlay?). Check against this list:
   - cut/truncated sprites; visible seams or gaps inside composites; missing run ends;
   - overlaps that read as intersection (two objects occupying the same pixels implausibly; wall items
     colliding with each other or hidden behind tall props; props poking through walls or the HUD area —
     HUD occlusion top-right is expected, ignore it);
   - floating objects (feet not on the floor for their footprint row; shadows detached);
   - wrong identity (doesn't read as what the room needs; mismatched scale vs the 32-px, 48-tall cast);
   - wall items outside the face band (face = y 0..64 world; cap is the top ~12 px — keep items below it
     and above the baseboard at ~56-64);
   - zone/item pickups sitting on nothing or inside furniture;
   - ambience overlays (LED dots, glows, panels) on bare floor or misaligned;
   - depth errors (a prop drawing over a character that stands in front of it, or vice versa).
4. **Fix** via the files above. Manifest touched → re-slice + `npx tsc -p .`. Then wait ~2 s and re-capture.
5. **Done** when a full sweep (all nine crops, fresh capture) yields zero defects — then do ONE more
   fresh capture + sweep to confirm nothing regressed. Two consecutive clean sweeps = done. If a defect
   cannot be fixed within the rules (needs geometry you may not move, or art the pack lacks and painting
   is out of proportion), document it precisely instead of hacking around it.

## Deliverables (every fixer run)

- Final screenshot `screenshots/art-substrate/<room_id>-clean.png` (copy your last capture to this name).
- Append to `.planning/fable-runs/room-clean-log.md`: `## <room_id> — <date>`, the defect list you found
  (fixed vs remaining), every file you changed and why, any obstacle you moved.
- Your final agent message: the defect count found/fixed, what you changed (files + one-liners), anything
  remaining with reasons, and the path of the final screenshot. No pep talk, just the facts.

## Reviewer protocol (separate fresh-context agent; no fixing)

Capture the room yourself (`tests/art-substrate-capture.mjs review <room_id>`), run the same nine-crop
sweep, read every crop, and report: a numbered defect list (tile coords + what/why) and a verdict —
**PASS** (zero defects) or **FAIL**. Judge only what you see; do not read the fixer's log or diff first.
Apply the same checklist and the same bar. Do not edit any file.
