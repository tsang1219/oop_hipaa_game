import { useState, useEffect, useCallback, useMemo } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import { getSorterDocumentSet, type SorterItem as SorterItemData } from '@/data/sorterData';
import { SorterItem } from './SorterItem';
import { BucketZone } from './BucketZone';
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
};

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
 */
export function PHISorterOverlay({ documentSetId, encounterId, onComplete }: PHISorterOverlayProps) {
  const docSet = useMemo(() => getSorterDocumentSet(documentSetId), [documentSetId]);

  // Error fallback — graceful exit on bad documentSetId (does NOT crash)
  if (!docSet) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
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

  const totalCount = docSet.items.length;

  /**
   * Core drop handler — invoked by both mouse drop and keyboard Enter/Space.
   * Emits SFX, sets feedback state, removes item from pile, checks completion.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleDrop = useCallback(
    (itemId: string, bucket: 'phi' | 'not_phi') => {
      const item = remainingItems.find((i) => i.id === itemId);
      if (!item) return;

      const isCorrect = item.category === bucket;

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
    [remainingItems],
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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'sorting') return;
    if (remainingItems.length > 0) return;
    setPhase('completing');
    const t = setTimeout(() => {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.7 });
      const scoreContribution = Math.round((correctCount / totalCount) * 12);
      onComplete({
        encounterId,
        correctCount,
        totalCount,
        scoreContribution,
        takeaways: docSet.takeaways, // Pass-through directly — avoids redundant docSet re-fetch in Plan 04 (W4)
      });
    }, 600); // Anticipation beat before fanfare and debrief transition
    return () => clearTimeout(t);
  }, [phase, remainingItems.length, correctCount, totalCount, encounterId, onComplete, docSet.takeaways]);

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
  }, [phase, remainingItems, selectedItemIdx, hoveredBucket, handleDrop]);

  // ── Sorting phase render ─────────────────────────────────────────────────────
  // Sorting phase UI — overlay always mounts directly here.
  return (
    <div
      className="fixed inset-0 z-40 bg-black/85 flex flex-col items-stretch justify-center p-6"
      data-testid="phi-sorter-overlay"
    >
      {/* Progress header */}
      <div
        className="text-center text-white mb-4"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
        data-testid="text-sorter-progress"
      >
        {totalCount - remainingItems.length} / {totalCount} sorted &middot; {correctCount} correct
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
        DRAG ITEMS &middot; OR &#x2191;&#x2193; TO SELECT &middot; &#x2190;&#x2192; FOR BUCKET &middot; ENTER TO COMMIT
      </div>

      {/* Wrong-answer educational feedback toast — visible ≥3s (Commandment 4) */}
      {wrongFeedback && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-[90%] bg-[#3a1a2a] border-4 border-[#FF6B9D] p-4 z-50"
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
