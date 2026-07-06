/**
 * DeskSurface — Phase 24 (SORTV2-14)
 *
 * CSS desk container for the Papers-Please-style PHI Sorter format.
 * Pure presentational — no game state, no EventBridge, no timers.
 *
 * HIPAA-is-the-game pass: the surface re-skins per station (SorterStation
 * colors) so Reception / Lab / Records read as three different desks —
 * warm intake wood, cool lab steel, archival records green.
 *
 * Children (ShiftClock, OutgoingTray, DeskDocument, StampPad) compose inside
 * and are positioned by the parent overlay layout.
 */
export function DeskSurface({
  children,
  base = '#6B4A2F',
  edge = '#3d2817',
}: {
  children: React.ReactNode;
  base?: string;
  edge?: string;
}) {
  return (
    <div
      className="relative border-4 overflow-visible"
      style={{
        borderColor: edge,
        background: [
          // Station base material
          base,
          // Plank/panel seams — horizontal repeating
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 48px)',
          // Subtle grain — vertical
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 3px, transparent 3px 7px)',
          // Top-edge light strip for depth
          'linear-gradient(180deg, rgba(255,255,255,0.06) 0px, transparent 12px)',
        ].join(', '),
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -2px 6px rgba(0,0,0,0.3)',
        fontFamily: '"Press Start 2P", monospace',
      }}
      data-testid="sorter-desk-surface"
    >
      {children}
    </div>
  );
}
