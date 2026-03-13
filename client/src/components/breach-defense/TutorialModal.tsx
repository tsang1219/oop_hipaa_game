import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { AlertCircle, Shield, Lock } from 'lucide-react';

interface TutorialModalProps {
  title: string;
  description: string;
  onAcknowledge: () => void;
  type?: 'info' | 'threat' | 'tower';
  ctaText?: string;
}

export function TutorialModal({ title, description, onAcknowledge, type = 'info', ctaText = "Got it! Let's go →" }: TutorialModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = type === 'threat' ? AlertCircle : type === 'tower' ? Lock : Shield;
  const iconColor = type === 'threat' ? 'text-red-500' : type === 'tower' ? 'text-[#FF6B9D]' : 'text-blue-500';

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200 ${
      isVisible ? 'bg-black/80' : 'bg-black/0'
    }`}>
      <div className={`bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
      }`}>
        <div className="bg-[#FF6B9D] border-b-4 border-black p-4 flex items-center gap-3">
          <Icon className={`w-8 h-8 ${iconColor} bg-white rounded-full p-1 border-2 border-black`} />
          <h2 className="text-xl font-bold text-white flex-1">{title}</h2>
        </div>

        <div className="p-6">
          <div className="text-sm leading-relaxed whitespace-pre-line mb-6">
            {description}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onAcknowledge}
              className="bg-[#2ECC71] hover:bg-[#27AE60] text-black font-bold px-8 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer"
              data-testid="button-acknowledge-tutorial"
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
