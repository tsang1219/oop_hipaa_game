import { useState, useEffect, useCallback, useMemo } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import { getSorterDocumentSet, type SorterItem as SorterItemData } from '@/data/sorterData';
import { SorterItem } from './SorterItem';
import { BucketZone } from './BucketZone';
import {
  getNPCReactionForItem,
  getNPCFallbackReaction,
  accuracyToBand,
  type NPCReaction,
  type NPCSorterId,
} from '@/data/sorterReactions';
import { NPCReactionBubble } from './NPCReactionBubble';
// NOTE: SorterContextCard is intentionally NOT imported here.
// UnifiedGamePage owns that render during encounterPhase === 'narrative-card'.
// By the time this overlay mounts, the player has already dismissed the context card.

// Overlay starts in 'sorting' phase directly (no context-card phase).
type SorterPhase = 'sorting' | 'completing';

export type PHISorterOverlayProps = {
  documentSetId: string;     // Lookup key into SORTER_DOCUMENT_SETS
  encounterId: string;       // Round-trips back to onComplete and Plan 04
  onComplete: (result: {
    encounterId: string;
    correctCount: number;
    totalCount: number;
    scoreContribution: number;  // Math.round((correctCount/totalCount) * 12), 0..12
    takeaways: [string, string]; // Pass-through from docSet.takeaways — cleaner Plan 04 wiring (W4)
  }) => void;
  onAbort?: () => void;      // Player exits via X button or Esc — no scoring, no registry write
};

// ── NPC display mapping ───────────────────────────────────────────────────────
// Maps documentSetId → (npcId, display name, role) used by NPCReactionBubble and
// the reaction-bank lookups. Stable across Phase 22 — no runtime changes needed.

type NPCDisplay = {
  id: NPCSorterId;
  name: string;
  role: string;
};

const NPC_DISPLAY_BY_SET: Record<string, NPCDisplay> = {
  'phi-sorter-set-1': { id: 'aiyana', name: 'Aiyana', role: 'Intake Volunteer' },
  'phi-sorter-set-2': { id: 'marcus', name: 'Marcus', role: 'Lab Aide' },
  'phi-sorter-set-3': { id: 'tovar', name: 'Dr. Tovar', role: 'Compliance Lead' },
};

// Defensive default — should never fire if Plan 22-02 wired roomData correctly.
const FALLBACK_NPC_DISPLAY: NPCDisplay = { id: 'aiyana', name: 'Co-worker', role: 'Staff' };

/**
 * Top-level PHI Sorter encounter overlay.
 *
 * Starts directly in 'sorting' phase — UnifiedGamePage rendered SorterContextCard during
 * the prior 'narrative-card' phase (BLOCKER 2 fix: single render path, no double-card bug).
 *
 * Supports:
 *   - Mouse drag-and-drop (HTML5 DnD)
 *   - Keyboard: ↑↓ to cycle items, ←→ to highlight bucket, Enter/Space to commit
 *   - Per-bucket draggingOverBucket state (W2 fix: only active bucket highlights during drag)
 *   - Audio feedback via REACT_PLAY_SFX for correct/wrong/fanfare
 *   - 600ms anticipation beat before onComplete fires (Commandment 2)
 *   - Educational wrong-answer feedback panel ≥3s (Commandment 4)
 *   - PHASE 22: NPC speech bubble (NPCReactionBubble) with specific-item + accuracy-band reactions
 *   - PHASE 22: HOLD IT dramatic reveal on correct classification of the tricky item per set
 */
export function PHISorterOverlay({ documentSetId, encounterId, onComplete, onAbort }: PHISorterOverlayProps) {
  const docSet = useMemo(() => getSorterDocumentSet(documentSetId), [documentSetId]);

  // Error fallback — graceful exit on bad documentSetId (does NOT crash)
  if (!docSet) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
        <div className="bg-[#2a2a3e] border-4 border-red-500 p-6 max-w-sm">
          <p
            className="text-white mb-4"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            Sorter content not found: {documentSetId}
          </p>
          <button
            onClick={() =>
              onComplete({
                encounterId,
                correctCount: 0,
                totalCount: 0,
                scoreContribution: 0,
                takeaways: ['', ''] as [string, string],
              })
            }
            className="bg-red-500 text-white border-4 border-black px-4 py-2"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            DISMISS
          </button>
        </div>
      </div>
    );
  }

  // Phase starts at 'sorting' directly (context card was handled by UnifiedGamePage).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [phase, setPhase] = useState<SorterPhase>('sorting');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [remainingItems, setRemainingItems] = useState<SorterItemData[]>(docSet.items);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [hoveredBucket, setHoveredBucket] = useState<'phi' | 'not_phi' | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  // W2 fix: tracks which specific bucket the cursor is over during mouse drag
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [draggingOverBucket, setDraggingOverBucket] = useState<'phi' | 'not_phi' | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [correctCount, setCorrectCount] = useState(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [bucketFeedback, setBucketFeedback] = useState<{
    phi: 'idle' | 'correct' | 'incorrect';
    not_phi: 'idle' | 'correct' | 'incorrect';
  }>({ phi: 'idle', not_phi: 'idle' });
  // Educational wrong-answer panel — shown ≥3s (Commandment 4: teach why)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [wrongFeedback, setWrongFeedback] = useState<{
    label: string;
    explanation: string;
  } | null>(null);

  // PHASE 22: NPC reaction bubble state.
  // currentReactionText drives the bubble. holdItReveal triggers the HOLD IT variant when truthy.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [currentReactionText, setCurrentReactionText] = useState<string>('');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [currentReactionVariant, setCurrentReactionVariant] = useState<NPCReaction['variant']>('neutral');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [holdItReveal, setHoldItReveal] = useState<{ educationalBeat: string } | null>(null);

  // Track total drops to drive accuracy-band fallback selection
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [totalDropsSoFar, setTotalDropsSoFar] = useState(0);

  const npcDisplay = NPC_DISPLAY_BY_SET[documentSetId] ?? FALLBACK_NPC_DISPLAY;

  const totalCount = docSet.items.length;

  // Phase 22: Seed bubble with opening line on mount so the NPC is "present" from frame one
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const opener = getNPCFallbackReaction(npcDisplay.id, 'good');
    setCurrentReactionText(opener.text);
    setCurrentReactionVariant(opener.variant ?? 'neutral');
    // Intentionally keyed to docSet.id — runs once per document set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docSet.id]);

  /**
   * Core drop handler — invoked by both mouse drop and keyboard Enter/Space.
   * Emits SFX, sets feedback state, removes item from pile, checks completion.
   * PHASE 22: Also computes NPC reaction and fires HOLD IT reveal for tricky items.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleDrop = useCallback(
    (itemId: string, bucket: 'phi' | 'not_phi') => {
      const item = remainingItems.find((i) => i.id === itemId);
      if (!item) return;

      const isCorrect = item.category === bucket;

      // EXISTING Phase 16 audio + visual + wrong-feedback logic — preserved verbatim
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.7 });
        setBucketFeedback((f) => ({ ...f, [bucket]: 'correct' }));
        setTimeout(() => setBucketFeedback((f) => ({ ...f, [bucket]: 'idle' })), 400);
      } else {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_wrong', volume: 0.7 });
        setBucketFeedback((f) => ({ ...f, [bucket]: 'incorrect' }));
        setTimeout(() => setBucketFeedback((f) => ({ ...f, [bucket]: 'idle' })), 500);
        // Educational feedback panel — teach the rule for ≥3s before fading
        setWrongFeedback({ label: item.label, explanation: item.explanation });
        setTimeout(() => setWrongFeedback(null), 3500);
      }

      // PHASE 22: HOLD IT reveal — fires ONLY on correct classification of a holdIt item.
      if (isCorrect && item.holdIt) {
        // Dedicated SFX — reusing sfx_fanfare at 0.4 volume per CONTEXT.md decision (no new asset)
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.4 });
        // Set the reveal text (drives NPCReactionBubble's holdIt prop)
        setHoldItReveal({ educationalBeat: item.holdIt.educationalBeat });
        // Use the npcLine from the holdIt object (takes precedence over reaction-bank lookup)
        setCurrentReactionText(item.holdIt.npcLine);
        setCurrentReactionVariant('enthusiastic');
        // HOLD IT reveal dwells for ~3.5s before fading back to band fallback
        setTimeout(() => {
          setHoldItReveal(null);
        }, 3500);
      } else {
        // PHASE 22: Standard reaction — specific-item lookup, fall back to accuracy band.
        // Use setState callback form for correctCount to get the post-update value for band calc.
        const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
        const newTotalDrops = totalDropsSoFar + 1;
        const specificReaction = getNPCReactionForItem(npcDisplay.id, itemId, isCorrect);
        const reaction =
          specificReaction ??
          getNPCFallbackReaction(npcDisplay.id, accuracyToBand(newCorrectCount, newTotalDrops));
        setCurrentReactionText(reaction.text);
        setCurrentReactionVariant(reaction.variant ?? 'neutral');
      }

      setTotalDropsSoFar((n) => n + 1);

      // Remove item; clamp selectedItemIdx to avoid out-of-bounds
      setRemainingItems((prev) => {
        const next = prev.filter((i) => i.id !== itemId);
        setSelectedItemIdx((idx) => Math.max(0, Math.min(idx, next.length - 1)));
        return next;
      });
      setHoveredBucket(null);
      setDraggingItemId(null);
      setDraggingOverBucket(null); // W2 fix: clear per-bucket drag state on drop
    },
    [remainingItems, correctCount, totalDropsSoFar, npcDisplay.id],
  );

  /**
   * Per-bucket drag enter/leave handlers (W2 fix).
   * Passed to each BucketZone so the parent knows which specific bucket the cursor is over.
   * Prevents both buckets from highlighting simultaneously during a mouse drag.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleBucketDragEnter = useCallback((bucketType: 'phi' | 'not_phi') => {
    setDraggingOverBucket(bucketType);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleBucketDragLeave = useCallback((bucketType: 'phi' | 'not_phi') => {
    // Only clear if leaving the same bucket we entered — avoids child-element onDragLeave races
    setDraggingOverBucket((curr) => (curr === bucketType ? null : curr));
  }, []);

  /**
   * Completion effect: when sorting phase empties the pile →
   * 600ms anticipation beat (Commandment 2) → sfx_fanfare → onComplete.
   */
  // Step 1 — when the pile empties while in 'sorting', flip phase to 'completing'.
  // Kept narrow (only depends on the trigger conditions) so the dep change is the
  // phase flip itself, not the score values that change every drop.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase === 'sorting' && remainingItems.length === 0) {
      setPhase('completing');
    }
  }, [phase, remainingItems.length]);

  // Step 2 — after entering 'completing', wait 600ms (anticipation beat,
  // Commandment 2), play fanfare, fire onComplete. Critical: this effect's
  // deps do NOT include `phase` beyond the initial entry — once we're in
  // 'completing' the timeout runs to completion without being cleared by
  // re-renders. Original bug: a single effect that both flipped phase and
  // scheduled the timeout — the phase flip cleared its own timeout before
  // it could fire, so onComplete never ran.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'completing') return;
    const t = setTimeout(() => {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.7 });
      const scoreContribution = Math.round((correctCount / totalCount) * 12);
      onComplete({
        encounterId,
        correctCount,
        totalCount,
        scoreContribution,
        takeaways: docSet.takeaways,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [phase, correctCount, totalCount, encounterId, onComplete, docSet.takeaways]);

  /**
   * Keyboard handler — only active in 'sorting' phase.
   * ↑/↓ cycle items, ←/→ highlight bucket, Enter/Space commit.
   * All reactive values are in deps to prevent stale closures (research Pitfall 1).
   * Cleanup via useEffect return prevents listener leaks (research Pitfall 2).
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'sorting') return;
    const handleKey = (e: KeyboardEvent) => {
      // Escape — abort encounter (no scoring, no registry write, replayable)
      if (e.key === 'Escape' && onAbort) {
        e.preventDefault();
        onAbort();
        return;
      }
      if (remainingItems.length === 0) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        setSelectedItemIdx(
          (idx) => (idx + delta + remainingItems.length) % remainingItems.length,
        );
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setHoveredBucket('not_phi');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setHoveredBucket('phi');
      }
      if ((e.key === 'Enter' || e.key === ' ') && hoveredBucket) {
        e.preventDefault();
        const item = remainingItems[selectedItemIdx];
        if (item) handleDrop(item.id, hoveredBucket);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, remainingItems, selectedItemIdx, hoveredBucket, handleDrop, onAbort]);

  // ── Sorting phase render ─────────────────────────────────────────────────────
  // Sorting phase UI — overlay always mounts directly here.
  return (
    <div
      className="absolute inset-0 z-40 bg-black/85 flex flex-col items-stretch justify-center p-6"
      data-testid="phi-sorter-overlay"
    >
      {/* Close button — exits without scoring, encounter remains replayable */}
      {onAbort && (
        <button
          onClick={onAbort}
          aria-label="Close sorter"
          data-testid="button-sorter-close"
          className="absolute top-4 right-4 z-50 bg-[#3a1a2a] hover:bg-[#5a2a3a] text-white border-4 border-[#FF6B9D] w-10 h-10 flex items-center justify-center transition-colors"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
        >
          ×
        </button>
      )}

      {/* Phase 22: NPC reaction bubble — persistent during sort, fades on text change */}
      <NPCReactionBubble
        npcName={npcDisplay.name}
        npcRole={npcDisplay.role}
        text={currentReactionText}
        variant={currentReactionVariant}
        holdIt={holdItReveal ?? undefined}
      />

      {/* Progress header — SORTV2-06: includes NPC name for in-encounter context */}
      <div
        className="text-center text-white mb-4 mt-20"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
        data-testid="text-sorter-progress"
      >
        HELPING {npcDisplay.name.toUpperCase()} &middot; {totalCount - remainingItems.length} / {totalCount} sorted &middot; {correctCount} correct
      </div>

      {/* Three-column layout: NOT PHI bucket | items pile | PHI bucket */}
      <div className="flex-1 flex flex-row items-stretch justify-center gap-4 max-w-5xl mx-auto w-full">

        {/* Left bucket: NOT PHI */}
        <div className="flex-1 flex items-center">
          <BucketZone
            bucketType="not_phi"
            isHovered={hoveredBucket === 'not_phi' || draggingOverBucket === 'not_phi'} /* W2: per-bucket only */
            feedbackState={bucketFeedback.not_phi}
            onDragEnter={handleBucketDragEnter}
            onDragLeave={handleBucketDragLeave}
            onDrop={(bt) => {
              if (draggingItemId) handleDrop(draggingItemId, bt);
            }}
          />
        </div>

        {/* Center: item pile */}
        <div
          className="flex-1 max-h-[60vh] overflow-y-auto bg-[#1a1a2e]/60 border-4 border-[#4FB3D9] p-3"
          data-testid="sorter-items-pile"
        >
          {remainingItems.map((item, idx) => (
            <SorterItem
              key={item.id}
              item={item}
              isSelected={idx === selectedItemIdx}
              isDragging={draggingItemId === item.id}
              onDragStart={(id) => setDraggingItemId(id)}
              onDragEnd={() => {
                setDraggingItemId(null);
                setDraggingOverBucket(null);
              }}
            />
          ))}
        </div>

        {/* Right bucket: PHI */}
        <div className="flex-1 flex items-center">
          <BucketZone
            bucketType="phi"
            isHovered={hoveredBucket === 'phi' || draggingOverBucket === 'phi'} /* W2: per-bucket only */
            feedbackState={bucketFeedback.phi}
            onDragEnter={handleBucketDragEnter}
            onDragLeave={handleBucketDragLeave}
            onDrop={(bt) => {
              if (draggingItemId) handleDrop(draggingItemId, bt);
            }}
          />
        </div>
      </div>

      {/* Keyboard hint footer */}
      <div
        className="text-center text-white/60 mt-4"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
      >
        DRAG ITEMS &middot; OR &#x2191;&#x2193; TO SELECT &middot; &#x2190;&#x2192; FOR BUCKET &middot; ENTER TO COMMIT &middot; ESC TO EXIT
      </div>

      {/* Wrong-answer educational feedback toast — visible ≥3s (Commandment 4) */}
      {wrongFeedback && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-md w-[90%] bg-[#3a1a2a] border-4 border-[#FF6B9D] p-4 z-50"
          data-testid="sorter-wrong-feedback"
        >
          <div
            className="text-[#FF6B9D] mb-1"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            NOT QUITE &mdash; {wrongFeedback.label}
          </div>
          <div
            className="text-white leading-relaxed"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', lineHeight: '1.8' }}
          >
            {wrongFeedback.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
