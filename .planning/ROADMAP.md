# Roadmap: PrivacyQuest + BreachDefense Polish Milestone

## Overview

Both games are functionally complete. This milestone closes the gap between "it works" and "it feels like a real game" across five distinct system areas: sound, walk animation, visual effects, HUD data surfacing, and first-play onboarding. Phases follow build-order dependencies: audio assets must be in BootScene before any playback code exists; animation frames must exist before walk cycles register; particle texture must exist before VFX fires; HUD is pure React with no Phaser deps; onboarding is last because EventBridge event constants should be stable before adding more.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Audio Foundation** - Preload 6-7 SFX in BootScene and wire playback at each trigger point across both games
- [x] **Phase 2: Walk Cycle Animation** - Add 4-direction player walk animation in PrivacyQuest (spritesheet or programmatic) (completed 2026-03-01)
- [x] **Phase 3: BreachDefense Visual Effects** - Enemy death particle burst, tower firing recoil tween, and strong-match color pulse (completed 2026-03-01)
- [x] **Phase 4: BreachDefense HUD Data** - Surface wave intro, suggested towers, tower hover descriptions, and end messages from constants.ts (completed 2026-03-01)
- [x] **Phase 5: PrivacyQuest Onboarding** - First-visit intro modal and first-NPC pulsing highlight (completed 2026-03-01)

## Phase Details

### Phase 1: Audio Foundation
**Goal**: Both games have sound — players hear confirmation that their actions land
**Depends on**: Nothing (first phase)
**Requirements**: SFX-01, SFX-02, SFX-03, SFX-04, SFX-05, SFX-06, SFX-07
**Success Criteria** (what must be TRUE):
  1. Player hears a footstep sound while moving in PrivacyQuest
  2. Player hears a confirm/interact sound when talking to an NPC or collecting an item in PrivacyQuest
  3. Player hears a placement sound when dropping a tower in BreachDefense
  4. Player hears a death sound and sees a floating threat-type label ("PHISHING blocked!") when an enemy is destroyed in BreachDefense
  5. Player hears a breach alert when an enemy reaches the end, and a wave-start cue when a new wave begins
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Human checkpoint: curate/place 6 Kenney CC0 OGG files + register in BootScene.preload()
- [ ] 01-02-PLAN.md — ExplorationScene SFX: footstep (WASD throttle + BFS step) + interact/confirm
- [ ] 01-03-PLAN.md — BreachDefenseScene SFX: tower placement, enemy death + floating kill label, breach alert, wave-start activateWave()
- [ ] 01-04-PLAN.md — Mute toggle: React HUD button in both pages with localStorage persistence

### Phase 2: Walk Cycle Animation
**Goal**: The PrivacyQuest player character animates while moving — no more gliding rectangle
**Depends on**: Phase 1
**Requirements**: ANIM-01
**Success Criteria** (what must be TRUE):
  1. Player character shows a walk cycle animation (2-3 frames) while moving in any of the 4 directions
  2. Player character shows an idle pose when not moving
  3. Walk animation direction matches the direction of movement (up, down, left, right each have distinct frames)
**Plans**: 1 plan

Plans:
- [ ] 02-01-PLAN.md — Generate frame-2 walk textures in BootScene, register animations, wire play/stop in HubWorldScene + ExplorationScene

### Phase 3: BreachDefense Visual Effects
**Goal**: Kills feel confirmed and towers feel active — combat has visual weight
**Depends on**: Phase 1
**Requirements**: VFX-01, VFX-02, VFX-03
**Success Criteria** (what must be TRUE):
  1. Enemies burst into a particle explosion and fade out at their death position — they do not simply disappear
  2. Towers visibly recoil (scale tween) each time they fire a projectile
  3. Towers show a distinct color pulse when firing at an enemy type they counter (strong-match relationship visible to player)
**Plans**: 1 plan

Plans:
- [ ] 03-01-PLAN.md — Particle texture + threat colors, death burst + fade, tower recoil tween, strong-match two-phase flash

### Phase 4: BreachDefense HUD Data
**Goal**: The educational data that already exists in constants.ts is visible to players during gameplay
**Depends on**: Phase 1
**Requirements**: HUD-01, HUD-02, HUD-03, HUD-04, HUD-05
**Success Criteria** (what must be TRUE):
  1. A wave intro banner displaying the wave name appears on wave start and auto-dismisses after a few seconds
  2. Suggested tower hints are visible in the HUD panel during the prep phase before wave enemies spawn
  3. Hovering or selecting a tower in the selection panel shows that tower's description text
  4. A wave end message is displayed when a wave completes
  5. Incoming threat type icons are shown before wave enemies begin spawning
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — EventBridge BREACH_WAVE_START event, enhanced BREACH_WAVE_COMPLETE with endMessage + stats, per-wave kill tracking, tutorialContent LAYERS/PASSWORDS recaps (completed 2026-03-01)
- [ ] 04-02-PLAN.md — React HUD components: wave intro banner, suggested tower hints, tower hover descriptions, wave end message display

### Phase 5: PrivacyQuest Onboarding
**Goal**: First-time players know how to move and interact without getting stuck on room entry
**Depends on**: Phase 4
**Requirements**: ONBD-01, ONBD-02
**Success Criteria** (what must be TRUE):
  1. A first-visit intro modal appears on the player's first entry into PrivacyQuest, explaining movement (WASD) and interaction (Space/ESC) controls, and does not appear on subsequent visits
  2. The first available NPC in a room has a pulsing visual indicator that draws the player's attention, which dismisses once the player moves toward it
**Plans**: 1 plan

Plans:
- [x] 05-01-PLAN.md — Intro modal (TutorialModal reuse + localStorage flag + help icon) + NPC pulse tween (per-room scale oscillation on first NPC, dismissed on interaction) (completed 2026-03-01)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5
(Phases 2 and 3 can execute in parallel — they touch different scenes)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audio Foundation | 0/? | Not started | - |
| 2. Walk Cycle Animation | 1/1 | Complete    | 2026-03-01 |
| 3. BreachDefense Visual Effects | 1/1 | Complete    | 2026-03-01 |
| 4. BreachDefense HUD Data | 2/2 | Complete    | 2026-03-01 |
| 5. PrivacyQuest Onboarding | 1/1 | Complete    | 2026-03-01 |
