/**
 * BreachTriageOverlay — Breach Triage encounter game loop.
 *
 * A 3-slot whack-a-mole incident board. Up to 3 incidents are visible simultaneously,
 * each with its own depleting timer bar. Incidents spawn at an escalating cadence.
 * Keyboard-only path: 1/2/3 focus a slot, R/N classify, 1/2/3 answer follow-ups, Esc aborts.
 *
 * Correct classification of a reportable incident opens the two-step TriageFollowUpPanel.
 * Wrong answers show the classificationExplanation (3s dwell, board frozen — player is reading).
 * After all 9 incidents resolve, a 600ms beat precedes fanfare + onComplete.
 *
 * Feedback (CLAUDE.md Commandments 1 & 8 — every beat pairs audio + visual):
 *   - spawn: sfx_interact 0.3 + card slide-in
 *   - correct: sfx_sorter_correct 0.7 + green pulse, slot frees after ~350ms
 *   - wrong: sfx_sorter_wrong 0.7 + red shake + explanation toast (3s, board frozen)
 *   - time-up: sfx_breach_alert 0.25 + "TOO SLOW" stamp ~1s, slot frees
 *   - 2+ slots occupied: pulsing red vignette overlay
 *   - 3 slots full: sfx_breach_alert 0.2 once per full-board episode
 *   - completion: 600ms beat → sfx_fanfare 0.7 → onComplete
 *
 * NOTE: TriageDebrief is NOT imported here — UnifiedGamePage owns the debrief render
 * (same separation as PHISorterOverlay/SorterDebrief per BLOCKER-2 precedent).
 *
 * SFX keys (all preloaded in BootScene — do NOT add new preloads):
 *   correct: sfx_sorter_correct 0.7
 *   wrong/miss: sfx_sorter_wrong 0.7
 *   spawn: sfx_interact 0.3
 *   urgency: sfx_breach_alert 0.25 (board full: 0.2)
 *   fanfare: sfx_fanfare 0.7
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import {
  getTriageIncidentSet,
  type TriageIncident,
  type TriageOption,
} from '@/data/triageData';
import { TriageIncidentCard } from './TriageIncidentCard';
import { TriageFollowUpPanel } from './TriageFollowUpPanel';

// ── Public contract ───────────────────────────────────────────────────────────

export type BreachTriageOverlayProps = {
  incidentSetId: string;     // 'breach-triage-set-1'
  encounterId: string;       // 'breach-triage-er' — round-trips into onComplete
  onComplete: (result: {
    encounterId: string;
    correctCount: number;
    totalCount: number;          // 9 classifications + 2 per follow-up shown
    scoreContribution: number;   // Math.round((correctCount/totalCount) * 12)
    avgResponseMs: number;       // mean spawn→classification time; 0 if none
    takeaways: [string, string]; // pass-through from set.takeaways
  }) => void;
  onAbort?: () => void;         // Esc / X — no scoring, caller handles replayability
};

// ── Internal state types ──────────────────────────────────────────────────────

type ActiveIncident = {
  incident: TriageIncident;
  spawnedAt: number;       // performance.now() when spawned
  remainingMs: number;     // counts down to 0
  totalMs: number;         // full timer for this difficulty
  feedback: 'correct' | 'wrong' | 'expired' | null;
};

type FollowUpState = {
  incident: TriageIncident;
  step: 'notify' | 'timeline';
  wrongPick: TriageOption | null;
};

type Phase = 'triaging' | 'completing';

// ── Timing helpers ────────────────────────────────────────────────────────────

function difficultyToMs(difficulty: 1 | 2 | 3): number {
  if (difficulty === 1) return 14000;
  if (difficulty === 2) return 12000;
  return 10000;
}

/** Spawn delay for the i-th incident (0-indexed). First fires 600ms after mount. */
function spawnDelay(i: number): number {
  return Math.max(2000, 3500 - i * 200);
}

// ── Component ────────────────────────────────────────────────────────────────

export function BreachTriageOverlay({
  incidentSetId,
  encounterId,
  onComplete,
  onAbort,
}: BreachTriageOverlayProps) {
  const set = useMemo(() => getTriageIncidentSet(incidentSetId), [incidentSetId]);

  // ── Error fallback — unknown set ID ──────────────────────────────────────────
  if (!set) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
        <div className="bg-[#2a2a3e] border-4 border-red-500 p-6 max-w-sm">
          <p
            className="text-white mb-4"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            Triage set not found: {incidentSetId}
          </p>
          <button
            onClick={() =>
              onComplete({
                encounterId,
                correctCount: 0,
                totalCount: 0,
                scoreContribution: 0,
                avgResponseMs: 0,
                takeaways: ['', ''],
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

  // ── State ─────────────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [phase, setPhase] = useState<Phase>('triaging');

  // 3 fixed slots — null = empty
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [slots, setSlots] = useState<(ActiveIncident | null)[]>([null, null, null]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [focusedSlot, setFocusedSlot] = useState<0 | 1 | 2 | null>(null);
  // Follow-up panel state
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [followUpState, setFollowUpState] = useState<FollowUpState | null>(null);
  // Wrong-answer explanation toast (3s dwell, board frozen)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [explanationToast, setExplanationToast] = useState<{ text: string } | null>(null);
  // Mirror tallies from refs to state for header display
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [tallies, setTallies] = useState({ correct: 0, triaged: 0 });

  // Mutable refs — avoid stale closures in setInterval tick
  const correctCountRef = useRef(0);
  const totalCountRef = useRef(9);       // 9 classifications; +2 per follow-up shown
  const responseTimesRef = useRef<number[]>([]);
  const spawnIndexRef = useRef(0);       // count of spawns executed
  const nextSpawnMsRef = useRef(600);    // ms until next spawn (initial mount delay = 600)
  const boardFullFiredRef = useRef(false);
  const queueRef = useRef<TriageIncident[]>([...set.incidents]);
  const slotsRef = useRef<(ActiveIncident | null)[]>([null, null, null]);
  const frozenRef = useRef(false);       // gating ref — interval reads this, not component state
  const phaseRef = useRef<Phase>('triaging');

  // Keep refs in sync with state
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { slotsRef.current = slots; }, [slots]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // frozen = follow-up panel open OR explanation toast showing OR not triaging
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    frozenRef.current = followUpState !== null || explanationToast !== null || phaseRef.current !== 'triaging';
  }, [followUpState, explanationToast, phase]);

  // ── Auto-focus: keep oldest occupied slot focused when focused slot resolves ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'triaging') return;
    setFocusedSlot((prev) => {
      // If the focused slot is still active, keep it
      if (prev !== null && slots[prev] !== null && slots[prev]?.feedback === null) {
        return prev;
      }
      // Find the oldest occupied active slot
      const firstActive = slots.findIndex((s) => s !== null && s.feedback === null);
      return firstActive >= 0 ? (firstActive as 0 | 1 | 2) : null;
    });
  }, [slots, phase]);

  // ── Classify handler ─────────────────────────────────────────────────────────
  const classifySlot = useCallback(
    (slotIdx: number, reportable: boolean) => {
      const slot = slotsRef.current[slotIdx];
      if (!slot || slot.feedback !== null || phaseRef.current !== 'triaging') return;
      if (frozenRef.current) return;

      const incident = slot.incident;
      const responseMs = performance.now() - slot.spawnedAt;
      responseTimesRef.current.push(responseMs);

      const isCorrect = incident.reportable === reportable;

      if (isCorrect) {
        correctCountRef.current += 1;
        setTallies((t) => ({ correct: t.correct + 1, triaged: t.triaged + 1 }));
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.7 });

        // Mark correct feedback on the card
        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]) next[slotIdx] = { ...next[slotIdx]!, feedback: 'correct' };
          return next;
        });

        if (reportable && incident.followUp) {
          // Increment total for the 2 follow-up questions
          totalCountRef.current += 2;
          // After brief visual beat, open follow-up and free the slot
          setTimeout(() => {
            setFollowUpState({ incident, step: 'notify', wrongPick: null });
            setSlots((prev) => {
              const next = [...prev];
              next[slotIdx] = null;
              return next;
            });
          }, 350);
        } else {
          // Non-reportable correct: free slot after green pulse
          setTimeout(() => {
            setSlots((prev) => {
              const next = [...prev];
              if (next[slotIdx]?.feedback === 'correct') next[slotIdx] = null;
              return next;
            });
          }, 350);
        }
      } else {
        // Wrong classification
        setTallies((t) => ({ ...t, triaged: t.triaged + 1 }));
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_wrong', volume: 0.7 });
        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]) next[slotIdx] = { ...next[slotIdx]!, feedback: 'wrong' };
          return next;
        });
        setExplanationToast({ text: incident.classificationExplanation });

        // After 3s dwell, free the slot and clear toast
        setTimeout(() => {
          setExplanationToast(null);
          setSlots((prev) => {
            const next = [...prev];
            if (next[slotIdx]?.feedback === 'wrong') next[slotIdx] = null;
            return next;
          });
        }, 3000);
      }
    },
    // classifySlot reads from refs — no slot/phase deps needed (stale-closure-safe)
    [],
  );

  // ── Follow-up pick handler ───────────────────────────────────────────────────
  const handleFollowUpPick = useCallback(
    (option: TriageOption) => {
      if (!option.correct) {
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_wrong', volume: 0.7 });
        setFollowUpState((fs) => (fs ? { ...fs, wrongPick: option } : null));

        // 3s dwell then advance step or close
        setTimeout(() => {
          setFollowUpState((fs) => {
            if (!fs) return null;
            if (fs.step === 'notify') return { ...fs, step: 'timeline', wrongPick: null };
            return null; // timeline step wrong → close follow-up
          });
        }, 3000);
      } else {
        correctCountRef.current += 1;
        setTallies((t) => ({ correct: t.correct + 1, triaged: t.triaged }));
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.7 });

        setFollowUpState((fs) => {
          if (!fs) return null;
          if (fs.step === 'notify') return { ...fs, step: 'timeline', wrongPick: null };
          return null; // timeline step correct → close follow-up
        });
      }
    },
    [],
  );

  // ── Hotkeys ──────────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Esc always works
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onAbort) onAbort();
        return;
      }

      // In follow-up phase: 1/2/3 pick options
      if (followUpState !== null) {
        const optKey = ['1', '2', '3'].indexOf(e.key);
        if (optKey >= 0 && !followUpState.wrongPick) {
          e.preventDefault();
          const options =
            followUpState.step === 'notify'
              ? followUpState.incident.followUp!.notifyOptions
              : followUpState.incident.followUp!.timelineOptions;
          const option = options[optKey];
          if (option) handleFollowUpPick(option);
        }
        return;
      }

      // Triaging phase only — board frozen while toast is showing
      if (phaseRef.current !== 'triaging' || frozenRef.current) return;

      // 1/2/3 — focus a slot
      if (['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const idx = (parseInt(e.key, 10) - 1) as 0 | 1 | 2;
        const slot = slotsRef.current[idx];
        if (slot !== null && slot.feedback === null) {
          setFocusedSlot(idx);
        }
        return;
      }

      // R — classify focused slot as REPORTABLE
      if ((e.key === 'r' || e.key === 'R') && focusedSlot !== null) {
        e.preventDefault();
        classifySlot(focusedSlot, true);
        return;
      }

      // N — classify focused slot as NOT REPORTABLE
      if ((e.key === 'n' || e.key === 'N') && focusedSlot !== null) {
        e.preventDefault();
        classifySlot(focusedSlot, false);
        return;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [followUpState, focusedSlot, classifySlot, handleFollowUpPick, onAbort]);

  // ── Single tick engine — spawn + timer decrement + expiry ────────────────────
  // Uses refs for all mutable values so we never need to re-register the interval.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const TICK_MS = 100;

    const interval = setInterval(() => {
      // Gate: frozen means follow-up panel or explanation toast is open
      if (frozenRef.current) return;

      // --- Decrement timers & detect expiries ---
      setSlots((prev) => {
        let changed = false;
        const next = prev.map((slot) => {
          if (!slot || slot.feedback !== null) return slot;
          const newRemaining = Math.max(0, slot.remainingMs - TICK_MS);
          if (newRemaining <= 0) {
            changed = true;
            eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
              key: 'sfx_breach_alert',
              volume: 0.25,
            });
            return { ...slot, remainingMs: 0, feedback: 'expired' as const };
          }
          return { ...slot, remainingMs: newRemaining };
        });
        return changed ? next : prev;
      });

      // --- Spawn next incident ---
      nextSpawnMsRef.current -= TICK_MS;
      if (nextSpawnMsRef.current <= 0 && queueRef.current.length > 0) {
        // Find a free slot
        const currentSlots = slotsRef.current;
        const freeIdx = currentSlots.findIndex((s) => s === null);
        if (freeIdx >= 0) {
          const nextIncident = queueRef.current[0];
          queueRef.current = queueRef.current.slice(1);
          const totalMs = difficultyToMs(nextIncident.difficulty);
          const spawnedAt = performance.now();

          setSlots((prev) => {
            if (prev[freeIdx] !== null) return prev; // race: slot was taken
            const next = [...prev];
            next[freeIdx] = {
              incident: nextIncident,
              spawnedAt,
              remainingMs: totalMs,
              totalMs,
              feedback: null,
            };
            return next;
          });

          eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.3 });
          nextSpawnMsRef.current = spawnDelay(spawnIndexRef.current + 1);
          spawnIndexRef.current += 1;
        } else {
          // No free slot — retry soon
          nextSpawnMsRef.current = 300;
        }
      }

      // --- Board-full urgency cue ---
      const activeCount = slotsRef.current.filter(
        (s) => s !== null && s.feedback === null,
      ).length;
      if (activeCount === 3 && !boardFullFiredRef.current) {
        boardFullFiredRef.current = true;
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_breach_alert', volume: 0.2 });
      } else if (activeCount < 3) {
        boardFullFiredRef.current = false;
      }
    }, TICK_MS);

    return () => clearInterval(interval);
    // Intentionally empty deps: interval runs for the lifetime of the component.
    // All reads go through refs that are always fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Free expired slots after ~1000ms "TOO SLOW" stamp display ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const expiredIndices = slots
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s?.feedback === 'expired')
      .map(({ i }) => i);

    if (expiredIndices.length === 0) return;

    const t = setTimeout(() => {
      setSlots((prev) => {
        const next = [...prev];
        expiredIndices.forEach((i) => {
          if (next[i]?.feedback === 'expired') {
            next[i] = null;
            setTallies((t2) => ({ ...t2, triaged: t2.triaged + 1 }));
          }
        });
        return next;
      });
    }, 1000);

    return () => clearTimeout(t);
  }, [slots]);

  // ── Completion detection ─────────────────────────────────────────────────────
  // Trigger when: queue empty AND all 3 slots null AND no follow-up open
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'triaging') return;
    if (queueRef.current.length > 0) return;
    if (followUpState !== null) return;
    const allResolved = slots.every((s) => s === null);
    if (!allResolved) return;

    setPhase('completing');
  }, [phase, slots, followUpState]);

  // 600ms anticipation beat → sfx_fanfare → onComplete (Commandment 2)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (phase !== 'completing') return;
    const t = setTimeout(() => {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.7 });
      const responseTimes = responseTimesRef.current;
      const avgResponseMs =
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0;
      const correct = correctCountRef.current;
      const total = totalCountRef.current;
      const scoreContribution = total > 0 ? Math.round((correct / total) * 12) : 0;
      onComplete({
        encounterId,
        correctCount: correct,
        totalCount: total,
        scoreContribution,
        avgResponseMs,
        takeaways: set.takeaways,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [phase, encounterId, onComplete, set.takeaways]);

  // ── Derived display ─────────────────────────────────────────────────────────
  const activeSlotCount = slots.filter((s) => s !== null && s.feedback === null).length;
  const showVignette = activeSlotCount >= 2 && phase === 'triaging';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="absolute inset-0 z-40 bg-black/85 flex flex-col"
      data-testid="breach-triage-overlay"
    >
      {/* Escalating tension vignette — pulsing red inset shadow when 2+ active slots */}
      {showVignette && (
        <div
          className="absolute inset-0 pointer-events-none z-10 animate-pulse"
          style={{ boxShadow: 'inset 0 0 60px 20px rgba(239, 68, 68, 0.3)' }}
          data-testid="vignette-urgency"
        />
      )}

      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b-4 border-[#3a3a5e] flex-shrink-0">
        <span
          className="text-[#fbbf24]"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
        >
          INCIDENT TRIAGE &middot; HELPING PRIYA
        </span>
        <div className="flex items-center gap-4">
          <span
            className="text-white/70"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            data-testid="triage-progress-counter"
          >
            {tallies.triaged}/9 triaged &middot; {tallies.correct} correct
          </span>
          {onAbort && (
            <button
              onClick={onAbort}
              aria-label="Abort triage"
              data-testid="button-triage-abort"
              className="bg-[#3a1a2a] hover:bg-[#5a2a3a] text-white border-4 border-[#FF6B9D] w-10 h-10 flex items-center justify-center transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 3-slot incident board */}
      <div className="flex-1 flex flex-row items-stretch gap-3 p-4 min-h-0">
        {slots.map((slot, idx) => {
          const slotNum = (idx + 1) as 1 | 2 | 3;
          if (!slot) {
            return (
              <div
                key={`empty-${idx}`}
                className="flex-1 border-4 border-dashed border-[#2a2a4e] flex items-center justify-center bg-[#0a0a1e]/40"
                data-testid={`slot-empty-${slotNum}`}
              >
                <span
                  className="text-white/20"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
                >
                  — monitoring —
                </span>
              </div>
            );
          }
          return (
            <div key={slot.incident.id} className="flex-1">
              <TriageIncidentCard
                slotNumber={slotNum}
                incident={slot.incident}
                remainingMs={slot.remainingMs}
                totalMs={slot.totalMs}
                focused={focusedSlot === idx}
                feedback={slot.feedback}
                onSelect={() => setFocusedSlot(idx as 0 | 1 | 2)}
                onClassify={(reportable) => {
                  setFocusedSlot(idx as 0 | 1 | 2);
                  classifySlot(idx, reportable);
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Footer key-hint bar */}
      <div
        className="flex-shrink-0 px-4 py-2 bg-[#1a1a2e] border-t-4 border-[#3a3a5e] text-center text-white/50"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
        data-testid="triage-key-hints"
      >
        [1-3] SELECT &middot; [R] REPORTABLE &middot; [N] NOT REPORTABLE &middot; [ESC] LEAVE
      </div>

      {/* Wrong-answer explanation toast — bottom-center amber, 3s dwell */}
      {explanationToast && (
        <div
          className="absolute bottom-14 left-1/2 -translate-x-1/2 max-w-lg w-[90%] bg-[#2a1a00] border-4 border-[#fbbf24] p-4 z-50"
          data-testid="triage-explanation-toast"
        >
          <p
            className="text-[#fbbf24] mb-1"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            WRONG CALL —
          </p>
          <p
            className="text-white/90"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', lineHeight: '1.8' }}
          >
            {explanationToast.text}
          </p>
        </div>
      )}

      {/* Follow-up panel — layered on top of the board */}
      {followUpState && (
        <TriageFollowUpPanel
          incident={followUpState.incident}
          step={followUpState.step}
          wrongPick={followUpState.wrongPick}
          onPick={handleFollowUpPick}
        />
      )}

      {/* Completing phase fade overlay */}
      {phase === 'completing' && (
        <div
          className="absolute inset-0 z-30 bg-black/60 pointer-events-none"
          data-testid="completing-fade"
        />
      )}
    </div>
  );
}
