# Run 11 — The art substrate
**Mode:** own branch (`fable/art-substrate`) · **My checkpoint:** MEDIUM — style call is mine, execution is yours
**Read first:** `.planning/POLISH_SPEC.md` (Pillar A), `.planning/ASSET_PLAN.md`, `VISUAL_INSPIRATIONS.md`, `ROOM_DESIGN_STANDARDS.md`

## The wish

Right now every floor tile, wall, desk, and chair in this game is a rectangle drawn in code — about
3,900 lines of it across `client/src/phaser/sprites/`. It reads as beige squares with props floating
on them. It's the single thing standing between this and looking like a real game.

I want to open a room and see **a place**. Floor with texture and wear, not a checkerboard. Walls
with actual height, so the top of a room is a wall and not the void. Shadows under everything, so
nothing floats. Enough clutter in the corners that it feels lived-in — the Chrono Trigger density
rule and the EarthBound asymmetry rule that `VISUAL_INSPIRATIONS.md` already wrote down and we never
followed. Light that makes the ER feel cold and the break room feel warm using the same tileset.

The asset answer is almost certainly **LimeZu's Modern Interiors** (32×32, hospital + office + break
room themes, commercial use with credit, $1.50) — see `ASSET_PLAN.md` §2.1. If you find something
better, take it, but the licensing rule is absolute: **CC0 or commercial-use-with-credit only. No
CC-BY-SA, no GPL art.** Every pack you take writes its line in `attached_assets/CREDITS.md` at the
moment you take it.

Targets: **ART-01 through ART-08**, plus **ART-11** (atlas) if it falls out naturally.

## The shape of it

Roughly, and you can rearrange: acquire and license → build a slice-to-atlas step → map prop ids to
atlas frames in one data file → **delete** the procedural furniture drawing (deleted, not commented
out) → wall faces + baseboards + y-sorted occlusion → shadows → floor variants and wear decals →
per-room light and tint → density pass room by room against the two rules above.

Do Reception first, all the way to finished, and stop. Show me that one room before you do the other
eleven — if the style is wrong I'd rather find out once.

## Protect

- **Don't break gameplay geometry.** Collision, BFS pathfinding, door positions, zone triggers, and
  NPC spawn points all key off room data. The art layer changes; the walkable layer must not. If a
  prop must move for the art, move it in `roomData.json` deliberately and note it.
- **Don't touch dialogue, HIPAA content, the save format, or the single-route architecture.**
- Keep the TD tower/threat sprites as they are — they're fine, they're not this run.
- The `client/public/attached_assets` symlink is how everything resolves. New folders go *under*
  `attached_assets/`. Anything outside it 404s in production.
- Press Start 2P stays the header font. Don't redesign the HUD in this run — that's UI-01..05, later.

## Prove it

Trust the screen, not the code. For every one of the 12 rooms, a **before/after screenshot pair** in
`screenshots/art-substrate/`. Boot with the QA deep-links, don't click menus:
`/?qa-room=<roomId>&qa-no-save&qa_no_encounter=1`. Then walk the game end-to-end once with the
Playwright progression suite green and zero console errors.

Also show me three y-positions per room proving depth sorting is right, and one shot per room with
the lighting layer toggled off, so I can see what it's doing.

## Hand back

- A branch I can play.
- `RUN_REPORT-11.md`: what you bought and under what license, what you deleted, the rooms you're
  proud of and the rooms you're not, and every place you had to move gameplay geometry to serve art.
- The before/after grid, in one place, so I can judge the whole game in ninety seconds.
- If you hit a style fork — two plausible looks — **show me both on Reception** rather than picking.
