/**
 * artCatalog.ts — Run 11 (art-substrate). The ONE data file that maps the game's
 * room data onto LimeZu "Modern Interiors" atlas frames (ASSET_PLAN §3 step 4).
 *
 *  - PROP_DEFAULTS          obstacle `type` → how to draw it (game-wide)
 *  - ROOM_PROP_OVERRIDES    per-room / per-instance overrides ("type@x,y")
 *  - ROOM_DECOR             non-solid dressing: wall art, counter clutter, floor mats,
 *                           wear — nothing here has collision; anything with a footprint
 *                           lives in roomData.json as an obstacle
 *  - ROOM_INTERACTABLE_ART  zone/item sprite frame + nudge per room
 *  - ROOM_ART               per-room floor set, wall style/height, trim, lighting
 *
 * Frame names are checked against the generated `AtlasFrame` union, so a typo here
 * fails `tsc` instead of rendering a crate.
 */
import type { AtlasFrame } from './atlasFrames.generated';

export type PropAnchor = 'floor' | 'wall';

export interface AnimDef {
  frames: AtlasFrame[];
  frameRate: number;
  yoyo?: boolean;
}

export interface PropPart {
  frame: AtlasFrame;
  /** pixels from the footprint's bottom-left (parts are bottom-left anchored) */
  dx: number;
  dy?: number;
  depthRow?: number;
  flipX?: boolean;
  anim?: AnimDef;
}

export interface PropDef {
  frame: AtlasFrame;
  /** floor (default): sprite bottom-center sits on the footprint's bottom edge and
   *  y-sorts with characters. wall: hangs on the back-wall face, under everything. */
  anchor?: PropAnchor;
  /** ground: baked into the floor texture (mats, cable ducts) — never y-sorted */
  layer?: 'ground';
  dx?: number;
  dy?: number;
  /** Draw a soft ellipse under it. Most LimeZu props carry a baked base shadow already. */
  shadow?: boolean;
  /** Override the tile row used for depth sorting (default: footprint bottom row). */
  depthRow?: number;
  alpha?: number;
  flipX?: boolean;
  /** several sprites making one prop (a bay = bed + table + IV pole) */
  parts?: PropPart[];
  /** one 32×32 frame per footprint tile, picked by position hash (benches, counters) */
  fill?: AtlasFrame[];
  anim?: AnimDef;
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
  anim?: AnimDef;
}

export interface InteractableArt {
  frame?: AtlasFrame;
  dx?: number;
  dy?: number;
}

export type WallStyle = 'cream' | 'beige' | 'green' | 'bluegray' | 'blue' | 'teal' | 'gray' | 'lavender';
export type TrimStyle = 'cream' | 'white';

export interface RoomArtStyle {
  floor: { set: string; variants: number; pattern: [number, number]; scatter: number };
  wall: { style: WallStyle; rows: 1 | 2; trim: TrimStyle };
  wear: Array<{ tx: number; ty: number; r: number; alpha?: number }>;
  light: {
    ambient: number;
    ambientAlpha: number;
    pools: Array<{ tx: number; ty: number; r: number; color: number; alpha: number }>;
    vignette: number;
  };
}

// ── Animations (atlas-frame loops) ───────────────────────────────────────────
export const ANIM_SERVER: AnimDef = { frames: ['anim.server.0', 'anim.server.1', 'anim.server.2'], frameRate: 3 };
export const ANIM_MONITOR: AnimDef = { frames: ['anim.monitor.0', 'anim.monitor.1', 'anim.monitor.2', 'anim.monitor.3'], frameRate: 2 };
export const ANIM_COFFEE: AnimDef = { frames: ['anim.coffee.0', 'anim.coffee.1', 'anim.coffee.2', 'anim.coffee.3', 'anim.coffee.4', 'anim.coffee.5'], frameRate: 5 };
export const ANIM_TVNEWS: AnimDef = { frames: ['anim.tvnews.0', 'anim.tvnews.1', 'anim.tvnews.2', 'anim.tvnews.3'], frameRate: 1.5 };
export const ANIM_HSCREEN: AnimDef = { frames: ['anim.hscreen.0', 'anim.hscreen.1', 'anim.hscreen.2', 'anim.hscreen.3'], frameRate: 3 };
export const ANIM_CAMERA: AnimDef = { frames: ['anim.camera.0', 'anim.camera.1', 'anim.camera.2', 'anim.camera.3', 'anim.camera.4'], frameRate: 2, yoyo: true };
export const ANIM_SCREENS: AnimDef = { frames: ['anim.screens.0', 'anim.screens.1', 'anim.screens.2'], frameRate: 1.2 };

const SERVER_RACK_3: PropDef = {
  frame: 'anim.server.0',
  parts: [
    { frame: 'anim.server.0', dx: 0, anim: ANIM_SERVER },
    { frame: 'anim.server.0', dx: 32, anim: ANIM_SERVER },
    { frame: 'anim.server.0', dx: 64, anim: ANIM_SERVER },
  ],
};
const WHITE_COUNTER_FILL: AtlasFrame[] = ['prop.counter.kw.plain', 'prop.counter.kw.drawers', 'prop.counter.kw.doors', 'prop.counter.kw.shelf', 'prop.counter.kw.plain2'];

// ── Game-wide defaults ────────────────────────────────────────────────────────
export const PROP_DEFAULTS: Record<string, PropDef> = {
  // counters / desks
  desk: { frame: 'prop.counter.reception.wood' },
  records_counter: { frame: 'prop.desk.k.wood', parts: [{ frame: 'prop.desk.k.wood', dx: 0 }, { frame: 'prop.desk.k.wood', dx: 64 }] },
  clerk_desk: { frame: 'prop.desk.wood.pc.3', parts: [{ frame: 'prop.desk.wood.pc.3', dx: 0 }, { frame: 'prop.drawers.tan', dx: 96 }] },
  triage_desk: { frame: 'prop.counter.kw.plain', fill: WHITE_COUNTER_FILL },
  lab_bench: { frame: 'prop.counter.kw.plain', fill: WHITE_COUNTER_FILL },
  nurse_station: { frame: 'prop.nurse_station.2', parts: [{ frame: 'prop.nurse_station.2', dx: 0 }, { frame: 'prop.nurse_station.2', dx: 64 }] },
  monitoring_desk: { frame: 'prop.console.blue.4' },
  workstation_cluster: { frame: 'prop.console.blue.2' },
  table: { frame: 'prop.table.small.brown' },
  lunch_table: { frame: 'prop.conftable' },
  // seating
  chairs: { frame: 'prop.bench.yellow' },
  chair: { frame: 'prop.chair.office.gray' },
  bench: { frame: 'prop.bench.wood.tan' },
  couch: { frame: 'prop.couch.gray.3' },
  wheelchair: { frame: 'prop.wheelchair.side.blue' },
  // storage
  filing_cabinet: { frame: 'prop.cabinet.gray.2' },
  locked_cabinet: { frame: 'prop.cabinet.gray.2' },
  bookshelf: { frame: 'prop.bookshelf.wood' },
  bookcase: { frame: 'prop.bookcase.2.b' },
  magazine_rack: { frame: 'prop.bookshelf.wood' },
  shelf: { frame: 'prop.shelf.bottles.a', parts: [{ frame: 'prop.shelf.bottles.a', dx: 0 }, { frame: 'prop.shelf.narrow.books', dx: 64 }] },
  chemical_shelf: { frame: 'prop.shelf.narrow.meds' },
  sample_rack: { frame: 'prop.shelf.meds' },
  archive_box: { frame: 'prop.boxes.stack' },
  box: { frame: 'prop.box.single' },
  boxes: { frame: 'prop.boxes.stack' },
  lost_and_found_box: { frame: 'prop.box.single' },
  toy_chest: { frame: 'prop.toychest.red' },
  inbox_tray: { frame: 'prop.table.small.brown', parts: [{ frame: 'prop.table.small.brown', dx: 0 }, { frame: 'prop.papers.a', dx: 0, dy: -12 }] },
  outbox_tray: { frame: 'prop.table.small.brown', parts: [{ frame: 'prop.table.small.brown', dx: 0 }, { frame: 'prop.papers.b', dx: 0, dy: -12 }] },
  document_cart: { frame: 'prop.cart.wood.b' },
  filing_cart: { frame: 'prop.cart.wood.a', parts: [{ frame: 'prop.cart.wood.a', dx: 0 }, { frame: 'prop.cart.wood.a', dx: 32 }] },
  // machines
  printer_station: { frame: 'prop.copier' },
  scanner_station: { frame: 'prop.desk.wood.pc', parts: [{ frame: 'prop.desk.wood.pc', dx: 0 }, { frame: 'prop.fax.a', dx: 34, dy: -22 }] },
  shredder_station: { frame: 'prop.cabinet.gray.2' },
  server_rack: SERVER_RACK_3,
  monitor_bank: { frame: 'anim.monitor.0', anim: ANIM_MONITOR },
  defense_console: { frame: 'prop.terminal.old' },
  cable_tray: { frame: 'prop.mat.gray', layer: 'ground' },
  vending_machine: { frame: 'prop.vending.snacks' },
  water_dispenser: { frame: 'prop.machine.white' },
  water_cooler: { frame: 'prop.table.small.white', parts: [{ frame: 'prop.table.small.white', dx: 0 }, { frame: 'prop.watercooler.top', dx: 0, dy: -14 }] },
  coffee_mug: { frame: 'prop.table.small.gray', parts: [{ frame: 'prop.table.small.gray', dx: 0 }, { frame: 'anim.coffee.0', dx: 0, dy: -12, anim: ANIM_COFFEE }] },
  headphones: { frame: 'prop.table.small.gray', parts: [{ frame: 'prop.table.small.gray', dx: 0 }, { frame: 'prop.phone.black', dx: 0, dy: -12 }] },
  microwave: { frame: 'prop.counter.k.plain', parts: [{ frame: 'prop.counter.k.plain', dx: 0 }, { frame: 'prop.microwave.a', dx: 0, dy: -14 }] },
  open_fridge: { frame: 'prop.fridge.open.a' },
  specimen_fridge: { frame: 'prop.fridge.gray.2' },
  coffee_station: {
    frame: 'prop.fridge.gray.b',
    parts: [
      { frame: 'prop.fridge.gray.b', dx: 0 },
      { frame: 'prop.counter.k.plain', dx: 32, dy: -32 }, { frame: 'prop.counter.k.shelf', dx: 64, dy: -32 },
      { frame: 'prop.counter.k.drawers', dx: 32 }, { frame: 'prop.counter.k.doors', dx: 64 },
      { frame: 'anim.coffee.0', dx: 36, dy: -44, anim: ANIM_COFFEE }, { frame: 'prop.mug.blue', dx: 70, dy: -46 },
    ],
  },
  tv_stand: { frame: 'prop.tv.stand.dark' },
  // medical
  bed: { frame: 'prop.bed.blue' },
  patient_bay: { frame: 'prop.bed.blue', parts: [{ frame: 'prop.bed.blue', dx: 0 }, { frame: 'prop.table.small.white', dx: 64 }, { frame: 'prop.ivpole.a', dx: 96 }] },
  gurney: { frame: 'prop.examtable.white', parts: [{ frame: 'prop.examtable.white', dx: 0 }, { frame: 'prop.ivpole.b', dx: 64 }] },
  exam_table: { frame: 'prop.examtable.white' },
  iv_stand: { frame: 'prop.ivpole.a' },
  curtain_partition: { frame: 'prop.blinds.blue' },
  crash_cart: { frame: 'prop.cart.wood.b', parts: [{ frame: 'prop.cart.wood.b', dx: 0 }, { frame: 'prop.table.small.gray', dx: 32 }, { frame: 'prop.monitor.ecg', dx: 32, dy: -14 }] },
  vital_monitor: { frame: 'prop.monitor.stand' },
  equipment: { frame: 'prop.cart.monitor', parts: [{ frame: 'prop.cart.monitor', dx: 0 }, { frame: 'prop.cart.wood.a', dx: 32 }] },
  microscope: { frame: 'prop.desk.monitor.3' },
  microscope_station: { frame: 'prop.desk.monitor.3' },
  centrifuge: { frame: 'prop.scanner.ct', parts: [{ frame: 'prop.scanner.ct', dx: 0 }, { frame: 'prop.cart.monitor', dx: 64 }] },
  fume_hood: { frame: 'prop.cabinet.glass.3' },
  bio_cabinet: { frame: 'prop.cabinet.glass.2' },
  sink_station: { frame: 'prop.sink.white', parts: [{ frame: 'prop.sink.white', dx: 0 }, { frame: 'prop.counter.kw.drawers', dx: 32 }] },
  eyewash_station: { frame: 'prop.dispenser.c' },
  autoclave: { frame: 'prop.fridge.gray.c', parts: [{ frame: 'prop.fridge.gray.c', dx: 0 }, { frame: 'prop.counter.kw.plain', dx: 32 }, { frame: 'prop.microwave.c', dx: 32, dy: -16 }] },
  hand_sanitizer: { frame: 'prop.dispenser.c' },
  glove_dispenser: { frame: 'prop.dispenser.c' },
  defibrillator_mount: { frame: 'prop.table.small.gray', parts: [{ frame: 'prop.table.small.gray', dx: 0 }, { frame: 'prop.firstaid', dx: 0, dy: -14 }] },
  // wall-mounted
  notice_board: { frame: 'prop.noticeboard', anchor: 'wall' },
  bulletin_board: { frame: 'prop.bulletin.notes', anchor: 'wall' },
  results_board: { frame: 'prop.chalkboard.dark.3', anchor: 'wall' },
  whiteboard_wall: { frame: 'prop.chalkboard.dark.3' },
  wall_clock: { frame: 'prop.clock.white', anchor: 'wall', dy: -8 },
  clock: { frame: 'prop.clock.white', anchor: 'wall', dy: -8 },
  // a fluorescent tube on the wall — LimeZu has no sconce, and corridors have tubes anyway
  wall_sconce: { frame: 'prop.lightbar.2', anchor: 'wall', dy: -22 },
  emergency_light: { frame: 'prop.sign.exit', anchor: 'wall', dy: 10 },
  biohazard_sign: { frame: 'prop.sign.warning', anchor: 'wall', dy: 12 },
  coat_rack: { frame: 'prop.lamp.floor' },
  // plants / floor
  plant: { frame: 'prop.plant.orange.s' },
  flower_arrangement: { frame: 'prop.flowers.red' },
  welcome_mat: { frame: 'prop.mat.tan.3x2', layer: 'ground' },
  info_kiosk: { frame: 'prop.infostand.blue' },
  umbrella_stand: { frame: 'prop.basket' },
  privacy_screen: { frame: 'prop.stanchion.plain' },
  stanchion: { frame: 'prop.stanchion.plain' },
  tissue_box: { frame: 'prop.table.round.white' },
  trash_can: { frame: 'prop.trash.blue' },
  trash: { frame: 'prop.trash.green' },
  trash_bin: { frame: 'prop.trash.green' },
};

// ── Per-room overrides ("type" or "type@x,y") ────────────────────────────────
export const ROOM_PROP_OVERRIDES: Record<string, Record<string, PropDef>> = {
  hospital_entrance: {
    desk: { frame: 'prop.counter.reception.white' },
    'plant@18,2': { frame: 'prop.fern.m' },
    'plant@1,2': { frame: 'prop.plant.orange.m' },
    'plant@1,11': { frame: 'prop.plant.white.s' },
    'plant@18,11': { frame: 'prop.plant.orange.s' },
    'chairs@2,8': { frame: 'prop.bench.round.yellow' },
    'chairs@2,10': { frame: 'prop.bench.round.yellow' },
    'chairs@16,8': { frame: 'prop.bench.round.green' },
    'chairs@16,10': { frame: 'prop.bench.round.pink' },
    table: { frame: 'prop.table.small.white', parts: [{ frame: 'prop.table.small.white', dx: 0 }, { frame: 'prop.papers.b', dx: 0, dy: -12 }] },
    wheelchair: { frame: 'prop.wheelchair.side.tan' },
  },
  reception: {
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
  },
  hallway_reception_break: {
    'bench@5,5': { frame: 'prop.bench.wood.tan' }, 'bench@14,5': { frame: 'prop.bench.wood.orange' },
    'plant@10,2': { frame: 'prop.plant.white.m' },
    vending_machine: { frame: 'prop.fridge.glass.tall' },
  },
  hallway_break_lab: {
    'plant@6,2': { frame: 'prop.plant.orange.s' }, 'plant@13,2': { frame: 'prop.plant.white.s' },
    bench: { frame: 'prop.bench.wood.tan' },
  },
  hallway_lab_records: {
    'bench@4,5': { frame: 'prop.bench.wood.orange' }, 'bench@15,5': { frame: 'prop.bench.wood.tan' },
    'plant@10,2': { frame: 'prop.fern.s' },
  },
  hallway_records_it: {
    'plant@7,2': { frame: 'prop.plant.white.s' }, 'plant@12,2': { frame: 'prop.plant.orange.m' },
    bench: { frame: 'prop.bench.wood.tan' },
    server_rack: { frame: 'anim.server.0', anim: ANIM_SERVER },
    cable_tray: { frame: 'prop.rail.lights.2', anchor: 'wall', dy: 6 },
  },
  hallway_it_er: {
    bench: { frame: 'prop.bench.wood.orange' },
    'plant@14,2': { frame: 'prop.plant.white.m' },
    wheelchair: { frame: 'prop.wheelchair.side.tan' },
  },
  supply_closet: {
    trash: { frame: 'prop.trash.green' },
    plant: { frame: 'prop.fern.s' },
  },
  lab: {
    'plant@1,4': { frame: 'prop.fern.m' },
  },
  records_room: {
    'filing_cabinet@3,2': { frame: 'prop.drawers.column' },
    'filing_cabinet@16,2': { frame: 'prop.drawers.column' },
    'filing_cabinet@6,2': { frame: 'prop.shelf.narrow.books' },
    'filing_cabinet@13,2': { frame: 'prop.shelf.narrow.books' },
    'bookcase@1,2': { frame: 'prop.bookcase.2.a' },
    'bookcase@17,2': { frame: 'prop.bookcase.2.c' },
  },
  it_office: {
    table: { frame: 'prop.table.wood.2' },
    printer_station: { frame: 'prop.desk.glass.3', parts: [{ frame: 'prop.desk.glass.3', dx: 0 }, { frame: 'prop.copier', dx: 34, dy: -18 }] },
    'chair@1,8': { frame: 'prop.chair.office.gray' },
    'chair@18,8': { frame: 'prop.chair.office.sky' },
    plant: { frame: 'prop.fern.s' },
  },
  er: {
    'patient_bay@14,2': { frame: 'prop.bed.pink', parts: [{ frame: 'prop.monitor.stand', dx: 0 }, { frame: 'prop.table.small.white', dx: 32 }, { frame: 'prop.bed.pink', dx: 64 }] },
    'curtain_partition@13,2': { frame: 'prop.blinds.tan' },
    'gurney@15,9': { frame: 'prop.examtable.blue', parts: [{ frame: 'prop.monitor.stand', dx: 0 }, { frame: 'prop.examtable.blue', dx: 32 }] },
    'iv_stand@18,12': { frame: 'prop.ivpole.b' },
    wheelchair: { frame: 'prop.wheelchair.side.tan' },
  },
  break_room: {
    'vending_machine@2,2': { frame: 'prop.vending.snacks' },
    'vending_machine@5,2': { frame: 'prop.vending.gray' },
    'couch@2,10': { frame: 'prop.couch.gray.3' },
    'couch@15,10': { frame: 'prop.couch.orange.3l' },
    'chair@7,8': { frame: 'prop.chair.wood.side.tan' },
    'chair@12,8': { frame: 'prop.chair.wood.side.orange', flipX: true },
    'plant@1,13': { frame: 'prop.fern.m' },
    // the waiting-room TV is on: LimeZu's hospital news report, 36 frames of it
    tv_stand: { frame: 'anim.tvnews.0', anim: ANIM_TVNEWS },
  },
};

// ── Dressing (no collision) ──────────────────────────────────────────────────
const doorMats = (spots: Array<[number, number]>, frame: AtlasFrame = 'prop.mat.blue'): DecorDef[] =>
  spots.map(([tx, ty]) => ({ frame, tx, ty, layer: 'floor' as const }));

const hallwayDecor = (extra: DecorDef[]): DecorDef[] => [
  ...doorMats([[1, 3], [18, 3]], 'prop.mat.gray'),
  ...extra,
];

export const ROOM_DECOR: Record<string, DecorDef[]> = {
  hospital_entrance: [
    { frame: 'prop.lightswitch', tx: 1, ty: 1, dy: -2, layer: 'wall' },
    { frame: 'prop.poster.blue.b', tx: 4, ty: 0, dy: 12, layer: 'wall' },
    { frame: 'prop.clock.blue', tx: 5, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.picture.landscape.b', tx: 13, ty: 0, dy: 12, layer: 'wall' },
    { frame: 'prop.sanitizer', tx: 15, ty: 0, dy: -2, layer: 'wall' },
    { frame: 'prop.sign.arrow.r', tx: 16, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.chair.office.sky', tx: 10, ty: 2, dy: -3, layer: 'prop', depthRow: 2 },
    { frame: 'prop.phone.gray', tx: 8, ty: 1, dx: -6, dy: -6, layer: 'prop', depthRow: 3 },
    { frame: 'prop.clipboard.plain', tx: 11, ty: 1, dx: 6, dy: -5, layer: 'prop', depthRow: 3 },
    ...doorMats([[18, 7]]),
    { frame: 'prop.papers.a', tx: 5, ty: 6, layer: 'floor', alpha: 0.7 },
    { frame: 'prop.rubbish', tx: 14, ty: 12, layer: 'floor', alpha: 0.55 },
  ],
  reception: [
    { frame: 'prop.picture.landscape.a', tx: 1, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.lightswitch', tx: 2, ty: 1, dy: -2, layer: 'wall' },
    { frame: 'prop.clock.white', tx: 4, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.sanitizer', tx: 6, ty: 0, dy: -2, layer: 'wall' },
    { frame: 'prop.poster.green', tx: 16, ty: 0, dy: 12, layer: 'wall' },
    { frame: 'prop.poster.blue.a', tx: 17, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.chair.office.gray', tx: 10, ty: 2, dy: -3, layer: 'prop', depthRow: 2 },
    { frame: 'prop.clipboard.green', tx: 8, ty: 1, dx: -4, dy: -5, layer: 'prop', depthRow: 3 },
    { frame: 'prop.papers.a', tx: 11, ty: 1, dx: -6, dy: -4, layer: 'prop', depthRow: 3 },
    { frame: 'prop.mug.red', tx: 11, ty: 1, dx: 12, dy: -7, layer: 'prop', depthRow: 3 },
    { frame: 'prop.mat.tan.3x2', tx: 8.5, ty: 8.5, layer: 'floor' },
    ...doorMats([[1, 7], [18, 7]]),
    { frame: 'prop.rubbish', tx: 6, ty: 12, layer: 'floor', alpha: 0.6 },
    { frame: 'prop.papers.b', tx: 14, ty: 11, layer: 'floor', alpha: 0.75 },
  ],
  hallway_reception_break: hallwayDecor([
    { frame: 'prop.picture.landscape.c', tx: 1, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.extinguisher', tx: 17, ty: 1, dy: 4, layer: 'wall' },
    { frame: 'prop.poster.orange', tx: 13, ty: 0, dy: 14, layer: 'wall' },
  ]),
  hallway_break_lab: hallwayDecor([
    { frame: 'prop.picture.landscape.d', tx: 1, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.sign.chart', tx: 11, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.extinguisher', tx: 17, ty: 1, dy: 4, layer: 'wall' },
  ]),
  hallway_lab_records: hallwayDecor([
    { frame: 'prop.poster.green', tx: 2, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.picture.landscape.a', tx: 16, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.firstaid', tx: 12, ty: 1, dy: -4, layer: 'wall' },
  ]),
  hallway_records_it: hallwayDecor([
    { frame: 'anim.camera.0', tx: 2, ty: 0, dy: 8, layer: 'wall', anim: ANIM_CAMERA },
    { frame: 'prop.sign.warning', tx: 16, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.rail.lights.2', tx: 9, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.mat.gray', tx: 15, ty: 4, layer: 'floor' },
  ]),
  hallway_it_er: hallwayDecor([
    { frame: 'prop.sign.cross', tx: 2, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.picture.landscape.b', tx: 7, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.sign.exit', tx: 18, ty: 0, dy: 12, layer: 'wall' },
  ]),
  supply_closet: [
    { frame: 'prop.ladder.a', tx: 5, ty: 0, dy: 18, layer: 'wall' },
    { frame: 'prop.mop', tx: 3, ty: 5, layer: 'prop' },
    { frame: 'prop.box.single', tx: 5, ty: 1, dy: 6, layer: 'prop', depthRow: 1 },
    { frame: 'prop.basket', tx: 6, ty: 6, layer: 'prop' },
    { frame: 'prop.debris', tx: 2, ty: 4, layer: 'floor', alpha: 0.6 },
  ],
  lab: [
    { frame: 'prop.rail.lights.6', tx: 3, ty: 0, dy: 2, layer: 'wall' },
    { frame: 'prop.sign.warning', tx: 1, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.window.gray.3', tx: 12, ty: 0, dy: 2, layer: 'wall' },
    { frame: 'prop.sign.cross', tx: 16, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.poster.green', tx: 17, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.microscope', tx: 2, ty: 2, dx: 8, dy: -22, layer: 'prop', depthRow: 3 },
    { frame: 'prop.bottle.blue', tx: 4, ty: 5, dx: 4, dy: -8, layer: 'prop', depthRow: 5 },
    { frame: 'prop.bottle.orange', tx: 6, ty: 5, dx: -6, dy: -8, layer: 'prop', depthRow: 5 },
    { frame: 'prop.papers.a', tx: 7, ty: 6, dy: -8, layer: 'prop', depthRow: 6 },
    { frame: 'prop.microscope', tx: 13, ty: 5, dx: 6, dy: -9, layer: 'prop', depthRow: 5 },
    { frame: 'prop.bottle.blue', tx: 15, ty: 6, dx: 10, dy: -8, layer: 'prop', depthRow: 6 },
    { frame: 'prop.clipboard.sky', tx: 16, ty: 5, dx: -4, dy: -8, layer: 'prop', depthRow: 5 },
    { frame: 'prop.bottle.orange', tx: 8, ty: 1, dx: 4, dy: 12, layer: 'wall' },
    ...doorMats([[1, 7], [18, 7]], 'prop.mat.gray'),
    { frame: 'prop.papers.b', tx: 10, ty: 9, layer: 'floor', alpha: 0.7 },
  ],
  records_room: [
    { frame: 'prop.corkboard.2x1', tx: 1, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.clock.gray', tx: 5, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.sign.small', tx: 14, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'anim.camera.0', tx: 18, ty: 0, dy: 8, layer: 'wall', anim: ANIM_CAMERA },
    { frame: 'prop.papers.a', tx: 9, ty: 2, dx: -4, dy: -8, layer: 'prop', depthRow: 2 },
    { frame: 'prop.phone.black', tx: 10, ty: 2, dx: 8, dy: -8, layer: 'prop', depthRow: 2 },
    { frame: 'prop.binders', tx: 11, ty: 8, dx: 2, dy: -24, layer: 'prop', depthRow: 9 },
    { frame: 'prop.debris', tx: 3, ty: 13, dx: -4, layer: 'floor', alpha: 0.8 },
    { frame: 'prop.papers.b', tx: 5, ty: 9, layer: 'floor', alpha: 0.7 },
    { frame: 'prop.papers.a', tx: 12, ty: 6, layer: 'floor', alpha: 0.6 },
    ...doorMats([[1, 7], [18, 7]], 'prop.mat.gray'),
  ],
  it_office: [
    { frame: 'anim.screens.0', tx: 8, ty: 0, layer: 'wall', anim: ANIM_SCREENS },
    { frame: 'prop.rail.lights.6', tx: 1, ty: 0, dy: 2, layer: 'wall' },
    { frame: 'prop.rail.lights.6', tx: 12, ty: 0, dy: 2, layer: 'wall' },
    { frame: 'anim.camera.0', tx: 4, ty: 0, dy: 8, layer: 'wall', anim: ANIM_CAMERA },
    { frame: 'prop.sign.warning', tx: 15, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.switch.a', tx: 17, ty: 12, dx: 4, dy: -22, layer: 'prop', depthRow: 12 },
    { frame: 'prop.keyboard', tx: 9, ty: 6, dx: 2, dy: -10, layer: 'prop', depthRow: 6 },
    { frame: 'prop.papers.a', tx: 10, ty: 6, dx: 6, dy: -10, layer: 'prop', depthRow: 6 },
    { frame: 'prop.mat.gray', tx: 4, ty: 4, layer: 'floor' },
    { frame: 'prop.mat.gray', tx: 15, ty: 4, layer: 'floor' },
    { frame: 'prop.mat.gray', tx: 4, ty: 5, layer: 'floor' },
    { frame: 'prop.mat.gray', tx: 15, ty: 5, layer: 'floor' },
    ...doorMats([[1, 7], [18, 7]], 'prop.mat.gray'),
    { frame: 'prop.papers.b', tx: 6, ty: 12, layer: 'floor', alpha: 0.7 },
  ],
  er: [
    { frame: 'anim.hscreen.0', tx: 3, ty: 0, dy: 14, layer: 'wall', anim: ANIM_HSCREEN },
    { frame: 'prop.sign.cross', tx: 7, ty: 0, dy: 12, layer: 'wall' },
    { frame: 'prop.whiteboard', tx: 9, ty: 0, dy: 2, layer: 'wall' },
    { frame: 'prop.firstaid', tx: 12, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'anim.hscreen.0', tx: 15, ty: 0, dy: 14, layer: 'wall', anim: ANIM_HSCREEN },
    { frame: 'prop.clock.white', tx: 1, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.clipboard.navy', tx: 9, ty: 9, dx: -6, dy: -8, layer: 'prop', depthRow: 9 },
    { frame: 'prop.phone.red', tx: 11, ty: 9, dx: 4, dy: -8, layer: 'prop', depthRow: 9 },
    ...doorMats([[1, 7]], 'prop.mat.gray'),
    { frame: 'prop.debris', tx: 11, ty: 12, layer: 'floor', alpha: 0.6 },
    { frame: 'prop.papers.a', tx: 7, ty: 12, layer: 'floor', alpha: 0.6 },
  ],
  break_room: [
    { frame: 'prop.painting.sunset', tx: 1, ty: 0, dy: 2, layer: 'wall' },
    { frame: 'prop.clock.teal', tx: 4, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.picture.coffee', tx: 13, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.picture.cup', tx: 14, ty: 0, dy: 18, layer: 'wall' },
    { frame: 'prop.cabinet.upper.beige', tx: 16, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.food.a', tx: 8, ty: 6, dx: 6, dy: -14, layer: 'prop', depthRow: 8 },
    { frame: 'prop.mug.brown', tx: 10, ty: 6, dx: 4, dy: -12, layer: 'prop', depthRow: 8 },
    { frame: 'prop.food.c', tx: 10, ty: 7, dx: -8, dy: -10, layer: 'prop', depthRow: 8 },
    { frame: 'prop.plate.a', tx: 9, ty: 7, dx: 10, dy: -4, layer: 'prop', depthRow: 8 },
    { frame: 'prop.rug.green.2x2', tx: 2, ty: 12, layer: 'floor' },
    ...doorMats([[1, 7], [18, 7]]),
    { frame: 'prop.rubbish', tx: 12, ty: 5, layer: 'floor', alpha: 0.5 },
  ],
};

// ── Interactable sprites (zones / items) ─────────────────────────────────────
const WALL_POSTER = (frame: AtlasFrame): InteractableArt => ({ frame, dy: -6 });

export const ROOM_INTERACTABLE_ART: Record<string, Record<string, InteractableArt>> = {
  hospital_entrance: {
    welcome_board: { frame: 'prop.poster.orange', dy: -30 },
    hipaa_brochure: { frame: 'prop.clipboard.sky' },
  },
  reception: {
    sign_in_sheet: { frame: 'prop.clipboard.blue', dy: -26 },
    privacy_notice: { frame: 'prop.sign.small', dy: -26 },
    patient_rights_poster: { frame: 'prop.monitor.pc' },
  },
  hallway_reception_break: { hallway1_phi_tip: WALL_POSTER('prop.poster.blue.a') },
  hallway_break_lab: { hallway2_verbal_tip: WALL_POSTER('prop.poster.red') },
  hallway_lab_records: { hallway3_deidentify_tip: WALL_POSTER('prop.poster.green') },
  hallway_records_it: { hallway4_breach_tip: WALL_POSTER('prop.poster.pink') },
  hallway_it_er: { hallway5_emergency_tip: WALL_POSTER('prop.poster.blue.b') },
  lab: {
    sample_labels: { frame: 'prop.clipboard.orange' },
    results_printout: { frame: 'prop.papers.a' },
    phi_identifiers: { frame: 'prop.binders' },
  },
  records_room: {
    unlocked_cabinet: { frame: 'prop.binders' },
    audit_log: { frame: 'prop.monitor.pc' },
    shredder: { frame: 'prop.papers.b' },
    minimum_necessary_manual: { frame: 'prop.clipboard.blue' },
    hipaa_penalties: { frame: 'prop.binders' },
  },
  it_office: {
    password_note: { frame: 'prop.clipboard.sky' },
    breach_playbook: { frame: 'prop.binders' },
    fax_machine: { frame: 'prop.fax.a' },
    vendor_agreement: { frame: 'prop.clipboard.plain' },
    security_safeguards: { frame: 'prop.sign.chart' },
  },
  er: {
    whiteboard: { frame: 'prop.sign.chart', dy: -4 },
    unlocked_computer: { frame: 'prop.monitor.pc' },
    emergency_exceptions: { frame: 'prop.clipboard.navy' },
  },
  break_room: {
    overheard_conversation: { frame: 'prop.food.d' },
    unlocked_phone: { frame: 'prop.phone.sky' },
    staff_corkboard: { frame: 'prop.poster.orange', dy: -30 },
    verbal_disclosure: { frame: 'prop.clipboard.green' },
  },
};

// ── Room styles ──────────────────────────────────────────────────────────────
const floor = (set: string): RoomArtStyle['floor'] => ({ set, variants: 6, pattern: [3, 2], scatter: 0.18 });

const hallwayStyle = (wall: WallStyle): RoomArtStyle => ({
  floor: floor('floor.terrazzo'),
  wall: { style: wall, rows: 2, trim: 'cream' },
  wear: [{ tx: 2, ty: 3, r: 26 }, { tx: 6, ty: 3.2, r: 34 }, { tx: 10, ty: 3, r: 36 }, { tx: 14, ty: 3.2, r: 34 }, { tx: 17, ty: 3, r: 26 }],
  light: {
    ambient: 0xf4e6d0, ambientAlpha: 0.18,
    pools: [{ tx: 4, ty: 3, r: 130, color: 0xffe9c8, alpha: 0.11 }, { tx: 10, ty: 3, r: 130, color: 0xffe9c8, alpha: 0.1 }, { tx: 15, ty: 3, r: 130, color: 0xffe9c8, alpha: 0.11 }],
    vignette: 0.34,
  },
});

export const ROOM_ART: Record<string, RoomArtStyle> = {
  hospital_entrance: {
    floor: floor('floor.whitetile'),
    wall: { style: 'blue', rows: 2, trim: 'white' },
    wear: [{ tx: 17, ty: 7, r: 28 }, { tx: 14, ty: 6.2, r: 32 }, { tx: 10, ty: 5.5, r: 40, alpha: 0.07 }, { tx: 10, ty: 8.5, r: 30 }, { tx: 10, ty: 11, r: 32 }],
    light: {
      ambient: 0xfff1df, ambientAlpha: 0.1,
      pools: [{ tx: 5, ty: 6, r: 150, color: 0xfff4e0, alpha: 0.1 }, { tx: 10, ty: 6, r: 170, color: 0xffffff, alpha: 0.1 }, { tx: 15, ty: 6, r: 150, color: 0xfff4e0, alpha: 0.1 }, { tx: 10, ty: 11, r: 140, color: 0xfff4e0, alpha: 0.08 }],
      vignette: 0.3,
    },
  },
  reception: {
    floor: floor('floor.reception'),
    wall: { style: 'cream', rows: 2, trim: 'cream' },
    wear: [
      { tx: 2, ty: 7, r: 26 }, { tx: 5, ty: 6.5, r: 30 }, { tx: 8, ty: 5.5, r: 34 },
      { tx: 10, ty: 5.2, r: 40, alpha: 0.08 }, { tx: 12, ty: 5.5, r: 34 }, { tx: 15, ty: 6.5, r: 30 },
      { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 8.5, r: 30 }, { tx: 10, ty: 11.5, r: 30 },
    ],
    light: {
      ambient: 0xffe4c2, ambientAlpha: 0.16,
      pools: [
        { tx: 5, ty: 6, r: 150, color: 0xffe9c8, alpha: 0.11 }, { tx: 10, ty: 7, r: 170, color: 0xffefd6, alpha: 0.12 },
        { tx: 15, ty: 6, r: 150, color: 0xffe9c8, alpha: 0.11 }, { tx: 10, ty: 12, r: 140, color: 0xffe9c8, alpha: 0.08 },
      ],
      vignette: 0.34,
    },
  },
  hallway_reception_break: hallwayStyle('beige'),
  hallway_break_lab: hallwayStyle('beige'),
  hallway_lab_records: hallwayStyle('beige'),
  hallway_records_it: hallwayStyle('bluegray'),
  hallway_it_er: hallwayStyle('bluegray'),
  supply_closet: {
    floor: floor('floor.tan'),
    wall: { style: 'gray', rows: 2, trim: 'cream' },
    wear: [{ tx: 5, ty: 5.5, r: 30 }, { tx: 6, ty: 4, r: 26 }],
    light: {
      ambient: 0xc8bca8, ambientAlpha: 0.32,
      pools: [{ tx: 7, ty: 4, r: 110, color: 0xffd9a0, alpha: 0.16 }],
      vignette: 0.5,
    },
  },
  lab: {
    floor: floor('floor.whitetile'),
    wall: { style: 'bluegray', rows: 2, trim: 'white' },
    wear: [{ tx: 2, ty: 7, r: 26 }, { tx: 10, ty: 8, r: 40, alpha: 0.07 }, { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 11.5, r: 30 }, { tx: 5, ty: 8, r: 28 }, { tx: 15, ty: 8, r: 28 }],
    light: {
      ambient: 0xd8f0ec, ambientAlpha: 0.16,
      pools: [{ tx: 5, ty: 6, r: 150, color: 0xd0f8ff, alpha: 0.11 }, { tx: 14, ty: 6, r: 150, color: 0xd0f8ff, alpha: 0.11 }, { tx: 10, ty: 11, r: 150, color: 0xe0fff8, alpha: 0.09 }],
      vignette: 0.36,
    },
  },
  records_room: {
    floor: floor('floor.carpet.tan'),
    wall: { style: 'green', rows: 2, trim: 'cream' },
    wear: [{ tx: 2, ty: 7, r: 26 }, { tx: 4.5, ty: 5, r: 26, alpha: 0.06 }, { tx: 14.5, ty: 5, r: 26, alpha: 0.06 }, { tx: 10, ty: 7, r: 36 }, { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 11.5, r: 30 }],
    light: {
      ambient: 0xd8d0b8, ambientAlpha: 0.3,
      pools: [{ tx: 4.5, ty: 4, r: 120, color: 0xffe2b0, alpha: 0.14 }, { tx: 14.5, ty: 4, r: 120, color: 0xffe2b0, alpha: 0.14 }, { tx: 10, ty: 9, r: 150, color: 0xffe6b8, alpha: 0.13 }],
      vignette: 0.5,
    },
  },
  it_office: {
    floor: floor('floor.darkgrid'),
    wall: { style: 'gray', rows: 2, trim: 'white' },
    wear: [{ tx: 2, ty: 7, r: 26 }, { tx: 10, ty: 8, r: 36, alpha: 0.07 }, { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 11.5, r: 30 }],
    light: {
      ambient: 0xa8b8e8, ambientAlpha: 0.3,
      pools: [{ tx: 4, ty: 7, r: 140, color: 0x9fe8ff, alpha: 0.12 }, { tx: 15, ty: 7, r: 140, color: 0x9fe8ff, alpha: 0.12 }, { tx: 10, ty: 6, r: 150, color: 0x7fd0ff, alpha: 0.16 }, { tx: 10, ty: 1, r: 150, color: 0x7fd0ff, alpha: 0.1 }],
      vignette: 0.5,
    },
  },
  er: {
    floor: floor('floor.bluetile'),
    wall: { style: 'teal', rows: 2, trim: 'white' },
    wear: [{ tx: 2, ty: 7, r: 28 }, { tx: 6, ty: 7.5, r: 32 }, { tx: 10, ty: 7.5, r: 40, alpha: 0.07 }, { tx: 10, ty: 11.5, r: 32 }, { tx: 4, ty: 6, r: 26 }, { tx: 16, ty: 6, r: 26 }],
    light: {
      ambient: 0xc4d6ff, ambientAlpha: 0.26,
      pools: [{ tx: 4, ty: 4, r: 140, color: 0xe0f0ff, alpha: 0.12 }, { tx: 15, ty: 4, r: 140, color: 0xe0f0ff, alpha: 0.12 }, { tx: 10, ty: 8, r: 160, color: 0xe8f4ff, alpha: 0.12 }, { tx: 1, ty: 7, r: 90, color: 0xff6060, alpha: 0.1 }],
      vignette: 0.46,
    },
  },
  break_room: {
    floor: floor('floor.parquet'),
    wall: { style: 'green', rows: 2, trim: 'cream' },
    wear: [{ tx: 2, ty: 7, r: 26 }, { tx: 6, ty: 7, r: 30 }, { tx: 13, ty: 7, r: 30 }, { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 10, r: 34 }, { tx: 10, ty: 12, r: 28 }],
    light: {
      ambient: 0xffd9a8, ambientAlpha: 0.24,
      pools: [{ tx: 4, ty: 8, r: 150, color: 0xffe6b8, alpha: 0.14 }, { tx: 15, ty: 8, r: 150, color: 0xffe6b8, alpha: 0.14 }, { tx: 10, ty: 4, r: 150, color: 0xffe6b8, alpha: 0.12 }],
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
