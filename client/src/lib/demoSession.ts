/**
 * demoSession.ts — In-memory demo-mode session state for the v2.2 Sponsor Demo.
 *
 * DEMO-04 (curated room order) and DEMO-06 (isolation from full-game save).
 * The demo session lives entirely in module-scoped memory — no localStorage,
 * no sessionStorage, no React context. The session is born when the player
 * picks "DEMO" on the start menu, and dies when they exit (Esc) or when the
 * page reloads. This guarantees the full-game save key (pq:save:v2) is never
 * touched during demo play.
 *
 * Consumers:
 * - useGameState.isDepartmentAccessible — checks isDemoActive() to bypass
 *   UNLOCK_ORDER for the four demo rooms and their connecting hallways.
 * - UnifiedGamePage persistence useEffect — checks isDemoActive() to skip
 *   writeSave() calls.
 * - UnifiedGamePage Esc handler — calls endDemo() before returning to menu.
 */

export const DEMO_ROOM_ORDER = [
  'reception',
  'er',
  'break_room',
  'records_room',
] as const;

export type DemoRoomId = typeof DEMO_ROOM_ORDER[number];

export interface DemoSessionState {
  active: boolean;
  startedAt: number;
  completedRooms: DemoRoomId[];
}

// Module-scoped state — single source of truth for demo session.
let session: DemoSessionState | null = null;

/** Begin a fresh demo session. Idempotent: clears any prior state. */
export function startDemo(): void {
  session = {
    active: true,
    startedAt: Date.now(),
    completedRooms: [],
  };
}

/** End the current demo session and clear all state. Idempotent. */
export function endDemo(): void {
  session = null;
}

/** Returns true iff a demo session is currently active. */
export function isDemoActive(): boolean {
  return session !== null && session.active;
}

/** The canonical demo room order: Reception → ER → Break Room → Medical Records. */
export function getDemoRoomOrder(): readonly DemoRoomId[] {
  return DEMO_ROOM_ORDER;
}

/**
 * Returns the index of the given room ID in the demo order, or -1 if it is
 * not part of the curated demo path.
 */
export function getDemoRoomIndex(currentRoomId: string): number {
  return (DEMO_ROOM_ORDER as readonly string[]).indexOf(currentRoomId);
}

/**
 * Mark a room as complete in the current demo session. No-op if the room is
 * not a demo room or if no session is active.
 */
export function markRoomComplete(roomId: string): void {
  if (!session) return;
  const idx = getDemoRoomIndex(roomId);
  if (idx === -1) return;
  const demoRoomId = roomId as DemoRoomId;
  if (!session.completedRooms.includes(demoRoomId)) {
    session.completedRooms = [...session.completedRooms, demoRoomId];
  }
}

/** Returns a snapshot of demo rooms completed so far this session. */
export function getCompletedDemoRooms(): DemoRoomId[] {
  return session ? [...session.completedRooms] : [];
}
