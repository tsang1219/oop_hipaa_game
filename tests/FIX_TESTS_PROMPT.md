Read these files first:
- tests/qa-report.md (current bug status)
- tests/helpers/qa-helpers.ts (test utilities)
- tests/RALPH_PROGRESSION.md (context)
- CLAUDE.md (project conventions)

Your job: get ALL Playwright tests passing. Work directly — no subagents, no Ralph Loop. Just fix, test, commit, repeat.

## Current State
- ~17/41 tests pass, 7 skipped (breach — route removed), ~17 failing
- The GAME ITSELF WORKS FINE — these are test tooling bugs, not game bugs
- A `teleportTo` QA command exists for instant player positioning (bypasses BFS pathfinding)
- Root cause fix applied: qa-no-save no longer clears localStorage on every render (just first render)

## Your Approach

1. First run: npx tsc --noEmit (must be clean)

2. Kill port before every test run: lsof -ti:8080 | xargs kill -9 2>/dev/null || true

3. Run the focused failing tests one at a time:
   npx playwright test tests/progression/npc-interaction.spec.ts --reporter=line --retries=0

4. The core fix needed: the `interactWith` and `talkToNPC` helpers in tests/helpers/qa-helpers.ts use `teleportTo` for positioning but may need timing adjustments. The teleportTo command instantly sets player position — no pathfinding, no timing issues. Make sure all interaction helpers use it consistently.

5. IMPORTANT: Parallel workers cause race conditions on the single dev server. Consider adding `workers: 1` to playwright.config.ts for progression tests, or run test files individually.

6. After NPC interaction is stable, run the full suite:
   npx playwright test tests/ --reporter=line

7. Fix any remaining failures. Most will be in:
   - tests/progression/door-unlocks.spec.ts (depends on talkToNPC working)
   - tests/progression/room-completion.spec.ts (depends on talkToNPC working)
   - tests/progression/full-playthrough.spec.ts (depends on both)

8. Commit each fix as you go.

## Key Architecture
- Game runs at / on UnifiedGamePage (only route)
- window.__QA__ exposes game state + commands (teleportTo, pressSpace, navigateToDoor, movePlayerTo)
- QA bridge reads state from EXPLORATION_STATE_UPDATE events + direct React sync via useEffect
- ?qa-no-save prevents localStorage writes (clears once on mount), ?qa-room=X loads specific rooms
- Room completion checked on EXIT (door transition), not on interaction
- UNLOCK_ORDER: hospital_entrance → reception → break_room → lab → records_room → it_office → er
- Completing a room requires: all requiredNpcs talked to + requiredZones examined + requiredItems collected

## Key Files
- client/src/phaser/qa-bridge.ts — QA bridge with commands (teleportTo, pressSpace, navigateToDoor)
- client/src/phaser/scenes/ExplorationScene.ts — QA command handlers (onQATeleportTo, onQAPressSpace, onQANavigateDoor)
- client/src/pages/UnifiedGamePage.tsx — React game page, event handlers, QA state sync
- client/src/hooks/useGameState.ts — UNLOCK_ORDER, isDepartmentAccessible
- tests/helpers/qa-helpers.ts — THE MAIN FILE TO FIX (interactWith, talkToNPC, dismissDialogue)
- tests/progression/*.spec.ts — test suites
- tests/visual-qa.spec.ts — visual regression tests

## What NOT to do
- Don't spawn subagents — work directly
- Don't change game behavior to make tests pass
- Don't add complex retry/polling logic — use teleportTo for instant positioning
- Don't run all tests every time — run the specific failing file first
- Don't run with multiple workers until individual test files pass
