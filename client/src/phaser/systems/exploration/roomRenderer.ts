import Phaser from 'phaser';
import { furnitureTextureKey } from '../../sprites/furniture';
import { drawCompositeFurniture, hasComposite } from './compositeFurniture';
import type { Room } from '@shared/schema';

const TILE = 32;

// ── Per-room floor style configuration ───────────────────────────────────────
// Each entry holds the four tile shade variants (checkerboard 2x2 pattern),
// a bevel-highlight colour and a bevel-shadow/grout colour.
const FLOOR_STYLES = {
  er: {
    tileShades: [0xd8e0e4, 0xd0d8de, 0xc8d2d8, 0xdce4e8],
    highlightColor: 0xe8f0f4,
    shadowColor: 0xa8b4bc,
  },
  lab: {
    tileShades: [0xd4e0d4, 0xccdbcc, 0xc4d4c4, 0xdce8dc],
    highlightColor: 0xe8f4e8,
    shadowColor: 0xa4b4a4,
  },
  it: {
    tileShades: [0x8890a0, 0x848c9c, 0x808898, 0x8c94a4],
    highlightColor: 0x98a0b0,
    shadowColor: 0x686e80,
  },
  break: {
    tileShades: [0xd8c4a0, 0xd4c09c, 0xd0bc98, 0xdcc8a4],
    highlightColor: 0xe8d8b8,
    shadowColor: 0xb8a880,
  },
  records: {
    tileShades: [0xb8b4a0, 0xb4b09c, 0xb0ac98, 0xbcb8a4],
    highlightColor: 0xc8c4b0,
    shadowColor: 0x989488,
  },
  entrance: {
    tileShades: [0xe0dcd4, 0xdcd8d0, 0xd8d4cc, 0xe4e0d8],
    highlightColor: 0xf0ece4,
    shadowColor: 0xc0bcb4,
  },
  // Reception: warm cream porcelain — reads as 64px slabs, not individual tiles
  reception: {
    tileShades: [0xe2d8c4, 0xded4c0, 0xdad0bc, 0xe6dcc8],
    highlightColor: 0xf2e8d4,
    shadowColor: 0xbeb49e,
  },
  // Hallways: slightly cooler/dimmer beige base — runner strip added post-loop
  hallway: {
    tileShades: [0xccc2a6, 0xc8bea2, 0xc4ba9e, 0xd0c6aa],
    highlightColor: 0xdcd2b6,
    shadowColor: 0xaaa092,
  },
  default: {
    tileShades: [0xd4c9a8, 0xd0c5a4, 0xccc0a0, 0xd8cdb0],
    highlightColor: 0xe2d8bc,
    shadowColor: 0xb8ad94,
  },
} as const;

type FloorStyleKey = keyof typeof FLOOR_STYLES;

/** Map a room id to its floor style key.
 *  Order matters: 'hallway' is checked FIRST so 'hallway_reception_break'
 *  resolves to 'hallway' rather than 'reception' or 'break'. */
function floorStyleFor(roomId: string): FloorStyleKey {
  if (roomId.includes('hallway'))                                 return 'hallway';
  if (roomId.includes('er') || roomId.includes('emergency'))     return 'er';
  if (roomId.includes('lab'))                                     return 'lab';
  if (roomId.includes('it') || roomId.includes('server'))        return 'it';
  if (roomId.includes('break'))                                   return 'break';
  if (roomId.includes('records'))                                 return 'records';
  if (roomId.includes('entrance') || roomId.includes('lobby'))   return 'entrance';
  if (roomId.includes('reception'))                               return 'reception';
  return 'default';
}
// ─────────────────────────────────────────────────────────────────────────────

// Ensure player_down texture exists (fallback if BootScene hasn't generated it yet)
// Matches SpriteFactory drawCharacter() chibi style — blue shirt, brown hair "new employee"
export function ensurePlayerFallbackTexture(scene: Phaser.Scene): void {
  if (!scene.textures.exists('player_down')) {
    const g = scene.add.graphics();
    const SKIN = 0xfdbcb4;
    const SKIN_SHADOW = 0xdba49c;  // darken(SKIN, 30)
    const SKIN_HIGHLIGHT = 0xffd0ce; // lighten(SKIN, 20)
    const HAIR = 0x8b4513;
    const HAIR_LIGHT = 0xa85d2c;   // lighten(HAIR, 25)
    const HAIR_DARK = 0x6a2400;    // darken(HAIR, 35)
    const SHIRT = 0x4a90e2;
    const SHIRT_LIGHT = 0x6daaf7;  // lighten(SHIRT, 25)
    const SHIRT_DARK = 0x2a70c2;   // darken(SHIRT, 30)

    // Hair (chibi head — slightly larger)
    g.fillStyle(HAIR);
    g.fillRect(10, 3, 12, 5);   // top hair mass
    g.fillRect(9, 5, 2, 5);     // left sideburns
    g.fillRect(21, 5, 2, 5);    // right sideburns
    // Hair highlight (top-left)
    g.fillStyle(HAIR_LIGHT);
    g.fillRect(11, 3, 3, 1);
    g.fillRect(10, 4, 1, 2);
    // Hair shadow (bottom-right)
    g.fillStyle(HAIR_DARK);
    g.fillRect(21, 4, 1, 4);
    g.fillRect(18, 7, 4, 1);

    // Head (larger chibi face)
    g.fillStyle(SKIN);
    g.fillRect(11, 5, 10, 9);
    // Face highlight (left edge)
    g.fillStyle(SKIN_HIGHLIGHT);
    g.fillRect(11, 6, 1, 7);
    // Face shadow (right edge + chin)
    g.fillStyle(SKIN_SHADOW);
    g.fillRect(20, 6, 1, 7);
    g.fillRect(12, 13, 8, 1);

    // Eyes with white sparkle
    g.fillStyle(0x000000);
    g.fillRect(13, 9, 2, 2);    // left eye
    g.fillRect(17, 9, 2, 2);    // right eye
    g.fillStyle(0xffffff);
    g.fillRect(13, 9, 1, 1);    // left sparkle
    g.fillRect(17, 9, 1, 1);    // right sparkle

    // Mouth
    g.fillStyle(0xd4937a);       // darken(SKIN, 45)
    g.fillRect(15, 12, 2, 1);

    // Neck
    g.fillStyle(SKIN);
    g.fillRect(14, 14, 4, 1);
    g.fillStyle(SKIN_SHADOW);
    g.fillRect(17, 14, 1, 1);

    // Shirt body
    g.fillStyle(SHIRT);
    g.fillRect(10, 15, 12, 9);
    // Shirt highlight (left edge)
    g.fillStyle(SHIRT_LIGHT);
    g.fillRect(10, 15, 1, 8);
    // Shirt shadow (right edge + bottom)
    g.fillStyle(SHIRT_DARK);
    g.fillRect(21, 15, 1, 9);
    g.fillRect(11, 23, 10, 1);
    // Arms / sleeves
    g.fillStyle(SHIRT);
    g.fillRect(7, 16, 3, 6);
    g.fillRect(22, 16, 3, 6);
    g.fillStyle(SHIRT_DARK);
    g.fillRect(9, 16, 1, 6);
    g.fillRect(24, 16, 1, 6);
    // Hands
    g.fillStyle(SKIN);
    g.fillRect(7, 22, 3, 2);
    g.fillRect(22, 22, 3, 2);

    // Pants
    g.fillStyle(0x333333);
    g.fillRect(11, 24, 4, 4);
    g.fillRect(17, 24, 4, 4);

    // Two-toned shoes
    g.fillStyle(0x5d4037);        // shoe base (dark brown)
    g.fillRect(11, 28, 4, 2);
    g.fillRect(17, 28, 4, 2);
    g.fillStyle(0x8d6e63);        // shoe highlight (lighter brown)
    g.fillRect(11, 28, 4, 1);
    g.fillRect(17, 28, 4, 1);

    g.generateTexture('player_down', TILE, TILE);
    g.destroy();
  }
}

export function renderRoom(scene: Phaser.Scene, room: Room): { walls: Phaser.Physics.Arcade.StaticGroup } {
  const w = room.width * TILE;
  const h = room.height * TILE;

  // ── Floor — beveled hospital tiles with room-specific color variation ──
  const floor = scene.add.graphics();
  const roomId = room.id.toLowerCase();
  const floorStyle = FLOOR_STYLES[floorStyleFor(roomId)];
  const { tileShades, highlightColor, shadowColor } = floorStyle;

  // Pre-compute door tiles for ER accent ring and contact-shadow exclusions
  const doors: Array<{ x: number; y: number }> = (room as any).doors || [];

  for (let y = 0; y < room.height; y++) {
    for (let x = 0; x < room.width; x++) {
      const shadeIdx = ((x % 2) + (y % 2) * 2) % tileShades.length;
      const shade = tileShades[shadeIdx];
      const px = x * TILE;
      const py = y * TILE;

      // Fill tile base
      floor.fillStyle(shade, 1);
      floor.fillRect(px, py, TILE, TILE);

      // 1px highlight on top and left edges (beveled look)
      floor.fillStyle(highlightColor, 0.5);
      floor.fillRect(px, py, TILE, 1);       // top edge
      floor.fillRect(px, py, 1, TILE);        // left edge

      // 1px shadow on bottom and right edges
      floor.fillStyle(shadowColor, 0.5);
      floor.fillRect(px, py + TILE - 1, TILE, 1); // bottom edge
      floor.fillRect(px + TILE - 1, py, 1, TILE);  // right edge

      // Subtle inner cross pattern on every other tile (linoleum texture)
      // — Skipped for reception (large-format tile illusion uses 2x2 grout instead)
      if ((x + y) % 2 === 0 && !roomId.includes('reception') && !roomId.includes('hallway')) {
        floor.fillStyle(highlightColor, 0.15);
        floor.fillRect(px + 8, py + 2, 16, 1);  // horizontal line
        floor.fillRect(px + 14, py + 2, 1, 28);  // vertical line
      }

      // Specular highlight on ~20% of tiles (polished floor gleam)
      const hashVal = ((x * 7 + y * 13 + 37) * 2654435761) >>> 0;
      if (hashVal % 5 === 0) {
        floor.fillStyle(0xffffff, 0.08);
        floor.fillRect(px + 6 + (hashVal % 12), py + 4 + (hashVal % 10) % 8, 4, 2);
      }

      // Grout lines (thin dark lines between tiles)
      // Reception uses large-format (2x2) grout only at slab boundaries
      if (roomId.includes('reception')) {
        // Large-format tile illusion — grout only at every 2nd boundary
        floor.fillStyle(shadowColor, 0.35);
        if (x % 2 === 1) {
          floor.fillRect(px + TILE - 1, py, 1, TILE); // right grout on odd x
        }
        if (y % 2 === 1) {
          floor.fillRect(px, py + TILE - 1, TILE, 1); // bottom grout on odd y
        }
      } else {
        floor.fillStyle(shadowColor, 0.3);
        floor.fillRect(px + TILE - 1, py, 1, TILE); // right grout
        floor.fillRect(px, py + TILE - 1, TILE, 1); // bottom grout
      }

      // Room-specific floor pattern detail (boosted opacity for visibility)
      if (roomId.includes('er') || roomId.includes('emergency')) {
        // ER: Non-slip diamond pattern — visible safety texture
        if ((x + y) % 2 === 0) {
          floor.fillStyle(0xffffff, 0.12);
          floor.fillRect(px + 10, py + 10, 12, 1);
          floor.fillRect(px + 15, py + 5, 1, 12);
        }
        // ER: pale red accent ring near door tiles (urgency — hazard accents near entrances)
        const nearDoor = doors.some(d => Math.abs(d.x - x) <= 1 && Math.abs(d.y - y) <= 1);
        if (nearDoor) {
          floor.fillStyle(0xff6b6b, 0.07);
          floor.fillRect(px, py, TILE, TILE);
        }
      } else if (roomId.includes('lab')) {
        // Lab: Grid dots + thin drain lines — clean room look
        floor.fillStyle(0xffffff, 0.12);
        floor.fillRect(px + 8, py + 8, 2, 2);
        floor.fillRect(px + 22, py + 22, 2, 2);
        if (y % 3 === 0) {
          floor.fillStyle(shadowColor, 0.2);
          floor.fillRect(px, py + TILE - 2, TILE, 1);
        }
      } else if (roomId.includes('break')) {
        // Break room: Warm parquet wood planks — clearly different from tile
        if (x % 2 === 0) {
          floor.fillStyle(highlightColor, 0.25);
          floor.fillRect(px + 1, py + 1, 14, 30);
          // Wood grain lines
          floor.fillStyle(shadowColor, 0.12);
          floor.fillRect(px + 4, py + 2, 1, 28);
          floor.fillRect(px + 10, py + 2, 1, 28);
        } else {
          floor.fillStyle(shadowColor, 0.15);
          floor.fillRect(px + 16, py + 1, 14, 30);
          floor.fillStyle(highlightColor, 0.08);
          floor.fillRect(px + 20, py + 2, 1, 28);
          floor.fillRect(px + 26, py + 2, 1, 28);
        }
      } else if (roomId.includes('it') || roomId.includes('server')) {
        // Server room: Raised floor panel gaps — clearly technical
        floor.fillStyle(0x000000, 0.15);
        floor.fillRect(px, py, TILE, 1);
        floor.fillRect(px, py, 1, TILE);
        // Vent holes on every 3rd panel
        if ((x + y) % 3 === 0) {
          floor.fillStyle(0x000000, 0.12);
          for (let vy = 0; vy < 3; vy++) {
            floor.fillRect(px + 8, py + 8 + vy * 8, 16, 2);
          }
        }
      } else if (roomId.includes('records')) {
        // Records room: Commercial carpet weave — row-offset dot grid + pile lines
        // Offset dot positions on odd rows to simulate carpet weave
        const dotOffsetX = y % 2 === 1 ? 4 : 0;
        floor.fillStyle(0x000000, 0.06);
        floor.fillRect(px + 4 + dotOffsetX, py + 4, 2, 2);
        floor.fillRect(px + 20 + dotOffsetX, py + 20, 2, 2);
        floor.fillRect(px + 12 + dotOffsetX, py + 12, 2, 2);
        floor.fillRect(px + 28 + dotOffsetX, py + 4, 2, 2);
        floor.fillRect(px + 4 + dotOffsetX, py + 28, 2, 2);
        // Faint horizontal pile lines every 8px
        if (py % 8 < TILE) {
          for (let pile = 0; pile < 4; pile++) {
            floor.fillStyle(0x000000, 0.04);
            floor.fillRect(px, py + pile * 8, TILE, 1);
          }
        }
      } else if (roomId.includes('entrance') || roomId.includes('lobby')) {
        // Lobby: Marble veining effect
        if ((x + y) % 3 === 0) {
          floor.fillStyle(0xffffff, 0.08);
          floor.fillRect(px + 4, py + 12, 24, 1);
          floor.fillRect(px + 8, py + 8, 1, 16);
        }
      } else if (roomId.includes('reception')) {
        // Reception: Navy accent diamond at each 2x2 slab intersection
        // Drawn at bottom-right corner of slab (odd x, odd y tile)
        if (x % 2 === 1 && y % 2 === 1) {
          floor.fillStyle(0x2c4a6e, 0.18);
          // Four fillRects forming a 6px diamond
          floor.fillRect(px + TILE - 3, py + TILE - 6, 6, 2); // top bar
          floor.fillRect(px + TILE - 6, py + TILE - 4, 12, 2); // mid-top bar
          floor.fillRect(px + TILE - 6, py + TILE - 2, 12, 2); // mid-bot bar
          floor.fillRect(px + TILE - 3, py + TILE,     6, 2); // bottom bar
        }
      }
    }
  }

  // Hallway runner strip — corridor identity down the walkway row (y=3)
  if (roomId.includes('hallway')) {
    const runnerRowY = 3; // middle walkway row of the 20x7 hallway
    const runnerX = 1 * TILE;           // inset 1 tile from left
    const runnerW = (room.width - 2) * TILE; // inset 1 tile from right
    const runnerY = runnerRowY * TILE;
    // Muted teal base
    floor.fillStyle(0x3e6b6b, 0.55);
    floor.fillRect(runnerX, runnerY, runnerW, TILE);
    // Top border
    floor.fillStyle(0x2a4a4a, 0.7);
    floor.fillRect(runnerX, runnerY, runnerW, 2);
    // Bottom border
    floor.fillRect(runnerX, runnerY + TILE - 2, runnerW, 2);
    // Stitch ticks every 16px along top border
    floor.fillStyle(0x5a8a8a, 0.5);
    for (let tx = runnerX; tx < runnerX + runnerW; tx += 16) {
      floor.fillRect(tx, runnerY, 3, 2);
      floor.fillRect(tx, runnerY + TILE - 2, 3, 2);
    }
  }

  // ── Wall/floor contact shadow ─────────────────────────────────
  // A 3-step vertical gradient at the top edge of each floor tile directly
  // below a wall bottom — classic SNES ambient-occlusion strip.
  // Drawn into the same `floor` Graphics object so depth is unchanged.
  for (const obs of room.obstacles) {
    if ((obs as any).type !== 'wall') continue;
    const rowY = obs.y + obs.height; // floor row immediately below wall bottom
    if (rowY >= room.height) continue; // off-map (no floor below)
    for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
      // Skip door-adjacent columns so walkable openings stay clean
      const nearDoorH = doors.some(d => d.y === rowY - 1 && Math.abs(d.x - wx) <= 1);
      if (nearDoorH) continue;
      // Skip tiles occupied by another obstacle (furniture or wall above)
      const blocked = room.obstacles.some((o: any) =>
        wx >= o.x && wx < o.x + o.width && rowY >= o.y && rowY < o.y + o.height
      );
      if (blocked) continue;
      const spx = wx * TILE;
      const spy = rowY * TILE;
      // Step 1 — darkest 3px at very top (directly below wall)
      floor.fillStyle(0x000000, 0.18);
      floor.fillRect(spx, spy, TILE, 3);
      // Step 2 — medium band +3 to +5
      floor.fillStyle(0x000000, 0.10);
      floor.fillRect(spx, spy + 3, TILE, 2);
      // Step 3 — lightest fade +5 to +8
      floor.fillStyle(0x000000, 0.05);
      floor.fillRect(spx, spy + 5, TILE, 3);
    }
  }
  // ─────────────────────────────────────────────────────────────

  // Room-specific ambient color overlay — visible mood tint
  const roomTints: Record<string, { color: number; alpha: number }> = {
    hospital_entrance: { color: 0xf5e6d0, alpha: 0.06 },  // Warm lobby glow
    reception: { color: 0x4a90e2, alpha: 0.06 },           // Professional blue
    records_room: { color: 0x8faa80, alpha: 0.06 },        // Archival green
    er: { color: 0xff6b6b, alpha: 0.05 },                  // Urgent red
    lab: { color: 0x9b59b6, alpha: 0.06 },                 // Scientific purple
    break_room: { color: 0xf39c12, alpha: 0.08 },          // Warm amber — strongest
    it_office: { color: 0x4488cc, alpha: 0.06 },           // Cool tech blue
  };
  const tintCfg = roomTints[room.id];
  if (tintCfg) {
    scene.add.rectangle(
      w / 2, h / 2, w, h, tintCfg.color, tintCfg.alpha
    ).setDepth(0);
  }

  // ── Room-specific decorative details ────────────────────────
  const decorGfx = scene.add.graphics().setDepth(1);

  // Baseboard strip along bottom of walls — universal room detail
  decorGfx.fillStyle(0x4a3f2e, 0.5);
  for (const obs of room.obstacles) {
    if ((obs as any).type === 'wall') {
      const bx = obs.x * TILE;
      const by = (obs.y + obs.height) * TILE - 3;
      const bw = obs.width * TILE;
      decorGfx.fillRect(bx, by, bw, 3);
      // Baseboard highlight
      decorGfx.fillStyle(0x6a5b44, 0.4);
      decorGfx.fillRect(bx, by, bw, 1);
      decorGfx.fillStyle(0x4a3f2e, 0.5);
    }
  }

  // Room-specific wall decorations — distinct visual identity per room
  if (roomId.includes('reception')) {
    // Welcome sign on north wall
    decorGfx.fillStyle(0x4a90e2, 0.2);
    decorGfx.fillRect(TILE * 2, TILE + 4, TILE * 3, TILE / 2);
    decorGfx.lineStyle(1, 0x4a90e2, 0.35);
    decorGfx.strokeRect(TILE * 2, TILE + 4, TILE * 3, TILE / 2);
    // Clock on wall
    decorGfx.fillStyle(0xffffff, 0.15);
    decorGfx.fillCircle(TILE * 16, TILE + 10, 8);
    decorGfx.lineStyle(1, 0x333333, 0.2);
    decorGfx.strokeCircle(TILE * 16, TILE + 10, 8);
  } else if (roomId.includes('er')) {
    // Red cross symbol on wall — larger, more prominent
    decorGfx.fillStyle(0xff0000, 0.18);
    decorGfx.fillRect(w / 2 - 8, TILE + 2, 16, 6);
    decorGfx.fillRect(w / 2 - 3, TILE - 2, 6, 16);
    // "EMERGENCY" stripe along top
    decorGfx.fillStyle(0xff0000, 0.08);
    decorGfx.fillRect(TILE, TILE - 2, w - TILE * 2, 3);
  } else if (roomId.includes('lab')) {
    // Biohazard warning placard on north wall
    decorGfx.fillStyle(0xf39c12, 0.2);
    decorGfx.fillRect(TILE * 2, TILE + 4, TILE, TILE / 2);
    decorGfx.lineStyle(1, 0xf39c12, 0.3);
    decorGfx.strokeRect(TILE * 2, TILE + 4, TILE, TILE / 2);
    // Safety shower sign
    decorGfx.fillStyle(0x27ae60, 0.15);
    decorGfx.fillRect(TILE * 15, TILE + 4, TILE, TILE / 2);
  } else if (roomId.includes('it') || roomId.includes('server')) {
    // Network status lights on north wall (server room feel)
    for (let lx = 0; lx < 4; lx++) {
      decorGfx.fillStyle(lx % 3 === 0 ? 0xff4444 : 0x44ff44, 0.2);
      decorGfx.fillCircle(TILE * 5 + lx * TILE * 3, TILE + 8, 3);
    }
    // "RESTRICTED" label
    decorGfx.fillStyle(0xff4444, 0.12);
    decorGfx.fillRect(w - TILE * 4, TILE + 4, TILE * 2, TILE / 3);
  } else if (roomId.includes('break')) {
    // Menu board on north wall
    decorGfx.fillStyle(0x2c2c2c, 0.2);
    decorGfx.fillRect(TILE * 12, TILE + 2, TILE * 2, TILE - 4);
    decorGfx.fillStyle(0xffffff, 0.12);
    decorGfx.fillRect(TILE * 12 + 4, TILE + 6, TILE * 2 - 8, 3);
    decorGfx.fillRect(TILE * 12 + 4, TILE + 12, TILE * 2 - 8, 2);
    decorGfx.fillRect(TILE * 12 + 4, TILE + 17, TILE - 4, 2);
  } else if (roomId.includes('records')) {
    // "MEDICAL RECORDS" label strip on north wall
    decorGfx.fillStyle(0x2ecc71, 0.12);
    decorGfx.fillRect(TILE * 6, TILE + 2, TILE * 4, TILE / 3);
    // Section labels (A, B, C indicators)
    for (let s = 0; s < 3; s++) {
      decorGfx.fillStyle(0xffffff, 0.1);
      decorGfx.fillRect(TILE * (4 + s * 5), TILE + 4, TILE / 2, TILE / 3);
    }
  } else if (roomId.includes('entrance') || roomId.includes('lobby')) {
    // Hospital logo placeholder on north wall
    decorGfx.fillStyle(0x4a90e2, 0.15);
    decorGfx.fillCircle(w / 2, TILE + 10, 10);
    decorGfx.lineStyle(1, 0x4a90e2, 0.25);
    decorGfx.strokeCircle(w / 2, TILE + 10, 10);
    // "H" inside
    decorGfx.fillStyle(0xffffff, 0.2);
    decorGfx.fillRect(w / 2 - 4, TILE + 5, 2, 10);
    decorGfx.fillRect(w / 2 + 2, TILE + 5, 2, 10);
    decorGfx.fillRect(w / 2 - 4, TILE + 9, 10, 2);
  }

  // Room-specific floor details
  if (roomId.includes('er') || roomId.includes('emergency')) {
    // ER: floor warning stripes near edges
    decorGfx.fillStyle(0xffcc00, 0.08);
    decorGfx.fillRect(0, 0, w, 4);
    decorGfx.fillRect(0, h - 4, w, 4);
  } else if (roomId.includes('lab')) {
    // Lab: biohazard symbol hint in corner
    decorGfx.fillStyle(0xf39c12, 0.06);
    decorGfx.fillCircle(w - 24, h - 24, 12);
    decorGfx.fillStyle(0x000000, 0.04);
    decorGfx.fillCircle(w - 24, h - 24, 6);
  } else if (roomId.includes('it') || roomId.includes('server')) {
    // Server room: floor cable channels
    decorGfx.lineStyle(2, 0x333333, 0.15);
    decorGfx.beginPath();
    decorGfx.moveTo(TILE * 2, TILE);
    decorGfx.lineTo(TILE * 2, h - TILE);
    decorGfx.strokePath();
    decorGfx.beginPath();
    decorGfx.moveTo(w - TILE * 2, TILE);
    decorGfx.lineTo(w - TILE * 2, h - TILE);
    decorGfx.strokePath();
  }

  // ── Ceiling light pools (overhead lighting effect on floor) ──
  const lightGfx = scene.add.graphics().setDepth(0);
  const lightSpacing = TILE * 4;
  for (let ly = lightSpacing; ly < h - lightSpacing; ly += lightSpacing) {
    for (let lx = lightSpacing; lx < w - lightSpacing; lx += lightSpacing) {
      // Check we're not on a wall/obstacle
      const tileX = Math.floor(lx / TILE);
      const tileY = Math.floor(ly / TILE);
      const onObstacle = room.obstacles.some((o: any) =>
        tileX >= o.x && tileX < o.x + o.width && tileY >= o.y && tileY < o.y + o.height
      );
      if (!onObstacle) {
        lightGfx.fillStyle(0xffffff, 0.04);
        lightGfx.fillCircle(lx, ly, TILE * 1.5);
        lightGfx.fillStyle(0xffffff, 0.02);
        lightGfx.fillCircle(lx, ly, TILE * 2.5);
      }
    }
  }

  // ── Ambient dust particles — subtle floating motes ──────────
  if (scene.textures.exists('particle_circle')) {
    scene.add.particles(0, 0, 'particle_circle', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      speed: { min: 5, max: 15 },
      angle: { min: 260, max: 280 },   // drift gently upward
      scale: { min: 0.3, max: 0.6 },
      alpha: { start: 0.1, end: 0.25, ease: 'Sine.easeInOut' },
      tint: 0xd4c9a8,                  // warm tone matching floor
      lifespan: { min: 4000, max: 8000 },
      frequency: 500,
      depth: 5,                         // above floor, below furniture
    } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);

    // Secondary ambient layer — slower, larger particles for depth
    scene.add.particles(w / 2, h / 2, 'particle_circle', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      speed: { min: 2, max: 8 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.15, end: 0 },
      lifespan: { min: 6000, max: 10000 },
      tint: 0xffffcc,
      frequency: 3000,
      quantity: 1,
    } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig).setDepth(0);

    // Occasional sparkle — brief bright flash particles
    scene.add.particles(w / 2, h / 2, 'particle_circle', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      speed: { min: 0, max: 5 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 400,
      tint: 0xffffff,
      frequency: 5000,
      quantity: 1,
    } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig).setDepth(0);
  }

  // ── Obstacles / Walls ────────────────────────────────────────
  const walls = scene.physics.add.staticGroup();
  for (const obs of room.obstacles) {
    const ox = obs.x * TILE;
    const oy = obs.y * TILE;
    const ow = obs.width * TILE;
    const oh = obs.height * TILE;

    const obsType = (obs as any).type as string | undefined;

    if (obsType === 'wall') {
      // Draw wall tiles with depth (highlight top, shadow base)
      const wallG = scene.add.graphics();

      // Room-specific wall colors
      let wallBase1: number, wallBase2: number, wallHighlight: number, wallShadow: number, wallMortar: number;
      if (roomId.includes('er') || roomId.includes('emergency')) {
        wallBase1 = 0x5c6570; wallBase2 = 0x566068;
        wallHighlight = 0x7a858e; wallShadow = 0x3a4448; wallMortar = 0x4a5560;
      } else if (roomId.includes('lab')) {
        wallBase1 = 0x606860; wallBase2 = 0x5a6258;
        wallHighlight = 0x7e867e; wallShadow = 0x3e4640; wallMortar = 0x4e564e;
      } else if (roomId.includes('it') || roomId.includes('server')) {
        wallBase1 = 0x4a5060; wallBase2 = 0x444a58;
        wallHighlight = 0x687080; wallShadow = 0x2e3440; wallMortar = 0x3e4450;
      } else {
        wallBase1 = 0x5d4e37; wallBase2 = 0x574930;
        wallHighlight = 0x7a6b52; wallShadow = 0x3a3124; wallMortar = 0x4a3f2e;
      }

      for (let wy = obs.y; wy < obs.y + obs.height; wy++) {
        for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
          const wpx = wx * TILE;
          const wpy = wy * TILE;

          // Main wall fill — use two alternating shades for brick-like pattern
          const isEvenTile = (wx + wy) % 2 === 0;
          const wallBase = isEvenTile ? wallBase1 : wallBase2;
          wallG.fillStyle(wallBase, 1);
          wallG.fillRect(wpx, wpy, TILE, TILE);

          // Horizontal mortar line at 1/3 and 2/3 height
          wallG.fillStyle(wallMortar, 0.6);
          wallG.fillRect(wpx, wpy + 10, TILE, 1);
          wallG.fillRect(wpx, wpy + 21, TILE, 1);

          // Vertical mortar offset (brick bond pattern)
          const vOffset = wy % 2 === 0 ? 16 : 0;
          wallG.fillStyle(wallMortar, 0.5);
          wallG.fillRect(wpx + vOffset, wpy, 1, TILE);

          // Top highlight
          wallG.fillStyle(wallHighlight, 0.6);
          wallG.fillRect(wpx, wpy, TILE, 1);
          wallG.fillRect(wpx, wpy, 1, TILE); // left highlight

          // Bottom shadow (wall meets floor)
          wallG.fillStyle(wallShadow, 0.8);
          wallG.fillRect(wpx, wpy + TILE - 2, TILE, 2);
          wallG.fillRect(wpx + TILE - 1, wpy, 1, TILE); // right shadow

          // Subtle surface texture — tiny noise dots
          if ((wx * 3 + wy * 5) % 4 === 0) {
            const textureTint = Phaser.Display.Color.IntegerToColor(wallHighlight).lighten(10).color;
            wallG.fillStyle(textureTint, 0.3);
            wallG.fillRect(wpx + 8, wpy + 6, 2, 1);
            wallG.fillRect(wpx + 20, wpy + 14, 2, 1);
          }

          // Wainscoting/molding on top of walls (crown molding effect)
          if (wy === obs.y) {
            const moldingBase = Phaser.Display.Color.IntegerToColor(wallHighlight).lighten(15).color;
            const moldingTop = Phaser.Display.Color.IntegerToColor(wallHighlight).lighten(25).color;
            wallG.fillStyle(moldingBase, 0.7);
            wallG.fillRect(wpx, wpy, TILE, 3);
            wallG.fillStyle(moldingTop, 0.5);
            wallG.fillRect(wpx, wpy, TILE, 1);
          }
        }
      }
    } else {
      // Furniture — place a sprite at center of the obstacle area
      const texKey = furnitureTextureKey(obsType);
      if (obs.width === 1 && obs.height === 1) {
        // Drop shadow beneath furniture
        scene.add.ellipse(ox + TILE / 2, oy + TILE / 2 + 12, TILE - 4, 8, 0x000000, 0.12);
        scene.add.sprite(ox + TILE / 2, oy + TILE / 2, texKey);
        // Subtle furniture base highlight
        scene.add.rectangle(ox + TILE / 2, oy + TILE / 2, TILE - 2, TILE - 2)
          .setStrokeStyle(1, 0x000000, 0.08)
          .setFillStyle(0x000000, 0)
          .setDepth(1);
      } else if (hasComposite(obsType)) {
        // Multi-tile obstacle → draw ONE coherent object sized to the footprint
        // (a single long counter / bed / couch), not a grid of cloned 32px tiles.
        drawCompositeFurniture(scene, obsType, obs.x, obs.y, obs.width, obs.height);
      } else {
        // No composite for this type — center a single sprite in the footprint
        // rather than tiling it. One shadow, one object.
        scene.add.ellipse(ox + ow / 2, oy + oh - 4, ow - 6, Math.max(8, oh * 0.28), 0x000000, 0.15);
        scene.add.sprite(ox + ow / 2, oy + oh / 2, texKey).setDepth(3);
      }
    }

    // Physics collision body (invisible) — skip tiles occupied by doors
    // (doors already declared above at floor render time — reuse same array)
    if (obsType === 'wall' && doors.length > 0) {
      // Build collision per-tile, skipping door tiles (and 1 tile adjacent inward)
      for (let wy = obs.y; wy < obs.y + obs.height; wy++) {
        for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
          const isDoorTile = doors.some((d: any) => {
            // Skip the door tile itself and one tile of clearance
            if (d.x === wx && d.y === wy) return true;
            if (d.x === wx && Math.abs(d.y - wy) <= 1) return true;
            if (d.y === wy && Math.abs(d.x - wx) <= 1) return true;
            return false;
          });
          if (!isDoorTile) {
            const wr = scene.add.rectangle(wx * TILE + TILE / 2, wy * TILE + TILE / 2, TILE, TILE);
            wr.setVisible(false);
            walls.add(wr);
          }
        }
      }
    } else {
      const wallRect = scene.add.rectangle(ox + ow / 2, oy + oh / 2, ow, oh);
      wallRect.setVisible(false);
      walls.add(wallRect);
    }
  }

  return { walls };
}

// ── Vignette overlay — subtle edge darkening to draw eye to center ──
export function renderVignette(scene: Phaser.Scene): void {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const vignette = scene.add.graphics();
  // Outer ring: 16px border at 15% opacity
  vignette.fillStyle(0x000000, 0.15);
  vignette.fillRect(0, 0, camW, 16);               // top
  vignette.fillRect(0, camH - 16, camW, 16);       // bottom
  vignette.fillRect(0, 16, 16, camH - 32);         // left
  vignette.fillRect(camW - 16, 16, 16, camH - 32); // right
  // Inner ring: next 16px at 8% opacity
  vignette.fillStyle(0x000000, 0.08);
  vignette.fillRect(16, 16, camW - 32, 16);               // top inner
  vignette.fillRect(16, camH - 32, camW - 32, 16);        // bottom inner
  vignette.fillRect(16, 32, 16, camH - 64);               // left inner
  vignette.fillRect(camW - 32, 32, 16, camH - 64);        // right inner
  vignette.setDepth(50);
  vignette.setScrollFactor(0);

  // Subtle ambient vignette for depth
  const vignetteGfx = scene.add.graphics().setDepth(90).setScrollFactor(0);
  // Corner shadows (subtle)
  vignetteGfx.fillStyle(0x000000, 0.08);
  vignetteGfx.fillRect(0, 0, 40, 40);
  vignetteGfx.fillRect(camW - 40, 0, 40, 40);
  vignetteGfx.fillRect(0, camH - 40, 40, 40);
  vignetteGfx.fillRect(camW - 40, camH - 40, 40, 40);
  // Edge darkening (very subtle)
  vignetteGfx.fillStyle(0x000000, 0.03);
  vignetteGfx.fillRect(0, 0, camW, 10);
  vignetteGfx.fillRect(0, camH - 10, camW, 10);
  vignetteGfx.fillRect(0, 0, 10, camH);
  vignetteGfx.fillRect(camW - 10, 0, 10, camH);
}

// Room name entrance banner — slides in and fades out
export function showRoomBanner(scene: Phaser.Scene, room: Room): void {
  const roomBanner = scene.add.text(
    scene.cameras.main.centerX, 40,
    room.name || 'Unknown Room',
    {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }
  ).setOrigin(0.5).setDepth(100).setScrollFactor(0).setAlpha(0);

  // Color banner based on room type
  const bannerColors: Record<string, string> = {
    reception: '#4a90e2',
    records_room: '#2ecc71',
    er: '#ff6b6b',
    lab: '#9b59b6',
    break_room: '#f39c12',
    it_office: '#00d4aa',
  };
  const bannerColor = bannerColors[room.id] || '#ffffff';
  roomBanner.setColor(bannerColor);

  scene.tweens.add({
    targets: roomBanner,
    alpha: 1,
    y: 50,
    duration: 400,
    ease: 'Quad.easeOut',
    delay: 300,
    onComplete: () => {
      scene.tweens.add({
        targets: roomBanner,
        alpha: 0,
        duration: 500,
        delay: 1500,
        ease: 'Quad.easeIn',
        onComplete: () => roomBanner.destroy()
      });
    }
  });
}
