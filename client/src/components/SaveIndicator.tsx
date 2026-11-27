/**
 * SaveIndicator — the little spinning-disk "SAVED" chip in the bottom-right
 * corner, the way handheld RPGs show an autosave.
 *
 * Driven by saveData's status channel: it lights up only when a write
 * actually changed progress (room entered, person helped, room cleared,
 * encounter finished), never on no-op re-writes. Deliberately silent: an
 * autosave is ambient reassurance, and a chime on every doorway would turn
 * into noise within one hallway.
 *
 * A refused write (storage full or blocked by a private window) gets a red
 * chip that stays longer, so the player learns their progress isn't sticking
 * before they close the tab. It's throttled so a run of failures doesn't nag.
 */

import { useEffect, useRef, useState } from 'react';
import { subscribeSaveStatus, type SaveStatus } from '@/lib/saveData';

const SAVED_MS = 1400;
const FAILED_MS = 4000;
const FAILED_THROTTLE_MS = 30_000;

function DiskIcon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="10" height="10" fill={color} />
      <rect x="2" y="0" width="5" height="3" fill="#000" opacity="0.55" />
      <rect x="2" y="6" width="6" height="4" fill="#fff" opacity="0.85" />
    </svg>
  );
}

export function SaveIndicator(): JSX.Element | null {
  const [status, setStatus] = useState<SaveStatus | null>(null);
  const [pulse, setPulse] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFailedAt = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeSaveStatus(next => {
      if (next === 'failed') {
        const now = Date.now();
        if (now - lastFailedAt.current < FAILED_THROTTLE_MS) return;
        lastFailedAt.current = now;
      }
      setStatus(next);
      setPulse(p => p + 1);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setStatus(null), next === 'failed' ? FAILED_MS : SAVED_MS);
    });
    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!status) return null;
  const failed = status === 'failed';
  const color = failed ? '#FF4D4D' : '#7CFFB2';

  return (
    <div
      key={pulse}
      className="pointer-events-none absolute bottom-2 right-2 z-30 flex items-center gap-1.5 border-2 bg-black/80 px-2 py-1.5 animate-[overlay-fade-in_0.2s_ease-out]"
      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', borderColor: color, color }}
      role="status"
      aria-live="polite"
      data-testid="save-indicator"
      data-status={status}
    >
      <span className={failed ? '' : 'inline-block animate-[codex-slot-pop_0.35s_ease-out]'}>
        <DiskIcon color={color} />
      </span>
      {failed ? "CAN'T SAVE · STORAGE FULL OR BLOCKED" : 'SAVED'}
    </div>
  );
}

export default SaveIndicator;
