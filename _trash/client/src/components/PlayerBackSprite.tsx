interface PlayerBackSpriteProps {
  characterType?: 'blue' | 'brown' | 'tan' | 'pink' | 'white' | 'cyan' | 'blonde' | 'purple' | 'yellow' | 'green' | 'orange';
  size?: number;
}

export default function PlayerBackSprite({ characterType = 'blue', size = 96 }: PlayerBackSpriteProps) {
  const hairColors: Record<string, string> = {
    blue: '#4A90E2',
    brown: '#8B4513',
    tan: '#D2B48C',
    pink: '#FF69B4',
    white: '#F0F0F0',
    cyan: '#00CED1',
    blonde: '#FFD700',
    purple: '#9370DB',
    yellow: '#FFD700',
    green: '#32CD32',
    orange: '#FF8C00',
  };

  const shirtColors: Record<string, string> = {
    blue: '#FF6B35',
    brown: '#5C946E',
    tan: '#8B7355',
    pink: '#000080',
    white: '#4169E1',
    cyan: '#4B0082',
    blonde: '#9370DB',
    purple: '#000080',
    yellow: '#FFD700',
    green: '#000080',
    orange: '#2E8B57',
  };

  const pantsColors: Record<string, string> = {
    blue: '#000080',
    brown: '#654321',
    tan: '#556B2F',
    pink: '#FFD700',
    white: '#00CED1',
    cyan: '#00CED1',
    blonde: '#000080',
    purple: '#000080',
    yellow: '#B8860B',
    green: '#228B22',
    orange: '#1E3A5F',
  };

  const hairColor = hairColors[characterType];
  const shirtColor = shirtColors[characterType];
  const pantsColor = pantsColors[characterType];

  return (
    <div 
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 40"
        width={size}
        height={size * 1.25}
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Back of head - larger, more prominent */}
        <rect x="10" y="4" width="12" height="10" fill={hairColor} />
        <rect x="9" y="6" width="14" height="6" fill={hairColor} />
        
        {/* Hair texture lines */}
        <rect x="12" y="5" width="1" height="8" fill={hairColor} opacity="0.7" />
        <rect x="15" y="4" width="1" height="9" fill={hairColor} opacity="0.7" />
        <rect x="18" y="5" width="1" height="8" fill={hairColor} opacity="0.7" />
        
        {/* Neck */}
        <rect x="13" y="14" width="6" height="2" fill="#FDBCB4" />
        
        {/* Shoulders and back */}
        <rect x="7" y="16" width="18" height="14" fill={shirtColor} />
        
        {/* Shirt collar */}
        <rect x="11" y="16" width="10" height="2" fill={shirtColor} />
        
        {/* Shirt back seam detail */}
        <rect x="15" y="18" width="2" height="10" fill={shirtColor} opacity="0.7" />
        
        {/* Arms from behind */}
        <rect x="4" y="17" width="4" height="10" fill={shirtColor} />
        <rect x="24" y="17" width="4" height="10" fill={shirtColor} />
        
        {/* Hands */}
        <rect x="4" y="27" width="4" height="3" fill="#FDBCB4" />
        <rect x="24" y="27" width="4" height="3" fill="#FDBCB4" />
        
        {/* Pants/lower body */}
        <rect x="9" y="30" width="6" height="8" fill={pantsColor} />
        <rect x="17" y="30" width="6" height="8" fill={pantsColor} />
        
        {/* Belt */}
        <rect x="9" y="29" width="14" height="2" fill="#333" />
        
        {/* Shoes */}
        <rect x="8" y="38" width="7" height="2" fill="#000" />
        <rect x="17" y="38" width="7" height="2" fill="#000" />
      </svg>
    </div>
  );
}
