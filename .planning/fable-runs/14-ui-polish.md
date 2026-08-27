# Run 14 — UI polish
**Mode:** own branch (`fable/ui-polish`) · **My checkpoint:** LIGHT for UI-01..04 (craft, not
taste) · MEDIUM for UI-05 (title/pause screen is a style call — show me options, don't just ship one)
**Read first:** `.planning/POLISH_SPEC.md` (Pillar H — UI-01 through UI-05), `CLAUDE.md`
commandments (esp. #5 "boring is a bug," #8 proportional feedback)

## The wish

Everything else on this project's list is about the *world*. This run is about the *chrome* —
the parts of the screen that aren't the room: fonts, nameplates, the HUD, modals, the title
screen. Right now none of it has had a real pass, and once the art substrate and living-world
runs land, mismatched UI will be the thing that visibly doesn't belong.

Four things, roughly in order of how cheap they are relative to how much they're worth:

1. **Font hierarchy (UI-01).** Press Start 2P is doing a job it was never meant for — it's a
   *display* font (headers, counters, short labels) being used for paragraphs of dialogue and
   feedback text. Nobody can comfortably read a wall of Press Start 2P. Pick one readable pixel
   body font (SNES-era, not a modern sans — keep the 16-bit identity), keep Press Start 2P for
   headers/counters/short UI labels only, and repoint every text block over ~10 words to the new
   font. Show me a before/after on one dialogue screen before you repoint everything.

2. **Nameplate collision (UI-02).** Reception's "Front Desk Coordinator" plate reads through a
   clipboard sprite right now — screenshots already prove it. Nameplates need to be
   collision-aware against props and each other: if the natural position overlaps something,
   displace it and draw a short leader line back to the NPC. This will interact with whatever
   Run 11 did to prop placement — read the current room geometry before you build the avoidance
   logic, don't guess at it.

3. **Diegetic HUD (UI-03).** The progress panel currently reads as a debug overlay — bare numbers
   in a box. Reskin it to read as an in-world object (a badge, a clipboard, a chart on a
   lanyard — your call, but it should look like something a hospital employee would actually be
   carrying, not a devtools panel). It needs to survive being screenshotted for a Steam page.

4. **Overlay motion (UI-04).** Every modal in this game — item popups, the codex, corkboard,
   feedback panels, narrative cards, debriefs, the request modal, sorter/triage overlays,
   tutorials — currently hard-cuts open and closed. Give every one of them a 150–200ms open/close
   transition (scale+fade or slide, whatever fits the surface). No modal should ever just *pop*.

5. **Title + pause screen (UI-05, taste-gated).** These are the first and most-repeated screens
   in the game and they're currently the least polished. Once Run 11's art substrate has landed
   (see Sequencing note below), bring the title screen and pause menu up to the same visual bar —
   real tileset-derived background/framing, not a flat gradient. **Show me 2-3 directions on the
   title screen specifically** before you commit — this is the one place in this run where my
   taste should gate before you build it out fully.

## Protect

- **Don't touch gameplay logic, HIPAA content, dialogue text content, or the save format.** This
  run only changes how things are *presented*, never what they say or how the game behaves.
- **Don't fight Run 11 or Run 12.** If `fable/art-substrate` or `fable/living-world` have landed
  by the time you start, read what they changed in the room-rendering and HUD-adjacent code
  before you touch the same files — build on top of their work, don't re-litigate it.
- The font swap must stay pixel-native — no smooth/modern webfont drift. If you can't find a
  CC0 or commercial-use-with-credit pixel body font that reads well at small sizes, say so and
  show me candidates rather than shipping something that looks wrong.
- Overlay motion (UI-04) must not slow down input — these are also the surfaces `FEEL-23`
  (input buffering) protects. A 150-200ms open transition should never eat or delay a keypress
  meant for the content underneath.
- Keep every existing `data-testid` and interaction target stable — this run must not break the
  Playwright progression suite by moving/renaming things tests rely on.

## Prove it

- Before/after screenshots for: one dialogue screen (font), Reception's nameplate collision case
  specifically (the clipboard overlap), the HUD in and out of combat/encounter context, one modal
  opening (frame sequence or short clip showing the transition, not just start/end stills), and
  the title screen (all candidate directions, then the chosen one).
- Playwright progression suite green, zero new console errors, `npm run check` (tsc) clean.
- A quick nameplate stress-test: screenshot every room's most cluttered corner and confirm no
  nameplate overlaps a prop or another nameplate.

## Hand back

- A branch I can play (`fable/ui-polish`), never committed to `main`.
- `RUN_REPORT-14.md`: what shipped, the font you picked and why, the title-screen directions you
  didn't choose (so I can see what got cut), and anything you couldn't cleanly resolve.
- If the diegetic HUD concept (UI-03) could reasonably go more than one way, show me options
  rather than committing to one silently — same rule as the title screen.

## Sequencing note

Fire this **after Run 11 has at least Reception done.** Two of the five items depend on it
directly: UI-02's nameplate-collision logic needs real prop layout to test against, and UI-05's
"match the art bar" instruction is meaningless without an art bar to match. Items 1, 3, and 4
(font, HUD, overlay motion) don't depend on Run 11 or Run 12 at all and could start earlier if
you want partial progress sooner — your call on whether to wait for the full brief or split it.
