/**
 * spriteAssetPaths.ts — React-side mirror of BootScene NPC spritesheet preload paths.
 *
 * Phase 21 (Sponsor Demo capstone): the CertificateOverlay renders the configured
 * end-NPC sprite as a plain <img>/CSS-background element — no Phaser canvas. Phaser
 * texture keys (e.g., 'npc_staff_sheet') don't carry their source paths into React,
 * so this small map mirrors BootScene.preload() to resolve them.
 *
 * Phase 25 (Dialogue Portraits): getNPCPortraitPath() uses this map as the backing
 * store for the data-driven npcId → sheet path resolver. Both Phase 21 sponsor
 * capstone and Phase 25 dialogue portraits resolve through SPONSOR_SPRITE_PATHS.
 *
 * Sheet geometry (all 9 NPC sheets share this layout):
 *   96×128 PNG · 3 columns × 4 rows · 32×32 px per frame
 *   Frame 0 (top-left, row 0 col 0) = idle-down — the canonical portrait frame.
 *   CSS crop: background-position: 0px 0px; background-size: 96px 128px; width: 32px; height: 32px
 *   (scale ×3 or ×4 for the overlay; image-rendering: pixelated)
 *
 * Keys here match the sprite keys BootScene registers (and the values
 * SPONSOR_CONFIG.character_sprite is allowed to take). Keep in sync with
 * BootScene if NPC sheets are added or renamed.
 */

import roomData from './roomData.json';

const base = import.meta.env.BASE_URL;

export const SPONSOR_SPRITE_PATHS: Record<string, string> = {
  npc_receptionist_sheet: `${base}attached_assets/generated_images/privacyquest/characters/npc_receptionist.png`,
  npc_nurse_sheet:        `${base}attached_assets/generated_images/privacyquest/characters/npc_nurse.png`,
  npc_doctor_sheet:       `${base}attached_assets/generated_images/privacyquest/characters/npc_doctor.png`,
  npc_it_tech_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_it_tech.png`,
  npc_officer_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_officer.png`,
  npc_boss_sheet:         `${base}attached_assets/generated_images/privacyquest/characters/npc_boss.png`,
  npc_staff_sheet:        `${base}attached_assets/generated_images/privacyquest/characters/npc_staff.png`,
  npc_patient_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_patient.png`,
  npc_visitor_sheet:      `${base}attached_assets/generated_images/privacyquest/characters/npc_visitor.png`,
};

/**
 * Module-level index: npcId → sprite type string, built from roomData.json at
 * module load time. After Phase 25 Task 2, every named NPC carries a sprite field,
 * so this map is complete. Entries without a sprite field are skipped defensively.
 */
const NPC_SPRITE_TYPE_BY_ID: Record<string, string> = (() => {
  const index: Record<string, string> = {};
  const rooms = (roomData as { rooms: Array<{ npcs?: Array<{ id: string; sprite?: string }> }> }).rooms;
  for (const room of rooms) {
    for (const npc of room.npcs ?? []) {
      if (npc.id && npc.sprite) {
        index[npc.id] = npc.sprite;
      }
    }
  }
  return index;
})();

/**
 * Resolve a dialogue speaker's npcId to the PNG sheet path BootScene preloads.
 *
 * Resolution chain:
 *   1. Look up npcId in NPC_SPRITE_TYPE_BY_ID (built from roomData.json sprite fields)
 *   2. Build sheet key: `npc_${type}_sheet`
 *   3. Return SPONSOR_SPRITE_PATHS[sheetKey] when present
 *   4. Fallback: emit console.warn in dev mode, return npc_staff_sheet path
 *
 * The fallback is intentionally loud — named characters should always resolve.
 * If you see the warning, add a sprite field to the NPC in roomData.json.
 */
/** F-13 (Run 07): true when the id resolves to a real character sheet.
 *  Zone/item dialogues (sign-in sheet, shredder, …) have no mapping — they are
 *  THINGS, and should not borrow a random staff face. */
export function hasNPCPortrait(npcId: string): boolean {
  const spriteType = NPC_SPRITE_TYPE_BY_ID[npcId];
  return !!(spriteType && SPONSOR_SPRITE_PATHS[`npc_${spriteType}_sheet`]);
}

// F-13 (Run 07): warn once per unmapped id — the old unconditional warn fired
// dozens of times per playthrough for every zone dialogue.
const warnedPortraitIds = new Set<string>();

export function getNPCPortraitPath(npcId: string): string {
  const spriteType = NPC_SPRITE_TYPE_BY_ID[npcId];
  if (spriteType) {
    const sheetKey = `npc_${spriteType}_sheet`;
    const path = SPONSOR_SPRITE_PATHS[sheetKey];
    if (path) {
      return path;
    }
  }

  if (import.meta.env.DEV && !warnedPortraitIds.has(npcId)) {
    warnedPortraitIds.add(npcId);
    console.warn(
      `[DialoguePortrait] No sprite mapping for NPC id "${npcId}" — falling back to staff sheet. ` +
      `Add a sprite field in roomData.json.`
    );
  }
  return SPONSOR_SPRITE_PATHS.npc_staff_sheet;
}

/**
 * Resolve a sponsor character_sprite key to its source path. Falls back to the
 * generic staff sheet if the key is not in the map — guards against config typos
 * without breaking the capstone.
 */
export function getSponsorSpritePath(spriteKey: string): string {
  return SPONSOR_SPRITE_PATHS[spriteKey] ?? SPONSOR_SPRITE_PATHS.npc_staff_sheet;
}
