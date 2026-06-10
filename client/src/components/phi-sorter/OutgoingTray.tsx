import { useEffect, useRef, useState } from 'react';

/**
 * OutgoingTray — Phase 24 (SORTV2-13)
 *
 * Stacked-paper tray visual for KEEP or REDACT buckets in the desk-format sorter.
 * Fills visibly as count grows — up to 5 visible paper rectangles stacked above the base.
 * Counter bounces on increment (ports BucketZone prevCountRef + setBouncing pattern verbatim).
 *
 * Purely presentational — parent owns counts and state.
 */
export type OutgoingTrayProps = {
  kind: 'keep' | 'redact';
  count: number;
};

export function OutgoingTray({ kind, count }: OutgoingTrayProps) {
  const isKeep = kind === 'keep';
  const label = isKeep ? 'KEEP' : 'REDACT';
  const kindColor = isKeep ? '#2ECC71' : '#FF6B9D';
  const kindColorClass = isKeep ? 'text-[#2ECC71]' : 'text-[#FF6B9D]';

  // ── Counter bounce — ports BucketZone pattern verbatim ───────────────────
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

  // ── Stacked-paper visuals — up to 5 sheets ───────────────────────────────
  const visibleSheets = Math.min(count, 5);
  const sheets = Array.from({ length: visibleSheets }, (_, i) => i);
  // Alternating left/right offsets for organic stack feel
  const offsetX = [0, -1, 1, -2, 2];

  return (
    <div
      className="flex flex-col items-center"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
      data-testid={`sorter-tray-${kind}`}
    >
      {/* Paper stack (renders above tray base) */}
      <div className="relative flex flex-col items-center mb-1" style={{ minHeight: '40px' }}>
        {sheets.map((_, i) => (
          <div
            key={i}
            className="absolute border border-[#8a7a5a]"
            style={{
              width: '56px',
              height: '8px',
              backgroundColor: '#F5EFD9',
              // Stack upward: higher indices sit higher visually
              bottom: `${i * 3}px`,
              left: `calc(50% + ${offsetX[i]}px)`,
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>

      {/* Tray base */}
      <div
        className="border-4 px-3 py-2 text-center"
        style={{
          borderColor: kindColor,
          backgroundColor: '#1a1a2e',
          minWidth: '72px',
        }}
      >
        {/* Tray label */}
        <div
          className={kindColorClass}
          style={{ fontSize: '10px', marginBottom: '4px' }}
        >
          {label}
        </div>

        {/* Count — bounces on increment */}
        <div
          className={[
            count === 0 ? 'text-white/40' : kindColorClass,
            bouncing ? 'animate-[counter-bounce_0.35s_ease-out]' : '',
          ].join(' ')}
          style={{ fontSize: '9px' }}
        >
          &times;{count}
        </div>
      </div>
    </div>
  );
}
