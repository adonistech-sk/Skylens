// Captures the new Stage 2 panel states and object interactions by using the app. Web
// build, so this is design and logic evidence, never iOS evidence.
// usage: node scripts/web-stage2.mjs <outDir>
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
const settle = (ms = 1200) => page.waitForTimeout(ms);

await page.goto(`${base}/sky?demo=1`, { waitUntil: 'load', timeout: 180000 });
await id('sheet-handle').waitFor({ state: 'visible', timeout: 90000 });
await settle(8000);
await shot('01_panel_collapsed');

await id('sheet-handle').click();
await settle(2600);
await shot('02_panel_half');

await id('sheet-grabber').click();
await settle(3500);
await shot('03_panel_full');

await id('sheet-search').fill('HIP 87937');
await settle(1800);
await shot('04_search_deep_star');
await id('sheet-search').fill('orion');
await settle(900);
await shot('05_search_orion');
await id('chip-Deep Sky').click();
await settle(700);
await shot('06_search_category');
await id('chip-All').click();

await id('sheet-search').fill('HIP 87937');
await settle(1200);
await page.getByTestId("result-Barnard's Star").click();
await settle(2800);
await shot('07_pick_faint_star_card');
await id('sky-show-atlas').click();
await settle(3500);
await shot('08_faint_star_in_atlas');
await id('sky-deselect').click();
await id('segment-explore').click();
await settle(1000);

await page.reload({ waitUntil: 'load' });
await id('sheet-handle').waitFor({ state: 'visible', timeout: 90000 });
await settle(7000);

// Long press Rigel with a real held press.
const box = await id('sky-canvas').boundingBox();
await page.mouse.move(box.x + 284, box.y + 493);
await page.mouse.down();
await page.waitForTimeout(620);
await page.mouse.up();
await settle(700);
await shot('09_long_press_menu');
await id('sky-menu-Rigel').click();
await settle(1000);
await shot('10_selection_card');
await id('sky-add-list').click();
await settle(500);
await id('list-new-name').fill('Winter targets');
await id('list-create').click();
await settle(500);
await shot('11_add_to_list');
await id('list-done').click();
await settle(400);

// A constellation, chosen by its name on the sky.
await id('sky-deselect').click();
await settle(400);
await page.mouse.click(box.x + 125, box.y + 421);
await settle(2500);
await shot('12_constellation_selected');
await id('sky-deselect').click();

// Off screen, with directions.
await page.getByTestId('sky-canvas').click({ position: { x: 284, y: 493 } });
await settle(600);
for (let i = 0; i < 2; i++) {
  await page.mouse.move(120, 300);
  await page.mouse.down();
  await page.mouse.move(380, 300, { steps: 10 });
  await page.mouse.up();
  await settle(2200);
}
await settle(600);
await shot('13_offscreen_guide');
await id('sky-selection').click();
await settle(2500);
await id('find-in-sky').waitFor({ state: 'visible', timeout: 15000 });
await settle(800);
await shot('14_detail_star_overview');
await page.getByRole('tab', { name: 'Observing' }).click();
await settle(1800);
await shot('15_detail_star_observing');
await page.getByRole('tab', { name: 'Details' }).click();
await settle(1200);
await shot('16_detail_star_details');

for (const [route, name, tab] of [['object/body:saturn', '17_detail_planet', 'Details'], ['object/con:Ori', '18_detail_constellation', 'Details'], ['object/dso:M31', '19_detail_galaxy_observing', 'Observing'], ['object/star:87937', '20_detail_pack_star', 'Details']]) {
  await page.goto(`${base}/${route}?demo=1`, { waitUntil: 'load', timeout: 180000 });
  await id('find-in-sky').waitFor({ state: 'visible', timeout: 30000 });
  await settle(2500);
  await page.getByRole('tab', { name: tab }).click();
  await settle(1800);
  await shot(name);
}

console.log(errors.length ? `console errors: ${JSON.stringify(errors.slice(0, 6))}` : 'console clean');
await browser.close();
