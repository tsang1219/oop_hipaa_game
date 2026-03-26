import { THREATS, THREAT_COLORS } from '../../game/breach-defense/constants';

const colorToHex = (c: number) => '#' + c.toString(16).padStart(6, '0');

interface ThreatStripProps {
  threats: Array<{ type: string; count: number }>;
}

export function ThreatStrip({ threats }: ThreatStripProps) {
  if (!threats.length) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 border-2 border-[#FF6B9D] rounded w-[640px] flex-wrap"
      style={{
        fontFamily: '"Press Start 2P", monospace',
        background: 'linear-gradient(180deg, #2a2a3e 0%, #1e1e30 100%)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 107, 157, 0.1)',
      }}
    >
      <span className="text-[7px] text-gray-500 mr-1" style={{ textShadow: '0 0 4px rgba(255, 107, 157, 0.3)' }}>INCOMING:</span>
      {threats.map((t, i) => {
        const threat = THREATS[t.type as keyof typeof THREATS];
        const color = THREAT_COLORS[t.type] ?? 0xffffff;
        return (
          <span key={`${t.type}-${i}`} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: colorToHex(color),
                boxShadow: `0 0 6px ${colorToHex(color)}88, 0 0 2px ${colorToHex(color)}44`,
              }}
            />
            <span className="text-[7px] text-gray-300">
              {threat ? threat.name : t.type} x{t.count}
            </span>
          </span>
        );
      })}
    </div>
  );
}
