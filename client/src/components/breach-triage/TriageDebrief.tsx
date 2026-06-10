/**
 * TriageDebrief — Triage completion screen.
 *
 * Clones SorterDebrief's visual structure with triage-specific headers and an
 * additional "AVG RESPONSE" stat row. Entrance animation, accuracy bar with
 * band colors at 80/60 thresholds, +N COMPLIANCE score line, KEY LEARNINGS list,
 * close button "BACK TO {locationLabel ?? 'THE ER'}".
 *
 * Header bands:
 *   ≥ 80%  → "QUEUE CLEARED"   (green)
 *   60-79% → "SHIFT SURVIVED"  (yellow)
 *   < 60%  → "OCR IS CALLING"  (red)
 *
 * Visual language: Press Start 2P font, 4px borders, dark backgrounds — sorter family.
 * Inline style only for font-family/font-size (same pattern as SorterDebrief).
 */

import { useEffect, useState } from 'react';

export type TriageDebriefProps = {
  encounterId: string;
  correctCount: number;
  totalCount: number;
  avgResponseMs: number;
  scoreContribution: number;    // 0..12
  takeaways: string[];
  locationLabel?: string;       // drives close button text, e.g. "THE ER"
  onDismiss: () => void;
};

export function TriageDebrief({
  correctCount,
  totalCount,
  avgResponseMs,
  scoreContribution,
  takeaways,
  locationLabel,
  onDismiss,
}: TriageDebriefProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const accuracyPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isStrong = accuracyPct >= 80;
  const isPassing = accuracyPct >= 60;

  // Band-specific labels
  const headerText = isStrong ? 'QUEUE CLEARED' : isPassing ? 'SHIFT SURVIVED' : 'OCR IS CALLING';
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

  const avgResponseSec = (avgResponseMs / 1000).toFixed(1);
  const buttonLabel = locationLabel ? `BACK TO ${locationLabel.toUpperCase()}` : 'BACK TO THE ER';

  // Header icon by band
  const headerIcon = isStrong ? '🏥' : isPassing ? '📋' : '📞';

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/85' : 'bg-black/0'
      }`}
      data-testid="triage-debrief"
    >
      <div
        className={`max-w-lg w-full mx-4 border-2 ${borderColor} bg-[#0f1419]/95 shadow-[0_0_40px_rgba(127,229,192,0.1)] transform transition-all duration-400 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className={`${headerBg} border-b px-4 py-3 flex items-center gap-3`}>
          <span className="text-2xl">{headerIcon}</span>
          <h2
            className={`text-sm ${headerColor} tracking-wider`}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
            data-testid="triage-debrief-header"
          >
            {headerText}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Triage accuracy bar */}
          <div>
            <p
              className="text-gray-400 mb-2"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              TRIAGE ACCURACY
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
              data-testid="triage-debrief-accuracy"
            >
              {correctCount} / {totalCount} correct &middot; {accuracyPct}%
            </p>
          </div>

          {/* Triage-specific stat: avg response time */}
          <div className="flex items-center justify-between border border-gray-700 bg-[#1a1a2e]/60 px-3 py-2">
            <p
              className="text-gray-400"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              AVG RESPONSE
            </p>
            <p
              className="text-white"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
              data-testid="triage-debrief-avg-response"
            >
              {avgResponseMs > 0 ? `${avgResponseSec}s` : 'N/A'}
            </p>
          </div>

          {/* Score contribution */}
          {scoreContribution > 0 && (
            <p
              className="text-[#7FE5C0]"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
              data-testid="triage-debrief-score"
            >
              + {scoreContribution} COMPLIANCE SCORE
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
              <ul className="space-y-3">
                {takeaways.map((takeaway, i) => (
                  <li
                    key={i}
                    className="text-gray-300 flex gap-2"
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', lineHeight: '1.7' }}
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
            data-testid="button-triage-debrief-dismiss"
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
