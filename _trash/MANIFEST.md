# `_trash/` — Parking lot for removed files

Files in this directory are **no longer in active use** but kept here (rather than git-deleted) so anyone can see what was taken out and restore without spelunking through git history.

## How this works

- Files preserve their **original sub-path** under `_trash/`. So `_trash/client/src/pages/BreachDefensePage.tsx` was originally at `client/src/pages/BreachDefensePage.tsx`.
- `_trash/` is excluded from TypeScript compilation (see [tsconfig.json](../tsconfig.json) `exclude`) and unreachable from Vite entry points, so it has zero runtime impact.
- It IS tracked in git so the parking lot is visible across machines without diving into history.

## Restoring a file

To bring a file back into the live codebase:

```bash
mv _trash/<original-subpath>/<filename> <original-subpath>/<filename>
# Example:
mv _trash/client/src/pages/HubWorldPage.tsx client/src/pages/HubWorldPage.tsx
```

If the file imports other modules with relative paths, those should still work — the imports were valid when the file was active, and the surrounding code structure hasn't been refactored.

If the file was moved as part of a structural change (e.g., a route was removed), restoring it will also require re-wiring whatever called it.

---

## Removed 2026-05-08 — Phase 16 sprawl cleanup

Identified by [Knip](https://knip.dev) as fully unused (zero imports across the live codebase). `npm run check` passes cleanly after removal. Total: **4,223 LOC across 16 files.**

### v2 unification leftovers

When Phase 12 unified the routes (`/privacy` and `/breach` → single `/`), the route wiring was removed but the page components themselves were never deleted. These files have been dead code since 2026 Q1.

| File | LOC | Reason |
|---|---|---|
| `client/src/pages/BreachDefensePage.tsx` | 921 | Old standalone BreachDefense route — replaced by encounter integration in [UnifiedGamePage](../client/src/pages/UnifiedGamePage.tsx) |
| `client/src/pages/PrivacyQuestPage.tsx` | 872 | Old standalone PrivacyQuest route — replaced by [UnifiedGamePage](../client/src/pages/UnifiedGamePage.tsx) |
| `client/src/pages/HubWorldPage.tsx` | 69 | Old hub world route — replaced by hallway rooms inside the unified scene |
| `client/src/phaser/scenes/HubWorldScene.ts` | 1,234 | Old hub world Phaser scene — replaced by hallway rooms in [ExplorationScene](../client/src/phaser/scenes/ExplorationScene.ts) |

### Orphan UI components

Components that were either replaced by newer equivalents or never wired into the unified game.

| File | LOC | Notes |
|---|---|---|
| `client/src/components/breach-defense/CodexModal.tsx` | 267 | Replaced by inline codex panel in BreachDefenseScene |
| `client/src/components/breach-defense/RecapModal.tsx` | 97 | Replaced by post-wave recap in unified flow |
| `client/src/components/ChecklistUI.tsx` | 35 | Earlier draft — never imported |
| `client/src/components/DepartmentBreadcrumb.tsx` | 116 | Replaced by Phase 15 breadcrumb HUD |
| `client/src/components/EncounterHud.tsx` | 74 | Earlier HUD prototype — replaced |
| `client/src/components/KnowledgeTracker.tsx` | 108 | Codex implementation moved elsewhere |
| `client/src/components/PlayerBackSprite.tsx` | 106 | Replaced by programmatic 4-direction walk cycle |
| `client/src/components/PrivacyMeter.tsx` | 49 | Replaced by unified compliance score HUD |
| `client/src/components/SceneCounter.tsx` | 12 | Stub — never integrated |
| `client/src/components/ui/AnimatedOverlay.tsx` | 46 | Generic overlay primitive — never imported |

### Orphan game data

| File | LOC | Notes |
|---|---|---|
| `client/src/game/breach-defense/assets.ts` | 38 | Asset path constants — never imported |
| `client/src/game/breach-defense/tutorialContent.ts` | 179 | Earlier tutorial content draft — replaced by 12-modal tutorial chain |

---

## Audit trail

This manifest is the source of truth for what's parked here. When adding to `_trash/`, add an entry to a new dated section above. When restoring, leave the entry in place but note it was restored — that history is useful.
