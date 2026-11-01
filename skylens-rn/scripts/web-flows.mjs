// Drives the real flows in the web build. It proves the app logic and navigation, not
// iOS: the same journeys run on the Simulator through Maestro in rn-ios.yml.
// usage: node scripts/web-flows.mjs <outDir>
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
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const results = [];
const flow = async (name, fn) => {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  try {
    await fn(page);
    if (errors.length) throw new Error(errors[0]);
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, String(e).slice(0, 260)]);
    await page.screenshot({ path: path.join(out, `fail-${name.replace(/\W+/g, '_')}.png`) }).catch(() => {});
  }
  await page.close();
};
const open = (page, route, demo = true) => page.goto(`${base}/${route}${demo ? '?demo=1' : ''}`, { waitUntil: 'load', timeout: 120000 });
const id = (page, testId) => page.getByTestId(testId);
const text = (page, t) => page.getByText(t, { exact: false }).first();
const visible = (l, timeout = 20000) => l.waitFor({ state: 'visible', timeout });

await flow('search Andromeda, open detail, Find in Sky selects it', async (p) => {
  await open(p, 'sky');
  await visible(id(p, 'sky-search'));
  await id(p, 'sky-search').click();
  await id(p, 'search-input').fill('Andromeda');
  await visible(id(p, 'result-Andromeda Galaxy'));
  await id(p, 'result-Andromeda Galaxy').click();
  await visible(text(p, 'Spiral Galaxy'));
  await visible(text(p, '3.0° × 1.1°'));
  await id(p, 'find-in-sky').click();
  await visible(id(p, 'sky-selection'));
  await visible(text(p, 'Andromeda Galaxy'));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(out, 'find-in-sky.png') });
});

const skyPixels = async (p) => (await id(p, 'sky-canvas').screenshot()).toString('base64');

await flow('the sky pans with a drag and comes to rest', async (p) => {
  await open(p, 'sky');
  await visible(id(p, 'sky-more'));
  await p.waitForTimeout(9000);
  const before = await skyPixels(p);
  await p.mouse.move(200, 420);
  await p.mouse.down();
  await p.mouse.move(120, 380, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(2500);
  const after = await skyPixels(p);
  if (before === after) throw new Error('the sky did not move');
  await p.screenshot({ path: path.join(out, 'sky-panned.png') });
});

await flow('tapping a star selects it, and its card opens the detail page', async (p) => {
  await open(p, 'sky');
  await visible(id(p, 'sky-more'));
  await p.waitForTimeout(9000);
  await id(p, 'sky-canvas').click({ position: { x: 284, y: 493 } }); // Rigel in the demo view.
  await visible(id(p, 'sky-selection'));
  await visible(text(p, 'Rigel'));
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(out, 'sky-selected-rigel.png') });
  await id(p, 'sky-selection').click();
  await visible(id(p, 'find-in-sky'));
});

await flow('the layer panel changes the sky, including the framing landscape', async (p) => {
  await open(p, 'sky');
  await visible(id(p, 'sky-more'));
  await p.waitForTimeout(9000);
  const before = await skyPixels(p);
  await id(p, 'sky-layers').click();
  await visible(text(p, 'Landscape framing (artistic)'));
  await p.getByRole('switch', { name: 'Landscape framing (artistic)' }).click();
  await p.getByRole('switch', { name: 'Orion artwork' }).click();
  await id(p, 'sky-layers').click();
  await p.waitForTimeout(2000);
  if (before === await skyPixels(p)) throw new Error('layers did not change the sky');
  await p.screenshot({ path: path.join(out, 'sky-layers-off.png') });
});

await flow('daytime sky offers a labelled night preview without moving the clock', async (p) => {
  await open(p, 'time-travel');
  await visible(id(p, 'tt-forward'));
  for (let i = 0; i < 16; i++) await id(p, 'tt-forward').click();
  await visible(text(p, '13:25'));
  await id(p, 'tt-close').click();
  await visible(id(p, 'sky-night-preview'), 30000);
  await visible(text(p, 'Daytime sky'));
  await p.waitForTimeout(3000);
  await p.screenshot({ path: path.join(out, 'sky-daytime.png') });
  await id(p, 'sky-night-preview').click();
  await visible(text(p, 'Night preview'));
  await p.waitForTimeout(3000);
  await p.screenshot({ path: path.join(out, 'sky-night-preview.png') });
  await id(p, 'sky-time').click();
  await visible(text(p, '13:25'));
});

await flow('a typo still finds the star', async (p) => {
  await open(p, 'search');
  await id(p, 'search-input').fill('betelguese');
  await visible(id(p, 'result-Betelgeuse'));
});

await flow('Time Travel: forward, play, pause, Now', async (p) => {
  await open(p, 'time-travel');
  await visible(text(p, 'Sun, Jan 17, 2027'));
  await visible(text(p, '21:25'));
  await id(p, 'tt-forward').click();
  await visible(text(p, '22:25'));
  await id(p, 'tt-speed').click();
  await id(p, 'tt-speed').click();
  await visible(text(p, '1,000×'));
  await id(p, 'tt-play').click();
  await p.waitForTimeout(2500);
  await id(p, 'tt-play').click();
  const body = await p.locator('body').innerText();
  if (body.includes('22:25')) throw new Error('clock did not move while playing');
  await id(p, 'tt-now').click();
  await visible(text(p, '21:25'));
});

await flow('choosing Sydney changes Tonight', async (p) => {
  await open(p, 'tonight');
  await visible(text(p, 'Bratislava'));
  await visible(text(p, 'Best to See Tonight'), 30000);
  const before = await p.locator('body').innerText();
  await id(p, 'tab-More').click();
  await id(p, 'more-location').click();
  await id(p, 'choose-manually').click();
  await id(p, 'city-input').fill('Sydney');
  await id(p, 'city-Sydney').click();
  await p.waitForTimeout(800);
  await p.evaluate(() => { window.history.pushState({}, '', '/tonight?demo=1'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await visible(text(p, 'Sydney'));
  await p.waitForTimeout(3000);
  const after = await p.locator('body').innerText();
  if (before === after) throw new Error('Tonight did not change');
  if (!/Sunset/.test(after)) throw new Error('Tonight did not render');
  await p.screenshot({ path: path.join(out, 'tonight-sydney.png') });
});

await flow('favorite appears in More', async (p) => {
  await open(p, 'object/dso:M42');
  await visible(id(p, 'detail-star'));
  await id(p, 'detail-star').click();
  await p.evaluate(() => { window.history.pushState({}, '', '/favorites?demo=1'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await visible(text(p, 'Orion Nebula'));
});

await flow('real first run: onboarding to the sky, and it survives a reload', async (p) => {
  await open(p, '', false);
  await visible(id(p, 'get-started'));
  await id(p, 'get-started').click();
  await visible(id(p, 'choose-manually'));
  await id(p, 'choose-manually').click();
  await id(p, 'city-Bratislava').click();
  await visible(id(p, 'sky-more'));
  await p.waitForTimeout(600);
  await p.reload({ waitUntil: 'load' });
  await visible(id(p, 'sky-more'));
  if (await id(p, 'get-started').count()) throw new Error('onboarding came back after reload');
});

await flow('every tab opens from the sky', async (p) => {
  await open(p, 'sky');
  await visible(id(p, 'sky-more'));
  await id(p, 'sky-more').click();
  await id(p, 'tab-Tonight').click();
  await visible(text(p, 'Sunset'), 30000);
  await id(p, 'tab-Explore').click();
  await visible(text(p, 'The Orion Nebula'));
  await id(p, 'tab-Events').click();
  await visible(text(p, 'Upcoming'));
  await id(p, 'tab-More').click();
  await visible(text(p, 'SkyLens Pro'));
});

await flow('Calendar asks for Pro instead of faking access', async (p) => {
  await open(p, 'events');
  await visible(id(p, 'events-calendar'));
  await id(p, 'events-calendar').click();
  await visible(text(p, 'Unlock the complete'));
});

await flow('the paywall is honest when no products load', async (p) => {
  await open(p, 'pro');
  await visible(text(p, "Subscriptions aren't available right now"));
  if (await id(p, 'unlock-pro').isEnabled()) throw new Error('Unlock Pro should be disabled without a product');
  await visible(text(p, 'Restore Purchases'));
});

await flow('Explore segments switch to real lists', async (p) => {
  await open(p, 'explore');
  await visible(id(p, 'featured-orion'));
  await p.getByRole('tab', { name: 'Solar System' }).click();
  await visible(id(p, 'solar-jupiter'));
  await p.getByRole('tab', { name: 'Deep Sky' }).click();
  await visible(text(p, 'All Messier objects'));
});

await browser.close();
for (const r of results) console.log(r.join('  '));
process.exit(results.some((r) => r[0] === 'FAIL') ? 1 : 0);
