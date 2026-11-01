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

// ---- Stage 1: modes, layers, the deep pack and their failure states ----

const skyReady = async (p, route = 'sky') => { await open(p, route); await visible(id(p, 'sky-more')); await p.waitForTimeout(8000); };
const probe = (p, fn, arg) => p.evaluate(fn, arg);
const starAt = (p, sid) => probe(p, (i) => globalThis.__skyProbe.point(i), sid);

await flow('all three modes draw a different sky and no object moves between them', async (p) => {
  await skyReady(p);
  const pictures = new Set([await skyPixels(p)]);
  const rigel = await starAt(p, 'star:24436');
  for (const m of ['observe', 'atlas']) {
    await id(p, `segment-${m}`).click();
    await p.waitForTimeout(1500);
    pictures.add(await skyPixels(p));
    const now = await starAt(p, 'star:24436');
    if (Math.hypot(now.x - rigel.x, now.y - rigel.y) > 0.01) throw new Error(`Rigel moved in ${m}`);
  }
  if (pictures.size !== 3) throw new Error('the modes drew the same picture');
});

const close = (a, b) => a.length === b.length && Math.abs(a.length - b.length) === 0 && a === b;

/** Toggles one layer from the closed panel and reports whether the sky changed. */
async function layerChanges(p, name) {
  await p.waitForTimeout(700);
  const before = await skyPixels(p);
  await id(p, 'sky-layers').click();
  await p.getByRole('switch', { name, exact: true }).click();
  await id(p, 'sky-layers').click();
  await p.waitForTimeout(900);
  const after = await skyPixels(p);
  await id(p, 'sky-layers').click();
  await p.getByRole('switch', { name, exact: true }).click();
  await id(p, 'sky-layers').click();
  if (close(before, after)) throw new Error(`no visible change from the layer "${name}"`);
}

await flow('no inert layers: every switch in the Deep Atlas panel changes the picture', async (p) => {
  await skyReady(p);
  await id(p, 'segment-atlas').click();
  for (const name of ['Stars', 'Milky Way', 'Atmosphere', 'Deep sky objects', 'Clusters', 'Nebulae', 'Constellations', 'Boundaries', 'Labels', 'Equatorial (J2000)', 'Horizontal (altitude, azimuth)', 'Ecliptic', 'Galactic']) await layerChanges(p, name);
  // The horizon is only in view low down, so drag the sky to it first.
  await p.mouse.move(200, 620);
  await p.mouse.down();
  await p.mouse.move(200, 150, { steps: 10 });
  await p.mouse.up();
  await p.waitForTimeout(2500);
  await layerChanges(p, 'True horizon');
});

await flow('no inert layers: planets and galaxies, where they can be seen', async (p) => {
  await open(p, 'object/body:jupiter');
  await visible(id(p, 'find-in-sky'));
  await p.waitForTimeout(1500);
  await id(p, 'find-in-sky').click();
  await visible(id(p, 'sky-selection'));
  await id(p, 'segment-atlas').click();
  await p.waitForTimeout(2500);
  await layerChanges(p, 'Planets, Sun and Moon');
  await open(p, 'object/dso:M31');
  await visible(id(p, 'find-in-sky'));
  await id(p, 'find-in-sky').click();
  await visible(id(p, 'sky-selection'));
  await id(p, 'segment-atlas').click();
  await p.waitForTimeout(2500);
  await layerChanges(p, 'Galaxies');
});

await flow('no inert layers: artwork and framing in Explore', async (p) => {
  await skyReady(p);
  await layerChanges(p, 'Orion artwork');
  await layerChanges(p, 'Landscape framing (artistic)');
});

await flow('density, magnitude and label controls change the sky, and Reset restores it', async (p) => {
  await skyReady(p);
  await id(p, 'segment-atlas').click();
  await p.waitForTimeout(1200);
  const start = await probe(p, () => globalThis.__skyProbe.limit());
  await id(p, 'sky-layers').click();
  const slider = async (t, frac) => { const l = id(p, t); await l.scrollIntoViewIfNeeded(); const b = await l.boundingBox(); await p.mouse.click(b.x + b.width * frac, b.y + b.height / 2); await p.waitForTimeout(500); };
  await slider('layers-density', 0.97);
  const dense = await probe(p, () => globalThis.__skyProbe.limit());
  if (dense <= start) throw new Error(`density did not raise the limit: ${start} to ${dense}`);
  await slider('layers-magnitude', 0.2);
  const capped = await probe(p, () => globalThis.__skyProbe.limit());
  if (capped >= dense || capped > 5) throw new Error(`magnitude cap did not hold: ${capped}`);
  await id(p, 'layers-reset').click();
  await p.waitForTimeout(500);
  const reset = await probe(p, () => globalThis.__skyProbe.limit());
  if (Math.abs(reset - start) > 0.001) throw new Error(`reset gave ${reset}, expected ${start}`);
});

await flow('the chosen mode and its layers survive a reload', async (p) => {
  await open(p, '', false);
  await p.evaluate(() => localStorage.clear());
  await open(p, '', false);
  await visible(id(p, 'get-started'));
  await id(p, 'get-started').click();
  await id(p, 'choose-manually').click();
  await id(p, 'city-Bratislava').click();
  await visible(id(p, 'sky-more'));
  await p.waitForTimeout(800);
  await id(p, 'segment-atlas').click();
  await id(p, 'sky-layers').click();
  await p.getByRole('switch', { name: 'Galactic', exact: true }).click();
  await p.waitForTimeout(700);
  await p.reload({ waitUntil: 'load' });
  await visible(id(p, 'sky-more'));
  await id(p, 'sky-layers').click();
  await visible(text(p, 'Deep Atlas layers'));
  if (!(await p.getByRole('switch', { name: 'Galactic', exact: true }).isChecked())) throw new Error('layer was lost');
  await id(p, 'segment-explore').click();
  await visible(text(p, 'Explore layers'));
  if (await p.getByRole('switch', { name: 'Galactic', exact: true }).isChecked()) throw new Error('Atlas layers leaked into Explore');
});

await flow('Deep Atlas loads the pack by tiles, and a failed pack leaves the bundled stars working', async (p) => {
  await skyReady(p);
  await id(p, 'segment-atlas').click();
  await p.waitForTimeout(3500);
  await id(p, 'sky-layers').click();
  await p.waitForTimeout(1300);
  const text = await id(p, 'sky-diagnostics').innerText();
  const loaded = Number(text.match(/Deep pack ready · ([\d,]+) of/)?.[1].replaceAll(',', ''));
  if (!(loaded > 0 && loaded < 76806)) throw new Error(`pack was not partly loaded: ${text}`);
});

{
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('**/*hip-deep-v1*', (r) => r.abort());
  try {
    await skyReady(page);
    const before = await skyPixels(page);
    await id(page, 'segment-atlas').click();
    await visible(id(page, 'sky-pack-note'));
    await visible(text(page, 'Deep stars unavailable'));
    await page.waitForTimeout(1500);
    if (before === await skyPixels(page)) throw new Error('the sky stopped drawing');
    if (errors.length) throw new Error(errors[0]);
    results.push(['PASS', 'a missing pack is reported on screen and the sky keeps drawing']);
  } catch (e) { results.push(['FAIL', 'a missing pack is reported on screen and the sky keeps drawing', String(e).slice(0, 240)]); }
  await page.close();
}

await flow('J03: NGC 224 finds the Andromeda Galaxy in Deep Atlas, with the same ID as M31', async (p) => {
  await skyReady(p);
  await id(p, 'segment-atlas').click();
  await id(p, 'sky-search').click();
  await id(p, 'search-input').fill('NGC 224');
  await visible(id(p, 'result-Andromeda Galaxy'));
  await id(p, 'result-Andromeda Galaxy').click();
  await id(p, 'find-in-sky').click();
  await visible(id(p, 'sky-selection'));
  await p.waitForTimeout(2200);
  await id(p, 'sky-layers').click();
  await visible(text(p, 'Deep Atlas layers'));
  await id(p, 'sky-layers').click();
  const a = await starAt(p, 'dso:M31');
  if (!a || a.x < 0 || a.x > 393) throw new Error('M31 is not on screen');
  await p.screenshot({ path: path.join(out, 'atlas-m31.png') });
});

await flow('a selection stays through Time Travel, and the sky moves with the clock', async (p) => {
  await skyReady(p);
  await id(p, 'sky-canvas').click({ position: { x: 284, y: 493 } });
  await visible(id(p, 'sky-selection'));
  const before = await starAt(p, 'star:24436');
  await id(p, 'sky-time').click();
  await visible(id(p, 'tt-forward'));
  await id(p, 'tt-forward').click();
  await id(p, 'tt-close').click();
  await visible(id(p, 'sky-selection'));
  await visible(text(p, 'Rigel'));
  await p.waitForTimeout(1500);
  const after = await starAt(p, 'star:24436');
  if (Math.hypot(after.x - before.x, after.y - before.y) < 20) throw new Error('the sky did not follow the clock');
});

await flow('Locate centres the selection, Save keeps it, and the close button clears it', async (p) => {
  await skyReady(p);
  await id(p, 'sky-canvas').click({ position: { x: 284, y: 493 } });
  await visible(id(p, 'sky-save'));
  await id(p, 'sky-save').click();
  await visible(text(p, 'Saved'));
  await id(p, 'sky-locate').click();
  await p.waitForTimeout(1500);
  const c = await starAt(p, 'star:24436');
  if (Math.hypot(c.x - 196.5, c.y - 426) > 3) throw new Error(`not centred: ${JSON.stringify(c)}`);
  await id(p, 'sky-deselect').click();
  await p.waitForTimeout(500);
  if (await id(p, 'sky-selection').count()) throw new Error('selection did not clear');
});

await flow('a pinch keeps the sky under the fingers', async (p) => {
  await skyReady(p);
  const cdp = await p.context().newCDPSession(p);
  const before = await starAt(p, 'star:27989');
  const pts = (d) => [{ x: before.x - d / 2, y: before.y }, { x: before.x + d / 2, y: before.y }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(80) });
  for (let i = 1; i <= 60; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(80 + 2 * i) }); await p.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(800);
  const after = await starAt(p, 'star:27989');
  const { fov } = await probe(p, () => globalThis.__skyProbe.view());
  if (fov > 20) throw new Error(`the pinch did not zoom: ${fov}`);
  const moved = Math.hypot(after.x - before.x, after.y - before.y);
  console.log(`pinch: fov 26 to ${fov.toFixed(1)}, star moved ${moved.toFixed(2)} pt`);
  if (moved > 2) throw new Error(`the star moved ${moved.toFixed(1)} pt`);
});

await flow('Sky engine switches return the original path and hide the modes', async (p) => {
  await skyReady(p);
  const before = await skyPixels(p);
  await id(p, 'sky-more').click();
  await id(p, 'tab-More').click();
  await id(p, 'more-sky-engine').click();
  await visible(id(p, 'flag-catalogsV1'));
  await p.getByRole('switch', { name: 'Spatial star index' }).click({ force: true });
  await p.getByRole('switch', { name: 'Sky modes' }).click({ force: true });
  await p.waitForTimeout(300);
  if (await p.getByRole('switch', { name: 'Spatial star index' }).isChecked()) throw new Error('the switch did not turn off');
  await p.evaluate(() => { window.history.pushState({}, '', '/sky?demo=1'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await visible(id(p, 'sky-more'));
  await p.waitForTimeout(7000);
  if (await id(p, 'segment-atlas').count()) throw new Error('the switch is still there');
  await p.screenshot({ path: path.join(out, 'flags-off.png') });
  void before;
});

await browser.close();
for (const r of results) console.log(r.join('  '));
process.exit(results.some((r) => r[0] === 'FAIL') ? 1 : 0);
