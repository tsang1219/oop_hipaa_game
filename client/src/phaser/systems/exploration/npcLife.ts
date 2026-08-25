import Phaser from 'phaser';
import { tileBlocked } from './pathfinding';
import { blinkTextureKey, ensureBlinkTexture } from './blinkFrames';
import { playSfx } from './audioMixer';
import { objectTexture, atlasRef } from './art/objectFrames';
import type { Room, NPC, Position } from '@shared/schema';
import type { InteractableData } from './interactableFactory';

const TILE = 32;
const COLS = 3;

export type Dir = 'down' | 'left' | 'right' | 'up';
const IDLE_FRAME: Record<Dir, number> = { down: 0, left: 1 * COLS, right: 2 * COLS, up: 3 * COLS };
const OPPOSITE: Record<Dir, Dir> = { down: 'up', up: 'down', left: 'right', right: 'left' };

type FidgetKind =
  | 'lookAround' | 'shiftWeight' | 'nod' | 'stretch' | 'tapFoot'
  | 'chart' | 'sip' | 'phone' | 'type' | 'sigh' | 'yawn';

/** ANIM-04 — role-specific idle fidgets. Keyed by the SHEET type actually
 *  drawn on screen (not the legacy id→texture map), so the motion always
 *  matches the body the player is looking at. Minimum 2 distinct per role. */
const ROLE_FIDGETS: Record<string, FidgetKind[]> = {
  receptionist: ['type', 'lookAround', 'chart'],
  nurse:        ['chart', 'shiftWeight', 'lookAround'],
  doctor:       ['chart', 'lookAround', 'tapFoot'],
  it_tech:      ['sip', 'stretch', 'type'],
  officer:      ['chart', 'shiftWeight', 'lookAround'],
  boss:         ['nod', 'lookAround', 'shiftWeight'],
  staff:        ['stretch', 'lookAround', 'shiftWeight', 'phone'],
  patient:      ['shiftWeight', 'sigh', 'tapFoot'],
  visitor:      ['phone', 'lookAround', 'shiftWeight'],
  lawyer:       ['shiftWeight', 'nod', 'chart'],
};

/** Per-character personality overrides (the fiction wins over the sheet). */
const NPC_FIDGETS: Record<string, FidgetKind[]> = {
  tired_employee:     ['yawn', 'sigh', 'shiftWeight'],
  selfie_coworker:    ['phone', 'phone', 'lookAround'],
  gossiping_coworker: ['lookAround', 'shiftWeight', 'nod'],
  nervous_patient:    ['shiftWeight', 'tapFoot', 'sigh'],
  chatty_visitor:     ['lookAround', 'nod', 'phone'],
  security_analyst:   ['type', 'sip', 'stretch'],
  workaround_employee:['phone', 'shiftWeight', 'lookAround'],
  records_clerk:      ['type', 'chart', 'lookAround'],
  dr_martinez:        ['chart', 'lookAround', 'tapFoot'],
  frantic_family:     ['shiftWeight', 'lookAround', 'phone'],
  hr_director:        ['sip', 'nod', 'lookAround'],
  courier:            ['phone', 'tapFoot', 'lookAround'],
};

interface WanderConfig { radius: number; speed: number; stationary?: boolean }

/** ANIM-02 — who walks, how far from their spot, and how fast.
 *  Defaults: radius 2 tiles, a stroll. The fiction pins some people in place
 *  (receptionists behind desks, the analyst at the monitors, bosses holding
 *  their mark for the encounter framing). Progression-critical NPCs
 *  (encounter triggers, final bosses) never wander at all. */
const WANDER: Record<string, WanderConfig> = {
  dr_martinez:        { radius: 3, speed: 118 }, // the rushed ER doctor actually rushes
  courier:            { radius: 3, speed: 96 },
  security_analyst:   { radius: 0, speed: 0, stationary: true },
  records_clerk:      { radius: 0, speed: 0, stationary: true },
  lab_tech:           { radius: 1, speed: 70 },
  researcher:         { radius: 2, speed: 64 },
  nervous_patient:    { radius: 1, speed: 56 },
  tired_employee:     { radius: 1, speed: 44 },
  chatty_visitor:     { radius: 2, speed: 80 },
  frantic_family:     { radius: 2, speed: 104 },
  officer:            { radius: 2, speed: 60 },
  hr_director:        { radius: 2, speed: 66 },
  selfie_coworker:    { radius: 2, speed: 72 },
  gossiping_coworker: { radius: 1, speed: 64 },
  friend_fishing:     { radius: 2, speed: 70 },
  vendor:             { radius: 2, speed: 74 },
  workaround_employee:{ radius: 2, speed: 88 },
  patient_request:    { radius: 1, speed: 52 },
  attorney:           { radius: 2, speed: 66 },
};
const DEFAULT_WANDER: WanderConfig = { radius: 2, speed: 72 };
const DESK_BOUND_SHEETS = new Set(['receptionist']);

type LifeState = 'idle' | 'walking' | 'talking';

interface LifeEntry {
  ia: InteractableData;
  npc: NPC;
  id: string;
  role: string;
  sprite: Phaser.GameObjects.Sprite;
  sheetKey: string | null;
  blinkKey: string | null;
  homeTx: number; homeTy: number;
  tx: number; ty: number;
  facing: Dir;
  state: LifeState;
  path: Position[];
  wander: WanderConfig;
  wanderEnabled: boolean;
  legsSinceHome: number;
  nextWanderAt: number;
  nextBlinkAt: number;
  blinkUntil: number;
  doubleBlinkPending: boolean;
  nextFidgetAt: number;
  fidgetBusyUntil: number;
  fidgetCursor: number;
  fidgets: FidgetKind[];
  playerNear: boolean;
  returnFacingAt: number;
  /** Attached visuals that travel with the sprite (offsets from the sprite). */
  attached: Array<{ obj: Phaser.GameObjects.Components.Transform & { active?: boolean }; dx: number; dy: number }>;
  stats: { blinks: number; fidgets: number; legs: number; turns: number };
}

export interface NpcLifeHost {
  isPaused(): boolean;
  playerPos(): { x: number; y: number };
  /** Scene-owned "talk to me" bubble markers (they bob on a y tween, so they
   *  are re-anchored on arrival rather than dragged every frame). */
  getBubble(id: string): Phaser.GameObjects.Image | undefined;
}

export interface NpcLifeSnapshot {
  id: string;
  tile: { x: number; y: number };
  home: { x: number; y: number };
  facing: Dir;
  state: LifeState;
  canWander: boolean;
  blinks: number;
  fidgets: number;
  legs: number;
  turns: number;
}

/**
 * NpcLifeController — ANIM-01/02/03/04 for every NPC in the room.
 *
 * Everything runs off the scene clock in update() (no stacked timers), and
 * every tween goes through scene.tweens, so a scene restart on room change
 * cleans it all up the same way the other life passes already rely on.
 *
 * Interaction safety (the brief's "NPC wandering must never break
 * interaction"): the scene's proximity test asks `currentTile(id)` and
 * accepts EITHER the NPC's home tile or the tile it is standing on, so a
 * walker is reachable wherever it is; `onInteract()` freezes it in place and
 * turns it to the player; while the host reports paused no new step starts.
 */
export class NpcLifeController {
  private entries: LifeEntry[] = [];
  private byId = new Map<string, LifeEntry>();
  /** Tiles reserved by NPCs (current + target) so two never share one. */
  private occupied = new Map<string, string>();
  /** Tiles that are never wander targets: items, zones, whimsy anchors, doors. */
  private forbidden = new Set<string>();
  private iconTexturesReady = false;

  constructor(private scene: Phaser.Scene, private room: Room, private host: NpcLifeHost) {}

  build(interactables: InteractableData[]): void {
    this.entries = [];
    this.byId.clear();
    this.occupied.clear();
    this.forbidden.clear();
    this.ensureIconTextures();

    for (const ia of interactables) {
      const d = ia.data as { x: number; y: number };
      if (ia.type !== 'npc') this.forbidden.add(key(d.x, d.y));
    }
    for (const door of ((this.room as any).doors ?? []) as Array<{ x: number; y: number }>) {
      this.forbidden.add(key(door.x, door.y));
    }
    this.forbidden.add(key(this.room.spawnPoint.x, this.room.spawnPoint.y));

    const now = this.scene.time.now;
    for (const ia of interactables) {
      if (ia.type !== 'npc') continue;
      const npc = ia.data as NPC;
      const sprite = ia.sprite;
      const texKey = sprite.texture.key;
      const hasSheet = texKey.endsWith('_sheet');
      const role = texKey.replace(/^npc_/, '').replace(/_sheet$/, '');
      const blinkKey = hasSheet && ensureBlinkTexture(this.scene, texKey) ? blinkTextureKey(texKey) : null;
      const completed = sprite.alpha < 0.9;
      const cfg = WANDER[npc.id] ?? DEFAULT_WANDER;
      const canWander =
        hasSheet && !completed && !cfg.stationary && cfg.radius > 0 &&
        !npc.isFinalBoss && !npc.encounterTrigger && !DESK_BOUND_SHEETS.has(role);

      const attached: LifeEntry['attached'] = [];
      const attach = (obj?: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform) => {
        if (obj) attached.push({ obj, dx: obj.x - sprite.x, dy: obj.y - sprite.y });
      };
      attach(ia.shadow);
      attach(ia.cue);
      // ia.label is NOT attached — the Run 14 nameplate layout owns plate
      // positions (it follows the sprite itself and re-solves collisions).

      const entry: LifeEntry = {
        ia, npc, id: npc.id, role, sprite,
        sheetKey: hasSheet ? texKey : null,
        blinkKey,
        homeTx: npc.x, homeTy: npc.y, tx: npc.x, ty: npc.y,
        facing: 'down',
        state: 'idle',
        path: [],
        wander: cfg,
        wanderEnabled: canWander,
        legsSinceHome: 0,
        nextWanderAt: now + 2500 + Math.random() * 9000,
        nextBlinkAt: now + 300 + Math.random() * 4500, // phase-offset the first blink per NPC
        blinkUntil: 0,
        doubleBlinkPending: false,
        nextFidgetAt: now + 1200 + Math.random() * 6000,
        fidgetBusyUntil: 0,
        fidgetCursor: Math.floor(Math.random() * 3),
        fidgets: NPC_FIDGETS[npc.id] ?? ROLE_FIDGETS[role] ?? ROLE_FIDGETS.staff,
        playerNear: false,
        returnFacingAt: 0,
        attached,
        stats: { blinks: 0, fidgets: 0, legs: 0, turns: 0 },
      };
      this.entries.push(entry);
      this.byId.set(npc.id, entry);
      this.occupied.set(key(npc.x, npc.y), npc.id);
    }
  }

  /** Tile the NPC is standing on (or walking into) right now. */
  currentTile(id: string): { x: number; y: number } | null {
    const e = this.byId.get(id);
    return e ? { x: e.tx, y: e.ty } : null;
  }

  /** The player pressed SPACE on this NPC: stop, turn to them, hold it. */
  onInteract(id: string): void {
    const e = this.byId.get(id);
    if (!e) return;
    this.stopWalking(e, true);
    e.state = 'talking';
    this.facePlayer(e, true);
    e.nextWanderAt = this.scene.time.now + 6000 + Math.random() * 6000;
    e.nextFidgetAt = this.scene.time.now + 4000;
  }

  /** Dialogue closed — the NPC may go about its business again. */
  onInteractEnd(): void {
    for (const e of this.entries) if (e.state === 'talking') e.state = 'idle';
  }

  /** NPC just got completed (faded out) — walk home and stay there. */
  setCompleted(id: string): void {
    const e = this.byId.get(id);
    if (!e) return;
    e.wanderEnabled = false;
    if (e.state === 'walking') return; // current step finishes, then it idles
    if (e.tx !== e.homeTx || e.ty !== e.homeTy) this.startLeg(e, { x: e.homeTx, y: e.homeTy });
  }

  snapshot(): NpcLifeSnapshot[] {
    return this.entries.map(e => ({
      id: e.id,
      tile: { x: e.tx, y: e.ty },
      home: { x: e.homeTx, y: e.homeTy },
      facing: e.facing,
      state: e.state,
      canWander: e.wanderEnabled,
      blinks: e.stats.blinks,
      fidgets: e.stats.fidgets,
      legs: e.stats.legs,
      turns: e.stats.turns,
    }));
  }

  update(): void {
    const now = this.scene.time.now;
    const paused = this.host.isPaused();
    const player = this.host.playerPos();

    for (const e of this.entries) {
      if (!e.sprite.active) continue;
      this.syncAttached(e);

      // ── ANIM-01 blink (also while talking — a frozen face in a chat is worse) ──
      if (e.blinkKey && e.state !== 'walking' && e.facing !== 'up' && !e.sprite.anims.isPlaying) {
        if (e.blinkUntil && now >= e.blinkUntil) {
          e.blinkUntil = 0;
          if (e.sprite.texture.key === e.blinkKey && e.sheetKey) e.sprite.setTexture(e.sheetKey, IDLE_FRAME[e.facing]);
          if (e.doubleBlinkPending) { e.doubleBlinkPending = false; e.nextBlinkAt = now + 160; }
        } else if (!e.blinkUntil && now >= e.nextBlinkAt) {
          e.sprite.setTexture(e.blinkKey, IDLE_FRAME[e.facing]);
          e.blinkUntil = now + 110;
          e.stats.blinks++;
          e.doubleBlinkPending = Math.random() < 0.12;
          e.nextBlinkAt = now + 2800 + Math.random() * 3700; // 2.8–6.5s, per-NPC phase
        }
      }

      if (paused) continue; // mid-step tweens finish on their own; nothing new starts

      // ── ANIM-03 turn to face the player within ~2 tiles ──
      if (e.state === 'idle' && e.sheetKey) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, e.sprite.x, e.sprite.y);
        if (dist < TILE * 2.25) {
          if (!e.playerNear) { e.playerNear = true; e.stats.turns++; }
          this.facePlayer(e, false);
          e.returnFacingAt = now + 1500 + Math.random() * 1500;
        } else if (e.playerNear) {
          e.playerNear = false;
        } else if (e.returnFacingAt && now >= e.returnFacingAt) {
          e.returnFacingAt = 0;
          if (e.facing !== 'down') this.setFacing(e, 'down');
        }
      }

      // ── ANIM-04 fidgets ──
      if (e.state === 'idle' && now >= e.nextFidgetAt && now >= e.fidgetBusyUntil && !e.blinkUntil) {
        this.playFidget(e);
        e.nextFidgetAt = now + 7000 + Math.random() * 7000;
      }

      // ── ANIM-02 wander ──
      if (e.state === 'idle' && e.wanderEnabled && now >= e.nextWanderAt && now >= e.fidgetBusyUntil && !e.playerNear) {
        this.planWander(e);
      }
    }
  }

  // ── Facing ──────────────────────────────────────────────────────
  private setFacing(e: LifeEntry, dir: Dir): void {
    e.facing = dir;
    if (!e.sheetKey) return;
    if (e.blinkUntil && e.blinkKey && dir !== 'up') {
      e.sprite.setTexture(e.blinkKey, IDLE_FRAME[dir]);
    } else {
      e.sprite.anims.stop();
      e.sprite.setTexture(e.sheetKey, IDLE_FRAME[dir]);
    }
  }

  private facePlayer(e: LifeEntry, force: boolean): void {
    const p = this.host.playerPos();
    const ddx = p.x - e.sprite.x;
    const ddy = p.y - e.sprite.y;
    const dir: Dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
    if (force || dir !== e.facing) this.setFacing(e, dir);
  }

  // ── Attached visuals ───────────────────────────────────────────
  private syncAttached(e: LifeEntry): void {
    for (const a of e.attached) {
      if ((a.obj as { active?: boolean }).active === false) continue;
      a.obj.setPosition(e.sprite.x + a.dx, e.sprite.y + a.dy);
    }
  }

  private reanchorBubble(e: LifeEntry): void {
    const bubble = this.host.getBubble(e.id);
    if (!bubble || !bubble.active) return;
    this.scene.tweens.killTweensOf(bubble);
    const bubbleY = e.sprite.y - 20;
    bubble.setPosition(e.sprite.x, bubbleY);
    bubble.setDepth(e.sprite.depth + 2);
    this.scene.tweens.add({
      targets: bubble, y: bubbleY - 3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private setDepthForY(e: LifeEntry): void {
    const depth = 5 + Math.floor(e.sprite.y / TILE);
    e.sprite.setDepth(depth);
    if (e.ia.shadow?.active) e.ia.shadow.setDepth(depth - 1);
    if (e.ia.cue?.active) e.ia.cue.setDepth(depth - 1);
  }

  // ── ANIM-02: wander ────────────────────────────────────────────
  private planWander(e: LifeEntry): void {
    const now = this.scene.time.now;
    const goHome = e.legsSinceHome >= 2 + Math.floor(Math.random() * 2) && (e.tx !== e.homeTx || e.ty !== e.homeTy);
    let target: Position | null = null;
    if (goHome) {
      target = { x: e.homeTx, y: e.homeTy };
    } else {
      const candidates: Position[] = [];
      const r = e.wander.radius;
      for (let ty = e.homeTy - r; ty <= e.homeTy + r; ty++) {
        for (let tx = e.homeTx - r; tx <= e.homeTx + r; tx++) {
          if (tx === e.tx && ty === e.ty) continue;
          if (this.tileOpen(e, tx, ty)) candidates.push({ x: tx, y: ty });
        }
      }
      if (candidates.length === 0) {
        e.nextWanderAt = now + 4000 + Math.random() * 4000;
        return;
      }
      target = candidates[Math.floor(Math.random() * candidates.length)];
    }
    const path = this.findLocalPath(e, target);
    if (path.length === 0) {
      e.nextWanderAt = now + 3000 + Math.random() * 4000;
      return;
    }
    e.path = path;
    e.legsSinceHome = target.x === e.homeTx && target.y === e.homeTy ? 0 : e.legsSinceHome + 1;
    e.stats.legs++;
    this.stepAlongPath(e);
  }

  private tileOpen(e: LifeEntry, tx: number, ty: number): boolean {
    if (tx < 1 || ty < 1 || tx >= this.room.width - 1 || ty >= this.room.height - 1) return false;
    if (tileBlocked(this.room, tx, ty)) return false;
    const k = key(tx, ty);
    if (this.forbidden.has(k)) return false;
    const owner = this.occupied.get(k);
    if (owner && owner !== e.id) return false;
    // Other NPCs' home tiles are theirs even while they're out walking.
    for (const o of this.entries) {
      if (o !== e && o.homeTx === tx && o.homeTy === ty) return false;
    }
    // Never path onto or right next to the player.
    const p = this.host.playerPos();
    const ptx = Math.round((p.x - TILE / 2) / TILE);
    const pty = Math.round((p.y - TILE / 2) / TILE);
    if (Math.abs(ptx - tx) + Math.abs(pty - ty) <= 1) return false;
    return true;
  }

  /** BFS restricted to the NPC's wander radius (+1 for routing around props). */
  private findLocalPath(e: LifeEntry, goal: Position): Position[] {
    const r = e.wander.radius + 1;
    const start = { x: e.tx, y: e.ty };
    const queue: Array<{ pos: Position; path: Position[] }> = [{ pos: start, path: [] }];
    const visited = new Set<string>([key(start.x, start.y)]);
    while (queue.length) {
      const { pos, path } = queue.shift()!;
      if (pos.x === goal.x && pos.y === goal.y) return path;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
        const nx = pos.x + dx, ny = pos.y + dy;
        const k = key(nx, ny);
        if (visited.has(k)) continue;
        if (Math.abs(nx - e.homeTx) > r || Math.abs(ny - e.homeTy) > r) continue;
        const isGoal = nx === goal.x && ny === goal.y;
        if (!isGoal && !this.tileOpen(e, nx, ny)) continue;
        if (isGoal && !(nx === e.homeTx && ny === e.homeTy) && !this.tileOpen(e, nx, ny)) continue;
        visited.add(k);
        queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
      }
    }
    return [];
  }

  private stepAlongPath(e: LifeEntry): void {
    if (this.host.isPaused() || e.path.length === 0) {
      this.arrive(e);
      return;
    }
    const next = e.path[0];
    // Re-validate right before stepping: someone (or the player) may have moved in.
    const isHome = next.x === e.homeTx && next.y === e.homeTy;
    if (!isHome && !this.tileOpen(e, next.x, next.y)) {
      e.path = [];
      this.arrive(e);
      return;
    }
    e.path.shift();
    this.startLeg(e, next);
  }

  private startLeg(e: LifeEntry, next: Position): void {
    const dx = next.x - e.tx, dy = next.y - e.ty;
    const dir: Dir = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
    e.state = 'walking';
    e.facing = dir;
    this.occupied.delete(key(e.tx, e.ty));
    this.occupied.set(key(next.x, next.y), e.id);
    e.tx = next.x; e.ty = next.y;

    const bubble = this.host.getBubble(e.id);
    if (bubble?.active) { this.scene.tweens.killTweensOf(bubble); bubble.setAlpha(0); }

    if (e.blinkUntil && e.sheetKey) { e.blinkUntil = 0; e.sprite.setTexture(e.sheetKey, IDLE_FRAME[dir]); }
    const animKey = `npc_${e.role}_walk_${dir}`;
    if (this.scene.anims.exists(animKey)) e.sprite.anims.play(animKey, true);

    const speed = e.wander.speed || DEFAULT_WANDER.speed;
    this.scene.tweens.add({
      targets: e.sprite,
      x: next.x * TILE + TILE / 2,
      y: next.y * TILE + TILE / 2,
      duration: Math.round((TILE / speed) * 1000),
      ease: 'Linear',
      onUpdate: () => this.setDepthForY(e),
      onComplete: () => {
        if (!e.sprite.active) return;
        this.setDepthForY(e);
        if (e.path.length > 0 && !this.host.isPaused() && e.state === 'walking') {
          this.stepAlongPath(e);
        } else {
          this.arrive(e);
        }
      },
    });
  }

  private arrive(e: LifeEntry): void {
    const now = this.scene.time.now;
    e.path = [];
    e.sprite.anims.stop();
    const atHome = e.tx === e.homeTx && e.ty === e.homeTy;
    // Look at something: a prop beside us, else the way we came, else down.
    const look = this.pickLookDirection(e);
    e.state = 'idle';
    this.setFacing(e, atHome ? 'down' : look);
    const bubble = this.host.getBubble(e.id);
    if (bubble?.active) { bubble.setAlpha(0.8); this.reanchorBubble(e); }
    // Dwell: longer at home so people are mostly "at their spot".
    e.nextWanderAt = now + (atHome ? 7000 + Math.random() * 12000 : 1800 + Math.random() * 4200);
    e.returnFacingAt = atHome ? 0 : now + 3000;
  }

  private pickLookDirection(e: LifeEntry): Dir {
    const opts: Dir[] = [];
    for (const [dx, dy, dir] of [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']] as const) {
      const tx = e.tx + dx, ty = e.ty + dy;
      if (tx < 0 || ty < 0 || tx >= this.room.width || ty >= this.room.height) continue;
      const obs = this.room.obstacles.find(o => tx >= o.x && tx < o.x + o.width && ty >= o.y && ty < o.y + o.height);
      if (obs && (obs as { type?: string }).type !== 'wall') opts.push(dir);
    }
    if (opts.length) return opts[Math.floor(Math.random() * opts.length)];
    return Math.random() < 0.5 ? 'down' : OPPOSITE[e.facing];
  }

  private stopWalking(e: LifeEntry, snap: boolean): void {
    if (e.state !== 'walking') return;
    this.scene.tweens.killTweensOf(e.sprite);
    e.path = [];
    if (snap) {
      e.sprite.setPosition(e.tx * TILE + TILE / 2, e.ty * TILE + TILE / 2);
      this.setDepthForY(e);
    }
    e.sprite.anims.stop();
    e.state = 'idle';
    const bubble = this.host.getBubble(e.id);
    if (bubble?.active) { bubble.setAlpha(0.8); this.reanchorBubble(e); }
  }

  // ── ANIM-04: fidgets ───────────────────────────────────────────
  private ensureIconTextures(): void {
    if (this.iconTexturesReady) return;
    this.iconTexturesReady = true;
    const t = this.scene.textures;
    if (!t.exists('_icon_phone')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x1c1c28, 1); g.fillRoundedRect(0, 0, 7, 12, 1);
      g.fillStyle(0x9fe0ff, 1); g.fillRect(1, 2, 5, 8);
      g.fillStyle(0xffffff, 0.9); g.fillRect(2, 3, 1, 1);
      g.generateTexture('_icon_phone', 7, 12); g.destroy();
    }
    if (!t.exists('_icon_zz')) {
      const txt = this.scene.add.text(0, 0, 'z', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#cfe3ff', stroke: '#000', strokeThickness: 2 });
      // generateTexture isn't on Text; render via a RenderTexture instead
      const rt = this.scene.add.renderTexture(0, 0, 12, 12);
      rt.draw(txt, 1, 1);
      rt.saveTexture('_icon_zz');
      txt.destroy(); rt.destroy();
    }
  }

  private playFidget(e: LifeEntry): void {
    const kind = e.fidgets[e.fidgetCursor % e.fidgets.length];
    e.fidgetCursor++;
    e.stats.fidgets++;
    const s = e.sprite;
    const scene = this.scene;
    const now = scene.time.now;
    const baseScaleX = 1;

    switch (kind) {
      case 'lookAround': {
        if (!e.sheetKey) return;
        const original = e.facing;
        const first: Dir = Math.random() < 0.5 ? 'left' : 'right';
        this.setFacing(e, first);
        scene.time.delayedCall(320 + Math.random() * 200, () => { if (s.active && e.state === 'idle' && !e.playerNear) this.setFacing(e, OPPOSITE[first]); });
        scene.time.delayedCall(760 + Math.random() * 200, () => { if (s.active && e.state === 'idle' && !e.playerNear) this.setFacing(e, original); });
        e.fidgetBusyUntil = now + 1100;
        break;
      }
      case 'shiftWeight': {
        const dir = Math.random() < 0.5 ? -2 : 2;
        scene.tweens.add({
          targets: s, x: `+=${dir}`, scaleX: baseScaleX * 0.97, duration: 170, ease: 'Sine.easeInOut',
          yoyo: true, hold: 900 + Math.random() * 900,
          onComplete: () => { s.scaleX = baseScaleX; },
        });
        e.fidgetBusyUntil = now + 1500;
        break;
      }
      case 'nod': {
        scene.tweens.add({ targets: s, scaleY: 0.9, duration: 110, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => { s.scaleY = 1; } });
        e.fidgetBusyUntil = now + 500;
        break;
      }
      case 'stretch': {
        scene.tweens.add({
          targets: s, scaleY: 1.08, scaleX: 0.97, duration: 520, ease: 'Sine.easeOut', yoyo: true, hold: 420,
          onComplete: () => { s.scaleY = 1; s.scaleX = 1; },
        });
        e.fidgetBusyUntil = now + 1500;
        break;
      }
      case 'tapFoot': {
        scene.tweens.add({ targets: s, y: '-=1', duration: 80, yoyo: true, repeat: 4, ease: 'Linear' });
        e.fidgetBusyUntil = now + 900;
        break;
      }
      case 'chart': {
        this.floatIcon(e, objectTexture('manual'), 0.5, -12, -22, 900);
        // a little "reading" nod, paper rustle under it
        scene.tweens.add({ targets: s, scaleY: 0.95, duration: 140, yoyo: true, delay: 220, ease: 'Sine.easeInOut', onComplete: () => { s.scaleY = 1; } });
        playSfx(scene, 'sfx_fidget_paper', { bus: 'sfx', volume: 0.08, rate: 1.1 + Math.random() * 0.2, cooldownKey: 'fidget_paper', cooldownMs: 900 });
        e.fidgetBusyUntil = now + 1400;
        break;
      }
      case 'sip': {
        const icon = this.floatIcon(e, atlasRef('prop.mug.brown'), 1, 11, -14, 1100); // Run 11 audit: 'mug.red' was LimeZu's dish rack
        if (icon) scene.tweens.add({ targets: icon, angle: -28, duration: 260, delay: 380, yoyo: true, ease: 'Sine.easeInOut' });
        playSfx(scene, 'sfx_fidget_mug', { bus: 'sfx', volume: 0.07, rate: 1.35, cooldownKey: 'fidget_mug', cooldownMs: 900 });
        scene.tweens.add({ targets: s, scaleY: 1.03, duration: 300, delay: 380, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => { s.scaleY = 1; } });
        e.fidgetBusyUntil = now + 1600;
        break;
      }
      case 'phone': {
        const icon = this.floatIcon(e, '_icon_phone', 1, 9, -8, 1500);
        if (icon) {
          // screen glow pulses — someone is definitely scrolling
          scene.tweens.add({ targets: icon, alpha: { from: 1, to: 0.55 }, duration: 240, yoyo: true, repeat: 3, delay: 250 });
        }
        if (e.sheetKey && e.facing !== 'down') this.setFacing(e, 'down');
        scene.tweens.add({ targets: s, scaleY: 0.97, duration: 300, delay: 200, yoyo: true, hold: 700, ease: 'Sine.easeInOut', onComplete: () => { s.scaleY = 1; } });
        e.fidgetBusyUntil = now + 2000;
        break;
      }
      case 'type': {
        scene.tweens.add({ targets: s, y: '-=1', duration: 45, yoyo: true, repeat: 7, ease: 'Linear' });
        playSfx(scene, 'sfx_ui_tick', { bus: 'sfx', volume: 0.05, rate: 1.6, cooldownKey: 'fidget_type', cooldownMs: 700 });
        scene.time.delayedCall(330, () => playSfx(scene, 'sfx_ui_tick', { bus: 'sfx', volume: 0.05, rate: 1.75, cooldownKey: 'fidget_type2', cooldownMs: 700 }));
        e.fidgetBusyUntil = now + 900;
        break;
      }
      case 'sigh': {
        scene.tweens.add({
          targets: s, scaleY: 1.05, duration: 420, ease: 'Sine.easeOut',
          onComplete: () => scene.tweens.add({ targets: s, scaleY: 0.98, duration: 260, ease: 'Sine.easeIn', yoyo: true, onComplete: () => { s.scaleY = 1; } }),
        });
        e.fidgetBusyUntil = now + 1200;
        break;
      }
      case 'yawn': {
        scene.tweens.add({
          targets: s, scaleY: 1.07, angle: -3, duration: 600, ease: 'Sine.easeOut', yoyo: true, hold: 250,
          onComplete: () => { s.scaleY = 1; s.angle = 0; },
        });
        this.floatIcon(e, '_icon_zz', 1, 12, -20, 1300);
        e.fidgetBusyUntil = now + 1700;
        break;
      }
    }
  }

  /** A small prop rises beside the head, holds, and fades. Returns the sprite. */
  private floatIcon(e: LifeEntry, tex: string | { key: string; frame: string }, scale: number, dx: number, dy: number, holdMs: number): Phaser.GameObjects.Sprite | null {
    const key = typeof tex === 'string' ? tex : tex.key;
    const frame = typeof tex === 'string' ? undefined : tex.frame;
    if (!this.scene.textures.exists(key)) return null;
    const s = e.sprite;
    const icon = this.scene.add.sprite(s.x + dx, s.y + dy + 6, key, frame).setScale(scale).setAlpha(0).setDepth(s.depth + 2);
    this.scene.tweens.add({
      targets: icon, alpha: 0.95, y: s.y + dy, duration: 220, ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: icon, alpha: 0, y: s.y + dy - 4, duration: 260, delay: holdMs, ease: 'Sine.easeIn',
          onComplete: () => icon.destroy(),
        });
      },
    });
    return icon;
  }
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}
