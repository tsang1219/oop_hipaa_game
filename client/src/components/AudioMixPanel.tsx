import { useCallback, useEffect, useState } from 'react';
import { getMix, setBusVolume, type Bus } from '@/phaser/systems/exploration/audioMixer';
import { uiSfx } from '@/lib/uiSfx';

/**
 * AUD-05 — the mixer's face. Music stays where it always was; MIX expands the
 * other three buses. Every slider persists (localStorage) and applies live:
 * music through MusicController, SFX/voice at the next play, ambience with a
 * short ramp on the running room bed.
 */
const BUSES: Array<{ bus: Bus; label: string; title: string }> = [
  { bus: 'music', label: 'MUS', title: 'Music' },
  { bus: 'sfx', label: 'SFX', title: 'Sound effects' },
  { bus: 'voice', label: 'VOX', title: 'Dialogue voices' },
  { bus: 'ambience', label: 'AMB', title: 'Room ambience' },
];

function Slider({ bus, label, title, value, onChange }: {
  bus: Bus; label: string; title: string; value: number; onChange: (bus: Bus, v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <label className="flex items-center gap-1" title={`${title}: ${pct}%`} data-testid={`mix-${bus}`}>
      <span className="text-[7px] text-gray-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        data-sfx="none"
        onChange={(e) => onChange(bus, parseInt(e.target.value, 10) / 100)}
        onPointerUp={() => uiSfx(bus === 'voice' ? 'select' : 'toggle', { volume: 0.25 })}
        className="w-14 h-1 accent-[#ff6b9d] cursor-pointer mix-slider"
        style={{
          verticalAlign: 'middle',
          background: `linear-gradient(90deg, #ff6b9d ${pct}%, #1e1e30 ${pct}%)`,
          borderRadius: '2px',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
        aria-label={`${title} volume`}
      />
    </label>
  );
}

export function AudioMixPanel() {
  const [mix, setMix] = useState(() => getMix());
  const [open, setOpen] = useState(false);

  // Stay in sync if anything else (dev console, another panel) changes a bus.
  useEffect(() => {
    const onChange = () => setMix(getMix());
    window.addEventListener('pq:mix-changed', onChange);
    return () => window.removeEventListener('pq:mix-changed', onChange);
  }, []);

  const onChange = useCallback((bus: Bus, v: number) => {
    setBusVolume(bus, v);
    setMix(getMix());
  }, []);

  return (
    <div className="flex items-center gap-2" data-testid="audio-mix-panel">
      <style>{`
        .mix-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 8px; height: 8px; border-radius: 50%;
          background: #ff6b9d;
          box-shadow: 0 0 6px rgba(255, 107, 157, 0.6), 0 0 2px rgba(255, 107, 157, 0.3);
          cursor: pointer;
        }
        .mix-slider::-moz-range-thumb {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ff6b9d; border: none; cursor: pointer;
          box-shadow: 0 0 6px rgba(255, 107, 157, 0.6), 0 0 2px rgba(255, 107, 157, 0.3);
        }
        .mix-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; }
        .mix-slider::-moz-range-track { height: 4px; border-radius: 2px; background: #1e1e30; }
      `}</style>
      <span className="text-[8px] text-gray-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
        {mix.music === 0 ? '\u{1F507}' : '\u{1F3B5}'}
      </span>
      <Slider {...BUSES[0]} value={mix.music} onChange={onChange} />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        data-sfx="toggle"
        className={`text-[7px] border px-1 py-0.5 transition-colors ${open ? 'text-white border-[#ff6b9d]' : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'}`}
        style={{ fontFamily: '"Press Start 2P", monospace' }}
        title="Mixer: sound effects, voices, ambience"
        aria-expanded={open}
        data-testid="mix-toggle"
      >
        MIX{open ? ' ◂' : ' ▸'}
      </button>
      {open && BUSES.slice(1).map(b => (
        <Slider key={b.bus} {...b} value={mix[b.bus]} onChange={onChange} />
      ))}
    </div>
  );
}
