import Phaser from 'phaser';
import type { Room } from '@shared/schema';
import { getRoomArt } from './art/artCatalog';
import { renderRoomArt } from './art/artRenderer';

const TILE = 32;

export function buildWallColliders(
  scene: Phaser.Scene,
  room: Room,
  doors: Array<{ x: number; y: number }>,
  walls: Phaser.Physics.Arcade.StaticGroup,
): void {
  for (const obs of room.obstacles) {
    const ox = obs.x * TILE;
    const oy = obs.y * TILE;
    const ow = obs.width * TILE;
    const oh = obs.height * TILE;
    const obsType = (obs as any).type as string | undefined;
    if (obsType === 'wall' && doors.length > 0) {
      for (let wy = obs.y; wy < obs.y + obs.height; wy++) {
        for (let wx = obs.x; wx < obs.x + obs.width; wx++) {
          const isDoorTile = doors.some((d: any) => {
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
}

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

/**
 * Run 11 (art-substrate): every room renders from the LimeZu atlas through
 * art/artRenderer.ts, driven by art/artCatalog.ts. The procedural floor / wall /
 * furniture drawing that used to live here (and in sprites/furniture,
 * compositeFurniture.ts) is gone — a room without a catalog entry is a bug, not
 * a fallback.
 */
export function renderRoom(scene: Phaser.Scene, room: Room): { walls: Phaser.Physics.Arcade.StaticGroup } {
  const style = getRoomArt(room.id);
  if (!style) throw new Error(`[art] no ROOM_ART entry for room '${room.id}' — add one in art/artCatalog.ts`);
  renderRoomArt(scene, room, style);
  const walls = scene.physics.add.staticGroup();
  buildWallColliders(scene, room, ((room as any).doors || []) as Array<{ x: number; y: number }>, walls);
  return { walls };
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
