import Phaser from 'phaser';
import { getAudioDev } from './audioConfig';

/**
 * FEEL-20 — hit-stop + squash-and-stretch.
 *
 * A real hit-stop: the whole scene freezes for a couple of frames on the
 * impact (tweens, timers, physics, animations), then releases into a
 * squash/stretch pop on the thing that was hit. The freeze is driven by a
 * real-time setTimeout (the scene clock is the thing being frozen), and is
 * re-entrant-safe: a second hit during a freeze just extends it.
 */
let frozenScene: Phaser.Scene | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

function releaseHitStop(): void {
  const scene = frozenScene;
  frozenScene = null;
  releaseTimer = null;
  if (!scene || !scene.sys || !scene.sys.isActive()) return;
  try {
    scene.tweens.timeScale = 1;
    scene.time.timeScale = 1;
    scene.anims.globalTimeScale = 1;
    scene.physics?.world?.resume();
  } catch (_) { /* scene torn down mid-freeze */ }
}

/** Freeze the world for `ms` (default 3 frames at 60fps). */
export function hitStop(scene: Phaser.Scene, ms = 50): void {
  if (!getAudioDev().hitStop) return;
  if (!scene.sys || !scene.sys.isActive()) return;
  if (frozenScene && frozenScene !== scene) releaseHitStop();
  frozenScene = scene;
  try {
    scene.tweens.timeScale = 0;
    scene.time.timeScale = 0;
    scene.anims.globalTimeScale = 0;
    scene.physics?.world?.pause();
  } catch (_) { return; }
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(releaseHitStop, ms);
  // Belt and braces: never leave a scene frozen if it shuts down mid-stop.
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { if (frozenScene === scene) releaseHitStop(); });
}

export type SquashStyle = 'npc' | 'item' | 'zone' | 'door' | 'console' | 'whimsy';

/**
 * Squash-and-stretch on an interaction target, styled per target type so an
 * NPC, an item, and a door each read as a different physical response:
 *   npc     — a surprised hop: stretch tall, settle
 *   item    — a pop: squash flat then spring past neutral
 *   zone    — a jiggle: quick side-to-side lean
 *   door    — handled by DoorSystem (the leaf swings); a tiny frame shiver here
 *   console — a screen "thunk": squash + 1px drop
 *   whimsy  — the printer/cat already have their own beats; gentle squash
 */
export function squashTarget(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  style: SquashStyle = 'npc',
): void {
  if (!target.active) return;
  // Deliberately does NOT kill the target's existing tweens: the NPC breathing
  // tween (scaleY) and zone/item bob tweens (y) keep running underneath and
  // simply resume once this short pop finishes — killing them would leave
  // every NPC you'd ever talked to standing stock-still.
  const bx = 1; // interaction targets are authored at scale 1
  const by = 1;
  target.setScale(bx, by);
  target.setAngle(0);
  const add = (cfg: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>) =>
    scene.tweens.add({ targets: target, ...cfg } as Phaser.Types.Tweens.TweenBuilderConfig);
  switch (style) {
    case 'npc':
      target.setScale(bx * 0.9, by * 1.12);
      add({ scaleX: bx, scaleY: by, duration: 260, ease: 'Elastic.easeOut', easeParams: [1.6, 0.5] });
      break;
    case 'item':
      target.setScale(bx * 1.25, by * 0.7);
      add({ scaleX: bx, scaleY: by, duration: 320, ease: 'Back.easeOut', easeParams: [3] });
      break;
    case 'zone':
      add({ angle: { from: -7, to: 7 }, duration: 70, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => target.setAngle(0) });
      break;
    case 'console':
      target.setScale(bx * 1.06, by * 0.9);
      add({ scaleX: bx, scaleY: by, y: target.y + 1, duration: 180, ease: 'Back.easeOut', yoyo: false, onComplete: () => { target.y -= 1; } });
      break;
    case 'door':
      add({ x: { from: target.x - 1, to: target.x + 1 }, duration: 40, yoyo: true, repeat: 2 });
      break;
    case 'whimsy':
    default:
      target.setScale(bx * 1.08, by * 0.92);
      add({ scaleX: bx, scaleY: by, duration: 200, ease: 'Back.easeOut' });
      break;
  }
}

/** The one-call version the scene uses on every interaction. */
export function hitStopSquash(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  style: SquashStyle = 'npc',
  freezeMs = 50,
): void {
  squashTarget(scene, target, style);
  hitStop(scene, freezeMs);
}

/**
 * FEEL-23 — input buffering. Remembers an interact press for ~120ms so
 * mashing SPACE a beat before reaching an NPC/door still lands, instead of
 * being silently dropped on the frame it was pressed.
 */
export class InputBuffer {
  private pressedAt = -Infinity;
  constructor(private windowMs = 120) {}

  press(now: number): void {
    this.pressedAt = now;
  }

  /** True (once) if a buffered press is still live. */
  consume(now: number): boolean {
    if (now - this.pressedAt <= this.windowMs) {
      this.pressedAt = -Infinity;
      return true;
    }
    return false;
  }

  clear(): void {
    this.pressedAt = -Infinity;
  }
}

/**
 * FEEL-24 — anticipation beat: dim → brief silence → payoff. Shared by
 * room-clear, act-change, certificate and encounter-victory moments so they
 * all share one physical rhythm. `payoff` fires after the dim + hold.
 */
export function anticipationBeat(
  scene: Phaser.Scene,
  payoff: () => void,
  opts: { dimAlpha?: number; holdMs?: number; dimMs?: number } = {},
): void {
  const dimAlpha = opts.dimAlpha ?? 0.55;
  const holdMs = opts.holdMs ?? 380; // 300–500ms silence window
  const dimMs = opts.dimMs ?? 120;
  if (!scene.sys || !scene.sys.isActive()) { payoff(); return; }

  const cam = scene.cameras.main;
  const dim = scene.add.rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0x000000, 0)
    .setDepth(120)
    .setScrollFactor(0);

  scene.tweens.add({
    targets: dim,
    fillAlpha: dimAlpha,
    duration: dimMs,
    ease: 'Sine.easeIn',
    onComplete: () => {
      scene.time.delayedCall(holdMs, () => {
        payoff();
        scene.tweens.add({
          targets: dim,
          fillAlpha: 0,
          duration: 300,
          ease: 'Sine.easeOut',
          onComplete: () => dim.destroy(),
        });
      });
    },
  });
}
