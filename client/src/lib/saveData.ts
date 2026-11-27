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
  // Storage blocked entirely (private mode / sandboxed iframe): play from a
  // fresh in-memory save rather than crash on the first getItem.
  try { localStorage.getItem(SAVE_KEY_V2); } catch {
    return { ...defaultSave, gameStartTime: Date.now() };
  }
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
      backupUnreadableSave(existing, 'save has an unsupported shape or version');
    } catch {
      // Corrupted v2 — park it, then fall through to migrate from v1
      backupUnreadableSave(existing, 'save is not valid JSON');
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

  // Write v2 FIRST (crash-safe: v1 keys become orphans, not lost data).
  // If the write is refused (quota), keep the v1 keys — they're still the
  // only durable copy.
  if (!safeSet(SAVE_KEY_V2, JSON.stringify(save))) return save;

  // Remove v1 global keys. `sfx_muted` and `music_volume` are NOT v1 orphans:
  // audioMixer, MusicController and BreachDefenseScene still read them live as
  // device prefs, so deleting them here silently reset the player's mute and
  // volume on every fresh boot and after every NEW GAME.
  const V1_GLOBAL_KEYS = [
    'completedRooms', 'collectedStories', 'completedNPCs', 'completedZones',
    'collectedEducationalItems', 'current-privacy-score', 'final-privacy-score',
    'gameStartTime', 'pq:onboarding:seen',
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

/** Where an unreadable save is parked before the game starts fresh over it. */
export const SAVE_BACKUP_KEY = 'pq:save:v2:backup';

/**
 * Device preferences that survive NEW GAME. Everything else in localStorage is
 * progress (save blob, per-room pulses, whimsy counters, personal bests) and
 * is wiped by clearProgress().
 */
export const DEVICE_PREF_KEYS = ['pq:audio:mix:v1', 'music_volume', 'sfx_muted', 'pq:audio:dev'] as const;

// ── Storage guards ─────────────────────────────────────────────
// localStorage can throw: SecurityError when storage is blocked (some private
// modes, sandboxed iframes) and QuotaExceededError when the disk allowance is
// full. A save hiccup must never take the game down with it.

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeSet(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

/**
 * Copy an unreadable save aside before anything overwrites it, so a corrupt,
 * hand-edited or newer-build save is never silently destroyed. Keeps the
 * first unreadable blob it sees — a later fresh save can't clobber it.
 */
function backupUnreadableSave(raw: string, reason: string): void {
  if (safeGet(SAVE_BACKUP_KEY) === raw) return;
  if (safeSet(SAVE_BACKUP_KEY, raw)) {
    console.warn(`[saveData] ${reason} — original kept under "${SAVE_BACKUP_KEY}"`);
  }
}

function isReadableV2(parsed: unknown): boolean {
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    && (parsed as { version?: unknown }).version === 2;
}

/**
 * Load the current v2 save. Returns defaultSave if absent or corrupted; an
 * unreadable blob is backed up first (see backupUnreadableSave).
 */
export function loadSave(): SaveDataV2 {
  const raw = safeGet(SAVE_KEY_V2);
  if (!raw) return { ...defaultSave, gameStartTime: Date.now() };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backupUnreadableSave(raw, 'save is not valid JSON');
    return { ...defaultSave, gameStartTime: Date.now() };
  }
  if (!isReadableV2(parsed)) {
    backupUnreadableSave(raw, 'save has an unsupported shape or version');
  }
  return validateSave(parsed);
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

// ── Save status (autosave indicator) ───────────────────────────

export type SaveStatus = 'saved' | 'failed';
type SaveStatusListener = (status: SaveStatus) => void;
const statusListeners = new Set<SaveStatusListener>();

/** Hear about each write that changed progress, and each failed write. Returns an unsubscribe function. */
export function subscribeSaveStatus(fn: SaveStatusListener): () => void {
  statusListeners.add(fn);
  return () => { statusListeners.delete(fn); };
}

/**
 * Atomically replace the v2 save object. Stamps `savedAt` (an extended field
 * the validator preserves) for the CONTINUE card. Returns false — and tells
 * status listeners — when storage refused the write, instead of throwing.
 */
export function writeSave(data: SaveDataV2): boolean {
  // Both persistence effects re-write on mount and on unrelated renders; only
  // move savedAt forward when the progress itself changed, so "saved 2 days
  // ago" on the CONTINUE card stays honest.
  const { savedAt: _incoming, ...content } = data as SaveDataV2 & { savedAt?: unknown };
  let savedAt = Date.now();
  let changed = true;
  try {
    const prev = JSON.parse(safeGet(SAVE_KEY_V2) ?? 'null') as Record<string, unknown> | null;
    if (prev && typeof prev.savedAt === 'number') {
      const { savedAt: prevAt, ...prevContent } = prev;
      if (JSON.stringify(prevContent) === JSON.stringify(content)) {
        savedAt = prevAt as number;
        changed = false;
      }
    }
  } catch { /* unreadable previous save — stamp now */ }
  const ok = safeSet(SAVE_KEY_V2, JSON.stringify({ ...content, savedAt }));
  if (!ok) console.warn('[saveData] could not write save (storage full or blocked)');
  // Listeners hear about real progress writes and failures — not no-op rewrites.
  if (!ok) statusListeners.forEach(fn => fn('failed'));
  else if (changed) statusListeners.forEach(fn => fn('saved'));
  return ok;
}

// ── CONTINUE summary ───────────────────────────────────────────

export interface SaveSummary {
  /** Last room the player stood in, or null for a save that predates room tracking. */
  currentRoomId: string | null;
  roomsCleared: number;
  peopleHelped: number;
  act: 1 | 2 | 3;
  /** ms epoch of the last write, or null for saves written before savedAt existed. */
  savedAt: number | null;
}

/** Read just enough of the save to describe it on the start menu. */
export function getSaveSummary(): SaveSummary {
  const s = loadSave() as SaveDataV2 & Record<string, unknown>;
  const act = s.currentAct === 2 || s.currentAct === 3 ? s.currentAct : 1;
  return {
    currentRoomId: typeof s.currentRoomId === 'string' ? s.currentRoomId : null,
    roomsCleared: s.completedRooms.length,
    peopleHelped: s.completedNPCs.length,
    act,
    savedAt: typeof s.savedAt === 'number' && Number.isFinite(s.savedAt) ? s.savedAt : null,
  };
}

/**
 * Wipe progress for a NEW GAME while keeping device preferences (audio mix,
 * mute, music volume) — erasing a save shouldn't also blast the speakers.
 */
export function clearProgress(): void {
  try {
    const keep = new Map<string, string>();
    for (const k of DEVICE_PREF_KEYS) {
      const v = localStorage.getItem(k);
      if (v !== null) keep.set(k, v);
    }
    localStorage.clear();
    keep.forEach((v, k) => localStorage.setItem(k, v));
  } catch {
    try { localStorage.removeItem(SAVE_KEY_V2); } catch { /* storage unavailable */ }
  }
}

/** "JUST NOW" / "5 MIN AGO" / "3 HR AGO" / "2 DAYS AGO" — start-menu voice. */
export function formatSaveAge(savedAt: number, now: number = Date.now()): string {
  const mins = Math.floor(Math.max(0, now - savedAt) / 60_000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins} MIN AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HR AGO`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'YESTERDAY' : `${days} DAYS AGO`;
}
