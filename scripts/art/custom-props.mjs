// Run 11 (art audit) — the few props LimeZu Modern Interiors does not have, painted in its palette.
//   node scripts/art/custom-props.mjs   → attached_assets/art-src/custom_props_32x32.png (+ .json index)
// Palette sampled from the pack (outline #3a3a50, shade #46465e/#565972, whites #ebe4f2/#e8dff1,
// grays #d8d0e0/#b8b5cb, blues #50a7e8/#90c7de/#374fa6, base shadow #a79796). Objects sit on a 16 px
// grid like LimeZu's singles; the manifest slices them by pixel rect (sheet id `custom`).
import fs from 'fs';
import { createRequire } from 'module';
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');

const W = 64, H = 64;
const png = new PNG({ width: W, height: H });
png.data.fill(0);
const C = {
  outline: [0x3a, 0x3a, 0x50], shade: [0x46, 0x46, 0x5e], shade2: [0x56, 0x59, 0x72],
  white: [0xeb, 0xe4, 0xf2], white2: [0xe8, 0xdf, 0xf1], gray: [0xd8, 0xd0, 0xe0], gray2: [0xb8, 0xb5, 0xcb], gray3: [0x8b, 0x8b, 0xab],
  blue: [0x50, 0xa7, 0xe8], blueLight: [0x90, 0xc7, 0xde], blueDeep: [0x37, 0x4f, 0xa6], bluePale: [0xc9, 0xda, 0xff],
  red: [0xe0, 0x4a, 0x4a], base: [0xa7, 0x97, 0x96],
};
const put = (x, y, c, a = 255) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; png.data[i] = c[0]; png.data[i + 1] = c[1]; png.data[i + 2] = c[2]; png.data[i + 3] = a; };
const rect = (x, y, w, h, c, a) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c, a); };
const hline = (x, y, w, c) => rect(x, y, w, 1, c);
const vline = (x, y, h, c) => rect(x, y, 1, h, c);

// ── prop.watercooler — 32×52, a floor-standing cooler with a 5-gallon bottle ──────────────────
{
  const ox = 0, oy = 0;
  // base shadow (LimeZu props carry a soft dark base line)
  rect(ox + 6, oy + 49, 22, 3, C.base);
  hline(ox + 7, oy + 51, 20, C.shade2);
  // body: 20 wide, rows 20..49
  rect(ox + 6, oy + 20, 22, 30, C.outline);
  rect(ox + 7, oy + 21, 20, 28, C.white);
  vline(ox + 7, oy + 21, 28, C.white2);
  rect(ox + 24, oy + 21, 3, 28, C.gray);      // right-side shade
  vline(ox + 26, oy + 21, 28, C.gray2);
  hline(ox + 7, oy + 21, 20, C.bluePale);      // top edge catch-light
  // dispensing recess with hot/cold taps and a drip tray
  rect(ox + 10, oy + 25, 14, 9, C.outline);
  rect(ox + 11, oy + 26, 12, 7, C.shade);
  rect(ox + 12, oy + 27, 10, 5, C.shade2);
  rect(ox + 13, oy + 28, 2, 2, C.red);  rect(ox + 19, oy + 28, 2, 2, C.blue);
  vline(ox + 14, oy + 30, 2, C.outline); vline(ox + 20, oy + 30, 2, C.outline);
  rect(ox + 11, oy + 34, 12, 2, C.gray2);      // tray lip
  hline(ox + 11, oy + 34, 12, C.gray3);
  // lower door seam + vent
  hline(ox + 9, oy + 40, 16, C.gray2);
  for (let k = 0; k < 3; k++) hline(ox + 10, oy + 43 + k * 2, 14, C.gray2);
  // neck collar
  rect(ox + 12, oy + 17, 10, 4, C.outline);
  rect(ox + 13, oy + 18, 8, 2, C.gray);
  // bottle: rows 2..17, rounded
  const rows = [[11, 12], [9, 16], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [9, 16], [10, 14], [11, 12]];
  rows.forEach(([x0, w], k) => rect(ox + x0, oy + 2 + k, w, 1, C.outline));
  rows.forEach(([x0, w], k) => { if (k > 0 && k < rows.length - 1) rect(ox + x0 + 1, oy + 2 + k, w - 2, 1, C.blueLight); });
  rect(ox + 9, oy + 9, 14, 8, C.blue);          // water
  rect(ox + 9, oy + 15, 14, 2, C.blueDeep);
  rect(ox + 10, oy + 4, 2, 8, C.bluePale);      // highlight
  put(ox + 12, oy + 3, C.bluePale); put(ox + 10, oy + 12, C.blueLight);
}

fs.mkdirSync('attached_assets/art-src', { recursive: true });
fs.writeFileSync('attached_assets/art-src/custom_props_32x32.png', PNG.sync.write(png));
fs.writeFileSync('attached_assets/art-src/custom_props_32x32.json', JSON.stringify({ 'prop.watercooler': [0, 0, 32, 52] }, null, 1));
console.log('wrote attached_assets/art-src/custom_props_32x32.png');
