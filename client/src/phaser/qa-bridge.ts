import { eventBridge, BRIDGE_EVENTS } from './EventBridge';
import { loadSave } from '../lib/saveData';

/**
 * QA Bridge — exposes rich game state to window for Playwright testing.
 *
 * Tracks scene readiness, exploration state, breach state, completion progress,
 * and provides command/waiter APIs for automated test control.
 */

// ---------- Payload types ----------

export interface ExplorationStatePayload {
  currentRoomId: string | null;
  playerPosition: { tileX: number; tileY: number } | null;
  nearbyInteractable: { type: string; id: string } | null;
  nearDoor: { id: string; targetRoomId: string } | null;
  paused: boolean;
  roomNPCs: Array<{ id: string; x: number; y: number; completed: boolean }>;
  roomZones: Array<{ id: string; x: number; y: number; completed: boolean }>;
  roomItems: Array<{ id: string; x: number; y: number; collected: boolean }>;
  roomDoors: Array<{ id: string; targetRoomId: string; x: number; y: number; state: string }>;
}

export interface BreachStatePayload {
  gameState: string;
  wave: number;
  budget: number;
  securityScore: number;
  towerCount: number;
}

export interface EventLogEntry {
  event: string;
  timestamp: number;
}

// ---------- QABridge interface ----------

export interface QABridge {
  // Scene tracking (preserved from original)
  sceneReady: string | null;
  scenesVisited: string[];
  roomIds: string[];

  // Exploration state (populated by EXPLORATION_STATE_UPDATE)
  currentRoomId: string | null;
  playerPosition: { tileX: number; tileY: number } | null;
  nearbyInteractable: { type: string; id: string } | null;
  nearDoor: { id: string; targetRoomId: string } | null;
  paused: boolean;
  roomNPCs: Array<{ id: string; x: number; y: number; completed: boolean }>;
  roomZones: Array<{ id: string; x: number; y: number; completed: boolean }>;
  roomItems: Array<{ id: string; x: number; y: number; collected: boolean }>;
  roomDoors: Array<{ id: string; targetRoomId: string; x: number; y: number; state: string }>;

  // Completion state (populated from localStorage save)
  completedRooms: string[];
  completedNPCs: string[];
  completedZones: string[];
  collectedItems: string[];

  // Breach state
  breachState: BreachStatePayload | null;

  // Event log — ring buffer of last 50 events
  eventLog: EventLogEntry[];

  // Command functions for Playwright
  commands: {
    movePlayerTo(tileX: number, tileY: number): void;
    pressSpace(): void;
    navigateToDoor(doorId: string): void;
    teleportTo(tileX: number, tileY: number): void;
  };

  // Promise-based waiters for Playwright
  waitFor: {
    event(eventName: string, timeoutMs?: number): Promise<any>;
    roomLoad(roomId: string, timeoutMs?: number): Promise<void>;
    sceneReady(sceneKey: string, timeoutMs?: number): Promise<void>;
  };
}

declare global {
  interface Window {
    __QA__?: QABridge;
  }
}

// ---------- Internal helpers ----------

const MAX_EVENT_LOG = 50;

function pushEventLog(log: EventLogEntry[], event: string): void {
  log.push({ event, timestamp: Date.now() });
  if (log.length > MAX_EVENT_LOG) {
    log.splice(0, log.length - MAX_EVENT_LOG);
  }
}

function syncSaveData(qa: QABridge): void {
  const save = loadSave();
  qa.completedRooms = save.completedRooms;
  qa.completedNPCs = save.completedNPCs;
  qa.completedZones = save.completedZones;
  qa.collectedItems = save.collectedItems;
}

// ---------- Init / Cleanup ----------

let cleanupFn: (() => void) | null = null;

export function initQABridge() {
  // Clean up previous listener if re-initialized
  if (cleanupFn) cleanupFn();

  const qa: QABridge = {
    // Scene tracking
    sceneReady: null,
    scenesVisited: [],
    roomIds: [],

    // Exploration state
    currentRoomId: null,
    playerPosition: null,
    nearbyInteractable: null,
    nearDoor: null,
    paused: false,
    roomNPCs: [],
    roomZones: [],
    roomItems: [],
    roomDoors: [],

    // Completion state (will be populated from save)
    completedRooms: [],
    completedNPCs: [],
    completedZones: [],
    collectedItems: [],

    // Breach state
    breachState: null,

    // Event log
    eventLog: [],

    // Commands
    commands: {
      movePlayerTo(tileX: number, tileY: number): void {
        eventBridge.emit(BRIDGE_EVENTS.QA_MOVE_PLAYER_TO, { tileX, tileY });
      },
      pressSpace(): void {
        eventBridge.emit(BRIDGE_EVENTS.QA_PRESS_SPACE);
      },
      navigateToDoor(doorId: string): void {
        eventBridge.emit(BRIDGE_EVENTS.QA_NAVIGATE_DOOR, { doorId });
      },
      teleportTo(tileX: number, tileY: number): void {
        eventBridge.emit(BRIDGE_EVENTS.QA_TELEPORT_TO, { tileX, tileY });
      },
    },

    // Waiters
    waitFor: {
      event(eventName: string, timeoutMs = 10000): Promise<any> {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            eventBridge.off(eventName, handler);
            reject(new Error(`QA waitFor.event("${eventName}") timed out after ${timeoutMs}ms`));
          }, timeoutMs);

          const handler = (payload: any) => {
            clearTimeout(timer);
            eventBridge.off(eventName, handler);
            resolve(payload);
          };

          eventBridge.on(eventName, handler);
        });
      },

      roomLoad(roomId: string, timeoutMs = 10000): Promise<void> {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            eventBridge.off(BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE, handler);
            reject(new Error(`QA waitFor.roomLoad("${roomId}") timed out after ${timeoutMs}ms`));
          }, timeoutMs);

          const handler = (payload: ExplorationStatePayload) => {
            if (payload.currentRoomId === roomId) {
              clearTimeout(timer);
              eventBridge.off(BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE, handler);
              resolve();
            }
          };

          // Check if already in the target room
          if (qa.currentRoomId === roomId) {
            clearTimeout(timer);
            resolve();
            return;
          }

          eventBridge.on(BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE, handler);
        });
      },

      sceneReady(sceneKey: string, timeoutMs = 10000): Promise<void> {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            eventBridge.off(BRIDGE_EVENTS.SCENE_READY, handler);
            reject(new Error(`QA waitFor.sceneReady("${sceneKey}") timed out after ${timeoutMs}ms`));
          }, timeoutMs);

          const handler = (readyKey: string) => {
            if (readyKey === sceneKey) {
              clearTimeout(timer);
              eventBridge.off(BRIDGE_EVENTS.SCENE_READY, handler);
              resolve();
            }
          };

          // Check if already ready
          if (qa.sceneReady === sceneKey) {
            clearTimeout(timer);
            resolve();
            return;
          }

          eventBridge.on(BRIDGE_EVENTS.SCENE_READY, handler);
        });
      },
    },
  };

  window.__QA__ = qa;

  // Populate initial save data
  syncSaveData(qa);

  // Poll localStorage for save updates every 1 second
  const saveInterval = setInterval(() => syncSaveData(qa), 1000);

  // ---------- Event listeners ----------

  const onSceneReady = (sceneKey: string) => {
    qa.sceneReady = sceneKey;
    if (!qa.scenesVisited.includes(sceneKey)) {
      qa.scenesVisited.push(sceneKey);
    }
    pushEventLog(qa.eventLog, BRIDGE_EVENTS.SCENE_READY);
  };

  const onExplorationStateUpdate = (payload: ExplorationStatePayload) => {
    qa.currentRoomId = payload.currentRoomId;
    qa.playerPosition = payload.playerPosition;
    qa.nearbyInteractable = payload.nearbyInteractable;
    qa.nearDoor = payload.nearDoor;
    qa.paused = payload.paused;
    qa.roomNPCs = payload.roomNPCs;
    qa.roomZones = payload.roomZones;
    qa.roomItems = payload.roomItems;
    qa.roomDoors = payload.roomDoors;
  };

  const onBreachStateUpdate = (payload: BreachStatePayload) => {
    qa.breachState = payload;
  };

  // Logged-only events
  const logOnlyEvents = [
    BRIDGE_EVENTS.EXPLORATION_INTERACT_NPC,
    BRIDGE_EVENTS.EXPLORATION_INTERACT_ZONE,
    BRIDGE_EVENTS.EXPLORATION_INTERACT_ITEM,
    BRIDGE_EVENTS.EXPLORATION_EXIT_ROOM,
    BRIDGE_EVENTS.REACT_DOOR_LOCKED,
  ] as const;

  const logHandlers: Array<{ event: string; handler: () => void }> = [];
  for (const evt of logOnlyEvents) {
    const handler = () => pushEventLog(qa.eventLog, evt);
    eventBridge.on(evt, handler);
    logHandlers.push({ event: evt, handler });
  }

  // Catch-all: log every remaining BRIDGE_EVENTS value not already handled
  const handledEvents = new Set<string>([
    BRIDGE_EVENTS.SCENE_READY,
    BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE,
    BRIDGE_EVENTS.BREACH_STATE_UPDATE,
    ...logOnlyEvents,
  ]);

  const allEventValues = Object.values(BRIDGE_EVENTS);
  const remainingHandlers: Array<{ event: string; handler: () => void }> = [];
  for (const evt of allEventValues) {
    if (!handledEvents.has(evt)) {
      const handler = () => pushEventLog(qa.eventLog, evt);
      eventBridge.on(evt, handler);
      remainingHandlers.push({ event: evt, handler });
    }
  }

  // Register primary listeners
  eventBridge.on(BRIDGE_EVENTS.SCENE_READY, onSceneReady);
  eventBridge.on(BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE, onExplorationStateUpdate);
  eventBridge.on(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onBreachStateUpdate);

  // ---------- Cleanup ----------

  cleanupFn = () => {
    clearInterval(saveInterval);
    eventBridge.off(BRIDGE_EVENTS.SCENE_READY, onSceneReady);
    eventBridge.off(BRIDGE_EVENTS.EXPLORATION_STATE_UPDATE, onExplorationStateUpdate);
    eventBridge.off(BRIDGE_EVENTS.BREACH_STATE_UPDATE, onBreachStateUpdate);
    for (const { event, handler } of logHandlers) {
      eventBridge.off(event, handler);
    }
    for (const { event, handler } of remainingHandlers) {
      eventBridge.off(event, handler);
    }
    cleanupFn = null;
  };
}

/**
 * Read QA-specific URL params for auto-navigation.
 * Used by page components to skip to a specific room/wave for screenshot testing.
 *
 * ?qa-room=reception  -> PrivacyQuestPage auto-enters that room
 * ?qa-wave=3          -> BreachDefensePage auto-starts at that wave
 */
export function getQAParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}
