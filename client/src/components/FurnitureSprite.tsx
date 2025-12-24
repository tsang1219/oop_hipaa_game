interface FurnitureSpriteProps {
  type: 'desk' | 'bed' | 'cabinet' | 'table' | 'counter' | 'rack' | 'shelf' | 'chair';
  size?: number;
}

export default function FurnitureSprite({ type, size = 32 }: FurnitureSpriteProps) {
  const sprites = {
    desk: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Desktop */}
        <rect x="2" y="8" width="28" height="4" fill="#8b6914" />
        <rect x="2" y="8" width="28" height="2" fill="#b8860b" />
        {/* Left leg */}
        <rect x="4" y="12" width="3" height="18" fill="#654321" />
        {/* Right leg */}
        <rect x="25" y="12" width="3" height="18" fill="#654321" />
        {/* Drawer */}
        <rect x="10" y="16" width="12" height="6" fill="#8b6914" stroke="#654321" strokeWidth="1" />
        <rect x="13" y="18" width="2" height="2" fill="#ffd700" />
      </svg>
    ),

    bed: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Frame */}
        <rect x="2" y="8" width="28" height="20" fill="#8b4513" />
        {/* Mattress */}
        <rect x="4" y="10" width="24" height="16" fill="#ff6b9d" />
        <rect x="4" y="10" width="24" height="2" fill="#ff85b8" />
        {/* Pillow */}
        <rect x="6" y="12" width="8" height="4" fill="#ffffff" />
        {/* Headboard */}
        <rect x="2" y="4" width="28" height="4" fill="#654321" />
      </svg>
    ),

    cabinet: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Cabinet body */}
        <rect x="3" y="4" width="26" height="24" fill="#8b6914" />
        {/* Left door */}
        <rect x="4" y="6" width="12" height="20" fill="#b8860b" />
        <rect x="8" y="14" width="2" height="2" fill="#ffd700" />
        {/* Right door */}
        <rect x="16" y="6" width="12" height="20" fill="#b8860b" />
        <rect x="24" y="14" width="2" height="2" fill="#ffd700" />
        {/* Shelves */}
        <rect x="4" y="12" width="24" height="1" fill="#654321" />
        <rect x="4" y="20" width="24" height="1" fill="#654321" />
      </svg>
    ),

    table: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Tabletop */}
        <rect x="4" y="6" width="24" height="3" fill="#a0522d" />
        <rect x="4" y="6" width="24" height="1" fill="#d2691e" />
        {/* Legs */}
        <rect x="6" y="9" width="2" height="19" fill="#654321" />
        <rect x="8" y="9" width="2" height="19" fill="#654321" />
        <rect x="22" y="9" width="2" height="19" fill="#654321" />
        <rect x="24" y="9" width="2" height="19" fill="#654321" />
      </svg>
    ),

    counter: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Counter surface */}
        <rect x="2" y="6" width="28" height="4" fill="#a0522d" />
        <rect x="2" y="6" width="28" height="2" fill="#d2691e" />
        {/* Counter face */}
        <rect x="2" y="10" width="28" height="16" fill="#8b6914" />
        {/* Sections */}
        <rect x="2" y="10" width="7" height="16" fill="#b8860b" />
        <rect x="10" y="10" width="7" height="16" fill="#a0722d" />
        <rect x="18" y="10" width="7" height="16" fill="#b8860b" />
        <rect x="26" y="10" width="4" height="16" fill="#a0722d" />
      </svg>
    ),

    rack: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Vertical posts */}
        <rect x="4" y="2" width="2" height="26" fill="#4a4a4a" />
        <rect x="26" y="2" width="2" height="26" fill="#4a4a4a" />
        {/* Shelves */}
        <rect x="4" y="6" width="24" height="1" fill="#808080" />
        <rect x="4" y="12" width="24" height="1" fill="#808080" />
        <rect x="4" y="18" width="24" height="1" fill="#808080" />
        <rect x="4" y="24" width="24" height="1" fill="#808080" />
        {/* Slots */}
        <rect x="8" y="7" width="3" height="4" fill="#2a2a2a" opacity="0.8" />
        <rect x="13" y="7" width="3" height="4" fill="#2a2a2a" opacity="0.8" />
        <rect x="18" y="7" width="3" height="4" fill="#2a2a2a" opacity="0.8" />
        <rect x="23" y="7" width="2" height="4" fill="#2a2a2a" opacity="0.8" />
      </svg>
    ),

    shelf: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Left support */}
        <rect x="2" y="4" width="2" height="24" fill="#654321" />
        {/* Right support */}
        <rect x="28" y="4" width="2" height="24" fill="#654321" />
        {/* Shelves */}
        <rect x="2" y="6" width="28" height="2" fill="#8b6914" />
        <rect x="2" y="14" width="28" height="2" fill="#8b6914" />
        <rect x="2" y="22" width="28" height="2" fill="#8b6914" />
      </svg>
    ),

    chair: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Seat */}
        <rect x="8" y="10" width="16" height="3" fill="#ff6b9d" />
        {/* Back */}
        <rect x="10" y="6" width="12" height="6" fill="#ff85b8" />
        {/* Legs */}
        <rect x="10" y="13" width="2" height="13" fill="#654321" />
        <rect x="20" y="13" width="2" height="13" fill="#654321" />
        {/* Arm support */}
        <rect x="6" y="10" width="2" height="8" fill="#ff85b8" />
        <rect x="24" y="10" width="2" height="8" fill="#ff85b8" />
      </svg>
    ),
  };

  return sprites[type];
}
