# Iteration 4 Fixes — BreachDefense + Consistency

## Priority 1: BREACH — Grid needs more visual life and the area below grid is dead space
**File**: `client/src/phaser/scenes/BreachDefenseScene.ts`
**Fix**: Add subtle decorative elements to the grid — tiny circuit-trace lines connecting some cells, a header bar above the grid with "NETWORK MAP" or similar label, and fill the empty space below the grid with a terminal-style status readout area (dark panel with faint text lines). Also add column/row labels (A-J, 1-6) on the grid edges for a tactical feel.
**10/10**: Grid feels like a real network monitoring dashboard with depth and detail.

## Priority 2: BREACH — Tower selection panel needs tower preview icons
**File**: `client/src/pages/BreachDefensePage.tsx`
**Fix**: The tower buttons just show text names. Add small colored indicator squares/icons to each tower button to differentiate them visually. Use the tower's associated color from the constants. Also increase the button text from the current tiny size to be more readable.
**10/10**: Tower buttons are visually distinct with color-coded icons, easy to scan quickly.

## Priority 3: UI — Privacy Hub pink borders too garish, needs refinement
**File**: `client/src/components/HallwayHub.tsx`
**Fix**: Soften the hot pink (#FF6B9D) borders to a more subtle rose/mauve. Add subtle box shadows to room cards for depth. Add a subtle gradient background to the room grid area instead of flat dark navy.
**10/10**: HallwayHub feels polished and cohesive, inviting, not harsh.

## Priority 4: CONSISTENCY — Shared accent color and font sizes
**File**: `client/src/pages/BreachDefensePage.tsx`
**Fix**: Increase the HUD text sizes (currently small). The "Hub World" link and "Click grid to place selected tower" hint text should be at least 10px. Tower button text should be 9-10px. Make the border color slightly warmer to bridge toward PrivacyQuest's palette.
