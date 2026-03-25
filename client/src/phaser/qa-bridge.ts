import { eventBridge, BRIDGE_EVENTS } from './EventBridge';

/**
 * QA Bridge — exposes minimal game state to window for Playwright testing.
 *
 * Tracks which Phaser scene is ready so Playwright can wait for rendering.
 * Also provides room/wave lists for test enumeration.
 */

interface QABridge {
  sceneReady: string | null;
  scenesVisited: string[];
  roomIds: string[];
}

declare global {
  interface Window {
    __QA__?: QABridge;
  }
}

export function initQABridge() {
  const qa: QABridge = {
    sceneReady: null,
    scenesVisited: [],
    roomIds: [],
  };
  window.__QA__ = qa;

  eventBridge.on(BRIDGE_EVENTS.SCENE_READY, (sceneKey: string) => {
    qa.sceneReady = sceneKey;
    if (!qa.scenesVisited.includes(sceneKey)) {
      qa.scenesVisited.push(sceneKey);
    }
  });
}

/**
 * Read QA-specific URL params for auto-navigation.
 * Used by page components to skip to a specific room/wave for screenshot testing.
 *
 * ?qa-room=reception  → PrivacyQuestPage auto-enters that room
 * ?qa-wave=3          → BreachDefensePage auto-starts at that wave
 */
export function getQAParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}
