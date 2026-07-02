import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../EventBridge';
import { generateAllTextures } from '../SpriteFactory';
import {
  ENCOUNTER_WAVES_INBOUND,
  ENCOUNTER_WAVE_BUDGETS,
  ENCOUNTER_AVAILABLE_TOWERS,
} from '../../game/breach-defense/constants';
import { findPath } from '../systems/exploration/pathfinding';
import {
  ensurePlayerFallbackTexture,
  renderRoom,
  renderVignette,
  showRoomBanner,
} from '../systems/exploration/roomRenderer';
import { spawnInteractables } from '../systems/exploration/interactableFactory';
import type { InteractableData } from '../systems/exploration/interactableFactory';
import { addRoomAmbience, addFurnitureIdleAnimations } from '../systems/exploration/roomAmbience';
import {
  emitIdleHint,
  IDLE_HINT_GRACE_MS,
  IDLE_HINT_INTERVAL_MS,
} from '../systems/exploration/idleHints';
import { MusicController } from '../systems/exploration/MusicController';
import { DoorSystem } from '../systems/exploration/DoorSystem';
import type { BreachDefenseInitData } from './BreachDefenseScene';
import type { Room, NPC, InteractionZone, EducationalItem, Position } from '@shared/schema';

const TILE = 32;
const MOVE_SPEED = 160; // pixels/sec

// MUSIC_TRACK_KEYS moved to systems/exploration/MusicController (Round 6)

// PHI Sorter triggers — proximity polling removed 2026-05-08, replaced by
// NPC-driven trigger via Aiyana (Reception, tile 10,6) and Marcus (Lab, tile 9,7).
// See `triggerInteraction` for the npc.encounterTrigger handler.

// QA test gate (BUG-009): when `?qa_no_encounter=1` is on the URL, suppress
// auto-firing encounter triggers (PHI Sorter Reception/Lab + IT Office TD) so
// progression tests can walk through trigger tiles without the sorter racing
// talkToNPC's BFS path. Production has no such param — behavior unchanged.
// Module-level cache: read once per page load (tests reload between specs).
let __qaNoEncounter: boolean | null = null;
function isQANoEncounter(): boolean {
  if (__qaNoEncounter !== null) return __qaNoEncounter;
  try {
    __qaNoEncounter = new URLSearchParams(window.location.search).get('qa_no_encounter') === '1';
  } catch {
    __qaNoEncounter = false;
  }
  return __qaNoEncounter;
}

// InteractableData interface moved to systems/exploration/interactableFactory (Round 4)

/**
 * ExplorationScene: Renders a PrivacyQuest room in Phaser canvas.
 *
 * Room data is passed via scene.start('Exploration', { room, completedNPCs, ... })
 * Player movement: WASD/arrows (continuous) + click-to-move (BFS pathfinding)
 * Interactions are emitted to React via EventBridge for dialogue overlay.
 */
export class ExplorationScene extends Phaser.Scene {
  private room!: Room;
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private interactables: InteractableData[] = [];
  private nearbyInteractable: InteractableData | null = null;
  private promptText!: Phaser.GameObjects.Text;
  private roomNameText!: Phaser.GameObjects.Text;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerLabel!: Phaser.GameObjects.Text;
  private interactionIndicator?: Phaser.GameObjects.Arc;

  // Click-to-move pathfinding state
  private movePath: Position[] = [];
  private moveTimer: Phaser.Time.TimerEvent | null = null;
  private pendingInteraction: InteractableData | null = null;

  // Data passed from React
  private completedNPCs: Set<string> = new Set();
  private completedZones: Set<string> = new Set();
  private collectedItems: Set<string> = new Set();

  // Tile-grid position for pathfinding
  private tileX = 0;
  private tileY = 0;

  // Pause movement while in dialogue
  private paused = false;

  // Footstep throttle — minimum interval between plays (ms)
  private lastFootstepTime = 0;

  // Idle-hint sparkle system (Phase 27 VIS-07)
  // lastActivityAt is public: DoorSystem.enter() resets it on door entry (Round 6)
  lastActivityAt = 0;
  private lastIdleHintAt = 0;
  private idleHintIndex = 0;

  // Idle frame index per direction (row * 3 + 0 for idle col) — from CREDITS.md layout
  // down=0, left=3, right=6, up=9
  private lastFacingFrame = 0;

  // NPC pulse tween for onboarding hint
  private npcPulseTween: Phaser.Tweens.Tween | null = null;
  private npcPulseTarget: InteractableData | null = null;

  // Dialogue dim overlay — anticipation beat before dialogue opens
  private dialogueDimOverlay?: Phaser.GameObjects.Rectangle;

  // Encounter state
  private encounterTriggered = false;
  // F-02 fix (Run 07): set when the player declines the TD narrative card while
  // still standing inside the trigger radius. The trigger stays suppressed until
  // they walk OUT of the radius — otherwise update() re-pops the card on the
  // very next frame and "NOT RIGHT NOW" becomes an inescapable loop.
  private encounterDeclined = false;

  // Door navigation state (Phase 12) — nearDoor/doorStates/doorVisuals moved
  // to DoorSystem (Round 6); transitioning STAYS here (it also gates idle
  // hints, movement, QA nav, and locked-door recovery) and is public so
  // DoorSystem reads/writes it through the scene reference.
  private doors!: DoorSystem;
  private pendingSpawnTileX: number | null = null;
  private pendingSpawnTileY: number | null = null;
  transitioning = false;

  // Zone glow registry — stores ring arc + tween per zone id so we can kill glow on live completion (Phase 27 VIS-08)
  private zoneGlows: Map<string, { ring: Phaser.GameObjects.Arc; tween: Phaser.Tweens.Tween }> = new Map();

  // F-21 (Run 07): speech-bubble "!" markers per NPC id — so live completion can
  // clear them (they used to float over completed, faded-out NPCs forever).
  private npcBubbles: Map<string, Phaser.GameObjects.Image> = new Map();

  // Previous completion sets — used by updateCompletionState to detect NEW completions
  private prevCompletedNPCs: Set<string> = new Set();
  private prevCompletedZones: Set<string> = new Set();

  // Background music — bgMusic/musicBaseVolume/activeMusicBaseVolume moved to
  // MusicController (Round 6). The scene keeps its eventBridge subscriptions
  // (REACT_SET_MUSIC_VOLUME, ACT_ADVANCE) and delegates.
  private readonly music = new MusicController(this);

  // QA state broadcast throttle
  private lastStateBroadcastTime = 0;

  constructor() {
    super({ key: 'Exploration' });
  }

  init(data: {
    room: Room;
    completedNPCs?: string[];
    completedZones?: string[];
    collectedItems?: string[];
    spawnDoorId?: string;
    doorStates?: Record<string, 'locked' | 'available' | 'completed' | 'next'>;
  }) {
    this.room = data.room;
    this.completedNPCs = new Set(data.completedNPCs || []);
    this.completedZones = new Set(data.completedZones || []);
    this.collectedItems = new Set(data.collectedItems || []);
    this.interactables = [];
    this.nearbyInteractable = null;
    this.movePath = [];
    this.moveTimer = null;
    this.pendingInteraction = null;
    this.paused = false;
    this.encounterTriggered = false;
    this.encounterDeclined = false;

    // Clear zone glow registry and prev-completion sets on scene restart (room re-render rebuilds all visuals)
    this.zoneGlows.clear();
    this.npcBubbles.clear();
    this.prevCompletedNPCs = new Set();
    this.prevCompletedZones = new Set();

    // Reset transitioning so scene restart doesn't freeze movement
    this.transitioning = false;

    // Fresh DoorSystem per room (Round 6) — resets nearDoor/doorVisuals; the
    // previous room's visuals were already destroyed by the scene restart.
    // Store door states for visual rendering.
    this.doors = new DoorSystem(this, this.room, this.music);
    this.doors.setStates(data.doorStates ?? {});

    // Read door-specific spawn position if provided
    this.pendingSpawnTileX = null;
    this.pendingSpawnTileY = null;
    if (data.spawnDoorId && (data.room as any).doors) {
      const spawnDoor = (data.room as any).doors.find((d: any) => d.id === data.spawnDoorId);
      if (spawnDoor) {
        // Offset spawn 1 tile inward from the door based on its side
        let sx = spawnDoor.x;
        let sy = spawnDoor.y;
        if (spawnDoor.side === 'left') sx += 1;
        else if (spawnDoor.side === 'right') sx -= 1;
        else if (spawnDoor.side === 'top') sy += 1;
        else if (spawnDoor.side === 'bottom') sy -= 1;
        this.pendingSpawnTileX = sx;
        this.pendingSpawnTileY = sy;
      }
    }

    if (this.npcPulseTween) {
      this.npcPulseTween.stop();
      this.npcPulseTween = null;
    }
    this.npcPulseTarget = null;

    // Reset idle-hint timers on room entry (time.now not available yet; set in create())
    this.lastActivityAt = 0;
    this.lastIdleHintAt = 0;
    this.idleHintIndex = 0;
  }

  create() {
    // F-25 fix (Run 07, new finding): Phaser NEVER auto-calls a method named
    // shutdown() — the whole cleanup block below was dead code. Consequences:
    // every scene.restart() (every room transition) stacked a duplicate copy
    // of ~17 eventBridge listeners on the singleton bridge, and destroyed Game
    // instances (dev remounts) left permanently-stale listeners whose
    // `this.scene.isActive()` guards THROW — aborting the emit chain before
    // live listeners ran (observed live: QA door navigation dead, layered SFX,
    // run 01's one-off door desync). Wire it for real, and de-dup defensively
    // in case a previous create() didn't get its shutdown.
    this.removeBridgeListeners();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

    // Reset camera fade from previous room transition (fixes black screen on scene.restart)
    // The fadeOut effect from the previous room may still be active after scene.restart()
    (this.cameras.main as any).fadeEffect?.reset();
    this.cameras.main.setAlpha(1);

    const room = this.room;
    const w = room.width * TILE;
    const h = room.height * TILE;

    // Generate extra textures if not already done (idempotent)
    generateAllTextures(this);

    ensurePlayerFallbackTexture(this);

    // Resize camera/world to match room dimensions
    // For rooms shorter than the viewport, center them vertically via camera scroll
    const canvasH = this.scale.height;
    const canvasW = this.scale.width;
    if (h < canvasH) {
      const yOff = Math.floor((canvasH - h) / 2);
      this.cameras.main.setBounds(0, -yOff, w, h + yOff * 2);
      this.physics.world.setBounds(0, 0, w, h);
      this.cameras.main.scrollY = -yOff;
    } else {
      this.cameras.main.setBounds(0, 0, w, h);
      this.physics.world.setBounds(0, 0, w, h);
    }

    this.walls = renderRoom(this, room).walls;

    // ── Interactables (Round 4 → systems/exploration/interactableFactory) ──
    // Items + glow auras, hallway bulletin board, zones + zoneGlows, NPCs +
    // labels + speech bubbles + boss ring. addCompletionCheck stays on the
    // scene (updateCompletionState also calls it); npcBubbles is the scene's
    // registry (updateCompletionState clears markers on live completion).
    const spawned = spawnInteractables(this, room, {
      completedNPCs: this.completedNPCs,
      completedZones: this.completedZones,
      collectedItems: this.collectedItems,
      npcBubbles: this.npcBubbles,
      getCurrentAct: () => this.getCurrentAct(),
      addCompletionCheck: (x, y, depth, pop) => this.addCompletionCheck(x, y, depth, pop),
    });
    this.interactables = spawned.interactables;
    this.zoneGlows = spawned.zoneGlows;

    // Pulse first NPC if this room hasn't been pulsed yet
    // (stays in the scene per the refactor proposal — writes npcPulseTween/npcPulseTarget)
    const firstNpc = this.interactables.find(ia => ia.type === 'npc');
    const roomPulseKey = `pq:room:${this.room.id}:npcPulsed`;
    if (firstNpc && !localStorage.getItem(roomPulseKey)) {
      this.npcPulseTarget = firstNpc;
      this.npcPulseTween = this.tweens.add({
        targets: firstNpc.sprite,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // ── Per-room life passes (Round 4 → systems/exploration/roomAmbience) ──
    addRoomAmbience(this, room, this.interactables, {
      getCurrentAct: () => this.getCurrentAct(),
    });

    // ── Player ───────────────────────────────────────────────────
    // Frame 0 = idle facing down (row 0, col 0 from CREDITS.md layout)
    // PLAYER_IDLE_FRAMES: down=0, left=3, right=6, up=9 (row * 3 + 0)
    const spawnTileX = this.pendingSpawnTileX ?? room.spawnPoint.x;
    const spawnTileY = this.pendingSpawnTileY ?? room.spawnPoint.y;
    this.pendingSpawnTileX = null;
    this.pendingSpawnTileY = null;
    this.tileX = spawnTileX;
    this.tileY = spawnTileY;
    // Prefer spritesheet for higher quality; fall back to programmatic texture
    const playerTex = this.textures.exists('player_sheet') ? 'player_sheet' : 'player_down';
    this.player = this.physics.add.sprite(
      spawnTileX * TILE + TILE / 2,
      spawnTileY * TILE + TILE / 2,
      playerTex,
      playerTex === 'player_sheet' ? 0 : undefined,
    );
    this.player.setDepth(30);
    // FIX-01 (Phase 20): Force the idle-down frame to render before any movement input.
    // Without this explicit setFrame, Phaser sometimes draws the raw spritesheet atlas
    // (all 12 frames at once) until anims.play() is first called. Locking frame 0 here
    // ensures the player sprite mounts with the correct idle-down pose.
    if (playerTex === 'player_sheet') {
      this.player.setFrame(0); // IDLE_DOWN
      this.lastFacingFrame = 0;
    }

    // Idle breathing tween — continuous subtle vertical scale oscillation
    this.tweens.add({
      targets: this.player,
      scaleY: { from: 1.0, to: 1.02 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);
    body.setOffset(4, 4);
    body.setCollideWorldBounds(true);

    // Player drop shadow at feet level
    this.playerShadow = this.add.ellipse(
      this.player.x, this.player.y + TILE / 2 - 2,
      20, 8,
      0x000000, 0.3,
    );
    this.playerShadow.setDepth(29);

    // Idle shadow pulse
    this.tweens.add({
      targets: this.playerShadow,
      scaleX: { from: 1.0, to: 1.05 },
      alpha: { from: 0.3, to: 0.2 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // "YOU" label above the player
    this.playerLabel = this.add.text(
      this.player.x, this.player.y - TILE / 2 - 4,
      'YOU',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#4A90E2',
        stroke: '#000000',
        strokeThickness: 2,
      },
    ).setOrigin(0.5, 1).setDepth(31);

    // Interaction radius indicator — subtle gold ring shown when near interactables
    this.interactionIndicator = this.add.circle(0, 0, TILE * 1.5, 0xffffff, 0)
      .setStrokeStyle(1, 0xffd700, 0)
      .setDepth(2);

    this.physics.add.collider(this.player, this.walls);

    // Camera follow in rooms larger than viewport
    if (w > 640 || h > 480) {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    // Cinematic settle — slight zoom then normalize
    this.cameras.main.setZoom(1.05);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1,
      duration: 800,
      ease: 'Sine.easeOut',
      delay: 300
    });

    // ── Door visuals (Phase 12) — render all doors with state indicators ──
    this.doors.render();

    // ── Legacy exit door glow at spawn point (only if no doors[] present) ──
    if (!(room as any).doors || (room as any).doors.length === 0) {
      const exitX = room.spawnPoint.x * TILE + TILE / 2;
      const exitY = room.spawnPoint.y * TILE + TILE / 2;
      const exitGlow = this.add.circle(exitX, exitY, 16, 0x2ecc71, 0)
        .setStrokeStyle(1.5, 0x2ecc71, 0)
        .setDepth(0);
      this.tweens.add({
        targets: exitGlow,
        strokeAlpha: { from: 0, to: 0.4 },
        scale: { from: 0.8, to: 1.3 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Visual door frame at spawn point
      const doorFrameG = this.add.graphics().setDepth(1);
      const spX = room.spawnPoint.x * TILE;
      const spY = room.spawnPoint.y * TILE;
      // Door frame posts
      doorFrameG.fillStyle(0x8b7355, 0.6);
      doorFrameG.fillRect(spX - 2, spY - TILE / 2, 4, TILE + TILE / 2);
      doorFrameG.fillRect(spX + TILE - 2, spY - TILE / 2, 4, TILE + TILE / 2);
      // Door header
      doorFrameG.fillStyle(0x8b7355, 0.5);
      doorFrameG.fillRect(spX - 2, spY - TILE / 2, TILE + 4, 4);
    }

    // ── Input ────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Click-to-move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.paused) return;
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const goalTileX = Math.floor(worldX / TILE);
      const goalTileY = Math.floor(worldY / TILE);

      // Check if clicking on an interactable
      let clickedInteractable: InteractableData | null = null;
      for (const i of this.interactables) {
        const d = i.data as { x: number; y: number };
        if (d.x === goalTileX && d.y === goalTileY) {
          clickedInteractable = i;
          break;
        }
      }

      const path = findPath(this.room, { x: this.tileX, y: this.tileY }, { x: goalTileX, y: goalTileY });
      if (path.length > 0) {
        this.startPathMovement(path, clickedInteractable);
      }
    });

    // ── HUD ──────────────────────────────────────────────────────
    this.roomNameText = this.add.text(canvasW / 2, 8, room.name.toUpperCase(), {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffd700',
      backgroundColor: '#1a1a2ecc', padding: { x: 10, y: 6 },
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5, 0).setDepth(50).setScrollFactor(0);

    this.promptText = this.add.text(canvasW / 2, canvasH - 12, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffd700',
      backgroundColor: '#1a1a2e', padding: { x: 12, y: 6 },
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5, 1).setDepth(50).setVisible(false).setScrollFactor(0);

    // Prompt text gentle bob
    this.tweens.add({
      targets: this.promptText,
      y: this.promptText.y - 3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    renderVignette(this);

    // ── Listen for React events — MUST be before music to survive any audio errors ──
    eventBridge.on(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_RESUME_EXPLORATION, this.onResumeFromDecline, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_PLAY_SFX, this.onPlaySfx, this);
    eventBridge.on(BRIDGE_EVENTS.ACT_ADVANCE, this.onActAdvance, this);

    // Listen for correct/incorrect answer feedback from React
    eventBridge.on(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, this.onAnswerFeedback, this);

    // Fanfare listener (Phase 15)
    eventBridge.on(BRIDGE_EVENTS.REACT_ROOM_COMPLETE_FANFARE, this.handleFanfareEvent, this);

    // Door navigation listeners (Phase 12)
    eventBridge.on(BRIDGE_EVENTS.REACT_LOAD_ROOM, this.onLoadRoom, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_DOOR_LOCKED, this.onDoorLocked, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_UPDATE_DOOR_STATES, this.onUpdateDoorStates, this);

    // Encounter lifecycle listeners (Phase 13)
    this.events.on(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, this.onLaunchEncounter, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER, this.onReturnFromEncounter, this);

    // Sync mute state from localStorage before any audio plays
    if (localStorage.getItem('sfx_muted') === 'true') {
      this.sound.mute = true;
    }

    // ── Background music — room override > act default; crossfade if track changed ──
    // (Round 6 → systems/exploration/MusicController.startRoomMusic; 1800ms
    // room-entry fade preserved via parameter — wake-restore uses 800ms.)
    this.music.startRoomMusic(this.room, this.getCurrentAct(), 1800);

    // Room entrance — fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    showRoomBanner(this, this.room);

    eventBridge.emit(BRIDGE_EVENTS.SCENE_READY, 'Exploration');

    // QA command listeners — Playwright drives the game via these
    eventBridge.on(BRIDGE_EVENTS.QA_MOVE_PLAYER_TO, this.onQAMoveTo, this);
    eventBridge.on(BRIDGE_EVENTS.QA_PRESS_SPACE, this.onQAPressSpace, this);
    eventBridge.on(BRIDGE_EVENTS.QA_NAVIGATE_DOOR, this.onQANavigateDoor, this);
    eventBridge.on(BRIDGE_EVENTS.QA_TELEPORT_TO, this.onQATeleportTo, this);

    // ── Type-driven furniture idle animations (Phase 26-02) ──────
    // (Round 4 → systems/exploration/roomAmbience)
    addFurnitureIdleAnimations(this, room);

    // Seed idle-hint timer to now so grace period starts fresh on room load
    this.lastActivityAt = this.time.now;
    this.lastIdleHintAt = this.time.now;
  }

  update() {
    // Idle frame indices per direction: down=0, left=3, right=6, up=9 (row*3+0)
    const IDLE_DOWN = 0; const IDLE_LEFT = 3; const IDLE_RIGHT = 6; const IDLE_UP = 9;

    if (this.paused) {
      const pauseBody = this.player.body as Phaser.Physics.Arcade.Body;
      pauseBody.setVelocity(0);
      this.player.anims.stop();
      this.player.setFrame(this.lastFacingFrame);
      return;
    }

    // SNES-style depth sorting: characters lower on screen render in front
    this.player.setDepth(5 + Math.floor(this.player.y / TILE));

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // If following a path, don't accept keyboard movement
    if (this.movePath.length > 0) this.lastActivityAt = this.time.now;
    if (this.movePath.length === 0) {
      body.setVelocity(0);

      const left = this.cursors.left.isDown || this.wasd.A.isDown;
      const right = this.cursors.right.isDown || this.wasd.D.isDown;
      const up = this.cursors.up.isDown || this.wasd.W.isDown;
      const down = this.cursors.down.isDown || this.wasd.S.isDown;

      if (left) {
        body.setVelocityX(-MOVE_SPEED);
        this.player.anims.play('walk_left', true);
        this.lastFacingFrame = IDLE_LEFT;
      } else if (right) {
        body.setVelocityX(MOVE_SPEED);
        this.player.anims.play('walk_right', true);
        this.lastFacingFrame = IDLE_RIGHT;
      }

      if (up) {
        body.setVelocityY(-MOVE_SPEED);
        if (!left && !right) {
          this.player.anims.play('walk_up', true);
          this.lastFacingFrame = IDLE_UP;
        }
      } else if (down) {
        body.setVelocityY(MOVE_SPEED);
        if (!left && !right) {
          this.player.anims.play('walk_down', true);
          this.lastFacingFrame = IDLE_DOWN;
        }
      }

      if ((left || right) && (up || down)) {
        body.velocity.normalize().scale(MOVE_SPEED);
      }

      const isMoving = left || right || up || down;
      if (isMoving) this.lastActivityAt = this.time.now;
      if (isMoving && !this.paused && this.time.now - this.lastFootstepTime > 350) {
        this.sound.play('sfx_footstep', { volume: 0.25 });
        this.lastFootstepTime = this.time.now;

        // Footstep dust puff
        if (this.textures.exists('particle_circle')) {
          const dustEmitter = this.add.particles(
            this.player.x, this.player.y + 12, 'particle_circle', {
            speed: { min: 5, max: 15 },
            angle: { min: 220, max: 320 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.25, end: 0 },
            lifespan: 300,
            tint: 0xccbb99,
            frequency: -1,
          });
          dustEmitter.setDepth(1);
          dustEmitter.explode(2);
          this.time.delayedCall(400, () => {
            if (dustEmitter && dustEmitter.active) dustEmitter.destroy();
          });
        }
      }

      if (!left && !right && !up && !down) {
        this.player.anims.stop();
        this.player.setFrame(this.lastFacingFrame);
      }

      // Track tile position from continuous movement
      this.tileX = Math.round((this.player.x - TILE / 2) / TILE);
      this.tileY = Math.round((this.player.y - TILE / 2) / TILE);
    }

    // Update player shadow + label position and depth to follow player
    this.playerShadow.setPosition(this.player.x, this.player.y + TILE / 2 - 2);
    this.playerShadow.setDepth(this.player.depth - 1);
    this.playerLabel.setPosition(this.player.x, this.player.y - TILE / 2 - 4);
    this.playerLabel.setDepth(this.player.depth + 1);

    // Proximity check
    this.checkProximity();

    // Update interaction radius indicator
    if (this.interactionIndicator) {
      if (this.nearbyInteractable) {
        this.interactionIndicator.setPosition(this.player.x, this.player.y);
        this.interactionIndicator.setStrokeStyle(1, 0xffd700, 0.2);
      } else {
        this.interactionIndicator.setStrokeStyle(1, 0xffd700, 0);
      }
    }

    // Interact key — sample once, use for NPC/item/door
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);
    if (interactPressed) this.lastActivityAt = this.time.now; // any key press resets idle hint

    if (interactPressed && this.nearbyInteractable) {
      this.triggerInteraction(this.nearbyInteractable);
    }

    // Idle-hint sparkle system (Phase 27 VIS-07): after grace period, shimmer un-met objectives
    if (!this.paused && !this.transitioning) {
      const now = this.time.now;
      if (
        now - this.lastActivityAt > IDLE_HINT_GRACE_MS &&
        now - this.lastIdleHintAt > IDLE_HINT_INTERVAL_MS
      ) {
        // Round 4: emitIdleHint moved to systems/exploration/idleHints —
        // the timestamp write + round-robin index stay scene fields.
        this.lastIdleHintAt = this.time.now;
        this.idleHintIndex = emitIdleHint(
          this,
          this.room,
          this.interactables,
          { npcs: this.completedNPCs, zones: this.completedZones, items: this.collectedItems },
          this.idleHintIndex,
        );
      }
    }

    // IT Office encounter zone check (Phase 13)
    if (this.room.id === 'it_office' && !this.paused && !isQANoEncounter()) {
      const alreadyDone = this.registry.get('encounterResult_td-it-office');
      if (!alreadyDone) {
        const dx = Math.abs(this.player.x - (9 * TILE + TILE / 2));
        const dy = Math.abs(this.player.y - (6 * TILE + TILE / 2));
        const inRadius = dx < TILE * 1.5 && dy < TILE * 1.5;
        if (this.encounterDeclined) {
          // F-02 fix (Run 07): player said "not right now" — re-arm the trigger
          // only once they've stepped out of the radius, so declining actually works.
          if (!inRadius) {
            this.encounterDeclined = false;
            this.encounterTriggered = false;
          }
        } else if (!this.encounterTriggered && inRadius) {
          this.triggerEncounter('td-it-office');
        }
      }
    }

    // PHI Sorter triggers are now NPC-driven (Phase 16, 2026-05-08).
    // Player presses SPACE on Aiyana (Reception) or Marcus (Lab) — see triggerInteraction.
    // Proximity polling removed because it auto-popped without player agency.

    // Door proximity detection — requires SPACE to enter (Phase 12)
    if (!this.transitioning) {
      this.doors.checkProximity(this.player.x, this.player.y);
      const nearDoor = this.doors.nearDoor;
      if (nearDoor && interactPressed && !this.nearbyInteractable) {
        this.doors.enter(nearDoor);
      }
    }

    // Escape to exit room (legacy — only active when no doors[] present)
    if (!(this.room as any).doors?.length && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.sound.play('sfx_interact', { volume: 0.4 });
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, this.room.id);
    }

    // QA state broadcast (throttled to 200ms)
    if (this.time.now - this.lastStateBroadcastTime > 200) {
      this.lastStateBroadcastTime = this.time.now;
      // F-19 fix (Run 07): the payload now matches the shape qa-bridge actually
      // consumes (playerPosition / roomNPCs / roomZones / roomItems / roomDoors).
      // The old fields (playerTileX/interactables/doors) had drifted from the
      // bridge contract, leaving those __QA__ fields permanently undefined —
      // any test asserting on them was asserting on nothing. Legacy fields kept
      // so external scripts reading the raw event don't break.
      const byType = (t: string) =>
        this.interactables
          .filter(ia => ia.type === t)
          .map(ia => ({ type: ia.type, id: ia.id, x: (ia.data as any).x, y: (ia.data as any).y }));
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE, {
        currentRoomId: this.room.id,
        playerTileX: this.tileX,
        playerTileY: this.tileY,
        playerPosition: { tileX: this.tileX, tileY: this.tileY },
        nearbyInteractable: this.nearbyInteractable
          ? { type: this.nearbyInteractable.type, id: this.nearbyInteractable.id }
          : null,
        nearDoor: this.doors.nearDoor
          ? { id: this.doors.nearDoor.id, targetRoomId: this.doors.nearDoor.targetRoomId }
          : null,
        paused: this.paused,
        roomNPCs: byType('npc').map(n => ({ ...n, completed: this.completedNPCs.has(n.id) })),
        roomZones: byType('zone').map(z => ({ ...z, completed: this.completedZones.has(z.id) })),
        roomItems: byType('item').map(i => ({ ...i, collected: this.collectedItems.has(i.id) })),
        interactables: this.interactables.map(ia => ({
          type: ia.type,
          id: ia.id,
          x: (ia.data as any).x,
          y: (ia.data as any).y,
        })),
        roomDoors: ((this.room as any).doors || []).map((d: any) => ({
          id: d.id,
          targetRoomId: d.targetRoomId,
          x: d.x,
          y: d.y,
          state: this.doors.states[d.id] ?? 'available',
        })),
        doors: ((this.room as any).doors || []).map((d: any) => ({
          id: d.id,
          targetRoomId: d.targetRoomId,
          x: d.x,
          y: d.y,
          state: this.doors.states[d.id] ?? 'available',
        })),
      });
    }
  }

  /** F-25 (Run 07): all eventBridge listener removal in one idempotent place —
   *  called from shutdown() AND defensively at the top of create() so a missed
   *  shutdown can never stack duplicates on the singleton bridge.
   *  (eventemitter3's off(event, fn, context) removes every matching copy.) */
  private removeBridgeListeners(): void {
    eventBridge.off(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_RESUME_EXPLORATION, this.onResumeFromDecline, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_PLAY_SFX, this.onPlaySfx, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_ANSWER_FEEDBACK, this.onAnswerFeedback, this);
    eventBridge.off(BRIDGE_EVENTS.ACT_ADVANCE, this.onActAdvance, this);
    // Fanfare listener (Phase 15)
    eventBridge.off(BRIDGE_EVENTS.REACT_ROOM_COMPLETE_FANFARE, this.handleFanfareEvent, this);
    // Door navigation listeners (Phase 12)
    eventBridge.off(BRIDGE_EVENTS.REACT_LOAD_ROOM, this.onLoadRoom, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_DOOR_LOCKED, this.onDoorLocked, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_UPDATE_DOOR_STATES, this.onUpdateDoorStates, this);
    // Encounter lifecycle listeners (Phase 13)
    eventBridge.off(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, this.onLaunchEncounter, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER, this.onReturnFromEncounter, this);
    // QA command listeners cleanup
    eventBridge.off(BRIDGE_EVENTS.QA_MOVE_PLAYER_TO, this.onQAMoveTo, this);
    eventBridge.off(BRIDGE_EVENTS.QA_PRESS_SPACE, this.onQAPressSpace, this);
    eventBridge.off(BRIDGE_EVENTS.QA_NAVIGATE_DOOR, this.onQANavigateDoor, this);
    eventBridge.off(BRIDGE_EVENTS.QA_TELEPORT_TO, this.onQATeleportTo, this);
  }

  /** F-25 (Run 07): now actually invoked — wired in create() via
   *  events.once(SHUTDOWN) + events.once(DESTROY). Phaser never auto-calls a
   *  method named shutdown(); this was dead code since Phase 12. Body is
   *  throw-proofed because the DESTROY path runs with plugins partly torn down. */
  shutdown() {
    // Don't stop music — create() will reclaim it if same track is needed,
    // or crossfadeTo will clean it up if the act changed. release() drops the
    // bgMusic ref and clears the sound 'unlocked' listener (Round 6).
    this.music.release();
    // Clean up EventBridge listeners
    this.removeBridgeListeners();
    try { this.events.off(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this); } catch (_) {}
    // Clean up input handlers
    try { this.input.off('pointerdown'); } catch (_) {}
    // Kill all tweens to prevent leaked infinite loops
    try { this.tweens.killAll(); } catch (_) {}
    try { if (this.moveTimer) this.moveTimer.destroy(); } catch (_) {}
    this.moveTimer = null;
    if (this.npcPulseTween) {
      try { this.npcPulseTween.stop(); } catch (_) {}
      this.npcPulseTween = null;
    }
  }

  // ── QA Testing Commands ──────────────────────────────────────────

  /** Run 07 (new finding): `this.scene.isActive()` itself THROWS on a scene
   *  instance whose plugin was torn down (observed live: a stale listener from
   *  a destroyed instance received QA_NAVIGATE_DOOR mid-transition and crashed
   *  the page with "Cannot read properties of null (reading 'isActive')").
   *  All QA handlers now use this throw-proof liveness check. */
  private isSceneAlive(): boolean {
    try {
      return !!this.scene && !!this.sys && this.scene.isActive();
    } catch {
      return false;
    }
  }

  private onQATeleportTo = (data: { tileX: number; tileY: number }) => {
    if (!this.isSceneAlive()) return;
    this.movePath = [];
    if (this.moveTimer) { this.moveTimer.destroy(); this.moveTimer = null; }
    this.player.setPosition(data.tileX * TILE + TILE / 2, data.tileY * TILE + TILE / 2);
    this.tileX = data.tileX;
    this.tileY = data.tileY;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    // Immediately update proximity so QA pressSpace can find nearby interactables
    this.checkProximity();
    this.doors.checkProximity(this.player.x, this.player.y);
  };

  private onQAMoveTo = (data: { tileX: number; tileY: number }) => {
    if (!this.isSceneAlive()) return;
    const path = findPath(
      this.room,
      { x: this.tileX, y: this.tileY },
      { x: data.tileX, y: data.tileY }
    );
    if (path.length > 0) {
      this.startPathMovement(path, null);
    }
  };

  private onQAPressSpace = () => {
    if (!this.isSceneAlive() || this.paused) return;
    // If near an interactable, trigger it
    if (this.nearbyInteractable) {
      this.triggerInteraction(this.nearbyInteractable);
      return;
    }
    // If near a door, enter it
    if (this.doors.nearDoor && !this.transitioning) {
      this.doors.enter(this.doors.nearDoor);
      return;
    }
    // Fallback: find closest interactable within 2 tiles and trigger it
    let closest: InteractableData | null = null;
    let closestDist = Infinity;
    for (const ia of this.interactables) {
      const d = ia.data as { x: number; y: number };
      const dist = Math.abs(this.tileX - d.x) + Math.abs(this.tileY - d.y);
      if (dist <= 2 && dist < closestDist) {
        closestDist = dist;
        closest = ia;
      }
    }
    if (closest) {
      this.triggerInteraction(closest);
    }
  };

  private onQANavigateDoor = (data: { doorId: string }) => {
    if (!this.isSceneAlive()) return;
    const doors = (this.room as any).doors;
    if (!doors) return;
    const door = doors.find((d: any) => d.id === data.doorId);
    if (!door) return;

    // Directly trigger the door interaction — skip pathfinding for reliability
    // First teleport player near the door
    const TILE = 32;
    let targetX = door.x;
    let targetY = door.y;
    // Offset 1 tile inward from door side so player is inside the room
    if (door.side === 'left') targetX += 1;
    else if (door.side === 'right') targetX -= 1;
    else if (door.side === 'top') targetY += 1;
    else if (door.side === 'bottom') targetY -= 1;

    // Teleport player to adjacent tile
    this.player.setPosition(targetX * TILE + TILE / 2, targetY * TILE + TILE / 2);
    this.tileX = targetX;
    this.tileY = targetY;
    this.movePath = [];

    // Small delay for proximity check to fire, then trigger door
    this.time.delayedCall(200, () => {
      this.doors.checkProximity(this.player.x, this.player.y);
      const nearDoor = this.doors.nearDoor;
      if (nearDoor && nearDoor.id === data.doorId) {
        this.doors.enter(nearDoor);
      } else {
        // Force it — directly emit the door event
        this.transitioning = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, {
            targetRoomId: door.targetRoomId,
            fromDoorId: door.id,
          });
        });
      }
    });
  };

  private onMusicVolume = (vol: number) => {
    // Handler body moved to MusicController.setUserVolume (Round 6)
    this.music.setUserVolume(vol);
  };

  // ── Act-based music crossfade (Phase 14) ──────────────────────────
  // crossfadeToMusic/findPlayingTrack/startMusicTrack + activeMusicBaseVolume
  // moved to systems/exploration/MusicController (Round 6)

  private onActAdvance = (data: { newAct: number; track: string; baseVolume?: number }) => {
    this.music.crossfadeTo(data.track, data.baseVolume);
  };

  private onPlaySfx = (data: { key: string; volume?: number; rate?: number }) => {
    if (!this.scene.isActive()) return;
    try {
      if (this.sound && this.sound.get(data.key)) {
        this.sound.play(data.key, { volume: data.volume ?? 0.5, rate: data.rate ?? 1 });
      }
    } catch (e) {
      // Sound manager may be in a bad state (e.g. sounds array null after
      // WebAudio context destruction). Safe to swallow here.
    }
  };

  // ── Department completion fanfare (Phase 15) ─────────────────────

  private handleFanfareEvent = (data: { roomId: string; playerX?: number; playerY?: number }) => {
    if (!this.scene.isActive()) return;
    // F-08 (Run 07): React doesn't track pixel coordinates — default the burst
    // to the player's current position.
    const playerX = data.playerX ?? this.player?.x ?? this.cameras.main.centerX;
    const playerY = data.playerY ?? this.player?.y ?? this.cameras.main.centerY;

    // Beat 1: Camera flash — gold-white
    this.cameras.main.flash(350, 255, 220, 50, false);

    // Beat 2: Particle burst — larger and more colorful than standard
    if (this.textures.exists('particle_circle')) {
      const emitter = this.add.particles(playerX, playerY, 'particle_circle', {
        speed: { min: 80, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xffd700, 0x44ff44, 0x4ae2ff, 0xff6b9d],
        lifespan: 900,
        quantity: 30,
        emitting: false,
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
      emitter.explode(30, playerX, playerY);
      this.time.delayedCall(1000, () => { if (emitter.active) emitter.destroy(); });
    }

    // Beat 3: Fanfare chime
    try {
      if (this.cache.audio.has('sfx_fanfare')) {
        this.sound.play('sfx_fanfare', { volume: 0.9 });
      }
    } catch (_e) { /* ignore if sound unavailable */ }
  };

  // ── Act state helper (Phase 15) ──────────────────────────────────

  private getCurrentAct(): 1 | 2 | 3 {
    try {
      const raw = localStorage.getItem('pq:save:v2');
      if (!raw) return 1;
      const save = JSON.parse(raw);
      // F-03 fix (Run 07): the live save field is `currentAct` (written by
      // useGameState). `actProgress` was a phantom — nothing ever wrote it.
      // Kept as a fallback so hand-seeded QA saves keep working.
      const act = save?.currentAct ?? save?.actProgress;
      if (act === 2 || act === 3) return act;
    } catch { /* ignore */ }
    return 1;
  }

  // ── Encounter lifecycle (Phase 13) ──────────────────────────────

  /** Called when the IT Office encounter zone is activated. */
  private triggerEncounter(encounterId: string): void {
    // Guard: only fire once per room session and only if not already completed
    if (this.encounterTriggered) return;
    const alreadyDone = this.registry.get(`encounterResult_${encounterId}`);
    if (alreadyDone) return;

    this.encounterTriggered = true;
    this.paused = true;

    const config: BreachDefenseInitData = {
      encounterId,
      waveSubset: ENCOUNTER_WAVES_INBOUND,
      availableTowerIds: [...ENCOUNTER_AVAILABLE_TOWERS],
      budgetOverride: ENCOUNTER_WAVE_BUDGETS,
    };

    // Commandment 2: Anticipation before reward — brief screen shake + SFX before alert
    this.cameras.main.shake(300, 0.006);
    // FIX-03 (Phase 20): drop volume from 0.6 → 0.35 — the alert was a jarring honk
    // when the player simply walked near the IT Office workstation cluster. The shake
    // already conveys urgency; the SFX should be a soft cue, not a horn (Commandment 8).
    try { this.sound.play('sfx_breach_alert', { volume: 0.35 }); } catch (_) {}

    // Delay the narrative card slightly so the shake lands first
    this.time.delayedCall(400, () => {
      eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_TRIGGERED, {
        encounterId,
        narrativeText:
          "The security analyst just flagged suspicious login attempts on the patient records server. " +
          "Something is actively probing your network. You need to defend the systems — now.",
        config,
      });
    });
    // React shows the narrative context card. On user confirmation,
    // React emits REACT_LAUNCH_ENCOUNTER and ExplorationScene handles it below.
  }

  // triggerPHISorterEncounter removed 2026-05-08 — replaced by NPC-driven trigger
  // (npc.encounterTrigger handler in triggerInteraction emits ENCOUNTER_REQUEST,
  // React shows EncounterRequestModal, accept transitions phase to 'phi-sorter'
  // directly without going through the narrative card).

  /** React confirmed the narrative card — launch BreachDefense and sleep. */
  private encounterLaunching = false;
  private onLaunchEncounter = (data: { config: BreachDefenseInitData }): void => {
    // Guard against double-fire
    if (this.encounterLaunching) return;
    this.encounterLaunching = true;

    // Kill any active music tweens before destroying to avoid null volume errors
    this.music.killForEncounter();

    // Launch directly — camera fade callbacks silently fail with scene.launch
    this.scene.setVisible(false);
    this.scene.launch('BreachDefense', data.config);
    this.scene.bringToTop('BreachDefense');
    this.scene.sleep();
  };

  /** React dismissed the debrief — stop BreachDefense and wake this scene. */
  private onReturnFromEncounter = (data?: { encounterId?: string; aborted?: boolean }): void => {
    try {
      this.scene.stop('BreachDefense');
    } catch (_) {
      // Scene may already be stopped
    }
    this.scene.setVisible(true);
    if (!this.scene.isActive()) {
      this.scene.wake();   // TD path: fires handleWakeFromEncounter which resets paused
    }

    // Phase 16 (BLOCKER 1): for pure-React encounters (PHI Sorter), the scene was never slept,
    // so scene.wake() above is a no-op and handleWakeFromEncounter never fires. We must
    // explicitly reset the paused/encounterTriggered flags. The `aborted` branch handles
    // player-initiated exits (Esc / X button) — same unpause, but no registry guard write so
    // the encounter remains replayable when the player walks back over the trigger tile.
    if (data?.encounterId || data?.aborted) {
      this.paused = false;
      if (data.encounterId) {
        this.encounterTriggered = false;
        this.registry.set(`encounterResult_${data.encounterId}`, true);
      } else if (this.encounterTriggered) {
        // F-05 fix (Run 07): abort/defeat on the radius-triggered TD encounter —
        // re-arm only after the player leaves the trigger radius (same mechanism
        // as declining, F-02). Clearing the flag here would re-pop the alert on
        // the very next frame since the player is still standing on the tile.
        this.encounterDeclined = true;
      } else {
        this.encounterTriggered = false;
      }
    }
  };

  /** Fires when this scene wakes from sleep (after encounter ends). */
  private handleWakeFromEncounter = (): void => {
    this.paused = false;
    this.encounterLaunching = false;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    // encounterTriggered stays true — prevents re-triggering on same room session

    // Restore exploration music after BreachDefense ends — honor room override
    // (Round 6 → MusicController.startRoomMusic; 800ms wake fade preserved via
    // parameter — room-entry create() uses 1800ms.)
    this.music.startRoomMusic(this.room, this.getCurrentAct(), 800);
  };

  // ── Door navigation (Phase 12) ──────────────────────────────────
  // checkDoorProximity/handleDoorInteraction/renderDoorStates moved to
  // systems/exploration/DoorSystem (Round 6) — the onLoadRoom /
  // onUpdateDoorStates / onDoorLocked eventBridge handlers stay here and
  // delegate. `transitioning` stays on the scene.

  // emitIdleHint moved to systems/exploration/idleHints (Round 4) — called from update()


  private onLoadRoom = (data: {
    room: any;
    spawnDoorId?: string;
    completedNPCs: string[];
    completedZones: string[];
    collectedItems: string[];
    doorStates: Record<string, 'locked' | 'available' | 'completed' | 'next'>;
  }) => {
    this.scene.restart(data);
  };

  private onUpdateDoorStates = (data: { doorStates: Record<string, 'locked' | 'available' | 'completed' | 'next'> }) => {
    this.doors.setStates(data.doorStates);
    this.doors.render();
  };

  private onDoorLocked = () => {
    // Locked door feedback: camera flash + reset transitioning so player can move
    // Fade back in first in case a fadeOut was already in progress
    (this.cameras.main as any).fadeEffect?.reset();
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.cameras.main.flash(200, 255, 0, 0, true);
    this.transitioning = false;
    // Use breach_alert SFX as a "denied" sound (sfx_locked doesn't exist)
    // FIX-03 (Phase 20): drop from 0.4 → 0.25 — even at 0.4 the breach alert read
    // as a jarring honk when bumping a locked door during exploration. The red
    // camera flash carries the rejection feedback; SFX is just a soft accent.
    try {
      this.sound.play('sfx_breach_alert', { volume: 0.25 });
    } catch (_e) {
      // Ignore if sound not available
    }
  };

  private startPathMovement(path: Position[], pending: InteractableData | null) {
    // Idle frame indices per direction: down=0, left=3, right=6, up=9 (row*3+0)
    const IDLE_DOWN = 0; const IDLE_LEFT = 3; const IDLE_RIGHT = 6; const IDLE_UP = 9;

    if (this.moveTimer) { this.moveTimer.destroy(); this.moveTimer = null; }
    this.movePath = path;
    this.pendingInteraction = pending;

    const step = () => {
      if (this.movePath.length === 0) {
        this.moveTimer = null;
        // Arrived — stop walk animation, restore idle pose frame
        this.player.anims.stop();
        this.player.setFrame(this.lastFacingFrame);
        // Trigger pending interaction if adjacent
        if (this.pendingInteraction) {
          const d = this.pendingInteraction.data as { x: number; y: number };
          const dist = Math.abs(this.tileX - d.x) + Math.abs(this.tileY - d.y);
          if (dist <= 1) {
            this.nearbyInteractable = this.pendingInteraction;
            this.triggerInteraction(this.pendingInteraction);
          }
          this.pendingInteraction = null;
        }
        return;
      }

      const next = this.movePath.shift()!;
      const dx = next.x - this.tileX;
      const dy = next.y - this.tileY;

      this.sound.play('sfx_footstep', { volume: 0.25 });
      this.lastFootstepTime = this.time.now;

      // Footstep dust puff
      if (this.textures.exists('particle_circle')) {
        const dustEmitter = this.add.particles(
          this.player.x, this.player.y + 12, 'particle_circle', {
          speed: { min: 5, max: 15 },
          angle: { min: 220, max: 320 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.25, end: 0 },
          lifespan: 300,
          tint: 0xccbb99,
          frequency: -1,
        });
        dustEmitter.setDepth(1);
        dustEmitter.explode(2);
        this.time.delayedCall(400, () => {
          if (dustEmitter && dustEmitter.active) dustEmitter.destroy();
        });
      }

      if (dx < 0) {
        this.player.anims.play('walk_left', true);
        this.lastFacingFrame = IDLE_LEFT;
      } else if (dx > 0) {
        this.player.anims.play('walk_right', true);
        this.lastFacingFrame = IDLE_RIGHT;
      } else if (dy < 0) {
        this.player.anims.play('walk_up', true);
        this.lastFacingFrame = IDLE_UP;
      } else if (dy > 0) {
        this.player.anims.play('walk_down', true);
        this.lastFacingFrame = IDLE_DOWN;
      }

      this.tileX = next.x;
      this.tileY = next.y;

      this.tweens.add({
        targets: this.player,
        x: next.x * TILE + TILE / 2,
        y: next.y * TILE + TILE / 2,
        duration: 120,
        ease: 'Linear',
        onComplete: () => {
          (this.player.body as Phaser.Physics.Arcade.Body).reset(this.player.x, this.player.y);
          step();
        },
      });
    };

    step();
  }

  // ── Proximity ──────────────────────────────────────────────────
  private checkProximity() {
    let closest: InteractableData | null = null;
    let closestDist = Infinity;

    for (const ia of this.interactables) {
      const d = ia.data as { x: number; y: number };
      const dist = Math.abs(this.tileX - d.x) + Math.abs(this.tileY - d.y);
      if (dist <= 1 && dist < closestDist) {
        closestDist = dist;
        closest = ia;
      }
    }

    if (closest) {
      this.nearbyInteractable = closest;
      const label = closest.type === 'npc'
        ? `[SPACE] Talk to ${(closest.data as NPC).name}`
        : closest.type === 'zone'
        ? `[SPACE] Examine ${(closest.data as InteractionZone).name}`
        : `[SPACE] Read ${(closest.data as EducationalItem).title}`;
      this.promptText.setText(label);
      this.promptText.setVisible(true);
    } else {
      this.nearbyInteractable = null;
      // Show door prompt if near a door and no other interactable
      const nearDoor = this.doors.nearDoor;
      if (nearDoor) {
        const doorLabel = nearDoor.label || nearDoor.targetRoomId.replace(/_/g, ' ');
        // F-12 fix (Run 07): a locked door used to show the same inviting
        // "[SPACE] Enter" prompt, then honk on the attempt. Tell the truth
        // up front — the attempt feedback (red flash + alert) stays.
        if (this.doors.states[nearDoor.id] === 'locked') {
          this.promptText.setText(`[LOCKED] ${doorLabel} — finish this area first`);
        } else {
          this.promptText.setText(`[SPACE] Enter ${doorLabel}`);
        }
        this.promptText.setVisible(true);
      } else {
        this.promptText.setVisible(false);
      }
    }
  }

  // ── Interaction ────────────────────────────────────────────────
  private triggerInteraction(ia: InteractableData) {
    this.lastActivityAt = this.time.now; // Reset idle-hint grace period on interaction
    this.sound.play('sfx_interact', { volume: 0.55 });
    this.stopNpcPulse(ia);
    this.paused = true;
    this.movePath = [];

    // Dim screen for dialogue entrance — anticipation beat
    const dimOverlay = this.add.rectangle(
      this.cameras.main.centerX, this.cameras.main.centerY,
      this.cameras.main.width, this.cameras.main.height,
      0x000000, 0
    ).setDepth(100).setScrollFactor(0);

    this.tweens.add({
      targets: dimOverlay,
      fillAlpha: 0.25,
      duration: 200,
      ease: 'Sine.easeIn'
    });

    // Store reference so we can fade it out when dialogue completes
    this.dialogueDimOverlay = dimOverlay;

    if (ia.type === 'npc') {
      const npc = ia.data as NPC;

      // Phase 16 (2026-05-08): NPC-driven encounter trigger.
      // If this NPC has an `encounterTrigger` field, skip the dialogue scene flow
      // and instead emit ENCOUNTER_REQUEST so React can show the EncounterRequestModal.
      // Player picks accept (→ encounter) or decline (→ resume exploration).
      if (npc.encounterTrigger) {
        // Already-completed encounters skip the request modal entirely
        const alreadyDone = this.registry.get(`encounterResult_${npc.encounterTrigger.encounterId}`);
        if (alreadyDone) {
          // F-07 fix (Run 07): the old bare `return` left the scene paused with the
          // dim overlay up — talking to a finished encounter NPC froze the game.
          // Unpause, clear the dim, and give the NPC a short post-encounter line
          // (Commandment 1: no silent interactions).
          this.paused = false;
          if (this.dialogueDimOverlay) {
            this.tweens.killTweensOf(this.dialogueDimOverlay);
            this.dialogueDimOverlay.destroy();
            this.dialogueDimOverlay = undefined;
          }
          const doneLine =
            (npc.encounterTrigger as { completedText?: string }).completedText ??
            'All handled here — thanks for the help earlier!';
          this.showNpcSpeechBubble(ia, doneLine);
          return;
        }
        // Pause input to prevent walking off mid-modal; do NOT sleep — the React modal
        // sits on top and we resume immediately on accept/decline.
        this.paused = true;
        eventBridge.emit(BRIDGE_EVENTS.ENCOUNTER_REQUEST, {
          npcId: npc.id,
          npcName: npc.name,
          npcRole: (npc as { role?: string }).role,
          requestText: npc.encounterTrigger.requestText,
          encounterId: npc.encounterTrigger.encounterId,
          documentSetId: npc.encounterTrigger.documentSetId,
          encounterType: (npc.encounterTrigger as { encounterType?: string }).encounterType,
        });
        try { this.sound.play('sfx_interact', { volume: 0.35 }); } catch (_) {}
        return;
      }

      // First-time NPC discovery sparkle — celebrate the moment
      if (!this.completedNPCs.has(npc.id)) {
        this.cameras.main.flash(150, 200, 200, 255, false);
        if (this.textures.exists('particle_circle')) {
          const sparkle = this.add.particles(ia.sprite.x, ia.sprite.y, 'particle_circle', {
            speed: { min: 40, max: 90 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffd700, 0xffd700, 0xffa500, 0xffec8b],
            lifespan: 400,
            quantity: 4,
            depth: 99,
            emitting: false,
          } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
          sparkle.explode(4);
          this.time.delayedCall(500, () => sparkle.destroy());
        }
      }

      // Boss encounter — dramatic camera zoom-in
      if (npc.isFinalBoss) {
        this.cameras.main.zoomTo(1.15, 300, 'Sine.easeInOut');
      }

      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_INTERACT_NPC, {
        npcId: npc.id,
        npcName: npc.name,
        sceneId: npc.sceneId,
        isFinalBoss: npc.isFinalBoss,
      });
    } else if (ia.type === 'zone') {
      const zone = ia.data as InteractionZone;
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_INTERACT_ZONE, {
        zoneId: zone.id,
        zoneName: zone.name,
        sceneId: zone.sceneId,
      });
    } else if (ia.type === 'hallwayBoard') {
      // Hallway bulletin board — readable, not collected (re-readable on re-entry)
      const boardData = ia.data as { title: string; content: string };
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_INTERACT_ITEM, {
        itemId: ia.id,
        title: boardData.title,
        fact: boardData.content,
        type: 'poster',
        isHallwayBoard: true,
      });
      // Subtle flash — lighter than item collection
      this.cameras.main.flash(150, 255, 255, 200, false);
    } else {
      const item = ia.data as EducationalItem;
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_INTERACT_ITEM, {
        itemId: item.id,
        title: item.title,
        fact: item.fact,
        type: item.type,
      });

      // Item collection sparkle — warm gold camera flash
      this.cameras.main.flash(200, 255, 255, 150, false);

      // Sparkle particles at the item's position
      if (this.textures.exists('particle_circle')) {
        const emitter = this.add.particles(ia.sprite.x, ia.sprite.y, 'particle_circle', {
          speed: { min: 30, max: 80 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0xffd700, 0xffa500, 0xffec8b],
          lifespan: 500,
          quantity: 8,
          depth: 99,
          emitting: false,
        } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
        emitter.explode(8);
        this.time.delayedCall(600, () => emitter.destroy());
      }
    }
  }

  // ── Answer feedback (correct/incorrect) ────────────────────────
  private onAnswerFeedback = (data: { type: string }) => {
    if (!this.scene.isActive()) return;

    if (data.type === 'correct') {
      // Green tint overlay that fades out (instead of harsh camera flash)
      const overlay = this.add.rectangle(
        this.cameras.main.midPoint.x, this.cameras.main.midPoint.y,
        this.cameras.main.width + 100, this.cameras.main.height + 100,
        0x44ff88, 0.18,
      ).setDepth(200).setScrollFactor(0);
      this.tweens.add({
        targets: overlay, alpha: 0, duration: 400,
        ease: 'Sine.easeOut',
        onComplete: () => overlay.destroy(),
      });

      // Sparkle particles at player position
      if (this.player && this.textures.exists('particle_circle')) {
        const emitter = this.add.particles(this.player.x, this.player.y - 8, 'particle_circle', {
          speed: { min: 40, max: 100 },
          angle: { min: 220, max: 320 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [0x44ff88, 0x88ffbb, 0xffd700],
          lifespan: 500,
          quantity: 10,
          depth: 99,
          emitting: false,
        } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
        emitter.explode(10);
        this.time.delayedCall(600, () => emitter.destroy());
      }

      // Subtle zoom pulse
      this.cameras.main.zoomTo(1.02, 100, 'Sine.easeOut', false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) this.cameras.main.zoomTo(1, 200, 'Sine.easeIn');
      });

    } else if (data.type === 'incorrect') {
      // Red tint overlay that fades out
      const overlay = this.add.rectangle(
        this.cameras.main.midPoint.x, this.cameras.main.midPoint.y,
        this.cameras.main.width + 100, this.cameras.main.height + 100,
        0xff4444, 0.15,
      ).setDepth(200).setScrollFactor(0);
      this.tweens.add({
        targets: overlay, alpha: 0, duration: 350,
        ease: 'Sine.easeOut',
        onComplete: () => overlay.destroy(),
      });

      // Gentle shake
      this.cameras.main.shake(200, 0.005);
    }
  };

  // ── Resume after dialogue ──────────────────────────────────────
  private onDialogueComplete = () => {
    if (!this.scene.isActive()) return;
    this.paused = false;
    this.lastActivityAt = this.time.now; // Restart idle-hint grace after dialogue closes

    // Zoom back from boss encounter
    if (this.cameras.main.zoom !== 1) {
      this.cameras.main.zoomTo(1, 300, 'Sine.easeInOut');
    }

    // Fade out dialogue dim overlay
    if (this.dialogueDimOverlay) {
      this.tweens.add({
        targets: this.dialogueDimOverlay,
        fillAlpha: 0,
        duration: 300,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.dialogueDimOverlay?.destroy();
          this.dialogueDimOverlay = undefined;
        }
      });
    }

    // Re-focus the canvas so keyboard input works after React overlays stole focus.
    // tabIndex ensures the canvas is focusable; double-attempt covers slow React unmounts.
    const canvas = this.game.canvas;
    if (canvas.tabIndex < 0) canvas.tabIndex = 0;
    this.time.delayedCall(50, () => { canvas.focus(); });
    this.time.delayedCall(300, () => { if (document.activeElement !== canvas) canvas.focus(); });
  };

  // ── Pause from modal (intro / help icon) ───────────────────────
  private onPauseFromModal = () => {
    if (!this.scene.isActive()) return;
    this.paused = true;
  };

  /** Player declined the encounter narrative card — unpause and allow re-trigger on next approach.
   *  F-02 fix (Run 07): do NOT clear encounterTriggered here — the player is still standing
   *  inside the trigger radius, so update() would re-pop the alert on the next frame.
   *  Instead mark the decline; the update() loop re-arms once they leave the radius. */
  private onResumeFromDecline = () => {
    this.paused = false;
    if (this.encounterTriggered) {
      this.encounterDeclined = true;
    }
  };

  // ── Lightweight NPC speech bubble (Run 07, F-07) ────────────────
  /** Brief floating one-liner above an NPC — for post-encounter "talk again"
   *  moments that don't warrant the full dialogue overlay. Auto-fades. */
  private npcSpeechBubble?: Phaser.GameObjects.Container;
  private showNpcSpeechBubble(ia: InteractableData, line: string): void {
    // Replace any bubble already showing (rapid re-presses shouldn't stack)
    if (this.npcSpeechBubble) {
      this.tweens.killTweensOf(this.npcSpeechBubble);
      this.npcSpeechBubble.destroy();
      this.npcSpeechBubble = undefined;
    }
    const text = this.add.text(0, 0, line, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#222222',
      wordWrap: { width: 180 },
      align: 'center',
    }).setOrigin(0.5, 1);
    const pad = 6;
    const bg = this.add.rectangle(
      0, pad, text.width + pad * 2, text.height + pad * 2, 0xfffbe8, 0.95,
    ).setStrokeStyle(2, 0x222222).setOrigin(0.5, 1);
    const bubble = this.add.container(ia.sprite.x, ia.sprite.y - TILE * 1.1, [bg, text])
      .setDepth(95)
      .setAlpha(0);
    this.npcSpeechBubble = bubble;
    try { this.sound.play('sfx_interact', { volume: 0.3 }); } catch (_) {}
    this.tweens.add({ targets: bubble, alpha: 1, y: bubble.y - 4, duration: 180, ease: 'Sine.easeOut' });
    this.time.delayedCall(2400, () => {
      if (this.npcSpeechBubble !== bubble) return;
      this.tweens.add({
        targets: bubble,
        alpha: 0,
        duration: 250,
        onComplete: () => {
          bubble.destroy();
          if (this.npcSpeechBubble === bubble) this.npcSpeechBubble = undefined;
        },
      });
    });
  }

  // ── Stop NPC pulse on interaction ──────────────────────────────
  private stopNpcPulse(ia: InteractableData) {
    if (this.npcPulseTarget === ia && this.npcPulseTween) {
      this.npcPulseTween.stop();
      this.npcPulseTween = null;
      ia.sprite.setScale(1); // Reset to neutral scale
      localStorage.setItem(`pq:room:${this.room.id}:npcPulsed`, '1');
      this.npcPulseTarget = null;
    }
  }

  // ── Shared checkmark helper (Phase 27 VIS-08) ─────────────────
  /** Render a green checkmark at (x, y) at the given depth.
   *  When pop=true, starts at scale 0 and pops to scale 1 (Back.easeOut, 250ms)
   *  for live-completion moments (Commandment 6 — celebrate learning moments).
   *  pop=false is used at render time when the room is loaded already-completed. */
  private addCompletionCheck(x: number, y: number, depth: number, pop = false): void {
    const mark = this.add.text(x, y, '✓', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(depth);

    if (pop) {
      mark.setScale(0);
      this.tweens.add({
        targets: mark,
        scale: 1,
        duration: 250,
        ease: 'Back.easeOut',
      });
    }
  }

  // ── Public: update completion state from React ─────────────────
  updateCompletionState(npcs: string[], zones: string[], items: string[]) {
    // Guard: bail if scene is not active (called from React, may race a transition)
    if (!this.scene.isActive()) return;

    const newNPCs = new Set(npcs);
    const newZones = new Set(zones);
    const newItems = new Set(items);

    // ── Detect newly completed zones ──────────────────────────────
    for (const id of Array.from(newZones)) {
      if (this.prevCompletedZones.has(id)) continue; // already known

      // Kill the pulsing glow ring
      const glow = this.zoneGlows.get(id);
      if (glow) {
        glow.tween.stop();
        this.tweens.add({
          targets: glow.ring,
          strokeAlpha: 0,
          scale: 0.6,
          duration: 300,
          ease: 'Sine.easeOut',
          onComplete: () => { glow.ring.destroy(); },
        });
        this.zoneGlows.delete(id);
      }

      // Pop checkmark on the zone sprite
      const ia = this.interactables.find(i => i.type === 'zone' && i.id === id);
      if (ia) {
        this.addCompletionCheck(ia.sprite.x, ia.sprite.y - 16, ia.sprite.depth + 1, true);
      }

      // Quiet completion tick — distinct from NPC banner, softer than room fanfare (Commandment 8)
      try { this.sound.play('sfx_sorter_correct', { volume: 0.25, rate: 1.1 }); } catch (_) {}
    }

    // ── Detect newly completed NPCs ───────────────────────────────
    for (const id of Array.from(newNPCs)) {
      if (this.prevCompletedNPCs.has(id)) continue; // already known

      const ia = this.interactables.find(i => i.type === 'npc' && i.id === id);
      if (ia) {
        // Fade-out instead of snap (Commandment 1 + parity with reload render)
        this.tweens.add({
          targets: ia.sprite,
          alpha: 0.4,
          duration: 400,
          ease: 'Sine.easeOut',
        });
        ia.sprite.setTint(0x888888); // tint is subtle under fade — immediate is fine
        // Pop the live checkmark (same position as the at-render mark in the NPC loop)
        this.addCompletionCheck(ia.sprite.x, ia.sprite.y - 20, ia.sprite.depth + 1, true);
      }

      // F-21 fix (Run 07): clear the "talk to me!" speech-bubble marker — it
      // used to keep bobbing over the faded-out NPC forever after completion.
      const bubble = this.npcBubbles.get(id);
      if (bubble) {
        this.npcBubbles.delete(id);
        this.tweens.killTweensOf(bubble);
        this.tweens.add({
          targets: bubble,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          ease: 'Sine.easeOut',
          onComplete: () => bubble.destroy(),
        });
      }
    }

    // ── Already-completed entries: keep idempotent visual state ───
    for (const ia of this.interactables) {
      if (ia.type === 'npc' && newNPCs.has(ia.id) && this.prevCompletedNPCs.has(ia.id)) {
        // Sprite stays dimmed — no re-pop
        if (ia.sprite.alpha > 0.5) {
          ia.sprite.setAlpha(0.4);
          ia.sprite.setTint(0x888888);
        }
      }
      if (ia.type === 'item' && newItems.has(ia.id)) {
        ia.sprite.setAlpha(0.4);
        this.tweens.killTweensOf(ia.sprite);
      }
    }

    // ── Advance the prev-sets for next diff ───────────────────────
    this.prevCompletedNPCs = newNPCs;
    this.prevCompletedZones = newZones;
    this.completedNPCs = newNPCs;
    this.completedZones = newZones;
    this.collectedItems = newItems;
  }
}
