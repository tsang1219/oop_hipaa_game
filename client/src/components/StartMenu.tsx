/**
 * StartMenu — Three-button mode selector for the v2.2 Sponsor Demo.
 *
 * DEMO-01: First screen the player sees on `/`. Buttons in fixed order:
 *   DEMO  →  curated 4-room sponsor pitch
 *   TOWER DEFENSE  →  standalone arcade-mode TD (Phase 19 wires)
 *   FULL GAME  →  existing full-game flow with progression + save
 *
 * Pure presentation: no Phaser, no localStorage. Routes SFX through eventBridge.
 * Keyboard nav matches TitleScreen vocabulary: Arrow / W-S, Enter / Space.
 *
 * Run 14 (UI-05): the backdrop is now tileset-derived, in three candidate
 * directions switchable with `?title=a|b|c` (plus `classic` for the old
 * starfield). Provisional default is `a` until the taste checkpoint picks one:
 *   a — "Night shift": the real hospital-lobby render, graded to night
 *   b — "Cast lineup": the game's people on a strip of real floor
 *   c — "Corkboard": the menu pinned to hospital paperwork
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { PixelComputerLogo } from './PixelComputerLogo';
import { SPONSOR_CONFIG } from '../data/sponsorConfig';

export interface StartMenuProps {
  /** A resumable full-game save exists — show CONTINUE and reframe FULL GAME as NEW GAME. */
  hasSave: boolean;
  /**
   * Where the save left off, e.g. "BREAK ROOM · 2 ROOMS CLEARED" and
   * "SAVED 3 HR AGO". Shown on the CONTINUE card; falls back to stock copy.
   */
  saveSummary?: { where: string; when: string | null };
  onDemo: () => void;
  onTowerDefense: () => void;
  /** Start a fresh full game (clears any existing save on the way to character select). */
  onNewGame: () => void;
  /** Resume the in-progress full-game save. Only invoked when hasSave is true. */
  onResume: () => void;
}

type SectionId = 'main-rpg' | 'mini-games';
type TitleVariant = 'a' | 'b' | 'c' | 'classic';

const LOBBY_PLATE = '/attached_assets/generated_images/privacyquest/title/hospital_entrance-plate-1x.png';
const CHAR_BASE = '/attached_assets/generated_images/privacyquest/characters';
/** The lineup for variant b — sheet frame 0 is the idle-down pose at (0,0). */
const CAST = ['npc_receptionist', 'npc_nurse', 'npc_doctor', 'npc_it_tech', 'npc_officer', 'npc_patient', 'npc_visitor'];

function resolveVariant(): TitleVariant {
  try {
    const v = new URLSearchParams(window.location.search).get('title');
    if (v === 'b' || v === 'c' || v === 'classic') return v;
  } catch { /* SSR/tests */ }
  return 'a';
}

interface MenuItem {
  label: string;
  description: string;
  accent: string;
  icon: 'cross' | 'bolt' | 'shield';
  section: SectionId;
  action: () => void;
  /** Optional second line under the description (CONTINUE's "SAVED 3 HR AGO"). */
  detail?: string;
  /** Destructive: the first press arms a warning, the second runs the action. */
  confirmFirst?: boolean;
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'main-rpg', label: 'MAIN RPG' },
  { id: 'mini-games', label: 'MINI GAMES' },
];

function ModeIcon({ icon, color }: { icon: MenuItem['icon']; color: string }) {
  const common = { width: 32, height: 32, viewBox: '0 0 16 16', xmlns: 'http://www.w3.org/2000/svg' };
  const stroke = '#000000';
  if (icon === 'cross') {
    // Hospital cross — white plus on a colored square
    return (
      <svg {...common}>
        <rect x="1" y="1" width="14" height="14" fill={color} stroke={stroke} strokeWidth="1" />
        <rect x="6" y="3" width="4" height="10" fill="#ffffff" />
        <rect x="3" y="6" width="10" height="4" fill="#ffffff" />
      </svg>
    );
  }
  if (icon === 'bolt') {
    // Lightning bolt — classic zigzag
    return (
      <svg {...common}>
        <path d="M 9 1 L 3 9 L 7 9 L 5 15 L 13 6 L 9 6 Z" fill={color} stroke={stroke} strokeWidth="1" strokeLinejoin="miter" />
      </svg>
    );
  }
  // shield — pixel-art shield silhouette with center notch
  return (
    <svg {...common}>
      <path d="M 2 2 L 14 2 L 14 8 L 13 11 L 10 13 L 8 14 L 6 13 L 3 11 L 2 8 Z" fill={color} stroke={stroke} strokeWidth="1" strokeLinejoin="miter" />
      <rect x="6" y="5" width="4" height="2" fill="#ffffff" opacity="0.7" />
      <rect x="7" y="4" width="2" height="6" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

/** Red pushpin for the corkboard variant. */
function PushPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" shapeRendering="crispEdges" aria-hidden="true">
      <circle cx="7" cy="6" r="5" fill="#d33" stroke="#701818" strokeWidth="1.5" />
      <circle cx="5.5" cy="4.5" r="1.5" fill="#ff9a9a" />
      <rect x="6" y="10" width="2" height="3" fill="#701818" />
    </svg>
  );
}

// ── Backdrops ────────────────────────────────────────────────────

/** a — the real lobby at night: the game's own art, graded down. */
function NightShiftBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${LOBBY_PLATE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          imageRendering: 'pixelated',
          filter: 'brightness(0.52) saturate(0.85)',
          animation: 'title-bg-drift 26s ease-in-out infinite alternate',
        }}
      />
      {/* Night grade + readable center */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,14,44,0.78) 0%, rgba(12,16,48,0.42) 34%, rgba(8,10,30,0.55) 66%, rgba(4,6,18,0.88) 100%)',
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 30%, rgba(4,6,18,0.55) 100%)',
        }}
      />
    </>
  );
}

/** b — dark stage; the cast stands on a strip of real hospital floor. */
function CastLineupBackdrop() {
  return (
    <>
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(180deg, #10142e 0%, #171b3c 70%, #0c0f24 100%)' }} />
      {/* Floor strip cut from the lobby plate */}
      <div
        className="absolute left-0 right-0 bottom-0 z-0"
        aria-hidden="true"
        style={{
          height: 150,
          backgroundImage: `url(${LOBBY_PLATE})`,
          backgroundSize: '1280px auto',
          backgroundPosition: 'center -520px',
          imageRendering: 'pixelated',
          filter: 'brightness(0.72) saturate(0.9)',
          borderTop: '3px solid #000',
        }}
      />
      <div
        className="absolute left-0 right-0 bottom-0 z-0 pointer-events-none"
        style={{ height: 150, background: 'linear-gradient(180deg, rgba(12,15,36,0.92) 0%, rgba(12,15,36,0.25) 55%, rgba(12,15,36,0.15) 100%)' }}
      />
      {/* The cast — frame 0 of the real spritesheets, 3× */}
      <div className="absolute left-0 right-0 z-0 flex items-end justify-center gap-8 pointer-events-none" style={{ bottom: 38 }}>
        {CAST.map((c, i) => (
          <div
            key={c}
            style={{
              width: 96, height: 96, overflow: 'hidden',
              animation: `title-cast-bob ${1.6 + (i % 3) * 0.25}s steps(2) ${i * 0.35}s infinite`,
            }}
            aria-hidden="true"
          >
            <div
              style={{
                width: 32, height: 32,
                backgroundImage: `url(${CHAR_BASE}/${c}.png)`,
                backgroundPosition: '0 0',
                imageRendering: 'pixelated',
                transform: 'scale(3)',
                transformOrigin: 'top left',
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}

/** c — the corkboard: menu as pinned hospital paperwork. */
function CorkboardBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 5px), ' +
            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 6px), ' +
            'linear-gradient(160deg, #a07828 0%, #8d6820 60%, #7c5b1c 100%)',
        }}
      />
      {/* Board frame */}
      <div className="absolute inset-3 z-0 pointer-events-none border-8 border-[#5a3a1a]" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)' }} />
    </>
  );
}

export function StartMenu({ hasSave, saveSummary, onDemo, onTowerDefense, onNewGame, onResume }: StartMenuProps): JSX.Element {
  const [variant] = useState<TitleVariant>(resolveVariant);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const lastSelectedRef = useRef(0);
  // NEW GAME over an existing save takes two presses: the first arms an
  // "erase your shift?" warning, the second commits. Moving off the card
  // disarms it. One stray Enter must never cost someone their progress.
  const [eraseArmed, setEraseArmed] = useState(false);

  // Resume + New Game live directly on the main menu (no intermediate title
  // screen). CONTINUE only appears when a save exists, and is the default
  // selection so returning players just press Enter.
  const menuItems: MenuItem[] = [
    ...(hasSave
      ? [{
          label: 'CONTINUE',
          description: saveSummary?.where ?? 'BACK TO YOUR SHIFT',
          detail: saveSummary?.when ?? undefined,
          accent: '#FFD23F',
          icon: 'cross' as const,
          section: 'main-rpg' as const,
          action: onResume,
        }]
      : []),
    {
      label: hasSave ? (eraseArmed ? 'ERASE SAVE?' : 'NEW GAME') : 'FULL GAME',
      description: hasSave
        ? (eraseArmed ? 'PRESS AGAIN TO START OVER' : 'START OVER FROM DAY ONE')
        : 'PROTECT THE HOSPITAL',
      accent: hasSave ? (eraseArmed ? '#FF4D4D' : '#FF9EC4') : '#FFD23F',
      icon: 'cross',
      section: 'main-rpg',
      action: onNewGame,
      confirmFirst: hasSave,
    },
    {
      label: 'DEMO',
      description: 'GET A TASTE — 4 ROOMS',
      accent: '#00d4aa',
      icon: 'bolt',
      section: 'main-rpg',
      action: onDemo,
    },
    {
      label: 'TOWER DEFENSE',
      description: 'STOP THE BREACH — ARCADE',
      accent: '#FF6B9D',
      icon: 'shield',
      section: 'mini-games',
      action: onTowerDefense,
    },
  ];

  // Staggered reveal.
  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 150);
    const t2 = setTimeout(() => setShowTitle(true), 550);
    const t3 = setTimeout(() => setShowMenu(true), 950);
    const t4 = setTimeout(() => setShowFooter(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // SFX helpers — pitch-varied tick on nav, lower-pitch confirm on select.
  const playNav = useCallback(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
      key: 'sfx_interact',
      volume: 0.18,
      rate: 1.4,
    });
  }, []);

  const playSelect = useCallback(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, {
      key: 'sfx_interact',
      volume: 0.5,
      rate: 0.85,
    });
  }, []);

  // Play nav tick whenever selection actually changes.
  useEffect(() => {
    if (!showMenu) return;
    if (selectedIndex !== lastSelectedRef.current) {
      lastSelectedRef.current = selectedIndex;
      playNav();
    }
  }, [selectedIndex, showMenu, playNav]);

  const confirm = useCallback(
    (item: MenuItem) => {
      if (item.confirmFirst && !eraseArmed) {
        // Arm the warning: lower, heavier thunk than a normal select.
        setEraseArmed(true);
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.55, rate: 0.6 });
        return;
      }
      playSelect();
      // Tiny delay so the click sound has a moment to fire before the page swaps.
      setTimeout(item.action, 90);
    },
    [playSelect, eraseArmed],
  );

  // Moving the cursor anywhere else disarms the erase warning.
  useEffect(() => {
    if (menuItems[selectedIndex]?.confirmFirst) return;
    setEraseArmed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  // Keyboard navigation.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!showMenu) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % menuItems.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        confirm(menuItems[selectedIndex]);
      }
    },
    [showMenu, selectedIndex, menuItems, confirm],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Twinkling stars — deterministic positions (classic + cast variants).
  const stars = Array.from({ length: 28 }, (_, i) => ({
    left: `${((i * 41 + 7) % 97)}%`,
    top: `${((i * 59 + 11) % 80)}%`,
    delay: `${(i * 0.35) % 3}s`,
    size: i % 3 === 0 ? 3 : 2,
  }));

  // Floating pixel "data bits" — drift upward across the screen (classic).
  const drifters = Array.from({ length: 14 }, (_, i) => ({
    left: `${((i * 71 + 5) % 95)}%`,
    delay: `${(i * 1.7) % 12}s`,
    duration: `${10 + (i % 5) * 2}s`,
    color: i % 3 === 0 ? '#FF6B9D' : i % 3 === 1 ? '#00d4aa' : '#6DD8F9',
    size: i % 4 === 0 ? 4 : 3,
  }));

  const paper = variant === 'c';

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen relative overflow-hidden font-['Press_Start_2P'] ${paper ? 'bg-[#8d6820]' : 'bg-[#1a1a2e]'}`}>
      {/* ── Backdrop (Run 14 UI-05 candidates) ── */}
      {variant === 'a' && <NightShiftBackdrop />}
      {variant === 'b' && <CastLineupBackdrop />}
      {variant === 'c' && <CorkboardBackdrop />}
      {variant === 'classic' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{ background: 'radial-gradient(ellipse at center, rgba(93, 176, 202, 0.08) 0%, rgba(26, 26, 46, 0) 60%)' }}
          />
          {drifters.map((d, i) => (
            <div
              key={`drift-${i}`}
              className="absolute pointer-events-none z-0"
              style={{
                left: d.left, bottom: '-10px', width: d.size, height: d.size,
                background: d.color, opacity: 0.6, boxShadow: `0 0 6px ${d.color}`,
                animation: `pixel-drift-up ${d.duration} linear ${d.delay} infinite`,
              }}
            />
          ))}
          <div className="absolute bottom-0 left-0 right-0 z-0 flex items-end justify-center gap-0 pointer-events-none opacity-[0.08]">
            {[12, 20, 28, 36, 44, 32, 24, 48, 36, 28, 20, 16].map((h, i) => (
              <div key={i} className={`bg-white ${i % 2 ? 'w-6' : 'w-10'}`} style={{ height: h * 4 }} />
            ))}
          </div>
        </>
      )}

      {/* Stars — night sky variants only */}
      {(variant === 'classic' || variant === 'b') &&
        stars.map((star, i) => (
          <div
            key={`star-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: star.left, top: star.top, width: star.size, height: star.size,
              background: 'white', opacity: variant === 'b' ? 0.5 : 1,
              animation: `star-twinkle ${2 + (i % 3)}s ease-in-out ${star.delay} infinite`,
            }}
          />
        ))}

      {/* CRT scanline overlay — every variant; it is the game's screen glass */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
        }}
      />
      {variant !== 'c' && (
        <div
          className="absolute left-0 right-0 h-32 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(108, 216, 249, 0.04) 50%, transparent 100%)',
            animation: 'scan-sweep 9s linear infinite',
          }}
        />
      )}

      {/* Pixel computer logo */}
      <div
        className="z-20 mb-3"
        style={{
          opacity: showLogo ? 1 : 0,
          transform: showLogo ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.85)',
          transition: 'all 700ms ease-out',
        }}
      >
        <PixelComputerLogo className={`w-20 h-20 ${paper ? 'drop-shadow-[3px_3px_0_rgba(0,0,0,0.4)]' : 'drop-shadow-[0_0_14px_rgba(93,176,202,0.5)]'}`} />
      </div>

      {/* Title block */}
      <div
        className="z-20 mb-1 text-center"
        style={{
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 700ms ease-out',
        }}
      >
        {paper ? (
          <div className="relative inline-block px-8 py-4 bg-[#f7efd9] border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.45)]" style={{ transform: 'rotate(-0.8deg)' }}>
            {/* tape strips */}
            <div className="absolute -top-2 left-6 w-12 h-4 bg-white/60 border border-black/20" style={{ transform: 'rotate(-6deg)' }} />
            <div className="absolute -top-2 right-6 w-12 h-4 bg-white/60 border border-black/20" style={{ transform: 'rotate(5deg)' }} />
            <h1 className="text-[22px] font-bold tracking-wider leading-relaxed text-[#2a2118]">
              HIPAApocalypse
            </h1>
            <p className="text-[8px] tracking-[0.4em] text-[#8d6820] mt-2">CHOOSE YOUR PATH</p>
          </div>
        ) : (
          <>
            <h1
              className="text-[22px] font-bold tracking-wider leading-relaxed text-white"
              style={{ animation: showTitle ? 'title-glow 3s ease-in-out infinite' : 'none' }}
            >
              HIPAApocalypse
            </h1>
            <p className="text-[8px] tracking-[0.4em] text-[#00d4aa] mt-3">
              CHOOSE YOUR PATH
            </p>
          </>
        )}
      </div>

      {/* Menu — grouped into sections */}
      <div
        className="z-20 mt-8 flex flex-col gap-5 w-[440px] max-w-[90vw]"
        style={{
          opacity: showMenu ? 1 : 0,
          transform: showMenu ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 500ms ease-out',
        }}
      >
        {SECTIONS.map(section => {
          const sectionItems = menuItems
            .map((item, idx) => ({ item, idx }))
            .filter(({ item }) => item.section === section.id);
          if (sectionItems.length === 0) return null;
          return (
            <div key={section.id} className="flex flex-col gap-3">
              {/* Section header */}
              <div className="flex items-center gap-3 px-1">
                <div className={`h-[2px] w-6 ${paper ? 'bg-[#5a3a1a]' : 'bg-gray-600'}`} />
                <p className={`text-[8px] tracking-[0.4em] ${paper ? 'text-[#4a3012]' : 'text-gray-400'}`}>
                  {section.label}
                </p>
                <div className={`h-[2px] flex-1 ${paper ? 'bg-[#5a3a1a]' : 'bg-gray-600'}`} />
              </div>

              {/* Section items */}
              {sectionItems.map(({ item, idx }) => {
                const isSelected = selectedIndex === idx;
                const tilt = paper ? (idx % 2 === 0 ? -0.9 : 0.8) : 0;
                return (
                  <button
                    key={item.confirmFirst ? 'new-game' : item.label}
                    onClick={() => confirm(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className="group relative text-left transition-transform duration-150"
                    style={{
                      transform: `translateX(${isSelected ? 6 : 0}px) rotate(${tilt}deg)`,
                    }}
                    data-testid={`start-menu-${(item.confirmFirst ? 'new game' : item.label).toLowerCase().replace(/\s+/g, '-')}`}
                    data-armed={item.confirmFirst ? String(eraseArmed) : undefined}
                  >
                    {paper && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                        <PushPin />
                      </span>
                    )}
                    <div
                      className="relative flex items-center gap-4 px-5 py-4 border-4 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
                      style={{
                        backgroundColor: paper
                          ? (isSelected ? '#fffaf0' : '#f0e6cc')
                          : isSelected ? `${item.accent}1A` : 'rgba(22, 33, 62, 0.90)',
                        borderColor: paper ? (isSelected ? item.accent : '#5a3a1a') : isSelected ? item.accent : '#2a3a5c',
                        animation: isSelected ? 'menu-card-pulse 2s ease-in-out infinite' : 'none',
                      }}
                    >
                      {/* Left accent bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: item.accent }}
                      />

                      {/* Cursor */}
                      <span
                        className="inline-block w-4 text-[14px]"
                        style={{
                          color: item.accent,
                          animation: isSelected ? 'cursor-blink 800ms step-end infinite' : 'none',
                          opacity: isSelected ? 1 : 0,
                        }}
                      >
                        {'>'}
                      </span>

                      {/* Mode icon */}
                      <div
                        className="shrink-0 transition-transform duration-150"
                        style={{
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          filter: isSelected ? `drop-shadow(0 0 6px ${item.accent})` : 'none',
                          opacity: isSelected ? 1 : 0.6,
                          imageRendering: 'pixelated',
                        }}
                      >
                        <ModeIcon icon={item.icon} color={item.accent} />
                      </div>

                      {/* Label + description */}
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div
                          className="text-[14px] tracking-wider transition-colors duration-150"
                          style={{ color: paper ? (isSelected ? '#2a2118' : '#5a4a32') : isSelected ? '#ffffff' : '#888899' }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="text-[7px] tracking-[0.2em] transition-colors duration-150"
                          style={{ color: paper ? '#8d6820' : isSelected ? item.accent : '#555569' }}
                        >
                          {item.description}
                        </div>
                        {item.detail && (
                          <div
                            className="text-[6px] tracking-[0.2em]"
                            style={{ color: paper ? '#8d6820' : '#8a8aa0' }}
                            data-testid="start-menu-save-age"
                          >
                            {item.detail}
                          </div>
                        )}
                      </div>

                      {/* Right chevron — appears on selected */}
                      <span
                        className="text-[14px] transition-opacity duration-150"
                        style={{
                          color: item.accent,
                          opacity: isSelected ? 1 : 0,
                        }}
                      >
                        ◆
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer hint + credits — variant b lifts it above the cast strip */}
      <div
        className="absolute z-20 flex flex-col items-center gap-2"
        style={{
          bottom: variant === 'b' ? 166 : 32,
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        <p className={`text-[7px] tracking-wide ${paper ? 'text-[#4a3012]' : 'text-gray-500'}`} style={variant === 'a' ? { textShadow: '1px 1px 0 rgba(0,0,0,0.8)' } : undefined}>
          ↑↓ TO SELECT &bull; ENTER TO CONFIRM
        </p>
        <p className={`text-[7px] tracking-[0.3em] ${paper ? 'text-[#4a3012]' : 'text-gray-400'}`} style={variant === 'a' ? { textShadow: '1px 1px 0 rgba(0,0,0,0.8)' } : undefined}>
          BY ANDREW TSANG &bull; A HEALTH IS OTHER PEOPLE GAME
        </p>
        <p
          className={`text-[7px] tracking-[0.3em] ${paper ? 'text-[#4a3012]' : 'text-[#FFD23F]/70'}`}
          style={variant === 'a' ? { textShadow: '1px 1px 0 rgba(0,0,0,0.8)' } : undefined}
          data-testid="sponsor-presented-by"
        >
          PRESENTED BY {SPONSOR_CONFIG.name.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

export default StartMenu;
