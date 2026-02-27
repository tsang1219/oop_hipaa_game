import React from 'react';
import { Button } from '../ui/button';
import { CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { TUTORIAL_CONTENT } from '../../game/breach-defense/tutorialContent';

interface RecapModalProps {
  concept: keyof typeof TUTORIAL_CONTENT.recaps;
  onContinue: () => void;
}

export function RecapModal({ concept, onContinue }: RecapModalProps) {
  const recap = TUTORIAL_CONTENT.recaps[concept];

  if (!recap) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-xl w-full">
        <div className="bg-[#2ECC71] border-b-4 border-black p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-white" />
          <h2 className="text-xl font-bold text-white">{recap.title}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded">
            <p className="text-sm leading-relaxed text-green-800">{recap.summary}</p>
          </div>

          <div className="bg-[#FFF8F0] border-2 border-[#FF6B9D] p-4 rounded flex gap-3">
            <Lightbulb className="w-6 h-6 text-[#FF6B9D] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#FF6B9D] mb-1">WHAT TO DO:</p>
              <p className="text-sm text-gray-700">{recap.action}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={onContinue}
              className="bg-[#2ECC71] hover:bg-[#27AE60] text-black font-bold px-8 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer flex items-center gap-2"
              data-testid="button-continue-recap"
            >
              Continue to Next Wave
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
