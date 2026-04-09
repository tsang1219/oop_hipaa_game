import React, { useState, useEffect } from 'react';

interface NarrativeContextCardProps {
  narrativeText: string;
  onConfirm: () => void;
  onDecline?: () => void;
}

export const NarrativeContextCard: React.FC<NarrativeContextCardProps> = ({
  narrativeText,
  onConfirm,
  onDecline,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/85' : 'bg-black/0'
      }`}
    >
      <div
        className={`max-w-lg w-full mx-4 border-2 border-red-500/60 bg-gray-900/95 shadow-[0_0_40px_rgba(255,60,60,0.15)] transform transition-all duration-400 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="bg-red-900/60 border-b border-red-500/40 px-4 py-3 flex items-center gap-3">
          <span className="text-2xl animate-pulse">&#x26A0;</span>
          <h2
            className="text-sm text-red-400 tracking-wider"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            SECURITY ALERT
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p
            className="text-white leading-relaxed"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', lineHeight: '1.8' }}
          >
            {narrativeText}
          </p>

          <p
            className="text-gray-500"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px' }}
          >
            HIPAA Security Rule: 45 CFR &sect; 164.312 — Technical Safeguards
          </p>
        </div>

        {/* Action */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-green-700 hover:bg-green-600 border-2 border-green-500/60 text-white transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            DEFEND THE NETWORK
          </button>
          {onDecline && (
            <button
              onClick={onDecline}
              className="w-full py-2 bg-transparent hover:bg-gray-800 border border-gray-600/40 text-gray-500 hover:text-gray-400 transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              NOT RIGHT NOW
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
