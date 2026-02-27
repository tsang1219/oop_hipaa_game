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

// ── NPC sprite colors ────────────────────────────────────────────────
const NPC_STYLES: Record<string, { shirt: number; hair: number; shoes: number }> = {
  npc_receptionist: { shirt: 0x2ecc71, hair: 0x654321, shoes: 0xffffff },
  npc_nurse:        { shirt: 0x3498db, hair: 0x8b4513, shoes: 0xffffff },
  npc_doctor:       { shirt: 0xffffff, hair: 0x2c3e50, shoes: 0x333333 },
  npc_it_tech:      { shirt: 0x34495e, hair: 0x2c3e50, shoes: 0x333333 },
  npc_boss:         { shirt: 0x8e44ad, hair: 0x1a1a2e, shoes: 0x222222 },
  npc_staff:        { shirt: 0xe67e22, hair: 0x654321, shoes: 0x8b4513 },
  npc_patient:      { shirt: 0x95a5a6, hair: 0xd4a574, shoes: 0xbdc3c7 },
  npc_visitor:      { shirt: 0xf39c12, hair: 0x7f3c10, shoes: 0x5d4037 },
  npc_officer:      { shirt: 0x2c3e50, hair: 0x1a1a1a, shoes: 0x111111 },
};

function generateNPCTextures(scene: Phaser.Scene) {
  for (const [key, style] of Object.entries(NPC_STYLES)) {
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    drawCharacter(g, style.shirt, style.hair, style.shoes);
    g.generateTexture(key, TILE, TILE);
    g.destroy();
  }
}

function drawCharacter(g: Phaser.GameObjects.Graphics, shirtColor: number, hairColor: number, shoeColor: number) {
  // Body
  g.fillStyle(shirtColor);
  g.fillRect(10, 14, 12, 10);
  // Head
  g.fillStyle(0xfdbcb4);
  g.fillRect(12, 6, 8, 8);
  // Hair
  g.fillStyle(hairColor);
  g.fillRect(11, 4, 10, 4);
  // Eyes
  g.fillStyle(0x000000);
  g.fillRect(14, 9, 2, 2);
  g.fillRect(18, 9, 2, 2);
  // Pants
  g.fillStyle(0x2c3e50);
  g.fillRect(10, 24, 5, 4);
  g.fillRect(17, 24, 5, 4);
  // Shoes
  g.fillStyle(shoeColor);
  g.fillRect(10, 28, 5, 2);
  g.fillRect(17, 28, 5, 2);
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
 * Map an NPC id to a texture key, falling back to generic.
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
