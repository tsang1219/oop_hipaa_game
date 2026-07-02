import Phaser from 'phaser';
import { eventBridge, BRIDGE_EVENTS } from '../../EventBridge';
import type { Room } from '@shared/schema';
import type { MusicController } from './MusicController';

const TILE = 32;

export type DoorState = 'locked' | 'available' | 'completed' | 'next';

export type Door = { id: string; targetRoomId: string; x: number; y: number; side: string; label: string };

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

/**
 * DoorSystem — door navigation state + visuals for ExplorationScene (Round 6).
 * Owns `doorStates`, `doorVisuals`, `nearDoor`; moved verbatim from the scene:
 * checkDoorProximity → checkProximity(px, py), handleDoorInteraction → enter(door),
 * renderDoorStates → render() (the 4-state locked/next/available/completed visuals).
 * The scene keeps the onLoadRoom/onUpdateDoorStates/onDoorLocked eventBridge
 * handlers and delegates. A fresh instance is created per room in init().
 */
export class DoorSystem {
  private doorStates: Record<string, DoorState> = {};
  private doorVisuals: Phaser.GameObjects.GameObject[] = [];
  private _nearDoor: Door | null = null;

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
    for (const door of doors) {
      const dx = Math.abs(px - (door.x * TILE + TILE / 2));
      const dy = Math.abs(py - (door.y * TILE + TILE / 2));
      if (dx < TILE * 1.5 && dy < TILE * 1.5) {
        this._nearDoor = door;
        return;
      }
    }
    this._nearDoor = null;
  }

  enter(door: Door): void {
    if (this.scene.transitioning) return;
    this.scene.lastActivityAt = this.scene.time.now; // Reset idle-hint grace period on door entry
    this.scene.transitioning = true;
    this.scene.sound.play('sfx_footstep', { volume: 0.35, rate: 0.8 });
    // Fade music out in sync with camera fade so shutdown doesn't hard-stop it
    this.music.fadeOutForDoor();
    this.scene.cameras.main.fadeOut(300, 0, 0, 0);
    this.scene.time.delayedCall(300, () => {
      eventBridge.emit(BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM, {
        targetRoomId: door.targetRoomId,
        fromDoorId: door.id,
      });
    });
  }

  render(): void {
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
      const frameG = this.scene.add.graphics().setDepth(1);
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
        const check = this.scene.add.text(doorPixelX, doorPixelY - TILE, '\u2713', {
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
