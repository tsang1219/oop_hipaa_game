/**
 * DepartmentBreadcrumb — compact HUD strip showing all 6 departments + current act.
 *
 * Positioned bottom-center of the canvas during exploration.
 * Completed = green checkmark, Current = gold pulse, Available = white, Locked = dim.
 */

export const DEPARTMENT_ORDER = [
  { id: 'reception',  shortName: 'REC', fullName: 'Reception',   act: 1 as const },
  { id: 'break_room', shortName: 'BRK', fullName: 'Break Room',  act: 1 as const },
  { id: 'lab',        shortName: 'LAB', fullName: 'Laboratory',  act: 2 as const },
  { id: 'records',    shortName: 'MR',  fullName: 'Med Records', act: 2 as const },
  { id: 'it',         shortName: 'IT',  fullName: 'IT Office',   act: 3 as const },
  { id: 'er',         shortName: 'ER',  fullName: 'Emerg Room',  act: 3 as const },
] as const;

export interface DepartmentBreadcrumbProps {
  completedRooms: string[];
  currentRoomId: string | null;
  currentAct: 1 | 2 | 3;
  unlockedRooms: string[];
}

export function DepartmentBreadcrumb({
  completedRooms,
  currentRoomId,
  currentAct,
  unlockedRooms,
}: DepartmentBreadcrumbProps) {
  return (
    <div
      className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 border border-[#333] px-2 py-1 pointer-events-none"
      style={{ fontFamily: '"Press Start 2P"', fontSize: '6px', zIndex: 10 }}
      data-testid="department-breadcrumb"
    >
      {/* Act label */}
      <span className="text-[#ffd700] mr-2 text-[6px]" style={{ whiteSpace: 'nowrap' }}>
        ACT {currentAct}
      </span>

      {/* Department tiles */}
      {DEPARTMENT_ORDER.map((dep) => {
        const isCompleted = completedRooms.includes(dep.id);
        // Match currentRoomId to department — rooms like "reception" map directly,
        // hallway rooms don't match any department tile (stays un-highlighted).
        const isCurrent = dep.id === currentRoomId;
        const isLocked = !unlockedRooms.includes(dep.id);

        let bgColor = '#1a1a2e';
        let borderColor = '#4ECDC4';
        let textColor = '#ffffff';

        if (isCompleted) {
          bgColor = '#1a4a1a';
          borderColor = '#44ff44';
          textColor = '#44ff44';
        } else if (isCurrent) {
          bgColor = '#3a3000';
          borderColor = '#ffd700';
          textColor = '#ffd700';
        } else if (isLocked) {
          bgColor = '#1a1a1a';
          borderColor = '#333333';
          textColor = '#555555';
        }

        return (
          <div
            key={dep.id}
            title={dep.fullName}
            className={isCurrent ? 'animate-pulse' : ''}
            style={{
              width: 28,
              height: 28,
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              color: textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5px',
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            {isCompleted ? '\u2713' : dep.shortName}
          </div>
        );
      })}
    </div>
  );
}
