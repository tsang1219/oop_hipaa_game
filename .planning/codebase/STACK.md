# Technology Stack

## Languages and Runtime

- **TypeScript** 5.6.3 -- used throughout (client, server, shared schemas)
- **Node.js** (version unspecified; `@types/node` 20.16.11 implies Node 20.x target)
- **ES Modules** -- `"type": "module"` in `package.json`; all files use ESM import/export

## Frameworks

### Client
- **React** 18.3.1 -- UI layer, dialogue overlays, HUD panels, modals, menus
- **Phaser** 3.90.0+ -- game engine for canvas rendering, physics, sprite management, scene lifecycle

### Server
- **Express** 4.21.2 -- minimal HTTP server; serves API routes and Vite dev middleware

### Routing
- **wouter** 3.3.5 -- lightweight React router (no react-router dependency)

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `phaser` | ^3.90.0 | Game engine: canvas rendering, arcade physics, sprite/texture management, scene system |
| `react` / `react-dom` | ^18.3.1 | UI framework for overlays, modals, HUD, dialogue system |
| `wouter` | ^3.3.5 | Client-side routing (`/`, `/privacy`, `/breach`) |
| `@tanstack/react-query` | ^5.60.5 | Data fetching/caching client (configured but minimally used -- no active API queries) |
| `zod` | ^3.24.2 | Runtime schema validation for game data types (`shared/schema.ts`) |
| `@radix-ui/react-toast` | ^1.2.7 | Toast notification primitives |
| `@radix-ui/react-tooltip` | ^1.2.0 | Tooltip primitives |
| `@radix-ui/react-slot` | ^1.2.0 | Slot composition primitive (used by Button component) |
| `lucide-react` | ^0.453.0 | Icon library (Shield, Heart, BookOpen, ArrowLeft, etc.) |
| `class-variance-authority` | ^0.7.1 | Variant-based component styling (Button variants) |
| `clsx` | ^2.1.1 | Conditional className utility |
| `tailwind-merge` | ^2.6.0 | Tailwind class deduplication (used in `cn()` helper) |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities for Tailwind (accordion, toast transitions) |
| `nanoid` | ^5.1.6 | Unique ID generation (used in dev server for cache-busting) |
| `express` | ^4.21.2 | HTTP server framework |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^5.4.20 | Dev server with HMR + production bundler |
| `@vitejs/plugin-react` | ^4.7.0 | React Fast Refresh + JSX transform for Vite |
| `esbuild` | ^0.25.0 | Server-side TypeScript bundling for production |
| `tsx` | ^4.20.5 | TypeScript execution for dev server (`tsx server/index.ts`) |
| `typescript` | 5.6.3 | Type checking (via `tsc --noEmit`) |
| `tailwindcss` | ^3.4.17 | Utility-first CSS framework |
| `@tailwindcss/typography` | ^0.5.15 | Prose styling plugin |
| `@tailwindcss/vite` | ^4.1.3 | Tailwind Vite integration (listed but PostCSS config is the active path) |
| `postcss` | ^8.4.47 | CSS processing pipeline |
| `autoprefixer` | ^10.4.20 | Vendor prefix automation |

### Optional Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `bufferutil` | ^4.0.8 | Native WebSocket buffer handling (optional perf optimization) |

### Vestigial / Unused

- **drizzle-kit** -- `drizzle.config.ts` exists and references `DATABASE_URL` + PostgreSQL, but no database is provisioned, no Drizzle ORM package is in `package.json`, and no migrations directory exists. This is leftover from a template.
- **@tanstack/react-query** -- configured in `client/src/lib/queryClient.ts` but no components use `useQuery` or `useMutation`. The game is entirely client-side with static JSON data.

## Build Tooling

### Development
- `npm run dev` runs `NODE_ENV=development tsx server/index.ts`
- Express server starts on port 5000 (or `$PORT`)
- Vite dev server is attached as middleware (`server/vite.ts`) with HMR over the same HTTP server
- No separate Vite dev server -- everything runs through Express

### Production Build
- `npm run build` runs two steps:
  1. `vite build` -- bundles client to `dist/public/`
  2. `esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` -- bundles server to `dist/index.js`
- `npm start` runs `NODE_ENV=production node dist/index.js`

### Type Checking
- `npm run check` runs `tsc` (noEmit mode, incremental)

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, ESM module type |
| `tsconfig.json` | TypeScript config: strict mode, bundler moduleResolution, path aliases (`@/*`, `@shared/*`), noEmit |
| `vite.config.ts` | Vite bundler: React plugin, path aliases (`@/`, `@shared/`, `@assets/`), root=`client/`, output=`dist/public/` |
| `tailwind.config.ts` | Tailwind CSS: dark mode, custom colors (game-specific HSL vars), font families, animation keyframes, plugins |
| `postcss.config.js` | PostCSS: tailwindcss + autoprefixer pipeline |
| `drizzle.config.ts` | Vestigial Drizzle ORM config (PostgreSQL) -- not actively used |
| `client/index.html` | HTML entry point: loads Google Fonts ("Press Start 2P"), mounts React at `#root` |

## Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:

| Alias | Resolves To |
|-------|-------------|
| `@/*` | `client/src/*` |
| `@shared/*` | `shared/*` |
| `@assets/*` | `attached_assets/*` (Vite only) |

## Development Workflow

```bash
# Install dependencies
npm install

# Start dev server (Express + Vite HMR on port 5000)
npm run dev

# Type check
npm run check

# Production build
npm run build

# Start production server
npm start
```

## Project Directory Structure

```
PrivacyQuest/
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  drizzle.config.ts          # vestigial
  client/
    index.html               # HTML entry, Google Fonts
    src/
      main.tsx               # React root mount
      App.tsx                 # Router (wouter Switch)
      index.css              # Tailwind base styles
      lib/
        queryClient.ts       # TanStack Query client (unused)
        utils.ts             # cn() className helper
      hooks/
        use-toast.ts         # Toast hook
      data/
        gameData.json        # PrivacyQuest dialogue scenes
        roomData.json        # PrivacyQuest room definitions
      pages/
        HubWorldPage.tsx     # Hub world wrapper
        PrivacyQuestPage.tsx # Privacy RPG wrapper
        BreachDefensePage.tsx # Tower defense wrapper
        not-found.tsx        # 404 page
      phaser/
        config.ts            # Phaser game config (scenes, physics, scale)
        PhaserGame.tsx       # React<->Phaser bridge component
        EventBridge.ts       # Singleton event emitter
        SpriteFactory.ts     # Programmatic pixel art textures
        scenes/
          BootScene.ts       # Asset loading + texture generation
          HubWorldScene.ts   # Hospital lobby scene
          ExplorationScene.ts # PrivacyQuest room exploration
          BreachDefenseScene.ts # Tower defense game loop
      game/
        breach-defense/
          constants.ts       # Towers, threats, waves, paths, grid config
          assets.ts          # PNG sprite imports for BreachDefense
          tutorialContent.ts # HIPAA educational content
      components/
        ui/                  # Radix-based primitives (button, card, toast, tooltip)
        breach-defense/      # TutorialModal, RecapModal, CodexModal
        GameContainer.tsx    # Dialogue/choice engine
        HallwayHub.tsx       # Room selection menu
        PrivacyMeter.tsx     # Trust/privacy score display
        BattleEncounterScreen.tsx # RPG-style encounter UI
        (12 more components) # Various game UI elements
  shared/
    schema.ts                # Zod schemas + TypeScript types
  server/
    index.ts                 # Express app bootstrap
    routes.ts                # Route registration (no API routes defined)
    vite.ts                  # Vite dev middleware setup
  attached_assets/
    generated_images/        # 20 PNG sprites (towers, threats, backgrounds)
  dist/                      # Build output (not committed)
```
