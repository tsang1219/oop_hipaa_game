/**
 * scoring.ts — Arcade score formulas for the highscore board.
 *
 * Pure functions, shared by the client (to show the breakdown and save local
 * highscores) and by `api/leaderboard.ts` (to RECOMPUTE a submitted score from
 * its stats, so a tampered `score` field is rejected). Keep this file free of
 * browser/Node APIs so both sides can import it.
 *
 * The in-game meters (Community Trust %, Security %) stay exactly as they are;
 * this is a separate "points" layer on top, so a run can be compared to another
 * run the way an arcade cabinet compares them.
 */

export type HighscoreMode = 'privacy-quest' | 'breach-defense';
export type RunOutcome = 'win' | 'loss';

export const HIGHSCORE_MODES: readonly HighscoreMode[] = ['privacy-quest', 'breach-defense'];

export interface ScoreLine {
  /** Short, shouty label for the tally screen ("TRUST KEPT"). */
  label: string;
  /** Human detail ("87% x 50"). */
  detail: string;
  points: number;
}

export interface ScoreResult {
  total: number;
  lines: ScoreLine[];
}

// ── Plausibility bounds (server-side validation + client clamping) ──────────
// Deliberately a little generous so content additions don't instantly break
// submissions; tighten once the content set is frozen.
export const SCORE_BOUNDS = {
  maxNpcs: 40,
  maxIdentifiers: 18,
  maxStories: 15,
  maxWaves: 20,
  maxTowers: 200,
} as const;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
const int = (v: number, lo: number, hi: number) => Math.round(clamp(v, lo, hi));

// ── PrivacyQuest ────────────────────────────────────────────────────────────

export interface PrivacyQuestStats {
  /** Community Trust meter at the end, 0–100. */
  trust: number;
  npcsCompleted: number;
  identifiersFound: number;
  storiesCollected: number;
  elapsedMs: number;
}

export const PQ_POINTS = {
  perTrustPoint: 50,      // 100% trust → 5,000
  perScenario: 200,       // 26 scenarios → 5,200
  perIdentifier: 100,     // all 18 → 1,800
  perStory: 150,
  winBonus: 2500,
  speedBonusMax: 2000,    // win only: full at ≤30 min, zero at ≥180 min
  speedFullMinutes: 30,
  speedZeroMinutes: 180,
} as const;

export function computePrivacyQuestScore(stats: PrivacyQuestStats, outcome: RunOutcome): ScoreResult {
  const trust = int(stats.trust, 0, 100);
  const npcs = int(stats.npcsCompleted, 0, SCORE_BOUNDS.maxNpcs);
  const ids = int(stats.identifiersFound, 0, SCORE_BOUNDS.maxIdentifiers);
  const stories = int(stats.storiesCollected, 0, SCORE_BOUNDS.maxStories);
  const minutes = Math.max(0, stats.elapsedMs) / 60000;

  const lines: ScoreLine[] = [
    { label: 'TRUST KEPT', detail: `${trust}% x ${PQ_POINTS.perTrustPoint}`, points: trust * PQ_POINTS.perTrustPoint },
    { label: 'SCENARIOS', detail: `${npcs} x ${PQ_POINTS.perScenario}`, points: npcs * PQ_POINTS.perScenario },
    { label: 'IDENTIFIERS', detail: `${ids}/18 x ${PQ_POINTS.perIdentifier}`, points: ids * PQ_POINTS.perIdentifier },
    { label: 'STORIES', detail: `${stories} x ${PQ_POINTS.perStory}`, points: stories * PQ_POINTS.perStory },
  ];

  if (outcome === 'win') {
    lines.push({ label: 'AUDIT PASSED', detail: 'win bonus', points: PQ_POINTS.winBonus });
    const span = PQ_POINTS.speedZeroMinutes - PQ_POINTS.speedFullMinutes;
    const frac = clamp((PQ_POINTS.speedZeroMinutes - minutes) / span, 0, 1);
    const speed = Math.round(PQ_POINTS.speedBonusMax * frac);
    if (speed > 0) {
      lines.push({ label: 'SHIFT SPEED', detail: `${Math.round(minutes)} min`, points: speed });
    }
  }

  return { total: lines.reduce((s, l) => s + l.points, 0), lines };
}

// ── BreachDefense (standalone arcade) ───────────────────────────────────────

export interface BreachDefenseStats {
  /** Security meter at the end, 0–100 (0 on defeat). */
  security: number;
  wavesCompleted: number;
  towersPlaced: number;
}

export const BD_POINTS = {
  perWave: 500,
  perSecurityPoint: 30,   // win only: 100% → 3,000
  winBonus: 2000,
  leanTowerTarget: 20,    // win only: +50 per tower under 20
  perLeanTower: 50,
} as const;

export function computeBreachDefenseScore(stats: BreachDefenseStats, outcome: RunOutcome): ScoreResult {
  const waves = int(stats.wavesCompleted, 0, SCORE_BOUNDS.maxWaves);
  const towers = int(stats.towersPlaced, 0, SCORE_BOUNDS.maxTowers);
  const security = outcome === 'win' ? int(stats.security, 0, 100) : 0;

  const lines: ScoreLine[] = [
    { label: 'WAVES HELD', detail: `${waves} x ${BD_POINTS.perWave}`, points: waves * BD_POINTS.perWave },
  ];
  if (outcome === 'win') {
    lines.push({ label: 'SECURITY LEFT', detail: `${security}% x ${BD_POINTS.perSecurityPoint}`, points: security * BD_POINTS.perSecurityPoint });
    lines.push({ label: 'NETWORK SECURED', detail: 'win bonus', points: BD_POINTS.winBonus });
    const lean = Math.max(0, BD_POINTS.leanTowerTarget - towers);
    if (lean > 0) {
      lines.push({ label: 'LEAN DEFENSE', detail: `${towers} towers`, points: lean * BD_POINTS.perLeanTower });
    }
  }
  return { total: lines.reduce((s, l) => s + l.points, 0), lines };
}

// ── Dispatch + validation helpers ───────────────────────────────────────────

export type ModeStats = PrivacyQuestStats | BreachDefenseStats;

export function computeScore(mode: HighscoreMode, stats: ModeStats, outcome: RunOutcome): ScoreResult {
  return mode === 'privacy-quest'
    ? computePrivacyQuestScore(stats as PrivacyQuestStats, outcome)
    : computeBreachDefenseScore(stats as BreachDefenseStats, outcome);
}

/** 3 characters, A–Z / 0–9 — arcade initials, never a real name (no PII). */
export const INITIALS_RE = /^[A-Z0-9]{3}$/;

// Tiny blocklist so a corporate-training board doesn't show anything awkward.
const BLOCKED_INITIALS = new Set(['ASS', 'FUK', 'FUC', 'FCK', 'SEX', 'KKK', 'NIG', 'FAG', 'CUM', 'TIT', 'DIK']);

export function sanitizeInitials(raw: string): string {
  const up = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3).padEnd(3, 'A');
  return BLOCKED_INITIALS.has(up) ? 'AAA' : up;
}

export function isAllowedInitials(raw: string): boolean {
  return INITIALS_RE.test(raw) && !BLOCKED_INITIALS.has(raw);
}

/** Pick only the numeric stat fields a mode uses (drops anything extra). */
export function normalizeStats(mode: HighscoreMode, raw: unknown): ModeStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const num = (k: string) => (typeof r[k] === 'number' && Number.isFinite(r[k] as number) ? (r[k] as number) : null);
  if (mode === 'privacy-quest') {
    const vals = ['trust', 'npcsCompleted', 'identifiersFound', 'storiesCollected', 'elapsedMs'].map(num);
    if (vals.some(v => v === null)) return null;
    const [trust, npcsCompleted, identifiersFound, storiesCollected, elapsedMs] = vals as number[];
    return { trust, npcsCompleted, identifiersFound, storiesCollected, elapsedMs };
  }
  const vals = ['security', 'wavesCompleted', 'towersPlaced'].map(num);
  if (vals.some(v => v === null)) return null;
  const [security, wavesCompleted, towersPlaced] = vals as number[];
  return { security, wavesCompleted, towersPlaced };
}
