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
  /** with `fill`: the first and last tile of every row use these (LimeZu counter runs have end pieces) */
  fillEnds?: [AtlasFrame, AtlasFrame];
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
/** LimeZu counters are runs: a left end, middles, a right end (the "end" piece carries the side panel). */
const WHITE_COUNTER_MID: AtlasFrame[] = ['prop.counter.kw.drawers', 'prop.counter.kw.doors', 'prop.counter.kw.shelf', 'prop.counter.kw.plain2'];
const WHITE_COUNTER_ENDS: [AtlasFrame, AtlasFrame] = ['prop.counter.kw.plain', 'prop.counter.kw.end'];
/** Double-sided 5×2 island bench. The kw counters are 22 px tall, so `fill` (one per
 *  footprint tile, bottom-anchored per row) leaves a 10 px floor sliver between the two
 *  rows — compose instead, back row butted onto the front row (dy −22). */
const LAB_BENCH_5x2: PropDef = {
  frame: 'prop.counter.kw.plain',
  parts: [
    { frame: 'prop.counter.kw.plain', dx: 0, dy: -22, depthRow: 5 },
    { frame: 'prop.counter.kw.drawers', dx: 32, dy: -22, depthRow: 5 },
    { frame: 'prop.counter.kw.doors', dx: 64, dy: -22, depthRow: 5 },
    { frame: 'prop.counter.kw.plain2', dx: 96, dy: -22, depthRow: 5 },
    { frame: 'prop.counter.kw.plain', dx: 128, dy: -22, depthRow: 5 },
    { frame: 'prop.counter.kw.plain', dx: 0, depthRow: 6 },
    { frame: 'prop.counter.kw.doors', dx: 32, depthRow: 6 },
    { frame: 'prop.counter.kw.drawers', dx: 64, depthRow: 6 },
    { frame: 'prop.counter.kw.shelf', dx: 96, depthRow: 6 },
    { frame: 'prop.counter.kw.end', dx: 128, depthRow: 6 },
  ],
};
/** Two waiting-room chairs side by side on a 2×1 footprint (LimeZu's chairs are 28 px wide). */
const chairPair = (a: AtlasFrame, b: AtlasFrame = a): PropDef => ({ frame: a, parts: [{ frame: a, dx: 3 }, { frame: b, dx: 33 }] });
/** A small dispenser standing on a little table. */
const onStand = (top: AtlasFrame, dy = -12): PropDef => ({ frame: 'prop.table.small.white', parts: [{ frame: 'prop.table.small.white', dx: 5 }, { frame: top, dx: 11, dy }] });

// ── Game-wide defaults ────────────────────────────────────────────────────────
export const PROP_DEFAULTS: Record<string, PropDef> = {
  // counters / desks
  desk: { frame: 'prop.counter.reception.wood' },
  // records service counter: one continuous tan run spanning cols 7-12 — the art extends
  // one tile past each end of the 4x1 footprint so the inbox/outbox tray obstacles at
  // (7,2)/(12,2) seat their trays ON the counter (the desk pair left a floor gap mid-run
  // and both trays stood on the floor, reading as dropped machines)
  records_counter: {
    frame: 'prop.counter.kt.m',
    parts: [
      { frame: 'prop.counter.kt.l', dx: -30 },
      { frame: 'prop.counter.kt.m', dx: 0 },
      { frame: 'prop.counter.kt.m', dx: 32 },
      { frame: 'prop.counter.kt.m', dx: 64 },
      { frame: 'prop.counter.kt.m', dx: 96 },
      { frame: 'prop.counter.kt.r', dx: 128 },
    ],
  },
  // double-sided tan island (desk.wood.pc.3 was LimeZu's desk-back panel set — it read
  // as wardrobe doors + a mirror at game zoom). The kt pieces are TABLES with legs, so
  // the back row overlaps the front by 12px (dy -16) — the front tabletop hides the
  // back row's legs; a plain butt showed floor between the two leg bands.
  clerk_desk: {
    frame: 'prop.counter.kt.m',
    parts: [
      { frame: 'prop.counter.kt.l', dx: 2, dy: -16, depthRow: 8 },
      { frame: 'prop.counter.kt.m', dx: 32, dy: -16, depthRow: 8 },
      { frame: 'prop.counter.kt.m', dx: 64, dy: -16, depthRow: 8 },
      { frame: 'prop.counter.kt.r', dx: 96, dy: -16, depthRow: 8 },
      { frame: 'prop.counter.kt.l', dx: 2, depthRow: 9 },
      { frame: 'prop.counter.kt.m', dx: 32, depthRow: 9 },
      { frame: 'prop.counter.kt.m', dx: 64, depthRow: 9 },
      { frame: 'prop.counter.kt.r', dx: 96, depthRow: 9 },
    ],
  },
  triage_desk: { frame: 'prop.counter.kw.plain', fill: WHITE_COUNTER_MID, fillEnds: WHITE_COUNTER_ENDS },
  lab_bench: LAB_BENCH_5x2,
  // each station single (#544/#545) bakes its back monitor floating 4px above the counter
  // (fine against a wall, wrong on a free-standing island) — the splits re-seat each
  // monitor's slab on the counter/paper-box (dy -45/-47 vs the natural -50)
  nurse_station: { frame: 'prop.nurse_station.2.body', parts: [
    { frame: 'prop.nurse_station.2.body', dx: -2 },
    { frame: 'prop.nurse_station.2.counter', dx: 44 },
    { frame: 'prop.nurse_station.2.mon', dx: 44, dy: -45 },
    { frame: 'prop.nurse_station.meds.body', dx: 60 },
    { frame: 'prop.nurse_station.meds.counter', dx: 108 },
    { frame: 'prop.nurse_station.meds.mon', dx: 108, dy: -47 },
  ] },
  monitoring_desk: { frame: 'prop.console.blue.4' },
  workstation_cluster: { frame: 'prop.console.blue.l', parts: [{ frame: 'prop.console.blue.l', dx: 0 }, { frame: 'prop.console.blue.r', dx: 32 }] },
  table: { frame: 'prop.table.small.brown' },
  lunch_table: { frame: 'prop.conftable' },
  // seating
  chairs: chairPair('prop.chair.wait.yellow'),
  chair: { frame: 'prop.chair.office.gray' },
  bench: { frame: 'prop.bench.wood.tan' },
  couch: { frame: 'prop.couch.gray.3' },
  wheelchair: { frame: 'prop.wheelchair.side.blue' },
  // storage
  filing_cabinet: { frame: 'prop.locker.white.2' },
  locked_cabinet: { frame: 'prop.locker.teal.2' },
  bookshelf: { frame: 'prop.shelf.narrow.books' },
  bookcase: { frame: 'prop.bookcase.2.b' },
  magazine_rack: { frame: 'prop.shelf.narrow.books' },
  shelf: { frame: 'prop.shelf.bottles.a', parts: [{ frame: 'prop.shelf.bottles.a', dx: 0 }, { frame: 'prop.shelf.narrow.books', dx: 66 }] },
  chemical_shelf: { frame: 'prop.shelf.narrow.meds' },
  sample_rack: { frame: 'prop.shelf.meds' },
  archive_box: { frame: 'prop.boxes.stack' },
  box: { frame: 'prop.boxes.tall' },
  boxes: { frame: 'prop.boxes.stack' },
  lost_and_found_box: { frame: 'prop.box.single' },
  toy_chest: { frame: 'prop.toychest.red' },
  // trays sit directly on the records counter — papers.a IS a paper tray; stacking it on a
  // pedestal table read as a gray machine (lobby review)
  inbox_tray: { frame: 'prop.papers.a', dy: -22, depthRow: 2 },
  outbox_tray: { frame: 'prop.binders', dx: -2, dy: -22, depthRow: 2 },
  document_cart: { frame: 'prop.cart.wood.b' },
  // ONE document trolley (30x44, push handle, folder shelves). The old pair of
  // butted cart.wood.a singles read as twin nightstands with a 4px floor gap —
  // the room fiction is a single "filing cart, half-loaded with folders"
  // (type used only by hallway_lab_records; its obstacle is 1x1 now)
  filing_cart: { frame: 'prop.cart.wood.b' },
  // machines
  printer_station: { frame: 'prop.copier' },
  // 2x2 double-sided tan island with the fax ON the back counter (the fax used to stand
  // on the floor beside a bare table, and the single 36px-tall table left a 28px
  // invisible-collision band over the footprint's top row)
  scanner_station: {
    frame: 'prop.counter.kt.l',
    parts: [
      { frame: 'prop.counter.kt.l', dx: 2, dy: -16, depthRow: 11 },
      { frame: 'prop.counter.kt.r', dx: 32, dy: -16, depthRow: 11 },
      { frame: 'prop.counter.kt.l', dx: 2, depthRow: 12 },
      { frame: 'prop.counter.kt.r', dx: 32, depthRow: 12 },
      { frame: 'prop.fax.a', dx: 21, dy: -38, depthRow: 12 },
    ],
  },
  // 2x2 double-sided white island, shredder machine on the back row (the single-row
  // version covered only the bottom 30px of the 64px footprint)
  // back row is plain+plain — stacking two kw.end open-shelf sides read as a tall wood
  // column. Front row is ALSO plain+plain: the records archive_box crates at (2,13)
  // stack against the island's front (their 56px art tops at y392, over the 22px front
  // row) — against a closed counter front that reads as crates; through kw.end's open
  // shelf frame it read as a crate shoved through the counter.
  shredder_station: {
    frame: 'prop.counter.kw.plain',
    parts: [
      { frame: 'prop.counter.kw.plain', dx: 0, dy: -22, depthRow: 11 },
      { frame: 'prop.counter.kw.plain', dx: 32, dy: -22, depthRow: 11 },
      { frame: 'prop.counter.kw.plain', dx: 0, depthRow: 12 },
      { frame: 'prop.counter.kw.plain', dx: 32, depthRow: 12 },
      { frame: 'prop.printer.small', dx: 18, dy: -38, depthRow: 12 },
    ],
  },
  server_rack: SERVER_RACK_3,
  // the anim.monitor cell is a bare monitor + keyboard meant to sit ON a desk (LimeZu
  // control-room single) — free-standing it read as furniture floating over the floor,
  // so it stands on a 1-tile white counter (keyboard lands on the counter top face)
  monitor_bank: {
    frame: 'prop.counter.kw.plain',
    parts: [
      { frame: 'prop.counter.kw.plain', dx: 0 },
      { frame: 'anim.monitor.0', dx: 0, dy: -16, anim: ANIM_MONITOR },
    ],
  },
  defense_console: { frame: 'prop.terminal.old' },
  cable_tray: { frame: 'prop.mat.gray', layer: 'ground' },
  vending_machine: { frame: 'prop.vending.snacks' },
  water_dispenser: { frame: 'prop.watercooler' },
  water_cooler: { frame: 'prop.watercooler' },
  // anim.coffee carries ~8px of transparent bottom padding — dy -7 lands the machine's
  // visible base on the tray table's top face
  coffee_mug: { frame: 'prop.table.small.gray', parts: [{ frame: 'prop.table.small.gray', dx: 5 }, { frame: 'anim.coffee.0', dx: 0, dy: -7, anim: ANIM_COFFEE }] },
  headphones: { frame: 'prop.table.small.gray', parts: [{ frame: 'prop.table.small.gray', dx: 5 }, { frame: 'prop.monitor.pc', dx: 2, dy: -12 }] },
  // one cell of the break-room kitchenette run: tan counter end + microwave on the top
  microwave: { frame: 'prop.counter.kt.l', parts: [{ frame: 'prop.counter.kt.l', dx: 1 }, { frame: 'prop.microwave.b', dx: 0, dy: -22 }] },
  open_fridge: { frame: 'prop.fridge.open.a' },
  // the flat 2-door kitchen fridge read as elevator doors — the glass-front canteen
  // fridge (racked shelves visible) is an unmistakable specimen fridge
  specimen_fridge: { frame: 'prop.fridge.glass.tall' },
  // kitchenette, cols 15-17: the counter run continues from the microwave cell, fridge caps the corner.
  // Counter tops sit at footprint-bottom -28; appliances sink ~4px into the top surface.
  coffee_station: {
    frame: 'prop.counter.kt.m',
    parts: [
      { frame: 'prop.counter.kt.m', dx: 0 }, { frame: 'prop.counter.kt.r', dx: 32 },
      { frame: 'prop.fridge.gray.b', dx: 62 },
      { frame: 'anim.coffee.0', dx: 0, dy: -12, anim: ANIM_COFFEE },
      { frame: 'prop.mug.blue', dx: 41, dy: -24 },
    ],
  },
  tv_stand: { frame: 'prop.tv.stand.dark' },
  // medical
  bed: { frame: 'prop.bed.blue' },
  // bed + bedside + ONE drip stand (ivpole.a/b were secretly two stacked poles, 108px
  // tall — they poked into the wall band; ivpole.single is the reception-proven pole)
  patient_bay: { frame: 'prop.bed.side.blue', parts: [{ frame: 'prop.bed.side.blue', dx: 0 }, { frame: 'prop.bedside.white', dx: 70 }, { frame: 'prop.ivpole.single', dx: 96 }] },
  gurney: { frame: 'prop.examtable.white', parts: [{ frame: 'prop.examtable.white', dx: 0 }, { frame: 'prop.ivpole.single', dx: 68 }] },
  exam_table: { frame: 'prop.examtable.white' },
  iv_stand: { frame: 'prop.ivpole.single' },
  // a real rolling bed curtain (hospital#245) — the old window blinds read as roller
  // shutters standing mid-floor. 60px wide art on the 1-wide footprint: ±14px overhang
  // is y-sorted normally (players walk behind the curtain edge)
  curtain_partition: { frame: 'prop.curtain.blue' },
  crash_cart: { frame: 'prop.cart.monitor', parts: [{ frame: 'prop.cart.monitor', dx: -2 }, { frame: 'prop.cart.wood.a', dx: 38 }] },
  vital_monitor: { frame: 'prop.monitor.stand' },
  equipment: { frame: 'prop.machine.arms' },
  microscope: { frame: 'prop.microscope' },
  microscope_station: { frame: 'prop.microscope' },
  centrifuge: { frame: 'prop.scanner.ct', parts: [{ frame: 'prop.scanner.ct', dx: -2 }, { frame: 'prop.autoclave', dx: 56 }] },
  fume_hood: { frame: 'prop.cabinet.glass.l', parts: [{ frame: 'prop.cabinet.glass.l', dx: 0 }, { frame: 'prop.cabinet.glass.m', dx: 32 }, { frame: 'prop.cabinet.glass.r', dx: 64 }] },
  // l + mirrored l = symmetric double glass doors (the bare .r panel read as window shutters)
  bio_cabinet: { frame: 'prop.cabinet.glass.l', parts: [{ frame: 'prop.cabinet.glass.l', dx: 0 }, { frame: 'prop.cabinet.glass.l', dx: 32, flipX: true }] },
  sink_station: { frame: 'prop.sink.counter' },
  // sink.white is a top-down counter insert — on the floor it read as a keyboard.
  // The bathroom wash basin is front-facing with red/blue taps; dx 4 clears the sink counter.
  eyewash_station: { frame: 'prop.sink.wash', dx: 4 },
  autoclave: { frame: 'prop.autoclave' },
  hand_sanitizer: onStand('prop.dispenser.c'),
  glove_dispenser: onStand('prop.dispenser.c'),
  defibrillator_mount: { frame: 'prop.table.small.gray', parts: [{ frame: 'prop.table.small.gray', dx: 5 }, { frame: 'prop.firstaid', dx: 5, dy: -12 }] },
  // wall-mounted
  // boards hang fully inside the wall face: frame heights 38/34, face band y 0..64
  notice_board: { frame: 'prop.noticeboard', anchor: 'wall', dy: -8 },
  bulletin_board: { frame: 'prop.bulletin.notes', anchor: 'wall', dy: -6 },
  // 46-tall board inside the 2-row face band (12..64): dy −16 → top 16, bottom 62
  results_board: { frame: 'prop.chalkboard.dark.3', anchor: 'wall', dy: -16 },
  whiteboard_wall: { frame: 'prop.chalkboard.dark.3' },
  // dy -10: at dy 6 (obstacle row 1 → top y38) the clock hung at the baseboard,
  // a full band lower than every other wall item (type used only by lab_records)
  wall_clock: { frame: 'prop.clock.white', anchor: 'wall', dy: -10 },
  clock: { frame: 'prop.clock.white', anchor: 'wall', dy: 6 },
  // a fluorescent tube on the wall — LimeZu has no sconce, and corridors have tubes anyway
  wall_sconce: { frame: 'prop.lightbar.3', anchor: 'wall', dy: -16 },
  // dy -10: at dy 14 (obstacle row 1 → y46..60) the red exit sign hung at the
  // baseboard, knee height (type used only by hallway_it_er)
  emergency_light: { frame: 'prop.sign.exit', anchor: 'wall', dy: -10 },
  // dy 6: at dy 14 the 24px sign's bottom crossed the wall/floor seam by 6px, and
  // its (15,1) instance hangs under the 96px (16,1) sconce tube (tube y16..36) —
  // y38..62 clears the tube by 2px and stays inside the baseboard band
  // dy -2: bottom lands ~y54, above the baseboard band — at dy 6 the frame's bottom
  // border merged with the wall base line (room-clean reviewer find)
  biohazard_sign: { frame: 'prop.sign.warning', anchor: 'wall', dy: -2 },
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
    // the white counter is drawn as two butt-jointed slabs (adjacent sheet rows, seam
    // invisible): the source single's rect bottom-left held a detached leaf bush that
    // rendered as debris at the counter's foot.
    desk: {
      frame: 'prop.counter.reception.white',
      parts: [
        { frame: 'prop.counter.reception.white', dx: 0, dy: -28 },
        { frame: 'prop.counter.reception.white.front', dx: 32, dy: 0 },
      ],
    },
    'plant@18,2': { frame: 'prop.fern.m' },
    'plant@1,2': { frame: 'prop.plant.orange.m' },
    'plant@1,10': { frame: 'prop.plant.white.s' },
    'plant@18,11': { frame: 'prop.plant.orange.s' },
    'chairs@2,8': chairPair('prop.chair.wait.tan'),
    'chairs@2,10': chairPair('prop.chair.wait.tan'),
    'chairs@16,8': chairPair('prop.chair.wait.blue'),
    'chairs@16,10': chairPair('prop.chair.wait.blue'),
    // just the side table — the paper tray stacked on it at this size reads as a gray machine
    table: { frame: 'prop.table.round.white' },
    // 42px-wide art on a 32px footprint: dx -6 keeps the right wheel off the right wall
    wheelchair: { frame: 'prop.wheelchair.front.tan', dx: -6 },
    // no umbrella-stand single exists in the packs on hand; a second bin beside the
    // blue one reads as a deliberate waste/recycling pair by the entrance
    umbrella_stand: { frame: 'prop.trash.green' },
  },
  reception: {
    desk: { frame: 'prop.counter.reception.wood' },
    'filing_cabinet@4,2': { frame: 'prop.locker.white.2' },
    'filing_cabinet@15,2': { frame: 'prop.locker.teal.2' },
    'plant@1,2': { frame: 'prop.plant.orange.m' },
    'plant@18,2': { frame: 'prop.plant.white.m' },
    'plant@1,5': { frame: 'prop.fern.m' },
    'chairs@2,8': chairPair('prop.chair.wait.yellow'),
    'chairs@2,10': chairPair('prop.chair.wait.yellow'),
    'chairs@16,8': chairPair('prop.chair.wait.green'),
    'chairs@16,10': chairPair('prop.chair.wait.green'),
    notice_board: { frame: 'prop.noticeboard', anchor: 'wall', dy: -8 },
    // the 80px bookshelf lives at (2,13) against the bottom wall (at (2,12) its top
    // overlapped the chairs@2,10); dx 2 opens a gap from the wheelchair at (1,11)
    'magazine_rack@2,13': { frame: 'prop.shelf.narrow.books', dx: 2 },
    // ivpole.a is secretly two stacked drip stands (108px); the single lower pole
    // stands beside the plant without fusing with anything
    'iv_stand@17,4': { frame: 'prop.ivpole.single' },
  },
  hallway_reception_break: {
    'bench@5,5': { frame: 'prop.bench.wood.tan' }, 'bench@14,5': { frame: 'prop.bench.wood.orange' },
    // plant lives at (9,2): at (10,2) its foliage overlapped the bulletin board's
    // bottom-left corner (board hangs at x336..382, y14..48)
    'plant@9,2': { frame: 'prop.plant.white.m' },
    vending_machine: { frame: 'prop.vending.drinks' },
  },
  hallway_break_lab: {
    'plant@6,2': { frame: 'prop.plant.orange.s' }, 'plant@13,2': { frame: 'prop.plant.white.s' },
    bench: { frame: 'prop.bench.wood.tan' },
    // wall-mounted beside the west door — on its floor stand mid-corridor the 10px
    // dispenser read as an unnameable capsule (room-clean reviewer find); hospitals
    // mount glove/sanitizer dispensers by doors. Obstacle moved (3,5)→(2,1).
    glove_dispenser: { frame: 'prop.dispenser.c', anchor: 'wall', dy: 28 },
  },
  hallway_lab_records: {
    'bench@4,5': { frame: 'prop.bench.wood.orange' }, 'bench@15,5': { frame: 'prop.bench.wood.tan' },
    'plant@10,2': { frame: 'prop.fern.s' },
  },
  hallway_records_it: {
    'plant@7,2': { frame: 'prop.plant.white.s' }, 'plant@12,2': { frame: 'prop.plant.orange.m' },
    bench: { frame: 'prop.bench.wood.tan' },
    server_rack: { frame: 'anim.server.0', anim: ANIM_SERVER },
    // second segment of the ceiling cable run (y6..22, cap band) — at dy 6 under
    // the (16,1) tube it read as a second light fixture stacked below the sconce
    cable_tray: { frame: 'prop.rail.lights.2', anchor: 'wall', dy: -26 },
  },
  hallway_it_er: {
    bench: { frame: 'prop.bench.wood.orange' },
    'plant@14,2': { frame: 'prop.plant.white.m' },
    // side.tan was LimeZu's MOP-AND-BUCKET single (ER fixer's finding; frame now
    // deleted from the manifest) — the entrance/ER-proven front view instead
    wheelchair: { frame: 'prop.wheelchair.front.tan' },
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
    'filing_cabinet@16,2': { frame: 'prop.drawers.column.r' },
    'filing_cabinet@6,2': { frame: 'prop.shelf.narrow.books' },
    'filing_cabinet@13,2': { frame: 'prop.shelf.narrow.books' },
    'bookcase@1,2': { frame: 'prop.bookcase.2.a' },
    'bookcase@17,2': { frame: 'prop.bookcase.2.c' },
  },
  it_office: {
    table: { frame: 'prop.desk.k.wood' },
    printer_station: { frame: 'prop.desk.glass.2', parts: [{ frame: 'prop.desk.glass.2', dx: 0 }, { frame: 'prop.copier', dx: 66 }] },
    'chair@1,8': { frame: 'prop.chair.office.gray' },
    'chair@18,8': { frame: 'prop.chair.office.sky' },
    plant: { frame: 'prop.fern.s' },
  },
  er: {
    // mirrors the left bay's layout (bed, bedside, single pole) so the bays read as a
    // matched pair; the pink pillow ends up beside the wood bedside cabinet
    'patient_bay@14,2': { frame: 'prop.bed.side.pink', parts: [{ frame: 'prop.bed.side.pink', dx: 0 }, { frame: 'prop.bedside.wood', dx: 70 }, { frame: 'prop.ivpole.single', dx: 96 }] },
    // flipX puts the curtain's support post on the bay side, mirroring the left curtain
    'curtain_partition@13,2': { frame: 'prop.curtain.tan', flipX: true },
    'gurney@15,9': { frame: 'prop.examtable.blue', parts: [{ frame: 'prop.monitor.stand', dx: 0 }, { frame: 'prop.examtable.blue', dx: 34 }] },
    // wheelchair.side.tan is actually LimeZu's mop-and-bucket single — use the front
    // view proven in hospital_entrance (dx -6 keeps it off the east wall column)
    wheelchair: { frame: 'prop.wheelchair.front.tan', dx: -6 },
  },
  break_room: {
    'vending_machine@2,2': { frame: 'prop.vending.snacks' },
    'vending_machine@5,2': { frame: 'prop.vending.gray' },
    'couch@2,10': { frame: 'prop.couch.gray.3' },
    'couch@15,10': { frame: 'prop.couch.gray.3', flipX: true },
    // cushioned stools tuck under the lunch table without hiding the NPCs standing behind them
    'chair@7,8': { frame: 'prop.stool.blue' },
    'chair@12,8': { frame: 'prop.stool.red' },
    'plant@1,13': { frame: 'prop.fern.m' },
    // the waiting-room TV is on (LimeZu's news report, every 6th of its 24 frames);
    // it stands on a low wood dresser — the tvnews cell carries ~20px of transparent
    // bottom padding, so dy -10 lands the visible screen on the dresser top.
    tv_stand: {
      frame: 'prop.tv.sideboard',
      parts: [
        { frame: 'prop.tv.sideboard', dx: 0 },
        { frame: 'anim.tvnews.0', dx: -16, dy: -10, anim: ANIM_TVNEWS },
      ],
    },
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
    // poster sits right of the clock now — the bulletin board moved to (3,1) so the
    // welcome_board zone icon has clear wall face over its own tile at (2,2)
    { frame: 'prop.poster.blue.b', tx: 6, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.clock.blue', tx: 5, ty: 0, dy: 8, layer: 'wall' },
    { frame: 'prop.picture.landscape.b', tx: 13, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.sanitizer', tx: 15, ty: 0, dy: 22, layer: 'wall' },
    { frame: 'prop.sign.arrow.r', tx: 16, ty: 0, dy: 18, layer: 'wall' },
    { frame: 'prop.chair.office.sky', tx: 10, ty: 2, dy: -3, layer: 'prop', depthRow: 2 },
    { frame: 'prop.phone.gray', tx: 8, ty: 1, dx: -6, dy: -6, layer: 'prop', depthRow: 3 },
    { frame: 'prop.clipboard.plain', tx: 11, ty: 1, dx: 6, dy: -5, layer: 'prop', depthRow: 3 },
    // display table under the hipaa_brochure pickup at (16,5) — a clipboard flat on
    // open floor read as dropped litter (same fix reception's poster pickup got)
    { frame: 'prop.table.small.white', tx: 16, ty: 5, layer: 'prop', depthRow: 5 },
    ...doorMats([[18, 7]]),
    // (no floor litter in the lobby — the papers at (5,6) and the rubbish ghost at
    // (14,12) read as junk on the walkway; reception's review set the precedent)
  ],
  reception: [
    { frame: 'prop.picture.landscape.a', tx: 1, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.lightswitch', tx: 2, ty: 1, dy: -2, layer: 'wall' },
    { frame: 'prop.clock.white', tx: 4, ty: 0, dy: 8, layer: 'wall' },
    { frame: 'prop.sanitizer', tx: 6, ty: 0, dy: 22, layer: 'wall' },
    // poster.green sat at tx 16 where the teal locker (top y38) swallowed its bottom 8px;
    // over the counter's right wing the wall is clear down to y50.
    { frame: 'prop.poster.green', tx: 12, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.poster.blue.a', tx: 17, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.chair.office.gray', tx: 10, ty: 2, dy: -3, layer: 'prop', depthRow: 2 },
    { frame: 'prop.clipboard.green', tx: 8, ty: 1, dx: -4, dy: -5, layer: 'prop', depthRow: 3 },
    // papers.a is now a flat 22x18 stack — dy 0 lays it on the counter surface (y46-64)
    { frame: 'prop.papers.a', tx: 11, ty: 1, dx: -6, dy: 0, layer: 'prop', depthRow: 3 },
    // the "brown" mug frame is LimeZu's tri-colour red mug and read as a lidded jar here;
    // the blue mug (proven on the break-room counter) reads as a mug at game zoom
    { frame: 'prop.mug.blue', tx: 11, ty: 1, dx: 12, dy: -2, layer: 'prop', depthRow: 3 },
    { frame: 'prop.mat.tan.3x2', tx: 8.5, ty: 8.5, layer: 'floor' },
    // display table under the patient-rights poster pickup at (2,4)
    { frame: 'prop.table.small.white', tx: 2, ty: 4, layer: 'prop', depthRow: 4 },
    ...doorMats([[1, 7], [18, 7]]),
    // (no floor litter in reception — a boulder-looking bag pile and an orphaned paper stack
    // mid-walkway failed review; the closet and back rooms keep their clutter)
  ],
  hallway_reception_break: hallwayDecor([
    { frame: 'prop.picture.landscape.c', tx: 1, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.extinguisher', tx: 17, ty: 1, dy: 2, layer: 'wall' },
    { frame: 'prop.poster.orange', tx: 13, ty: 0, dy: 14, layer: 'wall' },
  ]),
  hallway_break_lab: hallwayDecor([
    { frame: 'prop.picture.landscape.d', tx: 1, ty: 0, dy: 16, layer: 'wall' },
    // at tx 11 the chart sat behind the bulletin board (x336..382); tx 8 sat on the
    // hidden closet door's wall seam (DoorSystem whimsy at x270) — tx 6.5 is clear
    { frame: 'prop.sign.chart', tx: 6.5, ty: 0, dy: 16, layer: 'wall' },
    // dy 6: the (16,1) sconce tube spans x480..576 — at dy 2 the bracket's top 2px
    // sat inside the tube's bottom rail
    { frame: 'prop.extinguisher', tx: 17, ty: 1, dy: 6, layer: 'wall' },
  ]),
  hallway_lab_records: hallwayDecor([
    // orange, not green — the room's tip ITEM is the green poster at (8,1); two
    // identical green posters on one wall read as a copy-paste
    { frame: 'prop.poster.orange', tx: 2, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.picture.landscape.a', tx: 16, ty: 0, dy: 16, layer: 'wall' },
    // at tx 12 the kit's right edge clipped into the (14,1) sconce tube's left end
    // (tube spans x400..496) and crowded the bulletin board (ends x382)
    { frame: 'prop.firstaid', tx: 3, ty: 0, dy: 26, layer: 'wall' },
  ]),
  hallway_records_it: hallwayDecor([
    { frame: 'anim.camera.0', tx: 2, ty: 0, dy: 8, layer: 'wall', anim: ANIM_CAMERA },
    // at tx 16 the sign hung ON the (16,1) sconce tube (tube spans x480..576);
    // tx 18.1 sits between the tube's end and the IT door column
    { frame: 'prop.sign.warning', tx: 18.1, ty: 0, dy: 16, layer: 'wall' },
    // first segment of the ceiling cable run toward IT (pairs with the cable_tray
    // rail at (12,1), same y6..22 band). At tx 9 it sat behind the bulletin board.
    { frame: 'prop.rail.lights.2', tx: 7, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.mat.gray', tx: 15, ty: 4, layer: 'floor' },
  ]),
  hallway_it_er: hallwayDecor([
    { frame: 'prop.sign.cross', tx: 2, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.picture.landscape.b', tx: 7, ty: 0, dy: 16, layer: 'wall' },
    // (the (18,0) sign.exit decor is gone — it duplicated the emergency_light
    // obstacle's exit sign two tiles away)
  ]),
  supply_closet: [
    { frame: 'prop.ladder.a', tx: 5, ty: 0, dy: 18, layer: 'wall' },
    { frame: 'prop.mop', tx: 3, ty: 5, layer: 'prop' },
    { frame: 'prop.basket', tx: 6, ty: 6, layer: 'prop' },
    { frame: 'prop.debris', tx: 2, ty: 4, dy: 10, layer: 'floor', alpha: 0.6 },
  ],
  lab: [
    { frame: 'prop.rail.lights.6', tx: 3, ty: 0, dy: 4, layer: 'wall' },
    { frame: 'prop.sign.warning', tx: 1, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.window.gray.3', tx: 12, ty: 0, dy: 6, layer: 'wall' },
    { frame: 'prop.sign.cross', tx: 16, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.poster.green', tx: 17, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.bottles.lab.a', tx: 4, ty: 5, dx: 4, dy: -8, layer: 'prop', depthRow: 5 },
    { frame: 'prop.bottles.lab.b', tx: 6, ty: 5, dx: -6, dy: -8, layer: 'prop', depthRow: 5 },
    { frame: 'prop.papers.a', tx: 7, ty: 6, dy: -8, layer: 'prop', depthRow: 6 },
    { frame: 'prop.bottles.lab.c', tx: 13, ty: 5, dx: 6, dy: -9, layer: 'prop', depthRow: 5 },
    // moved off (15,6): the results_printout pickup now sits on that stretch of counter
    { frame: 'prop.bottles.lab.b', tx: 14, ty: 5, dx: 4, dy: -8, layer: 'prop', depthRow: 5 },
    { frame: 'prop.clipboard.sky', tx: 16, ty: 5, dx: -4, dy: -8, layer: 'prop', depthRow: 5 },
    // display stand under the phi_identifiers pickup at (2,8) — binders flat on open
    // floor read as dropped litter (reception's display-table precedent)
    { frame: 'prop.table.small.white', tx: 2, ty: 8, layer: 'prop', depthRow: 8 },
    ...doorMats([[1, 7], [18, 7]], 'prop.mat.gray'),
    // (no bare-floor paper litter — the tray art read as a dropped gray device mid-walkway)
  ],
  records_room: [
    { frame: 'prop.corkboard.2x1', tx: 4, ty: 0, dy: 14, layer: 'wall' },
    // the clock used to hang at (7,0) — dead centre under the screen-fixed room-name
    // banner, where only its edges peeked out as a black slab. (3,0) sits between the
    // left bookcase (art ends x91) and the corkboard (starts x134); dy 12 clears the cap.
    { frame: 'prop.clock.gray', tx: 3, ty: 0, dy: 12, layer: 'wall' },
    { frame: 'prop.sign.small', tx: 14, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'anim.camera.0', tx: 18, ty: 0, dy: 8, layer: 'wall', anim: ANIM_CAMERA },
    // phone stands on the kt counter run (top face at footprintBottom -22)
    { frame: 'prop.phone.black', tx: 10, ty: 2, dx: 8, dy: -22, layer: 'prop', depthRow: 2 },
    // case binders rest on the clerk island's back row (top face y 276..286)
    { frame: 'prop.binders', tx: 11, ty: 8, dx: -2, dy: -6, layer: 'prop', depthRow: 9 },
    // shred-waste crumple in the floor slot between the box stacks (boxes.tall ends x64,
    // the archive_box crate pile starts x96 since its move to (3,13))
    { frame: 'prop.debris', tx: 2, ty: 13, dx: 0, dy: 10, layer: 'floor', alpha: 0.8 },
    // display stands under the three bare-floor pickups (reception/entrance/lab pattern)
    { frame: 'prop.table.small.brown', tx: 4, ty: 4, layer: 'prop', depthRow: 4 },
    { frame: 'prop.table.small.brown', tx: 10, ty: 4, layer: 'prop', depthRow: 4 },
    { frame: 'prop.table.small.brown', tx: 17, ty: 8, layer: 'prop', depthRow: 8 },
    ...doorMats([[1, 7], [18, 7]], 'prop.mat.gray'),
    // (no bare-floor paper litter — the tray art read as dropped machines mid-walkway)
  ],
  it_office: [
    { frame: 'anim.screens.0', tx: 8, ty: 0, dy: 0, layer: 'wall', anim: ANIM_SCREENS },
    { frame: 'prop.rail.lights.6', tx: 1, ty: 0, dy: 4, layer: 'wall' },
    { frame: 'prop.rail.lights.6', tx: 12, ty: 0, dy: 4, layer: 'wall' },
    { frame: 'anim.camera.0', tx: 4, ty: 0, dy: 8, layer: 'wall', anim: ANIM_CAMERA },
    // dy 24 drops the sign below the light rail (a rail lamp used to hide behind its
    // left frame edge); rack cap tops start ~y50, so 24+24 still clears them
    { frame: 'prop.sign.warning', tx: 15, ty: 0, dy: 24, layer: 'wall' },
    // keypad on the locked cabinet's front — follows the cabinet to (16,13)
    { frame: 'prop.switch.a', tx: 17, ty: 13, dx: 4, dy: -22, layer: 'prop', depthRow: 13 },
    // console top face is world y182..205 — at dy -10 both sat on the blue front band
    // and read as slipping off the desk edge
    { frame: 'prop.keyboard', tx: 9, ty: 6, dx: 2, dy: -22, layer: 'prop', depthRow: 6 },
    { frame: 'prop.papers.a', tx: 10, ty: 6, dx: 6, dy: -22, layer: 'prop', depthRow: 6 },
    // display stands under the three bare-floor pickups (records/entrance pattern);
    // the (10,2) stand sits at the control wall's base, so it drops 8px into row 3
    { frame: 'prop.table.small.gray', tx: 10, ty: 2, dy: 8, layer: 'prop', depthRow: 2 },
    { frame: 'prop.table.small.gray', tx: 5, ty: 9, layer: 'prop', depthRow: 9 },
    { frame: 'prop.table.small.gray', tx: 14, ty: 9, layer: 'prop', depthRow: 9 },
    { frame: 'prop.mat.gray', tx: 4, ty: 4, layer: 'floor' },
    { frame: 'prop.mat.gray', tx: 15, ty: 4, layer: 'floor' },
    { frame: 'prop.mat.gray', tx: 4, ty: 5, layer: 'floor' },
    { frame: 'prop.mat.gray', tx: 15, ty: 5, layer: 'floor' },
    ...doorMats([[1, 7], [18, 7]], 'prop.mat.gray'),
    // (no bare-floor paper litter — the papers.a tray art at (6,12) read as a dropped
    // machine with an LED, the same fail records/lobby reviews called)
  ],
  er: [
    { frame: 'anim.hscreen.0', tx: 3, ty: 0, dy: 0, layer: 'wall', anim: ANIM_HSCREEN },
    // tiles ~7-12.6 of the wall face sit behind the screen-fixed room-title text, so the
    // cross sign and whiteboard hang clear of it (they were half-buried under the title)
    { frame: 'prop.sign.cross', tx: 5.5, ty: 0, dy: 14, layer: 'wall' },
    // dy 14 keeps the 36px board below the cap band (top ~12px of the face)
    { frame: 'prop.whiteboard', tx: 13, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.firstaid', tx: 12, ty: 0, dy: 26, layer: 'wall' },
    { frame: 'anim.hscreen.0', tx: 15, ty: 0, dy: 0, layer: 'wall', anim: ANIM_HSCREEN },
    { frame: 'prop.clock.white', tx: 1, ty: 0, dy: 8, layer: 'wall' },
    { frame: 'prop.clipboard.navy', tx: 9, ty: 9, dx: -6, dy: -8, layer: 'prop', depthRow: 9 },
    { frame: 'prop.phone.red', tx: 11, ty: 9, dx: 4, dy: -8, layer: 'prop', depthRow: 9 },
    ...doorMats([[1, 7]], 'prop.mat.gray'),
    // display stands under the three bare-floor pickups (records/it_office pattern);
    // the (17,11) stand takes depthRow 4 so the item icon (depth 10) draws on top
    { frame: 'prop.table.small.gray', tx: 10, ty: 3, layer: 'prop', depthRow: 3 },
    { frame: 'prop.table.small.gray', tx: 6, ty: 6, layer: 'prop', depthRow: 6 },
    { frame: 'prop.table.small.gray', tx: 17, ty: 11, layer: 'prop', depthRow: 4 },
    // (no bare-floor litter — the debris pile read as rocks and papers.a as a dropped
    // device, the same fail records/lobby reviews called)
  ],
  break_room: [
    { frame: 'prop.painting.sunset', tx: 1, ty: 0, dy: 12, layer: 'wall' },
    { frame: 'prop.clock.teal', tx: 4, ty: 0, dy: 8, layer: 'wall' },
    { frame: 'prop.picture.coffee', tx: 13, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.picture.cup', tx: 14, ty: 0, dy: 20, layer: 'wall' },
    // glass-door upper cabinet over the kitchenette counters (cols 15-16; the fridge at 17 stays clear)
    { frame: 'prop.cabinet.upper.wood', tx: 15, ty: 0, dy: 14, layer: 'wall' },
    // lunch on the table (the table top is the upper two thirds of its 4×3 footprint)
    { frame: 'prop.food.a', tx: 8, ty: 7, dx: 6, dy: -14, layer: 'prop', depthRow: 8 },
    { frame: 'prop.mug.brown', tx: 10, ty: 7, dx: 4, dy: -16, layer: 'prop', depthRow: 8 },
    { frame: 'prop.food.c', tx: 10, ty: 7, dx: -10, dy: -4, layer: 'prop', depthRow: 8 },
    { frame: 'prop.plate.a', tx: 9, ty: 7, dx: 10, dy: -2, layer: 'prop', depthRow: 8 },
    // a nightstand-height side table for the phone zone, above the red stool
    { frame: 'prop.table.phone.wood', tx: 12, ty: 7, dy: -2, layer: 'prop', depthRow: 7 },
    { frame: 'prop.rug.green.2x2', tx: 2, ty: 12, layer: 'floor' },
    ...doorMats([[1, 7], [18, 7]]),
    // crumpled paper that missed the bin, right beside its base
    { frame: 'prop.rubbish', tx: 14, ty: 7, layer: 'floor', alpha: 0.75 },
  ],
};

// ── Interactable sprites (zones / items) ─────────────────────────────────────
const WALL_POSTER = (frame: AtlasFrame): InteractableArt => ({ frame, dy: -6 });

export const ROOM_INTERACTABLE_ART: Record<string, Record<string, InteractableArt>> = {
  hospital_entrance: {
    // dy -34 keeps the whole poster inside the wall-face band (break_room's proven anchor)
    welcome_board: { frame: 'prop.poster.orange', dy: -34 },
    // the clipboard rests on the display table decor at (16,5)
    hipaa_brochure: { frame: 'prop.clipboard.sky', dy: -12 },
  },
  reception: {
    sign_in_sheet: { frame: 'prop.clipboard.blue', dy: -26 },
    privacy_notice: { frame: 'prop.sign.small', dy: -26 },
    patient_rights_poster: { frame: 'prop.sign.chart', dy: -12 },
  },
  hallway_reception_break: { hallway1_phi_tip: WALL_POSTER('prop.poster.blue.a') },
  // tip items at (10,1) (center x336) collide with the bulletin board's left edge
  // (board hangs at x336..382): dx -26 hangs those posters on clear wall face
  hallway_break_lab: { hallway2_verbal_tip: { frame: 'prop.poster.red', dx: -26, dy: -6 } },
  hallway_lab_records: { hallway3_deidentify_tip: WALL_POSTER('prop.poster.green') },
  hallway_records_it: { hallway4_breach_tip: { frame: 'prop.poster.pink', dx: -26, dy: -6 } },
  hallway_it_er: { hallway5_emergency_tip: { frame: 'prop.poster.blue.b', dx: -26, dy: -6 } },
  lab: {
    // both zone icons sit ON the bench front row (the gate literally says "results on
    // the counter") — ER's unlocked_computer pattern; zone tiles stay on the floor
    sample_labels: { frame: 'prop.clipboard.orange', dx: -6, dy: -42 },
    results_printout: { frame: 'prop.papers.a', dy: -40 },
    // binders rest in the display stand's tray at (2,8)
    phi_identifiers: { frame: 'prop.binders', dy: -22 },
  },
  records_room: {
    // binders rest on the display stand at (4,4) (lab's phi_identifiers anchor)
    unlocked_cabinet: { frame: 'prop.binders', dy: -22 },
    // the monitor stands on the clerk island's left end (ER unlocked_computer pattern)
    audit_log: { frame: 'prop.monitor.pc', dx: 30, dy: -23 },
    // the to-shred stack sits on the shredder island's back counter, beside the machine
    shredder: { frame: 'prop.papers.a', dx: -28, dy: -29 },
    // clipboard nests in the display stand's tray at (17,8) (entrance's brochure anchor)
    minimum_necessary_manual: { frame: 'prop.clipboard.blue', dy: -12 },
    // binders rest on the display stand at (10,4)
    hipaa_penalties: { frame: 'prop.binders', dy: -22 },
  },
  it_office: {
    // the sticky note is stuck to the monitoring console's blue front band
    // (break_room verbal_disclosure / reception sign_in_sheet anchor)
    password_note: { frame: 'prop.clipboard.sky', dy: -26 },
    // binders rest on the wood desk's top at (7,12), one row below the zone tile
    breach_playbook: { frame: 'prop.binders', dx: 6, dy: 17 },
    // fax + vendor clipboard + safeguards chart sit on display stands (decor above)
    fax_machine: { frame: 'prop.fax.a', dy: -8 },
    vendor_agreement: { frame: 'prop.clipboard.plain', dy: -8 },
    security_safeguards: { frame: 'prop.sign.chart', dy: -4 },
  },
  er: {
    // each icon sits on its display-stand decor (dy -4 straddled the wall/floor seam
    // under the EMERGENCY panel; the stand at (10,3) catches the chart at dy 22)
    whiteboard: { frame: 'prop.sign.chart', dy: 22 },
    // on the stand at (6,6) — dx 38 left the monitor floating against the station front.
    // monitor.pc's bottom ~10px are a dangling cable: dy -5 lands the head on the stand
    // top and drapes the cable down the stand's back
    unlocked_computer: { frame: 'prop.monitor.pc', dy: -5 },
    // on the stand at (17,11); -2 keeps the bob clear of the gurney art's bottom edge
    emergency_exceptions: { frame: 'prop.clipboard.navy', dy: -2 },
  },
  break_room: {
    // the plate sits fully on the lunch-table top (table surface is world y 218..270)
    overheard_conversation: { frame: 'prop.plate.a', dy: -44 },
    // the phone rests on the nightstand top at (12,7)
    unlocked_phone: { frame: 'prop.phone.sky', dy: -27 },
    // pinned on the wall face just right of the notice board (board spans x 323..381)
    staff_corkboard: { frame: 'prop.poster.orange', dx: 24, dy: -34 },
    // a note stuck to the kitchenette fridge door (fridge face x 544..576, y 56..128)
    verbal_disclosure: { frame: 'prop.clipboard.green', dy: -50 },
  },
};

// ── Room styles ──────────────────────────────────────────────────────────────
const floor = (set: string): RoomArtStyle['floor'] => ({ set, variants: 6, pattern: [3, 2], scatter: 0.18 });

/** Corridors follow the act they sit in: bright stone for Acts 1–2, darker terrazzo + heavier vignette for Act 3. */
const hallwayStyle = (wall: WallStyle, floorSet: string, ambientAlpha: number, vignette: number): RoomArtStyle => ({
  floor: floor(floorSet),
  wall: { style: wall, rows: 2, trim: 'cream' },
  wear: [{ tx: 2, ty: 3, r: 26 }, { tx: 6, ty: 3.2, r: 34 }, { tx: 10, ty: 3, r: 36 }, { tx: 14, ty: 3.2, r: 34 }, { tx: 17, ty: 3, r: 26 }],
  light: {
    ambient: 0xf4e6d0, ambientAlpha,
    pools: [{ tx: 4, ty: 3, r: 130, color: 0xffe9c8, alpha: 0.11 }, { tx: 10, ty: 3, r: 130, color: 0xffe9c8, alpha: 0.1 }, { tx: 15, ty: 3, r: 130, color: 0xffe9c8, alpha: 0.11 }],
    vignette,
  },
});

export const ROOM_ART: Record<string, RoomArtStyle> = {
  hospital_entrance: {
    floor: floor('floor.whitetile'),
    wall: { style: 'blue', rows: 2, trim: 'white' },
    wear: [{ tx: 17, ty: 7, r: 28 }, { tx: 14, ty: 6.2, r: 32 }, { tx: 10, ty: 5.5, r: 40, alpha: 0.07 }, { tx: 10, ty: 8.5, r: 30 }, { tx: 10, ty: 11, r: 32 }],
    light: {
      ambient: 0xfff1df, ambientAlpha: 0.06,
      pools: [{ tx: 5, ty: 6, r: 150, color: 0xfff4e0, alpha: 0.1 }, { tx: 10, ty: 6, r: 170, color: 0xffffff, alpha: 0.1 }, { tx: 15, ty: 6, r: 150, color: 0xfff4e0, alpha: 0.1 }, { tx: 10, ty: 11, r: 140, color: 0xfff4e0, alpha: 0.08 }],
      vignette: 0.18,
    },
  },
  reception: {
    floor: floor('floor.cream'),
    wall: { style: 'cream', rows: 2, trim: 'cream' },
    wear: [
      { tx: 2, ty: 7, r: 26 }, { tx: 5, ty: 6.5, r: 30 }, { tx: 8, ty: 5.5, r: 34 },
      { tx: 10, ty: 5.2, r: 40, alpha: 0.08 }, { tx: 12, ty: 5.5, r: 34 }, { tx: 15, ty: 6.5, r: 30 },
      { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 8.5, r: 30 }, { tx: 10, ty: 11.5, r: 30 },
    ],
    light: {
      ambient: 0xffe4c2, ambientAlpha: 0.1,
      pools: [
        { tx: 5, ty: 6, r: 150, color: 0xffe9c8, alpha: 0.11 }, { tx: 10, ty: 7, r: 170, color: 0xffefd6, alpha: 0.12 },
        { tx: 15, ty: 6, r: 150, color: 0xffe9c8, alpha: 0.11 }, { tx: 10, ty: 12, r: 140, color: 0xffe9c8, alpha: 0.08 },
      ],
      vignette: 0.2,
    },
  },
  hallway_reception_break: hallwayStyle('beige', 'floor.lightgray', 0.12, 0.22),
  hallway_break_lab: hallwayStyle('beige', 'floor.lightgray', 0.12, 0.24),
  hallway_lab_records: hallwayStyle('beige', 'floor.stone.beige', 0.14, 0.28),
  hallway_records_it: hallwayStyle('bluegray', 'floor.terrazzo', 0.18, 0.34),
  hallway_it_er: hallwayStyle('bluegray', 'floor.terrazzo', 0.2, 0.36),
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
      ambient: 0xd8f0ec, ambientAlpha: 0.12,
      pools: [{ tx: 5, ty: 6, r: 150, color: 0xd0f8ff, alpha: 0.11 }, { tx: 14, ty: 6, r: 150, color: 0xd0f8ff, alpha: 0.11 }, { tx: 10, ty: 11, r: 150, color: 0xe0fff8, alpha: 0.09 }],
      vignette: 0.26,
    },
  },
  records_room: {
    floor: floor('floor.stone.beige'),
    wall: { style: 'green', rows: 2, trim: 'cream' },
    wear: [{ tx: 2, ty: 7, r: 26 }, { tx: 4.5, ty: 5, r: 26, alpha: 0.06 }, { tx: 14.5, ty: 5, r: 26, alpha: 0.06 }, { tx: 10, ty: 7, r: 36 }, { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 11.5, r: 30 }],
    light: {
      ambient: 0xd8d0b8, ambientAlpha: 0.2,
      pools: [{ tx: 4.5, ty: 4, r: 120, color: 0xffe2b0, alpha: 0.14 }, { tx: 14.5, ty: 4, r: 120, color: 0xffe2b0, alpha: 0.14 }, { tx: 10, ty: 9, r: 150, color: 0xffe6b8, alpha: 0.13 }],
      vignette: 0.3,
    },
  },
  it_office: {
    floor: floor('floor.darkgrid'),
    wall: { style: 'gray', rows: 2, trim: 'white' },
    wear: [{ tx: 2, ty: 7, r: 26 }, { tx: 10, ty: 8, r: 36, alpha: 0.07 }, { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 11.5, r: 30 }],
    light: {
      ambient: 0xa8b8e8, ambientAlpha: 0.24,
      pools: [{ tx: 4, ty: 7, r: 140, color: 0x9fe8ff, alpha: 0.12 }, { tx: 15, ty: 7, r: 140, color: 0x9fe8ff, alpha: 0.12 }, { tx: 10, ty: 6, r: 150, color: 0x7fd0ff, alpha: 0.16 }, { tx: 10, ty: 1, r: 150, color: 0x7fd0ff, alpha: 0.1 }],
      vignette: 0.4,
    },
  },
  er: {
    floor: floor('floor.bluetile'),
    wall: { style: 'teal', rows: 2, trim: 'white' },
    wear: [{ tx: 2, ty: 7, r: 28 }, { tx: 6, ty: 7.5, r: 32 }, { tx: 10, ty: 7.5, r: 40, alpha: 0.07 }, { tx: 10, ty: 11.5, r: 32 }, { tx: 4, ty: 6, r: 26 }, { tx: 16, ty: 6, r: 26 }],
    light: {
      ambient: 0xc4d6ff, ambientAlpha: 0.24,
      pools: [{ tx: 4, ty: 4, r: 140, color: 0xe0f0ff, alpha: 0.12 }, { tx: 15, ty: 4, r: 140, color: 0xe0f0ff, alpha: 0.12 }, { tx: 10, ty: 8, r: 160, color: 0xe8f4ff, alpha: 0.12 }, { tx: 1, ty: 7, r: 90, color: 0xff6060, alpha: 0.1 }],
      vignette: 0.4,
    },
  },
  break_room: {
    floor: floor('floor.parquet'),
    wall: { style: 'green', rows: 2, trim: 'cream' },
    wear: [{ tx: 2, ty: 7, r: 26 }, { tx: 6, ty: 7, r: 30 }, { tx: 13, ty: 7, r: 30 }, { tx: 17, ty: 7, r: 26 }, { tx: 10, ty: 10, r: 34 }, { tx: 10, ty: 12, r: 28 }],
    light: {
      ambient: 0xffd9a8, ambientAlpha: 0.16,
      pools: [{ tx: 4, ty: 8, r: 150, color: 0xffe6b8, alpha: 0.14 }, { tx: 15, ty: 8, r: 150, color: 0xffe6b8, alpha: 0.14 }, { tx: 10, ty: 4, r: 150, color: 0xffe6b8, alpha: 0.12 }],
      vignette: 0.22,
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
