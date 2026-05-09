import Phaser from 'phaser';

/**
 * Singleton event emitter for React <-> Phaser communication.
 *
 * Phaser scenes emit events that React listens to (e.g., NPC interaction).
 * React emits events that Phaser scenes listen to (e.g., dialogue complete).
 */
class EventBridge extends Phaser.Events.EventEmitter {
  private static instance: EventBridge;

  static getInstance(): EventBridge {
    if (!EventBridge.instance) {
      EventBridge.instance = new EventBridge();
    }
    return EventBridge.instance;
  }
}

export const eventBridge = EventBridge.getInstance();

// Event name constants for type safety
export const BRIDGE_EVENTS = {
  // Phaser -> React
  SCENE_READY: 'scene:ready',
  HUB_SELECT_GAME: 'hub:select-game',
  EXPLORATION_INTERACT_NPC: 'exploration:interact-npc',
  EXPLORATION_INTERACT_ZONE: 'exploration:interact-zone',
  EXPLORATION_INTERACT_ITEM: 'exploration:interact-item',
  // EXPLORATION_EXIT_ROOM payload: { targetRoomId: string, fromDoorId: string } (door nav) or string (legacy ESC exit)
  EXPLORATION_EXIT_ROOM: 'exploration:exit-room',
  EXPLORATION_PLAYER_MOVED: 'exploration:player-moved',
  BREACH_STATE_UPDATE: 'breach:state-update',
  BREACH_WAVE_START: 'breach:wave-start',
  BREACH_WAVE_COMPLETE: 'breach:wave-complete',
  BREACH_GAME_OVER: 'breach:game-over',
  BREACH_VICTORY: 'breach:victory',
  BREACH_TOWER_PLACED: 'breach:tower-placed',
  /**
   * Phaser → React: an encounter has been triggered (proximity zone or NPC handoff).
   *
   * Payload shape:
   *   {
   *     encounterId: string;          // 'td-it-office' | 'phi-sort-reception' | 'phi-sort-lab' | 'phi-sort-records'
   *     narrativeText: string;        // Body text for the NarrativeContextCard / SorterContextCard
   *     type?: 'td' | 'phi-sorter';   // Discriminator — defaults to 'td' for legacy/backward-compat (Phase 13)
   *     config?: BreachDefenseInitData;            // Present when type === 'td' (Phase 13)
   *     sorterConfig?: { documentSetId: string };  // Present when type === 'phi-sorter' (Phase 16)
   *   }
   */
  ENCOUNTER_TRIGGERED: 'encounter:triggered',   // ExplorationScene: encounter zone activated

  // React -> Phaser
  REACT_PAUSE_EXPLORATION: 'react:pause-exploration',
  REACT_RESUME_EXPLORATION: 'react:resume-exploration',
  REACT_DIALOGUE_COMPLETE: 'react:dialogue-complete',
  // REACT_LOAD_ROOM payload: { room: RoomData, spawnDoorId?: string, completedNPCs: string[], completedZones: string[], collectedItems: string[], doorStates: Record<string, 'locked' | 'available' | 'completed'> }
  REACT_LOAD_ROOM: 'react:load-room',
  // REACT_DOOR_LOCKED: React tells scene the door is locked (play locked SFX + visual)
  REACT_DOOR_LOCKED: 'react:door-locked',
  // REACT_UPDATE_DOOR_STATES payload: { doorStates: Record<string, 'locked' | 'available' | 'completed'> }
  REACT_UPDATE_DOOR_STATES: 'react:update-door-states',
  REACT_PLACE_TOWER: 'react:place-tower',
  REACT_START_BREACH: 'react:start-breach-defense',
  REACT_RETURN_TO_HUB: 'react:return-to-hub',
  REACT_SELECT_TOWER_TYPE: 'react:select-tower-type',
  REACT_DISMISS_TUTORIAL: 'react:dismiss-tutorial',
  REACT_START_PREP: 'react:start-prep-countdown',
  REACT_ONBOARDING_HIGHLIGHT: 'react:onboarding-highlight',
  REACT_ONBOARDING_CLEAR: 'react:onboarding-clear',
  REACT_RESTART_BREACH: 'react:restart-breach',
  REACT_SET_MUSIC_VOLUME: 'react:set-music-volume',
  REACT_PLAY_SFX: 'react:play-sfx',
  REACT_ANSWER_FEEDBACK: 'react:answer-feedback',
  REACT_LAUNCH_ENCOUNTER: 'react:launch-encounter',           // React: user confirmed narrative card
  /**
   * React → Phaser: dismiss the encounter overlay and resume ExplorationScene.
   *
   * Payload shape (optional — undefined for legacy TD callers, populated for Phase 16 sorter):
   *   { encounterId?: string; aborted?: boolean }
   *
   * - `encounterId` (encounter completed normally): ExplorationScene writes
   *   `this.registry.set('encounterResult_' + encounterId, true)` to suppress re-trigger.
   *   Phase 16 needs this because the PHI Sorter is pure React with no Phaser scene to
   *   write the registry directly — unlike BreachDefenseScene which writes its own guard.
   * - `aborted: true` (player exited via Esc / X button): unpause without writing the
   *   registry guard, so the encounter remains replayable on re-trigger.
   */
  REACT_RETURN_FROM_ENCOUNTER: 'react:return-from-encounter', // React: debrief dismissed, return to RPG
  /**
   * Phaser → React: an NPC marked with `encounterTrigger` was interacted with.
   * React shows EncounterRequestModal; player picks accept or decline.
   *
   * Payload: { npcId, npcName, npcRole?, requestText, encounterId, documentSetId }
   *
   * Accept is handled entirely React-side (sets phase → 'phi-sorter', mounts overlay).
   * Decline reuses REACT_RETURN_FROM_ENCOUNTER with { aborted: true } payload — existing
   * onReturnFromEncounter handler unpauses without writing the registry guard, so the
   * encounter can be re-triggered when the player walks back to the NPC.
   *
   * Added 2026-05-08 to replace proximity-tile auto-trigger with NPC dialogue trigger.
   */
  ENCOUNTER_REQUEST: 'encounter:request',
  ACT_ADVANCE: 'react:act-advance',                           // payload: { newAct: 1|2|3, track: string, baseVolume?: number }
  CHOICE_FLAG_SET: 'react:choice-flag-set',                   // payload: { flagKey: string, flagValue: string | boolean }
  REACT_ROOM_COMPLETE_FANFARE: 'react:room-complete-fanfare', // payload: { roomId: string; playerX: number; playerY: number }

  // QA Testing
  QA_MOVE_PLAYER_TO: 'qa:move-player-to',         // payload: { tileX: number, tileY: number }
  QA_PRESS_SPACE: 'qa:press-space',                // no payload
  QA_NAVIGATE_DOOR: 'qa:navigate-door',            // payload: { doorId: string }
  QA_TELEPORT_TO: 'qa:teleport-to',                // payload: { tileX: number, tileY: number } — instant teleport
  EXPLORATION_STATE_UPDATE: 'exploration:state-update', // payload: ExplorationStatePayload

  // Bidirectional
  ENCOUNTER_COMPLETE: 'encounter:complete',   // BreachDefenseScene -> React: encounter finished with result
} as const;
