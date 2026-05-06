import { useEffect } from 'react';

export type SorterContextCardProps = {
  title: string;
  body: string;
  onConfirm: () => void;
};

/**
 * Pre-encounter narrative card for the PHI Sorter encounter.
 *
 * Rendered by UnifiedGamePage during encounterPhase === 'narrative-card' for phi-sorter type.
 * The PHISorterOverlay does NOT render this — it starts directly in 'sorting' phase.
 *
 * Palette: calm blue/teal — intentionally distinct from NarrativeContextCard's red SECURITY ALERT aesthetic.
 * The PHI Sorter is a friendly forms-handoff moment (Riley, lab tech, records clerk), not a threat alert.
 */
export function SorterContextCard({ title, body, onConfirm }: SorterContextCardProps) {
  // Enter/Space confirms — keyboard-first, no mouse required
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onConfirm]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
      data-testid="sorter-context-card"
    >
      <div className="max-w-xl w-[90%] bg-[#1a2a3e] border-4 border-[#4FB3D9] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <div
          className="text-[#4FB3D9] mb-3"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
        >
          {title}
        </div>
        <div
          className="text-white leading-relaxed mb-6 whitespace-pre-wrap"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', lineHeight: '1.8' }}
        >
          {body}
        </div>
        <button
          onClick={onConfirm}
          className="bg-[#4FB3D9] hover:bg-[#7ECDE8] text-[#1a1a2e] px-6 py-3 border-4 border-black transition-colors"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          data-testid="button-sorter-context-confirm"
        >
          GOT IT [ENTER]
        </button>
      </div>
    </div>
  );
}
