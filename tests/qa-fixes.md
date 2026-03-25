# Iteration 1 Fixes

## Priority 1: LAYOUT — Canvas too small
**File**: `client/src/pages/HubWorldPage.tsx`, `client/src/phaser/PhaserGame.tsx`
**Fix**: Increase game canvas from 640x480 to 960x720 (1.5x). Update PhaserGame wrapper to scale the canvas container to fill available space while maintaining aspect ratio. All three page components should use the larger size.
**10/10**: Canvas fills a comfortable portion of the screen, sprites have presence, text is readable.

## Priority 2: SPRITES — NPCs use programmatic rectangles instead of real PNG spritesheets
**File**: `client/src/phaser/SpriteFactory.ts`
**Fix**: Update `npcTextureKey()` to return `npc_*_sheet` keys (e.g., `npc_receptionist_sheet`) instead of the flat programmatic `npc_*` keys. The real PNG spritesheets are already loaded by BootScene. Also update NPC sprite creation in ExplorationScene to use spritesheet frames instead of static textures.
**10/10**: NPCs are detailed pixel-art characters with walk animations, not colored rectangles.

## Priority 3: EXPLORATION — Floors and walls are flat
**File**: `client/src/phaser/scenes/ExplorationScene.ts`
**Fix**: Replace the 2-shade checkerboard floor with a richer tile pattern — use 3-4 shades with subtle variation to simulate hospital tile. Add a darker gradient/shadow at wall bases for depth. Make walls slightly taller with a highlight strip at top edge.
**10/10**: Floor looks like actual hospital linoleum tile with subtle variation. Walls have depth and shadow at base.

## Priority 4: BREACH — Grid is too dark and featureless
**File**: `client/src/phaser/scenes/BreachDefenseScene.ts`
**Fix**: Brighten the grid colors (currently 0x3d3460/0x2a2a3e — way too dark). Use a tech/circuit-board feel with subtle grid lines. Make the path cells clearly distinct. Increase dot markers to be visible.
**10/10**: Grid looks like a digital network map with clear paths, bright enough to see detail, tech aesthetic.

## Priority 5: LAYOUT — Font sizes too small
**File**: `client/src/phaser/scenes/ExplorationScene.ts`, `client/src/phaser/scenes/HubWorldScene.ts`
**Fix**: Scale all Phaser text from 5-7px up to 8-11px. NPC name labels should be 9px minimum. Room title should be 12px+. HUD text should be 10px+.
**10/10**: All text is crisp and readable at normal viewing distance.
