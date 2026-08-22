# LimeZu — Modern Interiors (full version) — vendor drop

This folder holds the **raw, untouched** asset pack. It is intentionally **git-ignored**
(see the root `.gitignore`): the pack's license allows use in this project but forbids
redistribution, and this repository is public and deploys `attached_assets/` to GitHub Pages.

- Source: https://limezu.itch.io/moderninteriors (pay-what-you-want, full version)
- License: `LICENSE.txt` in this folder (edit + use in any commercial or non-commercial
  project; no reselling or redistributing; credit required)
- Credit line: see `attached_assets/CREDITS.md`

## Restoring this folder on a fresh clone
1. Buy/download the full pack from the itch page.
2. Unzip so that `1_Interiors/`, `2_Characters/`, `3_Animated_objects/`, … sit directly in
   this folder (`attached_assets/vendor/modern-interiors/1_Interiors/32x32/…`).
3. Re-run the slicer: `node scripts/art/slice-atlas.mjs` — it rebuilds
   `attached_assets/generated_images/privacyquest/atlas/` from the manifest in
   `scripts/art/atlas-manifest.json`. The committed atlas is what the game loads, so the
   game builds and runs **without** this folder; it is only needed to re-slice.
