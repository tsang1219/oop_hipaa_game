# Roadmap: PrivacyQuest + BreachDefense Polish Milestone

## Overview

Both games are functionally complete. This milestone closes the gap between "it works" and "it feels like a real game" across five distinct system areas: sound, walk animation, visual effects, HUD data surfacing, and first-play onboarding. Phases follow build-order dependencies: audio assets must be in BootScene before any playback code exists; animation frames must exist before walk cycles register; particle texture must exist before VFX fires; HUD is pure React with no Phaser deps; onboarding is last because EventBridge event constants should be stable before adding more.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Audio Foundation** - Preload 6-7 SFX in BootScene and wire playback at each trigger point across both games
- [ ] **Phase 2: Walk Cycle Animation** - Add 4-direction player walk animation in PrivacyQuest (spritesheet or programmatic)
- [ ] **Phase 3: BreachDefense Visual Effects** - Enemy death particle burst, tower firing recoil tween, and strong-match color pulse
- [ ] **Phase 4: BreachDefense HUD Data** - Surface wave intro, suggested towers, tower hover descriptions, and end messages from constants.ts
- [ ] **Phase 5: PrivacyQuest Onboarding** - First-visit intro modal and first-NPC pulsing highlight

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
**Plans**: TBD

### Phase 2: Walk Cycle Animation
**Goal**: The PrivacyQuest player character animates while moving — no more gliding rectangle
**Depends on**: Phase 1
**Requirements**: ANIM-01
**Success Criteria** (what must be TRUE):
  1. Player character shows a walk cycle animation (2-3 frames) while moving in any of the 4 directions
  2. Player character shows an idle pose when not moving
  3. Walk animation direction matches the direction of movement (up, down, left, right each have distinct frames)
**Plans**: TBD

### Phase 3: BreachDefense Visual Effects
**Goal**: Kills feel confirmed and towers feel active — combat has visual weight
**Depends on**: Phase 1
**Requirements**: VFX-01, VFX-02, VFX-03
**Success Criteria** (what must be TRUE):
  1. Enemies burst into a particle explosion and fade out at their death position — they do not simply disappear
  2. Towers visibly recoil (scale tween) each time they fire a projectile
  3. Towers show a distinct color pulse when firing at an enemy type they counter (strong-match relationship visible to player)
**Plans**: TBD

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
**Plans**: TBD

### Phase 5: PrivacyQuest Onboarding
**Goal**: First-time players know how to move and interact without getting stuck on room entry
**Depends on**: Phase 4
**Requirements**: ONBD-01, ONBD-02
**Success Criteria** (what must be TRUE):
  1. A first-visit intro modal appears on the player's first entry into PrivacyQuest, explaining movement (WASD) and interaction (Space/ESC) controls, and does not appear on subsequent visits
  2. The first available NPC in a room has a pulsing visual indicator that draws the player's attention, which dismisses once the player moves toward it
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5
(Phases 2 and 3 can execute in parallel — they touch different scenes)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Audio Foundation | 0/? | Not started | - |
| 2. Walk Cycle Animation | 0/? | Not started | - |
| 3. BreachDefense Visual Effects | 0/? | Not started | - |
| 4. BreachDefense HUD Data | 0/? | Not started | - |
| 5. PrivacyQuest Onboarding | 0/? | Not started | - |
