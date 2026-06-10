import { useEffect, useState } from 'react';

export type NPCReactionBubbleProps = {
  /** NPC display name — "Aiyana" / "Marcus" / "Dr. Tovar" */
  npcName: string;
  /** NPC role label — "Intake Volunteer" / "Lab Aide" / "Compliance Lead" */
  npcRole: string;
  /** The current reaction line. Empty/null = bubble hides. */
  text: string;
  /** Optional variant hint from the reaction bank — controls tint. */
  variant?: 'neutral' | 'enthusiastic' | 'thoughtful';
  /**
   * If present, this is the dramatic HOLD IT reveal on the tricky item.
   * NPC bubble scales up, gold border flashes, educationalBeat renders as a second line.
   */
  holdIt?: { educationalBeat: string };
};

/**
 * NPCReactionBubble — Phase 22 speech-bubble overlay.
 *
 * Persistent during the sort phase. Re-mounts/fades in whenever `text` changes
 * (driven by PHISorterOverlay's most-recent-drop reaction lookup, Plan 04 wires this).
 *
 * Visual treatments:
 *   - Default: dark navy bubble, teal border, fade-in over ~200ms
 *   - HOLD IT (when `holdIt` prop is truthy): scaled ~1.2x, gold border flash,
 *     educationalBeat shown as second line. Stays in flow — NOT a full-screen modal.
 *
 * Positioned absolute/fixed at top-center by the parent overlay layout.
 *
 * Screen pulse intentionally NOT in Phase 22 — deferred to Phase 23 per CONTEXT.md.
 * SFX intentionally NOT in this component — emitted by PHISorterOverlay (Plan 04).
 * NPC portrait sprite intentionally NOT here — Phase 24 owns that.
 */
export function NPCReactionBubble({ npcName, npcRole, text, variant = 'neutral', holdIt }: NPCReactionBubbleProps) {
  // Track which text version is currently visible — drives fade-in on change
  const [visibleText, setVisibleText] = useState(text);
  const [opacity, setOpacity] = useState(text ? 1 : 0);
  const [scaleClass, setScaleClass] = useState('scale-100');

  useEffect(() => {
    if (text !== visibleText) {
      // Brief fade-out → swap → fade-in
      setOpacity(0);
      const t = setTimeout(() => {
        setVisibleText(text);
        setOpacity(text ? 1 : 0);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [text, visibleText]);

  // HOLD IT scale-up effect: briefly scale to 1.2, then settle to 1.1
  useEffect(() => {
    if (holdIt) {
      setScaleClass('scale-125');
      const t = setTimeout(() => setScaleClass('scale-110'), 400);
      return () => clearTimeout(t);
    } else {
      setScaleClass('scale-100');
    }
  }, [holdIt]);

  // Don't render anything if no text and no HOLD IT pending
  if (!visibleText && !holdIt) return null;

  const isHoldIt = !!holdIt;
  const borderColor = isHoldIt
    ? 'border-[#FFD93D]'                    // gold for HOLD IT
    : variant === 'enthusiastic'
      ? 'border-[#7FE3A8]'                  // soft green for enthusiastic
      : variant === 'thoughtful'
        ? 'border-[#9B8CE0]'                // soft purple for thoughtful
        : 'border-[#4FB3D9]';               // teal default

  const ringClass = isHoldIt ? 'ring-4 ring-[#FFD93D]/40' : '';

  return (
    <div
      className={[
        'absolute top-4 left-1/2 -translate-x-1/2 z-50',
        'bg-[#1a2a3e] border-4 px-5 py-4 max-w-md',
        'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
        'transition-all duration-200 ease-out',
        borderColor,
        ringClass,
        scaleClass,
      ].join(' ')}
      style={{
        fontFamily: '"Press Start 2P", monospace',
        opacity,
      }}
      data-testid="npc-reaction-bubble"
      data-hold-it={isHoldIt ? 'true' : 'false'}
    >
      {/* NPC name + role header */}
      <div
        className="text-[#4FB3D9] mb-2"
        style={{ fontSize: '8px' }}
        data-testid="npc-reaction-bubble-header"
      >
        {npcName} <span className="text-white/60">&middot; {npcRole}</span>
      </div>

      {/* Main reaction text */}
      <div
        className="text-white leading-relaxed"
        style={{ fontSize: '9px', lineHeight: '1.7' }}
        data-testid="npc-reaction-bubble-text"
      >
        {visibleText}
      </div>

      {/* HOLD IT educational beat — second line, gold tint */}
      {holdIt && holdIt.educationalBeat && (
        <div
          className="text-[#FFD93D] mt-3 pt-3 border-t-2 border-[#FFD93D]/30 leading-relaxed"
          style={{ fontSize: '8px', lineHeight: '1.7' }}
          data-testid="npc-reaction-bubble-holdit-beat"
        >
          {holdIt.educationalBeat}
        </div>
      )}

      {/* Speech-bubble tail (CSS triangle pointing down) */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `12px solid ${isHoldIt ? '#FFD93D' : '#4FB3D9'}`,
        }}
      />
    </div>
  );
}
