# Character Portrait Generation

Generate proper **8-bit bust portraits** for each character to replace the
current dialogue portraits (which are just a crop of the tiny walk sprite).

## Fastest path — bulk-generate all 27 (recommended)

Don't hand-make them. The script loops every character, calls the Gemini image
API ("nano banana") with the prompts, and writes each PNG into the portraits
folder. **Zero npm installs** (raw fetch).

```bash
# Key auto-loads from repo .env (GEMINI_API_KEY). Or export it.
node scripts/generate-portraits.mjs   # generates all missing portraits (~a few min)
```

> ⚠️ **The API image model needs billing enabled.** The free API tier is
> `limit: 0` for image generation (429 RESOURCE_EXHAUSTED). Enable billing on the
> key's Google project (~$0.03–0.04/image → ~$1 for all 27), **or** use the free
> **web/paste route** below — image gen is free in the AI Studio / Gemini UI.

- Re-run anytime — **skips files that already exist** (resumable). `--force` redoes all.
- Just some: `node scripts/generate-portraits.mjs aiyana_intake marcus_lab_aide`
- `USE_REFERENCE=1 node scripts/…` also feeds each walk sprite in to keep hair/skin/clothes on-model.
- Model 404? try `MODEL=gemini-2.5-flash-image-preview node scripts/…`.

The per-character prompts + shared style live **inside the script**
(`scripts/generate-portraits.mjs`) — edit there to tweak a character.

## ⭐ Keeping all 27 the SAME style (this is the important part)

A shared text prompt is **not enough** — 27 independent generations drift in
palette, framing, zoom, outline weight, and lighting. To get one coherent cast,
use a **style anchor**: make ONE portrait you love, then force every other one
to match that *image*. (Nano banana is built for this image-to-image consistency.)

**Script route:**
```bash
# 1. Make + eyeball a single hero portrait (pick a clear, central character)
node scripts/generate-portraits.mjs aiyana_intake
# 2. Approve it. Then generate the rest, matched to it:
STYLE_ANCHOR=aiyana_intake node scripts/generate-portraits.mjs
```
Every generation is told to reproduce the anchor's exact style/palette/framing/
background and change only the person. The anchor file is skipped (already done).
If one comes out off-style, delete it and re-run — it'll re-match the anchor.

**Web / paste route (free, no billing):** do it all in **one AI Studio chat**.
Generate the hero first; once you like it, for each next character say
_"Same exact art style, palette, framing, and background as the image above —
now draw: `<subject>`."_ Keeping them in one conversation (with the hero visible)
is what holds the style together. Don't start a fresh chat per character.

The shared prompt is also written to be as deterministic as possible (locked
~64×64 pixel grid, ~24-color palette, 1px outline, no anti-aliasing, single
top-left light, fixed 70%-fill framing, #1a1a2e background) — belt and suspenders.

## How the game consumes them (already wired)

Save each as `<npcId>.png` in
`client/public/attached_assets/generated_images/privacyquest/portraits/`.
`getNPCPortraitImage()` returns that URL; `DialoguePortrait` (dialogue) and the
sorter `NPCReactionBubble` try it first and **fall back** to the sprite crop if
absent — so you can add them one at a time and nothing breaks meanwhile.

## Spec every portrait follows

- **Framing:** head-and-shoulders bust, centered, forward / slight 3⁄4, eyes upper third.
- **Aspect:** square. Rendered at 96px & 64px `image-rendering: pixelated` — author
  chunky pixels (design ~64×64 logical, export 256–512px square, nearest-neighbor).
- **Background:** solid dark navy `#1a1a2e` (or transparent). No text/logo/border/watermark.
- **Shared style prompt (in the script):** _16-bit SNES-era pixel-art bust, chunky
  pixels, limited palette + clean dithering, 1px dark outline, soft top-left key
  light, Chrono-Trigger / EarthBound / Stardew energy, on `#1a1a2e`, square._

## The 27 characters (id = filename)

riley_entrance · riley · aiyana_intake · marcus_lab_aide · dr_tovar ·
priya_privacy_officer · dr_martinez · nervous_patient · chatty_visitor ·
officer · frantic_family · nurse_nina · lab_tech · researcher · courier ·
records_clerk · patient_request · attorney · compliance_officer ·
security_analyst · vendor · workaround_employee · gossiping_coworker ·
friend_fishing · tired_employee · hr_director · selfie_coworker

Each character's persona/accent-color prompt is the corresponding row in
`scripts/generate-portraits.mjs` (the `CHARACTERS` array).

## Optional: object "portraits"

Zone/item dialogues (sign-in sheet, shredder, poster…) show a 📋 glyph. Want art
there too? That needs a small parallel resolver — ask and I'll wire it.
