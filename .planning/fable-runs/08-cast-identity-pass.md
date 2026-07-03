# Run 08 — Cast identity pass (faces, colors, directory) + likeness pipeline
**Mode:** hybrid — agent preps unattended, user approves every face/font · **My checkpoint:** I approve portrait style, per-character colors, and any font change before they ship

> **STATUS 2026-07-02 — item 2 (signature colors) SHIPPED as the generic initial pass**, user-directed:
> 9-hue type wheel + 26 persona-matched per-NPC colors in `spriteAssetPaths.ts` (`getNPCColor`),
> wired into the dialogue portrait frame/name/panel stripe, sorter reaction bubble + portrait,
> and encounter request modal. Proof: `screenshots/run08/color-*.png`, driver
> `tests/run08-capture-cast-colors.mjs`. Suite 31/0/4 after. Items 1 (portraits), 3 (directory),
> 4 (overworld dedupe), 5 (font) + the likeness pipeline remain open.

## The problem (from live feedback, 2026-07-02)
The arcs and copy are good; the *presentation* erases them. 26 named NPCs share 9
spritesheets, the dialogue portrait is a 32×32 walk-frame upscaled 3×, and every word
in the game is the same flat white "Press Start 2P." Characters blend together —
players can't remember who was whom, so the arcs can't land.

## The wish
Every named character is recognizable at a glance and rememberable a room later:

1. **Real dialogue portraits.** A dedicated pixel-art face (64×64-ish, SNES
   Chrono-Trigger-portrait energy) for every named NPC — NOT a crop of the walk
   sprite. Main cast (~8) get 2–3 expression variants (neutral / pleased / done-with-
   this-printer) switched at dialogue moments. This revives deferred v1.1 Phase 7.
2. **Signature color per character.** One `color` field per NPC, used on the name
   plate, dialogue-frame accent, and sorter/triage speech bubbles. Nina is always
   teal; Marcus is always amber. Color = identity glue, one data field.
3. **Staff Directory.** An in-fiction hospital badge-board screen: portrait + name +
   role + one-line "what they're about" + arc state that updates as their story
   progresses ("Nina: 2 of 4 conversations · still at war with the printer").
   Commandment 9 — a cast codex that makes remembering people a collection mechanic.
   (CodexModal in `_trash/` may be a skeleton to resurrect.)
4. **Overworld distinctness for the main cast.** Unique or palette-swapped sheets so
   the 9-sheet sharing stops making strangers of the mains; one idle quirk each
   (clipboard glance, beaker swirl) — cheap, era-authentic.
5. **Font experiment (taste-gated).** Keep Press Start 2P for chrome/headers; try a
   softer pixel font for dialogue BODY text. Show me a side-by-side screenshot; I
   pick. Do not ship a font change without my eyes on it.

## Room for more characters (the pipeline — this matters as much as the pass)
I will keep adding people (real ones — think generated likenesses of friends/sponsors):
- **Character manifest:** one data entry = one person. Extend the NPC schema so each
  npcId can carry `portrait` (path), `sheet` (path), `color`, `role`, `directoryLine` —
  per-NPC asset override with fallback to the existing 9 type-sheets (today the sheet
  set is closed: BootScene preloads a fixed list — open it up, data-driven).
- **Asset convention:** `attached_assets/generated_images/privacyquest/portraits/<npcId>.png`
  (+ optional `characters/<npcId>_sheet.png`, the established 96×128 / 3×4 / 32×32 format).
- **Likeness generation:** a documented, repeatable photo → pixel-portrait (and
  optionally → spritesheet) recipe/script, so "add Dave" is: generate 2 PNGs, add 1
  manifest entry, done. (This un-pins the v2.2 "image-to-8bit pipeline" idea.)
  Playable-character select already proves the concept (nikhil exists) — generalize it.

## Protect
- HIPAA facts, dialogue content, and arcs: untouched — this run is presentation only.
- The 16-bit identity: everything must still read SNES, 32px grid, no smooth-art drift.
- My taste gates: portrait art style (show 3 candidate styles on ONE character first),
  each main-cast face, the font, the colors. Batch approvals are fine; silent shipping is not.
- Real-person likenesses only with that person's OK; sponsor faces via sponsorConfig.
- tsc + build + progression suite green after every landed slice.

## Hand back
- Portraits + manifest + directory shipped behind my approvals, or staged on a branch
  with screenshots if I haven't approved yet.
- The likeness recipe documented in `.planning/` (tools, prompts, sizes, palette rules).
- `RUN_REPORT-08.md` — what shipped, what's staged, what needs my eyes.
- CONTENT_MANIFEST.md untouched (no educational content changes expected — flag if any).
