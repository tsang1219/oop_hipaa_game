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

All game state is persisted to **`localStorage`** in the browser. There is no server-side persistence.

### PrivacyQuest localStorage Keys

Managed in `client/src/pages/PrivacyQuestPage.tsx`:

| Key | Type | Purpose |
|-----|------|---------|
| `completedRooms` | `string[]` (JSON) | Room IDs the player has fully completed |
| `collectedStories` | `string[]` (JSON) | Room IDs whose patient stories have been revealed |
| `completedNPCs` | `string[]` (JSON) | NPC IDs the player has finished dialogues with |
| `completedZones` | `string[]` (JSON) | Interaction zone IDs the player has visited |
| `collectedEducationalItems` | `string[]` (JSON) | Educational item IDs the player has collected |
| `current-privacy-score` | `string` (number) | Current privacy/trust meter value (0-100) |
| `final-privacy-score` | `string` (number) | Score snapshot for end screen |
| `gameStartTime` | `string` (timestamp) | Session start time for elapsed time display |
| `resolvedGates_{roomId}` | `string[]` (JSON) | Per-room gate IDs that have been resolved |
| `unlockedNpcs_{roomId}` | `string[]` (JSON) | Per-room NPC IDs unlocked via gates |

Managed in `client/src/components/KnowledgeTracker.tsx`:
- Reads `collectedEducationalItems` to display privacy principles learned (polls every 500ms)

Managed in `client/src/components/GameContainer.tsx`:
- Reads/writes `final-privacy-score` and `current-privacy-score` during dialogue encounters

### BreachDefense localStorage Keys

**None.** BreachDefense game state is entirely in-memory React state (`client/src/pages/BreachDefensePage.tsx`). Progress resets when leaving the page. State includes: security score, budget, wave number, selected tower, seen threats/towers, tutorial progression.

### Reset Behavior

PrivacyQuest provides a "Play Again" button that calls `localStorage.clear()` followed by `window.location.reload()`, wiping all persisted state across both games.

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
