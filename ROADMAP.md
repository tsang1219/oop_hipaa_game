# OOP HIPAA Game — Roadmap

Phase 4 cleanup is done. This is the plan for getting both games to MVP quality.

---

## 1. Visual Enhancements

### 1a. PrivacyQuest Sprites (HIGH — current sprites are colored rectangles)
The exploration sprites (player, NPCs, furniture, objects) are all programmatic `fillRect` shapes — 32x32 pixel bodies with no arms, no detail, and near-identical directional frames. The SVG sprites in the battle dialogue screen are much better but only show during NPC encounters.

**Recommended steps:**
- Design or source spritesheets for the player (4-direction, 2-3 walk frames each)
- Design NPC portraits/sprites with more personality (lab coat, badge, etc.)
- Replace `SpriteFactory.ts` programmatic textures with spritesheet loads in `BootScene.ts`
- Furniture and room objects could stay simpler, but desks/computers/beds need at least a second pass

**Considerations:**
- Can use AI image generation (like the BreachDefense PNGs) or pixel art tools (Aseprite, Piskel)
- Spritesheet format: Phaser supports atlas JSON or simple grid spritesheets
- The SVG battle portraits (`NPCSprite.tsx`, `PlayerBackSprite.tsx`) could be converted to PNGs for consistency

### 1b. Walk Cycle Animation (HIGH — player is a static image that slides)
There is zero frame animation in the project. No `anims.create()` anywhere. The player texture swaps direction but each direction is a single static frame.

**Recommended steps:**
- Create 2-3 frame walk cycle per direction (minimum: idle + 2 step frames)
- Add `this.anims.create()` calls in the scene for player walk animations
- Play animation on movement, stop on idle
- Stretch goal: NPC idle animations (breathing, blinking)

### 1c. BreachDefense Tower/Enemy Visual Feedback (MEDIUM)
Towers have PNG sprites but zero firing animation. Enemies have no death effect. Projectiles are plain 4px circles.

**Recommended steps:**
- Tower firing: brief scale pulse or muzzle flash tween when firing
- Enemy death: fade-out tween + small particle burst or screen flash
- Projectiles: add a trail effect or glow, or at least make them larger/more visible
- Tower cooldown: subtle fill or ring animation showing reload progress
- Hit impact: small particle pop or screen shake on enemy kill

### 1d. Scene Transitions (MEDIUM — currently instant cuts)
Navigating between Hub, PrivacyQuest, and BreachDefense is an instant React route change with no visual transition.

**Recommended steps:**
- Add a camera fade-out/fade-in on scene transitions within Phaser (`camera.fadeOut` / `camera.fadeIn`)
- For cross-page navigation (React routes), add a brief CSS fade or slide transition
- Room entry/exit in PrivacyQuest could use a door-opening animation or screen wipe

### 1e. UI/HUD Visual Polish (MEDIUM)
The React HUD overlays work but are plain text with Tailwind styling. The tower selection panel shows names and costs but no icons.

**Recommended steps:**
- Add tower PNG thumbnails to the selection panel buttons
- Add threat icons to wave intro/recap screens
- Style the HallwayHub room grid with more visual flair (room preview images, status icons)
- Consistent color palette and styling across all three pages

---

## 2. Mechanics and Feel

### 2a. Player Movement Feel (HIGH — starts/stops instantly, no weight)
Movement is exactly 160px/sec with instant start/stop. Click-to-move teleports tile-by-tile at 120ms steps.

**Recommended steps:**
- Add slight acceleration/deceleration curve (ease into full speed, ease out on stop)
- Smooth out click-to-move with continuous movement along the path instead of discrete tile hops
- Add a subtle dust particle or footstep indicator on movement
- Camera follow already has lerp (0.1) which is good — could add slight camera lead in movement direction

### 2b. Interaction Feedback (HIGH — interactions are abrupt)
Pressing Space near an NPC immediately opens a full-screen React overlay with no transition. Completing an NPC just dims them to 50% alpha.

**Recommended steps:**
- Add a brief zoom-in or focus tween on the NPC before opening dialogue
- Animate the dialogue overlay in (slide up or fade in)
- On NPC completion: play a satisfying "complete" effect (sparkle, checkmark pop-in, brief glow)
- Add a subtle highlight/glow on interactable NPCs and objects when in range

### 2c. Tower Placement Satisfaction (MEDIUM — towers just appear)
The hover + range preview is good, but actual placement has no feedback.

**Recommended steps:**
- Add a "pop in" scale tween when placing a tower (0 → 1.1 → 1.0)
- Play a placement confirmation sound (when audio is added)
- Brief budget-deducted animation on the HUD (number flash/shake)
- Show a brief "Tower Placed!" floating text at the grid cell
- Add ability to click placed towers to see their range circle

### 2d. Tower Sell/Upgrade System (LOW for MVP)
Once placed, towers can't be modified. This limits strategy.

**Recommended steps (if pursuing):**
- Click a placed tower to select it → show info panel + sell button
- Selling refunds 50-75% of cost
- Upgrade is a stretch goal — would need balance design for upgraded stats
- This changes game balance significantly, so test thoroughly

### 2e. Game Speed Control (LOW for MVP)
No fast-forward button. Slow waves can drag.

**Recommended steps:**
- Add a 1x/2x speed toggle button to the BreachDefense HUD
- Multiply `dt` or Phaser time scale by the speed factor
- Pause between waves is already automatic (3-second delay) — could add "Send Next Wave" button

---

## 3. Gameplay, HUD, and Menus

### 3a. Sound Effects and Music (HIGH — there is zero audio)
No sound exists anywhere. This is the single biggest gap for game feel.

**Recommended steps:**
- Choose a sound library: Phaser has built-in `this.sound.play()`, or use Howler.js for more control
- Priority SFX: tower fire, enemy hit, enemy death, tower placement, wave start, game over, victory
- Background music: ambient loop per game mode (PrivacyQuest: calm exploration, BreachDefense: tense/electronic)
- NPC interaction: dialogue blip sound (classic RPG style)
- UI sounds: button click, menu open/close
- Add a mute/volume toggle in the HUD

**Considerations:**
- Free SFX sources: freesound.org, Kenney.nl, OpenGameArt
- Keep file sizes small — use MP3/OGG, not WAV
- Phaser's `WebAudioSoundManager` handles autoplay policy automatically
- Add sounds incrementally — SFX first, music second

### 3b. BreachDefense HUD Improvements (HIGH)
The HUD works but is missing useful information that already exists in the data.

**Recommended steps:**
- Show wave name/narrative on wave start (the `intro` field exists for all 10 waves but is never displayed)
- Show `suggestedTowers` hint for each wave (data exists, never surfaced)
- Show tower description on hover in the selection panel (the `desc` field exists but isn't shown)
- Add enemy count remaining indicator (enemy count is tracked but not displayed)
- Show `endMessage` for each wave on completion (data exists, never displayed)
- Add a visible pause button with resume

### 3c. PrivacyQuest Onboarding (HIGH — no tutorial exists)
BreachDefense has a 12-modal tutorial chain (maybe too much). PrivacyQuest has nothing — the player arrives at the HallwayHub with zero guidance.

**Recommended steps:**
- Add a brief intro modal on first visit explaining the premise ("You're a new Privacy Guardian at Memorial Hospital...")
- Show controls overlay on first room entry (WASD to move, Space to interact, ESC to exit)
- Highlight the first available NPC with a pulsing indicator
- Show the privacy meter prominently and explain what it means

### 3d. PrivacyQuest Privacy Score Visibility (MEDIUM)
The trust/privacy meter is tracked in state and affects gameplay but is only visible at the HallwayHub room picker — not during room exploration where decisions actually happen.

**Recommended steps:**
- Add a persistent privacy score indicator in the exploration HUD (top of screen or overlay)
- Animate score changes with a brief flash/pulse when it goes up or down
- Show score impact in the dialogue feedback ("Trust -5" or "Trust +10") visibly

### 3e. BreachDefense Save State (LOW for MVP)
PrivacyQuest saves to localStorage. BreachDefense doesn't save at all — refreshing resets to wave 1.

**Recommended steps:**
- Save current wave, budget, tower positions, and score to localStorage on wave completion
- On page load, check for existing save and offer "Continue" or "New Game"
- Clear save on victory or game over

### 3f. Victory/Completion Screens (MEDIUM)
BreachDefense victory shows waves completed + towers placed. No educational summary. PrivacyQuest end screen shows a score but no certificate or shareable result.

**Recommended steps:**
- BreachDefense victory: show which HIPAA Security concepts were covered, which threats were defeated, final score breakdown
- PrivacyQuest end: show which principles were learned, room completion stats, patient stories collected
- Stretch: a combined "HIPAA Certification" screen if both games are completed
- Stretch: shareable result image/link

### 3g. BreachDefense Tutorial Pacing (LOW)
12 modal interruptions across 10 waves is dense. Waves 2, 4, 6, 8, 10 auto-start silently while odd waves get a tutorial + recap.

**Recommended steps:**
- Consider making tutorials skippable with a "Skip Tutorial" button for replay
- Show wave intro text as a brief in-canvas banner instead of a modal (less disruptive)
- Add a "Ready?" button before each wave instead of auto-starting after 3 seconds
- Move some educational content to post-wave recaps instead of pre-wave interruptions

---

## 4. Infrastructure

### 4a. Code-Split Phaser Scenes (LOW)
Vite warns about chunk size (1.9MB JS bundle). Phaser itself is ~1MB.

**Recommended steps:**
- Lazy-load Phaser with `React.lazy()` + `import()` so the bundle doesn't include Phaser on initial page load
- Split each game page into its own chunk
- This improves initial load time but doesn't affect gameplay

### 4b. Deployment (MEDIUM — when ready to share)
Currently runs via `npm run dev` locally only.

**Recommended steps:**
- The express server is just a static file server in production — could deploy to Vercel/Netlify as a static site
- Or keep the express server for future API needs and deploy to Railway/Render
- Set up a build-on-push CI pipeline (GitHub Actions)

### 4c. Mobile/Responsive (LOW for MVP)
Phaser canvas is fixed-size. HUD is desktop-only layout.

**Considerations:**
- Phaser `Scale.FIT` can auto-resize the canvas
- Touch controls would need virtual joystick for PrivacyQuest and tap-to-place for BreachDefense
- This is a significant effort — probably post-MVP

---

## Suggested MVP Priority Order

| Priority | Item | Impact |
|----------|------|--------|
| 1 | Sound effects (3a) | Biggest single improvement to game feel |
| 2 | PrivacyQuest sprites + walk cycle (1a, 1b) | Exploration currently looks like placeholder art |
| 3 | BreachDefense visual feedback — death FX, firing FX (1c) | Makes combat feel alive |
| 4 | BreachDefense HUD improvements (3b) | Surfaces existing data that players need |
| 5 | PrivacyQuest onboarding (3c) | Players won't know what to do without it |
| 6 | Interaction feedback + transitions (2b, 1d) | Smooths the rough edges |
| 7 | Player movement feel (2a) | Improves exploration satisfaction |
| 8 | Privacy score visibility (3d) | Players need to see consequences of choices |
| 9 | Victory/completion screens (3f) | Ties the educational loop together |
| 10 | Tower placement feel (2c) | Nice-to-have polish |
| 11 | Deployment (4b) | When ready to share |
| 12 | Everything else | Post-MVP |
