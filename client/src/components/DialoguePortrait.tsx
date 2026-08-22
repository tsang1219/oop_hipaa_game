import { useEffect, useState } from 'react';
import { getNPCPortraitImage, hasNPCPortrait, getNPCColor, DEFAULT_SPEAKER_COLOR } from '@/data/spriteAssetPaths';
import { getBlinkSheetDataUrl } from '@/phaser/systems/exploration/blinkFrames';

interface DialoguePortraitProps {
  npcId: string;
  npcName: string;
  /** ANIM-08 — while the dialogue text is typing, the portrait bobs faster
   *  (a mouth-flap stand-in with no new art); stops dead on the last glyph. */
  talking?: boolean;
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
export default function DialoguePortrait({ npcId, npcName, talking = false }: DialoguePortraitProps) {
  // F-13 (Run 07): zone/item dialogues (sign-in sheet, shredder, …) have no
  // character mapping — they're things, not people. Render a document plate
  // instead of borrowing a random staff member's face.
  const isCharacter = hasNPCPortrait(npcId);
  const { fullUrl, sheetUrl } = getNPCPortraitImage(npcId);
  // Prefer a dedicated generated bust portrait; fall back to the sheet crop if
  // it isn't present (404). Tracking the failed URL auto-resets when the speaker
  // — and thus fullUrl — changes.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const useFull = isCharacter && failedUrl !== fullUrl;

  // ANIM-01 — the portrait blinks too. BootScene builds a closed-eye copy of
  // every walk sheet (blinkFrames.ts); when the portrait is the sheet crop,
  // swap to that copy for ~110ms every few seconds. Bust portraits (when
  // they exist) don't blink — no closed-eye art for them.
  const sheetType = (npcId && /^npc_/.test(sheetUrl)) ? null : null; // (kept for clarity; url below is authoritative)
  void sheetType;
  const blinkUrl = isCharacter ? getBlinkSheetDataUrl(sheetKeyFromUrl(sheetUrl)) : undefined;
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (!blinkUrl) return;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      openTimer = setTimeout(() => {
        setBlinking(true);
        closeTimer = setTimeout(() => { setBlinking(false); schedule(); }, 110);
      }, 2200 + Math.random() * 3600);
    };
    schedule();
    return () => { clearTimeout(openTimer); clearTimeout(closeTimer); };
  }, [blinkUrl, npcId]);

  // Run 08 cast identity: characters speak in their signature color — frame,
  // glow, and name plate. Things (zones/items) keep the neutral UI pink.
  const speakerColor = isCharacter ? getNPCColor(npcId) : DEFAULT_SPEAKER_COLOR;
  // ANIM-08 — talk-bob replaces the slow idle breathe while text is typing;
  // stops dead (no animation) the instant the last glyph lands.
  const portraitAnim = talking
    ? 'portrait-talk 0.24s steps(2) infinite'
    : 'portrait-breathe 2.4s ease-in-out infinite';

  return (
    <>
      <style>{`
        @keyframes portrait-breathe {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-2px); }
        }
        @keyframes portrait-talk {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50%       { transform: translateY(-1px) scaleY(0.97); }
        }
      `}</style>

      {/* Outer frame plate — stays rock-still; only the crop bobs */}
      <div
        className="flex-shrink-0 flex flex-col items-center bg-[#16213e] border-4"
        style={{
          borderColor: speakerColor,
          boxShadow: `inset 0 0 0 1px ${speakerColor}40`,
        }}
        data-testid="npc-battle-sprite"
      >
        {/* 96px pixelated crop — frame 0 (idle-down) at 3x.
            F-13: unmapped ids (zones/items) get a document glyph plate. */}
        {useFull ? (
          // Dedicated generated bust portrait — full image, pixelated.
          <img
            src={fullUrl}
            alt={npcName}
            onError={() => setFailedUrl(fullUrl)}
            style={{
              width: '96px',
              height: '96px',
              objectFit: 'cover',
              imageRendering: 'pixelated',
              backgroundColor: '#1a1a2e',
              animation: portraitAnim,
            }}
          />
        ) : isCharacter ? (
          // Fallback: crop of the walk sheet (frame 0, idle-down) at 3×.
          <div
            style={{
              width: '96px',
              height: '96px',
              backgroundImage: `url(${blinking && blinkUrl ? blinkUrl : sheetUrl})`,
              backgroundSize: '288px 384px',
              backgroundPosition: '0 0',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              backgroundColor: '#1a1a2e',
              animation: portraitAnim,
            }}
          />
        ) : (
          <div
            style={{
              width: '96px',
              height: '96px',
              backgroundColor: '#1a1a2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              animation: portraitAnim,
            }}
            aria-label="Object of interest"
          >
            {'\u{1F4CB}'}
          </div>
        )}

        {/* Name plate strip — inside the frame, below the crop.
            Run 08: the name reads in the speaker's signature color — the single
            strongest "who is talking" signal on the screen. */}
        <div
          className="w-full bg-[#1a1a2e] text-center px-1 py-1"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: isCharacter ? speakerColor : '#FFD93D',
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

/** '/attached_assets/.../characters/npc_nurse.png' → 'npc_nurse_sheet' (the BootScene texture key). */
function sheetKeyFromUrl(url: string): string {
  const m = /\/characters\/([a-z_]+)\.png/i.exec(url);
  if (!m) return '';
  return m[1] === 'player' || m[1].startsWith('player_') ? 'player_sheet' : `${m[1]}_sheet`;
}
