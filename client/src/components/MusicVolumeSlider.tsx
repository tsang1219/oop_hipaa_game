import { useState, useCallback } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';

export function MusicVolumeSlider() {
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('music_volume');
    return stored !== null ? Math.round(parseFloat(stored) * 100) : 60;
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    const normalized = val / 100;
    localStorage.setItem('music_volume', String(normalized));
    eventBridge.emit(BRIDGE_EVENTS.REACT_SET_MUSIC_VOLUME, normalized);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <span
        className="text-[8px] text-gray-400"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {volume === 0 ? '\u{1F507}' : '\u{1F3B5}'}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={volume}
        onChange={handleChange}
        className="w-16 h-1 accent-[#ff6b9d] cursor-pointer"
        title={`Music: ${volume}%`}
        style={{ verticalAlign: 'middle' }}
      />
    </div>
  );
}
