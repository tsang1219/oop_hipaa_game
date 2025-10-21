import { 
  Building2, 
  FileText, 
  Ambulance, 
  Microscope, 
  Coffee, 
  Monitor,
  CheckCircle2 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HospitalRoom {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface HospitalHubProps {
  rooms: HospitalRoom[];
  onSelectRoom: (roomId: string) => void;
  completedRooms: string[];
}

const ROOM_ICONS: Record<string, LucideIcon> = {
  reception: Building2,
  records_room: FileText,
  er: Ambulance,
  lab: Microscope,
  break_room: Coffee,
  it_office: Monitor,
};

const ROOM_DESCRIPTIONS: Record<string, string> = {
  reception: 'Front desk area with sign-in sheets and phone calls',
  records_room: 'Medical records storage and file management',
  er: 'Emergency room with patient status boards',
  lab: 'Laboratory with computers and test results',
  break_room: 'Staff break area - watch for casual conversations',
  it_office: 'IT department - password and access management',
};

export default function HospitalHub({ rooms, onSelectRoom, completedRooms }: HospitalHubProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-foreground mb-2" data-testid="text-hub-title">
          HOSPITAL MAP
        </h2>
        <p className="text-xs text-muted-foreground">
          Select a department to explore and find HIPAA privacy violations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const isCompleted = completedRooms.includes(room.id);
          const RoomIcon = ROOM_ICONS[room.id] || Building2;
          
          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className="relative bg-card border-4 border-primary p-6 hover-elevate active-elevate-2 text-left transition-all"
              data-testid={`button-room-${room.id}`}
            >
              {isCompleted && (
                <div className="absolute top-2 right-2" data-testid={`icon-completed-${room.id}`}>
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              )}
              
              <div className="mb-3 text-center flex justify-center">
                <RoomIcon className="w-12 h-12 text-primary" />
              </div>
              
              <h3 className="text-sm font-bold text-foreground mb-2 text-center">
                {room.name}
              </h3>
              
              <p className="text-xs text-muted-foreground text-center">
                {ROOM_DESCRIPTIONS[room.id] || 'Explore this area'}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="inline-block bg-card border-2 border-primary p-4">
          <p className="text-xs text-foreground mb-2">
            <strong>Progress:</strong> {completedRooms.length} / {rooms.length} departments explored
          </p>
          <div className="flex gap-2 justify-center">
            <div className="flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
