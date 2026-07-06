# Character Portrait Generation

Generate proper **8-bit bust portraits** for each character to replace the
current dialogue portraits (which are just a crop of the tiny walk sprite).

## Fastest path — bulk-generate all 27 (recommended)

Don't hand-make them. The script loops every character, calls the Gemini image
API ("nano banana") with the prompts, and writes each PNG into the portraits
folder. **Zero npm installs** (raw fetch).

```bash
export GEMINI_API_KEY=your_key        # free at https://aistudio.google.com/apikey
node scripts/generate-portraits.mjs   # generates all missing portraits (~a few min)
```

- Re-run anytime — **skips files that already exist** (resumable). `--force` redoes all.
- Just some: `node scripts/generate-portraits.mjs aiyana_intake marcus_lab_aide`
- `USE_REFERENCE=1 node scripts/…` also feeds each walk sprite in to keep hair/skin/clothes on-model.
- Model 404? try `MODEL=gemini-2.5-flash-image-preview node scripts/…`.

The per-character prompts + shared style live **inside the script**
(`scripts/generate-portraits.mjs`) — edit there to tweak a character.

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
