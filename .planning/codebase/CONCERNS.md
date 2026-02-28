# Codebase Concerns & Technical Debt

Post-Phase-4-cleanup analysis of PrivacyQuest + BreachDefense.
All file paths are relative to project root unless noted otherwise.

---

## 1. Type Safety Issues

### 1.1 Widespread `any` usage in PrivacyQuestPage

`client/src/pages/PrivacyQuestPage.tsx` defines a local `RoomWithStory` interface
with five `any[]` fields instead of importing proper types from `@shared/schema`:

```
Line 34:  obstacles: any[];
Line 35:  npcs: any[];
Line 36:  interactionZones: any[];
Line 37:  educationalItems: any[];
Line 39:  config?: any;
```

This means every NPC/obstacle/zone/item access in the file uses inline `as any`
casts to work around the loosely typed data:

```
Line 43:  const scenes = (gameDataJson as any).scenes as Scene[];
Line 107: rooms.reduce((sum, r) => sum + r.npcs.filter((n: any) => !n.isFinalBoss).length, 0);
Line 241: type: data.type as any
Line 270: room.npcs.filter((n: any) => !n.isFinalBoss).every((n: any) => completedNPCs.has(n.id));
Line 415: currentRoom?.npcs.find((n: any) => n.id === currentNPCId);
Line 446: room={currentRoom as any}
```

**Fix**: Import `Room`, `NPC`, `Obstacle`, etc. from `@shared/schema` and remove
the local `RoomWithStory` redefinition.

### 1.2 ExplorationScene obstacle type cast

`client/src/phaser/scenes/ExplorationScene.ts` line 105:
```ts
const obsType = (obs as any).type as string | undefined;
```

The `Obstacle` type in `shared/schema.ts` (line 57-62) only defines `x`, `y`,
`width`, `height`. The room data JSON actually includes a `type` field on obstacles
(e.g. `"wall"`, `"desk"`, `"bed"`), but the Zod schema never declares it. This is
a schema gap -- the runtime data has a field the type system does not know about.

**Fix**: Add `type: z.string().optional()` to `obstacleSchema` in
`shared/schema.ts` line 57.

### 1.3 Untyped EventBridge payloads

`client/src/phaser/EventBridge.ts` defines string event names (line 23-48) but no
payload types. Every `eventBridge.emit()` and `eventBridge.on()` call uses
untyped payloads. A mistyped field name in an emit won't produce a compile error.

Example -- `BreachDefenseScene.ts` line 392 emits `securityScore`, `budget`,
`wave`, `gameState`, `enemyCount`, `towerCount`, but the listener in
`BreachDefensePage.tsx` line 69 declares its own inline interface. If the scene
renames a field, the listener silently receives `undefined`.

**Fix**: Add a `BridgeEventMap` type mapping each event name to its payload type,
then wrap emit/on with typed helpers.

### 1.4 Unused React import pattern

Three components import React but don't use JSX transform features that require it
(React 18 automatic runtime):

```
client/src/components/breach-defense/TutorialModal.tsx:1  import React from 'react';
client/src/components/breach-defense/RecapModal.tsx:1     import React from 'react';
client/src/components/breach-defense/CodexModal.tsx:1     import React, { useState } from 'react';
```

These are harmless but inconsistent with the rest of the codebase which omits bare
`React` imports.

---

## 2. Dead / Vestigial Code

### 2.1 Drizzle config with no database

`drizzle.config.ts` configures PostgreSQL via `DATABASE_URL`, but:
- No database is provisioned or referenced anywhere
- `server/routes.ts` registers zero API routes (line 4-8: empty function)
- `package.json` has no `drizzle-kit` dependency
- The `shared/schema.ts` file only contains Zod schemas, not Drizzle table defs

The drizzle config is an artifact of the Replit template. It will throw on
`import` if `DATABASE_URL` is missing.

### 2.2 Unused query infrastructure

`client/src/lib/queryClient.ts` configures TanStack Query with `apiRequest` and
`getQueryFn` helpers, but:
- No component in the codebase makes any API calls
- All data is loaded from static JSON files (`gameData.json`, `roomData.json`)
- `@tanstack/react-query` is imported in `App.tsx` (line 3) and wraps the entire
  app in `QueryClientProvider` (line 24)

This adds ~30KB gzipped to the bundle for zero actual queries.

### 2.3 Unused PNG assets

Three PNG files in `attached_assets/generated_images/` are never loaded by
BootScene or referenced by any import:

```
pixel_art_environment_tiles:_server_rack,_workstation,_network_cables.png
pixel_art_icons_for_cyber_threats:_envelope,_skull,_badge,_cracked_shield.png
pixel_art_icons_for_security_towers:_padlock,_firewall,_shield,_cannon.png
vulnerability_threat_pixel_sprite.png
```

Also, `Hospital_corridor_pixel_background_72c96c5f.png` is preloaded in
`BootScene.ts` line 45 as `hospital_bg`, but no scene ever uses the
`hospital_bg` texture.

### 2.4 Duplicate asset loading system

BreachDefense sprites are loaded two ways:
1. **Phaser preload** in `BootScene.ts` lines 48-63 (loaded into Phaser texture
   cache as `tower_MFA`, `threat_PHISHING`, etc.)
2. **Vite imports** in `client/src/game/breach-defense/assets.ts` lines 2-17
   (imported as ES modules for React `<img>` tags in CodexModal)

This means every sprite PNG is bundled twice: once via Vite import (hashed into
`dist/assets/`) and once via Phaser's HTTP fetch to `/attached_assets/`. The Vite
imports are only used in the CodexModal component for displaying thumbnails.

### 2.5 `Nurse_Nina_pixel_portrait_6f9bfea3.png` reference

`client/src/components/GameContainer.tsx` line 9 imports:
```ts
import nurseNinaImg from '@assets/generated_images/Nurse_Nina_pixel_portrait_6f9bfea3.png';
```
This is only used in the "game complete" screen (line 126) that appears after
finishing all dialogue scenes. Given the battle encounter screen has replaced
the old dialogue flow, this portrait may appear redundant with the NPC pixel
sprites rendered by `NPCSprite.tsx`.

---

## 3. Fragile Code (Will Break if Modified Carelessly)

### 3.1 PrivacyQuestPage scene launch timing hack

`client/src/pages/PrivacyQuestPage.tsx` lines 175-188:
```ts
const timer = setTimeout(() => {
  const game = gameRef.current;
  if (!game) return;
  const scene = game.scene.getScene('Exploration');
  if (scene) {
    game.scene.start('Exploration', { room, ... });
  }
}, 100);
```

This uses a blind 100ms delay to wait for Phaser to be ready. On slow devices
or during heavy load, Phaser may not be initialized yet. The same pattern exists
in `BreachDefensePage.tsx` lines 46-63 where it listens for `SCENE_READY` from
Boot before starting BreachDefense, but PrivacyQuestPage does not use this
pattern -- it just waits 100ms.

**Risk**: On slow cold starts, the Exploration scene will silently fail to load.

### 3.2 Phaser instance lifecycle in PhaserGame.tsx

`client/src/phaser/PhaserGame.tsx` line 41:
```ts
}, []); // Empty dependency array
```

The `useEffect` for game creation ignores `width`, `height`, and `onSceneReady`
in its dependency array. If a parent re-renders with different dimensions, the
game instance will not update. This is likely intentional (game size is fixed),
but `onSceneReady` callback changes are silently dropped.

Additionally, `useImperativeHandle` (line 17) uses `gameRef.current!` with a
non-null assertion, but `gameRef.current` is `null` until the `useEffect` runs.
If the parent reads the ref before mount, it gets `null`.

### 3.3 Multiple Phaser instances on navigation

When navigating between `/` (HubWorld), `/privacy`, and `/breach`, each page
mounts its own `<PhaserGame>` component which creates a **new** `Phaser.Game`
instance. The previous one is destroyed on unmount (line 38), but:
- All four scenes (Boot, HubWorld, Exploration, BreachDefense) are registered in
  every instance
- BootScene always starts HubWorld on boot (line 75)
- BreachDefensePage then has to stop HubWorld and start BreachDefense (line 54-55)

This means navigating to `/breach` creates a Phaser instance, loads all assets,
starts HubWorld, then immediately stops it and starts BreachDefense. This is
wasteful and causes a flash.

**Root cause**: There is no shared Phaser instance across routes.

### 3.4 EventBridge singleton survives navigation

`EventBridge.ts` creates a singleton (lines 9-17) that persists across page
navigations. Scene `shutdown()` methods clean up their listeners, but if a
scene crash or fast navigation prevents `shutdown()` from running, stale
listeners accumulate. The EventBridge never has a "remove all listeners" call.

### 3.5 BFS pathfinding allocates heavily per click

`ExplorationScene.ts` `findPath()` (lines 331-364) creates new arrays for every
BFS step:
```ts
queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
```

For a 20x15 room, this copies the entire path array hundreds of times. On larger
rooms, this could cause frame hitches. A parent-pointer reconstruction approach
would be O(n) total instead of O(n^2).

### 3.6 BreachDefenseScene projectile-enemy lookup is O(n*m)

`BreachDefenseScene.ts` line 630:
```ts
const target = this.enemies.find(e => e.id === proj.targetId);
```

This runs every frame for every projectile. With 20+ projectiles and 20+ enemies,
this is 400+ string comparisons per frame. Should use a Map lookup.

### 3.7 Hardcoded `PATHS[0]` everywhere

`BreachDefenseScene.ts` references `PATHS[0]` in 7+ places (lines 113, 130, 285,
332, 483). If a second path is ever added, every reference needs manual updating.
The `EnemyData.pathIndex` field (line 16) suggests multi-path was intended but
never implemented.

---

## 4. Performance Concerns

### 4.1 Bundle includes full Phaser (~1.2MB min)

`phaser` is imported as a full bundle. Phaser 3.87+ supports tree-shaking via
`phaser/src`, but the codebase imports from `'phaser'` everywhere. Since this is
a pixel art game using only Arcade physics, much of Phaser's matter physics,
spine support, and WebGL pipeline code is dead weight.

### 4.2 All 14 PNG sprites loaded on every page

`BootScene.ts` preloads all tower and threat sprites (lines 48-63) even when the
user is on HubWorldPage or PrivacyQuestPage. These PNGs (~17MB total for the
`generated_images` directory) are fetched on every cold load.

### 4.3 KnowledgeTracker polls localStorage every 500ms

`client/src/components/KnowledgeTracker.tsx` line 44:
```ts
const interval = setInterval(updateProgress, 500);
```

This `setInterval` runs on every render cycle of the exploration page, parsing
JSON from localStorage twice per second. Since the parent (`PrivacyQuestPage`)
already tracks `collectedItems` in state, the KnowledgeTracker should receive
it as a prop instead of independently polling storage.

### 4.4 CSS bundle includes unused dark mode and sidebar vars

`client/src/index.css` defines 240+ lines of CSS custom properties for both light
and dark modes, plus sidebar theming (lines 133-242). The app does not have:
- A dark mode toggle
- A sidebar
- Chart colors (--chart-1 through --chart-5)

This is template CSS from the Replit scaffold.

### 4.5 Seven individual localStorage persistence effects

`PrivacyQuestPage.tsx` lines 111-117 create seven separate `useEffect` hooks that
each independently write to localStorage on every state change:

```ts
useEffect(() => { localStorage.setItem('gameStartTime', ...); }, [gameStartTime]);
useEffect(() => { localStorage.setItem('completedRooms', ...); }, [completedRooms]);
useEffect(() => { localStorage.setItem('collectedStories', ...); }, [collectedStories]);
useEffect(() => { localStorage.setItem('completedNPCs', ...); }, [completedNPCs]);
useEffect(() => { localStorage.setItem('completedZones', ...); }, [completedZones]);
useEffect(() => { localStorage.setItem('collectedEducationalItems', ...); }, [collectedItems]);
useEffect(() => { localStorage.setItem('current-privacy-score', ...); }, [privacyScore]);
```

Each state change triggers a separate synchronous `localStorage.setItem` call.
Should be consolidated into a single debounced write.

---

## 5. Known Bugs / Likely Bugs

### 5.1 "Play Again" does `localStorage.clear()` + `window.location.reload()`

`PrivacyQuestPage.tsx` lines 333-334:
```ts
localStorage.clear();
window.location.reload();
```

This nukes ALL localStorage, including any BreachDefense state or unrelated data
the user may have. Should clear only PrivacyQuest-specific keys.

### 5.2 Race condition in BreachDefense recap/tutorial flow

When a wave completes, two events fire in sequence:
1. `BREACH_WAVE_COMPLETE` (BreachDefenseScene.ts line 436) -- React shows RecapModal
2. `BREACH_TUTORIAL_TRIGGER` (BreachDefenseScene.ts line 462) -- React shows TutorialModal

But if both fire on the same wave transition (e.g., wave 2 ends, wave 3 gets a
splash), the scene sets `gameState = 'PAUSED'` (line 461) after emitting
`BREACH_WAVE_COMPLETE`. The React side shows RecapModal, and when the user clicks
"Continue", it emits `REACT_DISMISS_TUTORIAL` which resumes the scene. But then
the TutorialModal also appears. The user has to dismiss two modals in sequence,
which is confusing. The issue is that waves 3, 5, 7, 9 show both a wave recap AND
a tutorial splash.

### 5.3 Win condition uses wrong comparison

`PrivacyQuestPage.tsx` line 304:
```ts
if (currentSceneId === 'final_boss_1' && newCompleted.size === totalScenarios + 1)
```

`totalScenarios` is calculated as NPCs minus final bosses (line 107):
```ts
rooms.reduce((sum, r) => sum + r.npcs.filter((n: any) => !n.isFinalBoss).length, 0);
```

So the win check requires `completedNPCs.size === (non-boss NPCs) + 1`. This
means you need to complete all regular NPCs plus one more (the boss). But if any
NPC lacks a valid `sceneId` or if the boss scene doesn't set `isEnd: true`, the
count won't match and the win screen is unreachable.

### 5.4 Gate state initialization bug on first load

`PrivacyQuestPage.tsx` lines 95-104:
```ts
const [resolvedGates, setResolvedGates] = useState<Set<string>>(() => {
  if (!currentRoomId) return new Set();
  const s = localStorage.getItem(`resolvedGates_${currentRoomId}`);
  return s ? new Set(JSON.parse(s)) : new Set();
});
```

On first load, `currentRoomId` is `null` (line 53: `useState<string | null>(null)`),
so both `resolvedGates` and `unlockedNpcs` initialize as empty Sets. The `useEffect`
on line 120 re-initializes them when `currentRoomId` changes, so this works -- but
the initial state computation is wasted work.

### 5.5 Zone completion happens before dialogue check

`PrivacyQuestPage.tsx` lines 223-227 mark a zone as complete before checking if
a scene exists for it:
```ts
if (!completedZones.has(data.zoneId)) {
  const newZones = new Set(completedZones);
  newZones.add(data.zoneId);
  setCompletedZones(newZones);
}
```

If the zone's `sceneId` doesn't match any scene in `gameData.json`, the zone is
still marked complete (persisted to localStorage), but the toast "Scene Not Found"
fires on line 230-232 and the Phaser scene is resumed. The user can never retry the
zone interaction because it's already marked done.

---

## 6. Security Concerns

### 6.1 All game state in localStorage (client-side only)

All progress data (completed NPCs, scores, collected items) is stored exclusively
in localStorage. There is no server-side validation or persistence. This is fine
for an educational game, but means:
- Progress is lost if the user clears browser data
- Scores can be trivially manipulated via browser DevTools
- Progress doesn't sync across devices

### 6.2 Express error handler rethrows

`server/index.ts` line 47:
```ts
res.status(status).json({ message });
throw err;
```

After sending the error response, it rethrows the error. This will crash the
Node.js process (or at least log an unhandled error). The `throw err` line should
be replaced with logging.

### 6.3 Vite dev server `allowedHosts: true`

`server/vite.ts` line 26:
```ts
allowedHosts: true as const,
```

This disables host checking in development, allowing any hostname. This is a Replit
convention (needed for their proxy), but on local development it's unnecessarily
permissive.

---

## 7. Accessibility Gaps

### 7.1 Only one component has ARIA attributes

`EducationalItemModal.tsx` (lines 22-24) is the only component with `role="dialog"`,
`aria-modal="true"`, and `aria-labelledby`. All other modals and overlays lack
these attributes:
- `TutorialModal.tsx` -- no ARIA
- `RecapModal.tsx` -- no ARIA
- `CodexModal.tsx` -- no ARIA
- `PatientStoryReveal.tsx` -- no ARIA
- `ChoicePrompt.tsx` -- no ARIA
- `ObservationHint.tsx` -- no ARIA
- BreachDefensePage start/gameover/victory screens (inline JSX) -- no ARIA

### 7.2 No focus management in modals

When modals open, keyboard focus is not trapped within them. Users can Tab behind
the modal to interactive elements underneath. When modals close, focus is not
returned to the triggering element.

### 7.3 Color-only state indication

Several UI elements convey meaning through color alone:
- Tower placement validity (green=valid, red=invalid) in BreachDefenseScene.ts
  lines 180-182
- HP bar colors (green/yellow/red) in BreachDefenseScene.ts lines 521-527
- Room status in HallwayHub.tsx (muted=locked, primary=available, green=cleared)
  lines 177-183
- Privacy meter colors in PrivacyMeter.tsx lines 10-14

No text or icon alternative is provided for color-blind users.

### 7.4 Keyboard-only users cannot play BreachDefense

Tower placement in BreachDefense requires mouse interaction (click on grid cells).
There is no keyboard equivalent for:
- Selecting a grid cell for tower placement
- Hovering to see range indicators

### 7.5 No skip-to-content or screen reader announcements

- No `<h1>` or landmark regions on game pages
- No live regions (`aria-live`) for score updates or wave announcements
- Phaser canvas content is completely invisible to screen readers
- The "Press Start 2P" pixel font at 5-8px sizes is extremely difficult to read

### 7.6 Fixed canvas dimensions

All Phaser games render at 640x480 pixels with `Phaser.Scale.FIT`. On mobile
devices, this results in tiny, unusable game areas. There are no responsive
breakpoints, no touch controls, and no mobile-friendly alternatives.

---

## 8. Missing Features for MVP

### 8.1 No audio

Neither game has any sound effects or music. For a game targeting engagement and
learning retention, audio feedback (correct/incorrect sounds, background ambiance,
tower firing, enemy destruction) would significantly improve the experience.

### 8.2 No pause/resume in BreachDefense

The BreachDefense game loop runs continuously once started. There is no pause
button. If the user opens the Codex modal during gameplay, enemies continue
moving and towers continue firing behind the modal.

### 8.3 No save/load between sessions for BreachDefense

PrivacyQuest persists progress to localStorage, but BreachDefense has no
persistence. Refreshing the page during a game loses all progress. There is no
way to resume a game in progress.

### 8.4 No tower sell/upgrade mechanic

Once placed, towers cannot be moved, sold, or upgraded. This is a common tower
defense feature that would add strategic depth.

### 8.5 No onboarding for PrivacyQuest exploration

The exploration scene has no tutorial for new players. The only hint is a tiny
text below the canvas: "WASD or Arrow Keys to move -- SPACE to interact -- ESC to
exit room". There is no in-game walkthrough, no highlighted first interaction, and
no guidance on what to do in each room.

### 8.6 RecapModal concept mismatch

`BreachDefensePage.tsx` line 336:
```tsx
<RecapModal concept={recapConcept as keyof typeof TUTORIAL_CONTENT.recaps} ... />
```

The `concept` prop is cast from the wave's `concept` field (e.g., `"PHISHING"`,
`"PATCHING"`, `"INSIDER"`, `"PHYSICAL"`, `"LAYERS"`, `"PASSWORDS"`, `"ALLDEFENSE"`)
to a key of `TUTORIAL_CONTENT.recaps`. But `recaps` only has 5 keys: `PHISHING`,
`PATCHING`, `INSIDER`, `PHYSICAL`, `ALLDEFENSE`. The concepts `"LAYERS"` and
`"PASSWORDS"` (used by waves 8 and 9) have no recap content. The `RecapModal`
returns `null` when `recap` is undefined (line 13), so those waves silently skip
the recap -- but the "Continue" button is never shown, so `REACT_DISMISS_TUTORIAL`
is never emitted and the game stays paused until the user realizes they need to
close a modal that didn't render.

---

## 9. Architectural Concerns

### 9.1 Monolith page components

`PrivacyQuestPage.tsx` is 512 lines with 15+ state variables, 7 persistence
effects, 4 EventBridge listeners, gate logic, room completion logic, dialogue
management, and rendering for 5 different page modes. This should be decomposed
into custom hooks:
- `usePrivacyQuestPersistence()` -- localStorage read/write
- `useGateSystem()` -- gate resolution logic
- `useRoomCompletion()` -- NPC/zone/item tracking
- `useExplorationBridge()` -- EventBridge listener management

### 9.2 BootScene loads everything for every page

All sprites (14 PNGs + programmatic textures) load on every page, even HubWorld
where none are needed. Phaser supports lazy scene loading -- BreachDefense sprites
should only load when entering `/breach`.

### 9.3 No test infrastructure

The project has zero test files. The `tsconfig.json` excludes `**/*.test.ts`
(line 3), suggesting tests were planned but never written. For an educational
game where correctness of scoring, gate logic, and win conditions matters,
automated tests would prevent regressions.

### 9.4 Server is vestigial

The Express server (`server/index.ts`, `server/routes.ts`, `server/vite.ts`) does
nothing except:
1. Serve Vite dev middleware in development
2. Serve static files in production

It registers zero API routes. The `drizzle.config.ts`, `express` dependency, and
server logging middleware are all dead weight. This could be a pure static site
served by any CDN, or use `vite preview` directly.
