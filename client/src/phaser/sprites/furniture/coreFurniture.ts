import Phaser from 'phaser';

import { TILE, darken, lighten } from '../colorUtils';

export function generateCoreFurniture(scene: Phaser.Scene) {
  if (!scene.textures.exists('furn_desk')) {
    const g = scene.add.graphics();
    const wood = 0x8b6f47;
    const woodDark = darken(wood, 40);
    const woodLight = lighten(wood, 35);
    // 1px silhouette outline
    g.fillStyle(0x1a1a1a);
    g.fillRect(2, 9, 28, 15);  // desktop + front panel outline
    g.fillRect(4, 21, 4, 8);   // left leg outline
    g.fillRect(23, 21, 4, 8);  // right leg outline
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
    // Character details: paper sheet + pen on desktop
    g.fillStyle(0xffffff);
    g.fillRect(6, 10, 6, 4);   // white paper sheet
    g.fillStyle(0xdddddd);
    g.fillRect(11, 10, 1, 4);  // paper right edge
    g.fillStyle(0x3a3a8a);
    g.fillRect(14, 11, 2, 1);  // pen barrel (blue)
    g.fillStyle(0xcccccc);
    g.fillRect(16, 11, 1, 1);  // pen tip
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
    const woodDark = darken(wood, 40);
    const woodLight = lighten(wood, 35);
    // 1px silhouette outline
    g.fillStyle(0x1a1a1a);
    g.fillRect(2, 10, 28, 6);  // tabletop outline
    g.fillRect(4, 16, 4, 13);  // left leg outline
    g.fillRect(23, 16, 4, 13); // right leg outline
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
    // Character details: wood grain streaks + corner wear
    g.fillStyle(darken(wood, 18));
    g.fillRect(5, 12, 10, 1);  // grain streak 1
    g.fillRect(16, 13, 8, 1);  // grain streak 2
    g.fillStyle(woodLight);
    g.fillRect(3, 11, 2, 1);   // corner wear highlight (top-left)
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
    const blueDark = darken(blue, 40);
    const blueLight = lighten(blue, 35);
    // 1px silhouette outline
    g.fillStyle(0x1a1a1a);
    g.fillRect(7, 4, 18, 11);  // backrest outline
    g.fillRect(6, 13, 20, 9);  // seat outline
    g.fillRect(8, 20, 4, 11);  // left leg outline
    g.fillRect(20, 20, 4, 11); // right leg outline
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
    // Seat stitch line (character detail)
    g.fillStyle(darken(blue, 20));
    g.fillRect(9, 17, 14, 1);
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
    const pot = 0xc0613a;
    // 1px silhouette outline for pot
    g.fillStyle(0x1a1a1a);
    g.fillRect(10, 18, 12, 13);
    // Pot shadow
    g.fillStyle(darken(pot, 20));
    g.fillRect(11, 20, 10, 10);
    g.fillStyle(pot);
    g.fillRect(12, 20, 8, 9);
    // Pot highlight
    g.fillStyle(lighten(pot, 35));
    g.fillRect(12, 20, 1, 8);
    // Pot rim (boosted shine)
    g.fillStyle(lighten(pot, 25));
    g.fillRect(10, 19, 12, 2);
    // Pot rim shine pixel
    g.fillStyle(lighten(pot, 45));
    g.fillRect(11, 19, 3, 1);
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
    // Second leaf-cluster tone (character detail)
    g.fillStyle(0x56c45a);
    g.fillRect(9, 9, 4, 3);
    g.fillRect(19, 8, 4, 3);
    g.fillStyle(0x66bb6a);
    g.fillRect(11, 5, 3, 3);
    g.fillRect(18, 7, 3, 2);
    g.fillStyle(0x388e3c);
    g.fillRect(14, 3, 4, 3);
    g.fillRect(10, 8, 2, 2);
    g.fillRect(20, 8, 2, 2);
    // Leaf highlights (boosted)
    g.fillStyle(0x9ad89e);
    g.fillRect(12, 4, 2, 1);
    g.fillRect(18, 6, 2, 1);
    g.fillRect(15, 3, 2, 1);
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
    // 1px silhouette outline
    g.fillStyle(0x1a1a1a);
    g.fillRect(7, 2, 18, 28);
    // Main body
    g.fillStyle(metal);
    g.fillRect(8, 3, 16, 26);
    // Body highlight
    g.fillStyle(lighten(metal, 30));
    g.fillRect(8, 3, 1, 26);
    g.fillRect(8, 3, 16, 1);
    // Body shadow
    g.fillStyle(darken(metal, 35));
    g.fillRect(23, 4, 1, 25);
    g.fillRect(9, 28, 14, 1);
    // Drawer divisions
    g.fillStyle(darken(metal, 20));
    g.fillRect(9, 9, 14, 1);
    g.fillRect(9, 16, 14, 1);
    g.fillRect(9, 23, 14, 1);
    // Drawer label slots on each drawer (white paper labels)
    g.fillStyle(0xfafafa);
    g.fillRect(11, 4, 10, 4);   // top drawer label
    g.fillRect(11, 10, 10, 5);  // second drawer label
    g.fillRect(11, 17, 10, 5);  // third drawer label
    g.fillRect(11, 24, 10, 3);  // bottom drawer label
    // Label ruled line (grey)
    g.fillStyle(0xdddddd);
    g.fillRect(12, 6, 8, 1);
    g.fillRect(12, 13, 8, 1);
    g.fillRect(12, 20, 8, 1);
    // One drawer drawn 1px ajar (third drawer) with inner shadow
    g.fillStyle(darken(metal, 25));
    g.fillRect(9, 22, 14, 1);   // slight gap showing ajar
    g.fillStyle(0x1a1a1a);
    g.fillRect(9, 22, 14, 1);
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
}
