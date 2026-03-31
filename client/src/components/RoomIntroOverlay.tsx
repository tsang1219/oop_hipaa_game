import { useEffect, useState } from 'react';

interface RoomIntroOverlayProps {
  roomName: string;
  subtitle?: string;
  introText?: string;
  onDismiss: () => void;
}

/**
 * Nintendo-style room title card that appears on room entry.
 * Auto-dismisses after 2.5s or on SPACE / click.
 */
export function RoomIntroOverlay({ roomName, subtitle, introText, onDismiss }: RoomIntroOverlayProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    // Enter → visible
    const enterTimer = setTimeout(() => setPhase('visible'), 50);
    // Auto-dismiss after 2.5s
    const autoTimer = setTimeout(() => setPhase('exit'), 2500);
    return () => { clearTimeout(enterTimer); clearTimeout(autoTimer); };
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      const t = setTimeout(onDismiss, 400);
      return () => clearTimeout(t);
    }
  }, [phase, onDismiss]);

  // Dismiss on SPACE or click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setPhase('exit'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isVisible = phase === 'visible' || phase === 'enter';

  return (
    <div
      className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center"
      onClick={() => setPhase('exit')}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Letterbox bars */}
      <div
        className="absolute top-0 left-0 right-0 bg-black transition-all duration-300 ease-out"
        style={{ height: phase === 'enter' ? 0 : phase === 'exit' ? 0 : '15%' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-black transition-all duration-300 ease-out"
        style={{ height: phase === 'enter' ? 0 : phase === 'exit' ? 0 : '15%' }}
      />

      {/* Title card */}
      <div
        className="text-center transition-all duration-500 ease-out"
        style={{
          opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(12px)' : phase === 'exit' ? 'translateY(-12px)' : 'translateY(0)',
        }}
      >
        <h1
          className="text-2xl text-white mb-1 tracking-wider"
          style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}
        >
          {roomName}
        </h1>
        {subtitle && (
          <p
            className="text-sm text-cyan-300 mb-3"
            style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}
          >
            {subtitle}
          </p>
        )}
        {introText && (
          <p
            className="text-xs text-gray-300 max-w-md italic"
            style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}
          >
            {introText}
          </p>
        )}
      </div>
    </div>
  );
}
