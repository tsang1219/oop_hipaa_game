import type { SorterItem as SorterItemData } from '@/data/sorterData';

export type SorterItemProps = {
  item: SorterItemData;
  isSelected: boolean;   // Keyboard selection — shows yellow ring
  isDragging: boolean;   // Mouse drag in progress — reduces opacity
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

/**
 * An individual draggable patient-chart card in the PHI Sorter pile.
 *
 * Phase 22 upgrade: renders `item.chart` (patientName + optional age/role/emergencyContact/
 * reasonForVisit/doctorNote/miscField) as a small chart instead of the bare `item.label`.
 *
 * Preserved from Phase 16:
 *   - Drag handlers, isSelected/isDragging props (called by PHISorterOverlay)
 *   - Press Start 2P font, dark navy + teal palette, chunky pixel shadow
 *   - data-testid={`sorter-item-${item.id}`} for test harness compatibility
 */
export function SorterItem({ item, isSelected, isDragging, onDragStart, onDragEnd }: SorterItemProps) {
  const { chart } = item;

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
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* Patient name — chart header */}
      <div
        className="text-[#FFD93D] mb-2"
        style={{ fontSize: '10px' }}
      >
        {chart.patientName}
        {chart.age !== undefined ? `, ${chart.age}` : ''}
      </div>

      {/* Role / occupation */}
      {chart.role && (
        <ChartLine label="Role" value={chart.role} />
      )}

      {/* Reason for visit */}
      {chart.reasonForVisit && (
        <ChartLine label="Reason" value={chart.reasonForVisit} />
      )}

      {/* Emergency contact */}
      {chart.emergencyContact && (
        <ChartLine label="Emergency Contact" value={chart.emergencyContact} />
      )}

      {/* Doctor's note */}
      {chart.doctorNote && (
        <ChartLine label="Doctor's Note" value={chart.doctorNote} />
      )}

      {/* Misc field — catch-all */}
      {chart.miscField && (
        <ChartLine label={chart.miscField.label} value={chart.miscField.value} />
      )}
    </div>
  );
}

/** Small reusable chart-line element. Keeps SorterItem render readable. */
function ChartLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1" style={{ fontSize: '8px', lineHeight: '1.6' }}>
      <span className="text-[#4FB3D9]">{label}:</span>{' '}
      <span className="text-white">{value}</span>
    </div>
  );
}
