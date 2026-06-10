/**
 * SorterCompletionOverlay — Phase 23 (SORTV2-09)
 *
 * Celebration shown for ~1.2s between the last item drop and SorterDebrief opening.
 * Parent owns timing (~1.2s) and the fanfare SFX; this component renders one frame
 * of celebration — no internal state, no timers.
 *
 * Three accuracy bands:
 *   PERFECT n/n  — 100% accuracy — gold  (#FFD93D)
 *   GOOD         — ≥60% accuracy — green (#2ECC71)
 *   KEEP PRACTICING — <60%      — teal  (#4FB3D9, encouraging — never red)
 *
 * Z-index: z-[60] so it sits above the sorter overlay (z-40) and NPC bubble (z-50).
 * pointer-events: none so underlying elements remain untouched.
 */

export type SorterCompletionOverlayProps = {
  correctCount: number;
  totalCount: number;
};

type CompletionBand = 'perfect' | 'good' | 'practice';

function getBand(correctCount: number, totalCount: number): CompletionBand {
  if (totalCount > 0 && correctCount === totalCount) return 'perfect';
  if (totalCount > 0 && correctCount / totalCount >= 0.6) return 'good';
  return 'practice';
}

const BAND_CONFIG: Record<CompletionBand, { color: string }> = {
  perfect: { color: '#FFD93D' },
  good: { color: '#2ECC71' },
  practice: { color: '#4FB3D9' },
};

/**
 * Presentational completion celebration overlay.
 * Parent (Plan 02) owns the show/hide timer (~1.2s) and triggers the fanfare SFX.
 */
export function SorterCompletionOverlay({ correctCount, totalCount }: SorterCompletionOverlayProps) {
  const band = getBand(correctCount, totalCount);
  const { color } = BAND_CONFIG[band];

  const headerText =
    band === 'perfect'
      ? `PERFECT ${correctCount}/${totalCount}`
      : band === 'good'
        ? 'GOOD'
        : 'KEEP PRACTICING';

  const showSubline = band !== 'perfect';

  return (
    <div
      className="absolute inset-0 z-[60] pointer-events-none flex flex-col items-center justify-center"
      data-testid="sorter-completion-overlay"
      data-band={band}
    >
      {/* Screen-wide band-color flash */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          animation: 'completion-flash 0.6s ease-out forwards',
        }}
      />

      {/* Centered header — scales 0 → overshoot → full */}
      <div className="relative flex flex-col items-center gap-3">
        <div
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '28px',
            color,
            textShadow: '4px 4px 0px rgba(0,0,0,1)',
            animation: 'completion-header-in 0.4s ease-out forwards',
            lineHeight: 1.3,
            textAlign: 'center',
          }}
          data-testid="sorter-completion-header"
        >
          {headerText}
        </div>

        {/* Sub-line: omitted for PERFECT (header already says n/n) */}
        {showSubline && (
          <div
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '10px',
              color: '#ffffff',
              textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            }}
          >
            {correctCount}/{totalCount} CORRECT
          </div>
        )}
      </div>
    </div>
  );
}
