import { useEffect, useState, useCallback } from 'react';
import { PatientStory } from '@shared/schema';
import { Heart, Shield, Lock, FileText, Server, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';

interface PatientStoryRevealProps {
  story: PatientStory;
  roomName: string;
  onClose: () => void;
}

const iconMap: Record<string, typeof Heart> = {
  heart: Heart,
  shield: Shield,
  lock: Lock,
  file: FileText,
  server: Server,
  users: Users,
};

export function PatientStoryReveal({ story, roomName, onClose }: PatientStoryRevealProps) {
  const [phase, setPhase] = useState<'entering' | 'title' | 'story' | 'complete'>('entering');
  const [displayedText, setDisplayedText] = useState('');
  const [textIndex, setTextIndex] = useState(0);

  const IconComponent = iconMap[story.icon] || Heart;

  useEffect(() => {
    eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_wave_start', volume: 0.6 });
    const timer = setTimeout(() => setPhase('title'), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase === 'title') {
      const timer = setTimeout(() => setPhase('story'), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'story' && textIndex < story.text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + story.text[textIndex]);
        setTextIndex(prev => prev + 1);
      }, 25);
      return () => clearTimeout(timer);
    } else if (phase === 'story' && textIndex >= story.text.length) {
      setPhase('complete');
    }
  }, [phase, textIndex, story.text]);

  const handleSkip = useCallback(() => {
    if (phase === 'story' && textIndex < story.text.length) {
      setDisplayedText(story.text);
      setTextIndex(story.text.length);
      setPhase('complete');
    } else if (phase === 'complete') {
      onClose();
    }
  }, [phase, textIndex, story.text, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  return (
    <div 
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
      onClick={handleSkip}
      data-testid="patient-story-reveal"
    >
      <div className="max-w-xl w-full text-center">
        {phase === 'entering' && (
          <div className="animate-pulse">
            <IconComponent className="w-16 h-16 text-[#FF6B9D] mx-auto" />
          </div>
        )}

        {(phase === 'title' || phase === 'story' || phase === 'complete') && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-center mb-4">
              <div className="bg-[#FF6B9D]/20 rounded-full p-4 border-2 border-[#FF6B9D]">
                <IconComponent className="w-12 h-12 text-[#FF6B9D]" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[#4ECDC4] font-['Press_Start_2P'] text-[10px] uppercase tracking-wider">
                {roomName} Cleared
              </p>
              <h2 className="text-[#FF6B9D] font-['Press_Start_2P'] text-lg">
                {story.title}
              </h2>
            </div>

            {(phase === 'story' || phase === 'complete') && (
              <div className="bg-black/50 border-2 border-[#4ECDC4] rounded-lg p-6 mt-6">
                <p className="text-white font-['Press_Start_2P'] text-[10px] leading-relaxed text-left">
                  {displayedText}
                  {phase === 'story' && <span className="animate-pulse">▌</span>}
                </p>
              </div>
            )}

            {phase === 'complete' && (
              <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                <p className="text-[#FFE66D] font-['Press_Start_2P'] text-[8px]">
                  This is who you protected.
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="bg-[#FF6B9D] hover:bg-[#FF6B9D]/80 text-white font-['Press_Start_2P'] text-[10px]"
                  data-testid="button-continue"
                >
                  CONTINUE
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
