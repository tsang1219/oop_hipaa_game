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
  ENCOUNTER_TRIGGERED: 'encounter:triggered',   // ExplorationScene: encounter zone activated

  // React -> Phaser
  REACT_PAUSE_EXPLORATION: 'react:pause-exploration',
  REACT_DIALOGUE_COMPLETE: 'react:dialogue-complete',
  // REACT_LOAD_ROOM payload: { room: RoomData, spawnDoorId?: string, completedNPCs: string[], completedZones: string[], collectedItems: string[], doorStates: Record<string, 'locked' | 'available' | 'completed'> }
  REACT_LOAD_ROOM: 'react:load-room',
  // REACT_DOOR_LOCKED: React tells scene the door is locked (play locked SFX + visual)
  REACT_DOOR_LOCKED: 'react:door-locked',
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
  REACT_RETURN_FROM_ENCOUNTER: 'react:return-from-encounter', // React: debrief dismissed, return to RPG
  ACT_ADVANCE: 'react:act-advance',                           // payload: { newAct: 1|2|3, track: string, baseVolume?: number }
  CHOICE_FLAG_SET: 'react:choice-flag-set',                   // payload: { flagKey: string, flagValue: string | boolean }

  // Bidirectional
  ENCOUNTER_COMPLETE: 'encounter:complete',   // BreachDefenseScene -> React: encounter finished with result
} as const;
