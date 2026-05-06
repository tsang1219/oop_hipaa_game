import type { SorterItem as SorterItemData } from '@/data/sorterData';

export type SorterItemProps = {
  item: SorterItemData;
  isSelected: boolean;   // Keyboard selection — shows yellow ring
  isDragging: boolean;   // Mouse drag in progress — reduces opacity
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

/**
 * An individual draggable item card in the PHI Sorter pile.
 *
 * Supports both mouse drag (HTML5 DnD) and keyboard selection (arrow keys).
 * isSelected is set by the parent (PHISorterOverlay) via ↑/↓ key cycling.
 * isDragging is set by the parent when this specific item's drag is in progress.
 */
export function SorterItem({ item, isSelected, isDragging, onDragStart, onDragEnd }: SorterItemProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragEnd={onDragEnd}
      className={[
        'cursor-grab active:cursor-grabbing select-none',
        'bg-[#2a2a3e] border-4 px-4 py-3 mb-2',
        'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        'transition-all duration-100',
        isSelected ? 'border-[#FFD93D] ring-4 ring-[#FFD93D]/50' : 'border-black',
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100',
      ].join(' ')}
      data-testid={`sorter-item-${item.id}`}
    >
      <span
        className="text-white"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
      >
        {item.label}
      </span>
    </div>
  );
}
