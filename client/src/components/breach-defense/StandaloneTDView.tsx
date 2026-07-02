/**
 * StandaloneTDView — presentational view for the standalone Tower Defense mode
 * (Phase 19 — TD-01..03). Extracted verbatim from UnifiedGamePage.tsx
 * (Refactor Round 2). ALL state and handlers live in UnifiedGamePage and
 * arrive here as props; this component only renders.
 */

import { useState, useEffect } from 'react';
import type Phaser from 'phaser';
import { PhaserGame } from '../../phaser/PhaserGame';
import { EncounterGameUI } from './EncounterGameUI';

// Phase 19 — standalone TD round result. Distinct from EncounterResult (which carries
// scoreContribution / outcome semantics tied to the unified compliance score).
// Standalone mode is score-isolated by design (TD-02 / TD-03).
export type TDStandaloneResult =
  | { outcome: 'victory'; securityScore: number; wavesCompleted: number; towersPlaced: number }
  | { outcome: 'defeat'; wavesCompleted: number; towersPlaced: number };

interface StandaloneTDViewProps {
  gameRef: React.Ref<Phaser.Game | null>;
  result: TDStandaloneResult | null;
  wavePause: { wave: number; total: number } | null;
  waveBanner: { wave: number; key: number } | null;
  helperVisible: boolean;
  onStartNextWave: () => void;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onDismissHelper: () => void;
}

// Mounts the Phaser canvas + EncounterGameUI HUD with no exploration overlays,
// no narrative card, no ITS-Office encounter context. Win/lose surfaces a minimal
// result overlay with PLAY AGAIN (in-place restart) and BACK TO MENU (full reload).
// The reload pattern guarantees the StartMenu reappears with localStorage
// untouched (TD-03 — no writeSave call ever fires from this code path).
export function StandaloneTDView({
  gameRef,
  result,
  wavePause,
  waveBanner,
  helperVisible,
  onStartNextWave,
  onPlayAgain,
  onBackToMenu,
  onDismissHelper,
}: StandaloneTDViewProps): JSX.Element {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
      <div className="relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <PhaserGame ref={gameRef} width={960} height={720} />

        {/* CRT scanline overlay (matches the rest of the app) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* In-game HUD: tower panel + score/budget/wave readouts. Standalone
            mode surfaces all 6 tower types from the start (the scene's
            wave-based unlocking still gates *placement* via the budget +
            unlockWave logic, but for the sponsor-pitch arcade flow we let the
            player see the full toolkit on the panel from frame one). */}
        {!result && (
          <EncounterGameUI
            availableTowerIds={['MFA', 'PATCH', 'FIREWALL', 'ENCRYPTION', 'TRAINING', 'ACCESS']}
          />
        )}

        {/* DESIGN-009: helper hint + wave-cleared banner */}
        {!result && helperVisible && (
          <div onClick={onDismissHelper}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-40 cursor-pointer px-4 py-2 bg-black/80 border-2 border-[#FFD700] text-[8px] text-[#FFD700]"
            style={{ fontFamily: '"Press Start 2P", monospace', animation: 'td-hint-fade 600ms ease-out forwards' }}>
            PLACE TOWERS &bull; DEFEND THE NETWORK
          </div>
        )}
        {!result && waveBanner && (
          <div key={waveBanner.key} className="absolute inset-x-0 top-1/3 z-40 pointer-events-none flex justify-center"
            style={{ animation: 'td-banner-pop 1.6s ease-out forwards' }}>
            <div className="px-6 py-3 bg-black/85 border-4 border-[#FFD700] text-[14px] text-[#FFD700]"
              style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '0 0 12px rgba(255,215,0,0.8)' }}>
              WAVE {waveBanner.wave} CLEARED
            </div>
          </div>
        )}

        {/* START NEXT WAVE button — shows during inter-wave pause in standalone mode */}
        {!result && wavePause && !waveBanner && (
          <button
            onClick={onStartNextWave}
            data-testid="td-start-next-wave"
            className="absolute left-1/2 -translate-x-1/2 z-30 px-6 py-3 border-4 border-black bg-[#2ECC71] text-black hover:brightness-110 active:translate-y-[2px] cursor-pointer"
            style={{
              bottom: 188,
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '11px',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              animation: 'td-start-pulse 1.4s ease-in-out infinite',
            }}
          >
            ▶ START WAVE {wavePause.wave}
          </button>
        )}

        {/* Win / lose overlay — minimal, no compliance-score wiring. */}
        {result && (
          <StandaloneTDResultOverlay
            result={result}
            onPlayAgain={onPlayAgain}
            onBackToMenu={onBackToMenu}
          />
        )}

        {/* DESIGN-009 inline keyframes (index.css is DO-NOT-TOUCH) */}
        <style>{`@keyframes td-hint-fade{0%{opacity:0;transform:translate(-50%,-8px)}100%{opacity:1;transform:translate(-50%,0)}}@keyframes td-banner-pop{0%{opacity:0;transform:scale(0.7)}18%{opacity:1;transform:scale(1.08)}32%{transform:scale(1)}78%{opacity:1}100%{opacity:0;transform:scale(1)}}@keyframes td-result-in{0%{opacity:0;transform:scale(0.85)}70%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}@keyframes td-result-glow-win{0%,100%{box-shadow:12px 12px 0 0 #000,0 0 24px rgba(46,204,113,0.45)}50%{box-shadow:12px 12px 0 0 #000,0 0 40px rgba(46,204,113,0.85)}}@keyframes td-result-glow-lose{0%,100%{box-shadow:12px 12px 0 0 #000,0 0 24px rgba(239,68,68,0.4)}50%{box-shadow:12px 12px 0 0 #000,0 0 36px rgba(239,68,68,0.75)}}@keyframes td-start-pulse{0%,100%{transform:translateX(-50%) scale(1);box-shadow:4px 4px 0 0 #000,0 0 0 rgba(46,204,113,0)}50%{transform:translateX(-50%) scale(1.04);box-shadow:4px 4px 0 0 #000,0 0 16px rgba(46,204,113,0.7)}}`}</style>
      </div>
      <p
        className="text-[8px] text-gray-500"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        TOWER DEFENSE &bull; STANDALONE MODE &bull; ESC TO RETURN TO MENU
      </p>
    </div>
  );
}

// ── Standalone TD result overlay (Phase 19) ────────────────────────
// Minimal end-of-round screen for the standalone Tower Defense path. Distinct from
// EncounterDebrief because that component carries score-contribution + "return to
// hospital" semantics; standalone TD is score-isolated by design (TD-02). Two
// buttons only: PLAY AGAIN (in-place restart) and BACK TO MENU (full reload to
// the cold-boot StartMenu). No score, no compliance bar, no encounter takeaways.
interface StandaloneTDResultOverlayProps {
  result: TDStandaloneResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

function StandaloneTDResultOverlay({
  result,
  onPlayAgain,
  onBackToMenu,
}: StandaloneTDResultOverlayProps): JSX.Element {
  const isWin = result.outcome === 'victory';
  const targetScore = isWin ? result.securityScore : 0; // DESIGN-009: count-up
  const [shownScore, setShownScore] = useState(0);
  useEffect(() => {
    if (!isWin) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShownScore(Math.round((1 - Math.pow(1 - t, 3)) * targetScore));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isWin, targetScore]);
  return (
    <div
      className="absolute inset-0 bg-black/85 flex items-center justify-center z-50"
      data-testid="td-standalone-result"
    >
      <div
        className={`text-center border-4 ${isWin ? 'border-[#2ECC71]' : 'border-red-500'} bg-[#1a1a2e] p-8 max-w-md`}
        style={{ fontFamily: '"Press Start 2P", monospace', animation: `td-result-in 460ms cubic-bezier(0.34,1.56,0.64,1) forwards, ${isWin ? 'td-result-glow-win' : 'td-result-glow-lose'} 2.4s ease-in-out infinite` }}
      >
        <h1
          className={`text-xl font-bold mb-3 ${
            isWin ? 'text-[#2ECC71]' : 'text-red-400'
          }`}
        >
          {isWin ? 'NETWORK SECURED' : 'NETWORK BREACHED'}
        </h1>
        <p className="text-[8px] text-gray-400 mb-4 leading-relaxed">
          {isWin
            ? 'You held the line through every wave. The patient data is safe today.'
            : 'The attackers got through. Try again — every restart is more practice.'}
        </p>
        <div className="bg-[#2a2a3e] border-2 border-gray-600 p-3 rounded mb-6">
          {result.outcome === 'victory' && (
            <p className="text-[8px] text-gray-300">
              Security:{' '}
              <span className="text-green-400">{shownScore}%</span>
            </p>
          )}
          <p className="text-[8px] text-gray-300">
            Waves Cleared:{' '}
            <span className="text-yellow-400">{result.wavesCompleted}</span>
          </p>
          <p className="text-[8px] text-gray-300">
            Towers Placed:{' '}
            <span className="text-blue-400">{result.towersPlaced}</span>
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            data-testid="td-standalone-play-again"
            className={`${
              isWin
                ? 'bg-[#2ECC71] hover:bg-[#27AE60] text-black'
                : 'bg-[#FF6B9D] hover:bg-[#FF5A8A] text-white'
            } font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]`}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onBackToMenu}
            data-testid="td-standalone-back-to-menu"
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer text-[10px]"
          >
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
