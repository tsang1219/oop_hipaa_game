# QA Pipeline

Automated QA loops for PrivacyQuest. Two modes: **Bug Fix** (POLISH_STANDARD compliance) and **Design Review** (room-by-room game design quality).

## Two Loops

### 1. Bug Fix Loop (POLISH_STANDARD + tests)
Finds rule violations, fixes them, sentinel reviews diffs. Use when things are broken.

```
/ralph-loop Read tests/qa-pipeline/run-pipeline.md and execute it --max-iterations 5 --completion-promise "QA pipeline complete — all tests passing, no blockers or criticals"
```

### 2. Design Review Loop (room-by-room game design)
Rates every room 1-10 on look/feel, layout, gameplay. Implements improvements for lowest-scoring rooms. Use when things work but don't feel good enough.

```
/ralph-loop Read tests/qa-pipeline/design-review-prompt.md and execute it. Focus on DESIGN QUALITY — look and feel, layout, gameplay feel — not bug fixing. Rate every room 1-10, implement improvements for the 2 lowest-scoring rooms per iteration. Re-screenshot and re-rate after each round. --max-iterations 10 --completion-promise "QA pipeline complete — all tests passing, no blockers or criticals"
```

## Before Running Either Loop

1. **Regenerate context** (if code changed since last run):
   ```bash
   npx repomix
   ```

2. **Reset state** (optional — for a fresh run):
   ```bash
   echo '[]' > tests/qa-pipeline/fix-log.json
   echo '{}' > tests/qa-pipeline/report.json
   ```

3. **Kill stale server**:
   ```bash
   lsof -ti:8080 | xargs kill -9 2>/dev/null || true
   ```

## Pipeline Files

| File | Purpose |
|------|---------|
| `run-pipeline.md` | Bug fix loop driver — POLISH_STANDARD audit + fix agents + sentinel |
| `design-review-prompt.md` | Design loop driver — room ratings + design improvements |
| `orchestrator-prompt.md` | QA agent — tests, screenshots, polish audit, design ratings |
| `fix-agent-prompt.md` | Fix agent — minimum-change fixes + design improvements |
| `sentinel-prompt.md` | Review gate — approves/blocks each fix |
| `codebase-context.txt` | Repomix-packed context (64k tokens, 20 files) |
| `report.json` | Current bug/design report (written by orchestrator) |
| `fix-log.json` | All fix attempts (appended by fix agents) |
| `test-results.json` | Playwright JSON output (written by Playwright) |

## Design Review Dimensions

Each room is rated 1-10 on:
- **Look & Feel** — Visual identity, color palette, mood, texture
- **Design** — Layout, spatial flow, NPC placement, dead space usage
- **Gameplay** — Gate flow, observation zone placement, memorable moments, progression feel

Rating scale: 1-3 placeholder, 4-5 lifeless, 6-7 some character, 8 good, 9 great, 10 ship it.

## Run History

### 2026-03-30 — Bug Fix Loop (Iteration 1)
- 9 bugs fixed: modal positioning, pixel font, missing sounds, music fade, retro styling
- 2 design improvements: hallway props, lab fixtures
- Result: 38/38 tests passing

### 2026-03-31 — Design Review Loop (Iteration 1)
- 7 rooms redesigned with unique props and spatial layouts:
  - Hospital Entrance: +info kiosk, welcome mat, bulletin board, flowers, sanitizer
  - Reception: +L-counter, privacy screens, waiting clusters, water dispenser
  - Break Room: +fridge, microwave, TV stand, notice board, coat rack
  - Lab: +fume hood, chemical shelves, eyewash station, autoclave
  - Records Room: +filing aisles, records counter, archive boxes, document cart
  - IT Office: +server wall, monitor banks, cable trays, whiteboard, locked cabinet
  - ER: +curtain partitions, IV stands, crash cart, triage desk
- All rooms scored 8/10 after improvements
- Result: 38/38 tests passing, 0 regressions

## Completion Criteria

**Bug Fix Loop**: All tests pass + no BLOCKER/CRITICAL + all POLISH_STANDARD rules pass
**Design Review Loop**: All tests pass + all room ratings >= 8 (or plateaued)

## Cancel

```
/ralph-loop:cancel-ralph
```
