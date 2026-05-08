/**
 * StartMenu — Three-button mode selector for the v2.2 Sponsor Demo.
 *
 * DEMO-01: First screen the player sees on `/`. Buttons in fixed order:
 *   DEMO  →  curated 4-room sponsor pitch
 *   TOWER DEFENSE  →  standalone arcade-mode TD (Phase 19 wires)
 *   FULL GAME  →  existing full-game flow with progression + save
 *
 * Pure presentation: no Phaser, no eventBridge, no localStorage. The parent
 * (UnifiedGamePage) wires the three callbacks. Keyboard nav matches the
 * existing TitleScreen vocabulary: Arrow / W-S to move, Enter / Space to confirm.
 */

import { useCallback, useEffect, useState } from 'react';

export interface StartMenuProps {
  onDemo: () => void;
  onTowerDefense: () => void;
  onFullGame: () => void;
}

interface MenuItem {
  label: string;
  action: () => void;
}

export function StartMenu({ onDemo, onTowerDefense, onFullGame }: StartMenuProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  // Fixed order — DEMO first (the primary sponsor-pitch path), TD, then FULL GAME.
  const menuItems: MenuItem[] = [
    { label: 'DEMO', action: onDemo },
    { label: 'TOWER DEFENSE', action: onTowerDefense },
    { label: 'FULL GAME', action: onFullGame },
  ];

  // Staggered reveal (matches TitleScreen pacing).
  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 150);
    const t2 = setTimeout(() => setShowMenu(true), 600);
    const t3 = setTimeout(() => setShowFooter(true), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

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
        menuItems[selectedIndex].action();
      }
    },
    [showMenu, selectedIndex, menuItems],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Twinkling stars — deterministic positions.
  const stars = Array.from({ length: 24 }, (_, i) => ({
    left: `${((i * 41 + 7) % 97)}%`,
    top: `${((i * 59 + 11) % 80)}%`,
    delay: `${(i * 0.35) % 3}s`,
    size: i % 3 === 0 ? 3 : 2,
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] relative overflow-hidden font-['Press_Start_2P']">
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Twinkling stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animation: `star-twinkle ${2 + (i % 3)}s ease-in-out ${star.delay} infinite`,
          }}
        />
      ))}

      {/* Title block */}
      <div
        className="z-20 mb-2 text-center"
        style={{
          opacity: showLogo ? 1 : 0,
          transform: showLogo ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 700ms ease-out',
        }}
      >
        <h1
          className="text-[20px] font-bold tracking-wider leading-relaxed text-white"
          style={{ animation: showLogo ? 'title-glow 3s ease-in-out infinite' : 'none' }}
        >
          HIPAApocalypse
        </h1>
        <p className="text-[8px] tracking-[0.3em] text-[#00d4aa] mt-3">
          PICK YOUR POISON
        </p>
      </div>

      {/* Menu card */}
      <div
        className="z-20 mt-8"
        style={{
          opacity: showMenu ? 1 : 0,
          transform: showMenu ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 500ms ease-out',
        }}
      >
        <div className="bg-[#16213e] border-4 border-[#FF6B9D] rounded-[4px] px-10 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4">
            {menuItems.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex items-center gap-3 w-full text-left text-[12px] transition-colors duration-150 ${
                  selectedIndex === i ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                data-testid={`start-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span
                  className="inline-block w-4 text-[#FF6B9D]"
                  style={{
                    animation: selectedIndex === i ? 'cursor-blink 800ms step-end infinite' : 'none',
                    opacity: selectedIndex === i ? 1 : 0,
                  }}
                >
                  {'>'}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div
        className="absolute bottom-8 z-20"
        style={{
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        <p className="text-[7px] text-gray-600 tracking-wide">
          ARROW KEYS TO SELECT &bull; ENTER TO CONFIRM
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
