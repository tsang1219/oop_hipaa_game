# Phase 5: PrivacyQuest Onboarding - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

First-time players learn how to move (WASD/arrows) and interact (Space/ESC) without getting stuck on room entry. Two mechanisms: a one-time intro modal explaining controls, and a per-room pulsing NPC indicator that draws attention to the first interaction target. Also includes a small persistent help icon to re-access controls on demand.

</domain>

<decisions>
## Implementation Decisions

### Intro Modal Content & Style
- Reuse the existing BreachDefense `TutorialModal` component (pink header, black borders, green CTA, retro pixel-art frame)
- Medium-length text: controls (WASD to move, Space to interact, ESC to exit) plus one sentence of context ("You're a new employee at HIPAA General...")
- Text-only control descriptions — no styled keyboard key icons
- CTA button text: "Start exploring →" (instead of BreachDefense's "Got it! Let's go →")

### NPC Highlight Effect
- Scale pulse tween: NPC gently oscillates 1.0 → 1.15 → 1.0 on a loop (Phaser tween, yoyo + repeat -1)
- Visual pulse only — no floating text or arrow indicator
- Targets the first NPC in the room's data array (roomData.json NPC order determines priority)
- Dismisses when the player interacts with that NPC (presses Space), not on proximity or first movement

### First-Visit Scope
- Intro modal shows once ever, on the very first PrivacyQuest room entry — single localStorage flag
- NPC pulse triggers per-room: first entry to each room pulses the first NPC until interacted with
- "Play Again" (localStorage.clear()) resets both modal flag and per-room pulse flags naturally
- Add a small "?" help icon in the PrivacyQuest HUD that re-shows the controls modal on demand

### Claude's Discretion
- Exact modal title text
- Help icon placement and styling within existing HUD layout
- localStorage key naming for onboarding flags
- Scale pulse speed/easing curve
- Whether to pause the Phaser scene behind the intro modal (likely yes, matching BreachDefense pattern)

</decisions>

<specifics>
## Specific Ideas

- CTA button says "Start exploring →" to emphasize the exploration theme
- NPC pulse per-room helps orient the player in each new space without being repetitive
- Controls modal should feel like a quick welcome, not a wall of text

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TutorialModal` component (`client/src/components/breach-defense/TutorialModal.tsx`): Accepts title, description, onAcknowledge, type props. Can be reused directly for the intro modal with type='info'.
- `BRIDGE_EVENTS` constants (`client/src/phaser/EventBridge.ts`): Well-established event system. May need new events for onboarding signals (e.g., NPC pulse dismiss).
- `ExplorationScene.interactables` array: Contains all NPC sprites with their data — first element can be targeted for pulse tween.

### Established Patterns
- localStorage for persistence: PrivacyQuest already uses ~10 localStorage keys. Adding onboarding flags follows the same pattern.
- EventBridge React<->Phaser: Intro modal lives in React, NPC pulse lives in Phaser. Communication via eventBridge.emit/on.
- Conditional rendering with `&&` for modal overlays in PrivacyQuestPage.tsx.
- Scene pause pattern: `this.paused = true/false` in ExplorationScene, checked in update() loop.

### Integration Points
- `PrivacyQuestPage.tsx`: Add intro modal state, help icon, and onboarding localStorage flag here alongside existing state management.
- `ExplorationScene.create()`: Add scale pulse tween to first NPC sprite after interactables are created.
- `ExplorationScene` NPC interaction handler: Stop pulse tween when first NPC is interacted with.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-privacyquest-onboarding*
*Context gathered: 2026-03-01*
