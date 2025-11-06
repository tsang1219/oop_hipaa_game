
interface ObjectSpriteProps {
  type: 'poster' | 'manual' | 'computer' | 'whiteboard';
  size?: number;
}

export default function ObjectSprite({ type, size = 32 }: ObjectSpriteProps) {
  const sprites = {
    computer: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Monitor stand */}
        <rect x="14" y="24" width="4" height="4" fill="#4a4a4a" />
        <rect x="10" y="28" width="12" height="2" fill="#4a4a4a" />
        
        {/* Monitor body */}
        <rect x="8" y="8" width="16" height="16" fill="#2a2a2a" />
        <rect x="9" y="9" width="14" height="14" fill="#1a1a1a" />
        
        {/* Screen */}
        <rect x="10" y="10" width="12" height="10" fill="#4a9eff" />
        <rect x="11" y="11" width="10" height="8" fill="#6ab7ff" />
        
        {/* Highlight */}
        <rect x="11" y="11" width="2" height="2" fill="#ffffff" opacity="0.6" />
        
        {/* Power button */}
        <rect x="15" y="21" width="2" height="1" fill="#00ff00" />
      </svg>
    ),
    
    poster: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Poster board */}
        <rect x="6" y="4" width="20" height="24" fill="#f5f5dc" />
        <rect x="7" y="5" width="18" height="22" fill="#ffffff" />
        
        {/* Border */}
        <rect x="8" y="6" width="16" height="20" fill="#e8e8e8" />
        
        {/* Content lines */}
        <rect x="10" y="8" width="12" height="2" fill="#ff6b6b" />
        <rect x="10" y="12" width="10" height="1" fill="#4a4a4a" />
        <rect x="10" y="14" width="12" height="1" fill="#4a4a4a" />
        <rect x="10" y="16" width="8" height="1" fill="#4a4a4a" />
        
        {/* Icon */}
        <rect x="10" y="19" width="4" height="4" fill="#4a9eff" />
        <rect x="15" y="19" width="4" height="4" fill="#ff6b6b" />
        
        {/* Push pins */}
        <circle cx="8" cy="6" r="1" fill="#ff4444" />
        <circle cx="24" cy="6" r="1" fill="#ff4444" />
      </svg>
    ),
    
    manual: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Book base */}
        <rect x="8" y="6" width="16" height="20" fill="#8b4513" />
        <rect x="9" y="7" width="14" height="18" fill="#a0522d" />
        
        {/* Pages */}
        <rect x="10" y="8" width="12" height="16" fill="#f5f5dc" />
        <rect x="11" y="9" width="10" height="14" fill="#ffffff" />
        
        {/* Page lines */}
        <rect x="12" y="11" width="8" height="1" fill="#cccccc" />
        <rect x="12" y="13" width="8" height="1" fill="#cccccc" />
        <rect x="12" y="15" width="8" height="1" fill="#cccccc" />
        <rect x="12" y="17" width="8" height="1" fill="#cccccc" />
        <rect x="12" y="19" width="8" height="1" fill="#cccccc" />
        
        {/* Spine */}
        <rect x="8" y="6" width="2" height="20" fill="#654321" />
        
        {/* Title on spine */}
        <rect x="11" y="10" width="6" height="2" fill="#ff6b6b" />
      </svg>
    ),
    
    whiteboard: (
      <svg viewBox="0 0 32 32" width={size} height={size} style={{ imageRendering: 'pixelated' }}>
        {/* Board frame */}
        <rect x="4" y="4" width="24" height="18" fill="#2a2a2a" />
        <rect x="5" y="5" width="22" height="16" fill="#ffffff" />
        
        {/* Writing */}
        <rect x="7" y="7" width="8" height="2" fill="#0066cc" />
        <rect x="17" y="7" width="6" height="2" fill="#0066cc" />
        
        <rect x="7" y="11" width="10" height="1" fill="#000000" />
        <rect x="7" y="13" width="12" height="1" fill="#000000" />
        <rect x="7" y="15" width="8" height="1" fill="#000000" />
        
        {/* Diagram */}
        <rect x="19" y="11" width="4" height="4" fill="none" stroke="#ff0000" strokeWidth="1" />
        <line x1="21" y1="15" x2="21" y2="17" stroke="#ff0000" strokeWidth="1" />
        
        {/* Marker tray */}
        <rect x="4" y="22" width="24" height="3" fill="#cccccc" />
        <rect x="8" y="23" width="2" height="2" fill="#0066cc" />
        <rect x="12" y="23" width="2" height="2" fill="#ff0000" />
        <rect x="16" y="23" width="2" height="2" fill="#00cc00" />
        <rect x="20" y="23" width="2" height="2" fill="#000000" />
        
        {/* Eraser */}
        <rect x="24" y="23" width="3" height="2" fill="#666666" />
      </svg>
    ),
  };

  return sprites[type];
}
