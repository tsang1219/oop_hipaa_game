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
    points: number;              // arcade points (speed + streak) — display-only
    bestStreak: number;          // longest correct chain this run
    ruleOutcomes: { tag: string; short: string; ok: boolean }[]; // per-incident rule results, queue order
  }) => void;
  onAbort?: () => void;         // Esc / X — no scoring, caller handles replayability
};

// ── Arcade scoring ────────────────────────────────────────────────────────────
// Points are pure juice — they never touch compliance scoring (scoreContribution).
// base 100 per correct call + speed bonus up to 150 scaled by remaining time,
// follow-ups flat 150 — all multiplied by the streak tier (×2 at 3, ×3 at 6).

const POINTS_BASE = 100;
const POINTS_SPEED_MAX = 150;
const POINTS_FOLLOWUP = 150;

function streakMultiplier(streak: number): 1 | 2 | 3 {
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

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

/** Spawn delay for the i-th incident (0-indexed). First fires 300ms after mount.
 *  Tightened from 3500-base (the old cadence left dead single-card stretches —
 *  "drags" was the exact playtest note). Fact chips made reads faster; the
 *  queue can now press. */
function spawnDelay(i: number): number {
  return Math.max(1600, 2600 - i * 150);
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
                points: 0,
                bestStreak: 0,
                ruleOutcomes: [],
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
  // Wrong-answer explanation toast (board frozen while showing — player is reading)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [explanationToast, setExplanationToast] = useState<{ ruleTag: string; text: string } | null>(null);
  // Mirror tallies from refs to state for header display
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [tallies, setTallies] = useState({ correct: 0, triaged: 0 });

  // ── Arcade juice state ──────────────────────────────────────────────────────
  // Points + streak live in refs (interval-safe) and mirror to state for display.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [hud, setHud] = useState({ points: 0, streak: 0 });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [pointsPulseNonce, setPointsPulseNonce] = useState(0);
  // Floating "+230" pops over the slot that earned them
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [pointPops, setPointPops] = useState<{ key: number; slotIdx: number; amount: number }[]>([]);
  // Rule ticker — the correct-answer (and expiry) teaching channel. Non-blocking:
  // names the rule + one sentence while the board keeps ticking.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [ruleTicker, setRuleTicker] = useState<{ key: number; tag: string; short: string; kind: 'correct' | 'missed' } | null>(null);

  // Mutable refs — avoid stale closures in setInterval tick
  const correctCountRef = useRef(0);
  const totalCountRef = useRef(9);       // 9 classifications; +2 per follow-up shown
  const responseTimesRef = useRef<number[]>([]);
  const spawnIndexRef = useRef(0);       // count of spawns executed
  const nextSpawnMsRef = useRef(300);    // ms until next spawn (initial mount delay = 300)
  const boardFullFiredRef = useRef(false);
  const queueRef = useRef<TriageIncident[]>([...set.incidents]);
  const slotsRef = useRef<(ActiveIncident | null)[]>([null, null, null]);
  const frozenRef = useRef(false);       // gating ref — interval reads this, not component state
  const phaseRef = useRef<Phase>('triaging');
  const pointsRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const ruleOutcomesRef = useRef<{ tag: string; short: string; ok: boolean }[]>([]);
  const popKeyRef = useRef(0);

  /** Award points (already multiplied), mirror to HUD, pulse the readout. */
  const awardPoints = (amount: number, slotIdx: number | null) => {
    pointsRef.current += amount;
    setHud({ points: pointsRef.current, streak: streakRef.current });
    setPointsPulseNonce((n) => n + 1);
    if (slotIdx !== null) {
      const key = ++popKeyRef.current;
      setPointPops((pops) => [...pops, { key, slotIdx, amount }]);
      setTimeout(() => {
        setPointPops((pops) => pops.filter((p) => p.key !== key));
      }, 900);
    }
  };

  /** Streak up: bump refs, mirror, chirp on tier milestones (×2 at 3, ×3 at 6). */
  const streakUp = () => {
    streakRef.current += 1;
    bestStreakRef.current = Math.max(bestStreakRef.current, streakRef.current);
    if (streakRef.current === 3 || streakRef.current === 6) {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.5, rate: 1.4 });
    }
    setHud({ points: pointsRef.current, streak: streakRef.current });
  };

  /** Streak broken (wrong call or expiry). */
  const streakReset = () => {
    streakRef.current = 0;
    setHud({ points: pointsRef.current, streak: 0 });
  };

  /** Show the non-blocking rule ticker for ~2.6s (replaced by newer resolutions). */
  const tickerKeyRef = useRef(0);
  const showRuleTicker = (tag: string, short: string, kind: 'correct' | 'missed') => {
    const key = ++tickerKeyRef.current;
    setRuleTicker({ key, tag, short, kind });
    setTimeout(() => {
      setRuleTicker((t) => (t?.key === key ? null : t));
    }, 2600);
  };

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
      ruleOutcomesRef.current.push({ tag: incident.rule.tag, short: incident.rule.short, ok: isCorrect });

      if (isCorrect) {
        correctCountRef.current += 1;
        setTallies((t) => ({ correct: t.correct + 1, triaged: t.triaged + 1 }));
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.7 });

        // Arcade beat: streak first (multiplier applies to this call), then points.
        // Speed bonus scales with time left on the card — fast calls feel fast.
        streakUp();
        const speedBonus = Math.round(POINTS_SPEED_MAX * (slot.remainingMs / slot.totalMs));
        awardPoints((POINTS_BASE + speedBonus) * streakMultiplier(streakRef.current), slotIdx);
        // Teach on CORRECT too — name the rule while the board keeps ticking
        showRuleTicker(incident.rule.tag, incident.rule.short, 'correct');

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
          // Non-reportable correct: hold the ✓ RULE stamp a beat longer than the
          // follow-up path (700ms vs 350ms) — this is the only moment the card
          // teaches, and nothing is waiting behind it.
          setTimeout(() => {
            setSlots((prev) => {
              const next = [...prev];
              if (next[slotIdx]?.feedback === 'correct') next[slotIdx] = null;
              return next;
            });
          }, 700);
        }
      } else {
        // Wrong classification
        setTallies((t) => ({ ...t, triaged: t.triaged + 1 }));
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_wrong', volume: 0.7 });
        streakReset();
        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]) next[slotIdx] = { ...next[slotIdx]!, feedback: 'wrong' };
          return next;
        });
        setExplanationToast({ ruleTag: incident.rule.tag, text: incident.classificationExplanation });

        // After 2.6s dwell, free the slot and clear toast
        setTimeout(() => {
          setExplanationToast(null);
          setSlots((prev) => {
            const next = [...prev];
            if (next[slotIdx]?.feedback === 'wrong') next[slotIdx] = null;
            return next;
          });
        }, 2600);
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
        streakReset();
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
        streakUp();
        awardPoints(POINTS_FOLLOWUP * streakMultiplier(streakRef.current), null);

        setFollowUpState((fs) => {
          if (!fs) return null;
          if (fs.step === 'notify') return { ...fs, step: 'timeline', wrongPick: null };
          return null; // timeline step correct → close follow-up
        });
      }
    },
    // streakUp/awardPoints/streakReset are stable closures over refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // Critical-time chirp: fires once as the card crosses 25% remaining —
          // a higher-pitched tick, distinct from the expiry alert
          const critical = slot.totalMs * 0.25;
          if (slot.remainingMs > critical && newRemaining <= critical && newRemaining > 0) {
            eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
              key: 'sfx_breach_alert',
              volume: 0.12,
              rate: 1.6,
            });
          }
          if (newRemaining <= 0) {
            changed = true;
            eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
              key: 'sfx_breach_alert',
              volume: 0.25,
            });
            // Missed calls still teach: break the streak, log the outcome,
            // and name the rule that just walked out the door.
            streakRef.current = 0;
            ruleOutcomesRef.current.push({
              tag: slot.incident.rule.tag,
              short: slot.incident.rule.short,
              ok: false,
            });
            setHud({ points: pointsRef.current, streak: 0 });
            showRuleTicker(slot.incident.rule.tag, slot.incident.rule.short, 'missed');
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
    }, 800);

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
        points: pointsRef.current,
        bestStreak: bestStreakRef.current,
        ruleOutcomes: ruleOutcomesRef.current,
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
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b-2 border-[#3a3a5e] flex-shrink-0">
        <span
          className="text-[#fbbf24]"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
        >
          INCIDENT TRIAGE &middot; HELPING PRIYA
        </span>
        <div className="flex items-center gap-4">
          {/* Streak chip — visible only while a chain is alive */}
          {hud.streak >= 2 && (
            <span
              className={`px-2 py-1 border-2 ${
                streakMultiplier(hud.streak) >= 3
                  ? 'border-[#ff6b9d] text-[#ff6b9d]'
                  : streakMultiplier(hud.streak) === 2
                  ? 'border-[#fbbf24] text-[#fbbf24]'
                  : 'border-[#4a4a7e] text-white/70'
              }`}
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
              data-testid="triage-streak-chip"
            >
              {streakMultiplier(hud.streak) > 1
                ? `STREAK ${hud.streak} ×${streakMultiplier(hud.streak)}`
                : `STREAK ${hud.streak}`}
            </span>
          )}
          <span
            className="text-white"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
          >
            PTS{' '}
            <span
              key={pointsPulseNonce}
              className="inline-block text-[#FFD93D] animate-[sorter-score-pulse_0.3s_ease-out]"
              data-testid="triage-points"
            >
              {hud.points.toLocaleString()}
            </span>
          </span>
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

      {/* Priya's cheat sheet — the actual Breach Notification Rule structure,
          pinned on screen. The game is applying it fast (Papers Please rulebook). */}
      <div
        className="px-4 py-2 bg-[#12122a] border-b-4 border-[#3a3a5e] flex-shrink-0 flex flex-col gap-1"
        data-testid="triage-rule-strip"
      >
        <p
          className="text-[#7FE5C0]"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', lineHeight: '1.6' }}
        >
          {set.ruleStrip[0]}
        </p>
        <p
          className="text-[#4FB3D9]"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', lineHeight: '1.6' }}
        >
          {set.ruleStrip[1]}
        </p>
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
            <div key={slot.incident.id} className="flex-1 relative">
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
              {/* Floating point pops for this slot */}
              {pointPops
                .filter((p) => p.slotIdx === idx)
                .map((p) => (
                  <div
                    key={p.key}
                    className="absolute left-1/2 top-6 pointer-events-none z-20"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '13px',
                      color: '#FFD93D',
                      textShadow: '2px 2px 0 rgba(0,0,0,0.9), 0 0 12px rgba(255,217,61,0.5)',
                      animation: 'score-float-up 0.9s ease-out forwards',
                      transform: 'translateX(-50%)',
                    }}
                    data-testid="triage-point-pop"
                  >
                    +{p.amount}
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      {/* Rule ticker — non-blocking teaching channel. Correct calls and misses
          both name the governing rule while the board keeps moving. Absolutely
          positioned above the footer so it never reflows the board. */}
      {ruleTicker && (
        <div
          key={ruleTicker.key}
          className={`absolute bottom-12 left-4 right-4 z-20 px-3 py-2 border-2 pointer-events-none ${
            ruleTicker.kind === 'correct'
              ? 'border-[#22c55e]/70 bg-[#0a2a14]/95'
              : 'border-[#fbbf24]/70 bg-[#2a1e00]/95'
          }`}
          style={{ animation: 'ticker-in 0.18s ease-out' }}
          data-testid="triage-rule-ticker"
        >
          <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', lineHeight: '1.7' }}>
            <span className={ruleTicker.kind === 'correct' ? 'text-[#22c55e]' : 'text-[#fbbf24]'}>
              {ruleTicker.kind === 'correct' ? '✓ ' : '⏱ MISSED — '}
              {ruleTicker.tag}
            </span>
            <span className="text-white/85">{'  ·  '}{ruleTicker.short}</span>
          </p>
        </div>
      )}

      {/* Footer key-hint bar */}
      <div
        className="flex-shrink-0 px-4 py-2 bg-[#1a1a2e] border-t-4 border-[#3a3a5e] text-center text-white/50"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
        data-testid="triage-key-hints"
      >
        [1-3] SELECT &middot; [R] REPORTABLE &middot; [N] NOT REPORTABLE &middot; [ESC] LEAVE
      </div>

      {/* Wrong-answer explanation toast — bottom-center amber, board frozen.
          Header names the rule; body is readable prose (not 7px pixel font). */}
      {explanationToast && (
        <div
          className="absolute bottom-14 left-1/2 -translate-x-1/2 max-w-lg w-[90%] bg-[#2a1a00] border-4 border-[#fbbf24] p-4 z-50"
          data-testid="triage-explanation-toast"
        >
          <p
            className="text-[#fbbf24] mb-2"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            WRONG CALL — {explanationToast.ruleTag}
          </p>
          <p
            className="text-white/95"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '1.4', letterSpacing: '0.01em' }}
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
