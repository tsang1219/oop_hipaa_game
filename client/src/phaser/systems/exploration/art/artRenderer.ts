/**
 * artRenderer.ts — Run 11 (art-substrate). Renders a room from the LimeZu atlas:
 *
 *   ground   one RenderTexture (depth 0): void fill → floor variants (seamless
 *            3×2 pattern + scattered swaps) → back-wall face (cap/face/baseboard)
 *            → thin wall-top trims on the sides/bottom → floor contact shadows
 *            → floor decor + wear
 *   props    one y-sorted Image per obstacle (depth 5 + bottom row), wall-mounted
 *            pieces at depth 2
 *   lighting ambient tint (MULTIPLY) + light pools (ADD) + radial vignette, all in
 *            one toggleable layer (window.__QA__.commands.setLighting)
 *
 * Collision is built by roomRenderer.buildWallColliders — the walkable layer is
 * untouched by anything in this file.
 */
import Phaser from 'phaser';
import type { Room } from '@shared/schema';
import { ATLAS_KEY, ATLAS_FRAME_SIZES, type AtlasFrame } from './atlasFrames.generated';
import {
  ROOM_DECOR, resolveProp, type RoomArtStyle, type PropDef, type DecorDef,
} from './artCatalog';

const TILE = 32;
const LIGHT_DEPTH = 40;
const FALLBACK_FRAME: AtlasFrame = 'prop.box.single';

export interface ArtSnapshot {
  roomId: string;
  atlas: string;
  wallRows: number;
  floorSet: string;
  wallStyle: string;
  trim: string;
  lighting: boolean;
  props: Array<{ type: string; x: number; y: number; w: number; h: number; frame: string; depth: number; anchor: string }>;
  decor: number;
  missing: string[];
}

export interface ArtHandle {
  roomId: string;
  style: RoomArtStyle;
  ground: Phaser.GameObjects.RenderTexture;
  /** prop sprites keyed `${type}@${x},${y}` (obstacle tile coords) */
  props: Map<string, Phaser.GameObjects.Image>;
  lightObjects: Phaser.GameObjects.GameObject[];
  lightingOn: boolean;
  snapshot: ArtSnapshot;
  setLighting(on: boolean): void;
}

const handles = new WeakMap<Phaser.Scene, ArtHandle>();

export function getArtHandle(scene: Phaser.Scene): ArtHandle | undefined {
  return handles.get(scene);
}

function hash(x: number, y: number, salt = 0): number {
  return (((x * 7 + y * 13 + 37 + salt * 101) * 2654435761) >>> 0);
}

function frameExists(scene: Phaser.Scene, frame: string): boolean {
  return scene.textures.exists(ATLAS_KEY) && scene.textures.get(ATLAS_KEY).has(frame);
}

function sizeOf(frame: AtlasFrame): { w: number; h: number } {
  return ATLAS_FRAME_SIZES[frame] ?? { w: TILE, h: TILE };
}

function publishSnapshot(snapshot: ArtSnapshot): void {
  const qa = (window as unknown as { __QA__?: { art?: ArtSnapshot } }).__QA__;
  if (qa) qa.art = snapshot;
}

/** Soft radial textures for the lighting layer, generated once per game. */
function ensureLightTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('art_light_pool')) {
    const size = 128;
    const tex = scene.textures.createCanvas('art_light_pool', size, size);
    if (tex) {
      const ctx = tex.context;
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      tex.refresh();
    }
  }
  if (!scene.textures.exists('art_vignette')) {
    const w = scene.scale.width, h = scene.scale.height;
    const tex = scene.textures.createCanvas('art_vignette', w, h);
    if (tex) {
      const ctx = tex.context;
      const r = Math.hypot(w, h) / 2;
      const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.38, w / 2, h / 2, r);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.45)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      tex.refresh();
    }
  }
}

function wallFrame(style: RoomArtStyle['wall']['style'], row: 'top' | 'bot', end: 'l' | 'm' | 'r' | 's'): AtlasFrame {
  return `wall.${style}.${row}.${end}` as AtlasFrame;
}

function trimFrame(trim: RoomArtStyle['wall']['trim'], piece: string): AtlasFrame {
  return `trim.${trim}.${piece}` as AtlasFrame;
}

export function renderRoomArt(scene: Phaser.Scene, room: Room, style: RoomArtStyle): ArtHandle {
  const W = room.width, H = room.height;
  const w = W * TILE, h = H * TILE;
  const faceRows = style.wall.rows;
  const doors: Array<{ x: number; y: number; side?: string }> = (room as unknown as { doors?: Array<{ x: number; y: number; side?: string }> }).doors ?? [];
  const isDoor = (x: number, y: number) => doors.some(d => d.x === x && d.y === y);
  const obstacles = room.obstacles as Array<{ x: number; y: number; width: number; height: number; type?: string }>;
  const missing: string[] = [];
  const warn = (msg: string) => { if (import.meta.env.DEV) console.warn(`[art] ${room.id}: ${msg}`); };

  // ── Ground ────────────────────────────────────────────────────────────────
  const ground = scene.add.renderTexture(0, 0, w, h).setOrigin(0, 0).setDepth(0);
  ground.beginDraw();
  // void (beyond the wall tops)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground.batchDrawFrame(ATLAS_KEY, 'trim.void', x * TILE, y * TILE);
  // floor — seamless pattern with scattered swaps (ART-05)
  const { set, variants, pattern, scatter } = style.floor;
  for (let y = faceRows; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = (x % pattern[0]) + (y % pattern[1]) * pattern[0];
      const hv = hash(x, y);
      if ((hv % 1000) / 1000 < scatter) v = hash(x, y, 1) % variants;
      ground.batchDrawFrame(ATLAS_KEY, `${set}.${v % variants}`, x * TILE, y * TILE);
    }
  }
  // back-wall face (ART-03) — interior columns only; the side trims overlap the ends
  for (let x = 1; x < W - 1; x++) {
    const end = x === 1 ? 'l' : x === W - 2 ? 'r' : 'm';
    if (faceRows === 2) {
      ground.batchDrawFrame(ATLAS_KEY, wallFrame(style.wall.style, 'top', end), x * TILE, 0);
      ground.batchDrawFrame(ATLAS_KEY, wallFrame(style.wall.style, 'bot', end), x * TILE, TILE);
    } else {
      ground.batchDrawFrame(ATLAS_KEY, wallFrame(style.wall.style, 'bot', end), x * TILE, 0);
    }
  }
  // contact shadows on the floor along every wall (soft AO, from the tileset)
  for (let x = 1; x < W - 1; x++) {
    ground.batchDrawFrame(ATLAS_KEY, 'shadow.top', x * TILE, faceRows * TILE);
    if (!isDoor(x, H - 1)) ground.batchDrawFrame(ATLAS_KEY, 'shadow.bottom', x * TILE, (H - 2) * TILE, 0.55);
  }
  for (let y = faceRows; y < H - 1; y++) {
    if (!isDoor(0, y)) ground.batchDrawFrame(ATLAS_KEY, 'shadow.left', TILE, y * TILE);
    if (!isDoor(W - 1, y)) ground.batchDrawFrame(ATLAS_KEY, 'shadow.right', (W - 2) * TILE, y * TILE);
  }
  // thin wall tops (top-view) down both sides and along the bottom, gaps at doors
  const t = style.wall.trim;
  for (let y = 0; y < H - 1; y++) {
    if (!isDoor(0, y)) ground.batchDrawFrame(ATLAS_KEY, trimFrame(t, y === 0 ? 'left.top' : 'left'), 0, y * TILE);
    if (!isDoor(W - 1, y)) ground.batchDrawFrame(ATLAS_KEY, trimFrame(t, y === 0 ? 'right.top' : 'right'), (W - 1) * TILE, y * TILE);
  }
  ground.batchDrawFrame(ATLAS_KEY, trimFrame(t, 'corner.bl'), 0, (H - 1) * TILE);
  ground.batchDrawFrame(ATLAS_KEY, trimFrame(t, 'corner.br'), (W - 1) * TILE, (H - 1) * TILE);
  for (let x = 1; x < W - 1; x++) {
    if (!isDoor(x, H - 1)) ground.batchDrawFrame(ATLAS_KEY, trimFrame(t, 'bottom'), x * TILE, (H - 1) * TILE);
  }
  // floor decor (mats, dropped paper) — part of the ground
  const decor = ROOM_DECOR[room.id] ?? [];
  for (const d of decor) {
    if (d.layer !== 'floor') continue;
    if (!frameExists(scene, d.frame)) { missing.push(`decor:${d.frame}`); continue; }
    ground.batchDrawFrame(ATLAS_KEY, d.frame, d.tx * TILE + (d.dx ?? 0), d.ty * TILE + (d.dy ?? 0), d.alpha ?? 1);
  }
  ground.endDraw();
  // wear — soft darkening where people actually walk (ART-05)
  if (style.wear.length) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (const s of style.wear) {
      const a = s.alpha ?? 0.04;
      for (let k = 3; k >= 1; k--) {
        g.fillStyle(0x3a2a18, a / 3);
        g.fillEllipse(s.tx * TILE + TILE / 2, s.ty * TILE + TILE / 2, s.r * 2 * (k / 3), s.r * 1.2 * (k / 3));
      }
    }
    ground.draw(g);
    g.destroy();
  }

  // ── Props (ART-02 / ART-07) ────────────────────────────────────────────────
  const props = new Map<string, Phaser.GameObjects.Image>();
  const snapshotProps: ArtSnapshot['props'] = [];
  const placeProp = (type: string, ox: number, oy: number, ow: number, oh: number, def: PropDef) => {
    let frame: string = def.frame;
    if (!frameExists(scene, frame)) {
      missing.push(`${type}:${frame}`);
      warn(`frame '${frame}' for '${type}' not in atlas — using fallback`);
      frame = FALLBACK_FRAME;
    }
    const anchor = def.anchor ?? 'floor';
    let img: Phaser.GameObjects.Image;
    let depth: number;
    if (anchor === 'wall') {
      img = scene.add.image(ox * TILE + (ow * TILE) / 2 + (def.dx ?? 0), oy * TILE + (def.dy ?? 0), ATLAS_KEY, frame).setOrigin(0.5, 0);
      depth = 2;
    } else {
      img = scene.add.image(ox * TILE + (ow * TILE) / 2 + (def.dx ?? 0), (oy + oh) * TILE + (def.dy ?? 0), ATLAS_KEY, frame).setOrigin(0.5, 1);
      depth = 5 + (def.depthRow ?? (oy + oh - 1));
      if (def.shadow) {
        const s = sizeOf(frame as AtlasFrame);
        scene.add.ellipse(img.x, img.y - 3, Math.max(16, s.w - 6), Math.max(6, Math.round(s.w * 0.22)), 0x000000, 0.18).setDepth(depth - 1);
      }
    }
    img.setDepth(depth);
    if (def.alpha !== undefined) img.setAlpha(def.alpha);
    if (def.flipX) img.setFlipX(true);
    props.set(`${type}@${ox},${oy}`, img);
    snapshotProps.push({ type, x: ox, y: oy, w: ow, h: oh, frame, depth, anchor });
    return img;
  };
  for (const obs of obstacles) {
    const type = obs.type ?? '';
    if (!type || type === 'wall') continue;
    const def = resolveProp(room.id, type, obs.x, obs.y);
    if (!def) {
      missing.push(`${type}:(no catalog entry)`);
      warn(`no catalog entry for obstacle type '${type}' at ${obs.x},${obs.y}`);
      placeProp(type, obs.x, obs.y, obs.width, obs.height, { frame: FALLBACK_FRAME });
      continue;
    }
    placeProp(type, obs.x, obs.y, obs.width, obs.height, def);
  }

  // ── Decor on walls / among props ──────────────────────────────────────────
  let decorCount = 0;
  for (const d of decor as DecorDef[]) {
    if (d.layer === 'floor') { decorCount++; continue; }
    if (!frameExists(scene, d.frame)) { missing.push(`decor:${d.frame}`); continue; }
    const s = sizeOf(d.frame);
    if (d.layer === 'wall') {
      scene.add.image(d.tx * TILE + (d.dx ?? 0), d.ty * TILE + (d.dy ?? 0), ATLAS_KEY, d.frame)
        .setOrigin(0, 0).setDepth(2).setAlpha(d.alpha ?? 1).setFlipX(!!d.flipX);
    } else {
      const cols = Math.max(1, Math.round(s.w / TILE));
      scene.add.image(d.tx * TILE + (cols * TILE) / 2 + (d.dx ?? 0), (d.ty + 1) * TILE + (d.dy ?? 0), ATLAS_KEY, d.frame)
        .setOrigin(0.5, 1).setDepth(5 + (d.depthRow ?? d.ty)).setAlpha(d.alpha ?? 1).setFlipX(!!d.flipX);
    }
    decorCount++;
  }

  // ── Ambient dust (kept from the legacy renderer — it is part of the motion budget)
  if (scene.textures.exists('particle_circle')) {
    scene.add.particles(0, 0, 'particle_circle', {
      x: { min: 0, max: w }, y: { min: faceRows * TILE, max: h },
      speed: { min: 5, max: 15 }, angle: { min: 260, max: 280 },
      scale: { min: 0.3, max: 0.6 }, alpha: { start: 0.08, end: 0.2, ease: 'Sine.easeInOut' },
      tint: 0xfff2d8, lifespan: { min: 4000, max: 8000 }, frequency: 600, depth: 4,
    } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig);
  }

  // ── Lighting (ART-06) ─────────────────────────────────────────────────────
  ensureLightTextures(scene);
  const lightObjects: Phaser.GameObjects.GameObject[] = [];
  const L = style.light;
  const ambient = scene.add.rectangle(w / 2, h / 2, w, h, L.ambient, 1)
    .setBlendMode(Phaser.BlendModes.MULTIPLY).setAlpha(L.ambientAlpha).setDepth(LIGHT_DEPTH);
  lightObjects.push(ambient);
  for (const p of L.pools) {
    const pool = scene.add.image(p.tx * TILE + TILE / 2, p.ty * TILE + TILE / 2, 'art_light_pool')
      .setTint(p.color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(p.alpha).setScale((p.r * 2) / 128).setDepth(LIGHT_DEPTH);
    scene.tweens.add({ targets: pool, alpha: { from: p.alpha, to: p.alpha * 0.8 }, duration: 2600 + Math.random() * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    lightObjects.push(pool);
  }
  const vignette = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, 'art_vignette')
    .setAlpha(L.vignette).setDepth(LIGHT_DEPTH + 1).setScrollFactor(0);
  lightObjects.push(vignette);

  const snapshot: ArtSnapshot = {
    roomId: room.id, atlas: ATLAS_KEY, wallRows: faceRows, floorSet: set,
    wallStyle: style.wall.style, trim: style.wall.trim, lighting: true,
    props: snapshotProps, decor: decorCount, missing,
  };
  const handle: ArtHandle = {
    roomId: room.id, style, ground, props, lightObjects, lightingOn: true, snapshot,
    setLighting(on: boolean) {
      this.lightingOn = on;
      for (const o of this.lightObjects) (o as Phaser.GameObjects.Image).setVisible(on);
      this.snapshot.lighting = on;
      publishSnapshot(this.snapshot);
    },
  };
  handles.set(scene, handle);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { if (handles.get(scene) === handle) handles.delete(scene); });
  publishSnapshot(snapshot);
  if (missing.length) warn(`missing frames: ${missing.join(', ')}`);
  return handle;
}
