import { useEffect, useRef, useState } from 'react';
import type { SorterItem as SorterItemData } from '@/data/sorterData';
import type { StampKind } from './StampPad';

/**
 * DeskDocument — Phase 24 (SORTV2-12)
 *
 * One-at-a-time paper patient chart rendered on a physical desk surface.
 * Inverted from the dark SorterItem card — cream paper on a warm desk.
 *
 * Animation contract (four states):
 *   'entering'  → doc-slide-in 300ms
 *   'active'    → no animation (idle on desk)
 *   'stamped'   → flash-green (correct) / shake-red (incorrect) / nothing (null)
 *   'exiting'   → doc-slide-off-left (keep) / doc-slide-off-right (redact)
 *
 * Ink mark: renders when stampedKind is non-null (stamped + exiting).
 *   Deterministic rotation per item: ((id.length * 7) % 13) - 6 degrees.
 *
 * Ink-splatter burst: 8 particles fire on entering 'stamped' state.
 *   Color = stamp identity (Papers Please convention: ink color is stamp color, not correctness).
 *   Correctness signaled separately by flash-green/shake-red + SFX + toast.
 *
 * Purely presentational — no EventBridge, no timers that outlive unmount.
 */
export type DocAnimState = 'entering' | 'active' | 'stamped' | 'exiting';

export type DeskDocumentProps = {
  item: SorterItemData;
  animState: DocAnimState;
  stampedKind: StampKind | null;
  /** Drives flash-green / shake-red during 'stamped'. Null = no correctness animation. */
  wasCorrect: boolean | null;
};

// Ports PARTICLE_ANGLES/PARTICLE_RADII from BucketZone.tsx
const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315].map(
  (deg) => (deg * Math.PI) / 180,
);
const PARTICLE_RADII = [30, 42, 30, 42, 30, 42, 30, 42]; // slightly smaller for desk format

/** Deterministic rotation per item: stable across replays, organic look */
function getInkRot(id: string): number {
  return ((id.length * 7) % 13) - 6;
}

/** ChartLine — restyled for cream paper (dark text, warm label color) */
function ChartLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1" style={{ fontSize: '8px', lineHeight: '1.6' }}>
      <span style={{ color: '#8a6d3b' }}>{label}:</span>{' '}
      <span style={{ color: '#2a2a3e' }}>{value}</span>
    </div>
  );
}

export function DeskDocument({ item, animState, stampedKind, wasCorrect }: DeskDocumentProps) {
  const { chart } = item;

  // ── Animation class by state ─────────────────────────────────────────────
  const getAnimClass = (): string => {
    switch (animState) {
      case 'entering':
        return 'animate-[doc-slide-in_0.3s_ease-out]';
      case 'active':
        return '';
      case 'stamped':
        if (wasCorrect === true) return 'animate-[flash-green_0.4s_ease-out]';
        if (wasCorrect === false) return 'animate-[shake-red_0.5s_ease-out]';
        return '';
      case 'exiting':
        return stampedKind === 'keep'
          ? 'animate-[doc-slide-off-left_0.3s_ease-in_forwards]'
          : 'animate-[doc-slide-off-right_0.3s_ease-in_forwards]';
      default:
        return '';
    }
  };

  // ── Ink-splatter burst — fires on entering 'stamped' ────────────────────
  const prevAnimStateRef = useRef<DocAnimState>('entering');
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    const prev = prevAnimStateRef.current;
    prevAnimStateRef.current = animState;

    if (prev !== 'stamped' && animState === 'stamped' && stampedKind !== null) {
      // Spawn 8 particles
      setParticles([Date.now()]);
      const t = setTimeout(() => setParticles([]), 600);
      return () => clearTimeout(t);
    }
  }, [animState, stampedKind]);

  const inkColor = stampedKind === 'keep' ? '#2ECC71' : '#FF6B9D';
  const inkRot = getInkRot(item.id);

  return (
    <div
      className={[
        'relative mx-auto border-4 border-[#b8a87e]',
        'shadow-[6px_6px_0px_0px_rgba(0,0,0,0.45)]',
        'px-5 py-4',
        getAnimClass(),
      ].join(' ')}
      style={{
        backgroundColor: '#F5EFD9',
        maxWidth: '420px',
        width: '100%',
        fontFamily: '"Press Start 2P", monospace',
      }}
      data-testid={`sorter-desk-doc-${item.id}`}
    >
      {/* Paper header */}
      <div
        className="mb-3 pb-2 border-b-2 border-[#b8a87e]"
        style={{ fontSize: '8px', color: '#6B4A2F', letterSpacing: '0.05em' }}
      >
        PATIENT CHART
      </div>

      {/* Patient name + age */}
      <div
        className="mb-2"
        style={{ fontSize: '11px', color: '#1a1a2e' }}
      >
        {chart.patientName}
        {chart.age !== undefined ? `, ${chart.age}` : ''}
      </div>

      {/* Optional chart fields — same order as SorterItem.tsx */}
      {chart.role && <ChartLine label="Role" value={chart.role} />}
      {chart.reasonForVisit && <ChartLine label="Reason" value={chart.reasonForVisit} />}
      {chart.emergencyContact && <ChartLine label="Emergency Contact" value={chart.emergencyContact} />}
      {chart.doctorNote && <ChartLine label="Doctor's Note" value={chart.doctorNote} />}
      {chart.miscField && <ChartLine label={chart.miscField.label} value={chart.miscField.value} />}

      {/* Ink mark — visible during 'stamped' and 'exiting' */}
      {stampedKind !== null && (
        <div
          className="absolute animate-[ink-stamp-in_0.15s_ease-out_forwards]"
          style={{
            top: '30%',
            right: '12%',
            transform: `rotate(${inkRot}deg)`,
            border: `4px double ${inkColor}`,
            padding: '6px 10px',
            color: inkColor,
            fontSize: '16px',
            pointerEvents: 'none',
            // CSS custom property for the keyframe's rotation (if keyframe uses --ink-rot)
            ['--ink-rot' as string]: `${inkRot}deg`,
          } as React.CSSProperties}
          data-testid="sorter-ink-mark"
        >
          {stampedKind === 'keep' ? 'KEEP' : 'REDACT'}
        </div>
      )}

      {/* Ink-splatter burst — ink-colored particles at 8 angles */}
      {particles.length > 0 && (
        <div data-testid="sorter-ink-particles">
          {PARTICLE_ANGLES.map((angle, i) => {
            const r = PARTICLE_RADII[i];
            const dx = Math.cos(angle) * r;
            const dy = Math.sin(angle) * r;
            return (
              <span
                key={i}
                style={
                  {
                    position: 'absolute',
                    left: '65%',       // near ink mark center-right
                    top: '35%',
                    width: '5px',
                    height: '5px',
                    backgroundColor: inkColor,
                    pointerEvents: 'none',
                    animation: 'sorter-particle 0.5s ease-out forwards',
                    '--dx': `${dx}px`,
                    '--dy': `${dy}px`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
