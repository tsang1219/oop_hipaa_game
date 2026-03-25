# Visual QA Scores

## Iteration 1 — 2026-03-25T00:00:00Z

| Scene | Score | Delta | Notes |
|-------|-------|-------|-------|
| hub-world | 4 | — | Flat checkerboard floor, blue square furniture, tiny player, brown walls with no depth, small canvas |
| privacy-hub | 6 | — | Clean React UI, readable text, good room grid layout. Pink borders are garish but functional |
| privacy-reception | 4 | — | NPCs are flat colored rectangles (fillRect), chairs are blue squares, floor is bland checkerboard, labels barely readable |
| privacy-er | 4 | — | Same as reception — flat NPC blobs, brown square furniture, white rectangle beds, no texture |
| privacy-lab | 4 | — | Purple NPC rectangles, brown table blobs, blue test tube icons are okay but furniture is flat |
| privacy-records_room | 4 | — | Same flat style throughout |
| privacy-it_office | 4 | — | Same issues |
| privacy-break_room | 4 | — | Same issues |
| breach-start | 5 | — | Dark clean UI, good modal, shield icon nice. Grid visible behind overlay is very dark/featureless |
| breach-playing | 3 | — | Grid is dark purple squares with tiny dots, no tower sprites visible, no enemies, path barely visible, very dark |
| **CONSISTENCY** | **3** | — | Completely different visual languages — PrivacyQuest is beige/brown checkerboard, BreachDefense is dark purple/navy. Font styles differ. No shared palette. |

**Average: 4.1/10**

## Iteration 1 (post-fix) — 2026-03-25T00:15:00Z

| Scene | Score | Delta | Notes |
|-------|-------|-------|-------|
| hub-world | 5 | +1 | Canvas bigger, floor has beveled tiles, walls have shadow. But room doesn't fill canvas — huge dead space on right/bottom. Furniture still flat blue squares. |
| privacy-hub | 6 | 0 | Unchanged (React component, no Phaser changes) |
| privacy-reception | 5 | +1 | NPC spritesheets now rendering (correct pixel art!), text readable, floor tiles improved. But sprites tiny (32px on 960px canvas), room doesn't fill canvas, furniture still flat |
| privacy-er | 5 | +1 | Same improvements as reception |
| privacy-lab | 5 | +1 | Same improvements |
| privacy-records_room | 5 | +1 | Same improvements |
| privacy-it_office | 5 | +1 | Same improvements |
| privacy-break_room | 5 | +1 | Same improvements |
| breach-start | 5 | 0 | Unchanged |
| breach-playing | 5 | +2 | Grid brighter with visible checkerboard, path cells clearly purple with directional dots, red endpoint visible. Grid doesn't fill canvas though — dead space on right |
| **CONSISTENCY** | **4** | +1 | Both games now have similar canvas sizes, but PrivacyQuest rooms don't fill the larger canvas. Still very different color palettes. |

**Average: 5.0/10 (+0.9)**

### Key issues for next iteration:
1. Rooms/grid don't fill the larger 960x720 canvas — massive dead space
2. Sprites are 32px = tiny on the bigger canvas, need scaling
3. Furniture still flat colored rectangles (chairs, desks, tables)
4. Hub world room is small, doesn't use the space
