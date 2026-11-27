/**
 * InitialsEntry — the arcade-cabinet "ENTER YOUR INITIALS" widget.
 *
 * Keyboard: ↑/↓ cycle the letter, ←/→ move the cursor,
 * typing a letter/digit sets it and advances, Enter confirms.
 * Mouse/touch: tap the ▲/▼ arrows, tap a slot to select it, tap OK.
 */

import { useCallback, useEffect, useState } from 'react';
import { uiSfx } from '@/lib/uiSfx';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

interface InitialsEntryProps {
  initial: string;
  onConfirm: (initials: string) => void;
  accent?: string;
  /** Smaller slots for tight overlays (standalone TD result card). */
  compact?: boolean;
}

export function InitialsEntry({ initial, onConfirm, accent = '#FFD23F', compact = false }: InitialsEntryProps) {
  const [letters, setLetters] = useState<string[]>(() => {
    const s = (initial || 'AAA').toUpperCase().padEnd(3, 'A').slice(0, 3).split('');
    return s.map(c => (ALPHABET.includes(c) ? c : 'A'));
  });
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);

  const cycle = useCallback((slot: number, dir: 1 | -1) => {
    setLetters(prev => {
      const next = [...prev];
      const idx = ALPHABET.indexOf(next[slot]);
      next[slot] = ALPHABET[(idx + dir + ALPHABET.length) % ALPHABET.length];
      return next;
    });
    uiSfx('select');
  }, []);

  const confirm = useCallback(() => {
    if (done) return;
    setDone(true);
    uiSfx('confirm');
    onConfirm(letters.join(''));
  }, [done, letters, onConfirm]);

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      let handled = true;
      if (k === 'ArrowUp') cycle(cursor, 1);
      else if (k === 'ArrowDown') cycle(cursor, -1);
      else if (k === 'ArrowLeft') { setCursor(c => Math.max(0, c - 1)); uiSfx('hover'); }
      else if (k === 'ArrowRight') { setCursor(c => Math.min(2, c + 1)); uiSfx('hover'); }
      else if (k === 'Enter') confirm();
      else if (k === 'Backspace') { setCursor(c => Math.max(0, c - 1)); uiSfx('back'); }
      else if (k.length === 1 && ALPHABET.includes(k.toUpperCase())) {
        const ch = k.toUpperCase();
        setLetters(prev => { const n = [...prev]; n[cursor] = ch; return n; });
        setCursor(c => Math.min(2, c + 1));
        uiSfx('select');
      } else handled = false;
      if (handled) { e.preventDefault(); e.stopPropagation(); }
    };
    // Capture phase so the letter keys don't also reach page-level shortcuts.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [cursor, cycle, confirm, done]);

  const slotW = compact ? 'w-8 h-10 text-[16px]' : 'w-12 h-14 text-[22px]';

  return (
    <div className="flex flex-col items-center gap-2" data-testid="initials-entry">
      <p className="text-[8px] tracking-[0.3em]" style={{ color: accent }}>
        ENTER YOUR INITIALS
      </p>
      <div className="flex items-center gap-2">
        {letters.map((ch, i) => {
          const active = i === cursor && !done;
          return (
            <div key={i} className="flex flex-col items-center">
              <button
                type="button"
                aria-label={`Next letter for slot ${i + 1}`}
                onClick={() => { setCursor(i); cycle(i, 1); }}
                className="text-[8px] leading-none px-2 py-1 text-gray-400 hover:text-white"
                style={{ visibility: done ? 'hidden' : 'visible' }}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => { setCursor(i); uiSfx('hover'); }}
                data-testid={`initials-slot-${i}`}
                className={`${slotW} flex items-center justify-center border-4 bg-black/60 font-['Press_Start_2P']`}
                style={{
                  borderColor: active ? accent : '#3a3a55',
                  color: active ? accent : '#ffffff',
                  boxShadow: active ? `0 0 12px ${accent}88` : '3px 3px 0 0 #000',
                  animation: active ? 'hs-slot-blink 900ms step-end infinite' : 'none',
                }}
              >
                {ch}
              </button>
              <button
                type="button"
                aria-label={`Previous letter for slot ${i + 1}`}
                onClick={() => { setCursor(i); cycle(i, -1); }}
                className="text-[8px] leading-none px-2 py-1 text-gray-400 hover:text-white"
                style={{ visibility: done ? 'hidden' : 'visible' }}
              >
                ▼
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={confirm}
          disabled={done}
          data-testid="initials-confirm"
          className="ml-2 px-3 py-2 border-4 border-black text-[10px] text-black font-['Press_Start_2P'] shadow-[3px_3px_0_0_#000] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          OK
        </button>
      </div>
      {!compact && (
        <p className="text-[7px] text-gray-500 tracking-wide">▲▼ LETTER &bull; ◀▶ MOVE &bull; ENTER TO SAVE</p>
      )}
      <style>{`@keyframes hs-slot-blink{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    </div>
  );
}
