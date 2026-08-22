/**
 * In-game feedback snapshot + screenshot helpers.
 *
 * The 💬 feedback modal (FeedbackModal.tsx) uses these to bundle everything a
 * report needs — what the player said, where they were, what they'd been doing,
 * and a screenshot — into one payload for POST /api/feedback.
 *
 * We reuse state that already exists: the useGameState snapshot, the window.__QA__
 * runtime bridge (player position + last 50 bridge events), and the raw save blob.
 * Nothing new is tracked. window.__QA__ may be absent in normal play, so every
 * read of it is defensive.
 */

import type Phaser from 'phaser';
import type { UnifiedGameState } from '@/hooks/useGameState';
import { SAVE_KEY_V2 } from '@/lib/saveData';

export type FeedbackType = 'bug' | 'idea' | 'confusing' | 'loved';

export const FEEDBACK_TYPES: Array<{ id: FeedbackType; emoji: string; label: string }> = [
  { id: 'bug', emoji: '🐛', label: 'Bug' },
  { id: 'idea', emoji: '💡', label: 'Idea' },
  { id: 'confusing', emoji: '😕', label: 'Confusing' },
  { id: 'loved', emoji: '❤️', label: 'Loved it' },
];

/** Everything we send alongside the player's message (screenshot travels separately). */
export interface FeedbackSnapshot {
  type: FeedbackType;
  message: string;
  /** ISO-ish context so a report reads cleanly even without the JSON. */
  context: {
    currentRoomId: string | null;
    currentAct: number | null;
    unifiedScore: number | null;
    privacyScore: number | null;
    completedRooms: number;
    playerPosition: { tileX: number; tileY: number } | null;
    sceneReady: string | null;
    elapsedMs: number | null;
    userAgent: string;
    viewport: { w: number; h: number };
    url: string;
  };
  /** Full progress object (UnifiedGameState) for deep inspection. */
  gameState: UnifiedGameState | null;
  /** Live runtime bridge fields, if window.__QA__ is present. */
  runtime: {
    playerPosition: { tileX: number; tileY: number } | null;
    currentRoomId: string | null;
    sceneReady: string | null;
    scenesVisited: string[];
    nearbyInteractable: { type: string; id: string } | null;
    nearDoor: { id: string; targetRoomId: string } | null;
    breachState: unknown;
    /** Reproduction trail — the last 50 bridge events. */
    eventLog: Array<{ event: string; timestamp: number }>;
  } | null;
  /** Raw localStorage save blob (superset of the interface; includes extended fields). */
  rawSave: string | null;
}

/**
 * Assemble the snapshot from the game state + the __QA__ bridge + localStorage.
 * Pure read — never throws (bad localStorage / missing bridge degrade to null).
 */
export function collectFeedbackSnapshot(
  type: FeedbackType,
  message: string,
  gameState: UnifiedGameState | null,
): FeedbackSnapshot {
  const qa = typeof window !== 'undefined' ? window.__QA__ : undefined;

  let rawSave: string | null = null;
  try {
    rawSave = typeof localStorage !== 'undefined' ? localStorage.getItem(SAVE_KEY_V2) : null;
  } catch {
    rawSave = null;
  }

  const elapsedMs =
    gameState?.gameStartTime != null ? Date.now() - gameState.gameStartTime : null;

  return {
    type,
    message,
    context: {
      currentRoomId: qa?.currentRoomId ?? gameState?.currentRoomId ?? null,
      currentAct: gameState?.currentAct ?? null,
      unifiedScore: gameState?.unifiedScore ?? null,
      privacyScore: gameState?.privacyScore ?? null,
      completedRooms: gameState?.completedRooms?.length ?? 0,
      playerPosition: qa?.playerPosition ?? null,
      sceneReady: qa?.sceneReady ?? null,
      elapsedMs,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewport: {
        w: typeof window !== 'undefined' ? window.innerWidth : 0,
        h: typeof window !== 'undefined' ? window.innerHeight : 0,
      },
      url: typeof location !== 'undefined' ? location.href : '',
    },
    gameState: gameState ?? null,
    runtime: qa
      ? {
          playerPosition: qa.playerPosition ?? null,
          currentRoomId: qa.currentRoomId ?? null,
          sceneReady: qa.sceneReady ?? null,
          scenesVisited: qa.scenesVisited ?? [],
          nearbyInteractable: qa.nearbyInteractable ?? null,
          nearDoor: qa.nearDoor ?? null,
          breachState: qa.breachState ?? null,
          eventLog: qa.eventLog ?? [],
        }
      : null,
    rawSave,
  };
}

/**
 * Capture a PNG data URL of the game canvas via Phaser's snapshot API.
 *
 * Phaser can run under WebGL (Phaser.AUTO), where canvas.toDataURL() returns a
 * blank frame because the drawing buffer is cleared each render. renderer.snapshot()
 * is the supported, renderer-agnostic path. Resolves null (never rejects) so a
 * screenshot failure can never block sending feedback.
 */
export function captureScreenshot(
  game: Phaser.Game | null,
  timeoutMs = 2000,
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!game || !game.renderer) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    try {
      game.renderer.snapshot((image) => {
        clearTimeout(timer);
        const src = (image as HTMLImageElement)?.src ?? null;
        done(typeof src === 'string' && src.startsWith('data:') ? src : null);
      });
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });
}
