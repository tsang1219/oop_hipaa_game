import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../EventBridge';
import { generateAllTextures, furnitureTextureKey, npcTextureKey, npcTypeFromId, objectTextureKey } from '../SpriteFactory';
import {
  ENCOUNTER_WAVES_INBOUND,
  ENCOUNTER_WAVE_BUDGETS,
  ENCOUNTER_AVAILABLE_TOWERS,
} from '../../game/breach-defense/constants';
import { getHallwayBoard } from '../../data/hallwayContent';
import { isDemoActive } from '@/lib/demoSession';
import type { BreachDefenseInitData } from './BreachDefenseScene';
import type { Room, NPC, InteractionZone, EducationalItem, Position } from '@shared/schema';

const TILE = 32;
const MOVE_SPEED = 160; // pixels/sec

// ── Per-room floor style configuration ───────────────────────────────────────
// Each entry holds the four tile shade variants (checkerboard 2x2 pattern),
// a bevel-highlight colour and a bevel-shadow/grout colour.
const FLOOR_STYLES = {
  er: {
    tileShades: [0xd8e0e4, 0xd0d8de, 0xc8d2d8, 0xdce4e8],
    highlightColor: 0xe8f0f4,
    shadowColor: 0xa8b4bc,
  },
  lab: {
    tileShades: [0xd4e0d4, 0xccdbcc, 0xc4d4c4, 0xdce8dc],
    highlightColor: 0xe8f4e8,
    shadowColor: 0xa4b4a4,
  },
  it: {
    tileShades: [0x8890a0, 0x848c9c, 0x808898, 0x8c94a4],
    highlightColor: 0x98a0b0,
    shadowColor: 0x686e80,
  },
  break: {
    tileShades: [0xd8c4a0, 0xd4c09c, 0xd0bc98, 0xdcc8a4],
    highlightColor: 0xe8d8b8,
    shadowColor: 0xb8a880,
  },
  records: {
    tileShades: [0xb8b4a0, 0xb4b09c, 0xb0ac98, 0xbcb8a4],
    highlightColor: 0xc8c4b0,
    shadowColor: 0x989488,
  },
  entrance: {
    tileShades: [0xe0dcd4, 0xdcd8d0, 0xd8d4cc, 0xe4e0d8],
    highlightColor: 0xf0ece4,
    shadowColor: 0xc0bcb4,
  },
  // Reception: warm cream porcelain — reads as 64px slabs, not individual tiles
  reception: {
    tileShades: [0xe2d8c4, 0xded4c0, 0xdad0bc, 0xe6dcc8],
    highlightColor: 0xf2e8d4,
    shadowColor: 0xbeb49e,
  },
  // Hallways: slightly cooler/dimmer beige base — runner strip added post-loop
  hallway: {
    tileShades: [0xccc2a6, 0xc8bea2, 0xc4ba9e, 0xd0c6aa],
    highlightColor: 0xdcd2b6,
    shadowColor: 0xaaa092,
  },
  default: {
    tileShades: [0xd4c9a8, 0xd0c5a4, 0xccc0a0, 0xd8cdb0],
    highlightColor: 0xe2d8bc,
    shadowColor: 0xb8ad94,
  },
} as const;

type FloorStyleKey = keyof typeof FLOOR_STYLES;

/** Map a room id to its floor style key.
 *  Order matters: 'hallway' is checked FIRST so 'hallway_reception_break'
 *  resolves to 'hallway' rather than 'reception' or 'break'. */
function floorStyleFor(roomId: string): FloorStyleKey {
  if (roomId.includes('hallway'))                                 return 'hallway';
  if (roomId.includes('er') || roomId.includes('emergency'))     return 'er';
  if (roomId.includes('lab'))                                     return 'lab';
  if (roomId.includes('it') || roomId.includes('server'))        return 'it';
  if (roomId.includes('break'))                                   return 'break';
  if (roomId.includes('records'))                                 return 'records';
  if (roomId.includes('entrance') || roomId.includes('lobby'))   return 'entrance';
  if (roomId.includes('reception'))                               return 'reception';
  return 'default';
}
// ─────────────────────────────────────────────────────────────────────────────

// All known music track keys — used to clean up other tracks when changing rooms
const MUSIC_TRACK_KEYS = [
  'music_hub',
  'music_exploration',
  'music_breach',
  'music_demo_er',
  'music_demo_break_room',
  'music_demo_records_room',
] as const;

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

interface InteractableData {
  type: 'npc' | 'zone' | 'item' | 'hallwayBoard';
  id: string;
  data: NPC | InteractionZone | EducationalItem | { x: number; y: number; title: string; content: string };
  sprite: Phaser.GameObjects.Sprite;
}

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

  // Door navigation state (Phase 12)
  private nearDoor: { id: string; targetRoomId: string; x: number; y: number; side: string; label: string } | null = null;
  private doorStates: Record<string, 'locked' | 'available' | 'completed'> = {};
  private doorVisuals: Phaser.GameObjects.GameObject[] = [];
  private pendingSpawnTileX: number | null = null;
  private pendingSpawnTileY: number | null = null;
  private transitioning = false;

  // Background music
  private bgMusic?: Phaser.Sound.BaseSound;
  private readonly musicBaseVolume = 0.13;

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
    doorStates?: Record<string, 'locked' | 'available' | 'completed'>;
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

    // Reset transitioning so scene restart doesn't freeze movement
    this.transitioning = false;
    this.nearDoor = null;

    // Store door states for visual rendering
    this.doorStates = data.doorStates ?? {};

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
  }

  create() {
    // Reset camera fade from previous room transition (fixes black screen on scene.restart)
    // The fadeOut effect from the previous room may still be active after scene.restart()
    (this.cameras.main as any).fadeEffect?.reset();
    this.cameras.main.setAlpha(1);

    const room = this.room;
    const w = room.width * TILE;
    const h = room.height * TILE;

    // Generate extra textures if not already done (idempotent)
    generateAllTextures(this);

    // Ensure player_down texture exists (fallback if BootScene hasn't generated it yet)
    // Matches SpriteFactory drawCharacter() chibi style — blue shirt, brown hair "new employee"
    if (!this.textures.exists('player_down')) {
      const g = this.add.graphics();
      const SKIN = 0xfdbcb4;
      const SKIN_SHADOW = 0xdba49c;  // darken(SKIN, 30)
      const SKIN_HIGHLIGHT = 0xffd0ce; // lighten(SKIN, 20)
      const HAIR = 0x8b4513;
      const HAIR_LIGHT = 0xa85d2c;   // lighten(HAIR, 25)
      const HAIR_DARK = 0x6a2400;    // darken(HAIR, 35)
      const SHIRT = 0x4a90e2;
      const SHIRT_LIGHT = 0x6daaf7;  // lighten(SHIRT, 25)
      const SHIRT_DARK = 0x2a70c2;   // darken(SHIRT, 30)

      // Hair (chibi head — slightly larger)
      g.fillStyle(HAIR);
      g.fillRect(10, 3, 12, 5);   // top hair mass
      g.fillRect(9, 5, 2, 5);     // left sideburns
      g.fillRect(21, 5, 2, 5);    // right sideburns
      // Hair highlight (top-left)
      g.fillStyle(HAIR_LIGHT);
      g.fillRect(11, 3, 3, 1);
      g.fillRect(10, 4, 1, 2);
      // Hair shadow (bottom-right)
      g.fillStyle(HAIR_DARK);
      g.fillRect(21, 4, 1, 4);
      g.fillRect(18, 7, 4, 1);

      // Head (larger chibi face)
      g.fillStyle(SKIN);
      g.fillRect(11, 5, 10, 9);
      // Face highlight (left edge)
      g.fillStyle(SKIN_HIGHLIGHT);
      g.fillRect(11, 6, 1, 7);
      // Face shadow (right edge + chin)
      g.fillStyle(SKIN_SHADOW);
      g.fillRect(20, 6, 1, 7);
      g.fillRect(12, 13, 8, 1);

      // Eyes with white sparkle
      g.fillStyle(0x000000);
      g.fillRect(13, 9, 2, 2);    // left eye
      g.fillRect(17, 9, 2, 2);    // right eye
      g.fillStyle(0xffffff);
      g.fillRect(13, 9, 1, 1);    // left sparkle
      g.fillRect(17, 9, 1, 1);    // right sparkle

      // Mouth
      g.fillStyle(0xd4937a);       // darken(SKIN, 45)
      g.fillRect(15, 12, 2, 1);

      // Neck
      g.fillStyle(SKIN);
      g.fillRect(14, 14, 4, 1);
      g.fillStyle(SKIN_SHADOW);
      g.fillRect(17, 14, 1, 1);

      // Shirt body
      g.fillStyle(SHIRT);
      g.fillRect(10, 15, 12, 9);
      // Shirt highlight (left edge)
      g.fillStyle(SHIRT_LIGHT);
      g.fillRect(10, 15, 1, 8);
      // Shirt shadow (right edge + bottom)
      g.fillStyle(SHIRT_DARK);
      g.fillRect(21, 15, 1, 9);
      g.fillRect(11, 23, 10, 1);
      // Arms / sleeves
      g.fillStyle(SHIRT);
      g.fillRect(7, 16, 3, 6);
      g.fillRect(22, 16, 3, 6);
      g.fillStyle(SHIRT_DARK);
      g.fillRect(9, 16, 1, 6);
      g.fillRect(24, 16, 1, 6);
      // Hands
      g.fillStyle(SKIN);
      g.fillRect(7, 22, 3, 2);
      g.fillRect(22, 22, 3, 2);

      // Pants
      g.fillStyle(0x333333);
      g.fillRect(11, 24, 4, 4);
      g.fillRect(17, 24, 4, 4);

      // Two-toned shoes
      g.fillStyle(0x5d4037);        // shoe base (dark brown)
      g.fillRect(11, 28, 4, 2);
      g.fillRect(17, 28, 4, 2);
      g.fillStyle(0x8d6e63);        // shoe highlight (lighter brown)
      g.fillRect(11, 28, 4, 1);
      g.fillRect(17, 28, 4, 1);

      g.generateTexture('player_down', TILE, TILE);
      g.destroy();
    }

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

    // ── Floor — beveled hospital tiles with room-specific color variation ──
    const floor = this.add.graphics();
    const roomId = room.id.toLowerCase();
    const floorStyle = FLOOR_STYLES[floorStyleFor(roomId)];
    const { tileShades, highlightColor, shadowColor } = floorStyle;

    // Pre-compute door tiles for ER accent ring and contact-shadow exclusions
    const doors: Array<{ x: number; y: number }> = (room as any).doors || [];

    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        const shadeIdx = ((x % 2) + (y % 2) * 2) % tileShades.length;
        const shade = tileShades[shadeIdx];
        const px = x * TILE;
        const py = y * TILE;

        // Fill tile base
        floor.fillStyle(shade, 1);
        floor.fillRect(px, py, TILE, TILE);

        // 1px highlight on top and left edges (beveled look)
        floor.fillStyle(highlightColor, 0.5);
        floor.fillRect(px, py, TILE, 1);       // top edge
        floor.fillRect(px, py, 1, TILE);        // left edge

        // 1px shadow on bottom and right edges
        floor.fillStyle(shadowColor, 0.5);
        floor.fillRect(px, py + TILE - 1, TILE, 1); // bottom edge
        floor.fillRect(px + TILE - 1, py, 1, TILE);  // right edge

        // Subtle inner cross pattern on every other tile (linoleum texture)
        // — Skipped for reception (large-format tile illusion uses 2x2 grout instead)
        if ((x + y) % 2 === 0 && !roomId.includes('reception') && !roomId.includes('hallway')) {
          floor.fillStyle(highlightColor, 0.15);
          floor.fillRect(px + 8, py + 2, 16, 1);  // horizontal line
          floor.fillRect(px + 14, py + 2, 1, 28);  // vertical line
        }

        // Specular highlight on ~20% of tiles (polished floor gleam)
        const hashVal = ((x * 7 + y * 13 + 37) * 2654435761) >>> 0;
        if (hashVal % 5 === 0) {
          floor.fillStyle(0xffffff, 0.08);
          floor.fillRect(px + 6 + (hashVal % 12), py + 4 + (hashVal % 10) % 8, 4, 2);
        }

        // Grout lines (thin dark lines between tiles)
        // Reception uses large-format (2x2) grout only at slab boundaries
        if (roomId.includes('reception')) {
          // Large-format tile illusion — grout only at every 2nd boundary
          floor.fillStyle(shadowColor, 0.35);
          if (x % 2 === 1) {
            floor.fillRect(px + TILE - 1, py, 1, TILE); // right grout on odd x
          }
          if (y % 2 === 1) {
            floor.fillRect(px, py + TILE - 1, TILE, 1); // bottom grout on odd y
          }
        } else {
          floor.fillStyle(shadowColor, 0.3);
          floor.fillRect(px + TILE - 1, py, 1, TILE); // right grout
          floor.fillRect(px, py + TILE - 1, TILE, 1); // bottom grout
        }

        // Room-specific floor pattern detail (boosted opacity for visibility)
        if (roomId.includes('er') || roomId.includes('emergency')) {
          // ER: Non-slip diamond pattern — visible safety texture
          if ((x + y) % 2 === 0) {
            floor.fillStyle(0xffffff, 0.12);
            floor.fillRect(px + 10, py + 10, 12, 1);
            floor.fillRect(px + 15, py + 5, 1, 12);
          }
          // ER: pale red accent ring near door tiles (urgency — hazard accents near entrances)
          const nearDoor = doors.some(d => Math.abs(d.x - x) <= 1 && Math.abs(d.y - y) <= 1);
          if (nearDoor) {
            floor.fillStyle(0xff6b6b, 0.07);
            floor.fillRect(px, py, TILE, TILE);
          }
        } else if (roomId.includes('lab')) {
          // Lab: Grid dots + thin drain lines — clean room look
          floor.fillStyle(0xffffff, 0.12);
          floor.fillRect(px + 8, py + 8, 2, 2);
          floor.fillRect(px + 22, py + 22, 2, 2);
          if (y % 3 === 0) {
            floor.fillStyle(shadowColor, 0.2);
            floor.fillRect(px, py + TILE - 2, TILE, 1);
          }
        } else if (roomId.includes('break')) {
          // Break room: Warm parquet wood planks — clearly different from tile
          if (x % 2 === 0) {
            floor.fillStyle(highlightColor, 0.25);
            floor.fillRect(px + 1, py + 1, 14, 30);
            // Wood grain lines
            floor.fillStyle(shadowColor, 0.12);
            floor.fillRect(px + 4, py + 2, 1, 28);
            floor.fillRect(px + 10, py + 2, 1, 28);
          } else {
            floor.fillStyle(shadowColor, 0.15);
            floor.fillRect(px + 16, py + 1, 14, 30);
            floor.fillStyle(highlightColor, 0.08);
            floor.fillRect(px + 20, py + 2, 1, 28);
            floor.fillRect(px + 26, py + 2, 1, 28);
          }
        } else if (roomId.includes('it') || roomId.includes('server')) {
          // Server room: Raised floor panel gaps — clearly technical
          floor.fillStyle(0x000000, 0.15);
          floor.fillRect(px, py, TILE, 1);
          floor.fillRect(px, py, 1, TILE);
          // Vent holes on every 3rd panel
          if ((x + y) % 3 === 0) {
            floor.fillStyle(0x000000, 0.12);
            for (let vy = 0; vy < 3; vy++) {
              floor.fillRect(px + 8, py + 8 + vy * 8, 16, 2);
            }
          }
        } else if (roomId.includes('records')) {
          // Records room: Commercial carpet weave — row-offset dot grid + pile lines
          // Offset dot positions on odd rows to simulate carpet weave
          const dotOffsetX = y % 2 === 1 ? 4 : 0;
          floor.fillStyle(0x000000, 0.06);
          floor.fillRect(px + 4 + dotOffsetX, py + 4, 2, 2);
          floor.fillRect(px + 20 + dotOffsetX, py + 20, 2, 2);
          floor.fillRect(px + 12 + dotOffsetX, py + 12, 2, 2);
          floor.fillRect(px + 28 + dotOffsetX, py + 4, 2, 2);
          floor.fillRect(px + 4 + dotOffsetX, py + 28, 2, 2);
          // Faint horizontal pile lines every 8px
          if (py % 8 < TILE) {
            for (let pile = 0; pile < 4; pile++) {
              floor.fillStyle(0x000000, 0.04);
              floor.fillRect(px, py + pile * 8, TILE, 1);
            }
          }
        } else if (roomId.includes('entrance') || roomId.includes('lobby')) {
          // Lobby: Marble veining effect
          if ((x + y) % 3 === 0) {
            floor.fillStyle(0xffffff, 0.08);
            floor.fillRect(px + 4, py + 12, 24, 1);
            floor.fillRect(px + 8, py + 8, 1, 16);
          }
        } else if (roomId.includes('reception')) {
          // Reception: Navy accent diamond at each 2x2 slab intersection
          // Drawn at bottom-right corner of slab (odd x, odd y tile)
          if (x % 2 === 1 && y % 2 === 1) {
            floor.fillStyle(0x2c4a6e, 0.18);
            // Four fillRects forming a 6px diamond
            floor.fillRect(px + TILE - 3, py + TILE - 6, 6, 2); // top bar
            floor.fillRect(px + TILE - 6, py + TILE - 4, 12, 2); // mid-top bar
            floor.fillRect(px + TILE - 6, py + TILE - 2, 12, 2); // mid-bot bar
            floor.fillRect(px + TILE - 3, py + TILE,     6, 2); // bottom bar
          }
        }
      }
    }

    // Hallway runner strip — corridor identity down the walkway row (y=3)
    if (roomId.includes('hallway')) {
      const runnerRowY = 3; // middle walkway row of the 20x7 hallway
      const runnerX = 1 * TILE;           // inset 1 tile from left
      const runnerW = (room.width - 2) * TILE; // inset 1 tile from right
      const runnerY = runnerRowY * TILE;
      // Muted teal base
      floor.fillStyle(0x3e6b6b, 0.55);
      floor.fillRect(runnerX, runnerY, runnerW, TILE);
      // Top border
      floor.fillStyle(0x2a4a4a, 0.7);
      floor.fillRect(runnerX, runnerY, runnerW, 2);
      // Bottom border
      floor.fillRect(runnerX, runnerY + TILE - 2, runnerW, 2);
      // Stitch ticks every 16px along top border
      floor.fillStyle(0x5a8a8a, 0.5);
      for (let tx = runnerX; tx < runnerX + runnerW; tx += 16) {
        floor.fillRect(tx, runnerY, 3, 2);
        floor.fillRect(tx, runnerY + TILE - 2, 3, 2);
      }
    }

    // ── Wall/floor contact shadow ─────────────────────────────────
    // A 3-step vertical gradient at the top edge of each floor tile directly
    // below a wall bottom — classic SNES ambient-occlusion strip.
    // Drawn into the same `floor` Graphics object so depth is unchanged.
    for (const obs of room.obstacles) {
      if ((obs as any).type !== 'wall') continue;
      const rowY = obs.y + obs.height; // floor row immediately below wall bottom
      if (rowY >= room.height) continue; // off-map (no floor below)
      for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
        // Skip door-adjacent columns so walkable openings stay clean
        const nearDoorH = doors.some(d => d.y === rowY - 1 && Math.abs(d.x - wx) <= 1);
        if (nearDoorH) continue;
        // Skip tiles occupied by another obstacle (furniture or wall above)
        const blocked = room.obstacles.some((o: any) =>
          wx >= o.x && wx < o.x + o.width && rowY >= o.y && rowY < o.y + o.height
        );
        if (blocked) continue;
        const spx = wx * TILE;
        const spy = rowY * TILE;
        // Step 1 — darkest 3px at very top (directly below wall)
        floor.fillStyle(0x000000, 0.18);
        floor.fillRect(spx, spy, TILE, 3);
        // Step 2 — medium band +3 to +5
        floor.fillStyle(0x000000, 0.10);
        floor.fillRect(spx, spy + 3, TILE, 2);
        // Step 3 — lightest fade +5 to +8
        floor.fillStyle(0x000000, 0.05);
        floor.fillRect(spx, spy + 5, TILE, 3);
      }
    }
    // ─────────────────────────────────────────────────────────────

    // Room-specific ambient color overlay — visible mood tint
    const roomTints: Record<string, { color: number; alpha: number }> = {
      hospital_entrance: { color: 0xf5e6d0, alpha: 0.06 },  // Warm lobby glow
      reception: { color: 0x4a90e2, alpha: 0.06 },           // Professional blue
      records_room: { color: 0x8faa80, alpha: 0.06 },        // Archival green
      er: { color: 0xff6b6b, alpha: 0.05 },                  // Urgent red
      lab: { color: 0x9b59b6, alpha: 0.06 },                 // Scientific purple
      break_room: { color: 0xf39c12, alpha: 0.08 },          // Warm amber — strongest
      it_office: { color: 0x4488cc, alpha: 0.06 },           // Cool tech blue
    };
    const tintCfg = roomTints[this.room.id];
    if (tintCfg) {
      this.add.rectangle(
        w / 2, h / 2, w, h, tintCfg.color, tintCfg.alpha
      ).setDepth(0);
    }

    // ── Room-specific decorative details ────────────────────────
    const decorGfx = this.add.graphics().setDepth(1);

    // Baseboard strip along bottom of walls — universal room detail
    decorGfx.fillStyle(0x4a3f2e, 0.5);
    for (const obs of room.obstacles) {
      if ((obs as any).type === 'wall') {
        const bx = obs.x * TILE;
        const by = (obs.y + obs.height) * TILE - 3;
        const bw = obs.width * TILE;
        decorGfx.fillRect(bx, by, bw, 3);
        // Baseboard highlight
        decorGfx.fillStyle(0x6a5b44, 0.4);
        decorGfx.fillRect(bx, by, bw, 1);
        decorGfx.fillStyle(0x4a3f2e, 0.5);
      }
    }

    // Room-specific wall decorations — distinct visual identity per room
    if (roomId.includes('reception')) {
      // Welcome sign on north wall
      decorGfx.fillStyle(0x4a90e2, 0.2);
      decorGfx.fillRect(TILE * 2, TILE + 4, TILE * 3, TILE / 2);
      decorGfx.lineStyle(1, 0x4a90e2, 0.35);
      decorGfx.strokeRect(TILE * 2, TILE + 4, TILE * 3, TILE / 2);
      // Clock on wall
      decorGfx.fillStyle(0xffffff, 0.15);
      decorGfx.fillCircle(TILE * 16, TILE + 10, 8);
      decorGfx.lineStyle(1, 0x333333, 0.2);
      decorGfx.strokeCircle(TILE * 16, TILE + 10, 8);
    } else if (roomId.includes('er')) {
      // Red cross symbol on wall — larger, more prominent
      decorGfx.fillStyle(0xff0000, 0.18);
      decorGfx.fillRect(w / 2 - 8, TILE + 2, 16, 6);
      decorGfx.fillRect(w / 2 - 3, TILE - 2, 6, 16);
      // "EMERGENCY" stripe along top
      decorGfx.fillStyle(0xff0000, 0.08);
      decorGfx.fillRect(TILE, TILE - 2, w - TILE * 2, 3);
    } else if (roomId.includes('lab')) {
      // Biohazard warning placard on north wall
      decorGfx.fillStyle(0xf39c12, 0.2);
      decorGfx.fillRect(TILE * 2, TILE + 4, TILE, TILE / 2);
      decorGfx.lineStyle(1, 0xf39c12, 0.3);
      decorGfx.strokeRect(TILE * 2, TILE + 4, TILE, TILE / 2);
      // Safety shower sign
      decorGfx.fillStyle(0x27ae60, 0.15);
      decorGfx.fillRect(TILE * 15, TILE + 4, TILE, TILE / 2);
    } else if (roomId.includes('it') || roomId.includes('server')) {
      // Network status lights on north wall (server room feel)
      for (let lx = 0; lx < 4; lx++) {
        decorGfx.fillStyle(lx % 3 === 0 ? 0xff4444 : 0x44ff44, 0.2);
        decorGfx.fillCircle(TILE * 5 + lx * TILE * 3, TILE + 8, 3);
      }
      // "RESTRICTED" label
      decorGfx.fillStyle(0xff4444, 0.12);
      decorGfx.fillRect(w - TILE * 4, TILE + 4, TILE * 2, TILE / 3);
    } else if (roomId.includes('break')) {
      // Menu board on north wall
      decorGfx.fillStyle(0x2c2c2c, 0.2);
      decorGfx.fillRect(TILE * 12, TILE + 2, TILE * 2, TILE - 4);
      decorGfx.fillStyle(0xffffff, 0.12);
      decorGfx.fillRect(TILE * 12 + 4, TILE + 6, TILE * 2 - 8, 3);
      decorGfx.fillRect(TILE * 12 + 4, TILE + 12, TILE * 2 - 8, 2);
      decorGfx.fillRect(TILE * 12 + 4, TILE + 17, TILE - 4, 2);
    } else if (roomId.includes('records')) {
      // "MEDICAL RECORDS" label strip on north wall
      decorGfx.fillStyle(0x2ecc71, 0.12);
      decorGfx.fillRect(TILE * 6, TILE + 2, TILE * 4, TILE / 3);
      // Section labels (A, B, C indicators)
      for (let s = 0; s < 3; s++) {
        decorGfx.fillStyle(0xffffff, 0.1);
        decorGfx.fillRect(TILE * (4 + s * 5), TILE + 4, TILE / 2, TILE / 3);
      }
    } else if (roomId.includes('entrance') || roomId.includes('lobby')) {
      // Hospital logo placeholder on north wall
      decorGfx.fillStyle(0x4a90e2, 0.15);
      decorGfx.fillCircle(w / 2, TILE + 10, 10);
      decorGfx.lineStyle(1, 0x4a90e2, 0.25);
      decorGfx.strokeCircle(w / 2, TILE + 10, 10);
      // "H" inside
      decorGfx.fillStyle(0xffffff, 0.2);
      decorGfx.fillRect(w / 2 - 4, TILE + 5, 2, 10);
      decorGfx.fillRect(w / 2 + 2, TILE + 5, 2, 10);
      decorGfx.fillRect(w / 2 - 4, TILE + 9, 10, 2);
    }

    // Room-specific floor details
    if (roomId.includes('er') || roomId.includes('emergency')) {
      // ER: floor warning stripes near edges
      decorGfx.fillStyle(0xffcc00, 0.08);
      decorGfx.fillRect(0, 0, w, 4);
      decorGfx.fillRect(0, h - 4, w, 4);
    } else if (roomId.includes('lab')) {
      // Lab: biohazard symbol hint in corner
      decorGfx.fillStyle(0xf39c12, 0.06);
      decorGfx.fillCircle(w - 24, h - 24, 12);
      decorGfx.fillStyle(0x000000, 0.04);
      decorGfx.fillCircle(w - 24, h - 24, 6);
    } else if (roomId.includes('it') || roomId.includes('server')) {
      // Server room: floor cable channels
      decorGfx.lineStyle(2, 0x333333, 0.15);
      decorGfx.beginPath();
      decorGfx.moveTo(TILE * 2, TILE);
      decorGfx.lineTo(TILE * 2, h - TILE);
      decorGfx.strokePath();
      decorGfx.beginPath();
      decorGfx.moveTo(w - TILE * 2, TILE);
      decorGfx.lineTo(w - TILE * 2, h - TILE);
      decorGfx.strokePath();
    }

    // ── Ceiling light pools (overhead lighting effect on floor) ──
    const lightGfx = this.add.graphics().setDepth(0);
    const lightSpacing = TILE * 4;
    for (let ly = lightSpacing; ly < h - lightSpacing; ly += lightSpacing) {
      for (let lx = lightSpacing; lx < w - lightSpacing; lx += lightSpacing) {
        // Check we're not on a wall/obstacle
        const tileX = Math.floor(lx / TILE);
        const tileY = Math.floor(ly / TILE);
        const onObstacle = room.obstacles.some((o: any) =>
          tileX >= o.x && tileX < o.x + o.width && tileY >= o.y && tileY < o.y + o.height
        );
        if (!onObstacle) {
          lightGfx.fillStyle(0xffffff, 0.04);
          lightGfx.fillCircle(lx, ly, TILE * 1.5);
          lightGfx.fillStyle(0xffffff, 0.02);
          lightGfx.fillCircle(lx, ly, TILE * 2.5);
        }
      }
    }

    // ── Ambient dust particles — subtle floating motes ──────────
    if (this.textures.exists('particle_circle')) {
      this.add.particles(0, 0, 'particle_circle', {
        x: { min: 0, max: w },
        y: { min: 0, max: h },
        speed: { min: 5, max: 15 },
        angle: { min: 260, max: 280 },   // drift gently upward
        scale: { min: 0.3, max: 0.6 },
        alpha: { start: 0.1, end: 0.25, ease: 'Sine.easeInOut' },
        tint: 0xd4c9a8,                  // warm tone matching floor
        lifespan: { min: 4000, max: 8000 },
        frequency: 500,
        depth: 5,                         // above floor, below furniture
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);

      // Secondary ambient layer — slower, larger particles for depth
      this.add.particles(w / 2, h / 2, 'particle_circle', {
        x: { min: 0, max: w },
        y: { min: 0, max: h },
        speed: { min: 2, max: 8 },
        angle: { min: 250, max: 290 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.15, end: 0 },
        lifespan: { min: 6000, max: 10000 },
        tint: 0xffffcc,
        frequency: 3000,
        quantity: 1,
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig).setDepth(0);

      // Occasional sparkle — brief bright flash particles
      this.add.particles(w / 2, h / 2, 'particle_circle', {
        x: { min: 0, max: w },
        y: { min: 0, max: h },
        speed: { min: 0, max: 5 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 400,
        tint: 0xffffff,
        frequency: 5000,
        quantity: 1,
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig).setDepth(0);
    }

    // ── Obstacles / Walls ────────────────────────────────────────
    this.walls = this.physics.add.staticGroup();
    for (const obs of room.obstacles) {
      const ox = obs.x * TILE;
      const oy = obs.y * TILE;
      const ow = obs.width * TILE;
      const oh = obs.height * TILE;

      const obsType = (obs as any).type as string | undefined;

      if (obsType === 'wall') {
        // Draw wall tiles with depth (highlight top, shadow base)
        const wallG = this.add.graphics();

        // Room-specific wall colors
        let wallBase1: number, wallBase2: number, wallHighlight: number, wallShadow: number, wallMortar: number;
        if (roomId.includes('er') || roomId.includes('emergency')) {
          wallBase1 = 0x5c6570; wallBase2 = 0x566068;
          wallHighlight = 0x7a858e; wallShadow = 0x3a4448; wallMortar = 0x4a5560;
        } else if (roomId.includes('lab')) {
          wallBase1 = 0x606860; wallBase2 = 0x5a6258;
          wallHighlight = 0x7e867e; wallShadow = 0x3e4640; wallMortar = 0x4e564e;
        } else if (roomId.includes('it') || roomId.includes('server')) {
          wallBase1 = 0x4a5060; wallBase2 = 0x444a58;
          wallHighlight = 0x687080; wallShadow = 0x2e3440; wallMortar = 0x3e4450;
        } else {
          wallBase1 = 0x5d4e37; wallBase2 = 0x574930;
          wallHighlight = 0x7a6b52; wallShadow = 0x3a3124; wallMortar = 0x4a3f2e;
        }

        for (let wy = obs.y; wy < obs.y + obs.height; wy++) {
          for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
            const wpx = wx * TILE;
            const wpy = wy * TILE;

            // Main wall fill — use two alternating shades for brick-like pattern
            const isEvenTile = (wx + wy) % 2 === 0;
            const wallBase = isEvenTile ? wallBase1 : wallBase2;
            wallG.fillStyle(wallBase, 1);
            wallG.fillRect(wpx, wpy, TILE, TILE);

            // Horizontal mortar line at 1/3 and 2/3 height
            wallG.fillStyle(wallMortar, 0.6);
            wallG.fillRect(wpx, wpy + 10, TILE, 1);
            wallG.fillRect(wpx, wpy + 21, TILE, 1);

            // Vertical mortar offset (brick bond pattern)
            const vOffset = wy % 2 === 0 ? 16 : 0;
            wallG.fillStyle(wallMortar, 0.5);
            wallG.fillRect(wpx + vOffset, wpy, 1, TILE);

            // Top highlight
            wallG.fillStyle(wallHighlight, 0.6);
            wallG.fillRect(wpx, wpy, TILE, 1);
            wallG.fillRect(wpx, wpy, 1, TILE); // left highlight

            // Bottom shadow (wall meets floor)
            wallG.fillStyle(wallShadow, 0.8);
            wallG.fillRect(wpx, wpy + TILE - 2, TILE, 2);
            wallG.fillRect(wpx + TILE - 1, wpy, 1, TILE); // right shadow

            // Subtle surface texture — tiny noise dots
            if ((wx * 3 + wy * 5) % 4 === 0) {
              const textureTint = Phaser.Display.Color.IntegerToColor(wallHighlight).lighten(10).color;
              wallG.fillStyle(textureTint, 0.3);
              wallG.fillRect(wpx + 8, wpy + 6, 2, 1);
              wallG.fillRect(wpx + 20, wpy + 14, 2, 1);
            }

            // Wainscoting/molding on top of walls (crown molding effect)
            if (wy === obs.y) {
              const moldingBase = Phaser.Display.Color.IntegerToColor(wallHighlight).lighten(15).color;
              const moldingTop = Phaser.Display.Color.IntegerToColor(wallHighlight).lighten(25).color;
              wallG.fillStyle(moldingBase, 0.7);
              wallG.fillRect(wpx, wpy, TILE, 3);
              wallG.fillStyle(moldingTop, 0.5);
              wallG.fillRect(wpx, wpy, TILE, 1);
            }
          }
        }
      } else {
        // Furniture — place a sprite at center of the obstacle area
        const texKey = furnitureTextureKey(obsType);
        if (obs.width === 1 && obs.height === 1) {
          // Drop shadow beneath furniture
          this.add.ellipse(ox + TILE / 2, oy + TILE / 2 + 12, TILE - 4, 8, 0x000000, 0.12);
          this.add.sprite(ox + TILE / 2, oy + TILE / 2, texKey);
          // Subtle furniture base highlight
          this.add.rectangle(ox + TILE / 2, oy + TILE / 2, TILE - 2, TILE - 2)
            .setStrokeStyle(1, 0x000000, 0.08)
            .setFillStyle(0x000000, 0)
            .setDepth(1);
        } else {
          // Drop shadow beneath large furniture
          this.add.ellipse(ox + ow / 2, oy + oh / 2 + oh / 3, ow - 4, oh / 3, 0x000000, 0.15);
          // For multi-tile furniture, tile the sprite across the area
          for (let fy = obs.y; fy < obs.y + obs.height; fy++) {
            for (let fx = obs.x; fx < obs.x + obs.width; fx++) {
              this.add.sprite(fx * TILE + TILE / 2, fy * TILE + TILE / 2, texKey).setDepth(3);
            }
          }
        }
      }

      // Physics collision body (invisible) — skip tiles occupied by doors
      // (doors already declared above at floor render time — reuse same array)
      if (obsType === 'wall' && doors.length > 0) {
        // Build collision per-tile, skipping door tiles (and 1 tile adjacent inward)
        for (let wy = obs.y; wy < obs.y + obs.height; wy++) {
          for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
            const isDoorTile = doors.some((d: any) => {
              // Skip the door tile itself and one tile of clearance
              if (d.x === wx && d.y === wy) return true;
              if (d.x === wx && Math.abs(d.y - wy) <= 1) return true;
              if (d.y === wy && Math.abs(d.x - wx) <= 1) return true;
              return false;
            });
            if (!isDoorTile) {
              const wr = this.add.rectangle(wx * TILE + TILE / 2, wy * TILE + TILE / 2, TILE, TILE);
              wr.setVisible(false);
              this.walls.add(wr);
            }
          }
        }
      } else {
        const wallRect = this.add.rectangle(ox + ow / 2, oy + oh / 2, ow, oh);
        wallRect.setVisible(false);
        this.walls.add(wallRect);
      }
    }

    // ── Educational items ────────────────────────────────────────
    for (const item of room.educationalItems) {
      const collected = this.collectedItems.has(item.id);
      const texKey = objectTextureKey(item.type);
      const sprite = this.add.sprite(item.x * TILE + TILE / 2, item.y * TILE + TILE / 2, texKey);
      sprite.setAlpha(collected ? 0.4 : 1);
      if (collected) {
        sprite.setTint(0x888888);
      }
      sprite.setDepth(10);
      if (!collected) {
        this.tweens.add({
          targets: sprite,
          y: sprite.y - 4,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Item shimmer (alpha pulse)
        this.tweens.add({
          targets: sprite,
          alpha: { from: 1, to: 0.7 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Golden glow ring for uncollected items
        if (!this.collectedItems.has(item.id)) {
          const itemGlow = this.add.circle(sprite.x, sprite.y, 14, 0xffd700, 0)
            .setStrokeStyle(1, 0xffd700, 0)
            .setDepth(sprite.depth - 1);
          this.tweens.add({
            targets: itemGlow,
            strokeAlpha: { from: 0, to: 0.5 },
            scale: { from: 0.7, to: 1.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
      this.interactables.push({ type: 'item', id: item.id, data: item, sprite });
    }

    // ── Hallway bulletin board (Phase 15) ────────────────────────
    if (this.room.id.startsWith('hallway_')) {
      const act = this.getCurrentAct();
      const board = getHallwayBoard(this.room.id, act);
      if (board) {
        const boardX = w / 2;
        const boardY = 64;

        // Board shadow (depth illusion)
        this.add.rectangle(boardX + 2, boardY + 2, 60, 44, 0x000000, 0.3)
          .setDepth(4);
        // Cork board backing with wooden frame
        const boardG = this.add.graphics().setDepth(5);
        // Outer frame (dark wood)
        boardG.fillStyle(0x5a3a1a, 1);
        boardG.fillRect(boardX - 31, boardY - 23, 62, 46);
        // Inner frame highlight
        boardG.fillStyle(0x8B6914, 1);
        boardG.fillRect(boardX - 29, boardY - 21, 58, 42);
        // Cork texture — alternating shades
        boardG.fillStyle(0xa07828, 1);
        boardG.fillRect(boardX - 27, boardY - 19, 54, 38);
        boardG.fillStyle(0x9a7020, 0.5);
        for (let cy = 0; cy < 4; cy++) {
          for (let cx = 0; cx < 6; cx++) {
            if ((cx + cy) % 2 === 0) {
              boardG.fillRect(boardX - 27 + cx * 9, boardY - 19 + cy * 10, 9, 10);
            }
          }
        }
        // Paper note — slightly tilted via offset
        this.add.rectangle(boardX - 1, boardY + 1, 44, 28, 0xe8dcc4).setDepth(6);
        this.add.rectangle(boardX, boardY, 44, 28, 0xF5E6C8).setDepth(6);
        // Paper fold line
        boardG.lineStyle(1, 0xd4c8a8, 0.4);
        boardG.lineBetween(boardX - 20, boardY - 12, boardX - 20, boardY + 12);
        boardG.setDepth(7);
        // Push pins (red circles at corners)
        this.add.circle(boardX - 18, boardY - 10, 2, 0xcc2222, 1).setDepth(7);
        this.add.circle(boardX + 18, boardY - 10, 2, 0xcc2222, 1).setDepth(7);
        // Pin highlights
        this.add.circle(boardX - 19, boardY - 11, 1, 0xff6666, 0.6).setDepth(7);
        this.add.circle(boardX + 17, boardY - 11, 1, 0xff6666, 0.6).setDepth(7);
        // NOTICE label
        this.add.text(boardX, boardY - 6, 'NOTICE', {
          fontFamily: '"Press Start 2P"',
          fontSize: '5px',
          color: '#8B0000',
        }).setOrigin(0.5).setDepth(7);

        // Invisible interactive sprite overlapping the board
        const boardSprite = this.add.sprite(boardX, boardY, objectTextureKey('poster'))
          .setAlpha(0.01) // nearly invisible; visual is the rectangle above
          .setDepth(8)
          .setInteractive({ cursor: 'pointer' });

        this.interactables.push({
          type: 'hallwayBoard',
          id: `hallway_board_${this.room.id}_act${act}`,
          data: { x: Math.floor(boardX / TILE), y: Math.floor(boardY / TILE), title: board.title, content: board.text },
          sprite: boardSprite,
        });
      }
    }

    // ── Interaction zones ────────────────────────────────────────
    for (const zone of room.interactionZones) {
      const texKey = objectTextureKey(zone.spriteType || 'computer');
      const sprite = this.add.sprite(zone.x * TILE + TILE / 2, zone.y * TILE + TILE / 2, texKey);
      sprite.setDepth(20);
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 3,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      // Interaction zone glow ring — pulsing blue aura for incomplete zones
      if (!this.completedZones.has(zone.id)) {
        const zoneGlow = this.add.circle(
          sprite.x, sprite.y, 20, 0x00aaff, 0
        ).setStrokeStyle(1.5, 0x00aaff, 0).setDepth(sprite.depth - 1);

        this.tweens.add({
          targets: zoneGlow,
          strokeAlpha: { from: 0, to: 0.4 },
          scale: { from: 0.8, to: 1.2 },
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Completed zone checkmark
      if (this.completedZones.has(zone.id)) {
        this.add.text(sprite.x, sprite.y - 16, '\u2713', {
          fontFamily: '"Press Start 2P"',
          fontSize: '7px',
          color: '#44ff44',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(sprite.depth + 1);
      }

      this.interactables.push({ type: 'zone', id: zone.id, data: zone, sprite });
    }

    // ── NPCs ─────────────────────────────────────────────────────
    for (const npc of room.npcs) {
      // Phase 17 (2026-06-10): Act-gated and demo-excluded NPCs.
      // If the NPC's encounterTrigger.minAct is set, skip spawning when the
      // current act is too low OR when demo mode is active (demo runs in Act 1
      // state, so Priya would appear without valid Act 3 context).
      const minAct = (npc.encounterTrigger as { minAct?: number } | undefined)?.minAct;
      if (minAct !== undefined) {
        if (isDemoActive() || this.getCurrentAct() < minAct) continue;
      }

      const texKey = npcTextureKey(npc.id);
      const completed = this.completedNPCs.has(npc.id);

      // Drop shadow at feet level (behind the sprite)
      const npcShadow = this.add.ellipse(
        npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2 + TILE / 2 - 2,
        20, 8,
        0x000000, 0.3,
      );
      if (completed) npcShadow.setAlpha(0.15);

      const sprite = this.add.sprite(npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2, texKey, 0);
      const npcDepth = 5 + Math.floor(sprite.y / TILE);
      sprite.setDepth(npcDepth);
      npcShadow.setDepth(npcDepth - 1);
      if (completed) {
        sprite.setAlpha(0.7);
      }

      // Name label below sprite with dark background for readability
      const labelX = npc.x * TILE + TILE / 2;
      const labelY = npc.y * TILE + TILE + 2;
      const nameLabel = this.add.text(
        labelX, labelY,
        npc.name,
        {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          backgroundColor: '#00000066',
          padding: { x: 2, y: 1 },
        },
      ).setOrigin(0.5, 0).setDepth(npcDepth + 1);
      // Clamp label horizontally so it never overflows the room/canvas bounds.
      // With origin (0.5, 0), the label extends labelHalf in each direction from labelX.
      const labelPad = 2;
      const labelHalf = nameLabel.width / 2;
      const roomPxWidth = room.width * TILE;
      const minX = labelHalf + labelPad;
      const maxX = roomPxWidth - labelHalf - labelPad;
      if (maxX >= minX) {
        nameLabel.x = Phaser.Math.Clamp(labelX, minX, maxX);
      }
      if (completed) nameLabel.setAlpha(0.4);

      // Idle breathing tween — slight vertical scale oscillation, offset per NPC so they don't sync
      this.tweens.add({
        targets: sprite,
        scaleY: { from: 1.0, to: 1.02 },
        duration: 1500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Completed checkmark
      if (completed) {
        const checkmark = this.add.text(sprite.x, sprite.y - 20, '\u2713', {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: '#44ff44',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(sprite.depth + 1);
      }

      // Boss indicator
      if (npc.isFinalBoss && !completed) {
        const bossText = this.add.text(npc.x * TILE + TILE / 2, npc.y * TILE - 10, 'BOSS', {
          fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#e74c3c',
        }).setOrigin(0.5).setDepth(npcDepth + 3);
        this.tweens.add({ targets: bossText, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

        // Boss glow ring — pulsing aura that draws the player's attention
        const bossGlow = this.add.circle(sprite.x, sprite.y, 24, 0xff4444, 0)
          .setStrokeStyle(2, 0xff6644, 0.5)
          .setDepth(sprite.depth - 1);
        this.tweens.add({
          targets: bossGlow,
          scale: { from: 0.8, to: 1.3 },
          alpha: { from: 0.5, to: 0 },
          duration: 1500,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      // Speech bubble indicator for uncompleted NPCs — "talk to me!" cue
      if (!completed) {
        const bubbleTexKey = '_npc_speech_bubble';
        if (!this.textures.exists(bubbleTexKey)) {
          const bg = this.add.graphics();
          // Dark rounded rectangle body for high contrast (10x8)
          bg.fillStyle(0x333333, 0.9);
          bg.fillRoundedRect(0, 0, 10, 8, 2);
          // Tiny triangular tail pointing down
          bg.fillStyle(0x333333, 0.9);
          bg.fillTriangle(3, 8, 7, 8, 5, 11);
          // Subtle light border for definition
          bg.lineStyle(1, 0x555555, 0.6);
          bg.strokeRoundedRect(0, 0, 10, 8, 2);
          // Inner dot detail (white exclamation hint)
          bg.fillStyle(0xffffff, 0.9);
          bg.fillRect(4, 2, 2, 3);
          bg.fillRect(4, 6, 2, 1);
          bg.generateTexture(bubbleTexKey, 10, 12);
          bg.destroy();
        }
        const bubbleX = npc.x * TILE + TILE / 2;
        const bubbleY = npc.y * TILE + TILE / 2 - 20;
        const bubble = this.add.image(bubbleX, bubbleY, bubbleTexKey);
        bubble.setAlpha(0.8);
        bubble.setDepth(npcDepth + 2);
        this.tweens.add({
          targets: bubble,
          y: bubbleY - 3,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      this.interactables.push({ type: 'npc', id: npc.id, data: npc, sprite });
    }

    // ── ER urgency cues (DESIGN-001) ────────────────────────────
    if (this.room.id === 'er') {
      // Flashing EMERGENCY status panel — wall-mounted near the top center
      const panelX = 10 * TILE + TILE / 2;
      const panelY = 1 * TILE + TILE / 2 + 4;
      const panelBack = this.add.rectangle(panelX, panelY, 64, 18, 0x1a0000).setStrokeStyle(1, 0x4a0000).setDepth(4);
      const panelGlow = this.add.rectangle(panelX, panelY, 64, 18, 0xff2222, 0.55).setDepth(4);
      const panelLabel = this.add.text(panelX, panelY, 'EMERGENCY', {
        fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffe6e6', stroke: '#660000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);
      this.tweens.add({ targets: [panelGlow, panelLabel], alpha: { from: 1, to: 0.35 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      void panelBack;

      // Walking nurse — patrols horizontally between tile x=8 and x=11 at y=4
      const nurseY = 4 * TILE + TILE / 2;
      const nurseStartX = 8 * TILE + TILE / 2;
      const nurseEndX = 11 * TILE + TILE / 2;
      this.add.ellipse(nurseStartX, nurseY + TILE / 2 - 2, 18, 7, 0x000000, 0.25).setDepth(4);
      const nurseSprite = this.add.sprite(nurseStartX, nurseY, npcTextureKey('nurse_chen')).setDepth(5 + 4);
      this.tweens.add({ targets: nurseSprite, x: nurseEndX, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => nurseSprite.setFlipX(true), onRepeat: () => nurseSprite.setFlipX(false) });
      this.tweens.add({ targets: nurseSprite, scaleY: { from: 1.0, to: 1.03 }, duration: 360, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      // Idle fidget for officer + frantic family — subtle angle wobble
      for (const fidgetId of ['officer', 'frantic_family']) {
        const ia = this.interactables.find(i => i.type === 'npc' && i.id === fidgetId);
        if (ia) this.tweens.add({ targets: ia.sprite, angle: { from: -1.5, to: 1.5 }, duration: 1100 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // Ambient monitor beep — heartbeat-like cadence (DESIGN-LIFT-001)
      this.time.addEvent({ delay: 9000, loop: true, callback: () => {
        try { this.sound.play('sfx_interact', { volume: 0.06, rate: 0.6 }); } catch (_) {}
      } });
    }

    // ── Reception life pass (DESIGN-005) ────────────────────────
    if (this.room.id === 'reception') {
      // Busy desk props — clipboard, coffee mug, papers stack riding on the desk surface
      const deskSurfaceY = 2 * TILE + TILE / 2 - 6;
      const clipboard = this.add.sprite(8 * TILE + TILE / 2, deskSurfaceY, objectTextureKey('manual')).setScale(0.55).setDepth(5).setAngle(-8);
      const mug = this.add.sprite(9 * TILE + TILE / 2 + 6, deskSurfaceY + 2, furnitureTextureKey('coffee_mug')).setScale(0.6).setDepth(5);
      const papers = this.add.sprite(11 * TILE + TILE / 2, deskSurfaceY, furnitureTextureKey('inbox_tray')).setScale(0.55).setDepth(5);
      this.tweens.add({ targets: mug, y: mug.y - 1, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      void clipboard; void papers;

      // Vary chair groupings — add a conversation pair facing each other (decorative, no collision)
      const pairY = 11 * TILE + TILE / 2;
      const chairA = this.add.sprite(10 * TILE + TILE / 2, pairY, furnitureTextureKey('chair')).setDepth(3).setAngle(15);
      const chairB = this.add.sprite(11 * TILE + TILE / 2 + 4, pairY, furnitureTextureKey('chair')).setDepth(3).setAngle(-15).setFlipX(true);
      // Angled corner chair near the right cluster, suggesting someone sat askew
      const chairC = this.add.sprite(14 * TILE + TILE / 2, 8 * TILE + TILE / 2, furnitureTextureKey('chair')).setDepth(3).setAngle(-25);
      void chairA; void chairB; void chairC;

      // Interactable pulse — subtle scale yoyo on items + zones to signpost interactivity
      for (const ia of this.interactables) {
        if (ia.type !== 'zone' && ia.type !== 'item') continue;
        this.tweens.add({ targets: ia.sprite, scaleX: { from: 1.0, to: 1.04 }, scaleY: { from: 1.0, to: 1.04 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // Ambient distant footsteps — visitor passing in the corridor (DESIGN-LIFT-001)
      this.time.addEvent({ delay: 13000, loop: true, callback: () => {
        try { this.sound.play('sfx_footstep', { volume: 0.04, rate: 0.9 + Math.random() * 0.2 }); } catch (_) {}
      } });
    }

    // Pulse first NPC if this room hasn't been pulsed yet
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

    // ── Hospital Lobby first-frame polish (DESIGN-004) ────────────
    if (this.room.id === 'hospital_entrance') {
      // (1) Coffee cart prop — non-interactable, rendered directly in scene
      const cartTileX = 5, cartTileY = 5;
      const cartCx = cartTileX * TILE + TILE / 2, cartCy = cartTileY * TILE + TILE / 2;
      this.add.ellipse(cartCx, cartCy + 12, TILE - 4, 8, 0x000000, 0.18).setDepth(2);
      this.add.sprite(cartCx, cartCy, furnitureTextureKey('coffee_station')).setDepth(3);
      // Tiny steam puff every ~2.6s above the cart
      this.time.addEvent({ delay: 2600, loop: true, callback: () => {
        const puff = this.add.ellipse(cartCx + (Math.random() * 4 - 2), cartCy - 14, 5, 4, 0xffffff, 0.55).setDepth(20);
        this.tweens.add({ targets: puff, y: puff.y - 12, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 1400, ease: 'Sine.easeOut', onComplete: () => puff.destroy() });
      } });
      // (2) Riley idle micro-animation — subtle angle sway on top of breathing tween
      const riley = this.interactables.find(ia => ia.type === 'npc' && ia.id === 'riley_entrance');
      if (riley) {
        this.tweens.add({ targets: riley.sprite, angle: { from: -1.2, to: 1.2 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // Plant leaf-sway — translucent green oval on each plant, gently rocking
      for (const obs of room.obstacles) {
        if ((obs as any).type !== 'plant') continue;
        const px = obs.x * TILE + (obs.width * TILE) / 2;
        const py = obs.y * TILE + 4;
        const leaf = this.add.ellipse(px, py, 14, 6, 0x4a8a3a, 0.45).setDepth(4);
        this.tweens.add({ targets: leaf, angle: { from: -6, to: 6 }, duration: 1900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // (3) Ambient lobby chatter — single subtle blip every 9-12s, max volume 0.08
      this.time.addEvent({ delay: 10500, loop: true, callback: () => {
        try { this.sound.play('sfx_interact', { volume: 0.06, rate: 0.55 + Math.random() * 0.2 }); } catch (_) {}
      } });
      // Ambient sliding-door whoosh — distant entry sound every ~20s (DESIGN-LIFT-001)
      this.time.addEvent({ delay: 19500, loop: true, callback: () => {
        try { this.sound.play('sfx_interact', { volume: 0.06, rate: 0.8 }); } catch (_) {}
      } });
    }

    // ── Break Room comedic life (DESIGN-003) ─────────────────────
    if (this.room.id === 'break_room') {
      const ledColors = [0xff4444, 0xffdd44, 0x44ff66, 0x44ccff];
      for (const obs of room.obstacles) {
        if ((obs as any).type !== 'vending_machine') continue;
        const led = this.add.rectangle(obs.x * TILE + obs.width * TILE - 6, obs.y * TILE + 6, 2, 2, ledColors[0]).setDepth(20);
        let li = 0;
        this.time.addEvent({ delay: 700, loop: true, callback: () => { li = (li + 1) % ledColors.length; led.setFillStyle(ledColors[li]); } });
      }
      const mw = room.obstacles.find((o: any) => o.type === 'microwave');
      if (mw) {
        const mx = mw.x * TILE + TILE / 2, my = mw.y * TILE + TILE / 2;
        this.time.addEvent({ delay: 9000, loop: true, callback: () => {
          try { this.sound.play('sfx_interact', { volume: 0.12, rate: 1.6 }); } catch (_) {}
          const f = this.add.rectangle(mx, my, TILE - 8, TILE - 8, 0xffeeaa, 0.5).setDepth(20);
          this.tweens.add({ targets: f, alpha: 0, duration: 350, onComplete: () => f.destroy() });
        } });
      }
      const gossip = this.interactables.find(ia => ia.type === 'npc' && ia.id === 'gossiping_coworker');
      if (gossip) {
        const glyphs = ['...', '!', '?'];
        this.time.addEvent({ delay: 4500, loop: true, callback: () => {
          const b = this.add.text(gossip.sprite.x + 10, gossip.sprite.y - 24, glyphs[Math.floor(Math.random() * glyphs.length)], {
            fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffffff', backgroundColor: '#222222cc', padding: { x: 3, y: 2 },
          }).setOrigin(0.5).setDepth(gossip.sprite.depth + 3).setAlpha(0);
          this.tweens.add({ targets: b, alpha: 1, y: b.y - 4, duration: 250, yoyo: true, hold: 900, onComplete: () => b.destroy() });
        } });
      }
      // Ambient vending dispense — soft thunk every ~16s (DESIGN-LIFT-001)
      this.time.addEvent({ delay: 16000, loop: true, callback: () => {
        try { this.sound.play('sfx_interact', { volume: 0.05, rate: 0.5 }); } catch (_) {}
      } });
    }

    // ── Records Room final-demo polish (DESIGN-006) ──────────────
    if (this.room.id === 'records_room') {
      // (1) Flickering fluorescent tube + dust motes in the upper filing aisle
      const tubeCx = 10 * TILE + TILE / 2, tubeCy = 1 * TILE + TILE - 4;
      const tube = this.add.rectangle(tubeCx, tubeCy, TILE * 3, 3, 0xfff7d8, 0.85).setDepth(4);
      const tubeHalo = this.add.rectangle(tubeCx, tubeCy + 10, TILE * 4, 22, 0xfff2b8, 0.10).setDepth(3);
      this.time.addEvent({ delay: 3200, loop: true, callback: () => {
        // Brief flicker — dim then snap back
        this.tweens.add({ targets: [tube, tubeHalo], alpha: { from: tube.alpha, to: 0.25 }, duration: 80, yoyo: true, repeat: 1, ease: 'Linear' });
      } });
      // Dust motes drifting in the light beam below the tube
      this.time.addEvent({ delay: 1400, loop: true, callback: () => {
        const mote = this.add.circle(tubeCx + (Math.random() * 80 - 40), tubeCy + 6, 1, 0xfff5c8, 0.7).setDepth(20);
        this.tweens.add({ targets: mote, y: mote.y + 18, alpha: 0, duration: 4200, ease: 'Sine.easeOut', onComplete: () => mote.destroy() });
      } });
      // (2) Idle fidget on the two strongest NPCs — CCO and Attorney
      for (const fidgetId of ['compliance_officer', 'attorney']) {
        const ia = this.interactables.find(i => i.type === 'npc' && i.id === fidgetId);
        if (ia) this.tweens.add({ targets: ia.sprite, angle: { from: -1.2, to: 1.2 }, duration: 1300 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // (3) Subpoena envelope prop next to Attorney — small obj_manual sprite, signals "official document"
      const attorney = this.interactables.find(i => i.type === 'npc' && i.id === 'attorney');
      if (attorney) {
        const env = this.add.sprite(attorney.sprite.x + 14, attorney.sprite.y + 4, objectTextureKey('manual')).setScale(0.5).setDepth(attorney.sprite.depth - 1).setAngle(12);
        this.tweens.add({ targets: env, y: env.y - 1, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // (4) Decorative document cart drifting slowly down the central aisle (separate from the static cart at (6,5))
      const cartY = 9 * TILE + TILE / 2;
      const cartStartX = 13 * TILE + TILE / 2, cartEndX = 16 * TILE + TILE / 2;
      this.add.ellipse(cartStartX, cartY + 10, TILE - 6, 6, 0x000000, 0.18).setDepth(2);
      const cart = this.add.sprite(cartStartX, cartY, furnitureTextureKey('document_cart')).setDepth(3).setScale(0.85);
      this.tweens.add({ targets: cart, x: cartEndX, duration: 5200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // Ambient paper rustle / drawer slide — every ~12s (DESIGN-LIFT-001)
      this.time.addEvent({ delay: 12500, loop: true, callback: () => {
        try { this.sound.play('sfx_interact', { volume: 0.04, rate: 0.7 }); } catch (_) {}
      } });
    }

    // ── Laboratory life pass (DESIGN-002) ────────────────────────
    if (this.room.id === 'lab') {
      // (1) Microscope eyepiece glow — pulsing color-cycling circle on the microscope station (2,2)
      const scopeCx = 2 * TILE + (3 * TILE) / 2, scopeCy = 2 * TILE + 6;
      const eyepiece = this.add.circle(scopeCx, scopeCy, 4, 0x88ddff, 0.85).setDepth(5);
      const scopeColors = [0x88ddff, 0xffe888, 0xff88dd, 0x88ffaa];
      let sci = 0;
      this.time.addEvent({ delay: 1200, loop: true, callback: () => { sci = (sci + 1) % scopeColors.length; eyepiece.setFillStyle(scopeColors[sci]); } });
      this.tweens.add({ targets: eyepiece, scaleX: { from: 0.8, to: 1.3 }, scaleY: { from: 0.8, to: 1.3 }, alpha: { from: 0.5, to: 1 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // (2) Idle fidget on lab_tech + courier — angle wobble matching ER pattern
      for (const fidgetId of ['lab_tech', 'courier']) {
        const ia = this.interactables.find(i => i.type === 'npc' && i.id === fidgetId);
        if (ia) this.tweens.add({ targets: ia.sprite, angle: { from: -1.4, to: 1.4 }, duration: 1200 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // (3) Beaker bubble particles — periodic rising bubbles from chemical_shelf positions
      for (const obs of room.obstacles) {
        if ((obs as any).type !== 'chemical_shelf') continue;
        const bx = obs.x * TILE + (obs.width * TILE) / 2, by = obs.y * TILE + 4;
        this.time.addEvent({ delay: 6500 + Math.random() * 1500, loop: true, callback: () => {
          for (let i = 0; i < 4; i++) {
            const bubble = this.add.circle(bx + (Math.random() * 14 - 7), by, 1 + Math.random(), 0x88eeff, 0.8).setDepth(20);
            this.tweens.add({ targets: bubble, y: bubble.y - 14, alpha: 0, duration: 1100 + i * 120, ease: 'Sine.easeOut', onComplete: () => bubble.destroy() });
          }
        } });
      }
      // Ambient bubble pop — chemistry-station blip every ~10s (DESIGN-LIFT-001)
      this.time.addEvent({ delay: 10500, loop: true, callback: () => {
        try { this.sound.play('sfx_interact', { volume: 0.05, rate: 1.4 }); } catch (_) {}
      } });
    }

    // ── IT Office tech-life polish (DESIGN-007) ─────────────────
    if (this.room.id === 'it_office') {
      // (1) Server-rack blinking LEDs — green/amber yoyo, slightly out of phase per rack
      let rackIdx = 0;
      for (const obs of room.obstacles) {
        if ((obs as any).type !== 'server_rack') continue;
        const lx = obs.x * TILE + obs.width * TILE - 5, lyTop = obs.y * TILE + 4;
        const ledA = this.add.rectangle(lx, lyTop, 2, 2, 0x44ff66).setDepth(20);
        const ledB = this.add.rectangle(lx, lyTop + 4, 2, 2, 0xffaa33).setDepth(20);
        const phase = (rackIdx % 4) * 180;
        this.tweens.add({ targets: ledA, alpha: { from: 1, to: 0.25 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: phase });
        this.tweens.add({ targets: ledB, alpha: { from: 0.25, to: 1 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: phase + 90 });
        rackIdx++;
      }
      // (2) Monitor flicker — single-frame cyan flash on each monitor_bank every 8-10s
      for (const obs of room.obstacles) {
        if ((obs as any).type !== 'monitor_bank') continue;
        const mx = obs.x * TILE + (obs.width * TILE) / 2, my = obs.y * TILE + TILE / 2;
        const flash = this.add.rectangle(mx, my, obs.width * TILE - 4, TILE - 4, 0x66ddff, 0).setDepth(6);
        this.time.addEvent({ delay: 8500 + Math.random() * 1500, loop: true, callback: () => {
          flash.setAlpha(0.55);
          this.time.delayedCall(60, () => flash.setAlpha(0));
        } });
      }
      // (3) Encounter trigger glow — subtle pulsing ring at tile (9,6) signposting the IT encounter
      const alreadyDone = this.registry.get('encounterResult_td-it-office');
      if (!alreadyDone) {
        const tx = 9 * TILE + TILE / 2, ty = 6 * TILE + TILE / 2;
        const ring = this.add.circle(tx, ty, 14, 0x66ddff, 0.0).setStrokeStyle(2, 0x66ddff, 0.7).setDepth(4);
        this.tweens.add({ targets: ring, scale: { from: 0.8, to: 1.4 }, alpha: { from: 0.7, to: 0 }, duration: 1400, repeat: -1, ease: 'Sine.easeOut' });
      }
    }

    // ── Hallway life pass (DESIGN-HALLWAY-001 + 002) ─────────────
    // All 5 hallways: act-tinted bulletin ribbon + drifting dust motes in two light columns.
    // Worst 2 only (break_lab + it_er): flickering sconces + walking employee NPC.
    if (this.room.id.startsWith('hallway_')) {
      const isHeavyHallway = this.room.id === 'hallway_break_lab' || this.room.id === 'hallway_it_er';
      // (A) Shared — Act-aware poster accent on the existing bulletin board
      const act = this.getCurrentAct();
      const actTint = act === 1 ? 0x4a90e2 : act === 2 ? 0xe2a04a : 0xc83a3a;
      const ribbon = this.add.rectangle(this.cameras.main.width / 2 + 18, 64 - 16, 10, 4, actTint, 1).setDepth(8).setAngle(-12);
      this.tweens.add({ targets: ribbon, alpha: { from: 1, to: 0.65 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // (B) Shared — Drifting dust motes in two light columns (atmospheric texture)
      const moteColumns = [5 * TILE + TILE / 2, 14 * TILE + TILE / 2];
      for (const cx of moteColumns) {
        this.time.addEvent({ delay: 1700 + Math.random() * 900, loop: true, callback: () => {
          const mote = this.add.circle(cx + (Math.random() * 28 - 14), TILE + 4, 1, 0xfff5c8, 0.7).setDepth(20);
          this.tweens.add({ targets: mote, y: mote.y + 5 * TILE, alpha: 0, duration: 5200 + Math.random() * 800, ease: 'Sine.easeOut', onComplete: () => mote.destroy() });
        } });
      }
      // (C) Heavy-only — Flickering ceiling sconces
      if (isHeavyHallway) {
        for (const obs of room.obstacles) {
          if ((obs as any).type !== 'wall_sconce') continue;
          const sx = obs.x * TILE + (obs.width * TILE) / 2;
          const sy = obs.y * TILE + TILE - 2;
          const halo = this.add.ellipse(sx, sy + 4, 22, 10, 0xffe6a8, 0.55).setDepth(4);
          const cone = this.add.ellipse(sx, sy + 14, 30, 18, 0xfff2c8, 0.18).setDepth(3);
          const flickerDelay = 2400 + Math.random() * 1800;
          this.time.addEvent({ delay: flickerDelay, loop: true, callback: () => {
            this.tweens.add({ targets: [halo, cone], alpha: { from: 1, to: 0.35 }, duration: 70, yoyo: true, repeat: 1, ease: 'Linear' });
          } });
        }
        // (D) Heavy-only — Walking employee NPC, non-interactable, patrols the corridor
        const empY = 4 * TILE + TILE / 2;
        const empStartX = 7 * TILE + TILE / 2;
        const empEndX = 13 * TILE + TILE / 2;
        this.add.ellipse(empStartX, empY + TILE / 2 - 2, 18, 7, 0x000000, 0.25).setDepth(4);
        const empSprite = this.add.sprite(empStartX, empY, 'npc_doctor').setDepth(5 + 4);
        this.tweens.add({ targets: empSprite, x: empEndX, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => empSprite.setFlipX(true), onRepeat: () => empSprite.setFlipX(false) });
        this.tweens.add({ targets: empSprite, scaleY: { from: 1.0, to: 1.03 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }

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
    this.renderDoorStates();

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

      const path = this.findPath({ x: this.tileX, y: this.tileY }, { x: goalTileX, y: goalTileY });
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

    // ── Vignette overlay — subtle edge darkening to draw eye to center ──
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const vignette = this.add.graphics();
    // Outer ring: 16px border at 15% opacity
    vignette.fillStyle(0x000000, 0.15);
    vignette.fillRect(0, 0, camW, 16);               // top
    vignette.fillRect(0, camH - 16, camW, 16);       // bottom
    vignette.fillRect(0, 16, 16, camH - 32);         // left
    vignette.fillRect(camW - 16, 16, 16, camH - 32); // right
    // Inner ring: next 16px at 8% opacity
    vignette.fillStyle(0x000000, 0.08);
    vignette.fillRect(16, 16, camW - 32, 16);               // top inner
    vignette.fillRect(16, camH - 32, camW - 32, 16);        // bottom inner
    vignette.fillRect(16, 32, 16, camH - 64);               // left inner
    vignette.fillRect(camW - 32, 32, 16, camH - 64);        // right inner
    vignette.setDepth(50);
    vignette.setScrollFactor(0);

    // Subtle ambient vignette for depth
    const vignetteGfx = this.add.graphics().setDepth(90).setScrollFactor(0);
    // Corner shadows (subtle)
    vignetteGfx.fillStyle(0x000000, 0.08);
    vignetteGfx.fillRect(0, 0, 40, 40);
    vignetteGfx.fillRect(camW - 40, 0, 40, 40);
    vignetteGfx.fillRect(0, camH - 40, 40, 40);
    vignetteGfx.fillRect(camW - 40, camH - 40, 40, 40);
    // Edge darkening (very subtle)
    vignetteGfx.fillStyle(0x000000, 0.03);
    vignetteGfx.fillRect(0, 0, camW, 10);
    vignetteGfx.fillRect(0, camH - 10, camW, 10);
    vignetteGfx.fillRect(0, 0, 10, camH);
    vignetteGfx.fillRect(camW - 10, 0, 10, camH);

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
    const currentAct = this.getCurrentAct();
    const ACT_MUSIC: Record<number, { track: string; baseVol: number }> = {
      1: { track: 'music_hub', baseVol: this.musicBaseVolume },
      2: { track: 'music_exploration', baseVol: this.musicBaseVolume },
      3: { track: 'music_breach', baseVol: 0.15 },
    };
    const actCfg = ACT_MUSIC[currentAct] ?? ACT_MUSIC[2];
    const roomTrack = (this.room as any).musicTrack as string | undefined;
    const roomBaseVol = (this.room as any).musicBaseVolume as number | undefined;
    const musicCfg = {
      track: roomTrack ?? actCfg.track,
      baseVol: roomBaseVol ?? actCfg.baseVol,
    };
    this.activeMusicBaseVolume = musicCfg.baseVol;
    try {
      const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
      const targetVol = musicCfg.baseVol * userVol;

      // Same track survived from previous room — reclaim and fade up
      const existing = this.findPlayingTrack(musicCfg.track);
      if (existing) {
        this.bgMusic = existing;
        this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 600, ease: 'Sine.easeIn' });
      } else if (userVol > 0) {
        // Different track (or first load) — stop any other music tracks left
        // playing on the SoundManager, then fade in the new one from silence.
        for (const k of MUSIC_TRACK_KEYS) {
          if (k !== musicCfg.track) {
            this.sound.getAll(k).forEach(s => { s.stop(); s.destroy(); });
          }
        }
        // Clean up orphans of the target key too
        this.sound.getAll(musicCfg.track).forEach(s => { s.stop(); s.destroy(); });
        // Start muted to prevent any first-frame audio leak, then unmute at
        // volume 0 and tween up on the next tick.
        this.bgMusic = this.sound.add(musicCfg.track, { loop: true, volume: 0, mute: true });
        const playMusic = () => {
          if (!this.bgMusic || !this.scene.isActive()) return;
          this.bgMusic.play();
          this.time.delayedCall(0, () => {
            if (!this.bgMusic || !this.scene.isActive()) return;
            const ws = this.bgMusic as Phaser.Sound.WebAudioSound;
            ws.setMute(false);
            ws.volume = 0;
            this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 1800, ease: 'Sine.easeIn' });
          });
        };
        if (this.sound.locked) {
          this.sound.once('unlocked', playMusic);
        } else {
          this.time.delayedCall(300, playMusic);
        }
      }
    } catch (e) {
      console.warn(`[ExplorationScene] ${musicCfg.track} not ready, skipping BGM:`, e);
    }

    // Room entrance — fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Room name entrance banner — slides in and fades out
    const roomBanner = this.add.text(
      this.cameras.main.centerX, 40,
      this.room.name || 'Unknown Room',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(100).setScrollFactor(0).setAlpha(0);

    // Color banner based on room type
    const bannerColors: Record<string, string> = {
      reception: '#4a90e2',
      records_room: '#2ecc71',
      er: '#ff6b6b',
      lab: '#9b59b6',
      break_room: '#f39c12',
      it_office: '#00d4aa',
    };
    const bannerColor = bannerColors[this.room.id] || '#ffffff';
    roomBanner.setColor(bannerColor);

    this.tweens.add({
      targets: roomBanner,
      alpha: 1,
      y: 50,
      duration: 400,
      ease: 'Quad.easeOut',
      delay: 300,
      onComplete: () => {
        this.tweens.add({
          targets: roomBanner,
          alpha: 0,
          duration: 500,
          delay: 1500,
          ease: 'Quad.easeIn',
          onComplete: () => roomBanner.destroy()
        });
      }
    });

    eventBridge.emit(BRIDGE_EVENTS.SCENE_READY, 'Exploration');

    // QA command listeners — Playwright drives the game via these
    eventBridge.on(BRIDGE_EVENTS.QA_MOVE_PLAYER_TO, this.onQAMoveTo, this);
    eventBridge.on(BRIDGE_EVENTS.QA_PRESS_SPACE, this.onQAPressSpace, this);
    eventBridge.on(BRIDGE_EVENTS.QA_NAVIGATE_DOOR, this.onQANavigateDoor, this);
    eventBridge.on(BRIDGE_EVENTS.QA_TELEPORT_TO, this.onQATeleportTo, this);
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

    if (interactPressed && this.nearbyInteractable) {
      this.triggerInteraction(this.nearbyInteractable);
    }

    // IT Office encounter zone check (Phase 13)
    if (this.room.id === 'it_office' && !this.encounterTriggered && !this.paused && !isQANoEncounter()) {
      const alreadyDone = this.registry.get('encounterResult_td-it-office');
      if (!alreadyDone) {
        const dx = Math.abs(this.player.x - (9 * TILE + TILE / 2));
        const dy = Math.abs(this.player.y - (6 * TILE + TILE / 2));
        if (dx < TILE * 1.5 && dy < TILE * 1.5) {
          this.triggerEncounter('td-it-office');
        }
      }
    }

    // PHI Sorter triggers are now NPC-driven (Phase 16, 2026-05-08).
    // Player presses SPACE on Aiyana (Reception) or Marcus (Lab) — see triggerInteraction.
    // Proximity polling removed because it auto-popped without player agency.

    // Door proximity detection — requires SPACE to enter (Phase 12)
    if (!this.transitioning) {
      this.checkDoorProximity();
      if (this.nearDoor && interactPressed && !this.nearbyInteractable) {
        this.handleDoorInteraction(this.nearDoor);
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
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE, {
        currentRoomId: this.room.id,
        playerTileX: this.tileX,
        playerTileY: this.tileY,
        nearbyInteractable: this.nearbyInteractable
          ? { type: this.nearbyInteractable.type, id: this.nearbyInteractable.id }
          : null,
        nearDoor: this.nearDoor
          ? { id: this.nearDoor.id, targetRoomId: this.nearDoor.targetRoomId }
          : null,
        paused: this.paused,
        interactables: this.interactables.map(ia => ({
          type: ia.type,
          id: ia.id,
          x: (ia.data as any).x,
          y: (ia.data as any).y,
        })),
        doors: ((this.room as any).doors || []).map((d: any) => ({
          id: d.id,
          targetRoomId: d.targetRoomId,
          x: d.x,
          y: d.y,
          state: this.doorStates[d.id] ?? 'available',
        })),
      });
    }
  }

  shutdown() {
    // Don't stop music — create() will reclaim it if same track is needed,
    // or crossfadeToMusic will clean it up if the act changed.
    this.bgMusic = undefined;
    // Clean up sound unlock listener
    this.sound.off('unlocked');
    // Clean up EventBridge listeners
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
    this.events.off(Phaser.Scenes.Events.WAKE, this.handleWakeFromEncounter, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_LAUNCH_ENCOUNTER, this.onLaunchEncounter, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_RETURN_FROM_ENCOUNTER, this.onReturnFromEncounter, this);
    // QA command listeners cleanup
    eventBridge.off(BRIDGE_EVENTS.QA_MOVE_PLAYER_TO, this.onQAMoveTo, this);
    eventBridge.off(BRIDGE_EVENTS.QA_PRESS_SPACE, this.onQAPressSpace, this);
    eventBridge.off(BRIDGE_EVENTS.QA_NAVIGATE_DOOR, this.onQANavigateDoor, this);
    eventBridge.off(BRIDGE_EVENTS.QA_TELEPORT_TO, this.onQATeleportTo, this);
    // Clean up input handlers
    this.input.off('pointerdown');
    // Kill all tweens to prevent leaked infinite loops
    this.tweens.killAll();
    if (this.moveTimer) this.moveTimer.destroy();
    if (this.npcPulseTween) {
      this.npcPulseTween.stop();
      this.npcPulseTween = null;
    }
  }

  // ── QA Testing Commands ──────────────────────────────────────────

  private onQATeleportTo = (data: { tileX: number; tileY: number }) => {
    if (!this.scene.isActive()) return;
    this.movePath = [];
    if (this.moveTimer) { this.moveTimer.destroy(); this.moveTimer = null; }
    this.player.setPosition(data.tileX * TILE + TILE / 2, data.tileY * TILE + TILE / 2);
    this.tileX = data.tileX;
    this.tileY = data.tileY;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    // Immediately update proximity so QA pressSpace can find nearby interactables
    this.checkProximity();
    this.checkDoorProximity();
  };

  private onQAMoveTo = (data: { tileX: number; tileY: number }) => {
    if (!this.scene.isActive()) return;
    const path = this.findPath(
      { x: this.tileX, y: this.tileY },
      { x: data.tileX, y: data.tileY }
    );
    if (path.length > 0) {
      this.startPathMovement(path, null);
    }
  };

  private onQAPressSpace = () => {
    if (!this.scene.isActive() || this.paused) return;
    // If near an interactable, trigger it
    if (this.nearbyInteractable) {
      this.triggerInteraction(this.nearbyInteractable);
      return;
    }
    // If near a door, enter it
    if (this.nearDoor && !this.transitioning) {
      this.handleDoorInteraction(this.nearDoor);
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
    if (!this.scene.isActive()) return;
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
      this.checkDoorProximity();
      if (this.nearDoor && this.nearDoor.id === data.doorId) {
        this.handleDoorInteraction(this.nearDoor);
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
    if (!this.scene.isActive()) return;
    if (this.bgMusic) {
      (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.activeMusicBaseVolume * vol;
    }
  };

  // ── Act-based music crossfade (Phase 14) ──────────────────────────

  /** Current effective base volume — may differ from musicBaseVolume for Act 3 */
  private activeMusicBaseVolume = 0.25;

  private onActAdvance = (data: { newAct: number; track: string; baseVolume?: number }) => {
    this.crossfadeToMusic(data.track, data.baseVolume);
  };

  /**
   * Fade out current music over 2s, then fade in new track over 2s.
   * Guards against scene shutdown mid-crossfade.
   */
  private crossfadeToMusic(newTrackKey: string, baseVolumeOverride?: number): void {
    const effectiveBase = baseVolumeOverride ?? this.musicBaseVolume;
    this.activeMusicBaseVolume = effectiveBase;
    const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
    const targetVol = effectiveBase * userVol;

    // Reclaim orphaned bgMusic ref (shutdown cleared it but sound still plays)
    if (!this.bgMusic) {
      const playing = this.sound.getAll('music_hub')
        .concat(this.sound.getAll('music_exploration'))
        .concat(this.sound.getAll('music_breach'))
        .find(s => s.isPlaying);
      if (playing) this.bgMusic = playing;
    }

    if (this.bgMusic && (this.bgMusic as Phaser.Sound.BaseSound).isPlaying) {
      // Fade out current track, then start new one
      this.tweens.add({
        targets: this.bgMusic,
        volume: 0,
        duration: 2000,
        ease: 'Sine.easeOut',
        onComplete: () => {
          // Guard: scene may have shut down while fade was running
          if (!this.scene || !this.scene.isActive()) return;
          if (this.bgMusic) {
            this.bgMusic.stop();
            this.bgMusic.destroy();
            this.bgMusic = undefined;
          }
          this.startMusicTrack(newTrackKey, targetVol);
        },
      });
    } else {
      // No current track (or not playing) — start new track immediately
      if (this.bgMusic) {
        this.bgMusic.stop();
        this.bgMusic.destroy();
        this.bgMusic = undefined;
      }
      this.startMusicTrack(newTrackKey, targetVol);
    }
  }

  /** Find an already-playing sound instance on the global SoundManager by key. */
  private findPlayingTrack(key: string): Phaser.Sound.BaseSound | undefined {
    return this.sound.getAll(key).find(s => s.isPlaying);
  }

  private startMusicTrack(key: string, targetVol: number): void {
    if (!this.scene || !this.scene.isActive()) return;
    try {
      this.bgMusic = this.sound.add(key, { loop: true, volume: 0, mute: true });
      this.bgMusic.play();
      this.time.delayedCall(0, () => {
        if (!this.bgMusic || !this.scene.isActive()) return;
        const ws = this.bgMusic as Phaser.Sound.WebAudioSound;
        ws.setMute(false);
        ws.volume = 0;
        this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 2000, ease: 'Sine.easeIn' });
      });
    } catch (e) {
      console.warn(`[ExplorationScene] crossfade to ${key} failed:`, e);
    }
  }

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

  private handleFanfareEvent = (data: { roomId: string; playerX: number; playerY: number }) => {
    if (!this.scene.isActive()) return;
    const { playerX, playerY } = data;

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
      const act = save?.actProgress;
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
    if (this.bgMusic) {
      try { this.tweens.killTweensOf(this.bgMusic); } catch (_) {}
      try { this.bgMusic.stop(); } catch (_) {}
      try { this.bgMusic.destroy(); } catch (_) {}
      this.bgMusic = undefined;
    }

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
      this.encounterTriggered = false;
      if (data.encounterId) {
        this.registry.set(`encounterResult_${data.encounterId}`, true);
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
    try {
      const currentAct = this.getCurrentAct();
      const ACT_MUSIC: Record<number, { track: string; baseVol: number }> = {
        1: { track: 'music_hub', baseVol: this.musicBaseVolume },
        2: { track: 'music_exploration', baseVol: this.musicBaseVolume },
        3: { track: 'music_breach', baseVol: 0.15 },
      };
      const actCfg = ACT_MUSIC[currentAct] ?? ACT_MUSIC[2];
      const roomTrack = (this.room as any).musicTrack as string | undefined;
      const roomBaseVol = (this.room as any).musicBaseVolume as number | undefined;
      const musicCfg = {
        track: roomTrack ?? actCfg.track,
        baseVol: roomBaseVol ?? actCfg.baseVol,
      };
      this.activeMusicBaseVolume = musicCfg.baseVol;
      const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
      const targetVol = musicCfg.baseVol * userVol;
      if (userVol > 0) {
        this.bgMusic = this.sound.add(musicCfg.track, { loop: true, volume: 0, mute: true });
        this.bgMusic.play();
        this.time.delayedCall(0, () => {
          if (!this.bgMusic || !this.scene.isActive()) return;
          const ws = this.bgMusic as Phaser.Sound.WebAudioSound;
          ws.setMute(false);
          ws.volume = 0;
          this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 800, ease: 'Sine.easeIn' });
        });
      }
    } catch (e) {
      // Sound manager may be in a bad state after encounter cleanup
    }
  };

  // ── Door navigation (Phase 12) ──────────────────────────────────

  private checkDoorProximity(): void {
    const doors = (this.room as any).doors;
    if (!doors || doors.length === 0) return;
    const px = this.player.x;
    const py = this.player.y;
    for (const door of doors) {
      const dx = Math.abs(px - (door.x * TILE + TILE / 2));
      const dy = Math.abs(py - (door.y * TILE + TILE / 2));
      if (dx < TILE * 1.5 && dy < TILE * 1.5) {
        this.nearDoor = door;
        return;
      }
    }
    this.nearDoor = null;
  }

  private handleDoorInteraction(door: { id: string; targetRoomId: string; x: number; y: number; side: string; label: string }): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.sound.play('sfx_footstep', { volume: 0.35, rate: 0.8 });
    // Fade music out in sync with camera fade so shutdown doesn't hard-stop it
    if (this.bgMusic && (this.bgMusic as Phaser.Sound.BaseSound).isPlaying) {
      this.tweens.add({ targets: this.bgMusic, volume: 0, duration: 300, ease: 'Sine.easeOut' });
    }
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, {
        targetRoomId: door.targetRoomId,
        fromDoorId: door.id,
      });
    });
  }

  private renderDoorStates(): void {
    const doors = (this.room as any).doors;
    if (!doors || doors.length === 0) return;

    // Clear existing door visuals so we can re-render cleanly
    for (const v of this.doorVisuals) {
      v.destroy();
    }
    this.doorVisuals = [];

    for (const door of doors) {
      const doorPixelX = door.x * TILE + TILE / 2;
      const doorPixelY = door.y * TILE + TILE / 2;
      const state = this.doorStates[door.id] ?? 'available';

      // Door frame — prominent wood frame with highlight and shadow
      const frameG = this.add.graphics().setDepth(1);
      this.doorVisuals.push(frameG);
      const fx = door.x * TILE;
      const fy = door.y * TILE - TILE / 2;
      // Frame posts (solid wood)
      frameG.fillStyle(0xa0845a, 1);
      frameG.fillRect(fx - 3, fy, 5, TILE + TILE / 2);
      frameG.fillRect(fx + TILE - 2, fy, 5, TILE + TILE / 2);
      // Frame header
      frameG.fillStyle(0xa0845a, 1);
      frameG.fillRect(fx - 3, fy, TILE + 6, 5);
      // Highlight (inner edge)
      frameG.fillStyle(0xc4a870, 0.8);
      frameG.fillRect(fx + 1, fy + 1, 1, TILE + TILE / 2 - 1);
      frameG.fillRect(fx + TILE - 3, fy + 1, 1, TILE + TILE / 2 - 1);
      frameG.fillRect(fx, fy + 1, TILE, 1);
      // Shadow (outer edge)
      frameG.fillStyle(0x5a4430, 0.7);
      frameG.fillRect(fx - 3, fy + TILE + TILE / 2 - 1, TILE + 6, 2);

      if (state === 'locked') {
        // Dark overlay + lock icon
        const overlay = this.add.graphics().setDepth(2);
        overlay.fillStyle(0x000000, 0.55);
        overlay.fillRect(door.x * TILE - TILE / 2, door.y * TILE - TILE, TILE * 2, TILE * 3);
        const lockText = this.add.text(doorPixelX, doorPixelY, '[X]', {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color: '#ff4444',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(3);
        this.doorVisuals.push(overlay, lockText);

      } else if (state === 'available') {
        // Pulsing glow ring
        const glow = this.add.circle(doorPixelX, doorPixelY, 18, 0x4a90e2, 0)
          .setStrokeStyle(2, 0x4a90e2, 1).setDepth(2);
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.2, to: 0.8 },
          scaleX: { from: 0.8, to: 1.3 },
          scaleY: { from: 0.8, to: 1.3 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.doorVisuals.push(glow);

      } else if (state === 'completed') {
        // Gold checkmark badge above door (Phase 15 upgrade — persistent fanfare badge)
        const badge = this.add.circle(doorPixelX, doorPixelY - TILE, 9, 0x2a6a2a, 1)
          .setDepth(3);
        this.doorVisuals.push(badge);
        const check = this.add.text(doorPixelX, doorPixelY - TILE, '\u2713', {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(4);
        this.doorVisuals.push(check);
      }

      // Door label (always shown)
      const labelText = this.add.text(doorPixelX, doorPixelY + TILE, door.label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: state === 'locked' ? '#888888' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5).setDepth(3);
      this.doorVisuals.push(labelText);
    }
  }

  private onLoadRoom = (data: {
    room: any;
    spawnDoorId?: string;
    completedNPCs: string[];
    completedZones: string[];
    collectedItems: string[];
    doorStates: Record<string, 'locked' | 'available' | 'completed'>;
  }) => {
    this.scene.restart(data);
  };

  private onUpdateDoorStates = (data: { doorStates: Record<string, 'locked' | 'available' | 'completed'> }) => {
    this.doorStates = data.doorStates;
    this.renderDoorStates();
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

  // ── Pathfinding (BFS on tile grid) ─────────────────────────────
  private findPath(start: Position, goal: Position): Position[] {
    const room = this.room;
    const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);

    let closestPath: Position[] = [];
    let closestDist = Infinity;

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      const dist = Math.abs(goal.x - pos.x) + Math.abs(goal.y - pos.y);

      if (dist < closestDist) {
        closestDist = dist;
        closestPath = path;
      }

      if (pos.x === goal.x && pos.y === goal.y) return path.slice(1);

      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const nx = pos.x + dx;
        const ny = pos.y + dy;
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;
        if (nx < 0 || ny < 0 || nx >= room.width || ny >= room.height) continue;
        if (this.tileBlocked(nx, ny)) continue;
        visited.add(key);
        queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
      }
    }

    return closestPath.slice(1);
  }

  private tileBlocked(tx: number, ty: number): boolean {
    const doors: Array<{ x: number; y: number }> = (this.room as any).doors || [];
    for (const obs of this.room.obstacles) {
      if (tx >= obs.x && tx < obs.x + obs.width && ty >= obs.y && ty < obs.y + obs.height) {
        // Wall tiles occupied by doors (or adjacent) are passable
        if ((obs as any).type === 'wall' && doors.some((d: any) =>
          (d.x === tx && d.y === ty) ||
          (d.x === tx && Math.abs(d.y - ty) <= 1) ||
          (d.y === ty && Math.abs(d.x - tx) <= 1)
        )) {
          continue;
        }
        return true;
      }
    }
    return false;
  }

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
      if (this.nearDoor) {
        const doorLabel = this.nearDoor.label || this.nearDoor.targetRoomId.replace(/_/g, ' ');
        this.promptText.setText(`[SPACE] Enter ${doorLabel}`);
        this.promptText.setVisible(true);
      } else {
        this.promptText.setVisible(false);
      }
    }
  }

  // ── Interaction ────────────────────────────────────────────────
  private triggerInteraction(ia: InteractableData) {
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
          // Encounter is done — emit the standard NPC interaction so the player can still
          // talk to the NPC (they may have a thank-you scene later). For now, no-op fallback.
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

  /** Player declined the encounter narrative card — unpause and allow re-trigger on next approach. */
  private onResumeFromDecline = () => {
    this.paused = false;
    this.encounterTriggered = false;
  };

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

  // ── Public: update completion state from React ─────────────────
  updateCompletionState(npcs: string[], zones: string[], items: string[]) {
    this.completedNPCs = new Set(npcs);
    this.completedZones = new Set(zones);
    this.collectedItems = new Set(items);

    // Update NPC sprite visual state for completed NPCs
    for (const ia of this.interactables) {
      if (ia.type === 'npc' && this.completedNPCs.has(ia.id)) {
        ia.sprite.setAlpha(0.4);
        ia.sprite.setTint(0x888888);
      }
      if (ia.type === 'item' && this.collectedItems.has(ia.id)) {
        ia.sprite.setAlpha(0.4);
        this.tweens.killTweensOf(ia.sprite);
      }
    }
  }
}
