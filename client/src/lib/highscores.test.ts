import { describe, it, expect, beforeEach } from 'vitest';
import {
  addHighscore,
  getHighscores,
  projectedRank,
  qualifiesForHighscore,
  findEntryByRun,
  clearProgressKeepingHighscores,
  getLastInitials,
  HIGHSCORE_KEY,
  TABLE_SIZE,
} from './highscores';
import {
  computePrivacyQuestScore,
  computeBreachDefenseScore,
  sanitizeInitials,
  isAllowedInitials,
  normalizeStats,
} from '@shared/scoring';

const td = (waves: number, runId: string, initials = 'AAA') =>
  addHighscore({
    mode: 'breach-defense',
    runId,
    initials,
    outcome: 'loss',
    stats: { security: 0, wavesCompleted: waves, towersPlaced: 5 },
  });

describe('scoring', () => {
  it('privacy quest: perfect fast win', () => {
    const r = computePrivacyQuestScore(
      { trust: 100, npcsCompleted: 26, identifiersFound: 18, storiesCollected: 6, elapsedMs: 20 * 60000 },
      'win',
    );
    // 5000 + 5200 + 1800 + 900 + 2500 win + 2000 speed
    expect(r.total).toBe(17400);
    expect(r.lines.map(l => l.label)).toContain('SHIFT SPEED');
  });

  it('privacy quest: a loss gets no win or speed bonus, and trust is clamped', () => {
    const r = computePrivacyQuestScore(
      { trust: 140, npcsCompleted: 3, identifiersFound: 0, storiesCollected: 0, elapsedMs: 60000 },
      'loss',
    );
    expect(r.total).toBe(100 * 50 + 3 * 200);
    expect(r.lines.some(l => l.label === 'AUDIT PASSED')).toBe(false);
  });

  it('privacy quest: speed bonus fades to zero at 180 minutes', () => {
    const stats = { trust: 50, npcsCompleted: 0, identifiersFound: 0, storiesCollected: 0, elapsedMs: 200 * 60000 };
    const r = computePrivacyQuestScore(stats, 'win');
    expect(r.lines.some(l => l.label === 'SHIFT SPEED')).toBe(false);
  });

  it('breach defense: win with lean towers', () => {
    const r = computeBreachDefenseScore({ security: 80, wavesCompleted: 10, towersPlaced: 12 }, 'win');
    // 5000 waves + 2400 security + 2000 win + 8*50 lean
    expect(r.total).toBe(9800);
  });

  it('breach defense: a loss counts waves only', () => {
    const r = computeBreachDefenseScore({ security: 80, wavesCompleted: 4, towersPlaced: 3 }, 'loss');
    expect(r.total).toBe(2000);
  });

  it('initials are sanitized to 3 upper-case chars and filtered', () => {
    expect(sanitizeInitials('ab')).toBe('ABA');
    expect(sanitizeInitials('x!y?z9')).toBe('XYZ');
    expect(sanitizeInitials('ass')).toBe('AAA');
    expect(isAllowedInitials('JDT')).toBe(true);
    expect(isAllowedInitials('jdt')).toBe(false);
  });

  it('normalizeStats rejects missing fields and drops extras', () => {
    expect(normalizeStats('breach-defense', { security: 1, wavesCompleted: 2 })).toBeNull();
    expect(normalizeStats('breach-defense', { security: 1, wavesCompleted: 2, towersPlaced: 3, extra: 9 }))
      .toEqual({ security: 1, wavesCompleted: 2, towersPlaced: 3 });
  });
});

describe('local highscore table', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty and any positive score qualifies', () => {
    expect(getHighscores('privacy-quest')).toEqual([]);
    expect(qualifiesForHighscore('privacy-quest', 1)).toBe(true);
    expect(qualifiesForHighscore('privacy-quest', 0)).toBe(false);
  });

  it('sorts high to low, ties go to the earlier run, and keeps only the top 10', () => {
    for (let i = 1; i <= 12; i++) td(i, `run-${i}`);
    const tie = td(12, 'run-tie');
    const table = getHighscores('breach-defense');
    expect(table).toHaveLength(TABLE_SIZE);
    expect(table[0].runId).toBe('run-12');
    expect(table[1].runId).toBe('run-tie');
    expect(tie.rank).toBe(2);
    expect(table.some(e => e.runId === 'run-1')).toBe(false);
    expect(projectedRank('breach-defense', 1)).toBeNull();
  });

  it('recomputes the score from stats rather than trusting the caller', () => {
    const { entry } = td(3, 'r');
    expect(entry.score).toBe(1500);
  });

  it('never records the same run twice', () => {
    td(5, 'same');
    const again = td(9, 'same');
    expect(getHighscores('breach-defense')).toHaveLength(1);
    expect(again.entry.score).toBe(2500);
    expect(findEntryByRun('breach-defense', 'same')).not.toBeNull();
  });

  it('remembers the last initials for the next entry', () => {
    td(2, 'a', 'zed');
    expect(getLastInitials()).toBe('ZED');
  });

  it('survives a progress reset', () => {
    td(4, 'keep');
    localStorage.setItem('pq:save:v2', '{"version":2}');
    clearProgressKeepingHighscores();
    expect(localStorage.getItem('pq:save:v2')).toBeNull();
    expect(getHighscores('breach-defense')).toHaveLength(1);
  });

  it('shrugs off corrupt or hand-edited storage', () => {
    localStorage.setItem(HIGHSCORE_KEY, '{not json');
    expect(getHighscores('privacy-quest')).toEqual([]);
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify({
      version: 1,
      tables: { 'breach-defense': [{ score: 'lots' }, { score: 10, outcome: 'win', initials: 'ok', stats: { security: 1, wavesCompleted: 1, towersPlaced: 1 } }] },
    }));
    const t = getHighscores('breach-defense');
    expect(t).toHaveLength(1);
    expect(t[0].initials).toBe('OKA');
  });
});
