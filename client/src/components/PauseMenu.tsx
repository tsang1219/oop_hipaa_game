/**
 * PauseMenu — Run 14 (UI-05). ESC during free exploration.
 *
 * There was no pause screen before this run; ESC did nothing in the full
 * game. Presentation-only: Phaser is frozen by the parent via the same
 * REACT_PAUSE_EXPLORATION contract the codex uses, and nothing here touches
 * game state — RESUME hands control straight back, QUIT reloads into the
 * save-aware start menu (the full game saves continuously).
 *
 * Look: a paper "shift break" note over the dimmed ward — same stationery
 * language as the rounds clipboard (UI-03).
 */
import { useCallback, useEffect, useState } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { useOverlayMotion } from '@/hooks/useOverlayMotion';
import { uiSfx } from '@/lib/uiSfx';

export interface PauseMenuProps {
  roomName?: string;
  onResume: () => void;
  onHowToPlay: () => void;
  onQuitToMenu: () => void;
}

interface PauseItem {
  label: string;
  hint: string;
  action: () => void;
}

export function PauseMenu({ roomName, onResume, onHowToPlay, onQuitToMenu }: PauseMenuProps) {
  const motion = useOverlayMotion('pop');
  const [selected, setSelected] = useState(0);

  const items: PauseItem[] = [
    { label: 'RESUME', hint: 'Back to the shift', action: () => motion.close(onResume) },
    { label: 'HOW TO PLAY', hint: 'Controls & goals', action: () => motion.close(onHowToPlay) },
    { label: 'QUIT TO MENU', hint: 'Progress is saved', action: () => motion.close(onQuitToMenu) },
  ];

  useEffect(() => {
    uiSfx('open');
  }, []);

  const playNav = useCallback(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.18, rate: 1.4 });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        uiSfx('close');
        motion.close(onResume);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelected(i => { playNav(); return (i - 1 + items.length) % items.length; });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelected(i => { playNav(); return (i + 1) % items.length; });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.5, rate: 0.85 });
        items[selected].action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, motion.close, onResume, onHowToPlay, onQuitToMenu]);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center bg-black/70 ${motion.backdropClassName}`}
      data-testid="pause-menu"
      onClick={() => { uiSfx('close'); motion.close(onResume); }}
    >
      <div
        className={`relative w-[280px] ${motion.className}`}
        onClick={(e) => e.stopPropagation()}
        style={{ filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.6))' }}
      >
        {/* Paper sheet */}
        <div className="relative border-[3px] border-black bg-[#f7efd9] px-5 pt-5 pb-4">
          {/* tape strips */}
          <div className="absolute -top-2 left-8 w-12 h-4 bg-white/70 border border-black/20" style={{ transform: 'rotate(-5deg)' }} />
          <div className="absolute -top-2 right-8 w-12 h-4 bg-white/70 border border-black/20" style={{ transform: 'rotate(4deg)' }} />

          <div className="text-center mb-1">
            <h2 className="text-[16px] text-[#2a2118] tracking-widest" style={{ fontFamily: '"Press Start 2P"' }}>
              PAUSED
            </h2>
            <p className="mt-2 text-[13px] text-[#8a7a58]" style={{ fontFamily: 'var(--font-body)' }}>
              {roomName ? `On break — ${roomName}` : 'On break'}
            </p>
          </div>

          <div className="mt-3 border-t-2 border-dashed border-[#d8c9a3] pt-3 space-y-1.5">
            {items.map((item, i) => {
              const on = selected === i;
              return (
                <button
                  key={item.label}
                  onClick={() => { eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.5, rate: 0.85 }); item.action(); }}
                  onMouseEnter={() => { if (selected !== i) { playNav(); setSelected(i); } }}
                  className="w-full text-left px-2.5 py-2 border-2 transition-colors duration-100"
                  style={{
                    background: on ? '#fffaf0' : 'transparent',
                    borderColor: on ? '#c9a04a' : 'transparent',
                  }}
                  data-testid={`pause-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="inline-block w-3 text-[10px] align-middle" style={{ fontFamily: '"Press Start 2P"', color: '#c9762b', opacity: on ? 1 : 0 }}>
                    {'>'}
                  </span>
                  <span className="text-[10px] align-middle" style={{ fontFamily: '"Press Start 2P"', color: on ? '#2a2118' : '#6b5b3e' }}>
                    {item.label}
                  </span>
                  <span className="block pl-5 mt-1 text-[12px] leading-none" style={{ fontFamily: 'var(--font-body)', color: '#8a7a58' }}>
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 pt-2 border-t-2 border-dashed border-[#d8c9a3] text-center text-[12px] text-[#8a7a58]" style={{ fontFamily: 'var(--font-body)' }}>
            WASD move · SPACE talk · I codex · ESC resume
          </p>
        </div>
      </div>
    </div>
  );
}

export default PauseMenu;
