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
/** One 8×1 bench run = four blue-top lab work tables (hospital#224/#226) butted edge
 *  to edge, 8 px margin each end. The old two-row kw-cabinet composite read as a tan
 *  kitchen dresser with no work surface (design pass, user-flagged "bizarre tables");
 *  these singles are front-facing tables with a visible top for the bottle clutter. */
const LAB_BENCH_8x1: PropDef = {
  frame: 'prop.table.lab.a',
  parts: [
    { frame: 'prop.table.lab.a', dx: 8 },
    { frame: 'prop.table.lab.b', dx: 68 },
    { frame: 'prop.table.lab.a', dx: 128 },
    { frame: 'prop.table.lab.b', dx: 188 },
  ],
};
/** Two waiting-room chairs side by side on a 2×1 footprint (LimeZu's chairs are 28 px wide). */
const chairPair = (a: AtlasFrame, b: AtlasFrame = a): PropDef => ({ frame: a, parts: [{ frame: a, dx: 3 }, { frame: b, dx: 33 }] });
/** A small dispenser standing on a little table. */
const onStand = (top: AtlasFrame, dy = -12): PropDef => ({ frame: 'prop.table.small.white', parts: [{ frame: 'prop.table.small.white', dx: 5 }, { frame: top, dx: 11, dy }] });

// ── Game-wide defaults ────────────────────────────────────────────────────────
export const PROP_DEFAULTS: Record<string, PropDef> = {
  // counters / desks
  // the wood U counter, split like the entrance's white one (design pass): top slab
  // (wings + back ledge + monitors) at the footprint's top row, front modesty panel a
  // row deeper — Riley stands INSIDE the transparent pocket on the desk's own footprint
  // tiles (created later, she wins the depth tie with the top slab; the front panel
  // closes over her feet). Only reception uses this default (the lobby overrides it).
  desk: {
    frame: 'prop.counter.reception.wood',
    // split line moved UP vs the first cut: the full-width tan slab now lives in the
    // .front frame (depthRow 4) so it occludes the depth-8 pocket NPC's boots — with
    // the slab in the tied-depth U, Riley drew over it and "stood on the desk"
    // (design review). U dy -42 + front dy 0 recompose the source pixel-exact.
    parts: [
      { frame: 'prop.counter.reception.wood', dx: 0, dy: -42, depthRow: 3 },
      { frame: 'prop.counter.reception.wood.front', dx: 0, dy: 0, depthRow: 4 },
    ],
  },
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
  lab_bench: LAB_BENCH_8x1,
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
  // the 4-tile studio console + a live monitor planted on the top face at col 10
  // (the bare console top read as a cut-off blank slab — user-flagged); the analyst
  // stands BEHIND the desk at (10,4), so the screen sits in front of him and its
  // bottom bridges the floor strip between his feet and the desk's back edge
  monitoring_desk: {
    frame: 'prop.console.blue.4',
    parts: [
      { frame: 'prop.console.blue.4', dx: 0 },
      { frame: 'anim.monitor.0', dx: 64, dy: -24, anim: ANIM_MONITOR },
    ],
  },
  // desk pod (it_office-only type, now 3x1): the curved tvstudio control desk —
  // a complete free-standing silhouette (the old console.blue.l+r butt was the
  // caps of the 4-tile console with the middle cut out: a blank slab that read
  // as a truncated countertop, user-flagged) — crowned with a live monitor
  workstation_cluster: {
    frame: 'prop.console.curve.blue',
    parts: [
      { frame: 'prop.console.curve.blue', dx: 4 },
      { frame: 'anim.monitor.0', dx: 32, dy: -24, anim: ANIM_MONITOR },
    ],
  },
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
  // dy -4: at -7 the machine's visible base still floated 2-3px above the stand's top
// face (design review read it as a printer hovering over a chair)
coffee_mug: { frame: 'prop.table.small.gray', parts: [{ frame: 'prop.table.small.gray', dx: 5 }, { frame: 'anim.coffee.0', dx: 0, dy: -4, anim: ANIM_COFFEE }] },
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
  // design pass: FRONT-facing bay — the side-view beds read as "cut off" (user flag).
  // hospital#178 is the whole vertical bed; head against the top wall (art tops ~y50,
  // the vending-machine wall-overlap convention), IV pole at the bed's mid-length,
  // bedside cabinet at the head (dy -40 = deeper = beside the pillow, correct
  // perspective). 3x2 footprint (was 4x3).
  patient_bay: { frame: 'prop.bed.blue', parts: [{ frame: 'prop.bed.blue', dx: 0 }, { frame: 'prop.ivpole.single', dx: 44, dy: -20 }, { frame: 'prop.bedside.white', dx: 62, dy: -40 }] },
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
  // round-drum machine + readout analyzer (the old pairing reused the autoclave single,
  // which now stands in the wash line — one identity per object)
  centrifuge: { frame: 'prop.scanner.ct', parts: [{ frame: 'prop.scanner.ct', dx: -2 }, { frame: 'prop.analyzer.a', dx: 56 }] },
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
  // dy -18: top y14, level with the lobby's tv.wall decor + welcome icon (the wall
  // trio hung at three heights, design review); bottom y60 clears the wood rail
  bulletin_board: { frame: 'prop.bulletin.notes', anchor: 'wall', dy: -18 },
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
    // Design pass: the desk is free-standing at (7,3) with a staff corridor behind it —
    // the U's pocket is transparent, so Riley/Aiyana stand INSIDE it on the desk's own
    // footprint tiles. depthRow 3 on the U slab ties with the pocket NPCs (row 3) and
    // NPCs are created later, so they draw over the back counter's lip; the front slab
    // stays a row deeper and closes the pocket in front of their feet.
    desk: {
      frame: 'prop.counter.reception.white',
      parts: [
        { frame: 'prop.counter.reception.white', dx: 0, dy: -28, depthRow: 3 },
        { frame: 'prop.counter.reception.white.front', dx: 32, dy: 0, depthRow: 4 },
      ],
    },
    // the SE coffee cart (was a collisionless ambience sprite floating mid-floor at
    // (5,5)): a wood table with the kitchen espresso machine, now a real y-sorted
    // obstacle anchoring the corner by the waiting chairs
    'table@17,12': {
      frame: 'prop.desk.k.wood',
      shadow: true,
      parts: [
        { frame: 'prop.desk.k.wood', dx: 3 },
        { frame: 'prop.coffeemaker.b', dx: 17, dy: -12 },
      ],
    },
    'plant@18,2': { frame: 'prop.fern.m' },
    'plant@1,2': { frame: 'prop.plant.orange.m' },
    // ('plant@1,10' key deleted — stale since the reviewer moved that plant to (1,9);
    // the default small orange plant it fell back to is the reviewed, shipped look)
    'plant@18,9': { frame: 'prop.plant.orange.s' },
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
    // (desk uses the PROP_DEFAULTS wood-counter composite — obstacle moved to (7,3)
    // so the staff corridor runs behind it and Riley works inside the pocket)
    'filing_cabinet@4,2': { frame: 'prop.locker.white.2' },
    'filing_cabinet@15,2': { frame: 'prop.locker.teal.2' },
    'plant@1,2': { frame: 'prop.plant.orange.m' },
    'plant@18,2': { frame: 'prop.plant.white.m' },
    'plant@1,5': { frame: 'prop.fern.m' },
    'chairs@2,8': chairPair('prop.chair.wait.yellow'),
    'chairs@2,10': chairPair('prop.chair.wait.yellow'),
    'chairs@16,8': chairPair('prop.chair.wait.green'),
    'chairs@16,10': chairPair('prop.chair.wait.green'),
    // dy -14: at -8 the board's lowest baked notes dipped into the baseboard band
    // (design review; break_room keeps the default -8)
    notice_board: { frame: 'prop.noticeboard', anchor: 'wall', dy: -14 },
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
    // tan lab stool behind the north bench (the tech's). Marcus's yellow stool at
    // (12,9) read as a stranded wicker basket (design review) — deleted; the tucked
    // joint stools in ROOM_DECOR seat the runs now
    'chair@7,4': { frame: 'prop.stool.tan' },
    // second meds shelf gets the .b single so the chemicals wall doesn't tile
    'chemical_shelf@18,11': { frame: 'prop.shelf.narrow.meds.b' },
  },
  records_room: {
    // design review: even with the contact shadow, the copier's pale body fully
    // camouflaged against the beige floor mid-room ("four disconnected strips") —
    // the obstacle now backs onto the south wall at (12,13), whose dark band sits
    // behind the white body (the IT-chalkboard anchoring pattern)
    'printer_station@12,13': { frame: 'prop.copier', shadow: true },
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
    // office chairs tucked into each desk pod's front-center (dy pulls the seat
    // back up over the pod's base band — the old wall-side chairs at (1,8)/(18,8)
    // read as gray bins stranded by the doors)
    'chair@3,9': { frame: 'prop.chair.office.gray', dy: -12 },
    'chair@16,9': { frame: 'prop.chair.office.sky', dy: -12 },
    plant: { frame: 'prop.fern.s' },
  },
  er: {
    // explicit run (cap, drawers, plain-shelf, end): the position-hash mids picked
    // kw.doors twice at (3,8), whose X door-braces read as packing crates
    triage_desk: {
      frame: 'prop.counter.kw.plain',
      parts: [
        { frame: 'prop.counter.kw.plain', dx: 0 },
        { frame: 'prop.counter.kw.drawers', dx: 32 },
        { frame: 'prop.counter.kw.plain2', dx: 64 },
        { frame: 'prop.counter.kw.end', dx: 96 },
      ],
    },
    // right bay mirrors the left (bed against the east end, pole mid, wood bedside on
    // the curtain side); bed dx 56 leaves 2px to the vital monitor at (18,2)
    'patient_bay@15,2': { frame: 'prop.bed.blue', parts: [{ frame: 'prop.bedside.wood', dx: 10, dy: -40 }, { frame: 'prop.ivpole.single', dx: 38, dy: -20 }, { frame: 'prop.bed.blue', dx: 56 }] },
    // flipX puts the curtain's support post on the bay side, mirroring the left curtain
    'curtain_partition@14,2': { frame: 'prop.curtain.tan', flipX: true },
    // treatment pod: vitals stand + blue exam table (the active treatment spot east)
    'gurney@15,8': { frame: 'prop.examtable.blue', parts: [{ frame: 'prop.monitor.stand', dx: 0 }, { frame: 'prop.examtable.blue', dx: 34 }] },
    // surgical robot beside the treatment table; dx -6 opens a gap to the pod's monitor
    'equipment@13,8': { frame: 'prop.machine.arms', dx: -6 },
    // crash cart parked flush at the east wall (dx shift keeps cart.wood off the wall
    // column base; the default -2/38 pair geometry preserved at -6/32... overlap seam
    // between the two carts is the proven butt from the clean pass)
    'crash_cart@17,6': { frame: 'prop.cart.monitor', parts: [{ frame: 'prop.cart.monitor', dx: -6 }, { frame: 'prop.cart.wood.a', dx: 32 }] },
    // wheelchair.side.tan is actually LimeZu's mop-and-bucket single — use the front
    // view proven in hospital_entrance (dx -6 keeps it off the east wall column)
    wheelchair: { frame: 'prop.wheelchair.front.tan', dx: -6 },
  },
  break_room: {
    // dx nudges close the 16px art gap between the two machines so they read as one
    // bank (46/50px arts centered on adjacent 2x2 footprints leave daylight)
    'vending_machine@2,2': { frame: 'prop.vending.snacks', dx: 6 },
    'vending_machine@4,2': { frame: 'prop.vending.gray', dx: -6 },
    // lounge pair: the FRONT-facing 3-seat couch (blue.3). gray.3 is LimeZu's
    // back-view couch (smooth back panel, cushion tops peeking over) — with the TV
    // south of the seats both couches must show their cushions. One flipped = a
    // matched left/right suite.
    'couch@1,8': { frame: 'prop.couch.blue.3' },
    'couch@4,8': { frame: 'prop.couch.blue.3', flipX: true },
    // cushioned stools pulled up to the lunch table's near side, flanking the
    // overheard-conversation plate at (10,9)
    'chair@9,9': { frame: 'prop.stool.blue' },
    'chair@11,9': { frame: 'prop.stool.red' },
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
    { frame: 'prop.tv.wall', tx: 6, ty: 0, dy: 14, layer: 'wall' },
    // dy 16: at dy 8 the clock's top frame rode the dark cap band (design review)
    { frame: 'prop.clock.blue', tx: 5, ty: 0, dy: 16, layer: 'wall' },
    // daylight over the free-standing desk — the desk's move to (7,3) exposed this
    // wall stretch (it was behind the counter's back riser before); "sunlight spills
    // through the glass doors" is the room's own description
    { frame: 'prop.window.gray.3', tx: 8.9, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.picture.landscape.b', tx: 13, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.sanitizer', tx: 15, ty: 0, dy: 22, layer: 'wall' },
    { frame: 'prop.sign.arrow.r', tx: 16, ty: 0, dy: 18, layer: 'wall' },
    // the desk phone on the back counter's right section (Riley is on the phone in
    // her scene). No paper-tray clutter: anywhere near Aiyana it merged with her
    // boots or her transient chart-fidget icons into a machine-looking blob (tried
    // the back counter and the front ledge), and the office-chair orb decor read
    // as a water jug once fully visible — the pocket keeps just people + monitor.
    { frame: 'prop.phone.gray', tx: 11, ty: 2, dy: -6, layer: 'prop', depthRow: 3 },
    // display table under the hipaa_brochure pickup at (16,5) — a clipboard flat on
    // open floor read as dropped litter (same fix reception's poster pickup got)
    // nightstand pedestal for the brochure pickup — the white tray-table read as a
    // printer/fax on bare floor (design review; same frame read "office chair" in lab)
    { frame: 'prop.table.phone.wood', tx: 16, ty: 5, layer: 'prop', depthRow: 5 },
    // a left-behind coffee mug on the east row-end table (the coffee cart is in the
    // SE corner below); the west table stays bare — papers on these tiny pedestal
    // tables read as a gray machine (the clean-pass trap, recreated and re-deleted)
    { frame: 'prop.mug.blue', tx: 15, ty: 8, dy: -12, layer: 'prop', depthRow: 8 },
    ...doorMats([[18, 7]]),
    // (no floor litter in the lobby — the papers at (5,6) and the rubbish ghost at
    // (14,12) read as junk on the walkway; reception's review set the precedent)
  ],
  reception: [
    { frame: 'prop.picture.landscape.a', tx: 1, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.lightswitch', tx: 2, ty: 1, dy: -2, layer: 'wall' },
    // dy 16: at dy 8 the clock's frame crossed the cap trim (design review — same
    // find as the lobby clock)
    { frame: 'prop.clock.white', tx: 4, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.sanitizer', tx: 6, ty: 0, dy: 22, layer: 'wall' },
    // the wall TV sat at tx 16 where the teal locker (top y38) swallowed its bottom 8px;
    // over the counter's right wing the wall is clear down to y50.
    { frame: 'prop.tv.wall', tx: 12, ty: 0, dy: 14, layer: 'wall' },
    { frame: 'prop.picture.landscape.b', tx: 17, ty: 0, dy: 16, layer: 'wall' },
    // daylight over the free-standing desk — moving it to (7,3) exposed the bare
    // cream stretch between the sanitizer (tx6) and the TV (tx12); same exterior
    // wall as the lobby's window (the rooms are neighbours), centered on the desk
    { frame: 'prop.window.gray.3', tx: 8.9, ty: 0, dy: 14, layer: 'wall' },
    // (the office-chair decor in the pocket is gone — Riley stands there now, and a
    // collisionless chair on the walkable staff corridor read as ghost furniture)
    // clipboard standing on the desk's left wing top (wing face y86-99 world)
    { frame: 'prop.clipboard.green', tx: 8, ty: 2, dx: -4, dy: -3, layer: 'prop', depthRow: 3 },
    // (papers.a deleted — the back ledge's free span left of Riley is narrower than
    // the tray art, and paper trays near a pocket NPC merged into a machine blob in
    // the lobby review; the wings carry the clipboard + mug clutter instead)
    // the "brown" mug frame is LimeZu's tri-colour red mug and read as a lidded jar here;
    // the blue mug (proven on the break-room counter) reads as a mug at game zoom
    { frame: 'prop.mug.blue', tx: 11, ty: 2, dx: 12, dy: -2, layer: 'prop', depthRow: 3 },
    // queue runner at the counter's foot, centered on the desk between the stanchions
    // (mid-floor at (8.5,8.5) the rug related to nothing)
    { frame: 'prop.mat.tan.3x2', tx: 8.5, ty: 5, layer: 'floor' },
    // display pedestal under the patient-rights poster pickup at (2,4) — the white
    // tray table read as a printer/office chair twice (lab + lobby reviews); the
    // nightstand is the proven pedestal
    { frame: 'prop.table.phone.wood', tx: 2, ty: 4, layer: 'prop', depthRow: 4 },
    ...doorMats([[1, 7], [18, 7]]),
    // (no floor litter in reception — a boulder-looking bag pile and an orphaned paper stack
    // mid-walkway failed review; the closet and back rooms keep their clutter)
  ],
  hallway_reception_break: hallwayDecor([
    { frame: 'prop.picture.landscape.c', tx: 1, ty: 0, dy: 16, layer: 'wall' },
    { frame: 'prop.extinguisher', tx: 17, ty: 1, dy: 2, layer: 'wall' },
    // sign at 14: the old panel at tx 13 overlapped the bulletin board's right edge
    // (board ends x~422); 14*32=448 clears it and stops short of the (15,1) tube at x480
    { frame: 'prop.sign.chart', tx: 14, ty: 0, dy: 16, layer: 'wall' },
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
    // small records sign, not another screen — the room's tip ITEM is the info TV at (8,1)
    { frame: 'prop.sign.small', tx: 2, ty: 0, dy: 16, layer: 'wall' },
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
    { frame: 'prop.sign.chart', tx: 17, ty: 0, dy: 16, layer: 'wall' },
    // bench-top clutter — sparse, deliberate groups ON the table tops (top band sits
    // ~25 px above each bench row's bottom edge). Each 8-tile run is two capped
    // 4-tile counters (#224 left / #226 right), so the mid-run joint at tx 10 gets a
    // straddling piece: the results_printout icon on the north bench, bottles.c on
    // the south one. bottles.a dx 8 keeps the pair off table 1's rounded corner.
    { frame: 'prop.bottles.lab.a', tx: 6, ty: 5, dx: 8, dy: -27, layer: 'prop', depthRow: 5 },
    { frame: 'prop.clipboard.sky', tx: 12, ty: 5, dx: 4, dy: -26, layer: 'prop', depthRow: 5 },
    { frame: 'prop.bottles.lab.c', tx: 10, ty: 8, dx: -16, dy: -27, layer: 'prop', depthRow: 8 },
    { frame: 'prop.papers.a', tx: 13, ty: 8, dx: -4, dy: -25, layer: 'prop', depthRow: 8 },
    // stools tucked at each run's mid joint: the butted caps' rounded inner corners
    // leave a pale notch under the tabletop that read as a smear (design review) —
    // the stool covers the joint's front face AND gives each bench its seat
    { frame: 'prop.stool.blue', tx: 10, ty: 5, dx: -16, dy: -6, layer: 'prop', depthRow: 5 },
    { frame: 'prop.stool.blue', tx: 10, ty: 8, dx: -16, dy: -6, layer: 'prop', depthRow: 8 },
    // display pedestal under the phi_identifiers pickup at (4,11): the 22px tray
    // stands were too narrow for the 40px binder fan (docs overhung onto bare floor
    // both reviews) — the 32px nightstand carries the whole fan
    { frame: 'prop.table.phone.wood', tx: 4, ty: 11, layer: 'prop', depthRow: 11 },
    // first-aid box on the sliver of bare wall between the fume hood's right edge
    // (x256) and the chalkboard art (x~277) — the exposed junction of the hood's
    // flat glass slab and the ribbed wall read as an accidental material seam
    { frame: 'prop.firstaid', tx: 8, ty: 0, dy: 20, layer: 'wall' },
    // wet-area mat at the wash line's sink front
    { frame: 'prop.mat.gray', tx: 13, ty: 12, layer: 'floor' },
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
    // dx -14: at -2 the binders' right third overhung the desk's east edge over bare
    // floor (design review "floating document stack")
    { frame: 'prop.binders', tx: 11, ty: 8, dx: -14, dy: -6, layer: 'prop', depthRow: 9 },
    // design pass: the sorting pile — a paper tray on the desk top directly in front
    // of the clerk, who now works BEHIND the desk at (10,7); the tray bridges the
    // floor strip between his feet (y256) and the back row's top (y276), the same
    // trick as the it_office analyst's desk monitor
    { frame: 'prop.papers.a', tx: 10, ty: 8, dx: 0, dy: -6, layer: 'prop', depthRow: 9 },
    // shred-waste crumple in the floor slot between the box stacks (boxes.tall ends x64,
    // the archive_box crate pile starts x96 since its move to (3,13))
    { frame: 'prop.debris', tx: 2, ty: 13, dx: 0, dy: 10, layer: 'floor', alpha: 0.8 },
    // display stands under the three bare-floor pickups (reception/entrance/lab pattern)
    { frame: 'prop.table.small.brown', tx: 4, ty: 4, layer: 'prop', depthRow: 4 },
    { frame: 'prop.table.small.brown', tx: 10, ty: 4, layer: 'prop', depthRow: 4 },
    { frame: 'prop.table.small.brown', tx: 17, ty: 8, layer: 'prop', depthRow: 8 },
    // (design pass: the reviewer's optional "mat under GERALD" was tried twice — a
    // 2-tile gray pad read as two doormats flanking the copier, the green 2x2 rug as
    // furniture noise. Both reverted; the copier gets a soft contact shadow via a
    // room override instead, and the GERALD sign + green screen carry the identity.)
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
    // and read as slipping off the desk edge. Desk top, west to east: papers (8),
    // keyboard+mic (9), the live monitor part (10, in front of the analyst), mini
    // tower (11) — the top used to be blank white except two strays (user-flagged)
    { frame: 'prop.papers.a', tx: 8, ty: 6, dx: 4, dy: -22, layer: 'prop', depthRow: 6 },
    { frame: 'prop.keyboard', tx: 9, ty: 6, dx: 2, dy: -22, layer: 'prop', depthRow: 6 },
    { frame: 'prop.tower.mini.blue', tx: 11, ty: 6, dx: 2, dy: -23, layer: 'prop', depthRow: 6 },
    // GERALD's coffee on his pod's east wing (small personal touch per pod)
    { frame: 'prop.mug.brown', tx: 17, ty: 8, dx: 2, dy: -26, layer: 'prop', depthRow: 8 },
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
    // both info screens hang over the rolling curtains (art x-bands clear of the
    // vertical bays' head-line, which tops at ~y50; hscreen visible art is y14..47)
    { frame: 'anim.hscreen.0', tx: 4, ty: 0, dy: 0, layer: 'wall', anim: ANIM_HSCREEN },
    // tiles ~7-12.6 of the wall face sit behind the screen-fixed room-title text, so
    // the cross sign hangs in the gap between the left screen and the title
    { frame: 'prop.sign.cross', tx: 6, ty: 0, dy: 14, layer: 'wall' },
    // (prop.whiteboard wall board deleted — the narrowed bays + right screen claim the
    // face, and the status-board zone below already carries the "board" identity)
    { frame: 'prop.firstaid', tx: 12, ty: 0, dy: 26, layer: 'wall' },
    { frame: 'anim.hscreen.0', tx: 13, ty: 0, dy: 0, layer: 'wall', anim: ANIM_HSCREEN },
    { frame: 'prop.clock.white', tx: 1, ty: 0, dy: 8, layer: 'wall' },
    // triage clutter rides the desk (now at (3,8)): clipboard on the col-4 drawers,
    // red "ER hotline" phone centered on the col-5 counter (on the end cap it
    // dwarfed and overhung the little leg piece — the end stays a bare side table)
    { frame: 'prop.clipboard.navy', tx: 4, ty: 8, dx: -6, dy: -8, layer: 'prop', depthRow: 8 },
    { frame: 'prop.phone.red', tx: 5, ty: 8, dx: 0, dy: -8, layer: 'prop', depthRow: 8 },
    ...doorMats([[1, 7]], 'prop.mat.gray'),
    // display stands under the three pickups (records/it_office pattern);
    // the (16,12) stand takes depthRow 4 so the item icon (depth 10) draws on top
    { frame: 'prop.table.small.gray', tx: 10, ty: 3, layer: 'prop', depthRow: 3 },
    { frame: 'prop.table.small.gray', tx: 7, ty: 6, layer: 'prop', depthRow: 6 },
    { frame: 'prop.table.small.gray', tx: 16, ty: 12, layer: 'prop', depthRow: 4 },
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
    { frame: 'prop.food.a', tx: 9, ty: 7, dx: 6, dy: -14, layer: 'prop', depthRow: 8 },
    { frame: 'prop.mug.brown', tx: 11, ty: 7, dx: 4, dy: -16, layer: 'prop', depthRow: 8 },
    { frame: 'prop.food.c', tx: 11, ty: 7, dx: -10, dy: -4, layer: 'prop', depthRow: 8 },
    { frame: 'prop.plate.a', tx: 10, ty: 7, dx: 10, dy: -2, layer: 'prop', depthRow: 8 },
    // the phone zone's side table, against the east wall below the right door
    { frame: 'prop.table.phone.wood', tx: 18, ty: 10, dy: -2, layer: 'prop', depthRow: 10 },
    // lounge rug: fills the sitting gap between the couch pair (bottoms y320) and the
    // TV screen top (y374); centered on the pair's seam at x128
    { frame: 'prop.mat.tan.3x2', tx: 2, ty: 9, dx: 16, dy: 29, layer: 'floor' },
    ...doorMats([[1, 7], [18, 7]]),
    // crumpled paper that missed the bin, right beside its base
    // (rubbish pile deleted — the frame is a pile cut off its shelf single's base bar
    // and read as half an object beside the bin; user-reported)
  ],
};

// ── Interactable sprites (zones / items) ─────────────────────────────────────
const WALL_POSTER = (frame: AtlasFrame): InteractableArt => ({ frame, dy: -6 });

export const ROOM_INTERACTABLE_ART: Record<string, Record<string, InteractableArt>> = {
  hospital_entrance: {
    // dy -48: top lands at y14, level with the bulletin board and the tv.wall decor
    // (the wall trio hung at three heights, design review)
    welcome_board: { frame: 'prop.tv.wall', dy: -48 },
    // the clipboard rests on the nightstand pedestal's top face (≈30px up, lab precedent)
    hipaa_brochure: { frame: 'prop.clipboard.sky', dy: -30 },
  },
  reception: {
    // both zone tiles are ON the desk's front row (7,3 6x2 → rows 3-4): the icons sit
    // on the front counter's top face (world y118-132), flanking Riley in the pocket
    sign_in_sheet: { frame: 'prop.clipboard.blue', dy: -20 },
    privacy_notice: { frame: 'prop.sign.small', dy: -22 },
    // chart rests on the nightstand pedestal's top face (entrance/lab anchor)
    patient_rights_poster: { frame: 'prop.sign.chart', dy: -30 },
  },
  // one consistent pickup language for the tip series: a whole wall info screen.
  // (the six old 20x32 "poster" panels each read as HALF a TV at game scale — user-reported)
  // Tip items at (10,1) (center x336) collide with the bulletin board's left edge
  // (board hangs at x336..382): dx -26 centers the 46px TV at x310 (spans 287..333, clear).
  hallway_reception_break: { hallway1_phi_tip: WALL_POSTER('prop.tv.wall') },
  hallway_break_lab: { hallway2_verbal_tip: { frame: 'prop.tv.wall', dx: -26, dy: -6 } },
  hallway_lab_records: { hallway3_deidentify_tip: WALL_POSTER('prop.tv.wall') },
  hallway_records_it: { hallway4_breach_tip: { frame: 'prop.tv.wall', dx: -26, dy: -6 } },
  hallway_it_er: { hallway5_emergency_tip: { frame: 'prop.tv.wall', dx: -26, dy: -6 } },
  lab: {
    // both zone icons sit ON a bench top (the gate literally says "results on the
    // counter"): zone tiles are the walkable tile beside the bench, dy -48 lands the
    // icon on the table's top band one row up. results_printout dx -16 centers the
    // paper stack on the north run's mid joint (it doubles as the joint's cover).
    sample_labels: { frame: 'prop.clipboard.orange', dy: -48 },
    results_printout: { frame: 'prop.papers.a', dx: -16, dy: -48 },
    // binders rest ON the nightstand pedestal's top face at (4,11) (top ≈ 30px above
    // the tile bottom) — lower anchors left the fan hovering at rail height
    phi_identifiers: { frame: 'prop.binders', dy: -30 },
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
    // (break_room verbal_disclosure / reception sign_in_sheet anchor). Orange
    // pad: clipboard.sky was white-on-white against the console front — the
    // observation gate wants the note to pop ("Is that a password on a sticky
    // note?"), and orange is the one color the blue/white console doesn't have
    password_note: { frame: 'prop.clipboard.orange', dy: -26 },
    // binders rest on the wood desk's top at (12,11)-(13,11), one row above the
    // zone tile (12,12) — the response desk beside the THREATS terminal.
    // dy -48: at -38 the fan's bottom crossed the desk's front edge and the
    // stack read as sliding off the corner (lab reviewer's "floating documents")
    breach_playbook: { frame: 'prop.binders', dx: 6, dy: -48 },
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
    staff_corkboard: { frame: 'prop.sign.small', dx: 24, dy: -34 },
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
