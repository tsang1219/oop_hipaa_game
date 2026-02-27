import React from 'react';
import { Button } from '../ui/button';
import { AlertCircle, Shield, Lock } from 'lucide-react';

interface TutorialModalProps {
  title: string;
  description: string;
  onAcknowledge: () => void;
  type?: 'info' | 'threat' | 'tower';
}

export function TutorialModal({ title, description, onAcknowledge, type = 'info' }: TutorialModalProps) {
  const Icon = type === 'threat' ? AlertCircle : type === 'tower' ? Lock : Shield;
  const iconColor = type === 'threat' ? 'text-red-500' : type === 'tower' ? 'text-[#FF6B9D]' : 'text-blue-500';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full">
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
              Got it! Let's go →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
