# Testing Infrastructure

Last updated: 2026-03-29
Based on analysis of `/Users/all/claude_code/oop_hipaa_games/PrivacyQuest/`

---

## Summary

The project has a comprehensive E2E testing infrastructure built on **Playwright** with a custom **QA Bridge** that exposes Phaser game state and commands to test automation. A **Ralph Loop** process drives iterative QA using two specialized agents (tester + fixer). Unit tests use **Vitest**.

**Current status (2026-03-29):** 34/41 Playwright tests passing, 0 failing, 7 skipped (breach — route removed in V2). TypeScript compiles clean. All progression and visual tests green.

---

## Test Framework Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Playwright | 1.58 | E2E browser testing (Chromium) |
| Vitest | 4.1 | Unit tests (`*.test.ts`) |
| TypeScript | 5.6 | Static type checking (`npm run check` / `npx tsc --noEmit`) |

### npm scripts

```json
"test:visual": "playwright test tests/visual-qa.spec.ts"
"check": "tsc"
```

### Playwright Config (`playwright.config.ts`)

- `timeout: 60_000` per test
- `retries: 1`
- `viewport: 1280x960`
- `baseURL: http://localhost:8080`
- `webServer`: starts `npm run dev` on port 8080 with `reuseExistingServer: true`
- Reporters: HTML (never auto-open) + list

**Known requirement:** Must run with `workers: 1` — parallel workers race on the single dev server. This is not yet set in config (causes intermittent failures).

---

## QA Bridge (`client/src/phaser/qa-bridge.ts`)

Exposes `window.__QA__` for programmatic game control from Playwright tests. Initialized in `main.tsx` via `initQABridge()`.

### State (read-only)

| Property | Type | Description |
|----------|------|-------------|
| `sceneReady` | `string \| null` | Currently ready Phaser scene key |
| `currentRoomId` | `string \| null` | Active room ID |
| `playerPosition` | `{ tileX, tileY }` | Player's tile coordinates |
| `nearbyInteractable` | `{ type, id }` | What the player can interact with |
| `nearDoor` | `{ id, targetRoomId }` | Door near player |
| `paused` | `boolean` | Scene paused (during dialogue) |
| `roomNPCs` | `Array<{ id, x, y, completed }>` | NPCs in current room |
| `roomDoors` | `Array<{ id, targetRoomId, x, y, state }>` | Doors in current room |
| `completedRooms` | `string[]` | All completed room IDs |
| `completedNPCs` | `string[]` | All completed NPC IDs |
| `eventLog` | `EventLogEntry[]` | Ring buffer of last 50 events |

State is updated via `EXPLORATION_STATE_UPDATE` EventBridge events. Completion state syncs from localStorage every 1 second.

### Commands

| Command | Description |
|---------|-------------|
| `teleportTo(tileX, tileY)` | Instant player teleport (most reliable for tests) |
| `pressSpace()` | Trigger SPACE key interaction |
| `navigateToDoor(doorId)` | Navigate player to a specific door |
| `movePlayerTo(tileX, tileY)` | BFS pathfinding movement (less reliable in headless Chrome) |

### Promise-based Waiters

| Waiter | Description |
|--------|-------------|
| `waitFor.event(name, timeout?)` | Wait for any EventBridge event |
| `waitFor.roomLoad(roomId, timeout?)` | Wait for specific room to load |
| `waitFor.sceneReady(key, timeout?)` | Wait for Phaser scene to be ready |

### QA URL Parameters

| Parameter | Effect |
|-----------|--------|
| `?qa-no-save` | Prevents localStorage writes (clean test state) |
| `?qa-room=reception` | Auto-navigates to specific room on load |
| `?qa-skip-onboarding` | Skips intro modal |

---

## Test Suites

### Progression Tests (`tests/progression/`)

6 test suites covering gameplay mechanics:

| File | Tests | Coverage |
|------|-------|----------|
| `room-navigation.spec.ts` | 6 | Fresh start loads hospital_entrance, direct room loading via `?qa-room`, console error tracking |
| `npc-interaction.spec.ts` | 5 | NPC dialogue overlay, completedNPCs tracking, scene unpauses after dialogue |
| `room-completion.spec.ts` | 5 | Room requirements system, incomplete rooms don't mark complete, gated NPCs |
| `door-unlocks.spec.ts` | 4 | Door lock/unlock chain via UNLOCK_ORDER, locked doors block transition, backtrack navigation |
| `full-playthrough.spec.ts` | 2 | Complete hospital entrance + reception flow, milestone screenshots |
| `breach-gameplay.spec.ts` | 4 | All SKIPPED — `/breach` route removed in V2; pending encounter system integration |

### Visual Regression Tests (`tests/visual-qa.spec.ts`)

7 tests: Hub World + 6 department rooms. Each loads via `?qa-room=X&qa-no-save`, waits for Exploration scene ready, captures screenshot, verifies canvas visible. Filters benign errors (favicon, 404, ResizeObserver, WebAudio).

### Unit Tests

`client/src/lib/saveData.test.ts` — Vitest tests for save data migration (`migrateV1toV2`, `loadSave`, `writeSave`).

---

## Test Helpers (`tests/helpers/qa-helpers.ts`)

Shared utilities abstracting QA bridge interaction:

### Setup
- `waitForQA(page)` — Wait for `window.__QA__` to exist
- `waitForExploration(page)` — Wait for Exploration scene ready
- `waitForRoom(page, roomId)` — Wait for specific room to load
- `loadFresh(page)` — Load game from scratch (hospital_entrance)
- `loadRoom(page, roomId)` — Load specific room via `?qa-room` param

### Interaction
- `talkToNPC(page, x, y)` — Full conversation: teleport near NPC → space → dismiss dialogue
- `examineZone(page, x, y)` — Interact with observation zone, dismiss overlay
- `collectItem(page, x, y)` — Interact with educational item, close modal
- `dismissDialogue(page)` — Click through entire dialogue sequence

### Navigation
- `goThroughDoor(page, doorId, expectedRoomId)` — Enter door, wait for room change
- `navigateToDoor(page, doorId)` — Navigate player to door position

### Reference Data Constants
- `ROOMS` — All 7 rooms with NPC coordinates, zone positions, item locations, door IDs, requirements
- `HALLWAYS` — 5 hallway connectors with door mappings
- `UNLOCK_ORDER` — Linear department progression chain
- `SETTLE_MS = 2000`, `SCENE_TIMEOUT = 30_000`, `EVENT_TIMEOUT = 15_000`

---

## Ralph Loop QA Process (`tests/RALPH_PROGRESSION.md`)

Two-agent iterative loop for automated QA:

### Phase A: QA Tester (subagent)
1. Build check (`npx tsc --noEmit`)
2. Run Playwright progression tests
3. Run visual regression tests
4. Screenshot review (multimodal — read PNGs, check for rendering issues)
5. Console log analysis
6. Game design audit (V2 feature checklist)
7. Write report → `tests/qa-report.md` with severity labels

### Phase B: Bug Fixer (subagent)
1. Read `tests/qa-report.md`
2. Fix ONE issue at a time, highest severity first
3. Minimum change, commit with `fix(qa): BUG-NNN description`
4. Mark issue as resolved in report

### Phase C: Loop Control
Continue until all BLOCKER/CRITICAL resolved. MAJOR/MINOR/POLISH optional.

### Severity Taxonomy
- **BLOCKER**: Won't compile, crashes on load, infinite loop
- **CRITICAL**: Can't progress past a room, dialogue stuck, door broken
- **MAJOR**: V2 feature doesn't work (fanfare missing, act doesn't advance)
- **MINOR**: Visual glitch, missing sound, text overlap
- **POLISH**: Could look/feel better but everything functions

---

## Bug Tracking (`tests/qa-report.md`)

Structured bug report updated by Ralph Loop iterations. Current state (2026-03-28):

**Fixed:** BUG-001 (QA bridge state sync), BUG-002 (door navigation), BUG-003/004 (dead routes), BUG-005 (NPC dialogue), BUG-006 (unicode text)

**Open:** BUG-007 (blank canvas on qa-no-save), BUG-008/009 (cascading from door/NPC issues), BUG-011 (stale screenshots)

---

## Known Testing Issues

1. **BFS pathfinding unreliable in headless Chrome** — Use `teleportTo` instead of `movePlayerTo` for positioning
2. **Parallel workers cause race conditions** — Must use `workers: 1` (single dev server on port 8080)
3. **Event timing** — Door navigation and NPC dialogue propagation between Phaser→EventBridge→React→QA bridge has timing sensitivity. Tests use `waitForRoom` and `waitForDialogue` with generous timeouts.
4. **`qa-no-save` guard** — Was fixed to only clear localStorage on first render, not every render
5. **Port conflicts** — Kill stale server before tests: `lsof -ti:8080 | xargs kill -9 2>/dev/null || true`

---

## Visual QA Scores (`tests/qa-scores.md`)

Visual polish tracked across 8 Ralph Loop iterations, improving from 4.1/10 to 8.0/10 average:
- Canvas scaling, NPC sprites, furniture detail, floor textures, BreachDefense grid, shared color palette, ambient effects
- Scoring rubric: 1-3 broken, 4-5 functional but ugly, 6-7 decent, 8-9 good, 10 ship it
