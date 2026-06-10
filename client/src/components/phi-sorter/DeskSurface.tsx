/**
 * DeskSurface — Phase 24 (SORTV2-14)
 *
 * Wood-grain CSS desk container for the Papers-Please-style PHI Sorter format.
 * Pure presentational — no game state, no EventBridge, no timers.
 *
 * Children (ShiftClock, OutgoingTray, DeskDocument, StampPad) compose inside
 * and are positioned by the parent overlay layout.
 */
export function DeskSurface({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative border-4 border-[#3d2817] overflow-visible"
      style={{
        background: [
          // Warm wood base
          '#6B4A2F',
          // Plank seams — horizontal repeating
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 48px)',
          // Subtle wood grain — vertical
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
