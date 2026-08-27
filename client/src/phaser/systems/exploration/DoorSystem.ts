import Phaser from 'phaser';
import { getArtHandle } from './art/artRenderer';
import { ATLAS_KEY, type AtlasFrame } from './art/atlasFrames.generated';
import { DOOR_ART, DOOR_OPEN_STEPS, opennessToStep, type DoorKind } from './art/doorArt';
import { eventBridge, BRIDGE_EVENTS } from '../../EventBridge';
import type { Room } from '@shared/schema';
import type { MusicController } from './MusicController';
import { closetFound, markClosetFound } from '../../../data/whimsyData';
import { playRoundRobin, playSfx, playStinger } from './audioMixer';

const TILE = 32;

export type DoorState = 'locked' | 'available' | 'completed' | 'next';

export type Door = {
  id: string; targetRoomId: string; x: number; y: number; side: string; label: string;
  /** Whimsy pass: hidden doors render as a wall seam (+ paw prints) until
   *  first entered — no frame, no state ring, no label. Pure discovery. */
  hidden?: boolean;
};

/**
 * The scene fields DoorSystem reads/writes through the scene reference.
 * `transitioning` deliberately STAYS on the scene — it also gates idle hints,
 * movement, QA nav, and locked-door recovery (see refactor proposal §2).
 * `lastActivityAt` is the idle-hint grace stamp, reset on door entry.
 */
export interface DoorHostScene extends Phaser.Scene {
  transitioning: boolean;
  lastActivityAt: number;
}

interface DoorLeaf {
  sprite: Phaser.GameObjects.Sprite;
  kind: DoorKind;
  /** closed → open frames (5) */
  frames: AtlasFrame[];
  /** tween proxy: 0 = closed … DOOR_OPEN_STEPS = open */
  pose: { step: number };
  /** 1 = closed, 0 = fully open (Run 12's number; QA reads it) */
  openness: number;
  state: DoorState;
  /** resting x — the locked rattle shakes around it */
  homeX: number;
}

/** Run 11 proof surface: what each door is drawn with right now (window.__QA__.doors). */
export interface DoorSnapshot {
  id: string; kind: DoorKind | 'seam'; state: DoorState; frame: string | null;
  x: number; y: number; depth: number; openness: number;
}

/**
 * DoorSystem — door navigation state + visuals for ExplorationScene (Round 6).
 * Owns `doorStates`, `doorVisuals`, `nearDoor`; moved verbatim from the scene:
 * checkDoorProximity → checkProximity(px, py), handleDoorInteraction → enter(door),
 * renderDoorStates → render() (the 4-state locked/next/available/completed visuals).
 * The scene keeps the onLoadRoom/onUpdateDoorStates/onDoorLocked eventBridge
 * handlers and delegates. A fresh instance is created per room in init().
 *
 * Run 12 (ANIM-07): every visible door has a real leaf. It cracks ajar with a
 * creak as you approach, closes again if you walk away, and swings fully
 * open — before the fade — when you go through.
 *
 * Run 11 (art-substrate, item 1): the leaf is one of LimeZu's animated doors
 * from the interiors atlas (see art/doorArt.ts for which door goes where and
 * how it sits on the wall). Openness drives the frame index, so the Run 12
 * beats are unchanged: ajar = one step, through = the full swing. A locked
 * door no longer swings open before React says no — it rattles in its frame.
 */
export class DoorSystem {
  private doorStates: Record<string, DoorState> = {};
  private doorVisuals: Phaser.GameObjects.GameObject[] = [];
  private _nearDoor: Door | null = null;
  private leaves = new Map<string, DoorLeaf>();
  private ajarDoorId: string | null = null;

  constructor(
    private scene: DoorHostScene,
    private room: Room,
    private music: MusicController,
  ) {}

  get nearDoor(): Door | null {
    return this._nearDoor;
  }

  /** Read access for the scene's prompt fallback + QA state broadcast. */
  get states(): Record<string, DoorState> {
    return this.doorStates;
  }

  setStates(states: Record<string, DoorState>): void {
    this.doorStates = states;
  }

  checkProximity(px: number, py: number): void {
    const doors = (this.room as any).doors;
    if (!doors || doors.length === 0) return;
    let found: Door | null = null;
    for (const door of doors) {
      const dx = Math.abs(px - (door.x * TILE + TILE / 2));
      // Run 11: a back-wall door sits inside a two-row face — measure from the
      // doorway's floor edge (the wall's last row), or no one could ever reach it
      const refY = door.side === 'top' ? this.wallBottom(door) - TILE / 2 : door.y * TILE + TILE / 2;
      const dy = Math.abs(py - refY);
      if (dx < TILE * 1.5 && dy < TILE * 1.5) {
        found = door;
        break;
      }
    }
    this._nearDoor = found;
    // ANIM-07 — doors open before you go through them: crack ajar on approach.
    const wantAjar = found && this.doorStates[found.id] !== 'locked' && this.leaves.has(found.id) ? found.id : null;
    if (wantAjar !== this.ajarDoorId) {
      if (this.ajarDoorId) this.setLeaf(this.ajarDoorId, 1, 260, 'Sine.easeIn');
      if (wantAjar) {
        this.setLeaf(wantAjar, 0.72, 220, 'Sine.easeOut');
        playSfx(this.scene, 'sfx_door_creak', { volume: 0.16, rate: 0.9 + Math.random() * 0.2, cooldownKey: 'door_creak', cooldownMs: 700 });
      }
      this.ajarDoorId = wantAjar;
    }
  }

  enter(door: Door): void {
    if (this.scene.transitioning) return;
    this.scene.lastActivityAt = this.scene.time.now; // Reset idle-hint grace period on door entry
    // First time through a hidden door: it's found forever (renders as a real
    // little door from now on)
    if (door.hidden && !closetFound()) {
      markClosetFound();
      playStinger(this.scene, 'secretFound', 0.55); // AUD-07
    }
    this.scene.transitioning = true;

    // ANIM-07 — the door visibly swings open before the fade takes the screen.
    // Run 11: not when we already know it's locked — that one rattles instead
    // (React stays the authority on access; onDoorLocked rattles too).
    const locked = this.doorStates[door.id] === 'locked';
    const hasLeaf = this.leaves.has(door.id) && !locked;
    if (hasLeaf) {
      this.setLeaf(door.id, 0.06, 230, 'Sine.easeIn');
      playRoundRobin(this.scene, 'door_open', ['sfx_door_open_0', 'sfx_door_open_1', 'sfx_door_open_2'], {
        volume: 0.42, rate: 0.95 + Math.random() * 0.1, cooldownMs: 0,
      });
    } else if (locked) {
      this.rattle(door.id);
    }

    // Fade music out in sync with camera fade so shutdown doesn't hard-stop it
    this.music.fadeOutForDoor();
    // A short lead so the swing (or the rattle) reads before the screen dims
    // (skipped for still-hidden doors — no leaf to swing, so no reason to add the delay).
    this.scene.time.delayedCall(hasLeaf || locked ? 150 : 0, () => {
      this.scene.cameras.main.fadeOut(300, 0, 0, 0);
      this.scene.time.delayedCall(300, () => {
        eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, {
          targetRoomId: door.targetRoomId,
          fromDoorId: door.id,
        });
      });
    });
  }

  /** Locked feedback on the door itself: the leaf shuts if it was open, then the
   *  big door thuds in its frame (LimeZu's locked frames) or a side door shakes
   *  on its hinge. Called from enter() for a known-locked door and from the
   *  scene's onDoorLocked (React's verdict) — the cooldown keeps it to one beat. */
  rattle(doorId: string | undefined | null): void {
    if (!doorId) return;
    const entry = this.leaves.get(doorId);
    if (!entry || !entry.sprite.active) return;
    // a leaf that had swung on a stale 'available' always shuts; the shake itself is
    // one beat per attempt (SPACE rattles at once, React's refusal ~450 ms later is the echo)
    if (entry.openness < 1) this.setLeaf(doorId, 1, 120, 'Sine.easeIn');
    if (this.scene.time.now - this.lastRattleAt < 1000) return;
    this.lastRattleAt = this.scene.time.now;
    const sprite = entry.sprite;
    if (entry.kind === 'face' && this.hasFrame(DOOR_ART.faceLocked[0])) {
      const key = 'door:face:locked';
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({ key, frames: DOOR_ART.faceLocked.map(f => ({ key: ATLAS_KEY, frame: f })), frameRate: 14, repeat: 0 });
      }
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (sprite.active) sprite.setFrame(entry.frames[opennessToStep(entry.openness)]);
      });
      sprite.play(key);
    } else {
      this.scene.tweens.killTweensOf(sprite);
      sprite.x = entry.homeX;
      this.scene.tweens.add({
        targets: sprite, x: entry.homeX + 2, duration: 36, yoyo: true, repeat: 3, ease: 'Sine.easeInOut',
        onComplete: () => { if (sprite.active) sprite.x = entry.homeX; },
      });
    }
    this.publishSnapshot();
  }
  private lastRattleAt = -1000;

  /** Run 11: a door in the back wall sits inside the rendered wall face (2 rows),
   *  so anything measured from the wall's bottom edge uses the face height. */
  private wallBottom(door: Door): number {
    const rows = getArtHandle(this.scene)?.style.wall.rows ?? 1;
    return door.side === 'top' ? rows * TILE : (door.y + 1) * TILE;
  }

  private hasFrame(frame: string): boolean {
    return this.scene.textures.exists(ATLAS_KEY) && this.scene.textures.get(ATLAS_KEY).has(frame);
  }

  /** Where a door's sprite stands (origin = bottom-left of the frame) and how it sorts. */
  private anchor(door: Door): { kind: DoorKind; x: number; y: number; depth: number } {
    const side = door.side;
    if (side === 'left') return { kind: 'side-left', x: door.x * TILE + DOOR_ART.sideLeftDx, y: (door.y + 1) * TILE, depth: 5 + door.y - 0.5 };
    if (side === 'right') return { kind: 'side-right', x: door.x * TILE + DOOR_ART.sideRightDx, y: (door.y + 1) * TILE, depth: 5 + door.y - 0.5 };
    // back wall: inside the face, behind everything that stands on the floor
    if (side === 'top') return { kind: 'face', x: door.x * TILE, y: this.wallBottom(door), depth: 2 };
    // bottom wall: standing in the gap, y-sorted so you walk up behind it
    return { kind: 'face', x: door.x * TILE, y: (door.y + 1) * TILE, depth: 5 + door.y - 0.5 };
  }

  /** Tween a door leaf's openness (1 closed → 0 open): the frame index follows. */
  private setLeaf(doorId: string, openness: number, ms: number, ease: string): void {
    const entry = this.leaves.get(doorId);
    if (!entry || !entry.sprite.active) return;
    entry.openness = openness;
    this.scene.tweens.killTweensOf(entry.pose);
    const apply = () => {
      if (!entry.sprite.active) return;
      const step = Math.max(0, Math.min(DOOR_OPEN_STEPS, Math.round(entry.pose.step)));
      const frame = entry.frames[step];
      if (entry.sprite.frame.name !== frame) { entry.sprite.setFrame(frame); this.publishSnapshot(); }
    };
    this.scene.tweens.add({
      targets: entry.pose, step: opennessToStep(openness), duration: ms, ease,
      onUpdate: apply, onComplete: apply,
    });
    this.publishSnapshot();
  }

  /** Build the leaf for a door: a LimeZu door sprite in its closed frame. */
  private buildLeaf(door: Door, state: DoorState): DoorLeaf | null {
    const a = this.anchor(door);
    const frames = DOOR_ART.frames[a.kind];
    if (!this.hasFrame(frames[0])) {
      if (import.meta.env.DEV) console.warn(`[doors] ${this.room.id}/${door.id}: atlas frame '${frames[0]}' missing — re-run node scripts/art/slice-atlas.mjs`);
      return null;
    }
    const sprite = this.scene.add.sprite(a.x, a.y, ATLAS_KEY, frames[0]).setOrigin(0, 1).setDepth(a.depth);
    if (state === 'locked') sprite.setTint(0x8c8c9c); // dimmed: this one isn't for you yet
    return { sprite, kind: a.kind, frames, pose: { step: 0 }, openness: 1, state, homeX: a.x };
  }

  /** What each door is drawn with right now — window.__QA__.doors (DEV only, proof surface). */
  snapshot(): DoorSnapshot[] {
    const doors: Door[] = (this.room as any).doors ?? [];
    return doors.map(d => {
      const leaf = this.leaves.get(d.id);
      const state = this.doorStates[d.id] ?? 'available';
      if (!leaf) return { id: d.id, kind: 'seam' as const, state, frame: null, x: d.x, y: d.y, depth: 2, openness: 1 };
      return { id: d.id, kind: leaf.kind, state, frame: leaf.sprite.frame.name, x: leaf.sprite.x, y: leaf.sprite.y, depth: leaf.sprite.depth, openness: leaf.openness };
    });
  }

  private publishSnapshot(): void {
    const qa = (window as unknown as { __QA__?: { doors?: DoorSnapshot[] } }).__QA__;
    if (qa) qa.doors = this.snapshot();
  }

  render(): void {
    const doors = (this.room as any).doors;
    if (!doors || doors.length === 0) return;

    // Clear existing door visuals so we can re-render cleanly
    this.leaves.forEach(leaf => {
      this.scene.tweens.killTweensOf(leaf.pose);
      this.scene.tweens.killTweensOf(leaf.sprite);
    });
    for (const v of this.doorVisuals) {
      v.destroy();
    }
    this.doorVisuals = [];
    this.leaves.clear();
    this.ajarDoorId = null;

    for (const door of doors) {
      // Rings, lock mark and badge centre on the door itself: for a side door that is
      // the wall line (the closed leaf's edge-on line), 8–9 px off the tile centre
      const doorPixelX = door.x * TILE + TILE / 2 + (door.side === 'left' ? 8 : door.side === 'right' ? -9 : 0);
      const doorPixelY = door.y * TILE + TILE / 2;
      const state = this.doorStates[door.id] ?? 'available';

      // Hidden, not-yet-found door (whimsy pass): no frame, no ring, no label.
      // Just a seam in the wall, a sliver of warm light at the floor, and a
      // few paw prints for anyone paying attention.
      if ((door as Door).hidden && !closetFound()) {
        const seamG = this.scene.add.graphics().setDepth(2);
        // Vertical crack down the wall tile
        seamG.fillStyle(0x0d0d16, 0.9);
        const faceBottom = this.wallBottom(door);
        seamG.fillRect(door.x * TILE + 14, door.y * TILE + 4, 2, faceBottom - door.y * TILE - 6);
        seamG.fillStyle(0x000000, 0.5);
        seamG.fillRect(door.x * TILE + 16, door.y * TILE + 6, 1, faceBottom - door.y * TILE - 8);
        // Warm light spilling under the seam
        const spill = this.scene.add.rectangle(
          doorPixelX, faceBottom - 1, 12, 2, 0xffd9a0, 0.5,
        ).setDepth(2);
        this.scene.tweens.add({
          targets: spill,
          alpha: { from: 0.5, to: 0.15 },
          duration: 2200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        // Paw prints wandering toward the seam (below the wall, on the floor)
        seamG.fillStyle(0x6a5a48, 0.5);
        const paws: [number, number][] = [[-3, 40], [6, 48], [-1, 57], [8, 65]];
        for (const [pxOff, pyOff] of paws) {
          const px = doorPixelX + pxOff;
          const py = faceBottom - TILE + pyOff;
          seamG.fillRect(px, py, 2, 2);
          seamG.fillRect(px + 3, py + 1, 2, 2);
          seamG.fillRect(px + 1, py + 3, 3, 2);
        }
        this.doorVisuals.push(seamG, spill);
        continue; // no frame, no state visuals, no label
      }

      // The door itself (closed), from the atlas — see art/doorArt.ts
      const leaf = this.buildLeaf(door, state);
      if (leaf) {
        this.doorVisuals.push(leaf.sprite);
        this.leaves.set(door.id, leaf);
      }
      // State dressing sits just above its own door (and y-sorts with it)
      const dressDepth = (leaf?.sprite.depth ?? 2) + 0.1;

      if (state === 'locked') {
        const lockText = this.scene.add.text(doorPixelX, doorPixelY, '[X]', {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color: '#ff4444',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(dressDepth + 0.1);
        this.doorVisuals.push(lockText);

      } else if (state === 'next') {
        // Breathing warm-gold filled aura (Phase 27 VIS-07) — critical-path "next" door
        // Clearly distinct from the blue 'available' ring pulse: filled gold, slower breathe
        if (this.scene.textures.exists('glow_radial')) {
          const aura = this.scene.add.image(doorPixelX, doorPixelY, 'glow_radial')
            .setTint(0xffa000)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.6)
            .setDepth(dressDepth);
          this.scene.tweens.add({
            targets: aura,
            alpha: { from: 0.6, to: 0.95 },
            scaleX: { from: 1.1, to: 1.5 },
            scaleY: { from: 1.1, to: 1.5 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.doorVisuals.push(aura);
        } else {
          // Fallback: filled gold circle alpha pulse (never stroke-only)
          const fallbackAura = this.scene.add.circle(doorPixelX, doorPixelY, 20, 0xffd700, 0.22).setDepth(dressDepth);
          this.scene.tweens.add({
            targets: fallbackAura,
            alpha: { from: 0.22, to: 0.45 },
            scaleX: { from: 1, to: 1.4 },
            scaleY: { from: 1, to: 1.4 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.doorVisuals.push(fallbackAura);
        }
        // Gold stroke ring — slower (1600ms) vs the blue available ring (1000ms) for distinct read
        const nextRing = this.scene.add.circle(doorPixelX, doorPixelY, 18, 0xffd700, 0)
          .setStrokeStyle(2, 0xffd700, 1).setDepth(dressDepth);
        this.scene.tweens.add({
          targets: nextRing,
          alpha: { from: 0.3, to: 0.9 },
          scaleX: { from: 0.8, to: 1.4 },
          scaleY: { from: 0.8, to: 1.4 },
          duration: 1600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.doorVisuals.push(nextRing);

      } else if (state === 'available') {
        // Pulsing glow ring
        const glow = this.scene.add.circle(doorPixelX, doorPixelY, 18, 0x4a90e2, 0)
          .setStrokeStyle(2, 0x4a90e2, 1).setDepth(dressDepth);
        this.scene.tweens.add({
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
        const badge = this.scene.add.circle(doorPixelX, doorPixelY - TILE, 9, 0x2a6a2a, 1)
          .setDepth(dressDepth + 0.1);
        this.doorVisuals.push(badge);
        const check = this.scene.add.text(doorPixelX, doorPixelY - TILE, '✓', {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(dressDepth + 0.2);
        this.doorVisuals.push(check);
      }

      // Door label (always shown) — depth 30: signage floats above y-sorted props (a wheelchair
      // parked by a door used to eat the label's left half), below the lighting/HUD layers
      const labelText = this.scene.add.text(doorPixelX, doorPixelY + TILE, door.label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: state === 'locked' ? '#888888' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5).setDepth(30);
      // F-20 fix (Run 07): clamp inside the room bounds — edge-door labels used
      // to truncate at the canvas edge ("Recepti", "Hallwa"). Same clamp the
      // NPC nameplates already use.
      {
        const pad = 2;
        const half = labelText.width / 2;
        const roomPxWidth = (this.room.width ?? 20) * TILE;
        const minX = half + pad;
        const maxX = roomPxWidth - half - pad;
        if (maxX >= minX) {
          labelText.x = Phaser.Math.Clamp(labelText.x, minX, maxX);
        }
      }
      this.doorVisuals.push(labelText);
    }
    this.publishSnapshot();
  }
}
