
interface PlayerSpriteProps {
  direction?: 'down' | 'up' | 'left' | 'right';
  characterType?: 'blue' | 'brown' | 'tan' | 'pink' | 'white' | 'cyan' | 'blonde' | 'purple' | 'yellow' | 'green' | 'orange';
}

export default function PlayerSprite({ direction = 'down', characterType = 'blue' }: PlayerSpriteProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 32 32"
        className="w-8 h-8"
        style={{ imageRendering: 'pixelated' }}
      >
        {characterType === 'blue' && <BlueCharacter direction={direction} />}
        {characterType === 'brown' && <BrownCharacter direction={direction} />}
        {characterType === 'tan' && <TanCharacter direction={direction} />}
        {characterType === 'pink' && <PinkCharacter direction={direction} />}
        {characterType === 'white' && <WhiteCharacter direction={direction} />}
        {characterType === 'cyan' && <CyanCharacter direction={direction} />}
        {characterType === 'blonde' && <BlondeCharacter direction={direction} />}
        {characterType === 'purple' && <PurpleCharacter direction={direction} />}
        {characterType === 'yellow' && <YellowCharacter direction={direction} />}
        {characterType === 'green' && <GreenCharacter direction={direction} />}
        {characterType === 'orange' && <OrangeCharacter direction={direction} />}
      </svg>
    </div>
  );
}

// Blue hair character (default)
function BlueCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      {/* Head */}
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      
      {/* Hair */}
      <rect x="11" y="5" width="10" height="3" fill="#4A90E2" />
      <rect x="10" y="6" width="2" height="4" fill="#4A90E2" />
      <rect x="20" y="6" width="2" height="4" fill="#4A90E2" />
      
      {/* Eyes */}
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      {/* Body */}
      <rect x="11" y="14" width="10" height="10" fill="#FF6B35" />
      
      {/* Arms */}
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#FF6B35" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#FF6B35" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#FF6B35" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#FF6B35" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#FF6B35" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#FF6B35" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      {/* Legs */}
      <rect x="12" y="24" width="4" height="6" fill="#000080" />
      <rect x="16" y="24" width="4" height="6" fill="#000080" />
      
      {/* Shoes */}
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}

// Brown hair character
function BrownCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#8B4513" />
      <rect x="10" y="6" width="2" height="4" fill="#8B4513" />
      <rect x="20" y="6" width="2" height="4" fill="#8B4513" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#5C946E" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#5C946E" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#5C946E" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#5C946E" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#5C946E" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#5C946E" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#5C946E" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#654321" />
      <rect x="16" y="24" width="4" height="6" fill="#654321" />
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}

// Tan/beige character
function TanCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#D2B48C" />
      <rect x="10" y="6" width="2" height="4" fill="#D2B48C" />
      <rect x="20" y="6" width="2" height="4" fill="#D2B48C" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#8B7355" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#8B7355" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#8B7355" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#8B7355" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#8B7355" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#8B7355" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#8B7355" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#556B2F" />
      <rect x="16" y="24" width="4" height="6" fill="#556B2F" />
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}

// Pink hair character
function PinkCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#FF69B4" />
      <rect x="10" y="6" width="2" height="4" fill="#FF69B4" />
      <rect x="20" y="6" width="2" height="4" fill="#FF69B4" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#000080" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#000080" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#000080" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#000080" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#000080" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#000080" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#000080" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#FFD700" />
      <rect x="16" y="24" width="4" height="6" fill="#FFD700" />
      <rect x="11" y="30" width="5" height="2" fill="#8B7500" />
      <rect x="16" y="30" width="5" height="2" fill="#8B7500" />
    </g>
  );
}

// White/silver hair character
function WhiteCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#F0F0F0" />
      <rect x="10" y="6" width="2" height="4" fill="#F0F0F0" />
      <rect x="20" y="6" width="2" height="4" fill="#F0F0F0" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#4169E1" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#4169E1" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#4169E1" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#4169E1" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#4169E1" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#4169E1" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#4169E1" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#00CED1" />
      <rect x="16" y="24" width="4" height="6" fill="#00CED1" />
      <rect x="11" y="30" width="5" height="2" fill="#008B8B" />
      <rect x="16" y="30" width="5" height="2" fill="#008B8B" />
    </g>
  );
}

// Cyan hair character
function CyanCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#00CED1" />
      <rect x="10" y="6" width="2" height="4" fill="#00CED1" />
      <rect x="20" y="6" width="2" height="4" fill="#00CED1" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#4B0082" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#4B0082" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#4B0082" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#4B0082" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#4B0082" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#4B0082" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#4B0082" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#00CED1" />
      <rect x="16" y="24" width="4" height="6" fill="#00CED1" />
      <rect x="11" y="30" width="5" height="2" fill="#008B8B" />
      <rect x="16" y="30" width="5" height="2" fill="#008B8B" />
    </g>
  );
}

// Blonde character
function BlondeCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#FFD700" />
      <rect x="10" y="6" width="2" height="4" fill="#FFD700" />
      <rect x="20" y="6" width="2" height="4" fill="#FFD700" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#9370DB" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#9370DB" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#9370DB" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#9370DB" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#9370DB" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#9370DB" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#9370DB" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#000080" />
      <rect x="16" y="24" width="4" height="6" fill="#000080" />
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}

// Purple hair character
function PurpleCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#9370DB" />
      <rect x="10" y="6" width="2" height="4" fill="#9370DB" />
      <rect x="20" y="6" width="2" height="4" fill="#9370DB" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#000080" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#000080" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#000080" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#000080" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#000080" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#000080" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#000080" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#000080" />
      <rect x="16" y="24" width="4" height="6" fill="#000080" />
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}

// Yellow/gold character
function YellowCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#FFD700" />
      <rect x="10" y="6" width="2" height="4" fill="#FFD700" />
      <rect x="20" y="6" width="2" height="4" fill="#FFD700" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#FFD700" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#FFD700" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#FFD700" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#FFD700" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#FFD700" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#FFD700" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#FFD700" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#B8860B" />
      <rect x="16" y="24" width="4" height="6" fill="#B8860B" />
      <rect x="11" y="30" width="5" height="2" fill="#8B7500" />
      <rect x="16" y="30" width="5" height="2" fill="#8B7500" />
    </g>
  );
}

// Green hair character
function GreenCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#32CD32" />
      <rect x="10" y="6" width="2" height="4" fill="#32CD32" />
      <rect x="20" y="6" width="2" height="4" fill="#32CD32" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#000080" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#000080" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#000080" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#000080" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#000080" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#000080" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#000080" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#228B22" />
      <rect x="16" y="24" width="4" height="6" fill="#228B22" />
      <rect x="11" y="30" width="5" height="2" fill="#006400" />
      <rect x="16" y="30" width="5" height="2" fill="#006400" />
    </g>
  );
}

// Orange hair character
function OrangeCharacter({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      <rect x="11" y="5" width="10" height="3" fill="#FF8C00" />
      <rect x="10" y="6" width="2" height="4" fill="#FF8C00" />
      <rect x="20" y="6" width="2" height="4" fill="#FF8C00" />
      
      {isUp ? (
        <>
          <rect x="14" y="9" width="2" height="1" fill="#000" />
          <rect x="18" y="9" width="2" height="1" fill="#000" />
        </>
      ) : (
        <>
          <rect x="14" y="10" width="2" height="2" fill="#000" />
          <rect x="18" y="10" width="2" height="2" fill="#000" />
        </>
      )}
      
      <rect x="11" y="14" width="10" height="10" fill="#FFF" />
      
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#FFF" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#FFF" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#FFF" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#FFF" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#FFF" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#FFF" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      <rect x="12" y="24" width="4" height="6" fill="#FF4500" />
      <rect x="16" y="24" width="4" height="6" fill="#FF4500" />
      <rect x="11" y="30" width="5" height="2" fill="#8B0000" />
      <rect x="16" y="30" width="5" height="2" fill="#8B0000" />
    </g>
  );
}
