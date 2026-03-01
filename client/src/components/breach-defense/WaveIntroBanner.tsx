import { useEffect } from 'react';
import { THREATS, THREAT_COLORS, TOWERS } from '../../game/breach-defense/constants';

const colorToHex = (c: number) => '#' + c.toString(16).padStart(6, '0');

interface WaveIntroBannerProps {
  wave: number;
  name: string;
  intro: string;
  suggestedTowers: string[];
  threats: Array<{ type: string; count: number }>;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function WaveIntroBanner({
  wave,
  name,
  intro,
  suggestedTowers,
  threats,
  onDismiss,
  autoDismissMs = 3000,
}: WaveIntroBannerProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  return (
    <div
      className="absolute inset-x-0 top-0 z-40 border-4 border-black bg-[#1a1a2e] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* Header row */}
      <div className="text-[10px] text-[#FF6B9D] font-bold">
        WAVE {wave}: {name}
      </div>

      {/* Intro text */}
      <p className="text-[7px] text-gray-400 mt-2 leading-relaxed line-clamp-2">
        {intro}
      </p>

      {/* Threats row */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <span className="text-[7px] text-gray-500">INCOMING:</span>
        {threats.map((t, i) => {
          const threat = THREATS[t.type as keyof typeof THREATS];
          const color = THREAT_COLORS[t.type] ?? 0xffffff;
          return (
            <span key={`${t.type}-${i}`} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorToHex(color) }}
              />
              <span className="text-[7px] text-gray-300">
                {threat ? threat.name : t.type} x{t.count}
              </span>
            </span>
          );
        })}
      </div>

      {/* Suggested towers row */}
      {suggestedTowers.length > 0 && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[7px] text-yellow-400">SUGGESTED:</span>
          {suggestedTowers.map((id) => {
            const tower = TOWERS[id as keyof typeof TOWERS];
            return (
              <span key={id} className="text-[7px] text-yellow-300">
                {tower ? tower.name : id}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
