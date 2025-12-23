import { Room, CompletionRequirements } from '@shared/schema';
import { CheckCircle, Circle, User, MapPin, BookOpen } from 'lucide-react';

interface RoomProgressHUDProps {
  room: Room;
  completedNpcs: Set<string>;
  completedZones: Set<string>;
  collectedItems: Set<string>;
}

export function RoomProgressHUD({ 
  room, 
  completedNpcs, 
  completedZones, 
  collectedItems 
}: RoomProgressHUDProps) {
  const requirements = room.completionRequirements;
  
  if (!requirements) {
    return null;
  }

  const npcsDone = requirements.requiredNpcs.filter(id => completedNpcs.has(id)).length;
  const npcsTotal = requirements.requiredNpcs.length;
  
  const zonesDone = requirements.requiredZones.filter(id => completedZones.has(id)).length;
  const zonesTotal = requirements.requiredZones.length;
  
  const itemsDone = requirements.requiredItems.filter(id => collectedItems.has(id)).length;
  const itemsTotal = requirements.requiredItems.length;

  const totalDone = npcsDone + zonesDone + itemsDone;
  const totalRequired = npcsTotal + zonesTotal + itemsTotal;
  const isComplete = totalDone >= totalRequired;

  return (
    <div 
      className="absolute top-2 right-2 bg-black/80 border-2 border-[#FF6B9D] rounded-lg p-3 text-white font-['Press_Start_2P'] text-[8px]"
      data-testid="room-progress-hud"
    >
      <div className="flex items-center gap-2 mb-2">
        {isComplete ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Circle className="w-4 h-4 text-[#FF6B9D]" />
        )}
        <span className={isComplete ? 'text-green-400' : 'text-white'}>
          {isComplete ? 'ROOM CLEAR!' : 'PROGRESS'}
        </span>
      </div>
      
      <div className="space-y-1">
        {npcsTotal > 0 && (
          <div className="flex items-center gap-2" data-testid="progress-npcs">
            <User className="w-3 h-3 text-[#4ECDC4]" />
            <span className={npcsDone >= npcsTotal ? 'text-green-400' : ''}>
              NPCs: {npcsDone}/{npcsTotal}
            </span>
          </div>
        )}
        
        {zonesTotal > 0 && (
          <div className="flex items-center gap-2" data-testid="progress-zones">
            <MapPin className="w-3 h-3 text-[#FFE66D]" />
            <span className={zonesDone >= zonesTotal ? 'text-green-400' : ''}>
              Areas: {zonesDone}/{zonesTotal}
            </span>
          </div>
        )}
        
        {itemsTotal > 0 && (
          <div className="flex items-center gap-2" data-testid="progress-items">
            <BookOpen className="w-3 h-3 text-[#FF6B9D]" />
            <span className={itemsDone >= itemsTotal ? 'text-green-400' : ''}>
              Learn: {itemsDone}/{itemsTotal}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
