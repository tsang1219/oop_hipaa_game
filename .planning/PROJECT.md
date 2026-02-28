# PrivacyQuest + BreachDefense — Polish Milestone

## What This Is

Two HIPAA educational games — PrivacyQuest (privacy RPG exploration) and BreachDefense (security tower defense) — built with Phaser 3 + React, connected through a hospital lobby hub world. The games are functionally complete but lack audio, sprite quality, visual feedback, HUD completeness, and onboarding. This milestone focuses on the highest-impact polish items to bring both games to MVP quality.

## Core Value

Both games must feel like real games — not prototypes. Sound, visual feedback, and player guidance are the gaps between "it works" and "it's fun to play."

## Requirements

### Validated

- ✓ Hub world with hospital lobby navigation between games — existing
- ✓ PrivacyQuest room exploration with 6 rooms, NPC dialogue, branching choices, privacy scoring — existing
- ✓ BreachDefense tower defense with 6 towers, 8 threats, 10 waves, grid placement, targeting — existing
- ✓ EventBridge for bidirectional React<->Phaser communication — existing
- ✓ PrivacyQuest progress persistence via localStorage — existing
- ✓ BreachDefense 12-modal tutorial chain with HIPAA educational content — existing
- ✓ Room selection UI (HallwayHub) with unlock/completion state — existing
- ✓ Dialogue system with RPG-style battle encounters, typewriter text, choice scoring — existing
- ✓ Codex encyclopedia for threats and defenses — existing
- ✓ Post-wave recap modals with HIPAA takeaways — existing

### Active

- [ ] Sound effects for core game actions across both games (~8-12 SFX)
- [ ] PrivacyQuest player and NPC sprites replacing fillRect rectangles
- [ ] Walk cycle animation for PrivacyQuest player (4-direction, 2-3 frames each)
- [ ] BreachDefense tower firing visual feedback (tweens + particles)
- [ ] BreachDefense enemy death effects (fade-out + particle burst)
- [ ] BreachDefense projectile visual improvements
- [ ] BreachDefense HUD: display wave intro text on wave start
- [ ] BreachDefense HUD: show suggestedTowers hint per wave
- [ ] BreachDefense HUD: show tower description on hover in selection panel
- [ ] BreachDefense HUD: show endMessage on wave completion
- [ ] PrivacyQuest intro modal on first visit explaining premise and goals
- [ ] PrivacyQuest contextual hints during play (controls, first NPC highlight, interaction prompts)

### Out of Scope

- Tower sell/upgrade system — changes game balance significantly, post-MVP
- Game speed control (fast-forward) — nice-to-have, not core
- BreachDefense save state — session-based play is fine for MVP
- Mobile/responsive layout — desktop-first, significant effort
- Code-splitting/deployment — infrastructure, not game quality
- Background music/ambient loops — SFX first, music later
- Victory/completion screen improvements — current screens work
- Player movement feel (acceleration/deceleration) — current movement is functional
- Scene transitions — instant cuts are fine for MVP
- UI/HUD visual polish beyond data surfacing — styling is adequate

## Context

- Both games are functionally complete — all gameplay loops work, all educational content is authored
- BreachDefense already has PNG sprites for towers and threats; PrivacyQuest uses programmatic fillRect textures
- All BreachDefense HUD data (wave intro, suggestedTowers, tower desc, endMessage) already exists in `constants.ts` — just needs surfacing in the React overlay
- Phaser has built-in `this.sound.play()` with WebAudioSoundManager that handles browser autoplay policy
- Phaser has built-in tween system and particle emitters for VFX
- No `anims.create()` calls exist anywhere — walk cycles are a net-new addition
- Free SFX available from Kenney.nl, freesound.org, OpenGameArt
- Sprites can be either upgraded programmatic art or asset-based PNGs — whichever is fastest

## Constraints

- **Tech stack**: Phaser 3.90+ / React 18 / TypeScript / Vite 5 — no new frameworks
- **Art style**: Pixel art aesthetic consistent with existing "Press Start 2P" font and 32px/64px tile grids
- **Audio format**: MP3/OGG for browser compatibility, small file sizes
- **Sound scope**: Core actions only (~8-12 SFX), no background music this milestone
- **Onboarding style**: Brief intro modal + contextual in-world hints (not a heavy tutorial chain)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sound: core actions only, no music | Biggest impact per effort; music adds complexity (looping, transitions, licensing) | — Pending |
| Sprites: whatever gets real sprites fastest (programmatic or asset-based) | User doesn't have strong preference; speed matters | — Pending |
| VFX: tweens + particles (not just tweens) | Particles add meaningful visual feedback for combat events | — Pending |
| Onboarding: modal + contextual hints | BreachDefense's modal-only approach is too heavy; hybrid is better | — Pending |

---
*Last updated: 2026-02-27 after initialization*
