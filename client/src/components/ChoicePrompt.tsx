import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Gate } from '@shared/schema';
import { uiSfx, useOverlaySfx } from '@/lib/uiSfx';
import { useOverlayMotion } from '@/hooks/useOverlayMotion';

interface ChoicePromptProps {
  gate: Gate;
  onChoice: (unlockedId: string) => void;
}

export default function ChoicePrompt({ gate, onChoice }: ChoicePromptProps) {
  const motion = useOverlayMotion('pop');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options = gate.choiceOptions || [];

  // The card is visible from the first frame (Run 14 — no invisible window);
  // options land a beat later (Commandment 2), and only then do the
  // selection keys arm — a Space still buffered from dialogue must not pick
  // an option the player never saw.
  useEffect(() => {
    uiSfx('open');
    const optionsTimer = setTimeout(() => setShowOptions(true), 250);
    return () => clearTimeout(optionsTimer);
  }, []);

  const choose = (unlocksId: string) => {
    // motion.close is idempotent — a mashed Space/click can't double-fire.
    uiSfx('select');
    motion.close(() => onChoice(unlocksId));
  };

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
        if (showOptions && options[selectedIndex]) {
          choose(options[selectedIndex].unlocksId);
        }
      } else if (e.key === '1' && options[0]) {
        e.preventDefault();
        if (showOptions) choose(options[0].unlocksId);
      } else if (e.key === '2' && options[1]) {
        e.preventDefault();
        if (showOptions) choose(options[1].unlocksId);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [options, selectedIndex, showOptions, motion.close, onChoice]);

  if (options.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center bg-background/80 ${motion.backdropClassName}`}
      data-testid="choice-prompt-overlay"
    >
      <div
        className={`bg-card border-4 border-primary p-6 max-w-md mx-4 ${motion.className}`}
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        <p
          className="font-body text-foreground mb-6 text-center leading-snug"
          style={{ fontSize: '18px', letterSpacing: '0.01em' }}
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
                transition: `all 250ms ease-out ${index * 80}ms`,
              }}
              onClick={() => choose(option.unlocksId)}
              data-testid={`button-choice-${index}`}
            >
              <span className="mr-2 text-xs opacity-60">{index + 1}.</span>
              <span
                className="text-left"
                style={{ fontFamily: 'var(--font-body)', fontSize: '16px', whiteSpace: 'normal', wordBreak: 'break-word' }}
              >
                {option.text}
              </span>
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
