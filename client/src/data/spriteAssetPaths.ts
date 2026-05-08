/**
 * spriteAssetPaths.ts — React-side mirror of BootScene NPC spritesheet preload paths.
 *
 * Phase 21 (Sponsor Demo capstone): the CertificateOverlay renders the configured
 * end-NPC sprite as a plain <img>/CSS-background element — no Phaser canvas. Phaser
 * texture keys (e.g., 'npc_staff_sheet') don't carry their source paths into React,
 * so this small map mirrors BootScene.preload() to resolve them.
 *
 * Keys here match the sprite keys BootScene registers (and the values
 * SPONSOR_CONFIG.character_sprite is allowed to take). Keep in sync with
 * BootScene if NPC sheets are added or renamed.
 */

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
 * Resolve a sponsor character_sprite key to its source path. Falls back to the
 * generic staff sheet if the key is not in the map — guards against config typos
 * without breaking the capstone.
 */
export function getSponsorSpritePath(spriteKey: string): string {
  return SPONSOR_SPRITE_PATHS[spriteKey] ?? SPONSOR_SPRITE_PATHS.npc_staff_sheet;
}
