import { Button } from '@/components/ui/button';
import { Heart, Shield, Lock, FileText, Server, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PatientStory {
  title: string;
  text: string;
  icon: string;
}

interface PatientStoryModalProps {
  story: PatientStory;
  roomName: string;
  onClose: () => void;
  isRoomClear?: boolean;
}

const STORY_ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  shield: Shield,
  lock: Lock,
  file: FileText,
  server: Server,
  users: Users,
};

export default function PatientStoryModal({ 
  story, 
  roomName, 
  onClose,
  isRoomClear = false
}: PatientStoryModalProps) {
  const StoryIcon = STORY_ICONS[story.icon] || Heart;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="modal-patient-story"
    >
      <div 
        className="bg-[#1a1a2e] border-4 border-green-500 p-6 max-w-lg w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          data-testid="button-close-story"
        >
          <X className="w-5 h-5" />
        </button>

        {isRoomClear && (
          <div className="text-center mb-4">
            <span className="text-green-500 font-bold text-sm animate-pulse">
              ✓ AREA SECURED
            </span>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <StoryIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-green-500 text-center mb-2" data-testid="story-title">
          {story.title}
        </h2>

        <p className="text-xs text-muted-foreground text-center mb-4">
          {roomName}
        </p>

        <div className="bg-[#16213e] border-2 border-green-500/30 p-4 mb-6">
          <p className="text-sm text-foreground leading-relaxed italic" data-testid="story-text">
            "{story.text}"
          </p>
        </div>

        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground">
            This story has been added to your collection.
          </p>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          data-testid="button-continue"
        >
          CONTINUE
        </Button>
      </div>
    </div>
  );
}
