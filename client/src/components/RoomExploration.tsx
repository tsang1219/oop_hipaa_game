import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import EducationalItemModal from './EducationalItemModal';
import KnowledgeTracker from './KnowledgeTracker';
import ChecklistUI from './ChecklistUI';
import NPCSprite from './NPCSprite';
import PlayerSprite from './PlayerSprite';
import ObjectSprite from './ObjectSprites';
import type { Room, NPC, InteractionZone, EducationalItem, Position } from '@shared/schema';

interface RoomExplorationProps {
  room: Room;
  onTriggerScene: (sceneId: string) => void;
  onExitRoom: () => void;
  totalEducationalItems: number;
  totalScenarios: number;
}

const TILE_SIZE = 32;

export default function RoomExploration({ room, onTriggerScene, onExitRoom, totalEducationalItems, totalScenarios }: RoomExplorationProps) {
  const [playerPos, setPlayerPos] = useState<Position>(room.spawnPoint);
  const [playerDirection, setPlayerDirection] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [nearbyInteraction, setNearbyInteraction] = useState<{type: 'npc' | 'zone' | 'item', data: NPC | InteractionZone | EducationalItem} | null>(null);
  const [selectedItem, setSelectedItem] = useState<EducationalItem | null>(null);
  const [showLockedMessage, setShowLockedMessage] = useState(false);
  const [collectedItems, setCollectedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('collectedEducationalItems');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [completedNPCs, setCompletedNPCs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('completedNPCs');
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
    // Update direction
    if (dx < 0) setPlayerDirection('left');
    else if (dx > 0) setPlayerDirection('right');
    else if (dy < 0) setPlayerDirection('up');
    else if (dy > 0) setPlayerDirection('down');

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

  const allItemsCollected = collectedItems.size >= totalEducationalItems;

  const handleInteraction = () => {
    if (nearbyInteraction) {
      if (nearbyInteraction.type === 'item') {
        const item = nearbyInteraction.data as EducationalItem;
        setSelectedItem(item);
      } else if (nearbyInteraction.type === 'npc') {
        if (!allItemsCollected) {
          setShowLockedMessage(true);
          setTimeout(() => setShowLockedMessage(false), 3000);
          return;
        }
        const npc = nearbyInteraction.data as NPC;
        onTriggerScene(npc.sceneId);
      } else {
        const zone = nearbyInteraction.data as InteractionZone;
        onTriggerScene(zone.sceneId);
      }
    }
  };

  const handleItemClick = (item: EducationalItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    if (selectedItem && !collectedItems.has(selectedItem.id)) {
      const newCollected = new Set(collectedItems);
      newCollected.add(selectedItem.id);
      setCollectedItems(newCollected);
      localStorage.setItem('collectedEducationalItems', JSON.stringify(Array.from(newCollected)));
    }
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

      <KnowledgeTracker />

      <ChecklistUI 
        educationalItemsCollected={collectedItems.size}
        totalEducationalItems={totalEducationalItems}
        scenariosCompleted={completedNPCs.size}
        totalScenarios={totalScenarios}
      />

      {showLockedMessage && (
        <div className="bg-destructive/90 border-4 border-destructive text-destructive-foreground px-6 py-3 rounded-md text-center" data-testid="locked-message">
          <p className="text-sm font-bold">⚠️ QUEST LOCKED ⚠️</p>
          <p className="text-xs mt-1">
            Learn the basics first! Read all {totalEducationalItems} educational items before talking to staff.
          </p>
        </div>
      )}

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

        {room.npcs.map((npc) => {
          if (npc.isFinalBoss && completedNPCs.size < totalScenarios - 1) {
            return null;
          }
          
          const isCompleted = completedNPCs.has(npc.id);
          const isBoss = npc.isFinalBoss;
          
          return (
            <div key={npc.id} className="relative">
              <div 
                className="absolute cursor-pointer"
                style={{
                  left: npc.x * TILE_SIZE,
                  top: npc.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  opacity: isCompleted ? 0.5 : 1,
                  zIndex: 25,
                }}
                onClick={() => {
                  if (allItemsCollected) {
                    onTriggerScene(npc.sceneId);
                  } else {
                    setShowLockedMessage(true);
                    setTimeout(() => setShowLockedMessage(false), 3000);
                  }
                }}
                data-testid={`npc-${npc.id}`}
              >
                <NPCSprite npcId={npc.id} direction="down" />
              </div>
              {isBoss && !isCompleted && (
                <div
                  className="absolute pointer-events-none animate-pulse"
                  style={{
                    left: npc.x * TILE_SIZE + TILE_SIZE / 2 - 8,
                    top: npc.y * TILE_SIZE - 12,
                    zIndex: 35,
                  }}
                  data-testid="boss-indicator"
                >
                  <span className="text-xs font-bold text-destructive drop-shadow-md">⚠️ BOSS</span>
                </div>
              )}
              {isCompleted && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: npc.x * TILE_SIZE + TILE_SIZE / 2 - 8,
                    top: npc.y * TILE_SIZE - 8,
                    zIndex: 35,
                  }}
                  data-testid={`checkmark-${npc.id}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 drop-shadow-md" />
                </div>
              )}
            </div>
          );
        })}

        {room.interactionZones.map((zone) => {
          const spriteType = zone.spriteType || 'computer'; // default to computer if not specified
          
          return (
            <div
              key={zone.id}
              className="absolute animate-bounce cursor-pointer hover:scale-110 transition-all"
              style={{
                left: zone.x * TILE_SIZE,
                top: zone.y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                zIndex: 20,
              }}
              onClick={() => onTriggerScene(zone.sceneId)}
              data-testid={`zone-${zone.id}`}
            >
              <ObjectSprite type={spriteType} size={TILE_SIZE} />
            </div>
          );
        })}

        {room.educationalItems.map((item) => {
          const isCollected = collectedItems.has(item.id);
          return (
            <div
              key={`${item.id}-${isCollected}`}
              className={`absolute cursor-pointer transition-opacity duration-300 ${isCollected ? '' : 'hover:scale-110 transition-all'}`}
              style={{
                left: item.x * TILE_SIZE,
                top: item.y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isCollected ? 0.4 : 1,
                zIndex: 10,
              }}
              onClick={() => handleItemClick(item)}
              data-testid={`educational-item-${item.id}`}
              data-collected={isCollected ? 'true' : 'false'}
            >
              <ObjectSprite type={item.type} size={TILE_SIZE} />
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
            zIndex: 30,
          }}
          data-testid="player-sprite"
        >
          <PlayerSprite direction={playerDirection} characterType="blue" />
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