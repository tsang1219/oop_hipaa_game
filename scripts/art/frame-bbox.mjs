// Run 11 — opaque bbox (and per-row alpha profile) of atlas frames by name prefix.
//   node scripts/art/frame-bbox.mjs <prefix> [--rows]
import fs from 'fs';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const manifest = JSON.parse(fs.readFileSync('scripts/art/atlas-manifest.json', 'utf8'));
const atlas = JSON.parse(fs.readFileSync(`${manifest.output}/${manifest.name}.json`, 'utf8'));
const png = PNG.sync.read(fs.readFileSync(`${manifest.output}/${manifest.name}.png`));
const prefix = process.argv[2]; const rows = process.argv.includes('--rows'); const cols = process.argv.includes('--cols');
for (const [name, f] of Object.entries(atlas.frames)) {
  if (!name.startsWith(prefix)) continue;
  const { x: fx, y: fy, w, h } = f.frame;
  let x0 = w, y0 = h, x1 = -1, y1 = -1; const rowA = [], colA = new Array(w).fill(0);
  for (let y = 0; y < h; y++) { let n = 0; for (let x = 0; x < w; x++) {
    const i = ((fy + y) * png.width + fx + x) * 4;
    if (png.data[i + 3] > 0) { n++; colA[x]++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  } rowA.push(n); }
  console.log(`${name.padEnd(28)} ${w}x${h}  opaque x ${x0}..${x1}  y ${y0}..${y1}`);
  if (rows) console.log('   rows:', rowA.join(','));
  if (cols) console.log('   cols:', colA.join(','));
}
