# Feature Research

**Domain:** RPG exploration game + tower defense game polish (Phaser 3 + React, educational/HIPAA)
**Researched:** 2026-02-27
**Confidence:** HIGH (genre conventions well-established; Phaser API confirmed via official docs)

---

## Context

Both games are functionally complete. This research answers: what separates "it works" from "it feels like a real game"? Features are evaluated against two genres simultaneously — top-down RPG exploration (PrivacyQuest) and tower defense (BreachDefense) — and mapped to what already exists vs. what is missing.

Existing baseline (do not re-implement):
- PrivacyQuest: BFS pathfinding, proximity detection, NPC dialogue, room completion tracking, HallwayHub room picker
- BreachDefense: Grid placement, tower targeting, projectile physics, wave system, 12-modal tutorial chain, Codex, RecapModal
- Both: EventBridge, Press Start 2P font, pixel art aesthetic, programmatic/PNG sprites

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that players of these genres assume exist. Missing them = the game feels unfinished or amateur. No credit is given for having them; players only notice when they are absent.

#### Sound

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Footstep SFX (PrivacyQuest) | All top-down RPGs since SNES era have movement audio feedback. Silent movement feels broken. | LOW | Phaser `this.sound.play()` per tile step during path movement or WASD. Kenney RPG Audio pack has footstep variants (CC0). |
| Interaction / confirm SFX | Clicking on an NPC or picking up an item with no audio feels unresponsive. Players assume they mis-clicked. | LOW | Single "confirm" or "collect" tone. One sound covers all interactions. |
| Tower placement SFX (BreachDefense) | Every tower defense game plays a placement click when a tower is set. Absence makes placement feel unregistered. | LOW | Short mechanical/click SFX on `BREACH_TOWER_PLACED`. |
| Enemy reach-end / breach SFX | Players need audio warning when security score drops. Screen-only feedback is missed during active gameplay. | LOW | Alert/alarm tone on security score decrement. |
| Enemy death SFX | Tower defense genre expectation: killed enemies make a sound. Confirms the action succeeded. | LOW | Short pop/zap per enemy type, or single generic death sound. |
| Wave start cue (BreachDefense) | Players look away during prep; an audio cue signals incoming wave without requiring visual attention. | LOW | Short horn/alert sound on wave begin. |

**Confidence:** HIGH. Phaser `this.sound.play(key)` is confirmed working. Browser autoplay is handled automatically by Phaser after first user gesture (official docs confirmed). MP3 is the recommended format for broad compatibility. Kenney.nl and freesound.org provide CC0 assets covering all categories above.

#### Sprites and Animation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 4-directional player facing (PrivacyQuest) | Already implemented via `player_left/right/up/down` texture swap. Minimum viable. | DONE | Already exists — texture key swap on movement direction. |
| Walk cycle animation (PrivacyQuest) | All top-down RPGs animate the player while walking. Static texture on a moving body looks like a gliding rectangle. | MEDIUM | Requires spritesheet with 2-3 frames per direction (8-12 frames total). `this.anims.create()` + `sprite.play()`. No `anims.create()` calls exist yet — net-new addition. |
| NPC idle distinction by role (PrivacyQuest) | NPCs currently all use same silhouette with color swaps. Players cannot tell doctor from patient at a glance. | MEDIUM | Programmatic sprites already exist in SpriteFactory.ts. Enhance with role-specific visual markers (white coat shape for doctor, hospital gown for patient). Does NOT require external assets. |
| HP bars on enemies (BreachDefense) | Already implemented: green/yellow/red bar above each enemy. | DONE | Already exists. |
| Tower type visual distinctiveness (BreachDefense) | Already uses PNG sprites loaded in BootScene. | DONE | Already exists via `tower_${type}` textures. |

**Confidence:** HIGH. Phaser's animation system (`anims.create`, `sprite.play`) is documented and standard for this use case.

#### Visual Effects (VFX)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Enemy death visual (BreachDefense) | Currently enemies are `destroy()`-ed with no feedback. The enemy disappears instantly — players cannot tell if their tower killed it or it reached the end. | MEDIUM | Fade-out tween (alpha 1→0, duration 200ms) + small particle burst. Phaser `this.tweens.add` + `this.add.particles` (new emitter API in Phaser 3.60+). |
| Tower firing visual emphasis (BreachDefense) | Projectiles currently are 4px circles. Players cannot tell when a tower is active vs idle. | LOW | Tween tower sprite scale 1→1.1→1 (20ms) on fire event — "recoil" effect. No asset needed. |
| Item pickup feedback (PrivacyQuest) | Items currently just set alpha 0.4 and stop bobbing. No confirmation that collection happened. | LOW | Scale tween 1→1.3→0 on collection + brief flash tween. |
| Interaction range indicator (PrivacyQuest) | No visual cue that the player is close enough to interact — only text prompt appears. Players miss the prompt while moving. | LOW | Subtle highlight ring/glow tween on nearby interactable when player enters range. Currently only text is shown. |

**Confidence:** MEDIUM-HIGH. Tween patterns are confirmed Phaser 3 API. Particle emitter API changed in Phaser 3.60 (new unified emitter) — implementation must use current API not deprecated `ParticleEmitterManager`. Verify against Phaser 3.87+ docs.

#### HUD

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Wave intro text overlay (BreachDefense) | Genre convention since Kingdom Rush: a brief "Wave X incoming" banner at wave start. Players learn what to expect. | LOW | Data already in `WAVES[n].name`. React overlay text, tween in/out over 2 seconds. |
| Suggested tower hint per wave (BreachDefense) | Player needs strategic guidance that matches educational intent. Data exists in `WAVES[n].suggestedTowers` but is not surfaced. | LOW | Display in React HUD panel during wave prep. Single line, no modal needed. |
| Tower hover description (BreachDefense) | Every tower defense game shows tooltip on hover. Players cannot make informed tower choices without cost/range/damage visible at selection time. | LOW | Already has tower panel in BreachDefensePage. Add description text on hover in React selection panel (no Phaser work required). |
| Wave end message (BreachDefense) | `WAVES[n].endMessage` exists in constants but is never shown. Brief educational recap per wave completion. | LOW | Toast or banner in React overlay on `BREACH_WAVE_COMPLETE`. |
| Room name display (PrivacyQuest) | Already implemented: `roomNameText` at top of canvas. | DONE | Already exists. |
| Privacy score / progress display (PrivacyQuest) | Already implemented in React overlay via PrivacyMeter. | DONE | Already exists. |
| Budget / security score display (BreachDefense) | Already implemented in React HUD. | DONE | Already exists. |

**Confidence:** HIGH. All missing HUD data (`WAVES[n].suggestedTowers`, `WAVES[n].endMessage`, `WAVES[n].name`) confirmed present in `client/src/game/breach-defense/constants.ts`. Implementation is purely React overlay + EventBridge — no Phaser scene changes.

#### Onboarding

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Controls introduction for PrivacyQuest | Currently the only hint is small text below the canvas reading "WASD or Arrow Keys to move — SPACE to interact — ESC to exit room". Players do not read it and get stuck. | LOW | Brief intro modal on first room entry (one-time, localStorage-gated). Cover: move, interact, ESC. Dismiss on any key or button click. |
| First NPC highlight (PrivacyQuest) | Players who enter a room for the first time do not know which entity to approach. A subtle visual cue pointing to the first NPC prevents abandonment. | LOW | Animated arrow or pulsing ring on first available (non-completed) NPC, visible for ~5 seconds or until movement starts. |
| BreachDefense pre-game brief | Already has 12-modal tutorial chain on game start. | DONE | Existing — possibly too heavy, but functional. |
| Skip tutorial option | Players replaying should not be forced through tutorials again. | LOW | Already gated by `shownWaveSplashes` set in BreachDefense. PrivacyQuest intro modal should check localStorage flag. |

**Confidence:** HIGH. Pattern is standard across all educational games. Implementation is React modal + localStorage flag — well within existing codebase patterns.

---

### Differentiators (Competitive Advantage)

Features that set these games apart. Not expected by players of generic tower defense or RPG games, but create memorable moments aligned with the HIPAA educational mission.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| HIPAA-contextualized SFX labels | On enemy death, a flash of the threat type name (e.g. "PHISHING blocked!") reinforces the educational content at the moment of reward. | LOW | Floating damage text already conceptually present. Extend to include threat type label. |
| Tower "strong against" visual indicator | When a tower fires at an enemy it's effective against, show a distinct color pulse (matching the "strong against" tag). Teaches HIPAA security relationships through visual feedback. | MEDIUM | Requires checking `isStrong` flag in firing code and emitting distinct particle color. |
| Room completion animation (PrivacyQuest) | When all NPCs in a room are complete, a brief "Room Cleared" banner with score flash reinforces progress. Existing behavior is silent state change. | LOW | React overlay, triggered by existing room completion detection. |
| Wave threat preview (BreachDefense) | Show icons of incoming threat types before a wave starts (1-2 second preview). Players can make strategic tower decisions. | MEDIUM | Data in `WAVES[n].threats`. Small React overlay panel, timed to dismiss when wave begins. |
| Sound feedback differentiating correct vs. incorrect choices (PrivacyQuest) | Good/bad choice sounds during NPC dialogue reinforce HIPAA principles. Currently no audio distinguishes positive vs. negative outcomes. | LOW | Two tones: ascending for good choice, descending for bad. Triggered by EventBridge on dialogue score delta. |

**Confidence:** MEDIUM. Wave threat preview and strong-against visual indicator require Phaser scene changes in addition to React work. Other differentiators are React-only.

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem attractive but should be deliberately excluded from this milestone.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Background music / ambient loops | "All games have music" — often the first thing non-developers request. | Adds licensing risk, loop transition complexity, audio mixing with SFX, significantly larger audio bundle, and autoplay policy complexity on first load. Music composition quality also sets player expectations high. | SFX-only audio delivers 80% of game feel at 10% of the implementation cost. Music is explicitly out of scope per PROJECT.md. |
| Tower sell/upgrade mechanic | A natural tower defense feature request after playing a few waves. | Requires significant balance re-work, new UI affordances (right-click or sell button), refund economics, and testing across all 10 waves. Meaningfully changes the strategic game. | Defer to post-MVP. The game has 6 towers and 10 waves — the current set is balanced without sell/upgrade. |
| Game speed control (fast-forward) | Power users want to speed through waves they've mastered. | Changes how players experience educational content — fast-forward undermines the HIPAA recap timing. Also requires clamping all time-dependent systems (spawn intervals, projectile speeds, tween durations). | Not needed for MVP. Session is short (~15-20 min). |
| Mobile / touch controls | Touch is a large potential audience. | Canvas is fixed 640x480. Touch tower placement, tap-to-move, and on-screen WASD controls each require separate implementations. Out of scope per PROJECT.md. | Desktop-first is correct for HIPAA training contexts (typically accessed via workstation). |
| Persistent BreachDefense save state | Players may want to resume a game mid-wave. | Session state for tower defense involves serializing tower positions, enemy positions, HP values, projectile states, wave timers — significant complexity. On reload, Phaser must reconstruct all game objects from serialized data. | Session-based play is intentional. The game is 15-20 minutes. Explicitly out of scope per PROJECT.md. |
| Full particle system overhaul | "More particles = more polish" is a common trap. | Over-particled games read as noisy. Educational context requires players focus on the board, not spectacle. Frame rate impact on budget devices. | Targeted, minimal particles on specific high-value events (enemy death, item collect). Not a global system upgrade. |
| Typeface replacement | "Press Start 2P is too small / hard to read" — valid accessibility concern but large scope. | Requires audit of every text element across 4 scenes and all React components. Touch-screen font sizes, line wrapping, responsive containers — cascading changes. | Accept known limitation for this milestone. Add to accessibility backlog. |
| Real-time multiplayer / leaderboards | Common "make it social" request for educational games. | Requires backend, auth, data storage — the server is currently vestigial with zero API routes. Huge infrastructure scope jump. | Not relevant to the educational mission (individual HIPAA training). |

---

## Feature Dependencies

```
Walk cycle animation (PrivacyQuest)
    └──requires──> Spritesheet asset (4 directions × 2-3 frames)
                       └──requires──> Asset creation (programmatic or external PNG)

Tower hover description (BreachDefense)
    └──requires──> Tower selection panel already exists [DONE]

Wave intro text overlay
    └──requires──> BREACH_WAVE_COMPLETE / BREACH_STATE_UPDATE events [DONE]
    └──enhances──> Wave end message (same event, different timing)

Enemy death visual (BreachDefense)
    └──requires──> Phaser 3.60+ particle emitter API (verify version)
    └──enhances──> Enemy death SFX (same trigger point — compound effect)

Tower firing visual (BreachDefense)
    └──enhances──> Tower firing SFX (same trigger point — compound effect)

Item pickup feedback (PrivacyQuest)
    └──enhances──> Interaction / confirm SFX (same trigger point)

Sound effects (all)
    └──requires──> Audio asset files preloaded in BootScene
    └──requires──> First user gesture before browser allows audio (handled automatically by Phaser)

PrivacyQuest intro modal
    └──requires──> localStorage flag to gate one-time display
    └──conflicts──> Showing it on every room entry (must be first-visit-only)

First NPC highlight
    └──requires──> PrivacyQuest intro modal dismissed first (sequential)

HIPAA-contextualized SFX labels
    └──enhances──> Enemy death SFX (compound feedback on same event)
    └──enhances──> Enemy death visual (compound feedback on same event)

Sound feedback for dialogue choices (PrivacyQuest)
    └──requires──> EventBridge event carrying score delta or choice quality
    └──requires──> Audio assets (two distinct tones)
```

### Dependency Notes

- **Walk cycle requires spritesheet first:** Cannot implement `anims.create()` without frame data. Programmatic generation via `generateTexture()` in SpriteFactory is possible (draw 3 frames per direction using existing `drawCharacter` function with positional offset), avoiding need for external PNG. This is the fastest path.
- **Sound effects share a single prerequisite:** All SFX depend on audio files being preloaded in `BootScene.preload()`. Loading all audio at boot (in BootScene, before any game starts) satisfies all downstream sound features simultaneously.
- **Enemy death visual + SFX are one touch point:** Both fire at the same code location (`deadEnemies` cleanup loop in `BreachDefenseScene.ts` Phase 6). Implement both together to avoid touching that loop twice.
- **Tower firing visual + SFX are one touch point:** Both fire at `tower.lastFired = time` assignment in Phase 4. Implement together.
- **HUD data features are all React-only:** Wave intro, suggestedTowers hint, tower hover description, and endMessage all read from existing constants and display in React overlays. Zero Phaser scene changes needed. Can be implemented in a single pass through BreachDefensePage.tsx.

---

## MVP Definition

### Launch With (v1) — This Milestone

Minimum set to go from "prototype" to "feels like a real game":

- [ ] **Core SFX bundle** (footstep, interact, tower-place, enemy-death, breach-alert, wave-start) — audio feedback is the single highest-impact change per unit of effort. Players tolerate much more in terms of visual quality if audio is present.
- [ ] **Walk cycle animation** — the most visually jarring gap in PrivacyQuest. A static character gliding across the floor is the first thing any player notices.
- [ ] **Enemy death visual** (fade + particle) — without death feedback, BreachDefense reads as enemies teleporting out of existence. Kills must feel satisfying.
- [ ] **BreachDefense HUD data** (wave intro, suggestedTowers, tower description, endMessage) — all data is in constants already. This is display work only, and it surfaces HIPAA educational content that currently never reaches the player.
- [ ] **PrivacyQuest intro modal + first NPC highlight** — without any onboarding, new players do not know to use SPACE or that they should approach NPCs. First-room abandonment is a real risk.

### Add After Validation (v1.x)

Polish that extends experience quality once core is solid:

- [ ] **Tower firing visual** (recoil tween) — adds combat feel; lower priority than death feedback since projectiles already visually travel to target.
- [ ] **Item pickup feedback** — items already bob and fade; adding a collect burst is incremental.
- [ ] **NPC role visual distinctiveness** — improves PrivacyQuest readability; SpriteFactory changes are contained.
- [ ] **Sound feedback for dialogue choices** — differentiating correct/incorrect choices aligns with HIPAA mission but requires identifying the right EventBridge hook.
- [ ] **Interaction range indicator** — reduces player friction; current text-only prompt is functional.

### Future Consideration (v2+)

- [ ] **Wave threat preview panel** — good educational feature but adds complexity to BreachDefense UI layout.
- [ ] **HIPAA-contextualized kill text** — nice narrative touch; lower priority than core audio/visual.
- [ ] **Room completion animation** — current silent state change works; animation is polish-on-polish.
- [ ] **Background music** — explicitly deferred; scope and complexity exceed value for this milestone.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Core SFX bundle (6 sounds) | HIGH | LOW | P1 |
| Walk cycle animation | HIGH | MEDIUM | P1 |
| Enemy death visual | HIGH | MEDIUM | P1 |
| BreachDefense HUD data surfacing | HIGH | LOW | P1 |
| PrivacyQuest intro modal | HIGH | LOW | P1 |
| First NPC highlight | MEDIUM | LOW | P1 |
| Tower firing recoil tween | MEDIUM | LOW | P2 |
| Item pickup feedback | MEDIUM | LOW | P2 |
| Interaction range indicator | MEDIUM | LOW | P2 |
| NPC role visual distinctiveness | MEDIUM | MEDIUM | P2 |
| Dialogue choice sound feedback | MEDIUM | LOW | P2 |
| Wave threat preview panel | MEDIUM | MEDIUM | P3 |
| HIPAA-contextualized kill text | LOW | LOW | P3 |
| Room completion animation | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for this milestone — prototype-to-game gap
- P2: Should have — extends quality, no new dependencies
- P3: Nice to have — defer if time-constrained

---

## Competitor Feature Analysis (Genre Reference)

| Feature | Top-Down RPG (e.g. Stardew Valley, Undertale) | Tower Defense (e.g. Kingdom Rush, BTD) | Our Approach |
|---------|----------------------------------------------|----------------------------------------|--------------|
| Walk animation | 4+ frame cycles, idle animation | N/A (towers are static) | 2-3 frame walk cycle per direction (minimum viable) |
| Sound per action | Footsteps, interact, door, collect, UI | Placement, fire, death, wave horn, win/lose | 6 core SFX covering all table stakes events |
| HUD | Map/mini-map, inventory, quest log | Resources, wave counter, lives, speed | Wave info + suggestedTowers surfaced from existing data |
| Onboarding | Brief pop-up for controls, NPC mentor | Tutorial waves with guided placement | Modal for controls + first-NPC highlight (lightweight) |
| VFX on death | Flash, particles, score float | Explosion particles, float score | Fade + particle burst (genre appropriate) |
| Tower feedback | N/A | Muzzle flash, recoil, range indicator | Recoil tween (already have range indicator on hover) |
| Interactable cues | Exclamation mark, glow, bobbing | N/A | Already have bobbing; add proximity ring |

---

## Sources

- [Phaser 3 Audio documentation](https://docs.phaser.io/phaser/concepts/audio) — HIGH confidence, official docs
- [Phaser 3 Animations documentation](https://docs.phaser.io/phaser/concepts/animations) — HIGH confidence, official docs
- [Phaser 3 ParticleEmitter API](https://docs.phaser.io/api-documentation/class/gameobjects-particles-particleemitter) — HIGH confidence, official docs
- [Game Developer: Squeezing More Juice from Game Design](https://www.gamedeveloper.com/design/squeezing-more-juice-out-of-your-game-design-) — MEDIUM confidence, industry article
- [GameAnalytics: Game Juice article](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design) — MEDIUM confidence, industry article
- [Inworld AI: Game UX Onboarding Best Practices](https://inworld.ai/blog/game-ux-best-practices-for-video-game-onboarding) — MEDIUM confidence, industry article
- [Kenney.nl RPG Audio](https://kenney.nl/assets/rpg-audio) — HIGH confidence, confirmed CC0 asset source
- [Kenney.nl Audio Catalog](https://www.kenney.nl/assets/category:Audio) — HIGH confidence, confirmed CC0 asset source
- [OpenGameArt.org Walk Cycles](https://opengameart.org/content/walk-cycles-0) — MEDIUM confidence, community asset source
- [MDN: Audio for Web Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games) — HIGH confidence, official MDN docs
- [Ourcade: Phaser 3 Web Audio Best Practices](https://blog.ourcade.co/posts/2020/phaser-3-web-audio-best-practices-games/) — MEDIUM confidence, tutorial blog
- Project codebase analysis (`ExplorationScene.ts`, `BreachDefenseScene.ts`, `SpriteFactory.ts`, `CONCERNS.md`) — HIGH confidence, direct code review

---

*Feature research for: PrivacyQuest RPG + BreachDefense tower defense polish milestone*
*Researched: 2026-02-27*
