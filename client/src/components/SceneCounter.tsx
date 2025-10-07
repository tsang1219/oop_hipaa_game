interface SceneCounterProps {
  current: number;
  total: number;
}

export default function SceneCounter({ current, total }: SceneCounterProps) {
  return (
    <div className="text-xs text-foreground font-bold" data-testid="text-scene-counter">
      SCENE {current}/{total}
    </div>
  );
}
