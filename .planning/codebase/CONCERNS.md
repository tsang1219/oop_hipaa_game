# Codebase Concerns & Technical Debt

Last updated: 2026-03-29 (V2 post-Phase-15)
All file paths are relative to project root unless noted otherwise.

---

## 1. Active Concerns (V2)

### 1.1 ExplorationScene.ts is 1500+ lines

`client/src/phaser/scenes/ExplorationScene.ts` handles room rendering, player movement, BFS pathfinding, NPC proximity detection, door transitions, QA bridge commands, bulletin boards, and hallway logic — all in one file. This is the single biggest maintenance risk. Most QA bugs trace back to this file.

### 1.2 Door navigation event timing

The door interaction flow crosses 4 async boundaries:
1. QA bridge emits `QA_NAVIGATE_DOOR` → EventBridge
2. ExplorationScene handles event, attempts door transition
3. React (UnifiedGamePage) processes room change event
4. QA bridge state updates via `EXPLORATION_STATE_UPDATE`

Tests timeout when any step in this chain is slow or drops the event. The proximity check in ExplorationScene must fire after teleport for the door interaction to work, which is timing-sensitive.

### 1.3 NPC dialogue propagation reliability

Similar chain to doors: teleport near NPC → pressSpace → ExplorationScene detects proximity → emits `EXPLORATION_INTERACT_NPC` → React shows dialogue overlay → QA bridge sees paused state. The proximity detection after `teleportTo` doesn't always fire on the same tick, causing test flakiness.

### 1.4 BFS pathfinding O(n^2) allocation

`ExplorationScene.ts` `findPath()` copies the entire path array on every BFS step:
```ts
queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
```
Should use parent-pointer reconstruction. Not a gameplay issue (rooms are small), but causes frame hitches on larger rooms and is unreliable in headless Chrome (why tests use `teleportTo` instead).

### 1.5 Test automation relies on timing-sensitive waits

Tests use `waitForRoom`, `waitForDialogue`, `waitForFunction` with generous timeouts (15-30s). When the game is slow to respond (common in headless Chrome), tests pass but are slow. When the game is fast, tests pass quickly. The boundary between "slow" and "broken" is a timeout value, not a semantic check.

### 1.6 Untyped EventBridge payloads

`EventBridge.ts` defines string event names but no payload types. Every `emit()` and `on()` call uses untyped payloads. A renamed field silently produces `undefined` at the listener. Should have a `BridgeEventMap` type mapping events to payloads.

---

## 2. Dead / Vestigial Code

### 2.1 Drizzle config with no database

`drizzle.config.ts` configures PostgreSQL but no database is provisioned, no Drizzle ORM package installed, no API routes exist. Artifact of Replit template.

### 2.2 Unused query infrastructure

`@tanstack/react-query` wraps the entire app but no component makes API calls. All data from static JSON. Adds ~30KB gzipped for zero queries.

### 2.3 Unused PNG assets

4 reference sheet PNGs in `attached_assets/generated_images/` are never loaded. `Hospital_corridor_pixel_background_72c96c5f.png` preloaded but never used.

### 2.4 Unused CSS variables

`client/src/index.css` has 240+ lines of dark mode, sidebar, and chart color CSS variables from Replit template scaffold. None are used.

---

## 3. Performance Concerns

### 3.1 Full Phaser bundle (~1.2MB min)

Imports from `'phaser'` everywhere. Phaser 3.87+ supports tree-shaking via `phaser/src` but this is not used. Only Arcade physics is needed.

### 3.2 All sprites loaded on every boot

`BootScene.ts` preloads all tower and threat PNG sprites even when the player hasn't reached IT Office (where BreachDefense encounter triggers). Could lazy-load encounter assets.

### 3.3 Projectile-enemy lookup is O(n*m)

`BreachDefenseScene.ts` uses `enemies.find(e => e.id === proj.targetId)` every frame for every projectile. Should use a Map lookup.

---

## 4. Accessibility Gaps

### 4.1 Limited ARIA attributes

Only `EducationalItemModal.tsx` has `role="dialog"`, `aria-modal`, `aria-labelledby`. All other modals lack ARIA attributes.

### 4.2 No focus management in modals

Keyboard focus is not trapped within modals. Focus not returned to trigger on close.

### 4.3 Color-only state indication

Tower validity (green/red), HP bars (green/yellow/red), room status in HUD — no text/icon alternative for color-blind users.

### 4.4 Keyboard-only users cannot play BreachDefense

Tower placement requires mouse click. No keyboard equivalent for grid cell selection.

### 4.5 Phaser canvas invisible to screen readers

No `aria-live` regions for score updates or wave announcements. Canvas content is opaque to assistive technology.

---

## 5. Resolved in V2 (Formerly Concerns)

These items from the V1 concerns list were fixed during Phases 11-15:

- **Multiple Phaser instances on navigation** — Fixed by Phase 12 unified single-route architecture. One Phaser instance at `/`.
- **PrivacyQuestPage scene launch timing hack** — Fixed. Now uses `SCENE_READY` EventBridge event instead of blind 100ms delay.
- **EventBridge listener accumulation** — Fixed by Phase 12 cleanup. Scene shutdown properly removes listeners.
- **Seven individual localStorage persistence effects** — Fixed by Phase 11. Consolidated into single `pq:save:v2` key via `loadSave`/`writeSave` in `client/src/lib/saveData.ts`.
- **"Play Again" nukes all localStorage** — Fixed. Now clears only `pq:save:v2` key.
- **PrivacyQuestPage monolith (512 lines, 15+ state vars)** — Refactored into `useGameState` hook (`client/src/hooks/useGameState.ts`). UnifiedGamePage is still large but state management is consolidated.
- **No test infrastructure** — Added Playwright + QA Bridge + Ralph Loop (see TESTING.md).
- **No onboarding** — Added intro modal with skip option (`?qa-skip-onboarding`).
- **Obstacle type cast (`(obs as any).type`)** — Schema updated to include obstacle type field.
- **Duplicate asset loading** — BreachDefense assets now loaded once via encounter system.
