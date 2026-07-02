import Phaser from 'phaser';
import type { Room } from '@shared/schema';
import type { InteractableData } from './interactableFactory';

// ── Idle-hint sparkle system constants (Phase 27 VIS-07) ─────────────────────
export const IDLE_HINT_GRACE_MS = 9000;  // 9s without input before first sparkle
export const IDLE_HINT_INTERVAL_MS = 5000; // ~5s between individual sparkles

/**
 * Idle-hint sparkle system (Phase 27 VIS-07).
 * After IDLE_HINT_GRACE_MS without player input, fire a single 3-particle sparkle
 * on one un-met completion requirement (NPC/zone/item). Cycles round-robin.
 * Stops when the room has no un-met requirements (hallways, completed rooms).
 *
 * Round 4: moved from ExplorationScene. The scene's `lastIdleHintAt` stamp is
 * written by the update() call site; this returns the (possibly advanced)
 * round-robin index the scene stores back into `idleHintIndex`.
 */
export function emitIdleHint(
  scene: Phaser.Scene,
  room: Room,
  interactables: InteractableData[],
  completed: { npcs: Set<string>; zones: Set<string>; items: Set<string> },
  index: number,
): number {
  const reqs = (room as any).completionRequirements;
  if (!reqs) return index; // hallways and rooms without completionRequirements never sparkle

  // Build list of un-met target ids
  const targets: string[] = [];
  for (const id of (reqs.requiredNpcs ?? [])) {
    if (!completed.npcs.has(id)) targets.push(id);
  }
  for (const id of (reqs.requiredZones ?? [])) {
    if (!completed.zones.has(id)) targets.push(id);
  }
  for (const id of (reqs.requiredItems ?? [])) {
    if (!completed.items.has(id)) targets.push(id);
  }
  if (targets.length === 0) return index; // room is complete — no shimmer

  const targetId = targets[index % targets.length];
  const nextIndex = index + 1;

  // Find the interactable sprite for this id
  const ia = interactables.find(i => i.id === targetId);
  if (!ia?.sprite) return nextIndex; // act-gated NPC may not have spawned yet

  const sprite = ia.sprite;
  if (!scene.textures.exists('particle_circle')) return nextIndex; // texture not loaded — silently skip

  const s = scene.add.particles(sprite.x, sprite.y - 6, 'particle_circle', {
    speed: { min: 10, max: 25 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 0.9, end: 0 },
    tint: [0xffffff, 0xffe9a0],
    lifespan: 450,
    quantity: 3,
    emitting: false,
  });
  s.setDepth(sprite.depth + 1);
  s.explode(3);
  scene.time.delayedCall(500, () => { if (s.active) s.destroy(); });

  return nextIndex;
}
