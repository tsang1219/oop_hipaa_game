# File Catalog — Live Source

A one-line index of every live source file under `client/src/`, `server/`, and `shared/` after the dead-code cleanup that moved 16 unused files to `_trash/`. **63 files documented.** Use this as a "where do I look?" reference: skim the section for the directory you need, find the file by name, read the description, then open the file. Tags are a coarse filter — `#ui` for React components, `#phaser-scene`/`#phaser-system` for canvas-side code, `#data` for content/constants, `#bridge` for React↔Phaser glue, `#hook`/`#util`/`#config`/`#type`, plus `#server`, `#shared`, `#test`, `#dev` for non-client code.

---

## [client/src/](../client/src/)

- **`App.tsx`** (37) — Root React tree: wires QueryClient, Tooltip/Notification providers, Toaster, and the wouter `Router` with a single `/` route to `UnifiedGamePage`. Tags: #ui #config
- **`main.tsx`** (8) — Vite entry; initializes the QA bridge, then mounts `<App />` into `#root`. Tags: #ui #config

### [client/src/components/](../client/src/components/)

- **`BattleEncounterScreen.tsx`** (339) — Pokemon-style three-phase NPC encounter UI (dialogue → choices → feedback) with portrait, health-bar privacy score, and bridge-driven SFX. Tags: #ui
- **`CertificateOverlay.tsx`** (350) — Phase 21 demo capstone: dim → silent beat → fanfare → end-NPC dialogue → certificate reveal with sponsor name and copy-to-clipboard redemption code. Tags: #ui
- **`CharacterPortrait.tsx`** (27) — Tiny presentational wrapper that renders a pixelated 48×48 character portrait image with a game-border frame. Tags: #ui
- **`ChoicePrompt.tsx`** (111) — Modal for `choice`-type gates: presents two options with keyboard nav and emits the unlocked target id when chosen. Tags: #ui
- **`EducationalItemModal.tsx`** (89) — Pop-up shown when the player interacts with a poster/manual/computer/whiteboard item; renders a title, fact, and emoji. Tags: #ui
- **`EndScreen.tsx`** (184) — Win/lose summary screen with staggered reveals of icon, title, message, stats, and play-again button. Tags: #ui
- **`GameBanner.tsx`** (95) — Mid-screen banner ("Wave 3 Cleared!") with green/blue/pink variants, glow, and timed auto-dismiss. Tags: #ui
- **`GameContainer.tsx`** (217) — Drives a sequence of dialogue scenes for an NPC: tracks scene index, score, privacy score, phase, and wires `BattleEncounterScreen`. Tags: #ui
- **`MusicVolumeSlider.tsx`** (74) — HUD slider that persists music volume to localStorage and broadcasts `REACT_SET_MUSIC_VOLUME` to Phaser. Tags: #ui #bridge
- **`NPCSprite.tsx`** (435) — Inline-SVG pixel-art NPC sprite renderer used by React overlays (battle screen, etc.) — separate from Phaser canvas sprites. Tags: #ui
- **`NotificationToast.tsx`** (140) — Notification context + provider exposing `useNotification()` for transient success/info/discovery/unlock toasts. Tags: #ui #hook
- **`ObservationHint.tsx`** (69) — Hint panel for `observation`-type gates that auto-acknowledges on Space/Enter. Tags: #ui
- **`PatientStoryReveal.tsx`** (136) — Animated reveal of a room's patient story (typewriter title + body) shown after room completion. Tags: #ui
- **`PixelComputerLogo.tsx`** (57) — Inline SVG of the title-screen pixel-art computer logo. Tags: #ui
- **`RoomIntroOverlay.tsx`** (92) — Nintendo-style room title card on entry with auto-dismiss after 2.5s or Space/click. Tags: #ui
- **`RoomProgressHUD.tsx`** (160) — Top-right HUD listing per-room NPC/zone/item checkboxes that animate as items get completed. Tags: #ui
- **`StartMenu.tsx`** (360) — v2.2 sponsor-demo start screen with three buttons (DEMO / TOWER DEFENSE / FULL GAME) and keyboard nav. Tags: #ui
- **`TitleScreen.tsx`** (198) — Title screen with logo, "NEW GAME"/"RESUME" menu, and staggered reveal animations. Tags: #ui

### [client/src/components/breach-defense/](../client/src/components/breach-defense/)

- **`EncounterDebrief.tsx`** (124) — Post-encounter victory/defeat panel with security score, score contribution, and a HIPAA takeaway. Tags: #ui
- **`EncounterGameUI.tsx`** (275) — In-encounter HUD: budget/wave/score readouts, tower picker tray, onboarding overlay, wave intro banner, threat strip. Tags: #ui
- **`NarrativeContextCard.tsx`** (81) — Pre-encounter "SECURITY ALERT" red-palette card with confirm/decline; gates entry into the breach encounter. Tags: #ui
- **`OnboardingOverlay.tsx`** (195) — Step-driven onboarding (WELCOME → SELECT_TOWER → PLACE_TOWER → TOWER_PLACED → PREP) with typewriter prompts. Tags: #ui
- **`ThreatStrip.tsx`** (42) — Compact "INCOMING:" wave threat list with colored dots and counts pulled from constants. Tags: #ui
- **`TutorialModal.tsx`** (57) — Generic tutorial popup with info/threat/tower variants and a single CTA button. Tags: #ui
- **`WaveIntroBanner.tsx`** (86) — Auto-dismissing banner shown when a new wave starts: name, intro text, suggested towers, threats. Tags: #ui

### [client/src/components/phi-sorter/](../client/src/components/phi-sorter/)

- **`BucketZone.tsx`** (85) — Drop target for the PHI Sorter; per-bucket hover/drop handlers and flash-green/shake-red feedback animations. Tags: #ui
- **`PHISorterOverlay.tsx`** (335) — Top-level PHI Sorter encounter overlay: drag-and-drop + keyboard, scoring, anticipation beat, educational wrong-answer feedback. Tags: #ui
- **`SorterContextCard.tsx`** (60) — Calm blue/teal pre-encounter narrative card for the PHI Sorter (rendered by `UnifiedGamePage`, not the overlay). Tags: #ui
- **`SorterItem.tsx`** (42) — Single draggable item card with selection ring and dragging opacity. Tags: #ui
- **`SorterTakeawaysPanel.tsx`** (37) — Two-bullet "KEY LEARNINGS" panel rendered next to `EncounterDebrief` after a sorter encounter. Tags: #ui

### [client/src/components/ui/](../client/src/components/ui/)

- **`button.tsx`** (62) — shadcn/ui button with `cva` variants and `asChild` slot support. Tags: #ui
- **`card.tsx`** (85) — shadcn/ui card primitives (`Card`, `CardHeader`, `CardContent`, etc.). Tags: #ui
- **`toast.tsx`** (127) — shadcn/ui toast primitives wrapping `@radix-ui/react-toast`. Tags: #ui
- **`toaster.tsx`** (33) — Mounts the toast viewport and renders toasts from `useToast`. Tags: #ui
- **`tooltip.tsx`** (30) — shadcn/ui tooltip primitives wrapping `@radix-ui/react-tooltip`. Tags: #ui

### [client/src/data/](../client/src/data/)

- **`hallwayContent.ts`** (112) — Per-act bulletin-board content for 5 hallway segments (15 entries; act 1 warm, act 2 stress, act 3 incident). Tags: #data
- **`sorterData.ts`** (294) — Three PHI Sorter document sets (act 1/2/3) with items, correct categories, and HIPAA Safe Harbor takeaways. Tags: #data
- **`sponsorConfig.ts`** (35) — Single-source sponsor identity (name, end-NPC sprite key, two dialogue lines, redemption code) for the demo capstone. Tags: #data #config
- **`spriteAssetPaths.ts`** (35) — React-side mirror of NPC spritesheet paths so non-Phaser components (e.g., `CertificateOverlay`) can render NPC art as `<img>`. Tags: #data

### [client/src/dev/](../client/src/dev/)

- **`ValidationOverlay.tsx`** (185) — Dev-only floating checklist that monitors EventBridge events and Phaser state to confirm key systems are healthy. Tags: #dev #ui

### [client/src/game/breach-defense/](../client/src/game/breach-defense/)

- **`constants.ts`** (377) — Authoritative BreachDefense data: grid dimensions, enemy paths, tower stats, threat definitions, wave configs, encounter overrides. Tags: #data

### [client/src/hooks/](../client/src/hooks/)

- **`use-toast.ts`** (191) — shadcn/ui toast state-machine hook (`useToast`, `toast()`) for the Toaster. Tags: #hook
- **`useGameState.ts`** (318) — Unified game-state hook backing `pq:save:v2`: completion sets, score, act progression, decisions, encounter results, helpers. Tags: #hook

### [client/src/lib/](../client/src/lib/)

- **`demoSession.ts`** (86) — Module-scoped demo-session state (no localStorage) that bypasses unlock order for the four sponsor-demo rooms. Tags: #util
- **`queryClient.ts`** (57) — Configured `@tanstack/react-query` `QueryClient` and `apiRequest` helper. Tags: #util
- **`saveData.test.ts`** (160) — Vitest suite for `saveData.ts`: migration, load, write, defaults, and round-trip behavior. Tags: #test
- **`saveData.ts`** (186) — Canonical save module: `SaveDataV2` shape, `migrateV1toV2`, `loadSave`, `writeSave`, `defaultSave`, key constants. Tags: #util
- **`utils.ts`** (6) — `cn()` Tailwind class-merge helper (clsx + tailwind-merge). Tags: #util

### [client/src/pages/](../client/src/pages/)

- **`UnifiedGamePage.tsx`** (1619) — The single game page: title/start menu, demo flow, room overlays, encounter orchestration, save persistence — wires every overlay to Phaser. Tags: #ui
- **`not-found.tsx`** (21) — 404 fallback page rendered when wouter doesn't match `/`. Tags: #ui

### [client/src/phaser/](../client/src/phaser/)

- **`EventBridge.ts`** (103) — Singleton `Phaser.Events.EventEmitter` plus `BRIDGE_EVENTS` constants — the canonical React↔Phaser communication channel. Tags: #bridge
- **`PhaserGame.tsx`** (68) — React wrapper that creates the Phaser `Game` instance once and exposes it via `useImperativeHandle`. Tags: #ui #bridge
- **`SpriteFactory.ts`** (3832) — Generates every programmatic texture used in Phaser: NPC sprites, objects (poster/manual/computer/whiteboard), and all furniture textures. Tags: #phaser-system
- **`config.ts`** (34) — Phaser `GameConfig` factory: 640×480 pixel-art canvas, scene list `[Boot, Exploration, BreachDefense]`, arcade physics. Tags: #config
- **`qa-bridge.ts`** (345) — `window.__QA__` test hook: state snapshots, commands (`teleportTo`, `pressSpace`, `navigateToDoor`), event waiters for Playwright. Tags: #bridge #test

### [client/src/phaser/scenes/](../client/src/phaser/scenes/)

- **`BootScene.ts`** (439) — Preloads audio + NPC spritesheets, renders a load bar, generates programmatic textures, then hands control to `ExplorationScene`. Tags: #phaser-scene
- **`BreachDefenseScene.ts`** (2146) — Tower-defense scene: grid render, enemy/tower/projectile sim, wave state, encounter mode (filter towers, override waves), UI affordances. Tags: #phaser-scene
- **`ExplorationScene.ts`** (2925) — Top-down RPG scene: room render, BFS click-to-move, NPC/zone/item interaction, door transitions, music crossfade, PHI-Sorter trigger tiles. Tags: #phaser-scene

### [client/src/types/](../client/src/types/)

- **`narrative.ts`** (48) — Three-act narrative type contracts: `ActState`, `DecisionState`, defaults, and act → music-track map. Tags: #type

---

## [server/](../server/)

- **`index.ts`** (68) — Express bootstrap: JSON middleware, request logger for `/api/*`, registers routes, sets up Vite in dev or static serving in prod, listens on `PORT` (default 8080). Tags: #server
- **`routes.ts`** (8) — API route registration stub — currently returns the bare HTTP server with no routes; placeholder for future endpoints. Tags: #server
- **`vite.ts`** (94) — Dev-mode Vite middleware integration plus `serveStatic` for prod, with `attached_assets/` static mount. Tags: #server #config

---

## [shared/](../shared/)

- **`schema.ts`** (146) — Zod schemas + inferred TS types shared by client and server: rooms, NPCs, gates, scenes, choices, items, doors, patient stories. Tags: #shared #type

---

## God file watch

These four files dominate the codebase and concentrate logic that could plausibly be split. Not a refactor mandate — just where to look first when something gets hard to follow.

- **`client/src/phaser/SpriteFactory.ts`** (3832) — All programmatic Phaser textures live here: NPC sprites, environment objects (poster/manual/computer/whiteboard), and every piece of furniture. Plausible split: `sprites/npcs.ts`, `sprites/objects.ts`, `sprites/furniture.ts` behind a single `generateAllTextures` re-export.
- **`client/src/phaser/scenes/ExplorationScene.ts`** (2925) — Room rendering, player movement, BFS pathfinding, NPC/zone/item interaction, door transitions, music crossfade, PHI Sorter trigger tiles, and QA hooks all in one scene class. Plausible split: pull movement/BFS into a helper, doors into a `DoorManager`, music into a `MusicController`, QA wiring into a mixin.
- **`client/src/phaser/scenes/BreachDefenseScene.ts`** (2146) — Tower-defense entire game loop: enemies, towers, projectiles, wave state, encounter overrides, hover/range UI, killstreak/scanline polish. Plausible split: extract entity systems (`EnemySystem`, `TowerSystem`, `ProjectileSystem`) and a `WaveDirector`.
- **`client/src/pages/UnifiedGamePage.tsx`** (1619) — Single React page driving title screen, demo mode, room HUD, encounter orchestration (Breach + PHI Sorter), save persistence, and audio settings — held together by ~30 `useState` calls. Plausible split: encounter lifecycle into a custom hook, demo flow into its own component, page-mode state machine into a reducer.
