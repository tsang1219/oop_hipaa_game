import { useState, useEffect, useCallback } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';

export type OnboardingStep = 'WELCOME' | 'SELECT_TOWER' | 'PLACE_TOWER' | 'TOWER_PLACED' | 'PREP' | null;

interface OnboardingOverlayProps {
  step: OnboardingStep;
  onAdvance: (nextStep: OnboardingStep) => void;
}

// ── Typewriter hook ────────────────────────────────────────────
function useTypewriter(text: string, speed = 25) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const tick = () => {
      if (index < text.length) {
        index++;
        setDisplayedText(text.slice(0, index));
        setTimeout(tick, speed);
      } else {
        setIsTyping(false);
      }
    };
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [text, speed]);

  const skipToEnd = useCallback(() => {
    setDisplayedText(text);
    setIsTyping(false);
  }, [text]);

  return { displayedText, isTyping, skipToEnd };
}

// ── Step components ────────────────────────────────────────────

function WelcomeStep({ onAdvance }: { onAdvance: () => void }) {
  const { displayedText, isTyping, skipToEnd } = useTypewriter(
    "Defend the hospital network. Pick a tower, place it on the grid, and stop the cyber threats."
  );

  useEffect(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
  }, []);

  // Auto-advance 1.5s after typing completes
  useEffect(() => {
    if (!isTyping) {
      const timer = setTimeout(onAdvance, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTyping, onAdvance]);

  const handleClick = () => {
    if (isTyping) {
      skipToEnd();
    } else {
      onAdvance();
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50" onClick={handleClick}>
      <div
        className="relative border-2 border-[#00d4aa] rounded px-6 py-4 max-w-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{ background: 'rgba(20, 22, 40, 0.95)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Corner brackets */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-[#00d4aa] opacity-50" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-[#00d4aa] opacity-50" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-[#00d4aa] opacity-50" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-[#00d4aa] opacity-50" />

        <p className="text-[7px] text-[#00d4aa] tracking-[3px] mb-2 opacity-60"
           style={{ fontFamily: '"Press Start 2P", monospace' }}>
          MISSION BRIEF
        </p>
        <p className="text-sm text-gray-200 leading-relaxed font-sans">
          {displayedText}
          {isTyping && <span className="animate-pulse text-[#00d4aa]">|</span>}
        </p>
        {!isTyping && (
          <p className="text-[7px] text-gray-500 mt-3 text-right animate-pulse"
             style={{ fontFamily: '"Press Start 2P", monospace' }}>
            Click to continue...
          </p>
        )}
      </div>
    </div>
  );
}

function SelectTowerStep() {
  return (
    <>
      {/* Dark mask over the game grid — tower panel sits above via z-index */}
      <div className="absolute inset-0 z-20 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 70%, transparent 82%)' }} />

      {/* Bouncing hint label positioned above the tower panel */}
      <div className="absolute left-1/2 z-30 pointer-events-none" style={{ bottom: 135, transform: 'translateX(-50%)' }}>
        <div className="text-center animate-bounce">
          <div className="text-[8px] text-yellow-300 mb-1 px-3 py-1.5 rounded border border-yellow-400/50"
               style={{ fontFamily: '"Press Start 2P", monospace', background: 'rgba(20, 22, 40, 0.9)', boxShadow: '0 0 12px rgba(255, 200, 0, 0.3)' }}>
            Pick a defense below
          </div>
          <div className="text-yellow-400 text-lg">&#x25BC;</div>
        </div>
      </div>
    </>
  );
}

function PlaceTowerStep() {
  const { displayedText, isTyping } = useTypewriter("Click a glowing cell on the grid", 30);

  return (
    <>
      {/* Floating label at top of canvas */}
      <div className="absolute top-4 left-1/2 z-30 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
        <div className="text-center px-4 py-2 rounded border border-[#44ff44]/40"
             style={{ fontFamily: '"Press Start 2P", monospace', background: 'rgba(20, 22, 40, 0.9)', boxShadow: '0 0 12px rgba(68, 255, 68, 0.2)' }}>
          <span className="text-[9px] text-[#44ff44]">{displayedText}</span>
          {isTyping && <span className="animate-pulse text-[#44ff44]">|</span>}
        </div>
      </div>
    </>
  );
}

function TowerPlacedStep({ onAdvance }: { onAdvance: () => void }) {
  const { displayedText, isTyping } = useTypewriter(
    "Different towers counter different threats. Check the HINT badges for suggestions each wave."
  );

  useEffect(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.3 });
  }, []);

  // Auto-advance after typing + 2s
  useEffect(() => {
    if (!isTyping) {
      const timer = setTimeout(onAdvance, 2500);
      return () => clearTimeout(timer);
    }
  }, [isTyping, onAdvance]);

  return (
    <div className="absolute top-4 left-1/2 z-30 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
      <div className="text-center px-5 py-3 rounded border border-[#2ECC71]/50"
           style={{ background: 'rgba(20, 22, 40, 0.95)', boxShadow: '0 0 16px rgba(46, 204, 113, 0.3)' }}>
        <p className="text-[8px] text-[#2ECC71] mb-2 tracking-[2px]"
           style={{ fontFamily: '"Press Start 2P", monospace' }}>
          TOWER PLACED!
        </p>
        <p className="text-xs text-gray-300 leading-relaxed font-sans max-w-xs">
          {displayedText}
          {isTyping && <span className="animate-pulse text-[#2ECC71]">|</span>}
        </p>
      </div>
    </div>
  );
}

// ── Main overlay ───────────────────────────────────────────────

export function OnboardingOverlay({ step, onAdvance }: OnboardingOverlayProps) {
  if (!step || step === 'PREP') return null;

  return (
    <>
      {step === 'WELCOME' && (
        <WelcomeStep onAdvance={() => onAdvance('SELECT_TOWER')} />
      )}
      {step === 'SELECT_TOWER' && (
        <SelectTowerStep />
      )}
      {step === 'PLACE_TOWER' && (
        <PlaceTowerStep />
      )}
      {step === 'TOWER_PLACED' && (
        <TowerPlacedStep onAdvance={() => onAdvance('PREP')} />
      )}
    </>
  );
}
