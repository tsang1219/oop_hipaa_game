// Run 14 (ui-polish) — compose the taste-checkpoint boards from captured shots.
//   PW_CHANNEL=chrome node tests/ui-options-board.mjs
// Writes: screenshots/ui-polish/board-fonts.png (5 candidates on the same
// dialogue screen) and screenshots/ui-polish/board-titles.png (4 directions).
import { chromium } from '@playwright/test';
import fs from 'fs';

const DIR = 'screenshots/ui-polish';
const b64 = (p) => fs.existsSync(`${DIR}/${p}`) ? 'data:image/png;base64,' + fs.readFileSync(`${DIR}/${p}`).toString('base64') : null;

const BOARDS = [
  {
    out: 'board-fonts.png',
    cols: 1,
    cellW: 1280, cellH: 190,
    rows: [
      ['press-start-2p — the old wall of caps (reference)', 'font-press-start-2p.png'],
      ['pixelify sans — incumbent body font', 'font-pixelify-sans.png'],
      ['PIXEL OPERATOR — recommended (provisional default)', 'font-pixel-operator.png'],
      ['dotgothic16 — runner-up', 'font-dotgothic16.png'],
      ['vt323 — DOS-terminal flavor', 'font-vt323.png'],
    ],
  },
  {
    out: 'board-titles.png',
    cols: 2,
    cellW: 700, cellH: 550,
    rows: [
      ['A — NIGHT SHIFT (recommended, provisional default)', 'title-a.png'],
      ['B — CAST LINEUP  (?title=b)', 'title-b.png'],
      ['C — CORKBOARD  (?title=c)', 'title-c.png'],
      ['CLASSIC — the old starfield  (?title=classic)', 'title-classic.png'],
    ],
  },
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
await page.setContent('<canvas id="c"></canvas>');
for (const board of BOARDS) {
  const cells = board.rows.map(([label, file]) => [label, b64(file)]);
  const data = await page.evaluate(async ([cells, cols, CW, CH]) => {
    const c = document.getElementById('c');
    const rows = Math.ceil(cells.length / cols);
    c.width = cols * (CW + 8) + 8;
    c.height = rows * (CH + 34) + 8;
    const g = c.getContext('2d');
    g.fillStyle = '#111118'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < cells.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = 8 + col * (CW + 8), y = 8 + row * (CH + 34);
      g.fillStyle = '#ffd166'; g.font = 'bold 15px monospace'; g.textAlign = 'left';
      g.fillText(cells[i][0], x + 2, y + 18);
      if (!cells[i][1]) { g.fillStyle = '#2a2a36'; g.fillRect(x, y + 26, CW, CH); continue; }
      const img = new Image(); img.src = cells[i][1]; await img.decode();
      const scale = Math.min(CW / img.width, CH / img.height);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(img, x, y + 26, img.width * scale, img.height * scale);
    }
    return c.toDataURL('image/png').split(',')[1];
  }, [cells, board.cols, board.cellW, board.cellH]);
  fs.writeFileSync(`${DIR}/${board.out}`, Buffer.from(data, 'base64'));
  console.log(`wrote ${board.out}`);
}
await browser.close();
