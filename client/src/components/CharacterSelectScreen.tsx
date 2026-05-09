/**
 * CharacterSelectScreen — Roster picker shown on New Game (full game and demo).
 *
 * Visual style mirrors StartMenu (dark bg + CRT scanlines + Press Start 2P).
 * Selection writes to localStorage via setSelectedCharacterId, then calls
 * `onConfirm` so the parent can transition pageMode → 'exploration'.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import {
  CHARACTERS,
  type CharacterId,
  setSelectedCharacterId,
} from '../data/characters';

export interface CharacterSelectScreenProps {
  onConfirm: (id: CharacterId) => void;
  onCancel?: () => void;
}

export function CharacterSelectScreen({ onConfirm, onCancel }: CharacterSelectScreenProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastSelectedRef = useRef(0);
  const base = import.meta.env.BASE_URL;

  const playNav = useCallback(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
      key: 'sfx_interact', volume: 0.18, rate: 1.4,
    });
  }, []);

  const playConfirm = useCallback(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
      key: 'sfx_interact', volume: 0.5, rate: 0.85,
    });
  }, []);

  useEffect(() => {
    if (selectedIndex !== lastSelectedRef.current) {
      lastSelectedRef.current = selectedIndex;
      playNav();
    }
  }, [selectedIndex, playNav]);

  const confirm = useCallback(
    (id: CharacterId) => {
      playConfirm();
      setSelectedCharacterId(id);
      setTimeout(() => onConfirm(id), 90);
    },
    [playConfirm, onConfirm],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + CHARACTERS.length) % CHARACTERS.length);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % CHARACTERS.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        confirm(CHARACTERS[selectedIndex].id);
      } else if (e.key === 'Escape' && onCancel) {
        e.preventDefault();
        onCancel();
      }
    },
    [selectedIndex, confirm, onCancel],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] relative overflow-hidden font-['Press_Start_2P'] p-8">
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(93, 176, 202, 0.08) 0%, rgba(26, 26, 46, 0) 60%)',
        }}
      />
      {/* CRT scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
        }}
      />

      <div className="relative z-20 flex flex-col items-center gap-10 max-w-6xl w-full">
        <div className="text-center">
          <div className="text-[10px] text-[#6DD8F9] tracking-[0.3em] mb-3 opacity-80">
            NEW GAME
          </div>
          <h1
            className="text-[28px] text-[#FFD23F]"
            style={{ textShadow: '4px 4px 0 #000, 0 0 18px rgba(255,210,63,0.35)' }}
          >
            CHOOSE YOUR HERO
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {CHARACTERS.map((c, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (isSelected) confirm(c.id);
                  else setSelectedIndex(i);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={[
                  'relative flex flex-col items-center gap-4 p-5 border-4 transition-transform',
                  'bg-[#0f0f1f]/80 hover:bg-[#16162d]',
                  isSelected
                    ? 'border-[#FFD23F] scale-[1.03] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-[#3a3a55] opacity-80',
                ].join(' ')}
                style={{
                  imageRendering: 'pixelated',
                }}
                aria-pressed={isSelected}
              >
                {/* Card art — crop to the front-facing idle frame (top-left 32×32
                    of the 96×128 spritesheet). Background-size 300% 400% scales
                    the sheet so a single frame fills the container; position 0% 0%
                    selects the first row's first column = idle facing camera. */}
                <div className="w-full aspect-square bg-[#0f0f1f] border-2 border-[#3a3a55] flex items-center justify-center overflow-hidden">
                  <div
                    className="w-3/4 h-3/4"
                    style={{
                      backgroundImage: `url(${base}${c.sheetPath})`,
                      backgroundSize: '300% 400%',
                      backgroundPosition: '0% 0%',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                    }}
                    role="img"
                    aria-label={`${c.name} sprite`}
                  />
                </div>

                <div className="text-center">
                  <div
                    className="text-[16px] mb-2"
                    style={{
                      color: isSelected ? '#FFD23F' : '#dcdcdc',
                      textShadow: '2px 2px 0 #000',
                    }}
                  >
                    {c.name.toUpperCase()}
                  </div>
                  <div className="text-[8px] text-[#9aa0c0] leading-relaxed">
                    {c.blurb}
                  </div>
                </div>

                {isSelected && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#FFD23F] text-[8px] text-black"
                    style={{ textShadow: 'none' }}
                  >
                    ▼ SELECTED
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => confirm(CHARACTERS[selectedIndex].id)}
            className="px-8 py-3 bg-[#FFD23F] text-black text-[12px] border-4 border-black hover:bg-[#ffe17a] active:translate-y-1 transition-transform"
            style={{ boxShadow: '6px 6px 0 0 #000' }}
          >
            BEGIN ADVENTURE
          </button>
          <div className="text-[7px] text-[#6c728f] tracking-widest mt-1">
            ← → TO BROWSE &nbsp;·&nbsp; ENTER TO CONFIRM
            {onCancel ? ' · ESC TO GO BACK' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CharacterSelectScreen;
