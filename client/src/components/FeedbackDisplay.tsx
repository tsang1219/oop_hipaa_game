interface FeedbackDisplayProps {
  feedback: string;
  type: 'correct' | 'partial' | 'incorrect';
}

export default function FeedbackDisplay({ feedback, type }: FeedbackDisplayProps) {
  const bgColors = {
    correct: 'bg-game-success/20',
    partial: 'bg-game-warning/20',
    incorrect: 'bg-game-error/20',
  };
  
  const borderColors = {
    correct: 'border-game-success',
    partial: 'border-game-warning',
    incorrect: 'border-game-error',
  };
  
  const icons = {
    correct: '✓',
    partial: '⚠',
    incorrect: '✗',
  };
  
  return (
    <div
      className={`${bgColors[type]} border-2 ${borderColors[type]} p-4 mt-4`}
      data-testid={`feedback-${type}`}
    >
      <div className="flex gap-3">
        <span className="text-lg flex-shrink-0" data-testid="icon-feedback">
          {icons[type]}
        </span>
        <p className="text-xs leading-relaxed text-foreground" data-testid="text-feedback">
          {feedback}
        </p>
      </div>
    </div>
  );
}
