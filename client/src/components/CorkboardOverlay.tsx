/**
 * CorkboardOverlay — break-room "take down the PHI" minigame
 * (HIPAA-is-the-game pass).
 *
 * Six pinned notes on the staff corkboard; three violate HIPAA. Click a note
 * (or press 1-6): violations pull down with a satisfying drop, safe notes
 * shake and stay. Every action teaches in one line. Clearing all three
 * violations completes the board — first completion awards compliance score
 * and the NICU baby wall grants identifier #17 to The Eighteen.
 *
 * Launched from the `staff_corkboard` zone (sceneId `minigame:corkboard`),
 * intercepted by UnifiedGamePage before the dialogue-scene path.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';
import { CORKBOARD_NOTES, CORKBOARD_VIOLATION_COUNT, type CorkboardNote } from '@/data/corkboardData';
import { getPhi18Entry, phi18Count, type Phi18Entry } from '@/data/phi18';
import { IdentifierGetBanner } from '@/components/IdentifierGetBanner';

export type CorkboardOverlayProps = {
  /** Zone already completed — render the cleaned board, no re-scoring. */
  alreadyCleaned: boolean;
  identifiersFound?: string[];
  onIdentifierFound?: (key: string) => void;
  /** All violations pulled this session (fires once, before the DONE screen closes). */
  onComplete: (result: { mistakes: number }) => void;
  onClose: () => void;
};

type TeachLine = { text: string; good: boolean; key: number };

export function CorkboardOverlay({
  alreadyCleaned,
  identifiersFound,
  onIdentifierFound,
  onComplete,
  onClose,
}: CorkboardOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [pulled, setPulled] = useState<Set<string>>(
    () => new Set(alreadyCleaned ? CORKBOARD_NOTES.filter((n) => n.kind === 'violation').map((n) => n.id) : []),
  );
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [teach, setTeach] = useState<TeachLine | null>(null);
  const [done, setDone] = useState(alreadyCleaned);
  const [banner, setBanner] = useState<{ entry: Phi18Entry; count: number } | null>(null);
  const mistakesRef = useRef(0);
  const completeFiredRef = useRef(alreadyCleaned);
  const teachKeyRef = useRef(0);
  const sessionFoundRef = useRef<string[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
  }, []);

  const violationsPulled = useMemo(
    () => CORKBOARD_NOTES.filter((n) => n.kind === 'violation' && pulled.has(n.id)).length,
    [pulled],
  );

  const showTeach = (text: string, good: boolean) => {
    setTeach({ text, good, key: ++teachKeyRef.current });
  };

  const handleNote = (note: CorkboardNote) => {
    if (done || pulled.has(note.id)) return;

    if (note.kind === 'violation') {
      setPulled((prev) => new Set(prev).add(note.id));
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_correct', volume: 0.6 });
      showTeach(note.teach, true);

      // The Eighteen grant (baby wall → #17 full-face photos)
      if (note.identifierKey && onIdentifierFound) {
        const known = [...(identifiersFound ?? []), ...sessionFoundRef.current];
        const entry = getPhi18Entry(note.identifierKey);
        if (entry && !known.includes(entry.key)) {
          sessionFoundRef.current.push(entry.key);
          onIdentifierFound(entry.key);
          const newCount = phi18Count([...known, entry.key]);
          setBanner({ entry, count: newCount });
          eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX,
            newCount >= 18
              ? { key: 'sfx_fanfare', volume: 0.6 }
              : { key: 'sfx_interact', volume: 0.5, rate: 1.5 });
          setTimeout(() => setBanner(null), newCount >= 18 ? 3600 : 2200);
        }
      }

      // All violations down → completion beat (Commandment 2: brief pause first)
      if (violationsPulled + 1 >= CORKBOARD_VIOLATION_COUNT) {
        setTimeout(() => {
          eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_fanfare', volume: 0.55 });
          setDone(true);
          if (!completeFiredRef.current) {
            completeFiredRef.current = true;
            onComplete({ mistakes: mistakesRef.current });
          }
        }, 750);
      }
    } else {
      // Safe note — it stays. Shake it, count the mistake, teach the line.
      mistakesRef.current += 1;
      setShakingId(note.id);
      setTimeout(() => setShakingId(null), 500);
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_sorter_wrong', volume: 0.5 });
      showTeach(note.teach, false);
    }
  };

  // Keyboard: 1-6 act on notes, Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      const idx = ['1', '2', '3', '4', '5', '6'].indexOf(e.key);
      if (idx >= 0 && CORKBOARD_NOTES[idx]) {
        e.preventDefault();
        handleNote(CORKBOARD_NOTES[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div
      className={`absolute inset-0 z-40 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/80' : 'bg-black/0'
      }`}
      data-testid="corkboard-overlay"
    >
      {/* Board panel — cork texture via layered browns */}
      <div
        className={`max-w-2xl w-[94%] border-8 border-[#5a3a1a] bg-[#a07828] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] transform transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 3px, transparent 3px, transparent 9px)',
        }}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#5a3a1a]">
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }} className="text-[#F5E6C8]">
            STAFF CORKBOARD
          </span>
          <span
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            className={done ? 'text-[#7FE5C0]' : 'text-[#F5E6C8]/80'}
            data-testid="corkboard-progress"
          >
            {done ? 'BOARD CLEAN' : `PHI DOWN: ${violationsPulled}/${CORKBOARD_VIOLATION_COUNT}`}
          </span>
          <button
            onClick={onClose}
            aria-label="Close corkboard"
            data-testid="corkboard-close"
            className="bg-[#3a2410] hover:bg-[#6a4a2a] text-[#F5E6C8] border-2 border-[#F5E6C8]/40 w-8 h-8 flex items-center justify-center transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            ×
          </button>
        </div>

        {/* Objective line */}
        {!done && (
          <p
            className="px-4 pt-3 text-[#3a2410]"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600 }}
          >
            Someone's been pinning PHI to the snack wall again. Take down what shouldn't be here —
            leave the rest alone.
          </p>
        )}
        {done && (
          <p
            className="px-4 pt-3 text-[#3a2410]"
            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600 }}
          >
            Nothing left but the potluck, the ficus, and CPR class. As it should be.
          </p>
        )}

        {/* Notes grid */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {CORKBOARD_NOTES.map((note, idx) => {
            const isPulled = pulled.has(note.id);
            const isShaking = shakingId === note.id;
            return (
              <button
                key={note.id}
                onClick={() => handleNote(note)}
                disabled={isPulled || done}
                className={`relative text-left px-2.5 pt-3 pb-2 border-2 border-[#00000022] bg-[#F5E6C8] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.35)] transition-transform ${
                  isPulled ? 'pointer-events-none' : 'hover:scale-[1.03] cursor-pointer'
                } ${isShaking ? 'animate-[shake-red_0.5s_ease-out]' : ''}`}
                style={{
                  ['--note-tilt' as string]: `${note.tilt}deg`,
                  transform: `rotate(${note.tilt}deg)`,
                  animation: isPulled ? 'note-pull 0.5s ease-in forwards' : undefined,
                  minHeight: '108px',
                }}
                data-testid={`corkboard-note-${note.id}`}
              >
                {/* Push pin */}
                <span
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-black/40"
                  style={{ backgroundColor: note.kind === 'violation' ? '#cc2222' : '#2266cc' }}
                />
                {/* Key hint */}
                <span
                  className="absolute top-1 right-1.5 text-black/30"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
                >
                  [{idx + 1}]
                </span>
                {note.emoji && (
                  <span className="block text-center" style={{ fontSize: '17px', lineHeight: '1.2' }}>
                    {note.emoji}
                  </span>
                )}
                <span
                  className="block text-[#7a1f1f] mt-1"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', lineHeight: '1.5' }}
                >
                  {note.title}
                </span>
                <span
                  className="block text-[#3a2410] mt-1"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '1.3' }}
                >
                  {note.body}
                </span>
              </button>
            );
          })}
        </div>

        {/* Teach line — one sentence per action, board keeps moving */}
        <div className="mx-4 mb-3 min-h-[52px] border-2 border-[#5a3a1a]/60 bg-[#3a2410] px-3 py-2">
          {teach ? (
            <p
              key={teach.key}
              style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.4', animation: 'ticker-in 0.18s ease-out' }}
              className={teach.good ? 'text-[#7FE5C0]' : 'text-[#FFD27F]'}
              data-testid="corkboard-teach"
            >
              {teach.text}
            </p>
          ) : (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }} className="text-[#F5E6C8]/50">
              {done ? 'The board thanks you for your service.' : 'Click a note — or press [1]-[6]. Wrong pulls cost nothing but pride.'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <span className="text-[#3a2410]/70" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}>
            REASONABLE SAFEGUARDS · §164.530(c)
          </span>
          {done && (
            <button
              onClick={onClose}
              className="bg-[#1f3a2a] hover:bg-[#2a5340] border-2 border-[#7FE5C0]/70 text-white px-4 py-2 transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
              data-testid="corkboard-done-close"
            >
              BACK TO THE BREAK ROOM
            </button>
          )}
        </div>
      </div>

      {/* The Eighteen item-get banner */}
      {banner && <IdentifierGetBanner entry={banner.entry} count={banner.count} />}
    </div>
  );
}
