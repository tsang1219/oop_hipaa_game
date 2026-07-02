/**
 * doorGraph.ts — Pure door-graph functions over the static room JSON.
 *
 * Extracted verbatim from UnifiedGamePage.tsx (Refactor Round 2). Computes the
 * per-door lock/available/completed/next states that ExplorationScene renders
 * (locked X, gold next-door pulse, completion checkmarks).
 */

import { isDepartmentAccessible, UNLOCK_ORDER } from '@/hooks/useGameState';
import { isDemoActive } from '@/lib/demoSession';
import roomDataJson from '@/data/roomData.json';

export interface RoomWithDoors {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  unlockRequirement?: string | null;
  alwaysUnlocked?: boolean;
  patientStory?: { title: string; text: string; icon: string };
  completionRequirements?: { requiredNpcs: string[]; requiredZones: string[]; requiredItems: string[] };
  width: number;
  height: number;
  backgroundImage: string;
  obstacles: any[];
  npcs: any[];
  interactionZones: any[];
  educationalItems: any[];
  spawnPoint: { x: number; y: number };
  config?: any;
  doors?: Array<{
    id: string;
    targetRoomId: string;
    x: number;
    y: number;
    side: string;
    label: string;
  }>;
}

const rooms = roomDataJson.rooms as RoomWithDoors[];

// ── Door state union ─────────────────────────────────────────────
// 'next' added in Phase 27 (VIS-07) — the single door on the critical path
// toward the next incomplete department gets a breathing gold pulse.
export type DoorState = 'locked' | 'available' | 'completed' | 'next';

/** Returns the first department in UNLOCK_ORDER (after hospital_entrance) not yet completed. */
export function deriveNextTargetRoom(completedRooms: string[]): string | null {
  for (const dept of UNLOCK_ORDER) {
    if (dept === 'hospital_entrance') continue;
    if (!completedRooms.includes(dept)) return dept;
  }
  return null; // everything done — no 'next'
}

/**
 * BFS over the room door graph from `startId` to `goalId`.
 * Returns the id of the first door (on `startRoom`) along the shortest path,
 * or null if no path exists. Only traverses rooms that are accessible.
 */
export function findFirstHopDoorId(
  startId: string,
  goalId: string,
  completedRooms: string[],
): string | null {
  if (startId === goalId) return null;
  const roomMap = new Map<string, RoomWithDoors>(rooms.map(r => [r.id, r]));
  type BFSNode = { roomId: string; firstDoorId: string | null };
  const queue: BFSNode[] = [{ roomId: startId, firstDoorId: null }];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const { roomId, firstDoorId } = queue.shift()!;
    const room = roomMap.get(roomId);
    if (!room?.doors) continue;
    for (const door of room.doors) {
      const targetId = door.targetRoomId;
      if (visited.has(targetId)) continue;
      visited.add(targetId);
      // Can traverse if accessible OR if it's the goal itself (always allow reaching the target)
      if (!isDepartmentAccessible(targetId, completedRooms) && targetId !== goalId) continue;
      const hop = firstDoorId ?? door.id; // first hop from startId
      if (targetId === goalId) return hop;
      queue.push({ roomId: targetId, firstDoorId: hop });
    }
  }
  return null;
}

export function computeDoorStates(
  room: RoomWithDoors,
  completedRooms: string[],
): Record<string, DoorState> {
  const states: Record<string, DoorState> = {};
  if (!room.doors) return states;

  // Base states: locked / completed / available
  for (const door of room.doors) {
    const target = door.targetRoomId;
    if (!isDepartmentAccessible(target, completedRooms)) {
      states[door.id] = 'locked';
    } else if (completedRooms.includes(target)) {
      states[door.id] = 'completed';
    } else {
      states[door.id] = 'available';
    }
  }

  // Demo mode: never add 'next' marker
  if (isDemoActive()) return states;

  // Derive the next objective and mark the first-hop door 'next'
  const nextTarget = deriveNextTargetRoom(completedRooms);
  if (!nextTarget) return states; // all done
  if (room.id === nextTarget) return states; // player is already inside the objective room

  const firstHopDoorId = findFirstHopDoorId(room.id, nextTarget, completedRooms);
  if (firstHopDoorId && states[firstHopDoorId] !== 'locked') {
    states[firstHopDoorId] = 'next';
  }

  return states;
}
