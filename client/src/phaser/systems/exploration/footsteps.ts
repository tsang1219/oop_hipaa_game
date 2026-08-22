import Phaser from 'phaser';
import { playSfx, nextVariant } from './audioMixer';
import { getAudioDev } from './audioConfig';

/**
 * AUD-03 — footsteps by floor material and gait, 5 round-robin variants per
 * family so a walk never machine-guns one sample. All from the Kenney
 * impact-sounds pack on disk (see BootScene + attached_assets/CREDITS.md).
 *
 * Families (what the player hears):
 *   tile    — hard clinical floor: lobby, reception, ER
 *   lino    — hallway linoleum: a lighter, clickier step
 *   carpet  — break room, records, IT (raised floor), the supply closet
 *   lab     — sealed epoxy: tile family, pitched up and drier
 * The brief's own test walk (reception → hallway → break room) therefore
 * crosses three different sample sets: tile → lino → carpet.
 */
export type FloorMaterial = 'tile' | 'lino' | 'carpet' | 'lab';

const ROOM_FLOOR: Record<string, FloorMaterial> = {
  hospital_entrance: 'tile',
  reception: 'tile',
  er: 'tile',
  lab: 'lab',
  break_room: 'carpet',
  records_room: 'carpet',
  it_office: 'carpet',
  supply_closet: 'carpet',
};

export function floorMaterialForRoom(roomId: string): FloorMaterial {
  if (ROOM_FLOOR[roomId]) return ROOM_FLOOR[roomId];
  if (roomId.startsWith('hallway_')) return 'lino';
  return 'tile';
}

interface FamilySpec { keys: string[]; rate: number; volume: number }
const FAMILY: Record<FloorMaterial, FamilySpec> = {
  tile:   { keys: range('sfx_step_concrete_', 5), rate: 1.0, volume: 0.22 },
  lino:   { keys: range('sfx_step_wood_', 5),     rate: 1.18, volume: 0.16 },
  carpet: { keys: range('sfx_step_carpet_', 5),   rate: 1.0, volume: 0.2 },
  lab:    { keys: range('sfx_step_concrete_', 5), rate: 1.22, volume: 0.17 },
};

function range(prefix: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(`${prefix}${i}`);
  return out;
}

/** One footstep. Called from the walk animation's contact frames. */
export function playFootstep(scene: Phaser.Scene, material: FloorMaterial, running: boolean): void {
  if (!getAudioDev().materialFootsteps) {
    playSfx(scene, 'sfx_footstep', { volume: 0.25, cooldownKey: 'step', cooldownMs: 90 });
    return;
  }
  const fam = FAMILY[material];
  const idx = nextVariant(`step:${material}`, fam.keys.length);
  const key = fam.keys[idx];
  if (!scene.cache.audio.has(key)) {
    playSfx(scene, 'sfx_footstep', { volume: 0.25, cooldownKey: 'step', cooldownMs: 90 });
    return;
  }
  const jitter = 0.95 + Math.random() * 0.1;
  const rate = fam.rate * (running ? 1.12 : 1) * jitter;
  const volume = fam.volume * (running ? 1.3 : 1);
  playSfx(scene, key, { volume, rate, cooldownKey: 'step', cooldownMs: 90 });
}

/** Exposed for the QA audio map: which family a room resolves to. */
export const FOOTSTEP_FAMILIES = Object.freeze(
  Object.fromEntries(Object.entries(FAMILY).map(([k, v]) => [k, v.keys])) as Record<FloorMaterial, string[]>,
);
