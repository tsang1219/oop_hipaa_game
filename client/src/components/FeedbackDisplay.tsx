import { useState, useEffect } from 'react';

interface FeedbackDisplayProps {
  feedback: string;
  type: 'correct' | 'partial' | 'incorrect';
  scoreChange: number;
}

export default function FeedbackDisplay({ feedback, type, scoreChange }: FeedbackDisplayProps) {
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (type === 'correct') {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [type]);

  const bgColors = {
    correct: 'bg-[#4CAF50]/20',
    partial: 'bg-[#FFA726]/20',
    incorrect: 'bg-[#FF6B9D]/20',
  };
  
  const borderColors = {
    correct: 'border-[#4CAF50]',
    partial: 'border-[#FFA726]',
    incorrect: 'border-[#FF6B9D]',
  };
  
  const textColors = {
    correct: 'text-[#4CAF50]',
    partial: 'text-[#FFA726]',
    incorrect: 'text-[#FF6B9D]',
  };

  const labels = {
    correct: 'CORRECT',
    partial: 'PARTIAL',
    incorrect: 'INCORRECT',
  };
  
  return (
    <>
      {showFlash && (
        <div className="fixed inset-0 bg-[#FF6B9D] opacity-30 animate-pulse z-40 pointer-events-none" />
      )}
      <div
        className={`${bgColors[type]} border-4 ${borderColors[type]} p-4 mt-4 bg-[#1a1a2e]`}
        data-testid={`feedback-${type}`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`font-['Press_Start_2P'] text-xs ${textColors[type]}`} data-testid="feedback-label">
            {labels[type]}
          </span>
          <span className={`font-['Press_Start_2P'] text-xs ${textColors[type]}`} data-testid="feedback-score">
            {scoreChange > 0 ? '+' : ''}{scoreChange} pts
          </span>
        </div>
        <p className="font-['Press_Start_2P'] text-xs leading-relaxed text-white" data-testid="text-feedback">
          {feedback}
        </p>
      </div>
    </>
  );
}
