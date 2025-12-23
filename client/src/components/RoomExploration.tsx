import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import EducationalItemModal from './EducationalItemModal';
import KnowledgeTracker from './KnowledgeTracker';
import ChecklistUI from './ChecklistUI';
import NPCSprite from './NPCSprite';
import PlayerSprite from './PlayerSprite';
import ObjectSprite from './ObjectSprites';
import ObservationHint from './ObservationHint';
import ChoicePrompt from './ChoicePrompt';
import { RoomProgressHUD } from './RoomProgressHUD';
import type { Room, NPC, InteractionZone, EducationalItem, Position, Gate } from '@shared/schema';

interface RoomExplorationProps {
  room: Room;
  onTriggerScene: (sceneId: string) => void;
  onExitRoom: () => void;
  onZoneComplete?: (zoneId: string) => void;
  onItemCollect?: (itemId: string) => void;
  totalEducationalItems: number;
  totalScenarios: number;
  completedNPCs: Set<string>;
  completedZones: Set<string>;
  collectedItems: Set<string>;
}

const TILE_SIZE = 32;

export default function RoomExploration({ room, onTriggerScene, onExitRoom, onZoneComplete, onItemCollect, totalEducationalItems, totalScenarios, completedNPCs, completedZones, collectedItems }: RoomExplorationProps) {
  const [playerPos, setPlayerPos] = useState<Position>(room.spawnPoint);
  const [playerDirection, setPlayerDirection] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [nearbyInteraction, setNearbyInteraction] = useState<{type: 'npc' | 'zone' | 'item', data: NPC | InteractionZone | EducationalItem} | null>(null);
  const [selectedItem, setSelectedItem] = useState<EducationalItem | null>(null);
  const [activeObservationGate, setActiveObservationGate] = useState<Gate | null>(null);
  const [activeChoiceGate, setActiveChoiceGate] = useState<Gate | null>(null);
  const [autoMoveTarget, setAutoMoveTarget] = useState<Position | null>(null);
  const [pendingInteraction, setPendingInteraction] = useState<{ type: 'npc' | 'zone' | 'item', data: NPC | InteractionZone | EducationalItem } | null>(null);
  const [movePath, setMovePath] = useState<Position[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [resolvedGates, setResolvedGates] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`resolvedGates_${room.id}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [unlockedNpcs, setUnlockedNpcs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`unlockedNpcs_${room.id}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const gates = room.config?.gates || [];

  const isNpcGated = useCallback((npcId: string): Gate | null => {
    if (unlockedNpcs.has(npcId)) {
      return null;
    }
    for (const gate of gates) {
      if (gate.type === 'choice' && gate.choiceOptions?.some(opt => opt.unlocksId === npcId)) {
        if (!unlockedNpcs.has(npcId)) {
          return gate;
        }
      }
      if (gate.targetId === npcId && !resolvedGates.has(gate.id)) {
        return gate;
      }
    }
    return null;
  }, [gates, resolvedGates, unlockedNpcs]);

  const checkObservationGateTrigger = useCallback((zoneId: string) => {
    for (const gate of gates) {
      if (gate.type === 'observation' && gate.prerequisiteId === zoneId && !resolvedGates.has(gate.id)) {
        setActiveObservationGate(gate);
        return true;
      }
    }
    return false;
  }, [gates, resolvedGates]);

  const resolveGate = useCallback((gateId: string, unlockNpcId?: string) => {
    const newResolved = new Set(resolvedGates);
    newResolved.add(gateId);
    setResolvedGates(newResolved);
    localStorage.setItem(`resolvedGates_${room.id}`, JSON.stringify(Array.from(newResolved)));
    
    if (unlockNpcId) {
      const newUnlocked = new Set(unlockedNpcs);
      newUnlocked.add(unlockNpcId);
      setUnlockedNpcs(newUnlocked);
      localStorage.setItem(`unlockedNpcs_${room.id}`, JSON.stringify(Array.from(newUnlocked)));
    }
  }, [resolvedGates, unlockedNpcs, room.id]);

  useEffect(() => {
    const choiceGate = gates.find(g => g.type === 'choice' && !resolvedGates.has(g.id));
    if (choiceGate) {
      setActiveChoiceGate(choiceGate);
    }
  }, [gates, resolvedGates]);

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

  const findPath = useCallback((start: Position, goal: Position): Position[] => {
    const queue: Array<{ pos: Position; path: Position[] }> = [{ pos: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);
    
    let closestPos: Position = start;
    let closestDist = Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
    let closestPath: Position[] = [];

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      
      const dist = Math.abs(goal.x - pos.x) + Math.abs(goal.y - pos.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestPos = pos;
        closestPath = path;
      }

      if (pos.x === goal.x && pos.y === goal.y) {
        return path.slice(1);
      }

      const neighbors = [
        { x: pos.x, y: pos.y - 1 },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x + 1, y: pos.y },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key) && !checkCollision(neighbor.x, neighbor.y)) {
          visited.add(key);
          queue.push({ pos: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return closestPath.slice(1);
  }, [checkCollision]);

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

  const handleInteraction = () => {
    if (nearbyInteraction) {
      if (nearbyInteraction.type === 'item') {
        const item = nearbyInteraction.data as EducationalItem;
        setSelectedItem(item);
      } else if (nearbyInteraction.type === 'npc') {
        const npc = nearbyInteraction.data as NPC;
        const gate = isNpcGated(npc.id);
        if (gate) {
          return;
        }
        onTriggerScene(npc.sceneId);
      } else {
        const zone = nearbyInteraction.data as InteractionZone;
        const hasGate = checkObservationGateTrigger(zone.id);
        if (!hasGate) {
          onZoneComplete?.(zone.id);
          onTriggerScene(zone.sceneId);
        }
      }
    }
  };

  const handleNpcClick = (npc: NPC, e: React.MouseEvent) => {
    e.stopPropagation();
    const gate = isNpcGated(npc.id);
    if (gate) {
      return;
    }
    startPathMovement({ x: npc.x, y: npc.y }, { type: 'npc', data: npc });
  };

  const handleZoneClick = (zone: InteractionZone, e: React.MouseEvent) => {
    e.stopPropagation();
    startPathMovement({ x: zone.x, y: zone.y }, { type: 'zone', data: zone });
  };

  const handleItemClick = (item: EducationalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    startPathMovement({ x: item.x, y: item.y }, { type: 'item', data: item });
  };

  const handleCloseModal = () => {
    if (selectedItem && !collectedItems.has(selectedItem.id)) {
      onItemCollect?.(selectedItem.id);
    }
    setSelectedItem(null);
  };

  const handleGameAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    
    if (x >= 0 && x < room.width && y >= 0 && y < room.height) {
      const path = findPath(playerPos, { x, y });
      if (path.length > 0) {
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
        }
        setMovePath(path);
        setIsMoving(true);
        setPendingInteraction(null);
        setAutoMoveTarget({ x, y });
      }
    }
  };

  const startPathMovement = useCallback((targetPos: Position, interaction: { type: 'npc' | 'zone' | 'item', data: NPC | InteractionZone | EducationalItem } | null) => {
    const path = findPath(playerPos, targetPos);
    if (path.length > 0) {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
      setMovePath(path);
      setIsMoving(true);
      setPendingInteraction(interaction);
      setAutoMoveTarget(targetPos);
    } else if (interaction) {
      const distance = Math.abs(playerPos.x - targetPos.x) + Math.abs(playerPos.y - targetPos.y);
      if (distance <= 1) {
        setNearbyInteraction(interaction);
      }
    }
  }, [playerPos, findPath]);

  useEffect(() => {
    if (isMoving && movePath.length > 0) {
      moveIntervalRef.current = setInterval(() => {
        setMovePath(currentPath => {
          if (currentPath.length === 0) {
            setIsMoving(false);
            return [];
          }
          
          const nextStep = currentPath[0];
          const remainingPath = currentPath.slice(1);
          
          setPlayerPos(prev => {
            const dx = nextStep.x - prev.x;
            const dy = nextStep.y - prev.y;
            if (dx < 0) setPlayerDirection('left');
            else if (dx > 0) setPlayerDirection('right');
            else if (dy < 0) setPlayerDirection('up');
            else if (dy > 0) setPlayerDirection('down');
            return nextStep;
          });
          
          if (remainingPath.length === 0) {
            setIsMoving(false);
            setAutoMoveTarget(null);
          }
          
          return remainingPath;
        });
      }, 150);

      return () => {
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
        }
      };
    }
  }, [isMoving]);

  useEffect(() => {
    if (!isMoving && pendingInteraction && autoMoveTarget === null) {
      const targetPos = pendingInteraction.type === 'npc' 
        ? { x: (pendingInteraction.data as NPC).x, y: (pendingInteraction.data as NPC).y }
        : pendingInteraction.type === 'zone'
        ? { x: (pendingInteraction.data as InteractionZone).x, y: (pendingInteraction.data as InteractionZone).y }
        : { x: (pendingInteraction.data as EducationalItem).x, y: (pendingInteraction.data as EducationalItem).y };
      
      const distance = Math.abs(playerPos.x - targetPos.x) + Math.abs(playerPos.y - targetPos.y);
      
      if (distance <= 1) {
        setNearbyInteraction(pendingInteraction);
      }
      setPendingInteraction(null);
    }
  }, [isMoving, pendingInteraction, autoMoveTarget, playerPos]);

  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMoving) return;
      
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
  }, [movePlayer, nearbyInteraction, onExitRoom, isMoving]);

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

      <div 
        className="relative border-4 border-primary bg-card cursor-pointer"
        style={{
          width: room.width * TILE_SIZE,
          height: room.height * TILE_SIZE,
          imageRendering: 'pixelated',
        }}
        onClick={handleGameAreaClick}
        data-testid="game-area"
      >
        <RoomProgressHUD 
          room={room}
          completedNpcs={completedNPCs}
          completedZones={completedZones}
          collectedItems={collectedItems}
        />
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
          const gatedBy = isNpcGated(npc.id);
          const isGated = !!gatedBy;
          
          return (
            <div key={npc.id} className="relative">
              <div 
                className={`absolute ${isGated ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  left: npc.x * TILE_SIZE,
                  top: npc.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  opacity: isCompleted ? 0.5 : isGated ? 0.6 : 1,
                  filter: isGated ? 'grayscale(50%)' : 'none',
                  zIndex: 25,
                }}
                onClick={(e) => handleNpcClick(npc, e)}
                data-testid={`npc-${npc.id}`}
                data-gated={isGated ? 'true' : 'false'}
              >
                <NPCSprite npcId={npc.id} direction="down" />
              </div>
              {isGated && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: npc.x * TILE_SIZE + TILE_SIZE / 2 - 6,
                    top: npc.y * TILE_SIZE - 8,
                    zIndex: 35,
                  }}
                  data-testid={`gate-indicator-${npc.id}`}
                >
                  <span className="text-xs">🔒</span>
                </div>
              )}
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
                  <span className="text-xs font-bold text-destructive drop-shadow-md">BOSS</span>
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
          const spriteType = zone.spriteType || 'computer';
          
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
              onClick={(e) => handleZoneClick(zone, e)}
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
              onClick={(e) => handleItemClick(item, e)}
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
          {nearbyInteraction.type === 'npc' && isNpcGated((nearbyInteraction.data as NPC).id) ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                🔒 {(nearbyInteraction.data as NPC).name}
              </p>
              <div className="mb-2 p-2 bg-muted rounded text-left">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">Gate Requirement:</p>
                <p className="text-xs text-muted-foreground italic">
                  {isNpcGated((nearbyInteraction.data as NPC).id)?.observationHint || "Look around first..."}
                </p>
                {(() => {
                  const gate = isNpcGated((nearbyInteraction.data as NPC).id);
                  const prerequisite = gate?.prerequisiteId ? room.interactionZones.find(z => z.id === gate.prerequisiteId) : null;
                  if (prerequisite) {
                    return (
                      <p className="text-xs text-foreground mt-2 font-medium">
                        👉 Find and examine: <span className="font-bold">{prerequisite.name}</span>
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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

      {activeObservationGate && (
        <ObservationHint
          gate={activeObservationGate}
          onAcknowledge={() => {
            resolveGate(activeObservationGate.id, activeObservationGate.targetId);
            setActiveObservationGate(null);
          }}
        />
      )}

      {activeChoiceGate && (
        <ChoicePrompt
          gate={activeChoiceGate}
          onChoice={(unlockedId) => {
            resolveGate(activeChoiceGate.id, unlockedId);
            setActiveChoiceGate(null);
          }}
        />
      )}
    </div>
  );
}