import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../EventBridge';
import { generateAllTextures, furnitureTextureKey, npcTextureKey, npcTypeFromId, objectTextureKey } from '../SpriteFactory';
import type { Room, NPC, InteractionZone, EducationalItem, Position } from '@shared/schema';

const TILE = 32;
const MOVE_SPEED = 160; // pixels/sec

interface InteractableData {
  type: 'npc' | 'zone' | 'item';
  id: string;
  data: NPC | InteractionZone | EducationalItem;
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

  // Background music
  private bgMusic?: Phaser.Sound.BaseSound;
  private readonly musicBaseVolume = 0.25;

  constructor() {
    super({ key: 'Exploration' });
  }

  init(data: {
    room: Room;
    completedNPCs?: string[];
    completedZones?: string[];
    collectedItems?: string[];
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
    if (this.npcPulseTween) {
      this.npcPulseTween.stop();
      this.npcPulseTween = null;
    }
    this.npcPulseTarget = null;
  }

  create() {
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
    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);

    // ── Floor — beveled hospital tiles with room-specific color variation ──
    const floor = this.add.graphics();
    const roomId = room.id.toLowerCase();
    let tileShades: number[];
    let highlightColor: number;
    let shadowColor: number;
    if (roomId.includes('er') || roomId.includes('emergency')) {
      // Sterile/clinical blue tint
      tileShades = [0xccd4d8, 0xc8d0d4, 0xc4ccd0, 0xd0d8dc];
      highlightColor = 0xdce4e8;
      shadowColor = 0xb0b8bc;
    } else if (roomId.includes('lab')) {
      // Scientific green tint
      tileShades = [0xc8d4c8, 0xc4d0c4, 0xc0ccc0, 0xccd8cc];
      highlightColor = 0xd8e4d8;
      shadowColor = 0xacb8ac;
    } else if (roomId.includes('it') || roomId.includes('server')) {
      // Tech blue-grey tint
      tileShades = [0xc8ccd4, 0xc4c8d0, 0xc0c4cc, 0xccd0d8];
      highlightColor = 0xd8dce4;
      shadowColor = 0xacb0b8;
    } else if (roomId.includes('break')) {
      // Cozy warm tint
      tileShades = [0xd8ccb4, 0xd4c8b0, 0xd0c4ac, 0xdcd0b8];
      highlightColor = 0xe8dcc4;
      shadowColor = 0xbcb098;
    } else {
      // Default beige (reception, records, etc.)
      tileShades = [0xd4c9a8, 0xd0c5a4, 0xccc0a0, 0xd8cdb0];
      highlightColor = 0xe2d8bc;
      shadowColor = 0xb8ad94;
    }
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
        if ((x + y) % 2 === 0) {
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
        floor.fillStyle(shadowColor, 0.3);
        floor.fillRect(px + TILE - 1, py, 1, TILE); // right grout
        floor.fillRect(px, py + TILE - 1, TILE, 1); // bottom grout
      }
    }

    // Room-specific ambient color overlay
    const roomTints: Record<string, number> = {
      reception: 0x4a90e2,     // Blue — professional
      records_room: 0x2ecc71,  // Green — organized
      er: 0xff6b6b,            // Red — urgent
      lab: 0x9b59b6,           // Purple — scientific
      break_room: 0xf39c12,    // Warm amber — relaxed
      it_office: 0x00d4aa,     // Teal — tech
    };
    const tintColor = roomTints[this.room.id] || 0xffffff;
    if (tintColor !== 0xffffff) {
      this.add.rectangle(
        w / 2, h / 2, w, h, tintColor, 0.04
      ).setDepth(0);
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
        for (let wy = obs.y; wy < obs.y + obs.height; wy++) {
          for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
            const wpx = wx * TILE;
            const wpy = wy * TILE;

            // Main wall fill — use two alternating shades for brick-like pattern
            const isEvenTile = (wx + wy) % 2 === 0;
            const wallBase = isEvenTile ? 0x5d4e37 : 0x574930;
            wallG.fillStyle(wallBase, 1);
            wallG.fillRect(wpx, wpy, TILE, TILE);

            // Horizontal mortar line at 1/3 and 2/3 height
            wallG.fillStyle(0x4a3f2e, 0.6);
            wallG.fillRect(wpx, wpy + 10, TILE, 1);
            wallG.fillRect(wpx, wpy + 21, TILE, 1);

            // Vertical mortar offset (brick bond pattern)
            const vOffset = wy % 2 === 0 ? 16 : 0;
            wallG.fillStyle(0x4a3f2e, 0.5);
            wallG.fillRect(wpx + vOffset, wpy, 1, TILE);

            // Top highlight
            wallG.fillStyle(0x7a6b52, 0.6);
            wallG.fillRect(wpx, wpy, TILE, 1);
            wallG.fillRect(wpx, wpy, 1, TILE); // left highlight

            // Bottom shadow (wall meets floor)
            wallG.fillStyle(0x3a3124, 0.8);
            wallG.fillRect(wpx, wpy + TILE - 2, TILE, 2);
            wallG.fillRect(wpx + TILE - 1, wpy, 1, TILE); // right shadow

            // Subtle surface texture — tiny noise dots
            if ((wx * 3 + wy * 5) % 4 === 0) {
              wallG.fillStyle(0x6a5b44, 0.3);
              wallG.fillRect(wpx + 8, wpy + 6, 2, 1);
              wallG.fillRect(wpx + 20, wpy + 14, 2, 1);
            }
          }
        }
      } else {
        // Furniture — place a sprite at center of the obstacle area
        const texKey = furnitureTextureKey(obsType);
        if (obs.width === 1 && obs.height === 1) {
          this.add.sprite(ox + TILE / 2, oy + TILE / 2, texKey);
        } else {
          // For multi-tile furniture, fill with a rectangle and one sprite
          this.add.rectangle(ox + ow / 2, oy + oh / 2, ow, oh, 0x8b7355, 0.4)
            .setStrokeStyle(1, 0x5d4e37);
          this.add.sprite(ox + ow / 2, oy + oh / 2, texKey);
        }
      }

      // Physics collision body (invisible)
      const wallRect = this.add.rectangle(ox + ow / 2, oy + oh / 2, ow, oh);
      wallRect.setVisible(false);
      this.walls.add(wallRect);
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
      const texKey = npcTextureKey(npc.id);
      const completed = this.completedNPCs.has(npc.id);

      // Drop shadow at feet level (behind the sprite)
      const npcShadow = this.add.ellipse(
        npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2 + TILE / 2 - 2,
        20, 8,
        0x000000, 0.3,
      );
      npcShadow.setDepth(24);
      if (completed) npcShadow.setAlpha(0.15);

      const sprite = this.add.sprite(npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2, texKey, 0);
      sprite.setDepth(25);
      if (completed) {
        sprite.setAlpha(0.7);
      }

      // Name label below sprite
      const nameLabel = this.add.text(
        npc.x * TILE + TILE / 2,
        npc.y * TILE + TILE + 2,
        npc.name,
        {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        },
      ).setOrigin(0.5, 0).setDepth(26);
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
        }).setOrigin(0.5).setDepth(35);
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
          // White rounded rectangle body (10x8)
          bg.fillStyle(0xffffff, 1);
          bg.fillRoundedRect(0, 0, 10, 8, 2);
          // Tiny triangular tail pointing down
          bg.fillStyle(0xffffff, 1);
          bg.fillTriangle(3, 8, 7, 8, 5, 11);
          // Subtle border
          bg.lineStyle(1, 0x888888, 0.5);
          bg.strokeRoundedRect(0, 0, 10, 8, 2);
          bg.generateTexture(bubbleTexKey, 10, 12);
          bg.destroy();
        }
        const bubbleX = npc.x * TILE + TILE / 2;
        const bubbleY = npc.y * TILE + TILE / 2 - 20;
        const bubble = this.add.image(bubbleX, bubbleY, bubbleTexKey);
        bubble.setAlpha(0.8);
        bubble.setDepth(27);
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

    // ── Player ───────────────────────────────────────────────────
    // Frame 0 = idle facing down (row 0, col 0 from CREDITS.md layout)
    // PLAYER_IDLE_FRAMES: down=0, left=3, right=6, up=9 (row * 3 + 0)
    this.tileX = room.spawnPoint.x;
    this.tileY = room.spawnPoint.y;
    // Use programmatic player texture — spritesheet has timing issues in QA/fast scene starts
    this.player = this.physics.add.sprite(
      this.tileX * TILE + TILE / 2,
      this.tileY * TILE + TILE / 2,
      'player_down',
    );
    this.player.setDepth(30);

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

    // ── Exit door glow at spawn point ──────────────────────────
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
    this.roomNameText = this.add.text(w / 2, 8, room.name.toUpperCase(), {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffffff',
      backgroundColor: '#1a1a2ecc', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setDepth(50).setScrollFactor(0);

    this.promptText = this.add.text(w / 2, h - 12, '', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffffff',
      backgroundColor: '#1a1a2ecc', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 1).setDepth(50).setVisible(false).setScrollFactor(0);

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

    // ── Listen for React events — MUST be before music to survive any audio errors ──
    eventBridge.on(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_PLAY_SFX, this.onPlaySfx, this);

    // Listen for correct/incorrect answer feedback from React
    eventBridge.on('react:answer-feedback', (data: { type: string }) => {
      if (data.type === 'correct') {
        this.cameras.main.flash(200, 100, 255, 100, false); // green flash
      } else if (data.type === 'incorrect') {
        this.cameras.main.flash(200, 255, 80, 80, false); // red flash
      }
    });

    // Sync mute state from localStorage before any audio plays
    if (localStorage.getItem('sfx_muted') === 'true') {
      this.sound.mute = true;
    }

    // ── Background music — fade in gently after a beat ────────
    try {
      const userVol = parseFloat(localStorage.getItem('music_volume') ?? '0.6');
      const targetVol = this.musicBaseVolume * userVol;
      if (userVol > 0) {
        this.bgMusic = this.sound.add('music_exploration', { loop: true, volume: 0 });
        const playMusic = () => {
          if (!this.bgMusic || !this.scene.isActive()) return;
          this.bgMusic.play();
          this.tweens.add({ targets: this.bgMusic, volume: targetVol, duration: 1500, ease: 'Sine.easeIn' });
        };
        if (this.sound.locked) {
          this.sound.once('unlocked', playMusic);
        } else {
          this.time.delayedCall(300, playMusic);
        }
      }
    } catch (e) {
      console.warn('[ExplorationScene] music_exploration not ready, skipping BGM:', e);
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

    // Update player shadow + label position to follow player
    this.playerShadow.setPosition(this.player.x, this.player.y + TILE / 2 - 2);
    this.playerLabel.setPosition(this.player.x, this.player.y - TILE / 2 - 4);

    // Proximity check
    this.checkProximity();

    // Interact key
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearbyInteractable) {
      this.triggerInteraction(this.nearbyInteractable);
    }

    // Escape to exit room
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.sound.play('sfx_interact', { volume: 0.4 });
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, this.room.id);
    }
  }

  shutdown() {
    if (this.bgMusic) {
      this.bgMusic.stop();
      this.bgMusic = undefined;
    }
    eventBridge.off(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, this.onMusicVolume, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_PLAY_SFX, this.onPlaySfx, this);
    eventBridge.off('react:answer-feedback');
    if (this.moveTimer) this.moveTimer.destroy();
    if (this.npcPulseTween) {
      this.npcPulseTween.stop();
      this.npcPulseTween = null;
    }
  }

  private onMusicVolume = (vol: number) => {
    if (this.bgMusic) {
      (this.bgMusic as Phaser.Sound.WebAudioSound).volume = this.musicBaseVolume * vol;
    }
  };

  private onPlaySfx = (data: { key: string; volume?: number }) => {
    try {
      if (this.sound && this.sound.get(data.key)) {
        this.sound.play(data.key, { volume: data.volume ?? 0.5 });
      }
    } catch (e) {
      // Sound manager may be in a bad state (e.g. sounds array null after
      // WebAudio context destruction). Safe to swallow here.
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
    for (const obs of this.room.obstacles) {
      if (tx >= obs.x && tx < obs.x + obs.width && ty >= obs.y && ty < obs.y + obs.height) {
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
      // Play subtle proximity cue when approaching an interactable
      if (closest !== this.nearbyInteractable && closest) {
        this.sound.play('sfx_interact', { volume: 0.15 });
      }
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
      this.promptText.setVisible(false);
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

  // ── Resume after dialogue ──────────────────────────────────────
  private onDialogueComplete = () => {
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
    this.paused = true;
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
