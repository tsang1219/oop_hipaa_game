# Milestones

## v1.1 Sprite Overhaul (Archived: 2026-03-26 — Partial)

**Phases completed:** 1 of 5 (Phase 6 only)
**Timeline:** 2026-03-01 to 2026-03-02 (paused)
**Status:** Partially complete. Character sprites (Phase 6) shipped. Remaining work (portraits, furniture, tiles, integration) folded into v2.x milestones.

**Key accomplishments:**
- Generated 10 character PNG spritesheets (player + 9 NPC types) via Python/PIL at 32x32 frame size
- Integrated spritesheets into BootScene, ExplorationScene, and HubWorldScene with walk animations and idle breathing
- Established spritesheet format: 96x128px, 3 cols x 4 rows, direction order down/left/right/up

**Deferred to v2.x:**
- Phase 7: NPC dialogue portraits
- Phase 8: Furniture and interactive object sprites
- Phase 9: Hospital floor tiles
- Phase 10: SpriteFactory retirement and integration cleanup

**Archive:** `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`

---

## v1.0 Polish (Shipped: 2026-03-01)

**Phases completed:** 5 phases, 9 plans
**Timeline:** 2026-02-27 to 2026-03-01 (3 days)
**Files changed:** 68 | **Lines:** +12,401 / -82

**Key accomplishments:**
- Added 6 SFX across both games (footstep, interact, tower place, enemy death, breach alert, wave start) with mute toggle
- Built 4-direction walk cycle animation for PrivacyQuest player character (programmatic leg-only frames)
- Added enemy death particle burst, tower firing recoil tween, and strong-match color pulse to BreachDefense
- Surfaced wave intro banners, suggested tower hints, tower descriptions, threat previews, and wave end messages in BreachDefense HUD
- Added first-visit intro modal and NPC pulse highlight for PrivacyQuest onboarding

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

---

