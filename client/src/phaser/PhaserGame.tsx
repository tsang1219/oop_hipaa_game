import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config';
import { eventBridge, BRIDGE_EVENTS } from './EventBridge';
import { playSfx, playVoiceBlip, type Bus } from './systems/exploration/audioMixer';

interface PhaserGameProps {
  width?: number;
  height?: number;
  onSceneReady?: (sceneKey: string) => void;
}

export const PhaserGame = forwardRef<Phaser.Game | null, PhaserGameProps>(
  ({ width = 960, height = 720, onSceneReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    // State toggle to force useImperativeHandle to re-evaluate after game creation
    const [gameReady, setGameReady] = useState(false);

    useImperativeHandle(ref, () => gameRef.current!, [gameReady]);

    useEffect(() => {
      if (!containerRef.current || gameRef.current) return;

      const config = createGameConfig({
        parent: containerRef.current,
        width,
        height,
      });

      gameRef.current = new Phaser.Game(config);
      // Trigger re-evaluation of useImperativeHandle so parent gets the game instance
      setGameReady(true);

      // Ensure crisp pixel rendering on the canvas
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.style.imageRendering = 'pixelated';
      }

      const handleSceneReady = (sceneKey: string) => {
        onSceneReady?.(sceneKey);
      };

      eventBridge.on(BRIDGE_EVENTS.SCENE_READY, handleSceneReady);

      // Run 12 (AUD-02/04/05): React's sounds play through the Game's sound
      // manager, not a scene — so menus, overlays and the standalone tower
      // defense all get UI sound, and every play goes through the mixer.
      const onPlaySfx = (data: { key: string; volume?: number; rate?: number; bus?: Bus; cooldownKey?: string; cooldownMs?: number }) => {
        const game = gameRef.current;
        if (!game || !data?.key) return;
        playSfx(game, data.key, {
          bus: data.bus ?? 'sfx',
          volume: data.volume ?? 0.5,
          rate: data.rate ?? 1,
          cooldownKey: data.cooldownKey,
          cooldownMs: data.cooldownMs,
        });
      };
      const onVoiceBlip = (data: { color: string; seed?: number; volume?: number }) => {
        const game = gameRef.current;
        if (!game || !data?.color) return;
        playVoiceBlip(game, { color: data.color, seed: data.seed, volume: data.volume });
      };
      eventBridge.on(BRIDGE_EVENTS.REACT_PLAY_SFX, onPlaySfx);
      eventBridge.on(BRIDGE_EVENTS.REACT_VOICE_BLIP, onVoiceBlip);

      return () => {
        eventBridge.off(BRIDGE_EVENTS.REACT_PLAY_SFX, onPlaySfx);
        eventBridge.off(BRIDGE_EVENTS.REACT_VOICE_BLIP, onVoiceBlip);
        eventBridge.off(BRIDGE_EVENTS.SCENE_READY, handleSceneReady);
        gameRef.current?.destroy(true);
        gameRef.current = null;
      };
    }, []);

    return (
      <div
        ref={containerRef}
        style={{
          width,
          height,
          imageRendering: 'pixelated',
          // @ts-expect-error -- crisp-edges is a valid CSS value for cross-browser pixel art rendering
          WebkitImageRendering: 'crisp-edges',
        }}
      />
    );
  }
);

PhaserGame.displayName = 'PhaserGame';
