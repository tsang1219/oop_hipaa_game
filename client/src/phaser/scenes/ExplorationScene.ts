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

    // Resize camera/world to match room dimensions
    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);

    // ── Floor ────────────────────────────────────────────────────
    const floor = this.add.graphics();
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        const shade = (x + y) % 2 === 0 ? 0xd4c5a9 : 0xcabc9e;
        floor.fillStyle(shade, 1);
        floor.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
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
        // Draw wall tiles
        for (let wy = obs.y; wy < obs.y + obs.height; wy++) {
          for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
            this.add.rectangle(wx * TILE + TILE / 2, wy * TILE + TILE / 2, TILE, TILE, 0x5d4e37)
              .setStrokeStyle(1, 0x4a3f2e);
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
      this.interactables.push({ type: 'zone', id: zone.id, data: zone, sprite });
    }

    // ── NPCs ─────────────────────────────────────────────────────
    for (const npc of room.npcs) {
      const texKey = npcTextureKey(npc.id);
      const sprite = this.add.sprite(npc.x * TILE + TILE / 2, npc.y * TILE + TILE / 2, texKey, 0);
      sprite.setDepth(25);
      const completed = this.completedNPCs.has(npc.id);
      if (completed) sprite.setAlpha(0.5);

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
        this.add.text(npc.x * TILE + TILE / 2, npc.y * TILE - 4, '\u2713', {
          fontSize: '14px', color: '#2ecc71', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(35);
      }

      // Boss indicator
      if (npc.isFinalBoss && !completed) {
        const bossText = this.add.text(npc.x * TILE + TILE / 2, npc.y * TILE - 8, 'BOSS', {
          fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#e74c3c',
        }).setOrigin(0.5).setDepth(35);
        this.tweens.add({ targets: bossText, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
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
    this.player = this.physics.add.sprite(
      this.tileX * TILE + TILE / 2,
      this.tileY * TILE + TILE / 2,
      'player_sheet',
      0, // frame 0 = idle facing down
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

    // Force-refresh all sprite textures on the next frame to prevent
    // black squares caused by programmatic textures not being GPU-ready
    // on the first render pass after scene creation.
    this.time.delayedCall(0, () => {
      this.player.setTexture('player_down');
      for (const ia of this.interactables) {
        if (ia.type === 'npc') {
          const currentTex = ia.sprite.texture.key;
          ia.sprite.setTexture(currentTex);
        }
      }
    });

    this.physics.add.collider(this.player, this.walls);

    // Camera follow in rooms larger than viewport
    if (w > 640 || h > 480) {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
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
    this.roomNameText = this.add.text(w / 2, 8, room.name.toUpperCase(), {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffffff',
      backgroundColor: '#1a1a2ecc', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 0).setDepth(50).setScrollFactor(0);

    this.promptText = this.add.text(w / 2, h - 12, '', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#ffffff',
      backgroundColor: '#1a1a2ecc', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(50).setVisible(false).setScrollFactor(0);

    // ── Listen for React events ──────────────────────────────────
    eventBridge.on(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
    eventBridge.on(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);

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
      }

      if (!left && !right && !up && !down) {
        this.player.anims.stop();
        this.player.setFrame(this.lastFacingFrame);
      }

      // Track tile position from continuous movement
      this.tileX = Math.round((this.player.x - TILE / 2) / TILE);
      this.tileY = Math.round((this.player.y - TILE / 2) / TILE);
    }

    // Proximity check
    this.checkProximity();

    // Interact key
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearbyInteractable) {
      this.triggerInteraction(this.nearbyInteractable);
    }

    // Escape to exit room
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, this.room.id);
    }
  }

  shutdown() {
    eventBridge.off(BRIDGE_EVENTS.REACT_DIALOGUE_COMPLETE, this.onDialogueComplete, this);
    eventBridge.off(BRIDGE_EVENTS.REACT_PAUSE_EXPLORATION, this.onPauseFromModal, this);
    if (this.moveTimer) this.moveTimer.destroy();
    if (this.npcPulseTween) {
      this.npcPulseTween.stop();
      this.npcPulseTween = null;
    }
  }

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
      this.promptText.setVisible(false);
    }
  }

  // ── Interaction ────────────────────────────────────────────────
  private triggerInteraction(ia: InteractableData) {
    this.sound.play('sfx_interact', { volume: 0.55 });
    this.stopNpcPulse(ia);
    this.paused = true;
    this.movePath = [];

    if (ia.type === 'npc') {
      const npc = ia.data as NPC;
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
    }
  }

  // ── Resume after dialogue ──────────────────────────────────────
  private onDialogueComplete = () => {
    this.paused = false;
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

    // Update NPC sprite alphas
    for (const ia of this.interactables) {
      if (ia.type === 'npc' && this.completedNPCs.has(ia.id)) {
        ia.sprite.setAlpha(0.5);
      }
      if (ia.type === 'item' && this.collectedItems.has(ia.id)) {
        ia.sprite.setAlpha(0.4);
        this.tweens.killTweensOf(ia.sprite);
      }
    }
  }
}
