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
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBridge, BRIDGE_EVENTS } from '../phaser/EventBridge';
import { PixelComputerLogo } from './PixelComputerLogo';

export interface StartMenuProps {
  onDemo: () => void;
  onTowerDefense: () => void;
  onFullGame: () => void;
}

type SectionId = 'main-rpg' | 'mini-games';

interface MenuItem {
  label: string;
  description: string;
  accent: string;
  icon: 'cross' | 'bolt' | 'shield';
  section: SectionId;
  action: () => void;
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

export function StartMenu({ onDemo, onTowerDefense, onFullGame }: StartMenuProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const lastSelectedRef = useRef(0);

  const menuItems: MenuItem[] = [
    {
      label: 'FULL GAME',
      description: 'PROTECT THE HOSPITAL',
      accent: '#FFD23F',
      icon: 'cross',
      section: 'main-rpg',
      action: onFullGame,
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
    (action: () => void) => {
      playSelect();
      // Tiny delay so the click sound has a moment to fire before the page swaps.
      setTimeout(action, 90);
    },
    [playSelect],
  );

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
        confirm(menuItems[selectedIndex].action);
      }
    },
    [showMenu, selectedIndex, menuItems, confirm],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Twinkling stars — deterministic positions.
  const stars = Array.from({ length: 28 }, (_, i) => ({
    left: `${((i * 41 + 7) % 97)}%`,
    top: `${((i * 59 + 11) % 80)}%`,
    delay: `${(i * 0.35) % 3}s`,
    size: i % 3 === 0 ? 3 : 2,
  }));

  // Floating pixel "data bits" — drift upward across the screen.
  const drifters = Array.from({ length: 14 }, (_, i) => ({
    left: `${((i * 71 + 5) % 95)}%`,
    delay: `${(i * 1.7) % 12}s`,
    duration: `${10 + (i % 5) * 2}s`,
    color: i % 3 === 0 ? '#FF6B9D' : i % 3 === 1 ? '#00d4aa' : '#6DD8F9',
    size: i % 4 === 0 ? 4 : 3,
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] relative overflow-hidden font-['Press_Start_2P']">
      {/* Vignette / radial gradient — adds depth */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(93, 176, 202, 0.08) 0%, rgba(26, 26, 46, 0) 60%)',
        }}
      />

      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Slow scan sweep — soft horizontal band drifting down */}
      <div
        className="absolute left-0 right-0 h-32 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(108, 216, 249, 0.04) 50%, transparent 100%)',
          animation: 'scan-sweep 9s linear infinite',
        }}
      />

      {/* Twinkling stars */}
      {stars.map((star, i) => (
        <div
          key={`star-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: 'white',
            animation: `star-twinkle ${2 + (i % 3)}s ease-in-out ${star.delay} infinite`,
          }}
        />
      ))}

      {/* Floating data bits drifting upward */}
      {drifters.map((d, i) => (
        <div
          key={`drift-${i}`}
          className="absolute pointer-events-none z-0"
          style={{
            left: d.left,
            bottom: '-10px',
            width: d.size,
            height: d.size,
            background: d.color,
            opacity: 0.6,
            boxShadow: `0 0 6px ${d.color}`,
            animation: `pixel-drift-up ${d.duration} linear ${d.delay} infinite`,
          }}
        />
      ))}

      {/* Pixel computer logo */}
      <div
        className="z-20 mb-3"
        style={{
          opacity: showLogo ? 1 : 0,
          transform: showLogo ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.85)',
          transition: 'all 700ms ease-out',
        }}
      >
        <PixelComputerLogo className="w-20 h-20 drop-shadow-[0_0_14px_rgba(93,176,202,0.5)]" />
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
        <h1
          className="text-[22px] font-bold tracking-wider leading-relaxed text-white"
          style={{ animation: showTitle ? 'title-glow 3s ease-in-out infinite' : 'none' }}
        >
          HIPAApocalypse
        </h1>
        <p className="text-[8px] tracking-[0.4em] text-[#00d4aa] mt-3">
          CHOOSE YOUR PATH
        </p>
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
                <div className="h-[2px] w-6 bg-gray-600" />
                <p className="text-[8px] tracking-[0.4em] text-gray-400">
                  {section.label}
                </p>
                <div className="h-[2px] flex-1 bg-gray-600" />
              </div>

              {/* Section items */}
              {sectionItems.map(({ item, idx }) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={item.label}
                    onClick={() => confirm(item.action)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className="group relative text-left transition-transform duration-150"
                    style={{
                      transform: isSelected ? 'translateX(6px)' : 'translateX(0)',
                    }}
                    data-testid={`start-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div
                      className="relative flex items-center gap-4 px-5 py-4 border-4 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-150"
                      style={{
                        backgroundColor: isSelected ? `${item.accent}1A` : '#16213e',
                        borderColor: isSelected ? item.accent : '#2a3a5c',
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
                          style={{ color: isSelected ? '#ffffff' : '#888899' }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="text-[7px] tracking-[0.2em] transition-colors duration-150"
                          style={{ color: isSelected ? item.accent : '#555569' }}
                        >
                          {item.description}
                        </div>
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

      {/* Footer hint + credits */}
      <div
        className="absolute bottom-8 z-20 flex flex-col items-center gap-2"
        style={{
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        <p className="text-[7px] text-gray-600 tracking-wide">
          ↑↓ TO SELECT &bull; ENTER TO CONFIRM
        </p>
        <p className="text-[7px] text-gray-500 tracking-[0.3em]">
          BY ANDREW TSANG &bull; A HEALTH IS OTHER PEOPLE GAME
        </p>
      </div>

      {/* Pixel hospital silhouette */}
      <div className="absolute bottom-0 left-0 right-0 z-0 flex items-end justify-center gap-0 pointer-events-none opacity-[0.08]">
        <div className="w-8 h-12 bg-white" />
        <div className="w-6 h-20 bg-white" />
        <div className="w-10 h-28 bg-white" />
        <div className="w-4 h-36 bg-white" />
        <div className="w-12 h-44 bg-white" />
        <div className="w-6 h-32 bg-white" />
        <div className="w-8 h-24 bg-white" />
        <div className="w-14 h-48 bg-white" />
        <div className="w-6 h-36 bg-white" />
        <div className="w-10 h-28 bg-white" />
        <div className="w-8 h-20 bg-white" />
        <div className="w-6 h-16 bg-white" />
      </div>
    </div>
  );
}

export default StartMenu;
