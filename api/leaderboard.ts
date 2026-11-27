/**
 * /api/leaderboard — Vercel serverless function (dormant until configured).
 *
 *   GET  /api/leaderboard?mode=privacy-quest&limit=10   → { rows: LeaderboardRow[] }
 *   POST /api/leaderboard  { mode, runId, initials, outcome, stats, score }
 *                                                        → { accepted, rank, reason? }
 *
 * Storage: Upstash Redis via its REST API (one sorted set per mode), so there is
 * no SDK dependency. Env (Vercel project settings; added automatically when you
 * connect Upstash from the Vercel Marketplace):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * If either is unset this returns 503 { error: 'not_configured' } and the client
 * keeps working with local highscores only. The client only calls this at all
 * when the build sets VITE_LEADERBOARD_URL.
 *
 * Anti-cheat (a browser game can't be made cheat-proof, so these raise the bar):
 *   1. The submitted `score` is ignored for ranking: it's RECOMPUTED from `stats`
 *      with the same shared formulas the client uses, and a mismatch is refused.
 *   2. Stats must sit inside SCORE_BOUNDS (no 500 waves, no 120% trust).
 *   3. PrivacyQuest wins faster than MIN_PQ_WIN_MS are refused.
 *   4. One submission per runId; per-IP rate limit (SUBMITS_PER_HOUR).
 *   5. Initials only (3 chars, blocklisted words) — never names or emails.
 * Next step if cheating shows up: a signed run ticket issued at run start.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  type HighscoreMode,
  HIGHSCORE_MODES,
  computeScore,
  isAllowedInitials,
  normalizeStats,
  SCORE_BOUNDS,
} from '../shared/scoring';

const MAX_ROWS = 50;
const KEEP_PER_MODE = 500;
const SUBMITS_PER_HOUR = 20;
const MIN_PQ_WIN_MS = 10 * 60 * 1000;

type RedisCmd = (string | number)[];

async function redis(cmds: RedisCmd[]): Promise<{ result?: unknown; error?: string }[]> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return (await res.json()) as { result?: unknown; error?: string }[];
}

const boardKey = (mode: HighscoreMode) => `lb:${mode}`;

function isMode(v: unknown): v is HighscoreMode {
  return typeof v === 'string' && (HIGHSCORE_MODES as readonly string[]).includes(v);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({ error: 'not_configured' });
  }

  try {
    if (req.method === 'GET') return await getTop(req, res);
    if (req.method === 'POST') return await submit(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    console.error('[leaderboard]', err);
    return res.status(502).json({ error: 'storage_unavailable' });
  }
}

async function getTop(req: VercelRequest, res: VercelResponse) {
  const mode = req.query.mode;
  if (!isMode(mode)) return res.status(400).json({ error: 'bad_mode' });
  const limit = Math.min(MAX_ROWS, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));

  const [{ result }] = await redis([['ZREVRANGE', boardKey(mode), 0, limit - 1, 'WITHSCORES']]);
  const flat = Array.isArray(result) ? (result as string[]) : [];
  const rows = [];
  for (let i = 0; i < flat.length; i += 2) {
    try {
      const m = JSON.parse(flat[i]) as { i: string; o: 'win' | 'loss'; t: number };
      rows.push({ rank: rows.length + 1, initials: m.i, outcome: m.o, achievedAt: m.t, score: Number(flat[i + 1]) });
    } catch { /* skip malformed member */ }
  }
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  return res.status(200).json({ rows });
}

async function submit(req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const { mode, runId, initials, outcome } = body;

  if (!isMode(mode)) return res.status(400).json({ error: 'bad_mode' });
  if (typeof runId !== 'string' || runId.length < 4 || runId.length > 64) return res.status(400).json({ error: 'bad_run' });
  if (typeof initials !== 'string' || !isAllowedInitials(initials)) return res.status(400).json({ error: 'bad_initials' });
  if (outcome !== 'win' && outcome !== 'loss') return res.status(400).json({ error: 'bad_outcome' });

  const stats = normalizeStats(mode, body.stats);
  if (!stats) return res.status(400).json({ error: 'bad_stats' });

  // (2) plausibility bounds — reject rather than clamp, clamping hides tampering
  if (mode === 'privacy-quest') {
    const s = stats as { trust: number; npcsCompleted: number; identifiersFound: number; storiesCollected: number; elapsedMs: number };
    if (s.trust < 0 || s.trust > 100 || s.npcsCompleted > SCORE_BOUNDS.maxNpcs || s.identifiersFound > SCORE_BOUNDS.maxIdentifiers
      || s.storiesCollected > SCORE_BOUNDS.maxStories || s.elapsedMs < 0) {
      return res.status(422).json({ accepted: false, rank: null, reason: 'implausible' });
    }
    // (3) speed floor
    if (outcome === 'win' && s.elapsedMs < MIN_PQ_WIN_MS) {
      return res.status(422).json({ accepted: false, rank: null, reason: 'implausible' });
    }
  } else {
    const s = stats as { security: number; wavesCompleted: number; towersPlaced: number };
    if (s.security < 0 || s.security > 100 || s.wavesCompleted > SCORE_BOUNDS.maxWaves || s.towersPlaced > SCORE_BOUNDS.maxTowers) {
      return res.status(422).json({ accepted: false, rank: null, reason: 'implausible' });
    }
  }

  // (1) recompute — never trust the client's number
  const score = computeScore(mode, stats, outcome).total;
  if (typeof body.score === 'number' && body.score !== score) {
    return res.status(422).json({ accepted: false, rank: null, reason: 'score_mismatch' });
  }

  // (4) rate limit + one submission per run
  const ip = String(req.headers['x-forwarded-for'] ?? 'unknown').split(',')[0].trim();
  const hour = Math.floor(Date.now() / 3_600_000);
  const rlKey = `lb:rl:${ip}:${hour}`;
  const runKey = `lb:run:${mode}:${runId}`;
  const [rl, fresh] = await redis([
    ['INCR', rlKey],
    ['SET', runKey, '1', 'NX', 'EX', 60 * 60 * 24 * 30],
    ['EXPIRE', rlKey, 3600],
  ]);
  if (Number(rl.result) > SUBMITS_PER_HOUR) return res.status(429).json({ accepted: false, rank: null, reason: 'rate_limited' });
  if (fresh.result !== 'OK') return res.status(409).json({ accepted: false, rank: null, reason: 'duplicate_run' });

  const member = JSON.stringify({ i: initials, o: outcome, t: Date.now(), r: runId.slice(0, 16) });
  const key = boardKey(mode);
  const [, rankRes] = await redis([
    ['ZADD', key, score, member],
    ['ZREVRANK', key, member],
    ['ZREMRANGEBYRANK', key, 0, -(KEEP_PER_MODE + 1)],
  ]);
  const rank = typeof rankRes.result === 'number' ? rankRes.result + 1 : null;
  return res.status(200).json({ accepted: true, rank, score });
}
