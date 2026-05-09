/**
 * characters.ts — Player character roster + selectedCharacterId persistence.
 *
 * Each character maps to a 96×128 spritesheet (3 cols × 4 rows of 32×32 frames,
 * row order: down / left / right / up). BootScene reads the active selection at
 * preload time and loads the chosen sheet under the global `player_sheet`
 * texture key, so ExplorationScene stays character-agnostic.
 */

export type CharacterId = 'you' | 'alex' | 'nikhil';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  blurb: string;
  /** Path to the 96×128 spritesheet, relative to import.meta.env.BASE_URL. */
  sheetPath: string;
}

export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: 'you',
    name: 'You',
    blurb: 'A fresh hire on day one.',
    sheetPath: 'attached_assets/generated_images/privacyquest/characters/player.png',
  },
  {
    id: 'alex',
    name: 'Alex',
    blurb: 'Lead Gardener, tending to the seeds in our minds.',
    sheetPath: 'attached_assets/generated_images/privacyquest/characters/player_alex.png',
  },
  {
    id: 'nikhil',
    name: 'Nikhil',
    blurb: 'Thinkboi aka Brown Brad Pitt.',
    sheetPath: 'attached_assets/generated_images/privacyquest/characters/player_nikhil.png',
  },
];

const STORAGE_KEY = 'pq:selected-character';
const DEFAULT_ID: CharacterId = 'you';

export function getSelectedCharacterId(): CharacterId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && CHARACTERS.some(c => c.id === v)) return v as CharacterId;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_ID;
}

export function setSelectedCharacterId(id: CharacterId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch { /* localStorage unavailable */ }
}

export function getSelectedCharacter(): CharacterDef {
  const id = getSelectedCharacterId();
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0];
}

export function hasCharacterBeenSelected(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch { return false; }
}
