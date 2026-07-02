import Phaser from 'phaser';

import { TILE, darken, lighten } from '../colorUtils';

export function generateMedicalLabFurniture(scene: Phaser.Scene) {
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
}
