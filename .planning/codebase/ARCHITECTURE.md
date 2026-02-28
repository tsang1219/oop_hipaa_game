# Architecture Overview

## 1. High-Level Pattern: React + Phaser Hybrid

The project is a dual HIPAA educational game built as a **React SPA with embedded Phaser 3 canvas**. React owns routing, UI overlays, state persistence, and educational content presentation. Phaser owns canvas rendering, sprite management, physics, and real-time game loops. The two layers communicate through a singleton **EventBridge** (Phaser EventEmitter).

```
 User
  |
  v
 Express Server (server/index.ts)
  |-- dev: Vite HMR middleware
  |-- prod: static file serving from dist/public/
  |
  v
 React SPA (client/src/main.tsx -> App.tsx)
  |
  |-- wouter Router
  |     |-- /        -> HubWorldPage
  |     |-- /privacy -> PrivacyQuestPage
  |     |-- /breach  -> BreachDefensePage
  |     |-- *        -> NotFound
  |
  |-- <PhaserGame> component (embeds Phaser canvas)
  |     |
  |     v
  |   Phaser.Game (config.ts)
  |     |-- BootScene (asset loading + texture generation)
  |     |-- HubWorldScene (hospital lobby, door navigation)
  |     |-- ExplorationScene (PrivacyQuest room exploration)
  |     |-- BreachDefenseScene (tower defense game loop)
  |
  |-- React Overlay Components (dialogue, HUD, modals)
  |
  |-- EventBridge (bidirectional Phaser <-> React communication)
```

## 2. Layer Diagram

### Entry Points

**Client entry:**
- `client/index.html` -- HTML shell, loads "Press Start 2P" font
- `client/src/main.tsx` -- React root mount on `#root`
- `client/src/App.tsx` -- QueryClientProvider + TooltipProvider + wouter Router

**Server entry:**
- `server/index.ts` -- Express app, registers routes, sets up Vite dev middleware or static serving
- `server/routes.ts` -- Defines API routes (currently empty, returns bare httpServer)
- `server/vite.ts` -- Vite dev server integration + production static file serving

### Build Pipeline

```
Vite 5 (vite.config.ts)
  |- React plugin (@vitejs/plugin-react)
  |- Path aliases: @ -> client/src, @shared -> shared, @assets -> attached_assets
  |- Root: client/
  |- Output: dist/public/
  |
esbuild (for server bundle)
  |- server/index.ts -> dist/index.js
```

## 3. Routing and Page Architecture

Each page is a full-screen React component that may embed a `<PhaserGame>` canvas:

| Route | Page Component | Phaser Scene(s) Used | Description |
|-------|---------------|---------------------|-------------|
| `/` | `HubWorldPage` | HubWorldScene | Hospital lobby hub; player walks to doors, navigates to games |
| `/privacy` | `PrivacyQuestPage` | ExplorationScene | RPG exploration; room picker (HallwayHub) or Phaser canvas + dialogue overlays |
| `/breach` | `BreachDefensePage` | BreachDefenseScene | Tower defense; Phaser canvas + React HUD/tower panel/modals |

Navigation between pages uses **wouter** (`navigate('/privacy')` etc). Within a page, Phaser scenes are swapped using `game.scene.start()`.

## 4. Scene Lifecycle

```
Boot (always first)
  |-- preload(): Load PNG sprites (hospital bg, 6 tower sprites, 8 threat sprites)
  |-- create(): Generate programmatic textures (player directions, NPCs, objects, furniture)
  |              via SpriteFactory.generateAllTextures()
  |-- Then: scene.start('HubWorld')
  |
  v
HubWorld
  |-- Player walks around hospital lobby
  |-- SPACE near door -> eventBridge.emit('hub:select-game', 'privacy-quest' | 'breach-defense')
  |-- React page navigates to /privacy or /breach
  |
  v (route change destroys old Phaser.Game, new one boots)
  |
  +---> ExplorationScene (from PrivacyQuestPage)
  |       |-- init(): Receives room data, completion state
  |       |-- create(): Renders floor, obstacles, NPCs, items, zones, player
  |       |-- update(): Player movement (WASD/arrows + click-to-move BFS), proximity checks
  |       |-- Interactions -> EventBridge -> React overlays (dialogue, modals)
  |       |-- shutdown(): Cleanup event listeners
  |
  +---> BreachDefenseScene (from BreachDefensePage)
          |-- init(): Reset all game state (enemies, towers, projectiles, wave, budget)
          |-- create(): Draw grid, path arrows, set up hover/click handlers, listen to EventBridge
          |-- update(): 7-phase game loop (spawn, move, breach-detect, fire, projectiles, cleanup, broadcast)
          |-- shutdown(): Cleanup event listeners
```

## 5. EventBridge: React <-> Phaser Communication

The EventBridge (`client/src/phaser/EventBridge.ts`) is a **singleton Phaser.Events.EventEmitter** that decouples the two rendering layers.

### Event Flow Pattern

```
PHASER -> REACT (Phaser scene emits, React page listens)
  exploration:interact-npc   -> Opens dialogue overlay (GameContainer)
  exploration:interact-item  -> Opens EducationalItemModal
  exploration:exit-room      -> Returns to HallwayHub
  breach:state-update        -> Updates HUD (score, budget, wave)
  breach:wave-complete       -> Shows RecapModal
  breach:game-over           -> Shows game over screen
  breach:tutorial-trigger    -> Shows TutorialModal
  hub:select-game            -> Navigates to game page

REACT -> PHASER (React component emits, Phaser scene listens)
  react:dialogue-complete    -> Resumes player movement after dialogue
  react:load-room            -> Loads room data into ExplorationScene
  react:select-tower-type    -> Sets selected tower for placement
  react:start-breach-defense -> Starts BreachDefense game state
  react:dismiss-tutorial     -> Resumes wave spawning after tutorial
  react:restart-breach       -> Full game reset
```

### Event Constants

All event names are defined as typed constants in `BRIDGE_EVENTS` (in `EventBridge.ts`) for type safety across the codebase.

## 6. Data Architecture

### PrivacyQuest Data

- **Room definitions** (`client/src/data/roomData.json`): 6 hospital rooms, each with tile dimensions, obstacle layouts, NPC positions, interaction zones, educational items, spawn points, and completion requirements
- **Scene/dialogue data** (`client/src/data/gameData.json`): Dialogue trees with branching choices, scores, and feedback for each NPC encounter
- **Schema** (`shared/schema.ts`): Zod schemas defining Room, NPC, Scene, Choice, Gate, and related types. Used for validation and TypeScript type inference

### BreachDefense Data

- **Constants** (`client/src/game/breach-defense/constants.ts`): 6 tower types (stats, costs, counter relationships), 8 threat types (HP, speed, tags), 10 waves (threat compositions, HIPAA concepts), per-wave budgets, grid/path definitions
- **Tutorial content** (`client/src/game/breach-defense/tutorialContent.ts`): Welcome, firstTower, 5 wave lessons, codex entries (8 threats + 6 towers with real-world examples), 5 recap takeaways
- **Assets map** (`client/src/game/breach-defense/assets.ts`): Import map linking tower/threat IDs to PNG sprite paths

### State Persistence

PrivacyQuestPage persists all progress to **localStorage**:
- `completedRooms`, `completedNPCs`, `completedZones`, `collectedStories`
- `collectedEducationalItems`, `current-privacy-score`, `final-privacy-score`
- `gameStartTime`, per-room gate state (`resolvedGates_${roomId}`, `unlockedNpcs_${roomId}`)

BreachDefensePage keeps state in React only (no persistence between sessions).

## 7. Rendering Architecture

### PrivacyQuest Rendering

**Phaser layer** (ExplorationScene):
- 32px tile grid
- Programmatic pixel sprites generated at boot (SpriteFactory)
- Arcade physics for player movement + wall collisions
- BFS pathfinding for click-to-move
- Tween animations on educational items and interaction zones

**React layer** (PrivacyQuestPage overlays):
- HallwayHub: Room selection grid (pure React, no canvas)
- GameContainer: Full-screen dialogue/battle encounter overlay
- BattleEncounterScreen: RPG-style encounter with typewriter text, choice buttons
- EducationalItemModal, ObservationHint, ChoicePrompt: Context-specific popups
- KnowledgeTracker, ChecklistUI, RoomProgressHUD: HUD elements
- PatientStoryReveal, EndScreen: Narrative and completion screens

### BreachDefense Rendering

**Phaser layer** (BreachDefenseScene):
- 10x6 grid with 64px cells
- PNG sprites for towers (56x56 display) and enemies (48x48 display)
- HP bars as Phaser rectangles (bg + fill)
- Projectiles as Phaser.Arc circles
- Hover indicator + range circle graphics
- 7-phase update loop running every frame

**React layer** (BreachDefensePage overlays):
- HUD bar: Security score bar, budget, wave counter, codex button
- Tower selection panel: 6 tower buttons with lock/cost/select states
- TutorialModal: Educational lesson content at key wave milestones
- RecapModal: Post-wave HIPAA takeaways
- CodexModal: Tabbed encyclopedia of threats and defenses
- Start/GameOver/Victory screens: Full-screen overlays

## 8. Key Abstractions

| Abstraction | File | Responsibility |
|------------|------|----------------|
| `EventBridge` | `client/src/phaser/EventBridge.ts` | Singleton event bus decoupling Phaser and React |
| `PhaserGame` | `client/src/phaser/PhaserGame.tsx` | React component that creates/destroys a Phaser.Game instance |
| `createGameConfig` | `client/src/phaser/config.ts` | Factory for Phaser game config (scenes, physics, pixel art settings) |
| `SpriteFactory` | `client/src/phaser/SpriteFactory.ts` | Programmatic texture generation for NPCs, objects, furniture |
| `GameContainer` | `client/src/components/GameContainer.tsx` | Dialogue engine: scene progression, choice handling, scoring, privacy meter |
| `HallwayHub` | `client/src/components/HallwayHub.tsx` | Room selector UI with unlock/completion state |
| `BattleEncounterScreen` | `client/src/components/BattleEncounterScreen.tsx` | RPG battle-style dialogue presentation |
| Shared schema | `shared/schema.ts` | Zod schemas + TypeScript types for all game data structures |
| Constants | `client/src/game/breach-defense/constants.ts` | All BreachDefense game balance data (towers, threats, waves, budgets) |

## 9. Server Architecture

The server is minimal -- Express serving the Vite-built SPA with no database or API routes:

- `server/index.ts`: Express app with JSON parsing, request logging for `/api/*` routes, error handler
- `server/routes.ts`: Creates bare HTTP server, no API endpoints registered
- `server/vite.ts`: Dev mode uses Vite middleware with HMR; prod mode serves `dist/public/` as static files

Note: `drizzle.config.ts` exists (Drizzle ORM setup for PostgreSQL) but is vestigial -- no database is used. The `shared/schema.ts` file uses Zod (not Drizzle) for data validation.

## 10. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Game engine | Phaser | 3.90+ |
| UI framework | React | 18.3 |
| Language | TypeScript | 5.6 |
| Build tool | Vite | 5.4 |
| CSS | Tailwind CSS | 3.4 |
| Routing | wouter | 3.3 |
| UI primitives | Radix UI (toast, tooltip, slot) | -- |
| Icons | lucide-react | 0.453 |
| Validation | Zod | 3.24 |
| Server | Express | 4.21 |
| Font | Press Start 2P (Google Fonts) | -- |
