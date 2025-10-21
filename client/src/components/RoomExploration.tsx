import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import EducationalItemModal from './EducationalItemModal';

interface Position {
  x: number;
  y: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  sceneId: string;
}

interface InteractionZone {
  id: string;
  name: string;
  x: number;
  y: number;
  sceneId: string;
}

interface EducationalItem {
  id: string;
  title: string;
  type: 'poster' | 'manual' | 'computer' | 'whiteboard';
  x: number;
  y: number;
  fact: string;
}

interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundImage: string;
  obstacles: Obstacle[];
  npcs: NPC[];
  interactionZones: InteractionZone[];
  educationalItems: EducationalItem[];
  spawnPoint: Position;
}

interface RoomExplorationProps {
  room: Room;
  onTriggerScene: (sceneId: string) => void;
  onExitRoom: () => void;
}

const TILE_SIZE = 32;

const ITEM_ICONS = {
  poster: '📋',
  manual: '📖',
  computer: '💻',
  whiteboard: '📝'
};

export default function RoomExploration({ room, onTriggerScene, onExitRoom }: RoomExplorationProps) {
  const [playerPos, setPlayerPos] = useState<Position>(room.spawnPoint);
  const [nearbyInteraction, setNearbyInteraction] = useState<{type: 'npc' | 'zone' | 'item', data: NPC | InteractionZone | EducationalItem} | null>(null);
  const [selectedItem, setSelectedItem] = useState<EducationalItem | null>(null);
  const [collectedItems, setCollectedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('collectedEducationalItems');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const checkCollision = useCallback((newX: number, newY: number): boolean => {
    for (const obstacle of room.obstacles) {
      if (
        newX >= obstacle.x &&
        newX < obstacle.x + obstacle.width &&
        newY >= obstacle.y &&
        newY < obstacle.y + obstacle.height
      ) {
        return true;
      }
    }
    return false;
  }, [room.obstacles]);

  const checkNearbyInteraction = useCallback((x: number, y: number) => {
    for (const npc of room.npcs) {
      const distance = Math.abs(npc.x - x) + Math.abs(npc.y - y);
      if (distance <= 1) {
        setNearbyInteraction({ type: 'npc', data: npc });
        return;
      }
    }
    
    for (const zone of room.interactionZones) {
      const distance = Math.abs(zone.x - x) + Math.abs(zone.y - y);
      if (distance <= 1) {
        setNearbyInteraction({ type: 'zone', data: zone });
        return;
      }
    }

    for (const item of room.educationalItems) {
      const distance = Math.abs(item.x - x) + Math.abs(item.y - y);
      if (distance <= 1) {
        setNearbyInteraction({ type: 'item', data: item });
        return;
      }
    }
    
    setNearbyInteraction(null);
  }, [room.npcs, room.interactionZones, room.educationalItems]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    setPlayerPos(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      
      if (checkCollision(newX, newY)) {
        return prev;
      }
      
      checkNearbyInteraction(newX, newY);
      return { x: newX, y: newY };
    });
  }, [checkCollision, checkNearbyInteraction]);

  const handleInteraction = () => {
    if (nearbyInteraction) {
      if (nearbyInteraction.type === 'item') {
        const item = nearbyInteraction.data as EducationalItem;
        setSelectedItem(item);
        const newCollected = new Set(collectedItems);
        newCollected.add(item.id);
        setCollectedItems(newCollected);
        localStorage.setItem('collectedEducationalItems', JSON.stringify(Array.from(newCollected)));
      } else {
        const sceneId = nearbyInteraction.type === 'npc' 
          ? (nearbyInteraction.data as NPC).sceneId 
          : (nearbyInteraction.data as InteractionZone).sceneId;
        onTriggerScene(sceneId);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(1, 0);
          break;
        case ' ':
          e.preventDefault();
          handleInteraction();
          break;
        case 'Escape':
          e.preventDefault();
          onExitRoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, nearbyInteraction, onExitRoom]);

  useEffect(() => {
    checkNearbyInteraction(playerPos.x, playerPos.y);
  }, [playerPos, checkNearbyInteraction]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground mb-2" data-testid="text-room-name">
          {room.name}
        </h2>
        <p className="text-xs text-muted-foreground">
          Use arrow keys or WASD to move • Press SPACE to interact
        </p>
      </div>

      <div 
        className="relative border-4 border-primary bg-card"
        style={{
          width: room.width * TILE_SIZE,
          height: room.height * TILE_SIZE,
          imageRendering: 'pixelated',
        }}
      >
        {room.obstacles.map((obstacle, index) => (
          <div
            key={`obstacle-${index}`}
            className="absolute bg-muted opacity-30"
            style={{
              left: obstacle.x * TILE_SIZE,
              top: obstacle.y * TILE_SIZE,
              width: obstacle.width * TILE_SIZE,
              height: obstacle.height * TILE_SIZE,
            }}
          />
        ))}

        {room.npcs.map((npc) => (
          <div
            key={npc.id}
            className="absolute"
            style={{
              left: npc.x * TILE_SIZE,
              top: npc.y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            data-testid={`npc-${npc.id}`}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-destructive opacity-70" style={{
                clipPath: 'polygon(30% 20%, 70% 20%, 70% 40%, 80% 40%, 80% 60%, 70% 60%, 70% 90%, 30% 90%, 30% 60%, 20% 60%, 20% 40%, 30% 40%)'
              }} />
              <div className="absolute top-[25%] left-[35%] w-2 h-2 bg-background rounded-full" />
              <div className="absolute top-[25%] right-[35%] w-2 h-2 bg-background rounded-full" />
            </div>
          </div>
        ))}

        {room.interactionZones.map((zone) => (
          <div
            key={zone.id}
            className="absolute animate-bounce"
            style={{
              left: zone.x * TILE_SIZE + 8,
              top: zone.y * TILE_SIZE,
              width: TILE_SIZE - 16,
              height: TILE_SIZE,
            }}
            data-testid={`zone-${zone.id}`}
          >
            <div className="w-full h-full bg-accent" style={{
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
            }} />
          </div>
        ))}

        {room.educationalItems.map((item) => {
          const isCollected = collectedItems.has(item.id);
          return (
            <div
              key={item.id}
              className={`absolute cursor-pointer transition-all ${isCollected ? 'opacity-40' : 'opacity-100 hover:scale-110'}`}
              style={{
                left: item.x * TILE_SIZE,
                top: item.y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
              onClick={() => {
                setSelectedItem(item);
                if (!isCollected) {
                  const newCollected = new Set(collectedItems);
                  newCollected.add(item.id);
                  setCollectedItems(newCollected);
                  localStorage.setItem('collectedEducationalItems', JSON.stringify(Array.from(newCollected)));
                }
              }}
              data-testid={`educational-item-${item.id}`}
            >
              <span style={{ imageRendering: 'auto' }}>{ITEM_ICONS[item.type]}</span>
            </div>
          );
        })}

        <div
          className="absolute transition-all duration-100"
          style={{
            left: playerPos.x * TILE_SIZE,
            top: playerPos.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            imageRendering: 'pixelated',
          }}
          data-testid="player-sprite"
        >
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-primary" style={{
              clipPath: 'polygon(30% 0, 70% 0, 70% 30%, 90% 30%, 90% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 10% 70%, 10% 30%, 30% 30%)'
            }} />
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-background" style={{
              transform: 'translate(-50%, -50%)'
            }} />
          </div>
        </div>
      </div>

      {nearbyInteraction && (
        <div className="text-center bg-card border-2 border-primary p-4">
          <p className="text-sm text-foreground mb-2">
            {nearbyInteraction.type === 'npc' 
              ? `Talk to ${(nearbyInteraction.data as NPC).name}` 
              : nearbyInteraction.type === 'zone'
              ? `Examine ${(nearbyInteraction.data as InteractionZone).name}`
              : `Read ${(nearbyInteraction.data as EducationalItem).title}`}
          </p>
          <Button 
            onClick={handleInteraction}
            data-testid="button-interact"
          >
            INTERACT (SPACE)
          </Button>
        </div>
      )}

      <Button 
        variant="outline" 
        onClick={onExitRoom}
        data-testid="button-exit-room"
      >
        EXIT ROOM (ESC)
      </Button>

      {selectedItem && (
        <EducationalItemModal
          title={selectedItem.title}
          fact={selectedItem.fact}
          type={selectedItem.type}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
