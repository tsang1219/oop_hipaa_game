// Run 11 — print the opaque bounding box of each fixed-size frame in a sheet (pixel coords within the frame).
//   node scripts/art/bbox.mjs <sheet.png> <frameW> <frameH>
import fs from 'fs';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const [,, src, fwA, fhA] = process.argv;
const fw = +fwA, fh = +fhA;
const png = PNG.sync.read(fs.readFileSync(src));
const cols = Math.floor(png.width / fw), rows = Math.floor(png.height / fh);
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
  let x0 = fw, y0 = fh, x1 = -1, y1 = -1;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = ((r * fh + y) * png.width + (c * fw + x)) * 4;
    if (png.data[i + 3] > 0) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  }
  console.log(`frame ${r * cols + c}: x ${x0}..${x1} (w ${x1 - x0 + 1})  y ${y0}..${y1} (h ${y1 - y0 + 1})`);
}
