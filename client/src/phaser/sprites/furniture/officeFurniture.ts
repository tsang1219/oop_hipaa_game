import Phaser from 'phaser';

import { TILE, darken, lighten } from '../colorUtils';

export function generateOfficeFurniture(scene: Phaser.Scene) {
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
    const tray = 0x666666;
    // 1px silhouette outline
    g.fillStyle(0x1a1a1a);
    g.fillRect(1, 9, 30, 8);
    g.fillRect(5, 16, 4, 6);   // left bracket outline
    g.fillRect(23, 16, 4, 6);  // right bracket outline
    // Horizontal tray/raceway
    g.fillStyle(tray);
    g.fillRect(2, 10, 28, 6);
    g.fillStyle(lighten(tray, 30));
    g.fillRect(2, 10, 28, 1);
    g.fillStyle(darken(tray, 30));
    g.fillRect(2, 15, 28, 1);
    // Tray sides
    g.fillStyle(darken(tray, 10));
    g.fillRect(2, 10, 1, 6);
    g.fillRect(29, 10, 1, 6);
    // Support brackets
    g.fillStyle(0x555555);
    g.fillRect(6, 16, 2, 4);
    g.fillRect(24, 16, 2, 4);
    // Colored cable runs — muted red, blue, yellow 2px lines (character detail)
    g.fillStyle(0x1a6090);   // muted blue cable
    g.fillRect(4, 11, 24, 2);
    g.fillStyle(0x8b2020);   // muted red cable
    g.fillRect(4, 12, 24, 1);
    g.fillStyle(0x4a3300);   // muted yellow cable (dark)
    g.fillRect(4, 13, 24, 1);
    g.fillStyle(darken(tray, 15));
    g.fillRect(4, 14, 24, 1);
    // Cable highlights (shimmer on bend points)
    g.fillStyle(lighten(0x2980b9, 40));
    g.fillRect(10, 11, 4, 1);
    g.fillStyle(lighten(0x8b2020, 40));
    g.fillRect(18, 12, 3, 1);
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

  // ── New generators: wall sconce + corridor bench ─────────────────

  if (!scene.textures.exists('furn_wall_sconce')) {
    const g = scene.add.graphics();
    const bracket = 0x4a4a52;
    const shade = 0xc8b88a;
    const shadeLight = lighten(shade, 25);
    const shadeDark = darken(shade, 30);
    // 1px silhouette outline
    g.fillStyle(0x1a1a1a);
    g.fillRect(9, 3, 14, 22);
    // Metal bracket at top-center
    g.fillStyle(bracket);
    g.fillRect(13, 4, 6, 5);
    g.fillStyle(lighten(bracket, 20));
    g.fillRect(13, 4, 6, 1);
    g.fillStyle(darken(bracket, 20));
    g.fillRect(18, 5, 1, 4);
    // Lamp shade — upward trapezoid (wide at bottom, narrow at top)
    g.fillStyle(shade);
    g.fillRect(11, 9, 10, 9);  // main shade body
    g.fillRect(13, 7, 6, 3);   // narrowed top
    // Shade highlight (left edge)
    g.fillStyle(shadeLight);
    g.fillRect(11, 9, 1, 8);
    g.fillRect(13, 7, 1, 4);
    // Shade shadow (right edge)
    g.fillStyle(shadeDark);
    g.fillRect(20, 10, 1, 8);
    g.fillRect(18, 7, 1, 3);
    // Warm glow blobs above the shade (additive illusion via alpha fills)
    g.fillStyle(0xffe8a8, 0.5);
    g.fillRect(12, 5, 8, 4);   // near glow
    g.fillStyle(0xffe8a8, 0.25);
    g.fillRect(10, 3, 12, 5);  // expanding outer glow
    // Wall mounting base (dark rectangle at very top center)
    g.fillStyle(darken(bracket, 10));
    g.fillRect(14, 3, 4, 2);
    g.generateTexture('furn_wall_sconce', TILE, TILE);
    g.destroy();
  }

  if (!scene.textures.exists('furn_bench')) {
    const g = scene.add.graphics();
    const wood = 0x8b6f47;
    const woodDark = darken(wood, 40);
    const woodLight = lighten(wood, 35);
    // 1px silhouette outline
    g.fillStyle(0x1a1a1a);
    g.fillRect(2, 12, 28, 12);
    g.fillRect(4, 23, 5, 5);    // left leg outline
    g.fillRect(23, 23, 5, 5);   // right leg outline
    // Backrest bar (low, 2px)
    g.fillStyle(darken(wood, 20));
    g.fillRect(3, 12, 26, 2);
    g.fillStyle(woodLight);
    g.fillRect(3, 12, 26, 1);
    // Seat — horizontal wooden surface (~6px tall)
    g.fillStyle(wood);
    g.fillRect(3, 14, 26, 6);
    // Seat highlight (top edge)
    g.fillStyle(woodLight);
    g.fillRect(3, 14, 26, 1);
    g.fillRect(3, 14, 1, 6);
    // Seat shadow (bottom edge)
    g.fillStyle(woodDark);
    g.fillRect(4, 19, 25, 1);
    g.fillRect(28, 14, 1, 6);
    // Slat lines (3 slats across seat width)
    g.fillStyle(darken(wood, 15));
    g.fillRect(10, 14, 1, 6);
    g.fillRect(18, 14, 1, 6);
    // Two legs
    g.fillStyle(woodDark);
    g.fillRect(5, 20, 3, 7);
    g.fillRect(24, 20, 3, 7);
    // Leg highlights
    g.fillStyle(wood);
    g.fillRect(5, 20, 1, 7);
    g.fillRect(24, 20, 1, 7);
    g.generateTexture('furn_bench', TILE, TILE);
    g.destroy();
  }

  // Threat console — the BreachDefense encounter kiosk (HIPAA-is-the-game pass).
  // Free-standing SOC kiosk: pedestal base, angled body, big screen head.
  // The screen face is deliberately dark here — ExplorationScene.spawnDefenseConsole
  // layers the animated threat-map, beacon, glow, and label on top.
  if (!scene.textures.exists('furn_defense_console')) {
    const g = scene.add.graphics();
    const steel = 0x2a3244;
    // Pedestal base + feet
    g.fillStyle(darken(steel, 20));
    g.fillRect(6, 27, 20, 4);
    g.fillStyle(darken(steel, 35));
    g.fillRect(4, 30, 6, 2);
    g.fillRect(22, 30, 6, 2);
    // Body column
    g.fillStyle(steel);
    g.fillRect(10, 18, 12, 9);
    g.fillStyle(lighten(steel, 15));
    g.fillRect(10, 18, 1, 9);
    g.fillStyle(darken(steel, 25));
    g.fillRect(21, 18, 1, 9);
    // Cable run into the floor
    g.fillStyle(0x11151f);
    g.fillRect(22, 29, 7, 2);
    // Screen head — wide bezel
    g.fillStyle(0x11151f);
    g.fillRect(2, 2, 28, 17);
    g.fillStyle(lighten(0x11151f, 20));
    g.fillRect(2, 2, 28, 1);
    g.fillRect(2, 2, 1, 17);
    // Screen face — dark glass
    g.fillStyle(0x081420);
    g.fillRect(4, 4, 24, 13);
    // Faint scan grid
    g.fillStyle(0x1a3a4a);
    g.fillRect(4, 8, 24, 1);
    g.fillRect(4, 12, 24, 1);
    g.fillRect(12, 4, 1, 13);
    g.fillRect(20, 4, 1, 13);
    // Status LED strip on the bezel
    g.fillStyle(0xe74c3c);
    g.fillRect(25, 3, 2, 1);
    g.fillStyle(0xf39c12);
    g.fillRect(22, 3, 2, 1);
    g.generateTexture('furn_defense_console', TILE, TILE);
    g.destroy();
  }
}
