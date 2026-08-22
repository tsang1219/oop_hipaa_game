import Phaser from 'phaser';
import { getArtHandle } from './art/artRenderer';
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
  leaf: Phaser.GameObjects.Container;
  /** 1 = closed, 0 = fully open (scaleX toward the hinge) */
  openness: number;
  state: DoorState;
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
      const dy = Math.abs(py - (door.y * TILE + TILE / 2));
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
    const hasLeaf = this.leaves.has(door.id);
    if (hasLeaf) {
      this.setLeaf(door.id, 0.06, 230, 'Sine.easeIn');
      playRoundRobin(this.scene, 'door_open', ['sfx_door_open_0', 'sfx_door_open_1', 'sfx_door_open_2'], {
        volume: 0.42, rate: 0.95 + Math.random() * 0.1, cooldownMs: 0,
      });
    }

    // Fade music out in sync with camera fade so shutdown doesn't hard-stop it
    this.music.fadeOutForDoor();
    // A short lead so the swing reads before the screen dims (skipped for
    // still-hidden doors — no leaf to swing, so no reason to add the delay).
    this.scene.time.delayedCall(hasLeaf ? 150 : 0, () => {
      this.scene.cameras.main.fadeOut(300, 0, 0, 0);
      this.scene.time.delayedCall(300, () => {
        eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, {
          targetRoomId: door.targetRoomId,
          fromDoorId: door.id,
        });
      });
    });
  }

  /** Run 11: a door in the back wall sits inside the rendered wall face (2 rows),
   *  so its frame's top is measured down from the face's bottom edge. */
  private wallBottom(door: Door): number {
    const rows = getArtHandle(this.scene)?.style.wall.rows ?? 1;
    return door.side === 'top' ? rows * TILE : (door.y + 1) * TILE;
  }

  private frameTop(door: Door): number {
    return door.side === 'top' ? this.wallBottom(door) - (TILE + TILE / 2) : door.y * TILE - TILE / 2;
  }

  /** Tween a door leaf's openness (1 closed → 0 open) about its hinge. */
  private setLeaf(doorId: string, openness: number, ms: number, ease: string): void {
    const entry = this.leaves.get(doorId);
    if (!entry || !entry.leaf.active) return;
    entry.openness = openness;
    this.scene.tweens.killTweensOf(entry.leaf);
    this.scene.tweens.add({ targets: entry.leaf, scaleX: openness, duration: ms, ease });
  }

  /** Build the leaf for a door: a wooden slab with a panel line and a knob,
   *  hinged on the side away from the room's interior. */
  private buildLeaf(door: Door, state: DoorState): Phaser.GameObjects.Container {
    const fx = door.x * TILE;
    const fy = this.frameTop(door);
    const openingW = TILE - 4;
    const openingH = TILE + TILE / 2 - 6;
    const hingeOnRight = door.side === 'right';
    const hingeX = hingeOnRight ? fx + TILE - 2 : fx + 2;
    const leaf = this.scene.add.container(hingeX, fy + 5).setDepth(2);
    const g = this.scene.add.graphics();
    const x0 = hingeOnRight ? -openingW : 0;
    const wood = state === 'locked' ? 0x5a4230 : 0x8a6440;
    const woodDark = state === 'locked' ? 0x3e2c20 : 0x6a4a2e;
    const woodLight = state === 'locked' ? 0x6c5040 : 0xa8805a;
    g.fillStyle(wood, 1);
    g.fillRect(x0, 0, openingW, openingH);
    // panel inset
    g.fillStyle(woodDark, 1);
    g.fillRect(x0 + 4, 5, openingW - 8, openingH - 10);
    g.fillStyle(wood, 1);
    g.fillRect(x0 + 6, 7, openingW - 12, openingH - 14);
    // edge highlight along the hinge side
    g.fillStyle(woodLight, 0.9);
    g.fillRect(hingeOnRight ? -1 : 0, 0, 1, openingH);
    // knob on the far side from the hinge
    g.fillStyle(0xe8c860, 1);
    const knobX = hingeOnRight ? x0 + 5 : x0 + openingW - 6;
    g.fillRect(knobX, Math.floor(openingH / 2) - 1, 2, 2);
    // floor shadow under the leaf
    g.fillStyle(0x000000, 0.25);
    g.fillRect(x0, openingH, openingW, 2);
    leaf.add(g);
    return leaf;
  }

  render(): void {
    const doors = (this.room as any).doors;
    if (!doors || doors.length === 0) return;

    // Clear existing door visuals so we can re-render cleanly
    for (const v of this.doorVisuals) {
      v.destroy();
    }
    this.doorVisuals = [];
    this.leaves.clear();
    this.ajarDoorId = null;

    for (const door of doors) {
      const doorPixelX = door.x * TILE + TILE / 2;
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

      // Door frame — prominent wood frame with highlight and shadow
      const frameG = this.scene.add.graphics().setDepth(1);
      this.doorVisuals.push(frameG);
      const fx = door.x * TILE;
      const fy = this.frameTop(door);
      // Dark opening behind the leaf (what you see when it swings open)
      frameG.fillStyle(0x0b0b14, 1);
      frameG.fillRect(fx + 2, fy + 5, TILE - 4, TILE + TILE / 2 - 6);
      frameG.fillStyle(0x2a2438, 0.6);
      frameG.fillRect(fx + 4, fy + 7, TILE - 8, TILE / 2);
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

      // ANIM-07 — the leaf itself (closed), hinged away from the room
      const leaf = this.buildLeaf(door, state);
      this.doorVisuals.push(leaf);
      this.leaves.set(door.id, { leaf, openness: 1, state });

      if (state === 'locked') {
        // Dark overlay + lock icon
        const overlay = this.scene.add.graphics().setDepth(2);
        overlay.fillStyle(0x000000, 0.55);
        overlay.fillRect(door.x * TILE - TILE / 2, door.y * TILE - TILE, TILE * 2, TILE * 3);
        const lockText = this.scene.add.text(doorPixelX, doorPixelY, '[X]', {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color: '#ff4444',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(3);
        this.doorVisuals.push(overlay, lockText);

      } else if (state === 'next') {
        // Breathing warm-gold filled aura (Phase 27 VIS-07) — critical-path "next" door
        // Clearly distinct from the blue 'available' ring pulse: filled gold, slower breathe
        if (this.scene.textures.exists('glow_radial')) {
          const aura = this.scene.add.image(doorPixelX, doorPixelY, 'glow_radial')
            .setTint(0xffa000)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.6)
            .setDepth(2);
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
          const fallbackAura = this.scene.add.circle(doorPixelX, doorPixelY, 20, 0xffd700, 0.22).setDepth(2);
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
          .setStrokeStyle(2, 0xffd700, 1).setDepth(2);
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
          .setStrokeStyle(2, 0x4a90e2, 1).setDepth(2);
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
          .setDepth(3);
        this.doorVisuals.push(badge);
        const check = this.scene.add.text(doorPixelX, doorPixelY - TILE, '✓', {
          fontFamily: '"Press Start 2P"',
          fontSize: '9px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(4);
        this.doorVisuals.push(check);
      }

      // Door label (always shown)
      const labelText = this.scene.add.text(doorPixelX, doorPixelY + TILE, door.label, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: state === 'locked' ? '#888888' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5).setDepth(3);
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
  }
}
