/**
 * IdentifierGetBanner — the Zelda item-get beat for The Eighteen codex.
 *
 * Compact, non-blocking banner: slides in top-center, names the identifier
 * just logged (#7 SOCIAL SECURITY NUMBERS), shows codex progress, and gets a
 * gold COMPLETE variant for the eighteenth find. Parent owns the timer and the
 * SFX; this renders one moment.
 *
 * Used by the PHI Sorter and the break-room corkboard — anywhere an identifier
 * is caught in the wild.
 */

import type { Phi18Entry } from '@/data/phi18';
import { PHI18_TOTAL } from '@/data/phi18';

export type IdentifierGetBannerProps = {
  entry: Phi18Entry;
  /** Codex count AFTER this find. */
  count: number;
  /** Vertical offset in px (default 56). The sorter passes a lower offset so the
   *  banner clears the NPC reaction bubble that owns the top of that overlay. */
  topPx?: number;
};

export function IdentifierGetBanner({ entry, count, topPx = 56 }: IdentifierGetBannerProps) {
  const complete = count >= PHI18_TOTAL;
  const accent = complete ? '#FFD93D' : '#7FE5C0';

  return (
    <div
      className="absolute left-1/2 z-[55] pointer-events-none border-4 px-4 py-2 flex items-center gap-3"
      style={{
        top: `${topPx}px`,
        borderColor: accent,
        backgroundColor: complete ? 'rgba(42,34,0,0.96)' : 'rgba(10,32,24,0.96)',
        boxShadow: `0 0 30px ${accent}44`,
        animation: 'identifier-banner-in 0.35s ease-out',
        transform: 'translateX(-50%)',
      }}
      data-testid="identifier-get-banner"
    >
      <span style={{ fontSize: '22px', lineHeight: '1' }}>{entry.icon}</span>
      <span>
        <span
          className="block"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: accent }}
        >
          {complete ? '★ THE EIGHTEEN — COMPLETE! ★' : `LOGGED TO THE EIGHTEEN · ${count}/${PHI18_TOTAL}`}
        </span>
        <span
          className="block text-white mt-1"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
        >
          #{entry.num} {entry.name}
        </span>
        {complete && (
          <span
            className="block text-white/80 mt-1"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
          >
            SAFE HARBOR CERTIFIED — PRESS [I]
          </span>
        )}
      </span>
    </div>
  );
}
