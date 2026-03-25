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

## Iteration 2+3 (post-fix) — 2026-03-25T01:00:00Z

| Scene | Score | Delta | Notes |
|-------|-------|-------|-------|
| hub-world | 7 | +3 | Reception desk with computer/papers, bulletin boards with pinned notes, potted plants with layered foliage, brick mortar walls, beveled floor tiles. Significant upgrade. |
| privacy-hub | 6 | 0 | Unchanged React UI |
| privacy-reception | 7 | +2 | NPCs now have chibi shading with eye sparkle, shirts have highlights/shadows. Chairs have seat/backrest/legs. Computer has green glow. Desks have drawers with handles. Player now renders as proper character. |
| privacy-er | 7 | +2 | Police Officer, Doctor, Family Member all visually distinct. Beds have pillows/blankets. Tables have legs. |
| privacy-lab | 7 | +2 | Similar improvements to all sprites |
| privacy-records_room | 7 | +2 | Same level of improvement |
| privacy-it_office | 7 | +2 | Same |
| privacy-break_room | 7 | +2 | Same |
| breach-start | 5 | 0 | Unchanged |
| breach-playing | 6 | 0 | Grid improvements from iter 1 holding |
| **CONSISTENCY** | **4** | 0 | PrivacyQuest improved significantly, BreachDefense less so. Gap widening. |

**Average: 6.4/10 (+1.4)**

### Key issues for next iteration:
1. Cross-game consistency — PrivacyQuest is pulling ahead, BreachDefense needs matching polish
2. BreachDefense waiting room chairs still flat blue squares (not using improved SpriteFactory)
3. Waiting chairs in hub world still flat blue — need to pick up the improved chair texture
4. Player character needs more detail (currently basic programmatic sprite)

## Iteration 4 (post-fix) — 2026-03-25T02:00:00Z

| Scene | Score | Delta | Notes |
|-------|-------|-------|-------|
| hub-world | 7 | 0 | Unchanged this iter |
| privacy-hub | 7 | +1 | Trust meter dark-themed, softer rose borders, room card shadows + hover scale, radial gradient bg |
| privacy-reception | 7 | 0 | Unchanged |
| privacy-er | 7 | 0 | Unchanged |
| privacy-lab | 7 | 0 | Unchanged |
| privacy-records_room | 7 | 0 | Unchanged |
| privacy-it_office | 7 | 0 | Unchanged |
| privacy-break_room | 7 | 0 | Unchanged |
| breach-start | 6 | +1 | Grid header + status panel visible behind modal, tower buttons have color indicators |
| breach-playing | 7 | +1 | "NETWORK DEFENSE GRID" header, column/row labels, circuit traces, terminal status panel, tower color indicators, larger HUD text |
| **CONSISTENCY** | **6** | +2 | Shared rose accent (#e8618c) across both games, matching font approach, both now have dark themed UIs. Gap narrowing. |

**Average: 6.8/10 (+0.4)**

### Key issues for next iteration:
1. Hub world waiting chairs still flat blue squares
2. All scenes at 7 — need ambient detail, lighting effects, particle touches to reach 8+
3. Player sprite in exploration rooms is basic programmatic (blue shirt rectangle)
4. BreachDefense grid still feels empty when no towers/enemies present

## Iteration 5 (post-fix) — 2026-03-25T02:30:00Z

| Scene | Score | Delta | Notes |
|-------|-------|-------|-------|
| hub-world | 8 | +1 | SpriteFactory chairs (cushion/backrest/legs), floor shine spots, dust particles, everything cohesive |
| privacy-hub | 7 | 0 | Unchanged |
| privacy-reception | 8 | +1 | Player now chibi sprite with shading, vignette edges, dust particles, warm atmosphere |
| privacy-er | 8 | +1 | Same ambient improvements |
| privacy-lab | 8 | +1 | Same |
| privacy-records_room | 8 | +1 | Same |
| privacy-it_office | 8 | +1 | Same |
| privacy-break_room | 8 | +1 | Same |
| breach-start | 6 | 0 | Unchanged |
| breach-playing | 7 | 0 | Unchanged this iteration |
| **CONSISTENCY** | **6** | 0 | PrivacyQuest rooms now at 8, BreachDefense still at 6-7. Gap growing. |

**Average: 7.3/10 (+0.5)**

## Iteration 6 (post-fix) — 2026-03-25T03:00:00Z

| Scene | Score | Delta | Notes |
|-------|-------|-------|-------|
| hub-world | 8 | 0 | Unchanged |
| privacy-hub | 7 | 0 | Unchanged |
| privacy-reception | 8 | 0 | Unchanged |
| privacy-er | 8 | 0 | Unchanged |
| privacy-lab | 8 | 0 | Unchanged |
| privacy-records_room | 8 | 0 | Unchanged |
| privacy-it_office | 8 | 0 | Unchanged |
| privacy-break_room | 8 | 0 | Unchanged |
| breach-start | 7 | +1 | "SECURITY BRIEFING" label, corner brackets, shield glow, gradient bg, personality |
| breach-playing | 8 | +1 | Scan line sweep, vignette, corner brackets, "AWAITING AUTHORIZATION..." terminal, header pulse |
| **CONSISTENCY** | **7** | +1 | Both games now at 8, shared cyan accent (grid) + rose accent (UI), matching vignette treatment |

**Average: 7.7/10 (+0.4)**
