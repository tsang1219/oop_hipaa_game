// Run 11 (art-substrate) — slice-to-atlas step (ASSET_PLAN §3 step 3).
//
//   node scripts/art/slice-atlas.mjs [--manifest scripts/art/atlas-manifest.json]
//
// Reads the manifest, cuts every frame out of the vendor sheets (LimeZu Modern
// Interiors, 32x32 — git-ignored, see attached_assets/vendor/modern-interiors/README.md),
// shelf-packs them into ONE texture atlas with 2px padding + 1px edge extrusion
// (no bleeding under the room-entry camera zoom), and writes:
//   <output>/<name>.png            the atlas
//   <output>/<name>.json           Phaser "JSON hash" atlas data (load.atlas)
//   <generatedTypes>               `AtlasFrame` string-literal union for the TS catalog
// No dependencies beyond node: pngjs ships inside playwright-core's utils bundle.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');

const argIdx = process.argv.indexOf('--manifest');
const manifestPath = argIdx > 0 ? process.argv[argIdx + 1] : 'scripts/art/atlas-manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const TILE = manifest.tile ?? 32;
const PAD = 2, EXTRUDE = 1, MAX_W = 1024;

if (!fs.existsSync(manifest.vendor)) {
  console.error(`[slice-atlas] vendor folder missing: ${manifest.vendor}\n` +
    `  The raw LimeZu pack is git-ignored (no-redistribution license). Restore it per\n` +
    `  attached_assets/vendor/modern-interiors/README.md, then re-run. The committed atlas\n` +
    `  under ${manifest.output} is what the game loads, so nothing else is blocked.`);
  process.exit(2);
}

const sheetCache = new Map();
function sheet(id) {
  if (!sheetCache.has(id)) {
    const rel = manifest.sheets[id];
    if (!rel) throw new Error(`unknown sheet id '${id}'`);
    const png = PNG.sync.read(fs.readFileSync(path.join(manifest.vendor, rel)));
    sheetCache.set(id, png);
  }
  return sheetCache.get(id);
}

/** Expand manifest entries into concrete {name, sheet, x, y, w, h} (pixels). */
function expand() {
  const out = [];
  for (const [name, f] of Object.entries(manifest.frames)) {
    const src = sheet(f.sheet);
    let x, y, w, h;
    if (f.px) [x, y, w, h] = f.px;
    else { const [tx, ty, tw, th] = f.t; x = tx * TILE; y = ty * TILE; w = tw * TILE; h = th * TILE; }
    if (x + w > src.width || y + h > src.height) throw new Error(`frame '${name}' exceeds sheet '${f.sheet}' (${src.width}x${src.height})`);
    if (f.split) {
      const cols = w / TILE, rows = h / TILE; let i = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ name: `${name}.${i++}`, sheet: f.sheet, x: x + c * TILE, y: y + r * TILE, w: TILE, h: TILE });
    } else out.push({ name, sheet: f.sheet, x, y, w, h });
  }
  return out;
}

const frames = expand();
const names = new Set();
for (const f of frames) { if (names.has(f.name)) throw new Error(`duplicate frame name ${f.name}`); names.add(f.name); }

// Shelf pack: tallest first, stable by name, fixed width.
const order = [...frames].sort((a, b) => b.h - a.h || b.w - a.w || a.name.localeCompare(b.name));
let shelfY = PAD, shelfH = 0, cursorX = PAD, atlasW = MAX_W;
for (const f of order) {
  const cw = f.w + EXTRUDE * 2 + PAD, ch = f.h + EXTRUDE * 2;
  if (cursorX + cw > atlasW) { shelfY += shelfH + PAD; shelfH = 0; cursorX = PAD; }
  f.ax = cursorX + EXTRUDE; f.ay = shelfY + EXTRUDE;
  cursorX += cw; shelfH = Math.max(shelfH, ch);
}
const atlasH = shelfY + shelfH + PAD;
const atlas = new PNG({ width: atlasW, height: atlasH });
atlas.data.fill(0);

function px(png, x, y) { const i = (y * png.width + x) * 4; return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]]; }
function put(png, x, y, rgba) { const i = (y * png.width + x) * 4; png.data[i] = rgba[0]; png.data[i + 1] = rgba[1]; png.data[i + 2] = rgba[2]; png.data[i + 3] = rgba[3]; }

for (const f of order) {
  const src = sheet(f.sheet);
  // body + extruded border (clamped source coords)
  for (let dy = -EXTRUDE; dy < f.h + EXTRUDE; dy++) for (let dx = -EXTRUDE; dx < f.w + EXTRUDE; dx++) {
    const sx = Math.min(f.w - 1, Math.max(0, dx)), sy = Math.min(f.h - 1, Math.max(0, dy));
    put(atlas, f.ax + dx, f.ay + dy, px(src, f.x + sx, f.y + sy));
  }
}

const json = { frames: {}, meta: { app: 'scripts/art/slice-atlas.mjs', version: '1', image: `${manifest.name}.png`, format: 'RGBA8888', size: { w: atlasW, h: atlasH }, scale: '1', source: 'LimeZu Modern Interiors (limezu.itch.io/moderninteriors) — credit required, no redistribution of the raw pack' } };
for (const f of [...frames].sort((a, b) => a.name.localeCompare(b.name))) {
  json.frames[f.name] = { frame: { x: f.ax, y: f.ay, w: f.w, h: f.h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }, sourceSize: { w: f.w, h: f.h } };
}

fs.mkdirSync(manifest.output, { recursive: true });
fs.writeFileSync(path.join(manifest.output, `${manifest.name}.png`), PNG.sync.write(atlas));
fs.writeFileSync(path.join(manifest.output, `${manifest.name}.json`), JSON.stringify(json, null, 1));

if (manifest.generatedTypes) {
  const sorted = Object.keys(json.frames);
  const ts = `// GENERATED by scripts/art/slice-atlas.mjs from scripts/art/atlas-manifest.json — do not edit.\n` +
    `// Frame names in attached_assets/generated_images/privacyquest/atlas/${manifest.name}.json (${sorted.length} frames).\n` +
    `export const ATLAS_KEY = '${manifest.name}' as const;\n` +
    `export const ATLAS_FRAMES = [\n${sorted.map(n => `  '${n}',`).join('\n')}\n] as const;\n` +
    `export type AtlasFrame = typeof ATLAS_FRAMES[number];\n` +
    `export const ATLAS_FRAME_SIZES: Record<AtlasFrame, { w: number; h: number }> = {\n` +
    sorted.map(n => `  '${n}': { w: ${json.frames[n].frame.w}, h: ${json.frames[n].frame.h} },`).join('\n') + `\n};\n`;
  fs.mkdirSync(path.dirname(manifest.generatedTypes), { recursive: true });
  fs.writeFileSync(manifest.generatedTypes, ts);
}
const bytes = fs.statSync(path.join(manifest.output, `${manifest.name}.png`)).size;
console.log(`[slice-atlas] ${frames.length} frames from ${sheetCache.size} sheets -> ${manifest.output}/${manifest.name}.png (${atlasW}x${atlasH}, ${(bytes / 1024).toFixed(0)} KB) + .json + ${manifest.generatedTypes ?? ''}`);
