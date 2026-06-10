/**
 * TriageIncidentCard — Single incident slot card.
 *
 * Displays an incident ticket with:
 *   - Slot number badge
 *   - Headline in alarm-amber, detail text below
 *   - Timer bar across the bottom (green > 50%, yellow 25-50%, red + pulse < 25%)
 *   - Gold focus ring when keyboard-focused
 *   - [R] REPORTABLE and [N] NOT REPORTABLE action buttons
 *   - Feedback overlay: correct (green pulse), wrong (red shake), expired ("TOO SLOW" stamp)
 *
 * Visual language: Press Start 2P font, 4px borders, dark panel backgrounds (#1a1a2e / #2a2a3e),
 * matching the sorter family (CLAUDE.md Nintendo Test — every action needs a response).
 */

import type { TriageIncident } from '@/data/triageData';

export type TriageIncidentCardProps = {
  slotNumber: 1 | 2 | 3;
  incident: TriageIncident;
  remainingMs: number;
  totalMs: number;
  focused: boolean;
  feedback: 'correct' | 'wrong' | 'expired' | null;
  onSelect: () => void;
  onClassify: (reportable: boolean) => void;
};

export function TriageIncidentCard({
  slotNumber,
  incident,
  remainingMs,
  totalMs,
  focused,
  feedback,
  onSelect,
  onClassify,
}: TriageIncidentCardProps) {
  const pct = totalMs > 0 ? Math.min(1, remainingMs / totalMs) : 0;

  // Timer bar color thresholds
  const timerColor =
    pct > 0.5
      ? 'bg-[#22c55e]'
      : pct > 0.25
      ? 'bg-[#fbbf24]'
      : 'bg-[#ef4444]';

  const timerPulse = pct <= 0.25 ? 'animate-pulse' : '';

  // Feedback overlay classes
  const feedbackOverlay =
    feedback === 'correct'
      ? 'animate-[flash-green_0.4s_ease-out]'
      : feedback === 'wrong'
      ? 'animate-[shake-red_0.5s_ease-out]'
      : null;

  // Card border: gold when focused, red when expired, default dark-blue
  const borderClass =
    focused
      ? 'border-[#fbbf24] ring-4 ring-yellow-400'
      : feedback === 'expired'
      ? 'border-[#ef4444]'
      : 'border-[#3a3a5e]';

  // Card background dims slightly on expiry
  const bgClass = feedback === 'expired' ? 'bg-[#2a1a1a]' : 'bg-[#1a1a2e]';

  return (
    <div
      className={`relative flex flex-col border-4 ${borderClass} ${bgClass} ${feedbackOverlay ?? ''} cursor-pointer select-none transition-colors duration-150`}
      onClick={onSelect}
      data-testid={`triage-card-slot-${slotNumber}`}
      style={{ minHeight: '180px' }}
    >
      {/* Slot badge + difficulty indicator */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span
          className="text-[#fbbf24] bg-[#3a2a00] border-2 border-[#fbbf24] px-2 py-0.5"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
        >
          [{slotNumber}]
        </span>
        <span
          className="text-white/40"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
        >
          LVL {incident.difficulty}
        </span>
      </div>

      {/* Incident headline — alarm amber */}
      <div className="px-3 pb-1">
        <p
          className="text-[#fbbf24] leading-snug"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', lineHeight: '1.6' }}
          data-testid={`card-headline-${slotNumber}`}
        >
          {incident.headline}
        </p>
      </div>

      {/* Incident detail — smaller white text */}
      <div className="px-3 pb-2 flex-1">
        <p
          className="text-white/80 leading-relaxed"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', lineHeight: '1.7' }}
        >
          {incident.detail}
        </p>
      </div>

      {/* Action buttons: REPORTABLE / NOT REPORTABLE */}
      <div
        className="flex gap-2 px-3 pb-2"
        onClick={(e) => e.stopPropagation()} // don't re-fire onSelect from button clicks
      >
        <button
          onClick={() => onClassify(true)}
          data-testid={`btn-reportable-${slotNumber}`}
          className="flex-1 py-1.5 bg-[#3a0a0a] hover:bg-[#5a1a1a] border-2 border-[#ef4444] text-[#ef4444] transition-colors"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
        >
          [R] REPORTABLE
        </button>
        <button
          onClick={() => onClassify(false)}
          data-testid={`btn-not-reportable-${slotNumber}`}
          className="flex-1 py-1.5 bg-[#0a2a2a] hover:bg-[#1a3a3a] border-2 border-[#2dd4bf] text-[#2dd4bf] transition-colors"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
        >
          [N] NOT RPT
        </button>
      </div>

      {/* Timer bar — bottom edge */}
      <div className="w-full h-2 bg-[#0a0a1a]">
        <div
          className={`h-full ${timerColor} ${timerPulse} transition-all duration-100`}
          style={{ width: `${pct * 100}%` }}
          data-testid={`timer-bar-${slotNumber}`}
        />
      </div>

      {/* Expired stamp overlay */}
      {feedback === 'expired' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <span
            className="text-[#ef4444] border-4 border-[#ef4444] px-3 py-1 rotate-[-8deg] bg-black/70"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px', letterSpacing: '2px' }}
          >
            TOO SLOW
          </span>
        </div>
      )}

      {/* Correct flash overlay */}
      {feedback === 'correct' && (
        <div className="absolute inset-0 bg-[#22c55e]/20 pointer-events-none animate-[flash-green_0.4s_ease-out]" />
      )}
    </div>
  );
}
