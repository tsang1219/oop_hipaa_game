import Phaser from 'phaser';
import { npcSpriteTextureKey } from '../../sprites/npcTextures';
import { objectTexture } from './art/objectFrames';
import { resolveInteractableArt } from './art/artCatalog';
import { ATLAS_KEY } from './art/atlasFrames.generated';
import { getHallwayBoard } from '../../../data/hallwayContent';
import { getNPCColor } from '@/data/spriteAssetPaths';
import { isDemoActive } from '@/lib/demoSession';
import type { Room, NPC, InteractionZone, EducationalItem } from '@shared/schema';

const TILE = 32;

/**
 * Unified "interact here" cue. Every interactable — NPC, zone, item — gets the
 * SAME soft pulsing gold outline ring, so the affordance reads consistently
 * (previously: gold aura on items, blue ring on zones, nothing under NPCs).
 */
function addInteractCue(
  scene: Phaser.Scene, x: number, y: number, depth: number, radius = 17,
): { ring: Phaser.GameObjects.Arc; tween: Phaser.Tweens.Tween } {
  const ring = scene.add.circle(x, y, radius, 0xffcf5a, 0)
    .setStrokeStyle(2, 0xffcf5a, 0.55)
    .setDepth(depth);
  const tween = scene.tweens.add({
    targets: ring,
    scale: { from: 0.82, to: 1.2 },
    strokeAlpha: { from: 0.55, to: 0 },
    duration: 1300,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return { ring, tween };
}

export interface InteractableData {
  type: 'npc' | 'zone' | 'item' | 'hallwayBoard' | 'console' | 'whimsy';
  id: string;
  data: NPC | InteractionZone | EducationalItem | { x: number; y: number; title: string; content: string };
  sprite: Phaser.GameObjects.Sprite;
  /** NPC name plate — the scene reveals it on proximity so names don't clutter. */
  label?: Phaser.GameObjects.Text;
  /** NPC feet shadow + interact ring — Run 12: they travel with a walking NPC. */
  shadow?: Phaser.GameObjects.Ellipse;
  cue?: Phaser.GameObjects.Arc;
}

/** Whimsy interactable payload (moments-of-pure-play pass) — carried in `data`
 *  for type: 'whimsy'. `kind` routes the scene's handler; `prompt` feeds the
 *  [SPACE] hint; `ambient` (optional) joins the eavesdrop rotation. */
export interface WhimsyData {
  x: number;
  y: number;
  kind: 'printer' | 'cat' | 'zz' | 'flavor';
  prompt: string;
  line?: string;      // static line for kind: 'flavor'
  ambient?: string;   // ambient bubble line, if this object mutters
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
    const tex = objectTexture(item.type);
    const art = resolveInteractableArt(room.id, item.id);
    const sprite = scene.add.sprite(
      item.x * TILE + TILE / 2 + (art?.dx ?? 0), item.y * TILE + TILE / 2 + (art?.dy ?? 0),
      art?.frame ? ATLAS_KEY : tex.key, art?.frame ?? tex.frame,
    );
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

      // Unified interaction cue — same gold ring as zones + NPCs
      addInteractCue(scene, sprite.x, sprite.y + 2, sprite.depth - 1);

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
      // Run 11: the board hangs on the back wall right of centre (the PHI-tip poster
      // takes the centre); its interactable anchor is the floor tile beneath it.
      // Room-clean: top at y14 — at y0 the board buried the wall cap band and its
      // mount bracket poked onto the dark wall-top edge (whiteboard/notice-board
      // precedent: wall paper hangs below the cap, above the baseboard).
      const boardX = w / 2 + TILE * 1.5;
      const boardY = TILE * 2 + TILE / 2;

      scene.add.image(boardX - TILE, 14, ATLAS_KEY, 'prop.bulletin.notes').setOrigin(0, 0).setDepth(2);

      // Invisible interactive sprite overlapping the board
      const boardTex = objectTexture('poster');
      const boardSprite = scene.add.sprite(boardX, boardY, boardTex.key, boardTex.frame)
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
    const tex = objectTexture(zone.spriteType || 'computer');
    const zoneArt = resolveInteractableArt(room.id, zone.id);
    const sprite = scene.add.sprite(
      zone.x * TILE + TILE / 2 + (zoneArt?.dx ?? 0), zone.y * TILE + TILE / 2 + (zoneArt?.dy ?? 0),
      zoneArt?.frame ? ATLAS_KEY : tex.key, zoneArt?.frame ?? tex.frame,
    );
    sprite.setDepth(20);
    scene.tweens.add({
      targets: sprite,
      y: sprite.y - 3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Interaction zone cue — same unified gold ring as items + NPCs.
    // Ring + tween stored in zoneGlows map so live completion can kill it (Phase 27 VIS-08)
    if (!ctx.completedZones.has(zone.id)) {
      zoneGlows.set(zone.id, addInteractCue(scene, sprite.x, sprite.y, sprite.depth - 1));
    }

    // Completed zone checkmark (at-render time, no pop — pop is for live completion)
    if (ctx.completedZones.has(zone.id)) {
      ctx.addCompletionCheck(sprite.x, sprite.y - 16, sprite.depth + 1, false);
    }

    interactables.push({ type: 'zone', id: zone.id, data: zone, sprite });
  }

  // ── NPCs ─────────────────────────────────────────────────────
  // Collected name plates → a post-loop de-collision pass stacks any that overlap
  // (adjacent NPCs used to garble, e.g. "Marcus" + "Lab Technician" → "Marcushnician").
  const npcLabels: Phaser.GameObjects.Text[] = [];
  for (const npc of room.npcs) {
    // Phase 17 (2026-06-10): Act-gated and demo-excluded NPCs.
    // If the NPC's encounterTrigger.minAct is set, skip spawning when the
    // current act is too low OR when demo mode is active (demo runs in Act 1
    // state, so Priya would appear without valid Act 3 context).
    const minAct = (npc.encounterTrigger as { minAct?: number } | undefined)?.minAct;
    if (minAct !== undefined) {
      if (isDemoActive() || ctx.getCurrentAct() < minAct) continue;
    }

    // Prefer the PNG spritesheet (frame 0 = idle-down) keyed off the roomData
    // `sprite` field — the same source the dialogue portrait resolves through —
    // so the in-room sprite and the portrait always match.
    const texKey = npcSpriteTextureKey(scene, npc.id, (npc as { sprite?: string }).sprite);
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
    let npcCue: Phaser.GameObjects.Arc | undefined;
    if (completed) {
      sprite.setAlpha(0.7);
    } else {
      // Unified interaction cue — same gold ring as zones + items, at the NPC's feet
      npcCue = addInteractCue(scene, sprite.x, sprite.y + TILE / 2 - 3, npcDepth - 1).ring;
    }

    // Name plate — reads in the NPC's signature color. Lighter tag than before,
    // and the scene only reveals it when the player is near (declutter).
    const labelX = npc.x * TILE + TILE / 2;
    const labelY = npc.y * TILE + TILE + 2;
    const nameLabel = scene.add.text(
      labelX, labelY,
      npc.name,
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: getNPCColor(npc.id),
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: '#0b0b16bb',
        padding: { x: 3, y: 2 },
      },
    ).setOrigin(0.5, 0).setDepth(95);  // above furniture, below dialogue dim (100)
    // Clamp label horizontally so it never overflows the room/canvas bounds.
    const labelPad = 2;
    const labelHalf = nameLabel.width / 2;
    const roomPxWidth = room.width * TILE;
    const minX = labelHalf + labelPad;
    const maxX = roomPxWidth - labelHalf - labelPad;
    if (maxX >= minX) {
      nameLabel.x = Phaser.Math.Clamp(labelX, minX, maxX);
    }
    // Proximity-revealed: start hidden; the scene fades it in near the player.
    nameLabel.setData('baseAlpha', completed ? 0.45 : 1);
    nameLabel.setAlpha(0);
    npcLabels.push(nameLabel);

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
      const bossText = scene.add.text(npc.x * TILE + TILE / 2, npc.y * TILE - 14, 'BOSS', {
        fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ff6b5c',
        stroke: '#000000', strokeThickness: 4,
        backgroundColor: '#0b0b16ee', padding: { x: 4, y: 3 },
      }).setOrigin(0.5).setDepth(96);
      // Join the de-collision pass so the boss tag can't garble against an
      // adjacent NPC's name plate (records: BOSS vs "Records Clerk").
      npcLabels.push(bossText);
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

    interactables.push({ type: 'npc', id: npc.id, data: npc, sprite, label: nameLabel, shadow: npcShadow, cue: npcCue });
  }

  // ── Name-plate de-collision ──────────────────────────────────
  // Greedily place labels top-to-bottom; if one overlaps an already-placed
  // plate, push it down a line until it clears. Turns garbled adjacent labels
  // ("Marcushnician") into a clean vertical stack.
  const placed: Phaser.Geom.Rectangle[] = [];
  const overlaps = (a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  const sorted = [...npcLabels].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const lineH = 15;
  for (const lbl of sorted) {
    let rect = lbl.getBounds();
    let guard = 0;
    while (guard++ < 8 && placed.some((p) => overlaps(rect, p))) {
      lbl.y += lineH;
      rect = lbl.getBounds();
    }
    placed.push(rect);
  }

  return { interactables, zoneGlows };
}
