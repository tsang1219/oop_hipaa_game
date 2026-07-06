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
  /**
   * Phase 24 — resolved spritesheet path; renders a persistent 64px portrait.
   * Sheets are 96×128, frame 0 top-left (idle-down).
   * When provided: portrait + name plate ALWAYS render; speech bubble hides when text is empty.
   * When absent: original Phase 22/23 behavior (component returns null when no text/holdIt).
   */
  spriteUrl?: string;
  /**
   * Run 08 cast identity — the NPC's signature color (name header, portrait
   * border, bubble tail, neutral-variant border). HOLD IT gold and the
   * enthusiastic/thoughtful variant tints still win over it. Defaults to the
   * pre-Run-08 teal so uncolored callers render unchanged.
   */
  color?: string;
};

/**
 * NPCReactionBubble — Phase 22 speech-bubble overlay, Phase 24 portrait extension.
 *
 * Persistent during the sort phase. Re-mounts/fades in whenever `text` changes
 * (driven by PHISorterOverlay's most-recent-drop reaction lookup).
 *
 * Visual treatments:
 *   - Default: dark navy bubble, teal border, fade-in over ~200ms
 *   - HOLD IT (when `holdIt` prop is truthy): scaled ~1.2x, gold border flash,
 *     educationalBeat shown as second line. Stays in flow — NOT a full-screen modal.
 *
 * Phase 24 with spriteUrl:
 *   - Portrait block rendered on the left; speech bubble on the right in a row layout.
 *   - Portrait: 64×64 pixelated upscale of spritesheet frame 0 (Phase 21 CertificateOverlay pattern).
 *   - Name plate beneath portrait, always visible.
 *   - Portrait border goes gold during HOLD IT reveal.
 *   - Portrait + name plate persist even when visibleText is empty (only bubble half hides).
 *
 * Positioned absolute/fixed at top-center by the parent overlay layout.
 */
export function NPCReactionBubble({ npcName, npcRole, text, variant = 'neutral', holdIt, spriteUrl, color = '#4FB3D9' }: NPCReactionBubbleProps) {
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

  // ── Without spriteUrl: Phase 22/23 behavior — early return when nothing to show ──
  if (!spriteUrl && !visibleText && !holdIt) return null;

  const isHoldIt = !!holdIt;
  // Bubble border: HOLD IT gold and tone-variant tints win; otherwise the
  // NPC's signature color (Run 08). Runtime values → inline style, not classes.
  const bubbleBorderColor = isHoldIt
    ? '#FFD93D'                             // gold for HOLD IT
    : variant === 'enthusiastic'
      ? '#7FE3A8'                           // soft green for enthusiastic
      : variant === 'thoughtful'
        ? '#9B8CE0'                         // soft purple for thoughtful
        : color;                            // signature color default

  // Identity anchors (name, portrait frame, tail) stay in the NPC's color even
  // during tone variants — only HOLD IT's gold overrides them.
  const identityColor = isHoldIt ? '#FFD93D' : color;

  const ringClass = isHoldIt ? 'ring-4 ring-[#FFD93D]/40' : '';

  // ── Bubble content (shared between portrait and no-portrait layouts) ──────
  const bubbleContent = (visibleText || isHoldIt) ? (
    <div
      className={[
        'bg-[#1a2a3e] border-4 px-5 py-4',
        'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
        'transition-all duration-200 ease-out',
        ringClass,
        // Scale only when no portrait (portrait row already provides stable anchor)
        !spriteUrl ? scaleClass : '',
      ].join(' ')}
      style={{
        fontFamily: '"Press Start 2P", monospace',
        borderColor: bubbleBorderColor,
        opacity: spriteUrl ? opacity : opacity,
        maxWidth: spriteUrl ? undefined : undefined,
      }}
      data-testid="npc-reaction-bubble"
      data-hold-it={isHoldIt ? 'true' : 'false'}
    >
      {/* NPC name + role header — name in the NPC's signature color (Run 08) */}
      <div
        className="mb-2"
        style={{ fontSize: '8px', color: identityColor }}
        data-testid="npc-reaction-bubble-header"
      >
        {npcName} <span className="text-white/60">&middot; {npcRole}</span>
      </div>

      {/* Main reaction text */}
      <div
        className="text-white"
        style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '1.4', letterSpacing: '0.01em' }}
        data-testid="npc-reaction-bubble-text"
      >
        {visibleText}
      </div>

      {/* HOLD IT educational beat — second line, gold tint */}
      {holdIt && holdIt.educationalBeat && (
        <div
          className="text-[#FFD93D] mt-3 pt-3 border-t-2 border-[#FFD93D]/30"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.4', letterSpacing: '0.01em' }}
          data-testid="npc-reaction-bubble-holdit-beat"
        >
          {holdIt.educationalBeat}
        </div>
      )}

      {/* Speech-bubble tail — points left toward portrait when portrait exists, down otherwise */}
      {spriteUrl ? (
        // Left-pointing tail (speech originates beside portrait)
        <div
          className="absolute -left-4 top-5 w-0 h-0"
          style={{
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: `12px solid ${identityColor}`,
          }}
        />
      ) : (
        // Down-pointing tail (original behavior)
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `12px solid ${identityColor}`,
          }}
        />
      )}
    </div>
  ) : null;

  // ── Layout: portrait row (Phase 24) vs standalone bubble (Phase 22/23) ───
  if (spriteUrl) {
    return (
      <div
        className={[
          'absolute top-4 left-1/2 -translate-x-1/2 z-50',
          'flex flex-row items-start gap-3',
          scaleClass,
          'transition-all duration-200 ease-out',
        ].join(' ')}
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {/* Portrait block — always visible when spriteUrl is present */}
        <div className="flex flex-col items-center">
          {/* 64px pixelated portrait — Phase 21 CertificateOverlay pattern.
              Border carries the NPC's signature color (gold during HOLD IT). */}
          <div
            className="border-4"
            style={{
              width: '64px',
              height: '64px',
              borderColor: identityColor,
              backgroundImage: `url(${spriteUrl})`,
              backgroundSize: '192px 256px',
              backgroundPosition: '0 0',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              backgroundColor: '#1a1a2e',
            }}
            data-testid="sorter-npc-portrait"
          />
          {/* Name plate — signature color (Run 08; was gold) */}
          <div
            className="mt-1 text-center"
            style={{ fontSize: '7px', maxWidth: '68px', wordBreak: 'break-word', color: identityColor }}
          >
            {npcName}
          </div>
        </div>

        {/* Speech bubble — only when there's something to say */}
        {bubbleContent}
      </div>
    );
  }

  // ── Phase 22/23 standalone bubble (no spriteUrl) ────────────────────────
  return (
    <div
      className={[
        'absolute top-4 left-1/2 -translate-x-1/2 z-50',
        'bg-[#1a2a3e] border-4 px-5 py-4 max-w-md',
        'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
        'transition-all duration-200 ease-out',
        ringClass,
        scaleClass,
      ].join(' ')}
      style={{
        fontFamily: '"Press Start 2P", monospace',
        borderColor: bubbleBorderColor,
        opacity,
      }}
      data-testid="npc-reaction-bubble"
      data-hold-it={isHoldIt ? 'true' : 'false'}
    >
      {/* NPC name + role header — name in the NPC's signature color (Run 08) */}
      <div
        className="mb-2"
        style={{ fontSize: '8px', color: identityColor }}
        data-testid="npc-reaction-bubble-header"
      >
        {npcName} <span className="text-white/60">&middot; {npcRole}</span>
      </div>

      {/* Main reaction text */}
      <div
        className="text-white"
        style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '1.4', letterSpacing: '0.01em' }}
        data-testid="npc-reaction-bubble-text"
      >
        {visibleText}
      </div>

      {/* HOLD IT educational beat — second line, gold tint */}
      {holdIt && holdIt.educationalBeat && (
        <div
          className="text-[#FFD93D] mt-3 pt-3 border-t-2 border-[#FFD93D]/30"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.4', letterSpacing: '0.01em' }}
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
