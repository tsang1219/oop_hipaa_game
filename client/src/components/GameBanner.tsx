import { useEffect, useState } from 'react';

interface GameBannerProps {
  /** Text to display, e.g. "Wave 3 Cleared!" */
  text: string;
  /** Subtext below the main text (optional) */
  subtext?: string;
  /** How long the banner stays visible in ms (default 1200) */
  duration?: number;
  /** Callback when the banner finishes and should be removed */
  onComplete: () => void;
  /** Color accent: green for success, blue for info (default green) */
  color?: 'green' | 'blue' | 'pink';
}

const COLOR_MAP = {
  green: {
    text: 'text-[#2ECC71]',
    border: 'border-[#2ECC71]',
    glow: 'shadow-[0_0_30px_rgba(46,204,113,0.3)]',
    subtext: 'text-green-300',
  },
  blue: {
    text: 'text-[#3498DB]',
    border: 'border-[#3498DB]',
    glow: 'shadow-[0_0_30px_rgba(52,152,219,0.3)]',
    subtext: 'text-blue-300',
  },
  pink: {
    text: 'text-[#FF6B9D]',
    border: 'border-[#FF6B9D]',
    glow: 'shadow-[0_0_30px_rgba(255,107,157,0.3)]',
    subtext: 'text-pink-300',
  },
};

export function GameBanner({ text, subtext, duration = 1200, onComplete, color = 'green' }: GameBannerProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const colors = COLOR_MAP[color];

  useEffect(() => {
    // Enter phase
    const enterTimer = setTimeout(() => setPhase('hold'), 50);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase === 'hold') {
      const holdTimer = setTimeout(() => setPhase('exit'), duration);
      return () => clearTimeout(holdTimer);
    }
    if (phase === 'exit') {
      const exitTimer = setTimeout(onComplete, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none">
      {/* Dim backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          phase === 'enter' ? 'opacity-0' : phase === 'exit' ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      />

      {/* Banner */}
      <div
        className={`
          relative px-12 py-5 border-y-4 ${colors.border} ${colors.glow}
          bg-[#1a1a2e]/95
          transition-all duration-300 ease-out
          ${phase === 'enter' ? 'opacity-0 scale-75' : ''}
          ${phase === 'hold' ? 'opacity-100 scale-100' : ''}
          ${phase === 'exit' ? 'opacity-0 scale-110' : ''}
        `}
        style={{
          fontFamily: '"Press Start 2P", monospace',
          minWidth: 320,
          textAlign: 'center',
        }}
      >
        <div className={`text-base ${colors.text} tracking-wider`}>
          {text}
        </div>
        {subtext && (
          <div className={`text-[8px] ${colors.subtext} mt-2 opacity-80`}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
