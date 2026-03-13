import { useState, useEffect } from 'react';
import type { Gate } from '@shared/schema';

interface ObservationHintProps {
  gate: Gate;
  onAcknowledge: () => void;
}

export default function ObservationHint({ gate, onAcknowledge }: ObservationHintProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onAcknowledge();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onAcknowledge]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end justify-center pb-8 bg-background/50 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onAcknowledge}
      data-testid="observation-hint-overlay"
    >
      <div
        className={`bg-card border-4 border-primary p-4 max-w-lg mx-4 transform transition-all duration-300 ease-out ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
        }`}
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">👁️</span>
          <div>
            <p 
              className="text-xs text-primary mb-2 font-bold"
              data-testid="text-observation-hint"
            >
              You notice something...
            </p>
            <p 
              className="text-xs text-foreground leading-relaxed"
              data-testid="text-observation-detail"
            >
              {gate.observationHint || gate.description}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center opacity-60">
          Press SPACE to continue
        </p>
      </div>
    </div>
  );
}
