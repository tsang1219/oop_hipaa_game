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
  HUB_SELECT_ROOM: 'hub:select-room',
  EXPLORATION_INTERACT_NPC: 'exploration:interact-npc',
  EXPLORATION_INTERACT_ZONE: 'exploration:interact-zone',
  EXPLORATION_INTERACT_ITEM: 'exploration:interact-item',
  EXPLORATION_EXIT_ROOM: 'exploration:exit-room',
  EXPLORATION_PLAYER_MOVED: 'exploration:player-moved',
  BREACH_STATE_UPDATE: 'breach:state-update',
  BREACH_WAVE_START: 'breach:wave-start',
  BREACH_WAVE_COMPLETE: 'breach:wave-complete',
  BREACH_GAME_OVER: 'breach:game-over',
  BREACH_VICTORY: 'breach:victory',
  BREACH_TOWER_PLACED: 'breach:tower-placed',
  BREACH_TUTORIAL_TRIGGER: 'breach:tutorial-trigger',

  // React -> Phaser
  REACT_PAUSE_EXPLORATION: 'react:pause-exploration',
  REACT_DIALOGUE_COMPLETE: 'react:dialogue-complete',
  REACT_LOAD_ROOM: 'react:load-room',
  REACT_PLACE_TOWER: 'react:place-tower',
  REACT_START_BREACH: 'react:start-breach-defense',
  REACT_RETURN_TO_HUB: 'react:return-to-hub',
  REACT_SELECT_TOWER_TYPE: 'react:select-tower-type',
  REACT_DISMISS_TUTORIAL: 'react:dismiss-tutorial',
  REACT_RESTART_BREACH: 'react:restart-breach',
} as const;
