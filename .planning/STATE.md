# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Both games must feel like real games — not prototypes. Sound, visual feedback, and player guidance close the gap between "it works" and "it's fun to play."
**Current focus:** Phase 1 — Audio Foundation

## Current Position

Phase: 1 of 5 (Audio Foundation)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-02-28 — Roadmap created; requirements mapped to 5 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: Sound scope = core actions only (~8-12 SFX), no background music this milestone
- Pre-roadmap: Sprites approach = fastest to real sprites (programmatic or asset-based PNG, not decided yet)
- Pre-roadmap: VFX = tweens + particles (not just tweens)
- Pre-roadmap: Onboarding = modal + contextual hints (not heavy tutorial chain)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2 (walk cycle): Spritesheet-vs-programmatic decision must be made before writing any anims.create() code. If using OpenGameArt PNG, verify directional frame coverage on download — some assets have incomplete coverage. Fallback: programmatic 3-frame generation in SpriteFactory.
- Phase 1: SFX file selection within Kenney packs requires listening (~30 min curation before BootScene implementation).
- All phases: Phaser particle API broke in 3.60 — use `this.add.particles(x, y, key, config)` syntax, never `createEmitter()`.
- All phases: EventBridge listener leak — every new `eventBridge.on()` call needs matching `off()` in shutdown().

## Session Continuity

Last session: 2026-02-28
Stopped at: Roadmap created, STATE.md initialized. No plans created yet.
Resume file: None
