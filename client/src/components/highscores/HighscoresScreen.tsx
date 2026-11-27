/**
 * HighscoresScreen — the arcade "HALL OF FAME" board.
 *
 * Two game tabs (PrivacyQuest / Tower Defense), and a board switch when an
 * online leaderboard is configured (THIS DEVICE / WORLDWIDE). Always shows ten
 * rows, with dashed placeholders, so an empty board reads as "come fill me"
 * rather than broken. The player's just-saved run blinks.
 *
 * Keys: ←/→ switch game, Tab switches board, Esc / Enter goes back.
 */

import { useCallback, useEffect, useState } from 'react';
import { HIGHSCORE_MODES, type HighscoreMode } from '@shared/scoring';
import { MODE_LABELS, TABLE_SIZE } from '@/lib/highscores';
import { getLeaderboards, type LeaderboardRow } from '@/lib/leaderboard';
import { uiSfx } from '@/lib/uiSfx';

interface HighscoresScreenProps {
  initialMode?: HighscoreMode;
  highlightRunId?: string | null;
  onBack: () => void;
}

const MODE_ACCENT: Record<HighscoreMode, string> = {
  'privacy-quest': '#FFD23F',
  'breach-defense': '#FF6B9D',
};
const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32'];

function formatDate(ts: number): string {
  if (!ts) return '--/--';
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function HighscoresScreen({ initialMode = 'privacy-quest', highlightRunId = null, onBack }: HighscoresScreenProps) {
  const boards = getLeaderboards();
  const [mode, setMode] = useState<HighscoreMode>(initialMode);
  const [boardIdx, setBoardIdx] = useState(0);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [revealed, setRevealed] = useState(0);

  const board = boards[boardIdx] ?? boards[0];
  const accent = MODE_ACCENT[mode];

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setRevealed(0);
    board.getTop(mode, TABLE_SIZE)
      .then(r => { if (!cancelled) { setRows(r); setStatus('ready'); } })
      .catch(() => { if (!cancelled) { setRows([]); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [board, mode]);

  // Rows drop in one by one, top to bottom.
  useEffect(() => {
    if (status !== 'ready' || revealed >= TABLE_SIZE) return;
    const t = window.setTimeout(() => setRevealed(n => n + 1), revealed === 0 ? 120 : 55);
    return () => window.clearTimeout(t);
  }, [status, revealed]);

  const switchMode = useCallback((dir: 1 | -1) => {
    setMode(m => {
      const i = HIGHSCORE_MODES.indexOf(m);
      return HIGHSCORE_MODES[(i + dir + HIGHSCORE_MODES.length) % HIGHSCORE_MODES.length];
    });
    uiSfx('cardFlip');
  }, []);

  const back = useCallback(() => { uiSfx('back'); onBack(); }, [onBack]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); switchMode(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); switchMode(1); }
      else if (e.key === 'Tab' && boards.length > 1) {
        e.preventDefault();
        setBoardIdx(i => (i + 1) % boards.length);
        uiSfx('toggle');
      } else if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [switchMode, back, boards.length]);

  const padded: (LeaderboardRow | null)[] = Array.from({ length: TABLE_SIZE }, (_, i) => rows[i] ?? null);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] relative overflow-hidden font-['Press_Start_2P'] px-4 py-8"
      data-testid="highscores-screen"
    >
      {/* CRT scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)' }}
      />

      <h1
        className="text-[20px] tracking-wider mb-2 text-center"
        style={{ color: accent, textShadow: `0 0 14px ${accent}88, 3px 3px 0 #000` }}
      >
        HALL OF FAME
      </h1>
      <p className="text-[7px] tracking-[0.35em] text-gray-400 mb-6">THE BEST SHIFTS EVER WORKED</p>

      {/* Game tabs */}
      <div className="flex items-center gap-3 mb-3">
        <button type="button" onClick={() => switchMode(-1)} className="text-[12px] text-gray-400 hover:text-white px-2" aria-label="Previous game">◀</button>
        {HIGHSCORE_MODES.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { if (m !== mode) { setMode(m); uiSfx('cardFlip'); } }}
            data-testid={`highscores-tab-${m}`}
            className="px-3 py-2 border-4 text-[9px] shadow-[3px_3px_0_0_#000] transition-colors"
            style={{
              borderColor: m === mode ? MODE_ACCENT[m] : '#2a3a5c',
              color: m === mode ? '#fff' : '#777',
              backgroundColor: m === mode ? `${MODE_ACCENT[m]}22` : 'rgba(22,33,62,0.9)',
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
        <button type="button" onClick={() => switchMode(1)} className="text-[12px] text-gray-400 hover:text-white px-2" aria-label="Next game">▶</button>
      </div>

      {/* Board switch (only when an online board exists) */}
      {boards.length > 1 && (
        <div className="flex gap-2 mb-3">
          {boards.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => { setBoardIdx(i); uiSfx('toggle'); }}
              className="px-2 py-1 text-[7px] tracking-widest border-2"
              style={{ borderColor: i === boardIdx ? accent : '#444', color: i === boardIdx ? accent : '#888' }}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div
        className="w-[520px] max-w-full bg-[rgba(10,12,30,0.92)] border-4 shadow-[6px_6px_0_0_#000] p-4"
        style={{ borderColor: accent }}
      >
        <div className="grid grid-cols-[48px_1fr_1fr_44px_56px] gap-2 text-[7px] text-gray-500 tracking-widest pb-2 border-b-2 border-white/10">
          <span>RANK</span><span>NAME</span><span className="text-right">SCORE</span><span className="text-center">RUN</span><span className="text-right">DATE</span>
        </div>

        {status === 'error' ? (
          <p className="text-[8px] text-red-400 text-center py-10">CAN'T REACH THE BOARD. TRY AGAIN LATER.</p>
        ) : (
          <div className="pt-2 space-y-1.5">
            {padded.map((row, i) => {
              const mine = !!row && !!highlightRunId && row.runId === highlightRunId;
              const rankColor = row && i < 3 ? MEDAL[i] : '#9aa0b8';
              return (
                <div
                  key={i}
                  className="grid grid-cols-[48px_1fr_1fr_44px_56px] gap-2 items-center text-[10px] py-1 px-1"
                  data-testid={row ? 'highscore-row' : 'highscore-row-empty'}
                  style={{
                    opacity: i < revealed ? 1 : 0,
                    transform: i < revealed ? 'translateY(0)' : 'translateY(-6px)',
                    transition: 'all 160ms ease-out',
                    backgroundColor: mine ? `${accent}26` : 'transparent',
                    animation: mine ? 'hs-row-blink 700ms step-end infinite' : 'none',
                  }}
                >
                  <span style={{ color: rankColor }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="tracking-[0.3em]" style={{ color: row ? '#fff' : '#3d4260' }}>{row ? row.initials : '---'}</span>
                  <span className="text-right tabular-nums" style={{ color: row ? (i < 3 ? rankColor : '#e6e6f0') : '#3d4260' }}>
                    {row ? row.score.toLocaleString() : '------'}
                  </span>
                  <span className="text-center text-[9px]" title={row ? (row.outcome === 'win' ? 'Finished the run' : 'Fell short') : ''}>
                    {row ? (row.outcome === 'win' ? <span className="text-green-400">★</span> : <span className="text-gray-500">✕</span>) : ''}
                  </span>
                  <span className="text-right text-[7px] text-gray-500">{row ? formatDate(row.achievedAt) : ''}</span>
                </div>
              );
            })}
          </div>
        )}

        {status === 'ready' && rows.length === 0 && (
          <p className="text-[8px] text-center pt-3" style={{ color: accent, animation: 'hs-row-blink 1.2s step-end infinite' }}>
            NO SCORES YET. BE THE FIRST!
          </p>
        )}
      </div>

      <p className="text-[7px] text-gray-500 mt-3 tracking-wide">
        ★ FINISHED THE RUN &bull; SCORES STAY ON {boards[boardIdx]?.isGlobal ? 'THE WORLDWIDE BOARD' : 'THIS DEVICE'}
      </p>

      <button
        type="button"
        onClick={back}
        data-testid="highscores-back"
        className="mt-6 px-6 py-3 border-4 border-black text-[10px] text-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:shadow-none"
        style={{ backgroundColor: accent }}
      >
        ◀ BACK
      </button>
      <p className="text-[7px] text-gray-600 mt-3">◀▶ SWITCH GAME{boards.length > 1 ? ' • TAB SWITCH BOARD' : ''} • ESC TO RETURN</p>

      <style>{`@keyframes hs-row-blink{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

export default HighscoresScreen;
