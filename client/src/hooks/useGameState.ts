/**
 * useGameState — Unified game state hook for PrivacyQuest v2.
 *
 * Consolidates all scattered useState calls from PrivacyQuestPage into
 * a single hook backed by localStorage (pq:save:v2 schema).
 *
 * Exports standalone utility functions (UNLOCK_ORDER, isDepartmentAccessible,
 * isDepartmentUnlocked) so they can be imported outside of React context.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { loadSave, writeSave, type SaveDataV2 } from '@/lib/saveData';

// ── Public types ───────────────────────────────────────────────

export interface UnifiedGameState {
  completedRooms: string[];
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];
  collectedStories: string[];
  privacyScore: number;
  currentRoomId: string | null;
  currentAct: 1 | 2 | 3;
  actFlags: Record<string, boolean>;
  encounterResults: Record<string, { completed: boolean; score: number; outcome: string }>;
  unifiedScore: number;
  gameStartTime: number;
}

// ── Department unlock chain ────────────────────────────────────

export const UNLOCK_ORDER = [
  'hospital_entrance',
  'reception',
  'break_room',
  'lab',
  'records_room',
  'it_office',
  'er',
] as const;

/**
 * Returns true if the department is unlocked (its prerequisite is completed).
 * Hospital entrance and rooms not in the unlock chain are always unlocked.
 */
export function isDepartmentUnlocked(roomId: string, completedRooms: string[]): boolean {
  // Hallway rooms unlock with their preceding department
  if (roomId.startsWith('hallway_')) {
    const precedingDept = findPrecedingDepartment(roomId);
    if (precedingDept) {
      return isDepartmentUnlocked(precedingDept, completedRooms) ||
        completedRooms.includes(precedingDept);
    }
    return true; // unknown hallway pattern — allow
  }

  const idx = UNLOCK_ORDER.indexOf(roomId as typeof UNLOCK_ORDER[number]);
  if (idx <= 0) return true; // entrance or not in chain = always open
  const prerequisite = UNLOCK_ORDER[idx - 1];
  return completedRooms.includes(prerequisite);
}

/**
 * Returns true if the room is accessible — either unlocked or already completed (backtrack).
 */
export function isDepartmentAccessible(roomId: string, completedRooms: string[]): boolean {
  if (completedRooms.includes(roomId)) return true; // backtrack always allowed
  return isDepartmentUnlocked(roomId, completedRooms);
}

/**
 * For a hallway room ID like "hallway_reception_break", find the closest
 * preceding department in UNLOCK_ORDER. The hallway naming convention is
 * hallway_{from}_{to}, so we look for the {from} part.
 */
function findPrecedingDepartment(hallwayId: string): string | null {
  // Strip 'hallway_' prefix and find which UNLOCK_ORDER entry appears in the remaining text
  const rest = hallwayId.replace('hallway_', '');
  // Check each department in order — the first one found in the hallway name is the "from" dept
  for (const dept of UNLOCK_ORDER) {
    if (dept === 'hospital_entrance') continue;
    // Match dept name or shortened form (e.g., "break" matches "break_room")
    const shortName = dept.replace('_room', '').replace('_office', '');
    if (rest.startsWith(shortName)) {
      return dept;
    }
  }
  return null;
}

// ── Hook ───────────────────────────────────────────────────────

export function useGameState() {
  const save = useRef<SaveDataV2>(loadSave());

  const [state, setState] = useState<UnifiedGameState>(() => {
    const s = save.current;
    // Read extended fields from save if they exist, otherwise defaults
    const extended = (s as any);
    return {
      completedRooms: s.completedRooms,
      completedNPCs: s.completedNPCs,
      completedZones: s.completedZones,
      collectedItems: s.collectedItems,
      collectedStories: s.collectedStories,
      privacyScore: s.privacyScore,
      currentRoomId: extended.currentRoomId ?? null,
      currentAct: extended.currentAct ?? 1,
      actFlags: extended.actFlags ?? {},
      encounterResults: extended.encounterResults ?? {},
      unifiedScore: extended.unifiedScore ?? s.privacyScore,
      gameStartTime: s.gameStartTime,
    };
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    const currentSave = loadSave();
    const merged: SaveDataV2 & Record<string, unknown> = {
      ...currentSave,
      completedRooms: state.completedRooms,
      completedNPCs: state.completedNPCs,
      completedZones: state.completedZones,
      collectedItems: state.collectedItems,
      collectedStories: state.collectedStories,
      privacyScore: state.privacyScore,
      gameStartTime: state.gameStartTime,
      // Extended v2.1 fields stored in the same blob
      currentRoomId: state.currentRoomId,
      currentAct: state.currentAct,
      actFlags: state.actFlags,
      encounterResults: state.encounterResults,
      unifiedScore: state.unifiedScore,
    };
    writeSave(merged as SaveDataV2);
  }, [state]);

  // ── Actions ────────────────────────────────────────────────

  const completeRoom = useCallback((roomId: string) => {
    setState(prev => {
      if (prev.completedRooms.includes(roomId)) return prev;
      return { ...prev, completedRooms: [...prev.completedRooms, roomId] };
    });
  }, []);

  const completeNPC = useCallback((npcId: string) => {
    setState(prev => {
      if (prev.completedNPCs.includes(npcId)) return prev;
      return { ...prev, completedNPCs: [...prev.completedNPCs, npcId] };
    });
  }, []);

  const completeZone = useCallback((zoneId: string) => {
    setState(prev => {
      if (prev.completedZones.includes(zoneId)) return prev;
      return { ...prev, completedZones: [...prev.completedZones, zoneId] };
    });
  }, []);

  const collectItem = useCallback((itemId: string) => {
    setState(prev => {
      if (prev.collectedItems.includes(itemId)) return prev;
      return { ...prev, collectedItems: [...prev.collectedItems, itemId] };
    });
  }, []);

  const collectStory = useCallback((storyId: string) => {
    setState(prev => {
      if (prev.collectedStories.includes(storyId)) return prev;
      return { ...prev, collectedStories: [...prev.collectedStories, storyId] };
    });
  }, []);

  const addScore = useCallback((delta: number) => {
    setState(prev => ({
      ...prev,
      privacyScore: prev.privacyScore + delta,
      unifiedScore: prev.unifiedScore + delta,
    }));
  }, []);

  const setCurrentRoom = useCallback((roomId: string | null) => {
    setState(prev => ({ ...prev, currentRoomId: roomId }));
  }, []);

  const setActFlag = useCallback((flag: string, value: boolean) => {
    setState(prev => ({
      ...prev,
      actFlags: { ...prev.actFlags, [flag]: value },
    }));
  }, []);

  const recordEncounterResult = useCallback(
    (id: string, result: { completed: boolean; score: number; outcome: string }) => {
      setState(prev => ({
        ...prev,
        encounterResults: { ...prev.encounterResults, [id]: result },
      }));
    },
    [],
  );

  const resetProgress = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  return {
    state,
    completeRoom,
    completeNPC,
    completeZone,
    collectItem,
    collectStory,
    addScore,
    setCurrentRoom,
    setActFlag,
    recordEncounterResult,
    resetProgress,
    isDepartmentAccessible: (roomId: string) =>
      isDepartmentAccessible(roomId, state.completedRooms),
  };
}
