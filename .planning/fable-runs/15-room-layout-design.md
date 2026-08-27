# Run 15 — Room layout design (shape + furniture purpose)
**Mode:** own branch (`fable/room-layout`, branched from `fable/art-substrate` once that's done —
not from `main`) · **My checkpoint:** HEAVY — this is a spatial design call, not a craft task.
Design memo first, then ONE room built to finished, then stop.
**Read first:** `.planning/POLISH_SPEC.md` (ART-08 density/walkway rules), `VISUAL_INSPIRATIONS.md`
(the Chrono Trigger density rule, the Pokémon Center walkway-legibility rule), `ROOM_DESIGN_STANDARDS.md`,
`.planning/fable-runs/room-clean-log.md` (what the pixel-defect loop already fixed per room — your
art baseline, don't re-litigate it)

## The problem this is NOT

`ROOM_CLEAN_PROTOCOL.md` (Run 11's ongoing loop) already hunts pixel-level defects — cut sprites,
floating objects, wrong identity, seams. That work is thorough and separate. This run doesn't touch
any of that. The rooms can be 100% defect-free by that standard and still have the problem this run
is for: **furniture placed with no relationship to itself, and floor plans that are uniform
rectangles regardless of what the room is for.**

The concrete example that triggered this: the break room's TV sits in front of where the table is,
with no sense — nobody arranged it that way, it just landed there. That's not a sprite bug, it's a
layout decision nobody made on purpose.

## The wish

For each of the six **content rooms** — reception, break room, lab, records room, IT office, ER
(hallways and the supply closet are explicitly out of scope for this run) — design and build a floor
plan where:

1. **Furniture has a relationship to other furniture.** A TV faces seating, not the other way around.
   A workstation's chair is pulled up to its desk, not floating nearby. A kitchenette's counter,
   fridge, and table form one usable arrangement, not three unrelated objects that happen to share a
   room. If you can't say *why* two pieces of furniture are positioned the way they are relative to
   each other, that's the defect this run exists to fix.
2. **Rooms read as designed spaces, not pass-through corridors.** Right now the pattern is "furniture
   along the walls, empty rectangle in the middle, player walks through." Real rooms — especially a
   hospital's — have zones: a waiting cluster, a work cluster, a storage nook, a doorway approach that
   isn't just open floor. Walking into a room should suggest what happens there before any NPC speaks.
3. **Rooms don't need to be rectangles.** An alcove, an L-shape, a recessed nook for one piece of
   furniture, an angled counter — whatever actually fits the room's fiction. This is the part that's
   genuinely new: confirm early (see Prove it, step 0) whether the collision/walkable-tile system in
   `ExplorationScene.ts` already supports non-rectangular footprints (hallways look like they might
   already be irregular multi-way spaces — check before assuming either way) before you commit a
   design to a shape it can't render.
4. **Pathing is deliberate.** The route from the door to each interactive thing in the room should
   feel like a choice a level designer made — not just "whatever's left over after furniture placement."
   Walkways stay obviously walkable (the Pokémon Center rule already in `VISUAL_INSPIRATIONS.md`) even
   as the rooms get less rectangular and less along-the-walls.

## Protect

- **Doors are the highest-risk thing you can touch.** A door's tile position is load-bearing for
  BFS pathfinding hints (Phase 27's "next door" glow), the spawn-offset-on-entry logic, and the
  matching door on the other side of the wall. Strongly prefer NOT moving doors. If a room's redesign
  genuinely requires it, treat it as a flagged, called-out-separately change in your report — not a
  quiet side effect — and verify the connected room/hallway still makes spatial sense and the
  navigation glow system still resolves correctly.
- **NPC, zone, and item interaction tiles may move** (unlike the room-clean loop, which kept them
  fixed) — this IS a redesign — but every move must keep them reachable and put them somewhere that
  makes sense (a receptionist belongs behind a desk with a clear approach in front, not wedged in a
  corner). Verify reachability in every capture, the same discipline the room-clean loop already uses.
- **Reuse the art baseline, don't re-pick it.** `room-clean-log.md` documents which atlas frames are
  correct and why (e.g., the break room's TV-on-dresser composite, the kitchenette counter run). Your
  job is repositioning and re-composing what's already correct, not re-diagnosing art identity.
- **Stay inside the current camera/viewport bounds** (640×480) unless you explicitly propose and get
  sign-off on a bigger room — `RUN_REPORT-12.md` notes camera lookahead is currently a no-op because
  no room exceeds the viewport; don't silently break that assumption.
- Don't touch dialogue content, HIPAA facts, or the save format. Presentation and geometry only.
- `npx tsc -p .` and the Playwright progression suite (door unlocks, full playthrough, NPC
  interaction, room completion, navigation) must stay green — collision changes are exactly the kind
  of thing that suite exists to catch.

## Prove it

0. **Technical check, first, before any design work**: confirm whether the collision/walkable-tile
   system supports non-rectangular room footprints. Say what you found before proposing shapes that
   depend on the answer.
1. **Design memo, no code.** For each of the 6 content rooms: a floor-plan sketch/description (ASCII
   grid or annotated screenshot overlay is fine) showing the intended zones, the shape (rectangular or
   not, and why), and the specific fix for anything called out as broken (the break room TV/table is
   the known one — audit the other 5 for their own version of this). **Stop here for my approval
   before writing any code.**
2. **Build ONE room to finished** — break room, since it's the room with the named complaint — fully
   implementing its memo entry. Before/after screenshots, a walkthrough capture showing the door-to-
   interactable paths, and a specific shot proving the TV/table relationship now reads as intentional.
   **Stop here for my approval before touching the other 5.**
3. Once approved, the remaining 5 content rooms, same bar.
4. Every door/geometry change gets its own before/after in the report, called out by name — not
   buried in a room's general diff.
5. Playwright progression suite green, zero new console errors, `npx tsc -p .` clean, same as every
   other run in this series.

## Hand back

- A branch I can play (`fable/room-layout`), never committed to `main`.
- The design memo as its own artifact, even if I haven't approved the code yet.
- `RUN_REPORT-15.md`: the memo, what shipped, every door/geometry change flagged separately, and
  before/after screenshots per room.
- If a room's best layout genuinely needs a door move or a viewport-exceeding shape, say so and show
  me the case for it rather than working around the constraint silently or skipping the room.

## Sequencing note

**Do not fire this until Run 11's room-clean loop finishes all 13 rooms + hallways** — check
`room-clean-log.md`'s STATE header for confirmation and that `RUN_REPORT-11.md` has been written.
Branch from `fable/art-substrate` at that point, not from `main` — this run depends entirely on the
verified atlas frames and fixes that loop produced. Firing in parallel risks reshuffling obstacles
the clean loop is mid-verifying on the same shared working tree.
