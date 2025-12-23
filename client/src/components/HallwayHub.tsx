import { 
  Building2, 
  FileText, 
  Ambulance, 
  Microscope, 
  Coffee, 
  Monitor,
  Lock,
  CheckCircle2,
  Heart,
  Shield,
  Users,
  Server,
  FileIcon,
  LockIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface PatientStory {
  title: string;
  text: string;
  icon: string;
}

interface Room {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  unlockRequirement?: string | null;
  alwaysUnlocked?: boolean;
  patientStory?: PatientStory;
}

interface HallwayHubProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  completedRooms: string[];
  collectedStories: string[];
  onViewStory: (roomId: string) => void;
}

const ROOM_ICONS: Record<string, LucideIcon> = {
  reception: Building2,
  records_room: FileText,
  er: Ambulance,
  lab: Microscope,
  break_room: Coffee,
  it_office: Monitor,
};

const STORY_ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  shield: Shield,
  lock: LockIcon,
  file: FileIcon,
  server: Server,
  users: Users,
};

const ROOM_POSITIONS: Record<string, { gridArea: string; order: number }> = {
  it_office: { gridArea: 'it', order: 1 },
  break_room: { gridArea: 'break', order: 2 },
  records_room: { gridArea: 'records', order: 3 },
  reception: { gridArea: 'reception', order: 4 },
  er: { gridArea: 'er', order: 5 },
  lab: { gridArea: 'lab', order: 6 },
};

export default function HallwayHub({ 
  rooms, 
  onSelectRoom, 
  completedRooms, 
  collectedStories,
  onViewStory 
}: HallwayHubProps) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  const isRoomUnlocked = (room: Room): boolean => {
    if (room.alwaysUnlocked) return true;
    if (!room.unlockRequirement) return true;
    return completedRooms.includes(room.unlockRequirement);
  };

  const getRoomStatus = (room: Room): 'locked' | 'available' | 'cleared' => {
    if (completedRooms.includes(room.id)) return 'cleared';
    if (isRoomUnlocked(room)) return 'available';
    return 'locked';
  };

  const sortedRooms = [...rooms].sort((a, b) => {
    const orderA = ROOM_POSITIONS[a.id]?.order || 99;
    const orderB = ROOM_POSITIONS[b.id]?.order || 99;
    return orderA - orderB;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary mb-2" data-testid="text-hub-title">
          HALLWAY HUB
        </h2>
        <p className="text-xs text-muted-foreground mb-1">
          Your first day as Privacy Guardian. Something feels off...
        </p>
        <p className="text-xs text-muted-foreground">
          Move through each area and build a culture of protection.
        </p>
      </div>

      <div 
        className="relative bg-[#1a1a2e] border-4 border-primary p-6 mb-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'auto auto auto',
          gridTemplateAreas: `
            ". it ."
            "break hub records"
            "reception er lab"
          `,
          gap: '12px',
        }}
      >
        <div 
          style={{ gridArea: 'hub' }}
          className="flex items-center justify-center bg-[#16213e] border-2 border-primary/50 p-4"
        >
          <div className="text-center">
            <div className="text-2xl mb-1">🏥</div>
            <span className="text-xs text-primary font-bold">HALLWAY</span>
          </div>
        </div>

        {sortedRooms.map((room) => {
          const status = getRoomStatus(room);
          const RoomIcon = ROOM_ICONS[room.id] || Building2;
          const position = ROOM_POSITIONS[room.id];
          const isHovered = hoveredRoom === room.id;
          
          return (
            <button
              key={room.id}
              style={{ gridArea: position?.gridArea }}
              onClick={() => {
                if (status !== 'locked') {
                  onSelectRoom(room.id);
                }
              }}
              onMouseEnter={() => setHoveredRoom(room.id)}
              onMouseLeave={() => setHoveredRoom(null)}
              disabled={status === 'locked'}
              className={`
                relative p-4 transition-all duration-200 text-center
                ${status === 'locked' 
                  ? 'bg-[#16213e]/50 border-2 border-muted cursor-not-allowed opacity-60' 
                  : status === 'cleared'
                    ? 'bg-[#16213e] border-2 border-green-500 hover-elevate cursor-pointer'
                    : 'bg-[#16213e] border-2 border-primary hover-elevate cursor-pointer'
                }
              `}
              data-testid={`button-room-${room.id}`}
              data-status={status}
            >
              {status === 'locked' && (
                <div className="absolute top-1 right-1">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              
              {status === 'cleared' && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" data-testid={`icon-completed-${room.id}`} />
                </div>
              )}
              
              <div className="mb-2 flex justify-center">
                <RoomIcon 
                  className={`w-8 h-8 ${
                    status === 'locked' 
                      ? 'text-muted-foreground' 
                      : status === 'cleared' 
                        ? 'text-green-500' 
                        : 'text-primary'
                  }`} 
                />
              </div>
              
              <h3 className={`text-xs font-bold mb-1 ${
                status === 'locked' ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {room.name}
              </h3>
              
              {room.subtitle && (
                <p className={`text-[10px] italic ${
                  status === 'locked' ? 'text-muted-foreground/50' : 'text-muted-foreground'
                }`}>
                  "{room.subtitle}"
                </p>
              )}

              {isHovered && status !== 'locked' && room.description && (
                <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-48 p-2 bg-background border-2 border-primary text-left">
                  <p className="text-[10px] text-foreground">
                    {room.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-[#1a1a2e] border-4 border-primary p-4 mb-6">
        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          PATIENT STORIES EARNED
        </h3>
        
        {collectedStories.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            Clear rooms to collect patient stories—lives you've protected.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {collectedStories.map((roomId) => {
              const room = rooms.find(r => r.id === roomId);
              if (!room?.patientStory) return null;
              
              const StoryIcon = STORY_ICONS[room.patientStory.icon] || Heart;
              
              return (
                <button
                  key={roomId}
                  onClick={() => onViewStory(roomId)}
                  className="bg-[#16213e] border-2 border-green-500/50 p-2 hover-elevate text-left"
                  data-testid={`story-${roomId}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StoryIcon className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] font-bold text-green-500 truncate">
                      {room.patientStory.title}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground line-clamp-2">
                    {room.patientStory.text.slice(0, 60)}...
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="inline-block bg-[#1a1a2e] border-2 border-primary p-4">
          <p className="text-xs text-foreground mb-2">
            <strong>Mission Progress:</strong> {completedRooms.length} / {rooms.length} areas secured
          </p>
          <div className="flex gap-4 justify-center text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-muted bg-muted/20"></div>
              <span className="text-muted-foreground">Locked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-primary bg-primary/20 animate-pulse"></div>
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-green-500 bg-green-500/20"></div>
              <span className="text-muted-foreground">Cleared</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
