import React from 'react';

interface EncounterHudProps {
  wave: number;
  totalWaves: number;
  budget: number;
  securityScore: number;
  gameState: string;
  waveName?: string;
}

export const EncounterHud: React.FC<EncounterHudProps> = ({
  wave,
  totalWaves,
  budget,
  securityScore,
  gameState,
  waveName,
}) => {
  const pixelFont = { fontFamily: '"Press Start 2P", monospace' };

  return (
    <div className="absolute top-0 left-0 right-0 z-40">
      {/* Main HUD bar */}
      <div className="bg-gray-900/90 border-b border-green-500/30 px-4 py-2 flex items-center justify-between">
        {/* Left: wave counter */}
        <span
          className="text-green-400"
          style={{ ...pixelFont, fontSize: '10px' }}
        >
          WAVE {wave}/{totalWaves}
        </span>

        {/* Center: wave name */}
        {waveName && (
          <span
            className="text-white"
            style={{ ...pixelFont, fontSize: '9px' }}
          >
            {waveName}
          </span>
        )}

        {/* Right: budget + defense */}
        <div className="flex items-center gap-4">
          <span
            className="text-yellow-400"
            style={{ ...pixelFont, fontSize: '9px' }}
          >
            BUDGET: ${budget}
          </span>
          <span
            className={`${securityScore > 40 ? 'text-green-400' : securityScore > 20 ? 'text-amber-400' : 'text-red-400'}`}
            style={{ ...pixelFont, fontSize: '9px' }}
          >
            DEFENSE: {securityScore}%
          </span>
        </div>
      </div>

      {/* Placement hint when waiting */}
      {gameState === 'WAITING' && (
        <div className="bg-gray-900/70 border-b border-gray-600/30 px-4 py-1 text-center">
          <span
            className="text-gray-400 animate-pulse"
            style={{ ...pixelFont, fontSize: '8px' }}
          >
            PLACE YOUR TOWERS — Click the grid to defend
          </span>
        </div>
      )}
    </div>
  );
};
