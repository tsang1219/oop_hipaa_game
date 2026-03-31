import { useState, useEffect } from 'react';
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
        className={`bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-[580px] w-full p-6 md:p-8 transform transition-all duration-300 ease-out ${
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
            className="font-['Press_Start_2P'] text-sm md:text-base text-black"
            data-testid="text-item-title"
          >
            {title}
          </h2>
        </div>

        <div className="bg-[#F0F0F0] border-2 border-black p-4 md:p-6 mb-6">
          <p
            className="font-['Press_Start_2P'] text-[10px] md:text-xs leading-relaxed text-black"
            data-testid="text-item-fact"
          >
            {fact}
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.35 });
              onClose();
            }}
            className="font-['Press_Start_2P'] text-xs bg-[#FF6B9D] hover:bg-[#FF5A8A] text-white px-8 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer"
            data-testid="button-close-modal"
          >
            GOT IT!
          </button>
        </div>
      </div>
    </div>
  );
}
