import Phaser from 'phaser';

import { TILE, darken, lighten } from './colorUtils';

// ── Object textures (poster, manual, computer, whiteboard) ───────────
export function generateObjectTextures(scene: Phaser.Scene) {
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
