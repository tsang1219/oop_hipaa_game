import Phaser from 'phaser';

import { TILE, darken, lighten } from '../colorUtils';

export function generateCommonAreasFurniture(scene: Phaser.Scene) {
  // ── Shared/Common textures ──────────────────────────────────────────

  if (!scene.textures.exists('furn_vending_machine')) {
    const g = scene.add.graphics();
    const body = 0x3a3a4a;
    const bodyDark = darken(body, 35);
    const bodyLight = lighten(body, 30);
    // 1px silhouette outline
    g.fillStyle(0x111111);
    g.fillRect(4, 1, 24, 30);
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
    // Product silhouette rows — 3 rows x 3 cols (character detail: small colored 3x4 rects behind window)
    g.fillStyle(0xe74c3c);   // row 1
    g.fillRect(8, 5, 3, 4);
    g.fillStyle(0x2980b9);
    g.fillRect(13, 5, 3, 4);
    g.fillStyle(0x27ae60);
    g.fillRect(18, 5, 3, 4);
    g.fillStyle(0xf39c12);   // row 2
    g.fillRect(8, 10, 3, 4);
    g.fillStyle(0x9b59b6);
    g.fillRect(13, 10, 3, 4);
    g.fillStyle(0x1abc9c);
    g.fillRect(18, 10, 3, 4);
    g.fillStyle(0xe67e22);   // row 3 (partial)
    g.fillRect(8, 13, 3, 2);
    g.fillStyle(0x3498db);
    g.fillRect(13, 13, 3, 2);
    // Product highlight specular
    g.fillStyle(0xffffff);
    g.fillRect(8, 5, 1, 1);
    g.fillRect(13, 5, 1, 1);
    g.fillRect(18, 5, 1, 1);
    // Coin/button panel
    g.fillStyle(0x555555);
    g.fillRect(7, 17, 18, 5);
    // Buttons
    g.fillStyle(0xcccccc);
    g.fillRect(8, 18, 3, 3);
    g.fillRect(12, 18, 3, 3);
    g.fillRect(16, 18, 3, 3);
    // Coin slot (character detail)
    g.fillStyle(0x444444);
    g.fillRect(21, 18, 3, 4);
    g.fillStyle(0x888888);
    g.fillRect(21, 19, 3, 1);
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
    const metalLight = lighten(metal, 30);
    // 1px silhouette outline
    g.fillStyle(0x111111);
    g.fillRect(5, 1, 22, 30);
    // Main rack body
    g.fillStyle(metal);
    g.fillRect(6, 2, 20, 28);
    g.fillStyle(metalLight);
    g.fillRect(6, 2, 20, 1);
    g.fillRect(6, 2, 1, 28);
    g.fillStyle(metalDark);
    g.fillRect(25, 3, 1, 27);
    g.fillRect(7, 29, 18, 1);
    // Server unit rows with vent slat lines (character detail)
    const unitYs = [4, 9, 14, 19, 24];
    for (const uy of unitYs) {
      // Unit panel
      g.fillStyle(0x3a3a3a);
      g.fillRect(8, uy, 16, 4);
      g.fillStyle(0x444444);
      g.fillRect(8, uy, 16, 1);
      // Ventilation slat lines (horizontal dashes)
      g.fillStyle(0x1a1a1a);
      g.fillRect(9, uy + 2, 10, 1);
      g.fillStyle(0x333333);
      g.fillRect(9, uy + 3, 10, 1);
    }
    // Baked LED dots: green (active) and amber (warning) — 2px for readability
    g.fillStyle(0x44ff44);  // bright green LED
    g.fillRect(20, 5, 2, 2);
    g.fillRect(20, 15, 2, 2);
    g.fillRect(20, 25, 2, 2);
    g.fillStyle(0xffbb00);  // amber LED
    g.fillRect(23, 5, 2, 2);
    g.fillRect(23, 10, 2, 2);
    g.fillRect(23, 20, 2, 2);
    // LED glare specular
    g.fillStyle(0xaaffaa);
    g.fillRect(20, 5, 1, 1);
    g.fillRect(20, 15, 1, 1);
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
}
