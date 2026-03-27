/**
 * saveData.ts — Canonical save-data module for PrivacyQuest v2.
 *
 * Replaces 29 fragmented localStorage keys with a single versioned object.
 * All downstream code reads/writes through this module.
 */

export interface SaveDataV2 {
  version: 2;
  completedRooms: string[];
  collectedStories: string[];
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];
  privacyScore: number;
  finalPrivacyScore: number;
  resolvedGates: Record<string, string[]>;
  unlockedNpcs: Record<string, string[]>;
  npcPulsedRooms: string[];
  gameStartTime: number;
  onboardingSeen: boolean;
  sfxMuted: boolean;
  musicVolume: number;
}

export const SAVE_KEY_V2 = 'pq:save:v2';

export const defaultSave: SaveDataV2 = {
  version: 2,
  completedRooms: [],
  collectedStories: [],
  completedNPCs: [],
  completedZones: [],
  collectedItems: [],
  privacyScore: 100,
  finalPrivacyScore: 100,
  resolvedGates: {},
  unlockedNpcs: {},
  npcPulsedRooms: [],
  gameStartTime: Date.now(),
  onboardingSeen: false,
  sfxMuted: false,
  musicVolume: 0.6,
};

/**
 * Migrate v1 localStorage keys to a single v2 save object.
 * Idempotent: if pq:save:v2 already exists and is valid JSON, returns it immediately.
 * Write-before-delete: v2 is written before any v1 keys are removed (crash-safe).
 */
export function migrateV1toV2(roomIds: string[]): SaveDataV2 {
  // Check if v2 already exists — idempotent path
  const existing = localStorage.getItem(SAVE_KEY_V2);
  if (existing) {
    try {
      return JSON.parse(existing) as SaveDataV2;
    } catch {
      // Corrupted v2 — fall through to migrate from v1
    }
  }

  // Build v2 from v1 keys
  const save: SaveDataV2 = { ...defaultSave, gameStartTime: Date.now() };

  // Global arrays
  try {
    const cr = localStorage.getItem('completedRooms');
    if (cr) save.completedRooms = JSON.parse(cr);
  } catch { /* skip corrupted key */ }

  try {
    const cs = localStorage.getItem('collectedStories');
    if (cs) save.collectedStories = JSON.parse(cs);
  } catch { /* skip */ }

  try {
    const cn = localStorage.getItem('completedNPCs');
    if (cn) save.completedNPCs = JSON.parse(cn);
  } catch { /* skip */ }

  try {
    const cz = localStorage.getItem('completedZones');
    if (cz) save.completedZones = JSON.parse(cz);
  } catch { /* skip */ }

  try {
    const ci = localStorage.getItem('collectedEducationalItems');
    if (ci) save.collectedItems = JSON.parse(ci);
  } catch { /* skip */ }

  // Scores
  const psStr = localStorage.getItem('current-privacy-score');
  if (psStr) {
    const ps = parseInt(psStr, 10);
    if (!isNaN(ps)) save.privacyScore = ps;
  }

  const fpsStr = localStorage.getItem('final-privacy-score');
  if (fpsStr) {
    const fps = parseInt(fpsStr, 10);
    if (!isNaN(fps)) save.finalPrivacyScore = fps;
  }

  // Timing
  const gstStr = localStorage.getItem('gameStartTime');
  if (gstStr) {
    const gst = parseInt(gstStr, 10);
    if (!isNaN(gst)) save.gameStartTime = gst;
  }

  // Onboarding
  save.onboardingSeen = localStorage.getItem('pq:onboarding:seen') === '1';

  // Audio
  save.sfxMuted = localStorage.getItem('sfx_muted') === 'true';
  const mvStr = localStorage.getItem('music_volume');
  if (mvStr) {
    const mv = parseFloat(mvStr);
    if (!isNaN(mv)) save.musicVolume = mv;
  }

  // Per-room keys
  for (const roomId of roomIds) {
    try {
      const rg = localStorage.getItem(`resolvedGates_${roomId}`);
      if (rg) save.resolvedGates[roomId] = JSON.parse(rg);
    } catch { /* skip */ }

    try {
      const un = localStorage.getItem(`unlockedNpcs_${roomId}`);
      if (un) save.unlockedNpcs[roomId] = JSON.parse(un);
    } catch { /* skip */ }

    if (localStorage.getItem(`pq:room:${roomId}:npcPulsed`) === '1') {
      save.npcPulsedRooms.push(roomId);
    }
  }

  // Write v2 FIRST (crash-safe: v1 keys become orphans, not lost data)
  localStorage.setItem(SAVE_KEY_V2, JSON.stringify(save));

  // Remove v1 global keys
  const V1_GLOBAL_KEYS = [
    'completedRooms', 'collectedStories', 'completedNPCs', 'completedZones',
    'collectedEducationalItems', 'current-privacy-score', 'final-privacy-score',
    'gameStartTime', 'pq:onboarding:seen', 'sfx_muted', 'music_volume',
  ];
  V1_GLOBAL_KEYS.forEach(k => localStorage.removeItem(k));

  // Remove per-room v1 keys
  for (const roomId of roomIds) {
    localStorage.removeItem(`resolvedGates_${roomId}`);
    localStorage.removeItem(`unlockedNpcs_${roomId}`);
    localStorage.removeItem(`pq:room:${roomId}:npcPulsed`);
  }

  return save;
}

/**
 * Load the current v2 save. Returns defaultSave if absent or corrupted.
 */
export function loadSave(): SaveDataV2 {
  const raw = localStorage.getItem(SAVE_KEY_V2);
  if (!raw) return { ...defaultSave, gameStartTime: Date.now() };
  try {
    return JSON.parse(raw) as SaveDataV2;
  } catch {
    return { ...defaultSave, gameStartTime: Date.now() };
  }
}

/**
 * Atomically replace the v2 save object.
 */
export function writeSave(data: SaveDataV2): void {
  localStorage.setItem(SAVE_KEY_V2, JSON.stringify(data));
}
