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
      const parsed: unknown = JSON.parse(existing);
      // Run 07: only trust the existing blob if it actually is a v2 object;
      // validateSave repairs broken declared fields and keeps extended ones.
      // A wrong-version/shape blob falls through to v1 migration, whose
      // write-before-delete replaces it.
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed as { version?: unknown }).version === 2) {
        return validateSave(parsed);
      }
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
    return validateSave(JSON.parse(raw));
  } catch {
    return { ...defaultSave, gameStartTime: Date.now() };
  }
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(x => typeof x === 'string');
}

/**
 * Run 07 (save-shape validation): the old load was `JSON.parse(...) as SaveDataV2`
 * — corrupt JSON fell back safely, but structurally-wrong-but-valid JSON (a
 * hand-edited blob, a v1 object, a future v3) was trusted blindly and crashed
 * on the first `.length`/`.map` downstream.
 *
 * IMPORTANT (per STATE_OF_TRUTH §6.2): validate against the REAL persisted
 * shape, not just the interface. useGameState merges 8 extended fields
 * (currentAct, act1/2Complete, actFlags, decisions, encounterResults,
 * unifiedScore, currentRoomId) into this same blob — so unknown fields are
 * PRESERVED, never stripped. Only broken *declared* fields are repaired to
 * their defaults; a wrong version or a non-object resets gracefully.
 */
export function validateSave(parsed: unknown): SaveDataV2 {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    console.warn('[saveData] malformed save (not an object) — starting fresh');
    return { ...defaultSave, gameStartTime: Date.now() };
  }
  const s = parsed as Record<string, unknown>;
  if (s.version !== 2) {
    console.warn(`[saveData] unsupported save version "${String(s.version)}" — starting fresh`);
    return { ...defaultSave, gameStartTime: Date.now() };
  }

  const repaired: Record<string, unknown> = { ...s };
  let repairs = 0;
  for (const key of Object.keys(defaultSave) as (keyof SaveDataV2)[]) {
    if (key === 'version') continue;
    const def = defaultSave[key];
    const val = repaired[key];
    const ok = Array.isArray(def)
      ? isStringArray(val)
      : typeof def === 'object'
        ? typeof val === 'object' && val !== null && !Array.isArray(val)
        : typeof val === typeof def;
    if (!ok) {
      repaired[key] = Array.isArray(def)
        ? []
        : typeof def === 'object'
          ? {}
          : key === 'gameStartTime'
            ? Date.now()
            : def;
      repairs++;
    }
  }
  if (repairs > 0) {
    console.warn(`[saveData] repaired ${repairs} malformed field(s) in save`);
  }
  return repaired as unknown as SaveDataV2;
}

/**
 * Check whether the player has meaningful saved progress.
 */
export function hasSaveData(): boolean {
  const save = loadSave();
  return save.completedNPCs.length > 0 || save.completedRooms.length > 0 || save.onboardingSeen;
}

/**
 * Atomically replace the v2 save object.
 */
export function writeSave(data: SaveDataV2): void {
  localStorage.setItem(SAVE_KEY_V2, JSON.stringify(data));
}
