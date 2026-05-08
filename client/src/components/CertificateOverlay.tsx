/**
 * CertificateOverlay — Phase 21 capstone: completion sequence + sponsor handoff.
 *
 * This is the BIGGEST moment in the demo (Commandment 8). When the player exits
 * Medical Records as the final demo room, this overlay plays a deliberate paced
 * sequence:
 *
 *   dim (~400ms) → silent beat (~500ms) → fanfare (audio + flash) →
 *   end NPC enters with line 1 → line 2 → certificate body reveals
 *
 * The 500ms beat is genuinely silent — that's Commandment 2 (anticipation before
 * reward). It's the difference between vending-machine reward and Zelda chest-open.
 *
 * Demo-only path. Rendered only when UnifiedGamePage's pageMode === 'demo-complete'.
 * The full-game flow keeps its existing EndScreen and is untouched.
 *
 * Requirements:
 *   CERT-01 — ordered dim → beat → fanfare → cert animation → code reveal
 *   CERT-02 — sponsor name + monospace code box + copy-to-clipboard with feedback
 *   CERT-03 — end NPC sprite + two configured dialogue lines hand the prize
 *
 * The end NPC handoff lives INSIDE this overlay (not as a Phaser-world NPC) so
 * it stays purely demo-only and doesn't require touching roomData.json.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { SPONSOR_CONFIG } from '../data/sponsorConfig';
import { getSponsorSpritePath } from '../data/spriteAssetPaths';

type CapstonePhase = 'dim' | 'beat' | 'fanfare' | 'npc' | 'line2' | 'cert';

export interface CertificateOverlayProps {
  /** Called when the player chooses to return to the start menu. */
  onReturn: () => void;
}

export function CertificateOverlay({ onReturn }: CertificateOverlayProps): JSX.Element {
  const [phase, setPhase] = useState<CapstonePhase>('dim');
  const [copied, setCopied] = useState(false);
  const fanfareFiredRef = useRef(false);

  // ── Sequence pacing (CERT-01) ─────────────────────────────────
  // The fixed-duration phases (dim → beat → fanfare → npc) auto-advance via
  // setTimeout. The dialogue phases (npc → line2 → cert) advance on player input.
  useEffect(() => {
    if (phase === 'dim') {
      // 400ms for the black overlay to ramp from 0 → 0.92.
      const t = setTimeout(() => setPhase('beat'), 400);
      return () => clearTimeout(t);
    }
    if (phase === 'beat') {
      // The anticipatory beat — 500ms of pure silent black. Commandment 2.
      // Nothing audible, nothing visual changes. Let it breathe.
      const t = setTimeout(() => setPhase('fanfare'), 500);
      return () => clearTimeout(t);
    }
    if (phase === 'fanfare') {
      if (!fanfareFiredRef.current) {
        fanfareFiredRef.current = true;
        // Reuses the Phase 15 fanfare cue — same chime that fires on department
        // completion. Caller HUD already mounted and routes through the sound
        // manager via the existing REACT_PLAY_SFX listener in ExplorationScene
        // (or any active scene that's still listening — the Boot scene's audio
        // cache is global).
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
          key: 'sfx_fanfare',
          volume: 0.9,
        });
      }
      // Hold the flash for 600ms before bringing the NPC in.
      const t = setTimeout(() => setPhase('npc'), 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // ── Advance dialogue / cert reveal ────────────────────────────
  const advance = useCallback(() => {
    if (phase === 'npc') {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
      setPhase('line2');
    } else if (phase === 'line2') {
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.4 });
      setPhase('cert');
    }
  }, [phase]);

  // ── Keyboard ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onReturn();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, onReturn]);

  // ── Copy code (CERT-02) ────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    const code = SPONSOR_CONFIG.code;
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        success = true;
      } else {
        // Fallback for non-secure contexts (file://, http://localhost-without-https etc.)
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      success = false;
    }
    if (success) {
      setCopied(true);
      // Same "correct" chime the PHI sorter uses — already preloaded.
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
        key: 'sfx_sorter_correct',
        volume: 0.6,
      });
      setTimeout(() => setCopied(false), 1200);
    }
  }, []);

  // Phase-driven render flags — separated for readability.
  const dimOpacity = phase === 'dim' ? 0 : 1;
  const showNpc   = phase === 'npc' || phase === 'line2' || phase === 'cert';
  const showLine1 = showNpc;
  const showLine2 = phase === 'line2' || phase === 'cert';
  const showCert  = phase === 'cert';

  return (
    <div
      className="absolute inset-0 z-[200] flex items-center justify-center"
      onClick={advance}
      data-testid="certificate-overlay"
    >
      {/* Dim — black overlay climbs from 0 → 0.92 over 400ms */}
      <div
        className="absolute inset-0 ease-out"
        style={{
          backgroundColor: 'rgba(0,0,0,0.92)',
          opacity: dimOpacity,
          transition: 'opacity 400ms ease-out',
        }}
      />

      {/* Fanfare flash — gold radial pulse during the 'fanfare' phase */}
      {phase === 'fanfare' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,220,80,0.45) 0%, transparent 70%)',
            animation: 'cert-fanfare-flash 600ms ease-out forwards',
          }}
        />
      )}

      {/* Inline keyframes — keeps Phase 21 self-contained without touching index.css */}
      <style>{`
        @keyframes cert-fanfare-flash {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes cert-card-in {
          0%   { opacity: 0; transform: scale(0.55); }
          70%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cert-npc-in {
          0%   { opacity: 0; transform: translateX(-32px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes cert-code-reveal {
          0%   { opacity: 0; letter-spacing: 0.6em; filter: blur(2px); }
          100% { opacity: 1; letter-spacing: 0.15em; filter: blur(0); }
        }
        @keyframes cert-name-glow {
          0%, 100% { text-shadow: 0 0 8px rgba(255, 220, 80, 0.4); }
          50%      { text-shadow: 0 0 16px rgba(255, 220, 80, 0.8); }
        }
      `}</style>

      {/* Content stage — only renders from 'npc' onward */}
      {showNpc && (
        <div
          className="relative z-10 flex items-center gap-8 px-6 max-w-full"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {/* NPC + dialogue column */}
          <div
            className="flex flex-col items-center gap-3"
            style={{ animation: 'cert-npc-in 500ms ease-out forwards' }}
          >
            {/* NPC sprite — frame 0 (idle-down) of the sponsor's spritesheet,
                upscaled 4× with pixelated rendering. The spritesheet is a 3×4
                grid of 32×32 frames (96×128 source) — we render only the
                top-left frame as a CSS background. */}
            <div
              data-testid="cert-npc-sprite"
              aria-label={`Sponsor NPC: ${SPONSOR_CONFIG.character_sprite}`}
              style={{
                width: 128,
                height: 128,
                backgroundImage: `url(${getSponsorSpritePath(SPONSOR_CONFIG.character_sprite)})`,
                backgroundSize: '384px 512px',  // 96×128 spritesheet upscaled 4×
                backgroundPosition: '0 0',      // frame 0 (idle-down)
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 12px rgba(255, 220, 80, 0.55))',
              }}
            />

            {/* JRPG-style dialogue box — speech bubble below the NPC */}
            <div
              className="border-4 border-[#FFD23F] bg-[#1a1a2e]/95 px-5 py-4 max-w-[420px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              data-testid="cert-dialogue"
            >
              {showLine1 && (
                <p className="text-[10px] text-white leading-relaxed" data-testid="cert-line-1">
                  {SPONSOR_CONFIG.two_dialogue_lines[0]}
                </p>
              )}
              {showLine2 && (
                <p
                  className="text-[10px] text-white leading-relaxed mt-3"
                  data-testid="cert-line-2"
                >
                  {SPONSOR_CONFIG.two_dialogue_lines[1]}
                </p>
              )}
              {!showCert && (
                <p className="text-[7px] text-[#00d4aa] mt-3 tracking-widest">
                  ▼ CLICK / SPACE
                </p>
              )}
            </div>
          </div>

          {/* Certificate card — only in 'cert' phase. Reveals beside the NPC
              so the handoff feels like an exchange, not a replacement. */}
          {showCert && (
            <div
              className="border-4 border-[#FFD23F] bg-[#1a1a2e] px-8 py-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4"
              style={{
                animation: 'cert-card-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                minWidth: 360,
              }}
              data-testid="cert-card"
            >
              <p className="text-[8px] tracking-[0.4em] text-[#FFD23F]">
                CERTIFICATE OF SURVIVAL
              </p>
              <h2
                className="text-[16px] text-white text-center leading-relaxed"
                style={{ animation: 'cert-name-glow 2.4s ease-in-out infinite' }}
                data-testid="cert-sponsor-name"
              >
                {SPONSOR_CONFIG.name}
              </h2>
              <div className="border-2 border-[#FFD23F] bg-black/60 px-6 py-3">
                <p
                  className="text-[14px] text-[#FFD23F]"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    animation: 'cert-code-reveal 700ms ease-out forwards',
                  }}
                  data-testid="cert-code"
                >
                  {SPONSOR_CONFIG.code}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  data-testid="cert-copy"
                  className={`text-[9px] px-4 py-2 border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-colors ${
                    copied
                      ? 'bg-[#2ECC71] text-black'
                      : 'bg-[#FFD23F] hover:bg-[#FFC91F] text-black'
                  }`}
                >
                  {copied ? 'COPIED ✓' : 'COPY CODE'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReturn();
                  }}
                  data-testid="cert-return"
                  className="text-[9px] px-4 py-2 border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none bg-gray-600 hover:bg-gray-500 text-white"
                >
                  RETURN TO MENU
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
