/**
 * artCatalog.ts — Run 11 (art-substrate). The ONE data file that maps the game's
 * room data onto LimeZu "Modern Interiors" atlas frames (ASSET_PLAN §3 step 4).
 *
 *  - PROP_DEFAULTS       obstacle `type` → atlas frame (game-wide)
 *  - ROOM_PROP_OVERRIDES per-room / per-instance overrides ("type@x,y")
 *  - ROOM_DECOR          non-solid dressing: wall art, counter clutter, floor mats,
 *                        wear — nothing here has collision; anything with a footprint
 *                        lives in roomData.json as an obstacle
 *  - ROOM_INTERACTABLE_ART  zone/item sprite frame + nudge per room
 *  - ROOM_ART            per-room floor set, wall style/height, trim, lighting
 *
 * Rooms without a ROOM_ART entry still render through the legacy procedural path
 * (roomRenderer.ts) until they are converted — Reception is the first.
 */
import type { AtlasFrame } from './atlasFrames.generated';

export type PropAnchor = 'floor' | 'wall';

export interface PropDef {
  frame: AtlasFrame;
  /** floor (default): sprite bottom-center sits on the footprint's bottom edge and
   *  y-sorts with characters. wall: hangs on the back-wall face, under everything. */
  anchor?: PropAnchor;
  dx?: number;
  dy?: number;
  /** Draw a soft ellipse under it. Most LimeZu props carry a baked base shadow already. */
  shadow?: boolean;
  /** Override the tile row used for depth sorting (default: footprint bottom row). */
  depthRow?: number;
  alpha?: number;
  flipX?: boolean;
}

export interface DecorDef {
  frame: AtlasFrame;
  tx: number;
  ty: number;
  dx?: number;
  dy?: number;
  /** floor: baked into the ground texture (under everything). wall: on the back-wall
   *  face (depth 2). prop: y-sorted with props (depthRow defaults to ty). */
  layer: 'floor' | 'wall' | 'prop';
  alpha?: number;
  depthRow?: number;
  flipX?: boolean;
}

export interface InteractableArt {
  frame?: AtlasFrame;
  dx?: number;
  dy?: number;
}

export type WallStyle = 'cream' | 'beige' | 'green' | 'bluegray' | 'blue' | 'teal';
export type TrimStyle = 'cream' | 'white';

export interface RoomArtStyle {
  floor: {
    /** atlas frame prefix; variants are `${set}.0 … ${set}.${variants-1}` */
    set: string;
    variants: number;
    /** how the variants tile naturally (LimeZu floors are 3×2 seamless blocks) */
    pattern: [number, number];
    /** fraction of tiles swapped to a random sibling variant — kills the repeat */
    scatter: number;
  };
  wall: {
    style: WallStyle;
    /** rows of wall FACE at the top of the room. 2 = LimeZu's full face (cap + baseboard);
     *  1 = a cut-off face (wall continues above the screen). Must match roomData's top wall. */
    rows: 1 | 2;
    trim: TrimStyle;
  };
  /** soft floor wear along walkways: list of tile centers + radius (px) */
  wear: Array<{ tx: number; ty: number; r: number; alpha?: number }>;
  light: {
    ambient: number;
    ambientAlpha: number;
    pools: Array<{ tx: number; ty: number; r: number; color: number; alpha: number }>;
    vignette: number;
  };
}

// ── Game-wide defaults ────────────────────────────────────────────────────────
export const PROP_DEFAULTS: Record<string, PropDef> = {
  desk: { frame: 'prop.desk.wood.pc.3' },
  notice_board: { frame: 'prop.noticeboard', anchor: 'wall' },
  filing_cabinet: { frame: 'prop.cabinet.gray.2' },
  plant: { frame: 'prop.plant.orange.s' },
  printer_station: { frame: 'prop.copier' },
  privacy_screen: { frame: 'prop.stanchion.plain' },
  chairs: { frame: 'prop.bench.yellow' },
  chair: { frame: 'prop.chair.office.gray' },
  tissue_box: { frame: 'prop.table.round.white' },
  magazine_rack: { frame: 'prop.bookshelf.wood' },
  water_dispenser: { frame: 'prop.machine.white' },
  water_cooler: { frame: 'prop.machine.white' },
  trash_can: { frame: 'prop.trash.blue' },
  trash: { frame: 'prop.trash.green' },
  trash_bin: { frame: 'prop.trash.green' },
  wheelchair: { frame: 'prop.wheelchair.side.blue' },
  toy_chest: { frame: 'prop.toychest.red' },
  bench: { frame: 'prop.bench.wood.tan' },
  couch: { frame: 'prop.couch.orange.3' },
  vending_machine: { frame: 'prop.vending.snacks' },
  bulletin_board: { frame: 'prop.bulletin.notes', anchor: 'wall' },
  wall_clock: { frame: 'prop.clock.white', anchor: 'wall' },
  clock: { frame: 'prop.clock.white', anchor: 'wall' },
  hand_sanitizer: { frame: 'prop.sanitizer', anchor: 'wall' },
  whiteboard_wall: { frame: 'prop.whiteboard', anchor: 'wall' },
  bookshelf: { frame: 'prop.bookshelf.wood' },
  table: { frame: 'prop.table.wood.2' },
  bed: { frame: 'prop.bed.blue' },
  patient_bay: { frame: 'prop.bed.blue' },
  gurney: { frame: 'prop.bed.pink' },
  iv_stand: { frame: 'prop.ivpole.a' },
  curtain_partition: { frame: 'prop.curtain.blue' },
  crash_cart: { frame: 'prop.cart.monitor' },
  vital_monitor: { frame: 'prop.monitor.stand' },
  exam_table: { frame: 'prop.exam_table' },
  microscope: { frame: 'prop.microscope' },
  box: { frame: 'prop.box.single' },
  archive_box: { frame: 'prop.boxes.stack' },
  lost_and_found_box: { frame: 'prop.box.single' },
  welcome_mat: { frame: 'prop.mat.blue' },
  info_kiosk: { frame: 'prop.infostand.blue' },
  flower_arrangement: { frame: 'prop.flowers.red' },
  coffee_mug: { frame: 'prop.mug.red' },
  inbox_tray: { frame: 'prop.papers.a' },
  outbox_tray: { frame: 'prop.papers.b' },
  coat_rack: { frame: 'prop.hooks.a', anchor: 'wall' },
};

// ── Per-room overrides ("type" or "type@x,y") ────────────────────────────────
export const ROOM_PROP_OVERRIDES: Record<string, Record<string, PropDef>> = {
  reception: {
    // The U-shaped reception counter is 6×3 on a 6×2 footprint: its back counter
    // (monitor + wings) rises into the wall row, its open well sits at row 2, its
    // front panel faces the waiting room. Riley stands out front at (10,4).
    desk: { frame: 'prop.counter.reception.wood' },
    'filing_cabinet@4,2': { frame: 'prop.cabinet.gray.2' },
    'filing_cabinet@15,2': { frame: 'prop.cabinet.pink.2' },
    'plant@1,2': { frame: 'prop.plant.orange.m' },
    'plant@18,2': { frame: 'prop.plant.white.m' },
    'plant@1,5': { frame: 'prop.fern.m' },
    'chairs@2,8': { frame: 'prop.bench.yellow' },
    'chairs@2,10': { frame: 'prop.bench.yellow' },
    'chairs@16,8': { frame: 'prop.bench.green' },
    'chairs@16,10': { frame: 'prop.bench.green' },
    notice_board: { frame: 'prop.noticeboard', anchor: 'wall', dy: 2 },
    privacy_screen: { frame: 'prop.stanchion.plain' },
  },
};

// ── Dressing (no collision) ──────────────────────────────────────────────────
export const ROOM_DECOR: Record<string, DecorDef[]> = {
  reception: [
    // back wall, left to right (eye-level, spaced unevenly — EarthBound rule)
    { frame: 'prop.picture.landscape.a', tx: 1, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.lightswitch', tx: 2, ty: 1, dy: -2, layer: 'wall' },
    { frame: 'prop.clock.white', tx: 4, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.sanitizer', tx: 6, ty: 0, dy: -2, layer: 'wall' },
    { frame: 'prop.poster.green', tx: 16, ty: 0, dy: 12, layer: 'wall' },
    { frame: 'prop.poster.blue.a', tx: 17, ty: 0, dy: 14, layer: 'wall' },
    // the busy counter — Riley's empty chair in the well, clutter on the back counter
    { frame: 'prop.chair.office.gray', tx: 10, ty: 2, dy: -3, layer: 'prop', depthRow: 2 },
    { frame: 'prop.clipboard.green', tx: 8, ty: 1, dx: -4, dy: -5, layer: 'prop', depthRow: 3 },
    { frame: 'prop.papers.a', tx: 11, ty: 1, dx: -6, dy: -4, layer: 'prop', depthRow: 3 },
    { frame: 'prop.mug.red', tx: 11, ty: 1, dx: 12, dy: -7, layer: 'prop', depthRow: 3 },
    // floor: mats inside both doors, a little life on the floor
    { frame: 'prop.mat.tan.3x2', tx: 8.5, ty: 8.5, layer: 'floor' },
    { frame: 'prop.mat.blue', tx: 1, ty: 7, layer: 'floor' },
    { frame: 'prop.mat.blue', tx: 18, ty: 7, layer: 'floor' },
    { frame: 'prop.rubbish', tx: 6, ty: 12, layer: 'floor', alpha: 0.6 },
    { frame: 'prop.papers.b', tx: 14, ty: 11, layer: 'floor', alpha: 0.75 },
  ],
};

// ── Interactable sprites (zones / items) ─────────────────────────────────────
export const ROOM_INTERACTABLE_ART: Record<string, Record<string, InteractableArt>> = {
  reception: {
    // both zones sit on the counter's front ledge, not on the floor in front of it
    sign_in_sheet: { frame: 'prop.clipboard.blue', dy: -26 },
    privacy_notice: { frame: 'prop.sign.small', dy: -26 },
    patient_rights_poster: { frame: 'prop.monitor.pc' },
  },
};

// ── Room styles ──────────────────────────────────────────────────────────────
export const ROOM_ART: Record<string, RoomArtStyle> = {
  reception: {
    floor: { set: 'floor.reception', variants: 6, pattern: [3, 2], scatter: 0.18 },
    wall: { style: 'cream', rows: 2, trim: 'cream' },
    wear: [
      // the trodden path: door → counter → door, and spawn → counter
      { tx: 2, ty: 7, r: 26 }, { tx: 5, ty: 6.5, r: 30 }, { tx: 8, ty: 5.5, r: 34 },
      { tx: 10, ty: 5.2, r: 40, alpha: 0.08 }, { tx: 12, ty: 5.5, r: 34 }, { tx: 15, ty: 6.5, r: 30 },
      { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 8.5, r: 30 }, { tx: 10, ty: 11.5, r: 30 },
    ],
    light: {
      ambient: 0xffe4c2,
      ambientAlpha: 0.16,
      pools: [
        { tx: 5, ty: 6, r: 150, color: 0xffe9c8, alpha: 0.11 },
        { tx: 10, ty: 7, r: 170, color: 0xffefd6, alpha: 0.12 },
        { tx: 15, ty: 6, r: 150, color: 0xffe9c8, alpha: 0.11 },
        { tx: 10, ty: 12, r: 140, color: 0xffe9c8, alpha: 0.08 },
      ],
      vignette: 0.34,
    },
  },
};

export function getRoomArt(roomId: string): RoomArtStyle | undefined {
  return ROOM_ART[roomId];
}

export function isArtRoom(roomId: string): boolean {
  return !!ROOM_ART[roomId];
}

/** Resolve an obstacle's prop definition: instance override → room type override → default. */
export function resolveProp(roomId: string, type: string, x: number, y: number): PropDef | undefined {
  const room = ROOM_PROP_OVERRIDES[roomId];
  return room?.[`${type}@${x},${y}`] ?? room?.[type] ?? PROP_DEFAULTS[type];
}

export function resolveInteractableArt(roomId: string, id: string): InteractableArt | undefined {
  return ROOM_INTERACTABLE_ART[roomId]?.[id];
}
