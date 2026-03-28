/**
 * narrative.ts — Type contracts for the three-act narrative arc (Phase 14).
 *
 * Defines act state, decision flags, and music mappings used by:
 * - useGameState hook (React act progression logic)
 * - ExplorationScene (Phaser music crossfade)
 * - PrivacyQuestPage (NPC variant dialogue routing)
 */

// Act state stored in game state and persisted to localStorage
export interface ActState {
  current: 1 | 2 | 3;
  act1Complete: boolean;  // Reception + Break Room both completed
  act2Complete: boolean;  // Lab + Records both completed
  musicTrack: 'music_hub' | 'music_exploration' | 'music_breach';
}

// Decision flags — 3 key choices remembered across the game
export interface DecisionState {
  faxIncidentHandled: 'reported' | 'delayed' | 'ignored' | null;
  vendorAccessGranted: boolean | null;
  breachEncounterPassed: boolean | null;  // Set by Phase 13 ENCOUNTER_COMPLETE
}

// Maps act number to the music track key loaded in BootScene
export const ACT_MUSIC_MAP: Record<1 | 2 | 3, string> = {
  1: 'music_hub',
  2: 'music_exploration',
  3: 'music_breach',
} as const;

// Act 3 musicBaseVolume override — breach theme is intense for RPG dialogue
// Use 0.15 instead of the default 0.25. Flagged as polish debt for Phase 15.
export const ACT3_MUSIC_BASE_VOLUME = 0.15;

// Default initial state for a new game
export const DEFAULT_ACT_STATE: ActState = {
  current: 1,
  act1Complete: false,
  act2Complete: false,
  musicTrack: 'music_hub',
};

export const DEFAULT_DECISIONS: DecisionState = {
  faxIncidentHandled: null,
  vendorAccessGranted: null,
  breachEncounterPassed: null,
};
