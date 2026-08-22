/**
 * artRenderer.ts — Run 11 (art-substrate). Renders a room from the LimeZu atlas:
 *
 *   ground   one RenderTexture (depth 0): void fill → floor variants (seamless
 *            3×2 pattern + scattered swaps) → back-wall face (cap/face/baseboard)
 *            → thin wall-top trims on the sides/bottom → floor contact shadows
 *            → ground-layer props (mats, cable ducts) → floor decor + wear
 *   props    one y-sorted Image/Sprite per obstacle (depth 5 + bottom row), or
 *            several (`parts`), or one per tile (`fill`); wall-mounted pieces at
 *            depth 2; `anim` plays an atlas-frame loop
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
  ROOM_DECOR, resolveProp, type RoomArtStyle, type PropDef, type DecorDef, type AnimDef,
} from './artCatalog';
import { closetFound } from '../../../../data/whimsyData';

const TILE = 32;
const LIGHT_DEPTH = 40;
const FALLBACK_FRAME: AtlasFrame = 'prop.box.single';
/** The colour of LimeZu's "outside the walls" tile (trim.void) — cameras match it so
 *  small rooms (hallways, the closet) sit in the same dark instead of a black box. */
export const VOID_COLOR = 0x3a3a50;

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
  animated: number;
  missing: string[];
}

export interface ArtHandle {
  roomId: string;
  style: RoomArtStyle;
  ground: Phaser.GameObjects.RenderTexture;
  /** first sprite of each obstacle, keyed `${type}@${x},${y}` (obstacle tile coords) */
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

function sizeOf(frame: string): { w: number; h: number } {
  return ATLAS_FRAME_SIZES[frame as AtlasFrame] ?? { w: TILE, h: TILE };
}

function publishSnapshot(snapshot: ArtSnapshot): void {
  const qa = (window as unknown as { __QA__?: { art?: ArtSnapshot } }).__QA__;
  if (qa) qa.art = snapshot;
}

/** Register (once) and return the animation key for an atlas-frame loop. */
export function ensureAnim(scene: Phaser.Scene, anim: AnimDef): string {
  const key = `art:${anim.frames.join('|')}:${anim.frameRate}`;
  if (!scene.anims.exists(key)) {
    scene.anims.create({
      key,
      frames: anim.frames.map(f => ({ key: ATLAS_KEY, frame: f })),
      frameRate: anim.frameRate,
      repeat: -1,
      yoyo: !!anim.yoyo,
    });
  }
  return key;
}

function playAnim(sprite: Phaser.GameObjects.Sprite, scene: Phaser.Scene, anim: AnimDef): void {
  const key = ensureAnim(scene, anim);
  // start on a random frame so identical props (server racks, monitors) never blink in lockstep
  sprite.play({ key, startFrame: Math.floor(Math.random() * anim.frames.length) });
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

type Obstacle = { x: number; y: number; width: number; height: number; type?: string };

export function renderRoomArt(scene: Phaser.Scene, room: Room, style: RoomArtStyle): ArtHandle {
  const W = room.width, H = room.height;
  const w = W * TILE, h = H * TILE;
  const faceRows = style.wall.rows;
  const doors: Array<{ x: number; y: number; side?: string; hidden?: boolean }> = (room as unknown as { doors?: Array<{ x: number; y: number; side?: string; hidden?: boolean }> }).doors ?? [];
  const isDoor = (x: number, y: number) => doors.some(d => d.x === x && d.y === y);
  const obstacles = room.obstacles as Obstacle[];
  const missing: string[] = [];
  const warn = (msg: string) => { if (import.meta.env.DEV) console.warn(`[art] ${room.id}: ${msg}`); };
  const checkFrame = (frame: string, what: string): string => {
    if (frameExists(scene, frame)) return frame;
    missing.push(`${what}:${frame}`);
    warn(`frame '${frame}' for ${what} not in atlas — using fallback`);
    return FALLBACK_FRAME;
  };
  let animated = 0;

  scene.cameras.main.setBackgroundColor(VOID_COLOR);

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
  // a door in the back wall: the opening is a dark recess in the face
  for (const d of doors) {
    if (d.y !== 0) continue;
    if (d.hidden && !closetFound()) continue; // Supply Closet B stays a seam until someone finds it
    ground.batchDrawFrame(ATLAS_KEY, 'trim.void', d.x * TILE + 4, 6, 0.9);
    if (faceRows === 2) ground.batchDrawFrame(ATLAS_KEY, 'trim.void', d.x * TILE + 4, TILE + 2, 0.9);
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
  // ground-layer props (mats, cable ducts): part of the floor, never y-sorted
  const snapshotProps: ArtSnapshot['props'] = [];
  for (const obs of obstacles) {
    const type = obs.type ?? '';
    if (!type || type === 'wall') continue;
    const def = resolveProp(room.id, type, obs.x, obs.y);
    if (!def || def.layer !== 'ground') continue;
    const frame = checkFrame(def.frame, type);
    const s = sizeOf(frame);
    // bottom-left of the frame sits on the footprint's bottom-left (so a 3×2 mat on a 3×1 footprint spreads upward)
    ground.batchDrawFrame(ATLAS_KEY, frame, obs.x * TILE + (def.dx ?? 0), (obs.y + obs.height) * TILE - s.h + (def.dy ?? 0), def.alpha ?? 1);
    snapshotProps.push({ type, x: obs.x, y: obs.y, w: obs.width, h: obs.height, frame, depth: 0, anchor: 'ground' });
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
  const makeSprite = (x: number, y: number, frame: string, anim: AnimDef | undefined, originX: number, originY: number): Phaser.GameObjects.Image => {
    if (anim) {
      const sp = scene.add.sprite(x, y, ATLAS_KEY, frame).setOrigin(originX, originY);
      playAnim(sp, scene, anim);
      animated++;
      return sp;
    }
    return scene.add.image(x, y, ATLAS_KEY, frame).setOrigin(originX, originY);
  };
  const placeProp = (type: string, ox: number, oy: number, ow: number, oh: number, def: PropDef) => {
    const anchor = def.anchor ?? 'floor';
    const key = `${type}@${ox},${oy}`;
    const bottomY = (oy + oh) * TILE;
    const depthFloor = 5 + (def.depthRow ?? (oy + oh - 1));
    const record = (frame: string, depth: number) => snapshotProps.push({ type, x: ox, y: oy, w: ow, h: oh, frame, depth, anchor });
    const finish = (img: Phaser.GameObjects.Image) => {
      if (def.alpha !== undefined) img.setAlpha(def.alpha);
      if (def.flipX) img.setFlipX(true);
      if (!props.has(key)) props.set(key, img);
      return img;
    };
    if (def.fill && def.fill.length) {
      // one frame per footprint tile, each y-sorted by its own row
      for (let ty = oy; ty < oy + oh; ty++) for (let tx = ox; tx < ox + ow; tx++) {
        const frame = checkFrame(def.fill[hash(tx, ty, 7) % def.fill.length], type);
        const depth = 5 + ty;
        finish(makeSprite(tx * TILE + (def.dx ?? 0), (ty + 1) * TILE + (def.dy ?? 0), frame, undefined, 0, 1).setDepth(depth));
        record(frame, depth);
      }
      return;
    }
    if (def.parts && def.parts.length) {
      for (const part of def.parts) {
        const frame = checkFrame(part.frame, type);
        const depth = anchor === 'wall' ? 2 : 5 + (part.depthRow ?? def.depthRow ?? (oy + oh - 1));
        const y = anchor === 'wall' ? oy * TILE + (part.dy ?? 0) : bottomY + (part.dy ?? 0);
        const img = makeSprite(ox * TILE + part.dx, y, frame, part.anim, 0, anchor === 'wall' ? 0 : 1).setDepth(depth);
        if (part.flipX) img.setFlipX(true);
        finish(img);
        record(frame, depth);
      }
      return;
    }
    const frame = checkFrame(def.frame, type);
    if (anchor === 'wall') {
      const img = makeSprite(ox * TILE + (ow * TILE) / 2 + (def.dx ?? 0), oy * TILE + (def.dy ?? 0), frame, def.anim, 0.5, 0).setDepth(2);
      finish(img);
      record(frame, 2);
      return;
    }
    const img = makeSprite(ox * TILE + (ow * TILE) / 2 + (def.dx ?? 0), bottomY + (def.dy ?? 0), frame, def.anim, 0.5, 1).setDepth(depthFloor);
    if (def.shadow) {
      const s = sizeOf(frame);
      scene.add.ellipse(img.x, img.y - 3, Math.max(16, s.w - 6), Math.max(6, Math.round(s.w * 0.22)), 0x000000, 0.18).setDepth(depthFloor - 1);
    }
    finish(img);
    record(frame, depthFloor);
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
    if (def.layer === 'ground') continue; // already in the ground texture
    placeProp(type, obs.x, obs.y, obs.width, obs.height, def);
  }

  // ── Decor on walls / among props ──────────────────────────────────────────
  let decorCount = 0;
  for (const d of decor as DecorDef[]) {
    if (d.layer === 'floor') { decorCount++; continue; }
    if (!frameExists(scene, d.frame)) { missing.push(`decor:${d.frame}`); continue; }
    const s = sizeOf(d.frame);
    if (d.layer === 'wall') {
      makeSprite(d.tx * TILE + (d.dx ?? 0), d.ty * TILE + (d.dy ?? 0), d.frame, d.anim, 0, 0)
        .setDepth(2).setAlpha(d.alpha ?? 1).setFlipX(!!d.flipX);
    } else {
      const cols = Math.max(1, Math.round(s.w / TILE));
      makeSprite(d.tx * TILE + (cols * TILE) / 2 + (d.dx ?? 0), (d.ty + 1) * TILE + (d.dy ?? 0), d.frame, d.anim, 0.5, 1)
        .setDepth(5 + (d.depthRow ?? d.ty) + 0.5).setAlpha(d.alpha ?? 1).setFlipX(!!d.flipX);
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
    props: snapshotProps, decor: decorCount, animated, missing,
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
