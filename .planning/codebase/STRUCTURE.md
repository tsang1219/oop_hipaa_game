# Directory Structure and File Reference

## Complete Directory Layout

```
PrivacyQuest/
|
|-- client/                          # Frontend application (Vite root)
|   |-- index.html                   # HTML entry point (loads Press Start 2P font, mounts #root)
|   |-- src/
|       |-- main.tsx                 # React entry: createRoot, renders <App />
|       |-- App.tsx                  # Top-level: QueryClient, TooltipProvider, wouter Router
|       |-- index.css                # Global CSS (Tailwind imports, CSS variables, game theme)
|       |
|       |-- pages/                   # Route-level page components (one per route)
|       |   |-- HubWorldPage.tsx     # /  -- Phaser HubWorldScene + navigation listeners
|       |   |-- PrivacyQuestPage.tsx # /privacy -- HallwayHub room picker OR Phaser ExplorationScene + overlays
|       |   |-- BreachDefensePage.tsx# /breach  -- Phaser BreachDefenseScene + HUD + tower panel + modals
|       |   |-- not-found.tsx        # Catch-all 404 page
|       |
|       |-- phaser/                  # Phaser engine integration layer
|       |   |-- config.ts            # createGameConfig(): Phaser config factory (scenes, physics, pixel art)
|       |   |-- PhaserGame.tsx       # React component: creates/destroys Phaser.Game, exposes ref
|       |   |-- EventBridge.ts       # Singleton EventEmitter + BRIDGE_EVENTS constant map
|       |   |-- SpriteFactory.ts     # Programmatic texture generation (NPCs, objects, furniture)
|       |   |-- scenes/
|       |       |-- BootScene.ts     # Asset preloading (PNGs) + texture generation + starts HubWorld
|       |       |-- HubWorldScene.ts # Hospital lobby: player movement, door proximity, game selection
|       |       |-- ExplorationScene.ts # PrivacyQuest: room rendering, WASD + BFS pathfinding, NPC interaction
|       |       |-- BreachDefenseScene.ts # Tower defense: grid, spawning, movement, targeting, projectiles, waves
|       |
|       |-- components/              # Reusable React UI components
|       |   |-- GameContainer.tsx    # Dialogue engine: scene progression, choices, scoring, privacy meter
|       |   |-- BattleEncounterScreen.tsx # RPG battle overlay: sprites, typewriter text, choice menu, feedback
|       |   |-- HallwayHub.tsx       # Room selector grid with lock/clear states, patient stories, trust meter
|       |   |-- EndScreen.tsx        # Win/lose screen with stats (PrivacyQuest)
|       |   |-- PrivacyMeter.tsx     # Community Trust bar (used in dialogue overlay)
|       |   |-- SceneCounter.tsx     # "Scene X of Y" indicator
|       |   |-- CharacterPortrait.tsx# NPC portrait image display
|       |   |-- NPCSprite.tsx        # Pixel art NPC sprite (canvas-drawn React component)
|       |   |-- PlayerBackSprite.tsx  # Player back-view sprite for battle screen
|       |   |-- EducationalItemModal.tsx # Modal for reading posters/manuals/computers/whiteboards
|       |   |-- ObservationHint.tsx  # "You notice something..." popup for observation gates
|       |   |-- ChoicePrompt.tsx     # Binary choice popup for choice gates
|       |   |-- PatientStoryReveal.tsx # Room completion reward: patient story narrative
|       |   |-- KnowledgeTracker.tsx # Privacy principles progress (4 icons)
|       |   |-- ChecklistUI.tsx      # Items/NPCs completion counters
|       |   |-- RoomProgressHUD.tsx  # Per-room progress overlay (NPCs, zones, items)
|       |   |
|       |   |-- breach-defense/      # BreachDefense-specific React modals
|       |   |   |-- TutorialModal.tsx# Educational lesson display (pre-wave)
|       |   |   |-- RecapModal.tsx   # Post-wave HIPAA takeaway
|       |   |   |-- CodexModal.tsx   # Tabbed encyclopedia (threats + defenses)
|       |   |
|       |   |-- ui/                  # Shadcn/ui primitives (auto-generated)
|       |       |-- button.tsx       # Button component (CVA variants)
|       |       |-- card.tsx         # Card layout component
|       |       |-- toast.tsx        # Toast notification component
|       |       |-- toaster.tsx      # Toast container/provider
|       |       |-- tooltip.tsx      # Tooltip component (Radix)
|       |
|       |-- game/                    # Game-specific data and logic modules
|       |   |-- breach-defense/
|       |       |-- constants.ts     # All game data: 6 towers, 8 threats, 10 waves, paths, budgets
|       |       |-- tutorialContent.ts # Educational text: welcome, lessons, codex entries, recaps
|       |       |-- assets.ts        # Import map: tower/threat IDs -> PNG sprite paths
|       |
|       |-- data/                    # Static JSON data files
|       |   |-- gameData.json        # PrivacyQuest dialogue trees (scenes with choices/scores)
|       |   |-- roomData.json        # PrivacyQuest room definitions (6 rooms with layouts/NPCs/items)
|       |
|       |-- hooks/                   # Custom React hooks
|       |   |-- use-toast.ts         # Toast notification hook (Radix-based)
|       |
|       |-- lib/                     # Shared utility modules
|           |-- queryClient.ts       # TanStack Query client configuration + apiRequest helper
|           |-- utils.ts             # cn() utility (clsx + tailwind-merge)
|
|-- server/                          # Express backend
|   |-- index.ts                     # App entry: Express setup, middleware, error handling, listen
|   |-- routes.ts                    # API route registration (currently empty -- no endpoints)
|   |-- vite.ts                      # Dev: Vite middleware + HMR; Prod: static file serving
|
|-- shared/                          # Code shared between client and server
|   |-- schema.ts                    # Zod schemas + TypeScript types (Room, NPC, Scene, Gate, etc.)
|
|-- attached_assets/                 # Design documents + image assets
|   |-- generated_images/            # Pixel art PNGs (towers, threats, backgrounds, portraits)
|   |-- *.md, *.txt, *.png           # PRD documents, design specs, reference images
|
|-- .planning/                       # Project planning documents
|   |-- codebase/
|       |-- ARCHITECTURE.md          # This project's architecture documentation
|       |-- STRUCTURE.md             # This file
|
|-- Configuration files (root)
|   |-- package.json                 # Dependencies, scripts (dev/build/start/check)
|   |-- tsconfig.json                # TypeScript config (path aliases, bundler resolution)
|   |-- vite.config.ts               # Vite config (React plugin, path aliases, client root)
|   |-- tailwind.config.ts           # Tailwind config (game colors, custom theme)
|   |-- postcss.config.js            # PostCSS config (Tailwind + autoprefixer)
|   |-- drizzle.config.ts            # Drizzle ORM config (vestigial -- not used)
|   |-- components.json              # Shadcn/ui component configuration
|   |-- .gitignore                   # Git ignore rules
|   |-- .replit                      # Replit configuration
|   |-- ROADMAP.md                   # Development roadmap
|   |-- design_guidelines.md         # Visual/UX design guidelines
|   |-- replit.md                    # Replit-specific project notes
```

## Key File Locations by Purpose

### Entry Points
| Purpose | File |
|---------|------|
| HTML shell | `client/index.html` |
| React mount | `client/src/main.tsx` |
| App root + routing | `client/src/App.tsx` |
| Server start | `server/index.ts` |

### Phaser Integration
| Purpose | File |
|---------|------|
| Game config factory | `client/src/phaser/config.ts` |
| React-Phaser bridge component | `client/src/phaser/PhaserGame.tsx` |
| Event bus singleton | `client/src/phaser/EventBridge.ts` |
| Sprite texture generator | `client/src/phaser/SpriteFactory.ts` |

### Phaser Scenes
| Scene | File | Key |
|-------|------|-----|
| Boot (asset loading) | `client/src/phaser/scenes/BootScene.ts` | `'Boot'` |
| Hub World (lobby) | `client/src/phaser/scenes/HubWorldScene.ts` | `'HubWorld'` |
| Exploration (PrivacyQuest) | `client/src/phaser/scenes/ExplorationScene.ts` | `'Exploration'` |
| Breach Defense (tower defense) | `client/src/phaser/scenes/BreachDefenseScene.ts` | `'BreachDefense'` |

### Page Components (one per route)
| Route | File |
|-------|------|
| `/` | `client/src/pages/HubWorldPage.tsx` |
| `/privacy` | `client/src/pages/PrivacyQuestPage.tsx` |
| `/breach` | `client/src/pages/BreachDefensePage.tsx` |
| 404 | `client/src/pages/not-found.tsx` |

### PrivacyQuest Components
| Component | File | Used By |
|-----------|------|---------|
| Dialogue engine | `client/src/components/GameContainer.tsx` | PrivacyQuestPage |
| Battle encounter UI | `client/src/components/BattleEncounterScreen.tsx` | GameContainer |
| Room selector | `client/src/components/HallwayHub.tsx` | PrivacyQuestPage |
| Privacy trust bar | `client/src/components/PrivacyMeter.tsx` | GameContainer |
| Scene counter | `client/src/components/SceneCounter.tsx` | GameContainer |
| Character portrait | `client/src/components/CharacterPortrait.tsx` | GameContainer |
| NPC pixel sprite | `client/src/components/NPCSprite.tsx` | BattleEncounterScreen |
| Player back sprite | `client/src/components/PlayerBackSprite.tsx` | BattleEncounterScreen |
| Educational item popup | `client/src/components/EducationalItemModal.tsx` | PrivacyQuestPage |
| Observation gate hint | `client/src/components/ObservationHint.tsx` | PrivacyQuestPage |
| Choice gate prompt | `client/src/components/ChoicePrompt.tsx` | PrivacyQuestPage |
| Story reveal screen | `client/src/components/PatientStoryReveal.tsx` | PrivacyQuestPage |
| Knowledge tracker | `client/src/components/KnowledgeTracker.tsx` | PrivacyQuestPage |
| Progress checklist | `client/src/components/ChecklistUI.tsx` | PrivacyQuestPage |
| Room progress HUD | `client/src/components/RoomProgressHUD.tsx` | PrivacyQuestPage |
| End screen (win/lose) | `client/src/components/EndScreen.tsx` | PrivacyQuestPage |

### BreachDefense Components
| Component | File | Used By |
|-----------|------|---------|
| Tutorial lesson modal | `client/src/components/breach-defense/TutorialModal.tsx` | BreachDefensePage |
| Post-wave recap | `client/src/components/breach-defense/RecapModal.tsx` | BreachDefensePage |
| Threat/defense encyclopedia | `client/src/components/breach-defense/CodexModal.tsx` | BreachDefensePage |

### Game Data
| Data | File | Format |
|------|------|--------|
| Room layouts + NPCs + items | `client/src/data/roomData.json` | JSON (6 rooms) |
| Dialogue scenes + choices | `client/src/data/gameData.json` | JSON (branching dialogue trees) |
| Tower/threat/wave balance | `client/src/game/breach-defense/constants.ts` | TypeScript objects |
| Educational text content | `client/src/game/breach-defense/tutorialContent.ts` | TypeScript objects |
| Sprite asset imports | `client/src/game/breach-defense/assets.ts` | TypeScript imports |

### Shared Types
| Purpose | File |
|---------|------|
| All game data types (Zod + TS) | `shared/schema.ts` |

### Sprite Assets (PNG)
| Category | Directory |
|----------|-----------|
| Tower sprites (6) | `attached_assets/generated_images/*_tower_*.png` or `*_sprite.png` |
| Threat sprites (8) | `attached_assets/generated_images/*_enemy_sprite.png` or `*_threat_*.png` |
| Background images | `attached_assets/generated_images/Hospital_corridor_*.png` |
| Character portraits | `attached_assets/generated_images/Nurse_Nina_*.png` |

### UI Primitives (Shadcn/ui)
| Component | File |
|-----------|------|
| Button | `client/src/components/ui/button.tsx` |
| Card | `client/src/components/ui/card.tsx` |
| Toast | `client/src/components/ui/toast.tsx` |
| Toaster | `client/src/components/ui/toaster.tsx` |
| Tooltip | `client/src/components/ui/tooltip.tsx` |

## Naming Conventions

### Files
- **Pages**: PascalCase with `Page` suffix -- `HubWorldPage.tsx`, `BreachDefensePage.tsx`
- **Components**: PascalCase -- `GameContainer.tsx`, `BattleEncounterScreen.tsx`
- **Phaser scenes**: PascalCase with `Scene` suffix -- `BootScene.ts`, `ExplorationScene.ts`
- **Data/config**: camelCase -- `constants.ts`, `tutorialContent.ts`, `gameData.json`
- **Hooks**: kebab-case with `use-` prefix -- `use-toast.ts`
- **Utilities**: camelCase -- `queryClient.ts`, `utils.ts`

### Phaser Texture Keys
- **Player**: `player_down`, `player_up`, `player_left`, `player_right`
- **NPCs**: `npc_receptionist`, `npc_nurse`, `npc_doctor`, `npc_it_tech`, `npc_boss`, `npc_staff`, `npc_patient`, `npc_visitor`, `npc_officer`
- **Objects**: `obj_poster`, `obj_manual`, `obj_computer`, `obj_whiteboard`
- **Furniture**: `furn_desk`, `furn_bed`, `furn_cabinet`, `furn_table`, `furn_counter`, `furn_rack`, `furn_shelf`, `furn_chair`, `furn_plant`
- **Towers**: `tower_MFA`, `tower_PATCH`, `tower_FIREWALL`, `tower_ENCRYPTION`, `tower_TRAINING`, `tower_ACCESS`
- **Threats**: `threat_PHISHING`, `threat_CREDENTIAL`, `threat_RANSOMWARE`, `threat_INSIDER`, `threat_ZERODAY`, `threat_BRUTEFORCE`, `threat_DEVICETHIEF`, `threat_SOCIAL`

### EventBridge Events
- **Phaser -> React**: `{domain}:{action}` -- `exploration:interact-npc`, `breach:state-update`
- **React -> Phaser**: `react:{action}` -- `react:dialogue-complete`, `react:place-tower`

### CSS/Styling
- Game colors defined in `tailwind.config.ts` under `theme.extend.colors.game`
- Primary accent: `#FF6B9D` (pink), success: `#2ECC71` (green)
- Dark background: `#1a1a2e`, card: `#16213e`, panel: `#2a2a3e`
- All game text uses `fontFamily: '"Press Start 2P"'` (pixel font)

## Where to Add New Files

### New Phaser scene
1. Create `client/src/phaser/scenes/YourScene.ts`
2. Register in `client/src/phaser/config.ts` scene array
3. Add any new events to `BRIDGE_EVENTS` in `client/src/phaser/EventBridge.ts`

### New page/route
1. Create `client/src/pages/YourPage.tsx`
2. Add route in `client/src/App.tsx` Router component

### New React component
- **PrivacyQuest-specific**: `client/src/components/YourComponent.tsx`
- **BreachDefense-specific**: `client/src/components/breach-defense/YourComponent.tsx`
- **Shared UI primitive**: `client/src/components/ui/your-component.tsx`

### New game data
- **PrivacyQuest room/dialogue**: Edit `client/src/data/roomData.json` or `client/src/data/gameData.json`
- **BreachDefense balance**: Edit `client/src/game/breach-defense/constants.ts`
- **Educational content**: Edit `client/src/game/breach-defense/tutorialContent.ts`

### New shared types
- Add Zod schema + TypeScript type to `shared/schema.ts`

### New sprite assets
- Place PNG files in `attached_assets/generated_images/`
- Register preload in `client/src/phaser/scenes/BootScene.ts` preload()
- For BreachDefense: also add import to `client/src/game/breach-defense/assets.ts`

### New programmatic textures
- Add generation function to `client/src/phaser/SpriteFactory.ts`
- Call from `generateAllTextures()` or specific scene's create()

### New API endpoint
- Add route handler in `server/routes.ts`
- Path prefix: `/api/your-endpoint`

### New React hook
- Create `client/src/hooks/use-your-hook.ts`

### New utility function
- Add to `client/src/lib/utils.ts` (general) or create new file in `client/src/lib/`

## File Counts by Directory

| Directory | Files | Description |
|-----------|-------|-------------|
| `client/src/pages/` | 4 | Route page components |
| `client/src/phaser/scenes/` | 4 | Phaser game scenes |
| `client/src/phaser/` | 4 | Phaser integration (config, game, bridge, sprites) |
| `client/src/components/` | 16 | React game components |
| `client/src/components/breach-defense/` | 3 | BreachDefense modals |
| `client/src/components/ui/` | 5 | Shadcn/ui primitives |
| `client/src/game/breach-defense/` | 3 | BreachDefense data/logic |
| `client/src/data/` | 2 | Static JSON game data |
| `client/src/hooks/` | 1 | Custom hooks |
| `client/src/lib/` | 2 | Utility modules |
| `server/` | 3 | Express server files |
| `shared/` | 1 | Shared schema |
| Root config | 8 | Build/tool configuration |
