import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface DialogueBoxProps {
  character: string;
  dialogue: string;
  isComplete: boolean;
  onComplete: () => void;
  onAdvance: () => void;
  portraitImage?: string;
}

export default function DialogueBox({ 
  character, 
  dialogue, 
  isComplete, 
  onComplete, 
  onAdvance,
  portraitImage 
}: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [dialogue]);

  useEffect(() => {
    if (currentIndex < dialogue.length) {
      const timer = setTimeout(() => {
        setDisplayedText(dialogue.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 30);
      return () => clearTimeout(timer);
    } else if (isTyping) {
      setIsTyping(false);
      onComplete();
    }
  }, [currentIndex, dialogue, isTyping, onComplete]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (isTyping) {
          setDisplayedText(dialogue);
          setCurrentIndex(dialogue.length);
          setIsTyping(false);
          onComplete();
        } else if (isComplete) {
          onAdvance();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isTyping, isComplete, dialogue, onComplete, onAdvance]);

  const handleClick = () => {
    if (isTyping) {
      setDisplayedText(dialogue);
      setCurrentIndex(dialogue.length);
      setIsTyping(false);
      onComplete();
    } else if (isComplete) {
      onAdvance();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <Card 
        className="max-w-4xl mx-auto bg-[#1a1a2e] border-4 border-[#FF6B9D] shadow-lg cursor-pointer hover-elevate"
        onClick={handleClick}
        data-testid="container-dialogue-box"
      >
        <div className="flex gap-4 p-6">
          <div className="flex-shrink-0">
            <div 
              className="w-24 h-24 bg-[#16213e] border-4 border-[#FF6B9D] rounded-md flex items-center justify-center overflow-hidden"
              style={{ imageRendering: 'pixelated' }}
              data-testid="npc-portrait"
            >
              {portraitImage ? (
                <img src={portraitImage} alt={character} className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl">👤</div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <span 
                className="font-['Press_Start_2P'] text-[#FF6B9D] text-sm"
                data-testid="text-character-name"
              >
                {character}
              </span>
            </div>
            <div 
              className="font-['Press_Start_2P'] text-white text-xs leading-relaxed min-h-[4rem]"
              data-testid="text-dialogue"
            >
              {displayedText}
              {isTyping && <span className="animate-pulse">▼</span>}
            </div>
            {!isTyping && (
              <div className="mt-4 text-right">
                <span 
                  className="font-['Press_Start_2P'] text-[#FF6B9D] text-xs animate-pulse"
                  data-testid="advance-indicator"
                >
                  Press SPACE ▼
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
