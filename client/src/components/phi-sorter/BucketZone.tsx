import { useEffect, useRef, useState } from 'react';

export type BucketZoneProps = {
  bucketType: 'phi' | 'not_phi';
  /** True ONLY when this specific bucket is the active target.
   *  Parent computes: hoveredBucket === bucketType || draggingOverBucket === bucketType
   *  This means during mouse drag, ONLY the bucket under the cursor highlights (W2 fix). */
  isHovered: boolean;
  feedbackState: 'idle' | 'correct' | 'incorrect';
  onDragEnter: (bucketType: 'phi' | 'not_phi') => void;  // Sets per-bucket dragging state (W2)
  onDragLeave: (bucketType: 'phi' | 'not_phi') => void;
  onDrop: (bucketType: 'phi' | 'not_phi') => void;
  /** Running count of items dropped into this bucket (Phase 23 — SORTV2-08).
   *  Optional so PHISorterOverlay compiles unchanged until Plan 02 wires it. */
  count?: number;
};

type ParticleBurst = {
  id: number;
  color: string;
};

// 8 fixed directions (45° apart) with alternating radii for a pixel-art starburst
const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315].map(
  (deg) => (deg * Math.PI) / 180,
);
const PARTICLE_RADII = [44, 60, 44, 60, 44, 60, 44, 60]; // alternating px

/**
 * A drop target zone for the PHI Sorter encounter.
 *
 * Per-bucket onDragEnter/onDragLeave let the parent track which specific bucket
 * the cursor is over (draggingOverBucket state). This prevents both buckets from
 * highlighting simultaneously during a mouse drag (W2 fix).
 *
 * feedbackState drives CSS animation:
 *   'correct'   → animate-[flash-green_0.4s_ease-out] (from index.css keyframes)
 *   'incorrect' → animate-[shake-red_0.5s_ease-out]
 *   'idle'      → no animation class
 *
 * Phase 23 additions (SORTV2-07, SORTV2-08):
 *   - Running counter with bounce animation on increment
 *   - 8-particle DOM burst on feedbackState transitions (green=correct, red=incorrect)
 *   Both effects are additive to and independent of the existing flash-green/shake-red feedback.
 */
export function BucketZone({
  bucketType,
  isHovered,
  feedbackState,
  onDragEnter,
  onDragLeave,
  onDrop,
  count = 0,
}: BucketZoneProps) {
  const isPHI = bucketType === 'phi';
  const label = isPHI ? 'PHI' : 'NOT PHI';
  const sublabel = isPHI ? 'Protected — Redact' : 'Safe to Share';
  const keyHint = isPHI ? 'PRESS →' : 'PRESS ←';
  const counterLabel = isPHI ? `${count} REDACTED` : `${count} KEPT`;
  const counterTestId = isPHI ? 'bucket-counter-phi' : 'bucket-counter-not_phi';

  const baseColor = isPHI ? 'border-[#FF6B9D]' : 'border-[#2ECC71]';
  const labelColor = isPHI ? 'text-[#FF6B9D]' : 'text-[#2ECC71]';

  const animationClass =
    feedbackState === 'correct'
      ? 'animate-[flash-green_0.4s_ease-out]'
      : feedbackState === 'incorrect'
        ? 'animate-[shake-red_0.5s_ease-out]'
        : '';

  // ── Counter bounce (SORTV2-08) ────────────────────────────────────────────
  const prevCountRef = useRef(count);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (count > prevCountRef.current) {
      setBouncing(true);
      const t = setTimeout(() => setBouncing(false), 350);
      prevCountRef.current = count;
      return () => clearTimeout(t);
    }
    prevCountRef.current = count;
  }, [count]);

  // ── Particle bursts (SORTV2-07) ───────────────────────────────────────────
  const prevFeedbackRef = useRef<'idle' | 'correct' | 'incorrect'>('idle');
  const [bursts, setBursts] = useState<ParticleBurst[]>([]);

  useEffect(() => {
    const prev = prevFeedbackRef.current;
    prevFeedbackRef.current = feedbackState;

    if (prev === 'idle' && (feedbackState === 'correct' || feedbackState === 'incorrect')) {
      const burst: ParticleBurst = {
        id: Date.now(),
        color: feedbackState === 'correct' ? '#2ECC71' : '#EF4444',
      };
      setBursts((prev) => [...prev, burst]);
      const t = setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burst.id));
      }, 600);
      return () => clearTimeout(t);
    }
  }, [feedbackState]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}                               // REQUIRED for HTML5 drop targets
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(bucketType); }}
      onDragLeave={(e) => { e.preventDefault(); onDragLeave(bucketType); }}
      onDrop={(e) => { e.preventDefault(); onDrop(bucketType); }}
      className={[
        'relative overflow-visible',
        'flex flex-col items-center justify-center',
        'min-h-[180px] w-full p-6 border-4',
        baseColor,
        'bg-[#1a1a2e]/80',
        isHovered ? 'ring-4 ring-white/70 scale-[1.02]' : '',
        animationClass,
        'transition-transform duration-150',
      ].join(' ')}
      data-testid={`bucket-${bucketType}`}
    >
      <div
        className={`mb-2 ${labelColor}`}
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
      >
        {label}
      </div>
      <div
        className="text-white/70 mb-1"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
      >
        {sublabel}
      </div>

      {/* Running counter — Phase 23 SORTV2-08 */}
      <div
        className={[
          labelColor,
          bouncing ? 'animate-[counter-bounce_0.35s_ease-out]' : '',
        ].join(' ')}
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
        data-testid={counterTestId}
      >
        {counterLabel}
      </div>

      <div
        className="text-white/50 mt-3"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
      >
        {keyHint}
      </div>

      {/* Particle bursts — Phase 23 SORTV2-07 */}
      <div data-testid="bucket-particles">
        {bursts.map((burst) =>
          PARTICLE_ANGLES.map((angle, i) => {
            const r = PARTICLE_RADII[i];
            const dx = Math.cos(angle) * r;
            const dy = Math.sin(angle) * r;
            return (
              <span
                key={`${burst.id}-${i}`}
                style={
                  {
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '6px',
                    height: '6px',
                    backgroundColor: burst.color,
                    pointerEvents: 'none',
                    animation: 'sorter-particle 0.5s ease-out forwards',
                    '--dx': `${dx}px`,
                    '--dy': `${dy}px`,
                  } as React.CSSProperties
                }
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
