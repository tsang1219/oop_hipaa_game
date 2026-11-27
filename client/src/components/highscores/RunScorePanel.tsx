/**
 * RunScorePanel — end-of-run arcade tally + highscore entry.
 *
 * Beat sheet (Commandments 2 & 8): each breakdown line ticks in with a soft
 * score blip → the total counts up → a short pause → if the run made the board,
 * "NEW HIGH SCORE!" + fanfare + initials entry → saved rank flashes in.
 *
 * The run is recorded at most once (dedup by runId), so remounting the end
 * screen never double-books a score.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeScore, type ModeStats } from '@shared/scoring';
import {
  type HighscoreMode,
  type RunOutcome,
  findEntryByRun,
  getHighscores,
  getLastInitials,
  projectedRank,
  qualifiesForHighscore,
} from '@/lib/highscores';
import { getOnlineLeaderboard, submitRun } from '@/lib/leaderboard';
import { uiSfx } from '@/lib/uiSfx';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import { InitialsEntry } from './InitialsEntry';

interface RunScorePanelProps {
  mode: HighscoreMode;
  outcome: RunOutcome;
  stats: ModeStats;
  runId: string;
  /** False in demo mode: show the tally but don't touch the board. */
  record?: boolean;
  compact?: boolean;
  accent?: string;
  onViewHighscores?: (runId: string | null) => void;
}

const LINE_STAGGER_MS = 260;
const COUNT_MS = 900;

export function RunScorePanel({
  mode,
  outcome,
  stats,
  runId,
  record = true,
  compact = false,
  accent = '#FFD23F',
  onViewHighscores,
}: RunScorePanelProps) {
  // Freeze inputs at mount: the end screen re-renders, a run's result shouldn't.
  const frozen = useRef({ mode, outcome, stats, runId });
  const result = useMemo(
    () => computeScore(frozen.current.mode, frozen.current.stats, frozen.current.outcome),
    [],
  );

  const alreadySaved = useMemo(() => findEntryByRun(mode, runId), [mode, runId]);
  const eligible = useMemo(
    () => record && !alreadySaved && (qualifiesForHighscore(mode, result.total) || getOnlineLeaderboard() !== null),
    [record, alreadySaved, mode, result.total],
  );
  const madeLocalBoard = useMemo(() => projectedRank(mode, result.total) !== null && result.total > 0, [mode, result.total]);

  const [linesShown, setLinesShown] = useState(0);
  const [shownTotal, setShownTotal] = useState(0);
  const [phase, setPhase] = useState<'tally' | 'counting' | 'entry' | 'saved' | 'done'>('tally');
  const [savedRank, setSavedRank] = useState<number | null>(
    alreadySaved ? findRank(mode, runId) : null,
  );

  // Line-by-line reveal
  useEffect(() => {
    if (linesShown >= result.lines.length) {
      setPhase('counting');
      return;
    }
    const t = window.setTimeout(() => {
      setLinesShown(n => n + 1);
      uiSfx('scoreUp', { volume: 0.22, rate: 1 + linesShown * 0.08 });
    }, linesShown === 0 ? 350 : LINE_STAGGER_MS);
    return () => window.clearTimeout(t);
  }, [linesShown, result.lines.length]);

  // Total count-up, then a beat, then the payoff
  useEffect(() => {
    if (phase !== 'counting') return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      setShownTotal(Math.round((1 - Math.pow(1 - t, 3)) * result.total));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          if (eligible && madeLocalBoard) {
            eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.5 });
          }
          setPhase(eligible ? 'entry' : alreadySaved ? 'saved' : 'done');
        }, 450);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, result.total, eligible, madeLocalBoard, alreadySaved]);

  const handleConfirm = useCallback((initials: string) => {
    const { rank } = submitRun({
      mode: frozen.current.mode,
      runId: frozen.current.runId,
      initials,
      outcome: frozen.current.outcome,
      stats: frozen.current.stats,
    });
    setSavedRank(rank);
    setPhase('saved');
    if (rank === 1) {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.6, rate: 1.12 });
    } else {
      uiSfx('bell');
    }
  }, []);

  const text = compact ? 'text-[7px]' : 'text-[9px]';
  const totalText = compact ? 'text-[14px]' : 'text-[20px]';

  return (
    <div
      className={`bg-black/40 border-2 rounded-[4px] ${compact ? 'p-3 space-y-1.5' : 'p-5 space-y-2'} font-['Press_Start_2P']`}
      style={{ borderColor: `${accent}55` }}
      data-testid="run-score-panel"
    >
      <p className={`${compact ? 'text-[8px]' : 'text-[10px]'} tracking-[0.3em] text-center`} style={{ color: accent }}>
        SCORE
      </p>

      <div className="space-y-1">
        {result.lines.map((line, i) => (
          <div
            key={line.label}
            className={`flex justify-between items-baseline gap-3 ${text}`}
            style={{
              opacity: i < linesShown ? 1 : 0,
              transform: i < linesShown ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 200ms ease-out',
            }}
          >
            <span className="text-gray-300 text-left">
              {line.label}
              <span className="text-gray-500 normal-case"> {line.detail}</span>
            </span>
            <span className="text-white tabular-nums">+{line.points.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center border-t-2 border-white/10 pt-2">
        <span className={`${text} text-gray-300`}>TOTAL</span>
        <span
          className={`${totalText} tabular-nums`}
          style={{ color: accent, textShadow: phase !== 'tally' && phase !== 'counting' ? `0 0 12px ${accent}` : 'none' }}
          data-testid="run-score-total"
        >
          {shownTotal.toLocaleString()}
        </span>
      </div>

      {phase === 'entry' && (
        <div className="pt-2 flex flex-col items-center gap-2" style={{ animation: 'hs-pop 420ms cubic-bezier(0.34,1.56,0.64,1)' }}>
          {madeLocalBoard && (
            <p
              className={`${compact ? 'text-[10px]' : 'text-[13px]'} text-center`}
              style={{ color: accent, animation: 'hs-rainbow 1.2s linear infinite' }}
              data-testid="new-highscore-banner"
            >
              NEW HIGH SCORE!
            </p>
          )}
          <InitialsEntry initial={getLastInitials()} onConfirm={handleConfirm} accent={accent} compact={compact} />
        </div>
      )}

      {phase === 'saved' && (
        <div className="pt-2 text-center space-y-2" style={{ animation: 'hs-pop 420ms cubic-bezier(0.34,1.56,0.64,1)' }}>
          <p className={`${compact ? 'text-[9px]' : 'text-[12px]'}`} style={{ color: accent }} data-testid="saved-rank">
            {savedRank ? `RANK #${savedRank} ON THE BOARD` : 'SCORE SENT'}
          </p>
          {onViewHighscores && (
            <button
              type="button"
              onClick={() => { uiSfx('open'); onViewHighscores(frozen.current.runId); }}
              className={`${text} underline underline-offset-4 text-gray-300 hover:text-white`}
              data-testid="view-highscores"
            >
              VIEW HIGH SCORES ▸
            </button>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="pt-1 text-center space-y-2">
          {record && (
            <p className={`${text} text-gray-500`}>NOT QUITE TOP 10. RUN IT BACK!</p>
          )}
          {onViewHighscores && (
            <button
              type="button"
              onClick={() => { uiSfx('open'); onViewHighscores(null); }}
              className={`${text} underline underline-offset-4 text-gray-300 hover:text-white`}
              data-testid="view-highscores"
            >
              VIEW HIGH SCORES ▸
            </button>
          )}
        </div>
      )}

      <style>{`@keyframes hs-pop{0%{opacity:0;transform:scale(.85)}70%{opacity:1;transform:scale(1.05)}100%{transform:scale(1)}}@keyframes hs-rainbow{0%{color:#FFD23F}33%{color:#FF6B9D}66%{color:#00d4aa}100%{color:#FFD23F}}`}</style>
    </div>
  );
}

function findRank(mode: HighscoreMode, runId: string): number | null {
  const idx = getHighscores(mode).findIndex(e => e.runId === runId);
  return idx === -1 ? null : idx + 1;
}
