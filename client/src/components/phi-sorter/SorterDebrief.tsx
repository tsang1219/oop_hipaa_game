/**
 * SorterDebrief — Sorter-themed completion screen for the PHI Sorter encounter.
 *
 * Replaces the (TD-themed) EncounterDebrief for PHI Sorter completions.
 * Phase 16 originally reused EncounterDebrief and bolted SorterTakeawaysPanel
 * on as a sibling, which produced an incoherent "NETWORK SECURED + TD takeaways
 * + sorter takeaways" closeout. This component owns the sorter closeout end-to-end.
 */

import { useEffect, useState } from 'react';

export type SorterDebriefProps = {
  encounterId: string;
  correctCount: number;
  totalCount: number;
  scoreContribution: number;  // 0..12
  takeaways: string[];
  locationLabel?: string;     // e.g., "RECEPTION", "LAB" — drives the close button text
  onDismiss: () => void;
};

export function SorterDebrief({
  correctCount,
  totalCount,
  scoreContribution,
  takeaways,
  locationLabel,
  onDismiss,
}: SorterDebriefProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const accuracyPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isStrong = accuracyPct >= 80;
  const isPassing = accuracyPct >= 60;

  const headerText = isStrong ? 'DOCUMENTS SORTED' : isPassing ? 'NICE WORK' : 'KEEP PRACTICING';
  const headerColor = isStrong ? 'text-[#7FE5C0]' : isPassing ? 'text-[#FFD27F]' : 'text-[#FF9D7F]';
  const headerBg = isStrong
    ? 'bg-[#1a3a2e]/80 border-[#7FE5C0]/50'
    : isPassing
    ? 'bg-[#3a2e1a]/80 border-[#FFD27F]/50'
    : 'bg-[#3a1f1a]/80 border-[#FF9D7F]/50';
  const barColor = isStrong ? 'bg-[#7FE5C0]' : isPassing ? 'bg-[#FFD27F]' : 'bg-[#FF9D7F]';
  const borderColor = isStrong
    ? 'border-[#7FE5C0]/60'
    : isPassing
    ? 'border-[#FFD27F]/60'
    : 'border-[#FF9D7F]/60';

  const buttonLabel = locationLabel ? `BACK TO ${locationLabel.toUpperCase()}` : 'BACK TO HOSPITAL';

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/85' : 'bg-black/0'
      }`}
      data-testid="sorter-debrief"
    >
      <div
        className={`max-w-lg w-full mx-4 border-2 ${borderColor} bg-[#0f1419]/95 shadow-[0_0_40px_rgba(127,229,192,0.1)] transform transition-all duration-400 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className={`${headerBg} border-b px-4 py-3 flex items-center gap-3`}>
          <span className="text-2xl">{isStrong ? '\u{1F4DA}' : isPassing ? '\u{1F4DD}' : '\u{1F50D}'}</span>
          <h2
            className={`text-sm ${headerColor} tracking-wider`}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
            data-testid="sorter-debrief-header"
          >
            {headerText}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Sorting accuracy bar */}
          <div>
            <p
              className="text-gray-400 mb-2"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              SORTING ACCURACY
            </p>
            <div className="w-full h-4 bg-gray-800 border border-gray-600 overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                style={{ width: `${accuracyPct}%` }}
              />
            </div>
            <p
              className="text-right text-gray-400 mt-1"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
              data-testid="sorter-debrief-accuracy"
            >
              {correctCount} / {totalCount} correct &middot; {accuracyPct}%
            </p>
          </div>

          {/* Score contribution */}
          {scoreContribution > 0 && (
            <p
              className="text-[#7FE5C0]"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
              data-testid="sorter-debrief-score"
            >
              + {scoreContribution} to Compliance Score
            </p>
          )}

          {/* Takeaways */}
          {takeaways && takeaways.length > 0 && (
            <div>
              <p
                className="text-gray-400 mb-3"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
              >
                KEY LEARNINGS
              </p>
              <ul className="space-y-2.5">
                {takeaways.map((takeaway, i) => (
                  <li
                    key={i}
                    className="text-gray-200 flex gap-2"
                    style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '1.4' }}
                  >
                    <span className="text-[#7FE5C0] flex-shrink-0">&bull;</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            onClick={onDismiss}
            data-testid="button-sorter-debrief-dismiss"
            className="w-full py-3 bg-[#1f3a4a] hover:bg-[#2a4f63] border-2 border-[#4FB3D9]/60 text-white transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
