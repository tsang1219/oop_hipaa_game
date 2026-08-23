// Run 11 — dump what the atlas renderer drew (window.__QA__.art) + any [art] warnings.
import { chromium } from '@playwright/test';
const room = process.argv[2] || 'reception';
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
const logs = [];
page.on('console', m => { if (/\[art\]|error|warn/i.test(m.text()) || m.type() === 'error') logs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', e => logs.push(`PAGEERROR: ${e.message}`));
await page.goto(`http://localhost:8080/?qa-room=${room}&qa-no-save&qa_no_encounter=1`);
await page.waitForFunction(r => window.__QA__?.currentRoomId === r, room, { timeout: 30000 });
await page.waitForTimeout(800);
const art = await page.evaluate(() => window.__QA__?.art ?? null);
const imgs = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /\.(png|jpg|json)$/.test(e.name)).map(e => e.name.split('/').slice(-2).join('/')));
console.log(JSON.stringify({ room, art: art && { ...art, props: art.props.length, propList: art.props.map(p => `${p.type}@${p.x},${p.y}->${p.frame} d${p.depth}`) }, imageRequests: imgs.length, images: imgs }, null, 1));
console.log('logs:', logs.length ? '\n' + logs.join('\n') : 'none');
await browser.close();
