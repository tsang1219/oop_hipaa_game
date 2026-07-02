> **⚠️ RECONCILIATION NOTICE (2026-07-01, Fable Run 02): STALE — frozen at v2.2 kickoff (2026-05-07), predates the identity pivot.** Phases 11–27 all shipped 2026-06-10; the game is a single route `/`. Do not act on status claims here — see `.planning/STATE_OF_TRUTH.md` ("Docs that lie" table) for what is actually true.

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

## Current Milestone: v2.2 Sponsor Demo

**Goal:** Ship a curated sponsor-pitch demo of PrivacyQuest in 1-2 days. Demo is sent to Out-of-Pocket (Nikhil) next week to gauge sponsor interest at ~$10K target. Informal 50/50 revenue split agreed. Pauses v2.1 (Phase 16 PHI Sorter at 98%, Phase 17 Breach Triage not started). Reuses existing rooms/NPCs/dialogue — no new content authored.

**Target features:**

- **Demo mode entrypoint** — start menu adds 3 buttons: "Demo" / "Tower Defense" / "Full Game". Full game route untouched.
- **Curated 4-room demo path** — Reception → Emergency Room → Break Room → Medical Records. ER-second front-loads tension; Break Room provides comedic screenshot moments; Medical Records closes on procedural depth + Subpoena/CCO scenario. All 4 unlocked from demo start, gated off from full game's progression.
- **Tower Defense standalone launch** — TD button launches BreachDefenseScene directly, no narrative wrapper, returns to start menu on win/lose.
- **First-impression polish in 4 demo rooms** — fix V1 (flat sprite on load), V4 (HUD overlay on entry), V7 (loud honk near NPCs).
- **Completion sequence + sponsor hook** — after Medical Records exit: dim → beat → fanfare → certificate animation → sponsor code reveal + copy button. End NPC hands the prize using configured sponsor sprite/lines. Sponsor data lives in one pluggable config file (`name`, `character_sprite`, `two_dialogue_lines`, `code`) — swap sponsors without re-coding.

**Why this milestone now (2026-05-07):** Sponsor outreach is time-sensitive (summer makes outreach harder). User has baby due 2026-06-01 — no sprawl. v2.1 Phase 16 progress preserved as artifact at `.planning/phases/16-phi-sorter-encounter/`; resume after sponsor outreach lands (or doesn't).

### Paused Milestone: v2.1 Full Vision

PHI Sorter (Phase 16) at 98% — Plans 01-03 executed, Plan 04 (Phaser triggers + UnifiedGamePage routing) remaining. Phase 17 Breach Triage not started. Resume after v2.2 ships and sponsor interest is gauged.

### Previous Milestone: v2.0 One Game (Shipped 2026-03-28)

Restructured PrivacyQuest + BreachDefense from two separate games into one cohesive RPG with continuous hospital navigation, integrated inbound tower defense encounters, three-act narrative arc, and unified compliance score. 19 plans across Phases 11-15.

### Out of Scope (v2.2)

- Hallway redesign / overworld map — pinned 2026-05-06; not the lever for this demo
- Character select screen + image-to-8bit pipeline — pinned 2026-05-06; defer to v2.3
- Breach decision scenario — not built; out of demo scope
- Phase 17 Breach Triage — deferred to post-sponsor-outreach (v2.1 resumption)
- Phase 16 PHI Sorter Plan 04 — paused mid-flight; resume with v2.1
- Room-7 navigation bug — out of demo path; deprioritized
- Internal escalation / "levels per room" — rejected; use existing scenarios as-is
- New scenarios, new NPCs, new mechanics, new dialogue — pure curation milestone
- V2/V3/V5/V6 visual bugs (chat icon, NPC positioning, hallway centering, notice boards) — out of 1-2 day budget
- Out-of-Pocket cameo NPC, new easter eggs — defer to v2.3 if sponsor bites
- Outbound Tower Defense encounter — deprioritized; revisit post-v2.1
- Remaining sprite overhaul (portraits, furniture, tiles) — folded into v2.x
- End-of-game report screen — future
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

*Last updated: 2026-05-07 after v2.2 milestone start*
