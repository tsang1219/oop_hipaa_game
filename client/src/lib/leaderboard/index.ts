/**
 * Leaderboard providers — the seam where an online board plugs in later.
 *
 * Today only the LOCAL provider is active (this browser's top 10). An online
 * provider turns on when the build sets `VITE_LEADERBOARD_URL` (e.g. `/api/leaderboard`
 * once `api/leaderboard.ts` has its Upstash env vars). No credentials ever live
 * in the client: the HTTP provider only talks to our own endpoint, and the
 * endpoint recomputes every score from its stats before accepting it.
 *
 * See `.planning/LEADERBOARD.md` for the backend recommendation.
 */

import {
  type HighscoreEntry,
  type HighscoreMode,
  type NewHighscore,
  addHighscore,
  getHighscores,
  TABLE_SIZE,
} from '@/lib/highscores';

export interface LeaderboardRow {
  rank: number;
  initials: string;
  score: number;
  outcome: HighscoreEntry['outcome'];
  achievedAt: number;
  /** Local entries carry their run id so the UI can highlight "you". */
  runId?: string;
}

export interface SubmitResult {
  accepted: boolean;
  rank: number | null;
  /** Why a submission was refused (validation, rate limit, offline…). */
  reason?: string;
}

export interface LeaderboardProvider {
  readonly id: string;
  /** Tab label in the highscores screen. */
  readonly label: string;
  /** True for a board shared across players. */
  readonly isGlobal: boolean;
  getTop(mode: HighscoreMode, limit?: number): Promise<LeaderboardRow[]>;
  submit(run: NewHighscore & { score: number }): Promise<SubmitResult>;
}

// ── Local (this browser) ────────────────────────────────────────────────────

export const localLeaderboard: LeaderboardProvider = {
  id: 'local',
  label: 'THIS DEVICE',
  isGlobal: false,
  async getTop(mode, limit = TABLE_SIZE) {
    return getHighscores(mode).slice(0, limit).map((e, i) => ({
      rank: i + 1,
      initials: e.initials,
      score: e.score,
      outcome: e.outcome,
      achievedAt: e.achievedAt,
      runId: e.runId,
    }));
  },
  async submit(run) {
    const { rank } = addHighscore(run);
    return { accepted: rank !== null, rank };
  },
};

// ── Online (our own HTTP endpoint) ──────────────────────────────────────────

export function createHttpLeaderboard(baseUrl: string, timeoutMs = 6000): LeaderboardProvider {
  const withTimeout = async (input: string, init?: RequestInit) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  };

  return {
    id: 'http',
    label: 'WORLDWIDE',
    isGlobal: true,
    async getTop(mode, limit = TABLE_SIZE) {
      const res = await withTimeout(`${baseUrl}?mode=${encodeURIComponent(mode)}&limit=${limit}`);
      if (!res.ok) throw new Error(`leaderboard ${res.status}`);
      const body = (await res.json()) as { rows?: LeaderboardRow[] };
      return Array.isArray(body.rows) ? body.rows : [];
    },
    async submit(run) {
      try {
        const res = await withTimeout(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: run.mode,
            runId: run.runId,
            initials: run.initials,
            outcome: run.outcome,
            stats: run.stats,
            score: run.score,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as Partial<SubmitResult> & { error?: string };
        if (!res.ok) return { accepted: false, rank: null, reason: body.error ?? `http_${res.status}` };
        return { accepted: !!body.accepted, rank: body.rank ?? null, reason: body.reason };
      } catch {
        return { accepted: false, rank: null, reason: 'offline' };
      }
    },
  };
}

let cachedOnline: LeaderboardProvider | null | undefined;

/** The online provider, or null when no endpoint is configured for this build. */
export function getOnlineLeaderboard(): LeaderboardProvider | null {
  if (cachedOnline !== undefined) return cachedOnline;
  const url = (import.meta.env?.VITE_LEADERBOARD_URL as string | undefined)?.trim();
  cachedOnline = url ? createHttpLeaderboard(url) : null;
  return cachedOnline;
}

/** Every board the highscores screen should show, local first. */
export function getLeaderboards(): LeaderboardProvider[] {
  const online = getOnlineLeaderboard();
  return online ? [localLeaderboard, online] : [localLeaderboard];
}

/**
 * Record a finished run everywhere: synchronously on this device (the result
 * the UI celebrates), then fire-and-forget to the online board if one exists.
 */
export function submitRun(run: NewHighscore): { entry: HighscoreEntry; rank: number | null } {
  const result = addHighscore(run);
  const online = getOnlineLeaderboard();
  if (online && result.entry) {
    void online.submit({ ...run, initials: result.entry.initials, score: result.entry.score });
  }
  return result;
}
