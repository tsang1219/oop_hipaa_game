import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';

interface EducationalItemModalProps {
  title: string;
  fact: string;
  type: 'poster' | 'manual' | 'computer' | 'whiteboard';
  onClose: () => void;
}

const ITEM_ICONS = {
  poster: '📋',
  manual: '📖',
  computer: '💻',
  whiteboard: '📝'
};

export default function EducationalItemModal({ title, fact, type, onClose }: EducationalItemModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.35 });
    });
  }, []);

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
        isVisible ? 'bg-black/70' : 'bg-black/0'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="educational-item-title"
      data-testid="modal-educational-item"
    >
      <div
        className={`bg-background border-4 border-primary max-w-2xl w-full p-6 md:p-8 transform transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          imageRendering: 'pixelated',
        }}
        data-testid="educational-item-modal"
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl" style={{ imageRendering: 'auto' }}>
            {ITEM_ICONS[type]}
          </span>
          <h2 
            id="educational-item-title"
            className="text-lg md:text-xl font-bold text-foreground"
            data-testid="text-item-title"
          >
            {title}
          </h2>
        </div>

        <div className="bg-card border-2 border-primary p-4 md:p-6 mb-6">
          <p 
            className="text-xs md:text-sm leading-relaxed text-foreground"
            data-testid="text-item-fact"
          >
            {fact}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => {
              eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.35 });
              onClose();
            }}
            variant="default"
            size="lg"
            className="min-w-[200px]"
            data-testid="button-close-modal"
          >
            GOT IT!
          </Button>
        </div>
      </div>
    </div>
  );
}
