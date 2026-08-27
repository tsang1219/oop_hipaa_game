// Run 11 (art audit) — compare manifest frames with the located LimeZu singles (scripts/art/singles/*.json).
//   node scripts/art/frames-vs-singles.mjs [--only names.txt] [--apply]
// Per frame: which singles its opaque pixels fall into. Verdicts:
//   exact      one single, the frame holds ≥95% of it and ≥95% of the frame's pixels are that single → tighten
//   cut        one single but the frame holds <95% of it → the object continues past the rect → use the single
//   composite  pixels from ≥2 singles → decide by hand (a counter built from parts, a stack, an intruder)
//   no-single  the sheet has no singles index (generic, classroom) or nothing matched
// --apply rewrites `exact` and `cut` frames to the single's tight bbox as `px` rects (with `_single`).
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
const only = opt('--only', null) ? new Set(fs.readFileSync(opt('--only'), 'utf8').split('\n').map(l => l.trim().split(/\s+/)[0]).filter(Boolean)) : null;
const sheets = new Map(), singles = new Map();
const sheet = (id) => { if (!sheets.has(id)) sheets.set(id, PNG.sync.read(fs.readFileSync(path.join(manifest.vendor, manifest.sheets[id])))); return sheets.get(id); };
const singlesOf = (id) => { if (!singles.has(id)) { const f = `scripts/art/singles/${id}.json`; singles.set(id, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).objects : null); } return singles.get(id); };
const alpha = (png, x, y) => (x < 0 || y < 0 || x >= png.width || y >= png.height) ? 0 : png.data[(y * png.width + x) * 4 + 3];
const SKIP = /^(floor|wall|trim|shadow|anim|door)\./;
const verdicts = { exact: [], cut: [], composite: [], none: [] };
for (const [name, f] of Object.entries(manifest.frames)) {
  if (SKIP.test(name) || f.split) continue;
  if (only && !only.has(name)) continue;
  const png = sheet(f.sheet); const objs = singlesOf(f.sheet);
  let x, y, w, h; if (f.px) [x, y, w, h] = f.px; else { const [tx, ty, tw, th] = f.t; x = tx * TILE; y = ty * TILE; w = tw * TILE; h = th * TILE; }
  if (!objs) { verdicts.none.push({ name, why: 'no singles for sheet ' + f.sheet }); continue; }
  // opaque pixels of the frame → which single bbox contains them (singles may overlap; count all)
  const hits = new Map(); let opaque = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!alpha(png, x + i, y + j)) continue; opaque++;
    for (const o of objs) { const [bx, by, bw, bh] = o.bbox; if (x + i >= bx && x + i < bx + bw && y + j >= by && y + j < by + bh) hits.set(o.n, (hits.get(o.n) ?? 0) + 1); }
  }
  if (!opaque) { verdicts.none.push({ name, why: 'empty' }); continue; }
  const ranked = [...hits.entries()].map(([n, c]) => { const o = objs.find(q => q.n === n); const [bx, by, bw, bh] = o.bbox; let op = 0; for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) if (alpha(png, bx + i, by + j)) op++; return { n, inFrame: c / opaque, ofSingle: c / op, bbox: o.bbox, file: o.file }; }).sort((a, b) => b.inFrame - a.inFrame);
  if (!ranked.length) { verdicts.none.push({ name, why: 'no single overlaps' }); continue; }
  const top = ranked[0];
  const others = ranked.slice(1).filter(r => r.inFrame >= 0.03);
  const rec = { name, sheet: f.sheet, rect: [x, y, w, h], top, others };
  if (others.length) verdicts.composite.push(rec);
  else if (top.inFrame >= 0.95 && top.ofSingle >= 0.95) verdicts.exact.push(rec);
  else if (top.inFrame >= 0.95) verdicts.cut.push(rec);
  else verdicts.composite.push(rec);
}
const fmtS = (s) => `#${s.n} [${s.bbox.join(',')}] ${(s.inFrame * 100).toFixed(0)}% of frame / ${(s.ofSingle * 100).toFixed(0)}% of single`;
for (const [k, list] of Object.entries(verdicts)) {
  console.log(`\n── ${k} (${list.length}) ──`);
  for (const r of list) console.log(r.top ? `${r.name.padEnd(30)} ${r.sheet.padEnd(10)} rect [${r.rect.join(',')}] → ${fmtS(r.top)}${r.others?.length ? '  +' + r.others.map(fmtS).join(' +') : ''}` : `${r.name.padEnd(30)} ${r.why}`);
}
if (apply) {
  let n = 0;
  for (const r of [...verdicts.exact, ...verdicts.cut]) { const f = manifest.frames[r.name]; f._was = f._was ?? (f.px ? { px: f.px } : { t: f.t }); delete f.t; f.px = r.top.bbox; f._single = `${r.sheet}#${r.top.n}`; n++; }
  fs.writeFileSync(P, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\napplied ${n} single-derived rects`);
}
