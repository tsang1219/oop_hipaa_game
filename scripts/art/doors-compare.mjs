// Run 11 (doors) — side-by-side of the door close-ups from tests/art-doors-capture.mjs:
//   node scripts/art/doors-compare.mjs before after   → screenshots/art-substrate/doors-before-vs-after.png
// One row per door case that exists in BOTH suffixes; columns = closed | ajar | after SPACE, twice.
import { chromium } from '@playwright/test';
import fs from 'fs';
const DIR = 'screenshots/art-substrate';
const [a = 'before', b = 'after'] = process.argv.slice(2);
const PHASES = ['closed', 'ajar', /^(opening|rattle)$/];
const files = fs.readdirSync(DIR);
const caseOf = (f, suf) => { const m = f.match(new RegExp(`^doors-${suf}-(.+)-(closed|ajar|opening|rattle)\\.png$`)); return m ? { tag: m[1], phase: m[2] } : null; };
const tagsA = new Set(files.map(f => caseOf(f, a)).filter(Boolean).map(c => c.tag));
const tags = [...new Set(files.map(f => caseOf(f, b)).filter(Boolean).map(c => c.tag))].filter(t => tagsA.has(t));
const pick = (suf, tag, phase) => {
  const f = files.find(f => { const c = caseOf(f, suf); return c && c.tag === tag && (phase instanceof RegExp ? phase.test(c.phase) : c.phase === phase); });
  return f ? { phase: caseOf(f, suf).phase, uri: 'data:image/png;base64,' + fs.readFileSync(`${DIR}/${f}`).toString('base64') } : null;
};
const rows = tags.map(tag => ({ tag, cells: [a, b].map(suf => PHASES.map(p => pick(suf, tag, p))) }));
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent('<canvas id="c"></canvas>');
const data = await page.evaluate(async ([rows, a, b]) => {
  const CW = 240, CH = 192, ML = 8, MT = 30, GAP = 4, GROUP = 18, LABEL = 16;
  const c = document.getElementById('c');
  c.width = ML + 2 * (3 * (CW + GAP)) + GROUP; c.height = MT + rows.length * (CH + LABEL + GAP);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#111118'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#ffd166'; g.font = 'bold 14px monospace'; g.textAlign = 'left';
  g.fillText(`${a.toUpperCase()}  — closed | ajar on approach | after SPACE`, ML, 20);
  g.fillText(`${b.toUpperCase()}  — closed | ajar on approach | after SPACE`, ML + 3 * (CW + GAP) + GROUP, 20);
  for (let r = 0; r < rows.length; r++) {
    const y = MT + r * (CH + LABEL + GAP);
    g.fillStyle = '#e8e8f0'; g.font = 'bold 11px monospace'; g.fillText(rows[r].tag, ML, y + 12);
    for (let s = 0; s < 2; s++) for (let i = 0; i < 3; i++) {
      const cell = rows[r].cells[s][i]; const x = ML + s * (3 * (CW + GAP) + GROUP) + i * (CW + GAP);
      if (!cell) { g.fillStyle = '#2a2a36'; g.fillRect(x, y + LABEL, CW, CH); continue; }
      const img = new Image(); img.src = cell.uri; await img.decode();
      g.drawImage(img, x, y + LABEL, CW, CH);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, y + LABEL, 58, 13);
      g.fillStyle = '#ffd166'; g.font = '10px monospace'; g.fillText(cell.phase, x + 3, y + LABEL + 10);
    }
  }
  return c.toDataURL('image/png');
}, [rows, a, b]);
const out = `${DIR}/doors-${a}-vs-${b}.png`;
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
console.log(`${rows.length} door cases -> ${out}`);
