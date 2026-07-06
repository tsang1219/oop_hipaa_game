import Phaser from 'phaser';
import { darken, lighten } from '../../sprites/colorUtils';

/**
 * compositeFurniture.ts — coherent, VOLUMETRIC multi-tile furniture.
 *
 * The old roomRenderer tiled a single 32px texture across every cell of a
 * multi-tile obstacle (20 cloned benches for `lab_bench w10 h2`). This module
 * draws each multi-tile obstacle as ONE object sized to its footprint.
 *
 * Loop-2 goal (Nintendo depth): every standing object reads as a 3D volume, not
 * a flat face-on rectangle. The shared primitive is `extrudedBox` — a body with
 * a lit TOP band, a darker FRONT FACE showing thickness, a right-edge SIDE
 * shadow, and a base contact line. Same chunky 8-bit palette as the 32px
 * textures; the vending machine's layered look is now the baseline everywhere.
 */

const TILE = 32;

type Category =
  | 'surface' | 'station' | 'bed' | 'seating' | 'tall_cabinet'
  | 'appliance' | 'bank' | 'shelf' | 'partition' | 'mat' | 'planter';

interface Style {
  cat: Category;
  base: number;
  accent?: number;
  prop?: 'monitor' | 'paper' | 'beaker' | 'tray' | 'none';
}

const STYLES: Record<string, Style> = {
  // Surfaces
  desk:                { cat: 'surface', base: 0x8b6f47, prop: 'paper' },
  table:               { cat: 'surface', base: 0x9a7d52, prop: 'none' },
  lunch_table:         { cat: 'surface', base: 0xb9926a, prop: 'tray' },
  lab_bench:           { cat: 'surface', base: 0xdcd3bf, accent: 0x2f7d6e, prop: 'beaker' },
  records_counter:     { cat: 'surface', base: 0x9a7d52, prop: 'paper' },
  clerk_desk:          { cat: 'surface', base: 0x8b6f47, prop: 'paper' },
  monitoring_desk:     { cat: 'surface', base: 0x4a4f5c, accent: 0x39e0a0, prop: 'monitor' },
  monitor_bank:        { cat: 'surface', base: 0x3a3f4a, accent: 0x39c0e0, prop: 'monitor' },
  workstation_cluster: { cat: 'surface', base: 0x4a4f5c, accent: 0x39c0e0, prop: 'monitor' },
  whiteboard_wall:     { cat: 'shelf',   base: 0xf4f4f0, accent: 0x3a6ea5 },
  sink_station:        { cat: 'station', base: 0xd6dbe0, accent: 0x8fb3c4 },
  fume_hood:           { cat: 'station', base: 0xc8d0d4, accent: 0x8fb3c4 },
  // Stations
  nurse_station:       { cat: 'station', base: 0xd8c9a8, accent: 0x4a90b8, prop: 'monitor' },
  triage_desk:         { cat: 'station', base: 0xc7b490, accent: 0x4a90b8, prop: 'paper' },
  coffee_station:      { cat: 'station', base: 0x9a7d52, accent: 0x6b4a2f },
  // Beds
  patient_bay:         { cat: 'bed', base: 0xcfd4da, accent: 0xadd8e6 },
  gurney:              { cat: 'bed', base: 0xbfc6cc, accent: 0x6fae8f },
  bed:                 { cat: 'bed', base: 0xcfd4da, accent: 0xadd8e6 },
  // Seating
  couch:               { cat: 'seating', base: 0x6a5c8a, accent: 0x8574a8 },
  bench:               { cat: 'seating', base: 0x7d6a4a, accent: 0x9a8360 },
  chairs:              { cat: 'seating', base: 0x4a6fa5, accent: 0x6a8fc5 },
  // Tall cabinets
  filing_cabinet:      { cat: 'tall_cabinet', base: 0x9aa0a8, accent: 0x6a7078 },
  locked_cabinet:      { cat: 'tall_cabinet', base: 0x6a7078, accent: 0xd0a030 },
  // Appliances
  specimen_fridge:     { cat: 'appliance', base: 0xd0e4e8, accent: 0x5a8fa5 },
  open_fridge:         { cat: 'appliance', base: 0xdadfe4, accent: 0x8fb3c4 },
  bio_cabinet:         { cat: 'appliance', base: 0xc8d4c8, accent: 0xf0a030 },
  centrifuge:          { cat: 'appliance', base: 0xcfd4da, accent: 0x4a90b8 },
  autoclave:           { cat: 'appliance', base: 0xbfc6cc, accent: 0x8a9098 },
  scanner_station:     { cat: 'appliance', base: 0x8a9098, accent: 0x39c0e0 },
  shredder_station:    { cat: 'appliance', base: 0x5a606a, accent: 0xf0a030 },
  printer_station:     { cat: 'appliance', base: 0x8a9098, accent: 0x39c0e0 },
  crash_cart:          { cat: 'appliance', base: 0xd03a3a, accent: 0xf0f0f0 },
  equipment:           { cat: 'appliance', base: 0x8a9098, accent: 0x39c0e0 },
  microscope_station:  { cat: 'appliance', base: 0x9aa0a8, accent: 0x3a3f4a },
  info_kiosk:          { cat: 'appliance', base: 0x3a6ea5, accent: 0x39c0e0 },
  // Banks
  vending_machine:     { cat: 'bank', base: 0x8a2a3a, accent: 0x39c0e0 },
  server_rack:         { cat: 'bank', base: 0x2a2e36, accent: 0x39e070 },
  // Shelves
  chemical_shelf:      { cat: 'shelf', base: 0x9a8360, accent: 0x6fae8f },
  sample_rack:         { cat: 'shelf', base: 0xa8a8b0, accent: 0xd03a5a },
  results_board:       { cat: 'shelf', base: 0x2c3a30, accent: 0xf4f4f0 },
  notice_board:        { cat: 'shelf', base: 0x6b4a2f, accent: 0xf4f4f0 },
  bulletin_board:      { cat: 'shelf', base: 0x6b4a2f, accent: 0xf4f4f0 },
  magazine_rack:       { cat: 'shelf', base: 0x7d6a4a, accent: 0xd06a4a },
  // Partitions
  curtain_partition:   { cat: 'partition', base: 0x6fae8f, accent: 0x9ad0b8 },
  privacy_screen:      { cat: 'partition', base: 0x4a6fa5, accent: 0x8fb3c4 },
  // Mats
  welcome_mat:         { cat: 'mat', base: 0x4a6fa5, accent: 0xf0e6c8 },
  cable_tray:          { cat: 'mat', base: 0x3a3f4a, accent: 0xf0a030 },
  // Planter
  plant:               { cat: 'planter', base: 0x8a5a2f, accent: 0x3a8a4a },
};

export function hasComposite(type?: string): boolean {
  return !!type && type in STYLES;
}

export function drawCompositeFurniture(
  scene: Phaser.Scene,
  type: string | undefined,
  tileX: number, tileY: number, wTiles: number, hTiles: number,
): boolean {
  const style = type ? STYLES[type] : undefined;
  if (!style) return false;

  const x = tileX * TILE, y = tileY * TILE, w = wTiles * TILE, h = hTiles * TILE;
  const g = scene.add.graphics().setDepth(3);

  // Grounded contact shadow — soft ellipse hugging the object's base.
  if (style.cat !== 'mat' && style.cat !== 'shelf' && style.cat !== 'partition') {
    scene.add.ellipse(x + w / 2, y + h - 3, w - 4, Math.max(9, h * 0.26), 0x000000, 0.20).setDepth(2);
  }

  switch (style.cat) {
    case 'surface':     drawSurface(g, x, y, w, h, style); break;
    case 'station':     drawStation(g, x, y, w, h, style); break;
    case 'bed':         drawBed(g, x, y, w, h, style); break;
    case 'seating':     drawSeating(g, x, y, w, h, style); break;
    case 'tall_cabinet':drawTallCabinet(g, x, y, w, h, style); break;
    case 'appliance':   drawAppliance(g, x, y, w, h, style); break;
    case 'bank':        drawBank(g, x, y, w, h, style, type!); break;
    case 'shelf':       drawShelf(g, x, y, w, h, style); break;
    case 'partition':   drawPartition(g, x, y, w, h, style); break;
    case 'mat':         drawMat(g, x, y, w, h, style); break;
    case 'planter':     drawPlanter(g, x, y, w, h, style); break;
  }
  return true;
}

// ── Shared 3D primitive ──────────────────────────────────────────────────────
/**
 * An extruded box: lit top, darker vertical FRONT FACE (thickness), right-side
 * shadow, base contact line. `faceH` = px of visible front face at the bottom.
 * This is what turns a flat rectangle into a volume.
 */
function extrudedBox(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number, base: number, faceH: number,
) {
  const top = base;
  const topLit = lighten(base, 22);
  const front = darken(base, 34);
  const frontDark = darken(base, 50);
  const sideShadow = darken(base, 20);
  const bodyH = h - faceH;

  // silhouette
  g.fillStyle(0x141414, 1);
  g.fillRect(x - 1, y - 1, w + 2, h + 2);

  // body (top surface, seen at a slight 3/4 tilt)
  g.fillStyle(top, 1);
  g.fillRect(x, y, w, bodyH);
  // top-edge sheen (light rolls off the back edge)
  g.fillStyle(topLit, 1);
  g.fillRect(x, y, w, 2);
  g.fillRect(x, y, 2, bodyH);
  // right-side shadow
  g.fillStyle(sideShadow, 1);
  g.fillRect(x + w - 2, y, 2, bodyH);

  // top-surface texture — faint grain + a soft diagonal sheen so the lit face
  // reads as a material, not a flat color fill.
  if (bodyH >= 8) {
    g.fillStyle(topLit, 0.18);
    for (let gy = y + 4; gy < y + bodyH - 2; gy += 5) g.fillRect(x + 2, gy, w - 4, 1);
    g.fillStyle(lighten(base, 30), 0.12);
    g.fillRect(x + 3, y + 3, Math.round(w * 0.4), 2);            // corner glint
  }

  // front edge seam — the lip where the top meets the vertical face
  g.fillStyle(lighten(base, 8), 1);
  g.fillRect(x, y + bodyH - 2, w, 2);

  // front face (vertical, darker → reads as depth/thickness)
  g.fillStyle(front, 1);
  g.fillRect(x, y + bodyH, w, faceH);
  // front-face panel seams — vertical ticks break up the dark band
  if (faceH >= 6) {
    g.fillStyle(frontDark, 0.5);
    for (let sx = x + Math.round(TILE * 0.9); sx < x + w - 3; sx += Math.round(TILE)) g.fillRect(sx, y + bodyH + 1, 1, faceH - 2);
    g.fillStyle(lighten(front, 12), 0.35);
    g.fillRect(x + 1, y + bodyH, w - 2, 1);                      // top of face catches a little light
  }
  g.fillStyle(darken(front, 8), 1);
  g.fillRect(x + w - 2, y + bodyH, 2, faceH);      // face right edge
  g.fillStyle(frontDark, 1);
  g.fillRect(x, y + h - 2, w, 2);                    // base contact line
}

// ── Surfaces (desks / counters / benches) ────────────────────────────────────
function drawSurface(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const faceH = Math.min(16, Math.round(h * 0.5));
  const inset = 3;
  extrudedBox(g, x + inset, y + Math.round(h * 0.14), w - inset * 2, h - Math.round(h * 0.14) - 4, s.base, faceH);

  // visible legs peeking below the front face at each end
  const legY = y + h - 4;
  g.fillStyle(darken(s.base, 52), 1);
  g.fillRect(x + inset + 2, legY, 5, 5);
  g.fillRect(x + w - inset - 7, legY, 5, 5);

  // props line the lit top
  const topY = y + Math.round(h * 0.14);
  drawProps(g, x, topY, w, s);
}

// ── Stations (deep counter + back cabinet) ───────────────────────────────────
function drawStation(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const { base, accent } = s;
  // back cabinet band (upper third) — its own little volume
  const backH = Math.round(h * 0.36);
  extrudedBox(g, x + 2, y + 2, w - 4, backH, darken(base, 12), Math.round(backH * 0.4));
  // cabinet door seams + a sign strip
  g.fillStyle(darken(base, 40), 1);
  for (let dx = x + Math.round(TILE); dx < x + w - 6; dx += Math.round(TILE * 1.2)) g.fillRect(dx, y + 5, 1, Math.round(backH * 0.55));
  if (accent) { g.fillStyle(accent, 0.9); g.fillRect(x + 6, y + 5, Math.min(w - 12, TILE), 3); }

  // front worktop — the main counter volume
  const wtY = y + backH + 3;
  const faceH = Math.min(15, Math.round((h - backH) * 0.55));
  extrudedBox(g, x + 2, wtY, w - 4, y + h - 4 - wtY, base, faceH);
  drawProps(g, x, wtY, w, s);
}

// ── Beds ─────────────────────────────────────────────────────────────────────
function drawBed(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const frame = darken(s.base, 6);
  const frameDark = darken(frame, 42);
  const frameLight = lighten(frame, 26);
  const blanket = s.accent ?? 0xadd8e6;
  const vertical = h >= w;
  const shrink = vertical ? Math.round(w * 0.12) : Math.round(h * 0.12);
  const bx = x + 3 + (vertical ? shrink : 0);
  const by = y + 3 + (vertical ? 0 : shrink);
  const bw = w - 6 - (vertical ? shrink * 2 : 0);
  const bh = h - 6 - (vertical ? 0 : shrink * 2);

  // frame with a real side face at the foot so the bed sits up off the floor
  const sideH = 5;
  g.fillStyle(0x161616, 1); g.fillRect(bx - 1, by - 1, bw + 2, bh + sideH + 1);
  g.fillStyle(frame, 1); g.fillRect(bx, by, bw, bh);
  g.fillStyle(frameLight, 1); g.fillRect(bx, by, bw, 2); g.fillRect(bx, by, 2, bh);
  g.fillStyle(frameDark, 1); g.fillRect(bx + bw - 2, by, 2, bh);
  // vertical foot/side face (darker → thickness)
  g.fillStyle(darken(frame, 30), 1); g.fillRect(bx, by + bh, bw, sideH);
  g.fillStyle(lighten(frame, 6), 1); g.fillRect(bx, by + bh, bw, 1);       // top lip of the side
  g.fillStyle(darken(frame, 48), 1); g.fillRect(bx, by + bh + sideH - 1, bw, 1);

  const m = 3, mx = bx + m, my = by + m, mw = bw - m * 2, mh = bh - m * 2;
  if (vertical) {
    g.fillStyle(frameDark, 1); g.fillRect(bx + 2, by + 1, bw - 4, 3);      // headboard
    g.fillStyle(0xf6f8fa, 1); g.fillRect(mx, my + 3, mw, mh - 3);          // mattress
    g.fillStyle(0xe1e6ea, 1); g.fillRect(mx + mw - 2, my + 3, 2, mh - 3);
    g.fillStyle(0xffffff, 1); g.fillRect(mx + 2, my + 4, mw - 4, Math.round(mh * 0.24)); // pillow
    g.fillStyle(0xdadfe4, 1); g.fillRect(mx + 2, my + 4 + Math.round(mh * 0.24), mw - 4, 1);
    g.fillStyle(blanket, 1); g.fillRect(mx, my + Math.round(mh * 0.42), mw, mh - Math.round(mh * 0.42) - 1);
    g.fillStyle(lighten(blanket, 22), 1); g.fillRect(mx, my + Math.round(mh * 0.42), mw, 2);
    g.fillStyle(darken(blanket, 18), 1); g.fillRect(mx, my + Math.round(mh * 0.66), mw, 1);
    g.fillStyle(0xbfc6cc, 1);                                              // side rails
    g.fillRect(bx - 1, by + Math.round(bh * 0.4), 2, Math.round(bh * 0.35));
    g.fillRect(bx + bw - 1, by + Math.round(bh * 0.4), 2, Math.round(bh * 0.35));
  } else {
    g.fillStyle(frameDark, 1); g.fillRect(bx + 1, by + 2, 3, bh - 4);
    g.fillStyle(0xf6f8fa, 1); g.fillRect(mx + 3, my, mw - 3, mh);
    g.fillStyle(0xffffff, 1); g.fillRect(mx + 4, my + 2, Math.round(mw * 0.24), mh - 4);
    g.fillStyle(blanket, 1); g.fillRect(mx + Math.round(mw * 0.42), my, mw - Math.round(mw * 0.42), mh);
    g.fillStyle(lighten(blanket, 22), 1); g.fillRect(mx + Math.round(mw * 0.42), my, 2, mh);
  }
  g.fillStyle(0x242424, 1); g.fillRect(bx + 2, by + bh + sideH, 4, 3); g.fillRect(bx + bw - 6, by + bh + sideH, 4, 3);
}

// ── Seating (couch / bench) — backrest + bulging cushions + armrests ─────────
function drawSeating(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const { base } = s;
  const cushion = s.accent ?? lighten(base, 18);
  const armW = Math.max(6, Math.round(w * 0.09));
  const backH = Math.round(h * 0.34);
  const bx = x + 2, bw = w - 4;

  // silhouette
  g.fillStyle(0x161616, 1); g.fillRect(bx - 1, y + 2, bw + 2, h - 4);

  // backrest slab (sits at the back/top) with its own thickness
  g.fillStyle(darken(base, 12), 1); g.fillRect(bx, y + 3, bw, backH);
  g.fillStyle(lighten(base, 20), 1); g.fillRect(bx, y + 3, bw, 2);         // top light
  g.fillStyle(darken(base, 30), 1); g.fillRect(bx, y + 3 + backH - 2, bw, 2); // under-lip shadow

  // seat base front skirt (dark, gives the couch height)
  g.fillStyle(darken(base, 40), 1); g.fillRect(bx + armW - 2, y + h - 8, bw - (armW - 2) * 2, 6);
  g.fillStyle(darken(base, 55), 1); g.fillRect(bx + armW - 2, y + h - 3, bw - (armW - 2) * 2, 2);

  // seat cushions — bulging blocks between the arms
  const seatTop = y + backH + 1;
  const seatBottom = y + h - 8;
  const innerX = bx + armW, innerW = bw - armW * 2;
  const seats = Math.max(1, Math.round(w / TILE));
  const cw = innerW / seats;
  for (let i = 0; i < seats; i++) {
    const cx = Math.round(innerX + i * cw) + 1;
    const cwi = Math.round(cw) - 2;
    g.fillStyle(darken(cushion, 22), 1); g.fillRect(cx, seatTop, cwi, seatBottom - seatTop);       // cushion body
    g.fillStyle(cushion, 1); g.fillRect(cx, seatTop, cwi, Math.round((seatBottom - seatTop) * 0.6));// lit upper bulge
    g.fillStyle(lighten(cushion, 22), 1); g.fillRect(cx + 1, seatTop + 1, cwi - 2, 2);              // top highlight
    g.fillStyle(darken(cushion, 34), 1); g.fillRect(cx, seatBottom - 2, cwi, 2);                    // seam shadow
  }

  // armrests — raised rounded blocks at each end, front of the backrest
  for (const ax of [bx, bx + bw - armW]) {
    g.fillStyle(darken(base, 6), 1); g.fillRect(ax, y + Math.round(backH * 0.5), armW, h - Math.round(backH * 0.5) - 4);
    g.fillStyle(lighten(base, 24), 1); g.fillRect(ax, y + Math.round(backH * 0.5), armW, 3);        // arm top
    g.fillStyle(darken(base, 30), 1); g.fillRect(ax + armW - 2, y + Math.round(backH * 0.5), 2, h - Math.round(backH * 0.5) - 6);
  }
}

// ── Tall filing cabinet — drawers with pull recesses ─────────────────────────
function drawTallCabinet(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const { base } = s;
  extrudedBox(g, x + 3, y + 3, w - 6, h - 6, base, 4);
  const bx = x + 3, bw = w - 6;
  const drawers = Math.max(2, Math.round(h / TILE) + 1);
  const dh = (h - 12) / drawers;
  for (let i = 0; i < drawers; i++) {
    const dy = y + 5 + i * dh;
    g.fillStyle(lighten(base, 12), 1); g.fillRect(bx + 2, Math.round(dy), bw - 4, 2);          // drawer top light
    g.fillStyle(darken(base, 34), 1); g.fillRect(bx + 2, Math.round(dy + dh - 3), bw - 4, 2);  // seam shadow
    // recessed pull
    g.fillStyle(darken(base, 45), 1); g.fillRect(x + Math.round(w / 2) - 6, Math.round(dy + dh / 2) - 1, 12, 4);
    g.fillStyle(s.accent ?? 0x888888, 1); g.fillRect(x + Math.round(w / 2) - 5, Math.round(dy + dh / 2), 10, 2);
  }
}

// ── Appliance (single standing box) ──────────────────────────────────────────
function drawAppliance(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const { base, accent } = s;
  extrudedBox(g, x + 3, y + 3, w - 6, h - 6, base, Math.min(8, Math.round(h * 0.16)));
  const bx = x + 3, by = y + 3, bw = w - 6, bh = h - 6;
  // door split
  g.fillStyle(darken(base, 38), 1); g.fillRect(x + Math.round(w / 2), by + 2, 1, bh - 8);
  // control panel / indicator light
  if (accent) {
    g.fillStyle(darken(accent, 20), 1); g.fillRect(bx + 3, by + 3, Math.min(bw - 6, 16), 8);
    g.fillStyle(accent, 1); g.fillRect(bx + 4, by + 4, Math.min(bw - 8, 14), 5);
    g.fillStyle(lighten(accent, 35), 1); g.fillRect(bx + 4, by + 4, 4, 2);
  }
  // handle
  g.fillStyle(darken(base, 24), 1); g.fillRect(x + Math.round(w / 2) - 6, by + Math.round(bh / 2), 3, 9);
  g.fillStyle(lighten(base, 10), 1); g.fillRect(x + Math.round(w / 2) - 6, by + Math.round(bh / 2), 1, 9);
}

// ── Bank of repeating units (servers, vending) ───────────────────────────────
function drawBank(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style, type: string) {
  const { base, accent } = s;
  const units = Math.max(1, Math.round(w / TILE));
  const uw = w / units;
  for (let i = 0; i < units; i++) {
    const ux = x + i * uw;
    extrudedBox(g, ux + 2, y + 3, uw - 3, h - 6, base, Math.min(7, Math.round(h * 0.12)));
    if (type === 'server_rack') {
      for (let sy = y + 8; sy < y + h - 8; sy += 6) {
        g.fillStyle(0x0a0a0a, 1); g.fillRect(ux + 5, sy, uw - 9, 4);
        g.fillStyle((sy + i) % 2 === 0 ? (accent ?? 0x39e070) : 0xf0a030, 1); g.fillRect(ux + 6, sy + 1, 2, 2);
        g.fillStyle(0x39c0e0, 1); g.fillRect(ux + 9, sy + 1, 2, 2);
      }
    } else {
      const glassX = ux + 5, glassW = Math.round((uw - 8) * 0.66), glassBottom = y + h - 16;
      g.fillStyle(0x0e161c, 1); g.fillRect(glassX, y + 8, glassW, glassBottom - (y + 8));
      const prod = [0xe0d040, 0xd0503a, 0x40a0d0, 0x50c070, 0xe08030];
      let row = 0;
      for (let py = y + 11; py < glassBottom - 4; py += 7, row++) {
        const cols = Math.max(2, Math.round(glassW / 8));
        for (let c = 0; c < cols; c++) { g.fillStyle(prod[(row + c) % prod.length], 1); g.fillRect(glassX + 2 + c * ((glassW - 4) / cols), py, Math.max(3, (glassW - 6) / cols), 4); }
        g.fillStyle(0x0a1015, 0.5); g.fillRect(glassX + 1, py + 5, glassW - 2, 1);
      }
      g.fillStyle(0xffffff, 0.10); g.fillRect(glassX + 2, y + 9, 3, glassBottom - (y + 11));
      const stripX = glassX + glassW + 2, stripW = ux + uw - 3 - stripX;
      g.fillStyle(darken(base, 18), 1); g.fillRect(stripX, y + 8, stripW, glassBottom - (y + 8));
      for (let by = y + 11; by < glassBottom - 3; by += 6) { g.fillStyle(0xf0d040, 1); g.fillRect(stripX + 2, by, Math.max(2, stripW - 4), 3); }
      g.fillStyle(0x0a0a0a, 1); g.fillRect(glassX, y + h - 14, glassW, 6);
    }
  }
}

// ── Wall shelf / board ───────────────────────────────────────────────────────
function drawShelf(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const { base, accent } = s;
  const bh = Math.min(h, Math.max(18, Math.round(h * 0.82)));
  g.fillStyle(0x161616, 1); g.fillRect(x + 2, y + 2, w - 4, bh);
  g.fillStyle(base, 1); g.fillRect(x + 3, y + 3, w - 6, bh - 2);
  g.fillStyle(lighten(base, 24), 1); g.fillRect(x + 3, y + 3, w - 6, 2);
  g.fillStyle(darken(base, 30), 1); g.fillRect(x + 3, y + bh - 1, w - 6, 2);
  g.fillStyle(darken(base, 20), 1); g.fillRect(x + 3, y + 3, 2, bh - 2);
  if (accent) {
    const cols = Math.max(2, Math.round(w / 24));
    for (let c = 0; c < cols; c++) {
      const cx = x + 6 + Math.round((w - 12) * (c / cols));
      const cwi = Math.max(6, Math.round((w - 12) / cols) - 6);
      g.fillStyle(c % 2 === 0 ? accent : lighten(accent, 25), 1); g.fillRect(cx, y + 6, cwi, bh - 10);
      g.fillStyle(lighten(accent, 35), 1); g.fillRect(cx, y + 6, cwi, 1);
    }
  }
}

// ── Vertical curtain / privacy screen ────────────────────────────────────────
function drawPartition(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const { base } = s;
  const light = lighten(base, 25), dark = darken(base, 25);
  g.fillStyle(0x8a8a8a, 1); g.fillRect(x + 3, y + 2, w - 6, 3);          // rail
  const fabX = x + 4, fabW = w - 8;
  g.fillStyle(base, 1); g.fillRect(fabX, y + 5, fabW, h - 8);
  for (let fx = fabX; fx < fabX + fabW; fx += 6) {
    g.fillStyle(light, 0.7); g.fillRect(fx, y + 5, 2, h - 8);
    g.fillStyle(dark, 0.5); g.fillRect(fx + 4, y + 5, 1, h - 8);
  }
  g.fillStyle(dark, 0.6); g.fillRect(fabX, y + h - 4, fabW, 2);          // hem
}

// ── Floor decal — mat / cable run ────────────────────────────────────────────
function drawMat(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const { base, accent } = s;
  g.fillStyle(darken(base, 22), 0.9); g.fillRect(x + 2, y + 3, w - 4, h - 6);
  g.fillStyle(base, 0.9); g.fillRect(x + 4, y + 5, w - 8, h - 10);
  if (accent) { g.fillStyle(accent, 0.9); g.fillRect(x + 7, y + Math.round(h / 2) - 1, w - 14, 2); }
}

// ── Planter — pot with rim depth + layered foliage ───────────────────────────
function drawPlanter(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, s: Style) {
  const potBase = s.base, foliage = s.accent ?? 0x3a8a4a;
  const cx = x + w / 2;
  g.fillStyle(darken(foliage, 28), 1); g.fillCircle(cx, y + h * 0.4, w * 0.34);
  g.fillStyle(foliage, 1); g.fillCircle(cx - w * 0.1, y + h * 0.34, w * 0.24); g.fillCircle(cx + w * 0.12, y + h * 0.42, w * 0.2);
  g.fillStyle(lighten(foliage, 26), 1); g.fillCircle(cx - w * 0.05, y + h * 0.3, w * 0.11);
  const pw = w * 0.46, ph = h * 0.34, ptop = y + h - ph - 3;
  g.fillStyle(0x161616, 1); g.fillRect(cx - pw / 2 - 1, ptop - 1, pw + 2, ph + 2);
  g.fillStyle(potBase, 1); g.fillRect(cx - pw / 2, ptop, pw, ph);
  g.fillStyle(lighten(potBase, 26), 1); g.fillRect(cx - pw / 2, ptop, pw, 3);            // rim light
  g.fillStyle(darken(potBase, 20), 1); g.fillRect(cx - pw / 2, ptop + 4, pw, 1);         // rim under-shadow
  g.fillStyle(darken(potBase, 34), 1); g.fillRect(cx + pw / 2 - 2, ptop, 2, ph);         // side shadow
  g.fillStyle(darken(potBase, 44), 1); g.fillRect(cx - pw / 2, y + h - 4, pw, 2);        // base
}

// ── Props on top of surfaces ─────────────────────────────────────────────────
function drawProps(g: Phaser.GameObjects.Graphics, x: number, topY: number, w: number, s: Style) {
  if (!s.prop || s.prop === 'none') return;
  const count = Math.max(1, Math.round(w / TILE));
  const step = w / count;
  for (let i = 0; i < count; i++) {
    const cx = Math.round(x + step * (i + 0.5));
    const baseY = topY - 1;
    switch (s.prop) {
      case 'monitor':
        g.fillStyle(0x161616, 1); g.fillRect(cx - 7, baseY - 11, 14, 12);
        g.fillStyle(s.accent ?? 0x39c0e0, 0.95); g.fillRect(cx - 5, baseY - 9, 10, 8);
        g.fillStyle(lighten(s.accent ?? 0x39c0e0, 30), 0.9); g.fillRect(cx - 5, baseY - 9, 4, 2);
        g.fillStyle(0x2a2a2a, 1); g.fillRect(cx - 2, baseY, 4, 2); break;
      case 'paper':
        g.fillStyle(0x000000, 0.25); g.fillRect(cx - 4, baseY - 3, 9, 5);
        g.fillStyle(0xffffff, 1); g.fillRect(cx - 5, baseY - 5, 9, 6);
        g.fillStyle(0x3a5a9a, 1); g.fillRect(cx - 4, baseY - 4, 6, 1); g.fillRect(cx - 4, baseY - 2, 5, 1); break;
      case 'beaker': {
        const col = [0xd03a5a, 0x3a90d0, 0x3ad07a][i % 3];
        g.fillStyle(0xbfe0e0, 0.7); g.fillRect(cx - 3, baseY - 9, 6, 9);
        g.fillStyle(col, 1); g.fillRect(cx - 3, baseY - 3, 6, 3);
        g.fillStyle(0xffffff, 0.6); g.fillRect(cx - 2, baseY - 8, 1, 6); break;
      }
      case 'tray':
        g.fillStyle(0xd8d8d8, 1); g.fillRect(cx - 6, baseY - 3, 12, 4);
        g.fillStyle(0xb04a3a, 1); g.fillRect(cx - 4, baseY - 2, 4, 2);
        g.fillStyle(0x4a8a4a, 1); g.fillRect(cx + 1, baseY - 2, 3, 2); break;
    }
  }
}
