import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Gate } from '@shared/schema';
import { eventBridge, BRIDGE_EVENTS } from '@/phaser/EventBridge';

interface ChoicePromptProps {
  gate: Gate;
  onChoice: (unlockedId: string) => void;
}

export default function ChoicePrompt({ gate, onChoice }: ChoicePromptProps) {
  const [visible, setVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const options = gate.choiceOptions || [];

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true);
      eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.35 });
    }, 100);
    const optionsTimer = setTimeout(() => setShowOptions(true), 500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(optionsTimer);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(options.length - 1, prev + 1));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (options[selectedIndex]) {
          eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.55 });
          onChoice(options[selectedIndex].unlocksId);
        }
      } else if (e.key === '1' && options[0]) {
        e.preventDefault();
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.55 });
        onChoice(options[0].unlocksId);
      } else if (e.key === '2' && options[1]) {
        e.preventDefault();
        eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.55 });
        onChoice(options[1].unlocksId);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [options, selectedIndex, onChoice]);

  if (options.length === 0) return null;

  return (
    <div 
      className={`absolute inset-0 z-50 flex items-center justify-center bg-background/80 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      data-testid="choice-prompt-overlay"
    >
      <div
        className={`bg-card border-4 border-primary p-6 max-w-md mx-4 transform transition-all duration-300 ease-out ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        <p 
          className="text-sm text-foreground mb-6 text-center leading-relaxed"
          data-testid="text-choice-description"
        >
          {gate.description}
        </p>
        
        <div className="flex flex-col gap-3">
          {options.map((option, index) => (
            <Button
              key={option.unlocksId}
              variant={selectedIndex === index ? 'default' : 'outline'}
              className={`text-left justify-start p-4 h-auto ${
                selectedIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              style={{
                opacity: showOptions ? 1 : 0,
                transform: showOptions ? 'translateY(0)' : 'translateY(8px)',
                transition: `all 300ms ease-out ${index * 100}ms`,
              }}
              onClick={() => {
                eventBridge.emit(BRIDGE_EVENTS.REACT_PLAY_SFX, { key: 'sfx_interact', volume: 0.55 });
                onChoice(option.unlocksId);
              }}
              data-testid={`button-choice-${index}`}
            >
              <span className="mr-2 text-xs opacity-60">{index + 1}.</span>
              <span className="text-xs">{option.text}</span>
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6 text-center opacity-60">
          Use arrows to select, SPACE to confirm
        </p>
      </div>
    </div>
  );
}
