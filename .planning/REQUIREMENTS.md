# Requirements: PrivacyQuest + BreachDefense Polish

**Defined:** 2026-02-28
**Core Value:** Both games must feel like real games — not prototypes. Sound, visual feedback, and player guidance close the gap between "it works" and "it's fun to play."

## v1 Requirements

Requirements for this polish milestone. Each maps to roadmap phases.

### Sound

- [x] **SFX-01**: Player hears footstep sound when moving in PrivacyQuest
- [x] **SFX-02**: Player hears confirm/interact sound when talking to NPCs or collecting items
- [x] **SFX-03**: Player hears placement sound when placing a tower in BreachDefense
- [x] **SFX-04**: Player hears death sound when an enemy is destroyed in BreachDefense
- [x] **SFX-05**: Player hears breach alert when an enemy reaches the end in BreachDefense
- [x] **SFX-06**: Player hears wave start cue when a new wave begins in BreachDefense
- [x] **SFX-07**: Floating threat type label appears on enemy death ("PHISHING blocked!")

### Sprites & Animation

- [x] **ANIM-01**: Player character has 4-direction walk cycle animation (2-3 frames per direction) in PrivacyQuest

### Visual Effects

- [x] **VFX-01**: Enemies fade out with particle burst on death in BreachDefense
- [x] **VFX-02**: Towers show scale tween recoil when firing in BreachDefense
- [x] **VFX-03**: Towers show distinct color pulse when firing at an enemy they're strong against

### HUD

- [x] **HUD-01**: Wave intro text overlay displays wave name on wave start
- [x] **HUD-02**: Suggested tower hint shown per wave during prep phase
- [x] **HUD-03**: Tower description shown on hover in selection panel
- [x] **HUD-04**: Wave end message displayed on wave completion
- [x] **HUD-05**: Incoming threat type icons shown before wave starts

### Onboarding

- [x] **ONBD-01**: First-visit intro modal explains controls (WASD/Space/ESC) in PrivacyQuest
- [x] **ONBD-02**: Pulsing indicator highlights first available NPC on room entry

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Sound

- **SFX-V2-01**: Background music / ambient loops per game mode
- **SFX-V2-02**: Correct vs incorrect choice feedback tones in PrivacyQuest dialogue
- **SFX-V2-03**: UI sounds (button click, menu open/close)

### Sprites & Animation

- **ANIM-V2-01**: NPC idle distinction by role (visual markers per role — white coat, gown, etc.)
- **ANIM-V2-02**: NPC idle animations (breathing, blinking)

### Visual Effects

- **VFX-V2-01**: Item pickup feedback (scale tween on PrivacyQuest item collection)
- **VFX-V2-02**: Interaction range indicator glow on nearby interactables
- **VFX-V2-03**: Scene transitions (camera fadeOut/fadeIn between scenes)
- **VFX-V2-04**: Tower placement pop-in tween (0 → 1.1 → 1.0)

### HUD

- **HUD-V2-01**: Room completion animation ("Room Cleared" banner in PrivacyQuest)
- **HUD-V2-02**: Privacy score visibility during exploration (score already tracked, just not visible in room)
- **HUD-V2-03**: Enemy count remaining indicator

### Onboarding

- **ONBD-V2-01**: PrivacyQuest premise intro ("You're a new Privacy Guardian at Memorial Hospital...")
- **ONBD-V2-02**: Privacy meter explanation on first encounter

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Background music / ambient loops | SFX-only delivers 80% of game feel at 10% cost; music adds licensing, mixing, looping complexity |
| Tower sell/upgrade system | Changes game balance significantly; requires rebalancing all 10 waves |
| Game speed control (fast-forward) | Undermines HIPAA educational content timing; session is short (~15 min) |
| Mobile / responsive layout | Desktop-first; touch controls require separate implementations |
| BreachDefense save state | Session-based play is intentional; game is 15-20 minutes |
| Player movement feel (acceleration) | Current movement is functional; polish, not fix |
| Full particle system overhaul | Over-particled games read as noisy; targeted effects only |
| Typeface replacement | Cascading changes across all scenes and components |
| Real-time multiplayer / leaderboards | Requires backend infrastructure; not relevant to individual HIPAA training |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SFX-01 | Phase 1 | Complete |
| SFX-02 | Phase 1 | Complete |
| SFX-03 | Phase 1 | Complete |
| SFX-04 | Phase 1 | Complete |
| SFX-05 | Phase 1 | Complete |
| SFX-06 | Phase 1 | Complete |
| SFX-07 | Phase 1 | Complete |
| ANIM-01 | Phase 2 | Complete |
| VFX-01 | Phase 3 | Complete |
| VFX-02 | Phase 3 | Complete |
| VFX-03 | Phase 3 | Complete |
| HUD-01 | Phase 4 | Complete |
| HUD-02 | Phase 4 | Complete |
| HUD-03 | Phase 4 | Complete |
| HUD-04 | Phase 4 | Complete |
| HUD-05 | Phase 4 | Complete |
| ONBD-01 | Phase 5 | Complete |
| ONBD-02 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-03-01 after 05-01 execution — ONBD-01 and ONBD-02 complete*
