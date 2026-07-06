/**
 * Phi18Codex — "The Eighteen" collection wall (HIPAA-is-the-game pass).
 *
 * Full-screen overlay listing all 18 Safe Harbor identifiers as collectible
 * slots. Found identifiers show icon + number + name; locked slots show ???.
 * Hover/click a slot to read its one-liner in the detail strip.
 *
 * The frame is the teaching: remove all 18 → the data stops being PHI. That's
 * the actual §164.514(b)(2) Safe Harbor method, played as a collection quest.
 *
 * Opened with [I] during exploration (or the HUD chip). Esc / I / button closes.
 * Complete set → gold treatment + SAFE HARBOR CERTIFIED banner.
 */

import { useEffect, useMemo, useState } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import { PHI18_ENTRIES, PHI18_TOTAL, phi18Count, type Phi18Entry } from '@/data/phi18';

export type Phi18CodexProps = {
  foundKeys: string[];
  /** Key of the most recently logged identifier — gets the unlock pop animation. */
  recentKey?: string | null;
  onClose: () => void;
};

export function Phi18Codex({ foundKeys, recentKey, onClose }: Phi18CodexProps) {
  const found = useMemo(() => new Set(foundKeys), [foundKeys]);
  const count = phi18Count(foundKeys);
  const complete = count >= PHI18_TOTAL;

  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Phi18Entry | null>(() => {
    if (recentKey) return PHI18_ENTRIES.find((e) => e.key === recentKey) ?? null;
    return PHI18_ENTRIES.find((e) => found.has(e.key)) ?? null;
  });

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4, rate: 1.1 });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const accent = complete ? '#FFD93D' : '#4FB3D9';

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/85' : 'bg-black/0'
      }`}
      data-testid="phi18-codex"
    >
      <div
        className={`max-w-2xl w-[94%] border-4 bg-[#10182a] transform transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}
        style={{ borderColor: accent, boxShadow: `0 0 50px ${accent}2e` }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b-2" style={{ borderBottomColor: `${accent}55` }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '13px', color: accent }}>
              THE EIGHTEEN
            </h2>
            <span
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}
              className={complete ? 'text-[#FFD93D]' : 'text-white'}
              data-testid="phi18-count"
            >
              {count}/{PHI18_TOTAL}
            </span>
          </div>
          <p className="text-white/70 mt-2" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.4' }}>
            Safe Harbor's checklist: remove all 18 identifier types and health data stops being PHI.
            Log each one you catch in the wild.
          </p>
          {/* Progress bar */}
          <div className="w-full h-2 bg-[#0a0a1a] border border-white/15 mt-2 overflow-hidden">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{ width: `${(count / PHI18_TOTAL) * 100}%`, backgroundColor: accent }}
            />
          </div>
        </div>

        {/* Complete banner */}
        {complete && (
          <div
            className="mx-5 mt-3 border-2 border-[#FFD93D] bg-[#2a2200] px-3 py-2 text-center"
            data-testid="phi18-complete-banner"
          >
            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }} className="text-[#FFD93D]">
              ★ SAFE HARBOR CERTIFIED — YOU CAN DE-IDENTIFY A DATASET ★
            </span>
          </div>
        )}

        {/* Slots — 3 columns × 6 rows, names always visible */}
        <div className="px-5 py-4 grid grid-cols-3 gap-1.5 max-h-[330px] overflow-y-auto">
          {PHI18_ENTRIES.map((entry) => {
            const isFound = found.has(entry.key);
            const isRecent = recentKey === entry.key;
            const isSelected = selected?.key === entry.key;
            return (
              <button
                key={entry.key}
                onClick={() => setSelected(entry)}
                onMouseEnter={() => setSelected(entry)}
                className={`flex items-center gap-1.5 px-2 py-2 border-2 text-left transition-colors ${
                  isFound
                    ? 'bg-[#14243a] border-[#4FB3D9]/70 hover:border-[#7ECDE8]'
                    : 'bg-[#0b0f1c] border-white/10 hover:border-white/25'
                } ${isSelected ? 'ring-1 ring-white/40' : ''}`}
                style={isRecent ? { animation: 'codex-slot-pop 0.45s ease-out' } : undefined}
                data-testid={`phi18-slot-${entry.num}`}
                data-found={isFound}
              >
                <span style={{ fontSize: '15px', filter: isFound ? 'none' : 'grayscale(1) brightness(0.4)' }}>
                  {entry.icon}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block ${isFound ? 'text-[#FFD93D]' : 'text-white/30'}`}
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
                  >
                    #{entry.num}
                  </span>
                  <span
                    className={`block truncate ${isFound ? 'text-white' : 'text-white/25'}`}
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px', lineHeight: '1.5' }}
                  >
                    {isFound ? entry.name : '???'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail strip — blurb of the hovered/selected identifier */}
        <div className="mx-5 mb-3 min-h-[44px] border border-white/15 bg-[#0b0f1c] px-3 py-2">
          {selected ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.4' }} className="text-white/85">
              <span className="text-[#FFD93D]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}>
                #{selected.num} {found.has(selected.key) ? selected.name : '???'}
              </span>
              {'  —  '}
              {found.has(selected.key) ? selected.blurb : 'Not logged yet. It\'s out there, on some form, waiting.'}
            </p>
          ) : (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }} className="text-white/40">
              Hover an entry to read its file.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <span className="text-white/40" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}>
            45 CFR §164.514(b)(2) · SAFE HARBOR
          </span>
          <button
            onClick={onClose}
            className="bg-[#1f3a4a] hover:bg-[#2a4f63] border-2 border-[#4FB3D9]/60 text-white px-4 py-2 transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            data-testid="phi18-close"
          >
            CLOSE [I]
          </button>
        </div>
      </div>
    </div>
  );
}
