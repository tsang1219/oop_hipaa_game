import { BookOpen, Users } from 'lucide-react';

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
  return (
    <div className="bg-card/80 border-4 border-primary px-4 py-3 rounded-md" data-testid="checklist-ui">
      <h3 className="text-xs font-bold text-primary mb-2">ROOM PROGRESS</h3>
      <div className="flex gap-6">
        <div className="flex items-center gap-2 text-[10px]" data-testid="checklist-items">
          <BookOpen className="w-3 h-3 text-primary" />
          <span className="text-foreground">
            Items: {educationalItemsCollected}/{totalEducationalItems}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]" data-testid="checklist-scenarios">
          <Users className="w-3 h-3 text-primary" />
          <span className="text-foreground">
            NPCs: {scenariosCompleted}/{totalScenarios}
          </span>
        </div>
      </div>
    </div>
  );
}
