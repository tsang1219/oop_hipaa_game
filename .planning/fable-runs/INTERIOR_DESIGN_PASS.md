# Interior design pass (Run 11 follow-up — layout, not just integrity)

The room-clean loop made every object whole; the user's verdict on the result: "the furniture
placement is sparse and kind of bizarre. It would be nice if it was arranged in a way that made
sense." You are the interior DESIGNER for ONE room. Your job is composition: make the room read as
a real, purposeful space a hospital would actually have — while keeping every object whole and every
proof green.

Mechanics (capture, sweep, tools, iron art rules, file list, deliverables) are inherited from
`.planning/fable-runs/ROOM_CLEAN_PROTOCOL.md` — read it first, plus the STATE block at the top of
`.planning/fable-runs/room-clean-log.md`. This file adds the design brief and NEW permissions.

## New permissions (the user granted these for this pass — they were forbidden before)

- **NPCs, interaction zones, and educational items in roomData.json MAY move** ("include their text
  too, i don't mind"). Their dialogue/content moves with them untouched — never edit text, ids, or
  any non-position field. Log every moved entity with old→new tiles and why.
- Obstacles may move, resize, be added, or be removed (type must have a PropDef; log everything).
- Decor is fully yours.
- Still forbidden: door positions, spawn points, room dimensions, educational text/content, files
  outside the protocol's list, `package.json` / `server/index.ts` / `client/src/data/gameData.json`.

## Design bar (judge every arrangement against these)

1. **Zones with purpose.** Furniture forms functional groups — a seating group faces something
   (a TV, a desk, a window), work surfaces cluster into stations, storage lines walls. No orphan
   prop stranded mid-floor; if you can't say in one phrase what a piece is FOR and why it's THERE,
   move it or cut it.
2. **Walls work, floors breathe.** Real rooms put tall furniture against walls and keep the middle
   walkable. Every door keeps a clear ≥1-tile approach; primary paths between doors stay ≥2 tiles
   where the room allows. Density: fill sparse plains purposefully (rugs, side tables, paired
   chairs, wall dressing) — but grouping beats scattering; empty floor WITHIN a walkway is good.
3. **People belong to places.** Move NPCs to where their role stands: staff behind their counters
   or at their stations, visitors in waiting areas, gossipers by the couch. Zones sit ON/AT their
   subject (the "overheard conversation" at the table it happens at). Items display on furniture.
4. **Perspective honesty.** The user reads side-view composites as "cut off" (ER side-view beds,
   sliced desk runs). Prefer front-facing furniture with a complete silhouette when the pack has
   it; keep a side-view piece only when it genuinely reads whole at 1x. Never mix perspectives in
   one furniture group.
5. **Readable at a glance** (the Nintendo test): distinct silhouettes, breathing room around every
   interactable (nothing important half-hidden behind tall props), the room's story visible in one
   screenshot — a stranger should name each area ("that's the kitchenette, that's the lounge").

## Per-room brief (yours is one of these)

- **break_room** — three zones: kitchenette along the top wall (counter run + appliances + fridge,
  already built), a dining zone (lunch table + chairs as a set, phone/trash by the wall not beside
  the dining table), and a TV lounge (couches FACING the TV with sitting distance — the TV is
  currently jammed against the lunch table; user-flagged). Vending pair stays as a bank.
- **lab** — bench ROWS with a workflow (specimen in → bench work → sink/autoclave out), the
  microscope station as a focal point, fridge/storage against walls. The user calls today's tables
  "kind of bizarre"; make the benches read as two clean parallel runs with stools, clutter only on
  bench tops.
- **it_office** — the server wall is good; make the floor read as desk PODS (paired workstations
  facing each other or a row facing the monitoring wall), GERALD's print corner stays a corner,
  keep the dark-room sight lines to the threat console.
- **er** — bays along the top (good), but the middle should read as: triage row → nurse island →
  treatment side. Consider front-facing beds if side-view bays still read cut (user-flagged);
  equipment (robot, crash cart) parks AT walls or bay-side, not adrift.
- **hospital_entrance** — arrival flow: entrance mat → clear path to reception desk → waiting rows
  facing the desk/TV wall, info kiosk near the flow not floating; plants/coffee anchor corners.
- **reception** — the queue: door → counter, waiting chairs in tidy facing rows near the wall TV,
  GERALD's copier corner reads as the office nook.
- **records_room** — the user likes this room most; light touch: tighten shelving into stacks with
  aisle logic, reading/sorting table as a station, keep the wall as-is.

## Loop and deliverables

Same loop as ROOM_CLEAN_PROTOCOL (capture → nine-crop sweep → list → change → re-capture) but each
sweep judges BOTH integrity (nothing cut/floating/overlapping — regressions are still bugs) AND the
design bar above. Done = two consecutive sweeps with zero integrity defects AND every design-bar
point satisfied in your own judgment. Then:
- `screenshots/art-substrate/<room_id>-design.png` (final capture copy).
- Log entry appended to `.planning/fable-runs/room-clean-log.md` (`## <room_id> — design pass`),
  listing every entity moved (obstacles, NPCs, zones, items: old→new tiles + the one-phrase why),
  every decor/catalog change, anything you chose NOT to do and why.
- **Tests**: `npx tsc -p .` clean. If you moved a prop pinned by the depth trios in
  `tests/art-substrate-proof.spec.ts` (top-of-file table) or the closet/door pins, update the pin
  coordinates to the new layout in the same change and log it. Run the room's own proof tests if
  the runner is available; the master runs the full suites after all rooms.
- Final report: the zone story ("kitchenette top wall, dining center-left, lounge bottom-right"),
  entity move table, files changed, screenshot path. Facts only.

## Reviewer protocol (blind, separate agent)

Capture fresh (`review-design <room_id>` suffix), nine-crop sweep, judge BOTH checklists: the
integrity list from ROOM_CLEAN_PROTOCOL step 3 AND the design bar above (call out any zone that has
no purpose, any orphan prop, any blocked approach, any NPC/zone/item that sits somewhere
nonsensical). Verdict `PASS`/`FAIL` with a numbered list. Do not read the designer's log first.
