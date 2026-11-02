// Captures the new Stage 3 screens by using them. Web build under software GL, so this is
// design and logic evidence, never iOS evidence and never a frame rate.
// usage: node scripts/web-stage3.mjs <outDir>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? 'http://localhost:8099';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
const id = (t) => page.getByTestId(t);
const shot = async (name, settle = 2500) => { await page.waitForTimeout(settle); await page.screenshot({ path: path.join(out, `${name}.png`) }); console.log(name); };
const go = async (route) => { await page.goto(`${base}/${route}${route.includes('?') ? '&' : '?'}demo=1`, { waitUntil: 'load', timeout: 120000 }); };
const pinch = async (fromGap, toGap, x = 196, y = 420) => {
  const cdp = await ctx.newCDPSession(page);
  const points = (g) => [{ x: x - g / 2, y, id: 1 }, { x: x + g / 2, y, id: 2 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(fromGap) });
  for (let i = 1; i <= 20; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(fromGap + ((toGap - fromGap) * i) / 20) }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

// ---- Solar System ----
await go('solar-system');
await id('solar-canvas').waitFor({ timeout: 60000 });
await page.waitForFunction(() => globalThis.__solarProbe?.camera(), null, { timeout: 60000 });
await shot('solar-01-overview-illustrative', 7000);
await page.getByRole('tab', { name: 'True scale' }).click();
await shot('solar-02-overview-true-scale');
await page.getByRole('tab', { name: 'Illustrative' }).click();
await page.waitForTimeout(800);
const at = await page.evaluate(() => globalThis.__solarProbe.point('saturn'));
await id('solar-canvas').click({ position: { x: at.x, y: at.y } });
await shot('solar-03-selected-saturn', 1500);
await id('solar-options').click();
await shot('solar-04-options', 500);
await id('solar-options').click();
await id('solar-deselect').click();
for (const [body, n] of [['sun', '05'], ['mercury', '06'], ['venus', '07'], ['earth', '08'], ['mars', '09'], ['jupiter', '10'], ['saturn', '11'], ['uranus', '12'], ['neptune', '13']]) {
  await id(`solar-go-${body}`).scrollIntoViewIfNeeded();
  await id(`solar-go-${body}`).click();
  await page.waitForFunction((b) => globalThis.__solarProbe.scene().focus === b, body, { timeout: 15000 });
  await shot(`solar-${n}-${body}`, 4500);
  await id('solar-overview').click();
  await page.waitForTimeout(600);
}
await go('solar-system?focus=moon');
await page.waitForFunction(() => globalThis.__solarProbe?.scene().focus === 'moon', null, { timeout: 40000 });
await shot('solar-14-moon-true-scale', 5000);
await go('solar-system?focus=io');
await page.waitForFunction(() => globalThis.__solarProbe?.scene().focus === 'io', null, { timeout: 40000 });
await shot('solar-15-io', 5000);
await go('solar-system?focus=jupiter');
await page.waitForFunction(() => globalThis.__solarProbe?.scene().focus === 'jupiter', null, { timeout: 40000 });
await page.waitForTimeout(3000);
await pinch(240, 60);
await shot('solar-16-jupiter-moon-orbits', 2000);
await go('solar-system');
await id('solar-canvas').waitFor();
await page.waitForFunction(() => globalThis.__solarProbe?.camera(), null, { timeout: 40000 });
await page.waitForTimeout(3000);
await id('solar-speed').click();
await id('solar-speed').click();
await id('solar-play').click();
await shot('solar-17-time-running', 2000);
await id('solar-play').click();

// ---- Moon Atlas ----
await go('moon-atlas');
await id('moon-canvas').waitFor({ timeout: 60000 });
await page.waitForFunction(() => globalThis.__moonProbe?.camera(), null, { timeout: 60000 });
await shot('moon-01-earth-view-true-phase', 8000);
await id('moon-search').click();
await id('moon-search-input').fill('mare');
await shot('moon-02-search', 800);
await id('moon-search-input').fill('tycho');
await page.waitForTimeout(500);
await id('moon-result-Tycho').click();
await shot('moon-03-tycho-selected', 5000);
await id('moon-deselect').click();
await id('moon-earth-view').click();
await page.waitForTimeout(500);
await id('moon-layers').click();
await id('moon-elevation').click();
await shot('moon-04-layers-elevation', 2500);
await id('moon-elevation').click();
await id('moon-fulllight').click();
await id('moon-layers').click();
await shot('moon-05-full-light', 2000);
await id('moon-layers').click();
await id('moon-fulllight').click();
await id('moon-layers').click();
await id('moon-search').click();
await id('moon-search-input').fill('copernicus');
await page.waitForTimeout(500);
await id('moon-result-Copernicus').click();
await shot('moon-06-terminator-relief', 5000);
await id('moon-deselect').click();
await id('moon-search').click();
await id('moon-search-input').fill('orientale');
await page.waitForTimeout(500);
await page.locator('[data-testid="moon-result-Mare Orientale"]').click();
await shot('moon-07-far-limb', 4500);
await id('moon-deselect').click();
for (let i = 0; i < 10; i++) await id('moon-day-forward').click();
await id('moon-earth-view').click();
await shot('moon-08-ten-days-later', 2500);

console.log(`errors: ${errors.length}`);
for (const e of errors.slice(0, 8)) console.log(e);
await browser.close();
process.exit(errors.length ? 1 : 0);
