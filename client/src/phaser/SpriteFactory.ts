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
    // Pot
    const pot = 0xc0613a;
    g.fillStyle(darken(pot, 20));
    g.fillRect(11, 20, 10, 10);
    g.fillStyle(pot);
    g.fillRect(12, 20, 8, 9);
    // Pot highlight
    g.fillStyle(lighten(pot, 25));
    g.fillRect(12, 20, 1, 8);
    // Pot rim
    g.fillStyle(lighten(pot, 15));
    g.fillRect(10, 19, 12, 2);
    // Soil
    g.fillStyle(0x3e2723);
    g.fillRect(13, 20, 6, 2);
    // Plant stems
    g.fillStyle(0x2e7d32);
    g.fillRect(15, 10, 2, 10);
    g.fillRect(13, 12, 2, 8);
    g.fillRect(17, 13, 2, 7);
    // Leaves (various greens for depth)
    g.fillStyle(0x4caf50);
    g.fillRect(10, 7, 5, 4);
    g.fillRect(17, 6, 5, 4);
    g.fillRect(12, 4, 8, 4);
    g.fillStyle(0x66bb6a);
    g.fillRect(11, 5, 3, 3);
    g.fillRect(18, 7, 3, 2);
    g.fillStyle(0x388e3c);
    g.fillRect(14, 3, 4, 3);
    g.fillRect(10, 8, 2, 2);
    g.fillRect(20, 8, 2, 2);
    // Leaf highlights
    g.fillStyle(0x81c784);
    g.fillRect(12, 4, 2, 1);
    g.fillRect(18, 6, 2, 1);
    g.generateTexture('furn_plant', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_clock')) {
    const g = scene.add.graphics();
    // Clock frame (circular approximation)
    g.fillStyle(0x333333);
    g.fillRect(9, 5, 14, 14);
    // Clock face
    g.fillStyle(0xffffff);
    g.fillRect(10, 6, 12, 12);
    // Face shadow
    g.fillStyle(0xeeeeee);
    g.fillRect(10, 14, 12, 4);
    // Hour marks
    g.fillStyle(0x333333);
    g.fillRect(15, 7, 2, 2);  // 12
    g.fillRect(15, 15, 2, 2); // 6
    g.fillRect(11, 11, 2, 2); // 9
    g.fillRect(19, 11, 2, 2); // 3
    // Hour hand
    g.fillStyle(0x000000);
    g.fillRect(16, 9, 1, 4);
    // Minute hand
    g.fillRect(16, 12, 4, 1);
    // Center dot
    g.fillStyle(0xe74c3c);
    g.fillRect(15, 11, 2, 2);
    // Frame highlight
    g.fillStyle(0x555555);
    g.fillRect(9, 5, 14, 1);
    g.fillRect(9, 5, 1, 14);
    // Frame shadow
    g.fillStyle(0x222222);
    g.fillRect(9, 18, 14, 1);
    g.fillRect(22, 6, 1, 12);
    g.generateTexture('furn_clock', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_water_cooler')) {
    const g = scene.add.graphics();
    // Base cabinet
    g.fillStyle(0xeeeeee);
    g.fillRect(10, 18, 12, 10);
    g.fillStyle(0xdddddd);
    g.fillRect(21, 18, 1, 10);
    g.fillRect(11, 27, 10, 1);
    // Dispenser body
    g.fillStyle(0xf5f5f5);
    g.fillRect(11, 8, 10, 10);
    g.fillStyle(lighten(0xf5f5f5, 5));
    g.fillRect(11, 8, 10, 1);
    g.fillRect(11, 8, 1, 10);
    // Water bottle (blue tint)
    g.fillStyle(0x64b5f6);
    g.fillRect(13, 1, 6, 8);
    g.fillStyle(0x90caf9);
    g.fillRect(13, 1, 2, 7);
    // Bottle cap
    g.fillStyle(0x1565c0);
    g.fillRect(14, 0, 4, 2);
    // Spigots
    g.fillStyle(0xe53935);
    g.fillRect(12, 13, 3, 2);
    g.fillStyle(0x1e88e5);
    g.fillRect(17, 13, 3, 2);
    // Drip tray
    g.fillStyle(0xbdbdbd);
    g.fillRect(11, 16, 10, 2);
    g.generateTexture('furn_water_cooler', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_filing_cabinet')) {
    const g = scene.add.graphics();
    const metal = 0x78909c;
    // Main body
    g.fillStyle(metal);
    g.fillRect(8, 3, 16, 26);
    // Body highlight
    g.fillStyle(lighten(metal, 20));
    g.fillRect(8, 3, 1, 26);
    g.fillRect(8, 3, 16, 1);
    // Body shadow
    g.fillStyle(darken(metal, 25));
    g.fillRect(23, 4, 1, 25);
    g.fillRect(9, 28, 14, 1);
    // Drawer divisions
    g.fillStyle(darken(metal, 15));
    g.fillRect(9, 9, 14, 1);
    g.fillRect(9, 16, 14, 1);
    g.fillRect(9, 23, 14, 1);
    // Drawer handles
    g.fillStyle(0xcccccc);
    g.fillRect(14, 5, 4, 2);
    g.fillRect(14, 11, 4, 2);
    g.fillRect(14, 18, 4, 2);
    g.fillRect(14, 25, 4, 2);
    // Handle highlights
    g.fillStyle(0xeeeeee);
    g.fillRect(14, 5, 2, 1);
    g.fillRect(14, 11, 2, 1);
    g.fillRect(14, 18, 2, 1);
    g.fillRect(14, 25, 2, 1);
    // Label slot on top drawer
    g.fillStyle(0xffffff);
    g.fillRect(12, 6, 8, 2);
    g.generateTexture('furn_filing_cabinet', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_exam_table')) {
    const g = scene.add.graphics();
    // Table body (medical white/grey)
    g.fillStyle(0xe0e0e0);
    g.fillRect(4, 10, 24, 14);
    // Table highlight
    g.fillStyle(0xf0f0f0);
    g.fillRect(4, 10, 24, 2);
    g.fillRect(4, 10, 1, 14);
    // Table shadow
    g.fillStyle(0xcccccc);
    g.fillRect(27, 11, 1, 13);
    g.fillRect(5, 23, 22, 1);
    // Cushion (blue medical)
    g.fillStyle(0x5b9bd5);
    g.fillRect(6, 11, 20, 10);
    g.fillStyle(lighten(0x5b9bd5, 20));
    g.fillRect(6, 11, 20, 2);
    // Paper roll strip
    g.fillStyle(0xffffff);
    g.fillRect(6, 13, 20, 1);
    // Legs
    g.fillStyle(0xaaaaaa);
    g.fillRect(6, 24, 3, 5);
    g.fillRect(23, 24, 3, 5);
    g.fillStyle(0xbbbbbb);
    g.fillRect(6, 24, 1, 5);
    g.fillRect(23, 24, 1, 5);
    g.generateTexture('furn_exam_table', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_bookshelf')) {
    const g = scene.add.graphics();
    const wood = 0x6d5535;
    // Frame
    g.fillStyle(wood);
    g.fillRect(4, 2, 24, 28);
    g.fillStyle(lighten(wood, 20));
    g.fillRect(4, 2, 1, 28);
    g.fillRect(4, 2, 24, 1);
    g.fillStyle(darken(wood, 25));
    g.fillRect(27, 3, 1, 27);
    g.fillRect(5, 29, 22, 1);
    // Shelf dividers
    g.fillStyle(darken(wood, 15));
    g.fillRect(5, 9, 22, 2);
    g.fillRect(5, 18, 22, 2);
    // Books top shelf (colorful spines)
    const bookColors = [0xe74c3c, 0x2980b9, 0x27ae60, 0xf39c12, 0x8e44ad, 0x1abc9c];
    for (let i = 0; i < 6; i++) {
      const bx = 6 + i * 3;
      g.fillStyle(bookColors[i]);
      g.fillRect(bx, 3, 2, 6);
      g.fillStyle(lighten(bookColors[i], 30));
      g.fillRect(bx, 3, 1, 1);
    }
    // Books middle shelf
    for (let i = 0; i < 5; i++) {
      const bx = 7 + i * 4;
      g.fillStyle(bookColors[(i + 2) % bookColors.length]);
      g.fillRect(bx, 11, 3, 7);
      g.fillStyle(lighten(bookColors[(i + 2) % bookColors.length], 25));
      g.fillRect(bx, 11, 1, 1);
    }
    // Bottom shelf — folders
    g.fillStyle(0xf5deb3);
    g.fillRect(7, 21, 14, 7);
    g.fillStyle(darken(0xf5deb3, 20));
    g.fillRect(11, 21, 1, 7);
    g.fillRect(16, 21, 1, 7);
    g.generateTexture('furn_bookshelf', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_nurse_station')) {
    const g = scene.add.graphics();
    // L-shaped counter
    g.fillStyle(0xb0a090);
    g.fillRect(2, 12, 28, 4);
    g.fillStyle(lighten(0xb0a090, 20));
    g.fillRect(2, 12, 28, 1);
    // Counter top
    g.fillStyle(0xd4c5a9);
    g.fillRect(2, 10, 28, 3);
    g.fillStyle(lighten(0xd4c5a9, 15));
    g.fillRect(2, 10, 28, 1);
    // Front panel
    g.fillStyle(0x9a8b7a);
    g.fillRect(3, 16, 26, 10);
    g.fillStyle(darken(0x9a8b7a, 20));
    g.fillRect(28, 16, 1, 10);
    g.fillRect(4, 25, 24, 1);
    // Panel dividers
    g.fillStyle(darken(0x9a8b7a, 15));
    g.fillRect(15, 16, 1, 10);
    // Computer monitor on counter
    g.fillStyle(0x333333);
    g.fillRect(18, 5, 8, 6);
    g.fillStyle(0x2ecc71);
    g.fillRect(19, 6, 6, 4);
    g.fillStyle(0x444444);
    g.fillRect(21, 11, 4, 1);
    // Paper stack
    g.fillStyle(0xfff8dc);
    g.fillRect(5, 8, 6, 3);
    g.fillStyle(darken(0xfff8dc, 15));
    g.fillRect(5, 10, 6, 1);
    g.generateTexture('furn_nurse_station', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_microscope')) {
    const g = scene.add.graphics();
    // Base
    g.fillStyle(0x444444);
    g.fillRect(9, 24, 14, 4);
    g.fillStyle(0x555555);
    g.fillRect(9, 24, 14, 1);
    // Arm (vertical)
    g.fillStyle(0x555555);
    g.fillRect(14, 8, 4, 16);
    g.fillStyle(0x666666);
    g.fillRect(14, 8, 1, 16);
    // Eyepiece
    g.fillStyle(0x333333);
    g.fillRect(12, 4, 4, 5);
    g.fillStyle(0x444444);
    g.fillRect(12, 4, 4, 1);
    // Lens tube
    g.fillStyle(0x666666);
    g.fillRect(13, 9, 6, 3);
    // Stage
    g.fillStyle(0x777777);
    g.fillRect(10, 18, 12, 3);
    g.fillStyle(0x888888);
    g.fillRect(10, 18, 12, 1);
    // Focus knob
    g.fillStyle(0x888888);
    g.fillRect(19, 12, 3, 4);
    g.fillStyle(0x999999);
    g.fillRect(19, 12, 1, 4);
    g.generateTexture('furn_microscope', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_trash')) {
    const g = scene.add.graphics();
    // Can body (metal grey)
    g.fillStyle(0x9e9e9e);
    g.fillRect(10, 10, 12, 16);
    // Body highlight
    g.fillStyle(lighten(0x9e9e9e, 20));
    g.fillRect(10, 10, 1, 15);
    // Body shadow
    g.fillStyle(darken(0x9e9e9e, 25));
    g.fillRect(21, 10, 1, 16);
    g.fillRect(11, 25, 10, 1);
    // Rim
    g.fillStyle(0xbdbdbd);
    g.fillRect(9, 9, 14, 2);
    // Rim highlight
    g.fillStyle(0xd0d0d0);
    g.fillRect(9, 9, 14, 1);
    // Trash visible inside (crumpled paper)
    g.fillStyle(0xf5f5dc);
    g.fillRect(12, 10, 3, 2);
    g.fillStyle(0xe8e8d0);
    g.fillRect(16, 11, 4, 2);
    // Base
    g.fillStyle(darken(0x9e9e9e, 30));
    g.fillRect(10, 26, 12, 2);
    g.generateTexture('furn_trash', TILE, TILE);
    g.destroy();
  }

  // ── ER Room textures ─────────────────────────────────────────────────

  if (!scene.textures.exists('furn_gurney')) {
    const g = scene.add.graphics();
    const frame = 0xaaaaaa;
    const frameDark = darken(frame, 30);
    const frameLight = lighten(frame, 20);
    // Metal frame rails
    g.fillStyle(frame);
    g.fillRect(3, 14, 26, 2);
    g.fillStyle(frameLight);
    g.fillRect(3, 14, 26, 1);
    g.fillStyle(frameDark);
    g.fillRect(3, 15, 26, 1);
    // Side rails
    g.fillStyle(frame);
    g.fillRect(4, 10, 2, 4);
    g.fillRect(26, 10, 2, 4);
    g.fillStyle(frameLight);
    g.fillRect(4, 10, 1, 4);
    g.fillRect(26, 10, 1, 4);
    // White mattress pad
    g.fillStyle(0xffffff);
    g.fillRect(5, 8, 22, 6);
    g.fillStyle(0xf0f0f0);
    g.fillRect(26, 9, 1, 5);
    g.fillRect(6, 13, 20, 1);
    // Pillow
    g.fillStyle(0xf5f5f5);
    g.fillRect(5, 8, 6, 4);
    g.fillStyle(0xeaeaea);
    g.fillRect(5, 11, 6, 1);
    // Legs
    g.fillStyle(frameDark);
    g.fillRect(5, 16, 2, 10);
    g.fillRect(25, 16, 2, 10);
    g.fillStyle(frame);
    g.fillRect(5, 16, 1, 10);
    g.fillRect(25, 16, 1, 10);
    // Wheels (small circles at bottom)
    g.fillStyle(0x333333);
    g.fillRect(4, 26, 4, 3);
    g.fillRect(24, 26, 4, 3);
    g.fillStyle(0x555555);
    g.fillRect(5, 26, 2, 1);
    g.fillRect(25, 26, 2, 1);
    // Cross brace
    g.fillStyle(frameDark);
    g.fillRect(7, 22, 18, 1);
    g.generateTexture('furn_gurney', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_curtain_partition')) {
    const g = scene.add.graphics();
    const teal = 0x2a9d8f;
    const tealDark = darken(teal, 30);
    const tealLight = lighten(teal, 25);
    // Top rail
    g.fillStyle(0xaaaaaa);
    g.fillRect(4, 3, 24, 2);
    g.fillStyle(0xcccccc);
    g.fillRect(4, 3, 24, 1);
    g.fillStyle(0x888888);
    g.fillRect(4, 4, 24, 1);
    // Curtain rings
    g.fillStyle(0xcccccc);
    g.fillRect(6, 5, 2, 1);
    g.fillRect(12, 5, 2, 1);
    g.fillRect(18, 5, 2, 1);
    g.fillRect(24, 5, 2, 1);
    // Curtain body
    g.fillStyle(teal);
    g.fillRect(5, 6, 22, 22);
    // Curtain highlight (left edge)
    g.fillStyle(tealLight);
    g.fillRect(5, 6, 1, 22);
    // Curtain shadow (right edge)
    g.fillStyle(tealDark);
    g.fillRect(26, 6, 1, 22);
    g.fillRect(6, 27, 20, 1);
    // Fold lines (vertical pleats)
    g.fillStyle(tealDark);
    g.fillRect(10, 6, 1, 22);
    g.fillRect(16, 6, 1, 22);
    g.fillRect(22, 6, 1, 22);
    // Fold highlights
    g.fillStyle(tealLight);
    g.fillRect(8, 6, 1, 22);
    g.fillRect(14, 6, 1, 22);
    g.fillRect(20, 6, 1, 22);
    g.generateTexture('furn_curtain_partition', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_iv_stand')) {
    const g = scene.add.graphics();
    const pole = 0xaaaaaa;
    const poleDark = darken(pole, 30);
    const poleLight = lighten(pole, 20);
    // Vertical pole
    g.fillStyle(pole);
    g.fillRect(15, 8, 2, 20);
    g.fillStyle(poleLight);
    g.fillRect(15, 8, 1, 20);
    g.fillStyle(poleDark);
    g.fillRect(16, 8, 1, 20);
    // Top hook arms
    g.fillStyle(pole);
    g.fillRect(12, 7, 8, 2);
    g.fillStyle(poleLight);
    g.fillRect(12, 7, 8, 1);
    // IV bag (yellowish clear)
    g.fillStyle(0xf0e68c);
    g.fillRect(8, 2, 6, 6);
    g.fillStyle(lighten(0xf0e68c, 20));
    g.fillRect(8, 2, 2, 5);
    g.fillStyle(darken(0xf0e68c, 20));
    g.fillRect(13, 3, 1, 4);
    // Bag cap
    g.fillStyle(0x1565c0);
    g.fillRect(9, 1, 4, 2);
    // Drip line
    g.fillStyle(0xcccccc);
    g.fillRect(11, 8, 1, 6);
    // Drip chamber
    g.fillStyle(0xdddddd);
    g.fillRect(10, 10, 3, 3);
    // Base (wheeled tripod)
    g.fillStyle(poleDark);
    g.fillRect(10, 28, 12, 2);
    g.fillRect(13, 26, 6, 2);
    // Wheels
    g.fillStyle(0x333333);
    g.fillRect(10, 29, 3, 2);
    g.fillRect(19, 29, 3, 2);
    g.generateTexture('furn_iv_stand', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_crash_cart')) {
    const g = scene.add.graphics();
    const red = 0xcc2222;
    const redDark = darken(red, 30);
    const redLight = lighten(red, 25);
    // Cart body
    g.fillStyle(red);
    g.fillRect(5, 8, 22, 18);
    // Body highlight
    g.fillStyle(redLight);
    g.fillRect(5, 8, 22, 1);
    g.fillRect(5, 8, 1, 18);
    // Body shadow
    g.fillStyle(redDark);
    g.fillRect(26, 9, 1, 17);
    g.fillRect(6, 25, 20, 1);
    // Drawer lines
    g.fillStyle(redDark);
    g.fillRect(6, 12, 20, 1);
    g.fillRect(6, 16, 20, 1);
    g.fillRect(6, 20, 20, 1);
    // Drawer handles (silver)
    g.fillStyle(0xcccccc);
    g.fillRect(14, 10, 4, 1);
    g.fillRect(14, 14, 4, 1);
    g.fillRect(14, 18, 4, 1);
    g.fillRect(14, 22, 4, 1);
    // Top surface
    g.fillStyle(0xdddddd);
    g.fillRect(5, 6, 22, 3);
    g.fillStyle(0xeeeeee);
    g.fillRect(5, 6, 22, 1);
    // Defibrillator paddles on top
    g.fillStyle(0x333333);
    g.fillRect(7, 3, 4, 4);
    g.fillRect(21, 3, 4, 4);
    g.fillStyle(0x555555);
    g.fillRect(7, 3, 2, 2);
    g.fillRect(21, 3, 2, 2);
    // Paddle cord
    g.fillStyle(0x444444);
    g.fillRect(11, 5, 10, 1);
    // Wheels
    g.fillStyle(0x333333);
    g.fillRect(6, 26, 4, 3);
    g.fillRect(22, 26, 4, 3);
    g.generateTexture('furn_crash_cart', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_vital_monitor')) {
    const g = scene.add.graphics();
    // Monitor housing
    g.fillStyle(0x2a2a2a);
    g.fillRect(6, 4, 20, 16);
    g.fillStyle(0x444444);
    g.fillRect(6, 4, 20, 1);
    g.fillRect(6, 4, 1, 16);
    g.fillStyle(0x1a1a1a);
    g.fillRect(25, 5, 1, 15);
    g.fillRect(7, 19, 18, 1);
    // Screen bezel
    g.fillStyle(0x333333);
    g.fillRect(8, 6, 16, 12);
    // Screen background
    g.fillStyle(0x0a1a0a);
    g.fillRect(9, 7, 14, 10);
    // Green waveform (ECG line)
    g.fillStyle(0x00ff00);
    g.fillRect(10, 12, 2, 1);
    g.fillRect(12, 10, 1, 1);
    g.fillRect(13, 8, 1, 1);
    g.fillRect(14, 13, 1, 1);
    g.fillRect(15, 11, 1, 1);
    g.fillRect(16, 12, 2, 1);
    g.fillRect(18, 10, 1, 1);
    g.fillRect(19, 9, 1, 1);
    g.fillRect(20, 12, 2, 1);
    // Indicator dots
    g.fillStyle(0xff0000);
    g.fillRect(10, 15, 2, 1);
    g.fillStyle(0xffff00);
    g.fillRect(14, 15, 2, 1);
    g.fillStyle(0x00ff00);
    g.fillRect(18, 15, 2, 1);
    // Stand
    g.fillStyle(0x444444);
    g.fillRect(14, 20, 4, 3);
    g.fillStyle(0x555555);
    g.fillRect(14, 20, 1, 3);
    // Base
    g.fillStyle(0x3a3a3a);
    g.fillRect(10, 23, 12, 3);
    g.fillStyle(0x4a4a4a);
    g.fillRect(10, 23, 12, 1);
    // Power LED
    g.fillStyle(0x00ff00);
    g.fillRect(24, 18, 1, 1);
    g.generateTexture('furn_vital_monitor', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_triage_desk')) {
    const g = scene.add.graphics();
    const wood = 0x8b7355;
    const woodDark = darken(wood, 30);
    const woodLight = lighten(wood, 25);
    // Desktop surface (wider)
    g.fillStyle(wood);
    g.fillRect(1, 12, 30, 4);
    g.fillStyle(woodLight);
    g.fillRect(1, 12, 30, 1);
    g.fillRect(1, 12, 1, 4);
    g.fillStyle(woodDark);
    g.fillRect(2, 15, 29, 1);
    g.fillRect(30, 12, 1, 4);
    // Front panel
    g.fillStyle(darken(wood, 15));
    g.fillRect(2, 16, 28, 10);
    g.fillStyle(woodDark);
    g.fillRect(29, 16, 1, 10);
    g.fillRect(3, 25, 26, 1);
    // Panel divider
    g.fillStyle(woodDark);
    g.fillRect(2, 20, 28, 1);
    // Small monitor on desk
    g.fillStyle(0x2a2a2a);
    g.fillRect(18, 5, 10, 8);
    g.fillStyle(0x2ecc71);
    g.fillRect(19, 6, 8, 6);
    g.fillStyle(0x27ae60);
    g.fillRect(19, 8, 8, 1);
    g.fillRect(19, 10, 8, 1);
    // Monitor stand
    g.fillStyle(0x444444);
    g.fillRect(22, 13, 3, 1);
    // Papers on desk
    g.fillStyle(0xfff8dc);
    g.fillRect(3, 9, 8, 4);
    g.fillStyle(darken(0xfff8dc, 15));
    g.fillRect(3, 12, 8, 1);
    // Pen
    g.fillStyle(0x2980b9);
    g.fillRect(12, 10, 5, 1);
    // Legs
    g.fillStyle(woodDark);
    g.fillRect(3, 26, 3, 4);
    g.fillRect(26, 26, 3, 4);
    g.generateTexture('furn_triage_desk', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_equipment')) {
    const g = scene.add.graphics();
    const gray = 0x8a8a8a;
    const grayDark = darken(gray, 30);
    const grayLight = lighten(gray, 20);
    // Main boxy body
    g.fillStyle(gray);
    g.fillRect(6, 8, 20, 18);
    g.fillStyle(grayLight);
    g.fillRect(6, 8, 20, 1);
    g.fillRect(6, 8, 1, 18);
    g.fillStyle(grayDark);
    g.fillRect(25, 9, 1, 17);
    g.fillRect(7, 25, 18, 1);
    // Small screen area
    g.fillStyle(0x1a2a1a);
    g.fillRect(8, 10, 10, 6);
    g.fillStyle(0x2ecc71);
    g.fillRect(9, 11, 8, 4);
    // Screen text
    g.fillStyle(0x90ffb0);
    g.fillRect(10, 12, 5, 1);
    g.fillRect(10, 14, 3, 1);
    // Dials/buttons
    g.fillStyle(0xcccccc);
    g.fillRect(20, 11, 3, 3);
    g.fillStyle(0xdddddd);
    g.fillRect(20, 11, 1, 1);
    g.fillStyle(0xe74c3c);
    g.fillRect(20, 16, 2, 2);
    g.fillStyle(0x2ecc71);
    g.fillRect(23, 16, 2, 2);
    // Vent slits at bottom
    g.fillStyle(grayDark);
    g.fillRect(8, 20, 16, 1);
    g.fillRect(8, 22, 16, 1);
    g.fillRect(8, 24, 16, 1);
    // Feet
    g.fillStyle(grayDark);
    g.fillRect(7, 26, 4, 2);
    g.fillRect(21, 26, 4, 2);
    g.generateTexture('furn_equipment', TILE, TILE);
    g.destroy();
  }

  // ── Lab Room textures ───────────────────────────────────────────────

  if (!scene.textures.exists('furn_lab_bench')) {
    const g = scene.add.graphics();
    const steel = 0x95a5a6;
    const steelDark = darken(steel, 30);
    const steelLight = lighten(steel, 25);
    // Bench top surface
    g.fillStyle(steel);
    g.fillRect(1, 12, 30, 3);
    g.fillStyle(steelLight);
    g.fillRect(1, 12, 30, 1);
    g.fillStyle(steelDark);
    g.fillRect(2, 14, 29, 1);
    // Cabinet below
    g.fillStyle(darken(steel, 10));
    g.fillRect(2, 15, 28, 10);
    g.fillStyle(steelDark);
    g.fillRect(29, 15, 1, 10);
    g.fillRect(3, 24, 26, 1);
    // Cabinet doors
    g.fillStyle(steelDark);
    g.fillRect(15, 15, 1, 10);
    // Door handles
    g.fillStyle(0xdddddd);
    g.fillRect(12, 19, 2, 1);
    g.fillRect(18, 19, 2, 1);
    // Chemical bottles on top
    g.fillStyle(0x2980b9);
    g.fillRect(4, 7, 4, 5);
    g.fillStyle(lighten(0x2980b9, 25));
    g.fillRect(4, 7, 1, 4);
    g.fillStyle(0xe74c3c);
    g.fillRect(10, 8, 3, 4);
    g.fillStyle(lighten(0xe74c3c, 20));
    g.fillRect(10, 8, 1, 3);
    g.fillStyle(0x27ae60);
    g.fillRect(15, 9, 3, 3);
    // Bottle caps
    g.fillStyle(0x333333);
    g.fillRect(5, 6, 2, 2);
    g.fillRect(10, 7, 2, 2);
    // Legs
    g.fillStyle(steelDark);
    g.fillRect(3, 25, 3, 5);
    g.fillRect(26, 25, 3, 5);
    g.generateTexture('furn_lab_bench', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_centrifuge')) {
    const g = scene.add.graphics();
    const body = 0xe0e0e0;
    const bodyDark = darken(body, 30);
    const bodyLight = lighten(body, 15);
    // Base body
    g.fillStyle(body);
    g.fillRect(7, 14, 18, 14);
    g.fillStyle(bodyLight);
    g.fillRect(7, 14, 18, 1);
    g.fillRect(7, 14, 1, 14);
    g.fillStyle(bodyDark);
    g.fillRect(24, 15, 1, 13);
    g.fillRect(8, 27, 16, 1);
    // Circular lid on top
    g.fillStyle(0xcccccc);
    g.fillRect(9, 8, 14, 7);
    g.fillStyle(0xdddddd);
    g.fillRect(9, 8, 14, 1);
    g.fillRect(9, 8, 1, 7);
    g.fillStyle(0xbbbbbb);
    g.fillRect(22, 9, 1, 6);
    // Lid circle indicator
    g.fillStyle(0xaaaaaa);
    g.fillRect(12, 10, 8, 4);
    g.fillStyle(0xbbbbbb);
    g.fillRect(13, 11, 6, 2);
    // Latch
    g.fillStyle(0x888888);
    g.fillRect(15, 7, 2, 2);
    // Small display
    g.fillStyle(0x0a1a2a);
    g.fillRect(9, 18, 6, 3);
    g.fillStyle(0x00ccff);
    g.fillRect(10, 19, 4, 1);
    // Control button
    g.fillStyle(0x27ae60);
    g.fillRect(18, 18, 3, 3);
    // Feet
    g.fillStyle(bodyDark);
    g.fillRect(8, 28, 4, 2);
    g.fillRect(20, 28, 4, 2);
    g.generateTexture('furn_centrifuge', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_specimen_fridge')) {
    const g = scene.add.graphics();
    const white = 0xf0f0f0;
    const whiteDark = darken(white, 30);
    const whiteLight = lighten(white, 10);
    // Main body
    g.fillStyle(white);
    g.fillRect(7, 3, 18, 26);
    g.fillStyle(whiteLight);
    g.fillRect(7, 3, 18, 1);
    g.fillRect(7, 3, 1, 26);
    g.fillStyle(whiteDark);
    g.fillRect(24, 4, 1, 25);
    g.fillRect(8, 28, 16, 1);
    // Door line
    g.fillStyle(whiteDark);
    g.fillRect(8, 16, 16, 1);
    // Handle
    g.fillStyle(0xaaaaaa);
    g.fillRect(22, 8, 2, 6);
    g.fillStyle(0xcccccc);
    g.fillRect(22, 8, 1, 6);
    // Temperature display (blue)
    g.fillStyle(0x0a1a3a);
    g.fillRect(10, 5, 6, 3);
    g.fillStyle(0x4fc3f7);
    g.fillRect(11, 6, 4, 1);
    // Biohazard red dot
    g.fillStyle(0xff0000);
    g.fillRect(14, 19, 4, 4);
    g.fillStyle(lighten(0xff0000, 30));
    g.fillRect(15, 20, 2, 2);
    // Door seal line
    g.fillStyle(darken(white, 15));
    g.fillRect(8, 4, 1, 12);
    // Feet
    g.fillStyle(0x666666);
    g.fillRect(8, 29, 3, 2);
    g.fillRect(21, 29, 3, 2);
    g.generateTexture('furn_specimen_fridge', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_bio_cabinet')) {
    const g = scene.add.graphics();
    const dark = 0x4a4a5a;
    const darkShade = darken(dark, 25);
    const darkLight = lighten(dark, 20);
    // Main enclosure body
    g.fillStyle(dark);
    g.fillRect(3, 6, 26, 22);
    g.fillStyle(darkLight);
    g.fillRect(3, 6, 26, 1);
    g.fillRect(3, 6, 1, 22);
    g.fillStyle(darkShade);
    g.fillRect(28, 7, 1, 21);
    g.fillRect(4, 27, 24, 1);
    // Glass front panel (lighter rectangle)
    g.fillStyle(0x8899aa);
    g.fillRect(5, 10, 22, 12);
    g.fillStyle(lighten(0x8899aa, 20));
    g.fillRect(5, 10, 22, 1);
    g.fillRect(5, 10, 1, 12);
    // Glass reflection
    g.fillStyle(lighten(0x8899aa, 35));
    g.fillRect(7, 11, 3, 2);
    // Vent slits on top
    g.fillStyle(darkShade);
    g.fillRect(6, 3, 20, 1);
    g.fillRect(6, 5, 20, 1);
    // Interior hint
    g.fillStyle(darken(0x8899aa, 15));
    g.fillRect(10, 14, 12, 6);
    // UV light indicator
    g.fillStyle(0x9b59b6);
    g.fillRect(24, 8, 2, 1);
    // Base feet
    g.fillStyle(darkShade);
    g.fillRect(5, 28, 4, 2);
    g.fillRect(23, 28, 4, 2);
    g.generateTexture('furn_bio_cabinet', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_fume_hood')) {
    const g = scene.add.graphics();
    const gray = 0x8a8a8a;
    const grayDark = darken(gray, 30);
    const grayLight = lighten(gray, 20);
    // Main structure
    g.fillStyle(gray);
    g.fillRect(4, 3, 24, 26);
    g.fillStyle(grayLight);
    g.fillRect(4, 3, 24, 1);
    g.fillRect(4, 3, 1, 26);
    g.fillStyle(grayDark);
    g.fillRect(27, 4, 1, 25);
    g.fillRect(5, 28, 22, 1);
    // Glass shield (translucent lighter area)
    g.fillStyle(0x99aabb);
    g.fillRect(6, 8, 20, 14);
    g.fillStyle(lighten(0x99aabb, 20));
    g.fillRect(6, 8, 20, 1);
    g.fillRect(6, 8, 1, 14);
    // Glass reflection
    g.fillStyle(lighten(0x99aabb, 35));
    g.fillRect(8, 9, 4, 2);
    // Vent at top
    g.fillStyle(grayDark);
    g.fillRect(6, 4, 20, 3);
    g.fillStyle(gray);
    g.fillRect(8, 5, 16, 1);
    // Work surface inside
    g.fillStyle(darken(gray, 15));
    g.fillRect(6, 22, 20, 3);
    // Interior items hint
    g.fillStyle(0x2980b9);
    g.fillRect(10, 18, 3, 4);
    g.fillStyle(0xe74c3c);
    g.fillRect(18, 19, 3, 3);
    // Base
    g.fillStyle(grayDark);
    g.fillRect(5, 29, 4, 2);
    g.fillRect(23, 29, 4, 2);
    g.generateTexture('furn_fume_hood', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_chemical_shelf')) {
    const g = scene.add.graphics();
    const wood = 0x8b7355;
    const woodDark = darken(wood, 30);
    const woodLight = lighten(wood, 25);
    // Shelf frame
    g.fillStyle(wood);
    g.fillRect(4, 4, 24, 24);
    g.fillStyle(woodLight);
    g.fillRect(4, 4, 1, 24);
    g.fillRect(4, 4, 24, 1);
    g.fillStyle(woodDark);
    g.fillRect(27, 5, 1, 23);
    g.fillRect(5, 27, 22, 1);
    // Shelf planks
    g.fillStyle(woodDark);
    g.fillRect(5, 11, 22, 2);
    g.fillRect(5, 19, 22, 2);
    // Top row bottles
    g.fillStyle(0x2980b9);
    g.fillRect(6, 6, 3, 5);
    g.fillStyle(0xe74c3c);
    g.fillRect(10, 7, 3, 4);
    g.fillStyle(0xf39c12);
    g.fillRect(14, 6, 3, 5);
    g.fillStyle(0x27ae60);
    g.fillRect(18, 7, 3, 4);
    g.fillStyle(0x9b59b6);
    g.fillRect(22, 6, 3, 5);
    // Middle row bottles
    g.fillStyle(0x1abc9c);
    g.fillRect(7, 13, 3, 6);
    g.fillStyle(0xe67e22);
    g.fillRect(12, 14, 2, 5);
    g.fillStyle(0x3498db);
    g.fillRect(16, 13, 4, 6);
    g.fillStyle(0xc0392b);
    g.fillRect(22, 14, 3, 5);
    // Bottom row — larger containers
    g.fillStyle(0xf5deb3);
    g.fillRect(6, 22, 5, 5);
    g.fillStyle(0xbdc3c7);
    g.fillRect(13, 21, 4, 6);
    g.fillStyle(0x7f8c8d);
    g.fillRect(20, 22, 5, 5);
    g.generateTexture('furn_chemical_shelf', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_sink_station')) {
    const g = scene.add.graphics();
    const counter = 0x95a5a6;
    const counterDark = darken(counter, 30);
    // Counter surface
    g.fillStyle(counter);
    g.fillRect(3, 14, 26, 3);
    g.fillStyle(lighten(counter, 20));
    g.fillRect(3, 14, 26, 1);
    g.fillStyle(counterDark);
    g.fillRect(28, 14, 1, 3);
    // Basin (white inset)
    g.fillStyle(0xffffff);
    g.fillRect(10, 15, 12, 5);
    g.fillStyle(0xe8e8e8);
    g.fillRect(21, 15, 1, 5);
    g.fillRect(11, 19, 10, 1);
    // Drain
    g.fillStyle(0xaaaaaa);
    g.fillRect(15, 18, 2, 2);
    // Faucet
    g.fillStyle(0xcccccc);
    g.fillRect(15, 8, 2, 7);
    g.fillStyle(0xdddddd);
    g.fillRect(15, 8, 1, 7);
    // Faucet spout
    g.fillStyle(0xcccccc);
    g.fillRect(13, 8, 6, 2);
    g.fillStyle(0xdddddd);
    g.fillRect(13, 8, 6, 1);
    // Faucet handles
    g.fillStyle(0xe53935);
    g.fillRect(11, 10, 2, 2);
    g.fillStyle(0x1e88e5);
    g.fillRect(19, 10, 2, 2);
    // Counter legs
    g.fillStyle(counterDark);
    g.fillRect(4, 17, 3, 11);
    g.fillRect(25, 17, 3, 11);
    g.generateTexture('furn_sink_station', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_eyewash_station')) {
    const g = scene.add.graphics();
    const yellow = 0xf9a825;
    const yellowDark = darken(yellow, 30);
    const yellowLight = lighten(yellow, 25);
    // Vertical pole
    g.fillStyle(0xaaaaaa);
    g.fillRect(15, 10, 2, 18);
    g.fillStyle(0xbbbbbb);
    g.fillRect(15, 10, 1, 18);
    // Bowl shape at top
    g.fillStyle(yellow);
    g.fillRect(8, 6, 16, 5);
    g.fillStyle(yellowLight);
    g.fillRect(8, 6, 16, 1);
    g.fillRect(8, 6, 1, 5);
    g.fillStyle(yellowDark);
    g.fillRect(23, 7, 1, 4);
    g.fillRect(9, 10, 14, 1);
    // Bowl interior
    g.fillStyle(lighten(yellow, 40));
    g.fillRect(10, 7, 12, 3);
    // Nozzles
    g.fillStyle(0xcccccc);
    g.fillRect(12, 5, 2, 2);
    g.fillRect(18, 5, 2, 2);
    // Emergency sign
    g.fillStyle(0x27ae60);
    g.fillRect(9, 2, 14, 3);
    g.fillStyle(0xffffff);
    g.fillRect(11, 3, 2, 1);
    g.fillRect(14, 3, 3, 1);
    g.fillRect(18, 3, 2, 1);
    // Base
    g.fillStyle(yellowDark);
    g.fillRect(10, 28, 12, 2);
    // Floor plate
    g.fillStyle(yellow);
    g.fillRect(8, 28, 16, 2);
    g.fillStyle(yellowDark);
    g.fillRect(8, 29, 16, 1);
    g.generateTexture('furn_eyewash_station', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_sample_rack')) {
    const g = scene.add.graphics();
    // Rack frame
    g.fillStyle(0xaaaaaa);
    g.fillRect(6, 16, 20, 3);
    g.fillStyle(0xbbbbbb);
    g.fillRect(6, 16, 20, 1);
    g.fillStyle(0x888888);
    g.fillRect(6, 18, 20, 1);
    // Rack legs
    g.fillStyle(0x999999);
    g.fillRect(7, 19, 2, 8);
    g.fillRect(23, 19, 2, 8);
    // Test tubes (colorful, standing upright)
    g.fillStyle(0xe74c3c);
    g.fillRect(8, 8, 2, 8);
    g.fillStyle(lighten(0xe74c3c, 30));
    g.fillRect(8, 8, 1, 6);
    g.fillStyle(0x3498db);
    g.fillRect(11, 9, 2, 7);
    g.fillStyle(lighten(0x3498db, 30));
    g.fillRect(11, 9, 1, 5);
    g.fillStyle(0xf39c12);
    g.fillRect(14, 8, 2, 8);
    g.fillStyle(lighten(0xf39c12, 30));
    g.fillRect(14, 8, 1, 6);
    g.fillStyle(0x27ae60);
    g.fillRect(17, 10, 2, 6);
    g.fillStyle(lighten(0x27ae60, 30));
    g.fillRect(17, 10, 1, 4);
    g.fillStyle(0x9b59b6);
    g.fillRect(20, 9, 2, 7);
    g.fillStyle(lighten(0x9b59b6, 30));
    g.fillRect(20, 9, 1, 5);
    g.fillStyle(0x1abc9c);
    g.fillRect(23, 8, 2, 8);
    g.fillStyle(lighten(0x1abc9c, 30));
    g.fillRect(23, 8, 1, 6);
    g.generateTexture('furn_sample_rack', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_autoclave')) {
    const g = scene.add.graphics();
    const steel = 0xb0b0b0;
    const steelDark = darken(steel, 30);
    const steelLight = lighten(steel, 20);
    // Main boxy body
    g.fillStyle(steel);
    g.fillRect(5, 8, 22, 18);
    g.fillStyle(steelLight);
    g.fillRect(5, 8, 22, 1);
    g.fillRect(5, 8, 1, 18);
    g.fillStyle(steelDark);
    g.fillRect(26, 9, 1, 17);
    g.fillRect(6, 25, 20, 1);
    // Round door/porthole
    g.fillStyle(0x888888);
    g.fillRect(10, 11, 10, 10);
    g.fillStyle(0x999999);
    g.fillRect(11, 12, 8, 8);
    // Porthole glass
    g.fillStyle(0x556677);
    g.fillRect(12, 13, 6, 6);
    g.fillStyle(lighten(0x556677, 25));
    g.fillRect(12, 13, 2, 2);
    // Door handle/latch
    g.fillStyle(0x666666);
    g.fillRect(22, 14, 3, 3);
    g.fillStyle(0x777777);
    g.fillRect(22, 14, 1, 3);
    // Pressure gauge (top right)
    g.fillStyle(0xffffff);
    g.fillRect(22, 9, 4, 4);
    g.fillStyle(0xe74c3c);
    g.fillRect(23, 10, 2, 1);
    g.fillStyle(0x333333);
    g.fillRect(24, 11, 1, 1);
    // Steam vent on top
    g.fillStyle(steelDark);
    g.fillRect(8, 6, 4, 3);
    g.fillStyle(0xdddddd);
    g.fillRect(9, 5, 2, 2);
    // Feet
    g.fillStyle(steelDark);
    g.fillRect(6, 26, 4, 2);
    g.fillRect(22, 26, 4, 2);
    g.generateTexture('furn_autoclave', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_results_board')) {
    const g = scene.add.graphics();
    // Board frame
    g.fillStyle(0x999999);
    g.fillRect(3, 4, 26, 22);
    g.fillStyle(0xbbbbbb);
    g.fillRect(3, 4, 26, 1);
    g.fillRect(3, 4, 1, 22);
    g.fillStyle(0x777777);
    g.fillRect(28, 5, 1, 21);
    g.fillRect(4, 25, 24, 1);
    // White board surface
    g.fillStyle(0xffffff);
    g.fillRect(5, 6, 22, 18);
    g.fillStyle(0xf5f5f5);
    g.fillRect(5, 20, 22, 4);
    // Posted result sheets
    g.fillStyle(0xfff8dc);
    g.fillRect(6, 7, 6, 8);
    g.fillStyle(darken(0xfff8dc, 15));
    g.fillRect(6, 14, 6, 1);
    g.fillStyle(0xe8f4f8);
    g.fillRect(13, 7, 6, 8);
    g.fillStyle(darken(0xe8f4f8, 15));
    g.fillRect(13, 14, 6, 1);
    g.fillStyle(0xf0fff0);
    g.fillRect(20, 7, 6, 8);
    g.fillStyle(darken(0xf0fff0, 15));
    g.fillRect(20, 14, 6, 1);
    // Text lines on sheets
    g.fillStyle(0x888888);
    g.fillRect(7, 9, 4, 1);
    g.fillRect(7, 11, 3, 1);
    g.fillRect(14, 9, 4, 1);
    g.fillRect(14, 11, 3, 1);
    g.fillRect(21, 9, 4, 1);
    g.fillRect(21, 11, 3, 1);
    // Pushpins
    g.fillStyle(0xe74c3c);
    g.fillRect(8, 7, 2, 2);
    g.fillStyle(0x2980b9);
    g.fillRect(15, 7, 2, 2);
    g.fillStyle(0x27ae60);
    g.fillRect(22, 7, 2, 2);
    // Bottom row of papers
    g.fillStyle(0xfff0e0);
    g.fillRect(7, 17, 8, 5);
    g.fillStyle(0xe0f0ff);
    g.fillRect(17, 17, 8, 5);
    g.generateTexture('furn_results_board', TILE, TILE);
    g.destroy();
  }

  // ── Shared/Common textures ──────────────────────────────────────────

  if (!scene.textures.exists('furn_vending_machine')) {
    const g = scene.add.graphics();
    const body = 0x3a3a4a;
    const bodyDark = darken(body, 25);
    const bodyLight = lighten(body, 20);
    // Main body
    g.fillStyle(body);
    g.fillRect(5, 2, 22, 28);
    g.fillStyle(bodyLight);
    g.fillRect(5, 2, 22, 1);
    g.fillRect(5, 2, 1, 28);
    g.fillStyle(bodyDark);
    g.fillRect(26, 3, 1, 27);
    g.fillRect(6, 29, 20, 1);
    // Illuminated product window (upper half)
    g.fillStyle(0xeeeedd);
    g.fillRect(7, 4, 18, 12);
    g.fillStyle(lighten(0xeeeedd, 10));
    g.fillRect(7, 4, 18, 1);
    // Product rows
    g.fillStyle(0xe74c3c);
    g.fillRect(8, 5, 4, 3);
    g.fillStyle(0x2980b9);
    g.fillRect(13, 5, 4, 3);
    g.fillStyle(0x27ae60);
    g.fillRect(18, 5, 4, 3);
    g.fillStyle(0xf39c12);
    g.fillRect(8, 9, 4, 3);
    g.fillStyle(0x9b59b6);
    g.fillRect(13, 9, 4, 3);
    g.fillStyle(0x1abc9c);
    g.fillRect(18, 9, 4, 3);
    g.fillStyle(0xe67e22);
    g.fillRect(8, 13, 4, 2);
    g.fillStyle(0x3498db);
    g.fillRect(13, 13, 4, 2);
    // Coin/button panel
    g.fillStyle(0x555555);
    g.fillRect(7, 17, 18, 5);
    // Buttons
    g.fillStyle(0xcccccc);
    g.fillRect(8, 18, 3, 3);
    g.fillRect(12, 18, 3, 3);
    g.fillRect(16, 18, 3, 3);
    // Coin slot
    g.fillStyle(0x888888);
    g.fillRect(21, 18, 2, 3);
    // Dispensing bay
    g.fillStyle(0x1a1a1a);
    g.fillRect(7, 23, 18, 5);
    g.fillStyle(0x2a2a2a);
    g.fillRect(7, 23, 18, 1);
    // Bay flap
    g.fillStyle(0x333333);
    g.fillRect(10, 26, 12, 1);
    g.generateTexture('furn_vending_machine', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_couch')) {
    const g = scene.add.graphics();
    const fabric = 0x6b5b73;
    const fabricDark = darken(fabric, 30);
    const fabricLight = lighten(fabric, 25);
    // Backrest
    g.fillStyle(darken(fabric, 10));
    g.fillRect(3, 8, 26, 7);
    g.fillStyle(fabricLight);
    g.fillRect(3, 8, 26, 1);
    g.fillRect(3, 8, 1, 7);
    g.fillStyle(fabricDark);
    g.fillRect(28, 9, 1, 6);
    // Seat cushions
    g.fillStyle(fabric);
    g.fillRect(3, 15, 26, 7);
    g.fillStyle(fabricLight);
    g.fillRect(3, 15, 26, 1);
    // Cushion divider
    g.fillStyle(fabricDark);
    g.fillRect(16, 15, 1, 7);
    // Armrests
    g.fillStyle(darken(fabric, 15));
    g.fillRect(1, 10, 3, 12);
    g.fillRect(28, 10, 3, 12);
    g.fillStyle(fabricLight);
    g.fillRect(1, 10, 3, 1);
    g.fillStyle(fabricDark);
    g.fillRect(1, 21, 3, 1);
    g.fillRect(28, 21, 3, 1);
    // Seat shadow
    g.fillStyle(fabricDark);
    g.fillRect(4, 21, 24, 1);
    // Base/feet
    g.fillStyle(0x444444);
    g.fillRect(3, 22, 4, 4);
    g.fillRect(25, 22, 4, 4);
    g.fillStyle(0x555555);
    g.fillRect(3, 22, 4, 1);
    g.fillRect(25, 22, 4, 1);
    g.generateTexture('furn_couch', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_coffee_station')) {
    const g = scene.add.graphics();
    const counter = 0xa0826d;
    const counterDark = darken(counter, 30);
    // Counter surface
    g.fillStyle(counter);
    g.fillRect(2, 16, 28, 3);
    g.fillStyle(lighten(counter, 20));
    g.fillRect(2, 16, 28, 1);
    g.fillStyle(counterDark);
    g.fillRect(29, 16, 1, 3);
    // Counter front
    g.fillStyle(darken(counter, 15));
    g.fillRect(3, 19, 26, 8);
    g.fillStyle(counterDark);
    g.fillRect(28, 19, 1, 8);
    g.fillRect(4, 26, 24, 1);
    // Coffee maker body
    g.fillStyle(0x2a2a2a);
    g.fillRect(4, 8, 10, 8);
    g.fillStyle(0x3a3a3a);
    g.fillRect(4, 8, 10, 1);
    g.fillRect(4, 8, 1, 8);
    // Coffee pot
    g.fillStyle(0x444444);
    g.fillRect(5, 12, 8, 4);
    g.fillStyle(0x663300);
    g.fillRect(6, 13, 6, 2);
    // Power light
    g.fillStyle(0xff0000);
    g.fillRect(12, 9, 1, 1);
    // Mug 1
    g.fillStyle(0xffffff);
    g.fillRect(17, 12, 4, 4);
    g.fillStyle(0xeeeeee);
    g.fillRect(20, 12, 1, 4);
    // Mug handle
    g.fillStyle(0xdddddd);
    g.fillRect(21, 13, 1, 2);
    // Mug 2
    g.fillStyle(0xe74c3c);
    g.fillRect(23, 13, 4, 3);
    g.fillStyle(darken(0xe74c3c, 20));
    g.fillRect(26, 13, 1, 3);
    // Legs
    g.fillStyle(counterDark);
    g.fillRect(4, 27, 3, 3);
    g.fillRect(25, 27, 3, 3);
    g.generateTexture('furn_coffee_station', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_server_rack')) {
    const g = scene.add.graphics();
    const metal = 0x2a2a2a;
    const metalDark = darken(metal, 20);
    const metalLight = lighten(metal, 20);
    // Main rack body
    g.fillStyle(metal);
    g.fillRect(6, 2, 20, 28);
    g.fillStyle(metalLight);
    g.fillRect(6, 2, 20, 1);
    g.fillRect(6, 2, 1, 28);
    g.fillStyle(metalDark);
    g.fillRect(25, 3, 1, 27);
    g.fillRect(7, 29, 18, 1);
    // Server unit rows with LEDs
    const unitYs = [4, 9, 14, 19, 24];
    for (const uy of unitYs) {
      // Unit panel
      g.fillStyle(0x3a3a3a);
      g.fillRect(8, uy, 16, 4);
      g.fillStyle(0x444444);
      g.fillRect(8, uy, 16, 1);
      // Ventilation slots
      g.fillStyle(0x222222);
      g.fillRect(9, uy + 2, 8, 1);
    }
    // Blinking LEDs (green and amber)
    g.fillStyle(0x00ff00);
    g.fillRect(20, 5, 1, 1);
    g.fillRect(20, 10, 1, 1);
    g.fillRect(20, 20, 1, 1);
    g.fillStyle(0xffaa00);
    g.fillRect(22, 5, 1, 1);
    g.fillRect(22, 15, 1, 1);
    g.fillRect(22, 25, 1, 1);
    g.fillStyle(0x00ff00);
    g.fillRect(20, 15, 1, 1);
    g.fillRect(20, 25, 1, 1);
    g.fillStyle(0xff0000);
    g.fillRect(22, 10, 1, 1);
    g.fillRect(22, 20, 1, 1);
    g.generateTexture('furn_server_rack', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_monitor_bank')) {
    const g = scene.add.graphics();
    // Three small screens side by side
    const screenXs = [2, 12, 22];
    for (const sx of screenXs) {
      // Monitor housing
      g.fillStyle(0x2a2a2a);
      g.fillRect(sx, 5, 8, 10);
      g.fillStyle(0x3a3a3a);
      g.fillRect(sx, 5, 8, 1);
      // Screen
      g.fillStyle(0x1a2a3a);
      g.fillRect(sx + 1, 6, 6, 8);
    }
    // Screen content (data)
    g.fillStyle(0x2ecc71);
    g.fillRect(3, 7, 4, 1);
    g.fillRect(3, 9, 3, 1);
    g.fillStyle(0x3498db);
    g.fillRect(13, 7, 5, 1);
    g.fillRect(13, 10, 3, 1);
    g.fillStyle(0xf39c12);
    g.fillRect(23, 8, 4, 1);
    g.fillRect(23, 11, 5, 1);
    // Stands
    g.fillStyle(0x444444);
    g.fillRect(4, 15, 4, 2);
    g.fillRect(14, 15, 4, 2);
    g.fillRect(24, 15, 4, 2);
    // Shared base/desk
    g.fillStyle(0x555555);
    g.fillRect(2, 17, 28, 3);
    g.fillStyle(0x666666);
    g.fillRect(2, 17, 28, 1);
    g.fillStyle(0x444444);
    g.fillRect(2, 19, 28, 1);
    // Power LEDs
    g.fillStyle(0x00ff00);
    g.fillRect(5, 14, 1, 1);
    g.fillRect(15, 14, 1, 1);
    g.fillRect(25, 14, 1, 1);
    g.generateTexture('furn_monitor_bank', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_workstation_cluster')) {
    const g = scene.add.graphics();
    const desk = 0x8b7355;
    const deskDark = darken(desk, 30);
    // Desk surface
    g.fillStyle(desk);
    g.fillRect(2, 16, 28, 3);
    g.fillStyle(lighten(desk, 20));
    g.fillRect(2, 16, 28, 1);
    g.fillStyle(deskDark);
    g.fillRect(29, 16, 1, 3);
    // Front panel
    g.fillStyle(darken(desk, 15));
    g.fillRect(3, 19, 26, 8);
    g.fillStyle(deskDark);
    g.fillRect(28, 19, 1, 8);
    // Two monitors
    g.fillStyle(0x2a2a2a);
    g.fillRect(3, 6, 12, 10);
    g.fillRect(17, 6, 12, 10);
    g.fillStyle(0x333333);
    g.fillRect(3, 6, 12, 1);
    g.fillRect(17, 6, 12, 1);
    // Screens
    g.fillStyle(0x1a3a2a);
    g.fillRect(4, 7, 10, 8);
    g.fillRect(18, 7, 10, 8);
    // Screen content
    g.fillStyle(0x2ecc71);
    g.fillRect(5, 8, 6, 1);
    g.fillRect(5, 10, 4, 1);
    g.fillStyle(0x3498db);
    g.fillRect(19, 8, 7, 1);
    g.fillRect(19, 11, 5, 1);
    // Keyboard shape
    g.fillStyle(0x444444);
    g.fillRect(8, 17, 16, 2);
    g.fillStyle(0x555555);
    g.fillRect(8, 17, 16, 1);
    // Legs
    g.fillStyle(deskDark);
    g.fillRect(4, 27, 3, 3);
    g.fillRect(25, 27, 3, 3);
    g.generateTexture('furn_workstation_cluster', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_whiteboard_wall')) {
    const g = scene.add.graphics();
    // Wider board frame
    g.fillStyle(0x999999);
    g.fillRect(1, 3, 30, 22);
    g.fillStyle(0xbbbbbb);
    g.fillRect(1, 3, 30, 1);
    g.fillRect(1, 3, 1, 22);
    g.fillStyle(0x777777);
    g.fillRect(30, 4, 1, 21);
    g.fillRect(2, 24, 28, 1);
    // White surface
    g.fillStyle(0xffffff);
    g.fillRect(3, 5, 26, 18);
    g.fillStyle(0xf0f0f0);
    g.fillRect(3, 19, 26, 4);
    // Diagram — box with connections
    g.fillStyle(0xe74c3c);
    g.fillRect(5, 7, 6, 4);
    g.fillStyle(0x2980b9);
    g.fillRect(5, 14, 6, 4);
    // Connection lines
    g.fillStyle(0x333333);
    g.fillRect(11, 9, 4, 1);
    g.fillRect(11, 16, 4, 1);
    g.fillRect(14, 9, 1, 8);
    // Notes text
    g.fillStyle(0x27ae60);
    g.fillRect(17, 7, 8, 1);
    g.fillRect(17, 9, 6, 1);
    g.fillRect(17, 11, 10, 1);
    g.fillRect(17, 14, 7, 1);
    g.fillRect(17, 16, 9, 1);
    // Tray at bottom
    g.fillStyle(0x888888);
    g.fillRect(3, 23, 26, 2);
    g.fillStyle(0x999999);
    g.fillRect(3, 23, 26, 1);
    // Markers
    g.fillStyle(0xe74c3c);
    g.fillRect(6, 23, 4, 1);
    g.fillStyle(0x2980b9);
    g.fillRect(12, 23, 4, 1);
    g.fillStyle(0x27ae60);
    g.fillRect(18, 23, 4, 1);
    g.generateTexture('furn_whiteboard_wall', TILE, TILE);
    g.destroy();
  }

  // ── Room-specific textures ──────────────────────────────────────────

  if (!scene.textures.exists('furn_privacy_screen')) {
    const g = scene.add.graphics();
    const panel = 0xb0c4de;
    const panelDark = darken(panel, 25);
    const panelLight = lighten(panel, 20);
    // Panel body (frosted/translucent feel)
    g.fillStyle(panel);
    g.fillRect(4, 5, 24, 18);
    g.fillStyle(panelLight);
    g.fillRect(4, 5, 24, 1);
    g.fillRect(4, 5, 1, 18);
    g.fillStyle(panelDark);
    g.fillRect(27, 6, 1, 17);
    g.fillRect(5, 22, 22, 1);
    // Frosted glass effect (lighter streaks)
    g.fillStyle(lighten(panel, 35));
    g.fillRect(8, 7, 2, 14);
    g.fillRect(15, 7, 2, 14);
    g.fillRect(22, 7, 2, 14);
    // Frame top edge
    g.fillStyle(0x888888);
    g.fillRect(4, 4, 24, 2);
    g.fillStyle(0xaaaaaa);
    g.fillRect(4, 4, 24, 1);
    // Frame bottom edge
    g.fillStyle(0x888888);
    g.fillRect(4, 22, 24, 2);
    // Short legs
    g.fillStyle(0x777777);
    g.fillRect(6, 24, 3, 5);
    g.fillRect(23, 24, 3, 5);
    g.fillStyle(0x888888);
    g.fillRect(6, 24, 1, 5);
    g.fillRect(23, 24, 1, 5);
    g.generateTexture('furn_privacy_screen', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_notice_board')) {
    const g = scene.add.graphics();
    // Cork background
    g.fillStyle(0xc09060);
    g.fillRect(4, 4, 24, 20);
    g.fillStyle(lighten(0xc09060, 15));
    g.fillRect(4, 4, 24, 1);
    g.fillRect(4, 4, 1, 20);
    g.fillStyle(darken(0xc09060, 20));
    g.fillRect(27, 5, 1, 19);
    g.fillRect(5, 23, 22, 1);
    // Frame
    g.fillStyle(0x6d4c2a);
    g.fillRect(3, 3, 26, 1);
    g.fillRect(3, 24, 26, 1);
    g.fillRect(3, 3, 1, 22);
    g.fillRect(28, 3, 1, 22);
    // Pinned papers
    g.fillStyle(0xfff8dc);
    g.fillRect(6, 6, 7, 5);
    g.fillStyle(0xe8f4f8);
    g.fillRect(15, 7, 6, 6);
    g.fillStyle(0xffe0e0);
    g.fillRect(7, 13, 8, 5);
    g.fillStyle(0xe0ffe0);
    g.fillRect(17, 15, 7, 5);
    g.fillStyle(0xfff0d0);
    g.fillRect(23, 6, 4, 4);
    // Pushpins
    g.fillStyle(0xe74c3c);
    g.fillRect(8, 6, 2, 2);
    g.fillStyle(0x2980b9);
    g.fillRect(17, 7, 2, 2);
    g.fillStyle(0xf39c12);
    g.fillRect(10, 13, 2, 2);
    g.fillStyle(0x27ae60);
    g.fillRect(19, 15, 2, 2);
    g.generateTexture('furn_notice_board', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_magazine_rack')) {
    const g = scene.add.graphics();
    // Wire frame
    g.fillStyle(0x888888);
    g.fillRect(7, 6, 2, 22);
    g.fillRect(23, 6, 2, 22);
    g.fillRect(7, 6, 18, 2);
    g.fillRect(7, 15, 18, 1);
    g.fillRect(7, 22, 18, 1);
    g.fillStyle(0xaaaaaa);
    g.fillRect(7, 6, 18, 1);
    // Magazine spines/covers top row
    g.fillStyle(0xe74c3c);
    g.fillRect(10, 8, 3, 7);
    g.fillStyle(0x2980b9);
    g.fillRect(14, 8, 3, 7);
    g.fillStyle(0xf39c12);
    g.fillRect(18, 8, 3, 7);
    // Magazine highlight
    g.fillStyle(lighten(0xe74c3c, 30));
    g.fillRect(10, 8, 1, 1);
    g.fillStyle(lighten(0x2980b9, 30));
    g.fillRect(14, 8, 1, 1);
    // Bottom row
    g.fillStyle(0x9b59b6);
    g.fillRect(10, 16, 3, 6);
    g.fillStyle(0x27ae60);
    g.fillRect(14, 16, 3, 6);
    g.fillStyle(0x1abc9c);
    g.fillRect(18, 16, 3, 6);
    // Feet
    g.fillStyle(0x666666);
    g.fillRect(7, 28, 4, 2);
    g.fillRect(21, 28, 4, 2);
    g.generateTexture('furn_magazine_rack', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_water_dispenser')) {
    const g = scene.add.graphics();
    // Reuse water cooler pattern but slightly different
    // Base cabinet
    g.fillStyle(0xeeeeee);
    g.fillRect(10, 18, 12, 10);
    g.fillStyle(0xdddddd);
    g.fillRect(21, 18, 1, 10);
    g.fillRect(11, 27, 10, 1);
    // Dispenser body
    g.fillStyle(0xf5f5f5);
    g.fillRect(11, 8, 10, 10);
    g.fillStyle(lighten(0xf5f5f5, 5));
    g.fillRect(11, 8, 10, 1);
    g.fillRect(11, 8, 1, 10);
    // Water bottle (blue tint)
    g.fillStyle(0x64b5f6);
    g.fillRect(13, 1, 6, 8);
    g.fillStyle(0x90caf9);
    g.fillRect(13, 1, 2, 7);
    // Bottle cap
    g.fillStyle(0x1565c0);
    g.fillRect(14, 0, 4, 2);
    // Spigots
    g.fillStyle(0xe53935);
    g.fillRect(12, 13, 3, 2);
    g.fillStyle(0x1e88e5);
    g.fillRect(17, 13, 3, 2);
    // Drip tray
    g.fillStyle(0xbdbdbd);
    g.fillRect(11, 16, 10, 2);
    g.generateTexture('furn_water_dispenser', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_info_kiosk')) {
    const g = scene.add.graphics();
    const base = 0x555555;
    const baseDark = darken(base, 25);
    const baseLight = lighten(base, 20);
    // Pedestal
    g.fillStyle(base);
    g.fillRect(12, 14, 8, 14);
    g.fillStyle(baseLight);
    g.fillRect(12, 14, 1, 14);
    g.fillStyle(baseDark);
    g.fillRect(19, 14, 1, 14);
    // Base plate
    g.fillStyle(baseDark);
    g.fillRect(8, 28, 16, 2);
    g.fillStyle(base);
    g.fillRect(8, 28, 16, 1);
    // Angled screen housing
    g.fillStyle(0x2a2a2a);
    g.fillRect(6, 3, 20, 12);
    g.fillStyle(0x3a3a3a);
    g.fillRect(6, 3, 20, 1);
    g.fillRect(6, 3, 1, 12);
    g.fillStyle(0x1a1a1a);
    g.fillRect(25, 4, 1, 11);
    // Screen (glowing)
    g.fillStyle(0x2980b9);
    g.fillRect(8, 5, 16, 8);
    g.fillStyle(lighten(0x2980b9, 25));
    g.fillRect(9, 6, 14, 6);
    // Screen content
    g.fillStyle(0xffffff);
    g.fillRect(10, 7, 8, 1);
    g.fillRect(10, 9, 6, 1);
    g.fillRect(10, 11, 10, 1);
    // Screen glow effect
    g.fillStyle(lighten(0x2980b9, 40));
    g.fillRect(8, 5, 2, 1);
    g.generateTexture('furn_info_kiosk', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_welcome_mat')) {
    const g = scene.add.graphics();
    // Mat body (dark green/brown)
    const mat = 0x4a6b3a;
    const matDark = darken(mat, 25);
    const matLight = lighten(mat, 20);
    g.fillStyle(mat);
    g.fillRect(4, 12, 24, 10);
    // Lighter border
    g.fillStyle(matLight);
    g.fillRect(4, 12, 24, 1);
    g.fillRect(4, 12, 1, 10);
    g.fillRect(4, 21, 24, 1);
    g.fillRect(27, 12, 1, 10);
    // Inner border
    g.fillStyle(matDark);
    g.fillRect(6, 14, 20, 6);
    // Textured center
    g.fillStyle(mat);
    g.fillRect(7, 15, 18, 4);
    // Text hint (light marks)
    g.fillStyle(matLight);
    g.fillRect(9, 16, 3, 1);
    g.fillRect(13, 16, 5, 1);
    g.fillRect(19, 16, 4, 1);
    // Shadow beneath
    g.fillStyle(darken(mat, 40));
    g.fillRect(5, 22, 23, 1);
    g.generateTexture('furn_welcome_mat', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_bulletin_board')) {
    const g = scene.add.graphics();
    // Cork background (larger)
    g.fillStyle(0xc09060);
    g.fillRect(2, 3, 28, 24);
    g.fillStyle(lighten(0xc09060, 15));
    g.fillRect(2, 3, 28, 1);
    g.fillRect(2, 3, 1, 24);
    g.fillStyle(darken(0xc09060, 20));
    g.fillRect(29, 4, 1, 23);
    g.fillRect(3, 26, 26, 1);
    // Frame
    g.fillStyle(0x5d3c1a);
    g.fillRect(1, 2, 30, 1);
    g.fillRect(1, 27, 30, 1);
    g.fillRect(1, 2, 1, 26);
    g.fillRect(30, 2, 1, 26);
    // Pinned papers (various colors)
    g.fillStyle(0xfff8dc);
    g.fillRect(4, 5, 8, 6);
    g.fillStyle(0xe8f4f8);
    g.fillRect(14, 4, 7, 7);
    g.fillStyle(0xffe0e0);
    g.fillRect(23, 5, 5, 5);
    g.fillStyle(0xe0ffe0);
    g.fillRect(5, 13, 6, 7);
    g.fillStyle(0xfff0d0);
    g.fillRect(13, 14, 8, 6);
    g.fillStyle(0xf0e0ff);
    g.fillRect(23, 12, 5, 8);
    g.fillStyle(0xffe8d0);
    g.fillRect(4, 22, 7, 4);
    g.fillStyle(0xd0e8ff);
    g.fillRect(14, 22, 6, 4);
    // Pushpins
    g.fillStyle(0xe74c3c);
    g.fillRect(6, 5, 2, 2);
    g.fillRect(14, 14, 2, 2);
    g.fillStyle(0x2980b9);
    g.fillRect(16, 4, 2, 2);
    g.fillRect(7, 22, 2, 2);
    g.fillStyle(0xf39c12);
    g.fillRect(24, 5, 2, 2);
    g.fillRect(24, 12, 2, 2);
    g.fillStyle(0x27ae60);
    g.fillRect(7, 13, 2, 2);
    g.generateTexture('furn_bulletin_board', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_flower_arrangement')) {
    const g = scene.add.graphics();
    // Vase
    const vase = 0x5b9bd5;
    g.fillStyle(vase);
    g.fillRect(11, 18, 10, 10);
    g.fillStyle(lighten(vase, 25));
    g.fillRect(11, 18, 2, 9);
    g.fillStyle(darken(vase, 25));
    g.fillRect(20, 18, 1, 10);
    g.fillRect(12, 27, 8, 1);
    // Vase rim
    g.fillStyle(lighten(vase, 15));
    g.fillRect(10, 17, 12, 2);
    // Stems
    g.fillStyle(0x2e7d32);
    g.fillRect(14, 10, 1, 8);
    g.fillRect(17, 9, 1, 9);
    g.fillRect(11, 12, 1, 6);
    g.fillRect(20, 11, 1, 7);
    // Flower blooms
    g.fillStyle(0xe74c3c);
    g.fillRect(12, 7, 4, 4);
    g.fillStyle(lighten(0xe74c3c, 30));
    g.fillRect(13, 8, 2, 2);
    g.fillStyle(0xf39c12);
    g.fillRect(16, 6, 3, 4);
    g.fillStyle(lighten(0xf39c12, 30));
    g.fillRect(17, 7, 1, 2);
    g.fillStyle(0x9b59b6);
    g.fillRect(9, 9, 4, 4);
    g.fillStyle(lighten(0x9b59b6, 30));
    g.fillRect(10, 10, 2, 2);
    g.fillStyle(0xff69b4);
    g.fillRect(19, 8, 3, 4);
    g.fillStyle(lighten(0xff69b4, 25));
    g.fillRect(20, 9, 1, 2);
    // Leaf
    g.fillStyle(0x4caf50);
    g.fillRect(12, 14, 3, 2);
    g.fillRect(18, 13, 3, 2);
    g.generateTexture('furn_flower_arrangement', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_hand_sanitizer')) {
    const g = scene.add.graphics();
    // Wall mount bracket
    g.fillStyle(0xcccccc);
    g.fillRect(10, 6, 12, 3);
    g.fillStyle(0xdddddd);
    g.fillRect(10, 6, 12, 1);
    // Dispenser body
    g.fillStyle(0xf0f0f0);
    g.fillRect(11, 9, 10, 14);
    g.fillStyle(0xfafafa);
    g.fillRect(11, 9, 10, 1);
    g.fillRect(11, 9, 1, 14);
    g.fillStyle(0xdddddd);
    g.fillRect(20, 10, 1, 13);
    g.fillRect(12, 22, 8, 1);
    // Blue gel window
    g.fillStyle(0x2196f3);
    g.fillRect(13, 12, 6, 6);
    g.fillStyle(lighten(0x2196f3, 30));
    g.fillRect(13, 12, 2, 4);
    // Push lever
    g.fillStyle(0xaaaaaa);
    g.fillRect(12, 23, 8, 2);
    g.fillStyle(0xbbbbbb);
    g.fillRect(12, 23, 8, 1);
    // Drip
    g.fillStyle(0x90caf9);
    g.fillRect(15, 26, 2, 2);
    g.generateTexture('furn_hand_sanitizer', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_umbrella_stand')) {
    const g = scene.add.graphics();
    // Container body (dark cylinder)
    const cyl = 0x4a4a4a;
    g.fillStyle(cyl);
    g.fillRect(10, 12, 12, 16);
    g.fillStyle(lighten(cyl, 20));
    g.fillRect(10, 12, 1, 16);
    g.fillStyle(darken(cyl, 20));
    g.fillRect(21, 12, 1, 16);
    g.fillRect(11, 27, 10, 1);
    // Rim
    g.fillStyle(0x666666);
    g.fillRect(9, 11, 14, 2);
    g.fillStyle(0x777777);
    g.fillRect(9, 11, 14, 1);
    // Umbrella handles poking out
    g.fillStyle(0x2980b9);
    g.fillRect(12, 4, 2, 8);
    g.fillRect(11, 4, 4, 2);
    g.fillStyle(0xe74c3c);
    g.fillRect(18, 6, 2, 6);
    g.fillRect(17, 6, 4, 2);
    g.fillStyle(0x333333);
    g.fillRect(15, 5, 2, 7);
    g.fillRect(14, 5, 4, 2);
    g.generateTexture('furn_umbrella_stand', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_microwave')) {
    const g = scene.add.graphics();
    const body = 0xaaaaaa;
    const bodyDark = darken(body, 30);
    const bodyLight = lighten(body, 20);
    // Main body
    g.fillStyle(body);
    g.fillRect(4, 10, 24, 14);
    g.fillStyle(bodyLight);
    g.fillRect(4, 10, 24, 1);
    g.fillRect(4, 10, 1, 14);
    g.fillStyle(bodyDark);
    g.fillRect(27, 11, 1, 13);
    g.fillRect(5, 23, 22, 1);
    // Dark window
    g.fillStyle(0x1a1a1a);
    g.fillRect(6, 12, 14, 10);
    g.fillStyle(0x2a2a2a);
    g.fillRect(6, 12, 14, 1);
    // Interior hint
    g.fillStyle(0x222222);
    g.fillRect(7, 13, 12, 8);
    // Turntable
    g.fillStyle(0x333333);
    g.fillRect(10, 18, 6, 2);
    // Button panel (right side)
    g.fillStyle(0x888888);
    g.fillRect(21, 12, 5, 10);
    // Buttons
    g.fillStyle(0xcccccc);
    g.fillRect(22, 13, 3, 2);
    g.fillRect(22, 16, 3, 2);
    g.fillRect(22, 19, 3, 2);
    // Display
    g.fillStyle(0x00ff00);
    g.fillRect(22, 13, 2, 1);
    // Handle
    g.fillStyle(bodyLight);
    g.fillRect(20, 13, 1, 8);
    // Feet
    g.fillStyle(bodyDark);
    g.fillRect(5, 24, 3, 2);
    g.fillRect(24, 24, 3, 2);
    g.generateTexture('furn_microwave', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_open_fridge')) {
    const g = scene.add.graphics();
    const white = 0xf0f0f0;
    const whiteDark = darken(white, 25);
    // Main body
    g.fillStyle(white);
    g.fillRect(6, 3, 18, 26);
    g.fillStyle(lighten(white, 10));
    g.fillRect(6, 3, 18, 1);
    g.fillRect(6, 3, 1, 26);
    g.fillStyle(whiteDark);
    g.fillRect(23, 4, 1, 25);
    g.fillRect(7, 28, 16, 1);
    // Interior (slightly open door showing shelves)
    g.fillStyle(0xe8e8e8);
    g.fillRect(8, 5, 14, 22);
    // Shelves
    g.fillStyle(whiteDark);
    g.fillRect(8, 10, 14, 1);
    g.fillRect(8, 16, 14, 1);
    g.fillRect(8, 22, 14, 1);
    // Food items on shelves
    g.fillStyle(0x27ae60);
    g.fillRect(9, 6, 4, 4);
    g.fillStyle(0xe74c3c);
    g.fillRect(15, 7, 3, 3);
    g.fillStyle(0xf39c12);
    g.fillRect(10, 12, 5, 4);
    g.fillStyle(0x2980b9);
    g.fillRect(17, 11, 3, 5);
    g.fillStyle(0xffffff);
    g.fillRect(9, 18, 4, 4);
    g.fillStyle(0x9b59b6);
    g.fillRect(15, 17, 5, 5);
    // Handle
    g.fillStyle(0x888888);
    g.fillRect(22, 10, 2, 8);
    g.fillStyle(0xaaaaaa);
    g.fillRect(22, 10, 1, 8);
    // Feet
    g.fillStyle(0x666666);
    g.fillRect(7, 29, 3, 2);
    g.fillRect(20, 29, 3, 2);
    g.generateTexture('furn_open_fridge', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_tv_stand')) {
    const g = scene.add.graphics();
    // Stand/shelf unit
    const wood = 0x6d5535;
    const woodDark = darken(wood, 25);
    g.fillStyle(wood);
    g.fillRect(4, 18, 24, 10);
    g.fillStyle(lighten(wood, 20));
    g.fillRect(4, 18, 24, 1);
    g.fillRect(4, 18, 1, 10);
    g.fillStyle(woodDark);
    g.fillRect(27, 19, 1, 9);
    g.fillRect(5, 27, 22, 1);
    // Shelf divider
    g.fillStyle(woodDark);
    g.fillRect(5, 23, 22, 1);
    // TV body (CRT style)
    g.fillStyle(0x2a2a2a);
    g.fillRect(7, 4, 18, 14);
    g.fillStyle(0x3a3a3a);
    g.fillRect(7, 4, 18, 1);
    g.fillRect(7, 4, 1, 14);
    g.fillStyle(0x1a1a1a);
    g.fillRect(24, 5, 1, 13);
    // Screen
    g.fillStyle(0x1a3a5a);
    g.fillRect(9, 6, 14, 10);
    g.fillStyle(0x2980b9);
    g.fillRect(10, 7, 12, 8);
    // Screen content hint
    g.fillStyle(0x3498db);
    g.fillRect(11, 8, 8, 1);
    g.fillRect(11, 10, 6, 1);
    g.fillRect(11, 13, 10, 1);
    // Power LED
    g.fillStyle(0x00ff00);
    g.fillRect(22, 16, 1, 1);
    // DVD/items on lower shelf
    g.fillStyle(0x555555);
    g.fillRect(8, 24, 6, 3);
    g.generateTexture('furn_tv_stand', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_lost_and_found_box')) {
    const g = scene.add.graphics();
    // Cardboard box
    const cardboard = 0xb8956a;
    const cardDark = darken(cardboard, 25);
    const cardLight = lighten(cardboard, 20);
    g.fillStyle(cardboard);
    g.fillRect(5, 12, 22, 16);
    g.fillStyle(cardLight);
    g.fillRect(5, 12, 22, 1);
    g.fillRect(5, 12, 1, 16);
    g.fillStyle(cardDark);
    g.fillRect(26, 13, 1, 15);
    g.fillRect(6, 27, 20, 1);
    // Box flaps (open)
    g.fillStyle(cardboard);
    g.fillRect(4, 10, 6, 3);
    g.fillRect(22, 10, 6, 3);
    g.fillStyle(cardLight);
    g.fillRect(4, 10, 6, 1);
    g.fillRect(22, 10, 6, 1);
    // Label on front
    g.fillStyle(0xffffff);
    g.fillRect(10, 18, 12, 5);
    g.fillStyle(0x333333);
    g.fillRect(11, 19, 4, 1);
    g.fillRect(11, 21, 8, 1);
    // Items poking out
    g.fillStyle(0x2980b9);
    g.fillRect(8, 8, 4, 4);
    g.fillStyle(0xe74c3c);
    g.fillRect(15, 7, 3, 5);
    g.fillStyle(0xf39c12);
    g.fillRect(20, 9, 3, 3);
    g.generateTexture('furn_lost_and_found_box', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_coat_rack')) {
    const g = scene.add.graphics();
    // Vertical pole
    const pole = 0x6d4c2a;
    g.fillStyle(pole);
    g.fillRect(15, 6, 2, 22);
    g.fillStyle(lighten(pole, 20));
    g.fillRect(15, 6, 1, 22);
    g.fillStyle(darken(pole, 20));
    g.fillRect(16, 6, 1, 22);
    // Top knob
    g.fillStyle(lighten(pole, 15));
    g.fillRect(14, 4, 4, 3);
    // Hooks
    g.fillStyle(0xaaaaaa);
    g.fillRect(10, 8, 5, 2);
    g.fillRect(17, 8, 5, 2);
    g.fillRect(11, 13, 4, 2);
    g.fillRect(17, 13, 4, 2);
    // Coat hanging on one hook
    g.fillStyle(0x2c3e50);
    g.fillRect(6, 10, 5, 10);
    g.fillStyle(darken(0x2c3e50, 20));
    g.fillRect(10, 10, 1, 10);
    g.fillStyle(lighten(0x2c3e50, 15));
    g.fillRect(6, 10, 1, 8);
    // Hat on top hook
    g.fillStyle(0x8b4513);
    g.fillRect(18, 7, 6, 2);
    g.fillRect(19, 5, 4, 2);
    // Base (tripod)
    g.fillStyle(darken(pole, 15));
    g.fillRect(10, 28, 12, 2);
    g.fillRect(13, 26, 6, 2);
    g.generateTexture('furn_coat_rack', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_records_counter')) {
    const g = scene.add.graphics();
    const wood = 0x8b6f47;
    const woodDark = darken(wood, 30);
    const woodLight = lighten(wood, 25);
    // Counter top
    g.fillStyle(wood);
    g.fillRect(1, 10, 30, 3);
    g.fillStyle(woodLight);
    g.fillRect(1, 10, 30, 1);
    g.fillStyle(woodDark);
    g.fillRect(1, 12, 30, 1);
    // Front panel
    g.fillStyle(darken(wood, 15));
    g.fillRect(2, 13, 28, 14);
    g.fillStyle(woodDark);
    g.fillRect(29, 13, 1, 14);
    g.fillRect(3, 26, 26, 1);
    // Service window opening (upper portion cutout)
    g.fillStyle(lighten(wood, 35));
    g.fillRect(8, 3, 16, 8);
    g.fillStyle(woodDark);
    g.fillRect(8, 3, 16, 1);
    g.fillRect(8, 3, 1, 8);
    g.fillRect(23, 3, 1, 8);
    // Counter divider
    g.fillStyle(woodDark);
    g.fillRect(2, 19, 28, 1);
    // Drawer handles
    g.fillStyle(0xdaa520);
    g.fillRect(14, 15, 4, 1);
    g.fillRect(14, 22, 4, 1);
    // RECORDS label area
    g.fillStyle(0xffffff);
    g.fillRect(10, 5, 12, 3);
    g.fillStyle(0x333333);
    g.fillRect(11, 6, 10, 1);
    g.generateTexture('furn_records_counter', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_clerk_desk')) {
    const g = scene.add.graphics();
    const wood = 0x8b6f47;
    const woodDark = darken(wood, 30);
    const woodLight = lighten(wood, 25);
    // Desktop
    g.fillStyle(wood);
    g.fillRect(3, 12, 26, 4);
    g.fillStyle(woodLight);
    g.fillRect(3, 12, 26, 1);
    g.fillStyle(woodDark);
    g.fillRect(4, 15, 25, 1);
    // Front panel
    g.fillStyle(darken(wood, 15));
    g.fillRect(4, 16, 24, 8);
    g.fillStyle(woodDark);
    g.fillRect(27, 16, 1, 8);
    g.fillRect(5, 23, 22, 1);
    // Drawer line
    g.fillStyle(woodDark);
    g.fillRect(4, 19, 24, 1);
    // Drawer handle
    g.fillStyle(0xdaa520);
    g.fillRect(14, 21, 4, 1);
    // Paper stacks on desk
    g.fillStyle(0xfff8dc);
    g.fillRect(5, 8, 6, 4);
    g.fillStyle(darken(0xfff8dc, 15));
    g.fillRect(5, 11, 6, 1);
    g.fillStyle(0xffffff);
    g.fillRect(5, 9, 6, 1);
    // More papers
    g.fillStyle(0xe8f4f8);
    g.fillRect(13, 9, 5, 3);
    // Desk lamp
    g.fillStyle(0x333333);
    g.fillRect(22, 10, 1, 3);
    g.fillStyle(0x444444);
    g.fillRect(20, 7, 5, 3);
    g.fillStyle(0xf39c12);
    g.fillRect(21, 8, 3, 1);
    // Legs
    g.fillStyle(woodDark);
    g.fillRect(5, 24, 3, 5);
    g.fillRect(24, 24, 3, 5);
    g.generateTexture('furn_clerk_desk', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_inbox_tray')) {
    const g = scene.add.graphics();
    // Stacked tray base
    g.fillStyle(0x333333);
    g.fillRect(7, 14, 18, 2);
    g.fillRect(7, 20, 18, 2);
    g.fillStyle(0x444444);
    g.fillRect(7, 14, 18, 1);
    g.fillRect(7, 20, 18, 1);
    // Tray walls
    g.fillStyle(0x333333);
    g.fillRect(7, 14, 1, 12);
    g.fillRect(24, 14, 1, 12);
    // Papers in top tray (full)
    g.fillStyle(0xffffff);
    g.fillRect(8, 10, 16, 4);
    g.fillStyle(0xf0f0f0);
    g.fillRect(8, 13, 16, 1);
    g.fillStyle(0xfff8dc);
    g.fillRect(9, 11, 14, 1);
    // Papers in bottom tray
    g.fillStyle(0xffffff);
    g.fillRect(8, 16, 16, 4);
    g.fillStyle(0xf0f0f0);
    g.fillRect(8, 19, 16, 1);
    g.fillStyle(0xe8f4f8);
    g.fillRect(9, 17, 14, 1);
    // Label
    g.fillStyle(0x2980b9);
    g.fillRect(12, 22, 8, 3);
    g.fillStyle(0xffffff);
    g.fillRect(13, 23, 6, 1);
    g.generateTexture('furn_inbox_tray', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_outbox_tray')) {
    const g = scene.add.graphics();
    // Stacked tray base
    g.fillStyle(0x333333);
    g.fillRect(7, 14, 18, 2);
    g.fillRect(7, 20, 18, 2);
    g.fillStyle(0x444444);
    g.fillRect(7, 14, 18, 1);
    g.fillRect(7, 20, 18, 1);
    // Tray walls
    g.fillStyle(0x333333);
    g.fillRect(7, 14, 1, 12);
    g.fillRect(24, 14, 1, 12);
    // Few papers in top tray (sparse)
    g.fillStyle(0xffffff);
    g.fillRect(8, 12, 16, 2);
    g.fillStyle(0xf0f0f0);
    g.fillRect(8, 13, 16, 1);
    // Bottom tray nearly empty
    g.fillStyle(0xffffff);
    g.fillRect(8, 18, 10, 2);
    g.fillStyle(0xf0f0f0);
    g.fillRect(8, 19, 10, 1);
    // Label
    g.fillStyle(0x27ae60);
    g.fillRect(12, 22, 8, 3);
    g.fillStyle(0xffffff);
    g.fillRect(13, 23, 6, 1);
    g.generateTexture('furn_outbox_tray', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_document_cart')) {
    const g = scene.add.graphics();
    const metal = 0x888888;
    const metalDark = darken(metal, 25);
    const metalLight = lighten(metal, 20);
    // Cart frame
    g.fillStyle(metal);
    g.fillRect(5, 8, 22, 16);
    g.fillStyle(metalLight);
    g.fillRect(5, 8, 22, 1);
    g.fillRect(5, 8, 1, 16);
    g.fillStyle(metalDark);
    g.fillRect(26, 9, 1, 15);
    g.fillRect(6, 23, 20, 1);
    // Shelf divider
    g.fillStyle(metalDark);
    g.fillRect(6, 15, 20, 1);
    // File folders standing up (top shelf)
    g.fillStyle(0xf5deb3);
    g.fillRect(7, 9, 4, 6);
    g.fillStyle(0x2980b9);
    g.fillRect(12, 9, 3, 6);
    g.fillStyle(0xe74c3c);
    g.fillRect(16, 10, 3, 5);
    g.fillStyle(0x27ae60);
    g.fillRect(20, 9, 4, 6);
    // Bottom shelf folders
    g.fillStyle(0xf39c12);
    g.fillRect(7, 16, 5, 7);
    g.fillStyle(0x9b59b6);
    g.fillRect(14, 16, 4, 7);
    g.fillStyle(0xbdc3c7);
    g.fillRect(20, 17, 4, 6);
    // Wheels
    g.fillStyle(0x333333);
    g.fillRect(6, 24, 4, 3);
    g.fillRect(22, 24, 4, 3);
    g.fillStyle(0x444444);
    g.fillRect(7, 24, 2, 1);
    g.fillRect(23, 24, 2, 1);
    // Push handle
    g.fillStyle(metalDark);
    g.fillRect(5, 5, 22, 3);
    g.fillStyle(metalLight);
    g.fillRect(5, 5, 22, 1);
    g.generateTexture('furn_document_cart', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_shredder_station')) {
    const g = scene.add.graphics();
    // Shredder body
    const gray = 0x7a7a7a;
    g.fillStyle(gray);
    g.fillRect(8, 10, 16, 8);
    g.fillStyle(lighten(gray, 20));
    g.fillRect(8, 10, 16, 1);
    g.fillRect(8, 10, 1, 8);
    g.fillStyle(darken(gray, 25));
    g.fillRect(23, 11, 1, 7);
    // Paper feed slot
    g.fillStyle(0x333333);
    g.fillRect(10, 10, 12, 2);
    g.fillStyle(0x444444);
    g.fillRect(10, 10, 12, 1);
    // Paper being shredded
    g.fillStyle(0xffffff);
    g.fillRect(13, 6, 6, 5);
    g.fillStyle(0xf0f0f0);
    g.fillRect(18, 6, 1, 5);
    // Control button
    g.fillStyle(0x27ae60);
    g.fillRect(21, 13, 2, 2);
    // Waste basket below
    g.fillStyle(0x4a4a4a);
    g.fillRect(7, 18, 18, 10);
    g.fillStyle(0x555555);
    g.fillRect(7, 18, 18, 1);
    g.fillRect(7, 18, 1, 10);
    g.fillStyle(0x3a3a3a);
    g.fillRect(24, 19, 1, 9);
    g.fillRect(8, 27, 16, 1);
    // Shredded paper inside
    g.fillStyle(0xeeeedd);
    g.fillRect(9, 20, 14, 5);
    g.fillStyle(0xddddcc);
    g.fillRect(11, 21, 1, 3);
    g.fillRect(14, 20, 1, 4);
    g.fillRect(17, 21, 1, 3);
    g.fillRect(20, 20, 1, 4);
    g.generateTexture('furn_shredder_station', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_scanner_station')) {
    const g = scene.add.graphics();
    // Small table
    const table = 0x8b7355;
    g.fillStyle(table);
    g.fillRect(3, 18, 26, 3);
    g.fillStyle(lighten(table, 20));
    g.fillRect(3, 18, 26, 1);
    g.fillStyle(darken(table, 25));
    g.fillRect(28, 18, 1, 3);
    // Table legs
    g.fillStyle(darken(table, 25));
    g.fillRect(5, 21, 3, 8);
    g.fillRect(24, 21, 3, 8);
    // Scanner body (flat)
    g.fillStyle(0x8a8a8a);
    g.fillRect(6, 12, 20, 6);
    g.fillStyle(lighten(0x8a8a8a, 20));
    g.fillRect(6, 12, 20, 1);
    g.fillRect(6, 12, 1, 6);
    g.fillStyle(darken(0x8a8a8a, 25));
    g.fillRect(25, 13, 1, 5);
    // Glass top (lighter area)
    g.fillStyle(0xaabbcc);
    g.fillRect(8, 13, 16, 4);
    g.fillStyle(lighten(0xaabbcc, 20));
    g.fillRect(8, 13, 4, 1);
    // Scanner lid hinge line
    g.fillStyle(darken(0x8a8a8a, 15));
    g.fillRect(6, 12, 20, 1);
    // Control panel
    g.fillStyle(0x555555);
    g.fillRect(19, 9, 7, 3);
    g.fillStyle(0x00ff00);
    g.fillRect(20, 10, 2, 1);
    g.fillStyle(0xcccccc);
    g.fillRect(23, 10, 2, 1);
    g.generateTexture('furn_scanner_station', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_archive_box')) {
    const g = scene.add.graphics();
    const cardboard = 0xc4a87a;
    const cardDark = darken(cardboard, 25);
    const cardLight = lighten(cardboard, 20);
    // Bottom box
    g.fillStyle(cardboard);
    g.fillRect(5, 16, 22, 10);
    g.fillStyle(cardLight);
    g.fillRect(5, 16, 22, 1);
    g.fillRect(5, 16, 1, 10);
    g.fillStyle(cardDark);
    g.fillRect(26, 17, 1, 9);
    g.fillRect(6, 25, 20, 1);
    // Middle box (offset slightly)
    g.fillStyle(cardboard);
    g.fillRect(6, 8, 22, 9);
    g.fillStyle(cardLight);
    g.fillRect(6, 8, 22, 1);
    g.fillRect(6, 8, 1, 9);
    g.fillStyle(cardDark);
    g.fillRect(27, 9, 1, 8);
    // Top box (smallest/offset)
    g.fillStyle(cardboard);
    g.fillRect(8, 2, 18, 7);
    g.fillStyle(cardLight);
    g.fillRect(8, 2, 18, 1);
    g.fillRect(8, 2, 1, 7);
    g.fillStyle(cardDark);
    g.fillRect(25, 3, 1, 6);
    // Labels on front
    g.fillStyle(0xffffff);
    g.fillRect(12, 19, 8, 3);
    g.fillStyle(0x333333);
    g.fillRect(13, 20, 6, 1);
    g.fillStyle(0xffffff);
    g.fillRect(13, 11, 8, 3);
    g.fillStyle(0x333333);
    g.fillRect(14, 12, 6, 1);
    g.fillStyle(0xffffff);
    g.fillRect(14, 4, 6, 3);
    g.fillStyle(0x333333);
    g.fillRect(15, 5, 4, 1);
    g.generateTexture('furn_archive_box', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_monitoring_desk')) {
    const g = scene.add.graphics();
    const desk = 0x555555;
    const deskDark = darken(desk, 25);
    // Wide desk surface
    g.fillStyle(desk);
    g.fillRect(1, 16, 30, 3);
    g.fillStyle(lighten(desk, 20));
    g.fillRect(1, 16, 30, 1);
    g.fillStyle(deskDark);
    g.fillRect(30, 16, 1, 3);
    // Front panel
    g.fillStyle(darken(desk, 10));
    g.fillRect(2, 19, 28, 8);
    g.fillStyle(deskDark);
    g.fillRect(29, 19, 1, 8);
    g.fillRect(3, 26, 26, 1);
    // Three small screens
    g.fillStyle(0x2a2a2a);
    g.fillRect(2, 6, 8, 10);
    g.fillRect(12, 6, 8, 10);
    g.fillRect(22, 6, 8, 10);
    // Screens
    g.fillStyle(0x1a2a3a);
    g.fillRect(3, 7, 6, 8);
    g.fillRect(13, 7, 6, 8);
    g.fillRect(23, 7, 6, 8);
    // Screen content
    g.fillStyle(0x2ecc71);
    g.fillRect(4, 8, 4, 1);
    g.fillRect(4, 10, 3, 1);
    g.fillStyle(0xe74c3c);
    g.fillRect(14, 9, 4, 1);
    g.fillRect(14, 11, 5, 1);
    g.fillStyle(0x3498db);
    g.fillRect(24, 8, 5, 1);
    g.fillRect(24, 11, 3, 1);
    // Keyboard
    g.fillStyle(0x444444);
    g.fillRect(8, 17, 16, 2);
    g.fillStyle(0x555555);
    g.fillRect(8, 17, 16, 1);
    // Legs
    g.fillStyle(deskDark);
    g.fillRect(3, 27, 3, 3);
    g.fillRect(26, 27, 3, 3);
    g.generateTexture('furn_monitoring_desk', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_printer_station')) {
    const g = scene.add.graphics();
    // Small table
    const table = 0x8a8a8a;
    g.fillStyle(table);
    g.fillRect(3, 20, 26, 3);
    g.fillStyle(lighten(table, 20));
    g.fillRect(3, 20, 26, 1);
    g.fillStyle(darken(table, 25));
    g.fillRect(28, 20, 1, 3);
    // Table legs
    g.fillStyle(darken(table, 25));
    g.fillRect(5, 23, 3, 6);
    g.fillRect(24, 23, 3, 6);
    // Printer body
    const printer = 0x999999;
    g.fillStyle(printer);
    g.fillRect(5, 10, 22, 10);
    g.fillStyle(lighten(printer, 20));
    g.fillRect(5, 10, 22, 1);
    g.fillRect(5, 10, 1, 10);
    g.fillStyle(darken(printer, 25));
    g.fillRect(26, 11, 1, 9);
    g.fillRect(6, 19, 20, 1);
    // Paper output tray
    g.fillStyle(darken(printer, 10));
    g.fillRect(8, 15, 16, 2);
    // Paper feeding in/out
    g.fillStyle(0xffffff);
    g.fillRect(10, 6, 12, 5);
    g.fillStyle(0xf0f0f0);
    g.fillRect(21, 6, 1, 5);
    // Control panel
    g.fillStyle(0x444444);
    g.fillRect(18, 11, 8, 3);
    g.fillStyle(0x00ff00);
    g.fillRect(19, 12, 2, 1);
    g.fillStyle(0xcccccc);
    g.fillRect(22, 12, 3, 1);
    g.generateTexture('furn_printer_station', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_cable_tray')) {
    const g = scene.add.graphics();
    // Horizontal tray/raceway
    const tray = 0x666666;
    g.fillStyle(tray);
    g.fillRect(2, 10, 28, 6);
    g.fillStyle(lighten(tray, 20));
    g.fillRect(2, 10, 28, 1);
    g.fillStyle(darken(tray, 20));
    g.fillRect(2, 15, 28, 1);
    // Tray sides
    g.fillStyle(darken(tray, 10));
    g.fillRect(2, 10, 1, 6);
    g.fillRect(29, 10, 1, 6);
    // Support brackets
    g.fillStyle(0x555555);
    g.fillRect(6, 16, 2, 4);
    g.fillRect(24, 16, 2, 4);
    // Colored cables running through
    g.fillStyle(0x2980b9);
    g.fillRect(4, 11, 24, 1);
    g.fillStyle(0xe74c3c);
    g.fillRect(4, 12, 24, 1);
    g.fillStyle(0xf39c12);
    g.fillRect(4, 13, 24, 1);
    g.fillStyle(0x27ae60);
    g.fillRect(4, 14, 24, 1);
    // Cable highlight
    g.fillStyle(lighten(0x2980b9, 30));
    g.fillRect(10, 11, 4, 1);
    g.fillStyle(lighten(0xe74c3c, 30));
    g.fillRect(16, 12, 4, 1);
    g.generateTexture('furn_cable_tray', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_locked_cabinet')) {
    const g = scene.add.graphics();
    const metal = 0x607080;
    const metalDark = darken(metal, 30);
    const metalLight = lighten(metal, 20);
    // Main body
    g.fillStyle(metal);
    g.fillRect(6, 3, 20, 26);
    g.fillStyle(metalLight);
    g.fillRect(6, 3, 20, 1);
    g.fillRect(6, 3, 1, 26);
    g.fillStyle(metalDark);
    g.fillRect(25, 4, 1, 25);
    g.fillRect(7, 28, 18, 1);
    // Door panels
    g.fillStyle(darken(metal, 10));
    g.fillRect(8, 5, 8, 22);
    g.fillRect(17, 5, 8, 22);
    // Door divider
    g.fillStyle(metalDark);
    g.fillRect(16, 5, 1, 22);
    // Handle
    g.fillStyle(0xcccccc);
    g.fillRect(14, 14, 2, 4);
    g.fillRect(17, 14, 2, 4);
    // Padlock icon
    g.fillStyle(0xdaa520);
    g.fillRect(14, 10, 4, 4);
    g.fillStyle(lighten(0xdaa520, 25));
    g.fillRect(14, 10, 2, 2);
    // Lock shackle
    g.fillStyle(0xcccccc);
    g.fillRect(15, 8, 2, 3);
    g.fillRect(14, 8, 4, 1);
    // Keyhole
    g.fillStyle(0x333333);
    g.fillRect(15, 11, 2, 2);
    // RESTRICTED feel — red stripe
    g.fillStyle(0xcc2222);
    g.fillRect(8, 23, 16, 2);
    g.fillStyle(lighten(0xcc2222, 20));
    g.fillRect(8, 23, 16, 1);
    g.generateTexture('furn_locked_cabinet', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_coffee_mug')) {
    const g = scene.add.graphics();
    // Mug body
    const mug = 0xf5f5f5;
    g.fillStyle(mug);
    g.fillRect(10, 14, 10, 10);
    g.fillStyle(lighten(mug, 5));
    g.fillRect(10, 14, 1, 10);
    g.fillStyle(darken(mug, 20));
    g.fillRect(19, 14, 1, 10);
    g.fillRect(11, 23, 8, 1);
    // Mug rim
    g.fillStyle(darken(mug, 10));
    g.fillRect(9, 13, 12, 2);
    // Handle
    g.fillStyle(darken(mug, 15));
    g.fillRect(20, 16, 3, 6);
    g.fillRect(22, 17, 1, 4);
    g.fillStyle(mug);
    g.fillRect(21, 17, 1, 4);
    // Coffee inside (dark brown)
    g.fillStyle(0x3e2723);
    g.fillRect(10, 14, 10, 2);
    // Steam wisps
    g.fillStyle(0xdddddd);
    g.fillRect(12, 10, 1, 3);
    g.fillRect(15, 8, 1, 4);
    g.fillRect(18, 9, 1, 3);
    g.fillStyle(0xcccccc);
    g.fillRect(13, 9, 1, 2);
    g.fillRect(17, 7, 1, 3);
    g.generateTexture('furn_coffee_mug', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_headphones')) {
    const g = scene.add.graphics();
    // Headband (curved top)
    g.fillStyle(0x333333);
    g.fillRect(9, 8, 14, 3);
    g.fillRect(8, 10, 2, 2);
    g.fillRect(22, 10, 2, 2);
    g.fillStyle(0x444444);
    g.fillRect(10, 8, 12, 1);
    // Headband padding
    g.fillStyle(0x555555);
    g.fillRect(12, 9, 8, 2);
    // Left ear cup
    g.fillStyle(0x2a2a2a);
    g.fillRect(5, 12, 6, 10);
    g.fillStyle(0x3a3a3a);
    g.fillRect(5, 12, 6, 1);
    g.fillRect(5, 12, 1, 10);
    g.fillStyle(0x1a1a1a);
    g.fillRect(10, 13, 1, 9);
    // Left ear padding
    g.fillStyle(0x444444);
    g.fillRect(6, 14, 4, 6);
    // Right ear cup
    g.fillStyle(0x2a2a2a);
    g.fillRect(21, 12, 6, 10);
    g.fillStyle(0x3a3a3a);
    g.fillRect(21, 12, 6, 1);
    g.fillStyle(0x1a1a1a);
    g.fillRect(26, 13, 1, 9);
    g.fillRect(21, 21, 5, 1);
    // Right ear padding
    g.fillStyle(0x444444);
    g.fillRect(22, 14, 4, 6);
    g.generateTexture('furn_headphones', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_tissue_box')) {
    const g = scene.add.graphics();
    // Box body
    const box = 0x5b9bd5;
    g.fillStyle(box);
    g.fillRect(7, 14, 18, 10);
    g.fillStyle(lighten(box, 20));
    g.fillRect(7, 14, 18, 1);
    g.fillRect(7, 14, 1, 10);
    g.fillStyle(darken(box, 25));
    g.fillRect(24, 15, 1, 9);
    g.fillRect(8, 23, 16, 1);
    // Box top
    g.fillStyle(lighten(box, 10));
    g.fillRect(7, 12, 18, 3);
    // Opening slot
    g.fillStyle(darken(box, 30));
    g.fillRect(12, 12, 8, 2);
    // Tissue poking out
    g.fillStyle(0xffffff);
    g.fillRect(13, 7, 6, 6);
    g.fillStyle(0xf0f0f0);
    g.fillRect(14, 7, 1, 5);
    g.fillRect(17, 7, 1, 5);
    // Tissue crumple
    g.fillStyle(0xe8e8e8);
    g.fillRect(15, 6, 2, 2);
    // Decorative stripe on box
    g.fillStyle(lighten(box, 35));
    g.fillRect(8, 18, 16, 2);
    g.generateTexture('furn_tissue_box', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_trash_bin')) {
    // Alias for furn_trash — reuse existing texture
    const g = scene.add.graphics();
    g.fillStyle(0x9e9e9e);
    g.fillRect(10, 10, 12, 16);
    g.fillStyle(lighten(0x9e9e9e, 20));
    g.fillRect(10, 10, 1, 15);
    g.fillStyle(darken(0x9e9e9e, 25));
    g.fillRect(21, 10, 1, 16);
    g.fillRect(11, 25, 10, 1);
    g.fillStyle(0xbdbdbd);
    g.fillRect(9, 9, 14, 2);
    g.fillStyle(0xd0d0d0);
    g.fillRect(9, 9, 14, 1);
    g.fillStyle(0xf5f5dc);
    g.fillRect(12, 10, 3, 2);
    g.fillStyle(0xe8e8d0);
    g.fillRect(16, 11, 4, 2);
    g.fillStyle(darken(0x9e9e9e, 30));
    g.fillRect(10, 26, 12, 2);
    g.generateTexture('furn_trash_bin', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_lunch_table')) {
    const g = scene.add.graphics();
    const top = 0xd4c5a9;
    const topDark = darken(top, 25);
    const topLight = lighten(top, 20);
    // Tabletop
    g.fillStyle(top);
    g.fillRect(2, 12, 28, 4);
    g.fillStyle(topLight);
    g.fillRect(2, 12, 28, 1);
    g.fillRect(2, 12, 1, 4);
    g.fillStyle(topDark);
    g.fillRect(29, 12, 1, 4);
    g.fillRect(3, 15, 26, 1);
    // Center pedestal
    g.fillStyle(0x888888);
    g.fillRect(13, 16, 6, 8);
    g.fillStyle(0x999999);
    g.fillRect(13, 16, 1, 8);
    g.fillStyle(0x777777);
    g.fillRect(18, 16, 1, 8);
    // Base plate
    g.fillStyle(0x777777);
    g.fillRect(8, 24, 16, 3);
    g.fillStyle(0x888888);
    g.fillRect(8, 24, 16, 1);
    g.fillStyle(0x666666);
    g.fillRect(8, 26, 16, 1);
    // Bench seats (attached)
    g.fillStyle(0xe74c3c);
    g.fillRect(1, 10, 6, 3);
    g.fillRect(25, 10, 6, 3);
    g.fillStyle(lighten(0xe74c3c, 20));
    g.fillRect(1, 10, 6, 1);
    g.fillRect(25, 10, 6, 1);
    g.generateTexture('furn_lunch_table', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_microscope_station')) {
    const g = scene.add.graphics();
    const bench = 0x95a5a6;
    const benchDark = darken(bench, 30);
    // Bench top
    g.fillStyle(bench);
    g.fillRect(2, 16, 28, 3);
    g.fillStyle(lighten(bench, 20));
    g.fillRect(2, 16, 28, 1);
    g.fillStyle(benchDark);
    g.fillRect(29, 16, 1, 3);
    // Bench front
    g.fillStyle(darken(bench, 15));
    g.fillRect(3, 19, 26, 8);
    g.fillStyle(benchDark);
    g.fillRect(28, 19, 1, 8);
    g.fillRect(4, 26, 24, 1);
    // Bench legs
    g.fillStyle(benchDark);
    g.fillRect(4, 27, 3, 3);
    g.fillRect(25, 27, 3, 3);
    // Microscope on bench — base
    g.fillStyle(0x444444);
    g.fillRect(8, 12, 10, 4);
    g.fillStyle(0x555555);
    g.fillRect(8, 12, 10, 1);
    // Microscope arm
    g.fillStyle(0x555555);
    g.fillRect(11, 5, 3, 11);
    g.fillStyle(0x666666);
    g.fillRect(11, 5, 1, 11);
    // Eyepiece
    g.fillStyle(0x333333);
    g.fillRect(10, 2, 4, 4);
    g.fillStyle(0x444444);
    g.fillRect(10, 2, 4, 1);
    // Lens tube
    g.fillStyle(0x666666);
    g.fillRect(10, 6, 5, 2);
    // Stage
    g.fillStyle(0x777777);
    g.fillRect(8, 10, 8, 2);
    // Focus knob
    g.fillStyle(0x888888);
    g.fillRect(15, 8, 2, 3);
    // Slide box next to microscope
    g.fillStyle(0x2980b9);
    g.fillRect(21, 12, 5, 4);
    g.fillStyle(lighten(0x2980b9, 20));
    g.fillRect(21, 12, 5, 1);
    g.generateTexture('furn_microscope_station', TILE, TILE);
    g.destroy();
  }

}

/**
 * Map a room obstacle type string to its texture key.
 */
export function furnitureTextureKey(obstacleType?: string): string {
  const map: Record<string, string> = {
    // Original
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
    clock: 'furn_clock',
    water_cooler: 'furn_water_cooler',
    nurse_station: 'furn_nurse_station',
    microscope: 'furn_microscope',
    patient_bay: 'furn_bed',
    filing_cabinet: 'furn_filing_cabinet',
    trash: 'furn_trash',
    trash_can: 'furn_trash',
    exam_table: 'furn_exam_table',
    bookshelf: 'furn_bookshelf',
    // ER Room
    gurney: 'furn_gurney',
    curtain_partition: 'furn_curtain_partition',
    iv_stand: 'furn_iv_stand',
    crash_cart: 'furn_crash_cart',
    vital_monitor: 'furn_vital_monitor',
    triage_desk: 'furn_triage_desk',
    equipment: 'furn_equipment',
    // Lab Room
    lab_bench: 'furn_lab_bench',
    centrifuge: 'furn_centrifuge',
    specimen_fridge: 'furn_specimen_fridge',
    bio_cabinet: 'furn_bio_cabinet',
    fume_hood: 'furn_fume_hood',
    chemical_shelf: 'furn_chemical_shelf',
    sink_station: 'furn_sink_station',
    eyewash_station: 'furn_eyewash_station',
    sample_rack: 'furn_sample_rack',
    autoclave: 'furn_autoclave',
    results_board: 'furn_results_board',
    microscope_station: 'furn_microscope',
    // Shared / Common
    vending_machine: 'furn_vending_machine',
    couch: 'furn_couch',
    coffee_station: 'furn_coffee_station',
    server_rack: 'furn_server_rack',
    monitor_bank: 'furn_monitor_bank',
    workstation_cluster: 'furn_workstation_cluster',
    whiteboard_wall: 'furn_whiteboard_wall',
    // Reception
    privacy_screen: 'furn_privacy_screen',
    notice_board: 'furn_notice_board',
    magazine_rack: 'furn_magazine_rack',
    water_dispenser: 'furn_water_dispenser',
    tissue_box: 'furn_tissue_box',
    // Hospital Entrance
    info_kiosk: 'furn_info_kiosk',
    welcome_mat: 'furn_welcome_mat',
    bulletin_board: 'furn_bulletin_board',
    flower_arrangement: 'furn_flower_arrangement',
    hand_sanitizer: 'furn_hand_sanitizer',
    umbrella_stand: 'furn_umbrella_stand',
    // Break Room
    microwave: 'furn_microwave',
    open_fridge: 'furn_open_fridge',
    tv_stand: 'furn_tv_stand',
    lost_and_found_box: 'furn_lost_and_found_box',
    coat_rack: 'furn_coat_rack',
    lunch_table: 'furn_lunch_table',
    trash_bin: 'furn_trash',
    // Records Room
    records_counter: 'furn_records_counter',
    clerk_desk: 'furn_clerk_desk',
    inbox_tray: 'furn_inbox_tray',
    outbox_tray: 'furn_outbox_tray',
    document_cart: 'furn_document_cart',
    shredder_station: 'furn_shredder_station',
    scanner_station: 'furn_scanner_station',
    archive_box: 'furn_archive_box',
    // IT Office
    monitoring_desk: 'furn_monitoring_desk',
    printer_station: 'furn_printer_station',
    cable_tray: 'furn_cable_tray',
    locked_cabinet: 'furn_locked_cabinet',
    coffee_mug: 'furn_coffee_mug',
    headphones: 'furn_headphones',
    // Hallway (wall_clock has a texture; others use fallback for now)
    wall_clock: 'furn_clock',
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
    // Lab
    lab_tech: 'npc_it_tech',
    researcher: 'npc_doctor',
    courier: 'npc_visitor',
    // Records Room
    records_clerk: 'npc_receptionist',
    patient_request: 'npc_patient',
    attorney: 'npc_boss',
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
 * Map an NPC id to the NPC type string used in animation keys (e.g. 'npc_TYPE_walk_DIR').
 */
export function npcTypeFromId(npcId: string): string {
  // Derive type from texture key: 'npc_doctor' -> 'doctor'
  const texKey = npcTextureKey(npcId);
  return texKey.replace('npc_', '');
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
