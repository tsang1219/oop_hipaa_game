# PrivacyQuest — Design Standard

> **Purpose:** This is the "Taste Test" for game design quality. POLISH_STANDARD checks if things work correctly. This document checks if things are **good** — visually coherent, spatially logical, emotionally resonant, and satisfying to play. Every evaluation uses the 8 lenses below. Each lens has a 1-10 rating scale and concrete criteria. A room, feature, or system that scores below 9 on any lens needs work. The bar is 9/10 — "great" is the minimum, not "good enough."

---

## Lens 1: Sprite Identity

> "If I screenshot two NPCs side by side, can I tell who they are without reading the label?"

Every character should be visually distinguishable by role and personality. No two NPCs in the same room should look identical unless they're intentionally the same type (e.g., two patients in a waiting room).

### What 10/10 looks like:
- Each NPC uses a spritesheet that matches their role (doctor = white coat, nurse = scrubs, officer = uniform, IT tech = casual + badge)
- The player sprite renders correctly on spawn — no blocky placeholder that switches to real art on first move
- NPCs have idle animations or facing directions that feel alive (not all facing the same way)
- Completed NPCs are visually distinct from uncompleted ones (gray + checkmark, not just alpha change)

### What to check:
- [ ] Every NPC in the room uses a unique or role-appropriate spritesheet (not the generic `npc_staff` fallback)
- [ ] Player sprite matches its designed art from frame 1 (no placeholder flash)
- [ ] NPCs facing directions make contextual sense (receptionist faces the counter, doctor faces the patient)
- [ ] Character sprites have enough detail to read at 32x32 — hair color, clothing color, accessories

### Common failures:
- 15+ NPCs falling back to the same purple-shirt `npc_staff` texture
- Player spawning as `player_down` (programmatic blocky sprite) before spritesheet kicks in
- All NPCs in a room facing the same direction regardless of context

---

## Lens 2: Spatial Logic

> "If I removed all the labels, would someone recognize what kind of room this is from the layout alone?"

Furniture and props should be arranged the way they would be in the real space, not scattered randomly on a grid. A reception area has a counter facing the entrance. A lab has bench runs along walls. An ER has curtained bays in rows.

### What 10/10 looks like:
- Props form recognizable clusters: desk + chair + computer = workstation. Table + chairs = seating area.
- NPCs are positioned where their role would put them (receptionist behind desk, patient in waiting area, doctor at bedside)
- Clear flow: entrance → first thing you see → navigation through space → exits
- Negative space is intentional: an empty center is a walkway, not a missed opportunity

### What to check:
- [ ] Chairs are adjacent to tables or desks (not floating alone)
- [ ] Workstations have a desk + chair + computer/monitor cluster
- [ ] Medical equipment is near where it would be used (IV stand near bed, monitor near patient bay)
- [ ] The room has a clear "front" (where you enter) and "back" (where important things are)
- [ ] Props are grouped by function, not evenly distributed across the grid

### Common failures:
- Chairs in the middle of a room with no table nearby
- Desks against walls with chairs on the wrong side
- Equipment scattered randomly instead of clustered by use
- All rooms having the same density regardless of type (ER should be dense, lobby should be open)

---

## Lens 3: Visual Readability

> "Can the player instantly tell where they can walk vs where they can't?"

Walls, floors, obstacles, and walkable space need clear visual contrast. The player should never bump into something they couldn't see. Doors should be obvious. Interactive elements should stand out from static furniture.

### What 10/10 looks like:
- Floor tiles have subtle texture/pattern that distinguishes them from walls
- Walls are visually heavier (darker, thicker border, different material read)
- Interactive objects (NPCs, zones, items) have visual affordance — they look "touchable" vs. static furniture
- Doors are immediately visible with a clear "this is an exit" visual treatment
- Hallways have distinct wall/floor contrast so they don't read as flat 2D surfaces

### What to check:
- [ ] Floor and wall colors have sufficient contrast (not the same shade)
- [ ] Obstacles cast shadows or have depth cues that separate them from the floor
- [ ] Doors have a distinct visual treatment (color, glow, or icon) that says "exit here"
- [ ] Interactive elements (NPCs, zones, items) are visually distinguishable from static obstacles
- [ ] Hallways have visible walls vs floor vs ceiling differentiation

### Common failures:
- Walls and floors being the same flat color with only a thin line separating them
- Hallways reading as a single flat surface with no spatial depth
- Objects appearing to float on the floor with no grounding (shadow, base, border)
- Doors being the same color as walls

---

## Lens 4: Gameplay Clarity

> "If I put a new player in front of this screen, would they know what to do in 3 seconds?"

The player should always understand: where am I, what should I do next, and how do I do it. The HUD, NPC states, room layout, and visual cues should answer these questions without requiring the player to read instructions.

### What 10/10 looks like:
- Uncompleted NPCs have a visual draw (pulse, exclamation mark, distinct color) that says "talk to me"
- The HUD clearly shows room progress: X of Y NPCs talked, X of Y zones found, X of Y items collected
- Gated NPCs have a visual indicator that says "not yet" (different from "come talk to me")
- The room layout naturally guides the player toward the first interaction
- After completing a room, the exit is visually obvious and rewarding

### What to check:
- [ ] New player can identify who to talk to without trial-and-error
- [ ] HUD progress indicator updates in real-time and is readable at a glance
- [ ] Gated NPCs look different from available NPCs (not just "try and fail")
- [ ] Observation zones have a visual hint before the player walks over them (not invisible)
- [ ] Educational items have "pick me up" visual affordance (glow, bounce, sparkle)
- [ ] Room completion triggers a clear, satisfying signal (not just a state change)

### Common failures:
- All NPCs looking the same regardless of completion or gate status
- HUD text too small or too far from the action to read
- No visual difference between "locked NPC" and "available NPC"
- Observation zones being invisible until the player stumbles onto them

---

## Lens 5: Proportional Detail

> "Does anything look like it was pasted in from a different game?"

Everything should feel like it belongs at the same scale and fidelity. A detailed NPC sprite next to a flat-color rectangle obstacle looks wrong. A 20-pixel shadow under a 10-pixel object looks wrong. A huge HUD on a small canvas looks wrong.

### What 10/10 looks like:
- Shadows are proportional to object size (small shadow under small object, larger under furniture)
- Text sizes follow a clear hierarchy: room title > HUD > NPC names > prompts
- Obstacle sprites have similar detail level to NPC sprites (not rectangles next to chibi art)
- The canvas is well-proportioned — no dead space around the game area, no cramped UI overlapping gameplay

### What to check:
- [ ] NPC shadows are proportional to their sprite size (not oversized ellipses)
- [ ] Furniture/obstacle rendering matches the detail level of character sprites
- [ ] Text sizes are consistent across similar elements (all NPC name labels same size)
- [ ] The HUD doesn't obscure gameplay or feel cramped
- [ ] No visual element feels dramatically more or less detailed than its neighbors

### Common failures:
- Giant ellipse shadows under small NPC sprites
- Obstacles rendered as flat colored rectangles while NPCs have chibi pixel art
- Inconsistent text sizes (some labels 5px, some 10px, no hierarchy)
- HUD panel covering gameplay area or looking disconnected from the game

---

## Lens 6: Emotional Tone

> "Does this room make me FEEL the way the story needs me to feel?"

Each room exists in a narrative act with a mood. The visuals, audio, density, and color palette should reinforce the emotional context. A warm reception area. A tense ER. A sterile lab. A casual break room.

### What 10/10 looks like:
- Each room has a distinct color temperature: warm (reception, break room), neutral (records, lab), cool/urgent (IT, ER)
- Room density matches mood: sparse = calm, dense = tense, cluttered = casual
- Audio matches the space (different ambient tone per room or per act)
- Act progression is visible: Act 1 rooms feel safe, Act 2 feels uneasy, Act 3 feels urgent
- Props tell micro-stories: a half-eaten lunch in the break room, an overflowing inbox in records

### What to check:
- [ ] Color palette is intentionally different per room (not all the same gray/beige)
- [ ] Act 1 rooms (entrance, reception, break room) feel welcoming and safe
- [ ] Act 2 rooms (lab, records) feel investigative and slightly uneasy
- [ ] Act 3 rooms (IT office, ER) feel urgent and high-stakes
- [ ] Each room has at least one "storytelling prop" that isn't required for gameplay but adds atmosphere

### Common failures:
- All rooms using the same wall/floor color palette
- ER feeling as calm as the reception because density and color are identical
- No emotional escalation from Act 1 to Act 3
- Props being purely functional (gameplay markers) with no atmospheric contribution

---

## Lens 7: Gameplay Satisfaction

> "Is playing this room fun — not just functional, but actually engaging?"

Every room should have a satisfying arc: discover the space, interact with people, solve a puzzle or make a decision, feel rewarded for completing it. Interactions should feel consequential. Completing the room should feel like an achievement. The player should leave each room having LEARNED something through gameplay, not through reading.

### What 10/10 looks like:
- Each room has a "moment" — one interaction that stands out (a tough decision, a surprise reveal, a satisfying discovery)
- Completing all requirements triggers a meaningful celebration (fanfare, visual effect, story beat)
- Patient stories reveal on room completion — connecting the abstract HIPAA rules to a human consequence
- The gate/unlock flow creates a mini-puzzle: "I need to observe X before I can talk to Y" feels like detective work, not arbitrary blocking
- Final NPC or final zone in each room reveals something that ties together what the player just learned
- There's a sense of narrative escalation across rooms — later rooms are harder, decisions are grayer, stakes are higher

### What to check:
- [ ] Room completion triggers a patient story reveal (the human impact moment)
- [ ] The observation gate flow feels like discovery, not bureaucracy
- [ ] At least one NPC dialogue per room has a genuinely tough choice (not one obvious right answer)
- [ ] Score feedback (correct/wrong) feels proportional — big mistake = big reaction, minor slip = gentle nudge
- [ ] The room has a clear emotional arc: enter (curious) → explore (engaged) → decide (tense) → complete (satisfied)
- [ ] Later rooms (Act 2-3) have harder decisions and less obvious right answers than early rooms (Act 1)

### Common failures:
- Room completion being a silent state change instead of a celebration
- Patient stories not appearing or not connecting to the room's HIPAA topic
- All rooms having the same difficulty regardless of act
- Gates feeling arbitrary ("why do I need to look at the whiteboard before talking to the doctor?")
- No sense of consequence — wrong answers feel the same as right answers

---

## Lens 8: Code Health

> "Is the codebase getting better or worse with each change?"

Every fix and improvement should leave the codebase cleaner than it found it. New code should follow existing patterns. Changes should be surgical. The architecture should be understandable by a new developer reading the code.

### What 10/10 looks like:
- roomData.json is the single source of truth for room layouts — no obstacle positions hardcoded in scene code
- SpriteFactory.ts has mappings for every NPC, not fallback defaults for 65% of characters
- ExplorationScene.ts is well-organized by concern (rendering, input, audio, QA commands in distinct sections)
- No dead code, no commented-out code, no TODO markers in shipped paths
- TypeScript types are accurate — no `as any` casts in game logic

### What to check:
- [ ] Changes to room layouts go in roomData.json, not ExplorationScene.ts
- [ ] New NPC sprites get proper mappings in SpriteFactory.ts, not hardcoded texture keys
- [ ] Fix agents aren't duplicating logic that already exists (check before adding)
- [ ] Net line delta is proportional to the change (adding 1 prop shouldn't add 50 lines)
- [ ] After each change, `npx tsc --noEmit` passes clean
- [ ] No file exceeds its original size by more than 10% per iteration (bloat detection)

### Common failures:
- ExplorationScene.ts growing without bound (already 1500+ lines)
- SpriteFactory.ts having partial mappings that leave most NPCs on fallback textures
- Fix agents adding retry loops or setTimeout hacks instead of fixing root causes
- roomData.json and scene code disagreeing on positions or obstacle types

---

## Scoring Guide

| Score | Meaning |
|-------|---------|
| 1-3 | Broken or placeholder — not functional enough to evaluate |
| 4-5 | Functional but no thought given to this lens — purely accidental quality |
| 6 | Some attempt but inconsistent — some things work, others clearly don't |
| 7 | Decent — passes at a glance but falls apart on closer inspection |
| 8 | Good — intentional, consistent, only minor issues remain |
| 9 | Great — feels polished, cohesive, memorable |
| 10 | Ship it — would feel at home in a Nintendo game |

## How to Use This Document

### For QA agents:
Walk through each lens for each room. Rate 1-10. For any score below 7, list the specific failures and concrete fixes. Prioritize: Lens 1-3 first (visual foundation), then 4-6 (design quality), then 7-8 (satisfaction + health).

### For fix agents:
Every fix ticket should reference which lens it addresses. A ticket that doesn't improve at least one lens score isn't worth making. Check Lens 8 (Code Health) on every change — even a perfect visual fix is bad if it bloats the codebase.

### For the design loop:
Rate all 8 lenses per room per iteration. Track scores over time. The loop continues until all rooms score >= 9 on all lenses, or scores plateau after 3 consecutive iterations with no improvement. Focus on the lowest-scoring lens across all rooms first (systemic fix), then per-room improvements.

### Prioritization order:
1. **Systemic issues first** — if Lens 1 (Sprite Identity) fails across ALL rooms, fix the sprite system once rather than room-by-room
2. **Foundation before decoration** — Lens 3 (Visual Readability) before Lens 6 (Emotional Tone)
3. **Player experience before code** — Lens 4 (Gameplay Clarity) before Lens 8 (Code Health)
4. **Impact per effort** — a SpriteFactory mapping fix touches all rooms at once; a single room's prop layout only touches one room
