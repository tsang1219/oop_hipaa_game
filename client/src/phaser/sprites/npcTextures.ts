import Phaser from 'phaser';

import { TILE, darken, lighten } from './colorUtils';

// ── NPC sprite style definitions (legacy SVG palette — NPCSprite.tsx deleted in Phase 25; dialogue portraits now crop the PNG sheets via spriteAssetPaths) ─────
interface NpcStyle {
  shirt: number; hair: number; pants: number; shoes: number;
  coat?: number; tie?: number;
}
const NPC_STYLES: Record<string, NpcStyle> = {
  npc_receptionist: { shirt: 0xe8f4f8, hair: 0xff6b9d, pants: 0x333333, shoes: 0x000000 },
  npc_nurse:        { shirt: 0x4a90e2, hair: 0x8b4513, pants: 0x2c5aa0, shoes: 0xffffff },
  npc_doctor:       { shirt: 0x4a90e2, hair: 0x4a4a4a, pants: 0x333333, shoes: 0x000000, coat: 0xffffff },
  npc_it_tech:      { shirt: 0x5c946e, hair: 0x654321, pants: 0x4169e1, shoes: 0x8b4513 },
  npc_boss:         { shirt: 0x1a1a1a, hair: 0x2c2c2c, pants: 0x2c2c2c, shoes: 0x000000, tie: 0xdc143c },
  npc_staff:        { shirt: 0x9b59b6, hair: 0xffd700, pants: 0x555555, shoes: 0x000000 },
  npc_patient:      { shirt: 0x95a5a6, hair: 0xd4a574, pants: 0x95a5a6, shoes: 0xbdc3c7 },
  npc_visitor:      { shirt: 0xf39c12, hair: 0x7f3c10, pants: 0x333333, shoes: 0x5d4037 },
  npc_officer:      { shirt: 0x2c3e50, hair: 0x1a1a1a, pants: 0x1a1a1a, shoes: 0x111111 },
  npc_lawyer:       { shirt: 0x27406b, hair: 0x8a6733, pants: 0x1b2d4d, shoes: 0x141414, tie: 0xe8c33a },
};

export function generateNPCTextures(scene: Phaser.Scene) {
  for (const [key, style] of Object.entries(NPC_STYLES)) {
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    drawCharacter(g, style);
    g.generateTexture(key, TILE, TILE);
    g.destroy();
  }
}

/**
 * Draw an SNES-era pixel-art character onto a Graphics object.
 * 32x32 canvas with chibi proportions, shading, and highlights.
 */
function drawCharacter(g: Phaser.GameObjects.Graphics, style: NpcStyle) {
  const SKIN = 0xfdbcb4;
  const SKIN_SHADOW = darken(SKIN, 30);
  const SKIN_HIGHLIGHT = lighten(SKIN, 20);

  // ── Hair (slightly larger chibi head) ──
  const hairDark = darken(style.hair, 35);
  const hairLight = lighten(style.hair, 25);
  // Main hair mass
  g.fillStyle(style.hair);
  g.fillRect(10, 3, 12, 5);  // top of hair wider
  g.fillRect(9, 5, 2, 5);    // left sideburns
  g.fillRect(21, 5, 2, 5);   // right sideburns
  // Hair highlight (top-left)
  g.fillStyle(hairLight);
  g.fillRect(11, 3, 3, 1);
  g.fillRect(10, 4, 1, 2);
  // Hair shadow (bottom-right)
  g.fillStyle(hairDark);
  g.fillRect(21, 4, 1, 4);
  g.fillRect(18, 7, 4, 1);

  // ── Head (larger chibi face) ──
  // Main face
  g.fillStyle(SKIN);
  g.fillRect(11, 5, 10, 9);  // wider + taller head
  // Face highlight (left edge)
  g.fillStyle(SKIN_HIGHLIGHT);
  g.fillRect(11, 6, 1, 7);
  // Face shadow (right edge)
  g.fillStyle(SKIN_SHADOW);
  g.fillRect(20, 6, 1, 7);
  g.fillRect(12, 13, 8, 1);  // chin shadow

  // ── Eyes with white highlight ──
  g.fillStyle(0x000000);
  g.fillRect(13, 9, 2, 2);   // left eye
  g.fillRect(17, 9, 2, 2);   // right eye
  // White eye highlights (top-left of each eye)
  g.fillStyle(0xffffff);
  g.fillRect(13, 9, 1, 1);
  g.fillRect(17, 9, 1, 1);

  // ── Mouth ──
  g.fillStyle(darken(SKIN, 45));
  g.fillRect(15, 12, 2, 1);

  // ── Neck ──
  g.fillStyle(SKIN);
  g.fillRect(14, 14, 4, 1);
  g.fillStyle(SKIN_SHADOW);
  g.fillRect(17, 14, 1, 1);  // neck shadow

  // ── Body ──
  if (style.coat !== undefined) {
    // Coat outer layer (doctor)
    const coatDark = darken(style.coat, 30);
    const coatLight = lighten(style.coat, 15);
    // Main coat body
    g.fillStyle(style.coat);
    g.fillRect(9, 15, 14, 9);
    // Coat highlight (left edge)
    g.fillStyle(coatLight);
    g.fillRect(9, 15, 1, 8);
    // Coat shadow (right edge + bottom)
    g.fillStyle(coatDark);
    g.fillRect(22, 15, 1, 9);
    g.fillRect(10, 23, 12, 1);
    // Coat lapel line
    g.fillStyle(coatDark);
    g.fillRect(16, 15, 1, 7);
    // Coat sleeves
    g.fillStyle(style.coat);
    g.fillRect(6, 16, 3, 6);
    g.fillRect(23, 16, 3, 6);
    // Sleeve shadows
    g.fillStyle(coatDark);
    g.fillRect(8, 16, 1, 6);
    g.fillRect(25, 16, 1, 6);
    // Inner shirt visible
    g.fillStyle(style.shirt);
    g.fillRect(13, 16, 6, 6);
    // Shirt shadow
    g.fillStyle(darken(style.shirt, 25));
    g.fillRect(18, 16, 1, 6);
    // Hands
    g.fillStyle(SKIN);
    g.fillRect(6, 22, 3, 2);
    g.fillRect(23, 22, 3, 2);
  } else {
    const shirtDark = darken(style.shirt, 30);
    const shirtLight = lighten(style.shirt, 25);
    // Main shirt body
    g.fillStyle(style.shirt);
    g.fillRect(10, 15, 12, 9);
    // Shirt highlight (left edge)
    g.fillStyle(shirtLight);
    g.fillRect(10, 15, 1, 8);
    // Shirt shadow (right edge + bottom)
    g.fillStyle(shirtDark);
    g.fillRect(21, 15, 1, 9);
    g.fillRect(11, 23, 10, 1);
    // Collar detail
    g.fillStyle(shirtLight);
    g.fillRect(13, 15, 2, 1);
    g.fillRect(17, 15, 2, 1);
    // Arms
    g.fillStyle(style.shirt);
    g.fillRect(7, 16, 3, 6);
    g.fillRect(22, 16, 3, 6);
    // Arm shadows (outer edge)
    g.fillStyle(shirtDark);
    g.fillRect(7, 16, 1, 6);
    g.fillRect(24, 16, 1, 6);
    // Hands
    g.fillStyle(SKIN);
    g.fillRect(7, 22, 3, 2);
    g.fillRect(22, 22, 3, 2);
    // Hand shadow
    g.fillStyle(SKIN_SHADOW);
    g.fillRect(9, 22, 1, 2);
    g.fillRect(24, 22, 1, 2);

    // Tie (boss)
    if (style.tie !== undefined) {
      // White shirt strip behind tie
      g.fillStyle(0xffffff);
      g.fillRect(14, 15, 4, 8);
      // Tie knot
      g.fillStyle(style.tie);
      g.fillRect(15, 15, 2, 1);
      // Tie body
      g.fillStyle(style.tie);
      g.fillRect(15, 16, 2, 5);
      // Tie point
      g.fillRect(15, 21, 2, 1);
      // Tie highlight
      g.fillStyle(lighten(style.tie, 30));
      g.fillRect(15, 16, 1, 3);
      // Tie shadow
      g.fillStyle(darken(style.tie, 30));
      g.fillRect(16, 19, 1, 2);
    }
  }

  // ── Pants ──
  const pantsDark = darken(style.pants, 25);
  const pantsLight = lighten(style.pants, 20);
  // Left leg
  g.fillStyle(style.pants);
  g.fillRect(11, 24, 5, 5);
  // Right leg
  g.fillRect(16, 24, 5, 5);
  // Pants gap (between legs)
  g.fillStyle(pantsDark);
  g.fillRect(15, 25, 2, 4);
  // Pants highlight (left outer edge)
  g.fillStyle(pantsLight);
  g.fillRect(11, 24, 1, 4);
  // Pants shadow (right outer edge)
  g.fillStyle(pantsDark);
  g.fillRect(20, 24, 1, 5);

  // ── Shoes (2-toned: darker toe, lighter heel) ──
  const shoeDark = darken(style.shoes, 30);
  const shoeLight = lighten(style.shoes, 30);
  // Left shoe — toe (darker)
  g.fillStyle(shoeDark);
  g.fillRect(10, 29, 3, 2);
  // Left shoe — heel (lighter)
  g.fillStyle(shoeLight);
  g.fillRect(13, 29, 3, 2);
  // Right shoe — toe (darker)
  g.fillStyle(shoeDark);
  g.fillRect(16, 29, 3, 2);
  // Right shoe — heel (lighter)
  g.fillStyle(shoeLight);
  g.fillRect(19, 29, 3, 2);
  // Shoe sole (1px dark line at bottom)
  g.fillStyle(darken(style.shoes, 50));
  g.fillRect(10, 31, 6, 1);
  g.fillRect(16, 31, 6, 1);

  // ID badge (small rectangle on chest — universal hospital detail)
  g.fillStyle(0xffffff);
  g.fillRect(11, 17, 3, 4);
  // Badge clip
  g.fillStyle(0xcccccc);
  g.fillRect(12, 16, 1, 1);
  // Badge photo (tiny colored square)
  g.fillStyle(0x8899aa);
  g.fillRect(11, 18, 2, 2);
}

/**
 * Map an NPC id to its PNG spritesheet texture key.
 * These spritesheets are loaded in BootScene (e.g. npc_receptionist_sheet).
 * The programmatic textures from generateNPCTextures() remain as fallback.
 */
export function npcTextureKey(npcId: string): string {
  const map: Record<string, string> = {
    // Hospital Entrance
    riley_entrance: 'npc_receptionist',
    // Reception
    riley: 'npc_receptionist',
    nervous_patient: 'npc_patient',
    chatty_visitor: 'npc_visitor',
    // ER
    dr_martinez: 'npc_doctor',
    officer: 'npc_officer',
    frantic_family: 'npc_visitor',
    priya_privacy_officer: 'npc_officer',  // Phase 17: Breach Triage Privacy Officer
    // Lab
    lab_tech: 'npc_it_tech',
    researcher: 'npc_doctor',
    courier: 'npc_visitor',
    // Records Room
    records_clerk: 'npc_receptionist',
    patient_request: 'npc_patient',
    attorney: 'npc_lawyer',
    compliance_officer: 'npc_officer',
    // IT Office
    security_analyst: 'npc_it_tech',
    vendor: 'npc_visitor',
    workaround_employee: 'npc_staff',
    // Break Room
    gossiping_coworker: 'npc_nurse',
    friend_fishing: 'npc_staff',
    tired_employee: 'npc_patient',
    hr_director: 'npc_boss',
    selfie_coworker: 'npc_visitor',
    // Legacy / other
    nurse_chen: 'npc_nurse',
    it_tech: 'npc_it_tech',
    dr_patel: 'npc_doctor',
    pharmacist: 'npc_nurse',
    intern: 'npc_staff',
    admin: 'npc_boss',
    final_boss_1: 'npc_boss',
  };
  return map[npcId] || 'npc_staff';
}

/**
 * Resolve the on-canvas texture key for a room NPC, preferring the loaded PNG
 * spritesheet (npc_TYPE_sheet, frame 0 = idle-down) over the legacy programmatic
 * chibi texture drawn by generateNPCTextures().
 *
 * `spriteType` is the roomData `npc.sprite` field — the SAME single source of
 * truth the dialogue portrait uses (spriteAssetPaths.NPC_SPRITE_TYPE_BY_ID), so
 * the in-room sprite and the dialogue portrait can never disagree. Falls back to
 * the hardcoded npcTextureKey() map for NPCs that carry no sprite field (e.g.
 * the ambience-only nurse_chen), then to the programmatic texture if the sheet
 * failed to load.
 *
 * Fixes the "portrait doesn't match the sprite" + "sprite looks blocky / two
 * legs and a head" bugs: room NPCs used to render the old programmatic chibi
 * (npcTextureKey → 'npc_boss') while the player and portraits used the new PNG
 * sheets ('npc_boss_sheet').
 */
export function npcSpriteTextureKey(
  scene: Phaser.Scene,
  npcId: string,
  spriteType?: string,
): string {
  const base = spriteType ? `npc_${spriteType}` : npcTextureKey(npcId);
  const sheetKey = `${base}_sheet`;
  return scene.textures.exists(sheetKey) ? sheetKey : base;
}

/**
 * Map an NPC id to the NPC type string used in animation keys (e.g. 'npc_TYPE_walk_DIR').
 */
export function npcTypeFromId(npcId: string): string {
  // Derive type from texture key: 'npc_doctor' -> 'doctor'
  const texKey = npcTextureKey(npcId);
  return texKey.replace('npc_', '');
}
