# External Integrations

## External APIs

**None.** The application is entirely self-contained with no external API calls. The Express server at `server/routes.ts` registers zero API routes:

```typescript
// server/routes.ts
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  return httpServer;
}
```

The `@tanstack/react-query` client is configured (`client/src/lib/queryClient.ts`) but no components use `useQuery` or `useMutation`. All game data is loaded from static JSON files.

## Database Connections

**None active.** A `drizzle.config.ts` exists referencing PostgreSQL via `DATABASE_URL` environment variable, but:
- No Drizzle ORM package is installed in `package.json`
- No migrations directory exists
- No database queries anywhere in the codebase
- The shared schema (`shared/schema.ts`) uses Zod for runtime validation, not Drizzle table definitions

This is vestigial config from the project template and can be safely ignored.

## Auth Providers

**None.** There is no authentication system. The `queryClient.ts` has a 401 handler pattern (`on401: "throw"`) that is boilerplate from the template but never triggered since no API calls are made.

## Asset Loading

Assets are loaded through two distinct mechanisms depending on the game:

### BreachDefense -- PNG Sprites via Phaser Preloader

Tower and threat sprites are PNG images loaded in `client/src/phaser/scenes/BootScene.ts` using Phaser's built-in asset loader:

```typescript
// BootScene.ts preload()
this.load.image('tower_MFA', '/attached_assets/generated_images/mfa_tower_pixel_sprite.png');
this.load.image('tower_PATCH', '/attached_assets/generated_images/patch_cannon_pixel_sprite.png');
// ... 6 towers + 8 threats + 1 background = 15 PNG assets
```

These are served from `attached_assets/generated_images/` as static files. The same PNGs are also imported via Vite module system in `client/src/game/breach-defense/assets.ts` using the `@assets` path alias for use in React components:

```typescript
// assets.ts
import firewallTower from '@assets/generated_images/firewall_tower_pixel_sprite.png';
```

Full list of PNG assets (20 files in `attached_assets/generated_images/`):

**Tower sprites (6):**
- `mfa_tower_pixel_sprite.png`
- `patch_cannon_pixel_sprite.png`
- `firewall_tower_pixel_sprite.png`
- `encryption_tower_pixel_sprite.png`
- `training_beacon_tower_sprite.png`
- `access_control_gate_sprite.png`

**Threat sprites (8):**
- `phishing_threat_pixel_sprite.png`
- `credential_harvester_enemy_sprite.png`
- `ransomware_threat_pixel_sprite.png`
- `insider_threat_pixel_sprite.png`
- `zero-day_exploit_enemy_sprite.png`
- `brute_force_bot_enemy_sprite.png`
- `device_thief_enemy_sprite.png`
- `social_engineer_enemy_sprite.png`

**Backgrounds/portraits (2):**
- `Hospital_corridor_pixel_background_72c96c5f.png`
- `Nurse_Nina_pixel_portrait_6f9bfea3.png`

**Reference sheets (not loaded by game, 4):**
- `pixel_art_environment_tiles:_server_rack,_workstation,_network_cables.png`
- `pixel_art_icons_for_cyber_threats:_envelope,_skull,_badge,_cracked_shield.png`
- `pixel_art_icons_for_security_towers:_padlock,_firewall,_shield,_cannon.png`
- `vulnerability_threat_pixel_sprite.png`

### PrivacyQuest -- Programmatic Textures

PrivacyQuest does not use PNG sprites. All character and object textures are generated programmatically at runtime using Phaser's Graphics API:

- **`client/src/phaser/scenes/BootScene.ts`** -- generates player directional sprites (`player_down`, `player_up`, `player_left`, `player_right`) and base NPC textures (`npc_receptionist`, `npc_it_tech`)
- **`client/src/phaser/SpriteFactory.ts`** -- generates all additional NPC textures (9 character styles: nurse, doctor, boss, staff, patient, visitor, officer, etc.), object textures (posters, manuals, computers, whiteboards), and furniture textures

All textures are 32x32 pixel art drawn with `fillRect()` calls and registered via `graphics.generateTexture()`.

### Game Data -- Static JSON

Game content is embedded as JSON files imported directly by React components:

- **`client/src/data/gameData.json`** -- dialogue scenes (NPC conversations, choices, scores, feedback)
- **`client/src/data/roomData.json`** -- room layouts (dimensions, obstacles, NPC positions, interaction zones, educational items, spawn points, gate definitions)

These are validated at the type level against Zod schemas defined in `shared/schema.ts`.

### Educational Content -- TypeScript Constants

BreachDefense educational content is defined as TypeScript objects:

- **`client/src/game/breach-defense/constants.ts`** -- tower definitions (6 types with stats, counters, descriptions), threat definitions (8 types), wave compositions (10 waves), grid paths
- **`client/src/game/breach-defense/tutorialContent.ts`** -- HIPAA tutorial text, wave introductions, post-wave recap content, codex entries

### Google Fonts

One external font is loaded from Google Fonts CDN in `client/index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

This is the only external network dependency at runtime.

## State Persistence

All game state is persisted to **`localStorage`** in the browser under a single versioned key. There is no server-side persistence.

### V2 Save Schema (`pq:save:v2`)

Phase 11 consolidated 14+ fragmented V1 localStorage keys into a single JSON object. All read/write goes through `client/src/lib/saveData.ts`:

| Function | Purpose |
|----------|---------|
| `loadSave(): SaveDataV2` | Read and parse `pq:save:v2` from localStorage (returns defaults if absent) |
| `writeSave(data: SaveDataV2)` | Atomically replace `pq:save:v2` |
| `migrateV1toV2(roomIds)` | One-time migration: reads old V1 keys, writes `pq:save:v2`, clears old keys. Idempotent. |

**SaveDataV2 fields** (managed by `useGameState` hook in `client/src/hooks/useGameState.ts`):

| Field | Type | Purpose |
|-------|------|---------|
| `completedRooms` | `string[]` | Room IDs fully completed |
| `completedNPCs` | `string[]` | NPC IDs with finished dialogues |
| `completedZones` | `string[]` | Interaction zone IDs visited |
| `collectedItems` | `string[]` | Educational item IDs collected |
| `collectedStories` | `string[]` | Patient story room IDs revealed |
| `privacyScore` | `number` | Compliance knowledge score (0-100) |
| `currentRoomId` | `string \| null` | Last room for resume |
| `currentAct` | `1 \| 2 \| 3` | Current narrative act |
| `act1Complete` | `boolean` | Act 1 completion flag |
| `act2Complete` | `boolean` | Act 2 completion flag |
| `actFlags` | `Record<string, boolean>` | Narrative decision flags |
| `decisions` | `DecisionState` | Player choice memory for NPC variant dialogue |
| `encounterResults` | `Record<string, { completed, score, outcome }>` | BreachDefense encounter results |
| `unifiedScore` | `number` | Combined score across all encounter types |
| `gameStartTime` | `number` | Session start timestamp |

### BreachDefense State

BreachDefense encounter state is in-memory only (managed by `BreachDefenseScene`). Encounter results are written back to `pq:save:v2.encounterResults` when the encounter completes.

### Reset Behavior

"Play Again" clears only `pq:save:v2` (not all localStorage).

### QA Test Parameters

URL parameters for test automation (checked in `UnifiedGamePage.tsx`):

| Parameter | Effect |
|-----------|--------|
| `?qa-no-save` | Prevents localStorage writes during the session (clean test state). Only clears on first render, not every render. |
| `?qa-room=reception` | Auto-navigates to a specific room on load (bypasses normal progression) |
| `?qa-skip-onboarding` | Skips the intro/onboarding modal |

## React-Phaser Communication

The bridge between React and Phaser is a singleton EventEmitter defined in `client/src/phaser/EventBridge.ts`:

```typescript
class EventBridge extends Phaser.Events.EventEmitter {
  private static instance: EventBridge;
  static getInstance(): EventBridge { /* singleton */ }
}
export const eventBridge = EventBridge.getInstance();
```

### Event Flow: Phaser -> React

| Event | Payload | Trigger |
|-------|---------|---------|
| `scene:ready` | `sceneKey: string` | Scene finishes loading |
| `hub:select-game` | `gameId: string` | Player walks to door in hub |
| `exploration:interact-npc` | `{ npcId, npcName, sceneId, isFinalBoss }` | Player interacts with NPC |
| `exploration:interact-zone` | `{ zoneId, zoneName, sceneId }` | Player interacts with zone |
| `exploration:interact-item` | `{ itemId, title, fact, type }` | Player interacts with educational item |
| `exploration:exit-room` | none | Player presses ESC |
| `breach:state-update` | `{ securityScore, budget, wave, ... }` | Every frame update |
| `breach:wave-complete` | `{ wave, concept }` | Wave ends |
| `breach:game-over` | `{ wavesCompleted, towersPlaced }` | Security hits 0 |
| `breach:victory` | `{ securityScore, wavesCompleted, towersPlaced }` | All 10 waves beaten |
| `breach:tower-placed` | `{ type, cost, newBudget }` | Tower placed on grid |
| `breach:tutorial-trigger` | `{ tutorialKey }` | Tutorial checkpoint reached |

### Event Flow: React -> Phaser

| Event | Payload | Trigger |
|-------|---------|---------|
| `react:dialogue-complete` | none | Dialogue modal closed |
| `react:load-room` | room data object | Room selected from hub |
| `react:place-tower` | `{ type, x, y }` | Tower placement click |
| `react:start-breach-defense` | none | Start button clicked |
| `react:select-tower-type` | `{ type }` | Tower panel selection |
| `react:dismiss-tutorial` | none | Tutorial modal dismissed |
| `react:restart-breach` | none | Restart button clicked |
| `react:return-to-hub` | none | Back button clicked |

## Phaser Game Configuration

Defined in `client/src/phaser/config.ts`:

- **Renderer**: `Phaser.AUTO` (WebGL with Canvas fallback)
- **Physics**: Arcade (zero gravity, used for PrivacyQuest movement)
- **Scale**: `Phaser.Scale.FIT` with `CENTER_BOTH`
- **Resolution**: 640x480 default
- **Pixel art**: `pixelArt: true`, `roundPixels: true`, `antialias: false`
- **Scenes**: `[BootScene, HubWorldScene, ExplorationScene, BreachDefenseScene]`

## Network Requests

The only network activity at runtime:
1. **Google Fonts CDN** -- "Press Start 2P" font loaded from `fonts.googleapis.com`
2. **Static asset serving** -- PNG sprites served from Express static files (same origin)
3. **Vite HMR WebSocket** -- development only

No XHR/fetch calls are made to any API endpoint. The `queryClient.ts` fetch wrapper exists but is never invoked.
