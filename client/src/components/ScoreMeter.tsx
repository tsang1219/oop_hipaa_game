interface ScoreMeterProps {
  score: number;
  maxScore: number;
}

export default function ScoreMeter({ score, maxScore }: ScoreMeterProps) {
  const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100));
  const segments = 5;
  const filledSegments = Math.round((percentage / 100) * segments);
  
  return (
    <div className="mb-6" data-testid="container-score-meter">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-foreground" data-testid="text-compliance-label">
          COMPLIANCE LEVEL
        </span>
        <span className="text-xs text-foreground font-bold" data-testid="text-score">
          SCORE: {score}
        </span>
      </div>
      <div className="h-6 bg-muted border-2 border-game-border flex">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 border-r-2 last:border-r-0 border-game-border transition-colors duration-300 ${
              i < filledSegments ? 'bg-primary' : ''
            }`}
            data-testid={`segment-${i}`}
          />
        ))}
      </div>
    </div>
  );
}
