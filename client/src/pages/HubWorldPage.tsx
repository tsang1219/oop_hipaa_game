import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import Phaser from 'phaser';
import { PhaserGame } from '../phaser/PhaserGame';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { MusicVolumeSlider } from '../components/MusicVolumeSlider';

export default function HubWorldPage() {
  const [, navigate] = useLocation();
  const gameRef = useRef<Phaser.Game | null>(null);
  const [muted, setMuted] = useState(() =>
    localStorage.getItem('sfx_muted') === 'true'
  );

  // Mute toggle — apply to Phaser + persist
  useEffect(() => {
    if (gameRef.current?.sound) {
      gameRef.current.sound.setMute(muted);
    }
    localStorage.setItem('sfx_muted', String(muted));
  }, [muted]);

  const handleGameSelect = useCallback((gameId: string) => {
    if (gameId === 'privacy-quest') {
      navigate('/privacy');
    } else if (gameId === 'breach-defense') {
      navigate('/breach');
    }
  }, [navigate]);

  useEffect(() => {
    eventBridge.on(BRIDGE_EVENTS.HUB_SELECT_GAME, handleGameSelect);
    return () => {
      eventBridge.off(BRIDGE_EVENTS.HUB_SELECT_GAME, handleGameSelect);
    };
  }, [handleGameSelect]);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4">
      <div className="relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <PhaserGame ref={gameRef} width={640} height={480} />

        {/* CRT scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-[8px] text-gray-500" style={{ fontFamily: '"Press Start 2P"' }}>
          WASD or Arrow Keys to move &bull; SPACE to interact
        </p>
        <button
          onClick={() => setMuted(m => !m)}
          className="text-[10px] text-gray-300 hover:text-white transition-colors"
          title={muted ? 'Unmute' : 'Mute'}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {muted ? '\u{1F507}' : '\u{1F50A}'}
        </button>
        <MusicVolumeSlider />
      </div>
    </div>
  );
}
