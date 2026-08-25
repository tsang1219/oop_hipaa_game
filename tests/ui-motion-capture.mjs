// Run 14 (ui-polish) — UI-04 proof: film-strip of an overlay opening and closing.
//   BASE_URL=http://localhost:8090 PW_CHANNEL=chrome node tests/ui-motion-capture.mjs [feedback|codex]
// Uses CDP screencast (~60fps) to catch the 180ms enter / 150ms exit, then lays the
// frames out as a labeled strip: screenshots/ui-polish/motion-<name>-open|close.png
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:8080';
const which = process.argv[2] || 'feedback';
const OUT = 'screenshots/ui-polish';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`); });

await page.goto(`${BASE}/?qa-room=reception&qa-no-save&qa_no_encounter=1`);
await page.waitForFunction(() => window.__QA__?.currentRoomId === 'reception', null, { timeout: 30000 });
await page.waitForTimeout(3200);

const cdp = await page.context().newCDPSession(page);
let frames = [];
let recording = false;
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  if (recording) frames.push({ data, t: metadata.timestamp * 1000 });
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

async function record(label, trigger) {
  frames = [];
  recording = true;
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  await page.waitForTimeout(150); // settle a baseline frame
  const t0 = Date.now();
  await trigger();
  await page.waitForTimeout(700);
  recording = false;
  await cdp.send('Page.stopScreencast');
  return { label, frames: [...frames], t0 };
}

const scenarios = {
  feedback: {
    open: () => page.locator('[data-testid="feedback-button"]').click(),
    close: () => page.keyboard.press('Escape'),
    settle: () => page.waitForSelector('[data-testid="feedback-modal"]', { timeout: 5000 }),
  },
  codex: {
    open: () => page.keyboard.press('i'),
    close: () => page.keyboard.press('Escape'),
    settle: () => page.waitForSelector('[data-testid="phi18-codex"]', { timeout: 5000 }),
  },
};
const sc = scenarios[which];

const opened = await record(`${which}-open`, sc.open);
await sc.settle();
await page.waitForTimeout(600);
const closed = await record(`${which}-close`, sc.close);
await browser.close();

// Compose strips in a headless canvas (same trick as scripts/art/grid.mjs).
const composer = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const cpage = await composer.newPage({ viewport: { width: 200, height: 200 } });
await cpage.setContent('<canvas id="c"></canvas>');
for (const rec of [opened, closed]) {
  if (rec.frames.length === 0) { console.log(`!! no frames for ${rec.label}`); continue; }
  // Anchor on the trigger: one baseline frame before it, then everything up
  // to ~500ms after, so the enter/exit window is always inside the strip.
  const tTrig = rec.t0;
  const around = rec.frames.filter(f => f.t >= tTrig - 80 && f.t <= tTrig + 520);
  const rel = (around.length >= 4 ? around : rec.frames).map(f => ({ ...f, dt: Math.round(f.t - tTrig) }));
  const strip = rel.slice(0, 14);
  const CW = 350, CH = 275; // 1/4 of viewport
  const data = await cpage.evaluate(async ([cells, CW, CH]) => {
    const c = document.getElementById('c');
    const cols = Math.min(cells.length, 7);
    const rows = Math.ceil(cells.length / cols);
    c.width = cols * (CW + 6) + 6; c.height = rows * (CH + 26) + 6;
    const g = c.getContext('2d');
    g.fillStyle = '#111118'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < cells.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = 6 + col * (CW + 6), y = 6 + row * (CH + 26);
      const img = new Image(); img.src = 'data:image/png;base64,' + cells[i].data; await img.decode();
      g.drawImage(img, x, y, CW, CH);
      g.fillStyle = '#ffd166'; g.font = 'bold 13px monospace'; g.textAlign = 'left';
      const dt = Math.round(cells[i].dt);
      g.fillText(`${dt >= 0 ? '+' : ''}${dt}ms`, x + 4, y + CH + 17);
    }
    return c.toDataURL('image/png').split(',')[1];
  }, [strip, CW, CH]);
  fs.writeFileSync(`${OUT}/motion-${rec.label}.png`, Buffer.from(data, 'base64'));
  console.log(`wrote motion-${rec.label}.png (${strip.length} frames, span ${Math.round(strip[strip.length - 1].dt)}ms)`);
}
await composer.close();
const real = errors.filter(e => !/favicon|404|net::ERR|ResizeObserver|WebAudio|WebSocket/.test(e));
console.log(real.length ? `ERRORS:\n${real.join('\n')}` : 'console clean');
