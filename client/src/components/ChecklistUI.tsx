import { CheckCircle2, Circle } from 'lucide-react';

interface ChecklistUIProps {
  educationalItemsCollected: number;
  totalEducationalItems: number;
  scenariosCompleted: number;
  totalScenarios: number;
}

export default function ChecklistUI({
  educationalItemsCollected,
  totalEducationalItems,
  scenariosCompleted,
  totalScenarios,
}: ChecklistUIProps) {
  const itemsComplete = educationalItemsCollected >= totalEducationalItems;
  const scenariosComplete = scenariosCompleted >= totalScenarios;

  return (
    <div className="bg-card/80 border-4 border-primary px-4 py-3 rounded-md" data-testid="checklist-ui">
      <h3 className="text-xs font-bold text-primary mb-2">QUEST PROGRESS</h3>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[10px]" data-testid="checklist-items">
          {itemsComplete ? (
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          ) : (
            <Circle className="w-3 h-3 text-muted-foreground" />
          )}
          <span className={itemsComplete ? 'text-green-500' : 'text-foreground'}>
            Read Educational Items: {educationalItemsCollected}/{totalEducationalItems}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]" data-testid="checklist-scenarios">
          {scenariosComplete ? (
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          ) : (
            <Circle className="w-3 h-3 text-muted-foreground" />
          )}
          <span className={scenariosComplete ? 'text-green-500' : 'text-foreground'}>
            Complete Scenarios: {scenariosCompleted}/{totalScenarios}
          </span>
        </div>
      </div>
    </div>
  );
}
