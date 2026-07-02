// Refactor gate: perceptual compare of screenshots/loop4/*.png against
// screenshots/refactor-baseline/*.png. Dependency-free — decodes PNGs on a
// canvas inside Playwright's bundled chromium. Rooms have animated particles
// and patrol NPCs, so byte-identity is impossible; we count pixels whose RGB
// distance exceeds a small per-channel threshold and fail a shot when more
// than TOLERANCE of its pixels differ. Structural breakage (missing
// furniture, wrong floor, absent HUD) blows far past that.
//
// Usage: node tests/refactor-compare.mjs [tolerancePct]
import { chromium } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASELINE = 'screenshots/refactor-baseline';
const CURRENT = 'screenshots/loop4';
const TOLERANCE = Number(process.argv[2] ?? 3.0); // % differing pixels allowed

const names = readdirSync(BASELINE).filter((f) => f.endsWith('.png'));
const browser = await chromium.launch();
const page = await browser.newPage();

let failures = 0;
for (const name of names) {
  const cur = join(CURRENT, name);
  if (!existsSync(cur)) {
    console.log(`MISSING  ${name} — not captured in current run`);
    failures++;
    continue;
  }
  const [a, b] = [join(BASELINE, name), cur].map(
    (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`,
  );
  const pct = await page.evaluate(async ([srcA, srcB]) => {
    const load = (src) =>
      new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });
    const [imgA, imgB] = await Promise.all([load(srcA), load(srcB)]);
    if (imgA.width !== imgB.width || imgA.height !== imgB.height) return 100;
    const w = imgA.width, h = imgA.height;
    const ctx = (img) => {
      const c = new OffscreenCanvas(w, h).getContext('2d');
      c.drawImage(img, 0, 0);
      return c.getImageData(0, 0, w, h).data;
    };
    const da = ctx(imgA), db = ctx(imgB);
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (
        Math.abs(da[i] - db[i]) > 24 ||
        Math.abs(da[i + 1] - db[i + 1]) > 24 ||
        Math.abs(da[i + 2] - db[i + 2]) > 24
      )
        diff++;
    }
    return (diff / (w * h)) * 100;
  }, [a, b]);
  const ok = pct <= TOLERANCE;
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${name}  ${pct.toFixed(2)}% differing`);
}

await browser.close();
console.log(failures ? `\n${failures} shot(s) over ${TOLERANCE}% — inspect before proceeding` : '\nall shots within tolerance');
process.exit(failures ? 1 : 0);
