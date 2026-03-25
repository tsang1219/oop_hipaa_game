import Phaser from 'phaser';

const TILE = 32;

// ── Color utility helpers ────────────────────────────────────────────
/** Darken a 0xRRGGBB color by reducing each channel by `amount` (clamped to 0). */
function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - amount);
  const g = Math.max(0, ((color >> 8) & 0xff) - amount);
  const b = Math.max(0, (color & 0xff) - amount);
  return (r << 16) | (g << 8) | b;
}

/** Lighten a 0xRRGGBB color by increasing each channel by `amount` (clamped to 255). */
function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount);
  const g = Math.min(255, ((color >> 8) & 0xff) + amount);
  const b = Math.min(255, (color & 0xff) + amount);
  return (r << 16) | (g << 8) | b;
}

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
}

// ── Object textures (poster, manual, computer, whiteboard) ───────────
function generateObjectTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('obj_poster')) {
    const g = scene.add.graphics();
    // Paper shadow (offset behind paper)
    g.fillStyle(0xcccccc);
    g.fillRect(8, 6, 20, 24);
    // Paper body
    g.fillStyle(0xfff8dc);
    g.fillRect(6, 4, 20, 24);
    // Paper highlight (top-left edge)
    g.fillStyle(0xfffef0);
    g.fillRect(6, 4, 20, 1);
    g.fillRect(6, 4, 1, 24);
    // Paper shadow edge (bottom-right)
    g.fillStyle(darken(0xfff8dc, 30));
    g.fillRect(25, 5, 1, 23);
    g.fillRect(7, 27, 18, 1);
    // Title line (bold)
    g.fillStyle(0x444444);
    g.fillRect(9, 8, 14, 2);
    // Body text lines (varying lengths for realism)
    g.fillStyle(0x888888);
    g.fillRect(9, 12, 14, 1);
    g.fillRect(9, 15, 12, 1);
    g.fillRect(9, 18, 14, 1);
    g.fillRect(9, 21, 8, 1);
    // Pushpin
    g.fillStyle(0xe74c3c);
    g.fillCircle(16, 4, 3);
    // Pushpin highlight
    g.fillStyle(lighten(0xe74c3c, 40));
    g.fillRect(15, 2, 1, 1);
    g.generateTexture('obj_poster', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('obj_manual')) {
    const g = scene.add.graphics();
    // Book shadow
    g.fillStyle(darken(0x2980b9, 50));
    g.fillRect(10, 8, 16, 22);
    // Book cover
    g.fillStyle(0x2980b9);
    g.fillRect(8, 6, 16, 22);
    // Cover highlight (top-left)
    g.fillStyle(lighten(0x2980b9, 25));
    g.fillRect(8, 6, 16, 1);
    g.fillRect(11, 7, 1, 20);
    // Cover shadow (bottom-right)
    g.fillStyle(darken(0x2980b9, 30));
    g.fillRect(23, 7, 1, 21);
    g.fillRect(9, 27, 14, 1);
    // Spine (darker strip)
    g.fillStyle(0x1a5276);
    g.fillRect(8, 6, 3, 22);
    // Spine highlight
    g.fillStyle(lighten(0x1a5276, 20));
    g.fillRect(8, 6, 1, 22);
    // Pages (visible edge)
    g.fillStyle(0xfefefe);
    g.fillRect(12, 8, 10, 18);
    // Page shadow
    g.fillStyle(0xeeeeee);
    g.fillRect(21, 8, 1, 18);
    // Text lines (varying lengths)
    g.fillStyle(0xaaaaaa);
    g.fillRect(14, 11, 6, 1);
    g.fillRect(14, 14, 5, 1);
    g.fillRect(14, 17, 6, 1);
    g.fillRect(14, 20, 4, 1);
    g.fillRect(14, 23, 6, 1);
    // Cover title emboss
    g.fillStyle(lighten(0x2980b9, 40));
    g.fillRect(9, 9, 2, 4);
    g.generateTexture('obj_manual', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('obj_computer')) {
    const g = scene.add.graphics();
    // Monitor body
    g.fillStyle(0x2a2a2a);
    g.fillRect(5, 3, 22, 17);
    // Monitor highlight (top edge)
    g.fillStyle(0x444444);
    g.fillRect(5, 3, 22, 1);
    g.fillRect(5, 3, 1, 17);
    // Monitor shadow (bottom-right)
    g.fillStyle(0x1a1a1a);
    g.fillRect(26, 4, 1, 16);
    g.fillRect(6, 19, 20, 1);
    // Screen bezel
    g.fillStyle(0x333333);
    g.fillRect(7, 5, 18, 13);
    // Screen (bright glow)
    g.fillStyle(0x1a3a2a);
    g.fillRect(8, 6, 16, 11);
    // Screen glow overlay (lighter center area)
    g.fillStyle(0x2ecc71);
    g.fillRect(9, 7, 14, 9);
    // Screen scanline effect (subtle darker lines)
    g.fillStyle(0x27ae60);
    g.fillRect(9, 8, 14, 1);
    g.fillRect(9, 10, 14, 1);
    g.fillRect(9, 12, 14, 1);
    g.fillRect(9, 14, 14, 1);
    // Screen text (bright white-green)
    g.fillStyle(0x90ffb0);
    g.fillRect(10, 7, 8, 1);
    g.fillRect(10, 9, 6, 1);
    g.fillRect(10, 11, 10, 1);
    g.fillRect(10, 13, 4, 1);  // cursor blink position
    // Screen edge glow (1px lighter border inside screen)
    g.fillStyle(0x40ff80);
    g.fillRect(9, 7, 1, 1);
    // Power LED
    g.fillStyle(0x00ff00);
    g.fillRect(15, 18, 2, 1);
    // Stand neck
    g.fillStyle(0x444444);
    g.fillRect(14, 20, 4, 3);
    // Stand highlight
    g.fillStyle(0x555555);
    g.fillRect(14, 20, 1, 3);
    // Base
    g.fillStyle(0x3a3a3a);
    g.fillRect(10, 23, 12, 3);
    // Base highlight
    g.fillStyle(0x505050);
    g.fillRect(10, 23, 12, 1);
    // Base shadow
    g.fillStyle(0x2a2a2a);
    g.fillRect(10, 25, 12, 1);
    g.generateTexture('obj_computer', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('obj_whiteboard')) {
    const g = scene.add.graphics();
    // Board frame (metal)
    g.fillStyle(0x999999);
    g.fillRect(3, 3, 26, 20);
    // Frame highlight (top-left)
    g.fillStyle(0xbbbbbb);
    g.fillRect(3, 3, 26, 1);
    g.fillRect(3, 3, 1, 20);
    // Frame shadow (bottom-right)
    g.fillStyle(0x777777);
    g.fillRect(28, 4, 1, 19);
    g.fillRect(4, 22, 24, 1);
    // White surface
    g.fillStyle(0xffffff);
    g.fillRect(5, 5, 22, 16);
    // Surface shadow (subtle bottom)
    g.fillStyle(0xf0f0f0);
    g.fillRect(5, 19, 22, 2);
    // Scribble: red diagram / heading
    g.fillStyle(0xe74c3c);
    g.fillRect(7, 7, 8, 2);
    g.fillRect(7, 10, 3, 1);
    // Scribble: blue text lines
    g.fillStyle(0x2980b9);
    g.fillRect(7, 13, 12, 1);
    g.fillRect(7, 15, 10, 1);
    g.fillRect(7, 17, 14, 1);
    // Scribble: green checkmark
    g.fillStyle(0x27ae60);
    g.fillRect(20, 8, 1, 2);
    g.fillRect(21, 7, 1, 1);
    // Tray
    g.fillStyle(0x888888);
    g.fillRect(5, 23, 22, 3);
    // Tray highlight
    g.fillStyle(0x999999);
    g.fillRect(5, 23, 22, 1);
    // Tray shadow
    g.fillStyle(0x666666);
    g.fillRect(5, 25, 22, 1);
    // Markers in tray
    g.fillStyle(0xe74c3c);
    g.fillRect(8, 23, 4, 2);
    g.fillStyle(0x2980b9);
    g.fillRect(13, 23, 4, 2);
    g.fillStyle(0x27ae60);
    g.fillRect(18, 23, 4, 2);
    // Eraser
    g.fillStyle(0x333333);
    g.fillRect(23, 23, 3, 2);
    g.generateTexture('obj_whiteboard', TILE, TILE);
    g.destroy();
  }
}

// ── Furniture textures ───────────────────────────────────────────────
function generateFurnitureTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('furn_desk')) {
    const g = scene.add.graphics();
    const wood = 0x8b6f47;
    const woodDark = darken(wood, 30);
    const woodLight = lighten(wood, 25);
    // Desktop surface
    g.fillStyle(wood);
    g.fillRect(3, 10, 26, 4);
    // Desktop highlight (top edge)
    g.fillStyle(woodLight);
    g.fillRect(3, 10, 26, 1);
    g.fillRect(3, 10, 1, 4);
    // Desktop shadow (bottom edge)
    g.fillStyle(woodDark);
    g.fillRect(4, 13, 25, 1);
    g.fillRect(28, 10, 1, 4);
    // Front panel (under desktop)
    g.fillStyle(darken(wood, 15));
    g.fillRect(4, 14, 24, 8);
    // Front panel shadow
    g.fillStyle(woodDark);
    g.fillRect(27, 14, 1, 8);
    g.fillRect(5, 21, 22, 1);
    // Drawer divider line
    g.fillStyle(woodDark);
    g.fillRect(4, 17, 24, 1);
    // Drawer handles (gold knobs)
    g.fillStyle(0xdaa520);
    g.fillRect(14, 15, 4, 1);
    g.fillRect(14, 19, 4, 1);
    // Handle highlight
    g.fillStyle(0xffd700);
    g.fillRect(14, 15, 2, 1);
    g.fillRect(14, 19, 2, 1);
    // Legs
    g.fillStyle(woodDark);
    g.fillRect(5, 22, 3, 6);
    g.fillRect(24, 22, 3, 6);
    // Leg highlight
    g.fillStyle(wood);
    g.fillRect(5, 22, 1, 6);
    g.fillRect(24, 22, 1, 6);
    g.generateTexture('furn_desk', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_bed')) {
    const g = scene.add.graphics();
    const frame = 0xcccccc;
    const frameDark = darken(frame, 35);
    const frameLight = lighten(frame, 20);
    // Frame body
    g.fillStyle(frame);
    g.fillRect(3, 8, 26, 18);
    // Frame highlight
    g.fillStyle(frameLight);
    g.fillRect(3, 8, 26, 1);
    g.fillRect(3, 8, 1, 18);
    // Frame shadow
    g.fillStyle(frameDark);
    g.fillRect(28, 9, 1, 17);
    g.fillRect(4, 25, 24, 1);
    // Mattress
    g.fillStyle(0xffffff);
    g.fillRect(5, 10, 22, 14);
    // Mattress shadow (right + bottom)
    g.fillStyle(0xe8e8e8);
    g.fillRect(26, 11, 1, 12);
    g.fillRect(6, 23, 20, 1);
    // Pillow
    g.fillStyle(0xf0f0f0);
    g.fillRect(5, 10, 22, 4);
    // Pillow puff (lighter center)
    g.fillStyle(0xfafafa);
    g.fillRect(7, 11, 18, 2);
    // Pillow shadow
    g.fillStyle(0xdddddd);
    g.fillRect(6, 13, 20, 1);
    // Blanket fold line
    g.fillStyle(0xe0e0e0);
    g.fillRect(5, 16, 22, 1);
    // Blanket accent stripe
    g.fillStyle(0xadd8e6);
    g.fillRect(5, 18, 22, 2);
    // Frame feet
    g.fillStyle(frameDark);
    g.fillRect(4, 26, 3, 2);
    g.fillRect(25, 26, 3, 2);
    g.generateTexture('furn_bed', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_cabinet')) {
    const g = scene.add.graphics();
    const cab = 0x8b7355;
    const cabDark = darken(cab, 30);
    const cabLight = lighten(cab, 25);
    // Main body
    g.fillStyle(cab);
    g.fillRect(5, 3, 22, 26);
    // Highlight (left + top edge)
    g.fillStyle(cabLight);
    g.fillRect(5, 3, 22, 1);
    g.fillRect(5, 3, 1, 26);
    // Shadow (right + bottom edge)
    g.fillStyle(cabDark);
    g.fillRect(26, 4, 1, 25);
    g.fillRect(6, 28, 20, 1);
    // Top shelf divider
    g.fillStyle(cabDark);
    g.fillRect(6, 10, 20, 1);
    // Middle shelf divider
    g.fillRect(6, 17, 20, 1);
    // Shelf contents hint (top shelf — books)
    g.fillStyle(0x2980b9);
    g.fillRect(8, 5, 3, 5);
    g.fillStyle(0xe74c3c);
    g.fillRect(12, 5, 2, 5);
    g.fillStyle(0x27ae60);
    g.fillRect(15, 6, 3, 4);
    // Middle shelf — folders
    g.fillStyle(0xf5deb3);
    g.fillRect(8, 12, 12, 4);
    g.fillStyle(darken(0xf5deb3, 20));
    g.fillRect(13, 12, 1, 4);
    // Handles (gold)
    g.fillStyle(0xffd700);
    g.fillRect(23, 7, 2, 2);
    g.fillRect(23, 13, 2, 2);
    // Handle shadow
    g.fillStyle(0xdaa520);
    g.fillRect(24, 8, 1, 1);
    g.fillRect(24, 14, 1, 1);
    // Lower doors (closed panel)
    g.fillStyle(darken(cab, 10));
    g.fillRect(7, 19, 9, 8);
    g.fillRect(17, 19, 9, 8);
    // Door divider line
    g.fillStyle(cabDark);
    g.fillRect(16, 19, 1, 8);
    // Door handles
    g.fillStyle(0xffd700);
    g.fillRect(14, 22, 2, 2);
    g.fillRect(18, 22, 2, 2);
    g.generateTexture('furn_cabinet', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_table')) {
    const g = scene.add.graphics();
    const wood = 0xa0826d;
    const woodDark = darken(wood, 30);
    const woodLight = lighten(wood, 25);
    // Tabletop surface
    g.fillStyle(wood);
    g.fillRect(3, 11, 26, 4);
    // Tabletop highlight (top edge)
    g.fillStyle(woodLight);
    g.fillRect(3, 11, 26, 1);
    g.fillRect(3, 11, 1, 4);
    // Tabletop shadow (bottom + right edge)
    g.fillStyle(woodDark);
    g.fillRect(4, 14, 25, 1);
    g.fillRect(28, 11, 1, 4);
    // Apron (under tabletop)
    g.fillStyle(darken(wood, 15));
    g.fillRect(5, 15, 22, 2);
    // Legs (four tapered legs)
    g.fillStyle(woodDark);
    g.fillRect(5, 17, 3, 11);
    g.fillRect(24, 17, 3, 11);
    // Leg highlights (inner edge)
    g.fillStyle(wood);
    g.fillRect(7, 17, 1, 11);
    g.fillRect(24, 17, 1, 11);
    // Cross brace detail
    g.fillStyle(woodDark);
    g.fillRect(8, 22, 16, 1);
    g.generateTexture('furn_table', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_counter')) {
    const g = scene.add.graphics();
    const metal = 0x95a5a6;
    const metalDark = darken(metal, 30);
    const metalLight = lighten(metal, 25);
    // Counter body
    g.fillStyle(metal);
    g.fillRect(1, 12, 30, 12);
    // Counter top surface (polished)
    g.fillStyle(metalLight);
    g.fillRect(1, 12, 30, 2);
    // Top edge highlight
    g.fillStyle(lighten(metal, 40));
    g.fillRect(1, 12, 30, 1);
    // Counter shadow (right + bottom)
    g.fillStyle(metalDark);
    g.fillRect(30, 13, 1, 11);
    g.fillRect(2, 23, 28, 1);
    // Front panel divider
    g.fillStyle(metalDark);
    g.fillRect(1, 17, 30, 1);
    // Cabinet doors below
    g.fillStyle(darken(metal, 10));
    g.fillRect(2, 18, 13, 5);
    g.fillRect(17, 18, 13, 5);
    // Door divider
    g.fillStyle(metalDark);
    g.fillRect(15, 18, 2, 5);
    // Door handles
    g.fillStyle(0xdddddd);
    g.fillRect(12, 20, 2, 1);
    g.fillRect(18, 20, 2, 1);
    g.generateTexture('furn_counter', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_rack')) {
    const g = scene.add.graphics();
    const metal = 0x7f8c8d;
    const metalDark = darken(metal, 30);
    const metalLight = lighten(metal, 25);
    // Vertical uprights
    g.fillStyle(metal);
    g.fillRect(7, 3, 2, 27);
    g.fillRect(23, 3, 2, 27);
    // Upright highlights
    g.fillStyle(metalLight);
    g.fillRect(7, 3, 1, 27);
    g.fillRect(23, 3, 1, 27);
    // Upright shadows
    g.fillStyle(metalDark);
    g.fillRect(8, 3, 1, 27);
    g.fillRect(24, 3, 1, 27);
    // Shelves (3 levels)
    const shelfColor = 0x95a5a6;
    const shelfY = [5, 13, 21];
    for (const sy of shelfY) {
      g.fillStyle(shelfColor);
      g.fillRect(9, sy, 14, 3);
      // Shelf highlight
      g.fillStyle(lighten(shelfColor, 20));
      g.fillRect(9, sy, 14, 1);
      // Shelf shadow
      g.fillStyle(darken(shelfColor, 20));
      g.fillRect(9, sy + 2, 14, 1);
    }
    // Items on shelves (boxes/files)
    g.fillStyle(0x3498db);
    g.fillRect(10, 8, 4, 5);
    g.fillStyle(0xe74c3c);
    g.fillRect(15, 9, 3, 4);
    g.fillStyle(0xf39c12);
    g.fillRect(10, 16, 5, 5);
    g.fillStyle(0x9b59b6);
    g.fillRect(17, 17, 4, 4);
    g.fillStyle(0x2ecc71);
    g.fillRect(11, 24, 3, 5);
    g.fillStyle(0xe67e22);
    g.fillRect(16, 24, 5, 5);
    g.generateTexture('furn_rack', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_shelf')) {
    const g = scene.add.graphics();
    const wood = 0x8b7355;
    const woodDark = darken(wood, 30);
    const woodLight = lighten(wood, 25);
    // Wall brackets (vertical supports)
    g.fillStyle(woodDark);
    g.fillRect(5, 4, 2, 24);
    g.fillRect(25, 4, 2, 24);
    // Bracket highlights
    g.fillStyle(wood);
    g.fillRect(5, 4, 1, 24);
    g.fillRect(25, 4, 1, 24);
    // Shelf planks (3 levels)
    const plankY = [5, 13, 21];
    for (const py of plankY) {
      g.fillStyle(wood);
      g.fillRect(4, py, 24, 3);
      // Plank highlight
      g.fillStyle(woodLight);
      g.fillRect(4, py, 24, 1);
      // Plank shadow
      g.fillStyle(woodDark);
      g.fillRect(4, py + 2, 24, 1);
    }
    // Books on top shelf
    g.fillStyle(0x2980b9);
    g.fillRect(8, 8, 2, 5);
    g.fillStyle(0xe74c3c);
    g.fillRect(11, 8, 2, 5);
    g.fillStyle(0x27ae60);
    g.fillRect(14, 9, 2, 4);
    g.fillStyle(0xf39c12);
    g.fillRect(17, 8, 3, 5);
    // Box on middle shelf
    g.fillStyle(0xd4a574);
    g.fillRect(8, 16, 6, 5);
    g.fillStyle(darken(0xd4a574, 20));
    g.fillRect(13, 16, 1, 5);
    // Folder on middle shelf
    g.fillStyle(0x95a5a6);
    g.fillRect(16, 16, 5, 5);
    g.generateTexture('furn_shelf', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_chair')) {
    const g = scene.add.graphics();
    const blue = 0x3498db;
    const blueDark = darken(blue, 30);
    const blueLight = lighten(blue, 25);
    // Backrest
    g.fillStyle(darken(blue, 10));
    g.fillRect(8, 5, 16, 9);
    // Backrest highlight (top-left)
    g.fillStyle(blueLight);
    g.fillRect(8, 5, 16, 1);
    g.fillRect(8, 5, 1, 9);
    // Backrest shadow (right + bottom)
    g.fillStyle(blueDark);
    g.fillRect(23, 6, 1, 8);
    g.fillRect(9, 13, 14, 1);
    // Backrest cushion detail
    g.fillStyle(blue);
    g.fillRect(10, 7, 12, 5);
    // Seat cushion
    g.fillStyle(blue);
    g.fillRect(7, 14, 18, 7);
    // Seat highlight
    g.fillStyle(blueLight);
    g.fillRect(7, 14, 18, 1);
    g.fillRect(7, 14, 1, 7);
    // Seat shadow
    g.fillStyle(blueDark);
    g.fillRect(24, 15, 1, 6);
    g.fillRect(8, 20, 16, 1);
    // Legs (metal)
    g.fillStyle(0x555555);
    g.fillRect(9, 21, 2, 8);
    g.fillRect(21, 21, 2, 8);
    // Leg highlights
    g.fillStyle(0x777777);
    g.fillRect(9, 21, 1, 8);
    g.fillRect(21, 21, 1, 8);
    // Cross bar
    g.fillStyle(0x555555);
    g.fillRect(11, 25, 10, 1);
    // Feet
    g.fillStyle(0x333333);
    g.fillRect(8, 29, 4, 2);
    g.fillRect(20, 29, 4, 2);
    g.generateTexture('furn_chair', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_plant')) {
    const g = scene.add.graphics();
    const pot = 0xb5651d;
    const potDark = darken(pot, 35);
    const potLight = lighten(pot, 25);
    // Pot body (slightly tapered)
    g.fillStyle(pot);
    g.fillRect(9, 20, 14, 9);
    // Pot rim
    g.fillStyle(potLight);
    g.fillRect(8, 19, 16, 2);
    // Pot highlight (left)
    g.fillStyle(potLight);
    g.fillRect(9, 21, 1, 8);
    // Pot shadow (right)
    g.fillStyle(potDark);
    g.fillRect(22, 21, 1, 8);
    g.fillRect(10, 28, 12, 1);
    // Pot stripe decoration
    g.fillStyle(darken(pot, 15));
    g.fillRect(10, 24, 12, 1);
    // Soil visible at top
    g.fillStyle(0x5d4037);
    g.fillRect(10, 20, 12, 2);
    // Main foliage (darker base)
    g.fillStyle(0x1e8449);
    g.fillCircle(16, 13, 8);
    // Foliage highlight clusters
    g.fillStyle(0x27ae60);
    g.fillCircle(13, 11, 5);
    g.fillCircle(19, 11, 5);
    // Bright highlights
    g.fillStyle(0x2ecc71);
    g.fillCircle(11, 15, 4);
    g.fillCircle(21, 15, 4);
    g.fillCircle(16, 9, 4);
    // Top leaf highlight
    g.fillStyle(0x58d68d);
    g.fillRect(14, 6, 2, 2);
    g.fillRect(10, 10, 1, 2);
    g.fillRect(21, 10, 1, 2);
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
 * Map an NPC id to its PNG spritesheet texture key.
 * These spritesheets are loaded in BootScene (e.g. npc_receptionist_sheet).
 * The programmatic textures from generateNPCTextures() remain as fallback.
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
