/**
 * FeedbackModal — the 💬 in-game feedback channel.
 *
 * One button, four types (🐛 Bug · 💡 Idea · 😕 Confusing · ❤️ Loved it) and a
 * text box. On submit it snapshots the game state + a screenshot and POSTs to
 * /api/feedback (a Vercel serverless function that forwards to Slack). The state
 * context — current room, last 50 actions, screenshot — is what makes each report
 * actionable, especially "😕 Confusing" tied to the room the player was stuck in.
 *
 * Mirrors the codex/tutorial overlay pattern: renders absolute inset-0 as a
 * sibling of <PhaserGame>; the parent pauses/resumes Phaser around open/close.
 *
 * Graceful degradation: if the POST fails or the endpoint is absent (offline, or
 * the GitHub Pages build where /api doesn't run), we never lose the report —
 * the player gets a "Copy to clipboard" fallback.
 */

import type Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import type { UnifiedGameState } from '@/hooks/useGameState';
import {
  FEEDBACK_TYPES,
  type FeedbackType,
  collectFeedbackSnapshot,
  captureScreenshot,
} from '@/lib/feedback';

export type FeedbackModalProps = {
  gameRef: React.RefObject<Phaser.Game | null>;
  gameState: UnifiedGameState | null;
  onClose: () => void;
};

type Status = 'idle' | 'sending' | 'sent' | 'failed';

const ACCENT = '#4FB3D9';

export function FeedbackModal({ gameRef, gameState, onClose }: FeedbackModalProps) {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSnapshotRef = useRef<string>('');

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4, rate: 1.1 });
    // Focus the box on the next tick so the transition doesn't eat the focus.
    const t = setTimeout(() => textareaRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (status !== 'sending') onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, status]);

  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && status !== 'sending';

  const handleSubmit = async () => {
    if (!canSend) {
      textareaRef.current?.focus();
      return;
    }
    setStatus('sending');
    const snapshot = collectFeedbackSnapshot(type, trimmed, gameState);
    const screenshotDataUrl = await captureScreenshot(gameRef.current);
    // Stash a copy for the clipboard fallback so a failed send never loses input.
    lastSnapshotRef.current = compactReport(snapshot);
    try {
      const res = await apiRequest('POST', '/api/feedback', {
        type,
        message: trimmed,
        snapshot,
        screenshotDataUrl,
      });
      const body = (await res.json().catch(() => ({}))) as { delivered?: boolean };
      // Success ONLY on an explicit {delivered:true}. Anything else — a 200 that's
      // actually the SPA index.html (Express dev / static-host fallback where /api
      // doesn't run), {delivered:false} (not configured), or unparseable — falls
      // through to the copy-to-clipboard path so no report is silently lost.
      if (body.delivered === true) {
        setStatus('sent');
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.5 });
        setTimeout(onClose, 1100);
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lastSnapshotRef.current);
      setStatus('sent');
      setTimeout(onClose, 900);
    } catch {
      // Clipboard blocked — leave the textarea content in place so nothing is lost.
    }
  };

  const activeType = FEEDBACK_TYPES.find((t) => t.id === type)!;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/85' : 'bg-black/0'
      }`}
      data-testid="feedback-modal"
    >
      <div
        className={`max-w-md w-[92%] border-4 bg-[#10182a] transform transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}
        style={{ borderColor: ACCENT, boxShadow: `0 0 50px ${ACCENT}2e` }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b-2 flex items-center justify-between" style={{ borderBottomColor: `${ACCENT}55` }}>
          <h2 className="text-white text-[11px]" style={{ fontFamily: '"Press Start 2P"' }}>
            💬 Send feedback
          </h2>
          <button
            onClick={onClose}
            disabled={status === 'sending'}
            className="text-gray-400 hover:text-white text-sm disabled:opacity-40"
            aria-label="Close feedback"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          {status === 'sent' ? (
            <p className="text-center text-white text-[10px] py-6" style={{ fontFamily: '"Press Start 2P"' }}>
              Thank you! 🙌
            </p>
          ) : (
            <>
              {/* Type row */}
              <div className="flex gap-1.5 mb-3">
                {FEEDBACK_TYPES.map((t) => {
                  const on = t.id === type;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 border-2 transition-colors ${
                        on ? 'bg-black/40' : 'bg-transparent hover:bg-black/20'
                      }`}
                      style={{ borderColor: on ? ACCENT : '#2a3550' }}
                      data-testid={`feedback-type-${t.id}`}
                      aria-pressed={on}
                    >
                      <span className="text-base leading-none">{t.emoji}</span>
                      <span
                        className="text-[6px] text-gray-300"
                        style={{ fontFamily: '"Press Start 2P"' }}
                      >
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
                }}
                placeholder={placeholderFor(activeType.id)}
                rows={4}
                className="w-full bg-[#0a1120] border-2 border-[#2a3550] text-gray-100 text-[11px] p-2 resize-none focus:outline-none focus:border-[#4FB3D9]"
                style={{ fontFamily: '"Pixelify Sans", sans-serif' }}
              />

              <p className="mt-2 text-[7px] text-gray-500 leading-relaxed" style={{ fontFamily: '"Press Start 2P"' }}>
                Includes your current room, recent actions &amp; a screenshot. No personal data.
              </p>

              {status === 'failed' && (
                <div className="mt-3 border-2 border-amber-600/60 bg-amber-900/20 p-2">
                  <p className="text-[8px] text-amber-300 leading-relaxed mb-2" style={{ fontFamily: '"Press Start 2P"' }}>
                    Couldn't send automatically.
                  </p>
                  <button
                    onClick={handleCopy}
                    className="text-[8px] text-white border-2 border-amber-500 px-2 py-1 hover:bg-amber-500/20"
                    style={{ fontFamily: '"Press Start 2P"' }}
                  >
                    Copy report to clipboard
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  disabled={status === 'sending'}
                  className="text-[9px] text-gray-400 hover:text-white px-3 py-2 disabled:opacity-40"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSend}
                  className="text-[9px] text-white border-2 px-3 py-2 disabled:opacity-40 transition-colors"
                  style={{ fontFamily: '"Press Start 2P"', borderColor: ACCENT, backgroundColor: `${ACCENT}22` }}
                  data-testid="feedback-submit"
                >
                  {status === 'sending' ? 'Sending…' : 'Send →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function placeholderFor(type: FeedbackType): string {
  switch (type) {
    case 'bug':
      return 'What broke? What did you expect to happen?';
    case 'idea':
      return "Something you'd love to see…";
    case 'confusing':
      return 'What was unclear here?';
    case 'loved':
      return 'What made you smile?';
  }
}

/** Plain-text fallback the player can paste to us if the send fails. */
function compactReport(snapshot: ReturnType<typeof collectFeedbackSnapshot>): string {
  const c = snapshot.context;
  return [
    `[${snapshot.type.toUpperCase()}] ${snapshot.message}`,
    '',
    `room: ${c.currentRoomId ?? '—'}  act: ${c.currentAct ?? '—'}  score: ${c.unifiedScore ?? '—'}`,
    `pos: ${c.playerPosition ? `${c.playerPosition.tileX},${c.playerPosition.tileY}` : '—'}  scene: ${c.sceneReady ?? '—'}`,
    `url: ${c.url}`,
    `ua: ${c.userAgent}`,
  ].join('\n');
}
