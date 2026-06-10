// Capture the new encounter UIs: dialogue portrait + PHI Sorter desk.
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });

// 1. Dialogue portrait — talk to Riley in reception
await page.goto('http://localhost:8080/?qa-room=reception&qa-no-save');
await page.waitForTimeout(5000);
await page.evaluate(() => {
  window.__QA__.commands.teleportTo(10, 4); // below Riley at (10,3)
});
await page.waitForTimeout(600);
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForTimeout(2500);
await page.screenshot({ path: 'screenshots/loop4/ui-dialogue-portrait.png' });
console.log('captured dialogue');

// 2. PHI Sorter desk — talk to Aiyana in hospital_entrance, accept the request
await page.goto('http://localhost:8080/?qa-room=hospital_entrance&qa-no-save');
await page.waitForTimeout(5000);
await page.evaluate(() => {
  window.__QA__.commands.teleportTo(10, 7); // below Aiyana at (10,6)
});
await page.waitForTimeout(600);
await page.evaluate(() => window.__QA__.commands.pressSpace());
await page.waitForTimeout(1500);
await page.screenshot({ path: 'screenshots/loop4/ui-encounter-request.png' });
// click accept if the request modal is up
const accept = page.locator('button', { hasText: /accept|help|yes|sure/i }).first();
if (await accept.count()) {
  await accept.click();
  await page.waitForTimeout(2500);
}
await page.screenshot({ path: 'screenshots/loop4/ui-sorter-desk.png' });
console.log('captured sorter');

await browser.close();
console.log('done');
