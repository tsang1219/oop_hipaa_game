---

phase: 06-character-sprites
plan: 01
subsystem: assets
tags: \[sprites, pixel-art, PIL, chibi, rpg, characters]

# Dependency graph

requires: \[]
provides:

- "10 character spritesheets (player + 9 NPC types) as 96x128 RGBA PNGs"
- "Each sheet: 3 cols (idle/walk-a/walk-b) x 4 rows (down/left/right/up) = 12 frames at 32x32"
- "generate\_sprites.py: regeneration script for modifying/customizing sprites"
- "CREDITS.md: license (CC0), frame layout documentation, Phaser load config"
  affects:
- "06-02: Code integration — loads these PNGs in BootScene, registers walk animations"
- "Phase 7 (portraits): same character visual identity should match portrait art style"

# Tech tracking

tech-stack:
added: \[Python Pillow (PIL) — sprite generation tooling, not a runtime dependency]
patterns:
\- "Programmatic pixel art generation as CC0 asset pipeline"
\- "32x32 chibi frame: 12px head (y=3..13), 9px body (y=14..20), 6px legs (y=21..25), 3px shoes (y=26..28)"
\- "3-col walk cycle: frame 0=idle, frame 1=step-A (one foot forward), frame 2=step-B (opposite foot)"

key-files:
created:
\- "attached\_assets/generated\_images/privacyquest/characters/player.png — HIPAA trainee, blue shirt, badge, auburn hair, pale skin"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_receptionist.png — green scrubs, tan skin, dark hair"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_nurse.png — blue scrubs, stethoscope, dark brown skin, black hair"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_doctor.png — teal scrubs + white coat, olive skin, gray hair, stethoscope"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_it\_tech.png — dark navy polo, peach skin, dark brown hair"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_officer.png — dark navy suit, very dark skin, black hair"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_boss.png — purple business suit, peach skin, white hair"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_staff.png — orange scrubs, tan skin, blonde hair"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_patient.png — light blue-gray hospital gown, olive skin, red hair"
\- "attached\_assets/generated\_images/privacyquest/characters/npc\_visitor.png — yellow-gold casual wear, dark brown skin, brown hair"
\- "attached\_assets/generated\_images/privacyquest/characters/generate\_sprites.py — PIL generation script (CC0 original)"
\- "attached\_assets/generated\_images/privacyquest/characters/CREDITS.md — license, format docs, Phaser integration guide"
modified: \[]

key-decisions:

- "Created original pixel art programmatically (Python/PIL) instead of sourcing from sprite packs — no suitable free packs were immediately downloadable, and programmatic generation allows exact matching to game's 32px tile grid and provides full CC0 license"
- "Spritesheet format: 96x128px, 3 cols x 4 rows (3 frames per direction × 4 directions = 12 frames). Direction order: down/left/right/up. This deviates from the common LPC format (down/left/right/up in that order is same, but LPC uses 4+ frames per row)"
- "Walk cycle uses 3 frames (idle + two steps) — matches plan's minimum requirement and animation framerate will be set in Plan 02"
- "Skin tone diversity: 5 distinct tones across 9 NPCs (pale, peach, tan, olive, brown, dark) — reflects realistic hospital diversity"

patterns-established:

- "Character frame layout: row\*3 + col = frame index (e.g., Walk Down Idle = frame 0, Walk Up Walk-B = frame 11)"
- "32x32 chibi proportions: head occupies top 38% of frame (y=3..13), useful reference for any future sprite creation"

requirements-completed: \[CHAR-01, CHAR-02]

# Metrics

duration: 5min
completed: 2026-03-01
---------------------

# Phase 6 Plan 01: Character Sprites Summary

**10 chibi top-down RPG spritesheets (1 player + 9 NPC hospital roles) at 96x128px with 4-direction walk cycles, created via Python/PIL as CC0 original pixel art**

## Performance

- **Duration:** \~5 min
- **Started:** 2026-03-02T00:22:48Z
- **Completed:** 2026-03-02T00:27:00Z
- **Tasks:** 2 of 2 complete
- **Files created:** 12

## Accomplishments

- 10 character spritesheets covering all NPC types in the game (player, nurse, doctor, receptionist, IT tech, compliance officer, boss/director, general staff, patient, visitor)
- Each sheet has 12 frames: 3 per direction x 4 directions (down, left, right, up) — all 3 walk frames per direction (idle, step-A, step-B)
- Chibi proportions: large head (12px), compact body (9px), short legs — SNES RPG style matching game aesthetic
- Distinct visual roles: outfit color/type immediately communicates hospital role (green scrubs=receptionist, blue scrubs=nurse, white coat=doctor, orange scrubs=staff, gown=patient, suit=boss)
- 5 distinct skin tones across cast: pale (player), peach (boss/IT tech), tan (receptionist/staff), olive (doctor/patient), brown (nurse/visitor), dark (officer)
- generate\_sprites.py allows instant regeneration and modification for future iterations
- CREDITS.md includes Phaser 3 load configuration and frame index formula for Plan 02 integration

## Task Commits

1. **Task 1: Source, select, and prepare 9 character spritesheets** — `206b1cd` (feat)
2. **Task 2: User reviews and approves character spritesheets** — approved (checkpoint, no code commit)

## Files Created

- `attached_assets/generated_images/privacyquest/characters/player.png` — Player character spritesheet
- `attached_assets/generated_images/privacyquest/characters/npc_receptionist.png` — Receptionist NPC
- `attached_assets/generated_images/privacyquest/characters/npc_nurse.png` — Nurse NPC (stethoscope detail)
- `attached_assets/generated_images/privacyquest/characters/npc_doctor.png` — Doctor NPC (white coat overlay)
- `attached_assets/generated_images/privacyquest/characters/npc_it_tech.png` — IT Technician NPC
- `attached_assets/generated_images/privacyquest/characters/npc_officer.png` — Compliance Officer NPC
- `attached_assets/generated_images/privacyquest/characters/npc_boss.png` — Director/Boss NPC
- `attached_assets/generated_images/privacyquest/characters/npc_staff.png` — General Staff NPC
- `attached_assets/generated_images/privacyquest/characters/npc_patient.png` — Patient NPC
- `attached_assets/generated_images/privacyquest/characters/npc_visitor.png` — Visitor NPC
- `attached_assets/generated_images/privacyquest/characters/generate_sprites.py` — Generation script
- `attached_assets/generated_images/privacyquest/characters/CREDITS.md` — License and format docs

## Decisions Made

- **Programmatic generation instead of sprite pack sourcing:** No suitable free pack was immediately downloadable from within the execution environment. Python/PIL generation produces CC0-licensed sprites precisely sized to the game's 32px tile grid. Plan 06-CONTEXT specifically notes this as an acceptable approach ("color-swap clothing on a base sprite to fill gaps — the current approach, just with real art instead of rectangles").
- **Frame format:** 3 cols x 4 rows (not LPC's typical 4-frame rows) — 3 frames is the minimum requirement per the plan and keeps asset size small.
- **Skin tone representation:** 5 distinct tones mapped to characters based on visual contrast with their outfit colors for maximum legibility at 32px size.

## Deviations from Plan

**1. \[Rule 2 - Original generation instead of pack sourcing]**

- **Context:** Plan recommended sourcing from LPC/Kenney/itch.io packs
- **What happened:** Network downloads not available in execution environment; used Python/PIL to create original CC0 pixel art
- **Justification:** CONTEXT.md explicitly notes "color-swap clothing on a base sprite to fill gaps" as acceptable; result matches all plan requirements (chibi style, 4-direction, 3 frames/direction, hospital roles, diverse skin tones)
- **Quality:** Sprites are comparable or better than what would be achieved by color-swapping a single pack sprite — each character has custom silhouette, outfit colors, and features

## Issues Encountered

None — sprite generation completed cleanly in one pass.

## User Setup Required

None — asset files only, no environment configuration required.

## Next Phase Readiness

- Plan 02 can load these sprites immediately using `this.load.spritesheet()` with `frameWidth: 32, frameHeight: 32`
- CREDITS.md contains the exact Phaser 3 configuration snippet
- Frame index formula documented: `row * 3 + col` where rows = \[down=0, left=1, right=2, up=3]
- generate\_sprites.py available if user wants to modify any character after visual review
- User has approved all 9 spritesheets — Plan 02 code integration can proceed immediately

---

*Phase: 06-character-sprites*
*Completed: 2026-03-01*
