# PrivacyQuest + BreachDefense — Polish Standard

> **Purpose:** This is the "Definition of Done" for visual quality, audio feedback, input behavior, and layout. Use it as a QA checklist — walk through every flow and verify each rule. Any violation is a bug.

---

## 1. MODAL & OVERLAY RULES

### Rule: All gameplay overlays render inside the 640x480 game canvas area, not full-browser.

The game canvas is 640x480px, centered on screen. Modals that stretch to full browser width look broken — a tiny pixel-art dialogue box shouldn't span a 1920px monitor.

**How it should work:**
- The canvas container div is `relative` and sized to 640x480
- Overlays use `absolute inset-0` (constrained to parent), NOT `fixed inset-0` (full browser)
- Backdrop darkening covers only the canvas area
- Modal content is centered within the 640x480 bounds

**Components that currently violate this (use `fixed inset-0`):**
- `BattleEncounterScreen` — dialogue panel (z-40)
- `ChoicePrompt` — gate decision modal (z-50)
- `ObservationHint` — observation gate hint (z-50)
- `EducationalItemModal` — item fact display (z-50)
- `GameBanner` — room/wave cleared celebration (z-150)
- BreachDefense start/gameover/victory screens (z-50)
- `TutorialModal` — intro + breach tutorials (z-50)
- `RecapModal` — wave recap (z-50)
- `CodexModal` — threat/tower reference (z-50)

**Components that are correct (already canvas-relative):**
- `RoomProgressHUD` — uses `absolute top-2 right-2`
- `WaveIntroBanner` — uses `absolute inset-x-0 top-0`

**Exception:** `PatientStoryReveal` and `EndScreen` are intentionally full-screen (they replace the game view, not overlay it). `NotificationToast` is intentionally fixed top-right as a system-level notification.

### Rule: Modals should not exceed the canvas dimensions.

- Max width: ~580px (canvas width minus padding)
- Max height: ~420px (canvas height minus padding), scrollable if needed
- Content should not touch the canvas edges — minimum 16px padding on all sides

### Rule: Backdrop covers the canvas, not the page.

- Dark overlay (bg-black/60 or similar) should cover only the 640x480 area
- Page background behind the canvas should remain unchanged

---

## 2. INPUT & CONTROL RULES

### Rule: Keyboard controls must work after every overlay closes.

After any modal, dialogue, or overlay is dismissed, the player must be able to immediately use WASD/arrow keys to move. No "click to regain focus" workaround.

**Test every overlay:**
- [ ] NPC dialogue (BattleEncounterScreen) → close → WASD works
- [ ] Educational item modal → "GOT IT!" → WASD works
- [ ] Observation hint → SPACE to acknowledge → WASD works
- [ ] Choice prompt → make choice → WASD works
- [ ] Intro/help modal → dismiss → WASD works
- [ ] BreachDefense tutorial → dismiss → click-to-place works
- [ ] BreachDefense recap modal → "Continue" → click-to-place works
- [ ] BreachDefense codex → close → click-to-place works

### Rule: Player position persists through dialogue.

When the player talks to an NPC or interacts with a zone/item, the player sprite must stay exactly where it was when they return from the overlay. The player should NOT teleport to spawn point.

**Test:**
- [ ] Walk to far corner of room, talk to NPC, complete dialogue → player is still in the corner
- [ ] Click-to-move to an item, collect it, close modal → player is still at the item
- [ ] Talk to multiple NPCs in sequence → player position preserved each time

### Rule: ESC always returns to room hub from exploration.

- Pressing ESC during exploration → exits room, returns to HallwayHub
- ESC should NOT work during dialogue overlays (dialogue has its own close flow)

### Rule: SPACE advances dialogue AND triggers interactions.

- Near an NPC: SPACE opens dialogue
- During dialogue: SPACE advances text / selects default option
- During modals: SPACE dismisses (where applicable)
- Not near anything: SPACE does nothing (no error, no sound)

---

## 3. SPRITE & VISUAL ATTACHMENT RULES

### Rule: Player label ("YOU") and shadow follow the player in every frame.

The "YOU" label above the player and the drop shadow below must track the player's position at all times — during keyboard movement, click-to-move pathfinding, and while idle.

**Test:**
- [ ] Walk with WASD in all 4 directions → label and shadow follow smoothly
- [ ] Click-to-move across the room → label and shadow follow each tile step
- [ ] Stand still → label and shadow remain centered on player
- [ ] Return from dialogue → label and shadow are at player position (not at spawn)

### Rule: NPC name labels stay anchored to their NPC.

Each NPC has a name label below their sprite. The label must remain at the NPC's feet position. Since NPCs don't move, this should be static — but verify after scene state changes.

**Test:**
- [ ] Enter room → every NPC has a visible name label below them
- [ ] Complete an NPC's dialogue → NPC fades to 40% opacity, label also fades
- [ ] The label position does not shift after completion

### Rule: Completed NPCs show visual distinction.

- Completed NPCs: 40% opacity + gray tint + green checkmark above
- Uncompleted NPCs: Full opacity, no tint, no checkmark
- Boss NPC (if uncompleted): Pulsing "BOSS" label above

### Rule: Educational items show collected state.

- Uncollected: Full opacity, floating y-bounce animation
- Collected: 40% opacity, no animation (tween killed)

---

## 4. AUDIO FEEDBACK RULES

### Rule: Every player-initiated action produces audio feedback.

If the player does something, they should hear something. Silent actions feel broken.

**Actions that MUST have audio:**
- [x] Player walks (footstep, throttled to 350ms) — IMPLEMENTED
- [x] Player interacts with NPC/zone/item (interact sound) — IMPLEMENTED
- [ ] Player opens any modal (subtle open/confirm sound)
- [ ] Player closes any modal (subtle close/dismiss sound)
- [ ] Player makes a dialogue choice (selection sound)
- [ ] Player gets answer correct/wrong (distinct feedback sounds)
- [ ] Player collects educational item (discovery/collect sound)
- [ ] Player clears a room (fanfare or celebration sound)
- [ ] Player exits room via ESC (door/exit sound)

**BreachDefense actions that MUST have audio:**
- [x] Tower placed (tower_place sound) — IMPLEMENTED
- [x] Enemy killed (enemy_death sound) — IMPLEMENTED
- [x] Enemy breaches (breach_alert sound) — IMPLEMENTED
- [x] Wave starts (wave_start sound) — IMPLEMENTED
- [ ] Tower fires projectile (subtle shot/zap sound)
- [ ] Projectile hits enemy (impact sound)
- [ ] Tower selected from panel (click/select sound)
- [ ] Wave cleared (celebration/chime sound)

### Rule: Background music fades smoothly on scene transitions.

- Music fades in over 800ms when entering a scene
- Music should fade out (not hard-stop) when leaving a scene
- Volume respects the MusicVolumeSlider setting
- No overlapping music tracks between scenes

### Rule: SFX mute toggle affects ALL sound effects.

- When muted, no SFX play anywhere (footsteps, interactions, tower placement, etc.)
- Music has its own independent volume control
- Mute state persists across page navigation (stored in localStorage)

---

## 5. VISUAL FEEDBACK SCALING RULES

### Rule: Feedback intensity matches moment importance.

| Moment | Expected Feedback |
|--------|-------------------|
| Button hover | Subtle color change or brightness shift |
| Button click | Brief press animation + click sound |
| Correct dialogue answer | Green flash + positive sound + score delta (+) |
| Wrong dialogue answer | Red flash + negative sound + score delta (-) |
| Item collected | Collect sound + notification toast + item fades |
| NPC dialogue complete | NPC grays out + checkmark appears |
| Room cleared | Banner animation + fanfare + transition to story reveal |
| Patient story unlocked | Full cinematic sequence (black screen + typewriter + icon) |
| Wave cleared (Breach) | Banner + recap modal with stats |
| Game won | Full celebration screen with stats and quote |

### Rule: Score changes are always visible.

- Privacy score delta shows as floating +/- text above the score area
- Green glow for positive, red glow for negative
- Floats upward and fades out in ~900ms
- Delta indicator must be visible even during/after dialogue transitions

---

## 6. LAYOUT & SIZING RULES

### Rule: All game UI uses "Press Start 2P" pixel font.

No system fonts, no serif fonts, no sans-serif defaults. Everything in the game canvas and overlays uses the pixel font. Sizes should be small to match the pixel art aesthetic:
- HUD labels: 6-8px
- Modal titles: 10-14px
- Modal body text: 8-10px
- Button text: 8-10px
- NPC name labels: 5px

### Rule: Retro UI styling is consistent.

- Borders: `border-4 border-black` (thick pixel borders)
- Shadows: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` (hard pixel shadow, no blur)
- Colors: Dark background (#1a1a2e), pink accent (#FF6B9D), green success (#2ECC71), blue info (#3498DB)
- No rounded corners larger than 4px (pixel art doesn't have smooth curves)
- No gradients (flat colors only, matching pixel art)

### Rule: Canvas area is the game boundary.

- The 640x480 canvas is the "TV screen" — all gameplay happens inside it
- Controls hint text below the canvas is the only exception
- Navigation buttons (back to hub, etc.) are below the canvas
- No game content should render outside or partially overlapping the canvas boundary

---

## 7. FLOW COMPLETION TESTS

### Test: Full PrivacyQuest room playthrough

For each of the 6 rooms (reception, er, lab, records_room, it_office, break_room):

1. [ ] Select room from HallwayHub → Phaser canvas loads, player at spawn
2. [ ] Walk to each NPC → proximity prompt appears ("[SPACE] Talk to...")
3. [ ] Talk to NPC → dialogue overlay opens (within canvas bounds)
4. [ ] Complete dialogue → overlay closes, player stays in position, keyboard works
5. [ ] Walk to each educational item → proximity prompt appears
6. [ ] Collect item → modal shows fact, notification toast appears
7. [ ] Close modal → keyboard works, item is now faded
8. [ ] Walk to each interaction zone → proximity prompt appears
9. [ ] Interact with zone → dialogue or gate overlay appears
10. [ ] Complete all requirements → RoomProgressHUD shows "ROOM CLEAR!"
11. [ ] Press ESC → "Room Cleared!" banner plays → patient story reveals (if first time)
12. [ ] Return to HallwayHub → room shows green checkmark, next room unlocked

### Test: Full BreachDefense playthrough

1. [ ] Click "Start Mission" → tutorial modal appears (within canvas bounds)
2. [ ] Dismiss tutorials → game starts, grid visible, tower panel below
3. [ ] Select tower from panel → click sound, tower highlighted
4. [ ] Hover over grid → green/red placement preview visible
5. [ ] Place tower → placement sound, tower appears, budget decreases with flash
6. [ ] Wave starts → wave intro banner (within canvas), enemies spawn
7. [ ] Towers fire at enemies → projectile visible, firing sound, recoil animation
8. [ ] Enemy dies → death particles, death sound, floating label
9. [ ] Wave cleared → cleared banner → recap modal (within canvas bounds)
10. [ ] Open Codex → reference entries visible, close returns to game
11. [ ] Survive all 10 waves → victory screen with stats

### Test: Hub World navigation

1. [ ] Load `/` → Hub World Phaser scene, player in lobby
2. [ ] Walk to left door → proximity prompt for Privacy Quest
3. [ ] Press SPACE → navigates to `/privacy` (HallwayHub)
4. [ ] Navigate back → load `/` → walk to right door
5. [ ] Press SPACE → navigates to `/breach` (start screen)

---

## 8. KNOWN ISSUES TO VERIFY FIXED

These were identified bugs — verify they don't regress:

- [ ] Player sprite does NOT teleport to spawn after completing dialogue
- [ ] WASD/arrow keys work immediately after closing any overlay (no click needed)
- [ ] Player shadow and "YOU" label follow the sprite at all times
- [ ] Completing an NPC grays them out without affecting other NPCs
- [ ] Collecting an item fades it without affecting other items
- [ ] ESC exits the room even after multiple NPC conversations
- [ ] Music doesn't overlap when transitioning between scenes
- [ ] Volume slider changes persist across room changes

---

## HOW TO USE THIS DOC WITH REPLIT

Give Replit this instruction:

> You are a QA tester for a HIPAA training game. Load the app in the browser preview. Walk through every test in the "Flow Completion Tests" section. For each checkbox, verify it passes. If anything fails or looks wrong, check the specific rule it violates in sections 1-6 and fix the code to match the standard. Do not add new features — only fix violations of the rules in this document.

Focus on ONE flow at a time (one room, or one BreachDefense session). Report what you found and fixed before moving to the next flow.
