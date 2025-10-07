# HIPAA Privacy Rule Game - Design Guidelines

## Design Approach
**Selected Approach:** Reference-based (Retro Gaming Aesthetic)  
**Primary References:** Game Boy, NES, early SNES RPGs (Pokémon, EarthBound, Final Fantasy)  
**Justification:** The PRD explicitly requires a retro 16-bit pixel art aesthetic with Out-of-Pocket color palette. This creates an engaging, nostalgic experience that makes compliance training feel less clinical and more game-like.

## Core Design Elements

### A. Color Palette

**Out-of-Pocket Retro Palette:**
- Primary Background: `204 82% 90%` (soft cyan-blue, like Game Boy screen)
- Game Container: `0 0% 100%` (pure white for dialogue boxes)
- Dark Accents: `0 0% 10%` (deep black for text and borders)
- Success/Correct: `140 60% 55%` (retro green)
- Warning/Partial: `45 90% 60%` (golden yellow)
- Error/Incorrect: `0 75% 60%` (coral red)
- Trust Meter Fill: `200 70% 60%` (medical blue)
- Border/Outline: `0 0% 20%` (charcoal for pixel borders)

**Dark Mode:** Not applicable - retro games used fixed palettes

### B. Typography

**Primary Font:** 'Press Start 2P' (Google Fonts CDN)
- Dialogue Text: 14px/1.6 line height
- Character Names: 16px, bold
- Choice Buttons: 12px
- Score/Meter Labels: 10px
- All text: Anti-aliasing OFF for authentic pixel feel

**Fallback Stack:** 'Courier New', monospace

### C. Layout System

**Tailwind Spacing Units:** Consistently use 2, 4, 6, 8, 12, 16 (p-2, p-4, p-6, p-8, p-12, p-16)

**Game Container:**
- Fixed width: 640px desktop (classic resolution)
- Mobile: Full width with 4-unit padding
- Centered on screen with generous vertical spacing (my-12)
- Background uses retro pattern or solid color

**Grid Structure:**
- Single column for dialogue flow
- Stacked vertically: Character Portrait → Dialogue Box → Choices → HUD
- No multi-column layouts (maintain retro simplicity)

### D. Component Library

**Character Portrait:**
- Fixed 200x200px square
- Thick 4px solid black border (pixelated)
- Centered above dialogue box
- Static images (no animation in Phase 1/1.5)
- Margin bottom: 6 units

**Dialogue Box:**
- White background with 3px black border
- Rounded corners: 2 units (subtle, not too modern)
- Padding: 6 units all around
- Shadow: 4px 4px 0px black (pixel-style drop shadow)
- Min-height to prevent jumping: 180px

**Choice Buttons:**
- Light gray background: `0 0% 94%`
- 2px solid border: `0 0% 60%`
- Padding: 3 units vertical, 4 units horizontal
- Margin between: 2 units
- Full width on mobile, max-width 500px desktop
- Hover: Background shifts to `200 50% 85%` (light blue)
- Active: Inset shadow effect (2px 2px inset)
- Cursor: pointer with pixel cursor if possible

**Feedback Display:**
- Appears below choices after selection
- Background color based on correctness (green/yellow/red at 20% opacity)
- Border: 2px solid matching the background at full opacity
- Padding: 4 units
- Margin top: 4 units
- Icon prefix: ✓ (correct), ⚠ (partial), ✗ (incorrect)

**Trust/Compliance Meter:**
- Horizontal bar, 100% width
- Height: 24px
- Background: `0 0% 85%` (gray)
- Fill: Medical blue gradient (subtle)
- 2px black border
- Segmented display (5 blocks) for retro feel
- Label above: "Compliance Level" in 10px font
- Positioned at top of game container

**Score Display:**
- Top-right corner of game container
- Format: "SCORE: [###]"
- Monospace pixel font
- Updates with +/- indicators when changed
- Color: Black on light background

**Scene Counter:**
- Top-left corner
- Format: "SCENE [#]/[#]"
- Same styling as score display

**Navigation Buttons:**
- Simple rectangular buttons
- 8px x 4px padding
- Positioned at bottom of game container
- "NEXT" button (when scene complete)
- "RESTART" button (after completion)
- Same hover/active states as choice buttons

### E. Visual Effects

**Minimal Animations:**
- Fade in dialogue text: 200ms ease
- Choice button hover: 100ms color transition
- Score/meter updates: 300ms smooth number increment
- NO complex animations or transitions (maintain retro authenticity)

**Pixel-Perfect Details:**
- All borders: solid, no gradients on strokes
- Box shadows: hard edges only (no blur)
- Images: crisp edges, no anti-aliasing
- Cursor: custom pixel cursor sprite if feasible

## Images

**Hero Section:** None - game starts immediately with character portrait

**Character Portraits:**
- Nurse Nina: 16-bit pixel art style, professional medical attire, friendly expression
- Size: 200x200px, PNG with transparency
- Style: Limited color palette (8-16 colors), clear outlines
- Placement: Centered, top of dialogue section

**Background Pattern:**
- Optional: Subtle pixel grid or medical cross pattern
- Very low opacity (5-10%)
- Tile seamlessly across viewport background
- Color: Slightly darker than primary background

**UI Icons:**
- Use pixel art style icons from icon libraries
- Or use text symbols: ✓ ✗ ⚠ ★ ♥
- No complex SVG illustrations

## Responsive Behavior

**Desktop (≥768px):**
- Game container: 640px centered
- All elements maintain aspect ratios
- Generous margins around container

**Mobile (<768px):**
- Container: 100% width, 4-unit side padding
- Character portrait: Scales to 160x160px
- Font sizes: Reduce by 2px
- Maintain vertical spacing rhythm
- Choice buttons: Full width with 2-unit gaps

## Accessibility Considerations

**Contrast:**
- All text meets WCAG AA against backgrounds
- Dark text on light backgrounds only (retro games were high contrast)

**Interactivity:**
- Clear focus states: 2px dashed outline
- Keyboard navigation support (arrow keys + enter)
- Touch targets minimum 44x44px

**Content:**
- Clear, concise feedback messages
- Logical tab order through choices
- ARIA labels for score/meter updates

---

**Design Philosophy:** Nostalgic authenticity meets modern usability. Every pixel counts - maintain the retro aesthetic while ensuring the educational content is clear and the compliance training is effective.