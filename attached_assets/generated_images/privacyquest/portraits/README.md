# Character dialogue portraits (drop-in)

Generated 8-bit **bust portraits**, named exactly `<npcId>.png`
(e.g. `aiyana_intake.png`, `marcus_lab_aide.png`).

**Bulk-generate them:** `node scripts/generate-portraits.mjs` (needs `GEMINI_API_KEY`).

The game loads them automatically — `DialoguePortrait` and the PHI-sorter
`NPCReactionBubble` try `portraits/<npcId>.png` first and fall back to the
walk-sprite crop if the file is missing.

- npcIds + per-character prompts + style spec: `.planning/PORTRAIT_GENERATION.md`
- Square PNG, dark-navy `#1a1a2e` background (or transparent).
- Rendered at 96px / 64px `image-rendering: pixelated` — author chunky pixels.
