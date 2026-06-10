import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import { getSorterDocumentSet } from '@/data/sorterData';
import { getSponsorSpritePath } from '@/data/spriteAssetPaths';
import { DeskSurface } from './DeskSurface';
import { ShiftClock } from './ShiftClock';
import { OutgoingTray } from './OutgoingTray';
import { StampPad, type StampKind } from './StampPad';
import { DeskDocument, type DocAnimState } from './DeskDocument';
import {
  getNPCReactionForItem,
  getNPCFallbackReaction,
  accuracyToBand,
  type NPCReaction,
  type NPCSorterId,
  type AccuracyBand,
} from '@/data/sorterReactions';
import { NPCReactionBubble } from './NPCReactionBubble';
import { SorterCompletionOverlay } from './SorterCompletionOverlay';
// NOTE: SorterContextCard is intentionally NOT imported here.
// UnifiedGamePage owns that render during encounterPhase === 'narrative-card'.
// By the time this overlay mounts, the player has already dismissed the context card.

// Overlay starts in 'sorting' phase directly (no context-card phase).
// PHASE 23: Added 'celebrating' phase for the 1.2s SorterCompletionOverlay beat before debrief.
type SorterPhase = 'sorting' | 'completing' | 'celebrating';

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
// Maps documentSetId → (npcId, display name, role, spriteKey) used by NPCReactionBubble and
// the reaction-bank lookups. Phase 24 extends with spriteKey for portrait resolution.
//
// NPC portrait sheet mapping (matches each NPC's in-world roomData.json sprite):
//   phi-sorter-set-1 → Aiyana (intake_officer sprite → 'npc_officer_sheet')
//   phi-sorter-set-2 → Marcus (lab_aide sprite → 'npc_staff_sheet')
//   phi-sorter-set-3 → Dr. Tovar (compliance_lead sprite → 'npc_officer_sheet')

type NPCDisplay = {
  id: NPCSorterId;
  name: string;
  role: string;
  spriteKey: string;
};

const NPC_DISPLAY_BY_SET: Record<string, NPCDisplay> = {
  'phi-sorter-set-1': { id: 'aiyana',  name: 'Aiyana',    role: 'Intake Volunteer', spriteKey: 'npc_officer_sheet' },
  'phi-sorter-set-2': { id: 'marcus',  name: 'Marcus',    role: 'Lab Aide',         spriteKey: 'npc_staff_sheet'   },
  'phi-sorter-set-3': { id: 'tovar',   name: 'Dr. Tovar', role: 'Compliance Lead',  spriteKey: 'npc_officer_sheet' },
};

// Defensive default — should never fire if Plan 22-02 wired roomData correctly.
const FALLBACK_NPC_DISPLAY: NPCDisplay = { id: 'aiyana', name: 'Co-worker', role: 'Staff', spriteKey: 'npc_staff_sheet' };

// Shift-over NPC lines — voice-matched per Phase 22 banks (Record<NPCSorterId, string>).
// These fire when secondsLeft hits 0 during the sort. Soft and honest — no fail language.
const SHIFT_OVER_LINES: Record<NPCSorterId, string> = {
  aiyana: "Shift's over! Leave the rest of the pile for the auditor — she loves that.",
  marcus: "Aaand time. The unsorted ones go to the auditor. Godspeed, little manifests.",
  tovar:  "Time. Whatever's left goes to the auditor's queue — that's what it's there for.",
};

/**
 * Top-level PHI Sorter encounter overlay.
 *
 * Starts directly in 'sorting' phase — UnifiedGamePage rendered SorterContextCard during
 * the prior 'narrative-card' phase (BLOCKER 2 fix: single render path, no double-card bug).
 *
 * PHASE 22:
 *   - NPC speech bubble (NPCReactionBubble) with specific-item + accuracy-band reactions
 *   - HOLD IT dramatic reveal on correct classification of the tricky item per set
 *
 * PHASE 23:
 *   - Camera shake (~80ms) on every stamp — Commandment 1 proportional feedback (SORTV2-07)
 *   - Animated tray counters fed from trayCounts state (SORTV2-08)
 *   - Pulsing score readout (+2 HOLD IT / +1 regular, display-only) (SORTV2-10)
 *   - 'celebrating' phase with SorterCompletionOverlay ~1.2s before onComplete (SORTV2-09)
 *   - Band-transition-aware NPC reactions with nonce cycling (SORTV2-10)
 *
 * PHASE 24:
 *   - Papers Please desk format: one document at a time (SORTV2-11)
 *   - KEEP/REDACT stamp commits with stamp-thunk SFX + ink mark + ink-splatter (SORTV2-12)
 *   - Outgoing trays filling; timer expiry counts unstamped items in totalCount (SORTV2-13)
 *   - Soft 90/75/60s shift clock — wraps at 0:00 with auditor line (SORTV2-14)
 *   - Persistent NPC portrait hosting all reactions (SORTV2-15)
 *   - Keyboard-only completion: ←/→ focus stamp, Enter/Space commit, Esc abort (SORTV2-15)
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

  // ── PHASE 24: Desk-format document state ────────────────────────────────────
  // One document at a time indexed into docSet.items (SORTV2-11)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [docAnimState, setDocAnimState] = useState<DocAnimState>('entering');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [stampedKind, setStampedKind] = useState<StampKind | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);

  // Stamp focus/press state — focusedStamp stays sticky between documents
  // (Papers Please rapid-keyboard rhythm: → Enter Enter Enter must work)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [focusedStamp, setFocusedStamp] = useState<StampKind | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [pressedStamp, setPressedStamp] = useState<StampKind | null>(null);

  // ── PHASE 24: Tray counts (renamed from bucketCounts — same shape) ──────────
  // phi feeds REDACT tray, not_phi feeds KEEP tray; resets on mount for replay (SORTV2-13/08)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [trayCounts, setTrayCounts] = useState<{ phi: number; not_phi: number }>({ phi: 0, not_phi: 0 });

  // ── PHASE 24: Shift clock (SORTV2-14) ────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [secondsLeft, setSecondsLeft] = useState(docSet.shiftSeconds);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [shiftOver, setShiftOver] = useState(false);

  // ── Phase 16/22/23 state preserved verbatim ───────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [correctCount, setCorrectCount] = useState(0);

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

  // PHASE 23: Display-only sorter score (+2 HOLD IT, +1 regular — never flows into onComplete).
  // scorePulseNonce is re-keyed on the score span to restart the CSS pulse animation each increment.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [sorterScore, setSorterScore] = useState(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [scorePulseNonce, setScorePulseNonce] = useState(0);

  // PHASE 23: Camera shake flag — boolean is sufficient; stamps can't occur faster than 80ms animation.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isShaking, setIsShaking] = useState(false);

  // PHASE 23: Tracks the accuracy band as of the previous drop for transition detection.
  // Initialized to 'good' (opener band) — matches the seed reaction on mount.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prevBandRef = useRef<AccuracyBand>('good');

  // Ref array for cascade timeouts — cleared on unmount so abort mid-animation leaks nothing
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cascadeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const npcDisplay = NPC_DISPLAY_BY_SET[documentSetId] ?? FALLBACK_NPC_DISPLAY;
  const totalCount = docSet.items.length;

  // Resolve NPC portrait path for Phase 24 persistent portrait (SORTV2-15)
  const npcSpriteUrl = getSponsorSpritePath(npcDisplay.spriteKey);

  // Phase 22: Seed bubble with opening line on mount so the NPC is "present" from frame one
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const opener = getNPCFallbackReaction(npcDisplay.id, 'good');
    setCurrentReactionText(opener.text);
    setCurrentReactionVariant(opener.variant ?? 'neutral');
    // Intentionally keyed to docSet.id — runs once per document set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docSet.id]);

  // PHASE 24: Emit sfx_sorter_paper on mount — first document slides in (SORTV2-11)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_paper', volume: 0.5 });
    // Intentionally keyed to docSet.id — runs once per document set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docSet.id]);

  // PHASE 24: Cleanup cascade timers on unmount — abort mid-animation leaks nothing
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      cascadeTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // ── PHASE 24: Shift clock engine (SORTV2-14) ─────────────────────────────────
  // Interval keyed to [phase] — starts when sorting begins, stops otherwise.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'sorting') return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Separate narrow effect watches [secondsLeft] — shift-over transition
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (secondsLeft === 0 && phase === 'sorting' && !shiftOver) {
      setShiftOver(true);
      // NPC delivers the shift-over line (voice-matched per set)
      setCurrentReactionText(SHIFT_OVER_LINES[npcDisplay.id]);
      setCurrentReactionVariant('neutral');
      // Do NOT setPhase here — Completion Effect 1 owns that transition
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  /**
   * Core stamp handler — replaces handleDrop. Invoked by both mouse click and keyboard Enter/Space.
   * Guards: bail unless sorting phase, document is active, and shift is not over.
   * PHASE 22: Computes NPC reaction and fires HOLD IT reveal for tricky items.
   * PHASE 23: Adds shake, tray count increment, score pulse, band-transition reactions.
   * PHASE 24: Desk document lifecycle chain: stamped → exiting → next doc slides in.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleStamp = useCallback(
    (kind: StampKind) => {
      if (phase !== 'sorting' || docAnimState !== 'active' || shiftOver) return;

      const item = docSet.items[currentDocIndex];
      if (!item) return;

      const bucket = kind === 'redact' ? 'phi' : 'not_phi';
      const isCorrect = item.category === bucket;

      // ── PHASE 24: Stamp feedback (SORTV2-12) ─────────────────────────────
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_stamp', volume: 0.8 });
      setPressedStamp(kind);
      const pressTimer = setTimeout(() => setPressedStamp(null), 150);
      cascadeTimersRef.current.push(pressTimer);
      setStampedKind(kind);
      setLastWasCorrect(isCorrect);
      setDocAnimState('stamped');

      // PHASE 23: Increment tray count on EVERY stamp (SORTV2-08)
      // phi feeds REDACT tray, not_phi feeds KEEP tray
      setTrayCounts((c) => ({ ...c, [bucket]: c[bucket] + 1 }));

      // PHASE 23: Camera shake on EVERY stamp (SORTV2-07).
      // 120ms clear gives the 80ms animation room to complete without queuing.
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 120);

      // Correct / wrong audio + educational feedback (Phase 16 logic preserved verbatim)
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.7 });
      } else {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_wrong', volume: 0.7 });
        // Educational feedback panel — teach the rule for ≥3s before fading
        setWrongFeedback({ label: item.label, explanation: item.explanation });
        setTimeout(() => setWrongFeedback(null), 3500);
      }

      // PHASE 23: Score increment ONLY on correct (SORTV2-10).
      // +2 for HOLD IT item, +1 for regular. Display-only — never flows into onComplete.
      if (isCorrect) {
        setSorterScore((s) => s + (item.holdIt ? 2 : 1));
        setScorePulseNonce((n) => n + 1);
      }

      // Compute accuracy band BEFORE the HOLD IT branch so prevBandRef is always updated.
      const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
      const newTotalDrops = totalDropsSoFar + 1;
      const newBand = accuracyToBand(newCorrectCount, newTotalDrops);
      const bandChanged = newBand !== prevBandRef.current && newTotalDrops >= 3; // ignore noisy first 2 drops
      prevBandRef.current = newBand;

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
        // prevBandRef already updated above — no late transition on the next drop
      } else {
        // PHASE 23: Band-transition-aware reaction (SORTV2-10).
        // When band crosses a threshold (and we have ≥3 drops for signal stability),
        // the tone-shift reaction takes priority — the player hears the band change.
        // Otherwise: specific-item reaction first, then nonce-cycled band fallback.
        const specificReaction = getNPCReactionForItem(npcDisplay.id, item.id, isCorrect);
        const reaction = bandChanged
          ? getNPCFallbackReaction(npcDisplay.id, newBand, newTotalDrops)   // tone shift takes priority
          : specificReaction ?? getNPCFallbackReaction(npcDisplay.id, newBand, newTotalDrops);
        setCurrentReactionText(reaction.text);
        setCurrentReactionVariant(reaction.variant ?? 'neutral');
      }

      setTotalDropsSoFar((n) => n + 1);

      // ── PHASE 24: Document lifecycle chain (SORTV2-11/12/13) ─────────────────
      // 350ms ink-mark dwell (inside the 250-400ms spec) → exiting → next doc slides in
      const isLastDoc = currentDocIndex === totalCount - 1;

      const t1 = setTimeout(() => {
        setDocAnimState('exiting');
      }, 350);
      cascadeTimersRef.current.push(t1);

      if (!isLastDoc) {
        // Advance to next document after exit completes
        const t2 = setTimeout(() => {
          setCurrentDocIndex((i) => i + 1);
          setStampedKind(null);
          setLastWasCorrect(null);
          setDocAnimState('entering');
          eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_paper', volume: 0.5 });
        }, 650); // 350ms stamp dwell + 300ms exit
        cascadeTimersRef.current.push(t2);

        const t3 = setTimeout(() => {
          setDocAnimState('active');
        }, 950); // 650ms advance + 300ms slide-in
        cascadeTimersRef.current.push(t3);
      } else {
        // Last document — skip slide-in beats; advance index past end so Completion Effect 1 fires.
        // No paper SFX for a document that doesn't exist.
        const t2 = setTimeout(() => {
          setCurrentDocIndex((i) => i + 1);
          setStampedKind(null);
          setLastWasCorrect(null);
          setDocAnimState('entering');
        }, 650); // 350ms stamp dwell + 300ms exit
        cascadeTimersRef.current.push(t2);
      }
    },
    [phase, docAnimState, shiftOver, docSet.items, currentDocIndex, correctCount, totalDropsSoFar, totalCount, npcDisplay.id],
  );

  /**
   * Completion Effect 1 — when all docs stamped (or shift expired while no doc animating),
   * flip phase to 'completing'. Condition uses currentDocIndex >= totalCount (pile empty)
   * OR (shiftOver while docAnimState is active/entering — no stamp in flight).
   *
   * The docAnimState guard lets a document that was already stamped when the clock hit 0:00
   * finish its exit and count (it was committed in time).
   *
   * DO NOT merge Effects 1, 2, or 3 — commit 90f41b3 fixed the original bug where a
   * single merged effect cleared its own timeout via the phase flip it triggered.
   * Each effect has exactly the dep it depends on; the others must remain separate.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (
      phase === 'sorting' &&
      (currentDocIndex >= totalCount ||
        (shiftOver && (docAnimState === 'active' || docAnimState === 'entering')))
    ) {
      setPhase('completing');
    }
  }, [phase, currentDocIndex, totalCount, shiftOver, docAnimState]);

  /**
   * Completion Effect 2 — after entering 'completing', wait for the anticipation beat
   * (Commandment 2: silence before reward), play fanfare, then enter 'celebrating'.
   *
   * Beat duration:
   *   - Normal: 600ms
   *   - If the final stamp was the HOLD IT item: 2200ms — lets the HOLD IT reveal breathe
   *     before the celebration overlay appears. holdItReveal only changes via final stamp
   *     here, so no clear-own-timeout hazard.
   *
   * The fanfare now accompanies the celebration overlay's appearance (not the debrief handoff).
   * Same single emission, moved one beat earlier.
   *
   * DO NOT merge with Effects 1 or 3. See Effect 1 comment above.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'completing') return;
    const beatDuration = holdItReveal ? 2200 : 600;
    const t = setTimeout(() => {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.7 });
      setPhase('celebrating');
    }, beatDuration);
    return () => clearTimeout(t);
  }, [phase, holdItReveal]);

  /**
   * Completion Effect 3 (PHASE 23 — SORTV2-09) — after entering 'celebrating',
   * show SorterCompletionOverlay for ~1.2s then fire onComplete.
   *
   * Deps: [phase, correctCount, totalCount, encounterId, onComplete, docSet.takeaways]
   * None of these change during 'celebrating', so the timeout survives without being cleared.
   * scoreContribution formula Math.round((correctCount / totalCount) * 12) is sacred — unchanged.
   * totalCount = docSet.items.length (FULL set) — timer-expired unstamped items don't score
   * but are counted in the denominator, giving honest proportional score (SORTV2-14 decision).
   *
   * DO NOT merge with Effects 1 or 2. See Effect 1 comment above.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'celebrating') return;
    const t = setTimeout(() => {
      const scoreContribution = Math.round((correctCount / totalCount) * 12);
      onComplete({
        encounterId,
        correctCount,
        totalCount,
        scoreContribution,
        takeaways: docSet.takeaways,
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, correctCount, totalCount, encounterId, onComplete, docSet.takeaways]);

  /**
   * Keyboard handler — only active in 'sorting' phase.
   * ← focus KEEP stamp, → focus REDACT stamp, Enter/Space commit, Esc abort.
   * focusedStamp stays sticky between documents so → Enter Enter Enter rapid-stamps correctly.
   * handleStamp's own guards make mid-animation presses harmless.
   * No ArrowUp/ArrowDown — items are no longer a scrollable list.
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
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedStamp('keep');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedStamp('redact');
      }
      if ((e.key === 'Enter' || e.key === ' ') && focusedStamp) {
        e.preventDefault();
        handleStamp(focusedStamp);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, focusedStamp, handleStamp, onAbort]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const currentItem = docSet.items[currentDocIndex];
  // "Stamped so far" count for progress header — includes the doc currently stamping/exiting
  const stampedCount = Math.min(
    currentDocIndex + (docAnimState === 'stamped' || docAnimState === 'exiting' ? 1 : 0),
    totalCount,
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  // Root div + backdrop + close button + shake-surface discipline unchanged —
  // close button, NPCReactionBubble, wrongFeedback toast, SorterCompletionOverlay all stay
  // OUTSIDE the shake surface (Phase 23-02 decision: shaking anchored overlays looks like a bug).
  return (
    <div
      className="absolute inset-0 z-40 bg-black/85 flex flex-col items-stretch justify-center p-6"
      data-testid="phi-sorter-overlay"
    >
      {/* Close button — exits without scoring, encounter remains replayable.
          Kept outside shake surface — anchored overlay, shaking it would look like a bug. */}
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

      {/* PHASE 24: NPC reaction bubble with persistent portrait (SORTV2-15).
          spriteUrl = resolved sprite path → portrait+name always visible, bubble hides when empty.
          Kept outside shake surface — anchored overlay, shaking it would look like a bug. */}
      <NPCReactionBubble
        npcName={npcDisplay.name}
        npcRole={npcDisplay.role}
        text={currentReactionText}
        variant={currentReactionVariant}
        holdIt={holdItReveal ?? undefined}
        spriteUrl={npcSpriteUrl}
      />

      {/* PHASE 23: Shake surface — wraps only the main content (progress header + desk + keyboard hint).
          The root div stays fixed (it owns the dark backdrop); the inner wrapper moves.
          When not shaking, flex layout is identical to the previous flat structure. */}
      <div
        className={isShaking ? 'flex flex-col flex-1 animate-[sorter-shake_80ms_ease-in-out]' : 'flex flex-col flex-1'}
        data-testid="sorter-shake-surface"
      >
        {/* Progress header — SORTV2-06: includes NPC name for in-encounter context.
            PHASE 23: Appended score readout with pulse animation (SORTV2-10).
            PHASE 24: "sorted" count reflects stamped docs including the doc currently exiting. */}
        <div
          className="text-center text-white mb-4 mt-20"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          data-testid="text-sorter-progress"
        >
          HELPING {npcDisplay.name.toUpperCase()} &middot; {stampedCount} / {totalCount} sorted &middot; {correctCount} correct
          {' '}&middot; SCORE{' '}
          {/* Re-keying the leaf span restarts the animation on every correct stamp (SORTV2-10).
              inline-block is required for transform-based scale to render. */}
          <span
            key={scorePulseNonce}
            className="inline-block animate-[sorter-score-pulse_0.3s_ease-out] text-[#FFD93D]"
            data-testid="sorter-score"
          >
            {sorterScore}
          </span>
        </div>

        {/* PHASE 24: Desk surface containing all desk components */}
        <DeskSurface>
          {/* ShiftClock — absolute top-right of desk */}
          <div className="absolute top-3 right-3 z-10">
            <ShiftClock secondsLeft={secondsLeft} totalSeconds={docSet.shiftSeconds} />
          </div>

          {/* Outgoing tray layout: KEEP left | document center | REDACT right */}
          <div className="flex flex-row items-end justify-between px-4 py-6 min-h-[280px]">
            {/* KEEP tray — left edge */}
            <OutgoingTray kind="keep" count={trayCounts.not_phi} />

            {/* DeskDocument — centered, keyed by item.id so each doc remounts and replays slide-in */}
            <div className="flex-1 mx-4 flex items-center justify-center">
              {currentItem && currentDocIndex < totalCount ? (
                <DeskDocument
                  key={currentItem.id}
                  item={currentItem}
                  animState={docAnimState}
                  stampedKind={stampedKind}
                  wasCorrect={lastWasCorrect}
                />
              ) : null}
            </div>

            {/* REDACT tray — right edge */}
            <OutgoingTray kind="redact" count={trayCounts.phi} />
          </div>

          {/* StampPad — bottom-center of desk */}
          <div className="flex justify-center pb-5">
            <StampPad
              focusedStamp={focusedStamp}
              pressedStamp={pressedStamp}
              disabled={docAnimState !== 'active' || phase !== 'sorting' || shiftOver}
              onStamp={handleStamp}
              onHover={setFocusedStamp}
            />
          </div>
        </DeskSurface>

        {/* Keyboard hint footer */}
        <div
          className="text-center text-white/60 mt-4"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
        >
          CLICK A STAMP &middot; OR &#x2190; KEEP / REDACT &#x2192; &middot; ENTER TO STAMP &middot; ESC TO EXIT
        </div>
      </div>
      {/* END shake surface */}

      {/* Wrong-answer educational feedback toast — visible ≥3s (Commandment 4).
          Kept outside shake surface — anchored overlay, shaking it would look like a bug. */}
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

      {/* PHASE 23: Celebration overlay — shown during 'celebrating' phase for ~1.2s (SORTV2-09).
          z-[60] sits above the sorter overlay (z-40) and NPC bubble (z-50).
          pointer-events-none so the close button beneath stays moot for 1.2s — acceptable. */}
      {phase === 'celebrating' && (
        <SorterCompletionOverlay correctCount={correctCount} totalCount={totalCount} />
      )}
    </div>
  );
}
