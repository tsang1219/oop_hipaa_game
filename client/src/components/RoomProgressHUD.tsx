import { useState, useEffect, useRef } from 'react';
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

  // Track recently completed categories for glow pulse
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const prevCompletedRef = useRef<string[]>([]);

  // Build a list of currently completed category keys
  const completedCategories: string[] = [];
  if (npcsDone >= npcsTotal && npcsTotal > 0) completedCategories.push('npcs');
  if (zonesDone >= zonesTotal && zonesTotal > 0) completedCategories.push('zones');
  if (itemsDone >= itemsTotal && itemsTotal > 0) completedCategories.push('items');
  if (isComplete) completedCategories.push('room');

  useEffect(() => {
    const newItems = completedCategories.filter(r => !prevCompletedRef.current.includes(r));
    if (newItems.length > 0) {
      setRecentlyCompleted(prev => {
        const next = new Set(prev);
        newItems.forEach(r => next.add(r));
        return next;
      });
      // Clear the glow after 2 seconds
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          newItems.forEach(r => next.delete(r));
          return next;
        });
      }, 2000);
    }
    prevCompletedRef.current = [...completedCategories];
  }, [npcsDone, zonesDone, itemsDone, isComplete]);

  return (
    <div
      className="absolute top-2 right-2 bg-black/80 border-4 border-black rounded-[4px] p-3 text-white font-['Press_Start_2P'] text-[8px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      data-testid="room-progress-hud"
      style={{
        boxShadow: recentlyCompleted.has('room') ? '0 0 14px rgba(100, 255, 100, 0.7)' : 'none',
        transition: 'box-shadow 300ms ease-out'
      }}
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
          <div
            className="flex items-center gap-2"
            data-testid="progress-npcs"
            style={{
              boxShadow: recentlyCompleted.has('npcs') ? '0 0 10px rgba(100, 255, 100, 0.6)' : 'none',
              transition: 'box-shadow 300ms ease-out'
            }}
          >
            <User className="w-3 h-3 text-[#4ECDC4]" />
            <span className={npcsDone >= npcsTotal ? 'text-green-400' : ''}>
              NPCs: {npcsDone}/{npcsTotal}
            </span>
          </div>
        )}
        
        {zonesTotal > 0 && (
          <div
            className="flex items-center gap-2"
            data-testid="progress-zones"
            style={{
              boxShadow: recentlyCompleted.has('zones') ? '0 0 10px rgba(100, 255, 100, 0.6)' : 'none',
              transition: 'box-shadow 300ms ease-out'
            }}
          >
            <MapPin className="w-3 h-3 text-[#FFE66D]" />
            <span className={zonesDone >= zonesTotal ? 'text-green-400' : ''}>
              Areas: {zonesDone}/{zonesTotal}
            </span>
          </div>
        )}
        
        {itemsTotal > 0 && (
          <div
            className="flex items-center gap-2"
            data-testid="progress-items"
            style={{
              boxShadow: recentlyCompleted.has('items') ? '0 0 10px rgba(100, 255, 100, 0.6)' : 'none',
              transition: 'box-shadow 300ms ease-out'
            }}
          >
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
