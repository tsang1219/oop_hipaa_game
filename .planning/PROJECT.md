# PrivacyQuest + BreachDefense

## What This Is

A unified HIPAA educational RPG where the player walks through a continuous hospital as a new employee, meeting staff, discovering scenarios, and making compliance decisions. Encounter mechanics (tower defense, PHI sorting) are triggered from the RPG world and reinforce learning. Built with Phaser 3 + React 18 + TypeScript.

## Core Value

The player should forget they're doing compliance training. One continuous game that feels like a polished SNES-era RPG — not two separate modules with game skins.

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

## Current Milestone: v2.0 One Game

**Goal:** Restructure PrivacyQuest + BreachDefense from two separate games into one cohesive RPG with continuous hospital navigation, integrated tower defense encounters, and a three-act narrative arc.

**Target features:**

- Continuous hospital navigation — player walks between departments through doors (no room picker, no hub menu)
- Door-to-door transitions with visual cues (locked/available/completed) and hallway connectors
- Linear department unlock progression (Reception → Break Room → Lab → Records → IT → ER)
- Inbound TD encounter integrated into RPG world — condensed 4-wave format, triggered from narrative events
- Encounter trigger/return system — RPG event launches encounter, results feed back to world state
- Three-act narrative arc with act progression, per-act music shifts, and transition dialogue
- Unified compliance score across all encounter types
- Bug stabilization pass on surviving systems before restructure

### Out of Scope

- New encounter types (PHI sorting, outbound TD, breach triage) — v2.1 "Full Vision"
- Remaining sprite overhaul (portraits, furniture, tiles) — folded into v2.1
- End-of-game report screen — v2.1
- Admin console / certificate generation / analytics — future roadmap
- Mobile/responsive layout — desktop-first
- Real-time multiplayer / leaderboards — requires backend
- Tower sell/upgrade system — changes game balance significantly

## Context

Shipped v1.0 Polish milestone (~12,400 LOC, 68 files). v1.1 Sprite Overhaul partially complete (character sprites shipped, rest deferred).
Tech stack: Phaser 3.90+ / React 18 / TypeScript / Vite 5 / Tailwind 3.
Art: Character spritesheets (32x32 frames) for player + 9 NPCs. BreachDefense has PNG sprites for towers/threats. Some programmatic sprites remain (furniture, tiles).
Audio: 6 Kenney CC0 OGG files loaded in BootScene, played via `this.sound.play()`.
Hosting: Desktop browser (Chrome/Firefox), no Safari support yet (OGG-only audio).
Enhancement brief: `.planning/ENHANCEMENT_BRIEF.md` — full design reference for the unified RPG restructure.

## Key Decisions

| Decision                                              | Rationale                                                  | Outcome   |
| ----------------------------------------------------- | ---------------------------------------------------------- | --------- |
| Sound: core actions only, no music                    | Biggest impact per effort                                  | v1.0 Good |
| Sprites: programmatic legs-only walk frames           | Fastest to ship at 32px scale                              | v1.0 Good |
| VFX: tweens + single white particle tinted per threat | Minimal assets, maximum variety                            | v1.0 Good |
| Onboarding: TutorialModal reuse + NPC pulse           | Consistent with BreachDefense pattern                      | v1.0 Good |
| Global anim registration in BootScene                 | Walk anims available in all scenes without re-registration | v1.0 Good |
| Direct this.sound.play() (not EventBridge)            | No listener leak risk for in-scene triggers                | v1.0 Good |
| activateWave() helper                                 | Encapsulates active flag + sound, prevents double-fire     | v1.0 Good |

## Constraints

- **Tech stack**: Phaser 3.90+ / React 18 / TypeScript / Vite 5 — no new frameworks
- **Art style**: Pixel art aesthetic consistent with "Press Start 2P" font and 32px/64px grids
- **Audio format**: OGG for desktop Chrome/Firefox; MP3 fallback needed for Safari support
- **Phaser API**: Use `this.add.particles(x, y, key, config)` — never `createEmitter()`
- **EventBridge**: Every `on()` needs matching `off()` in `shutdown()`

---

*Last updated: 2026-03-26 after v2.0 milestone start*
