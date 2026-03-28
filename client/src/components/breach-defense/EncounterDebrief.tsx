import React, { useState, useEffect } from 'react';

interface EncounterDebriefProps {
  encounterId: string;
  outcome: 'victory' | 'defeat';
  securityScore: number;   // 0-100
  scoreContribution: number;  // +0 to +12
  onDismiss: () => void;
}

const HIPAA_TAKEAWAYS = [
  "91% of cyberattacks start with a phishing email. Training your staff is your first line of defense.",
  "Defense in depth: layer Firewall, MFA, and Training — no single tool stops every attack.",
];

export const EncounterDebrief: React.FC<EncounterDebriefProps> = ({
  outcome,
  securityScore,
  scoreContribution,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const isVictory = outcome === 'victory';
  const headerText = isVictory ? 'NETWORK SECURED' : 'BREACH CONTAINED';
  const headerColor = isVictory ? 'text-green-400' : 'text-amber-400';
  const headerBg = isVictory ? 'bg-green-900/60 border-green-500/40' : 'bg-amber-900/60 border-amber-500/40';
  const barColor = isVictory ? 'bg-green-500' : 'bg-amber-500';

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/85' : 'bg-black/0'
      }`}
    >
      <div
        className={`max-w-lg w-full mx-4 border-2 ${isVictory ? 'border-green-500/60' : 'border-amber-500/60'} bg-gray-900/95 shadow-[0_0_40px_rgba(0,200,100,0.1)] transform transition-all duration-400 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className={`${headerBg} border-b px-4 py-3 flex items-center gap-3`}>
          <span className="text-2xl">{isVictory ? '\u{1F6E1}' : '\u26A0'}</span>
          <h2
            className={`text-sm ${headerColor} tracking-wider`}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            {headerText}
          </h2>
        </div>

        {/* Score section */}
        <div className="p-5 space-y-4">
          {/* Defense rating bar */}
          <div>
            <p
              className="text-gray-400 mb-2"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              DEFENSE RATING
            </p>
            <div className="w-full h-4 bg-gray-800 border border-gray-600 overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                style={{ width: `${securityScore}%` }}
              />
            </div>
            <p
              className="text-right text-gray-400 mt-1"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              {securityScore}/100
            </p>
          </div>

          {/* Score contribution */}
          <p
            className="text-green-400"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            + {scoreContribution} to Compliance Score
          </p>

          {/* HIPAA takeaways */}
          <div>
            <p
              className="text-gray-400 mb-3"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              WHAT YOU LEARNED
            </p>
            <ul className="space-y-3">
              {HIPAA_TAKEAWAYS.map((takeaway, i) => (
                <li
                  key={i}
                  className="text-gray-300 flex gap-2"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', lineHeight: '1.7' }}
                >
                  <span className="text-green-400 flex-shrink-0">&bull;</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            onClick={onDismiss}
            className="w-full py-3 bg-blue-700 hover:bg-blue-600 border-2 border-blue-500/60 text-white transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            RETURN TO HOSPITAL
          </button>
        </div>
      </div>
    </div>
  );
};
