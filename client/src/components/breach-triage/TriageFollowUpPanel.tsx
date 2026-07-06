/**
 * TriageFollowUpPanel — Two-step notification follow-up panel.
 *
 * Shown as a centered modal over the incident board after a REPORTABLE classification.
 * Two sequential steps:
 *   1. notify  — "Who has to hear about this?"
 *   2. timeline — "And by when?"
 *
 * Each step shows 3 options labeled [1] [2] [3]. Keyboard-first design:
 * number keys 1/2/3 commit a pick directly (handled by BreachTriageOverlay's keydown listener,
 * which reads `followUpState.step` to route the keypress here).
 *
 * When `wrongPick` is set:
 *   - The picked option is shown struck-through in red
 *   - The explanation appears in an amber teaching box below
 *   - A 3000ms dwell is enforced by BreachTriageOverlay (timers frozen during dwell)
 */

import type { TriageIncident, TriageOption } from '@/data/triageData';

export type TriageFollowUpPanelProps = {
  incident: TriageIncident;
  step: 'notify' | 'timeline';
  wrongPick: TriageOption | null;
  onPick: (option: TriageOption) => void;
};

export function TriageFollowUpPanel({ incident, step, wrongPick, onPick }: TriageFollowUpPanelProps) {
  if (!incident.followUp) return null;

  const { notifyPrompt, notifyOptions, timelinePrompt, timelineOptions } = incident.followUp;
  const prompt = step === 'notify' ? notifyPrompt : timelinePrompt;
  const options = step === 'notify' ? notifyOptions : timelineOptions;

  const stepLabel = step === 'notify' ? 'STEP 1 OF 2 — NOTIFY' : 'STEP 2 OF 2 — TIMELINE';

  return (
    /* Full-screen overlay — dims the incident board behind it */
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/75"
      data-testid="triage-follow-up-panel"
    >
      <div
        className="max-w-lg w-full mx-4 bg-[#1a1a2e] border-4 border-[#fbbf24] shadow-[0_0_40px_rgba(251,191,36,0.2)]"
      >
        {/* Header */}
        <div className="bg-[#2a2a0a] border-b-4 border-[#fbbf24] px-4 py-3">
          <p
            className="text-[#fbbf24] mb-1"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
          >
            INCIDENT FLAGGED REPORTABLE — NOW WHAT?
          </p>
          <p
            className="text-white/60"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
          >
            {stepLabel}
          </p>
        </div>

        {/* Incident headline + fact chips for context — the decision facts stay visible */}
        <div className="px-4 pt-3 pb-2">
          <p
            className="text-[#fbbf24]/80 mb-2"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
          >
            RE: {incident.headline}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {incident.facts.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-[#0d0d20] border border-[#4a4a7e] px-1.5 py-0.5 text-white/80"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', lineHeight: '1' }}
              >
                <span style={{ fontSize: '9px', lineHeight: '1' }}>{f.icon}</span>
                {f.text}
              </span>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="px-4 pb-3">
          <p
            className="text-white"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', lineHeight: '1.6' }}
            data-testid="follow-up-prompt"
          >
            {prompt}
          </p>
        </div>

        {/* Options */}
        <div className="px-4 pb-3 space-y-2">
          {options.map((option, idx) => {
            const keyNum = idx + 1;
            const isWrongPick = wrongPick?.id === option.id;

            return (
              <button
                key={option.id}
                onClick={() => !wrongPick && onPick(option)}
                disabled={!!wrongPick}
                data-testid={`follow-up-option-${keyNum}`}
                className={`w-full text-left px-3 py-2 border-2 transition-colors ${
                  isWrongPick
                    ? 'border-[#ef4444] bg-[#3a0a0a] opacity-80'
                    : 'border-[#3a3a5e] bg-[#2a2a3e] hover:border-[#4FB3D9] hover:bg-[#1a2a3e]'
                } ${wrongPick && !isWrongPick ? 'opacity-40' : ''}`}
              >
                <span
                  className={`${isWrongPick ? 'text-[#ef4444] line-through' : 'text-white'}`}
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', lineHeight: '1.6' }}
                >
                  [{keyNum}] {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Wrong-pick explanation — §164.404-410 lesson moment (readable prose) */}
        {wrongPick && (
          <div
            className="mx-4 mb-4 border-2 border-[#fbbf24] bg-[#2a1a00] p-3"
            data-testid="follow-up-wrong-explanation"
          >
            <p
              className="text-[#fbbf24] mb-2"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
            >
              NOT QUITE
            </p>
            <p
              className="text-white/95"
              style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.4', letterSpacing: '0.01em' }}
            >
              {wrongPick.explanation}
            </p>
          </div>
        )}

        {/* Key hint */}
        <div className="px-4 pb-3">
          <p
            className="text-white/40 text-center"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
          >
            [1] [2] [3] SELECT
          </p>
        </div>
      </div>
    </div>
  );
}
