/**
 * StampPad — Phase 24 (SORTV2-12)
 *
 * Two rubber stamp buttons: KEEP (left) and REDACT (right).
 * Click-to-commit — NO drag handlers. tabIndex={-1} so parent's window keydown
 * handler owns keyboard navigation; prevents double-commit on Enter via native focus.
 *
 * Layout mirrors the retired NOT-PHI-left / PHI-right bucket layout so keyboard
 * muscle memory carries over from the drag-and-drop format.
 *
 * Purely presentational — parent owns focus/press state transitions.
 */
export type StampKind = 'keep' | 'redact';

export type StampPadProps = {
  /** Keyboard focus OR mouse hover — parent owns this state. */
  focusedStamp: StampKind | null;
  /** Parent sets briefly on commit (one render cycle) → drives stamp-press animation. */
  pressedStamp: StampKind | null;
  /** True during document transitions / non-sorting phases — greys out stamps. */
  disabled: boolean;
  onStamp: (kind: StampKind) => void;
  onHover: (kind: StampKind | null) => void;
};

const STAMPS: { kind: StampKind; label: string; sublabel: string; keyHint: string; handleColor: string; baseColor: string; borderColor: string; textColor: string }[] = [
  {
    kind: 'keep',
    label: 'KEEP',
    sublabel: 'SAFE TO KEEP',
    keyHint: '←',
    handleColor: '#8B6242',
    baseColor: '#1f4d33',
    borderColor: '#2ECC71',
    textColor: '#2ECC71',
  },
  {
    kind: 'redact',
    label: 'REDACT',
    sublabel: "THAT'S PHI",
    keyHint: '→',
    handleColor: '#8B6242',
    baseColor: '#4d1f2e',
    borderColor: '#FF6B9D',
    textColor: '#FF6B9D',
  },
];

export function StampPad({ focusedStamp, pressedStamp, disabled, onStamp, onHover }: StampPadProps) {
  return (
    <div
      className="flex gap-4 items-end justify-center"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {STAMPS.map(({ kind, label, sublabel, keyHint, handleColor, baseColor, borderColor, textColor }) => {
        const isFocused = focusedStamp === kind;
        const isPressed = pressedStamp === kind;

        return (
          <button
            key={kind}
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => onStamp(kind)}
            onMouseEnter={() => onHover(kind)}
            onMouseLeave={() => onHover(null)}
            className={[
              'relative flex flex-col items-center gap-0 select-none transition-transform duration-100',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              isFocused ? 'ring-4 ring-white/70 scale-105' : '',
              isPressed ? 'animate-[stamp-press_0.15s_ease-out]' : '',
            ].join(' ')}
            data-testid={`sorter-stamp-${kind}`}
          >
            {/* Wood handle bar */}
            <div
              className="border-2 border-black"
              style={{
                width: '64px',
                height: '14px',
                backgroundColor: handleColor,
              }}
            />

            {/* Ink base block */}
            <div
              className="flex flex-col items-center justify-center border-4 px-4 py-3"
              style={{
                backgroundColor: baseColor,
                borderColor: borderColor,
                minWidth: '88px',
              }}
            >
              {/* Stamp label */}
              <div
                style={{ fontSize: '12px', color: textColor }}
              >
                {label}
              </div>

              {/* Sub-label */}
              <div
                className="text-white/50 mt-1"
                style={{ fontSize: '7px' }}
              >
                {sublabel}
              </div>

              {/* Key hint */}
              <div
                className="text-white/50 mt-1"
                style={{ fontSize: '7px' }}
              >
                {keyHint}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
