# PrivacyQuest + BreachDefense

## What This Is

Two HIPAA educational games — PrivacyQuest (privacy RPG exploration) and BreachDefense (security tower defense) — built with Phaser 3 + React, connected through a hospital lobby hub world. Both games are functionally complete with sound, animation, visual effects, HUD data, and onboarding polish shipped in v1.0.

## Core Value

Both games must feel like real games — not prototypes. Sound, visual feedback, and player guidance are the gaps between "it works" and "it's fun to play."

## Requirements

### Validated

- v1.0 Hub world with hospital lobby navigation between games
- v1.0 PrivacyQuest room exploration with 6 rooms, NPC dialogue, branching choices, privacy scoring
- v1.0 BreachDefense tower defense with 6 towers, 8 threats, 10 waves, grid placement, targeting
- v1.0 EventBridge for bidirectional React<->Phaser communication
- v1.0 PrivacyQuest progress persistence via localStorage
- v1.0 BreachDefense 12-modal tutorial chain with HIPAA educational content
- v1.0 Room selection UI (HallwayHub) with unlock/completion state
- v1.0 Dialogue system with RPG-style battle encounters, typewriter text, choice scoring
- v1.0 Codex encyclopedia for threats and defenses
- v1.0 Post-wave recap modals with HIPAA takeaways
- v1.0 Sound effects for core game actions (6 SFX + mute toggle)
- v1.0 Walk cycle animation for PrivacyQuest player (4-direction, 2-frame programmatic)
- v1.0 BreachDefense enemy death particle burst + tower recoil + strong-match pulse
- v1.0 BreachDefense HUD: wave intro banner, suggested towers, tower descriptions, threat previews, wave end messages
- v1.0 PrivacyQuest onboarding: intro modal + NPC pulse highlight

### Active

(Next milestone requirements — to be defined via `/gsd:new-milestone`)

### Out of Scope

- Tower sell/upgrade system — changes game balance significantly
- Game speed control (fast-forward) — undermines educational content timing
- BreachDefense save state — session-based play is intentional (15-20 min)
- Mobile/responsive layout — desktop-first
- Background music/ambient loops — SFX-only delivers 80% of game feel
- Real-time multiplayer / leaderboards — requires backend, not relevant to individual HIPAA training

## Context

Shipped v1.0 Polish milestone with ~12,400 LOC across 68 files.
Tech stack: Phaser 3.90+ / React 18 / TypeScript / Vite 5 / Tailwind 3.
Art: Programmatic pixel sprites (32px/64px), BreachDefense has PNG sprites for towers/threats.
Audio: 6 Kenney CC0 OGG files loaded in BootScene, played via `this.sound.play()`.
Hosting: Desktop browser (Chrome/Firefox), no Safari support yet (OGG-only audio).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sound: core actions only, no music | Biggest impact per effort | v1.0 Good |
| Sprites: programmatic legs-only walk frames | Fastest to ship at 32px scale | v1.0 Good |
| VFX: tweens + single white particle tinted per threat | Minimal assets, maximum variety | v1.0 Good |
| Onboarding: TutorialModal reuse + NPC pulse | Consistent with BreachDefense pattern | v1.0 Good |
| Global anim registration in BootScene | Walk anims available in all scenes without re-registration | v1.0 Good |
| Direct this.sound.play() (not EventBridge) | No listener leak risk for in-scene triggers | v1.0 Good |
| activateWave() helper | Encapsulates active flag + sound, prevents double-fire | v1.0 Good |

## Constraints

- **Tech stack**: Phaser 3.90+ / React 18 / TypeScript / Vite 5 — no new frameworks
- **Art style**: Pixel art aesthetic consistent with "Press Start 2P" font and 32px/64px grids
- **Audio format**: OGG for desktop Chrome/Firefox; MP3 fallback needed for Safari support
- **Phaser API**: Use `this.add.particles(x, y, key, config)` — never `createEmitter()`
- **EventBridge**: Every `on()` needs matching `off()` in `shutdown()`

---
*Last updated: 2026-03-01 after v1.0 milestone*
