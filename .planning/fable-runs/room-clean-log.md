# Room-clean log (Run 11 visual QA loop — one fixer + one reviewer per room)

## STATE (master updates this as rooms complete — a new chat resumes from here)
Protocol: `.planning/fable-runs/ROOM_CLEAN_PROTOCOL.md` (fixer + reviewer instructions, tools, rules).
To resume in a fresh chat: "Act as master for the Run 11 room-clean loop. Read ROOM_CLEAN_PROTOCOL.md
and room-clean-log.md, then continue the loop from the next queued room: spawn a fresh fixer subagent,
then a blind reviewer; fix reviewer FAILs at master level or via another fixer; log every round here."

- **ALL 13 ROOMS DONE** (fixer + blind review + master fixes where FAILed, verified): break_room,
  reception, hospital_entrance, lab, records_room, it_office, er, the 5 hallways, supply_closet.
  Reviewer FAILs and their master fixes: er (nurse-station monitor split), hallway_break_lab
  (dispenser wall-mount, sign dy, sconce-flicker rework, mote clamp), hallway_it_er (sconce-flicker
  rework) — see the per-room reviewer rounds below.
- **NEW PHASE (2026-08-26): interior design pass** — user verdict on the cleaned rooms: walls still
  had "half TVs" (the six 20x32 prop.poster.* panels — ALL replaced by the whole prop.tv.wall
  single #265 / sign.chart / sign.small / landscape.b; poster frames deleted; break_room rubbish
  pile deleted) and "furniture placement is sparse and kind of bizarre — create an interior design
  pass to lay out the furniture in a good way, include their text too, i don't mind" = NPCs/zones/
  items MAY now move (positions only, text untouched). Protocol:
  `.planning/fable-runs/INTERIOR_DESIGN_PASS.md`. Room order: break_room, lab, it_office, er,
  hospital_entrance, reception, records_room (hallways + closet excluded — corridors read fine).
  Designer then blind reviewer per room, same loop mechanics.
  DESIGN PASS COMPLETE (2026-08-29): break_room PASS outright · lab FAIL(7)→master-fixed→PASS ·
  it_office FAIL(2)→fixed→PASS · er PASS outright · hospital_entrance FAIL(4)→fixed→PASS ·
  reception FAIL(3, incl. the wood-counter split-line depth fix)→fixed→PASS · records_room
  FAIL(3, incl. GERALD-copier wall-anchoring)→fixed→PASS. Recurring traps documented per round:
  table.small.white banned (read as chair/printer twice), nightstand prop.table.phone.wood is
  the pedestal, wall items share one hang line + stay off cap (top 12px) and baseboard (56-64)
  bands, pale bodies need a dark backing (wall band) not just a shadow.
  WRAP-UP IN PROGRESS: full proof + progression suites, 13 fresh `-final` captures (hallway
  `-clean` shots predate the tv.wall tip swap), grid, RUN_REPORT append, memory, commit list.
- AFTER THE DESIGN PASS: full proof + progression suites (designers update depth-trio pins for
  moved props as they go), rebuild the grid, append RUN_REPORT-11.md, update auto-memory, present
  the commit list. Nothing is committed yet.
- GLOBAL changes later rooms must respect (already applied): clipboard frames are board-only; the
  tray tables (`table.small.*`) have their legs; door labels render at depth 30; `sink.counter` is
  the counter body only; `infostand.blue` is the clean right-hand stand; notice/bulletin boards hang
  at dy -8/-6; records inbox/outbox are tray/binders directly on the counter; lab benches are a butted
  composite; bathroom sheet registered (`prop.sink.wash`); `prop.table.small.gray` rect is 22x18
  (was baking a white-sack corner at 22x32); `monitor_bank` is a counter+anim.monitor composite
  (it_office-only type); pickups on bare floor get a display stand (`prop.table.small.gray` decor).
- Watch items carried between rooms: `prop.wheelchair.side.tan` was LimeZu's MOP-AND-BUCKET single
  (frame kept but misnamed — hallway_it_er still draws it at (10,5); hallway fixer must swap to
  `prop.wheelchair.front.tan` or a real side-view wheelchair, or retire the frame); ivpole.a/b +
  blinds.blue/tan frames are DELETED (ER now uses ivpole.single + curtain.blue/tan); reviewers ruled
  bare-floor litter reads as debris in public rooms; capture blanks/one-off page errors = Vite reload
  race (wait 3 s, re-capture).


## break_room — 2026-08-23

User verdict driving this pass: "Too many sprites cut in half, too many placed weirdly, too many look
cut off on the walls, next to other objects, incomplete desks."

### Defects found (sweep 1) — all fixed

1. Vending LED ambience dots blinking on bare floor above both machines — overlay anchored to the
   footprint's top-right; the art sat ~30px lower. Fixed in roomAmbience: LED anchored into the
   machine art (center+16, footprintBottom−58).
2. Both vending machines (2,2)/(5,2) stood a full tile below the wall base (2x3 footprint, 66–68px
   art) and read free-standing mid-floor while the open fridge next to them hugged the wall.
   Fixed: obstacles 2x3 → 2x2 (bottoms now y=128, tops overlap the wall base like the fridge).
3. staff_corkboard zone icon (prop.poster.orange) drawn over the notice board's right panel,
   frame-on-frame, spilling past the board's bottom. Fixed: icon dx+24/dy−34 → hangs on the empty
   wall face beside the board.
4. Microwave composite: 44x38 prop.microwave.a floated over the wall face and collided with the cup
   picture (14,0); its 32x22 counter slab read as a detached orange cube. Fixed: rebuilt (below).
5. Coffee-station composite: 2px floor slit between fridge and counters; two butt-jointed 22px
   counter rows (dy −22) read as a stacked hutch with a horizontal seam; mug oversized on the tiny
   top. Fixed: rebuilt (below).
6. Upper cabinet (prop.cabinet.upper.beige, 42x58 hospital slab) read as a featureless tan door
   filling the wall face. Fixed: swapped for the kitchen glass-door upper cabinet.
7. Phone zone icon (32x26 prop.phone.sky) dwarfed its 22x18 side table and read as a giant phone
   teetering on a stool. Fixed: table swapped to a 32x40 nightstand (living#65), icon dy −27 so the
   phone rests on its top.
8. Both wooden side chairs (7,8)/(12,8) (generic chair.wood.side.*) read as slatted crates; the tan
   one hid the gossiping NPC's legs. Fixed: swapped to basement cushioned stools (blue @7,8,
   red @12,8) which read instantly and don't swallow the NPC.
9. overheard_conversation plate icon straddled the lunch table's front edge (half on skirt, half on
   floor). Fixed: dy −14 → −44, plate sits fully on the tabletop.
10. prop.rubbish decor at (12,5) alpha 0.5 read as a ghost smudge on open floor, two tiles from the
    bin. Fixed: moved to (14,7) beside the trash bin's base, alpha 0.75.
11. verbal_disclosure clipboard floated on bare parquet at (17,4). Fixed: dy −50 — reads as a note
    stuck to the kitchenette fridge door (item icons render at depth 10, above props).
12. The 96px tvnews TV floated ~17px above its footprint (20px transparent bottom padding in the
    anim cells) with no stand, overhanging the 2x1 footprint both sides. Fixed: composed onto a
    64x42 wood dresser (living#53) with the TV at dx −16 / dy −10 so the screen sits on the
    dresser top.
13. Couch (15,10) used prop.couch.gray.3b — the back-view row of the basement sheet — and read as a
    lidded chest facing the wall. Fixed: front-view prop.couch.gray.3 with flipX for variety.
14. Coffee-station steam puff overlay anchored at the old prop position (col 16.5 on the wall face,
    over the upper cabinet). Fixed: block deleted — the anim.coffee frames carry baked steam.
15. Microwave ambience flash anchored at the old 1x1 footprint center (y=80, on the wall face).
    Fixed: anchored to the microwave body on the counter (footprintBottom−36).

False alarms checked and cleared: the "Z + !" over the couch is the tired employee's yawn/quest
marker correctly anchored to the NPC (transient); the trash bin is whole (28x34, bottom exactly on
its footprint); the side-door "planks" are the door system's standard edge-on door, out of scope.

### Kitchenette rebuild (defects 4–6)

One continuous tan counter run (kitchen#291/292/293 = prop.counter.kt.l/m/r, 28px tall, all bottoms
at y=128) across cols 14–16, with the white microwave (kitchen#187 = prop.microwave.b) on col 14,
the animated coffee maker on col 15, the blue mug on col 16, and the gray fridge (dx 62, flush
against the counter end) capping col 17. Glass-door upper cabinet (kitchen#123+124+125 union,
92x28) on the wall above cols 15–17. Appliances sink ~4px into the counter top surface.

### Files changed

- scripts/art/atlas-manifest.json — added prop.counter.kt.l/m/r, prop.microwave.b,
  prop.cabinet.upper.wood, prop.tv.sideboard, prop.stool.blue, prop.stool.red,
  prop.table.phone.wood; deleted the replaced frames (counter.k.plain/drawers/shelf/end,
  microwave.a, cabinet.upper.beige, chair.wood.side.tan/orange, couch.gray.3b). Re-sliced; tsc clean.
- client/src/phaser/systems/exploration/art/artCatalog.ts — microwave + coffee_station defaults
  rebuilt; break_room overrides (stools, flipped front couch, TV-on-dresser composite); decor
  (upper cabinet, nightstand, rubbish move); all four interactable icons re-anchored.
- client/src/data/roomData.json — break_room obstacles only: vending_machine (2,2) and (5,2)
  2x3 → 2x2; microwave (14,2) 1x1 → 1x2 (shares the coffee-station baseline; art needs it).
  All NPCs/zones/items/doors/spawn untouched and verified reachable.
- client/src/phaser/systems/exploration/roomAmbience.ts — vending LED re-anchored into the art;
  microwave flash re-anchored to the composite; coffee_station puff overlay removed.

### Verification

- Sweep 1 (clean1): 13 real defects listed above. After fixes: sweep 2 (clean2) all nine crops
  clean + five native-scale zooms of the rebuilt clusters clean; sweep 3 (clean3, fresh capture)
  all nine crops clean. Two consecutive clean sweeps.
- `npx tsc -p .` clean; cut-audit flags on new frames are run-piece/neighbour-touch only; every
  capture's console clean.
- Final screenshot: screenshots/art-substrate/break_room-clean.png (copy of clean3).

### break_room — reviewer round (master)
Blind reviewer: 1 defect — the notice board's dangling note crossed the wall/floor line (~7 px onto
the floor). Fixed at the source (master): `notice_board` wall anchor dy 0→-8 (default + reception's
override) and `bulletin_board` dy 0→-6 — frames are 38/34 px tall, the face band is 64. Verified with
a 4x zoom of the wall strip; capture console clean. Reviewer's taste-only observations (fridge-magnet
readability, TV/console overhang, seating orientation) left as-is. VERDICT after fix: PASS.

## reception — 2026-08-23

### Defect list (sweep 1, capture clean1 — 7 real defects, all fixed)

1. **Floating "vent" on the wall above GERALD's nameplate** (~tile 3.5, world y 17-30). Root cause:
   `prop.copier` rect [160,48,32,78] on the conference sheet contained TWO disjoint objects — a
   slatted wall pill (y48-59) + the copier body (y70-125) — with 10 rows of transparency between;
   the pill rendered as a detached object floating over the wall. Re-rected to the body only
   [160,70,32,56]. (Row-scan proof: body pixels span exactly y70-125, x160-191.)
2. **Both stanchions (6,5)/(13,5) had a severed rope stub dangling in mid-air.** `prop.stanchion.plain`
   pointed at hospital#161 [448,640,28,30] — the right-post CONNECTOR piece of a 2-post run (its rope
   arrives cut at the rect edge). LimeZu has no rope-less stanchion single. Re-rected to the complete
   2-post barrier [422,640,54,30] (left-post + #161 union; both rope ends terminate at posts).
3. **`prop.papers.a` at (11,1) rendered as a white screen device, not papers.** Its rect [202,1960,22,24]
   matches NO hospital single — it's a bedside monitor from the surgical area. Re-pointed to
   hospital#38 [2,160,22,18], a real loose-paper stack (tray + white sheets + red seal). Decor dy
   -4 → 0 so the flat stack lies on the counter surface.
4. **`prop.mug.brown` at (11,1) read as a red-lidded jar.** The rect [422,240,14,16] is LimeZu's
   tri-colour red mug (dark cap + red band + white base — unreadable at game zoom). Reception decor
   swapped to `prop.mug.blue` (the break-room-proven mug), dy -7 → -2. The mug.brown frame itself is
   untouched (break_room still uses it on the lunch table, where it passed review).
5. **plant@(18,2) + iv_stand@(18,4) fused into a totem** (pole drew through the plant pot, world
   y 84-96 overlap, same column). Two causes: same-column placement AND `prop.ivpole.a` [6,754,14,108]
   being secretly TWO ~54px drip stands stacked in the sheet (two wheel bases visible). Fixed by
   moving the iv_stand obstacle (18,4) → (17,4) and giving reception a new frame
   `prop.ivpole.single` [6,806,14,56] (the lower pole alone) via `iv_stand@17,4` override.
6. **magazine_rack@(2,12) (80px-tall bookshelf) overlapped the chairs@(2,10)** — shelf top at y336 vs
   chair bottoms at y352; the left yellow chair read as swallowed by the bookcase. Moved the obstacle
   (2,12) → (2,13) (against the bottom wall, like the toy chest at (18,13)); top now clears the chairs
   by 16px. Override `magazine_rack@2,13` adds dx 2 for a visible gap from the wheelchair at (1,11).
7. **poster.green@(16,0) bottom 8px swallowed by the teal locker** (locker top y38 vs poster bottom
   y46; no wall slot near cols 15-17 could fit the 32px poster inside the 12..38 clear band). Moved
   the decor to tx 12 — it now hangs over the counter's right wing, bottom clearing the counter top
   (y50) by 4px.

Verified non-defects: clock.white reads as a square wall clock at zoom; wheelchair.side.blue is the
whole hospital#361 single, parked clear of everything; the "gray slats" under the new paper stack are
part of the hospital#38 single (its tray); patient_rights sign.chart pickup + bob + gold ring is the
game's established pickup language; poster.blue.a/notice board/pictures all inside the wall face band
(board bottom y62 clears the floor line); HUD occlusion top-right expected.

### Files changed

- scripts/art/atlas-manifest.json — `prop.copier` [160,48,32,78]→[160,70,32,56] (body only);
  `prop.stanchion.plain` [448,640,28,30]→[422,640,54,30] (complete 2-post barrier);
  `prop.papers.a` [202,1960,22,24]→[2,160,22,18] (real paper stack, hospital#38);
  NEW `prop.ivpole.single` [6,806,14,56]; warning note on `prop.ivpole.a` (still a doubled sprite,
  used by ER composites). Re-sliced (454 frames); tsc clean; cut-audit: only pre-existing
  neighbour-touch flags (copier's flag = a separate 6px object starting at x192; body ends x191).
- client/src/phaser/systems/exploration/art/artCatalog.ts — reception ROOM_DECOR: poster.green
  tx 16→12; papers.a dy -4→0; mug.brown→mug.blue dy -7→-2. Reception ROOM_PROP_OVERRIDES: new
  `magazine_rack@2,13` (dx 2) and `iv_stand@17,4` (ivpole.single).
- client/src/data/roomData.json — reception obstacles only: magazine_rack (2,12)→(2,13),
  iv_stand (18,4)→(17,4). Both moves needed by the art (overlap fixes); NPCs/zones/items/doors/spawn
  untouched; walkability verified in captures (all interactables reachable, door approaches clear).
- roomAmbience.ts — no change needed (reception's block is pulse tweens + footstep SFX only; no
  geometry overlays to re-anchor).

### Shared-frame impact (other rooms should re-check)

- `prop.copier` (body-only rect): also used by records_room printer_station default and it_office's
  printer_station composite — both previously drew the floating pill + gap; both now get the clean
  56px body. Improvement, but those rooms' fixers should re-verify composite alignment.
- `prop.papers.a` (real papers now): used across entrance/lab/records/it_office/er as decor litter
  and zone icons — every usage now renders actual papers instead of a screen device. Strictly better;
  zone-icon rooms (records shredder, lab results_printout) should re-verify at their next pass.
- `prop.stanchion.plain`: only reception uses it (privacy_screen); no other room affected.
- `prop.ivpole.a` NOT changed (ER's patient_bay/gurney composites depend on its current geometry) but
  it IS two stacked poles — flagged in the manifest for the ER owner.
- hospital_entrance has the same magazine_rack-under-chairs latent overlap at (1,12) vs chairs@(2,10)
  — not touched (out of scope), flagged here.

### Verification

- Sweep 1 (clean1): 7 defects above. Fix round 1 (manifest x3 + catalog + roomData), capture clean2:
  five 4-10x zooms verified each fix; found defect 5's second half (doubled ivpole) live. Fix round 2
  (ivpole.single), capture clean3: all nine crops clean (sweep = zero defects). Fresh capture clean4:
  all nine crops clean again. **Two consecutive clean sweeps.**
- `npx tsc -p .` clean after every re-slice; every capture's console clean.
- Final screenshot: screenshots/art-substrate/reception-clean.png (copy of clean4).

### reception — reviewer round (master)
Blind reviewer: 3 defects — (1) patient_rights_poster item icon (a wall-style framed sign) lying flat
on open floor at (2,4); (2) the rubbish pile at (6,12) reading as a boulder; (3) the (14,11) paper-stack
decor reading as an orphaned desk appliance mid-walkway. Fixed (master): a display table now stands under
the poster pickup (decor prop + icon dy -12); both litter decor entries deleted — reception keeps no
floor litter. Verified with 3x zooms of all three spots; console clean. Reviewer taste notes (IV-stand
reads railing-ish, clock nicks the cap band, door ping ring) left. VERDICT after fixes: PASS.

## hospital_entrance — 2026-08-23

### Defect list (sweep 1, capture clean1 — 9 real defects, all fixed)

1. **plant@(1,11) fully swallowed by magazine_rack@(1,12)** — the 80px rack (top y336) drew over the
   46px white plant (top y338, same column, higher depth row); only leaf tips peeked out both sides.
   Fixed with two obstacle moves (reception's bottom-wall pattern): magazine_rack (1,12)→(1,13)
   (bottom flush with the room edge, top y368), plant (1,11)→(1,10) (bottom y352) — 16px clear gap.
2. **Stray leaf bush at the white counter's left foot (~7,4)** — `prop.counter.reception.white`'s
   rect [128,294,192,86] contained a detached green bush at its bottom-left corner (x0-19, y78-85,
   disjoint from the counter; the front section only spans x32-159 at those rows). A rectangle can't
   exclude a dead-corner object, so the desk is now a two-part composite: top slab [128,294,192,58]
   (wings+back) at dy -28 + NEW `prop.counter.reception.white.front` [160,352,128,28] at dx 32.
   Adjacent sheet rows → seam invisible. Frame used only by this room.
3. **Coffee-cart "paddle"** — `prop.coffeemaker.b` (kitchen#186 bbox [416,822,42,36]) includes a thin
   attached side pole (x32-41) that read as a white paddle/sign stuck to the cart table. Re-rected to
   the machine body [416,822,30,36] (pixel scan: only a 2-row base bridge y28-29 crosses x30; crop
   documented in the manifest note). Frame used only by the lobby ambience cart.
4. **papers.a floor litter at (5,6)** (alpha 0.7 under the coffee cart, read as a tipped white
   appliance) — deleted; reception's review set the no-floor-litter precedent.
5. **rubbish ghost at (14,12)** (alpha 0.55 crumple next to the trash can) — deleted, same precedent.
6. **wheelchair@(18,9) right wheel 5px into the right wall** — 42px `prop.wheelchair.front.tan` on a
   32px footprint (art spans x571-613, wall starts x608). Override dx -6.
7. **umbrella_stand@(13,11) read as a fruit basket** — `prop.basket` is kitchen#387, LimeZu's picnic
   basket with food. No umbrella-stand single exists in any available sheet (living/basement/hospital
   catalogs checked). Replaced with `prop.trash.green` — a second bin beside the blue one at (14,11)
   reads as a deliberate waste/recycling pair by the entrance.
8. **welcome_board zone icon overlapped the bulletin board's left edge** (icon x70-90 over board
   x73-119, frame-on-frame — break_room defect #3's pattern). Fixed by composition: bulletin_board
   obstacle (2,1)→(3,1) (inside the top wall band, zero collision effect; board now x105-151),
   poster.blue.b decor tx 4→6 (clear of the board's new span), icon dy -30→-34 (break_room's proven
   anchor; bottom y62, fully inside the wall face). Wall row now: switch(32-50), icon(70-90),
   board(105-151), clock(160-186), poster(192-212), counter(224+).
9. **hipaa_brochure pickup lying on bare floor at (16,5)** read as dropped litter (reception's
   poster-pickup precedent). Added a `prop.table.small.white` display table decor at (16,5)
   (layer prop, depthRow 5) + icon dy -12 — the clipboard now rests on the table under the kiosk.

Also fixed (ambience alignment, brief's suspect list): the cart steam puff spawned at cartCy-14 —
mid-machine (machine top is at cartCy-34) — re-anchored to cartCy-36 so puffs rise from the top.

Verified non-defects: the checkered "pencil" beside clipboard frames is the authentic LimeZu
clipboard+pen single (30x18) — the same frames passed review as break_room/reception pickups; the
big desk phone on the counter is the pack's office-phone single at pack proportions; the glassy
round object behind the counter is the sky office chair's backrest (reception's passed pattern,
gray variant); dispenser.c-on-stand at (6,11) is the pack's only sanitizer (no floor-stand single
exists) on the established onStand pattern — whole, placed, recognizable as a dispenser station;
the wood band along the wall base is the room's trim (identical in approved rooms); mat/kiosk/
chairs/plants/trash.blue all whole and anchored; door [X] hint + "Reception" label are DoorSystem
UI (out of scope).

### Files changed

- scripts/art/atlas-manifest.json — `prop.counter.reception.white` [128,294,192,86]→[128,294,192,58]
  (top slab; note explains the leaf bush); NEW `prop.counter.reception.white.front` [160,352,128,28];
  `prop.coffeemaker.b` [416,822,42,36]→[416,822,30,36] (machine body only, note documents the crop).
  Re-sliced (455 frames); tsc clean; cut-audit flags on these frames are the documented deliberate
  split seams/crop only.
- client/src/phaser/systems/exploration/art/artCatalog.ts — hospital_entrance: desk rebuilt as the
  two-slab composite; wheelchair dx -6; umbrella_stand→trash.green override; plant override key
  1,11→1,10; decor: poster.blue.b tx 4→6, both floor-litter entries deleted, display table added at
  (16,5); interactables: welcome_board dy -34, hipaa_brochure dy -12.
- client/src/data/roomData.json — hospital_entrance obstacles only: magazine_rack (1,12)→(1,13),
  plant (1,11)→(1,10), bulletin_board (2,1)→(3,1). The first two resolve the swallowed plant; the
  board move (inside the top wall band, no collision change) clears wall space for the zone icon.
  NPCs/zones/items/doors/spawn untouched; walkability verified in captures (all interactables
  reachable; the corner pocket at (1,11)-(1,12) is open floor with nothing interactable).
- client/src/phaser/systems/exploration/roomAmbience.ts — lobby coffee-cart steam puff origin
  cartCy-14 → cartCy-36 (above the machine top).

### Verification

- Sweep 1 (clean1): 9 defects above. One fix round, then capture clean2: seven targeted 4-6x zooms
  verified each fix, then all nine crops clean (sweep = zero defects). Fresh capture clean3: all
  nine crops clean again. **Two consecutive clean sweeps.**
- `npx tsc -p .` clean after the re-slice; every capture's console clean.
- Final screenshot: screenshots/art-substrate/hospital_entrance-clean.png (copy of clean3).

### hospital_entrance — reviewer round (master)
Blind reviewer: 6 defects. Fixed at the source (master): (1) magazine rack stood in the bottom wall row —
obstacle (1,13)→(1,12), and the plant above given clearance (1,10)→(1,9); (2)+(3) tan atlas-bleed — the
info stand re-pointed to its clean twin [446,1356,46,70]; the "small tables" were LimeZu pedestal tray
tables with their legs cut off by the singles bboxes → re-rected 22x32 with legs ([370,1230/1262/1294]);
lobby side tables had already been swapped to round tables after my own spot-check caught the
tray-on-table composite reading as a gray machine; (4) the checkered diagonal was the clipboard singles'
dithered pen — all six clipboard frames cropped to the board only; records' inbox/outbox simplified to
tray/binders directly on the counter (no more tray-on-tray); (5) door labels rendered under y-sorted
props (wheelchair ate "Reception") — DoorSystem labels now depth 30, floating signage; (6) the two-tone
side-door leaf is LimeZu's own lintel/body shading — intentional, no change. One blank capture was the
known Vite-reload race; re-captured clean. Verified with zooms of the stand, label, rack, and plant.
VERDICT after fixes: PASS.

## lab — 2026-08-23

### Defects found (sweep 1: capture clean1, nine 3x crops + targeted zooms)

1. **Both lab benches split by a floor sliver** — (3,5) and (12,5) 5x2: `fill` bottom-anchors each
   footprint row's counters at that row's bottom edge, and the kw counter frames are only 22 px tall
   (32x22), so ~10 px of floor showed between the two rows; the "double-sided bench" read as two
   disjoint strips. FIXED.
2. **Results chalkboard hung over the floor** — results_board (8,1), `prop.chalkboard.dark.3` (56x46)
   at wall dy 10 spanned world y 42..88; the wall face ends at 64, so the board's lower half sat on
   floor tiles. FIXED (dy -16 → fully inside the face band, chalk tray on the board rail).
3. **Eyewash station read as a keyboard on the floor** — eyewash_station (9,10) used `prop.sink.white`,
   a top-down kitchen counter-insert sink (48x28); lying flat on the floor it read as a white panel
   with a soap pump. FIXED (new frame).
4. **Specimen fridge read as elevator doors** — specimen_fridge (2,10) used `prop.fridge.gray.2`, a
   flat blank 2-door kitchen fridge panel with no fridge features at game scale. FIXED (glass fridge).
5. **sample_labels zone icon flat on bare floor** (4,7) — clipboard bobbing mid-walkway read as dropped
   litter. FIXED (anchored onto the bench).
6. **results_printout zone icon flat on bare floor** (15,7) — the papers tray read as a dropped gray
   device, and the gate fiction says "results on the counter". FIXED (anchored onto the bench).
7. **phi_identifiers item icon flat on bare floor** (2,8) — binders on open floor. FIXED (display stand).
8. **Floor litter read as debris** — decor `prop.papers.a` baked into the floor at (10,9) alpha 0.7
   read as a dropped gray device mid-walkway (public-room precedent from reception/lobby). REMOVED.
9. *(investigated, not a defect)* Gray "column" at (1,9-11)/(18,9-11) — bisected via prop-snapshot dump,
   frame-swap test, lighting-off + teleport probes: it is the tileset's `shadow.left/right` wall
   contact-AO rendering prominently on the bright whitetile floor; identical strip exists in the
   reviewed-and-passed hospital_entrance (same floor set). Left alone.
10. *(re-judged after fix, kept)* Tipped canisters in `prop.bottles.lab.b/c` are inherent in the LimeZu
    singles (a deliberately knocked-over specimen container); on the continuous bench they read as
    intentional lab mess. The b group at (15,6) was moved to (14,5) so the results pickup owns that
    counter stretch.
11. **Bio cabinet right half read as window shutters** — bio_cabinet (16,10) paired `cabinet.glass.l`
    with the frameless `cabinet.glass.r` panel. FIXED (l + mirrored l = symmetric double doors).

### Files changed

- scripts/art/atlas-manifest.json — registered the `bathroom` theme sheet
  (3_Bathroom_32x32.png); added `prop.sink.wash` = bathroom#151 bbox [8,1380,48,70] (front-facing
  utility wash basin, faucet + red/blue taps) with a note; re-sliced (456 frames, cut-audit clean;
  singles index scripts/art/singles/bathroom.json generated).
- client/src/phaser/systems/exploration/art/artCatalog.ts —
  - new `LAB_BENCH_5x2` parts composite (back row butted at dy -22, per-row depthRow 5/6; plain ends,
    drawers/doors/shelf/plain2 mids, open kw.end shelf at the front-right end); `lab_bench` uses it.
  - `specimen_fridge` → `prop.fridge.glass.tall` (2-door glass canteen fridge, racked shelves).
  - `bio_cabinet` → glass.l + glass.l flipX (symmetric double doors).
  - `eyewash_station` → `prop.sink.wash`, dx 4 (clears the sink counter's right edge).
  - `results_board` wall dy 10 → -16.
  - lab decor: bottles.lab.b (15,6) → (14,5) dx 4 (freed the counter for the results pickup); added
    `prop.table.small.white` display stand at (2,8); removed the (10,9) floor papers.
  - lab interactables: sample_labels dx -6 dy -42 and results_printout dy -40 (both icons sit ON the
    bench front row, ER unlocked_computer pattern — zone tiles unchanged); phi_identifiers dy -22
    (binders rest in the display stand's tray).
- client/src/data/roomData.json — untouched. No obstacles moved; NPCs/zones/items/doors/spawn unchanged.
- client/src/phaser/systems/exploration/roomAmbience.ts — untouched: the microscope eyepiece glow
  aligns with the composite scope's head at (112,70) (verified in crops), shelf bubbles rise over the
  shelf face, fidgets are tween-only.

### Verification

- Sweep 1 (clean1): defects above, plus frame renders (bottles.lab.a/b/c, fridge family, glass
  cabinets, sinks, sink.wash) and singles-catalog browses (hospital, bathroom) before choosing art.
- One fix round → capture clean2: all nine crops zero defects. Fresh capture clean3: all nine crops
  zero defects again. **Two consecutive clean sweeps.**
- `npx tsc -p .` clean after the re-slice and after all catalog edits; every capture's console clean.
- Final screenshot: screenshots/art-substrate/lab-clean.png (copy of clean3).

### lab — reviewer round (master)
Blind reviewer: 1 defect — two flask sprites hovering with a floor gap behind the sink counter. Root
cause: they are baked into the top rows of LimeZu's sink-counter single, which is drawn to stand against
a wall (the flasks read as shelf items there); mid-room they float. Fixed (master): `prop.sink.counter`
cropped to the counter body [450,1796,60,42]. One capture logged a page error ('emit' of null) during the
atlas reload — two fresh captures after settle were console clean (known Vite-reload race). Verified with
5x zooms. Reviewer taste notes (three "!" placards, tipped cans, free-standing cabinet) left. VERDICT
after fix: PASS.

## records_room — 2026-08-24

Two-session room: a first fixer worked this room to ONE fully clean sweep (its capture clean4) and was
killed by a server error BEFORE the confirming second sweep and before writing any deliverables. Its
edits were all on disk. This entry is by the second fixer: the prior fixer's changes are reconstructed
below from `git diff` (records-related parts only); the loop was then re-run from scratch.

### Prior fixer's changes (reconstructed from diff — its process died before logging)

artCatalog.ts (PROP_DEFAULTS, all records-only types):
- `records_counter`: desk.k.wood pair (mid-run floor gap) → one continuous 6-piece tan kt run
  (kt.l at dx -30 … kt.r at dx 128) overhanging the 4x1 footprint one tile each side so the
  inbox/outbox trays at (7,2)/(12,2) seat ON the counter instead of standing on the floor.
- `clerk_desk`: desk.wood.pc.3 + drawers.tan (read as wardrobe doors + a mirror) → double-sided
  4x2 tan kt island, back row overlapped dy -16 so the front tabletop hides the back row's legs.
- `scanner_station`: desk.wood.pc + floor-standing fax → 2x2 double-sided kt island with
  `prop.fax.a` ON the back counter (dx 21, dy -38).
- `shredder_station`: bare `prop.cabinet.gray.2` → 2x2 double-sided kw island with
  `prop.printer.small` as the shredder machine on the back row (single-row version had covered
  only the bottom 30px of the 64px footprint).
artCatalog.ts (records_room blocks):
- ROOM_PROP_OVERRIDES: `filing_cabinet@16,2` drawers.column → NEW `prop.drawers.column.r`
  (hospital#550, matched right-hand twin of #548 on the left aisle).
- ROOM_DECOR: corkboard (1,0) dy16 → (4,0) dy14; clock.gray (5,0) dy6 → (3,0) dy12 (it had ended
  up dead-centre under the screen-fixed room-name banner, only its edges peeking out); papers.a
  counter decor at (9,2) deleted; phone.black dy -8 → -22 (stands on the new kt counter top);
  case binders (11,8) re-anchored dx -2 dy -6 onto the clerk island's back row; debris (3,13)
  given dy 10; THREE `prop.table.small.brown` display stands added under bare-floor pickups at
  (4,4), (10,4), (17,8); papers.b floor litter at (5,9) and papers.a at (12,6) deleted
  (litter-reads-as-debris precedent).
- ROOM_INTERACTABLE_ART: all five icons re-anchored off bare floor — unlocked_cabinet binders
  dy -22 (display stand at (4,4)); audit_log monitor.pc dx 30 dy -23 (on the clerk island's left
  end); shredder papers.b → papers.a dx -28 dy -29 (to-shred stack ON the shredder island's back
  counter beside the machine — this is the icon it was mid-verifying when it died); minimum_
  necessary_manual clipboard.blue dy -12 (stand at (17,8)); hipaa_penalties binders dy -22
  (stand at (10,4)).
roomAmbience.ts (records block):
- Fluorescent tube + halo + dust motes REMOVED (the tube rect sat at the wall base y~60 and read
  as a stray white strip on the baseboard; the room-name banner covers that wall face).
- Run-12 drifting document cart REMOVED (bedside-cabinet sprite sliding with no wheels/pusher,
  static detached shadow ellipse at the tween start). The static cart at (6,11) remains.
atlas-manifest.json: NEW `prop.drawers.column.r` [96,3122,32,110] hospital#550. (The records-used
px rects for drawers.column/printer.small/fax.a/cart.wood.b/phone.black/clock.gray etc. date to
the pre-loop singles conversion or that fixer — not separable in the uncommitted tree; all were
render-verified this session.)
roomData.json: no records_room changes by the prior fixer.

### Defects found by THIS fixer (own sweep from scratch, capture clean5)

1. **Shredder island front row buried by the archive crates — crate-through-frame intersection**
   (the one real defect; the cluster the prior fixer died verifying). archive_box@(2,13)'s
   boxes.stack art is 64x56 (top y392, drawn depth 18) and covered the island's entire 22px front
   row (y394-416, depth 17); through the front-right `counter.kw.end` OPEN shelf frame a crate
   showed inside the frame, reading as a crate shoved through the counter. Fixed in two steps:
   (a) shredder_station front-right kw.end → kw.plain (closed front; kw.plain is the lab bench's
   proven end piece; shredder_station is used by records only); (b) obstacle move archive_box
   (2,13) → (3,13) — the island's front-left counter is now fully visible, the tall crate pile
   leans against its right half (reads as crates stacked against a counter), and the scattered
   trio lands on open corner floor below the shredder zone (to-shred backlog).
2. **Follow-on: debris decor half-buried under the moved crates** — the (3,13) crumple ended up
   clipping out from under the relocated pile. Moved to the freed floor slot: tx 3 dx -4 →
   tx 2 dx 0 (world x64-94, exactly between boxes.tall ending x64 and the crate pile starting
   x96); reads as shred-waste dropped between the box stacks, fully visible.

Verified non-defects (checked deliberately): `prop.drawers.column`/`.r` upper halves are a blank
glossy door — that is LimeZu's design language for this whole drawers family (drawers.blue/purple/
tan.h are short versions, bank.m the wide one; contact-sheet render checked; no all-drawer tall
column exists in the pack) — whole, grounded, matched left/right pair; GERALD's copier is whole
(reception's body-only re-rect holds — no floating pill); inbox tray/outbox binders/phone sit ON
the counter run; all five pickups sit on stands/counters; document cart whole and grounded;
scanner island + fax reads as a scanner table; kw/kt butt seams are the pack's cabinetry language
(lab/break_room precedent); attorney's carried-envelope ambience stays at his side through idle
turns (NPC-attached, transient); "GERALD"/"BOSS" placards are game UI.

### Files changed (this fixer)

- client/src/phaser/systems/exploration/art/artCatalog.ts — PROP_DEFAULTS `shredder_station`
  front-right part kw.end → kw.plain (records-only type; comment rewritten); records_room
  ROOM_DECOR debris tx 3 dx -4 → tx 2 dx 0 (comment added). No manifest change; no re-slice.
- client/src/data/roomData.json — records_room obstacles only: archive_box (2,13) → (3,13)
  (art needs it: 56px crate art vs 22px counter front row). NPCs/zones/items/doors/spawn
  untouched; shredder zone (4,12) still reachable via (4,11)/(5,12); walkability verified in
  captures.

### Verification

- Own sweep 1 (clean5): the shredder-cluster defect above; drawer columns zoomed + frame-rendered
  and cleared. Fix round 1 (kw.plain swap), clean6 zoom: crate-in-niche still ambiguous. Fix
  round 2 (obstacle move + debris slot), clean7/clean8 zooms verified the corner.
- Sweep 2 (fresh capture clean8): all nine crops zero defects. Sweep 3 (fresh capture clean9):
  all nine crops zero defects. **Two consecutive fully clean sweeps.**
- `npx tsc -p .` clean; every capture's console clean (clean5-clean9).
- Final screenshot: screenshots/art-substrate/records_room-clean.png (copy of clean9; replaces a
  stale clean.png left by an earlier aborted attempt at 21:48 the night before).

### records_room — reviewer round (master)
Blind reviewer: zero checklist defects across nine crops + seven zooms — the loop's first outright PASS.
Taste-only observations (GERALD kiosk body low-contrast vs floor, cabinet shine-dash asymmetry, fax on a
paper bundle, label-chip clipping) noted, no action. VERDICT: PASS.

## it_office — 2026-08-25

Fixer pass (4 captures, 4 nine-crop sweeps; sweeps 3 and 4 fully clean on fresh captures).

### Defects found and fixed (sweep 1 → 15 fixes, sweep 2 → 3 residual tunes)

1. security_safeguards item icon (10,2) floated on bare floor below the control-screens wall.
   Fixed: gray display stand (`prop.table.small.gray`) decor at (10,2) dy 8 (feet drop into row 3 at
   the wall base), icon dy -4 — chart now displayed on a stand under the monitor wall.
2. password_note zone icon (9,7) floated on bare floor in front of the monitoring console.
   Fixed: dy -26 — the sticky-note clipboard is stuck to the console's blue front band
   (reception sign_in_sheet / break_room verbal_disclosure anchor).
3. vendor_agreement zone icon (5,9) floated on bare floor. Fixed: display stand at (5,9), icon dy -8.
4. breach_playbook binders (7,11) floated on bare floor one row above the wood desk.
   Fixed: dx 6 dy 17 — binders stand on the desk top at (7,12).
5. fax_machine zone icon (14,9) — fax sat directly on the floor. Fixed: display stand at (14,9), icon dy -8.
6. Keyboard decor (9,6) dy -10 sat on the console's blue front band, reading as slipping off the desk.
   Fixed: dy -22 (console top face is world y182..205).
7. papers.a tray decor (10,6) dy -10 perched on the console's front edge reading as a machine about to
   fall. Fixed: dy -22 — tray sits flat on the desk top (records inbox-tray precedent).
8. papers.a floor decor (6,12) alpha 0.7 read as a dropped gray machine with a red LED, not paper.
   Fixed: deleted (same fail records/lobby reviews called on bare-floor tray litter).
9. Stray green pixel floating on bare floor above BOTH monitor banks (1,5)/(18,5): the generic
   roomAmbience tech-prop LED anchors at obstacle top (+5px), but monitor_bank's 52px art hangs from
   the footprint bottom, leaving the obstacle's top tile empty. Fixed in roomAmbience: monitor_bank
   LED at (y+h)*32-58, x+w*32-6 → sits on the monitor head's top-right bezel; screen glow special-cased
   to (y+h)*32-52.
10. Monitor banks read as a floating monitor + keyboard (anim.monitor is LimeZu's control-room single
    meant to sit ON a desk; the 32x52 cell has no furniture under the keyboard). Fixed:
    PROP_DEFAULTS.monitor_bank is now a composite — `prop.counter.kw.plain` (1-tile cream counter) +
    anim.monitor at dy -16, keyboard lands on the counter's top face. monitor_bank exists only in
    it_office (PROP_DEFAULTS change called out — safe).
11. White blob at the bottom-left of both table.small.gray composites (7,6)/(12,6): the manifest rect
    [370,1294,22,32] reached 14 rows past the table into the white sack single at (360,1314) and drew
    its corner. Fixed: rect h 32→18 (objects.mjs shows the table+leg is a clean 22x18 component);
    re-sliced; cut-audit clean; brown/white variants (used by done rooms) untouched.
12. Locked cabinet (16,12) overlapped the printer station — its 58px art hid the glass desk's right
    legs and the copier's bottom half, reading as a crammed furniture pileup. Fixed: obstacle moved
    (16,12) → (16,13) (now against the south wall; desk + copier fully visible; walkability checked,
    all NPCs/zones/doors reachable); switch.a keypad decor followed (17,12) → (17,13) so it stays on
    the cabinet's front.
13. Warning sign (15,0) dy 8 hung on the light rail with a rail lamp half-hidden behind its left frame.
    Fixed: dy 24 — sign sits below the rail (lamps end ~y20) and above the rack caps (~y50).
14. (sweep 2) Coffee maker floated ~4px above its tray — anim.coffee carries ~8px of transparent
    bottom padding. Fixed: part dy -14 → -7 (visible base seated on the tray face).
15. (sweep 2) Monitor-flicker ambience flash was anchored at the obstacle's top-tile center (28x28 at
    y+16), half over bare floor. Fixed: 24x18 at (y+h)*32-46, centered on the monitor screen.

### Checked and cleared (no change)

- Trash bin (18,13): right edge clears the right wall band by ~2px (8x zoom) — false alarm.
- Office chairs (1,8)/(18,8): back-view office chairs (only facing in the LimeZu set; same sprites
  passed entrance/reception reviews); read as chairs at zoom.
- Cable-duct mats (4,3..5)/(15,3..5): three aligned raised floor panels below each rack gap — read as
  deliberate underfloor-access dressing, kept (no cable art exists in any singles index).
- Control-screens wall (8,0): the screen-fixed IT OFFICE banner covers the art's top row, but what
  shows reads clearly as a two-tier monitor wall (unlike records' unrecognizable clock slab) — kept.
- Analyst 'sip' fidget: floats prop.mug.brown (verified on the kitchen sheet: a real red-filled mug,
  not the dish-rack trap) — transient npcLife behavior, fine. GERALD 'phone' fidget likewise.
- console.blue baked details (orange tucked-in chair orb behind the analyst, yellow-green front strip,
  white base bump) — source-art details of the tvstudio console, not defects.

### Files changed

- `scripts/art/atlas-manifest.json` — prop.table.small.gray px h 32→18 + note (then slice-atlas).
- `client/src/phaser/systems/exploration/art/artCatalog.ts` — monitor_bank composite; coffee_mug dy;
  it_office decor (sign dy, switch follow, keyboard/papers dy, 3 display stands, floor-papers removed);
  it_office interactable dx/dy for all 5 pickups.
- `client/src/data/roomData.json` — locked_cabinet obstacle (16,12)→(16,13) (only obstacle moved).
- `client/src/phaser/systems/exploration/roomAmbience.ts` — it_office monitor flash re-anchored;
  generic tech-LED/glow special-cased for monitor_bank (type exists only in it_office).

`npx tsc -p .` clean; every capture console-clean; cut-audit does not flag the new rect.
Final screenshot: `screenshots/art-substrate/it_office-clean.png` (copy of clean4).

### it_office — reviewer round (master)
Blind reviewer: zero checklist defects across nine crops + five deep zooms (desk orb, door-side objects,
counter dial, desk arm, video wall) — second outright PASS in a row. Taste-only observations (desk-orb
identity ambiguity, vent-run spacing rhythm, video wall's bottom row ~2px past the strict y64 face line
reading as wall-base mounting, left/right counter dial asymmetry) noted, no action. VERDICT: PASS.

## er — 2026-08-25

### Defect list (sweep 1, capture clean1 — 14 real defects, all fixed)

1. **All five IV poles were doubles.** `prop.ivpole.a`/`prop.ivpole.b` are both 14x108 rects spanning
   TWO stacked LimeZu drip stands (manifest note flagged .a; .b renders identically — verified on the
   sheet at 5x). They stood 3.4 tiles tall and poked into the wall face band: patient_bay (2,2) part
   dx106, patient_bay@14,2 part dx6, gurney (2,9) part dx68, iv_stand (1,10), iv_stand@18,12. All five
   swapped to the reception-proven `prop.ivpole.single` (56px: cap, shaft, collar, wheeled base).
2. **Curtain partitions read as roller blinds standing mid-floor.** `prop.blinds.blue/tan` are window
   blinds (32x74, slats + little legs) — as free-standing 1x3 "curtains" they read as shutter
   cabinets, and their 74px art under the 96px footprint left the procedural cloth-sway ellipse
   floating on bare floor above the art. Fixed with the pack's REAL rolling bed curtains, already in
   the manifest unused: `prop.curtain.blue`/`prop.curtain.tan` (hospital#245/#246, 60x72 — frame rail,
   hanging pleats, wheeled feet). Tan one flipX so the support posts mirror. The ±14px side overhang
   y-sorts correctly (a passing player walks behind the curtain edge). Sway ellipse: atlas rooms now
   skip curtain_partition in addFurnitureIdleAnimations.
3. **Bays were mismatched.** Right bay was [pole, bed, bedside] with the pole jammed at the curtain
   seam; left was [bed, bedside, pole]. Right bay recomposed to mirror the left exactly (bed dx0,
   bedside dx70, single pole dx96) — the tan curtain now overlaps the pink bed's foot corner by 14px,
   which is exactly what a privacy curtain does; pole sits between bedside and vital monitor.
   Left-bay pole dx 106→96 to clear the blue curtain's overhang (4px gap).
4. **`prop.wheelchair.side.tan` is LimeZu's mop-and-bucket single**, not a wheelchair (wringer bucket
   + leaning mop handle at 4x). The (18,13) "wheelchair" now uses the entrance-proven front view
   `prop.wheelchair.front.tan` dx -6 (clears the east wall column by 2px; the single IV pole at
   (18,12) reads as parked behind it, correctly occluded). NOTE for the hallway batch: hallway_it_er's
   override still uses side.tan at (10,5) — same mop.
5. **unlocked_computer zone icon floated mid-air** (dx38 dy-36 hung monitor.pc against the station's
   left front skirt, stand-pixels dangling). Display stand added at (6,6) (records/it_office pattern),
   icon re-anchored dy -5 — monitor.pc's bottom ~10px are a dangling cable, so the head lands on the
   stand top and the cable drapes down its face.
6. **whiteboard zone icon straddled the wall/floor seam** (dy -4 put the chart at y 62-90, nearly
   touching the EMERGENCY ambience panel above). Display stand at (10,3), icon dy 22 — chart now
   stands on it, 23px clear of the panel; nurse patrol passes in front (correct depth).
7. **emergency_exceptions item icon bobbed on bare floor** at (17,11). Display stand added (depthRow 4
   so the depth-10 item icon draws over the stand); icon dy -2 keeps the bob clear of the gurney art.
8. **Floor litter read as debris**: prop.debris (11,12) = rock pile beside the spawn; prop.papers.a
   (7,12) = white device with red LED + cable. Both deleted (same fail records/lobby reviews called).
9. **sign.cross (7,0) was half-buried under the screen-fixed room-title text** (title spans tiles
   ~7-12.6). Moved to tx 5.5 — fully visible between hscreen and title.
10. **prop.whiteboard (9,0) was 90% hidden behind the title text** and its sliver collided with the
    EMERGENCY panel. Moved to tx 13 (between firstaid and the right hscreen, 10px/6px gaps); dy 6→14
    after sweep 2 caught its top 6px inside the wall cap band.
11. Curtain sway ellipse on bare floor (rolled into 2).
12-14. The three pole instances beyond the first two (rolled into 1 — counted per instance).

### Verified fine, no change (checked at 3x/4x)

- Nurse station composite: halves butt cleanly (meds bottles sit on the seam), 4 baked monitors,
  -2/+4px overhang invisible. Walking nurse (roomAmbience y=4 patrol) reads as working BEHIND the
  counter — her feet hide behind the station art (depth 9 < 11), head clears the zone icon. Kept.
- Triage desk: white-counter fillEnds run whole (left plain cap, right kw.end leg piece reads as a
  phone side-table); clipboard.navy decor stands ON the counter top; phone.red sits on the end piece —
  chunky "ER hotline" scale but clean. EMERGENCY panel sits alone on the wall face below the title.
- Crash cart pair (cart.monitor + cart.wood.a) butt cleanly, both grounded at y384.
- machine.arms (5,11) = LimeZu's surgical robot, whole; monitor.stand (18,4 + gurney@15,9) = blank
  white screen-on-stand, weak identity but whole, grounded, LED/glow anchors land on the art
  (compared against hospital#210 — worse). hscreens hang inside the face band; clock/firstaid fine.

### Files changed

- `scripts/art/atlas-manifest.json` — DELETED prop.ivpole.a, prop.ivpole.b, prop.blinds.blue,
  prop.blinds.tan (all now unreferenced; the ivpole doubles were a standing trap). No additions —
  prop.curtain.blue/tan already existed. Re-sliced; tsc clean; cut-audit flags on used frames are the
  known deliberate ones (clipboard pen crop, ivpole.single upper-pole touch, monitor.pc 2px).
- `client/src/phaser/systems/exploration/art/artCatalog.ts` — PROP_DEFAULTS patient_bay/gurney/
  iv_stand poles → ivpole.single (ER-only types; reception's iv_stand instance already overrides to
  the same frame), curtain_partition → prop.curtain.blue; ROOM_PROP_OVERRIDES.er (bay@14,2 mirrored,
  curtain@13,2 tan flipX, iv_stand@18,12 override removed, wheelchair → front.tan dx-6); ROOM_DECOR.er
  (cross/whiteboard relocated, litter deleted, 3 display stands); ROOM_INTERACTABLE_ART.er re-anchored
  all three pickups.
- `client/src/phaser/systems/exploration/roomAmbience.ts` — addFurnitureIdleAnimations skips
  curtain_partition in atlas rooms (floating sway ellipse). ER ambience block untouched (nurse patrol
  + EMERGENCY panel verified reading correctly).
- `client/src/data/roomData.json` — NOT touched (zero obstacle moves; NPCs/zones/items/doors/spawn
  untouched).

### Verification

- Sweep 1 (clean1): defects above. Sweep 2 (clean2, all nine crops): one new defect (whiteboard cap
  poke) + one borderline (computer icon cable-float, confirmed at 4x on clean3). Sweep 4 (clean4,
  fresh): all nine crops CLEAN. Sweep 5 (clean5, fresh): all nine crops CLEAN — two consecutive.
- `npx tsc -p .` clean; every capture's console clean.
- Final screenshot: `screenshots/art-substrate/er-clean.png` (copy of clean5).

### er — reviewer round + master fix (2026-08-25)

Blind reviewer: **FAIL** with two defects, one shared root cause — both nurse-station back monitors
(tiles ~9.4-10.1,5.4 and ~11.4-12.2,5.4) floated with bare floor visible between their base slabs and
the counter's back edge. Cause: LimeZu draws singles #544/#545 with the back monitor 4px above the
counter (invisible against a wall, wrong on a free-standing island); the whole-single frames carried
that void into the game. Everything else passed (doors, bays, curtains, carts, wall band, depth,
ambience). Reviewer taste notes (patrol nurse's mid-walk shadow offset, EMERGENCY lightbox dipping
~5px into the baseboard band, robot/red-phone whimsy) — no action.

Master fix: split each station single into three pixel rects at its clean x-boundary —
`prop.nurse_station.2.body/.counter/.mon` (cols 0-45 / 46-69 rows 30-75 / 46-69 rows 0-25) and
`prop.nurse_station.meds.body/.counter/.mon` (cols 0-47 / 48-71 rows 28-75 / 48-71 rows 0-25) —
and re-seat each monitor in the composite (mon dy -45 / -47 vs the natural -50): slab now lands 1px
onto the counter back edge / paper box. Whole-single frames deleted; re-sliced; `npx tsc -p .` clean;
er-fix1 capture console-clean. 8x zoom: both slabs planted, no shear or doubled bezels at the split
boundaries (the 2px floor sliver between machine edge and monitor reads as object spacing).
cut-audit note: the six split frames are deliberate partial rects of #544/#545 (documented in
`_note`s). Final screenshot replaced: `screenshots/art-substrate/er-clean.png` (copy of er-fix1).
VERDICT after fix: PASS (master-verified at 8x on the fixed cluster + whole-room check).

## hallway_reception_break — 2026-08-25 (hallway batch fixer)

### Defects found (sweep 1, capture clean1 — 4 real defects, all fixed)

1. **Act-tinted "ribbon" floated as a paint chip on the plant's foliage** (world ~338,48). The
   roomAmbience hallway block drew a 10x4 act-tinted rectangle at (camera.width/2+18, 48) meant as
   an accent "on the existing bulletin board" — but the board spans y0..34, so the chip hung 12px
   below it on bare wall, and in this hallway the (10,2) plant's leaves occupy that exact spot
   (act-1 blue chip on green foliage, depth 8 over plant depth 7). Act 1's blue also matches the
   board's own blue (invisible where it was aimed). DELETED the ribbon block for all five hallways —
   the board's per-act TEXT (hallwayContent) is the act signal; no procedural paint over atlas art.
2. **Hallway bulletin board hung at wall y0 — buried the cap band, bracket on the void edge** (all
   five hallways; drawn by interactableFactory at (w/2+16, 0)). prop.bulletin.notes (46x34) covered
   the white cap strip completely and its mount bracket + pegs poked onto the dark wall-top edge.
   ER-whiteboard/notice-board precedent: wall paper hangs below the cap. Fixed: image y 0 → 14
   (interactableFactory.ts — one literal; the board's invisible interact sprite at y80 unchanged).
   Board now spans y14..48, inside the face band, bracket pegs on the beige face.
3. **Plant (10,2) foliage would overlap the re-hung board's bottom-left corner** (plant.white.m spans
   x322..350, board x336..382 y14..48). Obstacle moved (10,2) → (9,2) (roomData.json; art needs it —
   14px foliage-over-board). Override key followed in artCatalog ('plant@9,2'). Clears the tip
   poster at (8,1) by 8px and the board by 18px; row 2 stays against the wall base; no
   NPC/zone/item/door affected (room has none besides the wall-band tip poster).
4. **Dust-mote columns hardcoded at tiles 5/14 for all hallways** — in three of five hallways they
   miss the sconce tubes (per-room sconces: 4/15, 4/16, 5/14, 4/16, 5-only). Shared-cause fix in
   roomAmbience: columns now derive from the actual wall_sconce obstacle centers. (In this room the
   old columns happened to fall inside both 96px tubes — defect was latent here, live in others.)

Also in the shared block (verified in later hallways, no visual effect here): the heavy-hallway
sconce flicker halo+cone re-anchored from the obstacle rect bottom (floor line, y66-76) onto the
tube art itself (halo y26 on the lit cells at sconce center -16, cone y44 wash below) —
prop.lightbar.3 hangs at y16..36.

Verified non-defects: prop.lightbar.3's dark right third is the authentic LimeZu single (3-cell
fixture, one cell unlit — rendered from atlas to confirm); the poster frames' gray backing + hanger
tab are baked into LimeZu's poster singles (all six rendered); water cooler (custom-painted), vending
drinks 42x66 on 1x1 (grounded, ±5px overhang, nothing beside it), both benches, extinguisher
bracket at (17,1) y34..60, door mats at (1,3)/(18,3), gold ring + sparkles on the tip poster
(established pickup language). "[LOCKED] Reception" toast in some captures = transient door-bump UI
from the capture script.

### Files changed

- client/src/phaser/systems/exploration/roomAmbience.ts — hallway block: ribbon deleted; mote
  columns derive from wall_sconce obstacles; sconce glow re-anchored onto the tube art (halo y26,
  cone y44, center -16 on the lit cells).
- client/src/phaser/systems/exploration/interactableFactory.ts — hallway bulletin board image
  y 0 → 14 (position-only; outside the protocol's five files but the board is a hardcoded literal
  there — no data hook exists; called out per protocol).
- client/src/phaser/systems/exploration/art/artCatalog.ts — hallway_reception_break override key
  plant@10,2 → plant@9,2 (follows the obstacle move).
- client/src/data/roomData.json — hallway_reception_break obstacle: plant (10,2) → (9,2).

### Verification

- Sweep 1 (clean1): defects above (found via nine crops + 8x board zoom + 6x tube zoom + atlas
  contact renders of prop.poster.* and prop.lightbar.*).
- One fix round → clean2: 5x zoom of board/plant/poster cluster verified, then all nine crops
  zero defects. Fresh capture clean3: all nine crops zero defects. **Two consecutive clean sweeps.**
- npx tsc -p . clean; every capture's console clean. No manifest change (no re-slice needed).
- Final screenshot: screenshots/art-substrate/hallway_reception_break-clean.png (copy of clean3).

## hallway_break_lab — 2026-08-25 (hallway batch fixer)

Heavy hallway (flicker sconces + walking employee). Shares the batch's global fixes (board y14,
ribbon deleted, motes from sconce positions) — verified live here.

### Defects found (sweeps 1-2, captures clean1/clean2 — 6 real defects, all fixed)

1. **sign.chart decor (11,0) buried behind the bulletin board** (chart x352..380 y16..44 vs board
   x336..382 — the board drew over ~75% of it). Moved tx 11 → 8 first — which landed it ON the
   hidden closet door's wall seam (defect 2) — final home tx 6.5 (x208..236, above the (6,2)
   plant's clear airspace, tube (4,1) ends x192).
2. **Relocated chart sat on the DoorSystem hidden-door seam** (the supply-closet whimsy crack at
   x270..274, y4..60, with paw prints leading to it). The seam is the closet's discovery hint —
   covering it with wall paper broke the whimsy and read as a crack through the sign. tx 6.5
   leaves the seam + paw prints fully visible (door art itself untouched — out of scope).
3. **Tip poster item icon (10,1) overlapped the board's left edge** (poster x326..346 vs board
   x336..382, frame-on-frame — break_room defect-3 pattern). WALL_POSTER dx -26 → hangs at
   x300..320 on clear face (same fix applied to records_it and it_er whose tips share (10,1)).
4. **biohazard_sign (15,1) bottom 6px past the wall/floor seam AND top under the (16,1) tube.**
   PROP_DEFAULTS dy 14 → 6 (break_lab-only type, grep-verified): y38..62 — 2px below the tube's
   rail, bottom inside the baseboard band (extinguisher precedent).
5. **Walking employee's foot shadow was static at the patrol start tile** — a detached shadow
   ellipse sat on bare floor at (7,4) while the doctor walked x7..13 (the records drifting-cart
   fail). roomAmbience: shadow added to the patrol tween targets — it now travels under him.
   (ER's nurse keeps her own block — DONE room, reviewer taste-noted only.)
6. **Sconce glow cone's tip poked below the tube as a gray tab** (re-anchored cone top rows
   crossed the tube's dark bottom rail). Cone moved fully below the rail: (sx, 48) 30x12.
   Also: extinguisher (17,1) dy 2 → 6 — its bracket's top 2px sat inside the same tube's rail
   (the 96px tube spans x480..576 over tiles 15-18).

Verified non-defects: hidden-door seam + warm light sliver + paw prints (DoorSystem whimsy,
intentional); glove_dispenser onStand composite at (3,5) (entrance-proven pattern); employee walks
BEHIND the (9,5) bench with feet correctly occluded (depth 9 vs bench 10); plants (6,2)/(13,2)
grounded against the wall base; halo reads as the tube's lit core; motes under both tubes
(144/528); picture.landscape.d, mats, benches all whole.

### Files changed

- client/src/phaser/systems/exploration/roomAmbience.ts — employee shadow tweens with the sprite;
  sconce cone (sx,48) 30x12 fully below the tube rail.
- client/src/phaser/systems/exploration/art/artCatalog.ts — break_lab decor: sign.chart tx 6.5,
  extinguisher dy 6; PROP_DEFAULTS.biohazard_sign dy 6 (single-use type); ROOM_INTERACTABLE_ART
  dx -26 for the three (10,1) tip posters (break_lab, records_it, it_er).
- roomData.json / manifest — untouched (no obstacle moves, no re-slice).

### Verification

- Sweep 1 (clean1) + zooms (tube glow 5x, biohazard cluster 5x, employee 4x, source-sheet
  lightbar render): defects above. Fix rounds → clean3: all nine crops zero defects. Fresh
  capture clean4: all nine crops zero defects. **Two consecutive clean sweeps.**
- npx tsc -p . clean; every capture's console clean.
- Final screenshot: screenshots/art-substrate/hallway_break_lab-clean.png (copy of clean4).

## hallway_lab_records — 2026-08-25 (hallway batch fixer)

### Defects found (sweep 1, capture clean1 — 4 real defects, all fixed)

1. **First-aid kit (12,0) clipped into the (14,1) sconce tube's left end** (kit x384..406 y26..44 vs
   tube x400..496 y16..36 — 6px of the kit's right edge inside the tube's rail; it also crowded
   the bulletin board, 2px off its right frame). Decor moved to tx 3 (x96..118) — clear of the
   orange poster (ends x84) and the (5,1) tube (starts x128).
2. **wall_clock (7,1) hung at the baseboard** — clock.white with wall dy 6 from obstacle row 1 put
   it at y38..58, a full band lower than every other wall item. PROP_DEFAULTS.wall_clock dy 6 → -10
   (type used only by this room, grep-verified): y22..42, beside the tube's right end.
3. **filing_cart (12,5) read as twin nightstands with a 4px floor gap** — two butted cart.wood.a
   singles (28px wide at dx 2/34 on the 64px footprint). The room fiction is ONE "filing cart,
   half-loaded with folders". PROP_DEFAULTS.filing_cart → single prop.cart.wood.b (30x44 document
   trolley with push handle + folder shelves, records-proven) and the obstacle shrunk 2x1 → 1x1
   (art needs it: 30px art on a 64px collision box left a phantom-collision tile). Walkability
   unchanged otherwise; no NPC/zone/item/door affected.
4. **Duplicate green posters** — the (2,0) decor poster.green was the SAME single as the room's
   green tip-poster item at (8,1); two identical posters on one wall read as copy-paste. Decor
   swapped to prop.poster.orange.

Verified non-defects: fern (10,2) tops 2px below the board's bottom edge (board y14..48, fern
y50..96 — clean gap); board bracket on the face; both benches; door mats; picture.landscape.a
(16,0); motes under both tubes (176/464); tip poster + gold ring cue (established pickup language).

### Files changed

- client/src/phaser/systems/exploration/art/artCatalog.ts — lab_records decor: poster.green →
  poster.orange at (2,0), firstaid tx 12 → 3; PROP_DEFAULTS: wall_clock dy -10, filing_cart →
  single prop.cart.wood.b (both types single-use, grep-verified).
- client/src/data/roomData.json — hallway_lab_records obstacle: filing_cart (12,5) 2x1 → 1x1
  (art needs it). NPCs/zones/items/doors/spawn untouched.
- No manifest change; no re-slice. Shared frames (cart.wood.b, clock.white) untouched.

### Verification

- Sweep 1 (clean1): defects above (+ f-carts contact render to pick cart.wood.b). One fix round →
  clean2: all nine crops zero defects. Fresh capture clean3: all nine crops zero defects.
  **Two consecutive clean sweeps.**
- npx tsc -p . clean; every capture's console clean.
- Final screenshot: screenshots/art-substrate/hallway_lab_records-clean.png (copy of clean3).

## hallway_records_it — 2026-08-25 (hallway batch fixer)

### Defects found (map analysis + verified against captures — 3 real defects, fixed before clean1)

1. **rail.lights.2 decor (9,0) buried behind the bulletin board** (rail x288..352 y6..22 vs board
   x336..382 y14..48 — right 16px of the rail behind the board's top-left; the (10,1) tip poster's
   bob also grazed its underside). Moved to tx 7 (x224..288).
2. **cable_tray (14,1) drew a second light rail directly UNDER the (16,1) sconce tube** (rail at
   y38..54 near the baseboard, tube at y16..36 above it — read as two stacked light fixtures).
   Re-composed as a ceiling cable/light run: obstacle (14,1) → (12,1) (roomData; row 1 is inside
   the wall band, zero collision effect) and override dy 6 → -26 → the rail now hangs in the cap
   band (y6..22, x384..448), aligned with the tx-7 decor rail — two matching track segments
   marching toward IT (the room description's "bundled cables run along the ceiling toward IT").
3. **sign.warning (16,0) hung ON the sconce tube** (sign x512..538 y16..40 fully inside the tube's
   x480..576 y16..36). Moved to tx 18.1 (x579..605) — between the tube's end and the IT door column.

Also inherited from the batch fixes (verified live here): tip poster at (10,1) has dx -26 (clears
the board's left edge); board at y14..48; motes from sconce centers (144/528).

Verified non-defects: the CCTV camera (2,0) with red LED touches nothing (tube starts x96, camera
ends x96 — 0px gap reads as adjacent wall fixtures); the single 32x96 anim.server tower at (15,5)
reads as a tall blinking network cabinet (it_office's proven rack single), grounded on its feet,
LED + screen-glow ambience land on the art; plants (7,2)/(12,2) grounded; bench (9,5); the (15,4)
gray floor mat reads as an equipment mat under the rack; door mats + [X] hints + labels are UI.

### Files changed

- client/src/phaser/systems/exploration/art/artCatalog.ts — records_it decor: rail tx 9 → 7,
  sign.warning tx 16 → 18.1; records_it override: cable_tray dy 6 → -26.
- client/src/data/roomData.json — hallway_records_it obstacle: cable_tray (14,1) → (12,1)
  (art needs it; inside the wall band, no collision change). NPCs/zones/items/doors/spawn untouched.
- No manifest change; no re-slice.

### Verification

- Sweep 1 (clean1, after fixes): all nine crops zero defects. Fresh capture clean2: all nine
  crops zero defects. **Two consecutive clean sweeps.**
- npx tsc -p . clean; every capture's console clean.
- Final screenshot: screenshots/art-substrate/hallway_records_it-clean.png (copy of clean2).

## hallway_it_er — 2026-08-25 (hallway batch fixer)

Heavy hallway (single flicker sconce + walking employee). STATE watch item resolved here.

### Defects found (map analysis + wheelchair render — 3 real defects, fixed before clean1)

1. **wheelchair (10,5) drew prop.wheelchair.side.tan — LimeZu's MOP-AND-BUCKET single** (the ER
   fixer's watch item; confirmed on the shared contact render: leaning mop handle over a wringer
   bucket). Override swapped to the entrance/ER-proven prop.wheelchair.front.tan (no dx needed
   mid-hallway). The side.tan frame is now unreferenced → DELETED from the manifest, re-sliced
   (455 frames), tsc clean — the trap is retired. wheelchair.side.blue verified a real side-view
   wheelchair on the same render (kept — reception's DONE instance uses it).
2. **emergency_light (16,1) hung at knee height** — sign.exit (24x14) with wall dy 14 from obstacle
   row 1 sat at y46..60, at the baseboard. PROP_DEFAULTS dy 14 → -10 (type used only here,
   grep-verified): the red exit sign now hangs mid-face at y22..36 near the ER door.
3. **Duplicate exit signs** — a second sign.exit decor at (18,0) two tiles from the emergency_light
   obstacle's sign. Decor entry deleted (the obstacle's sign is THE emergency light).

Also inherited from the batch fixes (verified live here): tip poster (10,1) dx -26 (clear of the
board); board y14..48; single mote column under the (5,1) tube; sconce glow ON the tube (halo y26
+ cone y48, no under-rail notch); employee shadow travels with the patrol.

Verified non-defects: employee frozen mid-patrol directly behind the wheelchair reads as someone
pushing/standing behind a parked chair (correct depth: chair 10 > employee 9, head and hand peek
over the backrest — the ER nurse-behind-station precedent); defibrillator_mount (15,5) reads as a
red first-aid box on a small gray stand; sign.cross poster (2,0); picture.landscape.b 2px right of
the tube's end (adjacent, no overlap); plant (14,2) grounded clear of the exit sign; bench (5,5).

### Files changed

- client/src/phaser/systems/exploration/art/artCatalog.ts — it_er override wheelchair →
  front.tan; PROP_DEFAULTS.emergency_light dy -10; it_er decor sign.exit (18,0) deleted.
- scripts/art/atlas-manifest.json — DELETED prop.wheelchair.side.tan (the misnamed mop single);
  re-sliced (455 frames); npx tsc -p . clean; cut-audit flags unchanged (pre-existing deliberate
  crops only).
- roomData.json — untouched (no obstacle moves).

### Verification

- Sweep 1 (clean1, after fixes): all nine crops zero defects. Fresh capture clean2: all nine
  crops zero defects. **Two consecutive clean sweeps.**
- Every capture's console clean.
- Final screenshot: screenshots/art-substrate/hallway_it_er-clean.png (copy of clean2).

## supply_closet — 2026-08-25 (hallway batch fixer)

### Defects found: ZERO — no changes needed

Full loop run (clean1 + nine crops + full-frame read + three 6x zooms; fresh clean2 + nine crops).
Every catalog prop/decor item judged whole, placed, recognizable:

- shelf (1,2) composite: bottles.a supply shelf (snack packs / green bottles / blue boxes + baked
  pinned note) butted with the narrow book/jar shelf — the 2px gap between the parts reads as the
  natural outline between two furniture units standing side by side (verified at 6x).
- archive_box (7,2): boxes.stack crate piles, whole and grounded (the scattered lower pieces are
  baked into the same single — records-proven frame).
- ladder decor (5,0): whole, hangs on the wall face, feet at the seam.
- mop (3,5): reads as an upright mop/plunger beside the janitor corner. trash (1,6): metal bin,
  whole. fern (8,6): grounded. basket (6,6): LimeZu's food basket — lands as part of the cat's
  feeding corner (bed + bowl + basket), deliberate whimsy support.
- debris (2,4) alpha .6 KEPT: reads as a rag/gauze pile ("Mops. Gauze." — the room's intro text)
  right beside Zz Test's crate and the mop — janitor-closet clutter per the brief's exception.

Verified out-of-scope/intentional (not judged as defects): the sleeping cat + cushion bed + food
bowl + "Look at the bowl" prompt and Zz Test (the patient who isn't real — whimsyData's one
fourth-wall character) with his crate perch — all code-driven closet whimsy, not catalog art; the
yellow dashed circle is the player's interaction-radius UI ring (ExplorationScene), visible because
the player spawns beside the bowl interactable; hidden-door/seam/door behavior is DoorSystem.

### Files changed

None (this room's art data was already clean).

### Verification

- Sweep 1 (clean1): all nine crops zero defects (+ 6x zooms of debris/shelf-gap/bin). Fresh
  capture clean2: all nine crops zero defects. **Two consecutive clean sweeps.**
- npx tsc -p . clean (unchanged); both captures' consoles clean.
- Final screenshot: screenshots/art-substrate/supply_closet-clean.png (copy of clean2).

## hallway batch — reviewer rounds + master fixes (2026-08-25)

Two blind reviewers in parallel (A: reception_break, break_lab, lab_records; B: records_it, it_er,
supply_closet). Verdicts: reception_break PASS, lab_records PASS, records_it PASS, supply_closet
PASS; **break_lab FAIL (5 findings), it_er FAIL (1 finding)** — root causes shared.

Findings and dispositions:
1. break_lab glove dispenser on its floor stand mid-corridor read as an "unnameable white capsule"
   (fresh eyes could not identify it). Master fix: wall-mounted beside the west door —
   ROOM_PROP_OVERRIDES glove_dispenser { dispenser.c, anchor wall, dy 28 }, obstacle (3,5)→(2,1)
   (type exists only in this room; (2,1) clears the 96px tube that starts ~tile 3.5).
2. break_lab "thin black pole spanning the wall at tile ~8.5": the hidden supply-closet door seam —
   DoorSystem's deliberate discoverable hint (Run 12 spec), ruled by design, no change.
3. break_lab warning sign's bottom frame merged with the wall base line. Master fix:
   PROP_DEFAULTS biohazard_sign dy 6 → -2 (single-room type; bottom now ~y54, air below).
4. break_lab + it_er sconce flicker halo+cone ellipses read as stains on the wall plane (A: the cone
   "physically impossible light on a vertical surface"; B: both ovals at the it_er (5,1) sconce).
   Master fix in roomAmbience: ellipses deleted; the flicker now tweens the tube sprite's own alpha
   (art.props lookup `wall_sconce@x,y`) — nothing painted on bare wall.
5. break_lab dust mote seen drifting past the bottom trim onto the letterbox void. Master fix:
   mote tween ends at y 184 (above the bottom wall band at y192) instead of +5*TILE.

Reviewer taste notes, no action: poster-height variance between hallways (house style), two-tone
edge-door strips (door art), lab_records cabinet ambiguity, it_er blank blue poster + bare east
wall, records_it tri-pastel strip's muddy third pane + free-standing server rack, supply_closet's
1px learn-zone ring (UI) and the "Zz Test" NPC label (data naming — flagged to the user, out of
room-clean scope).

Verification: `npx tsc -p .` clean; both re-captures console-clean; break_lab fix1 shows the
dispenser wall-mounted by the door, sign with air below, no ellipses under either tube; it_er fix1
shows a clean wall face at tiles 4.6-5.5. Final screenshots replaced:
`hallway_break_lab-clean.png`, `hallway_it_er-clean.png` (copies of fix1).
break_lab VERDICT after fixes: PASS (master-verified). it_er VERDICT after fixes: PASS
(master-verified).

## break_room — design pass (2026-08-26)

Brief: three purposeful zones (kitchenette / dining / TV lounge), vending bank kept, phone+trash
off the dining table's flank. Result — the zone story reads left to right, top to bottom:
**snack wall top-left** (vending bank + bin + open fridge), **info wall top-center** (notice board
+ corkboard zone), **kitchenette top-right** (counter run + coffee huddle), **dining center**
(table + 2 stools + gossiper + overheard plate), **TV lounge bottom-left** (two front-facing
couches facing the TV across a rug, plant/lamp framing, dozing employee), **phone nook east wall**
(nightstand + phone zone + selfie coworker), **storage corner bottom-right** (box stack + lost &
found), spawn landing kept clear.

### Entity moves (roomData.json, break_room only)

Obstacles:
- vending_machine (5,2)→(4,2) — butts the bank flush against its twin at (2,2)
- lunch_table (8,6)→(9,6) — frees the col-7/8 west passage between lounge and table
- trash_bin (13,6) 1x2 → (6,3) 1x1 — off the dining table's flank; parks at the vending bank's
  end on the machines' baseline (reception's trash_can@6,3 precedent); footprint now matches
  the 28x34 art
- tv_stand (7,10)→(3,13) — TV backs onto the bottom wall, screen facing the couches (it was
  jammed against the lunch table's south edge; user-flagged)
- couch (2,10)→(1,8) and couch (15,10)→(4,8) — the two couches butt into one suite on the
  lounge's north side, both FACING the TV at ~1.7 tiles sitting distance
- chair (7,8)→(9,9), chair (12,8)→(11,9) — stools tuck against the table's south edge flanking
  the overheard_conversation plate (the blue one used to sit under the gossiper's feet)
- coat_rack/floor-lamp (1,5)→(6,13) — was an orphan mid-wall; now frames the TV's right side
- lost_and_found_box (5,12)→(17,13) — was stranded mid-floor; joins the box stack as a storage
  corner
- ADDED plant (14,13) 1x1 (prop.plant.orange.s default) — anchors the bare bottom-wall stretch
  between spawn and storage corner

NPCs (positions only, text untouched):
- gossiping_coworker (7,7)→(8,7) — stands at the table's west end (his stool no longer under him)
- tired_employee (4,12)→(2,10) — dozing in the lounge, on the rug in front of the left couch
  (Z/! markers follow him)
- hr_director (14,4)→(15,4) — directly below the coffee maker; forms a coffee-station huddle
  with friend_fishing (16,5, unmoved)
- selfie_coworker (14,10)→(17,11) — stands beside the phone nook

Zones:
- unlocked_phone (12,7)→(18,10) — the nightstand+phone move to the east wall (they crowded the
  dining table); same icon/dy pairing as before
- overheard_conversation (10,9) and staff_corkboard (11,2) unmoved; verbal_disclosure item
  (17,4) unmoved (still the note on the kitchen fridge door)

### artCatalog.ts (break_room)

- Overrides re-keyed for the moves (vending@4,2, chair@9,9, chair@11,9).
- **couches switched prop.couch.gray.3 → prop.couch.blue.3 (one flipX)** — gray.3 is LimeZu's
  BACK-view couch (smooth back panel, cushion tops peeking over; its manifest _note saying
  "front-facing" is wrong — left as-is to avoid a re-slice, flagged here). blue.3 is the true
  front-facing 3-seat, so the pair now shows cushions toward the TV. gray.3 stays in
  PROP_DEFAULTS (no other room uses `couch`).
- Vending dx nudges (+6/-6) close the 16px art gap between the two machines' centered arts.
- Decor: tabletop food shifted +1 col with the table; phone nightstand decor (12,7)→(18,10)
  depthRow 10; green 48x36 rug replaced by prop.mat.tan.3x2 at tx2 dx16 / ty9 dy29 — fills the
  couch→TV sitting gap (y317..373), tucks 3px under the couch feet, 1px clear of the TV screen.
- Wall decor untouched.

### roomAmbience

No edits — vending LED and microwave flash compute from obstacle rects and followed the moves
(verified in captures: LEDs sit on both machines' top-right; flash on the microwave body).

### Tests

- tests/art-substrate-proof.spec.ts: break_room depth-trio pin updated for the bin move —
  trash_bin (6,3), behind (6,2) / beside (7,3) / front (6,4). `ART_ROOM=break_room` proof run:
  4/4 pass (atlas, depth, doors, lighting). `npx tsc -p .` clean; all captures console-clean.

### Chose NOT to do

- No third stool / east-side stool — it would pinch the right-door approach lane at (13,7).
- Tired employee not seated ON a couch — NPC bottom-anchor vs couch depth would read as
  standing-in-furniture; he stands on the rug instead.
- Left the "Hallway" door label overlapping couch A's back edge — screen-fixed door UI (depth
  30), same behavior in other rooms, not room geometry.
- Left the food cluster on the table's west half — it sits between the two occupied seats; the
  east half is the approach from the right door.

### Verification

Sweep 1 (design2, 9 crops + 4 targeted zooms): 0 integrity defects; design tweaks applied
(vending gap, catalog comments). Sweep 2 (design3, 9 crops): clean. Sweep 3 (design4, fresh
capture, 9 crops): clean. Two consecutive clean sweeps. Final: screenshots/art-substrate/
break_room-design.png (copy of design4).

### break_room — design reviewer round (master)
Blind design reviewer: zero defects on both checklists (integrity + design bar) across nine crops and
six zooms; briefed zones all present and nameable; TV-vs-table user flag confirmed fixed; walkways and
door approaches clear. Taste-only observations logged, no action: second open "staff lunch fridge"
floats between the vending bank and the board (nameable but zone-less); the counter run's microwave
segment sits 2px low at 9x; one flyer dangles into the baseboard margin; dining set seats only two;
lone box slightly apart from the corner stack. VERDICT: PASS.

## lab — design pass (2026-08-26)

Brief: bench ROWS with a workflow (specimen in → bench work → sink/autoclave out), microscope
station as focal point, fridge/storage against walls; user-flagged "the desk doesn't make sense,
or the tables — kind of bizarre". Root cause found: the old 5x2 benches were two butted rows of
22px kitchen-cabinet FRONTS (counter.kw.*) — no visible work surface, bottles perched on the seam.
Result — the zone story reads: **microscope corner top-left** (hero + researcher + fern),
**chemistry wall top-center** (fume-hood glass cabinets + results board), **analyzer bay
top-right** (centrifuge drum + NEW readout analyzer), **bench hall center** (two clean parallel
8-tile runs of front-facing blue-top lab tables, aisle rows 6-7 door-to-door, tech behind the
north run with his chair, Marcus at the south run with a stool, both zone pickups ON bench tops),
**specimen intake bottom-left** (glass fridge on the west wall + courier + sample rack on the
bottom wall + PHI binders display stand), **wash line bottom-right along the bottom wall**
(sink → eyewash → autoclave → trash bin → box stack, wet-floor mat at the sink), **chemicals
wall east below the door** (bio glass cabinet + two stacked meds shelves — the old door-flanking
orphan shelves joined this storage wall).

### New atlas frames (manifest + slice; cut-audit flags are packed-neighbour touches only)

- prop.table.lab.a / prop.table.lab.b — hospital#224/#226, the front-facing blue-top lab work
  tables (60x40, left-cap/right-cap pair; a+b butt seamlessly into one 4-tile counter).
- prop.analyzer.a — hospital#117, floor analyzer with orange readout; replaces the autoclave
  single inside the centrifuge composite (the same autoclave art now stands in the wash line —
  one identity per object).

### Obstacle moves (roomData.json, lab only)

- lab_bench (3,5) 5x2 → (6,5) 8x1 and lab_bench (12,5) 5x2 → (6,8) 8x1 — two aligned parallel
  runs (each four tables: a,b,a,b at dx 8/68/128/188) replacing the side-by-side cabinet slabs
- ADDED chair (7,4) 1x1 (stool.tan override) — tech's chair behind the north bench
- ADDED chair (12,9) 1x1 (stool.yellow override) — stool tucked at the south bench's east end
- specimen_fridge (2,10) → (1,9) — off mid-floor, flush against the west wall (intake corner)
- sample_rack (11,10) → (2,13) — joins the intake corner on the bottom wall
- sink_station (7,10) → (12,13), eyewash_station (9,10) → (14,13), autoclave (13,10) → (15,13) —
  the free-standing mid-floor station row becomes a wash line on the bottom wall, eyewash beside
  the sink, sink → autoclave workflow
- trash_can (1,13) → (17,13) — waste bin at the wash line's end (bins live by sinks)
- bio_cabinet (16,10) → (17,8) — against the east wall below the door
- chemical_shelf (1,8) → (18,10) and (18,8) → (18,11) — the two lone door-flanking wall shelves
  stack under the bio cabinet as one supplies column (second gets the .b single so it doesn't
  tile); beaker-bubble ambience anchors to the obstacles and followed automatically
- plant (1,4), box (18,13), microscope_station (2,2), fume_hood (5,2), results_board (8,1),
  centrifuge (15,2) unmoved (centrifuge art recomposed in place)

### NPC / zone / item moves (positions only, text untouched)

- lab_tech (5,7) → (8,4) — works BEHIND the north bench facing the room (shopkeeper composition;
  feet correctly hidden by the table edge), his chair beside him at (7,4)
- marcus_lab_aide (14,7) → (8,9) — at the south bench's front beside the sample_labels zone (his
  encounter is about sample labels), stool at (12,9)
- courier (16,4) → (3,9) — from under the centrifuge to the specimen fridge (the "specimen in"
  end; his fidget follows via NPC lookup)
- researcher (3,4) unmoved (already at the microscope)
- sample_labels zone (4,7) → (7,9) — icon (clipboard.orange, dy -48) lies ON the south bench top
- results_printout zone (15,7) → (10,6) — icon (papers.a, dx -16 dy -48) lies ON the north bench
  top, straddling the run's mid-joint (the paper stack doubles as the joint cover)
- phi_identifiers item (2,8) → (4,11) — binders (dy -20) rest on the display stand in the intake
  corner ((2,8) would have hidden behind the moved fridge's top)

### artCatalog.ts (lab)

- LAB_BENCH_5x2 (10 kw cabinet parts) → LAB_BENCH_8x1 (4 lab tables); kw frames stay (ER/records
  still use them)
- centrifuge = scanner.ct + analyzer.a (was scanner.ct + autoclave)
- lab overrides: chair@7,4 stool.tan, chair@12,9 stool.yellow, chemical_shelf@18,11 narrow.meds.b
- Decor rebuilt: bench-top clutter sparse + deliberate (bottles.a on north table 1 dx 8 — dx 0
  overhung the rounded corner; clipboard.sky north table 4; bottles.c straddling the south run's
  mid-joint; papers.a south table 4; bottles.lab.b no longer placed), display stand (2,8) →
  (4,11), NEW wet-floor mat.gray at (13,12) by the sink; wall decor and door mats untouched
- roomAmbience: no edits — eyepiece glow anchors to the unmoved microscope; bubbles compute from
  chemical_shelf obstacles; fidgets follow NPCs (verified in captures)

### Tests

- tests/art-substrate-proof.spec.ts: lab depth-trio pin specimen_fridge (2,10)→(1,9): behind
  (1,8) / beside (3,10) / front (1,11). ART_ROOM=lab run: 4/4 pass (atlas, depth, doors,
  lighting). npx tsc -p . clean; every capture console-clean.

### Chose NOT to do

- No continuous 8-tile bench top: the pack has no middle table single (224/226 are caps), so each
  run is two butted 4-tile counters; both mid-joints are covered by straddling clutter/pickup and
  the butted-pair read is honest lab furniture. Flagged for the reviewer.
- Left the east-center floor (x14-16, rows 4-6 and 9-12) open — it is the door corridor junction
  and the analyzer/wash-line approach; wear pools keep it from reading untextured.
- Did not re-identify the fume hood (glass wall cabinets) — accepted identity from the clean pass.
- papers.a appears as south-bench decor AND as the results icon on the north bench — different
  benches, 5 tiles apart; kept for the "paperwork everywhere" fiction.
- Pre-existing faint vertical ambient-light seam at world x~256 (present in design0 before this
  pass, all rooms' whitetile lighting) — untouched, out of scope.

### Verification

Sweep 1 (design1, 9 crops + 5 zooms): 4 defects — bottles.a overhanging the north run's west
corner; both mid-run joints reading as accidental gaps; results icon + tech stacking into a
muddle at (8,5); phi binders 2px shy of the stand tray. All fixed (clutter shifts, zone move to
(10,6), dy -20). Sweep 2 (design3, 9 crops): clean. Sweep 3 (design4, fresh capture, 9 crops):
clean. Two consecutive clean sweeps. False alarms cleared: the red-white flask by the tech is
npcLife's transient 'chart' fidget icon; the "gray diamond" over the south bench is bottles.c's
top peeking over the table's back edge; NPC quest markers overlap bench fronts while wandering
(markers follow NPCs). Final: screenshots/art-substrate/lab-design.png (copy of design4).

### lab — design reviewer round + master fixes (2026-08-27)

Blind design reviewer: **FAIL**, 7 findings (4 integrity, 3 design); zone story, workflow, doors,
NPC posts and bench rows all praised. Dispositions (all master-fixed, verified at 4x + room proof
4/4 green):
1. "Wall texture seam at x8" = the fume hood's flat glass slab ending against ribbed wall — the
   junction sliver (hood edge x256 → chalkboard art x~277) now carries a first-aid box, so the
   edge reads as furniture-next-to-wall-fixture, not a material seam.
2+3. White smears under both bench-run mid joints = the butted table caps' rounded inner corners
   leaving a pale notch below the tabletop. A blue stool is now tucked at each joint front
   (decor, depthRow = bench row) covering the notch — and giving the runs their seats.
4+5. "Documents floating on a chair back" = the 40px binder fan overhanging the 22px white tray
   stand (which itself read as an office chair). Swapped to the 32px wood nightstand pedestal;
   binders dy -30 seats the whole fan on its top face. Nameable now: the PHI-binders display.
6. "Orphan yellow basket" = `prop.stool.yellow` (reads as wicker basket) at (12,9), detached from
   the bench edge. Deleted (obstacle + override); the tucked joint stools seat Marcus's run.
7. "No stools at the benches" — satisfied by the two tucked joint stools + the tan stool behind
   the north run.
Files: artCatalog.ts (decor stools/pedestal/firstaid, phi dy, override removal), roomData.json
(chair@12,9 obstacle deleted). tsc clean, captures console-clean.
lab VERDICT after fixes: PASS (master-verified at 4x on all seven find sites).

## it_office — design pass (2026-08-27)

Brief: keep the reviewed-good server wall; make the floor read as desk PODS; GERALD's
printer corner stays a corner; keep the dark-room sight lines to the THREATS console
(label untouched). User flags addressed: "furniture placement is sparse and kind of
bizarre" and "the desks/countertops look cut off" — root cause of the second found:
`workstation_cluster` butted console.blue.l+r, the two END CAPS of the 4-tile studio
console with its whole middle missing (a blank slab), and the monitoring desk's white
top carried nothing but two strays. Result — the zone story: **server wall top**
(4 rack banks + camera + warning sign + underfloor cable runs, untouched), **center
spine** (control-screens wall → safeguards chart on its stand → analyst BEHIND the big
blue console at his own live monitor → orange password note on the console front → open
aisle straight down to the spawn), **operator bullpen rows 8-9** (two matched curved
desk pods flanking the aisle, each with live monitor + tucked office chair: vendor
standing at the west "guest" pod beside the unsigned-agreements stand, GERALD at the
east pod with his coffee, the fax stand at its side), **response row 11** (rolling
chalkboard | 2-tile aisle mouth | THREATS terminal + wood response desk with the breach
playbook binders, all beside the spawn), **print corner SE** (glass desk + copier,
locked cabinet + keypad, crate + bin — unchanged geometry), **west service edge**
(water cooler on the wall, plant + spare crates in the SW corner).

### New atlas frames (manifest + slice; cut-audit does not flag either)

- prop.console.curve.blue — tvstudio [4,272,88,44], deliberate union of singles
  #54+#55+#59 (left wing + center + right wing butt on the sheet): the complete curved
  control desk. Replaces the cap-butt for workstation_cluster; console.blue.l/r frames
  stay registered (unused, harmless).
- prop.tower.mini.blue — tvstudio [232,274,16,20] single #74 (mini PC tower).

### PROP_DEFAULTS (both types exist only in it_office)

- monitoring_desk: console.blue.4 + anim.monitor part at dx 64 dy -24 — a live screen
  planted on the desk top at col 10, directly in front of the analyst; its bottom
  bridges the floor strip between his feet (row 4) and the desk art's back edge.
- workstation_cluster: prop.console.curve.blue (dx 4 on the new 3x1 footprint) +
  anim.monitor at dx 32 dy -24 crowning the curve's center.

### Obstacle moves (roomData.json, it_office only)

- workstation_cluster (2,8) 2x1 → (2,8) 3x1 — curve art needs 3 tiles; west pod
- workstation_cluster (16,8) 2x1 → (15,8) 3x1 — east pod, mirrored about the aisle
- chair (1,8) → (3,9) — gray office chair tucked at the west pod's front-center
  (was stranded against the wall below the door, reading as a gray bin)
- chair (18,8) → (16,9) — sky office chair tucked at the east pod's front-center
- whiteboard_wall (2,10) 3x1 → (6,11) 2x1 — joins the response row as its briefing
  board facing the spawn; footprint 3→2 because the art is 56px (the 3-tile rect
  carried ~20px of invisible collision each side)
- table (7,12) → (12,11) — the wood desk butts the THREATS terminal: response desk
- ADDED box (2,13) 1x1 (boxes.tall) — spare-hardware crates; SW corner set w/ plant
- ADDED water_cooler (1,10) 1x1 — west wall service fixture by the bullpen
- unchanged: server racks, cable trays, monitor banks, monitoring desk footprint,
  coffee_mug (7,6), headphones (12,6), printer_station, defense_console (11,11),
  locked_cabinet, plant, trash, box (18,12)

### NPC / zone moves (positions only, text untouched)

- security_analyst (10,7) → (10,4) — mans the console from BEHIND (shopkeeper
  composition); his desk monitor fronts him, and he now can't see the password note
  stuck on the public side of his own console. Reachable at (10,3)/(9,4)/(11,4).
- vendor (3,9) → (4,9) — stands at the guest pod's east wing, agreement stand beside
- workaround_employee (15,9 ← 16,9) — GERALD stands between his pod and his beloved
  print corner, fax stand at his other side
- breach_playbook zone (7,11) → (12,12) — the playbook moved with its desk; icon
  dy -48 dx 6 seats the binder fan on the desk top (at -38 it slid off the front edge)
- unchanged: password_note (9,7), fax_machine (14,9), vendor_agreement (5,9),
  security_safeguards item (10,2)

### artCatalog.ts (it_office)

- Overrides re-keyed: chair@3,9 (gray) / chair@16,9 (sky), both dy -12 (seat backs
  tuck over the pods' base bands).
- Decor: papers.a (10,6)→(8,6) (frees col 10 for the desk monitor); NEW tower.mini.blue
  at (11,6) on the desk top; NEW mug.brown on GERALD's pod east wing (17,8) dy -26;
  display stands at (5,9)/(14,9)/(10,2), keypad, warning sign, rails, camera, mats
  unchanged.
- Interactables: password_note clipboard.sky → clipboard.orange (the pale board was
  white-on-white against the console front; the observation gate wants it noticed);
  breach_playbook dx 6 dy -48 (see above).

### roomAmbience

No edits. Rack LEDs and monitor_bank glow/flash/LED anchor to obstacle rects of types
whose positions did not change (verified on captures: LEDs on rack corners and monitor
bezels, flash on screens). Analyst/GERALD fidgets follow their NPCs.

### Tests

- tests/art-substrate-proof.spec.ts: it_office depth-trio re-pinned for the board move
  — whiteboard_wall (6,11): behind (6,10) / beside (5,11) / front (7,12).
- ART_ROOM=it_office proof run: 4/4 pass (atlas, depth, doors, lighting).
- npx tsc -p . clean; every capture console-clean; cut-audit: no flags on new frames.

### Chose NOT to do

- No board directly behind the terminal/desk (label text would sit on the dark board;
  trio front tile would have been blocked) — the board fronts the row from the west.
- Left rows 12-13 cols 3-9 as open dark floor — it is the spawn's breathing room and
  the walkway to the west door, and this is the game's darkest room by design.
- Did not remove the third+fourth anim.monitor reuse (banks + pods + desk): identical
  synced dashboards read as a SOC's standard-issue screens, and the pack has one
  animated control monitor.
- Quest "!" bubbles overlap pod desk edges when NPCs stand at desks — game UI that
  follows NPCs (depth 30+), not room art; left alone.
- The keyboard frame's baked desk-mic (and its 1px satellite dot) kept — it is part of
  the LimeZu single and reads as a comms mic on the monitoring desk.

### Verification

Sweep 1 (design1, 9 crops + 7 targeted zooms): 2 defects — password_note's pale
clipboard camouflaged against the white console front; playbook binder fan overhanging
the response desk's front-left corner (floating-documents fail). Both fixed (orange
pad; dy -48 dx 6). Sweep 2 (design3, all 9 crops): clean. Sweep 3 (design4, fresh
capture, all 9 crops): clean. Two consecutive clean sweeps on integrity + design bar.
Final: screenshots/art-substrate/it_office-design.png (copy of design4).

### it_office — design reviewer round + master fixes (2026-08-27)

Blind design reviewer: **FAIL**, 2 findings; zones, pods, sight lines, overlay anchoring and NPC
placement all praised. Dispositions (master-fixed, verified at 3-5x, ART_ROOM proof 4/4):
1. [integrity] The pod-side "printer" (= anim.coffee machine on its gray stand, coffee_mug type)
   floated 2-3px above the stand — part dy -7 → -4 seats its visible base on the stand top.
2. [design] The wall-bracket chalkboard stood mid-floor at (6,11) with nothing anchoring it —
   obstacle moved to (6,13), backed against the previously-bare south wall stretch (the reviewer's
   own observation slot). Depth trio re-pinned from whiteboard_wall to the wood response desk
   table@12,11 (behind (12,10) / beside (14,11) / front (12,12)) because a south-wall prop has no
   walkable "front" tile.
Taste notes left: pedestal stands' chair-like silhouette (worst instance fixed by #1), empty glass
desk, [X] badge row tight against the door-side terminals.
it_office VERDICT after fixes: PASS (master-verified).
## er — design pass (2026-08-27)

Brief: bays along the top kept; middle reads triage row → nurse island → treatment side;
user-flagged "cut off" side-view beds replaced with the pack's front-facing vertical bed;
equipment parks at walls or bay-side. Result — the zone story: **patient bays top-left /
top-right** (each a coherent unit: whole vertical bed with its head against the top wall,
IV pole at the bed's mid-length, bedside cabinet at the head, rolling curtain closing the
bay toward center; vitals monitor at (18,2) beside the right bed), **status wall top-center**
(EMERGENCY panel + patient status board zone on its stand between the bays, info screens
re-hung over the two curtains), **nurse island center** (untouched 6-part composite, patrol
nurse behind it, the logged-in computer stand now butted to its west flank), **triage row
west** (white counter at (3,8) near the door: cap / drawers+clipboard / counter+red hotline
phone / end piece; the doctor posted BEHIND it, officer and frantic family queued at its
front — the mid-room trio now has a place), **treatment side east** (surgical robot beside
the vitals-stand + blue exam table pod at rows 8-9; crash cart parked flush at the east wall
above it), **waiting south** (new wood bench against the bottom wall west of the spawn),
**stretcher parking SW** (white exam table + pole flush to the bottom wall, bin beside),
**equipment corner SE** (exceptions chart on its stand, Priya's post beside it, wheelchair +
IV pole parked in the corner). West door approach and spawn kept clear.

### Obstacle moves (roomData.json, er only)

- patient_bay (2,2) 4x3 → (1,2) 3x2 — vertical-bed bay hugs the west wall (footprint tracks
  the new art)
- patient_bay (14,2) 4x3 → (15,2) 3x2 — mirrored bay, bed against the east end
- curtain_partition (6,2) → (4,2) — closes the narrowed left bay
- curtain_partition (13,2) → (14,2) — closes the right bay
- vital_monitor (18,4) → (18,2) — the monitor joins the right bay at the bed's head
- triage_desk (8,9) → (3,8) — the triage counter meets arrivals from the west door
- gurney (2,9) → (2,12) — ready-stretcher parks flush along the bottom wall
- gurney (15,9) → (15,8) — treatment pod (monitor stand + blue exam table) anchors the east side
- equipment (5,11) → (13,8) — the surgical robot works beside the treatment table (was adrift
  mid-south)
- crash_cart (13,11) → (17,6) — parked flush at the east wall between bays and pod
- iv_stand (1,10) DELETED — lone pole on the door corridor read as an orphan; poles remain in
  both bays, on the parked stretcher, and at (18,12)
- ADDED bench (6,13) 2x1 (prop.bench.wood.tan default) — waiting bench for the triage row,
  anchors the previously bare bottom-wall stretch (hallway-proven pattern)
- unchanged: nurse_station (8,4), trash_can (1,13), iv_stand (18,12), wheelchair (18,13)

### NPC / zone / item moves (positions only, text untouched)

- dr_martinez (9,8) → (4,7) — posted behind the triage desk (shopkeeper composition; his
  radius-3 "rushes" orbit the desk)
- officer (7,8) → (4,9) — demands records at the desk front
- frantic_family (12,8) → (6,9) — pressures the desk's other end
- priya_privacy_officer (12,11) → (15,12) — her incident-triage post beside the exceptions
  stand in the SE corner. NOTE: Priya has minAct 3 — she does not render in qa captures
  (act 1); verified pre-existing (absent in er-clean.png at (12,11) too)
- unlocked_computer zone (6,6) → (7,6) — the logged-in workstation butts the nurse island's
  west face (stand decor moved with it, same icon anchors)
- emergency_exceptions item (17,11) → (16,12) — the chart stand joins the SE corner group
  (same depthRow-4 stand trick, same icon dy)
- whiteboard zone (10,2) unchanged (stand at (10,3), proven clear of the EMERGENCY panel)

### artCatalog.ts (er)

- PROP_DEFAULTS.patient_bay rebuilt: prop.bed.blue (hospital#178, the whole 38x78 vertical
  bed) + ivpole.single dx44 dy-20 + bedside.white dx62 dy-40 — head-line tops ~y50 against
  the wall (vending-machine overlap convention). Side-view bed.side.* frames stay registered
  (unused by er now).
- er overrides: patient_bay@15,2 mirrored (bedside.wood dx10 / pole dx38 / bed dx56 — 2px
  clear of the monitor at (18,2)); curtain re-keyed @14,2 (tan flipX); gurney re-keyed @15,8;
  NEW equipment@13,8 dx-6 (6px gap to the pod monitor); NEW crash_cart@17,6 parts dx -6/32
  (4px clear of the east wall column); NEW triage_desk explicit run [kw.plain, kw.drawers,
  kw.plain2, kw.end] — the position hash at (3,8) picked kw.doors twice, whose X door-braces
  read as packing crates.
- Decor: both anim.hscreen re-hung over the curtains (tx 3→4, tx 15→13; visible art y14..47
  clears the bay head-line); sign.cross tx 5.5→6 (clear of screen and title);
  prop.whiteboard wall board DELETED (bays + right screen claim the face; the status-board
  zone carries the identity); clipboard.navy → (4,8), phone.red → (5,8) dx0 (on the counter
  proper — on the end cap the 32px phone dwarfed and overhung the little leg piece);
  display stands (6,6)→(7,6) and (17,11)→(16,12) (depthRow 4 kept); (10,3) stand unchanged.
- ROOM_INTERACTABLE_ART.er unchanged (same stand-relative anchors).

### roomAmbience

No edits. Nurse patrol (x8-11, y4) intersects nothing new — the island is untouched; the
EMERGENCY panel, officer/family fidgets and monitor beep all follow. Verified on captures.

### Tests

- tests/art-substrate-proof.spec.ts: er depth trio re-pinned crash_cart (13,11)→(17,6):
  behind (17,5) / beside (16,6) west (east neighbour is the wall) / front (17,7).
- ART_ROOM=er proof run: 4/4 pass (atlas, depth, doors, lighting). npx tsc -p . clean;
  every capture console-clean.

### Chose NOT to do

- No second bed color: hospital#178 is the pack's only vertical hospital bed — two identical
  blue beds read as a standardized matched pair; bedside variety (white left / wood right)
  differentiates the bays.
- Left rows 9-11 west open — it is the door corridor and the triage queue floor; wear pools
  keep it textured (lab/it_office precedent).
- Did not seat the robot flush against the pod monitor (dx tuned to a 6px gap) — full butt
  merged their silhouettes at 1x.
- Phone stays chunky (32px art) — proven "ER hotline" scale from the clean pass, now
  anchored fully on the counter.
- vital_monitor's screen top sits under the HUD in captures (18,2 corner) — HUD occlusion is
  expected per protocol; the art is whole and registered.

### Verification

Sweep 1 (design1, 9 crops + 6 targeted zooms): 2 defects — triage-desk hash mids read as
X-braced crates; phone dwarfing/overhanging the end cap — plus the bench addition judged
against design bar 2 (bare south wall). All fixed (explicit desk run, phone tx5, bench).
Sweep 2 (design3, fresh, all 9 crops): clean. Sweep 3 (design4, fresh, all 9 crops): clean —
two consecutive clean sweeps on integrity + design bar.
Final: screenshots/art-substrate/er-design.png (copy of design4).

### er — design reviewer round (master)
Blind design reviewer: zero defects on both checklists across nine crops + nine zooms — outright
PASS. Every briefed zone named on sight (bays with whole vertical beds, status axis, nurse island,
triage row at the door with the queue, treatment side, stretcher/linen SW, bench, SE corner).
Taste-only observations logged, no action: triage row is a four-material patchwork with a 1px floor
sliver at one junction; status monitor reads near-orphan until the EMERGENCY axis registers; SE
pickup chair is the weakest "why there"; the reused pole prop lacks a hook/bag at zoom; south-center
open plain (defensible as gurney corridor + spawn circulation). VERDICT: PASS.

## hospital_entrance — design pass (2026-08-27)

Brief: arrival flow (mat → clear aisle → reception desk), waiting rows facing the desk/TV wall,
kiosk near the flow, plants/coffee anchoring corners; first thing a player ever sees. Root problem
found: the U-shaped reception counter sat inside the wall band with its baked workstation (monitor +
chair pocket) EMPTY while both staff NPCs stood on the public side reading as queueing visitors; the
coffee cart was a collisionless ambience sprite floating mid-floor at (5,5); side tables floated
diagonally off the seat columns; sanitizer stood mid-floor; the wheelchair read as an extra seat
inside the east column. Result — the zone story: **reception axis top-center** (free-standing U
counter at (7,3) with a walkable staff corridor behind it; Riley and Aiyana stand INSIDE the
transparent pocket on the desk's own footprint tiles — heads over the back counter, front counter
closing in front of their feet; window daylight above; desk phone on the right counter section),
**waiting west** (tan pairs rows 8/10 + row-end table at (4,8), plant between rows at the wall,
magazine rack anchoring SW, water cooler on the west wall), **waiting east** (mirrored blue pairs +
row-end table with a left-behind mug, plant between rows at the east wall), **info corner NE**
(kiosk + brochure display + fern, kiosk top-aligned with the desk on the same furniture line),
**entrance threshold south** (sanitizer stand snug at the mat's left edge, spawn on the mat,
wheelchair parked right of the mat, waste/recycling bin pair outboard), **coffee corner SE** (the
cart rebuilt as a real obstacle: wood table + espresso machine + steam), corners: NW plant, NE fern,
SW rack, SE cart. Center rows 5-10 stay open as the arrival plaza (the brief's "wide open" axis).

### Obstacle moves (roomData.json, hospital_entrance only)

- desk (7,2) 6x2 → (7,3) 6x2 — off the wall band; creates the row-2 staff corridor and puts the
  U pocket on walkable-adjacent tiles (shopkeeper composition, lab/ER/IT precedent)
- table (4,9) → (4,8) — west side table aligns with the top pair's row (was floating diagonally)
- table (15,9) → (15,8) — east mirror of the same fix
- ADDED table (17,12) 2x1 — the coffee cart as a real y-sorted obstacle in the SE corner
  (instance override draws wood table + espresso machine; replaces the roomAmbience sprites)
- plant (18,11) → (18,9) — east wall between the blue pairs (mirror of the west plant at (1,9))
- wheelchair (18,9) → (13,11) — parked at the entrance threshold right of the mat (dx -6 kept:
  clears the green bin by 3px)
- umbrella_stand [green bin] (13,11) → (14,11), trash_can [blue bin] (14,11) → (15,11) — bins
  shift outboard to make room for the wheelchair; the pair stays together
- hand_sanitizer (6,11) → (8,11) — sanitize-on-entry station snug against the mat's left edge
  (was mid-floor 3 cols away)
- ADDED water_cooler (1,6) 1x1 — west wall service fixture between corner plant and waiting
  column (it_office's (1,10) pattern); fills the bare 6-tile west edge

### NPC moves (positions only, text untouched)

- riley_entrance (10,4) → (10,3) — INSIDE the desk pocket at the baked monitor (her scene is a
  phone call at the desk; the desk phone sits one tile right). On the desk's own footprint tile;
  reachable at (10,2) — proven via QA-bridge probe (nearbyInteractable = riley_entrance)
- aiyana_intake (8,4) → (8,3) — the pocket's left station (intake side). Reachable at (8,2),
  proven the same way. Zones/items unmoved: welcome_board (2,2), hipaa_brochure (16,5) — both
  re-proven reachable

### artCatalog.ts (hospital_entrance)

- desk override parts get explicit depths: U slab depthRow 3 (ties with pocket NPCs at row 3 —
  NPCs are created later, so they win and draw over the back counter's lip; the player behind
  the desk at row 2 is correctly covered), front slab depthRow 4 (closes the pocket in front)
- NEW 'table@17,12' override: desk.k.wood + coffeemaker.b (dx 17, dy -12) + shadow — the cart
- 'plant@18,11' key → 'plant@18,9' (follows the plant); STALE 'plant@1,10' key deleted (dead
  since the clean-pass reviewer moved that plant to (1,9); the shipped look was the default
  orange.s fallback, now the explicit state)
- Decor: NEW window.gray.3 at tx 8.9 dy 14 (daylight over the now-freestanding desk — the move
  exposed bare wall; "sunlight spills through the glass doors" is the room's own text);
  phone.gray (8,1) → (11,2) dy -6 (the right counter section, beside Riley);
  chair.office.sky decor DELETED (fully visible in the pocket it read as a water-cooler jug);
  clipboard.plain DELETED and papers.a NOT re-added — every intake-forms placement near Aiyana
  (back counter, front ledge) merged with her boots or her transient chart-fidget icons into a
  machine-looking blob, and papers on the tiny round tables is the documented clean-pass trap;
  NEW mug.blue on the east table (15,8) dy -12 (left-behind coffee, pairs with the SE cart);
  brochure display table (16,5), door mat, wall items otherwise untouched

### roomAmbience.ts (lobby)

- Coffee-cart block: the three collisionless sprites (shadow ellipse + wood table + machine at
  (5,5), drawn at fixed depth 3 under everything) DELETED; the steam puff re-anchored to the new
  'table@17,12' obstacle (computed from the obstacle rect: machine top = footprint bottom − 12 −
  36). Riley sway, chatter, door whoosh untouched.

### Tests

- Depth-trio pin info_kiosk@16,3 UNCHANGED (kiosk deliberately kept at (16,3): its top row now
  aligns with the desk on one furniture line, and behind/beside/front tiles stay walkable).
- ART_ROOM=hospital_entrance proof run: 4/4 pass (atlas, depth, doors, lighting).
- npx tsc -p . clean; every capture console-clean.
- Interaction probe (QA bridge teleports): riley_entrance from (10,2), aiyana_intake from (8,2),
  welcome_board from (2,3), hipaa_brochure from (16,6) all prompt; desk front (10,5) correctly
  none — the player rounds the counter, entering via the open row-2 corridor on either side.

### Chose NOT to do

- No NPC left on the desk's public side: Riley's dialogue ("I'm on the phone with a patient's
  employer") and the sticky note "see Riley at the front desk" pin both staff to the desk; the
  U single's own baked pocket is LimeZu's intended staff position and the interaction radius
  (Manhattan ≤ 1) is satisfied through the back corridor.
- No desk-top paper clutter (see above — three placements tried, all read as debris/machines).
- Waiting-column side tables NOT placed between pair rows: at (2,9)/(17,9) the table+decor
  stacked into the chair backrests behind them and read as one confused appliance tower
  (verified in pixels, reverted same round); row-end placement keeps every silhouette whole.
- Wall band (two note boards + zone-icon TV + tv.wall + clock left, landscape/sanitizer/arrow
  right) left as the clean pass fixed it, except the added window over the exposed desk stretch.
- Center rows 5-10 left open on purpose — mat → desk arrival axis plus circulation between both
  waiting columns and the east door (wear pools + light pools texture it; ER/lab precedent).

### Verification

Sweep 1 (design1, 9 crops + 4 zooms): 4 defects — papers-on-table read as a gray machine at
(2,9) (the documented trap, recreated); table+mug merged with chair backrests at (17,9); pocket
chair decor read as a water jug; papers on the back counter collided with Aiyana's fidget zone.
All fixed (tables to row ends, chair + papers deleted). Sweep 2 (design2 → papers moved to the
front ledge, still muddy at Aiyana's feet — deleted). Sweep 3 (design3, fresh, all 9 crops):
clean on integrity + design bar. Sweep 4 (design4, fresh, all 9 crops): clean — two consecutive
clean sweeps. Final: screenshots/art-substrate/hospital_entrance-design.png (copy of design4).

### hospital_entrance — design reviewer round + master fixes (2026-08-27)

Blind design reviewer: **FAIL**, 4 findings; the desk-pocket staffing, arrival flow, waiting rows
and corner anchoring all praised ("near-pass; the design story is genuinely good"). Dispositions
(master-fixed, verified at 3x, ART_ROOM proof 4/4):
1. Clock rode the cap band — decor dy 8→16.
2. Wall board trio hung at three heights — bulletin_board dy -6→-18, welcome_board icon dy
   -36→-48: all three tops now level at y14, bottoms clear of the wood rail.
3. "Printer on bare floor" beside the kiosk = prop.table.small.white again (lab read it as an
   office chair; here a fax) — swapped to the nightstand pedestal, brochure clipboard dy -12→-30
   seated on its top.
4. The sanitizer trinket at the mat flank (dispenser-on-stand composite reading as a wall
   thermometer + cylinders) — obstacle deleted; the top-wall sanitizer covers the identity.
Taste notes left: rows face the entrance (no TV wall exists), fountain-table mushy at 1x, board
uniformity, oversized reception phone.
hospital_entrance VERDICT after fixes: PASS (master-verified).

## reception — design pass (2026-08-29)

Brief: the queue — door → counter, waiting chairs in tidy facing rows, GERALD's copier corner
as the office nook; Riley works the desk (sign-in + privacy-notice zones ON the counter). Root
problem found: the wood U counter sat flush against the wall band with Riley standing on the
PUBLIC side (reading as a queueing visitor at her own desk), the zone icons floated on the
front panel / floor corner, and the room's loose props (round table, IV pole, wheelchair,
nervous patient) drifted mid-floor. Result — the zone story: **office nook NW** (plant +
GERALD the copier + white lockers, bin at the counter's end), **patient-rights display W**
(chart on the wood nightstand pedestal at (2,4), fern below), **reception axis top-center**
(free-standing wood U counter at (7,3) with a walkable staff corridor behind it; Riley INSIDE
the transparent pocket — heads over the back ledge, front panel closing over her feet
(lobby-PASSed pattern, same counter model); sign-in clipboard and privacy-notice placard ON
the front counter flanking her; window daylight above (same exterior wall as the lobby's);
clipboard + mug clutter on the wing tops), **queue mouth** (tan runner at the counter's foot,
stanchion pair flanking it as the rope funnel), **staff wall NE** (teal lockers + parked IV
pole + plant), **waiting west** (two yellow pairs + round side table at the row end + nervous
patient pacing between the rows + wheelchair parked flush beside the row-10 pair as the
accessible seat), **reading corner SW** (magazine rack + new wood bench), **waiting east**
(two green pairs + chatty visitor gossiping at the water cooler + toy chest corner + plant
(14,13) breaking the bottom run), spawn landing kept clear.

### New atlas frames (manifest + slice; alpha-scanned split, recomposes pixel-exact)

- prop.counter.reception.wood re-rected [128,14,192,78] → [128,14,192,50] (top slab: wings +
  back ledge + monitors + pocket; source rows 0-49)
- NEW prop.counter.reception.wood.front [160,64,128,28] (front modesty panel, source rows
  50-77 — no pixels exist outside the x32-159 inset in those rows; same split geometry as the
  white lobby counter)

### PROP_DEFAULTS

- desk → two-part composite: top slab dy -28 depthRow 3, front panel dx 32 depthRow 4 (only
  reception uses the default; the lobby keeps its white override). Riley (row 3, created
  later) wins the tie with the top slab and the front panel covers her feet — shopkeeper
  sandwich, lobby-proven. Reception's redundant `desk` override removed.

### Obstacle moves (roomData.json, reception only)

- desk (7,2) → (7,3) — off the wall band; opens the row-2 staff corridor (east entry via
  (13,2)/(14,2)) and puts the U pocket on walkable-adjacent tiles
- tissue_box [round side table] (5,11) → (4,8) — orphan mid-floor → west row-end table
  (lobby's exact (4,8) pattern)
- wheelchair (1,10 ← 1,11) — aligned flush beside the row-10 yellow pair: the accessible
  seat at the row's end (was floating between rows and rack)
- iv_stand (17,4) → (17,2) — orphan mid-floor → parked at the top wall between the teal
  lockers and the NE plant (staff equipment staged by the lockers)
- ADDED bench (3,13) 2x1 (prop.bench.wood.tan default) — reading corner with the magazine
  rack; anchors the bare SW bottom wall (first placed (4,13), moved 1 tile to butt the rack
  group after sweep 1)
- ADDED plant (14,13) 1x1 (orange.s default) — breaks the bare bottom-wall run east of the
  spawn
- unchanged: trash_can (6,3) — with the desk at (7,3) it now reads as the bin at the
  counter's end (its depth-trio tiles (6,2)/(5,3)/(6,4) all stay walkable); stanchions
  (6,5)/(13,5) — the desk coming down turns them into the queue funnel at the counter's
  corners; chairs, lockers, copier, rack, cooler, toy chest, plants (1,2)/(18,2)/(1,5)

### NPC / zone / item moves (positions only, text untouched)

- riley (10,4) → (10,3) — INSIDE the desk pocket (her sprite is desk-bound, never wanders);
  reachable from the corridor at (10,2), QA-probed (nearbyInteractable = riley)
- nervous_patient (5,9) → (3,9) — paces between the west waiting rows in front of his seat
  (first tried (4,9): the row-end table at (4,8) sat on his head-line — the totem trap);
  wander radius 1 keeps him in the row pocket; probed reachable from (4,9)
- chatty_visitor (14,9) → (16,11) — gossips at the water cooler in front of the row-10 green
  pair (celebrity_crisis scene = water-cooler gossip); probed reachable from (16,12)
- sign_in_sheet (8,4) and privacy_notice (12,4) zones UNMOVED — the desk's move puts both
  tiles ON the counter's front row; players interact from (8,5)/(12,5) (QA-probed)
- patient_rights_poster (2,4) UNMOVED — pedestal upgraded (below)

### artCatalog.ts (reception)

- Decor: chair.office.gray @ (10,2) DELETED (Riley stands in the pocket now; a collisionless
  chair on the walkable corridor read as ghost furniture — lobby precedent);
  papers.a DELETED (the back ledge's free span left of Riley is narrower than the tray art;
  paper trays near a pocket NPC merged into a machine blob in the lobby review);
  clipboard.green ty1→2 (dy -5→-3) and mug.blue ty1→2 — same relative wing-top perches on
  the moved desk; NEW window.gray.3 wall decor tx 8.9 dy 14 (daylight over the exposed wall
  behind the corridor, centered on the desk; lobby's window, same building face);
  mat.tan.3x2 ty 8.5→5 (mid-floor rug related to nothing → queue runner at the counter's
  foot, top edge abutting the front panel, centered between the stanchions);
  display table at (2,4) prop.table.small.white → prop.table.phone.wood (the white tray
  table is the twice-failed frame — read as office chair in lab, printer in the lobby; the
  nightstand is the proven pedestal)
- ROOM_INTERACTABLE_ART: sign_in_sheet dy -26→-20 and privacy_notice dy -26→-22 (icons sit
  ON the front counter's top face, flanking Riley); patient_rights_poster dy -12→-30 (chart
  rests on the nightstand's top face — entrance/lab anchor)

### roomAmbience

No edits — reception's block is interactable pulses + ambient footsteps only (no geometry
overlays). Verified in captures.

### Tests

- Depth-trio pins UNCHANGED: water_dispenser (17,12) and trash_can (6,3) both unmoved, all
  six stand tiles still walkable (stanchions deliberately kept off (6,4)).
- ART_ROOM=reception proof run: 4/4 pass (atlas, depth, doors, lighting). npx tsc -p . clean
  after every change; every capture console-clean.
- Interaction probe (QA-bridge teleports): riley from (10,2), sign_in_sheet from (8,5),
  privacy_notice from (12,5), patient_rights_poster from (2,3), nervous_patient from (4,9),
  chatty_visitor from (16,12) — all prompt.

### Chose NOT to do

- Riley's head vs the baked back-ledge monitor: its top-right corner peeks ~9px over her
  hair — pixel-compared against hospital_entrance-design.png: the PASSed lobby pocket has
  the identical peek (same counter model, same tile). Left as the sibling-consistent look.
- Stanchions not butted to the desk corners at (6,4)/(13,4): (6,4) is the trash trio's
  "front" stand tile, and one row out they read as the queue funnel without merging into
  the counter silhouette.
- Trash bin kept at (6,3) despite the brief's "re-home?" flag — with the desk one row down
  it reads as the counter-end bin (baseline 4px above the desk foot, 2px x-gap to the wing),
  and moving it would re-pin the trio for no visual gain.
- South-center rows 11-13 left open — spawn landing + three-route circulation (wear pools
  texture it; er/lobby precedent), framed by bench/rack west and plant/cooler/toychest east.
- NPC "!" quest bubbles drift over chair backs while their owners wander — game UI that
  follows NPCs (depth 30+), transient, same disposition as it_office/lab.
- Wall items (landscape.a, lightswitch, clock, sanitizer, tv.wall, notice board,
  landscape.b) untouched except the added window — the hang line was fixed in the clean
  pass and re-verified level in every sweep.

### Verification

Sweep 1 (design1, 9 crops + 8x Riley zoom + lobby-pocket comparison): 0 integrity defects;
2 design finds — round table on the nervous patient's head-line (totem read) and the bench
floating 3 tiles off the rack group. Both fixed (patient to (3,9), bench to (3,13)).
Sweep 2 (design2, fresh, all 9 crops): clean on integrity + design bar. Sweep 3 (design3,
fresh, all 9 crops): clean. Two consecutive clean sweeps. Final:
screenshots/art-substrate/reception-design.png (copy of design3).

### reception — design reviewer round + master fixes (2026-08-29)

Blind design reviewer: **FAIL**, 3 findings; the queue story, rows, nook, corners and counter
junctions all praised ("the design pass itself lands"). Dispositions (master-fixed, verified at
3-4x, ART_ROOM proof green):
1. Riley stood ON the counter: the wood counter's split line left the full-width tan slab in the
   depth-tied U frame, so the later-created NPC drew over it. Split line moved up — U frame
   [128,14,192,36] (rows 0-35), front frame [128,50,192,42] (rows 36-77, slab + panel, depthRow 4);
   parts recomposed (U dy -42, front dx 0) pixel-exact. The slab now occludes her waist down; no
   shadow on wood. (The lobby's white counter split was already correct and is untouched.)
2. Clock crossed the cap trim — decor dy 8→16 (same fix as the lobby clock).
3. Notice-board's lowest baked notes dipped into the baseboard — reception override dy -8→-14
   (break_room keeps the shared default; fixing a first-attempt duplicate-key here too).
Taste notes left: all chairs face south (convention), TV over the queue not the seating, intercom
panel distance, undressed south plain (circulation).
reception VERDICT after fixes: PASS (master-verified).

## records_room — design pass (2026-08-29)

Brief: LIGHT TOUCH (user's favorite room; walls reviewed-good). Tighten shelving into stacks
with aisle logic, reading/sorting table as a station, wall untouched. Result — the zone story:
**archive wall top** (bookcase + white drawers column + book stack flanking each side, the tan
service counter with inbox tray / phone / outbox binders in the middle — kept as-is, judged
already reading as symmetric stacks with display aisles at cols 4-5 / 14-15), **sorting
station center** (clerk BEHIND his 4x2 island facing the room, sorting tray directly in front
of him on the desk top, audit-log monitor on the west end, case binders east — and the two
requesters of the entry gate now QUEUE at the desk: patient at the front-west corner, attorney
waiting at the east corner, so "Two people need help. Who do you assist first?" is visible in
one glance), **disposal corner SW** (shredder island + zone + crate stacks + debris, the CCO
posted beside the shredder zone overseeing, document cart capping the line at (6,11)),
**GERALD print pad south-center** (copier + whimsy sign, now with a contact shadow),
**scanner station SE** (tan island + fax with Dr. Tovar posted at its west flank — his
Safe Harbor data-set review belongs at the digitization station), spawn landing kept clear.

### Entity moves (roomData.json, records_room; NPC positions only, text untouched)

- records_clerk (10,10) → (10,7) — he stood on the PUBLIC side with his back to his own desk;
  now works BEHIND it facing the spawn (shopkeeper composition; stationary NPC holds the mark)
- patient_request (4,8) → (9,10) — was an orphan mid-floor on the west plain; queues at the
  clerk desk's front-west corner (wander r1 keeps her in the pocket)
- attorney (15,8) → (12,9) — was adrift on the east flank; waits at the desk's east corner
  (wander r2 = he paces the desk/GERALD pocket, in character)
- compliance_officer (8,12) → (5,12) — final boss held a mark next to the spawn; now oversees
  the shredder zone (the disposal line reads island → zone → BOSS → cart)
- dr_tovar (14,10) → (15,11) — floated between GERALD and scanner; posted at the scanner
  island's west flank (encounter NPC, never wanders)
- Obstacles, zones, items, doors, spawn: NO changes. document_cart (6,11) untouched — the
  depth-trio pin (behind (6,10) / beside (5,11) / front (6,12)) is unchanged and all three
  tiles stay walkable (CCO at (5,12) is adjacent, not on them).

### artCatalog.ts (records_room)

- ROOM_DECOR: NEW prop.papers.a at (10,8) dy -6 depthRow 9 — the sorting pile on the desk top
  directly in front of the clerk; bridges the 20px floor strip between his feet (y256) and the
  kt back row's top (y276), the it_office analyst-monitor trick.
- ROOM_PROP_OVERRIDES: NEW 'printer_station@12,11' = prop.copier + shadow:true — the
  reviewer's taste note (pale copier body faded into the beige floor). Room-scoped so
  reception's GERALD (against its darker wall band, PASSed) is untouched.
- The reviewer's optional "darker mat/rug under GERALD" was TRIED TWICE and reverted: a 2-tile
  gray mat.gray pad read as two doormats flanking the machine; prop.rug.green.2x2 read as
  furniture noise (and floor-layer fractional tx floored, off-centering it). The soft contact
  shadow is the tasteful minimum; the GERALD sign + green screen carry the identity.

### roomAmbience.ts (records block)

- Attorney subpoena envelope: the static sprite + y-bob tween stayed at his SPAWN point while
  he wandered (radius 2), reading as orphan papers on bare floor once he walked off — found in
  the design1 capture, 1.5 tiles from his body. Replaced with a per-frame follow (position +
  depth track the NPC sprite, bob folded into the follow; listener removed on destroy). The
  clean-pass note "stays at his side through idle turns" only held because he had not wandered
  yet in that capture.

### Chose NOT to do

- Archive stacks NOT rebuilt — checklist allowed "symmetric pairs may already suffice" and the
  pixels agree: bookcase + drawers-column pairs and the two book-stack columns flank the
  counter symmetrically; the cols 4-5 / 14-15 gaps read as display aisles (west one holds the
  unlocked_cabinet display, wear pools texture both).
- records_counter (top) left unstaffed — inbox/outbox trays + phone read as a drop-off window;
  the room's one clerk works the sorting desk.
- West plain (cols 2-7, rows 5-10) left open — it is the junction of west door corridor,
  shredder approach, desk approach and cabinet-zone approach (wear + light pools texture it;
  er/lab/reception precedent). The patient's old orphan spot was ON this plain.
- minimum_necessary_manual (17,8) and hipaa_penalties (10,4) untouched — both already sit on
  brown display stands (verified at 5x; the clipboard nests in the (17,8) stand's tray).
- Attorney's chart-fidget icon occasionally doubles his carried envelope (two paper icons near
  one NPC for ~2s) — transient npcLife fidget, same false-alarm family the lab pass cleared.
- His home tile (12,9) leaves his shadow ellipse kissing the GERALD sign's top edge by ~2px —
  imperceptible at 1x, judged not a defect.

### Verification

- Sweep 1 (design1, 9 crops + zooms): 0 integrity defects; design finds = clerk on the wrong
  side of his desk, patient/CCO/tovar orphan posts, attorney envelope left behind on wander,
  GERALD contrast. Fixes above (design2/3 captures judged the mat attempt and papers position;
  mat attempts reverted).
- Sweep 2 (design4, fresh, all 9 crops): clean on integrity + design bar. Sweep 3 (design5,
  fresh, all 9 crops): clean. **Two consecutive clean sweeps.**
- Interaction probe (QA-bridge teleports, 3-attempt retry for wanderers): records_clerk from
  (10,6), patient_request from (9,11), attorney from (12,10), dr_tovar from (15,10),
  compliance_officer from (5,13), audit_log on (7,9), shredder on (4,12), unlocked_cabinet on
  (4,4), minimum_necessary_manual from (17,9), hipaa_penalties from (10,5) — all 10 PASS,
  console clean.
- ART_ROOM=records_room proof run: 4/4 pass (atlas, depth, doors, lighting). npx tsc -p .
  clean; every capture console-clean. No manifest change, no re-slice, no pin updates.
- Final: screenshots/art-substrate/records_room-design.png (copy of design5).

### records_room — design reviewer round + master fixes (2026-08-29)

Blind design reviewer: **FAIL**, 3 findings; the room story, stacks, sorting station, queue and
corners all read ("the room's story reads well overall"). Dispositions (master-fixed, verified at
4-5x, ART_ROOM proof 4/4):
1. "Floating document stack" off the sorting desk's east end = the binders decor overhanging the
   desk edge — dx -2→-14, fully on the desk top.
2. "Fragmented machine below GERALD" = the copier's pale body in full camouflage against the beige
   floor (only lid rails / green screen / tray visible; the contact shadow wasn't enough) —
   obstacle moved (12,11)→(12,13) to back onto the south wall's dark band (IT-chalkboard
   anchoring pattern); override key follows.
3. Orphan narrow cabinet mid-floor = document_cart — moved (6,11)→(4,11), butting the shredder
   station as the disposal line's cap; depth trio re-pinned to (4,11) (behind (4,10) / beside
   (5,11) / front (4,12)).
Taste notes left: blank-faced white towers, lookup terminal 1.5 tiles off the wall, boxed-in print
corner, monitor cable overhang (intentional), operator facing (sprite tolerance).
records_room VERDICT after fixes: PASS (master-verified). **DESIGN PASS COMPLETE — all 7 rooms.**

### wrap-up finding (2026-08-30): stale test coordinates, masked by piped exit codes

The progression suite's "green" runs after the design pass were false: piping through `tail`
masked playwright's exit code, and the line reporter's ANSI rewriting hid "N failed" from the
captured logs. Running door-unlocks alone surfaced 3 real failures (records-after-lab,
IT-after-records, ER-after-IT): `tests/helpers/qa-helpers.ts`'s hand-maintained ROOMS coordinate
table had gone stale for every entity the design pass moved — the exact failure class its own
2026-07-06 comment documents. Fix: ROOMS entity positions are now DERIVED from roomData.json at
load (requirements/door wiring stay hand-written); the table can no longer go stale on a move.

### wrap-up complete (2026-08-30)
Final suites, honestly exit-checked: art-substrate proof 53/53; progression 31 passed / 4 skipped /
35 accounted, EXIT 0, in 7.7m (the stale coordinates had also been the slowness — the false-green
runs took 37m). Grid: screenshots/art-substrate/grid-audit-1-vs-final.png. RUN_REPORT-11 §14 and
auto-memory updated. Nothing committed; the §11-13 work was committed as a88f0df by the user/other
session, so the dirty tree is the §14 set awaiting approval.
