# Phase 4: BreachDefense HUD Data - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface the educational data that already exists in constants.ts (wave names, intros, suggested towers, tower descriptions, end messages, threat types) into the player-facing HUD during BreachDefense gameplay. No new game mechanics — this is about making existing data visible.

</domain>

<decisions>
## Implementation Decisions

### Wave Intro Banner
- Pausing banner on every wave start: game pauses briefly (3-4 seconds), banner auto-dismisses, game resumes
- Banner shows: wave name, intro narrative text, suggested tower names, and incoming threat icons/names
- Rendered as a React overlay positioned over the Phaser canvas (not in-canvas Phaser text)
- Coexists with existing TutorialModal system: odd waves still get deeper TutorialModal for educational content; the banner fires on all waves (including odd ones, before or alongside the tutorial)

### Tower Descriptions & Hints
- Tooltip on hover showing: description text + strongAgainst/weakAgainst counter info
- On mobile (no hover): description shows on tower select (tap to select = shows desc)
- Suggested towers for the current wave get a subtle pulsing border or "suggested" badge in the tower selection panel

### Threat Preview
- Two placements: (1) in the wave intro banner during pause, and (2) persistent strip during gameplay
- Persistent threat strip: new row between the Phaser canvas and the existing HUD bar
- Shows all wave threats upfront when wave starts (not progressive reveal)
- Each threat shows: colored icon + name + count (e.g., "Phishing x3, Credential x4")

### Wave End Messages
- Integrate endMessage from constants.ts into the existing RecapModal as a highlighted callout box (blockquote/colored box at bottom)
- Every wave now gets a RecapModal on completion (not just concept-recap waves) — at minimum showing the endMessage fact
- Include brief wave performance stats in RecapModal: "Threats stopped: X/Y | Towers active: Z"

### Claude's Discretion
- Exact banner auto-dismiss timing and animation (slide, fade, etc.)
- Tooltip positioning and styling details
- Threat strip icon design (reuse existing sprite thumbnails or simplified colored dots)
- How to handle the interaction between wave banner and TutorialModal on odd waves (sequence, merge, etc.)
- Performance stats data collection from BreachDefenseScene

</decisions>

<specifics>
## Specific Ideas

- Wave banner should use the existing retro border/shadow CSS system (border-4 border-black shadow-[Xpx...])
- Tower tooltip should show counter relationships — the whole point is teaching players which towers counter which threats
- Threat strip labeled "Incoming:" to clearly communicate what's about to spawn
- endMessage callout should read as a "key takeaway" — visually distinct from the concept recap text

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TutorialModal` component: full-screen modal with retro styling, icon support, acknowledge button — used for wave intros on odd waves
- `RecapModal` component: concept-based educational recap shown after wave completion
- `CodexModal` component: encyclopedia of seen threats/towers — same modal styling pattern
- `TOWERS` object in constants.ts: has `desc`, `strongAgainst`, `weakAgainst`, `color`, `unlockWave` per tower
- `WAVES` array: has `name`, `intro`, `suggestedTowers`, `endMessage`, `threats[]` per wave
- `THREATS` object: has `desc`, `tags`, `iconIdx` per threat type

### Established Patterns
- React HUD overlays: all UI outside the canvas is React (BreachDefensePage.tsx renders HUD bar, tower panel, modals)
- EventBridge for Phaser→React: `BREACH_STATE_UPDATE` broadcasts game state every 200ms, `BREACH_WAVE_COMPLETE` fires on wave end with concept
- Tower selection panel: 640px wide flex-wrap of 100px buttons with retro styling
- Modal pattern: fixed inset-0 with bg-black/80 backdrop + bordered content box

### Integration Points
- `BreachDefensePage.tsx` line 82-85: `onWaveComplete` handler — needs to pass endMessage + wave stats to RecapModal
- `BreachDefensePage.tsx` line 257-284: tower selection panel — needs tooltip + suggested tower highlighting
- `BreachDefenseScene.ts` line 432-478: wave completion logic — needs to emit additional data (endMessage, stats)
- `EventBridge.ts`: may need new event for wave-start banner trigger with full wave data

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-breachdefense-hud-data*
*Context gathered: 2026-02-28*
