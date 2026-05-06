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
};

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
 */
export function BucketZone({
  bucketType,
  isHovered,
  feedbackState,
  onDragEnter,
  onDragLeave,
  onDrop,
}: BucketZoneProps) {
  const isPHI = bucketType === 'phi';
  const label = isPHI ? 'PHI' : 'NOT PHI';
  const sublabel = isPHI ? 'Protected — Redact' : 'Safe to Share';
  const keyHint = isPHI ? 'PRESS →' : 'PRESS ←';

  const baseColor = isPHI ? 'border-[#FF6B9D]' : 'border-[#2ECC71]';
  const labelColor = isPHI ? 'text-[#FF6B9D]' : 'text-[#2ECC71]';

  const animationClass =
    feedbackState === 'correct'
      ? 'animate-[flash-green_0.4s_ease-out]'
      : feedbackState === 'incorrect'
        ? 'animate-[shake-red_0.5s_ease-out]'
        : '';

  return (
    <div
      onDragOver={(e) => e.preventDefault()}                               // REQUIRED for HTML5 drop targets
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(bucketType); }}
      onDragLeave={(e) => { e.preventDefault(); onDragLeave(bucketType); }}
      onDrop={(e) => { e.preventDefault(); onDrop(bucketType); }}
      className={[
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
      <div
        className="text-white/50 mt-3"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
      >
        {keyHint}
      </div>
    </div>
  );
}
