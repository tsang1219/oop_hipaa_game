/**
 * EncounterRequestModal — Shown when the player presses SPACE on an NPC marked
 * with an encounterTrigger (Phase 16 NPC-driven trigger refactor, 2026-05-08).
 *
 * Replaces the proximity-tile auto-pop. Player must explicitly choose to start
 * the encounter — "Sure, let's do this" launches the sorter; "Maybe later"
 * dismisses the modal and resumes exploration with no penalty.
 *
 * Keyboard:
 *   Enter / 1 → accept
 *   Esc / 2   → decline
 */

import { useEffect, useState } from 'react';

export type EncounterRequestModalProps = {
  npcName: string;
  npcRole?: string;        // e.g., "Intake Volunteer", "Lab Aide"
  requestText: string;     // The NPC's ask
  acceptLabel?: string;    // Default: "Sure, let's do this"
  declineLabel?: string;   // Default: "Maybe later"
  onAccept: () => void;
  onDecline: () => void;
};

export function EncounterRequestModal({
  npcName,
  npcRole,
  requestText,
  acceptLabel = 'SURE, LET’S DO THIS',
  declineLabel = 'MAYBE LATER',
  onAccept,
  onDecline,
}: EncounterRequestModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === '1') {
        e.preventDefault();
        onAccept();
      } else if (e.key === 'Escape' || e.key === '2') {
        e.preventDefault();
        onDecline();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAccept, onDecline]);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/80' : 'bg-black/0'
      }`}
      data-testid="encounter-request-modal"
    >
      <div
        className={`max-w-md w-full mx-4 border-4 border-[#4FB3D9] bg-[#1a2a3e] shadow-[0_0_40px_rgba(79,179,217,0.2)] transform transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}
      >
        {/* NPC name header */}
        <div className="bg-[#0f1a2a] border-b-2 border-[#4FB3D9]/40 px-4 py-3">
          <p
            className="text-[#4FB3D9]"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            data-testid="encounter-request-npc-name"
          >
            {npcName}
          </p>
          {npcRole && (
            <p
              className="text-white/50 mt-1"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
            >
              {npcRole}
            </p>
          )}
        </div>

        {/* Request text */}
        <div className="px-5 py-5">
          <p
            className="text-white"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', lineHeight: '1.8' }}
            data-testid="encounter-request-text"
          >
            {requestText}
          </p>
        </div>

        {/* Choice buttons */}
        <div className="px-5 pb-5 flex flex-col gap-3">
          <button
            onClick={onAccept}
            data-testid="button-encounter-accept"
            className="w-full py-3 bg-[#1f4a3a] hover:bg-[#2a6350] border-2 border-[#7FE5C0]/60 text-white transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
          >
            {acceptLabel}
          </button>
          <button
            onClick={onDecline}
            data-testid="button-encounter-decline"
            className="w-full py-3 bg-[#2a2a3a] hover:bg-[#3a3a4a] border-2 border-white/30 text-white/80 transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
          >
            {declineLabel}
          </button>
        </div>

        {/* Keyboard hint */}
        <div
          className="px-5 pb-4 text-center text-white/40"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
        >
          ENTER TO ACCEPT &middot; ESC TO DECLINE
        </div>
      </div>
    </div>
  );
}
