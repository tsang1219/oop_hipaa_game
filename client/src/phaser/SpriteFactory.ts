import Phaser from 'phaser';

const TILE = 32;

/**
 * Generates all programmatic sprite textures used across PrivacyQuest scenes.
 * Call once from BootScene.create() after preload completes.
 */
export function generateAllTextures(scene: Phaser.Scene) {
  generateNPCTextures(scene);
  generateObjectTextures(scene);
  generateFurnitureTextures(scene);
}

// ── NPC sprite style definitions (matches NPCSprite.tsx SVG art) ─────
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
};

function generateNPCTextures(scene: Phaser.Scene) {
  for (const [key, style] of Object.entries(NPC_STYLES)) {
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    drawCharacter(g, style);
    g.generateTexture(key, TILE, TILE);
    g.destroy();
  }
}

/**
 * Draw a pixel-art character onto a Graphics object.
 * Coordinates match NPCSprite.tsx SVG viewBox (32×32).
 * Background is transparent (Graphics default).
 */
function drawCharacter(g: Phaser.GameObjects.Graphics, style: NpcStyle) {
  const SKIN = 0xfdbcb4;

  // Hair
  g.fillStyle(style.hair);
  g.fillRect(11, 5, 10, 4);
  g.fillRect(10, 7, 2, 4);
  g.fillRect(20, 7, 2, 4);

  // Head
  g.fillStyle(SKIN);
  g.fillRect(12, 6, 8, 8);

  // Eyes
  g.fillStyle(0x000000);
  g.fillRect(14, 10, 2, 2);
  g.fillRect(18, 10, 2, 2);

  // Coat / outer layer (doctor only)
  if (style.coat !== undefined) {
    g.fillStyle(style.coat);
    g.fillRect(10, 14, 12, 10);
    g.fillRect(7, 15, 3, 7);
    g.fillRect(22, 15, 3, 7);
    // Inner shirt strip
    g.fillStyle(style.shirt);
    g.fillRect(11, 15, 10, 8);
  } else {
    // Shirt body
    g.fillStyle(style.shirt);
    g.fillRect(11, 14, 10, 10);
    // Arms
    g.fillRect(8, 15, 3, 6);
    g.fillRect(21, 15, 3, 6);
    // Hands
    g.fillStyle(SKIN);
    g.fillRect(8, 21, 3, 2);
    g.fillRect(21, 21, 3, 2);
    // Tie for boss
    if (style.tie !== undefined) {
      g.fillStyle(0xffffff);
      g.fillRect(14, 15, 4, 8);
      g.fillStyle(style.tie);
      g.fillRect(15, 15, 2, 6);
    }
  }

  // Pants
  g.fillStyle(style.pants);
  g.fillRect(12, 24, 4, 6);
  g.fillRect(16, 24, 4, 6);

  // Shoes
  g.fillStyle(style.shoes);
  g.fillRect(11, 30, 5, 2);
  g.fillRect(16, 30, 5, 2);
}

// ── Object textures (poster, manual, computer, whiteboard) ───────────
function generateObjectTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('obj_poster')) {
    const g = scene.add.graphics();
    // Paper
    g.fillStyle(0xfff8dc);
    g.fillRect(6, 4, 20, 24);
    g.lineStyle(2, 0x888888);
    g.strokeRect(6, 4, 20, 24);
    // Lines
    g.fillStyle(0x666666);
    g.fillRect(9, 8, 14, 2);
    g.fillRect(9, 13, 14, 2);
    g.fillRect(9, 18, 10, 2);
    // Pushpin
    g.fillStyle(0xe74c3c);
    g.fillCircle(16, 4, 3);
    g.generateTexture('obj_poster', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('obj_manual')) {
    const g = scene.add.graphics();
    // Book cover
    g.fillStyle(0x2980b9);
    g.fillRect(8, 6, 16, 22);
    g.lineStyle(1, 0x1a5276);
    g.strokeRect(8, 6, 16, 22);
    // Spine
    g.fillStyle(0x1a5276);
    g.fillRect(8, 6, 3, 22);
    // Pages
    g.fillStyle(0xffffff);
    g.fillRect(12, 8, 10, 18);
    // Lines
    g.fillStyle(0xaaaaaa);
    g.fillRect(14, 11, 6, 1);
    g.fillRect(14, 15, 6, 1);
    g.fillRect(14, 19, 6, 1);
    g.generateTexture('obj_manual', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('obj_computer')) {
    const g = scene.add.graphics();
    // Monitor
    g.fillStyle(0x333333);
    g.fillRect(6, 4, 20, 16);
    // Screen
    g.fillStyle(0x2ecc71);
    g.fillRect(8, 6, 16, 12);
    // Screen text lines
    g.fillStyle(0x27ae60);
    g.fillRect(10, 8, 10, 1);
    g.fillRect(10, 11, 8, 1);
    g.fillRect(10, 14, 12, 1);
    // Stand
    g.fillStyle(0x555555);
    g.fillRect(13, 20, 6, 4);
    // Base
    g.fillStyle(0x444444);
    g.fillRect(10, 24, 12, 3);
    g.generateTexture('obj_computer', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('obj_whiteboard')) {
    const g = scene.add.graphics();
    // Board frame
    g.fillStyle(0x999999);
    g.fillRect(4, 4, 24, 18);
    // White surface
    g.fillStyle(0xffffff);
    g.fillRect(6, 6, 20, 14);
    // Scribbles
    g.fillStyle(0xe74c3c);
    g.fillRect(8, 9, 8, 2);
    g.fillStyle(0x2980b9);
    g.fillRect(8, 13, 12, 2);
    // Tray
    g.fillStyle(0x777777);
    g.fillRect(6, 22, 20, 3);
    // Marker
    g.fillStyle(0xe74c3c);
    g.fillRect(10, 22, 4, 2);
    g.generateTexture('obj_whiteboard', TILE, TILE);
    g.destroy();
  }
}

// ── Furniture textures ───────────────────────────────────────────────
function generateFurnitureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('furn_desk')) {
    const g = scene.add.graphics();
    g.fillStyle(0x8b6f47);
    g.fillRect(4, 10, 24, 12);
    g.lineStyle(1, 0x5d4e37);
    g.strokeRect(4, 10, 24, 12);
    g.fillStyle(0x6b5535);
    g.fillRect(6, 22, 4, 6);
    g.fillRect(22, 22, 4, 6);
    g.generateTexture('furn_desk', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_bed')) {
    const g = scene.add.graphics();
    // Frame
    g.fillStyle(0xcccccc);
    g.fillRect(4, 8, 24, 18);
    g.lineStyle(1, 0x999999);
    g.strokeRect(4, 8, 24, 18);
    // Mattress
    g.fillStyle(0xffffff);
    g.fillRect(6, 10, 20, 14);
    // Pillow
    g.fillStyle(0xe8e8e8);
    g.fillRect(6, 10, 20, 4);
    g.generateTexture('furn_bed', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_cabinet')) {
    const g = scene.add.graphics();
    g.fillStyle(0x8b7355);
    g.fillRect(6, 4, 20, 24);
    g.lineStyle(1, 0x5d4e37);
    g.strokeRect(6, 4, 20, 24);
    g.fillStyle(0x6b5535);
    g.fillRect(6, 15, 20, 2);
    // Handle
    g.fillStyle(0xffd700);
    g.fillRect(22, 9, 2, 2);
    g.fillRect(22, 20, 2, 2);
    g.generateTexture('furn_cabinet', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_table')) {
    const g = scene.add.graphics();
    g.fillStyle(0xa0826d);
    g.fillRect(4, 12, 24, 10);
    g.lineStyle(1, 0x6b5535);
    g.strokeRect(4, 12, 24, 10);
    g.fillStyle(0x8b6f47);
    g.fillRect(6, 22, 3, 6);
    g.fillRect(23, 22, 3, 6);
    g.generateTexture('furn_table', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_counter')) {
    const g = scene.add.graphics();
    g.fillStyle(0x95a5a6);
    g.fillRect(2, 12, 28, 10);
    g.lineStyle(1, 0x7f8c8d);
    g.strokeRect(2, 12, 28, 10);
    g.fillStyle(0xbdc3c7);
    g.fillRect(2, 12, 28, 3);
    g.generateTexture('furn_counter', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_rack')) {
    const g = scene.add.graphics();
    g.fillStyle(0x7f8c8d);
    g.fillRect(8, 4, 16, 26);
    g.fillStyle(0x95a5a6);
    g.fillRect(10, 6, 12, 4);
    g.fillRect(10, 14, 12, 4);
    g.fillRect(10, 22, 12, 4);
    g.generateTexture('furn_rack', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_shelf')) {
    const g = scene.add.graphics();
    g.fillStyle(0x8b7355);
    g.fillRect(4, 6, 24, 3);
    g.fillRect(4, 14, 24, 3);
    g.fillRect(4, 22, 24, 3);
    // Brackets
    g.fillStyle(0x5d4e37);
    g.fillRect(6, 6, 2, 20);
    g.fillRect(24, 6, 2, 20);
    g.generateTexture('furn_shelf', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_chair')) {
    const g = scene.add.graphics();
    // Seat
    g.fillStyle(0x3498db);
    g.fillRect(8, 14, 16, 8);
    g.lineStyle(1, 0x2980b9);
    g.strokeRect(8, 14, 16, 8);
    // Back
    g.fillStyle(0x2980b9);
    g.fillRect(8, 6, 16, 8);
    // Legs
    g.fillStyle(0x555555);
    g.fillRect(10, 22, 3, 6);
    g.fillRect(19, 22, 3, 6);
    g.generateTexture('furn_chair', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_plant')) {
    const g = scene.add.graphics();
    // Pot
    g.fillStyle(0xb5651d);
    g.fillRect(10, 20, 12, 8);
    g.lineStyle(1, 0x8b4513);
    g.strokeRect(10, 20, 12, 8);
    // Foliage
    g.fillStyle(0x27ae60);
    g.fillCircle(16, 14, 8);
    g.fillStyle(0x2ecc71);
    g.fillCircle(11, 17, 5);
    g.fillCircle(21, 17, 5);
    g.generateTexture('furn_plant', TILE, TILE);
    g.destroy();
  }
}

/**
 * Map a room obstacle type string to its texture key.
 */
export function furnitureTextureKey(obstacleType?: string): string {
  const map: Record<string, string> = {
    desk: 'furn_desk',
    bed: 'furn_bed',
    cabinet: 'furn_cabinet',
    table: 'furn_table',
    counter: 'furn_counter',
    rack: 'furn_rack',
    shelf: 'furn_shelf',
    chair: 'furn_chair',
    chairs: 'furn_chair',
    plant: 'furn_plant',
    nurse_station: 'furn_counter',
    patient_bay: 'furn_bed',
  };
  return map[obstacleType || ''] || 'furn_desk';
}

/**
 * Map an NPC id to its programmatically-generated texture key.
 * These textures are created by generateNPCTextures() in SpriteFactory and are
 * guaranteed to be available without any file loading, eliminating the black-box
 * artefact that occurred when PNG spritesheet uploads were deferred.
 */
export function npcTextureKey(npcId: string): string {
  const map: Record<string, string> = {
    riley: 'npc_receptionist',
    nervous_patient: 'npc_patient',
    chatty_visitor: 'npc_visitor',
    dr_martinez: 'npc_doctor',
    officer: 'npc_officer',
    nurse_chen: 'npc_nurse',
    it_tech: 'npc_it_tech',
    dr_patel: 'npc_doctor',
    pharmacist: 'npc_staff',
    intern: 'npc_staff',
    lab_tech: 'npc_it_tech',
    admin: 'npc_boss',
    final_boss_1: 'npc_boss',
  };
  return map[npcId] || 'npc_staff';
}

/**
 * Map an NPC id to the NPC type string used in animation keys (e.g. 'npc_TYPE_walk_DIR').
 */
export function npcTypeFromId(npcId: string): string {
  const map: Record<string, string> = {
    riley: 'receptionist',
    nervous_patient: 'patient',
    chatty_visitor: 'visitor',
    dr_martinez: 'doctor',
    officer: 'officer',
    nurse_chen: 'nurse',
    it_tech: 'it_tech',
    dr_patel: 'doctor',
    pharmacist: 'staff',
    intern: 'staff',
    lab_tech: 'it_tech',
    admin: 'boss',
    final_boss_1: 'boss',
  };
  return map[npcId] || 'staff';
}

/**
 * Map an object sprite type to its texture key.
 */
export function objectTextureKey(spriteType: string): string {
  const map: Record<string, string> = {
    poster: 'obj_poster',
    manual: 'obj_manual',
    computer: 'obj_computer',
    whiteboard: 'obj_whiteboard',
  };
  return map[spriteType] || 'obj_computer';
}
