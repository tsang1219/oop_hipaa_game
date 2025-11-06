
interface NPCSpriteProps {
  npcId: string;
  direction?: 'down' | 'up' | 'left' | 'right';
}

export default function NPCSprite({ npcId, direction = 'down' }: NPCSpriteProps) {
  // Map NPCs to their character types
  const npcCharacterMap: Record<string, string> = {
    'riley': 'receptionist',
    'nina': 'nurse',
    'martinez': 'doctor',
    'sam': 'it_tech',
    'gary': 'staff',
    'cathy': 'staff'
  };

  const characterType = npcCharacterMap[npcId] || 'staff';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      >
        {characterType === 'nurse' && <NurseSprite direction={direction} />}
        {characterType === 'receptionist' && <ReceptionistSprite direction={direction} />}
        {characterType === 'doctor' && <DoctorSprite direction={direction} />}
        {characterType === 'it_tech' && <ITTechSprite direction={direction} />}
        {characterType === 'staff' && <StaffSprite direction={direction} />}
      </svg>
    </div>
  );
}

// Nurse Nina sprite (blue scrubs)
function NurseSprite({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      {/* Head/Face */}
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      
      {/* Hair */}
      <rect x="11" y="5" width="10" height="3" fill="#8B4513" />
      <rect x="10" y="6" width="2" height="4" fill="#8B4513" />
      <rect x="20" y="6" width="2" height="4" fill="#8B4513" />
      
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
      
      {/* Body (scrubs) */}
      <rect x="11" y="14" width="10" height="10" fill="#4A90E2" />
      
      {/* Arms */}
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#4A90E2" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#4A90E2" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#4A90E2" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#4A90E2" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#4A90E2" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#4A90E2" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      {/* Legs */}
      <rect x="12" y="24" width="4" height="6" fill="#2C5AA0" />
      <rect x="16" y="24" width="4" height="6" fill="#2C5AA0" />
      
      {/* Shoes */}
      <rect x="11" y="30" width="5" height="2" fill="#FFF" />
      <rect x="16" y="30" width="5" height="2" fill="#FFF" />
    </g>
  );
}

// Receptionist sprite (professional attire)
function ReceptionistSprite({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      {/* Head */}
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      
      {/* Hair */}
      <rect x="11" y="5" width="10" height="4" fill="#FF6B9D" />
      <rect x="10" y="7" width="12" height="2" fill="#FF6B9D" />
      
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
      
      {/* Body (blouse) */}
      <rect x="11" y="14" width="10" height="10" fill="#E8F4F8" />
      
      {/* Arms */}
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#E8F4F8" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#E8F4F8" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#E8F4F8" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#E8F4F8" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#E8F4F8" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#E8F4F8" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      {/* Skirt/Pants */}
      <rect x="12" y="24" width="4" height="6" fill="#333" />
      <rect x="16" y="24" width="4" height="6" fill="#333" />
      
      {/* Shoes */}
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}

// Doctor sprite (white coat)
function DoctorSprite({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      {/* Head */}
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      
      {/* Hair */}
      <rect x="12" y="5" width="8" height="3" fill="#4A4A4A" />
      
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
      
      {/* Body (white coat) */}
      <rect x="10" y="14" width="12" height="10" fill="#FFF" />
      <rect x="11" y="15" width="10" height="8" fill="#4A90E2" />
      
      {/* Arms */}
      {isLeft ? (
        <>
          <rect x="7" y="15" width="3" height="7" fill="#FFF" />
          <rect x="7" y="22" width="3" height="2" fill="#FDBCB4" />
          <rect x="22" y="16" width="3" height="6" fill="#FFF" />
          <rect x="22" y="22" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="7" y="16" width="3" height="6" fill="#FFF" />
          <rect x="7" y="22" width="3" height="2" fill="#FDBCB4" />
          <rect x="22" y="15" width="3" height="7" fill="#FFF" />
          <rect x="22" y="22" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="7" y="15" width="3" height="7" fill="#FFF" />
          <rect x="7" y="22" width="3" height="2" fill="#FDBCB4" />
          <rect x="22" y="15" width="3" height="7" fill="#FFF" />
          <rect x="22" y="22" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      {/* Legs */}
      <rect x="12" y="24" width="4" height="6" fill="#333" />
      <rect x="16" y="24" width="4" height="6" fill="#333" />
      
      {/* Shoes */}
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}

// IT Tech sprite
function ITTechSprite({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      {/* Head */}
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      
      {/* Hair */}
      <rect x="12" y="5" width="8" height="4" fill="#654321" />
      
      {/* Glasses */}
      <rect x="13" y="9" width="3" height="3" fill="#FFF" stroke="#000" strokeWidth="0.5" />
      <rect x="18" y="9" width="3" height="3" fill="#FFF" stroke="#000" strokeWidth="0.5" />
      <rect x="16" y="10" width="2" height="1" fill="#000" />
      
      {/* Body (polo shirt) */}
      <rect x="11" y="14" width="10" height="10" fill="#5C946E" />
      
      {/* Arms */}
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
      
      {/* Legs (jeans) */}
      <rect x="12" y="24" width="4" height="6" fill="#4169E1" />
      <rect x="16" y="24" width="4" height="6" fill="#4169E1" />
      
      {/* Shoes */}
      <rect x="11" y="30" width="5" height="2" fill="#8B4513" />
      <rect x="16" y="30" width="5" height="2" fill="#8B4513" />
    </g>
  );
}

// Generic staff sprite
function StaffSprite({ direction }: { direction: string }) {
  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isUp = direction === 'up';
  
  return (
    <g>
      {/* Head */}
      <rect x="12" y="6" width="8" height="8" fill="#FDBCB4" />
      
      {/* Hair */}
      <rect x="11" y="5" width="10" height="3" fill="#FFD700" />
      <rect x="10" y="6" width="2" height="4" fill="#FFD700" />
      <rect x="20" y="6" width="2" height="4" fill="#FFD700" />
      
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
      <rect x="11" y="14" width="10" height="10" fill="#9B59B6" />
      
      {/* Arms */}
      {isLeft ? (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#9B59B6" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="16" width="2" height="5" fill="#9B59B6" />
          <rect x="21" y="21" width="2" height="2" fill="#FDBCB4" />
        </>
      ) : isRight ? (
        <>
          <rect x="9" y="16" width="2" height="5" fill="#9B59B6" />
          <rect x="9" y="21" width="2" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#9B59B6" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      ) : (
        <>
          <rect x="8" y="15" width="3" height="6" fill="#9B59B6" />
          <rect x="8" y="21" width="3" height="2" fill="#FDBCB4" />
          <rect x="21" y="15" width="3" height="6" fill="#9B59B6" />
          <rect x="21" y="21" width="3" height="2" fill="#FDBCB4" />
        </>
      )}
      
      {/* Legs */}
      <rect x="12" y="24" width="4" height="6" fill="#555" />
      <rect x="16" y="24" width="4" height="6" fill="#555" />
      
      {/* Shoes */}
      <rect x="11" y="30" width="5" height="2" fill="#000" />
      <rect x="16" y="30" width="5" height="2" fill="#000" />
    </g>
  );
}
