// Captures the Stage 1 sky states by using the app as a person would. Web build, so this is
// design and logic evidence, never iOS evidence.
// usage: node scripts/web-states.mjs <outDir>
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
const shot = (name) => page.screenshot({ path: path.join(out, `${name}.png`) });
const settle = (ms = 1800) => page.waitForTimeout(ms);
const client = await ctx.newCDPSession(page);

/** Two real touch points, so React Native Gesture Handler sees an actual pinch. */
async function pinch(cx, cy, from, to, steps = 50) {
  const points = (d) => [{ x: cx - d / 2, y: cy }, { x: cx + d / 2, y: cy }];
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(from) });
  for (let i = 1; i <= steps; i++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(from + ((to - from) * i) / steps) });
    await page.waitForTimeout(16);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

await page.goto(`${base}/sky?demo=1`, { waitUntil: 'load', timeout: 180000 });
await id('sky-more').waitFor({ state: 'visible', timeout: 90000 });
await settle(9000);
await shot('explore_default');

await id('segment-observe').click();
await settle();
await shot('observe');

await id('segment-atlas').click();
await settle();
await shot('atlas_wide');

await id('sky-layers').click();
await settle(900);
await shot('layers_atlas');
await page.getByRole('switch', { name: 'Galactic' }).click();
await page.getByRole('switch', { name: 'Ecliptic' }).click();
await settle(900);
await id('sky-layers').click();
await settle(1200);
await shot('atlas_grids');
await id('sky-layers').click();
await settle(600);
await page.getByRole('switch', { name: 'Galactic' }).click();
await page.getByRole('switch', { name: 'Ecliptic' }).click();
await id('sky-layers').click();

// Zoom on Orion's sword, past the bundled stars, so the deep pack has to load.
await pinch(196, 400, 60, 340);
await settle(1500);
await pinch(196, 400, 60, 240);
await settle(5000);
await shot('atlas_zoom_deep');

await id('sky-layers').click();
await settle(2400);
const diagnostics = await id('sky-layers-panel').innerText();
console.log(diagnostics.split('\n').filter((l) => /Frame JS|Stars drawn|Deep pack/.test(l)).join('\n'));
await id('sky-layers').click();

await page.reload({ waitUntil: 'load' });
await id('sky-more').waitFor({ state: 'visible', timeout: 90000 });
await settle(7000);
await page.getByTestId('sky-canvas').click({ position: { x: 284, y: 493 } });
await id('sky-selection').waitFor({ state: 'visible', timeout: 15000 });
await settle(900);
await shot('selected_rigel');

// Turn the view until the selection is off screen, so the guide has to appear.
await page.mouse.move(120, 300);
await page.mouse.down();
await page.mouse.move(380, 300, { steps: 10 });
await page.mouse.up();
await settle(2600);
await page.mouse.move(120, 300);
await page.mouse.down();
await page.mouse.move(380, 300, { steps: 10 });
await page.mouse.up();
await settle(2600);
await shot('selected_offscreen_guide');

console.log(errors.length ? `console errors: ${JSON.stringify(errors.slice(0, 5))}` : 'console clean');
await browser.close();
