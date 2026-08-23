// Run 11 — mean luminance of every room before / after / with the lighting layer off (HUD excluded).
import fs from 'fs';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const D = 'screenshots/art-substrate';
// region given as fractions of the image so 960x720 and 1280x960 captures sample the same area
function luma(file, fx0, fy0, fx1, fy1) {
  const p = PNG.sync.read(fs.readFileSync(file)); let s = 0, n = 0;
  const x0 = Math.round(fx0 * p.width), y0 = Math.round(fy0 * p.height), x1 = Math.round(fx1 * p.width), y1 = Math.round(fy1 * p.height);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * p.width + x) * 4; s += 0.2126 * p.data[i] + 0.7152 * p.data[i + 1] + 0.0722 * p.data[i + 2]; n++; }
  return s / n;
}
const rooms = ['hospital_entrance', 'reception', 'hallway_reception_break', 'break_room', 'hallway_break_lab', 'lab', 'hallway_lab_records', 'records_room', 'hallway_records_it', 'it_office', 'hallway_it_er', 'er', 'supply_closet'];
console.log('room                        before   after   lighting-off   (mean luma 0-255, canvas centre, HUD excluded)');
for (const r of rooms) {
  const a = luma(`${D}/${r}-before.png`, 0.06, 0.17, 0.94, 0.89), b = luma(`${D}/${r}-after.png`, 0.06, 0.17, 0.94, 0.89);
  const c = fs.existsSync(`${D}/${r}-lighting-off.png`) ? luma(`${D}/${r}-lighting-off.png`, 0.06, 0.17, 0.94, 0.89) : NaN;
  console.log(`${r.padEnd(26)} ${a.toFixed(0).padStart(6)} ${b.toFixed(0).padStart(7)} ${c.toFixed(0).padStart(10)}`);
}
