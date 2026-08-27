// Run 11 (art audit) — propose / apply pixel-exact rects for manifest frames.
//   node scripts/art/tighten.mjs [--apply] [--only names.txt] [--include-anim]
// For each frame (floors/walls/trims/shadows, split blocks and, unless --include-anim, anim./door.
// strips excluded): find the 8-connected opaque components that touch the rect; the "main" one is
// the component with the most pixels inside the rect. Classify:
//   clean   main bbox fits within the rect grown by one tile on each side and is ≤ 2.5× the rect's
//           area → the object is separable: the proposed rect is its exact bbox
//   merged  main bbox is much larger (LimeZu packed this object against its neighbours) → manual
//   empty   nothing opaque in the rect
// --apply rewrites clean frames as `px` rects (keeping a `_was` note) and prints the merged ones.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const P = 'scripts/art/atlas-manifest.json';
const manifest = JSON.parse(fs.readFileSync(P, 'utf8'));
const TILE = manifest.tile ?? 32;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const apply = args.includes('--apply');
const includeAnim = args.includes('--include-anim');
const only = opt('--only', null) ? new Set(fs.readFileSync(opt('--only'), 'utf8').split('\n').map(l => l.trim().split(/\s+/)[0]).filter(Boolean)) : null;
const sheets = new Map();
const sheet = (id) => { if (!sheets.has(id)) sheets.set(id, PNG.sync.read(fs.readFileSync(path.join(manifest.vendor, manifest.sheets[id])))); return sheets.get(id); };
const alpha = (png, x, y) => (x < 0 || y < 0 || x >= png.width || y >= png.height) ? 0 : png.data[(y * png.width + x) * 4 + 3];
const labelCache = new Map();
/** label every component of a sheet once: Int32Array of component ids, plus per-id bbox/size */
function labels(id) {
  if (labelCache.has(id)) return labelCache.get(id);
  const png = sheet(id); const lab = new Int32Array(png.width * png.height).fill(-1); const comps = [];
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const k = y * png.width + x; if (!alpha(png, x, y) || lab[k] >= 0) continue;
    const cid = comps.length; const c = { x0: x, y0: y, x1: x, y1: y, n: 0 }; comps.push(c);
    const stack = [k]; lab[k] = cid;
    while (stack.length) {
      const q = stack.pop(); c.n++; const qy = Math.floor(q / png.width), qx = q % png.width;
      if (qx < c.x0) c.x0 = qx; if (qx > c.x1) c.x1 = qx; if (qy < c.y0) c.y0 = qy; if (qy > c.y1) c.y1 = qy;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = qx + dx, ny = qy + dy; if (alpha(png, nx, ny)) { const nk = ny * png.width + nx; if (lab[nk] < 0) { lab[nk] = cid; stack.push(nk); } } }
    }
  }
  const r = { lab, comps, png }; labelCache.set(id, r); return r;
}
const SKIP = /^(floor|wall|trim|shadow)\./;
const out = { clean: [], merged: [], empty: [], kept: [] };
for (const [name, f] of Object.entries(manifest.frames)) {
  if (SKIP.test(name) || f.split) continue;
  if (!includeAnim && /^(anim|door)\./.test(name)) continue;
  if (only && !only.has(name)) continue;
  const { lab, comps, png } = labels(f.sheet);
  let x, y, w, h; if (f.px) [x, y, w, h] = f.px; else { const [tx, ty, tw, th] = f.t; x = tx * TILE; y = ty * TILE; w = tw * TILE; h = th * TILE; }
  const inside = new Map();
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const cid = lab[(y + j) * png.width + x + i]; if (cid >= 0) inside.set(cid, (inside.get(cid) ?? 0) + 1); }
  if (!inside.size) { out.empty.push(name); continue; }
  const [mainId] = [...inside.entries()].sort((a, b) => b[1] - a[1])[0];
  const c = comps[mainId];
  const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
  const fits = c.x0 >= x - TILE && c.y0 >= y - TILE && c.x1 < x + w + TILE && c.y1 < y + h + TILE;
  const big = bw * bh > 2.5 * w * h;
  const px = [c.x0, c.y0, bw, bh];
  const same = f.px && f.px.join(',') === px.join(',');
  const intruders = [...inside.keys()].filter(id => id !== mainId).length;
  const rec = { name, sheet: f.sheet, rect: [x, y, w, h], px, intruders, grew: c.x0 < x || c.y0 < y || c.x1 >= x + w || c.y1 >= y + h };
  if (same) out.kept.push(rec);
  else if (fits && !big) out.clean.push(rec);
  else out.merged.push({ ...rec, mainBbox: px });
}
const fmt = (r) => `${r.name.padEnd(32)} ${r.sheet.padEnd(11)} rect [${r.rect.join(',')}] → px [${r.px.join(',')}]${r.grew ? '  GREW' : ''}${r.intruders ? `  (+${r.intruders} intruding)` : ''}`;
console.log(`clean: ${out.clean.length}   merged: ${out.merged.length}   empty: ${out.empty.length}   already exact: ${out.kept.length}`);
console.log('\n── clean (auto) ──'); out.clean.forEach(r => console.log(fmt(r)));
console.log('\n── merged (manual) ──'); out.merged.forEach(r => console.log(fmt(r)));
if (out.empty.length) console.log('\n── empty ──\n' + out.empty.join('\n'));
if (apply) {
  for (const r of out.clean) { const f = manifest.frames[r.name]; f._was = f.px ? { px: f.px } : { t: f.t }; delete f.t; f.px = r.px; }
  fs.writeFileSync(P, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\napplied ${out.clean.length} pixel rects to ${P}`);
}
