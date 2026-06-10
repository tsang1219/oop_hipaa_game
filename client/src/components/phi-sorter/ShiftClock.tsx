/**
 * ShiftClock — Phase 24 (SORTV2-14)
 *
 * Compact wall-clock countdown card for the PHI Sorter shift.
 * Purely presentational — parent owns the interval. Component only formats
 * and styles based on secondsLeft / totalSeconds props.
 *
 * Low-time window (1..10s): text + border go pink, time pulses via clock-pulse keyframe.
 * At 0: renders "0:00" static — shift is over, calm down.
 */
export type ShiftClockProps = {
  secondsLeft: number;
  totalSeconds: number;
};

export function ShiftClock({ secondsLeft }: ShiftClockProps) {
  const isLow = secondsLeft <= 10 && secondsLeft > 0;
  const isDone = secondsLeft <= 0;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const timeString = `${minutes}:${secs}`;

  const borderClass = isLow ? 'border-[#FF6B9D]' : 'border-black';
  const textColorClass = isLow ? 'text-[#FF6B9D]' : 'text-[#FFD93D]';
  const pulseClass = isLow && !isDone ? 'animate-[clock-pulse_0.6s_ease-in-out_infinite]' : '';

  return (
    <div
      className={['bg-[#1a1a2e] border-4 px-3 py-2 text-center', borderClass].join(' ')}
      style={{ fontFamily: '"Press Start 2P", monospace' }}
      data-testid="sorter-shift-clock"
      data-low={isLow}
    >
      {/* Label row */}
      <div
        className="text-white/60 mb-1"
        style={{ fontSize: '7px' }}
      >
        SHIFT
      </div>

      {/* Time display */}
      <div
        className={[textColorClass, pulseClass].join(' ')}
        style={{ fontSize: '12px' }}
      >
        {timeString}
      </div>
    </div>
  );
}
