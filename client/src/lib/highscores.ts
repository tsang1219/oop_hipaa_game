/**
 * highscores.ts — Local top-10 highscore tables (one per game mode).
 *
 * Lives under its own localStorage key (`hq:highscores:v1`), separate from the
 * PrivacyQuest save (`pq:save:v2`), so starting a New Game or Play Again never
 * wipes the board. Use `clearProgressKeepingHighscores()` instead of a bare
 * `localStorage.clear()` anywhere progress is reset.
 *
 * Score formulas live in `@shared/scoring` so the (future) online leaderboard
 * endpoint can recompute them server-side.
 */

import {
  type HighscoreMode,
  type ModeStats,
  type RunOutcome,
  HIGHSCORE_MODES,
  computeScore,
  sanitizeInitials,
  normalizeStats,
} from '@shared/scoring';

export type { HighscoreMode, RunOutcome } from '@shared/scoring';

export interface HighscoreEntry {
  id: string;
  /** Identifies one playthrough so the same run is never recorded twice. */
  runId: string;
  mode: HighscoreMode;
  initials: string;
  score: number;
  outcome: RunOutcome;
  stats: ModeStats;
  achievedAt: number;
}

interface HighscoreStore {
  version: 1;
  tables: Record<HighscoreMode, HighscoreEntry[]>;
}

export const HIGHSCORE_KEY = 'hq:highscores:v1';
export const LAST_INITIALS_KEY = 'hq:last-initials';
/** Every key with this prefix survives a progress reset. */
export const PRESERVED_PREFIX = 'hq:';
export const TABLE_SIZE = 10;

export const MODE_LABELS: Record<HighscoreMode, string> = {
  'privacy-quest': 'PRIVACYQUEST',
  'breach-defense': 'TOWER DEFENSE',
};

function emptyStore(): HighscoreStore {
  return { version: 1, tables: { 'privacy-quest': [], 'breach-defense': [] } };
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage full / blocked */ }
}

function validEntry(mode: HighscoreMode, raw: unknown): HighscoreEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const stats = normalizeStats(mode, r.stats);
  if (!stats) return null;
  if (typeof r.score !== 'number' || !Number.isFinite(r.score)) return null;
  if (r.outcome !== 'win' && r.outcome !== 'loss') return null;
  return {
    id: typeof r.id === 'string' ? r.id : `${mode}-${Math.random().toString(36).slice(2)}`,
    runId: typeof r.runId === 'string' ? r.runId : '',
    mode,
    initials: sanitizeInitials(typeof r.initials === 'string' ? r.initials : 'AAA'),
    score: Math.round(r.score),
    outcome: r.outcome,
    stats,
    achievedAt: typeof r.achievedAt === 'number' ? r.achievedAt : 0,
  };
}

function loadStore(): HighscoreStore {
  const raw = safeGet(HIGHSCORE_KEY);
  if (!raw) return emptyStore();
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; tables?: Record<string, unknown> };
    if (!parsed || parsed.version !== 1 || typeof parsed.tables !== 'object' || !parsed.tables) {
      return emptyStore();
    }
    const store = emptyStore();
    for (const mode of HIGHSCORE_MODES) {
      const list = Array.isArray(parsed.tables[mode]) ? (parsed.tables[mode] as unknown[]) : [];
      store.tables[mode] = sortEntries(
        list.map(e => validEntry(mode, e)).filter((e): e is HighscoreEntry => e !== null),
      ).slice(0, TABLE_SIZE);
    }
    return store;
  } catch {
    return emptyStore();
  }
}

function saveStore(store: HighscoreStore): void {
  safeSet(HIGHSCORE_KEY, JSON.stringify(store));
}

/** Highest score first; ties go to whoever got there first. */
function sortEntries(list: HighscoreEntry[]): HighscoreEntry[] {
  return [...list].sort((a, b) => b.score - a.score || a.achievedAt - b.achievedAt);
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getHighscores(mode: HighscoreMode): HighscoreEntry[] {
  return loadStore().tables[mode];
}

/** 1-based rank this score would take, or null if it would fall off the board. */
export function projectedRank(mode: HighscoreMode, score: number): number | null {
  const table = getHighscores(mode);
  // An equal score ranks below whoever set it first.
  const rank = table.filter(e => e.score >= score).length + 1;
  return rank <= TABLE_SIZE ? rank : null;
}

export function qualifiesForHighscore(mode: HighscoreMode, score: number): boolean {
  return score > 0 && projectedRank(mode, score) !== null;
}

export function findEntryByRun(mode: HighscoreMode, runId: string): HighscoreEntry | null {
  if (!runId) return null;
  return getHighscores(mode).find(e => e.runId === runId) ?? null;
}

export interface NewHighscore {
  mode: HighscoreMode;
  runId: string;
  initials: string;
  outcome: RunOutcome;
  stats: ModeStats;
  achievedAt?: number;
}

/**
 * Record a run. The score is always recomputed from stats (never trusted from
 * the caller), and a runId that is already on the board is not added again.
 * Returns the stored entry and its 1-based rank, or rank null if it missed.
 */
export function addHighscore(input: NewHighscore): { entry: HighscoreEntry; rank: number | null } {
  const store = loadStore();
  const table = store.tables[input.mode];
  const existing = input.runId ? table.find(e => e.runId === input.runId) : undefined;
  if (existing) {
    return { entry: existing, rank: table.indexOf(existing) + 1 };
  }

  const entry: HighscoreEntry = {
    id: `${input.mode}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    runId: input.runId,
    mode: input.mode,
    initials: sanitizeInitials(input.initials),
    score: computeScore(input.mode, input.stats, input.outcome).total,
    outcome: input.outcome,
    stats: input.stats,
    achievedAt: input.achievedAt ?? Date.now(),
  };

  const next = sortEntries([...table, entry]).slice(0, TABLE_SIZE);
  store.tables[input.mode] = next;
  saveStore(store);
  safeSet(LAST_INITIALS_KEY, entry.initials);
  const idx = next.indexOf(entry);
  return { entry, rank: idx === -1 ? null : idx + 1 };
}

export function getLastInitials(): string {
  const v = safeGet(LAST_INITIALS_KEY);
  return v ? sanitizeInitials(v) : 'AAA';
}

/**
 * Drop-in replacement for `localStorage.clear()` on New Game / Play Again:
 * wipes progress but keeps every `hq:*` key (highscores, last initials).
 */
export function clearProgressKeepingHighscores(): void {
  try {
    const keep: [string, string][] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PRESERVED_PREFIX)) {
        const v = localStorage.getItem(k);
        if (v !== null) keep.push([k, v]);
      }
    }
    localStorage.clear();
    for (const [k, v] of keep) localStorage.setItem(k, v);
  } catch {
    try { localStorage.clear(); } catch { /* blocked storage */ }
  }
}
