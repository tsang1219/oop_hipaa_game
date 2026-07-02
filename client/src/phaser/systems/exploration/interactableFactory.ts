import Phaser from 'phaser';
import { npcTextureKey, objectTextureKey } from '../../SpriteFactory';
import { getHallwayBoard } from '../../../data/hallwayContent';
import { isDemoActive } from '@/lib/demoSession';
import type { Room, NPC, InteractionZone, EducationalItem } from '@shared/schema';

const TILE = 32;

export interface InteractableData {
  type: 'npc' | 'zone' | 'item' | 'hallwayBoard';
  id: string;
  data: NPC | InteractionZone | EducationalItem | { x: number; y: number; title: string; content: string };
  sprite: Phaser.GameObjects.Sprite;
}

/** Read-only scene state + scene-owned callbacks the spawn loops need.
 *  addCompletionCheck stays ON the scene because updateCompletionState
 *  (public API, called from React) also calls it for live-completion pops. */
export interface SpawnInteractablesCtx {
  completedNPCs: Set<string>;
  completedZones: Set<string>;
  collectedItems: Set<string>;
  /** Scene-owned registry of "talk to me!" bubble markers (F-21, Run 07) —
   *  updateCompletionState clears them on live completion, so the scene keeps
   *  the Map and the spawn loop writes into it. */
  npcBubbles: Map<string, Phaser.GameObjects.Image>;
  getCurrentAct: () => 1 | 2 | 3;
  addCompletionCheck: (x: number, y: number, depth: number, pop?: boolean) => void;
}

/**
 * Spawns every interactable in the room: educational items (+ glow auras),
 * the hallway bulletin board, interaction zones (+ zoneGlows), and NPCs
 * (+ labels, speech bubbles, boss ring). Moved verbatim from
 * ExplorationScene.create() (Round 4). Push order is load-bearing: items →
 * hallway board → zones → NPCs (the scene's first-NPC pulse targets the first
 * NPC pushed).
 */
export function spawnInteractables(
  scene: Phaser.Scene,
  room: Room,
  ctx: SpawnInteractablesCtx,
): {
  interactables: InteractableData[];
  zoneGlows: Map<string, { ring: Phaser.GameObjects.Arc; tween: Phaser.Tweens.Tween }>;
} {
  const w = room.width * TILE;
  const interactables: InteractableData[] = [];
  const zoneGlows: Map<string, { ring: Phaser.GameObjects.Arc; tween: Phaser.Tweens.Tween }> = new Map();

  // ── Educational items ────────────────────────────────────────
  for (const item of room.educationalItems) {
    const collected = ctx.collectedItems.has(item.id);
    const texKey = objectTextureKey(item.type);
    const sprite = scene.add.sprite(item.x * TILE + TILE / 2, item.y * TILE + TILE / 2, texKey);
    sprite.setAlpha(collected ? 0.4 : 1);
    if (collected) {
      sprite.setTint(0x888888);
    }
    sprite.setDepth(10);
    if (!collected) {
      // Bob tween — keep as-is
      scene.tweens.add({
        targets: sprite,
        y: sprite.y - 4,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Filled glow aura: additive gold pulsing behind the item sprite
      // The aura stays anchored; the bob moves the sprite above it — glow reads as floor-glow
      // glow_radial has soft alpha falloff so the gold tint stays gold (no white blob)
      if (scene.textures.exists('glow_radial')) {
        // Deep amber + restrained alpha: additive gold clips to white over pale
        // floors, so go darker on the tint and let the pulse carry the motion
        const aura = scene.add.image(sprite.x, sprite.y + 2, 'glow_radial')
          .setTint(0xffa000)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.45)
          .setDepth(sprite.depth - 1);
        scene.tweens.add({
          targets: aura,
          alpha: { from: 0.45, to: 0.75 },
          scale: { from: 0.85, to: 1.1 },
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        // Fallback: filled circle alpha pulse (never stroke-only)
        const auraFallback = scene.add.circle(sprite.x, sprite.y + 2, 20, 0xffd700, 0.12)
          .setDepth(sprite.depth - 1);
        scene.tweens.add({
          targets: auraFallback,
          alpha: { from: 0.12, to: 0.28 },
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      // Periodic sparkle — the Zelda "this thing matters" twinkle (Commandment 9)
      if (scene.textures.exists('particle_circle')) {
        scene.add.particles(sprite.x, sprite.y, 'particle_circle', {
          speed: { min: 8, max: 20 },
          scale: { start: 0.8, end: 0 },
          alpha: { start: 0.9, end: 0 },
          tint: [0xffffff, 0xffe9a0],
          lifespan: 500,
          frequency: 1400,
          quantity: 2,
          angle: { min: 0, max: 360 },
        } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig).setDepth(sprite.depth + 1);
      }
    }
    interactables.push({ type: 'item', id: item.id, data: item, sprite });
  }

  // ── Hallway bulletin board (Phase 15) ────────────────────────
  if (room.id.startsWith('hallway_')) {
    const act = ctx.getCurrentAct();
    const board = getHallwayBoard(room.id, act);
    if (board) {
      const boardX = w / 2;
      const boardY = 64;

      // Board shadow (depth illusion)
      scene.add.rectangle(boardX + 2, boardY + 2, 60, 44, 0x000000, 0.3)
        .setDepth(4);
      // Cork board backing with wooden frame
      const boardG = scene.add.graphics().setDepth(5);
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
      scene.add.rectangle(boardX - 1, boardY + 1, 44, 28, 0xe8dcc4).setDepth(6);
      scene.add.rectangle(boardX, boardY, 44, 28, 0xF5E6C8).setDepth(6);
      // Paper fold line
      boardG.lineStyle(1, 0xd4c8a8, 0.4);
      boardG.lineBetween(boardX - 20, boardY - 12, boardX - 20, boardY + 12);
      boardG.setDepth(7);
      // Push pins (red circles at corners)
      scene.add.circle(boardX - 18, boardY - 10, 2, 0xcc2222, 1).setDepth(7);
      scene.add.circle(boardX + 18, boardY - 10, 2, 0xcc2222, 1).setDepth(7);
      // Pin highlights
      scene.add.circle(boardX - 19, boardY - 11, 1, 0xff6666, 0.6).setDepth(7);
      scene.add.circle(boardX + 17, boardY - 11, 1, 0xff6666, 0.6).setDepth(7);
      // NOTICE label
      scene.add.text(boardX, boardY - 6, 'NOTICE', {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        color: '#8B0000',
      }).setOrigin(0.5).setDepth(7);

      // Invisible interactive sprite overlapping the board
      const boardSprite = scene.add.sprite(boardX, boardY, objectTextureKey('poster'))
        .setAlpha(0.01) // nearly invisible; visual is the rectangle above
        .setDepth(8)
        .setInteractive({ cursor: 'pointer' });

      interactables.push({
        type: 'hallwayBoard',
        id: `hallway_board_${room.id}_act${act}`,
        data: { x: Math.floor(boardX / TILE), y: Math.floor(boardY / TILE), title: board.title, content: board.text },
        sprite: boardSprite,
      });
    }
  }

  // ── Interaction zones ────────────────────────────────────────
  for (const zone of room.interactionZones) {
    const texKey = objectTextureKey(zone.spriteType || 'computer');
    const sprite = scene.add.sprite(zone.x * TILE + TILE / 2, zone.y * TILE + TILE / 2, texKey);
    sprite.setDepth(20);
    scene.tweens.add({
      targets: sprite,
      y: sprite.y - 3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Interaction zone glow ring — pulsing blue aura for incomplete zones
    // Ring + tween stored in zoneGlows map so live completion can kill it (Phase 27 VIS-08)
    if (!ctx.completedZones.has(zone.id)) {
      const zoneGlow = scene.add.circle(
        sprite.x, sprite.y, 20, 0x00aaff, 0
      ).setStrokeStyle(1.5, 0x00aaff, 0).setDepth(sprite.depth - 1);

      const glowTween = scene.tweens.add({
        targets: zoneGlow,
        strokeAlpha: { from: 0, to: 0.4 },
        scale: { from: 0.8, to: 1.2 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      zoneGlows.set(zone.id, { ring: zoneGlow, tween: glowTween });
    }

    // Completed zone checkmark (at-render time, no pop — pop is for live completion)
    if (ctx.completedZones.has(zone.id)) {
      ctx.addCompletionCheck(sprite.x, sprite.y - 16, sprite.depth + 1, false);
    }

    interactables.push({ type: 'zone', id: zone.id, data: zone, sprite });
  }

  // ── NPCs ─────────────────────────────────────────────────────
  for (const npc of room.npcs) {
    // Phase 17 (2026-06-10): Act-gated and demo-excluded NPCs.
    // If the NPC's encounterTrigger.minAct is set, skip spawning when the
    // current act is too low OR when demo mode is active (demo runs in Act 1
    // state, so Priya would appear without valid Act 3 context).
    const minAct = (npc.encounterTrigger as { minAct?: number } | undefined)?.minAct;
    if (minAct !== undefined) {
      if (isDemoActive() || ctx.getCurrentAct() < minAct) continue;
    }

    const texKey = npcTextureKey(npc.id);
    const completed = ctx.completedNPCs.has(npc.id);

    // Drop shadow at feet level (behind the sprite)
    const npcShadow = scene.add.ellipse(
      npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2 + TILE / 2 - 2,
      20, 8,
      0x000000, 0.3,
    );
    if (completed) npcShadow.setAlpha(0.15);

    const sprite = scene.add.sprite(npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2, texKey, 0);
    const npcDepth = 5 + Math.floor(sprite.y / TILE);
    sprite.setDepth(npcDepth);
    npcShadow.setDepth(npcDepth - 1);
    if (completed) {
      sprite.setAlpha(0.7);
    }

    // Name label below sprite with dark background for readability
    const labelX = npc.x * TILE + TILE / 2;
    const labelY = npc.y * TILE + TILE + 2;
    const nameLabel = scene.add.text(
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
    scene.tweens.add({
      targets: sprite,
      scaleY: { from: 1.0, to: 1.02 },
      duration: 1500 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Completed checkmark
    if (completed) {
      // At-render checkmark (no pop — pop is for live completion via updateCompletionState)
      ctx.addCompletionCheck(sprite.x, sprite.y - 20, sprite.depth + 1, false);
    }

    // Boss indicator
    if (npc.isFinalBoss && !completed) {
      const bossText = scene.add.text(npc.x * TILE + TILE / 2, npc.y * TILE - 10, 'BOSS', {
        fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#e74c3c',
      }).setOrigin(0.5).setDepth(npcDepth + 3);
      scene.tweens.add({ targets: bossText, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

      // Boss glow ring — pulsing aura that draws the player's attention
      const bossGlow = scene.add.circle(sprite.x, sprite.y, 24, 0xff4444, 0)
        .setStrokeStyle(2, 0xff6644, 0.5)
        .setDepth(sprite.depth - 1);
      scene.tweens.add({
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
      if (!scene.textures.exists(bubbleTexKey)) {
        const bg = scene.add.graphics();
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
      const bubble = scene.add.image(bubbleX, bubbleY, bubbleTexKey);
      bubble.setAlpha(0.8);
      bubble.setDepth(npcDepth + 2);
      scene.tweens.add({
        targets: bubble,
        y: bubbleY - 3,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      // F-21 (Run 07): register so live completion can clear the marker
      ctx.npcBubbles.set(npc.id, bubble);
    }

    interactables.push({ type: 'npc', id: npc.id, data: npc, sprite });
  }

  return { interactables, zoneGlows };
}
