/**
 * SorterTakeawaysPanel — Sibling component rendered next to EncounterDebrief
 * when a PHI Sorter encounter completes. Shows "KEY LEARNINGS" with the
 * docSet's takeaways (2 bullets). Additive only — does not modify EncounterDebrief.
 */

export type SorterTakeawaysPanelProps = {
  takeaways: string[];
};

export function SorterTakeawaysPanel({ takeaways }: SorterTakeawaysPanelProps) {
  if (!takeaways || takeaways.length === 0) return null;
  return (
    <div
      className="mt-4 max-w-md mx-auto bg-[#1a2a3e] border-4 border-[#4FB3D9] p-4"
      data-testid="sorter-takeaways-panel"
    >
      <div
        className="text-[#4FB3D9] mb-3"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
      >
        KEY LEARNINGS
      </div>
      <ul className="space-y-2">
        {takeaways.map((t, idx) => (
          <li
            key={idx}
            className="text-white leading-relaxed"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            • {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
