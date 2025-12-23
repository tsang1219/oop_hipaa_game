import { useState, useEffect } from 'react';
import type { RoomConfig } from '@shared/schema';

interface RoomIntroProps {
  roomName: string;
  subtitle?: string;
  config?: RoomConfig;
  onComplete: () => void;
}

export default function RoomIntro({ roomName, subtitle, config, onComplete }: RoomIntroProps) {
  const [phase, setPhase] = useState<'entering' | 'showing' | 'fading'>('entering');
  const [textRevealed, setTextRevealed] = useState(0);

  const stanceText = config?.stanceDescription || '';
  const introText = config?.introText || '';

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('showing'), 300);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase === 'showing' && textRevealed < stanceText.length) {
      const charTimer = setTimeout(() => {
        setTextRevealed(prev => prev + 1);
      }, 40);
      return () => clearTimeout(charTimer);
    } else if (phase === 'showing' && textRevealed >= stanceText.length) {
      const fadeTimer = setTimeout(() => setPhase('fading'), 1500);
      return () => clearTimeout(fadeTimer);
    }
  }, [phase, textRevealed, stanceText.length]);

  useEffect(() => {
    if (phase === 'fading') {
      const completeTimer = setTimeout(onComplete, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [phase, onComplete]);

  useEffect(() => {
    const handleSkip = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleSkip);
    return () => window.removeEventListener('keydown', handleSkip);
  }, [onComplete]);

  const getPacingStyle = () => {
    switch (config?.pacing) {
      case 'urgent': return 'border-destructive bg-destructive/10';
      case 'deceptive': return 'border-primary/50 bg-primary/5';
      case 'slow': return 'border-muted bg-muted/20';
      default: return 'border-primary bg-card';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/90 transition-opacity duration-500 ${
        phase === 'fading' ? 'opacity-0' : phase === 'entering' ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={onComplete}
      data-testid="room-intro-overlay"
    >
      <div 
        className={`text-center p-8 border-4 max-w-md transition-all duration-300 ${getPacingStyle()} ${
          phase === 'showing' ? 'scale-100' : 'scale-95'
        }`}
      >
        <h1 
          className="text-2xl font-bold text-foreground mb-1"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
          data-testid="text-room-intro-name"
        >
          {roomName}
        </h1>
        
        {subtitle && (
          <p 
            className="text-sm text-muted-foreground mb-6 italic"
            data-testid="text-room-intro-subtitle"
          >
            {subtitle}
          </p>
        )}

        {stanceText && (
          <div className="mb-4">
            <p 
              className="text-lg text-primary font-bold"
              style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '12px', lineHeight: '1.8' }}
              data-testid="text-room-intro-stance"
            >
              {stanceText.substring(0, textRevealed)}
              {textRevealed < stanceText.length && (
                <span className="animate-pulse">▌</span>
              )}
            </p>
          </div>
        )}

        {introText && textRevealed >= stanceText.length && (
          <p 
            className="text-sm text-muted-foreground mt-4 animate-fade-in"
            data-testid="text-room-intro-text"
          >
            {introText}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-6 opacity-60">
          Press any key to continue...
        </p>
      </div>
    </div>
  );
}
