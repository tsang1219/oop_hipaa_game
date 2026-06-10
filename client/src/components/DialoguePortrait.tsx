import { getNPCPortraitPath } from '@/data/spriteAssetPaths';

interface DialoguePortraitProps {
  npcId: string;
  npcName: string;
}

/**
 * DialoguePortrait — framed 96px pixelated CSS-crop portrait with name plate and
 * a subtle 2.4s breathing-bob idle animation on the crop layer only.
 *
 * Sheet geometry: 96x128 PNG, 3x4 grid, 32x32 px per frame.
 * Frame 0 (idle-down, top-left) at 3x scale:
 *   width: 96px, height: 96px
 *   backgroundSize: '288px 384px'
 *   backgroundPosition: '0 0'
 *
 * Used in BattleEncounterScreen dialogue header (Phase 25 Plan 02).
 * data-testid="npc-battle-sprite" preserved for QA bridge / visual tests.
 */
export default function DialoguePortrait({ npcId, npcName }: DialoguePortraitProps) {
  const spriteUrl = getNPCPortraitPath(npcId);

  return (
    <>
      <style>{`
        @keyframes portrait-breathe {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-2px); }
        }
      `}</style>

      {/* Outer frame plate — stays rock-still; only the crop bobs */}
      <div
        className="flex-shrink-0 flex flex-col items-center bg-[#16213e] border-4 border-[#FF6B9D]"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,107,157,0.25)',
        }}
        data-testid="npc-battle-sprite"
      >
        {/* 96px pixelated crop — frame 0 (idle-down) at 3x */}
        <div
          style={{
            width: '96px',
            height: '96px',
            backgroundImage: `url(${spriteUrl})`,
            backgroundSize: '288px 384px',
            backgroundPosition: '0 0',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            backgroundColor: '#1a1a2e',
            animation: 'portrait-breathe 2.4s ease-in-out infinite',
          }}
        />

        {/* Name plate strip — inside the frame, below the crop */}
        <div
          className="w-full bg-[#1a1a2e] text-center px-1 py-1"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: '#FFD93D',
            wordBreak: 'break-word',
            minWidth: '96px',
          }}
        >
          {npcName}
        </div>
      </div>
    </>
  );
}
