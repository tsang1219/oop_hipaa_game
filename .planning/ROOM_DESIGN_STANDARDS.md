# Room Design Standards

How rooms should feel and play. Not a spec sheet for an agent to execute literally — a rubric for judging whether a room is working.

See `VISUAL_INSPIRATIONS.md` for pixel art references.

---

## The Constraint

Our rooms are 20x15 tiles. That's small. A Pokemon Center is ~8x6 playable tiles with ONE barrier. We don't have space for elaborate mazes, and we shouldn't want them. The goal is **shaping**, not blocking. A single well-placed furniture cluster does more than five obstacles scattered around.

The observation gates already create the discovery mechanic — the player has to notice something before an NPC unlocks. We don't need the room layout to *also* create a puzzle. The layout's job is to make the room feel like a real place and give the player a reason to see more of it than the shortest path.

---

## Principles

### 1. Shape the path, don't block it

No straight beeline from door to key NPC — but also no hedge maze. The player should be **guided**, not obstructed. One furniture cluster in the right spot does this. A reception desk across the center. A lab bench dividing the room. The player walks around it naturally, sees more of the room in the process, and never feels like they're solving a navigation puzzle.

**The test:** Can the player reach any NPC within ~5 seconds of entering? If yes, the room flows. If it takes 15 seconds of winding around furniture, it's overdesigned.

### 2. Identity on entry

When the player walks through the door, the first thing they see should tell them what kind of room this is. Server racks for IT. Beds for ER. Filing cabinets for Records. The NPC they need is deeper in — past the identity-establishing furniture. You feel the place before you encounter the purpose.

### 3. Furniture forms clusters, not confetti

Group furniture into functional stations — a desk with a chair next to it, a counter with things on it, a workstation area. Scattered single props (one chair here, one plant there) feel random. Grouped furniture that suggests "someone works here" feels real.

### 4. Interactables along the natural path

Required items and zones should be things the player encounters on the way to NPCs, not dead-end detours. The observation gate especially — it should be something you walk past *before* reaching the NPC it unlocks. One optional item can be off the beaten path as a reward for explorers.

### 5. Density matches the room's tone

Not every room should feel the same. The ER should feel different from the Break Room. Spacious rooms feel calm. Dense rooms feel intense. Cozy rooms feel intimate. Match the furniture count to the emotion.

### 6. NPCs belong *at* things

No NPC islands — characters standing in empty space. Riley belongs behind a desk. Dr. Martinez belongs at a bedside. The lab tech belongs at a bench. The furniture near an NPC tells you who they are before you talk to them.

---

## Rework Tiers

Not every room needs the same level of attention. The rooms are tiered by how much structural change they actually need.

### Tier 1: Structural Rework (rebuild obstacle layout)

These rooms benefit from a real spatial concept that changes how the player moves through them.

**Records Room** and **ER** — see detailed specs below.

### Tier 2: Subtle Shaping (adjust 3-5 furniture pieces)

These rooms are mostly fine but need one or two pieces moved to break the beeline and make the space feel more intentional. Not a redesign — a nudge.

**Reception** — The desk already shapes movement. Might just need the waiting area chairs to feel more like zones (left vs. right) rather than random seating.

**Lab** — Equipment is dense but could use one central bench cluster to divide the room into a top (equipment) and bottom (interaction) half. Currently everything is along the walls.

**IT Office** — Already reworked with server racks, monitoring desk, cable trays. Mostly needs polish — the encounter trigger zone should feel like a natural destination, not an arbitrary spot.

**Break Room** — The lunch table is the natural shaping element. Make sure the couches and vending machines create the feeling of two "wings" so the player sees both sides.

### Tier 3: Leave It Alone

**Hospital Entrance** — This is onboarding. The player needs to feel oriented, not challenged. The desk is already a mild barrier. Open and welcoming is correct. Don't add complexity.

---

## Tier 1 Room Specs

### Records Room (Act 2 — The Stacks)

**Why it needs rework:** This room has the most interactables (4 NPCs, 3 zones, 2 items) and the "circular" layout tag, but nothing in the current layout creates a sense of place. It should feel like walking into a records archive — aisles of cabinets, a service counter, and the weight of thousands of patient files.

**The spatial concept: Filing cabinet aisles.**

Two or three rows of filing cabinets running vertically create narrow passages — like library stacks. This is both thematic (records storage) and functional (channels movement without feeling artificial). The player enters and immediately understands: this room is about paper, access, and the systems that control who sees what.

**How it plays:**
- Enter from either door → records counter is visible center-right, clerk behind it
- Filing aisles on the left side create the "stacks" — the unlocked cabinet (observation gate) is down one of these aisles. You spot it while walking through.
- The main aisle between the stacks and the counter is where most NPCs are — patient_request and attorney are on opposite sides of the counter
- Compliance officer and shredder are in the back, past the aisles — you reach them after you've already explored
- The vibe should be: structured, institutional, slightly claustrophobic

**What makes it unique:** The aisles. No other room channels movement this way. Walking between filing cabinets feels different from walking around a desk. It's the room's signature — the physical manifestation of "access controls."

**Design constraints:**
- Aisles need to be at least 1 tile wide (walkable)
- Don't block routes between doors and any interactable — aisles should channel, not trap
- The clerk desk / counter should be the first thing visible on entry — it anchors the room
- Keep existing NPC and zone positions (records_clerk at 10,10 — patient_request at 4,8 — attorney at 15,8 — etc.)

---

### ER (Act 3 — Controlled Chaos)

**Why it needs rework:** The ER is the final room. It needs to feel like a culmination — more intense, higher stakes, spatially different from everything that came before. Right now it has the right furniture (patient bays, gurneys, curtain partitions) but the layout doesn't use those pieces to create the ER *feeling*.

**The spatial concept: Curtain partitions creating patient bays.**

Real ERs are divided by curtains into semi-private areas. Curtain partitions as obstacles create something no other room has: **sight-line breaks**. You can't see into the next bay until you walk around the curtain. This is both spatially interesting and thematically perfect — the HIPAA challenge of maintaining privacy when there's only a curtain between patients.

**How it plays:**
- Enter from the left door → wide central aisle is clear (ER needs a "gurney path" — the route that stays open for emergencies)
- Patient bays on both sides, divided by curtain partitions — you can see the bay entrance but not what's inside until you step in
- The whiteboard (observation gate) is at the top/back of the room — visible from the central aisle but you have to walk up to read it
- Dr. Martinez is at a patient bedside in one of the bays — you find her by exploring
- Officer on one side, frantic family on the other — different emotional zones
- Medical equipment (crash cart, IV stands, vital monitors) fills the bay perimeters — the room feels equipment-dense without blocking the central path

**What makes it unique:** The curtain sight-line breaks. Every other room, you can see the whole layout from the door. In the ER, the curtains create pockets of space that you discover as you move through. This mirrors the real tension of ER privacy — you *hear* things from the next bay, patients overhear each other, and the curtain is the only thing between them.

**Design constraints:**
- Central aisle (roughly column 8-12) must stay clear — the "gurney path"
- Curtain partitions should be 1-2 tiles wide, positioned to create 2-3 bays on each side
- Don't make it a maze — the player should always be able to see the central aisle from any bay
- The room has only ONE door (left side) — the player enters and exits the same way. This is intentional: the ER is the end of the journey
- Keep existing positions: dr_martinez at 10,8 — officer at 2,7 — frantic_family at 17,7 — whiteboard at 10,2 — etc.

---

## Tier 2 Room Notes

Brief guidance for the rooms that need subtle adjustments, not rebuilds.

### Reception

**Current state:** Has a desk and privacy screens but they don't strongly divide the room. The waiting areas (nervous patient left, chatty visitor right) should feel like distinct zones.

**Adjustment:** Make sure the desk + privacy screens create a clear front-of-house (waiting) and back-of-house (staff) division. Chairs in the waiting area should face the desk, not sit randomly. The sign-in sheet zone should be something the player passes on the natural path to Riley.

**What makes it work:** The privacy screens. They're both routing elements and thematic storytelling — this is a hospital that takes privacy seriously. They don't need to block movement, just shape it.

### Lab

**Current state:** Equipment along the walls, NPCs in the middle. Feels flat — everything is accessible immediately.

**Adjustment:** One central lab bench cluster (2-3 tiles wide) that divides upper and lower halves. Equipment stays along the walls but the bench gives the room a center of gravity. The observation gate (results_printout) should be at or near this bench.

**What makes it work:** The density. Every surface should have something on it. This isn't a clean room — it's an active lab. The Chrono Trigger approach: organized chaos.

### IT Office

**Current state:** Already reworked with zones (server farm top, workspace middle, support bottom). Encounter trigger works.

**Adjustment:** Minor — make sure the path from either door to the security analyst passes through interesting space (server racks, monitor banks) rather than open floor. The encounter trigger should feel like arriving at a destination, not walking into an invisible tripwire.

**What makes it work:** The encounter. No other room has one. The spatial design just needs to support that moment.

### Break Room

**Current state:** Has a lunch table, vending machines, couches. Feels casual, which is correct.

**Adjustment:** The lunch table should be the shaping element — placed so the player naturally goes around it and encounters the gossip zone and overheard conversation on the way. The two sides of the room (vending/coffee vs. couches/TV) should feel like distinct hangout spots.

**What makes it work:** The contrast. The room feels cozy and safe — and then the dialogue reveals HIPAA violations happening in every casual conversation. The layout supports this by making the room genuinely comfortable to be in.

---

## Anti-Patterns

- **Maze rooms.** If the player feels lost or frustrated navigating furniture, we've failed. Shape, don't block.
- **Uniform density.** Every room the same amount of stuff. The ER and Break Room must feel different.
- **NPC islands.** Characters standing in empty space. Put them *at* something.
- **Furniture confetti.** Scattered individual objects instead of functional clusters.
- **Backtrack traps.** Required items in corners the player has no reason to visit.
- **Overengineered routing.** Forcing a specific path through a small room. Guide, don't dictate.
- **Every room gets the same treatment.** Most rooms need a nudge. Only 2 need structural rework. Applying the same level of effort everywhere wastes time and makes the game feel formulaic.

---

## Implementation Notes

**When doing a Tier 1 rework:**
1. Map the spatial concept first (aisles, bays, zones) before touching any data
2. Place structural obstacles (the things that define space), then verify all interactables are still reachable
3. Fill in decoration around the structures
4. Screenshot and playtest — does it feel right, or does it feel like a maze?
5. Adjust. The screenshot is the truth, not the JSON.

**When doing a Tier 2 adjustment:**
1. Identify the one beeline that needs breaking
2. Move or add 1-3 furniture pieces to shape it
3. Don't touch anything else. Resist the urge to redesign the whole room.

**General:**
- Prefer redesigning obstacles around existing NPC/zone/item positions
- If an interactable must move, update: `roomData.json`, `qa-helpers.ts` ROOMS constant, and any test files
- Test BFS pathfinding after changes — verify the player can reach every interactable and door
- Take screenshots at both doors' spawn points — what's the first thing you see from each entry?
